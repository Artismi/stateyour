// test_materia.mjs — le particelle dentro la materia: i numeri veri (percorsi, attività, raggi cosmici, aloni, tracce di
// fissione, reticoli, incanalamento) e le celle che il motore simula
import assert from 'node:assert/strict';
import * as M from '../src/camera/materia.js';
import { simulaMondo } from '../src/camera/mondo.js';
import { segmentiSezione } from '../src/camera/sezione.js';
import { sorgente } from '../src/camera/eventi.js';
import { caloreDellaRoccia, ANNO } from '../src/camera/leggi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);

// la Terra, per i luoghi di prova (ciò che cosmo.js dà di un pianeta)
const TERRA = { massaKg: 5.97e24, raggioM: 6.371e6, B0: 3.1e-5, Lw: 3.828e26, aM: 1.496e11, clima: { g: 9.81, pressione: 101325, T: 288, Teq: 255, acqua: 'liquida' },
  atmosfera: { gas: { N2: 0.781, O2: 0.209, Ar: 0.0093, CO2: 0.0004 } }, interno: { eta: 4.5e9, q: 0.087, B0: 3.1e-5, acquaKg: 1.4e21 } };
const ACQUA = M.mezzo({ tipo: 'acqua' }), ARIA = M.mezzo({ tipo: 'aria' }), BIOTITE = M.mezzo('biotite');
const GRANITO = [{ nome: 'quarzo', frazione: 0.3 }, { nome: 'feldspato potassico', frazione: 0.35 }, { nome: 'plagioclasio', frazione: 0.25 }, { nome: 'biotite', frazione: 0.1 }];
const MARE = M.luogoDaAcqua({ P: TERRA, totali: { K: 0.0102, Na: 0.469, Cl: 0.546 }, stato: { carbonio: 0.0022, pO2: 0.2 }, profonditaM: 10 });
const ROCCIA = M.luogoDaRoccia({ P: TERRA, continente: true, minerali: GRANITO, etaRoccia: 1.5e9 });
const CIELO = M.luogoDaAria({ P: TERRA });

prova('il mezzo dalla composizione: Z/A, potenziale di ionizzazione, lunghezza di radiazione', () => {
  tra(ACQUA.I, 73, 78, "I dell'acqua (eV; misurato 75,0)"); tra(ARIA.I, 84, 88, "I dell'aria (85,7)"); tra(M.mezzo('quarzo').I, 135, 145, 'I del quarzo (139,2)');
  tra(ACQUA.X0, 35, 37.5, "X0 dell'acqua (g/cm²; 36,08)"); tra(ARIA.X0, 35.5, 38, "X0 dell'aria (36,62)"); tra(M.mezzo('quarzo').X0, 26, 28.5, 'X0 del quarzo (27,05)');
  tra(ARIA.densita * 1000, 1.15, 1.3, "densità dell'aria (kg/m³)"); tra(ACQUA.ZsuA, 0.554, 0.556, "Z/A dell'acqua");
  assert.deepEqual(M.atomiDi('K(Mg1.5Fe1.5)AlSi3O10(OH)2'), { K: 1, Mg: 1.5, Fe: 1.5, Al: 1, Si: 3, O: 12, H: 2 });
});

prova('la frenata e il percorso contro le tabelle del NIST (PSTAR, ASTAR, ESTAR)', () => {
  // protoni in acqua: frenata totale (MeV·cm²/g) e percorso (g/cm²)
  for (const [E, S, R] of [[1, 260.8, 2.458e-3], [10, 45.67, 0.1230], [100, 7.289, 7.718], [1000, 2.211, 325.4]]) { tra(M.perdita('protone', E, ACQUA).totale / S, 0.97, 1.03, `protone ${E} MeV, frenata`); tra(M.percorso('protone', E, ACQUA).gcm2 / R, 0.96, 1.04, `protone ${E} MeV, percorso`); }
  // α: acqua, aria, quarzo
  for (const [m, E, R] of [[ACQUA, 5, 3.759e-3], [ACQUA, 8, 7.842e-3], [ARIA, 5, 4.368e-3], [ARIA, 8, 9.1e-3], [M.mezzo('quarzo'), 5, 5.298e-3], [M.mezzo('quarzo'), 8, 1.072e-2]]) tra(M.percorso('alfa', E, m).gcm2 / R, 0.95, 1.05, `α ${E} MeV in ${m.nome}`);
  // elettroni in acqua: 1 MeV → collisioni 1,849, irraggiamento 0,0129, percorso 0,4367 g/cm²
  const e = M.perdita('elettrone', 1, ACQUA); tra(e.elettronica, 1.8, 1.9, 'elettrone 1 MeV, collisioni'); tra(e.radiativa, 0.01, 0.016, 'elettrone 1 MeV, irraggiamento'); tra(M.percorso('elettrone', 1, ACQUA).gcm2, 0.42, 0.455, 'elettrone 1 MeV, percorso');
  // il minimo di ionizzazione di un muone in acqua (1,99 MeV·cm²/g) e la risalita relativistica
  tra(M.perdita('muone', 350, ACQUA).totale, 1.93, 2.08, 'muone al minimo'); tra(M.perdita('muone', 1e4, ACQUA).elettronica, 2.35, 2.6, 'muone a 10 GeV (2,48)');
});

prova('i percorsi di tutti i giorni: α da 5,3 MeV in aria, acqua e biotite; β del potassio-40 in acqua; frammenti di fissione', () => {
  tra(M.percorso('alfa', 5.3, ARIA).m * 100, 3.6, 4.2, 'α 5,3 MeV in aria (cm; misurato 3,9)');
  tra(M.percorso('alfa', 5.3, ACQUA).m * 1e6, 37, 43, 'α 5,3 MeV in acqua (µm; ~40)');
  tra(M.percorso('alfa', 5.3, BIOTITE).m * 1e6, 18, 25, 'α 5,3 MeV nella biotite (µm; 20–25)');
  tra(M.percorso('elettrone', 1.311, ACQUA).m * 1e3, 4, 8, 'β del K-40, energia massima (mm)'); tra(M.percorso('elettrone', 0.56, ACQUA).m * 1e3, 1.2, 3, 'β del K-40, energia media (mm)');
  tra(M.percorso('elettrone', 0.56, ACQUA).dritto / M.percorso('elettrone', 0.56, ACQUA).m, 0.2, 0.95, 'la traccia di un elettrone è tortuosa');
  const ap = M.mezzo('apatite'), tot = M.percorso({ Z: 38, A: 96 }, 99, ap).m + M.percorso({ Z: 54, A: 140 }, 68, ap).m;
  tra(tot * 1e6, 12, 24, "traccia di fissione nell'apatite, i due frammenti (µm; misurata dopo l'attacco chimico: 16–17)");
  tra(M.percorso({ Z: 90, A: 234 }, 0.072, BIOTITE).m * 1e9, 10, 60, 'rinculo del torio-234 nella biotite (nm; 20–40)');
  // la deviazione multipla: un muone da 1 GeV dopo 1 m d'acqua (Highland: ~1,3°), un elettrone da 1 MeV dopo 1 mm (molto di più)
  tra((M.deviazione('muone', 1000, ACQUA, 1) * 180) / Math.PI, 0.9, 1.8, 'deviazione di un muone (gradi)'); assert.ok(M.deviazione('elettrone', 1, ACQUA, 1e-3) > 0.2);
});

