// test_vista.mjs — LA VISTA COME MISURA (PROGETTO.md, lavoro 7; LINGUA.md, C12; INTRECCIO.md, regola 14).
//   A. l'occhio (nucleo.js, OCCHIO): le leggi con cui l'immagine in luce vera arriva allo schermo;
//   B. le tabelle del cielo di pianeta.js (la luce diffusa più volte, l'irradianza del cielo): direzioni e passi;
//   C. sulla scheda grafica (Chromium senza finestre, la pagina src/tre/prove/vista.html): i passi dei volumi della
//      galassia (da fuori e da dentro il disco) e della ragnatela, i passi dell'aria, l'accumulo nel tempo;
//   D. il 3D nero del punto a caso: l'aria a camera ferma, dal primo fotogramma, è il conto pieno.
// C12: per ogni discretizzazione, dimezzare il passo (o raddoppiare i campioni) cambia l'immagine sempre meno — l'ORDINE
// p è la pendenza di log(scarto) su log(n) tra raddoppi successivi —, e il valore che l'app usa sta nella zona convergente.
// LA TOLLERANZA viene dall'occhio, dichiarata prima: la differenza appena percepibile di colore, ΔE*ab = 2,3 (Mahy, Van
// Eycken & Oosterlinck 1994), sull'immagine come arriva allo schermo (dopo l'occhio, la curva e la gamma); per gli scarti
// relativi di luce (le tabelle, l'accumulo) il suo equivalente dove si vede di più, al bianco: dL* = (116/3)·Y^⅓·dY/Y,
// quindi ε = 3·2,3/116 = 5,9%. Il riferimento di ogni serie è il suo termine più fine; il resto che gli manca lo stima
// Richardson (scarto dell'ultimo raddoppio · r/(1 − r), r = 2^−p) e deve stare sotto ε.
// Ciò che non torna si stampa «≠ NON TORNA» (e, se è dichiarato, non ferma la prova).
// Si lancia a parte (npm run vista): vuole Chromium e Playwright, e dura circa un minuto.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as NU from '../src/tre/nucleo.js';
import { ariaDi, tabelleAria } from '../src/tre/pianeta.js';
import { sistema } from '../src/camera/cosmo.js';

const T0 = performance.now(), RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const nonTorna = [], tempi = [];
const prova = async (nome, f) => { const t = performance.now(); await f(); ok++; tempi.push([nome.slice(0, 44), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const JND = 2.3, EPS = (3 * JND) / 116;
// l'ordine (pendenza di log₂ scarto su log₂ n) e il resto di Richardson del termine più fine
function ordine(serie, scarti) { const x = scarti.map((_, i) => Math.log2(serie[i])), y = scarti.map((d) => Math.log2(Math.max(d, 1e-30))), n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; } const p = -sxy / sxx, r = 2 ** -Math.max(p, 1e-3); return { p, resto: (scarti[n - 1] * r) / (1 - r) }; }
const riga = (serie, scarti) => serie.slice(0, -1).map((n, i) => `${n}→${serie[i + 1]}: ${num(scarti[i], 2)}`).join(' · ');

// ---------- la pagina, servita da qui (un piccolo server nel processo della prova), e Chromium
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = await new Promise((ok) => { const s = http.createServer((q, r) => { const f = path.join(RADICE, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RADICE)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPI[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }); s.listen(0, '127.0.0.1', () => ok(s)); });
let chromium; try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.error('test_vista: serve Playwright (con Chromium): la parte C e la D non si possono fare senza'); server.close(); process.exit(1); }
const browser = await chromium.launch(), errori = [];
const pagina = async () => { const p = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 }); p.on('pageerror', (e) => errori.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text().slice(0, 300)); });
  await p.goto(`http://127.0.0.1:${server.address().port}/src/tre/prove/vista.html`); await p.waitForFunction(() => window.prova && window.prova.pronta); return p; };
// (la ragnatela costa: il suo volume si prepara in una seconda pagina mentre si fa il resto)
const [pG, pR] = await Promise.all([pagina(), pagina()]);
const ragnatelaPronta = pR.evaluate(() => window.prova.scena('ragnatela'));
const galassiaPronta = pG.evaluate(() => window.prova.scena('galassia'));
const su = (p) => ({ disegna: (o) => p.evaluate((o) => window.prova.disegna(o), o), confronta: (a, b, t = null) => p.evaluate(([a, b, t]) => window.prova.confronta(a, b, t), [a, b, t]), luce: (k) => p.evaluate((k) => window.prova.luce(k), k), scena: (s) => p.evaluate((s) => window.prova.scena(s), s) });

