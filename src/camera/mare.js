// mare.js — L'ACQUA DEI MARI E DEI LAGHI di un pianeta, a tutte le scale: che cosa c'è sciolto, che cosa vi è sospeso,
// come si muove; dal pianeta intero fino alle molecole.
//
// Non è una tinta blu: si prende il pianeta com'è (le sue rocce, i suoi vulcani, la sua aria, i suoi fiumi, i suoi
// venti) e si chiede che acqua ne esce.
//   1. I SALI vengono da tre parti: le ROCCE di quel pianeta, consumate dall'acqua (ogni minerale si scioglie con la sua
//      velocità misurata, che cresce con la temperatura: legge di Arrhenius; quanto se ne scioglie dipende da quanto
//      tempo il granello resta nel suolo prima che l'erosione lo porti via); i GAS DEI VULCANI (cloro e zolfo: quelli del
//      mantello, che il magma porta fuori per tutta la vita del pianeta); le SORGENTI CALDE del fondo, dove l'acqua
//      attraversa la roccia calda (le toglie il magnesio, le dà calcio e potassio). I fiumi li portano al mare.
//      ESCONO dall'acqua nella roccia calda del fondo, sulle argille (scambio di ioni), sepolti con l'acqua dei
//      sedimenti, nelle conche che evaporano (da cui tornano, quando i sedimenti sono risollevati e consumati), e come
//      calcare quando il prodotto degli ioni supera la solubilità. La composizione del mare è l'integrale di questo
//      bilancio per l'età del pianeta: ogni ione ha il suo tempo di residenza, e resta nel mare ciò che vi resta a lungo.
//   2. L'EQUILIBRIO IN SOLUZIONE. Tutte le costanti (solubilità dei sali, dei gas: legge di Henry; acido carbonico;
//      acqua) vengono da UNA tabella di entalpie ed entropie, con la stessa regola di chimica.js: K = exp(−ΔG/RT),
//      ΔG = ΔH − TΔS. Così dipendono dalla temperatura da sole: il calcare e il gesso sono meno solubili al caldo, il
//      salgemma poco di più, i gas di meno. Gli ioni in soluzione non sono liberi: si schermano (legge di Debye-Hückel
//      estesa) e si appaiano (equazione di Fuoss: dalla legge di Coulomb, dalla costante dielettrica dell'acqua e dai
//      raggi degli ioni). Il pH esce dal bilancio delle cariche, dall'anidride carbonica dell'aria e dal calcare.
//   3. LE CORRENTI: il vento (meteo.js) trascina la superficie; con la rotazione escono la deriva di Ekman, i grandi
//      giri e la corrente stretta sul bordo ovest (modello di Stommel 1948, risolto sulla forma vera dei bacini), le
//      risalite dove l'acqua di superficie diverge; l'acqua più densa (fredda e salata) affonda e riempie il fondo.
//   4. I CAMPI: temperatura, salinità (evaporazione − pioggia − fiumi, portate dalla corrente), ghiaccio, torbidità (il
//      fango dei fiumi: la sabbia cade subito, l'argilla viaggia: legge di Stokes), saturazione dei sali, laghi.
//   5. IL CAMPIONE: in un punto, a una profondità, per un cubetto d'acqua di lato dato (da metri a nanometri), che cosa
//      c'è dentro davvero e come si muove. Col principio di nebbia.js: se le particelle vere sono troppe se ne dà un
//      campione rappresentativo, e accanto il numero vero.
//
// LEGGI EMPIRICHE / DATI (misurati, usati così; i numeri sono in DATI, IONI, TERMO, MINERALI_ROCCIA):
//   · entalpie ed entropie degli ioni e delle specie in acqua a 298 K (CODATA 1989; NBS 1982; Fe²⁺: Parker e
//     Khodakovskii 1995; gesso e silice: Robie e Hemingway 1995). Con ΔH e S costanti danno a 25 °C: calcite
//     log K = −8,48 (misurato −8,48), gesso −4,56 (−4,58), salgemma K = 38 (37,6), CO2 0,034 mol/kg/bar (0,034),
//     pK1 6,35 (6,35), pK2 10,33 (10,33), O2 1,3·10⁻³ (1,3·10⁻³);
//   · i coefficienti di attività: Debye-Hückel esteso con i parametri di Truesdell e Jones 1974 (quelli di WATEQ e
//     PHREEQC: raggio efficace å e termine lineare b per ogni ione); la costante dielettrica dell'acqua (Malmberg e
//     Maryott 1956, come esponenziale in T); la viscosità dell'acqua (formula di Vogel); raggi degli ioni (Shannon
//     1976), numeri di idratazione (Marcus 1988; Ohtaki e Radnai 1993), coefficienti di diffusione (Li e Gregory 1974);
//   · la velocità con cui i minerali si sciolgono in laboratorio, e la loro energia di attivazione (Palandri e
//     Kharaka 2004, USGS OFR 2004-1068, meccanismo neutro);
//   · la denudazione dei continenti dove piove: 30 m per milione di anni (la stessa legge di geologia.js);
//   · i coefficienti di fusione parziale (quelli di chimica.js §6, ricopiati qui perché là non sono esportati) e
//     quanto cloro e zolfo il mantello della Terra ha tenuto rispetto al Sole (Cl 17–30 ppm, S ~250 ppm: McDonough e
//     Sun 1995);
//   · il fondo del mare: il calore di una crosta che si raffredda (conduzione: q = k·ΔT/√(π·κ·t)); quanta parte del
//     calore interno esce con l'acqua calda (10% ad alta temperatura sull'asse delle dorsali, 20% tiepida sui fianchi:
//     Elderfield e Schultz 1996; Stein e Stein 1994); ciò che i fluidi misurati perdono e prendono (tutto il magnesio;
//     Von Damm 1995; Wheat e Mottl 2000);
//   · le argille: capacità di scambio 0,25 eq/kg e preferenze tra ioni (Sayles e Mangelsdorf 1977);
//   · la soglia a cui un sale nasce da solo in soluzione: teoria classica della nucleazione, con le energie di
//     superficie misurate (calcite 0,094 J/m², gesso 0,04, salgemma 0,04);
//   · l'ottica dell'acqua pura (Pope e Fry 1997; Morel 1974) e del fango in sospensione (Babin e altri 2003);
//   · le creste che frangono: copertura = 3,84·10⁻⁶·U^3,41 (Monahan e O'Muircheartaigh 1980);
//   · la coagulazione delle argille: regola di Schulze-Hardy (la concentrazione critica cala come z⁻⁶);
//   · il rimescolamento verticale del mare: 10⁻⁴ m²/s (Munk 1966).
// PARAMETRI LIBERI (non misurati, o misurati solo entro ordini di grandezza; scelti guardando la Terra):
//   · campo: di quanto i minerali si sciolgono più piano in natura che in laboratorio (misure: da 10 a 1000 volte;
//     qui 20, perché il sodio dei fiumi terrestri torni) e lo spessore del suolo (1 m);
//   · sfiato: quanta parte del cloro e dello zolfo del mantello che fonde arriva in superficie e ci resta (0,3 e 0,04:
//     danno l'inventario terrestre di oceano ed evaporiti);
//   · sodioCaldo, potassioTiepido, magnesioTiepido: quanto di ciascuno la roccia del fondo trattiene a ogni passaggio;
//   · chiusi: quanta parte dell'acqua che evapora sui bassi fondali lo fa in bacini chiusi fino al sale (5·10⁻³: i
//     ~10¹² mol/anno di salgemma dei depositi terrestri); riciclo: ogni quanto i sedimenti tornano in gioco (250 Ma);
//   · eterogenea: di quanto le particelle sospese abbassano la barriera alla nascita di un cristallo (0,3);
//   · l'attrito delle correnti (la corrente di bordo è larga una cella della griglia) e lo strato che il vento muove.
// SEMPLIFICAZIONI:
//   · ΔH e S costanti con la temperatura (come chimica.js): bene tra 0 e 100 °C, grossolano a 350 °C;
//   · le attività reggono fino a qualche mole per chilo (il salgemma satura a 6,6 mol/kg invece di 6,15);
//   · il clima, i continenti e i fiumi di oggi per tutta la storia (come tettonica.js fa con il calore); la massa del
//     mare costante; il mare ben rimescolato (gli ioni hanno ovunque le stesse proporzioni: cambia la salinità);
//   · l'aria è data (P.atmosfera, o atmosfera() di chimica.js): il mare non la cambia;
//   · niente vita: nessuno toglie il calcare, la silice, il solfato come fanno gli organismi; il mare resta
//     sovrasaturo fin dove la chimica da sola lo permette;
//   · le correnti sono quelle medie dell'anno, di uno strato solo; niente maree, niente onde, niente vortici;
//   · il campione viaggia con la corrente: le velocità delle particelle sono quelle rispetto all'acqua.
// UNITÀ: mol per kg d'acqua, g/kg, K, m, m/s, Pa; longitudine e latitudine in GRADI (−180…180, −90…90); le griglie hanno
// le righe da nord a sud come geologia.js. Deterministico: ogni esito incerto viene dalla sorgente degli eventi.
// Lo «stato» che mare() restituisce è fatto solo di dati (numeri, testi, vettori): può passare tra fili.

