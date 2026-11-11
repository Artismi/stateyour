// test_meteo.mjs — la circolazione dell'aria e il ciclo dell'acqua: i venti, le fasce di pioggia e i deserti che
// emergono; l'acqua che si conserva; l'ombra di pioggia; la rotazione che decide quante celle; il pianeta bloccato;
// senz'aria, senz'acqua, con un'aria densa
import assert from 'node:assert/strict';
import { circolazione, meteoPianeta, pioggiaFine, pioggiaPerErosione, suGrigliaFine, gasDellAria, aria, PARAMETRI } from '../src/camera/meteo.js';
import { interno, superficiePianeta, climaSuperficie } from '../src/camera/geologia.js';

let ok = 0;
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const W = 64, H = 32, N = W * H, GIORNO = 86164;
const lat = (j) => 90 - ((j + 0.5) * 180) / H, peso = (j) => Math.cos((lat(j) * Math.PI) / 180);
const zonale = (x) => Array.from({ length: H }, (_, j) => { let s = 0; for (let i = 0; i < W; i++) s += x[j * W + i]; return s / W; });
const globale = (x) => { let s = 0, a = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { s += x[j * W + i] * peso(j); a += peso(j); } return s / a; };
// la media di una media zonale tra due latitudini (in valore assoluto), in un emisfero (+1 nord, −1 sud) o in tutti e due (0)
const fascia = (z, da, a, emisfero = 0) => { let s = 0, n = 0; for (let j = 0; j < H; j++) { const l = lat(j); if (Math.abs(l) >= da && Math.abs(l) < a && (!emisfero || Math.sign(l) === emisfero)) { s += z[j] * peso(j); n += peso(j); } } return s / n; };
const estremo = (z, da, a, emisfero, f) => { let m = null; for (let j = 0; j < H; j++) { const l = lat(j); if (Math.abs(l) >= da && Math.abs(l) < a && Math.sign(l) === emisfero) m = m === null ? z[j] : f(m, z[j]); } return m; };

// la temperatura misurata della Terra, media annua lungo i paralleli (North 1975: 14,97 − 28,0·P₂(sin φ) °C)
const terraMisurata = () => { const T = new Float32Array(N); for (let j = 0; j < H; j++) { const s = Math.sin((lat(j) * Math.PI) / 180); for (let i = 0; i < W; i++) T[j * W + i] = 273.15 + 14.97 - 28.0 * (1.5 * s * s - 0.5); } return T; };
// un pianeta tutto mare, e lo stesso con un rilievo messo a mano
const oceano = () => new Float32Array(N).fill(-3000);

const mediaAssoluta = (m) => globale(Float32Array.from(m.trasportoCalore, Math.abs));

// la «Terra»: la superficie di geologia.js (tettonica, mari, rilievi) con i parametri di test_biblioteca.mjs
const P = { tipo: 'roccioso', raggioM: 6.371e6, massaKg: 5.97e24, composizione: { ferro: 0.32, acqua: 0.02 }, Lw: 3.828e26, aM: 1.496e11, anno: 3.156e7, giorno: GIORNO, obliquita: 23.4, bloccato: false, clima: { Teq: 255, pressione: 1e5 } };
const it = interno(P, { eta: 4.5e9, Z: 1 }); it.acquaKg = 1.4e21;
const sf = superficiePianeta('meteo-terra', P, it, 11), cl = climaSuperficie('meteo-terra', P, sf);
const base = { raggioM: 6.371e6, gravita: 9.81, giorno: GIORNO, pressione: 1e5 };

// la Terra: la temperatura è quella misurata (il clima di geologia.js si prova più sotto, con meteoPianeta), mari e rilievi quelli emersi
const t0 = performance.now();
const terra = circolazione({ ...base, T: terraMisurata(), alt: sf.alt, mare: sf.mare });
const tempoTerra = performance.now() - t0;
const zP = zonale(terra.pioggia), zE = zonale(terra.evaporazione), zU = zonale(terra.u), zUa = zonale(terra.uAlto), zN = zonale(terra.nuvole), zQ = zonale(terra.trasportoCalore);

prova('l\'aria della Terra: gradiente termico, spessore, tempo di irraggiamento, gas', () => {
  const a = terra.aria;
  tra(a.gamma * 1000, 3.5, 7.5, 'gradiente termico verticale (K/km; misurato 6,5)');
  tra(a.hs / 1000, 7, 9.5, 'spessore dell\'atmosfera (km; 8,4)');
  tra(a.tauRad / 86400, 8, 45, 'tempo di irraggiamento (giorni; 20-40)');
  const [e1, e2] = a.equilibrio(300), [p1, p2] = a.equilibrio(262);
  tra(e1 - e2, 25, 75, 'stratificazione ai tropici (K tra 250 e 750 hPa; misurata ≈ 40)');
  assert.ok(e1 - e2 > p1 - p2, 'l\'aria calda e umida è più stratificata di quella fredda');
  const n2 = gasDellAria({ N2: 0.78, O2: 0.21, Ar: 0.01 }), co2 = gasDellAria({ CO2: 1 });
  tra(n2.massaMolare, 0.0285, 0.0295, 'massa molare dell\'aria (kg/mol)'); tra(n2.cp, 980, 1030, 'calore specifico dell\'aria (J/kg/K; 1004)');
  tra(co2.massaMolare, 0.0435, 0.0445, 'massa molare della CO2'); tra(co2.cp, 700, 900, 'calore specifico della CO2 (J/kg/K; 840)');
  console.log(`      gradiente ${(a.gamma * 1000).toFixed(2)} K/km, spessore ${(a.hs / 1000).toFixed(1)} km, irraggiamento ${(a.tauRad / 86400).toFixed(0)} giorni, stratificazione ${(e1 - e2).toFixed(0)} K ai tropici e ${(p1 - p2).toFixed(0)} K ai poli`);
});

