// eventi.js — una sola sorgente per tutto ciò che «va in un modo o in un altro».
//
// In questo universo niente è tirato a caso da un numero messo lì: ogni esito incerto è un EVENTO con un
// indirizzo (dove e quando accade, e che cosa: «cosmo 1/galassia 3/stella 53/pianeta 0/impatto 12/dove»).
// Lo stesso indirizzo dà sempre lo stesso esito: l'universo è già tutto lì, lo si calcola solo dove si guarda.
// Un universo parallelo è lo stesso universo con alcuni eventi andati diversamente: rami = { indirizzo: n }
// sceglie l'esito n-esimo di quell'evento (molti mondi). Tutto il resto resta identico; cambia ciò che ne discende.
// È la stessa regola degli eventi delle particelle (mondo.js, casoEvento), che leggono da qui.
//
// LA FONTE È UNA SOLA: Threefry-2x32 a 20 giri (Salmon, Moraes, Dror e Shaw 2011, «Parallel random numbers: as easy
// as 1, 2, 3»; libreria Random123), un generatore A CONTATORE: una funzione pura (contatore a 64 bit, chiave a 64
// bit) → 64 bit, senza stato. Non c'è una sequenza da cui «tirare»: l'ordine in cui si calcola non conta, e si può
// chiedere l'estrazione numero k senza passare per le prime.
//   · LA CHIAVE è l'indirizzo. Un indirizzo è un cammino di nomi separati da «/»; la chiave di un nome si ricava da
//     quella di chi lo contiene: chiave(«a/b») = Threefry(nome «b» ; chiave(«a»)). Il nome entra come contatore, a
//     blocchi di 8 byte (i caratteri in UTF-8, unità per unità); l'ultimo blocco porta nel byte più alto quanti byte restano
//     (0xF8 + n, un valore che nessun byte di testo può avere): così nomi diversi danno blocchi diversi, e due
//     indirizzi diversi hanno la stessa chiave solo per una coincidenza a 64 bit (su un milione di indirizzi:
//     meno di una probabilità su 10⁷). La radice di tutto è la chiave (0, 0).
//   · IL CONTATORE è (k, ramo): k è il numero dell'estrazione DENTRO l'evento (un evento può aver bisogno di più
//     numeri: i due di una campana, il rumore di una griglia cella per cella), ramo è il mondo scelto per
//     quell'evento. Un ramo cambia quindi i numeri di quell'evento e di nessun altro: le chiavi di ciò che gli sta
//     accanto, e anche di ciò che gli sta sotto, restano quelle.
//   · L'ESITO: i 64 bit usciti; c() ne usa i primi 53 (un numero tra 0 e 1 con tutta la precisione di un double),
//     numero() i primi 32.
// Parametri liberi: nessuno (le costanti di rotazione e 0x1BD11BDA sono quelle di Threefry; il numero di giri, 20,
// è quello consigliato). Riscontro: i vettori noti di Random123 (test/test_eventi.mjs).

