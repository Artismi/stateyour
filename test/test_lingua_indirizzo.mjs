// test_lingua_indirizzo.mjs — il linguaggio dell'indirizzo (src/camera/lingua.js, LINGUA.md):
//   A. la forma scritta: andata e ritorno identiche su indirizzi veri del programma (cosmo.js, bolla.js, bolle.js,
//      intreccio.js, eventi) e rifiuto di ciò che non è canonico;
//   B. la misura: Kraft per l'indice del cosmo (la coda stampata), HEALPix (pixel di area uguale, annidati), i pesi di
//      ogni livello che sommano a 1;
//   C. la discesa a caso: deterministica, coerente con un inizio dato, distribuita come peso() (χ² sui livelli economici);
//   D. l'impronta del contenuto: uguale per lo stesso pianeta da due strade, diversa per pianeti diversi, monotona;
//   E. i pesi dei rami (C4, misura.js): normalizzazione locale per ogni legge, le celle realizzate dalla fonte, il prodotto
//      dei pesi = il rapporto di verosimiglianza su un caso noto;
//   F. dal campione al vero: le galassie e le stelle vere, puntoACaso uniforme sulle stelle vere (χ²);
//   G. le fusioni (C11): fondi conserva il peso totale;
//   H. i cervelli di Boltzmann contati (C13): il rapporto tra le due vie, in bit (stima d'ordine di grandezza).
// Non dipende da un mondo particolare: i luoghi si trovano cercandoli (le stelle con pianeti, i pianeti diversi).
// (Il nome test_lingua.mjs è già della lingua delle immagini, src/lingua.js.)
import assert from 'node:assert/strict';
import * as L from '../src/camera/lingua.js';
import { indirizzo, scrivi as scriviI, nelRamo, alTempo, figlio } from '../src/camera/intreccio.js';
import { bolla, scriviBolla, leggiBolla, percorsoDi, bollaDaVia } from '../src/tre/bolla.js';
import { bolla as bollaDi } from '../src/camera/bolle.js';
import { sorgente } from '../src/camera/eventi.js';
import * as CO from '../src/camera/cosmo.js';
import { ANNI_OGGI } from '../src/camera/spazio3d.js';
import * as M from '../src/camera/misura.js';
import { cosmo3d } from '../src/camera/cosmo3d.js';
import { massaNascita } from '../src/camera/leggi.js';
import { formaPianeti } from '../src/camera/disco.js';
import { dentro as GAL } from '../src/camera/galassie.js';

let ok = 0; const T0 = performance.now(), nonTorna = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; console.log(`  ✓ ${nome} (${((performance.now() - t) / 1000).toFixed(1)} s)`); };
const c = sorgente('prova/lingua');
// la coda del χ²: Wilson e Hilferty (basta per dire «troppo lontano»)
const codaChi2 = (x, k) => { const z = ((x / k) ** (1 / 3) - (1 - 2 / (9 * k))) / Math.sqrt(2 / (9 * k)); return 0.5 * erfc(z / Math.SQRT2); };
function erfc(x) { const t = 1 / (1 + 0.5 * Math.abs(x)), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }
// χ² di conteggi contro probabilità attese, unendo le caselle con meno di 5 attesi
function chi2(conti, attese, N) {
  const o = [], e = []; let co = 0, ce = 0;
  for (let i = 0; i < attese.length; i++) { co += conti[i] || 0; ce += attese[i] * N; if (ce >= 5) { o.push(co); e.push(ce); co = 0; ce = 0; } }
  if (ce > 0 || co > 0) { if (e.length) { o[o.length - 1] += co; e[e.length - 1] += ce; } else { o.push(co); e.push(ce); } }
  const x = o.reduce((s, v, i) => s + (v - e[i]) ** 2 / e[i], 0), df = o.length - 1; return { x, df, p: df > 0 ? codaChi2(x, df) : 1 };
}
const dice = (r) => `χ² ${r.x.toFixed(1)} su ${r.df} gradi, p = ${r.p.toPrecision(2)}`;
// i luoghi della prova, trovati e non scelti: la prima stella della galassia 0 del cosmo 1 con almeno due pianeti
let stellaP = null; for (let s = 0; s < 60 && stellaP == null; s++) if (CO.sistemaPigro(1, 0, s).pianeti.length >= 2) stellaP = s;
assert.ok(stellaP != null, 'nessuna stella con due pianeti tra le prime 60 della galassia 0');
const SISTEMA = `cosmo 1/galassia 0/stella ${stellaP}`, PIANETA = `${SISTEMA}/pianeta 0`;

