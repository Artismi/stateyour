// test_stelle.mjs — le stelle calcolate dalla struttura: i numeri veri (il Sole, Sirio, Proxima…), ciò che deve
// emergere (massa minima, CNO, Sole giovane, metalli), la fine, i tempi, e il confronto con le formulette di leggi.js
import assert from 'node:assert/strict';
import { stella, fine, massaMinima, massaMassima, nucleoElio, composizione, preparaTabella, DATI, ALFA, dentro as interno } from '../src/camera/stelle.js';
import { stella as stellaVecchia, fine as fineVecchia, massaNascita, massaChandrasekhar, massaMassimaNeutroni, COSTANTI, MSOLE, RSOLE, LSOLE, ANNO, etaUniverso } from '../src/camera/leggi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => Number(x).toPrecision(c);
const pc = (x) => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(0)}%`;

// la tabella si calcola al primo uso: qui la si chiede tutta, per misurare il tempo
const msTabella = preparaTabella();
console.log(`  (tabella di tutte le metallicità: ${msTabella} ms, una volta sola)`);

prova('dalle costanti: Lane-Emden, Thomson, Kramers, il picco di Gamow', () => {
  const { laneEmden, sigmaV, SIGMA_T, C_ES, C_FF } = interno;
  tra(laneEmden(3).xi1, 6.896, 6.898, 'primo zero del polìtropo n = 3 (6,897)');
  tra(laneEmden(3).m1, 2.0180, 2.0185, 'la sua massa (2,0182)');
  tra(laneEmden(1.5).xi1, 3.653, 3.655, 'primo zero del polìtropo n = 3/2 (3,654)');
  tra(SIGMA_T / 1e-29, 6.64, 6.66, 'sezione d\'urto di Thomson (6,652·10⁻²⁹ m²), da α, ħ, c, mₑ');
  tra(C_ES * 10, 0.198, 0.201, 'opacità degli elettroni liberi (0,2·(1+X) cm²/g)');
  tra(C_FF * 1e4, 3.4e22, 4.0e22, 'Kramers per il frenamento (3,68·10²²·(1+X)(X+Y)·ρ·T^-3,5 cm²/g), dalle costanti');
  // la ripidezza delle reazioni: d ln⟨σv⟩/d ln T al centro del Sole (pp ≈ 4; CNO ≈ 20: è la barriera di Coulomb)
  const esp = (Z2, A2, S) => { const r = (T) => { const [a, tau] = sigmaV(T, 1, Z2, 1, A2, S); return Math.log(a) - tau; }; return (r(1.6e7) - r(1.5e7)) / Math.log(16 / 15); };
  tra(esp(1, 1, DATI.S11), 3.5, 4.5, 'esponente della catena pp a 15 milioni di K');
  tra(esp(7, 14, DATI.S114), 17, 22, 'esponente del ciclo CNO a 15 milioni di K');
  // il centro del Sole (150 g/cm³, 15,7 milioni di K, X = 0,34): la catena pp dà ~1,7 mW per kg (un mucchio di foglie marce)
  const e = interno.energia(1.5e5, 1.57e7, 0.34, 0.02);
  tra(e[0] * 1e3, 0.7, 2.5, 'energia della catena pp al centro del Sole (mW/kg)');
  tra(e[1] / e[0], 0.02, 0.3, 'CNO su pp al centro del Sole');
  tra(1 / ALFA, 137, 137.1, '1/α');
});

prova('il Sole (4,57 miliardi di anni): L, R entro il 30%, T entro il 10%, vita 8–12 miliardi di anni, centro a ~15 milioni di K', () => {
  const s = stella(1, { eta: 4.57e9 });
  tra(s.L, 0.7, 1.3, 'luminosità'); tra(s.R, 0.7, 1.3, 'raggio'); tra(s.T, 5772 * 0.9, 5772 * 1.1, 'temperatura (5772 K)');
  tra(s.vita / 1e9, 8, 12, 'vita in sequenza principale (miliardi di anni)');
  tra(s.Tc / 1e6, 15.7 / 1.5, 15.7 * 1.5, 'temperatura al centro (milioni di K: 15,7)');
  tra(s.densitaCentro / 1e3, 50, 300, 'densità al centro (g/cm³: 150)');
  tra(s.cno, 0, 0.05, 'frazione dal CNO (1%)');
  assert.equal(s.struttura, 'nucleo radiativo, involucro convettivo');
  // la luminosità è TARATA (il coefficiente della ghigliottina): senza taratura, con il valore dei libri?
  const t0 = DATI.ghigliottina[0]; DATI.ghigliottina[0] = DATI.ghigliottina[2];
  const tr = interno.traccia(1, 1); DATI.ghigliottina[0] = t0;
  let k = 0; while (k < tr.n - 2 && tr.t[k + 1] < 4.57e9) k++;
  const u = (4.57e9 - tr.t[k]) / (tr.t[k + 1] - tr.t[k]), Llibri = Math.exp(tr.lL[k] + u * (tr.lL[k + 1] - tr.lL[k]));
  console.log(`      Sole: L ${n(s.L)} (tarata; con l'opacità dei libri ${n(Llibri)}), R ${n(s.R)}, T ${s.T.toFixed(0)} K, vita ${n(s.vita / 1e9)} Ga, Tc ${n(s.Tc / 1e6)} MK, involucro convettivo ${n(100 * s.involucroConvettivo, 2)}% della massa (vero: 2,4%)`);
  tra(Llibri, 0.2, 0.7, 'il Sole con l\'opacità dei libri (la struttura di prova lo dà fioco)');
});

