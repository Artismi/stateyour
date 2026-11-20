// superficie.worker.js — la superficie di un pianeta calcolata in secondo piano.
//
// Tettonica, clima, aria che circola ed erosione costano alcuni secondi: qui girano fuori dal filo
// dell'interfaccia, così la mappa resta viva mentre il pianeta «si forma». Il calcolo è lo stesso
// identico di mappa.js (stesso indirizzo, stesso risultato): cambia solo dove gira.
import { sistema } from './cosmo.js';
import { superficiePianeta, climaSuperficie, climaConIlMare, erosione } from './geologia.js';
import { mare } from './mare.js';
import { ricorda } from './deposito.js';

// i dati senza le funzioni (un messaggio tra fili porta numeri e tabelle, non codice)
function pulito(o, visti = new Map()) {
  if (o === null || typeof o !== 'object') return typeof o === 'function' ? undefined : o;
  if (ArrayBuffer.isView(o)) return o;
  if (visti.has(o)) return visti.get(o);
  if (Array.isArray(o)) { const a = []; visti.set(o, a); for (const x of o) a.push(pulito(x, visti)); return a; }
  const r = {}; visti.set(o, r);
  for (const k of Object.keys(o)) { const x = pulito(o[k], visti); if (x !== undefined) r[k] = x; }
  return r;
}

// LA MEMORIA (deposito.js): la superficie è funzione dell'indirizzo e del codice; calcolata una volta si tiene nel navigatore,
// e alla visita dopo si legge (gli stessi bit: la memoria salva proprio ciò che il messaggio porterebbe)
function calcola(k, v) {
  const P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta];
  const sf0 = superficiePianeta(k, P, P.interno, P.origine), cl0 = climaSuperficie(k, P, sf0), se = erosione(k, sf0, cl0);
  // il mare del pianeta (mare.js): i sali, le correnti, ciò che è sospeso; se non c'è acqua liquida lo dice
  let acque = null; try { acque = mare(P, se, cl0, se, `${k}/mare`); } catch (err) { acque = { esiste: false, motivo: `il mare non si è potuto calcolare (${err && err.message})` }; }
  // il mare torna al clima: il calore che le correnti spostano e l'albedo della sua superficie (geologia.js, climaConIlMare)
  let cl = cl0; try { if (acque && acque.esiste) cl = climaConIlMare(k, P, sf0, cl0, acque); } catch { cl = cl0; }
  return { cl: pulito(cl), se: pulito(se), mare: pulito(acque) };
}
self.onmessage = async (e) => {
  const { k, v } = e.data;
  try {
    const t0 = performance.now(); let calcolata = false;
    const r = await ricorda('superficie', k, () => { calcolata = true; return calcola(k, v); }, { codice: import.meta.url });
    self.postMessage({ k, ...r, ms: performance.now() - t0, dallaMemoria: !calcolata });
  } catch (err) { self.postMessage({ k, errore: String((err && err.stack) || err) }); }
};
