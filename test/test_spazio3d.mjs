// test_spazio3d.mjs — il mondo in tre dimensioni e nel tempo: le orbite e gli assi (orbite.js), lo stato di un sistema,
// di una galassia e del cosmo a un tempo qualunque (spazio3d.js, cosmo3d.js), le scene per il motore
import assert from 'node:assert/strict';
import { V, statoKeplero, periodo, elementiPianeta, assePianeta, elementiLuna, asseStella, anomaliaEccentrica, assiOrbita, ORBITE } from '../src/camera/orbite.js';
import * as S3 from '../src/camera/spazio3d.js';
import * as CO from '../src/camera/cosmo.js';
import { sorgente } from '../src/camera/eventi.js';
import { ANNO, UA, COSTANTI, LSOLE, COSMO } from '../src/camera/leggi.js';
import * as GA from '../src/camera/galassie.js';

let ok = 0; const T0 = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const gradi = (r) => (r * 180) / Math.PI, G = COSTANTI.G, MSOLE = 1.989e30, GIORNO = 86400;

// ---------- i corpi veri
const SOLE_KG = MSOLE, TERRA = { aM: UA, eccentricita: 0.0167, fase: 1.1, massaKg: 5.972e24, Mstella: SOLE_KG, raggioM: 6.371e6, giorno: 86164, obliquita: 23.44, retrogrado: false, bloccato: false, risonanza: null };
const MERCURIO = { aM: 0.3871 * UA, eccentricita: 0.2056, fase: 4, massaKg: 3.30e23, Mstella: SOLE_KG, raggioM: 2.44e6, giorno: 58.646 * GIORNO, obliquita: 0, retrogrado: false, bloccato: false, risonanza: '3:2' };
const LUNA = { id: 0, origine: 'urto', massaKg: 7.35e22, raggioM: 1.737e6, aM: 3.844e8, eccentricita: 0.0549, retrograda: false };

prova('Keplero: la Terra fa il giro in un anno, più svelta al perielio; energia e momento angolare si conservano', () => {
  const c = sorgente('prova/terra'), el = elementiPianeta(TERRA, c);
  tra(periodo(el) / GIORNO, 365.2, 365.3, 'anno della Terra (giorni: 365,26)');
  const E0 = (k) => V.scalare(k.vel, k.vel) / 2 - el.mu / V.norma(k.pos), h0 = V.croce(statoKeplero(el, 0).pos, statoKeplero(el, 0).vel);
  let vmax = 0, vmin = Infinity, rmin = Infinity, rmax = 0;
  for (let q = 0; q < 400; q++) { const k = statoKeplero(el, (q / 400) * periodo(el)), v = V.norma(k.vel), r = V.norma(k.pos); vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
    tra(E0(k) / E0(statoKeplero(el, 0)), 1 - 1e-10, 1 + 1e-10, 'energia'); const h = V.croce(k.pos, k.vel); assert.ok(V.norma(V.meno(h, h0)) < 1e-9 * V.norma(h0), 'momento angolare'); }
  tra(vmax / 1e3, 30.2, 30.4, 'velocità al perielio (km/s: 30,29)'); tra(vmin / 1e3, 29.2, 29.4, 'all\'afelio (29,29)'); tra(rmin / UA, 0.983, 0.984, 'perielio (UA)'); tra(rmax / UA, 1.0166, 1.0168, 'afelio');
  // dopo un giro è tornata dov'era; a t = 0 sta alla longitudine di oggi (la `fase` della mappa piatta)
  const a = statoKeplero(el, 0), b = statoKeplero(el, periodo(el)); assert.ok(V.norma(V.meno(a.pos, b.pos)) < 1e-6 * UA);
  tra(Math.atan2(a.pos[1], a.pos[0]), TERRA.fase - 1e-9, TERRA.fase + 1e-9, 'longitudine a t = 0'); assert.ok(V.croce(a.pos, a.vel)[2] > 0, 'gira nel verso antiorario della mappa');
  // l'equazione di Keplero è risolta anche per orbite molto allungate
  for (const e of [0, 0.3, 0.9, 0.99]) for (const M of [0.01, 1, 3, 6]) { const E = anomaliaEccentrica(M, e); assert.ok(Math.abs(E - e * Math.sin(E) - M) < 1e-10); }
  tra(gradi(el.i), 0, 3, 'inclinazione della Terra dalla ripartizione (gradi; vera: 1,6 sul piano invariabile)');
});

prova('gli assi: l\'obliquità è l\'angolo con la normale all\'orbita; il giorno; Mercurio fa tre giri ogni due anni', () => {
  const c = sorgente('prova/terra'), el = elementiPianeta(TERRA, c), ax = assePianeta(TERRA, el, c);
  tra(gradi(Math.acos(V.scalare(ax.asse, el.normale))), 23.44 - 1e-6, 23.44 + 1e-6, 'obliquità'); tra(V.norma(ax.asse), 1 - 1e-12, 1 + 1e-12, 'versore');
  tra((ax.angolo(86164) - ax.angolo(0)) / (2 * Math.PI), 1 - 1e-12, 1 + 1e-12, 'un giro in un giorno siderale');
  const retro = assePianeta({ ...TERRA, obliquita: 3, retrogrado: true }, el, c); tra(gradi(Math.acos(V.scalare(retro.asse, el.normale))), 176.99, 177.01, 'chi gira al contrario ha l\'asse rovesciato (Venere: 177°)');
  // Mercurio: agganciato 3:2; al pericentro il meridiano 0 guarda il Sole, un'orbita dopo quello opposto
  const cm = sorgente('prova/mercurio'), em = elementiPianeta(MERCURIO, cm), am = assePianeta(MERCURIO, em, cm), Tm = periodo(em), tPeri = (-em.M0 / (2 * Math.PI)) * Tm;
  tra((am.angolo(tPeri + 2 * Tm) - am.angolo(tPeri)) / (2 * Math.PI), 3 - 1e-9, 3 + 1e-9, 'tre giri in due anni'); tra(am.giorno / GIORNO, 58.6, 58.7, 'giorno siderale di Mercurio (58,65)');
  const meridiano = (t) => { const a = am.angolo(t); return V.somma(V.per(am.terna[0], Math.cos(a)), V.per(am.terna[1], Math.sin(a))); }, sole = (t) => V.versore(V.per(statoKeplero(em, t).pos, -1));
  tra(V.scalare(meridiano(tPeri), sole(tPeri)), 0.999, 1.0001, 'al pericentro il meridiano 0 guarda il Sole'); tra(V.scalare(meridiano(tPeri + Tm), sole(tPeri + Tm)), -1.0001, -0.999, 'un anno dopo, quello opposto');
  // un pianeta bloccato mostra sempre lo stesso meridiano (orbita tonda)
  const B = { ...TERRA, eccentricita: 0, bloccato: true, obliquita: 0 }, eb = elementiPianeta(B, c), ab = assePianeta(B, eb, c);
  for (const f of [0, 0.2, 0.7]) { const t = f * periodo(eb), a = ab.angolo(t), m = V.somma(V.per(ab.terna[0], Math.cos(a)), V.per(ab.terna[1], Math.sin(a))); tra(V.scalare(m, V.versore(V.per(statoKeplero(eb, t).pos, -1))), 1 - 1e-9, 1 + 1e-9, 'bloccato: il meridiano 0 verso la stella'); }
});

