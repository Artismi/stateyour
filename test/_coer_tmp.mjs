const __R = {}, __segna = (id, bene, msg) => { const q = (__R[id] ??= { si: 0, no: 0, msg: '' }); if (bene) q.si++; else { q.no++; if (!q.msg) q.msg = String(typeof msg === 'function' ? '' : msg ?? '').slice(0, 200); } };
const __M = { ok: (id, c, m) => __segna(id, !!c, m), eq: (id, x, y, m) => __segna(id, Object.is(x, y), m ?? (x + ' !== ' + y)), ne: (id, x, y, m) => __segna(id, !Object.is(x, y), m), de: (id, x, y, m) => __segna(id, JSON.stringify(x) === JSON.stringify(y), m), nd: (id, x, y, m) => __segna(id, JSON.stringify(x) !== JSON.stringify(y), m), tra: (id, x, a, b, che) => __segna(id, x >= a && x <= b, che + ': ' + x + ' (tra ' + a + ' e ' + b + ')') };
const __crolli = [];
import { writeFileSync as __scrivi } from 'node:fs';
process.on('exit', () => __scrivi("/tmp/claude-0/-home-user/e4f7d681-8c14-51b2-bfef-3d2a580b715c/scratchpad/pop/coer_x.json", JSON.stringify({ R: __R, crolli: __crolli })));
// test_coerenza.mjs — la REVISIONE DI COERENZA tra i livelli dell'universo.
//
// «Tutto reciprocamente deducibile»: la stessa grandezza deve valere lo stesso ovunque la si guardi, e ciò
// che si conserva (tempo, massa, elementi, carica, energia) deve conservarsi da una scala all'altra.
// Qui si prende un campione di luoghi veri (qualche centinaio di sistemi di due cosmi) e si misura.
//   · prova(nome, f)  ciò che OGGI è coerente: se smette di esserlo, il test fallisce (protegge dalle regressioni);
//   · nota(...)       le INCOERENZE NOTE: non fanno fallire niente, ma sono misurate e stampate in fondo con i
//                     numeri (quanti casi su quanti, scarto tipico e massimo). Quando una torna a zero casi il
//                     test lo dice: va tolta dalle note e trasformata in una prova.
// Il test non corregge niente: trova, misura, riferisce.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as CO from '/home/user/stateyour/src/camera/cosmo.js';
import { campoCosmo } from '/home/user/stateyour/src/camera/spazio3d.js';
import * as LG from '/home/user/stateyour/src/camera/leggi.js';
import * as ST from '/home/user/stateyour/src/camera/stelle.js';
import * as GA from '/home/user/stateyour/src/camera/galassie.js'; // le galassie come conseguenza: la forma (G.forma) e il catalogo campione // le stelle vengono da qui (struttura), non più dalle curve di leggi.js
import * as GE from '/home/user/stateyour/src/camera/geologia.js';
import * as DI from '/home/user/stateyour/src/camera/disco.js';
import * as LU from '/home/user/stateyour/src/camera/lune.js';
import * as CH from '/home/user/stateyour/src/camera/chimica.js';
import * as NE from '/home/user/stateyour/src/camera/nebbia.js';
import * as FL from '/home/user/stateyour/src/camera/fluidi.js';
import * as TE from '/home/user/stateyour/src/camera/tettonica.js';
import * as UN from '/home/user/stateyour/src/camera/unita.js';
import { simulaMondo } from '/home/user/stateyour/src/camera/mondo.js';

const { MSOLE, RSOLE, LSOLE, UA, ANNO, COSTANTI: K, COSMO } = LG;
const ADESSO = LG.etaUniverso() / ANNO; // l'età dell'universo, in anni
const T0 = performance.now();

let ok = 0;
const prova = (nome, f) => { try { f(); } catch (e) { __crolli.push(nome.slice(0, 60) + ': ' + String(e.message).slice(0, 160)); return; } ok++; console.log('  ✓', nome); };
const sezione = (nome) => console.log(`\n${nome}  [${((performance.now() - T0) / 1000).toFixed(0)} s]`);

// ---------- le incoerenze note
const NOTE = [];
// gravità: 1 grave (un numero sbagliato che si vede o che altri calcoli usano), 2 media, 3 lieve o dichiarata
const nota = (gravita, cosa, { casi, su, tipico = '', massimo = '', dove = '' }) => NOTE.push({ gravita, cosa, casi, su, tipico, massimo, dove });
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const ordina = (xs) => xs.filter(Number.isFinite).sort((a, b) => a - b);
const quantile = (xs, p) => { const v = ordina(xs); return v.length ? v[Math.min(v.length - 1, Math.floor(p * v.length))] : NaN; };
const mediana = (xs) => quantile(xs, 0.5), massimo = (xs) => quantile(xs, 1), minimo = (xs) => quantile(xs, 0);
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const mediaDi = (v) => { let t = 0; for (let i = 0; i < v.length; i++) t += v[i]; return t / v.length; };
const sfera = (R) => (4 / 3) * Math.PI * R ** 3;
const foto = (x) => JSON.stringify(x, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : ArrayBuffer.isView(v) ? Array.from(v) : v));
const semeDi = (...a) => (CO.semeEvento ? CO.semeEvento(...a) : CO.hash(...a));

// ---------- IL CAMPIONE: galassie sparse (anche un'ellittica) di due cosmi, stelle sparse in ognuna
const GALASSIE = [], SISTEMI = [], PIANETI = [];
for (const n of [1, 2]) {
  const C = CO.cosmo(n), ng = C.galassie.length, ids = new Set([0, Math.floor(ng / 4), Math.floor(ng / 2), Math.floor((3 * ng) / 4), ng - 1]);
  const ell = C.galassie.find((g) => g.tipo === 'ellittica'); if (ell) ids.add(ell.id);
  for (const gid of ids) {
    GALASSIE.push({ n, gid, Gx: CO.galassia(n, gid) });
    for (let k = 0; k < 25; k++) {
      const sid = (k * 61 + 7 * gid) % CO.STELLE, S0 = CO.galassia(n, gid).stelle[sid], S = CO.sistema(n, gid, sid);
      // l'età del sistema è quella della stella (anni dalla nascita a oggi), viva o morta che sia
      const s = { n, gid, sid, S0, S, eta: S0.eta, viva: S0.stato === 'in vita' || S0.stato === 'gigante rossa' };
      SISTEMI.push(s); for (const p of S.pianeti) PIANETI.push({ ...s, p });
    }
  }
}
const SOLIDI = PIANETI.filter((x) => x.p.tipo !== 'gassoso');
console.log(`coerenza: ${GALASSIE.length} galassie, ${SISTEMI.length} sistemi, ${PIANETI.length} pianeti (${SOLIDI.length} solidi) nel campione`);

// =====================================================================================================
sezione('IL TEMPO');
// =====================================================================================================
const nascitaDi = (s) => ADESSO - s.eta; // anni dall'inizio

prova('ogni stella è più giovane dell\'universo ed è nata dopo la sua galassia', () => {
  for (const { Gx } of GALASSIE) {
    const formazione = Gx.G.formazione / ANNO; __M.tra("76.0", formazione, 0, ADESSO, 'formazione della galassia (anni)');
    for (const s of Gx.stelle) { const t = nascitaDi(s); __M.ok("77.0", t >= formazione * (1 - 1e-9) && t <= ADESSO, `stella ${s.id}: nata a ${t}, galassia a ${formazione}`); }
  }
});

prova('una stella viva ha età < vita; un resto viene da una stella la cui vita è finita, e pesa meno di lei', () => {
  let vive = 0, resti = 0;
  for (const { Gx } of GALASSIE) for (const s of Gx.stelle) {
    if (s.stato === 'in vita' || s.stato === 'gigante rossa') { vive++; const vv = ST.stella(s.massa, { Z: s.Z }).vita; __M.ok("84.0", s.eta < vv, `viva oltre la sua vita: ${s.eta} > ${vv}`); if (s.stato === 'gigante rossa') __M.ok("84.1", s.eta > 0.9 * vv); }
    else {
      resti++; __M.ok("86.0", s.morta >= 0 && s.massaNascita > s.massa, `resto più pesante della stella: ${s.massa} da ${s.massaNascita}`);
      __M.tra("87.0", s.eta / (ST.stella(s.massaNascita, { Z: s.Z }).vita + s.morta), 1 - 1e-9, 1 + 1e-9, 'età di un resto = vita della stella + anni dalla morte');
      const f = ST.fine(s.massaNascita, 1e-4, { Z: s.Z }); __M.eq("88.1", s.stato, f.tipo); __M.ok("88.0", Math.abs(s.massa - f.massa) < 1e-9);
      if (s.stato === 'nana bianca') __M.ok("89.0", s.massa < LG.massaChandrasekhar() / MSOLE); else if (s.stato === 'stella di neutroni') __M.ok("89.1", s.massa < LG.massaMassimaNeutroni() / MSOLE);
    }
  }
  __M.ok("92.0", vive > 1000 && resti > 100);
});

prova('l\'età è una sola: pianeti, interno e lune hanno gli anni della loro stella (anche attorno a una nana bianca), mai più dell\'universo', () => {
  let n = 0, nane = 0;
  for (const s of SISTEMI) { __M.ok("97.0", s.eta > 0 && s.eta < ADESSO, `una stella di ${s.eta} anni`); }
  for (const x of SOLIDI) { n++; __M.eq("98.0", x.p.interno.eta, x.S0.eta); }
  // le lune: rifatte con l'età della stella devono essere le stesse (il disco è controllato più sotto, con la massa)
  for (const x of PIANETI.filter((y) => y.S0.stato === 'nana bianca').filter((_, i) => i % 5 === 0)) {
    nane++; const rifatte = LU.lune(x.p, { eta: x.S0.eta, Z: x.S0.Z, massa: x.S0.massa, massaNascita: x.S0.massaNascita, ...(x.p.tipo === 'roccioso' ? { urto: x.p.urto } : {}) }, CO.casoLune(x.n, x.gid, x.sid, x.p.id)); // (la sorgente degli eventi delle lune di quel pianeta: la stessa che usa cosmo.js)
    __M.eq("102.0", foto(rifatte.map((l) => [l.massaKg, l.aM])), foto(x.p.lune.map((l) => [l.massaKg, l.aM])));
  }
  __M.ok("104.0", n > 1500 && nane >= 10);
});

prova('una gigante rossa ha inghiottito i pianeti entro 1,5 UA, e così la nana bianca che ne resta', () => {
  let gig = 0, nane = 0;
  for (const { n, gid, Gx } of GALASSIE) for (const s of Gx.stelle.filter((q, i) => q.stato === 'gigante rossa' || (q.stato === 'nana bianca' && i % 7 === 0))) {
    const S = CO.sistema(n, gid, s.id), k = s.stato === 'nana bianca' ? s.massaNascita / s.massa : 1; if (s.stato === 'gigante rossa') gig++; else nane++;
    for (const p of S.pianeti) __M.ok("111.0", p.aM >= 1.5 * UA * k * (1 - 1e-9), `${s.stato}: un pianeta a ${p.aM / UA} UA`);
  }
  __M.ok("113.0", gig > 50 && nane > 50);
});

{ // le giganti rosse: luce e raggio vengono da stelle.js all'età della stella; resta il tetto a 4200 K messo a mano sul colore
  let gig = 0, tetto = 0;
  for (const { Gx } of GALASSIE) for (const s of Gx.stelle) if (s.stato === 'gigante rossa') { gig++; if (ST.stella(s.massa, { Z: s.Z, eta: s.eta }).T > 4200 * 1.001) tetto++; }
  nota(3, 'giganti rosse: «gigante» è chi ha passato nove decimi della vita, e la sua temperatura è tagliata a 4200 K anche quando stelle.js, a quell\'età, la dà più calda (la luce e il raggio invece sono quelli di stelle.js)',
    { casi: tetto, su: gig, dove: 'cosmo.js galassia() «gigante = eta > 0.9 * vita.vita», «Math.min(ora.T, 4200)»' });
}
prova('i resti di supernova: mai sul posto di una stella viva; il resto di un collasso sta sulla sua stella, morta da quanto è vecchio il resto', () => {
  let sn = 0, collassi = 0;
  for (const { Gx } of GALASSIE) for (const s of Gx.sorgenti) if (s.tipo === 'supernova') {
    sn++; const qui = Gx.stelle.filter((x) => x.pos[0] === s.pos[0] && x.pos[1] === s.pos[1]);
    if (s.resto.startsWith('niente')) { __M.eq("126.0", qui.length, 0, 'una nana bianca esplosa non lascia niente: lì non c\'è nessuna stella del catalogo'); continue; }
    collassi++; __M.eq("127.0", qui.length, 1); const st = qui[0];
    __M.ok("128.0", st.stato === s.resto && st.morta === s.eta && st.massaNascita > 8 && st.peso === 1, `resto «${s.resto}» di ${s.eta} anni su una stella «${st.stato}» morta da ${st.morta}`);
  }
  __M.ok("130.0", sn >= GALASSIE.length && collassi > 0, `${sn} resti, ${collassi} da collasso`);
});