import { COSTANTI, R_GAS, ANNO } from './leggi.js';
import { MOLECOLE, abbondanze, atmosfera } from './chimica.js';
import { sorgente } from './eventi.js';

const NA = 6.022e23, KB = COSTANTI.kB, E0 = 8.854e-12, QE = COSTANTI.e, RAD = Math.PI / 180;
const limita = (x, a, b) => (x < a ? a : x > b ? b : x);

export const DATI = {
  // --- le rocce e i fiumi
  denudazione: 3e-5, // (m/anno) quanto si consumano i continenti dove piove (legge empirica, la stessa di geologia.js)
  densitaRoccia: 2700, suolo: 1, // (kg/m³; m) lo spessore in cui la roccia resta esposta all'acqua prima di essere portata via
  campo: 1 / 20, superficieGrani: 200, // natura/laboratorio (libero); superficie dei granelli del suolo (m²/kg: 0,1 mm, ruvidi)
  // --- il mantello e i vulcani
  rimasto: { Cl: 0.01, S: 0.0025 }, // quanto cloro e zolfo il mantello ha tenuto, rispetto alle proporzioni del Sole
  sfiato: { Cl: 0.3, S: 0.04 }, // quanta parte di quelli del mantello fuso arriva in superficie e ci resta (libero)
  magma: 0.1, caloreMagma: 1.7e6, fusione: 0.1, // il magma porta un decimo del calore; J per kg (1300 K + calore di fusione); la parte che fonde
  // --- il fondo del mare
  caldo: 0.1, tiepido: 0.2, salto: 10, // la parte del calore che esce con acqua calda e tiepida; quanto si scalda la tiepida (K)
  sodioCaldo: 0.03, potassioCaldo: 0.2, magnesioTiepido: 0.003, potassioTiepido: 0.03, // per passaggio (liberi, entro le misure)
  solfatoCaldo: 0.1, // la parte del solfato che la roccia calda trattiene (il resto torna quando l'anidrite si raffredda)
  conducibilita: 3.3, diffusivita: 1e-6, Tmantello: 1620, critico: 647, // della roccia; il punto critico dell'acqua (K)
  // --- i sedimenti
  cec: 0.25, preferenze: { 'Na+': 1, 'K+': 5, 'Mg2+': 3.4, 'Ca2+': 7.4 }, // argille: eq/kg e selettività
  porosita: 0.2, chiusi: 5e-3, riciclo: 2.5e8, calcareCheTorna: 2 / 3, // l'acqua sepolta coi sedimenti; i bacini chiusi (libero); (anni)
  // --- la nascita dei cristalli (energia di superficie J/m², volume molare m³/mol)
  cristalli: { calcite: [0.094, 3.69e-5], gesso: [0.04, 7.47e-5], salgemma: [0.04, 2.70e-5], 'solfuro di ferro': [0.1, 1.82e-5], ghiaccio: [0.03, 1.96e-5] },
  eterogenea: 0.3, prefattore: 1e30, // (libero) la barriera sulle particelle sospese; tentativi per m³ al secondo
  // --- il moto
  mescola: 1e-4, strato: 50, attritoEkman: 1 / (3 * 86400), // (m²/s) Munk; (m) lo strato rimescolato dal vento; (1/s)
  cd: 1.3e-3, ce: 1.3e-3, // l'attrito del vento sul mare e l'evaporazione (le formule di massa di meteo.js)
  // --- le particelle (m): sabbia, limo, argilla; densità dei granelli e dei fiocchi (kg/m³)
  taglie: { sabbia: 2e-4, limo: 2e-5, argilla: 2e-6 }, densitaGrani: 2650, densitaFiocchi: 1150, fiocco: 6e-5,
  coagula: 0.08, // (mol/kg) la concentrazione di ioni a una carica a cui l'argilla coagula (per z cariche: diviso z⁶)
};