prova('la Terra: piove circa un metro d\'acqua l\'anno, e l\'acqua si conserva', () => {
  const b = terra.bilancio;
  tra(b.piovuta, 400, 2500, 'pioggia media globale (mm/anno; misurata ≈ 1000)');
  tra(globale(terra.pioggia), b.piovuta * 0.999, b.piovuta * 1.001, 'la media della carta è quella del bilancio');
  // esatta: in tutto il periodo evaporata − piovuta = rimasta in più nell'aria (resta solo l'arrotondamento a 32 bit delle carte)
  assert.ok(Math.abs(b.evaporata - b.piovuta - b.accumulata) < 1e-4 * b.piovuta, `conservazione: evaporata ${b.evaporata}, piovuta ${b.piovuta}, accumulata ${b.accumulata}`);
  // a regime: evaporazione = pioggia
  assert.ok(Math.abs(b.evaporata - b.piovuta) < 0.05 * b.piovuta, `a regime evapora quanto piove: ${b.evaporata} contro ${b.piovuta}`);
  for (const x of [terra.pioggia, terra.neve, terra.evaporazione, terra.nuvole, terra.umidita, terra.vapore]) for (const v of x) assert.ok(v >= 0 && isFinite(v));
  for (let k = 0; k < N; k++) assert.ok(terra.neve[k] <= terra.pioggia[k] * 1.0001 && terra.nuvole[k] <= 1 && terra.umidita[k] <= 1);
  console.log(`      pioggia ${b.piovuta.toFixed(0)} mm/anno, evaporazione ${b.evaporata.toFixed(0)}, rimasta nell'aria ${b.accumulata.toFixed(1)}; ${terra.giorniSimulati.toFixed(0)} giorni simulati con passi di ${(terra.dt / 60).toFixed(0)} minuti`);
});

prova('la Terra: una fascia piovosa all\'equatore, fasce secche ai tropici, piogge alle medie latitudini', () => {
  const jMax = zP.indexOf(Math.max(...zP)), itcz = Math.max(...zP);
  assert.ok(Math.abs(lat(jMax)) < 10, `il massimo di pioggia è a ${lat(jMax)}°`);
  for (const em of [1, -1]) {
    const secco = estremo(zP, 12, 34, em, Math.min), medie = estremo(zP, 34, 56, em, Math.max);
    assert.ok(secco < 0.5 * itcz, `ai tropici (${em > 0 ? 'nord' : 'sud'}) piove meno della metà che all'equatore: ${secco} contro ${itcz}`);
    assert.ok(secco < medie, `e meno che alle medie latitudini: ${secco} contro ${medie}`);
    // l'aria che scende porta via il vapore: ai tropici evapora più di quanto piove; all'equatore e verso i poli il contrario
    assert.ok(fascia(zE, 12, 30, em) > 1.2 * fascia(zP, 12, 30, em), 'i tropici esportano acqua');
    assert.ok(fascia(zP, 40, 65, em) > fascia(zE, 40, 65, em), 'le medie latitudini la ricevono');
  }
  assert.ok(fascia(zP, 0, 6) > 1.5 * fascia(zE, 0, 6), 'l\'equatore la riceve');
  assert.ok(fascia(zP, 70, 90) < 0.5 * globale(terra.pioggia), 'ai poli, freddi, piove poco');
  console.log(`      pioggia (mm/anno): equatore ${fascia(zP, 0, 6).toFixed(0)}, tropici ${fascia(zP, 15, 30).toFixed(0)} (minimo ${Math.min(estremo(zP, 12, 34, 1, Math.min), estremo(zP, 12, 34, -1, Math.min)).toFixed(0)}), medie latitudini ${fascia(zP, 35, 55).toFixed(0)}, poli ${fascia(zP, 70, 90).toFixed(0)}`);
});

prova('la Terra: alisei da est ai tropici, venti da ovest alle medie latitudini, il getto in quota', () => {
  for (const em of [1, -1]) {
    tra(fascia(zU, 5, 18, em), -12, -2, `alisei (${em > 0 ? 'nord' : 'sud'}, m/s)`);
    tra(fascia(zU, 33, 46, em), 2, 15, `venti da ovest alle medie latitudini (${em > 0 ? 'nord' : 'sud'}, m/s)`);
    tra(estremo(zUa, 20, 50, em, Math.max), 20, 60, 'il getto in quota (m/s; misurato 30-40)');
    assert.ok(fascia(zonale(terra.v), 5, 18, em) * em < 0, 'al suolo gli alisei vanno verso l\'equatore');
  }
  assert.ok(terra.fasceNord >= 3 && terra.fasceSud >= 3, `almeno tre fasce di vento per emisfero: ${terra.fasceNord} e ${terra.fasceSud}`);
  tra(terra.latitudineAlisei, 15, 35, 'dove finiscono gli alisei (°; sulla Terra 30)');
  // la cella di Hadley: in quota verso i poli, tra l'equatore e i tropici, da una parte e dall'altra
  const psiN = terra.psi[H / 2 - 3], psiS = terra.psi[H / 2 + 1];
  assert.ok(psiN > 3e10 && psiS < -3e10, `la cella di Hadley: ${psiN} e ${psiS} kg/s (misurata ≈ 1e11)`);
  console.log(`      alisei ${fascia(zU, 5, 18).toFixed(1)} m/s fino a ${terra.latitudineAlisei.toFixed(0)}°, venti da ovest ${fascia(zU, 33, 46).toFixed(1)} m/s, getto ${Math.max(...zUa).toFixed(0)} m/s, Hadley ${(psiN / 1e9).toFixed(0)} e ${(psiS / 1e9).toFixed(0)} ·10⁹ kg/s; fasce di vento ${terra.fasceNord}/${terra.fasceSud}, celle ${terra.celleNord}/${terra.celleSud}`);
});

