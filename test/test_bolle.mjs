// test_bolle.mjs — partire da una o più bolle (bolle.js; INTRECCIO.md regole 5, 11, 12):
//   A. il campo del cosmo condizionato a più punti (Hoffman e Ribak: esatto), con il peso del mondo vincolato;
//   B. che cosa chiede una bolla a chi le sta sopra, dove più bolle si incontrano, il mondo che le contiene.
// Con BOLLE_FONDO=1 si scende anche alla superficie vera (croste di sale, carbonato: ~11 s a pianeta).
import assert from 'node:assert/strict';
import { campoCondizionato, campoLibero, probabilitaChi2, RANGO, CONTENUTI, LIVELLI, GRAPPOLO, bolla, chiede, giudica, antenatoComune, incontra, causaComune, inFondo } from '../src/camera/bolle.js';
import { sorgente } from '../src/camera/eventi.js';
import * as CO from '../src/camera/cosmo.js';
import { campoCosmo } from '../src/camera/spazio3d.js';

let ok = 0; const T0 = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const L = CO.TORO_M, MPC = 3.0857e22, c = sorgente('prova/bolle');
// n punti a caso sul toro, con una scala; i valori chiesti sono quelli di UN ALTRO campo libero negli stessi punti:
// vincoli presi da un mondo possibile, quindi tipici (χ² ≈ quanti sono)
const punti = (n, nome, R) => Array.from({ length: n }, (_, i) => ({ posizione: [L * c(`${nome}/${i}/x`), L * c(`${nome}/${i}/y`), L * c(`${nome}/${i}/z`)], scala: R }));
const daUnAltroMondo = (P, nome, kmax) => { const altro = campoCondizionato(campoLibero(`prova/bolle/altro mondo/${nome}`, { kmax }), []); return P.map((p) => ({ ...p, valore: altro.lisciato(p.posizione, p.scala) })); };
// la distanza sul toro
const distanza = (a, b) => Math.hypot(...a.map((x, d) => { const q = Math.abs(x - b[d]) % L; return Math.min(q, L - q); }));

console.log('A. il campo condizionato');
prova('la coda del χ² (per il peso): i valori noti', () => {
  tra(probabilitaChi2(1, 1), 0.3172, 0.3174, 'P(χ²₁ > 1)'); tra(probabilitaChi2(3.84, 1), 0.0499, 0.0501, 'P(χ²₁ > 3,84)'); tra(probabilitaChi2(10, 4), 0.0403, 0.0405, 'P(χ²₄ > 10)'); tra(probabilitaChi2(1000, 1000), 0.49, 0.5, 'P(χ²₁₀₀₀ > 1000)'); assert.equal(probabilitaChi2(0, 3), 1);
});

prova('passa esattamente per ogni vincolo: uno, quattro e mille vincoli a caso; il peso è quello di un mondo tipico', () => {
  for (const [n, kmax] of [[1, 24], [4, 24], [1000, 10]]) {
    const base = campoLibero(`prova/bolle/campo ${n}`, { kmax }), V = daUnAltroMondo(punti(n, `punti ${n}`, 30 * MPC), n, kmax), t0 = performance.now(), F = campoCondizionato(base, V), ms = performance.now() - t0;
    assert.ok(F.esiste && F.gradi === n && F.ridondanti.length === 0 && F.vincoli.length === n);
    let errore = 0; for (const v of F.vincoli.slice(0, 60)) errore = Math.max(errore, Math.abs(F.lisciato(v.posizione, v.scala) - v.valore));
    assert.ok(errore < 1e-11 * F.sigma, `${n} vincoli: errore ${errore}`);
    // il campo libero non passava di lì (se no la prova non direbbe niente)
    assert.ok(F.vincoli.some((v) => Math.abs(v.libero - v.valore) > 1e-3 * F.sigma)); for (const v of F.vincoli.slice(0, 20)) tra(Math.abs(F.libero(v.posizione, v.scala) - v.libero), -1, 1e-12, 'il campo libero nel vincolo');
    // valori presi da un altro mondo possibile: χ² come quello di n gaussiane (media n, scarto √2n), e così quello del mondo di partenza
    const sc = Math.sqrt(2 * n); tra((F.chi2 - n) / sc, -5, 5, `χ² di ${n} vincoli tipici`); tra((F.chi2Libero - n) / sc, -5, 5, 'χ² del mondo libero'); assert.ok(Math.abs(F.deltaChi2 - (F.chi2 - F.chi2Libero)) < 1e-9 && F.logPeso === -F.chi2 / 2);
    tra(F.probabilita, 1e-6, 1 - 1e-6, 'la probabilità di un χ² così');
    console.log(`      (${n} vincoli su ${base.N} onde: ${num(ms)} ms; errore massimo ${num(errore)}; χ² ${num(F.chi2, 4)} su ${F.gradi} gradi, probabilità ${num(F.probabilita)}; il mondo libero aveva ${num(F.chi2Libero, 4)})`);
  }
});

