// @vitest-environment node
// Synthetic local-file/subprocess contracts; no actual profile or credentials.
import { it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { runRecommendation } from './resume-recommend.mjs';
import { fixture } from '../lib/resume-prep/test-fixture';
const directories: string[]=[];
afterEach(()=>{for(const dir of directories.splice(0))rmSync(dir,{recursive:true,force:true});});
function inputFile() {
 const dir=mkdtempSync(join(tmpdir(),'resume-contract-'));directories.push(dir);
 const paths={bundle:join(dir,'fiction bundle.json'),allowlist:join(dir,'fiction list.json'),out:join(dir,'fiction out.json')};
 const data=fixture();writeFileSync(paths.bundle,JSON.stringify(data),{mode:0o600});return {paths,data};
}
it('blocks stale sources before ranking or writing, using argument arrays',()=>{
 const {paths,data}=inputFile();
 const call=vi.fn((...args: unknown[])=>{void args;return {status:1};});
 expect(()=>runRecommendation(paths,data,call)).toThrow();
 expect(call).toHaveBeenCalledTimes(1);
 expect(call.mock.calls[0][0]).toBe('python3');
});
it('rechecks source identity at export and sends contents only to local writer stdin',()=>{
 const {paths,data}=inputFile();const call=vi.fn((...args: unknown[])=>{void args;return {status:0};});
 runRecommendation(paths,data,call);
 expect(call).toHaveBeenCalledTimes(2);
 expect(call.mock.calls[1][1]).toContain(paths.out);
 expect((call.mock.calls[1][2] as {input:string}).input).toContain('selectedResumeId');
 const broken=fixture();broken.resumes[0].sourceText='unsupported';
 expect(()=>runRecommendation(paths,broken,call)).toThrow();
});
it('rejects a ranked input different from the checked disk bundle',()=>{
 const {paths,data}=inputFile();data.jobs[0].title='A different valid fictional job';
 const call=vi.fn(()=>({status:0}));
 expect(()=>runRecommendation(paths,data,call)).toThrow();
 expect(call).not.toHaveBeenCalled();
});
it('pins both checks and the export to the exact ranked input bytes',()=>{
 const {paths,data}=inputFile();const call=vi.fn((...args: unknown[])=>{void args;return {status:0};});
 runRecommendation(paths,data,call);
 const digest=createHash('sha256').update(readFileSync(paths.bundle)).digest('hex');
 for(const c of call.mock.calls)expect(c[1]).toEqual(expect.arrayContaining(['--bundle-sha256',digest]));
 expect(JSON.parse((call.mock.calls[1][2] as {input:string}).input).bundleSha256).toBe(digest);
});
