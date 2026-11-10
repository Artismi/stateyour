// laboratorio.js — la camera come software di simulazione.
//
// Tre livelli, sempre collegati:
//   IL PATTERN    la piastrella si ripete all'infinito; ogni motivo è un
//                 elemento (un evento fisico). Passi sopra: si accendono tutte
//                 le sue copie. Clic: entri nell'elemento.
//   L'ELEMENTO    un evento solo, con le cose fisiche che lo producono sulla
//                 scena (sorgenti, campi, materia, masse, specchi, vetri) e le
//                 cinque forze visibili: ognuna col suo colore, accendibile;
//                 passando sopra una linea si vedono le forze che agiscono lì.
//   SPAZIOTEMPO   l'elemento con il tempo che sale: le linee d'universo.
// Tutto quello che cambi nell'elemento cambia subito in tutte le sue copie.

import { simulaMondo, dentro, raggio, gittata, forze } from './mondo.js';
import { COMPOSIZIONI, ELEMENTI, nuovoElemento, clona, storia, fmt, trasformaPosto, daSchema } from './esperimento.js';
import { creaVista3D } from '../vista3d.js';

const $ = (id) => document.getElementById(id);
const tela = $('tela'), ctx = tela.getContext('2d'), tela3d = $('tela3d'), pannello = $('pannello');
const INK = '#1c1b18', GRIGIO = '#8a867c', ACCENTO = '#d0532f', CARTA = '#f3efe6';

// ---------- le cinque forze: un colore, un simbolo, una frase
export const FORZE = {
  gravita: { nome: 'gravità', col: [214, 84, 52], simbolo: '●', frase: 'le masse ferme curvano lo spazio: chi passa cade verso di loro, uguale se leggero o pesante; la luce si piega il doppio. Nessuno sposta le masse.' },
  magnetico: { nome: 'magnetismo', col: [52, 104, 214], simbolo: '⊙', frase: 'dove c\'è campo B le cariche girano: + da una parte, − dall\'altra. Raggio m·v/(q·B): più campo, curve più strette; più massa o velocità, più larghe.' },
  materia: { nome: 'materia', col: [150, 104, 50], simbolo: '▒', frase: 'la materia frena le cariche, e più sono lente più frenano: la curva si stringe in spirale e finisce in una macchia tonda (l\'occhio).' },
  luce: { nome: 'luce, specchi, vetri', col: [196, 142, 0], simbolo: '◇', frase: 'la luce va dritta a velocità c/n; si rifrange entrando in un vetro, rimbalza sugli specchi. Gli specchi riflettono anche le particelle.' },
  decadimento: { nome: 'decadimento', col: [36, 140, 76], simbolo: '✳', frase: 'dopo la sua vita una particella si divide nelle sue figlie: è il punto da cui partono i petali, le forcelle, i ventagli.' },
};
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const PARTI = { gravita: 'gravita', magnetico: 'magnetico', materia: 'materia', luce: 'luce', specchio: 'luce', rifrazione: 'luce' };
const haForza = (legge, f) => String(legge || '').split('+').some((p) => PARTI[p] === f);
// il colore di ogni punto di una linea: le forze che agiscono lì, pesate per
// quanto sono forti. Una spirale passa dal blu (il campo la piega) al marrone
// (la materia la frena) man mano che rallenta.
function coloriTraccia(cella, tr) {
  const P = tr.punti, out = new Array(P.length), luce = !!tr.specie.luce;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dt = b[3] - a[3];
    if (/specchio|rifrazione/.test(P[i][5])) { out[i] = FORZE.luce.col; continue; }
    if (!(dt > 0)) { out[i] = out[i - 1] || (luce ? FORZE.luce.col : [28, 27, 24]); continue; }
    const F = forze(cella, tr.specie, P[i][0], P[i][1], (b[0] - a[0]) / dt, (b[1] - a[1]) / dt);
    const pesi = { gravita: F.gravita ? Math.hypot(...F.gravita) : 0, magnetico: F.magnetico ? Math.hypot(...F.magnetico) : 0, materia: F.materia ? Math.hypot(...F.materia) : 0 };
    // la luce e chi va dritto: il colore della luce o l'inchiostro, ma la gravità si vede quando piega davvero
    const curva = (pesi.gravita + pesi.magnetico) / ((F.v * F.v) || 1), soglia = 1 / (4 * Math.max(cella.larghezza, cella.altezza));
    if (luce) pesi.luce = soglia * F.v * F.v;
    const tot = pesi.gravita + pesi.magnetico + pesi.materia + (pesi.luce || 0);
    if (!tot || (!luce && curva < soglia * 0.25 && pesi.materia < soglia * F.v * F.v * 0.25)) { out[i] = luce ? FORZE.luce.col : [28, 27, 24]; continue; }
    const c = [0, 0, 0];
    for (const [k, w] of Object.entries(pesi)) if (w) for (let j = 0; j < 3; j++) c[j] += (FORZE[k].col[j] * w) / tot;
    out[i] = c.map(Math.round);
  }
  return out;
}

// ---------- lo stato
let comp = COMPOSIZIONI['fiori e riempitivi']();
let vista = 'pattern', corrente = 0, scelto = null, sopra = null; // scelto/sopra: { e, p } nel pattern
let tracce = [], prima = null, sel = null, strumento = 'seleziona';
let tempo = Infinity, fetta = 0, gioca = false, evidenzia = null, sonda = null;
const strati = { gravita: true, magnetico: true, materia: true, luce: true, decadimento: true };
let coloriForze = true, fuoco = null, immagine = null, mostraOriginale = true;
const pat = { cx: 125, cy: 125, z: 1 };
const indietro = [], avanti = [];
const el = () => comp.elementi[corrente];
const cel = () => el().cella;

// ---------- simulazione, con la memoria per elemento
const memoria = new Map();
function tracceDi(e) {
  const k = JSON.stringify(e.cella);
  let m = memoria.get(k);
  if (!m) {
    let t = []; try { t = simulaMondo(e.cella); } catch (err) { console.error(err); }
    const cx = e.cella.larghezza / 2, cy = e.cella.altezza / 2; let r = 4;
    for (const tr of t) for (const p of tr.punti) if (p[2]) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy));
    m = { tracce: t, raggio: r, sprite: new Map() };
    memoria.set(k, m);
    if (memoria.size > 60) memoria.delete(memoria.keys().next().value);
  }
  return m;
}
function simula() {
  if (vista === 'pattern') { $('misure').textContent = `${comp.elementi.length} elementi · ${comp.elementi.reduce((n, e) => n + e.posti.length, 0)} posti per piastrella`; return; }
  const t0 = performance.now();
  try { tracce = simulaMondo(cel()); $('errore').textContent = ''; } catch (e) { tracce = []; $('errore').textContent = e.message; }
  const ms = performance.now() - t0, punti = tracce.reduce((n, t) => n + t.punti.length, 0);
  $('misure').textContent = `${el().nome}: ${tracce.length} linee · ${punti} punti · ${ms.toFixed(0)} ms`;
  if (vista === 'spaziotempo') imposta3D();
}
const tMax = () => { let m = 0; for (const t of tracce) m = Math.max(m, t.punti[t.punti.length - 1][3]); return m || cel().tempo || 1; };
function ricorda() { indietro.push(JSON.stringify({ comp, corrente })); if (indietro.length > 200) indietro.shift(); avanti.length = 0; }
function aggiorna({ pannello: p = true } = {}) { simula(); aggiornaTempo(); disegna(); if (p) mostraPannello(); }

// ---------- disegno: smistamento
function disegna() {
  if (vista === 'spaziotempo') { v3.tempo(Math.min(tempo, v3.tMax())); return; }
  const dpr = devicePixelRatio || 1;
  tela.width = tela.clientWidth * dpr; tela.height = tela.clientHeight * dpr;
  if (vista === 'pattern') disegnaPattern(); else disegnaElemento();
}