// ---------- Threefry-2x32
// la versione «da leggere», con i giri a scelta: serve alle prove (i vettori noti a 13, 20 e 32 giri)
const ROT = [13, 15, 26, 6, 17, 29, 16, 24];
export function threefry2x32(c0, c1, k0, k1, giri = 20) {
  const ks = [k0 | 0, k1 | 0, (0x1BD11BDA ^ k0 ^ k1) | 0];
  let x0 = (c0 + ks[0]) | 0, x1 = (c1 + ks[1]) | 0;
  for (let r = 0; r < giri; r++) {
    const s = ROT[r & 7];
    x0 = (x0 + x1) | 0; x1 = ((x1 << s) | (x1 >>> (32 - s))) ^ x0;
    if ((r & 3) === 3) { const j = (r + 1) >> 2; x0 = (x0 + ks[j % 3]) | 0; x1 = (x1 + ks[(j + 1) % 3] + j) | 0; }
  }
  return [x0 >>> 0, x1 >>> 0];
}
// la versione di lavoro: gli stessi 20 giri scritti per esteso (niente tabelle né vettori: sta nei cicli caldi).
// Lascia l'esito in X0, X1 (interi a 32 bit con segno)
let X0 = 0, X1 = 0;
function tf(c0, c1, k0, k1) {
  const k2 = 0x1BD11BDA ^ k0 ^ k1;
  let a = (c0 + k0) | 0, b = (c1 + k1) | 0;
  a = (a + b) | 0; b = ((b << 13) | (b >>> 19)) ^ a; a = (a + b) | 0; b = ((b << 15) | (b >>> 17)) ^ a; a = (a + b) | 0; b = ((b << 26) | (b >>> 6)) ^ a; a = (a + b) | 0; b = ((b << 6) | (b >>> 26)) ^ a;
  a = (a + k1) | 0; b = (b + k2 + 1) | 0;
  a = (a + b) | 0; b = ((b << 17) | (b >>> 15)) ^ a; a = (a + b) | 0; b = ((b << 29) | (b >>> 3)) ^ a; a = (a + b) | 0; b = ((b << 16) | (b >>> 16)) ^ a; a = (a + b) | 0; b = ((b << 24) | (b >>> 8)) ^ a;
  a = (a + k2) | 0; b = (b + k0 + 2) | 0;
  a = (a + b) | 0; b = ((b << 13) | (b >>> 19)) ^ a; a = (a + b) | 0; b = ((b << 15) | (b >>> 17)) ^ a; a = (a + b) | 0; b = ((b << 26) | (b >>> 6)) ^ a; a = (a + b) | 0; b = ((b << 6) | (b >>> 26)) ^ a;
  a = (a + k0) | 0; b = (b + k1 + 3) | 0;
  a = (a + b) | 0; b = ((b << 17) | (b >>> 15)) ^ a; a = (a + b) | 0; b = ((b << 29) | (b >>> 3)) ^ a; a = (a + b) | 0; b = ((b << 16) | (b >>> 16)) ^ a; a = (a + b) | 0; b = ((b << 24) | (b >>> 8)) ^ a;
  a = (a + k1) | 0; b = (b + k2 + 4) | 0;
  a = (a + b) | 0; b = ((b << 13) | (b >>> 19)) ^ a; a = (a + b) | 0; b = ((b << 15) | (b >>> 17)) ^ a; a = (a + b) | 0; b = ((b << 26) | (b >>> 6)) ^ a; a = (a + b) | 0; b = ((b << 6) | (b >>> 26)) ^ a;
  X0 = (a + k2) | 0; X1 = (b + k0 + 5) | 0;
}

// ---------- dall'indirizzo alla chiave
// prosegue una chiave (k0, k1) lungo il cammino «s» (nomi separati da «/»), dal carattere «da»; lascia la chiave nuova in X0, X1
function scendi(k0, k1, s, da = 0) {
  let lo = 0, hi = 0, n = 0; // il blocco che si sta riempiendo: 8 byte, n già messi
  for (let i = da, L = s.length; i <= L; i++) {
    const ch = i < L ? s.charCodeAt(i) : 47;
    if (ch === 47) { // finisce un nome: l'ultimo blocco, con il conto dei byte rimasti nel byte più alto
      tf(lo, hi | ((0xF8 | n) << 24), k0, k1); k0 = X0; k1 = X1; lo = 0; hi = 0; n = 0;
      continue;
    }
    if (ch < 0x80) { // (il caso di quasi tutti i caratteri: un byte)
      if (n < 4) lo |= ch << (n << 3); else hi |= ch << ((n - 4) << 3);
      if (++n === 8) { tf(lo, hi, k0, k1); k0 = X0; k1 = X1; lo = 0; hi = 0; n = 0; }
      continue;
    }
    // i byte del carattere (UTF-8: due o tre per le lettere non semplici), dal primo all'ultimo
    let b = ch, quanti = 2;
    if (ch >= 0x800) { b = (0xE0 | (ch >> 12)) | ((0x80 | ((ch >> 6) & 63)) << 8) | ((0x80 | (ch & 63)) << 16); quanti = 3; }
    else b = (0xC0 | (ch >> 6)) | ((0x80 | (ch & 63)) << 8);
    for (; quanti > 0; quanti--, b >>>= 8) {
      if (n < 4) lo |= (b & 255) << (8 * n); else hi |= (b & 255) << (8 * (n - 4));
      if (++n === 8) { tf(lo, hi, k0, k1); k0 = X0; k1 = X1; lo = 0; hi = 0; n = 0; }
    }
  }
  X0 = k0; X1 = k1;
}
// la chiave (64 bit, in due interi senza segno) di un indirizzo: per le prove e per chi vuole tenerla da parte
export function chiaveDi(indirizzo) { scendi(0, 0, String(indirizzo)); return [X0 >>> 0, X1 >>> 0]; }

