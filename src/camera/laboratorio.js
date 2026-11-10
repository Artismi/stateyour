// laboratorio.js — la camera come software di simulazione.
//
// Si guarda UN evento (una cella di spaziotempo) e si toccano direttamente le
// cose fisiche che lo producono: le sorgenti (dove e verso dove parte la
// particella), i campi (dove le cariche girano), la materia (dove frenano), le
// masse (dove lo spazio è curvo), gli specchi e i vetri. Ogni parametro ha una
// frase che dice cosa fa, e mentre lo muovi vedi in grigio com'era prima.
// Il tempo è una fetta: scorri e vedi l'evento accadere.

import { simulaMondo, dentro, raggio, gittata } from './mondo.js';
import { PRESET, clona, copie, dimensioneLastra, storia, fmt } from './esperimento.js';
import { creaVista3D } from '../vista3d.js';

const $ = (id) => document.getElementById(id);
const tela = $('tela'), ctx = tela.getContext('2d'), tela3d = $('tela3d'), pannello = $('pannello');
const COL = { carta: '#f3efe6', inchiostro: '#1c1b18', grigio: '#8a867c', accento: '#d0532f', piu: [60, 110, 220], meno: [210, 70, 50], vetro: [70, 170, 190], materia: [120, 110, 95], massa: '#2b2a26' };

let esp = PRESET.fiore();
let tracce = [], prima = null, sel = null, strumento = 'seleziona', vista = 'fiore';
let tempo = Infinity, fetta = 0, gioca = false, evidenzia = null;
const indietro = [], avanti = [];

// ---------- simulazione
function simula() {
  const t0 = performance.now();
  try { tracce = simulaMondo(esp.cella); $('errore').textContent = ''; } catch (e) { tracce = []; $('errore').textContent = e.message; }
  const ms = performance.now() - t0, punti = tracce.reduce((n, t) => n + t.punti.length, 0);
  $('misure').textContent = `${tracce.length} linee · ${punti} punti · ${ms.toFixed(0)} ms`;
  if (vista === 'spaziotempo') v3.imposta({ masse: esp.cella.masse }, tracce);
}
const tMax = () => { let m = 0; for (const t of tracce) m = Math.max(m, t.punti[t.punti.length - 1][3]); return m || esp.cella.tempo || 1; };
function ricorda() { indietro.push(JSON.stringify(esp)); if (indietro.length > 200) indietro.shift(); avanti.length = 0; }
function cambiato({ pannello: p = true } = {}) { simula(); aggiornaTempo(); disegna(); if (p) mostraPannello(); }

// ---------- coordinate
let vistaT = { s: 1, ox: 0, oy: 0 };
function adatta() {
  const dpr = devicePixelRatio || 1, W = (tela.width = tela.clientWidth * dpr), H = (tela.height = tela.clientHeight * dpr);
  const [lw, lh] = vista === 'pattern' ? dimensioneLastra(esp) : [esp.cella.larghezza, esp.cella.altezza];
  const s = Math.min((W * 0.92) / lw, (H * 0.92) / lh);
  vistaT = { s, ox: (W - lw * s) / 2, oy: (H - lh * s) / 2, dpr };
}
const aSchermo = (x, y) => [vistaT.ox + x * vistaT.s, vistaT.oy + y * vistaT.s];
const aMondo = (e) => { const r = tela.getBoundingClientRect(), d = vistaT.dpr; return [((e.clientX - r.left) * d - vistaT.ox) / vistaT.s, ((e.clientY - r.top) * d - vistaT.oy) / vistaT.s]; };
const px = (n) => (n * vistaT.dpr) / vistaT.s; // n pixel di schermo in unità del mondo

