// test_inversa.mjs — la decodifica fisica: ogni tratto è percorso da una particella vera
import assert from 'node:assert/strict';
import { leggiPNG } from '../strumenti/png.mjs';
import { decodifica, mascheraOriginale } from '../src/decodifica.js';
import { tracciaFisica, fedelta, adattaTratto } from '../src/camera/inversa.js';
import { simulaMondo } from '../src/camera/mondo.js';

// 1. tratti sintetici (y verso l'alto, come la decodifica): una S, una spirale, una retta
const H = 400, linee = [];
const S = []; for (let t = 0; t <= Math.PI * 2; t += 0.02) S.push([60 + 40 * t, 300 + 30 * Math.sin(t), 2]);
const sp = []; for (let t = 0; t <= 4 * Math.PI; t += 0.01) { const r = 60 * Math.exp(-0.12 * t); sp.push([200 + r * Math.cos(t), 150 + r * Math.sin(t), 3]); }
const re = []; for (let x = 20; x <= 380; x += 2) re.push([x, 40, 1.5]);
linee.push({ punti: S }, { punti: sp }, { punti: re });
const { cella, conta } = tracciaFisica({ linee, elementi: [], misure: { larghezza: 400, altezza: H } });
const tr = simulaMondo(cella);
assert.equal(tr.length, 3);
for (const [i, t] of tr.entries()) {
  assert.equal(t.fine, 'decade', `il tratto ${i} arriva in fondo e lì decade`);
  // ogni punto della traccia sta entro un pixel dal disegno
  const P = linee[i].punti.map((p) => [p[0], H - p[1]]);
  let peggio = 0;
  for (const q of t.punti) { let d = Infinity; for (const p of P) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1])); peggio = Math.max(peggio, d); }
  assert.ok(peggio < 1, `tratto ${i}: scarto ${peggio}`);
  // lo spessore è la carica
  assert.ok(Math.abs(t.punti[5][4] - [2, 3, 1.5][i]) <= 0.125 + 1e-9);
}
console.log(`  ✓ una S, una spirale e una retta: tre particelle, ${conta.pezzi} archi di campo, entro un pixel dal disegno`);
const spirale = adattaTratto(sp.map((p) => [p[0], H - p[1], p[2]]));
assert.ok(spirale.pezzi.length <= 12, `la spirale in pochi archi: ${spirale.pezzi.length}`);
console.log(`  ✓ due giri di spirale logaritmica in ${spirale.pezzi.length} archi`);

// 2. la tavola greca
const img = leggiPNG(new URL('../esempi/greco_6.png', import.meta.url).pathname);
const ris = decodifica(img), fis = tracciaFisica(ris), tracce = simulaMondo(fis.cella);
const f = fedelta(tracce, mascheraOriginale(ris), img.larghezza, img.altezza, ris.misure.ritaglio);
console.log(`  ✓ tavola greca: ${fis.conta.tratti} tratti, ${fis.conta.pezzi} archi, ${fis.conta.esposizioni} esposizioni; la fisica la rifà al ${(f.iou * 100).toFixed(1)}% (richiamo ${(f.richiamo * 100).toFixed(1)}%, precisione ${(f.precisione * 100).toFixed(1)}%)`);
assert.ok(f.iou > 0.7 && f.precisione > 0.8);
assert.ok(tracce.filter((t) => t.fine === 'fuori').length === 0, 'nessuna particella sfugge alla lastra');
console.log('inversa: tutto ok');
