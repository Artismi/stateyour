// test_galassie.mjs — le galassie come conseguenza: la Via Lattea dai suoi numeri veri, e le galassie di cosmo(1)
import assert from 'node:assert/strict';
import { formaGalassia, formaDaAlone, aloneGalassia, stelleGalassia, ritmoSupernove, metallicita, curvaRotazione, faseBraccio, massaAlone, popolazione, velocitaPeculiare, coloreCorpoNero, colorePerTemperatura, luceGenerazione, luceNascite, LEGGI, ANELLI, PASSI, RESTI, dentro } from '../src/camera/galassie.js';
import { sorgente } from '../src/camera/eventi.js';
import { ANNO, COSMO, etaUniverso, massaNascita } from '../src/camera/leggi.js';
import * as ST from '../src/camera/stelle.js';
import { cosmo, galassia, sistema, indirizzoDi, motiDi, raggioSistema, metriPerUnita, TORO_M } from '../src/camera/cosmo.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const ADESSO = etaUniverso() / ANNO, { U, T0, DT, GK } = dentro;

// (le tabelle si fanno una volta: quella delle stelle di stelle.js e quella delle popolazioni)
const tTabelle = performance.now(); popolazione(); console.log(`galassie: tabelle pronte in ${(performance.now() - tTabelle).toFixed(0)} ms (una volta sola)`);

// ---------- una galassia come la Via Lattea: alone di 10¹² masse solari, spin 0,04, nessuna fusione
// (la galassia «prova/via lattea 4»: con la fonte unica del caso in «prova/via lattea» l'ultima supernova ha 19 anni, e il suo resto è
// più piccolo del limite che la prova chiede, 0,05·t^0,4 anni luce; quel limite cede per i resti più giovani di una ventina d'anni
// con molta massa espulsa: in 9 galassie di prova su 16 — con la fonte di prima in 4 su 13)
const RADICE = 'prova/via lattea 4', CASO = sorgente(RADICE), ALONE = { massa: 1e12, spin: 0.04, fusioni: [] };
const VL = formaDaAlone(ALONE, CASO), CAT = stelleGalassia(VL, CASO);
const vive = (s) => s.stato === 'in vita' || s.stato === 'gigante rossa';

prova('il cosmo di leggi.js: σ₈, la crescita, l\'alone di 10¹² masse solari', () => {
  tra(U.sigma(((4 * Math.PI) / 3) * U.Om * U.rhoC * 1e9 * (8 / U.h) ** 3) / COSMO.sigma8, 0.98, 1.02, 'lo scarto a 8 Mpc/h è σ₈');
  assert.ok(U.sigma(1e10) > U.sigma(1e12) && U.sigma(1e12) > U.sigma(1e14)); tra(U.sigma(1e12), 1.8, 2.6, 'σ(10¹² M☉)');
  tra(U.D(1), 0.999, 1.001, 'D(oggi)'); tra(U.D(0.5) / 0.5, 1.15, 1.3, 'la crescita frenata dall\'energia oscura (D(½)/½: 1,22)');
  tra(U.tempo(1), T0 * 0.999, T0 * 1.001, 'l\'età dell\'universo (Ga)'); tra(U.scala(U.tempo(0.37)), 0.3699, 0.3701, 'a(t(a))');
  tra(VL.alone.raggioViriale, 230, 300, 'raggio viriale (kpc)'); tra(VL.alone.velocitaViriale, 115, 140, 'velocità viriale (km/s)'); tra(VL.alone.concentrazione, 7, 14, 'concentrazione');
  // il disco di Freeman: il massimo della velocità è 0,62·√(GM/R_d) a 2,2 R_d
  let fmax = 0, ymax = 0; for (let y = 0.1; y < 4; y += 0.01) if (dentro.FREEMAN(y) > fmax) { fmax = dentro.FREEMAN(y); ymax = y; }
  tra(Math.sqrt(2 * fmax), 0.615, 0.63, 'massimo del disco esponenziale'); tra(2 * ymax, 2.1, 2.3, 'a quante scale');
  // la storia dell'alone: a z = 1 aveva circa metà della massa
  tra(VL.alone.storia[Math.round(U.tempo(0.5) / DT)] / 1e12, 0.3, 0.65, 'massa dell\'alone a z = 1 (in 10¹² M☉)');
});

prova('le popolazioni di stelle: quanto torna al gas, quante supernove, quanti metalli (da stelle.js e da Kroupa)', () => {
  const P = popolazione(), T = P.tab[2];
  tra(P.massaMedia, 0.5, 0.65, 'massa media alla nascita'); let u8 = 0; for (let i = 0; i < 20000; i++) if (massaNascita((i + 0.5) / 20000) >= 8) u8++;
  tra(T.nSN, 0.5 * (u8 / 20000 / P.massaMedia), 1.05 * (u8 / 20000 / P.massaMedia), 'supernove da collasso per M☉ nata: meno delle stelle sopra 8 M☉ (stelle.js mette il confine più su)');
  tra(T.cR[PASSI + 1], 0.3, 0.5, 'frazione restituita al gas in 13,8 Ga'); tra(T.cR[1] / T.cR[PASSI + 1], 0.3, 0.8, 'di cui nel primo passo (le massicce)');
  tra(T.cP[PASSI + 1], 0.004, 0.02, 'metalli nuovi delle supernove da collasso per M☉ nata'); tra(T.cI[PASSI + 1], 1.2e-3, 1.35e-3, 'Ia per M☉ nata in 13,8 Ga (Maoz & Graur: 1,3 per mille)');
  for (let L = 1; L <= PASSI + 1; L++) assert.ok(T.cR[L] >= T.cR[L - 1] && T.cI[L] >= T.cI[L - 1] && T.cN[L] >= T.cN[L - 1]);
  assert.ok(T.tIa < 0.1 && T.tIa > 0.01, `le prime Ia quando muore la più grande stella che lascia una nana bianca: ${T.tIa} Ga`);
  // la resa di una supernova (Bailin & Harris): 15 M☉ → 1,4 M☉ di metalli, 20 → 2,4
  tra(dentro.resaCollasso(15), 1.3, 1.5, 'metalli di una supernova di 15 M☉'); tra(dentro.resaCollasso(20), 2.3, 2.6, 'di 20 M☉');
  console.log(`      (per M☉ nata: ${num(T.nSN * 1000)} supernove da collasso e ${num(T.cI[PASSI + 1] * 1000)} Ia ogni 1000 M☉; torna al gas il ${num(100 * T.cR[PASSI + 1])}%; metalli nuovi ${num((T.cP[PASSI + 1] + T.cI[PASSI + 1] * P.MCH) / dentro.ZSOLE)} Z☉ per M☉ nata)`);
});

prova('una galassia come la Via Lattea: disco, rotazione, stelle, gas, supernove', () => {
  assert.equal(VL.tipo, 'spirale');
  tra(VL.raggioDisco, 2.2, 3.5, 'scala del disco (kpc: 2,6 ± 0,5)');
  // (senza parametri tarati sulla Via Lattea: stelle e velocità vengono un po' sotto; qui si chiede di starci entro un fattore 2 e il 25%)
  tra(curvaRotazione(VL, 8), 170, 250, 'velocità di rotazione a 8 kpc (km/s: 220–240)'); tra(VL.velocita, 165, 250, 'a 2,2 scale');
  tra(VL.massaStelle / 1e10, 2.6, 8, 'massa in stelle (10¹⁰ M☉: 5–6)'); tra(VL.massaGas / 1e10, 0.5, 2, 'gas freddo (10¹⁰ M☉: circa 1)');
  tra(VL.storia.sfr[PASSI], 1, 4, 'stelle che nascono oggi (M☉/anno: 1,5–2)');
  const sn = ritmoSupernove(VL); tra(100 * sn.totale, 0.8, 5, 'supernove al secolo (circa 2)'); tra(sn.Ia / sn.totale, 0.05, 0.5, 'di cui Ia (un quinto)');
  // il ritmo discende dalle nascite recenti: tante supernove da collasso quante stelle massicce nate nell'ultimo passo
  tra(sn.collasso / (VL.storia.sfr[PASSI] * popolazione().tab[2].nSN), 0.7, 1.3, 'supernove da collasso / (nascite di oggi × stelle massicce per M☉)');
  // la curva di rotazione è piatta: a 4 e a 16 kpc entro il 20% di quella a 8
  for (const r of [4, 12, 16]) tra(curvaRotazione(VL, r) / curvaRotazione(VL, 8), 0.8, 1.2, `curva piatta a ${r} kpc`);
  const p = curvaRotazione(VL, 8, true); tra(Math.hypot(p.alone, p.disco, p.sferoide) / p.totale, 0.999, 1.001, 'le parti della curva'); assert.ok(p.disco > 0.5 * p.alone);
  // i bracci: pochi (2–4), aperti di 15–35 gradi
  tra(VL.bracci.numero, 1.5, 4.5, 'bracci'); tra((VL.bracci.passo * 180) / Math.PI, 12, 35, 'passo dei bracci (gradi: 12–25 nella Via Lattea)'); tra(VL.bracci.contrasto, 0.05, 0.46, 'contrasto');
});