prova('la legge massa–luminosità: pendenza tra 3 e 4,5 da 0,5 a 10 Soli; L cresce sempre con la massa', () => {
  const p = Math.log(stella(10).L / stella(0.5).L) / Math.log(20);
  tra(p, 3, 4.5, 'pendenza');
  let prima = 0; for (let M = 0.09; M < 140; M *= 1.07) { const L = stella(M, { eta: 0 }).L; assert.ok(L > prima, `L non cresce a ${M}`); prima = L; }
  console.log(`      pendenza ${p.toFixed(2)}`);
});

prova('stelle vere: Sirio A, Proxima, 61 Cygni A, alfa Centauri B, Vega', () => {
  const vere = [ // nome, massa, metalli (Sole = 1), età (anni), L, R, T misurati
    ['Proxima Cen', 0.122, 1.2, 4.9e9, 0.00155, 0.154, 3040], ['stella di Barnard', 0.16, 0.3, 1e10, 0.0035, 0.187, 3220],
    ['61 Cyg A', 0.70, 0.6, 6e9, 0.153, 0.665, 4530], ['alfa Cen B', 0.91, 1.5, 5.3e9, 0.50, 0.863, 5260],
    ['alfa Cen A', 1.10, 1.5, 5.3e9, 1.52, 1.22, 5790], ['Procione A', 1.50, 1, 1.9e9, 6.9, 2.05, 6530],
    ['Sirio A', 2.06, 1, 2.4e8, 25.4, 1.71, 9940], ['Vega', 2.15, 0.5, 4.5e8, 40, 2.6, 9600],
  ];
  const s = Object.fromEntries(vere.map(([nome, M, Z, eta, L, R, T]) => { const x = stella(M, { Z, eta }); console.log(`      ${nome.padEnd(18)} L ${n(x.L).padStart(8)} (vera ${String(L).padStart(7)}, ${pc(x.L / L - 1).padStart(5)})  R ${n(x.R)} (${R}, ${pc(x.R / R - 1)})  T ${x.T.toFixed(0)} (${T}, ${pc(x.T / T - 1)})`); return [nome, x]; }));
  tra(s['Sirio A'].L, 18, 36, 'Sirio A (25,4 L☉)');
  tra(s['Proxima Cen'].L, 0.001, 0.0025, 'Proxima'); tra(s['Proxima Cen'].R, 0.13, 0.18, 'raggio di Proxima (0,154)'); tra(s['Proxima Cen'].T, 2800, 3300, 'T di Proxima (3040 K)');
  tra(s['61 Cyg A'].L, 0.11, 0.2, '61 Cyg A (0,153)'); tra(s['61 Cyg A'].T, 4200, 4900, 'T di 61 Cyg A');
  tra(s['alfa Cen B'].L, 0.35, 0.7, 'alfa Cen B (0,50)');
  tra(s.Vega.L, 28, 55, 'Vega (40)');
});

