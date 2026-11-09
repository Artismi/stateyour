// lavoratore.js — la decodifica in un processo a parte, così lo studio non si blocca.
// Riceve un'immagine { larghezza, altezza, canali, dati }, restituisce la lingua.
import { decodifica } from '../decodifica.js';
import { lingua, esportaLingua } from '../lingua.js';

self.onmessage = (ev) => {
  try {
    const t0 = Date.now();
    self.postMessage({ stato: "leggo l'immagine: colori, scheletro, tratti, campiture…" });
    const ris = decodifica(ev.data.img, ev.data.opzioni || {});
    const t1 = Date.now();
    self.postMessage({ stato: `${ris.elementi.length} elementi letti in ${((t1 - t0) / 1000).toFixed(1)} s; cerco la lingua: simmetrie, parole, reticoli…` });
    const L = lingua(ris);
    const misure = { larghezza: ris.misure.larghezza, altezza: ris.misure.altezza, colori: ris.misure.colori };
    self.postMessage({ fatto: true, lingua: esportaLingua(L), misure, tempi: { lettura: t1 - t0, lingua: Date.now() - t1 } });
  } catch (err) {
    self.postMessage({ errore: String(err && err.stack || err) });
  }
};
