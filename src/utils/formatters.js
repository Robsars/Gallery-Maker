const TASK_LABELS = {
  ingest: 'Ingestion',
  'build-site': 'Build Static Site',
  export: 'Export Archive',
};

export function getTaskLabel(type) {
  return TASK_LABELS[type] || type;
}

export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatLongTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });
}

export function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return '—';
  }
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const segments = [];
  if (hours) segments.push(`${hours}h`);
  if (minutes) segments.push(`${minutes}m`);
  segments.push(`${seconds}s`);
  return segments.join(' ');
}