prova("la luce Cherenkov nell'acqua e nel ghiaccio; i raggi delta", () => {
  const mu = ACQUA.cherenkov('muone'), el = ACQUA.cherenkov('elettrone'), veloce = ACQUA.cherenkov('muone', 1e4);
  tra(mu.soglia, 52, 57, 'soglia del muone in acqua (MeV; 54)'); tra(el.soglia, 0.25, 0.27, "soglia dell'elettrone (MeV; 0,26)");
  tra(veloce.angolo, 41, 41.5, 'angolo a β = 1 (gradi; 41,2)'); tra(veloce.fotoniAlMetro / 100, 180, 260, 'fotoni visibili per cm (~210 tra 400 e 700 nm)');
  tra(M.mezzo('ghiaccio').cherenkov('muone', 1e4).angolo, 39.5, 40.5, 'nel ghiaccio (n = 1,309)'); tra(ARIA.cherenkov('muone').soglia, 4000, 4800, "soglia in aria (MeV; 4,4 GeV)");
  assert.equal(ACQUA.cherenkov('muone', 30).fotoniAlMetro, 0); assert.equal(M.mezzo('magnetite').cherenkov('muone'), null);
  const d = M.raggiDelta('muone', 1e4, ACQUA, 1); tra(d.alMetro, 5, 12, 'raggi delta sopra 1 MeV per metro (~8,5)'); tra(d.massima, 3000, 6000, 'energia massima ceduta a un elettrone (MeV)');
});

prova('la radioattività: K-40 nel mare, il granito, la coerenza con il calore di leggi.js', () => {
  const att = M.attivita(MARE), k40 = att.filter((a) => a.nuclide === 'potassio-40').reduce((s, a) => s + a.perKg, 0);
  tra(k40, 11, 13.5, "K-40 nell'acqua di mare (Bq per chilo; ~12)"); tra(att.find((a) => a.nuclide === 'uranio-238').perKg, 0.02, 0.08, 'U-238 nel mare (0,04 Bq/kg)');
  assert.ok(!att.some((a) => a.nuclide === 'torio-230'), "nell'acqua la catena è rotta: il torio non si scioglie");
  const granito = { tipo: 'roccia', minerali: GRANITO, elementi: { U: 3e-6, Th: 12e-6, K: 0.04 } };
  tra(M.calore(granito), 6e-10, 1.2e-9, 'calore del granito (W/kg; ~1·10⁻⁹)');
  // per chilo di elemento: uranio 98,5 µW, torio 26,3, potassio 3,33·10⁻³ (Dye 2012)
  tra(M.calore({ tipo: 'roccia', elementi: { U: 1 } }) * 1e6, 97, 100, 'uranio'); tra(M.calore({ tipo: 'roccia', elementi: { Th: 1 } }) * 1e6, 26, 26.6, 'torio'); tra(M.calore({ tipo: 'roccia', elementi: { K: 1 } }) * 1e9, 3.25, 3.4, 'potassio');
  // la stessa roccia delle condriti, la stessa età: il calore di leggi.js
  const c = M.coerenza(4.5e9); tra(c.scarto, -0.04, 0.04, 'scarto sul totale'); tra(c.totale, 0.96 * caloreDellaRoccia(4.5e9), 1.04 * caloreDellaRoccia(4.5e9), 'calore (W/kg)');
  for (const eta of [1e9, 3e9, 8e9]) tra(M.coerenza(eta).scarto, -0.05, 0.05, `scarto a ${eta / 1e9} miliardi di anni`);
  assert.ok(M.calore({ ...granito, etaPianeta: 1e9 }) > 2 * M.calore(granito), 'un pianeta giovane ha più nuclei: scalda di più');
  console.log(`      (calore di una roccia condritica: ${c.totale.toExponential(3)} W/kg contro ${c.totaleLeggi.toExponential(3)} di leggi.js: scarto ${(c.scarto * 100).toFixed(1)}%; per nuclide ${c.nuclidi.map((n, i) => `${n} ${(c.scarti[i] * 100).toFixed(1)}%`).join(', ')})`);
});

prova('le α delle catene e lo spettro β vengono dalle energie liberate', () => {
  const a = M.attivita({ tipo: 'roccia', elementi: { U: 1e-6, Th: 1e-6 } }), E = (n) => a.find((x) => x.nuclide === n && x.tipo === 'α').energia;
  for (const [n, keV] of [['uranio-238', 4198], ['uranio-234', 4774.6], ['torio-230', 4687], ['radio-226', 4784.3], ['radon-222', 5489.5], ['polonio-218', 6002.6], ['polonio-214', 7686.8], ['polonio-210', 5304.3], ['torio-232', 4012.3], ['polonio-212', 8784.9]]) tra(E(n) * 1000 - keV, -4, 4, `α del ${n} (keV)`);
  assert.equal(a.filter((x) => x.catena === 'uranio-238' && x.tipo === 'α').length, 8); assert.equal(a.filter((x) => x.catena === 'uranio-235' && x.tipo === 'α').length, 7);
  tra(a.filter((x) => x.catena === 'torio-232' && x.tipo === 'α').reduce((s, x) => s + x.perKg, 0) / a.find((x) => x.nuclide === 'torio-232').perKg, 5.99, 6.01, 'sei α per ogni torio-232');
  tra(a.find((x) => x.nuclide === 'uranio-238' && x.tipo === 'α').perKg, 12.2, 12.5, 'un ppm di uranio: 12,4 Bq/kg di U-238');
  tra(a.find((x) => x.tipo === 'fissione').perKg / a.find((x) => x.nuclide === 'uranio-238' && x.tipo === 'α').perKg, 5.3e-7, 5.6e-7, 'una fissione ogni 1,8 milioni di α');
  tra(M.spettroBeta(1.3111, 20, 3).media, 0.53, 0.6, 'energia media del β del K-40 (MeV; 0,560)'); tra(M.spettroBeta(0.15648, 7).media, 0.047, 0.052, 'del C-14 (0,0495)');
});

