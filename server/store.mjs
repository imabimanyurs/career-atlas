import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const researchFields=['company','country','role','salary','location','experience','skills','authorisation','jobId','officialUrl','listingUrl','postedAt','verifiedAt','evidence','sponsorshipEvidence','sponsorshipUrl','sponsorship','source','verification','fit'];
export function mergeFeed(state,feed){
  const jobs=new Map(state.jobs.map(j=>[j.id,j]));
  for(const raw of feed.jobs||[]){if(!raw.id||!raw.company||!raw.role)continue;const j={...raw};
    if(j.verification==='Verified current'&&(!j.officialUrl||!j.jobId||!j.evidence||!Number.isFinite(Date.parse(j.verifiedAt))))j.verification='Unverified';
    if(j.sponsorship==='Confirmed'&&(!j.sponsorshipEvidence||!j.sponsorshipUrl))j.sponsorship='Uncertain';
    if(jobs.has(j.id)){const old=jobs.get(j.id);for(const k of researchFields)if(k in j)old[k]=j[k];}
    else{const next={id:j.id,status:'Saved',contact:'',notes:'',applicationDate:'',interviewStage:'',gaps:j.gaps||''};for(const k of researchFields)if(k in j)next[k]=j[k];jobs.set(j.id,next);}
  }
  return {...state,jobs:[...jobs.values()],runs:(feed.runs||[]).slice(0,100),feedCheckedAt:feed.updatedAt||null};
}
export function validState(s){return s&&Array.isArray(s.jobs)&&s.jobs.length<=20000&&s.jobs.every(j=>j&&typeof j.id==='string'&&typeof j.company==='string'&&typeof j.role==='string')&&new Set(s.jobs.map(j=>j.id)).size===s.jobs.length&&Array.isArray(s.companies)&&s.companies.length<=5000&&Array.isArray(s.prep)&&s.prep.length<=1000&&s.settings&&typeof s.settings.countries==='string'&&typeof s.settings.workflow==='string';}
export function openStore(path,initial,seedFeed){
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
  const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS feed (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL, password_version TEXT NOT NULL);');
  db.prepare('INSERT OR IGNORE INTO workspace(id,body,revision) VALUES(1,?,0)').run(JSON.stringify(initial));
  db.prepare('INSERT OR IGNORE INTO feed(id,body) VALUES(1,?)').run(JSON.stringify(seedFeed));
  const getFeed=()=>JSON.parse(db.prepare('SELECT body FROM feed WHERE id=1').get().body);
  return {db,getFeed,setFeed(feed){if(!Array.isArray(feed.jobs)||!Array.isArray(feed.runs))throw Error('Invalid feed');db.prepare('UPDATE feed SET body=? WHERE id=1').run(JSON.stringify(feed));},
    read(){const row=db.prepare('SELECT body,revision FROM workspace WHERE id=1').get();return {...mergeFeed(JSON.parse(row.body),getFeed()),revision:row.revision};},
    save(s,revision){if(!validState(s))return {error:'Invalid workspace',status:400};if(!Number.isInteger(revision))return {error:'Missing revision',status:409};const merged=mergeFeed(s,getFeed());delete merged.revision;const result=db.prepare('UPDATE workspace SET body=?,revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(merged),revision);return result.changes?{ok:true,revision:revision+1}:{error:'Another device saved changes. Export your edits, then reload before retrying.',status:409};},
    close(){db.close();}
  };
}
