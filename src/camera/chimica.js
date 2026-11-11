// chimica.js — di che cosa sono fatte l'aria e la roccia: elementi, legami, molecole, minerali.
//
// È lo strato tra la fisica (leggi.js) e ciò che si vede: i gas di un'atmosfera, il colore di una
// superficie, e più avanti la chimica che prepara la vita. La regola della casa: ogni cosa discende da
// poche leggi e da tabelle di numeri MISURATI, dichiarate una per una.
//   CALCOLATO  · l'energia di un legame (formula di Pauling) e il suo tipo (dalla differenza di
//                elettronegatività);
//              · quali gas convivono a una temperatura e a una pressione: il minimo dell'energia di Gibbs,
//                cioè tutte le costanti di equilibrio K = exp(−ΔG/RT), con ΔG = ΔH − TΔS, insieme, e
//                gli atomi conservati;
//              · la pressione del vapore sull'acqua e sul ghiaccio, l'anidride carbonica che il mare lascia
//                nell'aria (equilibrio di Urey), quale ossido di ferro è stabile: tutte dalla stessa tabella;
//              · l'atmosfera di un pianeta: ciò che c'era, meno ciò che fugge, lasciato reagire e condensare;
//              · la roccia: il mantello ha le proporzioni del Sole, la crosta è ciò che ne fonde per primo
//                (legge della fusione parziale), i minerali sono quelli che gli atomi permettono (norma);
//              · il colore di una miscela di polveri (legge di Kubelka-Munk).
//   MISURATO   · la tavola degli elementi (masse, elettronegatività, abbondanze nel Sole, legami semplici);
//              · entalpie ed entropie di formazione; calori di evaporazione e punti di ebollizione;
//              · quanto carbonio, azoto e zolfo stanno nei ghiacci (comete); i coefficienti di ripartizione
//                tra roccia e fuso; i colori dei minerali;
//              · le rese degli esperimenti di Miller-Urey (legge empirica).
// Unità: kJ/mol per le energie, J/(mol·K) per le entropie, K, Pa. Le frazioni dei gas sono in moli,
// quelle dei minerali in massa. Le specie si chiamano con la formula ('H2O', 'CO2'): il nome italiano
// è in MOLECOLE[formula].nome. (leggi.js ha una sua piccola MOLECOLE, con le masse dei gas del clima:
// qui la si legge per sapere quali molecole la gravità trattiene.)

import { COSTANTI, R_GAS, MOLECOLE as GAS_DEL_CLIMA, statoAcqua, clima, PARTE_FUORI } from './leggi.js';

// ---------- 1. GLI ELEMENTI (dati misurati)
// massa atomica (u) · valenza più comune · elettronegatività di Pauling · abbondanza nel Sole, come
// logaritmo con l'idrogeno a 12 (fotosfera: Asplund e altri 2009) · energia del legame SEMPLICE tra due
// atomi uguali, kJ/mol (H–H, C–C nell'etano, N–N nell'idrazina, O–O nell'acqua ossigenata, S–S nello
// zolfo; per i metalli la molecola biatomica nel vapore: magnesio e calcio quasi non si legano tra loro)
const TAVOLA = {
  H: ['idrogeno', 1.008, 1, 2.20, 12.00, 436], He: ['elio', 4.003, 0, null, 10.93, 0],
  C: ['carbonio', 12.011, 4, 2.55, 8.43, 346], N: ['azoto', 14.007, 3, 3.04, 7.83, 163],
  O: ['ossigeno', 15.999, 2, 3.44, 8.69, 146], Na: ['sodio', 22.990, 1, 0.93, 6.24, 75],
  Mg: ['magnesio', 24.305, 2, 1.31, 7.60, 11], Al: ['alluminio', 26.982, 3, 1.61, 6.45, 133],
  Si: ['silicio', 28.086, 4, 1.90, 7.51, 222], P: ['fosforo', 30.974, 3, 2.19, 5.41, 201],
  S: ['zolfo', 32.06, 2, 2.58, 7.12, 266], Cl: ['cloro', 35.45, 1, 3.16, 5.50, 243],
  K: ['potassio', 39.098, 1, 0.82, 5.03, 57], Ca: ['calcio', 40.078, 2, 1.00, 6.34, 17],
  Fe: ['ferro', 55.845, 3, 1.83, 7.50, 118],
};
// abbondanza: atomi per ogni atomo di idrogeno
export const ELEMENTI = Object.fromEntries(Object.entries(TAVOLA).map(([simbolo, [nome, massa, valenza, chi, logA, legame]]) =>
  [simbolo, { simbolo, nome, massa, valenza, chi, abbondanza: 10 ** (logA - 12), legame }]));
// la materia di una stella con metallicità Z (1 = il Sole): idrogeno ed elio sono quelli del Big Bang,
// tutto il resto l'hanno fabbricato le stelle di prima e cresce con Z
export const abbondanze = (Z = 1) => Object.fromEntries(Object.entries(ELEMENTI).map(([s, e]) => [s, e.abbondanza * (s === 'H' || s === 'He' ? 1 : Math.max(0, Z))]));

// ---------- 2. I LEGAMI (calcolati)
// Pauling: un legame tra atomi diversi è più forte della media (geometrica) dei due legami tra atomi
// uguali, e il di più cresce con il quadrato della differenza di elettronegatività: l'atomo più «avido»
// tira a sé gli elettroni e la carica che si separa tiene insieme i due. 96,5 kJ/mol è un elettronvolt.
// Vale per i legami semplici: entro il 5% per H–Cl e C–H, entro il 15% per O–H e N–H; per i sali,
// che sono cristalli e non molecole, sbaglia (per NaCl dà la metà in più).
const dChi = (a, b) => (ELEMENTI[a].chi == null || ELEMENTI[b].chi == null ? 0 : Math.abs(ELEMENTI[a].chi - ELEMENTI[b].chi));
export const energiaLegame = (a, b) => (ELEMENTI[a].valenza && ELEMENTI[b].valenza ? Math.sqrt(ELEMENTI[a].legame * ELEMENTI[b].legame) + 96.5 * dChi(a, b) ** 2 : 0);
// quanta parte del legame è «ionica» (Pauling): 1 − exp(−Δχ²/4); a Δχ = 1,7 è metà
export const carattereIonico = (a, b) => 1 - Math.exp(-(dChi(a, b) ** 2) / 4);
// covalente (gli elettroni sono in comune, alla pari), polare (in comune, ma spostati), ionico (uno li
// ha ceduti all'altro). Le soglie 0,4 e 1,7 sono quelle convenzionali dei chimici.
export const tipoLegame = (a, b) => (dChi(a, b) < 0.4 ? 'covalente' : dChi(a, b) < 1.7 ? 'polare' : 'ionico');

// ---------- 3. LE MOLECOLE E I MINERALI (dati misurati)
// entalpia di formazione ΔH (kJ/mol) ed entropia S (J/mol·K) a 298 K e 1 bar, dalle tabelle
// termochimiche (NIST-JANAF, CODATA; per i minerali Robie e Hemingway 1995), arrotondate: tra una
// tabella e l'altra cambiano di qualche kJ. ΔH dice quanto calore si libera a formare la specie dagli
// elementi; S quanto «disordine» porta con sé: un gas ne ha molto, un cristallo poco.
// Il ghiaccio è il liquido meno il calore di fusione (6,01 kJ/mol a 273 K).
const SPECIE = [
  ['H2', 'idrogeno', 'gas', 0, 130.68], ['He', 'elio', 'gas', 0, 126.15], ['N2', 'azoto', 'gas', 0, 191.61],
  ['O2', 'ossigeno', 'gas', 0, 205.15], ['Cl2', 'cloro', 'gas', 0, 223.08], ['S2', 'vapore di zolfo', 'gas', 128.6, 228.17],
  ['H2O', 'acqua', 'gas', -241.83, 188.84], ['CO', 'monossido di carbonio', 'gas', -110.53, 197.66],
  ['CO2', 'anidride carbonica', 'gas', -393.51, 213.79], ['CH4', 'metano', 'gas', -74.6, 186.25],
  ['NH3', 'ammoniaca', 'gas', -45.94, 192.77], ['HCN', 'acido cianidrico', 'gas', 135.14, 201.82],
  ['H2CO', 'formaldeide', 'gas', -108.6, 218.76], ['CH3OH', 'metanolo', 'gas', -201.0, 239.9],
  ['H2S', 'idrogeno solforato', 'gas', -20.6, 205.81], ['SO2', 'anidride solforosa', 'gas', -296.81, 248.22],
  ['NO', 'ossido di azoto', 'gas', 91.3, 210.76], ['C2H2', 'acetilene', 'gas', 227.4, 200.9],
  ['C2H6', 'etano', 'gas', -84.0, 229.2], ['HCl', 'acido cloridrico', 'gas', -92.31, 186.90],
  ['H2O(l)', 'acqua liquida', 'liquido', -285.83, 69.95], ['H2O(s)', 'ghiaccio d\'acqua', 'solido', -291.84, 47.95],
  ['C', 'grafite', 'solido', 0, 5.74], ['Fe', 'ferro metallico', 'solido', 0, 27.32],
  ['FeO', 'wüstite', 'solido', -272.0, 60.75], ['Fe3O4', 'magnetite', 'solido', -1118.4, 146.4],
  ['Fe2O3', 'ematite', 'solido', -824.2, 87.4], ['FeS', 'troilite', 'solido', -100.0, 60.3],
  ['SiO2', 'quarzo', 'solido', -910.7, 41.46], ['MgO', 'periclasio', 'solido', -601.6, 26.95],
  ['Al2O3', 'corindone', 'solido', -1675.7, 50.92], ['MgSiO3', 'enstatite (pirosseno)', 'solido', -1549.0, 67.74],
  ['Mg2SiO4', 'forsterite (olivina)', 'solido', -2174.0, 95.1], ['Fe2SiO4', 'fayalite (olivina)', 'solido', -1479.9, 145.2],
  ['CaSiO3', 'wollastonite', 'solido', -1634.9, 81.9], ['CaCO3', 'calcite', 'solido', -1207.6, 91.7],
  ['CaSO4', 'anidrite', 'solido', -1434.5, 106.5], ['NaCl', 'salgemma', 'solido', -411.2, 72.1],
  ['NaAlSi3O8', 'albite (feldspato)', 'solido', -3935.1, 207.4], ['KAlSi3O8', 'ortoclasio (feldspato)', 'solido', -3974.6, 214.2],
  ['CaAl2Si2O8', 'anortite (feldspato)', 'solido', -4234.0, 199.3],
];
// gli atomi di una formula ('Mg2SiO4' → Mg 2, Si 1, O 4) e la sua massa, dalla tavola
const atomiDi = (f) => { const a = {}; for (const [, s, n] of f.replace(/\(.*\)/, '').matchAll(/([A-Z][a-z]?)(\d*)/g)) a[s] = (a[s] || 0) + (+n || 1); return a; };
const massaDi = (f) => Object.entries(atomiDi(f)).reduce((m, [s, n]) => m + n * ELEMENTI[s].massa, 0);
export const MOLECOLE = Object.fromEntries(SPECIE.map(([formula, nome, fase, dH, S]) => [formula, { formula, nome, fase, dH, S, atomi: atomiDi(formula), massa: massaDi(formula) }]));
const GAS = Object.values(MOLECOLE).filter((m) => m.fase === 'gas'), NEI_GAS = new Set(GAS.flatMap((m) => Object.keys(m.atomi)));