// =================================================================== IL PATTERN
function spriteDi(e, s) {
  // l'elemento disegnato una volta in un'immagine, alla scala dello schermo
  const m = tracceDi(e), q = Math.pow(2, Math.round(Math.log2(s) * 2) / 2), chiave = `${q}|${coloriForze}`;
  let sp = m.sprite.get(chiave);
  if (sp) return sp;
  const W = e.cella.larghezza, H = e.cella.altezza, k = Math.min(q, 3000 / Math.max(W, H));
  sp = document.createElement('canvas'); sp.width = Math.max(1, Math.ceil(W * k)); sp.height = Math.max(1, Math.ceil(H * k));
  const c = sp.getContext('2d'); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const tr of m.tracce) {
    const P = tr.punti;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i]; if (!a[2] || !b[2]) continue;
      c.strokeStyle = coloriForze ? rgb((tr.colori ??= coloriTraccia(e.cella, tr))[i]) : INK; c.lineWidth = Math.max(0.6 / k, (a[4] + b[4]) / 2);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  }
  m.sprite.set(chiave, sp); if (m.sprite.size > 8) m.sprite.delete(m.sprite.keys().next().value);
  return sp;
}
function piastrelleVisibili(margine) {
  const W = tela.width, H = tela.height, z = pat.z * (devicePixelRatio || 1), { a, b } = comp.reticolo, det = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(det) < 1e-6) return [];
  const angoli = [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => [pat.cx + (x - W / 2) / z, pat.cy + (y - H / 2) / z]);
  const uv = angoli.map(([x, y]) => [(b[1] * x - b[0] * y) / det, (-a[1] * x + a[0] * y) / det]);
  const pu = margine / Math.hypot(...a) + 1, pv = margine / Math.hypot(...b) + 1;
  const u0 = Math.floor(Math.min(...uv.map((p) => p[0])) - pu), u1 = Math.ceil(Math.max(...uv.map((p) => p[0])) + pu);
  const v0 = Math.floor(Math.min(...uv.map((p) => p[1])) - pv), v1 = Math.ceil(Math.max(...uv.map((p) => p[1])) + pv);
  if ((u1 - u0 + 1) * (v1 - v0 + 1) > 4000) return null;
  const out = []; for (let j = v0; j <= v1; j++) for (let i = u0; i <= u1; i++) out.push([i, j, i * a[0] + j * b[0], i * a[1] + j * b[1]]);
  return out;
}
function disegnaPattern() {
  const W = tela.width, H = tela.height, dpr = devicePixelRatio || 1, z = pat.z * dpr, { a, b } = comp.reticolo;
  const X = (x) => W / 2 + (x - pat.cx) * z, Y = (y) => H / 2 + (y - pat.cy) * z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = CARTA; ctx.fillRect(0, 0, W, H);
  if (immagine && mostraOriginale) { ctx.globalAlpha = 0.3; ctx.drawImage(immagine.img, X(0), Y(0), immagine.W * z, immagine.H * z); ctx.globalAlpha = 1; }
  const margine = Math.max(...comp.elementi.map((e) => Math.hypot(e.cella.larghezza, e.cella.altezza) / 2), 10);
  const tiles = piastrelleVisibili(margine);
  if (!tiles) { scrivi('troppo lontano: avvicinati con la rotella', 14 * dpr, 24 * dpr, ACCENTO); return; }
  // la griglia del reticolo
  ctx.strokeStyle = 'rgba(28,27,24,0.07)'; ctx.lineWidth = 1;
  for (const [, , ox, oy] of tiles) { ctx.beginPath(); ctx.moveTo(X(ox), Y(oy)); ctx.lineTo(X(ox + a[0]), Y(oy + a[1])); ctx.moveTo(X(ox), Y(oy)); ctx.lineTo(X(ox + b[0]), Y(oy + b[1])); ctx.stroke(); }
  // gli elementi
  comp.elementi.forEach((e, ei) => {
    const sp = spriteDi(e, z), acceso = (sopra && sopra.e === ei) || (scelto && scelto.e === ei);
    for (const posto of e.posti) for (const [, , ox, oy] of tiles) {
      const M = trasformaPosto(e.cella, posto, [ox, oy]);
      ctx.setTransform(z * M[0], z * M[1], z * M[2], z * M[3], X(M[4]), Y(M[5]));
      ctx.globalAlpha = sopra && !acceso ? 0.45 : 1;
      ctx.drawImage(sp, 0, 0, e.cella.larghezza, e.cella.altezza);
    }
    ctx.globalAlpha = 1;
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // le copie dell'elemento sotto il cursore: tutte accese
  const evid = sopra || scelto;
  if (evid && comp.elementi[evid.e]) {
    const e = comp.elementi[evid.e], r = tracceDi(e).raggio * z;
    e.posti.forEach((posto, pi) => {
      for (const [, , ox, oy] of tiles) {
        const x = X(posto.pos[0] + ox), y = Y(posto.pos[1] + oy);
        ctx.strokeStyle = pi === evid.p ? ACCENTO : rgb([208, 83, 47], 0.45); ctx.lineWidth = (pi === evid.p ? 2 : 1) * dpr;
        ctx.beginPath(); ctx.arc(x, y, r + 4 * dpr, 0, 7); ctx.stroke();
      }
    });
    const posto = e.posti[evid.p];
    if (posto && sopra) { ctx.fillStyle = ACCENTO; ctx.font = `${12 * dpr}px ui-monospace, monospace`; ctx.fillText(`${e.nome} — clic per entrare`, X(posto.pos[0]) + r + 8 * dpr, Y(posto.pos[1])); }
  }
  // la piastrella d'origine e le sue maniglie
  ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.strokeStyle = 'rgba(28,27,24,0.55)'; ctx.lineWidth = dpr;
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(a[0]), Y(a[1])); ctx.lineTo(X(a[0] + b[0]), Y(a[1] + b[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  for (const [v, n] of [[a, 'a'], [b, 'b']]) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(X(v[0]), Y(v[1]), 6 * dpr, 0, 7); ctx.fill(); ctx.stroke();
    scrivi(n, X(v[0]) + 9 * dpr, Y(v[1]) - 6 * dpr, INK);
  }
  scrivi('la piastrella tratteggiata si ripete all\'infinito · trascina il fondo per muoverti, rotella per lo zoom', 12 * dpr, H - 12 * dpr);
}
const aPattern = (e) => { const r = tela.getBoundingClientRect(); return [pat.cx + (e.clientX - r.left - r.width / 2) / pat.z, pat.cy + (e.clientY - r.top - r.height / 2) / pat.z]; };
function colpisciPattern(x, y) {
  const { a, b } = comp.reticolo, det = a[0] * b[1] - a[1] * b[0]; let best = null;
  comp.elementi.forEach((e, ei) => {
    const R = tracceDi(e).raggio;
    e.posti.forEach((posto, pi) => {
      const dx = x - posto.pos[0], dy = y - posto.pos[1], u = Math.round((b[1] * dx - b[0] * dy) / det), v = Math.round((-a[1] * dx + a[0] * dy) / det);
      for (let i = u - 1; i <= u + 1; i++) for (let j = v - 1; j <= v + 1; j++) {
        const d = Math.hypot(dx - i * a[0] - j * b[0], dy - i * a[1] - j * b[1]) / R;
        if (d < 1.05 && (!best || d < best.d)) best = { e: ei, p: pi, d };
      }
    });
  });
  return best;
}
function maniglia(x, y) {
  const { a, b } = comp.reticolo, r = 9 / pat.z;
  if (Math.hypot(x - a[0], y - a[1]) < r) return 'a';
  if (Math.hypot(x - b[0], y - b[1]) < r) return 'b';
  return null;
}
function entra(e) { corrente = e; vista = 'dettaglio'; sel = null; sonda = null; tempo = Infinity; aggiornaVista(); }
function adattaPattern() {
  const { a, b } = comp.reticolo, L = Math.max(Math.hypot(...a), Math.hypot(...b), 1);
  if (immagine) { pat.cx = immagine.W / 2; pat.cy = immagine.H / 2; pat.z = Math.min(tela.clientWidth / immagine.W, tela.clientHeight / immagine.H) * 0.9; return; }
  pat.cx = (a[0] + b[0]) / 2; pat.cy = (a[1] + b[1]) / 2; pat.z = Math.min(tela.clientWidth, tela.clientHeight) / (3.2 * L);
}

// =================================================================== L'ELEMENTO
let vt = { s: 1, ox: 0, oy: 0, dpr: 1 };
function adattaElemento() {
  const dpr = devicePixelRatio || 1, W = tela.width, H = tela.height, c = cel();
  const s = Math.min((W * 0.92) / c.larghezza, (H * 0.86) / c.altezza);
  vt = { s, ox: (W - c.larghezza * s) / 2, oy: (H - c.altezza * s) / 2 + 14 * dpr, dpr };
}
const aMondo = (e) => { const r = tela.getBoundingClientRect(); return [((e.clientX - r.left) * vt.dpr - vt.ox) / vt.s, ((e.clientY - r.top) * vt.dpr - vt.oy) / vt.s]; };
const px = (n) => (n * vt.dpr) / vt.s;
function scrivi(testo, x, y, colore = GRIGIO, dim = 12) { ctx.fillStyle = colore; ctx.font = `${dim * (devicePixelRatio || 1)}px ui-monospace, monospace`; ctx.fillText(testo, x, y); }
function scriviMondo(testo, x, y, colore, dim = 11) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const [sx, sy] = [vt.ox + x * vt.s, vt.oy + y * vt.s]; ctx.font = `${dim * vt.dpr}px ui-monospace, monospace`; const w = ctx.measureText(testo).width; ctx.fillStyle = 'rgba(243,239,230,0.85)'; ctx.fillRect(sx - 3 * vt.dpr, sy - dim * vt.dpr, w + 6 * vt.dpr, (dim + 5) * vt.dpr); ctx.fillStyle = colore; ctx.fillText(testo, sx, sy); ctx.restore(); }

function disegnaElemento() {
  adattaElemento();
  const W = tela.width, H = tela.height, c = cel(), T = Math.min(tempo, tMax());
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#e4dfd3'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(vt.s, 0, 0, vt.s, vt.ox, vt.oy);
  ctx.fillStyle = CARTA; ctx.fillRect(0, 0, c.larghezza, c.altezza);
  disegnaCampi();
  if (strati.gravita) campoGravita();
  for (let i = 0; i < c.masse.length; i++) disegnaMassa(c.masse[i], sel?.tipo === 'massa' && sel.i === i);
  c.pareti.forEach((p, i) => disegnaParete(p, sel?.tipo === 'parete' && sel.i === i));
  if (prima) disegnaTracce(prima, Infinity, true);
  disegnaTracce(tracce, T, false);
  if (strati.decadimento) for (const dk of tracce.decadimenti || []) if (dk.t <= T) disegnaDecadimento(dk);
  if (T < tMax()) disegnaTeste(T);
  c.sorgenti.forEach((so, i) => disegnaSorgente(so, sel?.tipo === 'sorgente' && sel.i === i));
  if (sel?.tipo === 'dominio') maniglieDominio(c.domini[sel.i]);
  if (sonda) disegnaSonda();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  scrivi(`${el().nome} · una cella dello spaziotempo · passa sopra una linea per vedere le forze`, 12 * vt.dpr, H - 12 * vt.dpr);
}
function evidente(tr) {
  if (sel?.tipo === 'traccia') return tr.id === sel.i;
  if (evidenzia) return tr.specie.nome === evidenzia;
  if (sel?.tipo === 'specie') return tr.specie.nome === sel.nome;
  if (sel?.tipo === 'sorgente') return tr.sorgente === sel.i;
  return false;
}
function disegnaTracce(lista, T, fantasma) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const qualcosa = !fantasma && lista.some(evidente), t0 = fetta > 0 ? T - fetta : -Infinity;
  for (const tr of lista) {
    const P = tr.punti, ev = !fantasma && evidente(tr);
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (a[3] > T) break;
      if (!a[2] || !b[2] || b[3] < t0) continue;
      let bx = b[0], by = b[1];
      if (b[3] > T) { const u = (T - a[3]) / (b[3] - a[3] || 1); bx = a[0] + (b[0] - a[0]) * u; by = a[1] + (b[1] - a[1]) * u; }
      let colore;
      if (fantasma) colore = 'rgba(120,115,105,0.32)';
      else if (ev) colore = ACCENTO;
      else if (fuoco) colore = haForza(b[5], fuoco) ? rgb(FORZE[fuoco].col) : 'rgba(28,27,24,0.18)';
      else colore = rgb(coloriForze ? (tr.colori ??= coloriTraccia(cel(), tr))[i] : [28, 27, 24], qualcosa ? 0.35 : 1);
      ctx.strokeStyle = colore; ctx.lineWidth = Math.max(px(0.7), (a[4] + b[4]) / 2);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bx, by); ctx.stroke();
    }
  }
}
function freccia(x, y, dx, dy, colore, larghezza = 2) {
  const L = Math.hypot(dx, dy); if (L < px(2)) return;
  const tx = x + dx, ty = y + dy, h = Math.min(px(8), L * 0.5), an = Math.atan2(dy, dx);
  ctx.strokeStyle = colore; ctx.fillStyle = colore; ctx.lineWidth = px(larghezza); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx - Math.cos(an) * h * 0.6, ty - Math.sin(an) * h * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - h * Math.cos(an - 0.42), ty - h * Math.sin(an - 0.42)); ctx.lineTo(tx - h * Math.cos(an + 0.42), ty - h * Math.sin(an + 0.42)); ctx.closePath(); ctx.fill();
}
// le frecce delle forze su una particella: lunghezza come la radice dell'intensità
function frecceForze(tr, x, y, vx, vy, etichette) {
  const F = forze(cel(), tr.specie, x, y, vx, vy), v = F.v, c = cel();
  const aRif = (v * v) / (0.12 * Math.max(c.larghezza, c.altezza)) || 1;
  const lun = (a) => Math.min(px(70), px(34) * Math.sqrt(Math.hypot(...a) / aRif));
  const lv = Math.min(px(60), px(14) + px(4) * v);
  freccia(x, y, (vx / v) * lv, (vy / v) * lv, INK, 1.4);
  const righe = [`${tr.specie.nome || 'particella'} · velocità ${fmt(v)} (freccia nera)`];
  for (const f of ['gravita', 'magnetico', 'materia']) {
    if (!F[f] || !strati[f]) continue;
    const a = F[f], m = Math.hypot(...a), L = lun(a);
    freccia(x, y, (a[0] / m) * L, (a[1] / m) * L, rgb(FORZE[f].col), 2.4);
    if (f === 'magnetico') righe.push([`⊙ magnetismo: la piega, raggio ${fmt((v * v) / m)}`, f]);
    if (f === 'materia') righe.push([`▒ materia: la frena di ${fmt(m)} al secondo`, f]);
    if (f === 'gravita') righe.push([`● gravità: la tira con ${fmt(m)}${tr.specie.luce ? ' (luce: il doppio)' : ''}`, f]);
  }
  if (righe.length === 1) righe.push(['nessuna forza: va dritta', null]);
  if (etichette) righe.forEach((r, i) => (i ? scriviMondo(r[0], x + px(14), y - px(14) + px(15) * i, r[1] ? rgb(FORZE[r[1]].col) : INK) : scriviMondo(r, x + px(14), y - px(14), GRIGIO)));
}
function disegnaTeste(T) {
  for (const tr of tracce) {
    const P = tr.punti; if (P[0][3] > T || P[P.length - 1][3] < T) continue;
    let i = 0; while (i < P.length - 2 && P[i + 1][3] <= T) i++;
    const a = P[i], b = P[i + 1], dt = b[3] - a[3] || 1e-9, u = (T - a[3]) / dt, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
    frecceForze(tr, x, y, (b[0] - a[0]) / dt, (b[1] - a[1]) / dt, false);
    const q = tr.specie.q ?? 0;
    ctx.fillStyle = tr.specie.luce ? rgb(FORZE.luce.col) : '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = px(1.2);
    ctx.beginPath(); ctx.arc(x, y, px(5), 0, 7); ctx.fill(); ctx.stroke();
    if (!tr.specie.luce && q) { ctx.lineWidth = px(1.4); ctx.beginPath(); ctx.moveTo(x - px(3), y); ctx.lineTo(x + px(3), y); if (q > 0) { ctx.moveTo(x, y - px(3)); ctx.lineTo(x, y + px(3)); } ctx.stroke(); }
  }
}
function disegnaSonda() {
  const tr = tracce.find((t) => t.id === sonda.tr); if (!tr) return;
  const P = tr.punti, k = Math.max(1, Math.min(P.length - 2, sonda.k)), a = P[k - 1], b = P[k + 1], dt = b[3] - a[3] || 1e-9, p = P[k];
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(p[0], p[1], px(4), 0, 7); ctx.fill(); ctx.stroke();
  frecceForze(tr, p[0], p[1], (b[0] - a[0]) / dt, (b[1] - a[1]) / dt, true);
}
function disegnaDecadimento(dk) {
  const c = rgb(FORZE.decadimento.col), r = px(6);
  ctx.strokeStyle = c; ctx.lineWidth = px(1.6);
  ctx.beginPath(); for (let k = 0; k < 4; k++) { const an = (k * Math.PI) / 4; ctx.moveTo(dk.pos[0] - r * Math.cos(an), dk.pos[1] - r * Math.sin(an)); ctx.lineTo(dk.pos[0] + r * Math.cos(an), dk.pos[1] + r * Math.sin(an)); } ctx.stroke();
}
function forma(f) {
  ctx.beginPath();
  if (f.tipo === 'tutto') ctx.rect(0, 0, cel().larghezza, cel().altezza);
  else if (f.tipo === 'cerchio') ctx.arc(f.centro[0], f.centro[1], f.r, 0, 7);
  else if (f.tipo === 'anello') { ctx.arc(f.centro[0], f.centro[1], f.r[1], 0, 7); ctx.moveTo(f.centro[0] + f.r[0], f.centro[1]); ctx.arc(f.centro[0], f.centro[1], f.r[0], 0, 7, true); }
  else if (f.tipo === 'poligono') f.punti.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
function puntini(f, colore, passo) {
  ctx.save(); forma(f); ctx.clip('evenodd'); ctx.fillStyle = colore;
  const c = cel();
  for (let y = passo / 2, r = 0; y < c.altezza; y += passo, r++) for (let x = (r % 2 ? passo : passo / 2); x < c.larghezza; x += passo) { ctx.beginPath(); ctx.arc(x, y, px(0.9), 0, 7); ctx.fill(); }
  ctx.restore();
}
function disegnaCampi() {
  const c = cel(), lista = [{ forma: { tipo: 'tutto' }, ...c.fondo, fondo: true }, ...c.domini];
  lista.forEach((dm, k) => {
    const scelto = sel?.tipo === 'dominio' && sel.i === k - 1, etichetta = [];
    if (dm.B && strati.magnetico) { forma(dm.forma); ctx.fillStyle = rgb(FORZE.magnetico.col, Math.min(0.16, 0.04 + Math.abs(dm.B) * 0.25)); ctx.fill('evenodd'); etichetta.push([`${dm.B > 0 ? '⊙' : '⊗'} campo ${fmt(dm.B)}`, FORZE.magnetico.col]); }
    if (dm.K && strati.materia) { puntini(dm.forma, rgb(FORZE.materia.col, Math.min(0.5, 0.15 + dm.K / 150)), px(Math.max(5, 14 - dm.K / 8))); etichetta.push([`▒ materia ${fmt(dm.K)}`, FORZE.materia.col]); }
    if ((dm.n ?? 1) !== 1 && strati.luce) { forma(dm.forma); ctx.fillStyle = rgb([90, 170, 200], Math.min(0.3, (dm.n - 1) * 0.4)); ctx.fill('evenodd'); etichetta.push([`◇ vetro n ${fmt(dm.n)}`, [40, 120, 150]]); }
    if (!dm.fondo) { forma(dm.forma); ctx.setLineDash(scelto ? [] : [px(5), px(4)]); ctx.strokeStyle = scelto ? ACCENTO : 'rgba(28,27,24,0.35)'; ctx.lineWidth = px(scelto ? 2 : 1); ctx.stroke(); ctx.setLineDash([]); }
    // il cartellino: dice che cosa c'è in questa zona
    if (etichetta.length) {
      const f = dm.forma, [x, y] = f.tipo === 'cerchio' ? [f.centro[0] - f.r * 0.7, f.centro[1] - f.r * 0.72] : f.tipo === 'anello' ? [f.centro[0] - f.r[1] * 0.7, f.centro[1] - f.r[1] * 0.72] : [px(8), px(18) + px(32 * k)];
      etichetta.forEach(([t, col], i) => scriviMondo(t, x, y + px(15) * i, rgb(col)));
    }
  });
  // i simboli del campo magnetico: ⊙ esce dal foglio, ⊗ entra
  if (!strati.magnetico) return;
  const passo = px(34);
  for (let y = passo / 2; y < c.altezza; y += passo) for (let x = passo / 2; x < c.larghezza; x += passo) {
    let B = c.fondo.B || 0; for (const dm of c.domini) if (dentro(dm.forma, x, y)) B = dm.B ?? B;
    if (!B) continue;
    const r = px(3), col = rgb(FORZE.magnetico.col, Math.min(0.55, 0.15 + Math.abs(B)));
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = px(1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    if (B > 0) { ctx.beginPath(); ctx.arc(x, y, px(1), 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.stroke(); }
  }
}
// il campo di gravità: frecce verso le masse, più lunghe dove tira di più
function campoGravita() {
  const c = cel(); if (!c.masse.length) return;
  const passo = px(46), G = c.G ?? 1, col = FORZE.gravita.col;
  for (let y = passo / 2; y < c.altezza; y += passo) for (let x = passo / 2; x < c.larghezza; x += passo) {
    let gx = 0, gy = 0, dentroCorpo = false;
    for (const m of c.masse) { const dx = m.pos[0] - x, dy = m.pos[1] - y, r = Math.hypot(dx, dy); if (r < (m.R ?? 0) + px(6)) dentroCorpo = true; const k = (G * m.M) / (r * r * r + 1e-9); gx += k * dx; gy += k * dy; }
    if (dentroCorpo) continue;
    const g = Math.hypot(gx, gy), L = Math.min(px(22), px(4) + px(5) * Math.log1p(g * 20));
    ctx.globalAlpha = Math.min(0.6, 0.12 + Math.log1p(g * 20) / 8);
    freccia(x - ((gx / g) * L) / 2, y - ((gy / g) * L) / 2, (gx / g) * L, (gy / g) * L, rgb(col), 1);
    ctx.globalAlpha = 1;
  }
}
function maniglieDominio(dm) { if (!dm || dm.forma.tipo !== 'cerchio') return; const f = dm.forma; manigliaQ(f.centro[0], f.centro[1]); manigliaQ(f.centro[0] + f.r, f.centro[1]); }
function manigliaQ(x, y) { ctx.fillStyle = '#fff'; ctx.strokeStyle = ACCENTO; ctx.lineWidth = px(1.5); ctx.beginPath(); ctx.rect(x - px(4), y - px(4), px(8), px(8)); ctx.fill(); ctx.stroke(); }
function disegnaMassa(m, scelta) {
  const G = cel().G ?? 1, col = FORZE.gravita.col, R = Math.max(m.R ?? 0, px(5));
  if (strati.gravita) for (const a of [4, 1, 0.25, 0.0625]) { const r = Math.sqrt((G * m.M) / a); if (r < (m.R ?? 0) * 1.1 || r > 400) continue; ctx.strokeStyle = rgb(col, 0.22); ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], r, 0, 7); ctx.stroke(); }
  const g = ctx.createRadialGradient(m.pos[0], m.pos[1], 0, m.pos[0], m.pos[1], R);
  g.addColorStop(0, rgb([90, 40, 25])); g.addColorStop(1, rgb(col));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], R, 0, 7); ctx.fill();
  if (scelta) { ctx.strokeStyle = ACCENTO; ctx.lineWidth = px(2); ctx.stroke(); }
  if (strati.gravita) scriviMondo(`● massa ${fmt(m.M)}`, m.pos[0] + R + px(4), m.pos[1] - px(4), rgb(col));
}
function disegnaParete(p, scelta) {
  ctx.lineCap = 'round'; ctx.globalAlpha = strati.luce ? 1 : 0.4;
  ctx.strokeStyle = scelta ? ACCENTO : p.tipo === 'assorbe' ? '#111' : rgb(FORZE.luce.col); ctx.lineWidth = px(p.tipo === 'assorbe' ? 4 : 3.5);
  ctx.beginPath(); ctx.moveTo(...p.a); ctx.lineTo(...p.b); ctx.stroke();
  if (p.tipo !== 'assorbe') { ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = px(1); ctx.stroke(); }
  ctx.globalAlpha = 1;
  if (scelta) { manigliaQ(...p.a); manigliaQ(...p.b); }
}
const specieDi = (so) => (typeof so.specie === 'string' ? { nome: so.specie, ...cel().specie[so.specie] } : so.specie);
function puntaFreccia(so) {
  const sp = specieDi(so), L = sp?.luce ? 22 : 6 + (so.v ?? 0) * 2.2;
  return [so.pos[0] + Math.cos(so.dir ?? 0) * px(L * 1.6), so.pos[1] + Math.sin(so.dir ?? 0) * px(L * 1.6)];
}
function disegnaSorgente(so, scelta) {
  const [x, y] = so.pos, [tx, ty] = puntaFreccia(so), col = scelta ? ACCENTO : rgb(FORZE.decadimento.col);
  ctx.globalAlpha = 0.9; freccia(x, y, tx - x, ty - y, col, 2); ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = px(2); ctx.beginPath(); ctx.arc(x, y, px(5), 0, 7); ctx.fill(); ctx.stroke();
}

