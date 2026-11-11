// test_chimica.mjs — la chimica: legami, equilibrio dei gas, atmosfere, minerali, chimica prebiotica
import assert from 'node:assert/strict';
import { ELEMENTI, abbondanze, energiaLegame, tipoLegame, carattereIonico, MOLECOLE, REAZIONI, costanteEquilibrio, pressioneVapore, pressioneCO2Urey, ferroStabile, equilibrio, potereRiducente, atmosfera, minerali, coloreRoccia, prebiotica, SOLE as SOLE_CHIMICA, CROSTA_PPM, ELLINGHAM, formazione, riduzione, combustione } from '../src/camera/chimica.js';
import { clima, LSOLE, UA } from '../src/camera/leggi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const vicino = (a, b, rel) => Math.abs(a - b) <= rel * Math.abs(b);
// i gas con le proporzioni del Sole: quasi tutto idrogeno
const ab = abbondanze(1), SOLE = { H: ab.H, He: ab.He, C: ab.C, N: ab.N, O: ab.O, S: ab.S };
// quanta parte di un elemento sta in una specie
const quota = (gas, el, f) => ((MOLECOLE[f].atomi[el] || 0) * (gas[f] || 0)) / Object.keys(gas).reduce((s, k) => s + (MOLECOLE[k].atomi[el] || 0) * gas[k], 0);

