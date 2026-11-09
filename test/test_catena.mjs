// La catena: passa per ogni ancoraggio, senza angoli, con la velocità costante.
import assert from 'node:assert/strict';
import { simula } from '../src/motore.js';
import { catena, biarco, arcoPer } from '../src/catena.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// misura una traccia: distanza minima da ogni ancoraggio, svolta massima per passo
function misura(tr, ancoraggi) {
  const pts = tr.punti.map((q) => [q[0], q[1]]);
  const mancati = ancoraggi.map((a) => Math.min(...pts.map((q) => dist(q, a))));
  let svoltaMax = 0, kMax = 0;
  for (let i = 2; i < pts.length; i++) {
    const u = [pts[i - 1][0] - pts[i - 2][0], pts[i - 1][1] - pts[i - 2][1]];
    const w = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
    if (Math.hypot(...u) < 1e-9 || Math.hypot(...w) < 1e-9) continue;
    const a = Math.abs(Math.atan2(u[0] * w[1] - u[1] * w[0], u[0] * w[0] + u[1] * w[1]));
    if (a > svoltaMax) { svoltaMax = a; kMax = i; }
  }
  return { mancati, svoltaMax, kMax };
}

// 1. il biarco: la giunzione ha la stessa tangente, l'arrivo ha la tangente chiesta
{
  const n = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l]; };
  const casi = [
    [[0, 0], [1, 0], [50, 20], n([1, 1])],
    [[0, 0], [0, 1], [40, 0], [0, -1]],
    [[0, 0], n([1, 2]), [30, -10], n([1, -3])],
  ];
  for (const [p1, t1, p2, t2] of casi) {
    const [a, b] = biarco(p1, t1, p2, t2);
    assert.ok(dist(a.q, b.p) < 1e-9, 'i due archi non si toccano');
    assert.ok(dist(a.tq, b.t) < 1e-9, 'tangente discontinua alla giunzione');
    assert.ok(dist(b.q, p2) < 1e-9 && dist(b.tq, t2) < 1e-9, `tangente d'arrivo ${b.tq} attesa ${t2}`);
  }
  // l'arco da p con tangente t arriva in q: il centro dista |r| da entrambi
  const a = arcoPer([0, 0], [1, 0], [10, 10]);
  assert.ok(Math.abs(dist(a.centro, [0, 0]) - Math.abs(a.r)) < 1e-9 && Math.abs(dist(a.centro, [10, 10]) - Math.abs(a.r)) < 1e-9);
  console.log('ok  biarco: giunzione e arrivo tangenti');
}

// 2. una linea ondulata per nove ancoraggi
{
  const punti = [[0, 0], [20, 14], [40, 0], [60, -14], [80, 0], [100, 14], [120, 0], [140, -14], [160, 0]];
  const p = catena({ punti, v: 10 });
  const [tr] = simula(p);
  assert.equal(tr.fine, 'fermata');
  const { mancati, svoltaMax } = misura(tr, punti);
  mancati.forEach((m, i) => assert.ok(m < 1e-4, `ancoraggio ${i} mancato di ${m}`));
  assert.ok(svoltaMax < 0.02, `angolo nella linea: ${svoltaMax} rad`);
  // l'ultimo punto è l'ultimo ancoraggio
  const u = tr.punti[tr.punti.length - 1];
  assert.ok(dist(u, punti[punti.length - 1]) < 1e-4, `fine in ${u}`);
  console.log(`ok  onda per 9 ancoraggi: scarto massimo ${Math.max(...mancati).toExponential(1)}, svolta massima per passo ${svoltaMax.toFixed(4)} rad, ${p._archi.length} archi`);
}

// 3. la voluta: raccordo senza angolo, fermata esatta a rMin dal centro asintotico
{
  const punti = [[0, 0], [30, 20], [60, 10]];
  const p = catena({ punti, v: 10, voluta: { giri: 2.5, rMin: 1.5 } });
  const [tr] = simula(p);
  assert.equal(tr.fine, 'fermata');
  const { mancati, svoltaMax } = misura(tr, punti);
  mancati.forEach((m, i) => assert.ok(m < 1e-4, `ancoraggio ${i} mancato di ${m}`));
  assert.ok(svoltaMax < 0.02, `angolo nella linea: ${svoltaMax} rad`);
  const fine = p.blocchi.find((b) => b.id === 'c:fine');
  const u = tr.punti[tr.punti.length - 1];
  assert.ok(Math.abs(dist(u, fine.regione.centro) - 1.5) < 1e-6, `voluta fermata a ${dist(u, fine.regione.centro)}`);
  console.log(`ok  voluta: raccordo continuo, fermata a rMin = 1.5 dal centro asintotico`);
}