prova('le lune: quelle dell\'urto e del disco nel piano dell\'equatore, le catturate inclinate e spesso al contrario', () => {
  const c = sorgente('prova/terra'), el = elementiPianeta(TERRA, c), ax = assePianeta(TERRA, el, c), eL = elementiLuna(TERRA, LUNA, ax, el, 0.7, c.sotto('luna 0'));
  tra(periodo(eL) / GIORNO, 27.2, 27.5, 'mese siderale (giorni: 27,32)'); tra(gradi(Math.acos(V.scalare(eL.normale, ax.asse))), 0, 8, 'inclinazione sull\'equatore del pianeta (gradi)');
  tra(V.norma(statoKeplero(eL, 0).vel) / 1e3, 0.95, 1.1, 'velocità della Luna (km/s: 1,02)');
  let retro = 0, vietate = 0; const N = 400;
  for (let k = 0; k < N; k++) { const L = { ...LUNA, origine: 'cattura', eccentricita: 0.3, retrograda: k % 2 === 0 }, e = elementiLuna(TERRA, L, ax, el, 1, sorgente(`prova/catturata ${k}`)), i = gradi(Math.acos(V.scalare(e.normale, el.normale)));
    if (i > 90) retro++; if (i > ORBITE.kozai[0] + 1e-6 && i < ORBITE.kozai[1] - 1e-6) vietate++; assert.equal(i > 90, L.retrograda); assert.ok(V.croce(statoKeplero(e, 0).pos, statoKeplero(e, 0).vel)[2] !== 0); }
  assert.equal(vietate, 0, 'nessuna catturata nella fascia di Kozai'); assert.equal(retro, N / 2);
});

// ---------- i sistemi veri del cosmo
const LUOGHI = []; { const visti = new Set(); for (let n = 7; n < 400000 && LUOGHI.length < 60; n += 3301) { const a = CO.indirizzoDi(n), k = `${a.cosmo}/${a.galassia}/${a.stella}`; if (!visti.has(k)) { visti.add(k); LUOGHI.push(a); } } }

prova('i sistemi veri: a t = 0 ogni pianeta sta dove la mappa piatta lo mette; inclinazioni di pochi gradi; il baricentro è fermo', () => {
  const incl = [], assi = []; let pianeti = 0, lune = 0, bloccati = 0;
  for (const a of LUOGHI) {
    const Sis = CO.sistema(a.cosmo, a.galassia, a.stella), st = S3.statoSistema(a.cosmo, a.galassia, a.stella, 0), E = S3.elementiSistema(a.cosmo, a.galassia, a.stella);
    assert.equal(st.fase, 'pianeti'); assert.equal(st.pianeti.length, Sis.pianeti.length);
    // il baricentro: la quantità di moto totale è nulla, e il centro di massa è nell'origine
    let m = st.stella.massaKg; const q = V.per(st.stella.vel, st.stella.massaKg), c = V.per(st.stella.pos, st.stella.massaKg);
    for (const p of st.pianeti) for (const b of [p, ...p.lune]) { m += b.massaKg; for (let d = 0; d < 3; d++) { q[d] += b.massaKg * b.vel[d]; c[d] += b.massaKg * b.pos[d]; } }
    const vTip = st.pianeti.length ? V.norma(st.pianeti[0].vel) : 1; assert.ok(V.norma(q) / m < 1e-9 * vTip && V.norma(c) / m < 1e-9 * (Sis.pianeti[0]?.aM || 1), 'baricentro fermo nell\'origine');
    for (const p of st.pianeti) {
      const P = Sis.pianeti[p.id], rel = V.meno(p.pos, st.stella.pos); pianeti++;
      // la direzione nel piano è la `fase` (a meno del piccolo dondolio attorno al baricentro con le lune); la distanza è entro e·a
      const dfi = Math.atan2(rel[1], rel[0]) - P.fase, scarto = Math.abs(Math.atan2(Math.sin(dfi), Math.cos(dfi))); assert.ok(scarto < 2e-3 + 0.02 * (p.lune.length ? 1 : 0), `pianeta ${p.id}: a ${scarto} rad dalla fase`);
      tra(V.norma(rel) / P.aM, 1 - P.eccentricita - 0.01, 1 + P.eccentricita + 0.01, 'distanza dalla stella / semiasse');
      const el = E.pianeti[p.id].el; incl.push(gradi(el.i)); tra(periodo(el) / P.anno, 0.999, 1.001, 'il periodo è l\'anno di cosmo.js');
      const ob = gradi(Math.acos(Math.max(-1, Math.min(1, V.scalare(p.asse, el.normale))))); tra(ob - (P.retrogrado ? 180 - P.obliquita : P.obliquita), -1e-4, 1e-4, 'obliquità'); if (!P.bloccato) assi.push(ob); else bloccati++;
      tra(p.giorno / P.giorno, 1 - 1e-9, 1 + 1e-9, 'il giorno è quello di cosmo.js');
      for (const l of p.lune) { lune++; const L = P.lune[l.id], d = V.norma(V.meno(l.pos, p.pos)); tra(d / L.aM, 1 - L.eccentricita - 0.02, 1 + L.eccentricita + 0.02, 'distanza della luna / semiasse'); assert.ok(d > P.raggioM, 'una luna dentro il pianeta'); }
    }
    for (const b of [st.stella, ...st.pianeti]) { tra(V.norma(b.asse), 1 - 1e-9, 1 + 1e-9, 'asse'); assert.ok(Number.isFinite(b.angolo)); }
    assert.equal(JSON.stringify(S3.statoSistema(a.cosmo, a.galassia, a.stella, 0)), JSON.stringify(st), 'determinismo');
  }
  assert.ok(pianeti > 150 && lune > 50, `${pianeti} pianeti, ${lune} lune`);
  tra(mediana(incl), 0.05, 6, 'inclinazione mediana delle orbite (gradi; nel Sistema Solare: 1–2, Mercurio 6)'); tra(Math.max(...incl), 0, 70, 'la più inclinata');
  console.log(`      (${LUOGHI.length} sistemi, ${pianeti} pianeti, ${lune} lune; inclinazioni: mediana ${num(mediana(incl))}°, il 90% sotto ${num([...incl].sort((x, y) => x - y)[Math.floor(0.9 * incl.length)])}°, massima ${num(Math.max(...incl))}°; assi: mediana ${num(mediana(assi))}°, ${bloccati} bloccati)`);
});

