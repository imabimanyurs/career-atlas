import React from 'react';
import { Button,Select } from './ui';
export function Pagination({page,total,pageSize,onPage,onPageSize,busy=false,label='records'}){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const numbers=[...new Set([1,pages,page-2,page-1,page,page+1,page+2])].filter(n=>n>0&&n<=pages).sort((a,b)=>a-b);
  return <nav className="pagination" aria-label={label+' pagination'}>
    <span className="muted small">{total?((page-1)*pageSize+1)+'–'+Math.min(page*pageSize,total):0} of {total} {label}</span>
    {onPageSize&&<Select aria-label="Companies per page" value={pageSize} onChange={e=>onPageSize(Number(e.target.value))}>{[12,24,48].map(n=><option key={n} value={n}>{n} per page</option>)}</Select>}
    <div className="pagination-buttons"><Button size="sm" disabled={busy||page<=1} onClick={()=>onPage(page-1)}>Previous</Button>
      {numbers.map((n,i)=><React.Fragment key={n}>{i>0&&n>numbers[i-1]+1&&<span aria-hidden="true">…</span>}<Button size="sm" variant={page===n?'primary':'ghost'} aria-current={page===n?'page':undefined} aria-label={'Page '+n} disabled={busy} onClick={()=>onPage(n)}>{n}</Button></React.Fragment>)}
      <Button size="sm" disabled={busy||page>=pages} onClick={()=>onPage(page+1)}>Next</Button></div>
  </nav>
}
