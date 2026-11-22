// indirizzi.mjs — i tre indirizzi del giro, scelti con un criterio scritto e non a caso.
//
// IL CRITERIO (scritto una volta, prima di vedere i giri):
//  · «avvio»: l'indirizzo con cui l'app si apre (laboratorio.js AVVIO, il numero 217, col suo criterio scritto lì: in base 0
//    cosmo 1, galassia 0, stella 1, pianeta 2). Nessuna scelta qui.
//  · i candidati: nel cosmo 1, in ordine di indirizzo (galassia, stella, pianeta), i primi N pianeti rocciosi con acqua
//    liquida di stelle «in vita» (N = 12 di serie). Nessun salto, nessun filtro sull'aspetto.
//  · «terre»: tra i candidati, quello con la frazione di terre emerse più alta (a pari merito il primo in ordine);
//  · «acqua»: tra i candidati, quello con la frazione di terre emerse più bassa (a pari merito il primo in ordine).
//  La frazione di terre emerse è pesata con l'area (cos della latitudine) sulla superficie dopo l'erosione, cioè quella
//  che l'app mostra, con la stessa chiave che usa l'app (mappa.js, superficieDi: JSON dell'indirizzo).
//
// uso: node strumenti/misure/indirizzi.mjs [N]   → scrive strumenti/misure/indirizzi.json
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url)), RADICE = join(QUI, '..', '..');
const CO = await import(join(RADICE, 'src/camera/cosmo.js'));
const GE = await import(join(RADICE, 'src/camera/geologia.js'));
const { MTERRA } = await import(join(RADICE, 'src/camera/leggi.js'));
const N = +process.argv[2] || 12;

function frazioneTerre(se) {
  let terra = 0, tot = 0;
  for (let j = 0; j < se.H; j++) { const w = Math.sin(((j + 0.5) / se.H) * Math.PI); for (let i = 0; i < se.W; i++) { tot += w; if (!(se.alt[j * se.W + i] < se.mare)) terra += w; } }
  return terra / tot;
}

const C = CO.cosmo(1), candidati = [], t0 = Date.now();
fuori: for (let g = 0; g < C.galassie.length; g++) {
  const Gx = CO.galassia(1, g);
  for (let s = 0; s < Gx.stelle.length; s++) {
    if (Gx.stelle[s].stato !== 'in vita') continue;
    let Sp; try { Sp = CO.sistemaPigro(1, g, s); } catch { continue; }
    for (const p of Sp.pianeti) {
      if (p.tipo !== 'roccioso' || p.clima?.acqua !== 'liquida') continue;
      const v = { cosmo: 1, galassia: g, stella: s, pianeta: p.id }, k = JSON.stringify(v);
      const P = CO.sistema(1, g, s).pianeti[p.id];
      let terre = NaN;
      try { const sf = GE.superficiePianeta(k, P, P.interno, P.origine), cl = GE.climaSuperficie(k, P, sf), se = GE.erosione(k, sf, cl); terre = frazioneTerre(se); }
      catch (e) { console.log('errore', k, e.message); continue; }
      candidati.push({ ...v, terre: +terre.toFixed(4), massaTerre: +(P.massaKg / MTERRA).toFixed(3) });
      console.log(`${candidati.length}/${N}`, k, 'terre', terre.toFixed(3), `${((Date.now() - t0) / 1000).toFixed(0)} s`);
      if (candidati.length >= N) break fuori;
    }
  }
}
const primo = (cmp) => candidati.reduce((m, c) => (m == null || cmp(c, m) ? c : m), null);
const terre = primo((c, m) => c.terre > m.terre), acqua = primo((c, m) => c.terre < m.terre);
const via = (c) => ({ cosmo: c.cosmo, galassia: c.galassia, stella: c.stella, pianeta: c.pianeta });
const out = {
  criterio: 'avvio: l\'indirizzo d\'avvio (numero 217, laboratorio.js AVVIO). terre/acqua: tra i primi N pianeti rocciosi con acqua liquida del cosmo 1 in ordine di indirizzo, la frazione di terre emerse (dopo l\'erosione, pesata con l\'area) più alta e più bassa; a pari merito il primo.',
  N, candidati,
  indirizzi: [
    { nome: 'avvio', via: { cosmo: 1, galassia: 0, stella: 1, pianeta: 2 }, mira: 'centro' },
    { nome: 'terre', via: via(terre), terre: terre.terre, mira: 'terra' },
    { nome: 'acqua', via: via(acqua), terre: acqua.terre, mira: 'centro' },
  ],
};
writeFileSync(join(QUI, 'indirizzi.json'), JSON.stringify(out, null, 1));
console.log('terre:', JSON.stringify(out.indirizzi[1]), '\nacqua:', JSON.stringify(out.indirizzi[2]));
