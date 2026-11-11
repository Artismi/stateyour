// materia.js — LE PARTICELLE DENTRO LA MATERIA: il raccordo tra il cristallo (o la molecola) e la particella.
//
// La finestra non è una cosa a parte dal mondo: è un punto di osservazione qualsiasi, a qualsiasi scala. Qui la si
// mette DENTRO la materia di un luogo vero (un punto di roccia, di mare, di ghiaccio, d'aria di un pianeta) e si chiede
// che cosa vi disegnano le particelle. Niente è messo lì: ogni traccia ha una causa che sta in quel luogo.
//   1. IL MEZZO. Dalla composizione vera (i minerali di quel punto con le loro formule, o l'acqua, o i gas di quell'aria)
//      escono Z/A, il potenziale medio di ionizzazione (regola di Bragg), la lunghezza di radiazione, l'indice di
//      rifrazione; e da questi la frenata di ogni particella carica (Bethe-Bloch con l'effetto densità; in basso la
//      frenata proporzionale alla velocità di Lindhard-Scharff e quella nucleare; per gli elettroni la formula di
//      Rohrlich-Carlson e l'irraggiamento), il percorso (l'integrale di 1/frenata), le deviazioni multiple (Highland), i
//      raggi delta, la luce Cherenkov (soglia β = 1/n, angolo cos θ = 1/(nβ), fotoni: Frank-Tamm).
//   2. LE SORGENTI DI QUEL PUNTO. La radioattività dei nuclei che ci sono davvero (K-40, le catene di U-238, U-235 e
//      Th-232, Rb-87, C-14, la fissione spontanea dell'U-238): quanti ce ne sono lo dicono la composizione di quel
//      pianeta e di quel minerale e l'età (legge del decadimento: la stessa che in leggi.js scalda l'interno). E i raggi
//      cosmici arrivati fin lì: dallo spettro sopra il pianeta, tagliato dal suo campo (Størmer), attraverso la colonna
//      d'aria (i nucleoni si attenuano; i pioni decadono in muoni che perdono energia e decadono in volo: Gaisser) e poi
//      attraverso l'acqua o la roccia che sta sopra (solo i muoni scendono). I neutrini passano e basta.
//   3. IL TEMPO. In un cubetto di materia gli eventi sono rari e brevissimi. Due modi veri di guardare:
//      «memoria»: certi minerali registrano le tracce per milioni di anni (tracce di fissione, di rinculo α, ALONI
//      PLEOCROICI: un anello dove si fermano le α di ogni passo della catena); si accumula per l'età vera della roccia,
//      e ciò che la roccia ha subìto sopra la temperatura di ricottura è cancellato. «istante»: un evento vero mentre
//      accade, alla sua data (quanto si aspetta in quel volume lo dice il ritmo vero).
//   4. IL CRISTALLO VISTO DALLE PARTICELLE. La cella elementare vera dei minerali principali, gli atomi con la loro
//      agitazione termica (Debye-Waller), e l'INCANALAMENTO: una carica che entra quasi parallela a un asse è guidata
//      tra le file di atomi (potenziale continuo di Lindhard): dietro un cristallo sottile esce una stella con la
//      simmetria del reticolo. La simmetria la decide il minerale, non chi guarda.
// La `cella` che ne esce è una regione qualsiasi per mondo.js (stessi campi di cosmo.js `regione`).
//
// DATI / LEGGI MISURATE (usati così, dichiarati; i numeri sono nelle tabelle qui sotto):
//   · numeri atomici, masse, potenziali medi di ionizzazione degli elementi e la regola per i composti (ICRU 37, 1984;
//     ICRU 49, 1993): nei composti condensati H 19,2 · C 81 · N 82 · O 106 · F 112 · Cl 180 eV, gli altri 1,13 volte il
//     valore dell'elemento. Così l'acqua dà 75,3 eV (misurato: 75,0) e il quarzo 141 (139); l'aria 86,1 (85,7);
//   · K = 4π·N_A·r_e²·m_e·c² = 0,307075 MeV·cm²/mol; l'effetto densità con la parametrizzazione generale di Sternheimer e
//     Peierls (1971), che chiede solo I e la frequenza di plasma; la carica efficace degli ioni lenti (Barkas 1963:
//     z·[1 − exp(−125·β·z^(−2/3))]); la frenata nucleare universale di Ziegler, Biersack e Littmark (1985);
//   · la lunghezza di radiazione degli elementi: X0 = 716,4·A / [Z(Z+1)·ln(287/√Z)] g/cm² (Tsai 1974; PDG);
//   · la deviazione multipla: θ0 = (13,6 MeV / βcp)·z·√(x/X0)·[1 + 0,038·ln(x·z²/(X0·β²))] (Highland 1975; Lynch e Dahl 1991);
//   · l'irraggiamento dei muoni: b = 4,0·10⁻⁶ cm²/g nella «roccia standard» (Z = 11, A = 22; Groom, Mokhov e Striganov
//     2001), scalato con Z²/A; la lunghezza d'urto nucleare: 35·A^(1/3) g/cm² (aria: 90);
//   · densità, indice di rifrazione, temperatura di Debye, formule dei minerali (Deer, Howie e Zussman 2013; CRC Handbook);
//   · i nuclidi: tempi di dimezzamento, energie Q, energie medie di β e γ (ENSDF/NuDat 3, ICRP 107), abbondanze
//     isotopiche (IUPAC 2016); la fissione spontanea dell'U-238: 8,45·10⁻¹⁷ all'anno (Holden e Hoffman 2000); l'energia
//     dei frammenti: 0,1189·Z²/A^(1/3) + 7,3 MeV (Viola, Kwiatkowski e Walker 1985); frammento leggero A = 96 ± 6;
//   · uranio, torio, potassio, rubidio nelle condriti CI: 8,0 ppb · 29 ppb · 550 ppm · 2,3 ppm (Lodders 2003; Palme e
//     O'Neill 2014): gli stessi da cui vengono i numeri di leggi.js (ISOTOPI); il potassio è volatile e ne resta un
//     quarto (come in chimica.js), uranio e torio no: perciò nella roccia di un pianeta seguono il potassio con il
//     rapporto K/U ≈ 17 000 (Terra: 12–14 000). Quanto li concentrano i minerali accessori rispetto al fuso (Bea 1996;
//     Mahood e Hildreth 1983): zircone U ×100, Th ×25 · apatite ×6, ×4 · monazite ×1000, ×5000; e quanti accessori ha un
//     granito (zircone 0,03%, apatite 0,3%, monazite 0,01% in massa) e un basalto (apatite 0,2%);
//   · le temperature di ricottura (sopra, in tempi geologici, il cristallo si ripara e la traccia sparisce): tracce di
//     fissione nell'apatite 110 °C, nello zircone 240 °C, nella mica 300 °C (Gleadow e Duddy 1981; Hurford 1986;
//     Bernet 2009); tracce di rinculo α nella mica 50 °C (Gögen e Wagner 2000); aloni nella biotite 250 °C;
//   · la dose che colora la biotite: ~3·10¹³ α/cm² (irraggiamenti con ioni elio: Gentry 1974);
//   · i raggi cosmici primari presso il Sole: 1,8·10⁴·E^(−2,7) nucleoni/(m²·s·sr·GeV) (PDG), con la modulazione del
//     vento solare (campo di forza, potenziale 0,55 GV; il Sole stesso non c'è: è un dato); i muoni: per ogni nucleone
//     primario, 0,14/1,8 muoni alla stessa energia (dalla formula di Gaisser 1990, che al livello del mare è
//     0,14·E^(−2,7)·[1/(1 + 1,1·E·cosθ/115 GeV) + 0,054/(1 + 1,1·E·cosθ/850 GeV)] per cm²·s·sr·GeV); lunghezza di
//     attenuazione dei nucleoni 120 g/cm²; neutroni al suolo sulla Terra 0,013 per cm²·s (Gordon e altri 2004);
//     elettroni: 0,3 dei muoni al livello del mare (PDG); produzione di C-14 sulla Terra: 2 atomi per cm²·s;
//   · il radon dal suolo: frazione che esce dai grani 0,2, diffusione nel suolo 2·10⁻⁶ m²/s, rimescolamento verticale
//     dell'aria 5 m²/s (UNSCEAR 2000): ne esce il flusso (Terra: 0,02 Bq/m²/s) e la concentrazione (~10 Bq/m³);
//   · le celle elementari e le posizioni degli atomi (vedi RETICOLI: quarzo Levien 1980; salgemma; ghiaccio Ih Röttger
//     1994; calcite Markgraf e Reeder 1985; forsterite Smyth e Hazen 1973; diopside Cameron 1973; sanidino Phillips e
//     Ribbe 1973; flogopite Hazen e Burnham 1973): controllate qui con le distanze di legame;
//   · il potenziale continuo di una fila di atomi: U(r) = (Z1·Z2·e²/d)·ln(1 + 3a²/r²), a il raggio di schermo di
//     Thomas-Fermi (Lindhard 1965); l'angolo critico ψ1 = √(2·Z1·Z2·e²/(E·d)).
// PARAMETRI LIBERI (non misurati; scelti perché il disegno si legga):
//   · quante tracce al massimo si disegnano (se quelle vere sono di più se ne dà un campione, e accanto il numero vero);
//   · la taglia del granello che fa da nucleo a un alone: un evento di quel punto, tra 1 e 6 µm (osservati: 1–10);
//   · di quanto si comprime il tempo di un'esposizione lunga milioni di anni (ogni evento conserva la sua data vera).
// SEMPLIFICAZIONI:
//   · il motore è un piano: si seguono gli eventi le cui tracce stanno nel piano della finestra (una sezione sottile,
//     verticale: il basso è il basso); percorsi ed energie sono quelli veri;
//   · catene in equilibrio secolare nella roccia chiusa (ogni passo ha l'attività del capostipite); nell'acqua restano
//     solo i nuclidi solubili (uranio, potassio, rubidio, carbonio), nell'aria il radon e i suoi figli;
//   · di ogni decadimento α si segue la riga principale; lo spettro β è quello di Fermi (forma permessa, e la forma
//     «unica» per il K-40); i γ si seguono solo se la finestra è larga abbastanza perché urtino;
//   · sotto ~10 keV per nucleone la frenata elettronica è quella di Lindhard-Scharff (±30%); niente correzioni di
//     guscio (la frenata dei protoni tra 0,3 e 3 MeV viene alta del 3%); l'irraggiamento degli elettroni è la formula
//     di Heitler senza schermo fino a saturazione (±20%);
//   · lo sciame nell'aria è il suo scheletro: l'urto del primario, i pioni, i muoni, le coppie e i fotoni di frenamento
//     (modello di Heitler), in un'aria a strati; il campo del pianeta è perpendicolare alla finestra;
//   · per il plagioclasio la cella dell'albite con le coordinate del sanidino (stessa impalcatura); per la biotite quelle
//     della flogopite; l'idrogeno del ghiaccio è disordinato (mezzo atomo per posto).

