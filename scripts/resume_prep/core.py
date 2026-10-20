"""Offline evidence import. Python 3.9+, standard library only."""
import argparse
import datetime
import hashlib
import json
import math
import os
import posixpath
from pathlib import Path
import plistlib
import re
import stat
import subprocess
import sys
import zipfile
import zlib
from typing import NoReturn
import xml.etree.ElementTree as ET

REPO = Path(__file__).resolve().parents[2]
MAX_FILE = 20 * 1024 * 1024
MAX_TOTAL = 32 * 1024 * 1024
MAX_BUNDLE = 16 * 1024 * 1024
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

class PrepError(Exception):
    pass

def fail() -> NoReturn:
    raise PrepError('Source or input validation failed.')

def unique_object(pairs):
    result={}
    for key,value in pairs:
        if key in result or key in ('__proto__','constructor','prototype'): fail()
        result[key]=value
    return result

def read_json(path, expected_digest=None):
    try:
        with Path(path).open('rb') as f: raw=f.read(MAX_TOTAL+1)
        if len(raw)>MAX_TOTAL: fail()
        if expected_digest is not None and (not isinstance(expected_digest,str) or not re.fullmatch(r'[a-f0-9]{64}',expected_digest) or hashlib.sha256(raw).hexdigest()!=expected_digest):fail()
        value=json.loads(raw.decode('utf-8'),object_pairs_hook=unique_object,parse_constant=lambda _:fail())
        stack=[(value,0)];nodes=0
        while stack:
            item,depth=stack.pop();nodes+=1
            if nodes>150000 or depth>15: fail()
            if isinstance(item,float) and not math.isfinite(item): fail()
            if isinstance(item,dict): stack.extend((v,depth+1) for v in item.values())
            elif isinstance(item,list): stack.extend((v,depth+1) for v in item)
        return value
    except (OSError, ValueError, TypeError, RecursionError):
        fail()

def finder_tags(path):
    """Read per-file metadata; unavailable metadata is a hard failure on every OS."""
    try:
        result = subprocess.run(['/usr/bin/xattr', '-px', 'com.apple.metadata:_kMDItemUserTags', str(path)],
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True, timeout=10)
        return bytes.fromhex(result.stdout.decode('ascii'))
    except (OSError, ValueError, UnicodeError, subprocess.SubprocessError):
        fail()

def red_tags(path, reader):
    try:
        raw=reader(path)
        if not isinstance(raw,bytes) or len(raw)>65536: fail()
        tags = plistlib.loads(raw)
        if not isinstance(tags, list) or not tags or not all(isinstance(t, str) for t in tags): fail()
        if not any(t.split('\n', 1)[0].casefold() == 'red' for t in tags): fail()
        return tags  # Keep the original suffix; no numeric color assumptions.
    except (ValueError, TypeError, OSError, plistlib.InvalidFileException):
        fail()

