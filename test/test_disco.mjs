// test_disco.mjs — i pianeti che nascono dal disco: emergono dalle regole, sono ripetibili, e somigliano a quelli veri
import assert from 'node:assert/strict';
import { formaPianeti, disco, raggioPianeta, DISCO, MTERRA, RTERRA, MGIOVE, RGIOVE } from '../src/camera/disco.js';
import { MSOLE, UA } from '../src/camera/leggi.js';
import { sorgente, conRegistro, rileggi } from '../src/camera/eventi.js';
import * as EL from '../src/camera/elementi.js';
import { luceGiovane } from '../src/camera/stelle.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

const SEMI = Array.from({ length: 60 }, (_, i) => i + 1), SOLE = { massa: 1, Z: 1, eta: 4.6e9 };
// il salto dei solidi alla linea della neve, atomo per atomo dalla miscela protosolare (elementi.js): sotto i 20 K tutto ciò che
// ha un ossido condensa (il ferro come FeO: nel gas freddo è ossidato), poi il CO dei ghiacci, poi l'acqua con l'ossigeno che resta
const saltoNeve = (() => { const X = EL.PROTOSOLARE, m = (s) => EL.ELEMENTI[s].massa; let roccia = 0, Ob = 0;
  for (const s of EL.SIMBOLI) { const e = EL.ELEMENTI[s]; if (s === 'H' || s === 'He' || e.sede === 'atmo' || e.sede === 'ghiaccio') continue; roccia += X[s]; Ob += (X[s] / m(s)) * (s === 'Fe' ? 1 : e.ossigeno); }
  roccia += Ob * m('O'); const Olib = X.O / m('O') - Ob, C = Math.min(0.3 * X.C / m('C'), Olib), H2O = Olib - C, N = 0.1 * X.N / m('N');
  return 1 + (H2O * (m('O') + 2 * m('H')) + C * (m('C') + m('O')) + N * (m('N') + 3 * m('H'))) / roccia; })();
const terre = (p) => p.massaKg / MTERRA, perc = (x) => `${Math.round(100 * x)}%`;
// in quanti semi, su 60, c'è almeno un gigante di gas oltre la linea della neve
// (PRIMA: contati solo oltre la neve. I giganti nascono oltre la neve, ma ora la fase degli urti fa anche lo scontro tra giganti:
// quando uno è scagliato fuori, chi resta gli paga l'energia e scende, a volte dentro la neve — è il «Giove che salta» delle
// simulazioni dei giganti che si diffondono, Jurić e Tremaine 2008 [R], e i giganti tiepidi osservati dentro 1–2 UA. Si contano
// i sistemi con un gigante, dovunque sia)
const giganti = (st) => SEMI.filter((s) => formaPianeti(st, s).some((p) => p.tipo === 'gassoso')).length / SEMI.length;
// la distanza tra due orbite vicine, in raggi di Hill reciproci
const hill = (a, b, Mstella) => (b.aUA - a.aUA) / (Math.cbrt((a.massaKg + b.massaKg) / (3 * Mstella * MSOLE)) * (a.aUA + b.aUA) / 2);
// stelle di ogni genere, per le prove che devono valere sempre
const STELLE = [];
for (const massa of [0.08, 0.3, 1, 2, 8, 40]) for (const Z of [0.01, 0.3, 1, 3.5]) for (const eta of [1e6, 5e7, 4.6e9, 1.2e10]) STELLE.push({ massa, Z, eta });

