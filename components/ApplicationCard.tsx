"use client";

import { useState } from "react";
import type { Application, FollowUp } from "../domain/types";
import { validateFollowUpInput } from "../domain/validation";

type Props = {
  application: Application;
  followUps: FollowUp[];
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCreateFollowUp: (dueDate: string, notes: string) => void;
  onCompleteFollowUp: (id: string) => void;
  onReopenFollowUp: (id: string) => void;
};

const stageColors: Record<string, string> = {
  saved: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-800",
  screening: "bg-amber-100 text-amber-800",
  interview: "bg-teal-100 text-teal-800",
  offer: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  withdrawn: "bg-slate-200 text-slate-700",
};

export function ApplicationCard({
  application: app,
  followUps,
  onEdit,
  onDelete,
  onCreateFollowUp,
  onCompleteFollowUp,
  onReopenFollowUp,
}: Props) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [fuNotes, setFuNotes] = useState("");
  const [fuErrors, setFuErrors] = useState<Record<string, string>>({});

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateFollowUpInput({
      applicationId: app.id,
      dueDate,
      notes: fuNotes,
    });
    setFuErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onCreateFollowUp(dueDate, fuNotes);
    setDueDate("");
    setFuNotes("");
    setFollowUpOpen(false);
  };

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {app.company}
          </h3>
          <p className="text-sm text-slate-600">{app.role}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${stageColors[app.stage] ?? "bg-slate-100 text-slate-700"}`}
        >
          {app.stage}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        {app.postingUrl && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Posting
            </dt>
            <dd className="truncate">
              <a
                href={app.postingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline-offset-2 hover:underline"
              >
                {app.postingUrl}
              </a>
            </dd>
          </div>
        )}
        {app.appliedDate && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Applied date (user-reported)
            </dt>
            <dd className="text-slate-700">{app.appliedDate}</dd>
          </div>
        )}
        {app.notes && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Notes
            </dt>
            <dd className="whitespace-pre-wrap text-slate-700">{app.notes}</dd>
          </div>
        )}
      </dl>

      {followUps.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Follow-ups
          </h4>
          <ul className="mt-2 space-y-2">
            {followUps.map((f) => (
              <li
                key={f.id}
                className="flex items-start justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">Due {f.dueDate}</p>
                  {f.notes && <p className="text-slate-600">{f.notes}</p>}
                  <p className="text-xs text-slate-500">
                    {f.completedAt ? `Completed ${f.completedAt.slice(0, 10)}` : "Open"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    f.completedAt
                      ? onReopenFollowUp(f.id)
                      : onCompleteFollowUp(f.id)
                  }
                  className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {f.completedAt ? "Reopen" : "Complete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <button
          type="button"
          onClick={() => setFollowUpOpen((v) => !v)}
          className="text-sm font-medium text-teal-700 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {followUpOpen ? "Cancel follow-up" : "Add follow-up"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            Delete
          </button>
        </div>
      </div>

      {followUpOpen && (
        <form onSubmit={handleFollowUpSubmit} className="mt-3 grid gap-3 rounded-md bg-stone-50 p-3">
          <div className="grid gap-1.5">
            <label htmlFor={`fu-date-${app.id}`} className="text-xs font-medium text-slate-700">
              Due date
            </label>
            <input
              id={`fu-date-${app.id}`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-invalid={Boolean(fuErrors.dueDate)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {fuErrors.dueDate && <p className="text-sm text-rose-600">{fuErrors.dueDate}</p>}
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={`fu-notes-${app.id}`} className="text-xs font-medium text-slate-700">
              Notes
            </label>
            <input
              id={`fu-notes-${app.id}`}
              value={fuNotes}
              onChange={(e) => setFuNotes(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Save follow-up
            </button>
          </div>
        </form>
      )}
    </article>
  );
}