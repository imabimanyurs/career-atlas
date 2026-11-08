import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import express from 'express';
import { db,updateMatch } from './repository.mjs';
import { featureModules } from './api.mjs';
const suffix=randomUUID();let user,company,app;
try{
  user=await db.user.create({data:{key:'http-smoke-'+suffix,profile:{skills:['Java'],countries:['Germany'],experienceYears:4}}});
  company=await db.company.create({data:{name:'http-smoke-'+suffix}});
  const job=await db.job.create({data:{identity:suffix,companyId:company.id,externalId:suffix,title:'Java Engineer',country:'Germany',skills:['Java'],requiredSkills:['Java'],postingUrl:'https://example.com/jobs/'+suffix,applyUrl:'https://example.com/jobs/'+suffix,contentHash:suffix,duplicateKey:suffix,lastVerifiedAt:new Date()}});
  await updateMatch(job);
  class SmokeModule{}Module({imports:featureModules})(SmokeModule);
  app=await NestFactory.create(SmokeModule,{logger:false});app.use(express.json());
  app.use((req,res,next)=>{req.ownerId=user.id;next()});
  await app.listen(0,'127.0.0.1');const base=await app.getUrl();
  const call=async(path,method='GET',body)=>{const res=await fetch(base+'/api/'+path,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,body:await res.json()}};
  const feed=await call('jobs?freshness=all&q=Java');assert.equal(feed.status,200);assert.equal(feed.body.total,1);assert.equal(feed.body.items[0].id,job.id);
  const saved=await call('applications','POST',{jobId:job.id});assert.equal(saved.status,201);
  const moved=await call('applications/'+saved.body.id,'PATCH',{status:'Interview',version:0,notes:'synthetic fixture'});assert.equal(moved.status,200);assert.equal(moved.body.version,1);
  assert.equal((await call('applications/'+saved.body.id,'PATCH',{status:'Rejected',version:0})).status,409);
  for(const path of ['jobs/'+job.id,'applications','dashboard','profile','prep','companies?q=http-smoke','sources','notices','alerts','export'])assert.equal((await call(path)).status,200,path);
  assert.equal((await call('referrals','POST',{companyId:company.id,name:'Synthetic contact'})).status,201);
  assert.equal((await call('searches','POST',{name:'Synthetic search',filters:{country:'Germany'}})).status,201);
  const backup=await call('export');assert.equal(backup.body.referrals.length,1);assert.equal(backup.body.searches.length,1);
  assert.equal((await call('import','POST',backup.body)).status,201);
  assert.equal(await db.application.count({where:{userId:user.id}}),1);
  console.log('HTTP_SMOKE_PASSED feed, detail, pagination queries, tracker, conflict, dashboard, referrals and backup restore');
}finally{
  if(app)await app.close();
  if(user)await db.user.delete({where:{id:user.id}});
  if(company){await db.job.deleteMany({where:{companyId:company.id}});await db.company.delete({where:{id:company.id}})}
  await db.$disconnect();
}
