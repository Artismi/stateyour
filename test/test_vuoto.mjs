// test_vuoto.mjs — che cosa c'è tra le stelle e tra i pianeti (src/camera/vuoto*.js).
// Le PROVE (assert) chiedono solo ciò che DEVE valere: conservazione, determinismo, coerenza tra scale, una fonte sola.
// I RISCONTRI con la Via Lattea e il Sistema Solare veri si stampano in tabella con il loro margine dichiarato prima
// (entro un fattore 2 dove la grandezza è derivata, 3 per i conteggi, 10 dove anche il valore vero è incerto di tanto):
// ciò che non torna si stampa «≠ NON TORNA» e la catena non si ferma. Nessuna soglia è stata allargata dopo aver visto i
// numeri, nessun seme scelto: le galassie sono «prova/galassia 0…5», i sistemi «prova/sistema 0…11».
import assert from 'node:assert/strict';
import { formaDaAlone, stelleGalassia, popolazione, faseBraccioAlTempo, LEGGI, ANELLI } from '../src/camera/galassie.js';
import { sorgente } from '../src/camera/eventi.js';
import { COSTANTI, MSOLE, LSOLE, ANNO, UA } from '../src/camera/leggi.js';
import * as ST from '../src/camera/stelle.js';
import * as MAT from '../src/camera/materia.js';
import { DATI as RISALITA } from '../src/camera/risalita.js';
import { storiaImpatti, IMPATTI } from '../src/camera/impatti.js';
import { MTERRA } from '../src/camera/disco.js';
import { cosmo, galassia, sistema, cosmoBase, ramiCosmo } from '../src/camera/cosmo.js';
import * as V from '../src/camera/vuoto.js';