// ---------- 1. LA TABELLA TERMOCHIMICA DELL'ACQUA (dati misurati) e le costanti che ne discendono
// ioni: ΔH (kJ/mol), S (J/mol·K), carica, å e b di Truesdell-Jones, diffusione a 25 °C (10⁻⁹ m²/s), raggio (Å),
// molecole d'acqua nel primo guscio, massa (g/mol)
export const IONI = {
  'H+': [0, 0, 1, 9.0, 0, 9.31, 0.3, 3, 1.008], 'OH-': [-230.015, -10.9, -1, 3.5, 0, 5.27, 1.33, 4, 17.007],
  'Na+': [-240.34, 58.45, 1, 4.0, 0.075, 1.33, 1.02, 6, 22.99], 'K+': [-252.14, 101.2, 1, 3.5, 0.015, 1.96, 1.38, 7, 39.098],
  'Mg2+': [-467.0, -137.0, 2, 5.5, 0.2, 0.71, 0.72, 6, 24.305], 'Ca2+': [-543.0, -56.2, 2, 5.0, 0.165, 0.79, 1.0, 7, 40.078],
  'Fe2+': [-90.0, -101.6, 2, 6.0, 0, 0.72, 0.78, 6, 55.845], 'Cl-': [-167.08, 56.6, -1, 3.5, 0.015, 2.03, 1.81, 6, 35.45],
  'SO4(2-)': [-909.34, 18.5, -2, 5.0, -0.04, 1.07, 2.3, 10, 96.06], 'HCO3-': [-689.93, 98.4, -1, 5.4, 0, 1.19, 1.56, 6, 61.017],
  'CO3(2-)': [-675.23, -50.0, -2, 5.4, 0, 0.92, 1.78, 9, 60.009], 'HS-': [-17.6, 62.8, -1, 3.5, 0, 1.73, 1.84, 6, 33.07],
};
const TERMO = { // specie neutre in acqua e i solidi che chimica.js non ha: ΔH, S
  'CO2(aq)': [-413.26, 119.36], 'O2(aq)': [-11.7, 110.9], 'N2(aq)': [-10.54, 95.3], 'H2S(aq)': [-39.7, 121], 'H4SiO4': [-1460.0, 180],
  'CaSO4·2H2O': [-2022.6, 194.1], KCl: [-436.5, 82.6], 'SiO2(am)': [-903.5, 46.9],
};
const gibbs = (f, T) => { const x = IONI[f] || TERMO[f]; if (x) return 1000 * x[0] - T * x[1]; const m = MOLECOLE[f]; if (!m) throw new Error(`mare: specie sconosciuta ${f}`); return 1000 * m.dH - T * m.S; };
const kEq = (reag, prod, T) => { let g = 0; for (const f in prod) g += prod[f] * gibbs(f, T); for (const f in reag) g -= reag[f] * gibbs(f, T); return Math.exp(-g / (R_GAS * T)); };
const memoK = new Map();
// tutte le costanti a una temperatura (mol/kg, bar): si calcolano una volta per decimo di grado
export function costanti(T) {
  const k = Math.round(T * 10); if (memoK.has(k)) return memoK.get(k);
  const eps = 87.74 * Math.exp(-0.0046 * (T - 273.15)), A = 1.8246e6 / Math.pow(eps * T, 1.5), B = 50.29 / Math.sqrt(eps * T); // Debye-Hückel
  const bjerrum = (QE * QE) / (4 * Math.PI * E0 * eps * KB * T); // (m) la distanza a cui due cariche si sentono quanto l'agitazione termica
  const out = { T, eps, A, B, bjerrum,
    henry: { CO2: kEq({ CO2: 1 }, { 'CO2(aq)': 1 }, T), O2: kEq({ O2: 1 }, { 'O2(aq)': 1 }, T), N2: kEq({ N2: 1 }, { 'N2(aq)': 1 }, T), H2S: kEq({ H2S: 1 }, { 'H2S(aq)': 1 }, T) },
    K1: kEq({ 'CO2(aq)': 1, 'H2O(l)': 1 }, { 'H+': 1, 'HCO3-': 1 }, T), K2: kEq({ 'HCO3-': 1 }, { 'H+': 1, 'CO3(2-)': 1 }, T), Kw: kEq({ 'H2O(l)': 1 }, { 'H+': 1, 'OH-': 1 }, T),
    KH2S: kEq({ 'H2S(aq)': 1 }, { 'H+': 1, 'HS-': 1 }, T),
    sali: { calcite: kEq({ CaCO3: 1 }, { 'Ca2+': 1, 'CO3(2-)': 1 }, T), gesso: kEq({ 'CaSO4·2H2O': 1 }, { 'Ca2+': 1, 'SO4(2-)': 1, 'H2O(l)': 2 }, T), anidrite: kEq({ CaSO4: 1 }, { 'Ca2+': 1, 'SO4(2-)': 1 }, T),
      salgemma: kEq({ NaCl: 1 }, { 'Na+': 1, 'Cl-': 1 }, T), silvite: kEq({ KCl: 1 }, { 'K+': 1, 'Cl-': 1 }, T), 'silice amorfa': kEq({ 'SiO2(am)': 1, 'H2O(l)': 2 }, { H4SiO4: 1 }, T),
      quarzo: kEq({ SiO2: 1, 'H2O(l)': 2 }, { H4SiO4: 1 }, T), 'solfuro di ferro': kEq({ FeS: 1, 'H+': 1 }, { 'Fe2+': 1, 'HS-': 1 }, T) } };
  memoK.set(k, out); if (memoK.size > 4000) memoK.delete(memoK.keys().next().value);
  return out;
}
// il coefficiente di attività di uno ione alla forza ionica I (Debye-Hückel esteso, Truesdell-Jones)
const gammaIone = (f, I, K) => { const x = IONI[f], r = Math.sqrt(I); return Math.pow(10, (-K.A * x[2] * x[2] * r) / (1 + x[3] * K.B * r) + x[4] * I); };
const gammaCarica = (z, I, K) => { const r = Math.sqrt(I); return Math.pow(10, (-K.A * z * z * r) / (1 + 4.5 * K.B * r)); };
// LE COPPIE DI IONI (Fuoss 1958): due ioni di segno opposto a contatto sono tenuti insieme dall'attrazione di Coulomb
// attraverso l'acqua; K = (4/3)π·N·a³·exp(|z₁z₂|·ℓ/a), con ℓ la lunghezza di Bjerrum e a la distanza a contatto (i raggi;
// il magnesio tiene così stretto il suo guscio che tra lui e l'altro ione resta una molecola d'acqua: +2,76 Å).
// A 25 °C dà (log K, L/mol): MgSO4 1,9 (misurato 2,3), CaCO3 3,2 (3,2), NaSO4⁻ 0,8 (0,7), NaCl −0,15.
export function coppia(catione, anione, T) {
  const K = costanti(T), c = IONI[catione], a = IONI[anione], d = (c[6] + a[6] + (catione === 'Mg2+' ? 2.76 : 0)) * 1e-10;
  return ((4 / 3) * Math.PI * NA * d ** 3 * 1000) * Math.exp((Math.abs(c[2] * a[2]) * K.bjerrum) / d);
}
const CATIONI = ['Na+', 'K+', 'Mg2+', 'Ca2+'], LEGANTI = ['SO4(2-)', 'CO3(2-)', 'HCO3-'];
const TOT = { 'Na+': 'Na', 'K+': 'K', 'Mg2+': 'Mg', 'Ca2+': 'Ca' };

