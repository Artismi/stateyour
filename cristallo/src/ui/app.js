// app.js — «Costruisci»: l'interfaccia per un bambino. Il pattern grande al centro, una fila di icone in basso,
// nessun numero in vista (i numeri stanno nel pannello ⓘ, chiuso all'inizio). Ogni gesto cambia subito il disegno;
// ↩ ↪ ci sono sempre e 🎲 porta sempre da qualche parte. Il calcolo e il disegno stanno nel worker.

import { PREDEFINITO, scrivi, leggi, casuale, POSTI } from '../indirizzo.js';
import { creaCristallo, vincola, vettoriCella, combina, SISTEMI, NOMI_TECNICI, punto, versore, vettore } from '../reticolo.js';
import { creaFinestra } from '../finestra.js';
import { direzioniSemplici, scriviIndici } from '../indici.js';
import { sitoVicino } from '../simmetria.js';

const $ = (id) => document.getElementById(id);
const tela = $('tela'), sopra = $('sopra'), octx = sopra.getContext('2d');

// ---------- lo stato: un indirizzo, e la storia degli indirizzi per ↩ ↪
let p = structuredClone(PREDEFINITO);
p.reticolo = { sistema: 'cubico', centratura: 'P', a: 1, b: 1, c: 1, alfa: 90, beta: 90, gamma: 90, piano: false };
// all'inizio: conche nel cubo, il magnete acceso, la finestra quasi lungo un asse: piccoli fiori in prospettiva
p.atomi = [{ p: [0, 0, 0], s: -1 }]; p.B = [0, 0, 3]; p.tempo = 40;
p.finestra = { ...p.finestra, C: [0, 0, 0], R: 3, n: versore([0.1, 0.05, 1]), D: 1.5 };
p.r0 = [0.08, 0, 0]; p.v0 = [0, 0.7, 0.1];
// un indirizzo nell'URL (dopo #) si apre così com'è: si condivide un pattern copiando il link
if (location.hash.length > 1) { try { p = leggi(decodeURIComponent(location.hash.slice(1))); } catch (err) { console.warn(err); } }
const storia = [scrivi(p)]; let qui = 0;
function ricorda() { const s = scrivi(p); if (s === storia[qui]) return; storia.splice(qui + 1); storia.push(s); qui = storia.length - 1; tastiStoria(); }
function tastiStoria() { $('t-indietro').disabled = qui <= 0; $('t-avanti').disabled = qui >= storia.length - 1; }

// ---------- il worker
const lav = new Worker(new URL('./lavoratore.js', import.meta.url), { type: 'module' });
const dpr = Math.min(2, window.devicePixelRatio || 1);
function misure() { const r = tela.getBoundingClientRect(); return { w: Math.round(r.width * dpr), h: Math.round(r.height * dpr) }; }
const off = tela.transferControlToOffscreen();
lav.postMessage({ tipo: 'tela', tela: off, ...misure(), dpr }, [off]);
let ultimaInfo = null;
lav.onmessage = (e) => { const m = e.data; if (m.tipo === 'catalogo') { mostraCatalogo(m); return; } if (m.tipo === 'stato') { $('frase').textContent = m.frase; $('frase-globo').textContent = m.finestra; ultimaInfo = m; if ($('info').classList.contains('aperto')) pannello(); } };
let scheletro = false, campo = false;
const invia = () => { lav.postMessage({ tipo: 'pattern', p: structuredClone(p), vista: p.vista, scheletro, campo }); disegnaCubetti(); };
let attesa = null;
const inviaFinestra = () => { if (attesa) return; attesa = requestAnimationFrame(() => { attesa = null; lav.postMessage({ tipo: 'finestra', finestra: structuredClone(p.finestra), vista: p.vista, scheletro, campo }); }); };
window.addEventListener('resize', () => { const m = misure(); sopra.width = m.w; sopra.height = m.h; lav.postMessage({ tipo: 'misura', ...m, dpr }); });
{ const m = misure(); sopra.width = m.w; sopra.height = m.h; }

