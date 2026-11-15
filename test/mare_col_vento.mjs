// mare_col_vento.mjs — per le prove della finestra (test_finestre, test_coerenza_scale): IL PRIMO MARE CON IL VENTO del
// catalogo. Nessun seme scelto: si scorrono le stelle in vita della galassia 0 del cosmo 1 nell'ordine, e di ognuna i
// pianeti; il primo roccioso con acqua liquida, un mare tra il 15 e l'85% della superficie e il giorno che gira (non
// bloccato: l'aria circola) per cui meteo.js trova la circolazione e mare.js il mare. Il punto: il mare aperto (fondale di
// almeno 100 m, senza ghiaccio) con le onde più alte; il punto torbido: il mare con più fango sospeso (una foce).
// È strutturale: se la catena degli elementi cambia i pianeti, si trova un altro mare, e le prove valgono lo stesso.
import * as CO from '../src/camera/cosmo.js';
import * as GE from '../src/camera/geologia.js';
import * as MA from '../src/camera/mare.js';

export function mareColVento({ galassia = 0, stelleMax = 400, tentativi = 4 } = {}) {
  let provati = 0;
  for (let sid = 0; sid < stelleMax; sid++) {
    const s0 = CO.galassia(1, galassia).stelle[sid]; if (!s0 || s0.stato !== 'in vita') continue; const S = CO.sistema(1, galassia, sid);
    for (const p of S.pianeti) {
      if (!(p.tipo === 'roccioso' && p.clima?.acqua === 'liquida' && p.clima.mare > 0.15 && p.clima.mare < 0.85 && p.interno?.acquaKg > 0 && !p.bloccato)) continue;
      if (++provati > tentativi) return null;
      const via = { cosmo: 1, galassia, stella: sid, pianeta: p.id }, k = JSON.stringify(via);
      const sf = GE.superficiePianeta(k, p, p.interno, p.origine), cl = GE.climaSuperficie(k, p, sf); if (cl.meteo?.regime !== 'aria') continue;
      const se = GE.erosione(k, sf, cl), st = MA.mare(p, se, cl, se, `${k}/mare`); if (!st.esiste) continue;
      let aperto = null, torbido = null;
      for (let j = 0; j < st.H; j++) for (let i = 0; i < st.W; i++) {
        const lat = 90 - ((j + 0.5) * 180) / st.H, lon = ((i + 0.5) * 360) / st.W - 180, q = MA.luogo(st, lon, lat); if (q.tipo !== 'mare' || q.ghiaccio > 0) continue;
        const o = MA.ondeNelPunto(st, lon, lat); if (q.fondoM >= 100 && (!aperto || o.H > aperto.onde.H)) aperto = { lon, lat, onde: o, fondoM: q.fondoM };
        const f = q.sospeso.sabbia + q.sospeso.limo + q.sospeso.argilla + q.sospeso.fiocchi; if (!torbido || f > torbido.fango) torbido = { lon, lat, fango: f, fondoM: q.fondoM, foce: q.foce };
      }
      if (!aperto || !(aperto.onde.H > 0)) continue;
      return { via, P: p, st, sf, cl, se, aperto, torbido, provati };
    }
  }
  return null;
}
