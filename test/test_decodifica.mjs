// La decodifica: un pattern noto disegnato da noi si ritrova; la tavola greca
// si ricostruisce almeno come oggi.
import assert from 'node:assert/strict';
import { decodifica, semeDaCodifica, rasterizza, somiglianza, mascheraOriginale } from '../src/decodifica.js';
import { simula } from '../src/motore.js';
import { lineeDaTracce, reticolo } from '../src/grammatica.js';
import { CELLE } from '../src/celle.js';
import { leggiPNG } from '../strumenti/png.mjs';

function ricostruisci(img) {
  const ris = decodifica(img);
  const linee = lineeDaTracce(simula(semeDaCodifica({ elementi: ris.elementi })));
  const s = somiglianza(mascheraOriginale(ris), rasterizza(linee, img.larghezza, img.altezza, 1).m);
  return { ris, s };
}

// 1. andata e ritorno: il candelabro e il girale disegnati da noi, inchiostro scuro su fondo rosso
{
  const W = 360, H = 520;
  const linee = [];
  const porta = (r, dx, dy, k) => { for (const p of reticolo(r).pezzi) for (const l of p.linee) linee.push(l.map(([x, y, w]) => [x * k + dx, y * k + dy, (w || 1) * k])); };
  porta(CELLE.candelabro, 20, 140, 1.35);
  porta({ ...CELLE.girale, colonne: 2 }, 30, 10, 1.25);
  const m = rasterizza(linee, W, H, 1).m;
  const dati = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) dati.set(m[i] ? [40, 30, 28] : [176, 90, 78], i * 3);
  // una cornice chiara, come nelle tavole
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 8 || y < 8 || x >= W - 8 || y >= H - 8) dati.set([240, 232, 215], (y * W + x) * 3);
  const { ris, s } = ricostruisci({ larghezza: W, altezza: H, canali: 3, dati });
  assert.ok(s.iou > 0.8, `andata e ritorno: IoU ${s.iou}`);
  console.log(`ok  andata e ritorno: ${ris.elementi.length} elementi, IoU ${(s.iou * 100).toFixed(1)} %, richiamo ${(s.richiamo * 100).toFixed(1)} %, precisione ${(s.precisione * 100).toFixed(1)} %`);
}

// 2. la tavola greca n. 6
{
  const img = leggiPNG(new URL('../esempi/greco_6.png', import.meta.url).pathname);
  const { ris, s } = ricostruisci(img);
  const conta = (t) => ris.elementi.filter((e) => e.tipo === t).length;
  assert.ok(s.iou > 0.78, `tavola greca: IoU ${s.iou}`);
  assert.ok(s.precisione > 0.85, `tavola greca: precisione ${s.precisione}`);
  console.log(`ok  tavola greca: ${conta('catena')} catene, ${conta('petalo')} petali, ${conta('disco')} dischi; IoU ${(s.iou * 100).toFixed(1)} %, richiamo ${(s.richiamo * 100).toFixed(1)} %, precisione ${(s.precisione * 100).toFixed(1)} %`);
}
console.log('test_decodifica: tutto ok');
