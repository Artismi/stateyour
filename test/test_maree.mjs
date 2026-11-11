// test_maree.mjs — LA MAREA DA UNA FONTE SOLA (src/camera/maree.js), chiusa nello stato interno (storia.js) e letta dalle
// lune (lune.js). PROVE: le leggi (limiti elastico e fluido, il massimo di Maxwell in forma chiusa, e², a^−7,5, il
// termine dell'obliquità), una viscosità sola per convezione e marea, il ciclo marea → temperatura → viscosità → marea
// che trova da solo il ramo caldo e quello freddo. RISCONTRI con i corpi veri in tabella (modello / vero / torna o no):
// ciò che non torna resta scritto «≠ NON TORNA», le soglie non si allargano.
import assert from 'node:assert/strict';
import * as MR from '../src/camera/maree.js';
import { storia, tabellaStoria, STORIA, APERTI } from '../src/camera/storia.js';
import * as LU from '../src/camera/lune.js';
import * as LG from '../src/camera/leggi.js';
import { stella as stellaVera } from '../src/camera/stelle.js';

let ok = 0; const nonTorna = [], tabella = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const n = (x, c = 3) => (x == null || !Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? Number(x).toExponential(c - 1) : String(+Number(x).toPrecision(c))).replace('.', ',');
const riscontro = (che, x, a, b, vero, perche = '') => { const torna = x >= a && x <= b; tabella.push([che, n(x), vero, torna ? 'torna' : 'NON TORNA']); console.log(`      ${torna ? '=' : '≠ NON TORNA'} ${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)}; vero ${vero})${torna || !perche ? '' : ` — ${perche}`}`); if (!torna) nonTorna.push(`${che}: ${n(x, 4)} (chiesto ${n(a)}–${n(b)})${perche ? ` — ${perche}` : ''}`); return torna; };
const G = LG.COSTANTI.G, UA = LG.UA, MTERRA = 5.972e24, RTERRA = 6.371e6, MGIOVE = 1.898e27;

