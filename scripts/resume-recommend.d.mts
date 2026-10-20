import type { Bundle } from '../lib/resume-prep/matching.mjs';
type Paths = {bundle:string;allowlist:string;out:string};
type Runner = (command:string,args:string[],options:object)=>{status:number|null};
export function runRecommendation(paths:Paths,input:Bundle,run?:Runner):number;
export function main(argv?:string[]):number;
