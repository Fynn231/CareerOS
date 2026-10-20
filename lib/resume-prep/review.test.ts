import { describe,it,expect } from 'vitest';
import { fixture } from './test-fixture';
import { createReview, editField, reviewField, reviewedPacket } from './review';

describe('explicit local field review',()=>{
 it('exports only nonempty fields explicitly reviewed for the selected job and resume',()=>{
  const b=fixture();let draft=createReview(b,'job1','analytics');
  draft=editField(draft,'email','applicant@example.invalid');
  draft=editField(draft,'fullName','Morgan Example');
  expect(()=>reviewedPacket(b,draft)).toThrow(/review/i);
  draft=reviewField(draft,'email',true);
  const packet=reviewedPacket(b,draft);
  expect(packet.fields.map(f=>[f.key,f.value])).toEqual([['email','applicant@example.invalid']]);
  expect(packet.fields[0].origin).toBe('user-entered');
  expect(packet.job.candidate_id).toBe('job1');expect(packet.resume.id).toBe('analytics');
  expect(packet.requiresSourceRecheck).toBe(true);expect(packet.submissionAuthorized).toBe(false);expect(packet.attachmentPrepared).toBe(false);
  expect(JSON.stringify(packet)).not.toContain('modeled approximate');
 });
 it('invalidates review when job, resume, source data or profile snapshot changes',()=>{
  const b=fixture();b.jobs.push({candidate_id:'job2',title:'Other fictional role'});
  const d=reviewField(editField(createReview(b,'job1','analytics'),'email','applicant@example.invalid'),'email',true);
  expect(()=>reviewedPacket(b,{...d,jobId:'job2'})).toThrow();
  expect(()=>reviewedPacket(b,{...d,resumeId:'writing'})).toThrow();
  const changed=structuredClone(b);changed.verifiedAt='2026-10-19T13:00:00Z';expect(()=>reviewedPacket(changed,d)).toThrow();
  const changedJob=structuredClone(b);changedJob.jobs[0].title='Changed requirements';expect(()=>reviewedPacket(changedJob,d)).toThrow();
 });
 it('clears confirmation on edit without mutating prior review state',()=>{
  const b=fixture();const d=reviewField(editField(createReview(b,'job1','analytics'),'email','applicant@example.invalid'),'email',true);
  const edited=editField(d,'email','replacement@example.invalid');
  expect(d.fields.email.reviewed).toBe(true);expect(edited.fields.email.reviewed).toBe(false);
  expect(()=>reviewedPacket(b,edited)).toThrow();
 });
 it('refuses empty, invalid and unsupported values even if a draft is manually marked reviewed',()=>{
  const b=fixture();let d=createReview(b,'job1','analytics');
  expect(()=>reviewField(d,'email',true)).toThrow();
  d=editField(d,'email','not-an-email');expect(()=>reviewField(d,'email',true)).toThrow();
  expect(()=>editField(d,'workAuthorization' as never,'Yes')).toThrow();
  expect(()=>editField(d,'__proto__' as never,'x')).toThrow();
  expect(()=>editField(d,'fullName','x'.repeat(2001))).toThrow();
  d.fields.email.reviewed=true;expect(()=>reviewedPacket(b,d)).toThrow();
 });
});