prova('una nana rossa di 0,2 Soli: 0,005–0,01 L, tutta convettiva, vive mille miliardi di anni', () => {
  const s = stella(0.2, { eta: 5e9 });
  tra(s.L, 0.005, 0.01, 'luminosità'); tra(s.R, 0.18, 0.27, 'raggio (0,22)'); tra(s.T, 3000, 3600, 'temperatura (3300 K)');
  assert.equal(s.struttura, 'tutta convettiva'); tra(s.vita, 3e11, 3e12, 'vita (anni)');
  assert.equal(stella(0.4).struttura, 'tutta convettiva'); assert.notEqual(stella(0.8).struttura, 'tutta convettiva');
});

prova('una stella di 20 Soli: 40–60 mila L alla nascita, vive 7–10 milioni di anni, nucleo convettivo, CNO', () => {
  const s = stella(20, { eta: 0 }), m = stella(20);
  tra(s.L, 4e4, 6e4, 'luminosità alla nascita'); tra(s.vita / 1e6, 7, 10, 'vita (milioni di anni: 8,1)');
  tra(s.T, 30000, 40000, 'temperatura (35000 K)'); tra(s.R, 4.5, 7, 'raggio (5,8)'); tra(s.cno, 0.99, 1.001, 'CNO');
  assert.equal(s.struttura, 'nucleo convettivo, involucro radiativo'); tra(s.nucleoConvettivo, 0.35, 0.6, 'nucleo convettivo (0,46 della massa)');
  assert.ok(m.L > s.L && m.R > s.R, 'invecchiando cresce e si gonfia');
  console.log(`      20 M☉: L ${n(s.L)} alla nascita, ${n(m.L)} a metà vita; vita ${n(s.vita / 1e6)} Ma (vera 8,1)`);
});

prova('il CNO supera la catena pp sopra una certa massa (vero: ~1,3 Soli)', () => {
  const dove = (eta) => { let a = 0.8, b = 4; for (let i = 0; i < 30; i++) { const c = 0.5 * (a + b); if (stella(c, eta).cno < 0.5) a = c; else b = c; } return a; };
  const meta = dove({}), nascita = dove({ eta: 0 });
  assert.ok(stella(1).cno < 0.05 && stella(3).cno > 0.7);
  tra(meta, 1.2, 2.0, 'massa a cui CNO = pp (a metà vita)');
  console.log(`      CNO = pp a ${meta.toFixed(2)} M☉ a metà vita, a ${nascita.toFixed(2)} alla nascita (vero ~1,3: qui viene più in alto)`);
});

prova('la massa minima: tra 0,06 e 0,1 Soli; sotto, la degenerazione vince: una nana bruna che si raffredda', () => {
  const m = massaMinima();
  tra(m, 0.06, 0.1, 'massa minima (0,075)');
  assert.ok(massaMinima({ Z: 0.01 }) > m && massaMinima({ Z: 3.5 }) < m, 'con meno metalli la fotosfera è più trasparente, perde di più: serve più massa');
  const giovane = stella(0.05, { eta: 1e8 }), vecchia = stella(0.05, { eta: 1e10 });
  assert.ok(giovane.nanaBruna && vecchia.nanaBruna && !stella(0.09).nanaBruna && giovane.vita === Infinity);
  assert.ok(vecchia.L < giovane.L / 10 && vecchia.R < giovane.R, 'si raffredda e si stringe');
  tra(vecchia.R, 0.06, 0.13, 'raggio di una nana bruna vecchia (come Giove: 0,1)');
  // la causa: al centro di una stella al limite gli elettroni sono degeneri (D = nₑλ³/2 > 1), nel Sole no
  const lim = stella(1.02 * m, { eta: 0 }), X = composizione(1).X;
  assert.ok(interno.degenerazione(lim.densitaCentro, lim.Tc, X, 0.0142) > 1 && interno.degenerazione(1.5e5, 1.57e7, 0.34, 0.02) < 0.5);
  console.log(`      massa minima ${m.toFixed(4)} M☉ (Z = 0,01: ${massaMinima({ Z: 0.01 }).toFixed(4)}; Z = 3,5: ${massaMinima({ Z: 3.5 }).toFixed(4)}); al limite: L ${n(lim.L)}, T ${lim.T.toFixed(0)} K, centro a ${n(lim.Tc / 1e6)} MK`);
});

