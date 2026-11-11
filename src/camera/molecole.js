// molecole.js — LA CHIMICA GENERALE: qualsiasi molecola dai suoi atomi e dai suoi legami, senza elenchi di molecole.
//
// chimica.js conosce 41 specie con entalpia ed entropia tabulate: ciò che non è nell'elenco, in quel mondo non può
// esistere. Qui le regole sono CHIUSE (INTRECCIO.md, regola 2): dicono che cosa può esistere e accadere per ogni grafo
// di atomi che le leggi ammettono. Nessuno costruirà a mano una macchina molecolare; ma una storia di chimica deve
// poterla costruire. Il modulo è diviso in parti (ognuna con la sua intestazione):
//   molecole_atomi.js     gli elementi 1-36 e il molibdeno: gusci, carica efficace, valenze, raggi, elettronegatività
//   molecole_grafo.js     le molecole come grafi; lettura (SMILES semplificato), validità, chiave canonica, R e S
//   molecole_forma.js     la forma in tre dimensioni (VSEPR, lunghezze, angoli, torsioni, anelli)
//   molecole_energia.js   entalpia, entropia, energia libera a T e P; in acqua: idratazione, pKa, stati di protonazione
//   molecole_reazioni.js  le reazioni come regole generali sui siti; barriere e velocità; catalisi; fotolisi
//   molecole_forze.js     il campo di forze; chi si scioglie e chi si aggrega; polimeri; grana grossa; scena 3D
//   molecole_rete.js      la rete delle reazioni di un luogo; equilibrio; cicli autocatalitici; RAF; anfifiliche
//
// LEGGI (ricavate o applicate in generale):
//   · struttura elettronica: riempimento dei gusci (Madelung), regole di Slater → raggio, ionizzazione, elettronegatività
//     di Allred e Rochow; ottetto e duetto, valenze espanse dal terzo periodo, cariche formali;
//   · grafi: validità di qualunque grafo; aromaticità di Hückel; chiave canonica; priorità di Cahn, Ingold e Prelog;
//   · forma: domini elettronici (VSEPR), raggi covalenti, coniugazione delle coppie solitarie;
//   · energia: additività dei legami con le interazioni tra vicini (Allen 1959) e la tensione d'anello; Pauling per i
//     legami senza dati; Sackur-Tetrode, rotatore rigido, oscillatori armonici, rotori frenati; Born per gli ioni;
//     effetto induttivo sui pKa; somma sugli stati di protonazione (energia trasformata a un pH);
//   · reazioni: nove famiglie di passi elementari sui siti; Marcus per le barriere, Eyring per le velocità; Brønsted per
//     la catalisi acido-base; un fotone che supera la soglia di assorbimento e l'energia del legame lo spezza;
//   · forze: molle, Lennard-Jones, Coulomb con cariche da differenze di elettronegatività, solvente implicito;
//   · rete: minimo dell'energia di Gibbs con gli atomi conservati; autocatalisi stechiometrica; RAF.
// DATI (misurati; la fonte è accanto a ogni tabella, nel file dove sta):
//   · atomi: PubChem (IUPAC, NIST), Cordero 2008, Pyykkö 2009, CODATA; parametri di UFF e QEq (Rappé e altri 1991-92);
//   · ΔHf di 89 molecole di riferimento (NIST WebBook) → 75 termini di legame; ΔG di idratazione di 70 molecole
//     (FreeSolv, costanti di Henry) → i contributi dei siti; pKa di base per classe di sito (CRC; Perrin 1981) e σ
//     induttive (Charton 1981); numeri d'onda caratteristici dei piegamenti; raggi ionici (Shannon 1976);
//   · barriere intrinseche di Marcus per famiglia, ciascuna da una velocità misurata (INTRINSECHE in molecole_reazioni.js);
//   · soglie di assorbimento ultravioletto per tipo di elettroni; CMC del dodecanoato; volumi e lunghezze di Tanford.
// PARAMETRI LIBERI (scelti da noi: da eliminare):
//   · κ = 2,6 delle cariche parziali (tarato sull'acqua TIP3P); costante dielettrica 8r in acqua; +0,5 kJ/mol per un
//     atomo polare coperto; 30× delle superfici; 10^(1,5·carica) degli ioni metallici; i tre numeri di logKComplesso;
//   · le larghezze della regressione (3 kJ/mol sui dati, 60-120 sulla riserva); l'area delle teste 20 + 6·n + 28·q² Å².
// SEMPLIFICAZIONI:
//   · gli idrogeni stanno sul loro atomo; cis e trans dei doppi legami non sono distinti (lo sono R e S); niente isotopi;
//   · ΔHf di ioni in fase gas per classi rozze; in acqua gli ioni passano dal pKa (bene) o da Born (male: vedi sotto);
//   · gli stati di protonazione sono in equilibrio dentro ogni specie; i complessi dei metalli con una regola di logK;
//   · le barriere dipendono solo dalla famiglia e da ΔG, non dall'ingombro né dall'orbitale; le reazioni concertate a
//     più centri (pericicliche), i riarrangiamenti di scheletro, il trasferimento di un elettrone tra ioni metallici e
//     molecole non ci sono; l'ossidoriduzione passa solo per H2 e per lo scambio di due idrogeni;
//   · il solvente è implicito: niente molecole d'acqua esplicite attorno al soluto (quelle le disegna mare.js);
//   · la rete fa reagire ogni specie solo con le molecole piccole e taglia per taglia, ΔG e velocità (dichiarati).
// CHE COSA NON TORNA (le prove stampano i numeri):
//   · Slater: ionizzazione entro il 44% in media, raggi il 30%; Allred-Rochow sbaglia F, O e H con i raggi di Cordero;
//   · ΔHf: 2-3 kJ/mol sui riferimenti, 7 in media su molecole piccole mai viste (11 su tutte), ma 25-60 su aromatici
//     condensati ed eterocicli con più azoti (naftalene, uracile, adenina) e sui dinitrili; togliendo una molecola dai
//     riferimenti i legami che solo lei ha (CO, NO, SO2) ricadono sulla regola di Pauling e sbagliano di 90-270 kJ/mol;
//     i minerali (reticoli ionici) non sono molecole: errori del 10-40%;
//   · gli ioni dei metalli a due cariche in acqua (Born): 30-190 kJ/mol di errore (Mg²⁺, Fe²⁺): le loro reazioni di
//     ossidoriduzione e di precipitazione vanno prese da mare.js (energia(…, { misure }));
//   · i pKa degli eterocicli (adenina: 1,2 contro 4,2) e dei terzi stadi; il dimero d'acqua è troppo legato (−28 contro −21);
//   · le barriere: una per famiglia; un errore di 10 kJ/mol è un fattore 50 sulla velocità a 25 °C;
//   · le eliche e i foglietti di un peptide sono minimi locali con i loro legami a idrogeno, ma il campo non sa dire
//     quale sequenza si ripiega in quale forma (manca l'acqua esplicita, l'entropia della catena, la cooperatività).
// Unità: kJ/mol, J/(mol·K), K, Pa, mol/L, Å (le coordinate; nm nella scena 3D).

