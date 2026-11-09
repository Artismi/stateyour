// app.js — lo studio: un solo programma per ricostruire, modificare, inventare.
//   immagine → decodifica e lingua (in un processo a parte) → seme
//   seme → parole, simmetrie, istanze, parametri: si modificano a mano o sul disegno
//   numero → un seme inventato dalla grammatica; muta → lo stesso seme spostato
//   da zero → catene, petali, dischi, campiture, centro di simmetria, reticoli
// Due viste: il piano che cresce nel tempo, e lo spaziotempo in 3D.

import * as Mo from './modello.js';
import { pennellaTutte } from '../pennello.js';
import { creaVista3D, coloreLegge, NOMI_LEGGI } from '../vista3d.js';

const $ = (id) => document.getElementById(id);
const tela = $('tela2d'), ctx = tela.getContext('2d');
const base = document.createElement('canvas'), bctx = base.getContext('2d');

// ---------- stato
let seme = Mo.semeVuoto();
let storia = [], futuro = [];
let sel = { parola: null, istanza: null, elemento: null, copia: 0 };
let strumento = 'seleziona', bozza = null, trascina = null;
let vista = '2d', tempo = null, tMax = 0, gioca = false;
const cache = Mo.creaCache();
let scena = { coll: [], completa: false, gen: 0 };
let sporco = true;

const vista3D = creaVista3D($('tela3d'), {
  spunte: () => ({ linee: true, pianta: true, taglio: true, forze: false, masse: false, campi: true }),
  alCambio: ({ t, tMax: tm }) => { if (vista === '3d') $('otempo').value = `t = ${t.toFixed(1)} / ${tm.toFixed(1)}`; },
});

function stato(testo) { $('stato').textContent = testo; }
const scala = () => seme.larghezza / 300; // una misura tipica per i nuovi elementi

// ---------- cronologia e salvataggio
function salva() {
  storia.push(JSON.stringify(seme)); if (storia.length > 60) storia.shift();
  futuro = [];
}
function carica(nuovo, { tieniSelezione = false } = {}) {
  seme = nuovo;
  if (!tieniSelezione) sel = { parola: null, istanza: null, elemento: null, copia: 0 };
  ricalcola(); pannello();
  try { localStorage.setItem('stateyour:studio', JSON.stringify(seme)); } catch { /* niente memoria: va bene lo stesso */ }
}
function modifica(fn, opzioni = {}) { salva(); fn(); carica(seme, { tieniSelezione: true, ...opzioni }); }
$('annulla').onclick = () => { if (!storia.length) return; futuro.push(JSON.stringify(seme)); carica(JSON.parse(storia.pop()), { tieniSelezione: true }); };
$('rifai').onclick = () => { if (!futuro.length) return; storia.push(JSON.stringify(seme)); carica(JSON.parse(futuro.pop()), { tieniSelezione: true }); };

// ---------- il calcolo: ogni elemento si simula una volta, poi si sposta
let attesa = null;
function ricalcola() {
  const gen = ++scena.gen;
  scena.coll = Mo.collocazioni(seme).map((c) => ({ ...c, tracce: null }));
  scena.completa = false;
  clearTimeout(attesa);
  const t0 = performance.now();
  const passo = () => {
    if (gen !== scena.gen) return;
    const fine = performance.now() + 35;
    let mancano = 0;
    for (const c of scena.coll) {
      if (c.tracce) continue;
      if (performance.now() > fine) { mancano++; continue; }
      c.tracce = cache.nelMondo(c.e, c.M);
    }
    sporco = true; disegna();
    if (mancano) { stato(`faccio crescere il seme… ${scena.coll.length - mancano} / ${scena.coll.length}`); attesa = setTimeout(passo, 0); return; }
    scena.completa = true;
    tMax = 0; let punti = 0;
    for (const c of scena.coll) for (const tr of c.tracce) { punti += tr.punti.length; const u = tr.punti[tr.punti.length - 1]; if (u && u[3] > tMax) tMax = u[3]; }
    $('tempo').max = String(tMax || 1); $('tempo').step = String((tMax || 1) / 1000);
    if (tempo == null || tempo > tMax) $('tempo').value = String(tMax);
    stato(`${seme.parole.length} parole, ${seme.frase.length} istanze, ${scena.coll.length} elementi nel mondo, ${punti} avvenimenti · ${((performance.now() - t0) / 1000).toFixed(1)} s` + descrizioneOrigine());
    if (vista === '3d') aggiorna3D();
  };
  passo();
}
function descrizioneOrigine() {
  const o = seme.origine || {};
  if (o.tipo === 'inventato') return ` · inventato dal numero ${o.numero} (${o.disposizione || ''})${o.mutato ? `, mutato ${o.mutato} volte` : ''}`;
  if (o.tipo === 'decodifica') return ` · ricostruito da un'immagine${o.mutato ? `, mutato ${o.mutato} volte` : ''}`;
  return '';
}

