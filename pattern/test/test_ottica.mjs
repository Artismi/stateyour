// Riflessione e rifrazione: le leggi, non le impressioni.
import assert from 'node:assert/strict';
import { rifletti, rifrangi, simula, V } from '../src/motore.js';

const vicino = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// riflessione su normale verticale: inverte la componente y
{
  const r = rifletti([3, -4], [0, 1]);
  assert.ok(vicino(r[0], 3) && vicino(r[1], 4));
}

// Snell: aria (1) -> vetro (1.5), incidenza 30°, sin(t2) = sin(30°)/1.5 = 1/3
{
  const d = V.daAngolo(-60); // 30° dalla normale [0,1] venendo dall'alto
  const r = rifrangi(d, [0, 1], 1, 1.5);
  const sinOut = Math.abs(r.vel[0]) / V.len(r.vel);
  assert.ok(vicino(sinOut, 1 / 3, 1e-9), `sin uscita ${sinOut}`);
  assert.ok(vicino(V.len(r.vel), 1 / 1.5), 'la velocità scala di 1/n');
  assert.equal(r.totale, false);
}

// riflessione totale: vetro -> aria oltre l'angolo critico (41.8°)
{
  const d = V.daAngolo(-40); // 50° dalla normale
  const r = rifrangi(d, [0, 1], 1.5, 1);
  assert.equal(r.totale, true);
  assert.ok(vicino(V.len(r.vel), 1));
}

// nel motore: specchio a 45° trasforma un raggio orizzontale in verticale
{
  const p = {
    G: 1, dt: 1, passi: 300, limiti: [0, 0, 1000, 600],
    emettitori: [{ id: 'r', pos: [50, 300], angolo: 0, v: 5 }],
    masse: [],
    interfacce: [{ id: 's', a: [450, 200], b: [650, 400], tipo: 'specchio' }],
    regole: [],
  };
  const [tr] = simula(p);
  const tocco = tr.eventi.find((e) => e.tocca === 's');
  assert.ok(tocco, 'nessun tocco');
  assert.ok(vicino(tocco.pos[0], 550, 1e-6) && vicino(tocco.pos[1], 300, 1e-6), `tocco in ${tocco.pos}`);
  const ultimo = tr.punti[tr.punti.length - 1];
  assert.ok(vicino(ultimo[0], 550, 1e-6), 'dopo lo specchio non va verticale');
  assert.equal(tr.fine, 'fuori');
}

// nel motore: la regola 'tocca' accende una massa e la retta diventa curva
{
  const p = {
    G: 1, dt: 0.05, passi: 2000, limiti: [0, 0, 1000, 600],
    emettitori: [{ id: 'r', pos: [50, 300], angolo: 0, v: 20 }],
    masse: [{ id: 'm', pos: [500, 200], M: 40000, acceso: false }],
    interfacce: [{ id: 's', a: [300, 250], b: [300, 350], tipo: 'rifrazione', n1: 1, n2: 1 }],
    regole: [{ quando: { tipo: 'tocca', id: 's' }, fai: [{ tipo: 'accendi', id: 'm' }] }],
  };
  const [tr] = simula(p);
  const prima = tr.punti.filter((q) => q[0] < 299).every((q) => vicino(q[1], 300, 1e-9));
  const dopo = tr.punti.some((q) => q[0] > 400 && Math.abs(q[1] - 300) > 1);
  assert.ok(prima, 'prima dell\'interfaccia doveva essere dritta');
  assert.ok(dopo, 'dopo l\'interfaccia doveva curvare');
}
console.log('test_ottica: tutto ok');
