// geologia.js — l'interno e la superficie di un pianeta, che emergono da massa, composizione ed età.
//
// INTERNO. Un pianeta giovane è caldo e fuso: il ferro, pesante, scende e fa il
// nucleo; la roccia resta sopra (mantello); in cima si separa una crosta leggera.
// Le proporzioni vengono dalla composizione. Il calore che esce dall'interno è
// quello del decadimento radioattivo (uranio, torio, potassio: tanti più quanto
// più la stella era ricca di metalli), che cala con l'età.
// LA DINAMO. Il campo magnetico nasce solo se il nucleo è ancora liquido e il
// calore lo rimescola: un pianeta piccolo o vecchio si raffredda, il nucleo si
// ferma e il campo sparisce (Marte). La forza segue la legge di scala delle dinamo
// (Christensen): B ∝ ρ^(1/6)·(flusso)^(1/3), poi cala come (R_nucleo/R)³ fino in
// superficie. Tarata sulla Terra.
// TETTONICA. Se il mantello è abbastanza caldo da spingere e la crosta abbastanza
// debole da rompersi (l'acqua la indebolisce), la crosta si spezza in placche; se
// no resta un coperchio unico. Dove le placche si scontrano si alzano montagne,
// dove si separano si aprono dorsali e vulcani.
// SUPERFICIE. Il rilievo nasce dalle placche; l'acqua che il pianeta ha riempie
// i punti più bassi (mari e laghi emergono da quanta acqua c'è); dove piove l'acqua
// scende lungo la pendenza più ripida e si raccoglie: i fiumi e le loro valli.

import { celle } from './fluidi.js';
import { minerali, coloreRoccia } from './chimica.js';
import { evolviTettonica } from './tettonica.js';
import { acquaInSuperficie } from './leggi.js';
const TERRA = { M: 5.97e24, R: 6.371e6, q: 0.087, Rc: 3.48e6, rhoC: 11000 };

export function interno(P, stella) {
  if (P.tipo === 'gassoso') {
    // nei giganti la dinamo è nell'idrogeno metallico: cresce con la massa (Giove ~ 4·10⁻⁴ T)
    const B0 = 4.2e-4 * Math.pow(P.massaKg / 1.9e27, 0.6);
    return { nucleo: 0.1, mantello: 'idrogeno metallico', crosta: 0, q: 5, dinamo: true, B0, tettonica: 'nessuna (è un gas)', vulcani: 0 };
  }
  const ferro = P.composizione.ferro ?? 0.1, eta = stella?.eta ?? 4.5e9, Z = stella?.Z ?? 1;
  const M = P.massaKg, R = P.raggioM, rhoMedia = M / ((4 / 3) * Math.PI * R ** 3);
  const Rc = R * Math.cbrt((ferro * rhoMedia) / TERRA.rhoC);
  // il calore: radioattività (più metalli, più calore) che cala con l'età, più il calore iniziale che resta
  const q = TERRA.q * (M / TERRA.M) / (R / TERRA.R) ** 2 * Math.sqrt(Math.max(0.05, Z)) * Math.exp(-(eta - 4.5e9) / 3e9) * Math.pow(M / TERRA.M, 0.3);
  // il nucleo resta liquido se il pianeta è abbastanza grande da non essersi raffreddato (tempo ∝ R²)
  const nucleoLiquido = q > 0.025 && R > 3.5e6;
  const B0 = nucleoLiquido ? 3.1e-5 * Math.pow(q / TERRA.q, 1 / 3) * Math.pow((Rc / R) / (TERRA.Rc / TERRA.R), 3) * Math.pow(Rc / TERRA.Rc, 0.5) : 1e-9;
  const acqua = acquaInSuperficie(P).frazione > 0.005;
  const tettonica = q > 0.05 && acqua && M > 0.3 * TERRA.M ? 'a placche' : q > 0.02 ? 'coperchio unico, con vulcani' : 'ferma';
  return { eta, nucleo: Rc / R, crosta: Math.min(0.02, 0.004 * Math.pow(q / TERRA.q, 0.5)), q, dinamo: nucleoLiquido, B0, tettonica, vulcani: q > 0.02 ? Math.round(q / 0.02) : 0 };
}

