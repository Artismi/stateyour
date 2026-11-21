// test_eredita.mjs — la base comune del passaggio padre → figlio (eredita.js).
// DISCIPLINA: le soglie sono dette prima, con la loro ragione; i campi vengono dalla fonte degli eventi.
//   A. media del figlio sulla cella padre = padre, entro l'arrotondamento (soglia: 1e-12 del campo: venti volte
//      l'errore di una somma di poche decine di double)
//   B. lo spettro: la pendenza del periodogramma 2D tra k = 8 e k = 64 (cicli per 256 celle) è −(2H + 2) entro 0,25
//      (la costruzione per ottave dà increspature log-periodiche; 0,25 è circa un decimo della pendenza)
//   C. nessuna giuntura: una tessera grande e le sue parti calcolate da sole danno gli stessi bit
//   D. stessi bit a ogni chiamata; le serie con nome non si spostano a vicenda
//   E. il passaggio sopra/sotto il pixel conserva il totale
import assert from 'node:assert/strict';
import { ottava, discendi, serie, separa, pesoDiscreto, varianzaSotto, scartoOttava } from '../src/camera/eredita.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0; const T0 = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const RADICE = 'prova/eredita';

console.log('A. la media del figlio sulla cella padre');
prova('in 1D, 2D e 3D, con sigma costante e dipendente dal padre: |media − padre| < 1e-12·scala', () => {
  const c = sorgente(`${RADICE}/padre`);
  const padre = (I, J = 0, K = 0) => 100 * Math.sin(0.3 * I + 0.2 * J) + 40 * c.serie('celle')((I & 1023) + 1024 * ((J & 1023) + 1024 * (K & 15)));
  for (const [nJ, nK] of [[0, 0], [12, 0], [6, 5]]) {
    const nI = 12, d = nK ? 3 : nJ ? 2 : 1, nj = nJ || 1, nk = nK || 1, oi = 2 * nI, oj = nJ ? 2 * nJ : 1;
    for (const sigma of [7, (I, J, K, p) => 0.1 * Math.abs(p) + 1]) {
      const f = ottava({ padre, livello: 9, I0: -5, J0: 3, K0: 2, nI, nJ, nK, radice: RADICE, nome: 'media', sigma });
      let peggio = 0;
      for (let Z = 0; Z < nk; Z++) for (let Y = 0; Y < nj; Y++) for (let X = 0; X < nI; X++) {
        let s = 0; for (let cc = 0; cc < (nK ? 2 : 1); cc++) for (let b = 0; b < (nJ ? 2 : 1); b++) for (let a = 0; a < 2; a++) s += f[((2 * Z + cc) * oj + 2 * Y + b) * oi + 2 * X + a];
        peggio = Math.max(peggio, Math.abs(s / 2 ** d - padre(-5 + X, nJ ? 3 + Y : 0, nK ? 2 + Z : 0)));
      }
      assert.ok(peggio < 1e-12 * 140, `d=${d}: deriva ${peggio}`);
      console.log(`      d=${d}, sigma ${typeof sigma === 'function' ? 'dal padre' : 'costante'}: deriva massima ${peggio.toExponential(1)}`);
    }
  }
  // lo scarto della correzione è sigma: una sola ottava su un padre nullo (errore di campionamento ~ 1/√(N/9): 3·0,6 %)
  for (const [nJ, nK] of [[0, 0], [128, 0], [24, 24]]) {
    const n = nK ? 24 : nJ ? 128 : 8192, f = ottava({ padre: () => 0, livello: 12, nI: n, nJ, nK, radice: RADICE, nome: 'scarto', sigma: 3 });
    let v = 0; for (const x of f) v += x * x; const r = Math.sqrt(v / f.length) / 3;
    console.log(`      scarto della correzione / sigma (d=${nK ? 3 : nJ ? 2 : 1}): ${r.toFixed(4)}`);
    assert.ok(Math.abs(r - 1) < 3 * 3 / Math.sqrt(f.length), `scarto ${r}`);
  }
  // un padre costante (una piana a zero metri) resta esatto senza rumore, e in media con il rumore
  const g = ottava({ padre: () => 0, livello: 4, nI: 8, nJ: 8, radice: RADICE, nome: 'piana', sigma: 0 });
  assert.ok(g.every((v) => v === 0), 'la piana senza rumore deve restare a zero');
});