// L'ACQUA CON I SUOI SALI IN EQUILIBRIO. tot: moli per kg d'acqua di { Na, K, Mg, Ca, Cl, S (solfato), Si, Fe }; T; pCO2 (bar).
// Se omegaCalcite è dato e tot.Ca manca, il calcio è quello che tiene la calcite a quella saturazione (il mare).
// Il pH è quello che chiude il bilancio delle cariche: cationi − cloruro − solfato = alcalinità = HCO3⁻ + 2CO3²⁻ + OH⁻ − H⁺.
// → { pH, I, liberi, gamma, coppie (mol/kg), alcalinita, carbonio, Ca, omega: { calcite, gesso, … }, attivitaAcqua }
export function acqua(tot, T = 288, { pCO2 = 3e-4, omegaCalcite = null } = {}) {
  const K = costanti(T), Na = tot.Na || 0, Kk = tot.K || 0, Mg = tot.Mg || 0, Cl = tot.Cl || 0, S = tot.S || 0, cercaCa = omegaCalcite != null && tot.Ca == null;
  let Ca = cercaCa ? 0.01 : tot.Ca || 0;
  const KA = {}; for (const c of CATIONI) { KA[c] = {}; for (const l of LEGANTI) KA[c][l] = coppia(c, l, T); }
  const lib = { 'Na+': Na, 'K+': Kk, 'Mg2+': Mg, 'Ca2+': Ca, 'SO4(2-)': S, 'CO3(2-)': 0, 'HCO3-': 0 }, g = {}, Kc = {};
  let I = 0.5 * (Na + Kk + Cl + 4 * (Mg + Ca + S)) + 1e-7, pH = 7, alk = 0, aw = 1, co2 = 0, H = 1e-7, OH = 1e-7, hco3T = 0, co3T = 0;
  const E = Na + Kk + 2 * Mg - Cl - 2 * S; // l'eccesso di cariche positive dei sali «forti» (senza il calcio)
  for (let giro = 0; giro < 14; giro++) {
    for (const f in IONI) g[f] = gammaIone(f, I, K);
    const g0 = Math.pow(10, 0.1 * Math.min(I, 8)); // le specie neutre (e l'effetto dei sali sui gas: i gas sono meno solubili nell'acqua salata)
    for (const c of CATIONI) { Kc[c] = {}; for (const l of LEGANTI) { const zp = IONI[c][2] + IONI[l][2]; Kc[c][l] = (KA[c][l] * g[c] * g[l]) / (zp === 0 ? g0 : gammaCarica(zp, I, K)); } }
    aw = Math.max(0.5, 1 - 0.018 * (Na + Kk + Mg + Ca + Cl + S)); co2 = (K.henry.CO2 * pCO2) / g0;
    // a un pH dato: il carbonio sciolto (aperto all'aria), l'alcalinità e, se lo si cerca, il calcio
    const prova = (p) => {
      const aH = Math.pow(10, -p), hco3 = (K.K1 * co2 * g0 * aw) / (aH * g['HCO3-']), co3 = (K.K2 * hco3 * g['HCO3-']) / (aH * g['CO3(2-)']);
      let caLib = lib['Ca2+'], caTot = Ca;
      if (cercaCa) { caLib = (omegaCalcite * K.sali.calcite) / (g['Ca2+'] * g['CO3(2-)'] * co3); caTot = caLib * (1 + Kc['Ca2+']['SO4(2-)'] * lib['SO4(2-)'] + Kc['Ca2+']['CO3(2-)'] * co3 + Kc['Ca2+']['HCO3-'] * hco3); }
      let sH = 1, sC = 1; for (const c of CATIONI) { const m = c === 'Ca2+' ? caLib : lib[c]; sH += Kc[c]['HCO3-'] * m; sC += Kc[c]['CO3(2-)'] * m; }
      const h = aH / g['H+'], oh = (K.Kw * aw) / (aH * g['OH-']);
      return { hco3, co3, caLib, caTot, hT: hco3 * sH, cT: co3 * sC, h, oh, alk: hco3 * sH + 2 * co3 * sC + oh - h };
    };
    let lo = -2, hi = 15, r = null;
    for (let it = 0; it < 54; it++) { pH = 0.5 * (lo + hi); r = prova(pH); if (r.alk - E - 2 * r.caTot > 0) hi = pH; else lo = pH; }
    if (cercaCa) { Ca = r.caTot; lib['Ca2+'] = r.caLib; }
    lib['CO3(2-)'] = r.co3; lib['HCO3-'] = r.hco3; alk = r.alk; H = r.h; OH = r.oh; hco3T = r.hT; co3T = r.cT;
    // gli ioni liberi: ciascuno diviso tra sé e le sue coppie
    let sS = 1; for (const c of CATIONI) sS += Kc[c]['SO4(2-)'] * lib[c]; lib['SO4(2-)'] = S / sS;
    for (const c of CATIONI) { let s = 1; for (const l of LEGANTI) s += Kc[c][l] * lib[l]; const t = c === 'Ca2+' ? Ca : tot[TOT[c]] || 0; if (!(cercaCa && c === 'Ca2+')) lib[c] = 0.5 * (lib[c] + t / s); }
    I = 0.5 * (lib['Na+'] + lib['K+'] + Cl + lib['HCO3-'] + H + OH + 4 * (lib['Mg2+'] + lib['Ca2+'] + lib['SO4(2-)'] + lib['CO3(2-)'])) + 1e-9;
    for (const c of CATIONI) for (const l of LEGANTI) { const zp = IONI[c][2] + IONI[l][2]; if (zp) I += 0.5 * zp * zp * Kc[c][l] * lib[c] * lib[l]; }
  }
  const coppie = {}; for (const c of CATIONI) for (const l of LEGANTI) { const x = Kc[c][l] * lib[c] * lib[l]; if (x > 1e-12) coppie[`${c} ${l}`] = x; }
  const a = (f) => g[f] * (f === 'Cl-' ? Cl : lib[f]), Si = tot.Si || 0, sl = K.sali;
  const omega = { calcite: (a('Ca2+') * a('CO3(2-)')) / sl.calcite, gesso: (a('Ca2+') * a('SO4(2-)') * aw * aw) / sl.gesso, anidrite: (a('Ca2+') * a('SO4(2-)')) / sl.anidrite,
    salgemma: (a('Na+') * a('Cl-')) / sl.salgemma, silvite: (a('K+') * a('Cl-')) / sl.silvite, 'silice amorfa': Si / (sl['silice amorfa'] * aw * aw), quarzo: Si / (sl.quarzo * aw * aw) };
  return { T, pH, I, liberi: { ...lib, 'Cl-': Cl, 'H+': H, 'OH-': OH }, gamma: { ...g }, coppie, alcalinita: alk, carbonio: co2 + hco3T + co3T, CO2: co2, bicarbonato: hco3T, carbonato: co3T, Ca, eccesso: E, omega, attivitaAcqua: aw, pCO2 };
}
// i grammi di sale per kg di soluzione, dalle moli per kg d'acqua
const MASSE = { Na: 22.99, K: 39.098, Mg: 24.305, Ca: 40.078, Cl: 35.45, S: 96.06, Si: 96.11, Fe: 55.845 };
export function grammiPerKg(tot, eq = null) { let x = 0; for (const e in MASSE) x += (tot[e] || 0) * MASSE[e]; if (eq) x += eq.bicarbonato * 61.017 + eq.carbonato * 60.009; return x / (1 + x / 1000); }
// i gas sciolti (mol/kg): legge di Henry alla temperatura dell'acqua, meno solubili nell'acqua salata (Setschenow: ×10^(−0,1·I))
export function gasSciolti(gas = {}, pressionePa, T, I = 0) {
  const K = costanti(T), bar = pressionePa / 1e5, sale = Math.pow(10, -0.1 * Math.min(I, 8)), out = {};
  for (const f of ['CO2', 'O2', 'N2', 'H2S']) if (gas[f] > 0) out[f] = K.henry[f] * gas[f] * bar * sale;
  return out;
}
// le proprietà dell'acqua salata: densità (kg/m³; il massimo a 4 °C sparisce col sale: qui la parabola dell'acqua
// dolce più 0,78 per g/kg), viscosità (Pa·s, formula di Vogel, +0,2% per g/kg), punto di congelamento (la costante
// crioscopica viene dal calore di fusione di chimica.js: R·T²·M/ΔH = 1,86 K·kg/mol)
export const densita = (T, S = 0) => 999.84 - 0.0067 * (T - 277.13) ** 2 * (1 - Math.min(1, S / 40) * 0.5) + 0.78 * S - 0.0012 * S * (T - 273.15);
export const viscosita = (T, S = 0) => 2.414e-5 * Math.pow(10, 247.8 / (Math.max(T, 250) - 140)) * (1 + 0.002 * S);
const CRIOSCOPICA = (R_GAS * 273.15 ** 2 * 0.018015) / (1000 * (MOLECOLE['H2O(l)'].dH - MOLECOLE['H2O(s)'].dH));
export const congelamento = (moliPerKg) => 273.15 - CRIOSCOPICA * 0.92 * moliPerKg; // (0,92: il coefficiente osmotico dell'acqua di mare)
// la soglia di sovrasaturazione a cui un sale comincia a nascere da solo (teoria classica della nucleazione):
// J = A·exp(−f·16π·γ³·v²/(3·(kT)³·ln²Ω)); nasce quando J arriva a un germe per m³ al secondo. La curva è così ripida
// che la soglia quasi non dipende da quel «uno».
export function omegaCritica(sale, T, eterogenea = DATI.eterogenea) {
  const [gam, vm] = DATI.cristalli[sale], v = vm / NA, B = (eterogenea * 16 * Math.PI * gam ** 3 * v * v) / (3 * (KB * T) ** 3);
  return Math.exp(Math.sqrt(B / Math.log(DATI.prefattore)));
}
const tassoNascita = (sale, T, omega, eterogenea = DATI.eterogenea) => { if (!(omega > 1)) return 0; const [gam, vm] = DATI.cristalli[sale], v = vm / NA, B = (eterogenea * 16 * Math.PI * gam ** 3 * v * v) / (3 * (KB * T) ** 3); return DATI.prefattore * Math.exp(-B / Math.log(omega) ** 2); };
// il moto browniano di una sfera (Einstein 1905, Stokes): D = kT/(3π·μ·d); in un secondo si sposta, lungo un asse,
// di √(2D); la velocità istantanea dell'agitazione termica è √(3kT/m)
export function browniano(diametroM, T = 293.15, S = 0, densitaGrano = DATI.densitaGrani) {
  const D = (KB * T) / (3 * Math.PI * viscosita(T, S) * diametroM), m = (densitaGrano * Math.PI * diametroM ** 3) / 6;
  return { D, passo1s: Math.sqrt(2 * D), velocitaTermica: Math.sqrt((3 * KB * T) / m) };
}
// la velocità con cui un granello cade (o una bolla sale) nell'acqua ferma: Stokes, w = Δρ·g·d²/(18μ), finché il
// moto attorno al granello è lento; per i granelli grossi la resistenza cresce (correzione di Schiller-Naumann)
export function stokes(diametroM, densitaGrano, T = 288, S = 35, g = 9.81) {
  const rho = densita(T, S), mu = viscosita(T, S); let w = ((densitaGrano - rho) * g * diametroM ** 2) / (18 * mu);
  for (let i = 0; i < 6; i++) { const Re = (rho * Math.abs(w) * diametroM) / mu; w = ((densitaGrano - rho) * g * diametroM ** 2) / (18 * mu * (1 + 0.15 * Math.pow(Re, 0.687))); }
  return w;
}