prova('la massa massima (pressione della luce = pressione del gas al centro) e il limite di Eddington', () => {
  tra(massaMassima(), 100, 200, 'massa massima (le più grandi che si vedono: ~150)');
  const e = [1, 10, 60, 150].map((M) => stella(M, { eta: 0 }).eddington);
  assert.ok(e[0] < e[1] && e[1] < e[2] && e[2] < e[3] && e[3] < 1, 'L/L_Eddington cresce con la massa e non supera 1');
  tra(e[3], 0.3, 1, 'a 150 Soli la luce regge buona parte del peso');
  console.log(`      massa massima ${massaMassima().toFixed(0)} M☉; L/L_Edd: ${e.map((x) => n(x, 2)).join(', ')} a 1, 10, 60, 150 M☉`);
});

prova('il Sole giovane era più debole (vero: −28%); invecchiando ogni stella diventa più luminosa', () => {
  const ora = stella(1, { eta: 4.57e9 }), nascita = stella(1, { eta: 0 }), cala = 1 - nascita.L / ora.L;
  tra(cala, 0.10, 0.30, 'quanto era più debole');
  assert.ok(nascita.Tc < ora.Tc && nascita.idrogenoCentro > ora.idrogenoCentro && nascita.R < ora.R);
  assert.ok(stella(1, { eta: 9e9 }).L > ora.L && stella(1, { eta: 2e10 }).finita);
  console.log(`      Sole alla nascita: ${n(nascita.L)} L☉ (−${(100 * cala).toFixed(0)}%; vero −28%), idrogeno al centro oggi ${n(ora.idrogenoCentro, 2)} (vero 0,34)`);
});

prova('pochi metalli: a parità di massa più calda e più luminosa', () => {
  for (const M of [0.3, 0.8, 1, 1.3]) {
    const p = stella(M, { Z: 0.03, eta: 1e9 }), r = stella(M, { Z: 1, eta: 1e9 }), rr = stella(M, { Z: 3, eta: 1e9 });
    assert.ok(p.T > r.T && p.L > r.L, `Z = 0,03 contro 1 a ${M} M☉`); if (M <= 1) assert.ok(r.T > rr.T, `Z = 1 contro 3 a ${M} M☉`); // (sopra, l'elio in più che accompagna i metalli la riscalda)
  }
  const p = stella(0.8, { Z: 0.03, eta: 1e10 }), r = stella(0.8, { Z: 1, eta: 1e10 });
  console.log(`      0,8 M☉ a 10 Ga: Z = 0,03 → ${n(p.L)} L☉, ${p.T.toFixed(0)} K; Z = 1 → ${n(r.L)} L☉, ${r.T.toFixed(0)} K`);
});

