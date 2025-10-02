const STYLES = {
  running: 'bg-sky-500/10 text-sky-200 border-sky-400/40',
  completed: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
  failed: 'bg-rose-500/10 text-rose-200 border-rose-400/40',
  idle: 'bg-slate-500/10 text-slate-300 border-slate-400/30',
  ready: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
  connected: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
  disconnected: 'bg-amber-500/10 text-amber-200 border-amber-400/40',
};

function StatusBadge({ status = 'idle', label }) {
  const style = STYLES[status] || STYLES.idle;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label || status}
    </span>
  );
}

export default StatusBadge;