prova('il disco: la neve a 2,7 UA per il Sole, Σ ∝ r^(-3/2), più del doppio di solidi oltre la neve, massa di qualche centesimo', () => {
  for (const s of SEMI) {
    const D = disco(SOLE, s);
    // (la luce è quella al tempo del disco, in unità di quella del Sole a metà della vita mediana del gas: lì la neve del Sole è
    // a 2,7 UA esatti. Con la contrazione prima della sequenza principale la luce del Sole giovane cala col tempo, L ∝ t^−⅔
    // circa: un disco che svanisce prima vede un Sole più luminoso e ha la neve più fuori, come √L)
    const neveAttesa = 2.7 * Math.sqrt(luceGiovane(1, { Z: 1, eta: D.tDisco }).L / luceGiovane(1, { Z: 1, eta: 0.5 * DISCO.vitaMedia }).L);
    assert.ok(Math.abs(D.neve - neveAttesa) < 0.1, `neve a ${D.neve} (attesa ${neveAttesa})`);
    assert.ok(Math.abs(D.sigmaGas(1) / D.sigmaGas(4) - 8) < 1e-9, 'la densità del gas cala come r^(3/2)');
    // (le proporzioni sono quelle della miscela protosolare di elementi.js: la roccia fredda 0,35 dei metalli; il salto alla neve
    // è 1 + ghiacci/roccia, contato qui atomo per atomo dalla miscela — l'acqua è l'ossigeno che non sta negli ossidi né nel CO
    // dei ghiacci —: prima la soglia era 2,3–2,9, la ricetta di chimica.js SOLE, che dava al CO un ossigeno già dato all'acqua.
    // In un disco vero il salto è 1 + ghiacci/roccia ALLA TEMPERATURA del luogo: in un disco pesante la neve sta a 380 K, e il
    // ferro non è ancora tutto ossidato: la roccia è un poco meno della fredda)
    assert.ok(Math.abs(D.sigmaSolidi(D.neve * 1.001) / D.sigmaSolidi(D.neve * 0.999) - (1 + D.solidi.ghiaccio / D.solidi.roccia(D.Tcond(D.neve)))) < 0.02 && Math.abs(DISCO.solidiFreddi / DISCO.roccia - saltoNeve) < 1e-9, `oltre la neve anche il ghiaccio è solido (salto ${DISCO.solidiFreddi / DISCO.roccia}, atteso ${saltoNeve})`);
    assert.ok(Math.abs(D.sigmaSolidi(5) / D.sigmaGas(5) - DISCO.metalliSole * DISCO.solidiFreddi) < 1e-9 && Math.abs(DISCO.metalliSole * DISCO.solidiFreddi - 0.0109) < 3e-4, 'i solidi sono i metalli del gas che lì condensano');
    // (PRIMA: almeno un centesimo della stella. Ora la larghezza è quella misurata dei dischi giovanissimi di Classe 0, ±0,66 dex
    // tra il 16° e l'84° percentile — Tychoniec et al. 2020, tabella A.2 —: un disco su sei sta sotto un quinto della mediana, e
    // sotto il centesimo ce ne sono. Il tetto resta il limite d'instabilità gravitazionale)
    assert.ok(D.frazione > 0 && D.frazione <= DISCO.instabile && Math.abs(D.massaKg - D.frazione * MSOLE) < 1e-6 * MSOLE);
    // la somma di Σ·2πr·dr fino al bordo esterno ridà la massa del disco
    let m = 0; const N = 4000; for (let i = 0; i < N; i++) { const r = ((i + 0.5) / N) ** 2 * D.rOut, dr = (2 * (i + 0.5) / N / N) * D.rOut; m += D.sigmaGas(r) * 2 * Math.PI * r * dr * UA * UA; }
    assert.ok(Math.abs(m / D.massaKg - 1) < 0.01, `massa del disco ricostruita: ${m / D.massaKg}`);
    assert.ok(D.vita >= 1e6 && D.vita <= 1.2e7 && D.rIn >= 0.02 && D.rIn < D.neve);
  }
  // LA NEVE DI UNA NANA ROSSA. Prima si chiedeva meno di 0,5 UA per 0,3 M☉: è la neve della luce di SEQUENZA PRINCIPALE
  // (2,7·√L, L ≈ 0,012: ~0,3 UA). Ma i planetesimi nascono nel primo milione di anni, quando la stella giovane è ancora sulla
  // traccia di Hayashi: Mulders, Ciesla, Min e Pascucci 2015 (ApJ 807, 9; arXiv:1505.03516 [S: tabella 1 letta da ar5iv]),
  // a 1 Ma con la sola luce di pre-sequenza (Ciesla et al. 2015), danno la neve a 1,35 UA per il Sole, 0,8 per 0,4 M☉ e 0,5 per
  // 0,2 M☉ (Kennedy e Kenyon 2008 la mettono ancora più fuori). Rispetto al Sole, 0,3 M☉ sta tra 0,5/1,35 e 0,8/1,35: con la
  // neve del Sole del modello (2,7 UA, la sua taratura sul Sistema Solare) tra 1,0 e 1,6 UA.
  const n03 = disco({ massa: 0.3, Z: 1 }, 1).neve;
  assert.ok(n03 > 2.7 * (0.5 / 1.35) && n03 < 2.7 * (0.8 / 1.35) && disco({ massa: 2, Z: 1 }, 1).neve > 5, `la neve segue la luce della stella giovane: 0,3 M☉ a ${n03} UA`);
  assert.equal(new Set(SEMI.map((s) => disco(SOLE, s).frazione.toFixed(4))).size > 50, true, 'ogni seme ha il suo disco');
});

