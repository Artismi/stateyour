// motivi.js — i tratti dell'alfabeto. Ognuno è una partitura del motore
// fisico, in coordinate locali centrate in (0, 0). La grammatica li prende
// da qui, li moltiplica con le simmetrie e li dispone nelle celle.
import { velocitaApside, velocitaFuga, velocitaCircolare } from './motore.js';

const LIM = [-400, -400, 400, 400];

export const MOTIVI = {
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

  // onda: n mezze ellissi a staffetta, centrata
  onda: ({ L = 30, f = 10, n = 2, GM = 5000 } = {}) => {
    const x0 = -(n * L) / 2;
    const masse = [];
    for (let i = 0; i < n; i++) masse.push({ id: `m${i}`, pos: [x0 + i * L + (i % 2 ? L - f : f), 0], M: GM, acceso: i === 0 });
    return {
      G: 1, dt: 0.005, passi: 60000, limiti: LIM,
      emettitori: [{ id: 'o', pos: [x0, 0], angolo: 90, v: velocitaApside(GM, f, L / 2) }],
      masse, interfacce: [],
      regole: [
        { quando: { tipo: 'attraversa', a: [x0, 0], b: [x0 + 1, 0] }, fai: [{ tipo: 'staffetta', lista: masse.map((m) => m.id), allaFine: 'ferma' }] },
      ],
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