prova('la tavola: i quindici elementi dei pianeti più i dieci metalli della tecnica, e i pesanti crescono con la metallicità', () => {
  assert.deepEqual(Object.keys(ELEMENTI), ['H', 'He', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Ti', 'Ni', 'Cu', 'Zn', 'As', 'Ag', 'Sn', 'Au', 'Hg', 'Pb']);
  // i dieci aggiunti NON entrano nella miscela del Sole: Z resta quello di prima (0,011947) e con lui ogni pianeta
  assert.ok(Math.abs(SOLE_CHIMICA.Z - 0.011946985304955738) < 1e-15, `Z del Sole ${SOLE_CHIMICA.Z}`);
  assert.equal(Object.keys(ab).length, 15); assert.equal(Object.keys(abbondanze(1, { tracce: true })).length, 25);
  assert.ok(ELEMENTI.Cu.abbondanza < 1e-7 && ELEMENTI.Ni.abbondanza > ELEMENTI.Cu.abbondanza && ELEMENTI.Au.abbondanza < ELEMENTI.Pb.abbondanza && CROSTA_PPM.Cu > CROSTA_PPM.Sn && CROSTA_PPM.Au < 0.01);
  for (const e of Object.values(ELEMENTI)) assert.ok(e.massa > 0 && e.abbondanza > 0 && Number.isInteger(e.valenza), e.simbolo);
  const a2 = abbondanze(2);
  assert.equal(a2.H, ab.H); assert.equal(a2.He, ab.He); assert.ok(vicino(a2.Fe, 2 * ab.Fe, 1e-12) && vicino(a2.O, 2 * ab.O, 1e-12));
  assert.ok(ab.O > ab.C && ab.C > ab.N && ab.N > ab.Fe && vicino(ab.Mg / ab.Si, 1.23, 0.02), 'l\'ordine del Sole: O, C, N; Mg/Si ≈ 1,23');
  assert.ok(Object.keys(MOLECOLE).length >= 25 && vicino(MOLECOLE.H2O.massa, 18.015, 1e-3) && MOLECOLE.CH3OH.atomi.H === 4 && MOLECOLE.Mg2SiO4.atomi.O === 4);
});

prova('i legami: Pauling dà H–Cl entro il 10% del vero; NaCl ionico, H2 covalente, l\'acqua polare', () => {
  const HCl = energiaLegame('H', 'Cl'), CH = energiaLegame('C', 'H');
  assert.ok(vicino(HCl, 431, 0.10), `H–Cl ${HCl} kJ/mol (misurato 431)`);
  assert.ok(vicino(CH, 413, 0.10), `C–H ${CH} kJ/mol (misurato 413)`);
  assert.equal(energiaLegame('H', 'H'), 436); assert.equal(energiaLegame('Cl', 'H'), HCl); assert.equal(energiaLegame('He', 'H'), 0);
  assert.equal(tipoLegame('Na', 'Cl'), 'ionico'); assert.equal(tipoLegame('H', 'H'), 'covalente'); assert.equal(tipoLegame('O', 'H'), 'polare'); assert.equal(tipoLegame('C', 'H'), 'covalente');
  assert.ok(carattereIonico('Na', 'Cl') > 0.5 && carattereIonico('H', 'H') === 0);
  console.log(`      H–Cl ${HCl.toFixed(1)} kJ/mol (431), C–H ${CH.toFixed(1)} (413)`);
});

prova('le costanti di equilibrio: l\'acqua bolle a 100 °C, e Venere sta sull\'equilibrio di Urey', () => {
  // ΔG di formazione dell'acqua a 298 K: −228,6 kJ/mol (misurato)
  assert.ok(vicino(-0.5 * 8.314 * 298.15 * Math.log(costanteEquilibrio('acqua', 298.15)), 228600, 0.005));
  assert.ok(vicino(pressioneVapore(373.15), 101325, 0.15) && vicino(pressioneVapore(288), 1700, 0.1), `vapore: ${pressioneVapore(373.15)} Pa a 373 K, ${pressioneVapore(288)} Pa a 288 K`);
  assert.ok(pressioneVapore(200) < 1 && pressioneCO2Urey(288) < 1 && pressioneCO2Urey(735) > 3e6 && pressioneCO2Urey(735) < 3e7, `Urey a 735 K: ${pressioneCO2Urey(735) / 1e5} bar`);
  // il ferro: metallo senza ossigeno, ruggine rossa all'aria
  assert.equal(ferroStabile(300, 0.2).formula, 'Fe2O3'); assert.equal(ferroStabile(300, 1e-95).formula, 'Fe'); assert.equal(ferroStabile(1200, 1e-10).formula, 'Fe3O4');
});

prova('l\'equilibrio con i rapporti del Sole: a 1500 K il carbonio è CO, a 400 K è metano e l\'azoto ammoniaca', () => {
  const caldo = equilibrio({ T: 1500, P: 1e5, elementi: SOLE }), freddo = equilibrio({ T: 400, P: 1e5, elementi: SOLE });
  assert.ok(caldo.CO > caldo.CH4 && caldo.CO > caldo.CO2 && quota(caldo, 'C', 'CO') > 0.5, `a 1500 K: CO ${caldo.CO}, CH4 ${caldo.CH4}`);
  assert.ok(freddo.CH4 > 100 * freddo.CO && freddo.CH4 > 100 * freddo.CO2 && quota(freddo, 'C', 'CH4') > 0.99, `a 400 K: CH4 ${freddo.CH4}, CO ${freddo.CO}`);
  assert.ok(quota(freddo, 'N', 'NH3') > 0.5 && quota(caldo, 'N', 'N2') > 0.9, `azoto in NH3 a 400 K: ${quota(freddo, 'N', 'NH3')}`);
  assert.ok(caldo.H2 > 0.8 && freddo.H2 > 0.8 && quota(freddo, 'O', 'H2O') > 0.99 && quota(freddo, 'S', 'H2S') > 0.99);
  console.log(`      1500 K: CO ${(100 * quota(caldo, 'C', 'CO')).toFixed(1)}% del carbonio, CH4 ${(100 * quota(caldo, 'C', 'CH4')).toFixed(1)}%;  400 K: CH4 ${(100 * quota(freddo, 'C', 'CH4')).toFixed(3)}%, NH3 ${(100 * quota(freddo, 'N', 'NH3')).toFixed(3)}% dell'azoto`);
});

prova('l\'equilibrio è vero: le frazioni sommano a 1, gli atomi si conservano, le quattro reazioni stanno alle loro K', () => {
  for (const T of [600, 1100, 1500, 2200]) for (const P of [1e3, 1e5, 1e7]) {
    const r = equilibrio({ T, P, elementi: SOLE, dettagli: true }), g = r.gas, p = (f) => (g[f] * P) / 1e5, tot = Object.values(SOLE).reduce((a, v) => a + v, 0);
    assert.ok(Math.abs(Object.values(g).reduce((a, v) => a + v, 0) - 1) < 1e-9);
    for (const e in SOLE) { let n = 0; for (const f in g) n += (MOLECOLE[f].atomi[e] || 0) * g[f]; assert.ok(vicino(n * r.moli, SOLE[e], 1e-8), `${e} a ${T} K`); }
    const Q = { metano: (p('CH4') * p('H2O')) / (p('CO') * p('H2') ** 3), ammoniaca: p('NH3') ** 2 / (p('N2') * p('H2') ** 3), gasDAcqua: (p('CO2') * p('H2')) / (p('CO') * p('H2O')), acqua: (p('H2') ** 2 * p('O2')) / p('H2O') ** 2 };
    for (const k in Q) assert.ok(vicino(Q[k], costanteEquilibrio(k, T), 1e-6), `${k} a ${T} K, ${P} Pa: ${Q[k]} contro ${costanteEquilibrio(k, T)}`);
    assert.equal(r.grafite, 0); assert.ok(tot > 0);
  }
  assert.ok(Object.keys(REAZIONI).length >= 4);
  // la pressione spinge verso meno molecole (Le Châtelier): più metano a 100 bar che a 0,01
  assert.ok(equilibrio({ T: 1100, P: 1e7, elementi: SOLE }).CH4 > 10 * equilibrio({ T: 1100, P: 1e3, elementi: SOLE }).CH4);
});

prova('senza idrogeno (C, N, O soli): anidride carbonica e azoto; con troppo carbonio, fuliggine', () => {
  for (const T of [300, 400, 1000]) {
    const g = equilibrio({ T, P: 1e5, elementi: { C: 1, N: 1, O: 2 } });
    assert.ok(vicino(g.CO2, 2 / 3, 1e-3) && vicino(g.N2, 1 / 3, 1e-3), `a ${T} K: CO2 ${g.CO2}, N2 ${g.N2}`);
    assert.ok(!('H2' in g) && !('CH4' in g) && g.CO < 1e-6 && g.O2 < 1e-6 && g.NO < 1e-6);
  }
  const r = equilibrio({ T: 800, P: 1e5, elementi: { C: 2, N: 1, O: 1 }, dettagli: true });
  assert.ok(r.grafite > 0.5 && r.grafite < 1 && r.gas.CO2 > r.gas.CO, `grafite ${r.grafite}`);
  assert.deepEqual(equilibrio({ T: 800, elementi: {} }), {});
});

// i pianeti di prova, con il clima calcolato da leggi.js
const pianeta = (tipo, massaKg, raggioM, ua, composizione) => ({ tipo, massaKg, raggioM, composizione, clima: clima({ Lw: LSOLE, aM: ua * UA, massaKg, raggioM, tipo, acqua: composizione.acqua ?? 0 }) });
const TERRA = pianeta('roccioso', 5.97e24, 6.371e6, 1, { ferro: 0.32, roccia: 0.66, acqua: 0.02 });
const SUPERTERRA = pianeta('roccioso', 8 * 5.97e24, 1.8 * 6.371e6, 5, { ferro: 0.32, roccia: 0.66, acqua: 0.02 }); // massiccia e fredda
const GIOVE = pianeta('gassoso', 1.9e27, 7e7, 5.2, { idrogeno: 0.71, elio: 0.27, pesanti: 0.02 });
const LUNA = pianeta('roccioso', 7.3e22, 1.737e6, 1, { ferro: 0.1, roccia: 0.9, acqua: 0 });
const mostra = (gas) => Object.entries(gas).slice(0, 5).map(([f, v]) => `${f} ${v < 1e-3 ? v.toExponential(1) : (100 * v).toFixed(1) + '%'}`).join(', ');

prova('l\'atmosfera di una «Terra»: l\'idrogeno fugge, resta aria ossidata di azoto, con il vapore e poca CO2', () => {
  assert.ok(!TERRA.clima.tenuti.includes('idrogeno') && TERRA.clima.acqua === 'liquida');
  const a = atmosfera(TERRA), somma = Object.values(a.gas).reduce((s, v) => s + v, 0);
  assert.equal(a.riducente, false); assert.ok(a.potere < 0.01 && Math.abs(somma - 1) < 1e-9);
  assert.ok(!(a.gas.H2 > 1e-9) && !(a.gas.CH4 > 1e-9) && !(a.gas.NH3 > 1e-9), 'niente idrogeno, metano, ammoniaca');
  assert.ok(a.gas.N2 > 0.9 && a.gas.H2O > 0.001 && a.gas.H2O < 0.05 && a.gas.CO2 < 1e-3, mostra(a.gas));
  assert.equal(a.ferro.formula, 'Fe2O3', 'il ferro all\'aria arrugginisce');
  console.log(`      Terra: ${mostra(a.gas)}`);
  // senza mare (l'acqua è vapore) la CO2 resta nell'aria e l'acqua si perde: Venere
  const venere = atmosfera({ ...TERRA, clima: { ...TERRA.clima, T: 735, pressione: 9.2e6, acqua: 'vapore' } });
  assert.ok(venere.gas.CO2 > 0.9 && venere.gas.N2 > 0.01 && venere.gas.N2 < 0.1 && !venere.riducente, mostra(venere.gas));
  console.log(`      la stessa, calda e senza mare: ${mostra(venere.gas)}`);
  assert.deepEqual(atmosfera(LUNA).gas, {}); assert.equal(atmosfera(LUNA).riducente, false);
});

prova('un pianeta massiccio e freddo trattiene l\'idrogeno: aria riducente, con metano e ammoniaca', () => {
  for (const P of [SUPERTERRA, GIOVE]) {
    assert.ok(P.clima.tenuti.includes('idrogeno'));
    const a = atmosfera(P);
    assert.equal(a.riducente, true); assert.ok(a.potere > 0.9 && a.gas.H2 > 0.8 && a.gas.CH4 > 1e-4 && a.gas.NH3 > 1e-6 && !(a.gas.CO2 > 1e-9), mostra(a.gas)); // (l'ammoniaca: a 124 K, dove ora il clima per fasce mette la super-Terra coperta di ghiaccio, quasi tutta è gelata)
    assert.ok(Math.abs(Object.values(a.gas).reduce((s, v) => s + v, 0) - 1) < 1e-9);
  }
  assert.ok(vicino(atmosfera(GIOVE).gas.He, 0.146, 0.1) && !(atmosfera(GIOVE).gas.H2O > 1e-6), 'l\'elio del Sole; l\'acqua è scesa nelle nuvole');
  // più metalli nella stella, più metano
  assert.ok(vicino(atmosfera(GIOVE, { Z: 3 }).gas.CH4 / atmosfera(GIOVE, { Z: 1 }).gas.CH4, 3, 0.02));
  console.log(`      super-Terra fredda: ${mostra(atmosfera(SUPERTERRA).gas)}`);
});

prova('la chimica prebiotica: in aria riducente rende almeno 100 volte più che in aria ossidata', () => {
  const rid = prebiotica({ atmosfera: { CH4: 0.4, NH3: 0.4, H2: 0.1, H2O: 0.1 }, T: 300, energia: 1 });
  const oss = prebiotica({ atmosfera: { CO2: 0.8, N2: 0.15, H2O: 0.05 }, T: 300, energia: 1 });
  assert.ok(potereRiducente({ CH4: 0.4, NH3: 0.4, H2: 0.1, H2O: 0.1 }) > 0.99 && potereRiducente({ CO2: 0.8, N2: 0.15, H2O: 0.05 }) === 0);
  assert.ok(rid.HCN >= 100 * oss.HCN && oss.HCN > 0, `HCN: ${rid.HCN} contro ${oss.HCN}`);
  assert.ok(rid.formaldeide >= 100 * oss.formaldeide && oss.formaldeide > 0, `formaldeide: ${rid.formaldeide} contro ${oss.formaldeide}`);
  console.log(`      HCN ${(rid.HCN / oss.HCN).toFixed(0)} volte, formaldeide ${(rid.formaldeide / oss.formaldeide).toFixed(0)} volte`);
  // cresce con l'energia, e con l'idrogeno quando l'aria è di CO2 (Schlesinger e Miller)
  assert.ok(vicino(prebiotica({ atmosfera: { CH4: 0.4, NH3: 0.4, H2: 0.1, H2O: 0.1 }, energia: 3 }).HCN, 3 * rid.HCN, 1e-9));
  const m = (h) => prebiotica({ atmosfera: { CO2: 0.3, H2: h, N2: 0.3, H2O: 0.1 } }).HCN;
  assert.ok(m(0) < m(0.1) && m(0.1) < m(0.3) && m(0.3) < m(1.2));
  // il formosio: formaldeide, acqua liquida, un minerale basico
  assert.equal(rid.autocatalisi, true); assert.equal(oss.autocatalisi, false);
  assert.equal(prebiotica({ atmosfera: { CH4: 0.4, NH3: 0.4, H2: 0.1, H2O: 0.1 }, T: 220 }).autocatalisi, false, 'gelato: niente acqua liquida');
  assert.equal(prebiotica({ atmosfera: { CH4: 0.4, NH3: 0.4, H2: 0.1, H2O: 0.1 }, T: 300, minerali: [{ nome: 'quarzo', frazione: 1 }] }).autocatalisi, false, 'solo quarzo: niente minerale basico');
  // e sui pianeti: la Terra ossidata non ne fa, il gigante sì (ma non ha acqua liquida)
  assert.ok(prebiotica({ atmosfera: atmosfera(GIOVE), T: GIOVE.clima.T }).HCN > 100 * prebiotica({ atmosfera: atmosfera(TERRA), T: TERRA.clima.T }).HCN);
  assert.equal(prebiotica({ atmosfera: atmosfera(GIOVE), T: GIOVE.clima.T }).autocatalisi, false);
});

prova('i minerali: le frazioni sommano a 1; il ferro ossidato è ematite rossa; sotto 170 K con acqua c\'è il ghiaccio', () => {
  const comp = { ferro: 0.32, roccia: 0.66, acqua: 0.02 }, nomi = (l) => l.map((m) => m.nome), di = (l, n) => l.find((m) => m.nome === n)?.frazione || 0;
  const casi = [{ composizione: comp, T: 288, ossidato: true, acqua: 'liquida' }, { composizione: comp, T: 288, ossidato: false, acqua: 'assente' }, { composizione: comp, T: 120, ossidato: false, acqua: 'ghiaccio' },
    { composizione: { ghiaccio: 0.6, roccia: 0.3, ferro: 0.1 }, T: 60 }, { composizione: comp, T: 500, ossidato: true, acqua: 'vapore' }, { composizione: comp, ossidato: 0.8 }, { composizione: { ferro: 0.5, roccia: 0.5 }, ossidato: 0 }, {}];
  for (const c of casi) {
    const l = minerali(c);
    assert.ok(Math.abs(l.reduce((s, m) => s + m.frazione, 0) - 1) < 1e-9 && l.length >= 3);
    for (const m of l) assert.ok(m.frazione > 0 && m.colore.length === 3 && m.colore.every((v) => v >= 0 && v <= 255) && typeof m.formula === 'string', m.nome);
    for (let i = 1; i < l.length; i++) assert.ok(l[i].frazione <= l[i - 1].frazione);
  }
  // con ferro e ossidazione: un ossido rossastro
  const rosso = minerali(casi[0]).find((m) => m.nome === 'ematite');
  assert.ok(rosso && rosso.frazione > 0.03 && rosso.colore[0] > 1.5 * rosso.colore[1] && rosso.colore[0] > 1.5 * rosso.colore[2], 'l\'ematite è rossa');
  assert.ok(!nomi(minerali(casi[1])).includes('ematite') && nomi(minerali(casi[1])).includes('ferro metallico'), 'senza ossigeno: ferro metallico, niente ruggine');
  assert.ok(nomi(minerali(casi[5])).includes('magnetite'), 'ossidazione a metà: magnetite');
  assert.ok(di(minerali({ composizione: { ferro: 0.5, roccia: 0.5 }, ossidato: true }), 'ematite') > di(minerali({ composizione: { ferro: 0.2, roccia: 0.8 }, ossidato: true }), 'ematite'), 'più ferro, più ematite');
  // sotto 170 K con acqua: ghiaccio; sopra, no; dove l'acqua è evaporata: i sali
  assert.ok(di(minerali(casi[2]), 'ghiaccio d\'acqua') > 0.3 && di(minerali(casi[3]), 'ghiaccio d\'acqua') > 0.8);
  assert.ok(di(minerali({ composizione: { ferro: 0.3, roccia: 0.7 }, T: 150, acqua: true }), 'ghiaccio d\'acqua') > 0.3, 'acqua: true');
  assert.equal(di(minerali({ composizione: comp, T: 150, acqua: false }), 'ghiaccio d\'acqua'), 0); assert.equal(di(minerali(casi[0]), 'ghiaccio d\'acqua'), 0);
  assert.ok(di(minerali(casi[4]), 'salgemma') > 0.05 && di(minerali(casi[4]), 'gesso') > 0 && di(minerali(casi[0]), 'salgemma') === 0);
  // i continenti sono feldspati e quarzo; i fondali pirosseno e plagioclasio
  const granito = minerali({ composizione: comp, continente: 1 }), basalto = minerali({ composizione: comp, continente: 0 });
  assert.ok(di(granito, 'quarzo') + di(granito, 'plagioclasio') + di(granito, 'feldspato potassico') > 0.85 && di(granito, 'feldspato potassico') > 2 * di(basalto, 'feldspato potassico'));
  assert.ok(di(basalto, 'pirosseno') > 0.3 && di(basalto, 'quarzo') < di(granito, 'quarzo') / 3);
  // olivina e pirosseno secondo Mg/Si (nella roccia del mantello, e nelle lave)
  const ol = (MgSi, fusione) => { const l = minerali({ composizione: { ferro: 0.32, roccia: 0.68, MgSi }, fusione }); return [di(l, 'olivina'), di(l, 'pirosseno'), di(l, 'quarzo')]; };
  assert.ok(ol(0.5, 1)[0] === 0 && ol(0.5, 1)[2] > 0 && ol(1.23, 1)[0] > 0.4 && ol(1.23, 1)[2] === 0 && ol(1.8, 1)[0] > ol(1.23, 1)[0] && ol(1.8, 1)[1] < ol(1.23, 1)[1], `olivina nel mantello: ${ol(0.5, 1)[0]}, ${ol(1.23, 1)[0]}, ${ol(1.8, 1)[0]}`);
  console.log(`      il mantello (Mg/Si del Sole): olivina ${(100 * ol(1.23, 1)[0]).toFixed(0)}%, pirosseno ${(100 * ol(1.23, 1)[1]).toFixed(0)}%`);
  assert.ok(ol(3)[0] > ol(2)[0] && ol(2)[0] > ol(1.23)[0]);
});

prova('il colore della roccia: la ruggine arrossa, il ghiaccio schiarisce, un solo minerale ha il suo colore', () => {
  const comp = { ferro: 0.32, roccia: 0.66, acqua: 0.02 };
  const grigio = coloreRoccia(minerali({ composizione: comp, ossidato: false, continente: 0 })), rosso = coloreRoccia(minerali({ composizione: comp, ossidato: true, continente: 0 }));
  const chiaro = coloreRoccia(minerali({ composizione: comp, ossidato: false, continente: 1 })), gelo = coloreRoccia(minerali({ composizione: { ghiaccio: 0.6, roccia: 0.3, ferro: 0.1 }, T: 60 }));
  assert.ok(Math.max(...grigio) - Math.min(...grigio) < 25 && grigio[0] < 130, `il basalto è grigio scuro: ${grigio}`);
  assert.ok(rosso[0] > 1.25 * rosso[1] && rosso[1] > rosso[2], `ossidato è rossastro: ${rosso}`);
  assert.ok(chiaro[0] > grigio[0] + 20 && gelo.every((v) => v > 180), `granito ${chiaro}, ghiaccio ${gelo}`);
  assert.deepEqual(coloreRoccia([{ nome: 'ematite', frazione: 1, colore: [152, 62, 42] }]), [152, 62, 42]);
  // basta poco minerale scuro a scurire molto (Kubelka-Munk): meno della media dei colori
  assert.ok(coloreRoccia([{ frazione: 0.9, colore: [220, 220, 220] }, { frazione: 0.1, colore: [40, 40, 40] }])[0] < 0.9 * 220 + 0.1 * 40 - 30);
  console.log(`      basalto ${grigio}, ossidato ${rosso}, granito ${chiaro}, ghiaccio ${gelo}`);
});

prova('i metalli: i minerali di Robie e Hemingway stanno in MOLECOLE, e il ΔG a 298 K torna da ΔH e S entro 3 kJ/mol', () => {
  for (const f of ['Cu2O', 'CuO', 'SnO2', 'PbO', 'ZnO', 'TiO2', 'NiO', 'PbS', 'ZnS', 'Cu2S', 'HgS', 'Ag2S', 'FeS2', 'PbCO3', 'ZnCO3', 'Cu2CO5H2', 'Au', 'Cu']) assert.ok(MOLECOLE[f] && MOLECOLE[f].fase === 'solido' && MOLECOLE[f].massa > 0, f);
  assert.ok(vicino(MOLECOLE.PbS.massa, 239.27, 1e-3) && MOLECOLE.Cu2CO5H2.atomi.O === 5);
  // ΔG°f(298) = ΔH − T·(S − Σ S degli elementi): la riga a 300 K della tabella di Ellingham deve tornare con ΔH e S di SPECIE
  const S_O2 = MOLECOLE.O2.S, righe = [['Cu2O', 'Cu', 2, 1], ['CuO', 'Cu', 1, 1], ['SnO2', 'Sn', 1, 2], ['PbO', 'Pb', 1, 1], ['ZnO', 'Zn', 1, 1], ['TiO2', 'Ti', 1, 2], ['NiO', 'Ni', 1, 1]]; let peggio = 0;
  for (const [f, m, x, y] of righe) { const dG = MOLECOLE[f].dH - 0.3 * (MOLECOLE[f].S - x * MOLECOLE[m].S - (y / 2) * S_O2), d = dG - formazione(f, 300)[0]; peggio = Math.max(peggio, Math.abs(d)); assert.ok(Math.abs(d) < 3, `${f}: ΔH − TΔS dà ${dG.toFixed(1)}, la tabella ${formazione(f, 300)[0]}`); }
  for (const f in ELLINGHAM) for (let i = 1; i < ELLINGHAM[f].length; i++) assert.ok(f === 'CO2' ? Math.abs(ELLINGHAM[f][i] - ELLINGHAM[f][i - 1]) < 0.5 : f === 'CO' ? ELLINGHAM[f][i] < ELLINGHAM[f][i - 1] : ELLINGHAM[f][i] > ELLINGHAM[f][i - 1], `${f} a ${300 + 100 * i} K: gli ossidi salgono, il CO scende, il CO2 sta fermo`);
  console.log(`      ΔG°f a 300 K da ΔH e S: scarto massimo ${peggio.toFixed(1)} kJ/mol su ${righe.length} ossidi`);
});

prova('Ellingham: il carbone riduce il rame a 90 °C, il piombo a 300, lo stagno a 640, il ferro a 650-770, lo zinco a 950; silicio e alluminio no', () => {
  const C = (K) => K - 273.15, incroci = { Cu2O: [90, 15], PbO: [300, 20], SnO2: [640, 20], ZnO: [950, 20], SiO2: [1670, 40], Al2O3: [2035, 40] }, righe = [];
  for (const f in incroci) { const r = riduzione(f, 1200), [atteso, tol] = incroci[f]; assert.ok(Math.abs(C(r.temperaturaMinima) - atteso) <= tol, `${f}: incrocio con C → CO a ${C(r.temperaturaMinima).toFixed(0)} °C (atteso ${atteso})`); righe.push(`${f} ${C(r.temperaturaMinima).toFixed(0)} °C${r.estrapolato ? ' (estrapolato)' : ''}`); }
  for (const f of ['FeO', 'Fe3O4', 'Fe2O3']) { const t = C(riduzione(f, 1200).temperaturaMinima); assert.ok(t >= 650 && t <= 770, `${f}: ${t.toFixed(0)} °C (atteso 650-770)`); righe.push(`${f} ${t.toFixed(0)} °C`); }
  // l'ordine della storia: rame e piombo prima, poi stagno e ferro, poi zinco; silicio, alluminio, titanio fuori dalla portata di un forno a carbone
  const T = (f) => riduzione(f, 1200).temperaturaMinima; assert.ok(T('Cu2O') < T('PbO') && T('PbO') < T('SnO2') && T('SnO2') < T('FeO') && T('FeO') < T('ZnO') && T('ZnO') < T('SiO2') && T('SiO2') < T('Al2O3'));
  assert.ok(riduzione('SiO2', 1500).conCarbonio === false && riduzione('Al2O3', 1800).conCarbonio === false && riduzione('TiO2', 1500).conCarbonio === false && riduzione('Cu2O', 500).conCarbonio === true && riduzione('ZnO', 1000).conCarbonio === false && riduzione('ZnO', 1300).conCarbonio === true);
  assert.ok(riduzione('SiO2', 1200).estrapolato && !riduzione('SnO2', 1200).estrapolato);
  // il rapporto minimo CO/CO2 a 1200 K (misurati, dal diagramma: Cu 6·10⁻⁵, Sn 0,21, Fe 2,3, Zn ~100)
  const rapporti = { Cu2O: 6e-5, SnO2: 0.21, FeO: 2.3, ZnO: 100 }, out = [];
  for (const f in rapporti) { const r = riduzione(f, 1200).rapportoCOCO2; assert.ok(r > rapporti[f] / 1.3 && r < rapporti[f] * 1.3, `${f}: CO/CO2 minimo ${r} (atteso ${rapporti[f]})`); out.push(`${f} ${r.toPrecision(2)}`); }
  // con il gas del forno: un fuoco povero di CO (1:10) riduce il rame ma non il ferro; uno ricco (4:1) anche il ferro, non lo zinco
  assert.ok(riduzione('Cu2O', 1200, { CO: 1, CO2: 10 }).riduce && !riduzione('FeO', 1200, { CO: 1, CO2: 10 }).riduce && riduzione('FeO', 1200, { CO: 4, CO2: 1 }).riduce && !riduzione('ZnO', 1200, { CO: 4, CO2: 1 }).riduce && riduzione('SnO2', 1200).riduce === null);
  // all'aria (pO2 0,21 bar) nessuno di questi ossidi si disfa da solo a 1200 K; l'ematite cede ossigeno prima della wüstite
  for (const f in ELLINGHAM) if (f !== 'CO' && f !== 'CO2') assert.ok(riduzione(f, 1200).pO2 < 0.21, f);
  assert.ok(riduzione('Fe2O3', 1200).rapportoCOCO2 < riduzione('Fe3O4', 1200).rapportoCOCO2 && riduzione('Fe3O4', 1200).rapportoCOCO2 < riduzione('FeO', 1200).rapportoCOCO2);
  assert.throws(() => riduzione('UO2', 1200), /tabella di formazione/);
  console.log(`      incrocio con C → CO: ${righe.join(', ')}`); console.log(`      CO/CO2 minimo a 1200 K: ${out.join(', ')}`);
});

prova('il fuoco: regge dal 16% di ossigeno in su (misurato), la pressione conta poco, l\'anidride carbonica spegne più dell\'azoto', () => {
  const aria = (O2, inerte = 'N2', pressione = 101325) => ({ gas: { O2, [inerte]: 1 - O2 }, pressione });
  const t = combustione(aria(0.21)); assert.ok(t.regge && t.piena && vicino(t.soglia, 0.16, 1e-9) && vicino(t.sogliaPiena, 0.185, 1e-9) && t.temperaturaFiamma > 2000 && t.temperaturaFiamma < 2700 && /misurata/.test(t.nota));
  assert.ok(!combustione(aria(0.15)).regge && combustione(aria(0.17)).regge && !combustione(aria(0.17)).piena && !combustione(aria(0)).regge && !combustione({ gas: { CO2: 0.96, N2: 0.04 }, pressione: 9e6 }).regge);
  // la pressione: a mezza atmosfera la soglia sale di poco (P^−0,1: 7%), non del doppio come se contasse la pressione parziale
  const m = combustione(aria(0.21, 'N2', 5e4)); assert.ok(m.soglia > 0.16 && m.soglia < 0.18 && m.regge, `soglia a 0,5 bar ${m.soglia}`);
  assert.ok(combustione(aria(0.21, 'N2', 2e4)).fuoriIntervallo && !t.fuoriIntervallo);
  // il gas inerte: con CO2 la soglia sale di 14,5/12 (Zabetakis 1965), con l'argo o l'elio scende
  const c = combustione(aria(0.18, 'CO2')), a = combustione(aria(0.18, 'Ar')); assert.ok(vicino(c.soglia / 0.16, 14.5 / 12, 0.01) && !c.regge && a.soglia < 0.16 && a.regge, `CO2 ${c.soglia}, Ar ${a.soglia}`);
  // le arie dei pianeti di qui: quella ossidata della «Terra» calcolata (senza vita: niente O2) non regge un fuoco
  assert.ok(!combustione({ gas: atmosfera(TERRA).gas, pressione: 101325 }).regge);
  console.log(`      soglia: aria ${(t.soglia * 100).toFixed(1)}%, a 0,5 bar ${(m.soglia * 100).toFixed(1)}%, in CO2 ${(c.soglia * 100).toFixed(1)}%, in argo ${(a.soglia * 100).toFixed(1)}%; fiamma in aria ${t.temperaturaFiamma.toFixed(0)} K`);
});

prova('è leggero: ogni chiamata sotto 20 ms', () => {
  const tempo = (f) => { const t0 = performance.now(); f(); return performance.now() - t0; };
  let peggio = 0;
  for (const T of [150, 300, 700, 1500, 3000]) for (const P of [1, 1e5, 1e8]) peggio = Math.max(peggio, tempo(() => equilibrio({ T, P, elementi: SOLE })), tempo(() => equilibrio({ T, P, elementi: { H: 1.1, C: 0.21, N: 0.018, O: 1.21, S: 0.014 } })));
  for (const P of [TERRA, SUPERTERRA, GIOVE, LUNA]) peggio = Math.max(peggio, tempo(() => atmosfera(P)), tempo(() => prebiotica({ atmosfera: atmosfera(P), T: P.clima.T })));
  for (const f in ELLINGHAM) if (f !== 'CO' && f !== 'CO2') peggio = Math.max(peggio, tempo(() => riduzione(f, 1200, { CO: 1, CO2: 1 })), tempo(() => combustione({ gas: { O2: 0.21, N2: 0.79 } })));
  peggio = Math.max(peggio, tempo(() => coloreRoccia(minerali({ composizione: TERRA.composizione, T: 288, ossidato: true, acqua: 'liquida' }))));
  assert.ok(peggio < 20, `la chiamata più lenta: ${peggio} ms`);
  console.log(`      la più lenta: ${peggio.toFixed(2)} ms`);
});

console.log(`chimica: ${ok} prove, tutto ok`);