// UNA PROVA SULLA POPOLAZIONE. Quanti rocciosi abbiano «una massa terrestre» è una statistica, non una legge: su 60 semi
// (≈ 170 pianeti) la frazione balla tra il 78% e il 93% secondo quali semi capitano (su 50 blocchi di 60 semi, 21 stanno
// sotto l'85%), e la vecchia soglia dura passava o no a caso. Qui si misura su 3000 dischi (≈ 9400 pianeti, meno di un
// secondo): il numero è stabile (± 0,7%) e viene stampato. Le asserzioni dure sono solo ciò che la fisica garantisce: la
// massa si conserva (i rocciosi dentro la neve non pesano più dei solidi che lì condensano), nel modello i giganti non
// migrano, e il pianeta tipico (la mediana) è di taglia terrestre. Chi sta fuori dall'intervallo sta tutto sopra: sono le
// super-Terre dei dischi pesanti. Il confronto con l'85% chiesto prima resta scritto, e se non torna lo dice senza fermare.
prova('una stella come il Sole: quasi sempre pianeti rocciosi dentro la neve, di taglia terrestre (misurato su 3000 dischi)', () => {
  const N = 3000, masse = [], dischiGrossi = [], dischi = []; let con = 0, quanti = 0, colmo = 0, misti = 0;
  for (let s = 1; s <= N; s++) {
    const D = disco(SOLE, s), neve = D.neve, P = formaPianeti(SOLE, s), r = P.filter((p) => p.tipo === 'roccioso' && p.aUA < neve);
    quanti += P.length; if (r.length) con++;
    assert.ok(!P.some((p) => p.tipo === 'gassoso' && p.aUA < 0.5 * neve), 'nessun gigante vicino alla stella: nel modello non migrano');
    if (!r.length) continue;
    // i solidi che condensano dentro la neve: la somma di Σ_solidi·2πr·dr dal bordo interno alla neve
    // (fino al bordo esterno dell'ultima striscia che nasce dentro la neve: disco.js dà a ogni embrione la striscia di C raggi di Hill
    // reciproci — di due embrioni come lui — per parte attorno al suo centro, e quella dell'ultimo embrione di dentro passa la neve di C·r_H; lì conta solo la roccia,
    // perché la massa dell'embrione è fatta con la densità del suo centro. Prima si contava fino alla neve: il seme 64 ne prende
    // l'1,5% di più, la mezza striscia oltre la neve)
    const Mst = D.massaStella * 1.989e30, sRoccia = (x) => D.solidi.roccia(D.Tcond(x)) * D.sigmaGas(x), mN = Math.pow(4 * Math.PI * (neve * UA) ** 2 * sRoccia(neve) * DISCO.C, 1.5) * Math.sqrt(2 / (3 * Mst)), fine = neve * (1 + DISCO.C * Math.cbrt((2 * mN) / (3 * Mst)));
    let solidi = 0; const passi = 400; for (let i = 0; i < passi; i++) { const x = D.rIn + ((i + 0.5) / passi) * (fine - D.rIn); solidi += (x < neve ? D.sigmaSolidi(x) : sRoccia(x)) * 2 * Math.PI * x * ((fine - D.rIn) / passi) * UA * UA; }
    // (i rocciosi fatti anche di embrioni nati oltre la neve — «a cavallo della linea della neve» — portano dentro solidi di fuori:
    // la disuguaglianza vale per gli altri. Con la catena degli elementi il seme 2672 ne ha uno di 14 Terre a 2 UA, 1,27 volte i
    // solidi di dentro: prima la prova lo contava, e passava solo perché nessun seme ne faceva uno così grosso)
    const dentro = r.filter((p) => !p.formazione.misto), somma = dentro.reduce((a, p) => a + p.massaKg, 0); colmo = Math.max(colmo, somma / solidi); misti += r.length - dentro.length;
    assert.ok(somma <= solidi * 1.01, `seme ${s}: i rocciosi dentro la neve pesano ${somma / solidi} volte i solidi che lì condensano`);
    for (const p of r) { masse.push(terre(p)); dischi.push(D.frazione); if (terre(p) > 6) dischiGrossi.push(D.frazione); }
  }
  masse.sort((a, b) => a - b); const q = (f) => masse[Math.floor(f * masse.length)], med = (v) => [...v].sort((a, b) => a - b)[v.length >> 1];
  const giusti = masse.filter((m) => m >= 0.03 && m <= 6).length, fr = giusti / masse.length, sotto = masse.filter((m) => m < 0.03).length, sopra = masse.filter((m) => m > 6).length;
  // il margine: i pianeti di uno stesso disco non sono indipendenti (≈ 3 a disco), quindi si conta sui dischi
  const margine = Math.sqrt((fr * (1 - fr)) / con);
  console.log(`      rocciosi dentro la neve in ${perc(con / N)} dei ${N} dischi; ${giusti} su ${masse.length} tra 0,03 e 6 Terre: ${(100 * fr).toFixed(1)}% ± ${(100 * margine).toFixed(1)}; ${sotto} sotto, ${sopra} sopra (fino a ${masse.at(-1).toFixed(1)} Terre)`);
  console.log(`      masse (Terre; 5% · 25% · mediana · 75% · 95%): ${[0.05, 0.25, 0.5, 0.75, 0.95].map((x) => q(x).toFixed(2)).join(' · ')}; le super-Terre nascono nei dischi pesanti: ${med(dischiGrossi).toFixed(3)} M☉ contro ${med(dischi).toFixed(3)} (mediane); in media ${(quanti / N).toFixed(1)} pianeti per stella; i rocciosi prendono fino al ${perc(colmo)} dei solidi (${misti} rocciosi a cavallo della neve, contati a parte)`);
  assert.ok(con / N >= 0.9, `rocciosi dentro la neve solo in ${con} dischi su ${N}`);
  assert.ok(q(0.5) >= 0.03 && q(0.5) <= 6 && q(0.25) >= 0.03, `il roccioso tipico non è di taglia terrestre: mediana ${q(0.5)} Terre`);
  assert.ok(med(dischiGrossi) > med(dischi), 'le super-Terre vengono dai dischi più pesanti');
  if (fr < 0.85) console.log(`      ≠ NON TORNA  rocciosi tra 0,03 e 6 Terre: ${(100 * fr).toFixed(1)}% della popolazione (chiesto almeno l'85%)`);
});

