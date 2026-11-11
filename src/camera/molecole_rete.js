// molecole_rete.js — LA RETE delle reazioni possibili in un luogo, e i suoi rilevatori (vedi molecole.js per l'intestazione).
//
// Date le molecole di partenza e le condizioni del luogo, si applicano le regole di molecole_reazioni.js generazione
// dopo generazione: ogni specie nuova reagisce da sola e con le molecole piccole (l'acqua, quelle di partenza, quelle
// con pochi atomi: sono loro che in un luogo vero abbondano). La rete è PIGRA: si ferma alla profondità chiesta e
// riparte da dove era (espandi); con «verso» si allarga di preferenza verso una molecola (si guarda in una direzione:
// le regole restano le stesse, cambia solo quali specie si tengono quando sono troppe).
// Di suo usa le famiglie di reazioni più comuni; «famiglie: 'tutte'» le apre tutte (pericicliche, riarrangiamenti, enoli
// al carbonio, sostituzione aromatica, scambio di idrogeni: da tre a cinque volte più specie).
// LIMITI DICHIARATI: non tutte le coppie reagiscono (solo quelle con una molecola piccola); le specie oltre atomiMassimi
// atomi pesanti e le reazioni con ΔG oltre sogliaDG non entrano; gli stati di protonazione sono dentro ogni specie (in
// equilibrio veloce), non specie a parte.
// RILEVATORI: cicli autocatalitici nel senso stechiometrico di Blokhuis, Lacoste e Nghe (2020, PNAS 117, 25230): un
// ciclo di reazioni in cui ogni passo consuma un membro del ciclo (il resto è cibo) e alla fine i membri sono più di
// prima; insiemi RAF di Hordijk e Steel (2004, J. Theor. Biol. 227, 451); anfifiliche che si aggregano.

import { molecola, chiave, conta, valida } from './molecole_grafo.js';
import { energia, neutra, sitiAcidoBase, risolvi, R } from './molecole_energia.js';
import { reazioni, velocita, conservata, espandiStereo } from './molecole_reazioni.js';
import { aggregazione } from './molecole_forze.js';

const pesanti = (m) => m.atomi.filter((a) => a.Z > 1).length;
const forma0 = (k) => { const m = molecola(k); return m.atomi.some((a) => a.q) ? chiave(neutra(m)) : chiave(m); };
// quanto una molecola somiglia, per composizione e taglia, a quella verso cui si guarda (0 = uguale; più negativo = più lontana)
function somiglianza(m, T) { const a = conta(m), b = conta(T), na = Object.values(a).reduce((s, v) => s + v, 0), nb = Object.values(b).reduce((s, v) => s + v, 0); let d = 0; for (const e of new Set([...Object.keys(a), ...Object.keys(b)])) d += Math.abs((a[e] || 0) / na - (b[e] || 0) / nb); return -10 * d - 0.5 * Math.max(0, pesanti(m) - pesanti(T)) - 0.1 * Math.abs(pesanti(m) - pesanti(T)); }

