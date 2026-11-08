import { initialize,db } from './repository.mjs';
import { workerTick,refreshRegistry } from './ingestion.mjs';
await initialize({migrateLegacy:false});let stopped=false;process.on('SIGTERM',()=>{stopped=true});let counter=0;
while(!stopped){try{if(counter++%120===0)await refreshRegistry();await workerTick();console.log('WORKER_TICK_OK')}catch(e){console.error('WORKER_ERROR '+String(e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[database URL redacted]'))}await new Promise(r=>setTimeout(r,30000))}await db.$disconnect();