// FFT radice 2 sul posto (re, im), lunghezza n
function fft(re, im, n, passo, o) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const a = o + i * passo, c = o + j * passo; [re[a], re[c]] = [re[c], re[a]]; [im[a], im[c]] = [im[c], im[a]]; } }
  for (let L = 2; L <= n; L <<= 1) { const t = -2 * Math.PI / L; for (let i = 0; i < n; i += L) for (let k = 0; k < L / 2; k++) {
    const wr = Math.cos(t * k), wi = Math.sin(t * k), a = o + (i + k) * passo, b = o + (i + k + L / 2) * passo, xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
    re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; } }
}
function pendenza(campi, N) {
  const P = new Float64Array(N), C = new Float64Array(N);
  for (const f of campi) {
    let m = 0; for (const v of f) m += v / f.length;
    const re = new Float64Array(N * N), im = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) re[y * N + x] = (f[y * N + x] - m) * (0.5 - 0.5 * Math.cos(2 * Math.PI * x / N)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * y / N));
    for (let y = 0; y < N; y++) fft(re, im, N, 1, y * N); for (let x = 0; x < N; x++) fft(re, im, N, N, x);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const kx = x <= N / 2 ? x : x - N, ky = y <= N / 2 ? y : y - N, k = Math.round(Math.hypot(kx, ky)); if (k < N) { P[k] += re[y * N + x] ** 2 + im[y * N + x] ** 2; C[k]++; } }
  }
  let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
  for (let k = 8; k <= 64; k++) { const x = Math.log(k), y = Math.log(P[k] / C[k]); sx += x; sy += y; sxx += x * x; sxy += x * y; n++; }
  return (n * sxy - sx * sy) / (n * sxx - sx * sx);
}

console.log('B. lo spettro chiesto');
prova('pendenza del periodogramma = −(2H + 2) entro 0,25, per H = 0,3 e 0,8', () => {
  for (const H of [0.3, 0.8]) {
    const campi = [0, 1, 2, 3].map((t) => discendi({ base: () => 0, livello0: 0, livello: 8, I0: 256 * t, J0: 0, nI: 256, nJ: 256, radice: RADICE, nome: `spettro H ${H}`, ampiezza: 1, hurst: H, lato0: 1 }));
    const s = pendenza(campi, 256);
    console.log(`      H = ${H}: pendenza ${s.toFixed(3)} (attesa ${-(2 * H + 2)})`);
    assert.ok(Math.abs(s + 2 * H + 2) < 0.25, `H=${H}: pendenza ${s}`);
  }
});
prova('la varianza delle ottave sotto una cella è la serie geometrica delle ottave', () => {
  const a = 3, H = 0.6, lato = 0.25; let s = 0; for (let m = 1; m < 200; m++) s += scartoOttava(a, H, lato / 2 ** m) ** 2;
  assert.ok(Math.abs(varianzaSotto(a, H, lato) / s - 1) < 1e-12);
});