// rete(partenza, condizioni, opzioni) →
//   { specie: Map(chiave → { chiave, generazione, pesanti, da: reazione che l'ha data per prima }), reazioni: [...], generazioni: [quante specie nuove],
//     ha(x), via(x) (le reazioni che dalla partenza portano a x), espandi(n) (altre n generazioni), condizioni, partenza, tempoMs }
// partenza: lista di molecole, o { molecola: concentrazione (mol/L) }; condizioni: { T, P, pH, solvente, attivitaAcqua, ioni, minerali, luce, misure }
export function rete(partenza, condizioni = {}, { profondita = 3, massimo = 3000, atomiMassimi = 8, piccole = 3, sogliaDG = 60, kMinima = 1e-16, radicali = false, verso = null, fascio = Infinity, tempoMassimo = Infinity, lente: opzLente = null, soglia = null, famiglie = 'veloci', stereo = false, tempo = 3e9 } = {}) {
  const cond = { T: 298.15, solvente: 'acqua', pH: 7, ...condizioni, memoria: new Map() }, lente = opzLente ?? cond.T >= 340, t0 = Date.now(), bersaglio = verso ? molecola(verso) : null, bersaglioK = bersaglio ? chiave(bersaglio) : null;
  const iniziali = Array.isArray(partenza) ? Object.fromEntries(partenza.map((x) => [forma0(x), 1])) : Object.fromEntries(Object.entries(partenza).map(([k, v]) => [forma0(k), v]));
  if (cond.solvente === 'acqua' && !('O' in iniziali)) iniziali.O = 55.5;
  const specie = new Map(), lista = [], viste = new Set(), generazioni = [], coppieFatte = new Set();
  const metti = (k, gen, da = null) => { if (specie.has(k)) return false; const m = molecola(k); specie.set(k, { chiave: k, generazione: gen, pesanti: pesanti(m), da }); return true; };
  for (const k in iniziali) metti(k, 0);
  let fronte = [...specie.keys()], gen = 0;
  const provaReazioni = (rr0, nuove) => { const rr = stereo ? espandiStereo(rr0) : rr0; for (const r0 of rr) { const r = { ...r0, reagenti: r0.reagenti.map(forma0).sort(), prodotti: r0.prodotti.map(forma0).sort() }; const id = [r.reagenti.join('.'), r.prodotti.join('.')].sort().join('>'); if (viste.has(id) || r.reagenti.join('.') === r.prodotti.join('.')) continue; viste.add(id);
      if (r.prodotti.some((p) => { const s = specie.get(p); return (s ? s.pesanti : pesanti(molecola(p))) > atomiMassimi; })) continue;
      let v; try { v = velocita(r, cond); } catch { continue; } if (!(v.dG <= sogliaDG) || !isFinite(v.dG) || !(v.k >= kMinima)) continue; // (kMinima: ciò che non avviene nemmeno in cento milioni di anni non entra)
      r.dG = v.dG; r.barriera = v.barriera; r.k = v.k; r.kInversa = v.kInversa; lista.push(r); for (const p of r.prodotti) if (!specie.has(p)) { const c = nuove.get(p); if (!c || r.barriera < c.barriera) nuove.set(p, r); } } };
  const passo = () => { gen++; const nuove = new Map(), tutte = [...specie.keys()], piccoleK = tutte.filter((k) => specie.get(k).pesanti <= piccole || k in iniziali), inFronte = new Set(fronte);
    // CON UNA SOGLIA DI CONCENTRAZIONE: reagiscono tra loro tutte le specie che, lasciando andare la rete per «tempo» con le
    // sorgenti fisse, stanno sopra la soglia (qualunque sia la loro taglia: peptide + peptide); le altre solo da sole.
    if (soglia != null) { const e = evolvi(lista, Object.fromEntries(tutte.map((k) => [k, iniziali[k] ?? 0])), tempo, { attivita: { O: cond.attivitaAcqua ?? 1, '[H+]': 1 } }); out.concentrazioni = e.c; // (un sistema chiuso: ciò che c'è all'inizio, lasciato andare)
      const presenti = tutte.filter((k) => k in iniziali || e.c[k] >= soglia); out.presenti = presenti;
      for (const a of fronte) provaReazioni(reazioni(molecola(a), null, { radicali, lente, tutte: famiglie === 'tutte' }), nuove);
      for (const a of presenti) for (const b of presenti) { if (b < a || Date.now() - t0 > tempoMassimo) continue; const id = a + '|' + b; if (coppieFatte.has(id)) continue; coppieFatte.add(id); if (specie.get(a).pesanti + specie.get(b).pesanti > atomiMassimi + 3) continue; provaReazioni(reazioni(molecola(a), molecola(b), { radicali, metalli: false, lente, tutte: famiglie === 'tutte' }), nuove); } }
    else for (const a of fronte) { if (Date.now() - t0 > tempoMassimo) break; const A = molecola(a); provaReazioni(reazioni(A, null, { radicali, lente, tutte: famiglie === 'tutte' }), nuove);
      // (una specie nuova con tutte le piccole; una piccola nuova anche con tutte le vecchie)
      const compagni = specie.get(a).pesanti <= piccole || a in iniziali ? tutte : piccoleK;
      for (const b of compagni) { if (inFronte.has(b) && b < a && (specie.get(b).pesanti <= piccole || b in iniziali || compagni === tutte)) continue; if (specie.get(a).pesanti + specie.get(b).pesanti > atomiMassimi + 3) continue; provaReazioni(reazioni(A, molecola(b), { radicali, metalli: false, lente, tutte: famiglie === 'tutte' }), nuove); } }
    let cand = [...nuove.entries()];
    if (bersaglio) cand = cand.map(([k, r]) => [k, r, k === bersaglioK ? 1 : somiglianza(molecola(k), bersaglio)]).sort((x, y) => y[2] - x[2] || (x[0] < y[0] ? -1 : 1)).slice(0, fascio); else cand.sort((x, y) => (x[0] < y[0] ? -1 : 1));
    cand = cand.slice(0, Math.max(0, massimo - specie.size)); fronte = []; for (const [k, r] of cand) if (metti(k, gen, r)) fronte.push(k); generazioni.push(fronte.length); return fronte.length; };
  const out = { specie, reazioni: lista, generazioni, condizioni: cond, partenza: iniziali, tempoMs: 0,
    ha: (x) => specie.has(forma0(x)),
    via: (x) => { const passi = [], fatto = new Set(); const risali = (k) => { const s = specie.get(k); if (!s || !s.da || fatto.has(k)) return; fatto.add(k); for (const q of s.da.reagenti) risali(q); passi.push(s.da); }; risali(forma0(x)); return passi; },
    espandi: (n = 1) => { for (let i = 0; i < n && fronte.length && specie.size < massimo && Date.now() - t0 < tempoMassimo; i++) { passo(); if (bersaglioK && specie.has(bersaglioK)) break; } out.tempoMs = Date.now() - t0; return out; } };
  return out.espandi(profondita);
}