import { atomo as atomo_, NUMERI_ATOMICI } from './molecole_atomi.js';
import { molecola as molecola_, chiave as chiave_, valida as valida_, stereoisomeri, formula, massa, carica, conta, componenti, chiralita, speculare, isomeri, anelli } from './molecole_grafo.js';
import { forma as forma_, distanza, angolo, diedro, ruota, inerzia, numeroDiSimmetria, lunghezzaLegame, dominio } from './molecole_forma.js';
import { energia as energia_, entalpiaCon, entalpiaGas, entropiaGas, termica, termochimica, RIFERIMENTI, IDRATAZIONE, idratazione, inOlio, pKaSito, pKaApparenti, sitiAcidoBase, speciazione, alPH, neutra, logKComplesso, risolvi, IONI_MISURATI, statoRedox, debyeHuckel, pKaAllaT, R } from './molecole_energia.js';
import { reazioni as reazioni_, velocita as velocita_, siti, catalisi, fotolisi, fotoreazioni, fotoni, conservata, bilancio, INTRINSECHE, espandiStereo } from './molecole_reazioni.js';
import { tensione, energiaStereo, campo, forze as forze_, minimizza, passo, insieme, cariche, aggregazione, polimero as polimero_, passoDiCondensazione, diedriPeptide, granaGrossa, energiaGrossa, scena3D as scena3D_ } from './molecole_forze.js';
import { interazione, catalisiDa, copia, ripiega, superficie, adsorbi, CONCENTRAZIONE_EFFICACE } from './molecole_incontri.js';
import { evolvi, scatole, rete as rete_, equilibrioRete, stazionarie, autocatalitici as autocatalitici_, raf, anfifiliche } from './molecole_rete.js';

