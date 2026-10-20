import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PrepareWorkbench } from './PrepareWorkbench';
import { fixture } from '../../lib/resume-prep/test-fixture';
afterEach(()=>vi.unstubAllGlobals());
async function upload(data:unknown) {
 const file=new File([JSON.stringify(data)],'fictional-bundle.json',{type:'application/json'});
 fireEvent.change(screen.getByLabelText('Choose local profile bundle'),{target:{files:[file]}});
}
it('starts empty, imports in tab, filters/selects jobs, overrides, and resets without networking',async()=>{
 const network=vi.fn(()=>{throw new Error('No network allowed');});vi.stubGlobal('fetch',network);vi.stubGlobal('WebSocket',network);
 const b=fixture();b.jobs.push({candidate_id:'job2',title:'Editorial writer',employer:'Example Press'});
 render(<PrepareWorkbench/>);
 expect(screen.getByText(/Local preparation only/)).toBeInTheDocument();
 expect(screen.queryByText('variant-a.docx')).not.toBeInTheDocument();
 await upload(b);
 await screen.findByText('Source resume inventory');
 expect(screen.getByLabelText('Original resume variant')).toHaveValue('analytics');
 fireEvent.change(screen.getByLabelText('Original resume variant'),{target:{value:'writing'}});
 expect(screen.getByText(/Manual override/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filter jobs'),{target:{value:'Editorial'}});
 fireEvent.change(screen.getByLabelText('Supplied job'),{target:{value:'job2'}});
 expect(screen.getByLabelText('Original resume variant')).toHaveValue('writing');
 fireEvent.click(screen.getByRole('button',{name:'Reset local data'}));
 expect(screen.queryByText('Source resume inventory')).not.toBeInTheDocument();
 await waitFor(()=>expect(screen.getByLabelText('Choose local profile bundle')).toHaveFocus());
 expect(network).not.toHaveBeenCalled();
});
it('clears a hidden job selection and manual override when the filter changes',async()=>{
 render(<PrepareWorkbench/>);await upload(fixture());
 await screen.findByText('Source resume inventory');
 fireEvent.change(screen.getByLabelText('Original resume variant'),{target:{value:'writing'}});
 fireEvent.change(screen.getByLabelText('Filter jobs'),{target:{value:'no-matching-job'}});
 expect(screen.getByText('No jobs match this filter.')).toBeInTheDocument();
 expect(screen.getByLabelText('Supplied job')).toHaveValue('');
 expect(screen.queryByLabelText('Original resume variant')).not.toBeInTheDocument();
 expect(screen.queryByText(/Manual override/)).not.toBeInTheDocument();
});
it('shows fixed import errors, conflicts, manual blanks, no jobs and source evidence',async()=>{
 render(<PrepareWorkbench/>);await upload({schemaVersion:999,secret:'never display me'});
 expect(await screen.findByRole('alert')).toHaveTextContent('Invalid');
 expect(screen.queryByText('never display me')).not.toBeInTheDocument();
 const b=fixture();b.fields.school={value:'',status:'needs-review',candidates:[{value:'SQL',sources:b.claims[0].sources},{value:'analytics',sources:b.claims[0].sources}]};
 await upload(b);await screen.findByText(/Conflicting profile facts/);
 expect(screen.getByLabelText('Work authorization')).toHaveValue('');
 expect(screen.getAllByText(/word\/document.xml · paragraph 0/).length).toBeGreaterThan(0);
 b.jobs=[];await upload(b);await waitFor(()=>expect(screen.getByText('No supplied jobs. Import a bundle with job metadata.')).toBeInTheDocument());
});
it('rejects oversized input and renders hostile source strings as inert text in Inspect',async()=>{
 render(<PrepareWorkbench/>);
 const oversized=new File(['{}'],'oversized.json');Object.defineProperty(oversized,'size',{value:17*1024*1024});
 fireEvent.change(screen.getByLabelText('Choose local profile bundle'),{target:{files:[oversized]}});
 expect(await screen.findByRole('alert')).toHaveTextContent('Invalid');
 const b=fixture();const hostile='<img src="https://example.invalid/private" onerror="alert(1)">';
 b.resumes[0].paragraphs[0].text=hostile;b.resumes[0].sourceText=hostile;b.claims[0].text=hostile;
 await upload(b);await screen.findByText('Source resume inventory');
 fireEvent.click(screen.getByRole('button',{name:'Inspect'}));
 expect(screen.getByText('All document evidence')).toBeInTheDocument();
 expect(screen.getAllByText(hostile).length).toBeGreaterThan(0);
 expect(document.querySelector('img')).toBeNull();
});