// =====================================================================================================
sezione('LA MASSA');
// =====================================================================================================
prova('il disco è qualche centesimo della stella; i pianeti pesano meno del disco e i loro solidi meno dei solidi del disco', () => {
  let n = 0;
  for (const s of SISTEMI) {
    if (s.S0.stato === 'stella di neutroni' || s.S0.stato === 'buco nero') { __M.eq("139.0", s.S.pianeti.length, 0); continue; }
    const st = { massa: s.S0.massaNascita || s.S0.massa, Z: s.S0.Z ?? 1, eta: s.eta }, seme = CO.casoDisco(s.n, s.gid, s.sid), D = DI.disco(st, seme), nati = DI.formaPianeti(st, seme);
    __M.tra("141.0", D.massaKg / (st.massa * MSOLE), 0.0099, 0.1201, 'massa del disco / massa della stella');
    if (!nati.length) continue; n++;
    // sono proprio i pianeti del sistema (nati con l'età della stella; poi il taglio a 16, e i vicini inghiottiti dalla gigante)
    const rimasti = nati.slice(0, CO.PIANETI_MAX).filter((q) => s.S0.stato === 'in vita' || q.aUA / 30 >= 0.05);
    __M.eq("145.0", foto(rimasti.map((q) => q.massaKg)), foto(s.S.pianeti.map((p) => p.massaKg)));
    const tutti = nati.reduce((a, q) => a + q.massaKg, 0); __M.ok("146.0", tutti < D.massaKg, `pianeti ${tutti} kg > disco ${D.massaKg} kg`);
    // i solidi del disco: Σs sommata sugli anelli, dal bordo interno a quello esterno
    let solidi = 0; const N = 600, l0 = Math.log(D.rIn), l1 = Math.log(D.rOut);
    for (let i = 0; i < N; i++) { const r = Math.exp(l0 + ((i + 0.5) * (l1 - l0)) / N); solidi += 2 * Math.PI * (r * UA) ** 2 * ((l1 - l0) / N) * D.sigmaSolidi(r); }
    const neiPianeti = nati.reduce((a, q) => a + q.massaKg * (q.tipo === 'gassoso' ? q.composizione.pesanti : 1 - (q.involucro || 0)), 0);
    // (nei giganti «pesanti» conta anche i metalli del gas catturato: si confronta con solidi + metalli del gas)
    __M.ok("152.0", neiPianeti < solidi + st.Z * DI.DISCO.metalliSole * D.massaKg, `solidi nei pianeti ${neiPianeti} > metalli del disco`);
    __M.ok("153.0", nati.filter((q) => q.tipo !== 'gassoso').reduce((a, q) => a + q.massaKg * (1 - (q.involucro || 0)), 0) < solidi * 1.001);
  }
  __M.ok("155.0", n > 200);
});

prova('di che cosa è fatto ogni pianeta: le parti fanno 1 e nessuna è negativa', () => {
  for (const { p } of PIANETI) { const v = Object.values(p.composizione); __M.ok("159.0", Math.abs(v.reduce((a, b) => a + b, 0) - 1) < 1e-9 && v.every((x) => x >= -1e-12 && x <= 1 + 1e-12), foto(p.composizione)); }
});

prova('le lune pesano molto meno del pianeta e stanno tra il limite di Roche e la sfera di Hill', () => {
  let lune = 0;
  for (const { p } of PIANETI) {
    if (!p.lune.length) continue; const RH = LU.raggioHill(p);
    __M.ok("166.0", p.lune.reduce((a, l) => a + l.massaKg, 0) < 0.15 * p.massaKg, 'lune troppo pesanti'); // (le lune nate da un urto gigante vero arrivano a qualche centesimo del pianeta: Caronte è il 12% di Plutone)
    for (const l of p.lune) { lune++; __M.ok("167.0", l.aM * (1 - l.eccentricita) > LU.limiteRoche(p, l.densita), 'luna dentro il limite di Roche'); __M.ok("167.1", l.aM * (1 + l.eccentricita) < 0.7 * RH, 'luna fuori dalla sfera di Hill'); if (l.origine === 'disco') __M.ok("167.2", l.aM < RH / 3); }
  }
  __M.ok("169.0", lune > 1000);
});

prova('le regioni e gli anelli di un pianeta stanno dentro la sua sfera di Hill', () => {
  for (const { p } of PIANETI) __M.ok("173.0", LU.raggioHill(p) / p.raggioM > 4.2, `Hill a ${LU.raggioHill(p) / p.raggioM} raggi`);
});

prova('le stelle che nascono: la massa media e le stelle che esplodono, per galassie.js, sono quelle di Kroupa (leggi.js) e di stelle.js', () => {
  let m = 0, esplodono = 0; const N = 100000, P = GA.popolazione(); for (let i = 0; i < N; i++) { const x = LG.massaNascita((i + 0.5) / N); m += x; if (ST.fine(x, 1e-4, { Z: 1 }).supernova) esplodono++; }
  __M.tra("178.0", P.massaMedia / (m / N), 0.97, 1.03, 'massa media alla nascita: galassie.js / leggi.js'); __M.tra("178.1", P.tab[2].nSN / (esplodono / m), 0.93, 1.07, 'supernove da collasso per M☉ nata: galassie.js / (leggi.js + stelle.js)');
});

prova('il ritmo delle supernove è quello della storia della galassia: le esplose nel campione sono quelle che la storia ha fatto', () => {
  const r = []; let esploseTutte = 0;
  for (const { Gx } of GALASSIE) {
    const F = Gx.forma, st = F.storia; __M.eq("184.0", Gx.ritmoSN, GA.ritmoSupernove(F).totale);
    // oggi: tante supernove da collasso quante stelle massicce sono nate nell'ultimo passo (vivono meno di un passo)
    if (st.sfr[GA.PASSI] > 0) __M.tra("186.0", F.ritmoSN.collasso / (st.sfr[GA.PASSI] * GA.popolazione().tab[2].nSN), 0.6, 1.5, 'supernove da collasso oggi / (nascite di oggi × massicce per M☉)');
    // in tutta la storia: l'integrale del ritmo dei collassi è il numero di stelle di neutroni e buchi neri che il campione rappresenta
    // (quelle nate qui: le stelle venute con le fusioni sono esplose, quasi tutte, nella galassia da cui venivano)
    let storia = 0; for (let j = 1; j <= GA.PASSI; j++) storia += st.collasso[j] * st.dt * 1e9;
    const esplose = Gx.stelle.filter((s) => (s.stato === 'stella di neutroni' || s.stato === 'buco nero') && s.peso > 1 && !s.venuta); esploseTutte += esplose.length;
    r.push((esplose.length * Gx.pesoCampione) / storia);
  }
  // (una decina di esplose per campione: lo scarto di conteggio è del 30%; in media deve tornare)
  __M.ok("194.0", esploseTutte > 40, `${esploseTutte} esplose nel campione`); __M.tra("194.1", r.reduce((a, b) => a + b, 0) / r.length, 0.75, 1.3, 'esplose nel campione × peso / supernove della storia (media sulle galassie)');
});

prova('la massa del pianeta è una sola: anche i granelli dell\'anello (nebbia.js) girano attorno a quella del disco', () => {
  let n = 0, conAnello = 0;
  for (const x of PIANETI.filter((_, i) => i % 41 === 0)) {
    const neb = NE.nebbiaPianeta(x.n, x.gid, x.sid, x.p.id); n++; __M.eq("200.0", neb.M, x.p.massaKg);
    if (neb.anello.length) { conAnello++; const g = neb.anello[0]; __M.tra("201.0", g.omega / Math.sqrt((K.G * x.p.massaKg) / (g.r * x.p.raggioM) ** 3), 1 - 1e-9, 1 + 1e-9, 'velocità di Keplero di un granello'); }
  }
  __M.ok("203.0", n >= 40 && conAnello >= 5);
});

prova('il velo di idrogeno ed elio lasciato dal disco è l\'aria primordiale del pianeta: resta se la gravità trattiene l\'idrogeno, se no è fuggito', () => {
  let tenuto = 0, fuggito = 0;
  for (const { p } of SOLIDI) {
    if (!(p.involucro > 0)) continue;
    const colonna = (p.involucro * p.massaKg) / (4 * Math.PI * p.raggioM ** 2), H2 = p.atmosfera?.gas?.H2 || 0;
    if (p.clima.tenuti.includes('idrogeno')) { tenuto++; __M.ok("211.0", H2 > 0.7 && (p.atmosfera.gas.He || 0) > 0.1, `velo tenuto ma aria di ${foto(p.atmosfera.gas).slice(0, 80)}`); __M.tra("211.1", p.clima.pressione / (colonna * p.clima.g), 0.9, 1.001, 'pressione dell\'aria / peso del velo'); }
    else { fuggito++; __M.ok("212.0", H2 < 1e-6 && !(p.atmosfera?.gas?.He > 1e-6), 'velo non trattenuto ma ancora lì'); }
  }
  // i mondi con un velo sono rari (circa uno su mille, attorno alle stelle piccole): quanti ne capitino nel campione è un
  // caso, non una legge, e non si chiede un numero minimo. La legge vale per ognuno di quelli che ci sono (qui sopra), e si
  // prova su due mondi fatti apposta, uguali in tutto tranne massa e distanza: quello pesante e lontano tiene il velo,
  // quello leggero e vicino lo perde
  console.log(`      nel campione: ${tenuto} veli tenuti, ${fuggito} fuggiti, su ${SOLIDI.length} mondi solidi`);
  const mondo = (terre, raggi, ua) => CH.climaEAria({ Lw: 3.83e26, aM: ua * 1.496e11, massaKg: terre * 5.97e24, raggioM: raggi * 6.371e6, tipo: 'ghiacciato', acqua: 0.3, acquaKg: 0.3 * terre * 5.97e24,
    anno: 3.156e7 * ua ** 1.5, obliquita: 0.3, bloccato: false, placche: false, composizione: { roccia: 0.5, ferro: 0.15, ghiaccio: 0.34, gas: 0.01 }, involucro: 0.01 }, { Z: 1 });
  const pesante = mondo(8, 2.2, 3), leggero = mondo(0.5, 0.9, 0.3);
  __M.ok("222.0", pesante.clima.tenuti.includes('idrogeno') && pesante.atmosfera.gas.H2 > 0.7 && pesante.atmosfera.gas.He > 0.1, 'otto Terre a 3 UA: il velo resta');
  __M.ok("223.0", !leggero.clima.tenuti.includes('idrogeno') && !((leggero.atmosfera?.gas?.H2 || 0) > 1e-6) && pesante.clima.pressione > 5 * leggero.clima.pressione, 'mezza Terra a 0,3 UA: il velo è fuggito');
});
prova('ogni galassia ha meno barioni di quanti ne porta il suo alone (Ωb/Ωm), e la massa del campione è quella delle sue stelle', () => {
  for (const n of [1, 2]) for (const G of CO.cosmo(n).galassie) { const F = G.forma; __M.ok("226.0", F.massaStelle + F.massaGas + F.massaCalda + F.massaFuori <= (COSMO.Ob / COSMO.Om) * F.alone.massa * (1 + 1e-9), `galassia ${n}/${G.id}: più barioni dell'alone`); }
  for (const { Gx } of GALASSIE) __M.tra("227.0", Gx.stelle.reduce((a, s) => a + s.massa * s.peso, 0) / Gx.forma.massaStelle, 0.75, 1.3, 'massa × peso del campione / massa in stelle della galassia');
});
// le galassie contro i barioni del cosmo. Il toro ora ha tre dimensioni (cosmo3d.js) e le galassie segnate sono un
// campione: ognuna ne rappresenta `peso` vere (la funzione di massa di Press & Schechter sopra l'alone più piccolo).
// Con quel peso le stelle di tutte le galassie sono la parte dei barioni che si misura: ~6% (Fukugita & Peebles 2004).
prova('le stelle di tutte le galassie (il campione per il suo peso) sono qualche centesimo dei barioni del toro', () => {
  for (const n of [1]) {
    const C = CO.cosmo(n), F = campoCosmo(n), stelle = C.galassie.reduce((a, G) => a + G.forma.massaStelle, 0);
    const H = (COSMO.H0 * 1000) / 3.086e22, rhoC = (3 * H * H) / (8 * Math.PI * K.G), barioni = (COSMO.Ob * rhoC * CO.TORO_M ** 3) / MSOLE, parte = (stelle * F.peso) / barioni;
    console.log(`      (${C.galassie.length} galassie segnate, ognuna per ${num(F.peso)} vere: ${num(stelle * F.peso)} Msol di stelle su ${num(barioni)} di barioni: ${num(100 * parte)}%; misurato ~6%. Mancano le galassie sotto ${num(F.massaMinima)} Msol di alone)`);
    __M.tra("237.0", parte, 0.02, 0.15, 'la parte dei barioni che è in stelle');
  }
});

