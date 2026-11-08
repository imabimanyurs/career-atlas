export function employerBoard(value,evidenceUrl,companyId,priority=2){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;let tenant,provider,hosts;
 if(['boards.greenhouse.io','job-boards.greenhouse.io','boards-api.greenhouse.io'].includes(u.hostname)){provider='greenhouse';tenant=u.hostname==='boards-api.greenhouse.io'?u.pathname.match(/^\/v1\/boards\/([^/]+)\/jobs/)?.[1]:u.pathname.startsWith('/embed/')?u.searchParams.get('for'):u.pathname.split('/')[1];hosts=['boards.greenhouse.io','job-boards.greenhouse.io']}
 else if(u.hostname==='jobs.ashbyhq.com'){provider='ashby';tenant=u.pathname.split('/')[1];hosts=[u.hostname]}
 else if(['jobs.lever.co','jobs.eu.lever.co'].includes(u.hostname)){provider='lever';tenant=u.pathname.split('/')[1];hosts=[u.hostname]}
 else return null;
 if(!tenant||!/^[A-Za-z0-9_-]{2,100}$/.test(tenant)||['embed','jobs','job','careers'].includes(tenant))return null;
 return {companyId,url:`https://${hosts[0]}/${tenant}/`,provider,tenant,ownershipEvidenceUrl:evidenceUrl,approved:true,config:{hosts,allowedPaths:['/'+tenant+'/'],priority,discoveredFrom:evidenceUrl,discoveryLink:u.href}};
 }catch{return null}
}
