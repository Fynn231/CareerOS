"use client";

import { useActionState, useState, useRef } from "react";
import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  type WorkspaceFormState,
} from "./actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const emptyState: WorkspaceFormState = {};

type DbApplication = {
  id: string;
  company: string;
  role: string;
  stage: string;
  notes: string | null;
  posting_url: string | null;
  applied_date: string | null;
};

type Props = {
  applications: DbApplication[];
  stages: readonly string[];
};

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={name === "postingUrl" ? "url" : name === "appliedDate" ? "date" : "text"}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

export function WorkspaceApplications({ applications, stages }: Props) {
  const [createState, createAction, createPending] = useActionState(createApplicationAction, emptyState);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const matching = filterApplications(applications, search, stageFilter);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add application</h2>
        <form action={createAction} className="mt-4 grid gap-3">
          <Field label="Company" name="company" required />
          <Field label="Role" name="role" required />
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Stage</span>
            <select name="stage" defaultValue="saved" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <Field label="Posting URL" name="postingUrl" />
          <Field label="Applied date" name="appliedDate" />
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Notes</span>
            <textarea name="notes" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {createState.error && <p role="alert" className="text-sm text-rose-600">{createState.error}</p>}
          {createState.message && <p role="status" className="text-sm text-teal-700">{createState.message}</p>}
          <button disabled={createPending} type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white">
            Create
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Applications</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Search applications</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Filter by stage</span>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2">
              <option value="">All stages</option>
              {stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </label>
          <button type="button" className="justify-self-start rounded-md border border-slate-300 px-3 py-2 text-sm"
            onClick={() => { setSearch(""); setStageFilter(""); }}>
            Reset filters
          </button>
        </div>
        <p role="status">{matching.length} of {applications.length} applications</p>
        {applications.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No applications yet.</p>
        ) : matching.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No applications match your filters.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {matching.map((application) => (
              <WorkspaceApplicationRow
                key={application.id}
                application={application}
                stages={stages}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkspaceApplicationRow({
  application,
  stages,
}: {
  application: DbApplication;
  stages: readonly string[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateApplicationAction, emptyState);
  const [stage, setStage] = useState(application.stage);
  const [syncedStage, setSyncedStage] = useState(application.stage);
  if (syncedStage !== application.stage) {
    setSyncedStage(application.stage);
    setStage(application.stage);
  }
  const deleteApplicationActionState = (_prev: WorkspaceFormState, formData: FormData) => deleteApplicationAction(formData);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteApplicationActionState, emptyState);

  const [confirming, setConfirming] = useState(false);
  const deleteForm = useRef<HTMLFormElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const stageSelect = useRef<HTMLSelectElement>(null);
  const closeConfirmation = () => { setConfirming(false); deleteButton.current?.focus(); };
  return (
    <article className="rounded-md border border-stone-200 p-4">
      <form
        action={updateAction}
        onReset={() => {
          // Native action-form reset restores defaults after this event; reapply only the stage once it finishes.
          queueMicrotask(() => {
            if (stageSelect.current) stageSelect.current.value = stage;
          });
        }}
        className="grid gap-3"
      >
        <input type="hidden" name="id" value={application.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company" name="company" defaultValue={application.company} required />
          <Field label="Role" name="role" defaultValue={application.role} required />
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Stage</span>
            <select ref={stageSelect} name="stage" value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {stages.map((stageOption) => (
                <option key={stageOption} value={stageOption}>
                  {stageOption}
                </option>
              ))}
            </select>
          </label>
          <Field label="Posting URL" name="postingUrl" defaultValue={application.posting_url} />
          <Field label="Applied date" name="appliedDate" defaultValue={application.applied_date} />
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea name="notes" defaultValue={application.notes ?? ""} rows={2} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        {updateState.error && <p role="alert" className="text-sm text-rose-600">{updateState.error}</p>}
        {updateState.message && <p role="status" className="text-sm text-teal-700">{updateState.message}</p>}
        <div className="flex gap-2">
          <button disabled={updatePending || deletePending} type="submit" className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white">
            Save
          </button>
        </div>
      </form>
      <form ref={deleteForm} action={deleteAction} className="mt-3 flex gap-2">
        <input type="hidden" name="id" value={application.id} />
        <button disabled={updatePending || deletePending} ref={deleteButton} type="button" onClick={() => setConfirming(true)} className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700">
          Delete
        </button>
      </form>
      <ConfirmDialog open={confirming} title="Delete application?" description={`Delete ${application.company} — ${application.role}?`} onCancel={closeConfirmation} onConfirm={() => { closeConfirmation(); deleteForm.current?.requestSubmit(); }} />
      {deleteState.error && <p role="alert" className="mt-2 text-sm text-rose-600">{deleteState.error}</p>}
      {deleteState.message && <p role="status" className="mt-2 text-sm text-teal-700">{deleteState.message}</p>}
    </article>
  );
}
export function filterApplications<T extends { company: string; role: string; notes: string | null; stage: string }>(applications: T[], search: string, stage: string): T[] {
  const query = search.trim().toLowerCase();
  return applications.filter(application => (!stage || application.stage === stage) && [application.company, application.role, application.notes ?? ""].some(value => value.toLowerCase().includes(query)));
}
