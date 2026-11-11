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
//     z·[1 − exp(−125·β·z^(−2/3))]; per l'elio il rapporto misurato tra le frenate di α e protoni, NIST/ICRU 49); la
//     frenata nucleare universale di Ziegler, Biersack e Littmark (1985). Controllo: frenate e percorsi di protoni e α
//     in acqua, aria e quarzo entro il 2–3% dalle tabelle NIST PSTAR/ASTAR sopra 1 MeV per nucleone;
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
//   · sotto ~100 keV per nucleone la frenata elettronica è il raccordo tra Bethe e Lindhard-Scharff (±20%, e conta poco
//     sui percorsi); la correzione di guscio è una forma empirica tarata sui protoni; l'irraggiamento degli elettroni è
//     la formula di Heitler senza schermo fino a saturazione (±20%);
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
// la carica efficace dell'elio, misurata: (frenata di una α) / (4 × frenata di un protone alla stessa velocità), in funzione
// dei keV per nucleone (qui il logaritmo): NIST ASTAR e PSTAR (ICRU 49), acqua e aria, che coincidono entro l'1%
const ELIO = [[2.5, 0.4], [10, 0.416], [25, 0.458], [50, 0.515], [80, 0.585], [125, 0.697], [175, 0.807], [250, 0.911], [350, 0.964], [500, 0.986], [1000, 0.993], [2000, 0.995]].map(([e, g]) => [Math.log(e), g]);
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
    // l'elio segue la curva misurata (ELIO); i più pesanti la legge di Barkas
    let zeff = Math.abs(p.q);
    if (p.Z === 2) { const x = Math.log(Math.max(2.5, Math.min(2000, (E * 1000) / p.A))); let i = 0; while (i < ELIO.length - 2 && ELIO[i + 1][0] < x) i++; zeff = 2 * Math.sqrt(ELIO[i][1] + ((ELIO[i + 1][1] - ELIO[i][1]) * (x - ELIO[i][0])) / (ELIO[i + 1][0] - ELIO[i][0])); }
    else if (p.Z > 2) zeff = p.Z * (1 - Math.exp(-125 * b * Math.pow(p.Z, -2 / 3)));
    // Bethe: ½·ln(2mc²β²γ²·W/I²) − β² − δ/2 (nel logaritmo «1 + x + x²» al posto di x², perché resti positiva in basso, dove comanda Lindhard-Scharff)
    // La CORREZIONE DI GUSCIO (gli elettroni interni, più veloci della particella, frenano meno): forma empirica
    // 19·x/(x + 40)², x = 2mc²β²γ²/I, tarata sui protoni in acqua e in quarzo (NIST PSTAR, ICRU 49): toglie il 3% tra 0,5 e 3 MeV
    const xx = (2 * me * bg2 * W) / (IMeV * IMeV), xg = (2 * me * bg2) / IMeV;
    const alta = ((K_BETHE * m.ZsuA) / b2) * Math.max(0, 0.5 * Math.log(1 + Math.sqrt(xx) + xx) - (b2 / 2) * (1 + W / Wmax) - d / 2 - (19 * xg) / ((xg + 40) * (xg + 40)));
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