prova('nel tempo: i pianeti corrono lungo le orbite, i giorni passano; nel passato lo stesso mondo, prima', () => {
  const a = LUOGHI.find((x) => { const S = CO.sistema(x.cosmo, x.galassia, x.stella); return S.pianeti.length >= 3 && S.stella.stato === 'in vita' && S.stella.eta > 1e9; }), Sis = CO.sistema(a.cosmo, a.galassia, a.stella), P = Sis.pianeti[0];
  const st = (t) => S3.statoSistema(a.cosmo, a.galassia, a.stella, t), s0 = st(0), rel = (s, k) => V.meno(s.pianeti[k].pos, s.stella.pos);
  // un quarto d'anno dopo il primo pianeta ha girato di circa 90°; un anno dopo è tornato
  // (su un'orbita ellittica non sono 90° esatti: l'anomalia vera è ν = M + 2e·sin M + (5/4)e²·sin 2M + …, e tra M e M + 90°
  // la differenza delle due «equazioni del centro» vale al più 2√2·e + (5/2)·e² radianti, cioè 162·e gradi e non 115·e come
  // chiedeva questa prova: a M = −45° il pianeta passa dal perielio proprio a metà del quarto d'anno. Il grado in più è il
  // dondolio del pianeta attorno al baricentro con le sue lune. Più sotto, lo stesso angolo dall'equazione di Keplero.)
  const q = st(P.anno / 4), ang = Math.acos(V.scalare(V.versore(rel(s0, 0)), V.versore(rel(q, 0)))), ecc = P.eccentricita, centro = gradi(2 * Math.SQRT2 * ecc + 2.5 * ecc * ecc + 4 * ecc ** 3);
  tra(gradi(ang), 90 - centro - 1, 90 + centro + 1, 'dopo un quarto d\'anno (gradi)');
  { const el = s0.pianeti[0].elementi, vera = (M) => { const E = anomaliaEccentrica(M, el.e); return 2 * Math.atan2(Math.sqrt(1 + el.e) * Math.sin(E / 2), Math.sqrt(1 - el.e) * Math.cos(E / 2)); };
    const atteso = vera(el.M0 + Math.PI / 2) - vera(el.M0), giro = Math.atan2(Math.sin(atteso), Math.cos(atteso));
    tra(gradi(ang) - gradi(Math.abs(giro)), -1, 1, 'dopo un quarto d\'anno: angolo percorso − quello dell\'equazione di Keplero (gradi)'); }
  assert.ok(V.norma(V.meno(rel(st(P.anno), 0), rel(s0, 0))) < 1e-6 * P.aM, 'dopo un anno è tornato');
  // la velocità è la derivata della posizione
  { const h = 10, d = V.per(V.meno(st(h).pianeti[0].pos, st(-h).pianeti[0].pos), 1 / (2 * h)); assert.ok(V.norma(V.meno(d, s0.pianeti[0].vel)) < 1e-6 * V.norma(s0.pianeti[0].vel), 'velocità = derivata della posizione'); }
  tra((st(P.giorno).pianeti[0].angolo - s0.pianeti[0].angolo) / (2 * Math.PI), 1 - 1e-9, 1 + 1e-9, 'dopo un giorno ha fatto un giro');
  // un miliardo di anni fa: la stessa stella, più giovane; i pianeti c'erano già
  const prima = st(-1e9 * ANNO); tra(prima.eta, Sis.stella.eta - 1.0001e9, Sis.stella.eta - 0.9999e9, 'età'); assert.equal(prima.fase, 'pianeti'); assert.ok(prima.stella.L < s0.stella.L * 1.0001, 'la stella giovane era meno luminosa');
  // appena nata: il disco, e i pianeti non ancora formati; prima ancora: niente
  const giovane = st(-(Sis.stella.eta - 0.5 * Sis.disco.vita) * ANNO); assert.equal(giovane.fase, 'disco'); assert.ok(giovane.disco.gasRimasto > 0.4 && giovane.disco.gasRimasto < 0.6 && giovane.pianeti.some((p) => !p.formato));
  const mai = st(-(Sis.stella.eta + 1e6) * ANNO); assert.equal(mai.fase, 'non nata'); assert.equal(mai.pianeti.length, 0);
  // una nana bianca, prima di morire, era una stella viva con la massa di nascita, e i suoi pianeti le stavano più vicini
  const nb = LUOGHI.map((x) => ({ x, S: CO.sistema(x.cosmo, x.galassia, x.stella) })).find(({ S }) => S.stella.stato === 'nana bianca' && S.pianeti.length);
  if (nb) { const S = nb.S.stella, v = S3.statoSistema(nb.x.cosmo, nb.x.galassia, nb.x.stella, -(S.morta + 1e8) * ANNO), o = S3.statoSistema(nb.x.cosmo, nb.x.galassia, nb.x.stella, 0);
    assert.ok(v.stella.stato !== 'nana bianca' && v.stella.massaKg > o.stella.massaKg && v.stella.L > 10 * o.stella.L); tra(v.pianeti[0].elementi.a / o.pianeti[0].elementi.a, (S.massa / S.massaNascita) * 0.999, (S.massa / S.massaNascita) * 1.001, 'orbita di allora / di oggi = massa di oggi / di allora'); }
  // un ramo: il nodo di un pianeta va diversamente; cambia solo lui (e le sue lune), non gli altri pianeti
  const ev = `cosmo ${CO.cosmoBase(a.cosmo)}/galassia ${a.galassia}/stella ${a.stella}/pianeta 1/orbita/nodo`, r = S3.statoSistema(CO.cosmoCon(a.cosmo, { [ev]: 1 }), a.galassia, a.stella, 0);
  assert.notDeepEqual(r.pianeti[1].elementi.nodo, s0.pianeti[1].elementi.nodo); for (const k of [0, 2]) assert.ok(V.norma(V.meno(V.meno(r.pianeti[k].pos, r.stella.pos), rel(s0, k))) < 1e-9 * P.aM, `il pianeta ${k} non si è mosso`);
  assert.equal(JSON.stringify(CO.sistema(CO.cosmoCon(a.cosmo, { [ev]: 1 }), a.galassia, a.stella).pianeti.map((p) => [p.aM, p.fase, p.giorno])), JSON.stringify(Sis.pianeti.map((p) => [p.aM, p.fase, p.giorno])), 'il sistema di cosmo.js non cambia');
  console.log(`      (stella di ${num(Sis.stella.massa)} M☉, ${num(Sis.stella.eta / 1e9)} Ga: oggi ${num(s0.stella.L / LSOLE)} L☉, un miliardo di anni fa ${num(prima.stella.L / LSOLE)}; il disco è durato ${num(Sis.disco.vita / 1e6)} milioni di anni)`);
});