// ---------- la vista 2D
let fit = { k: 1, ox: 0, oy: 0, H: 1 };
const X = (x) => fit.ox + x * fit.k, Y = (y) => fit.H - (fit.oy + y * fit.k);
const daSchermo = (px, py) => [(px - fit.ox) / fit.k, (fit.H - py - fit.oy) / fit.k];

function lineeFinoA(tracce, t) {
  const out = [];
  for (const tr of tracce) {
    let cur = [];
    for (const q of tr.punti) {
      if (t != null && q[3] > t) break;
      if (!q[2]) { if (cur.length > 1) out.push(cur); cur = []; continue; }
      cur.push([q[0], q[1], q[4] ?? 0]);
      if (q[5] === 'specchio' && cur.length > 1) { out.push(cur); cur = [[q[0], q[1], q[4] ?? 0]]; }
    }
    if (cur.length > 1) out.push(cur);
  }
  return out;
}

function disegnaBase() {
  const dpr = devicePixelRatio || 1;
  const W = tela.clientWidth * dpr, H = tela.clientHeight * dpr;
  if (base.width !== W || base.height !== H) { base.width = W; base.height = H; tela.width = W; tela.height = H; }
  const k = Math.min((W - 40 * dpr) / seme.larghezza, (H - 40 * dpr) / seme.altezza);
  fit = { k, ox: (W - seme.larghezza * k) / 2, oy: (H - seme.altezza * k) / 2, H };
  bctx.fillStyle = '#e9e5db'; bctx.fillRect(0, 0, W, H);
  bctx.fillStyle = seme.colori.carta; bctx.fillRect(X(0), Y(seme.altezza), seme.larghezza * k, seme.altezza * k);
  const t = tempo == null || tempo >= tMax * 0.999 ? null : tempo;
  const voci = [];
  for (const c of scena.coll) if (c.tracce) for (const l of lineeFinoA(c.tracce, t)) voci.push({ punti: l, colore: seme.colori.inchiostro });
  pennellaTutte(bctx, voci, X, Y, k, $('stile').value, seme.colori.carta);
  sporco = false;
}

function placementSelezionato() {
  if (sel.parola == null || sel.istanza == null || !seme.frase[sel.istanza]) return null;
  const w = seme.parole[sel.parola]; if (!w) return null;
  const G = Mo.gruppo(w)[sel.copia || 0] || Mo.ID;
  return Mo.comp(seme.frase[sel.istanza].M, G);
}