// =====================================================================================
// 3. LE SORGENTI VERE DI UN LUOGO: la radioattività naturale
// =====================================================================================
// I NUCLIDI (dati: ENSDF/NuDat 3; energie in MeV, tempi di dimezzamento in anni). Un passo α: [nome, Z, A, 'α', Q, mezza
// vita, ramo, Eα della riga principale se non va al livello fondamentale]; l'energia della α è Q·(A − 4)/A: il resto lo
// prende il nucleo che rincula. Un passo β: [nome, Z, A, 'β', Q, mezza vita, ramo, energia media degli elettroni, dei γ]:
// il resto di Q lo porta via il neutrino.
const G = 1 / 365.25, MIN = G / 1440, S_ = MIN / 60;
export const CATENE = {
  'uranio-238': { elemento: 'U', abbondanza: 0.992742, mezza: 4.468e9, fissione: 8.45e-17, passi: [
    ['uranio-238', 92, 238, 'α', 4.270, 4.468e9], ['torio-234', 90, 234, 'β', 0.273, 24.1 * G, 1, 0.06, 0.009], ['protoattinio-234', 91, 234, 'β', 2.269, 1.159 * MIN, 1, 0.822, 0.012],
    ['uranio-234', 92, 234, 'α', 4.858, 2.455e5], ['torio-230', 90, 230, 'α', 4.770, 7.54e4], ['radio-226', 88, 226, 'α', 4.871, 1600], ['radon-222', 86, 222, 'α', 5.590, 3.8235 * G],
    ['polonio-218', 84, 218, 'α', 6.115, 3.098 * MIN], ['piombo-214', 82, 214, 'β', 1.019, 27.06 * MIN, 1, 0.293, 0.25], ['bismuto-214', 83, 214, 'β', 3.270, 19.9 * MIN, 1, 0.659, 1.508],
    ['polonio-214', 84, 214, 'α', 7.833, 164.3e-6 * S_], ['piombo-210', 82, 210, 'β', 0.0635, 22.2, 1, 0.038, 0.005], ['bismuto-210', 83, 210, 'β', 1.162, 5.012 * G, 1, 0.389, 0], ['polonio-210', 84, 210, 'α', 5.407, 138.376 * G]] },
  'uranio-235': { elemento: 'U', abbondanza: 0.007204, mezza: 7.04e8, passi: [
    ['uranio-235', 92, 235, 'α', 4.678, 7.04e8, 1, 4.398], ['torio-231', 90, 231, 'β', 0.391, 25.52 / 24 * G, 1, 0.165, 0.026], ['protoattinio-231', 91, 231, 'α', 5.150, 3.276e4, 1, 5.01],
    ['attinio-227', 89, 227, 'β', 0.0448, 21.772, 1, 0.016, 0], ['torio-227', 90, 227, 'α', 6.146, 18.68 * G, 1, 5.9], ['radio-223', 88, 223, 'α', 5.979, 11.43 * G, 1, 5.716],
    ['radon-219', 86, 219, 'α', 6.946, 3.96 * S_], ['polonio-215', 84, 215, 'α', 7.526, 1.781e-3 * S_], ['piombo-211', 82, 211, 'β', 1.367, 36.1 * MIN, 1, 0.456, 0.064],
    ['bismuto-211', 83, 211, 'α', 6.751, 2.14 * MIN], ['tallio-207', 81, 207, 'β', 1.418, 4.77 * MIN, 1, 0.495, 0.002]] },
  'torio-232': { elemento: 'Th', abbondanza: 1, mezza: 1.405e10, passi: [
    ['torio-232', 90, 232, 'α', 4.082, 1.405e10], ['radio-228', 88, 228, 'β', 0.0459, 5.75, 1, 0.017, 0], ['attinio-228', 89, 228, 'β', 2.124, 6.15 / 24 * G, 1, 0.475, 0.971],
    ['torio-228', 90, 228, 'α', 5.520, 1.9116], ['radio-224', 88, 224, 'α', 5.789, 3.6319 * G], ['radon-220', 86, 220, 'α', 6.405, 55.6 * S_], ['polonio-216', 84, 216, 'α', 6.906, 0.145 * S_],
    ['piombo-212', 82, 212, 'β', 0.570, 10.64 / 24 * G, 1, 0.176, 0.148], ['bismuto-212', 83, 212, 'β', 2.252, 60.55 * MIN, 0.6406, 0.72, 0.16], ['polonio-212', 84, 212, 'α', 8.954, 0.299e-6 * S_, 0.6406],
    ['bismuto-212', 83, 212, 'α', 6.207, 60.55 * MIN, 0.3594], ['tallio-208', 81, 208, 'β', 4.999, 3.053 * MIN, 0.3594, 0.598, 3.375]] },
};
// i nuclidi soli. K-40: 89,28% β⁻ verso il calcio-40 (spettro di forma «unica», terza proibita), 10,72% cattura di un
// elettrone verso l'argo-40, che emette un γ da 1,4608 MeV. Il C-14 c'è solo nel carbonio che scambia con l'aria.
export const SOLI = {
  'potassio-40': { elemento: 'K', Z: 19, A: 40, abbondanza: 1.17e-4, mezza: 1.248e9, rami: [{ tipo: 'β', ramo: 0.8928, Q: 1.3111, media: 0.5606, proibita: 3, figlia: 'calcio-40' }, { tipo: 'cattura', ramo: 0.1072, Q: 1.5044, gamma: 1.4608, figlia: 'argo-40' }] },
  'rubidio-87': { elemento: 'Rb', Z: 37, A: 87, abbondanza: 0.2783, mezza: 4.97e10, rami: [{ tipo: 'β', ramo: 1, Q: 0.2823, media: 0.082, figlia: 'stronzio-87' }] },
  'carbonio-14': { elemento: 'C', Z: 6, A: 14, abbondanza: 0, mezza: 5730, rami: [{ tipo: 'β', ramo: 1, Q: 0.15648, media: 0.0495, figlia: 'azoto-14' }] },
};
// le condriti (frazioni in massa, oggi: 4,5 miliardi di anni dopo la nascita del Sole) e quanto dei volatili è rimasto (chimica.js)
export const CONDRITI = { U: 8.0e-9, Th: 29e-9, K: 550e-6, Rb: 2.3e-6 }, VOLATILI_RIMASTI = 0.25, ETA_RIFERIMENTO = 4.5e9;
const NOMI_EL = { 81: 'tallio', 82: 'piombo', 83: 'bismuto', 84: 'polonio', 86: 'radon', 88: 'radio', 89: 'attinio', 90: 'torio', 91: 'protoattinio', 92: 'uranio' };
const lambdaDi = (mezzaAnni) => Math.LN2 / (mezzaAnni * ANNO); // (1/s)

