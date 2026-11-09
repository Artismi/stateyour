// partiture.js — pattern codificati come partiture, e i generatori che li scrivono.
import { velocitaApside, velocitaCircolare, velocitaFuga } from './motore.js';

const LIMITI = [0, 0, 1000, 600];

// ---------- L'onda: masse in fila, accese a staffetta ----------
// Attraversamenti della riga in x0 + i·L. La massa i sta a distanza f_i
// dall'attraversamento di sinistra. Con `alterna` l'offset è f, L-f, f, ...
// e tutte le masse sono uguali: a ogni scambio la particella dista L-f dalla
// massa che lascia e L-f da quella che prende, quindi la velocità è continua.
// Con offset costante f le masse devono scalare di (f/(L-f))² a ogni passo.
// Ampiezza dell'onda: b = sqrt(f·(L-f)). Con f = L/2: semicerchi.
export function generaOnda({ L = 120, f = 40, n = 7, GM = 30000, x0 = 80, y0 = 300, alterna = true, dt = 0.02 } = {}) {
  const masse = [];
  let M = GM;
  for (let i = 0; i < n; i++) {
    const fi = alterna ? (i % 2 === 0 ? f : L - f) : f;
    masse.push({ id: `m${i}`, pos: [x0 + i * L + fi, y0], M, acceso: i === 0 });
    if (!alterna) M *= (f / (L - f)) ** 2;
  }
  const v0 = velocitaApside(GM, f, L / 2);
  return {
    nome: alterna ? 'onda di ellissi' : 'onda a masse decrescenti',
    G: 1, dt, passi: 20000, limiti: LIMITI,
    emettitori: [{ id: 'p', pos: [x0, y0], angolo: 90, v: v0 }],
    masse,
    interfacce: [],
    regole: [
      { quando: { tipo: 'attraversa', a: [x0, y0], b: [x0 + 1, y0] }, fai: [{ tipo: 'staffetta', lista: masse.map((m) => m.id) }] },
    ],
  };
}

// ---------- Famiglia di coniche: una massa, velocità diverse ----------
export function generaConiche({ GM = 40000, r = 120, cx = 500, cy = 300 } = {}) {
  const vc = velocitaCircolare(GM, r), vf = velocitaFuga(GM, r);
  const vel = [
    { id: 'ellisse_stretta', v: vc * 0.6 },
    { id: 'ellisse', v: vc * 0.85 },
    { id: 'cerchio', v: vc },
    { id: 'ellisse_larga', v: vc * 1.2 },
    { id: 'parabola', v: vf },
    { id: 'iperbole', v: vf * 1.25 },
  ];
  return {
    nome: 'coniche: una massa, sei velocità',
    G: 1, dt: 0.01, passi: 6000, limiti: LIMITI,
    emettitori: vel.map((e) => ({ id: e.id, pos: [cx - r, cy], angolo: 90, v: e.v })),
    masse: [{ id: 'sole', pos: [cx, cy], M: GM }],
    interfacce: [],
    regole: [],
  };
}

// ---------- Camera di specchi: un raggio, un pattern ----------
export function generaCamera({ lati = 3, raggio = 240, cx = 500, cy = 300, angolo = 17, rimbalzi = 120 } = {}) {
  const interfacce = [];
  const vert = [];
  for (let i = 0; i < lati; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / lati;
    vert.push([cx + raggio * Math.cos(a), cy + raggio * Math.sin(a)]);
  }
  for (let i = 0; i < lati; i++) interfacce.push({ id: `s${i}`, a: vert[i], b: vert[(i + 1) % lati], tipo: 'specchio' });
  return {
    nome: `camera di ${lati} specchi`,
    G: 1, dt: 1, passi: rimbalzi * 60, limiti: LIMITI,
    emettitori: [{ id: 'raggio', pos: [cx, cy + raggio / 3], angolo, v: 8 }],
    masse: [],
    interfacce,
    regole: [{ quando: { tipo: 'passi', n: rimbalzi * 60 }, fai: [{ tipo: 'ferma' }] }],
  };
}

// ---------- Rifrazione: lastre parallele, la retta diventa spezzata ----------
export function generaLastre({ n = 1.6, spessore = 70, quante = 6, x0 = 230, angolo = 35 } = {}) {
  const interfacce = [];
  for (let i = 0; i < quante; i++) {
    const x = x0 + i * spessore;
    // lato sinistro (n1) e destro (n2) della linea orientata dal basso in alto
    const dentro = i % 2 === 0;
    interfacce.push({ id: `l${i}`, a: [x, 60], b: [x, 540], tipo: 'rifrazione', n1: dentro ? 1 : n, n2: dentro ? n : 1 });
  }
  return {
    nome: 'rifrazione: lastre alternate aria/vetro',
    G: 1, dt: 1, passi: 2000, limiti: LIMITI,
    emettitori: [
      { id: 'r1', pos: [40, 120], angolo, v: 6 },
      { id: 'r2', pos: [40, 300], angolo: 0, v: 6 },
      { id: 'r3', pos: [40, 480], angolo: -angolo, v: 6 },
    ],
    masse: [],
    interfacce,
    regole: [],
  };
}

// ---------- Il tratteggio: la penna si accende e si spegne ----------
export function generaTratteggio() {
  const onda = generaOnda({ n: 7 });
  onda.nome = 'onda tratteggiata: la penna ogni 40 passi';
  onda.regole.push({ quando: { tipo: 'ogni', passi: 40 }, fai: [{ tipo: 'inverti', id: 'penna' }] });
  return onda;
}

// ---------- Specchio che accende la gravità ----------
// La particella va dritta, tocca uno specchio, e il tocco accende una massa:
// da lì in avanti è una conica. Mostra che gli eventi collegano i piani.
export function generaInterruttore() {
  return {
    nome: 'lo specchio accende la massa',
    G: 1, dt: 0.02, passi: 12000, limiti: LIMITI,
    emettitori: [{ id: 'p', pos: [60, 150], angolo: 0, v: 20 }],
    masse: [{ id: 'm', pos: [560, 330], M: 40000, acceso: false }],
    interfacce: [
      { id: 's', a: [760, 100], b: [900, 240], tipo: 'specchio' },
      { id: 'muro', a: [60, 560], b: [960, 560], tipo: 'assorbe' },
    ],
    regole: [{ quando: { tipo: 'tocca', id: 's' }, fai: [{ tipo: 'accendi', id: 'm' }] }],
  };
}

export const PARTITURE = {
  onda_ellissi: () => generaOnda(),
  onda_semicerchi: () => { const p = generaOnda({ f: 60 }); p.nome = 'onda di semicerchi (f = L/2)'; return p; },
  onda_decrescente: () => generaOnda({ alterna: false, n: 6, f: 50 }),
  onda_tratteggiata: () => generaTratteggio(),
  coniche: () => generaConiche(),
  camera_3: () => generaCamera({ lati: 3, rimbalzi: 70 }),
  camera_5: () => generaCamera({ lati: 5, angolo: 23 }),
  camera_quadrata: () => generaCamera({ lati: 4, angolo: 31.7, rimbalzi: 90 }),
  lastre: () => generaLastre(),
  interruttore: () => generaInterruttore(),
};
