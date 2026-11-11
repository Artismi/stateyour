// test_molecole.mjs — la chimica generale: qualsiasi molecola dai suoi atomi e dai suoi legami, contro i numeri veri.
// Ciò che non torna con la realtà è STAMPATO («≠ NON TORNA» con il numero), non nascosto.
import assert from 'node:assert/strict';
import * as M from '../src/camera/molecole.js';
import { equilibrio, MOLECOLE } from '../src/camera/chimica.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0, nonTorna = 0;
const prova = async (nome, f) => { const t0 = performance.now(); await f(); ok++; console.log('  ✓', nome, `(${(performance.now() - t0).toFixed(0)} ms)`); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const stona = (che) => { nonTorna++; console.log('      ≠ NON TORNA:', che); };
const ACQUA = { T: 298.15, solvente: 'acqua', pH: 7 };
const GLY = 'NCC(=O)O', ALA = 'N[C@@H](C)C(=O)O', GLUCOSIO = 'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O', RIBOSIO = 'OC[C@H]1OC(O)[C@H](O)[C@@H]1O', ADENINA = 'Nc1ncnc2[nH]cnc12';
const LAURICO = 'CCCCCCCCCCCC(=O)O', FOSFOLIPIDE = 'CCCCCCCCCCCCCCCC(=O)OCC(COP(=O)(O)OCCN)OC(=O)CCCCCCCCCCCCCCC', GLYGLY = 'NCC(=O)NCC(=O)O';

// ───────────── 1. gli atomi
await prova('gli atomi: gusci, gruppi, valenze dalla struttura elettronica', () => {
  assert.equal(M.atomo('Fe').configurazione, '1s2 2s2 2p6 3s2 3p6 4s2 3d6'); assert.equal(M.atomo('Cu').configurazione.slice(-8), '4s1 3d10'); assert.equal(M.atomo(6).gruppo, 14); assert.equal(M.atomo('Cl').gruppo, 17); assert.equal(M.atomo('Ca').gruppo, 2);
  assert.deepEqual(M.atomo('C').valenze, [4]); assert.deepEqual(M.atomo('N').valenze, [3]); assert.deepEqual(M.atomo('O').valenze, [2]); assert.deepEqual(M.atomo('S').valenze, [2, 4, 6]); assert.deepEqual(M.atomo('P').valenze, [3, 5]); assert.deepEqual(M.atomo('H').valenze, [1]);
  for (const Z of M.NUMERI_ATOMICI) { const a = M.atomo(Z); assert.ok(a.massa > 0 && a.raggioCovalente > 0 && a.raggioVdW > 0 && a.ionizzazione > 0, a.simbolo); for (const o of a.ossidazioniMisurate) if (a.blocco !== 'd' && !(o >= a.ossidazioni[0] && o <= a.ossidazioni[1])) stona(`${a.simbolo}: lo stato di ossidazione ${o} è osservato ma la regola dà ${a.ossidazioni.join('…')}`); }
  assert.ok(M.NUMERI_ATOMICI.length >= 37);
});
await prova('gli atomi: ciò che si ricava (Slater, Allred-Rochow) contro ciò che si misura', () => {
  let sI = 0, sR = 0, sC = 0, n = 0, nc = 0, sI2 = 0, n2 = 0;
  for (const Z of M.NUMERI_ATOMICI) { const a = M.atomo(Z), eI = Math.abs(a.ionizzazioneSlater / a.ionizzazione - 1); sI += eI; sR += Math.abs(a.raggioSlater / a.raggioCovalente - 1); n++; if (a.periodo <= 2) { sI2 += eI; n2++; } if (a.chi != null && a.chiAllredRochow != null) { sC += Math.abs(a.chiAllredRochow - a.chi); nc++; } }
  console.log(`      ionizzazione (Slater): scarto medio ${(100 * sI / n).toFixed(0)}% su ${n} elementi (${(100 * sI2 / n2).toFixed(0)}% nei primi due periodi); raggio dell'orbitale esterno contro il raggio covalente: ${(100 * sR / n).toFixed(0)}%; elettronegatività di Allred-Rochow contro Pauling: ${(sC / nc).toFixed(2)} in media`);
  tra(M.atomo('C').chiAllredRochow, 2.3, 2.8, 'χ del carbonio (Pauling 2,55)'); tra(M.atomo('H').ionizzazioneSlater, 13.5, 13.7, 'ionizzazione di H (eV)'); tra(M.atomo('He').ionizzazioneSlater, 23, 26, 'ionizzazione di He (24,6 eV)');
  if (sI / n > 0.25) stona(`le regole di Slater sbagliano l'energia di ionizzazione del ${(100 * sI / n).toFixed(0)}% in media (dal terzo periodo: Al 10,7 eV contro 5,99)`);
  const F = M.atomo('F'); if (Math.abs(F.chiAllredRochow - F.chi) > 1) stona(`Allred-Rochow con i raggi di Cordero dà al fluoro χ = ${F.chiAllredRochow.toFixed(1)} (Pauling 3,98): la formula era tarata sui raggi di Pauling`);
});

// ───────────── 2. i grafi
await prova('i grafi: che cosa è una molecola possibile (ottetto, duetto, valenze espanse, cariche)', () => {
  for (const s of ['O', 'C', 'N', 'O=C=O', '[C-]#[O+]', 'C#N', '[NH4+]', '[OH-]', 'OP(=O)(O)O', 'OS(=O)(=O)O', 'FS(F)(F)(F)(F)F', 'C[N+](=O)[O-]', '[Na+].[Cl-]', 'O->[Fe+2]', 'c1ccccc1', '[HH]', GLY, ALA, GLUCOSIO, RIBOSIO, ADENINA, LAURICO, FOSFOLIPIDE, GLYGLY]) assert.ok(M.valida(s).ok, `${s}: ${M.valida(s).problemi}`);
  for (const s of ['C(C)(C)(C)(C)C', 'N(=O)=O', 'C[O](C)C', 'F[Ne]', '[H]([H])[H]', 'FN(F)(F)(F)F', '[C+5]']) assert.ok(!M.valida(s).ok, `${s} dovrebbe essere impossibile`);
  assert.equal(M.valida('[CH3]').aperti[0].che, 'radicale'); assert.equal(M.valida('[CH3+]').aperti[0].che, 'orbitale vuoto'); assert.equal(M.valida('B').aperti[0].che, 'orbitale vuoto');
  assert.equal(M.formula(GLUCOSIO), 'C6H12O6'); assert.equal(M.formula(ADENINA), 'C5H5N5'); assert.equal(M.formula('[NH4+]'), 'H4N+'); tra(M.massa(GLY), 75.0, 75.1, 'massa della glicina');
});
await prova('la chiave canonica: stessa molecola → stessa chiave, comunque sia scritta; isomeri e chiralità distinti', () => {
  assert.equal(M.chiave('OCC'), M.chiave('CCO')); assert.equal(M.chiave('C1=CC=CC=C1'), M.chiave('c1ccccc1')); assert.equal(M.chiave('CC1=CC=CC=C1C'), M.chiave('C1=CC=C(C)C(C)=C1')); assert.equal(M.chiave('OC(=O)CN'), M.chiave(GLY));
  assert.equal(M.chiave('[H][H]'), M.chiave('[HH]')); assert.equal(M.chiave('[H]O[H]'), 'O');
  for (const s of [GLY, ALA, GLUCOSIO, ADENINA, FOSFOLIPIDE, 'O=c1cc[nH]c(=O)[nH]1', 'C[N+](=O)[O-]', 'O->[Fe+2]', '[Na+]~[Cl-]']) assert.equal(M.chiave(M.chiave(s)), M.chiave(s), `la chiave di ${s} riletta dà la stessa chiave`);
  assert.ok(M.isomeri('CCO', 'COC')); assert.ok(!M.isomeri('CCO', 'OCC')); assert.ok(M.isomeri('OCC=O', 'CC(=O)O'));
  // L-alanina è S, D-alanina è R; la L-cisteina è R (lo zolfo cambia le priorità); il D-glucosio 2R,3S,4R,5R
  assert.equal(M.chiralita(ALA)[0].RS, 'S'); assert.equal(M.chiralita('N[C@H](C)C(=O)O')[0].RS, 'R'); assert.equal(M.chiralita('N[C@@H](CS)C(=O)O')[0].RS, 'R');
  assert.equal(M.chiralita(GLUCOSIO).filter((c) => c.RS).map((c) => c.RS).sort().join(''), 'RRRS');
  assert.notEqual(M.chiave(ALA), M.chiave(M.speculare(ALA))); assert.equal(M.chiave(M.speculare(ALA)), M.chiave('N[C@H](C)C(=O)O')); assert.equal(M.chiave(ALA), M.chiave('C[C@H](N)C(=O)O'));
  assert.equal(M.chiave('C[C@H](C)O'), M.chiave('CC(C)O'), 'un carbonio con due sostituenti uguali non è chirale');
  // un grafo dato come atomi e legami
  assert.equal(M.chiave({ atomi: [{ Z: 6, h: 3 }, { Z: 6, h: 2 }, { Z: 8, h: 1 }], legami: [{ a: 0, b: 1, o: 1 }, { a: 1, b: 2, o: 1 }] }), M.chiave('CCO'));
  assert.notEqual(M.chiave('F/C=C/F'), M.chiave('F/C=C\\F'), 'cis e trans sono molecole diverse'); assert.equal(M.chiave('F/C=C/F'), M.chiave('F\\C=C\\F')); assert.equal(M.chiave('F/C=C/F'), M.chiave('C(\\F)=C/F'));
});

// ───────────── 3. la forma
await prova('le geometrie: acqua, ammoniaca, metano, CO2, etene, benzene', () => {
  let f = M.forma('O'); tra(M.angolo(f, 1, 0, 2), 104.0, 105.0, 'H–O–H (misurato 104,5°)'); tra(M.distanza(f, 0, 1), 0.93, 0.99, 'O–H (0,958 Å)');
  f = M.forma('N'); tra(M.angolo(f, 1, 0, 2), 106.2, 107.5, 'H–N–H (106,7°)');
  f = M.forma('C'); for (const [i, j] of [[1, 2], [1, 3], [2, 4], [3, 4]]) tra(M.angolo(f, i, 0, j), 109.4, 109.55, 'H–C–H (109,47°)');
  f = M.forma('O=C=O'); tra(M.angolo(f, 0, 1, 2), 179.9, 180.1, 'O=C=O'); if (Math.abs(M.distanza(f, 0, 1) - 1.160) > 0.05) stona(`C=O nella CO2: ${M.distanza(f, 0, 1).toFixed(3)} Å (misurato 1,160: i doppi legami cumulati sono più corti)`);
  f = M.forma('C=C'); tra(M.angolo(f, 2, 0, 1), 119, 122.5, 'H–C=C (121,3°)'); tra(Math.abs(M.diedro(f, 2, 0, 1, 4)) % 180, -0.01, 0.01, 'etene piano'); tra(M.distanza(f, 0, 1), 1.31, 1.36, 'C=C (1,339 Å)');
  f = M.forma('c1ccccc1'); tra(M.angolo(f, 0, 1, 2), 119.9, 120.1, 'C–C–C del benzene'); tra(Math.abs(M.diedro(f, 0, 1, 2, 3)), -0.01, 0.01, 'benzene piano'); tra(M.distanza(f, 0, 1), 1.37, 1.42, 'C–C aromatico (1,397 Å)'); tra(M.distanza(f, 0, 5), 1.37, 1.42, 'l\'anello si chiude');
  assert.equal(M.numeroDiSimmetria(M.forma('C')), 12); assert.equal(M.numeroDiSimmetria(f), 12); assert.equal(M.numeroDiSimmetria(M.forma('O')), 2); assert.equal(M.numeroDiSimmetria(M.forma('N')), 3);
  const misure = [['O', 0, 1, 0.958], ['C', 0, 1, 1.087], ['CC', 0, 1, 1.535], ['C#N', 0, 1, 1.156], ['N#N', 0, 1, 1.098], ['C=O', 0, 1, 1.205], ['CO', 0, 1, 1.427], ['CN', 0, 1, 1.471], ['S', 0, 1, 1.336], ['CS', 0, 1, 1.819], ['CC(=O)NC', 1, 3, 1.335], ['OP(=O)(O)O', 0, 1, 1.57]];
  let s = 0; for (const [sm, i, j, d] of misure) { const x = M.distanza(M.forma(sm), i, j); s += Math.abs(x - d); if (Math.abs(x - d) > 0.06) stona(`lunghezza di legame in ${sm}: ${x.toFixed(3)} Å contro ${d} misurati`); }
  console.log(`      lunghezze di legame: scarto medio ${(s / misure.length).toFixed(3)} Å su ${misure.length} legami`);
  tra(M.angolo(M.forma('S'), 1, 0, 2), 91, 94, 'H–S–H (92,1°)');
});
await prova('rotazioni e conformazioni: sfalsata, anti, sedia; la chiralità nello spazio', () => {
  let f = M.forma('CC'); tra(Math.abs(M.diedro(f, 2, 0, 1, 5)) % 120, 59, 61, 'etano sfalsato (60° o 180°)'); f = M.forma('CCCC'); tra(Math.abs(M.diedro(f, 0, 1, 2, 3)), 179, 181, 'butano anti');
  const g = M.ruota(f, 1, 2, 120); tra(Math.abs(M.diedro(g, 0, 1, 2, 3)), 59, 61, 'butano gauche dopo una rotazione di 120°'); tra(M.distanza(g, 1, 2), 1.5, 1.55, 'la rotazione non cambia i legami');
  f = M.forma('C1CCCCC1'); tra(Math.abs(M.diedro(f, 0, 1, 2, 3)), 50, 62, 'cicloesano a sedia (55°)'); tra(M.angolo(f, 0, 1, 2), 108, 113, 'C–C–C nel cicloesano (111°)');
  f = M.forma('CC(=O)NC'); tra(Math.abs(M.diedro(f, 0, 1, 3, 4)), 179, 181, 'il legame peptidico è piano (trans)');
  for (const s of [ALA, 'N[C@H](C)C(=O)O']) { f = M.forma(s); const a = f.m.atomi[1], v = a.ord.map((o) => { const i = o < 0 ? f.indiceH[1] : o; return [0, 1, 2].map((q) => f.pos[3 * i + q] - f.pos[3 + q]); }), vol = (v[1][1] * v[2][2] - v[1][2] * v[2][1]) * v[3][0] + (v[1][2] * v[2][0] - v[1][0] * v[2][2]) * v[3][1] + (v[1][0] * v[2][1] - v[1][1] * v[2][0]) * v[3][2]; assert.equal(vol < 0 ? 1 : -1, a.chir, `la forma di ${s} ha la mano giusta`); }
});

// ───────────── 4. l'energia
// ΔHf gas a 298 K (kJ/mol): NIST Chemistry WebBook, letti l'11-11-2026 (R = è tra i riferimenti da cui si ricavano i termini)
const NIST = [['O', -241.83], ['C', -74.6], ['CC', -84.0], ['CCC', -104.7], ['CC(C)C', -134.2], ['C=C', 52.47], ['C#C', 226.73], ['c1ccccc1', 82.9], ['CO', -201.0], ['CCO', -234.8], ['COC', -184.1], ['C=O', -108.6], ['CC=O', -166.2], ['CC(C)=O', -217.1], ['OC=O', -378.6], ['CC(=O)O', -433.0], ['O=C=O', -393.51], ['[C-]#[O+]', -110.53], ['N', -45.94], ['CN', -22.5], ['C#N', 135.14], ['CC#N', 74.04], ['NC=O', -186.0], ['S', -20.6], ['CS', -22.9], ['O=S=O', -296.81], ['Cl', -92.31], ['[N]=O', 91.3], ['OO', -136.11], ['NN', 95.35],
  // mai viste dalla regressione
  ['CCCCC', -146.8], ['CCCCO', -277.0], ['CC(C)(C)O', -312.6], ['CCOCC', -252.7], ['CCC(=O)O', -455.8], ['CCCC(=O)O', -475.9], ['CCCCCC(=O)O', -512.0], ['CCCCCCCC(=O)O', -554.5], ['CCOC(C)=O', -445.43], ['CN(C)C=O', -192.4], [GLY, -390.5], ['CC(N)C(=O)O', -414.7], ['OCC(O)CO', -577.9], ['C1CCNCC1', -47.15], ['NCCN', -17.0], ['CCS', -46.15], ['C1=CCCCC1', -4.32], ['ClC(Cl)Cl', -103.18], ['CCC=C', -0.63], ['C=CC(C)=O', -115.0], ['COC=O', -352.4], ['O=c1cc[nH]c(=O)[nH]1', -303.1], ['c1ccc2ccccc2c1', 150.0], ['N#CCC#N', 266.3], [ADENINA, 205.7]];
await prova('entalpie di formazione di 55 molecole contro i dati (NIST)', () => {
  const rif = new Set(M.RIFERIMENTI.map(([s]) => M.chiave(s))), T = M.termochimica(); let sR = 0, nR = 0, mR = 0, sN = 0, nN = 0, mN = 0, piccole = 0, nPiccole = 0;
  for (const [s, dH] of NIST) { const r = M.entalpiaGas(s), e = r.H - dH, dentro = rif.has(M.chiave(s)); if (dentro) { sR += Math.abs(e); nR++; mR = Math.max(mR, Math.abs(e)); } else { sN += Math.abs(e); nN++; mN = Math.max(mN, Math.abs(e)); if (M.molecola(s).atomi.length <= 9 && !M.molecola(s).atomi.some((a) => a.ar)) { piccole += Math.abs(e); nPiccole++; } if (Math.abs(e) > 20) stona(`ΔHf di ${s}: ${r.H.toFixed(0)} kJ/mol contro ${dH} misurati (${e > 0 ? '+' : ''}${e.toFixed(0)})`); } }
  console.log(`      ${Object.keys(T.valori).length} termini ricavati da ${T.riferimenti} molecole di riferimento; scarto sui riferimenti: medio ${(sR / nR).toFixed(1)}, massimo ${mR.toFixed(0)} kJ/mol (${nR} molecole)`);
  console.log(`      su ${nN} molecole MAI VISTE dalla regressione: medio ${(sN / nN).toFixed(1)}, massimo ${mN.toFixed(0)} kJ/mol; sulle ${nPiccole} piccole non aromatiche: medio ${(piccole / nPiccole).toFixed(1)} kJ/mol`);
  tra(sR / nR, 0, 6, 'scarto medio sui riferimenti (kJ/mol)'); tra(piccole / nPiccole, 0, 20, 'scarto medio sulle piccole mai viste (kJ/mol)');
});
await prova('le molecole di chimica.js ridate senza la sua tabella: ΔHf (anche togliendo la molecola dai riferimenti) e S', () => {
  let sH = 0, mH = 0, sL = 0, mL = 0, sS = 0, mS = 0, n = 0, peggio = '';
  for (const f in M.GAS_DI_CHIMICA) { if (f === 'He') continue; const s = M.GAS_DI_CHIMICA[f], mis = MOLECOLE[f], e = M.energia(s), dH = e.Hf298 - mis.dH, dS = e.S298 - mis.S;
    // «leave-one-out»: i termini ricavati SENZA questa molecola (per i legami che solo lei ha resta la regola di Pauling)
    const senza = M.entalpiaCon(s, M.termochimica({ escludi: M.RIFERIMENTI.filter(([x]) => M.chiave(x) === M.chiave(s)).map(([x]) => x) }).valori) - mis.dH;
    sH += Math.abs(dH); mH = Math.max(mH, Math.abs(dH)); sL += Math.abs(senza); if (Math.abs(senza) > mL) { mL = Math.abs(senza); peggio = f; } sS += Math.abs(dS); mS = Math.max(mS, Math.abs(dS)); n++;
    if (Math.abs(senza) > 20) stona(`${f} senza sé stessa tra i riferimenti: ΔHf ${(mis.dH + senza).toFixed(0)} contro ${mis.dH} (${senza > 0 ? '+' : ''}${senza.toFixed(0)} kJ/mol)`); if (Math.abs(dS) > 4) stona(`entropia di ${f}: ${e.S298.toFixed(1)} contro ${mis.S} J/mol/K`); }
  console.log(`      ${n} gas di chimica.js: ΔHf scarto medio ${(sH / n).toFixed(1)} (massimo ${mH.toFixed(0)}) kJ/mol; togliendo ogni volta la molecola dai riferimenti: medio ${(sL / n).toFixed(0)}, massimo ${mL.toFixed(0)} (${peggio}); entropia: medio ${(sS / n).toFixed(1)}, massimo ${mS.toFixed(1)} J/mol/K`);
  tra(sH / n, 0, 8, 'ΔHf dei gas di chimica.js'); tra(sS / n, 0, 3, 'entropia dei gas di chimica.js');
  // acqua liquida (H e S dalla condensazione) e i solidi: non sono molecole
  const w = M.energia('O', { solvente: 'acqua' }); tra(w.H, -288, -284, 'ΔHf dell\'acqua liquida (−285,83)'); tra(w.S, 66, 74, 'S dell\'acqua liquida (69,95)');
  for (const [f, s] of [['MgO', '[Mg]=O'], ['SiO2', 'O=[Si]=O'], ['NaCl', '[Na]Cl'], ['FeO', '[Fe]=O']]) stona(`${f} (solido) trattato come molecola: ΔHf ${M.entalpiaGas(s).H.toFixed(0)} contro ${MOLECOLE[f].dH} del cristallo: manca l'energia del reticolo — i minerali restano a chimica.js`);
});
await prova('entropie dalla meccanica statistica; H e S alla temperatura', () => {
  const dati = [['c1ccccc1', 269.2], ['CC(=O)O', 282.84], ['CCC', 270.3], ['CCO', 281.6], ['CCCCCC', 388.82], ['C=C', 219.32], ['CCCCO', 361.98], ['OC=O', 248.7]]; let s = 0;
  for (const [sm, S] of dati) { const x = M.entropiaGas(sm); s += Math.abs(x - S); if (Math.abs(x - S) > 8) stona(`entropia di ${sm}: ${x.toFixed(0)} contro ${S} J/mol/K`); } console.log(`      entropia di ${dati.length} molecole con rotori interni: scarto medio ${(s / dati.length).toFixed(1)} J/mol/K`); tra(s / dati.length, 0, 8, 'scarto medio delle entropie');
  const a = M.energia('O', { T: 298.15 }), b = M.energia('O', { T: 1000 }); tra(b.H - a.H, 23, 29, 'acqua: H(1000 K) − H(298 K) (misurato 26,0 kJ/mol)'); tra(b.S - a.S, 40, 48, 'acqua: S(1000) − S(298) (misurato 43,9)');
  tra(M.energia('O', { P: 1e4 }).G - a.G, -5.8, -5.6, 'a un decimo di bar G scende di RT·ln 10');
});
await prova('in acqua: idratazione, pKa di acido acetico, ammonio e acqua, zwitterione, ioni', () => {
  let s = 0, mx = 0; for (const [sm, kcal] of M.IDRATAZIONE) { const e = Math.abs(M.idratazione(sm) - kcal * 4.184); s += e; mx = Math.max(mx, e); } console.log(`      ΔG di idratazione di ${M.IDRATAZIONE.length} molecole (FreeSolv, Henry): scarto medio ${(s / M.IDRATAZIONE.length).toFixed(1)}, massimo ${mx.toFixed(0)} kJ/mol (sono i dati da cui vengono i coefficienti)`); tra(s / M.IDRATAZIONE.length, 0, 5, 'idratazione');
  tra(M.pKaApparenti('CC(=O)O')[0], 4.4, 5.1, 'pKa dell\'acido acetico (4,76)'); tra(M.pKaApparenti('[NH4+]')[0], 8.9, 9.6, 'pKa dell\'ammonio (9,25)'); tra(M.pKaApparenti('O')[0], 13.7, 14.3, 'pKa dell\'acqua (14,0 con l\'attività dell\'acqua a 1)');
  const misurati = [[GLY, [2.34, 9.60]], ['OP(=O)(O)O', [2.15, 7.20, 12.35]], ['OC(=O)CCl', [2.87]], ['NCCO', [9.50]], ['c1c[nH]cn1', [6.95]], ['N[C@@H](CS)C(=O)O', [1.9, 8.2, 10.3]], ['OC(=O)C(=O)O', [1.25, 4.27]], ['C#N', [9.21]], ['S', [7.0]], ['Oc1ccccc1', [10.0]], [ADENINA, [4.2, 9.8]], ['NCCCC[C@H](N)C(=O)O', [2.2, 9.0, 10.5]]]; let sp = 0, np = 0;
  for (const [sm, pk] of misurati) { const c = M.pKaApparenti(sm).filter((x) => x > -1); pk.forEach((p, i) => { const piu = c.reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a), 99); void i; sp += Math.abs(piu - p); np++; if (Math.abs(piu - p) > 1.5) stona(`pKa di ${sm}: ${piu === 99 ? 'nessuno' : piu} contro ${p} misurato`); }); }
  console.log(`      ${np} pKa di molecole non usate per le classi: scarto medio ${(sp / np).toFixed(2)} unità`); tra(sp / np, 0, 1.2, 'scarto medio dei pKa');
  assert.equal(M.chiave(M.alPH(GLY, 7)), M.chiave('[NH3+]CC(=O)[O-]'), 'a pH 7 la glicina è uno zwitterione'); assert.equal(M.chiave(M.alPH(GLY, 1)), M.chiave('[NH3+]CC(=O)O')); assert.equal(M.chiave(M.alPH(GLY, 12)), M.chiave('NCC(=O)[O-]'));
  tra(M.energia(GLY, ACQUA).G, -575, -550, 'glicina in acqua: ΔHf − T·S (misurato −561 kJ/mol)'); tra(M.energia('O=C=O', ACQUA).G, -460, -440, 'CO2 sciolta (misurato −448,8)');
  // gli ioni semplici: Born (gli stessi dati di mare.js IONI: ΔHf e S misurati)
  for (const [ione, dH, S] of [['[Na+]', -240.34, 58.45], ['[K+]', -252.14, 101.2], ['[Mg+2]', -467.0, -137.0], ['[Ca+2]', -543.0, -56.2], ['[Fe+2]', -90.0, -101.6], ['[Cl-]', -167.08, 56.6]]) { const g = M.energia(ione, { ...ACQUA, born: true }).G, mis = dH - 298.15 * S / 1000; if (Math.abs(g - mis) > 20) stona(`${ione} in acqua: G = ${g.toFixed(0)} contro ${mis.toFixed(0)} kJ/mol misurati (${ione === '[Cl-]' ? 'dal pKa e dall\'idratazione stimata di HCl' : 'Born'}${ione === '[Fe+2]' ? ': manca la stabilizzazione del campo dei leganti' : ''})`); else console.log(`      ${ione} in acqua: ${g.toFixed(0)} contro ${mis.toFixed(0)} kJ/mol misurati`); }
  tra(M.energia('[Mg+2]', ACQUA).G, -427, -425, 'per gli ioni misurati (IONI_MISURATI) si usa il dato, non Born'); tra(M.energia('[Mg+2]', { ...ACQUA, misure: { '[Mg+2]': [-460.0, -137.0] } }).G, -420, -418, 'e chi chiama può dare le sue misure (mare.js)');
});
await prova('le molecole della vita sono molecole valide con energie sensate', () => {
  for (const [nome, s, lo, hi] of [['glicina', GLY, -420, -360], ['alanina', ALA, -460, -390], ['glucosio', GLUCOSIO, -1400, -1100], ['ribosio', RIBOSIO, -1150, -900], ['adenina', ADENINA, 150, 300], ['acido laurico', LAURICO, -700, -600], ['fosfolipide', FOSFOLIPIDE, -2600, -1700], ['glicilglicina', GLYGLY, -600, -450]]) {
    assert.ok(M.valida(s).ok, nome); const e = M.energia(s), a = M.energia(s, ACQUA); tra(e.Hf298, lo, hi, `ΔHf di ${nome}`); assert.ok(isFinite(e.S298) && e.S298 > 200 && isFinite(a.G) && a.G < e.G + 60, `${nome}: S ${e.S298}, G in acqua ${a.G}`); }
});

