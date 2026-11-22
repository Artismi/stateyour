// main.cjs — stateyour come applicazione da scrivania (Electron).
//
// La pagina è la stessa del sito: index.html, l'universo dal cosmo alla scala
// quantistica (il generatore di pattern è un progetto a parte, in pattern/, e
// non entra nel pacchetto). Si serve con un protocollo proprio, app://stateyour/,
// invece che da file://, perché i moduli JavaScript e i loro Worker funzionano
// solo da un'origine vera. Niente server, niente rete: tutto resta nella cartella.

const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const RADICE = path.resolve(__dirname, '..');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function finestra() {
  const w = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'stateyour', backgroundColor: '#521221', // (la cornice del visore: niente lampo chiaro all'apertura)
    frame: false, // (senza bordi: la cornice del visore fa da bordo, con i suoi pulsanti e la sua zona da trascinare)
    // la pagina è isolata: niente Node; il preload le dà solo i tre comandi della finestra (preload.cjs)
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, preload: path.join(__dirname, 'preload.cjs') },
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

// I TRE COMANDI DELLA FINESTRA (dal preload): valgono solo se vengono dalla pagina del progetto, app://stateyour/
const daNoi = (e) => (e.senderFrame?.url || '').startsWith('app://stateyour/');
const comandi = { riduci: (w) => w.minimize(), ingrandisci: (w) => (w.isMaximized() ? w.unmaximize() : w.maximize()), chiudi: (w) => w.close() };
for (const [nome, fa] of Object.entries(comandi)) {
  ipcMain.on(`finestra:${nome}`, (e) => { const w = BrowserWindow.fromWebContents(e.sender); if (w && daNoi(e)) fa(w); });
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