console.log('A. la forma scritta');
const andataERitorno = (a, da) => { const t = L.scrivi(a), b = L.leggi(t); assert.deepEqual({ ...b, percorso: [...b.percorso], rami: { ...b.rami } }, { ...a, percorso: [...a.percorso], rami: { ...a.rami } }, `${da}: «${t}» non torna`); assert.equal(L.scrivi(b), t, `${da}: la seconda scrittura cambia`); assert.equal(t, scriviI(a), `${da}: la forma non è quella di intreccio.js`); return t; };
prova('andata e ritorno identiche sugli indirizzi che il programma produce', () => {
  const campione = [];
  // cosmo.js: il numero della biblioteca → la via → l'indirizzo, anche in un cosmo parallelo (i rami nel numero, «1#{…}»)
  for (const numero of [1, 2, 13, 4321, 96e6 + 17]) {
    const via = CO.indirizzoDi(numero), a = L.daVia(via); campione.push(andataERitorno(a, `indirizzoDi(${numero})`));
    const v2 = L.viaDi(L.leggi(L.scrivi(a))); assert.deepEqual({ ...v2 }, { ...via }, `la via di ${numero} non torna`); assert.equal(CO.numeroDi(v2), CO.numeroDi(via));
  }
  const ramo = CO.cosmoRamo(CO.cosmoRamo(1, `disco/0/${stellaP}`, 3), `cosmo 1/galassia 0/stella ${stellaP}/pianeta 0/impatto 2/dove`, 1), viaR = { cosmo: ramo, galassia: 0, stella: stellaP, pianeta: 0 };
  const aR = L.daVia(viaR); campione.push(andataERitorno(aR, 'un cosmo parallelo di cosmo.js'));
  assert.deepEqual(L.viaDi(L.leggi(L.scrivi(aR))), viaR, 'i rami del cosmo non tornano nel suo numero');
  // gli indirizzi degli eventi e delle sorgenti di cosmo.js (luoghi con un resto, o non luoghi)
  for (const r of [CO.casoDisco(ramo, 0, stellaP).radice, CO.casoLune(1, 0, stellaP, 0).radice, 'disco/1/0/53', 'cosmo 1/campo/onda 2,-1,3', `cosmo 1/galassia 0/stella ${stellaP}/pianeta 0/lune/cattura 3/eccentricità`, 'cosmo 1/galassia 3/buco', 'lingua/punto a caso/7'])
    campione.push(andataERitorno(indirizzo(r.split('/')), `evento «${r}»`));
  // intreccio.js: figlio, tempo, rami (anche con gli esiti grandi di vicini.js)
  const base = indirizzo(['cosmo 1', 'galassia 0', `stella ${stellaP}`]);
  for (const a of [base, figlio(base, 'pianeta 1'), alTempo(base, ANNI_OGGI + 1234.5 / 3.15576e7), nelRamo(base, 'cosmo 1/galassia 0/x/12.3', 1 + Math.floor(c('esito') * 1e6)), alTempo(nelRamo(base, 'b', 2), 1e9)]) campione.push(andataERitorno(a, 'intreccio.js'));
  // bolla.js: la bolla della vista 3D (anche su una luna), scritta e riletta
  for (const via of [{ cosmo: 1 }, { cosmo: 1, galassia: 0 }, { cosmo: 1, galassia: 0, stella: stellaP, pianeta: 0 }, { cosmo: 2, galassia: 1, stella: 7, pianeta: 0, luna: 1 }]) {
    const b = bolla({ percorso: percorsoDi(via), t: -3.2e9, rami: { [`disco/0/${stellaP}`]: 2 } }); campione.push(andataERitorno(b.indirizzo, 'bolla.js'));
    assert.equal(L.scrivi(leggiBolla(scriviBolla(b)).indirizzo), L.scrivi(b.indirizzo));
  }
  // bolle.js: il luogo di una bolla di contenuto, con il punto in gradi
  campione.push(andataERitorno(bollaDi({ luogo: `${PIANETA}/punto 12.5,-30`, contenuto: 'anello' }).luogo, 'bolle.js'));
  // la bolla della vista in un cosmo parallelo: bolla.js mette il numero con i rami («1#{…}») dentro il nome del cosmo
  try { const b = bollaDaVia(viaR); L.leggi(scriviI(b.indirizzo)); } catch (e) { nonTorna.push(`bolla.js (percorsoDi, e i luoghi dei corpi in src/tre: \`cosmo \${via.cosmo}\`) in un cosmo parallelo scrive «${scriviI(bollaDaVia(viaR).indirizzo).slice(0, 60)}…»: i rami finiscono dentro il nome del cosmo e il testo non si rilegge (${e.message.slice(0, 80)}…). La forma giusta è L.daVia(via): «${L.scrivi(L.daVia(viaR)).slice(0, 60)}…»`); }
  console.log(`    ${campione.length} indirizzi, per esempio «${campione[2]}», «${campione[5]}»`);
});
prova('ciò che non è nella forma canonica (o nella grammatica del luogo) non si legge, e si dice perché', () => {
  for (const t of ['cosmo 01', 'cosmo 0', 'cosmo 1/stella 5', `${PIANETA}/punto 12.50,-30`, `${PIANETA}/punto 190,0`, `${PIANETA}/punto 1,2/luna 1`, 'cosmo 1#{"b":1,"a":2}', 'cosmo 1#{"a":0}', 'cosmo 1@1e9', 'cosmo 1//galassia 0', `${PIANETA}/scala -3`])
    assert.throws(() => L.leggi(t), Error, `«${t}» non doveva leggersi`);
  assert.equal(L.canonico('cosmo 1@1e9#{"b":1,"a":2}'), 'cosmo 1@1000000000#{"a":2,"b":1}');
});

