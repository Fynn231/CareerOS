import { validateBundle, type Bundle, type Source } from './matching.mjs';

export const REVIEW_LABELS = {
 fullName:'Full name',firstName:'First name',lastName:'Last name',email:'Email',phone:'Phone',location:'Location',linkedin:'LinkedIn',school:'School',degree:'Degree',major:'Major',minor:'Minor',graduation:'Graduation',gpa:'GPA',
} as const;
export type ReviewKey=keyof typeof REVIEW_LABELS;
export type ReviewEntry={value:string;reviewed:boolean};
export type ReviewDraft={jobId:string;resumeId:string;verifiedAt:string;sourceContext:string;fields:Record<ReviewKey,ReviewEntry>};
export type ReviewedPacket={
 schemaVersion:1;kind:'careeros-reviewed-fields';
 job:{candidate_id:string;title:string;employer?:string};
 resume:{id:string;basename:string;sha256:string};
 sourceSnapshotAt:string;requiresSourceRecheck:true;submissionAuthorized:false;attachmentPrepared:false;
 fields:{key:ReviewKey;label:string;value:string;origin:'resume-candidate'|'user-entered';sources:Source[]}[];
};
const keys=Object.keys(REVIEW_LABELS) as ReviewKey[];
const known=(key:string)=>Object.prototype.hasOwnProperty.call(REVIEW_LABELS,key);
export function fieldProblem(key:ReviewKey,value:string):string {
 if(!known(key)||typeof value!=='string'||value.length>2000)return 'Unsupported field or value.';
 if(!value.trim())return 'Enter or choose a value first.';
 if(key==='email'&&!/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(value))return 'Enter a valid email address.';
 return '';
}
export function createReview(input:Bundle,jobId:string,resumeId:string):ReviewDraft {
 const b=validateBundle(input);
 if(!b.jobs.some(j=>j.candidate_id===jobId)||!b.resumes.some(r=>r.id===resumeId))throw new Error('Choose a supplied job and original resume first.');
 const fields=Object.fromEntries(keys.map(key=>[key,{value:b.fields[key]?.value??'',reviewed:false}])) as Record<ReviewKey,ReviewEntry>;
 return {jobId,resumeId,verifiedAt:b.verifiedAt,sourceContext:JSON.stringify([b,jobId,resumeId]),fields};
}
export function editField(draft:ReviewDraft,key:ReviewKey,value:string):ReviewDraft {
 if(!known(key)||typeof value!=='string'||value.length>2000)throw new Error('Unsupported field or value.');
 return {...draft,fields:{...draft.fields,[key]:{value,reviewed:false}}};
}
export function reviewField(draft:ReviewDraft,key:ReviewKey,reviewed:boolean):ReviewDraft {
 if(!known(key)||typeof reviewed!=='boolean'||!draft.fields[key])throw new Error('Unsupported review field.');
 if(reviewed&&fieldProblem(key,draft.fields[key].value))throw new Error(fieldProblem(key,draft.fields[key].value));
 return {...draft,fields:{...draft.fields,[key]:{...draft.fields[key],reviewed}}};
}
export function reviewedPacket(input:Bundle,draft:ReviewDraft):ReviewedPacket {
 const b=validateBundle(input);const job=b.jobs.find(j=>j.candidate_id===draft.jobId);const resume=b.resumes.find(r=>r.id===draft.resumeId);
 if(draft.sourceContext!==JSON.stringify([b,draft.jobId,draft.resumeId]))throw new Error('Source, job or resume changed. Review the fields again.');
 for(const [key,entry] of Object.entries(draft.fields)) {
  if(!known(key)||!entry||typeof entry.value!=='string'||entry.value.length>2000||typeof entry.reviewed!=='boolean')throw new Error('Unsupported review data.');
  if(entry.reviewed&&fieldProblem(key as ReviewKey,entry.value))throw new Error('Review contains an invalid value.');
 }
 if(!job||!resume)throw new Error('Choose a supplied job and original resume first.');
 const fields=keys.filter(key=>draft.fields[key].reviewed&&draft.fields[key].value.trim()).map(key=>{
  const value=draft.fields[key].value;const candidate=b.fields[key]?.candidates.find(c=>c.value===value);
  return {key,label:REVIEW_LABELS[key],value,origin:candidate?'resume-candidate' as const:'user-entered' as const,sources:candidate?.sources??[]};
 });
 if(!fields.length)throw new Error('Review at least one nonempty field before preparing an export.');
 return {schemaVersion:1,kind:'careeros-reviewed-fields',job:{candidate_id:job.candidate_id,title:job.title,...(job.employer?{employer:job.employer}:{})},resume:{id:resume.id,basename:resume.basename,sha256:resume.sha256},sourceSnapshotAt:b.verifiedAt,requiresSourceRecheck:true,submissionAuthorized:false,attachmentPrepared:false,fields};
}