// ---------- l'interfaccia (i nomi chiesti; il resto è esportato più sotto)
export const atomo = atomo_, molecola = molecola_, chiave = chiave_, valida = valida_, forma = forma_;
// energia(…, { stereo: true }): in più, di quanto questa forma stereo sta sopra la più stabile delle sue (dal campo di forze)
export const energia = (x, c = {}) => { const e = energia_(x, c); if (!c.stereo) return e; const d = energiaStereo(x, { solvente: c.solvente }); return d ? { ...e, G: e.G + d, H: e.H + d, stereo: d } : e; };
// reazioni(…, { stereo: true }): i prodotti con centri chirali o doppi legami nuovi escono in tutte le loro forme, alla pari
export const reazioni = (a, b = null, opz = {}) => (opz.stereo ? espandiStereo(reazioni_(a, b, opz)) : reazioni_(a, b, opz));
export const velocita = (r, c = {}) => velocita_(r, c.stereo ? { ...c, energiaDi: energia } : c);
export const polimero = polimero_, rete = rete_, autocatalitici = autocatalitici_, scena3D = scena3D_;
// forze(configurazione): una molecola, una forma, un insieme([...]) o un campo già preparato → energia e forze
export const forze = (x, opzioni = {}) => forze_(x && x.escl ? x : campo(x, opzioni));
export { NUMERI_ATOMICI, interazione, catalisiDa, copia, ripiega, superficie, adsorbi, CONCENTRAZIONE_EFFICACE, scatole, stereoisomeri, espandiStereo, tensione, energiaStereo, evolvi, formula, massa, carica, conta, componenti, chiralita, speculare, isomeri, anelli, distanza, angolo, diedro, ruota, inerzia, numeroDiSimmetria, lunghezzaLegame, dominio,
  entalpiaCon, entalpiaGas, entropiaGas, termica, termochimica, RIFERIMENTI, IDRATAZIONE, idratazione, inOlio, pKaSito, pKaApparenti, sitiAcidoBase, speciazione, alPH, neutra, logKComplesso,
  siti, catalisi, fotolisi, fotoreazioni, fotoni, conservata, IONI_MISURATI, statoRedox, debyeHuckel, pKaAllaT, bilancio, INTRINSECHE, campo, minimizza, passo, insieme, cariche, aggregazione, passoDiCondensazione, diedriPeptide, granaGrossa, energiaGrossa,
  equilibrioRete, stazionarie, raf, anfifiliche };

