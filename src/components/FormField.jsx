function FormField({ label, value, onChange, type = 'text', placeholder, disabled = false, helper, name, onBrowse }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span>{label}</span>
      <div className="mt-2 flex items-stretch gap-2">
        <input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 shadow-inner shadow-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {onBrowse && (
          <button
            type="button"
            onClick={onBrowse}
            disabled={disabled}
            className="rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Browse
          </button>
        )}
      </div>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </label>
  );
}

export default FormField;