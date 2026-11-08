import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import vm from 'node:vm';
import { createApp } from './app.mjs';
const password='test-password-not-for-deployment';
function request(app,path,{method='GET',data,cookie,origin='https://atlas.test'}={}){const req=Readable.from(data===undefined?[]:[Buffer.from(JSON.stringify(data))]);Object.assign(req,{url:path,method,headers:{host:'atlas.test',origin,'content-type':'application/json',cookie},socket:{remoteAddress:'test'}});const headers={};let status=200,body='';const res={setHeader(k,v){headers[k.toLowerCase()]=v},writeHead(s,h={}){status=s;for(const [k,v] of Object.entries(h))headers[k.toLowerCase()]=v},end(v=''){body+=v}};return app.handle(req,res).then(()=>({status,headers,body,json(){return JSON.parse(body)}}))}
test('private workspace, sessions, persistence, conflicts and independent job feed',async()=>{
const dir=mkdtempSync(join(tmpdir(),'career-atlas-'));let app;try{
 const dataPath=join(dir,'tracker.sqlite');let feed={jobs:[],runs:[],updatedAt:new Date().toISOString()};const fetcher=async()=>({ok:true,text:async()=>JSON.stringify(feed)});
 app=createApp({dataPath,password,fetcher});
 assert.equal((await request(app,'/api/state')).status,401);
 assert.equal((await request(app,'/')).headers.location,'/login');
 assert.equal((await request(app,'/api/login',{method:'POST',data:{password},origin:'https://evil.test'})).status,403);
 assert.equal((await request(app,'/api/login',{method:'POST',data:{password:'wrong'}})).status,401);
 const login=await request(app,'/api/login',{method:'POST',data:{password}});assert.equal(login.status,200);assert(login.headers['set-cookie'].includes('Secure'));assert(login.headers['set-cookie'].includes('HttpOnly'));const cookie=login.headers['set-cookie'].split(';')[0];
 const state=(await request(app,'/api/state',{cookie})).json();assert.equal(state.companies.length,403);
 state.jobs.push({id:'Example::1',company:'Example',role:'Java developer',status:'Interview',contact:'private referral',notes:'private note',gaps:'personal gap',applicationDate:'2026-11-08',interviewStage:'Technical'});
 const saved=await request(app,'/api/state',{method:'PUT',cookie,data:state});assert.equal(saved.status,200);assert.equal(saved.json().revision,1);
 assert.equal((await request(app,'/api/state',{method:'PUT',cookie,data:state})).status,409);
 feed={jobs:[{id:'Example::1',company:'Example',role:'Updated Java role',status:'Saved',contact:'overwrite',verification:'Verified current',sponsorship:'Confirmed'}],runs:[{checkedCount:1}],updatedAt:new Date().toISOString()};await app.refreshFeed();
 const synced=(await request(app,'/api/state',{cookie})).json();const syncedJob=synced.jobs.find(j=>j.id==='Example::1');const original=state.jobs.find(j=>j.id==='Example::1');assert.equal(syncedJob.role,'Updated Java role');for(const k of ['status','contact','notes','gaps','applicationDate','interviewStage'])assert.equal(syncedJob[k],original[k]);assert.equal(syncedJob.verification,'Unverified');assert.equal(syncedJob.sponsorship,'Uncertain');
 app.close();app=createApp({dataPath,password,fetcher});assert.equal((await request(app,'/api/state',{cookie})).json().jobs.find(j=>j.id==='Example::1').status,'Interview');
 const logout=await request(app,'/api/logout',{method:'POST',cookie,data:{}});assert.equal(logout.status,200);assert.equal((await request(app,'/api/state',{cookie})).status,401);
 }finally{app?.close();rmSync(dir,{recursive:true,force:true})}
});
test('frontend uses backend, imports keep revision and JavaScript parses',()=>{for(const file of ['frontend/index.html','frontend/login.html']){const html=readFileSync(file,'utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);if(file.endsWith('index.html')){assert(html.includes("fetch('/api/state'"));assert(html.includes('d.revision=S.revision'));assert(!html.includes("localStorage.setItem("));}}});