// ---------- le manopole (valori tra 0 e 1, nessun numero in vista)
const manopola = (id) => $(id).querySelector('input');
const KE = (s) => 0.1 * Math.pow(120, s), sKE = (e) => Math.log(e / 0.1) / Math.log(120);
const Bdi = (s) => 10 * s * s, sB = (b) => Math.sqrt(b / 10);
const Tdi = (s) => 0.05 * s * s, sT = (t) => Math.sqrt(t / 0.05);
const Rdi = (s) => (s >= 0.985 ? Infinity : 1.2 * Math.pow(10, 3 * s)), sR = (r) => (Number.isFinite(r) ? Math.log10(r / 1.2) / 3 : 1);
const modulo = (v) => Math.hypot(...v);
function aggiornaManopole() {
  manopola('m-velocita').value = Math.round(1000 * Math.min(1, Math.max(0, sKE(0.5 * punto(p.v0, p.v0)))));
  manopola('m-magnete').value = Math.round(1000 * Math.min(1, sB(modulo(p.B))));
  manopola('m-caldo').value = Math.round(1000 * Math.min(1, sT(p.T)));
  manopola('m-distanza').value = Math.round(1000 * Math.min(1, sR(p.finestra.R)));
  $('t-vista').textContent = p.vista === 'tessera' ? '🧩' : '🔍';
  $('t-pallina').textContent = p.sorgente ? '✴️' : '⚪'; $('t-pallina').classList.toggle('acceso', !!p.sorgente);
  $('t-scheletro').classList.toggle('acceso', scheletro);
}
function suManopola(id, fare, soloFinestra = false) {
  const el = manopola(id);
  el.addEventListener('input', () => { fare(el.value / 1000); if (soloFinestra) inviaFinestra(); else invia(); });
  el.addEventListener('change', ricorda);
}
suManopola('m-velocita', (s) => { const v = Math.sqrt(2 * KE(s)), m = modulo(p.v0) || 1; p.v0 = p.v0.map((x) => (x / m) * v); });
suManopola('m-magnete', (s) => { const b = Bdi(s); p.B = b > 0 ? p.finestra.n.map((x) => x * b) : [0, 0, 0]; });
suManopola('m-caldo', (s) => { p.T = Tdi(s); });
suManopola('m-distanza', (s) => { p.finestra.R = Rdi(s); disegnaCubetti(); }, true);

// ---------- i tasti
// ⚪ ↔ ✴️: una pallina sola, o la sorgente sul sito simmetrico più vicino (che manda le palline in tutte le direzioni
// equivalenti per la simmetria del sito)
let memoCr = null;
const cristalloOra = () => { const k = JSON.stringify([p.reticolo, p.atomi]); if (!memoCr || memoCr.k !== k) memoCr = { k, cr: creaCristallo({ ...vincola(p.reticolo), atomi: p.atomi, w: p.w }) }; return memoCr.cr; };
const scatta = (x) => sitoVicino(cristalloOra(), x).x;
$('t-pallina').onclick = () => { p.sorgente = p.sorgente ? 0 : 1; if (p.sorgente) p.r0 = scatta(p.r0); aggiornaManopole(); invia(); ricorda(); suggerisci(); };
$('t-scheletro').onclick = () => { scheletro = !scheletro; aggiornaManopole(); inviaFinestra(); };
$('t-vista').onclick = () => { p.vista = p.vista === 'tessera' ? 'viaggio' : 'tessera'; aggiornaManopole(); inviaFinestra(); ricorda(); };
$('t-caso').onclick = () => { p = casuale(Math.floor(Math.random() * 1e9)); aggiornaManopole(); invia(); ricorda(); };
$('t-indietro').onclick = () => { if (qui > 0) { qui--; p = leggi(storia[qui]); aggiornaManopole(); invia(); tastiStoria(); } };
$('t-avanti').onclick = () => { if (qui < storia.length - 1) { qui++; p = leggi(storia[qui]); aggiornaManopole(); invia(); tastiStoria(); } };
$('t-info').onclick = () => { $('info').classList.toggle('aperto'); $('t-info').classList.toggle('acceso'); pannello(); };
function vassoio(id, tasto) {
  const v = $(id), aperto = !v.classList.contains('aperto');
  document.querySelectorAll('.vassoio').forEach((x) => x.classList.remove('aperto'));
  document.querySelectorAll('#barra .tasto').forEach((x) => x.classList.remove('acceso'));
  if (aperto) { v.classList.add('aperto'); $(tasto).classList.add('acceso'); }
  disegnaCubetti();
}
$('t-cristallo').onclick = () => vassoio('v-cristallo', 't-cristallo');
$('t-globo').onclick = () => vassoio('v-globo', 't-globo');