console.log('C. nessuna giuntura tra tessere vicine');
prova('la tessera 64×64 e le sue quattro parti 32×32 (e una a cavallo) danno gli stessi bit', () => {
  const arg = { base: (I, J) => sorgente(`${RADICE}/base`).serie('b')((I & 255) + 256 * (J & 255)), livello0: 2, livello: 7, radice: RADICE, nome: 'giunture', ampiezza: 1, hurst: 0.5 };
  const tutto = discendi({ ...arg, I0: 40, J0: -24, nI: 64, nJ: 64 });
  for (const [dx, dy, n] of [[0, 0, 32], [32, 0, 32], [0, 32, 32], [32, 32, 32], [17, 9, 30]]) {
    const parte = discendi({ ...arg, I0: 40 + dx, J0: -24 + dy, nI: n, nJ: n });
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) assert.equal(parte[y * n + x], tutto[(y + dy) * 64 + x + dx], `(${x + dx}, ${y + dy})`);
  }
  // salti tra figli vicini: dentro la stessa cella padre e a cavallo di due celle padre, statistica uguale (informativo)
  const f = discendi({ ...arg, base: () => 0, livello0: 0, I0: 0, J0: 0, nI: 256, nJ: 256 }); let dentro = 0, fuori = 0;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 255; x++) { const q = (f[y * 256 + x + 1] - f[y * 256 + x]) ** 2; if (x & 1) fuori += q; else dentro += q; }
  console.log(`      salto quadratico a cavallo / dentro le celle padre: ${(Math.sqrt(fuori / dentro)).toFixed(3)} (1 = nessuna griglia)`);
});

console.log('D. stessi bit, serie con nome');
prova('due chiamate uguali danno gli stessi bit; il ramo cambia il rumore', () => {
  const arg = { padre: (I, J) => I - 2 * J, livello: 5, I0: 3, J0: 4, nI: 9, nJ: 7, radice: RADICE, nome: 'bit', sigma: 2 };
  const a = ottava(arg), b = ottava(arg), c = ottava({ ...arg, ramo: 1 });
  assert.deepEqual([...a], [...b]); assert.ok(a.some((v, i) => v !== c[i]));
});
prova('serie(indirizzo, nome) è la serie di eventi.js; aggiungere una serie non sposta le altre', () => {
  const s = serie('cosmo 1/galassia 3', 'fondo di stelle'), t = sorgente('cosmo 1/galassia 3').serie('fondo di stelle');
  for (let k = 0; k < 50; k++) assert.equal(s(k), t(k));
  const prima = [0, 1, 2].map((k) => serie('cosmo 1', 'luce')(k)); serie('cosmo 1', 'nuova')(0);
  assert.deepEqual([0, 1, 2].map((k) => serie('cosmo 1', 'luce')(k)), prima);
  assert.notEqual(serie('cosmo 1', 'luce')(0), serie('cosmo 1', 'massa')(0));
});

console.log('E. sopra o sotto il pixel');
prova('per ogni oggetto peso discreto + peso continuo = 1; discreto + continuo = totale; peso 1/2 sulla soglia', () => {
  const u = serie(RADICE, 'oggetti'), ogg = Array.from({ length: 2000 }, (_, i) => ({ r: Math.exp(8 * u(2 * i) - 4), L: u(2 * i + 1) }));
  for (const pixel of [0.01, 0.3, 1, 7]) {
    const s = separa(ogg, { grandezza: (o) => o.r, valore: (o) => o.L, pixel });
    assert.ok(Math.abs(s.discreto + s.continuo - s.totale) < 1e-12 * s.totale);
    const pesi = new Float64Array(ogg.length); for (const x of s.singoli) pesi[x.indice] += x.peso; for (const x of s.sotto) pesi[x.indice] += x.peso;
    assert.ok(pesi.every((p) => Math.abs(p - 1) < 1e-15));
  }
  assert.equal(pesoDiscreto(1), 0.5); assert.equal(pesoDiscreto(2 ** -0.5), 0); assert.equal(pesoDiscreto(2 ** 0.5), 1);
  // il peso cresce liscio con lo zoom: nessuno scatto (derivata limitata da 1,5/ottava)
  let prima = 0; for (let e = -1; e <= 1; e += 1 / 64) { const w = pesoDiscreto(2 ** e); assert.ok(w >= prima && w - prima <= 1.5 / 64 + 1e-12); prima = w; }
});

console.log(`\n${ok} prove passate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
