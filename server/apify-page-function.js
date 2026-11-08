async function pageFunction(context) {
 const {request,$,customData,enqueueRequest}=context;
 const source=customData.sources.find(s=>s.company===request.userData.company&&s.url===request.userData.sourceUrl);
 if(!source||!$)return {url:request.loadedUrl||request.url,company:request.userData.company,error:'Unsupported content'};
 const actual=request.loadedUrl||request.url;
 const allowed=u=>{try{const x=new URL(u);return x.protocol==='https:'&&source.hosts.includes(x.hostname)&&!/(workday|ashbyhq|greenhouse|lever\.co|smartrecruiters|linkedin|indeed)/i.test(x.hostname)}catch{return false}};
 if(!allowed(actual))return {url:actual,company:source.company,error:'Rejected external redirect'};
 const schemas=[];function visit(obj){if(!obj||typeof obj!=='object')return;if(Array.isArray(obj)){obj.forEach(visit);return}if([obj['@type']].flat().includes('JobPosting'))schemas.push(obj);if(obj['@graph'])visit(obj['@graph']);if(obj.itemListElement)visit(obj.itemListElement);if(obj.item)visit(obj.item);}
 $('script[type="application/ld+json"]').each((i,el)=>{try{visit(JSON.parse($(el).html()))}catch{}});
 const links=[];const noticeLinks=[];
 $('a[href]').each((i,el)=>{try{const href=new URL($(el).attr('href'),actual).href;const text=$(el).text().replace(/\s+/g,' ').trim();if(!allowed(href))return;if(source.kind==='government'&&/\.pdf(?:\?|$)|recruit|vacanc|notification/i.test(href+' '+text))noticeLinks.push({url:href,title:text.slice(0,250)});if(!/\.pdf(?:\?|$)/i.test(href)&&/\/jobs?\/|\/vacancies\/|\/job-detail|\/recruit|[?&](page|offset)=/i.test(href))links.push(href)}catch{}});
 const depth=Number(request.userData.depth||0);if(depth<2)for(const url of [...new Set(links)].slice(0,20))await enqueueRequest({url,userData:{company:source.company,sourceUrl:source.url,depth:depth+1}});
 const text=$('body').text().replace(/\s+/g,' ').slice(0,200000);
 return {company:source.company,sourceUrl:source.url,url:actual,jobPostings:schemas,noticeLinks:noticeLinks.slice(0,30),closed:/position (?:has been|is) (?:filled|closed)|no longer accepting applications|job (?:is )?no longer available/i.test(text),status:'fetched'};
}