// l'energia di Gibbs di una specie a T (J/mol): g = ΔH − T·S. Il calore tira verso le specie più
// legate, il disordine verso quelle più libere: a T bassa vince il primo, a T alta il secondo.
// (ΔH e S presi costanti con la temperatura: è l'approssimazione dichiarata; regge bene fino a ~2500 K)
const gibbs = (f, T) => 1000 * MOLECOLE[f].dH - T * MOLECOLE[f].S;
const dG = ([reagenti, prodotti], T) => { let g = 0; for (const f in prodotti) g += prodotti[f] * gibbs(f, T); for (const f in reagenti) g -= reagenti[f] * gibbs(f, T); return g; };
// le reazioni chiave: [reagenti, prodotti]
export const REAZIONI = {
  metano: [{ CO: 1, H2: 3 }, { CH4: 1, H2O: 1 }],        // CO + 3H2 ⇌ CH4 + H2O
  ammoniaca: [{ N2: 1, H2: 3 }, { NH3: 2 }],              // N2 + 3H2 ⇌ 2NH3
  gasDAcqua: [{ CO: 1, H2O: 1 }, { CO2: 1, H2: 1 }],      // CO + H2O ⇌ CO2 + H2
  acqua: [{ H2O: 2 }, { H2: 2, O2: 1 }],                  // 2H2O ⇌ 2H2 + O2
  urey: [{ CaSiO3: 1, CO2: 1 }, { CaCO3: 1, SiO2: 1 }],   // la roccia che si mangia l'anidride carbonica
};
// la costante di equilibrio di una reazione (nome in REAZIONI, o [reagenti, prodotti]): pressioni in bar
export const costanteEquilibrio = (reazione, T) => Math.exp(-dG(typeof reazione === 'string' ? REAZIONI[reazione] : reazione, T) / (R_GAS * T));
// la pressione del vapore sopra il liquido o il ghiaccio di una specie (Pa): oltre, il gas condensa in
// gocce, neve o brina. Per l'acqua è la K di H2O(l) ⇌ H2O(gas) dalla tabella; tra liquido e ghiaccio
// comanda quello che ne lascia in aria di meno (è lui il più stabile): a 288 K dà 1,7 kPa. Per gli altri
// gas la legge di Clausius-Clapeyron con due dati misurati: il calore di evaporazione (kJ/mol; per la
// CO2, che a 1 bar non ha liquido, di sublimazione) e la temperatura a cui bolle a 1 bar (K).
// Idrogeno ed elio non condensano mai. (Lo zolfo: dalla sua pressione di vapore a 393 K e a 718 K.)
const EVAPORAZIONE = { CO2: [26.1, 194.7], NH3: [23.35, 239.8], CH4: [8.19, 111.7], N2: [5.57, 77.4], SO2: [24.9, 263.1], H2S: [18.7, 212.8], CO: [6.04, 81.6], O2: [6.82, 90.2], HCN: [25.2, 298.8], CH3OH: [35.2, 337.8], S2: [73, 717.8],
  C2H6: [14.7, 184.6], C2H2: [21.3, 189.3], HCl: [16.2, 188.1], H2CO: [23.3, 254.0], NO: [13.8, 121.4], Cl2: [20.4, 239.1] };
export const pressioneVapore = (T, f = 'H2O') => (f === 'H2O' ? 1e5 * Math.min(costanteEquilibrio([{ 'H2O(l)': 1 }, { H2O: 1 }], T), costanteEquilibrio([{ 'H2O(s)': 1 }, { H2O: 1 }], T))
  : EVAPORAZIONE[f] ? 1e5 * Math.exp(((-1000 * EVAPORAZIONE[f][0]) / R_GAS) * (1 / T - 1 / EVAPORAZIONE[f][1])) : Infinity);
// equilibrio di Urey: dove c'è acqua liquida la pioggia scioglie i silicati e l'anidride carbonica finisce
// nel calcare (CaSiO3 + CO2 ⇌ CaCO3 + SiO2). Questa è la pressione di CO2 che resta nell'aria (Pa):
// un nulla a 288 K, un centinaio di bar a 735 K (è, quasi, la pressione di Venere).
export const pressioneCO2Urey = (T) => 1e5 / costanteEquilibrio('urey', T);
// quale forma del ferro è stabile a una temperatura e a una pressione di ossigeno (bar): quella che
// costa meno energia per atomo di ferro, contando l'ossigeno che prende dall'aria. grado: 0 = metallo,
// ½ = ferro ferroso (FeO), ⅚ = magnetite, 1 = ferro ferrico (ematite, la ruggine rossa).
export function ferroStabile(T, pO2) {
  const muO = 0.5 * (gibbs('O2', T) + R_GAS * T * Math.log(Math.max(pO2, 1e-300)));
  return [['Fe', 1, 0, 0], ['FeO', 1, 1, 0.5], ['Fe3O4', 3, 4, 5 / 6], ['Fe2O3', 2, 3, 1]]
    .map(([f, nFe, nO, grado]) => ({ fase: MOLECOLE[f].nome, formula: f, grado, g: (gibbs(f, T) - nO * muO) / nFe }))
    .reduce((a, b) => (b.g < a.g ? b : a));
}