console.log('B. la misura');
prova('Kraft: la somma dei pesi dell\'indice del cosmo tende a 1 (γ e δ), con la coda stampata', () => {
  let sg = 0, sd = 0; const righe = [];
  for (let n = 1; n <= 1e6; n++) { sg += 2 ** -L.lunghezzaGamma(n); sd += 2 ** -L.lunghezzaDelta(n); if ([10, 100, 1e3, 1e4, 1e5, 1e6].includes(n)) righe.push(`N = ${n}: 1 − Σγ = ${(1 - sg).toExponential(2)}, 1 − Σδ = ${(1 - sd).toExponential(3)}`); }
  console.log(`    ${righe.join('\n    ')}`);
  // la coda esatta di γ: i gruppi interi ⌊log₂ n⌋ = k pesano 2^−(k+1); il gruppo di N è pieno fino a N
  const K = Math.floor(Math.log2(1e6)), esatta = 2 ** -K - (1e6 - 2 ** K + 1) * 2 ** -(2 * K + 1);
  assert.ok(Math.abs(1 - sg - esatta) < 1e-13, `la coda di γ ${1 - sg} contro ${esatta}`);
  assert.ok(1 - sg > 0 && 1 - sg < 2e-6 && 1 - sd > 0 && 1 - sd < 0.1, 'le code non sono quelle di un codice completo');
  // tutti i gruppi insieme: Σ_k 2^−(k+1) = 1 per γ, Σ_m 2^−ℓγ(m) = 1 per δ (Kraft con l'uguale)
  let tg = 0; for (let k = 0; k < 1100; k++) tg += 2 ** -(k + 1); assert.equal(tg, 1);
  console.log(`    ℓγ(10⁶) = ${L.lunghezzaGamma(1e6)} bit, ℓδ(10⁶) = ${L.lunghezzaDelta(1e6)} bit (la tesi: 39 e 28)`);
  assert.equal(L.lunghezzaGamma(1e6), 39); assert.equal(L.lunghezzaDelta(1e6), 28);
});
prova('HEALPix nested: il centro torna nel suo pixel, il figlio sta nel padre, le 48 caselle d\'ordine 1 hanno area uguale', () => {
  const s = c.serie('healpix');
  for (let k = 0; k <= L.ORDINE_MASSIMO; k++) for (let i = 0; i < 200; i++) {
    const pix = Math.floor(s(k * 1000 + i) * 12 * 4 ** k), [z, phi] = L.pix2angNest(k, pix);
    assert.equal(L.ang2pixNest(k, z, phi), pix, `ordine ${k}, pixel ${pix}`);
    if (k > 0) assert.equal(L.ang2pixNest(k - 1, z, phi), Math.floor(pix / 4), `ordine ${k}: il pixel ${pix} non sta nel padre`);
    const [lon, lat] = L.puntoDelPixel(k, pix); assert.equal(L.pixelDi(k, lon, lat), pix, `ordine ${k}: il punto scritto ${lon},${lat} non torna nel pixel`);
  }
  const conti = new Array(48).fill(0), N = 96000; for (let i = 0; i < N; i++) conti[L.ang2pixNest(1, 2 * s(1e6 + 2 * i) - 1, 2 * Math.PI * s(1e6 + 2 * i + 1))]++;
  const r = chi2(conti, new Array(48).fill(1 / 48), N); console.log(`    punti uniformi sulla sfera nelle 48 caselle: ${dice(r)}`); assert.ok(r.p > 1e-4, dice(r));
});
prova('i pesi di ogni livello sommano a 1 (galassie, stelle, pianeti, corpi, tempo), per ogni cosa che si può contare', () => {
  const S = CO.sistemaPigro(1, 0, stellaP), scarti = [];
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  for (const galassie of ['massa', 'uniforme']) scarti.push(1 - somma(CO.cosmo(1).galassie.map((_, g) => L.peso(`cosmo 1/galassia ${g}`, { galassie, tempo: 'adesso' }).P)) / 2 ** -1);
  scarti.push(1 - somma(CO.galassia(1, 0).stelle.map((_, s) => L.peso(`cosmo 1/galassia 0/stella ${s}`, { tempo: 'adesso' }).P)) / L.peso('cosmo 1/galassia 0', { tempo: 'adesso' }).P);
  const sopra = L.peso(SISTEMA, { tempo: 'adesso' }).P;
  for (const pianeti of ['area', 'massa', 'uniforme']) for (const lune of [true, false]) scarti.push(1 - somma(S.pianeti.map((_, p) => L.peso(`${SISTEMA}/pianeta ${p}`, { pianeti, lune, tempo: 'adesso' }).P)) / sopra);
  const P0 = S.pianeti[0], corpi = [`${PIANETA}/punto 0,0`, ...(P0.lune || []).map((l) => `${PIANETA}/luna ${l.id}/punto 0,0`)];
  for (const c0 of ['area', 'uniforme']) scarti.push(1 - somma(corpi.map((t) => L.peso(t, { corpi: c0, tempo: 'adesso' }).parti.find((x) => x.livello === 'corpo').p)));
  // il tempo: celle di una frazione non intera della vita (l'ultima è più corta)
  const eta = S.stella.eta, dt = eta / 7.3, nascita = ANNI_OGGI - eta; let st = 0;
  for (let j = 0; j < 8; j++) st += L.peso(`${PIANETA}@${nascita + (j * dt + Math.min(eta, (j + 1) * dt)) / 2}`, { granaTempo: dt }).parti.find((x) => x.livello === 'tempo').p;
  scarti.push(1 - st);
  // il luogo: 12·4^k pixel da 1/(12·4^k)
  const pl = L.peso(`${PIANETA}/punto 0,0`, { scala: P0.raggioM }).parti.find((x) => x.livello === 'luogo'); scarti.push(1 - 12 * 4 ** pl.ordine * pl.p);
  const peggiore = Math.max(...scarti.map(Math.abs)); console.log(`    ${scarti.length} somme, la più lontana da 1 di ${peggiore.toExponential(1)}`); assert.ok(peggiore < 1e-12, `scarti ${scarti}`);
  // il tempo fuori dalla vita della stella pesa 0, e lo dice
  const prima = L.peso(`${PIANETA}@${nascita - 10}`); assert.equal(prima.P, 0); assert.match(prima.parti.find((x) => x.livello === 'tempo').nota, /prima/);
});

