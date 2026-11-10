// leggi.js — le regole e i parametri. Tutto il resto deve discendere da qui.
//
// Le COSTANTI della natura e i PARAMETRI del cosmo; da questi si calcola il
// resto: quanto è vecchio l'universo, quanto vive una stella, che cosa diventa
// quando muore, quanto è forte il campo magnetico di ciò che resta. Cambiando
// una costante cambia tutto, in modo coerente (un multiverso anche di leggi).
// Dove la scienza non sa ancora far emergere una cosa dai principi (la
// distribuzione delle masse delle stelle che nascono, il legame tra una stella
// e il Sole come unità), si usa la legge misurata, e qui lo si dice.

export const COSTANTI = {
  c: 2.998e8, G: 6.674e-11, hbar: 1.0546e-34, kB: 1.381e-23, sigma: 5.670e-8,
  me: 9.109e-31, mp: 1.6726e-27, mn: 1.6749e-27, e: 1.602e-19,
};
export const COSMO = { H0: 67.7, Om: 0.31, OL: 0.69, Ob: 0.049, sigma8: 0.81, ns: 0.965 };
export const ANNO = 3.156e7, MSOLE = 1.989e30, RSOLE = 6.957e8, LSOLE = 3.828e26;

// l'età dell'universo, esatta per un cosmo piatto con materia e energia oscura
export function etaUniverso(p = COSMO) {
  const H = (p.H0 * 1000) / 3.086e22;
  return (2 / (3 * H * Math.sqrt(p.OL))) * Math.asinh(Math.sqrt(p.OL / p.Om));
}

// la massa massima di una nana bianca (Chandrasekhar): dalla meccanica quantistica e dalla gravità
export function massaChandrasekhar(k = COSTANTI, mu = 2) {
  return (3.098 * Math.pow((k.hbar * k.c) / k.G, 1.5)) / (mu * k.mp) ** 2; // ≈ 1,43 masse solari (3,098 = ω₃·√(3π)/2, del polìtropo)
}
// la massa massima di una stella di neutroni: la stessa scala con i neutroni, ridotta dalla
// relatività e dalle forze nucleari (calcolo di Tolman-Oppenheimer-Volkoff: circa 1,5 volte Chandrasekhar)
export const massaMassimaNeutroni = (k = COSTANTI) => 1.55 * massaChandrasekhar(k);

// il raggio di una nana bianca (gas di elettroni degenere) e di una stella di neutroni
export function raggioNanaBianca(M, k = COSTANTI) {
  const Mc = massaChandrasekhar(k), x = Math.min(0.999, M / Mc);
  // R ∝ ħ² / (G·mₑ·(2mₚ)^(5/3)·M^(1/3)); 4,55 viene dal polìtropo di indice 3/2; vicino al limite si stringe
  const R0 = (4.55 * k.hbar * k.hbar) / (k.G * k.me * Math.pow(2 * k.mp, 5 / 3) * Math.pow(M, 1 / 3));
  return R0 * Math.sqrt(1 - x ** (4 / 3));
}
export function raggioNeutroni(M, k = COSTANTI) {
  // la stessa legge con i neutroni al posto degli elettroni; il coefficiente tiene conto delle forze nucleari
  return (4.0 * k.hbar * k.hbar) / (k.G * Math.pow(k.mn, 8 / 3) * Math.pow(M, 1 / 3));
}

// una stella in sequenza principale, con il Sole come unità (le relazioni di scala vengono dalla
// struttura stellare; i loro coefficienti si misurano sul Sole)
export function stella(Msol) {
  const L = Msol < 0.43 ? 0.23 * Msol ** 2.3 : Msol < 2 ? Msol ** 4 : Msol < 55 ? 1.4 * Msol ** 3.5 : 32000 * Msol;
  const R = Msol < 1 ? Msol ** 0.8 : Msol ** 0.57;
  const T = 5772 * Math.pow(L / (R * R), 0.25);
  // quanto vive: brucia circa il 10% del suo idrogeno, con un'efficienza di 0,7% (E = mc²)
  const vita = (0.1 * 0.007 * Msol * MSOLE * COSTANTI.c ** 2) / (L * LSOLE) / ANNO;
  return { L, R, T, vita };
}

// che cosa diventa una stella quando muore, e quanto è forte il suo campo: il flusso magnetico
// si conserva mentre si contrae (B·R² costante), così una stella che diventa piccolissima ha un
// campo enorme
export function fine(Msol, B0 = 1e-4) {
  const Rs = stella(Msol).R * RSOLE, Mc = massaChandrasekhar() / MSOLE;
  if (Msol < 8) { // perde gli strati esterni; resta il nucleo, una nana bianca
    const Mr = Math.min(0.98 * Mc, 0.48 + 0.08 * Msol), R = raggioNanaBianca(Mr * MSOLE);
    return { tipo: 'nana bianca', massa: Mr, raggio: R, B: B0 * (Rs / R) ** 2, supernova: false };
  }
  const nucleo = 1.2 + 0.04 * (Msol - 8);
  if (nucleo < massaMassimaNeutroni() / MSOLE) { // il nucleo collassa: una supernova, e resta una stella di neutroni
    const R = raggioNeutroni(nucleo * MSOLE);
    return { tipo: 'stella di neutroni', massa: nucleo, raggio: R, B: B0 * (Rs / R) ** 2, supernova: true };
  }
  return { tipo: 'buco nero', massa: nucleo, raggio: (2 * COSTANTI.G * nucleo * MSOLE) / COSTANTI.c ** 2, B: 0, supernova: true };
}

// la distribuzione delle masse delle stelle che nascono (misurata: Kroupa); u tra 0 e 1
export function massaNascita(u) {
  // da 0,08 a 100 masse solari: pendenza 1,3 sotto mezza massa solare, 2,3 sopra
  const a = 0.08, b = 0.5, c = 100, w1 = 2 * ((b ** -0.3 - a ** -0.3) / -0.3), w2 = (c ** -1.3 - b ** -1.3) / -1.3, f = w1 / (w1 + w2);
  if (u < f) return (a ** -0.3 + (u / f) * (b ** -0.3 - a ** -0.3)) ** (1 / -0.3);
  return (b ** -1.3 + ((u - f) / (1 - f)) * (c ** -1.3 - b ** -1.3)) ** (1 / -1.3);
}
