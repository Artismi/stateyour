// lavoratore.js — la decodifica in un processo a parte, così lo studio non si blocca.
// Riceve un'immagine { larghezza, altezza, canali, dati }, restituisce la lingua.
import { decodifica } from '../decodifica.js';
import { lingua, esportaLingua } from '../lingua.js';

// lo schema per la camera: per ogni parola la simmetria, la taglia e i posti
// dove compare, in coordinate dell'immagine (y verso il basso, come lo schermo)
export function schema(L, H) {
  return {
    parole: L.parole.map((w) => {
      const A = w.rappresentante, c = A.centro;
      let r = 1; for (const p of A.campioni) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1]));
      return {
        nome: w.nome, raggio: r, simmetria: { tipo: A.simmetria.tipo, n: A.simmetria.n, asse: A.simmetria.asse != null ? -A.simmetria.asse : null },
        istanze: w.istanze.map(({ M }) => {
          const x = M[0] * c[0] + M[2] * c[1] + M[4], y = M[1] * c[0] + M[3] * c[1] + M[5], det = M[0] * M[3] - M[1] * M[2];
          return { pos: [x, H - y], rot: (-Math.atan2(M[1], M[0]) * 180) / Math.PI, specchio: det < 0 };
        }),
      };
    }),
    reticolo: L.reticoli && L.reticoli[0] ? { v1: L.reticoli[0].v1, v2: L.reticoli[0].v2 } : null,
  };
}

self.onmessage = (ev) => {
  try {
    const t0 = Date.now();
    self.postMessage({ stato: "leggo l'immagine: colori, scheletro, tratti, campiture…" });
    const ris = decodifica(ev.data.img, ev.data.opzioni || {});
    const t1 = Date.now();
    self.postMessage({ stato: `${ris.elementi.length} elementi letti in ${((t1 - t0) / 1000).toFixed(1)} s; cerco la lingua: simmetrie, parole, reticoli…` });
    const L = lingua(ris);
    const misure = { larghezza: ris.misure.larghezza, altezza: ris.misure.altezza, colori: ris.misure.colori };
    self.postMessage({ fatto: true, lingua: esportaLingua(L), schema: schema(L, misure.altezza), misure, tempi: { lettura: t1 - t0, lingua: Date.now() - t1 } });
  } catch (err) {
    self.postMessage({ errore: String(err && err.stack || err) });
  }
};
