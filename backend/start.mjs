import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
const run=(file,args)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[file,...args],{stdio:'inherit',env:process.env});child.on('exit',code=>code===0?resolve():reject(Error('Startup command failed with exit '+code)));child.on('error',reject)});
await run('node_modules/prisma/build/index.js',['migrate','deploy']);
if(process.env.BUILD_ONLY==='1'){await run('backend/database-smoke.mjs',[]);await run('backend/http-smoke.mjs',[]);createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,build:'verified',database:'verified',privateData:'not loaded'}))}).listen(Number(process.env.PORT)||3000,'0.0.0.0');}
else await import(process.env.ROLE==='worker'?'./worker.mjs':'./main.mjs');
