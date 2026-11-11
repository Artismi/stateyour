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

import { simulaMondo, dentro, raggio, gittata, forze, LEGGI, accesoA, leggeA, campiContinui } from './mondo.js';
import { universo } from './biblioteca.js';
import { segmentiSezione, inclinata, VISTA_SOPRA } from './sezione.js';
import { GRUPPI, RIPETI_BASE, motivo } from './pattern.js';
import { numeroDi, REGIONI, PIANETI_MAX, STELLE, cosmo as cosmoDi, cellaDi, descriviIndirizzo, cosmoBase, ramiCosmo, cosmoRamo, semeEvento, motiDi } from './cosmo.js';
import { fmtLunghezza } from './unita.js';
import { conteggioVero, fmtGrande } from './nebbia.js';
import { convezione, celle } from './fluidi.js';
import { superficiePianeta, immagineSuperficie, climaSuperficie, erosione } from './geologia.js';
import { fascia as fasciaDi, sistema as sistemaDi, pianeta as pianetaDi, galassia as galassiaDi } from './cosmo.js';
import { disegnaMappa, zoomMappa, colpisciMappa, camSuRegione, volaVerso, percorso, rocciaDi, superficieDi, quandoSuperficiePronta, cercaFinestra, scenaAtomi } from './mappa.js';
import { creaVista3D as creaVistaAtomi } from './atomi3d.js';
import { COMPOSIZIONI, ELEMENTI, nuovoElemento, clona, storia, fmt, trasformaPosto } from './esperimento.js';
import { creaVista3D } from '../vista3d.js';
import { cellaMateria } from './materia.js';
import { sorgente } from './eventi.js';

const $ = (id) => document.getElementById(id);
const tela = $('tela'), ctx = tela.getContext('2d'), tela3d = $('tela3d'), pannello = $('pannello');
const INK = '#1c1b18', GRIGIO = '#8a867c', ACCENTO = '#d0532f', CARTA = '#f3efe6';

// ---------- le cinque forze: un colore, un simbolo, una frase
export const FORZE = {
  gravita: { nome: 'gravità', art: 'la gravità', col: [214, 84, 52], simbolo: '●', frase: 'le masse ferme curvano lo spazio: chi passa cade verso di loro, uguale se leggero o pesante; la luce si piega il doppio. Nessuno sposta le masse.' },
  magnetico: { nome: 'magnetismo', art: 'il magnetismo', col: [52, 104, 214], simbolo: '⊙', frase: 'dove c\'è campo B le cariche girano: + da una parte, − dall\'altra. Raggio m·v/(q·B): più campo, curve più strette; più massa o velocità, più larghe.' },
  materia: { nome: 'materia', art: 'la materia', col: [150, 104, 50], simbolo: '▒', frase: 'la materia frena le cariche, e più sono lente più frenano: la curva si stringe in spirale e finisce in una macchia tonda (l\'occhio).' },
  decadimento: { nome: 'decadimento', art: 'il decadimento', col: [36, 140, 76], simbolo: '✳', frase: 'dopo la sua vita una particella si divide nelle sue figlie: è il punto da cui partono i petali, le forcelle, i ventagli.' },
};
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const PARTI = { gravita: 'gravita', magnetico: 'magnetico', materia: 'materia' };
const LUCE = [196, 142, 0]; // il colore dei fotoni (quando si vedono)
const haForza = (legge, f) => String(legge || '').split('+').some((p) => PARTI[p] === f);
// il colore di ogni punto di una linea: le forze che agiscono lì, pesate per
// quanto sono forti. Una spirale passa dal blu (il campo la piega) al marrone
// (la materia la frena) man mano che rallenta.
function coloriTraccia(cella, tr) {
  const P = tr.punti, out = new Array(P.length), luce = !!tr.specie.luce, quote = (tr.quote = new Array(P.length));
  const nessuna = { gravita: 0, magnetico: 0, materia: 0 };
  cella = { ...cella, leggi };
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dt = b[3] - a[3];
    quote[i] = nessuna;
    if (!(dt > 0)) { out[i] = out[i - 1] || (luce ? LUCE : [28, 27, 24]); quote[i] = quote[i - 1] || nessuna; continue; }
    const F = forze(cella, tr.specie, P[i][0], P[i][1], (b[0] - a[0]) / dt, (b[1] - a[1]) / dt, tr.esposizione ?? -1, P[i][3]);
    const pesi = { gravita: F.gravita ? Math.hypot(...F.gravita) : 0, magnetico: F.magnetico ? Math.hypot(...F.magnetico) : 0, materia: F.materia ? Math.hypot(...F.materia) : 0 };
    // la luce e chi va dritto: il colore della luce o l'inchiostro, ma la gravità si vede quando piega davvero
    const curva = (pesi.gravita + pesi.magnetico) / ((F.v * F.v) || 1), soglia = 1 / (4 * Math.max(cella.larghezza, cella.altezza));
    const tot = pesi.gravita + pesi.magnetico + pesi.materia;
    if (!tot || (!luce && curva < soglia * 0.25 && pesi.materia < soglia * F.v * F.v * 0.25)) { out[i] = luce ? LUCE : [28, 27, 24]; continue; }
    quote[i] = { gravita: pesi.gravita / tot, magnetico: pesi.magnetico / tot, materia: pesi.materia / tot };
    const c = [0, 0, 0];
    for (const [k, w] of Object.entries(pesi)) if (w) for (let j = 0; j < 3; j++) c[j] += (FORZE[k].col[j] * w) / tot;
    out[i] = c.map(Math.round);
  }
  return out;
}

// ---------- lo stato
// all'avvio: un ornamento trovato dal dado: raggi cosmici nel campo di un pianeta, in un ramo dove alcuni eventi sono andati diversamente
let comp = compBiblioteca(15909196, {"centro":[128.417,565.622],"lato":350.242}, {"fine":132.772,"durata":128.569}, {"inclinazione":0,"rotazione":0,"scalaTempo":5.174}, {"gruppo":"quadrati","angolo":13.136}, { rami: {"5":825946,"10.2.0.0":2077580,"10.2.0":608623,"8.3.0.0":1018645,"8.2.0.0":2112228,"10.3.0.0":846442,"10.3.0":614061}, separato: 49.455 });
let vista = 'pattern', corrente = 0, scelto = null, sopra = null; // scelto/sopra: { e, p } nel pattern
let tracce = [], prima = null, sel = null, strumento = 'seleziona';
let tempo = Infinity, fetta = 0, gioca = false, evidenzia = null, sonda = null;
// le leggi accese (agiscono nella fisica) e la vista «solo questa forza»
const leggi = { ...LEGGI };
let solo = null, confronto = null, confrontoTesto = '';
const vedi = (f) => !solo || solo === f;
// lo stato adesso, all'istante del cursore del tempo
const ora = () => (vista === 'pattern' ? Infinity : Math.min(tempo, tMax()));
const leggeOra = (k) => leggeA(leggi[k], ora());
const accesoOra = (o) => accesoA(o, ora());
// a metà del tempo gli interruttori scattano in quell'istante; alla fine valgono per tutta la storia
const aMeta = () => vista !== 'pattern' && isFinite(tempo) && tempo < tMax() - 1e-9;
let coloriForze = true, fuoco = null, immagine = null, mostraOriginale = true;
const pat = { cx: 125, cy: 125, z: 1 };
const indietro = [], avanti = [];
const el = () => comp.elementi[corrente];
const cel = () => el().cella;

// ---------- simulazione, con la memoria per elemento
const memoria = new Map();
// l'impronta di una cella per la memoria; per le immagini lette (enormi) le esposizioni si
// contano soltanto: non si modificano a mano
const impronteGrandi = new WeakMap();
const chiave = (cella) => {
  if (!cella.esposizioni) return JSON.stringify({ ...cella, finestra: undefined, sezione: undefined, vista: undefined }) + JSON.stringify(leggi);
  let base = impronteGrandi.get(cella.esposizioni);
  if (!base) { base = `${cella.esposizioni.length}|${cella.esposizioni.reduce((n, e) => n + e.sorgenti.length, 0)}|${(cella.sagome || []).length}|${Math.random()}`; impronteGrandi.set(cella.esposizioni, base); }
  return base + JSON.stringify({ ...cella, esposizioni: undefined, sagome: undefined, finestra: undefined, sezione: undefined, vista: undefined }) + JSON.stringify(leggi);
};
function tracceDi(e) {
  const k = chiave(e.cella);
  let m = memoria.get(k);
  if (!m) {
    let t = []; try { t = simulaMondo({ ...e.cella, leggi }); } catch (err) { console.error(err); }
    const cx = e.cella.larghezza / 2, cy = e.cella.altezza / 2; let r = 4;
    for (const tr of t) for (const p of tr.punti) if (p[2]) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy));
    m = { tracce: t, raggio: r, sprite: new Map() };
    memoria.set(k, m);
    if (memoria.size > 60) memoria.delete(memoria.keys().next().value);
  }
  return m;
}
function simula() {
  if (vista === 'pattern' && !comp.reticolo) { const c = comp.elementi[0].cella; $('misure').textContent = `universo n. ${c.seme}${c.rami && Object.keys(c.rami).length ? `, un ramo (${Object.keys(c.rami).length} eventi diversi)` : ''} · sezione di lato ${fmt(c.finestra.lato)} · tempo da ${fmt(c.sezione.fine - c.sezione.durata)} a ${fmt(c.sezione.fine)}`; return; }
  if (vista === 'pattern') { const ne = comp.elementi.length, np = comp.elementi.reduce((n, e) => n + e.posti.length, 0); $('misure').textContent = `${ne} ${ne === 1 ? 'elemento' : 'elementi'} · ${np} ${np === 1 ? 'posto' : 'posti'} per piastrella`; return; }
  const t0 = performance.now();
  try { tracce = tracceDi(el()).tracce; $('errore').textContent = ''; } catch (e) { tracce = []; $('errore').textContent = e.message; }
  const ms = performance.now() - t0, punti = tracce.reduce((n, t) => n + t.punti.length, 0);
  $('misure').textContent = `${tracce.length} linee · ${punti} punti · ${ms.toFixed(0)} ms`;
  if (vista === 'spaziotempo') imposta3D();
}
const tMax = () => { let m = 0; for (const t of tracce) m = Math.max(m, t.punti[t.punti.length - 1][3]); return m || cel().tempo || 1; };
function ricorda() { indietro.push(JSON.stringify({ comp, corrente })); if (indietro.length > 200) indietro.shift(); avanti.length = 0; confronto = null; }
function aggiorna({ pannello: p = true } = {}) { simula(); aggiornaTempo(); disegna(); dove(); mostraSchede(); if (p) mostraPannello(); }

// ---------- disegno: smistamento
function disegna() {
  if (vista === 'spaziotempo') { v3.tempo(cel().finestra ? v3.tMax() : Math.min(tempo, v3.tMax())); return; }
  const dpr = devicePixelRatio || 1;
  tela.width = tela.clientWidth * dpr; tela.height = tela.clientHeight * dpr;
  if (vista === 'cosmo') disegnaMappa(ctx, tela.width, tela.height, camMappa, { sopra: sopraMappa, evidenzia: evidenzaMappa(), dpr });
  else if (vista === 'pattern') disegnaPattern(); else if (vista === 'finestra') disegnaFinestra(); else disegnaElemento();
}

