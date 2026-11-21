// spaziotempo.js — la pagina dello spaziotempo: sceglie che cosa mostrare e
// la affida alla vista 3D (vista3d.js).

import { simula } from './motore.js';
import { seme } from './seme.js';
import { CELLE } from './celle.js';
import { PARTITURE } from './partiture.js';
import { decodifica, semeDaCodifica } from './decodifica.js';
import { lingua, semeDaLingua } from './lingua.js';
import { creaVista3D, coloreLegge, NOMI_LEGGI } from './vista3d.js';

const $ = (id) => document.getElementById(id);
const spunte = () => ({ linee: $('vLinee').checked, pianta: $('vPianta').checked, taglio: $('vTaglio').checked, forze: $('vForze').checked, masse: $('vMasse').checked, campi: $('vCampi').checked });
const vista = creaVista3D($('scena'), { spunte, alCambio: ({ t, tMax }) => { $('otempo').value = `t = ${t.toFixed(2)} / ${tMax.toFixed(2)}`; } });
let gioca = false, pronto = false;

function prepara(conf, nota) {
  const tracce = simula(conf);
  vista.imposta(conf, tracce);
  const tMax = vista.tMax();
  $('tempo').max = String(tMax); $('tempo').step = String(tMax / 1000 || 0.001); $('tempo').value = String(tMax);
  $('legenda').innerHTML = vista.leggiPresenti().map((l) => `<div><i style="background:rgb(${coloreLegge(l).join(',')})"></i>${NOMI_LEGGI[l] || l}</div>`).join('');
  $('nota').textContent = `${nota || ''}\n${conf.emettitori.length} sorgenti, ${(conf.blocchi || []).length} blocchi, ${tracce.reduce((n, t) => n + t.punti.length, 0)} avvenimenti\n\ntrascina per ruotare, rotella per avvicinarti, maiuscolo + trascina per spostarti`;
  pronto = true;
}

$('tempo').addEventListener('input', () => vista.tempo(Number($('tempo').value)));
for (const id of ['vLinee', 'vPianta', 'vTaglio', 'vForze', 'vMasse', 'vCampi']) $(id).addEventListener('change', () => vista.disegna());
$('vista').addEventListener('click', () => vista.rimettiVista());
$('gioca').addEventListener('click', () => {
  gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶';
  const tMax = vista.tMax();
  let t = vista.tempo(); if (gioca && t >= tMax * 0.999) t = 0;
  let ultimo = performance.now();
  const passo = (ora) => {
    if (!gioca) return;
    t = Math.min(tMax, t + ((ora - ultimo) / 1000) * (tMax / 12)); ultimo = ora;
    $('tempo').value = String(t); vista.tempo(t);
    if (t >= tMax) { gioca = false; $('gioca').textContent = '▶'; return; }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
});
addEventListener('resize', () => vista.disegna());

async function caricaImmagine(src) {
  const im = new Image(); im.src = src; await im.decode();
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  return { larghezza: c.width, altezza: c.height, canali: 4, dati: x.getImageData(0, 0, c.width, c.height).data };
}
async function scegli(valore) {
  $('nota').textContent = 'preparo…';
  await new Promise((r) => setTimeout(r, 20));
  if (valore === 'decodifica') {
    let cod = null;
    try { cod = JSON.parse(localStorage.getItem('stateyour:codifica') || 'null'); } catch { cod = null; }
    if (!cod) {
      $('nota').textContent = 'decodifico la tavola greca…'; await new Promise((r) => setTimeout(r, 20));
      const ris = decodifica(await caricaImmagine('./esempi/greco_6.png'));
      $('nota').textContent = 'leggo la lingua…'; await new Promise((r) => setTimeout(r, 20));
      cod = { elementi: ris.elementi, lingua: lingua(ris), daLingua: true };
    }
    if (cod.lingua && cod.daLingua !== false) prepara(semeDaLingua(cod.lingua), 'la tavola decodificata e riscritta nella sua lingua: parole, simmetrie, ripetizioni');
    else prepara(semeDaCodifica(cod), 'la tavola decodificata: ogni linea nasce dal seme ricavato dall\'immagine');
  } else if (valore.startsWith('cella:')) {
    const r = CELLE[valore.slice(6)];
    prepara(seme({ ...r, colonne: Math.min(r.colonne ?? 1, 3), righe: Math.min(r.righe ?? 1, 2) }), r.nome);
  } else if (valore.startsWith('partitura:')) {
    const p = PARTITURE[valore.slice(10)]();
    prepara(p, p.nome);
  }
  location.hash = valore;
}
const sel = $('scelta');
const opzioni = [['decodifica', 'la tavola greca, decodificata']]
  .concat(Object.keys(CELLE).map((n) => [`cella:${n}`, `piastrella: ${n}`]))
  .concat(Object.keys(PARTITURE).map((n) => [`partitura:${n}`, `motore: ${n}`]));
for (const [v, t] of opzioni) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
sel.addEventListener('change', () => scegli(sel.value));
const iniziale = decodeURIComponent(location.hash.slice(1));
sel.value = opzioni.some(([v]) => v === iniziale) ? iniziale : 'cella:acanto';
scegli(sel.value);
window.__pronto = () => pronto;
window.__imposta = (o) => { if (o.cam) vista.camera(o.cam); for (const [k, v] of Object.entries(o.spunte || {})) $(k).checked = v; if (o.tempo != null) { const t = o.tempo * vista.tMax(); $('tempo').value = String(t); vista.tempo(t); } else vista.disegna(); };