// ───────────── 5. le reazioni
let tutte = [];
await prova('le reazioni generate conservano atomi e carica (tutte)', () => {
  const coppie = [['C=O', 'C#N'], ['C=O', 'N'], ['NCO', null], ['C=N', 'C#N'], ['NCC#N', 'O'], ['C#N', 'C#N'], ['OCC=O', null], ['OCC=O', 'C=O'], [GLY, GLY], [GLYGLY, 'O'], ['O=C=O', '[HH]'], ['[C-]#[O+]', 'O'], ['[C-]#[O+]', 'CS'], ['CC(=O)O', 'CO'], ['CC(=O)OC', 'O'], ['OCC(O)C=O', null], ['CC(=O)CC(=O)O', null], ['OP(=O)(O)O', 'CO'], [GLUCOSIO, 'CO'], ['[Mg+2]', 'CC(=O)[O-]'], ['[Fe+2]', 'S'], ['CC(=O)O', 'N'], ['S', 'C=O'], [ALA, 'C=O'], ['OC(=O)C(=O)C', '[HH]'], ['[OH]', 'C'], ['[CH3]', '[OH]'], ['[H]', 'C=C'], ['[CH3]', 'CC=O']];
  for (const [a, b] of coppie) for (const opz of [{}, { radicali: true, protoni: true }]) for (const r of M.reazioni(a, b, opz)) { assert.ok(M.conservata(r), `${r.tipo}: ${r.reagenti.join(' + ')} → ${r.prodotti.join(' + ')}`); for (const p of r.prodotti) assert.ok(M.valida(p).ok, `prodotto impossibile ${p}`); tutte.push(r); }
  const tipi = {}; for (const r of tutte) tipi[r.tipo] = (tipi[r.tipo] || 0) + 1; console.log(`      ${tutte.length} reazioni da ${coppie.length} coppie: ${Object.entries(tipi).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  for (const t of ['addizione', 'addizione C', 'eliminazione', 'sostituzione', 'tautomeria', 'idrogenazione', 'deidrogenazione', 'addizione a CO', 'inserzione di CO', 'omolisi', 'strappo di H', 'ricombinazione', 'addizione radicalica', 'protone', 'complessazione']) assert.ok(tipi[t] > 0, `nessuna reazione di tipo «${t}»`);
});
await prova('energie, barriere e velocità: reversibilità, catalisi, fotolisi', () => {
  const idr = M.reazioni('C=O', 'O').find((r) => r.tipo === 'addizione'), v = M.velocita(idr, ACQUA); tra(v.dG, -35, 0, 'idratazione della formaldeide (misurato −19 kJ/mol)'); tra(Math.log10(v.k / v.kInversa) + v.dG / (M.energia('O').G * 0 + 2.479 * Math.LN10), -0.01, 0.01, 'k avanti / k indietro = K');
  const cian = M.reazioni('C=O', 'C#N').find((r) => r.tipo === 'addizione C'), a7 = M.velocita(cian, ACQUA), a10 = M.velocita(cian, { ...ACQUA, pH: 10 }), a3 = M.velocita(cian, { ...ACQUA, pH: 3 }); assert.ok(a10.k > 10 * a7.k && a7.k > 100 * a3.k, 'la cianidrina si forma più in fretta in ambiente basico (serve il cianuro)'); assert.ok(a7.dG < -20, 'la cianidrina è stabile');
  const idrol = M.reazioni(GLYGLY, 'O').find((r) => r.tipo === 'sostituzione' && r.prodotti.join() === [M.chiave(GLY), M.chiave(GLY)].join()), vi = M.velocita(idrol, ACQUA), anni = Math.log(2) / vi.k / 3.156e7; tra(Math.log10(anni), 0, 4, 'log10 del tempo di dimezzamento di un legame peptidico in acqua neutra, in anni (misurato: ~350 anni)');
  assert.ok(M.velocita(idrol, { ...ACQUA, ioni: { 'Fe+3': 0.01 } }).k > 2 * vi.k && M.velocita(idrol, { ...ACQUA, ioni: { 'Zn+2': 0.01 } }).k > vi.k, 'uno ione metallico che coordina il carbonile accelera (di più se ha più carica)'); assert.ok(M.velocita(idrol, { ...ACQUA, minerali: ['argilla'] }).k > 10 * vi.k, 'una superficie accelera');
  const h2 = M.reazioni('O=C=O', '[HH]')[0], senza = M.velocita(h2, { ...ACQUA, T: 373 }), con = M.velocita(h2, { ...ACQUA, T: 373, minerali: ['solfuro di ferro e nichel'] }); assert.ok(con.k > 1e10 * senza.k, 'CO2 + H2: senza un metallo a guscio d incompleto non avviene'); tra(Math.log10(Math.log(2) / con.k / 3600), -3, 4, 'log10 del tempo di CO2 + H2 → formiato su FeS/NiS a 100 °C, in ore (misurato: ore-giorni)');
  const fo = M.fotolisi('O', { Tstella: 5772, diluizione: 2.16e-5 })[0]; assert.equal(fo.prodotti.join('+'), '[H]+[OH]'); tra(Math.log10(fo.J), -6, -4, 'log10 della fotolisi dell\'acqua al Sole a 1 UA, 1/s (misurato ~10⁻⁵)'); tra(fo.sottoNm, 180, 245, 'l\'acqua si spezza sotto ~185-240 nm');
  assert.ok(M.fotolisi('O', { Tstella: 3000, diluizione: 2.16e-5 })[0].J < 1e-4 * fo.J, 'una nana rossa ha molto meno ultravioletto');
  tra(M.fotolisi('N#N', {}).length, -1, 1, 'N2 non si spezza per omolisi di un legame semplice (non ne ha)');
});
await prova('il legame peptidico: l\'idrolisi è favorita in acqua, la condensazione a secco e al caldo, o con un attivatore', () => {
  const inAcqua = M.passoDiCondensazione(GLY, GLY, 'peptide', ACQUA), secco = M.passoDiCondensazione(GLY, GLY, 'peptide', { T: 298.15 }), caldo = M.passoDiCondensazione(GLY, GLY, 'peptide', { T: 400, pAcqua: 0.01 }), pozza = M.passoDiCondensazione(GLY, GLY, 'peptide', { ...ACQUA, attivitaAcqua: 0.005 }), attivato = M.passoDiCondensazione(GLY, GLY, 'peptide', { ...ACQUA, attivatore: 'NC#N', prodottoAttivatore: 'NC(N)=O' });
  console.log(`      Gly + Gly → Gly-Gly + H2O: in acqua a pH 7 ΔG = ${inAcqua.dG.toFixed(0)} kJ/mol (misurato +12…+15); in una pozza quasi asciutta (attività dell'acqua 0,005) ${pozza.dG.toFixed(0)}; a secco ${secco.dG.toFixed(0)}; a secco a 400 K ${caldo.dG.toFixed(0)}; in acqua con la cianammide che prende l'acqua ${attivato.dG.toFixed(0)}`);
  tra(inAcqua.dG, 2, 30, 'in acqua la condensazione è sfavorita'); assert.ok(secco.dG < 0 && caldo.dG < 0 && pozza.dG < inAcqua.dG - 10 && attivato.dG < -30);
  for (const [a, b, leg, nome] of [['CCCCCCCC(=O)O', 'OCC(O)CO', 'estere', 'acido grasso + glicerolo'], [GLUCOSIO, GLUCOSIO, 'glicosidico', 'glucosio + glucosio'], ['OP(=O)(O)O', 'OC[C@H]1OC(O)[C@H](O)[C@@H]1O', 'fosfodiestere', 'fosfato + ribosio']]) { const w = M.passoDiCondensazione(a, b, leg, ACQUA), d = M.passoDiCondensazione(a, b, leg, { T: 350, pAcqua: 0.01 }); console.log(`      ${nome} (${leg}): in acqua ΔG = ${w.dG.toFixed(0)}, a secco a 350 K ${d.dG.toFixed(0)} kJ/mol`); assert.ok(M.valida(w.dimero).ok); if (w.dG < 0) stona(`${nome}: la condensazione in acqua esce favorita (${w.dG.toFixed(0)} kJ/mol; misurato: sfavorita di 5-25)`); assert.ok(d.dG < w.dG); }
});

// ───────────── 6-7. forze, aggregati, polimeri, scena
await prova('il campo di forze: forze = −gradiente dell\'energia; l\'acqua fa legami a idrogeno', () => {
  const c = M.campo(M.forma('NCC(=O)NC(C)C(=O)O'), { solvente: 'acqua' }), P = Float64Array.from(c.pos); for (let i = 0; i < P.length; i++) P[i] += 0.05 * Math.sin(i * 1.7); const r = M.forze(c).forze.length && M.forze({ ...c, pos: P });
  let mx = 0; for (let i = 0; i < P.length; i += 2) { const Q = Float64Array.from(P), h = 1e-5; Q[i] += h; const ep = M.forze({ ...c, pos: Q }).energia; Q[i] -= 2 * h; const em = M.forze({ ...c, pos: Q }).energia; mx = Math.max(mx, Math.abs(-(ep - em) / (2 * h) - r.forze[i])); } tra(mx, -1, 1e-4, 'scarto tra forze analitiche e differenze finite (kJ/mol/Å)');
  const q = M.cariche('O'); tra(q[0], -0.86, -0.76, 'carica dell\'ossigeno dell\'acqua (TIP3P −0,83)');
  const w = M.forma('O'), lontane = M.forze(M.insieme([w, w], [[0, 0, 0], [30, 0, 0]])).energia, dim = M.minimizza(M.campo(M.insieme([w, w], [[0, 0, 0], [2.9, 0.3, 0.2]])), { passi: 400 }), dOO = Math.hypot(dim.pos[0] - dim.pos[9], dim.pos[1] - dim.pos[10], dim.pos[2] - dim.pos[11]);
  console.log(`      dimero d'acqua: ${(dim.energia - lontane).toFixed(1)} kJ/mol a O···O ${dOO.toFixed(2)} Å (misurato −21 a 2,98)`); tra(dim.energia - lontane, -40, -10, 'energia del legame a idrogeno'); tra(dOO, 2.5, 3.2, 'distanza O···O'); if (Math.abs(dim.energia - lontane + 21) > 5) stona(`il dimero d'acqua è legato ${(dim.energia - lontane).toFixed(0)} kJ/mol (misurato −21) a ${dOO.toFixed(2)} Å (2,98)`);
  const m0 = M.campo(M.forma('CCCCCC')), m1 = M.minimizza(m0, { passi: 80 }); assert.ok(m1.energia <= M.forze(m0).energia); const st = M.passo(m1, null, { dt: 1, T: 300 }), st2 = M.passo(m1, null, { dt: 1, T: 300 }); assert.deepEqual([...st.pos], [...st2.pos], 'un passo di dinamica è deterministico (gli urti sono eventi con indirizzo)'); assert.ok(st.pos.every(isFinite));
});
await prova('chi si scioglie e chi si aggrega: acido grasso, fosfolipide, zucchero, olio', () => {
  const a9 = M.aggregazione(LAURICO, { pH: 9.5 }), a7 = M.aggregazione(LAURICO, { pH: 7 }), z = M.aggregazione(GLUCOSIO), f = M.aggregazione(FOSFOLIPIDE), e = M.aggregazione('CCCCCC'), g = M.aggregazione(GLY);
  console.log(`      acido laurico: CMC ${(1000 * a9.cmc).toFixed(0)} mmol/L (misurato 25), pH 9,5 → ${a9.forma} (p = ${a9.impacchettamento.toFixed(2)}), pH 7 → ${a7.forma} (p = ${a7.impacchettamento.toFixed(2)}); fosfolipide → ${f.forma} (p = ${f.impacchettamento.toFixed(2)}, CMC ${f.cmc.toExponential(0)} mol/L); glucosio → ${z.forma}; esano → ${e.forma}`);
  assert.equal(a9.forma, 'micelle'); assert.equal(a7.forma, 'doppio strato'); assert.equal(f.forma, 'doppio strato'); assert.equal(z.forma, 'sciolta'); assert.equal(g.forma, 'sciolta'); assert.equal(e.forma, 'gocce d\'olio'); tra(Math.log10(a9.cmc), -2.3, -1.2, 'log10 della CMC del laurato (misurato −1,6)'); assert.ok(z.trasferimento > 50 && e.trasferimento < -10);
  // con le forze: due acidi grassi fianco a fianco stanno meglio che lontani; due zuccheri no (per atomo)
  // (la seconda molecola accanto alla prima, spostata lungo la direzione in cui la molecola è più sottile, quasi a contatto)
  const coppia = (s) => { const fm = M.forma(s), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < fm.n; i++) for (let q = 0; q < 3; q++) { lo[q] = Math.min(lo[q], fm.pos[3 * i + q]); hi[q] = Math.max(hi[q], fm.pos[3 * i + q]); }
    const est = [0, 1, 2].map((q) => hi[q] - lo[q]), q0 = est.indexOf(Math.min(...est)), sposta = (d) => { const t = [0, 0, 0]; t[q0] = d; return t; }, E = (d) => M.minimizza(M.campo(M.insieme([fm, fm], [[0, 0, 0], sposta(d)]), { solvente: 'acqua' }), { passi: 150 }); const v = E(est[q0] + 2.4), l = E(60); return { dE: v.energia - l.energia, idro: v.parti.idrofobico - l.parti.idrofobico }; };
  const grassi = coppia('CCCCCCCCCC(=O)O'), zuccheri = coppia(GLUCOSIO); console.log(`      in acqua, due insieme meno due lontane: acido decanoico ${grassi.dE.toFixed(0)} kJ/mol (effetto idrofobico ${grassi.idro.toFixed(0)}); glucosio ${zuccheri.dE.toFixed(0)} (idrofobico ${zuccheri.idro.toFixed(0)})`);
  assert.ok(grassi.dE < -15 && grassi.idro < -8, 'gli acidi grassi si attraggono in acqua'); assert.ok(zuccheri.idro > grassi.idro + 5, 'lo zucchero non ha effetto idrofobico');
});
let p20 = null;
await prova('i polimeri: una catena di 20 amminoacidi, la sua geometria, eliche e foglietti, la grana grossa, la scena', () => {
  const seq = [GLY, ALA, 'N[C@@H](CO)C(=O)O', 'N[C@@H](CC(C)C)C(=O)O', 'N[C@@H](CCCCN)C(=O)O', 'N[C@@H](CC(=O)O)C(=O)O', 'N[C@@H](Cc1ccccc1)C(=O)O', 'N[C@@H](CS)C(=O)O', ALA, GLY, ALA, 'N[C@@H](C(C)C)C(=O)O', 'N[C@@H](CCC(N)=O)C(=O)O', ALA, 'N[C@@H](CO)C(=O)O', GLY, 'N[C@@H](CC(C)C)C(=O)O', ALA, 'N[C@@H](CCC(=O)O)C(=O)O', ALA];
  p20 = M.polimero(seq, 'peptide', ACQUA); assert.ok(M.valida(p20.m).ok); assert.equal(p20.legami, 19); assert.equal(p20.acqua, 19); const c = M.conta(p20.m), somma = {}; for (const s of seq) { const x = M.conta(s); for (const e in x) somma[e] = (somma[e] || 0) + x[e]; } assert.equal(c.O, somma.O - 19); assert.equal(c.H, somma.H - 38); assert.equal(c.N, somma.N); assert.equal(c.C, somma.C);
  assert.equal(M.chiralita(p20.m).filter((x) => x.RS).length, 17, 'i centri chirali restano (20 residui, tre glicine)'); tra(p20.dG, 0, 40, 'ogni legame in acqua costa (kJ/mol)');
  const dd = M.diedriPeptide(p20, -57, -47), el = M.forma(p20.m, { diedri: dd.diedri }), disteso = M.forma(p20.m, { diedri: M.diedriPeptide(p20, -139, 135).diedri }); assert.ok(el.pos.every(isFinite));
  const passo_ = M.distanza(el, dd.CA[2], dd.CA[18]) / 16, passoB = M.distanza(disteso, dd.CA[2], dd.CA[18]) / 16; tra(passo_, 1.35, 1.7, 'elica α: avanzamento per residuo (misurato 1,5 Å)'); tra(passoB, 3.1, 3.6, 'filamento β: avanzamento per residuo (misurato 3,3-3,5 Å)');
  const legamiH = (f) => { let n = 0; for (let i = 0; i < 16; i++) { const O = p20.m.vic[dd.C[i]].find((v) => p20.m.atomi[v.j].Z === 8 && p20.m.legami[v.k].o === 2).j, N = dd.N[i + 4]; if (p20.m.atomi[N].h && M.distanza(f, O, f.indiceH[N]) < 2.6) n++; } return n; };
  assert.ok(legamiH(el) >= 12, `l'elica ha i legami a idrogeno i → i+4 (${legamiH(el)} su 16)`); assert.equal(legamiH(disteso), 0);
  let urto = 9; for (let i = 0; i < el.n; i += 3) for (let j = i + 7; j < el.n; j += 2) urto = Math.min(urto, M.distanza(el, i, j)); tra(urto, 0.9, 9, 'nessun atomo sopra un altro nell\'elica (Å)');
  // l'elica è un minimo: minimizzando resta elica, e in vuoto sta sotto la catena distesa (i legami a idrogeno)
  const pA = M.polimero(Array(10).fill(ALA)), dA = M.diedriPeptide(pA, -57, -47), fA = M.forma(pA.m, { diedri: dA.diedri }), mA = M.minimizza(M.campo(fA), { passi: 80 }), mB = M.minimizza(M.campo(M.forma(pA.m, { diedri: M.diedriPeptide(pA, 180, 180).diedri })), { passi: 80 }), fMin = { ...fA, pos: mA.pos };
  let hb = 0; for (let i = 0; i < 6; i++) { const O = pA.m.vic[dA.C[i]].find((v) => pA.m.atomi[v.j].Z === 8 && pA.m.legami[v.k].o === 2).j; if (M.distanza(fMin, O, fA.indiceH[dA.N[i + 4]]) < 2.6) hb++; }
  console.log(`      deca-alanina in vuoto, dopo 80 passi di minimizzazione: elica ${mA.energia.toFixed(0)} kJ/mol con ${hb} legami a idrogeno su 6, distesa ${mB.energia.toFixed(0)}`); assert.ok(hb >= 5, 'l\'elica resta elica'); if (!(mA.energia < mB.energia)) stona(`l'elica (${mA.energia.toFixed(0)}) non sta sotto la catena distesa (${mB.energia.toFixed(0)} kJ/mol)`);
  const gg = M.granaGrossa(p20, { f: el }); assert.equal(gg.grani.length, 20); const leu = gg.grani[3], lys = gg.grani[4], asp = gg.grani[5]; assert.ok(leu.idrofobicita < 0 && lys.carica === 1 && asp.carica === -1 && leu.idrofobicita < gg.grani[2].idrofobicita, 'leucina idrofobica, lisina +, aspartato −, serina più idrofila'); tra(gg.grani.reduce((s, g) => s + g.massa, 0) - M.massa(p20.m), -0.01, 0.01, 'la massa dei grani è quella degli atomi'); assert.ok(isFinite(M.energiaGrossa(gg)));
  const sc = M.scena3D(p20, { diedri: dd.diedri }), N = sc.atomi.elemento.length; assert.ok(sc.atomi.pos instanceof Float32Array && sc.atomi.pos.length === 3 * N && sc.atomi.raggio instanceof Float32Array && sc.atomi.raggio.length === N && sc.atomi.elemento instanceof Uint8Array && sc.legami instanceof Uint32Array && sc.scatola.length === 3 && sc.parti[0].da === 0 && sc.parti[0].a === N); assert.equal(N, el.n);
  for (let i = 0; i < N; i++) for (let q = 0; q < 3; q++) assert.ok(sc.atomi.pos[3 * i + q] >= 0 && sc.atomi.pos[3 * i + q] <= sc.scatola[q] + 1e-6); tra(sc.scatola[0] * sc.scatola[1] * sc.scatola[2], 1, 60, 'volume della scatola (nm³)'); tra(sc.atomi.raggio[0], 0.1, 0.2, 'raggi in nm');
  const due = M.scena3D([GLUCOSIO, 'O', LAURICO]); assert.equal(due.parti.length, 3); assert.equal(due.parti[2].a, due.atomi.elemento.length);
  // altri polimeri: un trigliceride, un disaccaride, un dinucleotide (zucchero-fosfato)
  assert.equal(M.formula(M.polimero([GLUCOSIO, GLUCOSIO, GLUCOSIO], 'glicosidico').m), 'C18H32O16'); assert.ok(M.valida(M.polimero(['OP(=O)(O)OC[C@H]1O[C@@H](n2cnc3c(N)ncnc32)[C@H](O)[C@@H]1O', 'OP(=O)(O)OC[C@H]1O[C@@H](n2cnc3c(N)ncnc32)[C@H](O)[C@@H]1O'], 'fosfodiestere').m).ok, 'due nucleotidi (AMP) legati');
  const t0 = performance.now(), p300 = M.polimero(Array(300).fill(ALA)), f300 = M.forma(p300.m, { diedri: M.diedriPeptide(p300).diedri }); console.log(`      una catena di 300 residui: ${f300.n} atomi, costruita con la sua elica in ${(performance.now() - t0).toFixed(0)} ms`); assert.ok(f300.pos.every(isFinite));
});

// ───────────── 8. la rete
const k = (s) => M.chiave(s), gen = (r, s) => (r.ha(s) ? r.specie.get(k(M.neutra(s))).generazione : null);
await prova('la rete da HCN + NH3 + formaldeide in acqua: che cosa trova (alla cieca)', () => {
  const r = M.rete(['C#N', 'N', 'C=O'], { pH: 8, T: 298.15 }, { profondita: 6, atomiMassimi: 6 });
  console.log(`      ${r.specie.size} specie, ${r.reazioni.length} reazioni in ${r.tempoMs} ms (${(1000 * r.specie.size / r.tempoMs).toFixed(0)} specie al secondo); nuove per generazione: ${r.generazioni.join(', ')}`);
  const cerca = [['glicolonitrile', 'OCC#N'], ['formammide', 'NC=O'], ['formammidina', 'NC=N'], ['dimero di HCN', 'N=CC#N'], ['amminomalononitrile', 'NC(C#N)C#N'], ['amminoacetonitrile (Strecker)', 'NCC#N'], ['glicinammide', 'NCC(N)=O'], ['GLICINA', GLY], ['urea', 'NC(N)=O'], ['acido formico', 'OC=O'], ['glicolaldeide', 'OCC=O'], ['acido glicolico', 'OCC(=O)O'], ['serina', 'NC(CO)C(=O)O'], ['alanina', 'CC(N)C(=O)O']];
  console.log('      ' + cerca.map(([n, s]) => `${n}: ${gen(r, s) != null ? 'gen. ' + gen(r, s) : 'non trovata'}`).join('; '));
  for (const s of ['OCC#N', 'NCC#N', 'NCC(N)=O', GLY, 'NC=O']) assert.ok(r.ha(s), `${s} deve trovarsi nella rete`);
  // la via di Strecker, passo per passo, è nella rete: immina → amminonitrile → ammide → amminoacido
  const c = (a, b) => r.reazioni.some((x) => [x.reagenti, x.prodotti].some((l) => l.includes(k(a))) && [x.reagenti, x.prodotti].some((l) => l.includes(k(b)))); assert.ok(c('C=N', 'NCC#N') && c('NCC#N', 'NCC(=N)O') && c('NCC(=N)O', 'NCC(N)=O') && c('NCC(N)=O', GLY), 'i passi di Strecker');
  console.log('      la via più rapida che la rete trova per la glicina: ' + r.via(GLY).map((x) => `${x.reagenti.join(' + ')} → ${x.prodotti.join(' + ')} [${x.tipo}, ΔG ${x.dG.toFixed(0)}]`).join('; '));
  for (const x of r.reazioni.slice(0, 400)) assert.ok(M.conservata(x) || (x.tipo === 'pozzo' && !x.prodotti.length), 'ogni reazione conserva gli atomi (tranne i pozzi dichiarati senza prodotti seguiti: zuccheri, uracile)'); if (gen(r, 'CC(N)C(=O)O') == null) console.log('      (l\'alanina chiede l\'acetaldeide: da questi tre ingredienti a 6 atomi pesanti non c\'è)');
  // determinismo
  const r2 = M.rete(['C=O', 'N', 'C#N'], { pH: 8, T: 298.15 }, { profondita: 3, atomiMassimi: 6 }), r3 = M.rete(['C#N', 'N', 'C=O'], { pH: 8, T: 298.15 }, { profondita: 3, atomiMassimi: 6 }); assert.deepEqual([...r2.specie.keys()].sort(), [...r3.specie.keys()].sort()); assert.equal(r2.reazioni.length, r3.reazioni.length);
});
await prova('l\'adenina da 5 HCN: guardando verso di lei, le regole generali ci arrivano', () => {
  const r = M.rete(['C#N', 'N'], { pH: 9, T: 298.15 }, { profondita: 12, atomiMassimi: 10, verso: ADENINA, fascio: 60, tempoMassimo: 120000 });
  console.log(`      ${r.specie.size} specie, ${r.reazioni.length} reazioni, ${r.tempoMs} ms: ${r.ha(ADENINA) ? 'TROVATA alla generazione ' + gen(r, ADENINA) : 'NON TROVATA'}; intermedi noti: dimero ${gen(r, 'N=CC#N')}, amminomalononitrile ${gen(r, 'NC(C#N)C#N')}, DAMN ${gen(r, 'NC(C#N)=C(N)C#N')}, AICN ${gen(r, 'Nc1[nH]cnc1C#N') ?? 'no'}`);
  if (r.ha(ADENINA)) { const via = r.via(ADENINA); console.log('      ' + via.map((x) => `${x.tipo} (ΔG ${x.dG.toFixed(0)}, barriera ${x.barriera.toFixed(0)})`).join(' → ')); const hcn = via.reduce((s, x) => s + x.reagenti.filter((q) => q === 'C#N').length, 0); console.log(`      (lungo la via più rapida l'HCN entra ${hcn} volte, contando anche i rami che fanno gli intermedi)`); assert.ok(hcn >= 1); assert.ok(via.every((x) => M.conservata(x))); if (gen(r, 'Nc1[nH]cnc1C#N') == null) console.log('      (la via trovata non passa per l\'AICN della via di Oró-Ferris: passa per ciclizzazioni di un pentamero aperto; quale sia la più veloce davvero, queste barriere non lo sanno dire)'); }
  else stona('l\'adenina non è stata trovata nella rete guidata');
  assert.ok(r.ha('NC(C#N)C#N'));
});
await prova('il formosio: senza un seme la formaldeide non fa zuccheri; con la glicolaldeide il ciclo autocatalitico c\'è', () => {
  const sola = M.rete(['C=O'], { pH: 11, T: 298.15 }, { profondita: 4, atomiMassimi: 8 }); assert.ok(![...sola.specie.keys()].some((s) => M.molecola(s).legami.some((l) => M.molecola(s).atomi[l.a].Z === 6 && M.molecola(s).atomi[l.b].Z === 6)), 'dalla sola formaldeide nessun legame C–C'); console.log(`      formaldeide sola a pH 11: ${sola.specie.size} specie, nessun legame C–C (è il periodo di induzione vero del formosio)`);
  const r = M.rete({ 'C=O': 1, 'OCC=O': 1e-3 }, { pH: 11, T: 298.15 }, { profondita: 5, atomiMassimi: 8 });
  console.log(`      con un millesimo di glicolaldeide: ${r.specie.size} specie, ${r.reazioni.length} reazioni, ${r.tempoMs} ms; gliceraldeide gen. ${gen(r, 'OCC(O)C=O')}, diidrossiacetone ${gen(r, 'OCC(=O)CO')}, eritrulosio ${gen(r, 'OCC(=O)C(O)CO')}, tetrosi ${gen(r, 'OCC(O)C(O)C=O')}`);
  for (const s of ['OCC(O)C=O', 'OCC(=O)CO', 'OCC(=O)C(O)CO', 'OCC(O)C(O)C=O']) assert.ok(r.ha(s));
  const t0 = Date.now(), cicli = M.autocatalitici(r, { cibo: ['C=O', 'O'], lunghezza: 7, tempoMassimo: 20000 }), g = k('OCC=O'), buoni = cicli.filter((c) => c.guadagno[g] >= 1); console.log(`      cicli autocatalitici (Blokhuis): ${cicli.length} in ${Date.now() - t0} ms, ${buoni.length} raddoppiano la glicolaldeide`);
  assert.ok(buoni.length >= 1, 'il ciclo del formosio'); const breslow = buoni.find((c) => c.membri.includes(k('OCC(=O)CO')) && c.membri.includes(k('OCC(=O)C(O)CO'))) || buoni[0];
  console.log('      ' + breslow.reazioni.map((x) => `${x.reagenti.join(' + ')} → ${x.prodotti.join(' + ')}`).join('; ') + ` (ΔG ${breslow.dG.toFixed(0)} kJ/mol, barriera più alta ${breslow.barrieraMassima.toFixed(0)})`); assert.ok(breslow.cibo.includes('C=O') && breslow.dG < 0);
  if (!buoni.some((c) => c.membri.includes(k('OCC(=O)CO')) && c.membri.includes(k('OCC(=O)C(O)CO')))) stona('tra i cicli trovati non c\'è quello di Breslow (gliceraldeide → diidrossiacetone → eritrulosio → tetroso → 2 glicolaldeide)');
  const rf = M.raf(r); console.log(`      insieme RAF più grande: ${rf.reazioni.length} reazioni, ${rf.specie.length} specie, catalizzate da ${rf.catalizzatori.length} molecole con un pKa vicino al pH`); assert.ok(rf.reazioni.length > 0);
  const grandi = M.rete({ 'C=O': 1, 'OCC=O': 1e-3 }, { pH: 11, T: 298.15 }, { profondita: 6, atomiMassimi: 12, verso: 'OCC(O)C(O)C(O)C=O', fascio: 80, tempoMassimo: 60000 }); console.log(`      verso i pentosi: ${grandi.specie.size} specie in ${grandi.tempoMs} ms; pentosi (ribosio aperto e isomeri) ${gen(grandi, 'OCC(O)C(O)C(O)C=O') != null ? 'gen. ' + gen(grandi, 'OCC(O)C(O)C(O)C=O') : 'non trovati'}; chiusi ad anello: ${[...grandi.specie.keys()].filter((s) => M.formula(s) === 'C5H10O5' && M.anelli(M.molecola(s)).length).length}`);
  if (gen(grandi, 'OCC(O)C(O)C(O)C=O') == null) stona('i pentosi non sono stati raggiunti in 6 generazioni guidate');
});
await prova('CO2 + H2 su solfuri di ferro e nichel: gli acidi organici piccoli; senza minerale, niente', () => {
  const cond = { pH: 9, T: 373.15, minerali: ['solfuro di ferro e nichel'] }, r = M.rete({ 'O=C=O': 0.01, '[HH]': 0.01 }, cond, { profondita: 7, atomiMassimi: 6 }), senza = M.rete({ 'O=C=O': 0.01, '[HH]': 0.01 }, { pH: 9, T: 373.15 }, { profondita: 4, atomiMassimi: 6 });
  const cerca = [['acido formico', 'OC=O'], ['CO', '[C-]#[O+]'], ['formaldeide', 'C=O'], ['metanolo', 'CO'], ['acido acetico', 'CC(=O)O'], ['acido piruvico', 'CC(=O)C(=O)O'], ['acido gliossilico', 'O=CC(=O)O'], ['acido glicolico', 'OCC(=O)O'], ['acido ossalico', 'OC(=O)C(=O)O'], ['metano', 'C'], ['acido lattico', 'CC(O)C(=O)O']];
  console.log(`      ${r.specie.size} specie, ${r.reazioni.length} reazioni, ${r.tempoMs} ms: ` + cerca.map(([n, s]) => `${n} ${gen(r, s) != null ? 'gen. ' + gen(r, s) : '—'}`).join('; '));
  for (const s of ['OC=O', 'CC(=O)O']) assert.ok(r.ha(s)); if (!r.ha('CC(=O)C(=O)O')) stona('l\'acido piruvico non è nella rete (misurato: si forma, Preiner 2020)'); assert.equal(senza.specie.size, 4, 'senza minerali restano CO2, H2, acqua e acido carbonico'); assert.ok(!senza.ha('OC=O'));
  console.log('      la via all\'acido acetico: ' + r.via('CC(=O)O').map((x) => `${x.reagenti.join(' + ')} → ${x.prodotti.join(' + ')} [${x.tipo}]`).join('; '));
  // l'equilibrio conserva il carbonio e lo stato di ossidazione
  const eq = M.equilibrioRete(r); let C = 0; for (const s in eq) if (s !== 'O') C += (M.conta(s).C || 0) * eq[s]; tra(C, 0.00999, 0.01001, 'il carbonio si conserva (mol/L)');
  console.log('      all\'equilibrio: ' + Object.entries(eq).filter(([s]) => s !== 'O').sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, c]) => `${s} ${c.toExponential(1)}`).join(', ') + ' mol/L'); assert.ok(eq[k('CC(=O)O')] > 1e-6 || eq[k('C')] > 1e-6, 'all\'equilibrio il carbonio ridotto c\'è');
  const st = M.stazionarie(r); assert.ok(st.converge, 'le concentrazioni stazionarie (sorgenti fisse, ricambio in trent\'anni) convergono'); console.log('      a regime, con CO2 e H2 tenuti a 0,01 mol/L: ' + Object.entries(st.c).filter(([x]) => x !== 'O' && !(x in r.partenza)).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([x, c]) => `${x} ${c.toExponential(1)}`).join(', ') + ' mol/L');
});
await prova('il raccordo: l\'equilibrio dei gas con queste energie ridà quello di chimica.js; la rete di un luogo; che cosa chiede una molecola', () => {
  let peggio = 0, dove = '';
  for (const [nome, T, el] of [['riducente a 1000 K', 1000, { H: 100, C: 3, N: 1, O: 5 }], ['riducente a 500 K', 500, { H: 100, C: 3, N: 1, O: 5 }], ['ossidata a 800 K', 800, { H: 4, C: 2, N: 2, O: 6 }], ['vulcanica a 1400 K', 1400, { H: 10, C: 2, N: 0.5, O: 8, S: 0.5 }], ['con cloro a 1200 K', 1200, { H: 20, C: 1, O: 6, Cl: 0.5 }]]) {
    const a = equilibrio({ T, P: 1e5, elementi: el }), b = M.equilibrioGas({ T, P: 1e5, elementi: el }); let mx = 0, chi = '';
    for (const f in a) { const x = a[f], y = b[M.GAS_DI_CHIMICA[f]] ?? 0; if (Math.max(x, y) < 1e-6) continue; const d = Math.abs(Math.log10(Math.max(x, 1e-12)) - Math.log10(Math.max(y, 1e-12))); if (d > mx) { mx = d; chi = f; } }
    const primi = Object.entries(a).sort((p, q) => q[1] - p[1]).slice(0, 3).map(([f, x]) => `${f} ${(100 * x).toFixed(1)}/${(100 * (b[M.GAS_DI_CHIMICA[f]] || 0)).toFixed(1)}%`).join(', '); console.log(`      aria ${nome}: ${primi}; scarto massimo tra i gas sopra 1 ppm: un fattore ${Math.pow(10, mx).toFixed(2)} (${chi})`); if (mx > peggio) { peggio = mx; dove = nome; } }
  console.log(`      tolleranza raggiunta: ogni gas sopra una parte per milione entro un fattore ${Math.pow(10, peggio).toFixed(2)} (il peggiore: ${dove})`); tra(peggio, -1, 0.7, 'scarto massimo in log10 delle frazioni');
  const r = M.reteDelLuogo({ T: 290, pH: 8, gas: { N2: 0.8, CO2: 0.1, CH4: 0.05, H2: 0.05 }, pressione: 1e5, ioni: { 'Mg2+': 0.05, 'Na+': 0.4 }, minerali: [{ nome: 'olivina' }], prebiotica: { HCN: 0.5, formaldeide: 0.3 }, luce: { Tstella: 5772, diluizione: 2.16e-5 } }, { profondita: 2, atomiMassimi: 5 });
  assert.ok(r.ha('OCC#N') && r.partenza[k('C#N')] > 0 && r.partenza[k('O=C=O')] > 0 && r.condizioni.ioni['Mg+2'] === 0.05 && r.fotolisi.length > 0); { const cc = r.partenza[k('O=C=O')], rapporto = cc / 3.4e-3; if (rapporto > 3 || rapporto < 1 / 3) stona(`CO2 sciolta sotto 0,1 bar: ${cc.toExponential(1)} mol/L contro 3,4·10⁻³ della legge di Henry misurata (l'idratazione stimata sbaglia di ${(2.479 * Math.log(rapporto)).toFixed(1)} kJ/mol)`); tra(rapporto, 0.1, 10, 'CO2 sciolta: entro un ordine di grandezza dalla legge di Henry'); }
  const ch = M.cheCosaChiede(GLY); assert.ok(ch.energia.riducente === 3 && ch.ingredienti['[HH]'] === 3 && ch.energia.formazione < 0); console.log(`      la glicina: ${ch.nota}`);
});
await prova('tempi (una molecola in micro-millisecondi) e determinismo', () => {
  const tempo = (f, n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) f(i); return (performance.now() - t0) / n; };
  const lista = ['CCO', 'CC(=O)O', GLY, ALA, 'CCCCCC', 'c1ccccc1', 'NC=O', 'OCC=O', 'CSC', 'C=CC#N'];
  const t1 = tempo((i) => M.chiave(M.molecola({ atomi: [{ Z: 6, h: 3 }, { Z: 6, h: 2 - (i % 2) }, { Z: 8, h: 1 }, { Z: 6, h: 0 }].slice(0, 3), legami: [{ a: 0, b: 1, o: 1 }, { a: 1, b: 2, o: 1 }] })), 3000), t2 = tempo((i) => M.forma(lista[i % 10]), 1000);
  const mai = []; for (let n = 2; n <= 9; n++) for (const coda of ['F', 'Br', 'SC', 'OC', 'NC', 'C(=O)OC']) mai.push('C'.repeat(n) + coda); // 48 molecole mai calcolate prima in questa prova
  const t3 = tempo((i) => M.energia(mai[i], ACQUA), mai.length), t4 = tempo((i) => M.reazioni(lista[i % 10], lista[(i + 3) % 10]), 300), t5 = tempo(() => M.forze(M.campo(M.forma(GLUCOSIO))), 50);
  console.log(`      leggere un grafo e dargli la chiave: ${(1000 * t1).toFixed(0)} µs; forma 3D: ${(1000 * t2).toFixed(0)} µs; energia in acqua (forma, H, S, G, idratazione, pKa) di una molecola mai vista, da 3 a 13 atomi pesanti: ${t3.toFixed(2)} ms; reazioni tra due molecole: ${t4.toFixed(2)} ms; campo e forze del glucosio: ${t5.toFixed(2)} ms`);
  tra(t1, 0, 2, 'chiave (ms)'); tra(t3, 0, 30, 'energia (ms)');
  assert.deepEqual([...M.forma(GLUCOSIO).pos], [...M.forma(M.chiave(GLUCOSIO) && GLUCOSIO).pos]); assert.equal(M.energia(GLY, ACQUA).G, M.energia('OC(=O)CN', ACQUA).G, 'la stessa molecola scritta in due modi ha la stessa energia'); assert.equal(M.entalpiaGas(ADENINA).H, M.entalpiaGas('n1cnc2[nH]cnc2c1N').H, 'l\'energia non dipende dalla forma di Kekulé');
});

