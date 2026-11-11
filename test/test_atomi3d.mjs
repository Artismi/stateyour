// test_atomi3d.mjs — la materia atomo per atomo, per la parte che non ha bisogno della grafica: le scene (l'acqua col
// sale e i gusci degli ioni, i reticoli dei cristalli, la faccia bagnata, la prova di carico) hanno le geometrie vere, e
// la preparazione (pezzi, sepolti, gruppi per il dettaglio) non perde né inventa atomi.
import assert from 'node:assert/strict';
import { ELEMENTI, ACQUA, RETICOLI, preparaScena, scenaAcqua, scenaCristallo, scenaDoppioStrato } from '../src/camera/atomi3d.js';
import { sorgente } from '../src/camera/eventi.js';

let ok = 0;
const inizio = performance.now();
const prova = (nome, f) => { f(); ok++; console.log('  ✓', nome); };
const tra = (x, a, b, che) => assert.ok(x > a && x < b, `${che}: ${x} (atteso tra ${a} e ${b})`);
const dist = (p, i, j) => Math.hypot(p[3 * i] - p[3 * j], p[3 * i + 1] - p[3 * j + 1], p[3 * i + 2] - p[3 * j + 2]);

// ---------- gli elementi
prova('i colori sono quelli convenzionali e i raggi sono in nanometri', () => {
  assert.deepEqual(ELEMENTI.O.colore, [255, 13, 13]); assert.deepEqual(ELEMENTI.H.colore, [255, 255, 255]); assert.deepEqual(ELEMENTI.Cl.colore, [31, 240, 31]);
  assert.ok(ELEMENTI.Na.colore[2] > ELEMENTI.Na.colore[1], 'il sodio è viola'); assert.equal(ELEMENTI[8], ELEMENTI.O); assert.equal(ELEMENTI[26].simbolo, 'Fe'); assert.equal(ELEMENTI[14].nome, 'silicio');
  tra(ELEMENTI.O.vdw, 0.15, 0.155, 'raggio di van der Waals dell\'ossigeno (nm)'); tra(ELEMENTI.Na.ionico + ELEMENTI.Cl.ionico, 0.28, 0.285, 'Na⁺ + Cl⁻ = mezzo passo del salgemma');
});