console.log('LE LEGGI');
prova('i limiti: corpo elastico, corpo fluido, e il massimo di Maxwell in forma chiusa', () => {
  const corpo = { massaKg: 8.93e22, raggioM: 1.82e6, rigidita: 6.5e10, viscosita: 1e21 }, rho = corpo.massaKg / ((4 / 3) * Math.PI * corpo.raggioM ** 3), mu = (19 * corpo.rigidita) / (2 * rho * ((G * corpo.massaKg) / corpo.raggioM ** 2) * corpo.raggioM), w = 4.1e-5;
  // viscosità enorme e Maxwell: la formula elastica che lune.js aveva (3/2)/(1 + 19μ/2ρgR), e nessun attrito
  const elastico = MR.dissipazione({ ...corpo, viscosita: 1e40 }, w, { reologia: 'maxwell' }); tra(elastico.k2Reale / (1.5 / (1 + mu)), 1 - 1e-9, 1 + 1e-9, 'k₂ elastico'); tra(elastico.imK2, 0, 1e-15, 'attrito del corpo elastico'); tra(elastico.rigiditaEfficace / mu, 1 - 1e-12, 1 + 1e-12, 'rigidità efficace');
  // niente rigidità: un fluido, k₂ = 3/2 e nessun attrito
  const fluido = MR.dissipazione({ ...corpo, rigidita: 1, viscosita: 1e-3 }, w); tra(fluido.k2Reale, 1.4999, 1.5, 'k₂ del fluido'); tra(fluido.imK2, 0, 1e-6, 'attrito del fluido');
  // Maxwell: −Im k₂ è massimo a ω·τ = 1/(1 + μ̃), e lì vale (3/4)·μ̃/(1 + μ̃)
  let mx = 0, dove = 0; for (let l = -6; l <= 4; l += 0.002) { const wt = Math.pow(10, l), d = MR.dissipazione({ ...corpo, viscosita: (wt * corpo.rigidita) / w }, w, { reologia: 'maxwell' }); if (d.imK2 > mx) { mx = d.imK2; dove = wt; } }
  tra(mx / ((0.75 * mu) / (1 + mu)), 0.9999, 1.0001, 'il massimo di Maxwell'); tra(dove * (1 + mu), 0.99, 1.01, 'dove sta il massimo: ω·τ·(1 + μ̃)');
  // dal lato rigido del massimo (ω·τ ≫ 1: tutti i corpi solidi) Andrade dissipa più di Maxwell; e torna Maxwell se lo
  // scorrimento transitorio è lentissimo (ζ grande). (Dal lato fluido la cedevolezza in più di Andrade toglie attrito.)
  for (const eta of [1e19, 1e21, 1e23, 1e26]) { const a = MR.dissipazione({ ...corpo, viscosita: eta }, w).imK2, m = MR.dissipazione({ ...corpo, viscosita: eta }, w, { reologia: 'maxwell' }).imK2, z = MR.dissipazione({ ...corpo, viscosita: eta }, w, { zeta: 1e30 }).imK2; assert.ok(a >= m * (1 - 1e-9), `Andrade sotto Maxwell a η = ${eta}`); tra(z / m, 0.999, 1.001, 'Andrade con ζ → ∞ è Maxwell'); }
  assert.throws(() => MR.cedevolezza(1e10, 1e20, 1e-5, { reologia: 'burgers' }), /sconosciuta/);
  console.log(`      Io: rigidità efficace μ̃ = ${n(mu)}; Maxwell al massimo ${n(mx)} a ω·τ = ${n(dove)}; a η = 10²¹ Pa·s: Andrade ${n(MR.dissipazione(corpo, w).imK2)} (Q ${n(MR.dissipazione(corpo, w).Q)}), Maxwell ${n(MR.dissipazione(corpo, w, { reologia: 'maxwell' }).imK2)} (Q ${n(MR.dissipazione(corpo, w, { reologia: 'maxwell' }).Q)})`);
});
prova('la potenza a stato interno fermo: come e², come a^−7,5, come R⁵; l\'obliquità ha il suo termine', () => {
  const o = { Mospite: MGIOVE, raggioM: 1.82e6, aM: 4.22e8, eccentricita: 0.0041, obliquita: 0 }, f = MR.forzanteMareale(o);
  tra(MR.forzanteMareale({ ...o, eccentricita: 0.0082 }) / f, 4 - 1e-9, 4 + 1e-9, 'e²'); tra(MR.forzanteMareale({ ...o, aM: 2 * o.aM }) / f, 2 ** -7.5 * (1 - 1e-9), 2 ** -7.5 * (1 + 1e-9), 'a^−7,5'); tra(MR.forzanteMareale({ ...o, raggioM: 2 * o.raggioM }) / f, 32 - 1e-9, 32 + 1e-9, 'R⁵');
  assert.equal(MR.forzanteMareale({ ...o, eccentricita: 0 }), 0); assert.equal(MR.potenzaMareale(o, 0.015, 1), f * 0.015);
  // il termine dell'obliquità: (3/2)·sin²ε contro (21/2)·e²: pesano uguale quando sin ε = √7·e
  const soloAsse = MR.forzanteMareale({ ...o, eccentricita: 0, obliquita: (Math.asin(Math.sqrt(7) * 0.0041) * 180) / Math.PI }); tra(soloAsse / f, 1 - 1e-9, 1 + 1e-9, 'obliquità equivalente');
  // con il k₂/Q misurato su Io (0,015 ± 0,003, Lainey 2009 via Park 2025) la formula ridà il flusso osservato
  riscontro('Io con il k₂/Q misurato (0,015): la formula dà (W/m²)', (f * 0.015) / (4 * Math.PI * o.raggioM ** 2), 1.5, 3, '2–2,5 (osservato)');
  // la formula è scritta una volta: lune.js la legge da qui
  const IO = { massaKg: 8.93e22, raggioM: 1.82e6, aM: 4.22e8, eccentricita: 0.0041 }, GIOVE = { tipo: 'gassoso', massaKg: MGIOVE, raggioM: 7.15e7, aM: 5.2 * UA, Mstella: LG.MSOLE };
  tra((LU.caloreMareale(GIOVE, IO) * 4 * Math.PI * IO.raggioM ** 2) / (f * LU.k2QLuna(GIOVE, IO)), 1 - 1e-9, 1 + 1e-9, 'caloreMareale di lune.js = forzante di maree.js × k₂/Q');
});
prova('una viscosità sola: quella della convezione (storia.js) è quella della marea (maree.js); il fuso la abbassa insieme alla rigidità', () => {
  assert.equal(STORIA.nuRif, MR.MAREE.roccia.nuRif); assert.equal(STORIA.Enu, MR.MAREE.roccia.Enu); assert.equal(STORIA.costa, MR.MAREE.costa);
  tra(MR.viscositaRoccia(1600) / (3300 * 6e7 * Math.exp(3e5 / (LG.R_GAS * 1600))), 1 - 1e-12, 1 + 1e-12, 'Arrhenius'); assert.equal(MR.epsilonFuso(0), 1);
  let prima = 1; for (const F of [0.1, 0.3, 0.5, 0.7, 0.9]) { const e = MR.epsilonFuso(F); assert.ok(e > prima, 'più fuso, meno viscosità'); prima = e; tra(MR.rigiditaRoccia(F) * e / MR.MAREE.roccia.rigidita, 1 - 1e-12, 1 + 1e-12, 'rigidità ∝ 1/ε'); tra(MR.viscositaRoccia(1700, F) * e / MR.viscositaRoccia(1700), 1 - 1e-12, 1 + 1e-12, 'viscosità ∝ 1/ε'); }
  tra(MR.viscositaGhiaccio(273), 0.999e14, 1.001e14, 'ghiaccio al punto di fusione (Pa·s)'); tra(MR.viscositaGhiaccio(200) / MR.viscositaGhiaccio(260) / Math.exp((MR.MAREE.ghiaccio.E / LG.R_GAS) * (1 / 200 - 1 / 260)), 1 - 1e-9, 1 + 1e-9, 'ghiaccio: Arrhenius');
  for (const k of ['andradeAlfa', 'andradeZeta']) tra(APERTI[k].valore, APERTI[k].intervallo[0], APERTI[k].intervallo[1], `${k} nel suo intervallo`);
  // LA DISSIPAZIONE SALE AVVICINANDOSI ALLA FUSIONE E CALA QUANDO FONDE TROPPO: un massimo dentro l'intervallo, non ai bordi
  const w = MR.motoMedio(MGIOVE, 4.22e8), sol = 1400, liq = 2050, curva = []; for (let T = 900; T <= 2050; T += 10) { const F = Math.min(1, Math.max(0, (T - sol) / (liq - sol))); curva.push([T, F, MR.dissipazione({ massaKg: 8.93e22, raggioM: 1.82e6, rigidita: MR.rigiditaRoccia(F), viscosita: MR.viscositaRoccia(T, F) }, w).imK2]); }
  const picco = curva.reduce((a, b) => (b[2] > a[2] ? b : a)); assert.ok(picco[0] > sol && picco[0] < liq && picco[2] > 100 * curva[0][2] && picco[2] > 100 * curva.at(-1)[2], `il massimo sta a ${picco[0]} K`);
  for (let k = 1; k < curva.length && curva[k][0] <= sol; k++) assert.ok(curva[k][2] > curva[k - 1][2], 'sotto il solidus la dissipazione cresce con la temperatura');
  console.log(`      per un corpo come Io: −Im k₂ = ${n(curva[0][2])} a 900 K, ${n(curva.find((c) => c[0] === 1400)[2])} al solidus, massimo ${n(picco[2])} a ${picco[0]} K (fuso ${n(picco[1])}), ${n(curva.at(-1)[2])} tutto fuso`);
});

