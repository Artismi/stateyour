// test_erosione.mjs — l'erosione in metri e in anni (geologia.js erosione): i riscontri con ciò che si misura sulla Terra,
// su una POPOLAZIONE di Terre di prova con i continenti diversi (stessi parametri, semi da 11 a 18). Le asserzioni dure
// sono ciò che la fisica garantisce (il sedimento si conserva, niente numeri impossibili, stesso mondo stessa uscita); i
// riscontri col vero sono stampati come numeri, e se non tornano c'è scritto «≠ NON TORNA», senza toccare soglie.
import assert from 'node:assert/strict';
import * as GE from '../src/camera/geologia.js';

let ok = 0; const nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const n3 = (x) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(2) : x.toPrecision(3));
const riscontro = (che, x, a, b, vero) => { const torna = x >= a && x <= b; if (!torna) nonTorna.push(`${che}: ${n3(x)} (chiesto ${n3(a)}–${n3(b)})`); console.log(`      ${torna ? '=' : '≠ NON TORNA '} ${che}: ${n3(x)} (chiesto ${n3(a)}–${n3(b)}; vero ${vero})`); };
const mediana = (v) => [...v].sort((a, b) => a - b)[v.length >> 1];
// la retta ai minimi quadrati di y su x: la pendenza
const pendenza = (xs, ys) => { const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; } return (n * sxy - sx * sy) / (n * sxx - sx * sx); };

const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21;
const SEMI = [11, 12, 13, 14, 15, 16, 17, 18];
const t0 = performance.now(); let tempoErosione = 0;
const MONDI = SEMI.map((seme) => {
  const sf = GE.superficiePianeta(`erosione-${seme}`, P, it, seme), cl = GE.climaSuperficie(`erosione-${seme}`, P, sf, { aria: false }), t = performance.now(), se = GE.erosione(`erosione-${seme}`, sf, cl); tempoErosione += performance.now() - t;
  const { W, H } = sf, R = P.raggioM, dy = (Math.PI * R) / H, dx = (j) => Math.max(0.1 * dy, (2 * Math.PI * R * Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI)) / W), terra = (k) => !(se.alt[k] < sf.mare);
  // l'incasso: di quanto il letto è sceso rispetto ai quattro vicini, dove scorre molta acqua (la misura di test_biblioteca)
  const inc = (alt, k) => { const i = k % W, j = (k - i) / W; let m = 0, n = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= H) continue; m += alt[jj * W + ((i + di + W) % W)]; n++; } return m / n - alt[k]; };
  let d = 0, n = 0; for (let k = 0; k < W * H; k++) if (sf.alt[k] > sf.mare && se.lago[k] === 0 && se.flusso[k] > 30) { d += inc(se.alt, k) - inc(sf.alt, k); n++; }
  // la rete dei fiumi è quella dell'erosione (versoValle: attraversa anche le conche colme); la pendenza e la distanza
  // lungo di essa, l'area drenata dal flusso (celle × m/anno di pioggia → m² con un metro di pioggia l'anno)
  const giu = se.versoValle, dist = new Float64Array(W * H), S = new Float64Array(W * H), A = new Float64Array(W * H), L = new Float64Array(W * H), monte = new Int32Array(W * H);
  for (let k = 0; k < W * H; k++) { const q = giu[k], i = k % W, j = (k - i) / W; A[k] = se.flusso[k] * dx(j) * dy; if (q < 0) continue; const jq = (q - (q % W)) / W, di = i === q % W ? 0 : 1; dist[k] = Math.hypot(di * 0.5 * (dx(j) + dx(jq)), (jq - j) * dy); S[k] = (se.alt[k] - se.alt[q]) / dist[k]; monte[q]++; }
  // la lunghezza del corso più lungo a monte di ogni cella (Hack): dalle sorgenti in giù
  const ord = [], coda = []; for (let k = 0; k < W * H; k++) if (giu[k] >= 0 && monte[k] === 0) coda.push(k);
  while (coda.length) { const k = coda.pop(), q = giu[k]; ord.push(k); if (q < 0) continue; if (L[k] + dist[k] > L[q]) L[q] = L[k] + dist[k]; if (--monte[q] === 0 && giu[q] >= 0) coda.push(q); }
  const lA = [], lS = [], hA = [], hL = [];
  for (const k of ord) { if (terra(k) && se.lago[k] === 0 && se.flusso[k] > 8 && S[k] > 1e-6) { lA.push(Math.log(A[k])); lS.push(Math.log(S[k])); } if (terra(k) && se.flusso[k] > 4 && L[k] > 0) { hA.push(Math.log(A[k])); hL.push(Math.log(L[k])); } }
  return { seme, se, sf, incasso: d / n, fiumi: n, concavita: -pendenza(lA, lS), hack: pendenza(hA, hL) };
});
const tempoTutto = performance.now() - t0;

