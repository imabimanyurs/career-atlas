import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { officialUrl,normalizePosting } from './job-policy.mjs';
const TERMINAL=new Set(['SUCCEEDED','FAILED','TIMED-OUT','ABORTED']);
const dayParts=now=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {day:p.year+'-'+p.month+'-'+p.day,hour:Number(p.hour)}};
export function createCollector({store,token,root,fetcher=fetch,now=()=>Date.now()}){
 const seed=JSON.parse(readFileSync(resolve(root,'collector-sources.json'),'utf8'));
 const pageFunction=readFileSync(resolve(root,'server/apify-page-function.js'),'utf8');
 store.db.exec('CREATE TABLE IF NOT EXISTS collector_state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)');
 store.db.prepare('INSERT OR IGNORE INTO collector_state(id,body) VALUES(1,?)').run(JSON.stringify({sources:seed.sources,jobs:[],runs:[],notices:[],phase:'idle'}));
 const read=()=>JSON.parse(store.db.prepare('SELECT body FROM collector_state WHERE id=1').get().body);
 const write=s=>store.db.prepare('UPDATE collector_state SET body=? WHERE id=1').run(JSON.stringify(s));
 let busy=false;
 async function api(path,options={}){const r=await fetcher('https://api.apify.com/v2/'+path,{...options,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+token,'content-type':'application/json','x-apify-integration-platform':'career-atlas',...options.headers}});const text=await r.text();if(!r.ok){let message='';try{message=JSON.parse(text).error?.message||''}catch{}message=String(message).split(token).join('[redacted]').replace(/apify_api_[A-Za-z0-9_-]+/g,'[redacted]').slice(0,300);throw Error('Apify '+path.split('?')[0]+' HTTP '+r.status+(message?': '+message:''))}if(text.length>8000000)throw Error('Apify response exceeded size limit');return JSON.parse(text)}
 function sources(s){return (s.sources||[]).filter(x=>x.company&&x.url&&Array.isArray(x.hosts)&&officialUrl(x.url,[x])).slice(0,500)}
 function status(){const s=read(),list=sources(s);return {configured:!!token,phase:s.phase,lastStartedAt:s.lastStartedAt||null,lastCompletedAt:s.lastCompletedAt||null,nextDailyRun:'08:00 Asia/Kolkata',lastError:s.lastError||'',activeRunId:s.activeRunId||null,lastRunId:s.lastRunId||null,limits:{maxRunChargeUsd:0.50,maxPages:150,timeoutSeconds:300,maxRunsPerDay:1},configuredCompanies:[...new Set(list.filter(x=>x.kind==='company').map(x=>x.company))],configuredGovernmentSources:list.filter(x=>x.kind==='government').map(x=>x.company),targetCompanyCount:403,noticeQueue:s.notices||[]}}
 async function loadSources(s){try{const r=await fetcher('https://raw.githubusercontent.com/imabimanyurs/career-atlas/main/collector-sources.json',{signal:AbortSignal.timeout(15000)});if(r.ok){const text=await r.text();if(text.length<400000){const x=JSON.parse(text);if(Array.isArray(x.sources))s.sources=x.sources;}}}catch{}return sources(s)}
 async function start(s){const list=await loadSources(s);if(!list.length)throw Error('No approved direct career sources configured');
   s.phase='starting';s.lastStartedAt=new Date(now()).toISOString();s.lastAttemptDay=dayParts(now()).day;s.lastError='';write(s);
   const input={startUrls:list.map(x=>({url:x.url,userData:{company:x.company,sourceUrl:x.url,depth:0}})),pageFunction,customData:{sources:list},linkSelector:'',proxyConfiguration:{useApifyProxy:false},ignoreSslErrors:false,maxPagesPerCrawl:150,maxResultsPerCrawl:150,maxCrawlingDepth:2,maxConcurrency:3,maxRequestRetries:1,pageLoadTimeoutSecs:25,pageFunctionTimeoutSecs:30};
   const run=await api('acts/apify~cheerio-scraper/runs?timeout=300&memory=512&maxTotalChargeUsd=0.5',{method:'POST',body:JSON.stringify(input)});
   if(!run.data?.id)throw Error('Apify did not return a run ID');s.activeRunId=run.data.id;s.datasetId=run.data.defaultDatasetId;s.phase=run.data.status||'RUNNING';s.runSources=list;write(s);console.log('APIFY_COLLECTOR '+JSON.stringify({phase:s.phase,runId:s.activeRunId,sources:list.length,budgetUsd:0.50}));return status();
 }
 async function complete(s,run){const pages=s.datasetId?await api('datasets/'+encodeURIComponent(s.datasetId)+'/items?format=json&clean=true&limit=200'):[];if(!Array.isArray(pages))throw Error('Invalid Apify dataset');
   const rejected={},jobs=new Map((s.jobs||[]).map(j=>[j.id,j])),checked=new Set(),checkedGovernment=new Set(),notices=[],list=s.runSources||sources(s);let accepted=0;
   for(const page of pages){const source=list.find(x=>x.company===page.company&&x.url===page.sourceUrl);if(!source||page.status!=='fetched'||!officialUrl(page.url,[source])){rejected.unverified_page=(rejected.unverified_page||0)+1;continue}
     if(source.kind==='government')checkedGovernment.add(source.company);else checked.add(source.company);
     for(const raw of page.jobPostings||[]){try{const value=normalizePosting(raw,page,source,now());if(value.job){jobs.set(value.job.id,value.job);accepted++}else rejected[value.reason]=(rejected[value.reason]||0)+1}catch{rejected.invalid_record=(rejected.invalid_record||0)+1}}
     for(const n of page.noticeLinks||[])if(officialUrl(n.url,[source])&&n.title)notices.push({company:source.company,url:n.url,title:n.title,status:'Needs manual date and eligibility verification'});
   }
   const completeAt=new Date(now()).toISOString();const coverage={at:completeAt,type:'Apify direct career crawl',apifyRunId:s.activeRunId,status:run.status,checkedCompanies:[...checked],checkedCount:checked.size,targetCount:403,notCheckedCount:403-checked.size,configuredCompanies:[...new Set(list.filter(x=>x.kind==='company').map(x=>x.company))],governmentSourcesChecked:[...checkedGovernment],pagesReturned:pages.length,acceptedRecords:accepted,rejected,summary:'Only approved company-owned pages with JobPosting data, exact ID and explicit posting date within 7 days enter the board. HTML-only crawl; JavaScript-only sites, PDFs and pages beyond limits may need manual research.'};
   s.jobs=[...jobs.values()].slice(-10000);s.runs=[coverage,...s.runs].slice(0,50);s.notices=[...new Map([...notices,...(s.notices||[])].map(n=>[n.url,n])).values()].slice(0,200);s.lastCompletedAt=completeAt;s.lastRunId=s.activeRunId;s.phase=run.status;s.lastError=run.status==='SUCCEEDED'?'':'Apify run ended '+run.status+'; collected partial results only.';s.activeRunId=null;write(s);
   console.log('APIFY_COLLECTOR '+JSON.stringify({phase:s.phase,runId:s.lastRunId,checkedCount:checked.size,governmentChecked:checkedGovernment.size,pages:pages.length,accepted,rejected}));
 }
 async function tick({force=false}={}){if(!token)return status();if(busy)return status();busy=true;try{let s=read();if(s.activeRunId){const run=await api('actor-runs/'+encodeURIComponent(s.activeRunId));s.phase=run.data.status;s.datasetId=run.data.defaultDatasetId||s.datasetId;write(s);if(TERMINAL.has(run.data.status))await complete(s,run.data);return status();}
   const local=dayParts(now());if(s.lastAttemptDay===local.day&&s.lastStartedAt&&dayParts(Date.parse(s.lastStartedAt)).day===local.day)return status();if(force||local.hour>=8)return await start(s);return status();
 }catch(e){const s=read();s.lastError=e.message;s.phase=s.activeRunId?'retrying_results':'error';s.lastAttemptDay=dayParts(now()).day;write(s);console.log('APIFY_COLLECTOR '+JSON.stringify({phase:s.phase,error:e.message}));return status()}finally{busy=false}}
 function combine(feed){const s=read();const combined=new Map((feed.jobs||[]).map(j=>[j.id,j]));for(const j of s.jobs||[]){const old=combined.get(j.id);if(!old||Date.parse(j.verifiedAt)>=Date.parse(old.verifiedAt||0))combined.set(j.id,j)}return {jobs:[...combined.values()],runs:[...(s.runs||[]),...(feed.runs||[])].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,100),updatedAt:s.lastCompletedAt||feed.updatedAt};}
 return {tick,status,combine,sources:()=>sources(read())};
}
