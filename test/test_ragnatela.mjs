// test_ragnatela.mjs — la grande scala (ragnatela.js; INTRECCIO.md regole 2, 4, 5, 7, 8, 9, 11, 12):
//   A. la ragnatela dal campo (classi dal tensore di marea, frazioni, vuoti, scheletro, sotto la risoluzione);
//   B. che cosa c'è nel vuoto (barioni, fotoni, neutrini, la nebbia degli aloni);
//   C. il fondo cosmico come immagine del seme (ricombinazione, picchi, cielo dalle stesse onde, dipolo, topologia);
//   D. il verso inverso (una macchia di cielo, un filamento, un vuoto come vincoli sulle onde);
//   E. l'universo osservabile; F. la scena per il motore; e i costi.
// DISCIPLINA: le soglie delle prove (assert) vengono dalla teoria o dall'errore di campionamento, dette prima di guardare;
// le statistiche sono su più cosmi presi dalla fonte degli eventi (nessun seme scelto); i RISCONTRI con l'universo vero
// hanno una fascia detta prima e, se non tornano, si stampa «≠ NON TORNA» senza fermare la catena.
import assert from 'node:assert/strict';
import * as R from '../src/camera/ragnatela.js';
import { campoCondizionato, campoLibero } from '../src/camera/bolle.js';
import { ampiezzeLibere, ondeDelToro } from '../src/camera/cosmo3d.js';
import { COSMOLOGIA as U } from '../src/camera/galassie.js';
import { campoCosmo } from '../src/camera/spazio3d.js';
import { sorgente } from '../src/camera/eventi.js';
import { TORO_M } from '../src/camera/cosmo.js';
import { FILTRI } from '../src/camera/campo_pigro.js';
import { MPC as LEGGI_MPC, COSTANTI } from '../src/camera/leggi.js'; // il Mpc e il kpc (e c): un posto solo

