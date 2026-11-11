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
import { meteoPianeta, pioggiaPerErosione } from './meteo.js';
import { improntaMantello, crateriVisibili } from './impatti.js';
import { acquaInSuperficie, CLIMA, riflette, riflessoNuvoleAtteso, coperturaDelCielo, acquaPerIlGhiaccio, nuvoleAttese, trasportoCalore, serraDaPressione, luceDelGiorno, frenaPasso, caloreDellaRoccia } from './leggi.js';
const TERRA = { M: 5.97e24, R: 6.371e6, q: 0.087, Rc: 3.48e6, rhoC: 11000, giorno: 86164, rossby: 0.09 };

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
  const q = TERRA.q * (M / TERRA.M) / (R / TERRA.R) ** 2 * Math.sqrt(Math.max(0.05, Z)) * (caloreDellaRoccia(eta) / caloreDellaRoccia(4.5e9)) * Math.pow(M / TERRA.M, 0.3); // (cala con l'età come la radioattività della roccia: la stessa legge delle lune)
  // il nucleo resta liquido se il pianeta è abbastanza grande da non essersi raffreddato (tempo ∝ R²)
  const nucleoLiquido = q > 0.025 && R > 3.5e6;
  // LA ROTAZIONE (P.giorno, da rotazione.js; se manca, la dinamo resta quella di prima). Una dinamo dà un campo a dipolo
  // solo se la rotazione ordina i moti del nucleo: il numero di Rossby locale deve stare sotto 0,12; sopra, il campo è a
  // molti poli e alla superficie è almeno dieci volte più debole (Olson e Christensen 2006, EPSL 250, 561). Lì
  // Ro_l ∝ Ra_Q^(1/2)·E^(−1/3): con il flusso di galleggiamento ∝ q·Rc², la gravità ∝ Rc e lo spessore del guscio ∝ Rc
  // viene Ro_l ∝ q^(1/2)·Ω^(−7/6)·Rc^(1/6). DATI: la soglia 0,12 (verificata: Christensen, Aubert e Olson); la Terra a
  // Ro_l ≈ 0,09 (ricordato; verificato solo che «la geodinamo sta vicino alla transizione»). Nessuna taratura. Che cosa
  // manca: il flusso di calore dal nucleo (qui va come quello in superficie) e di quanto cala il campo senza dipolo.
  const rossby = P.giorno > 0 && nucleoLiquido ? TERRA.rossby * Math.sqrt(q / TERRA.q) * Math.pow(P.giorno / TERRA.giorno, 7 / 6) * Math.pow(Rc / TERRA.Rc, 1 / 6) : null, dipolo = !(rossby > 0.12);
  const B0 = nucleoLiquido ? 3.1e-5 * Math.pow(q / TERRA.q, 1 / 3) * Math.pow((Rc / R) / (TERRA.Rc / TERRA.R), 3) * Math.pow(Rc / TERRA.Rc, 0.5) * (dipolo ? 1 : 0.1) : 1e-9;
  const acqua = acquaInSuperficie(P).frazione > 0.005;
  const tettonica = q > 0.05 && acqua && M > 0.3 * TERRA.M ? 'a placche' : q > 0.02 ? 'coperchio unico, con vulcani' : 'ferma';
  return { eta, nucleo: Rc / R, crosta: Math.min(0.02, 0.004 * Math.pow(q / TERRA.q, 0.5)), q, dinamo: nucleoLiquido, B0, tettonica, vulcani: q > 0.02 ? Math.round(q / 0.02) : 0, ...(rossby != null ? { rossby, dipolo } : {}) };
}

