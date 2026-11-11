// eventi.js — una sola sorgente per tutto ciò che «va in un modo o in un altro».
//
// In questo universo niente è tirato a caso da un numero messo lì: ogni esito incerto è un EVENTO con un
// indirizzo (dove e quando accade, e che cosa: «cosmo 1/galassia 3/stella 53/pianeta 0/impatto 12/dove»).
// Lo stesso indirizzo dà sempre lo stesso esito: l'universo è già tutto lì, lo si calcola solo dove si guarda.
// Un universo parallelo è lo stesso universo con alcuni eventi andati diversamente: rami = { indirizzo: n }
// sceglie l'esito n-esimo di quell'evento (molti mondi). Tutto il resto resta identico; cambia ciò che ne discende.
// È la stessa regola di casoEvento in mondo.js (gli eventi delle particelle), portata a ogni scala.

// un numero intero (32 bit) da una chiave e da un ramo
export function numero(chiave, ramo = 0) {
  let h = 0x811c9dc5;
  const s = ramo ? `${chiave}|${ramo}` : String(chiave);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}

// la sorgente degli eventi di un luogo (radice: il suo indirizzo). c('nome') è l'esito dell'evento
// «radice/nome», un numero tra 0 e 1; c.sotto('parte') è la sorgente di una sua parte.
export function sorgente(radice, rami = null) {
  const c = (indirizzo) => { const k = `${radice}/${indirizzo}`; return numero(k, rami ? rami[k] ?? 0 : 0) / 4294967296; };
  c.radice = radice; c.rami = rami;
  c.sotto = (nome) => sorgente(`${radice}/${nome}`, rami);
  c.intero = (indirizzo, n) => Math.min(n - 1, Math.floor(c(indirizzo) * n));
  c.tra = (indirizzo, a, b) => a + (b - a) * c(indirizzo);
  // un esito con distribuzione a campana (media 0, scarto 1)
  c.normale = (indirizzo) => Math.sqrt(-2 * Math.log(Math.max(1e-12, c(`${indirizzo}#a`)))) * Math.cos(2 * Math.PI * c(`${indirizzo}#b`));
  // per i moduli che chiedono ancora un «seme»: un intero legato a questo indirizzo e a questo ramo
  c.seme = (indirizzo) => { const k = `${radice}/${indirizzo}`; return numero(k, rami ? rami[k] ?? 0 : 0) % 2147483646 + 1; };
  return c;
}
