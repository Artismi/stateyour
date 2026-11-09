// celle.js — piastrelle di esempio scritte nell'alfabeto della grammatica.
// Ognuna è { cella, colonne, righe, gruppo, ritmo, sfalsa }.

export const CELLE = {
  rosone: {
    nome: 'rosone: centro D4, angoli che quadrano il cerchio, corolla',
    cella: {
      lato: 120,
      centro: { tratto: 'arco', parametri: { r: 10, e: 0.55 }, simmetria: { tipo: 'D', n: 4 } },
      angoli: { tratto: 'uncino', parametri: { r: 6, fino: 3 }, scala: 1.2 },
      corolla: { n: 16, raggio: 46, motivo: { tratto: 'segmento', parametri: { l: 8 } }, orienta: 90 },
    },
    colonne: 6, righe: 4, gruppo: 'p1',
  },

  spicchi: {
    nome: 'i quattro spicchi: un solo arco, D2, poi pmm',
    cella: {
      lato: 100,
      centro: { tratto: 'onda', parametri: { L: 24, f: 8, n: 2, GM: 5000 }, simmetria: { tipo: 'D', n: 2, fase: 45 }, scala: 1.3 },
      contenitore: { tratto: 'quadrato', parametri: { l: 96 } },
    },
    colonne: 7, righe: 5, gruppo: 'pmm',
  },

  contenitore_ritmo: {
    nome: 'contenitore fisso, contenuto che varia con ritmo ABAC',
    cella: {
      lato: 110,
      contenitore: { tratto: 'quadrato', parametri: { l: 100 } },
      contenuto: [
        { tratto: 'goccia', parametri: { r: 8, e: 0.65 }, simmetria: { tipo: 'C', n: 6 } },
        { tratto: 'cerchio', parametri: { r: 28 } },
        { tratto: 'zigzag', parametri: { l: 70, lastre: 5, n: 2.4, angolo: 45 }, simmetria: { tipo: 'D', n: 2 } },
        { tratto: 'arco', parametri: { r: 8, e: 0.7 }, simmetria: { tipo: 'D', n: 3 } },
      ],
    },
    colonne: 7, righe: 4, gruppo: 'p1',
    ritmo: { sequenza: [0, 1, 0, 2, 0, 1, 0, 3], lungo: 'riga' },
  },

  corolla_ciclica: {
    nome: 'corolla ciclica non simmetrica (C7 di uncini), celle ruotate p4',
    cella: {
      lato: 120,
      centro: { tratto: 'cerchio', parametri: { r: 9 } },
      corolla: { n: 7, raggio: 30, motivo: { tratto: 'uncino', parametri: { r: 7, fino: 2.4 } }, orienta: 60 },
      angoli: { tratto: 'arco', parametri: { r: 5, e: 0.4 }, scala: 1.4 },
    },
    colonne: 6, righe: 4, gruppo: 'p4',
  },

  fregio_onda: {
    nome: 'fregio: onda specchiata a colonne alterne (pm) con lati riempitivi',
    cella: {
      lato: 90,
      centro: { tratto: 'onda', parametri: { L: 36, f: 12, n: 2, GM: 5000 } },
      lati: { tratto: 'goccia', parametri: { r: 5, e: 0.6 }, scala: 0.9 },
    },
    colonne: 9, righe: 1, gruppo: 'pm',
  },

  ventagli_sfalsati: {
    nome: 'ventagli di specchi in C3, righe sfalsate (cm)',
    cella: {
      lato: 110,
      centro: { tratto: 'ventaglio', parametri: { apertura: 26, l: 40, inclinazione: 9 }, simmetria: { tipo: 'C', n: 3 }, spostamento: [-6, 0] },
      angoli: { tratto: 'segmento', parametri: { l: 18 }, versoCentro: false, rotazione: 45 },
    },
    colonne: 7, righe: 5, gruppo: 'cm',
  },

  rombi_p2: {
    nome: 'contenitore a rombo, contenuto D4 e C5 alternati in diagonale, p2',
    cella: {
      lato: 100,
      contenitore: { tratto: 'rombo', parametri: { l: 96 } },
      contenuto: [
        { tratto: 'arco', parametri: { r: 7, e: 0.5 }, simmetria: { tipo: 'D', n: 4, fase: 22.5 } },
        { tratto: 'uncino', parametri: { r: 6, fino: 2.2 }, simmetria: { tipo: 'C', n: 5 } },
      ],
    },
    colonne: 7, righe: 5, gruppo: 'p2',
    ritmo: { sequenza: [0, 1], lungo: 'diagonale' },
  },
};
