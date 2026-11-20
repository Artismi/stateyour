// test_deposito.mjs — LA MEMORIA PER INDIRIZZO (src/camera/deposito.js) NON CAMBIA I BIT.
// A. In node: un nodo vero (la superficie del primo mare col vento: tettonica, clima, vento, erosione, mare) passato per la
//    clonazione strutturata (la stessa serializzazione di V8 che IndexedDB usa per salvare) torna identico bit per bit.
// B. Nel navigatore (Chromium, se Playwright c'è): superficie.worker.js chiamato due volte sullo stesso indirizzo — la prima
//    calcola e salva in IndexedDB, la seconda legge — dà due messaggi identici bit per bit; un pianeta della galassia 0 e una
//    tessera 3D (tessere.worker.js) allo stesso modo; e la chiave cambia se cambia la versione del codice.
import assert from 'node:assert/strict';
import v8 from 'node:v8';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as GE from '../src/camera/geologia.js';
import { mareColVento } from './mare_col_vento.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const prova = async (nome, f) => { await f(); ok++; console.log('  ✓', nome); };
// l'uguaglianza bit per bit: i numeri con Object.is (−0 ≠ 0, NaN = NaN) e i bit dei double; gli array tipizzati byte per byte
function uguali(a, b, dove = '') {
  if (typeof a === 'number') { assert.equal(typeof b, 'number', dove); if (Number.isNaN(a)) return assert.ok(Number.isNaN(b), dove); const x = new Float64Array([a, b]), u = new Uint32Array(x.buffer); assert.ok(u[0] === u[2] && u[1] === u[3], `${dove}: ${a} ≠ ${b}`); return; }
  if (a === null || typeof a !== 'object') return assert.ok(Object.is(a, b), `${dove}: ${a} ≠ ${b}`);
  if (ArrayBuffer.isView(a)) { assert.equal(a.constructor.name, b.constructor.name, dove); const A = new Uint8Array(a.buffer, a.byteOffset, a.byteLength), B = new Uint8Array(b.buffer, b.byteOffset, b.byteLength); assert.equal(A.length, B.length, dove); for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) assert.fail(`${dove}: byte ${i}`); return; }
  if (a instanceof Map) { assert.ok(b instanceof Map, dove); assert.equal(a.size, b.size, dove); for (const [k, v] of a) uguali(v, b.get(k), `${dove}.${k}`); return; }
  assert.equal(Array.isArray(a), Array.isArray(b), dove); const ka = Object.keys(a), kb = Object.keys(b); assert.deepEqual(ka, kb, dove); for (const k of ka) uguali(a[k], b[k], `${dove}.${k}`);
}
// (come superficie.worker.js: i dati senza le funzioni)
function pulito(o, visti = new Map()) { if (o === null || typeof o !== 'object') return typeof o === 'function' ? undefined : o; if (ArrayBuffer.isView(o)) return o; if (visti.has(o)) return visti.get(o);
  if (Array.isArray(o)) { const a = []; visti.set(o, a); for (const x of o) a.push(pulito(x, visti)); return a; } const r = {}; visti.set(o, r); for (const k of Object.keys(o)) { const x = pulito(o[k], visti); if (x !== undefined) r[k] = x; } return r; }

console.log('A. in node: la serializzazione della memoria non tocca i bit');
const M = mareColVento(), k = JSON.stringify(M.via);
await prova(`la superficie di ${k} (clima, vento, erosione, mare) torna identica dalla serializzazione di V8 e dalla clonazione strutturata`, () => {
  const v = { cl: pulito(GE.climaConIlMare(k, M.P, M.sf, M.cl, M.st)), se: pulito(M.se), mare: pulito(M.st) };
  uguali(v8.deserialize(v8.serialize(v)), v, 'v8'); uguali(structuredClone(v), v, 'clone');
  // (i casi difficili: −0, NaN, ±∞, i subnormali, gli array tipizzati con offset)
  const f = new Float64Array([-0, NaN, Infinity, -Infinity, 5e-324, 1 / 3]), w = { f, sub: new Float32Array(f.buffer, 8, 4), n: -0, x: [NaN, 2 ** -1074] };
  uguali(v8.deserialize(v8.serialize(w)), w, 'casi');
});