prova('la Terra: deserti sulla terraferma, nuvole dove piove, neve al freddo, calore dai tropici ai poli', () => {
  const terre = []; for (let k = 0; k < N; k++) if (terra.bagnato[k] < 0.2 && Math.abs(lat((k - (k % W)) / W)) < 60) terre.push(terra.pioggia[k]);
  terre.sort((a, b) => a - b);
  assert.ok(terre.length > 100 && terre[Math.floor(terre.length * 0.1)] < 400 && terre[Math.floor(terre.length * 0.1)] < 0.4 * terre[terre.length >> 1] && terre[Math.floor(terre.length * 0.9)] > 800, `ci sono deserti e terre piovose: il decimo più secco ${terre[Math.floor(terre.length * 0.1)]}, il decimo più piovoso ${terre[Math.floor(terre.length * 0.9)]} mm/anno`);
  tra(terra.nuvoleMedie, 0.3, 0.8, 'copertura media di nuvole (misurata 0,67)');
  assert.ok(fascia(zN, 0, 6) > fascia(zN, 15, 30) + 0.15, 'più nuvole all\'equatore che ai tropici');
  const zNeve = zonale(terra.neve);
  assert.ok(fascia(zNeve, 70, 90) > 0.8 * fascia(zP, 70, 90) && fascia(zNeve, 0, 15) < 0.1 * fascia(zP, 0, 15), 'ai poli nevica, all\'equatore piove');
  // il calore: la circolazione lo toglie ai tropici e lo porta ai poli; in tutto non ne crea
  tra(fascia(zQ, 0, 20), -200, -30, 'calore tolto ai tropici (W/m²; misurato ≈ −50)');
  tra(fascia(zQ, 60, 90), 30, 250, 'calore portato ai poli (W/m²; misurato ≈ +100)');
  // (il lavoro dei venti consumato dall'attrito torna come calore; resta la piccola parte consumata dalla viscosità numerica)
  assert.ok(Math.abs(globale(terra.trasportoCalore)) < 0.1 * mediaAssoluta(terra), `il trasporto sposta il calore, non lo crea: media ${globale(terra.trasportoCalore)} W/m² su ${mediaAssoluta(terra)}`);
  tra(terra.diffusivita, 0.2, 2, 'il coefficiente di diffusione equivalente (W/m²/K; i modelli a bilancio di energia usano 0,6)');
  // l'aria in quota è più uniforme della superficie (è lei che porta il calore)
  const zTa = zonale(terra.temperaturaAria), zT = zonale(terra.temperatura);
  assert.ok(fascia(zTa, 0, 15) < fascia(zT, 0, 15) && fascia(zTa, 70, 90) > fascia(zT, 70, 90), 'l\'aria è più fresca del mare ai tropici e più tiepida del suolo ai poli');
  console.log(`      terre: decimo più secco ${terre[Math.floor(terre.length * 0.1)].toFixed(0)} mm/anno, mediana ${terre[terre.length >> 1].toFixed(0)}, decimo più piovoso ${terre[Math.floor(terre.length * 0.9)].toFixed(0)}; nuvole ${terra.nuvoleMedie.toFixed(2)}; calore ${fascia(zQ, 0, 20).toFixed(0)} W/m² ai tropici, ${fascia(zQ, 60, 90).toFixed(0)} ai poli (media ${globale(terra.trasportoCalore).toFixed(1)}); diffusione equivalente ${terra.diffusivita.toFixed(2)} W/m²/K`);
});