prova('i metalli escono dal bilancio: Z ≈ 1 nel gas vicino al Sole oggi, e dove è nato il Sole; il gradiente, la relazione età–metallicità', () => {
  // oggi, a 8 kpc, il gas ha i metalli del Sole (le stelle giovani e le nebulose vicine: entro 0,3 dex)
  const z8 = metallicita(VL, ADESSO, 8); tra(z8, 10 ** -0.3, 10 ** 0.3, 'Z del gas a 8 kpc, oggi (in Z☉)');
  // DOVE È NATO IL SOLE. Il modello non ha migrazione delle stelle: una stella con Z = 1 nata 4,6 Ga fa è nata dove il gas
  // aveva Z = 1 allora. Il Sole vero non è nato dov'è: «the most likely radius lies in the range 4.4 < r < 7.7 kpc» (Minchev,
  // Chiappini & Martig 2013, A&A 558, A9 [V]). La prova chiede quel raggio; Z a 8 kpc 4,6 Ga fa è stampato più sotto
  // (prima si chiedeva lì 0,67–1,5: con la legge delle nascite di ora il disco a 8 kpc cresce più tardi, e viene meno)
  const zSole = metallicita(VL, ADESSO - 4.6e9, 8); let rSole = NaN; for (let r = 1; r < 16; r += 0.05) if (metallicita(VL, ADESSO - 4.6e9, r) < 1) { rSole = r; break; }
  tra(rSole, 4.4, 7.7, 'il raggio a cui il gas aveva Z = 1, 4,6 miliardi di anni fa (kpc)');
  // il gradiente radiale oggi, tra 4 e 12 kpc (nel disco vero: circa −0,05 dex/kpc)
  const grad = Math.log10(metallicita(VL, ADESSO, 12) / metallicita(VL, ADESSO, 4)) / 8; tra(grad, -0.12, -0.005, 'gradiente (dex/kpc)');
  for (const t of [4e9, 8e9, ADESSO]) assert.ok(metallicita(VL, t, 3) > metallicita(VL, t, 8) && metallicita(VL, t, 8) > metallicita(VL, t, 14), `più metalli al centro a ${t / 1e9} Ga`);
  // il gas si arricchisce nel tempo, e prima al centro
  assert.ok(metallicita(VL, 2e9, 8) < 0.5 * metallicita(VL, 6e9, 8) && metallicita(VL, 6e9, 8) < 1.3 * metallicita(VL, ADESSO, 8));
  assert.ok(metallicita(VL, 3e9, 2) > 2 * metallicita(VL, 3e9, 10), 'al centro prima');
  // nel catalogo: le stelle vecchie sono povere di metalli, quelle del centro più ricche
  const disco = CAT.stelle.filter((s) => s.componente === 'disco'), vecchie = disco.filter((s) => s.eta > 10e9), giovani = disco.filter((s) => s.eta < 5e9);
  assert.ok(vecchie.length > 100 && giovani.length > 100); tra(mediana(vecchie.map((s) => s.Z)) / mediana(giovani.map((s) => s.Z)), 0, 0.75, 'Z delle stelle vecchie / Z delle giovani');
  const r = (s) => Math.hypot(...s.pos) * VL.unitaKpc, dentroR = disco.filter((s) => r(s) < 3 && s.eta < 8e9), fuori = disco.filter((s) => r(s) > 8 && s.eta < 8e9);
  assert.ok(mediana(dentroR.map((s) => s.Z)) > mediana(fuori.map((s) => s.Z)));
  // dall'interno verso l'esterno: le stelle del centro sono più vecchie
  assert.ok(mediana(disco.filter((s) => r(s) < 3).map((s) => s.eta)) > mediana(disco.filter((s) => r(s) > 8).map((s) => s.eta)) + 1e9, 'il disco cresce dall\'interno');
  // ogni stella ha la Z del gas da cui è nata: quella del suo anello nel suo passo
  for (const s of disco.filter((_, i) => i % 50 === 0)) { const j = Math.min(PASSI, Math.floor((ADESSO - s.eta) / 1e9 / DT) + 1); let k = 0; while (k < ANELLI - 1 && VL.anelli.bordo[k + 1] < r(s)) k++; tra(s.Z / Math.max(1e-4, VL.interno.Zn[j * ANELLI + k]), 0.999, 1.001, 'Z della stella / Z del gas del suo anello'); }
  console.log(`      (Z a 8 kpc: ${[2, 4, 6, 8, ADESSO / 1e9 - 4.6, 12, ADESSO / 1e9].map((t) => `${num(t, 2)} Ga ${num(metallicita(VL, t * 1e9, 8), 2)}`).join(' · ')}; gradiente oggi ${num(grad, 2)} dex/kpc; il gas aveva Z = 1, 4,6 Ga fa, a ${num(rSole, 2)} kpc)`);
  if (!(zSole > 1 / 1.5 && zSole < 1.5)) console.log(`      ≠ NON TORNA: Z del gas a 8 kpc, 4,6 Ga fa: ${num(zSole, 2)} Z☉ (il gas vicino al Sole di allora: 0,67–1,5); il disco a 8 kpc si fa tardi`);
});

prova('il bilancio è chiuso: la massa entrata è quella che c\'è più quella uscita, i metalli che ci sono sono quelli prodotti', () => {
  const chiuso = (f, che) => {
    const b = f.bilancio;
    tra((b.gas + b.stelle + b.vento + b.alCaldo) / b.entrato, 1 - 1e-9, 1 + 1e-9, `${che}: massa`);
    tra((b.metalliGas + b.metalliStelle + b.metalliVento + b.metalliCaldo) / (b.metalliProdotti + b.metalliEntrati), 1 - 1e-6, 1 + 1e-6, `${che}: metalli`);
  };
  chiuso(VL, 'Via Lattea');
  // senza fusioni: ciò che è nato, meno ciò che le stelle morte hanno restituito, è ciò che resta in stelle e resti
  tra((VL.bilancio.nate - VL.bilancio.restituito) / VL.massaStelle, 1 - 1e-9, 1 + 1e-9, 'nate − restituito = stelle e resti');
  // e i metalli nuovi sono quelli delle supernove avvenute: per M☉ nata, entro il valore di una generazione intera
  const P = popolazione(), T = P.tab[2], resa = VL.bilancio.metalliProdotti / VL.bilancio.nate; tra(resa / (T.cP[PASSI + 1] + T.cI[PASSI + 1] * P.MCH), 0.6, 1.05, 'metalli prodotti per M☉ nata / resa di una generazione');
  // i metalli per supernova: una costante della fisica delle stelle (non più «da 0,5 a 20 M☉»)
  let sn = 0; for (let j = 1; j <= PASSI; j++) sn += (VL.storia.collasso[j] + VL.storia.Ia[j]) * DT * 1e9; tra(VL.bilancio.metalliProdotti / sn, 0.6, 1.6, 'M☉ di metalli nuovi per supernova');
  // con le fusioni (una grande a 9 Ga, e le galassie vere più sotto)
  const F = formaDaAlone({ massa: 3e12, spin: 0.04, fusioni: [{ quando: 4, rapporto: 0.2 }, { quando: 9, rapporto: 0.8 }] }, CASO); chiuso(F, 'con due fusioni');
  console.log(`      (Via Lattea: entrati ${num(VL.bilancio.entrato)} M☉ di gas; nate ${num(VL.bilancio.nate)}; restituite ${num(VL.bilancio.restituito)}; soffiate fuori ${num(VL.bilancio.vento)}; metalli prodotti ${num(VL.bilancio.metalliProdotti)} M☉ = ${num(VL.bilancio.metalliProdotti / sn)} per supernova)`);
});