console.log('C. la discesa a caso');
let campioneBit = [];
prova('puntoACaso è deterministico dal seme, coerente con un inizio dato, e i suoi bit sono quelli di peso()', () => {
  for (let s = 0; s < 6; s++) {
    const a = L.puntoACaso(s), b = L.puntoACaso(s); assert.equal(a.testo, b.testo); assert.equal(a.bit, b.bit);
    assert.equal(L.scrivi(L.leggi(a.testo)), a.testo, 'il punto a caso non è canonico'); assert.equal(L.peso(a.testo).bit, a.bit);
    const d = L.analizza(a.indirizzo); for (const fino of [1, 2, 3]) { const da = a.indirizzo.percorso.slice(0, fino).join('/'), r = L.puntoACaso(s, { da }); assert.equal(r.testo, a.testo, `con l'inizio «${da}» la discesa cambia`); }
    assert.ok(d.punto && d.tempo != null && Number.isFinite(a.bit)); campioneBit.push(a.bit);
    console.log(`    seme ${s}: «${a.testo}» · ${a.bit.toFixed(1)} bit (${a.peso.parti.filter((x) => x.bit > 0).map((x) => `${x.livello} ${x.bit.toFixed(1)}`).join(', ')})${a.note.length ? ` · ${a.note.join('; ')}` : ''}`);
  }
  assert.notEqual(L.puntoACaso(0).testo, L.puntoACaso(1).testo);
});
prova('puntoACaso è distribuito come peso(): χ² sui livelli economici', () => {
  const N = 3000, righe = [];
  const prove = [
    ['indice del cosmo (γ), per gruppo ⌊log₂ n⌋', { fino: 'cosmo' }, (r) => Math.min(9, Math.floor(Math.log2(L.analizza(r.indirizzo).cosmo))), Array.from({ length: 10 }, (_, k) => (k < 9 ? 2 ** -(k + 1) : 2 ** -9))],
    ['indice del cosmo (δ), per gruppo', { fino: 'cosmo', codice: 'delta' }, (r) => Math.min(9, Math.floor(Math.log2(L.analizza(r.indirizzo).cosmo))), (() => { const p = Array.from({ length: 53 }, (_, k) => 2 ** -L.lunghezzaGamma(k + 1)), Z = p.reduce((x, y) => x + y, 0); return [...p.slice(0, 9), p.slice(9).reduce((x, y) => x + y, 0)].map((x) => x / Z); })()],
    ['galassia del cosmo 1', { da: 'cosmo 1', fino: 'galassia' }, (r) => L.analizza(r.indirizzo).galassia, CO.cosmo(1).galassie.map((_, g) => L.peso(`cosmo 1/galassia ${g}`, { tempo: 'adesso' }).P * 2)],
    ['stella della galassia 0 (dieci gruppi di 250)', { da: 'cosmo 1/galassia 0', fino: 'stella' }, (r) => Math.floor(L.analizza(r.indirizzo).stella / 250), (() => { const p = new Array(10).fill(0); CO.galassia(1, 0).stelle.forEach((_, s) => { p[Math.floor(s / 250)] += L.peso(`cosmo 1/galassia 0/stella ${s}`, { tempo: 'adesso' }).P / L.peso('cosmo 1/galassia 0', { tempo: 'adesso' }).P; }); return p; })()],
    ['pianeta del sistema (per area, con le lune)', { da: SISTEMA, fino: 'pianeta' }, (r) => L.analizza(r.indirizzo).pianeta, CO.sistemaPigro(1, 0, stellaP).pianeti.map((_, p) => L.peso(`${SISTEMA}/pianeta ${p}`, { tempo: 'adesso' }).P / L.peso(SISTEMA, { tempo: 'adesso' }).P)],
    ['luogo sul pianeta 0 (le 48 caselle d\'ordine 1)', { da: PIANETA + '/scala 1000', fino: 'luogo' }, (r) => { const d = L.analizza(r.indirizzo); return L.pixelDi(1, d.punto[0], d.punto[1]); }, new Array(48).fill(1 / 48)],
    ['tempo (dieci decili della vita della stella)', { da: `${PIANETA}/punto 0,0`, fino: 'tempo' }, (r) => { const eta = CO.sistemaPigro(1, 0, stellaP).stella.eta; return Math.floor((L.analizza(r.indirizzo).tempo - (ANNI_OGGI - eta)) / eta * 10); }, new Array(10).fill(0.1)],
  ];
  for (const [nome, opz, casella, attese] of prove) {
    const conti = new Array(attese.length).fill(0); for (let i = 0; i < N; i++) conti[casella(L.puntoACaso(`χ²/${nome}/${i}`, opz))]++;
    const r = chi2(conti, attese, N); righe.push(`${nome}: ${dice(r)}`); assert.ok(r.p > 1e-4, `${nome}: ${dice(r)}`);
  }
  console.log(`    ${righe.join('\n    ')}`);
});
prova('quanto è speciale un indirizzo: i bit contro la mediana di punti a caso (nel cosmo 1)', () => {
  const tipico = L.puntoACaso('un punto qualsiasi', { da: 'cosmo 1' }), S = L.specialita(tipico.indirizzo, { N: 40, da: 'cosmo 1' });
  assert.ok(S.N === 40 && Number.isFinite(S.mediana) && S.quantile >= 0 && S.quantile <= 1);
  const raro = L.specialita(`cosmo 1/galassia ${CO.cosmo(1).galassie.length - 1}/stella ${stellaP}/pianeta 0/punto 0,0/scala 1`, { N: 40, da: 'cosmo 1' });
  console.log(`    un punto a caso: ${S.bit.toFixed(1)} bit, mediana ${S.mediana.toFixed(1)}, quantile ${S.quantile.toFixed(2)} (${S.dice}); la galassia più piccola a un metro: ${raro.bit.toFixed(1)} bit (${raro.dice})`);
  assert.ok(raro.bit > raro.mediana, 'un luogo d\'un metro nella galassia più piccola non risulta speciale');
});
prova('la stima di ciò che la misura non calcola: quante stelle hanno pianeti (la costante del condizionamento)', () => {
  let W = 0, Wp = 0; const G = CO.galassia(1, 0); for (let s = 0; s < 80; s++) { const w = G.stelle[s].peso; W += w; if (CO.sistemaPigro(1, 0, s).pianeti.length) Wp += w; }
  console.log(`    Z ≈ ${(Wp / W).toFixed(3)} sulle prime 80 stelle della galassia 0: i bit di una stella con pianeti sono ${(-Math.log2(Wp / W)).toFixed(3)} di meno di quanto peso() dice`);
  assert.ok(Wp > 0);
});

console.log('D. l\'impronta del contenuto (regola 13)');
prova('lo stesso pianeta da due strade (il cosmo e un suo ramo dove è cambiata un\'altra stella) ha la stessa impronta a ogni grana', () => {
  let altra = stellaP + 1; while (!CO.sistemaPigro(1, 0, altra).pianeti.length) altra++;
  const ramo = CO.cosmoRamo(1, `disco/0/${altra}`, 1), a = CO.sistemaPigro(1, 0, stellaP).pianeti, b = CO.sistemaPigro(ramo, 0, stellaP).pianeti;
  assert.notEqual(a, b, 'le due strade sono lo stesso oggetto: non è una prova');
  for (let p = 0; p < a.length; p++) for (let g = 0; g <= 16; g += 4) assert.ok(L.uguali(a[p], b[p], g), `pianeta ${p}, grana ${g}`);
  assert.equal(L.impronta(`${SISTEMA}/pianeta 0`).hash, L.impronta(a[0]).hash, 'dall\'indirizzo e dall\'oggetto');
  // e l'altra stella, nel suo ramo, è davvero un'altra
  const x = CO.sistemaPigro(1, 0, altra).pianeti, y = CO.sistemaPigro(ramo, 0, altra).pianeti;
  console.log(`    l'altra stella (${altra}) nel ramo: ${x.length} pianeti contro ${y.length}; ${x.length && y.length && L.uguali(x[0], y[0]) ? 'il primo uguale' : 'il primo diverso'} a grana 8`);
});
prova('pianeti diversi hanno impronte diverse; uguali a grana fine ⇒ uguali a grana grossa', () => {
  const pianeti = []; for (let s = 0; pianeti.length < 40 && s < 400; s++) pianeti.push(...CO.sistemaPigro(1, 0, s).pianeti);
  const per = (g) => pianeti.map((P) => L.impronta(P, g).hash), h8 = per(8);
  assert.equal(new Set(h8).size, pianeti.length, 'due pianeti diversi con la stessa impronta a grana 8');
  const righe = [];
  for (let g = 0; g <= 8; g++) {
    const hg = per(g), hf = per(g + 1); righe.push(`${new Set(hg).size}`);
    for (let i = 0; i < pianeti.length; i++) for (let j = i + 1; j < pianeti.length; j++) if (hf[i] === hf[j]) assert.equal(hg[i], hg[j], `grana ${g}: uguali più fini ma diversi più grossi`);
  }
  console.log(`    ${pianeti.length} pianeti; classi distinte a grana 0…8: ${righe.join(', ')}`);
  assert.equal(L.hash128(''), '6c62272e07bb014262b821756295c58d'); assert.notEqual(L.hash128('a'), L.hash128('b'));
});
prova('un pianeta parallelo (il mantello partito da un altro stato): a che grana smette di essere lo stesso', () => {
  const ramo = CO.cosmoRamo(1, `mantello/0/${stellaP}/0`, 1), a = CO.sistemaPigro(1, 0, stellaP).pianeti[0], b = CO.sistemaPigro(ramo, 0, stellaP).pianeti[0];
  const uguale = []; for (let g = 0; g <= 12; g++) uguale.push(L.uguali(a, b, g));
  const prima = uguale.indexOf(false), diversi = Object.keys(L.impronta(a, 12).campi).filter((k) => L.impronta(a, 12).campi[k] !== L.impronta(b, 12).campi[k]);
  console.log(`    ${prima < 0 ? 'uguale a ogni grana fino a 12: il mantello cambia la superficie, non le grandezze dell\'impronta; a questa grana i due rami sono lo stesso pianeta (regola 13)' : `uguale fino a grana ${prima - 1}, diverso da ${prima} (${diversi.join(', ') || '—'})`}`);
  for (let g = 1; g <= 12; g++) if (uguale[g]) assert.ok(uguale[g - 1], 'la monotonia');
});
prova('la distanza tra rami: quanti eventi sono andati diversamente (il peso manca)', () => {
  const a = L.leggi(PIANETA), b = nelRamo(nelRamo(a, 'x', 2), 'y', 1), d = L.distanzaRami(a, b);
  assert.equal(d.eventi, 2); assert.ok(d.stessoLuogo); assert.equal(L.distanzaRami(b, b).eventi, 0);
});

