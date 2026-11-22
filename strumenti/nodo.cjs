// nodo.cjs — lancia uno script con lo STESSO MOTORE DELL'APP: il binario di Electron di node_modules come node
// (ELECTRON_RUN_AS_NODE=1), quindi il V8 di Electron e non quello del node di sistema. exp, log, pow, sin, cos, atan2,
// cbrt e ** cambiano nell'ultimo bit da un V8 all'altro, e il clima amplifica lo scarto: con un altro motore le prove
// vedrebbero pianeti diversi da quelli dell'app.
// Uso: node strumenti/nodo.cjs script.mjs [argomenti…]   (gli argomenti passano tali e quali; l'uscita è quella dello script)
'use strict';
const { spawnSync } = require('node:child_process');
const elettrone = require('electron');            // il percorso del binario (node_modules/electron/index.js)
const r = spawnSync(elettrone, process.argv.slice(2), { stdio: 'inherit', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
if (r.error) { console.error('nodo.cjs:', r.error.message); process.exit(1); }
if (r.signal) process.kill(process.pid, r.signal);
process.exit(r.status ?? 1);