def parse_docx(data):
    try:
        import io
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            entries = z.infolist()
            names = [i.filename for i in entries]
            if len(entries) > 512 or len(set(names)) != len(names): fail()
            if '[Content_Types].xml' not in names or 'word/document.xml' not in names: fail()
            total = 0
            for i in entries:
                if i.filename.startswith(('/', '\\')) or '\\' in i.filename or '..' in i.filename.split('/') or i.flag_bits & 1: fail()
                if stat.S_ISLNK(i.external_attr >> 16): fail()
                total += i.file_size
                if i.file_size > MAX_FILE or total > MAX_TOTAL or i.file_size > max(1, i.compress_size)*200: fail()
            # Validate all XML, including relationships, before reading visible evidence.
            trees = {}
            for i in entries:
                if i.filename.endswith(('.xml', '.rels')):
                    raw = z.read(i)
                    # UTF-16/32 XML can conceal declarations from a byte substring check.
                    if b'\x00' in raw or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper(): fail()
                    tree=ET.fromstring(raw)
                    stack=[(tree,0)];count=0
                    while stack:
                        element,depth=stack.pop();count+=1
                        if depth>64 or count>200000: fail()
                        stack.extend((child,depth+1) for child in element)
                    trees[i.filename] = tree
            ct = trees.get('[Content_Types].xml')
            if ct is None or not any(e.get('PartName')=='/word/document.xml' and e.get('ContentType')=='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml' for e in ct): fail()
            if trees['word/document.xml'].tag != W+'document': fail()
            for i in entries:
                if not i.filename.endswith(('.xml','.rels')): z.read(i)  # CRC validation, no extraction
            # An orphaned header/footer ZIP member is not current document evidence.
            relations={}
            for rel in trees.get('word/_rels/document.xml.rels',[]):
                rid=rel.get('Id')
                if not rid or rid in relations:fail()
                relations[rid]=rel
            referenced=set(); stack=[trees['word/document.xml']]
            while stack:
                el=stack.pop()
                if el.tag in (W+'del',W+'sectPrChange'):continue
                if el.tag in (W+'headerReference',W+'footerReference'):
                    kind='header' if el.tag==W+'headerReference' else 'footer'
                    rel=relations.get(el.get(R+'id'))
                    if rel is None or not rel.get('Type','').endswith('/'+kind) or rel.get('TargetMode')=='External':fail()
                    target=rel.get('Target','')
                    part=posixpath.normpath(target).lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('word',target))
                    if not re.fullmatch(r'word/'+kind+r'\d+\.xml',part) or part not in trees:fail()
                    referenced.add(part)
                stack.extend(el)
            parts=['word/document.xml']+sorted(referenced)
            paragraphs = []
            for part in parts:
                section = 'body' if part == 'word/document.xml' else ('header' if '/header' in part else 'footer')
                relpath = 'word/_rels/' + Path(part).name + '.rels'
                links = {}
                if relpath in trees:
                    for rel in trees[relpath]:
                        target = rel.get('Target', '')
                        if rel.get('Type', '').endswith('/hyperlink') and rel.get('TargetMode') == 'External' and target.startswith(('https://', 'http://', 'mailto:')):
                            links[rel.get('Id')] = target
                for index, p in enumerate(trees[part].iter(W+'p')):
                    pieces = []
                    def walk(el):
                        if el.tag in (W+'del', W+'instrText'): return
                        if el.tag == W+'t': pieces.append(el.text or '')
                        elif el.tag == W+'tab': pieces.append('\t')
                        elif el.tag in (W+'br', W+'cr'): pieces.append('\n')
                        else:
                            for child in el: walk(child)
                            if el.tag == W+'hyperlink' and el.get(R+'id') in links:
                                target = links[el.get(R+'id')]
                                pieces.append(' ['+target+']')
                    walk(p)
                    text=''.join(pieces)
                    if len(text)>200000 or len(paragraphs)>=10000: fail()
                    paragraphs.append(dict(part=part,index=index,section=section,text=text))
            if sum(len(p['text'])+1 for p in paragraphs)>1000000: fail()
            return paragraphs
    except (zipfile.BadZipFile, zlib.error, ET.ParseError, KeyError, OSError, RuntimeError, ValueError, NotImplementedError):
        fail()

