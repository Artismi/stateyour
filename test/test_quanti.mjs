// test_quanti.mjs — sotto l'atomo (src/camera/quanti.js): orbitali, misure come eventi, indeterminazione, moto,
// molecole, nucleo e nucleone. Due specie di righe:
//   ✓  PROVE: coerenza interna (una legge contro un'altra via di calcolo, un limite esatto): se cadono la catena si ferma;
//   ·  RISCONTRI con il mondo vero, con l'intervallo deciso PRIMA (l'errore della misura o il motivo scritto accanto):
//      se uno non rientra si stampa «≠ NON TORNA» e si va avanti.
import assert from 'node:assert/strict';
import * as Q from '../src/camera/quanti.js';
import { scenaAcqua } from '../src/camera/atomi3d.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0; const T0 = performance.now(), nonTorna = [];
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const n = (x, c = 4) => (!Number.isFinite(x) ? String(x) : x !== 0 && (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3) ? x.toExponential(c - 1).replace('.', ',').replace('e+', 'e') : String(+x.toPrecision(c)).replace('.', ','));
const vicino = (x, y, rel, che) => assert.ok(Math.abs(x - y) <= rel * Math.abs(y), `${che}: ${x} contro ${y} (entro ${rel})`);
const confronta = (che, x, a, b, vero, unita = '') => { const d = x >= a && x <= b; console.log(`      ${d ? '·' : '≠ NON TORNA:'} ${che}: ${n(x)}${unita ? ' ' + unita : ''} (vero: ${vero}; chiesto tra ${n(a)} e ${n(b)})`); if (!d) nonTorna.push(`${che}: ${n(x)} (vero ${vero})`); return d; };
const media = (v) => v.reduce((s, x) => s + x, 0) / v.length, scarto = (v) => { const m = media(v); return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)); };
// n misure di uno stato: le posizioni (e gli impulsi se chiesti)
const misure = (stato, ind, nn, opz = {}) => Array.from({ length: nn }, (_, k) => Q.misura(stato, ind, k, opz));

