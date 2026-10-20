'use client';

import { useMemo, useRef, useState } from 'react';
import { MAX_BUNDLE_BYTES, validateBundle, recommend, type Bundle, type Source } from '@/lib/resume-prep/matching.mjs';
import styles from './prepare.module.css';

const labels: Record<string,string> = {fullName:'Full name',email:'Email',phone:'Phone',location:'Location',linkedin:'LinkedIn',school:'School',degree:'Degree',major:'Major',minor:'Minor',graduation:'Graduation',gpa:'GPA'};
const manual = ['First name','Last name','Work history','Years of experience','Work authorization','Sponsorship','Demographics','Disability','Salary expectations','Application attestations','Narrative answers'];
const display = (value: unknown): string => typeof value === 'string' ? value : JSON.stringify(value) ?? '';
function Provenance({sources}: {sources:Source[]}) {
  return <ul>{sources.map((s,i)=><li key={i}>{s.resumeId} · {s.part} · paragraph {s.paragraph} · {s.section}</li>)}</ul>;
}
export function PrepareWorkbench() {
  const [bundle,setBundle]=useState<Bundle|null>(null);
  const [error,setError]=useState('');
  const [jobId,setJobId]=useState('');
  const [override,setOverride]=useState('');
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<'configure'|'inspect'>('configure');
  const input=useRef<HTMLInputElement>(null);
  const reader=useRef<FileReader|null>(null);
  const status=useRef<HTMLParagraphElement>(null);
  const sequence=useRef(0);
  const job=bundle?.jobs.find(j=>j.candidate_id===jobId);
  const recommendation=useMemo(()=>bundle && job ? recommend(bundle,job) : null,[bundle,job]);
  const selected=bundle?.resumes.find(r=>r.id===(override || recommendation?.selectedResumeId));
  function clear() {
    sequence.current++;reader.current?.abort();reader.current=null;
    setBundle(null);setError('');setJobId('');setOverride('');setQuery('');setMode('configure');
    if(input.current) input.current.value='';
  }
  function load(file?:File) {
    clear(); if(!file) return;
    const token=sequence.current;
    const reject=()=> {if(token===sequence.current){setError('Invalid or unsupported local bundle. Re-import sources locally.');status.current?.focus();}};
    if(file.size>MAX_BUNDLE_BYTES || file.size===0) {reject();return;}
    const current=new FileReader();reader.current=current;
    current.onerror=reject;
    current.onload=()=>{
      if(token!==sequence.current)return;
      try {
        if(typeof current.result!=='string')throw new Error();
        const parsed=validateBundle(JSON.parse(current.result));
        setBundle(parsed);setJobId(parsed.jobs[0]?.candidate_id??'');setError('');
        status.current?.focus();
      } catch {reject();}
    };
    current.readAsText(file);
  }
  return <main className={styles.workbench}>
    <header><p>CareerOS / Application prep</p><h1>Prepare locally. Review the evidence.</h1>
      <p className={styles.notice}>Local preparation only — no forms filled, files uploaded, or applications submitted.</p>
      <p>Private to this tab. Cleared on refresh or reset. ATS connection: not connected.</p>
      <details><summary>Privacy and current limits</summary><p>Browser extension and ATS connection: not connected. No generic employment autofill. No generated narrative answers. Choose a locally generated bundle; the initial public page contains no profile and imported contents are never sent to the server.</p></details>
    </header>
    <section aria-labelledby="local-import"><h2 id="local-import">Local profile bundle</h2>
      <details open={!bundle}><summary>{bundle ? `${bundle.resumes.length} source resumes · ${bundle.jobs.length} jobs — change bundle` : 'Import your locally generated bundle'}</summary>
        <label>Choose local profile bundle<input ref={input} type="file" accept=".json,application/json" onChange={e=>load(e.target.files?.[0])}/></label>
        <p>JSON only, maximum 16 MiB. Run resumes:import locally first.</p>
      </details>
      <button onClick={()=>{clear();requestAnimationFrame(()=>input.current?.focus());}}>Reset local data</button>
      <p ref={status} tabIndex={-1} role={error?'alert':'status'}>{error || (bundle ? 'Local bundle loaded for review.' : 'No local bundle loaded.')}</p>
    </section>
    {bundle && <>
      <div className={styles.notice}><p>Source snapshot: {bundle.verifiedAt}. Recheck Red-tagged originals before external use.</p><details><summary>How to recheck Red tags</summary><p>The browser cannot read live Finder tags. Rerun <code>npm run resumes:check -- --allowlist PRIVATE_ALLOWLIST --bundle PRIVATE_BUNDLE</code>. Filenames, hashes and this import timestamp are not proof of current Finder tags.</p></details></div>
      <div role="group" aria-label="Preparation view"><button aria-pressed={mode==='configure'} onClick={()=>setMode('configure')}>Configure</button><button aria-pressed={mode==='inspect'} onClick={()=>setMode('inspect')}>Inspect</button></div>
      {mode==='configure' ? <>
        <section aria-labelledby="job-selection"><h2 id="job-selection">Choose a supplied job</h2>
          {bundle.jobs.length ? <>
            <label>Filter jobs<input value={query} onChange={e=>{setQuery(e.target.value);setJobId('');setOverride('');}}/></label>
            <label>Supplied job<select value={jobId} onChange={e=>{setJobId(e.target.value);setOverride('');}}><option value="">Choose a job</option>{bundle.jobs.filter(j=>(j.title+' '+(j.employer??'')+' '+j.candidate_id).toLowerCase().includes(query.toLowerCase())).map(j=><option key={j.candidate_id} value={j.candidate_id}>{j.title} · {j.employer} · {j.candidate_id}</option>)}</select></label>
            {!bundle.jobs.some(j=>(j.title+' '+(j.employer??'')+' '+j.candidate_id).toLowerCase().includes(query.toLowerCase())) && <p>No jobs match this filter.</p>}
          </> : <p>No supplied jobs. Import a bundle with job metadata.</p>}
          {job && <details><summary>Public job metadata and qualification warnings</summary><dl>{Object.entries(job).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{display(v)}</dd></div>)}</dl><p>Research snapshot, not live availability. Earlier qualification notes may predate resume ingestion. Dates, units, gaps, education and experience requirements need manual review. This tool does not establish eligibility or change application status.</p></details>}
        </section>
        {recommendation && <section aria-labelledby="recommendation"><h2 id="recommendation">{recommendation.label}</h2><p>Selected job: {job?.title} · {job?.candidate_id}</p>
          <p>{recommendation.reviewRequired?'Review required':'Review source evidence before use'}. Scores measure source term coverage, not hiring or eligibility probability.</p>
          <ul>{recommendation.warnings.map(w=><li key={w}>{w}</li>)}</ul>
          <label>Original resume variant<select value={selected?.id??''} onChange={e=>setOverride(e.target.value)}>{bundle.resumes.map(r=><option key={r.id} value={r.id}>{r.basename} · {r.id}</option>)}</select></label>
          {override && <p role="status">Manual override — review the selected original before external use.</p>}
          <p>Recommended original: {recommendation.alternatives[0].basename}. Selected: {selected?.basename}. No file has been attached or uploaded.</p>
          <h3>Ranked variants and evidence</h3><ol>{recommendation.alternatives.map(a=><li key={a.resumeId}><strong>{a.basename} · {a.resumeId}</strong><p>Coverage score: {a.score}. Role families: {a.roleFamilies.join(', ') || 'none'}.</p><details><summary>Matched terms ({a.evidence.length})</summary>{a.evidence.map(e=><div key={e.term}><h4>{e.term}</h4>{e.sources.map((s,i)=><blockquote key={i}><p>{s.text}</p><cite>{s.resumeId} · {s.part} · paragraph {s.paragraph}</cite></blockquote>)}</div>)}</details></li>)}</ol>
        </section>}
        <section aria-labelledby="facts"><h2 id="facts">Sourced field preview</h2><p>Supported facts are candidates for manual review. Conflicts stay blank. Nothing is sent to a form.</p>
          {Object.entries(labels).map(([key,label])=>{const f=bundle.fields[key];return <div key={key} className={styles.fact}><label>{label}<input readOnly value={f?.value??''}/></label><p>{f?.status??'unknown'}</p>{f?.candidates.map((c,i)=><details key={i}><summary>Candidate: {c.value}</summary><Provenance sources={c.sources}/></details>)}</div>;})}
          <h3>Blank / manual fields</h3>{manual.map(label=><label key={label}>{label}<input readOnly value="" placeholder="Manual review only"/></label>)}
        </section>
      </> : <section aria-labelledby="evidence"><h2 id="evidence">All document evidence</h2><p>Project headings remain source text. Review employment history manually; durations and differing claims are not merged.</p>
        {bundle.resumes.map(r=><details key={r.id}><summary>{r.basename} · {r.id}</summary><p>Actual headline: {r.headline || 'No explicit headline found'}</p><p>Actual summary: {r.summary || 'No explicit summary found'}</p>{r.paragraphs.map(p=><blockquote key={`${p.part}:${p.index}`}><cite>{p.part} · paragraph {p.index} · {p.section}</cite><p className={styles.source}>{p.text || '(Empty paragraph)'}</p></blockquote>)}</details>)}
        <h3>Identical paragraph claims</h3>{bundle.claims.map(c=><details key={c.id}><summary>{c.id}: {c.text.slice(0,100) || '(Empty paragraph)'}</summary><p className={styles.source}>{c.text}</p><Provenance sources={c.sources}/></details>)}
      </section>}
      <section aria-labelledby="inventory"><h2 id="inventory">Source resume inventory</h2><ul>{bundle.resumes.map(r=><li key={r.id}><strong>{r.basename}</strong> · {r.id}<p>SHA-256: <code>{r.sha256}</code></p><p>{r.paragraphs.length} source paragraphs. Finder tag snapshot: {r.finderTags.join(', ')}. Snapshot only; rerun the local source check.</p></li>)}</ul></section>
    </>}
  </main>;
}
