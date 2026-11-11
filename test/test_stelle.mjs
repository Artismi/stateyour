// test_stelle.mjs — le stelle calcolate integrando la loro struttura, senza tarature: i numeri veri (il Sole, Sirio,
// Proxima…), ciò che deve emergere (massa minima, CNO, Sole giovane, metalli), la fine, i tempi, e il confronto con
// le formulette di leggi.js. Due specie di prove: quelle che DEVONO valere (assert: se cadono il test si ferma) e i
// CONFRONTI con le stelle vere, con le tolleranze chieste: se uno non rientra viene stampato «✗ NON TORNA» con il
// numero, e ricapitolato in fondo. Le soglie non si allargano: ciò che il modello sbaglia resta scritto.
import assert from 'node:assert/strict';
import { stella, fine, massaMinima, massaMassima, nucleoElio, composizione, DATI, ALFA, dentro } from '../src/camera/stelle.js';
import { stella as stellaVecchia, massaNascita, massaChandrasekhar, massaMassimaNeutroni, MSOLE, RSOLE, LSOLE, ANNO, etaUniverso } from '../src/camera/leggi.js';

let ok = 0;
const nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => Number(x).toPrecision(c);
const pc = (x) => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(0)}%`;
// un confronto con il vero: stampa, e se è fuori dalla tolleranza lo segna (senza fermare il test)
const confronta = (che, x, a, b, vero = '') => { const dentroLim = x > a && x < b; console.log(`      ${dentroLim ? '·' : '✗ NON TORNA:'} ${che}: ${n(x, 4)}${vero ? ` (vero ${vero})` : ''}, chiesto tra ${n(a, 4)} e ${n(b, 4)}`); if (!dentroLim) nonTorna.push(`${che}: ${n(x, 4)} (chiesto tra ${n(a, 4)} e ${n(b, 4)}${vero ? `; vero ${vero}` : ''})`); return dentroLim; };
// lo stesso per una stella intera, su una riga sola
const stellaVera = (nome, x, L, R, T) => { const f = (che, v, vero, tol) => { const sta = Math.abs(v / vero - 1) < tol; if (!sta) nonTorna.push(`${nome}: ${che} ${n(v, 4)} (vero ${vero}, ${pc(v / vero - 1)}; chiesto entro il ${100 * tol}%)`); return `${che} ${n(v).padStart(8)} (${String(vero).padStart(7)}, ${pc(v / vero - 1).padStart(4)}${sta ? '' : ' ✗'})`; }; console.log(`      ${nome.padEnd(18)} ${f('L', x.L, L, 0.2)}  ${f('R', x.R, R, 0.15)}  ${f('T', x.T, T, 0.08)}`); };

prova('dalle costanti: Rydberg, Bohr, Thomson, Lane-Emden, il picco di Gamow, le energie di ionizzazione', () => {
  const { RY, A0, SIGMA_T, C_ES, laneEmden, sigmaV, energiaAtomo, energia } = dentro, eV = 1.602e-19;
  tra(RY / eV, 13.59, 13.62, 'energia di Rydberg (13,606 eV), da α, mₑ, c'); tra(A0 * 1e11, 5.28, 5.30, 'raggio di Bohr (5,29·10⁻¹¹ m)');
  tra(SIGMA_T / 1e-29, 6.64, 6.66, 'sezione d\'urto di Thomson (6,652·10⁻²⁹ m²)'); tra(C_ES * 10, 0.198, 0.201, 'opacità degli elettroni liberi (0,2·(1+X) cm²/g)');
  tra(laneEmden(3).xi, 6.896, 6.898, 'primo zero del polìtropo n = 3 (6,897)'); tra(laneEmden(3).m, 2.0180, 2.0185, 'la sua massa (2,0182)'); tra(laneEmden(1.5).xi, 3.653, 3.655, 'n = 3/2 (3,654)');
  // la ripidezza delle reazioni: d ln⟨σv⟩/d ln T al centro del Sole (pp ≈ 4; CNO ≈ 20: è la barriera di Coulomb)
  const esp = (Z2, A2, S) => { const r = (T) => { const [a, tau] = sigmaV(T, 1, Z2, 1, A2, S); return Math.log(a) - tau; }; return (r(1.6e7) - r(1.5e7)) / Math.log(16 / 15); };
  tra(esp(1, 1, DATI.S11), 3.5, 4.5, 'esponente della catena pp a 15 milioni di K'); tra(esp(7, 14, DATI.S114), 17, 22, 'esponente del ciclo CNO');
  const e = energia(1.5e5, 1.57e7, 0.34, 0.02); tra(e[0] * 1e3, 0.7, 2.5, 'energia della catena pp al centro del Sole (mW/kg: ~1,7)'); tra(e[1] / e[0], 0.02, 0.3, 'CNO su pp al centro del Sole');
  // gli atomi alla Slater: quanto costa strappare un elettrone (eV; tra parentesi il valore misurato)
  const ion = (z, N, q) => { const A = Float64Array.from([0, ...N, 0, 0, 0].slice(0, 5)), B = A.slice(); B[q] -= 1; return (energiaAtomo(z, B) - energiaAtomo(z, A)) / eV; };
  tra(ion(1, [1], 1), 13.59, 13.62, 'idrogeno (13,6)'); tra(ion(8, [2, 6], 2), 11, 17, 'ossigeno neutro (13,6)'); tra(ion(8, [1], 1), 868, 874, 'ossigeno con un elettrone solo (871)');
  tra(ion(8, [2], 1), 700, 780, 'ossigeno con due (739)'); tra(ion(26, [2, 8], 2), 1150, 1380, 'ferro con dieci (1263)'); tra(ion(26, [2], 1), 8400, 9200, 'ferro con due (8828)');
  tra(1 / ALFA, 137, 137.1, '1/α');
});

prova('lo stato della materia: gas ionizzato, zone di ionizzazione, molecole, elettroni degeneri', () => {
  const { termo, stato } = dentro, X = 0.7155, Z = 0.0142;
  tra(termo(5.7e12, 2.2e6, X, Z).nad, 0.395, 0.402, 'gradiente adiabatico del gas ionizzato (2/5)');
  tra(termo(1.4e5, 1.5e4, X, Z).nad, 0.08, 0.16, 'dove l\'idrogeno si ionizza il gradiente adiabatico crolla (~0,11)');
  tra(termo(1.6e5, 3300, X, Z).nad, 0.04, 0.12, 'e anche dove si formano le molecole H₂');
  tra(stato(2.5e-4, 5772, X, Z).P, 0.7e4, 1.3e4, 'pressione alla fotosfera del Sole (Pa)'); tra(stato(2.5e-4, 5772, X, Z).xH, 1e-5, 1e-3, 'lì l\'idrogeno è quasi tutto neutro');
  tra(stato(1e-3, 1.5e4, X, Z).xH, 0.2, 0.7, 'a 15000 K è ionizzato a metà'); assert.ok(stato(1e4, 3e4, X, Z).xH > 0.999, 'a 10 g/cm³ è ionizzato dalla pressione, anche a 30000 K');
  assert.ok(stato(5e5, 2e6, X, Z).eta > 3 && stato(1.5e5, 1.57e7, X, Z).eta < 0, 'elettroni degeneri in una nana bruna, non nel Sole');
  tra(termo(4.5e15, 3.7e7, X, Z).nad, 0.25, 0.36, 'con molta luce il gradiente adiabatico scende verso 1/4 (stella di 20 Soli)');
});

prova('l\'opacità calcolata dai processi (senza righe) sta entro un fattore 2 da quella vera nel Sole', () => {
  const k = (rho, T, X, Z) => 10 * dentro.opacitaAtomica(rho, T, X, Z); // cm²/g
  const centro = k(1.5e5, 1.57e7, 0.34, 0.02), meta = k(1.3e3, 3.9e6, 0.72, 0.0142), base = k(190, 2.2e6, 0.74, 0.0142), massiccia = k(5e3, 3e7, 0.7, 0.0142);
  tra(centro, 0.62, 2.48, 'al centro del Sole (1,24 cm²/g)'); tra(meta, 4.2, 17, 'a metà raggio (~8,5)'); tra(base, 10, 41, 'alla base della zona convettiva (~20)');
  tra(massiccia, 0.34, 0.40, 'in una stella massiccia: solo elettroni liberi (0,34)');
  assert.ok(k(1.3e3, 3.9e6, 0.72, 1e-7) < 0.35 * meta, 'senza metalli molto meno: sono loro a fermare la luce nel Sole');
  // la «ghigliottina»: rispetto alla legge di Kramers pura (4,34·10²⁵·Z(1+X)ρT^-3,5) gli atomi spogliati assorbono meno
  const kramers = (rho, T, X, Z) => 4.34e25 * Z * (1 + X) * (rho / 1e3) * T ** -3.5;
  assert.ok(kramers(1.5e5, 1.57e7, 0.34, 0.02) > 4 * centro, 'al centro del Sole Kramers darebbe molte volte di più');
  console.log(`      κ (cm²/g): centro ${n(centro)} (vero 1,24), metà raggio ${n(meta)} (~8,5), base della zona convettiva ${n(base)} (~20): mancano le righe`);
});

const sole = stella(1, { eta: 4.57e9 });
prova('IL SOLE (4,57 miliardi di anni) esce dall\'integrazione, senza tarature', () => {
  console.log(`      L ${n(sole.L, 4)} L☉ (${pc(sole.L - 1)}), R ${n(sole.R, 4)} R☉ (${pc(sole.R - 1)}), T ${sole.T.toFixed(0)} K (vero 5772: ${pc(sole.T / 5772 - 1)}), Tc ${n(sole.Tc / 1e6)} MK (15,7), ρc ${n(sole.densitaCentro / 1e3)} g/cm³ (150), vita ${n(sole.vita / 1e9)} Ga, fondo della zona convettiva a ${n(sole.fondoInvolucro)} R (vero 0,713), ${n(100 * sole.involucroConvettivo, 2)}% della massa (2,4%)`);
  confronta('luminosità del Sole', sole.L, 0.7, 1.3, '1'); confronta('raggio del Sole', sole.R, 0.7, 1.3, '1'); confronta('temperatura del Sole (K)', sole.T, 5772 * 0.9, 5772 * 1.1, '5772');
  confronta('vita del Sole (miliardi di anni)', sole.vita / 1e9, 8, 12, '~10'); confronta('temperatura al centro (milioni di K)', sole.Tc / 1e6, 15.7 / 1.5, 15.7 * 1.5, '15,7');
  confronta('obiettivo stretto: L entro il 20%', sole.L, 0.8, 1.2, '1'); confronta('obiettivo stretto: R entro il 5%', sole.R, 0.95, 1.05, '1');
  confronta('fondo della zona convettiva (r/R)', sole.fondoInvolucro, 0.65, 0.78, '0,713');
  assert.equal(sole.struttura, 'nucleo radiativo, involucro convettivo'); tra(sole.cno, 0, 0.05, 'frazione dal CNO (1%)'); tra(sole.L, 0.5, 2, 'L'); tra(sole.R, 0.5, 2, 'R');
});

prova('la legge massa–luminosità: pendenza tra 3 e 4,5 da 0,5 a 10 Soli; L cresce sempre con la massa', () => {
  const p = Math.log(stella(10).L / stella(0.5).L) / Math.log(20);
  confronta('pendenza massa–luminosità', p, 3, 4.5, '~4');
  let prima = 0; for (let M = 0.09; M < 125; M *= 1.07) { const L = stella(M, { eta: 0 }).L; assert.ok(L > prima, `L non cresce a ${M}`); prima = L; }
});

prova('stelle vere: luminosità, raggio e temperatura, modello (vero, scarto); tolleranze: L 20%, R 15%, T 8%', () => {
  const vere = [ // nome, massa, metalli (Sole = 1), età (anni), L, R, T misurati
    ['Proxima Cen', 0.122, 1.2, 4.9e9, 0.00155, 0.154, 3040], ['stella di Barnard', 0.16, 0.3, 1e10, 0.0035, 0.187, 3220],
    ['61 Cyg A', 0.70, 0.6, 6e9, 0.153, 0.665, 4530], ['alfa Cen B', 0.91, 1.5, 5.3e9, 0.50, 0.863, 5260],
    ['alfa Cen A', 1.10, 1.5, 5.3e9, 1.52, 1.22, 5790], ['Procione A', 1.50, 1, 1.9e9, 6.9, 2.05, 6530],
    ['Sirio A', 2.06, 1, 2.4e8, 25.4, 1.71, 9940], ['Vega', 2.15, 0.5, 4.5e8, 40, 2.6, 9600],
  ];
  for (const [nome, M, Z, eta, L, R, T] of vere) { const x = stella(M, { Z, eta }); stellaVera(nome, x, L, R, T); assert.ok(x.L > L / 3 && x.L < 3 * L && x.R > R / 2 && x.R < 2 * R, `${nome} fuori di un fattore 3`); }
  console.log('      (✗ = fuori tolleranza. Vega ruota quasi alla velocità di rottura e la vediamo dal polo: il suo raggio medio non è quello di una stella ferma)');
});

prova('una nana rossa di 0,2 Soli: tutta convettiva, vive mille miliardi di anni; il nucleo radiativo compare a ~0,35 Soli', () => {
  const s = stella(0.2, { eta: 5e9 });
  confronta('nana rossa di 0,2 M☉: L', s.L, 0.005, 0.01, '~0,0055'); confronta('nana rossa: R', s.R, 0.18, 0.27, '0,22'); confronta('nana rossa: T', s.T, 3000, 3600, '~3300');
  assert.equal(s.struttura, 'tutta convettiva'); tra(s.vita, 3e11, 3e12, 'vita (anni)'); assert.notEqual(stella(0.8, { eta: 1e9 }).struttura, 'tutta convettiva');
  let a = 0.15, b = 0.8; for (let i = 0; i < 30; i++) { const c = 0.5 * (a + b); if (stella(c, { eta: 0 }).struttura === 'tutta convettiva') a = c; else b = c; }
  confronta('massa sotto cui la stella è tutta convettiva', a, 0.28, 0.45, '~0,35');
});

prova('una stella di 20 Soli: 40–60 mila L alla nascita, vive 8–10 milioni di anni, nucleo convettivo, CNO', () => {
  const s = stella(20, { eta: 0 }), m = stella(20);
  confronta('20 M☉: L alla nascita', s.L, 4e4, 6e4, '4,4·10⁴'); confronta('20 M☉: vita (milioni di anni)', s.vita / 1e6, 8, 10, '8,1');
  confronta('20 M☉: T', s.T, 31000, 38000, '~35000'); confronta('20 M☉: R', s.R, 4.9, 6.7, '5,8'); tra(s.cno, 0.99, 1.001, 'CNO');
  assert.equal(s.struttura, 'nucleo convettivo, involucro radiativo'); tra(s.nucleoConvettivo, 0.35, 0.6, 'nucleo convettivo (0,46 della massa)');
  assert.ok(m.L > s.L && m.R > s.R, 'invecchiando cresce e si gonfia');
});

prova('il CNO supera la catena pp sopra una certa massa', () => {
  const dove = (eta) => { let a = 0.8, b = 4; for (let i = 0; i < 30; i++) { const c = 0.5 * (a + b); if (stella(c, eta).cno < 0.5) a = c; else b = c; } return a; };
  const meta = dove({}), nascita = dove({ eta: 0 });
  assert.ok(stella(1).cno < 0.05 && stella(4).cno > 0.8);
  console.log(`      metà della luce dal CNO a ${nascita.toFixed(2)} M☉ alla nascita, a ${meta.toFixed(2)} M☉ a metà vita; nel Sole oggi ${n(100 * sole.cno, 2)}% (misurato da Borexino: ~1%)`);
  confronta('massa a cui CNO = pp (metà vita)', meta, 1.2, 1.5, '~1,3 nei libri');
  // il nucleo convettivo (segno che al centro comanda il CNO) compare prima
  let a = 0.9, b = 3; for (let i = 0; i < 30; i++) { const c = 0.5 * (a + b); if (stella(c, { eta: 0.3 * stella(c).vita }).nucleoConvettivo < 0.02) a = c; else b = c; }
  confronta('massa a cui compare il nucleo convettivo', a, 1.1, 1.5, '~1,2');
});

prova('la massa minima: tra 0,06 e 0,1 Soli; sotto, la degenerazione vince: una nana bruna che si raffredda', () => {
  const m = massaMinima();
  confronta('massa minima con i metalli del Sole', m, 0.06, 0.1, '0,075');
  assert.ok(massaMinima({ Z: 0.01 }) > m, 'con meno metalli la fotosfera è più trasparente, perde di più: serve più massa');
  const giovane = stella(0.05, { eta: 1e8 }), vecchia = stella(0.05, { eta: 5e9 });
  assert.ok(giovane.nanaBruna && vecchia.nanaBruna && !stella(1.2 * m).nanaBruna && giovane.vita === Infinity);
  assert.ok(vecchia.L < giovane.L / 10 && vecchia.R < giovane.R, 'si raffredda e si stringe'); tra(vecchia.R, 0.06, 0.14, 'raggio di una nana bruna vecchia (come Giove: 0,1)');
  const lim = stella(1.02 * m, { eta: 0 });
  assert.ok(dentro.stato(lim.densitaCentro, lim.Tc, 0.7155, 0.0142).eta > 1, 'al limite gli elettroni del centro sono degeneri');
  console.log(`      massa minima ${m.toFixed(4)} M☉ (Z = 0,01: ${massaMinima({ Z: 0.01 }).toFixed(4)}; Z = 3,5: ${massaMinima({ Z: 3.5 }).toFixed(4)}); al limite: L ${n(lim.L)}, T ${lim.T.toFixed(0)} K, centro a ${n(lim.Tc / 1e6)} MK; nana bruna di 0,05 M☉: ${n(giovane.L)} L☉ a 100 Ma, ${n(vecchia.L)} a 5 Ga`);
});

prova('la massa massima (pressione della luce = pressione del gas al centro) e il limite di Eddington', () => {
  tra(massaMassima(), 100, 200, 'massa massima (le più grandi che si vedono: ~150)');
  const e = [1, 10, 60, 120].map((M) => stella(M, { eta: 0 }).eddington);
  assert.ok(e[0] < e[1] && e[1] < e[2] && e[2] < e[3] && e[3] < 1, 'L/L_Eddington cresce con la massa e non supera 1');
  console.log(`      massa massima ${massaMassima().toFixed(0)} M☉; L/L_Edd: ${e.map((x) => n(x, 2)).join(', ')} a 1, 10, 60, 120 M☉`);
});

prova('il Sole giovane era più debole (vero: −28%); invecchiando ogni stella diventa più luminosa', () => {
  const nascita = stella(1, { eta: 0 }), cala = 1 - nascita.L / sole.L;
  confronta('quanto era più debole il Sole alla nascita', cala, 0.20, 0.30, '0,28');
  assert.ok(nascita.Tc < sole.Tc && nascita.idrogenoCentro > sole.idrogenoCentro && nascita.R < sole.R);
  assert.ok(stella(1, { eta: 9e9 }).L > sole.L && stella(1, { eta: 2e10 }).finita);
  console.log(`      Sole alla nascita: ${n(nascita.L)} L☉, ${n(nascita.R)} R☉; idrogeno al centro oggi ${n(sole.idrogenoCentro, 2)} (vero 0,34)`);
});

prova('pochi metalli: a parità di massa più calda e più luminosa', () => {
  for (const M of [0.3, 0.8, 1, 1.3]) { const p = stella(M, { Z: 0.03, eta: 1e9 }), r = stella(M, { Z: 1, eta: 1e9 }); assert.ok(p.T > r.T && p.L > r.L, `Z = 0,03 contro 1 a ${M} M☉`); }
  const p = stella(0.8, { Z: 0.03, eta: 1e10 }), r = stella(0.8, { Z: 1, eta: 1e10 });
  console.log(`      0,8 M☉ a 10 Ga: Z = 0,03 → ${n(p.L)} L☉, ${p.T.toFixed(0)} K; Z = 1 → ${n(r.L)} L☉, ${r.T.toFixed(0)} K`);
});

prova('la fine: nana bianca, stella di neutroni, buco nero; i confini vengono dal nucleo di elio', () => {
  const Mch = massaChandrasekhar() / MSOLE, s1 = fine(1), venti = fine(20), quaranta = fine(40);
  for (const f of [s1, venti, quaranta]) assert.deepEqual(Object.keys(f).slice(0, 5), ['tipo', 'massa', 'raggio', 'B', 'supernova']); // la forma di leggi.js
  assert.equal(s1.tipo, 'nana bianca'); assert.equal(s1.supernova, false); tra(s1.massa, 0.5, 0.65, 'la nana bianca del Sole (0,54–0,57)'); tra(s1.raggio / 6.371e6, 0.8, 2, 'grande come la Terra');
  assert.ok(venti.supernova); assert.equal(quaranta.tipo, 'buco nero'); tra(quaranta.massa, 5, 30, 'massa del buco nero'); assert.equal(quaranta.B, 0);
  assert.ok(s1.B > 1e-4 * 1e3, 'il campo cresce mentre la stella si stringe (flusso conservato)');
  tra(fine(3).massa, 0.65, 0.85, 'nana bianca da 3 Soli (legge misurata: 0,74)'); assert.equal(fine(0.3).massa, 0.3);
  const confine = (g, a, b) => { for (let i = 0; i < 40; i++) { const c = 0.5 * (a + b); if (g(c)) b = c; else a = c; } return a; };
  const c1 = confine((M) => fine(M).tipo !== 'nana bianca', 3, 30), c2 = confine((M) => fine(M).tipo === 'buco nero', 5, 100), ns = fine(0.5 * (c1 + c2));
  assert.equal(ns.tipo, 'stella di neutroni'); tra(ns.massa, 1.2, 1.5, 'massa di una stella di neutroni (1,2–1,5)'); tra(ns.raggio / 1e3, 9, 15, 'raggio (km)'); assert.ok(ns.massa * MSOLE < massaMassimaNeutroni() && ns.B > s1.B * 1e4);
  confronta('confine nana bianca / supernova (M☉)', c1, 7, 11, '8–10'); confronta('confine stella di neutroni / buco nero (M☉)', c2, 18, 30, '20–25');
  tra(nucleoElio(c1 * 1.001), Mch * 0.99, Mch * 1.02, 'al confine il nucleo di elio è la massa di Chandrasekhar');
  console.log(`      nucleo di elio a fine sequenza: ${[5, 10, 20, 40].map((M) => `${M} → ${n(nucleoElio(M))}`).join(', ')} M☉; fine(1): ${n(s1.massa)} M☉; fine(40): ${quaranta.tipo} di ${n(quaranta.massa)} M☉`);
});

prova('la forma dei dati è quella di leggi.js, per ogni massa, metallicità ed età (come le usa cosmo.js)', () => {
  const ADESSO = etaUniverso();
  for (let i = 0; i < 4000; i++) {
    const u = (i + 0.5) / 4000, M = massaNascita(u), Z = 0.01 + 3.5 * ((i * 0.618034) % 1) ** 2, eta = ADESSO * ((i * 0.381966) % 1), s = stella(M, { Z, eta: eta / ANNO }), v = stella(M);
    for (const k of ['L', 'R', 'T']) assert.ok(Number.isFinite(s[k]) && s[k] > 0, `${k} a M = ${M}, Z = ${Z}: ${s[k]}`);
    assert.ok(s.vita > 0 && v.vita > 0 && Number.isFinite(v.L)); tra(s.T, 600, 80000, `T a M = ${M}, Z = ${Z}`);
    if (eta >= stella(M, { Z }).vita * ANNO) { const f = fine(M, 1e-4, { Z }); assert.ok(['nana bianca', 'stella di neutroni', 'buco nero'].includes(f.tipo) && f.massa > 0 && f.raggio > 0 && f.B >= 0); }
  }
  assert.equal(stella(5).eta, 0.5 * stella(5).vita); tra(stella(0.3).eta / 1e9, 6.5, 7.5, 'età di una nana rossa «tipica» (miliardi di anni)');
  assert.deepEqual(stella(1.37, { Z: 0.6, eta: 1e9 }), stella(1.37, { Z: 0.6, eta: 1e9 })); // deterministica
});

prova('la tabella viene davvero dalle leggi: il Sole di età zero ricalcolato qui (integrazione e tiro) coincide', () => {
  const t0 = performance.now(), { X, Zm } = composizione(1), Xp = new Float64Array(dentro.NGU).fill(X), tav = dentro.tavolaOpacita(Zm), t1 = performance.now();
  const s = dentro.risolvi(MSOLE, Xp, Zm, tav, [37.18, 16.41, 20.30, 60.80]), t2 = performance.now(), tab = stella(1, { eta: 0 });
  assert.ok(s, 'il tiro converge'); tra(s.L / LSOLE / tab.L, 0.99, 1.01, 'L ricalcolata / tabella'); tra(s.R / RSOLE / tab.R, 0.99, 1.01, 'R'); tra(s.Tc / tab.Tc, 0.99, 1.01, 'Tc');
  // le quattro equazioni tornano: il profilo trovato è in equilibrio (peso, massa, energia) punto per punto
  const pr = dentro.profilo(MSOLE, Xp, Zm, tav, s.y); let peggio = 0;
  for (let k = 5; k < pr.length - 5; k += 7) { const [q0, r0, P0] = pr[k - 1], [q1, r1, P1, , rho] = pr[k], [q2, r2, P2] = pr[k + 1], m = q1 * MSOLE, dPdr = (P2 - P0) / (r2 - r0), dmdr = ((q2 - q0) * MSOLE) / (r2 - r0); if (Math.abs(q2 - q0) < 1e-9) continue; peggio = Math.max(peggio, Math.abs(dPdr / ((-6.674e-11 * m * rho) / (r1 * r1)) - 1), Math.abs(dmdr / (4 * Math.PI * r1 * r1 * rho) - 1)); }
  tra(peggio, 0, 0.08, 'scarto massimo dall\'equilibrio idrostatico e dalla continuità (differenze finite sul profilo)');
  console.log(`      tavola dell'opacità ${(t1 - t0).toFixed(0)} ms; un modello (${s.giri} giri di Newton) ${(t2 - t1).toFixed(0)} ms; L ${n(s.L / LSOLE, 4)}, R ${n(s.R / RSOLE, 4)} (tabella: ${n(tab.L, 4)}, ${n(tab.R, 4)})`);
});