console.log('E. i pesi dei rami (C4)');
const LEGGI_PROVA = [['uniforme', {}], ['tra', { a: -3, b: 7 }], ['intero', { n: 7 }], ['bernoulli', { p: 0.3 }], ['discreta', { pesi: [1, 2, 3.5, 0.25] }], ['normale', {}], ['seme', {}]];
prova('normalizzazione locale: per ogni legge i pesi di tutti gli esiti sommano a 1, a ogni grana', () => {
  const righe = []; let peggiore = 0;
  for (const [l, P] of LEGGI_PROVA) for (const grana of [2, 8, 12]) { const r = M.celle(l, P, { grana }); peggiore = Math.max(peggiore, Math.abs(1 - r.somma)); if (grana === 8) righe.push(`${l} ${r.quante} esiti, 1 − Σ = ${(1 - r.somma).toExponential(1)}`); }
  console.log(`    ${righe.join('; ')}`); assert.ok(peggiore < 1e-12, `scarto ${peggiore}`);
  // la funzione d'errore contro valori di tabella (Abramowitz e Stegun)
  for (const [x, v] of [[0.5, 0.4795001221869535], [1, 0.1572992070502851], [2, 0.004677734981047266], [3, 2.209049699858544e-5], [5, 1.537459794428035e-12]]) assert.ok(Math.abs(M.erfc(x) / v - 1) < 1e-14, `erfc(${x})`);
  // a grana fine la massa della cella della campana è densità × ampiezza
  const z = 1.3, g = 22, m = M.massa({ legge: 'normale', esito: z }, { grana: g }).p, d = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * 2 ** -g; assert.ok(Math.abs(m / d - 1) < 1e-5, `${m} contro ${d}`);
});
prova('i pesi sono quelli che la fonte realizza: le frequenze degli esiti di 20 000 tiri contro le masse (χ²)', () => {
  const righe = [];
  for (const [l, P] of LEGGI_PROVA.filter(([l]) => l !== 'seme')) {
    const grana = 3, Lg = M.LEGGI[l], celle = [...Lg.celle(P, grana)], indice = new Map(celle.map((j, i) => [String(j), i])), conti = new Array(celle.length).fill(0), Lm = new Map();
    const c = M.conMisura(sorgente(`prova/lingua/legge ${l}`), Lm), N = 20000;
    for (let i = 0; i < N; i++) { const x = `tiro ${i}`; if (l === 'uniforme') c(x); else if (l === 'tra') c.tra(x, P.a, P.b); else if (l === 'intero') c.intero(x, P.n); else if (l === 'bernoulli') c.bernoulli(x, P.p); else if (l === 'discreta') c.discreta(x, P.pesi); else c.normale(x); }
    for (const v of Lm.values()) conti[indice.get(String(M.massa(v, { grana }).cella))]++;
    const r = chi2(conti, celle.map((j) => Lg.massa(j, P, grana)), N); righe.push(`${l}: ${dice(r)}`); assert.ok(r.p > 1e-4, `${l}: ${dice(r)}`);
  }
  console.log(`    ${righe.join('\n    ')}`);
});
// il caso noto: una moneta truccata (0,3) decide se leggere una campana o un tiro tra 0 e 4; un colore da tre pesi non ne dipende
const casoNoto = (c) => { const testa = c.bernoulli('moneta', 0.3), x = testa ? c.normale('se testa') : c.tra('se croce', 0, 4), colore = c.discreta('colore', [1, 2, 5]); return { testa, x, colore }; };
const RADICE_NOTA = 'prova/lingua/caso noto', MONETA = `${RADICE_NOTA}/moneta`;
const cammino = (rami) => { const Lm = new Map(); return { esito: casoNoto(M.conMisura(sorgente(RADICE_NOTA, rami), Lm)), Lm }; };
prova('il prodotto dei pesi è il rapporto di verosimiglianza su un caso noto; peso() e distanzaRami lo usano', () => {
  const base = cammino(null); let r = 1; while (cammino({ [MONETA]: r }).esito.testa === base.esito.testa) r++;
  const ramo = cammino({ [MONETA]: r }), g = M.OPZIONI_MISURA.grana, phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  // a mano: la moneta (0,3 contro 0,7), e la cella del ramo nuovo contro quella del ramo tolto: la campana φ(x)·2^−g, il tiro tra 0 e 4 2^−g
  const atteso = ramo.esito.testa ? (0.3 / 0.7) * phi(ramo.esito.x) : (0.7 / 0.3) / phi(base.esito.x), R = M.rapporto(ramo.Lm, base.Lm);
  console.log(`    ramo ${r} della moneta: ${base.esito.testa ? 'testa' : 'croce'} → ${ramo.esito.testa ? 'testa' : 'croce'}; rapporto ${R.P.toPrecision(6)} (a mano ${atteso.toPrecision(6)}), ${R.bit.toFixed(3)} bit; contano ${R.diversi.map((v) => v.evento.slice(RADICE_NOTA.length + 1)).join(', ')}; ${R.uguali} si semplifica (il colore)`);
  assert.ok(Math.abs(R.P / atteso - 1) < 1e-4, `${R.P} contro ${atteso}`); assert.equal(R.diversi.length, 3); assert.equal(R.uguali, 1);
  // ogni cammino è normalizzato: i bit di un cammino sono la somma dei −log₂ p delle sue voci, e il rapporto è la differenza
  assert.ok(Math.abs(R.bit - (M.storia(ramo.Lm).bit - M.storia(base.Lm).bit)) < 1e-9);
  // nella lingua: il peso dell'indirizzo con quel ramo (i due cammini), e la distanza tra i due rami, orientata
  const a = L.componi({ ...L.analizza('cosmo 1'), rami: { [MONETA]: r } }), pa = L.peso(a, { tempo: 'adesso', registri: { base: base.Lm, mondo: ramo.Lm } });
  assert.ok(Math.abs(pa.parti.find((x) => x.livello === 'rami').p / R.P - 1) < 1e-12); assert.ok(Math.abs(pa.bit - (L.peso('cosmo 1', { tempo: 'adesso' }).bit + R.bit)) < 1e-9);
  const dAB = L.distanzaRami('cosmo 1', a, { registri: { a: base.Lm, b: ramo.Lm } }), dBA = L.distanzaRami(a, 'cosmo 1', { registri: { a: ramo.Lm, b: base.Lm } });
  assert.equal(dAB.eventi, 1); assert.ok(Math.abs(dAB.bit - R.bit) < 1e-12 && Math.abs(dAB.bit + dBA.bit) < 1e-12);
  // solo l'evento del ramo, data la sua legge: la moneta sola (ciò che ne discende non c'è)
  const solo = L.distanzaRami('cosmo 1', a, { leggi: base.Lm }); assert.ok(Math.abs(solo.peso - (ramo.esito.testa ? 0.3 / 0.7 : 0.7 / 0.3)) < 1e-12, solo.nota);
  // senza leggi: il tiro è uniforme, peso 1, e lo dice
  const nudo = L.peso(a, { tempo: 'adesso' }).parti.find((x) => x.livello === 'rami'); assert.equal(nudo.p, 1); assert.match(nudo.conta, /senza legge dichiarata/);
  // i rami realizzano la legge: su 4000 rami la moneta è testa ~30 volte su cento
  let teste = 0; for (let k = 1; k <= 4000; k++) if (M.conMisura(sorgente(RADICE_NOTA, { [MONETA]: k })).bernoulli('moneta', 0.3)) teste++;
  assert.ok(Math.abs(teste / 4000 - 0.3) < 4 * Math.sqrt(0.21 / 4000), `${teste} teste su 4000`);
  console.log(`    su 4000 rami della moneta ${teste} teste (atteso 1200 ± 29)`);
});
prova('un consumatore vero (disco.js) letto con le leggi: i suoi tiri sono uniformi, il rapporto conta solo i tiri in più o in meno', () => {
  let detto = null;
  for (let n = 1; n <= 40 && !detto; n++) {
    const radice = `prova/stella ${n}/disco`, L0 = new Map(), P0 = formaPianeti({ massa: 1, Z: 1, eta: 4.6e9 }, M.conMisura(sorgente(radice), L0)), incontri = [...L0.keys()].filter((x) => /\/incontro con \d+$/.test(x)); if (!incontri.length) continue;
    for (let r = 1; r <= 12 && !detto; r++) { const L1 = new Map(), P1 = formaPianeti({ massa: 1, Z: 1, eta: 4.6e9 }, M.conMisura(sorgente(radice, { [incontri[0]]: r }), L1)); if (L1.size === L0.size) continue;
      const R = M.rapporto(L1, L0); assert.ok(Math.abs(R.bit - (L1.size - L0.size) * M.OPZIONI_MISURA.grana) < 1e-6, `${R.bit}`); assert.ok([...L0.values(), ...L1.values()].every((v) => v.legge === 'uniforme'));
      detto = `${radice}: l'incontro ${incontri[0].split('/').slice(-2).join(' ')} al ramo ${r} fa ${P1.length} pianeti invece di ${P0.length} e legge ${L1.size} tiri invece di ${L0.size}: ${R.bit.toFixed(0)} bit (${L1.size - L0.size} tiri × ${M.OPZIONI_MISURA.grana}), tutti «uniforme»: la legge vera (una probabilità confrontata col tiro dentro disco.js) non arriva al registro`; }
  }
  assert.ok(detto, 'nessun incontro che cambi il numero dei tiri'); console.log(`    ${detto}`); nonTorna.push('i tiri di disco.js, lune.js, galassie.js e quasi tutti gli altri sono letti senza legge (c(…) nudo, poi confrontato con una probabilità): pesano come uniformi, il rapporto dei loro rami è 1 (a parità di tiri). Per pesarli i consumatori devono usare c.bernoulli, c.discreta, c.intero, c.tra, c.normale (la patch di eventi.js le aggiunge; misura.conMisura ne fa le veci)');
});