def validate_sources(allowlist, reader=None):
    reader = reader or finder_tags
    if not isinstance(allowlist, dict): fail()
    records = allowlist.get('records')
    if not isinstance(records, list) or not records or len(records)>100 or type(allowlist.get('verified_count')) is not int or allowlist['verified_count'] != len(records): fail()
    ids, paths, resumes = set(), set(), []
    for rec in records:
        if not isinstance(rec, dict): fail()
        rid, filename, rawpath, digest = (rec.get(k) for k in ('resume_id','filename','path','sha256'))
        if not isinstance(rid,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',rid) or rid in ids: fail()
        if not all(isinstance(x,str) and x for x in (filename,rawpath,digest)): fail()
        path = Path(rawpath)
        if not path.is_absolute() or filename != path.name or Path(filename).name != filename or path.suffix.lower() != '.docx' or rec.get('format') != 'docx' or not re.fullmatch('[a-fA-F0-9]{64}',digest): fail()
        # Reject symlinks at every source boundary, including ancestors.
        if any(p.is_symlink() for p in (path, *path.parents)): fail()
        resolved = path.resolve()
        if str(resolved) in paths: fail()
        ids.add(rid); paths.add(str(resolved))
        try:
            before=path.lstat()
            if not stat.S_ISREG(before.st_mode) or not before.st_mode & 0o444: fail()
            fd = os.open(str(path), os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os,'O_NONBLOCK',0))
            with os.fdopen(fd,'rb') as f:
                info = os.fstat(f.fileno())
                if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_FILE: fail()
                tags = red_tags(path,reader)
                data = f.read(MAX_FILE+1)
                after = path.stat()
                if (info.st_dev,info.st_ino,info.st_mtime_ns,info.st_size) != (after.st_dev,after.st_ino,after.st_mtime_ns,after.st_size): fail()
        except OSError: fail()
        if len(data)>MAX_FILE or hashlib.sha256(data).hexdigest().lower() != digest.lower(): fail()
        paragraphs = parse_docx(data)
        body = [p['text'] for p in paragraphs if p['section']=='body' and p['text'].strip()]
        # Actual short role line and explicit Summary section, never a generated narrative.
        headline = ''
        for line in body[1:8]:
            clean=line.strip()
            if clean.casefold() in ('education','experience','relevant experience','skills'): break
            if re.search(r'[@|\t\n]|https?://|linkedin\.com',clean,re.I): continue
            if re.search(r'\b(analyst|analytics|engineer|designer|developer|consultant|manager|researcher|specialist|associate|support)\b',clean,re.I) and len(clean)<100:
                headline=line;break
        summary = ''
        for i,line in enumerate(body[:-1]):
            if line.strip().lower() in ('summary','professional summary','profile'):
                summary=body[i+1];break
        if not summary and headline:
            following=body[body.index(headline)+1:]
            if following and 40<=len(following[0].strip())<1000 and not following[0].isupper() and not re.search(r'[@|\t]|https?://',following[0].strip()):
                summary=following[0]  # Exact first paragraph only; never synthesize a summary.
        resumes.append(dict(id=rid,basename=filename,sha256=digest.lower(),paragraphs=paragraphs,sourceText='\n'.join(p['text'] for p in paragraphs),headline=headline,summary=summary,finderTags=tags))
    return resumes

PUBLIC_JOB_FIELDS = ('candidate_id','track','employer','title','source_url','minimum_education','required_experience','requirements','gaps','deadline','start','classification','ai_application_restriction','salary','salary_units','salary_unit','salary_min','salary_max','salary_currency','salary_period','salary_text','compensation','qualification_warnings','warnings','start_date','pay_exact','pay_unit','pay_notes','ats_job_id','employer_requisition_id','start_note','weekly_hours','application_status','submission_ready','research_snapshot_on')

