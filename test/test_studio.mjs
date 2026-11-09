// Lo studio: il seme unico. Un numero dà sempre lo stesso pattern; la via
// veloce (traiettorie in cache spostate) coincide con la fisica del seme
// compilato; mutare cambia i parametri e non la struttura; il reticolo mette
// le istanze giuste; il seme ricavato dalla lingua è fedele quanto la lingua.
import assert from 'node:assert/strict';
import * as Mo from '../src/studio/modello.js';
import { simula } from '../src/motore.js';
import { lineeDaTracce, reticolo } from '../src/grammatica.js';
import { decodifica, rasterizza, somiglianza, mascheraOriginale } from '../src/decodifica.js';
import { lingua, esportaLingua, semeDaLingua as semeFisicoDaLingua } from '../src/lingua.js';
import { CELLE } from '../src/celle.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// 1. riproducibile: stesso numero, stesso seme; numeri diversi, semi diversi
{
  for (const n of [1, 7, 12, 305, 2024]) assert.equal(JSON.stringify(Mo.inventa(n)), JSON.stringify(Mo.inventa(n)), `il numero ${n} non è riproducibile`);
  assert.notEqual(JSON.stringify(Mo.inventa(1)), JSON.stringify(Mo.inventa(2)));
  const disp = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => Mo.inventa(n).origine.disposizione.split(' ')[0]));
  assert.ok(disp.size >= 3, `poche disposizioni diverse: ${[...disp]}`);
  console.log(`ok  inventa: riproducibile; disposizioni trovate su 12 numeri: ${[...disp].join(', ')}`);
}

// 2. la via veloce coincide con la fisica del seme compilato
for (const n of [7, 12, 305]) {
  const s = Mo.inventa(n);
  const fisica = lineeDaTracce(simula(Mo.compila(s)));
  const cache = Mo.creaCache();
  const veloce = lineeDaTracce(Mo.collocazioni(s).flatMap((c) => cache.nelMondo(c.e, c.M)));
  assert.equal(fisica.length, veloce.length, `numero ${n}: ${fisica.length} linee dalla fisica, ${veloce.length} dalla cache`);
  // la stessa curva: estremi uguali e ogni punto vicino all'altra linea (i punti
  // possono differire di uno o due attorno a un evento, quindi non per indice)
  const daLinea = (q, linea, k0) => {
    let best = Infinity;
    for (let k = Math.max(0, k0 - 30); k < Math.min(linea.length - 1, k0 + 30); k++) {
      const [x1, y1] = linea[k], [x2, y2] = linea[k + 1], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((q[0] - x1) * dx + (q[1] - y1) * dy) / l2)) : 0;
      best = Math.min(best, Math.hypot(q[0] - x1 - t * dx, q[1] - y1 - t * dy));
    }
    return linea.length < 2 ? dist(q, linea[0]) : best;
  };
  let scarto = 0;
  fisica.forEach((l, i) => {
    const v = veloce[i];
    scarto = Math.max(scarto, dist(l[0], v[0]), dist(l[l.length - 1], v[v.length - 1]));
    for (let k = 0; k < l.length; k += Math.max(1, Math.floor(l.length / 40))) scarto = Math.max(scarto, daLinea(l[k], v, Math.round(k * v.length / l.length)));
  });
  assert.ok(scarto < 1e-6 * s.larghezza, `numero ${n}: scarto ${scarto}`);
  console.log(`ok  cache = fisica (numero ${n}): ${fisica.length} linee, scarto ${scarto.toExponential(1)}`);
}

// 3. mutare: la stessa struttura, parametri diversi
{
  const s = Mo.inventa(12), m = Mo.muta(s, 0.4, 99);
  assert.equal(m.parole.length, s.parole.length); assert.equal(m.frase.length, s.frase.length);
  assert.notEqual(JSON.stringify(m.parole), JSON.stringify(s.parole));
  assert.equal(JSON.stringify(Mo.muta(s, 0.4, 99)), JSON.stringify(m), 'la mutazione non è riproducibile');
  const conf = Mo.compila(m); assert.ok(simula(conf).length > 0);
  console.log('ok  muta: stessa struttura, parametri spostati, riproducibile');
}

// 4. il reticolo: colonne × righe istanze, ognuna con il centro della parola sul suo nodo
{
  let s = Mo.semeVuoto();
  s.parole.push({ nome: 'A', centro: [10, 20], simmetria: { tipo: 'D', n: 4, asse: Math.PI / 2 }, elementi: [{ e: { tipo: 'disco', pos: [30, 20], d: 6 }, copie: null }] });
  s.frase.push({ parola: 0, M: Mo.ID, parti: null, varianti: [] });
  s = Mo.ripetiSuReticolo(s, 0, { gruppo: 'pmm', nx: 4, ny: 3, passoX: 100, passoY: 90 });
  assert.equal(s.frase.length, 12);
  const centri = s.frase.map((f) => Mo.app(f.M, [10, 20]));
  assert.ok(Math.abs(centri[1][0] - centri[0][0] - 100) < 1e-9 && Math.abs(centri[4][1] - centri[0][1] - 90) < 1e-9, 'passi sbagliati');
  assert.equal(Mo.collocazioni(s).length, 12 * 8, 'D4: otto copie del disco per istanza');
  console.log('ok  reticolo: 12 istanze pmm, centri sui nodi, 8 copie per la simmetria D4');
}

// 5. dall'immagine allo studio: il seme ricavato dalla lingua cresce come la lingua
{
  const W = 520, H = 400, linee = [];
  const porta = (r, dx, dy, k) => { for (const p of reticolo(r).pezzi) for (const l of p.linee) linee.push(l.map(([x, y, w]) => [x * k + dx, y * k + dy, (w || 1) * k])); };
  porta({ ...CELLE.spirali_greche, colonne: 4 }, 20, 250, 1.15);
  porta({ ...CELLE.palmetta_greca, colonne: 3, gruppo: 'pm' }, 30, 40, 0.85);
  const m = rasterizza(linee, W, H, 1).m, dati = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) dati.set(m[i] ? [40, 30, 28] : [176, 90, 78], i * 3);
  const img = { larghezza: W, altezza: H, canali: 3, dati };
  const ris = decodifica(img), L = lingua(ris);
  const s = Mo.semeDaLingua(JSON.parse(JSON.stringify(esportaLingua(L))), { larghezza: W, altezza: H, colori: ris.misure.colori });
  const fedelta = (conf) => somiglianza(mascheraOriginale(ris), rasterizza(lineeDaTracce(simula(conf)), W, H, 1).m).iou;
  const a = fedelta(semeFisicoDaLingua(L)), b = fedelta(Mo.compila(s));
  assert.ok(Math.abs(a - b) < 0.005, `lingua ${a}, studio ${b}`);
  console.log(`ok  dall'immagine allo studio: ${s.parole.length} parole, ${s.frase.length} istanze, IoU ${(b * 100).toFixed(1)} % (lingua ${(a * 100).toFixed(1)} %)`);
}
console.log('test_studio: tutto ok');