// ---------- disegno
function disegna() {
  if (vista === 'spaziotempo') { v3.tempo(Math.min(tempo, v3.tMax())); return; }
  adatta();
  const W = tela.width, H = tela.height, d = vistaT.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#e4dfd3'; ctx.fillRect(0, 0, W, H);
  const T = Math.min(tempo, tMax());
  if (vista === 'pattern') {
    for (const cp of copie(esp)) {
      const [a, b, c, dd, e, f] = cp.m, s = vistaT.s;
      ctx.setTransform(a * s, b * s, c * s, dd * s, vistaT.ox + e * s, vistaT.oy + f * s);
      ctx.fillStyle = COL.carta; ctx.fillRect(0, 0, esp.cella.larghezza, esp.cella.altezza);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = px(1); ctx.strokeRect(0, 0, esp.cella.larghezza, esp.cella.altezza);
      disegnaTracce(tracce, T, { colore: COL.inchiostro });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    scrivi('clicca un motivo per lavorarci: sono tutti lo stesso evento', 12 * d, H - 12 * d);
    return;
  }
  const s = vistaT.s;
  ctx.setTransform(s, 0, 0, s, vistaT.ox, vistaT.oy);
  ctx.fillStyle = COL.carta; ctx.fillRect(0, 0, esp.cella.larghezza, esp.cella.altezza);
  disegnaCampi();
  for (const m of esp.cella.masse) disegnaMassa(m, sel?.tipo === 'massa' && esp.cella.masse[sel.i] === m);
  esp.cella.pareti.forEach((p, i) => disegnaParete(p, sel?.tipo === 'parete' && sel.i === i));
  if (prima) disegnaTracce(prima, Infinity, { colore: 'rgba(120,115,105,0.35)', fine: true });
  disegnaTracce(tracce, T, { colore: COL.inchiostro });
  for (const dk of tracce.decadimenti || []) if (dk.t <= T) { ctx.strokeStyle = COL.accento; ctx.lineWidth = px(1.2); ctx.beginPath(); ctx.arc(dk.pos[0], dk.pos[1], px(4), 0, 7); ctx.stroke(); }
  if (T < tMax()) disegnaTeste(T);
  esp.cella.sorgenti.forEach((so, i) => disegnaSorgente(so, sel?.tipo === 'sorgente' && sel.i === i));
  if (sel?.tipo === 'dominio') maniglieDominio(esp.cella.domini[sel.i]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  legenda();
}
function scrivi(testo, x, y, colore = COL.grigio) { ctx.fillStyle = colore; ctx.font = `${12 * vistaT.dpr}px ui-monospace, monospace`; ctx.fillText(testo, x, y); }

function evidente(tr) {
  if (sel?.tipo === 'traccia') return tr.id === sel.i;
  if (evidenzia?.specie) return tr.specie.nome === evidenzia.specie;
  if (sel?.tipo === 'specie') return tr.specie.nome === sel.nome;
  if (sel?.tipo === 'sorgente') return tr.sorgente === sel.i;
  return false;
}
function disegnaTracce(lista, T, { colore, fine = false }) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const qualcosa = lista.some(evidente) && !fine;
  for (const tr of lista) {
    const P = tr.punti, ev = !fine && evidente(tr);
    ctx.strokeStyle = ev ? COL.accento : qualcosa ? 'rgba(28,27,24,0.45)' : colore;
    const t0 = fetta > 0 ? T - fetta : -Infinity;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (a[3] > T) break;
      if (!a[2] || !b[2] || b[3] < t0) continue;
      let bx = b[0], by = b[1];
      if (b[3] > T) { const u = (T - a[3]) / (b[3] - a[3] || 1); bx = a[0] + (b[0] - a[0]) * u; by = a[1] + (b[1] - a[1]) * u; }
      ctx.lineWidth = Math.max(px(0.6), (a[4] + b[4]) / 2);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bx, by); ctx.stroke();
    }
  }
}
function disegnaTeste(T) {
  for (const tr of tracce) {
    const P = tr.punti; if (P[0][3] > T || P[P.length - 1][3] < T) continue;
    let i = 0; while (i < P.length - 2 && P[i + 1][3] <= T) i++;
    const a = P[i], b = P[i + 1], u = (T - a[3]) / (b[3] - a[3] || 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
    ctx.fillStyle = tr.specie.luce ? '#e0a400' : (tr.specie.q ?? 0) > 0 ? `rgb(${COL.piu})` : `rgb(${COL.meno})`;
    ctx.beginPath(); ctx.arc(x, y, px(3.5), 0, 7); ctx.fill();
  }
}
function forma(f) {
  ctx.beginPath();
  if (f.tipo === 'tutto') ctx.rect(0, 0, esp.cella.larghezza, esp.cella.altezza);
  else if (f.tipo === 'cerchio') ctx.arc(f.centro[0], f.centro[1], f.r, 0, 7);
  else if (f.tipo === 'anello') { ctx.arc(f.centro[0], f.centro[1], f.r[1], 0, 7); ctx.moveTo(f.centro[0] + f.r[0], f.centro[1]); ctx.arc(f.centro[0], f.centro[1], f.r[0], 0, 7, true); }
  else if (f.tipo === 'poligono') f.punti.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
function disegnaCampi() {
  const cel = esp.cella, lista = [{ forma: { tipo: 'tutto' }, ...cel.fondo, fondo: true }, ...cel.domini];
  lista.forEach((dm, k) => {
    const scelto = sel?.tipo === 'dominio' && sel.i === k - 1;
    forma(dm.forma);
    if (dm.B) { ctx.fillStyle = `rgba(${dm.B > 0 ? COL.piu : COL.meno},${Math.min(0.22, 0.05 + Math.abs(dm.B) * 0.3)})`; ctx.fill('evenodd'); }
    if (dm.K) { ctx.fillStyle = `rgba(${COL.materia},${Math.min(0.18, 0.03 + dm.K / 400)})`; ctx.fill('evenodd'); }
    if ((dm.n ?? 1) !== 1) { ctx.fillStyle = `rgba(${COL.vetro},${Math.min(0.3, (dm.n - 1) * 0.4)})`; ctx.fill('evenodd'); }
    if (!dm.fondo) { ctx.setLineDash(scelto ? [] : [px(5), px(4)]); ctx.strokeStyle = scelto ? COL.accento : 'rgba(28,27,24,0.35)'; ctx.lineWidth = px(scelto ? 2 : 1); ctx.stroke(); ctx.setLineDash([]); }
  });
  // i simboli del campo magnetico: ⊙ esce dal foglio, ⊗ entra; il passo dice l'intensità
  const passo = px(34);
  for (let y = passo / 2; y < cel.altezza; y += passo) for (let x = passo / 2; x < cel.larghezza; x += passo) {
    let B = cel.fondo.B || 0; for (const dm of cel.domini) if (dentro(dm.forma, x, y)) B = dm.B ?? B;
    if (!B) continue;
    const r = px(3), c = `rgba(${B > 0 ? COL.piu : COL.meno},${Math.min(0.5, 0.12 + Math.abs(B))})`;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = px(1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    if (B > 0) { ctx.beginPath(); ctx.arc(x, y, px(1), 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.stroke(); }
  }
}
function maniglieDominio(dm) {
  if (!dm || dm.forma.tipo !== 'cerchio') return;
  const f = dm.forma; maniglia(f.centro[0], f.centro[1]); maniglia(f.centro[0] + f.r, f.centro[1]);
}
function maniglia(x, y) { ctx.fillStyle = '#fff'; ctx.strokeStyle = COL.accento; ctx.lineWidth = px(1.5); ctx.beginPath(); ctx.rect(x - px(4), y - px(4), px(8), px(8)); ctx.fill(); ctx.stroke(); }
function disegnaMassa(m, scelta) {
  // gli anelli dove la caduta vale 1, 1/4, 1/16 ... : più fitti, più curvo lo spazio
  const G = esp.cella.G ?? 1;
  for (const a of [4, 1, 0.25, 0.0625]) { const r = Math.sqrt((G * m.M) / a); if (r < (m.R ?? 0) * 1.1 || r > 400) continue; ctx.strokeStyle = 'rgba(43,42,38,0.18)'; ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], r, 0, 7); ctx.stroke(); }
  ctx.fillStyle = COL.massa; ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], Math.max(m.R ?? 0, px(4)), 0, 7); ctx.fill();
  if (scelta) { ctx.strokeStyle = COL.accento; ctx.lineWidth = px(2); ctx.stroke(); }
}
function disegnaParete(p, scelta) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = scelta ? COL.accento : p.tipo === 'assorbe' ? '#111' : '#7d8a92'; ctx.lineWidth = px(p.tipo === 'assorbe' ? 4 : 3);
  ctx.beginPath(); ctx.moveTo(...p.a); ctx.lineTo(...p.b); ctx.stroke();
  if (p.tipo !== 'assorbe') { ctx.strokeStyle = '#e8eef1'; ctx.lineWidth = px(1); ctx.stroke(); }
  if (scelta) { maniglia(...p.a); maniglia(...p.b); }
}
function puntaFreccia(so) {
  const sp = specieDi(so), L = sp?.luce ? 22 : 6 + (so.v ?? 0) * 2.2;
  return [so.pos[0] + Math.cos(so.dir ?? 0) * px(L * 1.6), so.pos[1] + Math.sin(so.dir ?? 0) * px(L * 1.6)];
}
function disegnaSorgente(so, scelta) {
  const [x, y] = so.pos, [tx, ty] = puntaFreccia(so);
  ctx.strokeStyle = scelta ? COL.accento : '#2f6d4f'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = px(2);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  const a = Math.atan2(ty - y, tx - x), h = px(7);
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - h * Math.cos(a - 0.45), ty - h * Math.sin(a - 0.45)); ctx.lineTo(tx - h * Math.cos(a + 0.45), ty - h * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, px(5), 0, 7); ctx.fill(); ctx.stroke();
}
function legenda() {
  const d = vistaT.dpr, H = tela.height; let x = 12 * d;
  const voci = [['⊙ campo B > 0', `rgb(${COL.piu})`], ['⊗ campo B < 0', `rgb(${COL.meno})`], ['▒ materia', `rgb(${COL.materia})`], ['▒ vetro', `rgb(${COL.vetro})`], ['● massa', COL.massa], ['— specchio', '#7d8a92'], ['→ sorgente', '#2f6d4f'], ['○ decadimento', COL.accento]];
  for (const [t, c] of voci) { scrivi(t, x, H - 12 * d, c); x += ctx.measureText(t).width + 16 * d; }
}