// ---------- due (o più) scatole con una barriera in mezzo: i gradienti dei camini, le vescicole
// scatole(rete, { nome: { condizioni (pH, T, minerali… di quella scatola), tenute: { specie: mol/L fisse }, inizio } }, { passa, tempo })
// Ogni scatola ha le reazioni della rete con le velocità delle SUE condizioni; tra una scatola e la successiva passano le
// specie che la barriera lascia passare: «passa(chiave)» → 1/s. Di suo vale la regola di Overton (1899): passa ciò che si
// scioglie nell'olio, k = k0·exp(−ΔG(acqua → olio)/RT) per la parte non carica, k0 = 1 1/s [PARAMETRO LIBERO].
// → { nome: { specie: mol/L }, converge, reazioni }. (Due scatole accoppiate possono rendere autocatalitica una rete che in
// una sola non lo è — Blokhuis e altri 2020 —: qui c'è ciò che serve per provarlo, non una prova fatta.)
export function scatole(r, definizioni, { passa = null, tempo = 1e9, k0 = 1, ricambio = 1e-9 } = {}) {
  const nomi = Object.keys(definizioni), reaz = [], c0 = {}, fisse = [], att = {}, T = r.condizioni.T;
  const overton = (k) => { try { const a = aggregazione(k, { T, pH: r.condizioni.pH }); return Math.abs(a.carica) > 0.5 ? 0 : k0 * Math.exp(-Math.max(0, a.trasferimento) / (R * T)); } catch { return 0; } };
  for (const n of nomi) { const d = definizioni[n], cond = { ...r.condizioni, ...(d.condizioni || {}), memoria: new Map() };
    for (const x of r.reazioni) { let v; try { v = velocita(x, cond); } catch { continue; } reaz.push({ tipo: x.tipo, reagenti: x.reagenti.map((k) => `${k}@${n}`), prodotti: x.prodotti.map((k) => `${k}@${n}`), k: v.k, kInversa: v.kInversa }); }
    for (const k of r.specie.keys()) c0[`${k}@${n}`] = d.tenute?.[k] ?? d.inizio?.[k] ?? 0; for (const k in d.tenute || {}) fisse.push(`${k}@${n}`); att[`O@${n}`] = cond.attivitaAcqua ?? 1; att[`[H+]@${n}`] = 1; }
  for (const k of r.specie.keys()) { if (k === 'O' || k === '[H+]') continue; const p = passa ? (typeof passa === 'function' ? passa(k) : passa[k] ?? 0) : overton(k); if (p > 0) for (let i = 0; i < nomi.length - 1; i++) reaz.push({ tipo: 'scambio', reagenti: [`${k}@${nomi[i]}`], prodotti: [`${k}@${nomi[i + 1]}`], k: p, kInversa: p }); }
  const e = evolvi(reaz, c0, tempo, { fisse, attivita: att, ricambio, passi: 240 }), out = {}; for (const n of nomi) out[n] = {}; for (const kk in e.c) { const i = kk.lastIndexOf('@'); out[kk.slice(i + 1)][kk.slice(0, i)] = e.c[kk]; }
  return { ...out, converge: e.converge, reazioni: reaz };
}

