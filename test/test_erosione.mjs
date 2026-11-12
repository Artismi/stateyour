// test_erosione.mjs — l'erosione in metri e in anni (geologia.js erosione), con la roccia che la storia delle placche ha
// lasciato e il sollevamento che le placche danno oggi (tettonica.js): i riscontri con ciò che si misura sulla Terra, su
// una POPOLAZIONE di Terre di prova con i continenti diversi (stessi parametri, semi da 11 a 18). Le asserzioni dure sono
// ciò che la fisica garantisce (il sedimento, la copertura e l'acqua del mare si conservano, niente numeri impossibili,
// stesso mondo stessa uscita); i riscontri col vero sono stampati come numeri, e se non tornano c'è scritto
// «≠ NON TORNA», senza toccare soglie.
import assert from 'node:assert/strict';
import * as GE from '../src/camera/geologia.js';
import { COSTANTI as TETTONICA } from '../src/camera/tettonica.js';

let ok = 0; const nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const n3 = (x) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(2) : x.toPrecision(3));
const riscontro = (che, x, a, b, vero) => { const torna = x >= a && x <= b; if (!torna) nonTorna.push(`${che}: ${n3(x)} (chiesto ${n3(a)}–${n3(b)})`); console.log(`      ${torna ? '=' : '≠ NON TORNA '} ${che}: ${n3(x)} (chiesto ${n3(a)}–${n3(b)}; vero ${vero})`); };
const mediana = (v) => [...v].sort((a, b) => a - b)[v.length >> 1];
const quantile = (v, f) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : NaN; };
// la retta ai minimi quadrati di y su x: la pendenza
const pendenza = (xs, ys) => { const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; } return (n * sxy - sx * sy) / (n * sxx - sx * sx); };