// ---------- ⭕ le linee chiuse: il catalogo delle orbite periodiche di questo cristallo a questa energia
// (nel piano: un cristallo nello spazio diventa il piano del suo sistema; la vista è il limite parallelo, R = ∞)
const PIANO_DI = { cubico: 'quadrato', tetragonale: 'quadrato', esagonale: 'esagonale', trigonale: 'esagonale', ortorombico: 'rettangolare', monoclino: 'obliquo', triclino: 'obliquo' };
function aPiano() {
  const r = p.reticolo;
  if (!r.piano) {
    const sistema = PIANO_DI[r.sistema], cent = sistema === 'rettangolare' && r.centratura !== 'P' ? 'C' : 'P';
    p.reticolo = vincola({ sistema, centratura: cent, piano: true, a: 1, b: r.b, gamma: r.gamma });
    p.atomi = p.atomi.filter((a) => a.p[2] === 0); if (!p.atomi.length) p.atomi = [{ p: [0, 0, 0], s: 1 }];
    p.r0 = [p.r0[0], p.r0[1], 0]; p.v0 = [p.v0[0], p.v0[1], 0]; if (Math.hypot(p.v0[0], p.v0[1]) < 0.3) p.v0 = [1, 0.4, 0];
    p.B = [0, 0, 0];
  }
  p.finestra = { ...p.finestra, R: Infinity, n: [0, 0, 1], C: [0, 0, 0] };
}
let catalogoOra = [];
function mostraCatalogo(m) {
  catalogoOra = m.orbite; const el = $('catalogo'); el.innerHTML = '';
  $('chiuse-stato').textContent = m.orbite.length ? '' : '…';
  m.orbite.forEach((o) => {
    const c = document.createElement('canvas'); c.width = 192; c.height = 192; c.className = 'orbita'; c.classList.toggle('scelta', (p.orbite ?? []).includes(o.testo));
    const x = c.getContext('2d'), P = o.punti, A = o.A;
    // la linea ripetuta su 3 × 3 celle, centrata
    let mx = Infinity, Mx = -Infinity, my = Infinity, My = -Infinity; for (const q of P) { mx = Math.min(mx, q[0]); Mx = Math.max(Mx, q[0]); my = Math.min(my, q[1]); My = Math.max(My, q[1]); }
    const k = 150 / Math.max(2.2, Mx - mx + 1.2, My - my + 1.2), cx = (mx + Mx) / 2, cy = (my + My) / 2;
    x.strokeStyle = o.stabile ? '#ffe9b0' : '#9fe3ff'; x.lineWidth = 3; x.lineJoin = 'round';
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const tx = i * A[0][0] + j * A[1][0], ty = i * A[0][1] + j * A[1][1];
      x.beginPath(); P.forEach((q, n) => { const X = 96 + (q[0] + tx - cx) * k, Y = 96 - (q[1] + ty - cy) * k; if (n) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.stroke();
    }
    c.onclick = () => {
      const l = new Set(p.orbite ?? []); if (l.has(o.testo)) l.delete(o.testo); else l.add(o.testo);
      p.orbite = [...l]; c.classList.toggle('scelta', l.has(o.testo)); invia(); ricorda();
    };
    el.appendChild(c);
  });
}
$('t-chiuse').onclick = () => {
  vassoio('v-chiuse', 't-chiuse');
  if (!$('v-chiuse').classList.contains('aperto')) return;
  aPiano(); aggiornaManopole(); invia();
  $('catalogo').innerHTML = ''; $('chiuse-stato').textContent = '⏳';
  lav.postMessage({ tipo: 'catalogo', p: structuredClone(p) });
};
$('t-campo').onclick = () => { campo = !campo; $('t-campo').classList.toggle('acceso', campo); inviaFinestra(); };
$('t-pallina2').onclick = () => { p.orbite = []; invia(); ricorda(); mostraCatalogo({ orbite: catalogoOra }); };

// ---------- il cristallo: i 7 sistemi come piccole forme, la centratura col secondo tocco
const FORME = {
  triclino: { b: 1.1, c: 0.9, alfa: 80, beta: 105, gamma: 95 }, monoclino: { b: 1.1, c: 0.9, beta: 105 }, ortorombico: { b: 1.3, c: 0.8 },
  tetragonale: { c: 1.45 }, trigonale: { alfa: 70 }, esagonale: { c: 1.63 }, cubico: {},
};
function vista3(v, giro = -0.6, alza = 0.42) { // una vista obliqua fissa della cella
  const c = Math.cos(giro), s = Math.sin(giro), x = c * v[0] - s * v[1], y = s * v[0] + c * v[1];
  return [x, -(Math.cos(alza) * v[2] - Math.sin(alza) * y)];
}
function disegnaCella(ctx, ret, cx, cy, k, alpha = 1) {
  const A = vettoriCella(vincola(ret)), centro = combina([0.5, 0.5, 0.5], A), P = (f) => { const v = combina(f, A); const q = vista3([v[0] - centro[0], v[1] - centro[1], v[2] - centro[2]]); return [cx + k * q[0], cy + k * q[1]]; };
  ctx.strokeStyle = `rgba(170,200,255,${0.75 * alpha})`; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const [a, b] of [[[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [0, 1, 0]], [[0, 0, 0], [0, 0, 1]], [[1, 1, 1], [0, 1, 1]], [[1, 1, 1], [1, 0, 1]], [[1, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0]], [[1, 0, 0], [1, 0, 1]], [[0, 1, 0], [1, 1, 0]], [[0, 1, 0], [0, 1, 1]], [[0, 0, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1]]]) {
    const u = P(a), w = P(b); ctx.moveTo(...u); ctx.lineTo(...w);
  }
  ctx.stroke();
  return P;
}
// la scala e il centro perché la cella stia tutta nella tela (con un margine)
function adatta(ret, W, H, m) {
  const A = vettoriCella(vincola(ret)), centro = combina([0.5, 0.5, 0.5], A), q = [];
  for (let i = 0; i < 8; i++) { const v = combina([i & 1, (i >> 1) & 1, (i >> 2) & 1], A); q.push(vista3([v[0] - centro[0], v[1] - centro[1], v[2] - centro[2]])); }
  const x0 = Math.min(...q.map((v) => v[0])), x1 = Math.max(...q.map((v) => v[0])), y0 = Math.min(...q.map((v) => v[1])), y1 = Math.max(...q.map((v) => v[1]));
  const k = Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m) / (y1 - y0));
  return [W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2, k];
}
const forme = $('forme');
for (const nome of Object.keys(SISTEMI)) {
  const b = document.createElement('canvas'); b.width = 148; b.height = 148; b.className = 'forma'; b.dataset.sistema = nome;
  b.onclick = () => {
    const r = p.reticolo;
    if (r.sistema === nome) { const c = SISTEMI[nome].centrature; r.centratura = c[(c.indexOf(r.centratura) + 1) % c.length]; }
    else { p.reticolo = vincola({ sistema: nome, centratura: SISTEMI[nome].centrature[0], a: 1, b: 1, c: 1, alfa: 90, beta: 90, gamma: 90, ...FORME[nome], piano: false }); }
    p.finestra.C = [0, 0, 0];
    invia(); ricorda();
  };
  forme.appendChild(b);
}
function disegnaForme() {
  for (const b of forme.children) {
    const nome = b.dataset.sistema, ctx = b.getContext('2d'), scelta = p.reticolo.sistema === nome;
    b.classList.toggle('scelta', scelta);
    ctx.clearRect(0, 0, 148, 148);
    const ret = scelta ? p.reticolo : vincola({ sistema: nome, centratura: SISTEMI[nome].centrature[0], ...FORME[nome] });
    const P = disegnaCella(ctx, ret, ...adatta(ret, 148, 148, 16));
    // i punti del reticolo: gli angoli e, per le celle centrate, i centri (la centratura si vede)
    const cr = creaCristallo({ ...vincola(ret), atomi: [{ p: [0, 0, 0], s: 1 }] });
    ctx.fillStyle = '#ffd08a';
    for (const c of cr.centri) for (const d of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) {
      const f = c.map((x, i) => x + d[i]); if (f.some((x) => x > 1 + 1e-9)) continue;
      const [x, y] = P(f); ctx.beginPath(); ctx.arc(x, y, c.some((q) => q) ? 6 : 4.5, 0, 6.3); ctx.fill();
    }
  }
}