let ok = 0; const tabella = [], costi = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; console.log(`  ✓ ${nome}  (${(performance.now() - t).toFixed(0)} ms)`); };
const tra = (x, a, b, che) => assert.ok(x >= a && x <= b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const num = (x, c = 3) => (x == null || Number.isNaN(x) ? '—' : !isFinite(x) ? '∞' : x === 0 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };
// un riscontro: modello contro vero (un numero o [min, max]); torna se sta nell'intervallo allargato del fattore `entro`
const riscontro = (gruppo, nome, modello, vero, { entro = 2, unita = '', fonte = '' } = {}) => { const [a, b] = Array.isArray(vero) ? vero : [vero, vero], torna = modello >= a / entro && modello <= b * entro; tabella.push({ gruppo, nome, modello, vero: a === b ? num(a) : `${num(a)}–${num(b)}`, entro, unita, fonte, torna }); return torna; };
const costo = (che, ms) => costi.push([che, ms]);
const PC = V.PC, KPC = V.KPC, K = COSTANTI, EV = K.e, KCM = K.kB * 1e6;

const tTab = performance.now(); popolazione(); console.log(`vuoto: tabelle delle popolazioni pronte in ${(performance.now() - tTab).toFixed(0)} ms (una volta sola)`);
// ---------- le galassie delle prove: la «Via Lattea» delle prove di galassie.js (stesso alone, stessa sorgente) e altre cinque
const RADICE = 'prova/via lattea 4', CASO = sorgente(RADICE), VL = formaDaAlone({ massa: 1e12, spin: 0.04, fusioni: [] }, CASO), CAT = stelleGalassia(VL, CASO);
const ALONI = [{ massa: 3e11, spin: 0.03 }, { massa: 5e11, spin: 0.05 }, { massa: 1e12, spin: 0.06 }, { massa: 2e12, spin: 0.035 }, { massa: 3e12, spin: 0.04 }, { massa: 3e12, spin: 0.04, fusioni: [{ quando: 9, rapporto: 0.8 }] }];
const GALASSIE = ALONI.map((a, k) => { const c = sorgente(`prova/galassia ${k}`); return { nome: `prova/galassia ${k}`, caso: c, forma: formaDaAlone({ fusioni: [], ...a }, c) }; });
const TUTTE = [{ nome: RADICE, caso: CASO, forma: VL }, ...GALASSIE];
const SOLE = 8; // kpc: dove si fanno i riscontri «vicino al Sole»

console.log('\nA. IL MEZZO TRA LE STELLE');
prova('la polvere: le taglie di MRN fissano grani ed estinzione; più metalli, più polvere; il blu è assorbito di più', () => {
  const p = V.polvere(1), p2 = V.polvere(0.5);
  tra(p.suGas, 0.0070, 0.0072, 'polvere/gas a metalli solari (LEGGI.polvere × Z☉)'); tra(p2.AV / p.AV, 0.4999, 0.5001, 'estinzione ∝ metalli');
  assert.ok(p.estinzione(440e-9) > p.estinzione(550e-9) && p.estinzione(550e-9) > p.estinzione(700e-9) && p.estinzione(150e-9) > p.estinzione(440e-9), 'arrossamento');
  // la massa torna: ∫(4π/3)ρa³·A·a^−3,5 da = polvere/gas × 1,4 m_p
  const m = V.MEZZO.mrn, N = 4000, h = Math.log(m.aMax / m.aMin) / N; let massa = 0, grani = 0; for (let i = 0; i < N; i++) { const a = m.aMin * Math.exp((i + 0.5) * h); massa += (4 * Math.PI / 3) * V.MEZZO.grano.densita * a ** 3 * p.costante * Math.pow(a, -3.5) * a * h; grani += p.costante * Math.pow(a, -3.5) * a * h; }
  tra(massa / (p.suGas * V.dentroMezzo.MASSA_PER_H), 0.999, 1.001, 'massa dei grani per atomo di H'); tra(grani / p.graniPerH, 0.999, 1.001, 'numero di grani per atomo di H');
  riscontro('polvere', 'costante di MRN A (cm^2,5 per H)', p.costante * 1e5, 1.5e-25, { fonte: 'Draine & Lee 1984: 10^−25,11 + 10^−25,13' });
  riscontro('polvere', 'estinzione per colonna A_V/N_H (mag·cm²)', p.AV * 1e4, 5.3e-22, { fonte: 'Bohlin, Savage & Drake 1978' });
  riscontro('polvere', 'R_V = A_V/(A_B − A_V)', p.RV, 3.1, { entro: 1.2, fonte: 'Via Lattea, mezzo diffuso' });
  riscontro('polvere', 'grani in un m³ dove c\'è 1 atomo/cm³', p.graniPerH * 1e6, [1e-4, 1e-3], { fonte: 'ordine di grandezza dai libri' });
});

prova('i raggi cosmici: UNA fonte con materia.js (lo spettro è il suo; frenato dal vento del Sole ridà energiaDeiPrimari)', () => {
  assert.strictEqual(V.spettroCosmici, MAT.spettroInterstellare, 'nessuna copia: la funzione è quella di materia.js'); assert.ok(!('COPIA_MATERIA' in V));
  // che `spettroInterstellare` sia davvero lo spettro da cui materia.js fa i suoi primari: frenato con il suo campo di forza (Φ = 0,55 GV,
  // m_p = 0,93827 GeV: [V] letti in materia.js) e integrato come là (trapezi in logaritmo, 80 passi) deve ridare energiaDeiPrimari a ogni soglia
  const c = { phi: 0.55, mP: 0.93827 }, frenato = (E) => (MAT.spettroInterstellare(E + c.phi) * (E * (E + 2 * c.mP))) / ((E + c.phi) * (E + c.phi + 2 * c.mP));
  const integra = (f, a, b, n = 80) => { const h = Math.log(b / a) / n; let s = 0; for (let i = 0; i <= n; i++) { const x = a * Math.exp(i * h); s += (i === 0 || i === n ? 0.5 : 1) * f(x) * x; } return s * h; };
  for (const soglia of [0, 1, 3, 10, 30]) { const a = Math.max(Math.sqrt(soglia * soglia + c.mP * c.mP) - c.mP, 0.02), mio = Math.PI * integra(frenato, a, 1e6), suo = MAT.energiaDeiPrimari(soglia).numero, mioE = Math.PI * integra((E) => E * frenato(E), a, 1e6), suoE = MAT.energiaDeiPrimari(soglia).flusso;
    tra(mio / suo, 1 - 1e-9, 1 + 1e-9, `numero di primari sopra ${soglia} GV`); tra(mioE / suoE, 1 - 1e-9, 1 + 1e-9, `energia dei primari sopra ${soglia} GV`); }
  tra(V.dentroMezzo.MP_GEV / c.mP, 0.999, 1.001, 'la massa del protone dalle costanti di leggi.js');
  const s = V.raggiCosmiciIn(null), B = Math.sqrt(2 * 4e-7 * Math.PI * s.energia);
  assert.equal(s.relativo, 1); assert.ok(V.raggiCosmiciIn(VL).relativo === MAT.cieloRelativo({ ritmoSN: VL.ritmoSN.totale, forma: VL }).relativo, 'il cielo relativo è quello di materia.js');
  riscontro('raggi cosmici', 'densità di energia vicino al Sole (eV/cm³)', s.energia / EV / 1e6, [0.83, 1.8], { entro: 1.3, fonte: 'Voyager 1 (Cummings et al. 2016): 0,83; Webber 1998: 1,8' });
  riscontro('raggi cosmici', '  doppione: risalita.js DATI.COSMICI_GALASSIA (eV/cm³)', RISALITA.COSMICI_GALASSIA / EV / 1e6, s.energia / EV / 1e6, { entro: 1.3, fonte: 'la stessa grandezza, scritta là e integrata qui' });
  riscontro('raggi cosmici', 'ionizzazione primaria ζ (10⁻¹⁷ per H e per s)', s.ionizzazione * 1e17, [7.4, 46], { fonte: '[V] H₃⁺ nelle nubi diffuse: ζ₂ = 3,5·10⁻¹⁶ per molecola, da 1,7 a 10,6 (Indriolo & McCall 2012, arXiv:1111.6936); per atomo ζ₂/2,3' });
  riscontro('raggi cosmici', '  la stessa, contro il valore «classico»', s.ionizzazione * 1e17, [0.7, 2], { fonte: 'Spitzer & Tomasko 1968; Voyager: 1,5' });
  riscontro('raggi cosmici', 'campo magnetico di equipartizione (nT)', B * 1e9, [0.5, 0.6], { fonte: 'vicino al Sole, totale: Beck 2001; Ferrière 2001' });
  riscontro('raggi cosmici', 'flusso da tutte le direzioni (per cm² e per s)', s.flusso / 1e4, [3, 6], { entro: 10, fonte: 'dominato dai MeV, che nessuno misura bene' });
});

prova('due fasi: la curva P(n) di Field, Goldsmith e Habing con gli ingressi di Wolfire ha un minimo e un massimo', () => {
  const c = V.equilibrioTermico({ G0: 1.7, zeta: 1e-16 / 1.67, Zr: 1 }); assert.ok(c.dueFasi, 'ci sono due fasi');
  assert.ok(c.Pmin < c.P2 && c.P2 < c.Pmax); const fr = c.freddo(c.P2), ti = c.tiepido(c.P2); tra(fr.T, 20, 300, 'il freddo (K)'); tra(ti.T, 5000, 1.2e4, 'il tiepido (K)'); assert.ok(fr.n > 20 * ti.n, 'il freddo è molto più denso');
  // i due rami sono stabili: la pressione cresce con la densità
  const p = c.punti; let iMax = 0; for (let j = 1; j < p.length; j++) if (p[j].P === c.Pmax) iMax = j; for (let j = 1; j <= iMax; j++) assert.ok(p[j].P > p[j - 1].P && p[j].n > p[j - 1].n, 'ramo tiepido');
  // più luce ultravioletta, pressioni più alte; senza metalli nel gas, niente raffreddamento: pressioni più alte
  assert.ok(V.equilibrioTermico({ G0: 5, zeta: 6e-17, Zr: 1 }).Pmax > c.Pmax);
  riscontro('due fasi', 'P_min con G₀ = 1,7 e ζ_tot = 10⁻¹⁶ (K/cm³)', c.Pmin, 1960, { fonte: 'Wolfire et al. 2003, al cerchio solare' });
  riscontro('due fasi', 'P_max, stessi ingressi (K/cm³)', c.Pmax, 4810, { fonte: 'Wolfire et al. 2003' });
  riscontro('due fasi', 'T del gas freddo a √(P_min·P_max) (K)', fr.T, [40, 100], { fonte: 'righe a 21 cm in assorbimento: Heiles & Troland 2003' });
  riscontro('due fasi', 'T del gas tiepido (K)', ti.T, [6000, 9000], { entro: 1.2, fonte: 'Wolfire et al. 2003' });
});

prova('contenuto(): le fasi sommate ridanno la densità di galassie.js in ogni punto di sette galassie', () => {
  let n = 0, peggio = 0;
  for (const g of TUTTE) { const c = g.caso.sotto('prova punti'), R = g.forma.anelli.bordo[ANELLI];
    for (let i = 0; i < 300; i++) { const pt = { r: 0.05 + c(`r ${i}`) * R, z: (2 * c(`z ${i}`) - 1) * 0.5, fi: 2 * Math.PI * c(`fi ${i}`) }, x = V.contenuto(g.forma, pt), vol = x.gas.fasi.reduce((s, f) => s + f.volume, 0);
      if (!(x.gas.nH > 0)) continue; n++; peggio = Math.max(peggio, Math.abs(x.gas.chiusura - 1), Math.abs(vol - 1));
      for (const f of x.gas.fasi) assert.ok(f.n >= 0 && f.volume >= -1e-12 && f.volume <= 1 + 1e-12 && (f.volume === 0 || f.T > 0) && isFinite(f.n), `${g.nome} ${JSON.stringify(pt)} ${f.nome}: n=${f.n} V=${f.volume} T=${f.T}`);
      assert.ok(x.polvere.densita >= 0 && x.fondo.fotoni > 0 && x.cosmici.numero > 0 && x.campo.B > 0); } }
  assert.ok(peggio < 1e-9, `chiusura: scarto massimo ${peggio}`); console.log(`      (${n} punti con gas; scarto massimo della chiusura ${peggio.toExponential(1)})`);
});

prova('la massa del gas contata dal basso è quella che galassie.js tiene (regola 4), galassia per galassia', () => {
  for (const g of TUTTE) { const t = performance.now(), m = V.massaDelGas(g.forma); if (g.forma === VL) costo('massaDelGas (7056 punti)', performance.now() - t); g.massa = m;
    if (g.forma.massaGas > 0) tra(m.totale / g.forma.massaGas, 0.995, 1.005, `${g.nome}: gas integrato / massaGas`); const somma = Object.values(m.fasi).reduce((s, v) => s + v, 0); tra(somma / m.totale, 1 - 1e-9, 1 + 1e-9, 'le fasi sommate'); }
  const f = TUTTE[0].massa.fasi, tot = TUTTE[0].massa.totale;
  riscontro('gas della galassia', 'gas in tutto (10⁹ M☉)', tot / 1e9, [7, 12], { entro: 1.5, fonte: 'Via Lattea: H I 8·10⁹ + H₂ 1·10⁹, con l\'elio (Kalberla & Kerp 2009)' });
  riscontro('gas della galassia', 'molecolare (10⁹ M☉, con l\'elio)', f['molecolare freddo'] / 1e9, [1.0, 1.6], { fonte: 'Heyer & Dame 2015' });
  riscontro('gas della galassia', 'atomico freddo / atomico tutto', f['atomico freddo'] / (f['atomico freddo'] + f['atomico tiepido']), [0.3, 0.5], { fonte: 'Heiles & Troland 2003: ~40% dell\'H I è freddo' });
  riscontro('gas della galassia', 'ionizzato tiepido (10⁹ M☉)', f['ionizzato tiepido'] / 1e9, [1, 2], { fonte: 'strato di Reynolds: ~10⁹ M☉ (Ferrière 2001)' });
  console.log(`      (${TUTTE.map((g) => `${g.forma.classe}: ${num(g.massa.totale)} M☉, molecolare ${(100 * (g.massa.fasi['molecolare freddo'] || 0) / Math.max(g.massa.totale, 1e-300)).toFixed(0)}%`).join(' · ')})`);
});

prova('vicino al Sole della galassia di prova: pressioni, luce, fasi; sui bracci più gas molecolare; in alto solo gas rado', () => {
  const Q = V.quadro(VL); let k = 0; while (VL.anelli.bordo[k + 1] < SOLE) k++; const a = Q.anello(k), tra2 = V.contenuto(VL, { r: SOLE, z: 0, fase: 0.5 }), cresta = V.contenuto(VL, { r: SOLE, z: 0, fase: 0 }), alto = V.contenuto(VL, { r: SOLE, z: 0.5, fase: 0.25 });
  assert.ok(cresta.gas.nH > tra2.gas.nH && cresta.gas.molecolare > tra2.gas.molecolare, 'sulla cresta del braccio c\'è più gas, e più molecolare'); assert.ok(cresta.dove.sulBraccio && !tra2.dove.sulBraccio);
  assert.ok(alto.gas.nH < 0.01 * cresta.gas.nH && alto.gas.fasi[0].massa < 0.01, 'a mezzo kpc dal piano non ci sono nubi');
  // la media nel piano attorno al cerchio solare (tutte le posizioni rispetto ai bracci)
  let n = 0; const vol = {}, caldo = { n: 0, T: 0 }, NF = 48; for (let i = 0; i < NF; i++) { const c = V.contenuto(VL, { r: SOLE, z: 0, fase: (i + 0.5) / NF - 0.5 }); n += c.gas.nH / NF; for (const f of c.gas.fasi) { vol[f.nome] = (vol[f.nome] || 0) + f.volume / NF; if (f.nome === 'caldo') { caldo.n += f.n / NF; caldo.T = f.T; } } }
  riscontro('vicino al Sole', 'atomi di H per cm³, media nel piano', n / 1e6, [0.6, 1.2], { fonte: 'Ferrière 2001 (tutte le fasi, a z = 0)' });
  riscontro('vicino al Sole', 'pressione termica delle due fasi (K/cm³)', a.curva.P2, 3800, { fonte: 'Jenkins & Tripp 2011, dal C I' });
  riscontro('vicino al Sole', 'peso dello strato di gas (K/cm³)', a.peso(1) / KCM, [1e4, 2.8e4], { fonte: 'Boulares & Cox 1990: 2,8·10⁴ in tutto, ~10⁴ dal gas' });
  riscontro('vicino al Sole', 'campo ultravioletto G₀ (unità di Habing)', a.G0, 1.7, { fonte: 'Draine 1978' });
  riscontro('vicino al Sole', 'luce delle stelle (eV/cm³)', a.uStelle / EV / 1e6, 0.5, { fonte: 'Mathis, Mezger & Panagia 1983' });
  riscontro('vicino al Sole', 'volume del gas caldo (parte)', vol.caldo, [0.17, 0.5], { fonte: 'de Avillez & Breitschwerdt 2004: 0,17–0,24; McKee & Ostriker 1977: 0,7' });
  riscontro('vicino al Sole', 'T del gas caldo (10⁶ K)', caldo.T / 1e6, 1, { fonte: 'Bolla Locale, raggi X molli' });
  riscontro('vicino al Sole', 'atomi per cm³ nel gas caldo (la Bolla Locale)', caldo.n / 1e6, 0.005, { fonte: 'Snowden et al. 1998' });
  riscontro('vicino al Sole', 'volume del gas ionizzato tiepido (parte)', vol['ionizzato tiepido'], [0.04, 0.2], { fonte: 'Gaensler et al. 2008 (a z = 0: 0,04)' });
  riscontro('vicino al Sole', 'fotoni ionizzanti per M☉/anno di stelle (10⁵³/s)', a.resa.Q0 / 1e53, 1.4, { entro: 1.5, fonte: 'Kennicutt 1998, con le masse di Kroupa' });
  riscontro('vicino al Sole', 'luce 6–13,6 eV per M☉/anno (10³⁶ W)', a.resa.fuv / 1e36, [1.3, 2], { fonte: 'Kennicutt 1998 (L_ν a 150 nm × banda)' });
  riscontro('vicino al Sole', 'massa più grande di una nube: Jeans del disco (10⁶ M☉)', a.jeansKg / MSOLE / 1e6, 6, { fonte: 'Williams & McKee 1997: taglio a 6·10⁶ M☉' });
  riscontro('vicino al Sole', 'A_V attraverso il disco (mag)', (a.sigmaGas / V.dentroMezzo.MASSA_PER_H) * a.polvere.AV, [0.3, 0.6], { fonte: 'verso i poli galattici: 0,15–0,3 per lato' });
  // l'alone caldo di galassie.js lì: più pressione del disco? (incoerenza a monte: si stampa)
  const x = V.contenuto(VL, { r: SOLE, z: 0, fase: 0.25 }); riscontro('a monte', 'pressione dell\'alone caldo di galassie.js a 8 kpc / peso del disco', (2.3 * x.alone.nH * x.alone.T * K.kB) / a.peso(1), [0, 0.3], { entro: 1, fonte: 'dovrebbe essere ben sotto 1: l\'alone isotermo r⁻² è troppo denso al centro' });
  riscontro('a monte', 'spessore del gas: peso / (ρ·σ_g²) (1 se idrostatico)', a.peso(1) / ((a.sigmaGas / (2 * Q.hGas)) * (LEGGI.sigmaGas * 1e3) ** 2), 1, { entro: 1.3, fonte: 'equilibrio idrostatico con LEGGI.sigmaGas e LEGGI.spessoreGas' });
});

prova('nel tempo: stessa funzione; i bracci girano; il fondo era più caldo; un resto è quello di galassie.js', () => {
  const p = { r: SOLE, z: 0.03, fi: 1.1 }, a = V.contenuto(VL, p, 0), b = V.contenuto(VL, p, 0); assert.deepEqual(JSON.stringify(a.gas), JSON.stringify(b.gas));
  const Ma = 1e6 * ANNO, dopo = V.contenuto(VL, p, 30 * Ma); assert.notEqual(dopo.gas.nH, a.gas.nH, 'in 30 milioni di anni il braccio si è spostato'); tra(V.contenuto(VL, { r: SOLE, fase: 0.1 }, 30 * Ma).gas.nH / V.contenuto(VL, { r: SOLE, fase: 0.1 }, 0).gas.nH, 1 - 1e-9, 1 + 1e-9, 'a fase del braccio fissa non cambia');
  assert.ok(V.contenuto(VL, p, -5e9 * ANNO).fondo.T > 1.3 * a.fondo.T && a.fondo.T > 2.72 && a.fondo.T < 2.73); tra(a.fondo.fotoni / 1e6, 409, 413, 'fotoni del fondo per cm³ (411)');
  // i resti delle ultime supernove del catalogo: stesso raggio (stesse formule), con la densità dell'anello e la massa espulsa della stella vera
  const O = V.oggettiIn(VL, { centro: [0, 0, 0], raggio: 60 }, 0, { caso: CASO, catalogo: CAT, tipi: ['resto di supernova'], massimo: 5 }).oggetti.filter((o) => o.delCatalogo), suoi = CAT.sorgenti.filter((s) => s.tipo === 'supernova');
  assert.equal(O.length, suoi.length); for (const s of suoi) { const mio = O.find((o) => Math.abs(o.eta - s.eta) < 1e-6); assert.ok(mio, 'c\'è'); tra(mio.raggio / s.raggioM, 1 - 1e-9, 1 + 1e-9, `raggio del resto di ${s.eta.toFixed(0)} anni`); tra(mio.pos[0] / (s.pos[0] * VL.unitaKpc), 1 - 1e-12, 1 + 1e-12, 'posto'); }
  // le fasi: il raggio cresce sempre, senza salti; alla fine il momento è quello che galassie.js usa per il vento (Kim & Ostriker)
  let prima = 0; for (let lt = 0; lt < 7; lt += 0.02) { const r = V.restoSupernova({ n: 1e6, t: 10 ** lt }); assert.ok(r.raggio >= prima * (1 - 1e-12), `il raggio non cala (t = ${10 ** lt})`); assert.ok(prima === 0 || r.raggio / prima < 1.2, 'nessun salto'); prima = r.raggio; }
  for (const n of [1e5, 1e6, 1e7]) { const r = V.restoSupernova({ n, t: 1e9 }); riscontro('resti di supernova', `momento finale a ${n / 1e6} atomi/cm³ (10⁵ M☉·km/s)`, r.momento / MSOLE / 1e3 / 1e5, (LEGGI.momentoSN[0] * Math.pow(n / 1e6, LEGGI.momentoSN[1])) / 1e5, { entro: 1.5, fonte: 'seconda via: LEGGI.momentoSN di galassie.js (Kim & Ostriker 2015)' }); }
  const r1 = V.restoSupernova({ n: 1e6, t: 1e9 }); riscontro('resti di supernova', 'raggio a cui si dissolve, 1 atomo/cm³ (pc)', r1.raggio / PC, [50, 100], { fonte: 'Cioffi, McKee & Bertschinger 1988: ~70 pc' });
});

console.log('\nB. GLI OGGETTI CHE SI TROVANO ZOOMANDO');
const TOT = V.quantiInTutto(VL);
const chiave = (o) => `${o.indirizzo}|${o.pos.map((v) => v.toPrecision(12)).join(',')}|${o.raggio.toPrecision(12)}`;
prova('oggettiIn: stesso indirizzo, stesso oggetto; chi sta in una regione piccola c\'è, identico, in una più grande', () => {
  const piccola = { centro: [SOLE, 0.3, 0], raggio: 0.12 }, media = { centro: [SOLE, 0.2, 0.02], raggio: 0.45 }, opz = { caso: CASO, catalogo: CAT, massimo: 1e9 };
  let t = performance.now(); const A = V.oggettiIn(VL, piccola, 0, opz); costo(`oggettiIn, sfera di ${piccola.raggio * 1e3} pc (${A.oggetti.length} oggetti, ${A.celle} celle)`, performance.now() - t);
  t = performance.now(); const B = V.oggettiIn(VL, media, 0, opz); costo(`oggettiIn, sfera di ${media.raggio * 1e3} pc (${B.oggetti.length} oggetti, ${B.celle} celle)`, performance.now() - t);
  assert.deepEqual(V.oggettiIn(VL, piccola, 0, opz).oggetti.map(chiave), A.oggetti.map(chiave)); assert.ok(A.oggetti.length > 20, `oggetti nella sfera piccola: ${A.oggetti.length}`);
  const inB = new Set(B.oggetti.map(chiave)); for (const o of A.oggetti) assert.ok(inB.has(chiave(o)), `manca nella regione grande: ${o.indirizzo}`);
  const dentro = (o, r) => Math.hypot(o.pos[0] - r.centro[0], o.pos[1] - r.centro[1], o.pos[2] - r.centro[2]) <= r.raggio; assert.equal(B.oggetti.filter((o) => dentro(o, piccola)).length, A.oggetti.length, 'e nella grande non ce n\'è nessuno in più dentro la piccola');
  // con la nebbia: ciò che si vede da lontano è un sottoinsieme (gli stessi individui), e dice quanti sono davvero
  t = performance.now(); const N = V.oggettiIn(VL, media, 0, { caso: CASO, catalogo: CAT, massimo: 60 }); const inTutti = new Set(B.oggetti.map(chiave)); for (const o of N.oggetti) assert.ok(inTutti.has(chiave(o)), 'la nebbia mostra oggetti veri');
  for (const tipo in N.nebbia) { const nb = N.nebbia[tipo]; assert.ok(nb.mostrati <= B.nebbia[tipo].mostrati); tra(nb.veri / B.nebbia[tipo].veri, 1 - 1e-12, 1 + 1e-12, `${tipo}: quanti sono davvero`); }
  // i più grandi per primi: le nubi mostrate nella nebbia sono più pesanti di quelle tolte, anello per anello
  const nubiTutte = B.oggetti.filter((o) => o.tipo === 'nube molecolare'), nubiViste = new Set(N.oggetti.filter((o) => o.tipo === 'nube molecolare').map((o) => o.indirizzo));
  for (let k = 0; k < ANELLI; k++) { const viste = nubiTutte.filter((o) => o.anello === k && nubiViste.has(o.indirizzo)), tolte = nubiTutte.filter((o) => o.anello === k && !nubiViste.has(o.indirizzo)); if (viste.length && tolte.length) assert.ok(Math.min(...viste.map((o) => o.massaKg)) >= Math.max(...tolte.map((o) => o.massaKg)), `anello ${k}: la nebbia tiene le più grandi`); }
});

prova('un ramo cambia una cosa sola: l\'evento «…/nube/…/raggio» sposta quella nube e nessun\'altra', () => {
  const reg = { centro: [SOLE, 0, 0], raggio: 0.4 }, A = V.oggettiIn(VL, reg, 0, { caso: CASO, massimo: 1e9, tipi: ['nube molecolare'] }).oggetti, vittima = A[Math.floor(A.length / 2)];
  const ramo = sorgente(RADICE, { [`${vittima.indirizzo}/angolo`]: 1 }), B = V.oggettiIn(VL, { centro: reg.centro, raggio: 1.5 }, 0, { caso: ramo, massimo: 1e9, tipi: ['nube molecolare'] }).oggetti, perInd = new Map(B.map((o) => [o.indirizzo, o]));
  let uguali = 0; for (const o of A) { const b = perInd.get(o.indirizzo); if (o === vittima) { assert.ok(b && chiave(b) !== chiave(o), 'la nube del ramo si è spostata'); tra(b.massaKg / o.massaKg, 1 - 1e-12, 1 + 1e-12, 'ma è la stessa nube'); } else { assert.ok(b && chiave(b) === chiave(o), `un'altra nube è cambiata: ${o.indirizzo}`); uguali++; } }
  assert.ok(uguali > 50);
});

prova('i conteggi tornano con gli attesi (Poisson), le masse delle nubi con il gas molecolare, la pendenza con −1,6', () => {
  const tutto = { centro: [0, 0, 0], raggio: 100 }; let t = performance.now();
  const R = V.oggettiIn(VL, tutto, 0, { caso: CASO, catalogo: CAT, massimo: 1e9, tipi: ['resto di supernova', 'nebulosa planetaria'] }); costo(`oggettiIn, tutta la galassia, resti e planetarie senza nebbia (${R.oggetti.length} oggetti, ${R.celle} celle)`, performance.now() - t);
  const conta = (tipo) => R.oggetti.filter((o) => o.tipo === tipo).length, entro5 = (n, att, che) => assert.ok(Math.abs(n - att) < 5 * Math.sqrt(att) + 1, `${che}: ${n} contro ${att.toFixed(0)} attesi`);
  entro5(conta('nebulosa planetaria'), TOT.planetarie, 'nebulose planetarie'); entro5(conta('resto di supernova'), TOT.resti, 'resti di supernova');
  // nessun resto del processo di qui è più giovane della più vecchia supernova del catalogo: lì parlano le stelle vere
  const finoA = Math.max(...CAT.sorgenti.filter((s) => s.tipo === 'supernova').map((s) => s.eta)); assert.ok(R.oggetti.every((o) => o.tipo !== 'resto di supernova' || o.delCatalogo || o.eta >= finoA), 'niente doppioni con il catalogo');
  // le nubi sopra 10⁴ M☉ di tutta la galassia: quante, quanta massa, che pendenza
  t = performance.now(); const Cn = V.censimento(VL), soglia = 1e4 * MSOLE; let attese = 0, massaAttesa = 0; for (const A of Cn.anelli) if (A.nubi.K > 0) { attese += A.nubi.sopra(soglia); massaAttesa += (A.nubi.K * (Math.pow(A.nubi.Mmax, 0.4) - Math.pow(Math.max(soglia, A.nubi.Mmin), 0.4))) / 0.4; }
  // (si elencano con una nebbia larga quanto basta: `massimo` = le attese sopra 10⁴ M☉ per anello non è una soglia unica, quindi si prendono tutte quelle più grandi di 10⁴ da un elenco più lungo)
  const nubi = V.oggettiIn(VL, tutto, 0, { caso: CASO, massimo: 6 * attese, tipi: ['nube molecolare'] }).oggetti.filter((o) => o.massaKg >= soglia); costo(`oggettiIn, tutta la galassia, le ${nubi.length} nubi sopra 10⁴ M☉`, performance.now() - t);
  entro5(nubi.length, attese, 'nubi sopra 10⁴ M☉'); const massa = nubi.reduce((s, o) => s + o.massaKg, 0); tra(massa / massaAttesa, 0.9, 1.1, 'massa nelle nubi sopra 10⁴ M☉ / attesa dal gas molecolare');
  // la pendenza, a massima verosimiglianza per una legge di potenza TRONCATA tra 10⁴ e 5·10⁵ M☉: ⟨ln(M/M₀)⟩ = 1/α − L·T^−α/(1 − T^−α), T = 50, L = ln T → α per bisezione
  const T = 50, lm = nubi.filter((o) => o.massaKg < T * soglia).map((o) => Math.log(o.massaKg / soglia)), medio = lm.reduce((s, v) => s + v, 0) / lm.length, attesa = (al) => 1 / al - (Math.log(T) * Math.pow(T, -al)) / (1 - Math.pow(T, -al));
  let lo = 0.05, hi = 3; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (attesa(m) > medio) lo = m; else hi = m; } const pend = 1 + 0.5 * (lo + hi);
  tra(pend, 1.5, 1.7, 'pendenza della funzione di massa (1,6)');
  // dove nascono le stelle: sui bracci
  const sui = nubi.filter((o) => Math.abs(o.faseBraccio) < 0.25).length / nubi.length; assert.ok(VL.bracci.contrastoGas > 0 && sui > 0.6, `nubi nella metà del giro attorno ai bracci: ${sui.toFixed(2)}`);
  console.log(`      (${nubi.length} nubi sopra 10⁴ M☉, ${(100 * sui).toFixed(0)}% attorno ai bracci; pendenza ${pend.toFixed(2)}; massa ${num(massa / MSOLE)} M☉ contro ${num(massaAttesa / MSOLE)} attese)`);
  tra(TOT.massaMolecolare / TUTTE[0].massa.fasi['molecolare freddo'], 0.97, 1.03, 'la massa molecolare del censimento è quella di contenuto()');
});

