// test_lingua_indirizzo.mjs — il linguaggio dell'indirizzo (src/camera/lingua.js, LINGUA.md):
//   A. la forma scritta: andata e ritorno identiche su indirizzi veri del programma (cosmo.js, bolla.js, bolle.js,
//      intreccio.js, eventi) e rifiuto di ciò che non è canonico;
//   B. la misura: Kraft per l'indice del cosmo (la coda stampata), HEALPix (pixel di area uguale, annidati), i pesi di
//      ogni livello che sommano a 1;
//   C. la discesa a caso: deterministica, coerente con un inizio dato, distribuita come peso() (χ² sui livelli economici);
//   D. l'impronta del contenuto: uguale per lo stesso pianeta da due strade, diversa per pianeti diversi, monotona.
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

if (nonTorna.length) console.log(`\nNON TORNA:\n  · ${nonTorna.join('\n  · ')}`);
console.log(`\nMANCA alla misura: le probabilità dei rami (pesano 1); i bit per scegliere una stella vera tra le ~${Math.round(CO.galassia(1, 0).pesoCampione).toExponential(1)} che ogni stella del campione rappresenta; la costante «ha pianeti»; i momenti d'osservatore per il tempo.`);
console.log(`\ntest_lingua_indirizzo: ${ok} prove, tutto ok (${((performance.now() - T0) / 1000).toFixed(1)} s)`);
