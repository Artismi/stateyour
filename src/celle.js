// celle.js — piastrelle di esempio scritte nell'alfabeto della grammatica.
// Ognuna è { cella, colonne, righe, gruppo, ritmo, sfalsa }.

export const CELLE = {
  // ---------- dalle tavole della Grammar of Ornament ----------

  bizantino_esagoni: {
    nome: 'bizantino: reticolo esagonale, esagono con stella {6/2} e cerchio',
    cella: {
      lato: 80,
      contenitore: { tratto: 'poligono', parametri: { n: 6, r: 80 / Math.sqrt(3), fase: 30 } },
      centro: { tratto: 'stella', parametri: { n: 6, k: 2, r: 30, fase: 90 } },
      contenuto: [{ tratto: 'cerchio', parametri: { r: 13 } }, { tratto: 'poligono', parametri: { n: 3, r: 14, fase: 90 } }],
    },
    tipo: 'esagonale', colonne: 9, righe: 6, gruppo: 'p1',
    ritmo: { sequenza: [0, 1], lungo: 'diagonale' },
  },

  bizantino_stelle: {
    nome: 'bizantino: stella {8/3} in quadrato, ottagoni agli angoli, pmm',
    cella: {
      lato: 100,
      contenitore: { tratto: 'quadrato', parametri: { l: 100 } },
      centro: { tratto: 'stella', parametri: { n: 8, k: 3, r: 42, fase: 90 } },
      angoli: { tratto: 'poligono', parametri: { n: 8, r: 14, fase: 22.5 }, versoCentro: false },
      contenuto: [{ tratto: 'poligono', parametri: { n: 4, r: 14, fase: 45 } }],
    },
    colonne: 7, righe: 5, gruppo: 'pmm',
  },

  bizantino_intreccio: {
    nome: 'bizantino: cerchi che si sovrappongono (il guilloche), cerchietto al centro',
    cella: {
      lato: 70,
      centro: { tratto: 'cerchio', parametri: { r: 46 } },
      contenuto: [{ tratto: 'cerchio', parametri: { r: 11 } }],
    },
    colonne: 10, righe: 6, gruppo: 'p1',
  },

  egizio_ventaglio: {
    nome: 'egizio: ventaglio di piume su un arco, anelli concentrici, gambo',
    cella: {
      lato: 240,
      corolla: [
        { n: 15, da: 20, a: 160, raggio: 62, motivo: { tratto: 'ellisse', parametri: { a: 22, b: 5 } }, scala: [0.8, 0.8] },
        { n: 15, da: 20, a: 160, raggio: 86, motivo: { tratto: 'ellisse', parametri: { a: 14, b: 3.5 } } },
        { n: 3, da: 20, a: 160, raggio: 0, motivo: { tratto: 'arcoCerchio', parametri: { r: 40, da: 20, a: 160 } }, scala: [1, 1.2] },
      ],
      centro: { tratto: 'arcoCerchio', parametri: { r: 106, da: 20, a: 160 } },
      fusto: {
        asse: { tratto: 'tratto', parametri: { A: [0, -110], B: [0, 0] } },
        elementi: [
          { motivo: { tratto: 'arco', parametri: { r: 6, e: 0.5 } }, x: 10, y: -30, rotazione: 60 },
          { motivo: { tratto: 'ellisse', parametri: { a: 10, b: 4 } }, x: 0, y: 8 },
        ],
      },
    },
    colonne: 1, righe: 1, gruppo: 'p1',
  },

  pompeiano_candelabro: {
    nome: 'pompeiano: candelabro, asse con coppie di volute (spirali) specchiate',
    cella: {
      lato: 220,
      fusto: {
        elementi: [
          { motivo: { tratto: 'spirale', parametri: { r0: 22, rMin: 2, giri: 2.5 } }, x: 24, y: -70, rotazione: 180 },
          { motivo: { tratto: 'spirale', parametri: { r0: 16, rMin: 1.5, giri: 2 } }, x: 18, y: -20 },
          { motivo: { tratto: 'spirale', parametri: { r0: 28, rMin: 2, giri: 2.5 } }, x: 30, y: 30, rotazione: 180 },
          { motivo: { tratto: 'sinusoide', parametri: { lambda: 26, A: 5, periodi: 1 } }, x: 34, y: 62, rotazione: 90 },
          { motivo: { tratto: 'ellisse', parametri: { a: 9, b: 3 } }, x: 0, y: 92 },
          { motivo: { tratto: 'arco', parametri: { r: 5, e: 0.6 } }, x: 8, y: -95, rotazione: 120 },
        ],
      },
    },
    colonne: 1, righe: 1, gruppo: 'p1',
  },

  cinese_greca: {
    nome: 'cinese: fregio a greca, specchi a 45° piegano una sola retta',
    cella: {
      lato: 40,
      centro: { tratto: 'greca', parametri: { l: 40 } },
    },
    colonne: 12, righe: 1, gruppo: 'p1',
  },

  cinese_nuvola: {
    nome: 'cinese: nuvola, coppia di spirali specchiate (D1) con cappello ad arco, pm',
    cella: {
      lato: 90,
      centro: { tratto: 'spirale', parametri: { r0: 20, rMin: 2, giri: 2 }, simmetria: { tipo: 'D', n: 1, fase: 90 }, spostamento: [20, -10] },
      lati: { tratto: 'arcoCerchio', parametri: { r: 18, da: 200, a: 340 }, versoCentro: false },
      contenitore: { tratto: 'sinusoide', parametri: { lambda: 45, A: 6, periodi: 2 }, spostamento: [0, 36] },
    },
    colonne: 8, righe: 2, gruppo: 'pm',
  },

  // ---------- le prime piastrelle ----------

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