console.log('\n— 1. GLI ORBITALI DELL\'IDROGENO (esatti) —');
prova('le parti radiali sono normalizzate e ortogonali; le armoniche reali sono normalizzate sulla sfera', () => {
  for (const [nn, l] of [[1, 0], [2, 0], [2, 1], [3, 2], [4, 3]]) { const R = Q.radiale(nn, l, 1); let s = 0; const h = 0.002; for (let i = 1; i < 100000; i++) { const r = i * h; s += R(r) ** 2 * r * r * h; } vicino(s, 1, 1e-6, `∫R²r² ${nn}${l}`); }
  const R1 = Q.radiale(1, 0, 1), R2 = Q.radiale(2, 0, 1); let o = 0; for (let i = 1; i < 50000; i++) { const r = i * 0.002; o += R1(r) * R2(r) * r * r * 0.002; } assert.ok(Math.abs(o) < 1e-6, '1s·2s');
  for (const [l, m] of [[1, 1], [2, -2], [3, 0]]) { const Y = Q.armonica(l, m); let s = 0; const M = 400; for (let i = 0; i < M; i++) for (let j = 0; j < 2 * M; j++) { const th = (Math.PI * (i + 0.5)) / M, f = (Math.PI * (j + 0.5)) / M; s += Y(Math.sin(th) * Math.cos(f), Math.sin(th) * Math.sin(f), Math.cos(th)) ** 2 * Math.sin(th) * (Math.PI / M) ** 2; } vicino(s, 1, 1e-4, `∫Y² ${l},${m}`); }
});
prova('le misure sono eventi: stesso indirizzo, stesso esito; misure diverse, esiti diversi', () => {
  const s = Q.statoAtomo(1), a = Q.misura(s, 'prova/H', 7), b = Q.misura(s, 'prova/H', 7), c = Q.misura(s, 'prova/H', 8);
  assert.deepEqual(a.x, b.x); assert.notDeepEqual(a.x, c.x);
});
{
  const H = Q.statoAtomo(1), xs = misure(H, 'prova/idrogeno', 40000), r = xs.map((m) => Math.hypot(...m.x));
  prova('1s: il raggio medio delle misure è (3n² − l(l+1))/2Z = 1,5 a₀; ⟨r²⟩ = 3 a₀² (entro lo scarto statistico)', () => { vicino(media(r), 1.5, 0.015, '⟨r⟩'); vicino(media(r.map((x) => x * x)), 3, 0.03, '⟨r²⟩'); });
  confronta('raggio medio 1s dell\'idrogeno dalle misure', media(r), 1.485, 1.515, '1,5 a₀ (Schrödinger; la densità radiale misurata per diffusione è questa)', 'a₀');
  for (const [nn, l, m, che] of [[2, 1, 0, '2p_z'], [3, 2, 0, '3d_z²'], [3, 2, 2, '3d_x²−y²']]) {
    const s = { componenti: [{ peso: 1, ...((o) => ({ campiona: (rr) => o.campiona(rr), psiT: (x, y, z) => [o.psi(x, y, z), 0], estensioneFFT: o.estensioneFFT, centro: [0, 0, 0] }))(Q.orbitale(nn, l, m, 1)) }] };
    const v = misure(s, `prova/${che}`, 30000).map((q) => q.x), rr = v.map((x) => Math.hypot(...x)), c2 = v.map((x, i) => (x[2] / rr[i]) ** 2), atteso = Q.rMedio(nn, l, 1);
    // la forma: ⟨cos²θ⟩ = (2l² + 2l − 1 − 2m²)/((2l − 1)(2l + 3)) per Y_l0 (esatto); per 3d_x²−y² la media di cos²θ è 1/7 e cos 4φ ha media positiva
    const cosAtteso = m === 0 ? (2 * l * l + 2 * l - 1) / ((2 * l - 1) * (2 * l + 3)) : 1 / 7;
    prova(`${che}: ⟨r⟩ = ${atteso} a₀ e la forma (⟨cos²θ⟩ = ${n(cosAtteso)}) dalle misure`, () => { vicino(media(rr), atteso, 0.02, '⟨r⟩'); vicino(media(c2), cosAtteso, 0.03, '⟨cos²θ⟩'); if (m === 2) assert.ok(media(v.map((x) => Math.cos(4 * Math.atan2(x[1], x[0])))) > 0.2, 'quattro lobi sugli assi'); });
    confronta(`⟨r⟩ di ${che} dalle misure`, media(rr), atteso * 0.98, atteso * 1.02, `${atteso} a₀ (esatto)`, 'a₀');
    if (l === 1) { const piano = v.filter((x, i) => Math.abs(x[2]) < 0.05 * rr[i]).length / v.length; confronta('frazione di misure sul piano nodale del 2p_z (|cosθ| < 0,05)', piano, 0, 0.0002, '≈ 0,0001 (|ψ|² ∝ cos²θ: il nodo è un piano)'); }
  }
}
prova('energie: −Z²/2n² hartree con la massa ridotta; l\'emissione spontanea dal dipolo', () => {
  vicino(Q.energiaIdrogenoide(1, 1, 1.00728) * Q.AU.eV, -13.5983, 1e-4, 'E₁');
  vicino(Q.dipoloRadiale(2, 1, 1, 0), (128 * Math.sqrt(6)) / 243, 1e-6, '⟨1s|r|2p⟩ = 128√6/243');
});
{
  const mH = 1.00728, E = (k) => Q.energiaIdrogenoide(k, 1, mH) * Q.AU.eV, hc = 1239.84198;
  confronta('energia di ionizzazione dell\'idrogeno', -E(1), 13.590, 13.606, '13,598434 eV (NIST [R])', 'eV');
  confronta('Lyman α', hc / (E(2) - E(1)), 121.55, 121.59, '121,567 nm nel vuoto [R]', 'nm');
  confronta('Balmer α', hc / (E(3) - E(2)), 656.3, 656.6, '656,46 nm nel vuoto [R]', 'nm');
  confronta('ritmo di emissione del 2p', Q.ritmoEmissione(2, 1), 6.2e8, 6.33e8, '6,2649·10⁸/s, vita 1,596 ns [R]', '/s');
}

