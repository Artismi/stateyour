// molecole_reazioni.js — LE REAZIONI come regole generali: rompere e fare legami (vedi molecole.js per l'intestazione).
//
// Nessuna reazione è scritta per nome. Ogni molecola ha dei SITI, letti dal suo grafo:
//   · donatori H–Nu: un atomo con un idrogeno e una coppia solitaria (O, N, S), un acido alogenidrico, un carbonio
//     acido (accanto a C=O o C≡N, o l'HCN: lo dice il suo pKa), o la molecola H–H;
//   · legami π polari A=B, A≡B (il carbonio del C=O, del C=N, del C≡N è l'elettrofilo); il carbonio di CO e degli
//     isonitrili (una coppia e un posto vuoto: prende tutti e due i pezzi);
//   · gruppi uscenti: un eteroatomo legato a un carbonio acilico, a un fosforo o a uno zolfo con =O, a un carbonio che
//     porta un altro eteroatomo (centro anomerico), o un buon uscente (alogenuro, carbossilato, fosfato);
//   · radicali (elettroni spaiati), ioni metallici (posti vuoti), coppie solitarie che li coordinano.
// e le FAMIGLIE di passi elementari, applicate a qualsiasi coppia di siti che le ammette:
//   addizione        H–Nu + A=B → Nu–A–B–H           (idratazione, emiacetali, cianidrine, aldolica, HCN + HCN, H2 + C=O…)
//   eliminazione     Nu–A–B–H → A=B + H–Nu           (l'inversa: disidratazione, retro-aldolica, decarbossilazione…)
//   sostituzione     Nu–H + A–L → Nu–A + L–H         (condensazione con perdita d'acqua, idrolisi, transesterificazione,
//                                                     legami glicosidici, fosforilazione)
//   tautomeria       H–X–A=B → X=A–B–H               (cheto-enolica, immina-enammina, acido immidico-ammide)
//   idrogenazione/deidrogenazione, addizione a CO, inserzione di CO in C–X (solo su metalli), omolisi, ricombinazione
//   e strappo di H dei radicali, trasferimento di protone, complessazione di uno ione metallico.
// Ogni reazione conserva atomi e carica per costruzione (si modifica un grafo solo: i prodotti sono i suoi pezzi).
// ENERGIA: ΔG e ΔH da molecole_energia.js nelle condizioni date. BARRIERA: la relazione di Marcus (1956; per le
// reazioni chimiche in generale: Murdoch 1972), ΔG‡ = ΔG0‡·(1 + ΔG/4ΔG0‡)²: è la forma quadratica di Bell, Evans e
// Polanyi, e dà alle due direzioni barriere coerenti. ΔG0‡ (la barriera «intrinseca» di una famiglia) è un DATO EMPIRICO,
// preso da una velocità misurata per famiglia (INTRINSECHE, con la fonte accanto). VELOCITÀ: Eyring, k = (kT/h)·e^(−ΔG‡/RT).
// CATALISI (regole generali, non elenchi di reazioni): vedi catalisi() più sotto.

import { atomo } from './molecole_atomi.js';
import { molecola, chiave, grezzo, unisci, componenti, valida, conta, carica, coppieSolitarie, anelli } from './molecole_grafo.js';
import { energia, pKaSito, neutra, entalpiaGas, sitiAcidoBase, logKComplesso, R } from './molecole_energia.js';

