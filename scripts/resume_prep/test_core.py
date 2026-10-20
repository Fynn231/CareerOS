import hashlib, json, os, plistlib, stat, sys, tempfile, unittest, zipfile
from pathlib import Path
from unittest.mock import patch
from resume_prep import core

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=os.environ['TMPDIR'])
        self.root = Path(self.tmp.name)
        self.source = self.root/'fiction.docx'
        with zipfile.ZipFile(self.source, 'w') as z:
            z.writestr('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
            z.writestr('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Alex Example</w:t><w:tab/><w:t>Analyst</w:t><w:br/><w:t>Projected 12% improvement</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>alex@example.invalid</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:headerReference xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" w:type="default" r:id="header1"/><w:footerReference xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" w:type="default" r:id="footer1"/></w:sectPr></w:body></w:document>')
            z.writestr('word/header1.xml','<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Example University</w:t></w:r></w:p></w:hdr>')
            z.writestr('word/footer1.xml','<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>GPA: 3.70</w:t></w:r></w:p></w:ftr>')
            z.writestr('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="header1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="footer1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
        self.record = dict(resume_id='r1',filename=self.source.name,path=str(self.source),sha256=hashlib.sha256(self.source.read_bytes()).hexdigest(),format='docx')
        self.allow = dict(verified_count=1,records=[self.record])
        self.tags = lambda p: plistlib.dumps(['rEd\n99'])
    def tearDown(self): self.tmp.cleanup()
    def test_parse_provenance_and_original_unchanged(self):
        before=self.source.read_bytes()
        resumes=core.validate_sources(self.allow,self.tags)
        bundle=core.make_bundle(resumes,{'records':[]})
        self.assertIn('Projected 12%',bundle['resumes'][0]['sourceText'])
        self.assertIn('\t',bundle['resumes'][0]['sourceText'])
        self.assertEqual(len(bundle['resumes'][0]['paragraphs']),4)
        self.assertEqual(bundle['fields']['email']['value'],'alex@example.invalid')
        self.assertEqual(bundle['fields']['gpa']['value'],'3.70')
        self.assertTrue(bundle['claims'][0]['sources'][0]['part'])
        self.assertEqual(before,self.source.read_bytes())
    def test_fail_closed(self):
        for tags in [lambda p: plistlib.dumps(['Blue\n6']),lambda p:b'bad',lambda p:plistlib.dumps(['Redwood\n6'])]:
            with self.assertRaises(core.PrepError):core.validate_sources(self.allow,tags)
        for change in [{'sha256':'0'*64},{'path':str(self.root/'missing.docx')},{'filename':'other.docx'}]:
            with self.assertRaises(core.PrepError):core.validate_sources(dict(verified_count=1,records=[dict(self.record,**change)]),self.tags)
        with self.assertRaises(core.PrepError):core.validate_sources(dict(self.allow,verified_count=2),self.tags)
        with self.assertRaises(core.PrepError):core.validate_sources(dict(verified_count=2,records=[self.record,self.record]),self.tags)
        link=self.root/'link.docx';link.symlink_to(self.source)
        with self.assertRaises(core.PrepError):core.validate_sources(dict(verified_count=1,records=[dict(self.record,path=str(link),filename=link.name)]),self.tags)
    def test_unsafe_zip(self):
        import io
        original=self.source.read_bytes()
        with zipfile.ZipFile(io.BytesIO(original)) as z:
            parts={n:z.read(n) for n in z.namelist()}
        bad_xml='<!DOCTYPE x [<!ENTITY x "bad">]><x/>'
        for extra in [{'../evil':b'bad'},{'word/document.xml':bad_xml.encode()},{'word/document.xml':bad_xml.encode('utf-16')},{'word/document.xml':b'<x>'*70+b'</x>'*70}]:
            with self.subTest(extra=list(extra)):
                with zipfile.ZipFile(self.source,'w') as z:
                    for name,body in dict(parts,**extra).items():z.writestr(name,body)
                self.record['sha256']=hashlib.sha256(self.source.read_bytes()).hexdigest()
                with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)
        encrypted=bytearray(original)
        encrypted[6:8]=(int.from_bytes(encrypted[6:8],'little')|1).to_bytes(2,'little')
        central=encrypted.index(b'PK\x01\x02')
        encrypted[central+8:central+10]=(int.from_bytes(encrypted[central+8:central+10],'little')|1).to_bytes(2,'little')
        for raw in [b'not a ZIP',bytes(encrypted)]:
            self.source.write_bytes(raw);self.record['sha256']=hashlib.sha256(raw).hexdigest()
            with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)
    def test_private_output_boundary_exclusive(self):
        with self.assertRaises(core.PrepError):core.write_private(Path.cwd()/'leak.json',{})
        out=self.root/'private'/'bundle.json';core.write_private(out,{'ok':True})
        self.assertEqual(stat.S_IMODE(out.stat().st_mode),0o600)
        self.assertEqual(stat.S_IMODE(out.parent.stat().st_mode),0o700)
        with self.assertRaises(core.PrepError):core.write_private(out,{})
        link=self.root/'repo';link.symlink_to(Path.cwd(),target_is_directory=True)
        with self.assertRaises(core.PrepError):core.write_private(link/'leak.json',{})
    def test_conflicts_and_exact_dedup(self):
        r=core.validate_sources(self.allow,self.tags)[0]
        other=dict(r,id='r2',paragraphs=[dict(r['paragraphs'][0]),dict(part='word/document.xml',index=1,section='body',text='other@example.invalid')])
        b=core.make_bundle([r,other],{'records':[]})
        self.assertEqual(b['fields']['email']['status'],'needs-review')
        self.assertEqual(b['fields']['email']['value'],'')
        self.assertEqual(len(b['claims'][0]['sources']),2)
    def test_no_write_on_partial_failure(self):
        allow=self.root/'allow.json'; jobs=self.root/'jobs.json';out=self.root/'out.json'
        allow.write_text(json.dumps(dict(verified_count=2,records=[self.record,dict(self.record,resume_id='r2',path=str(self.root/'absent.docx'))])))
        jobs.write_text('{"records":[]}')
        with patch.object(core,'finder_tags',self.tags):
            self.assertEqual(core.main(['import','--allowlist',str(allow),'--jobs',str(jobs),'--out',str(out)]),1)
        self.assertFalse(out.exists())
    def test_real_docx_type_required(self):
        with zipfile.ZipFile(self.source,'w') as z:
            z.writestr('[Content_Types].xml','<Types/>')
            z.writestr('word/document.xml','<notWord/>')
        self.record['sha256']=hashlib.sha256(self.source.read_bytes()).hexdigest()
        with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)
    def test_metadata_subprocess_hex_and_unavailable(self):
        from types import SimpleNamespace
        raw=plistlib.dumps(['RED\n42'])
        with patch.object(core.subprocess,'run',return_value=SimpleNamespace(stdout=raw.hex().encode())) as run:
            self.assertEqual(core.finder_tags(self.source),raw)
            self.assertEqual(run.call_args.args[0],['/usr/bin/xattr','-px','com.apple.metadata:_kMDItemUserTags',str(self.source)])
        with patch.object(core.subprocess,'run',side_effect=FileNotFoundError()):
            with self.assertRaises(core.PrepError):core.finder_tags(self.source)
    def test_recheck_all_before_write(self):
        allow=self.root/'allow.json';jobs=self.root/'jobs.json';out=self.root/'out.json'
        allow.write_text(json.dumps(self.allow));jobs.write_text('{"records":[]}')
        tags=[plistlib.dumps(['Red\n8']),plistlib.dumps(['Blue\n8'])]
        with patch.object(core,'finder_tags',side_effect=tags):
            self.assertEqual(core.main(['import','--allowlist',str(allow),'--jobs',str(jobs),'--out',str(out)]),1)
        self.assertFalse(out.exists())
    def test_profile_mismatch_blocks_check(self):
        sources=core.validate_sources(self.allow,self.tags);b=core.make_bundle(sources,{'records':[]})
        b['fields']['email']['value']='fake@example.invalid'
        with self.assertRaises(core.PrepError):core.verify_bundle(b,sources)
    def test_new_nested_parents_private(self):
        out=self.root/'a'/'b'/'bundle.json';core.write_private(out,{})
        self.assertEqual(stat.S_IMODE((self.root/'a').stat().st_mode),0o700)
    def test_hyperlinks_and_bombs(self):
        with zipfile.ZipFile(self.source) as z:parts={n:z.read(n) for n in z.namelist()}
        parts['word/header1.xml']=b'<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:hyperlink r:id="link"><w:r><w:t>Portfolio</w:t></w:r></w:hyperlink></w:p></w:hdr>'
        parts['word/_rels/header1.xml.rels']=b'<Relationships><Relationship Id="link" Type="example/hyperlink" TargetMode="External" Target="https://example.invalid/portfolio"/></Relationships>'
        with zipfile.ZipFile(self.source,'w') as z:
            for name,data in parts.items():z.writestr(name,data)
        self.record['sha256']=hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.assertIn('[https://example.invalid/portfolio]',core.validate_sources(self.allow,self.tags)[0]['sourceText'])
        with zipfile.ZipFile(self.source,'a',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('bomb.bin',b'0'*100000)
        self.record['sha256']=hashlib.sha256(self.source.read_bytes()).hexdigest()
        with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)

    def test_nonregular_unreadable_and_missing_metadata(self):
        os.chmod(self.source,0)
        try:
            with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)
        finally:os.chmod(self.source,0o600)
        with self.assertRaises(core.PrepError):core.validate_sources(self.allow,lambda p:plistlib.dumps([]))
        self.source.unlink();os.mkfifo(self.source)
        with self.assertRaises(core.PrepError):core.validate_sources(self.allow,self.tags)
    def test_bounded_json_and_fixed_errors(self):
        data=self.root/'input.json';data.write_text('{"records":[],"records":[]}')
        with self.assertRaises(core.PrepError):core.read_json(data)
        for raw in ['{"amount":1e999}', '{"requirements":{"__proto__":{}}}']:
            data.write_text(raw)
            with self.assertRaises(core.PrepError):core.read_json(data)
    def test_explicit_education_and_no_name_guess(self):
        r=core.validate_sources(self.allow,self.tags)[0]
        r['paragraphs']=[dict(part='word/document.xml',index=0,section='body',text='Project Overview'),dict(part='word/document.xml',index=1,section='body',text='Full name: Alex River Example\nBachelor of Science\nMajor: Statistics\nMinor: Writing\nGraduation: May 2030')]
        b=core.make_bundle([r],{'records':[{'candidate_id':'j','title':'Analyst','salary':{'amount':20,'unit':'hour'},'gaps':['Manual qualification warning'],'private_notes':'omit'}]})
        self.assertEqual(b['fields']['fullName']['value'],'Alex River Example')
        self.assertEqual(b['fields']['degree']['value'],'Bachelor of Science')
        self.assertEqual(b['fields']['major']['value'],'Statistics')
        self.assertNotIn('private_notes',b['jobs'][0])
        self.assertEqual(b['jobs'][0]['salary']['unit'],'hour')

    def test_gpa_keeps_precision_and_rejects_ranges(self):
        r=core.validate_sources(self.allow,self.tags)[0]
        for raw,expected in [('GPA: 3.7059 / 4.0000','3.7059 / 4.0000'),('GPA: 3.7-3.9',''),('GPA: approximate 3.7','')]:
            r['paragraphs']=[dict(part='word/document.xml',index=0,section='body',text=raw)]
            self.assertEqual(core.make_bundle([r],{'records':[]})['fields']['gpa']['value'],expected)

    def test_fictional_cli_roundtrip_and_stale_export_block(self):
        import subprocess
        if sys.platform!='darwin':self.skipTest('Real macOS metadata integration on synthetic temporary files only')
        # Only this newly created fictional fixture receives a temporary Finder tag.
        subprocess.run(['/usr/bin/xattr','-wx','com.apple.metadata:_kMDItemUserTags',plistlib.dumps(['Red\n42']).hex(),str(self.source)],check=True,capture_output=True)
        env=dict(os.environ)
        allow=self.root/'allow.json';jobs=self.root/'jobs.json';bundle=self.root/'profile.resume-bundle.json';out=self.root/'choices.resume-recommendations.json'
        allow.write_text(json.dumps(self.allow));jobs.write_text(json.dumps({'records':[{'candidate_id':'fictional-job','title':'Analyst','requirements':'Projected improvement'}]}))
        def run(args):
            return subprocess.run(args,cwd=str(core.REPO),env=env,capture_output=True,text=True,timeout=20)
        imported=run(['python3','scripts/resume-prep.py','import','--allowlist',str(allow),'--jobs',str(jobs),'--out',str(bundle)])
        self.assertEqual(imported.returncode,0,imported.stderr)
        self.assertNotIn('Alex Example',imported.stdout)
        digest=hashlib.sha256(bundle.read_bytes()).hexdigest()
        checked=run(['python3','scripts/resume-prep.py','check','--allowlist',str(allow),'--bundle',str(bundle),'--bundle-sha256',digest])
        self.assertEqual(checked.returncode,0,checked.stderr)
        mismatch=run(['python3','scripts/resume-prep.py','check','--allowlist',str(allow),'--bundle',str(bundle),'--bundle-sha256','0'*64])
        self.assertNotEqual(mismatch.returncode,0)
        args=['node','scripts/resume-recommend.mjs','--bundle',str(bundle),'--allowlist',str(allow),'--out',str(out)]
        ranked=run(args)
        self.assertEqual(ranked.returncode,0,ranked.stderr)
        self.assertEqual(stat.S_IMODE(out.stat().st_mode),0o600)
        result=json.loads(out.read_text())['recommendations'][0]
        self.assertEqual(result['selectedResumeId'],'r1')
        self.assertIn('Projected 12% improvement',json.dumps(result))
        stale=self.root/'blocked.json';args[-1]=str(stale)
        self.source.write_bytes(b'changed fictional source')
        blocked=run(args)
        self.assertNotEqual(blocked.returncode,0)
        self.assertFalse(stale.exists())
        self.assertNotIn('Alex Example',blocked.stderr)

if __name__=='__main__':unittest.main()