console.log('\n— 2. L\'INDETERMINAZIONE (dalla trasformata) —');
prova('la FFT della 1s dà la distribuzione di Podolsky e Pauling, 8/(π²(1 + p²)⁴): Δp_x = 1/√3', () => {
  const o = Q.orbitale(1, 0, 0, 1), D = Q.impulsi((x, y, z) => [o.psi(x, y, z), 0], { L: 2 * o.quantile(1 - 1e-4), N: 64, riempi: 2 }), m = Q.momentiImpulso(D);
  vicino(m.scarto[0], 1 / Math.sqrt(3), 0.015, 'Δp_x della 1s');
});
{
  const casi = [['gaussiano σ₀ = 0,8 a₀', Q.pacchetto({ sigma0: 0.8 }), 0.5], ['1s', Q.statoAtomo(1), 1 / Math.sqrt(3)], ['2p_z (asse x)', { componenti: [(() => { const o = Q.orbitale(2, 1, 0, 1); return { peso: 1, campiona: (r) => o.campiona(r), psiT: (x, y, z) => [o.psi(x, y, z), 0], estensioneFFT: o.estensioneFFT, centro: [0, 0, 0] }; })()] }, null]];
  for (const [che, s, atteso] of casi) {
    const c = s.componenti[0], xs = misure(s, `prova/kennard/${che}`, 6000).map((m) => m.x[0]), D = Q.impulsi(c.psiT, { centro: c.centro, L: 2 * c.estensioneFFT, N: 64, riempi: 2 }), rnd = sorgente(`prova/kennard/${che}`).fila('impulsi');
    const ps = Array.from({ length: 6000 }, () => Q.tiraImpulso(D, rnd)[0]), prodotto = scarto(xs) * scarto(ps);
    confronta(`Δx·Δp sui campioni, ${che}`, prodotto, atteso === 0.5 ? 0.485 : 0.5, atteso === 0.5 ? 0.515 : 2, atteso === 0.5 ? '½ ħ: l\'uguaglianza (Kennard 1927)' : atteso ? `≥ ½ ħ (esatto ${n(atteso)})` : '≥ ½ ħ', 'ħ');
  }
  // la finestra: più è stretta, più l'impulso dopo la misura si allarga; la coppia (x₀, p) della stessa misura ≥ ħ (Arthurs & Kelly)
  const G = Q.pacchetto({ sigma0: 1 }); console.log('      finestra σ → Δx₀, Δp dopo la misura, prodotto (stato gaussiano σ₀ = 1 a₀; teoria Arthurs-Kelly: (σ₀² + σ²)/(2σ₀σ))');
  let prima = 0;
  for (const sg of [0.25, 1, 4]) {
    const v = misure(G, `prova/finestra ${sg}`, 1500, { sigma: sg, impulso: true, N: 16, riempi: 2 }), dx = scarto(v.map((m) => m.x[0])), dp = scarto(v.map((m) => m.p[0])), teoria = (1 + sg * sg) / (2 * sg);
    console.log(`        σ = ${n(sg)} a₀: Δx₀ = ${n(dx)} (teoria ${n(Math.sqrt(1 + sg * sg))}), Δp = ${n(dp)} ħ/a₀ (teoria ${n(Math.sqrt(1 + 1 / (sg * sg)) / 2)}), Δx₀·Δp = ${n(dx * dp)} (teoria ${n(teoria)})`);
    if (prima) assert.ok(dp < prima, 'la finestra più larga disturba meno'); prima = dp;
    confronta(`Δx₀·Δp della stessa misura, σ = ${n(sg)}`, dx * dp, teoria * 0.92, teoria * 1.08, `${n(teoria)} ħ (Arthurs & Kelly 1965: ≥ 1 ħ)`, 'ħ');
  }
}

