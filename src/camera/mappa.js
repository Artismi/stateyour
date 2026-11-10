// mappa.js — lo zoom continuo, dal cosmo alle particelle.
//
// Quattro livelli, uno dentro l'altro; si passa dall'uno all'altro zoomando:
//   0 il cosmo (il toro: lo spazio si richiude) con la rete e le galassie
//   1 una galassia: le stelle, il buco nero col suo getto, i resti di supernova
//   2 un sistema: la stella e i pianeti
//   3 un pianeta: il suo anello, la magnetosfera, le regioni (gli universi della camera)
// Dentro una regione si entra nella camera (l'universo, la finestra, il pattern).
// Ogni livello ha le sue coordinate; la camera della mappa è { livello, via, cx, cy, z }
// (via = l'indirizzo dei livelli sopra), e passare di livello non muove niente sullo schermo.

import { cosmo, galassia, sistema, pianeta, regione, magnetosfera, fascia, metriPerUnita, RAGGIO_SISTEMA, LATO_REGIONE, numeroDi } from './cosmo.js';
import { fmtLunghezza } from './unita.js';
import { nebbiaPianeta, ACCELERA } from './nebbia.js';
import { superficiePianeta, immagineSuperficie } from './geologia.js';
import { simulaMondo } from './mondo.js';

const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const minimo = (W, H) => Math.min(W, H);

// ---------- il genitore e i figli di ogni livello
function figli(cam) {
  const v = cam.via;
  if (cam.livello === 0) return cosmo(v.cosmo).galassie.map((G) => ({ pos: G.pos, scala: G.r, raggio: 1.05, via: { ...v, galassia: G.id }, dato: G }));
  if (cam.livello === 1) return galassia(v.cosmo, v.galassia).stelle.map((S) => ({ pos: S.pos, scala: RAGGIO_SISTEMA, raggio: 1.2, via: { ...v, stella: S.id }, dato: S }));
  if (cam.livello === 2) return sistema(v.cosmo, v.galassia, v.stella).pianeti.map((P) => ({ pos: P.pos, scala: P.r, raggio: 2.8, via: { ...v, pianeta: P.id }, dato: P }));
  return [];
}
// dove sta il livello dentro il genitore (posizione e scala)
function nelGenitore(cam) {
  const v = cam.via;
  if (cam.livello === 1) { const G = cosmo(v.cosmo).galassie[v.galassia]; return { pos: G.pos, scala: G.r }; }
  if (cam.livello === 2) { const S = galassia(v.cosmo, v.galassia).stelle[v.stella]; return { pos: S.pos, scala: RAGGIO_SISTEMA }; }
  if (cam.livello === 3) { const P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta]; return { pos: P.pos, scala: P.r }; }
  return null;
}

// la camera che guarda una regione (per uscire dalla camera verso la mappa)
export function camSuRegione(a, W, H) {
  const R = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta).regioni[a.regione];
  return { livello: 3, via: { cosmo: a.cosmo, galassia: a.galassia, stella: a.stella, pianeta: a.pianeta }, cx: R.pos[0] * 0.45, cy: R.pos[1] * 0.45, z: minimo(W, H) / 6.2, regione: a.regione };
}