// ---------- scegliere e trascinare nell'elemento
function distSeg(x, y, a, b) { const sx = b[0] - a[0], sy = b[1] - a[1], l2 = sx * sx + sy * sy || 1e-12, u = Math.max(0, Math.min(1, ((x - a[0]) * sx + (y - a[1]) * sy) / l2)); return Math.hypot(x - a[0] - u * sx, y - a[1] - u * sy); }
function vicinoTraccia(x, y, raggioPx) {
  let best = null, bd = px(raggioPx); const T = Math.min(tempo, tMax());
  for (const tr of tracce) for (let k = 1; k < tr.punti.length; k++) {
    const a = tr.punti[k - 1], b = tr.punti[k]; if (a[3] > T) break; if (!a[2] || !b[2]) continue;
    const d = distSeg(x, y, a, b) - b[4] / 2; if (d < bd) { bd = d; best = { tr: tr.id, k }; }
  }
  return best;
}
function colpisci(x, y) {
  const r = px(9), c = cel();
  for (let i = c.sorgenti.length - 1; i >= 0; i--) {
    const so = c.sorgenti[i], [tx, ty] = puntaFreccia(so);
    if (Math.hypot(x - tx, y - ty) < r) return { tipo: 'sorgente', i, parte: 'freccia' };
    if (Math.hypot(x - so.pos[0], y - so.pos[1]) < r) return { tipo: 'sorgente', i, parte: 'corpo' };
  }
  if (sel?.tipo === 'dominio') { const f = c.domini[sel.i]?.forma; if (f?.tipo === 'cerchio') { if (Math.hypot(x - f.centro[0] - f.r, y - f.centro[1]) < r) return { tipo: 'dominio', i: sel.i, parte: 'raggio' }; if (Math.hypot(x - f.centro[0], y - f.centro[1]) < r) return { tipo: 'dominio', i: sel.i, parte: 'centro' }; } }
  for (let i = c.masse.length - 1; i >= 0; i--) { const m = c.masse[i]; if (Math.hypot(x - m.pos[0], y - m.pos[1]) < Math.max(r, m.R ?? 0)) return { tipo: 'massa', i, parte: 'corpo' }; }
  for (let i = c.pareti.length - 1; i >= 0; i--) {
    const p = c.pareti[i];
    if (Math.hypot(x - p.a[0], y - p.a[1]) < r) return { tipo: 'parete', i, parte: 'a' };
    if (Math.hypot(x - p.b[0], y - p.b[1]) < r) return { tipo: 'parete', i, parte: 'b' };
    if (distSeg(x, y, p.a, p.b) < r * 0.7) return { tipo: 'parete', i, parte: 'tutta' };
  }
  const t = vicinoTraccia(x, y, 7); if (t) return { tipo: 'traccia', i: t.tr };
  for (let i = c.domini.length - 1; i >= 0; i--) if (c.domini[i].forma.tipo !== 'tutto' && dentro(c.domini[i].forma, x, y)) return { tipo: 'dominio', i, parte: 'centro' };
  for (let i = c.domini.length - 1; i >= 0; i--) if (c.domini[i].forma.tipo === 'tutto') return { tipo: 'dominio', i, parte: 'nessuna' };
  return null;
}
function arrotonda(o) { const r = (v) => Math.round(v * 100) / 100; if (o.pos) o.pos = o.pos.map(r); if (o.a) { o.a = o.a.map(r); o.b = o.b.map(r); } if (o.forma?.centro) { o.forma.centro = o.forma.centro.map(r); o.forma.r = r(o.forma.r); } if (o.v != null) o.v = r(o.v); if (o.dir != null) o.dir = Math.round(o.dir * 1e4) / 1e4; }

