import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { ingest } from './ingest.js';
import { buildSite } from './build.js';
import { exportZip } from './export.js';

const app = express();
const port = process.env.PORT || 3001;
const clients = new Set();
const taskState = {
  currentTask: null,
  history: {},
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const previewDir = path.join(process.cwd(), 'export', 'site');

app.use(cors());
app.use(express.json());
app.use('/preview', express.static(previewDir));

if (process.env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, 'dist');
  app.use(express.static(clientDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.get('/api/status', (req, res) => {
  res.json(taskState);
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('status', taskState);
  clients.add(res);

  const pingInterval = setInterval(() => {
    send('ping', { timestamp: new Date().toISOString() });
  }, 30000);

  req.on('close', () => {
    clearInterval(pingInterval);
    clients.delete(res);
    res.end();
  });
});

app.post('/api/pick-folder', async (req, res) => {
  const { title = 'Select a folder', initialDir = '' } = req.body || {};

  // Only implemented on Windows (interactive session)
  if (process.platform !== 'win32') {
    return res.status(501).json({ message: 'Folder picker not available on this OS. Enter the path manually.' });
  }

  try {
    const folder = await pickFolderWindows(title, initialDir);
    if (!folder) return res.status(204).end();
    return res.json({ path: folder });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/ingest', (req, res) => {
  const { source, exportRoot } = req.body || {};
  if (!source || !exportRoot) {
    return res.status(400).json({ message: 'Both "source" and "exportRoot" are required.' });
  }

  try {
    startTask('ingest', { source, exportRoot }, async (logger) => {
      await ingest(source, exportRoot, logger);
    });
    return res.json({ status: 'started' });
  } catch (error) {
    return res.status(error.statusCode || 409).json({ message: error.message });
  }
});

app.post('/api/build', (req, res) => {
  const { exportRoot, paginate = 200 } = req.body || {};
  if (!exportRoot) {
    return res.status(400).json({ message: '"exportRoot" is required.' });
  }

  try {
    startTask('build-site', { exportRoot, paginate }, async (logger) => {
      await buildSite(exportRoot, Number(paginate) || 200, logger);
    });
    return res.json({ status: 'started' });
  } catch (error) {
    return res.status(error.statusCode || 409).json({ message: error.message });
  }
});

app.post('/api/export', (req, res) => {
  const { exportRoot, zip } = req.body || {};
  if (!exportRoot || !zip) {
    return res.status(400).json({ message: 'Both "exportRoot" and "zip" are required.' });
  }

  try {
    startTask('export', { exportRoot, zip }, async (logger) => {
      await exportZip(exportRoot, zip, logger);
    });
    return res.json({ status: 'started' });
  } catch (error) {
    return res.status(error.statusCode || 409).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log('Open http://localhost:5173 for the pipeline UI (npm run dev).');
});

function pickFolderWindows(title, initialDir) {
  return new Promise((resolve, reject) => {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.FolderBrowserDialog
$dlg.Description = ${JSON.stringify(title)}
$dlg.ShowNewFolderButton = $true
if (${JSON.stringify(initialDir)} -ne '') { $dlg.SelectedPath = ${JSON.stringify(initialDir)} }
$show = $dlg.ShowDialog()
if ($show -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  Write-Output $dlg.SelectedPath
}
`;
    const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', psScript], {
      windowsHide: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(stderr || `Folder picker exited with code ${code}`));
      }
      resolve(stdout.trim());
    });
  });
}

function startTask(type, params, handler) {
  if (taskState.currentTask) {
    const active = taskState.currentTask.type;
    const error = new Error(`Cannot start ${type}; task "${active}" is currently running.`);
    error.statusCode = 409;
    throw error;
  }

  const taskId = Date.now();
  const startedAt = new Date().toISOString();
  taskState.currentTask = {
    id: taskId,
    type,
    status: 'running',
    startedAt,
    params,
  };
  broadcastStatus();

  const logger = createLogger(taskId, type);
  logger.log(`[start] ${type}...`);

  Promise.resolve()
    .then(() => handler(logger))
    .then(() => {
      const finishedAt = new Date().toISOString();
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
      logger.log(`[done] ${type} completed.`);
      taskState.history[type] = {
        status: 'completed',
        finishedAt,
        durationMs,
        params,
      };
    })
    .catch((err) => {
      const finishedAt = new Date().toISOString();
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
      logger.error(`[error] ${type} failed: ${err.message}`);
      taskState.history[type] = {
        status: 'failed',
        finishedAt,
        durationMs,
        params,
        error: err.message,
      };
    })
    .finally(() => {
      taskState.currentTask = null;
      broadcastStatus();
    });
}

function createLogger(taskId, type) {
  return {
    log: (message) => broadcastLog(taskId, type, 'info', message),
    warn: (message) => broadcastLog(taskId, type, 'warn', message),
    error: (message) => broadcastLog(taskId, type, 'error', message),
  };
}

function broadcastStatus() {
  broadcast('status', taskState);
}

function broadcastLog(taskId, type, level, message) {
  const payload = {
    taskId,
    type,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  broadcast('log', payload);
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[consoleMethod](`[${type}] ${message}`);
}

function broadcast(event, data) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}