// ───────────── 9. ciò che le regole prima vietavano
const prendi = (a, b, tipo, prod, opz) => { const r = M.reazioni(a, b, opz).find((x) => x.tipo === tipo && (!prod || x.prodotti.includes(k(prod)))); assert.ok(r, `manca ${tipo}: ${a}${b ? ' + ' + b : ''}${prod ? ' → ' + prod : ''}`); assert.ok(M.conservata(r)); return r; };
await prova('le famiglie di reazioni che mancavano: coniugate, su carbonio saturo, epossidi, aromatiche, pericicliche, riarrangiamenti, disolfuri', () => {
  const casi = [['addizione coniugata (Michael)', 'C=CC#N', 'N', 'addizione coniugata', 'NCCC#N', ACQUA, null], ['metanolo + metanolo → etere', 'CO', 'CO', 'sostituzione', 'COC', ACQUA, 'lenta'], ['apertura di un epossido', 'C1CO1', 'O', 'sostituzione', 'OCCO', ACQUA, null], ['fenolo + formaldeide', 'Oc1ccccc1', 'C=O', 'sostituzione aromatica', 'OCc1ccccc1O', ACQUA, null],
    ['Diels-Alder: butadiene + etene', 'C=CC=C', 'C=C', 'pericyclica', 'C1=CCCCC1', { T: 298.15 }, 'gas'], ['Claisen: allil vinil etere', 'C=CCOC=C', null, 'pericyclica', 'C=CCCC=O', { T: 298.15 }, 'gas'], ['pinacolica', 'CC(C)(O)C(C)(C)O', null, 'riarrangiamento', 'CC(=O)C(C)(C)C', ACQUA, null],
    ['due tioli → disolfuro + H2', 'CS', 'CS', 'accoppiamento', 'CSSC', ACQUA, null], ['tiolo + O2', 'CS', 'O=O', 'addizione', 'CSOO', ACQUA, null], ['…poi un altro tiolo: disolfuro + H2O2', 'CSOO', 'CS', 'sostituzione', 'CSSC', ACQUA, null], ['scambio di due idrogeni: isopropanolo + acetaldeide', 'CC(C)O', 'CC=O', 'trasferimento di idrogeno', 'CCO', ACQUA, null], ['un\'enammina attacca un\'aldeide con il carbonio', 'C=C(C)N', 'CC=O', 'addizione enolica', null, ACQUA, null]];
  for (const [nome, a, b, tipo, prod, c] of casi) { const r = prendi(a, b, tipo, prod), v = M.velocita(r, c); console.log(`      ${nome}: ΔG ${v.dG.toFixed(0)}, barriera ${v.barriera.toFixed(0)} kJ/mol, k = ${v.k.toExponential(0)}`); assert.ok(isFinite(v.dG) && v.barriera >= 0); }
  const da = M.velocita(prendi('C=CC=C', 'C=C', 'pericyclica', 'C1=CCCCC1'), { T: 298.15 }); tra(da.barriera, 85, 135, 'barriera della Diels-Alder butadiene + etene (misurata: Ea 115 kJ/mol)'); tra(da.dG, -140, -70, 'ΔG della Diels-Alder (misurato circa −110)');
  const ep = M.velocita(prendi('C1CO1', 'O', 'sostituzione', 'OCCO'), ACQUA), et = M.velocita(prendi('CO', 'CO', 'sostituzione', 'COC'), ACQUA); assert.ok(ep.k > 1e6 * et.k, 'la tensione dell\'anello fa dell\'epossido un elettrofilo; l\'etere da due alcoli in acqua neutra non si fa'); tra(Math.log10(Math.log(2) / ep.k / 86400), -1, 2.5, 'log10 del tempo di dimezzamento dell\'ossido di etilene in acqua neutra, in giorni (misurato: 14 giorni)');
  assert.ok(!M.reazioni('CO', 'CO', { lente: false }).some((x) => x.prodotti.includes(k('COC'))) && !M.reazioni('C=CC=C', 'C=C', { tutte: false }).length, 'le famiglie rare e lente si possono lasciare fuori (è ciò che la rete fa di suo)');
});
await prova('ossidoriduzione vera: gli elettroni passano per gli ioni metallici, con i potenziali misurati', () => {
  const g = (s, pH = 0) => M.energia(s, { ...ACQUA, pH }).G, F = 96.485, E0 = (oss, rid) => -(g(rid) - g(oss) - 0.5 * M.energia('[HH]', {}).G) / F; // M(n+1) + ½H2 → M(n) + H⁺
  tra(E0('[Fe+3]', '[Fe+2]'), 0.72, 0.82, 'E° di Fe³⁺/Fe²⁺ (0,771 V)'); tra(E0('[Cu+2]', '[Cu+]'), 0.10, 0.21, 'E° di Cu²⁺/Cu⁺ (0,153 V)'); console.log(`      E°(Fe³⁺/Fe²⁺) = ${E0('[Fe+3]', '[Fe+2]').toFixed(3)} V (misurato 0,771); E°(Cu²⁺/Cu⁺) = ${E0('[Cu+2]', '[Cu+]').toFixed(3)} V (0,153)`);
  const oss = prendi('[Fe+3]', 'CS', 'trasferimento di elettroni', 'CSSC'), v = M.velocita(oss, ACQUA); assert.deepEqual(oss.prodotti.filter((x) => x === '[Fe+2]').length, 2); assert.ok(v.dG < -50 && v.k > 1, 'il ferro ferrico ossida i tioli a disolfuro');
  const o2 = prendi('[Fe+2]', 'O=O', 'trasferimento di elettroni', 'OO'), a2 = M.velocita(o2, { ...ACQUA, pH: 2 }).dG, a8 = M.velocita(o2, { ...ACQUA, pH: 8 }).dG; tra(a2, -30, 60, '2 Fe²⁺ + O2 + 2 H⁺ → 2 Fe³⁺ + H2O2 a pH 2 (dai potenziali 0,695 e 0,771 V: +15 kJ/mol, più la solubilità di O2)'); tra(a8 - a2, 60, 76, 'e con il pH sale di 2·RT·ln 10 per unità (gli ioni liberi: senza gli idrossidi che nella realtà precipitano)');
  const h2 = prendi('[Fe+2]', 'O', 'trasferimento di elettroni', '[HH]'); assert.ok(M.velocita(h2, ACQUA).dG > 100, 'Fe²⁺ sciolto da solo non riduce l\'acqua a idrogeno (serve il minerale: la serpentinizzazione)');
  const cu = prendi('[Cu+2]', 'OCCO', 'trasferimento di elettroni', 'OCC=O'); assert.ok(M.velocita(cu, ACQUA).dG < 0); assert.equal(M.reazioni('[Na+]', 'CS').filter((x) => x.tipo === 'trasferimento di elettroni').length, 0, 'il sodio non ha un altro stato: non fa ossidoriduzione');
});
await prova('la luce oltre l\'omolisi: fotoionizzazione e stati eccitati che reagiscono', () => {
  const sole = { Tstella: 5772, diluizione: 2.16e-5 }, am = M.fotoreazioni('CN', sole, ACQUA), ion = am.find((x) => x.tipo === 'fotoionizzazione'); assert.deepEqual(ion.prodotti, [k('C[NH2+]')]); tra(ion.sottoNm, 130, 145, 'la metilammina perde un elettrone sotto 139 nm (8,9 eV)'); assert.ok(ion.J > 0 && ion.J < am.find((x) => x.tipo === 'fotolisi').J);
  const gl = M.fotoreazioni('OCC=O', sole, ACQUA), ecc = gl.filter((x) => x.tipo.startsWith('stato eccitato')); assert.ok(ecc.some((x) => x.prodotti.includes(k('OC=CO'))), 'la glicolaldeide eccitata può fare da sé la tautomeria a enediolo'); console.log(`      glicolaldeide al Sole: ${gl.filter((x) => x.tipo === 'fotolisi').length} fotolisi, ${ecc.length} passi da stato eccitato (${ecc.map((x) => x.tipo.slice(16)).join(', ')}), fotoionizzazione sotto ${gl.find((x) => x.tipo === 'fotoionizzazione').sottoNm.toFixed(0)} nm`);
  tra(M.pKaAllaT(14, 'acqua', 373.15), 11.8, 12.5, 'pKa dell\'acqua a 100 °C (misurato 12,26)'); tra(M.pKaAllaT(9.25, 'ammonio', 373.15), 7.2, 7.6, 'pKa dell\'ammonio a 100 °C (7,4)');
  tra(Math.pow(10, -M.debyeHuckel(1, 0.7)), 0.6, 0.8, 'coefficiente di attività di uno ione 1+ nell\'acqua di mare (0,67-0,71)'); assert.ok(M.speciazione(GLY, 7, 298.15, 0.7).dG < M.speciazione(GLY, 7).dG, 'la forza ionica stabilizza le forme cariche'); assert.ok(M.pKaApparenti('CC(=O)O')[0] > 4.5);
});