{
  // L'ORDINE DELLE MISURE: x poi p_x contro p_x poi x sullo stesso pacchetto (σ₀ = 1 a₀, finestre σx = σp = 0,5)
  // (3600 misure per ordine. Lo scarto di n misure gaussiane ha un errore relativo di 1/√(2n): con 1200 il 2%, e la griglia
  // sposta Δp di +1,4% (0,717 su 12 000 misure, curtosi 2,96): il 7% era a 2,8 errori, e un confronto tra due scarti — x con
  // p_y prima o dopo — a 2,5. Con la fonte Threefry-4x32 «prova/fila» dava Δp prima 0,758: +5,8%, tre errori. Con 3600 misure
  // l'errore è 1,2% e il 7% sta a più di quattro)
  const G = Q.pacchetto({ sigma0: 1 }), nn = 3600, opz = { sigmaX: 0.5, sigmaP: 0.5, N: 32, L: 16 };
  const fila = (seq, nome) => Array.from({ length: nn }, (_, k) => Q.misureInFila(G, `prova/fila/${nome}`, k, seq, opz).esiti.map((e) => e.valore));
  const XP = fila(['x', 'px'], 'xp'), PX = fila(['px', 'x'], 'px'), XY = fila(['x', 'py'], 'xpy'), YX = fila(['py', 'x'], 'pyx');
  const dXP = [scarto(XP.map((v) => v[0])), scarto(XP.map((v) => v[1]))], dPX = [scarto(PX.map((v) => v[1])), scarto(PX.map((v) => v[0]))];
  // teoria (gaussiane): x prima: Δx = √(σ₀² + σx²) = 1,118; p dopo x: √(1/4σ'² + σp²) con 1/σ'² = 1/σ₀² + 1/σx² → 1,225
  //                    p prima: Δp = √(1/4σ₀² + σp²) = 0,707; x dopo p: lo stato si allarga a 1/(2σp') con 1/σp'² = 4σ₀²·… → 1,5
  console.log(`      x poi p_x: Δx = ${n(dXP[0])} (teoria 1,118), Δp = ${n(dXP[1])} ħ/a₀ (1,225)  ·  p_x poi x: Δp = ${n(dPX[1])} (0,707), Δx = ${n(dPX[0])} a₀ (1,5)`);
  prova('l\'ordine conta dove gli osservabili non commutano: dopo x l\'impulso si allarga, dopo p_x la posizione; x e p_y commutano', () => {
    vicino(dXP[0], 1.118, 0.07, 'Δx prima'); vicino(dXP[1], 1.225, 0.07, 'Δp dopo x'); vicino(dPX[1], 0.707, 0.07, 'Δp prima'); vicino(dPX[0], 1.5, 0.07, 'Δx dopo p');
    assert.ok(dXP[1] / dPX[1] > 1.5 && dPX[0] / dXP[0] > 1.25, 'i due ordini danno statistiche diverse');
    // assi diversi: l'ordine non cambia la statistica (entro lo scarto)
    vicino(scarto(XY.map((v) => v[0])), scarto(YX.map((v) => v[1])), 0.07, 'Δx con p_y prima o dopo'); vicino(scarto(XY.map((v) => v[1])), scarto(YX.map((v) => v[0])), 0.07, 'Δp_y con x prima o dopo');
    // l'indirizzo di ogni esito dice che cosa e dopo che cosa
    assert.equal(Q.misureInFila(G, 'prova/fila/xp', 0, ['x', 'px'], opz).esiti[1].indirizzo, 'prova/fila/xp/misura 0/px dopo x');
  });
}
{
  // TRA DUE MISURE LO STATO EVOLVE: x, poi dopo t ancora x. Il pacchetto ridotto (largo s', 1/s'² = 1/σ₀² + 1/σx², centrato
  // in x₁σ₀²/(σ₀² + σx²)) si riallarga come s'√(1 + (t/2s'²)²): la seconda misura ne è il campione (più la sua finestra)
  const G = Q.pacchetto({ sigma0: 1 }), sx = 0.4, s1 = 1 / Math.sqrt(1 + 1 / (sx * sx)), opz = { sigmaX: sx, N: 32, L: 24 };
  for (const t of [0.5, 2]) {
    const v = Array.from({ length: 800 }, (_, k) => Q.misureInFila(G, `prova/riallarga ${t}`, k, ['x', { cosa: 'x', dopo: t }], opz).esiti.map((e) => e.valore)), d = scarto(v.map(([a, b]) => b - a / (1 + sx * sx))), teoria = Math.sqrt((s1 * Math.sqrt(1 + (t / (2 * s1 * s1)) ** 2)) ** 2 + sx * sx);
    prova(`dopo una misura di posizione il pacchetto si riallarga: dopo ${t} u.a. la seconda misura sta a ${n(teoria)} a₀ dalla prima (evoluzione di Schrödinger sulla griglia)`, () => vicino(d, teoria, 0.08, `t = ${t}`));
  }
  // L'EFFETTO ZENO: in un tempo fisso T = 4 u.a., n misure «è ancora nello stato iniziale?» sul pacchetto (σ₀ = 0,7 a₀).
  // Senza misure lo stato se ne va (sopravvive |⟨ψ₀|ψ(T)⟩|² = (1 + (T/4σ₀²)²)^(−3/2)); con n misure (1 + (T/4nσ₀²)²)^(−3n/2) → 1
  const P = Q.pacchetto({ sigma0: 0.7 }), T = 4, prove = 300; console.log('      effetto Zeno (T = 4 u.a., σ₀ = 0,7 a₀): misure n → frazione rimasta (formula)');
  let prima = -1;
  for (const nm of [1, 3, 10, 30]) {
    let rimasti = 0; for (let k = 0; k < prove; k++) { const e = Q.misureInFila(P, `prova/zeno ${nm}`, k, Array.from({ length: nm }, () => ({ cosa: 'resta', dopo: T / nm })), { N: 32, L: 12 }).esiti; if (e.every((x) => x.valore)) rimasti++; }
    const f = rimasti / prove, formula = (1 + (T / (4 * nm * 0.49)) ** 2) ** (-1.5 * nm), err = Math.sqrt(formula * (1 - formula) / prove);
    console.log(`        n = ${nm}: ${n(f)} (formula ${n(formula)})`);
    confronta(`Zeno: frazione rimasta con ${nm} misure in T`, f, formula - 3 * err - 0.01, formula + 3 * err + 0.01, `${n(formula)} (prodotto delle sopravvivenze; Itano et al. 1990 l'hanno misurato su ioni [R])`);
    assert.ok(f >= prima - 0.05, 'più misure, più resta'); prima = f;
  }
}
{
  const acqua = Q.decoerenza({ ambiente: { n: 3.343e28, massaKg: 18.015 * 1.66054e-27, T: 298.15, raggioM: 1.4e-10 }, raggioM: 1.06e-10, separazioneM: 2 * 0.7449 * Q.AU.a0 });
  const vuoto = Q.decoerenza({ ambiente: { fotoni: 300 }, raggioM: 1.06e-10, separazioneM: 2 * 0.7449 * Q.AU.a0 });
  console.log(`      decoerenza di 1s + 2p_z (Δx = ${n(2 * 0.7449)} a₀): nell'acqua a 25 °C ${n(acqua.tempo)} s (${acqua.regime}); nel vuoto con i fotoni a 300 K ${n(vuoto.tempo)} s`);
  prova('nell\'acqua la sovrapposizione diventa un insieme in meno di un picosecondo; nel vuoto prima si svuota emettendo (1,6 ns)', () => { assert.ok(acqua.tempo < 1e-12 && acqua.tempo > 1e-15); assert.ok(vuoto.tempo > 1e-9 * 1e6); });
  confronta('tempo di decoerenza elettronica di un atomo in un liquido (stima a urti)', acqua.tempo, 1e-15, 1e-12, 'decine di fs – frazioni di ps (le coerenze elettroniche nei liquidi si smorzano in ~10–100 fs [R])', 's');
}