// ---------- l'acqua
const acqua = scenaAcqua({ latoNm: 4, salinita: 35, T: 298.15 }, sorgente('prova/acqua'));
prova('l\'acqua: ogni molecola ha la geometria vera (O–H 0,9572 Å, 104,52°)', () => {
  const p = acqua.atomi.pos, n = acqua.molecole; let peggioD = 0, peggioA = 0;
  for (let i = 0; i < n; i++) {
    const a = 3 * i, d1 = dist(p, a, a + 1), d2 = dist(p, a, a + 2), hh = dist(p, a + 1, a + 2), ang = Math.acos((d1 * d1 + d2 * d2 - hh * hh) / (2 * d1 * d2));
    peggioD = Math.max(peggioD, Math.abs(d1 - ACQUA.OH), Math.abs(d2 - ACQUA.OH)); peggioA = Math.max(peggioA, Math.abs(ang - ACQUA.angolo));
    assert.equal(acqua.atomi.elemento[a], 8); assert.equal(acqua.atomi.elemento[a + 1], 1); assert.equal(acqua.atomi.gruppo[a + 2], i);
  }
  assert.ok(peggioD < 2e-6 && peggioA < 2e-4, `scarto massimo ${peggioD} nm, ${peggioA} rad`);
  console.log(`      ${n} molecole; scarto massimo della lunghezza ${peggioD.toExponential(1)} nm, dell'angolo ${peggioA.toExponential(1)} rad`);
});
prova('l\'acqua: la densità è quella vera, nessuna sovrapposizione, il primo vicino a ~2,8 Å', () => {
  const p = acqua.atomi.pos, n = acqua.molecole, V = acqua.scatola[0] * acqua.scatola[1] * acqua.scatola[2]; let minimo = 9, vicini = 0, primo = 0;
  tra(n / V, 31.5, 33.6, 'molecole per nm³ (acqua di mare a 25 °C: 33,0)');
  for (let i = 0; i < n; i++) { let piuVicino = 9; for (let j = 0; j < n; j++) if (j !== i) { const d = dist(p, 3 * i, 3 * j); if (d < piuVicino) piuVicino = d; if (d < 0.35) vicini++; } primo += piuVicino; if (piuVicino < minimo) minimo = piuVicino; }
  tra(minimo, 0.25, 0.29, 'la distanza minima tra due ossigeni (nm)'); tra(primo / n, 0.265, 0.295, 'la distanza media dal primo vicino (nm)'); tra(vicini / n, 3.8, 5.6, 'vicini entro 3,5 Å (misurato: 4,3–4,7)');
  tra(acqua.legamiIdrogeno / n, 1.3, 2.01, 'idrogeni rivolti a un vicino, per molecola');
  console.log(`      ${(n / V).toFixed(1)} molecole/nm³; O–O minimo ${minimo.toFixed(3)} nm, primo vicino medio ${(primo / n).toFixed(3)} nm, ${(vicini / n).toFixed(2)} vicini entro 3,5 Å; ${(acqua.legamiIdrogeno / n).toFixed(2)} legami a idrogeno donati per molecola`);
});
prova('gli ioni: uno ogni ~90 molecole per specie, col guscio orientato (O verso Na⁺, H verso Cl⁻)', () => {
  const p = acqua.atomi.pos, n = acqua.molecole, [, Na, Cl] = acqua.parti;
  tra(n / (Na.a - Na.da), 70, 115, 'molecole per ione sodio'); tra(n / (Cl.a - Cl.da), 70, 125, 'molecole per ione cloro');
  const guscio = (ione, raggio) => { let quanti = 0, hPiuVicino = 0, dO = 0; for (let i = 0; i < n; i++) { const d = dist(p, ione, 3 * i); if (d < raggio) { quanti++; dO += d; if (Math.min(dist(p, ione, 3 * i + 1), dist(p, ione, 3 * i + 2)) < d) hPiuVicino++; } } return { quanti, hPiuVicino, dO: dO / quanti }; };
  let qNa = 0, hNa = 0, dNa = 0, qCl = 0, hCl = 0, dCl = 0;
  for (let i = Na.da; i < Na.a; i++) { const g = guscio(i, 0.3); qNa += g.quanti; hNa += g.hPiuVicino; dNa += g.dO; }
  for (let i = Cl.da; i < Cl.a; i++) { const g = guscio(i, 0.36); qCl += g.quanti; hCl += g.hPiuVicino; dCl += g.dO; }
  const nNa = Na.a - Na.da, nCl = Cl.a - Cl.da;
  tra(qNa / nNa, 4.5, 7, 'molecole nel guscio del sodio (misurato: 5–6)'); tra(dNa / nNa, 0.23, 0.26, 'distanza Na–O (misurata: 2,36–2,4 Å)'); assert.ok(hNa / qNa < 0.05, `attorno al sodio gli idrogeni guardano fuori (${hNa} su ${qNa} no)`);
  tra(qCl / nCl, 5, 9, 'molecole nel guscio del cloro (misurato: ~6)'); tra(dCl / nCl, 0.3, 0.345, 'distanza Cl–O (misurata: 3,19 Å)'); assert.ok(hCl / qCl > 0.8, `attorno al cloro le molecole porgono un idrogeno (${hCl} su ${qCl})`);
  console.log(`      ${nNa} Na⁺ e ${nCl} Cl⁻ per ${n} molecole; guscio del sodio ${(qNa / nNa).toFixed(1)} molecole a ${(dNa / nNa * 10).toFixed(2)} Å; del cloro ${(qCl / nCl).toFixed(1)} a ${(dCl / nCl * 10).toFixed(2)} Å, ${(100 * hCl / qCl).toFixed(0)}% con un idrogeno verso lo ione`);
});
prova('la stessa radice dà la stessa acqua; un\'altra radice, un\'altra', () => {
  const a = scenaAcqua({ latoNm: 2 }, sorgente('prova/x')), b = scenaAcqua({ latoNm: 2 }, sorgente('prova/x')), c = scenaAcqua({ latoNm: 2 }, sorgente('prova/y'));
  assert.deepEqual(a.atomi.pos, b.atomi.pos); assert.notDeepEqual(a.atomi.pos.slice(0, 30), c.atomi.pos.slice(0, 30));
  // gli ioni possono arrivare da fuori (da mare.js): specie e quanti
  const d = scenaAcqua({ latoNm: 3, ioni: [{ nome: 'Mg2+', quanti: 3 }, { nome: 'SO4(2-)', quanti: 2 }, { nome: 'Cl-', quanti: 4 }] }, sorgente('prova/z'));
  assert.deepEqual(d.ioni.map((x) => x.quanti), [3, 2, 4]); assert.equal(d.atomi.raggio.length, 3 * d.molecole + 3 + 2 * 5 + 4);
});
prova('il moto dell\'acqua tiene rigide le molecole e resta piccolo', () => {
  const p = Float32Array.from(acqua.atomi.pos), n = acqua.molecole; acqua.tempo(3.7, p); let spostamento = 0, peggio = 0;
  for (let i = 0; i < n; i++) { spostamento = Math.max(spostamento, Math.hypot(p[9 * i] - acqua.atomi.pos[9 * i], p[9 * i + 1] - acqua.atomi.pos[9 * i + 1], p[9 * i + 2] - acqua.atomi.pos[9 * i + 2])); peggio = Math.max(peggio, Math.abs(dist(p, 3 * i, 3 * i + 1) - ACQUA.OH), Math.abs(dist(p, 3 * i + 1, 3 * i + 2) - dist(acqua.atomi.pos, 3 * i + 1, 3 * i + 2))); }
  tra(spostamento, 0.005, 0.09, 'lo spostamento massimo di un ossigeno (nm)'); assert.ok(peggio < 1e-5, `la molecola si deforma di ${peggio} nm`);
});

