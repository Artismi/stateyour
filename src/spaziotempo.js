// spaziotempo.js — il pattern come avvenimenti in uno spazio a tre dimensioni.
//
// Il piano orizzontale è il piano di esistenza (x, y); l'asse verticale è il
// tempo. Ogni particella lascia una LINEA D'UNIVERSO che sale: la sua
// proiezione a terra è la linea del pattern. Ogni tratto è colorato con la
// legge che lo genera in quell'istante; le masse sono fili verticali che
// esistono nel loro intervallo di tempo; il piano del tempo mostra lo stato
// nell'istante t, con i blocchi che esistono ora.
// Disegno su canvas 2D con una proiezione prospettica: nessuna dipendenza.

import { simula, inBlocco } from './motore.js';
import { seme } from './seme.js';
import { CELLE } from './celle.js';
import { PARTITURE } from './partiture.js';
import { decodifica, semeDaCodifica } from './decodifica.js';
import { lingua, semeDaLingua } from './lingua.js';
import { bordi } from './pennello.js';

const $ = (id) => document.getElementById(id);
const tela = $('scena'), ctx = tela.getContext('2d');

// i colori delle leggi
const COLORI = {
  gravita: [232, 96, 70], magnetico: [86, 140, 255], 'attrito+magnetico': [176, 120, 255], attrito: [140, 160, 200],
  molla: [90, 200, 120], 'magnetico+molla': [120, 220, 220], specchio: [255, 210, 80], rifrazione: [255, 170, 60], assorbe: [200, 200, 200],
  libero: [180, 176, 166],
};
const NOMI = {
  gravita: 'gravità: orbite, archi di cerchio', magnetico: 'campo magnetico: curva a raggio costante', 'attrito+magnetico': 'magnetico + attrito: la voluta',
  molla: 'molla: la spatola del petalo, la sinusoide', 'magnetico+molla': 'molla + magnetico: il petalo che si incurva', libero: 'nessuna forza: la retta',
  specchio: 'specchio', rifrazione: 'rifrazione',
};
const coloreDi = (l) => COLORI[l] || COLORI[(l || '').split('+').sort().join('+')] || [200, 200, 200];

// ---------- lo stato della scena
let S = null; // { conf, tracce, cx, cy, dim, kt, tMax, linee3d, pianta, campioni }
const cam = { yaw: -0.65, pitch: 0.42, dist: 1.65, bersaglio: [0, 0.3, 0] };
let tempo = 1, gioca = false;