prova('il sedimento si conserva: ciò che i fiumi e i versanti tolgono = ciò che si è posato + ciò che è arrivato al mare (a 10⁻⁶)', () => {
  let peggio = 0;
  for (const m of MONDI) { const b = m.se.bilancio; assert.ok(b.eroso > 0 && b.depositato >= 0 && b.alMare >= 0, `seme ${m.seme}: ${JSON.stringify(b)}`); const scarto = Math.abs(b.eroso - b.depositato - b.alMare) / b.eroso; peggio = Math.max(peggio, scarto); assert.ok(scarto < 1e-6, `seme ${m.seme}: eroso ${b.eroso} m³, posato ${b.depositato}, al mare ${b.alMare}`);
    for (const h of m.se.alt) assert.ok(Number.isFinite(h)); for (const h of m.se.depositato) assert.ok(h >= 0); }
  console.log(`      scarto massimo ${n3(peggio)}; della roccia tolta ${MONDI.map((m) => Math.round((100 * m.se.bilancio.depositato) / m.se.bilancio.eroso)).join(', ')}% si è posato (laghi, pianure, delta), il resto è andato al largo`);
});
prova('l\'orologio: l\'erosione dura quanto la geografia di oggi (l\'età media dei fondali), e le costanti sono quelle misurate', () => {
  for (const m of MONDI) assert.ok(m.se.durataErosione > 1e6 && m.se.durataErosione < 5e9, `durata ${m.se.durataErosione}`);
  const E = GE.EROSIONE; assert.ok(E.m === 0.4 && E.n === 1 && E.K.granito >= 1e-7 && E.K.granito <= 1e-6 && E.K.vulcanica >= 1e-5 && E.K.vulcanica <= 1e-4 && E.K.sedimento >= 1e-4 && E.K.sedimento <= 1e-2, 'K dentro gli intervalli di Stock e Montgomery 1999');
  console.log(`      durata (milioni di anni): ${MONDI.map((m) => Math.round(m.se.durataErosione / 1e6)).join(', ')}; ${MONDI[0].se.passiErosione} passi`);
});
prova('stesso mondo, stessa erosione; e le uscite che il mare, la mappa e le tessere leggono ci sono ancora', () => {
  const m = MONDI[0], cl = GE.climaSuperficie(`erosione-${m.seme}`, P, m.sf, { aria: false }), di = GE.erosione(`erosione-bis`, m.sf, cl);
  assert.deepEqual(Array.from(di.alt.subarray(0, 4000)), Array.from(m.se.alt.subarray(0, 4000)));
  for (const campo of ['alt', 'flusso', 'lago', 'depositato']) assert.ok(m.se[campo] instanceof Float32Array && m.se[campo].length === m.sf.W * m.sf.H, campo);
  assert.ok(m.se.mare === m.sf.mare && m.se.cont === m.sf.cont && Number.isFinite(m.se.celleLago));
});
prova('i riscontri con la Terra, sulla popolazione (numeri; ciò che non torna resta scritto)', () => {
  const N = MONDI.length, incassati = MONDI.filter((m) => m.incasso > 0).length;
  console.log(`      incasso medio dove scorre molta acqua (m): ${MONDI.map((m) => m.incasso.toFixed(0)).join(', ')}; positivo su ${incassati} mondi su ${N}`);
  if (2 * incassati <= N) { nonTorna.push(`le valli si incassano solo su ${incassati} mondi su ${N}`); console.log(`      ≠ NON TORNA  le valli si incassano: solo su ${incassati} mondi su ${N}`); }
  console.log(`      concavità dei profili per mondo: ${MONDI.map((m) => m.concavita.toFixed(2)).join(', ')}; esponente di Hack: ${MONDI.map((m) => m.hack.toFixed(2)).join(', ')}`);
  riscontro('concavità dei profili, S ∝ A^−θ (mediana dei mondi)', mediana(MONDI.map((m) => m.concavita)), 0.3, 0.7, '≈ 0,45');
  riscontro('legge di Hack, L ∝ A^h (mediana dei mondi)', mediana(MONDI.map((m) => m.hack)), 0.5, 0.6, 'poco sotto 0,6');
  riscontro('denudazione media delle terre (m/anno; mediana dei mondi)', mediana(MONDI.map((m) => m.se.denudazione)), 1e-5, 9e-5, '3·10⁻⁵');
  riscontro('sedimento portato ai mari (kg/anno; mediana dei mondi)', mediana(MONDI.map((m) => m.se.fangoAlMare)), 2e13 / 3, 6e13, '2·10¹³');
  console.log(`      per mondo: denudazione ${MONDI.map((m) => n3(m.se.denudazione)).join(', ')} m/anno; ai mari ${MONDI.map((m) => n3(m.se.fangoAlMare)).join(', ')} kg/anno`);
  console.log(`      (${N} mondi: una frazione è nota a ± ${Math.round(100 * Math.sqrt(0.25 / N))}%; pioggia dalla legge di riserva del clima, senza i venti di meteo.js)`);
});
prova('i tempi: l\'erosione di un pianeta (256×128, 160 passi)', () => {
  const ms = tempoErosione / MONDI.length; console.log(`      erosione() ${ms.toFixed(0)} ms a pianeta; tutto (superficie, clima, erosione, misure) ${(tempoTutto / MONDI.length / 1000).toFixed(1)} s a pianeta`);
  assert.ok(ms < 15000, `erosione() in ${ms} ms`);
});
console.log(`erosione: ${ok} prove, tutto ok` + (nonTorna.length ? `; ${nonTorna.length} riscontri NON TORNANO:\n  ${nonTorna.join('\n  ')}` : '; tutti i riscontri tornano'));
