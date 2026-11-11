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
import { unita, catalogoVero, velocita, fmtLunghezza, ME_MEV } from './unita.js';
import { COSTANTI, etaUniverso, massaNascita, ANNO, LSOLE, UA, clima, acquaInSuperficie } from './leggi.js';
import { stella as stellaVera, fine } from './stelle.js'; // le stelle calcolate dalla loro struttura (non più le curve misurate sul Sole)
import { interno } from './geologia.js';
import { formaPianeti, disco as discoDi } from './disco.js';
import { storiaImpatti, giganteDi } from './impatti.js';
import { sorgente } from './eventi.js';
import { anelli } from './anelli.js';
import { lune, tempoBlocco } from './lune.js';
import { atmosfera, prebiotica, minerali } from './chimica.js';
const ADESSO = etaUniverso(); // in secondi: tutto il cosmo è guardato in questo istante

export const REGIONI = 12, PIANETI_MAX = 16, STELLE = 2500, GALASSIE_MAX = 200;

// il caso di un indirizzo
export function hash(...parti) {
  let h = 0x811c9dc5;
  const s = parti.join('/');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
}
// ---------- UNIVERSI PARALLELI A OGNI SCALA. Ogni corso di eventi ha un indirizzo: «disco/3/53» è la formazione
// dei pianeti della stella 53 nella galassia 3, «mantello/3/53/0» la storia interna del suo primo pianeta. Un cosmo
// parallelo è lo stesso cosmo con alcuni di questi eventi andati diversamente: lo si scrive «n#{"evento":ramo}».
// Tutto ciò che non discende da quegli eventi resta identico (stesse galassie, stesse stelle, stessi altri pianeti).
const scomposti = new Map();
function scomponi(n) {
  if (typeof n !== 'string') return [n, null];
  let r = scomposti.get(n);
  if (!r) { const i = n.indexOf('#'); r = i < 0 ? [Number(n), null] : [Number(n.slice(0, i)), JSON.parse(n.slice(i + 1))]; scomposti.set(n, r); }
  return r;
}
export const cosmoBase = (n) => scomponi(n)[0];
export const ramiCosmo = (n) => scomponi(n)[1] || {};
// lo stesso cosmo con l'evento andato nel modo «ramo» (0: come nel cosmo di partenza)
export function cosmoRamo(n, evento, ramo) {
  const [b, r0] = scomponi(n), r = { ...(r0 || {}) };
  if (ramo) r[evento] = ramo; else delete r[evento];
  const chiavi = Object.keys(r).sort();
  return chiavi.length ? `${b}#${JSON.stringify(Object.fromEntries(chiavi.map((k) => [k, r[k]])))}` : b;
}
export const cosmoCon = (n, rami) => Object.entries(rami || {}).reduce((c, [e, r]) => cosmoRamo(c, e, r), cosmoBase(n));
// il numero da cui parte un corso di eventi: nel cosmo di partenza è quello di sempre
export function semeEvento(nome, n, ...resto) {
  const [b, rami] = scomponi(n), r = rami ? rami[[nome, ...resto].join('/')] : 0;
  return r ? hash(nome, b, ...resto, 'ramo', r) : hash(nome, b, ...resto);
}
const casoDi = (nome, n, ...resto) => { const c = generatore(semeEvento(nome, n, ...resto)); const tra = (a, b) => a + c() * (b - a); return { c, tra, intero: (a, b) => Math.floor(tra(a, b + 1)), gauss: () => { let u = 0; for (let i = 0; i < 6; i++) u += c(); return (u - 3) / Math.SQRT1_2 / 1.0; } }; };
const memo = (f) => { const m = new Map(); return (...a) => { const k = a.join('|'); if (!m.has(k)) { if (m.size > 64) m.delete(m.keys().next().value); m.set(k, f(...a)); } return m.get(k); }; };