// ---------- la superficie: una mappa equirettangolare (longitudine × latitudine) di quote in metri
const memo = new Map();
import { comeSorgente } from './eventi.js'; // il caso della superficie: dalla fonte unica («seme» è un numero o la sorgente del luogo)
export function superficiePianeta(chiave, P, int, seme, { W = 256, H = 128 } = {}) {
  if (memo.has(chiave)) return memo.get(chiave);
  const caso = comeSorgente(seme, 'superficie'); // gli eventi della superficie, ognuno con il suo nome («onda 3/fase», «vulcano 2/dove»): l'ordine non conta
  const sfera = (i, j) => { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI; return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]; };
  const casuale = (nome) => { const t = caso.serie(nome), z = 2 * t(0) - 1, a = t(1) * 2 * Math.PI, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // LA TETTONICA EVOLVE NEL TEMPO (tettonica.js). Il mantello scaldato dal basso si organizza in celle che
  // cambiano lentamente; la crosta dei continenti, leggera, è trascinata: si spacca dove il mantello sale, deriva,
  // e dove due masse si scontrano si ispessisce in catene di montagne; la crosta degli oceani nasce alle dorsali,
  // invecchia allontanandosi (e il fondo sprofonda come la radice dell'età) e affonda nelle fosse. Le quote
  // vengono dal galleggiamento: la crosta spessa sta alta. Forma, numero e storia dei continenti non sono scelti.
  const alt = new Float32Array(W * H), quale = new Int16Array(W * H), spinta = new Float32Array(W * H);
  // l'acqua che sta in superficie, come mare o come ghiaccio: quella che l'interno le dà, ma solo se lo stato che il
  // clima le assegna non è vapore. Dove bolle o sublima non c'è mare: l'acqua è nell'aria, o è già fuggita
  const acquaKg = String(P.clima?.acqua ?? '').startsWith('vapore') ? 0 : int.acquaKg || 0;
  const aPlacche = int.tettonica === 'a placche';
  // la storia degli impatti del pianeta (impatti.js, P.impatti); se il pianeta non la porta restano i ripieghi da seme.
  // Lo stato da cui parte il mantello è l'impronta termica dei suoi urti
  const storiaUrti = P.impatti ?? null;
  const tt = aPlacche ? evolviTettonica({ W, H, raggioM: P.raggioM, nucleo: int.nucleo, q: int.q, eta: int.eta ?? 4.5e9, acqua: true, seme, placche: true, impronta: storiaUrti ? (w, h) => improntaMantello(storiaUrti, w, h) : null }) : null;
  const cont = tt ? tt.cont : new Uint8Array(W * H), placche = tt ? tt.celle : 1;
  // un rumore liscio (somma di onde sulla sfera) per le irregolarità del terreno
  const onde = Array.from({ length: 24 }, (_, k) => ({ d: casuale(`onda ${k}/direzione`), f: 2 + k * 0.7, fi: caso(`onda ${k}/fase`) * 6.28, a: 1 / (1 + k * 0.35) }));
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
  const rinnovo = (aPlacche ? 3 : int.vulcani > 0 ? 1 : 0) + (aria > 0.01 && acquaKg > 0 ? 1.5 : 0);
  let conservati = Math.exp(-rinnovo * Math.min(4, etaG) * 0.9), crateriVisti = 0; const nCrateri = storiaUrti ? 0 : Math.round(900 * (1 - Math.exp(-etaG / 1.2)) * conservati);
  if (storiaUrti) {
    // I CRATERI VERI: quelli dei grandi urti della sua storia che nulla ha cancellato (impatti.js). Quanto è vecchia la
    // superficie, punto per punto: con le placche i fondali hanno l'età della loro crosta e i continenti quella del
    // pianeta; sotto un coperchio con vulcani la lava la rifà in media ogni 1,1 miliardi di anni (il ritmo che c'era
    // già qui: 0,9 per miliardo di anni); un mondo fermo non la rifà mai
    let eta = Infinity;
    if (tt) { eta = new Float32Array(W * H); const anni = int.eta ?? 4.5e9; for (let k = 0; k < W * H; k++) eta[k] = tt.cont[k] ? anni : 1e6 * tt.etaCrosta[k]; }
    else if (int.vulcani > 0) eta = 1e9 / 0.9;
    // l'erosione (m/anno). LEGGE EMPIRICA: dove piove, i continenti terrestri si consumano di circa 30 m ogni milione di
    // anni; con la sola aria (il vento) mille volte meno; senz'aria niente
    const erode = aria > 0.01 && (int.acquaKg || 0) > 0 ? 3e-5 : aria > 0.01 ? 3e-8 : 0;
    const visibili = crateriVisibili(storiaUrti, { W, H, rinnovo: eta, erosione: erode, minimoM: (2 * Math.PI * P.raggioM) / W });
    for (const cr of visibili) { // (la stessa forma di prima: scodella, bordo rialzato, picco al centro nei crateri complessi)
      const raggio = cr.raggioCelle, ci = cr.i, cj = cr.j, prof = cr.profonditaM, R2 = Math.ceil(raggio * 1.6), allarga = 1 / Math.max(0.2, Math.cos(Math.PI / 2 - ((cj + 0.5) / H) * Math.PI)), largo = Math.min(W >> 1, Math.ceil(R2 * allarga));
      for (let dj = -R2; dj <= R2; dj++) { const y = cj + dj; if (y < 0 || y >= H) continue; for (let di = -largo; di < Math.min(largo + 1, W - largo); di++) { const d = Math.hypot(di / allarga, dj) / raggio; if (d > 1.6) continue; const k = y * W + ((ci + di + W * 4) % W); alt[k] += d < 1 ? -prof * (1 - d * d) + (cr.complesso && d < 0.18 ? prof * 0.5 : 0) : prof * 0.28 * Math.exp(-(d - 1) * 5); } }
    }
    crateriVisti = visibili.length; conservati = storiaUrti.grandi.length ? visibili.length / storiaUrti.grandi.length : 1;
  }
  for (let n = 0; n < nCrateri; n++) { // (ripiego, per un pianeta senza storia degli impatti: i crateri tirati dal seme)
    const cr = caso.serie(`cratere ${n}`), raggio = Math.min(22, 1.2 * Math.pow(1 - cr(0) * 0.985, -1 / 1.8)); if (raggio < 2.2 && aria > 0.5) continue; // (in celle; i piccoli bruciano nell'aria)
    const ci = Math.floor(cr(1) * W), cj = Math.floor(cr(2) * H), prof = 180 * raggio, R2 = Math.ceil(raggio * 1.6), allarga = 1 / Math.max(0.2, Math.cos(Math.PI / 2 - ((cj + 0.5) / H) * Math.PI));
    for (let dj = -R2; dj <= R2; dj++) { const y = cj + dj; if (y < 0 || y >= H) continue; for (let di = -Math.ceil(R2 * allarga); di <= R2 * allarga; di++) { const d = Math.hypot(di / allarga, dj) / raggio; if (d > 1.6) continue; const k = y * W + ((ci + di + W * 4) % W); alt[k] += d < 1 ? -prof * (1 - d * d) + (raggio > 9 && d < 0.18 ? prof * 0.5 : 0) : prof * 0.28 * Math.exp(-(d - 1) * 5); } }
  }
  // i vulcani: sopra i pennacchi caldi del mantello e lungo i confini che si aprono. Dove la tettonica ha il campo del
  // mantello (tt.salite) stanno sulle sue cime più alte, la più calda per prima e non due nello stesso pennacchio; se
  // le cime non bastano, o il mantello non è stato calcolato (i mondi senza placche), i restanti cadono dove capita
  const vulcani = [], cime = [];
  if (tt && tt.salite) { const u = tt.salite, tutte = [];
    for (let j = 1; j < H - 1; j++) for (let i = 0; i < W; i++) { const v = u[j * W + i]; if (!(v > 0)) continue; let cima = true; for (let b = -1; b <= 1 && cima; b++) for (let a = -1; a <= 1; a++) if ((a || b) && u[(j + b) * W + ((i + a + W) % W)] > v) { cima = false; break; } if (cima) tutte.push([v, i, j]); }
    tutte.sort((a, b) => b[0] - a[0] || a[2] - b[2] || a[1] - b[1]);
    for (const [, i, j] of tutte) { const pi = sfera(i, j); if (cime.every(([a, b]) => dot(pi, sfera(a, b)) < Math.cos(0.25))) cime.push([i, j]); } } // (almeno un quarto di radiante tra due vulcani)
  for (let k = 0; k < int.vulcani; k++) { const p = casuale(`vulcano ${k}/dove`), lat = Math.asin(p[2]), lon = Math.atan2(p[1], p[0]); const [i, j] = cime[k] || [Math.floor(((lon + Math.PI) / (2 * Math.PI)) * W) % W, Math.min(H - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * H))]; vulcani.push([i, j]); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const jj = j + dj, ii = (i + di + W) % W; if (jj >= 0 && jj < H) alt[jj * W + ii] += 2500 * Math.exp(-(di * di + dj * dj) / 3); } }
  // il mare: l'acqua del pianeta riempie i punti più bassi (si cerca il livello che contiene quel volume)
  const area = (j) => Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI) * (2 * Math.PI * P.raggioM ** 2 * (Math.PI / H)) / W;
  const volumeAcqua = acquaKg / 1000;
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
    const base = { composizione: P.composizione, T: P.clima?.T ?? P.clima?.Teq ?? 280, ossidato: materiali.ossidato, acqua: acquaKg > 0 };
    materiali.continente = minerali({ ...base, continente: true }); materiali.basalto = minerali({ ...base, continente: false });
    materiali.coloreContinente = coloreRoccia(materiali.continente); materiali.coloreBasalto = coloreRoccia(materiali.basalto);
  } catch { /* senza chimica restano i colori di riserva */ }
  // (con le placche la superficie porta anche l'età della crosta degli oceani, in milioni di anni (0 sui continenti), e le
  // fosse dove affonda (0…1): servono a chi guarda le rocce — materia.js: da quanto tempo quella roccia ricorda — e al mare
  // — mare.js: le sorgenti calde stanno dove la crosta è giovane davvero)
  const out = { W, H, raggioM: P.raggioM, alt, mare, flusso, vulcani, placche, quale, cont, materiali, spinta, crateri: storiaUrti ? crateriVisti : nCrateri, crateriConservati: conservati, ...(tt ? { etaCrosta: tt.etaCrosta, fosse: tt.fosse } : {}) };
  memo.set(chiave, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}