import { ANNO, ISOTOPI, COSTANTI } from './leggi.js';
import { sorgente } from './eventi.js';
import { casoEvento } from './mondo.js';
import { unita, catalogoVero, fmtLunghezza, ME_MEV, C_LUCE, C_MOTORE } from './unita.js';

const K_BETHE = 0.307075, N_A = 6.02214e23, ALFA_FINE = 1 / 137.036, U_MEV = 931.494, MEV_J = 1.602177e-13, E2 = 1.43996e-13; // e²/(4πε0) in MeV·cm
const limita = (x, a, b) => Math.max(a, Math.min(b, x));

// =====================================================================================
// 1. GLI ELEMENTI E I MATERIALI
// =====================================================================================
// simbolo: [Z, massa atomica (u), I dell'elemento (eV), I nei composti condensati se diverso dalla regola 1,13·I, nome]
const TAVOLA = {
  H: [1, 1.008, 19.2, 19.2, 'idrogeno'], He: [2, 4.0026, 41.8, 41.8, 'elio'], C: [6, 12.011, 78, 81, 'carbonio'], N: [7, 14.007, 82, 82, 'azoto'], O: [8, 15.999, 95, 106, 'ossigeno'],
  F: [9, 18.998, 115, 112, 'fluoro'], Na: [11, 22.99, 149, 0, 'sodio'], Mg: [12, 24.305, 156, 0, 'magnesio'], Al: [13, 26.982, 166, 0, 'alluminio'], Si: [14, 28.086, 173, 0, 'silicio'],
  P: [15, 30.974, 173, 0, 'fosforo'], S: [16, 32.06, 180, 0, 'zolfo'], Cl: [17, 35.45, 174, 180, 'cloro'], Ar: [18, 39.948, 188, 188, 'argo'], K: [19, 39.098, 190, 0, 'potassio'],
  Ca: [20, 40.078, 191, 0, 'calcio'], Ti: [22, 47.867, 233, 0, 'titanio'], Fe: [26, 55.845, 286, 0, 'ferro'], Rb: [37, 85.468, 363, 0, 'rubidio'], Zr: [40, 91.224, 393, 0, 'zirconio'],
  Ce: [58, 140.12, 523, 0, 'cerio'], Pb: [82, 207.2, 823, 0, 'piombo'], Th: [90, 232.04, 847, 0, 'torio'], U: [92, 238.03, 890, 0, 'uranio'],
};
export const ELEMENTI = Object.fromEntries(Object.entries(TAVOLA).map(([s, [Z, A, I, Ic, nome]]) => [s, { simbolo: s, nome, Z, A, I, Icomposto: Ic || 1.13 * I }]));
// una formula («K(Mg1.5Fe1.5)AlSi3O10(OH)2») → atomi per unità di formula
export function atomiDi(formula) {
  const leggi = (s, i) => {
    const out = {}; const metti = (o, k = 1) => { for (const e in o) out[e] = (out[e] || 0) + o[e] * k; };
    while (i < s.length && s[i] !== ')') {
      let parte;
      if (s[i] === '(') { const r = leggi(s, i + 1); parte = r.out; i = r.i + 1; }
      else { const m = /^[A-Z][a-z]?/.exec(s.slice(i)); if (!m || !ELEMENTI[m[0]]) throw new Error(`formula non letta: ${s}`); parte = { [m[0]]: 1 }; i += m[0].length; }
      const n = /^[0-9.]+/.exec(s.slice(i)); if (n) i += n[0].length;
      metti(parte, n ? +n[0] : 1);
    }
    return { out, i };
  };
  return leggi(formula.replace(/[·\s]/g, ''), 0).out;
}
const inMassa = (atomi) => { let m = 0; for (const e in atomi) m += atomi[e] * ELEMENTI[e].A; const o = {}; for (const e in atomi) o[e] = (atomi[e] * ELEMENTI[e].A) / m; return o; };

