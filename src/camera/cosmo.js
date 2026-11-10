// cosmo.js — l'universo intero, da esplorare.
//
// Niente entra dal bordo, perché il bordo non c'è: lo spazio è richiuso su sé
// stesso (un toro: chi va sempre dritto torna da dove è partito). Tutto ha una
// causa che si può raggiungere con lo zoom:
//   le fluttuazioni quantistiche dell'inizio → la rete cosmica → le galassie
//   (con un buco nero al centro, i bracci, i resti di supernova, le pulsar) →
//   le stelle → i pianeti, i loro campi e i loro anelli → le regioni, dove i
//   raggi cosmici partiti da quelle sorgenti incontrano la polvere e il campo
//   del pianeta: i nostri universi della camera, le finestre, i pattern.
//
// Niente è conservato: c'è una regola che, dato un indirizzo, dice che cosa c'è
// lì, sempre la stessa cosa. L'universo «c'è già», infinito; si calcola solo il
// pezzo che si guarda.
//
// Indirizzo: { cosmo, galassia, stella, pianeta, regione }. «cosmo» è il ramo
// dell'inizio: cosmi diversi sono universi paralleli separati prestissimo (già
// le galassie sono altre). Il numero della biblioteca è l'indirizzo scritto in
// cifre: numeri vicini sono posti vicini dello stesso universo.

import { generatore, simulaMondo } from './mondo.js';
import { unita, catalogoVero, velocita, fmtLunghezza } from './unita.js';

export const REGIONI = 12, PIANETI_MAX = 8, STELLE = 2500, GALASSIE_MAX = 200;

// il caso di un indirizzo
export function hash(...parti) {
  let h = 0x811c9dc5;
  const s = parti.join('/');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
}
const casoDi = (...parti) => { const c = generatore(hash(...parti)); const tra = (a, b) => a + c() * (b - a); return { c, tra, intero: (a, b) => Math.floor(tra(a, b + 1)), gauss: () => { let u = 0; for (let i = 0; i < 6; i++) u += c(); return (u - 3) / Math.SQRT1_2 / 1.0; } }; };
const memo = (f) => { const m = new Map(); return (...a) => { const k = a.join('|'); if (!m.has(k)) { if (m.size > 64) m.delete(m.keys().next().value); m.set(k, f(...a)); } return m.get(k); }; };

// ---------- il numero della biblioteca ↔ l'indirizzo
export function indirizzoDi(numero) {
  let n = Math.max(1, Math.floor(numero)) - 1;
  const regione = n % REGIONI; n = Math.floor(n / REGIONI);
  const slot = n % PIANETI_MAX; n = Math.floor(n / PIANETI_MAX);
  const stella = n % STELLE; n = Math.floor(n / STELLE);
  const gslot = n % GALASSIE_MAX; n = Math.floor(n / GALASSIE_MAX);
  const cosmoN = n + 1;
  const C = cosmo(cosmoN), galassia = gslot % C.galassie.length;
  const S = sistema(cosmoN, galassia, stella);
  return { cosmo: cosmoN, galassia, stella, pianeta: slot % S.pianeti.length, regione };
}
export function numeroDi(a) {
  return 1 + a.regione + REGIONI * (a.pianeta + PIANETI_MAX * (a.stella + STELLE * (a.galassia + GALASSIE_MAX * (a.cosmo - 1))));
}