// LO SPETTRO β (teoria di Fermi): N(p) ∝ F(Z, E)·p²·(Q − T)²·forma, con F la funzione di Fermi (qui nella forma non
// relativistica 2πη/(1 − e^(−2πη)), η = ±Z·α·E/p) e, per le transizioni «uniche», il fattore di forma (terza proibita:
// p⁶ + 7p⁴q² + 7p²q⁴ + q⁶). → { media (MeV), campiona(u): l'energia cinetica al quantile u }
const spettri = new Map();
export function spettroBeta(Q, Zfiglia, proibita = 0, segno = 1) {
  const k = `${Q}|${Zfiglia}|${proibita}|${segno}`; if (spettri.has(k)) return spettri.get(k);
  const n = 400, me = ME_MEV, w = new Float64Array(n + 1), cum = new Float64Array(n + 1); let tot = 0, media = 0;
  for (let i = 1; i < n; i++) { const T = (Q * i) / n, E = T + me, p = Math.sqrt(T * (T + 2 * me)), q = Q - T, eta = (segno * Zfiglia * ALFA_FINE * E) / p, F = (2 * Math.PI * eta) / (1 - Math.exp(-2 * Math.PI * eta));
    const p2 = p * p, q2 = q * q, forma = proibita === 3 ? p2 ** 3 + 7 * p2 * p2 * q2 + 7 * p2 * q2 * q2 + q2 ** 3 : proibita === 1 ? p2 + q2 : 1; w[i] = F * p * E * q2 * forma; }
  for (let i = 1; i <= n; i++) { const a = 0.5 * (w[i - 1] + w[i]); tot += a; media += a * (Q * (i - 0.5)) / n; cum[i] = tot; }
  const out = { media: media / tot, massima: Q, campiona: (u) => { const x = u * tot; let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m; else hi = m; } return (Q * (lo + (x - cum[lo]) / Math.max(1e-300, cum[hi] - cum[lo]))) / n; } };
  spettri.set(k, out); return out;
}