// ---------- lo zoom: k > 1 avvicina, intorno al punto (fx, fy) dello schermo.
// Restituisce { entra: indirizzo } quando si entra in una regione.
export function zoomMappa(cam, fx, fy, k, W, H) {
  const ax = cam.cx + (fx - W / 2) / cam.z, ay = cam.cy + (fy - H / 2) / cam.z;
  cam.z *= k; cam.cx = ax - (fx - W / 2) / cam.z; cam.cy = ay - (fy - H / 2) / cam.z;
  return passaggi(cam, W, H);
}
function passaggi(cam, W, H) {
  const m = minimo(W, H);
  for (let giro = 0; giro < 4; giro++) {
    if (cam.livello === 0) { cam.cx = ((cam.cx % 1) + 1) % 1; cam.cy = ((cam.cy % 1) + 1) % 1; cam.z = Math.max(cam.z, m / 1.25); }
    // dentro: un figlio che riempie lo schermo e contiene il centro
    if (cam.livello < 3) {
      const soglia = cam.livello === 2 ? 0.42 * m : 0.4 * m;
      let scelto = null, dmin = Infinity;
      for (const f of figli(cam)) {
        if (f.scala * cam.z * f.raggio < soglia) continue;
        let dx = cam.cx - f.pos[0], dy = cam.cy - f.pos[1];
        if (cam.livello === 0) { dx -= Math.round(dx); dy -= Math.round(dy); }
        const d = Math.hypot(dx, dy) / f.scala; if (d < f.raggio * 1.1 && d < dmin) { dmin = d; scelto = { f, dx, dy }; }
      }
      if (scelto) { const { f, dx, dy } = scelto; cam.livello++; cam.via = f.via; cam.cx = dx / f.scala; cam.cy = dy / f.scala; cam.z *= f.scala; continue; }
      // nel vuoto tra le cose non si scende oltre; avvicinandosi, lo sguardo scivola
      // verso la cosa più vicina al centro, così zoomare porta sempre da qualche parte
      const tetto = cam.livello === 0 ? m / 0.002 : cam.livello === 1 ? m / (RAGGIO_SISTEMA * 0.8) : m / 0.02;
      const vicino = (() => { let b = null, d = Infinity; for (const f of figli(cam)) { let dx = f.pos[0] - cam.cx, dy = f.pos[1] - cam.cy; if (cam.livello === 0) { dx -= Math.round(dx); dy -= Math.round(dy); } const e = Math.hypot(dx, dy); if (e < d) { d = e; b = { f, dx, dy }; } } return b; })();
      if (vicino) { const f = vicino.f, prossimita = Math.min(1, (f.scala * cam.z * f.raggio) / soglia); if (prossimita > 0.3) { const k = 0.25 * prossimita; cam.cx += vicino.dx * k; cam.cy += vicino.dy * k; } }
      cam.z = Math.min(cam.z, tetto);
    } else {
      // una regione grande quanto lo schermo, al centro: si entra
      const P = pianeta(cam.via.cosmo, cam.via.galassia, cam.via.stella, cam.via.pianeta);
      if (LATO_REGIONE * cam.z > 0.35 * m) { // vicino alle regioni: lo sguardo scivola verso la più vicina
        let b = null, d = Infinity; for (const R of P.regioni) { const e = Math.hypot(R.pos[0] - cam.cx, R.pos[1] - cam.cy); if (e < d) { d = e; b = R; } }
        if (b) { const k = 0.25 * Math.min(1, (LATO_REGIONE * cam.z) / (0.9 * m)); cam.cx += (b.pos[0] - cam.cx) * k; cam.cy += (b.pos[1] - cam.cy) * k; }
      }
      for (const R of P.regioni) {
        if (LATO_REGIONE * cam.z < 0.9 * m) break;
        if (Math.abs(cam.cx - R.pos[0]) < LATO_REGIONE / 2 && Math.abs(cam.cy - R.pos[1]) < LATO_REGIONE / 2) return { entra: { ...cam.via, regione: R.id } };
      }
      cam.z = Math.min(cam.z, (1.1 * m) / LATO_REGIONE);
    }
    // fuori: il livello è diventato piccolo sullo schermo
    const g = nelGenitore(cam);
    if (g && cam.z * (cam.livello === 3 ? 6 : cam.livello === 2 ? 1.3 : 1.1) < 0.3 * m) {
      cam.cx = g.pos[0] + cam.cx * g.scala; cam.cy = g.pos[1] + cam.cy * g.scala; cam.z /= g.scala; cam.livello--;
      const v = { ...cam.via }; delete v[['galassia', 'stella', 'pianeta'][cam.livello]]; cam.via = v;
      continue;
    }
    break;
  }
  return null;
}