// ---------- il cosmo: le fluttuazioni dell'inizio, la rete, le galassie
export const cosmo = memo((n) => {
  const { c, tra, intero } = casoDi('cosmo', n);
  // le fluttuazioni: onde con vettori interi (il toro si richiude), più forti le lunghe
  const modi = [];
  for (let i = 0; i < 70; i++) {
    let kx = 0, ky = 0; while (!kx && !ky) { kx = intero(-9, 9); ky = intero(-9, 9); }
    const k = Math.hypot(kx, ky); modi.push({ kx, ky, a: Math.pow(k, -1.25) * tra(0.5, 1.5), fi: tra(0, 2 * Math.PI) });
  }
  const densita = (x, y) => { let s = 0; for (const m of modi) s += m.a * Math.cos(2 * Math.PI * (m.kx * x + m.ky * y) + m.fi); return s; };
  // la rete: la densità su una griglia (per disegnarla e per trovare i picchi)
  const N = 96, griglia = new Float32Array(N * N);
  let media = 0, var2 = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = densita(i / N, j / N); griglia[j * N + i] = v; media += v; var2 += v * v; }
  media /= N * N; const sigma = Math.sqrt(var2 / (N * N) - media * media);
  // le galassie: dove la materia è più densa (i picchi), e qualcuna più piccola lungo i filamenti
  const galassie = [];
  const g = (i, j) => griglia[((j + N) % N) * N + ((i + N) % N)];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const v = g(i, j); if (v < media + 0.9 * sigma) continue;
    let picco = true; for (let dj = -1; dj <= 1 && picco; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && g(i + di, j + dj) > v) { picco = false; break; }
    if (picco) galassie.push({ pos: [(i + tra(0, 1)) / N, (j + tra(0, 1)) / N], peso: (v - media) / sigma });
  }
  for (let k = 0; k < 400 && galassie.length < 150; k++) {
    const x = c(), y = c(), v = (densita(x, y) - media) / sigma;
    if (v > 0.2 && c() < 0.25 * v) galassie.push({ pos: [x, y], peso: v * 0.6 });
  }
  galassie.sort((a, b) => b.peso - a.peso); galassie.length = Math.min(galassie.length, GALASSIE_MAX);
  galassie.forEach((G, id) => {
    const r = casoDi('galassia', n, id);
    G.id = id; G.r = 0.0035 + 0.0035 * Math.min(3, G.peso) * r.tra(0.6, 1.2);
    G.tipo = r.c() < 0.72 ? 'spirale' : 'ellittica'; G.bracci = r.intero(2, 4); G.angolo = r.tra(0, 2 * Math.PI); G.passo = r.tra(0.25, 0.5);
    G.schiacciata = G.tipo === 'ellittica' ? r.tra(0.45, 0.95) : 1; G.attivita = Math.pow(r.c(), 2.2); G.getto = r.tra(0, Math.PI);
    G.tinta = G.tipo === 'ellittica' ? [255, 214, 170] : [210, 222, 255];
  });
  return { n, modi, densita, griglia, N, media, sigma, galassie };
});

// ---------- una galassia: le stelle, il buco nero, le sorgenti dei raggi cosmici
// coordinate della galassia: il raggio è 1, il buco nero è al centro
const colorePerTemperatura = (T) => { // da rossa (3000 K) a azzurra (20000 K)
  const t = Math.max(0, Math.min(1, Math.log(T / 3000) / Math.log(20000 / 3000)));
  return [Math.round(255 - 40 * t), Math.round(150 + 90 * t - 20 * t * t), Math.round(90 + 165 * t)];
};
export const galassia = memo((n, id) => {
  const G = cosmo(n).galassie[id], { c, tra, gauss } = casoDi('stelle', n, id);
  const stelle = [];
  for (let s = 0; s < STELLE; s++) {
    let x, y;
    if (G.tipo === 'ellittica') { const r = Math.abs(gauss()) * 0.35, a = tra(0, 2 * Math.PI); x = r * Math.cos(a); y = r * Math.sin(a) * G.schiacciata; }
    else if (c() < 0.22) { const r = Math.abs(gauss()) * 0.12, a = tra(0, 2 * Math.PI); x = r * Math.cos(a); y = r * Math.sin(a); }
    else {
      // il disco con i bracci: spirali logaritmiche
      const r = Math.min(1, 0.08 - 0.3 * Math.log(1 - c() * 0.95)), braccio = Math.floor(c() * G.bracci);
      const a = G.angolo + (2 * Math.PI * braccio) / G.bracci + Math.log(r / 0.08) / Math.tan(G.passo) + gauss() * (c() < 0.7 ? 0.18 : 0.6);
      x = r * Math.cos(a); y = r * Math.sin(a);
    }
    const massa = Math.min(40, 0.3 * Math.pow(1 - c() * 0.999, -1 / 1.35)), T = 3000 * Math.pow(massa / 0.3, 0.55);
    stelle.push({ id: s, pos: [x, y], massa, T, colore: colorePerTemperatura(T) });
  }
  // il buco nero e le sorgenti dei raggi cosmici: il suo getto, i resti di supernova, le pulsar
  const sorgenti = [{ tipo: 'getto', nome: 'il getto del buco nero', pos: [0, 0], potenza: 2 + 10 * G.attivita, angolo: G.getto }];
  const nRes = 3 + Math.floor(c() * 6);
  for (let k = 0; k < nRes; k++) {
    const s = stelle[Math.floor(c() * STELLE)];
    sorgenti.push({ tipo: 'supernova', nome: `il resto della supernova ${k + 1}`, pos: s.pos.slice(), r: tra(0.01, 0.045), potenza: tra(0.6, 2) });
    if (c() < 0.4) sorgenti.push({ tipo: 'pulsar', nome: `la pulsar nel resto ${k + 1}`, pos: [s.pos[0] + tra(-0.005, 0.005), s.pos[1] + tra(-0.005, 0.005)], potenza: tra(0.3, 1) });
  }
  return { G, stelle, sorgenti, buco: { M: 0.5 + 2 * G.attivita } };
});