prova('i raggi cosmici: muoni al livello del mare, sotto terra, con il campo, senza aria', () => {
  const suolo = M.raggiCosmici(CIELO);
  tra((suolo.muoni * 60) / 1e4, 0.5, 1.5, 'muoni al livello del mare (per cm² al minuto; ~1)'); tra(suolo.muoniVerticali, 60, 130, 'intensità verticale (per m²·s·sr; 70 sopra 1 GeV, ~100 in tutto)');
  tra(suolo.quotaNascita / 1000, 12, 20, 'quota a cui nasce uno sciame (km; ~15)'); tra(suolo.colonnaAria, 1000, 1060, "colonna d'aria (g/cm²)");
  // sotto l'acqua: il flusso misurato (Mei e Hime 2006) è 67,97e-6·e^(−h/0,285) + 2,071e-6·e^(−h/0,698) per cm²·s, h in km
  const misurato = (h) => (67.97e-6 * Math.exp(-h / 0.285) + 2.071e-6 * Math.exp(-h / 0.698)) * 1e4;
  for (const km of [1, 2.5]) { const sotto = M.raggiCosmici({ ...CIELO, sopra: { acquaM: km * 1000 } }); tra(sotto.muoni / misurato(km), 1 / 3, 3, `muoni sotto ${km} km d'acqua, rispetto al misurato`); }
  const unKm = M.raggiCosmici({ ...CIELO, sopra: { acquaM: 1000 } }), dueEMezzo = M.raggiCosmici({ ...CIELO, sopra: { acquaM: 2500 } });
  tra(suolo.muoni / unKm.muoni, 2e3, 2.5e4, "a 1 km d'acqua: migliaia di volte meno (misurato: ~7·10³)"); tra(suolo.muoni / dueEMezzo.muoni, 3e4, 8e5, 'a 2,5 km: centomila volte meno (misurato: 2,5·10⁵)');
  assert.equal(unKm.nucleoni, 0, 'sotto un chilometro arrivano solo i muoni'); assert.ok(unKm.energiaMuoni > 5 * suolo.energiaMuoni, 'e sono i più energici');
  // un campo dieci volte più forte lascia passare meno primari; ai poli il campo non scherma
  const forte = M.raggiCosmici({ ...CIELO, pianeta: { ...CIELO.pianeta, B0: 3.1e-4 }, latitudine: 20 }), equatore = M.raggiCosmici({ ...CIELO, latitudine: 0 }), polo = M.raggiCosmici({ ...CIELO, latitudine: 88 });
  tra(M.sogliaStormer(TERRA, 0), 14.8, 15, "soglia all'equatore (GV)"); assert.ok(polo.primari > 10 * equatore.primari && forte.primari < 0.1 * equatore.primari && forte.muoni < 0.5 * equatore.muoni);
  // senz'aria i primari arrivano sulla roccia; non ci sono muoni
  const luna = M.raggiCosmici({ pianeta: { g: 1.62, B0: 0, raggioM: 1.737e6 }, aria: { pressione: 0 } });
  assert.equal(luna.muoni, 0); tra(luna.nucleoni / luna.primari, 0.999, 1.001, 'senza aria i primari arrivano tutti'); assert.ok(luna.nucleoni > 1e3 * suolo.nucleoni);
  // il carbonio-14 dell'aria: produzione ÷ carbonio che scambia (Terra: 1,2·10⁻¹²)
  tra(M.sorgentiNaturali(MARE).carbonio14, 0.5e-12, 3e-12, 'C-14/C');
});

prova('le sorgenti di un luogo: che cosa accade e ogni quanto', () => {
  const mare = M.sorgentiNaturali(MARE), ore = mare.attesa(1e-3).find((a) => a.id === 'potassio-40 β').secondi / 3600;
  tra(mare.totale.perM3 / 1000, 11, 14, 'decadimenti al secondo in un litro di mare (~12)'); tra(ore, 18, 30, "un β del K-40 in un millimetro cubo d'acqua ogni ~23 ore");
  assert.ok(mare.processi.every((p) => typeof p.origine === 'string' && p.origine.length > 8)); assert.match(mare.processi.find((p) => p.id === 'muone cosmico').origine, /muone di uno sciame nato a \d+ km di quota/);
  assert.match(mare.neutrini.frase, /passano e basta/); tra(mare.neutrini.perM2, 5e14, 8e14, 'neutrini del Sole (per m² al secondo; 6,5·10¹⁴)');
  const roccia = M.sorgentiNaturali(ROCCIA), aria = M.sorgentiNaturali(CIELO);
  assert.ok(roccia.processi.some((p) => p.tipo === 'fissione') && roccia.processi.filter((p) => p.tipo === 'α').length === 22);
  tra(M.radonNellAria(CIELO), 1, 40, "radon nell'aria sopra la terraferma (Bq/m³; ~10)"); assert.equal(M.radonNellAria(M.luogoDaAria({ P: TERRA, suMare: true })), 0);
  assert.ok(aria.processi.some((p) => p.nuclide === 'radon-222') && aria.processi.some((p) => p.nuclide === 'carbonio-14'));
  // dove sta l'uranio: lo zircone ne ha centinaia di ppm, la biotite quasi niente; il conto torna
  const z = M.concentrazioni(ROCCIA, 'zircone'), b = M.concentrazioni(ROCCIA, 'biotite'), mo = M.concentrazioni(ROCCIA, 'monazite');
  assert.ok(z.U > 1000 * b.U && mo.Th > 0.01 && mo.Th < 0.3 && b.K > 0.05, `zircone ${z.U}, biotite ${b.U}, monazite Th ${mo.Th}`);
});