const KB_H = 2.083661912e10; // k/h (1/(s·K))
const ETERO = new Set([7, 8, 16]), ALOGENI = new Set([9, 17, 35]);
// barriere intrinseche (kJ/mol) per famiglia, e da quale misura vengono (in acqua, 25 °C, senza catalisi)
export const INTRINSECHE = {
  addizione: 85,        // idratazione dell'acetaldeide, non catalizzata: k ≈ 9·10⁻³ 1/s (Bell 1966), ΔG ≈ 0
  'addizione C': 85,    // come sopra: il carbanione attacca come un nucleofilo qualsiasi (la sua rarità è nel fattore del pKa)
  sostituzione: 135,    // idrolisi neutra dell'acetato di etile, k ≈ 1,5·10⁻¹⁰ 1/s; del legame peptidico, 5·10⁻¹¹ 1/s (Radzicka e Wolfenden 1996)
  tautomeria: 100,      // enolizzazione dell'acetone in acqua neutra, k ≈ 5·10⁻¹⁰ 1/s, ΔG = +47 kJ/mol (Chiang e Kresge 1984)
  idrogenazione: 230,   // H2 + H2CO in fase gas: ~300 kJ/mol di barriera (nessuna via senza catalizzatore)
  'idrogenazione su metallo': 105, // H2 + CO2 → formiato su Fe/Ni a 100 °C in ore (Preiner e altri 2020)
  'addizione a CO': 150, 'inserzione di CO': 110, // CO + H2O in acqua calda; CH3SH + CO su (Fe,Ni)S (Huber e Wächtershäuser 1997)
  radicale: 50,         // strappo di H da parte di un radicale alchilico (Evans e Polanyi 1938)
  protone: 10,          // tra eteroatomi: quasi al limite della diffusione (Eigen 1964)
  complessazione: 30,   // scambio dell'acqua attorno a uno ione (Mg²⁺ 10⁵ 1/s, Fe²⁺ 10⁶ 1/s)
};
const BRONSTED = 0.6;   // quanto la velocità di un nucleofilo cresce con la sua basicità (pendenza di Brønsted: OH⁻ contro H2O sugli esteri, 10^10,6 per 17,4 unità di pK)

