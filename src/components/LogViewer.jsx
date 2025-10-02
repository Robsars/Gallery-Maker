import StatusBadge from './StatusBadge.jsx';
import { formatTimestamp, getTaskLabel } from '../utils/formatters.js';

const LEVEL_BADGES = {
  info: { label: 'Info', tone: 'bg-sky-500/10 text-sky-200 border-sky-400/40' },
  warn: { label: 'Warning', tone: 'bg-amber-500/10 text-amber-200 border-amber-400/40' },
  error: { label: 'Error', tone: 'bg-rose-500/10 text-rose-200 border-rose-400/40' },
};

function LogViewer({ logs, onClear }) {
  const hasLogs = logs.length > 0;

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 shadow-md shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Activity Feed</h2>
          <p className="text-sm text-slate-400">Real-time pipeline output as tasks run.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasLogs}
          className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear Feed
        </button>
      </div>

      <div className="mt-6 h-80 overflow-y-auto pr-2">
        {hasLogs ? (
          <ul className="space-y-3">
            {logs.map((entry, index) => {
              const tone = LEVEL_BADGES[entry.level] ?? LEVEL_BADGES.info;
              return (
                <li
                  key={`${entry.taskId}-${index}`}
                  className={`rounded-2xl border-l-4 ${tone.tone} bg-slate-950/40 px-4 py-3 shadow-inner shadow-black/30`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span>{getTaskLabel(entry.type)}</span>
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-100">
                    <StatusBadge status={entry.level === 'error' ? 'failed' : entry.level === 'warn' ? 'running' : 'completed'} label={tone.label} />
                    <p className="leading-relaxed">{entry.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 p-8 text-center text-slate-500">
            <p className="text-sm">No logs yet. Start a task to see live output.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LogViewer;