// ---------- la galassia
prova('una galassia come la Via Lattea: il disco è spesso ~300 pc e più spesso per le stelle vecchie; il Sole attraversa i bracci', () => {
  const c = sorgente('prova/via lattea'), F = GA.formaDaAlone({ massa: 1e12, spin: 0.04, fusioni: [] }, c), C = GA.cinematica(F), cat = GA.stelleGalassia(F, c, { quante: 6000 });
  let k8 = 0; while (k8 < GA.ANELLI - 1 && F.anelli.bordo[k8 + 1] < 8) k8++;
  tra(C.z0[k8] * 1000, 150, 600, 'spessore del disco a 8 kpc (pc: z₀ di sech²; il disco sottile vero ~300)'); tra(C.sigZ[k8], 6, 30, 'dispersione verticale a 8 kpc (km/s; vera: 15–20)'); tra(C.sigR[k8] / C.sigZ[k8], 1.5, 2.5, 'σ_R/σ_z');
  // le stelle del campione vicino al Sole: quanto salgono, e le vecchie più delle giovani (il disco si scalda con l'età)
  const vicine = cat.stelle.filter((s) => s.componente === 'disco' && !s.supernova).map((s) => ({ s, r: Math.hypot(...s.pos) * F.unitaKpc, m: GA.motoStella(F, s, c.sotto(`stella ${s.id}`)) })).filter((x) => x.r > 5 && x.r < 11);
  const alte = (v) => mediana(v.map((x) => x.m.altezza * 1000)), vecchie = vicine.filter((x) => x.s.eta > 7e9), giovani = vicine.filter((x) => x.s.eta < 3e9); assert.ok(vecchie.length > 100 && giovani.length > 40, `${vecchie.length} vecchie, ${giovani.length} giovani`);
  assert.ok(alte(vecchie) > 1.3 * alte(giovani), `le vecchie salgono a ${alte(vecchie)} pc, le giovani a ${alte(giovani)}`); tra(alte(vicine), 40, 600, 'altezza massima mediana (pc)');
  // a t = 0 sono dove le mette il catalogo; il moto conserva (quasi) il cerchio guida; la velocità è la derivata della posizione
  for (const x of vicine.filter((_, i) => i % 9 === 0)) {
    const a = x.m.stato(0); assert.ok(Math.hypot(a.pos[0] - x.s.pos[0] * F.unitaKpc, a.pos[1] - x.s.pos[1] * F.unitaKpc) < 1e-9, 'posizione di oggi');
    const h = 1e-6, b = x.m.stato(h), d = x.m.stato(-h), der = [0, 1, 2].map((q) => (b.pos[q] - d.pos[q]) / (2 * h) / GA.dentro.KMS); assert.ok(Math.hypot(...der.map((v, q) => v - a.vel[q])) < 0.02 * Math.hypot(...a.vel) + 0.5, `velocità ${a.vel} contro derivata ${der}`);
    tra(Math.hypot(a.vel[0], a.vel[1]) / GA.curvaRotazione(F, x.m.guida), 0.5, 1.5, 'gira circa alla velocità della curva di rotazione'); assert.ok(Math.abs(a.pos[2]) <= x.m.altezza * (1 + 1e-9));
  }
  // il verso: i bracci restano indietro. E girano con la loro velocità: dentro la corotazione le stelle li superano
  const s0 = vicine[0], L = (st) => st.pos[0] * st.vel[1] - st.pos[1] * st.vel[0]; assert.equal(Math.sign(L(s0.m.stato(0))), C.verso);
  const Om8 = GA.curvaRotazione(F, 8) / 8, rel = Math.abs(Om8 - C.velocitaBracci), traBracci = ((2 * Math.PI) / F.bracci.numero / (rel * GA.dentro.KMS)) * 1000; // milioni di anni tra un braccio e l'altro
  tra(C.corotazione, 2, 15, 'corotazione (kpc)'); tra(C.velocitaBracci, 10, 60, 'velocità dei bracci (km/s/kpc; Via Lattea: 20–30)'); tra(traBracci, 30, 2000, 'ogni quanto una stella a 8 kpc incontra un braccio (milioni di anni; il Sole: 100–200)');
  tra(Math.abs(GA.faseBraccioAlTempo(F, 8, 0.1) - GA.faseBraccioAlTempo(F, 8, 0) - C.verso * C.velocitaBracci * GA.dentro.KMS * 0.1), -1e-12, 1e-9, 'i bracci girano tutti insieme');
  // la forma continua: sul piano più densa che sopra; integrata in altezza ridà la colonna dell'anello; la polvere segue il gas e i metalli
  const D = GA.densitaGalassia(F), R = F.anelli.r[k8]; let col = 0; for (let z = -5; z < 5; z += 0.005) col += D.in3d(R, z + 0.0025, 0.3, 0).stelle * 0.005;
  let mediaOnda = 0; for (let q = 0; q < 64; q++) mediaOnda += D.in3d(R, 0, (q / 64) * 2 * Math.PI, 0).stelle / 64; const sulPiano = mediaOnda;
  assert.ok(sulPiano > 3 * D.in3d(R, 3 * C.z0[k8], 0, 0).stelle); tra(col / (F.anelli.sigmaStelle[k8] * (1 + F.bracci.contrasto * Math.cos(F.bracci.numero * (0.3 - GA.faseBraccio(F, R)))) + 2 * F.massaSferoide), 0.9, 1.1, 'la densità integrata in altezza / la colonna dell\'anello');
  const g = D.in3d(R, 0, 0, 0); tra(g.polvere / g.gas, 0.2 * GA.dentro.ZSOLE * F.anelli.Z[k8], GA.dentro.ZSOLE * F.anelli.Z[k8], 'polvere / gas');
  console.log(`      (a 8 kpc: z₀ ${num(C.z0[k8] * 1000)} pc, σ_z ${num(C.sigZ[k8])} km/s, σ_R ${num(C.sigR[k8])}; le stelle vecchie salgono a ${num(alte(vecchie))} pc, le giovani a ${num(alte(giovani))}; corotazione a ${num(C.corotazione)} kpc, bracci a ${num(C.velocitaBracci)} km/s/kpc, stelle a 8 kpc a ${num(Om8)}: un braccio ogni ${num(traBracci)} milioni di anni)`);
});