// ---------- la superficie: una mappa equirettangolare (longitudine × latitudine) di quote in metri
const memo = new Map();
export function superficiePianeta(chiave, P, int, seme, { W = 256, H = 128 } = {}) {
  if (memo.has(chiave)) return memo.get(chiave);
  let s = seme % 2147483647 || 1; const caso = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const sfera = (i, j) => { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI; return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]; };
  const casuale = () => { const z = 2 * caso() - 1, a = caso() * 2 * Math.PI, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // LA TETTONICA EVOLVE NEL TEMPO (tettonica.js). Il mantello scaldato dal basso si organizza in celle che
  // cambiano lentamente; la crosta dei continenti, leggera, è trascinata: si spacca dove il mantello sale, deriva,
  // e dove due masse si scontrano si ispessisce in catene di montagne; la crosta degli oceani nasce alle dorsali,
  // invecchia allontanandosi (e il fondo sprofonda come la radice dell'età) e affonda nelle fosse. Le quote
  // vengono dal galleggiamento: la crosta spessa sta alta. Forma, numero e storia dei continenti non sono scelti.
  const alt = new Float32Array(W * H), quale = new Int16Array(W * H), spinta = new Float32Array(W * H);
  const aPlacche = int.tettonica === 'a placche';
  const tt = aPlacche ? evolviTettonica({ W, H, raggioM: P.raggioM, nucleo: int.nucleo, q: int.q, eta: int.eta ?? 4.5e9, acqua: true, seme, placche: true }) : null;
  const cont = tt ? tt.cont : new Uint8Array(W * H), placche = tt ? tt.celle : 1;
  // un rumore liscio (somma di onde sulla sfera) per le irregolarità del terreno
  const onde = Array.from({ length: 24 }, (_, k) => ({ d: casuale(), f: 2 + k * 0.7, fi: caso() * 6.28, a: 1 / (1 + k * 0.35) }));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const p = sfera(i, j), k = j * W + i;
    let r = 0; for (const o of onde) r += o.a * Math.sin(o.f * dot(p, o.d) * 3 + o.fi);
    alt[k] = tt ? tt.alt[k] + r * 180 : -1500 + r * 700;
    if (tt) spinta[k] = tt.spinta[k]; // l'OROGENESI: dove oggi la crosta è compressa e i monti crescono
  }
  // GLI IMPATTI. Per tutta la sua vita il pianeta è colpito: moltissimo da giovane, poi sempre meno; molti
  // crateri piccoli e pochi grandi; un'atmosfera densa brucia i corpi piccoli. Quanti se ne vedono ancora
  // dipende da quanto la superficie si rinnova: un mondo fermo e senz'aria li conserva tutti (la Luna), uno
  // con tettonica, vulcani e pioggia li cancella quasi tutti (la Terra). L'erosione, dopo, fa il resto.
  const etaG = (int.eta ?? 4.5e9) / 1e9, aria = isFinite(P.clima?.pressione) ? P.clima.pressione / 1e5 : 100;
  const rinnovo = (aPlacche ? 3 : int.vulcani > 0 ? 1 : 0) + (aria > 0.01 && (int.acquaKg || 0) > 0 ? 1.5 : 0);
  const conservati = Math.exp(-rinnovo * Math.min(4, etaG) * 0.9), nCrateri = Math.round(900 * (1 - Math.exp(-etaG / 1.2)) * conservati);
  for (let n = 0; n < nCrateri; n++) {
    const raggio = Math.min(22, 1.2 * Math.pow(1 - caso() * 0.985, -1 / 1.8)); if (raggio < 2.2 && aria > 0.5) { caso(); caso(); continue; } // (in celle; i piccoli bruciano nell'aria)
    const ci = Math.floor(caso() * W), cj = Math.floor(caso() * H), prof = 180 * raggio, R2 = Math.ceil(raggio * 1.6), allarga = 1 / Math.max(0.2, Math.cos(Math.PI / 2 - ((cj + 0.5) / H) * Math.PI));
    for (let dj = -R2; dj <= R2; dj++) { const y = cj + dj; if (y < 0 || y >= H) continue; for (let di = -Math.ceil(R2 * allarga); di <= R2 * allarga; di++) { const d = Math.hypot(di / allarga, dj) / raggio; if (d > 1.6) continue; const k = y * W + ((ci + di + W * 4) % W); alt[k] += d < 1 ? -prof * (1 - d * d) + (raggio > 9 && d < 0.18 ? prof * 0.5 : 0) : prof * 0.28 * Math.exp(-(d - 1) * 5); } }
  }
  // i vulcani: sopra i pennacchi caldi del mantello e lungo i confini che si aprono
  const vulcani = [];
  for (let k = 0; k < int.vulcani; k++) { const p = casuale(), lat = Math.asin(p[2]), lon = Math.atan2(p[1], p[0]); const i = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * W) % W, j = Math.min(H - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * H)); vulcani.push([i, j]); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const jj = j + dj, ii = (i + di + W) % W; if (jj >= 0 && jj < H) alt[jj * W + ii] += 2500 * Math.exp(-(di * di + dj * dj) / 3); } }
  // il mare: l'acqua del pianeta riempie i punti più bassi (si cerca il livello che contiene quel volume)
  const area = (j) => Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI) * (2 * Math.PI * P.raggioM ** 2 * (Math.PI / H)) / W;
  const volumeAcqua = int.acquaKg / 1000 || 0;
  let lo = Infinity, hi = -Infinity, areaTutta = 0, capienza = 0;
  for (let j = 0; j < H; j++) { const A = area(j); for (let i = 0; i < W; i++) { const h = alt[j * W + i]; if (h < lo) lo = h; if (h > hi) hi = h; areaTutta += A; capienza -= h * A; } }
  capienza += hi * areaTutta; // quanta acqua sta sotto la cima più alta
  // se l'acqua è più di quanta il rilievo ne contiene, copre tutto: un GUSCIO d'acqua (oceano o ghiaccio, lo decide il
  // clima) spesso anche centinaia di chilometri, e il rilievo è il suo fondo. È il caso dei mondi ghiacciati. (Lo
  // spessore è contato come su un piano: per un guscio profondo quanto una parte del raggio è una stima.)
  let mare = -Infinity;
  if (volumeAcqua >= capienza) mare = hi + (volumeAcqua - capienza) / areaTutta;
  else if (volumeAcqua > 0) {
    for (let it = 0; it < 44; it++) { const m = (lo + hi) / 2; let v = 0; for (let j = 0; j < H; j++) { const A = area(j); for (let i = 0; i < W; i++) { const h = alt[j * W + i]; if (h < m) v += (m - h) * A; } } if (v > volumeAcqua) hi = m; else lo = m; }
    mare = lo;
  }
  // i fiumi: la pioggia scende lungo la pendenza più ripida; dove se ne raccoglie molta c'è un fiume
  const flusso = new Float32Array(W * H).fill(1), ordine = [...alt.keys()].sort((a, b) => alt[b] - alt[a]), giu = new Int32Array(W * H).fill(-1);
  for (const k of ordine) {
    const i = k % W, j = (k - i) / W; let best = -1, bh = alt[k];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const jj = j + dj; if (jj < 0 || jj >= H || (!di && !dj)) continue; const kk = jj * W + ((i + di + W) % W); if (alt[kk] < bh) { bh = alt[kk]; best = kk; } }
    giu[k] = best; if (best >= 0 && alt[k] > mare) flusso[best] += flusso[k];
  }
  // di che cosa è fatta la superficie: crosta leggera (continenti) o basalto; quanto ferro, e se l'acqua l'ha ossidato
  const materiali = { ferro: P.composizione.ferro ?? 0.1, ghiacciato: P.tipo === 'ghiacciato', ossidato: (int.acquaKg || 0) > 0 || (isFinite(P.clima?.pressione) && P.clima.pressione > 100) };
  // i MINERALI (chimica.js): di che cosa sono fatte la crosta dei continenti e quella vulcanica, dalla
  // composizione del pianeta, dalla temperatura, dall'ossigeno e dall'acqua; il colore è il loro
  try {
    const base = { composizione: P.composizione, T: P.clima?.T ?? P.clima?.Teq ?? 280, ossidato: materiali.ossidato, acqua: (int.acquaKg || 0) > 0 };
    materiali.continente = minerali({ ...base, continente: true }); materiali.basalto = minerali({ ...base, continente: false });
    materiali.coloreContinente = coloreRoccia(materiali.continente); materiali.coloreBasalto = coloreRoccia(materiali.basalto);
  } catch { /* senza chimica restano i colori di riserva */ }
  const out = { W, H, alt, mare, flusso, vulcani, placche, quale, cont, materiali, spinta, crateri: nCrateri, crateriConservati: conservati };
  memo.set(chiave, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}