// ---------- 4. L'EQUILIBRIO DEI GAS (calcolato)
// Dati gli atomi (H, C, N, O, S; anche He e Cl), la temperatura e la pressione, quali molecole si
// formano? Quelle che rendono minima l'energia di Gibbs dell'insieme. Al minimo ogni molecola ha
// un «prezzo» che è la somma dei prezzi λ dei suoi atomi:
//     frazione_i = exp( Σ atomi_i·λ − g_i/RT − ln P )
// e questo equivale a soddisfare INSIEME tutte le costanti di equilibrio (CO + 3H2 ⇌ CH4 + H2O,
// N2 + 3H2 ⇌ 2NH3, CO + H2O ⇌ CO2 + H2, 2H2O ⇌ 2H2 + O2 e ogni altra tra le specie della tabella).
// Restano da trovare i prezzi λ che conservano gli atomi: è il minimo di una funzione convessa,
// Ψ(λ) = Σ moli_i(λ) − Σ atomi·λ, che il metodo di Newton trova sempre. Il carbonio che il gas non
// riesce a tenere si deposita come grafite (fuliggine): è un tetto al prezzo del carbonio.
// Solo gas (più la fuliggine): niente gocce né nubi, niente velocità di reazione.
// → { formula: frazione molare } (somma 1); con dettagli: { gas, grafite (la parte del carbonio che
//   si deposita, 0…1), moli (di gas, per le quantità di atomi date) }
export function equilibrio({ T, P = 1e5, elementi = {}, dettagli = false } = {}) {
  const el = Object.keys(elementi).filter((e) => elementi[e] > 0 && NEI_GAS.has(e)), tot = el.reduce((s, e) => s + elementi[e], 0);
  const esci = (gas, grafite = 0, moli = 0) => (dettagli ? { gas, grafite, moli } : gas);
  if (!el.length || !(T > 0) || !(P > 0)) return esci({});
  const m = el.length, RT = R_GAS * T, b = el.map((e) => elementi[e] / tot);
  const sp = GAS.filter((s) => Object.keys(s.atomi).every((e) => el.includes(e))), q = sp.length;
  const A = sp.map((s) => el.map((e) => s.atomi[e] || 0)), c = sp.map((s) => gibbs(s.formula, T) / RT + Math.log(P / 1e5));
  const iC = el.indexOf('C'), tetto = gibbs('C', T) / RT;
  // si parte con tutti i prezzi così bassi che non c'è quasi nessuna molecola, e si sale
  const lam = new Array(m).fill(Math.min(0, ...c.map((ci, i) => ci / A[i].reduce((x, y) => x + y, 0))));
  if (iC >= 0) lam[iC] = Math.min(lam[iC], tetto);
  const e = new Float64Array(q), n = new Float64Array(q), r = new Array(m), d = new Array(m), prova = new Array(m);
  const H = el.map(() => new Array(m).fill(0)), G = el.map(() => new Array(m + 1).fill(0)), alTetto = () => iC >= 0 && lam[iC] >= tetto - 1e-12;
  const psi = (l, s) => { let v = 0; for (let i = 0; i < q; i++) { let x = s - c[i]; for (let j = 0; j < m; j++) x += A[i][j] * l[j]; e[i] = x; v += n[i] = Math.exp(x); } for (let j = 0; j < m; j++) v -= b[j] * l[j]; return v; };
  // a volume fissato (s = logaritmo delle moli totali, che fissa il volume a quella pressione): Newton
  const minimizza = (s) => {
    for (let it = 0; it < 400; it++) {
      const v0 = psi(lam, s);
      for (let j = 0; j < m; j++) { r[j] = -b[j]; H[j].fill(0); }
      for (let i = 0; i < q; i++) for (let j = 0; j < m; j++) { if (!A[i][j]) continue; const w = A[i][j] * n[i]; r[j] += w; for (let k = 0; k < m; k++) H[j][k] += w * A[i][k]; }
      let scarto = 0, diag = 0; for (let j = 0; j < m; j++) { scarto = Math.max(scarto, (j === iC && alTetto() ? Math.max(0, r[j]) : Math.abs(r[j])) / b[j]); diag = Math.max(diag, H[j][j]); }
      if (scarto < 1e-11) break;
      // il passo di Newton: H·d = −r (eliminazione di Gauss; un velo sulla diagonale se due atomi vanno
      // sempre insieme, come C e O quando c'è solo CO2). Se il carbonio è al tetto e vorrebbe salire
      // ancora, c'è grafite: il suo prezzo resta fermo e si risolve per gli altri.
      let fermo = alTetto() && r[iC] < 0;
      for (let giro = 0; giro < 2; giro++) {
        for (let j = 0; j < m; j++) { for (let k = 0; k < m; k++) G[j][k] = fermo && (j === iC || k === iC) ? +(j === k) : H[j][k] + (j === k ? 1e-13 * diag + 1e-300 : 0); G[j][m] = fermo && j === iC ? 0 : -r[j]; }
        for (let j = 0; j < m; j++) {
          let p = j; for (let k = j + 1; k < m; k++) if (Math.abs(G[k][j]) > Math.abs(G[p][j])) p = k;
          [G[j], G[p]] = [G[p], G[j]]; const piv = G[j][j] || 1e-300;
          for (let k = j + 1; k < m; k++) { const f = G[k][j] / piv; if (f) for (let l = j; l <= m; l++) G[k][l] -= f * G[j][l]; }
        }
        for (let j = m - 1; j >= 0; j--) { let x = G[j][m]; for (let k = j + 1; k < m; k++) x -= G[j][k] * d[k]; d[j] = x / (G[j][j] || 1e-300); }
        if (fermo || !alTetto() || d[iC] <= 0) break; fermo = true;
      }
      // quanto lungo: nessuna molecola può superare di colpo gli atomi che ci sono, e il carbonio il tetto
      let t = 1, pend = 0; for (let j = 0; j < m; j++) pend += r[j] * d[j];
      for (let i = 0; i < q; i++) { let de = 0; for (let j = 0; j < m; j++) de += A[i][j] * d[j]; if (de > 0) t = Math.min(t, (Math.max(e[i], 0) + 1.5 - e[i]) / de); }
      if (iC >= 0 && !fermo && d[iC] > 0) t = Math.min(t, (tetto - lam[iC]) / d[iC]);
      // e si accorcia finché Ψ scende davvero (la funzione è convessa: prima o poi scende)
      for (let giri = 0; giri < 40; giri++, t /= 2) { for (let j = 0; j < m; j++) prova[j] = lam[j] + t * d[j]; if (psi(prova, s) <= v0 + 1e-4 * t * pend || Math.abs(pend) < 1e-15 * (1 + Math.abs(v0))) break; }
      for (let j = 0; j < m; j++) lam[j] = prova[j];
    }
    psi(lam, s); let N = 0; for (let i = 0; i < q; i++) N += n[i]; return N;
  };
  // la pressione è fissata, il volume no: si cerca s tale che le moli trovate siano proprio exp(s) (secante)
  let s = Math.log(0.5), s0 = 0, F0 = 0, N = 0;
  for (let k = 0; k < 60; k++) {
    N = minimizza(s); if (!(N > 0)) break;
    const F = Math.log(N) - s; if (Math.abs(F) < 1e-12) break;
    const passo = k === 0 || F === F0 ? F : Math.max(-8, Math.min(8, (-F * (s - s0)) / (F - F0)));
    s0 = s; F0 = F; s += passo;
  }
  if (!(N > 0)) return esci({}, +(iC >= 0), 0);
  const gas = {}; let Cgas = 0;
  for (let i = 0; i < q; i++) { gas[sp[i].formula] = n[i] / N; if (iC >= 0) Cgas += A[i][iC] * n[i]; }
  const fuliggine = alTetto() ? 1 - Cgas / b[iC] : 0; // c'è grafite solo se il carbonio è al tetto
  return esci(gas, fuliggine > 1e-9 ? fuliggine : 0, N * tot);
}

// quanto un'aria è «riducente», da 0 a 1. Si conta l'idrogeno che ogni gas può cedere (in molecole di
// H2: un H2 vale 1, un metano 4, un'ammoniaca 1,5, un CO 1: è ciò che manca alla molecola per essere
// CO2, H2O, N2, SO2) contro quello che servirebbe per ridurre a metano il carbonio ossidato (4 per CO2)
// e per consumare l'ossigeno libero (2 per O2). Azoto e acqua sono neutri.
const redox = (gas) => {
  let rid = 0, oss = 4 * (gas.CO2 || 0);
  for (const f in gas) { const a = MOLECOLE[f]?.atomi; if (!a) continue; const h = 2 * (a.C || 0) + 0.5 * (a.H || 0) - (a.O || 0) + 2 * (a.S || 0); if (h > 0) rid += h * gas[f]; else oss -= h * gas[f]; }
  return { rid, oss };
};
export function potereRiducente(gas = {}) { const { rid, oss } = redox(gas); return rid > 1e-6 ? rid / (rid + oss) : 0; }