function disegna() {
  if (vista !== '2d') return;
  if (sporco) disegnaBase();
  ctx.drawImage(base, 0, 0);
  const dpr = devicePixelRatio || 1;
  // la parola scelta: le sue istanze in evidenza
  if (sel.parola != null) {
    ctx.save(); ctx.globalAlpha = 0.85;
    const voci = [];
    for (const c of scena.coll) if (c.parola === sel.parola && c.tracce) {
      const elementoScelto = sel.elemento != null && c.elemento === sel.elemento && c.istanza === sel.istanza;
      for (const l of lineeFinoA(c.tracce, null)) voci.push({ punti: l, colore: elementoScelto ? '#ffd166' : (c.istanza === sel.istanza ? '#f08a4b' : '#e9b18f') });
    }
    pennellaTutte(ctx, voci, X, Y, fit.k, 'filo');
    ctx.restore();
    // il centro e gli assi di simmetria, nell'istanza scelta
    const w = seme.parole[sel.parola], ist = seme.frase[sel.istanza];
    if (w && ist) {
      const c = Mo.app(ist.M, w.centro), R = 0.18 * Math.min(seme.larghezza, seme.altezza) * fit.k;
      ctx.strokeStyle = '#1f6feb'; ctx.lineWidth = 1.2 * dpr; ctx.setLineDash([6 * dpr, 4 * dpr]);
      if (w.simmetria.tipo === 'D') for (let j = 0; j < w.simmetria.n; j++) {
        const a0 = (w.simmetria.asse ?? Math.PI / 2) + Math.PI * j / w.simmetria.n;
        const d = Mo.app([ist.M[0], ist.M[1], ist.M[2], ist.M[3], 0, 0], [Math.cos(a0), Math.sin(a0)]), l = Math.hypot(...d) || 1;
        ctx.beginPath(); ctx.moveTo(X(c[0]) - d[0] / l * R, Y(c[1]) + d[1] / l * R); ctx.lineTo(X(c[0]) + d[0] / l * R, Y(c[1]) - d[1] / l * R); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(X(c[0]) - 7 * dpr, Y(c[1])); ctx.lineTo(X(c[0]) + 7 * dpr, Y(c[1])); ctx.moveTo(X(c[0]), Y(c[1]) - 7 * dpr); ctx.lineTo(X(c[0]), Y(c[1]) + 7 * dpr); ctx.stroke();
      if (w.simmetria.tipo === 'C') { ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), 10 * dpr, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  // le maniglie dell'elemento scelto
  const Mp = placementSelezionato();
  if (Mp && sel.elemento != null) {
    const e = seme.parole[sel.parola].elementi[sel.elemento]?.e;
    if (e) for (const h of Mo.maniglie(e)) {
      const p = Mo.app(Mp, h.pos);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1c1b18'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 5 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  // la bozza di ciò che si sta disegnando
  if (bozza && bozza.punti.length) {
    const M = bozza.M;
    ctx.strokeStyle = '#1f6feb'; ctx.fillStyle = '#1f6feb'; ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    bozza.punti.forEach((q, i) => { const p = Mo.app(M, q); i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); });
    if (bozza.cursore) ctx.lineTo(bozza.cursore[0], bozza.cursore[1]);
    if (bozza.tipo === 'campitura' && bozza.punti.length > 2) ctx.closePath();
    ctx.stroke();
    for (const q of bozza.punti) { const p = Mo.app(M, q); ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 3 * dpr, 0, Math.PI * 2); ctx.fill(); }
  }
  if (tempo != null && tempo < tMax * 0.999) $('otempo').value = `t = ${tempo.toFixed(1)} / ${tMax.toFixed(1)}`;
  else $('otempo').value = scena.completa ? 'cresciuto' : '';
}

// ---------- la vista 3D
function aggiorna3D() {
  if (!scena.completa) return;
  const tracce = scena.coll.flatMap((c) => c.tracce);
  vista3D.imposta(Mo.compila(seme), tracce);
  vista3D.tempo(tempo == null ? vista3D.tMax() : tempo);
}
function cambiaVista(v) {
  vista = v;
  $('v2d').classList.toggle('attivo', v === '2d'); $('v3d').classList.toggle('attivo', v === '3d');
  $('tela2d').hidden = v !== '2d'; $('tela3d').hidden = v !== '3d';
  if (v === '3d') aggiorna3D(); else { sporco = true; disegna(); }
}
$('v2d').onclick = () => cambiaVista('2d');
$('v3d').onclick = () => cambiaVista('3d');

// ---------- il tempo
$('tempo').oninput = () => {
  tempo = Number($('tempo').value);
  if (vista === '3d') vista3D.tempo(tempo); else { sporco = true; disegna(); }
};
$('gioca').onclick = () => {
  gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶';
  if (gioca && (tempo == null || tempo >= tMax * 0.999)) tempo = 0;
  let ultimo = performance.now();
  const passo = (ora) => {
    if (!gioca) return;
    tempo = Math.min(tMax, (tempo ?? 0) + ((ora - ultimo) / 1000) * (tMax / 8)); ultimo = ora;
    $('tempo').value = String(tempo);
    if (vista === '3d') vista3D.tempo(tempo); else { sporco = true; disegna(); }
    if (tempo >= tMax) { gioca = false; $('gioca').textContent = '▶'; return; }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
};
$('stile').onchange = () => { sporco = true; disegna(); };
addEventListener('resize', () => { sporco = true; disegna(); if (vista === '3d') vista3D.disegna(); });

// ---------- toccare il disegno
function puntoTela(ev) { const r = tela.getBoundingClientRect(), dpr = devicePixelRatio || 1; return [(ev.clientX - r.left) * dpr, (ev.clientY - r.top) * dpr]; }
function colpito(px, py) {
  let best = null, bd = 10 * (devicePixelRatio || 1);
  for (const c of scena.coll) {
    if (!c.tracce) continue;
    for (const tr of c.tracce) for (let i = 0; i < tr.punti.length; i += 2) {
      const q = tr.punti[i], d = Math.hypot(X(q[0]) - px, Y(q[1]) - py) - ((q[4] ?? 0) / 2) * fit.k;
      if (d < bd) { bd = d; best = c; }
    }
  }
  return best;
}
function maniglia(px, py) {
  const Mp = placementSelezionato();
  if (!Mp || sel.elemento == null) return null;
  const e = seme.parole[sel.parola].elementi[sel.elemento]?.e; if (!e) return null;
  for (const h of Mo.maniglie(e)) { const p = Mo.app(Mp, h.pos); if (Math.hypot(X(p[0]) - px, Y(p[1]) - py) < 9 * (devicePixelRatio || 1)) return h; }
  return null;
}
// la parola in cui si disegna: quella scelta, oppure una nuova
function parolaBersaglio() {
  if (sel.parola != null && seme.parole[sel.parola]) {
    const ist = sel.istanza ?? seme.frase.findIndex((f) => f.parola === sel.parola);
    if (ist >= 0) return { parola: sel.parola, istanza: ist, M: seme.frase[ist].M, nuova: false };
  }
  return { parola: seme.parole.length, istanza: seme.frase.length, M: Mo.ID, nuova: true };
}
function aggiungiElemento(target, e) {
  modifica(() => {
    if (target.nuova) {
      seme.parole.push({ nome: nomeLibero(), centro: [seme.larghezza / 2, seme.altezza / 2], simmetria: { tipo: 'id', n: 1, asse: Math.PI / 2 }, elementi: [] });
      seme.frase.push({ parola: target.parola, M: Mo.ID, parti: null, varianti: [] });
    }
    const w = seme.parole[target.parola];
    w.elementi.push({ e, copie: null });
    // un'istanza con parti scelte non avrebbe il nuovo elemento: ora le ha tutte
    for (const f of seme.frase) if (f.parola === target.parola) f.parti = null;
    sel = { parola: target.parola, istanza: target.istanza, elemento: w.elementi.length - 1, copia: 0 };
  });
}
function nomeLibero() {
  const lettere = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', usati = new Set(seme.parole.map((w) => w.nome));
  for (let i = 0; i < 26 * 27; i++) { const n = i < 26 ? lettere[i] : lettere[Math.floor(i / 26) - 1] + lettere[i % 26]; if (!usati.has(n)) return n; }
  return `P${seme.parole.length}`;
}
function chiudiBozza() {
  if (!bozza) return;
  const { tipo, punti, target } = bozza;
  bozza = null;
  if (tipo === 'catena' && punti.length >= 2) aggiungiElemento(target, { tipo: 'catena', def: { punti, spessore: scala() * 1.2, esponente: 1, rastremazione: 0.8 } });
  else if (tipo === 'campitura' && punti.length >= 3) {
    // il punto di partenza del biliardo: dentro il poligono
    const dentro = (p) => { let d = false; for (let i = 0, j = punti.length - 1; i < punti.length; j = i++) { if ((punti[i][1] > p[1]) !== (punti[j][1] > p[1]) && p[0] < (punti[j][0] - punti[i][0]) * (p[1] - punti[i][1]) / (punti[j][1] - punti[i][1]) + punti[i][0]) d = !d; } return d; };
    let inizio = [punti.reduce((s, p) => s + p[0], 0) / punti.length, punti.reduce((s, p) => s + p[1], 0) / punti.length];
    if (!dentro(inizio)) inizio = [(punti[0][0] + punti[1][0] + punti[2][0]) / 3, (punti[0][1] + punti[1][1] + punti[2][1]) / 3];
    aggiungiElemento(target, { tipo: 'campitura', contorno: punti, buchi: [], spessore: scala() * 0.6, inizio });
  } else disegna();
}

tela.addEventListener('pointerdown', (ev) => {
  const [px, py] = puntoTela(ev);
  const w = daSchermo(px, py);
  tela.setPointerCapture(ev.pointerId);
  if (strumento === 'seleziona') {
    const h = maniglia(px, py);
    if (h) { salva(); trascina = { tipo: 'maniglia', chiave: h.chiave }; return; }
    const c = colpito(px, py);
    if (c && c.parola != null) sel = { parola: c.parola, istanza: c.istanza, elemento: c.elemento ?? null, copia: c.copia ?? 0 };
    else sel = { parola: null, istanza: null, elemento: null, copia: 0 };
    pannello(); disegna(); return;
  }
  if (strumento === 'sposta') {
    const c = colpito(px, py);
    if (c && c.istanza != null) { sel = { parola: c.parola, istanza: c.istanza, elemento: c.elemento ?? null, copia: c.copia ?? 0 }; salva(); trascina = { tipo: 'istanza', da: w, M: seme.frase[c.istanza].M.slice() }; pannello(); }
    return;
  }
  if (strumento === 'centro') {
    if (sel.parola == null) { stato('scegli prima una parola: il centro è il punto attorno a cui gira la sua simmetria'); return; }
    const M = seme.frase[sel.istanza ?? seme.frase.findIndex((f) => f.parola === sel.parola)].M;
    modifica(() => { seme.parole[sel.parola].centro = Mo.app(Mo.inversa(M), w); });
    return;
  }
  if (strumento === 'disco') { const t = parolaBersaglio(); aggiungiElemento(t, { tipo: 'disco', pos: Mo.app(Mo.inversa(t.M), w), d: scala() * 4 }); return; }
  if (strumento === 'petalo') { const t = parolaBersaglio(); bozza = { tipo: 'petalo', target: t, M: t.M, punti: [Mo.app(Mo.inversa(t.M), w)] }; return; }
  if (strumento === 'catena' || strumento === 'campitura') {
    if (!bozza) { const t = parolaBersaglio(); bozza = { tipo: strumento, target: t, M: t.M, punti: [] }; }
    const q = Mo.app(Mo.inversa(bozza.M), w);
    const ultimo = bozza.punti[bozza.punti.length - 1];
    if (!ultimo || Math.hypot(q[0] - ultimo[0], q[1] - ultimo[1]) > 0.5) bozza.punti.push(q);
    disegna();
  }
});
tela.addEventListener('pointermove', (ev) => {
  const [px, py] = puntoTela(ev);
  if (bozza) { bozza.cursore = [px, py]; disegna(); }
  if (!trascina) return;
  const w = daSchermo(px, py);
  if (trascina.tipo === 'maniglia') {
    const Mp = placementSelezionato(), e = seme.parole[sel.parola].elementi[sel.elemento].e;
    Mo.spostaManiglia(e, trascina.chiave, Mo.app(Mo.inversa(Mp), w));
    clearTimeout(trascina.timer); trascina.timer = setTimeout(() => ricalcola(), 60);
    disegna();
  } else if (trascina.tipo === 'istanza') {
    const f = seme.frase[sel.istanza];
    f.M = trascina.M.slice(); f.M[4] += w[0] - trascina.da[0]; f.M[5] += w[1] - trascina.da[1];
    clearTimeout(trascina.timer); trascina.timer = setTimeout(() => ricalcola(), 60);
  }
});
tela.addEventListener('pointerup', (ev) => {
  if (bozza && bozza.tipo === 'petalo') {
    const [px, py] = puntoTela(ev), q = Mo.app(Mo.inversa(bozza.M), daSchermo(px, py)), b = bozza.punti[0];
    const d = [q[0] - b[0], q[1] - b[1]], L = Math.hypot(...d), target = bozza.target;
    bozza = null;
    if (L > scala()) aggiungiElemento(target, { tipo: 'petalo', pos: b, dir: [d[0] / L, d[1] / L], L, W: L * 0.28, b: L * 0.03, curva: 0 });
    else disegna();
  }
  if (trascina) { clearTimeout(trascina.timer); trascina = null; carica(seme, { tieniSelezione: true }); }
});
tela.addEventListener('dblclick', () => { if (bozza && bozza.punti.length > 1) { bozza.punti.pop(); chiudiBozza(); } });
addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
  if (ev.key === 'Enter') chiudiBozza();
  if (ev.key === 'Escape') { bozza = null; sel = { parola: null, istanza: null, elemento: null, copia: 0 }; pannello(); disegna(); }
  if ((ev.key === 'Delete' || ev.key === 'Backspace') && sel.parola != null) { ev.preventDefault(); if (sel.elemento != null) eliminaElemento(); else eliminaIstanza(); }
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); $('annulla').onclick(); }
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') { ev.preventDefault(); $('rifai').onclick(); }
});