prova('che cosa emettono: Hα e Hβ nel rapporto di ricombinazione, [O III] solo con stelle caldissime; colori veri', () => {
  const O = V.oggettiIn(VL, { centro: [SOLE, 0, 0], raggio: 1.2 }, 0, { caso: CASO, catalogo: CAT, massimo: 300 }).oggetti, di = (t) => O.filter((o) => o.tipo === t), riga = (o, n) => o.emette.righe.find((r) => r.nome === n)?.W ?? 0;
  const hii = di('regione H II'), pn = di('nebulosa planetaria'), rif = di('nebulosa a riflessione'), nubi = di('nube molecolare'), snr = di('resto di supernova'); assert.ok(hii.length > 20 && pn.length > 3 && rif.length > 20 && nubi.length > 20 && snr.length > 20, `${hii.length} ${pn.length} ${rif.length} ${nubi.length} ${snr.length}`);
  for (const o of hii) { tra(riga(o, 'Halfa') / riga(o, 'Hbeta'), 2.859, 2.861, 'Hα/Hβ'); const hnu = (6.626e-34 * K.c) / 656.28e-9; tra(riga(o, 'Halfa') / (o.ionizzanti * 0.45 * hnu), 0.999, 1.001, 'un fotone Hα ogni 2,2 fotoni ionizzanti'); assert.ok(o.raggio > 0 && o.nH > 0 && o.stella.T > 1.5e4); }
  // [O III]/Hβ cresce con la temperatura della stella
  const ord = hii.slice().sort((a, b) => a.stella.T - b.stella.T), q = (o) => riga(o, 'OIII') / riga(o, 'Hbeta'); assert.ok(q(ord[ord.length - 1]) > q(ord[0]) && q(ord[0]) < 0.3, `[O III]/Hβ da ${q(ord[0]).toExponential(1)} (${ord[0].stella.T.toFixed(0)} K) a ${q(ord[ord.length - 1]).toFixed(2)} (${ord[ord.length - 1].stella.T.toFixed(0)} K)`);
  // la sfera di Strömgren nel gas diffuso: R³ = 3Q/(4π·α_B·n_e·n_p)
  for (const o of hii.filter((x) => x.stato === 'nel gas diffuso').slice(0, 10)) { const aB = 2.59e-19 * Math.pow(o.T / 1e4, -0.7); tra(o.raggio / Math.cbrt((3 * o.ionizzanti) / (4 * Math.PI * aB * 1.1 * o.nH ** 2)), 0.999, 1.001, 'Strömgren'); }
  // IL TERMOSTATO: la temperatura del gas non è data, esce dal bilancio; più metalli → più freddo → meno [O III] (a parità di stella)
  { const Tz = [0.2, 0.5, 1, 2, 4].map((z) => V.temperaturaNebulosa(40000, z, 0.8)); for (let i = 1; i < Tz.length; i++) assert.ok(Tz[i] < Tz[i - 1], `T_e cala con i metalli: ${Tz.map((x) => x.toFixed(0))}`); assert.ok(V.temperaturaNebulosa(50000, 1, 0.8) > V.temperaturaNebulosa(35000, 1, 0.8), 'una stella più calda scalda di più');
    const s = ST.stella(40, { Z: 1 }), Lw = s.L * LSOLE, Q = [13.598].map((e) => V.fotoniSopra(Lw, s.T, e)), neb = (Zr, n) => { const R = Math.cbrt((3 * Q[0]) / (4 * Math.PI * 3.03e-19 * 1.1 * n * n)), N = V.dentroOggetti.righeNebulosa({ st: { Lw, T: s.T }, Zr, n, raggio: R }); return { ...N, q: N.righe[2].W / N.righe[1].W, colore: V.coloreVero(N.righe).rgb }; };
    const povera = neb(0.3, 1e8), solare = neb(1, 1e8), ricca = neb(3, 1e8), rada = neb(1, 1e6); assert.ok(povera.q > solare.q && solare.q > 10 * ricca.q, `[O III]/Hβ attorno alla stessa stella di 40 M☉: ${povera.q.toFixed(2)} (Z = 0,3), ${solare.q.toFixed(2)} (1), ${ricca.q.toFixed(3)} (3)`);
    assert.ok(solare.y > rada.y && solare.y > 0.5, `O⁺⁺ riempie di più una nebulosa densa (${solare.y.toFixed(2)}) che una rada (${rada.y.toFixed(2)})`); assert.ok(ricca.colore[0] === 255 && ricca.colore[2] > ricca.colore[1], `con tanti metalli la regione H II è rosa di Hα: ${ricca.colore}`);
    // l'energia torna: le righe di O III nel visibile non portano via più di quanto la stella dà al gas (⟨hν⟩ − 13,6 eV a fotone)
    const kT = K.kB * s.T, x0 = (13.598 * EV) / kT, avanza = Q[0] * ((kT * V.dentroMezzo.planck3(x0)) / V.dentroMezzo.planck2(x0) - 13.598 * EV); for (const N of [povera, solare, ricca, rada]) assert.ok(N.righe[2].W / 0.745 < avanza, '[O III] non supera il riscaldamento');
    riscontro('oggetti', 'T del gas di una regione H II a metalli solari, stella di 40 M☉ (K)', solare.Te, [7500, 8500], { entro: 1.15, fonte: 'Shaver et al. 1983: T_e ≈ 7600 K all\'abbondanza solare di ossigeno' });
    riscontro('oggetti', '[O III] 500,7/Hβ, stessa nebulosa (nube di 100 atomi/cm³)', solare.q, [0.3, 3], { entro: 1.3, fonte: 'regioni H II a metalli solari (Orione ~3: Baldwin et al. 1991)' });
    riscontro('oggetti', '  la stessa con un terzo dei metalli', povera.q, [3, 7], { entro: 1.3, fonte: '30 Doradus e simili: ~5 (Kennicutt et al. 2000)' }); }
  // i colori: una regione H II con poca [O III] è rosa (rosso > blu > verde); una planetaria è verde-azzurra; una nebulosa a riflessione è più blu della sua stella
  const fredda = ord[0].emette.colore; assert.ok(fredda[0] === 255 && fredda[2] > fredda[1], `H II di una stella «fredda»: ${fredda}`);
  for (const o of pn) { const c = o.emette.colore; assert.ok(c[1] === 255 && c[0] < 120, `planetaria: ${c}`); assert.ok(o.raggio <= V.OGGETTI.planetaria.raggio * 1.0001 && o.eta < 2.2e4); assert.ok(q(o) > 1 && o.T > 5000 && o.T < 3e4 && o.ossigenoDueVolte + o.ossigenoTreVolte <= 1 + 1e-9, `planetaria: [O III]/Hβ ${q(o)}, T_e ${o.T}`); }
  for (const o of rif) { const c = o.emette.colore, s = V.coloreVero([], { T: o.stella.T, W: 1 }).rgb; assert.ok(c[2] === 255 && c[0] / c[2] < s[0] / s[2], `riflessione ${c} contro stella ${s}`); assert.ok(o.stella.T < hii[0].stella.T + 3e4); }
  for (const o of nubi) { assert.equal(o.emette.colore, null); assert.ok(o.estinzione > 1 && o.oscura, 'una nube molecolare è una nebulosa oscura'); tra(o.viriale, 0.5, 3, 'le nubi di Larson sono vicine all\'equilibrio viriale'); assert.ok(o.quanteJeans > 1, 'contengono più masse di Jeans: possono fare stelle'); }
  for (const o of snr) { assert.ok(['libera', 'Sedov–Taylor', 'radiativa'].includes(o.fase)); if (o.fase === 'radiativa') assert.ok(riga(o, 'Halfa') > 0 && (o.T > 1e5) === (riga(o, 'OIII') > 0)); else assert.ok(o.raggiX >= 0 && o.emette.colore === null); }
  const rosse = V.coloreVero([{ nm: 656.28, W: 1 }]).rgb, verdi = V.coloreVero([{ nm: 500.68, W: 1 }]).rgb; assert.ok(rosse[0] === 255 && rosse[1] < 30 && rosse[2] < rosse[0] / 2, `Hα è rossa: ${rosse}`); assert.ok(verdi[1] === 255 && verdi[0] < 60 && verdi[2] > 100, `[O III] è verde-azzurra: ${verdi}`); // (656 nm sta fuori dal triangolo sRGB: riportarla dentro verso il grigio le dà un filo di blu)
  const sole = V.coloreVero([], { T: 5772, W: 1 }).rgb; assert.ok(Math.min(...sole) > 200, `il Sole è quasi bianco: ${sole}`);
  riscontro('oggetti', '[O III]/Hβ mediano delle nebulose planetarie', mediana(pn.map(q)), [5, 15], { fonte: 'tipico delle planetarie (Osterbrock & Ferland 2006)' });
  riscontro('oggetti', '  il più alto tra le planetarie (le più giovani e dense)', Math.max(...pn.map(q)), [10, 20], { entro: 1.3, fonte: 'le planetarie di eccitazione più alta: 15–20' });
  riscontro('oggetti', 'T_e mediana delle nebulose planetarie (K)', mediana(pn.map((o) => o.T)), [10000, 13000], { entro: 1.2, fonte: 'Osterbrock & Ferland 2006: 10–15 mila K' });
  { const tutte = V.oggettiIn(VL, { centro: [SOLE, 0, 0], raggio: 0.6 }, 0, { caso: CASO, massimo: 1e9, tipi: ['regione H II'] }).oggetti, calde = tutte.filter((o) => o.stella.T > 33000), rosa = tutte.filter((o) => o.emette.colore[0] === 255 && o.emette.colore[2] > o.emette.colore[1]).length / tutte.length;
    assert.ok(tutte.length > 200 && rosa > 0.5, `regioni H II rosa (di Hα) in 600 pc attorno al Sole: ${(100 * rosa).toFixed(0)}% di ${tutte.length}`); for (const o of tutte) assert.ok(o.T > 500 && o.T < 3e4 && o.ossigenoDueVolte >= 0 && o.ossigenoDueVolte <= 1);
    console.log(`      (tutte le ${tutte.length} regioni H II entro 600 pc dal Sole: ${(100 * rosa).toFixed(0)}% rosa; T_e mediana ${mediana(tutte.map((o) => o.T)).toFixed(0)} K; attorno alle ${calde.length} stelle sopra 33000 K [O III]/Hβ mediano ${mediana(calde.map(q)).toFixed(2)}, massimo ${Math.max(...calde.map(q)).toFixed(2)})`);
    riscontro('oggetti', '[O III]/Hβ mediano delle regioni H II attorno a stelle O (> 33000 K), vicino al Sole', mediana(calde.map(q)), [0.3, 3], { entro: 1.3, fonte: 'regioni H II galattiche a metalli solari' });
    riscontro('oggetti', 'T_e mediana delle regioni H II vicino al Sole (K)', mediana(tutte.map((o) => o.T)), [7000, 8500], { entro: 1.15, fonte: 'Shaver et al. 1983; Quireza et al. 2006' }); }
  riscontro('oggetti', 'densità media di una nube gigante (H per cm³)', V.nubeDi(1e5 * MSOLE, 1).nH / 1e6, [100, 300], { fonte: 'Solomon et al. 1987' });
  riscontro('oggetti', 'A_V attraverso una nube', V.nubeDi(1e5 * MSOLE, 1).AV, [7, 9], { fonte: 'Solomon et al. 1987: 170 M☉/pc²' });
});