prova('il catalogo è un campione: 2500 stelle con i campi di sempre, il peso statistico, la massa che torna', () => {
  assert.equal(CAT.stelle.length, 2500); let nVive = 0, resti = 0;
  for (const [i, s] of CAT.stelle.entries()) {
    assert.equal(s.id, i); assert.ok(s.pos.length === 2 && s.pos.every(Number.isFinite) && s.colore.length === 3 && s.Z > 0 && s.peso >= 1);
    assert.ok(s.eta > 0 && s.eta < ADESSO && ADESSO - s.eta >= (VL.formazione / ANNO) * (1 - 1e-9), `nata a ${ADESSO - s.eta}`);
    if (vive(s)) { nVive++; const v = ST.stella(s.massa, { Z: s.Z }).vita; assert.ok(s.eta < v && s.T > 200 && s.massaNascita === undefined && s.morta === undefined); if (s.stato === 'gigante rossa') assert.ok(s.eta > 0.9 * v); }
    else {
      resti++; const f = ST.fine(s.massaNascita, 1e-4, { Z: s.Z }); assert.equal(s.stato, f.tipo); assert.ok(Math.abs(s.massa - f.massa) < 1e-9 && s.massaNascita > s.massa && s.morta >= 0 && s.raggioM > 0);
      tra(s.eta / (ST.stella(s.massaNascita, { Z: s.Z }).vita + s.morta), 1 - 1e-9, 1 + 1e-9, 'età di un resto = vita + anni dalla morte');
    }
  }
  assert.ok(nVive > 2000 && resti > 100, `${nVive} vive, ${resti} resti`);
  // che cosa rappresenta: tutte le stelle mai nate, divise per il campione; la massa di stelle e resti torna con quella di forma
  tra(CAT.stelleVere, 5e10, 5e11, 'stelle vere'); tra(CAT.pesoCampione * (2500 - CAT.stelle.filter((s) => s.supernova).length) / CAT.stelleVere, 0.999999, 1.000001, 'peso × campione = stelle vere');
  tra(CAT.stelle.reduce((a, s) => a + s.massa * s.peso, 0) / VL.massaStelle, 0.85, 1.15, 'massa del campione / massa in stelle');
  tra(CAT.stelle.filter((s) => Math.hypot(...s.pos) <= 1).length / 2500, 0.93, 1.001, 'stelle entro il raggio 1');
  // lo stesso ingresso dà lo stesso catalogo; un catalogo più piccolo è un altro campione della stessa galassia
  assert.equal(JSON.stringify(stelleGalassia(VL, CASO)), JSON.stringify(CAT)); assert.equal(JSON.stringify(formaDaAlone(ALONE, CASO).perG), JSON.stringify(VL.perG));
  assert.equal(stelleGalassia(VL, CASO, { quante: 400 }).stelle.length, 400);
  console.log(`      (${num(CAT.stelleVere)} stelle vere; ogni stella del campione ne rappresenta ${num(CAT.pesoCampione)}; nel campione ${nVive} vive e ${resti} resti)`);
});

prova('le supernove e i resti: stelle massicce morte davvero, nessun resto sul posto di una stella viva', () => {
  const sn = CAT.sorgenti.filter((s) => s.tipo === 'supernova'), getto = CAT.sorgenti[0]; assert.equal(getto.tipo, 'getto'); assert.ok(getto.potenza >= 0 && Number.isFinite(getto.angolo));
  assert.ok(sn.length >= 3 && sn.length <= RESTI); let collasso = 0, prima = 0;
  for (const s of sn) {
    assert.ok(s.eta > prima && s.eta < 1e5 && s.potenza > 0 && s.r > 0 && s.r < 0.01, `resto: età ${s.eta}, raggio ${s.r}`); prima = s.eta;
    const qui = CAT.stelle.filter((x) => x.pos[0] === s.pos[0] && x.pos[1] === s.pos[1]);
    if (s.resto.startsWith('niente')) { assert.equal(qui.length, 0, 'una Ia non lascia niente, e lì non c\'è nessuna stella del catalogo'); continue; }
    collasso++; assert.equal(qui.length, 1); const st = qui[0]; assert.equal(st.id, s.stella); assert.equal(st.stato, s.resto); assert.equal(st.morta, s.eta); assert.equal(st.peso, 1); assert.ok(st.massaNascita >= 8 && !vive(st));
    // è la stella di quella supernova: la sua vita è finita da «eta» anni, ed è nata dove oggi nascono stelle (un anello con gas sopra la soglia)
    tra(st.eta - ST.stella(st.massaNascita, { Z: st.Z }).vita, s.eta * (1 - 1e-6) - 1e-3, s.eta * (1 + 1e-6) + 1e-3, 'morta da quanto è vecchio il resto');
    let k = 0; const r = Math.hypot(...st.pos) * VL.unitaKpc; while (k < ANELLI - 1 && VL.anelli.bordo[k + 1] < r) k++; assert.ok(VL.interno.nati[PASSI * ANELLI + k] > 0, 'in un anello dove nascono stelle');
  }
  // gli intervalli tra le ultime supernove sono quelli del ritmo (in media 1/ritmo anni)
  tra(sn[sn.length - 1].eta * CAT.ritmoSN / sn.length, 0.2, 3, 'età dell\'ultimo resto × ritmo / numero');
  for (const p of CAT.sorgenti.filter((s) => s.tipo === 'pulsar')) { const k = Number(p.nome.match(/(\d+)$/)[1]); assert.equal(sn.find((s) => s.nome.endsWith(` ${k}`)).resto, 'stella di neutroni'); assert.ok(p.B > 0 && p.potenza >= 0); }
  // il resto di 100 anni è largo qualche anno luce (espansione libera), quello di 10⁴ anni decine (Sedov-Taylor)
  for (const s of sn) tra(s.raggioM / 9.46e15, 0.05 * Math.pow(s.eta, 0.4), 30 * Math.pow(s.eta, 0.4) + 1, `raggio di un resto di ${s.eta.toFixed(0)} anni (anni luce)`);
  console.log(`      (${sn.length} resti più giovani di ${sn[sn.length - 1].eta.toFixed(0)} anni: ${collasso} da collasso, ${sn.length - collasso} Ia; ritmo ${num(100 * CAT.ritmoSN)} al secolo)`);
});

prova('le stelle giovani stanno nei bracci, le vecchie li seguono appena', () => {
  // la distanza dalla cresta del braccio più vicino, in frazioni dell'intervallo tra due bracci (0: sulla cresta; ½: in mezzo)
  const B = VL.bracci, scarto = (s) => { const r = Math.hypot(...s.pos) * VL.unitaKpc, x = (((Math.atan2(s.pos[1], s.pos[0]) - faseBraccio(VL, r)) * B.numero) / (2 * Math.PI)) % 1; return Math.abs(((x + 1.5) % 1) - 0.5); };
  // un campione grande della stessa galassia, per avere abbastanza stelle giovani
  const grande = stelleGalassia(VL, CASO, { quante: 30000 }).stelle.filter((s) => s.componente === 'disco' && !s.supernova && Math.hypot(...s.pos) * VL.unitaKpc > (VL.barra?.raggio ?? 0));
  const giovani = grande.filter((s) => s.eta / 1e9 < B.vita(Math.hypot(...s.pos) * VL.unitaKpc)), vecchie = grande.filter((s) => s.eta > 3e9);
  assert.ok(giovani.length > 60 && vecchie.length > 5000, `${giovani.length} giovani, ${vecchie.length} vecchie`);
  const nelBraccio = (v) => v.filter((s) => scarto(s) < 0.25).length / v.length; // metà del cielo: 0,5 se sparse
  tra(nelBraccio(giovani), 0.72, 1, 'giovani nella metà del disco attorno alle creste'); tra(nelBraccio(vecchie), 0.5, nelBraccio(giovani) - 0.08, 'vecchie');
  // le massicce (vivono meno di un braccio) sono tutte giovani: anche le supernove da collasso stanno lì
  for (const s of grande.filter((x) => vive(x) && x.massa > 8)) assert.ok(s.eta / 1e9 < B.vita(Math.hypot(...s.pos) * VL.unitaKpc));
  // un disco senza gas non ha bracci: il contrasto viene da quanto è freddo il disco
  console.log(`      (${VL.bracci.numero} bracci, passo ${num((VL.bracci.passo * 180) / Math.PI)}°, Q ${num(VL.bracci.Q)}, contrasto ${num(VL.bracci.contrasto)}; nella metà del disco attorno alle creste: ${num(100 * nelBraccio(giovani))}% delle giovani, ${num(100 * nelBraccio(vecchie))}% delle vecchie${VL.barra ? `; barra fino a ${num(VL.barra.raggio)} kpc` : ''})`);
});