// ---------- scegliere e trascinare
const specieDi = (so) => (typeof so.specie === 'string' ? { nome: so.specie, ...esp.cella.specie[so.specie] } : so.specie);
function colpisci(x, y) {
  const r = px(9), cel = esp.cella;
  for (let i = cel.sorgenti.length - 1; i >= 0; i--) {
    const so = cel.sorgenti[i], [tx, ty] = puntaFreccia(so);
    if (Math.hypot(x - tx, y - ty) < r) return { tipo: 'sorgente', i, parte: 'freccia' };
    if (Math.hypot(x - so.pos[0], y - so.pos[1]) < r) return { tipo: 'sorgente', i, parte: 'corpo' };
  }
  if (sel?.tipo === 'dominio') { const f = cel.domini[sel.i]?.forma; if (f?.tipo === 'cerchio') { if (Math.hypot(x - f.centro[0] - f.r, y - f.centro[1]) < r) return { tipo: 'dominio', i: sel.i, parte: 'raggio' }; if (Math.hypot(x - f.centro[0], y - f.centro[1]) < r) return { tipo: 'dominio', i: sel.i, parte: 'centro' }; } }
  for (let i = cel.masse.length - 1; i >= 0; i--) { const m = cel.masse[i]; if (Math.hypot(x - m.pos[0], y - m.pos[1]) < Math.max(r, m.R ?? 0)) return { tipo: 'massa', i, parte: 'corpo' }; }
  for (let i = cel.pareti.length - 1; i >= 0; i--) {
    const p = cel.pareti[i];
    if (Math.hypot(x - p.a[0], y - p.a[1]) < r) return { tipo: 'parete', i, parte: 'a' };
    if (Math.hypot(x - p.b[0], y - p.b[1]) < r) return { tipo: 'parete', i, parte: 'b' };
    if (distSeg(x, y, p.a, p.b) < r * 0.7) return { tipo: 'parete', i, parte: 'tutta' };
  }
  // una linea della pellicola
  let best = null, bd = px(7);
  const T = Math.min(tempo, tMax());
  for (const tr of tracce) for (let k = 1; k < tr.punti.length; k++) { const a = tr.punti[k - 1], b = tr.punti[k]; if (a[3] > T) break; if (!a[2] || !b[2]) continue; const dd = distSeg(x, y, a, b) - b[4] / 2; if (dd < bd) { bd = dd; best = { tipo: 'traccia', i: tr.id }; } }
  if (best) return best;
  // un dominio: l'ultimo che contiene il punto
  for (let i = cel.domini.length - 1; i >= 0; i--) if (cel.domini[i].forma.tipo !== 'tutto' && dentro(cel.domini[i].forma, x, y)) return { tipo: 'dominio', i, parte: 'centro' };
  for (let i = cel.domini.length - 1; i >= 0; i--) if (cel.domini[i].forma.tipo === 'tutto') return { tipo: 'dominio', i, parte: 'nessuna' };
  return null;
}
function distSeg(x, y, a, b) { const sx = b[0] - a[0], sy = b[1] - a[1], l2 = sx * sx + sy * sy || 1e-12, u = Math.max(0, Math.min(1, ((x - a[0]) * sx + (y - a[1]) * sy) / l2)); return Math.hypot(x - a[0] - u * sx, y - a[1] - u * sy); }