// ---------- le grandezze vere di ogni livello (per il metro sullo schermo). Tra un livello e
// l'altro lo zoom fa un salto: dentro ogni livello i rapporti sono quelli veri.
export const TORO_M = 3.7e25; // il lato del cosmo richiuso (circa 1,2 miliardi di parsec)
export const metriPerUnita = (livello, via) => {
  if (livello === 0) return TORO_M;
  if (livello === 1) { const G = cosmo(via.cosmo).galassie[via.galassia]; return (G.tipo === 'ellittica' ? 6e20 : 4.5e20) * (0.7 + 0.15 * Math.min(4, G.peso)); }
  if (livello === 2) return 30 * 1.496e11;
  return sistema(via.cosmo, via.galassia, via.stella).pianeti[via.pianeta].raggioM;
};

// ---------- un sistema: la stella e i suoi pianeti
// coordinate del sistema: l'orbita più esterna è circa 1 (trenta unità astronomiche)
export const RAGGIO_SISTEMA = 0.0025; // in unità della galassia (sulla mappa)
export const sistema = memo((n, gid, sid) => {
  const S = galassia(n, gid).stelle[sid], { c, tra, intero } = casoDi('sistema', n, gid, sid);
  const np = intero(1, PIANETI_MAX), pianeti = [];
  let a = tra(0.1, 0.18);
  for (let k = 0; k < np; k++) {
    const freddo = a > 0.4, tipo = freddo ? (c() < 0.6 ? 'gassoso' : 'ghiacciato') : (c() < 0.8 ? 'roccioso' : 'gassoso');
    const r = tipo === 'gassoso' ? tra(0.022, 0.04) : tra(0.008, 0.018);
    // le grandezze vere: il raggio (m) e il campo magnetico all'equatore (T)
    const raggioM = tipo === 'gassoso' ? tra(2.4e7, 7.5e7) : tipo === 'ghiacciato' ? tra(1.5e7, 2.6e7) : tra(2.4e6, 9e6);
    const B0 = tipo === 'gassoso' ? tra(2e-5, 4.5e-4) : tipo === 'ghiacciato' ? tra(1e-5, 4e-5) : (c() < 0.3 ? tra(1e-8, 1e-6) : tra(1e-5, 6e-5));
    pianeti.push({
      id: k, a, fase: tra(0, 2 * Math.PI), r, tipo, raggioM, B0,
      campo: Math.min(1, Math.log10(B0 / 1e-8) / Math.log10(4.5e-4 / 1e-8)),
      anelli: (tipo !== 'roccioso' && c() < 0.6) || c() < 0.08, lune: intero(0, tipo === 'gassoso' ? 6 : 2),
      colore: { roccioso: [176, 140, 110], gassoso: [214, 178, 128], ghiacciato: [156, 196, 222] }[tipo].map((v) => Math.round(v * tra(0.8, 1.15))),
    });
    pianeti[k].pos = [a * Math.cos(pianeti[k].fase), a * Math.sin(pianeti[k].fase)];
    a *= tra(1.35, 1.8); if (a > 1.1) break;
  }
  return { stella: { ...S, r: 0.012 + 0.006 * Math.cbrt(S.massa) }, pianeti };
});

