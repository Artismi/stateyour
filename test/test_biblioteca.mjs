// test_biblioteca.mjs — gli universi della biblioteca: posti veri del cosmo, ripetibili, coerenti
import assert from 'node:assert/strict';
import { universo } from '../src/camera/biblioteca.js';
import { simulaMondo, campiContinui } from '../src/camera/mondo.js';
import { indirizzoDi, numeroDi, regione, cosmo, galassia, sistema, pianeta, cellaDi } from '../src/camera/cosmo.js';
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
      if (s.specie === 'protone') assert.ok(s.origine.startsWith('il fondo') || Gx.sorgenti.some((g) => s.origine.startsWith(g.nome)), `da dove viene: ${s.origine}`);
      else assert.ok(s.origine.startsWith('un neutrone uscito dal pianeta'), `la fascia: ${s.origine}`);
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
    viste++; if (regione(a).cella.sorgenti.filter((s) => s.specie === 'protone').length === 0) schermate++;
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

prova('lo zoom: dieci volte più vicino, le stesse particelle nello stesso posto; in più solo il dettaglio fine', () => {
  // una particella che passa nella regione mentre la bolla dura (il primo decimo del tempo)
  const a = indirizzoDi(13), t0 = simulaMondo(cellaDi(a)), dentro = (q) => q[3] < 12 && q[0] > 50 && q[0] < 950 && q[1] > 50 && q[1] < 950;
  const tr = t0.find((t) => t.punti.filter(dentro).length > 3), p = tr.punti.filter(dentro)[1], ij = [Math.floor(p[0] / 100), Math.floor(p[1] / 100)];
  const t1 = simulaMondo(cellaDi({ ...a, zoom: [ij] })), tz = t1.find((t) => t.evento === tr.evento);
  assert.ok(tz, 'la particella che attraversa il quadratino c\'è anche dentro');
  for (const q of tz.punti.filter((_, i) => i % 5 === 0)) {
    const T = q[3] / 10, X = q[0] / 10 + ij[0] * 100, Y = q[1] / 10 + ij[1] * 100;
    for (let i = 1; i < tr.punti.length; i++) { const A = tr.punti[i - 1], B = tr.punti[i]; if (A[3] <= T && B[3] >= T) { const f = (T - A[3]) / (B[3] - A[3] || 1); assert.ok(Math.hypot(A[0] + (B[0] - A[0]) * f - X, A[1] + (B[1] - A[1]) * f - Y) < 0.5, 'stessa strada ai due livelli'); break; } }
  }
});

const L = await import('../src/camera/leggi.js'), F = await import('../src/camera/fluidi.js');
prova('le leggi: età del cosmo, Chandrasekhar, il clima della Terra, la soglia della convezione', () => {
  assert.ok(Math.abs(L.etaUniverso() / L.ANNO / 1e9 - 13.8) < 0.1);
  assert.ok(Math.abs(L.massaChandrasekhar() / L.MSOLE - 1.43) < 0.05);
  const terra = L.clima({ Lw: L.LSOLE, aM: L.UA, massaKg: 5.97e24, raggioM: 6.371e6, tipo: 'roccioso', acqua: 0.02 });
  assert.equal(terra.acqua, 'liquida'); assert.ok(terra.T > 260 && terra.T < 320, `la Terra a ${terra.T} K`);
  const luna = L.clima({ Lw: L.LSOLE, aM: L.UA, massaKg: 7.3e22, raggioM: 1.737e6, tipo: 'roccioso', acqua: 0.02 });
  assert.ok(!luna.tenuti.includes('azoto') && luna.pressione < 1, 'la Luna non trattiene un\'atmosfera');
  const q = F.flussoInterno(5.97e24, 6.371e6);
  assert.ok(F.convezione({ g: 9.8, q, d: 0.01 }).epsilon < 0 && F.convezione({ g: 9.8, q, d: 0.03 }).epsilon > 0, 'sotto una soglia fermo, sopra si muove');
});

const GE = await import('../src/camera/geologia.js');
prova('l\'interno: la Terra ha la dinamo e le placche, Marte ha il nucleo congelato', () => {
  const t = GE.interno({ tipo: 'roccioso', massaKg: 5.97e24, raggioM: 6.371e6, composizione: { ferro: 0.32, acqua: 0.02 } }, { eta: 4.5e9, Z: 1 });
  assert.ok(t.dinamo && Math.abs(t.B0 - 3.1e-5) < 1e-5 && t.tettonica === 'a placche' && Math.abs(t.nucleo - 0.55) < 0.05);
  const m = GE.interno({ tipo: 'roccioso', massaKg: 6.4e23, raggioM: 3.39e6, composizione: { ferro: 0.25, acqua: 0.01 } }, { eta: 4.5e9, Z: 1 });
  assert.ok(!m.dinamo && m.tettonica !== 'a placche');
});

console.log(`biblioteca: ${ok} prove, tutto ok`);