const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
const it = GE.interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21;
const SEMI = [11, 12, 13, 14, 15, 16, 17, 18];
// LA RETE DEI FIUMI su una griglia (il pianeta o una tessera): è quella dell'erosione (versoValle: attraversa anche le
// conche colme). Per ogni cella: la pendenza verso valle, l'AREA DRENATA VERA (la somma delle aree delle celle di terra a
// monte, m²: è di questa che parlano la legge di Hack e la concavità misurate sulla Terra), la lunghezza del corso più
// lungo a monte. (Prima l'ascissa era la portata, cioè la pioggia raccolta, moltiplicata per l'area della cella del
// posto: non è l'area drenata, e con la pioggia che varia di sei volte tra le celle la retta veniva schiacciata.)
function rete(t, R, perArea = 0) {
  const { W, H } = t, [u0, v0, u1, v1] = t.rett || [0, 0, 1, 1], dy = (Math.PI * R * (v1 - v0)) / H, dx = (j) => Math.max(0.1 * dy, (2 * Math.PI * R * Math.cos(Math.PI / 2 - (v0 + ((j + 0.5) / H) * (v1 - v0)) * Math.PI) * (u1 - u0)) / W);
  const N = W * H, giu = t.versoValle, dist = new Float64Array(N), S = new Float64Array(N), A = new Float64Array(N), Q = new Float64Array(N), L = new Float64Array(N), monte = new Int32Array(N), terra = (k) => !(t.alt[k] < t.mare);
  for (let k = 0; k < N; k++) { const q = giu[k], i = k % W, j = (k - i) / W; A[k] = terra(k) ? dx(j) * dy : 0; Q[k] = t.flusso[k] * dx(j) * dy; if (q < 0) continue; const jq = (q - (q % W)) / W, di = i === q % W ? 0 : 1; dist[k] = Math.hypot(di * 0.5 * (dx(j) + dx(jq)), (jq - j) * dy); S[k] = (t.alt[k] - t.alt[q]) / dist[k]; monte[q]++; }
  // (in una tessera i fiumi che entrano dal bordo portano un bacino che sta fuori: quelle celle, e tutto ciò che sta a valle, non si misurano)
  const daFuori = new Uint8Array(N); if (perArea) for (let k = 0; k < N; k++) { const i = k % W, j = (k - i) / W; if (i === 0 || j === 0 || i === W - 1 || j === H - 1) daFuori[k] = 1; }
  const coda = [], ord = []; for (let k = 0; k < N; k++) if (giu[k] >= 0 && monte[k] === 0) coda.push(k);
  while (coda.length) { const k = coda.pop(), q = giu[k]; ord.push(k); if (q < 0) continue; A[q] += A[k]; if (daFuori[k]) daFuori[q] = 1; if (L[k] + dist[k] > L[q]) L[q] = L[k] + dist[k]; if (--monte[q] === 0 && giu[q] >= 0) coda.push(q); }
  // le celle di fiume sono quelle di prima (pioggia raccolta > 8 per la pendenza, > 4 per la lunghezza); cambia solo l'ascissa.
  // Con perArea (le tessere, dove la pioggia raccolta ha un'altra scala): le celle con almeno «perArea» celle di bacino
  const lA = [], lQ = [], lS = [], hA = [], hQ = [], hL = [], cella = dx(H >> 1) * dy;
  for (const k of ord) { if (!terra(k)) continue;
    if (perArea) { if (daFuori[k] || A[k] < perArea * cella) continue; if (t.lago[k] === 0 && S[k] > 1e-6) { lA.push(Math.log(A[k])); lQ.push(Math.log(Q[k])); lS.push(Math.log(S[k])); } if (L[k] > 0) { hA.push(Math.log(A[k])); hQ.push(Math.log(Q[k])); hL.push(Math.log(L[k])); } continue; }
    if (t.lago[k] === 0 && t.flusso[k] > 8 && S[k] > 1e-6) { lA.push(Math.log(A[k])); lQ.push(Math.log(Q[k])); lS.push(Math.log(S[k])); } if (t.flusso[k] > 4 && L[k] > 0) { hA.push(Math.log(A[k])); hQ.push(Math.log(Q[k])); hL.push(Math.log(L[k])); } }
  return { concavita: lA.length > 20 ? -pendenza(lA, lS) : NaN, hack: hA.length > 20 ? pendenza(hA, hL) : NaN, concavitaPortata: lQ.length > 20 ? -pendenza(lQ, lS) : NaN, hackPortata: hQ.length > 20 ? pendenza(hQ, hL) : NaN, celle: lA.length };
}
const t0 = performance.now(); let tempoErosione = 0, tempoSuperficie = 0;
const MONDI = SEMI.map((seme) => {
  let t = performance.now(); const sf = GE.superficiePianeta(`erosione-${seme}`, P, it, seme); tempoSuperficie += performance.now() - t;
  const cl = GE.climaSuperficie(`erosione-${seme}`, P, sf, { aria: false }); t = performance.now(); const se = GE.erosione(`erosione-${seme}`, sf, cl); tempoErosione += performance.now() - t;
  const { W, H } = sf, N = W * H, R = P.raggioM, dy = (Math.PI * R) / H, aJ = (j) => Math.max(0.1 * dy, (2 * Math.PI * R * Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI)) / W) * dy, aDi = (k) => aJ((k - (k % W)) / W);
  // l'incasso: di quanto il letto è sceso rispetto ai quattro vicini, dove scorre molta acqua (la misura di test_biblioteca)
  const inc = (alt, k) => { const i = k % W, j = (k - i) / W; let m = 0, n = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= H) continue; m += alt[jj * W + ((i + di + W) % W)]; n++; } return m / n - alt[k]; };
  let d = 0, n = 0; for (let k = 0; k < N; k++) if (sf.alt[k] > sf.mare && se.lago[k] === 0 && se.flusso[k] > 30) { d += inc(se.alt, k) - inc(sf.alt, k); n++; }
  // le quote sul mare di oggi; l'ipsometria (quanta superficie a ogni quota, a passi di 250 m, lisciata su tre passi)
  let hMax = -Infinity, hSomma = 0, aTerre = 0, aTutta = 0, acquaPrima = 0, acquaDopo = 0, copPrima = 0, aTerrePrima = 0; const B = 250, n0 = 40, isto = new Float64Array(80);
  for (let k = 0; k < N; k++) { const a = aDi(k), h = se.alt[k] - se.mare; aTutta += a; if (h >= 0) { aTerre += a; hSomma += h * a; if (h > hMax) hMax = h; } else acquaDopo -= h * a;
    isto[Math.max(0, Math.min(79, Math.floor(h / B) + n0))] += a; if (sf.alt[k] < sf.mare) acquaPrima += (sf.mare - sf.alt[k]) * a; else { aTerrePrima += a; if (sf.copertura[k] > GE.EROSIONE.velo) copPrima += a; } }
  const liscio = isto.map((_, b) => (isto[Math.max(0, b - 1)] + isto[b] + isto[Math.min(79, b + 1)]) / 3); let bT = n0, bM = n0 - 1; for (let b = n0; b < 80; b++) if (liscio[b] > liscio[bT]) bT = b; for (let b = 0; b < n0; b++) if (liscio[b] > liscio[bM]) bM = b;
  let valle = Infinity; for (let b = bM; b <= bT; b++) valle = Math.min(valle, liscio[b]);
  // il sollevamento che le placche danno oggi (m/anno alla superficie; la roccia, a regime con l'erosione, sale di 1/galleggia volte tanto)
  const attive = [], ferme = []; let denT = 0, denTnetta = 0;
  for (let k = 0; k < N; k++) { if (sf.alt[k] < sf.mare) continue; const a = aDi(k); denT += sf.tettonica.consumata[k] * a; denTnetta += (sf.tettonica.consumata[k] - sf.tettonica.posata[k]) * a; if (!sf.cont[k]) continue; (sf.spinta[k] > 0 ? attive : ferme).push(sf.sollevamento[k] / TETTONICA.galleggia); }
  return { seme, se, sf, cl, incasso: d / n, fiumi: n, ...rete(se, R), hMax, hMedia: hSomma / aTerre, terre: aTerre / aTutta, acqua: acquaDopo / acquaPrima, copertePrima: copPrima / aTerrePrima,
    bimodale: liscio[bM] > 2 * valle && liscio[bT] > 2 * valle, modaTerre: (bT - n0 + 0.5) * B, modaFondali: -(bM - n0 + 0.5) * B, catene90: quantile(attive, 0.9), scudi: Math.abs(quantile(ferme, 0.5)), denTettonica: denT / aTerrePrima, denTettonicaNetta: denTnetta / aTerrePrima };
});
const tempoTutto = performance.now() - t0, tutti = (c) => MONDI.map((m) => m[c]), med = (c) => mediana(tutti(c));

