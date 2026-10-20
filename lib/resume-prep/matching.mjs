// Browser-safe, deterministic evidence matching. No I/O, storage, or network.
export const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
const fields = ['fullName','email','phone','location','linkedin','school','degree','major','minor','graduation','gpa'];
const fail = () => { throw new Error('Invalid or unsupported local bundle. Re-import sources locally.'); };
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max=200000) => typeof v === 'string' && v.length <= max;
const list = (v, max) => Array.isArray(v) && v.length <= max;
export function validateBundle(value) {
  // Reject dangerous keys even in otherwise unused nested public metadata.
  let nodes=0;
  function inspect(v,depth=0) {
    if (++nodes>150000 || depth>15) fail();
    if (v === null || typeof v === 'boolean' || typeof v === 'number') { if(typeof v==='number' && !Number.isFinite(v)) fail(); return; }
    if (typeof v === 'string') { if(v.length>1000000) fail(); return; }
    if (!object(v) && !Array.isArray(v)) fail();
    for (const key of Object.keys(v)) { if(['__proto__','constructor','prototype'].includes(key)) fail(); inspect(v[key],depth+1); }
  }
  inspect(value);
  if (!object(value) || value.schemaVersion!==1 || !str(value.verifiedAt,80) || !Number.isFinite(Date.parse(value.verifiedAt)) || !list(value.resumes,100) || !value.resumes.length || !list(value.jobs,2000) || !list(value.claims,30000) || !object(value.fields)) fail();
  const ids=new Set(); const paragraphs=new Map();
  for(const r of value.resumes) {
    if(!object(r) || !str(r.id,80) || !/^[A-Za-z0-9_-]+$/.test(r.id) || ids.has(r.id) || !str(r.basename,255) || !/^[^/\\]+\.docx$/i.test(r.basename) || !/^[a-f0-9]{64}$/.test(r.sha256) || !list(r.paragraphs,10000) || !str(r.sourceText,1000000) || !str(r.headline,1000) || !str(r.summary,200000) || !list(r.finderTags,100) || !r.finderTags.every(t=>str(t,1000)) || !r.finderTags.some(t=>t.split('\n')[0].toLowerCase()==='red')) fail();
    ids.add(r.id); const keys=new Set();
    for(const p of r.paragraphs) {
      if(!object(p) || !str(p.part,120) || !/^word\/(document|header\d+|footer\d+)\.xml$/.test(p.part) || !Number.isInteger(p.index) || p.index<0 || !['body','header','footer'].includes(p.section) || !str(p.text)) fail();
      const expectedSection=p.part==='word/document.xml'?'body':p.part.startsWith('word/header')?'header':'footer';
      if(p.section!==expectedSection) fail();
      const key=JSON.stringify([r.id,p.part,p.index]); if(keys.has(key)) fail();keys.add(key); paragraphs.set(key,p);
    }
    if(r.sourceText!==r.paragraphs.map(p=>p.text).join('\n') || (r.headline && !r.paragraphs.some(p=>p.text===r.headline)) || (r.summary && !r.paragraphs.some(p=>p.text===r.summary))) fail();
  }
  const source = s => {
    if(!object(s) || !ids.has(s.resumeId) || !str(s.part,120) || !Number.isInteger(s.paragraph)) fail();
    const p=paragraphs.get(JSON.stringify([s.resumeId,s.part,s.paragraph]));
    if(!p || s.section!==p.section) fail(); return p;
  };
  const claimIds=new Set(), claimTexts=new Set(), covered=new Set();
  for(const c of value.claims) {
    if(!object(c) || !str(c.id,80) || claimIds.has(c.id) || claimTexts.has(c.text) || !str(c.text) || !list(c.sources,10000) || !c.sources.length) fail();
    claimIds.add(c.id);claimTexts.add(c.text);
    for(const s of c.sources) {
      const key=JSON.stringify([s.resumeId,s.part,s.paragraph]);
      if(source(s).text!==c.text || covered.has(key)) fail();covered.add(key);
    }
  }
  if(covered.size!==paragraphs.size) fail();
  for(const [key,f] of Object.entries(value.fields)) {
    if(!fields.includes(key) || !object(f) || !str(f.value,2000) || !['supported','unknown','needs-review'].includes(f.status) || !list(f.candidates,1000)) fail();
    const vals=new Set();
    for(const c of f.candidates) {
      if(!object(c) || !str(c.value,2000) || !c.value || vals.has(c.value) || !list(c.sources,10000) || !c.sources.length) fail();
      if(key==='email' && !/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(c.value)) fail();
      vals.add(c.value);for(const s of c.sources) if(!source(s).text.includes(c.value)) fail();
    }
    if(f.status==='supported' ? (vals.size!==1 || !vals.has(f.value)) : (f.value!=='' || (f.status==='unknown' ? vals.size!==0 : vals.size<2))) fail();
  }
  const jobIds=new Set();
  for(const j of value.jobs) {
    if(!object(j) || !str(j.candidate_id,200) || !j.candidate_id || jobIds.has(j.candidate_id) || !str(j.title,1000)) fail();
    for(const k of ['track','employer','source_url']) if(j[k]!==undefined && !str(j[k],3000)) fail();
    jobIds.add(j.candidate_id);
  }
  return value;
}
const STOP = new Set('a an the and or with for to in of on at by from is as be are this that you your our will must have experience required preferred years year role work ability skills strong excellent team using'.split(' '));
const tokens = s => new Set((s.toLowerCase().match(/\.?[a-z][a-z0-9+#.-]{1,40}/g)||[]).map(t=>t.replace(/[.-]+$/g,'')).filter(t=>t && !STOP.has(t)));
const families = {
  analytics:['analytics','analyst','sql','data','statistics','modeling','modelling'],
  engineering:['engineer','engineering','software','developer','programming','python','javascript'],
  design:['design','designer','ux','ui','figma'],
  law:['law','legal','attorney','paralegal','litigation'],
  healthcare:['healthcare','nursing','nurse','clinical','patient'],
  vc:['venture','vc','investment','investing','capital'],
  writing:['writing','writer','editorial','editor','communications'],
};
function flatten(v) { if(typeof v==='string') return v; if(v===null || v===undefined) return ''; if(Array.isArray(v)) return v.map(flatten).join(' '); if(object(v)) return Object.entries(v).map(([k,x])=>k+' '+flatten(x)).join(' '); return String(v); }
export function recommend(bundle, job) {
  validateBundle(bundle);
  if(!object(job) || !str(job.title,1000)) fail();
  const titleTerms=tokens(job.title+' '+flatten(job.track));
  const jobTerms=tokens(job.title+' '+flatten(job.track)+' '+flatten(job.requirements));
  const targetFamilies=Object.entries(families).filter(([,terms])=>terms.some(t=>titleTerms.has(t))).map(([key])=>key);
  const alternatives=bundle.resumes.map(r=>{
    const content=tokens(r.sourceText), emphasis=tokens(r.headline+' '+r.summary);
    const matched=[...jobTerms].filter(t=>content.has(t)).sort();
    const roleFamilies=targetFamilies.filter(f=>families[f].some(t=>content.has(t)));
    const evidence=matched.map(term=>({term,sources:r.paragraphs.filter(p=>tokens(p.text).has(term)).slice(0,4).map(p=>({resumeId:r.id,part:p.part,paragraph:p.index,section:p.section,text:p.text}))}));
    const score=matched.reduce((n,t)=>n+1+(titleTerms.has(t)?2:0)+(emphasis.has(t)?2:0),0)+roleFamilies.length*3;
    return {resumeId:r.id,basename:r.basename,score,evidence,roleFamilies};
  }).sort((a,b)=>b.score-a.score || a.resumeId.localeCompare(b.resumeId,'en'));
  const top=alternatives[0], second=alternatives[1];
  const specialist=targetFamilies.filter(f=>['design','law','healthcare','vc'].includes(f));
  const dedicated=specialist.length===0 || specialist.every(f=>(f==='vc'?['venture','vc']:families[f]).some(t=>tokens(bundle.resumes.find(r=>r.id===top.resumeId).headline).has(t)));
  const warnings=[];
  if(!top.score) warnings.push('No source term coverage. Manual selection required.');
  else if(top.evidence.length<2) warnings.push('Weak source term coverage. Review required.');
  if(second && top.score===second.score) warnings.push('Tied source variants. Review required.');
  if(!dedicated) warnings.push('No dedicated specialist headline found; closest available variant only.');
  if(Object.values(bundle.fields).some(f=>f.status==='needs-review')) warnings.push('Conflicting profile facts require manual review.');
  if(job.ai_application_restriction && !['none','false','no','not applicable'].includes(flatten(job.ai_application_restriction).toLowerCase().trim())) warnings.push('Manual employer-policy review required for supplied AI-use notes. An unstated restriction is not permission. No generation or upload.');
  return {selectedResumeId:top.resumeId,label:dedicated?'Source-content recommendation':'Closest available variant',reviewRequired:warnings.length>0,warnings,alternatives};
}
