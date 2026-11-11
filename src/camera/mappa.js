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
// LE SCALE SONO VERE dal cosmo al pianeta: una galassia nel cosmo (10⁻⁵ del toro), un sistema nella galassia (30 UA:
// 10⁻⁸ della galassia), un pianeta nel sistema sono grandi quanto sono, cioè puntini (con una taglia minima in pixel, per
// poterli trovare) finché non ci si avvicina moltissimo. Per arrivarci: zoomando in avanti lo sguardo scivola verso la
// cosa più vicina al punto che si guarda; un clic ci vola. Le coordinate si ribasano a ogni livello (cx, cy relativi al
// figlio): i numeri a sedici cifre bastano (un sistema a 10⁻⁸ della galassia ne ha ancora otto buone).

import { cosmo, galassia, sistema, pianeta, regione, magnetosfera, fascia, metriPerUnita, raggioSistema, LATO_REGIONE, numeroDi, cosmoBase, ramiCosmo, semeEvento } from './cosmo.js';
import { fmtLunghezza } from './unita.js';
import { nebbiaPianeta, ACCELERA, fmtGrande } from './nebbia.js';
import { sorgente } from './eventi.js';
import { bellezzaImmagine } from './sezione.js';
import { cristallizza, fioccoDiNeve, sedimento, immagine as immagineRoccia, GRANITO, BASALTO } from './rocce.js';
import { superficiePianeta, immagineSuperficie, climaSuperficie, erosione, tessera, climaConIlMare } from './geologia.js';
import { mare as mareDi, campioneAcqua, immagineAcqua, coloraMare, aspettoMare, luogo as luogoMare, scenaMolecolare } from './mare.js';
import { conMoto, scenaDaElenco } from './atomi3d.js';
import { luogoDaRoccia, luogoDaAcqua, luogoDaAria, cieloRelativo, memoriaDelLuogo, aloni, tracceFossili, atomi as atomiDelReticolo, immagineAtomi, incanalamento, cellaMateria, sorgentiNaturali, concentrazioni, RETICOLI, fmtTempo } from './materia.js';
import { simulaMondo } from './mondo.js';

const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const minimo = (W, H) => Math.min(W, H);