// ---------- che cosa c'è sotto il cursore
export function colpisciMappa(cam, sx, sy, W, H) {
  const x = cam.cx + (sx - W / 2) / cam.z, y = cam.cy + (sy - H / 2) / cam.z, px = 9 / cam.z;
  if (cam.livello === 3) {
    const P = pianeta(cam.via.cosmo, cam.via.galassia, cam.via.stella, cam.via.pianeta);
    for (const R of P.regioni) if (Math.abs(x - R.pos[0]) < LATO_REGIONE / 2 && Math.abs(y - R.pos[1]) < LATO_REGIONE / 2) { const a = { ...cam.via, regione: R.id }; return { tipo: 'regione', pos: R.pos, scala: LATO_REGIONE / 2, testo: `regione ${R.id + 1}${R.nellAnello ? ", nell'anello" : ''} · universo n. ${numeroDi(a)} · clic per entrare`, via: a }; }
    if (Math.hypot(x, y) < 1) return { tipo: 'pianeta', pos: [0, 0], scala: 1, testo: descriviPianeta(P.P) };
    return null;
  }
  let migliore = null, dm = Infinity;
  for (const f of figli(cam)) {
    let dx = x - f.pos[0], dy = y - f.pos[1];
    if (cam.livello === 0) { dx -= Math.round(dx); dy -= Math.round(dy); }
    const d = Math.hypot(dx, dy), r = Math.max(px, f.scala * (cam.livello === 2 ? 2.5 : 1));
    if (d < r && d < dm) { dm = d; migliore = f; }
  }
  if (cam.livello === 1 && Math.hypot(x, y) < Math.max(px, 0.02) && (!migliore || dm > 0.01)) return { tipo: 'buco', pos: [0, 0], scala: 0.02, testo: `il buco nero al centro della galassia${galassia(cam.via.cosmo, cam.via.galassia).G.attivita > 0.3 ? ', attivo: il suo getto lancia raggi cosmici' : ''}` };
  if (!migliore) return null;
  const d = migliore.dato;
  const testo = cam.livello === 0 ? `galassia ${d.id + 1} · ${d.tipo}${d.attivita > 0.3 ? ', con il buco nero attivo' : ''} · clic per avvicinarti`
    : cam.livello === 1 ? (d.stato === 'in vita' || d.stato === 'gigante rossa'
      ? `stella ${d.id + 1} · ${d.stato === 'gigante rossa' ? 'gigante rossa, alla fine' : d.T > 9000 ? 'azzurra' : d.T > 6500 ? 'bianca' : d.T > 5000 ? 'gialla' : d.T > 3800 ? 'arancione' : 'rossa'}, ${d.massa.toFixed(1)} masse solari, ${Math.round(d.eta / 1e6).toLocaleString('it-IT')} milioni di anni, metalli ${d.Z.toFixed(2)}× il Sole · clic per i suoi pianeti`
      : `stella ${d.id + 1} · ${d.stato}, ${d.massa.toFixed(2)} masse solari (nata con ${d.massaNascita.toFixed(1)}), raggio ${fmtLunghezza(d.raggioM)}${d.B ? `, campo ${d.B.toExponential(0)} tesla` : ''}, morta da ${Math.round(d.morta / 1e6).toLocaleString('it-IT')} milioni di anni${d.stato === 'nana bianca' ? ' · clic per i pianeti sopravvissuti' : ' · nessun pianeta: la supernova li ha dispersi'}`)
    : descriviPianeta(d) + ' · clic per avvicinarti';
  return { tipo: ['galassia', 'stella', 'pianeta'][cam.livello], pos: migliore.pos, scala: migliore.scala * migliore.raggio, testo };
}
const descriviClima = (c) => !c ? '' : ` · ${Math.round(c.T - 273.15)} °C${isFinite(c.pressione) ? `, ${c.pressione < 1 ? 'senza atmosfera' : `${(c.pressione / 1e5).toPrecision(2)} bar`}` : ''}, acqua ${c.acqua}`;
const descriviPianeta = (P) => `pianeta ${P.id + 1}${descriviClima(P.clima)} · ${P.tipo}${P.anelli ? ', con anelli' : ''}${P.lune ? `, ${P.lune} ${P.lune === 1 ? 'luna' : 'lune'}` : ''}, raggio ${fmtLunghezza(P.raggioM)}, campo ${Math.round(P.B0 * 1e9).toLocaleString('it-IT')} nT, fatto di ${Object.entries(P.composizione || {}).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`;