prova('la neve sale con la quota, e la pioggia si porta sulla griglia fine dell\'erosione', () => {
  const pf = pioggiaFine(terra, sf), pe = pioggiaPerErosione(terra, sf);
  assert.equal(pf.pioggia.length, sf.W * sf.H); assert.equal(pe.length, sf.W * sf.H);
  let s = 0, a = 0; for (let j = 0; j < sf.H; j++) { const w = Math.sin(((j + 0.5) / sf.H) * Math.PI); for (let i = 0; i < sf.W; i++) { s += pf.pioggia[j * sf.W + i] * w; a += w; } }
  tra(s / a, terra.bilancio.piovuta * 0.97, terra.bilancio.piovuta * 1.03, 'la media sulla griglia fine è la stessa');
  assert.ok(Math.abs(pe[1000] * 1000 - pf.pioggia[1000]) < 1e-3 * (1 + pf.pioggia[1000]), 'nelle unità dell\'erosione 1 = 1000 mm/anno');
  // tra i punti dove piove e la temperatura al livello del mare è sopra zero, quelli alti hanno più neve di quelli bassi
  const T = suGrigliaFine(terra, terra.temperatura, sf.W, sf.H); let alti = 0, nAlti = 0, bassi = 0, nBassi = 0;
  for (let k = 0; k < sf.W * sf.H; k++) { if (!(pf.pioggia[k] > 10) || T[k] < 276 || T[k] > 290) continue; const h = sf.alt[k] - sf.mare; if (h > 2500) { alti += pf.neve[k] / pf.pioggia[k]; nAlti++; } else if (h > 0 && h < 500) { bassi += pf.neve[k] / pf.pioggia[k]; nBassi++; } }
  assert.ok(nAlti > 5 && nBassi > 5 && alti / nAlti > bassi / nBassi + 0.3, `in montagna nevica: ${alti / nAlti} della precipitazione sopra i 2500 m contro ${bassi / nBassi} in pianura (${nAlti} e ${nBassi} punti)`);
  for (let k = 0; k < pf.neve.length; k++) assert.ok(pf.neve[k] >= 0 && pf.neve[k] <= pf.pioggia[k] * 1.0001 + 1e-6);
  // una tessera (un sedicesimo della carta): stessa pioggia dello stesso pezzo
  const ts = pioggiaFine(terra, { W: 32, H: 32, alt: new Float32Array(1024), rett: [0.5, 0.5, 0.5625, 0.5625] });
  let m = 0; for (const v of ts.pioggia) m += v / 1024; tra(m, 0.5 * terra.pioggia[16 * W + 32], 2 * terra.pioggia[16 * W + 33] + 50, 'la pioggia di una tessera');
  console.log(`      neve sopra i 2500 m: ${(100 * alti / nAlti).toFixed(0)}% della precipitazione (${nAlti} punti); sotto i 500 m: ${(100 * bassi / nBassi).toFixed(0)}% (${nBassi} punti)`);
});

// LE STAGIONI: la stessa Terra con la temperatura dei quattro trimestri (misurata: North e Coakley 1979, ±15,5·sin φ gradi
// tra estate e inverno; in media sul trimestre del solstizio ±14): primavera, estate, autunno e inverno dell'emisfero nord
const stagione = (e) => { const T = terraMisurata(); for (let j = 0; j < H; j++) { const s = Math.sin((lat(j) * Math.PI) / 180); for (let i = 0; i < W; i++) T[j * W + i] += e * s; } return T; };
const quattro = (amp) => [stagione(0), stagione(amp), stagione(0), stagione(-amp)];
const tS = performance.now(), anno = circolazione({ ...base, stagioni: quattro(14), alt: sf.alt, mare: sf.mare }), tempoStagioni = performance.now() - tS;

