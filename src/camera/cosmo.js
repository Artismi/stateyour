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

import { generatore } from './mondo.js';

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

// ---------- un sistema: la stella e i suoi pianeti
// coordinate del sistema: l'orbita più esterna è circa 1
export const RAGGIO_SISTEMA = 0.0025; // in unità della galassia
export const sistema = memo((n, gid, sid) => {
  const S = galassia(n, gid).stelle[sid], { c, tra, intero } = casoDi('sistema', n, gid, sid);
  const np = intero(1, PIANETI_MAX), pianeti = [];
  let a = tra(0.1, 0.18);
  for (let k = 0; k < np; k++) {
    const freddo = a > 0.4, tipo = freddo ? (c() < 0.6 ? 'gassoso' : 'ghiacciato') : (c() < 0.8 ? 'roccioso' : 'gassoso');
    const r = tipo === 'gassoso' ? tra(0.022, 0.04) : tra(0.008, 0.018);
    pianeti.push({
      id: k, a, fase: tra(0, 2 * Math.PI), r, tipo,
      campo: tipo === 'gassoso' ? tra(0.5, 1) : tipo === 'ghiacciato' ? tra(0.2, 0.6) : tra(0.05, 0.4),
      anelli: (tipo !== 'roccioso' && c() < 0.6) || c() < 0.08, lune: intero(0, tipo === 'gassoso' ? 6 : 2),
      colore: { roccioso: [176, 140, 110], gassoso: [214, 178, 128], ghiacciato: [156, 196, 222] }[tipo].map((v) => Math.round(v * tra(0.8, 1.15))),
    });
    pianeti[k].pos = [a * Math.cos(pianeti[k].fase), a * Math.sin(pianeti[k].fase)];
    a *= tra(1.35, 1.8); if (a > 1.1) break;
  }
  return { stella: { ...S, r: 0.012 + 0.006 * Math.cbrt(S.massa) }, pianeti };
});

// ---------- un pianeta e le sue regioni
// coordinate del pianeta: il raggio del pianeta è 1; le regioni stanno nell'anello o nella magnetosfera
export const LATO_REGIONE = 0.32; // in raggi del pianeta
export const pianeta = memo((n, gid, sid, pid) => {
  const P = sistema(n, gid, sid).pianeti[pid], { tra } = casoDi('pianeta', n, gid, sid, pid);
  const anello = P.anelli ? [tra(1.45, 1.7), tra(2.05, 2.6)] : null;
  const regioni = [];
  for (let k = 0; k < REGIONI; k++) {
    const ang = (2 * Math.PI * k) / REGIONI + tra(-0.08, 0.08), rr = anello ? (anello[0] + anello[1]) / 2 + tra(-0.08, 0.08) : tra(1.6, 2.6);
    regioni.push({ id: k, pos: [rr * Math.cos(ang), rr * Math.sin(ang)], angolo: ang, nellAnello: !!anello });
  }
  return { P, anello, regioni };
});

// ---------- una regione: lo spazio attorno a un pianeta, dove si guarda (un universo della camera)
const LATO = 1000, C = 40;
export const CATALOGO = {
  protone: { q: 1, m: 8, vitaMedia: 18, figli: [
    { specie: 'nucleone', angolo: [-12, 12], quota: [0.3, 0.6] },
    { specie: 'pione+', angolo: [-35, 35], quota: [0.1, 0.35] },
    { specie: 'pione-', angolo: [-35, 35], quota: [0.1, 0.3] },
    { specie: 'pione0', angolo: [-20, 20], quota: [0.05, 0.2] },
  ] },
  nucleone: { q: 1, m: 8 },
  'pione+': { q: 1, m: 1.4, vitaMedia: 14, figli: [{ specie: 'muone+', angolo: [-10, 10], quota: [0.6, 0.9] }] },
  'pione-': { q: -1, m: 1.4, vitaMedia: 14, figli: [{ specie: 'muone-', angolo: [-10, 10], quota: [0.6, 0.9] }] },
  pione0: { q: 0, m: 1.3, vitaMedia: 0.05, visibile: false, figli: [{ specie: 'fotone', angolo: [8, 50], quota: 0.5 }, { specie: 'fotone', angolo: [-50, -8], quota: 0.5 }] },
  'muone+': { q: 1, m: 1, vitaMedia: 45, figli: [{ specie: 'positrone', angolo: [-70, 70], quota: [0.1, 0.5] }] },
  'muone-': { q: -1, m: 1, vitaMedia: 45, figli: [{ specie: 'elettrone', angolo: [-70, 70], quota: [0.1, 0.5] }] },
  fotone: { luce: true, m: 0.3, vitaMedia: 5, figli: [{ specie: 'elettrone', angolo: [4, 30], quota: [0.3, 0.7] }, { specie: 'positrone', angolo: [-30, -4], quota: [0.3, 0.7] }] },
  elettrone: { q: -1, m: 0.12 },
  positrone: { q: 1, m: 0.12 },
  kaone0: { q: 0, m: 3.5, vitaMedia: 4, visibile: false, figli: [{ specie: 'pione+', angolo: [5, 45], quota: [0.3, 0.6] }, { specie: 'pione-', angolo: [-45, -5], quota: [0.3, 0.6] }] },
};
export const descriviIndirizzo = (a) => {
  const G = cosmo(a.cosmo).galassie[a.galassia], P = sistema(a.cosmo, a.galassia, a.stella).pianeti[a.pianeta];
  return `${a.cosmo > 1 ? `cosmo ${a.cosmo} · ` : ''}galassia ${a.galassia + 1} (${G.tipo}) · stella ${a.stella + 1} · pianeta ${a.pianeta + 1} (${P.tipo}${P.anelli ? ', con anelli' : ''}) · regione ${a.regione + 1}`;
};

