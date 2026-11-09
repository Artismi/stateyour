// Lo spessore: si conserva ai nodi (Leonardo), si stringe nella voluta con la
// velocità, e i rami simili sono copie in scala della catena radice.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';
import { catena } from '../src/catena.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lunghezza = (pts) => pts.slice(1).reduce((s, q, i) => s + dist(q, pts[i]), 0);

// 1. Leonardo: prima del nodo w, dopo il raccordo w·√(1−q), il ramo parte con w·√q
{
  const q = 0.3, w = 4;
  const p = catena({ punti: [[0, 0], [40, 10], [80, 0], [120, 10]], v: 10, spessore: w,
    rami: [{ da: 1, quota: q, catena: { punti: [[50, 30], [44, 40]] } }] });
  const [stelo, ramo] = simula(p);
  const tNodo = p.emettitori[0].cessioni[0].t, durata = p.emettitori[0].cessioni[0].durata;
  const prima = stelo.punti.filter((x) => x[3] < tNodo).pop()[4];
  const dopo = stelo.punti.find((x) => x[3] > tNodo + durata * 1.01)[4];
  const figlio = ramo.punti[0][4];
  assert.ok(Math.abs(prima - w) < 1e-9, `prima del nodo ${prima}`);
  assert.ok(Math.abs(dopo - w * Math.sqrt(1 - q)) < 1e-6, `dopo il nodo ${dopo}`);
  assert.ok(Math.abs(figlio - w * Math.sqrt(q)) < 1e-6, `il ramo parte con ${figlio}`);
  assert.ok(Math.abs(dopo * dopo + figlio * figlio - prima * prima) < 1e-6, 'la sezione non si conserva');
  // il raccordo è graduale: nessun salto tra due punti consecutivi
  let salto = 0;
  for (let i = 1; i < stelo.punti.length; i++) salto = Math.max(salto, Math.abs(stelo.punti[i][4] - stelo.punti[i - 1][4]));
  assert.ok(salto < 0.05 * w, `salto di spessore ${salto}`);
  console.log(`ok  Leonardo: ${prima.toFixed(3)}² = ${dopo.toFixed(3)}² + ${figlio.toFixed(3)}², raccordo senza salti`);
}

// 2. la voluta: lo spessore segue la velocità, che nella spirale è proporzionale
//    alla distanza dall'occhio; alla fine vale w·rMin/r0
{
  const w = 5;
  const p = catena({ punti: [[0, 0], [30, 20], [60, 10]], v: 10, spessore: w, voluta: { giri: 2, rMin: 1 } });
  const [tr] = simula(p);
  const occhio = p.blocchi.find((b) => b.id === 'c:fine').regione.centro;
  const voluta = p.blocchi.find((b) => b.id === 'c:voluta');
  const r0 = voluta.regione.r;
  const fine = tr.punti[tr.punti.length - 1];
  const atteso = w * dist(fine, occhio) / r0;
  assert.ok(Math.abs(fine[4] - atteso) / atteso < 1e-3, `spessore finale ${fine[4]}, atteso ${atteso}`);
  console.log(`ok  voluta: lo spessore si stringe da ${w} a ${fine[4].toFixed(3)} verso l'occhio`);
}

// 3. una catena di un solo punto: la particella parte dentro la voluta
{
  const p = catena({ punti: [[0, 0]], tangenti: [[0, 1]], v: 10, spessore: 2, voluta: { R: 8, giri: 1.5, rMin: 0.5 } });
  const [tr] = simula(p);
  assert.equal(tr.fine, 'fermata');
  assert.ok(tr.punti.length > 100);
  console.log('ok  un punto solo: una voluta pura');
}

// 4. ramo simile: una copia in scala della catena radice
{
  const s = 0.5;
  const def = { punti: [[0, 0], [30, 24], [64, 28], [88, 10]], tangenti: [[0.55, 1.2]], voluta: { giri: 1.8, rMin: 0.6, verso: 'destra' }, v: 10,
    spessore: 6, profondita: 1, rami: [{ da: 2, simile: { scala: s, angolo: -30, specchia: true } }] };
  const tracce = simula(catena(def));
  assert.equal(tracce.length, 2);
  const [radice, copia] = tracce.map((t) => t.punti.map((q) => [q[0], q[1]]));
  const rl = lunghezza(radice), cl = lunghezza(copia);
  assert.ok(Math.abs(cl / rl - s) < 2e-3, `la copia è lunga ${cl / rl} volte la radice`);
  const rc = dist(radice[0], radice[radice.length - 1]), cc = dist(copia[0], copia[copia.length - 1]);
  assert.ok(Math.abs(cc / rc - s) < 2e-3, `corda ${cc / rc}`);
  // e il suo spessore è la radice in scala: w·s all'ancoraggio (quota s²)
  const wAnc = tracce[0].punti.filter((q) => q[3] < tracce[1].punti[0][3]).pop()[4];
  assert.ok(Math.abs(tracce[1].punti[0][4] - wAnc * s) < 1e-6, 'spessore della copia');
  console.log(`ok  ramo simile: lunghezza e corda in scala ${s}, spessore in scala`);
}
console.log('test_spessore: tutto ok');
