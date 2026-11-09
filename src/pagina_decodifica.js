// pagina_decodifica.js — carica un'immagine, la decodifica, fa crescere il seme
// e confronta la ricostruzione con l'originale.
import { decodifica, semeDaCodifica, rasterizza, somiglianza, mascheraOriginale } from './decodifica.js';
import { simula } from './motore.js';
import { lineeDaTracce } from './grammatica.js';
import { pennellaTutte } from './pennello.js';

const $ = (id) => document.getElementById(id);
let ultimo = null;

async function caricaImmagine(src) {
  const im = new Image(); im.src = src; await im.decode();
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  return { img: { larghezza: c.width, altezza: c.height, canali: 4, dati: d.data }, elemento: im };
}

function disegnaOriginale(elemento, W, H) {
  const c = $('originale'); c.width = W * 2; c.height = H * 2;
  c.getContext('2d').drawImage(elemento, 0, 0, W * 2, H * 2);
}

function disegnaLettura(ris) {
  const { maschera, scheletro, distanza, W, H } = ris.interni;
  const c = $('lettura'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), im = ctx.createImageData(W, H);
  let dmax = 1; for (let i = 0; i < W * H; i++) if (scheletro[i]) dmax = Math.max(dmax, distanza[i]);
  for (let i = 0; i < W * H; i++) {
    let r = 251, g = 250, b = 246;
    if (maschera[i]) { r = 205; g = 200; b = 188; }
    if (scheletro[i]) { const u = distanza[i] / dmax; r = Math.round(40 + 200 * u); g = 40; b = Math.round(200 - 160 * u); }
    im.data[i * 4] = r; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
}

function colore(c) { return `rgb(${c.map((v) => Math.round(v)).join(',')})`; }

function disegnaRicostruzione(ris, linee) {
  const W0 = ris.misure.larghezza, H0 = ris.misure.altezza, k = 2;
  const c = $('ricostruzione'); c.width = W0 * k; c.height = H0 * k;
  const ctx = c.getContext('2d');
  ctx.fillStyle = colore(ris.misure.colori.fondo); ctx.fillRect(0, 0, c.width, c.height);
  const X = (x) => x * k, Y = (y) => (H0 - y) * k;
  pennellaTutte(ctx, linee.map((l) => ({ punti: l, colore: colore(ris.misure.colori.inchiostro) })), X, Y, k, $('stile').value, colore(ris.misure.colori.fondo));
}

async function esegui(src) {
  $('rapporto').textContent = 'decodifica in corso…';
  await new Promise((r) => setTimeout(r, 30));
  const { img, elemento } = await caricaImmagine(src);
  const t0 = performance.now();
  const ris = decodifica(img);
  const t1 = performance.now();
  const conf = semeDaCodifica({ elementi: ris.elementi });
  const tracce = simula(conf);
  const linee = lineeDaTracce(tracce);
  const t2 = performance.now();
  disegnaOriginale(elemento, img.larghezza, img.altezza);
  disegnaLettura(ris);
  disegnaRicostruzione(ris, linee);
  const ric = rasterizza(linee, img.larghezza, img.altezza, 1);
  const s = somiglianza(mascheraOriginale(ris), ric.m);
  const conta = (tipo) => ris.elementi.filter((e) => e.tipo === tipo).length;
  const catene = ris.elementi.filter((e) => e.tipo === 'catena');
  const rami = (d) => (d.rami || []).reduce((n, r) => n + 1 + rami(r.catena), 0);
  const ancoraggi = (d) => d.punti.length + (d.rami || []).reduce((n, r) => n + ancoraggi(r.catena), 0);
  $('rapporto').textContent =
    `codifica: ${catene.length} catene con ${catene.reduce((n, e) => n + rami(e.def), 0)} rami e ${catene.reduce((n, e) => n + ancoraggi(e.def), 0)} ancoraggi, ${conta('petalo')} petali, ${conta('disco')} dischi\n` +
    `seme: ${conf.emettitori.length} sorgenti, ${conf.blocchi.length} blocchi di spaziotempo\n` +
    `somiglianza con l'inchiostro: IoU ${(s.iou * 100).toFixed(1)} %, richiamo ${(s.richiamo * 100).toFixed(1)} %, precisione ${(s.precisione * 100).toFixed(1)} %\n` +
    `tempi: lettura ${((t1 - t0) / 1000).toFixed(1)} s, crescita ${((t2 - t1) / 1000).toFixed(1)} s`;
  ultimo = { ris, conf, linee };
  window.__ultimo = ultimo;
  window.__risultato = { iou: s.iou, richiamo: s.richiamo, precisione: s.precisione, elementi: ris.elementi.length };
}

$('esempio').addEventListener('click', () => esegui('./esempi/greco_6.png'));
$('file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) esegui(URL.createObjectURL(f)); });
$('stile').addEventListener('change', () => ultimo && disegnaRicostruzione(ultimo.ris, ultimo.linee));
$('scarica').addEventListener('click', () => {
  if (!ultimo) return;
  const { piani, ...stato } = ultimo.conf;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ codifica: ultimo.ris.elementi, seme: stato })], { type: 'application/json' }));
  a.download = 'seme_decodificato.json'; a.click();
});
$('spazio').addEventListener('click', () => {
  if (!ultimo) return;
  localStorage.setItem('stateyour:codifica', JSON.stringify({ elementi: ultimo.ris.elementi, misure: ultimo.ris.misure }));
  location.href = './spaziotempo.html#decodifica';
});
esegui('./esempi/greco_6.png');
