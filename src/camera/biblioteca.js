// biblioteca.js — la biblioteca di tutti gli universi possibili.
//
// Come nella biblioteca di Babele di Borges, ogni universo ha un indirizzo: un
// numero. Dal numero il caso (ripetibile) mette nello spazio vuoto solo ciò che
// la natura ci mette:
//   · MASSE sparse, poche grandi e molte piccole;
//   · un CAMPO MAGNETICO che varia dolcemente (una somma di onde), come quello
//     delle galassie e dei plasmi;
//   · NUBI di materia, dense qua e rade là;
//   · qualche CRISTALLO, dove il campo si ripete con il passo del reticolo: la
//     periodicità della natura, l'unica ripetizione che non è una copia;
//   · una PIOGGIA di raggi cosmici che entra dai bordi e, urtando, genera
//     sciami di particelle;
//   · DECADIMENTI spontanei di particelle neutre, qua e là;
//   · qualche STELLA NUCLEARE: un nucleo colpito si spezza in una raggiera di
//     particelle (le «stelle» delle emulsioni fotografiche): nel campo le
//     cariche positive e negative si arricciano in versi opposti, in rosette.
// Le particelle sono quelle di un piccolo catalogo naturale, con le loro vite
// medie: ognuna decade quando capita.
//
// Il pattern non si costruisce: si cerca. Si sceglie l'universo, la finestra
// nello spazio e la fetta di tempo da cui guardarlo. Un indirizzo corto può
// contenere solo forme naturali (spirali, rosette, forcelle, ripetizioni
// cristalline); una forma arbitraria è nella biblioteca, ma il suo indirizzo è
// lungo quanto lei.

import { generatore } from './mondo.js';

const LATO = 1000, C = 40;

// il catalogo: poche specie, come in una camera a bolle vera (unità della camera)
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

export function universo(numero) {
  const caso = generatore(Math.imul(numero >>> 0, 2654435761) ^ 0x9e3779b9), tra = (a, b) => a + caso() * (b - a), intero = (a, b) => Math.floor(tra(a, b + 1));
  const onda = (lmin, lmax, a) => { const l = tra(lmin, lmax), th = tra(0, 2 * Math.PI); return { k: [(2 * Math.PI * Math.cos(th)) / l, (2 * Math.PI * Math.sin(th)) / l], a, fi: tra(0, 2 * Math.PI) }; };
  // il campo magnetico: alcune onde lunghe
  const forzaB = tra(0.02, 0.35), nB = intero(3, 7), ondeB = [];
  for (let i = 0; i < nB; i++) ondeB.push(onda(150, 900, (forzaB / Math.sqrt(nB)) * tra(0.5, 1.5) * (caso() < 0.5 ? -1 : 1)));
  // le nubi di materia
  const nubi = caso() < 0.75 ? { K: tra(2, 40), modi: Array.from({ length: intero(3, 6) }, () => onda(120, 600, tra(0.4, 1))) } : null;
  // i cristalli
  const cristalli = [];
  for (let i = intero(0, 2); i > 0; i--) cristalli.push({ centro: [tra(100, LATO - 100), tra(100, LATO - 100)], r: tra(50, 180), passo: tra(6, 24), angolo: tra(0, Math.PI), a: tra(0.3, 1.4) * (caso() < 0.5 ? -1 : 1) });
  // le masse: poche grandi, molte piccole
  const masse = [];
  for (let i = intero(0, 4); i > 0; i--) { const M = 40 * Math.pow(caso(), -1.4); masse.push({ pos: [tra(50, LATO - 50), tra(50, LATO - 50)], M: Math.min(4000, M), R: 2 + Math.cbrt(Math.min(4000, M)) * 0.5 }); }
  // la pioggia dei raggi cosmici, dai bordi verso l'interno
  const sorgenti = [];
  for (let i = intero(3, 9); i > 0; i--) {
    const lato = intero(0, 3), u = tra(0.1, 0.9);
    const pos = [[u * LATO, 0], [LATO, u * LATO], [u * LATO, LATO], [0, u * LATO]][lato], verso = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][lato] + tra(-0.6, 0.6);
    sorgenti.push({ pos, dir: verso, v: tra(16, 30), t0: tra(0, 40), specie: 'protone' });
  }
  // le stelle nucleari: un nucleo si spezza in una raggiera (angoli quasi regolari, energie a caso)
  const specieStelle = {};
  for (let i = intero(0, 3); i > 0; i--) {
    const n = intero(5, 14), base = tra(0, 360), figli = [], scelta = ['pione+', 'pione-', 'elettrone', 'positrone', 'protone'];
    for (let j = 0; j < n; j++) { const a = base + (360 * j) / n; figli.push({ specie: scelta[Math.floor(caso() * (caso() < 0.5 ? 4 : 5))], angolo: [a - 360 / n / 4, a + 360 / n / 4], quota: [0.04, 0.16] }); }
    const nome = `stella ${i}`;
    specieStelle[nome] = { q: 0, m: 20, vita: 0.001, visibile: false, figli };
    sorgenti.push({ pos: [tra(150, LATO - 150), tra(150, LATO - 150)], dir: tra(0, 2 * Math.PI), v: 6, t0: tra(5, 50), specie: nome });
  }
  // i decadimenti spontanei, qua e là
  for (let i = intero(2, 8); i > 0; i--) sorgenti.push({ pos: [tra(80, LATO - 80), tra(80, LATO - 80)], dir: tra(0, 2 * Math.PI), v: tra(2, 10), t0: tra(0, 60), specie: 'kaone0' });
  const cella = {
    larghezza: LATO, altezza: LATO, c: C, G: 1, bordo: 'aperto', tempo: 140, seme: numero,
    fondo: { B: 0, K: 0 }, domini: [], masse, onde: { B: ondeB }, nubi, cristalli,
    pellicola: { w0: 0.8, saturazione: 4, vRif: 5 }, specie: { ...CATALOGO, ...specieStelle }, sorgenti,
    finestra: { centro: [LATO / 2, LATO / 2], lato: 400 }, sezione: { fine: 140, durata: 140 },
  };
  const descrizione = [`${masse.length} ${masse.length === 1 ? 'massa' : 'masse'}`, `un campo magnetico di ${nB} onde`, nubi ? 'nubi di materia' : 'niente materia', cristalli.length ? `${cristalli.length} ${cristalli.length === 1 ? 'cristallo' : 'cristalli'}` : 'nessun cristallo', `${sorgenti.filter((s) => s.specie === 'protone').length} raggi cosmici`, `${sorgenti.filter((s) => s.specie === 'kaone0').length} decadimenti spontanei`, Object.keys(specieStelle).length && `${Object.keys(specieStelle).length} stelle nucleari`].filter(Boolean).join(', ');
  return { nome: `universo n. ${numero}`, nota: `nessuno l'ha costruito: ${descrizione}, estratti a caso dal numero ${numero}`, cella };
}