const simula = (r) => { const t0 = performance.now(), tr = simulaMondo(r.cella), ms = performance.now() - t0; return { tr, ms }; };
const cinetica = (v, m) => v.e - m;
prova('una cella nell\'acqua: il β del potassio-40, al suo istante; energia e carica tornano', () => {
  const r = M.cellaMateria(MARE, { processo: 'potassio-40 β' }, sorgente('prova/mare')), { tr, ms } = simula(r), c = r.cella;
  assert.ok(ms < 300, `simulata in ${ms} ms`); assert.equal(tr.decadimenti.length, 1);
  for (const k of ['larghezza', 'altezza', 'c', 'tempo', 'relativita', 'fondo', 'domini', 'masse', 'dipoli', 'sorgenti', 'pellicola', 'scala', 'indirizzo', 'finestra', 'sezione', 'specie', 'seme']) assert.ok(c[k] != null, `manca ${k}`);
  assert.equal(c.c, 40); assert.equal(JSON.stringify(JSON.parse(JSON.stringify(c))), JSON.stringify(c), 'la cella è fatta di soli dati');
  tra(c.scala.latoM, 1e-3, 3e-2, 'lato (m)'); tra(c.scala.secondi, 1e-12, 1e-9, 'durata vera (s): picosecondi'); assert.ok(c.scala.attesa > 0 && c.indirizzo.data === c.scala.attesa);
  assert.match(c.sorgenti[0].origine, /decadimento β del potassio-40/); assert.ok(segmentiSezione(tr, c).length > 5);
  const d = tr.decadimenti[0], Q = 1.3111 / 0.511, somma = (f) => d.prodotti.reduce((s, p) => s + f(p), 0);
  assert.ok(Math.abs(somma((p) => p.e) - d.prima.e) < 1e-6 * Q && Math.abs(somma((p) => p.x) - d.prima.x) < 1e-9 && Math.abs(somma((p) => p.y) - d.prima.y) < 1e-9, 'energia e impulso');
  assert.equal(somma((p) => c.specie[p.specie].carica), c.specie[d.specie].carica, 'carica'); assert.equal(c.specie[d.specie].carica, 19);
  const el = d.prodotti.find((p) => p.specie === 'elettrone'), nu = d.prodotti.find((p) => p.specie === 'antineutrino');
  tra(cinetica(el, 1) + nu.e, 0.999 * Q, 1.001 * Q, "l'elettrone e il neutrino si spartiscono Q");
  // l'elettrone si ferma nell'acqua dopo un percorso di millimetri, storto
  const t = tr.find((x) => x.specie.nome === 'elettrone'), l = c.scala.latoM / c.larghezza; let strada = 0; for (let i = 1; i < t.punti.length; i++) strada += Math.hypot(t.punti[i][0] - t.punti[i - 1][0], t.punti[i][1] - t.punti[i - 1][1]);
  const atteso = M.percorso('elettrone', cinetica(el, 1) * 0.511, ACQUA).m;
  if (t.fine === 'ferma') tra((strada * l) / atteso, 0.85, 1.15, 'la strada nel motore rispetto al percorso calcolato');
  assert.ok(/ogni \d/.test(r.racconto.frasi.join(' ')) && r.racconto.attese.length > 3);
});

prova('lo spettro β nel motore è quello di Fermi; un ramo cambia un solo decadimento', () => {
  const r = M.cellaMateria(MARE, { processo: 'potassio-40 β' }, sorgente('prova/mare')), T = [];
  for (let ramo = 0; ramo < 300; ramo++) { const d = simulaMondo({ ...r.cella, rami: { 0: ramo } }, { maxParticelle: 1 }).decadimenti[0]; T.push((d.prodotti.find((p) => p.specie === 'elettrone').e - 1) * 0.511); }
  const media = T.reduce((a, b) => a + b, 0) / T.length; tra(media, 0.5, 0.66, "energia media dell'elettrone del K-40 (MeV; 0,56)"); assert.ok(Math.max(...T) < 1.3112 && Math.min(...T) > 0);
  // la memoria di una roccia: cambia il ramo di un decadimento solo, gli altri restano identici
  const m = M.cellaMateria(ROCCIA, { modo: 'memoria', massimo: 40 }, sorgente('prova/roccia')), a = simulaMondo(m.cella), b = simulaMondo({ ...m.cella, rami: { 7: 1 } });
  const firma = (tr, i) => JSON.stringify(tr.filter((t) => t.sorgente === i).map((t) => t.punti));
  let diversi = 0; for (let i = 0; i < m.cella.sorgenti.length; i++) if (firma(a, i) !== firma(b, i)) diversi++;
  assert.equal(diversi, 1, 'cambia solo il decadimento 7'); assert.notEqual(firma(a, 7), firma(b, 7));
  // determinismo: lo stesso luogo, lo stesso caso, la stessa cella; un altro evento è un altro
  assert.equal(JSON.stringify(M.cellaMateria(MARE, { processo: 'potassio-40 β' }, sorgente('prova/mare')).cella), JSON.stringify(r.cella));
  assert.notEqual(JSON.stringify(M.cellaMateria(MARE, { processo: 'potassio-40 β', evento: 1 }, sorgente('prova/mare')).cella.sorgenti), JSON.stringify(r.cella.sorgenti));
  // e un ramo della sorgente degli eventi (un universo parallelo) sposta quell'evento
  const k = 'prova/mare/materia/istante/evento 0/dove/x', altro = M.cellaMateria(MARE, { processo: 'potassio-40 β' }, sorgente('prova/mare', { [k]: 1 }));
  assert.notEqual(altro.cella.sorgenti[0].pos[0], r.cella.sorgenti[0].pos[0]); assert.equal(altro.cella.sorgenti[0].pos[1], r.cella.sorgenti[0].pos[1]);
});

