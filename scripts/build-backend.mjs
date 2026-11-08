import fs from 'node:fs/promises';
let html=await fs.readFile('docs/index.html','utf8');
const initial=JSON.parse(html.match(/const DEFAULT_STATE=(.*);\n/)[1]);
await fs.mkdir('frontend',{recursive:true});await fs.mkdir('server',{recursive:true});
await fs.writeFile('server/default-state.json',JSON.stringify(initial,null,2));
const start=html.indexOf('async function loadWorkspace()'),end=html.indexOf("let S,view=",start);
html=html.slice(0,start)+`let saveQueue=Promise.resolve(),pendingSaves=0;
async function loadWorkspace(){const r=await fetch('/api/state',{cache:'no-store'});if(r.status===401){location.href='/login';throw Error('Sign in required')}if(!r.ok)throw Error('Could not load workspace');return r.json()}
function saveWorkspace(s){pendingSaves++;const task=saveQueue.then(async()=>{const r=await fetch('/api/state',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(s)});const result=await r.json();if(r.status===401){location.href='/login';throw Error('Sign in required')}if(!r.ok)throw Error(result.error||'Save failed');s.revision=result.revision;return {ok:true}}).finally(()=>pendingSaves--);saveQueue=task.catch(()=>{});return task}
async function refreshJobs(){try{const r=await fetch('/api/feed/refresh',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(!r.ok)throw Error();S=await loadWorkspace();render();toast('Job feed refreshed')}catch{toast('Could not refresh feed. Previously saved jobs remain available.')}}
async function logout(){await fetch('/api/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});location.href='/login'}
`+html.slice(end);
html=html.replace('◈ Personal tracker · browser saved','◈ Private · synced to server <button onclick="logout()">Sign out</button>');
html=html.replace('Application statuses and referral notes remain in this browser.','Application statuses and referral notes are saved privately on the server.');
html=html.replace('Statuses, contacts and notes are saved only in this browser. Export a backup before switching devices or clearing browser data. Daily public job-feed updates preserve your saved application fields.','Your workspace is saved privately on the server and available after signing in on another device. Daily job-feed updates preserve application statuses, contacts and notes. To migrate from GitHub Pages, export its JSON backup and import it here.');
html=html.replace("catch{toast('Save failed. Keep this page open and retry.')} ","catch(e){toast(e.message||'Save failed. Export a backup before reloading.')} ");
html=html.replace("catch{toast('Save failed. Keep this page open and retry.')}","catch(e){toast(e.message||'Save failed. Export a backup before reloading.')}");
html=html.replace("if(confirm('Replace your workspace with this backup?')){S=d;save()}","if(confirm('Replace your workspace with this backup?')){d.revision=S.revision;S=d;save()}");
html=html.replace("<h2>Search history</h2>",'<h2>Search history</h2><button onclick="refreshJobs()">Refresh job feed</button>');
html=html.replace("async function logout()",`async function runCollector(){try{const r=await fetch('/api/collector/run',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(!r.ok)throw Error();S=await loadWorkspace();render();toast('Collector status updated; one run per day maximum.')}catch{toast('Could not start collector')}}
async function logout()`);
html=html.replace("function jobList(){const list=S.jobs.filter(j=>","function jobList(){const list=S.jobs.filter(j=>(view!=='Job board'||j.discoveryEligible===true)&&");
html=html.replace("(view!=='Applications'||j.status!=='Saved')&&","");
html=html.replace("+select('age',['New: last 7 days','Older','Unknown date'],'All posting dates')","+tag('Posted within 7 days')");
html=html.replace("['Official career page','Third-party listing'],'All sources'","['Official career page'],'Direct career pages'");
html=html.replace("S.jobs.filter(current).length","S.jobs.filter(j=>j.discoveryEligible).length");
html=html.replace("if(view==='Search activity')h+=","if(view==='Search activity')h+=collectorPanel()+");
html=html.replace("function select(k,opts,label)",`function collectorPanel(){const c=S.collector||{};return '<section class="panel"><h2>Apify direct-career collector</h2><p>Connection: '+(c.configured?'Token configured':'Token missing')+' · Status: '+esc(c.phase||'idle')+'</p><p>'+esc((c.configuredCompanies||[]).length)+' of 403 company sources configured; '+esc((c.configuredGovernmentSources||[]).length)+' government sources. HTML-only crawl: dynamic pages and PDF notices may require manual research.</p><p>Daily at 08:00 IST · maximum 150 pages · up to $0.50/run · one run/day. Only explicit posting dates within seven days enter the board.</p><p class="muted">Last started: '+esc(c.lastStartedAt||'Not yet')+' · Last completed: '+esc(c.lastCompletedAt||'Not yet')+'</p>'+(c.lastError?'<div class="banner">'+esc(c.lastError)+'</div>':'')+'<button onclick="runCollector()">Check / start daily crawl</button><h3>Official notices needing review</h3>'+(c.noticeQueue||[]).slice(0,20).map(n=>'<div class="row"><span>'+esc(n.company)+'</span><a target="_blank" rel="noopener" href="'+safe(n.url)+'">'+esc(n.title)+'</a><span class="muted">'+esc(n.status)+'</span></div>').join('')+'</section>'}
function select(k,opts,label)`);
html=html.replace('A role is current only after an official vacancy check.','Board listings must be verified on a company-owned career page and explicitly posted within seven days.');
const intervalStart=html.indexOf('setInterval(async()=>');html=html.slice(0,intervalStart)+`setInterval(async()=>{if(S&&!pendingSaves&&!document.querySelector('dialog[open]')&&view!=='Settings'){try{S=await loadWorkspace();render()}catch{toast('Sync unavailable. Your saved server data remains intact.')}}},300000);</script></body></html>`;
await fs.writeFile('frontend/index.html',html);
console.log('Built private backend frontend');
