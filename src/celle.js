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

  cinese_greca: {
    nome: 'cinese: fregio a greca, specchi a 45° piegano una sola retta',
    cella: {
      lato: 40,
      centro: { tratto: 'greca', parametri: { l: 40 } },
    },
    colonne: 12, righe: 1, gruppo: 'p1',
  },

  // ---------- linee continue per ancoraggi: catene con volute e rami ----------

  girale: {
    nome: 'girale (rinceau): uno stelo ondulato continuo da cella a cella, viticci che si staccano e si avvolgono; simmetria di slittamento',
    cella: {
      lato: 120,
      centro: {
        tratto: 'catena',
        parametri: {
          punti: [[-60, 0], [-45, 13], [-30, 18], [-15, 13], [0, 0], [15, -13], [30, -18], [45, -13], [60, 0]],
          tangenti: [[1, 0.9], null, null, null, null, null, null, null, [1, 0.9]],
          rami: [
            { da: 3, catena: { punti: [[-12, -1], [-24, -6]], tangenti: [[0.55, -1]], voluta: { giri: 1.7, rMin: 0.8, verso: 'destra' } } },
            { da: 7, catena: { punti: [[48, 1], [36, 6]], tangenti: [[0.55, 1]], voluta: { giri: 1.7, rMin: 0.8, verso: 'sinistra' } } },
            { da: 1, catena: { punti: [[-52, 30], [-40, 34]], tangenti: [[-0.2, 1]], voluta: { giri: 1.2, rMin: 0.8, verso: 'destra' } } },
            { da: 5, catena: { punti: [[8, -30], [20, -34]], tangenti: [[-0.2, -1]], voluta: { giri: 1.2, rMin: 0.8, verso: 'sinistra' } } },
          ],
        },
      },
    },
    colonne: 6, righe: 1, gruppo: 'p1',
  },

  palmetta: {
    nome: 'palmetta (anthemion): petali a lira con le punte arricciate, a ventaglio su una base a doppia voluta',
    cella: {
      lato: 160,
      corolla: {
        n: 7, da: 35, a: 145, raggio: 0, orienta: -90,
        motivo: {
          tratto: 'catena',
          parametri: { punti: [[0, 0], [5, 14], [8, 30], [4, 42]], tangenti: [[0.3, 1]], voluta: { giri: 1.4, rMin: 0.7, verso: 'destra' } },
          simmetria: { tipo: 'D', n: 1, fase: 90 },
        },
        scala: 1,
      },
      centro: {
        tratto: 'catena',
        parametri: { punti: [[0, -2], [14, -14], [34, -12], [40, -26]], tangenti: [[1, -0.4]], voluta: { giri: 2, rMin: 0.9, verso: 'destra' } },
        simmetria: { tipo: 'D', n: 1, fase: 90 },
      },
    },
    colonne: 1, righe: 1, gruppo: 'p1',
  },

  candelabro: {
    nome: 'candelabro pompeiano: un solo stelo, i rami nascono tangenti ai nodi e finiscono in volute; specchiato sull asse',
    cella: {
      lato: 240,
      centro: {
        tratto: 'catena',
        parametri: {
          punti: [[0, -110], [0, -70], [0, -30], [0, 10], [0, 50], [0, 88]],
          tangenti: [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1]],
          rami: [
            { da: 1, catena: { punti: [[22, -44], [44, -54], [46, -76]], tangenti: [[0.45, 1]], voluta: { giri: 2.2, rMin: 0.9, verso: 'destra' } } },
            { da: 2, catena: { punti: [[14, -14], [26, -20]], tangenti: [[0.6, 1]], voluta: { giri: 1.8, rMin: 0.8, verso: 'destra' } } },
            { da: 3, catena: { punti: [[30, 26], [56, 20], [60, 0]], tangenti: [[0.7, 1]], voluta: { giri: 2.4, rMin: 1, verso: 'destra' } } },
            { da: 4, catena: { punti: [[12, 66], [22, 62]], tangenti: [[0.6, 1]], voluta: { giri: 1.6, rMin: 0.7, verso: 'destra' } } },
            { da: 5, catena: { punti: [[10, 100], [4, 112], [0, 116]], tangenti: [[0.8, 1]] } },
            { da: 3, catena: { punti: [[18, -4], [34, 0]], tangenti: [[0.5, -1]], voluta: { giri: 1.5, rMin: 0.7, verso: 'sinistra' } } },
          ],
        },
        simmetria: { tipo: 'D', n: 1, fase: 90 },
      },
    },
    colonne: 1, righe: 1, gruppo: 'p1',
  },

  nuvola_ruyi: {
    nome: 'nuvola ruyi: un contorno continuo con tre lobi, ogni lobo si chiude in una voluta; specchiato, poi in fregio sfalsato',
    cella: {
      lato: 110,
      centro: {
        tratto: 'catena',
        parametri: {
          punti: [[0, 6], [-8, 24], [-26, 26], [-34, 10]],
          tangenti: [[-0.3, 1]],
          voluta: { giri: 1.6, rMin: 0.8, verso: 'sinistra' },
          rami: [
            { da: 3, catena: { punti: [[-34, -6], [-20, -14], [-8, -6]], tangenti: [[0.1, -1]], voluta: { giri: 1.5, rMin: 0.8, verso: 'sinistra' } } },
          ],
        },
        simmetria: { tipo: 'D', n: 1, fase: 90 },
      },
    },
    colonne: 7, righe: 3, gruppo: 'p1', sfalsa: true,
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