// ---------- operazioni sul grafo
const trova = (g, a, b) => g.legami.findIndex((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
const ordine = (g, a, b, d) => { const k = trova(g, a, b); if (k < 0) { if (d > 0) g.legami.push({ a, b, o: d, t: 'c' }); return; } g.legami[k].o += d; if (g.legami[k].o <= 0) g.legami.splice(k, 1); };
const senzaStereo = (g, ...kk) => { for (const k of kk) if (g.atomi[k]) { g.atomi[k].chir = 0; g.atomi[k].ord = null; } };
const togli = (g, k) => { g.atomi.splice(k, 1); g.legami = g.legami.filter((l) => l.a !== k && l.b !== k).map((l) => ({ ...l, a: l.a > k ? l.a - 1 : l.a, b: l.b > k ? l.b - 1 : l.b })); for (const a of g.atomi) { a.chir = a.ord ? 0 : a.chir; a.ord = null; } };
// i prodotti di un grafo modificato, se è chimica possibile → [chiavi] (in forma neutra se non si chiedono gli ioni) o null
function prodotti(g, { radicali = false } = {}) {
  let m; try { m = molecola(g); } catch { return null; }
  const v = valida(m); if (!v.ok || (!radicali && v.aperti.length)) return null;
  return componenti(m).map((c) => chiave(c)).sort();
}
const chi = (m, k) => atomo(m.atomi[k].Z).chi ?? 2;
const distanzaNelGrafo = (m, a, b, max = 7) => { const d = new Map([[a, 0]]); let f = [a]; for (let s = 1; s <= max && f.length; s++) { const p = []; for (const u of f) for (const v of m.vic[u]) if (!d.has(v.j)) { if (v.j === b) return s; d.set(v.j, s); p.push(v.j); } f = p; } return Infinity; };

// ---------- i siti di una molecola
export function siti(x) {
  const m = molecola(x); if (m._sitiR) return m._sitiR;
  const donatori = [], pi = [], uscenti = [], radicali = [], coppie = [], carbeni = []; let _b = null;
  const basi = () => (_b ??= m.atomi.some((a) => a.q) ? [] : sitiAcidoBase(m).siti.filter((x) => x.tipo === 'base'));
  m.atomi.forEach((a, k) => {
    if (a.r) radicali.push(k);
    if (a.Z === 6 && a.q === -1 && m.vic[k].length === 1 && m.legami[m.vic[k][0].k].o === 3 && m.atomi[m.vic[k][0].j].q === 1) carbeni.push({ C: k, X: m.vic[k][0].j });
    if (coppieSolitarie(m, k) > 0 && (ETERO.has(a.Z) || a.Z === 15) && a.q <= 0) coppie.push(k);
    if (!a.h) return;
    if (a.Z === 1) donatori.push({ k, tipo: 'H2', p: -30 });
    else if (ETERO.has(a.Z) && a.q === 0 && coppieSolitarie(m, k) > 0) donatori.push({ k, tipo: 'eteroatomo', p: pKaSito(m, k)?.pKa ?? 16, pb: a.Z === 7 ? (basi().find((b) => b.atomo === k)?.pKa ?? -5) : a.Z === 16 ? -4 : m.vic[k].length ? -2 : 0 });
    else if (ALOGENI.has(a.Z)) donatori.push({ k, tipo: 'alogenuro', p: pKaSito(m, k)?.pKa ?? -7 });
    else if (a.Z === 6 && !a.ar) { const p = pKaSito(m, k); if (p && p.pKa < 26) donatori.push({ k, tipo: 'carbonio', p: p.pKa }); }
  });
  m.legami.forEach((l, i) => { if (l.t !== 'c' || l.ar) return; const A = m.atomi[l.a], B = m.atomi[l.b];
    if (l.o >= 2 && !(A.q && B.q && l.o === 3)) { const [e, n] = chi(m, l.a) <= chi(m, l.b) ? [l.a, l.b] : [l.b, l.a]; pi.push({ i, A: e, B: n, polare: A.Z !== B.Z, o: l.o }); }
    if (l.o === 1) for (const [c, L] of [[l.a, l.b], [l.b, l.a]]) { const C = m.atomi[c], X = m.atomi[L]; if (!(ETERO.has(X.Z) || ALOGENI.has(X.Z)) || X.q > 0 || ![6, 15, 16, 14].includes(C.Z)) continue;
      const doppio = m.vic[c].some((v) => m.legami[v.k].o === 2 && m.atomi[v.j].Z !== 6 && !m.legami[v.k].ar), anomerico = C.Z === 6 && !C.ar && m.vic[c].some((v) => v.j !== L && m.legami[v.k].o === 1 && ETERO.has(m.atomi[v.j].Z) && !m.vic[v.j].some((w) => m.legami[w.k].o === 2));
      const buono = ALOGENI.has(X.Z) || m.vic[L].some((v) => v.j !== c && m.vic[v.j].some((w) => m.legami[w.k].o === 2 && m.atomi[w.j].Z === 8));
      if ((doppio || anomerico || buono) && !C.ar) uscenti.push({ A: c, L, classe: doppio ? 'acile' : anomerico ? 'anomerico' : 'buon uscente' }); } });
  const out = { m, donatori, pi, uscenti, radicali, coppie, carbeni };
  Object.defineProperty(m, '_sitiR', { value: out, enumerable: false }); return out;
}

// ---------- reazioni(m1, m2?, { radicali, protoni, ioni }) → [{ tipo, reagenti: [chiavi], prodotti: [chiavi], nucleofilo: pK, sito }]
// Con una molecola: i passi dentro la molecola (eliminazione, tautomeria, chiusura d'anello, omolisi). Con due: quelli tra le due.
export function reazioni(x1, x2 = null, { radicali = false, protoni = false, metalli = true } = {}) {
  const m1 = molecola(x1), m2 = x2 != null ? molecola(x2) : null, out = new Map();
  const reag = [chiave(m1)].concat(m2 ? [chiave(m2)] : []).sort();
  const metti = (tipo, g, extra = {}, opz = {}) => { const p = prodotti(g, opz); if (!p || p.join('.') === reag.join('.')) return; const id = tipo + '>' + p.join('.'); if (!out.has(id)) out.set(id, { tipo, reagenti: reag, prodotti: p, ...extra }); };
  if (!m2) {
    const s = siti(m1), m = m1, base = () => grezzo(m);
    // eliminazione: H–B–A–L → A=B + H–L
    m.atomi.forEach((b, B) => { if (!b.h || b.Z === 1) return; const acido = b.Z === 6 ? s.donatori.find((d) => d.k === B && d.tipo === 'carbonio') : null; if (b.Z === 6 && !acido) return; if (!(ETERO.has(b.Z) || b.Z === 6)) return;
      for (const va of m.vic[B]) { const l = m.legami[va.k], A = va.j; if (l.t !== 'c' || l.ar || l.o > 2 || (l.o === 2 && !(b.Z === 7 && m.atomi[A].Z === 6))) continue;
        for (const vl of m.vic[A]) { const L = vl.j, ll = m.legami[vl.k], X = m.atomi[L]; if (L === B || ll.t !== 'c' || ll.o !== 1 || ll.ar) continue;
          const uscente = ETERO.has(X.Z) || ALOGENI.has(X.Z) || (X.Z === 6 && (m.vic[L].some((w) => w.j !== A && m.legami[w.k].o === 3 && m.atomi[w.j].Z !== 6) || m.vic[L].some((w) => w.j !== A && m.atomi[w.j].Z === 6 && m.vic[w.j].some((z) => m.legami[z.k].o >= 2 && m.atomi[z.j].Z !== 6 && !m.legami[z.k].ar))));
          if (!uscente) continue; const g = base(); g.atomi[B].h--; ordine(g, A, L, -1); g.atomi[L].h++; ordine(g, A, B, 1); senzaStereo(g, A, B, L); metti('eliminazione', g, { p: acido ? acido.p : 16, carbonio: X.Z === 6 || b.Z === 6 }); }
        // deidrogenazione: H–A–B–H → A=B + H2 (B eteroatomo)
        if (ETERO.has(b.Z) && l.o === 1 && m.atomi[A].h > 0 && m.atomi[A].Z !== 1) { const g = base(); g.atomi[B].h--; g.atomi[A].h--; ordine(g, A, B, 1); g.atomi.push({ Z: 1, q: 0, h: 1 }); senzaStereo(g, A, B); metti('deidrogenazione', g); } } });
    // eliminazione di CO (l'inversa dell'addizione al carbonio di CO): H–C(=X)–Nu → C≡X + H–Nu, e H2C=X → C≡X + H2
    m.atomi.forEach((a, C) => { if (a.Z !== 6 || !a.h || a.q || a.ar) return; const dx = m.vic[C].find((v) => m.legami[v.k].o === 2 && (m.atomi[v.j].Z === 8 || m.atomi[v.j].Z === 7) && !m.atomi[v.j].q && m.vic[v.j].length + m.atomi[v.j].h === (m.atomi[v.j].Z === 8 ? 1 : 2)); if (!dx || m.vic[C].length + a.h !== 3) return;
      for (const vn of m.vic[C]) { if (vn.j === dx.j || m.legami[vn.k].o !== 1 || !(ETERO.has(m.atomi[vn.j].Z) || ALOGENI.has(m.atomi[vn.j].Z))) continue; const g = base(); g.atomi[C].h--; g.atomi[vn.j].h++; ordine(g, C, vn.j, -1); ordine(g, C, dx.j, 1); g.atomi[C].q = -1; g.atomi[dx.j].q = 1; metti('eliminazione di CO', g); }
      if (a.h === 2) { const g = base(); g.atomi[C].h -= 2; ordine(g, C, dx.j, 1); g.atomi[C].q = -1; g.atomi[dx.j].q = 1; g.atomi.push({ Z: 1, q: 0, h: 1 }); metti('eliminazione di CO', g); } });
    // tautomeria: H–X–A=B → X=A–B–H
    for (const p of s.pi) for (const [A, B] of [[p.A, p.B], [p.B, p.A]]) for (const vx of m.vic[A]) { const X = vx.j, lx = m.legami[vx.k]; if (X === B || lx.t !== 'c' || lx.o !== 1 || !m.atomi[X].h || m.atomi[X].Z === 1) continue; if (!(ETERO.has(m.atomi[X].Z) || ETERO.has(m.atomi[B].Z))) continue;
      const g = base(); g.atomi[X].h--; g.atomi[B].h++; ordine(g, A, B, -1); ordine(g, X, A, 1); senzaStereo(g, X, A, B); metti('tautomeria', g); }
    // chiusure d'anello (5 o 6 atomi): addizione e sostituzione dentro la stessa molecola
    for (const d of s.donatori) { if (d.tipo === 'H2') continue;
      for (const p of s.pi) { if (!p.polare || d.k === p.A || d.k === p.B) continue; const n = distanzaNelGrafo(m, d.k, p.A); if (n !== 4 && n !== 5) continue; const g = base(); g.atomi[d.k].h--; g.atomi[p.B].h++; ordine(g, p.A, p.B, -1); ordine(g, d.k, p.A, 1); senzaStereo(g, p.A, d.k); metti(d.tipo === 'carbonio' ? 'addizione C' : 'addizione', g, { p: d.p, pb: d.pb, anello: n + 1 }); }
      if (d.tipo === 'eteroatomo') for (const u of s.uscenti) { if (d.k === u.L || d.k === u.A) continue; const n = distanzaNelGrafo(m, d.k, u.A); if (n !== 4 && n !== 5) continue; const g = base(); g.atomi[d.k].h--; ordine(g, u.A, u.L, -1); g.atomi[u.L].h++; ordine(g, d.k, u.A, 1); senzaStereo(g, u.A); metti('sostituzione', g, { p: d.p, pb: d.pb, anello: n + 1, classe: u.classe }); } }
    // omolisi: ogni legame semplice fuori dagli anelli si può spezzare in due radicali (con il calore, o con un fotone)
    if (radicali) { const inAnello = new Set(anelli(m).flat());
      m.legami.forEach((l) => { if (l.t !== 'c' || l.o !== 1 || (inAnello.has(l.a) && inAnello.has(l.b))) return; const g = base(); ordine(g, l.a, l.b, -1); senzaStereo(g, l.a, l.b); metti('omolisi', g, { legame: [m.atomi[l.a].Z, m.atomi[l.b].Z] }, { radicali: true }); });
      m.atomi.forEach((a, k) => { if (!a.h || (a.Z === 1 && a.h < 1)) return; const g = base(); g.atomi[k].h--; g.atomi.push({ Z: 1, q: 0, h: 0 }); senzaStereo(g, k); metti('omolisi', g, { legame: [a.Z, 1] }, { radicali: true }); }); }
    return [...out.values()];
  }
  // --- due molecole
  const { grezzo: G0, inizio } = unisci(m1, m2), s1 = siti(m1), s2 = siti(m2), nuovo = () => ({ atomi: G0.atomi.map((a) => ({ ...a, ord: a.ord ? a.ord.slice() : null })), legami: G0.legami.map((l) => ({ ...l })) });
  for (const [sd, se, od, oe, md, me] of [[s1, s2, inizio[0], inizio[1], m1, m2], [s2, s1, inizio[1], inizio[0], m2, m1]]) {
    for (const d of sd.donatori) { const n = d.k + od;
      // addizione a un legame π polare (o qualsiasi, per H2)
      for (const p of se.pi) { if (!p.polare && d.tipo !== 'H2') continue; const A = p.A + oe, B = p.B + oe, g = nuovo();
        if (d.tipo === 'H2') { g.atomi[A].h++; g.atomi[B].h++; ordine(g, A, B, -1); senzaStereo(g, A, B); togli(g, n); metti('idrogenazione', g); continue; }
        g.atomi[n].h--; g.atomi[B].h++; ordine(g, A, B, -1); ordine(g, n, A, 1); senzaStereo(g, A, n); metti(d.tipo === 'carbonio' ? 'addizione C' : 'addizione', g, { p: d.p, pb: d.pb }); }
      // addizione al carbonio di CO o di un isonitrile: prende H e Nu tutti e due
      for (const c of se.carbeni) { const C = c.C + oe, X = c.X + oe, g = nuovo(); g.atomi[C].q = 0; g.atomi[X].q = 0; ordine(g, C, X, -1);
        if (d.tipo === 'H2') { g.atomi[C].h += 2; togli(g, n); } else { g.atomi[n].h--; g.atomi[C].h++; ordine(g, n, C, 1); } metti('addizione a CO', g, { p: d.p }); }
      // sostituzione: Nu–H + A–L → Nu–A + L–H
      if (d.tipo === 'eteroatomo') for (const u of se.uscenti) { const A = u.A + oe, L = u.L + oe, g = nuovo(); g.atomi[n].h--; ordine(g, A, L, -1); g.atomi[L].h++; ordine(g, n, A, 1); senzaStereo(g, A); metti('sostituzione', g, { p: d.p, pb: d.pb, classe: u.classe }); } }
    // inserzione di CO in un legame C–X (solo su un metallo che lo attivi: lo dice velocita)
    for (const c of sd.carbeni) for (const u of se.uscenti.concat(me.atomi.flatMap((a, k) => (a.Z === 6 && !a.ar ? me.vic[k].filter((v) => me.legami[v.k].o === 1 && (ETERO.has(me.atomi[v.j].Z) || ALOGENI.has(me.atomi[v.j].Z))).map((v) => ({ A: k, L: v.j })) : [])))) {
      const C = c.C + od, X = c.X + od, A = u.A + oe, L = u.L + oe, g = nuovo(); g.atomi[C].q = 0; g.atomi[X].q = 0; ordine(g, C, X, -1); ordine(g, A, L, -1); ordine(g, A, C, 1); ordine(g, C, L, 1); senzaStereo(g, A); metti('inserzione di CO', g); }
    // radicali: ricombinazione, strappo di un H, addizione a un legame π
    if (radicali) for (const r of sd.radicali) { const n = r + od;
      for (const r2 of se.radicali) { const g = nuovo(); ordine(g, n, r2 + oe, 1); metti('ricombinazione', g, {}, { radicali: true }); }
      me.atomi.forEach((a, k) => { if (!a.h || a.r) return; const g = nuovo(); if (md.atomi[r].Z === 1 && !md.atomi[r].h && a.Z === 1) return; g.atomi[k + oe].h--; g.atomi[n].h++; metti('strappo di H', g, {}, { radicali: true }); });
      for (const p of se.pi) for (const [A, B] of [[p.A, p.B], [p.B, p.A]]) { const g = nuovo(); ordine(g, A + oe, B + oe, -1); ordine(g, n, A + oe, 1); metti('addizione radicalica', g, {}, { radicali: true }); } }
    // trasferimento di protone: un acido (pKa < 16) a una coppia solitaria
    if (protoni) for (const d of sd.donatori) { if (d.p > 16) continue; for (const b of se.coppie) { const g = nuovo(); g.atomi[d.k + od].h--; g.atomi[d.k + od].q--; g.atomi[b + oe].h++; g.atomi[b + oe].q++; const p = (() => { try { const mm = molecola(g); return valida(mm).ok ? componenti(mm).map(chiave).sort() : null; } catch { return null; } })(); if (p) out.set('protone>' + p.join('.'), { tipo: 'protone', reagenti: reag, prodotti: p, p: d.p }); } }
    // complessazione: uno ione metallico prende la coppia solitaria di un donatore (legame dativo)
    if (metalli && md.atomi.length === 1 && atomo(md.atomi[0].Z).metallo && md.atomi[0].q > 0) for (const b of se.coppie) { const g = nuovo(); g.legami.push({ a: b + oe, b: od, o: 1, t: 'd' }); const p = (() => { try { const mm = molecola(g); return valida(mm).ok ? [chiave(mm)] : null; } catch { return null; } })(); if (p) out.set('complessazione>' + p[0], { tipo: 'complessazione', reagenti: reag, prodotti: p, donatore: me.atomi[b].Z, caricaDonatore: me.atomi[b].q }); }
  }
  return [...out.values()];
}
// gli atomi e la carica di un lato di una reazione (per la prova di conservazione)
export function bilancio(lista) { const tot = {}; let q = 0; for (const k of lista) { const c = conta(k); for (const e in c) tot[e] = (tot[e] || 0) + c[e]; q += carica(k); } return { atomi: tot, carica: q }; }
export const conservata = (r) => { const a = bilancio(r.reagenti), b = bilancio(r.prodotti); return a.carica === b.carica && Object.keys({ ...a.atomi, ...b.atomi }).every((e) => a.atomi[e] === b.atomi[e]); };

// ---------- catalisi: regole generali
// condizioni = { T, pH, solvente, attivitaAcqua, ioni: { 'Mg+2': mol/L, 'Fe+2': … }, minerali: ['solfuro di ferro', 'argilla', …] }
//  1. ACIDO E BASE (in acqua): un nucleofilo reagisce tanto più in fretta quanto più è basico (Brønsted, pendenza 0,6),
//     e a un pH c'è una parte di lui senza il protone: la somma delle due forme. Per l'acqua: ×(1 + 10^(pH − 5,6)). In
//     più la catalisi acida (il protone sull'elettrofilo): ×(1 + 10^(7,6 − pH)), dal rapporto k_H/k_neutra dell'acetato di etile.
//  2. IONI METALLICI: uno ione che coordina l'ossigeno o l'azoto dell'elettrofilo gli toglie elettroni: per la parte di
//     substrato che lo lega (K·[M], K dalla regola di complesso() qui sotto) la velocità cresce di 10^(1,5·carica)
//     [PARAMETRO LIBERO: 1,5; l'ordine di grandezza è quello degli acidi di Lewis in soluzione, 10³ per uno ione 2+].
//  3. SUPERFICI: un minerale con un metallo a guscio d incompleto (solfuri e ossidi di ferro e nichel, il metallo
//     nativo) spezza H–H e lega CO: la barriera intrinseca di idrogenazioni e inserzioni scende da 230 a 105 kJ/mol; le
//     argille e gli altri minerali con cariche in superficie concentrano i reagenti: ×30 [PARAMETRO LIBERO].
const METALLI_D = /ferro|nichel|magnetite|pirite|greigite|awaruite|troilite|cobalto|solfuro/i;
export const complesso = logKComplesso;
export function catalisi(r, c = {}) {
  const pH = c.pH ?? 7, acqua = c.solvente === 'acqua'; let f = 1; const perche = [];
  if (acqua && ['addizione', 'addizione C', 'sostituzione', 'eliminazione', 'tautomeria'].includes(r.tipo)) {
    // la forma neutra del nucleofilo (basicità pb: 0 per l'acqua) e quella senza protone (basicità p = il suo pKa): ognuna
    // pesa 10^(0,6·basicità) per la parte di molecole che a quel pH sono in quella forma; un carbonio acido reagisce solo senza protone
    const p = Math.min(r.p ?? 14, 30), pb = r.pb ?? 0, generico = ['tautomeria', 'eliminazione'].includes(r.tipo);
    const neutro = r.tipo === 'addizione C' ? 0 : generico ? 1 : Math.pow(10, BRONSTED * pb) / (1 + Math.pow(10, pb - pH)), anione = generico ? Math.pow(10, pH - 5.6) : Math.pow(10, BRONSTED * p) / (1 + Math.pow(10, p - pH)), acido = r.tipo === 'addizione C' ? 0 : Math.pow(10, 7.6 - pH);
    f = neutro + anione + acido; perche.push(`acido-base ×${f.toExponential(1)}`);
    for (const ione in c.ioni || {}) { const mm = /^([A-Z][a-z]?)\+?(\d*)$/.exec(ione.replace(/[[\]]/g, '')); if (!mm) continue; const q = +(mm[2] || 1), Z = atomo(mm[1]).Z, K = Math.pow(10, complesso(Z, q, 8, 0)), legato = (K * c.ioni[ione]) / (1 + K * c.ioni[ione]); const g = legato * Math.pow(10, 1.5 * q); if (g > 0.1) { f += g; perche.push(`${ione} ×${g.toExponential(1)}`); } }
  }
  const sup = (c.minerali || []).map(String);
  if (sup.length && acqua && ['sostituzione', 'addizione C', 'addizione'].includes(r.tipo)) { f *= 30; perche.push('superficie ×30'); }
  return { fattore: f, perche, metalloD: sup.some((s) => METALLI_D.test(s)) };
}

// ---------- velocita(reazione, condizioni) → { dG, dH, barriera (kJ/mol), k (avanti), kInversa, K, catalisi }
// k in 1/s se c'è un reagente solo, in L/(mol·s) se sono due (stato di riferimento 1 mol/L, o 1 bar in fase gas).
export function velocita(r, c = {}) {
  const T = c.T ?? 298.15, cond = { T, P: c.P ?? 1e5, solvente: c.solvente ?? null, pH: c.pH ?? 7, attivitaAcqua: c.attivitaAcqua ?? 1, misure: c.misure };
  const E = (k) => energia(k, cond), somma = (l, f) => l.reduce((s, k) => s + E(k)[f], 0);
  const dG = somma(r.prodotti, 'G') - somma(r.reagenti, 'G'), dH = somma(r.prodotti, 'H') - somma(r.reagenti, 'H'), cat = catalisi(r, c);
  let G0, k;
  if (r.tipo === 'omolisi') { G0 = null; const b = Math.max(dH, 0); k = KB_H * T * Math.exp(-b / (R * T)) * 30; return { dG, dH, barriera: b, k, kInversa: k * Math.exp(dG / (R * T)), K: Math.exp(-dG / (R * T)), catalisi: cat }; }
  if (r.tipo === 'ricombinazione') return { dG, dH, barriera: 0, k: 1e10, kInversa: 1e10 * Math.exp(dG / (R * T)), K: Math.exp(-dG / (R * T)), catalisi: cat };
  const famiglia = r.tipo === 'eliminazione' ? (r.carbonio ? 'addizione C' : 'addizione') : r.tipo === 'deidrogenazione' ? 'idrogenazione' : r.tipo === 'eliminazione di CO' ? 'addizione a CO' : ['strappo di H', 'addizione radicalica'].includes(r.tipo) ? 'radicale' : r.tipo;
  G0 = INTRINSECHE[famiglia] ?? 100;
  if ((famiglia === 'idrogenazione' || famiglia === 'inserzione di CO' || famiglia === 'addizione a CO') && cat.metalloD) G0 = famiglia === 'inserzione di CO' ? INTRINSECHE['inserzione di CO'] : INTRINSECHE['idrogenazione su metallo'];
  else if (famiglia === 'inserzione di CO') G0 = 300; // senza un metallo che leghi CO non avviene
  // Marcus: ΔG‡ = G0·(1 + ΔG/4G0)², tra 0 e |ΔG|
  const x = dG / (4 * G0), barriera = x <= -1 ? 0 : x >= 1 ? dG : G0 * (1 + x) * (1 + x);
  k = Math.min(1e10, KB_H * T * Math.exp(-barriera / (R * T)) * cat.fattore);
  return { dG, dH, barriera, k, kInversa: k * Math.exp(dG / (R * T)), K: Math.exp(-dG / (R * T)), catalisi: cat };
}

// ---------- fotochimica: un fotone abbastanza energetico, se è assorbito, rompe un legame
// L'assorbimento vuole un cromoforo. LEGGE EMPIRICA: l'energia della prima transizione per tipo di elettroni (dati
// dagli spettri ultravioletti: H2O 185 nm, ammine 220 nm, H2S e tioli 260 nm, C=O 320 nm (debole), C=C 180 nm, dieni
// 217 nm, aromatici 255 nm, C≡N 190 nm, alcani 150 nm) e una sezione d'urto tipica (10⁻¹⁸ cm², 10⁻²⁰ per C=O).
// luce = { Tstella (K), diluizione ((R★/d)², adimensionale), trasmissione: (nm) → 0…1 }: lo spettro è quello di un corpo nero.
const soglia = (m) => { let nm = 150, sez = 1e-18; const pi = m.legami.filter((l) => l.o >= 2 && l.t === 'c'), aromatico = m.atomi.some((a) => a.ar);
  for (const a of m.atomi) { if (a.Z === 8 && a.h + m.atomi.length > 0 && !pi.length) nm = Math.max(nm, 185); if (a.Z === 7 && !pi.length) nm = Math.max(nm, 220); if (a.Z === 16) nm = Math.max(nm, 260); if (a.Z === 17) nm = Math.max(nm, 200); if (a.Z === 35) nm = Math.max(nm, 260); }
  if (pi.some((l) => l.o === 3)) nm = Math.max(nm, 190); if (pi.some((l) => l.o === 2 && m.atomi[l.a].Z === 6 && m.atomi[l.b].Z === 6)) nm = Math.max(nm, pi.length > 1 ? 217 : 180); if (aromatico) nm = Math.max(nm, 255);
  if (pi.some((l) => l.o === 2 && (m.atomi[l.a].Z === 8 || m.atomi[l.b].Z === 8) && !l.ar && (m.atomi[l.a].Z === 6 || m.atomi[l.b].Z === 6) && m.atomi.length > 3)) { if (nm < 320) sez = 1e-20; nm = Math.max(nm, 320); }
  return { nm, sez }; };
// fotoni per cm² e per secondo sotto una lunghezza d'onda (corpo nero diluito)
export function fotoni(luce, nmMax, nmMin = 90) { const T = luce.Tstella ?? 5772, dil = luce.diluizione ?? 2.16e-5; let n = 0; const passo = 2;
  for (let l = nmMin; l < nmMax; l += passo) { const lam = (l + passo / 2) * 1e-7, x = 1.438777 / (lam * T); n += ((2 * Math.PI * 2.99792458e10) / lam ** 4 / Math.expm1(x)) * passo * 1e-7 * dil * (luce.trasmissione ? luce.trasmissione(l) : 1); } return n; }
export function fotolisi(x, luce = {}) {
  const m = molecola(x), { nm, sez } = soglia(m), out = [];
  for (const r of reazioni(m, null, { radicali: true })) { if (r.tipo !== 'omolisi') continue; const dH = r.prodotti.reduce((s, k) => s + entalpiaGas(k).H, 0) - entalpiaGas(m).H, nmLegame = 119627 / Math.max(dH, 1), fino = Math.min(nm, nmLegame); // (E = 119627 kJ·nm/mol / λ)
    out.push({ ...r, tipo: 'fotolisi', energiaDiLegame: dH, sottoNm: fino, J: fotoni(luce, fino) * sez * 0.5 }); }
  return out.sort((a, b) => a.energiaDiLegame - b.energiaDiLegame);
}
export { neutra };
