// test_galassie.mjs — le galassie come conseguenza: la Via Lattea dai suoi numeri veri, e le galassie di cosmo(1)
import assert from 'node:assert/strict';
import { formaGalassia, formaDaAlone, aloneGalassia, stelleGalassia, ritmoSupernove, metallicita, curvaRotazione, faseBraccio, massaAlone, popolazione, velocitaPeculiare, LEGGI, ANELLI, PASSI, RESTI, dentro } from '../src/camera/galassie.js';
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
const CASO = sorgente('prova/via lattea'), ALONE = { massa: 1e12, spin: 0.04, fusioni: [] };
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

prova('i metalli escono dal bilancio: Z ≈ 1 dove e quando è nato il Sole, il gradiente, la relazione età–metallicità', () => {
  const zSole = metallicita(VL, ADESSO - 4.6e9, 8); tra(zSole, 1 / 1.5, 1.5, 'Z a 8 kpc, 4,6 miliardi di anni fa (in Z☉)');
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
  console.log(`      (Z a 8 kpc: ${[2, 4, 6, 8, ADESSO / 1e9 - 4.6, 12, ADESSO / 1e9].map((t) => `${num(t, 2)} Ga ${num(metallicita(VL, t * 1e9, 8), 2)}`).join(' · ')}; gradiente oggi ${num(grad, 2)} dex/kpc)`);
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
  const radice = 'prova/via lattea', ramo = sorgente(radice, { [`${radice}/stella 12/massa`]: 1 }), c2 = stelleGalassia(VL, ramo);
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
  tra(frazione, 0.1, 0.65, 'frazione di ellittiche tra le galassie grandi'); assert.ok(ell(densi) / terzo > frazione && ell(densi) > 2 * ell(radi), `nel terzo più denso ${ell(densi)}, nel più rado ${ell(radi)}`);
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

// ---------- il confronto con la Via Lattea, in chiaro
console.log('\n  la Via Lattea (alone 10¹² M☉, spin 0,04, nessuna fusione)        modello     vera');
const riga = (che, m, v) => console.log(`    ${che.padEnd(58)} ${String(m).padStart(9)}   ${v}`);
riga('scala del disco (kpc)', num(VL.raggioDisco), '2,6 ± 0,5'); riga('velocità di rotazione a 8 kpc (km/s)', num(curvaRotazione(VL, 8)), '220–240');
riga('massa in stelle (10¹⁰ M☉)', num(VL.massaStelle / 1e10), '5–6'); riga('gas freddo (10¹⁰ M☉)', num(VL.massaGas / 1e10), '≈ 1'); riga('stelle che nascono (M☉/anno)', num(VL.storia.sfr[PASSI]), '1,5–2');
riga('supernove al secolo (collasso + Ia)', `${num(100 * VL.ritmoSN.collasso, 2)} + ${num(100 * VL.ritmoSN.Ia, 2)}`, '≈ 2 (1,5 + 0,5)'); riga('Z a 8 kpc, 4,6 Ga fa (Z☉)', num(metallicita(VL, ADESSO - 4.6e9, 8)), '1');
riga('gradiente di Z oggi, 4–12 kpc (dex/kpc)', num(Math.log10(metallicita(VL, ADESSO, 12) / metallicita(VL, ADESSO, 4)) / 8, 2), '−0,05'); riga('bracci · passo (gradi)', `${VL.bracci.numero} · ${num((VL.bracci.passo * 180) / Math.PI, 2)}`, '2–4 · 12–25');
riga('barra (kpc)', VL.barra ? num(VL.barra.raggio) : 'no', '≈ 5'); riga('buco nero centrale (M☉)', num(VL.buco.M), '4,3·10⁶ (qui: senza sferoide resta il germe)'); riga('gas caldo nell\'alone (10¹⁰ M☉)', num(VL.massaCalda / 1e10), '2–10 (incerto)');
void GK;
console.log(`\n${ok} prove superate`);
