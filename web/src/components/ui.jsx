import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X,LoaderCircle } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn=(...v)=>twMerge(clsx(v));
const variants=cva('btn',{variants:{variant:{primary:'btn-primary',secondary:'btn-secondary',ghost:'btn-ghost',danger:'btn-danger'},size:{sm:'btn-sm',md:''}},defaultVariants:{variant:'secondary',size:'md'}});
export function Button({variant,size,className,children,loading,disabled,...props}){return <button className={cn(variants({variant,size}),className)} disabled={loading||disabled} {...props}>{loading&&<LoaderCircle size={15} className="spin"/>}{children}</button>}
export function Badge({children,tone='neutral'}){return <span className={'badge badge-'+tone}>{children}</span>}
export function Panel({children,className=''}){return <section className={'panel '+className}>{children}</section>}
export function Field({label,children,hint}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function Input(props){return <input {...props} className={cn('input',props.className)}/>}
export function Select({children,...props}){return <select {...props} className={cn('input',props.className)}>{children}</select>}
export function Textarea(props){return <textarea {...props} className={cn('input',props.className)}/>}
export function Empty({title='Nothing here yet',children,action}){return <div className="empty"><div className="empty-icon">↗</div><h3>{title}</h3><p>{children}</p>{action}</div>}
export function Loading(){return <div className="loading"><LoaderCircle className="spin" size={22}/>Loading your workspace…</div>}
export function ErrorBox({error,retry}){return <div className="error-box"><strong>We couldn’t load this section.</strong><p>{error?.message||'Please try again.'}</p>{retry&&<Button onClick={retry}>Try again</Button>}</div>}
export function Modal({open,onOpenChange,title,description,children,sheet=false}){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className={sheet?'modal modal-sheet':'modal'}><div className="modal-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description||'Manage your Career Atlas workspace.'}</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" aria-label="Close dialog"><X size={19}/></Button></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>}
export function PageHead({eyebrow,title,description,action}){return <div className="page-head"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{description}</p></div>{action}</div>}
export function Stat({label,value,description,icon:Icon}){return <Panel className="stat"><div className="stat-top"><span>{label}</span>{Icon&&<Icon size={18}/>}</div><strong>{value??'—'}</strong><small>{description}</small></Panel>}