let presa = null;
tela.addEventListener('pointerdown', (e) => {
  if (vista === 'pattern') { vista = 'fiore'; aggiornaVista(); return; }
  const [x, y] = aMondo(e), cel = esp.cella;
  if (strumento !== 'seleziona') { aggiungi(strumento, x, y); return; }
  const h = colpisci(x, y);
  sel = h ? { tipo: h.tipo, i: h.i } : null;
  if (h && h.parte && h.parte !== 'nessuna' && h.tipo !== 'traccia') {
    ricorda(); prima = tracce;
    const o = h.tipo === 'sorgente' ? cel.sorgenti[h.i] : h.tipo === 'massa' ? cel.masse[h.i] : h.tipo === 'parete' ? cel.pareti[h.i] : cel.domini[h.i];
    presa = { ...h, o, x, y, orig: clona(o) };
    tela.setPointerCapture(e.pointerId);
  }
  disegna(); mostraPannello();
});
tela.addEventListener('pointermove', (e) => {
  if (!presa) return;
  const [x, y] = aMondo(e), dx = x - presa.x, dy = y - presa.y, o = presa.o, g = presa.orig;
  if (presa.tipo === 'sorgente' && presa.parte === 'corpo') o.pos = [g.pos[0] + dx, g.pos[1] + dy];
  if (presa.tipo === 'sorgente' && presa.parte === 'freccia') {
    o.dir = Math.atan2(y - o.pos[1], x - o.pos[0]);
    if (!specieDi(o)?.luce) o.v = Math.max(0, (Math.hypot(x - o.pos[0], y - o.pos[1]) / px(1.6) - 6) / 2.2);
  }
  if (presa.tipo === 'massa') o.pos = [g.pos[0] + dx, g.pos[1] + dy];
  if (presa.tipo === 'parete') { if (presa.parte !== 'b') o.a = [g.a[0] + dx, g.a[1] + dy]; if (presa.parte !== 'a') o.b = [g.b[0] + dx, g.b[1] + dy]; }
  if (presa.tipo === 'dominio' && o.forma.tipo === 'cerchio') {
    if (presa.parte === 'raggio') o.forma.r = Math.max(2, Math.hypot(x - o.forma.centro[0], y - o.forma.centro[1]));
    else o.forma.centro = [g.forma.centro[0] + dx, g.forma.centro[1] + dy];
  }
  arrotonda(o);
  simula(); disegna();
});
tela.addEventListener('pointerup', () => { if (presa) { presa = null; prima = null; disegna(); mostraPannello(); } });
function arrotonda(o) { const r = (v) => Math.round(v * 100) / 100; if (o.pos) o.pos = o.pos.map(r); if (o.a) { o.a = o.a.map(r); o.b = o.b.map(r); } if (o.forma?.centro) { o.forma.centro = o.forma.centro.map(r); o.forma.r = r(o.forma.r); } if (o.v != null) o.v = r(o.v); if (o.dir != null) o.dir = Math.round(o.dir * 1e4) / 1e4; }

function aggiungi(cosa, x, y) {
  ricorda(); const cel = esp.cella;
  if (cosa === 'sorgente') {
    const nome = Object.keys(cel.specie).find((k) => (cel.specie[k].q ?? 0) !== 0) || (cel.specie.carica = { q: 1, m: 1 }, 'carica');
    cel.sorgenti.push({ pos: [x, y], dir: 0, v: 8, specie: nome }); sel = { tipo: 'sorgente', i: cel.sorgenti.length - 1 };
  } else if (cosa === 'campo') { cel.domini.push({ nome: 'campo', forma: { tipo: 'cerchio', centro: [x, y], r: 40 }, B: 0.3, K: 0, n: 1 }); sel = { tipo: 'dominio', i: cel.domini.length - 1 }; }
  else if (cosa === 'materia') { cel.domini.push({ nome: 'materia', forma: { tipo: 'cerchio', centro: [x, y], r: 40 }, B: cel.fondo.B, K: 20, n: 1 }); sel = { tipo: 'dominio', i: cel.domini.length - 1 }; }
  else if (cosa === 'vetro') { cel.domini.push({ nome: 'vetro', forma: { tipo: 'cerchio', centro: [x, y], r: 30 }, B: 0, K: 0, n: 1.5 }); sel = { tipo: 'dominio', i: cel.domini.length - 1 }; }
  else if (cosa === 'massa') { cel.masse.push({ pos: [x, y], M: 300, R: 5 }); sel = { tipo: 'massa', i: cel.masse.length - 1 }; }
  else if (cosa === 'specchio') { cel.pareti.push({ a: [x - 25, y], b: [x + 25, y], tipo: 'specchio' }); sel = { tipo: 'parete', i: cel.pareti.length - 1 }; }
  scegliStrumento('seleziona'); cambiato();
}
function elimina() {
  if (!sel) return; const cel = esp.cella; ricorda();
  const lista = { sorgente: cel.sorgenti, dominio: cel.domini, massa: cel.masse, parete: cel.pareti }[sel.tipo];
  if (lista) lista.splice(sel.i, 1);
  sel = null; cambiato();
}

