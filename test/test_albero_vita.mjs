// test_albero_vita.mjs — l'albero della vita indirizzabile (albero_vita.js): il tempo dell'antenato comune di due
// specie come funzione pura dell'indirizzo, calcolato solo dove si chiede. Solo la struttura: niente organismi.
import assert from 'node:assert/strict';
import { TASSI, attese, ritmoPer, alberoVita, radiceMassima, alberoDelPianeta, FOGLIE_MAX } from '../src/camera/albero_vita.js';
import { sorgente } from '../src/camera/eventi.js';
import * as CO from '../src/camera/cosmo.js';

let ok = 0; const T0 = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const T = 1800; // Ma: l'età degli eucarioti, il caso su cui i ritmi sono tarati

prova('i ritmi dichiarati: in 1800 milioni di anni danno le specie della Terra; due specie vicine si separano ~2 Ma fa', () => {
  const r = TASSI.nascita - TASSI.morte, N = attese(T, TASSI.nascita, r), A = alberoVita('prova/ritmi', { T });
  tra(N / 8.7e6, 0.99, 1.01, 'specie attese / 8,7 milioni (Mora e altri 2011)'); tra(ritmoPer(8.7e6, T, TASSI.nascita) / r, 0.999, 1.001, 'il ritmo netto ricavato dalla capacità');
  tra(A.quantile(0.5), 1.5, 2.5, 'la mediana della profondità tra due specie vicine (Ma; misurato: ~2, Hedges e altri 2015)');
  tra(A.ripartizione(A.quantile(0.3)), 0.3 - 1e-9, 0.3 + 1e-9, 'quantile e ripartizione sono inverse'); assert.equal(A.ripartizione(T), 1);
  // senza morti (r = λ) e nel caso critico (r = 0) la legge è quella giusta
  tra(attese(10, 0.5, 0.5), Math.exp(5) - 1e-9, Math.exp(5) + 1e-9, 'Yule: e^(λt)'); assert.equal(attese(10, 0.5, 0), 6);
  console.log(`      (nascita ${TASSI.nascita}/Ma, morte ${TASSI.morte}/Ma: netto ${num(r)}/Ma, morte/nascita ${num(TASSI.morte / TASSI.nascita, 4)}; attese ${num(N)} specie; con ritmo netto zero sarebbero ${attese(T, TASSI.nascita, 0)}; l'albero di questa prova ne ha ${num(A.foglie)} (2^${A.K} blocchi); mediana tra vicine ${num(A.quantile(0.5))} Ma)`);
});

prova('la distribuzione delle profondità è quella del processo di nascita e morte ricostruito: contro la teoria e contro il campionamento diretto', () => {
  const K = 12, n = 2 ** K, R = 2000, c = sorgente('prova/albero/diretto'), righe = [];
  const base = alberoVita('prova/albero/teoria', { T, foglie: n });
  for (const g of [1, 7, 64, 1000]) {
    const pigro = [], diretto = [], s = c.serie(`estrazioni ${g}`);
    for (let rep = 0; rep < R; rep++) {
      const A = alberoVita(`prova/albero/${g}/${rep}`, { T, foglie: n }), i = Math.floor(c(`dove ${g}/${rep}`) * (n - g)); pigro.push(A.antenato(i, i + g));
      let m = 0; for (let k = 0; k < g; k++) m = Math.max(m, base.quantile(s(rep * g + k))); diretto.push(m); // g profondità estratte una per una, e il loro massimo
    }
    pigro.sort((a, b) => a - b); diretto.sort((a, b) => a - b);
    // contro la teoria: P(massimo ≤ t) = G(t)^g (Kolmogorov-Smirnov a un campione; soglia allo 0,1%: 1,95/√n)
    const ks = (v) => v.reduce((d, t, k) => { const F = base.ripartizione(t) ** g; return Math.max(d, Math.abs(F - k / R), Math.abs(F - (k + 1) / R)); }, 0);
    // tra i due campioni (a due campioni: 1,95·√(2/n))
    let i = 0, j = 0, d2 = 0; while (i < R && j < R) { if (pigro[i] <= diretto[j]) i++; else j++; d2 = Math.max(d2, Math.abs(i - j) / R); }
    const media = (v) => v.reduce((a, x) => a + x, 0) / R, sd = Math.sqrt(pigro.reduce((a, x) => a + (x - media(pigro)) ** 2, 0) / R);
    assert.ok(ks(pigro) < 1.95 / Math.sqrt(R), `intervallo ${g}: il campionatore pigro si scosta dalla teoria di ${ks(pigro)}`); assert.ok(ks(diretto) < 1.95 / Math.sqrt(R), `intervallo ${g}: il diretto si scosta di ${ks(diretto)}`);
    assert.ok(d2 < 1.95 * Math.sqrt(2 / R), `intervallo ${g}: pigro e diretto distano ${d2}`); assert.ok(Math.abs(media(pigro) - media(diretto)) < 5 * sd * Math.sqrt(2 / R), `intervallo ${g}: medie ${media(pigro)} e ${media(diretto)}`);
    righe.push(`a ${g} specie di distanza: media ${num(media(pigro))} contro ${num(media(diretto))} Ma, mediana ${num(pigro[R >> 1])} contro ${num(diretto[R >> 1])}, scarto dalla teoria ${num(ks(pigro))}`);
  }
  console.log(`      (${R} alberi di ${n} specie; soglia dello scarto ${num(1.95 / Math.sqrt(R))})\n      ${righe.join('\n      ')}`);
});