let presa = null;
tela.addEventListener('pointerdown', (e) => {
  tela.setPointerCapture(e.pointerId);
  if (vista === 'pattern') {
    const [x, y] = aPattern(e), m = maniglia(x, y), h = m ? null : colpisciPattern(x, y);
    if (m) { ricorda(); presa = { tipo: 'reticolo', v: m }; }
    else if (h) presa = { tipo: 'posto', ...h, x0: x, y0: y, sx: e.clientX, sy: e.clientY, orig: comp.elementi[h.e].posti[h.p].pos.slice(), mosso: false };
    else presa = { tipo: 'vista', sx: e.clientX, sy: e.clientY, cx: pat.cx, cy: pat.cy };
    return;
  }
  const [x, y] = aMondo(e), c = cel();
  if (strumento !== 'seleziona') { aggiungi(strumento, x, y); return; }
  const h = colpisci(x, y);
  sel = h ? { tipo: h.tipo, i: h.i } : null;
  if (h && h.parte && h.parte !== 'nessuna' && h.tipo !== 'traccia') {
    ricorda(); prima = tracce;
    const o = h.tipo === 'sorgente' ? c.sorgenti[h.i] : h.tipo === 'massa' ? c.masse[h.i] : h.tipo === 'parete' ? c.pareti[h.i] : c.domini[h.i];
    presa = { ...h, o, x, y, orig: clona(o) };
  }
  disegna(); mostraPannello();
});
tela.addEventListener('pointermove', (e) => {
  if (vista === 'pattern') {
    const [x, y] = aPattern(e);
    if (!presa) {
      const h = colpisciPattern(x, y), prec = sopra; sopra = h ? { e: h.e, p: h.p } : null;
      tela.style.cursor = maniglia(x, y) ? 'move' : h ? 'pointer' : 'grab';
      if (JSON.stringify(prec) !== JSON.stringify(sopra)) disegna();
      return;
    }
    if (presa.tipo === 'vista') { pat.cx = presa.cx - (e.clientX - presa.sx) / pat.z; pat.cy = presa.cy - (e.clientY - presa.sy) / pat.z; disegna(); }
    else if (presa.tipo === 'reticolo') { comp.reticolo[presa.v] = [Math.round(x), Math.round(y)]; disegna(); }
    else if (presa.tipo === 'posto') {
      if (!presa.mosso && Math.hypot(e.clientX - presa.sx, e.clientY - presa.sy) < 5) return;
      if (!presa.mosso) { ricorda(); presa.mosso = true; }
      comp.elementi[presa.e].posti[presa.p].pos = [Math.round((presa.orig[0] + x - presa.x0) * 10) / 10, Math.round((presa.orig[1] + y - presa.y0) * 10) / 10];
      scelto = { e: presa.e, p: presa.p }; disegna();
    }
    return;
  }
  const [x, y] = aMondo(e);
  if (!presa) {
    // la sonda: passando sopra una linea si vedono le forze che agiscono lì
    const prec = sonda; sonda = strumento === 'seleziona' ? vicinoTraccia(x, y, 9) : null;
    tela.style.cursor = strumento !== 'seleziona' ? 'crosshair' : colpisci(x, y) ? 'pointer' : 'default';
    if (JSON.stringify(prec) !== JSON.stringify(sonda)) disegna();
    return;
  }
  const dx = x - presa.x, dy = y - presa.y, o = presa.o, g = presa.orig;
  if (presa.tipo === 'sorgente' && presa.parte === 'corpo') o.pos = [g.pos[0] + dx, g.pos[1] + dy];
  if (presa.tipo === 'sorgente' && presa.parte === 'freccia') { o.dir = Math.atan2(y - o.pos[1], x - o.pos[0]); if (!specieDi(o)?.luce) o.v = Math.max(0, (Math.hypot(x - o.pos[0], y - o.pos[1]) / px(1.6) - 6) / 2.2); }
  if (presa.tipo === 'massa') o.pos = [g.pos[0] + dx, g.pos[1] + dy];
  if (presa.tipo === 'parete') { if (presa.parte !== 'b') o.a = [g.a[0] + dx, g.a[1] + dy]; if (presa.parte !== 'a') o.b = [g.b[0] + dx, g.b[1] + dy]; }
  if (presa.tipo === 'dominio' && o.forma.tipo === 'cerchio') {
    if (presa.parte === 'raggio') o.forma.r = Math.max(2, Math.hypot(x - o.forma.centro[0], y - o.forma.centro[1]));
    else o.forma.centro = [g.forma.centro[0] + dx, g.forma.centro[1] + dy];
  }
  arrotonda(o); simula(); disegna();
});
tela.addEventListener('pointerup', () => {
  if (vista === 'pattern' && presa) {
    if (presa.tipo === 'posto' && !presa.mosso) { scelto = { e: presa.e, p: presa.p }; presa = null; entra(scelto.e); return; }
    presa = null; mostraPannello(); disegna(); return;
  }
  if (presa) { presa = null; prima = null; aggiornaTempo(); disegna(); mostraPannello(); }
});
tela.addEventListener('pointerleave', () => { if (sopra || sonda) { sopra = null; sonda = null; disegna(); } });
tela.addEventListener('wheel', (e) => {
  if (vista !== 'pattern') return;
  e.preventDefault();
  const [x, y] = aPattern(e), k = Math.exp(-e.deltaY * 0.0015);
  pat.z = Math.max(0.02, Math.min(40, pat.z * k));
  const [x2, y2] = aPattern(e); pat.cx += x - x2; pat.cy += y - y2; disegna();
}, { passive: false });