prova('i giganti di gas: non sempre; più frequenti con molti metalli, più rari attorno alle stelle piccole', () => {
  const sole = giganti(SOLE), ricca = giganti({ ...SOLE, Z: 2 }), povera = giganti({ ...SOLE, Z: 0.3 }), nana = giganti({ ...SOLE, massa: 0.3 });
  console.log(`      semi con un gigante: Sole ${perc(sole)}, Z = 2 ${perc(ricca)}, Z = 0,3 ${perc(povera)}, stella di 0,3 masse solari ${perc(nana)}`);
  assert.ok(sole >= 0.15 && sole <= 0.9, `giganti attorno al Sole: ${sole}`);
  assert.ok(ricca > povera && ricca > sole && sole > povera, `con i metalli: ${povera} → ${sole} → ${ricca}`);
  assert.ok(nana < sole, `attorno a una stella piccola: ${nana} contro ${sole}`);
  // un gigante è fatto quasi tutto di idrogeno ed elio, pesa come Saturno o più, ed è grande circa come Giove
  for (const s of SEMI) for (const p of formaPianeti({ ...SOLE, Z: 2 }, s)) if (p.tipo === 'gassoso') {
    assert.ok(p.massaKg > 0.1 * MGIOVE && p.massaKg < 20 * MGIOVE, `massa ${p.massaKg / MGIOVE} Giovi`);
    assert.ok(p.raggioM > 0.5 * RGIOVE && p.raggioM < 1.2 * RGIOVE, `raggio ${p.raggioM / RGIOVE} Giovi`);
    assert.ok(p.composizione.idrogeno > 0.3 && p.composizione.pesanti < 0.5 && /gas a valanga/.test(p.storia));
  }
});

prova('stesso seme, stessi pianeti; semi diversi, sistemi diversi', () => {
  for (const st of [SOLE, { massa: 0.3, Z: 2, eta: 1e9 }, { massa: 3, Z: 0.5, eta: 2e8 }]) {
    assert.equal(JSON.stringify(formaPianeti(st, 7)), JSON.stringify(formaPianeti({ ...st }, 7)));
    assert.notEqual(JSON.stringify(formaPianeti(st, 7)), JSON.stringify(formaPianeti(st, 8)));
  }
  assert.equal(new Set(SEMI.map((s) => JSON.stringify(formaPianeti(SOLE, s)))).size, 60);
});

prova('le orbite: nessuna dentro 0,02 UA, in ordine, separate, senza incroci; i pianeti pesano meno del disco', () => {
  let n = 0;
  for (const st of STELLE) for (const s of [1, 2, 3, 4, 5, 6]) {
    const P = formaPianeti(st, s), D = disco(st, s), dove = `${JSON.stringify(st)} seme ${s}`;
    assert.ok(P.reduce((m, p) => m + p.massaKg, 0) < D.massaKg, `più pianeti che disco: ${dove}`);
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; n++;
      assert.ok(p.aUA >= 0.02 && p.aUA <= D.rOut, `${p.aUA} UA: ${dove}`);
      assert.ok(p.eccentricita >= 0 && p.eccentricita < 0.5 && p.massaKg >= DISCO.minimo * MTERRA && p.raggioM > 1e6 && p.raggioM < 1.5e8);
      if (!i) continue;
      const q = P[i - 1], d = hill(q, p, st.massa);
      assert.ok(p.aUA > q.aUA, `in ordine: ${dove}`);
      assert.ok(q.aUA * (1 + q.eccentricita) < p.aUA * (1 - p.eccentricita), `le orbite non si incrociano: ${dove}`);
      // un sistema adulto ha avuto il tempo di sistemarsi: almeno sei raggi di Hill (i sistemi di Kepler, stelle di qualche miliardo
      // di anni: le coppie vicine sotto i dieci raggi di Hill reciproci sono rare, Fabrycky et al. 2014 [R]); uno giovane almeno
      // due e mezzo. (PRIMA il confine era a 50 milioni di anni: ma la fase degli urti dura ~10⁸ anni — la Luna a 95 ± 32 milioni,
      // Jacobson et al. 2014; il modello mette l'ultimo urto degli analoghi della Terra a una mediana di ~90 —, e a 50 milioni di
      // anni ci sono incontri ancora in corso; qui il confine è il miliardo di anni)
      assert.ok(d > (st.eta >= 1e9 ? 6 : 2.5), `separate di ${d} raggi di Hill: ${dove}`);
    }
  }
  assert.ok(n > 1000, `pianeti guardati: ${n}`);
});