prova('le galassie vere nel tempo: le stelle girano, quelle non ancora nate non ci sono, i resti erano stelle', () => {
  const C = CO.cosmo(1), gid = C.galassie.findIndex((g) => g.forma.classe.startsWith('spirale')), Gx = CO.galassia(1, gid), U1 = Gx.forma.unitaM;
  const o = S3.statoGalassia(1, gid, 0); assert.equal(o.n, 2500);
  for (let i = 0; i < o.n; i += 7) { assert.ok(Math.hypot(o.pos[3 * i] / U1 - Gx.stelle[i].pos[0], o.pos[3 * i + 1] / U1 - Gx.stelle[i].pos[1]) < 1e-12, 'a t = 0, viste dall\'alto, sono quelle del catalogo'); assert.equal(o.stati[o.stato[i]], Gx.stelle[i].stato); assert.equal(o.esiste[i], 1); }
  // tra dieci milioni di anni le stelle del disco hanno girato di qualche grado, tutte nello stesso verso. (Il verso si legge
  // da due istanti solo finché la stella ha fatto meno di mezzo giro. Vicino al centro in dieci milioni di anni ne fa di più
  // — a 0,3 kpc un giro dura 7 milioni di anni —, e da quando gli anelli di galassie.js risolvono il centro il catalogo ha
  // stelle del disco anche lì. Si contano quelle sotto mezzo giro: Ω·t·1,35 < π, dove 1,35 = 1 + 2·0,15/0,85 è quanto
  // l'epiciclo, che motoStella tiene sotto 0,15 r, può far correre l'angolo più del cerchio guida)
  const dopo = S3.statoGalassia(1, gid, 1e7 * ANNO), verso = GA.cinematica(Gx.forma).verso; let nelVerso = 0, disco = 0;
  for (let i = 0; i < o.n; i++) { if (Gx.stelle[i].componente !== 'disco') continue; const rK = Math.max(1e-6, Math.hypot(o.pos[3 * i], o.pos[3 * i + 1]) / GA.dentro.KPC); if (1.35 * (GA.curvaRotazione(Gx.forma, rK) / rK) * GA.dentro.KMS * 0.01 >= Math.PI) continue; disco++; const a0 = Math.atan2(o.pos[3 * i + 1], o.pos[3 * i]), a1 = Math.atan2(dopo.pos[3 * i + 1], dopo.pos[3 * i]), d = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)); if (Math.sign(d) === verso) nelVerso++; }
  assert.ok(disco > 200 && nelVerso > 0.9 * disco, `${nelVerso} su ${disco} nel verso del disco`);
  // cinque miliardi di anni fa: chi è nato dopo non c'è; chi oggi è un resto giovane era una stella viva, più luminosa
  const prima = S3.statoGalassia(1, gid, -5e9 * ANNO); let nonNate = 0, eranoVive = 0;
  for (let i = 0; i < o.n; i++) { const S = Gx.stelle[i]; assert.equal(prima.esiste[i], S.eta > 5e9 ? 1 : 0); if (S.eta <= 5e9) nonNate++; else if (S.morta !== undefined && S.morta < 5e9) { eranoVive++; assert.ok(prima.stato[i] <= 1 && prima.L[i] > o.L[i], 'un resto di oggi, prima di morire, era una stella'); } else if (S.morta === undefined && S.massa > 0.1) assert.ok(prima.L[i] <= o.L[i] * 1.01 || o.stato[i] === 1, 'una stella da giovane è meno luminosa (le nane brune no: si raffreddano)'); }
  assert.ok(nonNate > 30 && eranoVive > 10, `${nonNate} non ancora nate, ${eranoVive} ancora vive`);
  assert.equal(JSON.stringify(Array.from(S3.statoGalassia(1, gid, 1e7 * ANNO).pos.slice(0, 60))), JSON.stringify(Array.from(dopo.pos.slice(0, 60))), 'determinismo');
  // gli assi: una terna destra; il disco gira attorno a z nel verso dichiarato
  const A = S3.assiGalassia(1, gid); tra(V.norma(A[2]), 1 - 1e-9, 1 + 1e-9, 'asse'); assert.ok(Math.abs(V.scalare(A[0], A[1])) < 1e-9 && V.norma(V.meno(V.croce(A[0], A[1]), A[2])) < 1e-9);
  console.log(`      (galassia ${gid + 1}, ${Gx.forma.classe}: 5 miliardi di anni fa ${nonNate} delle 2500 stelle non erano nate e ${eranoVive} resti erano stelle vive)`);
});