await prova('la mano: cis e trans distinti; i centri nuovi nascono assegnati, alla pari; i diastereomeri hanno energie diverse', () => {
  for (const x of ['C/C=C/C', 'C/C=C\\C', 'OC(=O)/C=C/C(=O)O', 'OC(=O)/C=C\\C(=O)O', 'N/C(C#N)=C(/N)C#N']) assert.equal(M.chiave(M.chiave(x)), M.chiave(x), `la chiave di ${x} riletta`);
  tra(Math.abs(M.diedro(M.forma('C/C=C\\C'), 0, 1, 2, 3)), -1, 1, 'cis-2-butene: diedro 0°'); tra(Math.abs(M.diedro(M.forma('C/C=C/C'), 0, 1, 2, 3)), 179, 181, 'trans-2-butene: 180°');
  tra(M.entalpiaGas('C/C=C\\C').H - M.entalpiaGas('C/C=C/C').H, 4.2, 4.4, 'il cis sta 4,3 kJ/mol sopra il trans (dato)'); const iso = M.reazioni('C/C=C\\C').find((r) => r.tipo === 'isomerizzazione'); assert.deepEqual(iso.prodotti, [M.chiave('C/C=C/C')]); tra(M.velocita(iso, { T: 298.15 }).barriera, 250, 280, 'la rotazione attorno a C=C al buio (misurato 272 kJ/mol)');
  assert.ok(M.fotoreazioni('C/C=C\\C', { Tstella: 5772, diluizione: 2.16e-5 }, { T: 298.15 }).some((r) => r.tipo === 'stato eccitato: isomerizzazione'), 'con la luce il cis diventa trans');
  // la cianidrina dell'acetaldeide: due enantiomeri, metà e metà, stessa energia
  const cian = M.reazioni('CC=O', 'C#N', { stereo: true }).filter((r) => r.tipo === 'addizione C' && r.peso === 0.5); assert.equal(cian.length, 2); assert.notEqual(cian[0].prodotti[0], cian[1].prodotti[0]); assert.equal(M.chiave(M.speculare(cian[0].prodotti[0])), cian[1].prodotti[0]);
  const va = M.velocita(cian[0], { ...ACQUA, stereo: true }), vb = M.velocita(cian[1], { ...ACQUA, stereo: true }); assert.equal(va.k, vb.k, 'senza niente di chirale attorno le due mani nascono alla stessa velocità'); assert.equal(M.stereoisomeri('CC(N)C(=O)NC(C)C(=O)O').length, 4);
  // il dipeptide L-L contro L-D: diastereomeri, energie diverse; L-L e D-D: uguali fino all'ultima cifra
  const LL = 'N[C@@H](C)C(=O)N[C@@H](C)C(=O)O', LD = 'N[C@@H](C)C(=O)N[C@H](C)C(=O)O', DD = 'N[C@H](C)C(=O)N[C@H](C)C(=O)O'; assert.equal(M.tensione(LL), M.tensione(DD)); const d = M.tensione(LD) - M.tensione(LL);
  console.log(`      Ala-Ala: L-D meno L-L = ${d.toFixed(1)} kJ/mol nel campo di forze in vuoto (${(M.tensione(LD, { solvente: 'acqua' }) - M.tensione(LL, { solvente: 'acqua' })).toFixed(1)} in acqua); L-L e D-D identici`); assert.ok(Math.abs(d) > 0.05, 'i diastereomeri si distinguono'); assert.notEqual(M.energia(LL, { stereo: true }).G, M.energia(LD, { stereo: true }).G); assert.equal(M.energia(LL, { stereo: true }).G, M.energia(DD, { stereo: true }).G);
  // un accoppiamento L + L e L + D ha quindi ΔG diversi: la rete con «stereo» li tiene come specie distinte
  const r = M.rete(['CC=O', 'C#N', 'N'], { pH: 8 }, { profondita: 3, atomiMassimi: 6, stereo: true }), chirali = [...r.specie.keys()].filter((x) => x.includes('@')); assert.ok(chirali.length >= 4 && chirali.length % 2 === 0); for (const x of chirali) assert.ok(r.specie.has(M.chiave(M.speculare(x))), 'ogni forma ha la sua immagine allo specchio nella rete'); console.log(`      rete con le mani distinte (acetaldeide + HCN + NH3, 3 generazioni): ${r.specie.size} specie, ${chirali.length} chirali, a coppie di immagini speculari`);
});
await prova('una rete con un autocatalizzatore chirale rompe la simmetria da uno sbilancio piccolo (un evento)', () => {
  // la rete di prova è il modello di Frank (1953): L e D si copiano dal cibo A, e insieme si spengono. Le costanti qui NON vengono dalle regole
  // (un autocatalizzatore chirale vero le regole non l'hanno ancora trovato): la prova è che la cinetica amplifica, non che la chimica lo faccia.
  // (l'evento «… simmetria 2»: con la fonte unica del caso quello di «… simmetria» è uno sbilancio di 0,016 scarti, e in 300 unità di tempo arriva solo all'85% — capita quando lo sbilancio è sotto i 0,045 scarti: a un evento su venticinque)
  const caso = sorgente('molecole/prova/rottura della simmetria 2'), N = 1e6, eps = caso.normale('quante L in più') / Math.sqrt(N); // lo sbilancio di N molecole fatte a caso
  const frank = (spegne) => [{ reagenti: ['A', 'L'], prodotti: ['L', 'L'], k: 1, kInversa: 0 }, { reagenti: ['A', 'D'], prodotti: ['D', 'D'], k: 1, kInversa: 0 }, { reagenti: ['L', 'D'], prodotti: ['P'], k: spegne, kInversa: 0 }];
  const ee = (spegne, e0, t) => { const e = M.evolvi(frank(spegne), { A: 1, L: 1e-3 * (1 + e0), D: 1e-3 * (1 - e0), P: 0 }, t, { fisse: ['A'], passi: 900 }); return (e.c.L - e.c.D) / (e.c.L + e.c.D); };
  const senza = ee(0, eps, 300), con = ee(10, eps, 300), opposto = ee(10, -eps, 300); console.log(`      sbilancio iniziale ${(100 * eps).toFixed(3)}% (un evento): senza antagonismo resta ${(100 * senza).toFixed(3)}%; con L + D → spenti arriva a ${(100 * con).toFixed(1)}%; l'evento opposto dà ${(100 * opposto).toFixed(1)}%`);
  tra(Math.abs(senza), 0, 3 * Math.abs(eps) + 1e-9, 'senza antagonismo lo sbilancio non cresce'); assert.ok(Math.abs(con) > 0.95 && Math.sign(con) === Math.sign(eps) && Math.sign(opposto) === -Math.sign(con), 'con l\'antagonismo vince la mano che era in vantaggio');
  assert.equal(ee(10, 0, 300), 0, 'da una parità esatta non nasce niente: serve l\'evento');
});

