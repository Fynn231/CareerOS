import { fireEvent,render,screen } from '@testing-library/react';
import { it,expect,vi } from 'vitest';
import { fixture } from '../../lib/resume-prep/test-fixture';
import { FieldReview } from './FieldReview';

it('requires explicit review and excludes unreviewed values from the prepared JSON',()=>{
 const download=vi.fn();render(<FieldReview bundle={fixture()} jobId="job1" resumeId="analytics" onDownload={download}/>);
 expect(screen.getByRole('button',{name:'Prepare reviewed JSON'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'applicant@example.invalid'}});
 fireEvent.change(screen.getByLabelText('Full name'),{target:{value:'Morgan Example'}});
 fireEvent.click(screen.getByLabelText('Reviewed Email'));
 fireEvent.click(screen.getByRole('button',{name:'Prepare reviewed JSON'}));
 const packet=JSON.parse((screen.getByLabelText('Reviewed packet JSON') as HTMLTextAreaElement).value);
 expect(packet.fields.map((f:{key:string})=>f.key)).toEqual(['email']);
 expect(packet.submissionAuthorized).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Download reviewed fields'}));expect(download).toHaveBeenCalledTimes(1);
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'replacement@example.invalid'}});
 expect(screen.getByLabelText('Reviewed Email')).not.toBeChecked();
 expect(screen.queryByLabelText('Reviewed packet JSON')).not.toBeInTheDocument();
});