// ---------- 5. L'ATMOSFERA DI UN PIANETA
// Si parte da ciò che c'era, si toglie ciò che fugge, si lascia reagire.
//  · Un pianeta che trattiene l'idrogeno (un gigante, o un mondo massiccio e freddo) conserva il gas
//    della nebulosa: le abbondanze della sua stella, meno l'ossigeno chiuso nella roccia (MgO, SiO2…).
//    Con tanto idrogeno il carbonio diventa metano e l'azoto ammoniaca: aria riducente.
//  · Un pianeta che NON lo trattiene ha solo i gas usciti dall'interno: l'acqua e ciò che era
//    congelato con lei (carbonio, azoto, zolfo). Qui l'idrogeno libero fugge; e ogni volta che fugge
//    l'equilibrio ne libera altro dal metano, dall'ammoniaca e dall'acqua (CH4 + 2H2O → CO2 + 4H2):
//    si va avanti finché tutto l'idrogeno rimasto è legato nell'acqua e il carbonio è CO2. È una
//    titolazione: se ne calcola direttamente il punto d'arrivo. Così la fuga dell'idrogeno OSSIDA l'aria.
//    Se poi l'acqua è tutta vapore (niente mare né ghiaccio che la trattenga in basso) sale in alto, la
//    luce la spezza e l'idrogeno se ne va: il pianeta perde anche l'acqua, come Venere; l'ossigeno che
//    avanza lo prende il ferro della crosta, che arrugginisce.
//  · Poi si tolgono le molecole più leggere di quelle che la gravità tiene (clima.tenuti), ogni gas
//    oltre la sua pressione di vapore (l'acqua piove o nevica; al freddo gelano l'ammoniaca, la CO2,
//    il metano, perfino l'azoto), e dove c'è un mare l'anidride carbonica oltre l'equilibrio di Urey
//    (diventa calcare) e l'anidride solforosa (si scioglie, diventa solfato).
// Dati misurati: quanta parte di C, N, S sta nei ghiacci insieme all'acqua (nelle comete: circa 0,3,
// 0,1 e 0,3 di quella del Sole; l'azoto è quasi tutto N2, che non congela) e il ferro che resta ossidato
// nei silicati (15%, sulla Terra); lo zolfo eruttato che torna quasi tutto nella crosta, come solfuri e
// solfati (in aria ne resta un millesimo: su Venere 150 parti per milione).
// Sotto 300 K le reazioni tra gas sono ferme: la miscela resta quella dell'ultima volta che ha reagito,
// e si prende 300 K (semplificazione dichiarata). La pressione totale è quella di clima(), non ricalcolata.
// → { gas: { formula: frazione }, riducente, potere (0…1), pressione (Pa: quella del clima, o meno se quasi
//     tutto è gelato), pO2 (bar), ferro (la forma stabile, da ferroStabile), fuliggine (parte del carbonio) }
const NEI_GHIACCI = { C: 0.3, N: 0.1, S: 0.3 }, ZOLFO_IN_ARIA = 1e-3, FE_NEI_SILICATI = 0.15;
const ossigenoNellaRoccia = (ab) => ab.Mg + 2 * ab.Si + 1.5 * ab.Al + ab.Ca + (ab.Na + ab.K) / 2 + FE_NEI_SILICATI * ab.Fe;
// LA MISCELA DEL SOLE, in massa, dalla tavola degli elementi: è la fonte unica per chi fa i conti con la materia di una
// stella (il disco da cui nascono i pianeti, disco.js; i giganti di gas). X idrogeno, Y elio, Z tutto il resto (dei
// quindici elementi della tavola: con neon, argo e nichel, che qui non ci sono, il Sole arriva a 0,0134). Dei metalli:
//   roccia   la parte solida anche al caldo (magnesio, silicio, alluminio, calcio, sodio, potassio e ferro, con l'ossigeno che prendono);
//   ghiacci  ciò che è solido solo oltre la linea della neve: l'acqua che fa l'ossigeno rimasto, e il carbonio e l'azoto che
//            gelano insieme a lei (NEI_GHIACCI: gli stessi che poi fanno l'aria dei pianeti), contati come CO e NH3;
//   ferro    il ferro sulla somma di ferro e roccia; ghiaccio: la parte di ghiacci nei solidi oltre la neve.
export const SOLE = (() => {
  const ab = abbondanze(1), m = (el) => ab[el] * ELEMENTI[el].massa; let tutto = 0, metalli = 0;
  for (const el in ab) { tutto += m(el); if (el !== 'H' && el !== 'He') metalli += m(el); }
  const Oroccia = ossigenoNellaRoccia(ab), sassi = m('Mg') + m('Si') + m('Al') + m('Ca') + m('Na') + m('K') + Oroccia * ELEMENTI.O.massa, ferro = m('Fe');
  const acqua = (ab.O - Oroccia) * (ELEMENTI.O.massa + 2 * ELEMENTI.H.massa), altri = NEI_GHIACCI.C * ab.C * (ELEMENTI.C.massa + ELEMENTI.O.massa) + NEI_GHIACCI.N * ab.N * (ELEMENTI.N.massa + 3 * ELEMENTI.H.massa);
  return Object.freeze({ X: m('H') / tutto, Y: m('He') / tutto, Z: metalli / tutto, roccia: (sassi + ferro) / metalli, acqua: acqua / metalli, ghiacci: (acqua + altri) / metalli, ferro: ferro / (ferro + sassi), ghiaccio: (acqua + altri) / (acqua + altri + sassi + ferro) });
})();
export function atmosfera(P, { Z, inventario = false, co2 = 0, memoria = null } = {}) {
  const cl = P.clima || {}, tenuti = cl.tenuti || [], gigante = P.tipo === 'gassoso', comp = P.composizione || {};
  const niente = { gas: {}, riducente: false, potere: 0, pressione: 0, pO2: 0, ferro: null, fuliggine: 0 };
  // CON L'INVENTARIO (è così che la chiama climaEAria, cioè ogni pianeta del cosmo) la pressione non è data: discende
  // da quanti gas il pianeta ha in superficie, meno ciò che fugge, gela, piove o finisce nel calcare (vedi più sotto)
  const conInventario = inventario && !gigante && P.massaKg > 0 && P.raggioM > 0;
  if (!gigante && (!tenuti.length || !(conInventario || cl.pressione > 0))) return niente; // un sasso nudo, come la Luna
  // un gigante È il suo idrogeno; per gli altri decide la gravità
  const tieneH = gigante || tenuti.includes('idrogeno'), massaMinima = gigante ? 0 : Math.min(...tenuti.map((g) => GAS_DEL_CLIMA[g] ?? Infinity));
  const z = Z ?? P.Z ?? P.metallicita ?? (comp.pesanti ? comp.pesanti / 0.02 : 1), sole = abbondanze(z), Oacqua = Math.max(0, sole.O - ossigenoNellaRoccia(sole));
  // L'INVENTARIO di un pianeta solido. I gas arrivano con il ghiaccio (C, N, S in proporzione all'acqua, come nelle
  // comete) e ne esce in superficie la stessa parte che esce dell'acqua (PARTE_FUORI di leggi.js: il resto è nel
  // mantello). In più, se il disco gli ha lasciato un velo di idrogeno ed elio («involucro») e la gravità trattiene
  // l'idrogeno, quel velo è ancora lì: è l'aria primordiale, con la miscela della stella. Se non lo trattiene, è fuggito.
  const velo = conInventario && tenuti.includes('idrogeno') ? (P.involucro || 0) * P.massaKg : 0, primordiale = gigante || (conInventario ? velo > 0 : tieneH);
  let el, colonna = 0; // (kg/m²) quanta materia volatile c'è sopra ogni metro quadrato, se fosse tutta gas
  if (primordiale) { el = { H: sole.H, He: gigante || tenuti.includes('elio') ? sole.He : 0, C: sole.C, N: sole.N, O: Oacqua, S: sole.S }; colonna = velo / (4 * Math.PI * P.raggioM ** 2); }
  else {
    // acqua W, e i volatili in proporzione, la stessa per ogni metallicità: il ghiaccio è fatto degli
    // stessi atomi pesanti (anche una roccia asciutta ne porta un poco); il carbonio
    // arriva in media come CO (nei ghiacci: CO, CO2, metanolo, composti organici)
    const W = comp.acqua ?? comp.ghiaccio ?? 0, sol = abbondanze(1), V = Math.max(W, 0.001) / (sol.O - ossigenoNellaRoccia(sol));
    const C = NEI_GHIACCI.C * sol.C * V, N = NEI_GHIACCI.N * sol.N * V, S = ZOLFO_IN_ARIA * NEI_GHIACCI.S * sol.S * V, secco = String(cl.acqua || '').startsWith('vapore');
    const O = secco ? Math.min(W + C, 2 * C + 2 * S) : W + C;
    // (chi trattiene l'idrogeno ma non ha un velo primordiale non perde l'idrogeno dei suoi ghiacci: l'aria resta riducente)
    el = conInventario && tieneH ? { H: 2 * W, C, N, O, S } : { H: secco ? 0 : Math.min(2 * W, 2 * Math.max(0, O - 2 * C - 2 * S)), C, N, O, S }; // il punto d'arrivo della fuga dell'idrogeno
    // la massa di quei volatili per ogni chilo d'acqua (acqua 18, e il resto contato come CO2, N2, SO2), e quanta ne sta fuori
    if (conInventario) colonna = (PARTE_FUORI * P.massaKg * Math.max(W, 0.001) * ((secco ? 0 : 18.015 * W) + 44.01 * C + 14.007 * N + 64.06 * S)) / (18.015 * Math.max(W, 0.001)) / (4 * Math.PI * P.raggioM ** 2);
  }
  const gSup = conInventario ? (COSTANTI.G * P.massaKg) / P.raggioM ** 2 : 0;
  const T = cl.T ?? 288, Tr = Math.min(3000, Math.max(300, T)), Pr = conInventario ? Math.max(colonna * gSup, 1) : isFinite(cl.pressione) ? Math.max(cl.pressione, 1) : 1e5; // nei giganti: il livello di 1 bar
  // («memoria»: chi chiede molte arie dello stesso pianeta a temperature vicine non rifà ogni volta l'equilibrio)
  const chiaveEq = memoria ? `${Math.round(Tr / 5)}|${Pr.toPrecision(6)}|${Object.values(el).map((v) => v.toPrecision(6)).join(',')}` : null;
  const eq = (memoria && memoria.get(chiaveEq)) || equilibrio({ T: Tr, P: Pr, elementi: el, dettagli: true }), x = { ...eq.gas }; if (memoria) memoria.set(chiaveEq, eq);
  for (const f in x) if (MOLECOLE[f].massa < massaMinima * 0.99) delete x[f];
  // i tetti (Pa): ogni gas fino alla sua pressione di vapore (il resto piove, nevica o brina); con un
  // mare, la CO2 fino all'equilibrio di Urey e niente SO2
  // («co2»: la pressione di CO2 che il termostato del carbonio lascia nell'aria, se supera quella dell'equilibrio: vedi climaEAria)
  const tetto = (f) => (cl.acqua === 'liquida' && f === 'SO2' ? 0 : Math.min(pressioneVapore(T, f), cl.acqua === 'liquida' && f === 'CO2' ? Math.max(pressioneCO2Urey(T), co2) : Infinity));
  // chi supererebbe il suo tetto si ferma lì; gli altri si dividono la pressione che resta. Se di altri
  // non ce n'è (tutto è gelato) resta solo un velo di vapori, ciascuno alla sua pressione
  const fermi = new Set(), p = {};
  if (conInventario) {
    // con l'inventario ciò che gela, piove o diventa calcare ESCE dall'aria, e la pressione cala: si tolgono moli al gas
    // che supera il suo tetto finché la sua pressione parziale (la sua parte di moli × il peso di tutta la colonna) ci sta
    const n = {}; let massa = 0; for (const f in x) massa += x[f] * MOLECOLE[f].massa;
    for (const f in x) n[f] = massa > 0 ? (x[f] * colonna) / massa : 0; // («moli» per m², a meno di un fattore: massa = Σ n·M)
    for (let giro = 0; giro < 60; giro++) {
      let N = 0, peso = 0, sopra = 0; for (const f in n) { N += n[f]; peso += n[f] * MOLECOLE[f].massa * gSup; }
      if (!(N > 0)) break;
      for (const f in n) { const pf = (n[f] / N) * peso, tt = tetto(f); if (pf > tt * 1.0001) { n[f] *= Math.max(1e-12, tt / pf); sopra++; } }
      if (!sopra) break;
    }
    let N = 0, peso = 0; for (const f in n) { N += n[f]; peso += n[f] * MOLECOLE[f].massa * gSup; }
    for (const f in n) p[f] = N > 0 ? (n[f] / N) * peso : 0;
  } else for (let giro = 0; giro < 12; giro++) {
    let liberi = 0, resto = Pr; for (const f in x) { if (fermi.has(f)) resto -= tetto(f); else liberi += x[f]; }
    const veri = liberi > 1e-6 && resto > 0; let nuovi = 0;
    for (const f in x) { p[f] = fermi.has(f) ? tetto(f) : veri ? (x[f] / liberi) * resto : 0; if (p[f] > tetto(f)) { fermi.add(f); nuovi++; } }
    if (!nuovi) break;
  }
  const pressione = Object.values(p).reduce((a, v) => a + v, 0);
  if (!(pressione > 0)) return niente;
  const gas = Object.fromEntries(Object.entries(p).map(([f, v]) => [f, v / pressione]).filter(([, v]) => v > 1e-12).sort((a, b) => b[1] - a[1]));
  const { rid, oss } = redox(gas), potere = potereRiducente(gas), pO2 = ((eq.gas.O2 || 0) * Pr) / 1e5;
  // riducente: l'idrogeno che l'aria può cedere supera quello che servirebbe a ridurla, e non è una traccia (almeno l'1%)
  return { gas, riducente: rid > oss && rid > 0.01, potere, pressione, pO2, ferro: ferroStabile(Tr, pO2), fuliggine: eq.grafite };
}

