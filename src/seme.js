// seme.js — il seme: la configurazione di partenza da cui nasce tutto.
//
// Per ogni pattern esiste una configurazione iniziale con tutto al suo posto:
// le masse, i campi, gli specchi, i blocchi di spaziotempo, e le particelle
// già orientate nelle loro sorgenti. Da lì una sola simulazione genera il
// pattern intero. Le simmetrie e la ripetizione non copiano linee disegnate:
// trasformano lo STATO di ogni tratto e lo collocano nella configurazione.
//
// La trasformazione di uno stato con una similitudine x' = k·Q·x + s
// (Q rotazione o specchio, k scala) è fisica:
//   - posizioni, regioni, interfacce, assi: si trasformano come punti;
//   - la velocità scala di k, il tempo resta lo stesso: allora ogni
//     accelerazione scala di k, e le leggi si adattano da sole:
//       gravità   M' = k³·M      (a = G·M/r²)
//       magnetico ω' = ±ω        (a = ω·v⊥; lo specchio inverte il verso)
//       attrito   γ' = γ         (a = −γ·v)
//       molla     k' = k_molla   (a = −k·d)
//     intervalli di tempo, passi e dt restano identici;
//   - uno specchio scambia sinistra e destra: i lati delle interfacce di
//     rifrazione, i versi degli attraversamenti, il semipiano.
// Ogni copia vive nel proprio piano di esistenza, così le copie non si
// disturbano: è la stessa legge in un altro luogo.

import { T, istanzeReticolo, partituraTratto } from './grammatica.js';

// ---------- la similitudine
function similitudine(M) {
  const [a, b, c, d] = M;
  const det = a * d - b * c;
  const k = Math.sqrt(Math.abs(det));
  const theta = Math.atan2(b, a); // immagine dell'asse x
  return { k, specchio: det < 0, theta };
}
const lineare = (M, v) => [M[0] * v[0] + M[2] * v[1], M[1] * v[0] + M[3] * v[1]];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const punto = (M, p) => T.applica(M, p);

function trasformaRegione(reg, M, S) {
  if (!reg) return reg;
  switch (reg.tipo) {
    case 'tutto': return reg;
    case 'cerchio': return { tipo: 'cerchio', centro: punto(M, reg.centro), r: reg.r * S.k };
    case 'settore': {
      // senza specchio l'intervallo d'angolo ruota; con lo specchio si ribalta
      const da = S.specchio ? S.theta - (reg.da + reg.ampiezza) : reg.da + S.theta;
      return { tipo: 'settore', centro: punto(M, reg.centro), r: [reg.r[0] * S.k, reg.r[1] * S.k], da, ampiezza: reg.ampiezza };
    }
    case 'semipiano': {
      const a = punto(M, reg.a), b = punto(M, reg.b);
      return S.specchio ? { tipo: 'semipiano', a: b, b: a } : { tipo: 'semipiano', a, b };
    }
    case 'poligono': return { tipo: 'poligono', punti: reg.punti.map((p) => punto(M, p)) };
    default: throw new Error(`regione sconosciuta: ${reg.tipo}`);
  }
}

function trasformaLegge(l, M, S, G) {
  if (Array.isArray(l)) return l.map((x) => trasformaLegge(x, M, S, G));
  if (!l) return l;
  switch (l.tipo) {
    case 'gravita': return { tipo: 'gravita', pos: punto(M, l.pos), M: l.M * G * S.k ** 3 };
    case 'magnetico': return { ...l, omega: (l.omega ?? 1) * (S.specchio ? -1 : 1) };
    case 'attrito': return { ...l };
    case 'molla': return { ...l, a: punto(M, l.a || [0, 0]), b: punto(M, l.b || [1, 0]) };
    default: return { ...l };
  }
}

const versoSpecchiato = (v) => (v === 'sinistra' ? 'destra' : v === 'destra' ? 'sinistra' : v);

function trasformaRegola(r, M, S, nome, piano) {
  const q = r.quando;
  let quando = { ...q };
  if (q.tipo === 'attraversa') {
    quando = { ...q, a: punto(M, q.a), b: punto(M, q.b) };
    if (S.specchio && q.verso) quando.verso = versoSpecchiato(q.verso);
  } else if (q.tipo === 'distanza') {
    quando = { ...q, da: punto(M, q.da), r: q.r * S.k };
  } else if (q.tipo === 'tocca') {
    quando = { ...q, id: nome(q.id) };
  }
  const fai = (r.fai || []).map((az) => {
    if (az.tipo === 'staffetta') return { ...az, lista: az.lista.map(nome) };
    if (az.id != null && az.id !== 'penna') return { ...az, id: nome(az.id) };
    return { ...az };
  });
  return { ...r, quando, fai, ...(piano !== undefined ? { piano } : {}) };
}