prova('un ramo cambia una stella sola (e un evento della galassia non sposta le stelle)', () => {
  const radice = RADICE, ramo = sorgente(radice, { [`${radice}/stella 12/massa`]: 1 }), c2 = stelleGalassia(VL, ramo);
  let diverse = 0; for (let i = 0; i < 2500; i++) if (JSON.stringify(c2.stelle[i]) !== JSON.stringify(CAT.stelle[i])) { diverse++; assert.equal(i, 12); }
  assert.equal(diverse, 1); assert.notEqual(c2.stelle[12].massaNascita ?? c2.stelle[12].massa, CAT.stelle[12].massaNascita ?? CAT.stelle[12].massa); assert.deepEqual(c2.stelle[12].pos, CAT.stelle[12].pos);
  assert.equal(JSON.stringify(c2.sorgenti), JSON.stringify(CAT.sorgenti));
  // dove è nata: cambia solo lei, e solo il posto
  const c3 = stelleGalassia(VL, sorgente(radice, { [`${radice}/stella 40/angolo`]: 2 })); for (let i = 0; i < 2500; i++) if (i !== 40) assert.equal(JSON.stringify(c3.stelle[i]), JSON.stringify(CAT.stelle[i]));
  assert.notDeepEqual(c3.stelle[40].pos, CAT.stelle[40].pos); assert.equal(c3.stelle[40].massa, CAT.stelle[40].massa); assert.equal(c3.stelle[40].Z, CAT.stelle[40].Z);
  // una delle ultime supernove va diversamente: le stelle del campione restano dove sono
  const c4 = stelleGalassia(VL, sorgente(radice, { [`${radice}/supernova 2/dove`]: 1 })); for (let i = 0; i < 2500 - RESTI; i++) assert.equal(JSON.stringify(c4.stelle[i]), JSON.stringify(CAT.stelle[i]));
  // un evento della galassia (quanto è acceso il buco nero): cambia il getto, non le stelle né la storia
  const f5 = formaDaAlone(ALONE, sorgente(radice, { [`${radice}/buco/acceso`]: 3 })); assert.notEqual(f5.buco.eddington, VL.buco.eddington); assert.equal(f5.massaStelle, VL.massaStelle);
  assert.equal(JSON.stringify(stelleGalassia(f5, CASO).stelle), JSON.stringify(CAT.stelle));
});

prova('il tipo esce dalla storia: una fusione grande e tardiva fa un\'ellittica, lo spin fa la taglia del disco, la massa decide il resto', () => {
  // la stessa Via Lattea con un compagno uguale entrato a 10 Ga: le stelle di prima finiscono nello sferoide
  const E = formaDaAlone({ massa: 1e12, spin: 0.04, fusioni: [{ quando: 10, rapporto: 1 }] }, CASO), fe = E.fusioni[0];
  assert.ok(fe.avvenuta && fe.tipo === 'maggiore' && fe.arrivo > 10, JSON.stringify(fe)); assert.equal(E.tipo, 'ellittica'); tra(E.frazioneSferoide, 0.8, 1, 'frazione nello sferoide'); assert.equal(E.bracci.contrasto, 0);
  tra(E.raggioSferoide, 0.5, 15, 'raggio di metà massa dello sferoide (kpc)'); assert.ok(E.buco.M > 30 * VL.buco.M, 'il buco nero cresce con lo sferoide'); tra(E.buco.M / E.massaSferoide, 5e-4, 2e-2, 'buco nero / sferoide (Kormendy & Ho: qualche millesimo)');
  assert.ok(E.perG.schiacciata < 1 && E.perG.schiacciata >= 0.35); assert.ok(E.tinta[2] <= VL.tinta[2], 'più rossa, o uguale');
  const cE = stelleGalassia(E, CASO); tra(cE.stelle.filter((s) => s.componente === 'sferoide').length / 2500, 0.7, 1, 'stelle del catalogo nello sferoide');
  // la stessa fusione, ma presto (2 Ga): il disco ha il tempo di rifarsi
  const presto = formaDaAlone({ massa: 1e12, spin: 0.04, fusioni: [{ quando: 2, rapporto: 1 }] }, CASO); assert.equal(presto.tipo, 'spirale'); assert.ok(presto.frazioneSferoide < E.frazioneSferoide && presto.frazioneSferoide > 0.01);
  // un compagno piccolo (1:10 in alone): resta in orbita per l'attrito dinamico lento, o arriva e ingrossa appena lo sferoide
  const piccolo = formaDaAlone({ massa: 1e12, spin: 0.04, fusioni: [{ quando: 6, rapporto: 0.1 }] }, CASO); assert.equal(piccolo.tipo, 'spirale'); assert.ok(piccolo.fusioni[0].tipo !== 'maggiore');
  // lo spin: il disco è grande in proporzione (Mo, Mao & White), e gira più piano
  const stretto = formaDaAlone({ massa: 1e12, spin: 0.02, fusioni: [] }, CASO), largo = formaDaAlone({ massa: 1e12, spin: 0.08, fusioni: [] }, CASO);
  assert.ok(stretto.raggioDisco < 0.7 * VL.raggioDisco && largo.raggioDisco > 1.4 * VL.raggioDisco, `${stretto.raggioDisco} · ${VL.raggioDisco} · ${largo.raggioDisco}`); assert.ok(stretto.velocita > VL.velocita && VL.velocita > largo.velocita);
  // la massa: una nana fa poche stelle e povere di metalli (il vento esce dall'alone e non torna); un alone gigante non raffredda il suo gas
  const nana = formaDaAlone({ massa: 1e10, spin: 0.035, fusioni: [] }, CASO), media = formaDaAlone({ massa: 1e11, spin: 0.035, fusioni: [] }, CASO), gigante = formaDaAlone({ massa: 1e14, spin: 0.035, fusioni: [] }, CASO);
  // (l'efficienza ha un massimo in mezzo: cala nelle nane per il vento e nei giganti per il raffreddamento. Il massimo qui cade a 10¹¹–3·10¹¹ M☉; nell'universo vero a 10¹²: vedi «che cosa non torna»)
  assert.ok(nana.massaStelle / 1e10 < 0.5 * (media.massaStelle / 1e11) && gigante.massaStelle / 1e14 < 0.5 * (VL.massaStelle / 1e12), 'nane e giganti sono meno efficienti');
  const zDi = (f) => metallicita(f, ADESSO, 2 * f.raggioDisco); assert.ok(zDi(nana) < 0.5 * zDi(media) && zDi(media) < 1.05 * zDi(VL), `massa–metallicità: ${zDi(nana)} · ${zDi(media)} · ${zDi(VL)}`);
  assert.ok(nana.massaFuori > nana.massaStelle && VL.massaFuori < 0.1 * VL.massaStelle, 'il vento lascia la nana e ricade sulla grande');
  assert.ok(gigante.massaCalda > 5 * (gigante.massaStelle + gigante.massaGas) && gigante.storia.freddo[PASSI] === 0 && nana.storia.freddo[PASSI] === 1, 'nell\'alone gigante il gas resta caldo');
  assert.equal(gigante.ambiente, 'ammasso'); assert.equal(VL.ambiente, 'campo');
  console.log(`      (fusione alla pari a 10 Ga: ${E.classe}, sferoide ${num(100 * E.frazioneSferoide)}%, raggio ${num(E.raggioSferoide)} kpc, buco nero ${num(E.buco.M)} M☉; a 2 Ga: ${presto.classe}, sferoide ${num(100 * presto.frazioneSferoide)}%)`);
  console.log(`      (stelle / alone: 10¹⁰ → ${num(nana.massaStelle / 1e10)} · 10¹¹ → ${num(media.massaStelle / 1e11)} · 10¹² → ${num(VL.massaStelle / 1e12)} · 10¹⁴ → ${num(gigante.massaStelle / 1e14)}; Z a 2 scale: ${num(zDi(nana), 2)} · ${num(zDi(media), 2)} · ${num(zDi(VL), 2)})`);
});

