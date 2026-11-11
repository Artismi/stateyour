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
import { MOLECOLE, abbondanze, atmosfera, pressioneVapore } from './chimica.js';
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
  pennacchio: 5, // (m) lo spessore dello strato d'acqua dolce che un fiume stende sul mare
  bolle: 1e9, profonditaBolle: 1, // bolle per m³ sotto una cresta che frange (per unità di copertura; Medwin e Breitz 1989); fin dove scendono (m)
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
const gammaIone = (f, I0, K) => { const x = IONI[f], I = Math.min(I0, 8), r = Math.sqrt(I); return Math.pow(10, (-K.A * x[2] * x[2] * r) / (1 + x[3] * K.B * r) + x[4] * I); };
const gammaCarica = (z, I0, K) => { const r = Math.sqrt(Math.min(I0, 8)); return Math.pow(10, (-K.A * z * z * r) / (1 + 4.5 * K.B * r)); };
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
  for (let giro = 0; giro < 9; giro++) {
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
    for (let it = 0; it < 38; it++) { pH = 0.5 * (lo + hi); r = prova(pH); if (r.alk - E - 2 * r.caTot > 0) hi = pH; else lo = pH; }
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
// le proprietà dell'acqua salata: densità (kg/m³: la parabola dell'acqua dolce attorno al suo massimo a 4 °C, più 0,78
// per g/kg; col sale il massimo scende di 0,215 K per g/kg, e nell'acqua di mare sparisce sotto il punto di gelo), viscosità (Pa·s, formula di Vogel, +0,2% per g/kg), punto di congelamento (la costante
// crioscopica viene dal calore di fusione di chimica.js: R·T²·M/ΔH = 1,86 K·kg/mol)
export const densita = (T, S = 0) => 999.84 + 0.78 * S - 0.0067 * (T - 277.13 + 0.215 * Math.min(S, 40)) ** 2;
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
  const prec = { calcite: 0, magnesite: 0, gesso: 0, salgemma: 0, silice: 0, amari: 0 }, K = costanti(T), soglia = omegaCritica('calcite', T);
  { const x = Math.max(0, c.Si - K.sali['silice amorfa']); c.Si -= x; prec.silice = x; }
  let eq = acqua(c, T, { pCO2 });
  if (eq.omega.calcite > soglia) { // il calcio in più se ne va col carbonato: resta quello che l'equilibrio regge
    const alk = c.Na + c.K + 2 * c.Mg + 2 * c.Ca - c.Cl - 2 * c.S, x = Math.max(0, Math.min(c.Ca, alk / 2)), dopo = acqua({ ...c, Ca: undefined }, T, { pCO2, omegaCalcite: soglia });
    const resta = Math.min(c.Ca, Math.max(dopo.Ca, c.Ca - x)); prec.calcite = c.Ca - resta; c.Ca = resta; eq = acqua(c, T, { pCO2 });
  }
  // se dopo il calcio resta alcalinità, la prende il magnesio (carbonato di magnesio idrato, Ksp 10⁻⁵·² misurato): finito
  // anche lui, il lago è di soda; se invece finisce prima l'alcalinità, resta una salamoia neutra di cloruri e solfati
  if (eq.gamma['Mg2+'] * eq.liberi['Mg2+'] * eq.gamma['CO3(2-)'] * eq.liberi['CO3(2-)'] > 6.3e-6) { const alk = c.Na + c.K + 2 * c.Mg + 2 * c.Ca - c.Cl - 2 * c.S, x = 0.97 * Math.max(0, Math.min(c.Mg, alk / 2)); c.Mg -= x; prec.magnesite = x; eq = acqua(c, T, { pCO2 }); }
  for (let giro = 0; giro < 3; giro++) {
    if (eq.omega.gesso > 1) { const fr = (eq.liberi['Ca2+'] / Math.max(c.Ca, 1e-30)) * (eq.liberi['SO4(2-)'] / Math.max(c.S, 1e-30)), x = toglieSale(c.Ca, c.S, K.sali.gesso / (eq.gamma['Ca2+'] * eq.gamma['SO4(2-)'] * eq.attivitaAcqua ** 2 * fr)); c.Ca -= x; c.S -= x; prec.gesso += x; }
    if (eq.omega.salgemma > 1) { const fr = eq.liberi['Na+'] / Math.max(c.Na, 1e-30), x = toglieSale(c.Na, c.Cl, K.sali.salgemma / (eq.gamma['Na+'] * eq.gamma['Cl-'] * fr)); c.Na -= x; c.Cl -= x; prec.salgemma += x; }
    eq = acqua(c, T, { pCO2 });
  }
  // oltre una decina di moli per kg nemmeno i sali più solubili (di magnesio, di potassio, la soda) restano sciolti: il di più cristallizza
  { const tot = c.Na + c.K + c.Mg + c.Ca + c.Cl + c.S; if (tot > 11) { const f = 11 / tot; for (const e of ['Na', 'K', 'Mg', 'Ca', 'Cl', 'S']) { prec.amari += c[e] * (1 - f); c[e] *= f; } eq = acqua(c, T, { pCO2 }); } }
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
  // --- LE FOCI: dove i fiumi di erosione() entrano in mare, con la loro acqua e il loro fango (in proporzione alla portata)
  const lonDi = (i, w) => ((i + 0.5) / w) * 360 - 180, latDi = (j, h) => 90 - ((j + 0.5) / h) * 180, foci = [], dolce = new Float64Array(N), fango = new Float64Array(N);
  let sommaFoci = 0; if (s.flusso) for (let k = 0; k < FN; k++) if (tipo[k] === 1 && s.flusso[k] > 2) sommaFoci += s.flusso[k];
  const kPortata = sommaFoci > 0 ? fiumi / sommaFoci : fiumi > 0 && areaTerra > 0 ? (fiumi / areaTerra) * areaF(FH >> 1) : 0, parteFine = sedimento > 0 ? argilla / sedimento : 0.3;
  if (sommaFoci > 0) for (let k = 0; k < FN; k++) if (tipo[k] === 1 && s.flusso[k] > 2) { const i = k % FW, j = (k - i) / FW, parte = s.flusso[k] / sommaFoci, q = Math.floor(j / kx) * W + Math.floor(i / kx);
    dolce[q] += (parte * fiumi) / 1000 / ANNO; fango[q] += (parte * argilla) / ANNO; // (m³/s d'acqua; kg/s d'argilla)
    foci.push({ lon: lonDi(i, FW), lat: latDi(j, FH), portata: (parte * fiumi) / 1000 / ANNO, sedimento: (parte * sedimento) / ANNO, argilla: parteFine }); }
  foci.sort((a, b) => b.portata - a.portata); out.foci = foci.slice(0, 400);
  // --- LE CORRENTI (correnti(), più sotto) e i campi che portano
  const rhoAria = pAria / ((m?.aria?.R ?? 287) * Tmare), tx = new Float64Array(N), ty = new Float64Array(N);
  for (let k = 0; k < N; k++) { const v = Math.hypot(vu[k], vv[k]); tx[k] = rhoAria * DATI.cd * v * vu[k]; ty[k] = rhoAria * DATI.cd * v * vv[k]; }
  let tMin = Infinity, tMax = -Infinity; for (let k = 0; k < N; k++) if (bagnato[k] >= 0.5) { tMin = Math.min(tMin, Math.max(out.congela, Tclima[k])); tMax = Math.max(tMax, Tclima[k]); }
  if (!isFinite(tMin)) { tMin = tMax = Tmare; }
  const co = correnti({ W, H, R, omega: (2 * Math.PI) / (P.giorno || 86400), bagnato, fondo, tx, ty, g, salto: Math.max(0.2, densita(tMin, salinitaMedia) - densita(tMax, salinitaMedia)), areaMare });
  const righe = { A: Float64Array.from({ length: H }, (_, j) => area(j)), dx: Float64Array.from({ length: H }, (_, j) => R * dl * cosJ[j]), dxS: Float64Array.from({ length: H }, (_, j) => R * dl * Math.max(0, Math.cos(lat(j) - df / 2))), dy: R * df };
  const h = DATI.strato, wMescola = DATI.mescola / co.termoclino, lambda = m?.scambio > 0 ? m.scambio : 4 * COSTANTI.sigma * Tmare ** 3, tauT = (1025 * 4000 * h) / lambda;
  const sorg = new Float64Array(N), perd = new Float64Array(N), porta = (q, fondoQ) => trasporta({ W, H, co, righe, h, q, fondoQ, sorg, perd, wMescola });
  // IL GHIACCIO MARINO: dove il clima tiene l'aria sotto il punto di gelo dell'acqua salata per una parte dell'anno, il
  // ghiaccio cresce dall'alto (legge di Stefan: h = √(2·k·ΔT·t/(ρ·L)), col calore di fusione di chimica.js); cristallizzando
  // lascia nell'acqua sotto quasi tutto il suo sale (l'85%: dato misurato), che la rende più densa
  const spessoreGhiaccio = new Float32Array(N), Lfus = (1000 * (MOLECOLE['H2O(l)'].dH - MOLECOLE['H2O(s)'].dH)) / 0.018015;
  for (let k = 0; k < N; k++) if (bagnato[k] > 0 && ghiaccio[k] > 0.01) spessoreGhiaccio[k] = Math.sqrt((2 * 2.2 * Math.max(1, out.congela - Tclima[k] + 5 * ghiaccio[k]) * ghiaccio[k] * (P.anno || ANNO)) / (917 * Lfus));
  let Tfondo = tMin, Sfondo = salinitaMedia; const Tm = Float32Array.from(Tclima, (t) => Math.max(out.congela, t)), Sm = new Float32Array(N).fill(salinitaMedia), dense = [];
  for (let giro = 0; giro < 2 && celleMare; giro++) {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, A = righe.A[j]; sorg[k] = ((A * h) / tauT) * Math.max(out.congela, Tclima[k]); perd[k] = (A * h) / tauT; }
    porta(Tm, Tfondo); for (let k = 0; k < N; k++) if (Tm[k] < out.congela) Tm[k] = out.congela;
    // la salinità: l'evaporazione concentra, la pioggia e i fiumi diluiscono; la corrente e il fondo rimescolano
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, A = righe.A[j]; sorg[k] = (A * evap[k] * Sm[k]) / 1000 / ANNO; perd[k] = (A * piove[k]) / 1000 / ANNO + dolce[k]; }
    for (let r = 0; r < 3; r++) { porta(Sm, Sfondo); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; sorg[k] = (righe.A[j] * evap[k] * Sm[k]) / 1000 / ANNO; } }
    { let sA = 0, aA = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (co.mare[k]) { sA += Sm[k] * righe.A[j]; aA += righe.A[j]; } } const f = sA > 0 ? (salinitaMedia * aA) / sA : 1; for (let k = 0; k < N; k++) Sm[k] *= f; }
    // L'ACQUA PIÙ DENSA (fredda e salata) affonda e riempie il fondo: è lei l'acqua profonda di tutto il mare
    dense.length = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (co.mare[k]) dense.push([densita(Tm[k], Sm[k] * (1 + (0.85 * spessoreGhiaccio[k]) / h)), k, righe.A[j]]); }
    dense.sort((a, b) => b[0] - a[0]); let aD = 0, tD = 0, sD = 0; for (const [, k, A] of dense) { if (aD > 0.02 * areaMare) break; aD += A; tD += Tm[k] * A; sD += Sm[k] * A; }
    if (aD > 0) { Tfondo = tD / aD; Sfondo = sD / aD; }
  }
  // l'argilla dei fiumi: entra alle foci, viaggia con la corrente, cade con la velocità di Stokes
  const wArgilla = Math.max(1e-7, stokes(DATI.taglie.argilla, DATI.densitaGrani, Tmare, salinitaMedia, g)), torb = new Float32Array(N);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; sorg[k] = fango[k]; perd[k] = righe.A[j] * wArgilla; }
  if (celleMare) porta(torb, 0);
  // --- le saturazioni: l'equilibrio calcolato su una tavola (temperatura × salinità) e interpolato
  const tavola = { T: [271, 276, 282, 288, 294, 300, 306, 314], f: [0.3, 0.6, 0.85, 1, 1.2, 1.6], pH: [], calcite: [], gesso: [], salgemma: [] };
  for (const T of tavola.T) for (const f of tavola.f) { const t = {}; for (const e in ioni) t[e] = ioni[e] * f; const a = acqua(t, T, { pCO2 }); tavola.pH.push(a.pH); for (const x of ['calcite', 'gesso', 'salgemma']) tavola[x].push(Math.log(Math.max(1e-30, a.omega[x]))); }
  out.tavola = tavola;
  const sat = { calcite: new Float32Array(N), gesso: new Float32Array(N), salgemma: new Float32Array(N) }, pHc = new Float32Array(N);
  for (let k = 0; k < N; k++) { const x = dallaTavola(tavola, Tm[k], salinitaMedia > 0 ? Sm[k] / salinitaMedia : 1); pHc[k] = x.pH; sat.calcite[k] = x.calcite; sat.gesso[k] = x.gesso; sat.salgemma[k] = x.salgemma; }
  // i campi valgono sul mare: sulle celle di terra si mette la media dei vicini bagnati (serve a interpolare lungo le coste)
  for (const x of [Tm, Sm, torb, co.u, co.v, co.w, pHc, sat.calcite, sat.gesso, sat.salgemma]) riempiTerra(x, co.mare, W, H);
  // la torbidità sulla griglia fine: l'argilla portata lontano, più il pennacchio di ogni foce nelle celle attorno
  const torbidaFine = new Float32Array(FN); for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) { const k = j * FW + i; if (tipo[k] === 1) torbidaFine[k] = bil(torb, W, H, ((i + 0.5) / FW) * W - 0.5, ((j + 0.5) / FH) * H - 0.5); }
  out.fiume.sospeso = fiumi > 0 ? (sedimento / fiumi) * 1000 : 0; // (kg di fango per m³ d'acqua di fiume)
  for (const f of out.foci.slice(0, 200)) { const i0 = Math.floor(((f.lon + 180) / 360) * FW), j0 = Math.floor(((90 - f.lat) / 180) * FH);
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const j = j0 + dj, i = (i0 + di + FW) % FW; if (j < 0 || j >= FH || tipo[j * FW + i] !== 1) continue;
      const x = Math.max(0.3 * R * (Math.PI / FH), distanza(R, f.lon, f.lat, lonDi(i, FW), latDi(j, FH))), pn = pennacchio(f.portata, x, g); torbidaFine[j * FW + i] += out.fiume.sospeso * f.argilla * pn.parte * Math.exp((-x * wArgilla) / (pn.velocita * DATI.pennacchio)); } }
  out.fine.torbida = torbidaFine; out.vulcani = (s.vulcani || []).map(([i, j]) => ({ lon: lonDi(i, FW), lat: latDi(j, FH), sommerso: tipo[j * FW + i] === 1 })); out.spessoreGhiaccio = spessoreGhiaccio;
  out.coloreFondo = s.materiali?.coloreBasalto || [120, 110, 100]; out.eta = P.interno?.eta ?? 4.5e9;
  Object.assign(out, { corrente: { u: co.u, v: co.v }, risalita: co.w, giri: co.psi, termoclino: co.termoclino, temperatura: Tm, salinita: Sm, torbidita: torb, saturazione: sat, pHcampo: pHc, eMenoP: Float32Array.from(evap, (e, k) => e - piove[k]),
    profondo: { T: Tfondo, salinita: Sfondo, densita: densita(Tfondo, Sfondo), portataSv: (wMescola * areaMare) / 1e6, tempoGiroAnni: wMescola > 0 ? out.profonditaMedia / wMescola / ANNO : Infinity,
      dove: dense.slice(0, 3).map(([, k]) => ({ lon: lonDi(k % W, W), lat: latDi(Math.floor(k / W), H) })) } });
  // --- I LAGHI: dolci se traboccano, salati se l'acqua esce solo evaporando
  const laghi = [], Tfine = (k) => { const i = k % FW, j = (k - i) / FW; return bil(cl.media, cl.W, cl.H, ((i + 0.5) / FW) * cl.W - 0.5, ((j + 0.5) / FH) * cl.H - 0.5); };
  const eVapPot = (k) => { const i = k % FW, j = (k - i) / FW, x = ((i + 0.5) / FW) * W - 0.5, y = ((j + 0.5) / FH) * H - 0.5, T = Tfine(k), U = m ? Math.hypot(bil(vu, W, H, x, y), bil(vv, W, H, x, y)) + 1 : 3, rh = m ? bil(umid, W, H, x, y) : 0.5;
    return { E: (DATI.ce * (pressioneVapore(T) / (461.5 * T)) * U * Math.max(0.1, 1 - 0.8 * rh) * ANNO) / 1000, P: m ? bil(piove, W, H, x, y) / 1000 : 0.3 }; }; // (m/anno: la formula di massa di meteo.js)
  const gruppi = (dentro) => { const visto = new Uint8Array(FN), ris = []; for (let k0 = 0; k0 < FN; k0++) { if (visto[k0] || !dentro(k0)) continue; const celle = [k0]; visto[k0] = 1;
    for (let n = 0; n < celle.length; n++) { const c = celle[n], i = c % FW, j = (c - i) / FW; for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= FH) continue; for (let di = -1; di <= 1; di++) { const q = jj * FW + ((i + di + FW) % FW); if (!visto[q] && dentro(q)) { visto[q] = 1; celle.push(q); } } } }
    ris.push(celle); } return ris; };
  const scheda = (celle, chiuso, livelloLago) => { let A = 0, V = 0, x = 0, y = 0, z = 0, fl = 0, kMin = celle[0];
    for (const k of celle) { const i = k % FW, j = (k - i) / FW, a = areaF(j), d = chiuso ? Math.max(0.5, livelloLago - s.alt[k]) : s.lago[k]; A += a; V += a * d; const lo = lonDi(i, FW) * RAD, la = latDi(j, FH) * RAD; x += a * Math.cos(la) * Math.cos(lo); y += a * Math.cos(la) * Math.sin(lo); z += a * Math.sin(la); if (s.flusso && s.flusso[k] > fl) fl = s.flusso[k]; if (s.alt[k] < s.alt[kMin]) kMin = k; }
    return { areaM2: A, volumeM3: V, profonditaM: V / A, lon: Math.atan2(y, x) / RAD, lat: Math.atan2(z, Math.hypot(x, y)) / RAD, afflussoKgAnno: kPortata * Math.max(fl, 1), T: Math.max(Tfine(kMin), 271), kMin }; };
  const fiumeIoni = bs.fiume;
  if (s.lago) for (const celle of gruppi((k) => tipo[k] === 2)) { const L = scheda(celle, false), ev = eVapPot(L.kMin), evapora_ = Math.min(0.97 * L.afflussoKgAnno, Math.max(0, ev.E - ev.P) * 1000 * L.areaM2), fatt = L.afflussoKgAnno / (L.afflussoKgAnno - evapora_);
    const e = evapora(fiumeIoni, fatt, L.T, pCO2), id = laghi.length; for (const k of celle) out.fine.lago[k] = id;
    laghi.push({ id, tipo: 'aperto', ...L, evaporaKgAnno: evapora_, etaAnni: null, concentrato: fatt, salinita: e.salinita, totali: e.ioni, ioni: nomiIoni(e.ioni, e.eq), pH: e.eq.pH, saturazione: { calcite: e.eq.omega.calcite, gesso: e.eq.omega.gesso, salgemma: e.eq.omega.salgemma }, precipitati: e.precipitati, ghiaccio: bil(cl.freddo, cl.W, cl.H, ((L.lon + 180) / 360) * cl.W - 0.5, ((90 - L.lat) / 180) * cl.H - 0.5),
      descrizione: 'lago dolce: ha un emissario, l\'acqua resta poco e porta via i suoi sali' }); }
  { const pieno = conche(s.alt, FW, FH, isFinite(livello) ? livello : -Infinity), tutte = gruppi((k) => tipo[k] === 0 && pieno[k] > s.alt[k] + 1).map((celle) => ({ celle, fl: celle.reduce((a, k) => Math.max(a, s.flusso ? s.flusso[k] : 1), 0) })).sort((a, b) => b.fl - a.fl || a.celle[0] - b.celle[0]);
    for (const { celle } of tutte.slice(0, 40)) { celle.sort((a, b) => s.alt[a] - s.alt[b] || a - b); const k0 = celle[0], ev = eVapPot(k0), netto = Math.max(0.05, ev.E - ev.P), Q = kPortata * celle.reduce((a, k) => Math.max(a, s.flusso ? s.flusso[k] : 1), 1);
      // il lago terminale: si allarga finché ciò che evapora dalla sua superficie pareggia ciò che arriva
      const areaVoluta = Q / 1000 / netto, bagnate = []; let A = 0; for (const k of celle) { if (A >= areaVoluta) break; bagnate.push(k); A += areaF(Math.floor(k / FW)); }
      const piena = areaVoluta >= areaF(Math.floor(k0 / FW)), id = laghi.length;
      if (!piena) { // troppo poca acqua per una cella intera: una piana di sale, con al centro una pozza di salamoia
        out.fine.tipo[k0] = 4; out.fine.lago[k0] = id; out.fine.fondo[k0] = 0.3; }
      else { const liv = s.alt[bagnate[bagnate.length - 1]] + 1; for (const k of bagnate) { out.fine.tipo[k] = 3; out.fine.lago[k] = id; out.fine.fondo[k] = Math.max(0.5, liv - s.alt[k]); } }
      const L = piena ? scheda(bagnate, true, s.alt[bagnate[bagnate.length - 1]] + 1) : { ...scheda([k0], true, s.alt[k0] + 0.3), areaM2: areaVoluta, volumeM3: areaVoluta * 0.3, profonditaM: 0.3 };
      // da quanto tempo la conca è chiusa (l'ultima volta che ha traboccato, o che si è formata): un evento
      const etaAnni = Math.min(P.interno?.eta ?? 4.5e9, Math.pow(10, c0.tra(`lago ${id}/da quanto è chiuso`, 4, 7))), fatt = Math.max(1, (Q * etaAnni) / (1000 * L.volumeM3));
      const e = evapora(fiumeIoni, fatt, L.T, pCO2), satura = e.precipitati.salgemma > 0;
      laghi.push({ id, tipo: piena ? 'chiuso' : 'piana di sale', ...L, afflussoKgAnno: Q, evaporaKgAnno: Q, etaAnni, concentrato: fatt, salinita: e.salinita, totali: e.ioni, ioni: nomiIoni(e.ioni, e.eq), pH: e.eq.pH, saturazione: { calcite: e.eq.omega.calcite, gesso: e.eq.omega.gesso, salgemma: e.eq.omega.salgemma },
        precipitati: e.precipitati, ghiaccio: 0, descrizione: satura ? 'salamoia satura: l\'acqua esce solo evaporando e lascia qui tutti i suoi sali; sul fondo e sulle rive cresce il salgemma' : e.salinita > 3 ? 'lago salato: chiuso, i sali dei fiumi si accumulano' : 'lago chiuso ancora giovane: i sali non hanno avuto tempo di accumularsi' }); } }
  out.laghi = laghi;
  // --- LE SORGENTI CALDE DEL FONDO: dove la crosta è appena nata (le dorsali) e sui vulcani sommersi
  out.sorgentiCalde = sorgentiCalde(P, s, out, bs, { lonDi, latDi, FW, FH, tipo, fondoF, livello, g, pAria });
  out.prebiotica = perLaChimicaPrebiotica(out, s);
  out.storia = racconta(out, bs);
  return out;
}

