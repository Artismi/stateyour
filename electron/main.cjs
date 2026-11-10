// main.cjs — stateyour come applicazione da scrivania (Electron).
//
// Le pagine sono le stesse del sito: index.html (la camera), studio.html,
// decodifica.html, spaziotempo.html, piastrelle.html, motore.html. Si servono
// con un protocollo proprio, app://stateyour/, invece che da file://, perché i
// moduli JavaScript e il processo di decodifica (un Worker) funzionano solo da
// un'origine vera. Niente server, niente rete: tutto resta nella cartella.

const { app, BrowserWindow, protocol, net, shell, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const RADICE = path.resolve(__dirname, '..');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function finestra() {
  const w = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'stateyour', backgroundColor: '#f4f1ea',
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  // i link verso l'esterno si aprono nel browser
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('app://')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  w.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); shell.openExternal(url); } });
  w.loadURL('app://stateyour/index.html');
  return w;
}

app.whenReady().then(() => {
  protocol.handle('app', (richiesta) => {
    const { pathname } = new URL(richiesta.url);
    const file = path.normalize(path.join(RADICE, decodeURIComponent(pathname)));
    // solo i file della cartella del progetto
    if (!file.startsWith(RADICE + path.sep)) return new Response('vietato', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [{ label: 'Nuova finestra', accelerator: 'CmdOrCtrl+N', click: finestra }, { type: 'separator' }, process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }] },
    { role: 'editMenu' },
    { label: 'Vista', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
  ]));
  finestra();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) finestra(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