prova('le stagioni: la fascia delle piogge segue il sole, i tropici hanno una stagione secca e una piovosa, d\'inverno nevica', () => {
  assert.equal(anno.stagioni.length, 4); const [pri, est, aut, inv] = anno.stagioni, zEst = zonale(est.pioggia), zInv = zonale(inv.pioggia);
  assert.ok(est.latitudinePiogge > 2 && inv.latitudinePiogge < -2, `la fascia delle piogge migra: ${est.latitudinePiogge}° d'estate, ${inv.latitudinePiogge}° d'inverno`);
  assert.ok(Math.abs(pri.latitudinePiogge) < Math.abs(est.latitudinePiogge) + 0.1 && Math.abs(aut.latitudinePiogge) <= Math.abs(inv.latitudinePiogge) + 0.1, 'agli equinozi sta più vicina all\'equatore');
  // tra 8° e 25°: piove nella stagione calda, è secco in quella fredda (da una parte e dall'altra dell'equatore, a stagioni invertite)
  const nE = fascia(zEst, 8, 25, 1), nI = fascia(zInv, 8, 25, 1), sE = fascia(zEst, 8, 25, -1), sI = fascia(zInv, 8, 25, -1);
  assert.ok(nE > 1.8 * nI && sI > 1.8 * sE, `stagione piovosa e stagione secca: a nord ${nE} d'estate e ${nI} d'inverno, a sud ${sE} e ${sI} (mm/anno)`);
  // al solstizio una cella sola scavalca l'equatore: in quota l'aria va dall'emisfero d'estate a quello d'inverno
  const eq = H / 2 - 1; assert.ok(est.psi[eq] < -1.5e11 && inv.psi[eq] > 1.5e11 && Math.abs(pri.psi[eq]) < 0.6 * Math.abs(est.psi[eq]), `la cella del solstizio: ${est.psi[eq]} e ${inv.psi[eq]} kg/s all'equatore (misurata ≈ 2·10¹¹), ${pri.psi[eq]} all'equinozio`);
  // l'anno è la media delle stagioni, e l'acqua si conserva
  for (const k of [100, 700, 1000, 1500]) assert.ok(Math.abs(anno.pioggia[k] - (pri.pioggia[k] + est.pioggia[k] + aut.pioggia[k] + inv.pioggia[k]) / 4) < 1e-3 * (1 + anno.pioggia[k]));
  assert.ok(Math.abs(anno.bilancio.evaporata - anno.bilancio.piovuta - anno.bilancio.accumulata) < 1e-4 * anno.bilancio.piovuta, 'conservazione');
  tra(anno.bilancio.piovuta, 400, 2500, 'pioggia media globale con le stagioni (mm/anno)');
  // la neve: tra 45° e 65° nord d'inverno la precipitazione è quasi tutta neve, d'estate quasi tutta pioggia (resta la neve delle terre alte)
  const nvI = fascia(zonale(inv.neve), 45, 65, 1) / fascia(zInv, 45, 65, 1), nvE = fascia(zonale(est.neve), 45, 65, 1) / fascia(zEst, 45, 65, 1); assert.ok(nvI > 0.8 && nvE < 0.3, `neve a 45-65° nord: ${nvI} della precipitazione d'inverno, ${nvE} d'estate`);
  // la fascia equatoriale, che ora si sposta, è meno intensa che senza stagioni; i tropici restano secchi nella media dell'anno
  const zA = zonale(anno.pioggia); assert.ok(Math.max(...zA) < Math.max(...zP), `l'equatore: ${Math.max(...zA)} mm/anno con le stagioni, ${Math.max(...zP)} senza`);
  assert.ok(anno.fasceNord >= 3 && anno.fasceSud >= 3, 'le tre fasce di vento restano');
  // un asse più inclinato (stagioni doppie): la fascia delle piogge va più lontano
  const forte = circolazione({ ...base, stagioni: quattro(28), alt: sf.alt, mare: sf.mare });
  assert.ok(forte.stagioni[1].latitudinePiogge > est.latitudinePiogge && forte.stagioni[3].latitudinePiogge < inv.latitudinePiogge, `con stagioni doppie le piogge arrivano a ${forte.stagioni[1].latitudinePiogge}° e ${forte.stagioni[3].latitudinePiogge}° invece di ${est.latitudinePiogge}° e ${inv.latitudinePiogge}°`);
  // e meteoPianeta le prende dal clima, se il clima le dà (cl.stagioni)
  const mp = meteoPianeta(P, sf, { ...cl, stagioni: quattro(14) }, { passi: 400 }); assert.equal(mp.stagioni.length, 4); assert.equal(meteoPianeta(P, sf, { ...cl, stagioni: undefined }, { passi: 200 }).stagioni, null);
  console.log(`      piogge a ${anno.stagioni.map((r) => r.latitudinePiogge.toFixed(0)).join('°, ')}° (primavera, estate, autunno, inverno del nord); a 8-25° nord ${nE.toFixed(0)} mm/anno d'estate e ${nI.toFixed(0)} d'inverno, a sud ${sE.toFixed(0)} e ${sI.toFixed(0)}; cella del solstizio ${(est.psi[eq] / 1e9).toFixed(0)} e ${(inv.psi[eq] / 1e9).toFixed(0)} ·10⁹ kg/s; neve a 45-65° nord ${(100 * nvI).toFixed(0)}% d'inverno, ${(100 * nvE).toFixed(0)}% d'estate`);
  console.log(`      l'anno: pioggia ${anno.bilancio.piovuta.toFixed(0)} mm/anno, equatore ${Math.max(...zA).toFixed(0)} (senza stagioni ${Math.max(...zP).toFixed(0)}), tropici ${fascia(zA, 15, 30).toFixed(0)}, alisei fino a ${anno.latitudineAlisei.toFixed(0)}°, Hadley ${(Math.max(...anno.psi) / 1e9).toFixed(0)} e ${(Math.min(...anno.psi) / 1e9).toFixed(0)} ·10⁹ kg/s, celle ${anno.celleNord}/${anno.celleSud}, calore in media ${globale(anno.trasportoCalore).toFixed(1)} W/m²; stagioni doppie: piogge fino a ${forte.stagioni[1].latitudinePiogge.toFixed(0)}° e ${forte.stagioni[3].latitudinePiogge.toFixed(0)}°; ${tempoStagioni.toFixed(0)} ms`);
});

prova('l\'ombra di pioggia: un oceano, un muro di monti, e il vento che lo investe', () => {
  // un muro alto 3500 m lungo un meridiano, tra 60° sud e 60° nord, in mezzo a un oceano
  const alt = oceano(); for (let j = 0; j < H; j++) if (Math.abs(lat(j)) < 60) for (let i = 31; i <= 32; i++) alt[j * W + i] = 3500;
  const m = circolazione({ ...base, T: terraMisurata(), alt, mare: 0 }), liscio = circolazione({ ...base, T: terraMisurata(), alt: oceano(), mare: 0 });
  const tratto = (x, da, a, i0, i1) => { let s = 0, n = 0; for (let j = 0; j < H; j++) { const l = Math.abs(lat(j)); if (l < da || l >= a) continue; for (let i = i0; i <= i1; i++) { s += x[j * W + i] * peso(j); n += peso(j); } } return s / n; };
  // alle medie latitudini il vento viene da ovest: piove sul muro (il versante sopravvento), e subito dietro, a est,
  // c'è l'ombra: meno che sul muro e meno di quanto piove a quella latitudine sul pianeta senza muro
  assert.ok(tratto(m.u, 34, 50, 24, 39) > 2, 'alle medie latitudini il vento viene da ovest');
  const sopra = tratto(m.pioggia, 34, 50, 31, 32), sotto = tratto(m.pioggia, 34, 50, 33, 34), senza = tratto(liscio.pioggia, 34, 50, 0, W - 1);
  assert.ok(sotto < 0.5 * sopra, `sottovento piove meno della metà che sul versante sopravvento: ${sotto} contro ${sopra} mm/anno`);
  assert.ok(sotto < 0.85 * senza && sopra > 1.5 * senza, `e meno di quanto piove a quella latitudine senza il muro (${senza}): ${sotto} dietro, ${sopra} sul muro`);
  // negli alisei il vento viene da est: i versanti si scambiano, e l'ombra è a ovest
  assert.ok(tratto(m.u, 8, 20, 24, 39) < -2, 'ai tropici il vento viene da est');
  const est = tratto(m.pioggia, 8, 20, 31, 32), ovest = tratto(m.pioggia, 8, 20, 29, 30), senzaT = tratto(liscio.pioggia, 8, 20, 0, W - 1);
  assert.ok(ovest < 0.2 * est && ovest < 0.5 * senzaT && est > 1.5 * senzaT, `negli alisei l'ombra è a ovest: ${ovest} dietro, ${est} sul muro, ${senzaT} senza muro`);
  // l'acqua si conserva anche qui
  assert.ok(Math.abs(m.bilancio.evaporata - m.bilancio.piovuta - m.bilancio.accumulata) < 1e-4 * m.bilancio.piovuta);
  console.log(`      medie latitudini (vento da ovest): ${sopra.toFixed(0)} mm/anno sul muro, ${sotto.toFixed(0)} subito a est (senza muro ${senza.toFixed(0)}); alisei (vento da est): ${est.toFixed(0)} sul muro, ${ovest.toFixed(0)} subito a ovest (senza muro ${senzaT.toFixed(0)})`);
});