function prepara(conf, nota) {
  const tracce = simula(conf);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, tMax = 0;
  for (const tr of tracce) for (const p of tr.punti) {
    if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    if ((p[3] ?? 0) > tMax) tMax = p[3];
  }
  const dim = Math.max(x1 - x0, y1 - y0) || 1;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const kt = (0.75 * dim) / (tMax || 1);
  // per disegnare in fretta: al più 500 punti per linea, ma tutti i cambi di legge
  const linee3d = [], pianta = [];
  const totale = tracce.reduce((n, tr) => n + tr.punti.length, 0);
  const passo = Math.max(1, Math.round(totale / 250000));
  for (const tr of tracce) {
    const P = tr.punti, pts = [];
    const n = Math.max(1, Math.min(passo, Math.floor(P.length / 500) || 1));
    for (let i = 0; i < P.length; i++) {
      if (i % n && i !== P.length - 1 && P[i][5] === P[i - 1][5] && P[i][2]) continue;
      pts.push(P[i]);
    }
    linee3d.push(pts);
    // la pianta: i bordi della linea col suo spessore, nel piano
    const pezzi = []; let cur = [];
    for (const q of pts) { if (q[2]) cur.push([q[0], q[1], q[4] ?? 0, q[3]]); else { if (cur.length > 1) pezzi.push(cur); cur = []; } }
    if (cur.length > 1) pezzi.push(cur);
    for (const pz of pezzi) { const { sx, dx } = bordi(pz.map((q) => [q[0], q[1], Math.max(q[2], dim / 900)])); pianta.push({ sx, dx, t: pz.map((q) => q[3]) }); }
  }
  // i campioni per le forze: accelerazione dalle differenze finite, sui punti originali
  const campioni = [];
  for (const tr of tracce) {
    const P = tr.punti, ogni = Math.max(3, Math.floor(P.length / 24));
    for (let i = 2; i < P.length - 1; i += ogni) {
      const a = P[i - 1], b = P[i], c = P[i + 1];
      const d1 = (b[3] - a[3]) || 1e-9, d2 = (c[3] - b[3]) || 1e-9;
      const v1 = [(b[0] - a[0]) / d1, (b[1] - a[1]) / d1], v2 = [(c[0] - b[0]) / d2, (c[1] - b[1]) / d2];
      const dt = (d1 + d2) / 2, acc = [(v2[0] - v1[0]) / dt, (v2[1] - v1[1]) / dt];
      if (!isFinite(acc[0]) || Math.hypot(...acc) < 1e-9 || b[5] === 'libero') continue;
      campioni.push({ p: b, acc, legge: b[5] });
    }
  }
  const mod = campioni.map((c) => Math.hypot(...c.acc)).sort((a, b) => a - b);
  const aRif = mod[Math.floor(mod.length * 0.9)] || 1;
  // i fili delle masse: la gravità dei blocchi e le masse sciolte
  const fili = [];
  for (const b of conf.blocchi || []) for (const l of [].concat(b.legge)) {
    if (!l || l.tipo !== 'gravita') continue;
    fili.push({ pos: l.pos, t0: b.tempo && b.tempo[0] != null ? Math.max(0, b.tempo[0]) : 0, t1: b.tempo && b.tempo[1] != null ? b.tempo[1] : tMax, segno: Math.sign(l.M) });
  }
  for (const m of conf.masse || []) fili.push({ pos: m.pos, t0: 0, t1: tMax, segno: Math.sign(m.M) });
  S = { conf, tracce, cx, cy, dim, kt, tMax, linee3d, pianta, campioni, aRif, fili, nota };
  tempo = tMax;
  $('tempo').max = String(tMax); $('tempo').step = String(tMax / 1000 || 0.001); $('tempo').value = String(tMax);
  // la legenda: solo le leggi presenti
  const presenti = new Set(); for (const pts of linee3d) for (const q of pts) presenti.add(q[5]);
  $('legenda').innerHTML = [...presenti].filter(Boolean).sort().map((l) => `<div><i style="background:rgb(${coloreDi(l).join(',')})"></i>${NOMI[l] || l}</div>`).join('');
  const conteggi = `${conf.emettitori.length} sorgenti, ${(conf.blocchi || []).length} blocchi, ${tracce.reduce((n, t) => n + t.punti.length, 0)} avvenimenti`;
  $('nota').textContent = `${nota || ''}\n${conteggi}\n\ntrascina per ruotare, rotella per avvicinarti, maiuscolo + trascina per spostarti`;
  disegna();
}

// ---------- la proiezione
function proiettore() {
  const W = tela.width, H = tela.height, f = Math.min(W, H) * 0.9;
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const D = cam.dist, [bx, by, bz] = cam.bersaglio;
  // mondo: (x, y del piano, t) → spazio di vista normalizzato su dim
  return (x, y, t) => {
    const X = (x - S.cx) / S.dim - bx, Z = (y - S.cy) / S.dim - bz, Y = (t * S.kt) / S.dim - by;
    const x1 = X * cy - Z * sy, z1 = X * sy + Z * cy;
    const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp + D;
    if (z2 < 0.05) return null;
    return [W / 2 + (f * x1) / z2, H / 2 - (f * y2) / z2, z2];
  };
}