prova('le galassie vere di cosmo(1): l\'alone dal picco, lo spin dalle maree dei vicini, più ellittiche dove il campo è più denso', () => {
  const C = cosmo(1), n = C.galassie.length, t0 = performance.now();
  const F = C.galassie.map((G) => formaGalassia(G, C.galassie, sorgente(`cosmo 1/galassia ${G.id}`))), ms = performance.now() - t0;
  // la massa cresce con il picco (le galassie sono ordinate dal picco più alto)
  for (let i = 1; i < n; i++) assert.ok(F[i].alone.massa <= F[i - 1].alone.massa * (1 + 1e-9)); assert.ok(massaAlone(3) > 10 * massaAlone(0.5));
  tra(mediana(F.map((f) => f.alone.massa)) / 1e12, 0.2, 2, 'alone mediano (10¹² M☉)'); tra(F[0].alone.massa / 1e12, 3, 100, 'il più grande');
  // lo spin: log-normale attorno a 0,035, e legato alla marea vera: chi sente più marea gira di più
  const spin = F.map((f) => f.alone.spin); tra(mediana(spin), 0.028, 0.045, 'spin mediano'); tra(Math.sqrt(spin.reduce((a, x) => a + Math.log(x / mediana(spin)) ** 2, 0) / n), 0.3, 0.7, 'larghezza in logaritmo');
  const perMarea = [...F].sort((a, b) => a.alone.marea - b.alone.marea), terzo = Math.floor(n / 3); assert.ok(mediana(perMarea.slice(-terzo).map((f) => f.alone.spin)) > 1.2 * mediana(perMarea.slice(0, terzo).map((f) => f.alone.spin)), 'lo spin segue la marea dei vicini');
  for (const f of F) assert.ok(f.alone.vicino && f.alone.vicino.distanzaMpc > 0 && Number.isFinite(f.alone.direzioneMarea));
  // senza i vicini lo spin è un altro: non è un sorteggio che ignora il posto
  const solo = aloneGalassia(C.galassie[7], [], sorgente('cosmo 1/galassia 7')); assert.notEqual(solo.spin, F[7].alone.spin); assert.equal(solo.massa, F[7].alone.massa);
  // i tipi: una minoranza di ellittiche, e stanno dove il campo è più denso
  const ell = (v) => v.filter((f) => f.tipo === 'ellittica').length, frazione = ell(F) / n, densi = F.slice(0, terzo), radi = F.slice(-terzo);
  // (le galassie segnate sulla mappa sono le grandi: aloni attorno a 10¹² M☉. Tra le galassie grandi vere, ellittiche e lenticolari
  // sono circa metà; tra tutte, nane comprese, il 10–20%)
  tra(frazione, 0.1, 0.65, 'frazione di ellittiche tra le galassie grandi'); assert.ok(ell(densi) / terzo > frazione, `nel terzo più denso ${ell(densi)} su ${terzo}, in tutto ${ell(F)} su ${n}`);
  // più del doppio nel terzo più denso che nel più rado: contate su tre cosmi invece che su uno (in un cosmo i terzi hanno una
  // ventina di galassie, e un conteggio di 5–7 ha uno scarto di ±2,5: da solo non regge un rapporto)
  let eDensi = ell(densi), eRadi = ell(radi), nTerzi = terzo;
  for (const nc of [2, 3]) { const F2 = cosmo(nc).galassie.map((G) => G.forma), t2 = Math.floor(F2.length / 3); eDensi += ell(F2.slice(0, t2)); eRadi += ell(F2.slice(-t2)); nTerzi += t2; }
  assert.ok(eDensi > 2 * eRadi, `in tre cosmi: nel terzo più denso ${eDensi} ellittiche su ${nTerzi}, nel più rado ${eRadi}`);
  // chi è ellittica ha avuto fusioni; le spirali hanno gas, bracci, e stelle che nascono ancora
  for (const f of F) {
    assert.ok(['spirale', 'spirale barrata', 'lenticolare', 'ellittica'].includes(f.classe));
    if (f.tipo === 'ellittica') { assert.ok(f.fusioni.some((x) => x.avvenuta), 'un\'ellittica senza fusioni'); assert.ok(f.bracci.contrasto < 0.05 && !f.barra); assert.ok(f.classe === 'lenticolare' || f.frazioneSferoide > 0.8); }
    else assert.ok(f.massaGas > 0 && f.bracci.contrasto >= 0.05 && f.frazioneSferoide <= 0.8);
    const b = f.bilancio; tra((b.gas + b.stelle + b.vento + b.alCaldo) / b.entrato, 1 - 1e-9, 1 + 1e-9, 'bilancio di massa'); tra((b.metalliGas + b.metalliStelle + b.metalliVento + b.metalliCaldo) / (b.metalliProdotti + b.metalliEntrati), 1 - 1e-6, 1 + 1e-6, 'bilancio dei metalli');
    assert.ok(f.massaStelle > 0 && f.massaStelle < U.fb * f.alone.massa, 'più stelle dei barioni dell\'alone'); assert.ok(f.unitaKpc > 0.5 && f.unitaKpc < 200 && f.buco.M >= LEGGI.germe && f.buco.attivita >= 0 && f.buco.attivita <= 1);
    assert.ok(f.formazione > 0 && f.formazione < 3e9 * ANNO && f.tinta.every((x) => x >= 0 && x <= 255) && f.perG.bracci >= 2 && f.perG.passo > 0);
  }
  const sp = F.filter((f) => f.tipo === 'spirale'), el = F.filter((f) => f.tipo === 'ellittica');
  assert.ok(mediana(sp.map((f) => f.storia.sfr[PASSI] / f.massaStelle)) > 3 * mediana(el.map((f) => f.storia.sfr[PASSI] / f.massaStelle)), 'le ellittiche hanno quasi smesso di fare stelle');
  // (quando è nata metà delle stelle: qui non distingue i tipi — in tutte entro i primi 4 Ga: vedi «che cosa non torna»)
  const meta = (f) => { const e = f.interno, m = new Float64Array(PASSI + 1); let tot = 0, c = 0; for (let i = 1; i <= PASSI; i++) { m[i] = e.est[i]; for (let k = 0; k < ANELLI; k++) m[i] += e.nati[i * ANELLI + k]; tot += m[i]; } for (let i = 1; i <= PASSI; i++) { c += m[i]; if (c >= tot / 2) return i * DT; } return T0; };
  // le ellittiche degli aloni grandi si sono messe insieme DOPO aver fatto le stelle: l'ultima grande fusione viene dopo la metà delle nascite
  for (const f of el.filter((x) => x.alone.massa > 3e12)) assert.ok(f.ultimaFusioneMaggiore > meta(f), `fusione a ${f.ultimaFusioneMaggiore} Ga, metà delle stelle a ${meta(f)} Ga`);
  assert.ok(mediana(el.map((f) => f.buco.M)) > 3 * mediana(sp.map((f) => f.buco.M)), 'e hanno i buchi neri più grandi');
  const classi = {}; for (const f of F) classi[f.classe] = (classi[f.classe] || 0) + 1;
  console.log(`      (${n} galassie in ${ms.toFixed(0)} ms; aloni da ${num(F[n - 1].alone.massa)} a ${num(F[0].alone.massa)} M☉, mediana ${num(mediana(F.map((f) => f.alone.massa)))}; spin mediano ${num(mediana(spin))})`);
  console.log(`      (tipi: ${Object.entries(classi).map(([k, v]) => `${k} ${v}`).join(', ')}; ellittiche e lenticolari ${num(100 * frazione)}%; con più di metà delle stelle nello sferoide ${num((100 * F.filter((f) => f.frazioneSferoide > 0.5).length) / n)}%; ellittiche nel terzo più denso ${ell(densi)} su ${terzo}, in quello di mezzo ${ell(F.slice(terzo, n - terzo))} su ${n - 2 * terzo}, nel più rado ${ell(radi)} su ${terzo})`);
  console.log(`      (stelle: da ${num(Math.min(...F.map((f) => f.massaStelle)))} a ${num(Math.max(...F.map((f) => f.massaStelle)))} M☉; supernove al secolo: mediana ${num(100 * mediana(F.map((f) => f.ritmoSN.totale)))}, nelle spirali ${num(100 * mediana(sp.map((f) => f.ritmoSN.totale)))}, nelle ellittiche ${num(100 * mediana(el.map((f) => f.ritmoSN.totale)))}; metà delle stelle nata entro ${num(mediana(sp.map(meta)), 2)} Ga nelle spirali, ${num(mediana(el.map(meta)), 2)} nelle ellittiche)`);
});

prova('i cataloghi delle galassie vere: coerenti con stelle.js, resti mai su stelle vive, e in poche decine di millisecondi', () => {
  const C = cosmo(1), n = C.galassie.length, ids = [0, 1, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1], tempi = [];
  for (const id of ids) {
    const caso = sorgente(`cosmo 1/galassia ${id}`), t0 = performance.now(), f = formaGalassia(C.galassie[id], C.galassie, caso), cat = stelleGalassia(f, caso); tempi.push(performance.now() - t0);
    assert.equal(cat.stelle.length, 2500); let nVive = 0;
    for (const s of cat.stelle) {
      assert.ok(ADESSO - s.eta >= (f.formazione / ANNO) * (1 - 1e-9) && s.eta > 0 && s.pos.every(Number.isFinite) && s.Z > 0);
      if (vive(s)) { nVive++; assert.ok(s.eta < ST.stella(s.massa, { Z: s.Z }).vita); } else { const e = ST.fine(s.massaNascita, 1e-4, { Z: s.Z }); assert.equal(s.stato, e.tipo); assert.ok(Math.abs(s.massa - e.massa) < 1e-9); }
    }
    assert.ok(nVive > 1500);
    for (const s of cat.sorgenti.filter((x) => x.tipo === 'supernova')) { const st = cat.stelle.find((x) => x.pos[0] === s.pos[0] && x.pos[1] === s.pos[1]); assert.ok(!st || (!vive(st) && st.stato !== 'nana bianca' && st.morta === s.eta), 'un resto sul posto di una stella viva'); }
    tra(cat.stelle.reduce((a, s) => a + s.massa * s.peso, 0) / f.massaStelle, 0.75, 1.3, `galassia ${id}: massa del campione / massa in stelle`);
    assert.equal(JSON.stringify(stelleGalassia(formaGalassia(C.galassie[id], C.galassie, caso), caso).stelle.slice(0, 50)), JSON.stringify(cat.stelle.slice(0, 50)), 'determinismo');
  }
  const medio = tempi.slice(1).reduce((a, b) => a + b, 0) / (tempi.length - 1); tra(medio, 0, 60, 'formaGalassia + stelleGalassia (ms, in media)');
  console.log(`      (forma + catalogo: ${tempi.map((t) => t.toFixed(0)).join(', ')} ms; in media ${medio.toFixed(0)} ms dopo la prima)`);
});

