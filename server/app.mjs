import { createServer } from 'node:http';
import { randomBytes,createHash,timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.mjs';
import { createCollector } from './apify-collector.mjs';
import { boardEligible } from './job-policy.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
export function createApp({dataPath,password,secure=true,fetcher=fetch,apifyToken='',root=process.cwd()}){
  if(!password||password.length<16)throw Error('Set TRACKER_PASSWORD to a unique password of at least 16 characters in Railway Variables.');
  const initial=JSON.parse(readFileSync(resolve(root,'server/default-state.json'),'utf8'));
  const seed=JSON.parse(readFileSync(resolve(root,'docs/jobs.json'),'utf8'));
  const store=openStore(dataPath,initial,seed),passwordVersion=hash(password),attempts=new Map();
  const collector=createCollector({store,token:apifyToken,root,fetcher});
  const combinedFeed=()=>collector.combine(store.getFeed());
  function workspace(){const s=store.read(combinedFeed());const sources=collector.sources();s.jobs=s.jobs.map(j=>({...j,discoveryEligible:boardEligible(j,sources)}));return {...s,collector:collector.status(),feedError};}
  const frontend=readFileSync(resolve(root,'frontend/index.html'),'utf8'),login=readFileSync(resolve(root,'frontend/login.html'),'utf8');
  let feedError='',refreshing;
  async function refreshFeed(){if(refreshing)return refreshing;refreshing=(async()=>{try{const r=await fetcher('https://raw.githubusercontent.com/imabimanyurs/career-atlas/main/docs/jobs.json',{signal:AbortSignal.timeout(15000),headers:{'accept':'application/json'}});if(!r.ok)throw Error('Feed HTTP '+r.status);const text=await r.text();if(text.length>8000000)throw Error('Feed too large');store.setFeed(JSON.parse(text));feedError='';return true;}catch{feedError='Job feed refresh failed. Previously saved openings remain available.';return false;}finally{refreshing=null}})();return refreshing;}
  function authenticated(req){const token=(req.headers.cookie||'').match(/(?:^|; )atlas_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return false;return !!store.db.prepare('SELECT hash FROM sessions WHERE hash=? AND expires>? AND password_version=?').get(hash(token),Date.now(),passwordVersion);}
  const cookie=token=>'atlas_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+(secure?'; Secure':'');
  async function body(req){let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>8000000)throw Object.assign(Error('Request too large'),{status:413});parts.push(chunk)}try{return JSON.parse(Buffer.concat(parts).toString())}catch{throw Object.assign(Error('Invalid JSON'),{status:400})}}
  async function handle(req,res){
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send=(v,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(v))};
    const html=(text)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(text)};
    const redirect=path=>{res.writeHead(302,{Location:path});res.end()};
    try{const p=new URL(req.url,'http://local').pathname;
      if(p==='/healthz')return send({ok:true});
      if(!['GET','HEAD'].includes(req.method)){
        const origin=req.headers.origin;let good=false;try{good=!!origin&&new URL(origin).host===req.headers.host}catch{}
        if(!good)return send({error:'Same-origin request required'},403);
        if(!String(req.headers['content-type']||'').startsWith('application/json'))return send({error:'JSON required'},415);
      }
      if(p==='/api/login'&&req.method==='POST'){
        const key=req.socket.remoteAddress||'unknown',now=Date.now();let rate=attempts.get(key);if(!rate||now-rate.start>900000){rate={start:now,count:0};attempts.set(key,rate)}
        if(rate.count>=30)return send({error:'Too many login attempts. Try again in 15 minutes.'},429);rate.count++;
        const input=await body(req);if(typeof input.password!=='string'||!equal(input.password,password))return send({error:'Incorrect password'},401);
        const token=randomBytes(32).toString('hex');store.db.prepare('DELETE FROM sessions WHERE expires<?').run(now);store.db.prepare('INSERT INTO sessions(hash,expires,password_version) VALUES(?,?,?)').run(hash(token),now+604800000,passwordVersion);res.setHeader('Set-Cookie',cookie(token));return send({ok:true});
      }
      if(p==='/login'&&req.method==='GET')return authenticated(req)?redirect('/'):html(login);
      if(!authenticated(req))return p.startsWith('/api/')?send({error:'Sign in required'},401):redirect('/login');
      if(p==='/api/logout'&&req.method==='POST'){const token=(req.headers.cookie||'').match(/atlas_session=([a-f0-9]{64})/)?.[1];if(token)store.db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(token));res.setHeader('Set-Cookie','atlas_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(secure?'; Secure':''));return send({ok:true})}
      if(p==='/api/state'&&req.method==='GET')return send(workspace());
      if(p==='/api/state'&&req.method==='PUT'){const s=await body(req);const result=store.save(s,s.revision,combinedFeed());return send(result,result.status||200)}
      if(p==='/api/collector'&&req.method==='GET')return send(collector.status());
      if(p==='/api/collector/run'&&req.method==='POST'){await body(req);return send(await collector.tick({force:true}))}
      if(p==='/api/feed'&&req.method==='GET')return send(combinedFeed());
      if(p==='/api/feed/refresh'&&req.method==='POST'){await body(req);const ok=await refreshFeed();return send({ok,error:feedError},ok?200:502)}
      if(p==='/'&&req.method==='GET')return html(frontend);
      return send({error:'Not found'},404);
    }catch(e){send({error:e.status?e.message:'Request failed'},e.status||500)}
  }
  return {handle,store,refreshFeed,collector,close(){store.close()}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.env.RAILWAY_PROJECT_ID&&!process.env.RAILWAY_VOLUME_MOUNT_PATH)throw Error('Attach a Railway volume mounted at /data before starting.');
  const dir=process.env.RAILWAY_VOLUME_MOUNT_PATH||process.env.DATA_DIR||'./data';
  const app=createApp({dataPath:resolve(dir,'career-atlas.sqlite'),password:process.env.TRACKER_PASSWORD,secure:process.env.NODE_ENV==='production',apifyToken:process.env.APIFY_TOKEN});
  const server=createServer(app.handle);server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Career Atlas listening'));
  const startup=app.collector.status();console.log('APIFY_COLLECTOR '+JSON.stringify({configured:startup.configured,phase:startup.phase,lastStartedAt:startup.lastStartedAt,lastError:startup.lastError}));
  app.refreshFeed();app.collector.tick();const timer=setInterval(()=>app.refreshFeed(),600000);timer.unref();const crawlerTimer=setInterval(()=>app.collector.tick(),60000);crawlerTimer.unref();
  process.on('SIGTERM',()=>{clearInterval(timer);clearInterval(crawlerTimer);server.close(()=>{app.close();process.exit(0)})});
}