console.log('A. l\'occhio (nucleo.js, OCCHIO)');
await prova('il grigio medio della percezione (L* = 50) è ciò a cui l\'occhio porta la luminanza a cui si adatta; la soglia assoluta lo ferma', () => {
  assert.ok(Math.abs(NU.tonalita(NU.X_MEDIO) - ((50 + 16) / 116) ** 3) < 1e-9);
  const K = NU.efficaciaLuminosa(5772); assert.ok(K > 0);
  // sopra la soglia l'unità scelta porta L_A al grigio medio; sotto resta quella della soglia (ciò che c'è resta scuro)
  for (const LA of [1e-3, 1, 1e4]) { const E0 = NU.E0Adattato(LA, K), v = (LA * Math.PI) / (E0 * K); assert.ok(Math.abs(v - NU.X_MEDIO) < 1e-12); }
  assert.equal(NU.E0Adattato(1e-9, K), NU.E0Adattato(NU.OCCHIO.soglia, K));
  // l'adattamento al colore (CIECAM02): 0,824 al buio, quasi 1 in pieno giorno; i coni: 0 sotto 0,005 cd/m², 1 sopra 5
  assert.ok(Math.abs(NU.gradoAdattamento(0) - (1 - Math.exp(-42 / 92) / 3.6)) < 1e-12 && NU.gradoAdattamento(1e4) > 0.9999);
  assert.equal(NU.pesoConi(0.005), 0); assert.equal(NU.pesoConi(5), 1); assert.ok(NU.pesoConi(0.05) > 0 && NU.pesoConi(0.05) < 1);
  console.log(`      x del grigio medio ${num(NU.X_MEDIO, 4)}; efficacia luminosa del corpo nero: 3000 K ${num(NU.efficaciaLuminosa(3000))} lm/W, 5772 K ${num(K)}, 9500 K ${num(NU.efficaciaLuminosa(9500))}`);
});

console.log('B. le tabelle del cielo (pianeta.js tabelleAria: Hillaire 2020)');
// (il pianeta della scena «aria» di vista.html: il primo di roccia con l'aria di almeno 0,1 bar e sopra 200 K dalla stella 838)
let P = null; for (let s = 838; s < 1400 && !P; s++) for (const q of sistema(1, 2, s).pianeti) if (q.tipo !== 'gassoso' && q.interno && (q.clima?.pressione || 0) > 1e4 && (q.clima?.T || 0) > 200) { P = q; break; }
const R = P.raggioM, aria = ariaDi(P, R, P.clima?.g || (6.674e-11 * P.massaKg) / R / R);
const relT = (x, y) => { let s = 0, t = 0; for (let i = 0; i < x.length; i++) { if (i % 4 === 3) continue; s += Math.abs(x[i] - y[i]); t += Math.abs(y[i]); } return s / t; };
for (const [nome, serie, app, cosa] of [['ND', [16, 32, 64, 128, 256], 64, 'direzioni della luce diffusa due volte'], ['NS', [6, 12, 24, 48, 96], 24, 'passi lungo ogni raggio'], ['NC', [32, 64, 128, 256, 512], 256, 'direzioni dell\'irradianza del cielo']]) {
  await prova(`${nome} (${cosa}): converge, e ${app} (l'app) sta entro ε = ${num(EPS * 100, 2)}% dal limite`, () => {
    const T = serie.map((n) => tabelleAria(aria, R, P.clima?.albedo, { [nome]: n })), d = serie.slice(0, -1).map((_, i) => Math.max(relT(T[i].ms, T[i + 1].ms), relT(T[i].cieloT, T[i + 1].cieloT)));
    const { p, resto } = ordine(serie, d), k = serie.indexOf(app), eApp = Math.max(relT(T[k].ms, T[T.length - 1].ms), relT(T[k].cieloT, T[T.length - 1].cieloT)) + resto;
    console.log(`      ${riga(serie, d)}; ordine ${num(p, 2)}; l'app: ${num(eApp * 100, 2)}% (resto del più fine ${num(resto * 100, 2)}%)`);
    assert.ok(p > 0.5 && d[d.length - 1] < d[0], `${nome} non converge`); assert.ok(resto < EPS && eApp < EPS, `${nome}: l'app è fuori dalla zona convergente`);
  });
}