// ---------- il cubetto: tocchi un posto e metti o togli un atomo (vuoto → collina → conca → vuoto)
const cub = $('cubetto'), cctx = cub.getContext('2d'); let posti = [];
cub.width = 1160; cub.height = 560; cub.style.width = '580px'; cub.style.height = '280px';
function disegnaCubetto() {
  cctx.clearRect(0, 0, cub.width, cub.height);
  const P = disegnaCella(cctx, p.reticolo, ...adatta(p.reticolo, cub.width, cub.height, 46));
  const cr = creaCristallo({ ...vincola(p.reticolo), atomi: [{ p: [0, 0, 0], s: 1 }] });
  posti = [];
  POSTI.forEach((f0, i) => {
    const at = p.atomi.find((a) => a.p.every((x, k) => Math.abs(x - f0[k]) < 1e-9));
    // il posto e le sue immagini sugli spigoli e sulle facce della cella
    const imm = []; for (const d of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) { const f = f0.map((x, k) => x + d[k]); if (f.every((x) => x <= 1)) imm.push(f); }
    for (const f of imm) {
      const [x, y] = P(f); posti.push({ i, x, y });
      if (at) {
        const g = cctx.createRadialGradient(x, y, 0, x, y, 34); const col = at.s > 0 ? '255,176,74' : '160,124,255';
        g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.45, `rgba(${col},0.75)`); g.addColorStop(1, `rgba(${col},0)`);
        cctx.fillStyle = g; cctx.beginPath(); cctx.arc(x, y, 34, 0, 6.3); cctx.fill();
        cctx.fillStyle = '#fff'; cctx.font = 'bold 30px system-ui'; cctx.textAlign = 'center'; cctx.textBaseline = 'middle'; cctx.fillText(at.s > 0 ? '▲' : '▼', x, y + 1);
      } else { cctx.strokeStyle = 'rgba(200,215,255,0.45)'; cctx.lineWidth = 3; cctx.beginPath(); cctx.arc(x, y, 14, 0, 6.3); cctx.stroke(); }
    }
    // le copie della centratura, tenui
    if (at) for (const c of cr.centri.slice(1)) {
      const f = f0.map((x, k) => { const y = x + c[k]; return y - Math.floor(y); }), [x, y] = P(f);
      cctx.fillStyle = at.s > 0 ? 'rgba(255,176,74,0.35)' : 'rgba(160,124,255,0.35)'; cctx.beginPath(); cctx.arc(x, y, 16, 0, 6.3); cctx.fill();
    }
  });
}
cub.addEventListener('pointerdown', (e) => {
  const r = cub.getBoundingClientRect(), x = ((e.clientX - r.left) * cub.width) / r.width, y = ((e.clientY - r.top) * cub.height) / r.height;
  let best = null, dm = 46; for (const q of posti) { const d = Math.hypot(q.x - x, q.y - y); if (d < dm) { dm = d; best = q; } }
  if (!best) return;
  const f0 = POSTI[best.i], j = p.atomi.findIndex((a) => a.p.every((v, k) => Math.abs(v - f0[k]) < 1e-9));
  if (j < 0) p.atomi.push({ p: [...f0], s: 1 }); else if (p.atomi[j].s > 0) p.atomi[j].s = -1; else p.atomi.splice(j, 1);
  invia(); ricorda();
});