prova('il sedimento si conserva: ciò che i fiumi e i versanti tolgono = ciò che si è posato + ciò che è arrivato al mare (a 10⁻⁶)', () => {
  let peggio = 0;
  for (const m of MONDI) { const b = m.se.bilancio; assert.ok(b.eroso > 0 && b.depositato >= 0 && b.alMare >= 0, `seme ${m.seme}: ${JSON.stringify(b)}`); const scarto = Math.abs(b.eroso - b.depositato - b.alMare) / b.eroso; peggio = Math.max(peggio, scarto); assert.ok(scarto < 1e-6, `seme ${m.seme}: eroso ${b.eroso} m³, posato ${b.depositato}, al mare ${b.alMare}`);
    for (const h of m.se.alt) assert.ok(Number.isFinite(h)); for (const h of m.se.depositato) assert.ok(h >= 0); }
  console.log(`      scarto massimo ${n3(peggio)}; della roccia tolta ${MONDI.map((m) => Math.round((100 * m.se.bilancio.depositato) / m.se.bilancio.eroso)).join(', ')}% si è posato (laghi, conoidi, delta), il resto è andato al largo`);
});
prova('la copertura sedimentaria ha il suo bilancio (prima + posata − erosa = dopo, a 10⁻⁶), e l\'acqua del mare è quella di prima', () => {
  let peggio = 0, peggioAcqua = 0;
  for (const m of MONDI) { const c = m.se.bilancioCopertura, scarto = Math.abs(c.prima + c.posata - c.erosa - c.dopo) / Math.max(c.prima, c.posata, 1); peggio = Math.max(peggio, scarto); assert.ok(scarto < 1e-6, `seme ${m.seme}: ${JSON.stringify(c)}`);
    for (let k = 0; k < m.se.copertura.length; k++) assert.ok(m.se.copertura[k] >= 0 && m.se.sciolto[k] >= 0 && m.se.sciolto[k] <= m.se.copertura[k] * (1 + 1e-5) + 1e-3 && m.se.lava[k] >= 0 && m.se.litologia[k] <= 2);
    peggioAcqua = Math.max(peggioAcqua, Math.abs(m.acqua - 1)); assert.ok(Math.abs(m.acqua - 1) < 1e-6, `seme ${m.seme}: volume del mare dopo/prima ${m.acqua}`); }
  console.log(`      scarto massimo della copertura ${n3(peggio)}, dell'acqua ${n3(peggioAcqua)}; il sedimento sulle coste ha alzato il mare di ${MONDI.map((m) => (m.se.mare - m.sf.mare).toFixed(0)).join(', ')} m`);
});
prova('l\'orologio: l\'erosione dura quanto la geografia di oggi (l\'età media dei fondali), e le costanti sono quelle misurate', () => {
  for (const m of MONDI) assert.ok(m.se.durataErosione > 1e6 && m.se.durataErosione < 5e9, `durata ${m.se.durataErosione}`);
  const E = GE.EROSIONE; assert.ok(E.m === 0.4 && E.n === 1 && E.K.granito >= 1e-7 && E.K.granito <= 1e-6 && E.K.vulcanica >= 1e-5 && E.K.vulcanica <= 1e-4 && E.K.sedimento >= 1e-4 && E.K.sedimento <= 1e-2, 'K dentro gli intervalli di Stock e Montgomery 1999');
  assert.ok(E.consumo.granito >= 3e-6 && E.consumo.granito <= 6e-6 && E.consumo.vulcanica === 2e-5 && E.consumo.sedimento === 2e-4, 'il consumo della ghiaia dentro le misure di Attal e Lavé 2009 (granito 0,3–0,6% al km; classi 2 e 20)');
  assert.ok(E.suolo >= 5e-5 && E.suolo <= 2e-3, 'P₀ dentro le misure di Heimsath (0,05–2 mm/anno)'); assert.ok(Math.abs(E.sottoIlMare - 1700 / 2300) < 1e-12);
  console.log(`      durata (milioni di anni): ${MONDI.map((m) => Math.round(m.se.durataErosione / 1e6)).join(', ')}; ${MONDI[0].se.passiErosione} passi`);
});
prova('stesso mondo, stessa erosione; e le uscite che il mare, la mappa e le tessere leggono ci sono ancora', () => {
  const m = MONDI[0], di = GE.erosione(`erosione-bis`, m.sf, m.cl), N = m.sf.W * m.sf.H;
  assert.deepEqual(Array.from(di.alt.subarray(0, 4000)), Array.from(m.se.alt.subarray(0, 4000))); assert.equal(di.mare, m.se.mare); assert.deepEqual(Array.from(di.litologia.subarray(0, 4000)), Array.from(m.se.litologia.subarray(0, 4000)));
  for (const campo of ['alt', 'flusso', 'lago', 'depositato', 'copertura', 'sciolto', 'lava']) assert.ok(m.se[campo] instanceof Float32Array && m.se[campo].length === N, campo);
  assert.ok(m.se.litologia instanceof Uint8Array && m.se.versoValle instanceof Int32Array && m.se.cont === m.sf.cont && Number.isFinite(m.se.celleLago) && Number.isFinite(m.se.mare));
  assert.ok(m.sf.alt !== m.se.alt && m.sf.copertura !== m.se.copertura, 'la superficie di partenza resta com\'era');
  // ciò che la superficie porta dalla tettonica: la copertura della storia, il sollevamento di oggi e fin dove la crosta regge
  for (const campo of ['copertura', 'sollevamento', 'tetto', 'arco', 'lava', 'velEst', 'velSud']) { assert.ok(m.sf[campo] instanceof Float32Array && m.sf[campo].length === N, campo); for (const v of m.sf[campo]) assert.ok(Number.isFinite(v), campo); }
  for (let k = 0; k < N; k++) assert.ok(m.sf.copertura[k] >= 0 && m.sf.tetto[k] >= m.sf.alt[k] - 1e-3 && m.sf.lava[k] >= 0);
});
prova('i riscontri con la Terra, sulla popolazione (numeri; ciò che non torna resta scritto)', () => {
  const N = MONDI.length, incassati = MONDI.filter((m) => m.incasso > 0).length, bimodali = MONDI.filter((m) => m.bimodale).length;
  console.log(`      incasso medio dove scorre molta acqua (m): ${tutti('incasso').map((x) => x.toFixed(0)).join(', ')}; positivo su ${incassati} mondi su ${N}`);
  if (incassati < N) { nonTorna.push(`le valli si incassano solo su ${incassati} mondi su ${N}`); console.log(`      ≠ NON TORNA  le valli si incassano: solo su ${incassati} mondi su ${N}`); }
  console.log(`      per mondo: denudazione ${tutti('se').map((s) => n3(s.denudazione)).join(', ')} m/anno; ai mari ${tutti('se').map((s) => n3(s.fangoAlMare)).join(', ')} kg/anno`);
  riscontro('denudazione media delle terre (m/anno; mediana dei mondi)', mediana(tutti('se').map((s) => s.denudazione)), 1e-5, 9e-5, '3·10⁻⁵');
  riscontro('sedimento portato ai mari (kg/anno; mediana dei mondi)', mediana(tutti('se').map((s) => s.fangoAlMare)), 2e13 / 3, 6e13, '2·10¹³');
  console.log(`      concavità dei profili per mondo: ${tutti('concavita').map((x) => x.toFixed(2)).join(', ')}; esponente di Hack: ${tutti('hack').map((x) => x.toFixed(2)).join(', ')} (con l'area drenata vera)`);
  riscontro('concavità dei profili, S ∝ A^−θ (mediana dei mondi)', med('concavita'), 0.3, 0.7, '≈ 0,45');
  riscontro('legge di Hack, L ∝ A^h (mediana dei mondi)', med('hack'), 0.5, 0.6, 'poco sotto 0,6');
  console.log(`      (con la portata al posto dell'area, la misura di prima: concavità ${med('concavitaPortata').toFixed(2)}, Hack ${med('hackPortata').toFixed(2)})`);
  console.log(`      quota massima per mondo (m sul mare): ${tutti('hMax').map((x) => x.toFixed(0)).join(', ')}; quota media delle terre: ${tutti('hMedia').map((x) => x.toFixed(0)).join(', ')}; terre emerse ${tutti('terre').map((x) => Math.round(100 * x)).join(', ')}%`);
  riscontro('rilievo massimo (m sul mare; mediana dei mondi; entro una volta e mezza)', med('hMax'), 8848 / 1.5, 8848 * 1.5, '8848');
  riscontro('quota media delle terre (m; mediana dei mondi; entro una volta e mezza)', med('hMedia'), 840 / 1.5, 840 * 1.5, '840');
  console.log(`      ipsometria: due mode (fondali e terre) su ${bimodali} mondi su ${N}; moda dei fondali ${tutti('modaFondali').map((x) => x.toFixed(0)).join(', ')} m sotto il mare, delle terre ${tutti('modaTerre').map((x) => x.toFixed(0)).join(', ')} m sopra`);
  if (bimodali < N) { nonTorna.push(`ipsometria a due mode solo su ${bimodali} mondi su ${N}`); console.log(`      ≠ NON TORNA  ipsometria a due mode: solo su ${bimodali} mondi su ${N}`); }
  riscontro('moda dei fondali (m sotto il mare; mediana dei mondi)', med('modaFondali'), 3500, 5500, '≈ 4500');
  riscontro('moda delle terre (m sopra il mare; mediana dei mondi)', med('modaTerre'), 0, 600, '≈ 100–300');
  console.log(`      terre con copertura sedimentaria, per mondo: lasciata dalla storia delle placche ${tutti('copertePrima').map((x) => Math.round(100 * x)).join(', ')}%; dopo l'erosione ${tutti('se').map((s) => Math.round(100 * s.terreCoperte)).join(', ')}%; vulcaniche ${tutti('se').map((s) => Math.round(100 * s.terreVulcaniche)).join(', ')}%`);
  riscontro('terre con copertura sedimentaria, dalla storia delle placche (frazione; mediana dei mondi)', med('copertePrima'), 0.55, 0.85, '0,65–0,75');
  riscontro('terre con copertura sedimentaria, dopo l\'erosione (frazione; mediana dei mondi)', mediana(tutti('se').map((s) => s.terreCoperte)), 0.55, 0.85, '0,65–0,75');
  riscontro('terre vulcaniche (frazione; mediana dei mondi)', mediana(tutti('se').map((s) => s.terreVulcaniche)), 0.03, 0.15, '≈ 0,06–0,08');
  console.log(`      (${N} mondi: una frazione è nota a ± ${Math.round(100 * Math.sqrt(0.25 / N))}%; pioggia dalla legge di riserva del clima, senza i venti di meteo.js)`);
});
prova('il sollevamento viene dalle placche, in metri l\'anno: catene attive e scudi fermi; e le due fonti della denudazione a confronto', () => {
  const v = MONDI[0].sf.tettonica.velocita; assert.ok(v > 0 && Number.isFinite(v)); let vMax = 0; for (const m of MONDI) for (let k = 0; k < m.sf.velEst.length; k++) vMax = Math.max(vMax, Math.hypot(m.sf.velEst[k], m.sf.velSud[k]));
  assert.ok(vMax <= 1.5 * v + 1e-9, `nessuna crosta va più in fretta delle placche: ${vMax} contro ${v} m/anno`);
  console.log(`      velocità delle placche ${n3(v)} m/anno (dal calore dell'interno: tettonica.js); la crosta più veloce va a ${n3(vMax)}; finestra ${n3(MONDI[0].sf.tettonica.finestra / 1e6)} milioni di anni`);
  console.log(`      sollevamento della roccia (m/anno) per mondo: nelle catene (90° percentile dove la crosta è stretta) ${tutti('catene90').map(n3).join(', ')}; negli scudi (mediana) ${tutti('scudi').map(n3).join(', ')}`);
  riscontro('sollevamento della roccia nelle catene attive (m/anno; mediana dei mondi)', med('catene90'), 1e-4, 1e-2, '10⁻⁴–10⁻²');
  riscontro('sollevamento della roccia negli scudi (m/anno; mediana dei mondi)', med('scudi'), 0, 1e-5, '≈ 0');
  console.log(`      ciò che le placche hanno dato davvero alle terre durante l'erosione (m/anno alla superficie, media): ${tutti('se').map((s) => n3(s.sollevamentoMedio)).join(', ')}`);
  // UNA GRANDEZZA, DUE FONTI: la tettonica ha la sua erosione a grana grossa (due leggi empiriche); qui si confrontano
  const rapporti = MONDI.map((m) => m.se.denudazione / m.denTettonica);
  console.log(`      denudazione secondo la tettonica (m/anno, lorda; tra parentesi tolto ciò che riposa sulle terre): ${MONDI.map((m) => `${n3(m.denTettonica)} (${n3(m.denTettonicaNetta)})`).join(', ')}`);
  riscontro('denudazione di erosione() / denudazione della tettonica (mediana dei mondi; una grandezza, due fonti)', mediana(rapporti), 1 / 3, 3, '1');
});
prova('la legge di Hack a due scale: sul pianeta (celle di ~150 km) e su tessere 16 volte più fini', () => {
  // Con l'area drenata vera la legge di Hack e la concavità tornano già a 150 km (qui sopra): le celle grosse non erano
  // l'ostacolo, lo era l'ascissa. Sulle tessere si rimisura Hack (una tessera di terra per mondo; le celle con almeno 4
  // celle di bacino, tolti i fiumi che entrano dal bordo). La concavità su una tessera non dice nulla: la tessera dura un
  // sedicesimo del tempo e il suo rilievo è ancora quello della madre più il dettaglio: è stampata, non riscontrata.
  const L = 2, n = 4 ** L, hack = [], conc = [], pianeta = []; const t = performance.now();
  for (const m of MONDI) { let fatta = false;
    for (let ty = 3; ty < n - 3 && !fatta; ty++) for (let tx = 0; tx < n && !fatta; tx++) { // (tutte le tessere, non una ogni sei: con le terre basse di adesso quelle oltre i 300 m sono meno)
      const ci = Math.floor(((tx + 0.5) / n) * m.se.W), cj = Math.floor(((ty + 0.5) / n) * m.se.H); if (m.se.alt[cj * m.se.W + ci] < m.se.mare + 300) continue;
      const ts = GE.tessera(`erosione-${m.seme}`, m.se, m.cl, L, tx, ty, m.seme); let terra = 0; for (let k = 0; k < ts.alt.length; k++) if (!(ts.alt[k] < ts.mare)) terra++; if (terra < 0.8 * ts.alt.length) continue;
      assert.ok(ts.copertura instanceof Float32Array && ts.litologia instanceof Uint8Array && ts.roccia instanceof Uint8Array && ts.mare === m.se.mare, 'la tessera eredita la roccia e il mare della madre');
      for (let k = 0; k < ts.versoValle.length; k++) assert.ok(ts.versoValle[k] >= -1 && ts.versoValle[k] < ts.W * ts.H, 'versoValle parla delle celle della tessera');
      const r = rete(ts, P.raggioM, 4); if (!Number.isFinite(r.hack)) continue; hack.push(r.hack); conc.push(r.concavita); pianeta.push(rete(m.se, P.raggioM, 4).hack); fatta = true; } }
  assert.ok(hack.length >= MONDI.length / 2, `tessere di terra trovate: ${hack.length}`);
  console.log(`      ${hack.length} tessere di livello ${L} (celle di ~10 km), una per mondo: Hack ${hack.map((x) => x.toFixed(2)).join(', ')}; sul pianeta, con la stessa scelta delle celle, ${pianeta.map((x) => x.toFixed(2)).join(', ')}; concavità sulle tessere ${conc.map((x) => x.toFixed(2)).join(', ')}; ${((performance.now() - t) / hack.length).toFixed(0)} ms a tessera`);
  riscontro('legge di Hack sulle tessere fini (mediana dei mondi)', mediana(hack), 0.5, 0.6, 'poco sotto 0,6');
});
prova('i tempi: l\'erosione di un pianeta (256×128, 160 passi)', () => {
  const ms = tempoErosione / MONDI.length; console.log(`      erosione() ${ms.toFixed(0)} ms a pianeta; superficiePianeta() ${(tempoSuperficie / MONDI.length).toFixed(0)} ms; tutto (superficie, clima, erosione, misure) ${(tempoTutto / MONDI.length / 1000).toFixed(1)} s a pianeta`);
  assert.ok(ms < 15000, `erosione() in ${ms} ms`);
});
console.log(`erosione: ${ok} prove, tutto ok` + (nonTorna.length ? `; ${nonTorna.length} riscontri NON TORNANO:\n  ${nonTorna.join('\n  ')}` : '; tutti i riscontri tornano'));
