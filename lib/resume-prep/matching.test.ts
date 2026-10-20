import { describe, it, expect } from 'vitest';
import { validateBundle, recommend } from './matching.mjs';
import { fixture } from './test-fixture';

describe('local matching',()=>{
 it('ignores sentence-ending punctuation while preserving technical term punctuation',()=>{
  const b=fixture();const text='Python SQL C++ C# .NET Node.js';
  b.resumes[0].paragraphs[0].text=text;b.resumes[0].sourceText=text;b.claims[0].text=text;
  const job={candidate_id:'punctuation',title:text};
  const before=recommend(b,job).alternatives.find(a=>a.resumeId==='analytics')!;
  const punctuated='Python. SQL. C++. C#. .NET. Node.js.';
  b.resumes[0].paragraphs[0].text=punctuated;b.resumes[0].sourceText=punctuated;b.claims[0].text=punctuated;
  const after=recommend(b,job).alternatives.find(a=>a.resumeId==='analytics')!;
  expect(after.score).toBe(before.score);
  expect(after.evidence.map(e=>e.term)).toEqual(expect.arrayContaining(['python','sql','c++','c#','.net','node.js']));
 });
 it('ranks content over filenames with evidence and no duplicate inflation',()=>{
  const b=fixture(); b.resumes[0].basename='design-law.docx';
  const result=recommend(validateBundle(b),b.jobs[0]);
  expect(result.alternatives[0].resumeId).toBe('analytics');
  expect(result.alternatives[0].evidence[0].sources[0].part).toBe('word/document.xml');
  const score=result.alternatives[0].score;
  b.resumes[0].paragraphs[0].text+=' SQL SQL SQL'; b.resumes[0].sourceText=b.resumes[0].paragraphs[0].text; b.claims[0].text=b.resumes[0].sourceText;
  expect(recommend(validateBundle(b),b.jobs[0]).alternatives[0].score).toBe(score);
 });
 it('requires review for ties, empty coverage, conflicts and policy restrictions',()=>{
  const b=fixture(); b.resumes[1]={...b.resumes[0],id:'other'}; b.claims=[{...b.claims[0],sources:[...b.claims[0].sources,{...b.claims[0].sources[0],resumeId:'other'}]}];
  expect(recommend(validateBundle(b),b.jobs[0]).reviewRequired).toBe(true);
  expect(recommend(validateBundle(b),{candidate_id:'none',title:'Nursing healthcare'}).label).toContain('Closest available variant');
  const contacts=b.resumes[0].sourceText+' first@example.invalid second@example.invalid';
  for(const r of b.resumes){r.paragraphs[0].text=contacts;r.sourceText=contacts;}
  b.claims[0].text=contacts;
  b.fields.email={value:'',status:'needs-review',candidates:[{value:'first@example.invalid',sources:[{resumeId:'analytics',part:'word/document.xml',paragraph:0,section:'body'}]},{value:'second@example.invalid',sources:[{resumeId:'analytics',part:'word/document.xml',paragraph:0,section:'body'}]}]};
  expect(recommend(validateBundle(b),b.jobs[0]).reviewRequired).toBe(true);
  expect(recommend(validateBundle(b),{...b.jobs[0],ai_application_restriction:'No AI materials'}).warnings.join(' ')).toContain('employer-policy');
 });
 it('rejects a source substring masquerading as a supported email',()=>{
  const b=fixture();b.fields.email={value:'SQL',status:'supported',candidates:[{value:'SQL',sources:b.claims[0].sources}]};
  expect(()=>validateBundle(b)).toThrow();
 });
 it('rejects hostile, malformed, stale and unsupported bundles',()=>{
  for(const value of [null,{}, {schemaVersion:99},JSON.parse('{"__proto__":{}}')]) expect(()=>validateBundle(value)).toThrow();
  const b=fixture(); b.resumes[0].sourceText='fabricated';expect(()=>validateBundle(b)).toThrow();
  const c=fixture(); c.claims[0].sources[0].resumeId='absent';expect(()=>validateBundle(c)).toThrow();
  const d=fixture(); d.resumes.push(d.resumes[0]);expect(()=>validateBundle(d)).toThrow();
 });
 it('rejects omitted, duplicated, or wrongly sectioned paragraph evidence',()=>{
  const missing=fixture();missing.claims.pop();expect(()=>validateBundle(missing)).toThrow();
  const duplicate=fixture();duplicate.claims.push({...duplicate.claims[0],id:'c3'});expect(()=>validateBundle(duplicate)).toThrow();
  const section=fixture();section.resumes[0].paragraphs[0].section='footer';section.claims[0].sources[0].section='footer';expect(()=>validateBundle(section)).toThrow();
 });
 it('does not present a generic investment source as a dedicated venture-capital variant',()=>{
  const b=fixture();const text='Investment Analyst capital investing';b.resumes[0].paragraphs[0].text=text;b.resumes[0].sourceText=text;b.resumes[0].headline=text;b.claims[0].text=text;
  expect(recommend(validateBundle(b),{candidate_id:'vc',title:'Venture Capital Analyst'}).label).toBe('Closest available variant');
 });
});