console.log('C. sulla scheda grafica (src/tre/prove/vista.html, 320 × 200 punti, esposizione fissa dopo l\'adattamento)');
// una serie di passi: le immagini, gli scarti tra raddoppi, l'ordine, e l'app contro il più fine (ΔE sull'immagine dello schermo)
async function serie(P_, chiaveOpz, valori, app, nome) {
  const t = performance.now(); for (const n of valori) await P_.disegna({ [chiaveOpz]: n, chiave: `${nome}${n}` });
  const d = []; for (let i = 0; i + 1 < valori.length; i++) d.push((await P_.confronta(`${nome}${valori[i]}`, `${nome}${valori[i + 1]}`)).scarto);
  const { p, resto } = ordine(valori, d), c = await P_.confronta(`${nome}${app}`, `${nome}${valori[valori.length - 1]}`), luce = await P_.luce(`${nome}${app}`);
  console.log(`      ${riga(valori, d)}; ordine ${num(p, 2)}, resto del più fine ${num(resto * 100, 2)}%; l'app (${app}) contro ${valori[valori.length - 1]}: scarto ${num(c.scarto * 100, 2)}%, ΔE*ab media ${num(c.dE.media, 2)}, 99° centile ${num(c.dE.p99, 2)}, massimo ${num(c.dE.max, 2)} (${Math.round(performance.now() - t)} ms)`);
  return { p, resto, d, c, luce };
}
const G = su(pG), Rr = su(pR); const infoG = await galassiaPronta;
console.log(`    la galassia 2 del cosmo 1: l'occhio adattato a ${num(infoG.LA)} cd/m²`);
await prova('i passi del volume della galassia, da fuori: convergono, e 24 (l\'app) è sotto la soglia dell\'occhio', async () => {
  const s = await serie(G, 'passi', [6, 12, 24, 48, 96], 24, 'g'); assert.ok(s.luce > 0, 'la galassia è buia');
  assert.ok(s.p > 0.5 && s.d[s.d.length - 1] < s.d[0] && s.resto < EPS); assert.ok(s.c.dE.p99 <= JND, `ΔE ${s.c.dE.p99}`);
});
await prova('ACCUMULO NEL TEMPO (galassia da fuori, camera ferma): la storia converge al conto pieno, e a storia piena (64) è sotto la soglia', async () => {
  await G.disegna({ passi: 160, chiave: 'rif' }); await G.disegna({ passi: 24, accumulo: true, fotogrammi: 68, chiave: 'acc' });
  const K = [1, 2, 4, 8, 16, 32, 64], d = []; for (const k of K) d.push((await G.confronta('acc', 'rif', k)).scarto); const { p } = ordine(K, d), c = await G.confronta('acc', 'rif');
  console.log(`      contro 160 passi: ${K.map((k, i) => `${k}: ${num(d[i] * 100, 2)}%`).join(' · ')}; ordine nei fotogrammi ${num(p, 2)}; a storia piena ΔE*ab 99° centile ${num(c.dE.p99, 2)}`);
  assert.ok(p > 0.2 && d[d.length - 1] < d[0] && d[d.length - 1] < EPS && c.dE.p99 <= JND);
});
await prova('i passi del volume della galassia, da dentro il disco (il raggio corre nel piano): convergono, e 24 è sotto la soglia', async () => {
  await G.scena('dentro'); const s = await serie(G, 'passi', [6, 12, 24, 48, 96], 24, 'd'); assert.ok(s.luce > 0);
  assert.ok(s.p > 0.5 && s.d[s.d.length - 1] < s.d[0] && s.resto < EPS); assert.ok(s.c.dE.p99 <= JND, `ΔE ${s.c.dE.p99}`);
});
const infoA = await G.scena('aria');
console.log(`    l'aria: ${num(infoA.pianeta.pressione / 1e5)} bar, scala d'altezza ${num(infoA.pianeta.H / 1000)} km; dal suolo verso l'orizzonte, la stella a 30°; l'occhio a ${num(infoA.LA)} cd/m²`);
await prova('D. IL 3D NERO: l\'aria a camera ferma, dal primo fotogramma fermo in poi, è il conto pieno (prima: Add e Tot mai scritti, nero finché non ci si muoveva)', async () => {
  await G.disegna({ passiAria: 48, chiave: 'pieno' }); await G.disegna({ passiAria: 48, accumulo: true, fotogrammi: 3, chiave: 'fermo', nuovaAria: true });
  const c = await G.confronta('fermo', 'pieno'), l = await G.luce('fermo'); console.log(`      luce media ${num(l)} (unità del nucleo); scarto dal conto pieno ${num(c.scarto, 2)}, ΔE*ab massimo ${num(c.dE.max, 2)}`);
  assert.ok(l > 0.01 && c.scarto < 1e-4 && c.dE.max <= JND);
});
await prova('i passi dell\'aria, da dentro (pianeta.js, F_ARIA: ogni tratto sommato in modo esatto, i confini dalla misura dei passi): convergono, e 48 (l\'app) è sotto la soglia', async () => {
  const s = await serie(G, 'passiAria', [3, 6, 12, 24, 48, 96, 192], 48, 'a');
  assert.ok(s.p > 0.5 && s.d[s.d.length - 1] < s.d[0] && s.resto < EPS); assert.ok(s.c.dE.p99 <= JND, `ΔE ${s.c.dE.p99}`);
  const c24 = await G.confronta('a24', 'a192'); if (c24.dE.p99 > JND) console.log(`      (con 24 passi: ΔE*ab 99° centile ${num(c24.dE.p99, 2)} — fuori; perciò 48)`);
});
const infoF = await G.scena('fuori');
console.log(`    l'aria del pianeta d'avvio dell'app, da fuori (5,5 raggi): ${num(infoF.pianeta.pressione / 1e5)} bar, scala d'altezza ${num(infoF.pianeta.H / 1000)} km; l'occhio a ${num(infoF.LA)} cd/m²`);
await prova('i passi dell\'aria, da fuori, su un\'aria di migliaia di bar (prima: il disco ad anelli fino a centinaia di passi): convergono, e 48 è sotto la soglia', async () => {
  const s = await serie(G, 'passiAria', [6, 12, 24, 48, 96, 192, 384], 48, 'f'); assert.ok(s.luce > 0, 'il pianeta è buio');
  assert.ok(s.p > 0.5 && s.d[s.d.length - 1] < s.d[0] && s.resto < EPS); assert.ok(s.c.dE.p99 <= JND, `ΔE ${s.c.dE.p99}`);
});
const infoR = await ragnatelaPronta;
console.log(`    la ragnatela del cosmo 1, da dentro: l'occhio a ${num(infoR.LA)} cd/m² (la soglia assoluta è ${num(NU.OCCHIO.soglia)})`);
await prova('i passi del volume della ragnatela: convergono; a camera ferma, con l\'accumulo, 24 (l\'app) è sotto la soglia', async () => {
  const s = await serie(Rr, 'passi', [6, 12, 24, 48, 96], 24, 'r'); assert.ok(s.luce > 0);
  assert.ok(s.p > 0.5 && s.d[s.d.length - 1] < s.d[0], 'la ragnatela non converge');
  // il riferimento: la storia piena con 96 passi (192 a camera ferma) — il più fine che la scheda fa —; l'app: la storia piena con 24
  await Rr.disegna({ passi: 96, accumulo: true, fotogrammi: 68, chiave: 'rrif' }); await Rr.disegna({ passi: 24, accumulo: true, fotogrammi: 68, chiave: 'racc' });
  const c = await Rr.confronta('racc', 'rrif'), u = await Rr.confronta('r24', 'rrif');
  console.log(`      a storia piena (24 contro 96 passi): scarto ${num(c.scarto * 100, 2)}%, ΔE*ab 99° centile ${num(c.dE.p99, 2)}; un fotogramma da solo (in moto) contro la stessa: ΔE*ab 99° centile ${num(u.dE.p99, 2)}`);
  if (u.dE.p99 > JND) nonTorna.push(`la ragnatela IN MOTO (un fotogramma, 24 passi, prima che la storia si riempia): ΔE*ab 99° centile ${num(u.dE.p99, 2)} > ${num(JND)} — la grana dei passi si vede finché la camera si muove (dichiarato: è il prezzo dell'accumulo; accumulo.js)`);
  assert.ok(c.scarto < EPS && c.dE.p99 <= JND, `ΔE ${c.dE.p99}`);
});
assert.equal(errori.length, 0, errori.join('\n'));
await browser.close(); server.close();
for (const n of nonTorna) console.log('  ≠ NON TORNA (dichiarato):', n);
console.log(`\n${ok} prove superate in ${(performance.now() - T0) / 1000 | 0} s${nonTorna.length ? `; ${nonTorna.length} NON TORNA dichiarati` : ''}`);
for (const [n, ms] of tempi.sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log(`    ${n}: ${(ms / 1000).toFixed(1)} s`);