// ---------- il numero della biblioteca ↔ l'indirizzo
export function indirizzoDi(numero, rami = null) {
  let n = Math.max(1, Math.floor(numero)) - 1;
  const regione = n % REGIONI; n = Math.floor(n / REGIONI);
  const slot = n % PIANETI_MAX; n = Math.floor(n / PIANETI_MAX);
  const stella = n % STELLE; n = Math.floor(n / STELLE);
  const gslot = n % GALASSIE_MAX; n = Math.floor(n / GALASSIE_MAX);
  const cosmoN = cosmoCon(n + 1, rami);
  const C = cosmo(cosmoN), galassia = gslot % C.galassie.length;
  let st = stella, S = sistema(cosmoN, galassia, st);
  while (!S.pianeti.length) { st = (st + 1) % STELLE; S = sistema(cosmoN, galassia, st); }
  return { cosmo: cosmoN, galassia, stella: st, pianeta: slot % S.pianeti.length, regione };
}
export function numeroDi(a) {
  return 1 + a.regione + REGIONI * (a.pianeta + PIANETI_MAX * (a.stella + STELLE * (a.galassia + GALASSIE_MAX * (cosmoBase(a.cosmo) - 1))));
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
    G.formazione = (0.4 + 2.5 / (1 + G.peso) + r.tra(0, 0.8)) * 1e9 * ANNO; // le più dense si formano prima
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
    // (ogni stella, viva o morta, porta la sua «eta»: gli anni dalla nascita a oggi. È l'unica età del sistema: quella
    // dei pianeti, del loro interno e delle lune.) La stella nasce in un momento della storia della galassia, con una massa dalla distribuzione
    // misurata, e un campo magnetico suo; poi vive secondo le sue equazioni fino a «adesso»
    const m0 = massaNascita(c()), B0 = Math.pow(10, -5 + 3 * c()), nascita = G.tipo === 'ellittica' ? G.formazione + c() * 1.5e9 * ANNO : G.formazione + c() * (ADESSO - G.formazione), eta = ADESSO - nascita;
    // la METALLICITÀ (in unità del Sole): il gas da cui nasce è stato arricchito dalle supernove delle
    // generazioni prima; cresce con il tempo passato dalla nascita della galassia, ed è più alta al centro
    // (dove le stelle si sono formate prima e più fitte)
    const Z = 2.2 * (1 - Math.exp(-(nascita - G.formazione) / (2e9 * ANNO))) * Math.exp(-Math.hypot(x, y) / 0.7) * (G.tipo === 'ellittica' ? 1.6 : 1) + 0.01;
    // quanto vive e com'è adesso: dalla sua massa, dai suoi metalli e dalla sua età (stelle.js)
    const vita = stellaVera(m0, { Z });
    if (eta < vita.vita * ANNO) {
      const ora = stellaVera(m0, { Z, eta: eta / ANNO }), gigante = eta > 0.9 * vita.vita * ANNO, T = gigante ? Math.min(ora.T, 4200) : ora.T;
      stelle.push({ id: s, pos: [x, y], massa: m0, T, colore: colorePerTemperatura(T), stato: gigante ? 'gigante rossa' : 'in vita', eta: eta / ANNO, B: B0, Z });
    } else {
      const f = fine(m0, B0, { Z }), morta = (eta - vita.vita * ANNO) / ANNO;
      stelle.push({ id: s, pos: [x, y], massa: f.massa, massaNascita: m0, eta: eta / ANNO, T: f.tipo === 'nana bianca' ? 8000 + 30000 * Math.exp(-morta / 1e9) : 0, colore: f.tipo === 'nana bianca' ? [225, 230, 255] : f.tipo === 'buco nero' ? [20, 20, 30] : [150, 200, 255], stato: f.tipo, raggioM: f.raggio, B: f.B, morta, Z });
    }
  }
  // le sorgenti dei raggi cosmici EMERGONO dalla storia: le supernove nascono dalle stelle massicce
  // che muoiono (quante ne muoiono all'anno discende da quante stelle nascono e da quanto vivono le
  // grandi), le pulsar sono le stelle di neutroni giovani che quelle lasciano; il getto è del buco nero.
  const massaStelle = 2e10 * Math.min(4, G.peso + 0.5), frazioneMassicce = 0.0062, durata = ADESSO - G.formazione;
  const ritmoSN = (G.tipo === 'ellittica' ? 0.05 : 1) * ((massaStelle / 0.57) * frazioneMassicce * ANNO) / durata; // supernove all'anno (nelle ellittiche solo nane bianche che esplodono)
  const giovani = stelle.filter((x) => x.stato === 'in vita' || x.stato === 'gigante rossa').filter((x) => Math.hypot(...x.pos) > 0.15);
  const sorgenti = [{ tipo: 'getto', nome: 'il getto del buco nero', pos: [0, 0], potenza: 2 + 10 * G.attivita, angolo: G.getto }];
  let t = 0;
  for (let k = 0; k < 8; k++) {
    t += -Math.log(1 - c()) / Math.max(1e-9, ritmoSN); // le più giovani: gli intervalli tra le morti
    if (t > 1e5) break;
    // nelle ellittiche (e una volta su sette nelle spirali) esplode una nana bianca che ha preso troppa
    // materia da una compagna: non resta niente; altrimenti è il nucleo di una stella grande che collassa
    const ia = G.tipo === 'ellittica' || c() < 0.15;
    const dove = (ia ? stelle.filter((x) => x.stato === 'nana bianca') : giovani.length ? giovani : stelle).concat(stelle)[0 + Math.floor(c() * (ia ? stelle.filter((x) => x.stato === 'nana bianca').length || stelle.length : giovani.length || stelle.length))];
    const prog = 8 + 30 * Math.pow(c(), 2), f = ia ? { tipo: 'niente (è esplosa una nana bianca)' } : fine(prog, Math.pow(10, -5 + 3 * c()));
    sorgenti.push({ tipo: 'supernova', nome: `il resto della supernova ${k + 1}`, pos: dove.pos.slice(), r: Math.min(0.045, 0.008 + 0.00005 * Math.pow(t, 0.4)), potenza: 2.5 * Math.exp(-t / 3e4), eta: t, resto: f.tipo });
    if (f.tipo === 'stella di neutroni') sorgenti.push({ tipo: 'pulsar', nome: `la ${f.B > 1e10 ? 'magnetar' : 'pulsar'} nel resto ${k + 1}`, pos: [dove.pos[0] + tra(-0.004, 0.004), dove.pos[1] + tra(-0.004, 0.004)], potenza: 0.4 + Math.min(1.5, Math.log10(f.B / 1e7) * 0.3), B: f.B, eta: t });
  }
  // il buco nero centrale: circa due millesimi della massa del nucleo della galassia (relazione misurata)
  const buco = { M: 0.002 * massaStelle * 0.2, attivita: G.attivita };
  return { G, stelle, sorgenti, buco, ritmoSN };
});

