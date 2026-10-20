'use client';
import { useState } from 'react';
import type { Bundle } from '@/lib/resume-prep/matching.mjs';
import { REVIEW_LABELS,createReview,editField,reviewField,reviewedPacket,fieldProblem,type ReviewKey,type ReviewedPacket } from '@/lib/resume-prep/review';
import styles from './prepare.module.css';

type Props={bundle:Bundle;jobId:string;resumeId:string;onDownload?:(packet:ReviewedPacket)=>void};
function download(packet:ReviewedPacket) {
 const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const anchor=document.createElement('a');
 try {anchor.href=url;anchor.download='careeros-reviewed-fields.json';document.body.append(anchor);anchor.click();}
 finally {anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
export function FieldReview(props:Props) {
 // Re-key on the complete source context, not just a potentially repeated job title.
 return <ReviewSession key={JSON.stringify([props.bundle,props.jobId,props.resumeId])} {...props}/>;
}
function ReviewSession({bundle,jobId,resumeId,onDownload=download}:Props) {
 const [draft,setDraft]=useState(()=>createReview(bundle,jobId,resumeId));
 const [prepared,setPrepared]=useState<ReviewedPacket|null>(null);
 const [error,setError]=useState('');
 const count=Object.values(draft.fields).filter(f=>f.reviewed).length;
 const change=(key:ReviewKey,value:string)=>{setDraft(current=>editField(current,key,value));setPrepared(null);setError('');};
 return <div role="region" aria-label="Review application fields">
  <p>Imported values are candidates, not verified facts. Choose or correct each value, inspect its source and explicitly mark it reviewed. Edits clear that field’s review; changing the job, original resume or bundle clears the whole review.</p>
  <p role="status">{count} reviewed fields. Nothing is sent to an employer.</p>
  {(Object.keys(REVIEW_LABELS) as ReviewKey[]).map(key=>{
   const label=REVIEW_LABELS[key],entry=draft.fields[key],candidates=bundle.fields[key]?.candidates??[];
   const selected=candidates.find(c=>c.value===entry.value);const problem=fieldProblem(key,entry.value);
   return <div key={key} className={styles.fact}>
    <label>{label}<input autoComplete="off" maxLength={2000} value={entry.value} onChange={e=>change(key,e.target.value)} /></label>
    {candidates.length>1&&<label>Choose sourced {label} candidate<select value={selected?.value??''} onChange={e=>change(key,e.target.value)}><option value="">Choose a candidate or enter your own value</option>{candidates.map(c=><option key={c.value} value={c.value}>{c.value}</option>)}</select></label>}
    <p>{entry.value ? (selected?'Matches a resume candidate.':'Entered or corrected by you; not a resume-derived claim.') : 'No value selected; omitted from export.'}</p>
    {candidates.map((c,i)=><details key={i}><summary>Candidate: {c.value}</summary>{c.sources.map((s,n)=>{
     const paragraph=bundle.resumes.find(r=>r.id===s.resumeId)?.paragraphs.find(p=>p.part===s.part&&p.index===s.paragraph);
     return <blockquote key={n}><p className={styles.source}>{paragraph?.text}</p><cite>{s.resumeId} · {s.part} · paragraph {s.paragraph} · {s.section}</cite></blockquote>;
    })}</details>)}
    <label className={styles.reviewToggle}><input type="checkbox" aria-label={`Reviewed ${label}`} disabled={Boolean(problem)} checked={entry.reviewed} onChange={e=>{try{setDraft(current=>reviewField(current,key,e.target.checked));setPrepared(null);setError('');}catch{setError('Review requires a valid nonempty value.');}}}/>I reviewed this value for this job</label>
    {entry.value&&problem&&<p>{problem}</p>}
   </div>;
  })}
  <p>Only checked values go into the packet. Screening answers, work authorization, sponsorship, demographics, salary commitments, attestations and narrative answers are excluded. Work/project history mapping is not implemented here.</p>
  <button type="button" disabled={!count} onClick={()=>{try{setPrepared(reviewedPacket(bundle,draft));setError('');}catch{setPrepared(null);setError('Review the current fields before preparing an export.');}}}>Prepare reviewed JSON</button>
  {prepared&&<>
   <label>Reviewed packet JSON<textarea readOnly rows={12} value={JSON.stringify(prepared,null,2)}/></label>
   <p>This unencrypted download contains private information. Keep it out of public repositories. Source hashes/tags must be rechecked locally before external use. It is not an attached resume, a filled form or submission permission.</p>
   <button type="button" onClick={()=>{try{onDownload(reviewedPacket(bundle,draft));setError('');}catch{setError('Download unavailable. Copy the local JSON preview manually, or review the fields again.');}}}>Download reviewed fields</button>
  </>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