prova("il muone nell'acqua: il cono di luce Cherenkov e i raggi delta", () => {
  const r = M.cellaMateria(MARE, { processo: 'muone cosmico', latoM: 0.3 }, sorgente('prova/mare')), { tr, ms } = simula(r), c = r.cella;
  assert.ok(ms < 300, `simulata in ${ms} ms`); assert.match(c.sorgenti[0].origine, /muone di uno sciame nato a \d+ km di quota, sopravvissuto a 10 m di acqua/);
  const mu = tr.find((t) => t.specie.nome.startsWith('muone')), luce = tr.filter((t) => t.specie.nome === 'fotone Cherenkov'); assert.ok(mu && luce.length > 10, `${luce.length} fotoni`);
  // l'angolo tra ogni fotone e il muone: cos θ = 1/(nβ) → 41°
  const dir = (t) => { const a = t.punti[0], b = t.punti[t.punti.length - 1]; return Math.atan2(b[1] - a[1], b[0] - a[0]); }, dm = dir(mu);
  for (const f of luce.slice(0, 12)) tra((Math.abs(Math.atan2(Math.sin(dir(f) - dm), Math.cos(dir(f) - dm))) * 180) / Math.PI, 39, 43, 'angolo Cherenkov (gradi)');
  // la luce va a c/n: 40/1,333 unità per unità di tempo
  const f = luce[0], p0 = f.punti[0], p1 = f.punti[f.punti.length - 1]; tra(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / (p1[3] - p0[3]), 29.5, 30.5, 'velocità della luce in acqua (unità del motore)');
  assert.ok(c.mezzo.delta.taglio > 0 && c.scala.fotoniPerLinea > 1);
  // sotto la soglia non c'è luce: una α non ne fa
  const al = simulaMondo(M.cellaMateria(MARE, { processo: 'uranio-238 α' }, sorgente('prova/mare')).cella); assert.ok(!al.some((t) => t.specie.nome === 'fotone Cherenkov') && al.some((t) => t.specie.nome === 'alfa'));
});

prova('una α nel motore: energia dal Q, percorso dalla tabella; il nucleo rincula dalla parte opposta', () => {
  const r = M.cellaMateria(ROCCIA, { processo: 'polonio-214 α', latoM: 100e-6 }, sorgente('prova/roccia')), { tr, ms } = simula(r), c = r.cella, d = tr.decadimenti[0];
  assert.ok(ms < 300); const a = d.prodotti.find((p) => p.specie === 'alfa'), n = d.prodotti.find((p) => p.specie !== 'alfa');
  tra((a.e - c.specie.alfa.m) * 0.511, 7.68, 7.695, 'energia della α del Po-214 (MeV; 7,687)'); tra((n.e - c.specie[n.specie].m) * 0.511, 0.14, 0.15, 'energia del rinculo (MeV; 0,146)');
  assert.ok(Math.abs(a.x + n.x - d.prima.x) < 1e-6 && Math.abs(a.y + n.y - d.prima.y) < 1e-6, 'schiena contro schiena'); assert.equal(c.specie[d.specie].carica, 84); assert.equal(c.specie[n.specie].carica + 2, 84);
  const t = tr.find((x) => x.specie.nome === 'alfa'), l = c.scala.latoM / c.larghezza, P = t.punti, lunga = Math.hypot(P[P.length - 1][0] - P[0][0], P[P.length - 1][1] - P[0][1]) * l;
  if (t.fine === 'ferma') tra(lunga / M.percorso('alfa', 7.687, M.mezzo(ROCCIA)).m, 0.9, 1.05, 'la traccia rispetto al percorso'); else assert.equal(t.fine, 'fuori');
  assert.ok(P[P.length - 1][4] > 2 * P[1][4], 'la traccia si ingrossa in fondo (picco di Bragg)');
});