console.log('\n— 3. IL MOTO —');
prova('il pacchetto libero si allarga come σ₀√(1 + (t/2σ₀²)²): la FFT del pacchetto evoluto e le misure lo confermano', () => {
  const s = Q.pacchetto({ sigma0: 0.5 }), t = 2, sg = 0.5 * Math.sqrt(1 + (t / 0.5) ** 2), v = misure(s, 'prova/pacchetto', 8000, { t }).map((m) => m.x[0]);
  vicino(scarto(v), sg, 0.03, 'σ(t) dalle misure');
  // l'impulso non cambia nel moto libero
  const c = s.componenti[0], D0 = Q.impulsi(c.psiT, { L: 16, N: 32, t: 0 }), D1 = Q.impulsi(c.psiT, { L: 16 * 2.2, N: 64, t });
  vicino(Q.momentiImpulso(D1).scarto[0], Q.momentiImpulso(D0).scarto[0], 0.03, 'Δp costante');
});
{
  const S = Q.sovrapposizione([{ n: 1, l: 0, m: 0, c: 1 }, { n: 2, l: 1, m: 0, c: 1 }], 1, { indirizzo: 'prova/battimenti' }), T = S.periodoBattimento / Q.AU.t;
  const zMedio = (fase) => media(misure(S, `prova/batt ${fase}`, 20000, { t: fase * T }).map((m) => m.x[2]));
  const z0 = zMedio(0), z1 = zMedio(0.5), z2 = zMedio(1);
  prova('1s + 2p_z: la nuvola oscilla lungo z con il periodo h/(E₂ − E₁); ⟨z⟩(0) = −⟨z⟩(T/2) = 2c₁c₂⟨1s|z|2p_z⟩ dalle misure (entro tre scarti statistici)', () => {
    const atteso = (2 * 0.5 * (128 * Math.sqrt(6)) / 243) / Math.sqrt(3); // 2·c₁c₂·⟨1s|z|2p_z⟩
    vicino(z0, atteso, 0.1, '⟨z⟩(0)'); vicino(z1, -atteso, 0.1, '⟨z⟩(T/2)'); vicino(z2, atteso, 0.1, '⟨z⟩(T)');
  });
  confronta('periodo dei battimenti 1s–2p', S.periodoBattimento * 1e15, 0.4049, 0.4053, '0,40516 fs (1/2,466 PHz, dalla 1S–2S [R])', 'fs');
  prova('il salto (il fotone emesso) è un evento: con metà del peso nell\'eccitato avviene in metà dei mondi', () => {
    let quanti = 0; for (let i = 0; i < 2000; i++) if (Q.sovrapposizione([{ n: 1, l: 0, m: 0, c: 1 }, { n: 2, l: 1, m: 0, c: 1 }], 1, { indirizzo: `prova/salto ${i}` }).tSalto < Infinity) quanti++;
    vicino(quanti / 2000, 0.5, 0.06, 'frazione di salti');
  });
}