// i colori: profondità del mare, terre secondo quota e temperatura, ghiaccio dove fa freddo, fiumi
export function immagineSuperficie(sf, T, cl = null) {
  const { W, H, alt, mare, flusso } = sf, px = new Uint8ClampedArray(W * H * 4);
  const lg = sf.largo && sf.largo.W > W ? sf.largo : null, lgx = lg ? (lg.W - W) / 2 : 0, lgy = lg ? (lg.H - H) / 2 : 0;
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
    // (l'ombra viene dalla pendenza: sul bordo di una tessera il vicino si legge nel suo bordo in più, non dall'altro lato)
    const sinistra = lg ? lg.alt[(j + lgy) * lg.W + i + lgx - 1] : alt[j * W + ((i + W - 1) % W)], sopra = lg ? lg.alt[(j + lgy - 1) * lg.W + i + lgx] : alt[Math.max(0, j - 1) * W + i];
    const ombra = h >= mare ? Math.max(0.6, Math.min(1.25, 1 + (sinistra - alt[k] + sopra - alt[k]) / divOmbra)) : 1;
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
// L'ARIA CHE CIRCOLA (meteo.js). Il clima qui sopra tratta il calore portato dall'aria e le nuvole con due coefficienti;
// quando il pianeta ha un giorno e un'aria, si fa un secondo giro: dal primo clima si calcolano i venti, il vapore, le
// nuvole e la pioggia veri (meteo.js), e con quelli si rifà il bilancio (meteo: nuvole punto per punto, e quanto calore
// l'aria porta davvero). La pioggia che l'erosione usa viene da lì (cl.meteo).
// FINCHÉ NON SI RISPONDONO PIÙ. Clima e aria si cercano a giri: dal clima i venti e le nuvole, dai venti e dalle nuvole
// il clima; ci si ferma quando la temperatura media cambia meno di mezzo grado da un giro all'altro (al più GIRI_ARIA
// giri d'aria: ognuno costa una circolazione).
// IL MARE CHE TORNA AL CLIMA (opzione «mare»: lo stato di mare.js, che è stato calcolato su un clima): le correnti
// portano calore (mare.caloreDalMare, W/m² sulla griglia del clima) e la superficie del mare rimanda la luce che dice
// mare.albedo (acqua aperta, ghiaccio marino). Il mare non crea energia: del calore si usa solo ciò che sposta (tolta
// la media sul pianeta). climaConIlMare() rifà il giro con quei due termini.
const GIRI_ARIA = 3;
export function climaSuperficie(chiave, P, sf, { W = 64, H = 32, anni = 14, passiAnno = 240, meteo = null, aria = true, mare = null, Dprima = null } = {}) {
  if (chiave != null && memoClima.has(chiave)) return memoClima.get(chiave);
  if (!meteo && aria && P.giorno > 0 && isFinite(P.clima.pressione) && P.clima.pressione > 1) {
    const primo = climaSuperficie(`${chiave}|primo giro`, P, sf, { W, H, anni, passiAnno, aria: false });
    let cl = primo; const storia = [primo.Tglobale];
    for (let giro = 1; giro <= GIRI_ARIA; giro++) {
      let m = null; try { m = meteoPianeta(P, sf, cl); } catch { m = null; }
      if (!m || m.regime !== 'aria') break;
      const prima = cl, dopo = climaSuperficie(null, P, sf, { W, H, anni, passiAnno, meteo: m, Dprima: cl.D }); dopo.meteo = m; cl = dopo; storia.push(cl.Tglobale);
      if (prima.meteo && Math.abs(cl.Tglobale - prima.Tglobale) < 0.5) break;
    }
    cl.giri = storia.length; cl.storiaGiri = storia; memoClima.set(chiave, cl); return cl;
  }
  // (la serra, il calore portato e la temperatura di partenza sono quelli di clima(), leggi.js: è la stessa legge, risolta
  // lì per fasce e qui sulla mappa; se il pianeta non li porta con sé, valgono le stesse formule di riserva)
  const sigma = 5.67e-8, S0 = P.Lw / (4 * Math.PI * P.aM * P.aM), tau = P.clima.tau ?? serraDaPressione(P.clima.pressione);
  // (nel secondo giro il calore portato è la media tra quello atteso del primo giro e quello che i venti hanno portato
  // davvero: i due si rispondono, e a metà strada non rimbalzano)
  const Dattesa = Dprima ?? P.clima.D ?? trasportoCalore(P.clima.pressione), D = meteo ? (Dattesa + Math.max(0, meteo.diffusivita)) / 2 : Dattesa, kx = sf.W / W, ky = sf.H / H;
  const terra = new Uint8Array(W * H), quota = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let h = 0; for (let b = 0; b < ky; b++) for (let a = 0; a < kx; a++) h += sf.alt[(j * ky + b) * sf.W + i * kx + a]; h /= kx * ky; quota[j * W + i] = h; terra[j * W + i] = h >= sf.mare ? 1 : 0; }
  const lat = (j) => Math.PI / 2 - ((j + 0.5) / H) * Math.PI, dphi = Math.PI / H, dlam = (2 * Math.PI) / W;
  // un pianeta nasce caldo (gli urti che l'hanno formato) e si raffredda: si parte da lì, non dal freddo. Per un mondo
  // lontano dalla sua stella «caldo» vuol dire un quarto sopra la temperatura a cui lo porterebbe la sola luce (Tfine:
  // quanto basta per essere sopra qualunque equilibrio, anche senza ghiaccio né nuvole), non 310 K
  const Tfine = P.clima.Tavvio ? Math.max(3, P.clima.Tavvio / 1.25) : Math.max(30, P.clima.Teq * Math.pow(1 + 0.75 * tau, 0.25));
  const T = new Float32Array(W * H).fill(P.clima.Tavvio ?? Math.max(P.clima.Teq, Math.min(310, 1.25 * Tfine))), nuovo = new Float32Array(W * H), freddo = new Float32Array(W * H), media = new Float32Array(W * H);
  const C = (k) => (terra[k] ? CLIMA.capacitaTerra : CLIMA.capacitaMare), anno = P.anno, eps = (P.obliquita * Math.PI) / 180;
  // il ghiaccio ha bisogno di acqua: su un pianeta senza mari al freddo resta solo un po' di brina;
  // dove c'è acqua che evapora e un'atmosfera che la tiene si formano le nuvole, che riflettono la luce
  let mareFraz = 0; for (let k = 0; k < W * H; k++) mareFraz += 1 - terra[k]; mareFraz /= W * H;
  // senza acqua niente ghiaccio; piove solo se c'è acqua che evapora e un'aria che la porta. Quanta luce torna indietro
  // (suolo, ghiaccio, nuvole) lo dice riflette() di leggi.js, con le nuvole vere di meteo.js quando ci sono
  const acquaPerGhiaccio = acquaPerIlGhiaccio(mareFraz), piove = meteo ? meteo.bilancio.piovuta > 1 : mareFraz > 0.005 && isFinite(P.clima.pressione) && P.clima.pressione > 100, nuvole = nuvoleAttese(mareFraz, P.clima.pressione);
  // il mare di mare.js, se c'è: il calore che sposta (W/m², a media nulla) e quanto rimanda la sua superficie (sulla
  // griglia del mare, che può essere più fine: qui la media delle celle bagnate)
  let fonte = null, albedoMare = null;
  if (mare && mare.caloreDalMare && mare.caloreDalMare.length === W * H) {
    fonte = new Float32Array(W * H); let s = 0, a = 0; for (let j = 0; j < H; j++) { const w = Math.cos(lat(j)); for (let i = 0; i < W; i++) { s += w * mare.caloreDalMare[j * W + i]; a += w; } }
    for (let k = 0; k < W * H; k++) fonte[k] = mare.caloreDalMare[k] - s / a;
    const r = mare.albedo ? Math.round(Math.sqrt(mare.albedo.length / (W * H))) : 0;
    if (r >= 1 && mare.albedo.length === W * H * r * r) { albedoMare = new Float32Array(W * H).fill(-1); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let x = 0, n = 0; for (let b = 0; b < r; b++) for (let c = 0; c < r; c++) { const v = mare.albedo[(j * r + b) * W * r + i * r + c]; if (v > 0) { x += v; n++; } } if (n && !terra[j * W + i]) albedoMare[j * W + i] = x / n; } }
  }
  // (le nuvole di meteo.js: quanta luce rimandano davvero, dall'acqua che tengono; senza meteo, quelle attese dalla stessa legge)
  const albedo = (k, t) => riflette(t, 1 - terra[k], acquaPerGhiaccio, nuvole, meteo ? (meteo.riflessoNuvole ? meteo.riflessoNuvole[k] : meteo.nuvole[k] * riflessoNuvoleAtteso(t) / coperturaDelCielo) : null, albedoMare && albedoMare[k] >= 0 ? albedoMare[k] : null);
  const luce = (j, i, f) => {
    const ph = lat(j);
    if (P.bloccato) { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, cz = Math.cos(ph) * Math.cos(lon); return S0 * Math.max(0, cz); }
    return luceDelGiorno(S0, ph, eps * Math.sin(2 * Math.PI * f));
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
  const serra = 1 + 0.75 * tau, memoria = ((mareFraz > 0 ? CLIMA.capacitaMare : CLIMA.capacitaTerra) * serra) / (4 * sigma * Tfine ** 3), veri = Math.min(4, anni - 1);
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
  let assorbita = 0, irradiata = 0, pesi = 0, riprese = 0; const stagioni = P.bloccato ? null : [0, 1, 2, 3].map(() => new Float32Array(W * H));
  const integra = () => {
  assorbita = 0; irradiata = 0; pesi = 0; media.fill(0); freddo.fill(0); if (stagioni) for (const q of stagioni) q.fill(0);
  for (let n = 0; n < totale; n++) {
    const f = (n % passiAnno) / passiAnno, ultimo = n >= totale - passiAnno, dt = n < lenti ? dtLento : dtVero;
    if (!P.bloccato) for (let j = 0; j < H; j++) soleJ[j] = luce(j, 0, f);
    // 1. in ogni cella: la luce assorbita meno quella irradiata
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, t = T[k], entra = (P.bloccato ? sole[k] : soleJ[j]) * (1 - albedo(k, t)) + (fonte ? fonte[k] : 0), esce = (sigma * t ** 4) / serra, molla = (4 * esce) / t;
      const dT = frenaPasso(t, (dt * (entra - esce)) / (C(k) + dt * molla));
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
    if (ultimo) { const quarto = stagioni ? stagioni[Math.min(3, Math.floor((4 * (n % passiAnno)) / passiAnno))] : null; for (let k = 0; k < W * H; k++) { media[k] += nuovo[k] / passiAnno; if (quarto) quarto[k] += (4 * nuovo[k]) / passiAnno; if (nuovo[k] < (terra[k] ? 268 : 271)) freddo[k] += acquaPerGhiaccio / passiAnno; } }
    T.set(nuovo);
  } };
  // A REGIME il pianeta irradia quanta luce assorbe. Se alla fine il bilancio non chiude entro l'1% il clima sta ancora
  // cambiando (un mare che sta gelando sotto nuvole più fitte di quelle attese ci mette più delle otto «memorie» contate
  // sulla temperatura di partenza, perché al freddo irradia meno e risponde più piano): si riprende da dove si è arrivati,
  // con lo stesso passo, finché chiude (al più quattro volte; quante ne sono servite resta scritto in «riprese»)
  integra();
  while (riprese < 4 && assorbita > 0 && Math.abs(irradiata / assorbita - 1) > 0.01) { riprese++; integra(); }
  // in montagna fa più freddo (6,5 °C ogni chilometro sopra il mare)
  const quotaMedia = quota; // la quota media della cella del clima: la neve in quota si calcola punto per punto
  let gm = 0, gg = 0, a = 0; for (let j = 0; j < H; j++) { const w = Math.cos(lat(j)); for (let i = 0; i < W; i++) { gm += media[j * W + i] * w; gg += freddo[j * W + i] * w; a += w; } }
  const out = { W, H, media, freddo, quota: quotaMedia, mare: sf.mare, Tglobale: gm / a, ghiaccio: gg / a, piove, neve: acquaPerGhiaccio, D,
    // il bilancio dell'ultimo anno, in media sul pianeta (W/m²): la luce assorbita e quella irradiata; a regime sono uguali
    bilancio: { assorbita: assorbita / pesi, irradiata: irradiata / pesi, arriva: S0 / 4 }, riprese,
    // la temperatura media dei quattro quarti dell'ultimo anno (le stagioni: per meteo.js); un pianeta bloccato non ne ha
    stagioni,
    // quanto in fretta i pendii si consumano: con la pioggia molto, con il solo vento poco, senz'aria quasi niente
    sgretola: piove ? 0.05 : isFinite(P.clima.pressione) && P.clima.pressione > 1000 ? 0.015 : 0.002 };
  if (chiave != null) { memoClima.set(chiave, out); if (memoClima.size > 6) memoClima.delete(memoClima.keys().next().value); }
  return out;
}
// il clima rifatto con il mare che c'è (mare.js: mare(P, se, cl, …)): lo stesso bilancio, con i venti e le nuvole di cl,
// più il calore che le correnti spostano e l'albedo della superficie del mare. → un clima come cl (con cl.meteo), e in
// più conIlMare: { caloreMedioTolto (W/m²: ciò che mare.js aveva in più o in meno in media, e che qui non entra),
// caloreSpostato (W/m², medio in valore assoluto), dT (K: di quanto cambia la temperatura media) }
export function climaConIlMare(chiave, P, sf, cl, mare) {
  if (!cl || !mare || !mare.caloreDalMare) return cl;
  const k = `${chiave}|con il mare`; if (memoClima.has(k)) return memoClima.get(k);
  const out = climaSuperficie(null, P, sf, { W: cl.W, H: cl.H, meteo: cl.meteo || null, aria: false, mare, Dprima: cl.meteo ? 2 * cl.D - Math.max(0, cl.meteo.diffusivita) : cl.D });
  let s = 0, a = 0, w = 0; for (let j = 0; j < cl.H; j++) { const c = Math.cos(Math.PI / 2 - ((j + 0.5) / cl.H) * Math.PI); for (let i = 0; i < cl.W; i++) { s += c * mare.caloreDalMare[j * cl.W + i]; w += c; } }
  for (let j = 0; j < cl.H; j++) { const c = Math.cos(Math.PI / 2 - ((j + 0.5) / cl.H) * Math.PI); for (let i = 0; i < cl.W; i++) a += c * Math.abs(mare.caloreDalMare[j * cl.W + i] - s / w); }
  if (cl.meteo) out.meteo = cl.meteo; out.giri = cl.giri; out.storiaGiri = cl.storiaGiri;
  out.conIlMare = { caloreMedioTolto: s / w, caloreSpostato: a / w, dT: out.Tglobale - cl.Tglobale };
  memoClima.set(k, out); if (memoClima.size > 6) memoClima.delete(memoClima.keys().next().value);
  return out;
}