// =====================================================================================================
sezione('GLI ELEMENTI');
// =====================================================================================================
// le proporzioni in massa che chimica.js dà alla materia del Sole
const CHIM = (() => {
  const ab = CH.abbondanze(1), E = CH.ELEMENTI, m = (s) => ab[s] * E[s].massa; let tot = 0, metalli = 0;
  for (const s in ab) { tot += m(s); if (s !== 'H' && s !== 'He') metalli += m(s); }
  const Oroccia = ab.Mg + 2 * ab.Si + 1.5 * ab.Al + ab.Ca + (ab.Na + ab.K) / 2 + 0.15 * ab.Fe; // come ossigenoNellaRoccia() di chimica.js
  const roccia = m('Mg') + m('Si') + m('Al') + m('Ca') + m('Na') + m('K') + Oroccia * E.O.massa, ferro = m('Fe'), acqua = (ab.O - Oroccia) * (E.O.massa + 2 * E.H.massa);
  return { X: m('H') / tot, Y: m('He') / tot, Z: metalli / tot, ferro: ferro / (ferro + roccia), ghiaccio: acqua / (acqua + roccia + ferro), rocciaSuMetalli: (roccia + ferro) / metalli, acquaSuMetalli: acqua / metalli };
})();

prova('chimica.js: idrogeno, elio e metalli del Sole fanno 1, e solo i metalli crescono con Z', () => {
  __M.tra("254.0", CHIM.X + CHIM.Y + CHIM.Z, 1 - 1e-12, 1 + 1e-12, 'X + Y + Z'); __M.tra("254.1", CHIM.X, 0.70, 0.75, 'idrogeno'); __M.tra("254.2", CHIM.Z, 0.010, 0.016, 'metalli');
  const a1 = CH.abbondanze(1), a3 = CH.abbondanze(3);
  for (const s in a1) __M.ok("256.0", Math.abs(a3[s] / a1[s] - (s === 'H' || s === 'He' ? 1 : 3)) < 1e-12);
});

prova('l\'aria di ogni pianeta: le frazioni fanno 1, e non c\'è nessuna molecola più leggera di quelle che la gravità trattiene', () => {
  let n = 0;
  for (const { p } of PIANETI) {
    if (!p.atmosfera || !Object.keys(p.atmosfera.gas).length) continue; n++;
    __M.tra("263.0", Object.values(p.atmosfera.gas).reduce((a, b) => a + b, 0), 1 - 1e-6, 1 + 1e-6, 'somma dei gas');
    if (p.tipo === 'gassoso') continue;
    const leggera = Math.min(...p.clima.tenuti.map((g) => LG.MOLECOLE[g]));
    // (i gas saliti dall'interno — argon ed elio radiogenici, risalita.js — non sono tra i sei di leggi.js: per loro vale la stessa legge, con la loro massa)
    const Tnuda = LG.temperaturaEquilibrio(p.Lw, p.aM, 0.3);
    for (const f in p.atmosfera.gas) __M.ok("268.0", CH.MOLECOLE[f].massa >= leggera * 0.99 || LG.trattiene(p.massaKg, p.raggioM, Tnuda, CH.MOLECOLE[f].massa * K.mp), `${f} sfuggirebbe (il più leggero tenuto pesa ${leggera})`);
  }
  __M.ok("270.0", n > 500);
});

prova('la linea della neve è la stessa in disco.js e in lune.js: 170 K a 2,7·√L unità astronomiche', () => {
  for (const M of [0.3, 1, 2.5]) {
    const D = DI.disco({ massa: M, Z: 1, eta: 4.5e9 }, 1), Tdisco = (280 * Math.pow(D.L, 0.25)) / Math.sqrt(D.neve); // la temperatura che formaPianeti usa per il ferro
    __M.tra("276.0", Tdisco, 168, 172, 'temperatura del disco sulla linea della neve'); __M.tra("276.1", D.neve / (2.7 * Math.sqrt(ST.stella(M, { Z: 1 }).L)), 0.999, 1.001, 'linea della neve');
  }
});

prova('la miscela del Sole ha una fonte sola (chimica.js SOLE): roccia, ghiacci, ferro, idrogeno ed elio del disco vengono da lì', () => {
  const S = CH.SOLE, D = DI.DISCO;
  for (const [k, v] of [['X', CHIM.X], ['Y', CHIM.Y], ['Z', CHIM.Z], ['ferro', CHIM.ferro], ['roccia', CHIM.rocciaSuMetalli], ['acqua', CHIM.acquaSuMetalli]]) __M.tra("282.0", S[k] / v, 1 - 1e-9, 1 + 1e-9, `SOLE.${k} contro la tavola degli elementi`);
  __M.eq("283.0", D.metalliSole, S.Z); __M.eq("283.1", D.roccia, S.roccia); __M.eq("283.2", D.solidiFreddi, S.roccia + S.ghiacci); __M.eq("283.3", D.ghiaccio, S.ghiaccio); __M.eq("283.4", D.ferro, S.ferro); __M.tra("283.5", D.idrogeno / (S.X / (S.X + S.Y)), 1 - 1e-12, 1 + 1e-12, 'idrogeno del gas');
  __M.tra("284.0", S.ghiaccio, 0.55, 0.67, 'ghiacci nei solidi oltre la neve'); __M.tra("284.1", S.roccia + S.ghiacci, 0.8, 1, 'solidi oltre la neve, sui metalli');
  // un gigante: idrogeno ed elio nella proporzione del Sole; un mondo nato tutto oltre la neve: quel tanto di ghiaccio
  let giganti = 0, freddi = 0;
  for (const { p } of PIANETI) {
    if (p.tipo === 'gassoso') { giganti++; __M.tra("288.0", p.composizione.idrogeno / (p.composizione.idrogeno + p.composizione.elio), D.idrogeno - 1e-9, D.idrogeno + 1e-9, 'idrogeno di un gigante'); }
    else if (p.tipo === 'ghiacciato') { freddi++; __M.ok("289.0", p.composizione.ghiaccio <= S.ghiaccio + 1e-9, `più ghiaccio (${p.composizione.ghiaccio}) di quanto il Sole ne dia`); }
  }
  __M.ok("291.0", giganti > 10 && freddi > 500);
});
prova('il ferro di un pianeta non dipende dai metalli della stella (ferro e roccia crescono insieme): dipende da dove è nato', () => {
  const sorgente = readFileSync(new URL('../src/camera/disco.js', import.meta.url), 'utf8'), riga = sorgente.split('\n').find((r) => /ferroRoccia = /.test(r)) || '';
  __M.ok("295.0", /P\.ferro/.test(riga) && !/D\.Z|st\.Z/.test(riga.split('//')[0]), 'la legge del ferro in disco.js guarda ancora la metallicità');
  // dai pianeti: il ferro (sulla roccia) sta tra quello del Sole oltre la neve e il tetto di tre quarti, per stelle povere e ricche
  const rocciosi = PIANETI.filter((x) => x.p.tipo === 'roccioso'), r = (x) => x.p.composizione.ferro / (x.p.composizione.ferro + x.p.composizione.roccia);
  for (const x of rocciosi) __M.tra("298.0", r(x), CH.SOLE.ferro / (1 + (170 / 600) ** 2) - 1e-9, 0.75 + 1e-9, 'ferro / (ferro + roccia)');
  const povere = rocciosi.filter((x) => x.S0.Z < 0.5).map(r), ricche = rocciosi.filter((x) => x.S0.Z > 1).map(r);
  if (povere.length > 20 && ricche.length > 20) __M.tra("300.0", mediana(ricche) / mediana(povere), 0.85, 1.18, 'ferro mediano: stelle ricche / stelle povere');
});
{
  nota(3, 'le lune regolari nate oltre la neve sono «metà ghiaccio e metà roccia»; la miscela del Sole (chimica.js SOLE, che ora usa il disco) dà più ghiaccio',
    { casi: 1, su: 1, tipico: `lune.js 0,5 · chimica.js ${num(CH.SOLE.ghiaccio)}`, dove: 'lune.js regolari() «b.ghiaccio = 0.5 / (1 + …)»' });
}
prova('la metallicità discende dalle supernove avvenute prima: il bilancio dei metalli è chiuso, la resa per supernova è una sola', () => {
  const rese = [];
  for (const { Gx } of GALASSIE) {
    const F = Gx.forma, b = F.bilancio, st = F.storia; let sn = 0; for (let j = 1; j <= GA.PASSI; j++) sn += (st.collasso[j] + st.Ia[j]) * st.dt * 1e9;
    // i metalli che ci sono (nel gas, nelle stelle, soffiati via) sono quelli fatti dalle stelle morte più quelli entrati
    __M.tra("311.0", (b.metalliGas + b.metalliStelle + b.metalliVento + b.metalliCaldo) / (b.metalliProdotti + b.metalliEntrati), 1 - 1e-6, 1 + 1e-6, 'metalli presenti / prodotti');
    __M.tra("312.0", (b.gas + b.stelle + b.vento + b.alCaldo) / b.entrato, 1 - 1e-9, 1 + 1e-9, 'massa presente / entrata');
    rese.push(b.metalliProdotti / sn);
    // ogni stella ha la Z del gas da cui è nata: quella del suo anello nel suo passo (nel disco, dove il posto di oggi è quello di nascita)
    for (const s of Gx.stelle.filter((x, i) => x.componente === 'disco' && x.peso > 1 && i % 40 === 0)) __M.tra("315.0", s.Z / Math.max(1e-4, GA.metallicitaDiNascita(F, nascitaDi(s), Math.hypot(...s.pos) * F.unitaKpc)), 0.999, 1.001, 'Z della stella / Z del gas del suo anello quando è nata');
  }
  // (prima la resa «necessaria» andava da 0,5 a 20 Msol per supernova; ora è la stessa in ogni galassia, entro il peso diverso delle Ia)
  __M.tra("318.0", minimo(rese), 0.6, 1.6, 'metalli nuovi per supernova (Msol), la galassia che ne fa meno'); __M.tra("318.1", massimo(rese) / minimo(rese), 1, 1.5, 'la resa per supernova tra una galassia e l\'altra');
});

// =====================================================================================================
sezione('LA STESSA GRANDEZZA CALCOLATA DUE VOLTE');
// =====================================================================================================
prova('il campo magnetico è uno solo: interno → pianeta → dipolo della regione → bolle dello zoom (in tesla)', () => {
  let n = 0;
  for (const x of PIANETI.filter((_, i) => i % 211 === 0)) {
    const { p } = x, a = { cosmo: x.n, galassia: x.gid, stella: x.sid, pianeta: p.id, regione: n % CO.REGIONI }; n++;
    __M.eq("328.0", p.B0, p.interno.B0);
    for (const c of [CO.cellaDi(a), CO.cellaDi({ ...a, zoom: [[3, 4]] })]) {
      const d = c.dipoli[0], u = UN.unita(c.scala.latoM);
      __M.tra("331.0", d.B0 / (UN.C_MOTORE * UN.E_SU_MEC * u.l) / p.B0, 1 - 1e-9, 1 + 1e-9, 'campo del dipolo (tesla) / B0 del pianeta'); __M.tra("331.1", (d.R * u.l) / p.raggioM, 1 - 1e-9, 1 + 1e-9, 'raggio del dipolo / raggio del pianeta');
    }
  }
  __M.ok("334.0", n >= 8);
});

prova('gravità, anno, giorno, schiacciamento e temperatura di equilibrio discendono dagli stessi numeri del pianeta', () => {
  for (const x of PIANETI) {
    const { p } = x;
    __M.tra("340.0", p.clima.g / ((K.G * p.massaKg) / p.raggioM ** 2), 1 - 1e-9, 1 + 1e-9, 'gravità');
    __M.tra("341.0", p.clima.Teq / LG.temperaturaEquilibrio(p.Lw, p.aM, p.clima.albedo), 1 - 1e-9, 1 + 1e-9, 'temperatura di equilibrio');
    __M.tra("342.1", p.anno / (2 * Math.PI * Math.sqrt(p.aM ** 3 / (K.G * x.S0.massa * MSOLE))), 0.999, 1.001, 'anno (Keplero, con la massa che la stella ha oggi)'); __M.eq("342.0", p.Mstella, x.S0.massa * 1.989e30);
    if (p.bloccato) { __M.eq("343.0", p.giorno, p.anno); __M.eq("343.1", p.obliquita, 0); }
    __M.tra("344.0", p.schiacciamento, 0, 0.3, 'schiacciamento'); if (p.schiacciamento < 0.3) __M.tra("344.1", p.schiacciamento / (1.25 * ((2 * Math.PI) / p.giorno) ** 2 * p.raggioM ** 3 / (K.G * p.massaKg)), 0.999, 1.001, 'schiacciamento = 5/4·ω²R³/GM');
    if (p.atmosfera && isFinite(p.clima.pressione)) __M.ok("345.0", p.atmosfera.pressione <= p.clima.pressione * (1 + 1e-9), 'l\'aria di chimica.js non supera quella del clima');
    if (p.tipo !== 'gassoso') __M.tra("346.0", p.interno.nucleo, 0, 1, 'raggio del nucleo / raggio del pianeta');
  }
});