prova('la fine: nana bianca, stella di neutroni, buco nero; i confini vengono dal nucleo di elio', () => {
  const Mch = massaChandrasekhar() / MSOLE, sole = fine(1), venti = fine(20), quaranta = fine(40);
  for (const f of [sole, venti, quaranta]) assert.deepEqual(Object.keys(f).slice(0, 5), ['tipo', 'massa', 'raggio', 'B', 'supernova']); // la forma di leggi.js
  assert.equal(sole.tipo, 'nana bianca'); assert.equal(sole.supernova, false); tra(sole.massa, 0.5, 0.65, 'la nana bianca del Sole (0,54–0,57)'); tra(sole.raggio / 6.371e6, 0.8, 2, 'grande come la Terra');
  assert.equal(venti.tipo, 'stella di neutroni'); assert.ok(venti.supernova); tra(venti.massa, 1.2, 1.5, 'massa di una stella di neutroni (1,2–1,5)'); tra(venti.raggio / 1e3, 9, 15, 'raggio (km)');
  assert.equal(quaranta.tipo, 'buco nero'); tra(quaranta.massa, 5, 25, 'massa del buco nero'); assert.equal(quaranta.B, 0);
  assert.ok(venti.massa * MSOLE < massaMassimaNeutroni());
  assert.ok(sole.B > 1e-4 * 1e3 && venti.B > sole.B * 1e4, 'il campo cresce mentre la stella si stringe (flusso conservato)');
  tra(fine(3).massa, 0.65, 0.85, 'nana bianca da 3 Soli (legge misurata: 0,74)'); assert.equal(fine(0.3).massa, 0.3); assert.ok(fine(9.5).massa < Mch);
  // i confini: dove il nucleo di elio supera Chandrasekhar; dove supera la soglia del collasso senza esplosione
  const confine = (g, a, b) => { for (let i = 0; i < 40; i++) { const c = 0.5 * (a + b); if (g(c)) b = c; else a = c; } return a; };
  const c1 = confine((M) => fine(M).tipo !== 'nana bianca', 3, 30), c2 = confine((M) => fine(M).tipo === 'buco nero', 5, 100);
  tra(c1, 7, 11, 'confine nana bianca / supernova (vero: 8–10 Soli)'); tra(c2, 18, 30, 'confine stella di neutroni / buco nero (20–25)');
  tra(nucleoElio(c1 * 1.001), Mch * 0.99, Mch * 1.02, 'al confine il nucleo di elio è la massa di Chandrasekhar');
  assert.ok(nucleoElio(20) > nucleoElio(10) && nucleoElio(20) / 20 > nucleoElio(10) / 10, 'il nucleo cresce più in fretta della stella');
  console.log(`      confini: nana bianca fino a ${c1.toFixed(1)} M☉ (leggi.js: 8), buco nero da ${c2.toFixed(1)} M☉ (leggi.js: 34); nucleo di elio: ${[5, 10, 20, 40].map((M) => `${M} → ${n(nucleoElio(M))}`).join(', ')} M☉`);
  console.log(`      fine(1): ${n(sole.massa)} M☉ (leggi.js ${n(fineVecchia(1).massa)}); fine(20): ${venti.tipo} ${n(venti.massa)} (${fineVecchia(20).tipo} ${n(fineVecchia(20).massa)}); fine(40): ${quaranta.tipo} ${n(quaranta.massa)} (${fineVecchia(40).tipo} ${n(fineVecchia(40).massa)})`);
});

prova('la forma dei dati è quella di leggi.js, per ogni massa, metallicità ed età (come le usa cosmo.js)', () => {
  const ADESSO = etaUniverso();
  for (let i = 0; i < 4000; i++) {
    const u = (i + 0.5) / 4000, M = massaNascita(u), Z = 0.01 + 3.5 * ((i * 0.618034) % 1) ** 2, eta = ADESSO * ((i * 0.381966) % 1), s = stella(M, { Z, eta: eta / ANNO }), v = stella(M);
    for (const k of ['L', 'R', 'T']) assert.ok(Number.isFinite(s[k]) && s[k] > 0, `${k} a M = ${M}, Z = ${Z}: ${s[k]}`);
    assert.ok(s.vita > 0 && v.vita > 0 && Number.isFinite(v.L)); tra(s.T, 800, 70000, `T a M = ${M}, Z = ${Z}`);
    const viva = eta < stella(M, { Z }).vita * ANNO; // il confronto che fa cosmo.js
    if (!viva) { const f = fine(M, 1e-4, { Z }); assert.ok(['nana bianca', 'stella di neutroni', 'buco nero'].includes(f.tipo) && f.massa > 0 && f.raggio > 0 && f.B >= 0); }
  }
  // senza età: a metà della vita, o a metà dell'età dell'universo per chi vive di più
  assert.equal(stella(5).eta, 0.5 * stella(5).vita); tra(stella(0.3).eta / 1e9, 6.5, 7.5, 'età di una nana rossa «tipica» (miliardi di anni)');
  assert.deepEqual(stella(1.37, { Z: 0.6, eta: 1e9 }), stella(1.37, { Z: 0.6, eta: 1e9 })); // deterministica
});