// ---------- L'EROSIONE: il paesaggio che evolve, in metri e in anni (il modello dei geomorfologi, come in FastScape).
// A ogni passo di tempo: piove dove il clima lo dice; l'acqua scende lungo la pendenza più ripida; dove resta
// intrappolata in una conca la riempie fino a traboccare (un LAGO); poi
//  · I FIUMI SCAVANO: E = K·A^m·S^n (m/anno), con m = 0,4 e n = 1, e K MISURATO per classe di roccia (Stock e Montgomery
//    1999, J. Geophys. Res. 104, 4983: graniti e rocce metamorfiche 10⁻⁷–10⁻⁶ m^0,2/anno; vulcaniche 10⁻⁵–10⁻⁴; argilliti e
//    sedimenti 10⁻⁴–10⁻²: di ogni classe qui la media geometrica). A è l'area drenata: qui la portata vera (pioggia × area,
//    m³/anno) divisa per un metro di pioggia l'anno, così dove piove il doppio il fiume vale un bacino doppio. La roccia è
//    quella del luogo: granito sui continenti, vulcanica sulla crosta dei fondali emersa, sedimento dove il fiume ha posato.
//    Il passo è implicito (Braun e Willett 2013): stabile con qualunque passo di tempo.
//  · I PENDII SCIVOLANO: diffusione, ∂h/∂t = K_d·∇²h con K_d = 0,01 m²/anno (il valore d'uso di FastScape; le misure vanno
//    da 10⁻³ a 10⁻²). Il LETTO di un fiume non è un pendio: una cella che riceve acqua da altre non viene spianata; ciò
//    che i versanti le portano entra nel carico del fiume. (Prima «i pendii si sgretolano» avvicinava ogni cella, letto
//    compreso, alla media dei vicini del 5% ogni quattro passi: spianava le valli più in fretta di quanto il fiume le
//    scavasse. Provato togliendolo: l'incasso medio passa da −10 m a +2 m; togliere il sollevamento non cambia niente.)
//  · IL SEDIMENTO scende col fiume e si posa dove la capacità di portarlo cala: Q_s = 0,041·I·Q·S^(7/6), con I = 0,01 la
//    parte del tempo in piena (Wickert e Schildgen 2019); nei laghi; sulla costa (i delta). Il conto torna: eroso =
//    depositato + portato al mare.
//  · LA CROSTA RISPONDE: tolto un carico, risale di ρ_crosta/ρ_mantello = 2800/3300 dello spessore tolto (isostasia), sulla
//    media della regione (la crosta è rigida: flette su ~200 km); e dove le placche spingono (spinta, da tettonica.js)
//    la crosta si ispessisce di nuovo: la quota media della regione torna quella che la spinta regge. Nessun sollevamento
//    uniforme messo a mano.
//  · QUANTO DURA: quanto è durata la geografia di oggi, cioè l'età media dei fondali (etaCrosta, da tettonica.js: sulla Terra
//    ~60–100 milioni di anni); senza placche, 100 milioni di anni (manca un orologio migliore). Una tessera, che aggiunge
//    il dettaglio a una scala più piccola, dura in proporzione al lato delle sue celle (un gradino risale un fiume in un
//    tempo proporzionale alla distanza).
// Escono, oltre al rilievo: flusso (la pioggia raccolta, in celle × metri l'anno, come prima), lago, depositato (m),
// versoValle (per ogni cella, la cella in cui versa; −1 il mare), e i numeri veri: durataErosione (anni), denudazione (m/anno, media sulle terre), fangoAlMare (kg/anno), bilancio (m³).
export const EROSIONE = Object.freeze({ m: 0.4, n: 1, K: Object.freeze({ granito: 3.2e-7, vulcanica: 3.2e-5, sedimento: 1e-3 }), pioggiaRif: 1, pendii: 0.01, kQs: 0.041, piena: 0.01, capacitaEsponente: 7 / 6,
  isostasia: 2800 / 3300, densita: 2700, durataSenzaPlacche: 1e8 });
