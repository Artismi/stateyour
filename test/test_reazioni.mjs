// test_reazioni.mjs — LAVORO 10 di PROGETTO.md: LA CHIMICA CHE SI MUOVE DA SÉ (src/camera/reazioni.js).
//
// La regola zero applicata alla chimica di un luogo: la rete generata dalle regole di molecole_reazioni.js, le energie di
// molecole_energia.js, il bilancio dettagliato locale, Gillespie con gli eventi del luogo (eventi.js), i flussi dal bordo.
//   A. CONSERVAZIONI ESATTE: C, N, S, P, H − 2O e carica, numeri interi, prima e dopo (chiuso; e col bordo: + ciò che è
//      entrato − ciò che è uscito);
//   B. BILANCIO DETTAGLIATO: k₊/k₋ = exp(−Δg) con la tabella delle energie, per ogni reazione della rete; i NON TORNA
//      (le condensazioni con un ΔG misurato diverso dalla tabella) si stampano;
//   C. RILASSAMENTO A GIBBS: senza flussi la scatola va all'equilibrio — la media nel tempo contro la media ESATTA della
//      distribuzione stazionaria (Anderson, Craciun e Kurtz 2010) e contro il minimo dell'energia di Gibbs; la produzione
//      d'entropia a regime è zero;
//   D. DETERMINISMO PER INDIRIZZO: lo stesso indirizzo dà la stessa storia bit per bit; un altro, un'altra; i tiri annotati;
//   E. STATO STAZIONARIO CON I FLUSSI: serbatoi con potenziali incompatibili → produzione d'entropia positiva; serbatoi
//      all'equilibrio → zero; i cicli di bagnato e secco;
//   F. RAF: un caso costruito con la risposta nota (Hordijk e Steel); il formosio con il seme di glicolaldeide (il ciclo di
//      Breslow è un RAF di ciò che la rete fa); la sola formaldeide (nessun legame C–C nelle regole: nessun RAF);
//   G. EVENTI RARI: forward flux sampling contro il tempo di primo passaggio esatto di una nascita-e-morte;
//   H. I PORI DELLA CROSTA (il primo pianeta roccioso del catalogo con calore e crosta): Athy, il gradiente geotermico,
//      l'H₂ della serpentinizzazione e della radiolisi, il CO₂; la chimica che si muove lì e che cosa la rilevazione vede;
//   I. IL COSTO.
// LE TOLLERANZE, dichiarate prima: 4 scarti (p = 6,3·10⁻⁵, come test_coerenza_scale) per le medie nel tempo (scarto delle
// medie a 20 blocchi; per un insieme che nella parte misurata non si muove mai, lo scarto della stazionaria esatta: è un
// campione solo), per la produzione d'entropia e per il forward flux sampling (l'errore binomiale delle prove e di
// Poisson del flusso); la precisione aritmetica (un exp e un log: 64·ε·max(1, |Δg|)) per il bilancio dettagliato; ZERO per
// le conservazioni e il determinismo. La differenza tra la media di pochi numeri e l'equilibrio delle concentrazioni (il
// termine d'ordine Ω⁰ dell'espansione nel sistema, van Kampen) si stampa: è ciò che separa C dalla media esatta.
// Nessun seme: gli indirizzi sono nomi del luogo, i pianeti i primi del catalogo che hanno ciò che serve.
import assert from 'node:assert/strict';
import * as X from '../src/camera/reazioni.js';
import { sorgente, conRegistro } from '../src/camera/eventi.js';
import * as CO from '../src/camera/cosmo.js';

