// lettore.js — la lettura di un'immagine, in un processo a parte.
// 1. pulizia (se serve)  2. lettura dei tratti  3. ricerca della fisica  4. verifica
import { serve, prepara } from '../preparazione.js';
import { decodifica, mascheraOriginale } from '../decodifica.js';
import { tracciaFisica, fedelta } from './inversa.js';
import { simulaMondo } from '../../../src/camera/mondo.js';

self.onmessage = (ev) => {
  const passo = (n, testo) => self.postMessage({ passo: n, testo });
  try {
    let img = ev.data.img;
    const pulizia = ev.data.pulizia ?? 'auto', t0 = Date.now();
    const esame = serve(img);
    let preparata = false;
    if (pulizia === 'sempre' || (pulizia === 'auto' && esame.serve)) {
      passo(1, `pulisco l'immagine: ${esame.motivi.join(', ') || 'richiesto'}`);
      img = prepara(img).img; preparata = true;
    } else passo(1, "l'immagine è già pulita");
    passo(2, 'leggo i tratti: colori, scheletro, spessori, campiture…');
    const ris = decodifica(img);
    passo(3, `${ris.linee.length} tratti letti; cerco per ognuno la particella e il campo liscio che lo disegnano…`);
    const { cella, conta } = tracciaFisica(ris);
    passo(4, `${conta.tratti} particelle, ${conta.ginocchi} ginocchi, un campo liscio in ${conta.esposizioni} esposizioni; verifico rifacendo l'immagine con la fisica…`);
    const tracce = simulaMondo(cella);
    const f = fedelta(tracce, mascheraOriginale(ris), ris.misure.larghezza, ris.misure.altezza, ris.misure.ritaglio);
    self.postMessage({
      fatto: true, cella, conta, tracce,
      misure: { larghezza: ris.misure.larghezza, altezza: ris.misure.altezza },
      fedelta: { iou: f.iou, richiamo: f.richiamo, precisione: f.precisione },
      preparata, motivi: esame.motivi, secondi: (Date.now() - t0) / 1000,
    });
  } catch (err) {
    self.postMessage({ errore: String((err && err.stack) || err) });
  }
};