// i 53 bit di un esito, come numero tra 0 (compreso) e 1 (escluso): tutta la prima parola e i 21 bit più alti della
// seconda (così numero(), che dà la prima parola, è lo stesso esito letto con meno cifre)
const DUE53 = 1 / 9007199254740992;
const frazione = () => ((X0 >>> 0) * 2097152 + (X1 >>> 11)) * DUE53;

// un numero intero (32 bit) da un indirizzo e da un ramo
// (chi chiede uno dopo l'altro molti eventi dello stesso luogo non ne rifà la chiave: si tiene quella dell'ultimo
// contenitore visto, cioè dell'indirizzo fino all'ultima «/»)
let contenitore = '', c0 = 0, c1 = 0;
export function numero(chiave, ramo = 0) {
  const s = String(chiave), j = s.lastIndexOf('/');
  if (j > 0) {
    const p = s.slice(0, j); if (p !== contenitore) { contenitore = p; scendi(0, 0, p); c0 = X0; c1 = X1; }
    scendi(c0, c1, s, j + 1);
  } else scendi(0, 0, s);
  tf(0, ramo | 0, X0, X1);
  return X0 >>> 0;
}

// LE ESTRAZIONI DI UN EVENTO, UNA DOPO L'ALTRA: per chi segue una storia passo per passo (una particella: quando
// decade, dove vanno le figlie, ogni deviazione nella materia) e chiede i numeri dello stesso evento in fila. È un
// contatore, non uno stato nascosto: l'estrazione k è sempre la stessa, da chiunque e quando che sia chiesta.
function inFila(k0, k1, ramo) { let k = 0; return () => { tf(k++, ramo, k0, k1); return frazione(); }; }
// (sotto: la chiave, già calcolata con chiaveDi, del luogo che contiene l'indirizzo: per non rifarla a ogni evento)
export function contatore(indirizzo, ramo = 0, sotto = null) { scendi(sotto ? sotto[0] : 0, sotto ? sotto[1] : 0, String(indirizzo)); return inFila(X0, X1, ramo | 0); }

