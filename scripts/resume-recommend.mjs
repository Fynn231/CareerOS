import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateBundle, recommend, MAX_BUNDLE_BYTES } from '../lib/resume-prep/matching.mjs';
const checker=fileURLToPath(new URL('./resume-prep.py',import.meta.url));
const writer=fileURLToPath(new URL('./resume-output.py',import.meta.url));
export function runRecommendation(paths, input, run=spawnSync) {
  const raw=readFileSync(paths.bundle);
  if(raw.length>MAX_BUNDLE_BYTES || !isDeepStrictEqual(JSON.parse(raw.toString('utf8')),input)) throw new Error('Ranked input differs from the disk bundle.');
  const bundleSha256=createHash('sha256').update(raw).digest('hex');
  const bundle=validateBundle(input);
  const args=['--allowlist',paths.allowlist,'--bundle',paths.bundle,'--bundle-sha256',bundleSha256];
  const checked=run('python3',[checker,'check',...args],{stdio:['ignore','pipe','pipe'],timeout:120000});
  if(checked.status!==0) throw new Error('Source recheck failed.');
  const result={schemaVersion:1,bundleSha256,verifiedAt:bundle.verifiedAt,recommendations:bundle.jobs.map(job=>({candidate_id:job.candidate_id,...recommend(bundle,job)}))};
  const written=run('python3',[writer,...args,'--out',paths.out],{input:JSON.stringify(result),encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:120000,maxBuffer:MAX_BUNDLE_BYTES});
  if(written.status!==0) throw new Error('Private export failed.');
  return result.recommendations.length;
}
export function main(argv=process.argv.slice(2)) {
  try {
    const paths={};
    for(let i=0;i<argv.length;i+=2) {
      const key=argv[i]?.slice(2);
      if(!['bundle','allowlist','out'].includes(key) || argv[i]!==`--${key}` || !argv[i+1] || paths[key]) throw new Error();
      paths[key]=argv[i+1];
    }
    if(!paths.bundle || !paths.allowlist || !paths.out || statSync(paths.bundle).size>MAX_BUNDLE_BYTES) throw new Error();
    const count=runRecommendation(paths,JSON.parse(readFileSync(paths.bundle,'utf8')));
    console.log(`Ranked ${count} jobs. Output: ${paths.out}`); return 0;
  } catch { console.error('Resume recommendation failed: input, source recheck, or private output validation failed.'); return 1; }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=main();