// I RADIOELEMENTI DELLA ROCCIA DI UN PIANETA. Il potassio è quello dei suoi minerali (feldspato potassico, biotite);
// uranio, torio e rubidio lo seguono: tutti e quattro restano nel fuso finché possono (per questo la crosta ne è ricca
// e il mantello povero), con i rapporti delle condrite — salvo che del potassio, volatile, è rimasto un quarto.
// → frazioni in massa «di riferimento» (come sarebbero in una roccia di un mondo vecchio 4,5 miliardi di anni: l'età
//   vera del pianeta entra dopo, nuclide per nuclide, con la legge del decadimento)
export function radioelementi(minerali = [], { K = null } = {}) {
  let k = K;
  if (k == null) { k = 0; const tot = minerali.reduce((a, m) => a + (m.frazione || 0), 0) || 1; for (const m of minerali) { const M = MATERIALI[m.nome]; if (M) k += ((m.frazione / tot) * (inMassa(atomiDi(M.formula)).K || 0)); } }
  return { K: k, U: (k * CONDRITI.U) / (CONDRITI.K * VOLATILI_RIMASTI), Th: (k * CONDRITI.Th) / (CONDRITI.K * VOLATILI_RIMASTI), Rb: (k * CONDRITI.Rb) / CONDRITI.K };
}
// quanto U, Th e K ha un minerale di quella roccia: gli accessori concentrano uranio e torio (MATERIALI[…].concentra, rispetto
// ai minerali comuni); il potassio sta dove la formula lo vuole. Il conto torna: la somma sui minerali è la roccia.
export function concentrazioni(luogo, minerale) {
  const el = elementiDi(luogo), lista = [...(luogo.minerali || []), ...(luogo.accessori || [])], tot = lista.reduce((a, m) => a + m.frazione, 0) || 1; let peso = 0, kRoccia = 0;
  for (const m of lista) { const M = MATERIALI[m.nome] || {}; peso += (m.frazione / tot); kRoccia += (m.frazione / tot) * (M.formula ? inMassa(atomiDi(M.formula)).K || 0 : 0); }
  const base = (e) => { let s = 0; for (const m of lista) s += (m.frazione / tot) * (MATERIALI[m.nome]?.concentra?.[e] ?? 1); return el[e] / (s || 1); };
  const M = MATERIALI[minerale] || {}, kQui = M.formula ? inMassa(atomiDi(M.formula)).K || 0 : 0;
  return { U: base('U') * (M.concentra?.U ?? 1), Th: base('Th') * (M.concentra?.Th ?? 1), K: kRoccia > 0 ? (el.K * kQui) / kRoccia : 0, Rb: kRoccia > 0 ? (el.Rb * kQui) / kRoccia : 0 };
}
// gli elementi radioattivi del mezzo (frazioni in massa di riferimento): quelli dati da chi chiama, o quelli che seguono dai minerali
function elementiDi(luogo) {
  if (luogo.elementi) return { K: 0, U: 0, Th: 0, Rb: 0, ...luogo.elementi };
  if (luogo.tipo === 'acqua' || luogo.tipo === 'ghiaccio') {
    // nell'acqua: il potassio sciolto (mol/kg, come stato.totali di mare.js); il rubidio viene dalle stesse rocce ma le
    // argille lo trattengono di più (nel mare terrestre Rb/K è 1/14 di quello delle rocce: misurato); l'uranio è solubile solo se l'acqua è ossidata e ha carbonati (mare terrestre: 3,3 µg/kg, cioè 1,2·10⁻³
    // di quello della crosta dei continenti): senza ossigeno resta nella roccia (un centesimo); il torio non si scioglie
    const t = luogo.totali || {}, K = (t.K ?? 0) * 39.098e-3, crosta = luogo.crosta || { U: 2.7e-6 };
    return { K, Rb: (K * CONDRITI.Rb) / CONDRITI.K / 14, U: 1.2e-3 * crosta.U * (luogo.ossidata === false ? 0.01 : 1) * (K > 0 ? 1 : 0), Th: 0 };
  }
  if (luogo.tipo === 'aria') return { K: 0, U: 0, Th: 0, Rb: 0 };
  return radioelementi([...(luogo.minerali || []), ...(luogo.accessori || [])]);
}
// quanto resta (o quanto c'era) di un nuclide in un pianeta di una certa età, rispetto al riferimento (4,5 miliardi di anni)
const quantoResta = (mezza, etaPianeta) => Math.pow(2, (ETA_RIFERIMENTO - (etaPianeta ?? ETA_RIFERIMENTO)) / mezza);

