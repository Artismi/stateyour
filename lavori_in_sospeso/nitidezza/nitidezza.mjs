// nitidezza.mjs — LA MESSA A FUOCO COME MISURA: quanto è nitida l'immagine e quanto tremola a camera ferma, a poche
// scale dell'avvio (il 309721) e a tre densità di pixel dello schermo (deviceScaleFactor 1, 1,5 e 2: lo schermo a 100%,
// quello di Windows a 150%, il 4K a 200%). La scheda grafica qui è emulata (SwiftShader): schermi piccoli, poche scale.
//
// GLI INDICI, sull'immagine come arriva allo schermo, in pixel del dispositivo, sulla luma Y' = 0,2126 R + 0,7152 G +
// 0,0722 B (livelli 0–255):
//   · NITIDEZZA: la radice dell'energia del laplaciano (4 vicini), in livelli per pixel del dispositivo. Dipende da ciò che
//     si vede: si confronta la stessa scala prima e dopo, non una scala con l'altra.
//   · GUADAGNO DI DENSITÀ (g): la nitidezza a densità d divisa per quella dell'immagine a densità 1 portata a densità d
//     (ingrandita in modo bilineare). g ≈ 1: i pixel in più non portano niente (la tela lavora in pixel della pagina e il
//     navigatore la stira); g > 1: il dettaglio in più c'è davvero.
//   · SCINTILLIO: tra due fotogrammi a camera ferma (0,8 s), la differenza media di luma e la frazione di pixel che
//     cambiano di più di 6 livelli. Ciò che si muove davvero (le onde, le nubi, il tempo che scorre) conta anche lui.
//
// uso:  node strumenti/nodo.cjs strumenti/misure/nitidezza.mjs [--uscita cartella] [--dsf 1,1.5,2] [--W 360 --H 240]
//                                   [--scale 7,4,2,0,-2,-5] [--foto 2]
//   le scale sono il log10 della larghezza dello schermo in metri; si arriva con la rotella al centro, dall'avvio.
//   Uscite: nitidezza.json, e con --foto d le schermate a quella densità (png) nella cartella.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = resolve(process.env.RADICE || join(QUI, '..', '..'));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const DSF = arg('dsf', '1,1.5,2').split(',').map(Number), W = +arg('W', 360), H = +arg('H', 240);
const SCALE = arg('scale', '7,4,2,0,-2,-5').split(',').map(Number), FOTO = arg('foto', null) == null ? null : +arg('foto');
const USCITA = resolve(arg('uscita', join(QUI, 'esiti', 'nitidezza'))); mkdirSync(USCITA, { recursive: true });
const ATTESA = +arg('attesa', 20000);
const dorme = (ms) => new Promise((ok) => setTimeout(ok, ms)), t0 = Date.now(), log = (...a) => console.log(`${((Date.now() - t0) / 1000).toFixed(0).padStart(5)} s`, ...a);