// la rotazione: lo stesso pianeta (un oceano con due isole montuose, perché non sia perfettamente liscio) che gira in 30 giorni, in un giorno, in 8 ore
const isole = () => { const alt = oceano(); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const la = (lat(j) * Math.PI) / 180, lo = ((i + 0.5) / W) * 2 * Math.PI - Math.PI; alt[j * W + i] += 3400 * Math.exp(-(((lo - 1) / 0.5) ** 2) - ((la - 0.7) / 0.4) ** 2) + 3400 * Math.exp(-(((lo + 1.6) / 0.6) ** 2) - ((la + 0.5) / 0.3) ** 2); } return alt; };
const giro = (giorno) => circolazione({ ...base, giorno, T: terraMisurata(), alt: isole(), mare: 0 });
const lento = giro(30 * 86400), normale = giro(GIORNO), veloce = giro(8 * 3600);
const psiMax = (m) => Math.max(...Array.from(m.psi, Math.abs));

prova('rotazione lenta: una cella sola dall\'equatore al polo', () => {
  assert.equal(lento.celleNord, 1); assert.equal(lento.celleSud, 1); assert.equal(lento.celle, 1);
  // in quota l'aria va verso il polo a ogni latitudine, in tutti e due gli emisferi
  for (let j = 1; j < H - 2; j++) if (j !== H / 2 - 1) assert.ok(lento.psi[j] * (j < H / 2 - 1 ? 1 : -1) > 0, `a ${90 - (j + 1) * 180 / H}° la corrente in quota va verso il polo`);
  assert.ok(psiMax(lento) > 2 * psiMax(normale), 'e la cella è più forte');
  assert.ok(lento.latitudineAlisei > normale.latitudineAlisei + 8, `i venti da est arrivano più lontano: ${lento.latitudineAlisei}° contro ${normale.latitudineAlisei}°`);
  // la pioggia è tutta all'equatore: il resto dell'aria scende
  const z = zonale(lento.pioggia); assert.ok(fascia(z, 0, 6) > 5 * fascia(z, 15, 60), 'piove dove l\'aria sale, non piove dove scende');
  console.log(`      giorno di 30 giorni: celle ${lento.celleNord}/${lento.celleSud}, corrente ${(psiMax(lento) / 1e9).toFixed(0)}·10⁹ kg/s, venti da est fino a ${lento.latitudineAlisei.toFixed(0)}°, pioggia ${fascia(z, 0, 6).toFixed(0)} mm/anno all'equatore e ${fascia(z, 15, 60).toFixed(0)} tra 15° e 60°`);
});

prova('rotazione veloce: celle più strette, più deboli e più numerose', () => {
  assert.ok(psiMax(normale) > 2 * psiMax(veloce), `la cella di Hadley si indebolisce: ${psiMax(normale)} → ${psiMax(veloce)} kg/s`);
  assert.ok(veloce.latitudineAlisei < normale.latitudineAlisei - 5, `e si stringe: gli alisei finiscono a ${veloce.latitudineAlisei}° invece che a ${normale.latitudineAlisei}°`);
  assert.ok(veloce.celle > normale.celle && normale.celle >= lento.celle, `più celle: ${lento.celle} → ${normale.celle} → ${veloce.celle}`);
  assert.ok(normale.fasce > lento.fasce && veloce.fasce >= normale.fasce, `più fasce di vento: ${lento.fasce} → ${normale.fasce} → ${veloce.fasce}`);
  console.log(`      giorno di 30 giorni / 1 giorno / 8 ore: celle ${lento.celle} / ${normale.celle} / ${veloce.celle}, fasce di vento ${lento.fasce} / ${normale.fasce} / ${veloce.fasce}, corrente ${(psiMax(lento) / 1e9).toFixed(0)} / ${(psiMax(normale) / 1e9).toFixed(0)} / ${(psiMax(veloce) / 1e9).toFixed(0)} ·10⁹ kg/s, alisei fino a ${lento.latitudineAlisei.toFixed(0)}° / ${normale.latitudineAlisei.toFixed(0)}° / ${veloce.latitudineAlisei.toFixed(0)}°`);
});