// L'ATTIVITÀ di ogni nuclide in un chilo di mezzo → [{ nuclide, catena, tipo, perKg (Bq/kg), Q, energia (della particella,
// MeV), depositata (MeV che restano nella materia), neutrino (MeV portati via), Z, A, … }]
export function attivita(luogo) {
  const el = elementiDi(luogo), eta = luogo.etaPianeta ?? luogo.pianeta?.eta ?? ETA_RIFERIMENTO, out = [], solido = luogo.tipo !== 'acqua' && luogo.tipo !== 'aria' && luogo.tipo !== 'ghiaccio';
  for (const [capo, c] of Object.entries(CATENE)) {
    const w = el[c.elemento] || 0; if (!(w > 0)) continue;
    const A0 = (w / (ELEMENTI[c.elemento].A * 1e-3)) * N_A * c.abbondanza * quantoResta(c.mezza, eta) * lambdaDi(c.mezza);
    for (const [nome, Z, A, tipo, Q, mezza, ramo = 1, x, y] of c.passi) {
      // nell'acqua la catena è rotta: restano i nuclidi dell'uranio (solubile); i figli (torio, radio…) vanno nei sedimenti
      if (!solido && NOMI_EL[Z] !== 'uranio') continue;
      const base = { nuclide: nome, catena: capo, Z, A, tipo, mezza, perKg: A0 * ramo, Q };
      if (tipo === 'α') { const E = x ?? (Q * (A - 4)) / A; out.push({ ...base, energia: E, rinculo: (E * 4) / (A - 4), depositata: Q, neutrino: 0, figlia: `${NOMI_EL[Z - 2]}-${A - 4}`, Zf: Z - 2 }); }
      else out.push({ ...base, energia: x, gamma: y, depositata: x + y, neutrino: Math.max(0, Q - x - y), figlia: `${NOMI_EL[Z + 1]}-${A}`, Zf: Z + 1 });
    }
    if (c.fissione && solido) { // la fissione spontanea: due frammenti schiena contro schiena, con l'energia della loro repulsione (Viola)
      const tke = (0.1189 * 92 * 92) / Math.cbrt(238) + 7.3;
      out.push({ nuclide: capo, catena: capo, Z: 92, A: 238, tipo: 'fissione', mezza: Math.LN2 / c.fissione, perKg: (A0 / lambdaDi(c.mezza)) * (c.fissione / ANNO), Q: tke + 30, energia: tke, depositata: tke + 10, neutrino: 12 });
    }
  }
  for (const [nome, s] of Object.entries(SOLI)) {
    let perKg;
    if (nome === 'carbonio-14') { const c = luogo.carbonio ?? 0, r = luogo.carbonio14 ?? 0; perKg = (c / 14.0e-3) * N_A * r * lambdaDi(s.mezza); } // carbonio (kg/kg) × C-14/C
    else perKg = ((el[s.elemento] || 0) / (ELEMENTI[s.elemento].A * 1e-3)) * N_A * s.abbondanza * quantoResta(s.mezza, eta) * lambdaDi(s.mezza);
    if (!(perKg > 0)) continue;
    for (const r of s.rami) {
      const base = { nuclide: nome, catena: null, Z: s.Z, A: s.A, mezza: s.mezza, perKg: perKg * r.ramo, Q: r.Q, figlia: r.figlia };
      if (r.tipo === 'β') out.push({ ...base, tipo: 'β', energia: r.media, gamma: 0, depositata: r.media, neutrino: r.Q - r.media, Zf: s.Z + 1, proibita: r.proibita || 0 });
      else out.push({ ...base, tipo: 'cattura', energia: 0, gamma: r.gamma, depositata: r.gamma * 0.984 + 0.003, neutrino: r.Q - r.gamma * 0.984, Zf: s.Z - 1 });
    }
  }
  return out;
}
// il calore della radioattività (W/kg): la somma di ciò che resta nella materia. È la stessa legge di leggi.js
// (caloreDellaRoccia): coerenza(eta) confronta i due conti per una roccia con la composizione delle condriti.
export const calore = (luogo) => attivita(luogo).reduce((s, a) => s + a.perKg * a.depositata * MEV_J, 0);
export function coerenza(etaAnni = ETA_RIFERIMENTO) {
  const qui = { tipo: 'roccia', elementi: { ...CONDRITI }, etaPianeta: etaAnni }, att = attivita(qui), di = (f) => att.filter(f).reduce((s, a) => s + a.perKg * a.depositata * MEV_J, 0);
  const mio = [di((a) => a.catena === 'uranio-238'), di((a) => a.catena === 'uranio-235'), di((a) => a.catena === 'torio-232'), di((a) => a.nuclide === 'potassio-40')];
  const suo = ISOTOPI.map(([h, mezza]) => h * Math.pow(2, (4.5 - etaAnni / 1e9) / mezza));
  const tot = (v) => v.reduce((a, b) => a + b, 0);
  return { nuclidi: ['uranio-238', 'uranio-235', 'torio-232', 'potassio-40'], materia: mio, leggi: suo, scarti: mio.map((x, i) => x / suo[i] - 1), totale: tot(mio), totaleLeggi: tot(suo), scarto: tot(mio) / tot(suo) - 1 };
}