// ---------- 2. LE ROCCE DEL PIANETA: che cosa c'è da sciogliere
// il mantello ha le proporzioni del Sole, la crosta ne è il fuso (gli stessi coefficienti di chimica.js §6)
const D_MANTELLO = { Si: 0.88, Mg: 5.4, Fe: 0.75, Al: 0.21, Ca: 0.24, Na: 0.05, K: 0.002 }, D_BASALTO = { Si: 0.63, Mg: 13, Fe: 4.6, Al: 1.08, Ca: 7.6, Na: 0.70, K: 0.01 };
const OSSIDI = { Si: 60.08, Mg: 40.30, Fe: 71.84, Al: 50.98, Ca: 56.08, Na: 30.99, K: 47.10 };
const fondi = (r, D, F) => Object.fromEntries(Object.entries(r).map(([e, v]) => [e, v / (D[e] + F * (1 - D[e]))]));
// velocità di dissoluzione a 25 °C (log₁₀ mol/m²/s), energia di attivazione (kJ/mol), massa molare (kg/mol)
export const MINERALI_ROCCIA = { albite: [-12.56, 69.8, 0.262], ortoclasio: [-12.41, 38.0, 0.278], anortite: [-9.12, 17.8, 0.278], pirosseno: [-11.11, 40.6, 0.217], olivina: [-10.64, 79.0, 0.141], quarzo: [-13.99, 87.7, 0.060] };
export function rocceDelPianeta(P) {
  const comp = P.composizione || {}, fe = comp.ferro ?? 0.32, sassi = comp.roccia ?? 1 - fe, sole = abbondanze(1), su = (e) => sole[e] / sole.Si;
  const mantello = { Si: 1, Mg: comp.MgSi ?? su('Mg'), Fe: (0.15 * su('Fe') * (fe / (fe + sassi))) / 0.33, Al: su('Al'), Ca: su('Ca'), Na: 0.25 * su('Na'), K: 0.25 * su('K') };
  const basalto = fondi(mantello, D_MANTELLO, DATI.fusione), granito = fondi(basalto, D_BASALTO, 0.2);
  const perKg = (r) => { let m = 0; for (const e in r) m += r[e] * OSSIDI[e]; const o = {}; for (const e in r) o[e] = (1000 * r[e]) / m; return o; };
  // i minerali che ospitano ogni elemento (la norma, come in chimica.js): potassio e sodio nei feldspati con
  // l'alluminio, il calcio nell'anortite finché c'è alluminio e poi nel pirosseno, il magnesio nel pirosseno o,
  // se la silice non basta, nell'olivina
  const ospiti = (r) => { const or = Math.min(r.K, r.Al), ab = Math.min(r.Na, r.Al - or), an = Math.min(r.Ca, (r.Al - or - ab) / 2), M = r.Mg + r.Fe, Si = r.Si - 3 * or - 3 * ab - 2 * an - (r.Ca - an);
    return { anortite: r.Ca > 0 ? an / r.Ca : 0, olivina: Si >= M ? 0 : Math.min(1, (2 * Math.min(M - Si, Math.max(Si, 0))) / M) }; };
  const mk = perKg(mantello);
  return { mantello: { ...mk, Cl: su('Cl') * mk.Si * DATI.rimasto.Cl, S: su('S') * mk.Si * DATI.rimasto.S }, basalto: { ...perKg(basalto), ospiti: ospiti(basalto) }, granito: { ...perKg(granito), ospiti: ospiti(granito) } };
}
// quanta parte di un minerale si scioglie nel tempo che resta nel suolo, alla temperatura T
const sciolto = (minerale, T, anni) => { const [lk, Ea, M] = MINERALI_ROCCIA[minerale], k = Math.pow(10, lk) * Math.exp(((-1000 * Ea) / R_GAS) * (1 / T - 1 / 298.15)) * DATI.campo * DATI.superficieGrani * M; return 1 - Math.exp(-k * anni * ANNO); };
// ciò che un kg di roccia consumata dà all'acqua (mol), a T; e quanta della sua massa diventa argilla
export function rilascio(roccia, T) {
  const t = DATI.suolo / DATI.denudazione, o = roccia.ospiti, f = (m) => (T > 271 ? sciolto(m, T, t) : 0);
  const Na = roccia.Na * f('albite'), K = roccia.K * f('ortoclasio'), Ca = roccia.Ca * (o.anortite * f('anortite') + (1 - o.anortite) * f('pirosseno'));
  const Mg = roccia.Mg * (o.olivina * f('olivina') + (1 - o.olivina) * f('pirosseno'));
  const Si = 2 * Na + 2 * K + 0.5 * Mg; // la silice che i feldspati cedono diventando argilla (2 su 3), e metà di quella dei pirosseni
  const alterato = Math.min(1, (roccia.Na * f('albite') * 0.262 + roccia.K * f('ortoclasio') * 0.278 + roccia.Ca * o.anortite * f('anortite') * 0.278 + (roccia.Mg + roccia.Fe) * f('pirosseno') * 0.1));
  return { Na, K, Ca, Mg, Si, argilla: alterato };
}