prova('il calore che esce dall\'interno ha una fonte sola, interno().q: anche la pozza del pannello legge quella', () => {
  const pannello = readFileSync(new URL('../src/camera/laboratorio.js', import.meta.url), 'utf8');
  __M.ok("352.0", !/flussoInterno/.test(pannello), 'laboratorio.js usa ancora fluidi.flussoInterno'); __M.ok("352.1", /q = P\.interno\.q\b/.test(pannello), 'la pozza non legge P.interno.q');
  for (const { p } of SOLIDI) __M.ok("353.0", p.interno.q > 0 && Number.isFinite(p.interno.q));
});
prova('la radioattività cala con l\'età con una legge sola (leggi.js caloreDellaRoccia): la stessa per i pianeti e per le lune', () => {
  __M.tra("356.0", LG.caloreDellaRoccia(1e9) / LG.caloreDellaRoccia(4.5e9), 4.5, 5, 'a un miliardo di anni'); __M.tra("356.1", LG.caloreDellaRoccia(1e10) / LG.caloreDellaRoccia(4.5e9), 0.25, 0.33, 'a dieci miliardi di anni');
  // le lune: watt per chilo di roccia; i pianeti: lo stesso andamento con l'età (a parità di tutto il resto)
  const corpo = { massaKg: 7.35e22, raggioM: 1.737e6, composizione: { ghiaccio: 0 } }, P = { tipo: 'roccioso', massaKg: 5.97e24, raggioM: 6.371e6, composizione: { ferro: 0.32, roccia: 0.67, acqua: 0.01 } };
  for (const eta of [5e8, 2e9, 4.5e9, 9e9, 1.3e10]) {
    const atteso = LG.caloreDellaRoccia(eta) / LG.caloreDellaRoccia(4.5e9);
    __M.tra("361.0", LU.caloreRadioattivo(corpo, eta) / LU.caloreRadioattivo(corpo, 4.5e9) / atteso, 1 - 1e-9, 1 + 1e-9, 'lune');
    __M.tra("362.0", GE.interno(P, { eta, Z: 1 }).q / GE.interno(P, { eta: 4.5e9, Z: 1 }).q / atteso, 1 - 1e-9, 1 + 1e-9, 'pianeti');
  }
});
{
  nota(3, 'il calore interno di un pianeta cresce con i metalli della stella (√Z: più uranio e torio); quello di una luna no: caloreRadioattivo non riceve la metallicità',
    { casi: 1, su: 1, dove: 'geologia.js interno() «Math.sqrt(Math.max(0.05, Z))» contro lune.js caloreRadioattivo(L, eta)' });
}
prova('il blocco mareale ha una legge sola: quella di lune.js (tempoBlocco), che rotazione.js integra dalla nascita del pianeta a oggi', () => {
  let bloccati = 0, liberi = 0, risonanti = 0, controllati = 0;
  for (const x of PIANETI) {
    const { p } = x, g = p.giro;
    __M.ok("373.0", g && p.giorno === g.giorno && p.bloccato === g.bloccato && p.obliquita === g.obliquita, `pianeta a ${p.aM / UA} UA: il giorno non è quello di rotazione.js`);
    // fermo (bloccato, o in risonanza su un'orbita allungata) se e solo se il tempo che serve alla stella è più corto del tempo che ha avuto
    if (!p.lune.some((l) => l.origine === 'urto')) __M.eq("375.0", p.bloccato || !!p.risonanza, g.tempoFreno <= x.eta - g.nascita, `pianeta a ${p.aM / UA} UA: freno ${g.tempoFreno} anni, età ${x.eta}`);
    // per un corpo di roccia o di ghiaccio quel tempo è tempoBlocco di lune.js, partendo dal giorno con cui è nato (meno il pezzo
    // di strada che non serve: non si ferma del tutto, arriva a girare con l'orbita)
    if (g.origine !== 'gas' && g.obliquitaNascita < 90 && g.giornoNascita < p.anno / 2 && !p.lune.some((l) => l.origine === 'urto')) { controllati++;
      const t = LU.tempoBlocco({ massaKg: p.Mstella }, { massaKg: p.massaKg, raggioM: p.raggioM, aM: p.aM, composizione: p.composizione }, g.giornoNascita) / ANNO, giri = Math.max(1, Math.round(2 * g.equilibrio) / 2);
      __M.tra("380.0", g.tempoFreno / (t * (1 - (giri * g.giornoNascita) / p.anno)), 1 - 1e-6, 1 + 1e-6, 'tempo di frenata di rotazione.js / tempoBlocco di lune.js'); }
    if (p.bloccato) bloccati++; else liberi++; if (p.risonanza) risonanti++;
  }
  __M.ok("383.0", bloccati > 100 && liberi > 100 && controllati > 300, `${bloccati} bloccati, ${liberi} no (${risonanti} in risonanza), ${controllati} controllati contro tempoBlocco`);
});
prova('nessun pianeta gira più in fretta di quanto un corpo fluido può (0,53 volte la rottura): il giorno non è più sorteggiato', () => {
  for (const { p } of PIANETI) { const rottura = 2 * Math.PI * Math.sqrt(p.raggioM ** 3 / (K.G * p.massaKg)); __M.ok("386.0", p.giorno >= (rottura / 0.53) * (1 - 1e-9), `giorno ${p.giorno / 3600} ore, rottura ${rottura / 3600} ore`); }
});
prova('nane bianche: la luce che scalda i pianeti è quella del loro raggio e della loro temperatura (4πR²σT⁴)', () => {
  const wd = PIANETI.filter((x) => x.S0.stato === 'nana bianca'); __M.ok("389.0", wd.length > 50);
  for (const x of wd) __M.tra("390.0", x.p.Lw / (4 * Math.PI * x.S0.raggioM ** 2 * K.sigma * x.S0.T ** 4), 1 - 1e-9, 1 + 1e-9, 'luce della nana bianca');
  for (const x of PIANETI.filter((y) => y.viva)) __M.tra("391.0", x.p.Lw / (ST.stella(x.S0.massa, { Z: x.S0.Z, eta: x.S0.eta }).L * LSOLE), 1 - 1e-9, 1 + 1e-9, 'luce della stella viva');
});
prova('la pressione dell\'aria è una sola: quella dei gas che restano (chimica.js), e da quei gas viene la serra del clima', () => {
  let conAria = 0, nudi = 0;
  for (const { p } of SOLIDI) {
    const a = p.atmosfera, c = p.clima; __M.ok("396.0", a, 'un pianeta senza il conto dell\'aria');
    __M.eq("397.0", c.pressione, a.pressione);
    if (a.pressione > 0) { conAria++; __M.tra("398.1", (c.tau + 1e-12) / (Math.min(1e4, CH.serra(a.gas, a.pressione, c.g, c.Taria)) + 1e-12), 1 - 1e-6, 1 + 1e-6, 'serra del clima / serra dei gas dell\'aria'); } else { nudi++; __M.eq("398.0", c.tau, 0); }
    __M.ok("399.0", c.tau >= 0 && c.tau <= 1e4);
  }
  __M.ok("401.0", conAria > 1000 && nudi >= 0);
});
prova('i riscontri della serra: con i gas veri la legge ridà Venere, la Terra, Marte e Titano', () => {
  const T = (Teq, tau) => Teq * Math.pow(1 + 0.75 * tau, 0.25);
  // [gas, pressione (Pa), gravità, temperatura senza serra (dalla luce assorbita, misurata), temperatura vera]
  const mondi = { Terra: [{ N2: 0.767, O2: 0.206, H2O: 0.017, CO2: 4.2e-4, CH4: 1.9e-6 }, 1.013e5, 9.81, 255, 288], Venere: [{ CO2: 0.965, N2: 0.035, SO2: 1.5e-4, H2O: 2e-5 }, 9.2e6, 8.87, 229, 735], Marte: [{ CO2: 0.953, N2: 0.027, O2: 0.0013, CO: 8e-4, H2O: 2e-4 }, 610, 3.71, 210, 214], Titano: [{ N2: 0.95, CH4: 0.049, H2: 0.001 }, 1.47e5, 1.352, 82, 94] };
  const riga = [];
  for (const nome in mondi) { const [gas, pr, g, Teq, vera] = mondi[nome], t = T(Teq, CH.serra(gas, pr, g, vera)); riga.push(`${nome} ${num(t, 4)} K (vera ${vera})`); __M.tra("408.0", t / vera, 0.97, 1.03, nome); }
  console.log(`      ${riga.join(', ')}`);
  // senz'aria niente serra; più gas, più serra; i gas che non assorbono contano solo se l'aria è fitta
  __M.eq("411.2", CH.serra({}, 0, 9.8), 0); __M.ok("411.0", CH.serra({ CO2: 1 }, 1e6, 9.8) > CH.serra({ CO2: 1 }, 1e5, 9.8)); __M.ok("411.1", CH.serra({ N2: 1 }, 1e5, 9.8, 288) < 0.05 && CH.serra({ N2: 1 }, 1e5, 9.8, 288) < CH.serra({ CO2: 1 }, 1e5, 9.8, 288) / 20);
});
prova('l\'acqua bolle dove l\'aria è satura: leggi.js (stato dell\'acqua) e chimica.js (vapore nell\'aria) danno la stessa temperatura', () => {
  for (const P of [1e3, 1e4, 1e5, 1e6, 1e7]) { let lo = 200, hi = 800; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (CH.pressioneVapore(m) < P) lo = m; else hi = m; } __M.tra("414.0", LG.ebollizione(P) - lo, -0.05, 0.05, `ebollizione a ${P} Pa: leggi − chimica (K)`); }
  __M.eq("415.0", LG.statoAcqua(300, 1e5), 'liquida'); __M.eq("415.1", LG.statoAcqua(380, 1e5), 'vapore'); __M.eq("415.2", LG.statoAcqua(700, 1e9), 'vapore'); __M.eq("415.3", LG.statoAcqua(260, 1e5), 'ghiaccio');
});
prova('il clima e l\'aria si tengono: il mare c\'è dove può, il termostato del carbonio lo tiene aperto, e i mondi di ghiaccio freddi restano gelati', () => {
  const conta = {}; let venere = 0;
  for (const { p } of SOLIDI) {
    const c = p.clima, k = `${p.tipo} ${c.acqua.slice(0, 7)}${c.termostato ? ' (termostato)' : ''}`; conta[k] = (conta[k] || 0) + 1;
    if (c.acqua === 'liquida') { __M.ok("421.0", c.T >= 273.15 && c.T < LG.ebollizione(c.pressione) && c.T < 647 && c.bilancio.assorbita <= LG.LIMITE_VAPORE, `mare a ${c.T} K e ${c.pressione} Pa`); __M.ok("421.1", !(p.atmosfera.gas.SO2 > 1e-9), 'anidride solforosa sopra un mare'); }
    if (c.termostato) { __M.eq("422.1", c.acqua, 'liquida'); __M.tra("422.2", c.T, 273.15, 300, 'temperatura al termostato'); __M.ok("422.0", (p.atmosfera.gas.CO2 || 0) * c.pressione <= c.termostato * 1.01, 'più CO2 di quella che il termostato lascia'); }
    else if (c.acqua === 'liquida') __M.ok("423.0", (p.atmosfera.gas.CO2 || 0) * c.pressione <= Math.max(CH.pressioneCO2Urey(c.T) * 3, (c.co2Ciclo || 0) * 1.01) + 1e-9 || p.clima.tenuti.includes('idrogeno'), 'CO2 sopra un mare senza termostato'); // (la CO2 è quella a cui le rocce consumano quanto i vulcani emettono: il ciclo del carbonio di chimica.js, quando c'è)
    if (c.acqua.startsWith('vapore') && p.tipo === 'roccioso' && (p.atmosfera.gas.CO2 || 0) > 0.9 && c.pressione > 1e6) venere++;
    if (c.acqua === 'ghiaccio') __M.ok("425.0", c.T < 273.15);
  }
  console.log(`      ${Object.entries(conta).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(', ')}; ${venere} come Venere (vapore, CO2, più di 10 bar)`);
  __M.ok("428.0", Object.keys(conta).some((k) => k.includes('termostato')) && venere >= 3 && (conta['ghiacciato ghiacci'] || 0) > 300);
});
prova('sopra un mare aria e clima sono una coppia sola (stessa temperatura); il ciclo del carbonio c\'è dove ci sono vulcani; prebiotica vede il mare', () => {
  let mari = 0, cicli = 0, peggio = 0, vulcaniEMare = 0; const pre = { mare: 0, HCN: 0, formaldeide: 0, auto: 0 };
  for (const { p } of SOLIDI) {
    const c = p.clima, q = p.prebiotica;
    if (c.co2Ciclo > 0) { cicli++; __M.ok("434.0", p.interno.vulcani > 0 && c.acqua === 'liquida', 'ciclo del carbonio senza vulcani o senza mare'); __M.ok("434.1", (p.atmosfera.gas.CO2 || 0) * c.pressione <= c.co2Ciclo * 1.01, "più CO2 nell'aria di quella del ciclo"); }
    if (c.acqua === 'liquida') { mari++; if (p.interno.vulcani > 0) vulcaniEMare++;
      // (al termostato l'aria è fatta a 275 K per costruzione: lì la coppia non è cercata)
      if (!c.termostato) { const d = Math.abs(c.Taria - c.T); peggio = Math.max(peggio, d); __M.ok("437.0", d < 6, `mare con l'aria fatta a ${c.Taria} K e il clima a ${c.T} K`); }
      if (q) { __M.eq("438.0", q.acquaLiquida, true, 'prebiotica non vede il mare'); if (q.acquaLiquida) { pre.mare++; if (q.HCN > 1e-3) pre.HCN++; if (q.formaldeide > 1e-3) pre.formaldeide++; if (q.autocatalisi) pre.auto++; } } }
    else if (q) __M.eq("439.0", q.acquaLiquida, false);
    if (p.atmosfera && Object.keys(p.atmosfera.gas).length) __M.ok("440.0", p.energiaChimica && p.energiaChimica.relativa >= 0, "manca l'energia per la chimica dell'aria");
  }
  __M.ok("442.0", mari > 50);
  console.log(`      ${mari} mari; aria e clima alla stessa temperatura entro ${num(peggio)} K (termostato a parte); ciclo del carbonio acceso su ${cicli} (pianeti con vulcani e mare: ${vulcaniEMare}); prebiotica: ${pre.mare} con acqua liquida (prima 0: riceveva un sì/no), di cui ${pre.HCN} con acido cianidrico oltre un millesimo, ${pre.formaldeide} con formaldeide oltre un millesimo, ${pre.auto} con gli zuccheri che si moltiplicano`);
});
{ // 5. gli anelli contro il limite di Roche e la temperatura
  // (di che cosa è fatto l'anello lo dice l'anello: «materiale», ghiaccio o roccia. Prima lo si indovinava dalla temperatura,
  // e un anello di roccia vicino alla stella — i detriti di un urto — era contato come ghiaccio che sublima)
  let conAnelli = 0, oltre = 0, caldi = 0; const di = { ghiaccio: 0, roccia: 0 };
  for (const x of PIANETI) {
    const { p } = x, Pl = CO.pianeta(x.n, x.gid, x.sid, p.id); if (!Pl.anello) continue; conAnelli++;
    const materiale = p.anello.materiale; __M.ok("451.0", materiale in di, `anello di «${materiale}»`); di[materiale]++;
    if (materiale === 'ghiaccio' && !(LG.temperaturaEquilibrio(p.Lw, p.aM, 0.6) < 170)) caldi++;
    if (Pl.anello[1] > LU.limiteRoche(p, LU.MATERIALI[materiale].densita) / p.raggioM) oltre++;
  }
  prova('gli anelli stanno dentro il limite di Roche del loro materiale (ora vengono da anelli.js, non da una probabilità)', () => {
    console.log(`      ${conAnelli} pianeti con anelli su ${PIANETI.length}: ${di.ghiaccio} di ghiaccio, ${di.roccia} di roccia`);
    __M.ok("457.0", conAnelli > 10, `${conAnelli} pianeti con anelli`); __M.eq("457.1", oltre, 0, 'anelli oltre il limite di Roche'); __M.eq("457.2", caldi, 0, 'anelli di ghiaccio dove il ghiaccio sublima'); });
  const alTetto = PIANETI.filter(({ p }) => p.schiacciamento >= 0.3).length;
  nota(3, 'lo schiacciamento ai poli usa la formula dei corpi che girano piano (5/4·ω²R³/GM) anche per chi esce da un urto gigante vicino al limite dei fluidi: lì è tagliato a 0,3',
    { casi: alTetto, su: PIANETI.length, dove: 'cosmo.js sistema() «Math.min(0.3, …)» (il giorno ora viene da rotazione.js)' });
}
{ // 6. l'acqua: composizione → interno.acquaKg → mare; clima.acqua
  prova('l\'acqua alla superficie ha una fonte sola (leggi.js): la stessa per il clima e per il mare, rocciosi e ghiacciati', () => {
    let ghiacciati = 0;
    for (const { p } of SOLIDI) {
      const a = LG.acquaInSuperficie(p);
      __M.eq("467.0", p.interno.acquaKg, a.kg); __M.eq("467.1", a.frazione, p.composizione.acqua ?? p.composizione.ghiaccio ?? 0);
      __M.eq("468.0", p.clima.acqua !== 'assente', a.frazione > 0, 'il clima e l\'interno non sono d\'accordo se l\'acqua c\'è');
      if (p.tipo === 'ghiacciato') { ghiacciati++; __M.ok("469.0", a.kg > 0.2 * p.massaKg, 'un mondo ghiacciato ha il suo ghiaccio in superficie'); }
    }
    __M.ok("471.0", ghiacciati > 500);
  });
}

