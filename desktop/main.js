const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

const isDev = process.env.NODE_ENV === 'development';

// --- Path Resolution ---------------------------------------------------------
// In packaged app: app.getAppPath() = resources/app
// In development:  app.getAppPath() = project root (d:\tai_lieu\NewCode)
function getAppRoot() {
  if (isDev) {
    // In dev, __dirname = desktop/, so go up one level to project root
    return path.join(__dirname, '..');
  }
  // In production (asar: false), resources/app IS the project root
  return app.getAppPath();
}

// npm command differs on Windows
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// --- Process Management -------------------------------------------------------
function startBackend() {
  if (isDev) return;

  const appRoot = getAppRoot();
  const serverDir = path.join(appRoot, 'server');
  const serverEntry = path.join(serverDir, 'dist', 'main.js');

  // Verify the compiled server entry exists before trying to spawn
  if (!fs.existsSync(serverEntry)) {
    dialog.showErrorBox(
      'TaskFlow - Missing server build',
      `Cannot find compiled backend at:\n${serverEntry}\n\nPlease run "npm run build:server" first.`
    );
    return;
  }

  console.log('[Backend] Spawning NestJS from:', serverDir);

  backendProcess = spawn(process.execPath, ['dist/main.js'], {
    cwd: serverDir,
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env }
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Spawn error:', err.message);
  });

  console.log('[Backend] Spawned PID:', backendProcess.pid);
}

function startFrontend() {
  if (isDev) return;

  const appRoot = getAppRoot();
  const clientDir = path.join(appRoot, 'client');
  const nextBuild = path.join(clientDir, '.next');

  // Verify the Next.js build output exists before trying to spawn
  if (!fs.existsSync(nextBuild)) {
    dialog.showErrorBox(
      'TaskFlow - Missing client build',
      `Cannot find built frontend at:\n${nextBuild}\n\nPlease run "npm run build:client" first.`
    );
    return;
  }

  console.log('[Frontend] Spawning Next.js from:', clientDir);

  frontendProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: clientDir,
    windowsHide: true,
    stdio: 'ignore',
    shell: false,
    env: { ...process.env }
  });

  frontendProcess.on('error', (err) => {
    console.error('[Frontend] Spawn error:', err.message);
  });

  console.log('[Frontend] Spawned PID:', frontendProcess.pid);
}

function cleanupProcesses() {
  if (backendProcess && backendProcess.pid) {
    console.log('[Cleanup] Killing backend PID:', backendProcess.pid);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'], {
          windowsHide: true,
          stdio: 'ignore'
        });
      } else {
        process.kill(-backendProcess.pid, 'SIGKILL');
      }
    } catch (e) { /* ignore */ }
    backendProcess = null;
  }

  if (frontendProcess && frontendProcess.pid) {
    console.log('[Cleanup] Killing frontend PID:', frontendProcess.pid);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(frontendProcess.pid), '/f', '/t'], {
          windowsHide: true,
          stdio: 'ignore'
        });
      } else {
        process.kill(-frontendProcess.pid, 'SIGKILL');
      }
    } catch (e) { /* ignore */ }
    frontendProcess = null;
  }
}

// --- Connection Polling -------------------------------------------------------
function checkPort(callback) {
  const req = http.get('http://localhost:3000', (res) => {
    callback(res.statusCode < 500);
  });
  req.on('error', () => callback(false));
  req.setTimeout(800, () => { req.destroy(); callback(false); });
  req.end();
}

function waitForFrontend(callback) {
  if (isDev) {
    // In dev, wait-on has already guaranteed the port is alive
    return callback(null);
  }

  let elapsed = 0;
  const timeoutMs = 90000; // 90 second timeout for cold start
  const pollInterval = 1500;

  console.log('[Polling] Waiting for Next.js on http://localhost:3000 ...');

  const interval = setInterval(() => {
    checkPort((online) => {
      elapsed += pollInterval;
      if (online) {
        clearInterval(interval);
        console.log('[Polling] Frontend is online!');
        callback(null);
      } else if (elapsed >= timeoutMs) {
        clearInterval(interval);
        callback(new Error('Frontend server did not start within 90 seconds.'));
      }
    });
  }, pollInterval);
}

// --- Electron Window ---------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'TaskFlow',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open DevTools only in development (Commented out by user request)
  // if (isDev) {
  //   mainWindow.webContents.openDevTools({ mode: 'detach' });
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Application Lifecycle ---------------------------------------------------
app.whenReady().then(() => {
  console.log('[App] Ready. Mode:', isDev ? 'development' : 'production');
  console.log('[App] App root:', getAppRoot());

  startBackend();
  startFrontend();

  waitForFrontend((err) => {
    if (err) {
      dialog.showErrorBox(
        'TaskFlow - Startup Failed',
        `${err.message}\n\nPlease check:\n• MongoDB is running\n• No other app is using ports 3000 or 5000`
      );
      cleanupProcesses();
      app.quit();
      return;
    }
    createWindow();
  });
});

app.on('window-all-closed', () => {
  cleanupProcesses();
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  cleanupProcesses();
});