// ---------- il globo: si gira col dito; scatta sui piani semplici
const glo = $('globo'), gctx = glo.getContext('2d');
glo.width = 540; glo.height = 540; glo.style.width = '270px'; glo.style.height = '270px';
let nGrezza = null; // la direzione sotto il dito, prima dello scatto
const SCATTO = (3.5 * Math.PI) / 180;
function semplici() { return direzioniSemplici(creaCristallo({ ...vincola(p.reticolo), atomi: [] }), 2); }
function disegnaGlobo() {
  const W = glo.width, c = W / 2, r = W * 0.42, f = creaFinestra(p.finestra);
  gctx.clearRect(0, 0, W, W);
  const g = gctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
  g.addColorStop(0, '#5d86d8'); g.addColorStop(0.6, '#20366e'); g.addColorStop(1, '#0b1430');
  gctx.fillStyle = g; gctx.beginPath(); gctx.arc(c, c, r, 0, 6.3); gctx.fill();
  gctx.strokeStyle = 'rgba(160,190,255,0.5)'; gctx.lineWidth = 2; gctx.stroke();
  // le direzioni sul globo, viste dalla parte di chi guarda: il centro del disco è n
  const su = (u) => [punto(u, f.e1), punto(u, f.e2), punto(u, f.n)];
  // i meridiani degli assi della cella
  const cr = creaCristallo({ ...vincola(p.reticolo), atomi: [] });
  gctx.lineWidth = 1.5;
  for (const [ax, col] of [[cr.A[0], '255,140,120'], [cr.A[1], '140,255,160'], [cr.A[2], '140,190,255']]) {
    const a = versore(ax), b = versore(vettore(a, Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e = vettore(a, b);
    gctx.strokeStyle = `rgba(${col},0.35)`; gctx.beginPath(); let su0 = false;
    for (let t = 0; t <= 64; t++) { const th = (t / 64) * 6.2832, u = b.map((x, i) => Math.cos(th) * x + Math.sin(th) * e[i]), q = su(u); if (q[2] < 0) { su0 = false; continue; } const X = c + r * q[0], Y = c - r * q[1]; if (su0) gctx.lineTo(X, Y); else gctx.moveTo(X, Y); su0 = true; }
    gctx.stroke();
  }
  for (const d of semplici()) {
    const q = su(d.n); if (q[2] < 0.05) continue;
    const grande = Math.max(...d.hkl.map(Math.abs)) === 1, X = c + r * q[0], Y = c - r * q[1];
    gctx.fillStyle = `rgba(255,236,170,${0.35 + 0.55 * q[2]})`; gctx.beginPath(); gctx.arc(X, Y, grande ? 7 : 4, 0, 6.3); gctx.fill();
  }
  // il mirino: da dove guardi
  gctx.strokeStyle = '#fff'; gctx.lineWidth = 4; gctx.beginPath(); gctx.arc(c, c, 18, 0, 6.3); gctx.stroke();
  gctx.beginPath(); gctx.moveTo(c - 30, c); gctx.lineTo(c - 22, c); gctx.moveTo(c + 22, c); gctx.lineTo(c + 30, c); gctx.moveTo(c, c - 30); gctx.lineTo(c, c - 22); gctx.moveTo(c, c + 22); gctx.lineTo(c, c + 30); gctx.stroke();
}
let trascinoGlobo = null;
glo.addEventListener('pointerdown', (e) => { glo.setPointerCapture(e.pointerId); trascinoGlobo = [e.clientX, e.clientY]; nGrezza = [...p.finestra.n]; });
glo.addEventListener('pointermove', (e) => {
  if (!trascinoGlobo) return;
  const dx = e.clientX - trascinoGlobo[0], dy = e.clientY - trascinoGlobo[1]; trascinoGlobo = [e.clientX, e.clientY];
  const l = Math.hypot(dx, dy); if (!l) return;
  const f = creaFinestra({ ...p.finestra, n: nGrezza }), th = l / (270 * 0.42);
  const u = f.e1.map((x, i) => (dx * x - dy * f.e2[i]) / l);
  nGrezza = versore(nGrezza.map((x, i) => Math.cos(th) * x - Math.sin(th) * u[i]));
  // lo scatto leggero, come una calamita
  let n = nGrezza;
  for (const d of semplici()) { const a = Math.acos(Math.min(1, punto(d.n, nGrezza))); if (a < SCATTO) { n = d.n; break; } }
  p.finestra.n = n;
  if (modulo(p.B) > 0) { /* il magnete resta dov'era: cambia solo lo sguardo */ }
  inviaFinestra(); disegnaCubetti();
});
glo.addEventListener('pointerup', () => { trascinoGlobo = null; ricorda(); });

// il cubetto con la finestra dentro: il piano per il centro della cella, perpendicolare a n
const cub2 = $('cubetto2'), c2 = cub2.getContext('2d');
cub2.width = 440; cub2.height = 400; cub2.style.width = '220px'; cub2.style.height = '200px';
function disegnaCubetto2() {
  c2.clearRect(0, 0, cub2.width, cub2.height);
  const ret = vincola(p.reticolo), A = vettoriCella(ret), centro = combina([0.5, 0.5, 0.5], A), n = p.finestra.n;
  const P = disegnaCella(c2, ret, ...adatta(ret, cub2.width, cub2.height, 70));
  // gli spigoli tagliati dal piano
  const vert = []; for (let i = 0; i < 8; i++) vert.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
  const pts = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const a = vert[i], b = vert[j]; if (a.reduce((s, x, k) => s + Math.abs(x - b[k]), 0) !== 1) continue;
    const va = punto(combina(a, A).map((x, k) => x - centro[k]), n), vb = punto(combina(b, A).map((x, k) => x - centro[k]), n);
    if (va * vb < 0) { const t = va / (va - vb); pts.push(a.map((x, k) => x + t * (b[k] - x))); }
  }
  if (pts.length >= 3) {
    const q = pts.map(P), m = q.reduce((s, x) => [s[0] + x[0] / q.length, s[1] + x[1] / q.length], [0, 0]);
    q.sort((u, v) => Math.atan2(u[1] - m[1], u[0] - m[0]) - Math.atan2(v[1] - m[1], v[0] - m[0]));
    c2.fillStyle = 'rgba(120,210,255,0.28)'; c2.strokeStyle = 'rgba(160,230,255,0.9)'; c2.lineWidth = 3;
    c2.beginPath(); q.forEach((x, i) => (i ? c2.lineTo(...x) : c2.moveTo(...x))); c2.closePath(); c2.fill(); c2.stroke();
  }
  // l'occhio: una freccia da fuori verso il centro, lungo n
  const occhio = P([0.5 + 0.9 * punto(n, versore(combina([1, 0, 0], A)) ), 0.5, 0.5]);
  void occhio;
  const e0 = vista3(n.map((x) => -x)), C0 = P([0.5, 0.5, 0.5]), L0 = 150;
  const s0 = [C0[0] - e0[0] * L0 * 1.25, C0[1] - e0[1] * L0 * 1.25];
  c2.strokeStyle = '#fff'; c2.lineWidth = 4; c2.beginPath(); c2.moveTo(...s0); c2.lineTo(C0[0] - e0[0] * L0 * 0.45, C0[1] - e0[1] * L0 * 0.45); c2.stroke();
  c2.font = '34px system-ui'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('👁', s0[0], s0[1]);
}
function disegnaCubetti() {
  if ($('v-cristallo').classList.contains('aperto')) { disegnaForme(); disegnaCubetto(); }
  if ($('v-globo').classList.contains('aperto')) { disegnaGlobo(); disegnaCubetto2(); }
}

// ---------- il lancio: trascini una freccia sul disegno; la lunghezza è la velocità, il verso la direzione
let freccia = null, aiuto = performance.now();
sopra.addEventListener('pointerdown', (e) => {
  document.querySelectorAll('.vassoio').forEach((x) => x.classList.remove('aperto'));
  document.querySelectorAll('#barra .tasto').forEach((x) => x.classList.remove('acceso'));
  sopra.setPointerCapture(e.pointerId); freccia = { x0: e.offsetX, y0: e.offsetY, x1: e.offsetX, y1: e.offsetY }; aiuto = 0;
});
sopra.addEventListener('pointermove', (e) => { if (freccia) { freccia.x1 = e.offsetX; freccia.y1 = e.offsetY; } });
sopra.addEventListener('pointerup', () => {
  if (!freccia) return;
  const { x0, y0, x1, y1 } = freccia, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), r = sopra.getBoundingClientRect();
  freccia = null;
  const f = creaFinestra({ ...p.finestra, aspetto: r.height / r.width }), k = r.width / f.L;
  const punto0 = f.dallImmagine((x0 - r.width / 2) / k, -(y0 - r.height / 2) / k);
  // con la sorgente, un tocco la sposta sul sito simmetrico più vicino
  if (l < 12) { if (p.sorgente) { p.r0 = scatta(punto0); invia(); ricorda(); } return; }
  p.r0 = p.sorgente ? scatta(punto0) : punto0;
  const s = Math.min(1, l / (0.32 * r.width)), v = Math.sqrt(2 * KE(0.15 + 0.85 * s));
  p.v0 = f.e1.map((x, i) => ((dx * x - dy * f.e2[i]) / l) * v);
  aggiornaManopole(); invia(); ricorda();
});
// la freccia (e all'inizio un suggerimento che pulsa piano)
function frecciaDa(x0, y0, x1, y1, alfa) {
  const l = Math.hypot(x1 - x0, y1 - y0); if (l < 2) return;
  const ux = (x1 - x0) / l, uy = (y1 - y0) / l;
  octx.strokeStyle = `rgba(255,255,255,${alfa})`; octx.fillStyle = `rgba(255,255,255,${alfa})`; octx.lineWidth = 5 * dpr; octx.lineCap = 'round';
  octx.beginPath(); octx.moveTo(x0, y0); octx.lineTo(x1 - ux * 18 * dpr, y1 - uy * 18 * dpr); octx.stroke();
  octx.beginPath(); octx.moveTo(x1, y1); octx.lineTo(x1 - ux * 26 * dpr - uy * 14 * dpr, y1 - uy * 26 * dpr + ux * 14 * dpr); octx.lineTo(x1 - ux * 26 * dpr + uy * 14 * dpr, y1 - uy * 26 * dpr - ux * 14 * dpr); octx.closePath(); octx.fill();
  octx.beginPath(); octx.arc(x0, y0, 11 * dpr, 0, 6.3); octx.fill();
}
function suggerisci() { aiuto = performance.now(); }
function anima(t) {
  octx.clearRect(0, 0, sopra.width, sopra.height);
  if (p.sorgente) { // la sorgente: una stellina dove sta il sito, vista dalla finestra
    const r = sopra.getBoundingClientRect(), f = creaFinestra({ ...p.finestra, aspetto: r.height / r.width }), w = f.aFinestra(p.r0);
    if (!f.piani.some((a) => a[0] * w[0] + a[1] * w[1] + a[2] * w[2] > a[3] + 1e-9)) {
      const [X, Y] = f.proietta(...w), k = (r.width / f.L) * dpr, x = sopra.width / 2 + X * k, y = sopra.height / 2 - Y * k;
      octx.fillStyle = 'rgba(255,255,255,0.95)'; octx.font = `${26 * dpr}px system-ui`; octx.textAlign = 'center'; octx.textBaseline = 'middle'; octx.fillText('✴️', x, y);
    }
  }
  if (freccia) frecciaDa(freccia.x0 * dpr, freccia.y0 * dpr, freccia.x1 * dpr, freccia.y1 * dpr, 0.95);
  else if (aiuto && t - aiuto < 5000) {
    const a = 0.5 * Math.sin(((t - aiuto) / 5000) * Math.PI) * (0.6 + 0.4 * Math.sin(t / 220)), W = sopra.width, H = sopra.height;
    frecciaDa(W * 0.42, H * 0.58, W * 0.42 + W * 0.12 * Math.min(1, ((t - aiuto) % 1600) / 900), H * 0.58 - H * 0.08 * Math.min(1, ((t - aiuto) % 1600) / 900), a);
  }
  requestAnimationFrame(anima);
}
requestAnimationFrame(anima);

