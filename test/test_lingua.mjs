// La lingua: dalla forma decodificata alla struttura. Un pattern di struttura
// nota si rilegge con le sue parole, le sue simmetrie e le sue ripetizioni; un
// fregio connesso rivela il suo reticolo; la tavola greca si accorcia senza
// perdere fedeltà.
import assert from 'node:assert/strict';
import { decodifica, rasterizza, somiglianza, mascheraOriginale } from '../src/decodifica.js';
import { lingua, semeDaLingua, esportaLingua } from '../src/lingua.js';
import { simula } from '../src/motore.js';
import { lineeDaTracce, reticolo } from '../src/grammatica.js';
import { CELLE } from '../src/celle.js';
import { leggiPNG } from '../strumenti/png.mjs';

function immagine(W, H, disegna) {
  const linee = [];
  const porta = (r, dx, dy, k) => { for (const p of reticolo(r).pezzi) for (const l of p.linee) linee.push(l.map(([x, y, w]) => [x * k + dx, y * k + dy, (w || 1) * k])); };
  disegna(porta);
  const m = rasterizza(linee, W, H, 1).m, dati = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) dati.set(m[i] ? [40, 30, 28] : [176, 90, 78], i * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 8 || y < 8 || x >= W - 8 || y >= H - 8) dati.set([240, 232, 215], (y * W + x) * 3);
  return { larghezza: W, altezza: H, canali: 3, dati };
}
const fedelta = (img, ris, conf) => somiglianza(mascheraOriginale(ris), rasterizza(lineeDaTracce(simula(conf)), img.larghezza, img.altezza, 1).m);

// 1. un pattern di struttura nota: un fregio di quattro spirali greche, tre palmette a colonne specchiate, due stelle bizantine
{
  const img = immagine(520, 400, (porta) => {
    porta({ ...CELLE.spirali_greche, colonne: 4 }, 20, 250, 1.15);
    porta({ ...CELLE.palmetta_greca, colonne: 3, gruppo: 'pm' }, 30, 40, 0.85);
    porta({ ...CELLE.bizantino_stelle, colonne: 2, righe: 1, gruppo: 'pmm' }, 345, 40, 0.72);
  });
  const ris = decodifica(img), L = lingua(ris);
  const spirali = L.parole.find((w) => w.istanze.length === 4 && w.rappresentante.n > 6000);
  assert.ok(spirali, 'il fregio di spirali non è una parola ripetuta quattro volte');
  assert.equal(spirali.rappresentante.simmetria.tipo, 'D', 'la cella delle spirali è simmetrica');
  const palmette = L.parole.find((w) => w.istanze.length === 3);
  assert.ok(palmette, 'le tre palmette non sono una parola');
  assert.ok(palmette.istanze.some((i) => i.M[0] * i.M[3] - i.M[1] * i.M[2] < 0), 'una palmetta deve essere specchiata');
  assert.ok(L.conta.decodificati / L.conta.vocabolario > 3, `seme accorciato solo di ${L.conta.decodificati / L.conta.vocabolario}`);
  const s = fedelta(img, ris, semeDaLingua(L));
  assert.ok(s.iou > 0.78, `fedeltà del seme della lingua ${s.iou}`);
  // e il seme si rifà anche dalla lingua esportata in JSON
  const s2 = fedelta(img, ris, semeDaLingua(JSON.parse(JSON.stringify(esportaLingua(L)))));
  assert.ok(Math.abs(s2.iou - s.iou) < 1e-6, 'la lingua esportata non dà lo stesso seme');
  console.log(`ok  struttura nota: ${L.parole.length} parole, spirali ×4 (${spirali.rappresentante.simmetria.tipo}${spirali.rappresentante.simmetria.n}), palmette ×3 con una specchiata; seme ${L.conta.decodificati} → ${L.conta.vocabolario}, IoU ${(s.iou * 100).toFixed(1)} %`);
}

// 2. un fregio connesso: il reticolo dentro la figura
{
  const img = immagine(520, 400, (porta) => porta({ ...CELLE.girale, colonne: 4 }, 20, 200, 0.95));
  const ris = decodifica(img), L = lingua(ris);
  assert.equal(L.reticoli.length, 1, 'il fregio non ha un reticolo');
  const passo = Math.hypot(...L.reticoli[0].v1);
  assert.ok(Math.abs(passo - 120 * 0.95) < 3, `passo del fregio ${passo}`);
  console.log(`ok  fregio connesso: reticolo con passo ${passo.toFixed(1)} (atteso ${(120 * 0.95).toFixed(1)}), ${L.reticoli[0].celle} celle`);
}

// 3. la tavola greca: più corta, fedele quasi quanto la decodifica letterale
{
  const img = leggiPNG(new URL('../esempi/greco_6.png', import.meta.url).pathname);
  const ris = decodifica(img), L = lingua(ris);
  const s = fedelta(img, ris, semeDaLingua(L));
  assert.ok(L.conta.vocabolario < L.conta.decodificati, 'la lingua non accorcia il seme');
  assert.ok(s.iou > 0.8, `fedeltà ${s.iou}`);
  const simmetriche = L.parole.filter((w) => w.rappresentante.simmetria.tipo !== 'id').length;
  console.log(`ok  tavola greca: ${L.parole.length} parole, ${simmetriche} simmetriche, seme ${L.conta.decodificati} → ${L.conta.vocabolario}, IoU ${(s.iou * 100).toFixed(1)} %`);
}
console.log('test_lingua: tutto ok');