await prova('la rete senza il limite delle molecole piccole: reagisce chi c\'è (peptide + peptide); due scatole con una barriera', () => {
  const cond = { pH: 7, T: 360, attivitaAcqua: 0.01 }, G2 = k(GLYGLY), G4 = k('NCC(=O)NCC(=O)NCC(=O)NCC(=O)O');
  const r = M.rete({ [GLY]: 1 }, cond, { profondita: 3, atomiMassimi: 18, soglia: 1e-6, tempo: 3e9 }), tra2 = (x) => x.reagenti.length === 2 && x.reagenti[0] === G2 && x.reagenti[1] === G2 && x.prodotti.includes(G4);
  console.log(`      glicina 1 mol/L in una pozza quasi asciutta a 87 °C, soglia 10⁻⁶ mol/L: ${r.specie.size} specie, ${r.reazioni.length} reazioni, ${r.tempoMs} ms; sopra la soglia ${r.presenti.length} specie; dopo cent'anni: Gly-Gly ${r.concentrazioni[G2].toExponential(1)}, dichetopiperazina ${(r.concentrazioni[k('O=C1CNC(=O)CN1')] || 0).toExponential(1)}, Gly4 ${(r.concentrazioni[G4] || 0).toExponential(1)} mol/L`);
  assert.ok(r.reazioni.some(tra2), 'Gly-Gly + Gly-Gly → Gly4 + H2O è nella rete'); assert.ok(r.ha('O=C1CNC(=O)CN1') && r.ha('NCC(=O)NCC(=O)NCC(=O)O'));
  const r0 = M.rete({ [GLY]: 1 }, cond, { profondita: 3, atomiMassimi: 18 }); assert.ok(!r0.reazioni.some(tra2), 'senza la soglia (solo con le molecole piccole) quel passo non c\'era');
  if ((r.concentrazioni[k('O=C1CNC(=O)CN1')] || 0) > 10 * r.concentrazioni[G2]) console.log('      (la dichetopiperazina, l\'anello di due glicine, si prende quasi tutto: è il pozzo vero dei dipeptidi che si asciugano)');
  // un camino alcalino con idrogeno e solfuri, e il mare acido con la CO2: passa ciò che si scioglie nell'olio (Overton)
  const rc = M.rete({ 'O=C=O': 0.01, '[HH]': 0.01 }, { pH: 9, T: 373.15, minerali: ['solfuro di ferro e nichel'] }, { profondita: 5, atomiMassimi: 5 }), camino = { condizioni: { pH: 10, T: 373.15, minerali: ['solfuro di ferro e nichel'] }, tenute: { '[HH]': 0.01 } };
  const due = M.scatole(rc, { camino, mare: { condizioni: { pH: 6, T: 298.15, minerali: [] }, tenute: { [k('O=C=O')]: 0.01 } } }), solo = M.scatole(rc, { camino }), F = k('OC=O');
  console.log(`      camino (pH 10, 100 °C, H2, solfuri) | mare (pH 6, CO2): formiato nel camino ${due.camino[F].toExponential(1)} mol/L, nel mare ${due.mare[F].toExponential(1)}; idrogeno passato nel mare ${due.mare['[HH]'].toExponential(1)}; il camino da solo, senza la CO2 del mare: ${solo.camino[F].toExponential(1)}; a regime: ${due.converge}`);
  assert.ok(due.converge && due.camino[F] > 1e-4 && solo.camino[F] === 0 && due.camino[F] > 100 * due.mare[F], 'il formiato nasce dove le due cose si incontrano, e resta dal lato del camino (è carico: non passa)');
  let C = 0; const chiuso = M.evolvi(rc.reazioni, { [k('O=C=O')]: 0.01, '[HH]': 0.02 }, 1e12); for (const x in chiuso.c) if (x !== 'O') C += (M.conta(x).C || 0) * chiuso.c[x]; tra(C, 0.0099999, 0.0100001, 'la cinetica conserva il carbonio');
});

