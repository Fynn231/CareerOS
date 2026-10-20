"use client";

import { useEffect, useState } from "react";
import type { Stage } from "../domain/types";
import { STAGES } from "../domain/types";
import { validateApplicationInput } from "../domain/validation";
import type { Application } from "../domain/types";
import type { ApplicationDraft } from "../domain/types";

type Props = {
  initial?: Application | null;
  onSubmit: (draft: ApplicationDraft) => void;
  onCancel: () => void;
};

export function ApplicationForm({ initial, onSubmit, onCancel }: Props) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [postingUrl, setPostingUrl] = useState(initial?.postingUrl ?? "");
  const [stage, setStage] = useState<Stage>(initial?.stage ?? "saved");
  const [appliedDate, setAppliedDate] = useState(initial?.appliedDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const first = document.getElementById("application-company");
    (first as HTMLInputElement | null)?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const draft: ApplicationDraft = {
      company,
      role,
      postingUrl: postingUrl.trim() === "" ? null : postingUrl.trim(),
      stage,
      appliedDate: appliedDate.trim() === "" ? null : appliedDate.trim(),
      notes,
    };
    const nextErrors = validateApplicationInput(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(draft);
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="application-company" className="text-sm font-medium text-slate-800">
          Company <span className="text-rose-600">*</span>
        </label>
        <input
          id="application-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? "application-company-error" : undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {errors.company && (
          <p id="application-company-error" className="text-sm text-rose-600">
            {errors.company}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="application-role" className="text-sm font-medium text-slate-800">
          Role <span className="text-rose-600">*</span>
        </label>
        <input
          id="application-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-invalid={Boolean(errors.role)}
          aria-describedby={errors.role ? "application-role-error" : undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {errors.role && (
          <p id="application-role-error" className="text-sm text-rose-600">
            {errors.role}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="application-url" className="text-sm font-medium text-slate-800">
          Posting URL (optional)
        </label>
        <input
          id="application-url"
          type="url"
          value={postingUrl}
          onChange={(e) => setPostingUrl(e.target.value)}
          aria-invalid={Boolean(errors.postingUrl)}
          aria-describedby={errors.postingUrl ? "application-url-error" : undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {errors.postingUrl && (
          <p id="application-url-error" className="text-sm text-rose-600">
            {errors.postingUrl}
          </p>
        )}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="application-stage" className="text-sm font-medium text-slate-800">
            Stage
          </label>
          <select
            id="application-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="application-applied" className="text-sm font-medium text-slate-800">
            Applied date (optional)
          </label>
          <input
            id="application-applied"
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            aria-invalid={Boolean(errors.appliedDate)}
            aria-describedby={errors.appliedDate ? "application-applied-error" : undefined}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {errors.appliedDate && (
            <p id="application-applied-error" className="text-sm text-rose-600">
              {errors.appliedDate}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="application-notes" className="text-sm font-medium text-slate-800">
          Notes
        </label>
        <textarea
          id="application-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "application-notes-error" : undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {errors.notes && (
          <p id="application-notes-error" className="text-sm text-rose-600">
            {errors.notes}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {initial ? "Save changes" : "Add application"}
        </button>
      </div>
    </form>
  );
}