def make_bundle(resumes, jobs):
    if not isinstance(jobs,dict) or not isinstance(jobs.get('records'),list) or len(jobs['records'])>2000: fail()
    public_jobs=[]; job_ids=set()
    for job in jobs['records']:
        if not isinstance(job,dict) or not isinstance(job.get('candidate_id'),str) or not job['candidate_id'] or job['candidate_id'] in job_ids or not isinstance(job.get('title'),str): fail()
        if len(job['candidate_id'])>200 or len(job['title'])>1000: fail()
        for key in ('track','employer','source_url'):
            if key in job and (not isinstance(job[key],str) or len(job[key])>3000): fail()
        job_ids.add(job['candidate_id'])
        public_job={k:job[k] for k in PUBLIC_JOB_FIELDS if k in job}
        manifest=jobs.get('manifest')
        snapshot=manifest.get('verified_on') if isinstance(manifest,dict) else None
        if 'research_snapshot_on' not in public_job and isinstance(snapshot,str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}',snapshot):
            try: datetime.date.fromisoformat(snapshot)
            except ValueError: fail()
            public_job['research_snapshot_on']=snapshot
        public_jobs.append(public_job)
    claims=[]; by_text={}; candidates={k:[] for k in ('fullName','email','phone','location','linkedin','school','degree','major','minor','graduation','gpa')}
    def add(field,value,source):
        if not value or len(value)>2000: fail()
        candidates[field].append(dict(value=value,sources=[source]))
    for r in resumes:
        body=[p for p in r['paragraphs'] if p['section']=='body' and p['text'].strip()]
        # A contact-block name is a sourced candidate, never an identity attestation.
        if body:
            first=body[0]; name=first['text'].strip()
            contact=any(re.search(r'@|linkedin\.com|\(\d{3}\)',p['text'],re.I) for p in body[1:4])
            not_name=r'\b(project|overview|resume|cv|profile|summary|education|university|college|institute|company|corporation|department|labs|analyst|analytics|engineer|support|developer|manager|designer|specialist)\b'
            if contact and re.fullmatch(r"[A-Z][a-z]+(?:[ '-][A-Z][a-z]+){1,4}",name) and not re.search(not_name,name,re.I):
                add('fullName',name,dict(resumeId=r['id'],part=first['part'],paragraph=first['index'],section=first['section']))
        education=False
        for p in r['paragraphs']:
            text=p['text']; source=dict(resumeId=r['id'],part=p['part'],paragraph=p['index'],section=p['section'])
            heading=text.strip().casefold()
            if p['section']=='body' and heading in ('education','academic background','academic qualifications'):
                education=True
            elif p['section']=='body' and heading in ('experience','relevant experience','work experience','professional experience','leadership','leadership experience','projects','case competitions','skills','skills and additional information','certifications'):
                education=False
            if text not in by_text:
                by_text[text]=len(claims);claims.append(dict(id='c'+str(len(claims)+1),text=text,sources=[]))
            claims[by_text[text]]['sources'].append(source)
            if len(claims[by_text[text]]['sources'])>10000:fail()
            for value in re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',text): add('email',value,source)
            # Common literal domain/path is present in both displayed and linked spellings.
            for value in re.findall(r'linkedin\.com/in/[\w%-]+',text,re.I):add('linkedin',value,source)
            for value in re.findall(r'(?<!\w)(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}(?!\d)',text):add('phone',value,source)
            for value in re.findall(r'\bGPA\s*:?\s*([^\n|;]+)',text,re.I):
                exact=value.strip()
                if re.fullmatch(r'\d+(?:\.\d+)?(?:[ \t]*/[ \t]*\d+(?:\.\d+)?)?',exact):add('gpa',exact,source)
            # Explicit labels are intentionally conservative; retain the full exact value.
            for field,label in [('fullName','(?:Full name|Name)'),('location','Location'),('school','(?:School|University|College)'),('degree','Degree'),('major','Major'),('minor','Minor'),('graduation','(?:Graduation|Expected graduation)')]:
                match=re.search(r'(?:^|[\n|;\t])\s*'+label+r'\s*:\s*([^\n|;\t]+)',text,re.I)
                if match:add(field,match.group(1).strip(),source)
            if not re.search(r'(?:^|\n)Degree\s*:',text,re.I):
                for degree in re.findall(r"\b(?:Bachelor|Master|Associate) of (?:Science|Arts|Engineering|Business Administration|Fine Arts)|\bDoctor of (?:Philosophy|Medicine|Law)|\b(?:B\.S\.|B\.A\.|M\.S\.|M\.A\.|M\.B\.A\.|Ph\.D\.)",text):add('degree',degree,source)
            if p in body[:4]:
                location=re.match(r'^\s*([^\n|:\t]{2,100},\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?)\s*(?:\||$)',text)
                if location:add('location',location.group(1).strip(),source)
            if education and heading not in ('education','academic background','academic qualifications'):
                first_cell=re.split(r'[\t|\n]',text.strip(),1)[0].strip()
                is_school=bool(re.search(r'\b(?:University|College|Institute)\b',first_cell,re.I))
                if is_school and len(first_cell)<200 and not re.search(r'\b(?:scholars|program|department)\b|\b(?:minor|major|degree|certification)\s*:',first_cell,re.I):
                    add('school',first_cell,source)
                    dates=re.findall(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:19|20)\d{2}\b',text)
                    if len(dates)==1:add('graduation',dates[0],source)
                major=re.search(r'\b(?:B\.S\.|B\.A\.|M\.S\.|M\.A\.|Bachelor of (?:Science|Arts|Engineering)|Master of (?:Science|Arts|Engineering))\s+in\s+([^|\t\n;]+)',text)
                if major:add('major',major.group(1).strip(),source)
    if len(claims)>30000: fail()
    fields={}
    for field,items in candidates.items():
        grouped={}
        for item in items:
            refs=grouped.setdefault(item['value'],[])
            for source in item['sources']:
                if source not in refs:refs.append(source)
        values=[dict(value=v,sources=s) for v,s in grouped.items()]
        if len(values)>1000 or any(len(v['sources'])>10000 for v in values):fail()
        fields[field]=dict(value=values[0]['value'] if len(values)==1 else '',status='supported' if len(values)==1 else ('needs-review' if values else 'unknown'),candidates=values)
    return dict(schemaVersion=1,verifiedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),resumes=resumes,claims=claims,fields=fields,jobs=public_jobs)