console.log('F. dal campione al vero');
prova('le galassie e le stelle vere: N per livello (come cosmo3d.js), pesi 1/N che sommano a 1, bit log₂ N', () => {
  const V = L.galassieVere(1), F = cosmo3d(CO.cosmo(1), 'cosmo 1', null, { toroM: CO.TORO_M });
  assert.ok(Math.abs(V.perGalassia - F.peso) <= 0.5, `${V.perGalassia} contro cosmo3d ${F.peso}`);
  const G = CO.galassia(1, 0), s0 = G.stelle.findIndex((S) => S.peso > 1), S0 = G.stelle[s0], Ns = L.stelleVereDi(S0);
  const pg = L.peso(`cosmo 1/galassia 0/vera ${V.perGalassia - 1}`, { tempo: 'adesso' }).parti.find((x) => x.livello === 'vera galassia'), ps = L.peso(`cosmo 1/galassia 0/stella ${s0}/vera 0`, { tempo: 'adesso' }).parti.find((x) => x.livello === 'vera stella');
  assert.ok(Math.abs(pg.p * V.perGalassia - 1) < 1e-12 && Math.abs(ps.p * Ns - 1) < 1e-12);
  assert.equal(L.peso(`cosmo 1/galassia 0/vera ${V.perGalassia}`, { tempo: 'adesso' }).P, 0); assert.equal(L.peso(`cosmo 1/galassia 0/stella ${s0}/vera ${Ns}`, { tempo: 'adesso' }).P, 0);
  const riservate = G.stelle.map((S, s) => [S, s]).filter(([S]) => S.peso === 1); for (const [, s] of riservate) assert.equal(L.peso(`cosmo 1/galassia 0/stella ${s}/vera 0`).parti.find((x) => x.livello === 'vera stella').p, 1);
  // il totale delle stelle vere di una galassia: Σ N_s = stelleVere (entro l'arrotondamento)
  const somma = G.stelle.reduce((t, S) => t + L.stelleVereDi(S), 0); assert.ok(Math.abs(somma / G.stelleVere - 1) < 1e-6, `${somma} contro ${G.stelleVere}`);
  console.log(`    cosmo 1: ${V.vere.toExponential(2)} galassie vere (aloni da ${V.massaMinima.toExponential(1)} M☉) in ${V.campione} del campione: ${V.perGalassia} ciascuna, ${pg.bit.toFixed(1)} bit; galassia 0: ${G.stelleVere.toExponential(2)} stelle vere in ${G.stelle.length}, ${Ns} per stella del campione (${ps.bit.toFixed(1)} bit), ${riservate.length} vere una per una (le ultime supernove)`);
});
prova('puntoACaso è uniforme sulle stelle vere, non sul campione: χ² sull\'indice globale della stella vera e sulla galassia vera', () => {
  const G = CO.galassia(1, 0), Nst = G.stelle.map(L.stelleVereDi), cum = []; let t = 0; for (const n of Nst) { cum.push(t); t += n; }
  const N = 3000, conti = new Array(20).fill(0), contiG = new Array(10).fill(0), Ng = L.galassieVere(1).perGalassia; let riservate = 0;
  for (let i = 0; i < N; i++) { const d = L.analizza(L.puntoACaso(`χ²/vere/${i}`, { da: 'cosmo 1/galassia 0', fino: 'vera stella', tempo: 'adesso' }).indirizzo); conti[Math.floor((cum[d.stella] + d.veraStella) / t * 20)]++; contiG[Math.floor(d.veraGalassia / Ng * 10)]++; if (Nst[d.stella] === 1) riservate++; }
  const r = chi2(conti, new Array(20).fill(1 / 20), N), rg = chi2(contiG, new Array(10).fill(0.1), N);
  console.log(`    ${N} stelle vere della galassia 0, indice globale in 20 parti uguali: ${dice(r)}; galassia vera in 10 parti: ${dice(rg)}; stelle vere una per una (peso 1) estratte: ${riservate} (sul campione uniforme sarebbero ~${(N * Nst.filter((n) => n === 1).length / Nst.length).toFixed(1)})`);
  assert.ok(r.p > 1e-4 && rg.p > 1e-4, `${dice(r)}; ${dice(rg)}`); assert.equal(riservate, 0);
  // e la discesa intera resta coerente con un inizio dato che passa per le vere
  const a = L.puntoACaso('vere/coerenza'); for (const fino of [3, 5]) assert.equal(L.puntoACaso('vere/coerenza', { da: a.indirizzo.percorso.slice(0, fino).join('/') }).testo, a.testo);
  assert.equal(L.peso(a.testo).bit, a.bit);
});
prova('la stella vera: che cosa varia (massa nella classe, con Kroupa; età nel passo) e che cosa no; la galassia vera', () => {
  const G = CO.galassia(1, 0), s0 = G.stelle.findIndex((S) => S.peso > 1 && S.stato === 'in vita'), S0 = G.stelle[s0], base = `cosmo 1/galassia 0/stella ${s0}`;
  const uDi = (m) => { let lo = 0, hi = 1; for (let i = 0; i < 64; i++) { const x = (lo + hi) / 2; if (massaNascita(x) < m) lo = x; else hi = x; } return lo; };
  const K = 1000, conti = new Array(8).fill(0); let primo = null;
  for (let k = 0; k < K; k++) {
    const v = L.stellaVera(`${base}/vera ${k * 7919}`); if (!primo) primo = v;
    assert.equal(v.Z, S0.Z); assert.equal(v.componente, S0.componente); assert.ok(v.massaNascita >= v.classe.da && v.massaNascita < v.classe.a * (1 + 1e-12), `massa ${v.massaNascita}`);
    assert.ok(S0.massa >= v.classe.da && S0.massa < v.classe.a, 'la classe non è quella del campione'); assert.ok(v.eta / 1e9 <= GAL.T0 - v.passo.da + 1e-9 && v.eta / 1e9 >= GAL.T0 - v.passo.a - 1e-9);
    const ua = uDi(v.classe.da), ub = uDi(v.classe.a); conti[Math.min(7, Math.floor((uDi(v.massaNascita) - ua) / (ub - ua) * 8))]++;
  }
  assert.deepEqual(L.stellaVera(`${base}/vera 0`), L.stellaVera(`${base}/vera 0`));
  const r = chi2(conti, new Array(8).fill(1 / 8), K); assert.ok(r.p > 1e-4, dice(r));
  console.log(`    stella ${s0} del campione (${S0.massa.toFixed(3)} M☉, ${(S0.eta / 1e9).toFixed(2)} Ga, ${S0.stato}) → la vera 0: ${primo.massaNascita.toFixed(3)} M☉ (classe ${primo.classe.da.toFixed(3)}–${primo.classe.a.toFixed(3)}), ${(primo.eta / 1e9).toFixed(2)} Ga, ${primo.stato}; la massa nella classe è di Kroupa: ${dice(r)}. Uguali: ${primo.uguale.join(', ')}`);
  const gv = L.galassiaVera(`cosmo 1/galassia 0/vera 5`); assert.deepEqual(gv.posto, L.galassiaVera('cosmo 1/galassia 0/vera 5').posto); assert.notDeepEqual(gv.posto, L.galassiaVera('cosmo 1/galassia 0/vera 6').posto); assert.ok(gv.posto.every((x) => x >= 0 && x < CO.TORO_M));
  const sn = G.stelle.findIndex((S) => S.peso === 1); if (sn >= 0) assert.equal(L.stellaVera(`cosmo 1/galassia 0/stella ${sn}/vera 0`).campione, G.stelle[sn]);
  nonTorna.push('una stella vera ha il sistema dei pianeti (e il luogo, e il tempo) della stella del campione che la rappresenta: il modello ne calcola uno per stella del campione; il suo posto non è calcolato. Una galassia vera è quella del campione in un altro posto del toro, senza correlazioni tra aloni');
});

