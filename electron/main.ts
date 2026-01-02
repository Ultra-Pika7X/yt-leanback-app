import { app, BrowserWindow, ipcMain, shell } from 'electron';
console.log('DEBUG: app is', app);
console.log('DEBUG: electron module is', require('electron'));
import path from 'path';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch';
import fs from 'fs-extra';
import { exec } from 'child_process';
// import Store from 'electron-store'; // ESM issue likely, using dynamic import

// Discord RPC
import DiscordRPC from 'discord-rpc';

const clientId = '123456789012345678'; // TO BE REPLACED WITH VALID ID or GENERIC ONE
// Since we don't have a real ID yet, we might use a dummy or skip login if fails.
// Using a common generic ID often works or is needed. 
// For now, I will use a placeholder and wrap in try/catch so it doesn't crash.
// User didn't provide one, I should probably ask or use a generic "YouTube" one if available publicly, 
// but for this task I'll implement the logic assuming a valid ID or just a placeholder.
// I'll use a placeholder 'YOUR_DISCORD_CLIENT_ID' for now.
const DISCORD_CLIENT_ID = '112233445566778899'; // Placeholder

let mainWindow: BrowserWindow | null = null;
let store: any;
let rpc: DiscordRPC.Client | null = null;
let startTimestamp = new Date();

// Initialize Store
async function initStore() {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      adblock: true,
      downloader: true,
      discordRpc: false
    }
  });
}

// Initialize RPC
function initRPC() {
  if (!store.get('discordRpc')) return;

  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    console.log('Discord RPC Ready');
    updateActivity('Browsing', 'Home');
  });

  rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(console.error);
}

function updateActivity(details: string, state: string) {
  if (!rpc || !store.get('discordRpc')) return;
  rpc.setActivity({
    details: details,
    state: state,
    startTimestamp,
    largeImageKey: 'youtube_logo', // Assumes we uploaded this asset or use a generic one
    largeImageText: 'YouTube Leanback',
    instance: false,
  });
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const userAgent = 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1';
  mainWindow.webContents.setUserAgent(userAgent);

  // Setup AdBlocker
  if (store.get('adblock')) {
    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
      if (mainWindow) blocker.enableBlockingInSession(mainWindow.webContents.session);
    });
  }

  mainWindow.loadURL('https://www.youtube.com/tv');

  // React to Video changes for RPC (Naive approach: Preload sends events)

  // IPC Handlers
  ipcMain.handle('get-settings', () => store.store);

  ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);
    // specific side effects
    if (key === 'discordRpc') {
      if (value && !rpc) initRPC();
      if (!value && rpc) {
        rpc.destroy();
        rpc = null;
      }
    }
    return store.store;
  });

  ipcMain.handle('update-discord-status', (event, status) => {
    updateActivity(status.title || 'Watching Video', status.author || 'YouTube');
  });

  ipcMain.handle('download-video', async (event, args) => {
    // Args: { provider: 'ytdl' | 'savefrom', url: string }
    const currentUrl = args?.url || mainWindow?.webContents.getURL();
    console.log('Downloading:', currentUrl);

    // Get Title for notification
    const title = 'Video'; // We could scrape it, but for now generic.

    if (args?.provider === 'savefrom') {
      const saveFromUrl = `https://en.savefrom.net/1-youtube-video-downloader-4/${currentUrl}`;
      // Create a new window for SaveFrom because it might need interaction
      const win = new BrowserWindow({ width: 800, height: 600 });
      win.loadURL(saveFromUrl);
      return { success: true, method: 'browser' };
    }

    // Default: yt-dlp
    // Force mp4 360p
    const downloadFolder = path.join(app.getPath('music'), 'sm music fr ur days');
    await fs.ensureDir(downloadFolder);

    // Notify Start
    if (mainWindow) mainWindow.webContents.send('download-status', { status: 'started' });

    // Format: mp4 360p
    // Command: yt-dlp -f "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]" -o ...
    const format = '"bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]"';
    // Use quotes around URL and template
    const cmd = `yt-dlp -f ${format} -o "${downloadFolder}/%(title)s.%(ext)s" "${currentUrl}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          if (mainWindow) mainWindow.webContents.send('download-status', { status: 'error', message: error.message });
          resolve({ success: false, error: error.message });
          return;
        }
        console.log(`stdout: ${stdout}`);
        if (mainWindow) mainWindow.webContents.send('download-status', { status: 'success' });
        resolve({ success: true });
      });
    });
  });
}

app.whenReady().then(async () => {
  await initStore();
  createWindow();
  // initRPC();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
