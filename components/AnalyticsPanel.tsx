import type { Analytics } from "../domain/analytics";

type Props = { analytics: Analytics };

export function AnalyticsPanel({ analytics }: Props) {
  return (
    <section
      aria-labelledby="analytics-heading"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 id="analytics-heading" className="text-base font-semibold text-slate-900">
        Tracker summary
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Counts are current snapshots of fictional demo records. No conversion rates are inferred.
      </p>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-700">Applications by stage</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(analytics.byStage).map(([stage, count]) => (
            <div key={stage} className="rounded-md bg-stone-50 px-3 py-2">
              <dt className="text-xs capitalize text-slate-500">{stage}</dt>
              <dd className="text-lg font-semibold text-slate-900">{count}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-slate-600">
          Total records: <span className="font-semibold">{analytics.totalCount}</span>
        </p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-medium text-slate-700">Recorded applications by applied date</h3>
        {analytics.recordedApplicationsByDate.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No applied dates recorded.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {analytics.recordedApplicationsByDate.map((row) => (
              <li key={row.date} className="flex justify-between">
                <span>{row.date}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-medium text-slate-700">Follow-ups</h3>
        <p className="mt-1 text-sm text-slate-600">
          Open: {analytics.openFollowUpsCount} · Completed: {analytics.completedFollowUpsCount}
        </p>
        {analytics.overdueFollowUps.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No overdue follow-ups.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-rose-700">
            {analytics.overdueFollowUps.map((f) => (
              <li key={f.id}>
                {f.dueDate} — {f.daysOverdue} day(s) overdue
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          Definitions
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          {analytics.definitions.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}