const memoErosione = new Map();
export function erosione(chiave, sf, cl, { passi = 160, aperto = false, afflusso = null, crescita = true, scala = 1, durata = null } = {}) {
  if (memoErosione.has(chiave)) return memoErosione.get(chiave);
  const { W, H, mare } = sf, N = W * H, alt = Float32Array.from(sf.alt), alt0 = sf.alt;
  // la pioggia: dove fa abbastanza caldo e non c'è ghiaccio (dal clima simulato)
  const pioggia = new Float32Array(N), pm = cl.meteo ? pioggiaPerErosione(cl.meteo, sf) : null;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [u0, v0, u1, v1] = sf.rett || [0, 0, 1, 1];
    const ci = ((Math.floor((u0 + (i / W) * (u1 - u0)) * cl.W) % cl.W) + cl.W) % cl.W, cj = Math.max(0, Math.min(cl.H - 1, Math.floor((v0 + (j / H) * (v1 - v0)) * cl.H))), k = cj * cl.W + ci;
    // (con l'aria che circola: la pioggia vera di quel punto, 1 = mille millimetri l'anno; altrimenti dove fa abbastanza caldo)
    pioggia[j * W + i] = cl.piove === false ? 0 : pm ? pm[j * W + i] * (1 - cl.freddo[k]) : Math.max(0, Math.min(1, (cl.media[k] - 255) / 40)) * (1 - cl.freddo[k]);
  }
  const vicini = (k, f) => { const i = k % W, j = (k - i) / W; for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue; for (let di = -1; di <= 1; di++) if (di || dj) f(jj * W + ((i + di + W) % W), di && dj ? 1.414 : 1, di, jj); } };
  // la coda per altezza (heap), per l'inondazione dal mare verso l'interno
  const heapK = new Int32Array(N), heapV = new Float32Array(N); let hn = 0;
  const push = (k, v) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (heapV[p] <= v) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; };
  const pop = () => { const k = heapK[0], lk = heapK[--hn], lv = heapV[hn]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && heapV[c + 1] < heapV[c]) c++; if (heapV[c] >= lv) break; heapK[i] = heapK[c]; heapV[i] = heapV[c]; i = c; } heapK[i] = lk; heapV[i] = lv; return k; };
  const pieno = new Float32Array(N), ricevente = new Int32Array(N), ordine = new Int32Array(N), visto = new Uint8Array(N), area = new Float32Array(N), dist = new Float32Array(N);
  let laghi = 0; const eroso = new Float64Array(N), sedimento = new Float64Array(N), depositato = new Float32Array(N), portata = new Float64Array(N), versante = new Float64Array(N), coperta = new Float32Array(N), inizio = new Float32Array(N), calo = new Float32Array(N);
  // LE MISURE VERE: il lato di una cella (m) lungo i paralleli e lungo i meridiani, e la sua area
  const E = EROSIONE, R = sf.raggioM ?? 6.371e6, [ru0, rv0, ru1, rv1] = sf.rett || [0, 0, 1, 1], dy = (Math.PI * R * (rv1 - rv0)) / H, dxJ = new Float64Array(H), aJ = new Float64Array(H);
  // (verso i poli i paralleli si stringono: sotto un decimo del lato lungo il meridiano la cella non si stringe più, per il conto)
  for (let j = 0; j < H; j++) { const lat = Math.PI / 2 - (rv0 + ((j + 0.5) / H) * (rv1 - rv0)) * Math.PI; dxJ[j] = Math.max(0.1 * dy, (2 * Math.PI * R * Math.cos(lat) * (ru1 - ru0)) / W); aJ[j] = dxJ[j] * dy; }
  // QUANTO DURA: l'età media dei fondali (la geografia di oggi), o ciò che dice chi chiama (una tessera: in proporzione al lato)
  let T = durata ? durata * Math.min(1, dy / ((Math.PI * R) / 128)) : E.durataSenzaPlacche;
  if (!durata && sf.etaCrosta && sf.cont) { let e = 0, m = 0; for (let k = 0; k < N; k++) if (!sf.cont[k] && sf.etaCrosta[k] > 0) { e += sf.etaCrosta[k]; m++; } if (m) T = (1e6 * e) / m; }
  const dt = T / passi, rocciaK = (k) => (coperta[k] > 1 ? E.K.sedimento : sf.cont && !sf.cont[k] ? E.K.vulcanica : E.K.granito);
  let erosoTot = 0, depTerra = 0, depMare = 0, alMare = 0, daiVersanti = 0, areaTerre = 0;
  for (let k = 0; k < N; k++) if (!(alt[k] < mare)) areaTerre += aJ[(k - (k % W)) / W];
  for (let it = 0; it < passi; it++) {
    // inondazione: dal mare (o dal punto più basso, se non c'è mare) verso l'interno; chi resta sotto il
    // livello di chi lo precede sta in una conca: lì c'è un lago
    hn = 0; visto.fill(0); let n = 0;
    let fonti = 0; for (let k = 0; k < N; k++) if (alt[k] < mare) { push(k, alt[k]); visto[k] = 1; ricevente[k] = -1; pieno[k] = alt[k]; fonti++; }
    // una tessera ha i bordi aperti: l'acqua esce verso le tessere vicine
    if (aperto) for (let k = 0; k < N; k++) { const i = k % W, j = (k - i) / W; if ((i === 0 || j === 0 || i === W - 1 || j === H - 1) && !visto[k]) { push(k, alt[k]); visto[k] = 1; ricevente[k] = -1; pieno[k] = alt[k]; fonti++; } }
    if (!fonti) { let m = 0; for (let k = 1; k < N; k++) if (alt[k] < alt[m]) m = k; push(m, alt[m]); visto[m] = 1; ricevente[m] = -1; pieno[m] = alt[m]; }
    while (hn) {
      const c = pop(), jc = (c - (c % W)) / W; ordine[n++] = c;
      vicini(c, (q, d, di, jq) => { if (visto[q]) return; visto[q] = 1; ricevente[q] = c; dist[q] = Math.hypot(di * 0.5 * (dxJ[jq] + dxJ[jc]), (jq - jc) * dy); pieno[q] = Math.max(alt[q], pieno[c] + 0.01); push(q, pieno[q]); });
    }
    // la portata: la pioggia raccolta da monte a valle (area: in celle × m/anno, per chi legge il flusso; portata: m³/anno)
    const secco = cl.piove === false ? 0 : 0.2;
    for (let k = 0; k < N; k++) { area[k] = secco + pioggia[k] + (afflusso ? afflusso[k] : 0); portata[k] = area[k] * aJ[(k - (k % W)) / W]; inizio[k] = alt[k]; }
    for (let x = n - 1; x > 0; x--) { const k = ordine[x], r = ricevente[k]; if (r >= 0) { area[r] += area[k]; portata[r] += portata[k]; } }
    // I FIUMI SCAVANO (implicito, da valle a monte) dove l'acqua scorre e non ristagna
    for (let x = 0; x < n; x++) {
      const k = ordine[x], r = ricevente[k]; if (r < 0 || alt[k] < mare) continue;
      if (pieno[k] > alt[k] + 0.5) continue; // nel lago non si scava: si deposita
      const F = (rocciaK(k) * Math.pow(portata[k] / E.pioggiaRif, E.m) * dt) / dist[k];
      if (alt[r] < alt[k]) { const prima = alt[k]; alt[k] = (alt[k] + F * alt[r]) / (1 + F); const tolto = prima - alt[k]; eroso[k] = tolto * aJ[(k - (k % W)) / W]; coperta[k] = Math.max(0, coperta[k] - tolto); }
    }
    // IL SEDIMENTO (m³): scende con l'acqua, da monte a valle. Il fiume porta al più la sua capacità: ciò che ha scavato
    // lui in più di quella lo riposa dov'è (non scava più di quanto riesce a portare via); il resto si posa dove l'acqua
    // rallenta, nei laghi e sulle coste: le conche si riempiono, nascono pianure e delta
    for (let x = n - 1; x > 0; x--) {
      const k = ordine[x], r = ricevente[k]; if (r < 0) continue;
      const ak = aJ[(k - (k % W)) / W], ar = aJ[(r - (r % W)) / W];
      let carico = sedimento[k] + eroso[k] + versante[k]; erosoTot += eroso[k] + versante[k]; daiVersanti += versante[k]; versante[k] = 0; sedimento[k] = 0;
      if (eroso[k] > 0) { const S = Math.max(0, alt[k] - alt[r]) / dist[k], capacita = E.kQs * E.piena * portata[k] * Math.pow(S, E.capacitaEsponente) * dt, troppo = Math.min(eroso[k], Math.max(0, carico - capacita));
        if (troppo > 0) { alt[k] += troppo / ak; carico -= troppo; erosoTot -= troppo; } }
      eroso[k] = 0;
      const spazio = alt[r] < mare ? mare - alt[r] : pieno[r] - alt[r];
      if (spazio > 0.5) { const dep = Math.max(0, Math.min(carico / ar, spazio * 0.5)); const eraMare = alt[r] < mare; alt[r] += dep; carico = Math.max(0, carico - dep * ar); depositato[r] += dep; coperta[r] += dep; if (eraMare) depMare += dep * ar; else depTerra += dep * ar; }
      sedimento[r] += carico;
    }
    for (let k = 0; k < N; k++) if (ricevente[k] < 0 && sedimento[k] > 0) { alMare += sedimento[k]; sedimento[k] = 0; } // ciò che arriva al mare (o esce dalla tessera) e non si è posato
    // I PENDII SCIVOLANO: tra due celle di terra vicine passa K_d·Δh/d per metro di confine. Una cella che riceve acqua
    // da altre è un letto di fiume: non cede e non si alza; ciò che i versanti le danno va nel carico del fiume
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i; if (alt[k] < mare || pieno[k] > alt[k] + 0.5) continue;
      for (let lato = 0; lato < 2; lato++) { const q = lato ? (j + 1 < H ? k + W : -1) : j * W + ((i + 1) % W); if (q < 0 || alt[q] < mare || pieno[q] > alt[q] + 0.5) continue;
        const d = lato ? dy : 0.5 * (dxJ[j] + dxJ[j]), largo = lato ? dxJ[j] : dy, su = alt[k] > alt[q] ? k : q, giu = su === k ? q : k, aS = aJ[(su - (su % W)) / W], aG = aJ[(giu - (giu % W)) / W];
        if (area[su] > secco + pioggia[su] + (afflusso ? afflusso[su] : 0) + 1e-6) continue; // chi cede è un letto: non è un pendio
        // (al più un quinto del dislivello per passo: oltre, il conto esplicito salterebbe; è già il pendio all'equilibrio)
        const vol = Math.min((E.pendii * (cl.sgretola ?? 0.05) / 0.05) * ((alt[su] - alt[giu]) / d) * largo * dt, 0.2 * (alt[su] - alt[giu]) * Math.min(aS, aG));
        calo[su] += vol / aS; if (area[giu] > secco + pioggia[giu] + (afflusso ? afflusso[giu] : 0) + 1e-6) versante[giu] += vol; else calo[giu] -= vol / aG; }
    }
    for (let k = 0; k < N; k++) if (calo[k] !== 0) { alt[k] -= calo[k]; calo[k] = 0; }
    // LA CROSTA RISPONDE (solo sul pianeta intero): l'isostasia rialza la regione di ρc/ρm di ciò che ha perso, e dove le
    // placche spingono la quota media della regione torna quella di prima
    if (crescita) { for (let k = 0; k < N; k++) calo[k] = alt[k] < mare ? 0 : inizio[k] - alt[k];
      for (let k = 0; k < N; k++) { if (alt[k] < mare) continue; let m = calo[k], c = 1; vicini(k, (q) => { if (!(alt[q] < mare)) { m += calo[q]; c++; } }); m /= c;
        portata[k] = E.isostasia * m + (sf.spinta && m > 0 ? sf.spinta[k] * (1 - E.isostasia) * m : 0); }
      for (let k = 0; k < N; k++) { if (!(alt[k] < mare)) alt[k] += portata[k]; calo[k] = 0; } }
  }
  // una conca diventa lago solo se l'acqua che le arriva supera quella che evapora (più fa caldo, più
  // evapora); altrimenti resta asciutta, una piana di sale
  const lago = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    if (alt[k] < mare || pieno[k] <= alt[k] + 1) continue;
    const [u0, v0, u1, v1] = sf.rett || [0, 0, 1, 1];
    const ci = ((Math.floor((u0 + ((k % W) / W) * (u1 - u0)) * cl.W) % cl.W) + cl.W) % cl.W, cj = Math.max(0, Math.min(cl.H - 1, Math.floor((v0 + (Math.floor(k / W) / H) * (v1 - v0)) * cl.H))), T = cl.media[cj * cl.W + ci];
    const evapora = 4 + 30 * Math.max(0, Math.min(1, (T - 260) / 50));
    if (area[k] > evapora * scala) { lago[k] = pieno[k] - alt[k]; laghi++; }
  }
  const flusso = new Float32Array(N); for (let k = 0; k < N; k++) flusso[k] = area[k];
  const out = { ...sf, alt, flusso, lago, depositato, celleLago: laghi, passiErosione: passi, versoValle: Int32Array.from(ricevente), durataErosione: T, denudazione: areaTerre > 0 ? erosoTot / areaTerre / T : 0, fangoAlMare: ((alMare + depMare) * E.densita) / T,
    bilancio: { eroso: erosoTot, depositato: depTerra + depMare, alMare, daiVersanti } };
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
// IL BORDO. Ogni tessera si calcola un po' più larga di quel che mostra (un ottavo in più per lato): così l'erosione
// vede anche il terreno appena fuori, i fiumi non «sentono» il taglio, e due tessere vicine combaciano. Il bordo in
// più non si mostra, ma resta alla tessera per fare da madre alle sue figlie (che così leggono oltre il loro lato).
const BORDO = 1 / 8;
export function tessera(chiave, radice, cl, L, tx, ty, seme = 1) {
  if (L === 0) return radice.rett ? radice : Object.assign(radice, { rett: [0, 0, 1, 1], livello: 0 });
  const k = `${chiave}|${L}|${tx}|${ty}`; if (memoTessere.has(k)) return memoTessere.get(k);
  const m = tessera(chiave, radice, cl, L - 1, tx >> 2, ty >> 2, seme), { W, H, mare } = m, n = 4 ** L;
  const Pw = Math.round(W * BORDO), Ph = Math.round(H * BORDO), Wl = W + 2 * Pw, Hl = H + 2 * Ph, N = Wl * Hl, du = 1 / n;
  const rett = [tx / n, ty / n, (tx + 1) / n, (ty + 1) / n], rettL = [rett[0] - BORDO * du, rett[1] - BORDO * du, rett[2] + BORDO * du, rett[3] + BORDO * du];
  // la madre con il suo bordo; la radice (il pianeta intero) si richiude in longitudine
  const M = m.largo || { W: m.W, H: m.H, rett: m.rett, alt: m.alt, flusso: m.flusso, lago: m.lago, giro: true }, [mu0, mv0, mu1, mv1] = M.rett, MW = M.W, MH = M.H;
  const ix = (x) => (M.giro ? ((x % MW) + MW) % MW : Math.max(0, Math.min(MW - 1, x))), iy = (y) => Math.max(0, Math.min(MH - 1, y));
  const bil = (arr, fx, fy) => { const x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, a = iy(y0) * MW, b = iy(y0 + 1) * MW, p = ix(x0), q = ix(x0 + 1); return arr[a + p] * (1 - u) * (1 - v) + arr[a + q] * u * (1 - v) + arr[b + p] * (1 - u) * v + arr[b + q] * u * v; };
  const alt = new Float32Array(N), afflusso = new Float32Array(N), livelloLago = new Float32Array(N);
  const amp = 260 * Math.pow(0.36, L), f1 = (W * n) / 9, f2 = (W * n) / 3.1;
  for (let j = 0; j < Hl; j++) for (let i = 0; i < Wl; i++) {
    const gu = rettL[0] + ((i + 0.5) / Wl) * (rettL[2] - rettL[0]), gv = rettL[1] + ((j + 0.5) / Hl) * (rettL[3] - rettL[1]), c = j * Wl + i;
    const fx = ((gu - mu0) / (mu1 - mu0)) * MW - 0.5, fy = ((gv - mv0) / (mv1 - mv0)) * MH - 0.5;
    alt[c] = bil(M.alt, fx, fy) + amp * (rumore(gu * f1, gv * f1 * 0.5, seme + L) + 0.45 * rumore(gu * f2, gv * f2 * 0.5, seme + 31 * L));
    if (i === 0 || j === 0 || i === Wl - 1 || j === Hl - 1) afflusso[c] = M.flusso[iy(Math.round(fy)) * MW + ix(Math.round(fx))] * 4; // la portata dei fiumi che entrano
    if (M.lago) { // il lago della madre: la sua superficie è piatta, la riva la decide il terreno fine
      const x0 = Math.floor(fx), y0 = Math.floor(fy); let lev = 0;
      for (const q of [iy(y0) * MW + ix(x0), iy(y0) * MW + ix(x0 + 1), iy(y0 + 1) * MW + ix(x0), iy(y0 + 1) * MW + ix(x0 + 1)]) if (M.lago[q] > 0) lev = Math.max(lev, M.alt[q] + M.lago[q]);
      livelloLago[c] = lev;
    }
  }
  const e = erosione(k, { W: Wl, H: Hl, raggioM: radice.raggioM, alt, mare, rett: rettL, vulcani: [] }, cl, { passi: 26, aperto: true, afflusso, crescita: false, scala: 4 ** L, durata: radice.durataErosione });
  for (let c = 0; c < N; c++) if (livelloLago[c] > e.alt[c]) e.lago[c] = Math.max(e.lago[c], livelloLago[c] - e.alt[c]);
  // ciò che si mostra: il centro, senza il bordo
  const out = { ...e, W, H, rett, livello: L, vulcani: [], materiali: m.materiali };
  for (const [nome, v] of Object.entries(e)) if (ArrayBuffer.isView(v) && v.length === N) { const r = new v.constructor(W * H); for (let j = 0; j < H; j++) r.set(v.subarray((j + Ph) * Wl + Pw, (j + Ph) * Wl + Pw + W), j * W); out[nome] = r; }
  const qx = tx & 3, qy = ty & 3, cont = new Uint8Array(W * H); if (m.cont) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) cont[j * W + i] = m.cont[Math.min(H - 1, Math.floor((qy + j / H) * (H / 4))) * W + Math.min(W - 1, Math.floor((qx + i / W) * (W / 4)))];
  out.cont = cont; out.largo = { W: Wl, H: Hl, rett: rettL, alt: e.alt, flusso: e.flusso, lago: e.lago };
  // l'età della crosta e le fosse della madre, ricampionate come i continenti
  for (const nome of ['etaCrosta', 'fosse']) if (m[nome]) { const r = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) r[j * W + i] = m[nome][Math.min(H - 1, Math.floor((qy + j / H) * (H / 4))) * W + Math.min(W - 1, Math.floor((qx + i / W) * (W / 4)))]; out[nome] = r; }
  memoTessere.set(k, out); if (memoTessere.size > 48) memoTessere.delete(memoTessere.keys().next().value);
  return out;
}