prova('la tabella interpola bene il calcolo diretto (entro il 12%)', () => {
  let peggio = 0;
  for (const [M, Z] of [[0.25, 0.3], [0.95, 2], [1.4, 0.5], [2.7, 0.3], [6.5, 0.03], [17, 2], [55, 0.3]]) {
    const tr = interno.traccia(M, Z), s = stella(M, { Z, eta: 0 }), e = Math.max(Math.abs(Math.log(s.L) - tr.lL[0]), Math.abs(Math.log(s.R) - tr.lR[0]), Math.abs(Math.log(s.vita / tr.vita)));
    peggio = Math.max(peggio, e); assert.ok(e < 0.12, `interpolazione a M = ${M}, Z = ${Z}: ${e}`);
  }
  console.log(`      scarto massimo tra tabella e calcolo diretto (L, R, vita): ${(100 * peggio).toFixed(1)}%`);
});

prova('è veloce: tabella sotto il secondo (attesi ~300 ms), poi microsecondi a stella', () => {
  const N = 200000, t0 = performance.now(); let s = 0;
  for (let i = 0; i < N; i++) s += stella(0.1 + (i % 1000) * 0.05, { Z: 0.02 + (i % 77) * 0.04, eta: 1e6 * (i % 5000) }).L;
  const us = ((performance.now() - t0) / N) * 1e3, t1 = performance.now();
  for (let i = 0; i < 20000; i++) s += fine(0.1 + (i % 1000) * 0.05, 1e-4, { Z: 1 }).massa;
  const usFine = ((performance.now() - t1) / 20000) * 1e3;
  assert.ok(s > 0 && us < 20 && usFine < 50 && msTabella < 1500, `stella(): ${us} µs, fine(): ${usFine} µs, tabella: ${msTabella} ms`);
  console.log(`      tabella ${msTabella} ms (una volta); stella(): ${us.toFixed(2)} µs; fine(): ${usFine.toFixed(2)} µs; una galassia di 2500 stelle: ${(2500 * us / 1e3).toFixed(1)} ms`);
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
  console.log(`  scarto tipico sulle stelle che nascono (masse di Kroupa; fattore medio, e rapporto mediano nuovo/vecchio):`);
  for (const k in q) console.log(`    ${k.padEnd(5)} fattore ×${tipico(q[k]).toFixed(2)}   mediana ×${mediano(q[k]).toFixed(2)}`);
  const vive = (f) => { let c = 0; for (let i = 0; i < N; i++) { const M = massaNascita((i + 0.5) / N); if (0.5 * etaUniverso() / ANNO < f(M).vita) c++; } return (100 * c) / N; };
  console.log(`  stelle ancora in sequenza principale a metà dell'età dell'universo: ${vive(stella).toFixed(1)}% (leggi.js: ${vive(stellaVecchia).toFixed(1)}%)`);
  const brune = (() => { let c = 0; for (let i = 0; i < N; i++) if (stella(massaNascita((i + 0.5) / N)).nanaBruna) c++; return (100 * c) / N; })();
  console.log(`  nane brune tra le «stelle» di Kroupa (da 0,08 M☉), con i metalli del Sole: ${brune.toFixed(1)}%; con Z = 0,01 la massa minima è ${massaMinima({ Z: 0.01 }).toFixed(3)}: lì tra 0,08 e quella sono nane brune`);
}
void RSOLE; void LSOLE; void COSTANTI;
console.log(`\ntest_stelle: ${ok} prove passate`);