// ---------- il pannello: solo la cosa che hai in mano, e cosa fa ogni numero
const SPIEGA = {
  carica: 'carica q: il segno dice da che parte gira nel campo (+ e − girano opposte); più carica, più stretta la curva, più spessa la traccia, frena prima. Zero: non gira, non frena, non si vede.',
  massa: "massa m: l'inerzia. Alla stessa velocità, più pesante = curva più larga (r = m·v/(q·B)) e più strada. Ma chi nasce da un decadimento riceve una spinta fissa: lì più pesante = più lenta, e si ferma prima. La gravità invece la fa cadere uguale, leggera o pesante.",
  energia: "energia: per la luce fa le veci della massa. Decide quanta spinta hanno le figlie quando il fotone si converte.",
  vita: 'vita: dopo quanto tempo decade nelle sue figlie. Vuoto = stabile, non decade mai.',
  visibile: "visibile: se lascia traccia sulla pellicola. Nelle camere a bolle le neutre e la luce non lasciano bolle.",
  angolo: "angolo: la direzione della figlia rispetto a quella della madre, in gradi.",
  quota: "quota: quale parte della spinta (quantità di moto) della madre si porta via. Più spinta, più veloce: curva più larga, più strada.",
  vInizio: "velocità alla nascita: più veloce, curva più larga e più strada prima di fermarsi. La freccia sulla scena è la stessa cosa: trascinala.",
  direzione: "direzione: verso dove parte. Trascina la punta della freccia.",
  t0: "partenza: in che istante la sorgente emette.",
  B: "campo magnetico B: perpendicolare al foglio. Fa girare le cariche: il raggio è m·v/(q·B), quindi più campo = curve più strette. Il segno sceglie il verso (⊙ positivo, ⊗ negativo).",
  K: "materia K: quanto è denso il mezzo. Frena le cariche (più lente, frenano più in fretta): la curva si stringe in spirale fino all'occhio. Zero: vuoto.",
  n: "indice n: per la luce, quanto è 'lento' il mezzo (vetro 1,5, acqua 1,33). Al bordo la luce si rifrange; da un mezzo lento a uno veloce può riflettersi tutta.",
  raggioDominio: "raggio: fin dove arriva questo dominio. Trascina il quadratino sul bordo.",
  M: "massa M: quanto curva lo spazio intorno. Le particelle cadono verso di lei con a = G·M/r², la luce si piega il doppio. Ma nessuno la sposta: lei resta ferma.",
  R: "raggio R: il corpo della massa. Chi lo tocca ci cade dentro e si ferma.",
  tipoParete: "specchio: riflette tutto, angolo di uscita uguale a quello di entrata. Assorbe: ferma qualunque cosa la tocchi.",
  c: "velocità della luce c in questo universo: il limite. La luce va a c/n.",
  tempo: "durata dell'esposizione: quanto a lungo la pellicola registra.",
  w0: "spessore base della pellicola: quanto è grossa la bolla di una carica unitaria veloce.",
  saturazione: "saturazione: quanto può ingrossare la traccia quando la particella rallenta (l'occhio finale).",
  vRif: "velocità di riferimento: sotto questa velocità la traccia comincia a ingrossare.",
};

