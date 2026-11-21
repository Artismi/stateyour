// uso: node strumenti/decodifica.mjs immagine.png [seme.json]
// Decodifica un'immagine di ornamento, fa crescere il seme e dice quanto somiglia.
import { writeFileSync } from 'node:fs';
import { leggiPNG } from './png.mjs';
import { decodifica, semeDaCodifica, rasterizza, somiglianza, mascheraOriginale } from '../src/decodifica.js';
import { simula } from '../src/motore.js';
import { lineeDaTracce } from '../src/grammatica.js';

const [percorso, uscita] = process.argv.slice(2);
if (!percorso) { console.log('uso: node strumenti/decodifica.mjs immagine.png [seme.json]'); process.exit(1); }
const img = leggiPNG(percorso);
const t0 = Date.now();
const ris = decodifica(img);
const conf = semeDaCodifica({ elementi: ris.elementi });
const linee = lineeDaTracce(simula(conf));
const s = somiglianza(mascheraOriginale(ris), rasterizza(linee, img.larghezza, img.altezza, 1).m);
const conta = (t) => ris.elementi.filter((e) => e.tipo === t).length;
console.log(`${percorso}: ${img.larghezza}×${img.altezza}`);
console.log(`codifica: ${conta('catena')} catene, ${conta('petalo')} petali, ${conta('disco')} dischi → ${conf.emettitori.length} sorgenti, ${conf.blocchi.length} blocchi`);
console.log(`somiglianza: IoU ${(s.iou * 100).toFixed(1)} %, richiamo ${(s.richiamo * 100).toFixed(1)} %, precisione ${(s.precisione * 100).toFixed(1)} %  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
if (uscita) {
  const { piani, ...stato } = conf;
  writeFileSync(uscita, JSON.stringify({ codifica: ris.elementi, misure: ris.misure, seme: stato }));
  console.log(`seme scritto in ${uscita}`);
}