// I MATERIALI: formula (per la composizione), densità (g/cm³), indice di rifrazione (0: opaco), temperatura di Debye (K),
// e per chi tiene memoria la temperatura di ricottura delle tracce (K). Dati misurati.
export const MATERIALI = {
  quarzo: { formula: 'SiO2', densita: 2.65, n: 1.544, debye: 470 },
  'feldspato potassico': { formula: 'KAlSi3O8', densita: 2.56, n: 1.523, debye: 420 },
  plagioclasio: { formula: 'Na0.6Ca0.4Al1.4Si2.6O8', densita: 2.67, n: 1.545, debye: 450 },
  olivina: { formula: 'Mg1.8Fe0.2SiO4', densita: 3.32, n: 1.67, debye: 760 },
  pirosseno: { formula: 'Ca0.5Mg1.2Fe0.3Si2O6', densita: 3.3, n: 1.68, debye: 660 },
  biotite: { formula: 'K(Mg1.5Fe1.5)AlSi3O10(OH)2', densita: 3.05, n: 1.62, debye: 400, ricottura: { fissione: 573, rinculo: 323, alone: 523 } },
  calcite: { formula: 'CaCO3', densita: 2.71, n: 1.658, debye: 470 },
  salgemma: { formula: 'NaCl', densita: 2.165, n: 1.544, debye: 321 },
  gesso: { formula: 'CaSO4(H2O)2', densita: 2.31, n: 1.52, debye: 300 },
  'ghiaccio d\'acqua': { formula: 'H2O', densita: 0.917, n: 1.309, debye: 222 },
  magnetite: { formula: 'Fe3O4', densita: 5.17, n: 0, debye: 500 }, ematite: { formula: 'Fe2O3', densita: 5.26, n: 0, debye: 500 },
  'ferro metallico': { formula: 'Fe', densita: 7.87, n: 0, debye: 470 }, periclasio: { formula: 'MgO', densita: 3.58, n: 1.736, debye: 940 },
  zircone: { formula: 'ZrSiO4', densita: 4.65, n: 1.94, debye: 600, ricottura: { fissione: 513 }, concentra: { U: 100, Th: 25 } },
  apatite: { formula: 'Ca5(PO4)3F', densita: 3.19, n: 1.634, debye: 390, ricottura: { fissione: 383 }, concentra: { U: 6, Th: 4 } },
  monazite: { formula: 'CePO4', densita: 5.15, n: 1.79, debye: 450, concentra: { U: 1000, Th: 5000 } },
  acqua: { formula: 'H2O', densita: 1.0, n: 1.333, debye: 0 },
};
MATERIALI.ghiaccio = MATERIALI['ghiaccio d\'acqua'];
// i minerali accessori (dati): quanta parte in massa di una roccia dei continenti e di un basalto
export const ACCESSORI = { continente: { zircone: 3e-4, apatite: 3e-3, monazite: 1e-4 }, basalto: { apatite: 2e-3 } };
const SIGMA_CATTURA = { H: 0.332, C: 0.0035, N: 1.91, O: 0.00019, Ar: 0.675, He: 0, S: 0.53, Cl: 33.5 }; // (barn) cattura dei neutroni lenti; per l'azoto è la reazione che fa il carbonio-14
const MASSA_GAS = (f) => { const a = atomiDi(f); let m = 0; for (const e in a) m += a[e] * ELEMENTI[e].A; return m; };