console.log('\n— 4. LE MOLECOLE (Hartree-Fock, STO-3G) —');
{
  const H2 = Q.molecola([{ Z: 1, pos: [0, 0, 0] }, { Z: 1, pos: [1.4, 0, 0] }]);
  prova('H₂ a 1,4 a₀: convergenza, due elettroni nella densità', () => { assert.ok(H2.convergito); let s = 0; const h = 0.1; for (let x = -6; x < 7.4; x += h) for (let y = -6; y < 6; y += h) for (let z = -6; z < 6; z += h) s += H2.densita(x + h / 2, y + h / 2, z + h / 2) * h ** 3; vicino(s, 2, 0.01, '∫ρ'); });
  confronta('energia di H₂ STO-3G a 1,4 a₀', H2.energia, -1.1168, -1.1166, '−1,1167 hartree (Szabo & Ostlund 1982 [R])', 'Eₕ');
  confronta('densità elettronica di H₂ a metà del legame', H2.densita(0.7, 0, 0), 0.2455, 0.3001, '0,2728 e/a₀³ quasi al limite di Hartree-Fock (Bader [R]); entro il 10%: la base minima', 'e/a₀³');
  const W = Q.molecola([{ Z: 8, pos: [0, -0.143225816552, 0] }, { Z: 1, pos: [1.638036840407, 1.136548822547, 0] }, { Z: 1, pos: [-1.638036840407, 1.136548822547, 0] }]);
  confronta('energia di H₂O STO-3G (geometria di Crawford, R = 1,1 Å, 104°)', W.energia, -74.94209, -74.94207, '−74,942079928 hartree (Crawford, progetto di programmazione n. 3 [R])', 'Eₕ');
}
{
  // l'acqua DEL MODELLO: la molecola più vicina al centro di una scena di atomi3d
  const sc = scenaAcqua({ latoNm: 1.2, moto: false }, sorgente('prova/quanti/acqua')), L = sc.scatola; let iO = 0, dm = Infinity;
  for (let i = 0; i < sc.atomi.elemento.length; i++) if (sc.atomi.elemento[i] === 8) { const d = Math.hypot(sc.atomi.pos[3 * i] - L[0] / 2, sc.atomi.pos[3 * i + 1] - L[1] / 2, sc.atomi.pos[3 * i + 2] - L[2] / 2); if (d < dm) { dm = d; iO = i; } }
  const at = Q.atomoDaScena(sc, iO), t = performance.now(), W = Q.statoDi(at), ms = performance.now() - t;
  prova(`l'ossigeno ${iO} dell'acqua del modello: la sua molecola (${at.molecola.map((a) => a.Z).join(', ')}), Hartree-Fock in ${ms.toFixed(0)} ms, 10 elettroni`, () => {
    assert.equal(at.molecola.length, 3); assert.equal(W.tipo, 'molecola'); assert.ok(W.convergito); assert.equal(W.elettroni, 10);
    const d = at.molecola.slice(1).map((a) => Math.hypot(...a.pos) * Q.AU.a0 * 1e10); vicino(d[0], 0.9572, 1e-3, 'O–H'); vicino(d[1], 0.9572, 1e-3, 'O–H');
  });
  confronta('energia dell\'acqua del modello (O–H 0,9572 Å, 104,52°) STO-3G', W.energia, -74.97, -74.95, '−74,963 hartree alla geometria sperimentale (STO-3G, NIST CCCBDB [R])', 'Eₕ');
  const v = misure(W, 'prova/acqua/O', 20000), C = W.componenti, ecc = C.reduce((s, c) => s + c.eccessi, 0), tent = C.reduce((s, c) => s + c.tentativi, 0);
  prova('le misure sull\'acqua: la frazione degli elettroni vicino all\'ossigeno è quella della densità; il tetto delle celle quasi mai superato', () => {
    const dentro = v.filter((m) => Math.hypot(...m.x) < 0.5).length / v.length; let s = 0; const h = 0.025; for (let x = -0.5; x < 0.5; x += h) for (let y = -0.5; y < 0.5; y += h) for (let z = -0.5; z < 0.5; z += h) { const p = [x + h / 2, y + h / 2, z + h / 2]; if (Math.hypot(...p) < 0.5) s += W.densita(...p) * h ** 3; }
    vicino(dentro, s / 10, 0.04, 'elettroni entro 0,5 a₀ dall\'O'); assert.ok(ecc / tent < 1e-3, `eccessi ${ecc}/${tent}`);
  });
  console.log(`      (celle col tetto superato: ${ecc} su ${tent} tentativi)`);
  const O = Q.statoAtomo(8), p2 = O.componenti.find((c) => c.sottoguscio === '2p');
  confronta('⟨r⟩ dell\'orbitale 2p dell\'ossigeno (campo centrale di Slater)', p2.orbitale.rMedio, 1.11, 1.36, '1,23 a₀ (Hartree-Fock dell\'atomo libero, Froese Fischer [R]; entro il 10%)', 'a₀');
}