// la camera che va verso un oggetto: un passo di volo (da chiamare a ogni fotogramma)
export function volaVerso(cam, obiettivo, W, H) {
  const m = minimo(W, H), zFin = (0.5 * m) / obiettivo.scala;
  let dx = obiettivo.pos[0] - cam.cx, dy = obiettivo.pos[1] - cam.cy;
  if (cam.livello === 0) { dx -= Math.round(dx); dy -= Math.round(dy); }
  cam.cx += dx * 0.18; cam.cy += dy * 0.18;
  const k = Math.exp(Math.max(-0.25, Math.min(0.25, Math.log(zFin / cam.z) * 0.18)));
  return zoomMappa(cam, W / 2, H / 2, k, W, H);
}

// la riga «dove sei»
export function percorso(cam) {
  const v = cam.via, out = [`cosmo ${v.cosmo}`];
  if (cam.livello >= 1) out.push(`galassia ${v.galassia + 1}`);
  if (cam.livello >= 2) out.push(`stella ${v.stella + 1}`);
  if (cam.livello >= 3) out.push(`pianeta ${v.pianeta + 1}`);
  return out;
}

// ---------- il disegno
const fondoStelle = (() => { const p = []; let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 260; i++) p.push([r(), r(), r()]); return p; })();
const reteImg = new Map();
function immagineRete(n) {
  if (reteImg.has(n)) return reteImg.get(n);
  const C = cosmo(n), N = C.N, cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const x = cv.getContext('2d'), im = x.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = Math.max(0, (C.griglia[i] - C.media) / C.sigma + 0.6), t = Math.min(1, v / 3);
    im.data[4 * i] = 20 + 90 * t; im.data[4 * i + 1] = 18 + 40 * t * t; im.data[4 * i + 2] = 40 + 110 * t; im.data[4 * i + 3] = 255;
  }
  x.putImageData(im, 0, 0); reteImg.set(n, cv); return cv;
}
const anteprime = new Map();
function anteprimaRegione(a) {
  const k = JSON.stringify(a); if (anteprime.has(k)) return anteprime.get(k);
  const u = regione(a), tr = simulaMondo(u.cella); anteprime.set(k, tr); if (anteprime.size > 8) anteprime.delete(anteprime.keys().next().value);
  return tr;
}