// =====================================================================================================
sezione('LA SUPERFICIE E IL CLIMA SIMULATI (pochi pianeti: costano secondi)');
// =====================================================================================================
// (mondi a cui arriva luce vera, almeno 0,05 W/m²: dove quasi non ne arriva — attorno a una nana bruna o a un resto freddo —
// «irradia quanto assorbe» non dice niente, perché conta il calore dell'interno; quale pianeta capiti dipende dalle stelle della galassia)
const ILLUMINATI = SOLIDI.filter(({ p }) => p.clima.bilancio?.arriva > 0.05);
const SCELTI = [
  ['un mondo ghiacciato, gelato', ILLUMINATI.find(({ p }) => p.tipo === 'ghiacciato' && !p.bloccato && p.clima.acqua === 'ghiaccio' && p.aM < 8 * UA && p.interno.tettonica !== 'a placche')],
  ['un roccioso coperto da un oceano profondo', ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && !p.clima.acqua.startsWith('vapore') && p.interno.acquaKg / 1000 / (4 * Math.PI * p.raggioM ** 2) > 2e4 && p.interno.tettonica !== 'a placche')],
  ['un roccioso con il mare e le placche', ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.acqua === 'liquida' && p.interno.tettonica === 'a placche') || ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.acqua === 'liquida' && !p.bloccato)],
  ['un roccioso con il mare tenuto aperto dal termostato del carbonio', ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.termostato > 0 && !p.bloccato && p.clima.mare < 0.97 && p.interno.tettonica !== 'a placche') || ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.termostato > 0 && p.interno.tettonica !== 'a placche')],
  ['un roccioso con il mare, bloccato dalle maree', ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.acqua === 'liquida' && p.bloccato && !p.clima.termostato && p.interno.tettonica !== 'a placche')],
  ['un roccioso dove l\'acqua è vapore', ILLUMINATI.find(({ p }) => p.tipo === 'roccioso' && p.clima.acqua.startsWith('vapore') && p.interno.acquaKg > 0 && p.interno.tettonica !== 'a placche')],
].filter(([, x]) => x).filter(([, x], i, tutti) => tutti.findIndex(([, y]) => y === x) === i);
const SUPERFICI = SCELTI.map(([nome, x]) => {
  const { p } = x, chiave = `coerenza|${x.n}|${x.gid}|${x.sid}|${p.id}`, sf = GE.superficiePianeta(chiave, p, p.interno, p.origine), cl = GE.climaSuperficie(chiave, p, sf);
  // lo stesso bilancio sulla mappa ma senza i venti di meteo.js (è il «primo giro» di climaSuperficie: già calcolato)
  const senzAria = cl.meteo ? GE.climaSuperficie(`${chiave}|primo giro`, p, sf, { aria: false }) : cl;
  // il volume del mare sulla mappa, e la parte sommersa
  let volume = 0, sommerso = 0, area = 0;
  for (let j = 0; j < sf.H; j++) { const A = (Math.cos(Math.PI / 2 - ((j + 0.5) / sf.H) * Math.PI) * (2 * Math.PI * p.raggioM ** 2 * (Math.PI / sf.H))) / sf.W; for (let i = 0; i < sf.W; i++) { const h = sf.alt[j * sf.W + i]; area += A; if (h < sf.mare) { volume += (sf.mare - h) * A; sommerso += A; } } }
  // il bilancio dell'energia: ciò che il pianeta irradia (almeno σ·Tglobale⁴, attraverso la serra) contro la luce che gli arriva (S/4)
  const S0 = p.Lw / (4 * Math.PI * p.aM ** 2), emesso = (K.sigma * cl.Tglobale ** 4) / (1 + 0.75 * p.clima.tau);
  return { nome, x, p, chiave, sf, cl, senzAria, volume, sommerso: sommerso / area, area, emessoSuArrivato: emesso / (S0 / 4) };
});
for (const s of SUPERFICI) console.log(`  · ${s.nome} (${s.x.n}/${s.x.gid}/${s.x.sid}/${s.p.id}): acqua «${s.p.clima.acqua.slice(0, 8)}», ${num(s.p.clima.pressione / 1e5)} bar, serra ${num(s.p.clima.tau)} · per fasce ${num(s.p.clima.T, 4)} K (mare atteso ${num(100 * s.p.clima.mare, 2)}%, ghiaccio ${num(s.p.clima.ghiaccio, 2)}) · sulla mappa ${num(s.senzAria.Tglobale, 4)} K (mare ${num(100 * s.sommerso, 2)}%, ghiaccio ${num(s.senzAria.ghiaccio, 2)})${s.cl.meteo ? ` · con i venti ${num(s.cl.Tglobale, 4)} K (nuvole ${num(s.cl.meteo.nuvoleMedie, 2)} contro ${num(s.p.clima.nuvole, 2)} attese, calore portato ${num(s.cl.meteo.diffusivita, 2)} contro ${num(s.p.clima.D, 2)})` : ''}`);

prova('il mare sulla mappa contiene proprio l\'acqua che l\'interno dà alla superficie, anche quando copre tutto (i mondi ghiacciati: un guscio)', () => {
  let n = 0, gusci = 0;
  for (const s of SUPERFICI) {
    if (!(s.p.interno.acquaKg > 0) || s.p.clima.acqua.startsWith('vapore')) continue; n++;
    __M.tra("506.0", s.volume / (s.p.interno.acquaKg / 1000), 0.98, 1.02, `${s.nome}: volume del mare / acqua dell'interno`);
    if (s.p.tipo === 'ghiacciato') { gusci++; __M.eq("507.0", s.sommerso, 1, `${s.nome}: il guscio copre tutto`); __M.tra("507.1", s.cl.ghiaccio, s.cl.Tglobale < 250 ? 0.99 : 0, 1, `${s.nome}: ghiaccio`); }
  }
  __M.ok("509.0", n >= 3 && gusci >= 1);
});

prova('lo stato dell\'acqua decide se c\'è mare: dove per il clima è vapore (o non c\'è) la mappa è asciutta, e non piove', () => {
  let asciutti = 0;
  for (const s of SUPERFICI) {
    const cE = s.p.interno.acquaKg > 0 && !s.p.clima.acqua.startsWith('vapore') && s.p.clima.acqua !== 'assente';
    __M.eq("516.0", Number.isFinite(s.sf.mare), cE, `${s.nome}: acqua «${s.p.clima.acqua}», livello del mare ${s.sf.mare}`);
    if (!cE) { asciutti++; __M.eq("517.0", s.sommerso, 0); __M.eq("517.1", s.cl.piove, false); __M.eq("517.2", s.cl.ghiaccio, 0); }
  }
  __M.ok("519.0", asciutti >= 1, 'nel campione non c\'è un pianeta dove l\'acqua è vapore');
});

prova('la crosta non è più vecchia del pianeta, e la crosta continentale si conserva', () => {
  const s = SUPERFICI.find((q) => q.p.interno.tettonica === 'a placche') || SUPERFICI[0], int = s.p.interno;
  const tt = TE.evolviTettonica({ W: 64, H: 32, raggioM: s.p.raggioM, nucleo: int.nucleo, q: int.q, eta: int.eta, acqua: true, seme: s.p.origine, placche: int.tettonica === 'a placche' });
  let vecchia = 0; for (const v of tt.etaCrosta) vecchia = Math.max(vecchia, v);
  __M.ok("526.0", vecchia * 1e6 <= int.eta * (1 + 1e-6) /* (l'età della crosta è in un Float32: sette cifre) */, `crosta di ${vecchia} milioni di anni su un pianeta di ${int.eta / 1e6}`);
  __M.tra("527.0", tt.storia.simulati + tt.storia.saltati, int.eta * (1 - 1e-6), int.eta * (1 + 1e-6), 'anni simulati + saltati = età');
  __M.tra("528.0", tt.bilancio.prodotta - tt.bilancio.presente - tt.bilancio.inViaggio, -1, 1, 'crosta prodotta − presente − in viaggio (m)');
});