// 4. i rami: ogni ramo parte tangente dal suo ancoraggio e passa per i suoi punti
{
  const punti = [[0, 0], [40, 10], [80, 0], [120, 10]];
  const rami = [
    { da: 1, catena: { punti: [[52, 34], [40, 44]], tangenti: [[0, 1]], voluta: { giri: 1.5, rMin: 1 } } },
    { da: 2, catena: { punti: [[90, -24], [76, -30]], voluta: { giri: 1.5, rMin: 1 } } },
  ];
  const p = catena({ punti, v: 10, rami });
  const tracce = simula(p);
  assert.equal(tracce.length, 3, `attese tre particelle, trovate ${tracce.length}`);
  const [stelo, r1, r2] = tracce;
  assert.ok(misura(stelo, punti).mancati.every((m) => m < 1e-4));
  assert.ok(dist(r1.punti[0], punti[1]) < 1e-4, 'il primo ramo non parte dal suo ancoraggio');
  assert.ok(dist(r2.punti[0], punti[2]) < 1e-4, 'il secondo ramo non parte dal suo ancoraggio');
  for (const [r, ramo] of [[r1, rami[0]], [r2, rami[1]]]) {
    const m = misura(r, ramo.catena.punti);
    m.mancati.forEach((x, i) => assert.ok(x < 1e-4, `ramo: ancoraggio ${i} mancato di ${x}`));
    assert.ok(m.svoltaMax < 0.03, `ramo con un angolo: ${m.svoltaMax}`);
    assert.equal(r.fine, 'fermata');
  }
  console.log('ok  rami: due particelle figlie, ognuna per i propri ancoraggi');
}

// 5. chiusa: torna al punto di partenza con la stessa tangente
{
  const punti = [[30, 0], [0, 22], [-30, 0], [0, -14]];
  const p = catena({ punti, chiusa: true, v: 10 });
  const [tr] = simula(p);
  const { mancati, svoltaMax } = misura(tr, punti);
  mancati.forEach((m, i) => assert.ok(m < 1e-4, `ancoraggio ${i} mancato di ${m}`));
  assert.ok(svoltaMax < 0.02);
  const n = tr.punti.length, a = tr.punti[1], z = tr.punti[n - 2], ultimo = tr.punti[n - 1];
  assert.ok(dist(ultimo, punti[0]) < 1e-4, 'non si chiude');
  const t0 = Math.atan2(a[1] - punti[0][1], a[0] - punti[0][0]), t1 = Math.atan2(ultimo[1] - z[1], ultimo[0] - z[0]);
  assert.ok(Math.abs(Math.atan2(Math.sin(t1 - t0), Math.cos(t1 - t0))) < 0.02, 'si chiude con un angolo');
  console.log('ok  chiusa: si richiude tangente');
}

// 6. è uno stato: nessuna regola, nessuna azione; solo blocchi e sorgenti
{
  const p = catena({ punti: [[0, 0], [40, 10], [80, 0]], v: 10, voluta: { giri: 1.5, rMin: 1 }, rami: [{ da: 1, catena: { punti: [[50, 30], [40, 40]], voluta: { giri: 1, rMin: 1 } } }] });
  assert.equal(p.regole.length, 0);
  for (const e of p.emettitori) assert.ok(!e.regole || e.regole.length === 0, 'una sorgente con regole');
  for (const b of p.blocchi) assert.ok(b.regione && b.legge && b.piano, 'blocco incompleto');
  console.log(`ok  stato: ${p.blocchi.length} blocchi, ${p.emettitori.length} sorgenti, nessuna regola`);
}

// 7. il tempo separa: una linea che ripassa per lo stesso luogo non confonde i blocchi
{
  const punti = [[0, 0], [30, 20], [45, 0], [30, -16], [12, 0], [20, 22], [50, 30]];
  const p = catena({ punti, v: 10 });
  const [tr] = simula(p);
  const { mancati, svoltaMax } = misura(tr, punti);
  mancati.forEach((m, i) => assert.ok(m < 1e-4, `ancoraggio ${i} mancato di ${m}`));
  assert.ok(svoltaMax < 0.02, `angolo nella linea: ${svoltaMax}`);
  // la linea si incrocia: due tratti distanti nel tempo passano vicini nello spazio
  const pts = tr.punti;
  let incrocio = false;
  for (let i = 0; i < pts.length && !incrocio; i += 5) for (let j = i + 200; j < pts.length; j += 5) if (dist(pts[i], pts[j]) < 1) { incrocio = true; break; }
  assert.ok(incrocio, 'la prova non si incrocia');
  console.log('ok  tempo: la linea si incrocia e ogni tratto sente solo il proprio blocco');
}
console.log('test_catena: tutto ok');

// 8. una linea tutta dritta si ferma esattamente nel suo punto d'arrivo
{
  const punti = [[0, 0], [0, 40], [0, 90]];
  const p = catena({ punti, tangenti: [[0, 1], [0, 1], [0, 1]], v: 30 });
  const [tr] = simula(p);
  assert.equal(tr.fine, 'fermata');
  const u = tr.punti[tr.punti.length - 1];
  assert.ok(dist(u, [0, 90]) < 1e-6, `si ferma in ${u}`);
  console.log('ok  dritta: si ferma esattamente all\'ultimo ancoraggio');
}