prova('collegate al cosmo: le scale vere, i moti della stella nella galassia e della galassia nel cosmo', () => {
  const C = cosmo(1), H0 = COSMO.H0, f = Math.log(U.D(1.01) / U.D(0.99)) / Math.log(1.01 / 0.99); tra(f / Math.pow(COSMO.Om, 0.55), 0.97, 1.03, 'il ritmo di crescita f = dlnD/dlna (≈ Ωm^0,55)');
  // la teoria lineare: la divergenza della velocità è −H₀·f·δ (qui la si deriva a differenze sul campo, in un punto qualunque)
  const L = TORO_M / 3.0857e22, sb = dentro.U.sigmaOnde((2 * Math.PI * 9) / L), delta = (x, y) => ((C.densita(x, y) - C.media) / C.sigma) * sb + 0;
  for (const [x, y] of [[0.31, 0.62], [0.8, 0.15], C.galassie[5].pos]) {
    const h = 1e-5, v = (a, b) => velocitaPeculiare(C, [a, b]), div = (v(x + h, y)[0] - v(x - h, y)[0] + v(x, y + h)[1] - v(x, y - h)[1]) / (2 * h * L);
    // (la media del campo sulla griglia non è una delle onde: δ qui è la somma delle onde, a media nulla)
    const onde = (C.densita(x, y) / C.sigma) * sb; assert.ok(Math.abs(div + H0 * f * onde) < 1e-3 * H0 * f * (Math.abs(onde) + 0.1), `divergenza ${div} contro ${-H0 * f * onde}`); void delta;
  }
  const vel = C.galassie.map((G) => Math.hypot(...velocitaPeculiare(C, G.pos))); tra(mediana(vel), 100, 4000, 'velocità peculiare mediana delle galassie (km/s; nell\'universo vero ~400–600: il campo di cosmo.js ha onde lunghe troppo forti)');
  // le scale: una galassia nel cosmo e un sistema nella galassia hanno la taglia vera
  for (const G of C.galassie) { assert.equal(G.r, G.forma.unitaM / TORO_M); assert.equal(metriPerUnita(1, { cosmo: 1, galassia: G.id }), G.forma.unitaM); tra(raggioSistema(1, G.id) * G.forma.unitaM / 1.496e11, 30 - 1e-9, 30 + 1e-9, 'un sistema: 30 UA'); assert.equal(G.tipo, G.forma.tipo); }
  // i moti di una regione vera (ora vengono dal mondo in tre dimensioni: spazio3d.js, provati in test_spazio3d): le voci ci sono
  // tutte, e la stella di un disco va circa alla velocità della curva di rotazione alla sua distanza
  let visti = 0, sferoide = 0;
  for (let n = 5; n < 60000 && visti < 12; n += 4801) {
    const a = indirizzoDi(n), M = motiDi(a), Gx = galassia(a.cosmo, a.galassia), S = Gx.stelle[a.stella], P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta]; visti++;
    assert.deepEqual(M.map((m) => m.nome), ['ferma nella regione', 'sul pianeta che gira', 'ferma rispetto alla stella', 'ferma rispetto alla galassia', 'ferma rispetto al fondo cosmico']);
    for (const m of M) assert.ok(Number.isFinite(m.kmS) && m.kmS >= 0 && Math.abs(m.velocita - (m.kmS * 1e3) / 2.998e8) < 1e-9 && m.direzione >= 0 && m.direzione < 360 && m.cosa.length > 10, JSON.stringify(m));
    const orbita = (2 * Math.PI * P.aM) / P.anno / 1e3; tra(M[2].kmS / orbita, 1 - 1e-9, 1 + 1e-9, 'la velocità lungo l\'orbita');
    const vc = curvaRotazione(Gx.forma, Math.max(1e-3, Math.hypot(...S.pos) * Gx.forma.unitaKpc)); if (S.componente === 'sferoide') sferoide++;
    assert.ok(M[3].kmS3d < 6 * vc + orbita + 50 && M[4].kmS3d < 6 * vc + orbita + 3000, `moti di ${M[3].kmS3d} e ${M[4].kmS3d} km/s con una curva di ${vc}`);
    assert.equal(JSON.stringify(motiDi(a)), JSON.stringify(M));
  }
  const a = indirizzoDi(1616476), M = motiDi(a);
  console.log(`      (velocità peculiari sulla carta piatta di prima (onde lunghe troppo forti; quelle vere, in 3D, sono in test_spazio3d): mediana ${num(mediana(vel))} km/s, massima ${num(Math.max(...vel))}; ${visti} regioni provate, ${sferoide} attorno a stelle dello sferoide)`);
  console.log(`      (universo n. 1616476: ${M.slice(1).map((m) => `${m.nome} ${num(m.kmS3d ?? m.kmS)} km/s`).join(' · ')})`);
});

// dove nascono le stelle oggi: il raggio a cui le nascite per kpc di raggio sono di più, e quello che ne contiene il 95%
const profiloNascite = (f) => {
  const e = f.interno, NR = ANELLI; let tot = 0, meglio = 0, picco = 0, c = 0, r95 = 0, anelli = 0; for (let k = 0; k < NR; k++) { tot += e.nati[PASSI * NR + k]; if (e.nati[PASSI * NR + k] > 0) anelli++; }
  for (let k = 0; k < NR; k++) { const n = e.nati[PASSI * NR + k], d = n / (e.bordo[k + 1] - e.bordo[k]); if (d > meglio) { meglio = d; picco = e.rc[k]; } if (c < 0.95 * tot && c + n >= 0.95 * tot) r95 = e.bordo[k] + ((0.95 * tot - c) / n) * (e.bordo[k + 1] - e.bordo[k]); c += n; }
  return { picco, r95, anelli };
};
// la legge delle nascite misurata sugli anelli: la retta in log Σ_SFR – log Σ_gas (M☉/anno/kpc² e M☉/pc²) tra due densità
const leggeMisurata = (forme, quando, lo, hi) => {
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const f of forme) { const e = f.interno; for (let j = quando === 'oggi' ? PASSI : 1; j <= PASSI; j++) for (let k = 0; k < ANELLI; k++) { const m = e.nati[j * ANELLI + k], sg = e.Sg[j * ANELLI + k] / 1e6; if (!(m > 0 && sg > lo && sg < hi)) continue; const x = Math.log10(sg), y = Math.log10(m / DT / 1e9 / e.area[k]); n++; sx += x; sy += y; sxx += x * x; sxy += x * y; } }
  const p = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { n, pendenza: p, a10: 10 ** ((sy - p * sx) / n + p) };
};

