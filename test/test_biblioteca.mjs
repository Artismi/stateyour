// test_biblioteca.mjs — gli universi della biblioteca: posti veri del cosmo, ripetibili, coerenti
import assert from 'node:assert/strict';
import { universo } from '../src/camera/biblioteca.js';
import { simulaMondo, campiContinui } from '../src/camera/mondo.js';
import { indirizzoDi, numeroDi, regione, cosmo, galassia, sistema, pianeta } from '../src/camera/cosmo.js';
import { unita, catalogoVero, velocita } from '../src/camera/unita.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

prova('lo stesso numero dà lo stesso universo, e la stessa storia; numeri diversi, posti diversi', () => {
  const a = simulaMondo(universo(7).cella), b = simulaMondo(universo(7).cella);
  assert.equal(JSON.stringify(a.map((t) => t.punti.at(-1))), JSON.stringify(b.map((t) => t.punti.at(-1))));
  assert.notEqual(JSON.stringify(universo(7).cella.sorgenti), JSON.stringify(universo(8).cella.sorgenti));
});

prova('dentro ci sono solo cose naturali, e ogni raggio ha una sorgente vera nella sua galassia', () => {
  for (const n of [1, 13, 77, 333, 5000]) {
    const a = indirizzoDi(n), c = regione(a).cella, Gx = galassia(a.cosmo, a.galassia);
    assert.ok(!c.domini.length && !c.cristalli && !c.onde, 'niente zone o campi messi a mano');
    for (const s of c.sorgenti) {
      assert.equal(s.specie, 'protone');
      assert.ok(s.origine.startsWith('il fondo') || Gx.sorgenti.some((g) => s.origine.startsWith(g.nome)), `da dove viene: ${s.origine}`);
    }
  }
});

prova('il campo è quello del pianeta: un dipolo che cala come il cubo della distanza', () => {
  const c = regione(indirizzoDi(13)).cella, cc = campiContinui(c), d = c.dipoli[0];
  const B = (r) => cc.B(d.centro[0] + r, d.centro[1]);
  assert.ok(Math.abs(B(2 * d.R) / B(4 * d.R) - 8) < 1e-9);
  // e lo stesso campo, visto dal pianeta e dalla regione, dà lo stesso raggio a un protone (unità diverse, metri uguali)
  const a = indirizzoDi(13), P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta];
  const u1 = unita(P.raggioM * 10), u2 = unita(0.32 * P.raggioM), v = velocita(5000, 1836.15), Bt = 1e-5;
  assert.ok(Math.abs(((1836.15 * v) / u1.B(Bt)) * u1.l - ((1836.15 * v) / u2.B(Bt)) * u2.l) < 1e-6 * u1.l);
});

prova('le vite sono quelle vere, e si allungano con la velocità', () => {
  const u = unita(2000), cat = catalogoVero(u), C = 40, v = 0.995 * C, g = 1 / Math.sqrt(1 - 0.995 ** 2);
  const tr = simulaMondo({ larghezza: 1e9, altezza: 1e9, c: C, relativita: true, tempo: 1e6, fondo: { B: 0, K: 0 }, domini: [], masse: [], specie: { m: { ...cat['muone-'], figli: undefined, vita: cat['muone-'].vitaMedia } }, sorgenti: [{ pos: [1, 5e8], dir: 0, v, specie: 'm' }] });
  const t = tr[0].punti.at(-1)[3] * u.tu;
  assert.ok(Math.abs(t - 2.197e-6 * g) < 1e-9, `il muone vive ${t} s, atteso ${2.197e-6 * g}`);
});

prova('una magnetosfera forte è schermata: vicino ai giganti non arriva nessun raggio', () => {
  let schermate = 0, viste = 0;
  for (let n = 1; n < 4000 && viste < 6; n += 97) {
    const a = indirizzoDi(n), P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta], R = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta).regioni[a.regione];
    if ((P.B0 * P.raggioM) / (R.r * R.r) < 2000) continue;
    viste++; if (regione(a).cella.sorgenti.length === 0) schermate++;
  }
  assert.ok(viste > 0 && schermate === viste, `${schermate} schermate su ${viste}`);
});

prova('un universo si simula in fretta, e niente supera la luce', () => {
  for (const n of [1, 2, 13, 42, 333]) {
    const c = universo(n).cella, t0 = performance.now(), tr = simulaMondo(c);
    assert.ok(performance.now() - t0 < 2000, `${n}`);
    for (const t of tr) for (let i = 1; i < t.punti.length; i += 7) { const a = t.punti[i - 1], b = t.punti[i], dt = b[3] - a[3]; if (dt > 1e-9) assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) / dt <= c.c * 1.0001); }
  }
});

prova('il cosmo: ogni numero è un indirizzo, e un ramo cambia quando un raggio arriva', () => {
  for (const n of [1, 2, 13, 5000, 4575388]) { const a = indirizzoDi(n); assert.equal(indirizzoDi(numeroDi(a)).regione, a.regione); }
  assert.ok(cosmo(1).galassie.length > 20, 'un cosmo ha molte galassie');
  const c = regione(indirizzoDi(13)).cella;
  const t1 = simulaMondo(c).find((t) => t.evento === '0'), t2 = simulaMondo({ ...c, rami: { 0: 7 } }).find((t) => t.evento === '0');
  assert.notEqual(t1.punti[0][3], t2.punti[0][3]);
});

console.log(`biblioteca: ${ok} prove, tutto ok`);
