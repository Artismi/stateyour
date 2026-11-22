// preload.cjs — il ponte fra la pagina e la finestra di Electron, ridotto a tre comandi.
//
// La finestra è senza bordi (main.cjs: frame: false): la cornice bordeaux del visore fa da bordo, e i suoi tre pulsanti
// (riduci, ingrandisci, chiudi) chiedono qui alla finestra di farlo. La pagina resta isolata (contextIsolation, sandbox,
// niente nodeIntegration): non vede né Node né ipcRenderer, solo `window.finestraApp` con questi tre comandi e un sì/no.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finestraApp', {
  riduci: () => ipcRenderer.send('finestra:riduci'),
  ingrandisci: () => ipcRenderer.send('finestra:ingrandisci'), // (ingrandisce, o la riporta alla misura di prima)
  chiudi: () => ipcRenderer.send('finestra:chiudi'),
  mac: process.platform === 'darwin', // (su macOS i pulsanti stanno a sinistra, come d'abitudine)
});