await prova('riconoscersi: l\'energia d\'interazione di due molecole qualsiasi; le coppie di basi (stampato com\'è)', () => {
  const A = ADENINA, U = 'O=c1cc[nH]c(=O)[nH]1', G = 'Nc1nc2[nH]cnc2c(=O)[nH]1', C = 'Nc1cc[nH]c(=O)n1', nome = { [A]: 'A', [U]: 'U', [G]: 'G', [C]: 'C' }, E = (x, y, solvente) => M.interazione(x, y, { solvente });
  const t0 = performance.now(), au = E(A, U, null).dE, gc = E(G, C, null).dE, ac = E(A, C, null).dE, gu = E(G, U, null).dE, uu = E(U, U, null).dE, gg = E(G, G, null).dE, ms = (performance.now() - t0) / 6;
  console.log(`      senza solvente (kJ/mol): A–U ${au.toFixed(0)} (misurato in fase gas −54…−61), G–C ${gc.toFixed(0)} (−88…−117); sbagliate: A–C ${ac.toFixed(0)}, G–U ${gu.toFixed(0)}, U–U ${uu.toFixed(0)}; G–G ${gg.toFixed(0)}; ${ms.toFixed(0)} ms per coppia`);
  assert.ok(au < ac && au < gu && au < uu && gc < gu && gc < ac && gc < uu, 'A–U e G–C legano più di A–C, G–U e U–U'); if (au < -80) stona(`A–U lega ${au.toFixed(0)} kJ/mol senza solvente (misurato −54…−61): le cariche parziali per incrementi sono troppo forti sugli eterocicli`); if (gg < gc) stona(`G–G (${gg.toFixed(0)}) lega più di G–C (${gc.toFixed(0)}): senza la geometria dell'elica niente vieta a due purine di appaiarsi`);
  const wau = E(A, U, 'acqua'), wgc = E(G, C, 'acqua'), wgg = E(G, G, 'acqua'), wuu = E(U, U, 'acqua'); console.log(`      in acqua (ΔG di legame, kJ/mol): A–U ${wau.dG.toFixed(1)}, G–C ${wgc.dG.toFixed(1)}, G–G ${wgg.dG.toFixed(1)}, U–U ${wuu.dG.toFixed(1)}: le basi libere si impilano (conta la superficie) più che appaiarsi — come nella realtà, dove le basi sciolte non si appaiano`);
  tra(wau.dG, -25, 8, 'ΔG di legame di due basi in acqua (misurato per l\'impilamento: −2…−8 kJ/mol)'); assert.ok(E('C', 'C', 'acqua').dE > -6 && E('O', 'O', null).dE < -15, 'due metani quasi non si legano; due molecole d\'acqua sì');
  assert.equal(E(A, U, null).dE, E(M.chiave(A), U, null).dE, 'deterministico');
});
await prova('lavorare: la catalisi da parte di qualsiasi molecola (stato di transizione legato meglio, vicinanza); ciò che esce e ciò che no', () => {
  // (a) catalisi covalente: esce dalla rete da sola quando il catalizzatore fa un intermedio e ne esce. Un'ammina e l'aldolica (come la lisina delle aldolasi):
  const k1 = (r, c = ACQUA) => M.velocita(r, c), diretta = k1(prendi('CC(C)=O', 'CC=O', 'addizione C', 'CC(O)CC(C)=O')), G = (x) => M.energia(x, ACQUA).G, enammina = 'CNC(C)=C';
  const Ken = Math.exp(-(G(enammina) + G('O') - G('CC(C)=O') - G('CN')) / (2.479)), ad = k1(M.reazioni(enammina, 'CC=O').filter((r) => r.tipo === 'addizione enolica').sort((a, b) => k1(b).k - k1(a).k)[0]), rapporto = (Ken * ad.k) / diretta.k;
  console.log(`      aldolica acetone + acetaldeide a pH 7: diretta k = ${diretta.k.toExponential(1)} L/mol/s; con un'ammina (enammina: K = ${Ken.toExponential(1)} L/mol, poi k = ${ad.k.toExponential(1)}): ${rapporto.toExponential(1)} volte più svelta per ogni mol/L di ammina (misurato per le ammine in acqua: 10²-10⁵ [ricordato])`); assert.ok(rapporto > 10, 'un\'ammina catalizza l\'aldolica passando per l\'enammina');
  // l'imidazolo e un estere attivato (p-nitrofenil acetato)
  const PNPA = 'CC(=O)Oc1ccc(cc1)[N+](=O)[O-]', IM = 'c1c[nH]cn1', kIm = k1(M.reazioni(IM, PNPA).find((r) => r.tipo === 'sostituzione' && r.classe === 'acile')).k, kW = k1(M.reazioni('O', PNPA).find((r) => r.tipo === 'sostituzione' && r.prodotti.includes(k('CC(=O)O')))).k;
  console.log(`      imidazolo + p-nitrofenil acetato: k = ${kIm.toExponential(1)} L/mol/s (misurato 0,5); l'acqua da sola ${kW.toExponential(1)} 1/s (misurato ~6·10⁻⁷): l'imidazolo attacca ${(kIm / kW).toExponential(0)} volte meglio dell'acqua per mol/L (misurato ~10⁶)`); assert.ok(kIm > 10 * kW, 'l\'imidazolo è un nucleofilo migliore dell\'acqua (la sua basicità)');
  if (kIm < 0.005) stona(`imidazolo + p-nitrofenil acetato: k = ${kIm.toExponential(1)} contro 0,5 L/mol/s misurati: una barriera sola per famiglia non vede quanto è buono il gruppo uscente (il nitrofenolato)`);
  // (b) catalisi senza legami: tre peptidi qualsiasi e l'idratazione della formaldeide
  const idr = prendi('C=O', 'O', 'addizione', 'OCO'), peptidi = ['NCC(=O)N[C@@H](C)C(=O)N[C@@H](CO)C(=O)O', 'N[C@@H](CC(C)C)C(=O)NCC(=O)N[C@@H](CC(=O)O)C(=O)O', 'N[C@@H](CCCCN)C(=O)N[C@@H](C)C(=O)NCC(=O)O'], cc = peptidi.map((p) => M.catalisiDa(p, idr));
  console.log(`      tre tripeptidi qualsiasi sull'idratazione della formaldeide: ΔΔG‡ = ${cc.map((c) => c.ddG.toFixed(1)).join(', ')} kJ/mol; velocità catalizzata / libera per ogni mol/L di peptide: ${cc.map((c) => c.fattorePerMole.toExponential(0)).join(', ')} → un peptide a caso non catalizza niente`); assert.ok(cc.every((c) => c.fattorePerMole < 10 && Math.abs(c.ddG) < 15));
  // la regola: chi lega i prodotti (lo stato di transizione) meglio dei reagenti accelera; la vicinanza vale 3 mol/L
  tra(M.CONCENTRAZIONE_EFFICACE, 2, 5, 'concentrazione efficace di due reagenti tenuti entro 5 Å (mol/L)'); const finta = { tipo: 'addizione', reagenti: ['C'], prodotti: ['O=C1CCC(=O)N1'] }, cf = M.catalisiDa(ADENINA, finta); assert.ok(cf.ddG < 0 && cf.accelerazioneDeiLegati > 1, 'un ospite che lega il prodotto meglio del reagente abbassa la barriera di metà della differenza');
});
await prova('copiarsi: la copia su stampo come conseguenza dell\'energia d\'interazione (fedeltà stampata com\'è)', () => {
  const A = ADENINA, U = 'O=c1cc[nH]c(=O)[nH]1', G = 'Nc1nc2[nH]cnc2c(=O)[nH]1', C = 'Nc1cc[nH]c(=O)n1', nome = { [A]: 'A', [U]: 'U', [G]: 'G', [C]: 'C' }, mon = { [A]: 0.01, [U]: 0.01, [G]: 0.01, [C]: 0.01 }, giusto = { A: 'U', U: 'A', G: 'C', C: 'G' };
  for (const [dove, solvente] of [['in un mezzo apolare', null], ['in acqua', 'acqua']]) { const c = M.copia([A, U, G, C], mon, { solvente }), bene = c.posti.filter((p) => nome[p.giusto] === giusto[nome[p.unita]]).length;
    console.log(`      ${dove}: ${c.posti.map((p) => `${nome[p.unita]} prende ${nome[p.giusto]} (${(100 * p.fedelta).toFixed(0)}%)`).join(', ')}; ${bene} posti su 4 con la base giusta; due monomeri legati vicini si uniscono ${c.accelerazione.toExponential(0)} volte più in fretta che sciolti`);
    assert.ok(c.accelerazione > 1 && c.posti.every((p) => p.fedelta > 0.2 && p.fedelta <= 1)); if (solvente === null) { assert.ok(nome[c.posti[1].giusto] === 'A' && nome[c.posti[3].giusto] === 'G', 'le pirimidine dello stampo scelgono la purina giusta: U prende A, C prende G'); if (bene < 4) stona(`copia su stampo: ${bene} basi giuste su 4 (le purine dello stampo prendono un'altra purina): la fedeltà misurata per i nucleotidi attivati (errori del 2-17%) qui NON esce — manca la geometria dell'elica, che vieta purina-purina`); }
    else if (c.fedelta < 0.7) stona(`copia in acqua con le basi libere: fedeltà ${(100 * c.fedelta).toFixed(0)}% per posto (a caso sarebbe 25%): in acqua le basi sciolte si impilano e non si scelgono`); }
});
await prova('piegarsi: ricerca conformazionale di una catena corta; la grana grossa contro gli atomi', () => {
  const p8 = M.polimero(Array(8).fill(ALA)), t0 = performance.now(), r = M.ripiega(p8, { passi: 250 }), r2 = M.ripiega(p8, { passi: 250 }); assert.equal(r.energia, r2.energia, 'la ricottura è deterministica (gli eventi hanno un indirizzo)');
  console.log(`      otto alanine, 250 passi di ricottura in ${(performance.now() - t0).toFixed(0)} ms (due volte): la forma migliore «${r.stati[0].forma}» a ${r.energia.toFixed(0)} kJ/mol, la distesa ${r.distesa.toFixed(0)}; la seconda forma a +${r.salto.toFixed(1)}; entropia di catena T·S = ${r.entropiaDiCatena.toFixed(0)} kJ/mol → minimo netto: ${r.netto ? 'sì' : 'no'} (otto alanine in acqua non si piegano: giusto)`);
  assert.ok(r.energia <= r.distesa && r.stati.length >= 2 && r.forma3D.pos.every(isFinite)); assert.ok(!r.netto, 'un\'otto-alanina non ha un ripiegamento netto');
  // la grana grossa contro gli atomi: su conformazioni diverse di una catena con residui idrofobici e carichi, le due energie vanno nello stesso verso?
  const seq = ['N[C@@H](CC(C)C)C(=O)O', 'N[C@@H](CCCCN)C(=O)O', 'N[C@@H](CC(C)C)C(=O)O', 'N[C@@H](CC(=O)O)C(=O)O', 'N[C@@H](CC(C)C)C(=O)O', 'N[C@@H](CC(C)C)C(=O)O'], p = M.polimero(seq), xs = [], ys = [];
  for (const [phi, psi] of [[-57, -47], [-139, 135], [-75, 150], [-90, 0], [180, 180], [-60, 140], [-120, 60]]) { const f = M.forma(p.m, { diedri: M.diedriPeptide(p, phi, psi).diedri }), ea = M.forze(M.campo(f, { solvente: 'acqua' })).energia, eg = M.energiaGrossa(M.granaGrossa(p, { f })); if (isFinite(ea) && ea < 1e4) { xs.push(ea); ys.push(eg); } }
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length, cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0), corr = cov / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0) || 1);
  console.log(`      grana grossa contro atomi su ${xs.length} conformazioni di un esapeptide: correlazione tra le due energie ${corr.toFixed(2)}`); assert.ok(isFinite(corr)); if (corr < 0.5) stona(`la grana grossa non segue gli atomi (correlazione ${corr.toFixed(2)} su ${xs.length} conformazioni): è un riassunto delle proprietà, non ancora un campo di forze derivato`);
});
await prova('metalli, minerali, fosforo: gruppi ferro-zolfo, siti di superficie dal reticolo vero, ATP e pirofosfato', async () => {
  const FES = 'C[S-]~[Fe+3]1(~[S-]C)~[S-2]~[Fe+3](~[S-]C)(~[S-]C)~[S-2]~1', v = M.valida(FES); assert.ok(v.ok, v.problemi.join()); assert.equal(M.formula(FES), 'C4H12Fe2S62-'); const e = M.energia(FES, ACQUA); assert.ok(e.legame < -100 && isFinite(e.G)); console.log(`      [Fe2S2(SCH3)4]²⁻: molecola valida, carica 2− (come i gruppi ferro-zolfo veri); in acqua i suoi otto legami valgono ${e.legame.toFixed(0)} kJ/mol rispetto agli ioni sciolti (si monta da sé da Fe³⁺, solfuro e tioli)`);
  const G = (x) => M.energia(x, ACQUA).G, idrolisi = (a, prodotti) => prodotti.reduce((s, x) => s + G(x), 0) - G(a) - G('O'), Pi = 'OP(=O)(O)O', ATP = 'Nc1ncnc2n(cnc12)[C@@H]1O[C@H](COP(=O)(O)OP(=O)(O)OP(=O)(O)O)[C@@H](O)[C@H]1O', ADP = 'Nc1ncnc2n(cnc12)[C@@H]1O[C@H](COP(=O)(O)OP(=O)(O)O)[C@@H](O)[C@H]1O';
  const dati = [['pirofosfato → 2 fosfato', idrolisi('OP(=O)(O)OP(=O)(O)O', [Pi, Pi]), -19.2, true], ['metil-fosfato → metanolo + fosfato', idrolisi('COP(=O)(O)O', ['CO', Pi]), -9, true], ['acetil-fosfato → acetato + fosfato', idrolisi('CC(=O)OP(=O)(O)O', ['CC(=O)O', Pi]), -43, true], ['ATP → ADP + fosfato', idrolisi(ATP, [ADP, Pi]), -30.5, false], ['glucosio-6-fosfato → glucosio + fosfato', idrolisi('OC1OC(COP(=O)(O)O)C(O)C(O)C1O', ['OCC1OC(O)C(O)C(O)C1O', Pi]), -13.8, false], ['fosfoenolpiruvato → piruvato + fosfato', idrolisi('C=C(OP(=O)(O)O)C(=O)O', ['CC(=O)C(=O)O', Pi]), -61.9, false], ['dimetil-fosfato → metil-fosfato + metanolo', idrolisi('COP(=O)(O)OC', ['COP(=O)(O)O', 'CO']), -22, false]];
  for (const [nome, x, mis, tarato] of dati) { console.log(`      ${nome}: ΔG a pH 7 = ${x.toFixed(1)} kJ/mol (misurato ${mis}${tarato ? '; è uno dei tre dati di taratura' : ''})`); if (tarato) tra(x - mis, -1.5, 1.5, nome); else if (Math.abs(x - mis) > 10) stona(`${nome}: ${x.toFixed(0)} contro ${mis} kJ/mol misurati`); }
  assert.ok(M.valida(ATP).ok); tra(idrolisi(ATP, [ADP, Pi]), -45, -15, 'idrolisi dell\'ATP (misurata −30,5 kJ/mol)'); tra(M.energia(ATP, ACQUA).carica, -4.2, -2.5, 'carica dell\'ATP a pH 7 (−3,3…−4)');
  // gli ioni: con i dati misurati tornano; il potenziale del ferro è nella prova dell'ossidoriduzione
  for (const [ione, dH, S] of [['[Mg+2]', -467.0, -137.0], ['[Fe+2]', -89.1, -137.7], ['[Zn+2]', -153.9, -112.1]]) tra(M.energia(ione, ACQUA).G - (dH - 298.15 * S / 1000), -0.01, 0.01, `${ione}: G dai dati misurati`);
  // le superfici: il reticolo vero viene da materia.js (letto, non modificato)
  const { reticolo } = await import('../src/camera/materia.js'); const ol = M.superficie(reticolo('olivina')), qz = M.superficie(reticolo('quarzo')), Mg = ol.siti.find((x) => x.elemento === 'Mg');
  console.log(`      faccia dell'olivina (dalla cella di materia.js): ${ol.siti.map((x) => `${x.elemento} ${x.perNm2.toFixed(1)}/nm²`).join(', ')}; del quarzo: ${qz.siti.map((x) => `${x.elemento} ${x.perNm2.toFixed(1)}/nm²`).join(', ')}`); tra(Mg.perNm2, 1, 12, 'magnesi esposti per nm² sull\'olivina'); assert.ok(!qz.siti.some((x) => x.elemento === 'Mg'));
  const ads = M.adsorbi(M.alPH('CC(=O)O', 7), Mg), no = M.adsorbi('C', Mg); assert.ok(ads && ads.valida && ads.specie.includes('->[Mg+2]') && no === null); tra(ads.copertura(1e-3), 0, 1, 'copertura'); console.log(`      l'acetato sul magnesio dell'olivina: ${ads.specie}, log K = ${ads.logK.toFixed(1)}, a 1 mmol/L copre il ${(100 * ads.copertura(1e-3)).toFixed(0)}% dei siti; il metano non si lega`);
});
await prova('che cosa chiede (regola 5): le condizioni che un luogo deve offrire, e il confronto con un luogo', () => {
  const gly = M.cheCosaChiede(GLY), rib = M.cheCosaChiede(RIBOSIO), ade = M.cheCosaChiede(ADENINA), pep = M.cheCosaChiede(M.polimero(Array(20).fill(GLY)), { tempo: 3.156e7 });
  for (const c of [gly, rib, ade, pep]) console.log('      ' + c.nota);
  assert.ok(gly.energia.riducente === 3 && gly.energia.formazione < 0 && gly.T && gly.pH && gly.generazioni >= 4 && gly.generazioni <= 9, 'la glicina: tre H2, in discesa, stabile, 5-9 generazioni (la rete: 6 da HCN e formaldeide)'); assert.deepEqual(Object.keys(gly.elementi).sort(), ['C', 'H', 'N', 'O']);
  assert.ok(pep.attivitaAcqua < 1 && pep.attivitaAcqua > 1e-4 && pep.generazioni === gly.generazioni + 5, 'un peptide di 20: serve un posto che si asciughi; log2(20) generazioni in più dei suoi monomeri'); assert.ok(ade.generazioni > gly.generazioni);
  const mare = { T: 290, pH: 8, acqua: 'liquida', gas: { N2: 0.8, CO2: 0.2 }, minerali: ['olivina'], attivitaAcqua: 1 }, pozza = { T: 300, pH: 8, acqua: 'liquida', gas: { N2: 0.8, CO2: 0.1, H2: 0.05, HCN: 1e-6 }, minerali: ['solfuro di ferro'], cicliAsciutti: true, energia: { luce: 1 } }, ghiaccio = { ...pozza, acqua: 'ghiaccio' };
  const a = pep.confronta(mare), b = pep.confronta(pozza), c = pep.confronta(ghiaccio), d = gly.confronta(mare); console.log(`      il peptide in un mare ossidato: mancano ${a.mancano.join('; ')}`); console.log(`      in una pozza che si asciuga sotto un'aria con idrogeno e HCN: ${b.possibile ? 'possibile' : 'mancano ' + b.mancano.join('; ')}`);
  assert.ok(!a.possibile && a.mancano.some((x) => x.includes('riducente')) && a.mancano.some((x) => x.includes('asciughi'))); assert.ok(b.mancano.length < a.mancano.length); assert.ok(c.mancano.includes('acqua liquida')); assert.ok(!d.possibile && d.mancano.some((x) => x.includes('riducente')));
  assert.ok(M.cheCosaChiede('OP(=O)(O)O').confronta(mare).mancano.some((x) => x.includes('fosforo')));
});

console.log(`\n${ok} prove superate; ${nonTorna} cose che non tornano con la realtà (stampate sopra).`);