// ---------- le concentrazioni all'equilibrio (il minimo dell'energia di Gibbs dell'insieme, con gli atomi conservati)
// In acqua l'acqua è un serbatoio (attività fissa): si conservano C, N, S, P… e la combinazione H − 2·O (lo stato di
// ossidazione dell'insieme). All'equilibrio c_i = exp(Σ a_ij·λ_j − G_i/RT): restano da trovare i «prezzi» λ degli atomi,
// il minimo di una funzione convessa (Newton), come in equilibrio() di chimica.js. → { chiave: mol/L }
export function equilibrioRete(r, { quali = null } = {}) {
  const cond = r.condizioni, T = cond.T, acqua = cond.solvente === 'acqua', nomi = (quali || [...r.specie.keys()]).filter((k) => !(acqua && k === 'O'));
  const comp = new Map(), vet = nomi.map((k) => { const c = conta(k), v = {}; for (const e in c) { if (acqua && (e === 'H' || e === 'O')) v['H-2O'] = (v['H-2O'] || 0) + (e === 'H' ? c[e] : -2 * c[e]); else v[e] = c[e]; } for (const e in v) if (!comp.has(e)) comp.set(e, comp.size); return v; });
  const m = comp.size, A = vet.map((v) => { const riga = new Array(m).fill(0); for (const e in v) riga[comp.get(e)] = v[e]; return riga; });
  // (ogni ossigeno di una specie è un'acqua presa dal serbatoio: la sua energia va tolta — trasformata di Legendre)
  const Gw = acqua ? energia('O', cond).G : 0, g = nomi.map((k) => (energia(k, cond).G - (acqua ? (conta(k).O || 0) * Gw : 0)) / (R * T));
  const b = new Array(m).fill(0); nomi.forEach((k, i) => { const c0 = r.partenza[k] || 0; for (let j = 0; j < m; j++) b[j] += A[i][j] * c0; });
  // partenza: i prezzi che darebbero alle specie di partenza le loro concentrazioni (minimi quadrati)
  const N0 = Array.from({ length: m }, () => new Array(m + 1).fill(0)); nomi.forEach((k, i) => { const c0 = r.partenza[k]; if (!(c0 > 0)) return; const y = g[i] + Math.log(c0); for (let p = 0; p < m; p++) { for (let q = 0; q < m; q++) N0[p][q] += A[i][p] * A[i][q]; N0[p][m] += A[i][p] * y; } }); for (let p = 0; p < m; p++) N0[p][p] += 1e-9;
  let lam = risolvi(N0); const c = new Float64Array(nomi.length), esp = (l, i) => { let x = -g[i]; for (let j = 0; j < m; j++) x += A[i][j] * l[j]; return x; };
  const psi = (l) => { let v = 0; for (let i = 0; i < nomi.length; i++) v += Math.exp(Math.min(esp(l, i), 300)); for (let j = 0; j < m; j++) v -= b[j] * l[j]; return v; };
  for (let it = 0; it < 300; it++) { const G = Array.from({ length: m }, () => new Array(m + 1).fill(0)); let v0 = 0;
    for (let i = 0; i < nomi.length; i++) { c[i] = Math.exp(Math.min(esp(lam, i), 300)); v0 += c[i]; for (let p = 0; p < m; p++) { if (!A[i][p]) continue; G[p][m] -= A[i][p] * c[i]; for (let q = 0; q < m; q++) G[p][q] += A[i][p] * A[i][q] * c[i]; } }
    let scarto = 0, scala = 0; for (let p = 0; p < m; p++) { G[p][m] += b[p]; v0 -= b[p] * lam[p]; scala = Math.max(scala, G[p][p]); } for (let p = 0; p < m; p++) { scarto = Math.max(scarto, Math.abs(G[p][m]) / (Math.abs(b[p]) + 1e-12)); G[p][p] += 1e-12 * scala + 1e-300; }
    if (scarto < 1e-9) break; const res = G.map((riga) => riga[m]), d = risolvi(G); let t = 1, mx = 0; for (let i = 0; i < nomi.length; i++) { let de = 0; for (let j = 0; j < m; j++) de += A[i][j] * d[j]; mx = Math.max(mx, de); } if (mx > 2) t = 2 / mx;
    let pend = 0; for (let p = 0; p < m; p++) pend -= res[p] * d[p];
    for (let k = 0; k < 40; k++, t /= 2) { const l2 = lam.map((x, j) => x + t * d[j]); if (psi(l2) <= v0 + 1e-4 * t * pend || k === 39) { lam = l2; break; } } }
  const out = {}; nomi.forEach((k, i) => { out[k] = Math.exp(Math.min(esp(lam, i), 300)); }); if (acqua) out.O = 55.5 * (cond.attivitaAcqua ?? 1);
  return out;
}
// ---------- la cinetica nel tempo
// evolvi(reazioni, concentrazioni, tempo, { fisse, attivita }) → { c, converge }: integra le velocità (mol/L/s) per un
// tempo dato. A ogni passo ogni reazione avanza, una dopo l'altra, di ξ = dt·(avanti − indietro)/(1 + dt·Σ velocità/c):
// è Eulero implicito linearizzato su una reazione alla volta. Conserva gli atomi esattamente (ogni reazione sposta
// materia secondo la sua stechiometria), non va sotto zero, non esplode con reazioni di tempi lontanissimi, e per dt
// grande porta ogni reazione al suo equilibrio. I passi crescono in progressione geometrica (primo ordine: va bene per
// rilassamenti e crescite). L'acqua e H⁺ hanno attività fissa; «fisse» sono le specie tenute ferme (un luogo aperto).
export function evolvi(reazioni, c0, tempo, { fisse = [], passi = 160, attivita = { O: 1, '[H+]': 1 }, ricambio = 0 } = {}) {
  const c = new Map(Object.entries(c0)); for (const x of reazioni) for (const k of [...x.reagenti, ...x.prodotti]) if (!c.has(k)) c.set(k, 0);
  const ferme = new Set(fisse), libera = (k) => !ferme.has(k) && attivita[k] == null, a = (k) => attivita[k] ?? c.get(k), r = 1.18, fin = (v) => (v > 1e60 ? 1e60 : v > 0 ? v : 0);
  const rz = reazioni.map((x) => ({ re: x.reagenti, pr: x.prodotti, k: fin(x.k), ki: fin(x.kInversa ?? 0) })).filter((x) => x.k > 0 || x.ki > 0);
  let dt = (tempo * (r - 1)) / Math.pow(r, passi), cambia = 0; const prima = new Map(); let peggio = '';
  const dtMax = ricambio > 0 ? 0.2 / ricambio : Infinity; // (con il ricambio il passo non supera un quinto del tempo di rinnovo: poi si va avanti a passi uguali fino a regime)
  for (let n = 0; n < passi; n++, dt = Math.min(dt * r, dtMax)) {
    for (const x of rz) { let av = x.k, ind = x.ki, den = 0, maxAv = Infinity, maxInd = Infinity; for (const k of x.re) av *= a(k); for (const k of x.pr) ind *= a(k); if (!(av > 0) && !(ind > 0)) continue;
      for (const k of x.re) if (libera(k)) { const ck = c.get(k); if (ck > 0) den += av / ck; maxAv = Math.min(maxAv, ck); }
      for (const k of x.pr) if (libera(k)) { const ck = c.get(k); if (ck > 0) den += ind / ck; maxInd = Math.min(maxInd, ck); }
      let xi = (dt * (av - ind)) / (1 + dt * den); if (xi > 0) { if (maxAv !== Infinity) xi = Math.min(xi, 0.5 * maxAv); } else if (maxInd !== Infinity) xi = Math.max(xi, -0.5 * maxInd); if (!xi || !isFinite(xi)) continue;
      for (const k of x.re) if (libera(k)) c.set(k, c.get(k) - xi); for (const k of x.pr) if (libera(k)) c.set(k, c.get(k) + xi); }
    // (ricambio: il luogo si rinnova, ogni specie che non è una sorgente esce con questo ritmo, 1/s)
    if (ricambio > 0) for (const [k, v] of c) if (libera(k) && v > 0) c.set(k, v / (1 + dt * ricambio));
    // (fermo: nell'ultimo decimo dei passi nessuna specie sopra 10⁻¹² mol/L cambia più dell'1% a passo)
    if (n >= passi * 0.9) { for (const [k, v] of c) { const p = prima.get(k); if (p != null && Math.max(v, p) > 1e-12) { const d = Math.abs(v - p) / Math.max(v, p); if (d > cambia) { cambia = d; peggio = k; } } } } if (n >= passi * 0.9 - 1) for (const [k, v] of c) prima.set(k, v); }
  return { c: Object.fromEntries(c), converge: cambia < 1e-2, cambia, peggio };
}
// le concentrazioni stazionarie con le sorgenti tenute fisse (un luogo aperto: ciò che arriva dall'aria o dal camino
// resta alla sua concentrazione) e tutto il resto esce con il ritmo del ricambio (di suo 10⁻⁹ 1/s: il luogo si rinnova in
// trent'anni; senza ricambio ciò che è in discesa si accumulerebbe senza fine). → { c, converge, flussi }
export function stazionarie(r, { tenute = r.partenza, tempo = 1e12, ricambio = 1e-9 } = {}) {
  const c0 = {}; for (const k of r.specie.keys()) c0[k] = tenute[k] ?? 0; const e = evolvi(r.reazioni, c0, tempo, { fisse: Object.keys(tenute), ricambio, passi: 240, attivita: { O: r.condizioni.attivitaAcqua ?? 1, '[H+]': 1 } });
  const a = (k) => (k === 'O' || k === '[H+]' ? 1 : e.c[k]); return { ...e, flussi: r.reazioni.map((x) => x.k * x.reagenti.reduce((p, k) => p * a(k), 1) - x.kInversa * x.prodotti.reduce((p, k) => p * a(k), 1)) };
}