// ---------- modifiche strutturali
function eliminaElemento() {
  modifica(() => {
    const w = seme.parole[sel.parola]; w.elementi.splice(sel.elemento, 1);
    for (const f of seme.frase) if (f.parola === sel.parola) f.parti = null;
    sel.elemento = null;
  });
}
function eliminaIstanza() {
  modifica(() => { seme.frase.splice(sel.istanza, 1); sel = { parola: null, istanza: null, elemento: null, copia: 0 }; });
}
function eliminaParola(i) {
  modifica(() => {
    seme.parole.splice(i, 1);
    seme.frase = seme.frase.filter((f) => f.parola !== i).map((f) => ({ ...f, parola: f.parola > i ? f.parola - 1 : f.parola }));
    sel = { parola: null, istanza: null, elemento: null, copia: 0 };
  });
}

// ---------- il pannello
function el(tag, attr = {}, ...figli) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attr)) { if (k === 'onclick' || k === 'onchange' || k === 'oninput') n[k] = v; else if (k === 'class') n.className = v; else if (v !== undefined && v !== null) n.setAttribute(k, v); }
  for (const f of figli) n.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return n;
}
function numero(etichetta, valore, quando, { passo = 'any', min, max } = {}) {
  const inp = el('input', { type: 'number', step: passo, min, max, value: Number.isFinite(valore) ? +(+valore).toFixed(4) : '' });
  inp.onchange = () => { const v = Number(inp.value); if (Number.isFinite(v)) quando(v); };
  return [el('label', {}, etichetta), inp];
}
function scelta(etichetta, valore, voci, quando) {
  const s = el('select', {}, ...voci.map(([v, t]) => { const o = el('option', { value: v }, t); if (String(v) === String(valore)) o.selected = true; return o; }));
  s.onchange = () => quando(s.value);
  return [el('label', {}, etichetta), s];
}
function spunta(etichetta, valore, quando) {
  const c = el('input', { type: 'checkbox' }); c.checked = !!valore; c.onchange = () => quando(c.checked);
  return [el('label', {}, etichetta), c];
}
const AIUTI = {
  seleziona: 'tocca una linea per scegliere la sua parola e il suo elemento; trascina i punti bianchi per modificarlo',
  sposta: 'trascina una figura per spostare la sua istanza',
  catena: 'clicca i punti di ancoraggio; doppio clic o Invio per finire. Poi, nel pannello, la voluta e lo spessore',
  petalo: 'premi alla base e trascina fino alla punta',
  disco: 'clicca dove vuoi un disco pieno',
  campitura: 'clicca i vertici del contorno; doppio clic o Invio per chiudere: dentro rimbalzerà una particella',
  centro: 'clicca il centro di simmetria della parola scelta',
};
function pannello() {
  const P = $('pannello'); P.innerHTML = '';
  // strumenti
  P.append(el('h2', {}, 'strumenti'));
  const st = el('div', { class: 'strumenti' });
  for (const [k, t] of [['seleziona', 'scegli'], ['sposta', 'sposta'], ['catena', 'catena'], ['petalo', 'petalo'], ['disco', 'disco'], ['campitura', 'campitura'], ['centro', 'centro']]) {
    st.append(el('button', { class: strumento === k ? 'attivo' : '', onclick: () => { chiudiBozza(); strumento = k; pannello(); } }, t));
  }
  P.append(st, el('p', { class: 'aiuto' }, AIUTI[strumento]));

  // il seme
  P.append(el('h2', {}, 'seme'));
  const cs = el('div', { class: 'campi' });
  cs.append(...numero('larghezza', seme.larghezza, (v) => modifica(() => { seme.larghezza = v; })), ...numero('altezza', seme.altezza, (v) => modifica(() => { seme.altezza = v; })));
  const ci = el('input', { type: 'color', value: seme.colori.inchiostro }); ci.onchange = () => modifica(() => { seme.colori.inchiostro = ci.value; });
  const cc = el('input', { type: 'color', value: seme.colori.carta }); cc.onchange = () => modifica(() => { seme.colori.carta = cc.value; });
  cs.append(el('label', {}, 'inchiostro'), ci, el('label', {}, 'carta'), cc);
  P.append(cs);

  // le parole
  P.append(el('h2', {}, `parole (${seme.parole.length})`));
  const lista = el('div', { class: 'parole' });
  seme.parole.forEach((w, i) => {
    const n = seme.frase.filter((f) => f.parola === i).length;
    const s = w.simmetria.tipo === 'id' ? 'C1' : `${w.simmetria.tipo}${w.simmetria.n}`;
    lista.append(el('div', { class: sel.parola === i ? 'scelta' : '', onclick: () => { sel = { parola: i, istanza: seme.frase.findIndex((f) => f.parola === i), elemento: null, copia: 0 }; pannello(); disegna(); } },
      el('span', {}, `${w.nome}  ${s}`), el('span', { class: 'info' }, `${w.elementi.length} el. ×${n}`)));
  });
  P.append(lista, el('div', { class: 'riga-bottoni' }, el('button', { onclick: () => { modifica(() => { seme.parole.push({ nome: nomeLibero(), centro: [seme.larghezza / 2, seme.altezza / 2], simmetria: { tipo: 'id', n: 1, asse: Math.PI / 2 }, elementi: [] }); seme.frase.push({ parola: seme.parole.length - 1, M: Mo.ID, parti: null, varianti: [] }); sel = { parola: seme.parole.length - 1, istanza: seme.frase.length - 1, elemento: null, copia: 0 }; }); strumento = 'catena'; pannello(); } }, 'nuova parola')));

  if (sel.parola == null || !seme.parole[sel.parola]) return;
  const w = seme.parole[sel.parola];

  // la parola scelta
  P.append(el('h2', {}, `parola ${w.nome}`));
  const cp = el('div', { class: 'campi' });
  cp.append(...scelta('simmetria', w.simmetria.tipo, [['id', 'nessuna'], ['D', 'specchi D'], ['C', 'rotazioni C']], (v) => modifica(() => { w.simmetria.tipo = v; if (v !== 'id' && !(w.simmetria.n >= 1)) w.simmetria.n = 2; for (const e of w.elementi) e.copie = null; for (const f of seme.frase) if (f.parola === sel.parola) f.parti = null; })));
  if (w.simmetria.tipo !== 'id') {
    cp.append(...numero('ordine n', w.simmetria.n, (v) => modifica(() => { w.simmetria.n = Math.max(1, Math.min(24, Math.round(v))); for (const e of w.elementi) e.copie = null; for (const f of seme.frase) if (f.parola === sel.parola) f.parti = null; }), { passo: 1, min: 1, max: 24 }));
    if (w.simmetria.tipo === 'D') cp.append(...numero('asse (gradi)', (w.simmetria.asse ?? Math.PI / 2) * 180 / Math.PI, (v) => modifica(() => { w.simmetria.asse = v * Math.PI / 180; }), { passo: 1 }));
  }
  cp.append(...numero('centro x', w.centro[0], (v) => modifica(() => { w.centro[0] = v; })), ...numero('centro y', w.centro[1], (v) => modifica(() => { w.centro[1] = v; })));
  P.append(cp);
  // ripetere su reticolo
  const opz = { gruppo: 'p1', nx: 4, ny: 3, passoX: Math.round(seme.larghezza / 5), passoY: Math.round(seme.altezza / 4), scala: 1 };
  const cr = el('div', { class: 'campi' });
  cr.append(...scelta('reticolo', opz.gruppo, [['p1', 'p1 traslazione'], ['pm', 'pm specchio'], ['pmm', 'pmm due specchi'], ['p2', 'p2 mezzo giro'], ['p4', 'p4 quarto di giro'], ['cm', 'cm sfalsato'], ['esagonale', 'esagonale']], (v) => { opz.gruppo = v; }));
  cr.append(...numero('colonne', opz.nx, (v) => { opz.nx = Math.max(1, Math.round(v)); }, { passo: 1, min: 1 }), ...numero('righe', opz.ny, (v) => { opz.ny = Math.max(1, Math.round(v)); }, { passo: 1, min: 1 }));
  cr.append(...numero('passo x', opz.passoX, (v) => { opz.passoX = v; }), ...numero('passo y', opz.passoY, (v) => { opz.passoY = v; }), ...numero('scala', opz.scala, (v) => { opz.scala = v; }, { passo: 0.05 }));
  P.append(cr, el('div', { class: 'riga-bottoni' },
    el('button', { onclick: () => { salva(); carica(Mo.ripetiSuReticolo(seme, sel.parola, opz), { tieniSelezione: false }); } }, 'ripeti su reticolo'),
    el('button', { onclick: () => eliminaParola(sel.parola) }, 'elimina parola')));

  // l'istanza scelta
  const ist = seme.frase[sel.istanza];
  if (ist && ist.parola === sel.parola) {
    const par = Mo.parametri(ist.M);
    P.append(el('h2', {}, `istanza ${sel.istanza + 1} di ${w.nome}`));
    const cist = el('div', { class: 'campi' });
    const imposta = (chiave) => (v) => modifica(() => { const p = Mo.parametri(ist.M); p[chiave] = v; ist.M = Mo.daParametri(p); });
    cist.append(...numero('x', par.x, imposta('x')), ...numero('y', par.y, imposta('y')), ...numero('rotazione', par.rotazione, imposta('rotazione'), { passo: 1 }), ...numero('scala', par.scala, imposta('scala'), { passo: 0.05 }), ...spunta('specchiata', par.specchiata, imposta('specchiata')));
    P.append(cist, el('div', { class: 'riga-bottoni' },
      el('button', { onclick: () => modifica(() => { const M = ist.M.slice(); M[4] += seme.larghezza / 10; seme.frase.push({ ...JSON.parse(JSON.stringify(ist)), M }); sel.istanza = seme.frase.length - 1; }) }, 'duplica'),
      el('button', { onclick: eliminaIstanza }, 'elimina istanza')));
  }

  // l'elemento scelto
  const voce = sel.elemento != null ? w.elementi[sel.elemento] : null;
  if (voce) {
    const e = voce.e;
    P.append(el('h2', {}, `elemento: ${Mo.descriviElemento(e)}`));
    const ce = el('div', { class: 'campi' });
    const cambia = (fn) => (v) => modifica(() => fn(v));
    if (e.tipo === 'catena') {
      const d = e.def;
      ce.append(...numero('spessore', d.spessore ?? 0, cambia((v) => { d.spessore = v; })));
      ce.append(...scelta('sezione', d.esponente === 0 ? '0' : '1', [['1', 'pennello: si stringe rallentando'], ['0', 'filo: sezione costante']], cambia((v) => { d.esponente = Number(v); })));
      ce.append(...numero('rastremazione', d.rastremazione ?? 1, cambia((v) => { d.rastremazione = Math.max(0.05, Math.min(1, v)); }), { passo: 0.05, min: 0.05, max: 1 }));
      ce.append(...spunta('voluta in fondo', !!d.voluta, cambia((v) => { d.voluta = v ? { giri: 1.8, rMin: scala() * 0.6, verso: 'destra' } : undefined; })));
      if (d.voluta) {
        ce.append(...numero('giri', d.voluta.giri, cambia((v) => { d.voluta.giri = Math.max(0.2, v); }), { passo: 0.1 }));
        ce.append(...numero('raggio finale', d.voluta.rMin ?? 1, cambia((v) => { d.voluta.rMin = Math.max(0.05, v); }), { passo: 0.1 }));
        ce.append(...scelta('verso', d.voluta.verso || 'auto', [['auto', 'segue la curva'], ['destra', 'orario'], ['sinistra', 'antiorario']], cambia((v) => { d.voluta.verso = v === 'auto' ? undefined : v; })));
        ce.append(...numero('occhio (diametro)', d.voluta.occhio ?? 0, cambia((v) => { d.voluta.occhio = v > 0 ? v : undefined; }), { passo: 0.5 }));
      }
      if (d.rami && d.rami.some((r) => r.simile)) ce.append(...numero('profondità', d.profondita ?? 2, cambia((v) => { d.profondita = Math.max(0, Math.min(5, Math.round(v))); }), { passo: 1, min: 0, max: 5 }));
    } else if (e.tipo === 'petalo') {
      ce.append(...numero('lunghezza', e.L, cambia((v) => { e.L = Math.max(0.5, v); })), ...numero('larghezza punta', e.W, cambia((v) => { e.W = Math.max(0.1, v); })), ...numero('larghezza base', e.b, cambia((v) => { e.b = Math.max(0.05, v); })), ...numero('curva (rad)', e.curva, cambia((v) => { e.curva = v; }), { passo: 0.05 }));
    } else if (e.tipo === 'disco') {
      ce.append(...numero('diametro', e.d, cambia((v) => { e.d = Math.max(0.2, v); })));
    } else if (e.tipo === 'campitura') {
      ce.append(...numero('penna', e.spessore, cambia((v) => { e.spessore = Math.max(0.2, v); })), ...numero('copertura', e.copertura ?? 4.5, cambia((v) => { e.copertura = Math.max(0.5, v); }), { passo: 0.5 }));
    }
    const nCopie = voce.copie ? voce.copie.length : Mo.gruppo(w).length;
    ce.append(el('label', {}, 'copie per simmetria'), el('span', {}, String(nCopie)));
    P.append(ce, el('div', { class: 'riga-bottoni' }, el('button', { onclick: eliminaElemento }, 'elimina elemento')));
  }
}

