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
import { combina, creaCristallo, vincola } from '../reticolo.js';
import { tesseraDelleOrbite, controcampo } from '../linee.js';
import { catalogo, scriviOrbita, punti } from '../orbite.js';
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
// LE LINEE CHIUSE: le orbite periodiche scelte, disegnate una volta a spessore costante; il controcampo (campo) a scacchi
let linee = null, campo = false, lineeFatte = false;

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
  P = creaProiettore(fin, S.cristallo, linee ? true : vista === 'tessera');
  lineeFatte = false;
  inchiostro = 0; fatti = So ? So.sessioni.map(() => 0) : []; pulisci(); disegnaScheletro(); if (!(linee && campo)) disegnaAtomi();
}

function informa(forza = false) {
  if (!S) return;
  if (!forza && (giro++ % 8)) return;
  const d = descriviDirezione(p.finestra.n, S.cristallo, S.d);
  const frase = linee ? `linee chiuse: ${linee.orbite.length === 1 ? 'un\'orbita' : `${linee.orbite.length} orbite`} che tornano su sé stesse` : S.frase();
  self.postMessage({ tipo: 'stato', frase, finestra: d.frase, info: {
    nome: NOMI_TECNICI[S.cristallo.nome] ?? S.cristallo.nome, dt: S.dt, passi: S.passi, passiTotali: S.passiTotali, tratti: P?.emessi ?? 0,
    copie: P?.copie.length ?? 0, zona: S.zona, inchiostro, finito: S.finito, primoMs: primoMostrato ? primo : null, palline: So?.sessioni.length ?? 1, ordine: So?.ordine ?? null, specchi: So?.specchi ?? null, elementi: So?.elementi ?? null, vmax: S.scelta.vmax, immagini: S.cristallo.immagini,
  } });
}

// le linee chiuse: tutte insieme, una volta; col controcampo, le regioni tra le linee in due toni (pari e dispari)
const TINTE = ['#ffe9b0', '#9fe3ff', '#ffb0d0', '#b8ffb0', '#d0b8ff', '#ffd0a0'];
function disegnaLinee() {
  const t = linee.tessera, s = P.proietta(t.s, t.vel, 0, t.n), k = scala(), cx = W / 2, cy = H / 2;
  if (campo) {
    const w2 = Math.round(W / 2), h2 = Math.round(H / 2), oc = new OffscreenCanvas(w2, h2), o = oc.getContext('2d');
    o.fillStyle = '#000'; o.fillRect(0, 0, w2, h2); o.strokeStyle = '#fff'; o.lineWidth = 2; o.beginPath();
    for (let q = 0; q < s.length; q += 6) { o.moveTo((cx + s[q] * k) / 2, (cy - s[q + 1] * k) / 2); o.lineTo((cx + s[q + 2] * k) / 2, (cy - s[q + 3] * k) / 2); }
    o.stroke();
    const dati = o.getImageData(0, 0, w2, h2), m = new Uint8Array(w2 * h2);
    for (let i = 0; i < w2 * h2; i++) m[i] = dati.data[4 * i] > 60 ? 1 : 0;
    const cc = controcampo(m, w2, h2);
    for (let i = 0; i < w2 * h2; i++) { const [r, g, b] = cc[i] === 2 ? [196, 160, 98] : [14, 20, 38]; dati.data[4 * i] = r; dati.data[4 * i + 1] = g; dati.data[4 * i + 2] = b; dati.data[4 * i + 3] = 255; }
    o.putImageData(dati, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = true; ctx.drawImage(oc, 0, 0, W, H);
    if (scheletro) disegnaScheletro();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineWidth = 2.2 * dpr; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const per = new Map(); for (let q = 0; q < s.length; q += 6) { const i = s[q + 5] % TINTE.length; if (!per.has(i)) per.set(i, []); per.get(i).push(q); }
  for (const [i, lista] of per) {
    ctx.strokeStyle = campo ? '#f6ecd2' : TINTE[i]; ctx.shadowColor = campo ? 'transparent' : TINTE[i]; ctx.shadowBlur = campo ? 0 : 6 * dpr;
    ctx.beginPath(); for (const q of lista) { ctx.moveTo(cx + s[q] * k, cy - s[q + 1] * k); ctx.lineTo(cx + s[q + 2] * k, cy - s[q + 3] * k); } ctx.stroke();
  }
  ctx.shadowBlur = 0; lineeFatte = true; P.emessi = s.length / 6;
}

function tic() {
  if (linee && ctx && P) { if (!lineeFatte) { disegnaLinee(); if (!primoMostrato) { primoMostrato = true; primo = performance.now() - primo; } informa(true); } return; }
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
  else if (m.tipo === 'catalogo') {
    // il catalogo delle orbite periodiche di questo cristallo (piano) a questa energia
    const q = m.p, cr = creaCristallo({ ...vincola(q.reticolo), atomi: q.atomi, w: q.w, U0: q.U0 });
    const E = 0.5 * (q.v0[0] ** 2 + q.v0[1] ** 2) + cr.campo(q.r0[0], q.r0[1], 0, null);
    const L = catalogo(cr, E, [0, 0, 0], { semi: 60, max: 12, tempoMax: 2500, radice: `catalogo/${E}` });
    self.postMessage({ tipo: 'catalogo', E, orbite: L.map((o) => { const P = punti(cr, o, [0, 0, 0]).P, passo = Math.max(1, Math.floor(P.length / 150)); return { testo: scriviOrbita(o), m: o.m, stabile: o.stabile, T: o.T, punti: P.filter((_, i) => i % passo === 0 || i === P.length - 1), A: cr.A }; }) });
  }
  else if (m.tipo === 'pattern') {
    primo = performance.now(); primoMostrato = false;
    p = m.p; vista = m.vista ?? p.vista ?? 'tessera';
    scheletro = !!m.scheletro; campo = !!m.campo;
    linee = p.orbite?.length ? tesseraDelleOrbite(p) : null;
    So = creaSorgente(linee ? { ...p, sorgente: 0, tempo: 0.01 } : p); S = So.sessioni[0];
    nuovoProiettore(); informa(true);
  } else if (m.tipo === 'finestra') {
    if (!S) return;
    p = { ...p, finestra: m.finestra }; vista = m.vista ?? vista; scheletro = !!m.scheletro; campo = !!m.campo;
    nuovoProiettore(); informa(true);
  }
};