// i colori: profondità del mare, terre secondo quota e temperatura, ghiaccio dove fa freddo, fiumi
export function immagineSuperficie(sf, T, cl = null) {
  const { W, H, alt, mare, flusso } = sf, px = new Uint8ClampedArray(W * H * 4);
  // il clima (a risoluzione più bassa) interpolato dolcemente sulla mappa
  const [ru0, rv0, ru1, rv1] = sf.rett || [0, 0, 1, 1], divOmbra = Math.max(6, 900 * Math.pow(0.36, sf.livello || 0));
  const campo = (arr, i, j) => { if (!cl) return null; const x = (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * cl.W - 0.5, y = Math.min(cl.H - 1.001, Math.max(0, (rv0 + ((j + 0.5) / H) * (rv1 - rv0)) * cl.H - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => arr[yy * cl.W + ((xx % cl.W) + cl.W) % cl.W]; return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, h = alt[k], lat = Math.abs(90 - ((j + 0.5) / H) * 180);
    // la temperatura del punto: quella del clima, corretta per la sua quota vera (6,5 °C ogni km): la neve sui monti
    const su = cl && h >= mare ? (Math.max(h, mare) - Math.max(campo(cl.quota, i, j), mare)) / 1000 : 0;
    const Tloc = cl ? campo(cl.media, i, j) - 6.5 * su : T - 0.45 * lat - Math.max(0, h) * 0.0065;
    const gelo = cl ? Math.min(1, Math.max(0, campo(cl.freddo, i, j), h >= mare ? ((cl.neve ?? 1) * (268 - Tloc)) / 12 : 0)) : Tloc < 265 ? 1 : 0;
    let c;
    if (h < mare || (sf.lago && sf.lago[k] > 0)) { const d = Math.min(1, ((h < mare ? mare - h : sf.lago[k] * 3)) / 5000); c = [20 + 30 * (1 - d), 60 + 60 * (1 - d), 110 + 80 * (1 - d)]; }
    else {
      // il colore è quello dei materiali: basalto scuro (crosta nuova, vulcanica), roccia chiara dei continenti,
      // il rosso del ferro ossidato dall'acqua e dall'aria, il ghiaccio sporco dei mondi ghiacciati, i sedimenti
      // pallidi dove i fiumi depositano. Nessun verde: la vegetazione ci sarà solo se la vita emergerà.
      const e = Math.min(1, (h - Math.max(0, mare)) / 4000), mat = sf.materiali || { ferro: 0.25, ossidato: true }, continente = sf.cont ? sf.cont[k] : 1;
      if (mat.coloreContinente) c = (continente ? mat.coloreContinente : mat.coloreBasalto).slice(); // il colore dei minerali veri
      else { c = mat.ghiacciato ? [172, 180, 186] : continente ? [148, 138, 124] : [84, 80, 76]; if (mat.ossidato && !mat.ghiacciato) { const r = Math.min(0.65, Math.max(0, (mat.ferro - 0.12) * 2.4)); c = [c[0] + (170 - c[0]) * r, c[1] + (98 - c[1]) * r, c[2] + (66 - c[2]) * r]; } }
      if (sf.depositato && sf.depositato[k] > 3) { const d = Math.min(0.6, sf.depositato[k] / 60); c = [c[0] + (196 - c[0]) * d, c[1] + (182 - c[1]) * d, c[2] + (150 - c[2]) * d]; } // sedimenti: pianure e delta
      c = c.map((x) => x * (0.82 + 0.3 * e)); if (flusso[k] > (sf.passiErosione ? 18 * Math.pow(4, sf.livello || 0) : 60) && gelo < 0.5) c = [60, 110, 170]; }
    // il ghiaccio copre in proporzione a quanta parte dell'anno quel punto passa sotto lo zero: bordi sfumati
    const g = Math.pow(gelo, 0.7), ice = [232, 238, 244];
    const ombra = h >= mare ? Math.max(0.6, Math.min(1.25, 1 + (alt[j * W + ((i + W - 1) % W)] - alt[k] + alt[Math.max(0, j - 1) * W + i] - alt[k]) / divOmbra)) : 1;
    px.set([(c[0] + (ice[0] - c[0]) * g) * ombra, (c[1] + (ice[1] - c[1]) * g) * ombra, (c[2] + (ice[2] - c[2]) * g) * ombra, 255], k * 4);
  }
  for (const [i, j] of sf.vulcani) px.set([200, 60, 30, 255], (j * W + i) * 4);
  return px;
}

// ---------- IL CLIMA come equilibrio di energia che evolve nel tempo (modello di Budyko-Sellers, su una
// griglia sulla sfera). In ogni punto: C·∂T/∂t = luce assorbita − luce irradiata + calore portato dai vicini.
//   · la luce: quella della stella a quella latitudine e in quella stagione (l'asse è inclinato); se il
//     pianeta è bloccato, sempre la stessa faccia al sole e mai le stagioni;
//   · irradiata: σT⁴, trattenuta dall'effetto serra della sua atmosfera;
//   · il ghiaccio riflette più luce dell'acqua e della roccia: dove fa freddo si raffredda ancora (il
//     ghiaccio si fa avanzare da sé); il mare si scalda e si raffredda lentamente, la terra in fretta;
//   · il calore scorre dal caldo al freddo, tanto più quanto più l'atmosfera è densa.
// Si parte caldo, come un pianeta appena nato, e si lascia evolvere per molti anni: quello che resta è il suo clima
// (se il ghiaccio, riflettendo, prende il sopravvento, il pianeta scivola in una glaciazione totale).
const memoClima = new Map();
export function climaSuperficie(chiave, P, sf, { W = 64, H = 32, anni = 14, passiAnno = 240 } = {}) {
  if (memoClima.has(chiave)) return memoClima.get(chiave);
  const sigma = 5.67e-8, S0 = P.Lw / (4 * Math.PI * P.aM * P.aM), tau = isFinite(P.clima.pressione) ? 0.8 * Math.pow(P.clima.pressione / 1e5, 0.6) : 2;
  const D = isFinite(P.clima.pressione) ? 0.6 * Math.pow(Math.max(1e-4, P.clima.pressione / 1e5), 0.5) : 1, kx = sf.W / W, ky = sf.H / H;
  const terra = new Uint8Array(W * H), quota = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let h = 0; for (let b = 0; b < ky; b++) for (let a = 0; a < kx; a++) h += sf.alt[(j * ky + b) * sf.W + i * kx + a]; h /= kx * ky; quota[j * W + i] = h; terra[j * W + i] = h >= sf.mare ? 1 : 0; }
  const lat = (j) => Math.PI / 2 - ((j + 0.5) / H) * Math.PI, dphi = Math.PI / H, dlam = (2 * Math.PI) / W;
  // un pianeta nasce caldo (gli urti che l'hanno formato) e si raffredda: si parte da lì, non dal freddo. Per un mondo
  // lontano dalla sua stella «caldo» vuol dire un quarto sopra la temperatura a cui lo porterebbe la sola luce (Tfine:
  // quanto basta per essere sopra qualunque equilibrio, anche senza ghiaccio né nuvole), non 310 K
  const Tfine = Math.max(30, P.clima.Teq * Math.pow(1 + 0.75 * tau, 0.25));
  const T = new Float32Array(W * H).fill(Math.max(P.clima.Teq, Math.min(310, 1.25 * Tfine))), nuovo = new Float32Array(W * H), freddo = new Float32Array(W * H), media = new Float32Array(W * H);
  const C = (k) => (terra[k] ? 1e7 : 1e8), anno = P.anno, eps = (P.obliquita * Math.PI) / 180;
  // il ghiaccio ha bisogno di acqua: su un pianeta senza mari al freddo resta solo un po' di brina;
  // dove c'è acqua che evapora e un'atmosfera che la tiene si formano le nuvole, che riflettono la luce
  let mareFraz = 0; for (let k = 0; k < W * H; k++) mareFraz += 1 - terra[k]; mareFraz /= W * H;
  // senza acqua niente ghiaccio; piove solo se c'è acqua che evapora e un'aria che la porta. Le nuvole coprono fino a metà
  // cielo e rimandano indietro il 38% della luce che le colpisce (TARATO sulla Terra: così riflette in tutto 0,30)
  const acquaPerGhiaccio = mareFraz > 0 ? Math.min(1, 0.15 + 2.5 * mareFraz) : 0, piove = mareFraz > 0.005 && isFinite(P.clima.pressione) && P.clima.pressione > 100, nuvole = mareFraz > 0.02 && isFinite(P.clima.pressione) && P.clima.pressione > 1e4 ? 0.5 * Math.min(1, mareFraz * 2 + 0.3) : 0;
  const albedo = (k, t) => { const ghiaccio = acquaPerGhiaccio * 0.5 * (1 - Math.tanh((t - (terra[k] ? 268 : 266)) / 4)), suolo = ghiaccio * 0.62 + (1 - ghiaccio) * (terra[k] ? 0.25 : 0.08), caldo = t > 268 ? nuvole : nuvole * 0.4; return suolo + caldo * 0.38 * (1 - suolo); };
  const luce = (j, i, f) => {
    const ph = lat(j);
    if (P.bloccato) { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, cz = Math.cos(ph) * Math.cos(lon); return S0 * Math.max(0, cz); }
    const del = eps * Math.sin(2 * Math.PI * f), x = -Math.tan(ph) * Math.tan(del), h0 = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x);
    return (S0 / Math.PI) * (h0 * Math.sin(ph) * Math.sin(del) + Math.cos(ph) * Math.cos(del) * Math.sin(h0));
  };
  // IL TEMPO. Il passo è un 240-esimo d'anno (le stagioni si vedono). Perché l'energia si conservi con qualunque
  // passo, anche lungo rispetto al tempo in cui la terraferma si scalda:
  //  · la luce irradiata è linearizzata attorno alla temperatura di adesso (σT⁴ + 4σT³·ΔT): la cella va verso il
  //    suo equilibrio senza scavalcarlo;
  //  · il calore portato dai vicini è calcolato in modo implicito (con le temperature nuove), prima lungo i
  //    paralleli e poi lungo i meridiani: ciò che esce da una cella entra nella vicina, niente si crea.
  // Quanto dura: abbastanza perché il mare dimentichi la temperatura di partenza (otto volte il suo tempo di risposta
  // C/(4σT³); dodici se è bloccato: il ghiaccio della faccia buia avanza piano). Se quattordici anni non bastano (anni corti, o mondi freddi coperti d'acqua), nei primi dieci il passo
  // si allunga quanto serve (le stagioni scorrono al rallentatore: la media è quella giusta) e gli ultimi quattro
  // sono anni veri; un pianeta bloccato non ha stagioni, e lì il passo è lungo sempre.
  const serra = 1 + 0.75 * tau, memoria = ((mareFraz > 0 ? 1e8 : 1e7) * serra) / (4 * sigma * Tfine ** 3), veri = Math.min(4, anni - 1);
  const totale = anni * passiAnno, lenti = P.bloccato ? totale : (anni - veri) * passiAnno, dtVero = anno / passiAnno;
  const dtLento = dtVero * Math.max(1, P.bloccato ? (12 * memoria) / (anni * anno) : (8 * memoria - veri * anno) / ((anni - veri) * anno));
  const cosLat = new Float64Array(H), cosN = new Float64Array(H), cosS = new Float64Array(H), sole = new Float64Array(W * H), soleJ = new Float64Array(H);
  for (let j = 0; j < H; j++) { cosLat[j] = Math.cos(lat(j)); cosN[j] = Math.max(0, Math.cos(lat(j) + dphi / 2)); cosS[j] = Math.max(0, Math.cos(lat(j) - dphi / 2)); }
  if (P.bloccato) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) sole[j * W + i] = luce(j, i, 0);
  // un sistema a tre diagonali (sotto·x[i−1] + diag·x[i] + sopra·x[i+1] = noto), anche chiuso ad anello
  const M = Math.max(W, H), sotto = new Float64Array(M), diag = new Float64Array(M), sopra = new Float64Array(M), noto = new Float64Array(M), x = new Float64Array(M), z = new Float64Array(M), u = new Float64Array(M), cp = new Float64Array(M);
  const risolvi = (d, r, m, out) => { cp[0] = sopra[0] / d[0]; out[0] = r[0] / d[0]; for (let i = 1; i < m; i++) { const q = d[i] - sotto[i] * cp[i - 1]; cp[i] = sopra[i] / q; out[i] = (r[i] - sotto[i] * out[i - 1]) / q; } for (let i = m - 2; i >= 0; i--) out[i] -= cp[i] * out[i + 1]; };
  const anello = (m) => { // (formula di Sherman-Morrison: l'anello è una catena più una correzione)
    const g = -diag[0], al = sopra[m - 1], be = sotto[0]; diag[0] -= g; diag[m - 1] -= (al * be) / g;
    risolvi(diag, noto, m, x); u.fill(0, 0, m); u[0] = g; u[m - 1] = al; risolvi(diag, u, m, z);
    const fatt = (x[0] + (be * x[m - 1]) / g) / (1 + z[0] + (be * z[m - 1]) / g); for (let i = 0; i < m; i++) x[i] -= fatt * z[i];
  };
  let assorbita = 0, irradiata = 0, pesi = 0;
  for (let n = 0; n < totale; n++) {
    const f = (n % passiAnno) / passiAnno, ultimo = n >= totale - passiAnno, dt = n < lenti ? dtLento : dtVero;
    if (!P.bloccato) for (let j = 0; j < H; j++) soleJ[j] = luce(j, 0, f);
    // 1. in ogni cella: la luce assorbita meno quella irradiata
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, t = T[k], entra = (P.bloccato ? sole[k] : soleJ[j]) * (1 - albedo(k, t)), esce = (sigma * t ** 4) / serra, molla = (4 * esce) / t;
      const dT = Math.max(-50, Math.min(50, (dt * (entra - esce)) / (C(k) + dt * molla)));
      nuovo[k] = Math.max(3, t + dT);
      if (ultimo) { assorbita += cosLat[j] * entra; irradiata += cosLat[j] * (esce + molla * dT); pesi += cosLat[j]; }
    }
    // 2. il calore portato dai vicini: lungo i paralleli (un anello)…
    for (let j = 0; j < H; j++) {
      const q = (dt * D) / (cosLat[j] * cosLat[j] * dlam * dlam);
      for (let i = 0; i < W; i++) { const a = q / C(j * W + i); sotto[i] = -a; sopra[i] = -a; diag[i] = 1 + 2 * a; noto[i] = nuovo[j * W + i]; }
      anello(W); for (let i = 0; i < W; i++) nuovo[j * W + i] = x[i];
    }
    // …e lungo i meridiani (da un polo all'altro: attraverso i poli non passa niente)
    for (let i = 0; i < W; i++) {
      for (let j = 0; j < H; j++) { const q = (dt * D) / (C(j * W + i) * cosLat[j] * dphi * dphi), a = j > 0 ? q * cosN[j] : 0, b = j < H - 1 ? q * cosS[j] : 0; sotto[j] = -a; sopra[j] = -b; diag[j] = 1 + a + b; noto[j] = nuovo[j * W + i]; }
      risolvi(diag, noto, H, x); for (let j = 0; j < H; j++) nuovo[j * W + i] = x[j];
    }
    if (ultimo) for (let k = 0; k < W * H; k++) { media[k] += nuovo[k] / passiAnno; if (nuovo[k] < (terra[k] ? 268 : 271)) freddo[k] += acquaPerGhiaccio / passiAnno; }
    T.set(nuovo);
  }
  // in montagna fa più freddo (6,5 °C ogni chilometro sopra il mare)
  const quotaMedia = quota; // la quota media della cella del clima: la neve in quota si calcola punto per punto
  let gm = 0, gg = 0, a = 0; for (let j = 0; j < H; j++) { const w = Math.cos(lat(j)); for (let i = 0; i < W; i++) { gm += media[j * W + i] * w; gg += freddo[j * W + i] * w; a += w; } }
  const out = { W, H, media, freddo, quota: quotaMedia, mare: sf.mare, Tglobale: gm / a, ghiaccio: gg / a, piove, neve: acquaPerGhiaccio,
    // il bilancio dell'ultimo anno, in media sul pianeta (W/m²): la luce assorbita e quella irradiata; a regime sono uguali
    bilancio: { assorbita: assorbita / pesi, irradiata: irradiata / pesi, arriva: S0 / 4 },
    // quanto in fretta i pendii si consumano: con la pioggia molto, con il solo vento poco, senz'aria quasi niente
    sgretola: piove ? 0.05 : isFinite(P.clima.pressione) && P.clima.pressione > 1000 ? 0.015 : 0.002 };
  memoClima.set(chiave, out); if (memoClima.size > 6) memoClima.delete(memoClima.keys().next().value);
  return out;
}