def verify_bundle(bundle, sources):
    if not isinstance(bundle,dict) or bundle.get('schemaVersion')!=1 or bundle.get('resumes')!=sources: fail()
    expected=make_bundle(sources,{'records':bundle.get('jobs')})
    if any(bundle.get(k)!=expected[k] for k in ('claims','fields','jobs')): fail()

def output_path(path):
    path=Path(path)
    if not path.is_absolute(): fail()
    resolved=path.resolve()
    if resolved==REPO or REPO in resolved.parents or path.is_symlink(): fail()
    return resolved

def write_private(path, value):
    path=output_path(path)
    try:
        encoded=json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False).encode('utf-8')
        if len(encoded)>MAX_BUNDLE: fail()
        missing=[]; parent=path.parent
        while not parent.exists():
            missing.append(parent);parent=parent.parent
        for directory in reversed(missing): directory.mkdir(mode=0o700)
        # Existing parents must also be private; do not change permissions silently.
        if stat.S_IMODE(path.parent.stat().st_mode) & 0o077: fail()
        fd=os.open(str(path),os.O_WRONLY|os.O_CREAT|os.O_EXCL|getattr(os,'O_NOFOLLOW',0),0o600)
        try:
            with os.fdopen(fd,'wb') as f: f.write(encoded)
        except Exception:
            path.unlink(missing_ok=True);raise
    except OSError: fail()

class SafeParser(argparse.ArgumentParser):
    def error(self, message):
        self.exit(2,'Resume preparation failed: invalid command arguments.\n')

def main(argv=None):
    parser=SafeParser(description='Local Red-tagged DOCX source preparation; no network.')
    parser.add_argument('command',choices=['import','check'])
    parser.add_argument('--allowlist',required=True)
    parser.add_argument('--jobs');parser.add_argument('--out');parser.add_argument('--bundle')
    parser.add_argument('--bundle-sha256')
    args=parser.parse_args(argv)
    try:
        if args.bundle_sha256 and (not args.bundle or args.command!='check'):fail()
        sources=validate_sources(read_json(args.allowlist))
        if args.command=='import':
            if not args.jobs or not args.out: fail()
            output_path(args.out)
            bundle=make_bundle(sources,read_json(args.jobs))
            # All sources are re-read immediately before any output is created.
            if validate_sources(read_json(args.allowlist)) != sources: fail()
            write_private(args.out,bundle)
            print('Imported %d sources. Output: %s' % (len(sources),args.out))
        else:
            if args.bundle:
                bundle=read_json(args.bundle,args.bundle_sha256)
                verify_bundle(bundle,sources)
            print('Checked %d sources.' % len(sources))
        return 0
    except (PrepError, OSError, ValueError, TypeError, KeyError):
        print('Resume preparation failed: source or input validation failed.',file=sys.stderr)
        return 1
if __name__=='__main__':sys.exit(main())