prova('le tessere: la stessa parte di mare, lo stesso livello e gli stessi continenti della madre', () => {
  const s = SUPERFICI.find((q) => q.sommerso > 0.1 && q.sommerso < 0.95) || SUPERFICI[0], se = GE.erosione(s.chiave, s.sf, s.cl), { W, H } = se;
  const pezzo = (L, tx, ty, f) => { const n = 4 ** L; let a = 0, c = 0; for (let j = Math.floor((ty / n) * H); j < Math.floor(((ty + 1) / n) * H); j++) for (let i = Math.floor((tx / n) * W); i < Math.floor(((tx + 1) / n) * W); i++) { a += f(j * W + i); c++; } return a / c; };
  for (const [L, tx, ty] of [[1, 1, 2], [1, 3, 1], [2, 5, 6]]) {
    const t = GE.tessera(s.chiave, se, s.cl, L, tx, ty, s.p.origine); let mare = 0, cont = 0, quota = 0;
    for (let c = 0; c < W * H; c++) { if (t.alt[c] < t.mare) mare++; cont += t.cont[c]; quota += t.alt[c]; }
    __M.eq("537.0", t.mare, se.mare);
    __M.tra("538.0", mare / (W * H) - pezzo(L, tx, ty, (c) => (se.alt[c] < se.mare ? 1 : 0)), -0.1, 0.1, 'parte di mare: tessera − madre');
    __M.tra("539.0", cont / (W * H) - pezzo(L, tx, ty, (c) => se.cont[c]), -0.02, 0.02, 'parte di continente: tessera − madre');
    __M.tra("540.0", quota / (W * H) - pezzo(L, tx, ty, (c) => se.alt[c]), -250, 250, 'quota media: tessera − madre (m)');
  }
});

prova('il clima simulato conserva l\'energia: a regime il pianeta irradia quanta luce assorbe, e mai più di quanta ne arriva', () => {
  for (const s of SUPERFICI) {
    const b = s.cl.bilancio;
    __M.tra("547.0", b.irradiata / b.assorbita, 0.97, 1.03, `${s.nome}: luce irradiata / assorbita`);
    __M.ok("548.0", b.assorbita <= b.arriva && b.assorbita > 0.2 * b.arriva, `${s.nome}: assorbe ${b.assorbita} W/m² su ${b.arriva}`);
    // la media delle quarte potenze non è mai sotto la quarta potenza della media: da Tglobale un minimo di ciò che irradia
    __M.ok("550.0", s.emessoSuArrivato <= (b.assorbita / b.arriva) * 1.03, `${s.nome}: a ${s.cl.Tglobale} K irradierebbe ${s.emessoSuArrivato} volte la luce che arriva`);
  }
});

prova('la temperatura ha una fonte sola: clima() è il bilancio per fasce, e la mappa (la stessa legge, più fine) dà la stessa media', () => {
  let n = 0;
  for (const x of SOLIDI) {
    const c = x.p.clima; n++;
    // clima() porta con sé ciò che la mappa deve condividere, e il suo bilancio torna
    __M.ok("559.0", c.tau >= 0 && c.D > 0 && c.Tavvio > 0 && c.mare >= 0 && c.mare <= 1 && c.fasce.T.length === c.fasce.lat.length, 'clima() senza i pezzi della legge');
    if (c.bilancio.arriva > 1e-3) __M.tra("560.0", c.bilancio.irradiata / c.bilancio.assorbita, 0.95, 1.05, `clima() a ${x.p.aM / UA} UA: luce irradiata / assorbita`);
    __M.tra("561.0", c.albedo, 0.05, 0.7, 'albedo'); __M.tra("561.1", c.Teq / LG.temperaturaEquilibrio(x.p.Lw, x.p.aM, c.albedo), 1 - 1e-9, 1 + 1e-9, 'Teq');
  }
  __M.ok("563.0", n > 1500);
  // le due risoluzioni: una colonna per parallelo contro 64 × 32 celle con terre e mari veri (senza i venti)
  for (const s of SUPERFICI) {
    const d = s.senzAria.Tglobale - s.p.clima.T, mareDiverso = Math.abs(s.sommerso - s.p.clima.mare) > 0.1;
    // entro 6 K (o il 3%); di più solo dove la mappa ha molta più o molta meno terra di quella attesa, e si sa perché
    __M.ok("568.0", Math.abs(d) < Math.max(6, 0.03 * s.p.clima.T) || mareDiverso, `${s.nome}: per fasce ${s.p.clima.T} K, sulla mappa ${s.senzAria.Tglobale} K`);
    if (!mareDiverso) __M.tra("569.0", s.senzAria.ghiaccio - s.p.clima.ghiaccio, -0.25, 0.25, `${s.nome}: ghiaccio sulla mappa − per fasce`);
  }
});

{ // ciò che la mappa ha in più: dove sono le terre, e i venti e le nuvole veri di meteo.js
  const conVenti = SUPERFICI.filter((s) => s.cl.meteo), dT = conVenti.map((s) => s.cl.Tglobale - s.p.clima.T), dMappa = SUPERFICI.map((s) => s.senzAria.Tglobale - s.p.clima.T);
  // (gravità 2 da quando i giri con l'aria sono tre: un mare che per clima() è liquido può uscire dalla mappa gelato)
  const gelati = conVenti.filter((s) => s.p.clima.acqua === 'liquida' && s.cl.Tglobale < 260), nuv = conVenti.filter((s) => s.p.clima.mare > 0.5).map((s) => s.cl.meteo.nuvoleMedie ?? mediaDi(s.cl.meteo.nuvole));
  nota(2, 'con i venti e le nuvole veri (meteo.js, fino a tre giri sulla mappa) la temperatura media si scosta da quella di clima(): le nuvole non sono quelle attese (clima() le conta 0,63 del cielo per 0,30 di luce rimandata dove c\'è mare; meteo.js dà loro lo spessore dell\'acqua che tengono, e sui mondi coperti d\'acqua ne esce meno luce rimandata: la mappa è più calda) e il calore portato non è 0,6·√p. Lo stato dell\'acqua e l\'aria restano quelli di clima(): dove la mappa gela un mare che clima() dice liquido i due si contraddicono',
    { casi: dT.filter((d) => Math.abs(d) > 6).length, su: conVenti.length, tipico: `con i venti − clima(): ${dT.map((d) => `${num(d)} K`).join(', ')}; mari «liquidi» per clima() e sotto 260 K sulla mappa: ${gelati.length} (${gelati.map((s) => `${s.nome}: ${num(s.cl.Tglobale)} K`).join('; ') || 'nessuno'}); nuvole sui mondi con mare: ${nuv.map((x) => num(x, 2)).join(', ')}`, massimo: `${num(massimo(dT.map(Math.abs)))} K; senza i venti la mappa si scosta al più di ${num(massimo(dMappa.map(Math.abs)))} K`, dove: 'geologia.js climaSuperficie() (meteo.nuvole, meteo.diffusivita) contro leggi.js nuvoleAttese(), trasportoCalore()' });
}

// =====================================================================================================
sezione('LE SCALE');
// =====================================================================================================
prova('il metro: sul pianeta l\'unità è il suo raggio, sulla superficie il giro dell\'equatore, e la regione è larga 0,32 raggi', () => {
  for (const x of PIANETI.filter((_, i) => i % 131 === 0)) {
    const via = { cosmo: x.n, galassia: x.gid, stella: x.sid, pianeta: x.p.id };
    __M.eq("587.0", CO.metriPerUnita(3, via), x.p.raggioM); __M.eq("587.1", CO.metriPerUnita(4, via), 2 * Math.PI * x.p.raggioM);
    __M.eq("588.0", CO.regione({ ...via, regione: 5 }).cella.scala.latoM, CO.LATO_REGIONE * x.p.raggioM);
    __M.tra("589.0", (x.p.a * CO.metriPerUnita(2, via)) / x.p.aM, 1 - 1e-12, 1 + 1e-12, 'orbita sulla mappa del sistema, in metri');
  }
  __M.eq("591.0", CO.metriPerUnita(0, { cosmo: 1 }), CO.TORO_M);
});

{ // le scale tra un livello e l'altro: ora sono quelle vere
  const rG = []; for (const n of [1, 2]) for (const G of CO.cosmo(n).galassie) rG.push((G.r * CO.metriPerUnita(0, { cosmo: n })) / CO.metriPerUnita(1, { cosmo: n, galassia: G.id }));
  const rS = GALASSIE.map(({ n, gid }) => (CO.raggioSistema(n, gid) * CO.metriPerUnita(1, { cosmo: n, galassia: gid })) / CO.metriPerUnita(2, {}));
  const conPianeti = SISTEMI.filter((s) => s.S.pianeti.length), rSt = conPianeti.map((s) => (s.S.stella.r * 30 * UA) / (s.viva ? ST.stella(s.S0.massa, { Z: s.S0.Z, eta: s.S0.eta }).R * RSOLE : s.S0.raggioM)), rP = PIANETI.map(({ p }) => (p.r * 30 * UA) / p.raggioM);
  prova('le scale sono vere a ogni livello: una galassia nel cosmo e un sistema nella galassia sono grandi quanto sono', () => {
    __M.tra("599.0", minimo(rG), 1 - 1e-12, 1 + 1e-12, 'galassia nel cosmo: disegnata / vera'); __M.tra("599.1", massimo(rG), 1 - 1e-12, 1 + 1e-12, 'galassia nel cosmo'); __M.tra("599.2", minimo(rS), 1 - 1e-12, 1 + 1e-12, 'sistema nella galassia: disegnato / vero'); __M.tra("599.3", massimo(rS), 1 - 1e-12, 1 + 1e-12, 'sistema nella galassia');
    // i numeri bastano: a 10⁻⁸ della galassia un sistema ha ancora otto cifre buone (le posizioni delle stelle hanno sedici cifre)
    for (const { n, gid, Gx } of GALASSIE) { const rs = CO.raggioSistema(n, gid); __M.tra("601.1", rs, 1e-10, 1e-6, 'un sistema nelle unità della galassia'); for (const s of Gx.stelle.filter((_, i) => i % 250 === 0)) __M.ok("601.0", (s.pos[0] + rs) - s.pos[0] > 0.999 * rs && (s.pos[0] + rs) - s.pos[0] < 1.001 * rs, 'la posizione di una stella più il raggio del suo sistema: la differenza si è persa'); }
  });
  prova('sulla mappa del sistema stella e pianeti hanno il raggio vero: nessun pianeta è disegnato dentro la stella, nessuna orbita ne tocca un\'altra', () => {
    __M.tra("604.0", mediana(rSt), 0.999, 1.001, 'raggio disegnato della stella / vero'); __M.tra("604.1", mediana(rP), 0.999, 1.001, 'raggio disegnato del pianeta / vero'); __M.tra("604.2", massimo(rP), 0.999, 1.001, 'pianeta'); 
    __M.eq("605.0", PIANETI.filter((x) => x.p.a < x.S.stella.r + x.p.r).length, 0, 'pianeti dentro il disco della stella');
    for (const s of conPianeti) for (let i = 0; i + 1 < s.S.pianeti.length; i++) __M.ok("606.0", s.S.pianeti[i + 1].a - s.S.pianeti[i].a > s.S.pianeti[i].r + s.S.pianeti[i + 1].r, 'due pianeti vicini si toccano');
  });
}
{ // i numeri della biblioteca: quanti sono alias di un altro numero
  const tot = CO.REGIONI * CO.PIANETI_MAX * CO.STELLE * CO.GALASSIE_MAX, N = 400; let alias = 0, chiusi = 0;
  for (let i = 0; i < N; i++) { const numero = 1 + Math.floor(((i * 0.6180339887) % 1) * tot), a = CO.indirizzoDi(numero); if (CO.numeroDi(a) !== numero) alias++; if (foto(CO.indirizzoDi(CO.numeroDi(a))) === foto(a)) chiusi++; }
  prova('numero → indirizzo → numero → indirizzo torna allo stesso luogo', () => __M.eq("612.0", chiusi, N));
  nota(3, 'numeri diversi della biblioteca sono lo stesso luogo (il resto della divisione per i pianeti e le galassie che ci sono davvero)',
    { casi: alias, su: N, dove: 'cosmo.js indirizzoDi() «slot % S.pianeti.length», «gslot % C.galassie.length», e il salto delle stelle senza pianeti' });
}

// le regioni: la nebbia, i raggi cosmici, le bolle dello zoom, le particelle
const REGIONI = [];
for (const x of PIANETI.filter((_, i) => i % 103 === 0)) for (const regione of [1, 8]) { const a = { cosmo: x.n, galassia: x.gid, stella: x.sid, pianeta: x.p.id, regione }; REGIONI.push({ a, p: x.p, cella: CO.regione(a).cella }); }