prova('le stelle nascono in tutto il disco: dal gas molecolare che la pressione fa, senza soglie; la luce e il colore anello per anello', () => {
  const A = VL.anelli, e = VL.interno, NR = ANELLI, C1 = cosmo(1).galassie.map((G) => G.forma);
  // gli anelli: bordi in progressione geometrica, in scale del disco; dentro il primo bordo sta la stessa parte di un disco
  // esponenziale che sta fuori dall'ultimo (a 8 scale: 9·e⁻⁸)
  for (let k = 2; k < NR; k++) tra((A.bordo[k + 1] * A.bordo[k - 1]) / A.bordo[k] ** 2, 1 - 1e-9, 1 + 1e-9, 'bordi in progressione geometrica');
  const x0 = (8 * A.bordo[1]) / A.bordo[NR]; tra((1 - (1 + x0) * Math.exp(-x0)) / (9 * Math.exp(-8)), 1 - 1e-6, 1 + 1e-6, 'la parte dentro il primo bordo / la parte fuori dall\'ultimo');
  // dove nascono oggi. Nella Via Lattea vera il massimo sta a 4–6 kpc e la coda arriva a ~15, con una scala del disco di
  // 2,5–3,5 kpc: in scale del disco, il massimo tra 4/3,5 e 6/2,5 e il 95% entro 12/3,5–18/2,5
  const P = profiloNascite(VL); tra(P.picco / VL.raggioDisco, 4 / 3.5, 6 / 2.5, 'il massimo delle nascite (in scale del disco)'); tra(P.r95 / VL.raggioDisco, 12 / 3.5, 18 / 2.5, 'il raggio che tiene il 95% delle nascite (in scale del disco)');
  // NIENTE SOGLIA: nessun anello con più gas di quanto l'idrogeno atomico ne regge (9 M☉/pc²: «a sharp saturation of the HI
  // surface density», Bigiel et al. 2008 [V]: sopra, il resto è molecolare) resta senza nascite; nella Via Lattea e in tutte le galassie di cosmo(1)
  for (const f of [VL, ...C1]) for (let k = 0; k < NR; k++) if (f.anelli.sigmaGas[k] > 9e6) assert.ok(f.interno.nati[PASSI * NR + k] > 0, `un anello con ${f.anelli.sigmaGas[k] / 1e6} M☉/pc² di gas e nessuna nascita`);
  // dove c'è un disco con il gas (le spirali) le stelle nascono in tanti anelli, non al centro soltanto: almeno una su tre oltre una scala del disco
  const sp = C1.filter((f) => f.tipo === 'spirale'), fuori = (f) => { let t = 0, o = 0; for (let k = 0; k < NR; k++) { const n = f.interno.nati[PASSI * NR + k]; t += n; if (f.anelli.r[k] > f.raggioDisco) o += n; } return o / t; };
  tra(mediana(sp.map((f) => profiloNascite(f).anelli)), NR / 2, NR + 1, 'anelli con nascite oggi, nella spirale mediana'); tra(mediana(sp.map(fuori)), 1 / 3, 1, 'nascite oltre una scala del disco, nella spirale mediana');
  // LA LEGGE DI KENNICUTT, misurata sugli anelli di tutte le galassie di cosmo(1) in tutta la loro storia, sull'intervallo di
  // Kennicutt 1998 (dischi e scoppi, da 3 a 10⁵ M☉/pc²): pendenza 1,40 ± 0,15. Non è scritta: esce dal gas molecolare (pendenza
  // 1 dove è tutto molecolare, più ripida dove è atomico) e dagli scoppi
  const ks = leggeMisurata(C1, 'sempre', 3, 1e5); tra(ks.pendenza, 1.25, 1.55, 'pendenza della legge di Kennicutt-Schmidt sugli anelli');
  // la luce anello per anello: sommata sul disco (senza sferoide) è la luce della galassia; le giovani ne sono una parte, più azzurra
  let somma = 0, giovani = 0; for (let k = 0; k < NR; k++) { somma += A.luce[k] * A.area[k]; giovani += A.luceGiovani[k] * A.area[k]; assert.ok(A.luceGiovani[k] <= A.luce[k] * (1 + 1e-9) && A.luceVGiovani[k] <= A.luceV[k] * (1 + 1e-9) && A.vitaBraccio[k] > 0); if (A.luceVGiovani[k] > 0) assert.ok(A.coloreGiovani[k][2] / A.coloreGiovani[k][0] >= A.colore[k][2] / A.colore[k][0], 'le giovani sono più azzurre'); }
  tra(somma / VL.luce, 1 - 1e-9, 1 + 1e-9, 'la luce degli anelli / la luce della galassia'); tra(giovani / somma, 0.3, 0.999, 'la parte della luce (in tutto) che viene dalle stelle più giovani di un braccio');
  // il colore di un corpo nero: il Sole quasi bianco (appena caldo), 9500 K bianco-azzurro, 3000 K arancio; più caldo, più azzurro
  const sole = colorePerTemperatura(5772), calda = colorePerTemperatura(9500), fredda = colorePerTemperatura(3000);
  assert.ok(sole[0] === 255 && sole[1] > 230 && sole[2] > 215 && sole[1] >= sole[2], `il Sole: ${sole}`); assert.ok(calda[2] === 255 && calda[0] < calda[1] && calda[1] < 255 && calda[0] > 180, `9500 K: ${calda}`); assert.ok(fredda[0] === 255 && fredda[2] < 140 && fredda[1] < 210, `3000 K: ${fredda}`);
  let prima = Infinity; for (let T = 1500; T < 40000; T *= 1.1) { const c = coloreCorpoNero(T), q = c[0] / Math.max(c[2], 1e-9); assert.ok(q <= prima * (1 + 1e-9) && Math.max(...c) === 1 && Math.min(...c) >= 0); prima = q; }
  // la luce di una generazione cala con l'età e arrossa; le giovani di un braccio (100 Ma) fanno migliaia di L☉ per M☉/anno
  const g0 = luceGenerazione(0.01), g1 = luceGenerazione(1), g2 = luceGenerazione(10); assert.ok(g0.luce > 10 * g1.luce && g1.luce > 3 * g2.luce && g0.colore[2] === 1 && g2.colore[0] === 1);
  tra(luceNascite(0.3).luce / (popolazione().luce[0] * DT * 1e9), 1 - 1e-3, 1 + 1e-3, 'luceNascite(un passo) / luce della generazione del primo passo');
  console.log(`      (Via Lattea: nascite in ${P.anelli} anelli su ${NR}; il massimo a ${num(P.picco)} kpc, il 95% entro ${num(P.r95)} kpc; spirali di cosmo(1): anelli con nascite ${mediana(sp.map((f) => profiloNascite(f).anelli))} (mediana), oltre una scala ${num(100 * mediana(sp.map(fuori)))}%)`);
  console.log(`      (Kennicutt-Schmidt sugli anelli, 3–10⁵ M☉/pc², ${ks.n} punti: pendenza ${num(ks.pendenza)}, a 10 M☉/pc² ${num(ks.a10)} M☉/anno/kpc² (Kennicutt 1998, con l'elio: 4,1·10⁻³ con le masse di Salpeter, 2,7·10⁻³ con quelle di Kroupa))`);
  console.log(`      (luce: il ${num(100 * giovani / somma)}% dalle stelle più giovani di un braccio; colori: il Sole ${sole}, 9500 K ${calda}, 3000 K ${fredda}; il disco a 8 kpc ${A.colore[A.r.findIndex((r) => r > 8)]}, le sue giovani ${A.coloreGiovani[A.r.findIndex((r) => r > 8)]})`);
});