// ---------- il mezzo di un luogo, per le particelle
// luogo = { tipo: 'roccia' | 'acqua' | 'ghiaccio' | 'aria', minerali: [{ nome, frazione (in massa) }] (roccia), densita (kg/m³),
//           T (K), aria: { gas: { N2: 0.78, … } (in moli), pressione (Pa), T }, … } — vedi luogoDaRoccia e luogoDaAcqua.
// → { nome, tipo, densita (g/cm³), composizione { elemento: frazione in massa }, ZsuA, I (eV), plasma (eV), X0 (g/cm²), X0m (m),
//     n (indice di rifrazione, 0 se opaco), lambdaNucleare (g/cm²), z2suA (per l'irraggiamento dei muoni), cherenkov(particella) }
const mezziFatti = new Map();
export function mezzo(luogo) {
  if (luogo && luogo.ZsuA && luogo.composizione && luogo.cherenkov) return luogo; // è già un mezzo
  if (typeof luogo === 'string') luogo = MATERIALI[luogo] ? (luogo === 'acqua' ? { tipo: 'acqua' } : { tipo: 'roccia', minerali: [{ nome: luogo, frazione: 1 }] }) : { tipo: luogo };
  const tipo = luogo.tipo || (luogo.minerali ? 'roccia' : 'acqua'), gas = tipo === 'aria';
  const chiave = JSON.stringify([tipo, luogo.minerali?.map((m) => [m.nome, +(+m.frazione).toPrecision(4)]), luogo.densita, gas ? luogo.aria : null, luogo.composizione, luogo.n]);
  if (mezziFatti.has(chiave)) return mezziFatti.get(chiave);
  let comp = {}, rho, n = 0, nome = tipo, debye = 0;
  const somma = (o, k) => { for (const e in o) comp[e] = (comp[e] || 0) + o[e] * k; };
  if (luogo.composizione) { comp = { ...luogo.composizione }; rho = (luogo.densita ?? 1000) / 1000; n = luogo.n ?? 0; }
  else if (gas) {
    const a = luogo.aria || {}, g = a.gas && Object.keys(a.gas).length ? a.gas : { N2: 0.781, O2: 0.209, Ar: 0.0093 }; let mu = 0, tot = 0;
    for (const f in g) { let m; try { m = MASSA_GAS(f); } catch { continue; } mu += g[f] * m; tot += g[f]; }
    for (const f in g) { let at; try { at = inMassa(atomiDi(f)); } catch { continue; } somma(at, (g[f] * MASSA_GAS(f)) / mu); }
    mu /= tot || 1;
    // la densità: dalla legge dei gas perfetti, alla pressione e alla temperatura del punto; l'indice di rifrazione
    // cresce con la densità (Gladstone e Dale: n − 1 = 2,93·10⁻⁴ per l'aria a 1,293 kg/m³)
    rho = luogo.densita != null ? luogo.densita / 1000 : ((a.pressione ?? 101325) * mu * 1e-3) / (8.314 * (a.T ?? luogo.T ?? 288)) / 1000;
    n = 1 + 2.93e-4 * (rho / 1.293e-3); nome = 'aria';
  } else if (tipo === 'acqua' || tipo === 'ghiaccio') {
    const M = tipo === 'acqua' ? MATERIALI.acqua : MATERIALI.ghiaccio; comp = inMassa(atomiDi(M.formula)); rho = luogo.densita != null ? luogo.densita / 1000 : M.densita; n = M.n; nome = tipo; debye = M.debye;
    // i sali sciolti (se chi chiama li dà: mol/kg come stato.totali di mare.js) spostano appena la composizione
    if (luogo.totali) { let sale = 0; const s = {}; for (const e in luogo.totali) if (ELEMENTI[e] && luogo.totali[e] > 0) { s[e] = luogo.totali[e] * ELEMENTI[e].A * 1e-3; sale += s[e]; } if (sale < 0.5) { for (const e in comp) comp[e] *= 1 - sale; for (const e in s) comp[e] = (comp[e] || 0) + s[e]; } }
  } else {
    const lista = (luogo.minerali || []).filter((m) => MATERIALI[m.nome] && m.frazione > 0), tot = lista.reduce((a, m) => a + m.frazione, 0) || 1; let vol = 0, nn = 0, opaco = 0;
    if (!lista.length) throw new Error('mezzo: una roccia chiede i suoi minerali (nome e frazione in massa)');
    for (const m of lista) { const M = MATERIALI[m.nome], f = m.frazione / tot; somma(inMassa(atomiDi(M.formula)), f); vol += f / M.densita; nn += (f / M.densita) * M.n; if (!M.n) opaco += f / M.densita; debye += f * M.debye; }
    rho = luogo.densita != null ? luogo.densita / 1000 : 1 / vol; n = opaco / vol > 0.5 ? 0 : nn / (vol - opaco); nome = lista.length === 1 ? lista[0].nome : 'roccia';
  }
  // Z/A, il potenziale medio di ionizzazione (regola di Bragg: la media dei logaritmi pesata con gli elettroni), la
  // lunghezza di radiazione (gli inversi si sommano in massa), la lunghezza d'urto nucleare
  let ZsuA = 0, lnI = 0, invX0 = 0, z2 = 0, invL = 0, atomi = 0;
  for (const e in comp) { const el = ELEMENTI[e], w = comp[e]; ZsuA += (w * el.Z) / el.A; lnI += ((w * el.Z) / el.A) * Math.log(gas ? (e === 'O' ? 97 : e === 'C' ? 70 : el.I) : el.Icomposto);
    invX0 += w / ((716.4 * el.A) / (el.Z * (el.Z + 1) * Math.log(287 / Math.sqrt(el.Z)))); z2 += (w * el.Z * el.Z) / el.A; invL += w / (35 * Math.cbrt(el.A)); atomi += w / el.A; }
  const I = Math.exp(lnI / ZsuA), X0 = 1 / invX0, plasma = 28.816 * Math.sqrt(rho * ZsuA);
  // l'effetto densità (Sternheimer e Peierls 1971): δ(βγ) da I e dalla frequenza di plasma soltanto
  const Cs = 2 * Math.log(I / plasma) + 1; let x0, x1;
  if (gas) { x1 = Cs < 12.25 ? 4 : 5; x0 = Cs < 10 ? 1.6 : Cs < 10.5 ? 1.7 : Cs < 11 ? 1.8 : Cs < 11.5 ? 1.9 : Cs < 13.804 ? 2 : 0.326 * Cs - 2.5; }
  else if (I < 100) { x1 = 2; x0 = Cs < 3.681 ? 0.2 : 0.326 * Cs - 1; } else { x1 = 3; x0 = Cs < 5.215 ? 0.2 : 0.326 * Cs - 1.5; }
  const aS = (Cs - 4.606 * x0) / (x1 - x0) ** 3;
  const delta = (bg) => { const x = Math.log10(bg); return x < x0 ? 0 : x < x1 ? 4.606 * x - Cs + aS * (x1 - x) ** 3 : 4.606 * x - Cs; };
  const out = { nome, tipo, densita: rho, composizione: comp, ZsuA, I, plasma, X0, X0m: X0 / rho / 100, n, lambdaNucleare: 1 / invL, z2suA: z2, atomiPerGrammo: atomi * N_A, debye, delta, T: luogo.T ?? 288,
    // la luce Cherenkov di una particella: soglia (energia cinetica, MeV), e a un'energia data angolo (gradi) e fotoni visibili al metro
    cherenkov(part, E = null) {
      const p = particella(part); if (!(out.n > 1) || !p.q) return null;
      const bs = 1 / out.n, soglia = p.mMeV * (1 / Math.sqrt(1 - bs * bs) - 1); if (E == null) return { soglia, angoloMassimo: (Math.acos(bs) * 180) / Math.PI };
      const g = 1 + E / p.mMeV, b = Math.sqrt(1 - 1 / (g * g)); if (b <= bs) return { soglia, angolo: 0, fotoniAlMetro: 0 };
      const cos = 1 / (out.n * b), sin2 = 1 - cos * cos; // Frank e Tamm, tra 400 e 700 nm: 2π·α·z²·sin²θ·(1/λ1 − 1/λ2)
      return { soglia, angolo: (Math.acos(cos) * 180) / Math.PI, fotoniAlMetro: 2 * Math.PI * ALFA_FINE * p.q * p.q * sin2 * (1 / 400e-9 - 1 / 700e-9) };
    } };
  mezziFatti.set(chiave, out); if (mezziFatti.size > 40) mezziFatti.delete(mezziFatti.keys().next().value);
  return out;
}