console.log('G. le fusioni (C11)');
prova('fondi raggruppa per impronta e somma i pesi: il peso totale si conserva a ogni grana, lo stesso pianeta da due strade si fonde', () => {
  const sistemi = []; for (let s = 0; sistemi.length < 3 && s < 200; s++) if (CO.sistemaPigro(1, 0, s).pianeti.length) sistemi.push(s);
  let altra = sistemi.at(-1) + 1; while (!CO.sistemaPigro(1, 0, altra).pianeti.length) altra++;
  const ramo = CO.cosmoRamo(1, `disco/0/${altra}`, 1), voci = [];
  for (const s of [...sistemi, altra]) for (const cosmoN of [1, ramo]) CO.sistemaPigro(cosmoN, 0, s).pianeti.forEach((_, p) => voci.push(L.scrivi(L.daVia({ cosmo: cosmoN, galassia: 0, stella: s, pianeta: p }))));
  const O = { tempo: 'adesso' }, righe = []; let prima = Infinity;
  for (let g = 8; g >= 0; g -= 2) {
    const F = L.fondi(voci, g, O); assert.ok(Math.abs(F.totale / F.ingresso - 1) < 1e-12, `grana ${g}: ${F.totale} contro ${F.ingresso}`);
    assert.ok(F.classi.length <= prima, 'più classi a grana più grossa'); prima = F.classi.length; righe.push(`grana ${g}: ${F.classi.length} classi`);
    // ogni pianeta delle stelle non toccate dal ramo sta nella stessa classe nei due mondi
    for (const s of sistemi) CO.sistemaPigro(1, 0, s).pianeti.forEach((_, p) => { const a = L.scrivi(L.daVia({ cosmo: 1, galassia: 0, stella: s, pianeta: p })), b = L.scrivi(L.daVia({ cosmo: ramo, galassia: 0, stella: s, pianeta: p })); assert.ok(F.classi.some((C) => C.membri.includes(a) && C.membri.includes(b)), `${a} e ${b} non si fondono a grana ${g}`); });
  }
  const F8 = L.fondi(voci, 8, O); console.log(`    ${voci.length} cilindri (${sistemi.length + 1} sistemi nel cosmo 1 e nel ramo «disco/0/${altra}»): ${righe.join(', ')}; peso totale ${F8.ingresso.toExponential(4)} conservato`);
  // lo stesso cilindro due volte si conta una; due cilindri uno dentro l'altro non si sommano
  assert.equal(L.fondi([...voci, voci[0]], 8, O).ingresso, F8.ingresso);
  assert.throws(() => L.fondi([PIANETA, `${PIANETA}/punto 0,0`], 8, O), /disgiunti/);
});