// =================================================================== IL PATTERN
function spriteDi(e, s) {
  // l'elemento disegnato una volta in un'immagine, alla scala dello schermo
  const sez = e.cella.sezione, t0s = sez ? sez.fine - sez.durata : -Infinity, t1s = sez ? sez.fine : Infinity;
  const m = tracceDi(e), q = Math.pow(2, Math.round(Math.log2(s) * 2) / 2), chiave = `${q}|${coloriForze}|${t0s}|${t1s}`;
  let sp = m.sprite.get(chiave);
  if (sp) return sp;
  const W = e.cella.larghezza, H = e.cella.altezza, k = Math.min(q, 3000 / Math.max(W, H));
  sp = document.createElement('canvas'); sp.width = Math.max(1, Math.ceil(W * k)); sp.height = Math.max(1, Math.ceil(H * k));
  const c = sp.getContext('2d'); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const tr of m.tracce) {
    const P = tr.punti;
    if (tr.sagoma) { c.fillStyle = INK; tracciaSagoma(c, tr); c.fill('evenodd'); continue; }
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i]; if (!a[2] || !b[2] || b[3] < t0s || a[3] > t1s) continue;
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
// la sezione (le linee d'universo proiettate secondo la vista, nella fetta di tempo),
// disegnata in coordinate della finestra su un contesto già trasformato
function tracciaSezione(c2, e, z) {
  const m = tracceDi(e), perId = new Map(m.tracce.map((t) => [t.id, t]));
  c2.lineCap = 'round';
  for (const [a, b, c, d, w, id, i] of segmentiSezione(m.tracce, e.cella)) {
    const tr = perId.get(id);
    c2.strokeStyle = coloriForze ? rgb((tr.colori ??= coloriTraccia(e.cella, tr))[i] || [28, 27, 24]) : INK; c2.lineWidth = Math.max(0.6 / z, w);
    c2.beginPath(); c2.moveTo(a, b); c2.lineTo(c, d); c2.stroke();
  }
}
// il motivo: la sezione ritagliata nel dominio (un triangolo, o la finestra) e
// ripetuta dalle sue simmetrie; poi il motivo si ripete sul reticolo
const ripetiDi = (c) => (c.ripeti ??= { ...RIPETI_BASE });
function motivoDi(e) {
  const c = e.cella, m = tracceDi(e), k = `mot|${JSON.stringify([c.finestra, c.sezione, c.vista, ripetiDi(c)])}`;
  if (m.motivo?.k !== k) m.motivo = { k, ...motivo(segmentiSezione(m.tracce, c), c.ripeti, c.finestra.lato) };
  return m.motivo;
}
function spriteMotivo(e, z) {
  const M = motivoDi(e), m = tracceDi(e), q = Math.pow(2, Math.ceil(Math.log2(z) * 2) / 2), k = `${M.k}|${q}|${coloriForze}`;
  if (m.spriteMotivo?.k === k) return m.spriteMotivo;
  const xs = M.poligono.map((p) => p[0]), ys = M.poligono.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const s = Math.min(q, 2400 / Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0));
  const cv = document.createElement('canvas'); cv.width = Math.ceil((Math.max(...xs) - x0) * s) + 4; cv.height = Math.ceil((Math.max(...ys) - y0) * s) + 4;
  const c2 = cv.getContext('2d'); c2.setTransform(s, 0, 0, s, 2 - x0 * s, 2 - y0 * s); c2.lineCap = 'round';
  const perId = new Map(m.tracce.map((t) => [t.id, t]));
  for (const [a, b, c, d, w, id, i] of M.segmenti) {
    const tr = perId.get(id);
    c2.strokeStyle = coloriForze ? rgb((tr.colori ??= coloriTraccia(e.cella, tr))[i] || [28, 27, 24]) : INK; c2.lineWidth = Math.max((1.4 * (devicePixelRatio || 1)) / s, w);
    c2.beginPath(); c2.moveTo(a, b); c2.lineTo(c, d); c2.stroke();
  }
  m.spriteMotivo = { k, cv, x0: x0 - 2 / s, y0: y0 - 2 / s, s };
  return m.spriteMotivo;
}
function disegnaSezione() {
  const W = tela.width, H = tela.height, dpr = devicePixelRatio || 1, z = pat.z * dpr, e = comp.elementi[0], l = e.cella.finestra.lato, M = motivoDi(e);
  const X = (x) => W / 2 + (x - pat.cx) * z, Y = (y) => H / 2 + (y - pat.cy) * z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = M.reticolo ? CARTA : '#e4dfd3'; ctx.fillRect(0, 0, W, H);
  if (!M.reticolo) {
    ctx.fillStyle = CARTA; ctx.fillRect(X(0), Y(0), l * z, l * z);
    ctx.save(); ctx.beginPath(); ctx.rect(X(0), Y(0), l * z, l * z); ctx.clip(); ctx.setTransform(z, 0, 0, z, X(0), Y(0)); tracciaSezione(ctx, e, z); ctx.restore(); return;
  }
  const sp = spriteMotivo(e, z), { a, b } = M.reticolo, det = a[0] * b[1] - a[1] * b[0];
  // le copie del motivo che cadono sullo schermo
  const angoli = [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => [pat.cx + (x - W / 2) / z - M.centro[0], pat.cy + (y - H / 2) / z - M.centro[1]]);
  const uv = angoli.map(([x, y]) => [(b[1] * x - b[0] * y) / det, (-a[1] * x + a[0] * y) / det]);
  const u0 = Math.floor(Math.min(...uv.map((p) => p[0]))) - 1, u1 = Math.ceil(Math.max(...uv.map((p) => p[0]))) + 1, v0 = Math.floor(Math.min(...uv.map((p) => p[1]))) - 1, v1 = Math.ceil(Math.max(...uv.map((p) => p[1]))) + 1;
  if ((u1 - u0 + 1) * (v1 - v0 + 1) > 8000) { scrivi('troppo lontano: avvicinati con la rotella', 14 * dpr, 24 * dpr, ACCENTO); return; }
  const k = z / sp.s;
  for (let j = v0; j <= v1; j++) for (let i = u0; i <= u1; i++) {
    const ox = i * a[0] + j * b[0], oy = i * a[1] + j * b[1];
    ctx.setTransform(k, 0, 0, k, X(sp.x0 + ox), Y(sp.y0 + oy)); ctx.drawImage(sp.cv, 0, 0);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// la vista «la finestra»: la sezione da sola, grande; un clic porta al suo spaziotempo
function disegnaFinestra() {
  const W = tela.width, H = tela.height, dpr = devicePixelRatio || 1, e = el(), l = e.cella.finestra.lato;
  const L = Math.min(W * 0.9, H * 0.84), x0 = (W - L) / 2, y0 = (H - L) / 2 + 8 * dpr, z = L / l;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#e4dfd3'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = CARTA; ctx.fillRect(x0, y0, L, L);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, L, L); ctx.clip(); ctx.setTransform(z, 0, 0, z, x0, y0);
  tracciaSezione(ctx, e, z);
  // il pezzo che si ripete: il resto della finestra si vela
  const M = motivoDi(e);
  if (M.dominio.length === 3) {
    ctx.beginPath(); ctx.rect(0, 0, l, l); ctx.moveTo(...M.dominio[0]); for (const p of M.dominio.slice(1)) ctx.lineTo(...p); ctx.closePath();
    ctx.fillStyle = 'rgba(244,240,232,0.72)'; ctx.fill('evenodd');
    ctx.beginPath(); ctx.moveTo(...M.dominio[0]); for (const p of M.dominio.slice(1)) ctx.lineTo(...p); ctx.closePath(); ctx.strokeStyle = ACCENTO; ctx.lineWidth = 1.5 / z; ctx.setLineDash([6 / z, 4 / z]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = sopraFinestra ? ACCENTO : 'rgba(28,27,24,0.5)'; ctx.lineWidth = (sopraFinestra ? 2 : 1) * dpr; ctx.strokeRect(x0, y0, L, L);
  if (sopraFinestra) { ctx.fillStyle = ACCENTO; ctx.font = `${12 * dpr}px ui-monospace, monospace`; ctx.fillText('clic: lo spaziotempo di questa finestra', x0, y0 - 6 * dpr); }
}
let sopraFinestra = false;

// =================================================================== IL COSMO
// La catena dello zoom, nei due versi: pattern ↔ finestra ↔ l'universo (la regione)
// ↔ il pianeta ↔ la stella ↔ la galassia ↔ il cosmo.
let camMappa = null, sopraMappa = null, volo = null, rotella = 0;
// come si chiama ciò che una cella mostra: un universo della biblioteca, o un punto di materia
const nomeDi = (c) => (c?.indirizzo?.materia ? `di «${comp.nome}»` : `dell'universo n. ${c?.seme}`);
const indirizzoOra = () => (vista === 'pattern' ? comp.elementi[0] : el())?.cella.indirizzo || null;
const evidenzaMappa = () => { const a = indirizzoOra(); return a ? { ...a, sorgenti: (el()?.cella.sorgenti || []).map((s) => s.origine).filter(Boolean) } : null; };
let animazione = 0;
function anima() { if (vista !== 'cosmo' || !(camMappa?.livello >= 3)) { animazione = 0; return; } if (!volo) disegna(); animazione = requestAnimationFrame(anima); }
function apriCosmo() {
  const a = indirizzoOra(); if (!a) return;
  // (una finestra dentro la materia non ha una regione: si torna sulla mappa dove si era, in fondo allo zoom)
  const dpr = devicePixelRatio || 1; camMappa = a.materia ? (a.camera ? clona(a.camera) : { livello: 3, via: { cosmo: a.cosmo, galassia: a.galassia, stella: a.stella, pianeta: a.pianeta }, cx: 0, cy: 0, z: Math.min(tela.clientWidth, tela.clientHeight) * dpr / 3 }) : camSuRegione(a, tela.clientWidth * dpr, tela.clientHeight * dpr);
  sopraMappa = null; vista = 'cosmo'; aggiornaVista();
}
function entraRegione(a) {
  volo = null;
  const qui = indirizzoOra();
  if (!qui || numeroDi(qui) !== numeroDi(a) || qui.cosmo !== a.cosmo) { ricorda(); comp = compBiblioteca(numeroDi(a), undefined, undefined, undefined, undefined, { storia: ramiCosmo(a.cosmo) }); corrente = 0; sel = null; scelto = null; }
  entra(0); vista = 'dettaglio'; aggiornaVista();
}
// LA FINESTRA DENTRO LA MATERIA (materia.js): gemella di entraRegione. Da un punto della mappa in fondo allo zoom (una
// roccia, un'acqua, l'aria sopra un luogo) si entra nella cella dove corrono le particelle di quel punto: ciò che un
// cristallo ha registrato in milioni di anni (modo «memoria») o un evento vero al suo istante. È una finestra come le
// altre (sezione, osservatore in moto, ricerca, rami). La cella ricorda il luogo, e la camera della mappa per tornarci.
function entraMateria(luogo, opzioni = {}) {
  volo = null; let r;
  try { r = cellaMateria(luogo, { ...opzioni, via: { ...camMappa.via } }, sorgente(luogo.indirizzo, ramiCosmo(camMappa.via.cosmo))); }
  catch (err) { $('dove').textContent = String(err.message || err).replace(/^cellaMateria: /, ''); return; }
  if (!r.cella.sorgenti.length) { $('dove').textContent = r.racconto.frasi.slice(1).join(' '); return; } // (una roccia che non ricorda niente: lo si dice, e si resta sulla mappa)
  r.cella.indirizzo.camera = clona(camMappa); r.cella.materia = { luogo: clona(luogo), opzioni: clona(opzioni) };
  ricorda();
  comp = { nome: r.nome, nota: r.nota, reticolo: null, elementi: [{ nome: r.nome, nota: r.nota, cella: { ...r.cella, vista: { ...VISTA_SOPRA }, ripeti: { ...RIPETI_BASE } }, posti: [{ pos: [0, 0], rot: 0 }] }] };
  corrente = 0; sel = null; scelto = null; entra(0); vista = 'dettaglio'; aggiornaVista();
}
// l'evento dopo (o prima) nello stesso luogo: gli eventi arrivano uno dopo l'altro, ognuno con la sua data
function eventoMateria(passo) {
  const c = comp.elementi[0].cella, m = c.materia; if (!m) return;
  const cam = c.indirizzo.camera, prima = camMappa; camMappa = cam ? clona(cam) : camMappa;
  entraMateria(m.luogo, { ...m.opzioni, evento: Math.max(0, (c.indirizzo.evento ?? 0) + passo) }); if (vista !== 'dettaglio') camMappa = prima;
}
// ---------- GLI ATOMI IN TRE DIMENSIONI (atomi3d.js), ai livelli più profondi della mappa: le molecole dell'acqua sotto i
// dieci nanometri, il reticolo del minerale in fondo alla roccia (mappa.js, scenaAtomi, dice se c'è una scena e quale).
// La vista vuole una tela tutta sua: se ne monta una nuova sopra la mappa (sotto i comandi) e la si toglie quando la
// condizione cade. Sulla tela montata la rotella è sua: allontanandosi oltre la scena si risale di un passo; avvicinandosi
// oltre il più vicino possibile, nell'acqua, si arriva all'evento vero. Il bottone entra nella finestra di quel punto.
// Senza scheda grafica (o se il contesto non nasce) resta l'immagine piatta di mappa.js.
let telaAtomi = null, vistaAtomi = null, chiaveAtomi = null, bottoneAtomi = null, senzaAtomi3D = false;
function smontaAtomi() {
  if (vistaAtomi) { try { vistaAtomi.libera(); } catch { /* già perso */ } }
  telaAtomi?.remove(); bottoneAtomi?.remove(); telaAtomi = null; vistaAtomi = null; bottoneAtomi = null; chiaveAtomi = null;
}
function esciDagliAtomi() {
  if (camMappa.suAcqua) camMappa.latoAcqua = (camMappa.latoAcqua ?? 1e-8) * 10; else { camMappa.passoRoccia = 2; camMappa.cx = 0.5; camMappa.cy = 0.5; camMappa.z = 8 * Math.min(tela.width, tela.height); }
  montaAtomi(); disegna(); dove();
}
function montaAtomi() {
  let sc = null; try { sc = vista === 'cosmo' && camMappa && !senzaAtomi3D ? scenaAtomi(camMappa) : null; } catch (err) { console.warn(err); sc = null; }
  if (!sc) { if (telaAtomi) smontaAtomi(); return; }
  if (sc.chiave === chiaveAtomi) return; // stesso punto, stessa scala: la scena c'è già
  smontaAtomi();
  try {
    telaAtomi = document.createElement('canvas'); telaAtomi.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; tela.parentNode.insertBefore(telaAtomi, tela.nextSibling);
    vistaAtomi = creaVistaAtomi(telaAtomi, { alFuori: esciDagliAtomi });
    vistaAtomi.suAtomo((a) => { if (!a) { dove(); return; } $('dove').textContent = `${a.nome || a.simbolo || 'un atomo'}${a.simbolo && a.nome ? ` (${a.simbolo})` : ''}${a.parte ? ` · ${typeof a.parte === 'string' ? a.parte : a.parte.nome || ''}` : ''}${a.rappresenta > 1 ? ` · da qui questa sfera ne rappresenta ${a.rappresenta}: avvicinati e tornano gli atomi` : ''}`; });
    vistaAtomi.carica(sc.crea()); vistaAtomi.avvia(); chiaveAtomi = sc.chiave;
    // oltre il più vicino possibile (dentro una molecola): sotto le molecole dell'acqua c'è l'evento vero che le attraversa
    telaAtomi.addEventListener('wheel', (e) => { if (e.deltaY < 0 && camMappa.suAcqua && vistaAtomi && vistaAtomi.camera.dist <= 0.1) { e.stopImmediatePropagation(); e.preventDefault(); camMappa.eventoAcqua = true; camMappa.cx = 0.5; camMappa.cy = 0.5; camMappa.z = Math.min(tela.width, tela.height); montaAtomi(); disegna(); dove(); } }, { capture: true, passive: false });
    bottoneAtomi = document.createElement('button'); bottoneAtomi.textContent = '▸ entra nella finestra di questo punto'; bottoneAtomi.title = "le particelle dentro questa materia: ciò che il cristallo ha registrato, o il prossimo evento vero nell'acqua";
    bottoneAtomi.style.cssText = 'position:absolute;left:12px;top:44px;z-index:3;font:inherit;padding:4px 9px;border:1px solid #666;border-radius:4px;background:rgba(20,20,24,0.85);color:#eee;cursor:pointer';
    bottoneAtomi.onclick = () => { const m = colpisciMappa(camMappa, tela.width / 2, tela.height / 2, tela.width, tela.height)?.materia; if (m) entraMateria(m.luogo, m.opzioni); };
    tela.parentNode.insertBefore(bottoneAtomi, telaAtomi.nextSibling);
  } catch (err) { console.warn('la vista degli atomi in 3D non si è potuta montare: resta l\'immagine piatta', err); smontaAtomi(); senzaAtomi3D = true; }
}
// la rotella che, oltre un limite, porta alla vista accanto nella catena
// lo zoom dentro una regione: una bolla di spaziotempo dieci volte più piccola (cosmo.js, cellaDi)
function compZoom(a) {
  const c = cellaDi(a), z = a.zoom || [], nome = `universo n. ${numeroDi(a)}${z.length ? ' › ' + z.map(([i, j]) => `${i + 1},${j + 1}`).join(' › ') : ''}`;
  return { nome, nota: `${descriviIndirizzo(a)}${z.length ? `, ${z.length === 1 ? 'dieci' : `${10 ** z.length}`} volte più vicino: una bolla di spaziotempo larga ${fmtLunghezza(c.scala.latoM)}, lunga ${(c.scala.secondi * 1000).toLocaleString('it-IT', { maximumFractionDigits: 3 })} ms. Le particelle che la attraversano sono le stesse della regione, con lo stesso caso; in più si vedono gli elettroni più fini della fascia` : ''}.`, reticolo: null, elementi: [{ nome, nota: '', cella: { ...c, vista: { ...VISTA_SOPRA }, ripeti: { ...RIPETI_BASE } }, posti: [{ pos: [0, 0], rot: 0 }] }] };
}
function zoomQui(verso, punto) {
  const a = indirizzoOra(); if (!a || a.materia) return false; // (dentro la materia non ci sono bolle più piccole: la finestra è già alla scala dell'evento)
  const z = a.zoom || [];
  if (verso > 0) { if (z.length >= 3) return false; const [x, y] = punto; ricorda(); comp = compZoom({ ...a, zoom: [...z, [Math.max(0, Math.min(9, Math.floor(x / 100))), Math.max(0, Math.min(9, Math.floor(y / 100)))]] }); }
  else { if (!z.length) return false; ricorda(); comp = compZoom({ ...a, zoom: z.slice(0, -1) }); }
  corrente = 0; sel = null; scelto = null; entra(0); vista = 'dettaglio'; aggiornaVista(); return true;
}
function passaVista(verso, punto = null) {
  rotella = 0;
  const conIndirizzo = !!indirizzoOra();
  if (verso < 0) { // indietro: più lontano
    if (vista === 'pattern' && !comp.reticolo) { entra(0); return true; }
    if (vista === 'finestra') { vista = 'dettaglio'; aggiornaVista(); return true; }
    if (vista === 'dettaglio' && conIndirizzo) { if (zoomQui(-1)) return true; apriCosmo(); return true; }
  } else { // avanti: più vicino
    // sulla cornice della sezione: la finestra; altrove: dentro la regione, dieci volte più vicino
    const f = el()?.cella.finestra, inCornice = f && punto && Math.abs(punto[0] - f.centro[0]) <= f.lato / 2 && Math.abs(punto[1] - f.centro[1]) <= f.lato / 2;
    if (vista === 'dettaglio' && conIndirizzo && punto && !inCornice && zoomQui(1, punto)) return true;
    if (vista === 'dettaglio' && f) { vista = 'finestra'; aggiornaVista(); return true; }
    if (vista === 'finestra') { vista = 'pattern'; adattaPattern(); aggiornaVista(); return true; }
  }
  return false;
}
function passoVolo() {
  if (!volo || vista !== 'cosmo') { volo = null; return; }
  const W = tela.width, H = tela.height, r = volaVerso(camMappa, volo, W, H);
  if (r?.entra) { entraRegione(r.entra); return; }
  // arrivati: se l'oggetto è ora un livello, ci si ferma
  if (++volo.passi > 160 || (volo.livello !== camMappa.livello)) { volo = null; sopraMappa = null; aggiornaVista(); return; }
  disegna(); dove(); requestAnimationFrame(passoVolo);
}
function disegnaPattern() {
  if (!comp.reticolo) return disegnaSezione();
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
}
const aPattern = (e) => { const r = tela.getBoundingClientRect(); return [pat.cx + (e.clientX - r.left - r.width / 2) / pat.z, pat.cy + (e.clientY - r.top - r.height / 2) / pat.z]; };
function colpisciPattern(x, y) {
  if (!comp.reticolo) return null;
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
  if (!comp.reticolo) return null;
  const { a, b } = comp.reticolo, r = 9 / pat.z;
  if (Math.hypot(x - a[0], y - a[1]) < r) return 'a';
  if (Math.hypot(x - b[0], y - b[1]) < r) return 'b';
  return null;
}
function entra(e) {
  corrente = e; vista = comp.elementi[e]?.cella.finestra ? 'finestra' : 'dettaglio'; sel = null; sonda = null; tempo = Infinity; fetta = 0;
  // un universo ricorda la sua fetta di tempo
  const sez = cel().sezione;
  if (sez) { tempo = sez.fine; fetta = sez.durata < sez.fine - 1e-9 ? sez.durata : 0; }
  aggiornaVista();
  $('fetta').value = fetta / tMax(); $('ofetta').textContent = fetta ? `fetta ${fmt(fetta)}` : 'tutta la storia';
}
function salvaSezione() { const c = cel(); if (!c?.sezione) return; const fine = Math.min(tempo, tMax()); c.sezione = { fine, durata: fetta ? Math.min(fetta, fine) : fine }; }
function adattaPattern() {
  if (!comp.reticolo) {
    const e = comp.elementi[0], l = e.cella.finestra.lato, M = motivoDi(e);
    if (!M.reticolo) { pat.cx = l / 2; pat.cy = l / 2; pat.z = Math.min(tela.clientWidth, tela.clientHeight) / (1.08 * l); return; }
    [pat.cx, pat.cy] = M.centro; pat.z = Math.min(tela.clientWidth, tela.clientHeight) / (3.2 * Math.hypot(...M.reticolo.a)); return;
  }
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

// la nebbia nella regione: tutte le particelle che ci sono e non si seguono una per una, come puntini
// fitti quanto la fascia in ogni punto (il disegno resta fisso: è la lastra in un istante)
function disegnaNebbiaRegione(c) {
  const a = c.indirizzo, d = c.dipoli?.[0]; if (!a || !d) return;
  const P = sistemaDi(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta], Pl = pianetaDi(a.cosmo, a.galassia, a.stella, a.pianeta);
  let s = (semeEvento('nebbia della regione', a.cosmo, a.galassia, a.stella, a.pianeta, a.regione, JSON.stringify(a.zoom || [])) % 2147483646) + 1; const caso = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const px = 1.2 / vt.s;
  ctx.fillStyle = 'rgba(110,90,200,0.35)';
  for (let i = 0; i < 6000; i++) {
    const x = caso() * c.larghezza, y = caso() * c.altezza, r = Math.hypot(x - d.centro[0], y - d.centro[1]) / d.R, f = fasciaDi(P, Pl, r) / 0.17 + 0.6 * Pl.densitaAnello(r) / 2;
    if (caso() < f) ctx.fillRect(x, y, px, px);
  }
}
function disegnaElemento() {
  adattaElemento();
  const W = tela.width, H = tela.height, c = cel(), T = Math.min(tempo, tMax());
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#e4dfd3'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(vt.s, 0, 0, vt.s, vt.ox, vt.oy);
  ctx.fillStyle = CARTA; ctx.fillRect(0, 0, c.larghezza, c.altezza);
  disegnaCampi();
  disegnaNebbiaRegione(c);
  if (vedi('gravita')) campoGravita();
  for (let i = 0; i < c.masse.length; i++) disegnaMassa(c.masse[i], sel?.tipo === 'massa' && sel.i === i);
  if (prima) disegnaTracce(prima, Infinity, true);
  else if (confronto) disegnaTracce(confronto, Infinity, true);
  const tante = tracce.length > 60 || tracce.reduce((n, t) => n + t.punti.length, 0) > 40000;
  if (tante && T >= tMax() && !fetta && !fuoco && !solo && !evidenzia && !(sel && ['traccia', 'specie', 'sorgente'].includes(sel.tipo))) ctx.drawImage(spriteDi(el(), vt.s), 0, 0, c.larghezza, c.altezza);
  else disegnaTracce(tracce, T, false);
  if (sonda || sel?.tipo === 'traccia') { const id = sonda ? sonda.tr : sel.i, tr = tracce.find((t) => t.id === id); if (tr && tante) disegnaTracce([tr], T, false); }
  if (vedi('decadimento')) for (const dk of tracce.decadimenti || []) if (dk.t <= T) disegnaDecadimento(dk);
  if (T < tMax()) disegnaTeste(T);
  c.sorgenti.forEach((so, i) => disegnaSorgente(so, sel?.tipo === 'sorgente' && sel.i === i));
  if (sel?.tipo === 'dominio') maniglieDominio(c.domini[sel.i]);
  if (sonda) disegnaSonda();
  if (c.finestra) {
    // fuori dalla finestra l'universo si attenua: dentro c'è la sezione, il pattern
    const f = c.finestra, l = f.lato, x0 = f.centro[0] - l / 2, y0 = f.centro[1] - l / 2;
    ctx.fillStyle = 'rgba(228,223,211,0.62)'; ctx.beginPath(); ctx.rect(-5000, -5000, 10000 + c.larghezza, 10000 + c.altezza); ctx.rect(x0, y0, l, l); ctx.fill('evenodd');
    ctx.strokeStyle = ACCENTO; ctx.lineWidth = px(2); ctx.strokeRect(x0, y0, l, l);
    manigliaQ(x0 + l, y0 + l);
    scriviMondo(inclinata(c.vista) ? `la sezione · inclinata di ${fmt(c.vista.inclinazione)}°: la vedi nel Pattern` : `la sezione · lato ${fmt(l)} · trascina il bordo per spostarla, l'angolo per ingrandirla`, x0, y0 - px(6), ACCENTO);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function evidente(tr) {
  if (sel?.tipo === 'traccia') return tr.id === sel.i;
  if (evidenzia) return tr.specie.nome === evidenzia;
  if (sel?.tipo === 'specie') return tr.specie.nome === sel.nome;
  if (sel?.tipo === 'sorgente') return tr.sorgente === sel.i;
  return false;
}
// il contorno di una sagoma, con i suoi buchi (si riempie pari e dispari)
function tracciaSagoma(c, tr) {
  c.beginPath();
  for (const anello of [tr.contorno, ...tr.buchi]) { anello.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
}
function dentroSagoma(tr, x, y) {
  let d = false;
  for (const P of [tr.contorno, ...tr.buchi]) for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) d = !d;
  return d;
}
function disegnaTracce(lista, T, fantasma) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const qualcosa = !fantasma && lista.some(evidente), t0 = fetta > 0 ? T - fetta : -Infinity;
  for (const tr of lista) {
    const P = tr.punti, ev = !fantasma && evidente(tr);
    if (tr.sagoma) {
      // il lampo è all'istante zero: c'è sempre, tranne in una fetta di tempo che non lo comprende
      if (t0 > 0) continue;
      ctx.fillStyle = fantasma ? 'rgba(120,115,105,0.25)' : ev ? ACCENTO : solo ? 'rgba(28,27,24,0.1)' : rgb([28, 27, 24], qualcosa ? 0.35 : 1);
      tracciaSagoma(ctx, tr); ctx.fill('evenodd');
      continue;
    }
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (a[3] > T) break;
      if (!a[2] || !b[2] || b[3] < t0) continue;
      let bx = b[0], by = b[1];
      if (b[3] > T) { const u = (T - a[3]) / (b[3] - a[3] || 1); bx = a[0] + (b[0] - a[0]) * u; by = a[1] + (b[1] - a[1]) * u; }
      let colore;
      if (fantasma) colore = 'rgba(120,115,105,0.32)';
      else if (ev) colore = ACCENTO;
      else if (solo === 'decadimento') colore = tr.generazione > 0 ? rgb(FORZE.decadimento.col, 0.95) : 'rgba(28,27,24,0.15)';
      else if (solo) { if (!tr.quote) coloriTraccia(cel(), tr); const q = tr.quote[i]?.[solo] ?? 0; colore = q > 0.02 ? rgb(FORZE[solo].col, 0.25 + 0.75 * q) : 'rgba(28,27,24,0.12)'; }
      else if (fuoco && !solo) colore = haForza(b[5], fuoco) ? rgb(FORZE[fuoco].col) : 'rgba(28,27,24,0.18)';
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
function frecceForze(tr, x, y, vx, vy, etichette, t) {
  const F = forze({ ...cel(), leggi }, tr.specie, x, y, vx, vy, tr.esposizione ?? -1, t), v = F.v, c = cel();
  const aRif = (v * v) / (0.12 * Math.max(c.larghezza, c.altezza)) || 1;
  const lun = (a) => Math.min(px(70), px(34) * Math.sqrt(Math.hypot(...a) / aRif));
  const lv = Math.min(px(60), px(14) + px(4) * v);
  freccia(x, y, (vx / v) * lv, (vy / v) * lv, INK, 1.4);
  const righe = [`${tr.specie.nome || 'particella'} · velocità ${fmt(v)} (freccia nera)`];
  for (const f of ['gravita', 'magnetico', 'materia']) {
    if (!F[f] || !vedi(f)) continue;
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
    if (tr.sagoma) continue;
    const P = tr.punti; if (P[0][3] > T || P[P.length - 1][3] < T) continue;
    let i = 0; while (i < P.length - 2 && P[i + 1][3] <= T) i++;
    const a = P[i], b = P[i + 1], dt = b[3] - a[3] || 1e-9, u = (T - a[3]) / dt, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
    frecceForze(tr, x, y, (b[0] - a[0]) / dt, (b[1] - a[1]) / dt, false, T);
    const q = tr.specie.q ?? 0;
    ctx.fillStyle = tr.specie.luce ? rgb(LUCE) : '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = px(1.2);
    ctx.beginPath(); ctx.arc(x, y, px(5), 0, 7); ctx.fill(); ctx.stroke();
    if (!tr.specie.luce && q) { ctx.lineWidth = px(1.4); ctx.beginPath(); ctx.moveTo(x - px(3), y); ctx.lineTo(x + px(3), y); if (q > 0) { ctx.moveTo(x, y - px(3)); ctx.lineTo(x, y + px(3)); } ctx.stroke(); }
  }
}
function disegnaSonda() {
  const tr = tracce.find((t) => t.id === sonda.tr); if (!tr || tr.sagoma) return;
  const P = tr.punti, k = Math.max(1, Math.min(P.length - 2, sonda.k)), a = P[k - 1], b = P[k + 1], dt = b[3] - a[3] || 1e-9, p = P[k];
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(p[0], p[1], px(4), 0, 7); ctx.fill(); ctx.stroke();
  frecceForze(tr, p[0], p[1], (b[0] - a[0]) / dt, (b[1] - a[1]) / dt, true, p[3]);
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
function corridoiDella(tr) {
  const e = cel().esposizioni?.[tr.esposizione]; if (!e) return [];
  const usati = new Set();
  for (let i = 0; i < tr.punti.length; i += 3) { const p = tr.punti[i]; e.domini.forEach((d, k) => { if (!usati.has(k) && dentro(d.forma, p[0], p[1])) usati.add(k); }); }
  return [...usati].map((k) => e.domini[k]);
}
function disegnaCampiNaturali(c) {
  const cc = campiContinui(c); if (!cc) return;
  const passo = px(30), punti = [];
  let bMax = 1e-9, kMax = 1e-9;
  for (let y = passo / 2; y < c.altezza; y += passo) for (let x = passo / 2; x < c.larghezza; x += passo) { const B = cc.B(x, y), K = cc.K(x, y); punti.push([x, y, B, K]); bMax = Math.max(bMax, Math.abs(B)); kMax = Math.max(kMax, K); }
  for (const [x, y, B, K] of punti) {
    if (K > 0 && vedi('materia') && leggeOra('materia')) { ctx.fillStyle = rgb(FORZE.materia.col, 0.08 + 0.3 * (K / kMax)); ctx.beginPath(); ctx.arc(x, y, px(1.2 + 2.5 * (K / kMax)), 0, 7); ctx.fill(); }
    if (Math.abs(B) > 0.08 * bMax && vedi('magnetico') && leggeOra('magnetico')) {
      const r = px(3), col = rgb(FORZE.magnetico.col, 0.08 + 0.5 * (Math.abs(B) / bMax));
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = px(1);
      ctx.beginPath(); ctx.arc(x + passo / 2, y + passo / 2, r, 0, 7); ctx.stroke();
      if (B > 0) { ctx.beginPath(); ctx.arc(x + passo / 2, y + passo / 2, px(1), 0, 7); ctx.fill(); }
      else { const X = x + passo / 2, Y = y + passo / 2; ctx.beginPath(); ctx.moveTo(X - r * 0.7, Y - r * 0.7); ctx.lineTo(X + r * 0.7, Y + r * 0.7); ctx.moveTo(X + r * 0.7, Y - r * 0.7); ctx.lineTo(X - r * 0.7, Y + r * 0.7); ctx.stroke(); }
    }
  }
  if (vedi('magnetico')) for (const k of c.cristalli || []) { ctx.setLineDash([px(3), px(3)]); ctx.strokeStyle = rgb(FORZE.magnetico.col, 0.6); ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(k.centro[0], k.centro[1], k.r, 0, 7); ctx.stroke(); ctx.setLineDash([]); scriviMondo(`cristallo · passo ${fmt(k.passo)}`, k.centro[0] - k.r * 0.6, k.centro[1] - k.r - px(4), rgb(FORZE.magnetico.col)); }
}
function disegnaCampi() {
  const c = cel();
  disegnaCampiNaturali(c);
  if (c.esposizioni) {
    // tante esposizioni: si mostrano solo i corridoi della linea sotto il cursore (o scelta)
    const id = sonda ? sonda.tr : sel?.tipo === 'traccia' ? sel.i : null, tr = id != null ? tracce.find((t) => t.id === id) : null;
    if (!tr) return;
    const esp = c.esposizioni[tr.esposizione];
    if (esp?.mappa && vedi('magnetico') && leggeOra('magnetico')) {
      // la mappa del campo liscio di questa esposizione: blu dove B esce dal foglio, rosso-blu dove entra
      const m = esp.mappa; let n = -1, max = 1e-9;
      for (let i = 1; i < m.sparsa.length; i += 2) max = Math.max(max, Math.abs(m.sparsa[i]));
      for (let i = 0; i < m.sparsa.length; i += 2) {
        n += m.sparsa[i]; const v = m.sparsa[i + 1], x = m.x0 + (n % m.nx) * m.h, y = m.y0 + Math.floor(n / m.nx) * m.h;
        ctx.fillStyle = v > 0 ? rgb(FORZE.magnetico.col, 0.05 + 0.4 * Math.min(1, Math.abs(v) / max)) : rgb([120, 80, 200], 0.05 + 0.4 * Math.min(1, Math.abs(v) / max));
        ctx.fillRect(x - m.h / 2, y - m.h / 2, m.h, m.h);
      }
    }
    for (const d of corridoiDella(tr)) {
      forma(d.forma);
      if (d.B && vedi('magnetico')) { ctx.fillStyle = rgb(FORZE.magnetico.col, 0.18); ctx.fill('evenodd'); }
      if (d.K && vedi('materia')) { ctx.fillStyle = rgb(FORZE.materia.col, 0.25); ctx.fill('evenodd'); }
      ctx.strokeStyle = rgb(d.B ? FORZE.magnetico.col : d.K ? FORZE.materia.col : [28, 27, 24], 0.6); ctx.lineWidth = px(1); ctx.stroke();
    }
    const e = c.esposizioni[tr.esposizione];
    return;
  }
  const lista = [{ forma: { tipo: 'tutto' }, ...c.fondo, fondo: true }, ...c.domini];
  lista.forEach((dm, k) => {
    const scelto = sel?.tipo === 'dominio' && sel.i === k - 1, etichetta = [];
    if (!dm.fondo && !accesoOra(dm)) {
      // spento: resta solo il contorno, la fisica lo ignora
      forma(dm.forma); ctx.setLineDash([px(3), px(4)]); ctx.strokeStyle = scelto ? ACCENTO : 'rgba(28,27,24,0.4)'; ctx.lineWidth = px(1); ctx.stroke(); ctx.setLineDash([]);
      const f = dm.forma; if (f.centro) scriviMondo(`${dm.nome || 'zona'}: spenta`, f.centro[0] - px(30), f.centro[1], GRIGIO);
      return;
    }
    dm = { ...dm, B: leggeOra('magnetico') ? dm.B : 0, K: leggeOra('materia') ? dm.K : 0 };
    if (dm.B && vedi('magnetico')) { forma(dm.forma); ctx.fillStyle = rgb(FORZE.magnetico.col, Math.min(0.16, 0.04 + Math.abs(dm.B) * 0.25)); ctx.fill('evenodd'); etichetta.push([`${dm.B > 0 ? '⊙' : '⊗'} campo ${fmt(dm.B)}`, FORZE.magnetico.col]); }
    if (dm.K && vedi('materia')) { puntini(dm.forma, rgb(FORZE.materia.col, Math.min(0.5, 0.15 + dm.K / 150)), px(Math.max(5, 14 - dm.K / 8))); etichetta.push([`▒ materia ${fmt(dm.K)}`, FORZE.materia.col]); }
    if (!dm.fondo) { forma(dm.forma); ctx.setLineDash(scelto ? [] : [px(5), px(4)]); ctx.strokeStyle = scelto ? ACCENTO : 'rgba(28,27,24,0.35)'; ctx.lineWidth = px(scelto ? 2 : 1); ctx.stroke(); ctx.setLineDash([]); }
    // il cartellino: dice che cosa c'è in questa zona
    if (etichetta.length) {
      const f = dm.forma, [x, y] = f.tipo === 'cerchio' ? [f.centro[0] - f.r * 0.7, f.centro[1] - f.r * 0.72] : f.tipo === 'anello' ? [f.centro[0] - f.r[1] * 0.7, f.centro[1] - f.r[1] * 0.72] : [px(8), px(18) + px(32 * k)];
      etichetta.forEach(([t, col], i) => scriviMondo(t, x, y + px(15) * i, rgb(col)));
    }
  });
  // i simboli del campo magnetico: ⊙ esce dal foglio, ⊗ entra
  if (!vedi('magnetico')) return;
  const passo = px(34);
  for (let y = passo / 2; y < c.altezza; y += passo) for (let x = passo / 2; x < c.larghezza; x += passo) {
    let B = c.fondo.B || 0; for (const dm of c.domini) if (accesoOra(dm) && dentro(dm.forma, x, y)) B = dm.B ?? B;
    if (!B || !leggeOra('magnetico')) continue;
    const r = px(3), col = rgb(FORZE.magnetico.col, Math.min(0.55, 0.15 + Math.abs(B)));
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = px(1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    if (B > 0) { ctx.beginPath(); ctx.arc(x, y, px(1), 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.stroke(); }
  }
}
// il campo di gravità: frecce verso le masse, più lunghe dove tira di più
function campoGravita() {
  const c = cel(), masse = c.masse.filter(accesoOra); if (!masse.length || !leggeOra('gravita')) return;
  const passo = px(46), G = c.G ?? 1, col = FORZE.gravita.col;
  for (let y = passo / 2; y < c.altezza; y += passo) for (let x = passo / 2; x < c.larghezza; x += passo) {
    let gx = 0, gy = 0, dentroCorpo = false;
    for (const m of masse) { const dx = m.pos[0] - x, dy = m.pos[1] - y, r = Math.hypot(dx, dy); if (r < (m.R ?? 0) + px(6)) dentroCorpo = true; const k = (G * m.M) / (r * r * r + 1e-9); gx += k * dx; gy += k * dy; }
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
  if (!accesoOra(m) || !leggeOra('gravita')) {
    ctx.setLineDash([px(3), px(3)]); ctx.strokeStyle = scelta ? ACCENTO : rgb(col, 0.6); ctx.lineWidth = px(1.5);
    ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    scriviMondo(`● massa ${fmt(m.M)}: ${!accesoOra(m) ? 'spenta' : 'la gravità è spenta'}`, m.pos[0] + R + px(4), m.pos[1] - px(4), GRIGIO);
    return;
  }
  if (vedi('gravita')) for (const a of [4, 1, 0.25, 0.0625]) { const r = Math.sqrt((G * m.M) / a); if (r < (m.R ?? 0) * 1.1 || r > 400) continue; ctx.strokeStyle = rgb(col, 0.22); ctx.lineWidth = px(1); ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], r, 0, 7); ctx.stroke(); }
  const g = ctx.createRadialGradient(m.pos[0], m.pos[1], 0, m.pos[0], m.pos[1], R);
  g.addColorStop(0, rgb([90, 40, 25])); g.addColorStop(1, rgb(col));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.pos[0], m.pos[1], R, 0, 7); ctx.fill();
  if (scelta) { ctx.strokeStyle = ACCENTO; ctx.lineWidth = px(2); ctx.stroke(); }
  if (vedi('gravita')) scriviMondo(`● massa ${fmt(m.M)}`, m.pos[0] + R + px(4), m.pos[1] - px(4), rgb(col));
}
const specieDi = (so) => (typeof so.specie === 'string' ? { nome: so.specie, ...cel().specie[so.specie] } : so.specie);
function puntaFreccia(so) {
  const sp = specieDi(so), L = sp?.luce ? 22 : 6 + (so.v ?? 0) * 2.2;
  return [so.pos[0] + Math.cos(so.dir ?? 0) * px(L * 1.6), so.pos[1] + Math.sin(so.dir ?? 0) * px(L * 1.6)];
}
function disegnaSorgente(so, scelta) {
  const [x, y] = so.pos, [tx, ty] = puntaFreccia(so), col = scelta ? ACCENTO : rgb(FORZE.decadimento.col);
  const sSpenta = !accesoA(so, so.t0 ?? 0);
  ctx.globalAlpha = sSpenta ? 0.3 : 0.9; freccia(x, y, tx - x, ty - y, col, 2); ctx.globalAlpha = sSpenta ? 0.3 : 1;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = px(2); ctx.beginPath(); ctx.arc(x, y, px(5), 0, 7); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- scegliere e trascinare nell'elemento
function distSeg(x, y, a, b) { const sx = b[0] - a[0], sy = b[1] - a[1], l2 = sx * sx + sy * sy || 1e-12, u = Math.max(0, Math.min(1, ((x - a[0]) * sx + (y - a[1]) * sy) / l2)); return Math.hypot(x - a[0] - u * sx, y - a[1] - u * sy); }
function vicinoTraccia(x, y, raggioPx) {
  let best = null, bd = px(raggioPx); const T = Math.min(tempo, tMax());
  for (const tr of tracce) for (let k = 1; k < tr.punti.length; k++) {
    if (tr.sagoma) { if (k === 1 && dentroSagoma(tr, x, y) && !best) best = { tr: tr.id, k: 0 }; continue; }
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
    else presa = { tipo: 'vista', sx: e.clientX, sy: e.clientY, ux: e.clientX, uy: e.clientY, cx: pat.cx, cy: pat.cy };
    return;
  }
  if (vista === 'finestra') { presa = { tipo: 'clicFinestra', sx: e.clientX, sy: e.clientY }; return; }
  if (vista === 'cosmo') { volo = null; presa = { tipo: 'cosmo', sx: e.clientX, sy: e.clientY, cx: camMappa.cx, cy: camMappa.cy }; return; }
  const [x, y] = aMondo(e), c = cel();
  if (strumento !== 'seleziona') { aggiungi(strumento, x, y); return; }
  const fh = colpisciFinestra(x, y);
  if (fh) { ricorda(); presa = { tipo: 'finestra', parte: fh, x, y, orig: clona(c.finestra) }; return; }
  const h = colpisci(x, y);
  sel = h ? { tipo: h.tipo, i: h.i } : null;
  if (h && h.parte && h.parte !== 'nessuna' && h.tipo !== 'traccia') {
    ricorda(); prima = tracce;
    const o = h.tipo === 'sorgente' ? c.sorgenti[h.i] : h.tipo === 'massa' ? c.masse[h.i] : c.domini[h.i];
    presa = { ...h, o, x, y, orig: clona(o) };
  }
  disegna(); mostraPannello();
});
tela.addEventListener('pointermove', (e) => {
  if (vista === 'pattern') {
    const [x, y] = aPattern(e);
    if (!presa) {
      const h = colpisciPattern(x, y), prec = sopra; sopra = h ? { e: h.e, p: h.p } : null;
      tela.style.cursor = !comp.reticolo ? 'pointer' : maniglia(x, y) ? 'move' : h ? 'pointer' : 'grab';
      if (JSON.stringify(prec) !== JSON.stringify(sopra)) disegna();
      return;
    }
    if (presa.tipo === 'vista') { presa.ux = e.clientX; presa.uy = e.clientY; pat.cx = presa.cx - (e.clientX - presa.sx) / pat.z; pat.cy = presa.cy - (e.clientY - presa.sy) / pat.z; disegna(); }
    else if (presa.tipo === 'reticolo') { comp.reticolo[presa.v] = [Math.round(x), Math.round(y)]; disegna(); }
    else if (presa.tipo === 'posto') {
      if (!presa.mosso && Math.hypot(e.clientX - presa.sx, e.clientY - presa.sy) < 5) return;
      if (!presa.mosso) { ricorda(); presa.mosso = true; }
      comp.elementi[presa.e].posti[presa.p].pos = [Math.round((presa.orig[0] + x - presa.x0) * 10) / 10, Math.round((presa.orig[1] + y - presa.y0) * 10) / 10];
      scelto = { e: presa.e, p: presa.p }; disegna();
    }
    return;
  }
  if (vista === 'cosmo') {
    const dpr = devicePixelRatio || 1, r = tela.getBoundingClientRect();
    if (presa?.tipo === 'cosmo') { camMappa.cx = presa.cx - ((e.clientX - presa.sx) * dpr) / camMappa.z; camMappa.cy = presa.cy - ((e.clientY - presa.sy) * dpr) / camMappa.z; disegna(); return; }
    const h = colpisciMappa(camMappa, (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr, tela.width, tela.height);
    if ((h?.testo || null) !== (sopraMappa?.testo || null)) { sopraMappa = h; tela.style.cursor = h ? 'pointer' : 'grab'; disegna(); }
    return;
  }
  if (vista === 'finestra') {
    const r = tela.getBoundingClientRect(), W = r.width, H = r.height, L = Math.min(W * 0.9, H * 0.84), x0 = (W - L) / 2, y0 = (H - L) / 2 + 8;
    const mx = e.clientX - r.left, my = e.clientY - r.top, s = mx >= x0 && mx <= x0 + L && my >= y0 && my <= y0 + L;
    tela.style.cursor = s ? 'pointer' : 'default'; if (s !== sopraFinestra) { sopraFinestra = s; disegna(); }
    return;
  }
  const [x, y] = aMondo(e);
  if (presa?.tipo === 'finestra') {
    const f = cel().finestra, g = presa.orig;
    if (presa.parte === 'bordo') f.centro = [Math.round(g.centro[0] + x - presa.x), Math.round(g.centro[1] + y - presa.y)];
    else f.lato = Math.round(Math.max(20, 2 * Math.max(Math.abs(x - f.centro[0]), Math.abs(y - f.centro[1]))));
    disegna(); return;
  }
  if (!presa && colpisciFinestra(x, y)) { tela.style.cursor = colpisciFinestra(x, y) === 'angolo' ? 'nwse-resize' : 'move'; return; }
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
  if (presa.tipo === 'dominio' && o.forma.tipo === 'cerchio') {
    if (presa.parte === 'raggio') o.forma.r = Math.max(2, Math.hypot(x - o.forma.centro[0], y - o.forma.centro[1]));
    else o.forma.centro = [g.forma.centro[0] + dx, g.forma.centro[1] + dy];
  }
  arrotonda(o); simula(); disegna();
});
tela.addEventListener('pointerup', (e) => {
  if (presa?.tipo === 'cosmo') {
    const fermo = Math.hypot(e.clientX - presa.sx, e.clientY - presa.sy) < 5; presa = null;
    if (fermo && sopraMappa) {
      if (sopraMappa.tipo === 'regione') { entraRegione(sopraMappa.via); return; }
      if (sopraMappa.materia) { entraMateria(sopraMappa.materia.luogo, sopraMappa.materia.opzioni); return; } // in fondo allo zoom (o sull'aria, alla scala dei chilometri): la finestra di quel punto
      if (sopraMappa.tipo !== 'buco' && sopraMappa.tipo !== 'punto' && sopraMappa.tipo !== 'materia') { volo = { pos: sopraMappa.pos, scala: sopraMappa.scala, livello: camMappa.livello, passi: 0 }; requestAnimationFrame(passoVolo); }
    }
    return;
  }
  if (presa?.tipo === 'clicFinestra') { const fermo = Math.hypot(e.clientX - presa.sx, e.clientY - presa.sy) < 5; presa = null; if (fermo && sopraFinestra) { sopraFinestra = false; allineaAllaFinestra = true; vista = 'spaziotempo'; aggiornaVista(); } return; }
  if (vista === 'pattern' && presa) {
    if (presa.tipo === 'posto' && !presa.mosso) { scelto = { e: presa.e, p: presa.p }; presa = null; entra(scelto.e); return; }
    if (presa.tipo === 'vista' && !comp.reticolo && Math.hypot(presa.ux - presa.sx, presa.uy - presa.sy) < 5) { presa = null; entra(0); return; }
    presa = null; mostraPannello(); disegna(); return;
  }
  if (presa) { presa = null; prima = null; aggiornaTempo(); disegna(); mostraPannello(); }
});
function colpisciFinestra(x, y) {
  const f = cel()?.finestra; if (!f) return null;
  const l = f.lato / 2, dx = x - f.centro[0], dy = y - f.centro[1], r = px(8);
  if (Math.hypot(dx - l, dy - l) < r * 1.5) return 'angolo';
  const fuori = Math.max(Math.abs(dx), Math.abs(dy));
  return Math.abs(fuori - l) < r ? 'bordo' : null;
}
tela.addEventListener('pointerleave', () => { if (sopra || sonda) { sopra = null; sonda = null; disegna(); } });
tela.addEventListener('wheel', (e) => {
  if (vista === 'cosmo') {
    e.preventDefault(); volo = null;
    const r = tela.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    const esito = zoomMappa(camMappa, (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr, Math.exp(-e.deltaY * 0.0015), tela.width, tela.height);
    if (esito?.entra) { entraRegione(esito.entra); return; }
    sopraMappa = null; montaAtomi(); disegna(); dove(); mostraPannello(); if (!animazione) animazione = requestAnimationFrame(anima); return;
  }
  if (vista === 'finestra' || vista === 'dettaglio') {
    e.preventDefault(); rotella += e.deltaY;
    if (Math.abs(rotella) > 260) passaVista(rotella > 0 ? -1 : 1, vista === 'dettaglio' ? aMondo(e) : null);
    return;
  }
  if (vista !== 'pattern') return;
  e.preventDefault();
  if (e.deltaY > 0 && !comp.reticolo) {
    // il pattern, rimpicciolito oltre un limite, lascia il posto alla sua finestra
    const M = motivoDi(comp.elementi[0]), L = M.reticolo ? Math.hypot(...M.reticolo.a) : comp.elementi[0].cella.finestra.lato;
    if (L * pat.z < 0.09 * Math.min(tela.clientWidth, tela.clientHeight)) { rotella += e.deltaY; if (rotella > 260) passaVista(-1); return; }
  }
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
  else if (cosa === 'massa') { c.masse.push({ pos: [x, y], M: 300, R: 5 }); sel = { tipo: 'massa', i: c.masse.length - 1 }; }
  scegliStrumento('seleziona'); aggiorna();
}
function elimina() {
  if (vista === 'pattern') { if (scelto) togliPosto(scelto.e, scelto.p); return; }
  if (!sel) return; const c = cel(); ricorda();
  const lista = { sorgente: c.sorgenti, dominio: c.domini, massa: c.masse }[sel.tipo];
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
  visibile: 'visibile: se lascia traccia sulla lastra. Nelle camere a bolle le neutre e la luce non lasciano bolle.',
  angolo: 'angolo: la direzione della figlia rispetto a quella della madre, in gradi.',
  quota: 'quota: quale parte della spinta (quantità di moto) della madre si porta via. Più spinta, più veloce: curva più larga, più strada.',
  vInizio: 'velocità alla nascita: più veloce, curva più larga e più strada prima di fermarsi. La freccia sulla scena è la stessa cosa: trascinala.',
  direzione: 'direzione: verso dove parte. Trascina la punta della freccia.',
  t0: 'partenza: in che istante la sorgente emette.',
  B: 'campo magnetico B (blu): perpendicolare al foglio. Fa girare le cariche: raggio m·v/(q·B), più campo = curve più strette. Il segno sceglie il verso (⊙ esce dal foglio, ⊗ entra).',
  K: 'materia K (marrone, a puntini): quanto è denso il mezzo. Frena le cariche, e più sono lente più frenano: la curva si stringe in spirale fino all\'occhio. Zero: vuoto.',
  raggioDominio: 'raggio: fin dove arriva questa zona. Trascina il quadratino sul bordo.',
  M: 'massa M (rossa): quanto curva lo spazio intorno. Le particelle cadono verso di lei con G·M/r², la luce si piega il doppio. Nessuno la sposta: resta ferma.',
  R: 'raggio R: il corpo della massa. Chi lo tocca ci cade dentro e si ferma.',
  c: 'velocità della luce c in questo universo: il limite di ogni velocità.',
  tempo: 'durata dell\'esposizione: quanto a lungo la pellicola registra.',
  w0: 'spessore base della pellicola: quanto è grossa la bolla di una carica unitaria veloce.',
  saturazione: 'saturazione: quanto può ingrossare la traccia quando la particella rallenta (l\'occhio finale).',
  vRif: 'velocità di riferimento: sotto questa velocità la traccia comincia a ingrossare.',
  angoloTriangolo: 'giro del triangolo: quale spicchio della finestra entra nel caleidoscopio. Girandolo, lo stesso universo dà un altro ornamento.',
  inclinazione: 'inclinazione: da sopra (0°) la lastra vede solo il piano; inclinandola, il tempo diventa una direzione del disegno e le spirali diventano onde, trocoidi, catene di anelli. Si vede nel Pattern.',
  rotazione: 'rotazione: da che lato del piano si inclina lo sguardo.',
  velocita: 'a zero chi guarda è fermo nella regione. Crescendo, le lunghezze lungo il moto si accorciano e il tempo si mescola allo spazio: un cerchio percorso da una particella diventa una trocoide, una catena di anelli.',
  direzione: 'la direzione in cui si muove chi guarda, nel piano della regione.',
  scalaTempo: 'scala del tempo: quanto spazio vale un istante quando il tempo entra nel disegno. Più grande, più le linee si allungano lungo il tempo.',
  rot: 'rotazione: lo stesso evento, girato. Ruotare un universo non cambia le sue leggi.',
  specchio: 'a specchio: lo stesso evento nell\'universo riflesso. Lì il campo magnetico ha il verso opposto, e la forma è esattamente la riflessione.',
};

function mostraPannello() {
  idCursore = 0; registro.clear();
  const h = [];
  if (vista === 'pattern') pannelloPattern(h); else if (vista === 'cosmo') pannelloCosmo(h); else pannelloElemento(h);
  pannello.innerHTML = h.join('');
}
const controlliUniverso = (c) => {
  c.vista ??= { ...VISTA_SOPRA };
  // dentro la materia non c'è un numero d'universo: c'è un luogo, e (nel modo istante) gli eventi che vi accadono uno dopo l'altro
  const testa = c.indirizzo?.materia ? (c.indirizzo.modo === 'istante' ? `<div class="universo"><span>evento n.</span><button data-univ="-1" title="l'evento prima, nello stesso luogo">◀</button><b style="padding:0 .6em">${(c.indirizzo.evento ?? 0) + 1}</b><button data-univ="1" title="l'evento dopo, nello stesso luogo">▶</button></div>` : '')
    + `<div class="riga-bottoni"><button class="primo" data-cerca="qui" title="cerca l'inquadratura più bella di queste tracce">✨ più bella qui</button><button data-cerca="vicini" title="ogni decadimento è un evento quantistico: cerca il ramo in cui alcuni sono andati diversamente">✦ un ramo parallelo più pulito</button></div>`
    : `<div class="universo"><span>universo n.</span><button data-univ="-1" title="l'universo prima">◀</button><input type="number" data-univ-n value="${c.seme}" min="1"><button data-univ="1" title="l'universo dopo">▶</button></div>`
    + `<div class="riga-bottoni"><button class="primo" data-cerca="ovunque" title="sfoglia molti universi e inquadrature, e tiene la sezione più bella">🎲 una sezione bella</button><button data-cerca="qui" title="cerca solo inquadrature migliori in questo universo">✨ più bella qui</button><button data-cerca="vicini" title="ogni decadimento è un evento quantistico: l'universo si divide in rami, uno per esito. Cerca il ramo in cui i decadimenti da cui nascono le linee storte sono andati diversamente">✦ un ramo parallelo più pulito</button></div>`;
  return testa
    + `<p class="nota" id="cercaStato"></p>`
    + `<h2>da dove la guardi</h2>`
    + cursore('inclinazione', c.vista, 'inclinazione', 0, 85, 1, 'inclinazione (gradi)')
    + cursore('rotazione', c.vista, 'rotazione', 0, 360, 1, 'rotazione (gradi)')
    + cursore('scalaTempo', c.vista, 'scalaTempo', 1, 20, 0.5, 'scala del tempo')
    + `<h2>chi guarda</h2><p class="nota">La traccia dipende dal moto della particella e da quello di chi la guarda. Qui la sezione è il punto di vista di un osservatore in moto, secondo la relatività: la scala del tempo è la velocità della luce, non si sceglie.</p>`
    + cursore('velocita', c.vista, 'velocita', 0, 0.99, 0.01, "velocità di chi guarda (frazione di quella della luce)")
    + cursore('direzione', c.vista, 'direzione', 0, 360, 1, 'verso dove va (gradi)')
    + (c.indirizzo && !c.indirizzo.materia ? `<div class="riga-bottoni">${motiDi(c.indirizzo).map((m) => `<button data-moto="${m.velocita}|${m.direzione}" title="${m.cosa}">${m.nome}${m.kmS ? ` (${m.kmS < 10 ? m.kmS.toFixed(1) : Math.round(m.kmS)} km/s)` : ''}</button>`).join('')}</div><p class="nota">I moti veri di questa regione sono lentissimi rispetto alla luce (millesimi o decimillesimi): in un'esposizione di millisecondi spostano le tracce di pochi chilometri su migliaia. Contano per ciò che si muove piano (i grani dell'anello, l'acqua, l'aria) e per le esposizioni lunghe; chi viaggia insieme a un raggio cosmico, invece, vede tutto trasformato.</p>` : '');
};
function pannelloPattern(h) {
  if (!comp.reticolo) {
    const c = comp.elementi[0].cella;
    const R = ripetiDi(c), modo = R.gruppo;
    h.push(`<h2>la sezione</h2>`, controlliUniverso(c), `<p class="nota">${comp.elementi[0].nota}</p>`);
    h.push(`<h2>come si ripete</h2><div class="riga-bottoni scelta">${Object.entries(GRUPPI).map(([k, r]) => `<button data-ripeti="${k}" class="${k === modo ? 'attivo' : ''}" title="${r.spiega}">${r.nome}</button>`).join('')}</div><p class="nota">${GRUPPI[modo].spiega}.</p>${modo === 'esagoni' || modo === 'quadrati' ? cursore('angoloTriangolo', R, 'angolo', 0, 360, 1, 'giro del triangolo (gradi)') : ''}`);
    h.push(`<p class="aiuto">Il pattern è un pezzo dell'universo n. ${c.seme} (in una fetta di tempo, guardato da un angolo) ripetuto dalle simmetrie di un caleidoscopio: nessun montaggio, la natura disegna il pezzo e gli specchi della ripetizione fanno il resto. <b>Clic sul pattern</b> per vedere la finestra da sola, e da lì il suo spaziotempo.</p>`);
    h.push(`<div class="riga-bottoni"><button class="primo" data-entra="0">la finestra →</button></div>`);
    return;
  }
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
// la superficie di un pianeta con acqua: una pozza scaldata dal basso (fluidi.js). La profondità si
// sceglie dall'indirizzo, attorno a quella in cui l'acqua comincia a muoversi
const superfici = new Map();
function superficie(v) {
  const k = JSON.stringify(v); if (superfici.has(k)) return superfici.get(k);
  const P = sistemaDi(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta], q = P.interno.q, g = P.clima.g; // il calore che esce dall'interno: quello di interno(), lo stesso scritto nel pannello
  let lo = 1e-4, hi = 1; for (let i = 0; i < 50; i++) { const m = Math.sqrt(lo * hi); if (convezione({ g, q, d: m }).epsilon < 0) lo = m; else hi = m; }
  let sd = (semeEvento('pozza', v.cosmo, v.galassia, v.stella, v.pianeta) % 2147483646) + 1; const caso = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const d = hi * (1.03 + 0.35 * caso()), c = convezione({ g, q, d }), r = c.epsilon > 0 ? celle(c, { seme: sd }) : null;
  let url = null;
  if (r) { const cv = document.createElement('canvas'); cv.width = cv.height = r.N; const x = cv.getContext('2d'), im = x.createImageData(r.N, r.N); let mx = 1e-9; for (const w of r.u) mx = Math.max(mx, Math.abs(w)); for (let i = 0; i < r.N * r.N; i++) { const t = 0.5 + 0.5 * (r.u[i] / mx); im.data[4 * i] = 40 + 150 * t; im.data[4 * i + 1] = 80 + 140 * t; im.data[4 * i + 2] = 120 + 120 * t; im.data[4 * i + 3] = 255; } x.putImageData(im, 0, 0); url = cv.toDataURL(); }
  const out = { P, q, d, c, url }; superfici.set(k, out); return out;
}
function pannelloCosmo(h) {
  const a = indirizzoOra(), c = el()?.cella;
  h.push(`<div class="briciole"><button data-modo-p="dettaglio">← la regione</button> <b>dove si trova</b></div>`);
  h.push(`<p class="nota">${percorso(camMappa).join(' › ')}</p>`);
  h.push(`<div class="riga-bottoni"><button class="primo" data-finestra-bella title="prova molte inquadrature qui attorno, a questa scala, e va dove il mondo disegna di più">🎲 una finestra bella a questa scala</button></div><p class="nota" id="finestraStato">La finestra è un punto di osservazione qualsiasi, a qualsiasi scala: le galassie, le orbite, i continenti, i fiumi, i cristalli, le particelle. Il disegno c'è già: lo si cerca.</p>`);
  h.push(`<p class="aiuto">L'universo intero, da esplorare. Nessun bordo: lo spazio si richiude su sé stesso. Ogni cosa ha una causa più in là: le galassie nascono dove le fluttuazioni dell'inizio hanno lasciato più materia; le stelle nei bracci; i pianeti attorno alle stelle; le regioni nell'anello o nel campo dei pianeti. <b>Avvicinati con la rotella</b> fino alle particelle, <b>allontanati</b> fino alla rete delle galassie.</p>`);
  if (a && c) {
    const raggi = c.sorgenti.filter((s) => s.origine);
    const conta = {}; for (const s of raggi) conta[s.origine] = (conta[s.origine] || 0) + 1;
    if (camMappa.livello >= 3) {
      const P = sistemaDi(camMappa.via.cosmo, camMappa.via.galassia, camMappa.via.stella).pianeti[camMappa.via.pianeta], cl = P.clima;
      // LA TEMPERATURA: una sola. Finché la mappa non c'è è quella del bilancio di energia per fasce di latitudine (clima(), leggi.js);
      // quando la mappa è pronta è quella dello stesso bilancio risolto lì sopra, con le terre, i mari, i venti e le nuvole veri
      const mappaPronta = P.interno && P.tipo !== 'gassoso' ? superficieDi(camMappa.via) : null, Tmedia = mappaPronta ? mappaPronta.cl.Tglobale : cl.T;
      const origineT = P.tipo === 'gassoso' ? 'dove la pressione è di un bar' : mappaPronta ? 'in media sulla superficie: dal bilancio di energia sulla mappa del pianeta, con le sue terre, i suoi mari e i suoi venti' : 'in media sulla superficie: dal bilancio di energia per fasce di latitudine (luce assorbita, ghiaccio e nuvole che la rimandano, serra dei gas dell\'aria)';
      h.push(`<h2>il pianeta</h2><p class="nota">${Math.round(Tmedia - 273.15)} °C ${origineT} (${Math.round(cl.Teq - 273.15)} °C senza atmosfera), ${isFinite(cl.pressione) ? (cl.pressione < 1 ? 'nessuna atmosfera' : `${(cl.pressione / 1e5).toPrecision(2)} bar`) : 'un gigante di gas'}, gravità ${cl.g.toFixed(1)} m/s², acqua ${cl.acqua}. Trattiene: ${cl.tenuti.join(', ') || 'niente'}. Tutto discende dalla luce della sua stella, dalla distanza, dalla massa e da che cosa è fatto.</p>`);
      // UN PIANETA PARALLELO: lo stesso pianeta, della stessa stella, in un cosmo dove UN SOLO evento della sua storia è
      // andato diversamente: l'impatto che più ha segnato il suo mantello è caduto in un altro punto. Tutti gli altri
      // impatti, la luna, il giorno, la massa restano identici; cambia ciò che ne discende (i continenti, quel cratere).
      { const v = camMappa.via, st = P.tipo !== 'gassoso' ? P.impatti : null, prima = st ? st.grandi.filter((g) => g.t <= st.quiete.t) : [];
        const peso = (g) => g.energiaJ * Math.exp(-(st.quiete.t - g.t) / st.mescolaAnni), g = prima.length ? prima.reduce((a, b) => (peso(b) > peso(a) ? b : a)) : null;
        const ev = g ? `cosmo ${cosmoBase(v.cosmo)}/galassia ${v.galassia}/stella ${v.stella}/pianeta ${v.pianeta}/impatto ${g.id}/dove` : `mantello/${v.galassia}/${v.stella}/${v.pianeta}`;
        const r = ramiCosmo(v.cosmo)[ev] || 0, n = Object.keys(ramiCosmo(v.cosmo)).length;
        const che = g ? `un corpo di ${Math.round(g.diametroM / 1000)} km, caduto ${g.t >= 1e9 ? `${(g.t / 1e9).toFixed(1).replace('.', ',')} miliardi` : `${Math.round(g.t / 1e6)} milioni`} di anni dopo la nascita del sistema, è caduto in un altro punto` : 'il suo mantello è partito da un altro stato';
        if (P.tipo !== 'gassoso') h.push(`<p class="nota"><button data-ramo-p="${ev}|${r + 1}">✦ un pianeta parallelo</button>${n ? ` <button data-ramo-p="|0">↩ il cosmo di partenza</button>` : ''}<br>${r ? `Sei in un cosmo parallelo (${n} ${n === 1 ? 'evento andato' : 'eventi andati'} diversamente): ${che}. Stessa stella, stessa massa, stessa luna, stessi altri impatti; cambia ciò che ne discende.` : `Lo stesso pianeta in un cosmo dove un solo evento è andato diversamente: ${che}. Tutto il resto del cosmo resta identico; cambia ciò che ne discende (${P.interno?.tettonica === 'a placche' ? 'i continenti, quel cratere' : 'quel cratere'}).`}</p>`); }
      // L'ARIA e la prima tappa verso la vita
      if (P.atmosfera) {
        const gas = Object.entries(P.atmosfera.gas).sort((x, y) => y[1] - x[1]).filter(([, f]) => f > 0.001).slice(0, 5).map(([g, f]) => `${g} ${(f * 100).toFixed(f < 0.1 ? 1 : 0)}%`).join(', ');
        const pre = P.prebiotica, idro = cl.acqua === 'liquida' && P.interno?.vulcani > 0;
        h.push(`<h2>l'aria e i mattoni della vita</h2><p class="nota">${gas ? `L'aria: ${gas}` : "Nessun'aria"}${P.atmosfera.riducente ? ' (ricca di idrogeno: riducente)' : gas ? " (senza idrogeno libero: ossidata)" : ''}. Viene dai gas che la gravità trattiene, all'equilibrio chimico a quella temperatura.${pre ? ` Le reazioni che fanno i mattoni (scariche elettriche e ultravioletto nell'aria, come nel famoso esperimento): ${pre.HCN > 0.1 ? 'rendono molto' : pre.HCN > 1e-3 ? 'rendono poco' : 'non rendono quasi niente'}${P.atmosfera.riducente ? '' : ", perché l'aria è ossidata"}.` : ''} ${idro ? "Sul fondo del mare l'interno caldo alimenta sorgenti idrotermali: un altro posto dove i mattoni si formano e si concentrano." : cl.acqua === 'liquida' ? "C'è acqua liquida, ma l'interno è freddo: niente sorgenti calde." : "Senza acqua liquida i mattoni non hanno dove incontrarsi."}${pre?.autocatalisi ? ' Ci sono le condizioni perché gli zuccheri si moltiplichino da soli (formaldeide, acqua liquida, un minerale basico).' : ''} Nessuna vita: solo le condizioni.</p>`);
      }
      // PERCHÉ È FATTO COSÌ: la catena delle cause, dall'inizio al suo nucleo
      {
        const v = camMappa.via, Gx = galassiaDi(v.cosmo, v.galassia), St = Gx.stelle[v.stella], Gg = Gx.G, ANNI = 3.156e7;
        const dopo = (13.8e9 - St.eta - Gg.formazione / ANNI) / 1e9, rc = Math.hypot(...St.pos);
        h.push(`<h2>perché è fatto così</h2><ol class="nota catena">
          <li><b>L'inizio.</b> Le fluttuazioni dell'universo appena nato (quelle che si vedono ancora nella radiazione cosmica di fondo) qui erano ${Gg.peso.toFixed(1)} volte più dense della media.</li>
          <li><b>La galassia.</b> Su quel picco la materia è collassata presto: la galassia ${v.galassia + 1} ha cominciato a fare stelle ${(Gg.formazione / ANNI / 1e9).toFixed(1)} miliardi di anni dopo l'inizio.</li>
          <li><b>Le generazioni di stelle.</b> Le stelle grandi vivono pochi milioni di anni ed esplodono, lasciando nel gas ferro, silicio, ossigeno. Questa stella è nata ${Math.max(0, dopo).toFixed(1)} miliardi di anni dopo le prime, a ${rc.toFixed(2)} raggi dal centro: il suo gas aveva ${St.Z.toFixed(2)} volte i metalli del Sole.</li>
          <li><b>Il disco.</b> Dal gas della stella giovane, il disco: ${P.tipo === 'roccioso' ? `vicino alla stella, dove fa caldo, restano solo roccia e metalli; ferro al ${Math.round((P.composizione.ferro ?? 0) * 100)}%` : P.tipo === 'ghiacciato' ? 'oltre la linea della neve, roccia e ghiaccio' : 'oltre la linea della neve un nucleo abbastanza grande da catturare il gas'}.</li>
          <li><b>Il pianeta.</b> ${P.interno && P.tipo !== 'gassoso' ? `Fuso da giovane, il ferro è sceso nel nucleo (${Math.round(P.interno.nucleo * 100)}% del raggio); la radioattività ereditata dalle stesse supernove lo scalda ancora (${P.interno.q.toFixed(3)} W/m²), ${P.interno.dinamo ? 'e il nucleo liquido fa il campo magnetico' : 'ma non abbastanza: il nucleo si è congelato e il campo è sparito'}.` : 'Il gas avvolge il nucleo.'}</li>
        </ol>`);
      }
      const it = P.interno;
      if (it) h.push(`<h2>l'interno</h2><p class="nota">${P.tipo === 'gassoso' ? `idrogeno metallico in profondità: la dinamo fa un campo di ${Math.round(P.B0 * 1e9).toLocaleString('it-IT')} nT.` : `un nucleo di ferro largo ${Math.round(it.nucleo * 100)}% del raggio, ${it.dinamo ? `ancora liquido: la dinamo fa un campo di ${Math.round(P.B0 * 1e9).toLocaleString('it-IT')} nT` : 'congelato: nessuna dinamo, nessun campo magnetico'}; il calore che esce dall'interno ${it.q.toFixed(3)} W/m²; la crosta ${it.tettonica === 'a placche' ? 'si è rotta in placche (il mantello spinge e l\'acqua la indebolisce)' : it.tettonica === 'ferma' ? 'è un guscio unico e fermo' : 'è un guscio unico, bucato dai vulcani'}.`}</p>`);
      // la superficie si calcola in secondo piano (mappa.js): finché non è pronta il pannello lo dice, poi si aggiorna da sé
      const Sx = it && P.tipo !== 'gassoso' ? superficieDi(camMappa.via) : null;
      if (it && P.tipo !== 'gassoso' && !Sx) h.push(`<h2>il clima e la superficie</h2><p class="nota">La superficie si sta formando: la deriva dei continenti per tutta l'età del pianeta, il clima, l'aria che circola, la pioggia e l'erosione. Qualche secondo.</p>`);
      if (Sx) {
        const clm = Sx.cl, sf = Sx.se, px = immagineSuperficie(sf, cl.T, clm);
        h.push(`<h2>il clima</h2><p class="nota">${P.bloccato ? `Le maree della stella lo hanno frenato: le mostra sempre la stessa faccia (il giorno dura quanto l'anno, ${(P.anno / 86400).toFixed(0)} giorni terrestri).` : `Gira in ${(P.giorno / 3600).toFixed(0)} ore, con l'asse inclinato di ${Math.round(P.obliquita)}° (le stagioni); l'anno dura ${(P.anno / 86400).toFixed(0)} giorni terrestri; la rotazione lo schiaccia ai poli del ${(P.schiacciamento * 100).toFixed(1)}%.`} Simulato per molti anni (luce che arriva, calore irradiato e trattenuto dall'atmosfera, calore portato dall'aria e dal mare, ghiaccio che riflette la luce): ghiaccio sul ${Math.round(clm.ghiaccio * 100)}%${clm.ghiaccio > 0.97 ? ': il ghiaccio, riflettendo la luce, ha raffreddato il pianeta fino a coprirlo tutto' : P.bloccato && clm.ghiaccio > 0.2 ? ': mare aperto sotto la stella, ghiaccio sul lato in ombra' : ''}.</p>`);
        const cv = document.createElement('canvas'); cv.width = sf.W; cv.height = sf.H; cv.getContext('2d').putImageData(new ImageData(px, sf.W, sf.H), 0, 0);
        h.push(`<h2>la superficie</h2><img src="${cv.toDataURL()}" style="width:100%;border-radius:3px;image-rendering:auto" alt="la mappa del pianeta"><p class="nota">${sf.placche > 1 ? `il mantello si è organizzato da solo in circa ${sf.placche} celle: dove sale (pennacchi) la crosta si apre, dove scende (una rete di fosse) si accartoccia in montagne e raccoglie la crosta leggera dei continenti` : 'una crosta sola, senza placche'}; i colori sono quelli dei materiali (basalto scuro, roccia chiara dei continenti, il rosso del ferro ossidato, sedimenti pallidi lungo i fiumi; nessun verde: non c'è vita); ${isFinite(sf.mare) ? 'il mare riempie i punti più bassi con l\'acqua che il pianeta ha' : 'niente mari'}; poi ${sf.passiErosione} passi di erosione: la pioggia (dove il clima la permette) scorre, scava le valli in proporzione alla portata e alla pendenza, riempie le conche dove l'acqua che arriva supera quella che evapora (${sf.celleLago ? 'qui ci sono laghi' : 'qui nessun lago'}); in rosso i vulcani (${sf.vulcani.length}). Nessuno l'ha disegnata: viene dalla massa, dalla composizione e dall'età.</p>`);
      }
      // IL MARE (mare.js): che cosa c'è sciolto, e perché
      if (Sx?.mare) {
        const M = Sx.mare;
        if (!M.esiste) h.push(`<h2>il mare</h2><p class="nota">${M.motivo || 'Qui non c\'è acqua liquida in superficie.'}</p>`);
        else {
          const ioni = Object.entries(M.ioni || {}).map(([f, x]) => [f, typeof x === 'number' ? x : x?.moliPerKg ?? 0]).filter(([, x]) => x > 1e-4).sort((p, q) => q[1] - p[1]).slice(0, 6);
          h.push(`<h2>il mare</h2><p class="nota">${M.storia || ''}</p><p class="nota">Salinità ${M.salinitaMedia.toFixed(1)} g per kg d'acqua, pH ${M.pH.toFixed(1)}. Sciolti (moli per kg): ${ioni.map(([f, x]) => `${f} ${x.toPrecision(2)}`).join(', ')}.${M.laghi?.length ? ` Laghi: ${M.laghi.length}${M.laghi.some((l) => l.pH > 9) ? ', alcuni di soda' : ''}.` : ''}${M.sorgentiCalde?.length ? ` Sorgenti calde sul fondo: ${M.sorgentiCalde.length}.` : ''} Avvicinati al mare fino in fondo: sotto il terreno più fine c'è un campione di quell'acqua, e dentro, di dieci in dieci, i granelli, i colloidi, gli ioni e le molecole di quel punto.</p>`);
        }
      }
      const climaSim = Sx ? Sx.cl : null;
      if (cl.acqua === 'liquida' && climaSim && climaSim.ghiaccio < 0.97) {
        const sf = superficie(camMappa.via);
        h.push(`<h2>la superficie: una pozza</h2><p class="nota">Il calore dell'interno (${sf.q.toFixed(3)} W/m²) attraversa una pozza profonda ${(sf.d * 100).toFixed(1)} cm: Rayleigh ${Math.round(sf.c.Ra)}, Marangoni ${Math.round(sf.c.Ma)} → ${sf.c.regime}.</p>${sf.url ? `<img src="${sf.url}" style="width:100%;image-rendering:auto;border-radius:3px" alt="la convezione nella pozza">` : ''}<p class="nota">Nessuno disegna le celle: l'acqua calda sale e quella fredda scende, e si organizzano da sole. Negli strati sottili vince la tensione della superficie e vengono esagoni (le celle di Bénard); più in profondità la gravità, e vengono rulli e labirinti.</p>`);
      }
    }
    h.push(`<h2>da dove viene ciò che vedi</h2><p class="nota">La regione dell'universo n. ${c.seme} riceve:</p><ul class="nota">${Object.entries(conta).map(([o, n]) => `<li>${n} × ${o}</li>`).join('')}</ul><p class="nota">Nella galassia le linee tratteggiate vanno dalle sorgenti alla stella del pianeta.</p>`);
  }
}
function pannelloElemento(h) {
  const c = cel();
  h.push(`<div class="briciole"><button data-vista-p>← il pattern</button> <b>${el().nome}</b></div>`);
  if (c.finestra && !sel) {
    h.push(controlliUniverso(c));
    h.push(`<p class="nota">${el().nota || ''}</p>`);
    const cv = conteggioVero(c);
    if (cv) h.push(`<p class="nota"><b>La nebbia.</b> In ogni istante, in uno strato spesso un metro, qui ci sono circa ${fmtGrande(cv.raggi)} raggi cosmici${cv.fascia >= 1 ? ` e ${fmtGrande(cv.fascia)} particelle della fascia` : ''}: sono la nebbia di puntini. Le linee sono le ${cv.disegnate} che si seguono una per una; avvicinandoti (rotella) ne compaiono altre.</p>`);
    h.push(`<p class="aiuto">Un universo intero, estratto dal suo numero: nessuno l'ha costruito. La cornice arancione è la <b>sezione</b>: trascinane il bordo per spostarla, l'angolo per ingrandirla. La barra del tempo dice <b>fino a quando</b> guardare, la fetta <b>per quanto</b>. Il Pattern ripete questa finestra, nient'altro. In basso a destra: <b>la finestra</b> (la sezione da sola; clic per il suo spaziotempo), <b>l'universo</b> (qui), <b>spaziotempo</b>.</p>`);
  }
  if (!sel) {
    if (!c.finestra) h.push(`<p class="nota">${el().nota || ''}</p>`);
    if (!c.finestra) h.push(`<p class="aiuto">Un elemento solo: una cella di spaziotempo. <b>Passa sopra una linea</b> e vedi le forze che agiscono lì, ognuna col suo colore. <b>Tocca</b> una cosa per cambiarla: la freccia verde (dove nasce la particella), una zona (campo o materia), una massa, una linea. Quello che cambi qui cambia in tutte le copie del pattern.</p>`);
    if (c.esposizioni) {
      const ds = c.esposizioni.flatMap((e) => e.domini), so = c.esposizioni.reduce((n, e) => n + e.sorgenti.length, 0);
      const lisce = c.esposizioni.filter((e) => e.mappa).length;
      h.push(`<h2>che cosa c'è in questa cella</h2><p>${so} particelle, ${lisce ? `un campo magnetico liscio in ${lisce} esposizioni` : `${ds.length} corridoi di campo in ${c.esposizioni.length} esposizioni`}, ${(c.sagome || []).length} sagome.</p><p class="nota">${lisce ? "Ogni linea è una particella che attraversa un campo magnetico liscio, continuo, senza bordi: dove serve è più forte, e lontano dalle tracce si spegne. Dove la linea fa uno spigolo la particella decade, e la figlia riparte nella nuova direzione (un «ginocchio», come un pione che diventa muone). Alla fine del tratto l'ultima decade in particelle neutre, invisibili. Le linee che si incrociano stanno su esposizioni diverse della stessa lastra, perché in un punto il campo è uno solo. Passa sopra una linea per vedere il campo della sua esposizione." : "Ogni linea è una particella che percorre corridoi di campo magnetico tagliati sulla sua curva; alla fine decade in particelle neutre, invisibili. Passa sopra una linea per vedere i suoi corridoi."}</p>`);
      h.push(lastra(c));
      h.push(`<h2>le specie (che cosa sono le particelle)</h2><p class="nota">La carica decide lo spessore della traccia.</p><div class="elenco">`);
      for (const nome of Object.keys(c.specie)) h.push(`<div data-specie="${nome}">◦ <b>${nome}</b> ${descriviSpecie(c.specie[nome])}</div>`);
      h.push('</div>');
      return;
    }
    // le leggi e gli oggetti che le portano: ogni oggetto si accende e si spegne
    const riga = (tipo, i, o, testo) => `<div class="ogg ${accesoOra(o) ? '' : 'spento'}"><input type="checkbox" data-acceso="${tipo}:${i}" ${accesoOra(o) ? 'checked' : ''} title="acceso: agisce sulla fisica"><span data-sel="${tipo}:${i}">${testo}</span>${scattiTesto(o.interruttori, `${tipo}:${i}`)}</div>`;
    const gruppi = {
      gravita: c.masse.map((m, i) => riga('massa', i, m, `${m.nome || `massa ${i + 1}`} · M ${fmt(m.M)}, raggio ${fmt(m.R ?? 0)}`)),
      magnetico: c.domini.map((d, i) => (d.B ? riga('dominio', i, d, `${d.nome || `zona ${i + 1}`} · B ${fmt(d.B)} ${d.B > 0 ? '⊙' : '⊗'}`) : '')).filter(Boolean).concat(c.fondo.B ? [`<div class="ogg"><span>tutta la cella · B ${fmt(c.fondo.B)} (il fondo, sotto)</span></div>`] : []),
      materia: c.domini.map((d, i) => (d.K ? riga('dominio', i, d, `${d.nome || `zona ${i + 1}`} · densità ${fmt(d.K)}`) : '')).filter(Boolean).concat(c.fondo.K ? [`<div class="ogg"><span>tutta la cella · densità ${fmt(c.fondo.K)}</span></div>`] : []),
      decadimento: Object.entries(c.specie).filter(([, sp]) => (sp.vita ?? sp.vitaMedia) != null && sp.figli?.length).map(([n, sp]) => `<div class="ogg"><span data-specie="${n}">${n} → ${[...new Set(sp.figli.map((f) => f.specie))].join(' + ')} ${sp.vitaMedia != null ? `dopo ${fmt(sp.vitaMedia)} in media` : `dopo ${fmt(sp.vita)}`}</span></div>`),
    };
    // i campi naturali di un universo: non sono oggetti messi, sono il suo clima
    if (c.onde?.B?.length) gruppi.magnetico.push(`<div class="ogg"><span>il campo dell'universo: ${c.onde.B.length} onde lunghe</span></div>`);
    (c.cristalli || []).forEach((k, i) => gruppi.magnetico.push(`<div class="ogg"><span>cristallo ${i + 1} · passo ${fmt(k.passo)}, raggio ${fmt(k.r)}</span></div>`));
    if (c.nubi) gruppi.materia.push(`<div class="ogg"><span>nubi di materia · densità fino a ${fmt(c.nubi.K)}</span></div>`);
    h.push(`<h2>le leggi e gli oggetti</h2><p class="nota">⏻ spegne una legge o un oggetto nella fisica: la scena si rifà e in grigio resta com'era. «solo» mostra soltanto quella forza.</p>`);
    for (const [k, f] of Object.entries(FORZE)) {
      const righe = gruppi[k];
      h.push(`<div class="legge ${leggeOra(k) ? '' : 'spenta'} ${solo === k ? 'sola' : ''}" style="--c:${rgb(f.col)}"><div class="testa"><label title="la legge agisce"><input type="checkbox" data-legge="${k}" ${leggeOra(k) ? 'checked' : ''}> <b>${f.simbolo} ${f.nome}</b>${scattiTesto(Array.isArray(leggi[k]) ? leggi[k] : null, `legge:${k}`)}</label><button class="piccolo" data-solo-p="${k}">${solo === k ? 'tutte' : 'solo'}</button></div>`);
      h.push(righe.length ? righe.join('') : `<div class="ogg vuoto">nessun oggetto in questa cella</div>`);
      h.push(`</div>`);
    }
    if ((c.sagome || []).length) h.push(lastra(c));
    h.push(`<h2>dove nascono le particelle</h2><div class="elenco">`);
    c.sorgenti.forEach((so, i) => h.push(riga('sorgente', i, so, `→ sorgente ${i + 1}: <b>${specieDi(so).nome}</b> ${specieDi(so).luce ? 'luce' : `v ${fmt(so.v ?? 0)}`}`)));
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
    h.push(`<label class="riga">bordo <select data-bordo>${['aperto', 'periodico'].map((b) => `<option ${c.bordo === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>`);
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
    h.push(interruttore('sorgente', sel.i, so));
    h.push(`<label class="riga">che cosa emette <select data-specie-sorgente>${Object.keys(c.specie).map((k) => `<option ${k === sp.nome ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`);
    if (!sp.luce) h.push(cursore('vInizio', so, 'v', 0, 30, 0.05, 'velocità'));
    h.push(cursoreAngolo(so));
    h.push(cursore('t0', so, 't0', 0, c.tempo, 0.05, 'partenza'));
    h.push(pannelloSpecie(sp.nome));
  } else if (sel.tipo === 'dominio') {
    const d = c.domini[sel.i];
    h.push(`<h2>${d.nome || 'zona'}</h2><p class="nota">una zona del piano con le sue proprietà, ferme nel tempo. ${d.forma.tipo === 'cerchio' ? 'Trascina il centro per spostarla, il quadratino sul bordo per allargarla.' : 'Vale in tutta la cella.'}</p>`);
    h.push(interruttore('dominio', sel.i, d));
    h.push(`<label class="riga">forma <select data-forma>${['tutto', 'cerchio'].map((f) => `<option ${d.forma.tipo === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`);
    if (d.forma.tipo === 'cerchio') h.push(cursore('raggioDominio', d.forma, 'r', 2, 300, 0.5, 'raggio'));
    h.push(cursore('B', d, 'B', -1, 1, 0.005, 'campo magnetico B'));
    h.push(cursore('K', d, 'K', 0, 120, 0.5, 'materia K'));
    h.push(misureDominio(d));
  } else if (sel.tipo === 'massa') {
    const m = c.masse[sel.i];
    h.push(`<h2>${m.nome || 'massa'}</h2><p class="nota">un corpo fermo che curva lo spazio. Trascinalo. Le frecce rosse: dove e quanto tira; gli anelli: dove la caduta è forte.</p>`);
    h.push(interruttore('massa', sel.i, m));
    h.push(cursore('M', m, 'M', 0, 4000, 5, 'massa M'));
    h.push(cursore('R', m, 'R', 0, 40, 0.5, 'raggio R'));
  }
  h.push(`<div class="riga-bottoni">${['traccia', 'specie'].includes(sel.tipo) ? '' : '<button data-azione="elimina">elimina</button>'}<button data-azione="chiudi">chiudi</button></div>`);
}
// la lastra: non è una forza, è ciò che registra. Le tracce delle cariche e della
// luce, e le sagome dei corpi appoggiati sopra, impresse dal lampo
const lastra = (c) => `<h2>la lastra</h2><div class="legge" style="--c:rgb(28,27,24)"><div class="testa"><label><input type="checkbox" data-lampo ${c.lampo === false ? '' : 'checked'}> <b>■ il lampo: ${(c.sagome || []).length} sagome</b></label></div><p class="spiega">Le campiture sono sagome di corpi opachi appoggiati sulla lastra: un lampo di luce uniforme, all'istante zero, ne imprime la forma piena, come in una radiografia. Non è una forza: è un modo in cui la lastra registra.</p></div>`;
const interruttore = (tipo, i, o) => `<label class="riga interr"><span><b>acceso</b> — agisce sulla fisica${scattiTesto(o.interruttori, `${tipo}:${i}`)}</span><input type="checkbox" data-acceso="${tipo}:${i}" ${accesoOra(o) ? 'checked' : ''}></label>`;
const scattiTesto = (ev, chi) => (ev && ev.length ? ` <span class="scatti">${ev.map((e) => `${e.acceso ? 'acceso' : 'spento'} a t ${fmt(e.t)}`).join(', ')} <button class="piccolo" data-togli-scatti="${chi}" title="togli gli scatti nel tempo">✕</button></span>` : '');
function descriviDominio(d) { const p = []; if (d.B) p.push(`campo ${fmt(d.B)}`); if (d.K) p.push(`materia ${fmt(d.K)}`); return p.join(', ') || 'vuoto'; }
function descriviSpecie(s) { const v = s.vita != null ? `dopo ${fmt(s.vita)}` : s.vitaMedia != null ? `in media dopo ${fmt(s.vitaMedia)}` : null; if (s.luce) return `luce${v ? `, si converte ${v}` : ''}`; return `q ${fmt(s.q ?? 0)}, m ${fmt(s.m ?? 1)}${v ? `, decade ${v}` : ''}`; }
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
  h.push(`<label class="riga"><span>visibile</span><input type="checkbox" data-visibile="${nome}" ${(s.visibile ?? (s.q ?? 0) !== 0) ? 'checked' : ''}></label><p class="spiega">${SPIEGA.visibile}</p>`);
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
  if (t.dataset.univN != null) { const n = parseInt(t.value); if (n > 0) cambiaUniverso(n); return; }
  if (t.dataset.acceso) { const [tipo, i] = t.dataset.acceso.split(':'); cambiaOggetto(tipo, +i, t.checked); return; }
  if (t.dataset.legge) { cambiaLegge(t.dataset.legge, t.checked); return; }
  if (t.dataset.lampo != null) { ricorda(); confronta(t.checked ? 'com\'era senza il lampo' : 'com\'era con il lampo'); if (t.checked) delete cel().lampo; else cel().lampo = false; aggiorna(); return; }
  ricorda();
  if (t.dataset.specchio != null) comp.elementi[scelto.e].posti[scelto.p].specchio = t.checked;
  if (t.dataset.originale != null) mostraOriginale = t.checked;
  if (vista !== 'pattern') {
    const c = cel();
    if (t.dataset.bordo != null) c.bordo = t.value;
    if (t.dataset.forma != null) { const d = c.domini[sel.i]; d.forma = t.value === 'tutto' ? { tipo: 'tutto' } : { tipo: 'cerchio', centro: [c.larghezza / 2, c.altezza / 2], r: c.larghezza * 0.3 }; }
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
  if (d.univ && comp.elementi[0].cella.materia) return eventoMateria(+d.univ);
  if (d.univ) { const n = cel()?.seme ?? comp.elementi[0].cella.seme; return cambiaUniverso(Math.max(1, n + +d.univ)); }
  if (d.cerca === 'vicini' && (indirizzoOra()?.zoom || []).length) { $('cercaStato').textContent = "I rami si scelgono al livello della regione (torna su con la rotella): qui dentro le particelle sono le stesse di lassù, e un ramo deve cambiarle a ogni livello insieme."; return; }
  if (d.cerca) return cercaBella(d.cerca);
  if ('finestraBella' in d) { const r = cercaFinestra(camMappa, tela.width, tela.height); if (r) { camMappa.cx = r.cx; camMappa.cy = r.cy; camMappa.z = r.z; disegna(); dove(); const s = $('finestraStato'); if (s) s.textContent = `Trovata tra 28 inquadrature (${r.bellezza.totale.toFixed(2)}): ${r.bellezza.simmetria > 0.35 ? 'ha una simmetria' : r.bellezza.ripetizione > 0.35 ? 'ripete un motivo' : 'il disegno più ricco qui attorno'}. Ancora 🎲 per cercare da qui.`; } return; }
  if (d.moto) { const [vv, dd] = d.moto.split('|').map(Number); ricorda(); cel().vista.velocita = vv; cel().vista.direzione = dd; simula(); aggiornaTempo(); disegna(); mostraPannello(); return; }
  if (d.ripeti) { ricorda(); const c = comp.elementi[0].cella; c.ripeti = { ...ripetiDi(c), gruppo: d.ripeti }; adattaPattern(); aggiornaVista(); return; }
  if (d.togliScatti) {
    const [tipo, i] = d.togliScatti.split(':');
    if (tipo === 'legge') leggi[i] = true; else { ricorda(); const o = { sorgente: cel().sorgenti, dominio: cel().domini, massa: cel().masse }[tipo][+i]; delete o.interruttori; }
    return aggiorna();
  }
  if (d.soloP) { solo = solo === d.soloP ? null : d.soloP; mostraSchede(); dove(); disegna(); mostraPannello(); return; }
  if (d.vistaP != null) { vista = 'pattern'; aggiornaVista(); return; }
  if (d.modoP) { vista = d.modoP; aggiornaVista(); return; }
  if (d.ramoP) { const k = d.ramoP.lastIndexOf('|'), ev = d.ramoP.slice(0, k), r = +d.ramoP.slice(k + 1); camMappa.via = { ...camMappa.via, cosmo: ev ? cosmoRamo(camMappa.via.cosmo, ev, r) : cosmoBase(camMappa.via.cosmo) }; aggiornaVista(); return; }
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
    conta.gravita = c.masse.filter((m) => m.M).length ? `${c.masse.filter((m) => m.M).length} ${c.masse.filter((m) => m.M).length === 1 ? 'massa' : 'masse'}` : c.masse.length && c.dipoli?.length ? 'trascurabile' : c.masse.length ? `${c.masse.length} ${c.masse.length === 1 ? 'massa' : 'masse'}` : 'nessuna';
    const tuttiDomini = [...c.domini, ...(c.esposizioni || []).flatMap((e) => e.domini)];
    const zB = [c.fondo, ...tuttiDomini].filter((d) => d.B).length, zK = [c.fondo, ...tuttiDomini].filter((d) => d.K).length;
    const lisce = (c.esposizioni || []).filter((e) => e.mappa).length, naturaliB = (c.onde?.B?.length ? 1 : 0) + (c.cristalli || []).length + lisce + (c.dipoli || []).length;
    conta.magnetico = zB || naturaliB ? [zB && `${zB} ${zB === 1 ? 'zona' : 'zone'}`, (c.onde?.B?.length || lisce) && 'campo liscio', (c.cristalli || []).length && `${c.cristalli.length} cristalli`, (c.dipoli || []).length && 'il campo del pianeta'].filter(Boolean).join(', ') : 'nessuno';
    const nubiLisce = (c.esposizioni || []).filter((e) => e.mappa?.sparsaK).length;
    conta.materia = zK || c.nubi || nubiLisce ? [zK && `${zK} ${zK === 1 ? 'zona' : 'zone'}`, (c.nubi || nubiLisce) && 'nubi lisce'].filter(Boolean).join(', ') : 'nessuna';
    const dec = Object.values(c.specie).filter((s) => s.vita != null || s.vitaMedia != null).length;
    const ginocchi = (c.esposizioni || []).reduce((n, e) => n + e.sorgenti.filter((so) => so.vita != null).length, 0);
    conta.decadimento = dec || ginocchi ? [dec && `${dec} specie`, ginocchi && `${ginocchi} particelle con la loro vita`].filter(Boolean).join(', ') : 'niente';
  }
  // ogni scheda: il nome (clic: vista «solo questa forza») e l'interruttore ⏻ (la legge agisce o no)
  schede.classList.toggle('legenda', !c);
  schede.innerHTML = Object.entries(FORZE).map(([k, f]) => `<span class="scheda ${solo === k ? 'sola' : ''} ${leggeOra(k) ? '' : 'spenta'}" style="--c:${rgb(f.col)}">`
    + `<button data-solo="${k}" title="${c ? 'vedi solo questa forza' : f.frase}"><i>${f.simbolo}</i> ${f.nome}${conta[k] ? ` <small>${conta[k]}</small>` : ''}</button>`
    + `<label title="la legge agisce (spenta: la fisica la ignora)"><input type="checkbox" data-legge="${k}" ${leggeOra(k) ? 'checked' : ''}>⏻</label></span>`).join('')
    + `<label class="colori"><input type="checkbox" id="coloriForze" ${coloriForze ? 'checked' : ''}> linee colorate per forza</label>`;
}
// accendere e spegnere: la legge intera o un oggetto. Si rifà la fisica; in grigio resta com'era
function confronta(testo) { confronto = tracce.length ? tracce : null; confrontoTesto = testo; }
const aggiungiScatto = (lista, t, acceso) => [...(lista || []).filter((e) => Math.abs(e.t - t) > 1e-9), { t, acceso }].sort((a, b) => a.t - b.t);
function cambiaLegge(k, acceso) {
  const t = Math.round(ora() * 1000) / 1000;
  if (vista !== 'pattern') confronta(aMeta() ? `come sarebbe andata se a t ${fmt(t)} non si fosse ${acceso ? 'accesa' : 'spenta'} ${FORZE[k].art}` : `com'era ${acceso ? 'senza' : 'con'} ${FORZE[k].art}`);
  if (aMeta()) leggi[k] = aggiungiScatto(Array.isArray(leggi[k]) ? leggi[k] : [], t, acceso);
  else leggi[k] = acceso;
  aggiorna(); mostraSchede();
}
function cambiaOggetto(tipo, i, acceso) {
  const c = cel(), o = { sorgente: c.sorgenti, dominio: c.domini, massa: c.masse }[tipo]?.[i]; if (!o) return;
  const chi = o.nome || ({ sorgente: 'questa sorgente', dominio: 'questa zona', massa: 'questa massa' })[tipo];
  ricorda();
  if (aMeta() && tipo !== 'sorgente') {
    // l'interruttore scatta adesso: prima di questo istante non cambia niente, dopo sì
    const t = Math.round(ora() * 1000) / 1000;
    confronta(`come sarebbe andata se a t ${fmt(t)} non si fosse ${acceso ? 'acceso' : 'spento'} «${chi}»`);
    o.interruttori = aggiungiScatto(o.interruttori, t, acceso);
  } else {
    confronta(`com'era ${acceso ? 'senza' : 'con'} ${chi}`);
    delete o.interruttori; if (acceso) delete o.spento; else o.spento = true;
  }
  aggiorna();
}
schede.addEventListener('click', (e) => {
  const b = e.target.closest('[data-solo]'); if (!b || vista === 'pattern') return;
  solo = solo === b.dataset.solo ? null : b.dataset.solo; mostraSchede(); dove(); disegna(); mostraPannello();
});
schede.addEventListener('change', (e) => {
  if (e.target.id === 'coloriForze') { coloriForze = e.target.checked; disegna(); return; }
  if (e.target.dataset.legge) cambiaLegge(e.target.dataset.legge, e.target.checked);
});
schede.addEventListener('pointerover', (e) => {
  const b = e.target.closest('.scheda'), f = b ? b.querySelector('[data-solo]').dataset.solo : null;
  if (f !== fuoco) { fuoco = f; $('spiegaForza').innerHTML = f ? `<b style="color:${rgb(FORZE[f].col)}">${FORZE[f].simbolo} ${FORZE[f].nome}</b> — ${FORZE[f].frase}${vista === 'pattern' ? ' <i>⏻ la spegne in tutto il pattern.</i>' : ' <i>Clic sul nome: vedi solo questa forza. ⏻: la spegni nella fisica, e vedi in grigio com\'era.</i>'}` : ''; if (vista === 'dettaglio' && !solo) disegna(); }
});
schede.addEventListener('pointerleave', () => { if (fuoco) { fuoco = null; $('spiegaForza').innerHTML = ''; disegna(); } });

// ---------- gli strumenti (solo nell'elemento) e le viste
function scegliStrumento(st) { strumento = st; document.querySelectorAll('[data-strumento]').forEach((b) => b.classList.toggle('attivo', b.dataset.strumento === st)); tela.style.cursor = st === 'seleziona' ? 'default' : 'crosshair'; dove(); }
document.querySelectorAll('[data-strumento]').forEach((b) => b.addEventListener('click', () => scegliStrumento(strumento === b.dataset.strumento ? 'seleziona' : b.dataset.strumento)));
document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.vista === 'pattern') { vista = 'pattern'; sonda = null; aggiornaVista(); } else entra(corrente); }));
document.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.modo === 'cosmo') return apriCosmo(); vista = { spaziotempo: 'spaziotempo', finestra: 'finestra' }[b.dataset.modo] || 'dettaglio'; aggiornaVista(); }));
const v3 = creaVista3D(tela3d, { spunte: () => ({ linee: true, pianta: true, taglio: true, forze: false, masse: true, campi: true }) });
function imposta3D() {
  const c = cel(), blocchi = c.domini.filter((d) => d.forma.tipo !== 'tutto').map((d) => ({ regione: d.forma, legge: [d.B && { tipo: 'magnetico' }, d.K && { tipo: 'materia' }].filter(Boolean) }));
  if (!c.finestra) { v3.imposta({ masse: c.masse, blocchi }, tracce); return; }
  // le interazioni nel blocco: dove entrano i raggi (con la loro origine) e dove le particelle si spezzano
  const z = c.sezione || { fine: tMax(), durata: tMax() }, t0 = z.fine - z.durata, eventi = [];
  for (const d of tracce.decadimenti || []) if (d.t >= t0 && d.t <= z.fine && dentroBlocco(c, d.pos[0], d.pos[1])) eventi.push({ tipo: 'decadimento', x: d.pos[0], y: d.pos[1], t: d.t - t0 });
  for (const tr of tracce) { if (tr.madre || !tr.punti.length) continue; const p = tr.punti.find((q) => q[3] >= t0 && q[3] <= z.fine && dentroBlocco(c, q[0], q[1])); const src = c.sorgenti[tr.sorgente]; if (p) eventi.push({ tipo: 'arrivo', x: p[0], y: p[1], t: p[3] - t0, testo: src?.origine ? src.origine.replace(/ \(galassia \d+\)/, '') : '' }); }
  v3.imposta({ masse: c.masse.filter((m) => dentroBlocco(c, m.pos[0], m.pos[1])), blocchi: [], scalaTempo: (c.vista || {}).scalaTempo ?? 5, eventi }, bloccoFinestra(c, tracce));
  if (allineaAllaFinestra) { allineaAllaFinestra = false; v3.allinea(c.vista || {}); }
}
let allineaAllaFinestra = false;
// le linee d'universo dentro la finestra e la fetta di tempo; il tempo parte dall'inizio della fetta
const dentroBlocco = (c, x, y) => Math.abs(x - c.finestra.centro[0]) <= c.finestra.lato / 2 && Math.abs(y - c.finestra.centro[1]) <= c.finestra.lato / 2;
function bloccoFinestra(c, tracce) {
  const z = c.sezione || { fine: tMax(), durata: tMax() }, t0 = z.fine - z.durata, t1 = z.fine, l = c.finestra.lato / 2, [cx, cy] = c.finestra.centro, out = [];
  for (const tr of tracce) {
    if (tr.sagoma) continue;
    const P = []; let dentro = false;
    for (const p of tr.punti) {
      const ok = p[2] && p[3] >= t0 && p[3] <= t1 && dentroBlocco(c, p[0], p[1]);
      if (ok) { P.push([p[0], p[1], p[2], p[3] - t0, p[4], p[5]]); dentro = true; }
      else if (dentro) { const q = P[P.length - 1]; P.push([q[0], q[1], 0, q[3], q[4], q[5]]); dentro = false; }
    }
    if (P.length > 1) out.push({ ...tr, punti: P, colori: undefined });
  }
  // gli spigoli del blocco, invisibili: la scatola è la finestra
  out.push({ id: -1, punti: [[cx - l, cy - l, 0, 0, 0], [cx + l, cy + l, 0, t1 - t0, 0]] });
  return out;
}
// la riga in basso: dove sei e che cosa puoi fare
function dove() {
  const t = vista === 'pattern'
    ? (!comp.reticolo ? `Il pattern: la finestra ${nomeDi(comp.elementi[0].cella)}, ${ripetiDi(comp.elementi[0].cella).gruppo === 'una' ? 'da sola' : `ripetuta ${GRUPPI[comp.elementi[0].cella.ripeti.gruppo].nome.replace(/^caleidoscopio/, 'nel caleidoscopio')}`}. Clic per guardare la finestra da sola; trascina per muoverti, rotella per lo zoom; 🎲 per un'altra sezione bella.` : `Il pattern «${comp.nome}»: passa sopra un motivo per vedere le sue copie, cliccalo per entrare nella sua fisica.`)
    : strumento !== 'seleziona' ? `Clicca sulla scena dove mettere ${({ sorgente: 'la particella', campo: 'il campo', materia: 'la materia', massa: 'la massa', })[strumento]} (Esc per annullare).`
    : vista === 'cosmo' ? `${percorso(camMappa).join(' › ')}. Rotella per avvicinarti o allontanarti, trascina per muoverti, clic su una cosa per andarci. ${camMappa.livello === 0 ? 'Lo spazio si richiude su sé stesso: andando sempre dritto si torna qui.' : camMappa.livello === 3 ? 'I quadrati sono le regioni: avvicinati a una per entrare nel suo universo; avvicinati al pianeta per scendere sulla sua superficie.' : camMappa.livello === 5 ? `${rocciaDi(camMappa)?.nome || ''}: ${(rocciaDi(camMappa)?.frase || '')}. ${telaAtomi ? `Atomo per atomo, in tre dimensioni: trascina per ruotare, rotella per avvicinarti (verso il cursore); allontanati oltre la scena per risalire${camMappa.suAcqua ? "; avvicinati fino in fondo per l'evento vero" : ''}. Il bottone in alto entra nella finestra di questo punto.` : 'Clic: entra nella finestra di questo punto (le tracce delle particelle dentro questa materia). Rotella indietro per risalire.'}` : camMappa.livello === 4 ? 'La superficie: avvicinandoti il terreno si calcola sempre più fine, dai continenti alle valli (fino a celle di una decina di metri). Passa sopra un punto per quota e temperatura; quando lo schermo è largo poche centinaia di chilometri, un clic su un punto apre la finestra sull\'aria che ha sopra: lo sciame di un raggio cosmico.' : ''}`
    : vista === 'finestra' ? `La finestra: la sezione ${nomeDi(el().cella)} da sola. Clic sulla finestra per vederne lo spaziotempo; «l'universo» per spostarla o ingrandirla; la barra del tempo sceglie la fetta.`
    : vista === 'spaziotempo' && el()?.cella.finestra ? `Lo spaziotempo della finestra, guardato all'inizio dallo stesso angolo della sezione: è il pattern. Trascina per ruotarlo e vedere le linee d'universo nel blocco (il tempo sale); i punti arancio sono dove entrano i raggi e da dove vengono, le stelle verdi dove una particella si spezza. Tasto A: torna allineato.`
    : vista !== 'pattern' && el()?.cella.finestra && !solo && !aMeta() ? `«${el().nome}»: cerca la sezione. Trascina il bordo della cornice per spostarla, l'angolo per ingrandirla; la barra del tempo e la fetta scelgono quando guardare. Il Pattern mostra la sezione.`
    : vista === 'spaziotempo' ? `«${el().nome}» nello spaziotempo: il tempo sale. Trascina per ruotare, rotella per avvicinarti.`
    : solo ? `Vedi solo ${FORZE[solo].art}: ${solo === 'decadimento' ? 'in verde le particelle nate da un decadimento, le stelle dove avviene' : 'le linee si accendono dove questa forza le piega, tanto più quanto più conta'}. Clic di nuovo sul nome per tornare a tutto.`
    : aMeta() ? `t ${fmt(ora())}: ora ogni ⏻ scatta in questo istante, e le traiettorie cambiano da qui in poi (le tacche sulla linea del tempo). Porta il tempo alla fine per accendere o spegnere per tutta la storia.`
    : `«${el().nome}»: passa sopra una linea per vedere le forze che la piegano; tocca una cosa per cambiarla. Ferma il tempo a metà (o fallo scorrere) e i ⏻ scattano in quell'istante.`;
  $('dove').textContent = t + (confronto && vista !== 'pattern' ? ` In grigio: ${confrontoTesto}.` : '');
}
function aggiornaVista() {
  const inPattern = vista === 'pattern';
  document.querySelectorAll('[data-vista]').forEach((b) => b.classList.toggle('attivo', (b.dataset.vista === 'pattern') === inPattern));
  const conFinestra = !!el()?.cella.finestra, modoOra = { spaziotempo: 'spaziotempo', finestra: 'finestra', cosmo: 'cosmo' }[vista] || 'piano';
  document.body.classList.toggle('in-cosmo', vista === 'cosmo');
  document.querySelectorAll('[data-modo]').forEach((b) => { b.classList.toggle('attivo', b.dataset.modo === modoOra); if (b.dataset.modo === 'finestra') b.hidden = !conFinestra; if (b.dataset.modo === 'cosmo') b.hidden = !el()?.cella.indirizzo; if (b.dataset.modo === 'piano') b.textContent = conFinestra ? "l'universo" : 'piano'; });
  document.body.classList.toggle('in-finestra', vista === 'finestra' || vista === 'spaziotempo');
  document.body.classList.toggle('in-pattern', inPattern);
  tela.hidden = vista === 'spaziotempo'; tela3d.hidden = vista !== 'spaziotempo';
  $('nomeElemento').textContent = el() ? `: ${el().nome}` : '';
  if (inPattern) scegliStrumento('seleziona');
  simula(); aggiornaTempo(); mostraSchede(); dove();
  if (vista === 'spaziotempo') imposta3D();
  montaAtomi(); disegna(); mostraPannello();
  if (vista === 'cosmo' && !animazione) animazione = requestAnimationFrame(anima);
}
function carica(nuova, { tieniImmagine = false } = {}) {
  comp = nuova; corrente = 0; scelto = null; sopra = null; sel = null; tempo = Infinity; gioca = false; $('gioca').textContent = '▶'; confronto = null; if (!tieniImmagine) immagine = null;
  vista = 'pattern'; adattaPattern(); aggiornaVista();
}
$('annulla').addEventListener('click', annulla); $('rifai').addEventListener('click', rifai);
function ripristina(s) { const o = JSON.parse(s); comp = o.comp; corrente = Math.min(o.corrente, comp.elementi.length - 1); sel = null; scelto = null; aggiornaVista(); }
function annulla() { if (!indietro.length) return; avanti.push(JSON.stringify({ comp, corrente })); ripristina(indietro.pop()); }
function rifai() { if (!avanti.length) return; indietro.push(JSON.stringify({ comp, corrente })); ripristina(avanti.pop()); }
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? rifai() : annulla(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); rifai(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); salvaSeme(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); $('fileImmagine').click(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') elimina();
  else if ((e.key === 'a' || e.key === 'A') && vista === 'spaziotempo' && el()?.cella.finestra) v3.allinea(el().cella.vista || {});
  else if (e.key === 'Escape') {
    if (strumento !== 'seleziona') { scegliStrumento('seleziona'); return; }
    if (vista !== 'pattern' && !sel) { vista = 'pattern'; aggiornaVista(); return; }
    sel = null; scelto = null; disegna(); mostraPannello();
  }
});

// ---------- il menu File
const menu = $('menuFile');
$('apriMenu').addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('aperto'); });
addEventListener('click', () => menu.classList.remove('aperto'));
menu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-file]'); if (!b) return;
  menu.classList.remove('aperto');
  ({ nuovo: apriNuovo, immagine: () => $('fileImmagine').click(), apri: () => $('fileSeme').click(), salva: salvaSeme, png: esportaPNG, testo: () => { $('testoSeme').value = JSON.stringify(comp, null, 1); $('dialogoSeme').showModal(); } })[b.dataset.file]();
});
const scarica = (blob, nome) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const nomeFile = (est) => `${(comp.nome || 'stateyour').replace(/[^\p{L}\p{N}]+/gu, '_')}.${est}`;
function salvaSeme() { scarica(new Blob([JSON.stringify(comp, null, 1)], { type: 'application/json' }), nomeFile('json')); }
function esportaPNG() { if (vista === 'spaziotempo') tela3d.toBlob((b) => scarica(b, nomeFile('png'))); else { disegna(); tela.toBlob((b) => scarica(b, nomeFile('png'))); } }
$('fileSeme').addEventListener('change', async (ev) => {
  const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
  try { const n = JSON.parse(await f.text()); if (!n.elementi || !n.reticolo) throw new Error('non è un seme di stateyour'); ricorda(); carica(n); } catch (e) { alert(`Il file non si legge: ${e.message}`); }
});
$('usaSeme').addEventListener('click', () => { try { const n = JSON.parse($('testoSeme').value); if (!n.elementi || !n.reticolo) throw new Error('mancano gli elementi o la piastrella'); ricorda(); carica(n); $('dialogoSeme').close(); } catch (e) { alert(`Il seme non si legge: ${e.message}`); } });
$('chiudiSeme').addEventListener('click', () => $('dialogoSeme').close());

// ---------- la biblioteca: un universo per ogni numero
// un ramo: { rami, separato } — lo stesso universo, con alcuni eventi andati diversamente
const nomeRamo = (c) => { const n = Object.keys(c.rami || {}).length; return n ? `un ramo parallelo (${n} ${n === 1 ? 'evento andato' : 'eventi andati'} diversamente, separato a t ${fmt(c.separato ?? 0)})` : ''; };
function compBiblioteca(n, finestra, sezione, vistaS, ripeti, ramoS) {
  const u = universo(n, ramoS?.storia && Object.keys(ramoS.storia).length ? ramoS.storia : null); // storia: gli eventi del cosmo andati diversamente
  if (ripeti) u.cella.ripeti = clona(ripeti);
  if (ramoS?.rami && Object.keys(ramoS.rami).length) { u.cella.rami = { ...ramoS.rami }; u.cella.separato = ramoS.separato; u.nome = `${u.nome}, un ramo`; }
  if (finestra) u.cella.finestra = clona(finestra);
  if (sezione) u.cella.sezione = clona(sezione);
  u.cella.vista = vistaS ? clona(vistaS) : { ...VISTA_SOPRA };
  return { nome: u.nome, nota: u.nota, reticolo: null, elementi: [{ nome: u.nome, nota: u.nota, cella: u.cella, posti: [{ pos: [0, 0], rot: 0 }] }] };
}
let cercatore = null;
// «ovunque»: molti universi e inquadrature, poi i vicini; «qui»: inquadrature in questo universo, poi i vicini;
// «vicini»: solo il cammino tra gli universi vicini a questo
function cercaBella(come = 'ovunque') {
  if (cercatore) cercatore.terminate();
  const c = comp.elementi[0].cella, stato = (t) => { const el = $('cercaStato'); if (el) el.textContent = t; $('dove').textContent = t; };
  stato(come === 'vicini' ? `cerco tra i rami paralleli dell'universo n. ${c.seme}…` : come === 'qui' ? `cerco un'inquadratura più bella nell'universo n. ${c.seme}…` : 'sfoglio la biblioteca: molti universi, molte inquadrature…');
  cercatore = new Worker(new URL('./cercatore.js', import.meta.url), { type: 'module' });
  const seme = Math.floor(Math.random() * 1e9);
  cercatore.onmessage = (ev) => {
    const m = ev.data;
    if (m.errore) { stato(`la ricerca non è riuscita: ${m.errore.split('\n')[0]}`); console.error(m.errore); return; }
    if (!m.fatto && m.fase === 'cerca') stato(`${come === 'qui' ? 'provo inquadrature' : 'sfoglio la biblioteca'}… ${Math.round(m.frazione * 100)}% · la più bella finora: ${m.migliore ? m.migliore.bellezza.totale.toFixed(2) : '–'}`);
    if (!m.fatto && m.fase === 'perfeziona') stato(`quasi bella: risalgo ai decadimenti da cui nascono le linee storte, e cerco il ramo in cui sono andati diversamente… ${Math.round(m.frazione * 100)}% · ${m.bellezza.totale.toFixed(2)}`);
    if (m.fatto) {
      const b = m.migliore; cercatore.terminate(); cercatore = null;
      // il ramo trovato: lo stesso universo, con alcuni decadimenti andati diversamente
      ricorda();
      if (b.cella.indirizzo?.materia) { comp = clona(comp); Object.assign(comp.elementi[0].cella, { finestra: b.finestra, sezione: b.sezione, vista: b.vista, ripeti: b.ripeti }, b.cella.rami && Object.keys(b.cella.rami).length ? { rami: b.cella.rami, separato: b.cella.separato } : {}); } // (dentro la materia: stessa cella, altra inquadratura o altro ramo)
      else if ((b.cella.indirizzo?.zoom || []).length) { comp = compZoom(b.cella.indirizzo); Object.assign(comp.elementi[0].cella, { finestra: b.finestra, sezione: b.sezione, vista: b.vista, ripeti: b.ripeti }); }
      else comp = compBiblioteca(b.numero, b.finestra, b.sezione, b.vista, b.ripeti, { rami: b.cella.rami, separato: b.cella.separato });
      corrente = 0; sel = null; scelto = null;
      vista = 'pattern'; adattaPattern(); aggiornaVista();
      const x = b.bellezza;
      stato(`trovata: universo n. ${b.numero}${nomeRamo(b.cella) ? `, ${nomeRamo(b.cella)}` : ''}, ${x.totale.toFixed(2)} di bellezza${b.partenza != null ? ` (era ${b.partenza.toFixed(2)})` : ''} · ${GRUPPI[b.ripeti.gruppo].nome} · inchiostro ${x.pieno.toFixed(2)}, celle ${x.celle.toFixed(2)}, nitidezza ${x.nitido.toFixed(2)}, linee distese ${x.distese.toFixed(2)}, pulizia ${x.pulizia.toFixed(2)}${inclinata(b.vista) ? ` · guardata inclinata di ${Math.round(b.vista.inclinazione)}°` : ''}`);
    }
  };
  const da = 1 + Math.floor(Math.random() * REGIONI * PIANETI_MAX * STELLE * cosmoDi(1).galassie.length * 0.98);
  cercatore.postMessage(come === 'vicini' ? { stato: { cella: clona(c), finestra: c.finestra, vista: c.vista, sezione: c.sezione, ripeti: ripetiDi(c), numero: c.seme }, passi: 60, seme }
    : come === 'qui' ? { solo: c.seme, cella: (c.indirizzo?.zoom || []).length || c.indirizzo?.materia ? clona(c) : undefined, inquadrature: 24, seme, gruppo: ripetiDi(c).gruppo } : { da, universi: 24, inquadrature: 16, seme, gruppo: ripetiDi(c).gruppo === 'una' ? undefined : 'caleidoscopio' });
}
function cambiaUniverso(n) {
  // stessa inquadratura, stessa fetta di tempo: un altro universo
  const c = comp.elementi[0].cella, nuova = compBiblioteca(n, c.finestra, c.sezione, c.vista, c.ripeti);
  ricorda(); comp = nuova; corrente = 0; sel = null; scelto = null;
  if (vista === 'pattern') { adattaPattern(); aggiornaVista(); } else entra(0);
}

// ---------- «Da dove partiamo?»: un'immagine, l'esempio, un modello, il vuoto
function apriNuovo() {
  const carte = [
    `<button data-carta="biblioteca" class="grande"><b>La biblioteca</b><span>un universo naturale estratto da un numero: masse, campi, nubi, cristalli, raggi cosmici. Il pattern non si costruisce, si trova: una finestra e una fetta di tempo</span></button>`,
    `<button data-carta="immagine"><b>Un'immagine…</b><span>dal computer: viene pulita, letta e rifatta con la fisica, tratto per tratto</span></button>`,
    `<button data-carta="esempio"><b>Esempio: tavola greca</b><span>Owen Jones, «Grammar of Ornament», 1856: la stessa lettura, già pronta da provare</span></button>`,
    `<button data-carta="vuoto"><b>Vuoto</b><span>una cella con una sola particella in un campo: da qui si costruisce tutto</span></button>`,
  ];
  $('carte').innerHTML = carte.join('');
  $('nuovo').showModal();
}
$('chiudiNuovo').addEventListener('click', () => $('nuovo').close());
$('carte').addEventListener('click', (e) => {
  const b = e.target.closest('[data-carta]'); if (!b) return;
  $('nuovo').close();
  const k = b.dataset.carta;
  if (k === 'biblioteca') { ricorda(); carica(compBiblioteca(1 + Math.floor(Math.random() * REGIONI * PIANETI_MAX * STELLE * cosmoDi(1).galassie.length))); cercaBella('ovunque'); }
  else if (k === 'immagine') $('fileImmagine').click();
  else if (k === 'esempio') daImmagine('./esempi/greco_6.png', 'la tavola greca n. 6');
  else if (k === 'modello') { ricorda(); carica(COMPOSIZIONI[b.dataset.nome]()); }
  else if (k === 'vuoto') {
    ricorda();
    carica({ nome: 'nuovo', nota: 'una particella in un campo magnetico: aggiungi campi, materia, masse, specchi', reticolo: { a: [200, 0], b: [0, 200] }, elementi: [{ nome: 'elemento 1', nota: '', posti: [{ pos: [0, 0], rot: 0 }], cella: {
      larghezza: 200, altezza: 200, c: 30, G: 1, bordo: 'aperto', tempo: 40, fondo: { B: 0.15, K: 0 }, domini: [], masse: [],
      pellicola: { w0: 1, saturazione: 4, vRif: 8 }, specie: { carica: { q: 1, m: 1 } }, sorgenti: [{ pos: [60, 100], dir: 0, v: 8, specie: 'carica' }] } }] });
    entra(0);
  }
});

// ---------- leggere un'immagine: pulizia, tratti, fisica, verifica
let lettore = null;
function passoLettura(n, testo) {
  document.querySelectorAll('#passi li').forEach((li) => { const k = +li.dataset.passo; li.className = k < n ? 'fatto' : k === n ? 'ora' : ''; if (k === n && testo) li.querySelector('small').textContent = testo; });
}
async function daImmagine(src, nome) {
  $('letturaTitolo').textContent = `Leggo ${nome}`; $('letturaEsito').innerHTML = ''; $('letturaOk').hidden = true; $('letturaAnnulla').textContent = 'annulla';
  document.querySelectorAll('#passi li').forEach((li) => { li.className = ''; });
  $('lettura').showModal();
  const img = new Image(); img.src = src; await img.decode();
  const lato = Math.max(img.naturalWidth, img.naturalHeight), k = Math.min(1, 900 / lato);
  const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
  const x = cv.getContext('2d'); x.drawImage(img, 0, 0, cv.width, cv.height);
  const dati = x.getImageData(0, 0, cv.width, cv.height).data;
  if (lettore) lettore.terminate();
  lettore = new Worker(new URL('./lettore.js', import.meta.url), { type: 'module' });
  lettore.onmessage = (ev) => {
    const m = ev.data;
    if (m.passo) passoLettura(m.passo, m.testo);
    if (m.errore) { $('letturaEsito').innerHTML = `<p style="color:#b8412b">La lettura non è riuscita: ${m.errore.split('\n')[0]}</p>`; $('letturaAnnulla').textContent = 'chiudi'; console.error(m.errore); lettore.terminate(); lettore = null; }
    if (m.fatto) {
      passoLettura(5);
      const { cella, conta, fedelta: f, misure: mi } = m;
      const nota = `${conta.tratti} particelle (${conta.ginocchi ?? 0} nate da un ginocchio), un campo magnetico liscio in ${conta.esposizioni} esposizioni, ${conta.petali} petali, ${conta.dischi} dischi, ${conta.campiture} campiture (sagome impresse da un lampo). La fisica rifà l'immagine al ${Math.round(f.iou * 100)}%.`;
      const nuovo = { nome, nota, reticolo: { a: [mi.larghezza, 0], b: [0, mi.altezza] }, elementi: [{ nome: "l'immagine", nota: `la pagina della biblioteca che contiene l'immagine: un universo di soli ingredienti naturali. ${nota}`, posti: [{ pos: [mi.larghezza / 2, mi.altezza / 2], rot: 0 }], cella }] };
      // le tracce calcolate nel lettore: niente da rifare
      let r = 4; for (const t of m.tracce) for (const p of t.punti) if (p[2]) r = Math.max(r, Math.hypot(p[0] - mi.larghezza / 2, p[1] - mi.altezza / 2));
      memoria.set(chiave(cella), { tracce: m.tracce, raggio: r, sprite: new Map() });
      $('letturaEsito').innerHTML = `<p><span class="numero">${Math.round(f.iou * 100)}%</span> dell'immagine rifatto dalla fisica <span class="nota">(ritrova il ${Math.round(f.richiamo * 100)}% del disegno; il ${Math.round(f.precisione * 100)}% di ciò che traccia sta sul disegno)</span></p>
        <p class="nota">${m.preparata ? `Prima l'ho pulita: ${m.motivi.join(', ')}. ` : ''}${nota} Il seme è di ${conta.numeri} numeri. ${m.secondi.toFixed(0)} secondi.</p>`;
      $('letturaOk').hidden = false; $('letturaAnnulla').textContent = 'chiudi';
      $('letturaOk').onclick = () => { $('lettura').close(); ricorda(); immagine = { img, W: mi.larghezza, H: mi.altezza }; mostraOriginale = true; carica(nuovo, { tieniImmagine: true }); };
      lettore.terminate(); lettore = null;
    }
  };
  lettore.postMessage({ img: { larghezza: cv.width, altezza: cv.height, canali: 4, dati } });
}
$('letturaAnnulla').addEventListener('click', () => { if (lettore) { lettore.terminate(); lettore = null; } $('lettura').close(); });
$('fileImmagine').addEventListener('change', (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) daImmagine(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, '')); });

// ---------- il tempo: la fetta
const cursoreT = $('tempo');
let firmaScatti = '';
function aggiornaTempo() {
  const inPattern = vista === 'pattern';
  document.querySelector('.sotto').classList.toggle('spento', inPattern);
  if (inPattern) { $('otempo').textContent = 'il tempo: entra in un elemento'; return; }
  const m = tMax(), t = Math.min(tempo, m); cursoreT.value = t / m; $('otempo').textContent = `t ${fmt(t)} / ${fmt(m)}`;
  // le tacche sulla linea del tempo: dove scatta un interruttore
  const c = cel(), tacche = [];
  for (const [lista, col] of [[c.domini, null], [c.masse, FORZE.gravita.col]]) for (const o of lista) for (const e of o.interruttori || []) tacche.push({ t: e.t, acceso: e.acceso, col: col || (o.B ? FORZE.magnetico.col : FORZE.materia.col), chi: o.nome || 'un oggetto' });
  for (const [k, v] of Object.entries(leggi)) if (Array.isArray(v)) for (const e of v) tacche.push({ t: e.t, acceso: e.acceso, col: FORZE[k].col, chi: FORZE[k].art });
  const firma = JSON.stringify(tacche) + m;
  if (firma !== firmaScatti) { firmaScatti = firma; $('scatti').innerHTML = tacche.map((e) => `<i class="${e.acceso ? '' : 'spento'}" style="left:${(100 * e.t) / m}%;background:${rgb(e.col)}" title="t ${fmt(e.t)}: ${e.acceso ? 'si accende' : 'si spegne'} ${e.chi}"></i>`).join(''); }
  // gli interruttori mostrano lo stato di adesso
  document.querySelectorAll('[data-acceso]').forEach((el) => { const [tipo, i] = el.dataset.acceso.split(':'), o = { sorgente: c.sorgenti, dominio: c.domini, massa: c.masse }[tipo]?.[+i]; if (!o) return; const a = tipo === 'sorgente' ? accesoA(o, o.t0 ?? 0) : accesoOra(o); el.checked = a; el.closest('.ogg')?.classList.toggle('spento', !a); });
  document.querySelectorAll('[data-legge]').forEach((el) => { const a = leggeOra(el.dataset.legge); el.checked = a; el.closest('.scheda, .legge')?.classList.toggle('spenta', !a); });
  dove();
}
cursoreT.addEventListener('input', () => { if (vista === 'pattern') return; tempo = +cursoreT.value >= 0.999 ? Infinity : +cursoreT.value * tMax(); gioca = false; $('gioca').textContent = '▶'; salvaSezione(); aggiornaTempo(); disegna(); });
$('fetta').addEventListener('input', () => { fetta = +$('fetta').value * tMax(); $('ofetta').textContent = fetta ? `fetta ${fmt(fetta)}` : 'tutta la storia'; salvaSezione(); disegna(); });
$('gioca').addEventListener('click', () => { if (vista === 'pattern') return; gioca = !gioca; $('gioca').textContent = gioca ? '❚❚' : '▶'; if (gioca && tempo >= tMax()) tempo = 0; if (gioca) passo(); });
let ultimo = 0;
function passo(adesso = performance.now()) {
  if (!gioca) return;
  const m = tMax(); tempo = Math.min(m, (isFinite(tempo) ? tempo : 0) + (m / 8) * Math.min(0.05, (adesso - (ultimo || adesso)) / 1000)); ultimo = adesso;
  if (tempo >= m) { tempo = Infinity; gioca = false; $('gioca').textContent = '▶'; ultimo = 0; }
  aggiornaTempo(); disegna();
  if (gioca) requestAnimationFrame(passo); else ultimo = 0;
}

addEventListener('resize', disegna);
addEventListener('resize', () => vistaAtomi?.ridimensiona());
// il lavoro resta: si salva da solo e si ritrova alla prossima apertura
const CHIAVE = 'stateyour:camera';
try { const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); if (s && Array.isArray(s.elementi) && s.elementi.length && s.reticolo) comp = s; } catch { /* un salvataggio rotto si ignora */ }
let salvato = '';
setInterval(() => { const j = JSON.stringify(comp); if (j !== salvato) { try { localStorage.setItem(CHIAVE, j); salvato = j; } catch { /* spazio finito */ } } }, 1500);
adattaPattern(); aggiornaVista();
// quando una superficie calcolata in secondo piano è pronta: si ridisegna, e il pannello la mostra
quandoSuperficiePronta(() => { if (vista === 'cosmo') { disegna(); mostraPannello(); } });
window.__camera = {
  get comp() { return comp; }, get tracce() { return tracce; }, get vista() { return vista; }, get camMappa() { return camMappa; }, pat,
  entra, carica, seleziona: (s) => { sel = s; disegna(); mostraPannello(); }, sonda: (s) => { sonda = s; disegna(); },
  vai: (v) => { vista = v; aggiornaVista(); }, tempo: (t) => { tempo = t; aggiornaTempo(); disegna(); },
};
