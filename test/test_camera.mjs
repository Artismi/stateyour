// test_camera.mjs — le cinque leggi della camera danno quello che la fisica prevede
import assert from 'node:assert/strict';
import { simulaMondo, raggio, gittata, deflessioneLuce } from '../src/camera/mondo.js';
import { PRESET, copie, storia } from '../src/camera/esperimento.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };

prova('magnetismo: cerchio esatto di raggio m·v/(q·B)', () => {
  const sp = { q: 1, m: 2 }, r = raggio(sp, 10, 0.5);
  const [tr] = simulaMondo({ larghezza: 400, altezza: 400, fondo: { B: 0.5 }, tempo: (2 * Math.PI * r) / 10, sorgenti: [{ pos: [200, 200 - r], dir: 0, v: 10, specie: sp }] });
  for (const p of tr.punti) assert.ok(Math.abs(dist(p, [200, 200]) - r) < 1e-9);
  assert.ok(dist(tr.punti.at(-1), [200, 200 - r]) < 1e-9);
});

prova('materia: la gittata di Bethe m·v⁴/(4·K·q²) e la traccia che ingrossa', () => {
  const sp = { q: 1, m: 1 }, R = gittata(sp, 6, 2);
  const [tr] = simulaMondo({ larghezza: 400, altezza: 400, fondo: { K: 2 }, tempo: 1000, sorgenti: [{ pos: [10, 200], dir: 0, v: 6, specie: sp }] });
  assert.equal(tr.fine, 'ferma');
  assert.ok(Math.abs(tr.punti.at(-1)[0] - 10 - R) / R < 1e-3, `${tr.punti.at(-1)[0] - 10} vs ${R}`);
  assert.ok(tr.punti.at(-1)[4] > tr.punti[0][4] * 2);
});

prova('gravità: leggera e pesante cadono uguali (equivalenza), orbita chiusa', () => {
  const r = 60, M = 50, v = Math.sqrt(M / r), fini = [];
  for (const m of [1, 50]) {
    const [tr] = simulaMondo({ larghezza: 400, altezza: 400, masse: [{ pos: [200, 200], M, R: 4 }], tempo: (2 * Math.PI * r) / v, sorgenti: [{ pos: [260, 200], dir: Math.PI / 2, v, specie: { q: 0, m, visibile: true } }] });
    for (const p of tr.punti) assert.ok(Math.abs(dist(p, [200, 200]) - r) < 0.01);
    fini.push(tr.punti.at(-1));
  }
  assert.ok(dist(fini[0], fini[1]) < 1e-12);
});

prova('gravità sulla luce: deflessione 4·G·M/(b·c²), il doppio di Newton', () => {
  const M = 200, b = 40, C = 30;
  const [tr] = simulaMondo({ larghezza: 4000, altezza: 4000, c: C, masse: [{ pos: [2000, 2000], M, R: 5 }], tempo: 4000 / C, sorgenti: [{ pos: [0, 2000 + b], dir: 0, specie: { luce: true } }] }, { passo: 2 });
  const P = tr.punti, a = P.at(-1), z = P.at(-30), ang = -Math.atan2(a[1] - z[1], a[0] - z[0]);
  assert.ok(Math.abs(ang - deflessioneLuce(1, M, b, C)) / deflessioneLuce(1, M, b, C) < 0.05, `${ang}`);
  assert.ok(Math.abs(dist(a, z) / (a[3] - z[3]) - C) < 1e-6);
});

prova('luce e mezzi: una lente sferica mette a fuoco, Snell al bordo', () => {
  const tr = simulaMondo({ larghezza: 400, altezza: 400, c: 30, domini: [{ forma: { tipo: 'cerchio', centro: [200, 200], r: 80 }, n: 1.5 }], tempo: 30, sorgenti: [-40, 40].map((o) => ({ pos: [0, 200 + o], dir: 0, specie: { luce: true } })) });
  // i due raggi si incrociano sull'asse dietro la lente
  assert.ok(tr[0].punti.at(-1)[1] > 200 && tr[1].punti.at(-1)[1] < 200);
  // al primo bordo: sin(i) = n·sin(r)
  const P = tr[0].punti, k = P.findIndex((p) => p[5] === 'rifrazione');
  const r = Math.atan2(P[k + 1][1] - P[k][1], P[k + 1][0] - P[k][0]), N = Math.atan2(P[k][1] - 200, P[k][0] - 200) + Math.PI;
  const i = Math.asin(Math.abs(Math.sin(0 - N))), rr = Math.asin(Math.abs(Math.sin(r - N)));
  assert.ok(Math.abs(Math.sin(i) - 1.5 * Math.sin(rr)) < 1e-3);
});

prova('specchi: angolo di uscita uguale a quello di entrata', () => {
  const [tr] = simulaMondo({ larghezza: 400, altezza: 400, pareti: [{ a: [300, 0], b: [300, 400], tipo: 'specchio' }], tempo: 30, sorgenti: [{ pos: [100, 100], dir: Math.PI / 6, v: 10, specie: { q: 0, visibile: true } }] });
  const u = tr.punti.at(-1), d = Math.atan2(u[1] - tr.punti.at(-2)[1], u[0] - tr.punti.at(-2)[0]);
  assert.ok(Math.abs(d - (Math.PI - Math.PI / 6)) < 1e-9);
});

prova('decadimento: il fotone si converte in una coppia; storia in parole', () => {
  const esp = PRESET.fiore(6), tr = simulaMondo(esp.cella);
  assert.equal(tr.filter((t) => t.specie.nome === 'elettrone').length, 6);
  assert.equal(tr.filter((t) => t.specie.nome === 'positrone').length, 6);
  assert.ok(tr.every((t) => t.fine === 'ferma'));
  assert.match(storia(tr.find((t) => t.specie.nome === 'positrone'), esp), /decadimento di un fotone/);
  // il fiore è simmetrico: sei petali uguali ruotati di 60°
  const L = tr.filter((t) => t.specie.nome === 'positrone').map((t) => t.punti.length);
  assert.ok(Math.max(...L) - Math.min(...L) <= 2);
});

prova('ripetizione a specchio: la copia riflessa è lo stesso evento con B rovesciato', () => {
  const esp = PRESET.voluta(), [tr] = simulaMondo(esp.cella);
  const rif = structuredClone(esp.cella); const W = rif.larghezza;
  rif.domini[0].B = -rif.domini[0].B;
  for (const s of rif.sorgenti) { s.pos = [W - s.pos[0], s.pos[1]]; s.dir = Math.PI - s.dir; }
  for (const f of rif.specie.kaone.figli) f.angolo = -f.angolo;
  const tr2 = simulaMondo(rif).find((t) => t.specie.nome === tr.specie.nome);
  const a = tr.punti.at(-1), b = tr2.punti.at(-1);
  assert.ok(Math.abs(W - a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6);
  assert.equal(copie(esp).filter((c) => c.specchio).length, 4);
});

prova('tutti gli esperimenti di partenza girano in fretta', () => {
  for (const [k, f] of Object.entries(PRESET)) { const t0 = performance.now(), tr = simulaMondo(f().cella); assert.ok(tr.length > 0, k); assert.ok(performance.now() - t0 < 500, k); }
});

console.log(`camera: ${ok} prove, tutto ok`);
