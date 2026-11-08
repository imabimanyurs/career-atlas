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
const intervalStart=html.indexOf('setInterval(async()=>');html=html.slice(0,intervalStart)+`setInterval(async()=>{if(S&&!pendingSaves&&!document.querySelector('dialog[open]')&&view!=='Settings'){try{S=await loadWorkspace();render()}catch{toast('Sync unavailable. Your saved server data remains intact.')}}},300000);</script></body></html>`;
await fs.writeFile('frontend/index.html',html);
console.log('Built private backend frontend');
