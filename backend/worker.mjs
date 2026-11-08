import { createServer } from 'node:http';
import { initialize,db } from './repository.mjs';
import { workerTick,refreshRegistry,refreshResearchFeed } from './ingestion.mjs';
await initialize({migrateLegacy:false});let stopped=false;const health=createServer(async(req,res)=>{try{await db.$queryRawUnsafe('SELECT 1');res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,role:'worker'}))}catch{res.statusCode=503;res.end('Database unavailable')}}).listen(Number(process.env.PORT)||3000,'0.0.0.0');process.on('SIGTERM',()=>{stopped=true;health.close()});let counter=0;
while(!stopped){try{if(counter++%120===0){await refreshRegistry();await refreshResearchFeed();}await workerTick();console.log('WORKER_TICK_OK')}catch(e){console.error('WORKER_ERROR '+String(e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[database URL redacted]'))}await new Promise(r=>setTimeout(r,30000))}await db.$disconnect();