prova('ultrametrico: per ogni terna il più antico dei tre antenati comuni compare due volte; mai più antico della radice', () => {
  const A = alberoVita('prova/albero/terne', { T, foglie: 2 ** 20 }), c = sorgente('prova/albero/terne/quali').serie('specie'); let violazioni = 0, massimo = 0;
  for (let k = 0; k < 6000; k++) {
    const [i, j, l] = [c(3 * k), c(3 * k + 1), c(3 * k + 2)].map((x) => Math.floor(x * A.foglie)).sort((a, b) => a - b); if (i === j || j === l) continue;
    const a = A.antenato(i, j), b = A.antenato(j, l), d = A.antenato(i, l); if (d !== Math.max(a, b)) violazioni++; massimo = Math.max(massimo, d);
    assert.equal(A.antenato(j, i), a, 'simmetrico'); assert.ok(a > 0 && d <= T);
  }
  assert.equal(violazioni, 0); assert.equal(A.antenato(77, 77), 0);
  console.log(`      (6000 terne tra ${num(A.foglie)} specie: ${violazioni} violazioni, uguaglianza al bit; l'antenato più antico incontrato ${num(massimo, 5)} Ma su una radice di ${T})`);
});

prova('2⁴⁰ foglie interrogabili: ogni domanda tocca al più 4·K blocchi, senza generare l\'albero', () => {
  const A = alberoVita('prova/albero/grande', { T, foglie: 2 ** 40 }), c = sorgente('prova/albero/grande/quali').serie('specie'); assert.equal(A.K, 40);
  let nodi = 0, eventi = 0; const t0 = performance.now(), Q = 2000;
  for (let k = 0; k < Q; k++) { const i = Math.floor(c(2 * k) * A.foglie), j = Math.floor(c(2 * k + 1) * A.foglie), t = A.antenato(i, j); assert.ok(i === j || (t > 0 && t <= T)); nodi = Math.max(nodi, A.ultimi.nodi); eventi = Math.max(eventi, A.ultimi.eventi); }
  const ms = (performance.now() - t0) / Q; assert.ok(nodi <= 4 * A.K + 2, `${nodi} blocchi per una domanda`); assert.ok(eventi <= 2 * nodi + 1);
  const vicine = A.antenato(3, 4), lontane = A.antenato(3, 1e11); assert.ok(vicine < lontane && lontane <= T);
  assert.throws(() => A.antenato(0, 2 ** 40), /specie/); assert.throws(() => alberoVita('x', { T, foglie: 2 ** 53 }), /foglie/);
  console.log(`      (${num(A.foglie)} specie: al più ${nodi} blocchi e ${eventi} eventi per domanda, ${num(ms * 1000)} µs l'una; la 3 e la 4 si separano ${num(vicine)} Ma fa, la 3 e la centomiliardesima ${num(lontane, 6)} Ma fa)`);
});

