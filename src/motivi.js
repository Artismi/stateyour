// motivi.js — i tratti dell'alfabeto. Ognuno è una partitura del motore
// fisico, in coordinate locali centrate in (0, 0). La grammatica li prende
// da qui, li moltiplica con le simmetrie e li dispone nelle celle.
import { velocitaApside, velocitaFuga, velocitaCircolare } from './motore.js';
import { catena } from './catena.js';
import { blocchiOnda } from './partiture.js';

const LIM = [-400, -400, 400, 400];
const normalizza = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

export const MOTIVI = {
  // una linea continua per punti di ancoraggio, con volute e rami (vedi catena.js)
  catena: (p = {}) => catena(p),

  // una retta lunga l, centrata
  segmento: ({ l = 60 } = {}) => ({
    G: 1, dt: 1, passi: Math.round(l), limiti: LIM,
    emettitori: [{ id: 's', pos: [-l / 2, 0], angolo: 0, v: 1 }],
    masse: [], interfacce: [], regole: [],
  }),

  // mezza ellisse sopra l'asse x, da (-r, 0) a (r', 0): una massa nell'origine,
  // la particella si ferma quando riattraversa l'asse. e = eccentricità.
  arco: ({ r = 30, e = 0.5, GM = 20000 } = {}) => {
    const a = r / (1 - e); // r è il periapside
    return {
      G: 1, dt: 0.01, passi: 40000, limiti: LIM,
      emettitori: [{ id: 'a', pos: [-r, 0], angolo: 90, v: velocitaApside(GM, r, a) }],
      masse: [{ id: 'm', pos: [0, 0], M: GM }],
      interfacce: [],
      regole: [{ quando: { tipo: 'attraversa', a: [0, 0], b: [1, 0] }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // cerchio intero: e = 0
  cerchio: ({ r = 30, GM = 20000 } = {}) => ({
    G: 1, dt: 0.01, passi: Math.round(2 * Math.PI * r / (velocitaCircolare(GM, r) * 0.01)) + 2, limiti: LIM,
    emettitori: [{ id: 'c', pos: [-r, 0], angolo: 90, v: velocitaCircolare(GM, r) }],
    masse: [{ id: 'm', pos: [0, 0], M: GM }],
    interfacce: [], regole: [],
  }),

  // uncino: un arco di parabola (velocità di fuga) dal periapside fino alla verticale x = r
  uncino: ({ r = 20, GM = 20000, fino = 2.5 } = {}) => ({
    G: 1, dt: 0.01, passi: 40000, limiti: LIM,
    emettitori: [{ id: 'u', pos: [-r, 0], angolo: 90, v: velocitaFuga(GM, r) }],
    masse: [{ id: 'm', pos: [0, 0], M: GM }],
    interfacce: [],
    regole: [{ quando: { tipo: 'attraversa', a: [r * fino, 0], b: [r * fino, 1] }, fai: [{ tipo: 'ferma' }] }],
  }),

  // goccia: due archi speculari che si chiudono — una massa, due particelle
  goccia: ({ r = 12, e = 0.6, GM = 20000 } = {}) => {
    const a = r / (1 - e), v = velocitaApside(GM, r, a);
    return {
      G: 1, dt: 0.01, passi: 40000, limiti: LIM,
      emettitori: [
        { id: 'g1', pos: [-r, 0], angolo: 90, v },
        { id: 'g2', pos: [-r, 0], angolo: -90, v },
      ],
      masse: [{ id: 'm', pos: [0, 0], M: GM }],
      interfacce: [],
      regole: [{ quando: { tipo: 'attraversa', a: [0, 0], b: [1, 0] }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // onda: n mezze ellissi, centrata; ogni massa agisce nel suo blocco
  onda: ({ L = 30, f = 10, n = 2, GM = 5000 } = {}) => {
    const x0 = -(n * L) / 2;
    const { blocchi } = blocchiOnda({ L, f, n, GM, x0, y0: 0, fine: true });
    return {
      G: 1, dt: 0.005, passi: 60000, limiti: LIM,
      emettitori: [{ id: 'o', pos: [x0, 0], angolo: 90, v: velocitaApside(GM, f, L / 2) }],
      blocchi, masse: [], interfacce: [], regole: [],
    };
  },

  // zigzag: una retta che attraversa lastre alternate di indice n
  zigzag: ({ l = 60, lastre = 4, n = 2.2, angolo = 40 } = {}) => {
    const interfacce = [];
    const passo = l / lastre;
    for (let i = 0; i < lastre; i++) {
      const x = -l / 2 + (i + 0.5) * passo;
      const dentro = i % 2 === 0;
      interfacce.push({ id: `z${i}`, a: [x, -100], b: [x, 100], tipo: 'rifrazione', n1: dentro ? 1 : n, n2: dentro ? n : 1 });
    }
    interfacce.push({ id: 'fine', a: [l / 2, -100], b: [l / 2, 100], tipo: 'assorbe' });
    return {
      G: 1, dt: 0.5, passi: 2000, limiti: LIM,
      emettitori: [{ id: 'z', pos: [-l / 2, -l / 4], angolo, v: 1 }],
      masse: [], interfacce, regole: [],
    };
  },

  // ventaglio: un raggio tra due specchi a V, n rimbalzi
  // il raggio entra dalla bocca della V, rimbalza verso il vertice, torna
  // indietro ed è assorbito alla bocca. Centrato sul vertice.
  ventaglio: ({ apertura = 24, l = 60, inclinazione = 8 } = {}) => {
    const a = apertura * Math.PI / 180;
    return {
      G: 1, dt: 0.5, passi: 4000, limiti: LIM,
      emettitori: [{ id: 'v', pos: [l * 0.98, -l * 0.98 * Math.tan(a / 2) * 0.6], angolo: 180 - inclinazione, v: 1 }],
      masse: [],
      interfacce: [
        { id: 'su', a: [0, 0], b: [l * 1.2 * Math.cos(a / 2), l * 1.2 * Math.sin(a / 2)], tipo: 'specchio' },
        { id: 'giu', a: [0, 0], b: [l * 1.2 * Math.cos(a / 2), -l * 1.2 * Math.sin(a / 2)], tipo: 'specchio' },
        { id: 'bocca', a: [l, -l], b: [l, l], tipo: 'assorbe' },
      ],
      regole: [],
    };
  },

  // ---------- geometria esatta: dai dati geometrici ai parametri fisici ----------

  // arco di cerchio di raggio r, da un angolo a un altro (gradi, antiorario),
  // centro nell'origine. La particella è in orbita circolare; si ferma quando
  // attraversa il raggio all'angolo `a`, e solo nel verso giusto, così l'arco
  // può superare i 180°.
  arcoCerchio: ({ r = 30, da = 0, a = 90, GM = 20000 } = {}) => {
    const v = velocitaCircolare(GM, r);
    const d = da * Math.PI / 180, f = a * Math.PI / 180;
    return {
      G: 1, dt: Math.min(0.01, 0.2 * r / v), passi: 200000, limiti: LIM,
      emettitori: [{ id: 'a', pos: [r * Math.cos(d), r * Math.sin(d)], angolo: da + 90, v }],
      masse: [{ id: 'm', pos: [0, 0], M: GM }],
      interfacce: [],
      regole: [{ quando: { tipo: 'attraversa', a: [0, 0], b: [Math.cos(f), Math.sin(f)], verso: 'sinistra' }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // ellisse di semiassi a e b, centrata nell'origine, chiusa esattamente
  ellisse: ({ a = 40, b = 25, GM = 20000 } = {}) => {
    const e = Math.sqrt(Math.max(0, 1 - (b * b) / (a * a))), c = a * e;
    const v = velocitaApside(GM, a - c, a);
    return {
      G: 1, dt: Math.min(0.01, 0.1 * (a - c) / v), passi: 400000, limiti: LIM,
      emettitori: [{ id: 'e', pos: [a, 0], angolo: 90, v }],
      masse: [{ id: 'm', pos: [c, 0], M: GM }],
      interfacce: [],
      regole: [{ quando: { tipo: 'attraversa', a: [0, 0], b: [1, 0], verso: 'sinistra' }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // poligono regolare di n lati (raggio circoscritto r) o stella {n/k}:
  // una particella per lato, dal vertice i al vertice i+k, fermata esattamente
  // sulla perpendicolare al vertice d'arrivo.
  poligono: ({ n = 6, r = 30, k = 1, fase = 90 } = {}) => {
    const vert = [];
    for (let i = 0; i < n; i++) {
      const t = (fase + 360 * i / n) * Math.PI / 180;
      vert.push([r * Math.cos(t), r * Math.sin(t)]);
    }
    const emettitori = [];
    for (let i = 0; i < n; i++) {
      const A = vert[i], B = vert[(i + k) % n];
      const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
      emettitori.push({
        id: `l${i}`, pos: A, dir: [dx / l, dy / l], v: 1, passi: Math.ceil(l) + 2,
        // ogni particella ha la propria regola: si ferma sulla perpendicolare al lato nel vertice d'arrivo
        regole: [{ quando: { tipo: 'attraversa', a: B, b: [B[0] - dy / l, B[1] + dx / l] }, fai: [{ tipo: 'ferma' }] }],
      });
    }
    return { G: 1, dt: 1, passi: Math.ceil(2 * r) + 2, limiti: LIM, emettitori, masse: [], interfacce: [], regole: [] };
  },

  stella: ({ n = 8, k = 3, r = 30, fase = 90 } = {}) => MOTIVI.poligono({ n, r, k, fase }),

  // segmento da A a B, esatto
  tratto: ({ A = [-30, 0], B = [30, 0] } = {}) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
    return {
      G: 1, dt: 1, passi: Math.ceil(l) + 2, limiti: LIM,
      emettitori: [{ id: 't', pos: A, dir: [dx / l, dy / l], v: 1 }],
      masse: [], interfacce: [],
      regole: [{ quando: { tipo: 'attraversa', a: B, b: [B[0] - dy / l, B[1] + dx / l] }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // ---------- i campi: spirale, sinusoide ----------

  // spirale logaritmica: campo magnetico + attrito. Parte dal punto a distanza
  // r0 dal centro asintotico e si avvolge fino a distanza rMin, in `giri` giri circa.
  // Il centro asintotico sta in (0,0): la partenza viene calcolata di conseguenza.
  spirale: ({ r0 = 30, rMin = 2, giri = 2, omega = 1 } = {}) => {
    // rapporto per giro e^{−2πγ/ω} = rMin/r0 in `giri` giri => γ = −ω ln(rMin/r0) / (2π giri)
    const gamma = -omega * Math.log(rMin / r0) / (2 * Math.PI * giri);
    const den = gamma * gamma + omega * omega;
    // |z − z∞| = v0/√den: scelgo v0 perché la distanza iniziale sia r0
    const v0 = r0 * Math.sqrt(den);
    // z0 = z∞ + v0/(iω−γ) = v0·(−γ − iω)/den
    const z0 = [v0 * (-gamma) / den, v0 * (-omega) / den];
    const v = v0;
    return {
      G: 1, dt: Math.min(0.01, 0.05 * rMin / v), passi: 400000, limiti: LIM,
      emettitori: [{ id: 's', pos: z0, angolo: 0, v }],
      masse: [], interfacce: [],
      campi: [{ id: 'B', tipo: 'magnetico', omega }, { id: 'A', tipo: 'attrito', gamma }],
      regole: [{ quando: { tipo: 'distanza', da: [0, 0], r: rMin, verso: 'dentro' }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // sinusoide: molla verso l'asse x, `periodi` periodi di lunghezza d'onda lambda e ampiezza A, centrata
  sinusoide: ({ lambda = 40, A = 10, periodi = 2 } = {}) => {
    const vx = 10, k = (2 * Math.PI * vx / lambda) ** 2, vy = A * Math.sqrt(k);
    const x0 = -(periodi * lambda) / 2, x1 = -x0;
    return {
      G: 1, dt: Math.min(0.01, lambda / vx / 400), passi: 400000, limiti: LIM,
      emettitori: [{ id: 'o', pos: [x0, 0], dir: [vx, vy], v: Math.hypot(vx, vy) }],
      masse: [], interfacce: [],
      campi: [{ id: 'K', tipo: 'molla', a: [0, 0], b: [1, 0], k }],
      regole: [{ quando: { tipo: 'attraversa', a: [x1, 0], b: [x1, 1] }, fai: [{ tipo: 'ferma' }] }],
    };
  },

  // ---------- gli specchi: spezzate e greche ----------

  // spezzata per punti: a ogni vertice uno specchietto orientato in modo che la
  // retta si pieghi verso il vertice successivo. La linea è una sola particella.
  spezzata: ({ punti = [[-30, -10], [-10, 10], [10, -10], [30, 10]], lungo = 6 } = {}) => {
    const interfacce = [];
    for (let i = 1; i < punti.length - 1; i++) {
      const P = punti[i];
      const d = normalizza([P[0] - punti[i - 1][0], P[1] - punti[i - 1][1]]);
      const d2 = normalizza([punti[i + 1][0] - P[0], punti[i + 1][1] - P[1]]);
      // normale dello specchio: lungo d − d'; direzione dello specchio: la sua perpendicolare
      const n = normalizza([d[0] - d2[0], d[1] - d2[1]]);
      const s = [-n[1], n[0]];
      interfacce.push({ id: `v${i}`, a: [P[0] - s[0] * lungo / 2, P[1] - s[1] * lungo / 2], b: [P[0] + s[0] * lungo / 2, P[1] + s[1] * lungo / 2], tipo: 'specchio' });
    }
    const A = punti[0], B = punti[punti.length - 1], U = punti[punti.length - 2];
    const d = normalizza([B[0] - U[0], B[1] - U[1]]);
    const d0 = normalizza([punti[1][0] - A[0], punti[1][1] - A[1]]);
    // all'arrivo un assorbitore corto, perpendicolare all'ultimo tratto: locale,
    // così una spezzata che torna indietro non si ferma prima del tempo
    interfacce.push({ id: 'fine', a: [B[0] - d[1] * lungo / 2, B[1] + d[0] * lungo / 2], b: [B[0] + d[1] * lungo / 2, B[1] - d[0] * lungo / 2], tipo: 'assorbe' });
    return {
      G: 1, dt: 1, passi: 100000, limiti: LIM,
      emettitori: [{ id: 'z', pos: A, dir: d0, v: 1 }],
      masse: [], interfacce, regole: [],
    };
  },

  // greca: la chiave greca classica come spezzata di specchi a 45°, un modulo largo `l`
  greca: ({ l = 40, moduli = 1 } = {}) => {
    const u = l / 5; // la chiave sta in una griglia 5×5
    const base = [[0, 0], [4, 0], [4, 4], [1, 4], [1, 1], [3, 1], [3, 3], [2, 3], [2, 2]];
    const punti = [];
    for (let m = 0; m < moduli; m++) {
      const off = m * 5 * u - (moduli * 5 * u) / 2;
      // ogni modulo entra dal basso a sinistra; tra un modulo e l'altro si torna sulla base
      const seq = m === 0 ? base : base.slice(1);
      for (const [x, y] of seq) punti.push([off + x * u, y * u - 2 * u]);
      if (m < moduli - 1) {
        // uscita dal modulo: dal centro risalgo e riparto a destra sulla base
        punti.push([off + 2 * u, -2 * u + 5 * u], [off + 5 * u, -2 * u + 5 * u], [off + 5 * u, -2 * u]);
      }
    }
    return MOTIVI.spezzata({ punti, lungo: u * 0.9 });
  },

  // quadrato: quattro particelle, una per lato; il contenitore classico
  quadrato: ({ l = 100 } = {}) => ({
    G: 1, dt: 1, passi: Math.round(l), limiti: LIM,
    emettitori: [
      { id: 'g', pos: [-l / 2, -l / 2], angolo: 0, v: 1 },
      { id: 'd', pos: [l / 2, -l / 2], angolo: 90, v: 1 },
      { id: 'u', pos: [l / 2, l / 2], angolo: 180, v: 1 },
      { id: 's', pos: [-l / 2, l / 2], angolo: 270, v: 1 },
    ],
    masse: [], interfacce: [], regole: [],
  }),

  // rombo: il quadrato ruotato di 45°, come contenitore alternativo
  rombo: ({ l = 100 } = {}) => {
    const h = l / 2;
    return {
      G: 1, dt: 1, passi: Math.round(l * Math.SQRT1_2), limiti: LIM,
      emettitori: [
        { id: 'a', pos: [0, -h], angolo: 45, v: 1 },
        { id: 'b', pos: [h, 0], angolo: 135, v: 1 },
        { id: 'c', pos: [0, h], angolo: 225, v: 1 },
        { id: 'd', pos: [-h, 0], angolo: 315, v: 1 },
      ],
      masse: [], interfacce: [], regole: [],
    };
  },
};
