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

import { cosmo, galassia, sistema, pianeta, regione, magnetosfera, fascia, metriPerUnita, RAGGIO_SISTEMA, LATO_REGIONE, numeroDi, cosmoBase, ramiCosmo, semeEvento } from './cosmo.js';
import { fmtLunghezza } from './unita.js';
import { nebbiaPianeta, ACCELERA } from './nebbia.js';
import { cristallizza, fioccoDiNeve, sedimento, immagine as immagineRoccia, GRANITO, BASALTO } from './rocce.js';
import { superficiePianeta, immagineSuperficie, climaSuperficie, erosione, tessera } from './geologia.js';
import { simulaMondo } from './mondo.js';

const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const minimo = (W, H) => Math.min(W, H);

// ---------- il genitore e i figli di ogni livello
function figli(cam) {
  const v = cam.via;
  if (cam.livello === 0) return cosmo(v.cosmo).galassie.map((G) => ({ pos: G.pos, scala: G.r, raggio: 1.05, via: { ...v, galassia: G.id }, dato: G }));
  if (cam.livello === 1) return galassia(v.cosmo, v.galassia).stelle.map((S) => ({ pos: S.pos, scala: RAGGIO_SISTEMA, raggio: 1.2, via: { ...v, stella: S.id }, dato: S }));
  if (cam.livello === 2) return sistema(v.cosmo, v.galassia, v.stella).pianeti.map((P) => ({ pos: P.pos, scala: P.r, raggio: Math.max(2.8, 1.1 * estensioneLune(P)), via: { ...v, pianeta: P.id }, dato: P }));
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
  const m = minimo(W, H);
  // LA ROCCIA (livello 5): in fondo alla superficie, avvicinandosi ancora, si guarda di che cosa è fatto quel punto
  if (cam.livello === 4 && cam.z > 6e6) { cam.roccia = { cx: cam.cx, cy: cam.cy }; cam.livello = 5; cam.cx = 0.5; cam.cy = 0.5; cam.z = 0.8 * m; return null; }
  if (cam.livello === 5) { if (cam.z < 0.45 * m) { cam.livello = 4; cam.cx = cam.roccia.cx; cam.cy = cam.roccia.cy; cam.z = 5.5e6; return null; } cam.z = Math.min(cam.z, 12 * m); return null; }
  return passaggi(cam, W, H);
}
// LE LUNE: fin dove arrivano (in raggi del pianeta), e dove sta ognuna adesso lungo la sua orbita
// (per il passaggio di livello si conta fino a 70 raggi: le lune lontanissime, catturate, restano fuori dallo schermo)
const estensioneLune = (P) => Math.min(70, (P?.lune || []).reduce((m, L) => Math.max(m, (L.aM * (1 + (L.eccentricita || 0))) / P.raggioM), 0));
function posLuna(v, P, L, t) {
  const a = L.aM / P.raggioM, e = L.eccentricita || 0, f0 = (semeEvento('fase luna', v.cosmo, v.galassia, v.stella, v.pianeta, L.id) / 4294967296) * 2 * Math.PI;
  const f = f0 + ((L.retrograda ? -1 : 1) * 2 * Math.PI * t) / L.periodo, r = (a * (1 - e * e)) / (1 + e * Math.cos(f));
  return [r * Math.cos(f), r * Math.sin(f), a, e];
}
const tempoMappa = () => ((typeof performance !== 'undefined' ? performance.now() : 0) / 1000) * ACCELERA;
function descriviLuna(P, L) {
  const nata = { disco: 'nata dal disco attorno al pianeta', urto: 'nata da un grande urto', cattura: 'un corpo catturato' }[L.origine] || L.origine;
  const giorni = L.periodo / 86400, lun = L.massaKg / 7.35e22;
  return `luna ${L.id + 1}: ${nata}${L.retrograda ? ', gira al contrario' : ''} · raggio ${Math.round(L.raggioM / 1000)} km${L.forma && !L.forma.rotonda ? ' (irregolare)' : ''}, ${lun >= 0.01 ? `${lun.toPrecision(2)} Lune` : `${L.massaKg.toExponential(1)} kg`} · a ${Math.round(L.aM / 1000).toLocaleString('it')} km, un giro in ${giorni < 3 ? `${(giorni * 24).toFixed(1)} ore` : `${giorni.toFixed(1)} giorni`}${L.bloccata ? ' · mostra sempre la stessa faccia' : ''} · ${L.stato}${L.risonanza ? ` · in risonanza ${L.risonanza}` : ''}`;
}
function passaggi(cam, W, H) {
  const m = minimo(W, H);
  for (let giro = 0; giro < 4; giro++) {
    // LA SUPERFICIE (livello 4): la mappa del pianeta, x = longitudine (0..1, si richiude), y = latitudine (0..0,5)
    if (cam.livello === 4) {
      cam.cx = ((cam.cx % 1) + 1) % 1; cam.cy = Math.max(0, Math.min(0.5, cam.cy)); cam.z = Math.min(cam.z, 6e6);
      if (cam.z < 0.9 * m) { cam.livello = 3; cam.cx = 0; cam.cy = 0; cam.z /= 2 * Math.PI; continue; }
      break;
    }
    if (cam.livello === 3 && cam.z > 0.8 * m && Math.hypot(cam.cx, cam.cy) < 0.95) {
      const P = sistema(cam.via.cosmo, cam.via.galassia, cam.via.stella).pianeti[cam.via.pianeta];
      if (P.tipo !== 'gassoso' && P.interno) { // sopra il disco di un pianeta solido: si scende sulla superficie, nel punto che si guardava
        const u = cam.cx, w = cam.cy / (1 - (P.schiacciamento || 0)), zz = Math.sqrt(Math.max(0, 1 - u * u - w * w)), lat = Math.asin(Math.max(-1, Math.min(1, -w))), lon = Math.atan2(u, zz);
        cam.livello = 4; cam.cx = (lon + Math.PI) / (2 * Math.PI); cam.cy = ((Math.PI / 2 - lat) / Math.PI) * 0.5; cam.z *= 2 * Math.PI; continue;
      }
    }
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
    // il livello del pianeta arriva fin dove arrivano le sue lune
    const largo = cam.livello === 3 ? Math.max(6, 2.2 * estensioneLune(sistema(cam.via.cosmo, cam.via.galassia, cam.via.stella).pianeti[cam.via.pianeta])) : cam.livello === 2 ? 1.3 : 1.1;
    if (g && cam.z * largo < 0.3 * m) {
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
  if (cam.livello === 5) return null;
  if (cam.livello === 4) { // sulla superficie: la quota e la temperatura del punto
    const S = superficieDi(cam.via); if (!S) return null;
    const L = livelloTessere(cam.z), n = 4 ** L, u = ((x % 1) + 1) % 1, v = Math.max(0, Math.min(0.9999, y * 2));
    const t = tessereFatte.get(`${S.k}|${L}|${Math.floor(u * n)}|${Math.floor(v * n)}`); if (!t) return null;
    const i = Math.floor((u * n - Math.floor(u * n)) * t.sf.W), j = Math.floor((v * n - Math.floor(v * n)) * t.sf.H), c = j * t.sf.W + i, h = t.sf.alt[c];
    const T = S.cl.media[Math.min(S.cl.H - 1, Math.floor(v * S.cl.H)) * S.cl.W + Math.min(S.cl.W - 1, Math.floor(u * S.cl.W))];
    return { tipo: 'punto', pos: [x, y], scala: 0, testo: `${h < S.se.mare ? `mare, profondo ${Math.round(S.se.mare - h)} m` : t.sf.lago[c] > 0 ? `lago, profondo ${Math.round(t.sf.lago[c])} m` : `${Math.round(h - Math.max(S.se.mare, -1e9))} m sul mare`} · ${Math.round(T - 273.15)} °C in media · lat ${(90 - v * 180).toFixed(2)}°` };
  }
  if (cam.livello === 3) {
    const P = pianeta(cam.via.cosmo, cam.via.galassia, cam.via.stella, cam.via.pianeta);
    for (const R of P.regioni) if (Math.abs(x - R.pos[0]) < LATO_REGIONE / 2 && Math.abs(y - R.pos[1]) < LATO_REGIONE / 2) { const a = { ...cam.via, regione: R.id }; return { tipo: 'regione', pos: R.pos, scala: LATO_REGIONE / 2, testo: `regione ${R.id + 1}${R.nellAnello ? ", nell'anello" : ''} · universo n. ${numeroDi(a)} · clic per entrare`, via: a }; }
    if (Math.hypot(x, y) < 1) return { tipo: 'pianeta', pos: [0, 0], scala: 1, testo: descriviPianeta(P.P) };
    { const t = tempoMappa(); for (const L of P.P.lune || []) { const q = posLuna(cam.via, P.P, L, t), rr = Math.max(px, L.raggioM / P.P.raggioM); if (Math.hypot(x - q[0], y - q[1]) < rr) return { tipo: 'luna', pos: [q[0], q[1]], scala: Math.max(L.raggioM / P.P.raggioM, 0.2), testo: descriviLuna(P.P, L) }; } }
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
const descriviPianeta = (P) => `pianeta ${P.id + 1}${descriviClima(P.clima)} · ${P.tipo}${P.anelli ? ', con anelli' : ''}${P.lune?.length ? `, ${P.lune.length} ${P.lune.length === 1 ? 'luna' : 'lune'}` : ''}, raggio ${fmtLunghezza(P.raggioM)}, campo ${Math.round(P.B0 * 1e9).toLocaleString('it-IT')} nT, fatto di ${Object.entries(P.composizione || {}).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`;

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
  const v = cam.via, out = [`cosmo ${cosmoBase(v.cosmo)}${Object.keys(ramiCosmo(v.cosmo)).length ? ' (un ramo parallelo)' : ''}`];
  if (cam.livello >= 1) out.push(`galassia ${v.galassia + 1}`);
  if (cam.livello >= 2) out.push(`stella ${v.stella + 1}`);
  if (cam.livello >= 3) out.push(`pianeta ${v.pianeta + 1}`);
  if (cam.livello >= 4) out.push('la superficie');
  if (cam.livello >= 5) out.push(rocciaDi(cam)?.nome || 'la roccia');
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
  } else if (cam.livello === 5) {
    const r = rocciaDi(cam); if (r) { ctx.imageSmoothingEnabled = false; ctx.drawImage(r.cv, X(0), Y(0), z, z); ctx.imageSmoothingEnabled = true; }
  } else if (cam.livello === 4) {
    disegnaSuperficie(ctx, W, H, cam, dpr);
  } else {
    disegnaPianeta(ctx, v, X, Y, z, dpr, evidenzia);
  }
  // il metro: le distanze vere
  {
    const mpp = (cam.livello === 5 ? rocciaDi(cam)?.larghezzaM || 0.01 : metriPerUnita(cam.livello, v)) / z, voluto = 140 * dpr * mpp, e = Math.pow(10, Math.floor(Math.log10(voluto))), passo = [1, 2, 5, 10].map((k) => k * e).filter((x) => x <= voluto).pop() || e;
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
  if (Pl.anello) for (let r = Pl.anello[0]; r < Pl.anello[1]; r += 0.01) { const d = Pl.densitaAnello(r); ctx.strokeStyle = rgb(Pl.anelloVero?.colore || P.colore, Math.min(0.4, 0.25 * d)); ctx.lineWidth = Math.max(1, 0.011 * z); ctx.beginPath(); ctx.arc(X(0), Y(0), r * z, 0, 7); ctx.stroke(); }
  // LA NEBBIA: la fascia e l'anello come particelle che scorrono (lo stesso campione, sempre). Da
  // lontano sono puntini; quando il giro di una particella diventa abbastanza grande da vedersi,
  // il puntino diventa il suo cerchio vero.
  const neb = nebbiaPianeta(v.cosmo, v.galassia, v.stella, v.pianeta), t = (performance.now() / 1000) * ACCELERA;
  for (const g of neb.anello) { const f = g.fi + g.omega * t; ctx.fillStyle = rgb(Pl.anelloVero?.colore || P.colore, 0.55); ctx.fillRect(X(g.r * Math.cos(f)), Y(g.r * Math.sin(f)), dpr, dpr); }
  for (const q of neb.fascia) {
    const f = q.fi + q.omega * t, cx = q.r * Math.cos(f), cy = q.r * Math.sin(f), R = q.rg * z, x = X(cx), y = Y(cy);
    if (x < -R - 2 || y < -R - 2 || x > ctx.canvas.width + R + 2 || y > ctx.canvas.height + R + 2) continue;
    const col = q.elettrone ? '150,210,255' : '200,170,255', cerchio = Math.min(1, Math.max(0, (R - 2 * dpr) / (4 * dpr)));
    if (cerchio < 1) { ctx.fillStyle = `rgba(${col},${0.7 * (1 - cerchio)})`; ctx.fillRect(x, y, 1.3 * dpr, 1.3 * dpr); }
    if (cerchio > 0) { ctx.strokeStyle = `rgba(${col},${0.5 * cerchio})`; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(x + R, y, R, 0, 7); ctx.stroke(); }
  }
  // LE LUNE (lune.js): l'orbita vera (in raggi del pianeta) e il corpo con la sua taglia vera; girano col tempo della mappa
  { const t = tempoMappa();
    for (const L of P.lune || []) {
      const [lx, ly, a, e] = posLuna(v, P, L, t), rl = (L.raggioM / P.raggioM) * z;
      if (a * z > 4 * ctx.canvas.width) continue; // orbita molto più grande dello schermo: non si vede
      ctx.strokeStyle = 'rgba(200,210,255,0.18)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.ellipse(X(-a * e), Y(0), a * z, a * Math.sqrt(1 - e * e) * z, 0, 0, 7); ctx.stroke();
      const ghiaccio = L.composizione?.ghiaccio || 0, col = [150 + 70 * ghiaccio, 145 + 75 * ghiaccio, 140 + 90 * ghiaccio].map(Math.round);
      const luce = Math.atan2(-P.pos[1], -P.pos[0]), x = X(lx), y = Y(ly), r = Math.max(2.2 * dpr, rl);
      const g = ctx.createRadialGradient(x + Math.cos(luce) * r * 0.5, y + Math.sin(luce) * r * 0.5, r * 0.1, x, y, r);
      g.addColorStop(0, rgb(col)); g.addColorStop(1, rgb(col.map((c) => c * 0.25))); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      if (L.stato === 'vulcanica') { ctx.fillStyle = 'rgba(255,150,60,0.9)'; ctx.fillRect(x - dpr, y - dpr, 2 * dpr, 2 * dpr); }
    } }
  // i raggi cosmici nel campo del pianeta: le orbite di Størmer, calcolate davvero
  // (sono calcolate fino a 20 raggi dal pianeta: guardando da più lontano sfumano, invece di mostrare il bordo del calcolo)
  const vicino = Math.max(0, Math.min(1, ((40 * z) / Math.min(ctx.canvas.width, ctx.canvas.height) - 0.9) / 0.6));
  ctx.strokeStyle = `rgba(255,196,120,${0.5 * vicino})`; ctx.lineWidth = dpr;
  if (vicino > 0) for (const t of magnetosfera(v.cosmo, v.galassia, v.stella, v.pianeta)) { ctx.beginPath(); t.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke(); }
  disegnaCorpo(ctx, P, X(0), Y(0), z, S.stella, v, dpr, P.pos);
  // la sua superficie, vista da sopra l'equatore: la stessa mappa del pannello, avvolta sulla sfera
  // la sua forma (schiacciata ai poli dalla rotazione) e la sua superficie vista dall'equatore
  const disco = discoPianeta(v, P), fz = 1 - (P.schiacciamento || 0);
  if (disco) { ctx.save(); ctx.beginPath(); ctx.ellipse(X(0), Y(0), z, z * fz, 0, 0, 7); ctx.clip(); ctx.drawImage(disco, X(0) - z, Y(0) - z * fz, 2 * z, 2 * z * fz); ctx.restore(); }
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
  const S = superficieDi(v); if (!S) return null; // si sta ancora calcolando: intanto il pianeta si vede come da lontano
  const cl = S.cl, sf = S.se, px = immagineSuperficie(sf, P.clima.T, cl), N = 256;
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

// ---------- la superficie esplorabile: tessere sempre più fini mentre ci si avvicina (geologia.js, tessera)
// La superficie (tettonica, clima, aria, erosione) costa alcuni secondi: si calcola IN SECONDO PIANO
// (superficie.worker.js) e intanto la mappa resta viva; superficieDi dà null finché non è pronta, poi avvisa.
const superfici = new Map(), tessereFatte = new Map(), inCalcolo = new Set();
let operaio = null, avvisa = null;
export function quandoSuperficiePronta(f) { avvisa = f; }
export const superficieInCalcolo = (v) => inCalcolo.has(JSON.stringify(v));
function tieni(k, out) { superfici.set(k, out); if (superfici.size > 4) superfici.delete(superfici.keys().next().value); return out; }
export function superficieDi(v) {
  const k = JSON.stringify(v); if (superfici.has(k)) return superfici.get(k);
  const P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta]; const seme = P.origine;
  if (P.tipo === 'gassoso' || !P.interno) return null;
  if (typeof Worker === 'undefined' || typeof document === 'undefined') { // senza fili in secondo piano (le prove): subito
    const sf0 = superficiePianeta(k, P, P.interno, seme), cl = climaSuperficie(k, P, sf0), se = erosione(k, sf0, cl);
    return tieni(k, { k, P, cl, se, seme });
  }
  if (!inCalcolo.has(k)) {
    if (!operaio) {
      operaio = new Worker(new URL('./superficie.worker.js', import.meta.url), { type: 'module' });
      operaio.onmessage = (e) => {
        const d = e.data; inCalcolo.delete(d.k);
        if (d.errore) { console.error('la superficie non si è potuta calcolare:', d.errore); return; }
        const w = JSON.parse(d.k), Pw = sistema(w.cosmo, w.galassia, w.stella).pianeti[w.pianeta];
        tieni(d.k, { k: d.k, P: Pw, cl: d.cl, se: d.se, seme: Pw.origine }); if (avvisa) avvisa(w);
      };
    }
    inCalcolo.add(k); operaio.postMessage({ k, v });
  }
  return null;
}
const livelloTessere = (z) => Math.max(0, Math.min(7, Math.floor(Math.log(z / 420) / Math.log(4))));
export let tessereInAttesa = 0;
function disegnaSuperficie(ctx, W, H, cam, dpr) {
  const S = superficieDi(cam.via), z = cam.z, Lmax = livelloTessere(z);
  if (!S) { ctx.fillStyle = 'rgba(235,230,215,0.85)'; ctx.font = `${14 * dpr}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.fillText('la superficie si sta formando: tettonica, clima, aria, erosione…', W / 2, H / 2); ctx.textAlign = 'start'; return; }
  const x0 = cam.cx - W / 2 / z, x1 = cam.cx + W / 2 / z, y0 = Math.max(0, cam.cy - H / 2 / z), y1 = Math.min(0.5, cam.cy + H / 2 / z);
  ctx.imageSmoothingEnabled = true; tessereInAttesa = 0; let nuove = 0;
  // dal più grosso al più fine: si disegna quello che c'è, e si calcola una tessera nuova per fotogramma
  for (let L = Math.max(0, Lmax - 2); L <= Lmax; L++) {
    const n = 4 ** L;
    for (let ty = Math.floor(y0 * 2 * n); ty <= Math.min(n - 1, Math.floor(y1 * 2 * n)); ty++) for (let txg = Math.floor(x0 * n); txg <= Math.floor(x1 * n); txg++) {
      const tx = ((txg % n) + n) % n, k = `${S.k}|${L}|${tx}|${ty}`; let t = tessereFatte.get(k);
      if (!t) {
        if (nuove >= 1 && L > 0) { tessereInAttesa++; continue; }
        const sf = tessera(S.k, S.se, S.cl, L, tx, ty, S.seme), px = immagineSuperficie(sf, S.P.clima.T, S.cl);
        const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(sf.W, sf.H) : Object.assign(document.createElement('canvas'), { width: sf.W, height: sf.H });
        cv.getContext('2d').putImageData(new ImageData(px, sf.W, sf.H), 0, 0);
        t = { cv, sf }; tessereFatte.set(k, t); if (tessereFatte.size > 60) tessereFatte.delete(tessereFatte.keys().next().value); nuove++;
      }
      const px0 = W / 2 + (txg / n - cam.cx) * z, py0 = H / 2 + ((ty / n) * 0.5 - cam.cy) * z;
      ctx.drawImage(t.cv, px0, py0, z / n + 0.5, (0.5 * z) / n + 0.5);
    }
  }
}

// ---------- la roccia di un punto della superficie (rocce.js): che cosa c'è lì lo decide il posto
// (crosta continentale o vulcanica, fiume o lago, ghiaccio), e la sua tessitura nasce da come si è formata
const rocceFatte = new Map();
export function rocciaDi(cam) {
  const S = superficieDi(cam.via); if (!S) return null;
  const u = ((cam.roccia.cx % 1) + 1) % 1, v = Math.max(0, Math.min(0.9999, cam.roccia.cy * 2)), k = `${S.k}|${u.toFixed(7)}|${v.toFixed(7)}`;
  if (rocceFatte.has(k)) return rocceFatte.get(k);
  // il punto, letto alla risoluzione più fine già calcolata (o sulla mappa intera)
  let t = S.se; for (let L = 7; L >= 1; L--) { const n = 4 ** L, q = tessereFatte.get(`${S.k}|${L}|${Math.floor(u * n)}|${Math.floor(v * n)}`); if (q) { t = q.sf; break; } }
  const [u0, v0, u1, v1] = t.rett || [0, 0, 1, 1], i = Math.min(t.W - 1, Math.floor(((u - u0) / (u1 - u0)) * t.W)), j = Math.min(t.H - 1, Math.floor(((v - v0) / (v1 - v0)) * t.H)), c = j * t.W + i;
  const cl = S.cl, ck = Math.min(cl.H - 1, Math.floor(v * cl.H)) * cl.W + Math.min(cl.W - 1, Math.floor(u * cl.W)), T = cl.media[ck], seme = semeEvento('roccia', cam.via.cosmo, cam.via.galassia, cam.via.stella, cam.via.pianeta, Math.floor(u * 1e6), Math.floor(v * 1e6)); // il caso di QUEL punto di QUEL pianeta
  const bagnato = t.alt[c] < t.mare || (t.lago && t.lago[c] > 0) || (t.depositato && t.depositato[c] > 3), mat = S.se.materiali || {};
  const conAnisotropia = (lista, base) => (lista && lista.length ? lista.map((x) => ({ nome: x.nome, frazione: x.frazione, colore: x.colore, anisotropia: 1.2 })) : base);
  let r, nome, larghezzaM, frase;
  if (cl.neve > 0 && cl.freddo[ck] > 0.6) { r = fioccoDiNeve({ T: Math.max(238, Math.min(271, T)), umidita: 0.86 + 0.14 * ((seme % 97) / 97), seme }); nome = `un cristallo di neve (${r.forma})`; larghezzaM = 0.004; frase = 'cresciuto dal vapore: la forma a sei viene dal reticolo del ghiaccio, i rami dall\'umidità'; }
  else if (bagnato) { const e = Math.max(0.05, Math.min(1, Math.log10(1 + (t.flusso[c] || 0)) / 4)); r = sedimento({ energia: e, seme }); nome = e > 0.6 ? 'ghiaia e sabbia grossa' : e > 0.3 ? 'sabbia' : 'limo'; larghezzaM = 0.02 + 0.3 * e; frase = 'granelli portati e depositati dall\'acqua: più corre, più sono grossi e mescolati'; }
  else if (t.cont && t.cont[c]) { r = cristallizza({ raffreddamento: 0.003, minerali: conAnisotropia(mat.continente, GRANITO), seme }); nome = 'roccia dei continenti, a cristalli grossi'; larghezzaM = 0.04; frase = 'raffreddata lentamente in profondità: pochi cristalli, cresciuti a lungo'; }
  else { r = cristallizza({ raffreddamento: 0.15, minerali: conAnisotropia(mat.basalto, BASALTO), seme }); nome = 'basalto, a cristalli minuti'; larghezzaM = 0.004; frase = 'lava raffreddata in fretta in superficie: tanti cristalli piccoli'; }
  const N = r.N || Math.round(Math.sqrt(immagineRoccia(r).length / 4)), px = immagineRoccia(r);
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N });
  cv.getContext('2d').putImageData(new ImageData(px, N, N), 0, 0);
  const out = { cv, nome, larghezzaM, frase }; rocceFatte.set(k, out); if (rocceFatte.size > 12) rocceFatte.delete(rocceFatte.keys().next().value);
  return out;
}
