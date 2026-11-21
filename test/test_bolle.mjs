// test_bolle.mjs — partire da una o più bolle (bolle.js; INTRECCIO.md regole 5, 11, 12):
//   A. il campo del cosmo condizionato a più punti (Hoffman e Ribak: esatto), con il peso del mondo vincolato;
//   B. che cosa chiede una bolla a chi le sta sopra, dove più bolle si incontrano, il mondo che le contiene.
// Con BOLLE_FONDO=1 si scende anche alla superficie vera (croste di sale, carbonato: ~11 s a pianeta).
import assert from 'node:assert/strict';
import { campoCondizionato, campoLibero, probabilitaChi2, RANGO, vincoliMassimo, PENDENZE, CONTENUTI, LIVELLI, GRAPPOLO, bolla, chiede, giudica, antenatoComune, incontra, causaComune, inFondo, chiedeAlCosmo, ridiscendiNelCosmo } from '../src/camera/bolle.js';
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

prova('il campo libero viene dalla fonte unica: un evento per onda; lo spettro è quello vero; un ramo cambia un\'onda sola; nel cosmo (senza bordo) un ramo cambia una cella sola e lascia le galassie dove sono', () => {
  // lo spettro: ⟨A² + B²⟩ = la potenza di ogni onda, sulle onde lunghe e sulle corte (ogni termine ha media 1 e scarto 1)
  const F = campoLibero('prova/bolle/spettro', { kmax: 24 }), conta = [[0, 0], [0, 0]];
  for (let m = 0; m < F.N; m++) { const q = F.KX[m] ** 2 + F.KY[m] ** 2 + F.KZ[m] ** 2 <= 144 ? 0 : 1; conta[q][0] += (F.A[m] ** 2 + F.B[m] ** 2) / F.PK[m]; conta[q][1]++; }
  for (const [somma, n] of conta) tra(somma / n, 1 - 4 / Math.sqrt(n), 1 + 4 / Math.sqrt(n), `potenza misurata / potenza vera su ${n} onde`);
  // un ramo su un'onda: cambia quella, e nessun'altra
  const r = 'prova/bolle/ramo', a = campoLibero(r, { kmax: 8 }), b = campoLibero(r, { kmax: 8, rami: { [`${r}/campo/onda 2,-1,3`]: 1 } }); let diverse = 0, quale = -1;
  for (let m = 0; m < a.N; m++) if (a.A[m] !== b.A[m] || a.B[m] !== b.B[m]) { diverse++; quale = m; } assert.equal(diverse, 1); assert.deepEqual([a.KX[quale], a.KY[quale], a.KZ[quale]], [2, -1, 3]);
  // in un cosmo della biblioteca (campo senza bordo: le celle sono gli eventi): il ramo di una cella lascia le galassie dove e
  // come sono viste dall'alto (posto, altezza del picco: la loro identità), cambia quella cella sola, e il campo passa ancora per tutte
  const n1 = 1, n2 = CO.cosmoRamo(1, 'cosmo 1/campo/livello 12/cella 1,1,1', 1), C1 = CO.cosmo(n1), C2 = CO.cosmo(n2), F1 = campoCosmo(n1), F2 = campoCosmo(n2);
  assert.deepEqual(C2.galassie.map((g) => [g.pos, g.peso]), C1.galassie.map((g) => [g.pos, g.peso])); assert.deepEqual(F2.pos, F1.pos);
  assert.notEqual(F2.libero.cella(12, 1, 1, 1), F1.libero.cella(12, 1, 1, 1)); for (const [a, b, c] of [[0, 1, 1], [1, 2, 1], [1, 1, 0]]) assert.equal(F2.libero.cella(12, a, b, c), F1.libero.cella(12, a, b, c)); assert.equal(F2.libero.cella(13, 2, 2, 2), F1.libero.cella(13, 2, 2, 2));
  let peggio = 0; F2.pos.forEach((x, i) => { peggio = Math.max(peggio, Math.abs(F2.densitaLunga(x) - F2.vincoli.valori[i])); }); assert.ok(peggio < 1e-9, `nel ramo le galassie distano dal loro picco ${peggio}`);
  const v1 = F1.motiGalassie(), v2 = F2.motiGalassie(); let dv = 0; v1.forEach((v, i) => { dv = Math.max(dv, Math.hypot(v[0] - v2[i][0], v[1] - v2[i][1], v[2] - v2[i][2])); }); assert.ok(dv > 0);
  console.log(`      (potenza misurata su quella vera: ${num(conta[0][0] / conta[0][1], 4)} sulle ${conta[0][1]} onde lunghe, ${num(conta[1][0] / conta[1][1], 4)} sulle ${conta[1][1]} corte; il ramo di una cella di 300 Mpc nel cosmo 1: ${C1.galassie.length} galassie ferme viste dall'alto, velocità spostate al più di ${num(dv)} km/s)`);
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
  for (let i = 0; i < 6; i++) { const x = [c(`cosmo/sonda ${i}/x`), c(`cosmo/sonda ${i}/y`), c(`cosmo/sonda ${i}/z`)]; d = Math.max(d, Math.abs(G0.in(x.map((v) => v * L)) - F0.densita(x))); }
  assert.ok(d === 0 && G0.gradi === 0 && G0.chi2 === 0 && G0.probabilita === 1 && G0.fissi === F0.pos.length, `senza bolle il campo differisce da cosmo3d di ${d}`);
  const V = punti(4, 'cosmo', 20 * MPC).map((p, i) => ({ ...p, valore: [0.3, -0.25, 0.1, 0.4][i] })), t1 = performance.now(), G = campoCondizionato(n, V), ms = performance.now() - t1;
  for (const v of G.vincoli) tra(Math.abs(G.lisciato(v.posizione, v.scala) - v.valore), -1, 1e-11, 'la bolla');
  // le galassie: il campo lisciato a R_eq vale ancora l'altezza del loro picco
  let dg = 0; F0.pos.forEach((x, i) => { dg = Math.max(dg, Math.abs(G.lisciato(x.map((v) => v * L), F0.vincoli.scala) - F0.vincoli.valori[i])); });
  assert.ok(dg < 1e-10, `le galassie si spostano dal loro picco di ${dg}`);
  // senza le galassie tra i vincoli, le stesse quattro bolle le sposterebbero
  assert.equal(campoCondizionato(n, V, { galassie: false }).fissi, 0);
  console.log(`      (cosmo ${n}: ${F0.pos.length} galassie, campo senza bordo; senza bolle ${num(ms0)} ms, uguale a cosmo3d (${num(d)}); con 4 bolle ${num(ms)} ms: χ² ${num(G.chi2)} su 4 date le galassie, probabilità ${num(G.probabilita)}, contro ${num(G.chi2Libero)} del cosmo com'era; le galassie restano sul loro picco entro ${num(dg)})`);
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
  // (il sistema: il primo della galassia 0, in ordine di stella, con un pianeta d'acqua liquida e uno di ghiaccio. Prima era la
  // stella 21 scritta a mano, che col modello di oggi ha solo ghiaccio)
  let sid = 0; while (sid < CO.STELLE && !(() => { const ps = CO.sistemaPigro(1, 0, sid).pianeti; return ps.some((p) => p.clima?.acqua === 'liquida') && ps.some((p) => p.clima?.acqua === 'ghiaccio'); })()) sid++;
  const sis = incontra([{ luogo: `cosmo 1/galassia 0/stella ${sid}`, contenuto: 'acqua liquida' }, { luogo: `cosmo 1/galassia 0/stella ${sid}`, contenuto: 'ghiaccio' }]);
  assert.ok(sis.esiste && sis.chiesto.livello === 'stella' && sis.ricerche.every((x) => x.esatto && x.frazione.errore === 0 && x.provati === CO.sistema(1, 0, sid).pianeti.length)); for (const e of sis.bolle) assert.equal(ridiscendi(e).esito, 'sì');
  console.log(`      (quattro bolle libere → ${r.mondi.length} mondi: ${r.bolle.map((e) => `${e.bolla.contenuto.cosa} in ${e.luogo.replace(/\/punto.*/, '')}`).join('; ')})\n      (mare e ghiaccio nello stesso pianeta: ${due.bolle.map((e) => e.luogo).join(' e ')} — ${mostra(due.ricerche[0])})\n      (nel sistema cosmo 1/galassia 0/stella ${sid}: ${sis.bolle.map((e) => `${e.bolla.contenuto.cosa} nel pianeta ${e.bolla.dove.pianeta}`).join(', ')})`);
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
  // (la prova chiede più di 100 mondi DECISI: quelli col mare restano «forse» — se una conca è arrivata al sale lo dice solo la
  // superficie — e quanti sono dipende dal catalogo: col disco nuovo 62 su 150. Si allarga il campione, raddoppiando, finché i decisi
  // bastano: lo stesso campione per tutte le domande sul sale qui sotto. Nessun seme scelto)
  const sale = [{ contenuto: 'crosta di sale' }, { contenuto: 'crosta di sale', grandezza: 2 }]; let MS = MONDI, cc = causaComune(sale, { mondi: MS });
  while (!(cc.provati > 100) && MS < 16 * MONDI) { MS *= 2; cc = causaComune(sale, { mondi: MS }); }
  assert.ok(cc.provati > 100 && cc.stesso.peso > 0 && cc.separati.peso > 0 && cc.stesso.errore > 0);
  // ⟨f²⟩ ≥ ⟨f⟩²: nello stesso mondo pesa di più, tanto più quanto più il sale è di pochi mondi
  assert.ok(cc.guadagno > 1.5 && cc.probabilita > 0.6, `guadagno ${cc.guadagno}`); tra(cc.probabilita, cc.guadagno / (1 + cc.guadagno) - 1e-12, cc.guadagno / (1 + cc.guadagno) + 1e-12, 'la probabilità dai pesi (a priori ½)');
  // la scelta segue i pesi: su molte etichette «stesso mondo» esce con la frequenza che i pesi dicono
  const N = 400; let stesso = 0; for (let k = 0; k < N; k++) if (causaComune(sale, { mondi: MS, etichetta: `coppia ${k}` }).scelta === 'stesso') stesso++;
  const f = stesso / N; assert.ok(Math.abs(f - cc.probabilita) < 4 * Math.sqrt((cc.probabilita * (1 - cc.probabilita)) / N), `stesso mondo ${f} delle volte contro ${cc.probabilita}`); assert.ok(f > 0.5);
  // e quando stanno insieme, il mondo scelto è più salato: due croste scelgono in proporzione a f², una sola a f
  // (in attesa: ⟨f³⟩/⟨f²⟩ ≥ ⟨f²⟩/⟨f⟩; qui si controlla entro l'errore del campione, perché il sale dei mondi asciutti copre quasi ovunque la stessa parte)
  const parte = (bolle, opz) => { let s = 0, q = 0; for (let k = 0; k < 150; k++) { const r = incontra(bolle, { ...opz, mondi: MS, etichetta: `sale ${k}` }); assert.ok(r.esiste); const f = r.bolle[0].giudizio.parte; s += f; q += f * f; } return { media: s / 150, errore: Math.sqrt(Math.max(0, q / 150 - (s / 150) ** 2) / 150) }; };
  const p1 = parte([sale[0]], {}), p2 = parte(sale, { insieme: 'pianeta' }), una = p1.media, due = p2.media; assert.ok(due > una - 4 * Math.hypot(p1.errore, p2.errore), `il sale copre ${due} dei mondi scelti con due croste, ${una} con una`);
  // mare e ghiaccio: i mondi col mare hanno meno ghiaccio: i pesi dicono «separati»
  const mg = causaComune([{ contenuto: 'acqua liquida' }, { contenuto: 'ghiaccio' }], { mondi: MONDI }); assert.ok(mg.guadagno < 1 && mg.probabilita < 0.5);
  // un a priori diverso (parte della domanda) sposta la risposta come deve
  const raro = causaComune(sale, { mondi: MS, aPriori: 0.01 }); tra(raro.probabilita, (0.01 * cc.guadagno) / (0.01 * cc.guadagno + 0.99) - 1e-12, (0.01 * cc.guadagno) / (0.01 * cc.guadagno + 0.99) + 1e-12, 'con a priori 1%');
  console.log(`      (due croste di sale su ${cc.provati} mondi${cc.dubbi ? ` (${cc.dubbi} «forse» lasciati fuori: il sale dei mari chiusi lo sa la superficie)` : ''}: nello stesso mondo ${num(cc.stesso.peso)} ± ${num(cc.stesso.errore, 2)}, in due ${num(cc.separati.peso)} ± ${num(cc.separati.errore, 2)}: la causa comune pesa ${num(cc.guadagno)} volte di più → stesso mondo con probabilità ${num(cc.probabilita)}; su ${N} domande: ${num(f)})`);
  console.log(`      (il sale copre in media ${num(100 * una)}% del mondo scelto da una crosta, ${num(100 * due)}% di quello scelto da due; mare e ghiaccio: stesso mondo ${num(mg.guadagno)} volte «separati», probabilità ${num(mg.probabilita)})`);
});