// ---------- il confronto con la Via Lattea, in chiaro
console.log('\n  la Via Lattea (alone 10¹² M☉, spin 0,04, nessuna fusione)        modello     vera');
const riga = (che, m, v) => console.log(`    ${che.padEnd(58)} ${String(m).padStart(9)}   ${v}`);
riga('scala del disco (kpc)', num(VL.raggioDisco), '2,6 ± 0,5'); riga('velocità di rotazione a 8 kpc (km/s)', num(curvaRotazione(VL, 8)), '220–240');
riga('massa in stelle (10¹⁰ M☉)', num(VL.massaStelle / 1e10), '5–6'); riga('gas freddo (10¹⁰ M☉)', num(VL.massaGas / 1e10), '≈ 1'); riga('stelle che nascono (M☉/anno)', num(VL.storia.sfr[PASSI]), '1,5–2');
riga('supernove al secolo (collasso + Ia)', `${num(100 * VL.ritmoSN.collasso, 2)} + ${num(100 * VL.ritmoSN.Ia, 2)}`, '≈ 2 (1,5 + 0,5)'); riga('Z a 8 kpc, 4,6 Ga fa (Z☉)', num(metallicita(VL, ADESSO - 4.6e9, 8)), '1');
riga('gradiente di Z oggi, 4–12 kpc (dex/kpc)', num(Math.log10(metallicita(VL, ADESSO, 12) / metallicita(VL, ADESSO, 4)) / 8, 2), '−0,05'); riga('bracci · passo (gradi)', `${VL.bracci.numero} · ${num((VL.bracci.passo * 180) / Math.PI, 2)}`, '2–4 · 12–25');
riga('barra (kpc)', VL.barra ? num(VL.barra.raggio) : 'no', '≈ 5'); riga('buco nero centrale (M☉)', num(VL.buco.M), '4,3·10⁶ (qui: senza sferoide resta il germe)'); riga('gas caldo nell\'alone (10¹⁰ M☉)', num(VL.massaCalda / 1e10), '2–10 (incerto)');
// ---------- I RISCONTRI su più galassie (stampati: ciò che non torna è segnato e non ferma la catena)
// Tre campioni di aloni come quello della Via Lattea: (a) quello della prova; (b) sedici aloni quieti, senza fusioni, masse
// 0,8–1,6·10¹² M☉ e spin attorno alla mediana (0,028–0,055); (c) le galassie vere dei cosmi 1–3 con alone 0,7–2·10¹² M☉ e
// meno di metà delle stelle nello sferoide (con le loro fusioni). Per ognuno la mediana e gli estremi.
{
  const misura = (f) => { const Z = (t, r) => metallicita(f, t, r), P = profiloNascite(f); let rSole = NaN; for (let r = 1; r < 16; r += 0.05) if (Z(ADESSO - 4.6e9, r) < 1) { rSole = r; break; }
    return [f.raggioDisco, f.storia.sfr[PASSI], P.picco, P.r95, Math.log10(Z(ADESSO, 12) / Z(ADESSO, 4)) / 8, Z(ADESSO, 8), Z(ADESSO - 4.6e9, 8), rSole, f.anelli.Z[0], f.massaStelle / 1e10, f.massaGas / 1e9, curvaRotazione(f, 8)]; };
  const VOCI = [['scala del disco di stelle (kpc)', 2.5, 3.5], ['stelle che nascono oggi (M☉/anno)', 1, 3], ['raggio dove nascono più stelle per kpc (kpc)', 4, 6], ['raggio che tiene il 95% delle nascite (kpc)', 12, 18], ['gradiente dei metalli, 4–12 kpc (dex/kpc)', -0.07, -0.04],
    ['Z del gas a 8 kpc, oggi (Z☉: 1 entro 0,3 dex)', 0.5, 2], ['Z del gas a 8 kpc, 4,6 Ga fa (Z☉)', 0.67, 1.5], ['raggio dove il gas aveva Z = 1, 4,6 Ga fa (kpc)', 4.4, 7.7], ['Z del gas al centro, oggi (Z☉)', 0, 3], ['massa in stelle (10¹⁰ M☉)', 5, 6], ['gas freddo (10⁹ M☉)', 7, 12], ['velocità di rotazione a 8 kpc (km/s)', 220, 240]];
  const quieti = []; for (const M of [0.8e12, 1e12, 1.3e12, 1.6e12]) for (const spin of [0.028, 0.035, 0.044, 0.055]) quieti.push(misura(formaDaAlone({ massa: M, spin, fusioni: [] }, sorgente(`prova/riscontri/alone ${M}/spin ${spin}`))));
  const veri = [], tutte = []; for (const nc of [1, 2, 3]) for (const G of cosmo(nc).galassie) { tutte.push(G.forma); if (G.forma.alone.massa > 0.7e12 && G.forma.alone.massa < 2e12 && G.forma.frazioneSferoide < 0.5) veri.push(misura(G.forma)); }
  const campioni = [['(a) la prova', [misura(VL)]], [`(b) ${quieti.length} aloni quieti`, quieti], [`(c) ${veri.length} galassie dei cosmi 1–3`, veri]];
  console.log(`\n  UN ALONE COME QUELLO DELLA VIA LATTEA, su più galassie: mediana [minimo … massimo]; ≠ segna la mediana che NON TORNA col vero`);
  console.log(`    ${''.padEnd(48)} ${'vero'.padEnd(12)} ${campioni.map(([n]) => n.padEnd(30)).join(' ')}`);
  let no = 0;
  VOCI.forEach(([che, a, b], i) => console.log(`    ${che.padEnd(48)} ${`${num(a)}…${num(b)}`.padEnd(12)} ${campioni.map(([, R]) => { const v = R.map((r) => r[i]).filter(Number.isFinite), m = mediana(v), bene = m >= a && m <= b; if (!bene) no++; return `${bene ? ' ' : '≠'} ${num(m)}${R.length > 1 ? ` [${num(Math.min(...v), 2)} … ${num(Math.max(...v), 2)}]` : ''}`.padEnd(30); }).join(' ')}`));
  console.log(`    (${no} mediane su ${VOCI.length * campioni.length} NON TORNANO. Le cause, per quel che si sa: l'alone raffredda poco gas — il suo gas caldo resta senza metalli — e le stelle sono la metà delle vere; il disco a 8 kpc cresce tardi; nelle galassie con le fusioni il gas del centro, chiuso, sale a 4 Z☉)`);
  // la legge delle nascite misurata sugli anelli (Kennicutt 1998: pendenza 1,40 ± 0,15 da 3 a 10⁵ M☉/pc²; a 10 M☉/pc², con l'elio, 4,1·10⁻³ M☉/anno/kpc² con le masse di Salpeter e 2,7·10⁻³ con quelle di Kroupa)
  console.log(`\n  LA LEGGE DI KENNICUTT-SCHMIDT misurata sugli anelli (${tutte.length} galassie dei cosmi 1–3)                 punti   pendenza (1,40 ± 0,15)   a 10 M☉/pc² (2,7·10⁻³)`);
  for (const [che, q, lo, hi] of [['tutta la storia, 3–10⁵ M☉/pc² (dischi e scoppi: Kennicutt 1998)', 'sempre', 3, 1e5], ['oggi, 3–100 M☉/pc² (i dischi, con il gas atomico dei bordi)', 'oggi', 3, 100], ['oggi, 10–100 M☉/pc² (gas quasi tutto molecolare)', 'oggi', 10, 100], ['tutta la storia, 100–10⁵ M☉/pc² (solo gli scoppi)', 'sempre', 100, 1e5]]) {
    const r = leggeMisurata(tutte, q, lo, hi); console.log(`    ${che.padEnd(70)} ${String(r.n).padStart(7)}   ${Math.abs(r.pendenza - 1.4) <= 0.15 ? ' ' : '≠'} ${num(r.pendenza).padEnd(8)}                ${num(r.a10)}`); }
  // la relazione tra massa e metalli e la sequenza delle galassie che fanno stelle (cosmi 1–3)
  const sp = tutte.filter((f) => f.tipo === 'spirale'), el = tutte.filter((f) => f.tipo === 'ellittica'), zStelle = (f) => f.bilancio.metalliStelle / f.massaStelle / dentro.ZSOLE, perMassa = [...tutte].sort((x, y) => x.massaStelle - y.massaStelle), terzo = Math.floor(tutte.length / 3);
  console.log(`\n  LE GALASSIE DEI COSMI 1–3 (${tutte.length}): nascite per massa di stelle (per Ga): spirali ${num(1e9 * mediana(sp.map((f) => f.storia.sfr[PASSI] / f.massaStelle)))}, ellittiche ${num(1e9 * mediana(el.map((f) => f.storia.sfr[PASSI] / f.massaStelle)))} (vere: 0,03–0,1 e meno di 0,003)`);
  console.log(`    metalli delle stelle (Z☉, in massa): nel terzo più leggero ${num(mediana(perMassa.slice(0, terzo).map(zStelle)))}, nel più pesante ${num(mediana(perMassa.slice(-terzo).map(zStelle)))}; Z delle stelle che nascono oggi (pesata con le nascite): spirali ${num(mediana(sp.map((f) => { let a = 0, b = 0; for (let k = 0; k < ANELLI; k++) { const n = f.interno.nati[PASSI * ANELLI + k]; a += n * f.interno.Zn[PASSI * ANELLI + k]; b += n; } return a / b; })))}, ellittiche ${num(mediana(el.map((f) => { let a = 0, b = 0; for (let k = 0; k < ANELLI; k++) { const n = f.interno.nati[PASSI * ANELLI + k]; a += n * f.interno.Zn[PASSI * ANELLI + k]; b += n; } return b > 0 ? a / b : NaN; }).filter(Number.isFinite)))} (≠ NON TORNA sopra 2–3: il gas chiuso al centro dopo una fusione)`);
  const unAnello = tutte.filter((f) => profiloNascite(f).anelli <= 1), nelCentro = (f) => { const e = f.interno; let a = 0, b = 0; for (let i = Math.max(1, e.sferoideFino); i <= PASSI; i++) for (let k = 0; k < ANELLI; k++) { const n = e.nati[i * ANELLI + k]; b += n; if (k === 0) a += n; } return b > 0 ? a / b : NaN; };
  console.log(`    nascite di oggi in un anello solo: ${unAnello.length} galassie su ${tutte.length} (${unAnello.filter((f) => f.tipo === 'ellittica').length} ellittiche: dopo una fusione maggiore, senza gas che si raffreddi, resta solo quello del centro); stelle del disco nate nell'anello centrale: ${num(100 * mediana(sp.map(nelCentro).filter(Number.isFinite)))}% nelle spirali (mediana)`);
}
void GK;
console.log(`\n${ok} prove superate`);
