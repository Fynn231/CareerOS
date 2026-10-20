"use client";

import { useEffect, useMemo, useRef, useReducer, useState } from "react";
import { trackerReducer } from "../state/reducer";
import { createDemoState } from "../demo/fixtures";
import { filterApplications } from "../domain/applications";
import { computeAnalytics } from "../domain/analytics";
import { STAGES, type Stage, type ApplicationDraft } from "../domain/types";
import { DemoNotice } from "./DemoNotice";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationForm } from "./ApplicationForm";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { ConfirmDialog } from "./ConfirmDialog";

export function TrackerApp() {
  const [state, dispatch] = useReducer(trackerReducer, undefined, createDemoState);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [now, setNow] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editingApplication = editingId
    ? state.applications.find((a) => a.id === editingId) ?? null
    : null;

  const filtered = useMemo(
    () => filterApplications(state.applications, { query, stage: stageFilter }),
    [state.applications, query, stageFilter],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date().toLocaleDateString("en-CA"));
  }, []);

  const effectiveNow = now ?? "2026-10-15";
  const analytics = useMemo(
    () => computeAnalytics(state, effectiveNow),
    [state, effectiveNow],
  );

  const followUpsByApp = useMemo(() => {
    const map = new Map<string, typeof state.followUps>();
    for (const f of state.followUps) {
      const list = map.get(f.applicationId) ?? [];
      list.push(f);
      map.set(f.applicationId, list);
    }
    return map;
  }, [state]);

  const newId = () => crypto.randomUUID();
  const formDialogRef = useRef<HTMLDialogElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = formDialogRef.current;
    if (!dialog) return;
    if (formOpen && !dialog.open) dialog.showModal();
    if (!formOpen && dialog.open) dialog.close();
  }, [formOpen]);

  const openCreate = () => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setEditingId(id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    window.setTimeout(() => lastFocusRef.current?.focus(), 0);
  };

  const handleFormSubmit = (draft: ApplicationDraft) => {
    if (editingId) {
      dispatch({
        type: "application/update",
        id: editingId,
        patch: draft,
        meta: { now: new Date().toISOString() },
      });
    } else {
      dispatch({
        type: "application/add",
        draft,
        meta: { id: newId(), now: new Date().toISOString() },
      });
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (deletingId) {
      dispatch({ type: "application/delete", id: deletingId });
      setDeletingId(null);
    }
  };

  // dialog open sync
  // (native dialog handled via effect? ConfirmDialog handles; FormDialog inline below uses manual)

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-slate-900">
      <DemoNotice />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col bg-[#0f1b2d] p-6 text-slate-100 md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-300">
              CareerOS
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Application tracker</h1>
            <p className="mt-1 text-sm text-slate-300">
              Fictional demo workspace. Credentials and storage are intentionally absent.
            </p>
          </div>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
            Data resets on refresh. Nothing is persisted.
          </div>
          <a
            href="/login"
            className="mt-auto inline-block rounded-md bg-teal-500/20 px-3 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-500/30"
          >
            Secure workspace
          </a>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Applications
              </h2>
              <p className="text-sm text-slate-600">
                Fictional demo records. Applied vs. submitted vs. verified statuses are not inferred.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Add application
            </button>
          </header>

          <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="search" className="text-sm font-medium text-slate-700">
                    Search
                  </label>
                  <input
                    id="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Company, role, notes, URL"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="stage-filter" className="text-sm font-medium text-slate-700">
                    Stage
                  </label>
                  <select
                    id="stage-filter"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as Stage | "all")}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:w-44"
                  >
                    <option value="all">All stages</option>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-slate-500">
                  No applications match these filters.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      followUps={followUpsByApp.get(app.id) ?? []}
                      onEdit={() => openEdit(app.id)}
                      onDelete={() => setDeletingId(app.id)}
                      onCreateFollowUp={(dueDate, notes) =>
                        dispatch({
                          type: "followup/add",
                          draft: { applicationId: app.id, dueDate, notes },
                          meta: { id: newId(), now: new Date().toISOString() },
                        })
                      }
                      onCompleteFollowUp={(id) =>
                        dispatch({
                          type: "followup/complete",
                          id,
                          now: new Date().toISOString(),
                        })
                      }
                      onReopenFollowUp={(id) =>
                        dispatch({ type: "followup/reopen", id })
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <AnalyticsPanel analytics={analytics} />
          </div>
        </main>
      </div>

      <dialog
        ref={formDialogRef}
        onCancel={closeForm}
        data-testid="application-dialog"
        aria-labelledby="application-form-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl backdrop:bg-slate-900/50"
      >
        <h2 id="application-form-title" className="text-lg font-semibold text-slate-900">
          {editingId ? "Edit application" : "Add application"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Fictional demo record. {editingId ? "Changes stay in memory only." : "Nothing is persisted."}
        </p>
        <div className="mt-4">
          <ApplicationForm
            initial={editingApplication}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </div>
      </dialog>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete application?"
        description="This removes the fictional demo record and its follow-ups from memory. This cannot be undone in this demo."
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}