// ---------- un pianeta: l'anello, la magnetosfera, le regioni
// coordinate del pianeta: il raggio del pianeta è 1
export const LATO_REGIONE = 0.32; // in raggi del pianeta
export const pianeta = memo((n, gid, sid, pid) => {
  const P = sistema(n, gid, sid).pianeti[pid], { tra } = casoDi('pianeta', n, gid, sid, pid);
  // l'anello: fasce più e meno dense (come quelle vere); una funzione sola per il disegno e per la fisica
  const anello = P.anelli ? [tra(1.3, 1.6), tra(2.0, 2.5)] : null;
  const bande = anello ? Array.from({ length: 5 }, () => ({ r: tra(anello[0], anello[1]), w: tra(0.02, 0.12), a: tra(0.3, 1.2) })) : [];
  const densitaAnello = (r) => (!anello || r < anello[0] || r > anello[1] ? 0 : Math.min(2, 0.15 + bande.reduce((s, b) => s + b.a * Math.exp(-(((r - b.r) / b.w) ** 2)), 0)));
  const regioni = [];
  for (let k = 0; k < REGIONI; k++) {
    const nelAnello = anello && k < 6;
    const ang = (2 * Math.PI * k) / REGIONI + tra(-0.15, 0.15), rr = nelAnello ? tra(anello[0] + 0.1, anello[1] - 0.1) : tra(1.45, 4);
    regioni.push({ id: k, pos: [rr * Math.cos(ang), rr * Math.sin(ang)], angolo: ang, r: rr, nellAnello: !!nelAnello && densitaAnello(rr) > 0.05 });
  }
  return { P, anello, densitaAnello, regioni };
});

// ---------- la fisica alla scala del pianeta: il suo campo (un dipolo), il pianeta come ostacolo
// mondo del pianeta: 4000 × 4000 unità, il pianeta al centro con raggio 100 unità
const MONDO_P = 4000, R_P = 100;
function mondoPianeta(P) {
  const u = unita(P.raggioM * (1000 / R_P));
  return { u, cella: { larghezza: MONDO_P, altezza: MONDO_P, c: 40, relativita: true, bordo: 'aperto', tempo: 900, fondo: { B: 0, K: 0 }, domini: [],
    masse: [{ pos: [MONDO_P / 2, MONDO_P / 2], M: 0, R: R_P }], dipoli: [{ centro: [MONDO_P / 2, MONDO_P / 2], B0: u.B(P.B0), R: R_P }], pellicola: { w0: 0.8, saturazione: 4, vRif: 5 } } };
}
// lo spettro dei raggi cosmici: tanti lenti, pochi velocissimi (energia cinetica in MeV, ~E^-2.7)
const energiaRaggio = (x, Emin = 500) => { const a = Emin ** -1.7, b = 1e6 ** -1.7; return (a - x * (a - b)) ** (-1 / 1.7); };
// la soglia di Størmer: sotto questa rigidità (GV) un raggio non arriva a quella distanza dal pianeta
// (cresce con il campo e il raggio del pianeta, cala come il quadrato della distanza; Terra all'equatore: 14,9 GV)
const sogliaStormer = (P, r) => (14.9 / (3.1e-5 * 6.371e6)) * P.B0 * P.raggioM / (r * r);
const energiaDaRigidita = (GV) => Math.sqrt((GV * 1000) ** 2 + 938.27 ** 2) - 938.27;
const impulsoProtone = (E) => Math.sqrt(E * E + 2 * E * 938.27);
// da quali direzioni arrivano i raggi alla stella del pianeta: le sorgenti della galassia, sparpagliate dal suo campo
function cieloDeiRaggi(a) {
  const Gx = galassia(a.cosmo, a.galassia), st = Gx.stelle[a.stella].pos;
  const sorgenti = Gx.sorgenti.map((s) => { const d = Math.hypot(st[0] - s.pos[0], st[1] - s.pos[1]); return { ...s, verso: Math.atan2(s.pos[1] - st[1], s.pos[0] - st[0]), peso: s.potenza / (0.02 + d * d), k: Math.max(0.6, 6 / (1 + 25 * d)) }; });
  const fondo = 0.15 * sorgenti.reduce((x, s) => x + s.peso, 0);
  const contributi = (fi) => sorgenti.map((s) => s.peso * Math.exp(s.k * (Math.cos(fi - s.verso) - 1)));
  const flusso = (fi) => fondo + contributi(fi).reduce((x, y) => x + y, 0);
  const chi = (fi, u) => { const w = contributi(fi), t = w.reduce((x, y) => x + y, 0) + fondo; let r = u * t; for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return sorgenti[i].nome; return 'il fondo di raggi della galassia'; };
  return { flusso, chi, massimo: fondo + sorgenti.reduce((x, s) => x + s.peso, 0), sorgenti };
}