// ---------- i cristalli
prova('salgemma: reticolo cubico, passo 5,64 Å, ogni ione ha sei vicini dell\'altro segno a 2,82 Å', () => {
  const c = scenaCristallo({ minerale: 'salgemma', latoNm: 3 }), p = c.atomi.pos, e = c.atomi.elemento, n = c.atomiCristallo; let controllati = 0;
  for (let i = 0; i < n; i++) { if ([0, 1, 2].some((k) => p[3 * i + k] < 0.4 || p[3 * i + k] > 2.6)) continue; let v = 0; for (let j = 0; j < n; j++) if (e[j] !== e[i] && Math.abs(dist(p, i, j) - 0.282) < 0.002) v++; assert.equal(v, 6); controllati++; }
  assert.ok(controllati > 100); tra(c.composizione.Na / c.composizione.Cl, 0.9, 1.1, 'tanti sodi quanti cloro'); tra(n / 27, 40, 50, 'atomi per nm³ (44,6)');
  assert.ok(c.legami.length / 2 > 2.5 * n, 'i legami del reticolo ci sono');
});
prova('quarzo: ogni silicio ha quattro ossigeni a 1,61 Å, ogni ossigeno due silici', () => {
  const c = scenaCristallo({ minerale: 'quarzo', latoNm: 3 }), p = c.atomi.pos, e = c.atomi.elemento, n = c.atomiCristallo; let somma = 0, quanti = 0;
  for (let i = 0; i < n; i++) { if ([0, 1, 2].some((k) => p[3 * i + k] < 0.4 || p[3 * i + k] > 2.6)) continue; let v = 0; for (let j = 0; j < n; j++) if (e[j] !== e[i]) { const d = dist(p, i, j); if (d < 0.2) { v++; somma += d; quanti++; } } assert.equal(v, e[i] === 14 ? 4 : 2); }
  tra(somma / quanti, 0.1600, 0.1616, 'Si–O medio (misurato: 1,609 Å)'); tra(n / 27 / 3, 25.5, 28.5, 'SiO₂ per nm³ (26,6)');
  console.log(`      Si–O medio ${(somma / quanti * 10).toFixed(3)} Å; ${(n / 81).toFixed(1)} SiO₂ per nm³`);
});
prova('ghiaccio: due idrogeni per ossigeno, uno su ogni legame (regole del ghiaccio)', () => {
  const c = scenaCristallo({ minerale: 'ghiaccio', latoNm: 3 }, sorgente('prova/ghiaccio')), p = c.atomi.pos, e = c.atomi.elemento, n = c.atomiCristallo, O = []; let H = 0;
  for (let i = 0; i < n; i++) if (e[i] === 8) O.push(i); else H++;
  assert.equal(H, 2 * O.length); assert.equal(O.length, c.molecoleGhiaccio);
  tra(O.filter((i) => [0, 1, 2].every((k) => p[3 * i + k] > 0.5 && p[3 * i + k] < 2.5)).length / 8, 28.5, 33, 'molecole per nm³ lontano dalle facce (30,8)');
  let legami = 0, giusti = 0;
  for (let a = 0; a < O.length; a++) for (let b = a + 1; b < O.length; b++) { const i = O[a], j = O[b], d = dist(p, i, j); if (d > 0.3) continue; legami++; tra(d, 0.27, 0.282, 'O–O nel ghiaccio (2,76 Å)');
    let sul = 0; for (const o of [i, j]) for (const h of [o + 1, o + 2]) { const altro = o === i ? j : i; if (dist(p, h, altro) < 0.19) sul++; } if (sul === 1) giusti++; }
  assert.equal(giusti, legami, `su ${legami} legami, ${giusti} hanno un idrogeno solo`);
  console.log(`      ${O.length} molecole, ${legami} legami tra ossigeni, tutti con un idrogeno solo`);
});
prova('la faccia bagnata: l\'acqua sta sopra il cristallo, non ci entra, e guarda gli ioni della faccia', () => {
  const c = scenaCristallo({ minerale: 'salgemma', dimNm: [4, 3, 4], acqua: { spessoreNm: 2.5 } }, sorgente('prova/faccia')), p = c.atomi.pos, nC = c.atomiCristallo, nW = c.acqua.molecole; let alto = 0, minimo = 9;
  for (let i = 0; i < nC; i++) alto = Math.max(alto, p[3 * i + 1]);
  for (let m = 0; m < nW; m++) { const o = nC + 3 * m; assert.ok(p[3 * o + 1] > alto - 0.05); if (p[3 * o + 1] < alto + 0.5) for (let i = 0; i < nC; i++) if (p[3 * i + 1] > alto - 0.4) minimo = Math.min(minimo, dist(p, o, i)); }
  tra(minimo, 0.2, 0.33, 'l\'ossigeno più vicino a un atomo della faccia (nm)'); assert.equal(typeof c.tempo, 'function'); assert.ok(c.parti.length >= 4 && c.parti[1].da === nC);
  tra(nW / (4 * 2.5 * 4), 30, 34, 'molecole d\'acqua per nm³ sopra la faccia');
});

