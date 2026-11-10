// test_biblioteca.mjs — gli universi della biblioteca: naturali, ripetibili, veloci
import assert from 'node:assert/strict';
import { universo, CATALOGO } from '../src/camera/biblioteca.js';
import { simulaMondo, campiContinui } from '../src/camera/mondo.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

prova('lo stesso numero dà lo stesso universo, e la stessa storia', () => {
  const a = simulaMondo(universo(7).cella), b = simulaMondo(universo(7).cella);
  assert.equal(JSON.stringify(a.map((t) => t.punti.at(-1))), JSON.stringify(b.map((t) => t.punti.at(-1))));
  assert.notEqual(JSON.stringify(universo(7).cella.masse), JSON.stringify(universo(8).cella.masse));
});

prova('dentro ci sono solo cose naturali: niente specchi, vetri, schermi, fasci', () => {
  for (let n = 1; n <= 30; n++) {
    const c = universo(n).cella;
    assert.ok(!c.pareti || !c.pareti.length);
    assert.ok(c.domini.every((d) => d.n == null));
    assert.ok(c.sorgenti.every((s) => s.specie === 'protone' || s.specie === 'kaone0'), 'nascono solo raggi cosmici e decadimenti spontanei');
  }
  assert.ok(Object.values(CATALOGO).every((s) => !s.visibile || s.q), 'la luce e le neutre non lasciano traccia');
});

prova('il campo varia dolcemente, il cristallo si ripete con il suo passo', () => {
  for (let n = 1; n < 200; n++) {
    const c = universo(n).cella; if (!c.cristalli.length) continue;
    const k = c.cristalli[0], cc = campiContinui({ ...c, onde: { B: [] }, nubi: null, cristalli: [{ ...k, r: 1e9 }] });
    // nel cristallo (senza il campo di fondo) il campo torna uguale dopo un vettore del reticolo
    const d = [k.passo * Math.cos(k.angolo + Math.PI / 6), k.passo * Math.sin(k.angolo + Math.PI / 6)];
    const p = [k.centro[0] + 3.3, k.centro[1] - 1.7];
    assert.ok(Math.abs(cc.B(...p) - cc.B(p[0] + d[0], p[1] + d[1])) < 1e-9);
    return;
  }
  assert.fail('nessun cristallo nei primi 200 universi');
});

prova('ogni particella decade quando capita: le vite sono diverse', () => {
  const tr = simulaMondo(universo(3).cella).filter((t) => t.specie.nome === 'pione+' && t.fine === 'decade');
  const vite = tr.map((t) => t.punti.at(-1)[3] - t.punti[0][3]);
  assert.ok(vite.length >= 3 && new Set(vite.map((v) => v.toFixed(3))).size === vite.length);
});

prova('un universo si simula in fretta, e le figlie restano sotto la velocità della luce', () => {
  for (const n of [1, 2, 3, 42, 1856]) {
    const c = universo(n).cella, t0 = performance.now(), tr = simulaMondo(c);
    assert.ok(performance.now() - t0 < 2000, `${n}`);
    for (const t of tr) for (let i = 1; i < t.punti.length; i += 7) { const a = t.punti[i - 1], b = t.punti[i], dt = b[3] - a[3]; if (dt > 1e-9) assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) / dt <= c.c * 1.0001); }
  }
});

console.log(`biblioteca: ${ok} prove, tutto ok`);