prova('pianeta bloccato dalla marea: il vento va dal giorno alla notte in quota e torna al suolo; piove sotto il sole', () => {
  // la faccia a longitudine 0 sempre al sole (come in climaSuperficie): calda sotto il sole, fredda nella notte
  const T = new Float32Array(N); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const la = (lat(j) * Math.PI) / 180, lo = ((i + 0.5) / W) * 2 * Math.PI - Math.PI; T[j * W + i] = 240 + 70 * Math.max(0, Math.cos(la) * Math.cos(lo)); }
  const m = circolazione({ ...base, giorno: 30 * 86400, bloccato: true, T, alt: oceano(), mare: 0 });
  tra(m.giornoNotte.alto, 2, 80, 'in quota il vento si allontana dal punto sotto il sole (m/s)');
  tra(m.giornoNotte.basso, -80, -2, 'al suolo ci torna (m/s)');
  let giorno = 0, notte = 0, kMax = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, lo = ((i + 0.5) / W) * 360 - 180; if (Math.abs(lo) < 90) giorno += m.pioggia[k] * peso(j); else notte += m.pioggia[k] * peso(j); if (m.pioggia[k] > m.pioggia[kMax]) kMax = k; }
  assert.ok(giorno > 20 * notte, `piove sul lato giorno: ${giorno} contro ${notte}`);
  const iMax = kMax % W, jMax = (kMax - iMax) / W; assert.ok(Math.abs(lat(jMax)) < 20 && Math.abs(((iMax + 0.5) / W) * 360 - 180) < 25, `il massimo di pioggia è sotto il sole: ${lat(jMax)}° di latitudine, ${((iMax + 0.5) / W) * 360 - 180}° di longitudine`);
  // l'aria porta calore dal giorno alla notte
  let qG = 0, qN = 0, aG = 0, aN = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const lo = ((i + 0.5) / W) * 360 - 180; if (Math.abs(lo) < 60 && Math.abs(lat(j)) < 45) { qG += m.trasportoCalore[j * W + i] * peso(j); aG += peso(j); } else if (Math.abs(lo) > 100) { qN += m.trasportoCalore[j * W + i] * peso(j); aN += peso(j); } }
  assert.ok(qG / aG < -20 && qN / aN > 5, `calore tolto al giorno (${qG / aG} W/m²) e dato alla notte (${qN / aN} W/m²)`);
  assert.equal(circolazione({ ...base, T: terraMisurata(), passi: 60 }).giornoNotte, null);
  console.log(`      vento giorno→notte: ${m.giornoNotte.alto.toFixed(1)} m/s in quota, ${m.giornoNotte.basso.toFixed(1)} m/s al suolo; pioggia sul lato giorno ${(100 * giorno / (giorno + notte)).toFixed(1)}%; calore ${(qG / aG).toFixed(0)} W/m² sotto il sole, ${(qN / aN).toFixed(0)} W/m² nella notte`);
});

prova('niente aria: niente vento, niente pioggia, niente nuvole; aria sottile: quasi nessun calore portato', () => {
  for (const pressione of [0, 1e-9]) { const m = circolazione({ ...base, pressione, T: terraMisurata(), alt: sf.alt, mare: sf.mare });
    assert.equal(m.regime, 'senza aria'); assert.equal(m.celle, 0);
    for (const x of [m.u, m.v, m.uAlto, m.pioggia, m.neve, m.evaporazione, m.nuvole, m.trasportoCalore]) for (const v of x) assert.equal(v, 0);
    assert.deepEqual(m.bilancio, { evaporata: 0, piovuta: 0, accumulata: 0 }); assert.equal(pioggiaFine(m, sf).neve.length, sf.W * sf.H); }
  assert.equal(circolazione({ ...base, pressione: Infinity, T: terraMisurata() }).regime, 'senza superficie');
  // un'aria sottile, fredda e secca (Marte: 600 Pa di CO2, 60 K più freddo della Terra): venti sì, calore quasi niente
  const freddo = terraMisurata().map((t) => t - 60), marte = circolazione({ raggioM: 3.39e6, gravita: 3.71, giorno: 88775, pressione: 600, massaMolare: 0.044, cp: 760, T: freddo, alt: isole(), mare: -Infinity, acqua: false });
  assert.equal(marte.regime, 'aria'); assert.equal(marte.bilancio.piovuta, 0); assert.equal(marte.nuvoleMedie, 0);
  assert.ok(Math.max(...Array.from(marte.ventoZonaleAlto, Math.abs)) > 3, 'i venti ci sono');
  assert.ok(mediaAssoluta(marte) < 0.1 * mediaAssoluta(terra), `ma portano poco calore: ${mediaAssoluta(marte)} W/m² contro ${mediaAssoluta(terra)} della Terra`);
  tra(marte.aria.tauRad / 86400, 0.1, 3, 'il tempo di irraggiamento di Marte (giorni; 1-2)');
  console.log(`      Marte (600 Pa): vento in quota fino a ${Math.max(...Array.from(marte.ventoZonaleAlto, Math.abs)).toFixed(0)} m/s, calore portato ${mediaAssoluta(marte).toFixed(2)} W/m² (Terra ${mediaAssoluta(terra).toFixed(0)}), irraggiamento in ${(marte.aria.tauRad / 86400).toFixed(1)} giorni`);
});