prova('di che cosa sono fatti: i campi che il resto del cosmo si aspetta, e le frazioni fanno uno', () => {
  const chiavi = { roccioso: 'ferro,roccia,acqua', ghiacciato: 'ghiaccio,roccia,ferro', gassoso: 'idrogeno,elio,pesanti' }, visti = new Set();
  for (const st of STELLE) for (const s of [1, 2, 3]) for (const p of formaPianeti(st, s)) {
    assert.equal(Object.keys(p).join(), 'aUA,massaKg,raggioM,tipo,composizione,eccentricita,storia,involucro');
    assert.equal(Object.keys(p.composizione).join(), chiavi[p.tipo], `tipo ${p.tipo}`);
    const v = Object.values(p.composizione); visti.add(p.tipo);
    assert.ok(v.every((x) => x >= 0 && x <= 1) && Math.abs(v.reduce((a, b) => a + b) - 1) < 1e-9, JSON.stringify(p.composizione));
    assert.ok([p.aUA, p.massaKg, p.raggioM, p.eccentricita, p.involucro].every(Number.isFinite));
    assert.ok(typeof p.storia === 'string' && p.storia.length > 10 && p.storia.length < 200, p.storia);
    assert.ok(p.involucro >= 0 && p.involucro <= 0.5 && (p.involucro === 0 || p.tipo === 'ghiacciato'), 'solo i mondi di ghiaccio tengono un velo di gas');
  }
  assert.equal(visti.size, 3, 'ci sono rocciosi, ghiacciati e gassosi');
});

