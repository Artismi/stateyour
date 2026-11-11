// test_disco.mjs — i pianeti che nascono dal disco: emergono dalle regole, sono ripetibili, e somigliano a quelli veri
import assert from 'node:assert/strict';
import { formaPianeti, disco, raggioPianeta, DISCO, MTERRA, RTERRA, MGIOVE, RGIOVE } from '../src/camera/disco.js';
import { MSOLE, UA } from '../src/camera/leggi.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

const SEMI = Array.from({ length: 60 }, (_, i) => i + 1), SOLE = { massa: 1, Z: 1, eta: 4.6e9 };
const terre = (p) => p.massaKg / MTERRA, perc = (x) => `${Math.round(100 * x)}%`;
// in quanti semi, su 60, c'è almeno un gigante di gas oltre la linea della neve
const giganti = (st) => SEMI.filter((s) => { const neve = disco(st, s).neve; return formaPianeti(st, s).some((p) => p.tipo === 'gassoso' && p.aUA > neve); }).length / SEMI.length;
// la distanza tra due orbite vicine, in raggi di Hill reciproci
const hill = (a, b, Mstella) => (b.aUA - a.aUA) / (Math.cbrt((a.massaKg + b.massaKg) / (3 * Mstella * MSOLE)) * (a.aUA + b.aUA) / 2);
// stelle di ogni genere, per le prove che devono valere sempre
const STELLE = [];
for (const massa of [0.08, 0.3, 1, 2, 8, 40]) for (const Z of [0.01, 0.3, 1, 3.5]) for (const eta of [1e6, 5e7, 4.6e9, 1.2e10]) STELLE.push({ massa, Z, eta });

prova('il disco: la neve a 2,7 UA per il Sole, Σ ∝ r^(-3/2), quattro volte più solidi oltre la neve, massa di qualche centesimo', () => {
  for (const s of SEMI) {
    const D = disco(SOLE, s);
    assert.ok(Math.abs(D.neve - 2.7) < 0.1, `neve a ${D.neve}`); // (il Sole a metà vita è poco più luminoso di oggi: stelle.js)
    assert.ok(Math.abs(D.sigmaGas(1) / D.sigmaGas(4) - 8) < 1e-9, 'la densità del gas cala come r^(3/2)');
    assert.ok(Math.abs(D.sigmaSolidi(D.neve * 1.001) / D.sigmaSolidi(D.neve * 0.999) - 4) < 0.02, 'oltre la neve anche il ghiaccio è solido');
    assert.ok(Math.abs(D.sigmaSolidi(5) / D.sigmaGas(5) - 0.0134) < 1e-9, 'i solidi sono i metalli del gas');
    assert.ok(D.frazione >= 0.01 && D.frazione <= 0.12 && Math.abs(D.massaKg - D.frazione * MSOLE) < 1e-6 * MSOLE);
    // la somma di Σ·2πr·dr fino al bordo esterno ridà la massa del disco
    let m = 0; const N = 4000; for (let i = 0; i < N; i++) { const r = ((i + 0.5) / N) ** 2 * D.rOut, dr = (2 * (i + 0.5) / N / N) * D.rOut; m += D.sigmaGas(r) * 2 * Math.PI * r * dr * UA * UA; }
    assert.ok(Math.abs(m / D.massaKg - 1) < 0.01, `massa del disco ricostruita: ${m / D.massaKg}`);
    assert.ok(D.vita >= 1e6 && D.vita <= 1.2e7 && D.rIn >= 0.02 && D.rIn < D.neve);
  }
  assert.ok(disco({ massa: 0.3, Z: 1 }, 1).neve < 0.5 && disco({ massa: 2, Z: 1 }, 1).neve > 5, 'la neve segue la luce della stella');
  assert.equal(new Set(SEMI.map((s) => disco(SOLE, s).frazione.toFixed(4))).size > 50, true, 'ogni seme ha il suo disco');
});

prova('una stella come il Sole: quasi sempre pianeti rocciosi dentro la neve, tra 0,03 e 6 Terre', () => {
  let con = 0, tutti = 0, giusti = 0, quanti = 0;
  for (const s of SEMI) {
    const neve = disco(SOLE, s).neve, P = formaPianeti(SOLE, s), r = P.filter((p) => p.tipo === 'roccioso' && p.aUA < neve);
    quanti += P.length; if (r.length) con++;
    for (const p of r) { tutti++; if (terre(p) >= 0.03 && terre(p) <= 6) giusti++; }
    assert.ok(!P.some((p) => p.tipo === 'gassoso' && p.aUA < 0.5 * neve), 'nessun gigante vicino alla stella: nel modello non migrano');
  }
  console.log(`      rocciosi in ${perc(con / 60)} dei semi; ${giusti} su ${tutti} tra 0,03 e 6 Terre; in media ${(quanti / 60).toFixed(1)} pianeti per stella`);
  assert.ok(con / 60 >= 0.9, `rocciosi dentro la neve solo in ${con} semi su 60`);
  assert.ok(giusti / tutti >= 0.9, `solo ${giusti} rocciosi su ${tutti} hanno una massa terrestre`);
});

prova('i giganti di gas: oltre la neve, non sempre; più frequenti con molti metalli, più rari attorno alle stelle piccole', () => {
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
      // un sistema adulto ha avuto il tempo di sistemarsi: almeno sei raggi di Hill; uno ancora nel gas almeno due e mezzo
      assert.ok(d > (st.eta >= 5e7 ? 6 : 2.5), `separate di ${d} raggi di Hill: ${dove}`);
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

prova('il ferro cresce con i metalli della stella e verso la stella; l\'acqua dei rocciosi è poca, e di più verso la neve', () => {
  const rocciosi = (Z) => SEMI.map((s) => formaPianeti({ ...SOLE, Z }, s).filter((p) => p.tipo === 'roccioso'));
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length, ferro = (Z) => media(rocciosi(Z).flat().map((p) => p.composizione.ferro));
  assert.ok(ferro(0.5) < ferro(1) && ferro(1) < ferro(2), `ferro: ${ferro(0.5)} → ${ferro(1)} → ${ferro(2)}`);
  const acque = [];
  for (const r of rocciosi(1)) {
    if (r.length > 1) { assert.ok(r[0].composizione.ferro > r.at(-1).composizione.ferro, 'più ferro vicino alla stella'); assert.ok(r[0].composizione.acqua < r.at(-1).composizione.acqua, 'più acqua lontano'); }
    for (const p of r) { acque.push(p.composizione.acqua); assert.ok(p.composizione.acqua > 1e-4 && p.composizione.acqua <= 0.2, `acqua ${p.composizione.acqua}`); }
  }
  acque.sort((a, b) => a - b); const mediana = acque[acque.length >> 1];
  assert.ok(mediana > 0.001 && mediana < 0.03, `acqua tipica di un roccioso: ${mediana}`);
  // la Terra di casa nostra: un roccioso attorno a 1 UA ha circa un terzo di ferro
  const terreVere = rocciosi(1).flat().filter((p) => p.aUA > 0.8 && p.aUA < 1.2);
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

console.log(`disco: ${ok} prove, tutto ok`);
