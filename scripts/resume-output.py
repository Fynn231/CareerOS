"""Local stdin-only private writer; revalidate originals again before export."""
import json
import sys
from resume_prep.core import MAX_TOTAL, PrepError, SafeParser, read_json, validate_sources, verify_bundle, write_private

def main():
    parser=SafeParser()
    parser.add_argument('--allowlist',required=True)
    parser.add_argument('--bundle',required=True)
    parser.add_argument('--bundle-sha256',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    try:
        raw=sys.stdin.read(MAX_TOTAL+1)
        if len(raw)>MAX_TOTAL:raise PrepError()
        result=json.loads(raw)
        bundle=read_json(args.bundle,args.bundle_sha256)
        verify_bundle(bundle,validate_sources(read_json(args.allowlist)))
        if not isinstance(result,dict) or result.get('schemaVersion')!=1 or result.get('bundleSha256')!=args.bundle_sha256:raise PrepError()
        rows=result.get('recommendations');job_ids={j['candidate_id'] for j in bundle['jobs']};resume_ids={r['id'] for r in bundle['resumes']}
        if not isinstance(rows,list) or len(rows)!=len(job_ids):raise PrepError()
        seen=set()
        for row in rows:
            if not isinstance(row,dict) or row.get('candidate_id') not in job_ids or row['candidate_id'] in seen or row.get('selectedResumeId') not in resume_ids:raise PrepError()
            seen.add(row['candidate_id'])
        write_private(args.out,result)
        return 0
    except (PrepError,OSError,ValueError,TypeError,KeyError):
        print('Private recommendation export failed.',file=sys.stderr)
        return 1
raise SystemExit(main())
