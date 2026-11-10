// test_camera.mjs — le cinque leggi della camera danno quello che la fisica prevede
import assert from 'node:assert/strict';
import { simulaMondo, raggio, gittata, deflessioneLuce, forze } from '../src/camera/mondo.js';
import { PRESET, copie, storia, scalaCella, trasformaPosto, COMPOSIZIONI, centraCella } from '../src/camera/esperimento.js';

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
  const [tr] = simulaMondo({ larghezza: 4000, altezza: 4000, c: C, masse: [{ pos: [2000, 2000], M, R: 5 }], tempo: 4000 / C, sorgenti: [{ pos: [0, 2000 + b], dir: 0, specie: { luce: true, visibile: true } }] }, { passo: 2 });
  const P = tr.punti, a = P.at(-1), z = P.at(-30), ang = -Math.atan2(a[1] - z[1], a[0] - z[0]);
  assert.ok(Math.abs(ang - deflessioneLuce(1, M, b, C)) / deflessioneLuce(1, M, b, C) < 0.05, `${ang}`);
  assert.ok(Math.abs(dist(a, z) / (a[3] - z[3]) - C) < 1e-6);
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

prova('la stessa storia in un mondo k volte più grande: B/k, K/k, M·k, e la forma è identica', () => {
  for (const nome of ['voluta', 'fiore', 'orbita']) {
    const c = PRESET[nome]().cella, k = 0.37, a = simulaMondo(c), b = simulaMondo(scalaCella(c, k));
    assert.equal(a.length, b.length, nome);
    a.forEach((t, i) => { const p = t.punti.at(-1), q = b[i].punti.at(-1); assert.ok(Math.hypot(p[0] * k - q[0], p[1] * k - q[1]) < 1e-6 * c.larghezza, `${nome} ${i}`); assert.ok(Math.abs(p[4] * k - q[4]) < 1e-9); });
  }
});

prova('le forze in un punto: il magnetismo vale q·v·B/m ed è perpendicolare, la materia frena', () => {
  const c = PRESET.fiore().cella, F = forze(c, 'positrone', 100, 60, 6, 0);
  assert.ok(Math.abs(Math.hypot(...F.magnetico) - 6 * 0.32) < 1e-12);
  assert.ok(Math.abs(F.magnetico[0] * 6) < 1e-12);
  assert.ok(F.materia[0] < 0 && Math.abs(F.materia[0] + 42 / 36) < 1e-12);
  assert.equal(forze(c, 'fotone', 100, 60, 30, 0).magnetico, undefined);
});

prova('i posti: il centro della cella cade sul posto, ruotato e riflesso', () => {
  const cella = { larghezza: 200, altezza: 100 };
  for (const posto of [{ pos: [50, 60], rot: 0 }, { pos: [50, 60], rot: 90 }, { pos: [-30, 7], rot: 33, specchio: true }]) {
    const M = trasformaPosto(cella, posto, [1000, 0]);
    assert.ok(Math.hypot(M[0] * 100 + M[2] * 50 + M[4] - 1050 - posto.pos[0] + 50, M[1] * 100 + M[3] * 50 + M[5] - posto.pos[1]) < 1e-9);
    assert.ok(Math.abs(M[0] * M[3] - M[1] * M[2] - (posto.specchio ? -1 : 1)) < 1e-12);
  }
});

prova('le composizioni di partenza: ogni elemento ha posti e si simula', () => {
  for (const [k, f] of Object.entries(COMPOSIZIONI)) { const c = f(); assert.ok(c.elementi.length && c.reticolo.a && c.reticolo.b, k); for (const e of c.elementi) { assert.ok(e.posti.length, k); assert.ok(simulaMondo(e.cella).length, `${k} ${e.nome}`); } }
});

prova('le leggi e gli oggetti si spengono: la fisica li ignora davvero', () => {
  const l = PRESET.orbita().cella, con = simulaMondo(l)[0].punti.at(-1), senza = simulaMondo({ ...l, leggi: { gravita: false } })[0].punti.at(-1);
  assert.ok(Math.hypot(con[0] - senza[0], con[1] - senza[1]) > 5, 'senza gravità niente orbita');
  const m = structuredClone(l); m.masse[0].spento = true;
  assert.deepEqual(simulaMondo(m)[0].punti.at(-1), senza, 'una massa spenta è come la gravità spenta');
  const f = PRESET.fiore().cella;
  assert.equal(simulaMondo({ ...f, leggi: { decadimento: false } }).length, 0, 'senza decadimento il nucleo (neutro) non si divide: niente tracce');
  for (const t of simulaMondo({ ...f, leggi: { magnetico: false } })) { const a = t.punti[0], b = t.punti[Math.floor(t.punti.length / 2)], c = t.punti.at(-1); assert.ok(Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-6, 'senza campo le tracce sono dritte'); }
  const s = structuredClone(f); s.sorgenti[0].spento = true;
  assert.equal(simulaMondo(s).length, 0, 'una sorgente spenta non emette');
});

prova("un interruttore che scatta a metà: prima nulla cambia, dopo le traiettorie sì", () => {
  const f = PRESET.fiore().cella, a = simulaMondo(f), g = structuredClone(f), ts = 2;
  g.domini[0].interruttori = [{ t: ts, acceso: false }];
  const b = simulaMondo(g);
  const pos = (tr, t) => { const P = tr.punti; let i = 0; while (i < P.length - 1 && P[i + 1][3] <= t) i++; return P[i]; };
  for (const k of [1, 2]) {
    const p0 = pos(a[k], ts - 0.01), q0 = pos(b[k], ts - 0.01), p1 = pos(a[k], ts + 1.5), q1 = pos(b[k], ts + 1.5);
    assert.ok(Math.hypot(p0[0] - q0[0], p0[1] - q0[1]) < 1e-12, 'prima dello scatto identiche');
    assert.ok(Math.hypot(p1[0] - q1[0], p1[1] - q1[1]) > 1, 'dopo lo scatto diverse');
    // dopo lo scatto, niente campo e niente materia: la traccia è dritta e la velocità costante
    const P = b[k].punti.filter((p) => p[3] > ts + 0.05 && p[3] < ts + 1), u = P[0], w = P[P.length - 1], m = P[P.length >> 1];
    assert.ok(Math.abs((m[0] - u[0]) * (w[1] - u[1]) - (m[1] - u[1]) * (w[0] - u[0])) < 1e-6);
  }
  // una legge come lista di scatti: spenta tra 2 e 3, poi di nuovo accesa
  const c = simulaMondo({ ...f, leggi: { magnetico: [{ t: 2, acceso: false }, { t: 3, acceso: true }] } });
  assert.equal(c.length, a.length);
  assert.ok(c.some((t, i) => Math.hypot(t.punti.at(-1)[0] - a[i].punti.at(-1)[0], t.punti.at(-1)[1] - a[i].punti.at(-1)[1]) > 1));
});

console.log(`camera: ${ok} prove, tutto ok`);