prova("l'aria: un evento al suo istante, e lo sciame di un raggio cosmico con la sua impronta al suolo", () => {
  const r = M.cellaMateria(CIELO, { latoM: 0.2 }, sorgente('prova/aria')), { ms } = simula(r); assert.ok(ms < 300);
  const rn = M.cellaMateria(CIELO, { processo: 'radon-222' }, sorgente('prova/aria')); tra(rn.cella.scala.latoM, 0.08, 0.2, "la α del radon in aria fa 4 cm: la finestra è larga 12"); assert.match(rn.cella.sorgenti[0].origine, /radon-222, un gas uscito dal suolo/);
  let muoni = 0, tracce = 0, tempo = 0;
  for (let ev = 0; ev < 6; ev++) {
    const s = M.cellaMateria(CIELO, { processo: 'sciame', evento: ev }, sorgente('prova/aria')), x = simula(s); tempo = Math.max(tempo, x.ms); tracce += x.tr.length;
    tra(s.cella.scala.latoM, 2e4, 6e4, 'la finestra dello sciame (m)'); assert.ok(s.racconto.veri.energiaGeV > 20); assert.match(s.cella.sorgenti[0].origine, /raggio cosmico primario da/);
    const imp = M.improntaAlSuolo(x.tr, s.cella); muoni += imp.filter((p) => p.specie.startsWith('muone')).length;
    for (const d of x.tr.decadimenti) if (d.prodotti) { const e = d.prodotti.reduce((q, p) => q + p.e, 0), prima = d.prima.e + (d.bersaglio ? s.cella.specie[d.bersaglio].m : 0); assert.ok(Math.abs(e - prima) < 1e-6 * prima, `energia in ${d.specie}`); }
  }
  assert.ok(tempo < 300, `lo sciame più lento: ${tempo} ms`); assert.ok(tracce > 100 && muoni >= 1, `${tracce} tracce, ${muoni} muoni al suolo in sei sciami`);
  assert.throws(() => M.cellaMateria({ ...CIELO, aria: { pressione: 600, T: 210 } }, { processo: 'sciame' }, sorgente('prova/marte')), /non c'è abbastanza aria/);
});

prova('la memoria dei minerali: gli aloni della biotite escono dalle energie delle α', () => {
  const al = M.aloni(ROCCIA, { ospite: 'biotite', granello: 'zircone', raggioM: 0.3e-6, N: 96 }), r = (n) => al.anelli.find((a) => a.nuclidi.includes(n)).raggioM * 1e6;
  tra(r('uranio-238'), 11.5, 14.5, "l'anello dell'U-238 (µm; misurato ~13)"); tra(r('polonio-210'), 17.5, 20.5, 'del Po-210 (~19)'); tra(r('polonio-218'), 21, 24.5, 'del Po-218 (~23)'); tra(r('polonio-214'), 32, 35.5, 'del Po-214, il più largo (33–35)');
  assert.ok(r('polonio-212') > 39 && r('polonio-212') < 44, 'e più fuori ancora quello del torio (Po-212, ~41)');
  const u = M.aloni({ ...ROCCIA, elementi: { U: 3e-6, Th: 0, K: 0.04 } }, { raggioM: 0.3e-6, N: 0 });
  const forti = u.anelli.filter((a) => !a.debole); // (quelli dell'uranio-235, lo 0,7%, sono troppo deboli per vedersi)
  assert.ok(forti.length >= 5 && forti.length <= 8, `otto α, ${forti.length} anelli distinguibili`); assert.equal(forti.reduce((s, a) => s + a.nuclidi.filter((n) => M.CATENE['uranio-238'].passi.some((p) => p[0] === n && p[3] === 'α')).length, 0), 8);
  assert.ok(forti[forti.length - 1].nuclidi.includes('polonio-214')); tra(forti[0].raggioM * 1e6, 12, 14.5, "il più stretto (U-238, ~13 µm)"); tra(forti[forti.length - 1].raggioM * 1e6, 32, 35.5, 'il più largo (Po-214, ~34 µm)');
  // il profilo: verso la fine del percorso la α lascia più energia (picco di Bragg), e nonostante la sfera si allarghi c'è un
  // massimo poco prima della fine dell'ultimo anello; subito fuori, il buio crolla (lì arrivano solo le α che vanno più lontano)
  const pf = u.profilo, dr = pf.r[1] - pf.r[0], i = (um) => Math.min(pf.r.length - 1, Math.round((um * 1e-6) / dr - 0.5)), massimi = [];
  for (let k = i(8); k < pf.r.length - 1; k++) if (pf.fluenza[k] > pf.fluenza[k - 1] && pf.fluenza[k] >= pf.fluenza[k + 1]) massimi.push(pf.r[k] * 1e6);
  assert.ok(massimi.some((x) => x > 29 && x < 35.6), `massimi del profilo a ${massimi.map((x) => x.toFixed(1))} µm`);
  assert.ok(pf.fluenza[i(31)] > 2 * pf.fluenza[i(34.5)] && pf.fluenza[i(22)] > 1.5 * pf.fluenza[i(26)] && pf.oscuramento[i(37)] === 0, 'un gradino alla fine di ogni percorso'); assert.equal(al.immagine.length, 96 * 96 * 4);
  tra(al.alfa, 1e5, 1e12, 'α emesse dal granello'); tra(al.anni / 1e6, 100, 600, 'la memoria (milioni di anni): da quando la roccia è salita sopra i 300 °C');
  // una roccia giovane, o ancora calda, o scaldata da poco, ne ha poche o nessuna
  const giovane = M.aloni({ ...ROCCIA, etaRoccia: 1e6 }, { raggioM: 0.3e-6, N: 0 }), calda = M.aloni(M.luogoDaRoccia({ P: TERRA, minerali: GRANITO, profonditaM: 12000 }), { N: 0 }), ricotta = M.aloni({ ...ROCCIA, riscaldata: { T: 900, anniFa: 2e6 } }, { raggioM: 0.3e-6, N: 0 });
  assert.ok(giovane.alfa < al.alfa / 50 && calda.alfa === 0 && calda.anelli.length === 0 && ricotta.anni === 2e6 && Math.max(...giovane.profilo.oscuramento) < Math.max(...al.profilo.oscuramento));
  // e nel motore: le α del granello si fermano sugli anelli
  const m = M.cellaMateria({ ...ROCCIA, elementi: { U: 3e-6, Th: 0, K: 0.04 } }, { modo: 'memoria', ospite: 'biotite', granello: 'zircone' }, sorgente('prova/alone')), { tr, ms } = simula(m), c = m.cella, l = c.scala.latoM / c.larghezza;
  assert.ok(ms < 300, `la memoria simulata in ${ms} ms`); assert.ok(m.racconto.veri.alfa > 1e6 && m.racconto.veri.alfaDisegnate <= 160 && c.sorgenti.length > 20);
  // (le α si fermano alla fine del percorso: il bordo esterno dell'anello)
  const fine214 = tr.filter((t) => t.specie.nome === 'alfa' && t.fine === 'ferma' && c.sorgenti[t.sorgente].nuclide === 'polonio-214' && /granello/.test(c.sorgenti[t.sorgente].origine)).map((t) => Math.hypot(t.punti.at(-1)[0] - 500, t.punti.at(-1)[1] - 500) * l * 1e6);
  assert.ok(fine214.length >= 3, `${fine214.length} α del Po-214`); const rg = c.indirizzo.raggioGranelloM * 1e6; for (const d of fine214) tra(d, 35.6 - 2.2 * rg - 1.5, 35.6 + rg + 1.5, 'dove si ferma una α del Po-214 (µm dal centro)');
  const ev = M.eventiDi(c); assert.ok(ev.every((e) => e.anniFa >= 0 && e.anniFa <= c.scala.esposizioneAnni) && new Set(ev.map((e) => Math.round(e.anniFa))).size > ev.length / 2, 'ogni evento ha la sua data');
  assert.throws(() => M.cellaMateria(MARE, { modo: 'memoria' }, sorgente('prova/mare')), /non resta memoria/);
});

prova('le tracce di fissione: densità = età × uranio × costante di fissione × percorso (la datazione torna)', () => {
  const freddo = { tipo: 'roccia', etaRoccia: 1e8, etaPianeta: 4.5e9, T: 288, continente: false, minerali: [{ nome: 'apatite', frazione: 1 }], indirizzo: 'prova/apatite' };
  const t = M.tracceFossili(freddo, { minerale: 'apatite', uranio: 10e-6, latoM: 100e-6, N: 96 }, sorgente('prova/apatite'));
  tra(t.densita, 3e5, 1.5e6, "apatite di 100 milioni di anni con 10 ppm di uranio (tracce per cm²; ordine 10⁶)"); tra(t.percorsoM * 1e6, 12, 24, 'lunghezza della traccia (µm)');
  tra(M.etaDaTracce(t.densita, 10, 'apatite') / 1e8, 0.999, 1.001, "l'età letta dalle tracce"); tra(t.quante / t.attese, 0.6, 1.4, 'quante nel quadrato');
  assert.ok(t.tracce.every((x) => x.anniFa >= 0 && x.anniFa <= 1e8 && Math.hypot(x.dx, x.dy) <= t.percorsoM) && t.immagine.length === 96 * 96 * 4);
  // il doppio dell'età o dell'uranio, il doppio delle tracce; una roccia calda non ne tiene; lo zircone resiste di più
  tra(M.tracceFossili({ ...freddo, etaRoccia: 2e8 }, { uranio: 10e-6, N: 0 }).densita / t.densita, 1.99, 2.04, 'età doppia'); tra(M.tracceFossili(freddo, { uranio: 20e-6, N: 0 }).densita / t.densita, 1.99, 2.01, 'uranio doppio');
  assert.equal(M.tracceFossili({ ...freddo, T: 420 }, { uranio: 10e-6, N: 0 }).densita, 0); assert.ok(M.tracceFossili({ ...freddo, T: 420 }, { minerale: 'zircone', uranio: 10e-6, N: 0 }).densita > 0);
  // in un continente la memoria comincia quando l'erosione ha portato la roccia sopra l'isoterma di ricottura
  const ap = M.ritenzione(ROCCIA, 'apatite', 'fissione'), zr = M.ritenzione(ROCCIA, 'zircone', 'fissione');
  tra(ap.anni / 1e6, 60, 160, "età delle tracce nell'apatite di un continente (milioni di anni: 3,3 km a 30 m per milione di anni)"); assert.ok(zr.anni > 2 * ap.anni && zr.anni < ROCCIA.etaRoccia);
  assert.equal(M.ritenzione(M.luogoDaRoccia({ P: { ...TERRA, clima: { ...TERRA.clima, acqua: 'assente' } }, minerali: GRANITO, etaRoccia: 1.5e9, bagnato: false }), 'apatite').anni, 1.5e9, "senza pioggia non c'è erosione: la memoria è l'età della roccia");
});

prova('i reticoli veri: celle, distanze di legame, densità; gli atomi con la loro agitazione termica', () => {
  const dist = (R, elA, elB) => { let m = Infinity; for (const a of R.atomi) if (a.el === elA) for (const b of R.atomi) if (b.el === elB) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const p = [0, 1, 2].map((n) => b.pos[n] + i * R.base.A[n] + j * R.base.B[n] + k * R.base.C[n] - a.pos[n]), d = Math.hypot(...p); if (d > 0.05 && d < m) m = d; } return m; };
  const q = M.reticolo('quarzo'), s = M.reticolo('salgemma'), g = M.reticolo('ghiaccio'), ca = M.reticolo('calcite'), bi = M.reticolo('biotite');
  assert.equal(q.sistema, 'trigonale'); assert.equal(s.sistema, 'cubico'); assert.equal(g.sistema, 'esagonale'); assert.equal(q.atomi.length, 9); assert.equal(s.atomi.length, 8);
  tra(dist(q, 'Si', 'O'), 1.59, 1.62, 'Si–O nel quarzo (Å; 1,61)'); tra(dist(s, 'Na', 'Cl'), 2.815, 2.825, 'Na–Cl (2,820)'); tra(dist(g, 'O', 'O'), 2.74, 2.78, 'O–O nel ghiaccio (2,76)'); tra(dist(g, 'O', 'H'), 0.95, 1.01, 'O–H (0,98)');
  tra(dist(ca, 'C', 'O'), 1.27, 1.29, 'C–O nella calcite (1,28)'); tra(dist(bi, 'K', 'O'), 2.9, 3.0, 'K–O nella mica (2,96)'); tra(dist(M.reticolo('olivina'), 'Si', 'O'), 1.6, 1.63, "Si–O nell'olivina"); tra(dist(M.reticolo('pirosseno'), 'Si', 'O'), 1.57, 1.61, 'Si–O nel pirosseno'); tra(dist(M.reticolo('feldspato potassico'), 'Si', 'O'), 1.62, 1.65, '(Si,Al)–O nel feldspato');
  for (const [m, rho] of [['quarzo', 2.65], ['salgemma', 2.165], ['ghiaccio', 0.917], ['calcite', 2.71], ['olivina', 3.22], ['pirosseno', 3.28], ['feldspato potassico', 2.56], ['plagioclasio', 2.62], ['biotite', 2.8]]) tra(M.reticolo(m).densita / rho, 0.97, 1.03, `densità della cella di ${m}`);
  // Debye-Waller: nel quarzo a 300 K il silicio è spostato di ~0,08 Å, l'ossigeno di più; a caldo di più; a zero non è zero
  tra(M.agitazione(28.086, 470, 300), 0.06, 0.1, 'agitazione del silicio (Å)'); assert.ok(M.agitazione(15.999, 470, 300) > M.agitazione(28.086, 470, 300) && M.agitazione(28.086, 470, 900) > 1.5 * M.agitazione(28.086, 470, 300) && M.agitazione(28.086, 470, 1) > 0.03);
  const a = M.atomi('quarzo', { latoM: 3e-9, T: 288 }, sorgente('prova/quarzo')), caldo = M.atomi('quarzo', { latoM: 3e-9, T: 800 }, sorgente('prova/quarzo'));
  tra(a.atomi.length, 250, 700, 'atomi in uno strato di quarzo di 3 nm'); tra(a.quantiDavvero, 1800, 2500, 'in un cubo di 3 nm'); assert.ok(a.atomi.every((p) => p.x >= 0 && p.x <= 3e-9 && p.y >= 0 && p.y <= 3e-9));
  tra(a.atomi.filter((p) => p.el === 'O').length / a.atomi.filter((p) => p.el === 'Si').length, 1.8, 2.2, 'due ossigeni per silicio'); assert.ok(caldo.agitazione.Si > a.agitazione.Si);
  assert.equal(JSON.stringify(M.atomi('quarzo', { latoM: 3e-9, T: 288 }, sorgente('prova/quarzo')).atomi.slice(0, 20)), JSON.stringify(a.atomi.slice(0, 20))); assert.equal(M.immagineAtomi(a, 64).length, 64 * 64 * 4);
  assert.throws(() => M.reticolo('kriptonite'), /non conosco la cella/);
});