console.log('\n— 5. IL NUCLEO E IL NUCLEONE —');
{
  const N = Q.nucleone();
  prova('il protone ha carica 1 e il neutrone 0 nelle densità dalla trasformata; r² dalla densità = r² dalla pendenza del fattore di forma', () => {
    vicino(N.normaProtone, 1, 2e-3, '∫ρ_p'); assert.ok(Math.abs(N.normaNeutrone) < 3e-3, '∫ρ_n');
    vicino(N.r2Protone, N.r2DaPendenza(Q.FATTORE_FORMA.protone), 0.01, 'r²_p'); vicino(N.r2Neutrone, N.r2DaPendenza(Q.FATTORE_FORMA.neutrone), 0.02, 'r²_n');
  });
  confronta('raggio di carica del protone (dai fattori di forma di Kelly 2004)', Math.sqrt(N.r2Protone), 0.835, 0.847, '0,84087 ± 0,00039 fm (idrogeno muonico, Antognini 2013 [R]); Kelly è un adattamento alla diffusione di elettroni di prima (0,86–0,88): è il «problema del raggio del protone»', 'fm');
  confronta('raggio² di carica del neutrone (Galster)', N.r2Neutrone, -0.122, -0.110, '−0,1161 ± 0,0022 fm² (PDG [R])', 'fm²');
  console.log(`      (densità di u e d nel protone, per isospin: raggi ${n(N.u.rms)} e ${n(N.d.rms)} fm; parte negativa ${n(N.u.parteNegativa)} e ${n(N.d.parteNegativa)}, tolta nel tirare)`);
  for (const Z of [6, 8, 14, 26, 82]) { const nu = Q.nucleo(Z), r0 = 1.2 * nu.A ** (1 / 3); confronta(`raggio equivalente del nucleo Z = ${Z}, A = ${nu.A} (√(5/3)·r_carica misurato)`, nu.raggio, r0 * 0.9, r0 * 1.1, `1,2·A^(1/3) = ${n(r0)} fm (legge empirica, buona per i nuclei medi e pesanti)`, 'fm'); }
  const O = Q.nucleo(8), snap = Array.from({ length: 400 }, (_, k) => Q.istantanea(O, 'prova/O16', k));
  prova('le istantanee del nucleo di ossigeno: 8 protoni e 8 neutroni; il raggio dei centri è quello della densità; tre quark per nucleone, carica +1 per protone', () => {
    assert.equal(snap[0].nucleoni.length, 16); assert.equal(snap[0].nucleoni.filter((q) => q.tipo === 'p').length, 8);
    const r2 = media(snap.flatMap((s) => s.nucleoni.filter((q) => q.tipo === 'p').map((q) => q.pos[0] ** 2 + q.pos[1] ** 2 + q.pos[2] ** 2))); vicino(Math.sqrt(r2), O.rPunti, 0.03, 'raggio dei centri dei protoni');
    const carica = snap[0].nucleoni.filter((q) => q.tipo === 'p')[0].quark.reduce((s, q) => s + (q.sapore === 'u' ? 2 / 3 : -1 / 3), 0); vicino(carica, 1, 1e-12, 'uud');
    assert.deepEqual(Q.istantanea(O, 'prova/O16', 3), snap[3]);
  });
  // il raggio di carica che le istantanee danno: centri dei protoni sfumati dalla carica del protone e del neutrone
  const rq = media(snap.flatMap((s) => s.nucleoni.flatMap((q) => q.quark.map((k) => ({ q: k.sapore === 'u' ? 2 / 3 : -1 / 3, r2: k.pos[0] ** 2 + k.pos[1] ** 2 + k.pos[2] ** 2 })))).map((x) => x.q * x.r2)) * 48 / 8;
  confronta('raggio di carica dell\'ossigeno-16 dai quark delle istantanee', Math.sqrt(rq), 2.62, 2.78, '2,6991 fm (Angeli & Marinova 2013 [R]; qui il raggio del protone di Kelly e i quark per isospin)', 'fm');
}

console.log(`\n${ok} prove passate in ${((performance.now() - T0) / 1000).toFixed(1)} s.`);
if (nonTorna.length) { console.log(`Ciò che non torna (${nonTorna.length}):`); for (const r of nonTorna) console.log('  ≠', r); }