// =====================================================================================
// 2. LA FRENATA E IL PERCORSO
// =====================================================================================
// le particelle: carica (in e), massa (MeV), e per gli ioni il numero atomico e di massa (per la carica efficace e la frenata nucleare)
export const PARTICELLE = {
  elettrone: { q: -1, mMeV: ME_MEV }, positrone: { q: 1, mMeV: ME_MEV }, 'muone-': { q: -1, mMeV: 105.658 }, 'muone+': { q: 1, mMeV: 105.658 },
  'pione+': { q: 1, mMeV: 139.570 }, 'pione-': { q: -1, mMeV: 139.570 }, protone: { q: 1, mMeV: 938.272, Z: 1, A: 1 }, alfa: { q: 2, mMeV: 3727.379, Z: 2, A: 4 },
};
PARTICELLE.muone = PARTICELLE['muone-']; PARTICELLE['α'] = PARTICELLE.alfa; PARTICELLE['β'] = PARTICELLE.elettrone;
// uno ione qualsiasi: { Z, A } (un nucleo di rinculo, un frammento di fissione); nudo, la carica è Z
export function particella(p) {
  if (typeof p === 'string') { const q = PARTICELLE[p]; if (!q) throw new Error(`particella sconosciuta: ${p}`); return { nome: p, ...q }; }
  if (p.mMeV && p.q != null) return p;
  if (p.Z && p.A) return { nome: p.nome || `ione ${p.Z}/${p.A}`, q: p.Z, Z: p.Z, A: p.A, mMeV: p.A * U_MEV };
  throw new Error('particella: serve un nome, o { q, mMeV }, o { Z, A }');
}
// la frenata (MeV·cm²/g) di una particella di energia cinetica E (MeV) in un mezzo: { elettronica, nucleare, radiativa, totale }
// «taglio» (MeV): solo le perdite in urti che cedono meno di così a un elettrone (la frenata ristretta: il resto sono raggi delta)
function frenata(p, E, m, taglio = Infinity) {
  const g = 1 + E / p.mMeV, b2 = 1 - 1 / (g * g), bg2 = g * g - 1, me = ME_MEV, IMeV = m.I * 1e-6, d = m.delta(Math.sqrt(bg2));
  let el, nuc = 0, rad = 0;
  if (p.mMeV < 1) { // elettroni e positroni (Rohrlich e Carlson 1954; ICRU 37)
    const t = E / me, F = p.q < 0 ? 1 - b2 + (t * t / 8 - (2 * t + 1) * Math.LN2) / ((t + 1) * (t + 1)) : 2 * Math.LN2 - (b2 / 12) * (23 + 14 / (t + 2) + 10 / (t + 2) ** 2 + 4 / (t + 2) ** 3);
    el = ((K_BETHE / 2) * m.ZsuA / b2) * Math.max(0.3, Math.log(1 + (t * t * (t + 2)) / (2 * (IMeV / me) ** 2)) + F - d);
    // l'irraggiamento (Heitler): cresce come ln(2E/mc²) − 1/3 finché lo schermo degli elettroni atomici lo satura
    const Zm = m.z2suA / m.ZsuA; rad = ((E + me) / m.X0) * limita((Math.log(2 * (t + 1)) - 1 / 3) / Math.log(183 / Math.cbrt(Zm)), 0, 1);
  } else {
    const r = me / p.mMeV, Wmax = (2 * me * bg2) / (1 + 2 * g * r + r * r), W = Math.min(Wmax, taglio), b = Math.sqrt(b2);
    // la carica efficace: uno ione lento si riveste di elettroni. Il protone conta per uno (la sua parte bassa è Lindhard-Scharff);
    // l'elio segue la curva misurata di Ziegler (1977), in ln(keV per nucleone); i più pesanti la legge di Barkas
    let zeff = Math.abs(p.q);
    if (p.Z === 2) { const B = Math.log(Math.max(1, (E * 1000) / p.A)); zeff = 2 * Math.sqrt(1 - Math.exp(-Math.min(30, 0.7446 + 0.1429 * B + 0.01562 * B * B - 0.00267 * B ** 3 + 1.325e-6 * B ** 8))); }
    else if (p.Z > 2) zeff = p.Z * (1 - Math.exp(-125 * b * Math.pow(p.Z, -2 / 3)));
    // Bethe: ½·ln(2mc²β²γ²·W/I²) − β² − δ/2 (nel logaritmo «1 + x + x²» al posto di x², perché resti positiva in basso, dove comanda Lindhard-Scharff)
    const xx = (2 * me * bg2 * W) / (IMeV * IMeV);
    const alta = ((K_BETHE * m.ZsuA) / b2) * Math.max(0, 0.5 * Math.log(1 + Math.sqrt(xx) + xx) - (b2 / 2) * (1 + W / Wmax) - d / 2);
    if (p.Z) {
      // in basso: la frenata proporzionale alla velocità (Lindhard e Scharff 1961, per un protone), elemento per elemento; le
      // due si raccordano come inversi dei quadrati. Uno ione va come un protone alla stessa velocità, per il quadrato
      // della sua carica efficace. E la frenata dei nuclei (Ziegler, Biersack e Littmark): conta quando lo ione è lento
      let bassa = 0; const EkeV = E * 1000, M1 = p.A;
      for (const e in m.composizione) { const t = ELEMENTI[e], perGrammo = (m.composizione[e] / t.A) * N_A;
        bassa += perGrammo * 1.915e-14 * (t.Z / Math.pow(1 + Math.pow(t.Z, 2 / 3), 1.5)) * (b / ALFA_FINE) * 1e-6;
        const zz = Math.pow(p.Z, 0.23) + Math.pow(t.Z, 0.23), eps = (32.53 * t.A * EkeV) / (p.Z * t.Z * (M1 + t.A) * zz), sn = eps > 30 ? Math.log(eps) / (2 * eps) : Math.log(1 + 1.1383 * eps) / (2 * (eps + 0.01321 * Math.pow(eps, 0.21226) + 0.19593 * Math.sqrt(eps)));
        nuc += perGrammo * ((8.462e-15 * p.Z * t.Z * M1 * sn) / ((M1 + t.A) * zz)) * 1e-6; }
      el = (zeff * zeff) / Math.sqrt(1 / (alta * alta + 1e-300) + 1 / (bassa * bassa));
    } else el = zeff * zeff * alta;
    // i muoni (e i pioni) veloci irraggiano: b·E, con b ∝ Z²/A (conta sopra le centinaia di GeV)
    if (p.mMeV < 200) rad = 4.0e-6 * (m.z2suA / 5.5) * (E + p.mMeV) * limita(0.25 + 0.25 * Math.log10(Math.max(E, 1e-9) / 1000), 0, 1); // (b cresce piano con l'energia: 3·10⁻⁶ a 100 GeV, 4·10⁻⁶ oltre 1 TeV)
  }
  return { elettronica: el, nucleare: nuc, radiativa: rad, totale: el + nuc + rad };
}
// → la frenata in MeV·cm²/g e in MeV al metro, e ciò che la accompagna a quell'energia
export function perdita(part, E, luogo, { taglio = Infinity } = {}) {
  const p = particella(part), m = mezzo(luogo), f = frenata(p, E, m, taglio), k = m.densita * 100, g = 1 + E / p.mMeV, b = Math.sqrt(1 - 1 / (g * g));
  return { ...f, alMetro: f.totale * k, elettronicaAlMetro: f.elettronica * k, beta: b, gamma: g, cherenkov: m.cherenkov(p, E), deviazione: (x) => deviazione(p, E, m, x) };
}
// la deviazione multipla (Highland): l'angolo tipico (radianti, in un piano) dopo x metri
export function deviazione(part, E, luogo, xM) {
  const p = particella(part), m = mezzo(luogo), g = 1 + E / p.mMeV, b2 = 1 - 1 / (g * g), bcp = p.mMeV * g * b2, t = xM / m.X0m; if (!(t > 0)) return 0;
  return (13.6 / bcp) * Math.abs(p.q) * Math.sqrt(t) * Math.max(0.2, 1 + 0.038 * Math.log((t * p.q * p.q) / b2));
}
// i raggi delta: quanti elettroni con più di «sopra» MeV una particella strappa al metro (Rutherford: dN/dT ∝ 1/T²), e l'energia massima
export function raggiDelta(part, E, luogo, sopra = 0.01) {
  const p = particella(part), m = mezzo(luogo), g = 1 + E / p.mMeV, b2 = 1 - 1 / (g * g), r = ME_MEV / p.mMeV, Wmax = p.mMeV < 1 ? E / 2 : (2 * ME_MEV * (g * g - 1)) / (1 + 2 * g * r + r * r);
  return { massima: Wmax, alMetro: Wmax > sopra ? (K_BETHE / 2) * p.q * p.q * (m.ZsuA / b2) * (1 / sopra - 1 / Wmax) * m.densita * 100 : 0 };
}
// LA TABELLA di una particella in un mezzo: su una griglia di energie (logaritmica) la frenata e il percorso (CSDA:
// l'integrale di dE/frenata dal basso) e il tempo per fermarsi. Si calcola una volta sola.
const tabelle = new WeakMap(), PASSO_LN = 0.05;
function tabella(p, m, taglio = Infinity) {
  let per = tabelle.get(m); if (!per) { per = new Map(); tabelle.set(m, per); }
  const k = `${p.nome || ''}|${p.q}|${p.mMeV}|${p.Z || 0}|${taglio}`; if (per.has(k)) return per.get(k);
  // dal basso (1 keV per gli elettroni, 10 eV per nucleone per gli ioni: sotto, la particella è ferma) a 10⁷ volte la massa
  const E0 = p.mMeV < 1 ? 1e-3 : 1e-8 * p.mMeV, n = Math.ceil(Math.log((1e7 * Math.max(1, p.mMeV)) / E0) / PASSO_LN) + 1, lnE0 = Math.log(E0);
  const S = new Float64Array(n), R = new Float64Array(n), T = new Float64Array(n);
  const v = (E) => { const g = 1 + E / p.mMeV; return C_LUCE * Math.sqrt(1 - 1 / (g * g)); };
  for (let i = 0; i < n; i++) S[i] = frenata(p, Math.exp(lnE0 + i * PASSO_LN), m, taglio).totale;
  // sotto E0 la frenata va come la velocità: il resto del percorso è 2·E0/S(E0) (in g/cm²)
  R[0] = (2 * E0) / S[0]; T[0] = (2 * R[0]) / (m.densita * 100) / v(E0);
  for (let i = 1; i < n; i++) { const a = Math.exp(lnE0 + (i - 1) * PASSO_LN), b = Math.exp(lnE0 + i * PASSO_LN), dR = 0.5 * PASSO_LN * (a / S[i - 1] + b / S[i]); R[i] = R[i - 1] + dR; T[i] = T[i - 1] + dR / (m.densita * 100) / (0.5 * (v(a) + v(b))); }
  const t = { p, m, E0, lnE0, n, S, R, T }; per.set(k, t); return t;
}
const interpola = (t, A, E) => { const x = (Math.log(Math.max(E, t.E0)) - t.lnE0) / PASSO_LN, i = Math.min(t.n - 2, Math.floor(x)), f = x - i; return A[i] + (A[i + 1] - A[i]) * f; };
// il percorso di una particella di energia E (MeV) in un mezzo → { m (metri, lungo la traccia), gcm2, secondi (per fermarsi),
//   dritto (metri in linea d'aria: per gli elettroni la traccia è tortuosa), deviazione (rad, sull'intero percorso) }
export function percorso(part, E, luogo) {
  const p = particella(part), m = mezzo(luogo), t = tabella(p, m), g = interpola(t, t.R, E), metri = g / m.densita / 100;
  // quanto è storta: l'angolo accumulato (Highland) lungo il percorso; oltre un radiante la traccia è un gomitolo, e in
  // linea d'aria fa strada come un cammino a caso (dato: per gli elettroni in acqua circa la metà del percorso)
  const th = deviazione(p, E / 2, m, metri);
  return { m: metri, gcm2: g, secondi: interpola(t, t.T, E), deviazione: th, dritto: metri / Math.sqrt(1 + th * th) };
}
// l'energia (MeV) che resta a una particella dopo x metri di mezzo (0 se si è fermata prima)
export function energiaDopo(part, E, luogo, xM) {
  const p = particella(part), m = mezzo(luogo), t = tabella(p, m), resta = interpola(t, t.R, E) - xM * m.densita * 100; if (resta <= t.R[0]) return 0;
  let lo = 0, hi = t.n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (t.R[mid] < resta) lo = mid; else hi = mid; }
  return Math.exp(t.lnE0 + (lo + (resta - t.R[lo]) / (t.R[hi] - t.R[lo])) * PASSO_LN);
}