function aggiungi(cosa, x, y) {
  ricorda(); const c = cel();
  if (cosa === 'sorgente') {
    const nome = Object.keys(c.specie).find((k) => (c.specie[k].q ?? 0) !== 0) || ((c.specie.carica = { q: 1, m: 1 }), 'carica');
    c.sorgenti.push({ pos: [x, y], dir: 0, v: 8, specie: nome }); sel = { tipo: 'sorgente', i: c.sorgenti.length - 1 };
  } else if (cosa === 'campo') { c.domini.push({ nome: 'campo', forma: { tipo: 'cerchio', centro: [x, y], r: 40 }, B: 0.3, K: 0, n: 1 }); sel = { tipo: 'dominio', i: c.domini.length - 1 }; }
  else if (cosa === 'materia') { c.domini.push({ nome: 'materia', forma: { tipo: 'cerchio', centro: [x, y], r: 40 }, B: c.fondo.B, K: 20, n: 1 }); sel = { tipo: 'dominio', i: c.domini.length - 1 }; }
  else if (cosa === 'vetro') { c.domini.push({ nome: 'vetro', forma: { tipo: 'cerchio', centro: [x, y], r: 30 }, B: 0, K: 0, n: 1.5 }); sel = { tipo: 'dominio', i: c.domini.length - 1 }; }
  else if (cosa === 'massa') { c.masse.push({ pos: [x, y], M: 300, R: 5 }); sel = { tipo: 'massa', i: c.masse.length - 1 }; }
  else if (cosa === 'specchio') { c.pareti.push({ a: [x - 25, y], b: [x + 25, y], tipo: 'specchio' }); sel = { tipo: 'parete', i: c.pareti.length - 1 }; }
  scegliStrumento('seleziona'); aggiorna();
}
function elimina() {
  if (vista === 'pattern') { if (scelto) togliPosto(scelto.e, scelto.p); return; }
  if (!sel) return; const c = cel(); ricorda();
  const lista = { sorgente: c.sorgenti, dominio: c.domini, massa: c.masse, parete: c.pareti }[sel.tipo];
  if (lista) lista.splice(sel.i, 1);
  sel = null; aggiorna();
}
function togliPosto(e, p) {
  ricorda(); comp.elementi[e].posti.splice(p, 1);
  if (!comp.elementi[e].posti.length && comp.elementi.length > 1) comp.elementi.splice(e, 1);
  scelto = null; corrente = Math.min(corrente, comp.elementi.length - 1); aggiorna();
}

// ---------- il pannello: solo la cosa che hai in mano, e cosa fa ogni numero
const SPIEGA = {
  carica: 'carica q: il segno dice da che parte gira nel campo (+ e − girano opposte); più carica, più stretta la curva, più spessa la traccia, frena prima. Zero: non gira, non frena, non si vede.',
  massa: "massa m: l'inerzia. Alla stessa velocità, più pesante = curva più larga (r = m·v/(q·B)) e più strada. Ma chi nasce da un decadimento riceve una spinta fissa: lì più pesante = più lenta, e si ferma prima. La gravità invece la fa cadere uguale, leggera o pesante.",
  energia: 'energia: per la luce fa le veci della massa. Decide quanta spinta hanno le figlie quando il fotone si converte.',
  vita: 'vita: dopo quanto tempo decade nelle sue figlie (✳ verde sulla scena).',
  visibile: 'visibile: se lascia traccia sulla pellicola. Nelle camere a bolle le neutre e la luce non lasciano bolle.',
  angolo: 'angolo: la direzione della figlia rispetto a quella della madre, in gradi.',
  quota: 'quota: quale parte della spinta (quantità di moto) della madre si porta via. Più spinta, più veloce: curva più larga, più strada.',
  vInizio: 'velocità alla nascita: più veloce, curva più larga e più strada prima di fermarsi. La freccia sulla scena è la stessa cosa: trascinala.',
  direzione: 'direzione: verso dove parte. Trascina la punta della freccia.',
  t0: 'partenza: in che istante la sorgente emette.',
  B: 'campo magnetico B (blu): perpendicolare al foglio. Fa girare le cariche: raggio m·v/(q·B), più campo = curve più strette. Il segno sceglie il verso (⊙ esce dal foglio, ⊗ entra).',
  K: 'materia K (marrone, a puntini): quanto è denso il mezzo. Frena le cariche, e più sono lente più frenano: la curva si stringe in spirale fino all\'occhio. Zero: vuoto.',
  n: 'indice n (azzurro): per la luce, quanto è lento il mezzo (vetro 1,5, acqua 1,33). Al bordo la luce si rifrange; da un mezzo lento a uno veloce può riflettersi tutta.',
  raggioDominio: 'raggio: fin dove arriva questa zona. Trascina il quadratino sul bordo.',
  M: 'massa M (rossa): quanto curva lo spazio intorno. Le particelle cadono verso di lei con G·M/r², la luce si piega il doppio. Nessuno la sposta: resta ferma.',
  R: 'raggio R: il corpo della massa. Chi lo tocca ci cade dentro e si ferma.',
  tipoParete: 'specchio: riflette tutto, angolo di uscita uguale a quello di entrata. Assorbe: ferma qualunque cosa la tocchi.',
  c: 'velocità della luce c in questo universo: il limite. La luce va a c/n.',
  tempo: 'durata dell\'esposizione: quanto a lungo la pellicola registra.',
  w0: 'spessore base della pellicola: quanto è grossa la bolla di una carica unitaria veloce.',
  saturazione: 'saturazione: quanto può ingrossare la traccia quando la particella rallenta (l\'occhio finale).',
  vRif: 'velocità di riferimento: sotto questa velocità la traccia comincia a ingrossare.',
  rot: 'rotazione: lo stesso evento, girato. Ruotare un universo non cambia le sue leggi.',
  specchio: 'a specchio: lo stesso evento nell\'universo riflesso. Lì il campo magnetico ha il verso opposto, e la forma è esattamente la riflessione.',
};