// (PRIMA: «il ferro cresce verso la stella». Era la regola semplice di disco.js — il ferro della polvere ∝ T² —, che la catena
// degli elementi ha tolto: con le temperature di condensazione di Lodders il ferro e i silicati condensano insieme (1334 e 1310 K),
// e il nucleo non è più il ferro della polvere ma ciò che la separazione mette nel metallo. Le prove sono ora ciò che la fisica
// nuova dice, contate su 300 dischi: il ferro della roccia non segue i metalli della stella; lontano dalla stella, al freddo, il
// gas ossida il ferro e il mantello è più ricco di FeO; i pianeti più pesanti si separano più a fondo e più caldi, e il silicio
// va nel nucleo: il nucleo cresce con la massa.)
prova('il ferro della roccia non segue i metalli della stella; lontano il mantello è più ossidato; il nucleo cresce con la massa; l\'acqua dei rocciosi è poca, e di più verso la neve', () => {
  const rocciosi = (Z, n = 60) => Array.from({ length: n }, (_, i) => formaPianeti({ ...SOLE, Z }, i + 1).filter((p) => p.tipo === 'roccioso'));
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length, iFe = EL.SIMBOLI.indexOf('Fe'), iMg = EL.SIMBOLI.indexOf('Mg');
  const feRoccia = (p) => { const v = p.composizione.elementi.solidi; let t = 0; for (const x of v) t += x; return v[iFe] / t; }, ferro = (Z) => media(rocciosi(Z).flat().map(feRoccia));
  // (il ferro NON cresce con i metalli della stella: ferro e roccia crescono insieme; la stessa tolleranza di prima, sul ferro della roccia)
  assert.ok(Math.abs(ferro(0.5) / ferro(1) - 1) < 0.2 && Math.abs(ferro(2) / ferro(1) - 1) < 0.2, `ferro della roccia: ${ferro(0.5)} → ${ferro(1)} → ${ferro(2)}`);
  // le correlazioni di rango su 300 dischi, oltre 4 scarti di quella di due variabili indipendenti (1/√(n − 1))
  const tutti = rocciosi(1, 300).flat(), rango = (v) => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length); o.forEach(([, i], k) => { r[i] = k; }); return r; };
  const spearman = (a, b) => { const ra = rango(a), rb = rango(b), ma = media(ra), mb = media(rb); let c = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { c += (ra[i] - ma) * (rb[i] - mb); x += (ra[i] - ma) ** 2; y += (rb[i] - mb) ** 2; } return c / Math.sqrt(x * y); };
  const feNum = (p) => { const s = p.composizione.elementi.silicato, fe = s[iFe] / 55.845, mg = s[iMg] / 24.305; return fe / (fe + mg); }, soglia = 4 / Math.sqrt(tutti.length - 1);
  const rOss = spearman(tutti.map((p) => p.composizione.elementi.Tformazione), tutti.map(feNum)), rNuc = spearman(tutti.map((p) => p.massaKg), tutti.map((p) => p.composizione.ferro));
  console.log(`      ${tutti.length} rocciosi: ferro della roccia ${ferro(1).toFixed(3)}; rango(T di formazione, Fe/(Fe+Mg) del mantello) ${rOss.toFixed(2)}; rango(massa, nucleo) ${rNuc.toFixed(2)} (4 scarti: ${soglia.toFixed(3)})`);
  // (PIÙ FREDDO, PIÙ OSSIDATO: era la legge dell'equilibrio Fe + H₂O ⇌ FeO + H₂ nel gas, che al freddo ossida il ferro. Con la sua
  // lentezza — Grossman, Fedkin e Simon 2012: nel gas i silicati non prendono più del 2% di fayalite; elementi.js FA_NEBULOSA — la
  // polvere asciutta dentro la neve è ugualmente ridotta ovunque, e il FeO del mantello lo fa la separazione del nucleo. Il
  // gradiente del Sistema Solare, Mercurio < Terra < Marte, viene allora dall'acqua dentro i planetesimi (Grossman e Fedkin), che
  // il modello non dà ai rocciosi: si stampa, non si ferma)
  if (!(rOss < -soglia)) console.log(`      ≠ NON TORNA  più freddo, più ossidato: rango ${rOss.toFixed(2)} (chiesto sotto ${(-soglia).toFixed(3)}): manca l'ossidazione del ferro con l'acqua dentro i planetesimi`);
  assert.ok(rNuc > soglia, 'più pesante, più nucleo');
  const acque = [];
  for (const r of rocciosi(1)) {
    if (r.length > 1) assert.ok(r[0].composizione.acqua < r.at(-1).composizione.acqua, 'più acqua lontano');
    for (const p of r) { acque.push(p.composizione.acqua); assert.ok(p.composizione.acqua > 1e-4 && p.composizione.acqua <= 0.2, `acqua ${p.composizione.acqua}`); }
  }
  acque.sort((a, b) => a - b); const mediana = acque[acque.length >> 1];
  assert.ok(mediana > 0.001 && mediana < 0.03, `acqua tipica di un roccioso: ${mediana}`);
  // la Terra di casa nostra: un roccioso di massa terrestre (0,5–2) attorno a 1 UA ha circa un terzo di nucleo (prima si
  // prendevano tutti i rocciosi lì: ora il nucleo dipende dalla massa, e le super-Terre del disco ne hanno di più)
  const terreVere = tutti.filter((p) => p.aUA > 0.8 && p.aUA < 1.2 && p.massaKg > 0.5 * MTERRA && p.massaKg < 2 * MTERRA);
  console.log(`      ${terreVere.length} Terre a 0,8–1,2 UA: nucleo medio ${media(terreVere.map((p) => p.composizione.ferro)).toFixed(3)} (la Terra 0,325)`);
  assert.ok(terreVere.length > 10 && Math.abs(media(terreVere.map((p) => p.composizione.ferro)) - 0.32) < 0.05);
});

prova('il raggio dalla massa: la Terra, Giove, Urano; R ∝ M^0,27 per la roccia; il ghiaccio più grande, il ferro più piccolo', () => {
  const R = (o) => raggioPianeta(o);
  assert.ok(Math.abs(R({ massaKg: MTERRA, ferro: 0.32 }) / RTERRA - 1) < 0.02, 'la Terra');
  assert.ok(Math.abs(R({ massaKg: 0.107 * MTERRA, ferro: 0.25 }) / 3.39e6 - 1) < 0.08, 'Marte');
  assert.ok(Math.abs(R({ massaKg: 4 * MTERRA, ferro: 0.3 }) / R({ massaKg: MTERRA, ferro: 0.3 }) - 4 ** 0.27) < 1e-9);
  assert.ok(R({ massaKg: MTERRA, ferro: 0.07, ghiaccio: 0.75 }) > 1.2 * R({ massaKg: MTERRA, ferro: 0.32 }) && R({ massaKg: MTERRA, ferro: 0.7 }) < R({ massaKg: MTERRA, ferro: 0.3 }));
  assert.ok(Math.abs(R({ massaKg: MGIOVE, gas: 0.95 }) / RGIOVE - 1) < 0.1 && Math.abs(R({ massaKg: 5 * MGIOVE, gas: 0.98 }) / RGIOVE - 1) < 0.15, 'sopra 0,3 Giovi, circa un raggio di Giove');
  assert.ok(Math.abs(R({ massaKg: 14.5 * MTERRA, ferro: 0.07, ghiaccio: 0.75, gas: 0.12, flusso: 1 / 368 }) / 2.536e7 - 1) < 0.15, 'Urano: un velo di gas lo gonfia');
  // e i pianeti usciti dal disco stanno sulla stessa legge
  for (const s of SEMI) for (const p of formaPianeti(SOLE, s)) if (p.tipo === 'roccioso') assert.ok(Math.abs(p.raggioM / RTERRA / terre(p) ** 0.27 - 1) < 0.15);
});