prova('nel tempo: un resto cresce restando se stesso; le planetarie durano poco e sono rare per questo', () => {
  const reg = { centro: [SOLE, 0, 0], raggio: 1 }, opz = { caso: CASO, catalogo: CAT, massimo: 1e9, tipi: ['resto di supernova', 'nebulosa planetaria'] }, A = V.oggettiIn(VL, reg, 0, opz).oggetti, B = V.oggettiIn(VL, reg, 5000 * ANNO, opz).oggetti, perInd = new Map(B.map((o) => [o.indirizzo, o]));
  let cresciuti = 0, spariti = 0; for (const o of A) { const b = perInd.get(o.indirizzo); if (!b) { spariti++; continue; } tra(b.eta - o.eta, 4999.999, 5000.001, 'ha cinquemila anni in più'); assert.ok(b.raggio >= o.raggio);
    // (gli oggetti stanno fermi rispetto all'onda dei bracci, che gira: stesso raggio e stessa altezza, e l'angolo è avanzato di quanto ha girato l'onda)
    const ra = Math.hypot(o.pos[0], o.pos[1]), rb = Math.hypot(b.pos[0], b.pos[1]); tra(rb / ra, 1 - 1e-12, 1 + 1e-12, 'stesso raggio'); assert.equal(b.pos[2], o.pos[2]);
    if (!o.delCatalogo) { let dfi = Math.atan2(b.pos[1], b.pos[0]) - Math.atan2(o.pos[1], o.pos[0]) - (faseBraccioAlTempo(VL, ra, (5000 * ANNO) / V.GA_S) - faseBraccioAlTempo(VL, ra, 0)); dfi -= 2 * Math.PI * Math.round(dfi / (2 * Math.PI)); assert.ok(Math.abs(dfi) < 1e-9, `l'angolo segue l'onda: ${dfi}`); }
    cresciuti++; }
  const nate = B.filter((o) => o.eta < 5000).length; assert.ok(cresciuti > 20 && nate > 0, `${cresciuti} cresciuti, ${spariti} spariti, ${nate} nati`);
  const pnA = A.filter((o) => o.tipo === 'nebulosa planetaria'); assert.ok(pnA.every((o) => o.eta < 21000)); console.log(`      (in 1 kpc attorno al Sole: ${A.length} tra resti e planetarie; dopo 5000 anni ${cresciuti} sono gli stessi, più grandi; ${spariti} svaniti, ${nate} nuovi)`);
  riscontro('oggetti', 'nubi giganti (> 10⁵ M☉) nella galassia', TOT.nubiGiganti, [4000, 8000], { entro: 3, fonte: 'Via Lattea: Rice et al. 2016; Miville-Deschênes et al. 2017' });
  riscontro('oggetti', 'stelle che ionizzano (> ~9 M☉) vive', TOT.regioniHII, [1e5, 3e5], { entro: 3, fonte: 'stelle O e B fino a B2: ordine di grandezza' });
  riscontro('oggetti', 'nebulose planetarie nella galassia', TOT.planetarie, [1e4, 3e4], { entro: 3, fonte: 'Frew 2008: 24000 ± 4000; Jacoby 1980: 10000' });
  riscontro('oggetti', 'stelle che muoiono all\'anno lasciando una nana bianca', TOT.mortiPerAnno, [0.8, 1.2], { entro: 3, fonte: 'una all\'anno (Iben & Renzini 1983)' });
  riscontro('oggetti', 'resti di supernova più giovani di 60 mila anni', TOT.restiRadio, [1000, 3000], { entro: 3, fonte: '~300 noti in radio (Green 2019), stimati 1000–3000' });
  riscontro('oggetti', 'stelle nate nelle nubi con l\'1% per caduta libera (M☉/anno)', TOT.stelleNasconoNelleNubi, VL.storia.sfr[VL.storia.sfr.length - 1], { entro: 3, fonte: 'seconda via: le nascite di galassie.js oggi' });
});