// ---------- la barra in alto
$('nuovo').onclick = () => { salva(); carica(Mo.semeVuoto()); strumento = 'catena'; pannello(); stato('un foglio vuoto: disegna una catena, un petalo, un disco o una campitura; poi scegli la simmetria e ripeti su reticolo'); };
$('inventa').onclick = () => { salva(); tempo = null; carica(Mo.inventa(Number($('numero').value) || 1)); };
$('dado').onclick = () => { $('numero').value = String(1 + Math.floor(Math.random() * 99999)); $('inventa').onclick(); };
let mutazioni = 0;
$('muta').onclick = () => { salva(); tempo = null; carica(Mo.muta(seme, Number($('intensita').value), Number($('numero').value) * 7919 + (++mutazioni)), { tieniSelezione: true }); };
$('copia').onclick = async () => {
  const testo = JSON.stringify(seme);
  try { await navigator.clipboard.writeText(testo); stato('seme copiato negli appunti'); }
  catch { $('dialogoTitolo').textContent = 'il seme in JSON: selezionalo e copialo'; $('dialogoTesto').value = testo; $('dialogoOk').hidden = true; $('dialogo').showModal(); }
};
$('incolla').onclick = () => { $('dialogoTitolo').textContent = 'incolla qui un seme in JSON'; $('dialogoTesto').value = ''; $('dialogoOk').hidden = false; $('dialogo').showModal(); };
$('dialogoChiudi').onclick = () => $('dialogo').close();
$('dialogoOk').onclick = () => {
  try {
    const s = JSON.parse($('dialogoTesto').value);
    if (!s || !Array.isArray(s.parole) || !Array.isArray(s.frase)) throw new Error('non sembra un seme dello studio');
    $('dialogo').close(); salva(); tempo = null; carica(s);
  } catch (err) { $('dialogoTitolo').textContent = `non riesco a leggerlo: ${err.message}`; }
};
$('scarica').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(seme)], { type: 'application/json' }));
  a.download = 'seme.json'; a.click();
};

