// lavoratore.js — il Web Worker: calcola il pattern e lo disegna su una tela fuori schermo (OffscreenCanvas).
// L'interfaccia non si blocca mai: qui si sceglie il passo, si fa correre la pallina, si ripiega la tessera, si
// proiettano le copie nella finestra e si disegnano le linee man mano che crescono.
//
// Messaggi dall'interfaccia: { tipo: 'tela', tela, w, h, dpr } · { tipo: 'pattern', p } (cambia la fisica: si riparte)
// · { tipo: 'finestra', finestra, vista } (cambia solo lo sguardo: si riproietta ciò che c'è) · { tipo: 'misura', w, h }.
// Messaggi verso l'interfaccia: { tipo: 'stato', frase, finestra, info }.

import { creaSessione } from '../motore.js';
import { creaFinestra, creaProiettore, copieVisibili } from '../finestra.js';
import { descriviDirezione } from '../indici.js';
import { NOMI_TECNICI } from '../reticolo.js';

let tela = null, ctx = null, W = 0, H = 0, dpr = 1;
let S = null, p = null, fin = null, P = null, vista = 'tessera', primo = 0, primoMostrato = false, giro = 0;
// L'INCHIOSTRO: la somma di lunghezza × opacità delle linee disegnate, per lo spessore, divisa per l'area della tela.
// Quando arriva a PIENO (le linee, pesate con la loro opacità, coprirebbero l'immagine 0,8 volte) la linea smette di
// crescere: oltre, il disegno diventa una nebbia uniforme e non si vede più il motivo.
const PIENO = 0.8;
let inchiostro = 0;

const COLORI = 10; // la velocità: lenta calda (arancio), veloce fredda (azzurro)
const tinta = (i) => { const t = i / (COLORI - 1); return `hsl(${28 + 172 * t}, ${90 - 10 * t}%, ${62 + 8 * t}%)`; };