prova('la nebbia non taglia il disco esterno: le regioni H II e le nubi mostrate da lontano stanno ai raggi di tutte le altre', () => {
  const Cn = V.censimento(VL), tutto = { centro: [0, 0, 0], raggio: 100 }, N = V.oggettiIn(VL, tutto, 0, { caso: CASO, massimo: 400, tipi: ['regione H II', 'nube molecolare'] });
  for (const [tipo, attese] of [['regione H II', (A) => A.hii[A.S.iSN]], ['nube molecolare', (A) => A.nubi.totale]]) { const o = N.oggetti.filter((x) => x.tipo === tipo), tot = Cn.anelli.reduce((s, A) => s + attese(A), 0), taglio = N.nebbia[tipo].soglia; assert.ok(taglio < 0.01, 'c\'è la nebbia');
    // anello per anello: i mostrati sono la stessa parte (taglio) degli attesi, entro Poisson
    for (const A of Cn.anelli) { const att = attese(A) * taglio, n = o.filter((x) => x.anello === A.k).length; assert.ok(Math.abs(n - att) < 5 * Math.sqrt(att) + 2, `${tipo}, anello ${A.k} (${VL.anelli.r[A.k].toFixed(1)} kpc): ${n} mostrati contro ${att.toFixed(1)} attesi`); }
    const rr = o.map((x) => Math.hypot(x.pos[0], x.pos[1])).sort((a, b) => a - b), ultimo = Math.max(...Cn.anelli.filter((A) => attese(A) * taglio > 3).map((A) => A.b1)); assert.ok(rr[rr.length - 1] > 0.7 * ultimo, `${tipo}: la più lontana mostrata sta a ${rr[rr.length - 1].toFixed(1)} kpc (ce ne sono fino a ${ultimo.toFixed(1)})`);
    assert.ok(tot > 0 && Math.abs(o.length - tot * taglio) < 5 * Math.sqrt(tot * taglio)); }
  // dove sono, per chilometro di raggio (dN/dR), e fin dove arrivano: dal censimento (tutte, non un campione)
  const perKpc = Cn.anelli.map((A) => A.hii[A.S.iSN] / (A.b1 - A.b0)), kMax = perKpc.indexOf(Math.max(...perKpc)), totH = Cn.anelli.reduce((s, A) => s + A.hii[A.S.iSN], 0); let cum = 0, r99 = 0; for (const A of Cn.anelli) { const n = A.hii[A.S.iSN]; if (cum + n >= 0.99 * totH && !r99) r99 = Math.sqrt(A.b0 ** 2 + ((0.99 * totH - cum) / n) * (A.b1 ** 2 - A.b0 ** 2)); cum += n; }
  const viste = N.oggetti.filter((x) => x.tipo === 'regione H II').map((x) => Math.hypot(x.pos[0], x.pos[1])); console.log(`      (regioni H II per kpc di raggio: ${Cn.anelli.filter((A) => A.hii[A.S.iSN] > 0).map((A) => `${VL.anelli.r[A.k].toFixed(0)} kpc: ${num(perKpc[A.k], 2)}`).join(' · ')}; le 400 mostrate: mediana ${mediana(viste).toFixed(1)} kpc, massimo ${Math.max(...viste).toFixed(1)} kpc)`);
  riscontro('oggetti', 'raggio a cui le regioni H II sono di più, per kpc (kpc)', VL.anelli.r[kMax], [4, 6], { entro: 1.3, fonte: 'Via Lattea: picco a 4–6 kpc (Paladini et al. 2004; Anderson et al. 2014)' });
  riscontro('oggetti', 'raggio entro cui sta il 99% delle regioni H II (kpc)', r99, 15, { entro: 1.3, fonte: 'Via Lattea: coda fino a ~15 kpc (Anderson et al. 2014: qualcuna fino a 19)' });
});

prova('sette galassie: gli oggetti seguono il gas e le stelle (nessuna nube senza gas, nessuna regione H II senza nascite)', () => {
  const righe = [];
  for (const g of TUTTE) { const q = V.quantiInTutto(g.forma), sfr = g.forma.storia.sfr[g.forma.storia.sfr.length - 1];
    for (const k in q) assert.ok(q[k] >= 0 && isFinite(q[k]), `${g.nome} ${k}: ${q[k]}`); if (!(sfr > 0)) assert.equal(q.regioniHII, 0); if (!(g.forma.massaGas > 0)) assert.equal(q.nubi, 0);
    const O = V.oggettiIn(g.forma, { centro: [0.6 * g.forma.raggioDisco * 2.2, 0, 0], raggio: 0.5 }, 0, { caso: g.caso, massimo: 50 }); for (const o of O.oggetti) assert.ok(o.raggio > 0 && isFinite(o.raggio) && o.pos.every(isFinite), `${g.nome}: ${o.tipo}`);
    righe.push(`      ${g.nome.padEnd(20)} ${g.forma.classe.padEnd(16)} nascite ${num(sfr).padStart(6)} M☉/a · nubi giganti ${num(q.nubiGiganti).padStart(7)} · H II ${num(q.regioniHII).padStart(8)} · planetarie ${num(q.planetarie).padStart(7)} · resti ${num(q.resti).padStart(7)} (radio ${num(q.restiRadio)})`); }
  console.log(righe.join('\n'));
});

console.log('\nC. TRA I PIANETI, E CIÒ CHE I SISTEMI PERDONO');
const MSOL_KG = MSOLE, GM = K.G * MSOLE;
prova('la cascata: 3,5 con resistenza uguale a ogni taglia (Dohnanyi); le taglie di una fascia sommate ridanno la massa', () => {
  assert.equal(V.esponenteCascata(0), 3.5); tra(V.esponenteCascata(IMPATTI.rottura.roccia.b), 3.0, 3.1, 'dove tiene la gravità'); tra(V.esponenteCascata(IMPATTI.rottura.roccia.a), 3.6, 3.7, 'dove tiene la roccia');
  for (const [M, mat] of [[2.4e21, 'roccia'], [3e23, 'ghiaccio'], [6e25, 'ghiaccio']]) { const tg = V.taglie(M, mat); let m = tg.natiGrandi * tg.massaDi(tg.D0); const N = 4000, a = 1e-9, h = Math.log(tg.D0 / a) / N; for (let i = 0; i < N; i++) { const D1 = a * Math.exp(i * h), D2 = a * Math.exp((i + 1) * h); m += (tg.sopra(D1) - (i === N - 1 ? tg.natiGrandi : tg.sopra(D2))) * tg.massaDi(Math.sqrt(D1 * D2)); }
    tra(m / M, 0.99, 1.01, `massa della distribuzione delle taglie (${mat})`); tra(tg.diametro(tg.sopra(3e3)) / 3e3, 0.999, 1.001, 'diametro(sopra(D)) = D'); tra(tg.diametro(tg.sopra(50)) / 50, 0.999, 1.001, 'anche sotto il passaggio'); }
  // la fascia degli asteroidi VERA messa nella legge di qui (2,4·10²¹ kg tra 2,1 e 3,3 UA, e = 0,15)
  const f = { materiale: 'roccia', a: 2.7 * UA, a1: 2.1 * UA, a2: 3.3 * UA, e: 0.15, oggiKg: 2.4e21 }; f.taglie = V.taglie(f.oggiKg, 'roccia'); const m = V.dentroSistema.macina(f, GM);
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'corpi sopra 100 km', f.taglie.natiGrandi, 220, { fonte: 'Bottke et al. 2005' });
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'corpi sopra 1 km (milioni)', f.taglie.sopra(1e3) / 1e6, [1.1, 1.9], { entro: 3, fonte: 'Tedesco & Desert 2002; Bottke et al. 2005' });
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'distanza media tra corpi sopra 1 km (milioni di km)', Math.cbrt(m.volume / f.taglie.sopra(1e3)) / 1e9, [1, 5], { fonte: 'dai conteggi: qualche milione di km' });
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'tempo tra urti distruttivi per un corpo di 100 km (Ga)', m.tempoUrti / 1e9, [4, 10], { fonte: 'i grandi asteroidi sono quasi tutti primordiali (Bottke et al. 2005)' });
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'polvere prodotta (10³ kg/s)', m.polvereKgS / 1e3, [1, 10], { entro: 10, fonte: 'la nube zodiacale ne chiede 10³–10⁴ kg/s, in gran parte dalle comete (Nesvorný et al. 2010)' });
  riscontro('fascia degli asteroidi vera, nella legge di qui', 'taglia a cui la gravità comincia a tenere (m)', f.taglie.passaggio, [200, 600], { fonte: 'Benz & Asphaug 1999: minimo di Q* a 100–300 m di raggio' });
});