// le orbite dei raggi cosmici attorno al pianeta (orbite di Størmer), per la mappa
export const magnetosfera = memo((n, gid, sid, pid) => {
  const P = sistema(n, gid, sid).pianeti[pid], { c: caso } = casoDi('magnetosfera', n, gid, sid, pid);
  const { cella } = mondoPianeta(P), cielo = cieloDeiRaggi({ cosmo: n, galassia: gid, stella: sid });
  const sorgenti = [];
  for (let k = 0; k < 400 && sorgenti.length < 36; k++) {
    const fi = caso() * 2 * Math.PI; if (caso() * cielo.massimo > cielo.flusso(fi)) continue;
    // arriva da lontano, dalla direzione fi, con un parametro d'urto a caso
    const b = (caso() - 0.5) * 2 * 12 * R_P, E = energiaRaggio(caso() * 0.9, Math.max(500, energiaDaRigidita(0.3 * sogliaStormer(P, 6))));
    const pos = [MONDO_P / 2 + Math.cos(fi) * 1950 - Math.sin(fi) * b, MONDO_P / 2 + Math.sin(fi) * 1950 + Math.cos(fi) * b];
    if (pos[0] < 0 || pos[1] < 0 || pos[0] > MONDO_P || pos[1] > MONDO_P) continue;
    sorgenti.push({ pos, dir: fi + Math.PI, v: velocita(impulsoProtone(E), 1836.15), t0: 0, specie: 'protone' });
  }
  const tracce = simulaMondo({ ...cella, specie: { protone: { q: 1, m: 1836.15 } }, sorgenti }, { passo: 6, maxPassi: 8000 });
  // in raggi del pianeta, con l'origine al centro
  return tracce.map((t) => t.punti.filter((_, i) => i % 2 === 0 || i === t.punti.length - 1).map((p) => [(p[0] - MONDO_P / 2) / R_P, (p[1] - MONDO_P / 2) / R_P]));
});

// ---------- una regione: un pezzo della magnetosfera (o dell'anello) del pianeta
export const descriviIndirizzo = (a) => {
  const G = cosmo(a.cosmo).galassie[a.galassia], P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta];
  return `${a.cosmo > 1 ? `cosmo ${a.cosmo} · ` : ''}galassia ${a.galassia + 1} (${G.tipo}) · stella ${a.stella + 1} · pianeta ${a.pianeta + 1} (${P.tipo}${P.anelli ? ', con anelli' : ''}) · regione ${a.regione + 1}`;
};
export const CATALOGO = catalogoVero(unita(1e6));