prova("l'incanalamento: angolo critico di Lindhard, e una stella con la simmetria del reticolo", () => {
  const t0 = performance.now(), q = M.incanalamento('quarzo', 'protone', 1, 'c'), s = M.incanalamento('salgemma', 'protone', 1, 'a'), ms = (performance.now() - t0) / 2;
  tra(q.psi1Gradi, 0.1, 1, 'angolo critico di un protone da 1 MeV nel quarzo (gradi)'); tra(s.psi1Gradi, 0.1, 1, 'nel salgemma');
  // ψ1 = 0,307°·√(Z1·Z2/(E[MeV]·d[Å])): nel salgemma lungo [100] la fila più carica è il cloro (Z = 17), un atomo ogni 5,64 Å
  tra(s.psi1Gradi / (0.3075 * Math.sqrt(17 / 5.6402)), 0.99, 1.01, 'la formula di Lindhard'); tra(M.incanalamento('salgemma', 'protone', 4, 'a', { N: 12, punti: 2 }).psi1 / s.psi1, 0.49, 0.51, "a energia quadrupla, metà dell'angolo");
  tra(M.incanalamento('salgemma', 'alfa', 1, 'a', { N: 12, punti: 2 }).psi1 / s.psi1, 1.40, 1.43, 'una α (carica 2): √2 volte');
  assert.equal(q.simmetria, 6, `quarzo lungo c: ${JSON.stringify(q.rotazioni)}`); assert.equal(s.simmetria, 4, `salgemma lungo [100]: ${JSON.stringify(s.rotazioni)}`);
  assert.ok(s.rotazioni[4] > 0.9 && s.rotazioni[6] < 0.2 && q.rotazioni[6] > 0.5 && q.rotazioni[4] < q.rotazioni[6]);
  assert.equal(M.incanalamento('ghiaccio', 'protone', 1, 'c', { T: 260 }).simmetria, 6); assert.equal(M.incanalamento('olivina', 'protone', 1, 'a').simmetria, 2, "l'olivina è ortorombica: due");
  // al centro (dentro l'angolo critico) quasi tutte passano lontano dai nuclei; lontano dall'asse e dai piani no
  assert.ok(s.incanalate > 0.8 && q.incanalate > 0.6); const N = s.N, angolo = s.mappa[Math.floor(N * 0.3) * N + Math.floor(N * 0.12)]; assert.ok(angolo < 0.5 * s.incanalate, `fuori dai piani: ${angolo}`);
  assert.ok(s.punte.length >= 4 && s.punte.includes(0) && s.punte.includes(90)); assert.equal(s.immagine.length, N * N * 4); assert.ok(s.piani[0].spaziatura > 5.6 && s.piani[0].psi < s.psi1);
  // la figura non dipende da chi guarda: stesso minerale, stessa particella, stessa figura
  assert.equal(JSON.stringify(Array.from(M.incanalamento('salgemma', 'protone', 1, 'a').mappa)), JSON.stringify(Array.from(s.mappa)));
  // più caldo, gli atomi vibrano di più e il canale si stringe
  assert.ok(M.incanalamento('salgemma', 'protone', 1, 'a', { T: 900, N: 12, punti: 2 }).psiTermico < s.psiTermico);
  console.log(`      (una figura: ${ms.toFixed(0)} ms; quarzo ψ1 = ${q.psi1Gradi.toFixed(2)}°, salgemma ${s.psi1Gradi.toFixed(2)}°)`);
});

