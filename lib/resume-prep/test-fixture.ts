import type { Bundle } from './matching.mjs';
export function fixture(): Bundle {
 const source={resumeId:'analytics',part:'word/document.xml',paragraph:0,section:'body'};
 const paragraphs=[{part:source.part,index:0,section:'body',text:'SQL analytics modeled approximate projected results'}];
 return {schemaVersion:1,verifiedAt:'2026-10-18T12:00:00Z',resumes:[{id:'analytics',basename:'variant-a.docx',sha256:'a'.repeat(64),paragraphs,sourceText:paragraphs[0].text,headline:'',summary:'',finderTags:['Red\n99']},{id:'writing',basename:'variant-b.docx',sha256:'b'.repeat(64),paragraphs:[{part:source.part,index:0,section:'body',text:'Writing editorial research'}],sourceText:'Writing editorial research',headline:'',summary:'',finderTags:['Red\n99']}],claims:[{id:'c1',text:paragraphs[0].text,sources:[source]},{id:'c2',text:'Writing editorial research',sources:[{...source,resumeId:'writing'}]}],fields:{email:{value:'',status:'unknown',candidates:[]}},jobs:[{candidate_id:'job1',title:'Analytics analyst',employer:'Fictional Example',requirements:'SQL analytics',track:'Analytics'}]};
}