function mostraPannello() {
  idCursore = 0; registro.clear();
  const h = [];
  if (vista === 'pattern') pannelloPattern(h); else pannelloElemento(h);
  pannello.innerHTML = h.join('');
}
function pannelloPattern(h) {
  h.push(`<h2>${comp.nome}</h2><p class="nota">${comp.nota || ''}</p>`);
  h.push(`<p class="aiuto">Il pattern: la piastrella tratteggiata si ripete all'infinito. Ogni motivo è un <b>elemento</b>, un evento fisico. Passa sopra un motivo: si accendono tutte le sue copie. <b>Clic per entrarci</b> e cambiarne la fisica. Trascina un motivo per spostarlo (con tutte le sue copie); trascina il fondo per muoverti, rotella per lo zoom; i pallini a e b cambiano la piastrella.</p>`);
  h.push(`<h2>gli elementi (le parole)</h2>`);
  comp.elementi.forEach((e, ei) => {
    h.push(`<div class="elemento ${scelto?.e === ei ? 'scelto' : ''}"><div class="testa"><b>${e.nome}</b><span class="nota">${e.posti.length} ${e.posti.length === 1 ? 'posto' : 'posti'} per piastrella</span></div>`);
    h.push(`<div class="riga-bottoni"><button data-entra="${ei}" class="primo">entra →</button><button data-copia-posto="${ei}">+ un posto</button></div>`);
    if (scelto?.e === ei && e.posti[scelto.p]) {
      const p = e.posti[scelto.p];
      h.push(`<div class="nota">il posto ${scelto.p + 1} (cerchiato):</div>`);
      h.push(cursore('rot', p, 'rot', -180, 180, 1, 'rotazione (gradi)'));
      h.push(`<label class="riga">a specchio <input type="checkbox" data-specchio ${p.specchio ? 'checked' : ''}></label><p class="spiega">${SPIEGA.specchio}</p>`);
      h.push(`<div class="riga-bottoni"><button data-togli-posto>togli questo posto</button></div>`);
    } else if (e.posti.length) h.push(`<div class="riga-bottoni"><button data-scegli-posto="${ei}" class="piccolo">ruota o rifletti un posto</button></div>`);
    h.push(`</div>`);
  });
  h.push(`<h2>aggiungi un elemento</h2><label class="riga">quale <select id="nuovoChi">${Object.keys(ELEMENTI).map((k) => `<option>${k}</option>`).join('')}</select></label><label class="riga">grandezza <input type="number" id="nuovoK" value="0.5" step="0.05" min="0.05"></label><div class="riga-bottoni"><button data-aggiungi-elemento>aggiungi al centro della piastrella</button></div>`);
  const { a, b } = comp.reticolo;
  h.push(`<h2>la piastrella</h2><p class="nota">a = (${fmt(a[0])}, ${fmt(a[1])}) · b = (${fmt(b[0])}, ${fmt(b[1])}) · trascina i pallini a e b</p><div class="riga-bottoni"><button data-reticolo="quadrato">quadrata</button><button data-reticolo="esagonale">esagonale</button><button data-reticolo="sfalsato">sfalsata</button></div>`);
  if (immagine) h.push(`<h2>l'immagine</h2><label class="riga">mostra l'originale sotto <input type="checkbox" data-originale ${mostraOriginale ? 'checked' : ''}></label>`);
}
function pannelloElemento(h) {
  const c = cel();
  h.push(`<div class="briciole"><button data-vista-p>← il pattern</button> <b>${el().nome}</b></div>`);
  if (!sel) {
    h.push(`<p class="nota">${el().nota || ''}</p>`);
    h.push(`<p class="aiuto">Un elemento solo: una cella di spaziotempo. <b>Passa sopra una linea</b> e vedi le forze che agiscono lì, ognuna col suo colore. <b>Tocca</b> una cosa per cambiarla: la freccia verde (dove nasce la particella), una zona (campo, materia, vetro), una massa, uno specchio, una linea. Quello che cambi qui cambia in tutte le copie del pattern.</p>`);
    h.push(`<h2>che cosa c'è in questa cella</h2><div class="elenco">`);
    c.sorgenti.forEach((so, i) => h.push(`<div data-sel="sorgente:${i}"><i style="color:${rgb(FORZE.decadimento.col)}">→</i> sorgente ${i + 1}: <b>${specieDi(so).nome}</b> ${specieDi(so).luce ? 'luce' : `v ${fmt(so.v ?? 0)}`}</div>`));
    c.domini.forEach((d, i) => h.push(`<div data-sel="dominio:${i}"><i style="color:${rgb(d.B ? FORZE.magnetico.col : d.K ? FORZE.materia.col : [40, 120, 150])}">▒</i> ${d.nome || 'zona'}: ${descriviDominio(d)}</div>`));
    c.masse.forEach((m, i) => h.push(`<div data-sel="massa:${i}"><i style="color:${rgb(FORZE.gravita.col)}">●</i> ${m.nome || 'massa'} M ${fmt(m.M)}</div>`));
    c.pareti.forEach((p, i) => h.push(`<div data-sel="parete:${i}"><i style="color:${rgb(FORZE.luce.col)}">—</i> ${p.tipo} ${i + 1}</div>`));
    h.push(`</div><h2>le specie (che cosa sono le particelle)</h2><div class="elenco">`);
    for (const nome of Object.keys(c.specie)) h.push(`<div data-specie="${nome}">◦ <b>${nome}</b> ${descriviSpecie(c.specie[nome])}</div>`);
    h.push(`</div><h2>l'universo della cella</h2><div class="nota">fondo (dove non c'è nessuna zona)</div>`);
    h.push(cursore('B', c.fondo, 'B', -1, 1, 0.005, 'campo magnetico B'));
    h.push(cursore('K', c.fondo, 'K', 0, 120, 0.5, 'materia K'));
    h.push(cursore('c', c, 'c', 5, 80, 1, 'velocità della luce c'));
    h.push(cursore('tempo', c, 'tempo', 1, 300, 0.5, 'durata'));
    h.push(`<div class="nota">la pellicola</div>`);
    h.push(cursore('w0', c.pellicola, 'w0', 0.05, 4, 0.05, 'spessore base'));
    h.push(cursore('saturazione', c.pellicola, 'saturazione', 1, 10, 0.1));
    h.push(cursore('vRif', c.pellicola, 'vRif', 0.5, 30, 0.5, 'velocità di riferimento'));
    h.push(`<label class="riga">bordo <select data-bordo>${['aperto', 'periodico', 'specchio'].map((b) => `<option ${c.bordo === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>`);
    return;
  }
  if (sel.tipo === 'traccia') {
    const tr = tracce.find((t) => t.id === sel.i);
    if (!tr) { sel = null; return pannelloElemento(h); }
    h.push(`<h2>una linea</h2><p class="storia">${storia(tr)}</p><button data-sel="sorgente:${tr.sorgente}">vai alla sua sorgente</button>`);
    if (tr.specie.nome) h.push(pannelloSpecie(tr.specie.nome));
  } else if (sel.tipo === 'specie') h.push(pannelloSpecie(sel.nome));
  else if (sel.tipo === 'sorgente') {
    const so = c.sorgenti[sel.i], sp = specieDi(so);
    h.push(`<h2>sorgente ${sel.i + 1}</h2><p class="nota">il punto da cui parte la storia: qui nasce un ${sp.nome}. Trascina il cerchio per spostarla, la punta della freccia per la direzione${sp.luce ? '' : ' e la velocità'}.</p>`);
    h.push(`<label class="riga">che cosa emette <select data-specie-sorgente>${Object.keys(c.specie).map((k) => `<option ${k === sp.nome ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`);
    if (!sp.luce) h.push(cursore('vInizio', so, 'v', 0, 30, 0.05, 'velocità'));
    h.push(cursoreAngolo(so));
    h.push(cursore('t0', so, 't0', 0, c.tempo, 0.05, 'partenza'));
    h.push(pannelloSpecie(sp.nome));
  } else if (sel.tipo === 'dominio') {
    const d = c.domini[sel.i];
    h.push(`<h2>${d.nome || 'zona'}</h2><p class="nota">una zona del piano con le sue proprietà, ferme nel tempo. ${d.forma.tipo === 'cerchio' ? 'Trascina il centro per spostarla, il quadratino sul bordo per allargarla.' : 'Vale in tutta la cella.'}</p>`);
    h.push(`<label class="riga">forma <select data-forma>${['tutto', 'cerchio'].map((f) => `<option ${d.forma.tipo === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`);
    if (d.forma.tipo === 'cerchio') h.push(cursore('raggioDominio', d.forma, 'r', 2, 300, 0.5, 'raggio'));
    h.push(cursore('B', d, 'B', -1, 1, 0.005, 'campo magnetico B'));
    h.push(cursore('K', d, 'K', 0, 120, 0.5, 'materia K'));
    h.push(cursore('n', d, 'n', 1, 2.5, 0.01, 'indice n'));
    h.push(misureDominio(d));
  } else if (sel.tipo === 'massa') {
    const m = c.masse[sel.i];
    h.push(`<h2>${m.nome || 'massa'}</h2><p class="nota">un corpo fermo che curva lo spazio. Trascinalo. Le frecce rosse: dove e quanto tira; gli anelli: dove la caduta è forte.</p>`);
    h.push(cursore('M', m, 'M', 0, 4000, 5, 'massa M'));
    h.push(cursore('R', m, 'R', 0, 40, 0.5, 'raggio R'));
  } else if (sel.tipo === 'parete') {
    const p = c.pareti[sel.i];
    h.push(`<h2>${p.tipo} ${sel.i + 1}</h2><p class="nota">un segmento perpendicolare al piano. Trascina gli estremi o il centro.</p>`);
    h.push(`<label class="riga">tipo <select data-parete>${['specchio', 'assorbe'].map((f) => `<option ${p.tipo === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label><p class="spiega">${SPIEGA.tipoParete}</p>`);
  }
  h.push(`<div class="riga-bottoni">${['traccia', 'specie'].includes(sel.tipo) ? '' : '<button data-azione="elimina">elimina</button>'}<button data-azione="chiudi">chiudi</button></div>`);
}
function descriviDominio(d) { const p = []; if (d.B) p.push(`campo ${fmt(d.B)}`); if (d.K) p.push(`materia ${fmt(d.K)}`); if ((d.n ?? 1) !== 1) p.push(`vetro n ${fmt(d.n)}`); return p.join(', ') || 'vuoto'; }
function descriviSpecie(s) { if (s.luce) return `luce${s.vita != null ? `, si converte dopo ${fmt(s.vita)}` : ''}`; return `q ${fmt(s.q ?? 0)}, m ${fmt(s.m ?? 1)}${s.vita != null ? `, decade dopo ${fmt(s.vita)}` : ''}`; }
function misureDominio(d) {
  const righe = [];
  for (const [nome, s] of Object.entries(cel().specie)) {
    if (s.luce || !s.q) continue;
    const tr = tracce.find((t) => t.specie.nome === nome); if (!tr) continue;
    const P = tr.punti, v = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) / ((P[1][3] - P[0][3]) || 1);
    const r = d.B ? raggio(s, v, d.B) : Infinity, g = d.K ? gittata(s, v, d.K) : Infinity;
    righe.push(`<div>${nome} (v ${fmt(v)}): gira con raggio ${isFinite(r) ? fmt(r) : '∞'}, si ferma dopo ${isFinite(g) ? fmt(g) : '∞'}</div>`);
  }
  return righe.length ? `<div class="misure"><div class="nota">qui dentro, alla nascita:</div>${righe.join('')}</div>` : '';
}
function pannelloSpecie(nome) {
  const s = cel().specie[nome]; if (!s) return '';
  const h = [`<h2>la specie: ${nome}</h2><p class="nota">vale per tutte le ${nome} della cella (passa sopra i cursori: si accendono). Cambiala e cambiano tutte, in tutte le copie.</p><div data-evidenzia="${nome}">`];
  if (s.luce) h.push(cursore('energia', s, 'm', 0.05, 5, 0.01, 'energia', nome));
  else { h.push(cursore('carica', s, 'q', -3, 3, 0.1, 'carica q', nome)); h.push(cursore('massa', s, 'm', 0.1, 40, 0.1, 'massa m', nome)); }
  h.push(`<label class="riga"><span>stabile</span><input type="checkbox" data-stabile="${nome}" ${s.vita == null ? 'checked' : ''}></label>`);
  if (s.vita != null) h.push(cursore('vita', s, 'vita', 0.001, 40, 0.01, 'vita', nome));
  h.push(`<label class="riga"><span>visibile</span><input type="checkbox" data-visibile="${nome}" ${(s.visibile ?? (s.luce || (s.q ?? 0) !== 0)) ? 'checked' : ''}></label><p class="spiega">${SPIEGA.visibile}</p>`);
  if (s.vita != null && s.figli?.length) {
    h.push(`<div class="nota">quando decade (✳) nasce:</div>`);
    s.figli.forEach((f, k) => {
      if (s.figli.length > 4 && k >= 4) return;
      h.push(`<div class="figlia"><b>${f.specie}</b> <button class="piccolo" data-specie="${f.specie}">apri</button>`);
      h.push(cursore('angolo', f, 'angolo', -180, 180, 0.5, 'angolo', nome));
      h.push(f.v != null ? cursore('vInizio', f, 'v', 0, 30, 0.05, 'velocità', nome) : cursore('quota', f, 'quota', 0, 1, 0.01, 'quota', nome));
      h.push(`</div>`);
    });
    if (s.figli.length > 4) h.push(`<p class="nota">… e altre ${s.figli.length - 4} figlie in raggiera: <label class="riga">quante in tutto <input type="number" min="1" max="24" value="${s.figli.filter((f) => f.specie === s.figli[0].specie).length}" data-raggiera="${nome}"></label></p>`);
  }
  h.push(`</div>`);
  return h.join('');
}
let idCursore = 0;
const registro = new Map();
function cursore(chiave, oggetto, campo, min, max, passo, etichetta = chiave, specie = null) {
  const id = `c${idCursore++}`, val = oggetto[campo] ?? 0;
  registro.set(id, { oggetto, campo });
  return `<div class="cursore" ${specie ? `data-evidenzia="${specie}"` : ''}><label for="${id}">${etichetta}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${passo}" value="${val}"><input type="number" data-per="${id}" step="${passo}" value="${Math.round(val * 1e4) / 1e4}"><p class="spiega">${SPIEGA[chiave] || ''}</p></div>`;
}
function cursoreAngolo(so) {
  const id = `c${idCursore++}`; registro.set(id, { oggetto: so, campo: 'dir', gradi: true });
  const g = Math.round((((so.dir ?? 0) * 180) / Math.PI) * 10) / 10;
  return `<div class="cursore"><label for="${id}">direzione (gradi)</label><input type="range" id="${id}" min="-180" max="180" step="0.5" value="${g}"><input type="number" data-per="${id}" step="0.5" value="${g}"><p class="spiega">${SPIEGA.direzione}</p></div>`;
}
pannello.addEventListener('pointerdown', (e) => { if (e.target.type === 'range') { ricorda(); if (vista !== 'pattern') prima = tracce; } });
pannello.addEventListener('input', (e) => {
  const t = e.target, id = t.dataset.per || t.id, r = registro.get(id);
  if (!r) return;
  if (t.type === 'number' && !prima && vista !== 'pattern') { ricorda(); prima = tracce; }
  const v = parseFloat(t.value); if (!isFinite(v)) return;
  r.oggetto[r.campo] = r.gradi ? (v * Math.PI) / 180 : v;
  const gemello = t.type === 'range' ? pannello.querySelector(`[data-per="${id}"]`) : $(id); if (gemello) gemello.value = t.value;
  simula(); aggiornaTempo(); disegna();
});
pannello.addEventListener('change', (e) => {
  const t = e.target;
  if (registro.has(t.dataset.per || t.id)) { prima = null; disegna(); return; }
  if (t.id === 'nuovoChi' || t.id === 'nuovoK') return;
  ricorda();
  if (t.dataset.specchio != null) comp.elementi[scelto.e].posti[scelto.p].specchio = t.checked;
  if (t.dataset.originale != null) mostraOriginale = t.checked;
  if (vista !== 'pattern') {
    const c = cel();
    if (t.dataset.bordo != null) c.bordo = t.value;
    if (t.dataset.forma != null) { const d = c.domini[sel.i]; d.forma = t.value === 'tutto' ? { tipo: 'tutto' } : { tipo: 'cerchio', centro: [c.larghezza / 2, c.altezza / 2], r: c.larghezza * 0.3 }; }
    if (t.dataset.parete != null) c.pareti[sel.i].tipo = t.value;
    if (t.dataset.specieSorgente != null) c.sorgenti[sel.i].specie = t.value;
    if (t.dataset.stabile) { const s = c.specie[t.dataset.stabile]; if (t.checked) delete s.vita; else s.vita = 2; }
    if (t.dataset.visibile) c.specie[t.dataset.visibile].visibile = t.checked;
    if (t.dataset.raggiera) {
      const s = c.specie[t.dataset.raggiera], N = Math.max(1, Math.min(24, parseInt(t.value) || 1)), tipo = s.figli[0].specie, modello = s.figli[0];
      const altri = s.figli.filter((f) => f.specie !== tipo), nuovi = [];
      for (let k = 0; k < N; k++) nuovi.push({ ...modello, angolo: Math.round(((360 * k) / N) * 1000) / 1000 });
      s.figli = [...nuovi, ...altri];
    }
  }
  aggiorna();
});
pannello.addEventListener('click', (e) => {
  const t = e.target.closest('button,[data-sel],[data-specie]'); if (!t) return;
  const d = t.dataset;
  if (d.entra != null) return entra(+d.entra);
  if (d.vistaP != null) { vista = 'pattern'; aggiornaVista(); return; }
  if (d.copiaPosto != null) { ricorda(); const e2 = comp.elementi[+d.copiaPosto], { a, b } = comp.reticolo; e2.posti.push({ pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rot: 0 }); scelto = { e: +d.copiaPosto, p: e2.posti.length - 1 }; return aggiorna(); }
  if (d.scegliPosto != null) { scelto = { e: +d.scegliPosto, p: 0 }; mostraPannello(); return disegna(); }
  if (d.togliPosto != null) return togliPosto(scelto.e, scelto.p);
  if (d.aggiungiElemento != null) { ricorda(); const nuovo = nuovoElemento($('nuovoChi').value, Math.max(0.05, +$('nuovoK').value || 0.5)), { a, b } = comp.reticolo; nuovo.posti.push({ pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rot: 0 }); comp.elementi.push(nuovo); scelto = { e: comp.elementi.length - 1, p: 0 }; return aggiorna(); }
  if (d.reticolo) {
    ricorda(); const L = Math.max(Math.hypot(...comp.reticolo.a), 20);
    comp.reticolo = d.reticolo === 'quadrato' ? { a: [L, 0], b: [0, L] } : d.reticolo === 'esagonale' ? { a: [L, 0], b: [L / 2, Math.round(L * 0.866)] } : { a: [L, 0], b: [L / 2, L] };
    return aggiorna();
  }
  if (d.sel) { const [tipo, i] = d.sel.split(':'); sel = { tipo, i: +i }; }
  else if (d.specie && t.tagName !== 'SELECT') sel = { tipo: 'specie', nome: d.specie };
  else if (d.azione === 'elimina') return elimina();
  else if (d.azione === 'chiudi') sel = null;
  else return;
  disegna(); mostraPannello();
});
pannello.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-evidenzia]'); const n = t ? t.dataset.evidenzia : null; if (n !== evidenzia) { evidenzia = n; if (vista === 'dettaglio') disegna(); } });
pannello.addEventListener('pointerleave', () => { if (evidenzia) { evidenzia = null; disegna(); } });

// ---------- le cinque forze: le schede sopra la scena
const schede = $('forze');
function mostraSchede() {
  const c = vista === 'pattern' ? null : cel(), conta = {};
  if (c) {
    conta.gravita = c.masse.length ? `${c.masse.length} ${c.masse.length === 1 ? 'massa' : 'masse'}` : 'qui nessuna';
    const zB = [c.fondo, ...c.domini].filter((d) => d.B).length, zK = [c.fondo, ...c.domini].filter((d) => d.K).length, zn = c.domini.filter((d) => (d.n ?? 1) !== 1).length;
    conta.magnetico = zB ? `${zB} ${zB === 1 ? 'zona' : 'zone'}` : 'qui nessuno';
    conta.materia = zK ? `${zK} ${zK === 1 ? 'zona' : 'zone'}` : 'qui nessuna';
    const luci = Object.values(c.specie).filter((s) => s.luce).length;
    conta.luce = c.pareti.length || zn || luci ? [c.pareti.length && `${c.pareti.length} specchi`, zn && `${zn} vetri`, luci && 'luce'].filter(Boolean).join(', ') : 'qui niente';
    const dec = Object.values(c.specie).filter((s) => s.vita != null).length;
    conta.decadimento = dec ? `${dec} ${dec === 1 ? 'specie' : 'specie'}` : 'qui niente';
  }
  schede.innerHTML = Object.entries(FORZE).map(([k, f]) => `<button data-forza="${k}" class="${strati[k] ? 'acceso' : ''}" style="--c:${rgb(f.col)}"><i>${f.simbolo}</i> ${f.nome}${conta[k] ? ` <small>${conta[k]}</small>` : ''}</button>`).join('') +
    `<label class="colori"><input type="checkbox" id="coloriForze" ${coloriForze ? 'checked' : ''}> linee colorate per forza</label>`;
}
schede.addEventListener('click', (e) => { const b = e.target.closest('[data-forza]'); if (!b) return; strati[b.dataset.forza] = !strati[b.dataset.forza]; mostraSchede(); disegna(); });
schede.addEventListener('change', (e) => { if (e.target.id === 'coloriForze') { coloriForze = e.target.checked; disegna(); } });
schede.addEventListener('pointerover', (e) => {
  const b = e.target.closest('[data-forza]'), f = b ? b.dataset.forza : null;
  if (f !== fuoco) { fuoco = f; $('spiegaForza').innerHTML = f ? `<b style="color:${rgb(FORZE[f].col)}">${FORZE[f].simbolo} ${FORZE[f].nome}</b> — ${FORZE[f].frase}${vista === 'dettaglio' ? ' <i>Le linee dove agisce sono accese; clic per nascondere o mostrare i suoi segni.</i>' : ''}` : ''; if (vista === 'dettaglio') disegna(); }
});
schede.addEventListener('pointerleave', () => { if (fuoco) { fuoco = null; $('spiegaForza').innerHTML = ''; disegna(); } });

// ---------- barra: strumenti, viste, composizioni, immagini, seme
function scegliStrumento(s) { strumento = s; document.querySelectorAll('[data-strumento]').forEach((b) => b.classList.toggle('attivo', b.dataset.strumento === s)); }
document.querySelectorAll('[data-strumento]').forEach((b) => b.addEventListener('click', () => { if (vista !== 'dettaglio') entra(corrente); scegliStrumento(b.dataset.strumento); }));
document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => { vista = b.dataset.vista; if (vista === 'pattern') sonda = null; aggiornaVista(); }));
const v3 = creaVista3D(tela3d, { spunte: () => ({ linee: true, pianta: true, taglio: true, forze: false, masse: true, campi: true }) });
function imposta3D() {
  const c = cel(), blocchi = c.domini.filter((d) => d.forma.tipo !== 'tutto').map((d) => ({ regione: d.forma, legge: [d.B && { tipo: 'magnetico' }, d.K && { tipo: 'materia' }, (d.n ?? 1) !== 1 && { tipo: 'luce' }].filter(Boolean) }));
  v3.imposta({ masse: c.masse, blocchi }, tracce);
}
function aggiornaVista() {
  document.querySelectorAll('[data-vista]').forEach((b) => b.classList.toggle('attivo', b.dataset.vista === vista));
  document.body.classList.toggle('in-pattern', vista === 'pattern');
  tela.hidden = vista === 'spaziotempo'; tela3d.hidden = vista !== 'spaziotempo';
  $('nomeElemento').textContent = vista === 'pattern' ? '' : el().nome;
  simula(); aggiornaTempo(); mostraSchede();
  if (vista === 'spaziotempo') imposta3D();
  disegna(); mostraPannello();
}
const scelta = $('composizione');
for (const k of Object.keys(COMPOSIZIONI)) scelta.insertAdjacentHTML('beforeend', `<option value="${k}">${k}</option>`);
scelta.addEventListener('change', () => { if (!COMPOSIZIONI[scelta.value]) return; ricorda(); carica(COMPOSIZIONI[scelta.value]()); });
function carica(nuova, { tieniImmagine = false } = {}) {
  comp = nuova; corrente = 0; scelto = null; sopra = null; sel = null; tempo = Infinity; if (!tieniImmagine) immagine = null;
  vista = 'pattern'; adattaPattern(); aggiornaVista();
}
$('elimina').addEventListener('click', elimina);
$('annulla').addEventListener('click', annulla); $('rifai').addEventListener('click', rifai);
function ripristina(s) { const o = JSON.parse(s); comp = o.comp; corrente = Math.min(o.corrente, comp.elementi.length - 1); sel = null; scelto = null; aggiornaVista(); }
function annulla() { if (!indietro.length) return; avanti.push(JSON.stringify({ comp, corrente })); ripristina(indietro.pop()); }
function rifai() { if (!avanti.length) return; indietro.push(JSON.stringify({ comp, corrente })); ripristina(avanti.pop()); }
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? rifai() : annulla(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); rifai(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') elimina();
  else if (e.key === 'Escape') { if (vista !== 'pattern' && !sel) { vista = 'pattern'; aggiornaVista(); return; } sel = null; scelto = null; scegliStrumento('seleziona'); disegna(); mostraPannello(); }
});
// il seme
$('seme').addEventListener('click', () => { $('testoSeme').value = JSON.stringify(comp, null, 1); $('dialogo').showModal(); });
$('usaSeme').addEventListener('click', () => { try { const n = JSON.parse($('testoSeme').value); if (!n.elementi || !n.reticolo) throw new Error('mancano elementi o reticolo'); ricorda(); carica(n); $('dialogo').close(); } catch (e) { alert('il seme non si legge: ' + e.message); } });
$('chiudiSeme').addEventListener('click', () => $('dialogo').close());
$('scarica').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(comp, null, 1)], { type: 'application/json' })); a.download = `${(comp.nome || 'seme').replace(/\W+/g, '_')}.json`; a.click(); });