// ---------- le grandezze vere di ogni livello (per il metro sullo schermo). Tra un livello e
// l'altro lo zoom fa un salto: dentro ogni livello i rapporti sono quelli veri.
export const TORO_M = 3.7e25; // il lato del cosmo richiuso (circa 1,2 miliardi di parsec)
export const metriPerUnita = (livello, via) => {
  if (livello === 0) return TORO_M;
  if (livello === 1) { const G = cosmo(via.cosmo).galassie[via.galassia]; return (G.tipo === 'ellittica' ? 6e20 : 4.5e20) * (0.7 + 0.15 * Math.min(4, G.peso)); }
  if (livello === 2) return 30 * 1.496e11;
  const R = sistema(via.cosmo, via.galassia, via.stella).pianeti[via.pianeta].raggioM;
  return livello === 4 ? 2 * Math.PI * R : R; // sulla superficie l'unità è il giro dell'equatore
};

// ---------- un sistema: la stella e i suoi pianeti
// coordinate del sistema: l'orbita più esterna è circa 1 (trenta unità astronomiche)
export const RAGGIO_SISTEMA = 0.0025; // in unità della galassia (sulla mappa)
export const sistema = memo((n, gid, sid) => {
  const S = galassia(n, gid).stelle[sid], { c, tra, intero } = casoDi('sistema', n, gid, sid);
  // I PIANETI NASCONO DAL DISCO della stella giovane (disco.js): la sua massa e i suoi metalli fanno il
  // disco; oltre la linea della neve anche il ghiaccio è solido; gli embrioni crescono, si scontrano e si
  // fondono; un nucleo abbastanza grande, se fa in tempo prima che il gas si disperda, lo cattura a valanga
  // e diventa un gigante. Numero, posizione, massa, tipo e composizione vengono da lì. Le stelle di neutroni
  // e i buchi neri non hanno pianeti: la supernova li ha dispersi.
  const morta = S.stato === 'stella di neutroni' || S.stato === 'buco nero';
  const nascita = { massa: S.massaNascita || S.massa, Z: S.Z ?? 1, eta: S.eta }, semeDisco = semeEvento('disco', n, gid, sid);
  const nati = morta ? [] : formaPianeti(nascita, semeDisco).slice(0, PIANETI_MAX);
  const pianeti = nati.map((q, k) => {
    const a = q.aUA / 30, fase = tra(0, 2 * Math.PI);
    return {
      id: k, a, fase, pos: [a * Math.cos(fase), a * Math.sin(fase)], tipo: q.tipo, raggioM: q.raggioM, massaKg: q.massaKg, composizione: q.composizione, eccentricita: q.eccentricita, storia: q.storia, formazione: q.formazione, involucro: q.involucro || 0,
      r: q.raggioM / (30 * UA), B0: 0, campo: 0, // il raggio VERO nelle unità del sistema (30 UA): sulla mappa un pianeta è grande quanto è

      colore: { roccioso: [176, 140, 110], gassoso: [214, 178, 128], ghiacciato: [156, 196, 222] }[q.tipo].map((v) => Math.round(v * tra(0.8, 1.15))),
    };
  });
  // una gigante rossa inghiotte i pianeti vicini; la nana bianca che ne resta, avendo perso massa, ha anche lasciato
  // allontanare gli altri (l'orbita si allarga come la massa iniziale su quella finale)
  if (S.stato === 'nana bianca' || S.stato === 'gigante rossa') { const k = S.stato === 'nana bianca' ? (S.massaNascita || 1) / S.massa : 1; for (let i = pianeti.length - 1; i >= 0; i--) { if (pianeti[i].a < 0.05) { pianeti.splice(i, 1); continue; } pianeti[i].a *= k; pianeti[i].pos = pianeti[i].pos.map((v) => v * k); } pianeti.forEach((p, i) => { p.id = i; }); }
  // il clima di ogni pianeta, dalla luce della sua stella (una nana bianca è piccola: la sua luce è quella di una
  // sfera con il suo raggio e la sua temperatura, 4πR²σT⁴: da un decimo del Sole appena nata a meno di un millesimo)
  const viva = S.stato === 'in vita' || S.stato === 'gigante rossa', Lw = viva ? stellaVera(S.massa, { Z: S.Z ?? 1, eta: S.eta }).L * LSOLE : S.stato === 'nana bianca' ? 4 * Math.PI * S.raggioM ** 2 * COSTANTI.sigma * S.T ** 4 : 0;
  // il sistema com'è restituito: serve già qui, perché la storia degli impatti di un pianeta (impatti.js) guarda la
  // stella, il disco e gli altri pianeti
  const Sis = { stella: { ...S, r: (viva ? stellaVera(S.massa, { Z: S.Z ?? 1, eta: S.eta }).R * 6.957e8 : S.raggioM || 1e4) / (30 * UA) } /* il raggio vero, nelle unità del sistema */, pianeti, disco: morta ? null : discoDi(nascita, semeDisco) };
  for (const p of pianeti) {
    const massaKg = p.massaKg; // dal disco
    // l'interno: nucleo, dinamo, tettonica; il campo magnetico ora EMERGE dall'interno
    // la ROTAZIONE viene dalla formazione (gli urti che l'hanno messo a girare: un giorno di qualche ora,
    // l'asse inclinato a caso, di solito poco); le maree della stella la frenano finché il pianeta le mostra
    // sempre la stessa faccia: succede se è vicino (il tempo cresce come la distanza alla sesta) e la stella
    // è pesante; allora il giorno dura quanto l'anno (Keplero)
    // (la massa della stella è quella di oggi: una nana bianca pesa meno di quando è nata, e l'anno si è allungato)
    const Mst = S.massa * 1.989e30, aM = p.a * 30 * UA, anno = 2 * Math.PI * Math.sqrt(aM ** 3 / (6.674e-11 * Mst));
    // IL BLOCCO MAREALE ha una legge sola, quella di lune.js (la stessa delle lune attorno ai pianeti): il tempo in cui
    // la marea della stella frena la rotazione, dalla massa, dal raggio e dalla rigidità del pianeta; è bloccato se
    // quel tempo è più corto della sua età. (Un gigante di gas non è un corpo rigido: non si blocca.)
    const eta = S.eta, bloccato = p.tipo !== 'gassoso' && tempoBlocco({ massaKg: Mst }, { massaKg, raggioM: p.raggioM, aM, composizione: p.composizione }) < eta * ANNO;
    const giorno = bloccato ? anno : (p.tipo === 'gassoso' ? tra(9, 16) : tra(10, 40)) * 3600;
    const omega = (2 * Math.PI) / giorno;
    Object.assign(p, { aM, Lw, Mstella: Mst, anno, giorno, bloccato, obliquita: bloccato ? 0 : Math.min(85, Math.abs((c() + c() + c() - 1.5) * 30) + (c() < 0.08 ? tra(30, 90) : 0)) });
    // L'URTO GIGANTE (impatti.js): l'ultimo della formazione del pianeta, con i numeri veri di disco.js. È lui che ha dato
    // al pianeta il giorno e l'inclinazione dell'asse (i due sorteggi qui sopra restano per chi non ne ha avuti e per i
    // giganti). I suoi eventi incerti stanno all'indirizzo del pianeta, e i loro rami nella stessa mappa dei rami del cosmo
    const casoP = sorgente(`cosmo ${cosmoBase(n)}/galassia ${gid}/stella ${sid}/pianeta ${p.id}`, ramiCosmo(n));
    p.urto = p.tipo === 'gassoso' ? null : giganteDi(p, Sis, casoP);
    // (un mondo con un involucro di gas non gira come l'ha lasciato l'urto dei nuclei: il gas che cade dopo porta la sua
    // rotazione, come nei giganti; per quelli resta il sorteggio, finché la cattura del gas non darà anche il giro)
    const giroDaUrto = p.urto && !bloccato && p.involucro < 0.01;
    if (giroDaUrto) { p.giorno = p.urto.giornoDopo; p.retrogrado = p.urto.obliquita > 90; p.obliquita = p.retrogrado ? 180 - p.urto.obliquita : p.urto.obliquita; }
    // la FORMA: un corpo grande si arrotonda da solo (la gravità vince la roccia); ruotando si schiaccia ai poli
    // (schiacciamento ≈ 5/4 · ω²R³/(GM), per un corpo fluido omogeneo)
    p.schiacciamento = Math.min(0.3, 1.25 * (omega ** 2 * p.raggioM ** 3) / (6.674e-11 * massaKg));
    p.massaKg = massaKg; p.interno = interno(p, S); p.B0 = p.interno.B0; p.campo = Math.min(1, Math.max(0, Math.log10(p.B0 / 1e-8) / Math.log10(4.5e-4 / 1e-8)));
    // l'acqua alla superficie: la stessa per il mare, per il clima e per l'interno (leggi.js)
    const acqua = acquaInSuperficie(p);
    p.interno.acquaKg = acqua.kg;
    p.clima = clima({ Lw, aM: p.a * 30 * UA, massaKg, raggioM: p.raggioM, tipo: p.tipo, acqua: acqua.frazione });
    // L'ARIA e i MATTONI DELLA VITA (chimica.js): quali gas ha davvero (ciò che trattiene, all'equilibrio
    // chimico), e quanto rendono lì le reazioni che fanno aminoacidi e zuccheri (scariche e ultravioletto)
    try {
      p.atmosfera = atmosfera(p, { Z: S.Z ?? 1 });
      p.prebiotica = prebiotica({ atmosfera: p.atmosfera, T: p.clima.T, energia: Lw / (4 * Math.PI * (p.a * 30 * UA) ** 2) / 1361, pressione: p.clima.pressione, acqua: p.clima.acqua === 'liquida',
        minerali: minerali({ composizione: p.composizione, T: p.clima.T, ossidato: !p.atmosfera.riducente, acqua: p.clima.acqua === 'liquida' }) });
    } catch { p.atmosfera = null; p.prebiotica = null; }
    // LE LUNE (lune.js): dal disco attorno al pianeta, da un grande urto, o catturate; con le loro maree
    p.lune = lune(p, { eta, Z: S.Z ?? 1, massa: S.massa, massaNascita: S.massaNascita, ...(p.tipo === 'roccioso' ? { urto: p.urto } : {}) }, semeEvento('lune', n, gid, sid, p.id));
    // la luna nata dall'urto, allontanandosi, ha frenato il pianeta: il giorno di oggi è quello che resta (e con lui lo schiacciamento ai poli)
    if (giroDaUrto) { const luna = p.lune.find((l) => l.origine === 'urto'); if (luna?.giornoPianeta) p.giorno = luna.giornoPianeta; p.schiacciamento = Math.min(0.3, (1.25 * ((2 * Math.PI) / p.giorno) ** 2 * p.raggioM ** 3) / (6.674e-11 * massaKg)); }
    // GLI ANELLI (anelli.js): ciò che resta oggi della materia finita dentro il limite di Roche (una luna spezzata dalle
    // maree, i detriti di un urto); si allargano, piovono sul pianeta e spariscono: c'è un anello solo se la materia è
    // arrivata abbastanza di recente o era abbastanza tanta. Le divisioni vengono dalle risonanze con le lune vere
    p.anello = anelli(p, p.lune, { massa: S.massa, massaNascita: S.massaNascita, eta: eta - (S.morta ?? 0), morta: S.morta, Z: S.Z ?? 1 }, sorgente(`anelli/${cosmoBase(n)}/${gid}/${sid}/${p.id}`, ramiCosmo(n)));
    p.anelli = !!p.anello;
    // LA STORIA DEGLI IMPATTI (impatti.js), calcolata solo quando qualcuno la guarda: p.impatti
    Object.defineProperty(p, 'impatti', { configurable: true, enumerable: false, get() { const v = storiaImpatti(p, Sis, casoP); Object.defineProperty(p, 'impatti', { value: v, enumerable: false }); return v; } });
    // lo stato da cui parte il mantello: le irregolarità lasciate dalla formazione di QUESTO pianeta, in questa stella
    // di questa galassia di questo cosmo (per ora un numero legato all'indirizzo e alla massa, non ancora ai suoi urti veri)
    p.origine = hash(semeEvento('mantello', n, gid, sid, p.id), Math.round(Math.log(p.massaKg) * 1e6));
  }
  return Sis;
});