// =====================================================================================
// 4. I RAGGI COSMICI ARRIVATI FIN LÌ
// =====================================================================================
// Sopra il pianeta: i nucleoni primari, per (m²·s·sr·GeV), E l'energia cinetica per nucleone in GeV. Lo spettro fuori dal
// vento della stella è quello misurato presso il Sole (Burger e altri 2000; Usoskin e altri 2005: 1,9·10⁴·P^(−2,78) /
// (1 + 0,4866·P^(−2,51)) protoni, P la rigidità in GV; più il 30% di nucleoni legati nell'elio e nei nuclei: in alto
// torna a 1,8·10⁴·E^(−2,7)), moltiplicato per quanto quel punto della galassia ne ha rispetto al Sole
// (luogo.raggi.relativo: lo dà chi conosce il cielo dei raggi di quella stella, cosmo.js; se manca vale 1), e frenato
// dal vento della stella (campo di forza, Gleeson e Axford 1968: ogni particella perde Φ = 0,55 GeV entrando).
const M_P = 0.93827, PHI = 0.55, LAMBDA_ATT = 1.4; // (GeV, GV) · la lunghezza di attenuazione dei nucleoni è 1,4 volte quella d'urto (aria: 120 g/cm²)
const fuori = (E) => { const P = Math.sqrt(E * (E + 2 * M_P)); return (1.3 * 1.9e4 * Math.pow(P, -2.78)) / (1 + 0.4866 * Math.pow(P, -2.51)); };
const primari = (E) => (fuori(E + PHI) * (E * (E + 2 * M_P))) / ((E + PHI) * (E + PHI + 2 * M_P));
const RESA_MUONI = (0.14 / 1.8) * Math.pow(10, 2.7);
// la soglia di Størmer (GV) in un punto della superficie: sotto questa rigidità un raggio che arriva dall'alto non passa.
// La stessa legge di cosmo.js (Terra all'equatore: 14,9 GV), con la latitudine: cala come cos⁴ verso i poli del campo
export const sogliaStormer = (pianeta = {}, latitudine = 0) => 14.9 * ((pianeta.B0 ?? 3.1e-5) / 3.1e-5) * ((pianeta.raggioM ?? 6.371e6) / 6.371e6) * Math.cos((latitudine * Math.PI) / 180) ** 4;
const energiaDaRigidita = (GV) => Math.sqrt(GV * GV + M_P * M_P) - M_P;
// l'integrale di una funzione su una griglia logaritmica
const integraLog = (f, a, b, n = 60) => { if (!(b > a)) return 0; const h = Math.log(b / a) / n; let s = 0; for (let i = 0; i <= n; i++) { const x = a * Math.exp(i * h); s += (i === 0 || i === n ? 0.5 : 1) * f(x) * x; } return s * h; };