{ // i conteggi veri della nebbia contro lo schermo magnetico e contro il massimo della fascia
  let schermate = 0, pieneLoStesso = 0; const sogliaStormer = (p, r) => ((14.9 / (3.1e-5 * 6.371e6)) * p.B0 * p.raggioM) / (r * r);
  for (const { p, cella } of REGIONI) {
    const GV = 0.3 * sogliaStormer(p, cella.scala.r), Emin = Math.max(500, Math.sqrt((GV * 1000) ** 2 + 938.27 ** 2) - 938.27), schermo = Math.min(1, (Emin / 500) ** -1.7), cv = NE.conteggioVero(cella);
    if (schermo < 0.9) { schermate++; if (cv.raggi >= 1.7e-4 * cella.scala.latoM ** 2 * 0.99) pieneLoStesso++; }
  }
  nota(3, 'il conteggio «vero» dei raggi cosmici di una regione è o tutto o niente: il flusso pieno (1,7·10⁻⁴ per m³) anche dove la magnetosfera ne lascia passare una parte (e la regione ne disegna in proporzione), zero solo dove non ne è disegnato nessuno',
    { casi: pieneLoStesso, su: schermate, tipico: `regioni in parte schermate nel campione: ${schermate} su ${REGIONI.length}`, dove: 'nebbia.js conteggioVero() «raggi = 1.7e-4 * V» contro cosmo.js regione() «voluti = … (Emin / 500) ** -1.7»' });
  // (era una nota: il «massimo» della fascia, 0,17 scritto in tre posti, non era il massimo di fascia(). Ora è calcolato in
  // cosmo.js (FASCIA_MAX = 1/(4·1,12), il massimo analitico) e nebbia.js lo legge da lì: è una prova)
  let fmax = 0, rmax = 0; for (let r = 1.15; r < 8; r += 0.001) { const f = CO.fascia({ B0: 3.1e-5, raggioM: 6.371e6 }, { densitaAnello: () => 0 }, r); if (f > fmax) { fmax = f; rmax = r; } }
  prova('il massimo della fascia di radiazione è quello di fascia(): calcolato una volta in cosmo.js, letto da nebbia.js', () => {
    __M.tra("633.0", fmax / CO.FASCIA_MAX, 1 - 1e-5, 1 + 1e-5, `massimo vero ${fmax} a ${rmax} raggi contro FASCIA_MAX`); __M.tra("633.1", rmax, 2.23, 2.25, 'dove sta il massimo (raggi)');
    __M.ok("634.0", !/0\.17\b/.test(readFileSync(new URL('../src/camera/nebbia.js', import.meta.url), 'utf8')) && !/FASCIA_MAX = 0\.17/.test(readFileSync(new URL('../src/camera/cosmo.js', import.meta.url), 'utf8')), 'un 0,17 scritto a mano in cosmo.js o nebbia.js');
  });
  { const lab = readFileSync(new URL('../src/camera/laboratorio.js', import.meta.url), 'utf8'), resta = (lab.match(/fasciaDi\([^)]*\) \/ 0\.17/g) || []).length;
    nota(3, 'laboratorio.js (disegnaNebbiaRegione) divide ancora la fascia per 0,17 scritto a mano invece che per FASCIA_MAX di cosmo.js', { casi: resta, su: 1, tipico: `massimo vero ${num(fmax)} = ${num(fmax / 0.17)} volte 0,17`, dove: 'laboratorio.js «fasciaDi(P, Pl, r) / 0.17» contro cosmo.js FASCIA_MAX' }); }
}

{ // le bolle dello zoom: dieci volte più vicino, le stesse particelle sulla stessa strada
  let bolle = 0, particelle = 0, doppie = 0, nateQui = 0, rinate = 0; const scartiEntrate = [], scartiNate = [];
  const quadratino = (tracce, cella) => { // quello dove c'è un decadimento mentre la bolla dura, o il più attraversato
    const te = cella.tempo / 10, qui = (d) => d.t < 0.8 * te && d.pos[0] > 0 && d.pos[0] < 1000 && d.pos[1] > 0 && d.pos[1] < 1000, dec = tracce.decadimenti.find((d) => qui(d) && d.specie === 'protone') || tracce.decadimenti.find(qui); if (dec) return [Math.floor(dec.pos[0] / 100), Math.floor(dec.pos[1] / 100)];
    const conta = new Map(); for (const t of tracce) for (const q of t.punti) if (q[2] && q[3] <= te && q[0] > 0 && q[0] < 1000 && q[1] > 0 && q[1] < 1000) { const k = `${Math.floor(q[0] / 100)},${Math.floor(q[1] / 100)}`; conta.set(k, (conta.get(k) || 0) + 1); }
    const [primo] = [...conta.entries()].sort((x, y) => y[1] - x[1]); return primo ? primo[0].split(',').map(Number) : null;
  };
  const confronta = (padre, tp, a, zoom) => {
    const [i, j] = zoom.at(-1), figlia = CO.cellaDi({ ...a, zoom }), tf = simulaMondo(figlia), eventi = new Map(tp.filter((t) => t.evento).map((t) => [t.evento, t]));
    const te = padre.tempo / 10, attese = new Set();
    for (const t of tp) for (const q of t.punti) if (q[2] && q[3] <= te && q[0] > i * 100 && q[0] < i * 100 + 100 && q[1] > j * 100 && q[1] < j * 100 + 100) attese.add(t.evento);
    // nella bolla: quelle che vi entrano (le sorgenti) e quelle che vi nascono dai decadimenti (le tracce); «z<livello>.…» è il dettaglio fine, solo suo
    const sua = `z${zoom.length}.`, vere = tf.filter((t) => t.evento && !String(t.evento).startsWith(sua)), dentro = new Set([...figlia.sorgenti.map((s) => String(s.ev)).filter((e) => !e.startsWith(sua)), ...vere.map((t) => String(t.evento))]); bolle++;
    for (const e of dentro) __M.ok("653.0", eventi.has(e), `nella bolla c'è ${e}, che nel padre non c'è`);
    for (const e of attese) __M.ok("654.0", dentro.has(e), `la particella ${e} attraversa il quadratino ma nella bolla manca`);
    // la stessa particella due volte nello stesso istante?
    const perEvento = new Map(); for (const t of vere) (perEvento.get(t.evento) || perEvento.set(t.evento, []).get(t.evento)).push([t.punti[0][3], t.punti.at(-1)[3]]);
    for (const tratti of perEvento.values()) { tratti.sort((x, y) => x[0] - y[0]); for (let k = 1; k < tratti.length; k++) if (tratti[k][0] < tratti[k - 1][1] - 1e-6) doppie++; }
    for (const t of vere) {
      const m = eventi.get(t.evento), src = t.madre == null ? figlia.sorgenti[t.sorgente] : null; particelle++; if (t.madre != null) rinate++; let peggio = 0;
      for (const q of t.punti) { const T = q[3] / 10, X = q[0] / 10 + i * 100, Y = q[1] / 10 + j * 100, Q = m.punti; for (let k = 1; k < Q.length; k++) { const A = Q[k - 1], B = Q[k]; if (A[3] <= T && B[3] >= T) { const f = (T - A[3]) / (B[3] - A[3] || 1); peggio = Math.max(peggio, Math.hypot(A[0] + (B[0] - A[0]) * f - X, A[1] + (B[1] - A[1]) * f - Y)); break; } } }
      // «nata qui» da una madre che non lascia traccia (t0 = nascita), o entrata dal bordo o nata da un decadimento rifatto nella bolla
      if (src && src.t0 === src.nascita && src.generazione > 0) { nateQui++; scartiNate.push(peggio); } else scartiEntrate.push(peggio);
    }
    return { figlia, tf };
  };
  const anelli = []; for (const x of PIANETI) { if (anelli.length >= 16) break; const R = CO.pianeta(x.n, x.gid, x.sid, x.p.id).regioni.find((r) => r.nellAnello); if (R && x.p.id % 3 === 0) anelli.push({ a: { cosmo: x.n, galassia: x.gid, stella: x.sid, pianeta: x.p.id, regione: R.id } }); }
  prova('le bolle dello zoom contengono le particelle del padre, e solo quelle, ognuna una volta sola; fanno la stessa strada (anche al secondo livello)', () => {
    for (const { a } of [...REGIONI.filter((_, k) => k % 4 === 0).slice(0, 5), ...anelli]) {
      const cella = CO.cellaDi(a), tp = simulaMondo(cella), ij = quadratino(tp, cella); if (!ij) continue;
      const { figlia, tf } = confronta(cella, tp, a, [ij]), ij2 = bolle < 24 ? quadratino(tf, figlia) : null;
      if (ij2) confronta(figlia, tf, a, [ij, ij2]);
    }
    __M.ok("673.0", bolle >= 8 && particelle >= 10, `${bolle} bolle, ${particelle} particelle`);
    // le cascate rifatte dentro la bolla (le figlie nate lì da un urto o da un decadimento) non devono esserci anche come sorgenti
    __M.ok("675.0", rinate >= 5, `solo ${rinate} particelle nate dentro le bolle: il campione non prova niente`); __M.eq("675.1", doppie, 0, 'la stessa particella due volte nello stesso istante');
    // (il padre fa passi dieci volte più lunghi: la strada è la stessa entro un ventesimo della bolla, e per quasi tutte molto meno)
    const tutti = [...scartiEntrate, ...scartiNate];
    __M.ok("678.0", massimo(tutti) < 5, `la strada nella bolla si scosta da quella del padre di ${massimo(tutti)} unità su 1000`);
    __M.ok("679.0", mediana(tutti) < 0.1, `scarto mediano ${mediana(tutti)} unità su 1000`);
  });
  console.log(`  · ${bolle} bolle, ${particelle} tratti di particelle: scarto dalla strada del padre mediano ${num(mediana(scartiEntrate))}, massimo ${num(massimo(scartiEntrate))} unità su 1000; nate dentro le bolle ${rinate}, messe come «nate qui» da madre invisibile ${nateQui}, doppie ${doppie}`);
  nota(3, 'zoom: le particelle che girano strette nel campo (elettroni, protoni lenti) nella bolla fanno una strada un po\' diversa da quella del padre: partono con la velocità della corda dell\'ultimo passo del padre, e i passi del padre sono dieci volte più lunghi',
    { casi: [...scartiEntrate, ...scartiNate].filter((d) => d > 0.5).length, su: particelle, tipico: `scarto mediano ${num(mediana([...scartiEntrate, ...scartiNate]))} unità del padre (lato 1000; la bolla è larga 100)`, massimo: `${num(massimo([...scartiEntrate, ...scartiNate]))} unità; tra le ${nateQui} nate nella bolla da madre invisibile: mediana ${num(mediana(scartiNate))}`, dove: 'cosmo.js cellaDi() «entra(…, (b[0] - a0[0]) / dt, …)» e mondo.js simulaMondo() (passoMax uguale ai due livelli)' });
}

// =====================================================================================================
sezione('LE PARTICELLE');
// =====================================================================================================
{
  // Le regioni del cosmo sono relativistiche: ogni decadimento e ogni urto registra il quadrivettore di prima
  // («prima», più il bersaglio fermo se c'è) e quelli di tutte le figlie («prodotti», anche le invisibili: neutrini,
  // nucleone e nucleo colpiti), in masse dell'elettrone con c = 1. Qui si rifà la somma.
  const anello = [];
  for (const x of PIANETI) { if (anello.length >= 10) break; const Pl = CO.pianeta(x.n, x.gid, x.sid, x.p.id), R = Pl.regioni.find((r) => r.nellAnello); if (R && x.p.id % 2 === 0) anello.push({ cosmo: x.n, galassia: x.gid, stella: x.sid, pianeta: x.p.id, regione: R.id }); }
  let eventi = 0, senzaBilancio = 0, raggi = 0, veloci = 0; const scartoE = [], scartoP = [], scartoQ = [], scartoNascita = [], canali = {}, gamme = [];
  for (const cella of [...anello.map((a) => CO.regione(a).cella), ...REGIONI.slice(0, 8).map((r) => r.cella)]) {
    const tr = simulaMondo(cella), perEvento = new Map(tr.filter((t) => t.evento).map((t) => [t.evento, t])), q = (nome) => { const sp = cella.specie[nome]; return sp.luce ? 0 : sp.q ?? 0; };
    // un raggio cosmico ha l'energia con cui è stato sorteggiato, anche sopra 5,7 GeV (γ = 1 + E/938 MeV)
    for (const t of tr) if (t.madre == null && t.specie.nome === 'protone' && cella.sorgenti[t.sorgente].energia) { raggi++; if (t.gamma > 7.1) veloci++; gamme.push(Math.abs(t.gamma / (1 + cella.sorgenti[t.sorgente].energia / 938.27) - 1)); }
    for (const d of tr.decadimenti) {
      if (!d.prodotti) { senzaBilancio++; continue; } eventi++;
      const M = d.bersaglio ? cella.specie[d.bersaglio].m : 0, e0 = d.prima.e + M; let e = 0, px = 0, py = 0, carica = 0;
      for (const f of d.prodotti) { e += f.e; px += f.x; py += f.y; carica += q(f.specie); __M.ok("703.0", f.e >= (cella.specie[f.specie].luce ? 0 : cella.specie[f.specie].m) * (1 - 1e-12)); }
      scartoE.push(Math.abs(e - e0) / e0); scartoP.push(Math.hypot(px - d.prima.x, py - d.prima.y) / e0); scartoQ.push(Math.abs(carica - q(d.specie) - (d.bersaglio ? q(d.bersaglio) : 0)));
      const nome = `${d.specie} → ${d.prodotti.map((f) => f.specie).join(' + ')}`; canali[nome] = (canali[nome] || 0) + 1;
      // le figlie che si vedono partono davvero con quell'energia e in quella direzione
      d.prodotti.forEach((f, k) => { const t = perEvento.get(`${d.evento}.${k}`); if (!t || !t.gamma || t.punti.length < 2) return; const A = t.punti[0], B = t.punti[1];
        scartoNascita.push(Math.abs((t.gamma * t.specie.m) / f.e - 1)); let da = Math.atan2(B[1] - A[1], B[0] - A[0]) - Math.atan2(f.y, f.x); da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); __M.ok("708.0", da < 0.1, `una figlia parte a ${da} rad dalla sua direzione`); });
    }
  }
  console.log(`  · ${eventi} decadimenti e urti: ${Object.entries(canali).map(([k, n]) => `${n} ${k}`).join('; ')}`);
  prova('in ogni decadimento e in ogni urto si conservano la carica, l\'energia e la quantità di moto (cinematica vera, con la relatività)', () => {
    __M.ok("713.0", eventi >= 100, `solo ${eventi} eventi nel campione`); __M.eq("713.1", senzaBilancio, 0, 'eventi senza cinematica vera');
    __M.eq("714.0", massimo(scartoQ), 0, 'carica');
    __M.ok("715.0", massimo(scartoE) < 1e-9, `energia: scarto ${massimo(scartoE)}`); __M.ok("715.1", massimo(scartoP) < 1e-9, `impulso: scarto ${massimo(scartoP)}`);
    __M.ok("716.0", scartoNascita.length > 100 && massimo(scartoNascita) < 1e-9, `energia alla nascita: scarto ${massimo(scartoNascita)}`);
    for (const nome of ['pione+ → muone+ + neutrino', 'pione0 → fotone + fotone', 'fotone → elettrone + positrone + nucleo']) __M.ok("717.0", canali[nome] > 0, `non si è visto ${nome}`);
  });
  prova('nessun tetto alla velocità: un raggio cosmico tiene tutta l\'energia con cui arriva (γ anche oltre 7)', () => {
    __M.ok("720.0", raggi > 100 && veloci > 0, `${raggi} raggi, ${veloci} oltre γ = 7,1`); __M.ok("720.1", massimo(gamme) < 1e-5, `γ del raggio contro la sua energia: ${massimo(gamme)}`);
  });
}