prova('bolle in galassie diverse si incontrano nel campo del cosmo: due a distanza data; peso cosmico esatto, peso planetario stimato; ridiscendendo tornano', () => {
  const due = [{ contenuto: 'acqua liquida' }, { contenuto: 'anello' }], lontano = incontra(due, { mondi: MONDI, nelCosmo: { distanza: 300 * MPC } });
  assert.ok(lontano.esiste && lontano.cosmo.esiste && lontano.cosmo.gradi === 2 && lontano.cosmo.galassie.length === 2 && lontano.pesi.cosmico.esatto && lontano.pesi.planetario.length === 2 && lontano.pesi.planetario.every((w) => w.valore > 0 && w.errore > 0));
  // ridiscendere: dal campo l'altezza del picco, dall'altezza la massa dell'alone, dalla galassia il pianeta e il contenuto
  const giu = ridiscendiNelCosmo(lontano); assert.ok(giu.every((x) => x.torna), JSON.stringify(giu)); for (const x of giu) { tra(x.massaAlone / x.massaChiesta, 1 - 1e-9, 1 + 1e-9, 'la massa dell\'alone dal picco'); assert.equal(x.contenuto, 'sì'); }
  // ciò che la bolla chiede al cosmo è ciò che galassie.js fa con quel picco: la massa dell'alone della galassia trovata
  for (const q of lontano.cosmo.richieste) { const [, n, g] = /cosmo (\S+)\/galassia (\d+)/.exec(q.galassia), G = CO.cosmo(/^\d+$/.test(n) ? Number(n) : n).galassie[Number(g)]; assert.equal(q.altezza, G.peso); tra(q.massaAlone / G.forma.alone.massa, 1 - 1e-9, 1 + 1e-9, 'la massa chiesta è quella dell\'alone'); assert.ok(/massaAlone/.test(q.legge)); }
  // il peso esatto: per due picchi è (v₁² + v₂² − 2ρ·v₁·v₂)/(σ²·(1 − ρ²)), con ρ la correlazione del campo filtrato a quella distanza
  const [q1, q2] = lontano.cosmo.richieste, base = campoLibero('prova/bolle/due picchi'), chi2A = (d) => { const p1 = [L / 2 - d / 2, L / 2, L / 2], p2 = [L / 2 + d / 2, L / 2, L / 2], a = campoCondizionato(base, [{ posizione: p1, scala: q1.scala, valore: 1 }]).attesa(p2, q1.scala), rho = a.media, s2 = a.libera; return { rho, chi2: (q1.valore ** 2 + q2.valore ** 2 - 2 * rho * q1.valore * q2.valore) / (s2 * (1 - rho * rho)), lontane: (q1.valore ** 2 + q2.valore ** 2) / s2 }; };
  const righe = [];
  for (const dMpc of [300, 120, 60, 30, 5, 0.5]) { const r = incontra(due, { mondi: MONDI, nelCosmo: { distanza: dMpc * MPC } }), t = chi2A(dMpc * MPC); assert.ok(r.esiste); tra(r.cosmo.chi2 / t.chi2, 1 - 1e-7, 1 + 1e-7, `χ² a ${dMpc} Mpc contro la formula`); tra(r.cosmo.chi2Lontane / t.lontane, 1 - 1e-9, 1 + 1e-9, 'χ² da lontane'); assert.ok(ridiscendiNelCosmo(r).every((x) => x.torna));
    // i mondi delle bolle sono gli stessi a ogni distanza (la domanda è la stessa): cambia solo il cosmo che li contiene
    assert.deepEqual(r.mondi, lontano.mondi); righe.push(`${dMpc} Mpc: ρ ${num(t.rho)}, χ² ${num(r.cosmo.chi2, 4)}, probabilità ${num(r.cosmo.probabilita)}`); }
  // A DISTANZA LIBERA (dove capita: quasi sempre lontane) pesa più che a distanza forzata piccola: due galassie diverse a
  // mezzo megaparsec chiedono allo stesso punto del campo filtrato due altezze diverse
  const libero = incontra(due, { mondi: MONDI, nelCosmo: 'libero' }), stretto = incontra(due, { mondi: MONDI, nelCosmo: { distanza: 0.5 * MPC } }), dnu = Math.abs(q1.altezza - q2.altezza);
  assert.ok(libero.esiste && stretto.esiste && ridiscendiNelCosmo(libero).every((x) => x.torna)); tra(libero.cosmo.chi2 / libero.cosmo.chi2Lontane, 0.5, 1.5, 'a distanza libera pesano quasi ognuna per conto suo');
  if (dnu > 0.01) { assert.ok(stretto.cosmo.chi2 > libero.cosmo.chi2 && stretto.cosmo.logDensita < libero.cosmo.logDensita && stretto.cosmo.probabilita < libero.cosmo.probabilita, `χ² ${stretto.cosmo.chi2} a mezzo Mpc contro ${libero.cosmo.chi2} libere`); }
  else console.log(`      NON TORNA (qui): le due galassie trovate hanno picchi alti uguali entro ${num(dnu)} scarti: a mezzo megaparsec il campo non le distingue da una sola`);
  // nello stesso punto esatto, con altezze diverse: non esiste, e lo dice
  const sopra = incontra(due, { mondi: MONDI, nelCosmo: { distanza: 0 } }); if (dnu > 1e-6) assert.ok(!sopra.esiste && /stesso punto/.test(sopra.perche) && /altezza diversa/.test(sopra.perche), sopra.perche);
  // CHE COSA DICONO I PESI a distanze di mezzo: due picchi dello stesso segno a qualche decina di Mpc costano MENO che
  // lontani (ρ > 0): è l'ammassarsi delle galassie. Vale quando 2ρ·v₁·v₂ > ρ²·(v₁² + v₂²), e solo allora
  for (const dMpc of [60, 30]) { const t = chi2A(dMpc * MPC), conviene = 2 * t.rho * q1.valore * q2.valore > t.rho ** 2 * (q1.valore ** 2 + q2.valore ** 2); assert.equal(t.chi2 < t.lontane, conviene); }
  const t60 = chi2A(60 * MPC);
  console.log(`      (${lontano.bolle.map((e, i) => `${e.bolla.contenuto.cosa} in ${e.luogo.replace(/\/punto.*/, '')}: picco di ${num(lontano.cosmo.richieste[i].altezza)} scarti, alone di ${num(lontano.cosmo.richieste[i].massaAlone)} M☉`).join('; ')})\n      (peso planetario stimato: ${lontano.pesi.planetario.map((w) => `${num(w.valore)} ± ${num(w.errore, 2)}`).join(' e ')}; peso cosmico esatto, due galassie a:  ${righe.join(';  ')})`);
  console.log(`      (libere: χ² ${num(libero.cosmo.chi2, 4)}, densità e^${num(libero.cosmo.logDensita)}; a 0,5 Mpc: χ² ${num(stretto.cosmo.chi2, 4)}, densità e^${num(stretto.cosmo.logDensita)}; nello stesso punto: ${sopra.esiste ? 'esiste' : 'non esiste'}. A 60 Mpc costano ${t60.chi2 < t60.lontane ? 'MENO' : 'più'} che lontane (${num(t60.chi2, 4)} contro ${num(t60.lontane, 4)}): ${t60.chi2 < t60.lontane ? 'le galassie si ammassano; «libero pesa di più» vale solo sotto qualche megaparsec' : 'con queste altezze non conviene'})`);
});