// ---------- un'immagine: decodifica, lingua, e la composizione fisica
let lavoratore = null;
async function daImmagine(src, nome) {
  $('misure').textContent = `carico ${nome}…`; $('errore').textContent = '';
  const img = new Image(); img.src = src; await img.decode();
  const lato = Math.max(img.naturalWidth, img.naturalHeight), k = Math.min(1, 900 / lato);
  const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
  const x = cv.getContext('2d'); x.drawImage(img, 0, 0, cv.width, cv.height);
  const dati = x.getImageData(0, 0, cv.width, cv.height).data;
  if (lavoratore) lavoratore.terminate();
  lavoratore = new Worker(new URL('../studio/lavoratore.js', import.meta.url), { type: 'module' });
  lavoratore.onmessage = (ev) => {
    const m = ev.data;
    if (m.stato) $('misure').textContent = m.stato;
    if (m.errore) { $('errore').textContent = `la decodifica non è riuscita: ${m.errore.split('\n')[0]}`; console.error(m.errore); }
    if (m.fatto) {
      ricorda();
      immagine = { img, W: m.misure.larghezza, H: m.misure.altezza };
      carica(daSchema(m.schema, m.misure), { tieniImmagine: true });
      $('misure').textContent = `${nome}: letta in ${((m.tempi.lettura + m.tempi.lingua) / 1000).toFixed(1)} s · ${m.schema.parole.length} parole → ${comp.elementi.length} elementi fisici`;
      lavoratore.terminate(); lavoratore = null;
    }
  };
  lavoratore.postMessage({ img: { larghezza: cv.width, altezza: cv.height, canali: 4, dati } });
}
$('file').addEventListener('change', (ev) => { const f = ev.target.files[0]; if (f) daImmagine(URL.createObjectURL(f), f.name); });
$('esempio').addEventListener('click', () => daImmagine('./esempi/greco_6.png', 'la tavola greca n. 6'));

