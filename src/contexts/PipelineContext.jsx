import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
  const [status, setStatus] = useState({ currentTask: null, history: {} });
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const lastBuildTimestampRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Unable to load pipeline status');
        }
        const initialStatus = await response.json();
        if (isMounted) {
          setStatus(initialStatus);
        }
      } catch (err) {
        console.error(err);
      }
    };

    bootstrap();

    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
    };

    es.addEventListener('status', (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
    });

    es.addEventListener('log', (event) => {
      const logEntry = JSON.parse(event.data);
      setLogs((previous) => {
        const merged = [...previous, logEntry];
        return merged.slice(-300);
      });
    });

    return () => {
      isMounted = false;
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const finishedAt = status?.history?.['build-site']?.finishedAt;
    if (finishedAt && finishedAt !== lastBuildTimestampRef.current) {
      lastBuildTimestampRef.current = finishedAt;
      setPreviewRevision((prev) => prev + 1);
    }
  }, [status?.history]);

  const invoke = useCallback(async (url, payload) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.message || 'Request failed';
      throw new Error(message);
    }

    return response.json();
  }, []);

  const startIngest = useCallback((payload) => invoke('/api/ingest', payload), [invoke]);
  const startBuild = useCallback((payload) => invoke('/api/build', payload), [invoke]);
  const startExport = useCallback((payload) => invoke('/api/export', payload), [invoke]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const currentTask = status?.currentTask ?? null;
  const history = status?.history ?? {};
  const isBusy = Boolean(currentTask && currentTask.status === 'running');
  const previewAvailable = history['build-site']?.status === 'completed';

  const value = useMemo(
    () => ({
      currentTask,
      history,
      logs,
      isBusy,
      startIngest,
      startBuild,
      startExport,
      clearLogs,
      previewRevision,
      previewAvailable,
      connectionState: { connected },
    }),
    [clearLogs, connected, currentTask, history, isBusy, logs, previewAvailable, previewRevision, startBuild, startExport, startIngest]
  );

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}