function mostraPannello() {
  const cel = esp.cella, h = [];
  if (!sel) {
    h.push(`<h2>${esp.nome}</h2><p class="nota">${esp.nota || ''}</p>`);
    h.push(`<p class="aiuto">Tocca una cosa sulla scena: una linea, una freccia verde (sorgente), una zona colorata (campo, materia, vetro), un disco scuro (massa), uno specchio. Qui vedrai solo lei e cosa fa ogni suo numero.</p>`);
    h.push(`<h2>che cosa c'è in questa cella</h2><div class="elenco">`);
    cel.sorgenti.forEach((so, i) => h.push(`<div data-sel="sorgente:${i}">→ sorgente ${i + 1}: <b>${specieDi(so).nome}</b> ${specieDi(so).luce ? 'luce' : `v ${fmt(so.v ?? 0)}`}</div>`));
    cel.domini.forEach((d, i) => h.push(`<div data-sel="dominio:${i}">▒ ${d.nome || 'dominio'}: ${descriviDominio(d)}</div>`));
    cel.masse.forEach((m, i) => h.push(`<div data-sel="massa:${i}">● ${m.nome || 'massa'} M ${fmt(m.M)}</div>`));
    cel.pareti.forEach((p, i) => h.push(`<div data-sel="parete:${i}">— ${p.tipo} ${i + 1}</div>`));
    h.push(`</div><h2>le specie (cosa sono le particelle)</h2><div class="elenco">`);
    for (const nome of Object.keys(cel.specie)) h.push(`<div data-specie="${nome}">◦ <b>${nome}</b> ${descriviSpecie(cel.specie[nome])}</div>`);
    h.push(`</div><h2>l'universo della cella</h2>`);
    h.push(`<div class="nota">fondo (dove non c'è nessun dominio)</div>`);
    h.push(cursore('B', cel.fondo, 'B', -1, 1, 0.005));
    h.push(cursore('K', cel.fondo, 'K', 0, 120, 0.5, 'materia K'));
    h.push(cursore('c', cel, 'c', 5, 80, 1, 'velocità della luce c'));
    h.push(cursore('tempo', cel, 'tempo', 1, 200, 0.5, 'durata'));
    h.push(`<div class="nota">la pellicola</div>`);
    h.push(cursore('w0', cel.pellicola, 'w0', 0.1, 4, 0.05, 'spessore base'));
    h.push(cursore('saturazione', cel.pellicola, 'saturazione', 1, 10, 0.1));
    h.push(cursore('vRif', cel.pellicola, 'vRif', 0.5, 30, 0.5, 'velocità di riferimento'));
    h.push(`<label class="riga">bordo <select data-bordo>${['aperto', 'periodico', 'specchio'].map((b) => `<option ${cel.bordo === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>`);
  } else if (sel.tipo === 'traccia') {
    const tr = tracce.find((t) => t.id === sel.i);
    if (!tr) { sel = null; return mostraPannello(); }
    h.push(`<h2>una linea</h2><p class="storia">${storia(tr, esp)}</p>`);
    h.push(`<button data-sel="sorgente:${tr.sorgente}">vai alla sua sorgente</button>`);
    if (tr.specie.nome) h.push(pannelloSpecie(tr.specie.nome));
  } else if (sel.tipo === 'specie') {
    h.push(pannelloSpecie(sel.nome));
  } else if (sel.tipo === 'sorgente') {
    const so = cel.sorgenti[sel.i], sp = specieDi(so);
    h.push(`<h2>sorgente ${sel.i + 1}</h2><p class="nota">il punto da cui parte la storia: qui nasce un ${sp.nome}. Trascina il cerchio per spostarla, la punta della freccia per la direzione${sp.luce ? '' : ' e la velocità'}.</p>`);
    h.push(`<label class="riga">che cosa emette <select data-specie-sorgente>${Object.keys(cel.specie).map((k) => `<option ${k === sp.nome ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`);
    if (!sp.luce) h.push(cursore('vInizio', so, 'v', 0, 30, 0.05, 'velocità'));
    h.push(cursoreAngolo(so));
    h.push(cursore('t0', so, 't0', 0, cel.tempo, 0.05, 'partenza'));
    h.push(pannelloSpecie(sp.nome));
  } else if (sel.tipo === 'dominio') {
    const d = cel.domini[sel.i];
    h.push(`<h2>${d.nome || 'dominio'}</h2><p class="nota">una zona del piano con le sue proprietà, ferme nel tempo. ${d.forma.tipo === 'cerchio' ? 'Trascina il centro per spostarla, il quadratino sul bordo per allargarla.' : 'Vale in tutta la cella.'}</p>`);
    h.push(`<label class="riga">forma <select data-forma>${['tutto', 'cerchio'].map((f) => `<option ${d.forma.tipo === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`);
    if (d.forma.tipo === 'cerchio') h.push(cursore('raggioDominio', d.forma, 'r', 2, 200, 0.5, 'raggio'));
    h.push(cursore('B', d, 'B', -1, 1, 0.005, 'campo magnetico B'));
    h.push(cursore('K', d, 'K', 0, 120, 0.5, 'materia K'));
    h.push(cursore('n', d, 'n', 1, 2.5, 0.01, 'indice n'));
    h.push(misureDominio(d));
  } else if (sel.tipo === 'massa') {
    const m = cel.masse[sel.i];
    h.push(`<h2>${m.nome || 'massa'}</h2><p class="nota">un corpo fermo che curva lo spazio. Trascinalo. Gli anelli grigi: dove la caduta è forte (stretti) e dove si attenua.</p>`);
    h.push(cursore('M', m, 'M', 0, 4000, 5, 'massa M'));
    h.push(cursore('R', m, 'R', 0, 40, 0.5, 'raggio R'));
  } else if (sel.tipo === 'parete') {
    const p = cel.pareti[sel.i];
    h.push(`<h2>${p.tipo} ${sel.i + 1}</h2><p class="nota">un segmento perpendicolare al piano. Trascina gli estremi o il centro.</p>`);
    h.push(`<label class="riga">tipo <select data-parete>${['specchio', 'assorbe'].map((f) => `<option ${p.tipo === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label><p class="spiega">${SPIEGA.tipoParete}</p>`);
  }
  if (sel && !['traccia', 'specie'].includes(sel.tipo)) h.push(`<div class="riga-bottoni"><button data-azione="elimina">elimina</button><button data-azione="chiudi">chiudi</button></div>`);
  else if (sel) h.push(`<div class="riga-bottoni"><button data-azione="chiudi">chiudi</button></div>`);
  pannello.innerHTML = h.join('');
}
function descriviDominio(d) { const p = []; if (d.B) p.push(`campo ${fmt(d.B)}`); if (d.K) p.push(`materia ${fmt(d.K)}`); if ((d.n ?? 1) !== 1) p.push(`vetro n ${fmt(d.n)}`); return p.join(', ') || 'vuoto'; }
function descriviSpecie(s) { if (s.luce) return `luce${s.vita != null ? `, si converte dopo ${fmt(s.vita)}` : ''}`; return `q ${fmt(s.q ?? 0)}, m ${fmt(s.m ?? 1)}${s.vita != null ? `, decade dopo ${fmt(s.vita)}` : ''}`; }
function misureDominio(d) {
  const righe = [];
  for (const [nome, s] of Object.entries(esp.cella.specie)) {
    if (s.luce || !s.q) continue;
    const tr = tracce.find((t) => t.specie.nome === nome); if (!tr) continue;
    const P = tr.punti, v = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) / ((P[1][3] - P[0][3]) || 1);
    const r = d.B ? raggio(s, v, d.B) : Infinity, g = d.K ? gittata(s, v, d.K) : Infinity;
    righe.push(`<div>${nome} (v ${fmt(v)}): gira con raggio ${isFinite(r) ? fmt(r) : '∞'}, si ferma dopo ${isFinite(g) ? fmt(g) : '∞'}</div>`);
  }
  return righe.length ? `<div class="misure"><div class="nota">qui dentro, alla nascita:</div>${righe.join('')}</div>` : '';
}
function pannelloSpecie(nome) {
  const s = esp.cella.specie[nome]; if (!s) return '';
  const h = [`<h2>la specie: ${nome}</h2><p class="nota">vale per tutte le ${nome} della cella (le linee evidenziate). Cambiala e cambiano tutte.</p>`];
  h.push(`<div data-evidenzia="${nome}">`);
  if (s.luce) h.push(cursore('energia', s, 'm', 0.05, 5, 0.01, 'energia', nome));
  else { h.push(cursore('carica', s, 'q', -3, 3, 0.1, 'carica q', nome)); h.push(cursore('massa', s, 'm', 0.1, 40, 0.1, 'massa m', nome)); }
  h.push(`<label class="riga"><span>stabile</span><input type="checkbox" data-stabile="${nome}" ${s.vita == null ? 'checked' : ''}></label>`);
  if (s.vita != null) h.push(cursore('vita', s, 'vita', 0.001, 40, 0.01, 'vita', nome));
  h.push(`<label class="riga"><span>visibile</span><input type="checkbox" data-visibile="${nome}" ${(s.visibile ?? (s.luce || (s.q ?? 0) !== 0)) ? 'checked' : ''}></label><p class="spiega">${SPIEGA.visibile}</p>`);
  if (s.vita != null && s.figli?.length) {
    h.push(`<div class="nota">quando decade nasce:</div>`);
    const gruppi = new Map();
    s.figli.forEach((f, k) => { const key = f.specie; if (!gruppi.has(key)) gruppi.set(key, []); gruppi.get(key).push(k); });
    s.figli.forEach((f, k) => {
      if (s.figli.length > 4 && k >= 4) return;
      h.push(`<div class="figlia"><b>${f.specie}</b> <button class="piccolo" data-specie="${f.specie}">apri</button>`);
      h.push(cursore('angolo', f, 'angolo', -180, 180, 0.5, 'angolo', nome));
      if (f.v != null) h.push(cursore('vInizio', f, 'v', 0, 30, 0.05, 'velocità', nome)); else h.push(cursore('quota', f, 'quota', 0, 1, 0.01, 'quota', nome));
      h.push(`</div>`);
    });
    if (s.figli.length > 4) h.push(`<p class="nota">… e altre ${s.figli.length - 4} figlie uguali in raggiera: <label class="riga">quante in tutto <input type="number" min="1" max="24" value="${s.figli.filter((f) => f.specie === s.figli[0].specie).length}" data-raggiera="${nome}"></label></p>`);
  }
  h.push(`</div>`);
  return h.join('');
}
let idCursore = 0;
const registro = new Map();
function cursore(chiave, oggetto, campo, min, max, passo, etichetta = chiave, specie = null) {
  const id = `c${idCursore++}`, val = oggetto[campo] ?? 0;
  registro.set(id, { oggetto, campo });
  return `<div class="cursore" ${specie ? `data-evidenzia="${specie}"` : ''}><label for="${id}">${etichetta}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${passo}" value="${val}"><input type="number" data-per="${id}" step="${passo}" value="${val}"><p class="spiega">${SPIEGA[chiave] || ''}</p></div>`;
}
function cursoreAngolo(so) {
  const id = `c${idCursore++}`; registro.set(id, { oggetto: so, campo: 'dir', gradi: true });
  const g = Math.round(((so.dir ?? 0) * 180) / Math.PI * 10) / 10;
  return `<div class="cursore"><label for="${id}">direzione (gradi)</label><input type="range" id="${id}" min="-180" max="180" step="0.5" value="${g}"><input type="number" data-per="${id}" step="0.5" value="${g}"><p class="spiega">${SPIEGA.direzione}</p></div>`;
}
pannello.addEventListener('pointerdown', (e) => { if (e.target.type === 'range') { ricorda(); prima = tracce; } });
pannello.addEventListener('input', (e) => {
  const el = e.target, id = el.dataset.per || el.id, r = registro.get(id);
  if (!r) return;
  if (el.type === 'number' && !prima) { ricorda(); prima = tracce; }
  const v = parseFloat(el.value); if (!isFinite(v)) return;
  r.oggetto[r.campo] = r.gradi ? (v * Math.PI) / 180 : v;
  const gemello = el.type === 'range' ? pannello.querySelector(`[data-per="${id}"]`) : $(id); if (gemello) gemello.value = el.value;
  simula(); aggiornaTempo(); disegna();
});
pannello.addEventListener('change', (e) => {
  const el = e.target, cel = esp.cella;
  if (registro.has(el.dataset.per || el.id)) { prima = null; disegna(); return; }
  ricorda();
  if (el.dataset.bordo != null) cel.bordo = el.value;
  if (el.dataset.forma != null) { const d = cel.domini[sel.i]; d.forma = el.value === 'tutto' ? { tipo: 'tutto' } : { tipo: 'cerchio', centro: [cel.larghezza / 2, cel.altezza / 2], r: cel.larghezza * 0.3 }; }
  if (el.dataset.parete != null) cel.pareti[sel.i].tipo = el.value;
  if (el.dataset.specieSorgente != null) cel.sorgenti[sel.i].specie = el.value;
  if (el.dataset.stabile) { const s = cel.specie[el.dataset.stabile]; if (el.checked) delete s.vita; else s.vita = 2; }
  if (el.dataset.visibile) cel.specie[el.dataset.visibile].visibile = el.checked;
  if (el.dataset.raggiera) {
    const s = cel.specie[el.dataset.raggiera], N = Math.max(1, Math.min(24, parseInt(el.value) || 1)), tipo = s.figli[0].specie, modello = s.figli[0];
    const altri = s.figli.filter((f) => f.specie !== tipo), nuovi = [];
    for (let k = 0; k < N; k++) nuovi.push({ ...modello, angolo: Math.round(((360 * k) / N) * 1000) / 1000 });
    s.figli = [...nuovi, ...altri];
  }
  cambiato();
});
pannello.addEventListener('click', (e) => {
  const el = e.target.closest('[data-sel],[data-specie],[data-azione]'); if (!el) return;
  if (el.dataset.sel) { const [tipo, i] = el.dataset.sel.split(':'); sel = { tipo, i: +i }; }
  else if (el.dataset.specie && el.tagName !== 'SELECT') sel = { tipo: 'specie', nome: el.dataset.specie };
  else if (el.dataset.azione === 'elimina') return elimina();
  else if (el.dataset.azione === 'chiudi') sel = null;
  disegna(); mostraPannello();
});
pannello.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-evidenzia]'); const n = el ? el.dataset.evidenzia : null; if (n !== evidenzia?.specie) { evidenzia = n ? { specie: n } : null; disegna(); } });
pannello.addEventListener('pointerleave', () => { if (evidenzia) { evidenzia = null; disegna(); } });

// ---------- barra: strumenti, viste, esperimenti, seme
function scegliStrumento(s) { strumento = s; document.querySelectorAll('[data-strumento]').forEach((b) => b.classList.toggle('attivo', b.dataset.strumento === s)); tela.style.cursor = s === 'seleziona' ? 'default' : 'crosshair'; }
document.querySelectorAll('[data-strumento]').forEach((b) => b.addEventListener('click', () => scegliStrumento(b.dataset.strumento)));
document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => { vista = b.dataset.vista; aggiornaVista(); }));
function aggiornaVista() {
  document.querySelectorAll('[data-vista]').forEach((b) => b.classList.toggle('attivo', b.dataset.vista === vista));
  tela.hidden = vista === 'spaziotempo'; tela3d.hidden = vista !== 'spaziotempo';
  if (vista === 'spaziotempo') v3.imposta({ masse: esp.cella.masse }, tracce);
  disegna();
}
const scelta = $('esperimento');
for (const k of Object.keys(PRESET)) scelta.insertAdjacentHTML('beforeend', `<option value="${k}">${PRESET[k]().nome}</option>`);
scelta.addEventListener('change', () => { ricorda(); esp = PRESET[scelta.value](); sel = null; tempo = Infinity; aggiornaRipetizione(); cambiato(); });
$('elimina').addEventListener('click', elimina);
$('annulla').addEventListener('click', annulla); $('rifai').addEventListener('click', rifai);
function annulla() { if (!indietro.length) return; avanti.push(JSON.stringify(esp)); esp = JSON.parse(indietro.pop()); sel = null; aggiornaRipetizione(); cambiato(); }
function rifai() { if (!avanti.length) return; indietro.push(JSON.stringify(esp)); esp = JSON.parse(avanti.pop()); sel = null; aggiornaRipetizione(); cambiato(); }
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? rifai() : annulla(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); rifai(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') elimina();
  else if (e.key === 'Escape') { sel = null; scegliStrumento('seleziona'); disegna(); mostraPannello(); }
});
// la ripetizione
function aggiornaRipetizione() { const r = esp.ripetizione || { tipo: 'nessuna' }; $('ripTipo').value = r.tipo; $('ripCol').value = r.colonne ?? 3; $('ripRighe').value = r.righe ?? 3; }
for (const id of ['ripTipo', 'ripCol', 'ripRighe']) $(id).addEventListener('change', () => { ricorda(); esp.ripetizione = { tipo: $('ripTipo').value, colonne: +$('ripCol').value, righe: +$('ripRighe').value }; if (vista !== 'pattern') vista = 'pattern'; aggiornaVista(); });
// il seme
$('seme').addEventListener('click', () => { $('testoSeme').value = JSON.stringify(esp, null, 1); $('dialogo').showModal(); });
$('usaSeme').addEventListener('click', () => { try { const n = JSON.parse($('testoSeme').value); ricorda(); esp = n; sel = null; aggiornaRipetizione(); cambiato(); $('dialogo').close(); } catch (e) { alert('il seme non si legge: ' + e.message); } });
$('chiudiSeme').addEventListener('click', () => $('dialogo').close());
$('scarica').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(esp, null, 1)], { type: 'application/json' })); a.download = `${(esp.nome || 'seme').replace(/\W+/g, '_')}.json`; a.click(); });