// Lo stato di un tratto, trasformato e collocato nel piano `prefisso`.
export function trasformaPartitura(part, M, prefisso) {
  const S = similitudine(M);
  const G = part.G ?? 1;
  const nome = (id) => `${prefisso}:${id}`;
  const piano = (p) => (p == null ? prefisso : `${prefisso}/${p}`);
  const limiti = part.limiti || [-1e4, -1e4, 1e4, 1e4];
  const angoli = [[limiti[0], limiti[1]], [limiti[2], limiti[1]], [limiti[2], limiti[3]], [limiti[0], limiti[3]]].map((p) => punto(M, p));
  const xs = angoli.map((p) => p[0]), ys = angoli.map((p) => p[1]);
  const limitiNuovi = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];

  const blocchi = (part.blocchi || []).map((b) => ({
    ...b, id: nome(b.id ?? 'b'), piano: piano(b.piano),
    regione: trasformaRegione(b.regione, M, S), legge: trasformaLegge(b.legge, M, S, G),
  }));
  const masse = (part.masse || []).map((m) => ({ ...m, id: nome(m.id), piano: piano(m.piano), pos: punto(M, m.pos), M: m.M * G * S.k ** 3 }));
  const campi = (part.campi || []).map((c) => {
    const nuovo = { ...c, id: nome(c.id), piano: piano(c.piano) };
    if (c.pos) nuovo.pos = punto(M, c.pos);
    if (c.raggio != null) nuovo.raggio = c.raggio * S.k;
    if (c.rett) {
      // un rettangolo allineato resta allineato solo per rotazioni di 90°: si prende il suo ingombro
      const q = [[c.rett[0], c.rett[1]], [c.rett[2], c.rett[3]], [c.rett[0], c.rett[3]], [c.rett[2], c.rett[1]]].map((p) => punto(M, p));
      nuovo.rett = [Math.min(...q.map((p) => p[0])), Math.min(...q.map((p) => p[1])), Math.max(...q.map((p) => p[0])), Math.max(...q.map((p) => p[1]))];
    }
    if (c.tipo === 'magnetico') nuovo.omega = (c.omega ?? 1) * (S.specchio ? -1 : 1);
    if (c.tipo === 'molla') { nuovo.a = punto(M, c.a || [0, 0]); nuovo.b = punto(M, c.b || [1, 0]); }
    return nuovo;
  });
  const interfacce = (part.interfacce || []).map((i) => {
    const nuova = { ...i, id: nome(i.id), piano: piano(i.piano), a: punto(M, i.a), b: punto(M, i.b) };
    if (S.specchio && i.tipo === 'rifrazione') { nuova.n1 = i.n2; nuova.n2 = i.n1; }
    return nuova;
  });
  const regole = (part.regole || []).map((r) => trasformaRegola(r, M, S, nome, piano(r.piano)));
  const emettitori = (part.emettitori || []).filter((e) => e.acceso !== false).map((e) => {
    const dir0 = e.dir ? norm(e.dir) : [Math.cos((e.angolo ?? 0) * Math.PI / 180), Math.sin((e.angolo ?? 0) * Math.PI / 180)];
    const nuovo = {
      id: nome(e.id), piano: piano(e.piano),
      pos: punto(M, e.pos), dir: norm(lineare(M, dir0)), v: (e.v ?? 1) * S.k,
      t0: e.t0 ?? 0, dt: e.dt ?? part.dt ?? 0.05, passi: e.passi ?? part.passi ?? 2000,
      limiti: limitiNuovi, penna: e.penna,
    };
    if (e.spessore) { nuovo.spessore = e.spessore * S.k; nuovo.assottiglia = e.assottiglia; nuovo.cessioni = e.cessioni; }
    if (e.regole) nuovo.regole = e.regole.map((r) => trasformaRegola(r, M, S, nome));
    if (e.acceso) nuovo.acceso = Object.fromEntries(Object.entries(e.acceso).map(([id, v]) => [nome(id), v]));
    return nuovo;
  });
  return { blocchi, masse, campi, interfacce, regole, emettitori };
}

// ---------- il seme di un pattern
// r: { cella, colonne, righe, gruppo, tipo, ritmo, sfalsa } come in celle.js
export function seme(r) {
  const { posti, larghezza, altezza } = istanzeReticolo(r);
  const conf = { G: 1, limiti: [-1e5, -1e5, 1e5, 1e5], blocchi: [], masse: [], campi: [], interfacce: [], regole: [], emettitori: [], piani: {}, larghezza, altezza };
  const cache = new Map();
  let n = 0;
  for (const posto of posti) {
    for (const ist of posto.istanze) {
      const chiave = ist.tratto + JSON.stringify(ist.parametri);
      if (!cache.has(chiave)) cache.set(chiave, partituraTratto(ist.tratto, ist.parametri));
      const prefisso = `s${n++}`;
      const t = trasformaPartitura(cache.get(chiave), ist.M, prefisso);
      for (const k of ['blocchi', 'masse', 'campi', 'interfacce', 'regole', 'emettitori']) conf[k].push(...t[k]);
      conf.piani[prefisso] = { ruolo: posto.ruolo, i: posto.i, j: posto.j, k: posto.k, tratto: ist.tratto };
    }
  }
  return conf;
}

// il piano radice di una particella: "s12/cr0" -> "s12"
export const pianoRadice = (piano) => (piano || '').split('/')[0];

// quanto è grande il seme: lo si legge prima di farlo crescere
export function contaSeme(conf) {
  return {
    sorgenti: conf.emettitori.length,
    blocchi: conf.blocchi.length,
    masse: conf.masse.length + conf.blocchi.filter((b) => [].concat(b.legge).some((l) => l && l.tipo === 'gravita')).length,
    campi: conf.campi.length + conf.blocchi.filter((b) => [].concat(b.legge).some((l) => l && (l.tipo === 'magnetico' || l.tipo === 'molla'))).length,
    interfacce: conf.interfacce.length,
    regole: conf.regole.length + conf.emettitori.reduce((s, e) => s + (e.regole ? e.regole.length : 0), 0),
  };
}