const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.wasm': 'application/wasm', '.woff2': 'font/woff2' };
const server = createServer((q, r) => { const f = join(RADICE, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RADICE)) { r.writeHead(403); return r.end(); } try { const d = readFileSync(f); r.writeHead(200, { 'Content-Type': TIPI[extname(f)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const richiedi = createRequire(import.meta.url); let chromium;
try { ({ chromium } = richiedi('playwright')); } catch { ({ chromium } = richiedi('/opt/node-tools/node_modules/playwright')); }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

// ---------- gli indici (funzioni pure su { w, h, y: Float32Array di luma })

function laplaciano(F) { const { w, h, y } = F; let s = 0, n = 0; for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const k = j * w + i, l = 4 * y[k] - y[k - 1] - y[k + 1] - y[k - w] - y[k + w]; s += l * l; n++; } return Math.sqrt(s / Math.max(1, n)); }
function ingrandisci(F, w, h) { const o = new Float32Array(w * h), sx = F.w / w, sy = F.h / h; for (let j = 0; j < h; j++) { const fy = Math.max(0, Math.min(F.h - 1, (j + 0.5) * sy - 0.5)), j0 = Math.floor(fy), j1 = Math.min(F.h - 1, j0 + 1), ty = fy - j0;
  for (let i = 0; i < w; i++) { const fx = Math.max(0, Math.min(F.w - 1, (i + 0.5) * sx - 0.5)), i0 = Math.floor(fx), i1 = Math.min(F.w - 1, i0 + 1), tx = fx - i0, a = F.y[j0 * F.w + i0] * (1 - tx) + F.y[j0 * F.w + i1] * tx, b = F.y[j1 * F.w + i0] * (1 - tx) + F.y[j1 * F.w + i1] * tx; o[j * w + i] = a * (1 - ty) + b * ty; } }
  return { w, h, y: o }; }
function scintillio(A, B) { let s = 0, c = 0; for (let i = 0; i < A.y.length; i++) { const d = Math.abs(A.y[i] - B.y[i]); s += d; if (d > 6) c++; } return { media: s / A.y.length, cambiati: c / A.y.length }; }
const media = (F) => F.y.reduce((a, b) => a + b, 0) / F.y.length;

// ---------- una pagina a una densità
async function apri(dsf) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dsf });
  page.on('pageerror', (e) => log('errore nella pagina:', e.message.slice(0, 160)));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.__camera?.universo3d?.pronto?.(), null, { timeout: 600000, polling: 1000 });
  await page.evaluate(async () => {
    const st = document.createElement('style'); st.textContent = '.tele > :not(canvas), .segni3d, .barra-scala { visibility: hidden !important; }'; document.head.appendChild(st);
    let F = null; try { F = (await import('/src/camera/mappa.js')).statoFinestre; } catch { F = null; }
    const tele = () => document.querySelector('.tele');
    window.__fuoco = {
      larghezza: () => { const m = window.__camera.mpp(); return m > 0 ? m * tele().clientWidth : null; },
      stato: () => { const C = window.__camera; let s = C.vista || 'cosmo'; if (C.mondo3d) s += ' 3D'; else if (C.camMappa) s += ` L${C.camMappa.livello}${C.camMappa.suAcqua ? ' acqua' : ''}${C.camMappa.latoSuolo ? ' suolo' : ''}`; if (C.vistaAtomi) s += ' atomi'; return s; },
      occupato: () => { const C = window.__camera, o = []; if (C.passaggio) o.push('dissolvenza'); if (F && F.inCoda + F.inCorso > 0) o.push('finestre'); const M = C.mondo3d, U = C.universo3d; if (M) { if (M.volo) o.push('volo'); if (M.gesto) o.push('gesto'); try { if (U && !U.pronto()) o.push('universo'); const s = U?.sistema()?.vero?.()?.statistiche?.(); if (s && s.inAttesa > 0) o.push('tessere'); } catch { /* */ } } return o; },
      async ruota(dy, meta, n) { const T = tele().getBoundingClientRect(), x = T.left + T.width / 2, y = T.top + T.height / 2; let w = this.larghezza();
        for (let j = 0; j < n; j++) { document.elementFromPoint(x, y)?.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true, composed: true })); await new Promise((ok) => setTimeout(ok, 35)); w = this.larghezza(); if (w > 0 && (dy < 0 ? Math.log10(w) <= meta : Math.log10(w) >= meta)) break; }
        return w; },
    };
  });
  const r = await page.evaluate(() => { const r = document.querySelector('.tele').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  return { page, rett: r };
}
// la cattura in pixel del dispositivo, ridotta a luma nella pagina
async function leggi(P) {
  await P.page.evaluate(() => { const T = document.querySelector('.tele'); for (const e of document.body.querySelectorAll('*')) { if (e.contains(T) || (e.tagName === 'CANVAS' && e.parentNode === T)) continue; if (e.style.visibility !== 'hidden') e.style.setProperty('visibility', 'hidden', 'important'); } });
  const png = await P.page.screenshot({ clip: P.rett, type: 'png', scale: 'device' });
  const r = await P.page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, y = new Float32Array(c.width * c.height);
    for (let i = 0; i < y.length; i++) y[i] = 0.2126 * d[4 * i] + 0.7152 * d[4 * i + 1] + 0.0722 * d[4 * i + 2]; let s = ''; const u = new Uint8Array(y.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { w: c.width, h: c.height, y: btoa(s) }; }, png.toString('base64'));
  const b = Buffer.from(r.y, 'base64'); return { w: r.w, h: r.h, y: new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice(), png };
}
async function pronto(P) { const t = Date.now(); while (Date.now() - t < ATTESA) { const o = await P.page.evaluate(() => window.__fuoco.occupato()); if (!o.length) break; await dorme(300); } await dorme(1200); }

const esiti = []; const prima1 = new Map();
for (const dsf of DSF) {
  const P = await apri(dsf); log(`densità ${dsf}: app pronta, larghezza ${(await P.page.evaluate(() => window.__fuoco.larghezza()))?.toExponential(2)} m, ${await P.page.evaluate(() => window.__fuoco.stato())}`);
  for (const s of SCALE) {
    let w = await P.page.evaluate(() => window.__fuoco.larghezza());
    for (let giro = 0; giro < 40 && w > 0 && Math.abs(Math.log10(w) - s) > 0.08; giro++) { const dy = Math.log10(w) > s ? -100 : 100; w = await P.page.evaluate(([dy, m]) => window.__fuoco.ruota(dy, m, 30), [dy, s]); await dorme(250); w = await P.page.evaluate(() => window.__fuoco.larghezza()); }
    await pronto(P); const A = await leggi(P); await dorme(800); const B = await leggi(P);
    const st = await P.page.evaluate(() => window.__fuoco.stato()), wf = await P.page.evaluate(() => window.__fuoco.larghezza());
    const n = laplaciano(B), sc = scintillio(A, B); let g = null;
    if (dsf === 1) prima1.set(s, B); else if (prima1.has(s)) { const Q = prima1.get(s), up = ingrandisci(Q, B.w, B.h); g = n / Math.max(1e-6, laplaciano(up)); }
    const e = { dsf, scala: s, logW: wf > 0 ? +Math.log10(wf).toFixed(2) : null, stato: st, pixel: `${B.w}×${B.h}`, luma: +media(B).toFixed(1), nitidezza: +n.toFixed(2), guadagno: g == null ? null : +g.toFixed(2), scintillio: +sc.media.toFixed(2), cambiati: +sc.cambiati.toFixed(4) };
    esiti.push(e); log(JSON.stringify(e));
    if (FOTO === dsf) writeFileSync(join(USCITA, `scala_${String(s).replace('-', 'm')}.png`), B.png);
  }
  await P.page.close();
}
writeFileSync(join(USCITA, 'nitidezza.json'), JSON.stringify({ quando: new Date().toISOString(), schermo: [W, H], esiti }, null, 1));
await browser.close(); server.close(); log('fatto:', USCITA);