// ---------- il pannello «per i grandi»
function pannello() {
  const el = $('info'); if (!el.classList.contains('aperto') || document.activeElement?.id === 'testo') return;
  const i = ultimaInfo?.info, r = p.reticolo, f = p.finestra, cr = creaCristallo({ ...vincola(r), atomi: [] });
  const fmt = (x, c = 4) => (Number.isFinite(x) ? Number(x.toPrecision(c)).toString() : '∞');
  el.innerHTML = `
    <h3>Il cristallo</h3>${NOMI_TECNICI[cr.nome] ?? cr.nome} · a = ${fmt(r.a)}, b = ${fmt(r.b)}, c = ${fmt(r.c)}, α = ${fmt(r.alfa)}°, β = ${fmt(r.beta)}°, γ = ${fmt(r.gamma)}°<br>
    atomi della base: ${p.atomi.map((a) => `${a.s > 0 ? 'collina' : 'conca'} (${a.p.map((x) => fmt(x, 3)).join(', ')})`).join('; ') || 'nessuno'} · U₀ = ${fmt(p.U0)}, w = ${fmt(p.w)}
    <h3>Le leggi</h3>L1: F = −∇V, V(r) = Σₙ Σᵢ sᵢ·U₀·exp(−|r − Rₙ − pᵢ|²/2w²) (immagini entro 4w) · Verlet<br>
    L2: F = q·v × B, |B| = ${fmt(modulo(p.B))} (raggio di curvatura ${fmt(modulo(p.v0) / (modulo(p.B) || NaN))} celle) · Boris<br>
    E cinetica del lancio = ${fmt(0.5 * punto(p.v0, p.v0))} U₀ · T = ${fmt(p.T)} U₀ (⟨u²⟩ per componente = T·(0,1 a)²)
    <h3>La finestra</h3>C = (${f.C.map((x) => fmt(x, 3)).join(', ')}), R = ${fmt(f.R)}, n = (${f.n.map((x) => fmt(x, 3)).join(', ')}), ψ = ${fmt(f.psi, 3)}, L = ${fmt(f.L)}, profondità D = ${fmt(f.D)}<br>
    prospettiva: X = R·u/z, Y = R·v/z, luminosità (R/z)² (al più 1); R = ∞ è la proiezione parallela<br>
    ${ultimaInfo ? ultimaInfo.finestra : ''}
    <h3>Il calcolo</h3>${i ? `passo dt = ${fmt(i.dt)} (scelto per convergenza) · passi ${i.passi} di ${i.passiTotali} · tratti disegnati ${i.tratti} · copie della tessera ${i.copie} · immagini ${i.immagini}<br>palline ${i.palline}${i.ordine ? ` · gruppo del sito: ${i.elementi} operazioni, rotazione di ordine ${i.ordine}, ${i.specchi} specchi` : ''}<br>zona pulita: ${i.zona.celle} celle ${i.zona.finita ? '' : '(non ancora sfaldata)'} · primo disegno in ${i.primoMs != null ? Math.round(i.primoMs) + ' ms' : '…'}` : '…'}
    <h3>L'indirizzo</h3><textarea id="testo">${scrivi(p)}</textarea><button id="apri">apri questo indirizzo</button>`;
  $('apri').onclick = () => { try { p = leggi($('testo').value); aggiornaManopole(); invia(); ricorda(); } catch (err) { alert(err.message); } };
}

aggiornaManopole(); tastiStoria(); invia();
window.cristallo = { get p() { return p; }, get info() { return ultimaInfo; }, scrivi, leggi };
void scriviIndici;
// (per le prove con Playwright: la direzione d sull'immagine del globo)
window.__assi = (n, d) => { const f = creaFinestra({ ...p.finestra, n }), a = punto(d, f.e1), b = punto(d, f.e2), l = Math.hypot(a, b) || 1; return [a / l, b / l]; };