prova('il Sole vero nelle leggi di qui: dove si accende una cometa, la nube esterna, β, Poynting–Robertson, il vento', () => {
  const rho = V.SISTEMA.densitaSole, nettuno = { aM: 30.07 * UA, mu: 1.024e26 / MSOL_KG }, giove = { aM: 5.203 * UA, mu: 1.898e27 / MSOL_KG }, nN = V.dentroSistema.nubeDa(nettuno, MSOL_KG, rho, 4.57e9), nG = V.dentroSistema.nubeDa(giove, MSOL_KG, rho, 4.57e9);
  assert.ok(nG.resta < 0.2 && nN.resta > 5 * nG.resta, 'Giove espelle, Nettuno riempie la nube'); assert.ok(nN.aIn > 100 * nettuno.aM);
  const rA = V.distanzaAttiva(LSOLE), s1 = V.sublimaA(UA, LSOLE), s5 = V.sublimaA(5.2 * UA, LSOLE), s10 = V.sublimaA(9.5 * UA, LSOLE); assert.ok(s1.inVapore > 0.8 && s5.inVapore < 0.5 && s5.inVapore > s10.inVapore && s10.inVapore < 0.01, `a 1 UA quasi tutta la luce va in vapore (${s1.inVapore.toFixed(2)}), da Giove meno di metà (${s5.inVapore.toFixed(2)}), da Saturno niente (${s10.inVapore.toExponential(1)})`);
  const fermo = { pos: [UA, 0, 0], vel: [0, Math.sqrt(GM / UA), 0] }, st = { Lw: LSOLE, M: MSOL_KG, T: 5772 }, ch = V.chiomaECode(2e3, fermo, st), spenta = V.chiomaECode(2e3, { pos: [6 * UA, 0, 0], vel: [0, Math.sqrt(GM / (6 * UA)), 0] }, st);
  assert.ok(ch.attiva && !spenta.attiva); const ioni = ch.codaIoni.direzione; assert.ok(ioni[0] > 0.99, `la coda di ioni punta via dalla stella: ${ioni}`); assert.ok(ioni[1] < 0 && ch.codaIoni.scarto > 2 && ch.codaIoni.scarto < 8, `e resta indietro di ${ch.codaIoni.scarto.toFixed(1)}° (vento a 400 km/s, cometa a 30)`);
  // la coda di polvere: un grano lasciato dieci giorni fa da un corpo su un'orbita tonda sta più in fuori e più indietro
  const el = { a: UA, e: 0, i: 0, nodo: 0, peri: 0, M0: 0, mu: GM }, conEl = V.chiomaECode(2e3, { pos: [UA, 0, 0], vel: [0, Math.sqrt(GM / UA), 0] }, st, el, 0), g1 = conEl.codaPolvere.grani[0], p10 = g1.punti.find((p) => p.giorni === 10);
  assert.ok(Math.hypot(...p10.pos) > UA && p10.pos[1] < 0, `grano di 1 µm dopo 10 giorni: ${p10.pos.map((v) => (v / UA).toFixed(4))}`); assert.ok(g1.beta > conEl.codaPolvere.grani[2].beta && g1.punti[2].dalNucleo > conEl.codaPolvere.grani[2].punti[2].dalNucleo, 'i grani piccoli vanno più lontano');
  tra(V.dentroSistema.granoDopo(fermo, 86400 * 30, GM, 0).map((v, d) => v - [UA * Math.cos((Math.sqrt(GM / UA ** 3) * 86400 * 30)), UA * Math.sin(Math.sqrt(GM / UA ** 3) * 86400 * 30), 0][d]).reduce((s, v) => s + Math.abs(v), 0) / UA, 0, 1e-7, 'senza luce il grano resta sull\'orbita (l\'integratore)');
  const cA = ch.chioma.emette.colore, cI = ch.codaIoni.emette.colore; assert.ok(cA[1] === 255 && cI[2] === 255, `chioma verde ${cA}, coda di ioni azzurro-viola ${cI}`);
  const fintoSole = { stella: { massa: 1, Z: 1, eta: 4.6e9, stato: 'in vita', T: 5772 }, pianeti: [{ Lw: LSOLE }] }, v = V.ventoA(fintoSole, UA);
  riscontro('Sistema Solare vero, nelle leggi di qui', 'dove l\'acqua di una cometa comincia a sublimare (UA)', rA / UA, [2.5, 3], { entro: 1.3, fonte: 'le comete si accendono attorno a 3 UA (Meech & Svoreň 2004)' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'acqua da un nucleo di 2 km a 1 UA (10²⁸ molecole/s)', ch.molecoleS / 1e28, [1, 10], { fonte: 'comete di quella taglia: 10²⁸–10²⁹' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'raggio della chioma d\'acqua a 1 UA (10⁴ km)', ch.chioma.raggio / 1e7, [2, 10], { fonte: 'scala di fotodissociazione: ~8·10⁴ km' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'bordo interno della nube di Oort, da Nettuno (10³ UA)', nN.aIn / UA / 1e3, [2, 20], { fonte: 'Duncan, Quinn & Tremaine 1987; Dones et al. 2004' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'bordo esterno della nube (10⁵ UA)', V.dentroSistema.bordoNube(MSOL_KG, rho) / UA / 1e5, [1, 2], { fonte: 'limite di marea' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'da dove arrivano le comete nuove (10⁴ UA)', V.dentroSistema.conoPieno(MSOL_KG, rho, 3 * UA) / UA / 1e4, [2, 3], { fonte: 'il picco di Oort a 1/a ≈ 4·10⁻⁵ UA⁻¹' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'parte dei corpi scagliati da Giove che resta nella nube', nG.resta, [0.01, 0.05], { fonte: 'Dones et al. 2004' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'β di un grano di 1 µm', V.betaGrano(1e-6, LSOLE, MSOL_KG), [0.15, 0.25], { fonte: 'Burns, Lamy & Soter 1979 (0,57/ρa)' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'Poynting–Robertson, 100 µm da 1 UA (10⁵ anni)', V.tempoPR(UA, V.betaGrano(1e-4, LSOLE, MSOL_KG), MSOL_KG) / ANNO / 1e5, [2, 7], { fonte: 'Wyatt & Whipple 1950: 700·a(µm)·ρ(g/cm³) anni' });
  riscontro('Sistema Solare vero, nelle leggi di qui', 'protoni del vento a 1 UA (per cm³)', v.protoni / 1e6, [5, 7], { entro: 1.3, fonte: 'misure in orbita: 5–7' });
});

const SISTEMI = [];
prova('dodici sistemi attorno a stelle come il Sole: fasce, nube, comete, corpi — conservazione, determinismo, orbite vere', () => {
  for (let k = 0; k < 12; k++) { const caso = sorgente(`prova/sistema ${k}`), Sis = V.sistemaDi({ massa: 1, Z: 1, eta: 4.57e9 }, caso), t = performance.now(), m = V.corpiMinori(Sis, 0, { caso }), ms = performance.now() - t; SISTEMI.push({ caso, Sis, m, ms });
    // ciò che ogni pianeta ha scagliato (impatti.js) è finito nella nube o tra le stelle: niente si crea
    const scagliata = Sis.pianeti.reduce((s, p) => s + (V.dentroSistema.storiaDi(Sis, p, caso)?.bilancio.scagliataKg || 0), 0); if (scagliata > 0) tra((m.espulso.planetesimiKg + m.espulso.nellaNubeKg) / scagliata, 1 - 1e-9, 1 + 1e-9, 'scagliati = nella nube + persi');
    if (m.nube) assert.ok(m.nube.aIn < m.nube.aOut && m.nube.aIn > Sis.pianeti[Sis.pianeti.length - 1].aM, 'la nube sta fuori dai pianeti');
    for (const f of m.fasce) { assert.ok(f.oggiKg > 0 && f.a1 < f.a2 && f.oggiKg <= f.inizioKg * (1 + 1e-9) && f.sopra1km >= 1, `${f.nome}`); for (const r of f.risonanze) assert.ok(r.aM >= f.a1 && r.aM <= f.a2); }
    for (const c of m.corpi) { const f = m.fasce.find((x) => x.nome === c.fascia), r = Math.hypot(...c.pos), el = c.elementi; assert.ok(el.a >= f.a1 && el.a <= f.a2, 'il semiasse sta nella fascia'); tra(r, el.a * (1 - el.e) * (1 - 1e-9), el.a * (1 + el.e) * (1 + 1e-9), 'tra perielio e afelio');
      const v2 = c.vel.reduce((s, v) => s + v * v, 0); tra((v2 / 2 - el.mu / r) / (-el.mu / (2 * el.a)), 1 - 1e-9, 1 + 1e-9, 'energia dell\'orbita (vis viva)'); assert.ok(c.diametroM >= 1e3 && c.diametroM <= IMPATTI.planetesimo); }
    // lo stesso corpo allo stesso indirizzo: i primi dieci di un elenco di quaranta sono i dieci di un elenco di dieci
    for (const f of m.fasce) { const dieci = f.corpi(10), quaranta = f.corpi(40); assert.deepEqual(dieci.map((c) => c.indirizzo + c.diametroM), quaranta.slice(0, dieci.length).map((c) => c.indirizzo + c.diametroM)); for (let j = 1; j < quaranta.length; j++) assert.ok(quaranta[j].diametroM <= quaranta[j - 1].diametroM, 'dal più grande in giù'); }
    // nel tempo: stesso corpo, più avanti sulla stessa orbita (il momento angolare non cambia)
    const dopo = V.corpiMinori(Sis, 0.3 * ANNO, { caso }).corpi; for (let j = 0; j < Math.min(5, dopo.length); j++) { const a = m.corpi[j], b = dopo[j], L = (c) => { const p = c.pos, v = c.vel; return Math.hypot(p[1] * v[2] - p[2] * v[1], p[2] * v[0] - p[0] * v[2], p[0] * v[1] - p[1] * v[0]); }; assert.equal(a.indirizzo, b.indirizzo); tra(L(b) / L(a), 1 - 1e-9, 1 + 1e-9, 'momento angolare'); assert.notDeepEqual(a.pos, b.pos); }
    assert.deepEqual(V.corpiMinori(Sis, 0, { caso }).corpi.map((c) => c.pos), m.corpi.map((c) => c.pos)); }
  costo('corpiMinori, la prima volta (la storia degli impatti di ogni pianeta: impatti.js)', mediana(SISTEMI.map((s) => s.ms)));
  let t = performance.now(); for (const s of SISTEMI) V.corpiMinori(s.Sis, 1e7, { caso: s.caso }); costo('corpiMinori, a un altro tempo (orbite e comete)', (performance.now() - t) / SISTEMI.length);
});

prova('il flusso dei proiettili è quello di impatti.js (la stessa tabella dei crateri), pianeta per pianeta', () => {
  let n = 0;
  for (const s of SISTEMI) for (const p of s.Sis.pianeti) { const st = V.dentroSistema.storiaDi(s.Sis, p, s.caso), f = s.m.flusso.find((x) => x.pianeta === p.id); if (!st) { assert.ok(f.manca); continue; }
    assert.strictEqual(st, V.dentroSistema.storiaDi(s.Sis, p, s.caso), 'una storia sola per pianeta'); const diretto = storiaImpatti(p, s.Sis, s.caso.sotto(`pianeta ${p.id}`)), A = diretto.attesi, nE = A.epoche.length - 1, dt = A.epoche[nE] - A.epoche[nE - 1];
    for (const D of [10, 1e3, 1e4]) { let atteso = 0; for (let k = 0; k < A.diametroM.length; k++) if (A.diametroM[k] >= D) atteso += A.perEpoca[k * nE + nE - 1] / dt; assert.equal(f.perAnno(D), atteso); n++; } }
  assert.ok(n > 100);
  // i pianeti di roccia tra 0,7 e 1,5 UA di questi sistemi: quanti corpi più grandi di 1 km cadono in un milione di anni
  const terre = []; for (const s of SISTEMI) for (const p of s.Sis.pianeti) if (p.tipo === 'roccioso' && p.aUA > 0.7 && p.aUA < 1.5) terre.push({ km: s.m.flusso.find((x) => x.pianeta === p.id).perAnno(1e3) * 1e6, m10: s.m.flusso.find((x) => x.pianeta === p.id).perAnno(10) });
  riscontro('dodici sistemi come il nostro', `urti di corpi > 1 km per milione di anni su un mondo di roccia a ~1 UA (mediana di ${terre.length})`, mediana(terre.map((x) => x.km)), [1, 2], { entro: 3, fonte: 'Terra: uno ogni 0,5–1 Ma (Stuart & Binzel 2004)' });
  riscontro('dodici sistemi come il nostro', '  corpi > 10 m all\'anno', mediana(terre.map((x) => x.m10)), 0.1, { entro: 3, fonte: 'Terra: uno ogni ~10 anni (Brown et al. 2002)' });
});

prova('le comete attive: nascono e passano nel tempo, restano se stesse, hanno chioma e code solo vicino alla stella', () => {
  let viste = 0, attive = 0; const perSistema = [];
  for (const s of SISTEMI) { if (!s.m.comete) { perSistema.push(0); continue; } perSistema.push(s.m.comete.nuoveAllAnno); const prima = new Map();
    for (let anno = 0; anno < 6; anno += 0.25) { const m = V.corpiMinori(s.Sis, anno * ANNO, { caso: s.caso }); for (const c of m.comete.attive) { viste++; const r = Math.hypot(...c.pos), el = c.elementi; assert.ok(r <= m.comete.entro * (1 + 1e-9)); tra(r, el.a * (1 - el.e) * (1 - 1e-6), m.comete.entro * (1 + 1e-9), 'tra il perielio e la sfera in cui si accende');
        const v2 = c.vel.reduce((x, v) => x + v * v, 0); tra((v2 * r) / (2 * el.mu), 0.999, 1.0001, 'quasi parabolica: v² = 2GM/r'); if (c.attiva) { attive++; const d = c.codaIoni.direzione, via = c.pos.map((x) => x / r); assert.ok(d[0] * via[0] + d[1] * via[1] + d[2] * via[2] > 0.9, 'la coda di ioni punta via dalla stella'); assert.ok(c.chioma.raggio > c.diametroM); }
        const gia = prima.get(c.indirizzo); if (gia) { assert.equal(gia.diametroM, c.diametroM); assert.equal(gia.elementi.a, c.elementi.a); } prima.set(c.indirizzo, c); } } }
  assert.ok(viste > 20 && attive > 5, `${viste} avvistamenti, ${attive} con la chioma accesa`);
  riscontro('dodici sistemi come il nostro', 'comete nuove all\'anno (> 1 km) dentro la distanza a cui si accendono (mediana)', mediana(perSistema), [1, 5], { entro: 3, fonte: 'comete di lungo periodo nuove: qualche unità all\'anno (Francis 2005)' });
});

prova('che cosa resta e che cosa esce: le fasce, la nube, la polvere, i pianeti vaganti (statistica, come esce)', () => {
  const M = (kg) => kg / MTERRA, interne = SISTEMI.map((s) => s.m.fasce.filter((f) => f.a < 5 * UA && f.materiale === 'roccia').reduce((x, f) => x + f.oggiKg, 0)), esterne = SISTEMI.map((s) => s.m.fasce.filter((f) => f.materiale === 'ghiaccio').reduce((x, f) => x + f.oggiKg, 0));
  const nubi = SISTEMI.map((s) => s.m.nube?.massaKg || 0), fuori = SISTEMI.map((s) => s.m.espulso.planetesimiKg), vag = SISTEMI.map((s) => s.m.espulso.pianetiVaganti.length), polv = SISTEMI.map((s) => s.m.polvere.ritmoKgS), rho1 = SISTEMI.map((s) => s.m.polvere.densitaA(UA)), dist = SISTEMI.flatMap((s) => s.m.fasce.map((f) => f.distanzaTraCorpi));
  for (const s of SISTEMI) { assert.ok(s.m.polvere.ritmoKgS >= 0 && s.m.polvere.densitaA(UA) >= 0); assert.ok(s.m.rAttiva > 2 * UA && s.m.rAttiva < 4 * UA); tra(s.m.vento(UA).protoni / 1e6, 3, 12, 'protoni del vento a 1 UA'); }
  console.log(`      (fasce di roccia rimaste dentro 5 UA: ${interne.filter((x) => x > 0).length} sistemi su 12; esaurite in media ${(SISTEMI.reduce((x, s) => x + s.m.esaurite.length, 0) / 12).toFixed(1)} per sistema; pianeti scacciati: ${vag.reduce((a, b) => a + b, 0)} in 12 sistemi)`);
  riscontro('dodici sistemi come il nostro', 'fascia di roccia dentro 5 UA, oggi (10⁻⁴ Terre; mediana)', M(mediana(interne)) * 1e4, 4, { entro: 3, fonte: 'fascia degli asteroidi: 4·10⁻⁴ Terre' });
  riscontro('dodici sistemi come il nostro', 'corpi di ghiaccio oltre i pianeti, oggi (Terre; mediana)', M(mediana(esterne)), [0.02, 0.1], { entro: 3, fonte: 'fascia di Kuiper: 0,02–0,1 Terre (prima della migrazione: 20–30)' });
  riscontro('dodici sistemi come il nostro', 'massa messa nella nube esterna (Terre; mediana)', M(mediana(nubi)), [2, 40], { fonte: 'nube di Oort: da 2 (Francis 2005) a 38 (Weissman 1996) Terre' });
  riscontro('dodici sistemi come il nostro', 'planetesimi persi tra le stelle (Terre; mediana)', M(mediana(fuori)), [10, 40], { entro: 3, fonte: 'modelli del Sistema Solare: gran parte del disco esterno, decine di Terre' });
  riscontro('dodici sistemi come il nostro', 'polvere prodotta oggi (10³ kg/s; mediana)', mediana(polv) / 1e3, [1, 10], { entro: 10, fonte: 'nube zodiacale (Nesvorný et al. 2010)' });
  riscontro('dodici sistemi come il nostro', 'polvere a 1 UA (10⁻¹⁹ kg/m³; mediana)', mediana(rho1) / 1e-19, 1, { entro: 10, fonte: 'Grün et al. 1985: 9,6·10⁻²⁰ kg/m³' });
  riscontro('dodici sistemi come il nostro', 'distanza tra corpi > 1 km nelle fasce che restano (10⁶ km; mediana)', mediana(dist) / 1e9, [1, 5], { entro: 3, fonte: 'fascia degli asteroidi: qualche milione di km' });
});

let VAG = null;
prova('tra le stelle: oggetti interstellari e pianeti vaganti da 24 sistemi dell\'anello del Sole; le stelle di passaggio', () => {
  const t = performance.now(); VAG = V.vaganti(VL, SOLE, { campione: 24, caso: CASO }); costo('vaganti: 24 sistemi attorno a stelle estratte dalla distribuzione delle masse (una volta per anello)', performance.now() - t);
  assert.strictEqual(V.vaganti(VL, SOLE, { campione: 24, caso: CASO }), VAG, 'tenuto in memoria'); assert.ok(VAG.oggetti.perM3 >= VAG.oggetti.perM3Minimo && VAG.perStella.planetesimiKg >= 0 && VAG.stellePerM3 > 0);
  const inc = V.incontri(VL, SOLE), inc2 = V.incontri(VL, SOLE, PC / 2); tra(inc2.perMilioneDiAnni / inc.perMilioneDiAnni, 0.25, 0.26, 'gli incontri vanno come b² (più il fuoco)'); assert.ok(inc.fuoco > 1 && inc.fuoco < 1.001);
  console.log(`      (per stella, in media su ${VAG.campione} — ${VAG.conPianeti} con pianeti —: ${num(VAG.perStella.planetesimiKg / MTERRA)} Terre di planetesimi persi, ${num(VAG.perStella.nellaNubeKg / MTERRA)} nella nube, ${num(VAG.perStella.pianetiVaganti)} pianeti scacciati)`);
  riscontro('tra le stelle', 'stelle per pc³ a metà del disco', VAG.stellePerPc3, [0.1, 0.14], { fonte: 'vicino al Sole, con nane brune e nane bianche (RECONS)' });
  riscontro('tra le stelle', 'oggetti interstellari > 100 m per UA³ (macinati dalla cascata)', VAG.oggetti.perUA3, [0.1, 0.2], { entro: 10, fonte: '[V] da 1I/\'Oumuamua: 0,2 per UA³ (Do, Tucker & Tonry 2018, arXiv:1801.02821)' });
  riscontro('tra le stelle', '  se usciti com\'erano nati (tutti da 100 km): il minimo', VAG.oggetti.perUA3Minimo, [0.1, 0.2], { entro: 10, fonte: 'idem' });
  riscontro('tra le stelle', 'pianeti scacciati per stella', VAG.pianetiVaganti.perStella, [0.25, 20], { entro: 3, fonte: 'microlenti: ≤ 0,25 come Giove (Mróz et al. 2017), forse molti come la Terra (Sumi et al. 2023)' });
  riscontro('tra le stelle', 'stelle che passano entro 1 pc in un milione di anni', inc.perMilioneDiAnni, 19.7, { fonte: '[V] Gaia DR2: 19,7 ± 2,2 (Bailer-Jones et al. 2018, arXiv:1805.07581)' });
  riscontro('tra le stelle', 'velocità media tra due stelle (km/s)', inc.velocita / 1e3, [40, 55], { fonte: 'dispersioni vicino al Sole (Dehnen & Binney 1998)' });
});

console.log('\nD. QUANTO È VUOTO IL VUOTO, E LE SCENE');
prova('il più vicino: la formula 0,554·n^(−1/3) contro punti sparsi a caso; in uno strato sottile conta la superficie', () => {
  const c = sorgente('prova/vicino'), N = 4000, pts = Array.from({ length: N }, (_, i) => [c(`x${i}`), c(`y${i}`), c(`z${i}`)]); let s = 0, n = 0;
  for (let i = 0; i < 400; i++) { const p = [0.2 + 0.6 * c(`px${i}`), 0.2 + 0.6 * c(`py${i}`), 0.2 + 0.6 * c(`pz${i}`)]; let d = Infinity; for (const q of pts) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])); s += d; n++; }
  tra(s / n / V.distanzaDelPiuVicino(N).distanza, 0.95, 1.05, 'distanza media dal più vicino / formula'); assert.equal(V.distanzaDelPiuVicino(N, 1e-3).come, 'nel piano del disco'); tra(V.distanzaDelPiuVicino(N, 1e-3).distanza, 0.5 / Math.sqrt(N * 2e-3) * 0.999, 0.5 / Math.sqrt(N * 2e-3) * 1.001, 'in due dimensioni');
});

prova('quantoVuoto e piuVicino a ogni scala: tra le galassie, nel disco, tra i pianeti', () => {
  const co = V.quantoVuoto({ cosmo: true }), ga = V.quantoVuoto({ forma: VL, r: SOLE, z: 0, fase: 0.25 }), s = SISTEMI[0], si = V.quantoVuoto({ sistema: s.Sis, rM: UA, caso: s.caso });
  assert.ok(co.atomi < 1 && ga.atomi > 1e4 * co.atomi && si.ioni > ga.ioni, 'dal cosmo al sistema il vuoto si riempie'); tra(co.fotoni.fondo / ga.fotoni.fondo, 1 - 1e-12, 1 + 1e-12, 'il fondo è lo stesso ovunque'); assert.ok(si.fotoni.stelle > 1e6 * ga.fotoni.stelle, 'vicino a una stella la sua luce domina');
  tra(ga.fasi.reduce((x, f) => x + f.volume, 0), 1 - 1e-9, 1 + 1e-9, 'i volumi delle fasi');
  let t = performance.now(); const pv = V.piuVicino({ forma: VL, r: SOLE, caso: CASO }, null, { vaganti: VAG }); costo('piuVicino, tutti i tipi, in un punto di una galassia', performance.now() - t); const d = Object.fromEntries(pv.map((x) => [x.tipo, x]));
  assert.ok(d.atomo.distanza < d.grano.distanza && d.grano.distanza < d['oggetto interstellare'].distanza && d['oggetto interstellare'].distanza < d.stella.distanza && d.stella.distanza < d['nube molecolare gigante'].distanza, 'atomo < grano < sasso < stella < nube gigante');
  assert.ok(d['nebulosa planetaria'].distanza > d.stella.distanza * 20, 'le planetarie sono rare');
  const pc = V.piuVicino({ cosmo: true }), ps = V.piuVicino({ sistema: s.Sis, rM: (s.m.fasce[0]?.a ?? 20 * UA), caso: s.caso }); assert.ok(pc.find((x) => x.tipo === 'galassia').distanza > 1e22 && ps.find((x) => x.tipo === 'protone').distanza < 1);
  const ML = (x) => x / KPC / 1e3; console.log(`      (il più vicino, vicino al Sole della galassia di prova: ${pv.map((x) => `${x.tipo} ${x.distanza > 0.05 * PC ? num(x.distanza / PC) + ' pc' : x.distanza > 1e9 ? num(x.distanza / UA) + ' UA' : num(x.distanza) + ' m'}`).join(' · ')})`);
  const piu = ga.piuProbabile, caldo = ga.fasi.find((f) => f.nome === 'caldo');
  riscontro('quanto è vuoto', 'atomi per cm³ dove ci si trova più spesso vicino al Sole (la fase più estesa)', piu.atomi / 1e6, [0.1, 1], { entro: 1.5, fonte: 'mezzo attorno al Sole: 0,1–1 (nube locale 0,2–0,3)' });
  riscontro('quanto è vuoto', '  dentro una bolla di gas caldo', caldo.atomi / 1e6, [0.003, 0.01], { fonte: 'Bolla Locale: 0,005' });
  riscontro('quanto è vuoto', 'protoni per cm³ a 1 UA dalla stella (il vento)', si.ioni / 1e6, 5, { fonte: 'vento solare: ~5 (3–10)' });
  riscontro('quanto è vuoto', 'barioni per m³ tra le galassie, in media', co.atomi, 0.25, { entro: 1.3, fonte: 'Ω_b·ρ_c/m_p' });
  riscontro('quanto è vuoto', 'fotoni del fondo per cm³', ga.fotoni.fondo / 1e6, 411, { entro: 1.01, fonte: 'corpo nero a 2,7255 K' });
  riscontro('quanto è vuoto', 'grani di polvere per m³ nel disco', ga.grani, [1e-4, 1e-3], { entro: 3, fonte: 'uno ogni qualche migliaio di m³' });
  riscontro('quanto è vuoto', 'la stella più vicina (pc)', d.stella.distanza / PC, 1.3, { fonte: 'α Centauri: 1,30 pc' });
  riscontro('quanto è vuoto', 'la nube molecolare gigante più vicina (pc)', d['nube molecolare gigante'].distanza / PC, [140, 400], { fonte: 'Toro 140 pc, Orione 400 pc' });
  riscontro('quanto è vuoto', 'la nebulosa planetaria più vicina (pc)', d['nebulosa planetaria'].distanza / PC, [200, 400], { fonte: 'Elica: 200 pc; Manubrio: 400 pc' });
  riscontro('quanto è vuoto', 'il resto di supernova più vicino (pc)', d['resto di supernova'].distanza / PC, [130, 300], { fonte: 'Vela 290 pc; anello del Cigno 730 pc; gusci vecchi più vicini' });
  riscontro('quanto è vuoto', 'la galassia più vicina con un alone > 10¹¹ M☉ (Mpc)', ML(pc.find((x) => x.tipo === 'galassia').distanza), [0.8, 3], { fonte: 'Andromeda 0,78; M81 3,6' });
});

prova('scenaVuoto: i dati per il motore — metri, watt, righe con la loro lunghezza d\'onda, colori veri; nessun disegno', () => {
  let t = performance.now(); const reg = { centro: [SOLE, 0, 0], raggio: 0.5 }, g = V.scenaVuoto({ forma: VL, caso: CASO, catalogo: CAT, regione: reg, massimo: 200 }); costo(`scenaVuoto, galassia, sfera di 500 pc (${g.volumi.length} volumi)`, performance.now() - t);
  assert.equal(g.livello, 'galassia'); assert.equal(g.riferimento.unita, 'm'); tra(g.riferimento.regione.raggio / (0.5 * KPC), 1 - 1e-12, 1 + 1e-12, 'regione in metri'); assert.ok(g.volumi.length > 50);
  const diretti = V.oggettiIn(VL, reg, 0, { caso: CASO, catalogo: CAT, massimo: 200 }).oggetti; assert.equal(g.volumi.length, diretti.length);
  for (let i = 0; i < g.volumi.length; i++) { const v = g.volumi[i], o = diretti[i]; assert.equal(v.id, o.indirizzo); tra(v.pos[0] / (o.pos[0] * KPC), 1 - 1e-12, 1 + 1e-12, 'posizione in metri'); assert.ok(v.raggio > 0 && v.brillanza >= 0 && Array.isArray(v.righe)); assert.ok(v.colore === null || (v.colore.length === 3 && v.colore.every((x) => x >= 0 && x <= 255))); for (const r of v.righe) assert.ok(r.nm > 380 && r.nm < 780 && r.W >= 0); }
  assert.ok(g.volumi.some((v) => v.estinzione > 1) && g.volumi.some((v) => v.righe.length === 3)); const p = g.polvere.in(SOLE * KPC, 0, 0), c = V.contenuto(VL, { r: SOLE, z: 0, fi: 0 }); assert.equal(p.densita, c.polvere.densita); assert.equal(g.mezzo(SOLE * KPC, 0, 0).gas.nH, c.gas.nH); assert.equal(g.polvere.colonne.length, ANELLI);
  const s = SISTEMI.find((x) => x.m.fasce.length && x.m.comete); t = performance.now(); let sc = null, conComete = null; for (let anno = 0; anno < 8 && !conComete; anno += 0.25) { sc = V.scenaVuoto({ sistema: s.Sis, caso: s.caso }, anno * ANNO); if (sc.comete.some((x) => x.attiva)) conComete = sc; } costo('scenaVuoto, sistema', (performance.now() - t));
  assert.equal(sc.livello, 'sistema'); assert.ok(sc.corpi.length > 0 && sc.fasce.length > 0); for (const b of sc.corpi) { assert.ok(b.pos.every(isFinite) && b.vel.every(isFinite) && b.raggio > 0 && b.orbita.assi.length === 3 && b.orbita.periodo > 0 && b.colore.length === 3); }
  for (const f of sc.fasce) assert.ok(f.interno < f.esterno && f.veri >= f.mostrati && f.massaKg > 0); assert.ok(sc.vento(UA).protoni > 0 && sc.polvere.in(UA) >= 0);
  if (conComete) { const k = conComete.comete.find((x) => x.attiva); assert.ok(k.chioma.raggio > 0 && k.codaIoni.lunghezza > 0 && k.codaPolvere.linee.length === 3 && k.codaPolvere.linee[0].punti.length === 4 && k.chioma.colore.length === 3); } else console.log('      (in otto anni nessuna cometa accesa in quel sistema: le code non sono state controllate qui)');
  assert.deepEqual(JSON.stringify(V.scenaVuoto({ sistema: s.Sis, caso: s.caso }, 0).corpi), JSON.stringify(V.scenaVuoto({ sistema: s.Sis, caso: s.caso }, 0).corpi));
});

prova('galassie estreme (una nana, un ammasso, una appena fusa): niente si rompe, il gas torna, nessun conteggio negativo', () => {
  for (const a of [{ massa: 1e10, spin: 0.035 }, { massa: 1e14, spin: 0.035 }, { massa: 3e12, spin: 0.04, fusioni: [{ quando: 12, rapporto: 1 }] }]) { const c = sorgente('prova/estrema'), f = formaDaAlone({ fusioni: [], ...a }, c), q = V.quantiInTutto(f), m = V.massaDelGas(f);
    for (const k in q) assert.ok(q[k] >= 0 && isFinite(q[k]), `alone ${a.massa}: ${k} = ${q[k]}`); if (f.massaGas > 0) tra(m.totale / f.massaGas, 0.995, 1.005, `alone ${a.massa}: gas`);
    // (una sfera di 15 kpc attorno al centro: guardare TUTTO il disco di un ammasso costa secondi — 1,3 milioni di celle — ed è misurato tra i costi)
    const reg = { centro: [0, 0, 0], raggio: Math.min(15, f.anelli.bordo[ANELLI]) }, o = V.oggettiIn(f, reg, 0, { caso: c, massimo: 30 }); for (const x of o.oggetti) assert.ok(x.raggio > 0 && isFinite(x.raggio) && x.pos.every(isFinite)); const sc = V.scenaVuoto({ forma: f, caso: c, regione: reg, massimo: 30 }); assert.equal(sc.volumi.length, o.oggetti.length);
    if (a.massa === 1e14) { const t = performance.now(), tutto = V.oggettiIn(f, { centro: [0, 0, 0], raggio: 1e3 }, 0, { caso: c, massimo: 30 }); costo(`oggettiIn, TUTTO il disco di una galassia gigante (alone 10¹⁴ M☉, ${f.anelli.bordo[ANELLI].toFixed(0)} kpc: ${tutto.celle} celle)`, performance.now() - t); }
    const fuori = V.contenuto(f, { r: 3 * f.anelli.bordo[ANELLI], z: 5 }); assert.equal(fuori.gas.nH, 0); assert.ok(fuori.alone.nH >= 0 && fuori.fondo.fotoni > 0, 'fuori dal disco restano l\'alone caldo e il fondo'); }
});

prova('con il mondo vero di cosmo.js (cosmo 1): una galassia con il suo catalogo, sistemi con la loro storia degli impatti', () => {
  let t = performance.now(); const C1 = cosmo(1), gid = Math.max(0, C1.galassie.findIndex((g) => g.forma.classe.startsWith('spirale'))), Gx = galassia(1, gid), casoG = sorgente(`cosmo ${cosmoBase(1)}/galassia ${gid}`, ramiCosmo(1)); costo('cosmo(1) e galassia(1, id) di cosmo.js (non è di questo modulo: per confronto)', performance.now() - t);
  const R = Gx.forma.anelli.bordo[ANELLI], sc = V.scenaVuoto({ forma: Gx.forma, caso: casoG, catalogo: Gx, regione: { centro: [0, 0, 0], raggio: 2 * R }, massimo: 100 }), suoi = Gx.sorgenti.filter((x) => x.tipo === 'supernova'), miei = sc.volumi.filter((v) => v.id.includes('/supernova ') && !v.id.includes('/vuoto/'));
  assert.equal(miei.length, suoi.length, 'i resti delle ultime supernove del catalogo ci sono tutti'); for (const x of suoi) assert.ok(miei.some((v) => Math.abs(v.raggio / x.raggioM - 1) < 1e-9 && Math.abs(v.pos[0] - x.pos[0] * Gx.forma.unitaM) < 1e-6 * Gx.forma.unitaM), `resto di ${x.eta.toFixed(0)} anni`);
  let fatti = 0; for (let sid = 0; sid < Gx.stelle.length && fatti < 4; sid += 211) { const S = Gx.stelle[sid]; if (S.stato === 'stella di neutroni' || S.stato === 'buco nero') continue; const Sis = sistema(1, gid, sid); if (!Sis.pianeti.length) continue; fatti++;
    const cs = sorgente(`cosmo ${cosmoBase(1)}/galassia ${gid}/stella ${sid}`, ramiCosmo(1)), m = V.corpiMinori(Sis, 0, { caso: cs });
    for (const p of Sis.pianeti) { assert.strictEqual(V.dentroSistema.storiaDi(Sis, p, cs), p.impatti, 'la storia degli impatti è quella di cosmo.js (p.impatti), non un\'altra'); const A = p.impatti.attesi, nE = A.epoche.length - 1; let n = 0; for (let k = 0; k < A.diametroM.length; k++) if (A.diametroM[k] >= 1e3) n += A.perEpoca[k * nE + nE - 1] / (A.epoche[nE] - A.epoche[nE - 1]); assert.equal(m.flusso.find((x) => x.pianeta === p.id).perAnno(1e3), n); }
    const scS = V.scenaVuoto({ sistema: Sis, caso: cs }, 1e8); for (const b of scS.corpi) assert.ok(b.pos.every(isFinite) && b.id.startsWith(`cosmo ${cosmoBase(1)}/galassia ${gid}/stella ${sid}/vuoto/`)); assert.ok(m.rAttiva >= 0 && m.vento(UA).protoni >= 0); }
  assert.ok(fatti >= 2, `sistemi provati: ${fatti}`);
});

// ---------- i costi (misurati qui, a memorie già calde dove è scritto)
{ const N = 20000, c = sorgente('prova/costi'); let t = performance.now(); for (let i = 0; i < N; i++) V.contenuto(VL, { r: 1 + 15 * c(`r${i % 500}`), z: 0.05, fase: (i % 97) / 97 - 0.5 }); costo('contenuto(), un punto', (performance.now() - t) / N);
  t = performance.now(); const f2 = formaDaAlone({ massa: 1e12, spin: 0.045, fusioni: [] }, sorgente('prova/costi/galassia')); V.contenuto(f2, { r: 8, fase: 0 }); costo('contenuto(), il primo punto di una galassia nuova (la curva termica di un anello)', performance.now() - t);
  t = performance.now(); V.quantiInTutto(f2); costo('censimento di una galassia nuova (14 anelli: curve termiche, gas molecolare, stelle; una volta)', performance.now() - t);
  t = performance.now(); const piccola = V.oggettiIn(VL, { centro: [SOLE, 0, 0], raggio: 0.05 }, 0, { caso: CASO }); costo(`oggettiIn, sfera di 50 pc, a censimento fatto (${piccola.oggetti.length} oggetti, ${piccola.celle} celle)`, performance.now() - t);
  t = performance.now(); const tutto = V.oggettiIn(VL, { centro: [0, 0, 0], raggio: 100 }, 0, { caso: CASO, catalogo: CAT }); costo(`oggettiIn, tutta la galassia con la nebbia (${tutto.oggetti.length} oggetti di ${num(Object.values(tutto.nebbia).reduce((s, x) => s + x.veri, 0))}; ${tutto.celle} celle)`, performance.now() - t); }

// ---------- I RISCONTRI, in chiaro
console.log('\n  RISCONTRI con la Via Lattea e il Sistema Solare veri (niente è tarato: escono come escono)');
console.log(`  ${'grandezza'.padEnd(92)} ${'modello'.padStart(10)}   ${'vero'.padEnd(16)} entro`);
let gruppo = null, tornano = 0; for (const r of tabella) { if (r.gruppo !== gruppo) { gruppo = r.gruppo; console.log(`  — ${gruppo}`); } if (r.torna) tornano++; console.log(`  ${(r.torna ? '✓ ' : '≠ ') + r.nome.padEnd(90)} ${num(r.modello).padStart(10)}   ${String(r.vero).padEnd(16)} ×${String(r.entro).padEnd(4)} ${r.torna ? 'torna' : 'NON TORNA'}   [${r.fonte}]`); }
console.log(`\n  ${tornano} riscontri su ${tabella.length} tornano; ${tabella.length - tornano} NON TORNANO (elencati sopra con «≠»; le cause note sono nell'intestazione di src/camera/vuoto.js).`);
console.log('\n  COSTI'); for (const [che, ms] of costi) console.log(`    ${che.padEnd(110)} ${ms < 0.1 ? (ms * 1e3).toFixed(1) + ' µs' : ms.toFixed(ms < 10 ? 2 : 0) + ' ms'}`);
console.log(`\nvuoto: ${ok} prove passate`);
