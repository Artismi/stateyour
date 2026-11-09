// piastrelle.js — la pagina della grammatica: sceglie una piastrella,
// la scompone per ruoli, la ripete nel reticolo, ne scrive la parola.
import { cella, reticolo, parola, RUOLI } from './grammatica.js';
import { CELLE } from './celle.js';

const $ = (id) => document.getElementById(id);
const COLORE = { centro: '#1c1b18', contenitore: '#8a867c', contenuto: '#b8412b', angoli: '#2b5fb8', lati: '#3b7d3a', corolla: '#9a5b1a', fusto: '#6b3fa0' };

function linea(ctx, pts, X, Y) {
  ctx.beginPath();
  pts.forEach((p, k) => (k ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
  ctx.stroke();
}

function disegnaReticolo(r) {
  const tela = $('reticolo'), ctx = tela.getContext('2d');
  const W = tela.width, H = tela.height;
  ctx.clearRect(0, 0, W, H);
  const res = reticolo(r);
  const k = Math.min((W - 20) / res.larghezza, (H - 20) / res.altezza);
  const ox = (W - res.larghezza * k) / 2, oy = (H - res.altezza * k) / 2;
  const X = (x) => ox + x * k, Y = (y) => H - (oy + y * k);
  ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const p of res.pezzi) {
    ctx.strokeStyle = '#1c1b18';
    for (const l of p.linee) linea(ctx, l, X, Y);
  }
  // la cella fondamentale evidenziata
  const L = r.cella.lato ?? 120;
  ctx.strokeStyle = 'rgba(184,65,43,.5)'; ctx.setLineDash([3, 3]);
  ctx.strokeRect(X(0), Y(L), L * k, L * k); ctx.setLineDash([]);
  return res;
}

function disegnaCella(r) {
  const tela = $('cella'), ctx = tela.getContext('2d');
  const W = tela.width, H = tela.height;
  ctx.clearRect(0, 0, W, H);
  const c = cella(r.cella, 0);
  const k = (W - 30) / c.lato;
  const X = (x) => W / 2 + x * k, Y = (y) => H / 2 - y * k;
  ctx.strokeStyle = '#d8d3c6'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.strokeRect(X(-c.lato / 2), Y(c.lato / 2), c.lato * k, c.lato * k); ctx.setLineDash([]);
  ctx.lineWidth = 1.5;
  const presenti = new Set();
  for (const p of c.pezzi) {
    presenti.add(p.ruolo);
    ctx.strokeStyle = COLORE[p.ruolo] || '#000';
    for (const l of p.linee) linea(ctx, l, X, Y);
  }
  $('scomposizione').innerHTML = RUOLI.filter((ru) => presenti.has(ru))
    .map((ru) => `<div><i style="background:${COLORE[ru]}"></i>${ru}${ru === 'contenuto' && r.cella.contenuto ? ` (${r.cella.contenuto.length} varianti)` : ''}</div>`).join('');
}

function mostra(r) {
  $('errore').textContent = '';
  try {
    disegnaCella(r);
    const res = disegnaReticolo(r);
    $('parola').textContent = `${r.nome ? r.nome + '\n' : ''}${parola(r)}\n${res.pezzi.length} pezzi`;
  } catch (err) { $('errore').textContent = String(err); console.error(err); }
}

const sel = $('scelta');
for (const nome of Object.keys(CELLE)) {
  const op = document.createElement('option'); op.value = nome; op.textContent = nome; sel.appendChild(op);
}
function scegli(nome) {
  const r = CELLE[nome];
  $('json').value = JSON.stringify(r, null, 1).replace(/\[\s+([-\d.e]+),\s+([-\d.e]+)\s+\]/g, '[$1, $2]');
  mostra(r);
}
sel.addEventListener('change', () => scegli(sel.value));
$('genera').addEventListener('click', () => {
  try { mostra(JSON.parse($('json').value)); }
  catch (err) { $('errore').textContent = 'JSON non valido: ' + err.message; }
});
const iniziale = location.hash.slice(1);
sel.value = CELLE[iniziale] ? iniziale : 'rosone';
scegli(sel.value);