console.log('H. i cervelli di Boltzmann (C13)');
prova('la storia evolutiva contro quella per fluttuazione, per un pianeta con acqua liquida e atmosfera: il rapporto in bit', () => {
  const contenuto = (P) => P.tipo === 'roccioso' && P.clima?.acqua === 'liquida' && P.clima.pressione > 0;
  const fr = L.frazione(contenuto, { N: 120, seme: 'C13', da: 'cosmo 1', pianeti: 'uniforme', lune: false, vere: false });
  const f = fr.f || fr.limite, masse = fr.trovati.map((x) => x.P.massaKg).sort((x, y) => x - y), Mp = masse.length ? masse[masse.length >> 1] : 5.97e24;
  // quanti pianeti ha il cosmo 1 (ordine di grandezza): stelle vere per massa in stelle dalla galassia 0, per tutte le galassie vere, per i pianeti di una stella
  const C = CO.cosmo(1), G0 = CO.galassia(1, 0), stellePerMassa = G0.stelleVere / C.galassie[0].forma.massaStelle, V = L.galassieVere(1);
  let pianeti = 0, sistemi = 0; for (let s = 0; s < 20; s++) { pianeti += CO.sistemaPigro(1, 0, s).pianeti.length; sistemi++; }
  const stelle = C.galassie.reduce((t, G) => t + G.forma.massaStelle * stellePerMassa * V.perGalassia, 0), oggetti = stelle * (pianeti / sistemi);
  const B = M.cervelliDiBoltzmann({ massaKg: Mp, frazioneEvolutiva: f, oggettiNelMondo: oggetti, volumeMondoM3: CO.TORO_M ** 3, etaAnni: ANNI_OGGI });
  console.log(`    via evolutiva: ${fr.si} pianeti su ${fr.N} (per numero, cosmo 1) hanno acqua liquida e atmosfera: f = ${f.toFixed(3)} ± ${fr.errore.toFixed(3)} (${B.bitEvolutivaOggetto.toFixed(1)} bit); nel cosmo ~10^${Math.log10(oggetti).toFixed(1)} pianeti, ~2^${B.log2Evolutivi.toFixed(0)} con quel contenuto`);
  console.log(`    via per fluttuazione: un pianeta di ${Mp.toExponential(2)} kg = ${B.particelle.toExponential(2)} atomi dal mezzo (${B.mezzo.nome}): s_gas = ${B.entropiaGas.toFixed(1)} k, ΔS = ${B.deltaS_k.toExponential(2)} k → ${B.bitFluttuazioneTentativo.toExponential(2)} bit per tentativo; tentativi nel cosmo fino a oggi ≤ 2^${B.log2Tentativi.toFixed(0)}`);
  console.log(`    RAPPORTO evolutivi / per fluttuazione = 2^${B.rapportoBit.toExponential(3)} (${B.conta}). ${B.nota}`);
  assert.ok(B.rapportoBit > 1e40 && B.bitFluttuazioneTentativo > 1e3 * B.log2Tentativi);
  // e un cervello (1,4 kg d'acqua, 2,8 k per atomo; massa media 6 u): la fluttuazione costa molto meno di un pianeta, ma i tentativi restano pochi
  const cervello = M.cervelliDiBoltzmann({ massaKg: 1.4, massaParticella: 6 * 1.66053907e-27, entropiaPerParticella: 2.8, frazioneEvolutiva: 1, oggettiNelMondo: 1, volumeMondoM3: CO.TORO_M ** 3, etaAnni: ANNI_OGGI });
  console.log(`    un cervello di 1,4 kg per fluttuazione: ${cervello.bitFluttuazioneTentativo.toExponential(2)} bit per tentativo contro ≤ 2^${cervello.log2Tentativi.toFixed(0)} tentativi; il suo peso evolutivo (per osservatore) manca: nessun modulo sa dove c'è un osservatore`);
  assert.ok(cervello.bitFluttuazioneTentativo > 1e3 * cervello.log2Tentativi);
});

if (nonTorna.length) console.log(`\nNON TORNA:\n  · ${nonTorna.join('\n  · ')}`);
console.log(`\nMANCA alla misura: le leggi dichiarate dai consumatori (i tiri nudi pesano come uniformi) e la patch del registro di eventi.js; i sistemi delle stelle vere (hanno quello del campione); la costante «ha pianeti»; i momenti d'osservatore per il tempo e per C13; le ampiezze sotto la decoerenza (C11 somma i pesi).`);
console.log(`\ntest_lingua_indirizzo: ${ok} prove, tutto ok (${((performance.now() - T0) / 1000).toFixed(1)} s)`);