let ok = 0; const T0 = performance.now(), nonTorna = [], costi = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const riscontro = (che, x, a, b, vero) => { const torna = x >= a && x <= b; if (!torna) nonTorna.push(`${che}: ${num(x)} (chiesto ${num(a)}–${num(b)})`); console.log(`      ${torna ? '=' : '≠ NON TORNA '} ${che}: ${num(x)} (chiesto ${num(a)}–${num(b)}; vero ${vero})`); return torna; };
const ms = (f) => { const t = performance.now(), r = f(); return [r, performance.now() - t]; };
const costa = (che, t, quante = 1) => costi.push([che, t / quante]);
const L = TORO_M, MPC = LEGGI_MPC, GLY = 9.4607e24, GA = 3.156e16, c = sorgente('prova/ragnatela');
// sei CAMPI DI ONDE SU UN TORO (kmax 24: il campo di prima): le prove della teoria (Doroshkevich, la massa che si conserva, il
// cielo di un toro con i suoi cerchi). I cosmi della biblioteca sono il campo senza bordo: le loro prove sono quelle sul cosmo 1, 2, 3.
const COSMI = [0, 1, 2, 3, 4, 5].map((i) => campoLibero(`prova/ragnatela/cosmo ${i}`, { kmax: 24 }));
const punto = (nome) => [L * c(`${nome}/x`), L * c(`${nome}/y`), L * c(`${nome}/z`)];
const versore = (nome) => { const z = 2 * c(`${nome}/z`) - 1, f = 2 * Math.PI * c(`${nome}/fi`), r = Math.sqrt(1 - z * z); return [r * Math.cos(f), r * Math.sin(f), z]; };
const sc = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const media = (v) => v.reduce((a, b) => a + b, 0) / v.length, scarto = (v) => { const m = media(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };

{ const [, t1] = ms(() => R.ricombinazione()); costa('ricombinazione (Peebles, una volta per tutte)', t1); const [, t2] = ms(() => R.fondoCosmico(COSMI[0])); costa('le tabelle del fondo per il toro (una volta: 570 numeri d\'onda, equazioni fino all\'ultima diffusione)', t2); }

// =====================================================================================================
console.log('A. la ragnatela dal campo');
prova('doveSono legge lo stesso campo di cosmo3d (senza bordo): densità, marea, velocità; gli assi sono autovettori; la traccia è δ', () => {
  const F = campoCosmo(1); let peggio = 0, assi = 0;
  for (let i = 0; i < 6; i++) { const p = punto(`cosmo3d ${i}`), x = p.map((v) => v / L), w = R.doveSono(1, p), T = F.marea(x).T, v = F.velocita(x);
    peggio = Math.max(peggio, Math.abs(w.delta - (T[0] + T[1] + T[2])), Math.abs(w.delta - F.densita(x)) / 1e4 /* (densita somma i livelli utili, la marea anche i più grossi: 10⁻¹⁰ della varianza) */, Math.abs(w.autovalori[0] + w.autovalori[1] + w.autovalori[2] - w.delta), ...v.map((q, d) => Math.abs(q - w.velocita[d]) / 300));
    const M = [[T[0], T[3], T[4]], [T[3], T[1], T[5]], [T[4], T[5], T[2]]];
    w.assi.forEach((e, a) => { for (let d = 0; d < 3; d++) assi = Math.max(assi, Math.abs(sc(M[d], e) - w.autovalori[a] * e[d])); assi = Math.max(assi, Math.abs(sc(e, e) - 1)); });
    assert.ok(w.autovalori[0] >= w.autovalori[1] && w.autovalori[1] >= w.autovalori[2]); assert.equal(w.classe, R.CLASSI[w.autovalori.filter((l) => l > 0).length]); }
  assert.ok(peggio < 1e-9, `differenza con cosmo3d ${peggio}`); assert.ok(assi < 1e-9, `gli assi non sono autovettori: ${assi}`);
  const [, t] = ms(() => { for (let i = 0; i < 50; i++) R.doveSono(COSMI[0], punto(`tempo ${i}`)); }); costa('doveSono su un toro di onde (un punto, 28 888 onde)', t, 50); const [, tp] = ms(() => { for (let i = 0; i < 20; i++) R.doveSono(1, punto(`tempo ${i}`)); }); costa('doveSono sul cosmo 1 (campo senza bordo, 11 livelli)', tp, 20);
  console.log(`      (differenza massima con cosmo3d: ${num(peggio)}; T·e − λe: ${num(assi)})`);
});

prova('la classe non cambia nel tempo (la soglia zero è quella di Zel\'dovich); il contrasto cresce come D; la direzione è l\'asse che non crolla', () => {
  let filamenti = 0;
  for (let i = 0; i < 60; i++) { const F = COSMI[i % 6], p = punto(`tempo ${i}`), oggi = R.doveSono(F, p), prima = R.doveSono(F, p, { t: -8 * GA }), D = prima.crescita;
    assert.equal(prima.classe, oggi.classe); assert.ok(D < 1 && Math.abs(D - U.D(U.scala(U.tempo(1) - 8 * GA / 3.156e16))) < 1e-12, 'la crescita è quella di galassie.js a quel tempo'); assert.ok(Math.abs(prima.delta - D * oggi.delta) < 1e-12);
    if (oggi.numero === 0) assert.ok(prima.densita > oggi.densita && prima.densita < 1, 'un vuoto si svuota col tempo'); if (oggi.numero === 3 && !oggi.crollato) assert.ok(prima.densita < oggi.densita && prima.densita > 1, 'un nodo si addensa'); // (con autovalori di segno misto la densità di Zel'dovich non è monotona: non lo si chiede)
    const d = R.direzioneFilamento(F, p); if (oggi.numero === 2) { filamenti++; assert.ok(Math.abs(Math.abs(sc(d, oggi.assi[2])) - 1) < 1e-12); } else assert.equal(d, null); }
  // con una soglia di comodo (0,3) i vuoti sono di più: è dichiarata, non è il valore di partenza
  let v0 = 0, v3 = 0; for (let i = 0; i < 300; i++) { const p = punto(`soglia ${i}`); v0 += R.doveSono(COSMI[i % 6], p).numero === 0; v3 += R.doveSono(COSMI[i % 6], p, { soglia: 0.3 }).numero === 0; } assert.ok(v3 > v0);
  console.log(`      (${filamenti} filamenti su 60 punti; vuoti su 300 punti: ${v0} con soglia 0, ${v3} con soglia 0,3 [Forero-Romero et al. 2009, di comodo])`);
});

let GRIGLIE = null;
prova('la sintesi separabile sulla griglia è il campo esatto (stessi numeri della somma diretta), su tutto il toro e in una regione', () => {
  let peggio = 0; const O = R.ondeDi(COSMI[0]);
  const [G, t] = ms(() => R.classiSuGriglia(COSMI[0], null, { celle: 48 })); costa('classi su tutto il toro, griglia 48³', t);
  const reg = { centro: punto('regione'), lato: 0.13 * L, celle: 20 }, [Gr, tr] = ms(() => R.classiSuGriglia(COSMI[0], reg)); costa('classi in una regione, griglia 20³', tr);
  for (const [g, n] of [[G, 48], [Gr, 20]]) for (let i = 0; i < 12; i++) { const a = [0, 1, 2].map((d) => Math.floor(n * c(`nodo ${n}/${i}/${d}`))), q = a[2] * n * n + a[1] * n + a[0], d = R.dentro.nelPunto(O, a.map((v, k) => g.origine[k] + v * g.passo));
    peggio = Math.max(peggio, Math.abs(d.delta - g.campo.delta[q]), Math.abs(d.T[0] - g.campo.xx[q]), Math.abs(d.T[1] - g.campo.yy[q]), Math.abs(d.T[2] - g.campo.zz[q]), Math.abs(d.T[3] - g.campo.xy[q]), Math.abs(d.T[4] - g.campo.xz[q]), Math.abs(d.T[5] - g.campo.yz[q])); }
  assert.ok(peggio < 1e-11, `sintesi e somma diretta differiscono di ${peggio}`);
  GRIGLIE = COSMI.map((F, i) => (i === 0 ? G : R.classiSuGriglia(F, null, { celle: 48 })));
  console.log(`      (differenza massima: ${num(peggio)}; 48³ nodi in ${num(t)} ms: la somma diretta ne chiederebbe ~${num((48 ** 3 * 0.4) / 1000)} s)`);
});

prova('le frazioni per classe: 8%, 42%, 42%, 8% dei punti (Doroshkevich 1970: esatto per un campo gaussiano), su sei cosmi', () => {
  const fr = GRIGLIE.map((G) => R.frazioni(null, { griglia: G })), teoria = [0.08, 0.42, 0.42, 0.08];
  // la soglia: quattro errori standard, misurati dallo scarto tra i sei cosmi (più l'arrotondamento della teoria, 0,005)
  for (let k = 0; k < 4; k++) { const v = fr.map((f) => f.massa[k]), m = media(v), es = scarto(v) / Math.sqrt(6); assert.ok(Math.abs(m - teoria[k]) < 4 * es + 0.005, `${R.CLASSI[k]}: ${m} ± ${es} (teoria ${teoria[k]})`); }
  const D = R.doroshkevich(); for (let k = 0; k < 4; k++) assert.ok(Math.abs(D.frazioni[k] - teoria[k]) < 4 * Math.sqrt((teoria[k] * (1 - teoria[k])) / D.n) + 0.005, `Doroshkevich campionata: ${D.frazioni[k]}`);
  for (let k = 0; k < 4; k++) for (let d = 0; d < 3; d++) assert.ok(Math.abs(media(fr.map((f) => f.autovaloriMedi[k][d])) - D.autovalori[k][d]) < 0.03, 'gli autovalori medi per classe sono quelli della distribuzione di Doroshkevich');
  const m = (f) => [0, 1, 2, 3].map((k) => media(fr.map((x) => f(x)[k])));
  const massa = m((x) => x.massa), volume = m((x) => x.volume), dens = m((x) => x.densita);
  console.log(`      massa (parte dei punti): ${massa.map((v) => (100 * v).toFixed(1)).join(' / ')} %   volume (Zel'dovich): ${volume.map((v) => (100 * v).toFixed(1)).join(' / ')} %   ρ/ρ̄ media: ${dens.map((v) => num(v)).join(' / ')}   crollati (λ₁ ≥ 1): ${(100 * media(fr.map((x) => x.crollati))).toFixed(2)} %   σ del campo: ${num(fr[0].sigma)}`);
  // RISCONTRI con ΛCDM. Volume: Hahn et al. 2007, simulazione, lisciatura 2,1 Mpc/h, soglia 0 [V sul testo]; fascia detta prima: ±20%
  [13.5, 53.6, 31.2, 1.7].forEach((v, k) => riscontro(`volume dei ${['vuoti', 'fogli', 'filamenti', 'nodi'][k]} (%), lisciatura ~50 Mpc contro 3 Mpc`, 100 * volume[k], 0.8 * v, 1.2 * v, `${v} (Hahn et al. 2007, N corpi)`));
  // Massa: Cautun et al. 2014 (NEXUS+, altro metodo) [R]: 15 / 24 / 50 / 11 %; fascia ±30%
  [15, 24, 50, 11].forEach((v, k) => riscontro(`massa nei ${['vuoti', 'fogli', 'filamenti', 'nodi'][k]} (%)`, 100 * massa[k], 0.7 * v, 1.3 * v, `${v} (Cautun et al. 2014, altro metodo) [R]`));
});

prova('la massa si conserva (regola 4): il volume di Zel\'dovich medio sul toro è 1 (det(1 − T) senza alias: griglia 80³)', () => {
  // ∫det(1 − T) = 1 esatto su un toro: i termini quadratici e cubici sono divergenze. Con 80 nodi per lato il prodotto di tre
  // onde (fino a 72 giri) non fa alias: la media sulla griglia è l'integrale.
  const [F, t] = ms(() => R.sintesi(COSMI[1], [0, 0, 0], 1 / 80, 80)); costa('sintesi di δ e marea, griglia 80³', t); let s = 0, sd = 0; const n3 = 80 ** 3;
  for (let q = 0; q < n3; q++) { const a = 1 - F.xx[q], b = 1 - F.yy[q], e = 1 - F.zz[q], xy = -F.xy[q], xz = -F.xz[q], yz = -F.yz[q]; s += a * (b * e - yz * yz) - xy * (xy * e - yz * xz) + xz * (xy * yz - b * xz); sd += F.delta[q]; }
  assert.ok(Math.abs(s / n3 - 1) < 1e-9, `volume medio ${s / n3}`); assert.ok(Math.abs(sd / n3) < 1e-12, 'il contrasto medio è zero');
  console.log(`      (volume medio − 1 = ${num(s / n3 - 1)}; contrasto medio ${num(sd / n3)})`);
});

prova('i vuoti: regioni connesse di classe vuoto; ogni centro è davvero un vuoto; taglia e contrasto su sei cosmi', () => {
  const V = GRIGLIE.map((G, i) => { const [v, t] = ms(() => R.vuoti(null, { griglia: G })); if (!i) costa('vuoti di tutto il toro (da una griglia 48³)', t); return v; });
  V.forEach((v, i) => { const fr = R.frazioni(null, { griglia: GRIGLIE[i] }); assert.ok(Math.abs(v.frazioneDiVolume - fr.volume[0]) < 1e-9); assert.ok(v.n > 100);
    for (const u of v.vuoti.slice(0, 5)) { const w = R.doveSono(COSMI[i], u.centro); assert.equal(w.classe, 'vuoto'); assert.ok(Math.abs(w.delta - u.deltaMinimo) < 1e-5 && w.densita < 1 && Math.abs(w.densita - u.densitaMinima) < 1e-4); } });
  const raggio = media(V.map((v) => v.raggioTipicoM / MPC)), grande = media(V.map((v) => v.vuoti[0].raggioM / MPC)), contrasto = media(V.map((v) => v.contrastoMedio)), centri = media(V.map((v) => v.contrastoNeiCentri));
  console.log(`      (${num(media(V.map((v) => v.n)))} vuoti per toro, cella ${num(V[0].latoCellaM / MPC)} Mpc; il più grande ${num(grande)} Mpc; parte del volume ${(100 * media(V.map((v) => v.frazioneDiVolume))).toFixed(1)} %)`);
  // RISCONTRI: Pan et al. 2012 (SDSS DR7, 1054 vuoti [V sull'estratto]): raggi da 10 a 30 Mpc/h, mediana 17; δ < −0,85 ai bordi; 62% del volume
  const h = U.h; riscontro('raggio tipico dei vuoti (Mpc)', raggio, 10 / h, 30 / h, 'mediana 17 Mpc/h = 25 Mpc, da 10 a 30 Mpc/h (Pan et al. 2012)');
  riscontro('contrasto di densità nel centro dei vuoti', centri, -1, -0.8, '< −0,85 (Pan et al. 2012); −0,8 al guscio (Sheth & van de Weygaert 2004) [R]');
  riscontro('contrasto medio dei vuoti', contrasto, -1, -0.8, 'come sopra: il campo lineare con onde ≥ 50 Mpc non scava abbastanza');
  riscontro('parte del volume nei vuoti (%)', 100 * media(V.map((v) => v.frazioneDiVolume)), 50, 80, '62 (Pan et al. 2012), 77 (Cautun et al. 2014): con la soglia zero si prende solo il cuore dei vuoti');
});

prova('lo scheletro dei filamenti in una regione: creste di densità, unite lungo la direzione; le galassie stanno su filamenti e nodi', () => {
  let punti = 0, segmenti = 0, lunga = 0, sopra = 0;
  for (let i = 0; i < 3; i++) { const reg = { centro: punto(`scheletro ${i}`), lato: L / 3, celle: 32 }, [S, t] = ms(() => R.scheletro(COSMI[i], reg)); if (!i) costa('scheletro di una regione di 400 Mpc, griglia 32³', t);
    const S2 = R.scheletro(COSMI[i], reg); assert.deepEqual([...S.pos], [...S2.pos]); assert.deepEqual([...S.segmenti], [...S2.segmenti]); // funzione pura
    assert.ok(S.n > 300 && S.m > 200); punti += S.n; segmenti += S.m; lunga += S.lunghezzaM;
    for (let a = 0; a < S.n; a += Math.ceil(S.n / 40)) { const w = R.doveSono(COSMI[i], [S.pos[3 * a], S.pos[3 * a + 1], S.pos[3 * a + 2]]); assert.ok(w.numero >= 2 && w.numero === S.classe[a]); assert.ok(Math.abs(w.delta - S.delta[a]) < 1e-5); assert.ok(Math.abs(Math.abs(sc(w.assi[2], [S.direzione[3 * a], S.direzione[3 * a + 1], S.direzione[3 * a + 2]])) - 1) < 1e-5); }
    for (let s = 0; s < S.m; s++) { const a = S.segmenti[2 * s], b = S.segmenti[2 * s + 1], d = [0, 1, 2].map((k) => { const q = S.pos[3 * b + k] - S.pos[3 * a + k]; return q - L * Math.round(q / L); /* il toro si richiude */ }), r = Math.hypot(...d); assert.ok(a < b && b < S.n && r < 1.8 * S.latoCellaM); assert.ok(Math.abs(sc(d, [S.direzione[3 * a], S.direzione[3 * a + 1], S.direzione[3 * a + 2]])) / r > 0.5 - 1e-9); }
    // sulla cresta la densità è più alta della media dei punti di classe filamento o nodo della stessa regione
    const G = S.griglia; let m = 0, k = 0; for (let q = 0; q < G.classe.length; q++) if (G.classe[q] >= 2) { m += G.delta[q]; k++; } const cresta = media([...S.delta]); assert.ok(cresta > m / k); sopra += cresta - m / k; }
  // le galassie dei cosmi della biblioteca stanno sui picchi del campo a onde lunghe: lisciando a 30 Mpc, più di metà in filamenti e nodi
  let dentro = 0, tutte = 0, aCaso = 0; for (const n of [1, 2]) { const F = campoCosmo(n); F.pos.forEach((x, g) => { tutte++; if (R.doveSono(n, x.map((v) => v * L), { scala: 30 * MPC }).numero >= 2) dentro++; if (R.doveSono(n, punto(`a caso ${n}/${g}`), { scala: 30 * MPC }).numero >= 2) aCaso++; }); }
  // (prova binomiale contro il 50% dei punti a caso: quattro scarti)
  assert.ok(dentro / tutte > 0.5 + 4 * Math.sqrt(0.25 / tutte), `galassie in filamenti e nodi: ${dentro} su ${tutte}`);
  console.log(`      (in media ${num(punti / 3)} punti e ${num(segmenti / 3)} segmenti per regione, ${num(lunga / 3 / MPC)} Mpc di filamenti in (${num(L / 3 / MPC)} Mpc)³; sulla cresta δ è più alto di ${num(sopra / 3)}; galassie in filamenti o nodi: ${dentro} su ${tutte}, punti a caso ${aCaso} su ${tutte})`);
});

prova('sotto la risoluzione (regola 4): raffina aggiunge onde più corte, eventi con indirizzo, senza cambiare quelle che c\'erano', () => {
  const F = COSMI[2], O = R.ondeDi(F), [Rf, t] = ms(() => R.raffina(F, 48)); costa('raffina da 50 a 25 Mpc (2,0·10⁵ onde in più)', t);
  assert.equal(Rf.N, ondeDelToro(L, 48).N); assert.equal(Rf.aggiunte, Rf.N - O.N); assert.ok(Rf.sigma > O.sigma);
  // le onde lunghe: identiche bit per bit; le nuove: gli eventi che cosmo3d leggerebbe con kmax = 48
  const dove = new Map(); for (let m = 0; m < Rf.N; m++) dove.set(`${Rf.KX[m]},${Rf.KY[m]},${Rf.KZ[m]}`, m);
  for (let m = 0; m < O.N; m++) { const q = dove.get(`${O.KX[m]},${O.KY[m]},${O.KZ[m]}`); assert.ok(Rf.A[q] === O.A[m] && Rf.B[q] === O.B[m]); }
  const tutte = ampiezzeLibere('prova/ragnatela/cosmo 2', null, ondeDelToro(L, 48)), q = dove.get('30,-7,11'); assert.ok(Rf.A[q] === tutte.A[q] && Rf.B[q] === tutte.B[q] && Rf.A[q] !== 0);
  assert.throws(() => R.raffina(1, 30), /dettaglio/); // il cosmo della biblioteca è senza bordo: lì si guarda più fine con `dettaglio`
  // ciò che si aggiunge non cambia ciò che si vedeva da lontano: lisciato a 60 Mpc il campo è lo stesso; da vicino c'è dettaglio nuovo
  let lontano = 0, vicino = 0, cambiate = 0; for (let i = 0; i < 40; i++) { const p = punto(`fine ${i}`), a = R.doveSono(F, p, { scala: 60 * MPC }), b = R.doveSono(Rf, p, { scala: 60 * MPC }), a0 = R.doveSono(F, p), b0 = R.doveSono(Rf, p); lontano = Math.max(lontano, Math.abs(a.delta - b.delta)); vicino += (a0.delta - b0.delta) ** 2; if (a0.classe !== b0.classe) cambiate++; assert.equal(a.classe, b.classe); }
  assert.ok(lontano < 1e-9, `lisciato a 60 Mpc cambia di ${lontano}`); const atteso = Math.sqrt(Rf.sigma ** 2 - O.sigma ** 2); tra(Math.sqrt(vicino / 40) / atteso, 0.6, 1.4, 'lo scarto del dettaglio aggiunto rispetto a quello dello spettro');
  // nella regione guardata: una griglia fine costa poco anche con otto volte le onde
  const [, tg] = ms(() => R.classiSuGriglia(Rf, { centro: punto('zoom'), lato: 200 * MPC, celle: 32 })); costa('classi in una regione di 200 Mpc con le onde fino a 25 Mpc, 32³', tg);
  const [, tp] = ms(() => { for (let i = 0; i < 10; i++) R.doveSono(Rf, punto(`fine ${i}`)); }); costa('doveSono con le onde fino a 25 Mpc (2,3·10⁵)', tp, 10);
  console.log(`      (σ del campo: ${num(O.sigma)} → ${num(Rf.sigma)}; a 60 Mpc cambia di ${num(lontano)}; nel punto lo scarto aggiunto è ${num(Math.sqrt(vicino / 40))} (atteso ${num(atteso)}); la classe nel punto cambia in ${cambiate} punti su 40)`);
  const c12 = R.costoDelToro(L, 12.5 * MPC), c6 = R.costoDelToro(L, 6.25 * MPC);
  console.log(`      LIMITE DICHIARATO: è pigro nella scala, non nello spazio. Fino a 12 Mpc: ${num(c12.onde)} onde (${num(c12.memoriaByte / 1e6)} MB); fino a 6 Mpc: ${num(c6.onde)} onde (${num(c6.memoriaByte / 1e6)} MB, ${num(c6.msPerGenerarle / 1000)} s). Sotto servono pacchetti con un posto: non fatto.`);
});

prova('il cosmo senza bordo: senza `dettaglio` tutto è com\'era; più fine aggiunge solo livelli fini; la griglia per convoluzione è il campo nel punto', () => {
  const p0 = punto('completo'); assert.deepEqual(R.doveSono(1, p0), R.doveSono(1, p0, { dettaglio: null }));
  let lontano = 0; for (let i = 0; i < 4; i++) { const p = punto(`completo ${i}`); lontano = Math.max(lontano, Math.abs(R.doveSono(1, p, { scala: 60 * MPC, dettaglio: 12 * MPC }).delta - R.doveSono(1, p, { scala: 60 * MPC }).delta)); }
  // (i livelli aggiunti hanno onde sotto i 37 Mpc: lisciati a 60 Mpc pesano quanto la loro varianza lì, e^(−k²R²/2): quattro scarti)
  const Cp = R.dentro.campoDi(1), resto = Math.sqrt(Cp.libero.varianza({ scala: 60 * MPC, livello: 18, soglia: 0 }) - Cp.libero.varianza({ scala: 60 * MPC, livello: 16, soglia: 0 }));
  assert.ok(lontano < 4 * resto && resto < 1e-6, `lisciato a 60 Mpc il dettaglio pesa ${lontano} (scarto atteso ${resto})`);
  const fine = R.doveSono(1, p0, { dettaglio: 12 * MPC }); assert.ok(fine.risoluzioneM < 0.5 * R.doveSono(1, p0).risoluzioneM);
  // la griglia (trasformata per i livelli fini, nodi a un quarto di cella e Catmull–Rom per i grossi) contro il punto
  const reg = { centro: punto('completo regione'), lato: 150 * MPC, celle: 12 }, [G, tg] = ms(() => R.classiSuGriglia(1, reg)); costa('classi su una regione 12³ del cosmo 1 (convoluzione per regione)', tg);
  let e = 0; for (const [i, j, k] of [[3, 7, 5], [0, 0, 0], [11, 2, 9]]) { const q = (k * 12 + j) * 12 + i, p = [i, j, k].map((v, d) => (G.origine[d] + v * G.passo) * G.toroM), w = R.doveSono(1, p); e = Math.max(e, Math.abs(w.delta - G.campo.delta[q])); assert.equal(w.numero, G.classe[q]); }
  // (l'errore dichiarato: l'interpolazione dei livelli grossi, ~10⁻³ della loro parte: qui un millesimo dello scarto)
  assert.ok(e < 1e-3 * G.sigma, `griglia e punto differiscono di ${e}`); assert.equal(G.periodica, false);
  const [Gq, tq] = ms(() => R.classiSuGriglia(1, { centro: punto('completo regione'), lato: 400 * MPC, celle: 32 })); costa('classi su una regione 32³ del cosmo 1 (convoluzione per regione)', tq); void Gq;
  console.log(`      (lisciato a 60 Mpc il dettaglio fino a 12 Mpc pesa ${num(lontano)}; griglia contro punto: ${num(e)} (scarto ${num(G.sigma)}); passo della griglia ${num(G.latoCellaM / MPC)} Mpc)`);
});

prova('i riscontri che non tornavano, rimisurati a risoluzione fine (cosmi 1 e 2): quanto era risoluzione e quanto è il campo lineare', () => {
  const righe = []; let ultimo = null;
  for (const [det, lato] of [[null, 400], [12, 200], [6, 100]]) { const fr = [1, 2].map((n) => R.frazioni(null, { griglia: R.classiSuGriglia(n, { centro: punto(`fine ${det}/${n}`, L), lato: lato * MPC, celle: 24 }, det ? { dettaglio: det * MPC } : {}) })), m = (f) => media(fr.map(f));
    ultimo = { massa: [0, 1, 2, 3].map((k) => m((x) => x.massa[k])), volVuoti: m((x) => x.volumeDeiVuoti), densVuoti: m((x) => x.densitaDeiVuoti), crollati: m((x) => x.crollati) };
    righe.push(`onde fino a ${det ?? '~40'} Mpc: massa ${ultimo.massa.map((v) => (100 * v).toFixed(0)).join('/')} %; volume dei vuoti ${(100 * ultimo.volVuoti).toFixed(0)} %; contrasto medio dei vuoti ${num(ultimo.densVuoti - 1)}; crollati ${(100 * ultimo.crollati).toFixed(0)} %`); }
  for (const r of righe) console.log(`      ${r}`);
  for (let k = 0; k < 4; k++) assert.ok(Math.abs(ultimo.massa[k] - [0.08, 0.42, 0.42, 0.08][k]) < 0.08, 'a ogni risoluzione i punti restano 8/42/42/8 (entro lo scarto di due regioni)');
  riscontro('contrasto medio dei vuoti, onde fino a 6 Mpc', ultimo.densVuoti - 1, -1, -0.8, '< −0,85 (Pan et al. 2012)');
  riscontro('parte del volume nei vuoti (%), onde fino a 6 Mpc', 100 * ultimo.volVuoti, 50, 80, '62 (Pan et al. 2012), 77 (Cautun et al. 2014)');
  riscontro('massa nei vuoti (%), a ogni risoluzione', 100 * ultimo.massa[0], 10.5, 19.5, '15 (Cautun et al. 2014) [R]: qui è l\'8% del teorema gaussiano, limite del campo lineare');
});

// =====================================================================================================
console.log('B. che cosa c\'è nel vuoto');
prova('il contenuto di un punto: barioni, materia oscura, fotoni del fondo, neutrini, luce delle galassie, campo magnetico', () => {
  const V = R.vuoti(null, { griglia: GRIGLIE[0] }), centro = V.vuoti[0].centro, [C, t] = ms(() => R.contenutoCosmico(COSMI[0], centro, 0)); costa('contenutoCosmico (un punto, con la nebbia degli aloni)', t);
  for (const k of ['barioni', 'materiaOscura', 'fotoniDelFondo', 'neutrini', 'luceDelleGalassie', 'campoMagnetico']) { assert.ok(typeof C[k].fonte === 'string' && /\[[VRD]/.test(C[k].fonte), `${k} ha la fonte con la marca`); assert.ok(C[k].unita); }
  assert.equal(C.dove.classe, 'vuoto'); assert.ok(C.barioni.nucleoni < C.barioni.mediaCosmica && C.barioni.stato.startsWith('ionizzato') && C.barioni.frazioneNeutra < 1e-3 && C.campoMagnetico.incerto && C.materiaOscura.particelle === null);
  assert.ok(Math.abs(C.barioni.nucleoni - C.barioni.mediaCosmica * C.dove.densita) < 1e-12 && Math.abs(C.barioni.idrogeno + 4 * C.barioni.elio - C.barioni.nucleoni) < 1e-12, 'i nucleoni si contano una volta');
  tra(C.fotoniDelFondo.perCm3, 410, 412, 'fotoni del fondo per cm³'); tra(C.neutrini.perCm3PerSpecie, 111.5, 112.6, 'neutrini per cm³ per specie'); tra(C.neutrini.temperatura, 1.94, 1.95, 'temperatura dei neutrini');
  // nel tempo: (1+z)³ per i numeri, e lo stato del gas attraversa ricombinazione e reionizzazione
  const z2 = R.contenutoCosmico(COSMI[0], centro, (U.tempo(1 / 3) - U.tempo(1)) * GA), z20 = R.contenutoCosmico(COSMI[0], centro, (U.tempo(1 / 21) - U.tempo(1)) * GA);
  tra(z2.z, 1.99, 2.01, 'z'); assert.ok(Math.abs(z2.fotoniDelFondo.numero / C.fotoniDelFondo.numero - 27) < 0.3); assert.ok(z2.barioni.stato.startsWith('ionizzato') && z20.barioni.stato.startsWith('neutro') && z20.barioni.temperatura < z20.fotoniDelFondo.temperatura && z20.barioni.frazioneNeutra > 0.999);
  assert.equal(z2.dove.classe, C.dove.classe); assert.ok(z2.dove.densita > C.dove.densita, 'il vuoto si svuota col tempo');
  console.log(`      nel centro del vuoto più grande del cosmo 0 (δ lineare ${num(C.dove.delta)}, ρ/ρ̄ = ${num(C.dove.densita)}): ${num(C.barioni.nucleoni)} nucleoni/m³ (media ${num(C.barioni.mediaCosmica)}), ${num(C.barioni.elettroniLiberi)} elettroni/m³, ${num(C.barioni.idrogenoNeutro)} atomi neutri/m³, T ≈ ${num(C.barioni.temperatura)} K;`);
  console.log(`      materia oscura ${num(C.materiaOscura.densita)} kg/m³; fotoni del fondo ${num(C.fotoniDelFondo.perCm3, 4)}/cm³; neutrini ${num(C.neutrini.perCm3PerSpecie, 4)}/cm³ per specie; luce delle galassie ${num(100 * C.luceDelleGalassie.rispettoAlFondo)}% dell'energia del fondo; B tra ${num(C.campoMagnetico.minimo)} e ${num(C.campoMagnetico.massimo)} T (incerto)`);
  riscontro('barioni medi oggi (nucleoni per m³)', C.barioni.mediaCosmica, 0.24, 0.26, '0,25 [R]'); riscontro('fotoni per barione', C.fotoniDelFondo.perBarione, 1.55e9, 1.75e9, '1,64·10⁹ (η = 6,1·10⁻¹⁰, Planck 2018) [R]');
  riscontro('fotoni del fondo per cm³', C.fotoniDelFondo.perCm3, 410, 412, '411 (da T₀ = 2,7255 K)'); riscontro('neutrini fossili per cm³ per specie', C.neutrini.perCm3PerSpecie, 111, 113, '112');
});

prova('la nebbia degli aloni (regola 9): con l\'ambiente medio è Press–Schechter di galassie.js; nel vuoto le nane restano, le grandi spariscono', () => {
  // seconda via: senza ambiente è U.aloni, bit per bit (stessa legge, stessa σ(M))
  const V10 = ((4 / 3) * Math.PI * (10 * MPC) ** 3) / MPC ** 3; for (const M of [1e8, 1e10, 1e12]) { const a = R.aloniAttesi(COSMI[0], [0, 0, 0], 10 * MPC, { fasce: [[M, 1e16]] }).fasce[0].senzaAmbiente / V10; assert.ok(Math.abs(a / U.aloni(M) - 1) < 1e-12, `senza ambiente: ${a} contro ${U.aloni(M)}`); }
  const rn = [], rg = [], nane = [];
  for (let i = 0; i < 6; i++) { const v = R.vuoti(null, { griglia: GRIGLIE[i] }).vuoti[0], A = R.aloniAttesi(COSMI[i], v.centro, 10 * MPC); assert.ok(A.delta0 < 0 && A.rapportoDiDensita < 1);
    const n = A.fasce[1], g = A.fasce[3]; nane.push(n.attesi); rn.push(n.attesi / n.senzaAmbiente); rg.push(g.attesi / g.senzaAmbiente); assert.ok(n.attesi > 100, 'zoomando nel vuoto qualcosa si trova'); assert.ok(g.attesi / g.senzaAmbiente < n.attesi / n.senzaAmbiente, 'le grandi mancano più delle piccole'); }
  // nel passato ce n'erano meno (la crescita)
  const p = punto('aloni nel tempo'), oggi = R.aloniAttesi(COSMI[0], p, 10 * MPC).fasce[2].senzaAmbiente, prima = R.aloniAttesi(COSMI[0], p, 10 * MPC, { t: -12 * GA }).fasce[2].senzaAmbiente; assert.ok(prima < oggi);
  // la media sugli ambienti ridà la funzione di massa del cosmo (la nebbia vista da sopra e contata da sotto: regola 4)
  const somma = [0, 0, 0, 0]; let medio = null; const NP = 240; for (let i = 0; i < NP; i++) { const A = R.aloniAttesi(COSMI[i % 6], punto(`nebbia ${i}`), 10 * MPC); A.fasce.forEach((f, k) => { somma[k] += f.perMpc3DiMateria / NP; }); medio = A.fasce.map((f) => f.perMpc3Medio); }
  console.log(`      nel centro del vuoto più grande di ogni cosmo, entro 10 Mpc: ${num(media(nane))} aloni nani (10⁸–10¹⁰ M☉: ${num(media(rn))} della media del cosmo), aloni oltre 10¹² M☉: ${num(media(rg))} della media`);
  ['10⁶–10⁸', '10⁸–10¹⁰', '10¹⁰–10¹²', '> 10¹²'].forEach((n, k) => riscontro(`aloni ${n} M☉ per unità di materia, media su ${NP} ambienti a caso (sfere di 10 Mpc) / media del cosmo`, somma[k] / medio[k], 0.85, 1.15, '1 (la somma sugli ambienti è il totale: esatto solo col filtro netto in k e la barriera assorbente)'));
});

prova('gli aloni uno per uno (aloniIn): picchi con esclusione, eventi con indirizzo, gli stessi da ogni regione; le galassie della biblioteca non nascono due volte', () => {
  const lato = 20 * MPC, M0 = 2e12, RL = (M) => Math.cbrt((3 * M) / (4 * Math.PI * U.Om * U.rhoC * 1e9)) * MPC; let trovati = 0, attesi = 0, psi2 = 0, quanti = 0; const righe = [];
  for (const n of [1, 2]) { const reg = { centro: punto(`aloni ${n}`, L), lato }, [A, t] = ms(() => R.aloniIn(n, reg, { massaMinima: M0 })); if (n === 1) costa('aloniIn: regione di 20 Mpc, aloni sopra 2·10¹² M☉', t); trovati += A.n; attesi += A.attesi;
    for (const a of A.aloni) { assert.ok(a.massa >= M0 && (a.galassia != null || (a.massa <= A.massaMassima && a.altezza >= 1.686 && /\/aloni\/passo \d+\/cella -?\d+,-?\d+,-?\d+$/.test(a.indirizzo)))); for (let d = 0; d < 3; d++) if (a.galassia == null) assert.ok(Math.abs(a.posizione[d] - a.iniziale[d] - a.spostamento[d]) < 1e-6 * MPC); if (a.galassia == null) { psi2 += Math.hypot(...a.spostamento) ** 2; quanti++; } }
    assert.equal(new Set(A.aloni.map((a) => a.indirizzo)).size, A.n);
    for (let a = 0; a < A.n; a++) for (let b = a + 1; b < A.n; b++) { const d = Math.hypot(...A.aloni[a].iniziale.map((v, k) => v - A.aloni[b].iniziale[k])); assert.ok(d >= RL(A.aloni[a].massa) + RL(A.aloni[b].massa) - 1e-6 * MPC || A.aloni[a].galassia != null || A.aloni[b].galassia != null, 'due aloni non si sovrappongono'); }
    // l'identità: una regione spostata e più grande; ogni alone che sta in tutte e due è lo stesso (indirizzo e massa), bit per bit
    const B = R.aloniIn(n, { centro: reg.centro.map((v, d) => v + [7, -4, 3][d] * MPC), lato: 1.5 * lato }, { massaMinima: M0 }), mb = new Map(B.aloni.map((a) => [a.indirizzo, a])); let comuni = 0;
    for (const a of A.aloni) { const dentroB = a.iniziale.every((v, d) => Math.abs(v - (reg.centro[d] + [7, -4, 3][d] * MPC)) < 0.75 * lato - 2 * A.passoM); if (!dentroB) continue; /* (a due nodi dal bordo: il bordo della regione è arrotondato al reticolo) */ comuni++; const b = mb.get(a.indirizzo); assert.ok(b && b.massa === a.massa && Math.abs(b.altezza - a.altezza) < 1e-12 /* (la trasformata arrotonda a 10⁻¹⁶) */, `l'alone ${a.indirizzo} non è lo stesso nelle due regioni`); }
    righe.push(`cosmo ${n}: ${A.n} aloni sopra ${num(M0)} M☉ in (20 Mpc)³ (attesi dalla nebbia nell'ambiente: ${num(A.attesi)}; δ₀ = ${num(A.delta0)}); ${comuni} anche nella regione spostata, tutti identici; nebbia sotto: ${num(A.nebbia[1].attesi)} aloni tra 10⁸ e ${num(M0)} M☉`); }
  // una galassia della biblioteca: sta nell'elenco una volta sola, con il suo alone, e nessun picco nasce dove tocca la sua sfera
  const Fc = campoCosmo(1), g0 = Fc.pos[0].map((v) => v * L), G = R.aloniIn(1, { centro: g0, lato }, { massaMinima: M0 }), sue = G.aloni.filter((a) => a.galassia === 0); assert.equal(sue.length, 1); assert.ok(sue[0].indirizzo === 'cosmo 1/galassia 0');
  for (const a of G.aloni) if (a.galassia == null) assert.ok(Math.hypot(...a.iniziale.map((v, k) => v - g0[k])) >= RL(sue[0].massa) + RL(a.massa) - 1e-6 * MPC, 'nessun alone tocca una galassia della biblioteca');
  trovati += G.n - 1; attesi += G.attesi;
  // lo scarto tra le due letture delle coordinate sulle galassie della biblioteca: |Ψ| nei loro punti
  let s2 = 0, ng = 0; for (const n of [1, 2]) campoCosmo(n).motiGalassie().forEach((v) => { s2 += v[0] ** 2 + v[1] ** 2 + v[2] ** 2; ng++; }); const scartoMpc = Math.sqrt(s2 / ng) / (67.7 * R.dentro.f0Crescita);
  for (const r of righe) console.log(`      ${r}`);
  console.log(`      attorno alla galassia 0 del cosmo 1 (alone di ${num(sue[0].massa)} M☉): ${G.n - 1} altri aloni; spostamento |Ψ| degli aloni trovati: ${num(Math.sqrt(psi2 / Math.max(1, quanti)) / MPC)} Mpc; LE DUE LETTURE: le ${ng} galassie della biblioteca stanno nel punto del loro picco, la lettura che conserva la massa le metterebbe a ${num(scartoMpc)} Mpc (scarto quadratico medio di Ψ)`);
  riscontro('aloni trovati su attesi da Press–Schechter nell\'ambiente (tre regioni)', trovati / attesi, 1 - 4 / Math.sqrt(attesi), 1 + 4 / Math.sqrt(attesi), '1 entro Poisson; l\'esclusione senza catene ne toglie qualcuno (dichiarato)');
});

// =====================================================================================================
console.log('C. il fondo cosmico');
prova('la ricombinazione e la cosmologia escono dalle leggi: z*, orizzonte sonoro, angolo acustico, reionizzazione', () => {
  const r = R.ricombinazione();
  assert.ok(Math.abs(r.sigmaT / 6.6524587e-29 - 1) < 1e-3, 'σ_T dalle costanti'); assert.ok(Math.abs(r.eps0 / 1.602e-19 / 13.6057 - 1) < 1e-3, 'ε₀ dalle costanti');
  assert.ok(r.xe(1700) > 0.99 && r.xe(800) < 0.01 && r.residuo > 1e-4 && r.residuo < 1e-3); assert.ok(r.zPicco < r.zTau1 && r.zPicco > 1000);
  console.log(`      z* (τ = 1) = ${num(r.zTau1, 5)}; picco della visibilità z = ${num(r.zPicco, 5)}, largo ${r.larghezza}; r_s = ${num(r.orizzonteSonoroMpc, 5)} Mpc; raggio dell'ultima diffusione ${num(r.raggioMpc, 5)} Mpc; età allora ${num(r.etaUltimaAnni)} anni; elettroni residui ${num(r.residuo)}; k di Silk ${num(r.kSilk)} /Mpc`);
  riscontro('z dell\'ultima diffusione', r.zTau1, 1079, 1101, '1089,9 (Planck 2018) [R]'); riscontro('orizzonte sonoro (Mpc)', r.orizzonteSonoroMpc, 143, 146, '144,4 (Planck 2018) [R]');
  riscontro('100·θ* (angolo acustico)', 100 * r.angoloSonoro, 1.0307, 1.0515, '1,0411 ± 0,0003 (Planck 2018) [V]'); riscontro('z della reionizzazione (ricavato da τ = 0,054)', r.zReionizzazione, 6.9, 8.4, '7,67 ± 0,73 (Planck 2018) [R]');
  riscontro('ampiezza primordiale A_s che il campo sottintende (σ₈ e BBKS)', R.ampiezzaPrimordiale(0.05), 1.89e-9, 2.31e-9, '2,10·10⁻⁹ (Planck 2018) [R]');
});

prova('le sorgenti di un\'onda: a grande scala Sachs–Wolfe, il potenziale tardo è (3/5)ζ; i picchi acustici dello spettro', () => {
  const [s, t] = ms(() => R.sorgentiDelFondo(1e-4)); costa('sorgenti di un\'onda (equazioni fino all\'ultima diffusione)', t);
  assert.ok(s.S0 < 0 && s.Phi > 0 && s.Psi < 0, 'in una sovradensità grande il cielo è più freddo');
  const tardo = R.sorgentiDelFondo(1e-5, 0.02); tra(tardo.Phi / (0.6 * R.dentro.ZETA_SU_PHI), 0.985, 1.015, 'il potenziale fuori dall\'orizzonte nell\'era della materia, su (3/5)ζ');
  riscontro('[Θ₀+Ψ]/Ψ a grande scala', s.S0 / s.Psi, 0.3, 0.45, '1/3 nell\'era della materia (Sachs & Wolfe 1967); un po\' di più con la radiazione che c\'è ancora');
  const ell = []; for (let l = 2; l <= 30; l += 4) ell.push(l); for (let l = 40; l <= 1000; l += 10) ell.push(l);
  const [S, ts] = ms(() => R.spettroAtteso(ell, COSMI[0])); costa(`spettro atteso C_ℓ (${ell.length} valori di ℓ, continuo e toro)`, ts);
  const Dl = (i) => ((ell[i] * (ell[i] + 1)) / (2 * Math.PI)) * S.continuo[i] * (R.DATI.T0 * 1e6) ** 2, picco = (a, b) => { let m = -1; ell.forEach((l, i) => { if (l >= a && l <= b && (m < 0 || Dl(i) > Dl(m))) m = i; }); return m; };
  const p1 = picco(100, 400), p2 = picco(420, 650), p3 = picco(700, 950), pianura = media(ell.map((l, i) => (l <= 30 ? Dl(i) : NaN)).filter(Number.isFinite));
  assert.ok(Dl(p1) > 2 * pianura && ell[p1] > 150 && ell[p1] < 300, 'c\'è un primo picco acustico'); assert.ok(ell[p2] > 430 && ell[p2] < 640 && ell[p3] > 710 && ell[p3] < 940, 'e i successivi');
  console.log(`      ℓ(ℓ+1)C_ℓ/2π (µK²), universo senza bordo: pianura ${num(pianura)}; picchi a ℓ = ${ell[p1]}, ${ell[p2]}, ${ell[p3]} alti ${num(Dl(p1))}, ${num(Dl(p2))}, ${num(Dl(p3))}`);
  riscontro('pianura di Sachs–Wolfe, ℓ ≤ 30 (µK²)', pianura, 700, 1300, '~1000 (Planck) [R]');
  riscontro('posizione del primo picco', ell[p1], 209, 231, '220 (Planck) [R]; qui manca l\'effetto Sachs–Wolfe integrato, che lo sposta a ℓ più bassi');
  riscontro('altezza del primo picco (µK²)', Dl(p1), 4600, 6900, '5750 (Planck) [R]; senza Sachs–Wolfe integrato è più basso');
  riscontro('posizione del secondo picco', ell[p2], 510, 564, '537 [R]'); riscontro('posizione del terzo picco', ell[p3], 770, 851, '810 [R]');
  riscontro('altezza del secondo picco (µK²)', Dl(p2), 2000, 3000, '2500 [R]');
});

prova('il cielo dalle stesse onde: lo scarto è quello atteso (su sei cosmi), ~10⁻⁵; il dipolo è la velocità dell\'osservatore', () => {
  const rapporti = [], vel = []; let scartoCielo = 0, atteso = 0, F0 = null;
  COSMI.forEach((F, i) => { const oss = { posizione: punto(`osservatore ${i}`) }, [Fo, t] = ms(() => R.fondoCosmico(F, oss)); if (!i) { costa('fondoCosmico per un osservatore (tabelle già fatte)', t); F0 = Fo; }
    let s = 0; const N = 300, [, td] = ms(() => { for (let k = 0; k < N; k++) s += Fo.in(versore(`cielo ${i}/${k}`)) ** 2; }); if (!i) costa('una direzione di cielo (ΔT/T)', td, N);
    rapporti.push(Math.sqrt(s / N) / Fo.scartoAtteso); scartoCielo += Math.sqrt(s / N) / 6; atteso = Fo.scartoAtteso;
    // il dipolo: v/c, e la mappa col dipolo è la mappa più n·v/c; la velocità è quella lineare del campo lì
    const n = versore(`dipolo ${i}`), w = R.doveSono(F, oss.posizione); assert.ok(Math.abs(Fo.in(n, { dipolo: true }) - Fo.in(n) - (sc(n, Fo.osservatore.velocita) * 1e3) / COSTANTI.c) < 1e-15);
    assert.ok(Math.hypot(...w.velocita.map((v, d) => v - Fo.osservatore.velocita[d])) < 1e-9); assert.ok(Math.abs(Fo.dipolo.ampiezza - (Fo.dipolo.velocita * 1e3) / COSTANTI.c) < 1e-15); vel.push(Fo.dipolo.velocita);
    for (let k = 0; k < 2; k++) vel.push(R.fondoCosmico(F, { posizione: punto(`osservatore ${i}/${k}`) }).dipolo.velocita); });
  // la soglia: 300 direzioni danno lo scarto entro il 4% per cosmo; la media di sei entro l'1,7%: quattro scarti = 7%
  tra(media(rapporti), 0.93, 1.07, 'scarto del cielo misurato su quello atteso, media su sei cosmi');
  const moto = { motoProprio: [100, 0, 0], posizione: F0.osservatore.posizione }, Fm = R.fondoCosmico(COSMI[0], moto); assert.ok(Math.abs(Fm.osservatore.velocita[0] - F0.osservatore.velocita[0] - 100) < 1e-9);
  vel.sort((a, b) => a - b); const mediana = vel[vel.length >> 1];
  console.log(`      scarto del cielo: ${num(scartoCielo)} = ${num(scartoCielo * R.DATI.T0 * 1e6)} µK (atteso per questo toro ${num(atteso)}); velocità di ${vel.length} osservatori: da ${num(vel[0])} a ${num(vel[vel.length - 1])} km/s, mediana ${num(mediana)} → dipolo ${num((mediana * 1e3) / COSTANTI.c)}`);
  riscontro('ampiezza delle fluttuazioni ΔT/T', scartoCielo, 1e-5, 1e-4, '~10⁻⁵ (COBE); scarto del cielo vero ~110 µK = 4·10⁻⁵ [R]');
  riscontro('scarto del cielo (µK)', scartoCielo * R.DATI.T0 * 1e6, 88, 132, '~110 [R]; qui mancano ℓ < 73 (il toro) e il Sachs–Wolfe integrato');
  riscontro('velocità tipica di un osservatore (km/s)', mediana, 370, 620, '370 il Sole, 620 il Gruppo Locale rispetto al fondo [R]');
  riscontro('dipolo ΔT/T', (mediana * 1e3) / COSTANTI.c, 1e-3, 2.1e-3, '1,23·10⁻³ (il Sole) [R]');
});

prova('le armoniche sferiche del cielo: la somma ridà la mappa; lo spettro di un cielo è, in media, quello atteso per il toro', () => {
  // le armoniche sono normalizzate fino a ℓ alto: Σ_m |Y_ℓm|² = (2ℓ+1)/4π (teorema di addizione), a ℓ = 100 e 400
  { const P = new Float64Array((401 * 402) / 2), n = versore('addizione'); R.dentro.legendre(400, n[2], Math.sqrt(1 - n[2] * n[2]), P); for (const l of [2, 100, 400]) { let q = 0; for (let m = 0; m <= l; m++) q += (m ? 2 : 1) * P[(l * (l + 1)) / 2 + m] ** 2; assert.ok(Math.abs((q * 4 * Math.PI) / (2 * l + 1) - 1) < 1e-10, `teorema di addizione a ℓ = ${l}: ${q}`); } }
  // su una sfera piccola con poche onde tutto il cielo sta in ℓ ≤ 24: la somma delle armoniche È la mappa
  let peggio = 0, scala = 0; for (let i = 0; i < 3; i++) { const Fp = campoLibero(`prova/ragnatela/poche onde ${i}`, { kmax: 3 }), Fo = R.fondoCosmico(Fp, { posizione: punto(`oss piccolo ${i}`) }, { raggioM: 0.3 * L }), alm = Fo.armoniche(24);
    for (let k = 0; k < 12; k++) { const n = versore(`arm ${i}/${k}`), a = Fo.in(n); peggio = Math.max(peggio, Math.abs(a - Fo.daArmoniche(alm, n))); scala = Math.max(scala, Math.abs(a)); } }
  assert.ok(peggio < 1e-10 * scala, `armoniche e mappa differiscono di ${peggio} su ${scala}`);
  // sul cielo vero, con le onde fino a 8 giri (stesso spettro): C_ℓ misurato / atteso, ℓ da 80 a 100, otto cosmi.
  // I rapporti di uno stesso cosmo sono legati (le stesse onde): la soglia è quattro errori standard misurati TRA i cosmi.
  const ell = []; for (let l = 80; l <= 100; l++) ell.push(l); const r = [];
  for (let i = 0; i < 8; i++) { const Fp = campoLibero(`prova/ragnatela/cosmo ${i}`, { kmax: 8 }), Fo = R.fondoCosmico(Fp, { posizione: punto(`osservatore ${i}`) }), [alm, t] = ms(() => Fo.armoniche(100)), A = Fo.attesa(ell); if (!i) costa('armoniche fino a ℓ = 100 (1 064 onde; con 28 888 costa 27 volte tanto)', t); r.push(media(ell.map((l, k) => alm.C[l] / A.toro[k]))); }
  const es = scarto(r) / Math.sqrt(r.length); assert.ok(Math.abs(media(r) - 1) < 4 * es, `C_ℓ misurato su atteso: ${media(r)} ± ${es}`); assert.ok(es < 0.12, 'e la prova distingue: errore standard sotto il 12%');
  console.log(`      (somma delle armoniche − mappa: ${num(peggio)} su ${num(scala)}; C_ℓ misurato/atteso per il toro, ℓ = 80…100, otto cosmi: ${num(media(r))} ± ${num(es)})`);
});

prova('LA TOPOLOGIA DI UN TORO DI ONDE (non è più quella dei cosmi), misurata: la sfera dell\'ultima diffusione attraversa il toro ~23 volte; cerchi uguali a coppie; sotto ℓ ≈ 73 il cielo si spegne', () => {
  const Fo = R.fondoCosmico(COSMI[0], { posizione: punto('osservatore 0') }), T = Fo.topologia; tra(Fo.giriDelToro, 11, 12.2, 'raggio / lato'); tra(T.ellMinima, 69, 77, 'ℓ dell\'onda più lunga');
  const cor = (x, y) => { const mx = media(x), my = media(y); return x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * y.reduce((a, v) => a + (v - my) ** 2, 0)); };
  const righe = [];
  for (const m of [[1, 0, 0], [5, 3, 0], [12, 9, 8], [0, 0, 20]]) { const C = T.cerchio(m, 72), a = C.a.map((n) => Fo.parti(n)), b = C.b.map((n) => Fo.parti(n)); let diff = 0, sc0 = 0; a.forEach((p, i) => { diff = Math.max(diff, Math.abs(p.isotropo - b[i].isotropo)); sc0 = Math.max(sc0, Math.abs(p.isotropo)); });
    assert.ok(diff < 1e-9 * sc0, `i due cerchi della copia ${m} non mostrano gli stessi punti: ${diff}`); // lo stesso punto del toro: stessa temperatura (Sachs–Wolfe e picchi)
    const tot = cor(a.map((p) => p.isotropo + p.doppler), b.map((p) => p.isotropo + p.doppler)), sfasato = cor(a.map((p) => p.isotropo), b.map((_, i) => b[(i + 18) % 72].isotropo)); righe.push(`copia ${m.join(',')} (raggio ${(C.raggioAngolare * 180 / Math.PI).toFixed(1)}°): isotropo 1, col Doppler ${tot.toFixed(3)}, cerchi sfasati ${sfasato.toFixed(2)}`); assert.ok(tot > sfasato); }
  assert.equal(T.cerchio([30, 0, 0]), null); // oltre il diametro: nessun cerchio
  const ell = [2, 5, 10, 20, 30, 50, 73, 100, 220], S = Fo.attesa(ell), rap = ell.map((l, i) => S.toro[i] / S.continuo[i]);
  assert.ok(rap[0] < 0.05 && rap[2] < 0.2 && rap[3] < 0.5, 'a ℓ ≪ 73 il toro ha molta meno potenza del cielo senza bordo'); tra(media(rap.slice(5)), 0.7, 1.4, 'sopra ℓ ≈ 50 la potenza media è quella del cielo senza bordo');
  console.log(`      raggio dell'ultima diffusione ${num(Fo.raggioM / MPC / 1e3, 4)} Gpc, lato del toro ${num(L / MPC / 1e3, 4)} Gpc: ${num(T.attraversamenti)} lati per diametro; ${T.coppieDiCerchi} coppie di cerchi uguali; la sfera taglia ~${num(T.facce)} volte una faccia del toro`);
  for (const r of righe) console.log(`      correlazione lungo una coppia di cerchi: ${r}`);
  console.log(`      potenza del toro / potenza senza bordo: ${ell.map((l, i) => `ℓ=${l}: ${num(rap[i], 2)}`).join('; ')}`);
  console.log(`      (questo è il cielo di un TORO di onde: i cosmi della biblioteca sono senza bordo, la prova seguente)`); void ('coppie di cerchi uguali nel cielo', T.coppieDiCerchi, 0, 0, '0 (nessuna trovata: Cornish et al. 2004; Planck 2015 XVIII) [R]: il toro vero, se c\'è, è più grande del diametro dell\'ultima diffusione');
  const d = 2 * Fo.raggioM, tutto = R.costoDelToro(d, L / 24), cielo300 = R.costoDelToro(d, (2 * Math.PI * Fo.raggioM) / 300), cielo2000 = R.costoDelToro(d, (2 * Math.PI * Fo.raggioM) / 2000);
  console.log(`      CHE COSA SERVIREBBE: un toro di lato ≥ ${num(d / MPC / 1e3)} Gpc (${num(d / L)} volte). Con le onde fino a 50 Mpc come ora: kmax ${tutto.kmax}, ${num(tutto.onde)} onde, ${num(tutto.memoriaByte / 1e9)} GB, ${num(tutto.msPerPunto / 1000)} s a punto. Solo per il cielo fino a ℓ = 300: kmax ${cielo300.kmax}, ${num(cielo300.onde)} onde (${num(cielo300.memoriaByte / 1e6)} MB); fino a ℓ = 2000: ${num(cielo2000.onde)} onde.`);
});

// =====================================================================================================
prova('IL CIELO DEI COSMI (senza bordo): nessun cerchio accoppiato, a ℓ basso tutta la potenza, il dipolo dalla velocità del campo', () => {
  const ell = [2, 3, 4, 5, 6, 7, 8], att = R.spettroAtteso(ell).continuo, rap = [], cerchi = [], vel = [];
  const cor = (x, y) => { const mx = media(x), my = media(y); return x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * y.reduce((a, v) => a + (v - my) ** 2, 0)); };
  for (const n of [1, 2, 3]) { const [Fo, t] = ms(() => R.fondoCosmico(n, { posizione: punto(`oss pigro ${n}`, L) }, { ellMax: 8 })); if (n === 1) costa('fondoCosmico di un cosmo (senza bordo, fino a ℓ ≈ 20)', t); vel.push(Fo.dipolo.velocita);
    assert.equal(Fo.topologia.coppieDiCerchi, 0); const [alm, ta] = ms(() => Fo.armoniche(8)); if (n === 1) costa(`armoniche fino a ℓ = 8 del cielo senza bordo (${alm.direzioni} direzioni)`, ta); ell.forEach((l, k) => rap.push(alm.C[l] / att[k]));
    // le coppie di cerchi che un toro di 1,2 Gpc avrebbe (copia a L·m): qui, tolte le ℓ ≤ 8 appena misurate, i due cerchi non si somigliano
    const m = [5, 3, 0], dd = Math.hypot(...m), ca = (dd * L) / (2 * Fo.raggioM), u = m.map((v) => v / dd), sa = Math.sqrt(1 - ca * ca), e1 = [-u[1], u[0], 0].map((v) => v / Math.hypot(u[0], u[1])), e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]], a = [], b = [];
    for (let i = 0; i < 96; i++) { const f = (2 * Math.PI * i) / 96, cs = Math.cos(f) * sa, sn = Math.sin(f) * sa, na = [0, 1, 2].map((q) => ca * u[q] + cs * e1[q] + sn * e2[q]), nb = [0, 1, 2].map((q) => -ca * u[q] + cs * e1[q] + sn * e2[q]); a.push(Fo.in(na) - Fo.daArmoniche(alm, na)); b.push(Fo.in(nb) - Fo.daArmoniche(alm, nb)); }
    cerchi.push(cor(a, b)); }
  // varianza cosmica della media su tre cieli e sette ℓ: ~0,10 (vedi test_campo_pigro); quattro scarti
  const es = Math.sqrt(ell.reduce((x, l) => x + 2 / (2 * l + 1), 0)) / ell.length / Math.sqrt(3); tra(media(rap), 1 - 4 * es, 1 + 4 * es, 'C_ℓ misurato su atteso, ℓ = 2…8');
  // lungo un cerchio, una mappa con ℓ tra 9 e ~40 ha una trentina di campioni indipendenti: quattro scarti ≈ 0,7
  assert.ok(cerchi.every((v) => Math.abs(v) < 0.7), `correlazioni lungo le coppie del toro: ${cerchi}`);
  console.log(`      (C_ℓ/atteso a ℓ = 2…8 su tre cosmi: ${num(media(rap))} ± ${num(es)} (il toro di onde ne aveva 0,002–0,035); correlazione lungo una coppia di cerchi del toro: ${cerchi.map((v) => v.toFixed(2)).join(', ')} (nel toro: 1); velocità degli osservatori ${vel.map((v) => num(v)).join(', ')} km/s)`);
  riscontro('coppie di cerchi uguali nel cielo dei cosmi', 0, 0, 0, '0 (Cornish et al. 2004; Planck 2015 XVIII) [R]');
});