// LE CORRENTI SPINTE DAL VENTO. Due pezzi, tutti e due dalla stessa forza (il vento sulla superficie) e dalla rotazione:
//  · la DERIVA DI EKMAN: lo strato di superficie, spinto dal vento e deviato da Coriolis, va di traverso (a destra del
//    vento nell'emisfero nord): trasporto = τ/(ρ·(r + i·f)), con un piccolo attrito r che lo tiene finito all'equatore.
//    Dove questo trasporto diverge (lungo l'equatore, lungo le coste da cui il vento allontana l'acqua) risale acqua dal
//    fondo; dove converge (il centro dei grandi giri) l'acqua scende.
//  · i GIRI: l'acqua che scende o sale sotto lo strato di Ekman deve spostarsi verso l'equatore o verso i poli (bilancio
//    di Sverdrup: β·V = rot τ/ρ), e torna indietro in una corrente stretta sul bordo OVEST di ogni bacino, perché la
//    rotazione del pianeta cresce verso i poli (Stommel 1948): r·∇²ψ + β·∂ψ/∂x = rot τ/ρ, con ψ = 0 sulle coste.
//    L'attrito r è scelto perché la corrente di bordo sia larga una cella (quella vera è larga cento chilometri: qui è
//    più larga e più lenta, ma porta la stessa acqua). Si risolve con passate successive da est a ovest.
// Lo spessore che il vento muove (il termoclino) viene dalla scala h = √(f²·w·L/(β·g′)): w la discesa di Ekman, L la
// larghezza dei bacini, g′ la gravità ridotta dalla differenza di densità tra l'acqua calda e la fredda.
function correnti({ W, H, R, omega, bagnato, fondo, tx, ty, g, salto, areaMare }) {
  const N = W * H, dl = (2 * Math.PI) / W, df = Math.PI / H, rho = 1025, mare = new Uint8Array(N), rE = DATI.attritoEkman, dy = R * df;
  const fi = (j) => Math.PI / 2 - (j + 0.5) * df, c = Float64Array.from({ length: H }, (_, j) => Math.cos(fi(j)));
  const Mx = new Float64Array(N), My = new Float64Array(N), psi = new Float64Array(N), F = new Float64Array(N);
  for (let j = 0; j < H; j++) { const f = 2 * omega * Math.sin(fi(j)); for (let i = 0; i < W; i++) { const k = j * W + i; mare[k] = bagnato[k] >= 0.5 ? 1 : 0; const d = rho * (rE * rE + f * f); Mx[k] = (rE * tx[k] + f * ty[k]) / d; My[k] = (rE * ty[k] - f * tx[k]) / d; } }
  for (let j = 1; j < H - 1; j++) for (let i = 0; i < W; i++) { const k = j * W + i, e = j * W + ((i + 1) % W), w = j * W + ((i + W - 1) % W); F[k] = ((ty[e] - ty[w]) / (2 * dl) - (tx[k - W] * c[j - 1] - tx[k + W] * c[j + 1]) / (2 * df)) / (R * c[j] * rho); }
  const aE = new Float64Array(H), aW = new Float64Array(H), aN = new Float64Array(H), aS = new Float64Array(H), aP = new Float64Array(H);
  for (let j = 1; j < H - 1; j++) { const beta = (2 * omega * c[j]) / R, dx = R * c[j] * dl, r = Math.max(beta * dx, 1e-7), cn = Math.cos(fi(j) + df / 2), cs = Math.cos(fi(j) - df / 2);
    aE[j] = r / (dx * dx) + beta / (2 * dx); aW[j] = r / (dx * dx) - beta / (2 * dx); aN[j] = (r * cn) / (c[j] * dy * dy); aS[j] = (r * cs) / (c[j] * dy * dy); aP[j] = (2 * r) / (dx * dx) + (r * (cn + cs)) / (c[j] * dy * dy); }
  for (let giro = 0; giro < 220; giro++) for (let jj = 1; jj < H - 1; jj++) { const j = giro & 1 ? H - 1 - jj : jj; if (j < 3 || j > H - 4) continue; for (let i = W - 1; i >= 0; i--) { const k = j * W + i; if (!mare[k]) continue;
    const e = j * W + ((i + 1) % W), w = j * W + ((i + W - 1) % W); psi[k] = (aE[j] * psi[e] + aW[j] * psi[w] + aN[j] * psi[k - W] + aS[j] * psi[k + W] - F[k]) / aP[j]; } }
  // lo spessore mosso dal vento, dalla discesa di Ekman tipica alle medie latitudini
  let w2 = 0, n2 = 0; for (let j = 1; j < H - 1; j++) { const la = Math.abs(fi(j)); if (la < 0.26 || la > 0.87) continue; const f = 2 * omega * Math.sin(fi(j)); for (let i = 0; i < W; i++) { const k = j * W + i; if (mare[k]) { w2 += (F[k] * rho / (rho * f)) ** 2; n2++; } } }
  const wE = n2 ? Math.sqrt(w2 / n2) : 0, f30 = omega, beta30 = (1.73 * omega) / R, termoclino = limita(Math.sqrt((f30 * f30 * wE * 0.5 * Math.sqrt(areaMare)) / (beta30 * Math.max(1e-4, (g * salto) / rho))), 100, 1500);
  // i flussi dello strato di superficie attraverso le facce delle celle (m³/s): Ekman, più la parte dei giri che gli tocca
  const FE = new Float64Array(N), FS = new Float64Array(N), C = new Float64Array(N), u = new Float32Array(N), v = new Float32Array(N), w = new Float32Array(N), strato = DATI.strato;
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W; i++) { const k = j * W + i, e = j * W + ((i + 1) % W); C[k] = 0.25 * (psi[k] + psi[e] + psi[k + W] + psi[e + W]); }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, e = j * W + ((i + 1) % W), kw = j * W + ((i + W - 1) % W); if (!mare[k]) continue;
    const parte = strato / Math.max(strato, Math.min(termoclino, fondo[k] || termoclino));
    if (mare[e]) FE[k] = 0.5 * (Mx[k] + Mx[e]) * dy + parte * (C[k] - (j > 0 ? C[k - W] : 0));
    if (j < H - 1 && mare[k + W]) FS[k] = 0.5 * (My[k] + My[k + W]) * R * dl * Math.cos(fi(j) - df / 2) + parte * (C[k] - C[kw]); }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, kw = j * W + ((i + W - 1) % W); if (!mare[k]) continue; const fn = j > 0 ? FS[k - W] : 0, dx = R * c[j] * dl;
    u[k] = (FE[k] + FE[kw]) / (2 * dy * strato); v[k] = (fn + FS[k]) / (2 * dx * strato); w[k] = (FE[k] - FE[kw] + fn - FS[k]) / (dx * dy); }
  return { mare, u, v, w, FE, FS, psi: Float32Array.from(psi, (x) => x / 1e6), termoclino, discesaEkman: wE };
}
// una grandezza portata dalla corrente, a regime: in ogni cella ciò che entra (dai vicini a monte, dal fondo dove
// l'acqua risale, dalle sorgenti) pareggia ciò che esce; più il rimescolamento dei vortici (1000 m²/s, misurato) e lo
// scambio lento col fondo. Passate successive (Gauss-Seidel): niente passo di tempo.
function trasporta({ W, H, co, righe, h, q, fondoQ, sorg, perd, wMescola }) {
  const { mare, FE, FS } = co, Kor = 1000 * h, daSotto = 1 - Math.exp((-2 * h) / co.termoclino); // l'acqua che risale viene da poco sotto lo strato: è già in parte acqua di superficie
  for (let giro = 0; giro < 90; giro++) for (let jj = 0; jj < H; jj++) { const j = giro & 1 ? H - 1 - jj : jj, A = righe.A[j], dE = (Kor * righe.dy) / Math.max(righe.dx[j], 1), dS = (Kor * righe.dxS[j]) / righe.dy, dN = j > 0 ? (Kor * righe.dxS[j - 1]) / righe.dy : 0;
    for (let ii = 0; ii < W; ii++) { const i = giro & 2 ? W - 1 - ii : ii, k = j * W + i; if (!mare[k]) continue;
      const e = j * W + ((i + 1) % W), kw = j * W + ((i + W - 1) % W), fe = FE[k], fw = FE[kw], fs = FS[k], fn = j > 0 ? FS[k - W] : 0, div = fe - fw + fn - fs;
      let num = sorg[k] + wMescola * A * fondoQ, den = perd[k] + wMescola * A;
      if (div > 0) { num += div * daSotto * fondoQ; den += div * (daSotto - 1); } else den -= div;
      if (fe > 0) den += fe; else if (fe < 0) num -= fe * q[e]; if (fw > 0) num += fw * q[kw]; else den -= fw;
      if (fs > 0) num += fs * q[k + W]; else den -= fs; if (fn > 0) den += fn; else if (fn < 0) num -= fn * q[k - W];
      if (mare[e]) { num += dE * q[e]; den += dE; } if (mare[kw]) { num += dE * q[kw]; den += dE; }
      if (j < H - 1 && mare[k + W]) { num += dS * q[k + W]; den += dS; } if (j > 0 && mare[k - W]) { num += dN * q[k - W]; den += dN; }
      q[k] = den > 0 ? num / den : q[k]; } }
  return q;
}
// la distanza lungo il cerchio massimo (m), tra due punti dati in gradi
export function distanza(R, lon1, lat1, lon2, lat2) { const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(a))); }
// IL PENNACCHIO DI UN FIUME IN MARE: l'acqua dolce, leggera, si allarga in superficie come una corrente di gravità di
// spessore h (dato: qualche metro), alla velocità c = √(g′·h) con g′ la gravità ridotta dalla differenza di densità;
// allargandosi su un semicerchio di raggio x ingloba acqua di mare: la parte di fiume che resta è
// f = (Q/(π·x·h·√(0,027·g·h)))^(2/3). → { parte (0…1), velocita (m/s) }
export function pennacchio(portata, x, g = 9.81) { const h = DATI.pennacchio, parte = Math.min(1, Math.pow(portata / (Math.PI * Math.max(x, 1) * h * Math.sqrt(0.027 * g * h)), 2 / 3)); return { parte, velocita: Math.max(0.02, Math.sqrt(0.027 * g * h * parte)) }; }
function riempiTerra(x, mare, W, H) {
  const N = W * H, fatto = Uint8Array.from(mare); let media = 0, n = 0; for (let k = 0; k < N; k++) if (mare[k]) { media += x[k]; n++; } media = n ? media / n : 0;
  for (let giro = 0; giro < 4; giro++) { const nuovi = []; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (fatto[k]) continue; let s = 0, c = 0;
    for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue; for (let di = -1; di <= 1; di++) { const q = jj * W + ((i + di + W) % W); if (fatto[q]) { s += x[q]; c++; } } } if (c) nuovi.push([k, s / c]); }
    for (const [k, val] of nuovi) { x[k] = val; fatto[k] = 1; } }
  for (let k = 0; k < N; k++) if (!fatto[k]) x[k] = media;
}
// il pH e le saturazioni a una temperatura e a una salinità (rispetto alla media), dalla tavola calcolata da mare()
export function dallaTavola(tv, T, f) {
  const pos = (v, x) => { let i = 0; while (i < v.length - 2 && x > v[i + 1]) i++; return [i, limita((x - v[i]) / (v[i + 1] - v[i]), 0, 1)]; }, [a, u] = pos(tv.T, T), [b, w] = pos(tv.f, f), nf = tv.f.length;
  const leggi = (x) => (x[a * nf + b] * (1 - w) + x[a * nf + b + 1] * w) * (1 - u) + (x[(a + 1) * nf + b] * (1 - w) + x[(a + 1) * nf + b + 1] * w) * u;
  return { pH: leggi(tv.pH), calcite: Math.exp(leggi(tv.calcite)), gesso: Math.exp(leggi(tv.gesso)), salgemma: Math.exp(leggi(tv.salgemma)) };
}