prova('funzione pura dell\'indirizzo: stesse risposte in qualunque ordine e da un albero rifatto; un altro indirizzo, un altro albero; un ramo cambia', () => {
  const coppie = Array.from({ length: 300 }, (_, k) => [(k * 7919) % 100000, (k * 104729 + 13) % 100000]);
  const A = alberoVita('prova/albero/puro', { T, foglie: 100000 }), dritto = coppie.map(([i, j]) => A.antenato(i, j));
  const B = alberoVita('prova/albero/puro', { T, foglie: 100000 }), rovescio = [...coppie].reverse().map(([i, j]) => B.antenato(i, j)).reverse();
  assert.deepEqual(rovescio, dritto);
  const altro = alberoVita('prova/albero/altro', { T, foglie: 100000 }); assert.ok(coppie.some(([i, j], k) => altro.antenato(i, j) !== dritto[k]));
  // il numero di specie, se non è dato, è un evento dell'albero: lo stesso ogni volta
  assert.equal(alberoVita('prova/albero/puro', { T }).foglie, alberoVita('prova/albero/puro', { T }).foglie);
  // un ramo sul blocco radice cambia l'antenato più antico e lascia stare i rami bassi che non ne discendono… non tutti: cambia qualcosa
  const ramo = alberoVita('prova/albero/puro', { T, foglie: 100000, rami: { 'prova/albero/puro/blocco 0.0': 1 } }); assert.ok(coppie.some(([i, j], k) => ramo.antenato(i, j) !== dritto[k]));
});

prova('il vincolo verso l\'alto: la radice non è più antica del tempo da cui il pianeta ha acqua liquida; senza acqua liquida l\'albero non c\'è', () => {
  // un pianeta con acqua liquida oggi e uno senza, dalla biblioteca
  let vivo = null, morto = null;
  for (let s = 0; s < 400 && !(vivo && morto); s++) { const Sis = CO.sistema(1, 0, s); for (const P of Sis.pianeti) { const dove = `cosmo 1/galassia 0/stella ${s}/pianeta ${P.id}`; if (!vivo && P.clima?.acqua === 'liquida') vivo = { P, S: Sis.stella, dove }; if (!morto && P.clima?.acqua === 'ghiaccio') morto = { P, S: Sis.stella, dove }; } }
  assert.ok(vivo && morto);
  const lim = radiceMassima(vivo.P, vivo.S); tra(lim.Ma, 1, 13800, 'il limite (Ma)'); assert.equal(lim.Ma, (vivo.P.interno?.eta ?? vivo.S.eta) / 1e6);
  // con una radice di 1800 Ma (se il pianeta è abbastanza vecchio) e la capacità della Terra
  const Tr = Math.min(1800, lim.Ma), A = alberoDelPianeta(vivo.P, vivo.S, vivo.dove, { T: Tr, specie: 8.7e6 }); assert.ok(A.esiste && A.T === Tr && A.limite === lim.Ma && A.radice === `${vivo.dove}/vita`);
  let massimo = 0; for (let k = 0; k < 500; k++) { const t = A.antenato((k * 7919) % A.foglie, (k * 104729 + 1) % A.foglie); assert.ok(t <= Tr); massimo = Math.max(massimo, t); }
  // una radice più antica del limite non può esserci
  const troppo = alberoDelPianeta(vivo.P, vivo.S, vivo.dove, { T: lim.Ma * 1.01 }); assert.ok(!troppo.esiste && /più antica/.test(troppo.perche));
  // senza acqua liquida oggi: niente albero, e il perché
  const N = alberoDelPianeta(morto.P, morto.S, morto.dove); assert.ok(!N.esiste && N.limite === 0 && /storia\.js/.test(N.perche)); assert.equal(radiceMassima(morto.P, morto.S).Ma, 0);
  // CHE COSA NON TORNA: con i ritmi della Terra per tutta l'età del pianeta le specie attese non hanno senso
  const tutto = alberoDelPianeta(vivo.P, vivo.S, vivo.dove); assert.ok(tutto.esiste && tutto.T === lim.Ma);
  console.log(`      (${vivo.dove}: acqua liquida, ${num(lim.Ma)} Ma di età. Radice a ${num(Tr)} Ma con la capacità della Terra: ${num(A.foglie)} specie, ritmo netto ${num(A.r)}/Ma, antenato più antico incontrato ${num(massimo, 5)} Ma)`);
  console.log(`      NON TORNA: con i ritmi della Terra per tutti i ${num(lim.Ma)} Ma le specie attese sarebbero ${num(tutto.attese)}${tutto.oltre ? ` (l'albero si ferma a 2^52 = ${num(FOGLIE_MAX)} foglie)` : ''}: la diversità la limita ciò che il pianeta sostiene, che nessun modulo calcola ancora`);
  console.log(`      (${morto.dove}: ${N.perche.slice(0, 120)}…)`);
});

console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