// ---------- il tempo: la fetta
const cursoreT = $('tempo');
function aggiornaTempo() {
  const inPattern = vista === 'pattern';
  document.querySelector('.sotto').classList.toggle('spento', inPattern);
  if (inPattern) { $('otempo').textContent = 'il tempo: entra in un elemento'; return; }
  const m = tMax(), t = Math.min(tempo, m); cursoreT.value = t / m; $('otempo').textContent = `t ${fmt(t)} / ${fmt(m)}`;
}
cursoreT.addEventListener('input', () => { if (vista === 'pattern') return; tempo = +cursoreT.value >= 0.999 ? Infinity : +cursoreT.value * tMax(); gioca = false; $('gioca').textContent = '▶'; aggiornaTempo(); disegna(); });
$('fetta').addEventListener('input', () => { fetta = +$('fetta').value * tMax(); $('ofetta').textContent = fetta ? `fetta ${fmt(fetta)}` : 'tutta la storia'; disegna(); });
$('gioca').addEventListener('click', () => { if (vista === 'pattern') return; gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶'; if (gioca && tempo >= tMax()) tempo = 0; if (gioca) passo(); });
let ultimo = 0;
function passo(ora = performance.now()) {
  if (!gioca) return;
  const m = tMax(); tempo = Math.min(m, (isFinite(tempo) ? tempo : 0) + (m / 8) * Math.min(0.05, (ora - (ultimo || ora)) / 1000)); ultimo = ora;
  if (tempo >= m) { tempo = Infinity; gioca = false; $('gioca').textContent = '▶'; ultimo = 0; }
  aggiornaTempo(); disegna();
  if (gioca) requestAnimationFrame(passo); else ultimo = 0;
}

addEventListener('resize', disegna);
// il lavoro resta: si salva da solo e si ritrova alla prossima apertura
const CHIAVE = 'stateyour:camera';
try { const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); if (s && Array.isArray(s.elementi) && s.elementi.length && s.reticolo) { comp = s; scelta.value = COMPOSIZIONI[s.nome] ? s.nome : ''; } } catch { /* un salvataggio rotto si ignora */ }
let salvato = '';
setInterval(() => { const j = JSON.stringify(comp); if (j !== salvato) { try { localStorage.setItem(CHIAVE, j); salvato = j; } catch { /* spazio finito */ } } }, 1500);
adattaPattern(); aggiornaVista();
window.__camera = {
  get comp() { return comp; }, get tracce() { return tracce; }, get vista() { return vista; }, pat,
  entra, carica, seleziona: (s) => { sel = s; disegna(); mostraPannello(); }, sonda: (s) => { sonda = s; disegna(); },
  vai: (v) => { vista = v; aggiornaVista(); }, tempo: (t) => { tempo = t; aggiornaTempo(); disegna(); },
};
