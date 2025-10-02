import StatusBadge from './StatusBadge.jsx';
import { formatDuration, formatLongTimestamp, getTaskLabel } from '../utils/formatters.js';

function HistoryList({ history, currentTask }) {
  const entries = Object.entries(history || {})
    .map(([type, details]) => ({ type, ...details }))
    .sort((a, b) => {
      const aTime = new Date(a.finishedAt || 0).getTime();
      const bTime = new Date(b.finishedAt || 0).getTime();
      return bTime - aTime;
    });

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 shadow-md shadow-black/30">
      <h2 className="text-xl font-semibold text-slate-100">Recent Runs</h2>
      <p className="mt-1 text-sm text-slate-400">Latest results for each stage of the pipeline.</p>

      <div className="mt-6 space-y-4">
        {currentTask ? (
          <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">{getTaskLabel(currentTask.type)}</p>
                <p className="text-xs text-slate-300">Started {formatLongTimestamp(currentTask.startedAt)}</p>
              </div>
              <StatusBadge status="running" label="In Progress" />
            </div>
          </div>
        ) : null}

        {entries.length ? (
          entries.map((entry) => {
            const status = entry.status === 'failed' ? 'failed' : 'completed';
            return (
              <article
                key={entry.type}
                className="rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-4 shadow-inner shadow-black/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{getTaskLabel(entry.type)}</p>
                    <p className="text-xs text-slate-400">Finished {formatLongTimestamp(entry.finishedAt)}</p>
                  </div>
                  <StatusBadge status={status} label={entry.status === 'failed' ? 'Failed' : 'Completed'} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="rounded-full border border-slate-700/70 px-2 py-1">Duration: {formatDuration(entry.durationMs)}</span>
                  {entry.params?.exportRoot && (
                    <span className="rounded-full border border-slate-700/70 px-2 py-1">
                      Export Root: {entry.params.exportRoot}
                    </span>
                  )}
                  {entry.params?.source && (
                    <span className="rounded-full border border-slate-700/70 px-2 py-1">
                      Source: {entry.params.source}
                    </span>
                  )}
                  {entry.params?.zip && (
                    <span className="rounded-full border border-slate-700/70 px-2 py-1">
                      ZIP: {entry.params.zip}
                    </span>
                  )}
                </div>
                {entry.error && (
                  <p className="mt-3 text-xs text-rose-300">{entry.error}</p>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-4 py-6 text-center text-slate-500">
            No completed runs yet. Launch a task to populate history.
          </div>
        )}
      </div>
    </section>
  );
}

export default HistoryList;