// ---------- la preparazione per la vista
prova('preparare una scena: ogni atomo una volta sola, i gruppi contano tutti gli atomi a ogni livello', () => {
  const s = scenaCristallo({ minerale: 'salgemma', dimNm: [8, 5, 8], acqua: { spessoreNm: 3 } }, sorgente('prova/prep')), P = preparaScena(s), N = s.atomi.raggio.length;
  assert.equal(P.N, N); const visti = new Uint8Array(N); for (let j = 0; j < N; j++) visti[P.ordine[j]]++; assert.ok(visti.every((x) => x === 1));
  for (let L = 0; L <= 4; L++) { let tot = 0; for (const z of P.pezzi) { const l = z.liv[L]; for (let j = l.da; j < l.da + l.nE + l.nB; j++) tot += j < N ? 1 : P.rappresenta[j - N]; } assert.equal(tot, N, `livello ${L}`); }
  const istanze = [0, 1, 2, 3, 4].map((L) => P.pezzi.reduce((t, z) => t + z.liv[L].nE + z.liv[L].nB, 0));
  assert.ok(istanze[1] < 0.3 * N && istanze[2] < 0.5 * istanze[1] && istanze[3] < 0.5 * istanze[2], `istanze per livello ${istanze}`);
  // i sepolti stanno davvero dentro: almeno a mezzo nanometro da ogni faccia della scatola
  let sepolti = 0; for (const z of P.pezzi) { const l = z.liv[0]; for (let j = l.da + l.nE; j < l.da + l.nE + l.nB; j++) { sepolti++; for (let k = 0; k < 3; k++) assert.ok(P.pos[3 * j + k] > P.lo[k] + 0.5 && P.pos[3 * j + k] < P.hi[k] - 0.5); } }
  assert.equal(sepolti, P.quantiSepolti); tra(sepolti / N, 0.25, 0.75, 'la parte di atomi sepolti');
  assert.equal(preparaScena(s, { scartaSepolti: false }).quantiSepolti, 0);
  console.log(`      ${N} atomi in ${P.pezzi.length} pezzi; istanze ai livelli 0–4: ${istanze.join(', ')}; sepolti ${sepolti} (${(100 * sepolti / N).toFixed(0)}%)`);
});
prova('unità, colori e parti arrivano giusti nei buffer', () => {
  const s = { unita: 'm', atomi: { pos: new Float32Array([0, 0, 0, 1e-9, 0, 0, 0, 2e-9, 0]), raggio: new Float32Array([1.5e-10, 1e-10, 1e-10]), elemento: new Uint8Array([8, 1, 17]) }, parti: [{ nome: 'a', da: 0, a: 2, colore: [1, 2, 3] }, { nome: 'b', da: 2, a: 3, colore: [9, 8, 7] }], agitazione: { O: 2e-11, 17: 1e-11 } };
  const P = preparaScena(s), f = new Float32Array(P.statico), b = new Uint8Array(P.statico), dove = (i) => P.ordine.indexOf(i);
  tra(P.pos[3 * dove(1)], 0.999, 1.001, 'un nanometro'); tra(f[2 * dove(0)], 0.149, 0.151, 'raggio in nm'); assert.deepEqual([...b.slice(8 * dove(2) + 4, 8 * dove(2) + 7)], [9, 8, 7]);
  assert.equal(b[8 * dove(0) + 7], 255); assert.equal(b[8 * dove(1) + 7], 0); tra(P.agitaMax, 0.019, 0.021, 'agitazione massima (nm)');
  const E = preparaScena(s, { colora: 'elemento' }), be = new Uint8Array(E.statico); assert.deepEqual([...be.slice(8 * E.ordine.indexOf(2) + 4, 8 * E.ordine.indexOf(2) + 7)], ELEMENTI.Cl.colore);
  assert.throws(() => preparaScena({ atomi: {} })); assert.throws(() => preparaScena({ unita: 'leghe', atomi: { pos: new Float32Array(3) } }));
});
prova('la prova di carico ha gli atomi chiesti, e un milione si prepara', () => {
  const a = scenaDoppioStrato({ atomi: 200000 }, sorgente('prova/carico')); tra(a.atomi.raggio.length / 200000, 0.93, 1.03, 'atomi rispetto ai chiesti'); assert.equal(a.parti.length, 5);
  const t = performance.now(), b = scenaDoppioStrato({ atomi: 1000000 }, sorgente('prova/carico')), P = preparaScena(b), ms = performance.now() - t;
  tra(P.N / 1e6, 0.95, 1.03, 'atomi rispetto al milione'); assert.ok(P.M < 1.25 * P.N, 'i gruppi costano meno di un quarto in più'); assert.ok(P.pezzi.length > 50 && P.pezzi.length < 3000);
  console.log(`      ${P.N} atomi, ${P.M - P.N} gruppi, ${P.pezzi.length} pezzi, ${P.quantiSepolti} sepolti: scena e preparazione in ${ms.toFixed(0)} ms; ${(P.M * 20 / 1e6).toFixed(1)} MB di buffer`);
});
prova('i reticoli hanno il formato dichiarato', () => {
  for (const r of Object.values(RETICOLI)) { assert.ok(r.a.length === 3 && r.b.length === 3 && r.c.length === 3 && r.base.length > 0); for (const at of r.base) { assert.ok(ELEMENTI[at.el]); assert.ok(at.uvw.every((x) => x >= 0 && x <= 1.5)); } }
  // un reticolo dato da fuori (cubico semplice di ferro, 2,87 Å)
  const c = scenaCristallo({ reticolo: { nome: 'ferro (prova)', a: [0.287, 0, 0], b: [0, 0.287, 0], c: [0, 0, 0.287], base: [{ el: 'Fe', uvw: [0, 0, 0] }, { el: 'Fe', uvw: [0.5, 0.5, 0.5] }] }, latoNm: 2 });
  tra(c.atomiCristallo / 8, 80, 95, 'atomi di ferro per nm³ (84,6)'); assert.equal(c.atomi.elemento[0], 26);
});

console.log(`\n${ok} prove superate in ${((performance.now() - inizio) / 1000).toFixed(1)} s`);