console.log('B. nel navigatore: IndexedDB e i fili');
let chromium = null; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { chromium = null; }
if (!chromium) console.log('  (Playwright non c\'è: la parte B non si fa)');
else {
  const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
  const server = await new Promise((fatto) => { const s = http.createServer((q, r) => { const f = path.join(RADICE, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RADICE)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPI[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }); s.listen(0, '127.0.0.1', () => fatto(s)); });
  const browser = await chromium.launch(), p = await browser.newPage(), errori = []; p.on('pageerror', (e) => errori.push(e.message));
  try {
    await p.goto(`http://127.0.0.1:${server.address().port}/package.json`);
    // (il confronto bit per bit nella pagina: lo stesso di sopra)
    await p.evaluate(`window.uguali = ${uguali.toString().replace(/assert\.(equal|ok|fail|deepEqual)/g, 'ASSERT.$1')}; window.ASSERT = { equal: (a, b, d) => { if (a !== b) throw new Error(d + ': ' + a + ' ≠ ' + b); }, ok: (x, d) => { if (!x) throw new Error(d); }, fail: (d) => { throw new Error(d); }, deepEqual: (a, b, d) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(d + ': chiavi diverse'); } };`);
    await prova('superficie.worker.js: la seconda volta legge dalla memoria, e il messaggio è identico bit per bit a quello calcolato', async () => {
      const r = await p.evaluate(async (v) => {
        const D = await import('/src/camera/deposito.js'); await D.svuota();
        const chiedi = () => new Promise((fatto, no) => { const w = new Worker('/src/camera/superficie.worker.js', { type: 'module' }); w.onmessage = (e) => { setTimeout(() => w.terminate(), 3000); setTimeout(() => fatto(e.data), 1500); }; w.onerror = (e) => no(new Error(e.message)); w.postMessage({ k: JSON.stringify(v), v }); });
        const a = await chiedi(); if (a.errore) throw new Error(a.errore); const b = await chiedi(); if (b.errore) throw new Error(b.errore);
        const { ms: _a, dallaMemoria: ma, ...A } = a, { ms: _b, dallaMemoria: mb, ...B } = b; window.uguali(A, B, 'superficie');
        return { ma, mb, msA: a.ms, msB: b.ms };
      }, M.via);
      assert.equal(r.ma, false); assert.equal(r.mb, true, 'la seconda volta dalla memoria');
      console.log(`      calcolata in ${Math.round(r.msA)} ms, letta dalla memoria in ${Math.round(r.msB)} ms`);
    });
    await prova('tessere.worker.js: una tessera di livello 2 dalla memoria è identica a quella calcolata', async () => {
      const r = await p.evaluate(async (v) => {
        const sup = await new Promise((fatto) => { const w = new Worker('/src/camera/superficie.worker.js', { type: 'module' }); w.onmessage = (e) => { w.terminate(); fatto(e.data); }; w.postMessage({ k: JSON.stringify(v), v }); });
        const { sistema } = await import('/src/camera/cosmo.js'), P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta];
        const chiedi = () => new Promise((fatto, no) => { const w = new Worker('/src/tre/tessere.worker.js', { type: 'module' }); w.onmessage = (e) => { setTimeout(() => w.terminate(), 3000); setTimeout(() => fatto(e.data), 500); }; w.onerror = (e) => no(new Error(e.message));
          w.postMessage({ tipo: 'base', k: sup.k, se: sup.se, cl: sup.cl, mare: sup.mare, seme: P.origine, T: P.clima.T, raggioM: P.raggioM }); w.postMessage({ tipo: 'tessera', n: 7, L: 2, tx: 5, ty: 3 }); });
        const a = await chiedi(), b = await chiedi(); if (a.errore) throw new Error(a.errore); const { ms: _a, ...A } = a, { ms: _b, ...B } = b; window.uguali(A, B, 'tessera');
        const D = await import('/src/camera/deposito.js'); return { letti: D.statistiche.letti, msA: a.ms, msB: b.ms };
      }, M.via);
      console.log(`      calcolata in ${Math.round(r.msA)} ms, letta in ${Math.round(r.msB)} ms`);
    });
    await prova('finestre.worker.js: la finestra dell\'acqua (l\'immagine al tempo 0 e dopo, la frase) e la scena delle molecole fatte nel filo sono quelle del filo principale, bit per bit; e dal deposito le stesse', async () => {
      const r = await p.evaluate(async ({ v, punto }) => {
        const sup = await new Promise((fatto) => { const w = new Worker('/src/camera/superficie.worker.js', { type: 'module' }); w.onmessage = (e) => { w.terminate(); fatto(e.data); }; w.postMessage({ k: JSON.stringify(v), v }); });
        const { sistema } = await import('/src/camera/cosmo.js'), FI = await import('/src/camera/finestra.js'), MA = await import('/src/camera/mare.js'), { sorgente } = await import('/src/camera/eventi.js');
        const P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta], u = (punto.lon + 180) / 360, vv = (90 - punto.lat) / 180, lato = 0.01;
        const w = new Worker('/src/camera/finestre.worker.js', { type: 'module' }), chiedi = (m) => new Promise((fatto) => { w.onmessage = (e) => fatto(e.data); w.postMessage(m); });
        w.postMessage({ tipo: 'base', k: sup.k, v, mare: sup.mare, se: sup.se, cl: sup.cl, seme: P.origine });
        const a = await chiedi({ tipo: 'acqua', id: 'x', k: sup.k, lon: punto.lon, lat: punto.lat, lato, fondoM: punto.fondoM, u, v: vv }); if (a.errore) throw new Error(a.errore);
        const fin = FI.finestraAcqua(sup.mare, { lon: punto.lon, lat: punto.lat, latoM: lato, fondoM: punto.fondoM, P }), px = FI.immagineFinestra(fin, 0);
        window.uguali(a.px, px, 'immagine'); if (!a.frase.startsWith(fin.descrizione)) throw new Error('frase');
        const b = await chiedi({ tipo: 'immagine', id: 'x', k: sup.k, tempo: 0.75 }); window.uguali(b.px, FI.immagineFinestra(fin, 0.75), 'immagine a 0,75 s');
        const n = await chiedi({ tipo: 'nano', id: 'n', k: sup.k, lon: punto.lon, lat: punto.lat, lato: 1e-8, fondoM: punto.fondoM, u, v: vv }); if (n.errore) throw new Error(n.errore);
        window.uguali(n.scena, FI.scenaNano(sup.mare, { lon: punto.lon, lat: punto.lat, profondita: 0, latoM: 1e-8, fondoM: punto.fondoM }, sorgente(`${sup.k}/acqua/${u.toFixed(6)}/${vv.toFixed(6)}`)), 'scena');
        w.terminate(); await new Promise((ok) => setTimeout(ok, 500));
        // un altro filo, la stessa finestra: la prima immagine e la frase vengono dal deposito, e sono le stesse
        const w2 = new Worker('/src/camera/finestre.worker.js', { type: 'module' }); w2.postMessage({ tipo: 'base', k: sup.k, v, mare: sup.mare, se: sup.se, cl: sup.cl, seme: P.origine });
        const a2 = await new Promise((fatto) => { w2.onmessage = (e) => fatto(e.data); w2.postMessage({ tipo: 'acqua', id: 'x', k: sup.k, lon: punto.lon, lat: punto.lat, lato, fondoM: punto.fondoM, u, v: vv }); });
        window.uguali(a2.px, px, 'immagine dal deposito'); if (a2.frase !== a.frase) throw new Error('frase dal deposito'); w2.terminate();
        return { N: a.N, ms: a.ms, ms2: a2.ms };
      }, { v: M.via, punto: M.aperto });
      console.log(`      la finestra di 1 cm: ${r.N} punti per lato, ${Math.round(r.ms)} ms nel filo, ${Math.round(r.ms2)} ms dal deposito`);
    });
    await prova('la chiave contiene la versione del codice (l\'impronta dei sorgenti importati): moduli diversi danno impronte diverse, lo stesso modulo la stessa', async () => {
      const r = await p.evaluate(async () => { const D = await import('/src/camera/deposito.js'); const a = await D.chiaveDi('x', '1', { codice: location.origin + '/src/camera/superficie.worker.js' }), b = await D.chiaveDi('x', '1', { codice: location.origin + '/src/tre/tessere.worker.js' }), c = await D.chiaveDi('x', '1', { codice: location.origin + '/src/camera/superficie.worker.js' }); return [a, b, c]; });
      assert.notEqual(r[0], r[1]); assert.equal(r[0], r[2]); assert.match(r[0], /^x\|m\d+\|c[0-9a-f]{16}\|1$/);
    });
    assert.deepEqual(errori, []);
  } finally { await browser.close(); server.close(); }
}
console.log(`\n${ok} prove superate`);