// ---------- il tempo: la fetta
const cursoreT = $('tempo');
function aggiornaTempo() { const m = tMax(), t = Math.min(tempo, m); cursoreT.value = t / m; $('otempo').textContent = `t ${fmt(t)} / ${fmt(m)}`; }
cursoreT.addEventListener('input', () => { tempo = +cursoreT.value >= 0.999 ? Infinity : +cursoreT.value * tMax(); gioca = false; $('gioca').textContent = '▶'; aggiornaTempo(); disegna(); });
$('fetta').addEventListener('input', () => { fetta = (+$('fetta').value) * tMax(); $('ofetta').textContent = fetta ? `fetta ${fmt(fetta)}` : 'tutta la storia'; disegna(); });
$('gioca').addEventListener('click', () => { gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶'; if (gioca && tempo >= tMax()) tempo = 0; if (gioca) passo(); });
let ultimo = 0;
function passo(ora = performance.now()) {
  if (!gioca) return;
  const m = tMax(); tempo = Math.min(m, (isFinite(tempo) ? tempo : 0) + (m / 6) * Math.min(0.05, (ora - (ultimo || ora)) / 1000)); ultimo = ora;
  if (tempo >= m) { tempo = Infinity; gioca = false; $('gioca').textContent = '▶'; ultimo = 0; }
  aggiornaTempo(); disegna();
  if (gioca) requestAnimationFrame(passo); else ultimo = 0;
}

const v3 = creaVista3D(tela3d, { spunte: () => ({ linee: true, pianta: true, taglio: true, forze: false, masse: true, campi: false }) });
addEventListener('resize', disegna);
aggiornaRipetizione(); simula(); aggiornaVista(); mostraPannello(); aggiornaTempo();
const disegnaOriginale = disegna;
// il tempo segue ogni ridisegno
window.__camera = { get esp() { return esp; }, set esp(v) { esp = v; cambiato(); }, get tracce() { return tracce; }, seleziona: (s) => { sel = s; disegna(); mostraPannello(); }, vista: (v) => { vista = v; aggiornaVista(); }, tempo: (t) => { tempo = t; aggiornaTempo(); disegnaOriginale(); } };