console.log('\nIL CICLO CHIUSO: marea → temperatura → viscosità → marea (storia.js)');
const corpoDi = (M, R, ferro, marea, altro = {}) => ({ tipo: 'roccioso', massaKg: M, raggioM: R, composizione: { ferro, acqua: 0 }, marea, ...altro });
const IO_M = { Mospite: MGIOVE, aM: 4.217e8, eccentricita: 0.0041, obliquita: 0 }, io = (e = 0.0041) => corpoDi(8.932e22, 1.8216e6, 0.2, { ...IO_M, eccentricita: e });
prova('il ramo caldo e il ramo freddo emergono dalla stessa equazione: nessun interruttore', () => {
  const caldo = storia(io(), 4.5e9, { Tsuperficie: 110 }), fermo = storia(io(0), 4.5e9, { Tsuperficie: 110 }), A = 4 * Math.PI * 1.8216e6 ** 2;
  // senza eccentricità: nessuna marea, il corpo si raffredda da solo
  assert.equal(fermo.Q.marea, 0); assert.ok(fermo.fuso.kgAnno < 1e-3 * caldo.fuso.kgAnno && fermo.q < 0.05);
  // con l'eccentricità di Io: all'equilibrio il calore che esce è quello di marea (più il poco radiogenico), e a portarlo fuori è il magma
  tra((caldo.Q.conv + caldo.Q.fuso) / (caldo.Q.marea + caldo.Q.rad + caldo.Q.cmb), 0.9, 1.1, 'equilibrio: calore che esce / calore che entra'); assert.ok(caldo.Q.marea > 10 * caldo.Q.rad && caldo.Q.fuso > caldo.Q.conv, 'il regime di Io: marea ≫ radioattività, e il calore esce con il magma');
  assert.ok(caldo.marea.fusoSottoIlCoperchio > 0.2 && caldo.marea.fusoSottoIlCoperchio < 0.9, 'in parte fuso: né solido né oceano di magma'); assert.ok(caldo.Tum > fermo.Tum + 50);
  // il potere dissipato è la forzante × −Im k₂ × la parte di volume del mantello, con il k₂ dello stato
  const st = tabellaStoria(io(), { Tsuperficie: 110 }).struttura; tra(caldo.Q.marea / (MR.forzanteMareale({ ...IO_M, raggioM: 1.8216e6 }) * caldo.marea.imK2 * st.parteMantello), 0.999, 1.001, 'Q_marea = forzante × −Im k₂ × volume');
  // È UN EQUILIBRIO STABILE: lo stesso corpo guardato a 1, 3 e 4,5 miliardi di anni è nello stesso stato (cala piano con la radioattività)
  const a1 = storia(io(), 1e9, { Tsuperficie: 110 }), a3 = storia(io(), 3e9, { Tsuperficie: 110 }); tra(a1.Q.marea / caldo.Q.marea, 0.8, 1.3, 'marea a 1 Ga / oggi'); tra(a3.Tum - caldo.Tum, -5, 15, 'T a 3 Ga − oggi (K)');
  // più forzante, più calore, e più che in proporzione a e² (il mantello più caldo dissipa di più): fino al massimo della curva
  const doppio = storia(io(0.0082), 4.5e9, { Tsuperficie: 110 }); assert.ok(doppio.Q.marea > 4 * caldo.Q.marea, `e doppia: ${doppio.Q.marea / caldo.Q.marea} volte`);
  // la reologia: con Maxwell lo stesso Io non trova il ramo caldo (lontano dalla fusione non dissipa quasi niente)
  const mx = storia(io(), 4.5e9, { Tsuperficie: 110, rami: { maxwell: 1 } });
  riscontro('Io: calore di marea all\'equilibrio (W/m²)', caldo.Q.marea / A, 2, 2.5, '2–2,5 (~10¹⁴ W)', 'corpo omogeneo: −Im k₂ all\'equilibrio è ' + n(caldo.marea.imK2) + ' (misurato 0,015 ± 0,003); manca lo strato molle sotto la crosta, e il magma qui porta via solo il calore sensibile');
  riscontro('Io: k₂', caldo.marea.k2, 0.078, 0.172, '0,125 ± 0,047 (Juno, Park e altri 2025 [R])', 'tutto il corpo ha qui la rigidità del mantello in parte fuso: la crosta fredda e rigida di Io non c\'è');
  riscontro('Io: magma che risale (km³/anno)', caldo.fuso.kgAnno / 2900 / 1e9, 100, 1000, '~400 (1 cm/anno di ricopertura)');
  console.log(`      Io: T del mantello ${n(caldo.Tum, 4)} K, fuso ${n(caldo.marea.fusoSottoIlCoperchio)}, marea ${n(caldo.Q.marea)} W, Q ${n(caldo.marea.Q)}; senza eccentricità ${n(fermo.Tum, 4)} K e ${fermo.crosta.regime}; con e doppia ${n(doppio.Q.marea / A)} W/m²; con Maxwell ${n(mx.Q.marea / A)} W/m² (Q ${n(mx.marea.Q)}); con α = 0,2: ${n(storia(io(), 4.5e9, { Tsuperficie: 110, rami: { andradeAlfa: 0.2 } }).Q.marea / A)} W/m²`);
});
prova('la Luna, la Terra solida, Mercurio, TRAPPIST-1 b e c: lo stesso corpo omogeneo, ciascuno con il suo stato', () => {
  // la Luna oggi: k₂ e Q al mese (misurati con il laser: 0,024 e ~38)
  const luna = storia(corpoDi(7.35e22, 1.737e6, 0.02, { Mospite: MTERRA, aM: 3.844e8, eccentricita: 0.0549, obliquita: 6.68 }), 4.5e9, { Tsuperficie: 250 });
  riscontro('Luna: k₂', luna.marea.k2, 0.02, 0.028, '0,024'); riscontro('Luna: Q al mese', luna.marea.Q, 25, 60, '~38');
  riscontro('Luna: calore di marea oggi (W)', luna.Q.marea, 1e8, 1e10, '~10⁹ (trascurabile: la radioattività ne dà ' + n(luna.Q.rad) + ')');
  // la Terra solida alla marea di mezza giornata della Luna: lo stato del mantello di oggi dalla sua storia
  const terra = { tipo: 'roccioso', massaKg: MTERRA, raggioM: RTERRA, composizione: { ferro: 0.32, roccia: 0.674, acqua: 0.006 }, Lw: stellaVera(1, { Z: 1, eta: 4.5e9 }).L * LG.LSOLE, aM: UA, Mstella: LG.MSOLE, giorno: 86164 }, sT = storia(terra, 4.5e9, { stella: { eta: 4.5e9, Z: 1, massa: 1 } });
  const nLuna = MR.motoMedio(MTERRA, 3.844e8), omega = 2 * ((2 * Math.PI) / 86164 - nLuna), dT = MR.dissipazione({ massaKg: MTERRA, raggioM: RTERRA, rigidita: MR.rigiditaRoccia(sT.marea.fusoSottoIlCoperchio), viscosita: MR.viscositaRoccia(sT.Tum, sT.marea.fusoSottoIlCoperchio) }, omega);
  riscontro('Terra solida: Q alla marea di mezza giornata', dT.Q, 150, 500, '~280 (Ray e altri 2001 [R])', 'tutto il pianeta ha qui la viscosità del mantello superiore; il mantello profondo, più viscoso, dissipa meno');
  riscontro('Terra solida: k₂', dT.k2Reale, 0.28, 0.32, '0,30', 'corpo omogeneo con la rigidità della roccia in superficie (6,5·10¹⁰ Pa): nel mantello vero, sotto pressione, è tre-quattro volte di più');
  // la marea della Luna nella Terra solida: (3/2)·(k₂/Q)·G·m²·R⁵/a⁶·(Ω − n). Il vero: 3,7 TW in tutto, quasi tutti nel mare (mare.js), ~0,1 nella roccia
  const solida = 1.5 * dT.imK2 * ((G * 7.35e22 ** 2 * RTERRA ** 5) / 3.844e8 ** 6) * ((2 * Math.PI) / 86164 - nLuna);
  riscontro('marea della Luna dissipata nella Terra solida (TW)', solida / 1e12, 0.05, 0.3, '~0,1 (dei 3,7 TW totali: il resto è nel mare)');
  // Mercurio (in risonanza 3:2: la formula del corpo sincrono è qui un ordine di grandezza)
  const mer = storia({ tipo: 'roccioso', massaKg: 3.301e23, raggioM: 2.4397e6, composizione: { ferro: 0.68, acqua: 0 }, Lw: terra.Lw, aM: 0.387 * UA, Mstella: LG.MSOLE, eccentricita: 0.2056, giorno: 58.65 * 86400 }, 4.5e9, { stella: { eta: 4.5e9, Z: 1, massa: 1 } });
  riscontro('Mercurio: k₂', mer.marea.k2, 0.54, 0.6, '0,57 ± 0,03 (MESSENGER, Genova e altri 2019 [R])', 'corpo omogeneo: il grande nucleo liquido di Mercurio, che fa quasi tutto il suo k₂, qui non si deforma a parte');
  riscontro('Mercurio: calore di marea / calore radiogenico', mer.Q.marea / mer.Q.rad, 0, 0.1, 'trascurabile');
  // TRAPPIST-1 b e c (Agol e altri 2021 [R]: masse, raggi, orbite; stella 0,0898 M☉): flusso di marea dalle stime pubblicate
  const Ms = 0.0898 * LG.MSOLE, Lt = 5.5e-4 * LG.LSOLE, trap = (M, R, a, e) => { const P = { tipo: 'roccioso', massaKg: M * MTERRA, raggioM: R * RTERRA, composizione: { ferro: 0.3, acqua: 0 }, Lw: Lt, aM: a * UA, Mstella: Ms, eccentricita: e }; return storia(P, 7.6e9, { stella: { eta: 7.6e9, Z: 1, massa: 0.0898 } }); };
  const b = trap(1.374, 1.116, 0.01154, 0.006), c = trap(1.308, 1.097, 0.0158, 0.007), area = (R) => 4 * Math.PI * (R * RTERRA) ** 2;
  riscontro('TRAPPIST-1 b: flusso di marea (W/m²)', b.Q.marea / area(1.116), 1, 4, '~2–3 (Barr e altri 2018 [R, non riletto])'); riscontro('TRAPPIST-1 c: flusso di marea (W/m²)', c.Q.marea / area(1.097), 0.3, 2, '~1 (Barr e altri 2018 [R, non riletto])');
  console.log(`      Terra: Q = ${n(dT.Q)} a ${n((2 * Math.PI) / omega / 3600)} ore, k₂/Q = ${n(dT.imK2)} (lune.js k2QPianeta usa ancora 0,3/30 = 0,01 con il mare e 0,3/100 senza: è la marea DEL MARE, che qui non c'è); Mercurio: marea ${n(mer.Q.marea)} W, Q ${n(mer.marea.Q)}; TRAPPIST-1 b: T ${n(b.Tum, 4)} K, fuso ${n(b.marea.fusoSottoIlCoperchio)}, −Im k₂ ${n(b.marea.imK2)}, ${b.crosta.regime}; c: −Im k₂ ${n(c.marea.imK2)}`);
});

