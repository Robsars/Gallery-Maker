function TaskCard({ title, description, isActive = false, children }) {
  const borderClass = isActive
    ? 'border-sky-400/80 shadow-lg shadow-sky-500/20'
    : 'border-slate-800/80 shadow-md shadow-black/30';

  return (
    <section
      className={`rounded-3xl border ${borderClass} bg-slate-900/60 backdrop-blur-xl p-6 lg:p-8 transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
        {isActive && (
          <span className="flex h-8 items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-3 text-xs font-medium uppercase tracking-wide text-sky-200">
            Running
          </span>
        )}
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

export default TaskCard;