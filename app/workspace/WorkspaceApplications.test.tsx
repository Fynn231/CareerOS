import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, it, expect } from 'vitest';
import { WorkspaceApplications } from './WorkspaceApplications';
vi.mock('./actions', () => ({ createApplicationAction: vi.fn(async () => ({})), updateApplicationAction: vi.fn(async () => ({})), deleteApplicationAction: vi.fn(async () => ({})) }));
const applications = [
  { id: 'fiction-1', company: 'Fictional Aurora', role: 'Designer', notes: 'Moon team', stage: 'saved', posting_url: null, applied_date: null },
  { id: 'fiction-2', company: 'Imaginary Labs', role: 'Moon Engineer', notes: '', stage: 'applied', posting_url: null, applied_date: null },
];
const view = () => render(<WorkspaceApplications applications={applications} stages={['saved', 'applied']} />);
it('offline wiring: composes case-insensitive search and stage, counts and resets', async () => {
 const user = userEvent.setup(); view();
 await user.type(screen.getByRole('searchbox'), 'MOON');
 expect(screen.getByText('2 of 2 applications')).toBeInTheDocument();
 await user.selectOptions(screen.getByLabelText('Filter by stage'), 'saved');
 expect(screen.getByText('1 of 2 applications')).toBeInTheDocument();
 expect(screen.queryByDisplayValue('Imaginary Labs')).not.toBeInTheDocument();
 await user.clear(screen.getByRole('searchbox')); await user.type(screen.getByRole('searchbox'), 'AURORA');
 expect(screen.getByText('1 of 2 applications')).toBeInTheDocument();
 await user.click(screen.getByRole('button', {name:'Reset filters'}));
 expect(screen.getByRole('searchbox')).toHaveValue('');
 expect(screen.getByText('2 of 2 applications')).toBeInTheDocument();
});
it('offline wiring: distinguishes initial empty from no matches', async () => {
 const user = userEvent.setup(); const rendered = render(<WorkspaceApplications applications={[]} stages={['saved']} />);
 expect(screen.getByText('No applications yet.')).toBeInTheDocument();
 rendered.rerender(<WorkspaceApplications applications={applications} stages={['saved']} />);
 await user.type(screen.getByRole('searchbox'), 'nonexistent');
 expect(screen.getByText('No applications match your filters.')).toBeInTheDocument();
 expect(screen.queryByText('No applications yet.')).not.toBeInTheDocument();
});
it('offline wiring: uses URL and date controls in create and update forms', () => {
 view();
 for (const input of screen.getAllByLabelText('Posting URL')) expect(input).toHaveAttribute('type', 'url');
 for (const input of screen.getAllByLabelText('Applied date')) expect(input).toHaveAttribute('type', 'date');
});
it('offline wiring: deletion requires confirmation; Cancel and Escape restore focus', async () => {
 const { deleteApplicationAction } = await import('./actions'); vi.mocked(deleteApplicationAction).mockClear();
 const user = userEvent.setup(); view(); const opener = screen.getAllByRole('button', {name:'Delete'})[0];
 await user.click(opener); expect(deleteApplicationAction).not.toHaveBeenCalled();
 const dialog = screen.getByRole('dialog', {name:'Delete application?'});
 await user.click(within(dialog).getByRole('button', {name:'Cancel'})); expect(opener).toHaveFocus();
 await user.click(opener); await user.keyboard('{Escape}'); expect(opener).toHaveFocus();
 expect(dialog).not.toHaveAttribute('open'); expect(deleteApplicationAction).not.toHaveBeenCalled();
 await user.click(opener); await user.click(within(dialog).getByRole('button', {name:'Delete'}));
 expect(deleteApplicationAction).toHaveBeenCalledTimes(1);
 expect(vi.mocked(deleteApplicationAction).mock.calls[0][0].get('id')).toBe('fiction-1');
 expect(opener.closest('form')?.parentElement?.querySelectorAll(':scope > form')).toHaveLength(2);
});
it('offline wiring: pending mutations disable duplicate submits and announce results', async () => {
 const { createApplicationAction, updateApplicationAction, deleteApplicationAction } = await import('./actions');
 const user = userEvent.setup(); view();
 let finish!: (value: {message?:string;error?:string}) => void;
 vi.mocked(createApplicationAction).mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
 await user.type(screen.getAllByLabelText('Company')[0], 'Fictional'); await user.type(screen.getAllByLabelText('Role')[0], 'Tester');
 const create = screen.getByRole('button', {name:'Create'}); await user.click(create); expect(create).toBeDisabled();
 const { act } = await import('@testing-library/react');
 await act(async () => finish({message:'Fiction created'})); expect(screen.getByText('Fiction created')).toHaveAttribute('role','status');
 vi.mocked(updateApplicationAction).mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
 const save = screen.getAllByRole('button', {name:'Save'})[0]; const del = screen.getAllByRole('button', {name:'Delete'})[0];
 await user.click(save); expect(save).toBeDisabled(); expect(del).toBeDisabled();
 await act(async () => finish({error:'Fiction update error'})); expect(screen.getByText('Fiction update error')).toHaveAttribute('role','alert');
 vi.mocked(deleteApplicationAction).mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}));
 await user.click(del); await user.click(within(screen.getByRole('dialog')).getByRole('button', {name:'Delete'}));
 expect(del).toBeDisabled(); expect(save).toBeDisabled();
 await act(async () => finish({message:'Fiction deleted'})); expect(screen.getByText('Fiction deleted')).toHaveAttribute('role','status');
});