const T0 = performance.now(); let ok = 0; const tempi = [], nonTorna = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; tempi.push([nome.slice(0, 60), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const EPS = 2 ** -52, QUATTRO = 4;

// i luoghi di prova: la chimica di Strecker (formaldeide, ammoniaca e un po' di acido cianidrico a pH 9) e il formosio
const STRECKER = { indirizzo: 'prova/strecker', T: 298.15, pH: 9, molecole: { 'C=O': 0.01, N: 0.01, 'C#N': 0.001 } };
const FORMOSIO = { indirizzo: 'prova/formosio', T: 298.15, pH: 11, molecole: { 'C=O': 1, 'OCC=O': 1e-3 }, cibo: ['C=O'] };
const Om = 1e4, V = Om / X.NA / 1e3; // (una scatola di 10⁴ molecole per mol/L: 100 di ciascuna specie a 10 mM — un cubo di 32 nm)
let t = performance.now();
const SS = X.sistema(STRECKER, { profondita: 2, atomiMassimi: 4 }), msStrecker = performance.now() - t; t = performance.now();
const SF = X.sistema(FORMOSIO, { profondita: 5, atomiMassimi: 8 }), msFormosio = performance.now() - t;
console.log(`Strecker: ${SS.chiavi.length} specie, ${SS.reazioni.length} reazioni (${SS.nonTorna.doppie} trovate da due regole), ${num(msStrecker)} ms; formosio: ${SF.chiavi.length} specie, ${SF.reazioni.length} reazioni, ${SF.nonTorna.pozzi} pozzi senza prodotti fuori dalla dinamica chiusa, ${num(msFormosio)} ms`);
const c0 = (S) => { const c = new Float64Array(S.chiavi.length); for (const k of Object.keys(S.rete.partenza)) if (S.idx.has(k)) c[S.idx.get(k)] = S.rete.partenza[k]; return c; };
// il tempo guardato per la prova di Gibbs: 10 s; le reazioni che si muovono in 10 s sono un sottosistema con il suo equilibrio
const TAU = 10, AT = X.attiveNelTempo(SS, c0(SS), TAU, { Om }), SUB = X.soltanto(SS, AT.attive);
console.log(`in ${TAU} s si muovono ${AT.attive.length} reazioni su ${SS.reazioni.length} (separazione dalle ferme: ${num(AT.separazione)}): ${AT.attive.map((j) => SS.reazioni[j].chiave).join('; ')}`);

// =====================================================================================================================
console.log('A. le conservazioni');
prova('una storia chiusa conserva C, N, S, P, H − 2O e la carica esattamente (il formosio intero, 5·10⁴ eventi; Strecker)', () => {
  for (const [nome, S] of [['formosio', SF], ['Strecker', SS]]) {
    const st = X.storia(S, { V: nome === 'formosio' ? 300 / X.NA / 1e3 : V, tempo: 1e6, massimo: 5e4 }), a = X.conservate(S, st.motore, st.N0), b = X.conservate(S, st.motore, st.N);
    for (const e in a) assert.equal(b[e], a[e], `${nome}: ${e}`);
    console.log(`      ${nome}: ${st.eventi} eventi in ${num(st.t)} s, ${st.attive.length} reazioni attive; ${Object.entries(a).filter(([, v]) => v).map(([e, v]) => `${e} ${v}`).join(', ')} prima e dopo`);  }
});
prova('col bordo: dopo = prima + entrate − uscite, specie per specie (la stessa contabilità, esatta)', () => {
  const fl = { tenute: { 'C=O': 0.01, N: 0.01, 'C(N)O': 1e-4 }, ricambio: 1 }, st = X.storia(SUB, { V, tempo: 50, massimo: 2e5, media: true, flussi: fl }), M = st.motore;
  const a = X.conservate(SUB, M, st.N0), b = X.conservate(SUB, M, st.N), atteso = { ...a };
  M.canali.forEach((ch, c) => { if (ch.bordo == null) return; const s = ch.verso > 0 ? 1 : -1, i = ch.bordo; for (const e of ['C', 'N', 'S', 'P', 'H-2O']) atteso[e] += s * st.perCanale[c] * SUB.contenuto[i][e]; atteso.carica += s * st.perCanale[c] * SUB.q[i]; });
  for (const e in a) assert.equal(b[e], atteso[e], e);
  console.log(`      ${st.bordo.entrate} entrate e ${st.bordo.uscite} uscite: C ${a.C} → ${b.C}, N ${a.N} → ${b.N}, H − 2O ${a['H-2O']} → ${b['H-2O']}`);
});

// =====================================================================================================================
console.log('B. il bilancio dettagliato');
prova('k₊/k₋ = exp(−Δg) con la tabella delle energie, per ogni reazione (precisione: 64·ε·max(1, |Δg|))', () => {
  for (const [nome, S] of [['formosio', SF], ['Strecker', SS]]) { let peggio = 0;
    const g = S.g(); for (const x of S.reazioni) { let dg = 0; for (const i of x.pr) dg += g[i]; for (const i of x.re) dg -= g[i]; const d = Math.abs(Math.log(x.kp1 / x.km1) + dg) / Math.max(1, Math.abs(dg)); peggio = Math.max(peggio, d); }
    assert.ok(peggio <= 64 * EPS, `${nome}: ${peggio}`);
    console.log(`      ${nome}: lo scarto più grande ${num(peggio)} (tolleranza ${num(64 * EPS)}); la regola dava un altro rapporto in ${S.nonTorna.energie.length} reazioni`);
    for (const z of S.nonTorna.energie) nonTorna.push(`${nome}: ${z.reagenti.join(' + ')} → ${z.prodotti.join(' + ')} (${z.tipo}, classe misurata ${z.misurato ?? '—'}): ΔG della regola e della tabella differiscono di ${num(z.scartoRT)} RT — vale la tabella (Wegscheider)`); }
});

// =====================================================================================================================
console.log('C. senza flussi: il rilassamento all\'equilibrio di Gibbs');
prova(`la scatola di Strecker lasciata andare (${AT.attive.length} reazioni, Ω = 10⁴): media nel tempo = media esatta della stazionaria entro 4 scarti; produzione d'entropia zero entro 4 scarti`, () => {
  const st = X.storia(SUB, { V, tempo: 300, massimo: 2e6, media: true }), M = st.motore, P = M.ins.P;
  // l'equilibrio di Gibbs con le conservazioni delle reazioni che si muovono, dagli stessi numeri iniziali
  const n0 = new Float64Array(SS.chiavi.length); for (let p = 0; p < P; p++) n0[M.ins.membri[p][0]] = st.N0[p];
  const eq = X.equilibrio(SUB, n0.map((x) => x / M.Om)), Cp = Float64Array.from({ length: P }, (_, p) => M.ins.membri[p].reduce((s, i) => s + eq.c[i], 0)), es = X.stazionariaEsatta(M, st.N0, Cp);
  assert.ok(eq.converge && es.completo, 'Gibbs converge e gli stati sono contati tutti');
  let peggioZ = 0, peggioO = 0;
  for (let p = 0; p < P; p++) { const ssa = st.medie[p], ex = es.medie[p], gi = Cp[p] * M.Om; if (ex < 0.5 && ssa < 0.5) continue; const z = Math.abs(ssa - ex) / (st.errori[p] > 0 ? st.errori[p] : Math.max(es.scarti[p], 1e-300));
    console.log(`      ${M.ins.membri[p].map((i) => SS.chiavi[i]).join(' ⇌ ').padEnd(26)} Gibbs ${num(gi, 5).padStart(8)}  esatta ${num(ex, 5).padStart(8)}  scatola ${num(ssa, 5).padStart(8)} ± ${num(st.errori[p], 2)}`);
    // (un insieme che nella parte misurata non si è mai mosso è un campione solo della stazionaria: la tolleranza è il suo scarto)
    const tol = QUATTRO * (st.errori[p] > 0 ? st.errori[p] : es.scarti[p]); assert.ok(Math.abs(ssa - ex) <= tol, `insieme ${p}: ${ssa} contro ${ex} ± ${tol / QUATTRO}`); peggioZ = Math.max(peggioZ, z); peggioO = Math.max(peggioO, Math.abs(ex - gi)); }
  const ep = st.entropia; assert.ok(Math.abs(ep.perSecondo) <= QUATTRO * ep.errore, `entropia ${ep.perSecondo} ± ${ep.errore}`);
  console.log(`      ${st.eventi} eventi, ${es.stati} stati della stazionaria; il peggiore a ${num(peggioZ)} scarti; media esatta − Gibbs fino a ${num(peggioO)} molecole (l'ordine Ω⁰); produzione d'entropia ${num(ep.perSecondo)} ± ${num(ep.errore)} k_B/s`);
});

// =====================================================================================================================
console.log('D. il determinismo per indirizzo');
prova('lo stesso indirizzo dà la stessa storia bit per bit; un altro indirizzo un\'altra; i tiri sono due eventi del luogo, annotati', () => {
  const a = X.storia(SUB, { V, tempo: 20, massimo: 3e4 }), b = X.storia(SUB, { V, tempo: 20, massimo: 3e4 }), c = X.storia(X.soltanto({ ...SS, luogo: { ...SS.luogo, indirizzo: 'prova/strecker bis' } }, AT.attive), { V, tempo: 20, massimo: 3e4 });
  assert.equal(a.t, b.t); assert.equal(a.eventi, b.eventi); assert.deepEqual([...a.N], [...b.N]); assert.deepEqual([...a.perCanale], [...b.perCanale]); assert.deepEqual([...a.N0], [...b.N0]);
  assert.ok(a.t !== c.t || a.eventi !== c.eventi || [...a.N].some((x, i) => x !== c.N[i]), 'un altro indirizzo, un\'altra storia');
  const reg = new Map(), leggi = new Map(), d = X.storia(SUB, { V, tempo: 20, massimo: 3e4, caso: conRegistro(sorgente('prova/strecker/chimica'), reg, leggi) });
  assert.equal(d.t, a.t); assert.deepEqual([...d.N], [...a.N]);
  const quando = [...reg.keys()].filter((k) => k.includes('/quando')).length, quale = [...reg.keys()].filter((k) => k.includes('/quale')).length;
  assert.ok(quando >= d.eventi && quale >= d.eventi && [...leggi.values()].every((v) => v.legge === 'uniforme'));
  console.log(`      ${a.eventi} eventi uguali al bit; con il registro: ${quando} tiri «quando» e ${quale} «quale» (uniformi: le leggi esponenziale e discreta sono dichiarate in LEGGI_DEI_TIRI), ${reg.size - quando - quale} per la scatola`);
});

// =====================================================================================================================
console.log('E. con i flussi: lo stato stazionario fuori equilibrio');
prova('formaldeide e ammoniaca tenute a 10 mM, l\'emiamminale portato a 0,1 mM: produzione d\'entropia positiva oltre 4 scarti; serbatoi all\'equilibrio: zero entro 4 scarti', () => {
  const fl = { tenute: { 'C=O': 0.01, N: 0.01, 'C(N)O': 1e-4 }, ricambio: 1 }, st = X.storia(SUB, { V, tempo: 400, massimo: 4e6, media: true, flussi: fl }), ep = st.entropia;
  assert.ok(ep.perSecondo > QUATTRO * ep.errore, `${ep.perSecondo} ± ${ep.errore}`);
  // il controllo: i serbatoi alle concentrazioni dell'equilibrio della scatola chiusa (potenziali compatibili)
  const M0 = X.motore(SUB, { V, risoluzione: 0.04 }), n0 = new Float64Array(SS.chiavi.length); const sc = X.scatola(SUB, M0, { media: true }); for (let p = 0; p < M0.ins.P; p++) n0[M0.ins.membri[p][0]] = sc.insiemi[p];
  const eq = X.equilibrio(SUB, n0.map((x) => x / M0.Om)).c, fl0 = { tenute: Object.fromEntries(['C=O', 'N', 'C(N)O'].map((k) => [k, eq[SS.idx.get(k)]])), ricambio: 1 };
  const s0 = X.storia(SUB, { V, tempo: 400, massimo: 4e6, media: true, flussi: fl0 }), e0 = s0.entropia;
  assert.ok(Math.abs(e0.perSecondo) <= QUATTRO * e0.errore, `controllo: ${e0.perSecondo} ± ${e0.errore}`);
  const j = SS.reazioni.findIndex((x) => x.chiave === 'C=O + N → C(N)O'), jj = SUB.reazioni.indexOf(SS.reazioni[j]), netto = jj >= 0 ? (st.perReazione[2 * jj] - st.perReazione[2 * jj + 1]) / st.t : NaN;
  console.log(`      fuori equilibrio: ${num(ep.perSecondo)} ± ${num(ep.errore)} k_B/s (${st.eventi} eventi, C=O + N → C(N)O netta ${num(netto)} al secondo); all'equilibrio: ${num(e0.perSecondo)} ± ${num(e0.errore)}`);
});
prova('i cicli di bagnato e secco (l\'attività dell\'acqua a fasi): la scatola chiusa non sta ferma e produce entropia oltre 4 scarti', () => {
  // (fasi di mezzo secondo, più lunghe del rilassamento dell'immina — 17 1/s —: a ogni cambio la scatola è all'equilibrio
  // della fase prima, e rilassando a quello nuovo dissipa la divergenza tra le due stazionarie)
  const st = X.storia(SUB, { V, tempo: 200, massimo: 4e6, media: true, risoluzione: 1e-3, fasi: [{ durata: 0.5, attivitaAcqua: 1 }, { durata: 0.5, attivitaAcqua: 0.3 }] }), ep = st.entropia;
  assert.ok(ep.perSecondo > QUATTRO * ep.errore, `${ep.perSecondo} ± ${ep.errore}`);
  const a = X.conservate(SUB, st.motore, st.N0), b = X.conservate(SUB, st.motore, st.N); for (const e in a) assert.equal(b[e], a[e]);
  console.log(`      fasi di 0,5 s (attività dell'acqua 1 e 0,3): ${num(ep.perSecondo)} ± ${num(ep.errore)} k_B/s, ${st.eventi} eventi; atomi conservati`);
});

// =====================================================================================================================
console.log('F. la rilevazione: insiemi RAF');
prova('un caso costruito con la risposta nota (Hordijk e Steel): il massimo RAF è {r1, r2}', () => {
  const R = [{ re: ['a', 'b'], pr: ['c'], cat: ['d'] }, { re: ['c', 'a'], pr: ['d'], cat: ['c'] }, { re: ['d'], pr: ['e'], cat: ['f'] }, { re: ['c', 'e'], pr: ['g'], cat: ['a'] }, { re: ['h'], pr: ['c'], cat: ['a'] }];
  const r = X.maxRAF(R, ['a', 'b']); assert.deepEqual(r.reazioni, [0, 1]); assert.deepEqual(r.chiusura.sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual(X.maxRAF(R.slice(1), ['a', 'b']).reazioni, [], 'senza r1 niente si regge');
});
let rilFormosio = null;
prova('il formosio con un millesimo di glicolaldeide: un ciclo autocatalitico e un RAF di ciò che la rete fa; la sola formaldeide: niente', () => {
  rilFormosio = X.rileva(SF, null, { tempoCicli: 20000, cicliMassimi: 1 }); const r = rilFormosio; // (basta trovarne uno: il primo ferma la ricerca)
  assert.ok(r.cicli.length >= 1, 'il ciclo di Breslow'); assert.ok(r.rafProprio.cicli >= 1, 'il RAF proprio contiene la reazione netta del ciclo');
  const ci = r.rafProprio.dettaglio.reazioni.map((j) => r.rafProprio.dirette[j]).find((x) => x.ciclo);
  console.log(`      il primo ciclo trovato in ${num(r.ms)} ms; RAF proprio: ${r.rafProprio.reazioni} reazioni, ${r.rafProprio.cicli} cicli (${ci.re.join(' + ')} → ${ci.pr.join(' + ')}, catalizzata da ${ci.cat.join(', ')}); RAF con la catalisi del cibo: ${r.raf.reazioni} reazioni`);
  const sola = X.sistema({ indirizzo: 'prova/formaldeide', T: 298.15, pH: 11, molecole: { 'C=O': 1 }, cibo: ['C=O'] }, { profondita: 4, atomiMassimi: 8 }), r0 = X.rileva(sola, null, { tempoCicli: 3000 });
  assert.equal(r0.rafProprio.reazioni, 0); assert.equal(r0.cicli.length, 0);
  console.log(`      la sola formaldeide: ${sola.chiavi.length} specie, nessun ciclo, nessun RAF proprio (le regole non hanno la via lenta al primo C–C: NON TORNA con Breslow 1959, dichiarato)`);
  nonTorna.push('la sola formaldeide non fa il primo legame C–C nelle regole: il periodo d\'induzione vero del formosio (radicali, superfici) non ha via, la probabilità dell\'evento raro è zero per le regole');
});

// =====================================================================================================================
console.log('G. gli eventi rari: forward flux sampling');
prova('nascita e morte di una specie col bordo (media 5): la frequenza di arrivo a 18 molecole, FFS contro 1/(tempo di primo passaggio esatto) entro 4 scarti', () => {
  const S = X.sistema({ indirizzo: 'prova/nascita e morte', spettatori: { Ar: 0 } }), c = 5 / Om, fl = { tenute: { Ar: c }, ricambio: 1 };
  const lam = 1 * Om * c, mu = (n) => 1 * n, a = 5, b = 18; let tn = 1 / lam, mfpt = 0; for (let n = 1; n <= b - 1; n++) { tn = (1 + mu(n) * tn) / lam; if (n >= a) mfpt += tn; } if (a === 0) mfpt += 1 / lam;
  const ordine = (N) => N[0], r = X.ffs(S, { V, ordine, A: 5, interfacce: [6, 8, 10, 12, 14, 16, 18], prove: 300, tempoA: 3000, iniziale: Float64Array.of(5), flussi: fl });
  const esatto = 1 / mfpt; assert.ok(Math.abs(r.k - esatto) <= QUATTRO * r.errore * esatto, `${r.k} contro ${esatto} (± ${r.errore})`);
  console.log(`      FFS ${num(r.k)} 1/s (errore relativo ${num(r.errore)}; flusso da A ${num(r.flusso)}, P ${r.P.map((p) => num(p, 2)).join(', ')}; ${r.eventi} eventi) contro esatto ${num(esatto)} 1/s; la forza bruta ne vorrebbe ~${num(10 / esatto * (lam + 5))}`);
});

// =====================================================================================================================
console.log('H. i pori della crosta');
let crosta = null;
prova('il primo pianeta roccioso del catalogo con calore dall\'interno: porosità di Athy, gradiente geotermico, H₂ della serpentinizzazione e della radiolisi, CO₂; la chimica si muove e la rilevazione la guarda', () => {
  let P = null, stella = null; for (let sid = 0; sid < 400 && !P; sid++) { const s0 = CO.galassia(1, 0).stelle[sid]; if (!s0 || s0.stato !== 'in vita') continue; const Sy = CO.sistema(1, 0, sid); for (const p of Sy.pianeti) if (p.tipo === 'roccioso' && p.interno?.q > 0 && p.clima?.acqua === 'liquida') { P = p; stella = Sy.stella; crosta = { sid, p }; break; } }
  assert.ok(P, 'nessun pianeta roccioso con acqua e calore nei primi 400 sistemi');
  for (const z of [300, 1000, 3000]) { const L = X.luogoDellaCrosta(P, { profonditaM: z, stella }), t1 = performance.now(), S = X.sistema(L, { profondita: 4, atomiMassimi: 4 });
    const st = X.storia(S, { V: L.V, tempo: 3.156e9, massimo: 2e5, flussi: L.flussi, adatta: true }), r = X.rileva(S, st, { tempoCicli: 500 }), ms = performance.now() - t1;
    const ins = st.motore.ins, diPartenza = new Set(Object.keys(S.luogo.molecole).filter((k) => S.idx.has(k)).map((k) => ins.di[S.idx.get(k)])), nuove = S.chiavi.filter((k, i) => !diPartenza.has(ins.di[i]) && st.medieSpecie[i] >= 0.5).map((k) => `${k} ${num(st.medieSpecie[S.idx.get(k)])}`);
    assert.ok(L.padre.porosita > 0 && L.T > 0 && st.eventi > 0);
    console.log(`      ${z} m (${L.padre.roccia}): φ ${num(L.padre.porosita)}, ${num(L.T - 273.15)} °C (${num(L.padre.gradienteKkm)} K/km), H₂ ${num(L.padre.H2)} mol/L (serpentinizzazione ${num(L.padre.serpentinizzazione)}, radiolisi ${num(L.padre.radiolisi)} mol/L/s), CO₂ ${num(L.padre.CO2)}; ${S.chiavi.length} specie, ${S.reazioni.length} reazioni, in ${num(st.t / 3.156e7)} anni ${st.eventi} eventi, nate: ${nuove.join(', ') || 'niente'}; RAF ${r.emerso.raf ? 'sì' : 'no'}, cicli ${r.cicli.length}, membrane ${r.emerso.membrane ? 'sì' : 'no'}; ${num(ms)} ms`);
    if (L.padre.mancano.length && !nonTorna.includes(`crosta: ${L.manca[0]}`)) nonTorna.push(`crosta: ${L.manca[0]}`); }
  const L = X.luogoDellaCrosta(P, { profonditaM: 1000, stella });
  console.log(`      (stella ${crosta.sid}, pianeta ${crosta.p.id}, flusso di calore ${num(P.interno.q)} W/m²; confronto, non nel codice: la vita conosciuta arriva a 122 °C — Takai e altri 2008 —, qui a ${num(L.padre.profondita122 / 1000)} km col gradiente di questo pianeta)`);
});

// =====================================================================================================================
console.log('I. il costo');
prova('il motore di Gillespie: eventi al secondo sul formosio intero e su Strecker; la rete delle regole; la rilevazione', () => {
  for (const [nome, S, VV] of [['formosio', SF, 300 / X.NA / 1e3], ['Strecker', SUB, V]]) { const st = X.storia(S, { V: VV, tempo: 1e9, massimo: 2e5 }), v = st.eventi / (st.ms / 1000);
    console.log(`      ${nome}: ${st.eventi} eventi in ${num(st.ms)} ms (${num(v)} eventi/s; ${st.motore.C} canali, ${st.motore.ins.P} insiemi)`); assert.ok(v > 2e4, 'almeno 2·10⁴ eventi al secondo (cinque volte sotto quello misurato qui sul formosio)'); }
  console.log(`      la rete: Strecker ${num(msStrecker)} ms, formosio ${num(msFormosio)} ms; la rilevazione del formosio ${num(rilFormosio.ms)} ms (quasi tutto la ricerca dei cicli)`);
});

console.log(`\nNON TORNA dichiarati (${nonTorna.length}):`); for (const x of nonTorna) console.log(`  · ${x}`);
console.log(`\nreazioni: ${ok} prove in ${num((performance.now() - T0) / 1000)} s (${tempi.filter(([, t]) => t > 500).map(([n, t]) => `${n}… ${num(t / 1000)} s`).join('; ')})`);
