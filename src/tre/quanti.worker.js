// quanti.worker.js — il lavoro pesante di src/tre/quanti.js fuori dal filo della pagina: lo stato dell'atomo guardato
// (Hartree-Fock per una molecola: qualche decimo di secondo) e le misure, evento per evento, con la FFT per l'impulso.
// Le misure sono funzioni pure dell'indirizzo (camera/quanti.js `misura`): farle qui o altrove dà gli stessi esiti.
import * as Q from '../camera/quanti.js';

let stato = null;
self.onmessage = (e) => {
  const m = e.data;
  try {
    if (m.tipo === 'stato') {
      stato = Q.statoDi(m.atomo);
      self.postMessage({ tipo: 'pronto', info: { tipo: stato.tipo, elettroni: stato.elettroni, estensione: stato.estensione, energia: stato.energia ?? null, componenti: stato.componenti.map((c) => c.nome), periodoBattimento: stato.periodoBattimento ?? null, tSalto: stato.tSalto ?? null, ritmoEmissione: stato.ritmoEmissione ?? null } });
    } else if (m.tipo === 'misure') {
      const { da, a, sigma, tau, impulsoDa, N, indirizzo } = m, n = a - da + 1, out = new Float32Array(8 * n);
      for (let k = da; k <= a; k++) {
        const r = Q.misura(stato, indirizzo, k, { t: (k * tau) / Q.AU.t, sigma, impulso: k >= impulsoDa, N }), o = 8 * (k - da);
        out[o] = r.x[0]; out[o + 1] = r.x[1]; out[o + 2] = r.x[2]; out[o + 3] = r.p ? r.p[0] : NaN; out[o + 4] = r.p ? r.p[1] : NaN; out[o + 5] = r.p ? r.p[2] : NaN; out[o + 6] = r.componente;
      }
      self.postMessage({ tipo: 'misure', da, a, dati: out, chiesta: m.chiesta }, [out.buffer]);
    }
  } catch (err) { self.postMessage({ tipo: 'errore', messaggio: String(err && err.stack || err) }); }
};
