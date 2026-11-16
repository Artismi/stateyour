// lavoratore.js — il Web Worker: calcola il pattern e lo disegna su una tela fuori schermo (OffscreenCanvas).
// L'interfaccia non si blocca mai: qui si sceglie il passo, si fa correre la pallina, si ripiega la tessera, si
// proiettano le copie nella finestra e si disegnano le linee man mano che crescono.
//
// Messaggi dall'interfaccia: { tipo: 'tela', tela, w, h, dpr } · { tipo: 'pattern', p } (cambia la fisica: si riparte)
// · { tipo: 'finestra', finestra, vista } (cambia solo lo sguardo: si riproietta ciò che c'è) · { tipo: 'misura', w, h }.
// Messaggi verso l'interfaccia: { tipo: 'stato', frase, finestra, info }.

import { creaSorgente } from '../motore.js';
import { creaFinestra, creaProiettore, copieVisibili, taglia } from '../finestra.js';
import { descriviDirezione, reticoloDelPiano } from '../indici.js';
import { combina } from '../reticolo.js';
import { NOMI_TECNICI } from '../reticolo.js';

let tela = null, ctx = null, W = 0, H = 0, dpr = 1;
let S = null, p = null, fin = null, P = null, vista = 'tessera', primo = 0, primoMostrato = false, giro = 0;
// L'INCHIOSTRO: la somma di lunghezza × opacità delle linee disegnate, per lo spessore, divisa per l'area della tela.
// Quando arriva a PIENO (le linee, pesate con la loro opacità, coprirebbero l'immagine 0,8 volte) la linea smette di
// crescere: oltre, il disegno diventa una nebbia uniforme e non si vede più il motivo.
const PIENO = 0.8;
let inchiostro = 0;
// la sorgente: una o più palline (sessioni), ognuna col suo segno di quanto è già proiettato; lo scheletro acceso o no
let So = null, fatti = [], scheletro = false;

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
const sorgenteDi = (X) => (vista === 'tessera' ? X.tessera : X.tratti);

// LO SCHELETRO 🦴: la griglia del reticolo nella stessa vista, in trasparenza sotto il motivo. In prospettiva sono gli
// spigoli delle celle visibili (tagliati esattamente sul volume visibile), che convergono da soli ai punti di fuga;
// nel limite parallelo, se la finestra è lungo un piano (hkl), la griglia di quel piano (i vettori t₁, t₂).
function disegnaScheletro() {
  if (!scheletro || !S || !fin) return;
  const cr = S.cristallo, k = scala();
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(190,210,255,1)'; ctx.lineWidth = 1 * dpr;
  const d = descriviDirezione(p.finestra.n, cr, S.d);
  if (fin.parallela && d.esatta) {
    const { t1, t2 } = reticoloDelPiano(d.hkl, cr), a = [t1, t2].map((t) => [t[0] * fin.e1[0] + t[1] * fin.e1[1] + t[2] * fin.e1[2], t[0] * fin.e2[0] + t[1] * fin.e2[1] + t[2] * fin.e2[2]]);
    const o = fin.aFinestra([0, 0, 0]), M = Math.ceil(fin.L / Math.min(Math.hypot(...a[0]), Math.hypot(...a[1])) * 1.5) + 2;
    ctx.globalAlpha = 0.35; ctx.beginPath();
    for (const [u, v] of [[a[0], a[1]], [a[1], a[0]]]) for (let j = -M; j <= M; j++) {
      const x0 = o[0] + j * v[0] - M * u[0], y0 = o[1] + j * v[1] - M * u[1], x1 = o[0] + j * v[0] + M * u[0], y1 = o[1] + j * v[1] + M * u[1];
      const [p0, p1] = [aTela(x0, y0), aTela(x1, y1)]; ctx.moveTo(...p0); ctx.lineTo(...p1);
    }
    ctx.stroke(); ctx.globalAlpha = 1; return;
  }
  const copie = copieVisibili(fin, cr, 1500).filter((c) => c.cella.every((x) => Number.isInteger(x)));
  const gruppi = [[], [], [], []];
  for (const c of copie) for (const ax of [0, 1, 2]) {
    if (cr.piano && ax === 2) continue;
    const a = fin.aFinestra(c.T), b = fin.aFinestra(c.T.map((x, i) => x + cr.A[ax][i])), t = taglia(fin.piani, ...a, ...b);
    if (!t) continue;
    const P0 = a.map((x, i) => x + t[0] * (b[i] - x)), P1 = a.map((x, i) => x + t[1] * (b[i] - x)), A0 = fin.proietta(...P0), A1 = fin.proietta(...P1);
    gruppi[Math.min(3, Math.floor(((A0[2] + A1[2]) / 2) * 4))].push([aTela(A0[0], A0[1]), aTela(A1[0], A1[1])]);
  }
  gruppi.forEach((g, i) => { ctx.globalAlpha = 0.1 + 0.1 * i; ctx.beginPath(); for (const [u, v] of g) { ctx.moveTo(...u); ctx.lineTo(...v); } ctx.stroke(); });
  ctx.globalAlpha = 1;
}

function nuovoProiettore() {
  fin = creaFinestra({ ...p.finestra, aspetto: H / W });
  P = creaProiettore(fin, S.cristallo, vista === 'tessera');
  inchiostro = 0; fatti = So ? So.sessioni.map(() => 0) : []; pulisci(); disegnaScheletro(); disegnaAtomi();
}

function informa(forza = false) {
  if (!S) return;
  if (!forza && (giro++ % 8)) return;
  const d = descriviDirezione(p.finestra.n, S.cristallo, S.d);
  self.postMessage({ tipo: 'stato', frase: S.frase(), finestra: d.frase, info: {
    nome: NOMI_TECNICI[S.cristallo.nome] ?? S.cristallo.nome, dt: S.dt, passi: S.passi, passiTotali: S.passiTotali, tratti: P?.emessi ?? 0,
    copie: P?.copie.length ?? 0, zona: S.zona, inchiostro, finito: S.finito, primoMs: primoMostrato ? primo : null, palline: So?.sessioni.length ?? 1, ordine: So?.ordine ?? null, specchi: So?.specchi ?? null, elementi: So?.elementi ?? null, vmax: S.scelta.vmax, immagini: S.cristallo.immagini,
  } });
}

function tic() {
  if (!S || !ctx) return;
  const t0 = performance.now(), ss = So.sessioni;
  // prima si riproietta ciò che c'è già (dopo un cambio di sguardo), poi crescono le linee di tutte le palline
  while (performance.now() - t0 < 12 && !P.pieno) {
    let lavoro = false;
    for (let i = 0; i < ss.length; i++) {
      const src = sorgenteDi(ss[i]);
      if (fatti[i] < src.n) { const a = Math.min(src.n, fatti[i] + 3000); disegna(P.proietta(src.s, src.vel, fatti[i], a)); fatti[i] = a; lavoro = true; }
    }
    if (lavoro) continue;
    if (inchiostro >= PIENO || ss.every((x) => x.finito)) break;
    for (const x of ss) if (!x.finito) x.avanza(Math.max(x.ogni, Math.ceil(400 / ss.length)));
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
    So = creaSorgente(p); S = So.sessioni[0]; scheletro = !!m.scheletro;
    nuovoProiettore(); informa(true);
  } else if (m.tipo === 'finestra') {
    if (!S) return;
    p = { ...p, finestra: m.finestra }; vista = m.vista ?? vista; scheletro = !!m.scheletro;
    nuovoProiettore(); informa(true);
  }
};
