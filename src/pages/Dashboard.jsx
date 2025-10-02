import { useState } from 'react';
import TaskCard from '../components/TaskCard.jsx';
import FormField from '../components/FormField.jsx';
import LogViewer from '../components/LogViewer.jsx';
import HistoryList from '../components/HistoryList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { usePipeline } from '../contexts/PipelineContext.jsx';
import { getTaskLabel } from '../utils/formatters.js';

const defaultExportRoot = './export';
const defaultZipPath = './gallery.zip';

async function pickFolder(title, initialDir) {
  const res = await fetch('/api/pick-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, initialDir }),
  });
  if (res.status === 204) return '';
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Folder picker failed');
  }
  const data = await res.json();
  return data.path || '';
}

function Dashboard() {
  const {
    startIngest,
    startBuild,
    startExport,
    clearLogs,
    logs,
    isBusy,
    currentTask,
    history,
    previewAvailable,
    previewRevision,
    connectionState,
  } = usePipeline();

  const [ingestForm, setIngestForm] = useState({ source: '', exportRoot: defaultExportRoot });
  const [buildForm, setBuildForm] = useState({ exportRoot: defaultExportRoot, paginate: '200' });
  const [exportForm, setExportForm] = useState({ exportRoot: defaultExportRoot, zip: defaultZipPath });

  const [ingestFeedback, setIngestFeedback] = useState(null);
  const [buildFeedback, setBuildFeedback] = useState(null);
  const [exportFeedback, setExportFeedback] = useState(null);

  const activeTaskType = currentTask?.type;

  const updateExportRootEverywhere = (value) => {
    setIngestForm((prev) => ({ ...prev, exportRoot: value }));
    setBuildForm((prev) => ({ ...prev, exportRoot: value }));
    setExportForm((prev) => ({ ...prev, exportRoot: value }));
  };

  const handlePickSource = async () => {
    try {
      const path = await pickFolder('Choose source folder', ingestForm.source);
      if (path) setIngestForm((p) => ({ ...p, source: path }));
    } catch (e) {
      setIngestFeedback({ type: 'error', message: e.message });
    }
  };

  const handlePickExport = async () => {
    try {
      const path = await pickFolder('Choose export root', ingestForm.exportRoot || defaultExportRoot);
      if (path) updateExportRootEverywhere(path);
    } catch (e) {
      setBuildFeedback({ type: 'error', message: e.message });
    }
  };

  const handleIngestSubmit = async (event) => {
    event.preventDefault();
    setIngestFeedback(null);
    try {
      await startIngest({ source: ingestForm.source.trim(), exportRoot: ingestForm.exportRoot.trim() });
      setIngestFeedback({ type: 'success', message: 'Ingestion started. Watch the activity feed for progress.' });
    } catch (error) {
      setIngestFeedback({ type: 'error', message: error.message });
    }
  };

  const handleBuildSubmit = async (event) => {
    event.preventDefault();
    setBuildFeedback(null);
    try {
      await startBuild({ exportRoot: buildForm.exportRoot.trim(), paginate: Number(buildForm.paginate) || 200 });
      setBuildFeedback({ type: 'success', message: 'Build started. Preview will refresh when complete.' });
    } catch (error) {
      setBuildFeedback({ type: 'error', message: error.message });
    }
  };

  const handleExportSubmit = async (event) => {
    event.preventDefault();
    setExportFeedback(null);
    try {
      await startExport({ exportRoot: exportForm.exportRoot.trim(), zip: exportForm.zip.trim() });
      setExportFeedback({ type: 'success', message: 'Archive export started. Check the activity feed for completion.' });
    } catch (error) {
      setExportFeedback({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute right-0 top-64 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 space-y-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
                Photo Gallery Automation Studio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
                Orchestrate ingestion, gallery builds, and exports with a friendly control surface. Launch tasks, monitor
                live logs, and preview results without touching the CLI.
              </p>
            </div>
            <StatusBadge
              status={connectionState.connected ? 'connected' : 'disconnected'}
              label={connectionState.connected ? 'Live Link Active' : 'Reconnecting'}
            />
          </div>
          {currentTask ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <StatusBadge status="running" label="Task Running" />
              <span>{getTaskLabel(currentTask.type)} in progress...</span>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No active tasks. You are ready to run the next stage.</div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <TaskCard
            title="1. Ingest & Organize"
            description="Scan your photo source, resolve capture dates, copy originals into structured folders, and generate thumbnails."
            isActive={activeTaskType === 'ingest'}
          >
            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <FormField
                label="Source Path"
                value={ingestForm.source}
                onChange={(value) => setIngestForm((prev) => ({ ...prev, source: value }))}
                onBrowse={handlePickSource}
                placeholder="C:\\Users\\you\\Pictures"
                disabled={isBusy}
                helper="Path to the directory (or mounted drive) containing images."
              />
              <FormField
                label="Export Root"
                value={ingestForm.exportRoot}
                onChange={updateExportRootEverywhere}
                onBrowse={handlePickExport}
                placeholder="./export"
                disabled={isBusy}
                helper="Destination root for organized originals, thumbnails, and metadata."
              />
              {ingestFeedback && (
                <p className={`text-sm ${ingestFeedback.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {ingestFeedback.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Launch Ingestion
              </button>
            </form>
          </TaskCard>

          <TaskCard
            title="2. Build Static Gallery"
            description="Transform processed images into a polished static site with metadata, pagination, and SEO assets."
            isActive={activeTaskType === 'build-site'}
          >
            <form onSubmit={handleBuildSubmit} className="space-y-4">
              <FormField
                label="Export Root"
                value={buildForm.exportRoot}
                onChange={updateExportRootEverywhere}
                onBrowse={handlePickExport}
                placeholder="./export"
                disabled={isBusy}
                helper="Should match the export root used during ingestion."
              />
              <FormField
                label="Items per Page"
                value={buildForm.paginate}
                onChange={(value) => setBuildForm((prev) => ({ ...prev, paginate: value }))}
                type="number"
                placeholder="200"
                disabled={isBusy}
                helper="Control pagination density for month galleries."
              />
              {buildFeedback && (
                <p className={`text-sm ${buildFeedback.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {buildFeedback.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Build Gallery
              </button>
            </form>
          </TaskCard>

          <TaskCard
            title="3. Export for Delivery"
            description="Bundle the entire static site into a portable ZIP ready for clients or hosting providers."
            isActive={activeTaskType === 'export'}
          >
            <form onSubmit={handleExportSubmit} className="space-y-4">
              <FormField
                label="Export Root"
                value={exportForm.exportRoot}
                onChange={updateExportRootEverywhere}
                onBrowse={handlePickExport}
                placeholder="./export"
                disabled={isBusy}
                helper="Folder containing the generated site and assets."
              />
              <FormField
                label="ZIP Output"
                value={exportForm.zip}
                onChange={(value) => setExportForm((prev) => ({ ...prev, zip: value }))}
                placeholder="./gallery.zip"
                disabled={isBusy}
                helper="Destination path for the packaged archive."
              />
              {exportFeedback && (
                <p className={`text-sm ${exportFeedback.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {exportFeedback.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-fuchsia-500/30 transition hover:from-violet-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export Archive
              </button>
            </form>
          </TaskCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <HistoryList history={history} currentTask={currentTask} />
          <div className="lg:col-span-2">
            <LogViewer logs={logs} onClear={clearLogs} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 lg:p-8 shadow-md shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Gallery Preview</h2>
              <p className="text-sm text-slate-400">
                When a build completes, the static gallery is rendered below for instant review.
              </p>
            </div>
            <StatusBadge status={previewAvailable ? 'ready' : 'idle'} label={previewAvailable ? 'Ready' : 'Awaiting Build'} />
          </div>
          {previewAvailable ? (
            <iframe
              key={previewRevision}
              src={`/preview/index.html?rev=${previewRevision}`}
              title="Gallery Preview"
              className="mt-6 h-[28rem] w-full rounded-2xl border border-slate-800/70 bg-white shadow-inner shadow-black/30"
            />
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 p-8 text-center text-slate-400">
              Build the static gallery to unlock a live preview. Once ready, it will appear here automatically.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;