export function regione(a) {
  const numero = numeroDi(a), S = sistema(a.cosmo, a.galassia, a.stella), P = S.pianeti[a.pianeta], Pl = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta), R = Pl.regioni[a.regione];
  const { c: caso } = casoDi('regione', a.cosmo, a.galassia, a.stella, a.pianeta, a.regione);
  const LATO = 1000, latoM = LATO_REGIONE * P.raggioM, u = unita(latoM), { cella: cp } = mondoPianeta(P);
  // la regione nel mondo del pianeta
  const cx = MONDO_P / 2 + R.pos[0] * R_P, cy = MONDO_P / 2 + R.pos[1] * R_P, lp = LATO_REGIONE * R_P, x0 = cx - lp / 2, y0 = cy - lp / 2, k = LATO / lp;
  // I RAGGI COSMICI, CALCOLATI ALL'INDIETRO. Si parte dal bordo della regione con una direzione
  // verso l'interno e un'energia dallo spettro vero, e si segue la particella indietro nel tempo
  // (stessa strada, carica opposta, verso opposto) nel campo vero del pianeta. Se all'indietro
  // esce dalla magnetosfera, è arrivata davvero, dalla direzione da cui è uscita; se sbatte
  // contro il pianeta o resta intrappolata, quella traiettoria non esiste.
  const cielo = cieloDeiRaggi(a), sorgenti = [], specieP = { indietro: { q: -1, m: 1836.15 } };
  let prove = 0, vietate = 0;
  // sotto un terzo della soglia non arriva nessuno da nessuna direzione; e più alta è la soglia, meno
  // raggi ci sono (lo spettro cala): così una magnetosfera forte è davvero schermata
  const Emin = Math.max(500, energiaDaRigidita(0.3 * sogliaStormer(P, R.r)));
  const voluti = Math.round((9 + caso() * 8) * Math.min(1, (Emin / 500) ** -1.7));
  while (sorgenti.length < voluti && prove < 12 * voluti + 20) {
    prove++;
    const lato = Math.floor(caso() * 4), t = caso(), nrm = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][lato];
    const pe = [[x0 + t * lp, y0], [x0 + lp, y0 + t * lp], [x0 + t * lp, y0 + lp], [x0, y0 + t * lp]][lato];
    const dir = nrm + Math.asin(2 * caso() - 1), E = energiaRaggio(caso(), Emin), v = velocita(impulsoProtone(E), 1836.15);
    const tr = simulaMondo({ ...cp, tempo: 400, specie: specieP, sorgenti: [{ pos: pe, dir: dir + Math.PI, v, specie: 'indietro' }] }, { passo: 6, maxParticelle: 1, maxPassi: 5000 })[0];
    if (!tr || tr.fine !== 'fuori') { vietate++; continue; }
    const q = tr.punti, ult = q[q.length - 1], pen = q[Math.max(0, q.length - 3)], esce = Math.atan2(ult[1] - pen[1], ult[0] - pen[0]);
    // il flusso da quella direzione decide se c'è davvero un raggio
    if (caso() * cielo.massimo > cielo.flusso(esce)) continue;
    const pos = [Math.min(LATO - 0.01, Math.max(0.01, (pe[0] - x0) * k)), Math.min(LATO - 0.01, Math.max(0.01, (pe[1] - y0) * k))];
    sorgenti.push({ pos, dir, v, t0: 0, specie: 'protone', emissione: { t0: [0, 100] }, origine: `${cielo.chi(esce, caso())} (galassia ${a.galassia + 1})`, energia: E, arrivo: esce });
  }
  // la materia dell'anello: la stessa densità che si vede sulla mappa. Un raggio che la
  // attraversa può urtare un granello di ghiaccio: ne esce uno sciame.
  const tau = Pl.densitaAnello(R.r), urtoProtone = tau > 0.05 ? (0.9 * LATO) / tau : Infinity;
  const specie = catalogoVero(u, { urtoProtone, urtoFotone: urtoProtone * 0.55 });
  const centroP = [(MONDO_P / 2 - x0) * k, (MONDO_P / 2 - y0) * k], RPr = R_P * k;
  const cella = {
    larghezza: LATO, altezza: LATO, c: 40, G: 1, bordo: 'aperto', tempo: 140, relativita: true, seme: numero, indirizzo: { ...a },
    fondo: { B: 0, K: 0 }, domini: [], masse: [{ pos: centroP, M: 0, R: RPr }], dipoli: [{ centro: centroP, B0: u.B(P.B0), R: RPr }],
    pellicola: { w0: 0.8, saturazione: 4, vRif: 5 }, specie, sorgenti,
    finestra: { centro: [LATO / 2, LATO / 2], lato: 400 }, sezione: { fine: 140, durata: 140 },
    scala: { latoM, secondi: 140 * u.tu },
  };
  const Breg = P.B0 / R.r ** 3;
  const descrizione = [`il campo del pianeta, ${(Breg * 1e9).toLocaleString('it-IT', { maximumFractionDigits: 0 })} nT`, `${sorgenti.length} raggi cosmici arrivati fin qui (${vietate} strade all'indietro finivano contro il pianeta: da lì non arriva niente)`, tau > 0.05 ? `la polvere dell'anello (spessore ottico ${tau.toFixed(2)})` : 'niente materia'].join(', ');
  return { nome: `universo n. ${numero}`, nota: `${descriviIndirizzo(a)}, a ${R.r.toFixed(2)} raggi dal centro; la regione è larga ${fmtLunghezza(latoM)}, l'esposizione dura ${(140 * u.tu * 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} ms. ${descrizione}. Nessuno l'ha costruito: ogni cosa ha una causa più in là.`, cella };
}