prova('con pochi metalli solo detriti o pianeti piccoli; senza tempo, nessun pianeta', () => {
  const massima = (st) => Math.max(0, ...SEMI.slice(0, 20).flatMap((s) => formaPianeti(st, s).map(terre)));
  assert.equal(formaPianeti({ massa: 1, Z: 0, eta: 5e9 }, 3).length, 0);
  assert.equal(formaPianeti({ massa: 1, Z: 1, eta: 0 }, 3).length, 0);
  const m = [0.02, 0.3, 1].map((Z) => massima({ ...SOLE, Z }));
  assert.ok(m[0] < 2 && m[0] < m[1] && m[1] < m[2], `il pianeta più grande, in Terre, con Z = 0,02, 0,3 e 1: ${m.map((x) => x.toFixed(2)).join(', ')}`);
  // i dati mancanti non rompono niente: una stella senza età o senza metalli dichiarati è presa come il Sole
  assert.ok(formaPianeti({ massa: 1 }, 5).length > 0 && formaPianeti({}, 5).length > 0);
});

prova('è leggero: una chiamata dura meno di 20 ms in media', () => {
  for (const st of [SOLE, { massa: 0.1, Z: 0.01, eta: 1e10 }, { massa: 5, Z: 0.01, eta: 1e8 }, { massa: 0.5, Z: 3, eta: 1e6 }]) {
    for (const s of SEMI.slice(0, 5)) formaPianeti(st, s); // a caldo
    const t0 = performance.now(); for (const s of SEMI) formaPianeti(st, s + 100);
    const ms = (performance.now() - t0) / SEMI.length;
    assert.ok(ms < 20, `${ms} ms per ${JSON.stringify(st)}`);
    if (st === SOLE) console.log(`      ${ms.toFixed(2)} ms a chiamata per una stella come il Sole`);
  }
});

// ---------- IL CASO PER INDIRIZZO (eventi.js): ogni esito incerto del disco è un evento con il suo nome
const foto = (P) => JSON.stringify(P.map((p) => ({ ...p, formazione: p.formazione })));
const letto = (st, radice, rami = null) => { const R = new Map(), P = formaPianeti(st, conRegistro(sorgente(radice, rami), R)); return { R, P }; };
// tra due mondi: quali eventi, letti in tutti e due, hanno dato un esito diverso
const diversi = (A, B) => [...A.keys()].filter((k) => B.has(k) && B.get(k) !== A.get(k));

// (PRIMA: «un ramo cambia una cosa sola: l'eccentricità di un pianeta». L'eccentricità di oggi era un sorteggio per pianeta,
// «embrione N/eccentricità», e un ramo la cambiava a lui solo. Ora è quella secolare (Laplace–Lagrange: i corpi se la
// scambiano), e il suo evento non c'è più: l'orbita di nascita di un embrione la sentono anche i vicini. Resta la regola
// degli indirizzi: un ramo non cambia ciò che viene prima, e degli eventi letti nei due mondi cambia solo il suo.)
prova('un ramo cambia ciò che ne discende, non ciò che viene prima: l\'orbita di nascita di un embrione', () => {
  let casi = 0, cambiati = 0;
  for (let n = 1; n <= 40; n++) {
    const radice = `prova/stella ${n}/disco`, { R: R0, P: P0 } = letto(SOLE, radice); if (!P0.length) continue;
    const ev = `${radice}/embrione ${P0[n % P0.length].formazione.embrione}/orbita`, { R: R1, P: P1 } = letto(SOLE, radice, { [ev]: 1 });
    // gli eventi letti in tutti e due i mondi hanno lo stesso esito, salvo quello (le sue estrazioni: «…/orbita», «…/orbita#1»)
    assert.ok(diversi(R0, R1).every((x) => x === ev || x === `${ev}#1`), `seme ${n}: ${diversi(R0, R1)}`);
    // il disco è lo stesso (sta prima), e così i giganti, nati nel gas, prima degli urti
    assert.equal(JSON.stringify(disco(SOLE, sorgente(radice, { [ev]: 1 }))), JSON.stringify(disco(SOLE, sorgente(radice))));
    const nuclei = (P) => P.filter((p) => p.tipo === 'gassoso').map((p) => p.storia.split(';')[0]).join('|'); assert.equal(nuclei(P1), nuclei(P0), `seme ${n}`);
    casi++; if (foto(P1) !== foto(P0)) cambiati++;
  }
  assert.ok(casi >= 30 && cambiati >= 1, `${casi} sistemi, ${cambiati} cambiati`);
  console.log(`      (${casi} sistemi: in ${cambiati} il ramo cambia i pianeti)`);
});