prova('senz\'acqua: venti ma niente pioggia; aria densa: molto più calore portato; pianeta lento: aria in quota quasi uniforme', () => {
  const secco = circolazione({ ...base, T: terraMisurata(), alt: isole(), mare: 0, acqua: false, passi: 900 });
  assert.equal(secco.bilancio.piovuta, 0); assert.equal(secco.bilancio.evaporata, 0); assert.equal(secco.nuvoleMedie, 0);
  assert.ok(Math.max(...secco.ventoZonaleAlto) > 5, 'ma i venti ci sono');
  // la stessa superficie sotto 92 bar di CO2 che ruota piano (Venere)
  const denso = circolazione({ ...base, giorno: 243 * 86400, pressione: 9.2e6, massaMolare: 0.044, cp: 850, T: terraMisurata(), alt: isole(), mare: 0, acqua: false });
  const stesso = circolazione({ ...base, giorno: 243 * 86400, T: terraMisurata(), alt: isole(), mare: 0, acqua: false });
  assert.ok(mediaAssoluta(denso) > 2 * mediaAssoluta(stesso), `l'aria densa porta molto più calore: ${mediaAssoluta(denso)} contro ${mediaAssoluta(stesso)} W/m²`);
  // su un pianeta lento l'aria in quota è quasi alla stessa temperatura dappertutto (nulla la trattiene alla sua latitudine)
  const zq = zonale(stesso.temperaturaQuota), zs = zonale(stesso.temperatura), escursione = (z) => Math.max(...z) - Math.min(...z);
  assert.ok(escursione(zq) < 0.35 * escursione(zs), `in quota le differenze sono piccole: ${escursione(zq)} K contro ${escursione(zs)} K alla superficie`);
  tra(denso.aria.tauRad / 3.156e7, 0.5, 50, 'il tempo di irraggiamento di un\'aria come quella di Venere (anni)');
  console.log(`      92 bar: calore portato ${mediaAssoluta(denso).toFixed(0)} W/m² (a 1 bar ${mediaAssoluta(stesso).toFixed(0)}), irraggiamento in ${(denso.aria.tauRad / 3.156e7).toFixed(1)} anni; a 1 bar, lento: differenze in quota ${escursione(zq).toFixed(1)} K (superficie ${escursione(zs).toFixed(0)} K)`);
});

prova('dal pianeta, dalla superficie e dal clima di geologia.js: gira, conserva l\'acqua, ed è deterministico', () => {
  const t = performance.now(), m = meteoPianeta(P, sf, cl), ms = performance.now() - t;
  assert.equal(m.regime, 'aria'); assert.equal(m.W, cl.W); assert.equal(m.H, cl.H);
  for (const x of [m.u, m.v, m.pioggia, m.neve, m.evaporazione, m.nuvole, m.trasportoCalore, m.temperaturaAria]) for (const v of x) assert.ok(isFinite(v));
  assert.ok(m.bilancio.piovuta > 0 && Math.abs(m.bilancio.evaporata - m.bilancio.piovuta - m.bilancio.accumulata) < 1e-4 * m.bilancio.piovuta, 'l\'acqua si conserva');
  assert.equal(meteoPianeta(P, sf, cl, { chiave: 'meteo-terra', passi: 200 }), meteoPianeta(P, sf, cl, { chiave: 'meteo-terra', passi: 200 }));
  const pf = pioggiaFine(m, sf, cl); for (let k = 0; k < pf.neve.length; k++) assert.ok(pf.neve[k] >= 0 && pf.neve[k] <= pf.pioggia[k] * 1.0001 + 1e-6);
  // stesso ingresso, stesso risultato, bit per bit
  const a = circolazione({ ...base, T: terraMisurata(), alt: sf.alt, mare: sf.mare, passi: 500 }), b = circolazione({ ...base, T: terraMisurata(), alt: sf.alt, mare: sf.mare, passi: 500 });
  for (const c of ['u', 'v', 'uAlto', 'vAlto', 'pioggia', 'neve', 'evaporazione', 'nuvole', 'umidita', 'trasportoCalore']) assert.deepEqual(a[c], b[c], c);
  assert.deepEqual(a.bilancio, b.bilancio); assert.equal(a.celle, b.celle);
  // gli ingressi sbagliati si rifiutano
  assert.throws(() => circolazione({ ...base, T: new Float32Array(10) })); assert.throws(() => circolazione({ ...base, W: 60, H: 30, T: new Float32Array(1800) }));
  assert.throws(() => circolazione({ ...base, T: terraMisurata(), alt: new Float32Array(1000) })); assert.throws(() => meteoPianeta({ ...P, giorno: undefined }, sf, cl));
  console.log(`      con il clima di geologia.js (Tglobale ${(cl.Tglobale - 273.15).toFixed(1)} °C): pioggia ${m.bilancio.piovuta.toFixed(0)} mm/anno, celle ${m.celle}, fasce ${m.fasce}, nuvole ${m.nuvoleMedie.toFixed(2)}, ${ms.toFixed(0)} ms (${m.tentativi} passi di tempo accorciati)`);
});

prova('i tempi: un pianeta a 64×32 in circa un secondo', () => {
  const t = performance.now(); circolazione({ ...base, T: terraMisurata(), alt: sf.alt, mare: sf.mare }); const ms = Math.min(tempoTerra, performance.now() - t);
  assert.ok(ms < 2500, `un pianeta in ${ms} ms`); assert.equal(PARAMETRI.latCritica, 45);
  console.log(`      la Terra: ${ms.toFixed(0)} ms (1800 passi)`);
});

console.log(`meteo: ${ok} prove, tutto ok`);