// ---------- 3. IL BILANCIO DEI SALI: ciò che entra e ciò che esce, per l'età del pianeta
// → { ioni (mol/kg), eq (l'equilibrio in soluzione), bilancio: { entra, esce, residenza }, fiume, ... }
export function bilancioSali({ P, rocce, massaMare, areaMare, fiumi, apporto, argilla, sedimento, evaporaBassi, pCO2, O2, Tmare, placche = true }) {
  const int = P.interno || {}, q = int.q ?? 0, eta = int.eta ?? 4.5e9, R = P.raggioM, areaPianeta = 4 * Math.PI * R * R;
  // i vulcani: il magma di oggi (kg/anno) e, con lui, il mantello che passa per la fusione
  const magma = (DATI.magma * q * areaPianeta * ANNO) / DATI.caloreMagma, fuso = magma / DATI.fusione, massaMantello = P.massaKg * (1 - (P.composizione?.ferro ?? 0.32));
  // il fondo: l'acqua che attraversa la roccia calda e quella tiepida (kg/anno), dal calore che esce dal fondo
  const vivo = q > 0.02 ? (placche ? 1 : 0.2) : 0, Pfondo = (P.clima?.pressione || 0) + 1000 * gravita(P) * 2500;
  const Tcamino = Math.min(DATI.critico, ebollizione(Pfondo)), Tfondo = Math.max(271, Math.min(Tmare, 277));
  const caldo = (vivo * DATI.caldo * q * areaMare * ANNO) / (4000 * Math.max(50, Tcamino - Tfondo)), tiepido = (vivo * DATI.tiepido * q * areaMare * ANNO) / (4000 * DATI.salto);
  const M = massaMare, kNeutro = ((sedimento / DATI.densitaRoccia) * (DATI.porosita / (1 - DATI.porosita)) * 1000 + DATI.chiusi * evaporaBassi) / M, kTorna = 1 / DATI.riciclo;
  const esceK = { Na: (caldo * DATI.sodioCaldo) / M, K: (tiepido * DATI.potassioTiepido) / M, Mg: (caldo + tiepido * DATI.magnesioTiepido) / M, Cl: 0, S: (caldo * DATI.solfatoCaldo) / M };
  const entraFisso = { Na: apporto.Na, K: apporto.K + caldo * rocce.basalto.K * DATI.potassioCaldo, Mg: apporto.Mg, Cl: 0, S: 0 };
  // lo zolfo dei vulcani arriva al mare come solfato: tutto se l'aria ha ossigeno; altrimenti l'anidride solforosa si
  // spezza in acqua (3SO2 + 2H2O → 2H2SO4 + S): due terzi solfato, un terzo zolfo che si deposita
  const solfato = O2 > 1e-6 ? 1 : 2 / 3;
  const mare = { Na: 0, K: 0, Mg: 0, Cl: 0, S: 0 }, sed = { Na: 0, K: 0, Mg: 0, Cl: 0, S: 0 }, mant = { Cl: rocce.mantello.Cl * massaMantello, S: rocce.mantello.S * massaMantello };
  const passi = 320, dt = eta / passi, scambio = { 'Na+': 0, 'K+': 0, 'Mg2+': 0, 'Ca2+': 0 }, oggi = { vulcani: { Cl: 0, S: 0 }, torna: {}, scambio };
  let Ca = 0.01;
  // le argille che arrivano al mare cariche degli ioni del fiume (quasi tutto calcio) li scambiano con quelli del mare
  const sulleArgille = (c) => { let s = 0; const x = {}; for (const f in DATI.preferenze) { x[f] = DATI.preferenze[f] * Math.abs(IONI[f][2]) * (c[TOT[f]] || 0); s += x[f]; } for (const f in x) x[f] = s > 0 ? x[f] / s : 0; return x; };
  const xFiume = sulleArgille(fiumi > 0 ? { Na: apporto.Na / fiumi, K: apporto.K / fiumi, Mg: apporto.Mg / fiumi, Ca: apporto.Ca / fiumi } : {});
  for (let n = 0; n < passi; n++) {
    const t = (n + 0.5) * dt, piuCaldo = Math.exp((eta - t) / 3e9); // il calore interno calava come in geologia.js: da giovane i vulcani davano di più
    const xMare = sulleArgille({ Na: mare.Na / M, K: mare.K / M, Mg: mare.Mg / M, Ca });
    for (const f in scambio) scambio[f] = (argilla * DATI.cec * (xMare[f] - xFiume[f])) / Math.abs(IONI[f][2]); // (mol/anno: positivo = il mare lo perde)
    for (const e of ['Cl', 'S']) { const esce = mant[e] * (1 - Math.exp((-DATI.sfiato[e] * fuso * piuCaldo * dt) / massaMantello)); mant[e] -= esce; oggi.vulcani[e] = (esce / dt) * (e === 'S' ? solfato : 1); }
    for (const e in mare) {
      const sc = e === 'Na' ? scambio['Na+'] : e === 'K' ? scambio['K+'] : e === 'Mg' ? scambio['Mg2+'] : 0, torna = kTorna * sed[e];
      const entra = entraFisso[e] + (oggi.vulcani[e] || 0) + torna - Math.min(sc, mare[e] / dt), nuovo = Math.max(0, (mare[e] + dt * entra) / (1 + dt * (esceK[e] + kNeutro)));
      sed[e] = (sed[e] + dt * kNeutro * nuovo) / (1 + dt * kTorna); mare[e] = nuovo; oggi.torna[e] = torna;
    }
    // il calcio (ogni tanto: costa un equilibrio): quello che tiene il calcare alla soglia
    if (n % 40 === 39) Ca = acqua({ Na: mare.Na / M, K: mare.K / M, Mg: mare.Mg / M, Cl: mare.Cl / M, S: mare.S / M }, Tmare, { pCO2, omegaCalcite: omegaCritica('calcite', Tmare) }).Ca;
  }
  const ioni = { Na: mare.Na / M, K: mare.K / M, Mg: mare.Mg / M, Cl: mare.Cl / M, S: mare.S / M }, soglia = omegaCritica('calcite', Tmare);
  // se i sali forti superano la solubilità del salgemma o del gesso (poca acqua): il resto sta sul fondo, come sale
  let fondoDiSale = null;
  { const e0 = acqua({ ...ioni, Ca: 0.001 }, Tmare, { pCO2 }); if (e0.omega.salgemma > 1) { const x = toglieSale(ioni.Na, ioni.Cl, costanti(Tmare).sali.salgemma / (e0.gamma['Na+'] * e0.gamma['Cl-'])); ioni.Na -= x; ioni.Cl -= x; fondoDiSale = { salgemma: x * M }; } }
  const eq = acqua(ioni, Tmare, { pCO2, omegaCalcite: soglia }); ioni.Ca = eq.Ca;
  // la silice: nessuno la toglie (niente vita); sale fino alla solubilità della silice amorfa. Il ferro: con
  // l'ossigeno arrugginisce e cade; senza, resta sciolto fin dove la siderite lo permette (Ksp 10⁻¹⁰·⁹, dato misurato)
  ioni.Si = Math.min(costanti(Tmare).sali['silice amorfa'], (apporto.Si * Math.min(eta, 1e7)) / M);
  ioni.Fe = O2 > 1e-6 ? 1e-9 : Math.min(1e-3, Math.pow(10, -10.89) / Math.max(1e-12, eq.gamma['Fe2+'] * eq.gamma['CO3(2-)'] * eq.liberi['CO3(2-)']));
  // il bilancio di oggi (mol/anno) e i tempi di residenza (anni): quanto c'è, diviso quanto entra
  const entra = {}, esce = {}, residenza = {};
  for (const e of ['Na', 'K', 'Mg', 'Cl', 'S']) {
    const sc = e === 'Na' ? scambio['Na+'] : e === 'K' ? scambio['K+'] : e === 'Mg' ? scambio['Mg2+'] : 0;
    entra[e] = { fiumi: (apporto[e] || 0) + (oggi.torna[e] || 0), vulcani: oggi.vulcani[e] || 0, fondo: e === 'K' ? caldo * rocce.basalto.K * DATI.potassioCaldo : 0 };
    esce[e] = { fondo: esceK[e] * mare[e], argille: Math.max(0, sc), sepolto: kNeutro * mare[e] };
    const tot = entra[e].fiumi + entra[e].vulcani + entra[e].fondo; residenza[e] = tot > 0 ? mare[e] / tot : Infinity;
  }
  // il calcare deposto sui bassi fondali torna in gioco quando è risollevato: i fiumi lo risciolgono (sulla Terra due terzi del loro calcio)
  const caNuovo = apporto.Ca + caldo * ioni.Mg + Math.max(0, -scambio['Ca2+']), caEntra = caNuovo / (1 - DATI.calcareCheTorna), caTorna = caEntra - caNuovo;
  entra.Ca = { fiumi: apporto.Ca + caTorna, vulcani: 0, fondo: caldo * ioni.Mg + Math.max(0, -scambio['Ca2+']) }; esce.Ca = { calcare: caEntra }; residenza.Ca = caEntra > 0 ? (ioni.Ca * M) / caEntra : Infinity;
  // l'acqua media dei fiumi (mol/kg): ciò che le rocce cedono, più i sali vecchi che tornano; le cariche le chiude il bicarbonato
  const fiume = {}; if (fiumi > 0) { for (const e of ['Na', 'K', 'Mg', 'Ca', 'Si']) fiume[e] = (apporto[e] + (oggi.torna[e] || 0) + (e === 'Ca' ? caTorna : 0)) / fiumi; fiume.Cl = (oggi.torna.Cl + oggi.vulcani.Cl) / fiumi; fiume.S = (oggi.torna.S + oggi.vulcani.S) / fiumi; }
  return { ioni, eq, soglia, bilancio: { entra, esce, residenza }, fiume, fondoDiSale, flussi: { magma, caldo, tiepido, Tcamino, kNeutro, evaporaBassi, sedimento, sedimenti: sed, mantello: mant }, vivo };
}
// quanto sale esce perché il prodotto (a − x)(b − x) torni alla solubilità
const toglieSale = (a, b, Ks) => { const s = a + b, d = s * s - 4 * (a * b - Ks); return d > 0 ? Math.max(0, Math.min(a, b, 0.5 * (s - Math.sqrt(d)))) : 0; };
const gravita = (P) => (COSTANTI.G * P.massaKg) / (P.raggioM * P.raggioM);
// a che temperatura bolle l'acqua a una pressione (K): dalla stessa tabella (H2O liquida ⇌ vapore: K = p)
export function ebollizione(pressionePa) { const dH = 1000 * (MOLECOLE.H2O.dH - MOLECOLE['H2O(l)'].dH), dS = MOLECOLE.H2O.S - MOLECOLE['H2O(l)'].S; return dH / (dS - R_GAS * Math.log(Math.max(pressionePa, 1) / 1e5)); }