prova('funzione pura di (indirizzo, vincoli): stesso campo, bit per bit, in qualunque ordine si diano i vincoli e si interroghino i punti', () => {
  const base = campoLibero('prova/bolle/ordine', { kmax: 16 }), V = daUnAltroMondo(punti(12, 'ordine', 25 * MPC), 'ordine', 16), F = campoCondizionato(base, V);
  const mescola = (v, k) => v.map((x, i) => [c(`mescola ${k}/${i}`), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  for (let k = 0; k < 3; k++) { const G = campoCondizionato(campoLibero('prova/bolle/ordine', { kmax: 16 }), mescola(V, k)); assert.deepEqual(G.onde.A, F.onde.A); assert.deepEqual(G.onde.B, F.onde.B); assert.equal(G.chi2, F.chi2); assert.equal(G.probabilita, F.probabilita); assert.deepEqual(G.vincoli.map((v) => v.valore), F.vincoli.map((v) => v.valore)); }
  const Q = punti(30, 'domande', 0).map((p) => p.posizione), dritto = Q.map((p) => F.in(p)), rovescio = [...Q].reverse().map((p) => F.in(p)).reverse(); assert.deepEqual(rovescio, dritto);
  // un altro indirizzo, un altro campo; lo stesso indirizzo con più onde: le onde lunghe sono le stesse (il dettaglio si aggiunge)
  assert.notEqual(campoCondizionato(campoLibero('prova/bolle/ordine 2', { kmax: 16 }), V).in(Q[0]), dritto[0]);
  const fine = campoLibero('prova/bolle/ordine', { kmax: 20 }); let uguali = 0; for (let m = 0, j = 0; m < base.N; m++) { while (fine.KX[j] !== base.KX[m] || fine.KY[j] !== base.KY[m] || fine.KZ[j] !== base.KZ[m]) j++; if (fine.A[j] === base.A[m] && fine.B[j] === base.B[m]) uguali++; } assert.equal(uguali, base.N);
});

prova('lontano da tutti i vincoli coincide col campo libero; vicino no', () => {
  const kmax = 24, base = campoLibero('prova/bolle/lontano', { kmax }), P = punti(4, 'lontano', 20 * MPC), lib = campoCondizionato(base, []);
  // quattro vincoli forti: ognuno sposta il campo lisciato di tre dei suoi scarti
  const sR = Math.sqrt(lib.attesa(P[0].posizione, 20 * MPC).libera), V = P.map((p, i) => ({ ...p, valore: lib.lisciato(p.posizione, p.scala) + (i % 2 ? -3 : 3) * sR })), F = campoCondizionato(base, V);
  // TOLLERANZA DICHIARATA: oltre 300 Mpc (una dozzina di lunghezze di correlazione: la correlazione scende a 1/e in ~25 Mpc)
  // la correzione è sotto il 2% dello scarto del campo, per vincoli che lo spostano di tre scarti
  let lontani = 0, peggio = 0, vicino = 0; const Q = punti(400, 'lontano/domande', 0).map((p) => p.posizione);
  for (const q of Q) { const d = Math.min(...V.map((v) => distanza(q, v.posizione))) / MPC, corr = Math.abs(F.in(q) - F.libero(q)) / F.sigma; if (d > 300) { lontani++; peggio = Math.max(peggio, corr); } }
  for (const v of V) vicino = Math.max(vicino, Math.abs(F.correzione(v.posizione)) / F.sigma);
  assert.ok(lontani > 100, `${lontani} punti lontani`); assert.ok(peggio < 0.02, `lontano la correzione arriva a ${peggio} scarti`); assert.ok(vicino > 0.5, `sul vincolo la correzione è ${vicino} scarti`);
  // quanto in fretta si spegne: la media attesa attorno a un vincolo solo, a distanze crescenti
  const uno = campoCondizionato(base, [{ posizione: [L / 2, L / 2, L / 2], scala: 0, valore: 1 }]), profilo = [0, 25, 50, 100, 200, 300, 600].map((d) => `${d}: ${num(uno.attesa([L / 2 + d * MPC, L / 2, L / 2]).media, 2)}`);
  tra(uno.attesa([L / 2, L / 2, L / 2]).media, 1 - 1e-9, 1 + 1e-9, 'nel vincolo'); tra(uno.attesa([L / 2, L / 2, L / 2]).varianza, -1e-12, 1e-9, 'nel vincolo non resta incertezza');
  console.log(`      (${lontani} punti oltre 300 Mpc da ogni vincolo: correzione al più ${num(peggio)} scarti del campo; sui vincoli fino a ${num(vicino)}; χ² ${num(F.chi2)} su 4: probabilità ${num(F.probabilita)}, contro ${num(F.chi2Libero)} del mondo libero)\n      (quanto pesa un vincolo a distanza, in Mpc: ${profilo.join('  ')})`);
});

prova('vincoli incompatibili riconosciuti e detti; un vincolo ripetuto è di troppo e lo si dice', () => {
  const base = campoLibero('prova/bolle/incompatibili', { kmax: 12 }), V = daUnAltroMondo(punti(5, 'incompatibili', 30 * MPC), 'incompatibili', 12);
  const contro = campoCondizionato(base, [...V, { ...V[2], valore: V[2].valore + 0.1 }]);
  assert.ok(!contro.esiste && /stesso punto/.test(contro.perche) && contro.incompatibili.includes(5) && contro.incompatibili.includes(2), contro.perche);
  // nell'altro ordine: lo stesso verdetto
  assert.ok(!campoCondizionato(base, [{ ...V[2], valore: V[2].valore + 0.1 }, ...V]).esiste);
  // lo stesso vincolo due volte: nessuna contraddizione, uno è di troppo; il campo è quello di prima
  const doppio = campoCondizionato(base, [...V, { ...V[2] }]), semplice = campoCondizionato(base, V);
  assert.ok(doppio.esiste && doppio.ridondanti.length === 1 && doppio.gradi === 5); assert.deepEqual(doppio.onde.A, semplice.onde.A); assert.equal(doppio.chi2, semplice.chi2);
  // stesso punto a un toro intero di distanza: è lo stesso punto
  assert.ok(!campoCondizionato(base, [V[0], { ...V[0], posizione: V[0].posizione.map((x, d) => (d === 0 ? x + L : x)), valore: V[0].valore - 1 }]).esiste);
  // stesso punto, scale diverse: due vincoli veri, compatibili
  const scale = campoCondizionato(base, [V[0], { ...V[0], scala: 80 * MPC, valore: 0.01 }]); assert.ok(scale.esiste && scale.gradi === 2);
  assert.throws(() => campoCondizionato(base, [{ posizione: [0, 0], valore: 1 }]), /posizione/);
  console.log(`      (${contro.perche}; soglia di «stesso vincolo»: ${RANGO})`);
});

prova('la statistica del campo vincolato su molti indirizzi: media e varianza sono quelle della teoria', () => {
  const M = 400, kmax = 6, V = [{ posizione: [0.2 * L, 0.3 * L, 0.4 * L], scala: 60 * MPC, valore: 0.05 }, { posizione: [0.3 * L, 0.3 * L, 0.45 * L], scala: 0, valore: -0.08 }, { posizione: [0.7 * L, 0.6 * L, 0.1 * L], scala: 100 * MPC, valore: 0.02 }];
  const sonde = [[0.25 * L, 0.3 * L, 0.42 * L], [0.3 * L, 0.35 * L, 0.45 * L], [0.7 * L, 0.6 * L, 0.2 * L], [0.5 * L, 0.9 * L, 0.8 * L]], s1 = sonde.map(() => 0), s2 = sonde.map(() => 0), l1 = sonde.map(() => 0), l2 = sonde.map(() => 0); let teoria = null, chi = 0;
  for (let k = 0; k < M; k++) { const F = campoCondizionato(`prova/bolle/statistica/${k}`, V, { kmax }); teoria ??= sonde.map((p) => F.attesa(p)); chi += F.chi2Libero;
    sonde.forEach((p, i) => { const d = F.in(p), q = F.libero(p); s1[i] += d; s2[i] += d * d; l1[i] += q; l2[i] += q * q; }); }
  const righe = sonde.map((p, i) => { const m = s1[i] / M, v = (s2[i] - M * m * m) / (M - 1), t = teoria[i], vl = (l2[i] - (l1[i] * l1[i]) / M) / (M - 1);
    assert.ok(Math.abs(m - t.media) < 4 * Math.sqrt(t.varianza / M), `sonda ${i}: media ${m} contro ${t.media}`); tra(v / t.varianza, 1 - 4 * Math.sqrt(2 / (M - 1)), 1 + 4 * Math.sqrt(2 / (M - 1)), `sonda ${i}: varianza / teoria`);
    assert.ok(Math.abs(l1[i] / M) < 4 * Math.sqrt(t.libera / M)); tra(vl / t.libera, 1 - 4 * Math.sqrt(2 / (M - 1)), 1 + 4 * Math.sqrt(2 / (M - 1)), `sonda ${i}: varianza del campo libero`);
    return `media ${num(m)} (teoria ${num(t.media)}), varianza ${num(v)} (teoria ${num(t.varianza)}; libera ${num(t.libera)})`; });
  // il χ² del mondo libero nei tre vincoli, su molti indirizzi: in media 3
  tra(chi / M, 3 - 4 * Math.sqrt(6 / M), 3 + 4 * Math.sqrt(6 / M), 'χ² medio dei mondi liberi (3 gradi)');
  console.log(`      (${M} indirizzi, 3 vincoli, 4 sonde)\n      ${righe.join('\n      ')}`);
});

prova('un cosmo della biblioteca: senza bolle è quello di sempre; con quattro bolle le sue galassie restano dove e come sono', () => {
  const n = 1, F0 = campoCosmo(n), t0 = performance.now(), G0 = campoCondizionato(n, []), ms0 = performance.now() - t0; let d = 0;
  for (let m = 0; m < F0.onde.n; m++) d = Math.max(d, Math.abs(G0.onde.A[m] - F0.onde.A[m]), Math.abs(G0.onde.B[m] - F0.onde.B[m]));
  assert.ok(d < 1e-8 * G0.sigma && G0.gradi === 0 && G0.chi2 === 0 && G0.probabilita === 1 && G0.fissi === F0.pos.length, `senza bolle le ampiezze differiscono di ${d}`);
  const V = punti(4, 'cosmo', 20 * MPC).map((p, i) => ({ ...p, valore: [0.3, -0.25, 0.1, 0.4][i] })), t1 = performance.now(), G = campoCondizionato(n, V), ms = performance.now() - t1;
  for (const v of G.vincoli) tra(Math.abs(G.lisciato(v.posizione, v.scala) - v.valore), -1, 1e-11, 'la bolla');
  // le galassie: il campo filtrato alle onde lunghe vale ancora l'altezza del loro picco
  let dg = 0; const o = G.onde, t2 = F0.vincoli.taglio ** 2;
  F0.pos.forEach((x, i) => { let s = 0; for (let m = 0; m < o.n; m++) { if (o.kx[m] ** 2 + o.ky[m] ** 2 + o.kz[m] ** 2 > t2) continue; const th = 2 * Math.PI * (o.kx[m] * x[0] + o.ky[m] * x[1] + o.kz[m] * x[2]); s += 2 * (o.A[m] * Math.cos(th) - o.B[m] * Math.sin(th)); } dg = Math.max(dg, Math.abs(s - F0.vincoli.valori[i])); });
  assert.ok(dg < 1e-10, `le galassie si spostano dal loro picco di ${dg}`);
  // senza le galassie tra i vincoli, le stesse quattro bolle le sposterebbero
  assert.equal(campoCondizionato(n, V, { galassie: false }).fissi, 0);
  console.log(`      (cosmo ${n}: ${F0.pos.length} galassie e ${o.n} onde; senza bolle ${num(ms0)} ms, ampiezze uguali a cosmo3d entro ${num(d)}; con 4 bolle ${num(ms)} ms: χ² ${num(G.chi2)} su 4 date le galassie, probabilità ${num(G.probabilita)}, contro ${num(G.chi2Libero)} del cosmo com'era; le galassie restano sul loro picco entro ${num(dg)})`);
});

console.log('\nB. le bolle');
const MONDI = 150; // quanti indirizzi della biblioteca prova ogni ricerca (gli stessi per tutte le domande libere: ~35 ms l'uno, la prima volta)
const mostra = (x) => `${x.provati}${x.esatto ? ' (tutti)' : ''} provati, ${x.buoni} buoni: ${num(100 * x.frazione.valore)} ± ${num(100 * x.frazione.errore, 2)}%${x.forse ? `, forse ${num(100 * x.forse)}%` : ''}; peso ${num(x.peso.valore)} ± ${num(x.peso.errore, 2)}`;
// ridiscendere: dal solo indirizzo scritto, rifare la bolla e giudicarla da capo
const ridiscendi = (e) => giudica({ luogo: e.luogo, grandezza: e.bolla.grandezza, istante: e.bolla.istante, contenuto: e.bolla.contenuto });

prova('ogni contenuto dice che cosa chiede a chi sta sopra, livello per livello, e da quale legge', () => {
  for (const cosa of Object.keys(CONTENUTI)) { const R = chiede({ contenuto: cosa === 'minerale' ? { cosa, nome: 'quarzo' } : cosa }); assert.ok(R.length >= 2 && R.every((r) => r.perche.length > 20 && r.legge.length > 5) && R.some((r) => r.livello === 'pianeta') && R[R.length - 1].livello === 'stella'); }
  assert.deepEqual(chiede({ contenuto: 'crosta di sale' }).map((r) => r.livello), ['superficie', 'pianeta', 'stella']); assert.deepEqual(chiede({ contenuto: 'ghiaccio' }).map((r) => r.livello), ['punto', 'pianeta', 'stella']);
  assert.throws(() => bolla({ contenuto: 'un drago' }), /non so giudicare/); assert.throws(() => bolla({ luogo: 'galassia 3', contenuto: 'anello' }), /scende per/);
  const b = bolla({ luogo: 'cosmo 1/galassia 0/stella 21/pianeta 0/punto 12.5,-30', grandezza: 2, contenuto: 'acqua liquida' }); assert.deepEqual(b.dove, { cosmo: 1, galassia: 0, stella: 21, pianeta: 0, punto: [12.5, -30] }); assert.deepEqual([...b.luogo.percorso], ['cosmo 1', 'galassia 0', 'stella 21', 'pianeta 0', 'punto 12.5,-30']);
  assert.deepEqual(LIVELLI, ['cosmo', 'galassia', 'stella', 'pianeta', 'punto']);
  console.log(`      (${Object.keys(CONTENUTI).join(', ')})`);
});

let tLibere = 0;
prova('una bolla, luogo libero: si trova; ridiscendendo dal mondo trovato il contenuto è lì; si dice quanti mondi e quale parte andava bene', () => {
  const t0 = performance.now(), righe = [];
  for (const cosa of ['acqua liquida', 'ghiaccio', 'crosta di sale', { cosa: 'minerale', nome: 'ematite' }, { cosa: 'minerale', nome: 'quarzo' }, 'anello', 'aurora']) {
    const r = incontra([{ contenuto: cosa }], { mondi: MONDI }), nome = typeof cosa === 'string' ? cosa : cosa.nome; assert.ok(r.esiste, `${nome}: ${r.perche}`);
    const e = r.bolle[0], x = r.ricerche[0], g = ridiscendi(e); assert.equal(g.esito, 'sì', `${nome} in ${e.luogo}: ${g.perche}`); assert.ok(g.parte > 0 && g.parte <= 1 && !e.daVerificare);
    assert.ok(x.provati >= MONDI - 5 && x.buoni >= 1 && x.frazione.valore > 0 && x.frazione.errore > 0 && x.peso.valore > 0 && x.peso.valore <= x.frazione.valore + 1e-12 && /^cosmo \d+\/galassia \d+\/stella \d+\/pianeta \d+\/punto /.test(e.luogo));
    // l'indirizzo trovato è un numero della biblioteca: da lì si entra nell'app
    const a = CO.indirizzoDi(e.numero); assert.deepEqual([a.cosmo, a.galassia, a.stella, a.pianeta], [e.bolla.dove.cosmo, e.bolla.dove.galassia, e.bolla.dove.stella, e.bolla.dove.pianeta]);
    righe.push(`${nome}: ${e.luogo} (n. ${e.numero}) — ${mostra(x)}`);
  }
  tLibere = performance.now() - t0;
  console.log(`      (${MONDI} mondi in 2 cosmi, a grappoli di ${GRAPPOLO} per galassia; ${num(tLibere / 1000)} s per farli la prima volta)\n      ${righe.join('\n      ')}`);
});

prova('ciò che il pianeta non sa decidere resta «forse», e lo dice; un minerale che chimica.js non dà non si trova', () => {
  const r = incontra([{ contenuto: 'carbonato' }], { mondi: MONDI }); assert.ok(r.esiste && r.daVerificare && r.bolle[0].candidati.length >= 1 && /superficie/.test(r.perche)); assert.equal(ridiscendi(r.bolle[0]).esito, 'forse');
  const o = incontra([{ contenuto: { cosa: 'minerale', nome: 'kriptonite' } }], { mondi: MONDI }); assert.ok(!o.esiste && /nessun mondo su \d+ provati/.test(o.perche) && /chimica\.js/.test(o.perche));
  // un cratere recente: dove niente lo cancella è deciso, altrove è «forse» (impatti.js costa: pochi mondi)
  const k = incontra([{ contenuto: { cosa: 'cratere', entroAnni: 2e9, diametroM: 2e4 } }], { mondi: 25 }); assert.ok(k.esiste); const gk = ridiscendi(k.bolle[0]); assert.ok(gk.esito === 'sì' || (gk.esito === 'forse' && k.daVerificare)); assert.ok(gk.misura.quanti >= 1 && gk.misura.eta <= 2e9 && gk.misura.diametroM >= 2e4);
  console.log(`      (carbonato: ${mostra(r.ricerche[0])} → ${r.bolle[0].candidati.length} pianeti da guardare in fondo)\n      (cratere di almeno 20 km negli ultimi 2 miliardi di anni: ${mostra(k.ricerche[0])} → ${k.bolle[0].luogo}: ${gk.esito}, ${gk.misura.quanti} crateri, l'ultimo di ${num(gk.misura.diametroM / 1e3)} km, ${num(gk.misura.eta / 1e6)} milioni di anni fa)\n      (kriptonite: ${o.perche})`);
});

prova('più bolle: libere, ognuna trova il suo mondo; nello stesso pianeta, lo stesso mondo le contiene tutte, e ridiscendendo ci sono', () => {
  const quattro = ['acqua liquida', 'ghiaccio', 'anello', 'aurora'].map((x) => ({ contenuto: x })), r = incontra(quattro, { mondi: MONDI });
  assert.ok(r.esiste && r.bolle.length === 4 && r.ricerche.length === 4 && r.chiesto.livello === 'biblioteca'); for (const e of r.bolle) assert.equal(ridiscendi(e).esito, 'sì');
  // l'ordine in cui si danno le bolle non conta; la stessa domanda, lo stesso mondo
  const rov = incontra([...quattro].reverse(), { mondi: MONDI }); assert.deepEqual(rov.bolle.map((e) => e.luogo).reverse(), r.bolle.map((e) => e.luogo)); assert.deepEqual(incontra(quattro, { mondi: MONDI }).bolle.map((e) => e.luogo), r.bolle.map((e) => e.luogo));
  // un'altra etichetta: un'altra scelta tra i mondi buoni (non sempre la stessa)
  const scelte = new Set(); for (let k = 0; k < 12; k++) scelte.add(incontra([{ contenuto: 'ghiaccio' }], { mondi: MONDI, etichetta: `scelta ${k}` }).mondi[0]); assert.ok(scelte.size > 4);
  // nello stesso pianeta: mare e ghiaccio insieme (un pianeta con le calotte), in due punti diversi
  const due = incontra([{ contenuto: 'acqua liquida' }, { contenuto: 'ghiaccio' }], { insieme: 'pianeta', mondi: MONDI }); assert.ok(due.esiste && due.mondi.length === 1 && due.antenato.livello === 'pianeta', due.perche);
  for (const e of due.bolle) assert.equal(ridiscendi(e).esito, 'sì'); assert.ok(due.bolle[0].bolla.dove.punto[1] !== due.bolle[1].bolla.dove.punto[1]);
  tra(due.ricerche[0].frazione.valore, 0, r.ricerche[0].frazione.valore + 1e-9, 'i mondi con mare e ghiaccio sono una parte di quelli col mare');
  // dentro un sistema dato: si guardano tutti i suoi pianeti (peso esatto, senza errore)
  const sis = incontra([{ luogo: 'cosmo 1/galassia 0/stella 21', contenuto: 'acqua liquida' }, { luogo: 'cosmo 1/galassia 0/stella 21', contenuto: 'ghiaccio' }]);
  assert.ok(sis.esiste && sis.chiesto.livello === 'stella' && sis.ricerche.every((x) => x.esatto && x.frazione.errore === 0 && x.provati === CO.sistema(1, 0, 21).pianeti.length)); for (const e of sis.bolle) assert.equal(ridiscendi(e).esito, 'sì');
  console.log(`      (quattro bolle libere → ${r.mondi.length} mondi: ${r.bolle.map((e) => `${e.bolla.contenuto.cosa} in ${e.luogo.replace(/\/punto.*/, '')}`).join('; ')})\n      (mare e ghiaccio nello stesso pianeta: ${due.bolle.map((e) => e.luogo).join(' e ')} — ${mostra(due.ricerche[0])})\n      (nel sistema cosmo 1/galassia 0/stella 21: ${sis.bolle.map((e) => `${e.bolla.contenuto.cosa} nel pianeta ${e.bolla.dove.pianeta}`).join(', ')})`);
});

prova('posizione data: l\'incontro può essere vietato, e si dice quale legge lo vieta', () => {
  // un pianeta gelato e uno col mare, dalla biblioteca
  let gelato = null, mare = null; for (let s = 0; s < 300 && !(gelato && mare); s++) for (const P of CO.sistema(1, 0, s).pianeti) { const dove = `cosmo 1/galassia 0/stella ${s}/pianeta ${P.id}`, T = P.clima?.fasce?.T || [P.clima?.T]; if (!gelato && P.tipo !== 'gassoso' && P.clima?.acqua === 'ghiaccio' && Math.max(...T) < 250) gelato = dove; if (!mare && P.clima?.acqua === 'liquida' && Math.min(...T) > 275) mare = dove; }
  assert.ok(gelato && mare);
  const a = incontra([{ luogo: gelato, contenuto: 'acqua liquida' }]); assert.ok(!a.esiste && /statoAcqua/.test(a.perche) && /non esiste/.test(a.perche), a.perche);
  const b = incontra([{ luogo: mare, contenuto: 'acqua liquida' }]); assert.ok(b.esiste && ridiscendi(b.bolle[0]).esito === 'sì');
  // nello stesso punto: acqua liquida e ghiaccio chiedono temperature che non si incontrano
  const p = `${mare}/punto 10,5`, x = incontra([{ luogo: p, contenuto: 'acqua liquida' }, { luogo: p, contenuto: 'ghiaccio' }]); assert.ok(!x.esiste && /non si incontrano/.test(x.perche) && /statoAcqua/.test(x.legge) && x.antenato.livello === 'punto', x.perche);
  // in un punto dato del pianeta col mare, il ghiaccio non c'è (a quella latitudine fa caldo)
  const g = incontra([{ luogo: `${mare}/punto 0,0`, contenuto: 'ghiaccio' }]); assert.ok(!g.esiste && /statoAcqua/.test(g.perche));
  // prima che la stella nascesse (regola 6); una bolla più grande del pianeta; due pianeti diversi per bolle che dovrebbero stare insieme
  const t = incontra([{ luogo: mare, istante: 1e6, contenuto: 'acqua liquida' }]); assert.ok(!t.esiste && /non era ancora nata/.test(t.perche));
  const grande = incontra([{ luogo: mare, grandezza: 1e9, contenuto: 'acqua liquida' }]); assert.ok(!grande.esiste && /non sta in un pianeta/.test(grande.perche));
  const sparse = incontra([{ luogo: mare, contenuto: 'acqua liquida' }, { luogo: gelato, contenuto: 'ghiaccio' }], { insieme: 'pianeta' }); assert.ok(!sparse.esiste && /stesso pianeta/.test(sparse.perche));
  // …ma senza chiedere che stiano insieme, quelle due ci sono: e il loro antenato comune è la galassia
  const ok2 = incontra([{ luogo: mare, contenuto: 'acqua liquida' }, { luogo: gelato, contenuto: 'ghiaccio' }]); assert.ok(ok2.esiste && ok2.chiesto.livello === (mare.split('/')[2] === gelato.split('/')[2] ? 'stella' : 'galassia'));
  assert.equal(antenatoComune([{ luogo: 'cosmo 1/galassia 0/stella 21/pianeta 0', contenuto: 'anello' }, { luogo: 'cosmo 1/galassia 0/stella 3', contenuto: 'anello' }]).livello, 'galassia'); assert.equal(antenatoComune([{ luogo: 'cosmo 1', contenuto: 'anello' }, { luogo: 'cosmo 2', contenuto: 'anello' }]).livello, 'biblioteca');
  console.log(`      (acqua liquida in ${gelato}: ${a.perche})\n      (${x.perche})\n      (${t.perche})`);
});

prova('la causa comune: due croste di sale stanno più spesso nello stesso mondo che in due, quando i pesi lo dicono; mare e ghiaccio no', () => {
  const sale = [{ contenuto: 'crosta di sale' }, { contenuto: 'crosta di sale', grandezza: 2 }], cc = causaComune(sale, { mondi: MONDI });
  assert.ok(cc.provati > 100 && cc.stesso.peso > 0 && cc.separati.peso > 0 && cc.stesso.errore > 0);
  // ⟨f²⟩ ≥ ⟨f⟩²: nello stesso mondo pesa di più, tanto più quanto più il sale è di pochi mondi
  assert.ok(cc.guadagno > 1.5 && cc.probabilita > 0.6, `guadagno ${cc.guadagno}`); tra(cc.probabilita, cc.guadagno / (1 + cc.guadagno) - 1e-12, cc.guadagno / (1 + cc.guadagno) + 1e-12, 'la probabilità dai pesi (a priori ½)');
  // la scelta segue i pesi: su molte etichette «stesso mondo» esce con la frequenza che i pesi dicono
  const N = 400; let stesso = 0; for (let k = 0; k < N; k++) if (causaComune(sale, { mondi: MONDI, etichetta: `coppia ${k}` }).scelta === 'stesso') stesso++;
  const f = stesso / N; assert.ok(Math.abs(f - cc.probabilita) < 4 * Math.sqrt((cc.probabilita * (1 - cc.probabilita)) / N), `stesso mondo ${f} delle volte contro ${cc.probabilita}`); assert.ok(f > 0.5);
  // e quando stanno insieme, il mondo scelto è più salato: due croste scelgono in proporzione a f², una sola a f
  const parte = (bolle, opz) => { let s = 0; for (let k = 0; k < 150; k++) { const r = incontra(bolle, { ...opz, mondi: MONDI, etichetta: `sale ${k}` }); assert.ok(r.esiste); s += r.bolle[0].giudizio.parte; } return s / 150; };
  const una = parte([sale[0]], {}), due = parte(sale, { insieme: 'pianeta' }); assert.ok(due > una, `il sale copre ${due} dei mondi scelti con due croste, ${una} con una`);
  // mare e ghiaccio: i mondi col mare hanno meno ghiaccio: i pesi dicono «separati»
  const mg = causaComune([{ contenuto: 'acqua liquida' }, { contenuto: 'ghiaccio' }], { mondi: MONDI }); assert.ok(mg.guadagno < 1 && mg.probabilita < 0.5);
  // un a priori diverso (parte della domanda) sposta la risposta come deve
  const raro = causaComune(sale, { mondi: MONDI, aPriori: 0.01 }); tra(raro.probabilita, (0.01 * cc.guadagno) / (0.01 * cc.guadagno + 0.99) - 1e-12, (0.01 * cc.guadagno) / (0.01 * cc.guadagno + 0.99) + 1e-12, 'con a priori 1%');
  console.log(`      (due croste di sale su ${cc.provati} mondi${cc.dubbi ? ` (${cc.dubbi} «forse» lasciati fuori: il sale dei mari chiusi lo sa la superficie)` : ''}: nello stesso mondo ${num(cc.stesso.peso)} ± ${num(cc.stesso.errore, 2)}, in due ${num(cc.separati.peso)} ± ${num(cc.separati.errore, 2)}: la causa comune pesa ${num(cc.guadagno)} volte di più → stesso mondo con probabilità ${num(cc.probabilita)}; su ${N} domande: ${num(f)})`);
  console.log(`      (il sale copre in media ${num(100 * una)}% del mondo scelto da una crosta, ${num(100 * due)}% di quello scelto da due; mare e ghiaccio: stesso mondo ${num(mg.guadagno)} volte «separati», probabilità ${num(mg.probabilita)})`);
});

// ---------- in fondo: la superficie vera (costa ~11 s a pianeta: solo se chiesto)
if (process.env.BOLLE_FONDO) {
  for (const cosa of ['crosta di sale', 'carbonato']) {
    const t0 = performance.now(), r = incontra([{ contenuto: cosa }], { mondi: MONDI }), cand = r.bolle[0].candidati || CO_candidati(cosa);
    const f = await inFondo({ contenuto: cosa }, cand, { massimo: Number(process.env.BOLLE_FONDO) > 1 ? Number(process.env.BOLLE_FONDO) : 4 });
    if (f.esiste) { const di = await inFondo(f.bolla); assert.ok(di.esiste && di.giudizio.esito === 'sì'); }
    console.log(`  ${f.esiste ? '✓' : '○'} in fondo, «${cosa}»: ${f.provati} superfici calcolate in ${num((performance.now() - t0) / 1000)} s → ${f.esiste ? `${f.bolla.luogo.percorso.join('/')}: ${f.giudizio.perche} (parte ${num(f.giudizio.parte)})` : 'nessuna'}${f.scartati.length ? `\n      scartati: ${f.scartati.map((s) => `${s.luogo}: ${s.perche}`).join('\n                ')}` : ''}`);
  }
} else console.log('  ○ la discesa alla superficie vera (croste di sale nei mari chiusi, carbonato che precipita: mare.js) non è in questa prova: costa ~11 s a pianeta. Si lancia con BOLLE_FONDO=1 node test/test_bolle.mjs');
// i candidati «forse» per la crosta di sale: i mondi col mare (la ricerca libera sceglie quelli già decisi, asciutti)
function CO_candidati(cosa) { const out = []; for (let k = 0; out.length < 8 && k < 40; k++) { const r = incontra([{ contenuto: 'acqua liquida' }], { mondi: MONDI, etichetta: `fondo ${k}` }), d = r.bolle[0].bolla.dove; if (giudica({ luogo: r.bolle[0].luogo.replace(/\/punto.*/, ''), contenuto: cosa }).esito === 'forse' && !out.some((x) => x.stella === d.stella && x.galassia === d.galassia && x.cosmo === d.cosmo && x.pianeta === d.pianeta)) out.push(d); } return out; }

console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