function pulisci() {
  if (!ctx) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
  // un alone appena visibile al centro, come una lampada dietro il vetro
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, 'rgba(40,60,110,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// dall'immagine (X, Y) ai punti della tela: la larghezza della finestra L riempie la tela
const scala = () => W / fin.L;
const aTela = (X, Y) => [W / 2 + X * scala(), H / 2 - Y * scala()];

// gli atomi visibili: dischi tenui, colline color ambra e conche viola, più piccoli e più tenui lontano
function disegnaAtomi() {
  if (!S || !fin) return;
  const cr = S.cristallo, copie = copieVisibili(fin, cr, 1500), k = scala();
  ctx.globalCompositeOperation = 'lighter';
  for (const c of copie) for (const at of cr.atomi) {
    if (cr.centri.length > 1 && (at.j !== 0)) continue; // le copie stanno già nei punti di centratura
    const x = [at.r[0] + c.T[0], at.r[1] + c.T[1], at.r[2] + c.T[2]], w = fin.aFinestra(x);
    if (fin.piani.some((a) => a[0] * w[0] + a[1] * w[1] + a[2] * w[2] > a[3])) continue;
    const [X, Y, l] = fin.proietta(w[0], w[1], w[2]), s = fin.parallela ? 1 : fin.R / (fin.R + w[2]), [px, py] = aTela(X, Y);
    const r = Math.max(1.5, cr.w * 0.9 * s * k);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    const col = at.s > 0 ? '255,170,70' : '150,110,255';
    g.addColorStop(0, `rgba(${col},${0.32 * l})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
  }
}

// disegna i tratti dell'immagine: un percorso per colore e per luminosità, sommati con la luce
function disegna(s) {
  if (!s.length) return;
  const vmax = S.scelta.vmax || 1, k = scala(), cx = W / 2, cy = H / 2;
  const gruppi = Array.from({ length: COLORI * 4 }, () => []);
  for (let q = 0; q < s.length; q += 6) {
    const e = s[q + 5] / vmax, c = Math.min(COLORI - 1, Math.floor(e * e * COLORI)), l = Math.min(3, Math.floor(s[q + 4] * 4));
    gruppi[c * 4 + l].push(q);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1.0 * dpr; ctx.lineCap = 'round';
  let tinto = 0;
  for (let g = 0; g < gruppi.length; g++) {
    const lista = gruppi[g]; if (!lista.length) continue;
    const alfa = 0.05 + 0.2 * ((g % 4) + 0.5) / 4;
    ctx.strokeStyle = tinta(Math.floor(g / 4)); ctx.globalAlpha = alfa;
    ctx.beginPath(); let lung = 0;
    for (const q of lista) { ctx.moveTo(cx + s[q] * k, cy - s[q + 1] * k); ctx.lineTo(cx + s[q + 2] * k, cy - s[q + 3] * k); lung += Math.hypot(s[q + 2] - s[q], s[q + 3] - s[q + 1]); }
    ctx.stroke(); tinto += lung * k * alfa;
  }
  inchiostro += (tinto * ctx.lineWidth) / (W * H);
  ctx.globalAlpha = 1;
}

// la pallina, dov'è adesso (solo nella vista del viaggio, o se è nel volume visibile)
function sorgente() { return vista === 'tessera' ? S.tessera : S.tratti; }

function nuovoProiettore() {
  fin = creaFinestra({ ...p.finestra, aspetto: H / W });
  P = creaProiettore(fin, S.cristallo, vista === 'tessera');
  inchiostro = 0; pulisci(); disegnaAtomi();
}

function informa(forza = false) {
  if (!S) return;
  if (!forza && (giro++ % 8)) return;
  const d = descriviDirezione(p.finestra.n, S.cristallo, S.d);
  self.postMessage({ tipo: 'stato', frase: S.frase(), finestra: d.frase, info: {
    nome: NOMI_TECNICI[S.cristallo.nome] ?? S.cristallo.nome, dt: S.dt, passi: S.passi, passiTotali: S.passiTotali, tratti: P?.emessi ?? 0,
    copie: P?.copie.length ?? 0, zona: S.zona, inchiostro, finito: S.finito, primoMs: primoMostrato ? primo : null, vmax: S.scelta.vmax, immagini: S.cristallo.immagini,
  } });
}

function tic() {
  if (!S || !ctx) return;
  const t0 = performance.now(), src = sorgente();
  // prima si riproietta ciò che c'è già (dopo un cambio di sguardo), poi si fa crescere la linea
  while (performance.now() - t0 < 12) {
    if (P.fatti < src.n && !P.pieno) {
      disegna(P.proietta(src.s, src.vel, P.fatti, Math.min(src.n, P.fatti + 3000)));
    } else if (!S.finito && inchiostro < PIENO) {
      S.avanza(Math.max(S.ogni, 400));
      const s2 = sorgente(); disegna(P.proietta(s2.s, s2.vel, P.fatti, s2.n));
    } else break;
  }
  if (!primoMostrato && P.emessi > 0) { primoMostrato = true; primo = performance.now() - primo; informa(true); }
  informa();
}
setInterval(tic, 16);

self.onmessage = (e) => {
  const m = e.data;
  if (m.tipo === 'tela') { tela = m.tela; ctx = tela.getContext('2d'); W = tela.width = m.w; H = tela.height = m.h; dpr = m.dpr; pulisci(); }
  else if (m.tipo === 'misura') { if (tela) { W = tela.width = m.w; H = tela.height = m.h; dpr = m.dpr ?? dpr; if (S) nuovoProiettore(); } }
  else if (m.tipo === 'pattern') {
    primo = performance.now(); primoMostrato = false;
    p = m.p; vista = m.vista ?? p.vista ?? 'tessera';
    S = creaSessione(p);
    nuovoProiettore(); informa(true);
  } else if (m.tipo === 'finestra') {
    if (!S) return;
    p = { ...p, finestra: m.finestra }; vista = m.vista ?? vista;
    nuovoProiettore(); informa(true);
  }
};