function disegna() {
  if (!S) return;
  const W = (tela.width = tela.clientWidth * devicePixelRatio), H = (tela.height = tela.clientHeight * devicePixelRatio);
  ctx.fillStyle = '#15140f'; ctx.fillRect(0, 0, W, H);
  const P = proiettore();
  const t = tempo, fine = t >= S.tMax * 0.999;
  const half = S.dim / 2;
  const angoli = (tt) => [[S.cx - half, S.cy - half], [S.cx + half, S.cy - half], [S.cx + half, S.cy + half], [S.cx - half, S.cy + half]].map(([x, y]) => P(x, y, tt));
  const poligono = (pts) => { ctx.beginPath(); pts.forEach((q, i) => q && (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };

  // il pavimento: griglia
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const u = -half + (i / 10) * S.dim;
    const a = P(S.cx + u, S.cy - half, 0), b = P(S.cx + u, S.cy + half, 0), c = P(S.cx - half, S.cy + u, 0), d = P(S.cx + half, S.cy + u, 0);
    if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    if (c && d) { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke(); }
  }
  // l'asse del tempo
  const o = P(S.cx - half, S.cy - half, 0), o2 = P(S.cx - half, S.cy - half, S.tMax);
  if (o && o2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(o2[0], o2[1]); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = `${12 * devicePixelRatio}px ui-monospace, monospace`; ctx.fillText('tempo', o2[0] + 6, o2[1]);
  }

  // la pianta: il pattern finito proiettato a terra
  if ($('vPianta').checked) {
    ctx.fillStyle = 'rgba(244,241,234,0.55)';
    for (const pz of S.pianta) {
      ctx.beginPath(); let ok = true;
      for (let i = 0; i < pz.sx.length; i++) { const q = P(pz.sx[i][0], pz.sx[i][1], 0); if (!q) { ok = false; break; } i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
      for (let i = pz.dx.length - 1; i >= 0 && ok; i--) { const q = P(pz.dx[i][0], pz.dx[i][1], 0); if (!q) { ok = false; break; } ctx.lineTo(q[0], q[1]); }
      if (ok) { ctx.closePath(); ctx.fill(); }
    }
  }

  // i fili delle masse
  if ($('vMasse').checked) {
    ctx.lineWidth = 1;
    for (const f of S.fili) {
      const a = P(f.pos[0], f.pos[1], f.t0), b = P(f.pos[0], f.pos[1], Math.min(f.t1, S.tMax));
      if (!a || !b) continue;
      const vivo = t >= f.t0 && t <= f.t1;
      ctx.strokeStyle = f.segno < 0 ? `rgba(90,200,120,${vivo ? 0.8 : 0.2})` : `rgba(232,96,70,${vivo ? 0.8 : 0.2})`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }

  // le linee d'universo fino a t, a tratti dello stesso colore
  if ($('vLinee').checked) {
    ctx.lineWidth = 1.3 * devicePixelRatio; ctx.lineJoin = 'round';
    for (const pts of S.linee3d) {
      let leggeCorrente = null, aperto = false, prec = null;
      for (const q of pts) {
        if (q[3] > t) break;
        const s = P(q[0], q[1], q[3]);
        if (!s) { aperto = false; continue; }
        if (q[5] !== leggeCorrente || !aperto) {
          if (aperto) ctx.stroke();
          leggeCorrente = q[5]; ctx.strokeStyle = `rgba(${coloreDi(leggeCorrente).join(',')},0.9)`;
          ctx.beginPath(); if (prec) ctx.moveTo(prec[0], prec[1]); else ctx.moveTo(s[0], s[1]);
          aperto = true;
        }
        ctx.lineTo(s[0], s[1]); prec = s;
      }
      if (aperto) ctx.stroke();
    }
  }

  // le forze: frecce nel piano, all'altezza dell'istante in cui agiscono
  if ($('vForze').checked) {
    ctx.lineWidth = 1 * devicePixelRatio;
    for (const c of S.campioni) {
      if (c.p[3] > t) continue;
      const m = Math.hypot(...c.acc), L = 0.035 * S.dim * Math.sqrt(Math.min(1.5, m / S.aRif));
      const u = [c.acc[0] / m, c.acc[1] / m];
      const a = P(c.p[0], c.p[1], c.p[3]), b = P(c.p[0] + u[0] * L, c.p[1] + u[1] * L, c.p[3]);
      if (!a || !b) continue;
      ctx.strokeStyle = `rgba(${coloreDi(c.legge).join(',')},0.95)`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 4 * devicePixelRatio;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - h * Math.cos(ang - 0.5), b[1] - h * Math.sin(ang - 0.5));
      ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - h * Math.cos(ang + 0.5), b[1] - h * Math.sin(ang + 0.5)); ctx.stroke();
    }
  }

  // il piano del tempo: lo stato nell'istante t
  if ($('vTaglio').checked && !fine) {
    const q = angoli(t);
    if (q.every(Boolean)) { poligono(q); ctx.fillStyle = 'rgba(244,241,234,0.07)'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    // il pattern cresciuto fin qui, disegnato all'altezza t
    ctx.fillStyle = 'rgba(244,241,234,0.85)';
    for (const pz of S.pianta) {
      let n = 0; while (n < pz.t.length && pz.t[n] <= t) n++;
      if (n < 2) continue;
      ctx.beginPath(); let ok = true;
      for (let i = 0; i < n; i++) { const r = P(pz.sx[i][0], pz.sx[i][1], t); if (!r) { ok = false; break; } i ? ctx.lineTo(r[0], r[1]) : ctx.moveTo(r[0], r[1]); }
      for (let i = n - 1; i >= 0 && ok; i--) { const r = P(pz.dx[i][0], pz.dx[i][1], t); if (!r) { ok = false; break; } ctx.lineTo(r[0], r[1]); }
      if (ok) { ctx.closePath(); ctx.fill(); }
    }
    // i blocchi che esistono ora, disegnati sul piano
    if ($('vCampi').checked) {
      ctx.lineWidth = 1;
      let quanti = 0;
      for (const b of S.conf.blocchi || []) {
        if (b.tempo && ((b.tempo[0] != null && t < b.tempo[0]) || (b.tempo[1] != null && t > b.tempo[1]))) continue;
        if (++quanti > 1500) break;
        const l = [].concat(b.legge)[0]; if (!l || l.tipo === 'ferma') continue;
        ctx.strokeStyle = `rgba(${coloreDi([].concat(b.legge).map((x) => x.tipo).sort().join('+')).join(',')},0.45)`;
        const reg = b.regione || { tipo: 'tutto' };
        const contorno = [];
        if (reg.tipo === 'cerchio') for (let k = 0; k <= 32; k++) { const a = (k / 32) * 2 * Math.PI; contorno.push([reg.centro[0] + reg.r * Math.cos(a), reg.centro[1] + reg.r * Math.sin(a)]); }
        else if (reg.tipo === 'settore') {
          for (let k = 0; k <= 16; k++) { const a = reg.da + (k / 16) * reg.ampiezza; contorno.push([reg.centro[0] + reg.r[1] * Math.cos(a), reg.centro[1] + reg.r[1] * Math.sin(a)]); }
          for (let k = 16; k >= 0; k--) { const a = reg.da + (k / 16) * reg.ampiezza; contorno.push([reg.centro[0] + reg.r[0] * Math.cos(a), reg.centro[1] + reg.r[0] * Math.sin(a)]); }
        } else if (reg.tipo === 'poligono') contorno.push(...reg.punti);
        if (contorno.length < 2) continue;
        const pr = contorno.map(([x, y]) => P(x, y, t));
        if (!pr.every(Boolean)) continue;
        poligono(pr); ctx.stroke();
      }
    }
    // le particelle in viaggio
    for (const pts of S.linee3d) {
      if (pts[0][3] > t || pts[pts.length - 1][3] < t) continue;
      let i = 0; while (i < pts.length - 1 && pts[i + 1][3] <= t) i++;
      const r = P(pts[i][0], pts[i][1], t); if (!r) continue;
      ctx.fillStyle = `rgb(${coloreDi(pts[i][5]).join(',')})`;
      ctx.beginPath(); ctx.arc(r[0], r[1], 2.6 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
    }
  }
  $('otempo').value = `t = ${t.toFixed(2)} / ${S.tMax.toFixed(2)}`;
}

// ---------- interazione
let trascina = null;
tela.addEventListener('pointerdown', (e) => { trascina = { x: e.clientX, y: e.clientY, sposta: e.shiftKey }; tela.setPointerCapture(e.pointerId); });
tela.addEventListener('pointermove', (e) => {
  if (!trascina) return;
  const dx = e.clientX - trascina.x, dy = e.clientY - trascina.y;
  trascina.x = e.clientX; trascina.y = e.clientY;
  if (trascina.sposta) {
    const k = cam.dist / 600;
    cam.bersaglio[0] -= (dx * Math.cos(cam.yaw)) * k; cam.bersaglio[2] += (dx * Math.sin(cam.yaw)) * k; cam.bersaglio[1] += dy * k;
  } else {
    cam.yaw += dx * 0.006; cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch + dy * 0.006));
  }
  disegna();
});
tela.addEventListener('pointerup', () => { trascina = null; });
tela.addEventListener('wheel', (e) => { e.preventDefault(); cam.dist = Math.max(0.4, Math.min(8, cam.dist * Math.exp(e.deltaY * 0.001))); disegna(); }, { passive: false });
$('tempo').addEventListener('input', () => { tempo = Number($('tempo').value); disegna(); });
for (const id of ['vLinee', 'vPianta', 'vTaglio', 'vForze', 'vMasse', 'vCampi']) $(id).addEventListener('change', disegna);
$('vista').addEventListener('click', () => { Object.assign(cam, { yaw: -0.65, pitch: 0.42, dist: 1.65, bersaglio: [0, 0.3, 0] }); disegna(); });
$('gioca').addEventListener('click', () => {
  gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶';
  if (gioca && tempo >= S.tMax * 0.999) tempo = 0;
  let ultimo = performance.now();
  const passo = (ora) => {
    if (!gioca) return;
    tempo = Math.min(S.tMax, tempo + ((ora - ultimo) / 1000) * (S.tMax / 12)); ultimo = ora;
    $('tempo').value = String(tempo); disegna();
    if (tempo >= S.tMax) { gioca = false; $('gioca').textContent = '▶'; return; }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
});
addEventListener('resize', disegna);

// ---------- che cosa mostrare
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
      $('nota').textContent = 'decodifico la tavola greca…';
      await new Promise((r) => setTimeout(r, 20));
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
window.__pronto = () => !!S;
window.__imposta = (o) => { Object.assign(cam, o.cam || {}); if (o.tempo != null) { tempo = o.tempo * S.tMax; $('tempo').value = String(tempo); } for (const [k, v] of Object.entries(o.spunte || {})) $(k).checked = v; disegna(); };