console.log('D. il verso inverso: dal cielo, o da una cosa detta, al campo');
const macchia = (nome, lati, passoGradi) => { const n0 = versore(nome), t = Math.abs(n0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [n0[1] * t[2] - n0[2] * t[1], n0[2] * t[0] - n0[0] * t[2], n0[0] * t[1] - n0[1] * t[0]], q = Math.hypot(...e1), a = e1.map((v) => v / q), b = [n0[1] * a[2] - n0[2] * a[1], n0[2] * a[0] - n0[0] * a[2], n0[0] * a[1] - n0[1] * a[0]], out = [], p = (passoGradi * Math.PI) / 180;
  for (let i = 0; i < lati; i++) for (let j = 0; j < lati; j++) { const u = (i - (lati - 1) / 2) * p, v = (j - (lati - 1) / 2) * p, n = [0, 1, 2].map((d) => n0[d] + u * a[d] + v * b[d]), r = Math.hypot(...n); out.push(n.map((x) => x / r)); } return out; };
prova('una macchia di cielo come seme dal basso: condiziono su una mappa presa da un altro cosmo, e il campo ricostruito ridà quella mappa', () => {
  const righe = [];
  for (let i = 0; i < 3; i++) { const oss = { posizione: punto(`oss macchia ${i}`) }, vero = COSMI[i + 3], base = COSMI[i], Fv = R.fondoCosmico(vero, oss), Fb = R.fondoCosmico(base, oss), dir = macchia(`macchia ${i}`, 7, 0.25);
    const iso = dir.map((n) => Fv.parti(n).isotropo), tot = dir.map((n) => Fv.in(n)), scala = Math.max(...tot.map(Math.abs));
    // (1) solo il termine isotropo: passa da campoCondizionato di bolle.js (campo riscalato)
    const [V1, t1] = ms(() => R.campoVincolato(base, R.vincoliDelCielo(Fb, dir, iso, { doppler: false }))); if (!i) costa('campoVincolato: 49 direzioni di cielo (forma isotropa)', t1);
    assert.ok(V1.esiste && V1.via === 'bolle.js' && V1.gradi === 49); const F1 = R.fondoCosmico(V1, oss); let e1 = 0; dir.forEach((n, k) => { e1 = Math.max(e1, Math.abs(F1.parti(n).isotropo - iso[k])); }); assert.ok(e1 < 1e-9 * scala, `non ridà la mappa: ${e1}`);
    // (2) riscontro indipendente dalla forma: senza Doppler il vincolo è una DENSITÀ in un punto del campo riscalato onda per
    // onda (A·W0, P·W0²): lo stesso campoCondizionato, senza forme, deve dare le stesse ampiezze e lo stesso χ²
    const W0 = Fb.pesi.W0, k2di = (m) => base.KX[m] ** 2 + base.KY[m] ** 2 + base.KZ[m] ** 2, risc = { radice: 'riscalato', toroM: L, kmax: base.kmax, N: base.N, KX: base.KX, KY: base.KY, KZ: base.KZ, PK: base.PK.map((v, m) => v * W0[k2di(m)] ** 2), A: base.A.map((v, m) => v * W0[k2di(m)]), B: base.B.map((v, m) => v * W0[k2di(m)]), fissi: [] };
    const V2 = campoCondizionato(risc, dir.map((n, k) => ({ posizione: n.map((x, q) => oss.posizione[q] + Fb.raggioM * x), scala: 0, valore: iso[k] }))); let d = 0, am = 0; for (let m = 0; m < base.N; m++) { const w = W0[k2di(m)]; if (w === 0) continue; d = Math.max(d, Math.abs(V1.onde.A[m] - base.A[m] - (V2.onde.A[m] - risc.A[m]) / w), Math.abs(V1.onde.B[m] - base.B[m] - (V2.onde.B[m] - risc.B[m]) / w)); am = Math.max(am, Math.abs(V1.onde.A[m])); }
    assert.ok(V2.esiste && d < 1e-9 * am && Math.abs(V1.chi2 - V2.chi2) < 1e-6 * V1.chi2, `la forma e il campo riscalato differiscono: ${d} su ${am}`);
    // (3) la temperatura intera (col Doppler): forma lineare non isotropa
    const [V3, t3] = ms(() => R.campoVincolato(base, R.vincoliDelCielo(Fb, dir, tot))); if (!i) costa('campoVincolato: 49 direzioni di cielo col Doppler', t3);
    assert.ok(V3.esiste && V3.via === 'bolle.js'); const F3 = R.fondoCosmico(V3, oss); let e3 = 0; dir.forEach((n, k) => { e3 = Math.max(e3, Math.abs(F3.in(n) - tot[k])); }); assert.ok(e3 < 1e-9 * scala, `non ridà la mappa intera: ${e3}`);
    // il peso: i valori vengono da un mondo possibile, quindi sono tipici (χ² ≈ 49 ± 10: probabilità non estrema)
    tra(V3.probabilita, 1e-4, 1 - 1e-4, 'probabilità del χ² di una macchia presa da un altro cosmo');
    // tra un punto dato e l'altro (a metà passo) il cielo ricostruito segue quello vero meglio di quello di partenza
    const mezzo = macchia(`macchia ${i}`, 6, 0.25); let ec = 0, eb = 0, sv = 0; mezzo.forEach((n) => { const v = Fv.in(n); ec += (F3.in(n) - v) ** 2; eb += (Fb.in(n) - v) ** 2; sv += v * v; }); assert.ok(ec < eb);
    // lontano dalla macchia il campo resta quello di partenza; quanto resta libero
    const [lib, tl] = ms(() => V3.liberta()); if (!i) costa('liberta() di 49 vincoli', tl); assert.equal(lib.gradiFissati, 49); assert.equal(lib.gradiTotali, 2 * base.N); tra(lib.varianzaLibera, 0.99, 1, 'la varianza che resta libera');
    const qui = R.doveSono(V3, oss.posizione).delta - R.doveSono(base, oss.posizione).delta, la = [0, 1, 2].map((k) => oss.posizione[k] + Fb.raggioM * dir[24][k]), lassu = R.doveSono(V3, la).delta - R.doveSono(base, la).delta;
    righe.push(`cosmo ${i} ← cielo del cosmo ${i + 3}: χ² = ${num(V3.chi2)} su 49 (P = ${num(V3.probabilita)}); errore sulla mappa ${num(e3 / scala)}; tra i punti dati: errore ${num(Math.sqrt(ec / sv))} dello scarto (prima ${num(Math.sqrt(eb / sv))}); fissati ${lib.gradiFissati} gradi su ${lib.gradiTotali}, varianza libera ${(100 * lib.varianzaLibera).toFixed(2)}%; δ cambia di ${num(lassu)} lassù e di ${num(qui)} dall'osservatore`); }
  for (const r of righe) console.log(`      ${r}`);
  // due valori diversi nella stessa direzione: quel cielo non esiste, e lo si dice
  const Fb = R.fondoCosmico(COSMI[0], { posizione: punto('oss macchia 0') }), n = versore('doppio'), no = R.campoVincolato(COSMI[0], R.vincoliDelCielo(Fb, [n, n], [1e-5, 2e-5])); assert.equal(no.esiste, false); assert.ok(no.perche);
});

prova('«qui c\'è un filamento / un vuoto» come vincoli sulle onde (forme di campoCondizionato): la classe è quella detta, lo scheletro passa di lì', () => {
  const R0 = 25 * MPC; let passa = 0, vuotiForma = 0, vuotiDensita = 0, nodi = 0; const chi = [], NQ = 12;
  for (let i = 0; i < NQ; i++) { const F = COSMI[i % 6], p = punto(`detto ${i}`), u = versore(`detto ${i}`), vf = R.vincoliDi(F, { cosa: 'filamento', posizione: p, scala: R0, direzione: u }), [V, t] = ms(() => R.campoVincolato(F, vf)); if (!i) costa('campoVincolato: un filamento (8 vincoli di marea e pendenza)', t);
    assert.ok(V.esiste && V.via === 'bolle.js' && V.gradi === 8); chi.push(V.chi2); const w = R.doveSono(V, p, { scala: R0 }); assert.equal(w.classe, 'filamento'); assert.ok(Math.abs(Math.abs(sc(w.direzione, u)) - 1) < 1e-9, 'la direzione è quella detta');
    // ridiscendendo: lo scheletro del campo vincolato (alla stessa scala) passa per il punto, lungo la direzione detta
    const S = R.scheletro(V, { centro: p, lato: 200 * MPC, celle: 17 }, { scala: R0 }); let vicino = Infinity, cv = 0; for (let a = 0; a < S.n; a++) { const d = Math.hypot(...[0, 1, 2].map((k) => { const q = S.pos[3 * a + k] - p[k]; return q - L * Math.round(q / L); })); if (d < vicino) { vicino = d; cv = Math.abs(sc([S.direzione[3 * a], S.direzione[3 * a + 1], S.direzione[3 * a + 2]], u)); } } if (vicino < 0.01 * S.latoCellaM && cv > 0.99) passa++;
    // un vuoto: con la forma (9 vincoli) la classe è garantita ed è un minimo; con la sola densità (1 vincolo) no
    const Vv = R.campoVincolato(F, R.vincoliDi(F, { cosa: 'vuoto', posizione: p, scala: R0 })), wv = R.doveSono(Vv, p, { scala: R0 }); assert.equal(wv.classe, 'vuoto'); vuotiForma++;
    const dens = R.vincoliDi(F, { cosa: 'vuoto', posizione: p, scala: R0, forma: false }), Vd = R.campoVincolato(F, dens), wd = R.doveSono(Vd, p, { scala: R0 }); assert.ok(Vd.via === 'bolle.js' && Vd.gradi === 1 && Math.abs(wd.delta - dens[0].valore) < 1e-9); if (wd.classe === 'vuoto') vuotiDensita++;
    // il vincolo di sola densità è quello di sempre di bolle.js; un campo di bolle.js si legge qui così com'è
    if (i < 3) { const diretto = campoCondizionato(F, [{ posizione: p, scala: R0, valore: dens[0].valore }]); assert.ok(Math.abs(diretto.chi2 - Vd.chi2) < 1e-12); assert.ok(Math.abs(R.doveSono(diretto, p, { scala: R0 }).delta - dens[0].valore) < 1e-9); }
    // la teoria del campo vincolato (attesa di bolle.js, con le forme): la pendenza lungo l'asse è nulla e resta incerta solo lungo il filamento
    if (i < 3) { const forma = (kx, ky, kz, k2, out) => { out[0] = 0; out[1] = kx * w.assi[0][0] + ky * w.assi[0][1] + kz * w.assi[0][2]; return out; }, at = V.campo.attesa(p, R0, null, forma); assert.ok(Math.abs(at.media) < 1e-9 && at.varianza < 1e-9 * at.libera, 'la pendenza vincolata non ha più incertezza'); assert.ok(Math.abs(V.campo.misura(p, forma, R0)) < 1e-9); }
    if (R.doveSono(R.campoVincolato(F, R.vincoliDi(F, { cosa: 'nodo', posizione: p, scala: R0 })), p, { scala: R0 }).classe === 'nodo') nodi++; }
  assert.equal(nodi, NQ); // il χ² di una cosa tipica è tipico: 6 valori del tensore (le pendenze nulle non costano)
  tra(media(chi), 2, 12, 'χ² di un filamento tipico (6 gradi)');
  // più cose insieme (regola 12): un filamento e un vuoto a 150 Mpc nello stesso campo, una condizione sola
  const F = COSMI[0], pa = punto('insieme'), pb = [pa[0] + 150 * MPC, pa[1], pa[2]], Vi = R.campoVincolato(F, [...R.vincoliDi(F, { cosa: 'filamento', posizione: pa, scala: R0, direzione: [0, 0, 1] }), ...R.vincoliDi(F, { cosa: 'vuoto', posizione: pb, scala: R0 })]);
  assert.ok(Vi.esiste && Vi.gradi === 17); assert.equal(R.doveSono(Vi, pa, { scala: R0 }).classe, 'filamento'); assert.equal(R.doveSono(Vi, pb, { scala: R0 }).classe, 'vuoto');
  console.log(`      (${NQ} punti su sei cosmi, scala ${num(R0 / MPC)} Mpc: filamento con la direzione detta ${NQ} su ${NQ}, χ² medio ${num(media(chi))} su 6; vuoto con la forma ${vuotiForma} su ${NQ}; nodo ${nodi} su ${NQ}; un filamento e un vuoto insieme: χ² ${num(Vi.chi2)} su 17 vincoli)`);
  riscontro(`lo scheletro del campo vincolato passa per il punto detto, lungo la direzione detta (su ${NQ})`, passa, Math.ceil(0.75 * NQ), NQ, 'tutti, se «cresta» e «tensore di marea» dicessero la stessa cosa: la curvatura della densità non è vincolata');
  console.log(`      (misurato: un vuoto detto con la sola densità è di classe vuoto ${vuotiDensita} volte su ${NQ}: un valore di densità non fissa i tre autovalori, per la classe serve la forma)`);
});

prova('in un cosmo della biblioteca (senza bordo) i vincoli nuovi lasciano le galassie dove sono; senza vincoli nuovi è il cosmo di sempre', () => {
  const F = campoCosmo(1), V0 = R.campoVincolato(1, []); let d = 0; for (let i = 0; i < 4; i++) { const p = punto(`biblioteca ${i}`, L); d = Math.max(d, Math.abs(R.doveSono(V0, p).delta - R.doveSono(1, p).delta)); }
  assert.ok(d === 0 && V0.gradi === 0, `senza vincoli nuovi il campo differisce da cosmo3d di ${d}`);
  const p = punto('biblioteca', L), [V, t] = ms(() => R.campoVincolato(1, R.vincoliDi(1, { cosa: 'filamento', posizione: p, scala: 25 * MPC, direzione: [1, 1, 0] }))); costa('campoVincolato: un filamento nel cosmo 1 (8 vincoli, con le 59 galassie)', t);
  assert.ok(V.esiste && V.gradi === 8); assert.equal(R.doveSono(V, p, { scala: 25 * MPC }).classe, 'filamento');
  let peggio = 0; F.pos.forEach((x, i) => { peggio = Math.max(peggio, Math.abs(V.campo.delta(x.map((v) => v * L), { scala: F.vincoli.scala }) - F.vincoli.valori[i])); }); assert.ok(peggio < 1e-9, `le galassie distano dal loro picco ${peggio}`);
  // una macchia di cielo del cosmo 2, chiesta al cosmo 1: il campo ridà quella mappa
  const oss = { posizione: punto('oss biblioteca', L) }, F2 = R.fondoCosmico(2, oss, { ellMax: 8 }), F1 = R.fondoCosmico(1, oss, { ellMax: 8 }), dir = [0, 1, 2, 3, 4].map((i) => versore(`macchia pigra ${i}`)), val = dir.map((n) => F2.in(n));
  const [Vc, tc] = ms(() => R.campoVincolato(1, R.vincoliDelCielo(F1, dir, val))); costa('campoVincolato: 5 direzioni del cielo del cosmo 1', tc); assert.ok(Vc.esiste && Vc.gradi === 5); const Fc = R.fondoCosmico(Vc, oss, { ellMax: 8 }); let e = 0; dir.forEach((n, i) => { e = Math.max(e, Math.abs(Fc.in(n) - val[i])); }); assert.ok(e < 1e-9 * Math.max(...val.map(Math.abs)), `il cielo ricostruito non ridà la mappa: ${e}`);
  console.log(`      (cosmo 1: ${F.pos.length} galassie; senza vincoli nuovi uguale (${num(d)}); con un filamento χ² ${num(V.chi2)} su 8 date le galassie, galassie sul loro picco entro ${num(peggio)}; cinque punti del cielo del cosmo 2 nel cosmo 1: χ² ${num(Vc.chi2)}, mappa ridata entro ${num(e)})`);
});

// =====================================================================================================
console.log('E. l\'universo osservabile');
prova('distanze, orizzonti e cono di luce dalla cosmologia di leggi.js (più la radiazione)', () => {
  const [O, t] = ms(() => R.orizzonti()); costa('orizzonti', t); let prima = 0;
  for (const z of [0.01, 0.1, 0.5, 1, 2, 5, 10, 100, 1000]) { const d = R.distanze(z); assert.ok(d.comoventeM > prima); prima = d.comoventeM; assert.ok(Math.abs(d.luminositaM / d.angolareM / (1 + z) ** 2 - 1) < 1e-12, 'd_L = (1+z)²·d_A (Etherington)'); assert.ok(Math.abs(R.redshiftA(d.comoventeM) / z - 1) < 1e-4); assert.ok(d.comoventeM < O.particelleM); }
  // a piccola distanza: la legge di Hubble
  tra((R.distanze(0.001).comoventeM * 67.7) / (0.001 * 2.998e5 * MPC), 0.999, 1.001, 'd = cz/H₀ a z piccolo');
  // il tempo: con la radiazione è lo stesso di U.tempo (galassie.js) finché la radiazione non conta
  for (const z of [0, 0.5, 1]) { const d = R.distanze(z); assert.ok(Math.abs(d.etaAnni / d.tempoSenzaRadiazioneAnni - 1) < 1e-3, `età a z = ${z}`); }
  const d1 = R.distanze(1), d1090 = R.distanze(1090), C = R.conoDiLuce({ posizione: punto('osservatore 0') }), lu = C.a(O.ultimaDiffusioneM);
  tra(lu.z, 1070, 1110, 'a quella distanza si vede l\'ultima diffusione'); assert.equal(C.a(1.01 * O.particelleM), null); assert.ok(C.a(1e24).z < 0.01); tra(lu.giriDelToro, 11, 12.2, 'giri del toro');
  const e = C.epocaDi(punto('lontano')); assert.ok(e.z < 0.3 && e.tempoDiRitornoAnni < 3.5e9, 'ogni punto del toro è a meno di 1,04 Gpc: lo si vede com\'era meno di 3,5 Ga fa'); assert.ok(e.immagini > 1000);
  console.log(`      età ${num(O.etaAnni / 1e9, 5)} Ga (senza radiazione, U.tempo: ${num(O.etaSenzaRadiazioneAnni / 1e9, 5)}); Ω_r = ${num(O.OmegaRadiazione)}; z dell'uguaglianza ${num(O.zUguaglianza, 4)}; a z = 1090 l'età è ${num(d1090.etaAnni)} anni (U.tempo, senza radiazione: ${num(d1090.tempoSenzaRadiazioneAnni)})`);
  console.log(`      il toro si ripete ${num(C.copieDelToroNellOrizzonte)} volte dentro l'orizzonte; un punto qualunque del toro si vede com'era ${num(e.tempoDiRitornoAnni / 1e9)} Ga fa (z = ${num(e.z)}) nella copia più vicina`);
  riscontro('età dell\'universo (Ga)', O.etaAnni / 1e9, 13.7, 13.9, '13,79 (Planck 2018) [R]'); riscontro('orizzonte delle particelle (miliardi di anni luce)', O.particelleM / GLY, 45.7, 46.9, '46,1–46,5 [R]');
  riscontro('orizzonte degli eventi (miliardi di anni luce)', O.eventiM / GLY, 15.5, 17.5, '~16,5 [R]'); riscontro('raggio di Hubble (Mpc)', O.hubbleM / MPC, 4380, 4480, 'c/H₀ = 4428');
  riscontro('distanza comovente a z = 1 (Mpc)', d1.comoventeM / MPC, 3330, 3430, '~3380 per questi parametri [R]'); riscontro('tempo di ritorno a z = 1 (Ga)', d1.tempoDiRitornoAnni / 1e9, 7.8, 8.05, '~7,9 [R]');
  riscontro('z dell\'uguaglianza materia–radiazione', O.zUguaglianza, 3300, 3500, '3402 (Planck 2018) [R]');
});

// =====================================================================================================
console.log('F. la scena per il motore');
prova('scenaRagnatela: la forma di scenaCosmo; nel tempo le posizioni si scalano con a, le classi restano, il contrasto cresce', () => {
  const reg = { centro: punto('scena'), lato: L / 3, celle: 32 }, [S, t] = ms(() => R.scenaRagnatela(COSMI[4], reg, 0)); costa('scenaRagnatela (regione di 400 Mpc, 32³)', t);
  assert.equal(S.livello, 'ragnatela'); assert.equal(S.t, 0); assert.equal(S.nelGenitore, null); assert.ok(S.riferimento.unita === 'm' && S.riferimento.periodico.length === 3 && S.riferimento.fattoreDiScala === 1);
  assert.ok(S.punti.pos instanceof Float64Array && S.punti.pos.length === 3 * S.punti.n && S.punti.densita.length === S.punti.n && S.punti.direzione.length === 3 * S.punti.n);
  assert.ok(S.segmenti.coppie.length === 2 * S.segmenti.n && S.segmenti.coppie.every((i) => i >= 0 && i < S.punti.n)); assert.ok(S.vuoti.n > 0 && S.vuoti.pos.length === 3 * S.vuoti.n && S.nodi.n > 0);
  assert.ok([...S.vuoti.contrasto].every((v) => v < 0 && v > -1) && [...S.nodi.densita].every((v) => v > 1) && [...S.vuoti.raggio].every((r) => r > 0 && r < L));
  assert.equal(S.campi.classe.dati.length, 32 ** 3); assert.equal(S.campi.in([S.punti.pos[0], S.punti.pos[1], S.punti.pos[2]]).numero, S.punti.classe[0]);
  for (let a = 0; a < S.punti.n; a += 37) for (let d = 0; d < 3; d++) assert.ok(S.punti.pos[3 * a + d] >= 0 && S.punti.pos[3 * a + d] < L);
  // nel passato (8 Ga fa)
  const P = R.scenaRagnatela(COSMI[4], reg, -8 * GA), a = P.riferimento.fattoreDiScala; assert.ok(a < 1 && Math.abs(a - U.scala(U.tempo(1) - 8)) < 1e-12, 'il fattore di scala è quello di galassie.js a quel tempo'); assert.equal(P.punti.n, S.punti.n); assert.deepEqual([...P.campi.classe.dati], [...S.campi.classe.dati]);
  let pos = 0, piu = 0; for (let i = 0; i < S.punti.n; i++) { for (let d = 0; d < 3; d++) pos = Math.max(pos, Math.abs(P.punti.pos[3 * i + d] - a * S.punti.pos[3 * i + d])); if (Math.abs(P.punti.delta[i]) <= Math.abs(S.punti.delta[i])) piu++; }
  assert.ok(pos < 1e-3, 'posizioni vere = comoventi × a'); assert.equal(piu, S.punti.n); assert.ok(Math.abs(P.riferimento.periodico[0] - a * L) < 1);
  console.log(`      (regione di ${num(reg.lato / MPC)} Mpc: ${S.punti.n} punti di scheletro, ${S.segmenti.n} segmenti (${num(S.segmenti.lunghezzaM / MPC)} Mpc), ${S.vuoti.n} vuoti, ${S.nodi.n} nodi; frazioni di massa ${S.frazioni.massa.map((v) => (100 * v).toFixed(0)).join('/')} %, di volume ${S.frazioni.volume.map((v) => (100 * v).toFixed(0)).join('/')} %)`);
});

prova('la scena di un cosmo della biblioteca (senza bordo): non periodica, posizioni nella regione, quanto costa', () => {
  const reg = { centro: punto('scena cosmo', L), lato: L / 3, celle: 32 }, [S, t] = ms(() => R.scenaRagnatela(1, reg, 0)); costa('scenaRagnatela del cosmo 1 (regione di 400 Mpc, 32³)', t);
  assert.equal(S.riferimento.periodico, null); assert.ok(S.punti.n > 100 && S.vuoti.n > 0 && S.campi.classe.dati.length === 32 ** 3);
  for (let a = 0; a < S.punti.n; a += 41) assert.equal(S.campi.in([S.punti.pos[3 * a], S.punti.pos[3 * a + 1], S.punti.pos[3 * a + 2]]).numero, S.punti.classe[a]);
  console.log(`      (cosmo 1, regione di ${num(reg.lato / MPC)} Mpc: ${S.punti.n} punti di scheletro, ${S.segmenti.n} segmenti, ${S.vuoti.n} vuoti, ${S.nodi.n} nodi; celle di ${num(S.risoluzione.cellaM / MPC)} Mpc; ${num(t / 1000)} s)`);
});

prova('funzione pura dell\'indirizzo: stessa domanda, stessa risposta; il ramo di un\'onda sposta il campo quanto quell\'onda', () => {
  const r = 'prova/ragnatela/ramo', a = campoLibero(r, { kmax: 12 }), b = campoLibero(r, { kmax: 12, rami: { [`${r}/campo/onda 2,-1,3`]: 1 } }), p = punto('ramo'); let quale = -1, diverse = 0; for (let m = 0; m < a.N; m++) if (a.A[m] !== b.A[m] || a.B[m] !== b.B[m]) { diverse++; quale = m; } assert.equal(diverse, 1);
  const wa = R.doveSono(a, p), wb = R.doveSono(b, p); assert.deepEqual(R.doveSono(a, p), wa); assert.ok(Math.abs(wa.delta - wb.delta) <= 2 * (Math.abs(a.A[quale] - b.A[quale]) + Math.abs(a.B[quale] - b.B[quale])) + 1e-15);
  const Fa = R.fondoCosmico(a, { posizione: p }), Fb = R.fondoCosmico(b, { posizione: p }), n = versore('ramo'); assert.equal(Fa.in(n), R.fondoCosmico(a, { posizione: p }).in(n)); assert.ok(Fa.in(n) !== Fb.in(n) && Math.abs(Fa.in(n) - Fb.in(n)) < 0.2 * Fa.scartoAtteso, 'un\'onda sola sposta il cielo di poco');
});

console.log('\nI COSTI (ms, misurati qui)');
for (const [che, t] of costi) console.log(`  ${t < 10 ? t.toFixed(2) : t.toFixed(0)}`.padStart(9), ' ', che);
if (nonTorna.length) { console.log(`\nCHE COSA NON TORNA (${nonTorna.length}):`); for (const r of nonTorna) console.log(`  ≠ ${r}`); }
console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
