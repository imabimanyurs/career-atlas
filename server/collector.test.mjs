import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fresh,officialUrl,normalizePosting,boardEligible } from './job-policy.mjs';
import { openStore } from './store.mjs';
import { createCollector } from './apify-collector.mjs';
const now=Date.parse('2026-11-08T12:00:00Z'),source={company:'Example',url:'https://careers.example.com/jobs',hosts:['careers.example.com'],kind:'company'};
const raw={title:'Java Full-stack Software Engineer',identifier:{value:'12345'},datePosted:'2026-11-07',url:'https://careers.example.com/jobs/12345',description:'3+ years of development experience. Java, Spring Boot and React. We provide visa sponsorship.',jobLocation:{address:{addressLocality:'Berlin',addressCountry:'DE'}}};
test('strict own-domain, explicit fresh date, exact ID and closed-role rules',()=>{
assert(fresh('2026-11-07',now));for(const d of ['',null,'2026-10-28','2026-11-09','last week'])assert(!fresh(d,now));
assert(officialUrl(raw.url,[source]));assert(!officialUrl('https://careers.example.com.evil.test/jobs',[source]));assert(!officialUrl('https://foo.myworkdayjobs.com/jobs',[{hosts:['foo.myworkdayjobs.com']}]));assert(!officialUrl('https://jobs.ashbyhq.com/example',[{hosts:['jobs.ashbyhq.com']}]));
const result=normalizePosting(raw,{url:raw.url},source,now);assert.equal(result.job.country,'Germany');assert.equal(result.job.sponsorship,'Confirmed');assert(boardEligible(result.job,[source],now));assert.equal(normalizePosting({...raw,datePosted:''},{url:raw.url},source,now).reason,'missing_posted_date');assert.equal(normalizePosting(raw,{url:raw.url,closed:true},source,now).reason,'closed');assert.equal(normalizePosting({...raw,url:'https://jobs.ashbyhq.com/example'},{url:raw.url},source,now).reason,'non_official_url');
assert.equal(normalizePosting({...raw,description:'We do not provide visa sponsorship.'},{url:raw.url},source,now).job.sponsorship,'Not offered');
assert(!boardEligible({...result.job,company:'Impostor'},[source],now));
});
test('bounded async Apify run, durable resume, ingestion, daily dedup and private status preservation',async()=>{
const dir=mkdtempSync(join(tmpdir(),'atlas-collector-'));let store;try{
const initial={jobs:[{id:'Example::12345',company:'Example',role:'Old title',status:'Interview',contact:'private test referral',notes:'private test note'}],companies:[],prep:[],settings:{countries:'Germany',workflow:''}};
const path=join(dir,'state.sqlite');store=openStore(path,initial,{jobs:[],runs:[]});let starts=0;const calls=[];
const fetcher=async(url,options={})=>{calls.push({url,options});let data;
if(url.includes('raw.githubusercontent.com'))data={sources:[source]};else if(url.endsWith('/users/me'))data={data:{id:'test-user'}};else if(url.includes('/acts/')){starts++;assert(url.includes('maxTotalChargeUsd=0.5'));assert(url.includes('timeout=300'));const input=JSON.parse(options.body);assert.equal(input.maxPagesPerCrawl,150);assert(!options.body.includes('test-apify-token'));data={data:{id:'test-run',defaultDatasetId:'test-dataset',status:'RUNNING'}}}else if(url.includes('/actor-runs/'))data={data:{status:'SUCCEEDED',defaultDatasetId:'test-dataset'}};else if(url.includes('/datasets/'))data=[{company:'Example',sourceUrl:source.url,url:raw.url,status:'fetched',jobPostings:[raw,{...raw,datePosted:'2020-01-01'}]}];else throw Error('Unexpected URL');return {ok:true,text:async()=>JSON.stringify(data)};};
let collector=createCollector({store,token:'test-apify-token',root:process.cwd(),fetcher,now:()=>now});await collector.tick();assert.equal(starts,1);assert.equal(collector.status().activeRunId,'test-run');store.close();store=openStore(path,initial,{jobs:[],runs:[]});collector=createCollector({store,token:'test-apify-token',root:process.cwd(),fetcher,now:()=>now});await collector.tick();assert.equal(collector.status().phase,'SUCCEEDED');assert.equal(collector.status().activeRunId,null);const combined=collector.combine(store.getFeed());assert.equal(combined.jobs.length,1);assert.equal(combined.runs[0].checkedCount,1);assert.equal(combined.runs[0].rejected.older_or_invalid_date,1);const workspace=store.read(combined);assert.equal(workspace.jobs[0].status,'Interview');assert.equal(workspace.jobs[0].contact,'private test referral');await collector.tick({force:true});assert.equal(starts,1);assert(!JSON.stringify(collector.status()).includes('test-apify-token'));
}finally{store?.close();rmSync(dir,{recursive:true,force:true})}
});