// ---------- 5 bis. L'EFFETTO SERRA DAI GAS VERI, E IL CLIMA CHE NE DISCENDE
// Lo spessore ottico dell'aria per l'infrarosso (la superficie irradia σT⁴/(1 + ¾τ): leggi.js). LEGGE EMPIRICA:
//   · i gas che assorbono l'infrarosso (tre o più atomi: acqua, anidride carbonica, metano, ammoniaca…): le loro righe
//     sono larghe quanto la pressione le allarga e presto si saturano: τ = k·(colonna × pressione)^0,39, con la
//     colonna del gas in kg/m² e la pressione in bar. L'esponente (un po' meno della radice, che è la legge delle
//     righe forti) e k della CO2 sono TARATI su Terra (τ = 0,2 con 6 kg/m²) e Venere (τ = 140 in tutto, 735 K);
//     k dell'acqua sulla Terra (in tutto τ = 0,83, 288 K), k del metano su Titano (94 K). Marte (un'aria di CO2
//     di 6 millibar) è il riscontro non usato per tarare: 214 K;
//   · i gas che non assorbono (N2, O2, H2, elio): solo durante gli urti tra molecole, quindi in proporzione a
//     colonna × pressione / temperatura, cioè a quanto l'aria è fitta (sulla Terra quasi niente; su Titano, fredda e
//     densa, metà della serra: il coefficiente è TARATO lì, a 94 K);
//   · il vapore d'acqua sta nei primi chilometri (più su fa freddo e condensa): la sua colonna è un quarto di quella
//     di un'aria satura fino in cima (sulla Terra: 25 kg/m²).
// Che cosa manca: le nuvole e le foschie che assorbono o riflettono (su Titano raffreddano), le finestre tra le righe.
export const SERRA = Object.freeze({ esponente: 0.39, H2O: 0.174, CO2: 0.103, CH4: 0.018, altri: 0.1, urti: 3.1e-6, Turti: 94, vaporeInBasso: 0.25 });
const TRASPARENTI = new Set(['H2', 'He', 'N2', 'O2', 'Cl2', 'S2']);
export function serra(gas = {}, pressione, g, T = SERRA.Turti) {
  if (!isFinite(pressione)) return 2;
  if (!(pressione > 0) || !(g > 0)) return 0;
  let media = 0; for (const f in gas) media += gas[f] * (MOLECOLE[f]?.massa ?? 0);
  if (!(media > 0)) return 0;
  let tau = 0;
  for (const f in gas) {
    if (!MOLECOLE[f]) continue;
    const colonna = ((gas[f] * MOLECOLE[f].massa) / media) * (pressione / g) * (f === 'H2O' ? SERRA.vaporeInBasso : 1), x = (colonna * pressione) / 1e5;
    tau += TRASPARENTI.has(f) ? (SERRA.urti * x * SERRA.Turti) / Math.max(T, 10) : (SERRA[f] ?? (Object.values(MOLECOLE[f].atomi).reduce((a, b) => a + b, 0) >= 3 ? SERRA.altri : SERRA.altri / 5)) * Math.pow(x, SERRA.esponente);
  }
  return tau;
}

// IL CLIMA E L'ARIA INSIEME. La temperatura dipende dall'aria (quanta ce n'è, quanto trattiene il calore) e l'aria
// dalla temperatura (che cosa gela, che cosa piove, se c'è un mare che si mangia l'anidride carbonica): si cercano
// insieme, a giri alterni, finché non cambiano più. «dati» è ciò che serve a clima() di leggi.js (luce, distanza,
// massa, raggio, tipo, acqua, anno, asse, placche…) più composizione e involucro del pianeta.
// IL TERMOSTATO DEL CARBONIO. Dove c'è un mare la pioggia porta l'anidride carbonica nel calcare (Urey) e l'aria ne
// resta senza; ma se così il mare gela, la pioggia smette, i vulcani continuano, e la CO2 torna ad accumularsi
// finché il ghiaccio non si scioglie (Walker, Hays e Kasting 1981). Nessuno dei due stati sta fermo: il pianeta si
// assesta sulla MINIMA anidride carbonica che tiene il mare aperto. È quella che si cerca qui (clima.termostato).
// Se nemmeno tutta la CO2 che ha basta, il pianeta è gelato; se è troppo caldo anche senza, il mare bolle e l'acqua
// se ne va (Venere): tutta la CO2 resta nell'aria.
// → { clima, atmosfera }: clima.pressione è quella dell'aria vera e clima.tau la serra dei suoi gas.
export function climaEAria(dati, { Z } = {}) {
  const P = { tipo: dati.tipo, massaKg: dati.massaKg, raggioM: dati.raggioM, composizione: dati.composizione || {}, involucro: dati.involucro || 0 };
  const primo = clima(dati); // (con le leggi di riserva: dice che cosa la gravità trattiene, e da che temperatura cominciare)
  if (dati.tipo === 'gassoso') return { clima: primo, atmosfera: atmosfera({ ...P, clima: primo }, { Z }) };
  const memoria = new Map(), ariaDi = (T, stato, co2 = 0) => atmosfera({ ...P, clima: { ...primo, T, acqua: stato } }, { Z, inventario: true, co2, memoria });
  // (Taria: la temperatura a cui quell'aria è stata calcolata; a giri fermi è quella del clima)
  const climaDi = (atm, T) => Object.assign(clima({ ...dati, aria: { pressione: atm.pressione, tau: serra(atm.gas, atm.pressione, primo.g, T) } }), { Taria: T });
  // con l'acqua in uno stato dato: l'aria a una temperatura, il clima che ne viene, l'aria a quella temperatura… finché si fermano
  // IL CICLO DEL CARBONIO (se chi chiama dà il calore dell'interno, «calore» in W/m²): sopra un mare l'anidride carbonica
  // non scende fino all'equilibrio di Urey (ci arriverebbe in un tempo infinito): si ferma dove le rocce consumate dalla
  // pioggia ne prendono quanta i vulcani ne emettono (co2DelCiclo, più sotto). È la stessa CO2 che sta sciolta nel mare:
  // aria e mare sono un serbatoio solo (mare.js legge questa pressione, e la ricalcola con le terre e le piogge vere).
  const ciclo = (T, c0) => (dati.calore > 0 && T > 273 ? 1e5 * co2DelCiclo({ T, calore: dati.calore, raggioM: dati.raggioM, massaKg: dati.massaKg, composizione: dati.composizione, terre: (1 - (c0?.mare ?? primo.mare ?? 0.7)) * (1 - (c0?.ghiaccio ?? 0)), continenti: dati.placche ? 1 : 0 }) : 0);
  const cerca = (stato, T0, co2 = 0, giri = 5) => { let T = T0, r = null, cc = co2; for (let k = 0; k < (stato === 'liquida' && dati.calore > 0 ? giri + 3 : giri); k++) { if (stato === 'liquida') cc = Math.max(co2, ciclo(T, r?.c)); const a = ariaDi(T, stato, cc), c = climaDi(a, T); r = { a, c, co2: cc }; if (Math.abs(c.T - T) < 1) break; T = k < 2 ? c.T : (T + c.T) / 2; } if (r && stato === 'liquida' && cc > 0) r.c.co2Ciclo = cc; return r; };
  const esce = (r, altro = {}) => ({ clima: Object.assign(r.c, altro), atmosfera: r.a });
  if (!(dati.acqua > 0)) return esce(cerca('assente', primo.T));
  // 0. un mondo di ghiaccio è nato al freddo, oltre la linea della neve, e non è mai stato caldo abbastanza a lungo da
  // tenere nell'aria i suoi ghiacci (acqua, anidride carbonica, ammoniaca, metano): se da gelato sta in equilibrio,
  // gelato è. (Un pianeta di roccia nasce caldo: per lui si parte dal mare, e gelato è solo se non può fare altro.)
  if (dati.tipo === 'ghiacciato') { const gelo = cerca('ghiaccio', Math.min(primo.T, 150)); if (gelo.c.acqua === 'ghiaccio') return esce(gelo); }
  // 1. con il mare liquido (e quindi senza anidride carbonica nell'aria)
  const mare = cerca('liquida', Math.max(primo.T, 275));
  if (mare.c.acqua === 'liquida') return esce(mare);
  // 2. troppo caldo: il mare non c'è, l'acqua è persa, tutta la CO2 è nell'aria
  if (mare.c.acqua.startsWith('vapore')) return esce(cerca('vapore', mare.c.T));
  // 3. il mare gela: il termostato. Con tutta la CO2 che ha, si scioglie? Se sì, si cerca la minima che basta
  const prova = (co2) => { const a = ariaDi(275, 'liquida', co2), c = climaDi(a, 275); return { a, c, co2 }; };
  const tutta = prova(1e12);
  if (tutta.c.acqua !== 'ghiaccio') {
    let lo = Math.log(pressioneCO2Urey(275)), hi = Math.log(Math.max(1, (tutta.a.gas.CO2 || 0) * tutta.a.pressione)), scelto = tutta.c.acqua === 'liquida' ? tutta : null;
    for (let k = 0; k < 7; k++) { const m = (lo + hi) / 2, r = prova(Math.exp(m)); if (r.c.acqua === 'ghiaccio') lo = m; else { hi = m; if (r.c.acqua === 'liquida') scelto = r; } }
    // (proprio sulla soglia il mare è in bilico e ci mette un'eternità ad assestarsi: il pianeta sta un passo sopra, un terzo di CO2 in più)
    if (scelto) { const sopra = prova(scelto.co2 * 1.33); if (sopra.c.acqua === 'liquida') scelto = sopra; return esce(scelto, { termostato: scelto.co2 }); }
  }
  // 4. gelato: nemmeno tutta la sua anidride carbonica (che al freddo gela anche lei) lo scioglie
  return esce(cerca('ghiaccio', Math.min(mare.c.T, 270)));
}