// ---------- i cicli autocatalitici
// Si cercano cicli X1 → X2 → … → X1 in cui ogni reazione consuma un solo membro del ciclo (gli altri reagenti sono cibo:
// le molecole di partenza) e ne produce almeno uno; il ciclo è autocatalitico se, percorso una volta, nessun membro cala
// e almeno uno cresce (per esempio l'ultima reazione ne dà due). È il nucleo di tipo I di Blokhuis e altri (il formosio).
// → [{ membri, reazioni, guadagno: { specie: +n }, cibo, dG (lungo il ciclo), barrieraMassima }]
export function autocatalitici(r, { lunghezza = 7, massimo = 40, cibo = null, tempoMassimo = 10000 } = {}) {
  const food = new Set(cibo || Object.keys(r.partenza)), t0 = Date.now(), archi = new Map(), out = [], visti = new Set();
  // (ciò che il cibo dà da solo — gli idrati, gli oligomeri della formaldeide — è ancora cibo: un ciclo deve passare per qualcosa che dal cibo solo non nasce)
  for (let cresce = true; cresce;) { cresce = false; for (const x of r.reazioni) for (const [da, a] of [[x.reagenti, x.prodotti], [x.prodotti, x.reagenti]]) if (da.every((q) => food.has(q))) for (const q of a) if (!food.has(q)) { food.add(q); cresce = true; } }
  const aggiungi = (da, a, reag, prod, dG, barriera, rz) => { for (const x of da) { if (food.has(x)) continue; if (da.filter((q) => !food.has(q)).length !== 1) return; (archi.get(x) || archi.set(x, []).get(x)).push({ reag, prod, a: a.filter((q) => !food.has(q)), dG, barriera, rz }); } };
  for (const x of r.reazioni) { aggiungi(x.reagenti, x.prodotti, x.reagenti, x.prodotti, x.dG, x.barriera, x); aggiungi(x.prodotti, x.reagenti, x.prodotti, x.reagenti, -x.dG, x.barriera - x.dG, { tipo: 'inversa di ' + x.tipo }); }
  const cerca = (inizio) => { const cammino = [], dentro = new Set([inizio]);
    const scendi = (u) => { if (out.length >= massimo || Date.now() - t0 > tempoMassimo) return; for (const e of archi.get(u) || []) { for (const v of new Set(e.a)) {
          if (v === inizio && cammino.length >= 1) { const passi = cammino.concat([e]), membri = [...dentro], d = Object.fromEntries(membri.map((k) => [k, 0])); for (const p of passi) { for (const q of p.reag) if (q in d) d[q]--; for (const q of p.prod) if (q in d) d[q]++; }
            if (Object.values(d).every((x) => x >= 0) && Object.values(d).some((x) => x > 0)) { const id = passi.map((p) => p.reag.join('.') + '>' + p.prod.join('.')).sort().join('|'); if (!visti.has(id)) { visti.add(id); out.push({ membri, reazioni: passi.map((p) => ({ tipo: p.rz.tipo, reagenti: p.reag, prodotti: p.prod, dG: p.dG, barriera: p.barriera })), guadagno: Object.fromEntries(Object.entries(d).filter(([, x]) => x > 0)), cibo: [...new Set(passi.flatMap((p) => p.reag.filter((q) => food.has(q))))], dG: passi.reduce((s, p) => s + p.dG, 0), barrieraMassima: Math.max(...passi.map((p) => p.barriera)) }); } } continue; }
          if (dentro.has(v) || cammino.length >= lunghezza - 1 || v < inizio) continue; dentro.add(v); cammino.push(e); scendi(v); cammino.pop(); dentro.delete(v); } } };
    scendi(inizio); };
  for (const k of [...archi.keys()].sort()) { if (out.length >= massimo || Date.now() - t0 > tempoMassimo) break; cerca(k); }
  return out.sort((a, b) => a.barrieraMassima - b.barrieraMassima);
}
// ---------- insiemi RAF (Hordijk e Steel): reazioni che si reggono a partire dal cibo e sono ognuna catalizzata da una molecola dell'insieme
// Chi catalizza che cosa viene dalla regola generale della catalisi acido-base: una molecola con un sito di pKa vicino
// al pH (entro 1,5) passa protoni nei due versi, e accelera addizioni, eliminazioni, tautomerie e sostituzioni; gli ioni
// e i minerali del luogo contano come cibo. → { reazioni, specie, catalizzatori }
export function raf(r, { cibo = null } = {}) {
  const food = new Set(cibo || Object.keys(r.partenza)), pH = r.condizioni.pH ?? 7, cat = new Set(), metallo = Object.keys(r.condizioni.ioni || {}).length > 0 || (r.condizioni.minerali || []).length > 0;
  for (const k of r.specie.keys()) { if (k === 'O') continue; try { if (sitiAcidoBase(k).siti.some((s) => Math.abs(s.pKa - pH) <= 1.5)) cat.add(k); } catch { /* niente siti */ } }
  const catalizzabile = (x) => ['addizione', 'addizione C', 'eliminazione', 'tautomeria', 'sostituzione'].includes(x.tipo);
  let R_ = r.reazioni.filter(catalizzabile), cambia = true, chiuso = new Set(food);
  while (cambia) { chiuso = new Set(food); let cresce = true; while (cresce) { cresce = false; for (const x of R_) for (const [da, a] of [[x.reagenti, x.prodotti], [x.prodotti, x.reagenti]]) if (da.every((q) => chiuso.has(q))) for (const q of a) if (!chiuso.has(q)) { chiuso.add(q); cresce = true; } }
    const prima = R_.length; R_ = R_.filter((x) => (x.reagenti.every((q) => chiuso.has(q)) || x.prodotti.every((q) => chiuso.has(q))) && (metallo || [...cat].some((q) => chiuso.has(q)))); cambia = R_.length !== prima; }
  return { reazioni: R_, specie: [...chiuso], catalizzatori: [...cat].filter((q) => chiuso.has(q)).concat(metallo ? ['ioni e minerali del luogo'] : []) };
}
// le anfifiliche della rete che a quelle condizioni si aggregano
export function anfifiliche(r) { const out = []; for (const k of (r.specie ? r.specie.keys() : r)) { const a = aggregazione(k, { T: r.condizioni?.T, pH: r.condizioni?.pH }); if (a.cmc) out.push({ chiave: k, ...a }); } return out; }
export { conservata, valida };
