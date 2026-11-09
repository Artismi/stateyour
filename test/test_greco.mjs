// Gli elementi greci: il petalo a spatola, il disco, l'occhio della voluta,
// il filo di sezione costante.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';
import { MOTIVI } from '../src/motivi.js';
import { catena } from '../src/catena.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// 1. il petalo: alla base largo b, in punta largo W, lungo L; in mezzo la larghezza segue √(1 + k·s²)
{
  const L = 40, W = 8, b = 1;
  const [tr] = simula(MOTIVI.petalo({ L, W, b }));
  const P = tr.punti, ultimo = P[P.length - 1];
  assert.equal(tr.fine, 'fermata');
  assert.ok(Math.abs(P[0][4] - b) < 1e-9, `base ${P[0][4]}`);
  assert.ok(Math.abs(ultimo[4] - W) / W < 1e-3, `punta ${ultimo[4]}`);
  assert.ok(Math.abs(dist(ultimo, [0, 0]) - L) < 1e-6, `lunghezza ${dist(ultimo, [0, 0])}`);
  const k = (W * W / (b * b) - 1) / (L * L);
  for (const q of P.filter((_, i) => i % 50 === 0)) {
    const s = dist(q, [0, 0]), atteso = b * Math.sqrt(1 + k * s * s);
    assert.ok(Math.abs(q[4] - atteso) / atteso < 1e-3, `a ${s.toFixed(2)}: ${q[4]} invece di ${atteso}`);
  }
  console.log(`ok  petalo: da ${b} a ${W} lungo ${L}, larghezza b·√(1 + k·s²) in ogni punto`);
}

// 2. il petalo che si incurva: la direzione finale ruota di circa `curva`
{
  const curva = 0.6;
  const [tr] = simula(MOTIVI.petalo({ L: 40, W: 8, b: 1, curva }));
  const P = tr.punti, n = P.length;
  const ang = Math.atan2(P[n - 1][1] - P[n - 2][1], P[n - 1][0] - P[n - 2][0]) - Math.PI / 2;
  assert.ok(ang > 0.3 && ang < 0.9, `svolta ${ang}`);
  console.log(`ok  petalo incurvato: la punta ruota di ${ang.toFixed(2)} rad`);
}

// 3. il disco: un cerchio di raggio d/4 tracciato con spessore d/2, quindi pieno fino a d/2
{
  const d = 6;
  const [tr] = simula(MOTIVI.disco({ d }));
  for (const q of tr.punti) {
    assert.ok(Math.abs(dist(q, [0, 0]) - d / 4) < 1e-4, `raggio ${dist(q, [0, 0])}`);
    assert.ok(Math.abs(q[4] - d / 2) < 1e-12, 'spessore');
  }
  const u = tr.punti[tr.punti.length - 1];
  assert.ok(dist(u, tr.punti[0]) < 1e-3, 'il giro non si chiude');
  console.log('ok  disco: un giro esatto, pieno fino al bordo');
}

// 4. la voluta greca: sezione costante (esponente 0) e un occhio pieno al centro asintotico
{
  const p = catena({ punti: [[0, 0], [30, 10], [44, 30]], v: 10, spessore: 2, esponente: 0, voluta: { giri: 2, rMin: 2, occhio: 5 } });
  const tracce = simula(p);
  assert.equal(tracce.length, 2, 'manca l\'occhio');
  const [filo, occhio] = tracce;
  for (const q of filo.punti) assert.ok(Math.abs(q[4] - 2) < 1e-9, `il filo cambia sezione: ${q[4]}`);
  const centro = p.blocchi.find((b) => b.id === 'c:fine').regione.centro;
  for (const q of occhio.punti) assert.ok(Math.abs(dist(q, centro) - 5 / 4) < 1e-4, 'l\'occhio non è centrato');
  // l'occhio nasce quando la spirale arriva (entro l'errore d'integrazione lungo la voluta)
  const tFilo = filo.punti[filo.punti.length - 1][3];
  assert.ok(Math.abs(occhio.punti[0][3] - tFilo) < 1e-4 * tFilo, `l'occhio nasce a ${occhio.punti[0][3]}, la spirale arriva a ${tFilo}`);
  console.log('ok  voluta greca: filo di sezione costante, occhio pieno nel centro asintotico quando la spirale arriva');
}
console.log('test_greco: tutto ok');