// ---------- 6. I MINERALI DELLA SUPERFICIE E IL LORO COLORE
// LA ROCCIA. Il mantello ha gli atomi nelle proporzioni del Sole (magnesio, silicio, alluminio, calcio;
// sodio e potassio, volatili, in parte persi; il ferro quasi tutto sceso nel nucleo). La crosta è ciò che
// fonde per primo: nel fuso ogni elemento si concentra secondo la legge della fusione parziale,
//     nel fuso / nella roccia = 1 / (D + F·(1 − D)),
// F la parte che fonde, D quanto l'elemento preferisce restare nel solido (il magnesio resta, il
// potassio scappa). Una fusione del mantello dà il basalto, scuro, dei fondali e dei mondi senz'acqua;
// una seconda fusione del basalto, che avviene solo con l'acqua, dà il granito chiaro dei continenti.
// I MINERALI sono quelli che gli atomi permettono (la «norma» dei petrologi): potassio e sodio fanno i
// feldspati con l'alluminio, il calcio il plagioclasio; magnesio e ferro prendono la silice che resta:
// se basta fanno pirosseno (un silicio per atomo), se avanza c'è quarzo, se manca olivina (mezzo
// silicio per atomo). Più magnesio rispetto al silicio, più olivina.
// IL FERRO segue l'ossigeno: senza, resta metallo; con poco è ferroso, dentro i silicati (che scurisce);
// con molto è ferrico: magnetite nera (FeO·Fe2O3) finché c'è ferro ferroso, poi ematite rossa.
// Sotto 170 K il ghiaccio non sublima nemmeno nel vuoto: copre la superficie. Dove l'acqua c'era ed è
// evaporata restano i suoi sali.
// Dati misurati: i coefficienti D (valori d'insieme, tarati perché il mantello della Terra dia il
// basalto dei fondali e questo il granito), F = 10% e 20%, sodio e potassio rimasti
// (un quarto), la copertura di mari, ghiacci e sali (stima semplice, tarata sui mari della Terra),
// i sali dei mari terrestri (85% salgemma, 15% gesso), i colori dei minerali in polvere (sRGB).
const D_MANTELLO = { Si: 0.88, Mg: 5.4, Fe: 0.75, Al: 0.21, Ca: 0.24, Na: 0.05, K: 0.002 }, F_BASALTO = 0.1;
const D_BASALTO = { Si: 0.63, Mg: 13, Fe: 4.6, Al: 1.08, Ca: 7.6, Na: 0.70, K: 0.01 }, F_GRANITO = 0.2;
const VOLATILI_RIMASTI = 0.25, FERRO_TERRA = 0.33, CONTINENTI = 0.3;
const fondi = (roccia, D, F) => Object.fromEntries(Object.entries(roccia).map(([e, v]) => [e, v / (D[e] + F * (1 - D[e]))]));
// i colori: per olivina e pirosseno dal termine di magnesio (chiaro) a quello di ferro (scuro)
const COLORI = {
  olivina: [[140, 152, 86], [74, 66, 44]], pirosseno: [[146, 142, 124], [46, 48, 42]], plagioclasio: [206, 204, 197],
  'feldspato potassico': [218, 186, 168], quarzo: [226, 222, 214], periclasio: [228, 226, 218], 'ferro metallico': [118, 118, 122],
  magnetite: [38, 38, 42], ematite: [152, 62, 42], 'ghiaccio d\'acqua': [232, 238, 244], salgemma: [240, 236, 228], gesso: [236, 230, 218],
};
const FORMULE = { olivina: '(Mg,Fe)2SiO4', pirosseno: '(Mg,Fe,Ca)SiO3', plagioclasio: 'NaAlSi3O8–CaAl2Si2O8', 'feldspato potassico': 'KAlSi3O8', quarzo: 'SiO2', periclasio: '(Mg,Fe)O', 'ferro metallico': 'Fe', magnetite: 'Fe3O4', ematite: 'Fe2O3', 'ghiaccio d\'acqua': 'H2O', salgemma: 'NaCl', gesso: 'CaSO4·2H2O' };
// la norma di una roccia (atomi) con il suo ferro al grado di ossidazione o → masse dei minerali
function norma(r, o) {
  const metallo = r.Fe * Math.max(0, 1 - 2 * o), ferrico = r.Fe * Math.max(0, 2 * o - 1); let ferroso = r.Fe - metallo - ferrico;
  const mt = Math.min(ferrico / 2, ferroso), em = (ferrico - 2 * mt) / 2; ferroso -= mt;
  let { Si, Al, Ca } = r; const Mg = r.Mg;
  const or = Math.min(r.K, Al, Si / 3); Al -= or; Si -= 3 * or;
  const ab = Math.min(r.Na, Al, Si / 3); Al -= ab; Si -= 3 * ab;
  const an = Math.min(Ca, Al / 2, Si / 2); Ca -= an; Si -= 2 * an;
  let M = Mg + ferroso; const xFe = M > 0 ? ferroso / M : 0, di = Math.min(Ca, M, Si / 2); M -= di; Si -= 2 * di; // il calcio che avanza entra nel pirosseno
  const px = Si >= M ? M : Math.max(0, 2 * Si - M), ol = Si >= M ? 0 : Math.min(M - Si, Si), qz = Math.max(0, Si - M), ossido = Math.max(0, M - px - 2 * ol);
  const mFe = ELEMENTI.Fe.massa - ELEMENTI.Mg.massa, m = (f) => massaDi(f);
  return { xFe, masse: {
    'feldspato potassico': or * m('KAlSi3O8'), plagioclasio: ab * m('NaAlSi3O8') + an * m('CaAl2Si2O8'),
    pirosseno: di * (m('CaMgSi2O6') + xFe * mFe) + px * (m('MgSiO3') + xFe * mFe), olivina: ol * (m('Mg2SiO4') + 2 * xFe * mFe),
    quarzo: qz * m('SiO2'), periclasio: ossido * (m('MgO') + xFe * mFe), 'ferro metallico': metallo * m('Fe'), magnetite: mt * m('Fe3O4'), ematite: em * m('Fe2O3'),
  } };
}
// composizione: quella del pianeta ({ ferro, roccia, acqua } o { ghiaccio, roccia, ferro }; in più, se
//   si vuole, MgSi = atomi di magnesio per atomo di silicio: nel Sole 1,23);
// ossidato: vero/falso, o un grado tra 0 (ferro metallico) e 1 (tutto ferrico): falso vale 0,4 (ferro
//   ferroso nei silicati e un po' di metallo, come nel suolo della Luna e nelle meteoriti), vero vale 1;
//   si può passare ferroStabile(T, pO2).grado;
// acqua: lo stato dell'acqua come lo dà clima() ('liquida', 'ghiaccio', 'vapore…', 'assente'), oppure
//   vero (c'è) / falso (non c'è più: se la composizione ne aveva, è evaporata);
// continente: quanta parte della crosta è granito (0…1); se manca, 0,3 dove c'è acqua, 0 altrimenti;
// fusione: quanta parte del mantello fonde per fare la crosta (0,1 se manca; un interno più caldo fonde
//   di più e dà lave più ricche di magnesio e di olivina; 1 = la roccia del mantello così com'è).
// → [{ nome, formula, frazione (in massa, somma 1), colore: [r, g, b] }], dal più abbondante
export function minerali({ composizione = {}, T = 288, ossidato = false, acqua, continente, fusione = F_BASALTO } = {}) {
  const w = composizione.acqua ?? composizione.ghiaccio ?? (acqua === true ? 0.02 : 0), stato = typeof acqua === 'string' ? acqua : '';
  const ce = w > 0 && acqua !== false && stato !== 'assente', evaporata = w > 0 && T >= 170 && (acqua === false || stato === 'evaporata' || stato.startsWith('vapore'));
  const o = ossidato === true ? 1 : !ossidato ? 0.4 : Math.min(1, Math.max(0, +ossidato));
  const fe = composizione.ferro ?? 0.32, sassi = composizione.roccia ?? 1 - fe, sole = abbondanze(1), su = (e) => sole[e] / sole.Si;
  const mantello = { Si: 1, Mg: composizione.MgSi ?? su('Mg'), Fe: (FE_NEI_SILICATI * su('Fe') * (fe / (fe + sassi))) / FERRO_TERRA, Al: su('Al'), Ca: su('Ca'), Na: VOLATILI_RIMASTI * su('Na'), K: VOLATILI_RIMASTI * su('K') };
  const basalto = fondi(mantello, D_MANTELLO, Math.min(1, Math.max(0.01, fusione))), cont = Math.min(1, Math.max(0, continente ?? (w > 0.005 ? CONTINENTI : 0)));
  const copre = Math.min(0.95, w / (w + 0.01)), ghiaccio = ce && (T < 170 || stato === 'ghiaccio') ? copre : 0, sali = evaporata ? 0.25 * copre : 0;
  const parti = {}, metti = (nome, f, colore) => { if (f > 1e-9) { parti[nome] ??= { f: 0, c: [0, 0, 0] }; const p = parti[nome]; p.c = p.c.map((v, i) => (v * p.f + colore[i] * f) / (p.f + f)); p.f += f; } };
  for (const [roccia, quota] of [[basalto, 1 - cont], [cont > 0 ? fondi(basalto, D_BASALTO, F_GRANITO) : basalto, cont]]) {
    if (!(quota > 0)) continue;
    const { masse, xFe } = norma(roccia, o), tot = Object.values(masse).reduce((a, v) => a + v, 0), scuro = Math.min(1, 2 * xFe); // mezzo ferro basta a farli quasi neri
    for (const nome in masse) { const c = COLORI[nome]; metti(nome, (masse[nome] / tot) * quota * (1 - ghiaccio - sali), Array.isArray(c[0]) ? c[0].map((v, i) => v + (c[1][i] - v) * scuro) : c); }
  }
  metti('ghiaccio d\'acqua', ghiaccio, COLORI['ghiaccio d\'acqua']); metti('salgemma', 0.85 * sali, COLORI.salgemma); metti('gesso', 0.15 * sali, COLORI.gesso);
  const somma = Object.values(parti).reduce((a, p) => a + p.f, 0);
  return Object.entries(parti).map(([nome, p]) => ({ nome, formula: FORMULE[nome], frazione: p.f / somma, colore: p.c.map(Math.round) })).sort((a, b) => b.frazione - a.frazione);
}
// il colore di una roccia fatta di più minerali. Non è la media dei colori: in una polvere la luce
// rimbalza tra i grani e basta poco di un minerale scuro per assorbirla (poca ematite arrossa tutto
// Marte). Legge di Kubelka-Munk: ciò che si somma è il rapporto tra assorbimento e diffusione,
// K/S = (1 − R)² / 2R, con R la luce riflessa in ciascun colore. → [r, g, b]
export function coloreRoccia(lista = []) {
  const tot = lista.reduce((a, m) => a + m.frazione, 0); if (!(tot > 0)) return [0, 0, 0];
  return [0, 1, 2].map((i) => {
    let ks = 0; for (const m of lista) { const R = Math.max(1e-4, Math.pow(m.colore[i] / 255, 2.2)); ks += (m.frazione / tot) * ((1 - R) ** 2) / (2 * R); }
    return Math.round(255 * Math.pow(1 + ks - Math.sqrt(ks * ks + 2 * ks), 1 / 2.2));
  });
}