console.log('\nLE LUNE (lune.js legge la nuova fonte per la roccia; il ghiaccio non ancora)');
prova('le firme di lune.js restano, e per la roccia leggono la storia: niente più due stati né il k₂/Q fisso di Io', () => {
  const GIOVE = { tipo: 'gassoso', massaKg: MGIOVE, raggioM: 7.15e7, aM: 5.2 * UA, Mstella: LG.MSOLE, giorno: 35730 }, IO = { massaKg: 8.93e22, raggioM: 1.82e6, aM: 4.22e8, eccentricita: 0.0041 }, EUROPA = { massaKg: 4.8e22, raggioM: 1.561e6, aM: 6.711e8, eccentricita: 0.0094 };
  const kq = LU.k2QLuna(GIOVE, IO); assert.ok(kq > 0 && kq !== LU.MATERIALI.roccia.k2Qcaldo && kq !== LU.k2QFreddo(IO), 'il k₂/Q di Io non è né il «caldo» fisso né l\'elastico da fredda'); assert.equal(LU.stato(GIOVE, IO), 'vulcanica');
  assert.equal(LU.stato(GIOVE, { ...IO, eccentricita: 0 }), 'fredda e ferma'); assert.equal(LU.caloreMareale(GIOVE, { ...IO, eccentricita: 0 }), 0);
  // dove nemmeno la dissipazione massima conterebbe, resta l'elastico da fredda (e non si calcola la storia)
  const lontana = { ...IO, aM: 20 * IO.aM }; assert.equal(LU.k2QLuna(GIOVE, lontana), LU.k2QFreddo(lontana));
  // il ghiaccio: ancora la legge di prima (guscio a conduzione, due valori di k₂/Q): è dichiarato, e Europa ha il suo oceano come prima
  assert.equal(LU.stato(GIOVE, EUROPA), 'oceano sotto il ghiaccio'); assert.equal(LU.k2QLuna(GIOVE, EUROPA), LU.MATERIALI.ghiaccio.k2Qcaldo);
  for (const [nome, vero] of [['Europa: guscio di ghiaccio (km)', '15–25'], ['Europa: oceano (km)', '~100'], ['Encelado: potenza (GW)', '5–15 osservati; 1,1 di equilibrio (Meyer e Wisdom 2007): è noto che non torna'], ['Ganimede: oceano e dinamo', 'sì'], ['Titano', 'oceano sotto ~100 km di ghiaccio'], ['Tritone', 'marea di obliquità']]) tabella.push([nome, 'non calcolato', vero, 'NON FATTO (serve il corpo a strati)']);
  console.log(`      Io: k₂/Q = ${n(kq)} (prima 0,015 fisso), ${n(LU.caloreMareale(GIOVE, IO))} W/m²; Europa: ${n(LU.caloreMareale(GIOVE, EUROPA))} W/m² con il k₂/Q fisso del ghiaccio (0,01)`);
});

console.log('\nLA TABELLA DEI RISCONTRI (modello / vero / torna o no)');
for (const [che, x, vero, esito] of tabella) console.log(`   ${che.padEnd(62)} ${String(x).padEnd(14)} ${String(vero).padEnd(58)} ${esito}`);
console.log(`\ntest_maree: ${ok} prove passate; ${nonTorna.length} riscontri col vero NON TORNANO${nonTorna.length ? ':' : '.'}`);
for (const r of nonTorna) console.log(`   ≠ ${r}`);