// L'ACQUA CHE EVAPORA IN UNA CONCA CHIUSA: i sali si concentrano e uno dopo l'altro superano la solubilità. Prima il
// calcare, finché finisce il calcio o l'alcalinità (lo «spartiacque chimico» di Hardie ed Eugster 1970: da lì il lago
// prende una strada o l'altra, di soda o di cloruri); poi il gesso; poi il salgemma. → { ioni, eq, precipitati (mol per
// kg d'acqua), salinita }
export function evapora(ioniIniziali, fattore, T, pCO2) {
  const c = {}; for (const e of ['Na', 'K', 'Mg', 'Ca', 'Cl', 'S', 'Si']) c[e] = (ioniIniziali[e] || 0) * fattore;
  const prec = { calcite: 0, gesso: 0, salgemma: 0, silice: 0 }, K = costanti(T), soglia = omegaCritica('calcite', T);
  { const x = Math.max(0, c.Si - K.sali['silice amorfa']); c.Si -= x; prec.silice = x; }
  let eq = acqua(c, T, { pCO2 });
  if (eq.omega.calcite > soglia) { // il calcio in più se ne va col carbonato: resta quello che l'equilibrio regge
    const alk = c.Na + c.K + 2 * c.Mg + 2 * c.Ca - c.Cl - 2 * c.S, x = Math.max(0, Math.min(c.Ca, alk / 2)), dopo = acqua({ ...c, Ca: undefined }, T, { pCO2, omegaCalcite: soglia });
    const resta = Math.min(c.Ca, Math.max(dopo.Ca, c.Ca - x)); prec.calcite = c.Ca - resta; c.Ca = resta; eq = acqua(c, T, { pCO2 });
  }
  for (let giro = 0; giro < 3; giro++) {
    if (eq.omega.gesso > 1) { const fr = (eq.liberi['Ca2+'] / Math.max(c.Ca, 1e-30)) * (eq.liberi['SO4(2-)'] / Math.max(c.S, 1e-30)), x = toglieSale(c.Ca, c.S, K.sali.gesso / (eq.gamma['Ca2+'] * eq.gamma['SO4(2-)'] * eq.attivitaAcqua ** 2 * fr)); c.Ca -= x; c.S -= x; prec.gesso += x; }
    if (eq.omega.salgemma > 1) { const fr = eq.liberi['Na+'] / Math.max(c.Na, 1e-30), x = toglieSale(c.Na, c.Cl, K.sali.salgemma / (eq.gamma['Na+'] * eq.gamma['Cl-'] * fr)); c.Na -= x; c.Cl -= x; prec.salgemma += x; }
    eq = acqua(c, T, { pCO2 });
  }
  return { ioni: c, eq, precipitati: prec, salinita: grammiPerKg(c, eq) };
}

// ---------- 4. IL MARE DEL PIANETA
const bil = (arr, W, H, x, y) => { const yy = limita(y, 0, H - 1.001), x0 = Math.floor(x), y0 = Math.floor(yy), u = x - x0, v = yy - y0, a = (i, j) => arr[j * W + (((i % W) + W) % W)];
  return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
const niente = (motivo, extra = {}) => ({ esiste: false, motivo, storia: motivo, W: 0, H: 0, salinitaMedia: 0, ioni: {}, pH: null, gas: {}, laghi: [], sorgentiCalde: [], foci: [], bilancio: null, ...extra });
// una coda per quota (come in geologia.js), per trovare le conche chiuse
function conche(alt, W, H, livello) {
  const N = W * H, pieno = new Float32Array(N), visto = new Uint8Array(N), hk = new Int32Array(N), hv = new Float32Array(N); let hn = 0;
  const push = (k, v) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (hv[p] <= v) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
  const pop = () => { const k = hk[0], lk = hk[--hn], lv = hv[hn]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && hv[c + 1] < hv[c]) c++; if (hv[c] >= lv) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = lk; hv[i] = lv; return k; };
  let fonti = 0; for (let k = 0; k < N; k++) if (alt[k] < livello) { push(k, alt[k]); visto[k] = 1; pieno[k] = alt[k]; fonti++; }
  if (!fonti) { let m = 0; for (let k = 1; k < N; k++) if (alt[k] < alt[m]) m = k; push(m, alt[m]); visto[m] = 1; pieno[m] = alt[m]; }
  while (hn) { const c = pop(), i = c % W, j = (c - i) / W;
    for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue; for (let di = -1; di <= 1; di++) { const q = jj * W + ((i + di + W) % W); if (visto[q]) continue; visto[q] = 1; pieno[q] = Math.max(alt[q], pieno[c]); push(q, pieno[q]); } } }
  return pieno;
}