// LE SORGENTI CALDE. Sul fondo dove la crosta è giovane (geologia.js: il fondale sprofonda come la radice dell'età, quindi
// l'età si legge dalla quota) il calore esce per conduzione, q = k·ΔT/√(π·κ·t), e l'acqua del mare entra nelle crepe, si
// scalda e risale. Quanto calda: fino a bollire alla pressione di quel fondo (più profondo, più caldo), mai oltre il
// punto critico. Che cosa porta: ha lasciato il magnesio nella roccia (prendendone acido: pH 3-4 misurato) e il solfato
// (l'anidrite è meno solubile al caldo), ha preso calcio, potassio, la silice che il quarzo cede a quella temperatura,
// il solfuro e il ferro del basalto (dato misurato: fino a qualche millimole per kg).
function sorgentiCalde(P, s, st, bs, { lonDi, latDi, FW, FH, tipo, fondoF, livello, g, pAria }) {
  const q = P.interno?.q ?? 0; if (!(q > 0.02) || !isFinite(livello)) return [];
  const cand = [], placche = bs.vivo === 1;
  if (placche && s.cont) for (let k = 0; k < FW * FH; k++) { if (tipo[k] !== 1 || s.cont[k]) continue; const sotto = -s.alt[k] - 2500, eta = Math.max(0.05, (Math.max(0, sotto) / 350) ** 2); if (eta < 4) cand.push([eta, k, 'dorsale']); }
  for (const [i, j] of s.vulcani || []) { const k = j * FW + i; if (tipo[k] === 1) cand.push([0.01, k, 'vulcano sommerso']); }
  cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const scelte = [], lontano = (k) => scelte.every(([, q2]) => { const di = Math.abs((k % FW) - (q2 % FW)), dj = Math.abs(Math.floor(k / FW) - Math.floor(q2 / FW)); return Math.max(Math.min(di, FW - di), dj) >= 5; });
  for (const c of cand) { if (scelte.length >= 40) break; if (lontano(c[1])) scelte.push(c); }
  const mant = bs.flussi, rocce = rocceDelPianeta(P), olivina = (s.materiali?.basalto || []).find((x) => x.nome === 'olivina')?.frazione || 0;
  return scelte.map(([eta, k, dove], id) => { const i = k % FW, j = (k - i) / FW, prof = fondoF[k], pressione = pAria + 1025 * g * prof, T = Math.min(DATI.critico, ebollizione(pressione)), K = costanti(T);
    const calore = (DATI.conducibilita * (DATI.Tmantello - 275)) / Math.sqrt(Math.PI * DATI.diffusivita * eta * 1e6 * ANNO);
    return { id, dove, lon: lonDi(i, FW), lat: latDi(j, FH), profonditaM: prof, pressione, etaCrostaMa: eta, calore, T, pH: 3.5,
      fluido: { 'Mg2+': 0, 'Ca2+': st.totali.Ca + st.totali.Mg, 'K+': st.totali.K + rocce.basalto.K * DATI.potassioCaldo, 'Na+': st.totali.Na * (1 - DATI.sodioCaldo), 'Cl-': st.totali.Cl, 'SO4(2-)': 0,
        H4SiO4: K.sali.quarzo, 'H2S(aq)': Math.min(0.012, rocce.mantello.S / DATI.fusione * 0.1), 'Fe2+': Math.min(0.006, rocce.basalto.Fe * 0.002) },
      alcalina: olivina > 0.02, portataKgAnno: mant.caldo / Math.max(1, scelte.length) }; });
}
// CIÒ CHE SERVIREBBE ALLA CHIMICA PREBIOTICA (qui niente vita: solo dove ci sono gradienti, energia, minerali che
// catalizzano). L'energia chimica di una sorgente: l'idrogeno che la roccia cede all'acqua (dato: fino a ~10 mmol/kg dove
// c'è olivina che si idrata, ~0,1 altrove) contro l'anidride carbonica del mare, CO2 + 4H2 → CH4 + 2H2O, dalla tabella.
function perLaChimicaPrebiotica(st, s) {
  const T = st.Tmedia || 280, dG0 = gibbs('CH4', T) + 2 * gibbs('H2O(l)', T) - gibbs('CO2', T) - 4 * gibbs('H2', T);
  const camini = (st.sorgentiCalde || []).map((v) => { const H2 = v.alcalina ? 0.01 : 1e-4, Q = (1e-6 / 1.4e-3) / ((Math.max(st.gas.CO2 || 1e-9, 1e-9) / costanti(T).henry.CO2) * (H2 / 7.8e-4) ** 4);
    return { id: v.id, lon: v.lon, lat: v.lat, profonditaM: v.profonditaM, saltoDiTemperatura: v.T - (st.profondo?.T ?? T), saltoDiPH: st.pH - v.pH, energiaKJmol: -(dG0 + R_GAS * T * Math.log(Q)) / 1000,
      minerali: ['solfuro di ferro', ...(v.alcalina ? ['olivina che si idrata (serpentino, magnetite)'] : []), 'argille'], alcalina: v.alcalina }; });
  const pozze = (st.laghi || []).filter((l) => l.tipo !== 'aperto').map((l) => ({ id: l.id, lon: l.lon, lat: l.lat, concentrato: l.concentrato, salinita: l.salinita, pH: l.pH, T: l.T }));
  return { camini, pozzeCheEvaporano: pozze, foci: (st.foci || []).slice(0, 12).map((f) => ({ lon: f.lon, lat: f.lat, portata: f.portata })),
    gradienti: { pHmare: st.pH, anidrideCarbonica: st.gas.CO2 || 0, ferroSciolto: st.totali.Fe || 0, ossigeno: st.gas.O2 || 0 },
    nota: 'gradienti di pH e di temperatura ai camini (di più se il mare è acido e il camino alcalino), minerali catalitici (solfuri di ferro, argille), pozze che si concentrano evaporando; con ossigeno nell\'aria il ferro sciolto e l\'idrogeno non durano' };
}
function racconta(st, bs) {
  const i = st.ioni, ord = Object.entries(i).filter(([f]) => IONI[f]).sort((a, b) => b[1] * Math.abs(IONI[b[0]][2]) - a[1] * Math.abs(IONI[a[0]][2])), r = bs.bilancio.residenza, ma = (x) => (x >= 1e9 ? `${(x / 1e9).toFixed(1)} miliardi di anni` : `${Math.round(x / 1e6)} milioni di anni`);
  if (!(st.massaMare > 1)) return 'Niente mare: solo laghi. I fiumi portano i sali delle rocce; dove un lago ha un emissario resta dolce, dove è chiuso li accumula.';
  const tipoMare = st.pH < 6.5 ? 'acido' : st.pH > 9 ? 'di soda (alcalino)' : 'quasi neutro', sale = st.salinitaMedia > 150 ? 'una salamoia' : st.salinitaMedia > 20 ? 'salato' : st.salinitaMedia > 3 ? 'salmastro' : 'quasi dolce';
  return `Mare ${sale} (${st.salinitaMedia.toFixed(1)} g/kg), ${tipoMare} (pH ${st.pH.toFixed(1)}); dominano ${ord[0][0]} e ${ord[1][0]}. ` +
    `Il cloro è quello che i vulcani hanno portato fuori dal mantello in tutta la vita del pianeta, e non ha quasi modo di uscire dall'acqua (resta ${ma(r.Cl)}); il sodio lo cedono i feldspati consumati dalla pioggia e resta ${ma(r.Na)}; ` +
    `il calcio arriva di più ma esce subito come calcare (resta ${ma(r.Ca)}): per questo i fiumi sono acqua di calcio e bicarbonato e il mare è acqua di sale. ` +
    `Il magnesio lo trattiene la roccia calda del fondo (${ma(r.Mg)}). Il pH è quello a cui l'anidride carbonica dell'aria (${(st.pCO2 * 1e6).toPrecision(2)} milionesimi di bar) e il calcare stanno in equilibrio con le cariche dei sali.` +
    (st.fondoDiSale ? ' L\'acqua è così poca che il sale non ci sta tutto: il resto è sul fondo.' : '');
}
// le moli per kg, con i nomi degli ioni (il carbonio sciolto è quasi tutto bicarbonato)
const nomiIoni = (t, eq) => ({ 'Na+': t.Na || 0, 'K+': t.K || 0, 'Mg2+': t.Mg || 0, 'Ca2+': t.Ca || 0, 'Cl-': t.Cl || 0, 'SO4(2-)': t.S || 0, 'HCO3-': eq ? eq.bicarbonato : 0, 'CO3(2-)': eq ? eq.carbonato : 0, 'Fe2+': t.Fe || 0, H4SiO4: t.Si || 0 });
// LA REGOLA PER IL PUNTO: il mare è ben rimescolato rispetto ai tempi di residenza, quindi gli ioni maggiori hanno
// ovunque le stesse proporzioni (lo si misura dal 1819, Marcet): in un punto di salinità S ci sono gli ioni medi
// moltiplicati per S / S media. Il carbonio, il pH e le saturazioni no: dipendono dalla temperatura (acqua()).
export function ioniNelPunto(stato, salinita) { const f = stato.salinitaMedia > 0 ? salinita / stato.salinitaMedia : 1, o = {}; for (const e in stato.totali) o[e] = stato.totali[e] * f; return o; }
//§§CONTINUA§§
