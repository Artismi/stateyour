// intreccio.js — l'indirizzo: dove, quando, in quale mondo. (Le regole stanno in INTRECCIO.md.)
//
// Ogni cosa del mondo è individuata da un indirizzo:
//   · il PERCORSO dei luoghi, dal più grande al più piccolo: ['cosmo 1', 'galassia 3', 'stella 53', 'pianeta 0', …];
//   · il TEMPO (anni dall'inizio del cosmo; null = «adesso»);
//   · i RAMI: gli eventi andati diversamente in questo mondo, { indirizzo dell'evento: quale esito }.
// Lo stesso indirizzo dà sempre la stessa cosa. Da qui si prende anche la sorgente degli eventi di un luogo
// (eventi.js): gli eventi di un luogo hanno indirizzi sotto il suo.
import { sorgente } from './eventi.js';

const pulisci = (rami) => { const r = {}; for (const k of Object.keys(rami || {}).sort()) if (rami[k]) r[k] = rami[k]; return r; };
export function indirizzo(percorso, { tempo = null, rami = null } = {}) {
  return Object.freeze({ percorso: Object.freeze(percorso.map(String)), tempo, rami: Object.freeze(pulisci(rami)) });
}
// la forma scritta, unica: «cosmo 1/galassia 3@1.2e10#{"…":1}»
export function scrivi(a) {
  const r = Object.keys(a.rami).length ? `#${JSON.stringify(a.rami)}` : '';
  return `${a.percorso.join('/')}${a.tempo == null ? '' : `@${a.tempo}`}${r}`;
}
export function leggi(testo) {
  const ic = testo.indexOf('#'), corpo = ic < 0 ? testo : testo.slice(0, ic), rami = ic < 0 ? null : JSON.parse(testo.slice(ic + 1));
  const it = corpo.lastIndexOf('@'), dove = it < 0 ? corpo : corpo.slice(0, it);
  return indirizzo(dove.split('/'), { tempo: it < 0 ? null : Number(corpo.slice(it + 1)), rami });
}
export const luogo = (a) => a.percorso.join('/');
export const figlio = (a, nome) => indirizzo([...a.percorso, nome], a);
export const genitore = (a) => (a.percorso.length > 1 ? indirizzo(a.percorso.slice(0, -1), a) : null);
export const alTempo = (a, tempo) => indirizzo(a.percorso, { tempo, rami: a.rami });
// lo stesso luogo nel mondo dove un evento è andato in un altro modo (esito 0: come nel mondo di partenza)
export const nelRamo = (a, evento, esito) => indirizzo(a.percorso, { tempo: a.tempo, rami: { ...a.rami, [evento]: esito } });
// la sorgente degli eventi di questo luogo, in questo mondo
export const eventiDi = (a) => sorgente(luogo(a), a.rami);
// REGOLA 3: un evento può cambiare solo ciò che sta dentro il suo contenitore, e dopo di lui.
// evento: il suo indirizzo scritto («cosmo 1/galassia 3/stella 53/pianeta 0/impatto 12/dove»); contenitore: il luogo
// in cui accade (per un evento di un pianeta, il pianeta). quando: il suo tempo, se lo si conosce.
export function puoToccare(evento, contenitore, a, quando = null) {
  const dentro = luogo(a) === contenitore || luogo(a).startsWith(`${contenitore}/`);
  return dentro && (quando == null || a.tempo == null || a.tempo >= quando);
}