export function regione(a) {
  const numero = numeroDi(a), Gx = galassia(a.cosmo, a.galassia), S = sistema(a.cosmo, a.galassia, a.stella), P = S.pianeti[a.pianeta], Pl = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta), R = Pl.regioni[a.regione];
  const { c: caso, tra, intero } = casoDi('regione', a.cosmo, a.galassia, a.stella, a.pianeta, a.regione);
  const onda = (lmin, lmax, amp) => { const l = tra(lmin, lmax), th = tra(0, 2 * Math.PI); return { k: [(2 * Math.PI * Math.cos(th)) / l, (2 * Math.PI * Math.sin(th)) / l], a: amp, fi: tra(0, 2 * Math.PI) }; };
  // il campo magnetico del pianeta, visto da vicino: alcune onde lunghe (più forte vicino ai giganti)
  const forzaB = 0.02 + 0.33 * P.campo * tra(0.4, 1), nB = intero(3, 7), ondeB = [];
  for (let i = 0; i < nB; i++) ondeB.push(onda(150, 900, (forzaB / Math.sqrt(nB)) * tra(0.5, 1.5) * (caso() < 0.5 ? -1 : 1)));
  // la polvere: nell'anello è densa, fuori è rada
  const nubi = R.nellAnello ? (caso() < 0.95 ? { K: tra(8, 40), modi: Array.from({ length: intero(3, 6) }, () => onda(120, 600, tra(0.4, 1))) } : null)
    : (caso() < 0.5 ? { K: tra(2, 15), modi: Array.from({ length: intero(3, 6) }, () => onda(120, 600, tra(0.4, 1))) } : null);
  // i granelli cristallini (ghiaccio e silicati), più spessi negli anelli dei pianeti freddi
  const cristalli = [];
  for (let i = intero(0, R.nellAnello ? (P.tipo === 'roccioso' ? 1 : 3) : 1); i > 0; i--) cristalli.push({ centro: [tra(100, LATO - 100), tra(100, LATO - 100)], r: tra(50, 180), passo: tra(6, 24), angolo: tra(0, Math.PI), a: tra(0.3, 1.4) * (caso() < 0.5 ? -1 : 1) });
  // i sassi e le piccole lune dell'anello
  const masse = [];
  for (let i = intero(0, R.nellAnello ? 4 : 2); i > 0; i--) { const M = 40 * Math.pow(caso(), -1.4); masse.push({ pos: [tra(50, LATO - 50), tra(50, LATO - 50)], M: Math.min(4000, M), R: 2 + Math.cbrt(Math.min(4000, M)) * 0.5 }); }
  // i raggi cosmici: ognuno parte da una sorgente vera della galassia. Il campo della
  // galassia li sparpaglia, ma arrivano in media dalla direzione della loro sorgente.
  // La loro emissione (quando, e con che direzione esatta) è un evento quantistico: si può
  // cambiare passando a un altro ramo.
  const stella = Gx.stelle[a.stella].pos, pesi = Gx.sorgenti.map((s) => s.potenza / (0.02 + Math.hypot(s.pos[0] - stella[0], s.pos[1] - stella[1]) ** 2)), totP = pesi.reduce((x, y) => x + y, 0);
  const sorgenti = [];
  const nRaggi = Math.max(3, Math.min(9, Math.round(3 + Math.log1p(totP / 30) * 2 + tra(-1, 2))));
  for (let i = 0; i < nRaggi; i++) {
    let r = caso() * totP, k = 0; while (k < pesi.length - 1 && (r -= pesi[k]) > 0) k++;
    const src = Gx.sorgenti[k], verso = Math.atan2(stella[1] - src.pos[1], stella[0] - src.pos[0]), largo = Math.min(1.2, 0.35 + 3 * Math.hypot(stella[0] - src.pos[0], stella[1] - src.pos[1]));
    sorgenti.push({ pos: [LATO / 2, LATO / 2], dir: verso, v: tra(16, 30), t0: 0, specie: 'protone', emissione: { dir: [verso - largo, verso + largo], t0: [0, 40], dal: 'bordo', u: [0.1, 0.9] }, origine: `${src.nome} (galassia ${a.galassia + 1})` });
  }
  // il vento della stella: particelle più lente, dalla direzione della stella
  const dalSole = Math.atan2(P.pos[1], P.pos[0]);
  for (let i = intero(0, 2); i > 0; i--) sorgenti.push({ pos: [LATO / 2, LATO / 2], dir: dalSole, v: tra(10, 16), t0: 0, specie: 'protone', emissione: { dir: [dalSole - 0.4, dalSole + 0.4], t0: [0, 60], dal: 'bordo', u: [0.05, 0.95] }, origine: `il vento della stella ${a.stella + 1}` });
  // le stelle nucleari: un raggio colpisce il nucleo di un granello, che si spezza in una raggiera
  const specieStelle = {};
  for (let i = intero(0, R.nellAnello ? 3 : 2); i > 0; i--) {
    const nn = intero(5, 14), base = tra(0, 360), figli = [], scelta = ['pione+', 'pione-', 'elettrone', 'positrone', 'protone'];
    for (let j = 0; j < nn; j++) { const an = base + (360 * j) / nn; figli.push({ specie: scelta[Math.floor(caso() * (caso() < 0.5 ? 4 : 5))], angolo: [an - 360 / nn / 4, an + 360 / nn / 4], quota: [0.04, 0.16] }); }
    const nome = `stella ${i}`;
    specieStelle[nome] = { q: 0, m: 20, vita: 0.001, visibile: false, figli };
    sorgenti.push({ pos: [tra(150, LATO - 150), tra(150, LATO - 150)], dir: tra(0, 2 * Math.PI), v: 6, t0: tra(5, 50), specie: nome, origine: 'un raggio cosmico che colpisce il nucleo di un granello di polvere' });
  }
  // i decadimenti spontanei: particelle neutre nate dagli urti dei raggi con la polvere
  for (let i = intero(2, 8); i > 0; i--) sorgenti.push({ pos: [tra(80, LATO - 80), tra(80, LATO - 80)], dir: tra(0, 2 * Math.PI), v: tra(2, 10), t0: tra(0, 60), specie: 'kaone0', origine: 'un urto di un raggio cosmico con la polvere' });
  const cella = {
    larghezza: LATO, altezza: LATO, c: C, G: 1, bordo: 'aperto', tempo: 140, seme: numero, indirizzo: { ...a },
    fondo: { B: 0, K: 0 }, domini: [], masse, onde: { B: ondeB }, nubi, cristalli,
    pellicola: { w0: 0.8, saturazione: 4, vRif: 5 }, specie: { ...CATALOGO, ...specieStelle }, sorgenti,
    finestra: { centro: [LATO / 2, LATO / 2], lato: 400 }, sezione: { fine: 140, durata: 140 },
  };
  const nRC = sorgenti.filter((s) => s.specie === 'protone').length;
  const descrizione = [`${masse.length} ${masse.length === 1 ? 'sasso' : 'sassi'} ${R.nellAnello ? "dell'anello" : ''}`.trim(), `il campo del pianeta (${nB} onde)`, nubi ? (R.nellAnello ? "la polvere dell'anello" : 'polvere rada') : 'niente polvere', cristalli.length ? `${cristalli.length} ${cristalli.length === 1 ? 'granello cristallino' : 'granelli cristallini'}` : null, `${nRC} raggi cosmici`, Object.keys(specieStelle).length ? `${Object.keys(specieStelle).length} nuclei spezzati` : null].filter(Boolean).join(', ');
  return { nome: `universo n. ${numero}`, nota: `${descriviIndirizzo(a)}: ${descrizione}. Nessuno l'ha costruito: ogni cosa ha una causa più in là, che si raggiunge allontanandosi.`, cella };
}
