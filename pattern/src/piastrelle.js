// piastrelle.js — la pagina della grammatica: sceglie una piastrella,
// la scompone per ruoli, ne costruisce il SEME (la configurazione di
// partenza con tutto al suo posto) e lo fa crescere: il reticolo intero
// nasce da una sola simulazione.
import { cella, parola, RUOLI, lineeDaTracce } from './grammatica.js';
import { simula } from './motore.js';
import { seme, contaSeme, pianoRadice } from './seme.js';
import { CELLE } from './celle.js';
import { pennellaTutte } from './pennello.js';

const $ = (id) => document.getElementById(id);
const COLORE = { centro: '#1c1b18', contenitore: '#8a867c', contenuto: '#b8412b', angoli: '#2b5fb8', lati: '#3b7d3a', corolla: '#9a5b1a', fusto: '#6b3fa0' };

const stile = () => ($('stile') ? $('stile').value : 'pieno');

// ---- il seme e la sua crescita
let corrente = null; // { r, conf, tracce, tMax }

function coltiva(r) {
  const conf = seme(r);
  const tracce = simula(conf);
  const tMax = Math.max(0, ...tracce.map((tr) => tr.punti[tr.punti.length - 1][3] ?? 0));
  return { r, conf, tracce, tMax };
}

function disegnaReticolo(t) {
  const { r, conf, tracce, tMax } = corrente;
  const tela = $('reticolo'), ctx = tela.getContext('2d');
  const W = tela.width, H = tela.height;
  ctx.clearRect(0, 0, W, H);
  const k = Math.min((W - 20) / conf.larghezza, (H - 20) / conf.altezza);
  const ox = (W - conf.larghezza * k) / 2, oy = (H - conf.altezza * k) / 2;
  const X = (x) => ox + x * k, Y = (y) => H - (oy + y * k);
  ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const tutto = t >= tMax * (1 - 1e-3); // il cursore arrotonda al suo passo
  // le linee fino all'istante t, col loro spessore; la penna alzata le spezza
  const voci = [], teste = [];
  for (const tr of tracce) {
    let pezzo = [], testa = null;
    for (const [x, y, penna, tp, w] of tr.punti) {
      if (!tutto && tp > t) break;
      if (penna) pezzo.push([x, y, w ?? 0]);
      else { voci.push({ punti: pezzo }); pezzo = []; }
      testa = [x, y];
    }
    voci.push({ punti: pezzo });
    teste.push([tr, testa]);
  }
  pennellaTutte(ctx, voci, X, Y, k, stile());
  for (const [tr, testa] of teste) {
    // la particella in viaggio
    if (!tutto && testa && (tr.punti[0][3] ?? 0) <= t && tr.punti[tr.punti.length - 1][3] > t) {
      const ruolo = (conf.piani[pianoRadice(tr.piano)] || {}).ruolo;
      ctx.fillStyle = COLORE[ruolo] || '#b8412b';
      ctx.beginPath(); ctx.arc(X(testa[0]), Y(testa[1]), 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // mentre cresce: la configurazione di partenza, tutta al suo posto
  if (!tutto) {
    // le masse (anche quelle dentro i blocchi di spaziotempo) e gli specchi
    ctx.fillStyle = 'rgba(184,65,43,.45)';
    const masse = conf.masse.map((m) => m.pos).concat(conf.blocchi.flatMap((b) => [].concat(b.legge).filter((l) => l && l.tipo === 'gravita').map((l) => l.pos)));
    for (const q of masse) { ctx.beginPath(); ctx.arc(X(q[0]), Y(q[1]), 1.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(43,95,184,.45)'; ctx.lineWidth = 1;
    for (const i of conf.interfacce) { ctx.beginPath(); ctx.moveTo(X(i.a[0]), Y(i.a[1])); ctx.lineTo(X(i.b[0]), Y(i.b[1])); ctx.stroke(); }
    // le sorgenti, già orientate: piene quelle ancora da partire, vuote quelle dei rami che nasceranno dopo
    for (const e of conf.emettitori) {
      if ((e.t0 ?? 0) < t) continue;
      const ruolo = (conf.piani[pianoRadice(e.piano)] || {}).ruolo;
      const ang = Math.atan2(e.dir[1], e.dir[0]);
      ctx.save(); ctx.translate(X(e.pos[0]), Y(e.pos[1])); ctx.rotate(-ang);
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3, 3); ctx.lineTo(-3, -3); ctx.closePath();
      if ((e.t0 ?? 0) > 0) { ctx.strokeStyle = COLORE[ruolo] || '#1c1b18'; ctx.lineWidth = 1; ctx.stroke(); }
      else { ctx.fillStyle = COLORE[ruolo] || '#1c1b18'; ctx.fill(); }
      ctx.restore();
    }
  }
  // la cella fondamentale evidenziata
  const L = r.cella.lato ?? 120;
  ctx.strokeStyle = 'rgba(184,65,43,.5)'; ctx.setLineDash([3, 3]);
  ctx.strokeRect(X(0), Y(L), L * k, L * k); ctx.setLineDash([]);
  $('otempo').value = tutto ? `t = ${tMax.toFixed(2)} · cresciuto` : `t = ${t.toFixed(2)}${t <= 0 ? ' · il seme: tutto al suo posto, le particelle orientate' : ''}`;
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
  const presenti = new Set();
  const voci = [];
  for (const p of c.pezzi) {
    presenti.add(p.ruolo);
    for (const l of p.linee) voci.push({ punti: l, colore: COLORE[p.ruolo] || '#000' });
  }
  pennellaTutte(ctx, voci, X, Y, k, stile());
  $('scomposizione').innerHTML = RUOLI.filter((ru) => presenti.has(ru))
    .map((ru) => `<div><i style="background:${COLORE[ru]}"></i>${ru}${ru === 'contenuto' && r.cella.contenuto ? ` (${r.cella.contenuto.length} varianti)` : ''}</div>`).join('');
}

function mostra(r) {
  $('errore').textContent = '';
  try {
    disegnaCella(r);
    corrente = coltiva(r);
    $('tempo').max = String(corrente.tMax); $('tempo').step = String(corrente.tMax / 1000 || 0.01); $('tempo').value = String(corrente.tMax);
    disegnaReticolo(corrente.tMax);
    const c = contaSeme(corrente.conf);
    const linee = lineeDaTracce(corrente.tracce).length;
    $('parola').textContent = `${r.nome ? r.nome + '\n' : ''}${parola(r)}\n` +
      `seme: ${c.sorgenti} sorgenti, ${c.blocchi} blocchi di spaziotempo, ${c.masse} masse, ${c.campi} campi, ${c.interfacce} specchi, ${c.regole} regole → ${linee} linee`;
  } catch (err) { $('errore').textContent = String(err); console.error(err); }
}
$('tempo').addEventListener('input', () => corrente && disegnaReticolo(Number($('tempo').value)));
$('stile').addEventListener('change', () => { if (!corrente) return; disegnaCella(corrente.r); disegnaReticolo(Number($('tempo').value)); });
$('scarica').addEventListener('click', () => {
  if (!corrente) return;
  const { piani, larghezza, altezza, ...stato } = corrente.conf;
  const testo = JSON.stringify({ nome: corrente.r.nome, parola: parola(corrente.r), ...stato }, (k, v) => (typeof v === 'number' ? Number(v.toPrecision(12)) : v));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
  a.download = `seme_${$('scelta').value || 'piastrella'}.json`; a.click();
});

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