export function disegnaMappa(ctx, W, H, cam, { sopra = null, evidenzia = null, dpr = 1 } = {}) {
  const z = cam.z, X = (x) => W / 2 + (x - cam.cx) * z, Y = (y) => H / 2 + (y - cam.cy) * z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
  // le stelle lontane (sfondo, fisso)
  for (const [u, v, b] of fondoStelle) { ctx.fillStyle = `rgba(220,225,255,${0.12 + 0.35 * b})`; ctx.fillRect(u * W, v * H, dpr * (b > 0.9 ? 1.5 : 1), dpr * (b > 0.9 ? 1.5 : 1)); }
  const v = cam.via;
  if (cam.livello === 0) {
    const C = cosmo(v.cosmo), img = immagineRete(v.cosmo);
    // la rete cosmica, ripetuta: lo spazio si richiude
    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.85;
    const i0 = Math.floor(cam.cx - W / 2 / z) - 1, i1 = Math.floor(cam.cx + W / 2 / z) + 1, j0 = Math.floor(cam.cy - H / 2 / z) - 1, j1 = Math.floor(cam.cy + H / 2 / z) + 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) ctx.drawImage(img, X(i), Y(j), z, z);
    ctx.globalAlpha = 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (const G of C.galassie) {
      const x = X(G.pos[0] + i), y = Y(G.pos[1] + j), r = G.r * z;
      if (x < -r - 20 || y < -r - 20 || x > W + r + 20 || y > H + r + 20) continue;
      disegnaGalassiaLontana(ctx, G, x, y, r, dpr, v.cosmo);
    }
  } else if (cam.livello === 1) {
    const Gx = galassia(v.cosmo, v.galassia);
    disegnaGalassia(ctx, Gx, X, Y, z, dpr);
    // le sorgenti dei raggi cosmici
    for (const s of Gx.sorgenti) {
      if (s.tipo === 'supernova') { ctx.strokeStyle = 'rgba(255,140,170,0.55)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(X(s.pos[0]), Y(s.pos[1]), Math.max(2 * dpr, s.r * z), 0, 7); ctx.stroke(); }
      if (s.tipo === 'pulsar') { ctx.strokeStyle = 'rgba(150,210,255,0.9)'; ctx.lineWidth = dpr; const x = X(s.pos[0]), y = Y(s.pos[1]), l = 4 * dpr; ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke(); }
    }
    if (evidenzia?.stella != null && evidenzia.galassia === v.galassia) {
      const S = Gx.stelle[evidenzia.stella];
      for (const s of Gx.sorgenti) if (evidenzia.sorgenti?.some((n) => n.startsWith(s.nome))) { ctx.strokeStyle = 'rgba(255,190,90,0.7)'; ctx.setLineDash([5 * dpr, 4 * dpr]); ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(X(s.pos[0]), Y(s.pos[1])); ctx.lineTo(X(S.pos[0]), Y(S.pos[1])); ctx.stroke(); ctx.setLineDash([]); scrivi(ctx, s.nome, X(s.pos[0]) + 6 * dpr, Y(s.pos[1]) - 6 * dpr, 'rgba(255,200,120,0.9)', dpr); }
      ctx.strokeStyle = 'rgba(255,200,120,0.95)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(X(S.pos[0]), Y(S.pos[1]), 7 * dpr, 0, 7); ctx.stroke();
    }
  } else if (cam.livello === 2) {
    disegnaSistema(ctx, sistema(v.cosmo, v.galassia, v.stella), X, Y, z, dpr, v);
  } else {
    disegnaPianeta(ctx, v, X, Y, z, dpr, evidenzia);
  }
  // il metro: le distanze vere
  {
    const mpp = metriPerUnita(cam.livello, v) / z, voluto = 140 * dpr * mpp, e = Math.pow(10, Math.floor(Math.log10(voluto))), passo = [1, 2, 5, 10].map((k) => k * e).filter((x) => x <= voluto).pop() || e;
    const L = passo / mpp, x0 = 18 * dpr, y0 = H - 22 * dpr;
    ctx.strokeStyle = 'rgba(235,230,215,0.85)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.moveTo(x0, y0 - 5 * dpr); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0); ctx.lineTo(x0 + L, y0 - 5 * dpr); ctx.stroke();
    ctx.font = `${12 * dpr}px ui-monospace, monospace`; ctx.fillStyle = 'rgba(235,230,215,0.9)'; ctx.fillText(fmtLunghezza(passo), x0 + L + 8 * dpr, y0); if (cam.livello === 3) ctx.fillText(`il tempo scorre ${ACCELERA} volte più in fretta`, x0, y0 - 20 * dpr);
  }
  if (sopra) {
    ctx.strokeStyle = 'rgba(255,200,120,0.9)'; ctx.lineWidth = 1.2 * dpr;
    let px = sopra.pos[0], py = sopra.pos[1];
    if (cam.livello === 0) { px = cam.cx + ((px - cam.cx + 0.5) % 1 + 1) % 1 - 0.5; py = cam.cy + ((py - cam.cy + 0.5) % 1 + 1) % 1 - 0.5; }
    const r = Math.max(8 * dpr, sopra.scala * z * 1.05);
    if (sopra.tipo === 'regione') ctx.strokeRect(X(px) - r, Y(py) - r, 2 * r, 2 * r); else { ctx.beginPath(); ctx.arc(X(px), Y(py), r, 0, 7); ctx.stroke(); }
    scrivi(ctx, sopra.testo, X(px) + r + 6 * dpr, Y(py), 'rgba(255,215,150,0.95)', dpr);
  }
}
function scrivi(ctx, t, x, y, c, dpr) { ctx.font = `${12 * dpr}px ui-monospace, monospace`; ctx.fillStyle = 'rgba(5,6,11,0.7)'; const w = ctx.measureText(t).width; ctx.fillRect(x - 3 * dpr, y - 12 * dpr, w + 6 * dpr, 16 * dpr); ctx.fillStyle = c; ctx.fillText(t, x, y); }
function alone(ctx, x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgb(c, a)); g.addColorStop(1, rgb(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

function disegnaGalassiaLontana(ctx, G, x, y, r, dpr, n) {
  if (r < 30 * dpr) { alone(ctx, x, y, Math.max(3 * dpr, r * 1.4), G.tinta, 0.8); ctx.fillStyle = 'rgba(255,250,240,0.95)'; ctx.fillRect(x - dpr / 2, y - dpr / 2, dpr, dpr); return; }
  // da vicino: le sue stelle vere (le stesse che si vedono entrando)
  const Gx = galassia(n, G.id);
  alone(ctx, x, y, r * 0.5, G.tinta, 0.55);
  const passo = r > 200 * dpr ? 1 : r > 90 * dpr ? 2 : 4;
  for (let i = 0; i < Gx.stelle.length; i += passo) { const s = Gx.stelle[i]; ctx.fillStyle = rgb(s.colore, 0.75); ctx.fillRect(x + s.pos[0] * r, y + s.pos[1] * r, dpr, dpr); }
}
function disegnaGalassia(ctx, Gx, X, Y, z, dpr) {
  const G = Gx.G;
  alone(ctx, X(0), Y(0), 0.45 * z, G.tinta, 0.35);
  const sistemaPx = RAGGIO_SISTEMA * z;
  for (const s of Gx.stelle) {
    const x = X(s.pos[0]), y = Y(s.pos[1]); if (x < -50 || y < -50 || x > ctx.canvas.width + 50 || y > ctx.canvas.height + 50) continue;
    const b = Math.min(2.2, 0.6 + Math.cbrt(s.massa) * 0.5) * dpr;
    if (sistemaPx > 25 * dpr) { alone(ctx, x, y, Math.max(4 * dpr, sistemaPx * 0.08), s.colore, 0.6); }
    ctx.fillStyle = rgb(s.colore, 0.95); ctx.fillRect(x - b / 2, y - b / 2, b, b);
    if (sistemaPx > 40 * dpr) { // si intravedono le orbite dei pianeti
      const n = Gx.G; void n;
    }
  }
  // il buco nero: il disco e il getto
  const rb = Math.max(2.5 * dpr, 0.012 * z), a = G.getto;
  if (G.attivita > 0.15) { ctx.strokeStyle = `rgba(150,190,255,${0.25 + 0.5 * G.attivita})`; ctx.lineWidth = Math.max(dpr, 0.004 * z); for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(s * Math.cos(a) * 0.6), Y(s * Math.sin(a) * 0.6)); ctx.stroke(); } }
  alone(ctx, X(0), Y(0), rb * 3, [255, 190, 120], 0.8);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(X(0), Y(0), rb, 0, 7); ctx.fill();
}
function disegnaSistema(ctx, S, X, Y, z, dpr, v) {
  const st = S.stella;
  alone(ctx, X(0), Y(0), Math.max(10 * dpr, st.r * z * 4), st.colore, 0.9);
  ctx.fillStyle = rgb(st.colore); ctx.beginPath(); ctx.arc(X(0), Y(0), Math.max(2 * dpr, st.r * z), 0, 7); ctx.fill();
  for (const P of S.pianeti) {
    ctx.strokeStyle = 'rgba(200,210,255,0.16)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(X(0), Y(0), P.a * z, 0, 7); ctx.stroke();
    disegnaCorpo(ctx, P, X(P.pos[0]), Y(P.pos[1]), Math.max(1.5 * dpr, P.r * z), st, v, dpr, P.pos);
  }
}
function disegnaCorpo(ctx, P, x, y, r, st, v, dpr, pos) {
  // il pianeta, illuminato dalla sua stella
  const luce = Math.atan2(-pos[1], -pos[0]);
  if (P.anelli && r > 3 * dpr) { ctx.strokeStyle = rgb(P.colore, 0.45); ctx.lineWidth = Math.max(dpr, r * 0.5); ctx.beginPath(); ctx.arc(x, y, r * 2, 0, 7); ctx.stroke(); }
  const g = ctx.createRadialGradient(x + Math.cos(luce) * r * 0.5, y + Math.sin(luce) * r * 0.5, r * 0.1, x, y, r);
  g.addColorStop(0, rgb(P.colore.map((c) => Math.min(255, c + 40)))); g.addColorStop(1, rgb(P.colore.map((c) => c * 0.25)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
function disegnaPianeta(ctx, v, X, Y, z, dpr, evidenzia) {
  const Pl = pianeta(v.cosmo, v.galassia, v.stella, v.pianeta), P = Pl.P, S = sistema(v.cosmo, v.galassia, v.stella);
  // la magnetosfera: linee di campo, come quelle di un dipolo
  ctx.strokeStyle = `rgba(110,150,255,${0.08 + 0.18 * P.campo})`; ctx.lineWidth = dpr;
  for (const L of [1.6, 2.2, 3, 4]) { ctx.beginPath(); for (let t = 0; t <= 64; t++) { const th = (t / 64) * 2 * Math.PI, r = L * Math.cos(th) ** 2; const x = X(r * Math.cos(th)), y = Y(r * Math.sin(th)); t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  // l'anello: le sue fasce, disegnate con la stessa densità che usa la fisica delle regioni
  if (Pl.anello) for (let r = Pl.anello[0]; r < Pl.anello[1]; r += 0.01) { const d = Pl.densitaAnello(r); ctx.strokeStyle = rgb(P.colore, Math.min(0.25, 0.12 * d)); ctx.lineWidth = Math.max(1, 0.011 * z); ctx.beginPath(); ctx.arc(X(0), Y(0), r * z, 0, 7); ctx.stroke(); }
  // LA NEBBIA: la fascia e l'anello come particelle che scorrono (lo stesso campione, sempre). Da
  // lontano sono puntini; quando il giro di una particella diventa abbastanza grande da vedersi,
  // il puntino diventa il suo cerchio vero.
  const neb = nebbiaPianeta(v.cosmo, v.galassia, v.stella, v.pianeta), t = (performance.now() / 1000) * ACCELERA;
  for (const g of neb.anello) { const f = g.fi + g.omega * t; ctx.fillStyle = rgb(P.colore, 0.55); ctx.fillRect(X(g.r * Math.cos(f)), Y(g.r * Math.sin(f)), dpr, dpr); }
  for (const q of neb.fascia) {
    const f = q.fi + q.omega * t, cx = q.r * Math.cos(f), cy = q.r * Math.sin(f), R = q.rg * z, x = X(cx), y = Y(cy);
    if (x < -R - 2 || y < -R - 2 || x > ctx.canvas.width + R + 2 || y > ctx.canvas.height + R + 2) continue;
    const col = q.elettrone ? '150,210,255' : '200,170,255', cerchio = Math.min(1, Math.max(0, (R - 2 * dpr) / (4 * dpr)));
    if (cerchio < 1) { ctx.fillStyle = `rgba(${col},${0.7 * (1 - cerchio)})`; ctx.fillRect(x, y, 1.3 * dpr, 1.3 * dpr); }
    if (cerchio > 0) { ctx.strokeStyle = `rgba(${col},${0.5 * cerchio})`; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(x + R, y, R, 0, 7); ctx.stroke(); }
  }
  // i raggi cosmici nel campo del pianeta: le orbite di Størmer, calcolate davvero
  ctx.strokeStyle = 'rgba(255,196,120,0.5)'; ctx.lineWidth = dpr;
  for (const t of magnetosfera(v.cosmo, v.galassia, v.stella, v.pianeta)) { ctx.beginPath(); t.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke(); }
  disegnaCorpo(ctx, P, X(0), Y(0), z, S.stella, v, dpr, P.pos);
  // la sua superficie, vista da sopra l'equatore: la stessa mappa del pannello, avvolta sulla sfera
  const disco = discoPianeta(v, P); if (disco) { ctx.save(); ctx.beginPath(); ctx.arc(X(0), Y(0), z, 0, 7); ctx.clip(); ctx.drawImage(disco, X(0) - z, Y(0) - z, 2 * z, 2 * z); ctx.restore(); }
  // la direzione della stella
  const ds = Math.atan2(-P.pos[1], -P.pos[0]); alone(ctx, X(Math.cos(ds) * 6), Y(Math.sin(ds) * 6), 40 * dpr, S.stella.colore, 0.25);
  // le regioni: gli universi della camera
  const lato = LATO_REGIONE * z;
  for (const R of Pl.regioni) {
    const x = X(R.pos[0]) - lato / 2, y = Y(R.pos[1]) - lato / 2;
    const qui = evidenzia?.regione === R.id && evidenzia.pianeta === v.pianeta && evidenzia.stella === v.stella && evidenzia.galassia === v.galassia;
    ctx.strokeStyle = qui ? 'rgba(255,190,90,0.95)' : 'rgba(240,235,220,0.35)'; ctx.lineWidth = (qui ? 1.6 : 1) * dpr; ctx.strokeRect(x, y, lato, lato);
    // da vicino si vedono le tracce: è l'universo della camera
    if (lato > 120 * dpr && x < ctx.canvas.width && y < ctx.canvas.height && x + lato > 0 && y + lato > 0) {
      const tr = anteprimaRegione({ ...v, regione: R.id }), k = lato / 1000;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, lato, lato); ctx.clip();
      // nessun foglio sopra: è lo stesso spazio, visto con più dettaglio (stessi colori del resto della mappa)
      ctx.strokeStyle = `rgba(200,190,255,${Math.min(0.75, (lato - 120 * dpr) / (250 * dpr))})`; ctx.lineWidth = Math.max(0.6 * dpr, 0.8 * k);
      for (const t of tr) { if (t.sagoma) continue; ctx.beginPath(); let su = false; for (const p of t.punti) { if (!p[2]) { su = false; continue; } const px = x + p[0] * k, py = y + p[1] * k; su ? ctx.lineTo(px, py) : ctx.moveTo(px, py); su = true; } ctx.stroke(); }
      ctx.restore();
    }
  }
  void evidenzia;
}

// la superficie di un pianeta solido proiettata sul disco (proiezione ortografica), con la luce della stella
const dischi = new Map();
export function discoPianeta(v, P) {
  if (P.tipo === 'gassoso' || !P.interno) return null;
  const k = JSON.stringify(v); if (dischi.has(k)) return dischi.get(k);
  const sf = superficiePianeta(k, P, P.interno, 7 + v.stella * 31 + v.pianeta), px = immagineSuperficie(sf, P.clima.T), N = 256;
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const c = cv.getContext('2d'), im = c.createImageData(N, N), luce = Math.atan2(-P.pos[1], -P.pos[0]), lx = Math.cos(luce), ly = Math.sin(luce);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N * 2 - 1, w = (y + 0.5) / N * 2 - 1, r2 = u * u + w * w; if (r2 > 1) continue;
    const zz = Math.sqrt(1 - r2), lat = Math.asin(-w), lon = Math.atan2(u, zz);
    const i = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * sf.W) % sf.W, j = Math.min(sf.H - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * sf.H)), q = (j * sf.W + i) * 4;
    const ill = Math.max(0.12, 0.25 + 0.75 * (u * lx + w * ly + 0.3 * zz)), o = (y * N + x) * 4;
    im.data[o] = px[q] * ill; im.data[o + 1] = px[q + 1] * ill; im.data[o + 2] = px[q + 2] * ill; im.data[o + 3] = 255;
  }
  c.putImageData(im, 0, 0); dischi.set(k, cv); if (dischi.size > 6) dischi.delete(dischi.keys().next().value);
  return cv;
}