// ---------- 7. LA CHIMICA CHE PREPARA LA VITA
// LEGGE EMPIRICA (non calcolata). Fulmini e luce ultravioletta spezzano le molecole dell'aria; i pezzi
// si ricombinano in acido cianidrico (HCN, da cui amminoacidi e basi) e formaldeide (H2CO, da cui gli
// zuccheri). Gli esperimenti dicono che la resa dipende da quanto l'aria è riducente: con metano,
// ammoniaca e idrogeno (Miller e Urey 1953) è alta; con anidride carbonica e azoto senza idrogeno è
// centinaia o migliaia di volte più bassa, e risale quando H2 supera CO2 (Schlesinger e Miller 1983;
// Stribling e Miller 1987). Qui: una curva a saturazione nel potere riducente, con gli ordini di
// grandezza di quegli esperimenti (pavimento 1/1000 per HCN, 3/1000 per la formaldeide, che un poco si
// forma anche da CO2 e acqua alla luce: Pinto e altri 1980), per gli ingredienti che ci sono: carbonio
// e azoto per HCN; carbonio, ossigeno e idrogeno per H2CO. Idrogeno ed elio non assorbono l'ultravioletto:
// l'energia la prendono gli altri gas, e contano le proporzioni tra quelli.
// AUTOCATALISI: la reazione del formosio (Butlerov 1861; il ciclo di Breslow 1959), in cui la
// formaldeide diventa zuccheri che aiutano altra formaldeide a diventarlo, chiede tre cose: formaldeide,
// acqua liquida, e un minerale basico che la avvii (calcio o magnesio: olivina, pirosseno, plagioclasio).
// atmosfera: il risultato di atmosfera(), o solo { formula: frazione }; energia: 1 = quella di riferimento;
// in più, se si vuole: pressione (Pa), acqua (lo stato, come da clima), minerali (la lista di minerali();
// se manca si suppone una crosta di basalto, che i minerali basici li ha sempre).
// → { HCN, formaldeide (tassi relativi: 1 = il massimo a energia 1), potere, acquaLiquida, basico, autocatalisi }
const RESA_OSSIDATA = { HCN: 1e-3, formaldeide: 3e-3 }, MEZZA_RESA = 0.3, SOGLIA_FORMOSIO = 0.01, BASICI = ['olivina', 'pirosseno', 'plagioclasio', 'periclasio'];
export function prebiotica({ atmosfera: atm = {}, T = 288, energia = 1, pressione, acqua, minerali: lista = null } = {}) {
  const gas = atm.gas || atm, potere = potereRiducente(gas), curva = ((potere * potere) / (potere * potere + MEZZA_RESA ** 2)) * (1 + MEZZA_RESA ** 2);
  let attivi = 0, c = 0, n = 0, ox = 0, h = (gas.H2 || 0) > 0.01 ? Infinity : 0;
  for (const f in gas) { const a = MOLECOLE[f]?.atomi; if (!a || f === 'H2' || f === 'He') continue; attivi += gas[f]; c += (a.C || 0) * gas[f]; n += (a.N || 0) * gas[f]; ox += (a.O || 0) * gas[f]; h += (a.H || 0) * gas[f]; }
  const ingredienti = (...q) => (attivi > 0 ? Math.min(1, (2 * Math.min(...q)) / attivi) : 0), resa = (k) => RESA_OSSIDATA[k] + (1 - RESA_OSSIDATA[k]) * curva;
  const HCN = energia * resa('HCN') * ingredienti(c, n), formaldeide = energia * resa('formaldeide') * ingredienti(c, ox, h);
  const acquaLiquida = (acqua ?? statoAcqua(T, pressione ?? atm.pressione ?? 1e5)) === 'liquida' && (acqua === 'liquida' || (gas.H2O || 0) > 0);
  const basico = lista ? lista.some((m) => BASICI.includes(m.nome) && m.frazione > 0.01) : true;
  return { HCN, formaldeide, potere, acquaLiquida, basico, autocatalisi: formaldeide >= SOGLIA_FORMOSIO && acquaLiquida && basico };
}