// la sorgente degli eventi di un luogo (radice: il suo indirizzo). c('nome') è l'esito dell'evento
// «radice/nome», un numero tra 0 e 1; c.sotto('parte') è la sorgente di una sua parte.
// La chiave della radice si calcola una volta sola: ogni evento prosegue da lì con il proprio nome.
export function sorgente(radice, rami = null) { scendi(0, 0, String(radice)); return fonte(String(radice), X0, X1, rami); }
// chi riceve «un seme» alla vecchia maniera (un numero) o già una sorgente: in ogni caso ne esce una sorgente
export const comeSorgente = (seme, nome) => (typeof seme === 'function' && seme.radice !== undefined ? seme : sorgente(`${nome} ${seme}`));
function fonte(radice, r0, r1, rami) {
  let haRami = false; if (rami) for (const k in rami) { haRami = true; break; } // (quasi sempre non ce ne sono: non si compone nemmeno la stringa)
  const ramoDi = (indirizzo) => (haRami ? (rami[`${radice}/${indirizzo}`] ?? 0) | 0 : 0);
  const c = (indirizzo) => { scendi(r0, r1, String(indirizzo)); tf(0, ramoDi(indirizzo), X0, X1); return frazione(); };
  c.radice = radice; c.rami = rami;
  c.sotto = (nome) => { scendi(r0, r1, String(nome)); return fonte(`${radice}/${nome}`, X0, X1, rami); };
  c.intero = (indirizzo, n) => Math.min(n - 1, Math.floor(c(indirizzo) * n));
  c.tra = (indirizzo, a, b) => a + (b - a) * c(indirizzo);
  // le estrazioni dello stesso evento: c.serie('nome')(k) è la k-esima (la numero 0 è c('nome')). Per i campi (il
  // rumore di una griglia: k è la cella) e per chi ha bisogno di più numeri per un esito solo. La chiave è calcolata
  // una volta; il ramo dell'evento le cambia tutte insieme
  c.serie = (indirizzo) => { scendi(r0, r1, String(indirizzo)); const k0 = X0, k1 = X1, ramo = ramoDi(indirizzo); return (k = 0) => { tf(k, ramo, k0, k1); return frazione(); }; };
  // le stesse, chieste in fila (vedi contatore)
  c.fila = (indirizzo) => { scendi(r0, r1, String(indirizzo)); return inFila(X0, X1, ramoDi(indirizzo)); };
  // un esito con distribuzione a campana (media 0, scarto 1): le prime due estrazioni dell'evento
  c.normale = (indirizzo) => { scendi(r0, r1, String(indirizzo)); const k0 = X0, k1 = X1, ramo = ramoDi(indirizzo); tf(0, ramo, k0, k1); const a = frazione(); tf(1, ramo, k0, k1); return Math.sqrt(-2 * Math.log(Math.max(1e-12, a))) * Math.cos(2 * Math.PI * frazione()); };
  // per i moduli che chiedono ancora un «seme»: un intero legato a questo indirizzo e a questo ramo
  c.seme = (indirizzo) => { scendi(r0, r1, String(indirizzo)); tf(0, ramoDi(indirizzo), X0, X1); return (X0 >>> 0) % 2147483646 + 1; };
  return c;
}

// LA STESSA SORGENTE, CHE ANNOTA CIÒ CHE LEGGE: in «registro» (una Map) finisce ogni evento chiesto, indirizzo → esito
// (per le estrazioni dopo la prima: «indirizzo#k»). Dice da quali eventi dipende un calcolo, e serve alle prove di
// «un ramo cambia una cosa sola»: in due mondi che differiscono per un evento, ogni altro evento letto ha lo stesso esito.
export function conRegistro(c, registro) {
  const nota = (indirizzo, v) => { registro.set(`${c.radice}/${indirizzo}`, v); return v; };
  const d = (indirizzo) => nota(indirizzo, c(indirizzo));
  d.radice = c.radice; d.rami = c.rami;
  d.sotto = (nome) => conRegistro(c.sotto(nome), registro);
  d.intero = (indirizzo, n) => Math.min(n - 1, Math.floor(d(indirizzo) * n));
  d.tra = (indirizzo, a, b) => a + (b - a) * d(indirizzo);
  d.serie = (indirizzo) => { const s = c.serie(indirizzo); return (k = 0) => nota(k ? `${indirizzo}#${k}` : indirizzo, s(k)); };
  d.fila = (indirizzo) => { const s = d.serie(indirizzo); let k = 0; return () => s(k++); };
  d.normale = (indirizzo) => { const s = d.serie(indirizzo); return Math.sqrt(-2 * Math.log(Math.max(1e-12, s(0)))) * Math.cos(2 * Math.PI * s(1)); };
  d.seme = (indirizzo) => { nota(indirizzo, c(indirizzo)); return c.seme(indirizzo); };
  return d;
}
// l'esito di un evento del registro («indirizzo» o «indirizzo#k»), chiesto da capo a una sorgente
export const rileggi = (voce, rami = null) => { const i = voce.lastIndexOf('#'), k = i < 0 ? 0 : Number(voce.slice(i + 1)), dove = i < 0 ? voce : voce.slice(0, i), j = dove.lastIndexOf('/'); return sorgente(dove.slice(0, j), rami).serie(dove.slice(j + 1))(k); };