// ---------- L'EROSIONE: il paesaggio che evolve (modello dei geomorfologi: «potenza dei fiumi» + pendii).
// A ogni passo: le montagne crescono dove le placche spingono; piove dove il clima lo permette (non sul
// ghiaccio); l'acqua scende lungo la pendenza più ripida; dove resta intrappolata in una conca la riempie
// fino a traboccare (un LAGO); dove se ne raccoglie molta scava, in proporzione alla portata e alla
// pendenza (le VALLI); i pendii si sgretolano lentamente. Mari, laghi, valli e fiumi vengono da qui.
const memoErosione = new Map();
export function erosione(chiave, sf, cl, { passi = 160, aperto = false, afflusso = null, crescita = true, scala = 1 } = {}) {
  if (memoErosione.has(chiave)) return memoErosione.get(chiave);
  const { W, H, mare } = sf, N = W * H, alt = Float32Array.from(sf.alt), alt0 = sf.alt;
  // la pioggia: dove fa abbastanza caldo e non c'è ghiaccio (dal clima simulato)
  const pioggia = new Float32Array(N);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [u0, v0, u1, v1] = sf.rett || [0, 0, 1, 1];
    const ci = Math.min(cl.W - 1, Math.floor((u0 + (i / W) * (u1 - u0)) * cl.W)), cj = Math.min(cl.H - 1, Math.floor((v0 + (j / H) * (v1 - v0)) * cl.H)), k = cj * cl.W + ci;
    pioggia[j * W + i] = cl.piove === false ? 0 : Math.max(0, Math.min(1, (cl.media[k] - 255) / 40)) * (1 - cl.freddo[k]);
  }
  const vicini = (k, f) => { const i = k % W, j = (k - i) / W; for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue; for (let di = -1; di <= 1; di++) if (di || dj) f(jj * W + ((i + di + W) % W), di && dj ? 1.414 : 1); } };
  // la coda per altezza (heap), per l'inondazione dal mare verso l'interno
  const heapK = new Int32Array(N), heapV = new Float32Array(N); let hn = 0;
  const push = (k, v) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (heapV[p] <= v) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; };
  const pop = () => { const k = heapK[0], lk = heapK[--hn], lv = heapV[hn]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && heapV[c + 1] < heapV[c]) c++; if (heapV[c] >= lv) break; heapK[i] = heapK[c]; heapV[i] = heapV[c]; i = c; } heapK[i] = lk; heapV[i] = lv; return k; };
  const pieno = new Float32Array(N), ricevente = new Int32Array(N), ordine = new Int32Array(N), visto = new Uint8Array(N), area = new Float32Array(N), dist = new Float32Array(N);
  let laghi = 0; const eroso = new Float32Array(N), sedimento = new Float32Array(N), depositato = new Float32Array(N);
  for (let it = 0; it < passi; it++) {
    // inondazione: dal mare (o dal punto più basso, se non c'è mare) verso l'interno; chi resta sotto il
    // livello di chi lo precede sta in una conca: lì c'è un lago
    hn = 0; visto.fill(0); let n = 0;
    let fonti = 0; for (let k = 0; k < N; k++) if (alt[k] < mare) { push(k, alt[k]); visto[k] = 1; ricevente[k] = -1; pieno[k] = alt[k]; fonti++; }
    // una tessera ha i bordi aperti: l'acqua esce verso le tessere vicine
    if (aperto) for (let k = 0; k < N; k++) { const i = k % W, j = (k - i) / W; if ((i === 0 || j === 0 || i === W - 1 || j === H - 1) && !visto[k]) { push(k, alt[k]); visto[k] = 1; ricevente[k] = -1; pieno[k] = alt[k]; fonti++; } }
    if (!fonti) { let m = 0; for (let k = 1; k < N; k++) if (alt[k] < alt[m]) m = k; push(m, alt[m]); visto[m] = 1; ricevente[m] = -1; pieno[m] = alt[m]; }
    while (hn) {
      const c = pop(); ordine[n++] = c;
      vicini(c, (q, d) => { if (visto[q]) return; visto[q] = 1; ricevente[q] = c; dist[q] = d; pieno[q] = Math.max(alt[q], pieno[c] + 0.01); push(q, pieno[q]); });
    }
    // la portata: la pioggia raccolta da monte a valle
    const secco = cl.piove === false ? 0 : 0.2; for (let k = 0; k < N; k++) area[k] = secco + pioggia[k] + (afflusso ? afflusso[k] : 0);
    for (let x = n - 1; x > 0; x--) { const k = ordine[x], r = ricevente[k]; if (r >= 0) area[r] += area[k]; }
    // lo scavo (implicito, da valle a monte) dove l'acqua scorre e non ristagna; la crescita dei monti
    for (let x = 0; x < n; x++) {
      const k = ordine[x], r = ricevente[k]; if (r < 0 || alt[k] < mare) continue;
      if (crescita) alt[k] += sf.spinta ? 9 * sf.spinta[k] : 0.001 * Math.max(0, alt0[k]); // l'orogenesi: il mantello continua a spingere
      if (pieno[k] > alt[k] + 0.5) continue; // nel lago non si scava: si deposita
      const F = (0.0009 * Math.sqrt(area[k])) / dist[k];
      if (alt[r] < alt[k]) { const prima = alt[k]; alt[k] = (alt[k] + F * alt[r]) / (1 + F); eroso[k] = prima - alt[k]; }
    }
    // I SEDIMENTI: ciò che è stato scavato scende con l'acqua (da monte a valle) e si deposita dove l'acqua
    // rallenta, nei laghi e sulle coste: le conche si riempiono, nascono pianure e delta. Tutto tende a livellarsi.
    for (let x = n - 1; x > 0; x--) {
      const k = ordine[x], r = ricevente[k]; if (r < 0) continue;
      let carico = sedimento[k] + eroso[k]; sedimento[k] = 0; eroso[k] = 0;
      const spazio = alt[r] < mare ? mare - alt[r] : pieno[r] - alt[r];
      if (spazio > 0.5) { const dep = Math.min(carico, spazio * 0.5); alt[r] += dep; carico -= dep; depositato[r] += dep; }
      sedimento[r] += carico;
    }
    // i pendii si sgretolano
    if (it % 4 === 0) for (let k = 0; k < N; k++) { if (alt[k] < mare) continue; let s = 0, m = 0; vicini(k, (q) => { s += alt[q]; m++; }); alt[k] += (cl.sgretola ?? 0.05) * (s / m - alt[k]); }
  }
  // una conca diventa lago solo se l'acqua che le arriva supera quella che evapora (più fa caldo, più
  // evapora); altrimenti resta asciutta, una piana di sale
  const lago = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    if (alt[k] < mare || pieno[k] <= alt[k] + 1) continue;
    const [u0, v0, u1, v1] = sf.rett || [0, 0, 1, 1];
    const ci = Math.min(cl.W - 1, Math.floor((u0 + ((k % W) / W) * (u1 - u0)) * cl.W)), cj = Math.min(cl.H - 1, Math.floor((v0 + (Math.floor(k / W) / H) * (v1 - v0)) * cl.H)), T = cl.media[cj * cl.W + ci];
    const evapora = 4 + 30 * Math.max(0, Math.min(1, (T - 260) / 50));
    if (area[k] > evapora * scala) { lago[k] = pieno[k] - alt[k]; laghi++; }
  }
  const flusso = new Float32Array(N); for (let k = 0; k < N; k++) flusso[k] = area[k];
  const out = { ...sf, alt, flusso, lago, depositato, celleLago: laghi, passiErosione: passi };
  memoErosione.set(chiave, out); if (memoErosione.size > 6) memoErosione.delete(memoErosione.keys().next().value);
  return out;
}