// =====================================================================================================
sezione('IL DETERMINISMO');
// =====================================================================================================
prova('lo stesso indirizzo, ricalcolato in ordine inverso dopo aver visitato altri cosmi e svuotato le memo, dà lo stesso identico risultato', () => {
  const scelti = SISTEMI.filter((_, i) => i % 9 === 0), prima = scelti.map((s) => foto(CO.sistema(s.n, s.gid, s.sid))), primaStelle = scelti.map((s) => foto(CO.galassia(s.n, s.gid).stelle[s.sid]));
  const r = REGIONI[3], primaRegione = foto(r.cella), primaPianeta = foto(CO.pianeta(r.a.cosmo, r.a.galassia, r.a.stella, r.a.pianeta).regioni), primaNebbia = foto(NE.nebbiaPianeta(r.a.cosmo, r.a.galassia, r.a.stella, r.a.pianeta).fascia.slice(0, 40));
  const primaTracce = foto(simulaMondo(r.cella).map((t) => t.punti.at(-1)));
  // altrove: più di 64 cosmi, galassie e sistemi diversi (le memo di cosmo.js tengono 64 voci), e altre nebbie
  for (let n = 3; n < 70; n++) CO.cosmo(n);
  for (let g = 0; g < 68; g++) CO.galassia(3 + (g % 2), g % 30);
  for (let s = 0; s < 70; s++) { const S = CO.sistema(3, 1, s); if (S.pianeti.length && s < 8) { CO.pianeta(3, 1, s, 0); NE.nebbiaPianeta(3, 1, s, 0); CO.regione({ cosmo: 3, galassia: 1, stella: s, pianeta: 0, regione: s }); } }
  for (let i = scelti.length - 1; i >= 0; i--) { const s = scelti[i]; __M.eq("735.0", foto(CO.sistema(s.n, s.gid, s.sid)), prima[i], `il sistema ${s.n}/${s.gid}/${s.sid} è cambiato`); __M.eq("735.1", foto(CO.galassia(s.n, s.gid).stelle[s.sid]), primaStelle[i]); }
  const dopo = CO.regione(r.a).cella;
  __M.eq("737.0", foto(dopo), primaRegione); __M.eq("737.1", foto(simulaMondo(dopo).map((t) => t.punti.at(-1))), primaTracce);
  __M.eq("738.0", foto(CO.pianeta(r.a.cosmo, r.a.galassia, r.a.stella, r.a.pianeta).regioni), primaPianeta); __M.eq("738.1", foto(NE.nebbiaPianeta(r.a.cosmo, r.a.galassia, r.a.stella, r.a.pianeta).fascia.slice(0, 40)), primaNebbia);
});

prova('la superficie e il clima di un pianeta non dipendono da che cosa si è calcolato prima (né dalla chiave della memo)', () => {
  const s = SUPERFICI.find((q) => q.p.interno.tettonica !== 'a placche') || SUPERFICI[0];
  const sf = GE.superficiePianeta(`${s.chiave}|bis`, s.p, s.p.interno, s.p.origine), cl = GE.climaSuperficie(`${s.chiave}|bis`, s.p, sf);
  __M.ne("744.2", sf, s.sf); __M.eq("744.0", sf.mare, s.sf.mare); __M.eq("744.1", cl.Tglobale, s.cl.Tglobale);
  for (let c = 0; c < sf.alt.length; c += 7) __M.eq("745.0", sf.alt[c], s.sf.alt[c]);
  for (let c = 0; c < cl.media.length; c += 3) __M.eq("746.0", cl.media[c], s.cl.media[c]);
});

prova('il caso di ogni luogo dipende da tutto l\'indirizzo: stesso pianeta e stessa stella, altra galassia o altro cosmo, altro mondo', () => {
  const origini = new Set(PIANETI.map(({ p }) => p.origine)); __M.eq("750.0", origini.size, PIANETI.length, 'due pianeti del campione partono dallo stesso mantello');
  // lo stesso numero di stella e di pianeta in galassie e cosmi diversi
  const visti = { regioni: new Set(), nebbie: new Set(), lune: new Set(), fasi: new Set() }; let n = 0, conNebbia = 0;
  for (const [cosmo, galassia] of [[1, 0], [1, 1], [2, 0], [2, 1], [3, 0]]) for (const sid of [3, 4, 5]) {
    const S = CO.sistema(cosmo, galassia, sid); if (!S.pianeti.length) continue; n++;
    visti.regioni.add(foto(CO.pianeta(cosmo, galassia, sid, 0).regioni.map((r) => r.angolo))); visti.fasi.add(S.pianeti[0].fase); visti.lune.add(foto(S.pianeti.map((p) => p.lune.map((l) => l.massaKg))));
    // (senza campo non c'è fascia; e i pianeti più interni, che girano piano e hanno il vento della stella addosso, spesso non ne hanno più:
    // si prende il primo pianeta del sistema che ne ha una)
    for (let pid = 0; pid < S.pianeti.length; pid++) { const nebbia = NE.nebbiaPianeta(cosmo, galassia, sid, pid).fascia; if (nebbia.length) { conNebbia++; visti.nebbie.add(foto(nebbia.slice(0, 5).map((q) => q.fi))); break; } }
  }
  __M.ok("760.0", n >= 8, `solo ${n} sistemi gemelli con pianeti`);
  __M.eq("761.0", visti.regioni.size, n, 'regioni uguali in luoghi diversi'); __M.eq("761.1", visti.fasi.size, n, 'fasi uguali in luoghi diversi'); __M.eq("761.2", visti.lune.size, n, 'lune uguali in luoghi diversi');
  __M.ok("762.0", conNebbia >= 2, `solo ${conNebbia} pianeti gemelli con una fascia`); __M.eq("762.1", visti.nebbie.size, conNebbia, 'nebbie uguali in luoghi diversi');
});

// =====================================================================================================
sezione('IL CASO NASCOSTO (lettura del codice)');
// =====================================================================================================
{
  const cartella = new URL('../src/camera/', import.meta.url), casuali = [], aMano = [];
  for (const file of readdirSync(cartella).filter((f) => f.endsWith('.js')).sort()) {
    readFileSync(new URL(file, cartella), 'utf8').split('\n').forEach((riga, i) => {
      const codice = riga.replace(/\/\/.*$/, '');
      if (/Math\.random\s*\(/.test(codice)) casuali.push(`${file}:${i + 1}`);
      // un seme costruito a mano: un numero fisso, o un'aritmetica su coordinate invece dell'indirizzo intero (semeEvento, hash, sorgente)
      const seme = codice.match(/\b(?:let|const)\s+(?:s|sd|seme)\s*=\s*([^;]+);/) || codice.match(/,\s*seme\s*=\s*(1\s*\+\s*Math\.floor[^;]+);/);
      if (seme && !/semeEvento|hash\(|sorgente\(|\bseme\s*%|Math\.random/.test(seme[1]) && (/16807/.test(codice) || /Math\.floor\(u/.test(seme[1]))) aMano.push(`${file}:${i + 1}  ${seme[1].trim().slice(0, 90)}`);
    });
  }
  prova('nessun Math.random nei moduli che calcolano l\'universo (solo nell\'interfaccia: laboratorio.js)', () => {
    const fuori = casuali.filter((r) => !r.startsWith('laboratorio.js')); __M.de("780.0", fuori, []);
  });
  nota(3, 'Math.random nell\'interfaccia (il dado della biblioteca, il seme della ricerca, un\'impronta): la ricerca «cerca bella» non è ripetibile',
    { casi: casuali.length, su: casuali.length, tipico: casuali.join(', '), dove: 'laboratorio.js' });
  prova('i semi della roccia, della pozza e della nebbia di una regione vengono dall\'indirizzo intero (semeEvento), non da un\'aritmetica sulle coordinate', () => {
    const leggi = (f) => readFileSync(new URL(f, cartella), 'utf8'), mappa = leggi('mappa.js'), pannello = leggi('laboratorio.js');
    __M.ok("786.0", /semeEvento\('roccia', cam\.via\.cosmo, cam\.via\.galassia, cam\.via\.stella, cam\.via\.pianeta,/.test(mappa), 'la roccia');
    __M.ok("787.0", /semeEvento\('pozza', v\.cosmo, v\.galassia, v\.stella, v\.pianeta\)/.test(pannello), 'la pozza');
    __M.ok("788.0", /semeEvento\('nebbia della regione', a\.cosmo, a\.galassia, a\.stella, a\.pianeta, a\.regione, JSON\.stringify\(a\.zoom/.test(pannello), 'la nebbia della regione');
    // resta, dichiarato, solo lo sfondo di stelline della mappa (un seme fisso: è una decorazione, uguale ovunque)
    __M.de("790.0", aMano.filter((r) => !/^mappa\.js:\d+ {2}7$/.test(r)), []);
    // e il seme di un luogo cambia con ogni parte dell'indirizzo, anche nei cosmi paralleli (dove «cosmo» è una scritta)
    const semi = new Set([[1, 0, 0, 0], [2, 0, 0, 0], [1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], ['1#{"disco/0/0":1}', 0, 0, 0]].map((v) => CO.semeEvento('pozza', ...v)));
    __M.eq("793.0", semi.size, 5, 'un ramo che non riguarda la pozza la lascia uguale; ogni altro cambio la cambia');
  });
  nota(3, 'lo sfondo di stelline della mappa ha un seme fisso (7): è lo stesso a ogni livello e in ogni cosmo, e non sono le stelle della galassia',
    { casi: aMano.length, su: aMano.length, tipico: aMano.join(' | '), dove: 'mappa.js fondoStelle' });
}

// =====================================================================================================
// LE INCOERENZE NOTE
// =====================================================================================================
NOTE.sort((a, b) => a.gravita - b.gravita);
const risolte = NOTE.filter((n) => n.casi === 0);
console.log(`\nINCOERENZE NOTE: ${NOTE.length - risolte.length} (non fanno fallire il test; 1 = grave, 2 = media, 3 = lieve o dichiarata)`);
for (const n of NOTE) {
  if (n.casi === 0) continue;
  const quanti = n.su ? `${n.casi} su ${n.su}${n.su >= 10 ? ` (${Math.round((100 * n.casi) / n.su)}%)` : ''}` : `${n.casi}`;
  console.log(`  ✗ [${n.gravita}] ${n.cosa}\n        casi: ${quanti}${n.tipico ? `\n        tipico: ${n.tipico}` : ''}${n.massimo ? `\n        massimo: ${n.massimo}` : ''}${n.dove ? `\n        dove: ${n.dove}` : ''}`);
}
for (const n of risolte) console.log(`  ○ zero casi su ${n.su}: «${n.cosa.slice(0, 90)}…» sembra risolta: toglila dalle note e falla diventare una prova`);
console.log(`\ncoerenza: ${ok} prove, tutto ok; ${NOTE.length - risolte.length} incoerenze note misurate${risolte.length ? `, ${risolte.length} forse risolte` : ''} (${((performance.now() - T0) / 1000).toFixed(0)} s)`);
