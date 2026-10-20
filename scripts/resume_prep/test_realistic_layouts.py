"""Fictional layout regressions identified during independent source intake."""
import hashlib
import os
import plistlib
import tempfile
import unittest
import zipfile
from typing import Any
from pathlib import Path
from xml.sax.saxutils import escape
from resume_prep import core

class RealisticLayoutTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=os.environ['TMPDIR'])
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def source(self, headline='Cloud & Network Support'):
        paragraphs = [
            'Cameron Example',
            'Springfield, VA | (202) 555-0100 | applicant@example.invalid',
            'linkedin.com/in/example-applicant [https://www.linkedin.com/in/example-applicant/]',
            headline,
            'Entry-level technical candidate with hands-on cloud troubleshooting and Python automation.',
            'EDUCATION',
            'Example University\tMay 2030',
            "B.S. in Statistics | Minor: Physics\tGPA: 3.70 | Dean’s List: 2 semesters",
            'EXPERIENCE',
            'Different University\tExample City, VA',
            'Teaching Assistant\tMay 2029–Jun 2029',
            'Case project modeled an approximate revenue outcome; not an achieved business result.',
        ]
        path = self.root/'fictional.docx'
        body = ''.join('<w:p><w:r><w:t>'+escape(p)+'</w:t></w:r></w:p>' for p in paragraphs)
        with zipfile.ZipFile(path,'w') as z:
            z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
            z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>')
        allow={'verified_count':1,'records':[{'resume_id':'fictional','filename':path.name,'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'format':'docx'}]}
        return core.validate_sources(allow,lambda _:plistlib.dumps(['Red\n99']))

    def test_short_support_and_analytics_headlines_are_not_discarded(self):
        for headline in ['Cloud & Network Support','Technology & Analytics','Technical & User Support']:
            with self.subTest(headline=headline):
                source=self.source(headline)[0]
                self.assertEqual(source['headline'],headline)
                self.assertEqual(source['summary'],'Entry-level technical candidate with hands-on cloud troubleshooting and Python automation.')

    def test_contact_and_tabbed_education_use_actual_evidence_not_job_history(self):
        b: Any=core.make_bundle(self.source(),{'records':[]})
        expected={'fullName':'Cameron Example','location':'Springfield, VA','school':'Example University','degree':'B.S.','major':'Statistics','minor':'Physics','graduation':'May 2030','gpa':'3.70'}
        for key,value in expected.items():
            with self.subTest(field=key):
                self.assertEqual(b['fields'][key]['status'],'supported')
                self.assertEqual(b['fields'][key]['value'],value)
        self.assertNotIn('Different University',[c['value'] for c in b['fields']['school']['candidates']])
        self.assertNotIn('May 2029',[c['value'] for c in b['fields']['graduation']['candidates']])
        self.assertIn('modeled an approximate',b['resumes'][0]['sourceText'])
        self.assertNotIn('workAuthorization',b['fields'])

    def test_equivalent_linkedin_spellings_do_not_create_false_conflicts(self):
        b: Any=core.make_bundle(self.source(),{'records':[]})
        f=b['fields']['linkedin']
        self.assertEqual(f['status'],'supported')
        self.assertEqual(f['value'],'linkedin.com/in/example-applicant')
        self.assertEqual(len(f['candidates'][0]['sources']),1)

    def test_indented_contact_headlines_and_school_program_are_not_lost(self):
        r=self.source()[0]
        r['paragraphs'].insert(8,dict(part='word/document.xml',index=99,section='body',text='College Scholars — Science Program'))
        for p in r['paragraphs']:p['text']='\t'+p['text']
        b: Any=core.make_bundle([r],{'records':[]})
        self.assertEqual(b['fields']['school']['value'],'Example University')
        self.assertEqual(b['fields']['graduation']['value'],'May 2030')
        # Exercise the full ZIP parser again, not just the field mapper.
        path=self.root/'fictional.docx'
        with zipfile.ZipFile(path) as z:parts={n:z.read(n) for n in z.namelist()}
        parts['word/document.xml']=parts['word/document.xml'].replace(b'<w:t>',b'<w:tab/><w:t>')
        with zipfile.ZipFile(path,'w') as z:
            for name,data in parts.items():z.writestr(name,data)
        allow={'verified_count':1,'records':[{'resume_id':'fictional','filename':path.name,'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'format':'docx'}]}
        parsed=core.validate_sources(allow,lambda _:plistlib.dumps(['Red\n99']))[0]
        self.assertEqual(parsed['headline'],'\tCloud & Network Support')
        self.assertTrue(parsed['summary'].startswith('\tEntry-level'))

    def test_orphaned_header_is_not_imported_even_if_a_relationship_exists(self):
        r=self.source()[0]
        path=self.root/'fictional.docx'
        with zipfile.ZipFile(path) as z:parts={n:z.read(n) for n in z.namelist()}
        parts['word/header9.xml']=b'<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Full name: Mallory Fiction</w:t></w:r></w:p></w:hdr>'
        parts['word/_rels/document.xml.rels']=b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="orphan" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header9.xml"/></Relationships>'
        with zipfile.ZipFile(path,'w') as z:
            for name,data in parts.items():z.writestr(name,data)
        paragraphs=core.parse_docx(path.read_bytes())
        self.assertNotIn('word/header9.xml',[p['part'] for p in paragraphs])
        r['paragraphs']=paragraphs
        b: Any=core.make_bundle([r],{'records':[]})
        self.assertEqual(b['fields']['fullName']['value'],'Cameron Example')

    def test_rejects_claim_provenance_beyond_browser_limit(self):
        template=self.source()[0]
        paragraphs=[dict(part='word/document.xml',index=i,section='body',text='') for i in range(101)]
        resumes=[dict(template,id='fictional-'+str(i),paragraphs=paragraphs,sourceText='\n'*100,headline='',summary='') for i in range(100)]
        with self.assertRaises(core.PrepError):core.make_bundle(resumes,{'records':[]})

    def test_public_pay_units_source_ids_and_research_age_survive_import(self):
        job={'candidate_id':'j1','title':'Example role','pay_exact':'$20–$25 per hour','pay_unit':'hour','pay_notes':'Guaranteed hourly','ats_job_id':'ATS-EXAMPLE','employer_requisition_id':'REQ-EXAMPLE','start_note':'Summer 2027; exact date unspecified','weekly_hours':40,'application_status':'Not Applied','submission_ready':False,'parent_evidence':'DO NOT IMPORT PRIVATE PATH'}
        b: Any=core.make_bundle(self.source(),{'manifest':{'verified_on':'2026-10-18'},'records':[job]})
        for key in ('pay_exact','pay_unit','pay_notes','ats_job_id','employer_requisition_id','start_note','weekly_hours','application_status','submission_ready'):
            with self.subTest(field=key):self.assertEqual(b['jobs'][0].get(key),job[key])
        self.assertEqual(b['jobs'][0].get('research_snapshot_on'),'2026-10-18')
        self.assertNotIn('parent_evidence',b['jobs'][0])

if __name__=='__main__':unittest.main()