export function mare(P, sf, cl, se = null, caso = null) {
  const c0 = typeof caso === 'function' ? caso : sorgente(typeof caso === 'string' ? caso : 'mare'), s = se || sf;
  if (!s || !s.alt) return niente('manca la superficie del pianeta');
  const FW = s.W, FH = s.H, FN = FW * FH, livello = s.mare, R = P.raggioM, g = gravita(P);
  if (P.tipo === 'gassoso') return niente('un gigante gassoso non ha una superficie su cui l\'acqua possa raccogliersi');
  let celleMare = 0; if (isFinite(livello)) for (let k = 0; k < FN; k++) if (s.alt[k] < livello) celleMare++;
  let celleLago = 0; if (s.lago) for (let k = 0; k < FN; k++) if (s.lago[k] > 0 && !(s.alt[k] < livello)) celleLago++;
  if (!celleMare && !celleLago) return niente(String(P.clima?.acqua ?? '').startsWith('vapore') ? 'niente mare: qui l\'acqua bolle, sta nell\'aria come vapore (o è già fuggita nello spazio)' : 'niente mare: il pianeta non ha acqua in superficie');
  if (!cl || !cl.media) return niente('manca il clima del pianeta');
  { let tMax = 0; for (let k = 0; k < cl.media.length; k++) tMax = Math.max(tMax, cl.media[k]); const pAria = P.clima?.pressione ?? 0;
    if (tMax < 263) return niente('niente mare liquido in superficie: l\'acqua c\'è, ma è tutta ghiaccio (sotto, se l\'interno è caldo, può esserci un oceano chiuso)', { stato: 'ghiaccio' });
    if (isFinite(pAria) && pAria < 611) return niente('niente mare: sotto 611 Pa l\'acqua liquida non può esistere, il ghiaccio passa direttamente a vapore'); }
  // --- le griglie: quella fine della superficie (FW×FH) e quella del mare (W×H, il doppio di quella del clima se si può)
  const W = FW % (2 * cl.W) === 0 ? 2 * cl.W : FW % cl.W === 0 ? cl.W : FW, kx = FW / W, H = FH / kx, N = W * H, m = cl.meteo && cl.meteo.regime === 'aria' ? cl.meteo : null;
  const dl = (2 * Math.PI) / W, df = Math.PI / H, lat = (j) => Math.PI / 2 - (j + 0.5) * df, cosJ = Float64Array.from({ length: H }, (_, j) => Math.cos(lat(j))), area = (j) => R * R * dl * df * cosJ[j];
  const areaF = (jf) => (R * R * dl * df * Math.cos(Math.PI / 2 - ((jf + 0.5) / FH) * Math.PI)) / (kx * kx);
  const tipo = new Uint8Array(FN), fondoF = new Float32Array(FN), bagnato = new Float32Array(N), fondo = new Float32Array(N);
  let massaMare = 0, areaMare = 0;
  for (let jf = 0; jf < FH; jf++) for (let i = 0; i < FW; i++) { const k = jf * FW + i, h = s.alt[k];
    if (h < livello) { tipo[k] = 1; fondoF[k] = livello - h; const q = Math.floor(jf / kx) * W + Math.floor(i / kx); bagnato[q] += 1 / (kx * kx); fondo[q] += fondoF[k]; massaMare += 1000 * fondoF[k] * areaF(jf); areaMare += areaF(jf); }
    else if (s.lago && s.lago[k] > 0) { tipo[k] = 2; fondoF[k] = s.lago[k]; } }
  for (let k = 0; k < N; k++) if (bagnato[k] > 0) fondo[k] /= bagnato[k] * kx * kx;
  // --- il clima e il tempo, portati sulla griglia del mare
  const suGriglia = (x) => { const o = new Float32Array(N); if (!x) return o; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) o[j * W + i] = bil(x, cl.W, cl.H, ((i + 0.5) / W) * cl.W - 0.5, ((j + 0.5) / H) * cl.H - 0.5); return o; };
  const Tclima = suGriglia(cl.media), ghiaccio = suGriglia(cl.freddo), vu = suGriglia(m?.u), vv = suGriglia(m?.v), evap = suGriglia(m?.evaporazione), piove = suGriglia(m?.pioggia), umid = suGriglia(m?.umidita);
  // --- l'aria: quanta anidride carbonica e quanto ossigeno premono sull'acqua
  let aria = P.atmosfera; if (!aria || !aria.gas) { try { aria = atmosfera(P); } catch { aria = { gas: {} }; } }
  const pAria = isFinite(P.clima?.pressione) ? P.clima.pressione : aria.pressione || 1e5, pCO2 = Math.max(1e-12, ((aria.gas.CO2 || 0) * pAria) / 1e5), pO2 = ((aria.gas.O2 || 0) * pAria) / 1e5;
  // --- le terre: quanta roccia si consuma, e che cosa cede (sulla griglia del clima)
  const rocce = rocceDelPianeta(P), apporto = { Na: 0, K: 0, Ca: 0, Mg: 0, Si: 0 }, kc = FW / cl.W; let argilla = 0, sedimento = 0, fiumi = 0, areaTerra = 0, sabbia = 0;
  for (let j = 0; j < cl.H; j++) for (let i = 0; i < cl.W; i++) { const k = j * cl.W + i; let terra = 0, cont = 0;
    for (let b = 0; b < kc; b++) for (let a = 0; a < kc; a++) { const q = (j * kc + b) * FW + i * kc + a; if (tipo[q] === 0) { terra++; if (s.cont && s.cont[q]) cont++; } }
    if (!terra) continue; const A = (R * R * ((2 * Math.PI) / cl.W) * (Math.PI / cl.H) * Math.sin(((j + 0.5) / cl.H) * Math.PI) * terra) / (kc * kc), T = cl.media[k]; areaTerra += A;
    const bagna = (m ? Math.min(1, m.pioggia[k] / 500) : cl.piove === false ? 0 : limita((T - 255) / 40, 0, 1)) * (1 - cl.freddo[k]), massa = DATI.denudazione * DATI.densitaRoccia * A * bagna, fc = cont / terra;
    const rg = rilascio(rocce.granito, T), rb = rilascio(rocce.basalto, T);
    for (const e in apporto) apporto[e] += massa * (fc * rg[e] + (1 - fc) * rb[e]);
    argilla += massa * (fc * rg.argilla + (1 - fc) * rb.argilla); sabbia += massa * fc * (1 - rg.argilla); sedimento += massa; fiumi += A * (m ? m.deflusso[k] : 300 * bagna); }
  // --- l'acqua che evapora sui bassi fondali (kg/anno) e la temperatura media del mare
  let evaporaBassi = 0, Tmare = 0, aT = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (!(bagnato[k] > 0)) continue; const A = area(j) * bagnato[k]; Tmare += Math.max(271, Tclima[k]) * A; aT += A; if (fondo[k] < 200 && evap[k] > piove[k]) evaporaBassi += (evap[k] - piove[k]) * A; }
  Tmare = aT > 0 ? Tmare / aT : 280;
  // (senza mare ma con laghi: il bilancio si fa lo stesso per avere l'acqua dei fiumi)
  const bs = bilancioSali({ P, rocce, massaMare: Math.max(massaMare, 1), areaMare, fiumi, apporto, argilla, sedimento, evaporaBassi, pCO2, O2: pO2, Tmare, placche: P.interno?.tettonica ? P.interno.tettonica === 'a placche' : (s.placche || 0) > 1 });
  const ioni = bs.ioni, eq = bs.eq, salinitaMedia = celleMare ? grammiPerKg(ioni, eq) : 0, moli = ioni.Na + ioni.K + ioni.Mg + ioni.Ca + ioni.Cl + ioni.S + eq.bicarbonato;
  const out = { esiste: true, W, H, raggioM: R, gravita: g, livello, massaMare, areaMare, frazioneMare: areaMare / (4 * Math.PI * R * R), profonditaMedia: areaMare > 0 ? massaMare / 1000 / areaMare : 0,
    salinitaMedia, ioni: nomiIoni(ioni, eq), totali: { ...ioni }, pH: eq.pH, alcalinita: eq.alcalinita, carbonio: eq.carbonio, soglia: bs.soglia, pCO2, pO2, pressioneAria: pAria, aria: { ...aria.gas },
    gas: gasSciolti(aria.gas, pAria, Tmare, eq.I), Tmedia: Tmare, congela: congelamento(moli), bilancio: bs.bilancio, fiume: bs.fiume, fondoDiSale: bs.fondoDiSale, flussi: bs.flussi,
    fine: { W: FW, H: FH, tipo, fondo: fondoF, lago: new Int16Array(FN).fill(-1) }, bagnato, fondo, ghiaccio, vento: { u: vu, v: vv }, radice: c0.radice };
  // l'acqua dei fiumi in equilibrio con l'aria
  { const f = bs.fiume, ef = acqua({ ...f, Ca: f.Ca || 0 }, Math.max(274, cl.Tglobale || 285), { pCO2 }); out.fiume = { ...f, pH: ef.pH, salinita: grammiPerKg(f, ef), portataKgAnno: fiumi, sedimentoKgAnno: sedimento, argillaKgAnno: argilla, sabbiaKgAnno: sabbia }; }
  //§§CAMPI§§
  return out;
}
// le moli per kg, con i nomi degli ioni (il carbonio sciolto è quasi tutto bicarbonato)
const nomiIoni = (t, eq) => ({ 'Na+': t.Na || 0, 'K+': t.K || 0, 'Mg2+': t.Mg || 0, 'Ca2+': t.Ca || 0, 'Cl-': t.Cl || 0, 'SO4(2-)': t.S || 0, 'HCO3-': eq ? eq.bicarbonato : 0, 'CO3(2-)': eq ? eq.carbonato : 0, 'Fe2+': t.Fe || 0, H4SiO4: t.Si || 0 });
// LA REGOLA PER IL PUNTO: il mare è ben rimescolato rispetto ai tempi di residenza, quindi gli ioni maggiori hanno
// ovunque le stesse proporzioni (lo si misura dal 1819, Marcet): in un punto di salinità S ci sono gli ioni medi
// moltiplicati per S / S media. Il carbonio, il pH e le saturazioni no: dipendono dalla temperatura (acqua()).
export function ioniNelPunto(stato, salinita) { const f = stato.salinitaMedia > 0 ? salinita / stato.salinitaMedia : 1, o = {}; for (const e in stato.totali) o[e] = stato.totali[e] * f; return o; }
//§§CONTINUA§§