prova('i luoghi: da ciò che la mappa ha in mano al luogo delle particelle', () => {
  // (i minerali della norma di chimica.js: senz'acqua il pirosseno; con l'acqua, nei continenti, diventa biotite)
  const norma = [{ nome: 'quarzo', frazione: 0.49 }, { nome: 'plagioclasio', frazione: 0.35 }, { nome: 'feldspato potassico', frazione: 0.09 }, { nome: 'pirosseno', frazione: 0.06 }, { nome: 'ferro metallico', frazione: 0.01 }];
  const S = { k: 'prova/pianeta', P: TERRA, se: { materiali: { continente: norma, basalto: [{ nome: 'pirosseno', frazione: 0.48 }, { nome: 'plagioclasio', frazione: 0.43 }, { nome: 'quarzo', frazione: 0.05 }, { nome: 'feldspato potassico', frazione: 0.02 }] } }, mare: { esiste: true, totali: { K: 0.0102 }, carbonio: 0.0022, pO2: 0.2 } };
  const r = M.luogoDaRoccia({ S, continente: true, lat: 30, lon: 12, quotaM: 500 }), b = M.luogoDaRoccia({ S, continente: false, lat: 30, lon: 12 }), a = M.luogoDaAcqua({ S, lat: 30, lon: -40, profonditaM: 100 }), n = M.luogoDaRoccia({ S, ghiaccio: true, T: 250, lat: 80 });
  assert.ok(r.minerali.some((m) => m.nome === 'biotite') && !b.minerali.some((m) => m.nome === 'biotite')); tra(r.minerali.reduce((s, m) => s + m.frazione, 0), 0.999, 1.001, 'le frazioni sommano a uno');
  assert.match(r.indirizzo, /^prova\/pianeta\/roccia\//); assert.match(a.indirizzo, /^prova\/pianeta\/acqua\//); tra(r.aria.pressione, 0.9e5, 1e5, 'la pressione a 500 m'); tra(r.B / TERRA.B0, 1.2, 1.4, 'il campo a 30° di latitudine');
  tra(r.gradiente * 1000, 25, 33, 'gradiente di temperatura (K per km)'); tra(M.luogoDaRoccia({ S, profonditaM: 3000 }).T, 288 + 75, 288 + 99, 'a 3 km di profondità');
  // il potassio dei minerali dà l'uranio e il torio (K/U ≈ 17 000 in massa)
  const el = M.radioelementi(r.minerali); tra(el.K / el.U, 1.5e4, 2e4, 'K/U'); tra(el.Th / el.U, 3.4, 3.9, 'Th/U'); assert.ok(M.sorgentiNaturali(r).totale.perKg > 2 * M.sorgentiNaturali(b).totale.perKg, 'il continente è più radioattivo del basalto');
  tra(M.sorgentiNaturali(a).totale.perM3 / 1000, 11, 14, 'il mare di S'); assert.equal(M.sorgentiNaturali(n).processi.filter((p) => p.tipo !== 'cosmico').length, 0, 'nel ghiaccio puro solo i raggi cosmici');
  for (const l of [r, b, a, n]) { const c = M.cellaMateria(l, {}, sorgente(l.indirizzo)); assert.ok(simulaMondo(c.cella).length >= 1 && c.nota.length > 100); }
  tra(M.cieloRelativo({ ritmoSN: 0.02, forma: { unitaM: 15 * 3.0857e19 } }).relativo, 0.99, 1.01, 'il cielo della Via Lattea'); assert.ok(M.raggiCosmici({ ...r, raggi: { relativo: 10 } }).muoni > 9 * M.raggiCosmici(r).muoni);
});

console.log(`\n${ok} prove superate`);