// → { soglia (GV), colonnaAria, colonnaSopra (g/cm²), quotaNascita (m), primari, nucleoni, muoni, elettroni, neutroni: flussi
//     attraverso una superficie orizzontale in quel punto (per m² e per secondo); muoniVerticali (per m²·s·sr),
//     energiaMuoni (GeV, la mediana), spettroMuoni(u) (GeV al quantile u), produzioneC14 (atomi per m² e per secondo) }
const cosmiciFatti = new Map();
export function raggiCosmici(luogo = {}) {
  const pn = luogo.pianeta || {}, aria = luogo.aria || {}, sopra = luogo.sopra || {}, g = pn.g ?? 9.81, rel = luogo.raggi?.relativo ?? 1, lat = luogo.latitudine ?? pn.latitudine ?? 45;
  const chiave = JSON.stringify([pn.B0, pn.raggioM, g, aria, sopra, rel, lat, luogo.tipo === 'aria' ? luogo.quotaM : 0]);
  if (cosmiciFatti.has(chiave)) return cosmiciFatti.get(chiave);
  const mAria = mezzo({ tipo: 'aria', aria }), X0 = Math.max(0, (aria.pressione ?? 0) / g / 10); // la colonna d'aria sopra il punto (g/cm²)
  const Rc = sogliaStormer(pn, lat), Ec = energiaDaRigidita(Rc), LamN = LAMBDA_ATT * mAria.lambdaNucleare;
  // la scala d'altezza dell'aria alta, dove nascono gli sciami: più fredda di quella al suolo (aria.Talta: la temperatura
  // «di pelle» del pianeta, Teq/2^¼; se manca, 0,76 volte quella al suolo: sulla Terra 220 K contro 288)
  let mu = 0, tot = 0; const gas = aria.gas && Object.keys(aria.gas).length ? aria.gas : { N2: 0.781, O2: 0.209, Ar: 0.0093 }; for (const f in gas) { try { mu += gas[f] * MASSA_GAS(f); tot += gas[f]; } catch { /* un gas che la tavola non conosce */ } } mu /= tot || 1;
  const H = (8.314 * (aria.Talta ?? 0.76 * (aria.T ?? luogo.T ?? 288))) / (mu * 1e-3 * g), epsPi = 115 * (H / 6400), epsK = 850 * (H / 6400), epsMu = (0.10566 * H) / 658.6;
  const aAria = frenata(particella('muone-'), 3000, mAria).elettronica * 1e-3; // GeV per g/cm²
  // i primari sopra la soglia, da tutto il cielo sopra l'orizzonte (π·I per una superficie orizzontale)
  const Ip = rel * integraLog(primari, Math.max(Ec, 0.02), 1e6, 80), attAria = Math.exp(-X0 / LamN);
  // I MUONI (Gaisser 1990, cap. 6). I pioni nascono dove i nucleoni urtano (∝ e^(−X/Λ)/Λ), con lo spettro dei primari; se
  // decadono prima di urtare ancora danno un muone (1/(1 + 1,1·E·cosθ/ε_π): ε_π cresce con la scala d'altezza). Il muone
  // scende perdendo energia (la frenata di quell'aria) e può decadere in volo: sopravvive con probabilità
  // [(X/X0)·(E/E′)]^(ε_μ/(E·cosθ + a·X0)). Quanti: un muone di energia E′ viene in media da un primario dieci volte più
  // energico (più 1 GeV: sotto, i pioni non nascono); la resa è quella che in alto dà 0,14·E^(−2,7) muoni per (cm²·s·sr·GeV)
  // da 1,8·E^(−2,7) primari. Chi viene da un primario sotto la soglia del campo non c'è.
  const muoniA = (Eg, cos) => { // intensità al suolo, per (m²·s·sr·GeV)
    if (!(X0 > 0)) return 0; const n = 24, hx = Math.log(X0 / 0.5) / n; let somma = 0;
    for (let i = 0; i <= n; i++) { const X = 0.5 * Math.exp(i * hx), E1 = Eg + (aAria * (X0 - X)) / cos; if (E1 * 10 + 1 < Ec) continue;
      const nasce = RESA_MUONI * rel * primari(10 * E1 + 1) * (1 / (1 + (1.1 * E1 * cos) / epsPi) + 0.054 / (1 + (1.1 * E1 * cos) / epsK)) * (Math.exp(-X / (LamN * cos)) / (LamN * cos));
      const vive = Math.pow((X / X0) * (Eg / E1), epsMu / (Eg * cos + aAria * X0));
      somma += (i === 0 || i === n ? 0.5 : 1) * nasce * vive * X; }
    return somma * hx;
  };
  // sotto il suolo (o sotto l'acqua, o il ghiaccio): un muone arriva alla profondità D se ha almeno (a/b)(e^(bD) − 1)
  const strati = [['acqua', sopra.acquaM], ['ghiaccio', sopra.ghiaccioM], ['roccia', sopra.rocciaM]].filter(([, m]) => m > 0); let D = 0, aS = 0, bS = 0, attSotto = 1;
  for (const [tipo, metri] of strati) { const mz = tipo === 'roccia' ? mezzo(sopra.roccia || { tipo: 'roccia', minerali: [{ nome: 'quarzo', frazione: 0.5 }, { nome: 'plagioclasio', frazione: 0.5 }] }) : mezzo({ tipo }), col = metri * mz.densita * 100;
    const f = frenata(particella('muone-'), 1e5, mz); D += col; aS += col * f.elettronica * 1e-3; bS += (col * f.radiativa) / (1e5 + 105.658); attSotto *= Math.exp(-col / (LAMBDA_ATT * mz.lambdaNucleare)); }
  if (D > 0) { aS /= D; bS /= D; }
  const Emin = (cos) => (D > 0 ? (aS / bS) * Math.expm1((bS * D) / cos) : 0);
  const coseni = [0.97, 0.87, 0.72, 0.55, 0.38, 0.2], dc = [0.07, 0.13, 0.17, 0.17, 0.17, 0.19 + 0.1]; // (da 1 a 0; l'ultimo tratto copre fino all'orizzonte, dove non arriva quasi niente)
  const sopraSoglia = (cos) => integraLog((E) => muoniA(E, cos), Math.max(0.01, Emin(cos)), 1e6, 48);
  const muV = sopraSoglia(1); let muoni = 0; for (let i = 0; i < coseni.length; i++) muoni += 2 * Math.PI * sopraSoglia(coseni[i]) * coseni[i] * dc[i];
  // lo spettro dei muoni in quel punto (verticali): l'energia con cui ARRIVANO lì (sotto terra ne hanno già persa)
  const perSpettro = []; { const a = Math.max(0.01, Emin(1)), n = 48, h = Math.log(1e6 / a) / n; let c = 0; for (let i = 0; i <= n; i++) { const E = a * Math.exp(i * h); c += muoniA(E, 1) * E * h; perSpettro.push([E, c]); } }
  const arriva = (E) => (D > 0 ? Math.max(0.001, (E + aS / bS) * Math.exp(-bS * D) - aS / bS) : E);
  const spettroMuoni = (u) => { const T = perSpettro[perSpettro.length - 1][1] * limita(u, 0, 0.9999); let i = 1; while (i < perSpettro.length - 1 && perSpettro[i][1] < T) i++; const [e0, c0] = perSpettro[i - 1], [e1, c1] = perSpettro[i]; return arriva(e0 * Math.pow(e1 / e0, (T - c0) / Math.max(1e-300, c1 - c0))); };
  // i nucleoni (protoni e neutroni veloci) si attenuano; gli elettroni: quelli della cascata (massimo di Pfotzer a ~100 g/cm²,
  // 2 secondari per primario: misure con palloni) più quelli che accompagnano i muoni (0,3: decadimenti in volo ed elettroni strappati)
  const nucleoni = Math.PI * Ip * attAria * attSotto, cascata = X0 > 0 ? Math.PI * Ip * 2 * (X0 / 100) * Math.exp(1 - X0 / 100) : 0;
  const out = { soglia: Rc, energiaSoglia: Ec, relativo: rel, colonnaAria: X0, colonnaSopra: D, scalaAltezza: H, quotaNascita: X0 > mAria.lambdaNucleare ? H * Math.log(X0 / mAria.lambdaNucleare) : 0,
    primari: Math.PI * Ip, primariVerticali: Ip, nucleoni, muoni, muoniVerticali: muV, elettroni: (D > 0 ? 0 : cascata) + 0.3 * muoni, energiaMuoni: muV > 0 ? spettroMuoni(0.5) : 0, spettroMuoni, energiaMinima: Emin(1),
    primarioTipico: (u) => { const a = Math.max(Ec, 0.02), n = 60, h = Math.log(1e6 / a) / n; let c = 0; const cum = []; for (let i = 0; i <= n; i++) { const E = a * Math.exp(i * h); c += primari(E) * E * h; cum.push([E, c]); } const T = c * limita(u, 0, 0.9999); let i = 1; while (i < n && cum[i][1] < T) i++; return cum[i][0]; } };
  cosmiciFatti.set(chiave, out); if (cosmiciFatti.size > 30) cosmiciFatti.delete(cosmiciFatti.keys().next().value);
  // i neutroni lenti (evaporati dai nuclei colpiti): 0,013 per cm²·s al suolo a New York (soglia 2 GV), in proporzione ai
  // nucleoni; dove l'aria non basta nascono nel suolo, e ne escono circa 3 per primario (misure in orbita attorno alla Luna).
  // E il carbonio-14 che fanno con l'azoto dell'aria: 2 atomi per cm²·s in media sulla Terra, per la parte di neutroni che
  // l'azoto cattura; l'aria lo rimescola: conta la media dei primari su tutte le latitudini
  if (!luogo.__riferimento) {
    const terra = { g: 9.81, B0: 3.1e-5, raggioM: 6.371e6 }, rif = raggiCosmici({ __riferimento: true, pianeta: terra, latitudine: 51, aria: { pressione: 101325, T: 288 } });
    out.neutroni = Math.min(130 * (nucleoni / rif.nucleoni), 3 * out.primari * attSotto);
    const at = {}; for (const f in gas) { try { const a = atomiDi(f); for (const e in a) at[e] = (at[e] || 0) + a[e] * gas[f]; } catch { /* un gas che la tavola non conosce */ } }
    let cat = 0; for (const e in at) cat += at[e] * (SIGMA_CATTURA[e] ?? 0.1); const suAzoto = cat > 0 ? ((at.N || 0) * SIGMA_CATTURA.N) / cat : 0;
    const medio = (pianeta, r) => { let s = 0, w = 0; for (const l of [5, 15, 25, 35, 45, 55, 65, 75, 85]) { const c = Math.cos((l * Math.PI) / 180); s += c * r * integraLog(primari, Math.max(energiaDaRigidita(sogliaStormer(pianeta, l)), 0.02), 1e6, 40); w += c; } return s / w; };
    out.produzioneC14 = 2e4 * (medio(pn, rel) / medio(terra, 1)) * (suAzoto / 0.995) * (X0 > 0 ? -Math.expm1(-X0 / LamN) : 0);
  }
  return out;
}