prova('è veloce da usare: la tabella è già calcolata; stella() costa microsecondi', () => {
  const N = 200000, t0 = performance.now(); let s = 0;
  for (let i = 0; i < N; i++) s += stella(0.1 + (i % 1000) * 0.05, { Z: 0.02 + (i % 77) * 0.04, eta: 1e6 * (i % 5000) }).L;
  const us = ((performance.now() - t0) / N) * 1e3, t1 = performance.now();
  for (let i = 0; i < 20000; i++) s += fine(0.1 + (i % 1000) * 0.05, 1e-4, { Z: 1 }).massa;
  const usFine = ((performance.now() - t1) / 20000) * 1e3;
  assert.ok(s > 0 && us < 20 && usFine < 50, `stella(): ${us} µs, fine(): ${usFine} µs`);
  console.log(`      stella(): ${us.toFixed(2)} µs; fine(): ${usFine.toFixed(2)} µs; una galassia di 2500 stelle: ${(2500 * us / 1e3).toFixed(1)} ms (la tabella si rigenera con \`node strumenti/tabella_stelle.mjs\`: minuti)`);
});

// ---------- quanto cambia il resto dell'universo: il confronto con le formulette di leggi.js
console.log('\n  confronto con le formule di leggi.js (stella a metà vita; nuovo / vecchio):');
console.log('    massa      L nuova    L vecchia   rapporto     R: n / v  rapp.     T: n / v      rapp.   vita nuova   vecchia   rapp.');
for (const M of [0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 10, 20, 50, 100]) {
  const a = stella(M), o = stellaVecchia(M);
  console.log(`    ${String(M).padEnd(6)} ${n(a.L).padStart(10)} ${n(o.L).padStart(11)}  ×${(a.L / o.L).toFixed(2).padEnd(6)} ${n(a.R).padStart(6)} / ${n(o.R).padEnd(5)} ×${(a.R / o.R).toFixed(2)}  ${a.T.toFixed(0).padStart(6)} / ${o.T.toFixed(0).padEnd(6)} ×${(a.T / o.T).toFixed(2)}  ${n(a.vita).padStart(9)} ${n(o.vita).padStart(9)}  ×${(a.vita / o.vita).toFixed(2)}`);
}
{
  const N = 5000, q = { L: [], R: [], T: [], vita: [] };
  for (let i = 0; i < N; i++) { const M = massaNascita((i + 0.5) / N), a = stella(M), o = stellaVecchia(M); for (const k in q) q[k].push(Math.log(a[k] / o[k])); }
  const tipico = (v) => Math.exp(v.reduce((s, x) => s + Math.abs(x), 0) / v.length), mediano = (v) => Math.exp([...v].sort((a, b) => a - b)[v.length >> 1]);
  console.log('  scarto tipico sulle stelle che nascono (masse di Kroupa; fattore medio, e rapporto mediano nuovo/vecchio):');
  for (const k in q) console.log(`    ${k.padEnd(5)} fattore ×${tipico(q[k]).toFixed(2)}   mediana ×${mediano(q[k]).toFixed(2)}`);
  const vive = (f) => { let c = 0; for (let i = 0; i < N; i++) { const M = massaNascita((i + 0.5) / N); if (0.5 * etaUniverso() / ANNO < f(M).vita) c++; } return (100 * c) / N; };
  console.log(`  stelle ancora in sequenza principale a metà dell'età dell'universo: ${vive(stella).toFixed(1)}% (leggi.js: ${vive(stellaVecchia).toFixed(1)}%)`);
  const brune = (Z) => { let c = 0; for (let i = 0; i < N; i++) if (stella(massaNascita((i + 0.5) / N), { Z }).nanaBruna) c++; return ((100 * c) / N).toFixed(1); };
  console.log(`  nane brune tra le «stelle» di Kroupa (da 0,08 M☉): ${brune(1)}% con i metalli del Sole, ${brune(0.01)}% con Z = 0,01 (massa minima ${massaMinima({ Z: 0.01 }).toFixed(3)} M☉)`);
}
console.log(`\ntest_stelle: ${ok} prove passate` + (nonTorna.length ? `; ${nonTorna.length} confronti con il vero NON TORNANO:` : '; tutti i confronti con il vero tornano'));
for (const x of nonTorna) console.log('   ✗', x);