// ---------- il genitore e i figli di ogni livello
function figli(cam) {
  const v = cam.via;
  if (cam.livello === 0) return cosmo(v.cosmo).galassie.map((G) => ({ pos: G.pos, scala: G.r, raggio: 1.05, via: { ...v, galassia: G.id }, dato: G }));
  if (cam.livello === 1) { const rs = raggioSistema(v.cosmo, v.galassia); return galassia(v.cosmo, v.galassia).stelle.map((S) => ({ pos: S.pos, scala: rs, raggio: 1.2, via: { ...v, stella: S.id }, dato: S })); } // (un sistema, 30 UA, nelle unità vere della galassia: ~10⁻⁸)
  if (cam.livello === 2) return sistema(v.cosmo, v.galassia, v.stella).pianeti.map((P) => ({ pos: P.pos, scala: P.r, raggio: Math.max(2.8, 1.1 * estensioneLune(P)), via: { ...v, pianeta: P.id }, dato: P }));
  return [];
}
// dove sta il livello dentro il genitore (posizione e scala)
function nelGenitore(cam) {
  const v = cam.via;
  if (cam.livello === 1) { const G = cosmo(v.cosmo).galassie[v.galassia]; return { pos: G.pos, scala: G.r }; }
  if (cam.livello === 2) { const S = galassia(v.cosmo, v.galassia).stelle[v.stella]; return { pos: S.pos, scala: raggioSistema(v.cosmo, v.galassia) }; }
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
  if (cam.livello === 4 && cam.z > 6e6) { cam.roccia = { cx: cam.cx, cy: cam.cy }; cam.livello = 5; cam.cx = 0.5; cam.cy = 0.5; cam.z = 0.8 * m; cam.passoRoccia = 0; cam.eventoAcqua = false; return null; }
  if (cam.livello === 5) {
    // DENTRO LA ROCCIA si continua a scendere (materia.js), un passo ogni volta che l'immagine riempie nove schermi:
    // 0 la roccia → 1 un suo cristallo con ciò che ha registrato (aloni o tracce di fissione; il passo manca dove niente
    // tiene memoria) → 2 la stella d'incanalamento del minerale che si aveva sotto gli occhi (una lamina di qualche
    // decimo di micron) → 3 i suoi atomi (in tre dimensioni, se la scheda grafica c'è: laboratorio.js, montaAtomi)
    if (!cam.suAcqua) {
      const passo = cam.passoRoccia ?? 0, conMemoria = !!rocciaDi({ ...cam, passoRoccia: 0 })?.memoria?.tipo;
      if (cam.z > 9 * m && passo < 3) { if (!passo) { cam.puntoRoccia = [cam.cx, cam.cy]; cam.mineraleRoccia = rocciaDi(cam)?.mineraleIn?.(cam.cx, cam.cy) ?? null; } cam.passoRoccia = passo === 0 && !conMemoria ? 2 : passo + 1; cam.cx = 0.5; cam.cy = 0.5; cam.z = m; return null; }
      if (cam.z < 0.8 * m && passo > 0) { cam.passoRoccia = passo === 2 && !conMemoria ? 0 : passo - 1; cam.cx = cam.passoRoccia ? 0.5 : cam.puntoRoccia?.[0] ?? 0.5; cam.cy = cam.passoRoccia ? 0.5 : cam.puntoRoccia?.[1] ?? 0.5; cam.z = 8 * m; return null; }
    }
    // SOTTO LE MOLECOLE DELL'ACQUA: l'evento vero (il prossimo decadimento, o il prossimo raggio cosmico), alla sua scala
    if (cam.suAcqua && cam.eventoAcqua && cam.z < 0.8 * m) { cam.eventoAcqua = false; cam.z = 8 * m; cam.cx = 0.5; cam.cy = 0.5; return null; }
    if (cam.suAcqua && !cam.eventoAcqua && cam.z > 9 * m && (cam.latoAcqua ?? 1) <= 2e-9) { cam.eventoAcqua = true; cam.z = m; cam.cx = 0.5; cam.cy = 0.5; return null; }
    // dentro l'acqua si continua a scendere: ogni volta che il campione riempie dieci schermi se ne guarda uno dieci volte più piccolo
    if (cam.suAcqua && cam.z > 9 * m && (cam.latoAcqua ?? 1) > 2e-9) { cam.latoAcqua = (cam.latoAcqua ?? 1) / 10; cam.z /= 10; cam.cx = 0.5 + (cam.cx - 0.5) * 0; cam.cy = 0.5; return null; }
    if (cam.suAcqua && cam.z < 0.8 * m && (cam.latoAcqua ?? 1) < 0.5) { cam.latoAcqua *= 10; cam.z *= 10; cam.cx = 0.5; cam.cy = 0.5; return null; }
    if (cam.z < 0.45 * m) { cam.livello = 4; cam.cx = cam.roccia.cx; cam.cy = cam.roccia.cy; cam.z = 5.5e6; cam.latoAcqua = undefined; cam.passoRoccia = 0; cam.eventoAcqua = false; cam.mineraleRoccia = null; return null; }
    cam.z = Math.min(cam.z, 12 * m); return null;
  }
  return passaggi(cam, W, H, k > 1, { fx, fy, k });
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
function passaggi(cam, W, H, dentro = false, fuoco = null) {
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
      // (a ogni livello i figli hanno la taglia VERA: una galassia nel cosmo, un sistema nella galassia, un pianeta nel sistema
      // sono puntini, e per arrivarci serve avvicinarsi moltissimo; il tetto è lo zoom a cui il figlio più vicino riempirebbe lo schermo)
      // Il punto attorno a cui si zooma (il cursore) resta fermo: il figlio più vicino a QUEL punto gli scivola incontro, tanto
      // più in fretta quanto più forte è il colpo di rotella (se no lo zoom lo porterebbe via più in fretta di quanto arriva)
      const ax = fuoco ? cam.cx + (fuoco.fx - W / 2) / cam.z : cam.cx, ay = fuoco ? cam.cy + (fuoco.fy - H / 2) / cam.z : cam.cy;
      const vicino = (() => { let b = null, d = Infinity; for (const f of figli(cam)) { let dx = f.pos[0] - ax, dy = f.pos[1] - ay; if (cam.livello === 0) { dx -= Math.round(dx); dy -= Math.round(dy); } const e = Math.hypot(dx, dy); if (e < d) { d = e; b = { f, dx, dy }; } } return b; })();
      // (un puntino: avvicinandosi, lo sguardo va verso quello che è già vicino al punto che si guarda)
      if (vicino) { const f = vicino.f, perTaglia = Math.min(1, (f.scala * cam.z * f.raggio) / soglia);
        const prossimita = dentro ? Math.max(perTaglia, 1 - (Math.hypot(vicino.dx, vicino.dy) * cam.z) / (0.3 * m)) : perTaglia; if (prossimita > 0.3) { const k = prossimita * Math.max(0.25, dentro && fuoco ? 1 - 0.8 / fuoco.k : 0); cam.cx += vicino.dx * k; cam.cy += vicino.dy * k; } }
      const tetto = cam.livello === 2 ? m / 5e-7 : vicino ? m / (vicino.f.scala * 0.8) : Infinity;
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
  if (cam.livello === 5) { // in fondo allo zoom: un clic entra nella finestra di quel punto (le particelle dentro quella materia)
    const mt = materiaDelPunto(cam); return mt ? { tipo: 'materia', pos: [x, y], scala: 0, testo: `clic: entra nella finestra — ${mt.che}`, materia: mt } : null;
  }
  if (cam.livello === 4) { // sulla superficie: la quota e la temperatura del punto
    const S = superficieDi(cam.via); if (!S) return null;
    const L = livelloTessere(cam.z), n = 4 ** L, u = ((x % 1) + 1) % 1, v = Math.max(0, Math.min(0.9999, y * 2));
    const t = tessereFatte.get(`${S.k}|${L}|${Math.floor(u * n)}|${Math.floor(v * n)}`); if (!t) return null;
    const i = Math.floor((u * n - Math.floor(u * n)) * t.sf.W), j = Math.floor((v * n - Math.floor(v * n)) * t.sf.H), c = j * t.sf.W + i, h = t.sf.alt[c];
    const T = S.cl.media[Math.min(S.cl.H - 1, Math.floor(v * S.cl.H)) * S.cl.W + Math.min(S.cl.W - 1, Math.floor(u * S.cl.W))];
    let acquaQuiTesto = '';
    if (S.mare?.esiste && (h < S.se.mare || t.sf.lago[c] > 0)) { const M = S.mare, km = Math.max(0, Math.min(M.H - 1, Math.floor(v * M.H))) * M.W + Math.min(M.W - 1, Math.floor(u * M.W)), cu = M.corrente.u[km], cv2 = M.corrente.v[km], vel = Math.hypot(cu, cv2), verso = ['est', 'nord-est', 'nord', 'nord-ovest', 'ovest', 'sud-ovest', 'sud', 'sud-est'][((Math.round(Math.atan2(cv2, cu) / (Math.PI / 4)) % 8) + 8) % 8];
      acquaQuiTesto = ` · acqua a ${(M.temperatura[km] - 273.15).toFixed(1)} °C, ${M.salinita[km].toFixed(1)} g di sali per kg, corrente ${vel < 0.005 ? 'quasi ferma' : `${(vel * 100).toFixed(vel < 0.1 ? 1 : 0)} cm/s verso ${verso}`}, fango sospeso ${(M.torbidita[km] * 1000).toPrecision(2)} g/m³${M.ghiaccio && M.ghiaccio[km] > 0.3 ? ', sotto il ghiaccio' : ''}${Math.abs(M.risalita[km]) * 3.156e7 > 20 ? (M.risalita[km] > 0 ? ", acqua che sale dal fondo" : ", acqua che scende") : ''}`; }
    // L'ARIA SOPRA QUEL PUNTO: quando lo schermo è largo poche centinaia di chilometri (la taglia di uno sciame) un clic apre la
    // finestra su uno sciame di raggi cosmici in quell'aria, se ce n'è abbastanza perché nasca (30 g/cm²)
    let aria = null; const gP = S.P.clima?.g ?? 9.81, colonna = isFinite(S.P.clima?.pressione) ? S.P.clima.pressione / gP / 10 : 0;
    if ((W / cam.z) * metriPerUnita(4, cam.via) < 4e5 && colonna > 30) aria = { luogo: luogoDaAria({ S, lat: 90 - v * 180, lon: u * 360 - 180, quotaM: Math.max(0, h - Math.max(S.se.mare, -1e9)), suMare: h < S.se.mare, raggi: cieloDi(cam.via) }), opzioni: { processo: 'sciame' }, che: "lo sciame di un raggio cosmico nell'aria qui sopra" };
    return { tipo: 'punto', pos: [x, y], scala: 0, materia: aria, testo: `${h < S.se.mare ? `mare, profondo ${Math.round(S.se.mare - h)} m` : t.sf.lago[c] > 0 ? `lago, profondo ${Math.round(t.sf.lago[c])} m` : `${Math.round(h - Math.max(S.se.mare, -1e9))} m sul mare`} · ${Math.round(T - 273.15)} °C in media · lat ${(90 - v * 180).toFixed(2)}°${acquaQuiTesto}${aria ? ' · clic: lo sciame di un raggio cosmico nell\'aria qui sopra' : ''}` };
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
  if (cam.livello === 1 && !migliore) { const Gx = galassia(cam.via.cosmo, cam.via.galassia), rb = raggioBuco(Gx); if (Math.hypot(x, y) < Math.max(px, rb)) return { tipo: 'buco', pos: [0, 0], scala: Math.max(px, rb), testo: `il buco nero al centro della galassia: ${fmtGrande(Gx.buco.M)} masse solari, largo ${fmtLunghezza(2 * rb * Gx.forma.unitaM)}${Gx.G.attivita > 0.3 ? ' · attivo: il suo getto lancia raggi cosmici' : ''}` }; }
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
  cam.cx += dx * 0.3; cam.cy += dy * 0.3;
  // (la meta può essere miliardi di volte più piccola dello schermo: ci si avvicina solo quanto basta a tenerla in vista,
  // così lo zoom segue lo sguardo che converge su di lei)
  const resta = 0.7 * Math.hypot(dx, dy), zVista = resta > 0 ? (0.25 * m) / resta : Infinity;
  const k = Math.exp(Math.max(-0.45, Math.min(0.45, Math.log(zFin / cam.z) * 0.18, Math.log(zVista / cam.z))));
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

export function disegnaMappa(ctx, W, H, cam, { sopra = null, evidenzia = null, dpr = 1, nudo = false } = {}) {
  const z = cam.z, X = (x) => W / 2 + (x - cam.cx) * z, Y = (y) => H / 2 + (y - cam.cy) * z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
  // le stelle lontane (sfondo, fisso)
  if (!nudo) for (const [u, v, b] of fondoStelle) { ctx.fillStyle = `rgba(220,225,255,${0.12 + 0.35 * b})`; ctx.fillRect(u * W, v * H, dpr * (b > 0.9 ? 1.5 : 1), dpr * (b > 0.9 ? 1.5 : 1)); }
  const v = cam.via;
  if (cam.livello === 0) {
    const C = cosmo(v.cosmo), img = immagineRete(v.cosmo);
    // la rete cosmica, ripetuta: lo spazio si richiude
    const i0 = Math.floor(cam.cx - W / 2 / z) - 1, i1 = Math.floor(cam.cx + W / 2 / z) + 1, j0 = Math.floor(cam.cy - H / 2 / z) - 1, j1 = Math.floor(cam.cy + H / 2 / z) + 1;
    // (la rete è la materia a grande scala: avvicinandosi a una galassia vera — un punto, sulla rete — una sua cella riempie
    // lo schermo e poi sbiadisce, fino al buio in cui sta la galassia)
    const cella = z / C.N, velo = 0.85 * Math.max(0, Math.min(1, 1 - Math.log10(cella / (4 * Math.max(W, H))) / 2));
    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = velo;
    if (velo > 0 && cella < 0.5 * Math.max(W, H)) { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) ctx.drawImage(img, X(i), Y(j), z, z); }
    else if (velo > 0) { // molto dentro: il colore della rete in quel punto (la stessa densità, calcolata lì), senza stirare l'immagine
      const d = Math.max(0, (C.densita(cam.cx, cam.cy) - C.media) / C.sigma + 0.6), t = Math.min(1, d / 3); ctx.fillStyle = `rgb(${Math.round(20 + 90 * t)},${Math.round(18 + 40 * t * t)},${Math.round(40 + 110 * t)})`; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (const G of C.galassie) {
      const x = X(G.pos[0] + i), y = Y(G.pos[1] + j), r = G.r * z;
      if (x < -r - 20 || y < -r - 20 || x > W + r + 20 || y > H + r + 20) continue;
      disegnaGalassiaLontana(ctx, G, x, y, r, dpr, v.cosmo);
    }
  } else if (cam.livello === 1) {
    const Gx = galassia(v.cosmo, v.galassia);
    disegnaGalassia(ctx, Gx, X, Y, z, dpr, v);
    // le sorgenti dei raggi cosmici
    for (const s of Gx.sorgenti) {
      if (s.tipo === 'supernova') { ctx.strokeStyle = 'rgba(255,140,170,0.55)'; ctx.lineWidth = dpr; cerchio(ctx, X(s.pos[0]), Y(s.pos[1]), Math.max(2 * dpr, s.r * z)); }
      if (s.tipo === 'pulsar') { ctx.strokeStyle = 'rgba(150,210,255,0.9)'; ctx.lineWidth = dpr; const x = X(s.pos[0]), y = Y(s.pos[1]), l = 4 * dpr; if (!(Math.abs(x) < 1e5 && Math.abs(y) < 1e5)) continue; ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke(); }
    }
    if (evidenzia?.stella != null && evidenzia.galassia === v.galassia) {
      const S = Gx.stelle[evidenzia.stella];
      for (const s of Gx.sorgenti) if (evidenzia.sorgenti?.some((n) => n.startsWith(s.nome))) { ctx.strokeStyle = 'rgba(255,190,90,0.7)'; ctx.setLineDash([5 * dpr, 4 * dpr]); ctx.lineWidth = dpr; tratto(ctx, X(s.pos[0]), Y(s.pos[1]), X(S.pos[0]), Y(S.pos[1])); ctx.setLineDash([]); scrivi(ctx, s.nome, X(s.pos[0]) + 6 * dpr, Y(s.pos[1]) - 6 * dpr, 'rgba(255,200,120,0.9)', dpr); }
      ctx.strokeStyle = 'rgba(255,200,120,0.95)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(X(S.pos[0]), Y(S.pos[1]), 7 * dpr, 0, 7); ctx.stroke();
    }
  } else if (cam.livello === 2) {
    disegnaSistema(ctx, sistema(v.cosmo, v.galassia, v.stella), X, Y, z, dpr, v);
  } else if (cam.livello === 5) {
    const r = rocciaDi(cam); if (r) { ctx.imageSmoothingEnabled = !!r.liscio; ctx.drawImage(r.cv, X(0), Y(0), z, z); ctx.imageSmoothingEnabled = true; }
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

// un cerchio che può essere enorme (il resto di una supernova visto da dentro, un'orbita): se è più grande dello
// schermo se ne disegna solo il tratto che ci passa, per punti (i numeri troppo grandi la tela li sbaglia)
function cerchio(ctx, x, y, r) {
  const W = ctx.canvas.width, H = ctx.canvas.height, d = Math.hypot(W / 2 - x, H / 2 - y), mezza = Math.hypot(W, H) / 2;
  if (d > r + mezza || d < r - mezza) return; // non tocca lo schermo
  ctx.beginPath();
  if (r < 8000) ctx.arc(x, y, r, 0, 7);
  else { const fi0 = Math.atan2(H / 2 - y, W / 2 - x), semi = Math.min(Math.PI, (1.5 * mezza) / r); for (let q = 0; q <= 48; q++) { const fi = fi0 - semi + (2 * semi * q) / 48, px = x + r * Math.cos(fi), py = y + r * Math.sin(fi); q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
  ctx.stroke();
}
// un tratto tra due punti che possono essere lontanissimi dallo schermo: se ne disegna solo la parte vicina
function tratto(ctx, x0, y0, x1, y1) {
  const W = ctx.canvas.width, H = ctx.canvas.height, L = 4 * (W + H); let t0 = 0, t1 = 1;
  for (const [p, q] of [[x0 - x1, x0 + L], [x1 - x0, W + L - x0], [y0 - y1, y0 + L], [y1 - y0, H + L - y0]]) { if (p === 0) { if (q < 0) return; continue; } const t = q / p; if (p < 0) { if (t > t1) return; if (t > t0) t0 = t; } else { if (t < t0) return; if (t < t1) t1 = t; } }
  ctx.beginPath(); ctx.moveTo(x0 + t0 * (x1 - x0), y0 + t0 * (y1 - y0)); ctx.lineTo(x0 + t1 * (x1 - x0), y0 + t1 * (y1 - y0)); ctx.stroke();
}
// il raggio del buco nero centrale (l'orizzonte, 2GM/c²) nelle unità della galassia: la sua taglia vera
const raggioBuco = (Gx) => (2 * 6.674e-11 * Gx.buco.M * 1.989e30) / 2.998e8 ** 2 / Gx.forma.unitaM;
function disegnaGalassiaLontana(ctx, G, x, y, r, dpr, n) {
  // la taglia è quella vera: da lontano un puntino (più grande se ha più stelle), per poterla trovare
  if (r < 30 * dpr) { const p = Math.max(2.2, Math.min(4.5, 2.2 + 1.2 * Math.log10(G.forma.massaStelle / 1e10))) * dpr; alone(ctx, x, y, Math.max(p, r * 1.4), G.tinta, 0.8); ctx.fillStyle = 'rgba(255,250,240,0.95)'; ctx.fillRect(x - dpr / 2, y - dpr / 2, dpr, dpr); return; }
  // da vicino: le sue stelle vere, disegnate come quando ci si entra (così entrare non cambia niente sullo schermo)
  disegnaGalassia(ctx, galassia(n, G.id), (u) => x + u * r, (u) => y + u * r, r, dpr, { cosmo: n, galassia: G.id });
}
function disegnaGalassia(ctx, Gx, X, Y, z, dpr, v) {
  const G = Gx.G, W = ctx.canvas.width, H = ctx.canvas.height;
  // il chiarore di tutte le stelle che il campione non mostra: sfuma dal centro; da dentro è una tinta uniforme, che si
  // spegne avvicinandosi ancora (le stelle si separano: tra l'una e l'altra c'è il buio)
  if (0.45 * z < 6000) alone(ctx, X(0), Y(0), 0.45 * z, G.tinta, 0.35);
  else { const d = Math.hypot(W / 2 - X(0), H / 2 - Y(0)) / (0.45 * z), spento = Math.max(0, 1 - Math.log10((0.45 * z) / 6000) / 1.5); if (d < 1 && spento > 0) { ctx.fillStyle = rgb(G.tinta, 0.35 * (1 - d) * spento); ctx.fillRect(0, 0, W, H); } }
  const rs = raggioSistema(v.cosmo, v.galassia), sistemaPx = rs * z;
  for (const s of Gx.stelle) {
    const x = X(s.pos[0]), y = Y(s.pos[1]); if (!(x > -50 - sistemaPx && y > -50 - sistemaPx && x < W + 50 + sistemaPx && y < H + 50 + sistemaPx)) continue;
    // da vicino la stella è il suo sistema, con la taglia vera (30 UA): lo stesso disegno di quando ci si entra
    if (sistemaPx > 10 * dpr) { disegnaSistema(ctx, sistema(v.cosmo, v.galassia, s.id), (u) => x + u * sistemaPx, (u) => y + u * sistemaPx, sistemaPx, dpr, { ...v, stella: s.id }); continue; }
    // da lontano un puntino (più grande se pesa di più), per poterla trovare
    const b = Math.min(2.2, 0.6 + Math.cbrt(s.massa) * 0.5) * dpr, sola = Math.max(0, Math.min(1, Math.log10(z / 3e4) / 2)); // (sola: da vicino ne resta una sullo schermo, e le si dà un alone per non perderla)
    if (sola > 0) alone(ctx, x, y, (3 + 5 * sola) * dpr, s.colore, 0.6 * sola);
    ctx.fillStyle = rgb(s.colore, 0.95); ctx.fillRect(x - b / 2, y - b / 2, b, b);
  }
  // il buco nero: con la sua taglia vera (l'orizzonte), il chiarore di ciò che gli cade dentro, e il getto
  const rb = Math.max(2 * dpr, raggioBuco(Gx) * z), a = G.getto;
  if (G.attivita > 0.15) { ctx.strokeStyle = `rgba(150,190,255,${0.25 + 0.5 * G.attivita})`; ctx.lineWidth = Math.max(dpr, Math.min(3 * dpr, 0.004 * z)); for (const q of [1, -1]) tratto(ctx, X(0), Y(0), X(q * Math.cos(a) * 0.6), Y(q * Math.sin(a) * 0.6)); }
  if (Math.abs(X(0)) < 1e5 + rb && Math.abs(Y(0)) < 1e5 + rb) {
    if (rb < 6000) { alone(ctx, X(0), Y(0), rb * 3, [255, 190, 120], 0.25 + 0.55 * Math.max(G.attivita, 0.2)); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(X(0), Y(0), rb, 0, 7); ctx.fill(); }
    else if (Math.hypot(W / 2 - X(0), H / 2 - Y(0)) < rb) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); } // dentro l'orizzonte: buio
  }
}
function disegnaSistema(ctx, S, X, Y, z, dpr, v) {
  const st = S.stella;
  alone(ctx, X(0), Y(0), Math.max(10 * dpr, st.r * z * 4), st.colore, 0.9);
  ctx.fillStyle = rgb(st.colore); ctx.beginPath(); ctx.arc(X(0), Y(0), Math.max(2 * dpr, st.r * z), 0, 7); ctx.fill();
  for (const P of S.pianeti) {
    ctx.strokeStyle = 'rgba(200,210,255,0.16)'; ctx.lineWidth = dpr; ctx.beginPath();
    if (P.a * z < 8000 * dpr) ctx.arc(X(0), Y(0), P.a * z, 0, 7);
    else { // da molto vicino l'orbita è un cerchio enorme: se ne disegna solo il tratto che passa sullo schermo, per punti
      const cxs = ctx.canvas.width / 2, cys = ctx.canvas.height / 2, fi0 = Math.atan2(cys - Y(0), cxs - X(0)), semi = Math.min(Math.PI, (1.5 * Math.hypot(cxs, cys)) / (P.a * z));
      for (let q = 0; q <= 48; q++) { const fi = fi0 - semi + (2 * semi * q) / 48, x = X(P.a * Math.cos(fi)), y = Y(P.a * Math.sin(fi)); q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    }
    ctx.stroke();
    disegnaCorpo(ctx, P, X(P.pos[0]), Y(P.pos[1]), Math.max(2.5 * dpr, P.r * z), st, v, dpr, P.pos); // (taglia vera; da lontano un puntino, per poterlo trovare)
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
  if (S.mare?.esiste) coloraMare(S.mare, sf, px); // l'acqua ha il colore di ciò che porta: limpida, torbida alle foci, bassa, gelata, con croste di sale
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
    const sf0 = superficiePianeta(k, P, P.interno, seme), cl0 = climaSuperficie(k, P, sf0), se = erosione(k, sf0, cl0);
    let acque = null; try { acque = mareDi(P, se, cl0, se, `${k}/mare`); } catch { acque = null; }
    let cl = cl0; try { if (acque && acque.esiste) cl = climaConIlMare(k, P, sf0, cl0, acque); } catch { cl = cl0; }
    return tieni(k, { k, P, cl, se, seme, mare: acque });
  }
  if (!inCalcolo.has(k)) {
    if (!operaio) {
      operaio = new Worker(new URL('./superficie.worker.js', import.meta.url), { type: 'module' });
      operaio.onmessage = (e) => {
        const d = e.data; inCalcolo.delete(d.k);
        if (d.errore) { console.error('la superficie non si è potuta calcolare:', d.errore); return; }
        const w = JSON.parse(d.k), Pw = sistema(w.cosmo, w.galassia, w.stella).pianeti[w.pianeta];
        tieni(d.k, { k: d.k, P: Pw, cl: d.cl, se: d.se, seme: Pw.origine, mare: d.mare }); if (avvisa) avvisa(w);
      };
    }
    inCalcolo.add(k); operaio.postMessage({ k, v });
  }
  return null;
}
const livelloTessere = (z) => Math.max(0, Math.min(7, Math.floor(Math.log(z / 420) / Math.log(4))));
export let tessereInAttesa = 0;
let giroMare = 1; // a ogni giro tutte le tessere con onde in vista vengono ridisegnate una volta
function disegnaSuperficie(ctx, W, H, cam, dpr) {
  const S = superficieDi(cam.via), z = cam.z, Lmax = livelloTessere(z);
  if (!S) { ctx.fillStyle = 'rgba(235,230,215,0.85)'; ctx.font = `${14 * dpr}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.fillText('la superficie si sta formando: tettonica, clima, aria, erosione…', W / 2, H / 2); ctx.textAlign = 'start'; return; }
  const x0 = cam.cx - W / 2 / z, x1 = cam.cx + W / 2 / z, y0 = Math.max(0, cam.cy - H / 2 / z), y1 = Math.min(0.5, cam.cy + H / 2 / z);
  ctx.imageSmoothingEnabled = true; tessereInAttesa = 0; let nuove = 0, mosse = 0, restano = 0;
  // dal più grosso al più fine: si disegna quello che c'è, e si calcola una tessera nuova per fotogramma
  for (let L = Math.max(0, Lmax - 2); L <= Lmax; L++) {
    const n = 4 ** L;
    for (let ty = Math.floor(y0 * 2 * n); ty <= Math.min(n - 1, Math.floor(y1 * 2 * n)); ty++) for (let txg = Math.floor(x0 * n); txg <= Math.floor(x1 * n); txg++) {
      const tx = ((txg % n) + n) % n, k = `${S.k}|${L}|${tx}|${ty}`; let t = tessereFatte.get(k);
      if (!t) {
        if (nuove >= 1 && L > 0) { tessereInAttesa++; continue; }
        const sf = tessera(S.k, S.se, S.cl, L, tx, ty, S.seme), px = immagineSuperficie(sf, S.P.clima.T, S.cl);
        // il mare com'è lì: il colore dall'ottica vera e dal fondale (parte ferma), e sopra le onde di quel punto (mare.js)
        let acqua = false; if (S.mare?.esiste) { for (let q = 0; q < sf.alt.length; q += 7) if (sf.alt[q] < sf.mare || (sf.lago && sf.lago[q] > 0)) { acqua = true; break; } }
        const base = acqua ? px.slice() : null; // la terra e il fondo, senz'acqua sopra: da qui si ridisegna il mare che si muove
        if (acqua) aspettoMare(S.mare, sf, px, { t: performance.now() / 1000, onde: 6 });
        const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(sf.W, sf.H) : Object.assign(document.createElement('canvas'), { width: sf.W, height: sf.H });
        cv.getContext('2d').putImageData(new ImageData(px, sf.W, sf.H), 0, 0);
        t = { cv, sf, base, mossa: acqua && (aspettoMare.ultimo?.onde || 0) > 0 }; tessereFatte.set(k, t); if (tessereFatte.size > 60) tessereFatte.delete(tessereFatte.keys().next().value); nuove++;
      }
      // dove le onde si vedono (tessere fini con acqua) il mare si ridisegna all'istante di adesso: poche tessere per
      // fotogramma, a turno, perché costa
      if (t.mossa && L === Lmax && mosse < 2 && (t.giro || 0) < giroMare) { const q = t.base.slice(); aspettoMare(S.mare, t.sf, q, { t: performance.now() / 1000, onde: 6 }); t.cv.getContext('2d').putImageData(new ImageData(q, t.sf.W, t.sf.H), 0, 0); t.giro = giroMare; mosse++; }
      else if (t.mossa && L === Lmax && (t.giro || 0) < giroMare) restano++;
      const px0 = W / 2 + (txg / n - cam.cx) * z, py0 = H / 2 + ((ty / n) * 0.5 - cam.cy) * z;
      ctx.drawImage(t.cv, px0, py0, z / n + 0.5, (0.5 * z) / n + 0.5);
    }
  }
  if (!restano) giroMare++;
}

// ---------- la roccia di un punto della superficie (rocce.js): che cosa c'è lì lo decide il posto
// (crosta continentale o vulcanica, fiume o lago, ghiaccio), e la sua tessitura nasce da come si è formata
const rocceFatte = new Map();
export function rocciaDi(cam) { // → { cv, nome, larghezzaM, frase, … }: ciò che si vede in fondo allo zoom, a ogni passo

  const S = superficieDi(cam.via); if (!S) return null;
  const u = ((cam.roccia.cx % 1) + 1) % 1, v = Math.max(0, Math.min(0.9999, cam.roccia.cy * 2)), k = `${S.k}|${u.toFixed(7)}|${v.toFixed(7)}`;
  if (rocceFatte.has(k)) { const base = rocceFatte.get(k); return cam.passoRoccia > 0 && !cam.suAcqua ? passoRoccia(cam, S, base, k) : base; }
  // il punto, letto alla risoluzione più fine già calcolata (o sulla mappa intera)
  let t = S.se; for (let L = 7; L >= 1; L--) { const n = 4 ** L, q = tessereFatte.get(`${S.k}|${L}|${Math.floor(u * n)}|${Math.floor(v * n)}`); if (q) { t = q.sf; break; } }
  const [u0, v0, u1, v1] = t.rett || [0, 0, 1, 1], i = Math.min(t.W - 1, Math.floor(((u - u0) / (u1 - u0)) * t.W)), j = Math.min(t.H - 1, Math.floor(((v - v0) / (v1 - v0)) * t.H)), c = j * t.W + i;
  const cl = S.cl, ck = Math.min(cl.H - 1, Math.floor(v * cl.H)) * cl.W + Math.min(cl.W - 1, Math.floor(u * cl.W)), T = cl.media[ck], seme = semeEvento('roccia', cam.via.cosmo, cam.via.galassia, cam.via.stella, cam.via.pianeta, Math.floor(u * 1e6), Math.floor(v * 1e6)); // il caso di QUEL punto di QUEL pianeta
  // SULL'ACQUA: in fondo allo zoom non c'è la roccia ma un campione di quell'acqua (mare.js), con ciò che vi è sciolto
  // e sospeso proprio lì; avvicinandosi ancora il campione si restringe di dieci in dieci, fino alle molecole
  const profondo = t.alt[c] < t.mare ? t.mare - t.alt[c] : t.lago && t.lago[c] > 0 ? t.lago[c] : 0;
  cam.suAcqua = profondo > 0 && !!S.mare?.esiste;
  if (cam.suAcqua) {
    if (cam.eventoAcqua) return eventoNellAcqua(cam, S, k, u, v, profondo);
    const lato = cam.latoAcqua ?? 1, ka = `${k}|acqua|${lato}`; let A = rocceFatte.get(ka);
    if (!A) {
      const camp = campioneAcqua(S.mare, { lon: u * 360 - 180, lat: 90 - v * 180, profondita: 0, latoM: lato, acqua: true, fondoM: profondo }, sorgente(`${S.k}/acqua/${u.toFixed(6)}/${v.toFixed(6)}`));
      const NA = 192, cvA = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(NA, NA) : Object.assign(document.createElement('canvas'), { width: NA, height: NA });
      // ciò che c'è davvero in questo campione ma a questa scala non si distingue (troppo piccolo: fa da velo), con i numeri veri
      const velo = (camp.velo || []).slice().sort((p, q) => q.quanteDavvero - p.quanteDavvero).slice(0, 3).map((x) => `${fmtGrande(x.quanteDavvero)} ${x.tipo === x.materiale ? x.tipo : `${x.tipo} di ${x.materiale}`} da ${fmtLunghezza(x.diametroM)}`);
      const ioni = Object.entries(camp.ioni || {}).map(([f, x]) => [f, x?.nelCampione ?? 0]).filter(([, n]) => n >= 1).sort((p, q) => q[1] - p[1]).slice(0, 3).map(([f, n]) => `${fmtGrande(n)} ${f}`);
      const dentro = [...velo, ...ioni].length ? ` In questo campione ci sono davvero: ${[...velo, ...ioni].join('; ')}${lato > 1e-7 ? ' (troppo piccoli per vedersi a questa scala: avvicinati ancora)' : ''}.` : '';
      A = { cv: cvA, camp, acqua: true, N: NA, nome: `acqua (un campione largo ${fmtLunghezza(lato)})`, larghezzaM: lato, frase: `${camp.descrizione}${dentro}${lato <= 2e-9 ? " Avvicinati ancora: sotto le molecole c'è l'evento vero che le attraversa (un decadimento, un raggio cosmico), con la sua attesa." : ''}`, quante: camp.quanteDavvero, t0: tempoMappa(), punto: { u, v, profondo } };
      rocceFatte.set(ka, A); if (rocceFatte.size > 24) rocceFatte.delete(rocceFatte.keys().next().value);
    }
    // l'acqua si muove: il campione ridisegnato all'istante di adesso (il tempo del campione è rallentato o accelerato
    // perché l'attraversamento duri qualche secondo di schermo)
    const tt = (((tempoMappa() - A.t0) / ACCELERA) * (A.camp.tempoAttraversamento || 1)) / 6;
    A.cv.getContext('2d').putImageData(new ImageData(immagineAcqua(A.camp, { N: A.N, t: tt }), A.N, A.N), 0, 0);
    return A;
  }
  const bagnato = t.alt[c] < t.mare || (t.lago && t.lago[c] > 0) || (t.depositato && t.depositato[c] > 3), mat = S.se.materiali || {};
  const conAnisotropia = (lista, base) => (lista && lista.length ? lista.map((x) => ({ nome: x.nome, frazione: x.frazione, colore: x.colore, anisotropia: 1.2 })) : base);
  // una PIANA DI SALE (mare.js: una conca dove l'acqua evapora tutta) è una crosta di cristalli cresciuti dalla salamoia
  let sale = null; if (S.mare?.esiste) { try { const q = luogoMare(S.mare, u * 360 - 180, 90 - v * 180); if (q.tipo === 'piana di sale') sale = q; } catch { sale = null; } }
  const neve = cl.neve > 0 && cl.freddo[ck] > 0.6, continente = !!(t.cont && t.cont[c]), etaP = S.P.interno?.eta ?? 4.5e9;
  let r, nome, larghezzaM, frase;
  if (neve) { r = fioccoDiNeve({ T: Math.max(238, Math.min(271, T)), umidita: cl.meteo?.umidita ? Math.max(0.3, Math.min(1, cl.meteo.umidita[ck])) : 0.86 + 0.14 * ((seme % 97) / 97), seme }); nome = `un cristallo di neve (${r.forma})`; larghezzaM = 0.004; frase = 'cresciuto dal vapore: la forma a sei viene dal reticolo del ghiaccio, i rami dall\'umidità'; }
  else if (sale) { r = cristallizza({ raffreddamento: 0.003, minerali: [{ nome: 'salgemma', frazione: 0.85, colore: [240, 236, 228], anisotropia: 0 }, { nome: 'gesso', frazione: 0.15, colore: [236, 230, 218], anisotropia: 0.6 }], seme }); nome = 'crosta di sale'; larghezzaM = 0.02; frase = 'cristalli cresciuti dalla salamoia di una conca dove l\'acqua evapora tutta: salgemma (cubi) e un po\' di gesso'; }
  else if (bagnato) { const e = Math.max(0.05, Math.min(1, Math.log10(1 + (t.flusso[c] || 0)) / 4)); r = sedimento({ energia: e, seme }); nome = e > 0.6 ? 'ghiaia e sabbia grossa' : e > 0.3 ? 'sabbia' : 'limo'; larghezzaM = 0.02 + 0.3 * e; frase = 'granelli portati e depositati dall\'acqua: più corre, più sono grossi e mescolati'; }
  else if (continente) { r = cristallizza({ raffreddamento: 0.003, minerali: conAnisotropia(mat.continente, GRANITO), seme }); nome = 'roccia dei continenti, a cristalli grossi'; larghezzaM = 0.04; frase = 'raffreddata lentamente in profondità: pochi cristalli, cresciuti a lungo'; }
  else { r = cristallizza({ raffreddamento: 0.15, minerali: conAnisotropia(mat.basalto, BASALTO), seme }); nome = 'basalto, a cristalli minuti'; larghezzaM = 0.004; frase = 'lava raffreddata in fretta in superficie: tanti cristalli piccoli'; }
  const N = r.N || Math.round(Math.sqrt(immagineRoccia(r).length / 4)), px = immagineRoccia(r);
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N });
  cv.getContext('2d').putImageData(new ImageData(px, N, N), 0, 0);
  // IL LUOGO PER LE PARTICELLE (materia.js): i minerali veri di quel punto, la sua temperatura, la quota, l'età della sua
  // roccia (i continenti hanno l'età del pianeta; il fondo degli oceani quella della sua crosta, dalla tettonica; sotto un
  // coperchio con vulcani la lava rifà la superficie ogni 1,1 miliardi di anni: le stesse regole di geologia.js)
  const etaRoccia = neve ? null : sale ? Math.max(1e3, sale.lago?.etaAnni ?? 1e4) : continente ? etaP : t.etaCrosta ? Math.max(1e4, 1e6 * t.etaCrosta[c]) : S.P.interno?.vulcani > 0 ? Math.min(etaP, 1e9 / 0.9) : etaP;
  const base = { lat: 90 - v * 180, lon: u * 360 - 180, T, quotaM: Math.max(0, t.alt[c] - (isFinite(t.mare) ? t.mare : t.alt[c])), raggi: cieloDi(cam.via) };
  let luogo;
  if (neve) luogo = luogoDaRoccia({ S, ghiaccio: true, ...base });
  else if (sale) { luogo = luogoDaRoccia({ S, continente: false, minerali: [{ nome: 'salgemma', frazione: 0.85 }, { nome: 'gesso', frazione: 0.15 }], etaRoccia, elementi: { K: 0, U: 0, Th: 0, Rb: 0 }, ...base }); luogo.accessori = []; luogo.nome = 'crosta di sale'; }
  else luogo = luogoDaRoccia({ S, continente, etaRoccia, ...base });
  const memoria = memoriaDelLuogo(luogo, sorgente(luogo.indirizzo, ramiCosmo(cam.via.cosmo)));
  // quale minerale sta in un punto dell'immagine (per scendere dentro QUEL cristallo)
  const mineraleIn = (x, y) => { if (r.tipo !== 'cristalli') return null; const m = r.minerale[Math.max(0, Math.min(N - 1, Math.floor(y * N))) * N + Math.max(0, Math.min(N - 1, Math.floor(x * N)))]; return m === 255 ? null : r.minerali[m]?.nome ?? null; };
  const sotto = memoria.tipo === 'alone' ? `un granello di ${memoria.granello} dentro la biotite, con il suo alone` : memoria.tipo === 'tracce' ? `le tracce di fissione in un granello di ${memoria.minerale}` : '';
  const out = { cv, nome, larghezzaM, frase: `${frase}. Avvicinati ancora: dentro c'è ${memoria.tipo ? `${sotto}, poi ` : ''}la stella che il cristallo disegna con le particelle, e i suoi atomi`, luogo, memoria, mineraleIn, neve, sale: !!sale };
  rocceFatte.set(k, out); if (rocceFatte.size > 24) rocceFatte.delete(rocceFatte.keys().next().value);
  return cam.passoRoccia > 0 ? passoRoccia(cam, S, out, k) : out;
}
// il cielo dei raggi cosmici di quella stella rispetto al Sole (materia.js: dal ritmo delle supernove della sua galassia)
const cieli = new Map();
function cieloDi(via) { const k = `${via.cosmo}|${via.galassia}`; if (!cieli.has(k)) { let c = { relativo: 1 }; try { c = cieloRelativo(galassia(via.cosmo, via.galassia)); } catch { /* resta quello del Sole */ } cieli.set(k, c); } return cieli.get(k); }
const telaN = (N) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N }));
const numero = (x, d = 2) => (Math.abs(x) >= 1e5 || (x !== 0 && Math.abs(x) < 0.01) ? fmtGrande(x) : x.toLocaleString('it-IT', { maximumSignificantDigits: d + 1 }));
// ---------- SOTTO LA ROCCIA (materia.js): il cristallo con ciò che ha registrato, i suoi atomi, la sua stella d'incanalamento.
// Ogni passo si calcola una volta e resta in memoria (l'incanalamento costa un decimo di secondo).
function passoRoccia(cam, S, base, k) {
  const L = base.luogo, mem = base.memoria, passo = cam.passoRoccia === 1 && !mem.tipo ? 2 : cam.passoRoccia;
  // il minerale in cui si scende: quello che si aveva sotto gli occhi, se la sua cella è nota; se no il più abbondante che lo sia
  const noto = (n) => n && RETICOLI[n], minerale = L.tipo === 'ghiaccio' ? 'ghiaccio d\'acqua' : noto(cam.mineraleRoccia) ? cam.mineraleRoccia : (L.minerali.find((m) => noto(m.nome)) || { nome: 'quarzo' }).nome;
  const kk = `${k}|passo ${passo}|${passo === 1 ? mem.tipo : minerale}`; if (rocceFatte.has(kk)) return rocceFatte.get(kk);
  const caso = sorgente(L.indirizzo, ramiCosmo(cam.via.cosmo)), il = (n) => (/^[aeiou]/.test(n) ? `l'${n}` : n === 'zircone' ? `lo ${n}` : ['biotite', 'calcite', 'monazite', 'olivina'].includes(n) ? `la ${n}` : `il ${n}`), del = (n) => il(n).replace(/^l'/, "dell'").replace(/^lo /, 'dello ').replace(/^la /, 'della ').replace(/^il /, 'del ');
  let px, N, nome, larghezzaM, frase, liscio = false;
  if (passo === 1 && mem.tipo === 'alone') {
    // l'alone: gli anelli escono dalle energie delle α della catena e dal loro percorso nella biotite
    const al = aloni(L, { ospite: mem.ospite, granello: mem.granello, raggioM: mem.raggioM, N: 192 }), cz = concentrazioni(L, mem.granello), forti = al.anelli.filter((a) => !a.debole), buio = Math.max(...al.profilo.oscuramento);
    px = al.immagine; N = al.N; larghezzaM = al.latoM; liscio = true; nome = `un alone nella biotite attorno a un granello di ${mem.granello}`;
    frase = `un granello di ${mem.granello} largo ${fmtLunghezza(2 * mem.raggioM)} dentro una lamella di biotite: concentra l'uranio (${numero(cz.U * 1e6)} ppm) e il torio (${numero(cz.Th * 1e6)} ppm) della roccia, e ogni particella α delle loro catene si ferma a una distanza fissa, dove annerisce la mica. Anelli a ${forti.map((a) => numero(a.raggioM * 1e6, 2)).join(', ')} µm dal centro (il più largo è ${del(forti[forti.length - 1]?.nuclidi[0] || 'polonio-214')}). Si accumula da ${fmtTempo(al.anni * 3.156e7)}: ${mem.perche}. In quel tempo il granello ha emesso ${fmtGrande(al.alfa)} α${buio > 0.95 ? ': il centro è saturo, restano i gradini più esterni' : buio < 0.08 ? ': troppo poche perché l\'alone si veda bene (ne servono ~10⁸)' : ''}`;
  } else if (passo === 1) {
    // le tracce di fissione sulla faccia di un granello: densità = età × uranio × costante di fissione × percorso
    const tf = tracceFossili(L, { minerale: mem.minerale, latoM: 200e-6, N: 256 }, caso), vecchia = tf.tracce.reduce((x, q) => Math.max(x, q.anniFa), 0);
    px = tf.immagine; N = tf.N; larghezzaM = tf.latoM; nome = `tracce di fissione ${/^[aeiou]/.test(mem.minerale) ? `nell'${mem.minerale}` : `nello ${mem.minerale}`}`;
    frase = `la faccia lucidata di un granello di ${mem.minerale} (${numero(tf.uranioPpm)} ppm di uranio): ogni segno è la scia di una fissione spontanea dell'uranio-238, due frammenti schiena contro schiena, ${fmtLunghezza(tf.percorsoM)} in tutto. ${fmtGrande(tf.densita)} tracce per cm² (qui ${tf.quante}${tf.quante > tf.tracce.length ? `, disegnate ${tf.tracce.length}` : ''}) accumulate in ${fmtTempo(tf.anni * 3.156e7)}: ${mem.perche}. La più vecchia di queste ha ${fmtTempo(vecchia * 3.156e7)}. È il metodo con cui si datano le rocce: densità = età × uranio × costante di fissione × percorso`;
  } else if (passo === 3) {
    const a = atomiDelReticolo(minerale, { latoM: 3e-9, T: L.T ?? 288 }, caso); N = 320; px = immagineAtomi(a, N); larghezzaM = a.latoM; liscio = true; nome = `gli atomi ${del(minerale.replace(' d\'acqua', ''))}`;
    frase = `${a.descrizione}. Le sfere hanno il raggio vero degli ioni e i colori dei modelli (${Object.keys(a.agitazione).map((e) => ({ O: 'ossigeno rosso', Si: 'silicio chiaro, piccolo, nascosto tra gli ossigeni', Na: 'sodio viola', Cl: 'cloro verde', K: 'potassio viola scuro', Ca: 'calcio verde chiaro', Mg: 'magnesio verde-giallo', Fe: 'ferro arancio', Al: 'alluminio grigio', C: 'carbonio grigio', H: 'idrogeno bianco' })[e] || e).join('; ')}); le più scure stanno più in profondità. È un'istantanea: un attimo dopo ogni atomo è spostato altrove attorno al suo posto. È il fondo dello zoom: un clic entra nella finestra, dove corrono le particelle di questo punto`;
  } else {
    // la particella: una α della radioattività di questa roccia (la più frequente); dove non ce n'è (ghiaccio, sale), un muone cosmico
    const src = sorgentiNaturali(L), alfa = src.processi.filter((q) => q.tipo === 'α').sort((p, q) => q.perKg - p.perKg)[0], E = alfa ? alfa.energia : Math.max(200, src.cosmici.energiaMuoni * 1000);
    const r = incanalamento(minerale, alfa ? 'alfa' : 'muone+', E, null, { T: L.T ?? 288, N: 40, punti: 12 }); px = r.immagine; N = r.N; liscio = true; larghezzaM = 2 * r.campoRad; nome = `la stella d'incanalamento ${del(minerale.replace(' d\'acqua', ''))}`;
    frase = `${r.descrizione} La particella è ${alfa ? `una α ${del(alfa.nuclide)} di questa stessa roccia (${numero(alfa.perKg)} al secondo per chilo)` : `un muone cosmico da ${numero(E / 1000)} GeV (qui non c'è radioattività che dia α)`}. La figura è in angoli: su uno schermo a un metro dal cristallo sarebbe larga ${fmtLunghezza(2 * r.campoRad)} (la barra). La simmetria la decide il reticolo di questo minerale, non chi guarda. Avvicinati ancora: gli atomi di quel reticolo`;
  }
  const cv = telaN(N); cv.getContext('2d').putImageData(new ImageData(px, N, N), 0, 0);
  const out = { cv, nome, larghezzaM, frase, liscio, passo, base, luogo: L, memoria: mem, minerale };
  rocceFatte.set(kk, out); if (rocceFatte.size > 24) rocceFatte.delete(rocceFatte.keys().next().value);
  return out;
}
// le tracce di una cella simulata, disegnate su una tela (per l'evento nell'acqua): ogni specie il suo colore
const COLORE_TRACCIA = (n) => (n === 'alfa' ? '255,190,90' : n.startsWith('frammento') ? '255,96,96' : n === 'fotone Cherenkov' ? '110,160,255' : n.startsWith('muone') ? '245,245,245' : n === 'elettrone' || n === 'positrone' ? '120,255,160' : n.startsWith('protone') ? '255,240,120' : '255,150,220');
function disegnaTracce(cv, cella, tracce) {
  const N = cv.width, x = cv.getContext('2d'), k = N / cella.larghezza; x.fillStyle = '#0a1420'; x.fillRect(0, 0, N, N); x.lineCap = 'round';
  for (const t of tracce) { if (t.sagoma) continue; const n = t.specie.nome, P = t.punti; x.strokeStyle = `rgba(${COLORE_TRACCIA(n)},${n === 'fotone Cherenkov' ? 0.55 : 0.95})`;
    for (let i = 1; i < P.length; i++) { if (!P[i][2] || !P[i - 1][2]) continue; x.lineWidth = Math.max(1.2, P[i][4] * k); x.beginPath(); x.moveTo(P[i - 1][0] * k, P[i - 1][1] * k); x.lineTo(P[i][0] * k, P[i][1] * k); x.stroke(); } }
}
// il luogo di un punto d'acqua per le particelle: i sali veri di quel punto (il potassio sciolto), la sua temperatura
function luogoAcqua(cam, S, u, v, profondo) {
  const lon = u * 360 - 180, lat = 90 - v * 180; let qui = null; try { qui = luogoMare(S.mare, lon, lat, { profondita: 0, acqua: true, fondoM: profondo }, sorgente(`${S.k}/acqua/${u.toFixed(6)}/${v.toFixed(6)}`)); } catch { qui = null; }
  return luogoDaAcqua({ S, lat, lon, profonditaM: 0, T: qui?.T, totali: qui?.totali || S.mare.totali, raggi: cieloDi(cam.via) });
}
// ---------- SOTTO LE MOLECOLE DELL'ACQUA: l'evento vero. In un nanometro cubo non accade niente per tempi lunghissimi; si
// guarda allora il prossimo evento di quell'acqua alla SUA scala (millimetri per un elettrone del potassio-40), simulato
// dal motore con la sua data: è la stessa cella in cui si entra con un clic.
function eventoNellAcqua(cam, S, k, u, v, profondo) {
  const ke = `${k}|evento`; if (rocceFatte.has(ke)) return rocceFatte.get(ke);
  const L = luogoAcqua(cam, S, u, v, profondo), r = cellaMateria(L, { via: { ...cam.via } }, sorgente(L.indirizzo, ramiCosmo(cam.via.cosmo))), tracce = simulaMondo(r.cella), cv = telaN(384); disegnaTracce(cv, r.cella, tracce);
  const nano = sorgentiNaturali(L).attesa(1e-9).find((a) => a.id === r.racconto.veri.processo);
  const out = { cv, acqua: true, evento: true, liscio: true, nome: `acqua: ${r.cella.sorgenti[0].origine}`, larghezzaM: r.cella.scala.latoM, luogo: L, punto: { u, v, profondo },
    frase: `${r.racconto.frasi[1]} ${r.racconto.frasi[2]} In un nanometro cubo, come quello delle molecole qui sopra, lo stesso evento accade una volta ogni ${nano ? fmtTempo(nano.secondi) : 'tempo lunghissimo'}: per questo lo si guarda alla sua scala (${fmtLunghezza(r.cella.scala.latoM)}: la barra). Verde l'elettrone, azzurra la luce Cherenkov, bianco un muone` };
  rocceFatte.set(ke, out); if (rocceFatte.size > 24) rocceFatte.delete(rocceFatte.keys().next().value);
  return out;
}
// ---------- GLI ATOMI IN TRE DIMENSIONI (atomi3d.js). Ai livelli più profondi la materia non è più un'immagine: chi monta
// la vista (laboratorio.js) chiede qui se dove si sta guardando c'è una scena di atomi, e quale. Nell'acqua, sotto i dieci
// nanometri: le molecole e gli ioni veri di quel punto (mare.js, scenaMolecolare: gli stessi conteggi del campione).
// Nella roccia, all'ultimo passo: tre nanometri del reticolo del minerale che si aveva sotto gli occhi, con l'agitazione
// termica di Debye-Waller alla temperatura di lì. → null, oppure { chiave, crea() → scena, acqua, che }
export function scenaAtomi(cam) {
  if (cam.livello !== 5) return null; const r = rocciaDi(cam), S = superficieDi(cam.via); if (!r || !S) return null;
  if (cam.suAcqua) {
    const lato = cam.latoAcqua ?? 1; if (cam.eventoAcqua || lato > 1.0001e-8 || !r.punto) return null; const { u, v, profondo } = r.punto;
    return { acqua: true, chiave: `${S.k}|${u.toFixed(7)}|${v.toFixed(7)}|acqua3d|${lato}`, che: `le molecole e gli ioni di quest'acqua in un cubetto di ${fmtLunghezza(lato)}`,
      crea: () => conMoto(scenaMolecolare(S.mare, { lon: u * 360 - 180, lat: 90 - v * 180, profondita: 0, latoM: lato, acqua: true, fondoM: profondo }, sorgente(`${S.k}/acqua/${u.toFixed(6)}/${v.toFixed(6)}`))) };
  }
  if (cam.passoRoccia !== 3 || !r.minerale || !r.luogo) return null;
  return { acqua: false, chiave: `${r.luogo.indirizzo}|atomi3d|${r.minerale}`, che: `tre nanometri di ${r.minerale.replace(" d'acqua", '')}`,
    crea: () => { const a = atomiDelReticolo(r.minerale, { latoM: 3e-9, spessoreM: 3e-9, T: r.luogo.T ?? 288, massimo: 40000, fermi: true }, sorgente(r.luogo.indirizzo, ramiCosmo(cam.via.cosmo))), sc = scenaDaElenco(a.atomi, { unita: 'm', nome: r.nome });
      // l'agitazione vera di ogni atomo (in metri, come le posizioni): la vista li fa tremare attorno al loro posto
      sc.atomi.agitazione = Float32Array.from(a.atomi, (q) => (a.agitazione[q.el] || 0) * 1e-10); sc.descrizione = a.descrizione; return sc; } };
}
// che cosa si apre con un clic in fondo allo zoom: il luogo e il modo di guardarlo (laboratorio.js, entraMateria)
function materiaDelPunto(cam) {
  const r = rocciaDi(cam); if (!r) return null;
  if (r.acqua) { const S = superficieDi(cam.via); if (!S || !r.punto) return null; r.luogo ??= luogoAcqua(cam, S, r.punto.u, r.punto.v, r.punto.profondo); return { luogo: r.luogo, opzioni: {}, che: "il prossimo evento vero in quest'acqua, al suo istante" }; }
  const base = r.base || r, mem = base.memoria; if (!base.luogo) return null;
  return mem?.tipo ? { luogo: base.luogo, opzioni: { modo: 'memoria', ospite: mem.ospite, granello: mem.granello }, che: mem.tipo === 'alone' ? `le α che il granello di ${mem.granello} ha lanciato nella biotite in ${fmtTempo(mem.anni * 3.156e7)}` : `le fissioni che ${mem.minerale === 'apatite' ? "l'apatite" : `lo ${mem.minerale}`} ha registrato in ${fmtTempo(mem.anni * 3.156e7)}` }
    : { luogo: base.luogo, opzioni: {}, che: 'il prossimo evento vero in questo punto, al suo istante' };
}

// ---------- LA FINESTRA OVUNQUE. La finestra non è una cosa a parte: è un punto di osservazione qualsiasi del mondo,
// a qualsiasi scala. Qui si cerca, attorno a dove si sta guardando e alla stessa scala (un po' più vicino, un po' più
// lontano), il punto di vista dove il mondo disegna di più: si prova un certo numero di inquadrature, si guarda ciò che
// c'è davvero in ognuna e si misura il disegno (sezione.js, bellezzaImmagine). I posti provati dipendono solo da dove
// si è (stesso luogo, stessa ricerca, stesso risultato): niente è aggiunto, il disegno c'era già.
export function cercaFinestra(cam, W, H, { prove = 28 } = {}) {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const m = minimo(W, H), n = 176, hN = Math.max(64, Math.round((n * H) / W)), cv = new OffscreenCanvas(n, hN), ctx = cv.getContext('2d', { willReadFrequently: true });
  const caso = sorgente(`finestra/${JSON.stringify(cam.via)}/livello ${cam.livello}/${cam.cx.toPrecision(5)}/${cam.cy.toPrecision(5)}/${cam.z.toPrecision(3)}`);
  const zMin = cam.livello === 4 ? 0.95 * m : cam.livello === 5 ? 0.5 * m : cam.z / 3, zMax = cam.livello === 4 ? 5.5e6 : cam.livello === 5 ? 11 * m : cam.z * 3;
  let meglio = null;
  for (let q = 0; q < prove; q++) {
    const kz = q ? Math.exp(caso.tra(`prova ${q}/scala`, -0.9, 0.9)) : 1, z = Math.max(zMin, Math.min(zMax, cam.z * kz));
    const c = { ...cam, z, cx: cam.cx + (q ? (caso.tra(`prova ${q}/x`, -1.2, 1.2) * W) / cam.z : 0), cy: cam.cy + (q ? (caso.tra(`prova ${q}/y`, -1.2, 1.2) * H) / cam.z : 0) };
    if (cam.livello === 4) { c.cx = ((c.cx % 1) + 1) % 1; c.cy = Math.max(0.02, Math.min(0.48, c.cy)); }
    if (cam.livello === 5) { c.cx = Math.max(0.1, Math.min(0.9, c.cx)); c.cy = Math.max(0.1, Math.min(0.9, c.cy)); }
    disegnaMappa(ctx, n, hN, { ...c, z: (c.z * n) / W }, { nudo: true, dpr: 1 });
    const b = bellezzaImmagine(ctx.getImageData(0, 0, n, hN).data, n, hN);
    if (!meglio || b.totale > meglio.bellezza.totale) meglio = { cx: c.cx, cy: c.cy, z: c.z, bellezza: b, prova: q };
  }
  return meglio;
}