// ---------- il cosmo
prova('il cosmo in tre dimensioni (campo senza bordo): lo spettro vero, le galassie dove il campo dice, velocità di qualche centinaio di km/s', () => {
  const C = CO.cosmo(1), t0 = performance.now(), F = S3.campoCosmo(1), ms = performance.now() - t0, U = GA.dentro.U;
  tra(F.sigmaLunghe / F.sigmaOnde, 1 - 1e-3, 1 + 1e-3, 'lo scarto del campo lisciato a R_eq (somma dei livelli) / quello delle onde lunghe di galassie.js');
  // il vincolo: il campo filtrato vale l'altezza del picco di ogni galassia, lì dove sta (x e y sono quelle della carta)
  C.galassie.forEach((g, i) => { assert.equal(F.pos[i][0], g.pos[0]); assert.equal(F.pos[i][1], g.pos[1]); assert.ok(F.pos[i][2] >= 0 && F.pos[i][2] < 1); assert.ok(Math.abs(F.densitaLunga(F.pos[i]) - g.peso * F.sigmaOnde) < 1e-6, 'il campo nel punto della galassia'); });
  // la griglia è il campo (convoluzione per regione: esatta per i livelli fini, interpolata a 10⁻³ della loro parte per i grossi,
  // campo_pigro.js grigliaFFT: si chiede un millesimo dello scarto) e ha lo scarto dello spettro
  const tg = performance.now(), g = F.griglia(), msG = performance.now() - tg, n = g.n; for (const [x, y, z] of [[3, 7, 11], [40, 2, 63], [17, 33, 5]]) assert.ok(Math.abs(g.delta[z * n * n + y * n + x] - F.densita([x / n, y / n, z / n])) < 1e-3 * g.sigma, 'griglia = il campo nel punto');
  // la regione non è più un toro: la sua media non è zero e il suo scarto è un campione (~(1200/40)³ volumi di correlazione: ±0,9%, quattro scarti)
  let somma = 0; for (const v of g.delta) somma += v; const atteso = Math.sqrt(F.libero.varianza({ livello: F.livello })); assert.ok(Math.abs(somma / g.delta.length) < 0.05, 'media della regione piccola'); tra(g.sigma / atteso, 0.96, 1.04, 'scarto della griglia / dello spettro');
  // lo spettro: le onde lunghe sono DEBOLI (non forti come nella carta piatta): la potenza per ottava cresce con k
  const pk = (k) => U.potenza((2 * Math.PI * k) / F.latoMpc); assert.ok(pk(2) < pk(8) && pk(8) < pk(24), 'Δ²(k) cresce'); tra(pk(24), 0.01, 1, 'Δ² a 50 Mpc di lunghezza d\'onda');
  // la teoria lineare: la divergenza della velocità è −H₀·f·δ
  // (velocità e densità vengono da nuclei troncati ciascuno per conto suo: test_campo_pigro misura −∇·Ψ − δ = 0,06 scarti; qui quattro volte)
  for (const x of [[0.21, 0.52, 0.77], F.pos[3]]) { const h = 1e-4, d = [0, 1, 2].reduce((s, q) => { const a = x.slice(), b = x.slice(); a[q] += h; b[q] -= h; return s + (F.velocita(a)[q] - F.velocita(b)[q]) / (2 * h * F.latoMpc); }, 0); assert.ok(Math.abs(d + COSMO.H0 * F.f0 * F.densita(x)) < 0.25 * COSMO.H0 * F.f0 * g.sigma, 'divergenza'); }
  tra(F.f0 / Math.pow(COSMO.Om, 0.55), 0.97, 1.03, 'f = dlnD/dlna ≈ Ωm^0,55');
  const tv = performance.now(), vel = F.motiGalassie().map((v) => Math.hypot(...v)), msV = performance.now() - tv; let q2 = 0; const N = 300, c = sorgente('prova/punti'); for (let i = 0; i < N; i++) { const v = F.velocita([c(`x${i}`), c(`y${i}`), c(`z${i}`)]); q2 += v[0] ** 2 + v[1] ** 2 + v[2] ** 2; }
  tra(mediana(vel), 200, 800, 'velocità propria mediana delle galassie (km/s; il Gruppo Locale: 627)'); tra(Math.sqrt(q2 / N), 300, 800, 'velocità quadratica media della materia (km/s; vera: ~500–600)'); tra(Math.max(...vel), 300, 2500, 'la più veloce');
  // le galassie cadono verso dove c'è più materia: la velocità punta lungo il gradiente della densità (in media)
  // gli assi dalle coppie mareali: versori, e non tutti uguali
  const A = F.assiGalassie(); for (const a of A) tra(Math.hypot(...a.asse), 1 - 1e-9, 1 + 1e-9, 'asse'); assert.ok(Math.abs(A.reduce((s, a) => s + a.asse[2], 0) / A.length) < 0.4, 'gli assi non stanno tutti da una parte');
  // la nebbia: le galassie segnate sono un campione di milioni
  tra(F.vere, 1e5, 1e9, 'aloni veri nel toro pesanti almeno quanto il più piccolo dei segnati'); tra(F.peso * C.galassie.length / F.vere, 1 - 1e-9, 1 + 1e-9, 'peso × campione');
  // un ramo: la profondità di una galassia cambia solo dove sta lei (e il campo che la tiene), non le galassie di cosmo.js
  const n2 = CO.cosmoCon(1, { 'cosmo 1/galassia 5/profondità': 1 }), F2 = S3.campoCosmo(n2); assert.notEqual(F2.pos[5][2], F.pos[5][2]); assert.equal(F2.pos[6][2], F.pos[6][2]); assert.equal(CO.cosmo(n2).galassie[5].forma.massaStelle, C.galassie[5].forma.massaStelle);
  console.log(`      (campo senza bordo, celle fino a ${num(F.toroM / 3.0857e22 / 2 ** (F.livello - 10))} Mpc, vincolo a R_eq = ${num(F.scalaVincoli / 3.0857e22)} Mpc: campo vincolato in ${ms.toFixed(0)} ms, griglia ${n}³ in ${msG.toFixed(0)} ms, moti delle galassie in ${msV.toFixed(0)} ms; scarto del campo ${num(g.sigma)}; velocità: mediana ${num(mediana(vel))} km/s, massima ${num(Math.max(...vel))}, quadratica media della materia ${num(Math.sqrt(q2 / N))}; ogni galassia ne rappresenta ${num(F.peso)})`);
});