// ---------- IL RACCORDO con chimica.js e mare.js
// le specie di chimica.js (formule) come grafi: è un dizionario di nomi, non di chimica (una formula non dice la struttura)
export const GAS_DI_CHIMICA = { H2: '[HH]', He: '[He]', N2: 'N#N', O2: 'O=O', Cl2: 'ClCl', S2: 'S=S', H2O: 'O', CO: '[C-]#[O+]', CO2: 'O=C=O', CH4: 'C', NH3: 'N', HCN: 'C#N', H2CO: 'C=O', CH3OH: 'CO', H2S: 'S', SO2: 'O=S=O', NO: '[N]=O', C2H2: 'C#C', C2H6: 'CC', HCl: 'Cl' };
// l'equilibrio di una miscela di gas con le energie di QUI (stesso problema di equilibrio() di chimica.js: minimo
// dell'energia di Gibbs a T e P con gli atomi conservati; g = ΔHf − T·S a 298 K, come là; senza la fuliggine).
// → { chiave o nome: frazione molare }
export function equilibrioGas({ T, P = 1e5, elementi = {}, specie = Object.values(GAS_DI_CHIMICA) } = {}) {
  const el = Object.keys(elementi).filter((e) => elementi[e] > 0), tot = el.reduce((s, e) => s + elementi[e], 0), b = el.map((e) => elementi[e] / tot);
  const sp = specie.filter((s) => Object.keys(conta(s)).every((e) => el.includes(e))), A = sp.map((s) => { const c = conta(s); return el.map((e) => c[e] || 0); }), m = el.length;
  const c = sp.map((s) => { const e = energia_(s, {}); return (e.Hf298 - (T * e.S298) / 1000) / (R * T) + Math.log(P / 1e5); });
  let lam = new Array(m).fill(Math.min(0, ...c.map((ci, i) => ci / A[i].reduce((x, y) => x + y, 0))));
  const n = new Float64Array(sp.length), psi = (l, s) => { let v = 0; for (let i = 0; i < sp.length; i++) { let x = s - c[i]; for (let j = 0; j < m; j++) x += A[i][j] * l[j]; v += n[i] = Math.exp(Math.min(x, 300)); } for (let j = 0; j < m; j++) v -= b[j] * l[j]; return v; };
  const minimizzaPsi = (s) => { for (let it = 0; it < 500; it++) { const v0 = psi(lam, s), G = Array.from({ length: m }, () => new Array(m + 1).fill(0)); for (let i = 0; i < sp.length; i++) for (let p = 0; p < m; p++) { if (!A[i][p]) continue; G[p][m] -= A[i][p] * n[i]; for (let q = 0; q < m; q++) G[p][q] += A[i][p] * A[i][q] * n[i]; }
      let scarto = 0, diag = 0; for (let p = 0; p < m; p++) { G[p][m] += b[p]; scarto = Math.max(scarto, Math.abs(G[p][m]) / b[p]); diag = Math.max(diag, G[p][p]); } if (scarto < 1e-11) break; for (let p = 0; p < m; p++) G[p][p] += 1e-13 * diag + 1e-300;
      const res = G.map((r) => r[m]), d = risolvi(G); let t = 1, mx = 0, pend = 0; for (let i = 0; i < sp.length; i++) { let de = 0; for (let j = 0; j < m; j++) de += A[i][j] * d[j]; mx = Math.max(mx, de); } if (mx > 1.5) t = 1.5 / mx; for (let p = 0; p < m; p++) pend -= res[p] * d[p];
      for (let k = 0; k < 40; k++, t /= 2) { const l2 = lam.map((x, j) => x + t * d[j]); if (psi(l2, s) <= v0 + 1e-4 * t * pend || k === 39) { lam = l2; break; } } }
    psi(lam, s); let N = 0; for (let i = 0; i < sp.length; i++) N += n[i]; return N; };
  let s = Math.log(0.5), s0 = 0, F0 = 0, N = 0;
  for (let k = 0; k < 60; k++) { N = minimizzaPsi(s); const F = Math.log(N) - s; if (Math.abs(F) < 1e-12) break; const passoS = k === 0 || F === F0 ? F : Math.max(-8, Math.min(8, (-F * (s - s0)) / (F - F0))); s0 = s; F0 = F; s += passoS; }
  return Object.fromEntries(sp.map((x, i) => [x, n[i] / N]));
}
// reteDelLuogo: dalle condizioni di un luogo, come le danno chimica.js e mare.js, alla rete delle sue reazioni.
//   luogo = { T, P (Pa), pH, gas: { formula di chimica.js: frazione }, pressione (Pa dell'aria), ioni: { 'Mg2+': mol/kg, … } (mare.js),
//             minerali: [nomi o { nome, frazione }] (chimica.js minerali(), i «fumi» dei camini di mare.js),
//             prebiotica: { HCN, formaldeide } (i tassi relativi di chimica.js prebiotica()), molecole: { SMILES: mol/L } (in più),
//             luce: { Tstella, diluizione } (per la fotolisi), attivitaAcqua (1 nel mare, meno in una pozza che si asciuga) }
// I gas entrano sciolti secondo la loro energia di idratazione (legge di Henry: c = p·exp(−ΔG/RT)). I tassi di
// «prebiotica» non sono concentrazioni: si moltiplicano per scalaPrebiotica (mol/L per unità) [PARAMETRO LIBERO, 10⁻³].
export function reteDelLuogo(luogo = {}, opzioni = {}) {
  const T = luogo.T ?? 298.15, partenza = { ...(luogo.molecole || {}) }, scala = opzioni.scalaPrebiotica ?? 1e-3, pTot = (luogo.pressione ?? luogo.P ?? 1e5) / 1e5;
  for (const f in luogo.gas || {}) { const s = GAS_DI_CHIMICA[f]; if (!s || f === 'H2O' || f === 'He') continue; const p = luogo.gas[f] * pTot, cc = p * Math.exp(-(idratazione(s) + R * 298.15 * Math.log(24.465)) / (R * T)); if (cc > 1e-12) partenza[s] = (partenza[s] || 0) + cc; }
  if (luogo.prebiotica) { if (luogo.prebiotica.HCN > 0) partenza['C#N'] = (partenza['C#N'] || 0) + scala * luogo.prebiotica.HCN; if (luogo.prebiotica.formaldeide > 0) partenza['C=O'] = (partenza['C=O'] || 0) + scala * luogo.prebiotica.formaldeide; }
  const ioni = {}; for (const k in luogo.ioni || {}) { const mm = /^([A-Z][a-z]?)(\d*)\+$/.exec(k) || /^([A-Z][a-z]?)\+(\d*)$/.exec(k); if (mm && atomo_(mm[1]).metallo) ioni[`${mm[1]}+${mm[2] || 1}`] = luogo.ioni[k]; }
  const cond = { T, P: luogo.P ?? 1e5, pH: luogo.pH ?? 7, solvente: 'acqua', attivitaAcqua: luogo.attivitaAcqua ?? 1, ioni, minerali: (luogo.minerali || []).map((x) => (typeof x === 'string' ? x : x.nome)), luce: luogo.luce || null, misure: luogo.misure };
  const r = rete_(partenza, cond, opzioni);
  // la luce: i pezzi in cui i fotoni spezzano le molecole di partenza (velocità per molecola, 1/s)
  r.fotolisi = luogo.luce ? Object.keys(partenza).flatMap((k) => fotolisi(k, luogo.luce).filter((x) => x.J > 1e-12).slice(0, 2)) : [];
  return r;
}
// ciò che una molecola chiede a chi sta sopra perché possa esserci (INTRECCIO, regola 5): i suoi elementi, e se in acqua
// a quel pH e a quella temperatura la sua formazione dagli ingredienti dati è in discesa.
export function cheCosaChiede(x, { ingredienti = ['O', 'O=C=O', 'N', '[HH]', 'S', 'OP(=O)(O)O'], T = 298.15, pH = 7 } = {}) {
  const m = molecola_(x), c = conta(m), elementi = Object.keys(c), cond = { T, pH, solvente: 'acqua' };
  // quante molecole di ogni ingrediente servono (bilancio degli elementi: C dalla CO2, N dall'ammoniaca, S da H2S, P dal fosfato, O dall'acqua, H da H2)
  const n = { 'O=C=O': c.C || 0, N: c.N || 0, S: c.S || 0, 'OP(=O)(O)O': c.P || 0 }; n.O = (c.O || 0) - 2 * n['O=C=O'] - 4 * n['OP(=O)(O)O']; n['[HH]'] = ((c.H || 0) - 3 * n.N - 2 * n.S - 3 * n['OP(=O)(O)O'] - 2 * n.O) / 2;
  const altri = elementi.filter((e) => !['C', 'H', 'N', 'O', 'S', 'P'].includes(e)); let dG = energia_(m, cond).G; for (const k in n) dG -= n[k] * energia_(k, cond).G;
  return { elementi, ingredienti: Object.fromEntries(Object.entries(n).filter(([, v]) => Math.abs(v) > 1e-9)), altriElementi: altri, dG, riducente: n['[HH]'] > 0, nota: `${n['[HH]'] > 0 ? 'chiede un riducente (idrogeno: ' + n['[HH]'] + ' H2 per molecola)' : 'non chiede riducenti'}; dalla CO2, dall'ammoniaca e dall'acqua la sua formazione ${dG < 0 ? 'è in discesa' : 'è in salita: serve energia (luce, scariche, un gradiente)'} di ${Math.abs(dG).toFixed(0)} kJ/mol`, ingredientiUsati: ingredienti };
}