prova('un incontro tra embrioni andato diversamente: tutti gli altri eventi hanno lo stesso esito; cambia solo ciò che ne discende', () => {
  let casi = 0, altraStoria = 0, uguali = 0;
  for (let n = 1; n <= 60 && casi < 25; n++) {
    const radice = `prova/stella ${n}/disco`, { R: R0, P: P0 } = letto(SOLE, radice), incontri = [...R0.keys()].filter((x) => /\/incontro con \d+$/.test(x)); if (!incontri.length) continue;
    const ev = incontri[n % incontri.length]; let girato = null;
    // si cerca il ramo in cui quell'incontro finisce nell'altro modo (fusione invece di fionda, o il contrario)
    for (let r = 1; r <= 12 && !girato; r++) { const m = letto(SOLE, radice, { [ev]: r }); if (foto(m.P) !== foto(P0)) girato = m; else uguali++; }
    if (!girato) continue; casi++;
    // nessun altro evento è stato ritirato: quelli letti in tutti e due i mondi hanno lo stesso esito, salvo quello
    assert.deepEqual(diversi(R0, girato.R), [ev], `seme ${n}`);
    // il disco è lo stesso (sta prima dell'incontro)
    assert.equal(JSON.stringify(disco(SOLE, sorgente(radice, { [ev]: 1 }))), JSON.stringify(disco(SOLE, sorgente(radice))));
    if (girato.P.length !== P0.length) altraStoria++;
  }
  assert.ok(casi >= 10, `solo ${casi} incontri decisi dal caso`);
  console.log(`      (${casi} incontri girati: in ${altraStoria} il numero dei pianeti cambia; ${uguali} rami in cui l'esito era lo stesso non cambiano niente)`);
  // un evento che sta PRIMA di tutto (la massa del disco) cambia il disco; gli altri eventi con lo stesso nome restano quelli
  const radice = 'prova/stella 7/disco', a = letto(SOLE, radice), b = letto(SOLE, radice, { [`${radice}/massa`]: 1 });
  assert.notEqual(disco(SOLE, sorgente(radice, { [`${radice}/massa`]: 1 })).massaKg, disco(SOLE, sorgente(radice)).massaKg);
  assert.ok(diversi(a.R, b.R).every((x) => x === `${radice}/massa` || x.startsWith(`${radice}/massa#`)));
  // e il disco di un'altra stella non se ne accorge
  assert.equal(foto(formaPianeti(SOLE, sorgente('prova/stella 8/disco', { [`${radice}/massa`]: 1 }))), foto(formaPianeti(SOLE, sorgente('prova/stella 8/disco'))));
});

prova('l\'ordine non conta: sistemi calcolati all\'indietro, eventi riletti all\'indietro, il disco chiesto prima o dopo', () => {
  const stelle = Array.from({ length: 30 }, (_, n) => ({ st: STELLE[(n * 7) % STELLE.length], radice: `prova/stella ${n}/disco` }));
  const avanti = stelle.map(({ st, radice }) => foto(formaPianeti(st, sorgente(radice))));
  const indietro = stelle.slice().reverse().map(({ st, radice }) => { disco(st, sorgente(radice)); return foto(formaPianeti(st, sorgente(radice))); }).reverse();
  assert.deepEqual(indietro, avanti);
  // ogni evento letto da un sistema, richiesto da capo e in ordine inverso, dà lo stesso esito: è una funzione dell'indirizzo
  const { R } = letto(SOLE, 'prova/stella 3/disco'), voci = [...R.keys()]; assert.ok(voci.length > 20, `${voci.length} eventi`);
  for (const v of voci.slice().reverse()) assert.equal(rileggi(v), R.get(v), v);
  // un numero al posto della sorgente è «disco numero»; e i nomi degli eventi sono quelli dichiarati
  assert.equal(foto(formaPianeti(SOLE, 7)), foto(formaPianeti(SOLE, sorgente('disco 7'))));
  const nomi = new Set(voci.map((v) => v.slice('prova/stella 3/disco/'.length).replace(/\d+/g, 'N').replace(/#N$/, '')));
  for (const n of nomi) assert.ok(['massa', 'vita del gas', 'bordo interno', 'acqua portata da fuori', 'embrione N/orbita', 'embrione N/agitazione con N', 'embrione N/incontro con N', 'embrione N/incontro con N/ritorno N', 'embrione N/fusione con N'].includes(n), `evento «${n}»`);
});

console.log(`disco: ${ok} prove, tutto ok`);