// ---------- 8. LE ROCCE CHE LA PIOGGIA CONSUMA, E IL CICLO DEL CARBONIO
// (È la fonte unica per l'aria e per il mare: climaEAria qui sopra e mare.js usano queste stesse funzioni.)
// LA ROCCIA. Mantello, basalto e granito sono quelli del §6 (stessi coefficienti), in moli per chilo; ogni elemento sta
// nel minerale che la norma gli assegna. In più ciò che il mantello ha tenuto di cloro, zolfo e carbonio rispetto alle
// proporzioni del Sole: DATI MISURATI sul mantello primitivo della Terra (McDonough e Sun 1995: Cl 17 ppm, S 250 ppm,
// C 120 ppm).
// QUANTO SE NE SCIOGLIE. Ogni minerale si scioglie con la velocità misurata in laboratorio (Palandri e Kharaka 2004,
// USGS OFR 2004-1068): un termine «neutro» e uno «acido» che cresce con l'acidità dell'acqua, v = k_n + k_a·[H⁺]^n,
// ciascuno con la sua energia di attivazione (Arrhenius: al caldo più in fretta). L'acqua del suolo è pioggia in
// equilibrio con l'anidride carbonica dell'aria: [H⁺] = √(K·pCO2), con CO2 + H2O ⇌ H⁺ + HCO3⁻ (log K = −7,82 a 25 °C,
// ΔH = −10,6 kJ/mol): più CO2, più acido, rocce consumate più in fretta. In natura un granello invecchia: la sua
// velocità cala col tempo come t^−0,61 (White e Brantley 2003, su suoli da 10 a 3 milioni di anni; in laboratorio, dopo
// un anno, è quella del minerale fresco), per unità di superficie misurata col gas (1 m²/g nei suoli: White e altri
// 1996). Il granello resta nel suolo finché l'erosione non lo porta via: spessore del suolo / denudazione (1 m; 30 m
// per milione di anni dove piove: la stessa legge empirica di geologia.js).
// IL CICLO. I vulcani emettono l'anidride carbonica del mantello che fonde (il magma porta un decimo del calore
// dell'interno; il carbonio sta tutto nel fuso: sulla Terra ne escono così 8·10¹² mol l'anno, misurate 6-10). Ogni
// carica di catione che la pioggia scioglie dai silicati ne porta via una molecola, che finisce nel calcare. A regime
// le due cose si pareggiano (Walker, Hays e Kasting 1981): co2DelCiclo cerca la pressione di CO2 a cui succede.
// Che cosa manca: l'effetto della pioggia (qui le terre bagnate sono date), il carbonio dei sedimenti che torna con i
// vulcani delle fosse (qui il carbonio del mantello non si consuma), la vita (che sulla Terra accelera il suolo).
export const ROCCE = Object.freeze({ denudazione: 3e-5, densita: 2700, suolo: 1, superficieGrani: 1000, invecchia: 0.61,
  magma: 0.1, caloreMagma: 1.7e6, // il magma porta un decimo del calore; J per kg di magma (1300 K di salto + calore di fusione)
  rimasto: { Cl: 17e-6 / 35.45e-3, S: 250e-6 / 32.06e-3, C: 120e-6 / 12.011e-3 }, // mol per kg di mantello
  acidoCarbonico: [-7.82, -10.6] }); // log K a 25 °C e ΔH (kJ/mol) di CO2(gas) + H2O ⇌ H⁺ + HCO3⁻
// velocità a 25 °C (log₁₀ mol/m²/s) ed energia di attivazione (kJ/mol) del termine neutro; massa molare (kg/mol); poi
// il termine acido: velocità, esponente di [H⁺], energia di attivazione
export const MINERALI_ROCCIA = Object.freeze({ albite: [-12.56, 69.8, 0.262, -10.16, 0.457, 65.0], ortoclasio: [-12.41, 38.0, 0.278, -10.06, 0.5, 51.7], anortite: [-9.12, 17.8, 0.278, -3.5, 1.411, 16.6],
  pirosseno: [-11.11, 40.6, 0.217, -6.36, 0.71, 96.1], olivina: [-10.64, 79.0, 0.141, -6.85, 0.47, 67.2], quarzo: [-13.99, 87.7, 0.06, -99, 0, 0] });
const OSSIDI = { Si: 60.08, Mg: 40.30, Fe: 71.84, Al: 50.98, Ca: 56.08, Na: 30.99, K: 47.10 };
export function rocceDelPianeta(P = {}) {
  const comp = P.composizione || {}, fe = comp.ferro ?? 0.32, sassi = comp.roccia ?? 1 - fe, sole = abbondanze(1), su = (e) => sole[e] / sole.Si;
  const mantello = { Si: 1, Mg: comp.MgSi ?? su('Mg'), Fe: (FE_NEI_SILICATI * su('Fe') * (fe / (fe + sassi))) / FERRO_TERRA, Al: su('Al'), Ca: su('Ca'), Na: VOLATILI_RIMASTI * su('Na'), K: VOLATILI_RIMASTI * su('K') };
  const basalto = fondi(mantello, D_MANTELLO, F_BASALTO), granito = fondi(basalto, D_BASALTO, F_GRANITO);
  const perKg = (r) => { let m = 0; for (const e in r) m += r[e] * OSSIDI[e]; const o = {}; for (const e in r) o[e] = (1000 * r[e]) / m; return o; };
  // chi ospita che cosa (la norma): potassio e sodio nei feldspati con l'alluminio, il calcio nell'anortite finché c'è
  // alluminio e poi nel pirosseno, il magnesio nel pirosseno o, se la silice non basta, nell'olivina
  const ospiti = (r) => { const or = Math.min(r.K, r.Al), ab = Math.min(r.Na, r.Al - or), an = Math.min(r.Ca, (r.Al - or - ab) / 2), M = r.Mg + r.Fe, Si = r.Si - 3 * or - 3 * ab - 2 * an - (r.Ca - an);
    return { anortite: r.Ca > 0 ? an / r.Ca : 0, olivina: Si >= M ? 0 : Math.min(1, (2 * Math.min(M - Si, Math.max(Si, 0))) / M) }; };
  return { mantello: { ...perKg(mantello), ...ROCCE.rimasto }, basalto: { ...perKg(basalto), ospiti: ospiti(basalto) }, granito: { ...perKg(granito), ospiti: ospiti(granito) }, fusione: F_BASALTO };
}
// l'acidità dell'acqua del suolo sotto una pressione di CO2 (bar): [H⁺] (mol/kg), mai meno dell'acqua pura
export const acidoDelSuolo = (pCO2, T = 288) => Math.max(1e-7, Math.sqrt(Math.pow(10, ROCCE.acidoCarbonico[0]) * Math.exp(((-1000 * ROCCE.acidoCarbonico[1]) / R_GAS) * (1 / T - 1 / 298.15)) * Math.max(0, pCO2)));
// quanta parte di un minerale si scioglie nel tempo che il granello resta nel suolo (anni), a T, con l'acqua acida aH
export function sciolto(minerale, T, anni, aH = 2.2e-6) {
  const [ln, En, M, la, n, Ea] = MINERALI_ROCCIA[minerale], ar = (E) => Math.exp(((-1000 * E) / R_GAS) * (1 / T - 1 / 298.15));
  const v = Math.pow(10, ln) * ar(En) + (la > -90 ? Math.pow(10, la) * ar(Ea) * Math.pow(aH, n) : 0);
  // il tempo «utile»: il primo anno a velocità piena, poi sempre più piano (l'integrale di t^−0,61)
  const utile = anni <= 1 ? anni : 1 + (Math.pow(anni, 1 - ROCCE.invecchia) - 1) / (1 - ROCCE.invecchia);
  return 1 - Math.exp(-v * ROCCE.superficieGrani * M * utile * 3.156e7);
}
// ciò che un kg di roccia consumata cede all'acqua (mol), a T e sotto pCO2 (bar); quanta della sua massa diventa argilla
export function rilascio(roccia, T, pCO2 = 2.8e-4) {
  const t = ROCCE.suolo / ROCCE.denudazione, o = roccia.ospiti, aH = acidoDelSuolo(pCO2, T), f = (m) => (T > 271 ? sciolto(m, T, t, aH) : 0);
  const fAb = f('albite'), fOr = f('ortoclasio'), fAn = f('anortite'), fPx = f('pirosseno'), fOl = f('olivina');
  const Na = roccia.Na * fAb, K = roccia.K * fOr, Ca = roccia.Ca * (o.anortite * fAn + (1 - o.anortite) * fPx), Mg = roccia.Mg * (o.olivina * fOl + (1 - o.olivina) * fPx);
  return { Na, K, Ca, Mg, Si: 2 * Na + 2 * K + 0.5 * Mg, // la silice che i feldspati cedono diventando argilla (2 su 3), e metà di quella dei pirosseni
    cariche: Na + K + 2 * Ca + 2 * Mg, argilla: Math.min(1, roccia.Na * fAb * 0.262 + roccia.K * fOr * 0.278 + roccia.Ca * o.anortite * fAn * 0.278 + (roccia.Mg + roccia.Fe) * fPx * 0.1) };
}
// i vulcani: il magma (kg/anno), il mantello che fonde per farlo, e l'anidride carbonica che ne esce (mol/anno)
export function vulcani({ calore, raggioM, composizione }) {
  const magma = (ROCCE.magma * Math.max(0, calore) * 4 * Math.PI * raggioM * raggioM * 3.156e7) / ROCCE.caloreMagma, fuso = magma / F_BASALTO;
  return { magma, fuso, CO2: fuso * ROCCE.rimasto.C, rocce: rocceDelPianeta({ composizione }) };
}
// la pressione di CO2 (bar) a cui le rocce consumate ne prendono quanta i vulcani ne emettono. «terre»: la parte della
// superficie emersa e bagnata dalla pioggia; «continenti»: quanta di quella è granito (il resto basalto). Si può dare
// «consumo(pCO2)» (mol/anno) per fare il conto con una carta vera delle terre e delle temperature (lo fa mare.js).
export function co2DelCiclo({ T = 288, calore, raggioM, massaKg, composizione, terre = 0.3, continenti = 1, consumo = null, emissione = null } = {}) {
  const v = vulcani({ calore, raggioM, composizione }), fonte = emissione ?? v.CO2; if (!(fonte > 0)) return 0;
  const massa = ROCCE.denudazione * ROCCE.densita * 4 * Math.PI * raggioM * raggioM * Math.max(0, terre);
  const prende = consumo || ((p) => massa * (continenti * rilascio(v.rocce.granito, T, p).cariche + (1 - continenti) * rilascio(v.rocce.basalto, T, p).cariche));
  if (prende(100) < fonte) return 100; // nemmeno sotto cento bar le rocce tengono il passo: la CO2 si accumula (qui ci si ferma)
  let lo = Math.log(1e-9), hi = Math.log(100); for (let k = 0; k < 40; k++) { const m = 0.5 * (lo + hi); if (prende(Math.exp(m)) > fonte) hi = m; else lo = m; }
  return Math.exp(0.5 * (lo + hi));
}