// ---------- LE TESSERE: la risoluzione continua. Avvicinandosi, ogni tessera si divide in 4 × 4 tessere
// più fini. Una tessera figlia nasce dalla madre: le sue quote (interpolate), più il dettaglio che da
// lontano non si vedeva (rumore su coordinate globali: uguale da qualunque parte ci si arrivi), poi
// l'erosione alla sua scala, con i bordi aperti e i fiumi della madre che entrano con la loro portata;
// i laghi della madre restano al loro livello. Lo stesso posto dà sempre la stessa tessera.
const memoTessere = new Map();
const hashReticolo = (ix, iy, seme) => { let h = (ix * 374761393 + iy * 668265263 + seme * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rumore = (x, y, seme) => { const x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return (hashReticolo(x0, y0, seme) * (1 - su) + hashReticolo(x0 + 1, y0, seme) * su) * (1 - sv) + (hashReticolo(x0, y0 + 1, seme) * (1 - su) + hashReticolo(x0 + 1, y0 + 1, seme) * su) * sv - 0.5; };
export function tessera(chiave, radice, cl, L, tx, ty, seme = 1) {
  if (L === 0) return radice.rett ? radice : Object.assign(radice, { rett: [0, 0, 1, 1], livello: 0 });
  const k = `${chiave}|${L}|${tx}|${ty}`; if (memoTessere.has(k)) return memoTessere.get(k);
  const m = tessera(chiave, radice, cl, L - 1, tx >> 2, ty >> 2, seme), { W, H, mare } = m, qx = tx & 3, qy = ty & 3, n = 4 ** L;
  const rett = [tx / n, ty / n, (tx + 1) / n, (ty + 1) / n], alt = new Float32Array(W * H), afflusso = new Float32Array(W * H), livelloLago = new Float32Array(W * H);
  const bil = (arr, fx, fy) => { const x = Math.max(0, Math.min(W - 1.001, fx)), y = Math.max(0, Math.min(H - 1.001, fy)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0; return arr[y0 * W + x0] * (1 - u) * (1 - v) + arr[y0 * W + x0 + 1] * u * (1 - v) + arr[(y0 + 1) * W + x0] * (1 - u) * v + arr[(y0 + 1) * W + x0 + 1] * u * v; };
  const amp = 260 * Math.pow(0.36, L), f1 = (W * n) / 9, f2 = (W * n) / 3.1;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const fx = (qx + (i + 0.5) / W) * (W / 4) - 0.5, fy = (qy + (j + 0.5) / H) * (H / 4) - 0.5, c = j * W + i;
    const gu = rett[0] + ((i + 0.5) / W) * (rett[2] - rett[0]), gv = rett[1] + ((j + 0.5) / H) * (rett[3] - rett[1]);
    alt[c] = bil(m.alt, fx, fy) + amp * (rumore(gu * f1, gv * f1 * 0.5, seme + L) + 0.45 * rumore(gu * f2, gv * f2 * 0.5, seme + 31 * L));
    const pm = Math.min(H - 1, Math.max(0, Math.round(fy))) * W + Math.min(W - 1, Math.max(0, Math.round(fx)));
    if (i === 0 || j === 0 || i === W - 1 || j === H - 1) afflusso[c] = m.flusso[pm] * 4; // la portata dei fiumi che entrano
    if (m.lago) { // il lago della madre: la sua superficie è piatta, la riva la decide il terreno fine
      const x0 = Math.max(0, Math.min(W - 2, Math.floor(fx))), y0 = Math.max(0, Math.min(H - 2, Math.floor(fy))); let lev = 0;
      for (const q of [y0 * W + x0, y0 * W + x0 + 1, (y0 + 1) * W + x0, (y0 + 1) * W + x0 + 1]) if (m.lago[q] > 0) lev = Math.max(lev, m.alt[q] + m.lago[q]);
      livelloLago[c] = lev;
    }
  }
  const e = erosione(k, { W, H, alt, mare, rett, vulcani: [] }, cl, { passi: 26, aperto: true, afflusso, crescita: false, scala: 4 ** L });
  for (let c = 0; c < W * H; c++) if (livelloLago[c] > e.alt[c]) e.lago[c] = Math.max(e.lago[c], livelloLago[c] - e.alt[c]);
  const cont = new Uint8Array(W * H); if (m.cont) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) cont[j * W + i] = m.cont[Math.min(H - 1, Math.floor((qy + j / H) * (H / 4))) * W + Math.min(W - 1, Math.floor((qx + i / W) * (W / 4)))];
  const out = { ...e, rett, livello: L, vulcani: [], cont, materiali: m.materiali };
  memoTessere.set(k, out); if (memoTessere.size > 48) memoTessere.delete(memoTessere.keys().next().value);
  return out;
}