prova('l\'espansione: oggi a = 1 a 13,8 miliardi di anni; a metà grandezza l\'universo aveva 5,9 miliardi di anni; nel passato lo stesso cosmo, prima', () => {
  const o = S3.statoCosmo(1, 0), C = CO.cosmo(1), U = GA.dentro.U;
  tra(o.a, 1 - 1e-4, 1 + 1e-4, 'fattore di scala oggi'); tra(o.tGa, 13.7, 13.9, 'età dell\'universo (Ga)'); tra(o.latoM / CO.TORO_M, 1 - 1e-4, 1 + 1e-4, 'lato del toro'); tra(o.H / COSMO.H0, 1 - 1e-4, 1 + 1e-4, 'H oggi');
  for (let i = 0; i < o.n; i++) { tra(o.comoventi[3 * i] - C.galassie[i].pos[0], -1e-4, 1e-4, 'x di oggi = la carta'); tra(o.comoventi[3 * i + 1] - C.galassie[i].pos[1], -1e-4, 1e-4, 'y'); assert.equal(o.esiste[i], 1); tra(o.massaStelle[i] / C.galassie[i].forma.massaStelle, 1 - 1e-9, 1 + 1e-9, 'massa in stelle'); }
  // z = 1: l'universo era grande la metà
  const tz1 = (U.tempo(0.5) - o.tGa) * 1e9 * ANNO, p = S3.statoCosmo(1, tz1); tra(p.a, 0.4999, 0.5001, 'a'); tra(p.z, 0.999, 1.001, 'redshift'); tra(p.tGa, 5.7, 6.1, 'età a z = 1 (Ga: 5,9)'); tra(p.latoM / CO.TORO_M, 0.4999, 0.5001, 'il toro era grande la metà');
  tra(p.H / COSMO.H0, 1.7, 1.85, 'H(z=1)/H₀ (1,78)'); tra(p.D, 0.58, 0.64, 'le fluttuazioni erano 0,61 volte quelle di oggi');
  // le galassie: più vicine tra loro (in metri), quasi ferme sul toro (pochi Mpc di spostamento), con meno stelle
  let spost = 0, meno = 0; for (let i = 0; i < o.n; i++) { const d = [0, 1, 2].map((q) => { let x = p.comoventi[3 * i + q] - o.comoventi[3 * i + q]; x -= Math.round(x); return x * 1199; }); spost = Math.max(spost, Math.hypot(...d)); if (p.massaStelle[i] < o.massaStelle[i]) meno++; }
  tra(spost, 0.5, 40, 'spostamento comovente massimo da z = 1 a oggi (Mpc)'); assert.ok(meno > 0.8 * o.n, 'a z = 1 avevano meno stelle');
  // l'inizio: prima che gli aloni raffreddino gas le galassie non ci sono; l'universo è piccolo
  const inizio = S3.statoCosmo(1, (0.05 - o.tGa) * 1e9 * ANNO); assert.ok(inizio.a < 0.03 && inizio.esiste.reduce((x, y) => x + y, 0) < 0.2 * o.n);
  // la legge di Hubble: due galassie si allontanano di H·d (più i moti propri)
  const d01 = Math.hypot(...[0, 1, 2].map((q) => { let x = o.comoventi[3 + q] - o.comoventi[q]; x -= Math.round(x); return x * 1199; })); tra(o.H * d01, 100, 1.2e5, 'velocità di recessione tra le prime due galassie (km/s)');
  console.log(`      (oggi: ${num(o.tGa)} Ga, H = ${num(o.H)} km/s/Mpc; a z = 1: ${num(p.tGa)} Ga, lato ${num(p.latoM / 3.0857e22)} Mpc, H = ${num(p.H)}, fluttuazioni ×${num(p.D)}; spostamento massimo delle galassie da allora ${num(spost)} Mpc)`);
});