// ---------- un pianeta: l'anello, la magnetosfera, le regioni
// coordinate del pianeta: il raggio del pianeta è 1
export const LATO_REGIONE = 0.32; // in raggi del pianeta
export const pianeta = memo((n, gid, sid, pid) => {
  const P = sistema(n, gid, sid).pianeti[pid], { tra } = casoDi('pianeta', n, gid, sid, pid);
  // l'anello: fasce più e meno dense (come quelle vere); una funzione sola per il disegno e per la fisica
  const A = P.anello, anello = A ? [A.interno, A.esterno] : null;
  const densitaAnello = A ? A.densita : () => 0;
  const regioni = [];
  for (let k = 0; k < REGIONI; k++) {
    const nelAnello = anello && k < 6;
    const ang = (2 * Math.PI * k) / REGIONI + tra(-0.15, 0.15), rr = nelAnello ? tra(A.denso[0], A.denso[1]) : tra(1.45, 4);
    regioni.push({ id: k, pos: [rr * Math.cos(ang), rr * Math.sin(ang)], angolo: ang, r: rr, nellAnello: !!nelAnello && densitaAnello(rr) > 0.05 });
  }
  return { P, anello, densitaAnello, regioni, anelloVero: A };
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

// ---------- le FASCE DI RADIAZIONE. I raggi cosmici che colpiscono il pianeta (e il suo anello)
// ne fanno uscire neutroni; un neutrone non sente il campo, vola via, e ogni tanto decade in
// un protone e un elettrone proprio dentro la magnetosfera: lì il campo li intrappola. In
// anni si accumula una fascia. Quanto è piena a una distanza r: i neutroni si diradano
// allontanandosi (1/r), le particelle restano intrappolate solo se il campo le tiene (il loro
// giro è piccolo rispetto alla distanza), e l'anello le assorbe dove è denso.
// p in MeV/c, B in tesla → raggio del giro in metri
const raggioGiro = (pMeV, B) => (pMeV * 3.336e-3) / Math.max(B, 1e-15);
export const fascia = (P, Pl, r) => {
  if (r < 1.15) return 0;
  const B = P.B0 / r ** 3, tiene = raggioGiro(450, B) < 0.1 * r * P.raggioM ? 1 : 0; // un protone da 100 MeV
  return (tiene * Math.max(0, 1 - 1.12 / r) * Math.exp(-25 * Pl.densitaAnello(r))) / r;
};
const FASCIA_MAX = 0.17;
// le particelle di una fascia in un quadrato (coordinate del motore), con le energie dei neutroni che decadono
function particelleFascia(P, Pl, r, u, lato, quante, caso, prefisso, { fini = false } = {}) {
  const out = [], B = P.B0 / r ** 3, f = fascia(P, Pl, r) / FASCIA_MAX;
  const n = Math.round(quante * Math.min(1, f));
  for (let i = 0; i < n; i++) {
    // alla scala della regione i protoni (il loro giro si vede); gli elettroni nascono al livello in cui il loro giro si vede
    const protone = !fini;
    // i più fini (visibili solo da vicino): elettroni il cui giro è grande quanto un decimo della finestra
    let pMeV;
    if (fini) { const rg = (0.03 + 0.12 * caso()) * u.metri(lato); pMeV = (rg * B) / 3.336e-3; }
    else if (protone) { const E = 10 * Math.pow(30, caso()); pMeV = Math.sqrt(E * E + 2 * E * 938.27); }
    else { const E = 0.05 + 0.73 * caso(); pMeV = Math.sqrt(E * E + 2 * E * ME_MEV); }
    const m = protone ? 1836.15 : 1;
    out.push({ pos: [caso() * lato, caso() * lato], dir: caso() * 2 * Math.PI, v: velocita(pMeV, m), t0: 0, specie: protone ? 'protone lento' : 'elettrone', ev: `${prefisso}${i}`,
      origine: "un neutrone uscito dal pianeta (colpito da un raggio cosmico) e decaduto qui: la fascia di radiazione lo tiene" });
  }
  return out;
}

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
  // la fascia di radiazione, se il campo la tiene
  const fascia0 = particelleFascia(P, Pl, R.r, u, LATO, 18, caso, 'f');
  sorgenti.push(...fascia0);
  const tau = Pl.densitaAnello(R.r), urtoProtone = tau > 0.05 ? (0.9 * LATO) / tau : Infinity;
  const specie = catalogoVero(u, { urtoProtone, urtoFotone: urtoProtone * 0.55 });
  const centroP = [(MONDO_P / 2 - x0) * k, (MONDO_P / 2 - y0) * k], RPr = R_P * k;
  const cella = {
    larghezza: LATO, altezza: LATO, c: 40, G: 1, bordo: 'aperto', tempo: 140, relativita: true, seme: numero, indirizzo: { ...a },
    fondo: { B: 0, K: 0 }, domini: [], masse: [{ pos: centroP, M: 0, R: RPr }], dipoli: [{ centro: centroP, B0: u.B(P.B0), R: RPr }],
    pellicola: { w0: 0.8, saturazione: 4, vRif: 5 }, specie, sorgenti,
    finestra: { centro: [LATO / 2, LATO / 2], lato: 400 }, sezione: { fine: 140, durata: 140 },
    scala: { latoM, secondi: 140 * u.tu, urtoProtone, r: R.r },
  };
  const Breg = P.B0 / R.r ** 3;
  const descrizione = [`il campo del pianeta, ${(Breg * 1e9).toLocaleString('it-IT', { maximumFractionDigits: 0 })} nT`, `${sorgenti.length} raggi cosmici arrivati fin qui (${vietate} strade all'indietro finivano contro il pianeta: da lì non arriva niente)`, tau > 0.05 ? `la polvere dell'anello (spessore ottico ${tau.toFixed(2)})` : 'niente materia', fascia0.length ? `${fascia0.length} particelle della fascia di radiazione` : null].filter(Boolean).join(', ');
  return { nome: `universo n. ${numero}`, nota: `${descriviIndirizzo(a)}, a ${R.r.toFixed(2)} raggi dal centro; la regione è larga ${fmtLunghezza(latoM)}, l'esposizione dura ${(140 * u.tu * 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} ms. ${descrizione}. Nessuno l'ha costruito: ogni cosa ha una causa più in là.`, cella };
}

// ---------- lo ZOOM DENTRO UNA REGIONE: una bolla di spaziotempo dieci volte più piccola, nello
// spazio e nel tempo (comincia all'inizio della fetta scelta sopra), calcolata da quella grande. Le particelle che la attraversano sono le stesse, con lo stesso stato e lo stesso caso
// (il loro indirizzo, il tempo proprio e la strada già fatti): decadono dove decadevano lassù.
// In più compare solo ciò che da lontano non si vedeva: gli elettroni più fini della fascia.
// a.zoom = [[i, j], ...]: il quadratino (su una griglia 10 × 10) a ogni livello.
const tracceMemo = new Map();
const tracceDi = (cella, chiave) => { if (!tracceMemo.has(chiave)) { if (tracceMemo.size > 6) tracceMemo.delete(tracceMemo.keys().next().value); tracceMemo.set(chiave, simulaMondo(cella)); } return tracceMemo.get(chiave); };
export function cellaDi(a, rami = null) {
  const zoom = a.zoom || [];
  if (!zoom.length) { const c = regione(a).cella; return rami ? { ...c, rami } : c; }
  const padre = cellaDi({ ...a, zoom: zoom.slice(0, -1) }, rami), [i, j] = zoom[zoom.length - 1];
  const tracce = tracceDi(padre, JSON.stringify([a.cosmo, a.galassia, a.stella, a.pianeta, a.regione, zoom.slice(0, -1), rami]));
  const L = padre.larghezza / 10, x0 = i * L, y0 = j * L, k = 10, dentro = (p) => p[0] >= x0 && p[0] <= x0 + L && p[1] >= y0 && p[1] <= y0 + L;
  const ts = padre.sezione ? Math.max(0, padre.sezione.fine - padre.sezione.durata) : 0, te = ts + padre.tempo / k;
  const visibili = new Set(tracce.map((t) => t.evento));
  // chi decade dentro la bolla mentre dura: la bolla ne rifà da sé il decadimento, con tutte le figlie e le nipoti
  const decadeQui = new Set(tracce.filter((t) => t.evento && t.fine === 'decade' && dentro(t.punti.at(-1)) && t.punti.at(-1)[3] >= ts && t.punti.at(-1)[3] <= te).map((t) => t.evento));
  // l'antenata più vicina che lascia traccia (l'indirizzo di una figlia è quello della madre più un punto e un numero)
  const antenata = (ev) => { for (let e = String(ev), n = e.lastIndexOf('.'); n > 0; n = e.lastIndexOf('.')) { e = e.slice(0, n); if (visibili.has(e)) return e; } return null; };
  const sorgenti = [];
  for (const tr of tracce) {
    if (tr.sagoma || !tr.evento) continue;
    const P = tr.punti, src = tr.madre == null ? padre.sorgenti[tr.sorgente] : null;
    let tp = src?.tp0 ?? 0, strada = src?.percorso0 ?? 0;
    const nome = tr.specie.nome, entra = (q, d, vx, vy) => sorgenti.push({ pos: [Math.min(999.99, Math.max(0.01, (q[0] - x0) * k)), Math.min(999.99, Math.max(0.01, (q[1] - y0) * k))], dir: Math.atan2(vy, vx), v: Math.hypot(vx, vy), t0: (q[3] - ts) * k, nascita: (P[0][3] - ts) * k, specie: nome, ev: tr.evento, tp0: d.tp * k, percorso0: d.strada * k, generazione: tr.generazione, origine: src?.origine, gamma: tr.gamma, impulso: tr.impulso });
    // nata qui dentro (nella bolla) da una madre che non lascia traccia (la luce, le neutre): comincia qui. Ma se la
    // sua antenata visibile decade anche lei dentro la bolla, la bolla rifà tutta la cascata (la luce va dritta e non
    // esce): questa figlia nascerà da sola, e metterla qui la farebbe esistere due volte
    if (dentro(P[0]) && P[0][3] >= ts && P[0][3] <= te && (tr.madre == null || (!visibili.has(tr.madre.evento) && !decadeQui.has(antenata(tr.evento)))) && P.length > 1) { const dt = P[1][3] - P[0][3] || 1e-9; entra(P[0], { tp, strada }, (P[1][0] - P[0][0]) / dt, (P[1][1] - P[0][1]) / dt); }
    for (let n = 1; n < P.length; n++) {
      const a0 = P[n - 1], b = P[n], dt = b[3] - a0[3], ds = Math.hypot(b[0] - a0[0], b[1] - a0[1]);
      if (!(dt > 0)) continue;
      // (il tempo proprio: con il γ della particella, che la traccia porta con sé; la velocità della corda non basta vicino a c)
      const v = Math.min(0.999 * padre.c, ds / dt), dtp = padre.relativita ? (tr.gamma ? dt / tr.gamma : dt * Math.sqrt(1 - (v / padre.c) ** 2)) : dt;
      if (b[3] > te) break;
      // già dentro quando la bolla comincia: continua dal suo stato in quell'istante
      if (a0[3] < ts && b[3] >= ts && a0[2]) {
        const f = (ts - a0[3]) / dt, q = [a0[0] + (b[0] - a0[0]) * f, a0[1] + (b[1] - a0[1]) * f, true, ts];
        if (dentro(q)) entra(q, { tp: tp + dtp * f, strada: strada + ds * f }, (b[0] - a0[0]) / dt, (b[1] - a0[1]) / dt);
      }
      tp += dtp; strada += ds;
      // ogni volta che entra nel quadratino durante la bolla, continua da lì
      if (b[3] >= ts && !dentro(a0) && dentro(b) && a0[2] && a0[3] >= ts) entra(b, { tp, strada }, (b[0] - a0[0]) / dt, (b[1] - a0[1]) / dt);
    }
  }
  const latoM = padre.scala.latoM / 10, u = unita(latoM), r = padre.scala.r;
  const Sx = sistema(a.cosmo, a.galassia, a.stella), Px = Sx.pianeti[a.pianeta], Pl = pianeta(a.cosmo, a.galassia, a.stella, a.pianeta);
  const { c: caso } = casoDi('zoom', a.cosmo, a.galassia, a.stella, a.pianeta, a.regione, JSON.stringify(zoom));
  sorgenti.push(...particelleFascia(Px, Pl, r, u, 1000, 14, caso, `z${zoom.length}.${i}.${j}.f`, { fini: true }));
  const urto = padre.scala.urtoProtone * k;
  return {
    ...padre, larghezza: 1000, altezza: 1000, tempo: padre.tempo, indirizzo: { ...a, zoom },
    masse: padre.masse.map((m) => ({ ...m, pos: [(m.pos[0] - x0) * k, (m.pos[1] - y0) * k], R: m.R * k })),
    dipoli: padre.dipoli.map((d) => ({ ...d, centro: [(d.centro[0] - x0) * k, (d.centro[1] - y0) * k], R: d.R * k, B0: d.B0 / k })),
    specie: catalogoVero(u, { urtoProtone: urto, urtoFotone: urto * 0.55 }), sorgenti,
    finestra: { centro: [500, 500], lato: 400 }, sezione: { fine: padre.tempo, durata: padre.tempo },
    scala: { ...padre.scala, latoM, secondi: padre.tempo * u.tu, urtoProtone: urto },
  };
}