prova('dieci bolle in dieci galassie a posti dati: un cosmo solo le contiene tutte, con il suo peso; due galassie di un cosmo della biblioteca: il peso dei loro picchi lì', () => {
  const cose = ['ghiaccio', 'aurora', 'anello', { cosa: 'minerale', nome: 'quarzo' }, 'acqua liquida'], dieci = Array.from({ length: 10 }, (_, i) => ({ grandezza: 1 + Math.floor(i / 5), contenuto: cose[i % 5] }));
  // dieci posti dentro un cubo di 500 Mpc, a caso (eventi della prova), lontani tra loro almeno 60 Mpc
  const posti = []; for (let k = 0; posti.length < 10 && k < 500; k++) { const p = ['x', 'y', 'z'].map((a) => L / 2 + 500 * MPC * (c(`dieci/${k}/${a}`) - 0.5)); if (posti.every((q) => distanza(p, q) > 60 * MPC)) posti.push(p); }
  const t0 = performance.now(), r = incontra(dieci, { mondi: MONDI, nelCosmo: { posizioni: posti } }), ms = performance.now() - t0; assert.ok(r.esiste, r.perche);
  assert.ok(r.cosmo.gradi === 10 && r.cosmo.galassie.length === 10 && new Set(r.bolle.map((e) => `${e.bolla.dove.cosmo}/${e.bolla.dove.galassia}`)).size === 10 && r.pesi.planetario.length === 10);
  const giu = ridiscendiNelCosmo(r); assert.ok(giu.every((x) => x.torna), JSON.stringify(giu.filter((x) => !x.torna))); r.cosmo.richieste.forEach((q, i) => assert.deepEqual(q.posizione, posti[i]));
  tra(r.cosmo.probabilita, 0, 1 + 1e-12, 'la probabilità del χ² cosmico'); assert.ok(r.cosmo.chi2 > 0 && Number.isFinite(r.cosmo.logDensita)); tra(r.cosmo.chi2 / r.cosmo.chi2Lontane, 0.3, 3, 'dieci picchi a decine e centinaia di Mpc: non lontano dalla somma di ognuno');
  // la stessa domanda, lo stesso cosmo; i posti in un altro ordine, con le bolle nello stesso ordine: un altro cosmo, stesso tipo di peso
  const ancora = incontra(dieci, { mondi: MONDI, nelCosmo: { posizioni: posti } }); assert.equal(ancora.cosmo.chi2, r.cosmo.chi2); assert.deepEqual(ancora.bolle.map((e) => e.luogo), r.bolle.map((e) => e.luogo));
  // il campo trovato è un campo intero: lo si può interrogare ovunque, e lontano dalle dieci galassie è quello libero
  const F = r.cosmo.campo, fuori = [L * 0.05, L * 0.05, L * 0.05]; assert.ok(posti.every((p) => distanza(p, fuori) > 250 * MPC)); tra(Math.abs(F.in(fuori) - F.libero(fuori)) / F.sigma, -1, 0.05, 'lontano dalle dieci galassie');
  // due galassie di uno stesso cosmo della biblioteca: i posti sono i loro, il peso è quello dei loro picchi lì
  const dentro = incontra([{ luogo: 'cosmo 1/galassia 0', contenuto: 'ghiaccio' }, { luogo: 'cosmo 1/galassia 3', contenuto: 'aurora' }], { mondi: GRAPPOLO });
  assert.ok(dentro.esiste && dentro.chiesto.livello === 'cosmo' && dentro.cosmo && dentro.cosmo.daBiblioteca === 1 && dentro.cosmo.gradi === 2 && ridiscendiNelCosmo(dentro).every((x) => x.torna));
  const F1 = campoCosmo(1); dentro.cosmo.richieste.forEach((q, i) => assert.deepEqual(q.posizione, F1.pos[[0, 3][i]].map((x) => x * L))); tra(dentro.cosmo.chi2, 0, 100, 'χ² dei due picchi nel cosmo 1');
  console.log(`      (dieci bolle → dieci galassie di ${new Set(r.bolle.map((e) => e.bolla.dove.cosmo)).size} cosmi d'origine, picchi da ${num(Math.min(...r.cosmo.richieste.map((q) => q.altezza)))} a ${num(Math.max(...r.cosmo.richieste.map((q) => q.altezza)))} scarti; ${num(ms / 1000)} s; peso cosmico: χ² ${num(r.cosmo.chi2, 4)} su 10 (lontane: ${num(r.cosmo.chi2Lontane, 4)}), probabilità ${num(r.cosmo.probabilita)}, densità e^${num(r.cosmo.logDensita)}; pesi planetari da ${num(Math.min(...r.pesi.planetario.map((w) => w.valore)))} a ${num(Math.max(...r.pesi.planetario.map((w) => w.valore)))})`);
  console.log(`      (nel cosmo 1, galassie 0 e 3 (picchi di ${dentro.cosmo.richieste.map((q) => num(q.altezza)).join(' e ')} scarti, a ${num(distanza(dentro.cosmo.richieste[0].posizione, dentro.cosmo.richieste[1].posizione) / MPC)} Mpc): χ² ${num(dentro.cosmo.chi2, 4)} su 2, probabilità ${num(dentro.cosmo.probabilita)})`);
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

console.log('C. la forma di un vincolo');
prova('un vincolo con una forma lineare qualunque: la forma 1 è la densità di sempre; l\'ordine non conta; «è un massimo» è l\'altezza più tre pendenze nulle (regola 12)', () => {
  const base = campoLibero('prova/bolle/forme', { kmax: 12 }), R = 40 * MPC, uno = (kx, ky, kz, k2, out) => { out[0] = 1; out[1] = 0; return out; };
  // (1) la forma che vale 1 è il vincolo di densità: stesse ampiezze, stesso χ²
  const p0 = punti(1, 'forma uno', R)[0], senza = campoCondizionato(base, [{ ...p0, valore: 0.4 }]), con = campoCondizionato(base, [{ ...p0, valore: 0.4, forma: uno }]); let d = 0; for (let m = 0; m < base.N; m++) d = Math.max(d, Math.abs(senza.onde.A[m] - con.onde.A[m]), Math.abs(senza.onde.B[m] - con.onde.B[m]));
  assert.ok(d < 1e-15 && Math.abs(senza.chi2 - con.chi2) < 1e-12 && con.gradi === 1, `forma 1 e densità differiscono di ${d}`);
  // la stessa cosa chiesta due volte, con e senza forma: è lo stesso vincolo (uno è di troppo); con valori diversi non esiste
  const doppio = campoCondizionato(base, [{ ...p0, valore: 0.4 }, { ...p0, valore: 0.4, forma: uno }]); assert.ok(doppio.esiste && doppio.gradi === 1 && doppio.ridondanti.length === 1); assert.equal(campoCondizionato(base, [{ ...p0, valore: 0.4 }, { ...p0, valore: 0.5, forma: uno }]).esiste, false);
  // (2) sei punti: ognuno un massimo alto 2,5 scarti del campo lisciato. χ² = 2,5² per punto se sono lontani (le pendenze
  // nulle nello stesso punto non costano: pendenza e altezza non sono correlate), l'ordine dei vincoli non conta
  const P = punti(6, 'massimi', R), sR = Math.sqrt(campoCondizionato(base, []).attesa(P[0].posizione, R).libera), V = P.flatMap((p) => vincoliMassimo({ ...p, valore: 2.5 * sR }));
  const t0 = performance.now(), F = campoCondizionato(base, V), ms = performance.now() - t0, G = campoCondizionato(base, [...V].reverse()); assert.ok(F.esiste && F.gradi === 24 && F.ridondanti.length === 0);
  for (let m = 0; m < base.N; m += 7) assert.ok(F.onde.A[m] === G.onde.A[m] && F.onde.B[m] === G.onde.B[m], 'l\'ordine dei vincoli non conta, bit per bit'); assert.equal(F.chi2, G.chi2);
  const solo = campoCondizionato(base, P.map((p) => ({ ...p, valore: 2.5 * sR }))); let pend = 0, pendSolo = 0, massimi = 0, massimiSolo = 0; const h = 4 * MPC, hd = 0.5 * MPC;
  const eMassimo = (C, p) => { const c0 = C.lisciato(p, R); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if ((i || j || k) && C.lisciato([p[0] + i * h, p[1] + j * h, p[2] + k * h], R) > c0) return false; return true; };
  for (const p of P) { assert.ok(Math.abs(F.lisciato(p.posizione, R) - 2.5 * sR) < 1e-9);
    for (let dd = 0; dd < 3; dd++) { const q = [...p.posizione]; q[dd] += hd; const su = F.lisciato(q, R), suS = solo.lisciato(q, R); q[dd] -= 2 * hd; pend = Math.max(pend, Math.abs(su - F.lisciato(q, R)) / sR); pendSolo = Math.max(pendSolo, Math.abs(suS - solo.lisciato(q, R)) / sR);
      assert.ok(Math.abs(F.misura(p.posizione, PENDENZE[dd], R)) < 1e-9, 'la pendenza misurata nel punto è nulla'); const at = F.attesa(p.posizione, R, null, PENDENZE[dd]); assert.ok(Math.abs(at.media) < 1e-9 && at.varianza < 1e-9 * at.libera, 'e la teoria non le lascia incertezza'); }
    if (eMassimo(F, p.posizione)) massimi++; if (eMassimo(solo, p.posizione)) massimiSolo++; }
  // (alle differenze finite resta il termine di terz'ordine, ~(passo/R)² di una pendenza tipica)
  assert.ok(pend < 3 * (hd / R) ** 2 * pendSolo, `la pendenza (differenze finite) è nulla: ${pend} contro ${pendSolo} senza il vincolo`);
  tra(F.chi2 / (6 * 6.25), 0.8, 1.25, 'χ² dei sei massimi su 6·2,5² (punti a caso sul toro: quasi indipendenti)'); assert.ok(Math.abs(F.chi2 - solo.chi2) < 0.05 * solo.chi2, 'le pendenze nulle costano poco o niente');
  assert.ok(massimi >= 3, 'un picco alto 2,5 scarti con pendenza nulla è quasi sempre un massimo'); const lib = F.liberta(); assert.equal(lib.gradiFissati, 24); tra(lib.varianzaLibera, 0.9, 1, 'la varianza che resta libera');
  console.log(`      (sei punti alti 2,5 scarti a ${num(R / MPC)} Mpc: con le pendenze nulle sono massimi ${massimi} su 6 e la pendenza è ${num(pend)} scarti su 1 Mpc; con la sola altezza ${massimiSolo} su 6 e ${num(pendSolo)}; χ² ${num(F.chi2)} contro ${num(solo.chi2)}; 24 vincoli in ${num(ms)} ms; varianza libera ${(100 * lib.varianzaLibera).toFixed(2)}%)`);
  // (3) le galassie di due bolle chieste come punti fermi del campo (incontra, nelCosmo con massimi)
  const due = [{ contenuto: 'acqua liquida' }, { contenuto: 'anello' }], r = incontra(due, { mondi: MONDI, nelCosmo: { distanza: 300 * MPC, massimi: true } }), r0 = incontra(due, { mondi: MONDI, nelCosmo: { distanza: 300 * MPC } });
  assert.ok(r.esiste && r.cosmo.gradi === 8 && r0.cosmo.gradi === 2); for (const q of r.cosmo.richieste) for (let dd = 0; dd < 3; dd++) assert.ok(Math.abs(r.cosmo.campo.misura(q.posizione, PENDENZE[dd], q.scala)) < 1e-9); assert.ok(ridiscendiNelCosmo(r).every((x) => x.torna));
  console.log(`      (due bolle in due galassie a 300 Mpc: χ² ${num(r0.cosmo.chi2)} con le sole altezze, ${num(r.cosmo.chi2)} chiedendole come punti fermi del campo filtrato; ridiscendendo tornano)`);
});

console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