// ---------- le scene e i moti
prova('le scene per il motore: metri in doppia precisione, luce e magnitudine vere, un livello dentro l\'altro', () => {
  const a = LUOGHI.find((x) => CO.sistema(x.cosmo, x.galassia, x.stella).pianeti.length >= 2), t0 = performance.now();
  const sc = S3.scenaCosmo(a.cosmo, 0), sg = S3.scenaGalassia(a.cosmo, a.galassia, 0), ss = S3.scenaSistema(a.cosmo, a.galassia, a.stella, 0), ms = performance.now() - t0;
  for (const s of [sc, sg]) { assert.ok(s.punti.pos instanceof Float64Array && s.punti.pos.length === 3 * s.punti.n && s.punti.colore.length === 3 * s.punti.n && s.riferimento.unita === 'm'); for (let i = 0; i < s.punti.n; i++) assert.ok(Number.isFinite(s.punti.pos[3 * i]) && s.punti.raggio[i] > 0 && (s.punti.luminosita[i] >= 0)); assert.ok(s.punti.peso > 1); }
  // il Sole ha magnitudine 4,74; una galassia di 10¹⁰ L☉ −20,3
  tra(S3.magnitudine(LSOLE), 4.739, 4.741, 'magnitudine del Sole'); tra(S3.magnitudine(1e10 * LSOLE), -20.27, -20.25, 'di una galassia');
  tra(mediana(Array.from(sc.punti.magnitudine)), -24, -17, 'magnitudine mediana delle galassie'); tra(sg.daLontano.magnitudine, -25, -15, 'la galassia da lontano');
  // la galassia nel cosmo: il punto della scena del cosmo è l'origine della scena della galassia; la stella nella galassia idem
  for (let d = 0; d < 3; d++) { assert.equal(sg.nelGenitore.pos[d], sc.punti.pos[3 * a.galassia + d]); assert.equal(ss.nelGenitore.pos[d], sg.punti.pos[3 * a.stella + d]); }
  assert.equal(sc.punti.raggio[a.galassia], sg.riferimento.raggio); assert.equal(sc.punti.luminosita[a.galassia], sg.daLontano.luminosita);
  // i numeri bastano: un sistema (30 UA) dentro una galassia (10²⁰ m) ha ancora cinque cifre; per questo si cambia origine
  const px = sg.punti.pos[3 * a.stella]; assert.ok(Math.abs(px + 4.5e12 - px - 4.5e12) < 1e-3 * 4.5e12, 'la posizione di una stella più il raggio del suo sistema');
  // il sistema: la stella con la sua luce, i pianeti e le lune con le orbite da disegnare
  const stella = ss.corpi[0], Sis = CO.sistema(a.cosmo, a.galassia, a.stella); assert.equal(stella.cosa, 'stella'); assert.equal(ss.corpi.filter((c) => c.cosa === 'pianeta').length, Sis.pianeti.length);
  for (const c of ss.corpi) { assert.ok(c.pos.every(Number.isFinite) && c.raggio > 0 && c.colore.length === 3); if (c.orbita) { const E = 1.3, o = c.orbita, p = [0, 1, 2].map((d) => o.a * (Math.cos(E) - o.e) * o.assi[0][d] + o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E) * o.assi[1][d]); tra(Math.hypot(...p) / o.a, 1 - o.e - 1e-9, 1 + o.e + 1e-9, 'un punto dell\'orbita'); } }
  tra(Math.abs(sg.punti.luminosita[a.stella] / stella.luminosita - 1), -1, 0.02, 'la stella ha la stessa luce nella scena della galassia e in quella del sistema');
  // la forma continua della galassia in chilogrammi al metro cubo: vicino al centro più densa che al bordo
  const r = sg.riferimento.raggio, d0 = sg.campi.densita(0.05 * r, 0, 0), d1 = sg.campi.densita(0.9 * r, 0, 0); assert.ok(d0.stelle > 10 * d1.stelle && d0.stelle > 1e-23 && d0.stelle < 1e-15, `densità di stelle ${d0.stelle} kg/m³`);
  // nel tempo: le scene si muovono; e la rete cresce
  const sc2 = S3.scenaCosmo(a.cosmo, -5e9 * ANNO); assert.ok(sc2.riferimento.fattoreDiScala < 0.75 && sc2.campi.densita.crescita < 0.8 && sc2.riferimento.periodico[0] < sc.riferimento.periodico[0]);
  const ss2 = S3.scenaSistema(a.cosmo, a.galassia, a.stella, 3e6); assert.ok(V.norma(V.meno(ss2.corpi[1].pos, ss.corpi[1].pos)) > 1e6, 'un mese dopo il pianeta si è mosso');
  // l'assetto: una rotazione (ortonormale, destrorsa) che porta il polo del corpo (y) sull'asse; dopo un quarto di giorno
  // il meridiano 0 è girato di 90° verso est; una luna agganciata guarda il pianeta col meridiano 0
  const col = (m, j) => [m[j], m[3 + j], m[6 + j]], sc3 = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2]; let agganciate = 0, girano = 0;
  for (const c of ss.corpi) {
    if (!c.assetto) continue; const [x, y, z] = [0, 1, 2].map((j) => col(c.assetto, j));
    for (const [u, v, w] of [[x, x, 1], [y, y, 1], [z, z, 1], [x, y, 0], [y, z, 0], [x, z, 0]]) assert.ok(Math.abs(sc3(u, v) - w) < 1e-9, 'assetto ortonormale'); assert.ok(V.norma(V.meno(V.croce(x, y), z)) < 1e-9, 'destrorso');
    if (c.cosa === 'luna') { const P = ss.corpi.find((q) => q.cosa === 'pianeta' && q.id === c.pianeta), verso = V.versore(V.meno(P.pos, c.pos)); assert.ok(sc3(x, verso) > 1 - 1e-9, 'la luna agganciata guarda il pianeta'); agganciate++; continue; }
    assert.ok(V.norma(V.meno(y, c.asse)) < 1e-9, 'il polo è l\'asse');
    if (c.cosa === 'pianeta' && c.giorno > 0) { const dopo = S3.scenaSistema(a.cosmo, a.galassia, a.stella, c.giorno / 4).corpi.find((q) => q.cosa === 'pianeta' && q.id === c.id), x2 = col(dopo.assetto, 0); assert.ok(Math.abs(sc3(x2, x)) < 1e-6 && sc3(V.croce(x, x2), c.asse) > 1 - 1e-6, 'un quarto di giorno: 90° verso est'); girano++; }
  }
  assert.ok(girano >= 2);
  // gli stessi corpi come li vuole il motore: ognuno rispetto al suo genitore, in metri; sommati ridanno la scena
  const corpi = S3.corpiSistema(a.cosmo, a.galassia, a.stella); assert.equal(corpi.length, ss.corpi.length);
  for (const t of [0, 3e6]) { const sT = S3.scenaSistema(a.cosmo, a.galassia, a.stella, t); corpi.forEach((c, i) => { let p = c.posizione(t), g = c.genitore; while (g >= 0) { p = V.somma(p, corpi[g].posizione(t)); g = corpi[g].genitore; } assert.ok(V.norma(V.meno(p, sT.corpi[i].pos)) <= 1e-9 * (V.norma(p) + 1), `il corpo ${c.nome} al tempo ${t}`); if (c.assetto) assert.deepEqual(c.assetto(t, new Array(9)), sT.corpi[i].assetto); if (t === 0) assert.equal(c.raggio, sT.corpi[i].raggio); else tra(c.raggio / sT.corpi[i].raggio, 1 - 1e-9, 1 + 1e-9, `il raggio di ${c.nome} un mese dopo`); }); }
  // (il raggio è lo stesso al bit solo allo stesso istante: una stella viva in un mese invecchia di 10⁻¹¹ della sua vita, e il
  // suo raggio cambia di altrettanto — qui 6·10⁻¹⁵; chiedere `===` tra t = 0 e t = 3·10⁶ s era chiedere una stella che non evolve)
  console.log(`      (assetti: ${girano} pianeti che girano, ${agganciate} lune agganciate; ${corpi.length} corpi per il motore, ognuno rispetto al suo genitore)`);
  console.log(`      (tre scene in ${ms.toFixed(0)} ms; cosmo: ${sc.punti.n} galassie, griglia ${sc.campi.densita.n}³; galassia: ${sg.punti.n} stelle; sistema: ${ss.corpi.length} corpi)`);
});

prova('i moti di una regione vengono dal mondo in tre dimensioni: pianeta, stella nella galassia, galassia nel cosmo', () => {
  for (const a0 of LUOGHI.slice(0, 8)) {
    const a = { ...a0, regione: 3 }, M = CO.motiDi(a), R = S3.motiRegione(a), n3 = (v) => Math.hypot(...v);
    tra(M[3].kmS3d / n3(V.somma([M[2].kmS * Math.cos(((M[2].direzione + 180) * Math.PI) / 180), M[2].kmS * Math.sin(((M[2].direzione + 180) * Math.PI) / 180), 0], R.stella)), 1 - 1e-9, 1 + 1e-9, '«ferma rispetto alla galassia» = orbita + moto della stella');
    tra(n3(R.stella) / n3(R.stellaNellaGalassia), 1 - 1e-9, 1 + 1e-9, 'girare un vettore non lo allunga'); tra(n3(R.galassia) / n3(R.galassiaNelCosmo), 1 - 1e-9, 1 + 1e-9, 'idem');
    assert.ok(M[3].kmS <= M[3].kmS3d * (1 + 1e-9) && M[4].kmS <= M[4].kmS3d * (1 + 1e-9), 'nel piano se ne vede una parte');
  }
});

console.log(`\n${ok} prove superate in ${((performance.now() - T0) / 1000).toFixed(1)} s`);