// ---------- un'immagine: la decodifica in un processo a parte
let lavoratore = null;
async function decodificaImmagine(src, nome) {
  stato(`carico ${nome}…`);
  const im = new Image(); im.src = src; await im.decode();
  // le immagini grandi si riducono: la lettura resta fedele e molto più veloce
  const lato = Math.max(im.naturalWidth, im.naturalHeight), k = Math.min(1, 900 / lato);
  const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
  const x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
  const dati = x.getImageData(0, 0, c.width, c.height).data;
  if (lavoratore) lavoratore.terminate();
  lavoratore = new Worker(new URL('./lavoratore.js', import.meta.url), { type: 'module' });
  lavoratore.onmessage = (ev) => {
    const m = ev.data;
    if (m.stato) stato(m.stato);
    if (m.errore) { stato(`la decodifica non è riuscita: ${m.errore.split('\n')[0]}`); console.error(m.errore); }
    if (m.fatto) {
      salva(); tempo = null;
      carica(Mo.semeDaLingua(m.lingua, m.misure));
      stato(`${nome}: ricostruito in ${((m.tempi.lettura + m.tempi.lingua) / 1000).toFixed(1)} s · ${m.lingua.parole.length} parole, seme da ${m.lingua.conta.decodificati} a ${m.lingua.conta.vocabolario} elementi`);
      lavoratore.terminate(); lavoratore = null;
    }
  };
  lavoratore.postMessage({ img: { larghezza: c.width, altezza: c.height, canali: 4, dati } });
}
$('file').onchange = (ev) => { const f = ev.target.files[0]; if (f) decodificaImmagine(URL.createObjectURL(f), f.name); };
$('esempio').onclick = () => decodificaImmagine('./esempi/greco_6.png', 'la tavola greca n. 6');

// ---------- si comincia
(function avvio() {
  let iniziale = null;
  try { iniziale = JSON.parse(localStorage.getItem('stateyour:studio') || 'null'); } catch { iniziale = null; }
  if (location.hash === '#esempio') { pannello(); $('esempio').onclick(); return; }
  carica(iniziale && Array.isArray(iniziale.parole) ? iniziale : Mo.inventa(7));
  if (!iniziale) stato('un seme inventato dal numero 7. Carica un\'immagine, inventa con un altro numero, muta, oppure parti da zero con «nuovo»');
})();
window.__studio = { seme: () => seme, scena: () => scena, carica: (s) => carica(s), Mo };
