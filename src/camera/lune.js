// lune.js — le lune e le maree. Nessuna luna è messa a mano: ognuna ha una storia fisica.
//
// Una luna può nascere in tre modi, e qui ci sono tutti e tre:
//   1. dal DISCO di gas e polvere che gira attorno a un pianeta gigante mentre si forma (le lune
//      «regolari»: Io, Europa, Titano...). Il disco viene diviso in fasce: ogni luna raccoglie la
//      materia della sua fascia, larga alcuni raggi di Hill; così numero, masse e distanze
//      discendono dal disco, non da un sorteggio;
//   2. da un GRANDE URTO contro un pianeta roccioso (la nostra Luna): i detriti si riuniscono
//      appena fuori dal limite di Roche, poi le maree spingono la luna lontano per miliardi di anni;
//   3. per CATTURA: piccoli corpi di passaggio, rimasti su orbite larghe e storte.
// Poi le MAREE fanno il resto: bloccano la rotazione della luna (sempre la stessa faccia),
// rendono tonda l'orbita, e se l'orbita non può diventare tonda (una risonanza con la vicina la
// tiene schiacciata) impastano la luna a ogni giro e la scaldano: così emergono i vulcani di Io
// e gli oceani sotto il ghiaccio di Europa.
//
// LEGGI EMPIRICHE (misurate o tarate, non derivate qui), dichiarate dove si usano:
//   · massa totale delle lune regolari ≈ 2·10⁻⁴ del pianeta (Canup e Ward 2006);
//   · il bordo del disco a circa R_Hill/48 (Quillen e Trilling 1998) e la sua temperatura tarata su Giove;
//   · resistenza, rigidità e attrito (Q) di roccia e ghiaccio; k₂/Q di un corpo in parte fuso (Io, Encelado);
//   · k₂/Q dei pianeti (Terra, Marte, Giove); il calore radioattivo della roccia (condriti);
//   · quanto spesso c'è l'urto giusto e quanta massa resta in orbita (simulazioni di urti giganti);
//   · quanti e quanto grandi sono i corpi catturati (contati nel Sistema Solare);
//   · lo scarto dalla risonanza esatta che fissa l'eccentricità forzata (misurato su Io ed Europa).

import { COSTANTI, MSOLE, LSOLE, ANNO, UA, temperaturaEquilibrio, caloreDellaRoccia } from './leggi.js';
import { stella as stellaVera } from './stelle.js';
import { comeSorgente } from './eventi.js';
import { forzanteMareale } from './maree.js'; // la marea ha una fonte sola: la formula e la dissipazione stanno lì
import { storia } from './storia.js'; // lo stato interno di una luna di roccia è la sua storia (le stesse equazioni dei pianeti)

const GIOVE = { M: 1.898e27, R: 7.15e7 }, ETA = 4.5e9, GIORNO_GIOVANE = 10 * 3600, NEVE = 170; // sotto 170 K il ghiaccio non evapora
const sfera = (R) => (4 / 3) * Math.PI * R ** 3;

// i due materiali di cui sono fatte le lune (proprietà misurate in laboratorio e sui corpi veri):
// densità (kg/m³), resistenza allo schiacciamento (Pa), rigidità (Pa), comprimibilità (Pa), attrito
// interno Q da freddo (Luna: circa 40; ghiaccio: circa 100), k₂/Q da «caldo» (in parte fuso: Io 0,015,
// Lainey 2009; un guscio di ghiaccio staccato dal fondo da un oceano: Encelado, circa 0,01),
// conducibilità del calore (W/m/K) e temperatura di fusione (K)
export const MATERIALI = {
  roccia: { densita: 3300, resistenza: 1e8, rigidita: 6.5e10, comprimibilita: 1.3e11, Q: 40, k2Qcaldo: 0.015, conduzione: 3, fusione: 1400 },
  ghiaccio: { densita: 930, resistenza: 4e6, rigidita: 4e9, comprimibilita: 9e9, Q: 100, k2Qcaldo: 0.01, fusione: 273 },
};

// ---------- le distanze che contano
// il limite di Roche: più vicino di così la marea del pianeta è più forte della gravità che tiene
// insieme la luna, e la sbriciola (un corpo fluido o un mucchio di detriti: 2,44; da lì gli anelli)
export const limiteRoche = (P, densitaLuna = MATERIALI.roccia.densita) => 2.44 * P.raggioM * Math.cbrt(P.massaKg / sfera(P.raggioM) / densitaLuna);
// il raggio di Hill: fin dove comanda la gravità del pianeta e non quella della stella
export const raggioHill = (P) => P.aM * Math.cbrt(P.massaKg / (3 * P.Mstella));
// il periodo di un'orbita attorno al pianeta (Keplero)
export const periodoOrbita = (P, aM, massaLuna = 0) => 2 * Math.PI * Math.sqrt(aM ** 3 / (COSTANTI.G * (P.massaKg + massaLuna)));

// sopra quale raggio un corpo si arrotonda da solo: la pressione al centro (∝ G·ρ²·R²) supera la
// resistenza del materiale, che cede e scorre. Il ghiaccio cede prima della roccia (Mimas, 200 km,
// è tondo; Vesta, 260 km di roccia, non del tutto)
export function raggioRotondo(densita = MATERIALI.roccia.densita, resistenza = (densita < 2000 ? MATERIALI.ghiaccio : MATERIALI.roccia).resistenza) {
  return Math.sqrt((2 * resistenza) / (Math.PI * COSTANTI.G * densita * densita));
}

// ---------- di che cosa è fatta una luna, e come è fatta dentro
// la densità di un miscuglio di ghiaccio e roccia; un corpo grande si comprime un po' sotto il suo
// peso (al primo ordine: pressione media, due quinti di quella al centro, divisa per la comprimibilità)
export function densitaCorpo(massaKg, ghiaccio = 0) {
  const { roccia: r, ghiaccio: g } = MATERIALI, v = ghiaccio / g.densita + (1 - ghiaccio) / r.densita, rho0 = 1 / v, vg = ghiaccio / g.densita / v;
  const R0 = Math.cbrt(massaKg / sfera(1) / rho0), Pc = ((2 * Math.PI) / 3) * COSTANTI.G * rho0 * rho0 * R0 * R0;
  return rho0 * (1 + (0.4 * Pc) / (1 / (vg / g.comprimibilita + (1 - vg) / r.comprimibilita)));
}
// l'interno: quanta parte è ghiaccio (dalla composizione, o se manca dalla densità), e quanto è
// spesso lo strato di ghiaccio che, più leggero, sta sopra il nucleo di roccia
function dentro(L) {
  const { roccia: r, ghiaccio: g } = MATERIALI, rho = L.densita ?? L.massaKg / sfera(L.raggioM);
  const vDaRho = Math.min(1, Math.max(0, (r.densita - rho) / (r.densita - g.densita)));
  const fg = L.composizione ? L.composizione.ghiaccio ?? 0 : (vDaRho * g.densita) / rho;
  const vg = L.composizione ? fg / g.densita / (fg / g.densita + (1 - fg) / r.densita) : vDaRho;
  const ghiacciata = fg > 0.005; // basta mezzo centesimo di ghiaccio per coprire tutta la superficie
  return { rho, fg, ghiacciata, mat: ghiacciata ? g : r, strato: L.raggioM * (1 - Math.cbrt(1 - vg)) };
}

// ---------- quanto si lascia deformare e quanto attrito fa: k₂/Q
// k₂ (numero di Love) dice quanto il corpo si lascia deformare dalla marea: un corpo piccolo e rigido
// quasi niente, uno grande o molle molto (corpo elastico omogeneo: 3/2 / (1 + 19μ/(2ρgR))); Q dice quanta
// di quell'energia si perde in attrito a ogni giro. Per la Luna vera viene k₂ ≈ 0,023, come misurato
export function k2QFreddo(L) {
  const { rho, mat } = dentro(L), g = (COSTANTI.G * L.massaKg) / L.raggioM ** 2;
  return 1.5 / (1 + (19 * mat.rigidita) / (2 * rho * g * L.raggioM)) / mat.Q;
}
// per i pianeti: la Terra dissipa molto perché ha gli oceani (k₂ 0,3, Q circa 30 in media sulla sua
// storia; oggi 12), un pianeta asciutto meno (Marte: Q circa 100); un gigante di gas pochissimo
// (Giove: k₂/Q ≈ 10⁻⁵, misurato dal moto di Io)
export const k2QPianeta = (P) => (P.tipo === 'gassoso' || P.tipo === 'ghiacciato' ? 1e-5 : 0.3 / (P.clima?.acqua === 'liquida' ? 30 : 100));

// ---------- il calore
// il calore della radioattività nella roccia (W per kg di roccia), che cala con l'età: uranio 238 e
// 235, torio, potassio 40, nelle quantità delle condriti; ognuno si dimezza col suo tempo (in miliardi di anni)
// (la legge è una sola, in leggi.js: caloreDellaRoccia; la usano anche i pianeti, in geologia.js)
export function caloreRadioattivo(L, eta = ETA) {
  return (caloreDellaRoccia(eta) * L.massaKg * (1 - dentro(L).fg)) / (4 * Math.PI * L.raggioM ** 2);
}
// la temperatura alla superficie di una luna senz'aria: la luce della stella alla distanza del pianeta
// (il ghiaccio è chiaro e ne riflette di più; sopra i 170 K quello esposto evapora, e resta solo al
// riparo sotto la polvere: più caldo di così il ghiaccio di una luna non è mai)
const luce = (P) => P.Lw ?? stellaVera(P.Mstella / MSOLE).L * LSOLE;
const tSuperficie = (P, ghiacciata) => Math.min(ghiacciata ? NEVE : 700, Math.max(30, temperaturaEquilibrio(luce(P), P.aM, ghiacciata ? 0.6 : 0.1)));
// quanto è spesso il guscio freddo e fermo che riesce a portare fuori, per sola conduzione, il flusso
// q: più calore esce, più il guscio è sottile (roccia: k·ΔT/q; nel ghiaccio la conducibilità è 567/T)
function guscio(P, L, q) {
  const D = dentro(L), Ts = tSuperficie(P, D.ghiacciata);
  const d = q <= 0 ? Infinity : D.ghiacciata ? (567 * Math.log(D.mat.fusione / Ts)) / q : (D.mat.conduzione * (D.mat.fusione - Ts)) / q;
  // nel ghiaccio: la temperatura alla base dello strato (se supera 273 K, lì sotto c'è acqua)
  return { ...D, Ts, d, Tbase: D.ghiacciata ? Ts * Math.exp(Math.min(50, (q * D.strato) / 567)) : 0 };
}
// «dentro è in parte fuso?» Roccia: il guscio rigido è più sottile di 200 km (sotto, la roccia è
// vicina a fondere: così la Terra sì, Marte e la Luna oggi no). Ghiaccio: sotto il guscio resta acqua
const fusoDentro = (s) => (s.ghiacciata ? s.d < s.strato : s.d < 2e5);

// il RISCALDAMENTO MAREALE (W/m²). Su un'orbita schiacciata la luna è ora più vicina ora più lontana:
// la marea del pianeta la stira e la rilascia a ogni giro, e l'attrito interno ne fa calore:
//   Ė = (21/2)·(k₂/Q)·G·M_p²·R⁵·n·e² / a⁶        (formula standard: Peale, Cassen e Reynolds 1979)
// diviso per la superficie. Il k₂/Q ha due valori (dichiarati in MATERIALI): un corpo nasce caldo, e se
// il calore delle maree basta a tenerlo in parte fuso resta molle e dissipa molto (roccia 0,015, come Io;
// guscio di ghiaccio sopra un oceano 0,01); se non basta si irrigidisce e dissipa poco (k₂ elastico / Q)
// (la formula è scritta una volta sola, in maree.js: forzanteMareale; qui si moltiplica per il k₂/Q della luna)
const potenzaMareale = (P, L, kq) => forzanteMareale({ Mospite: P.massaKg, raggioM: L.raggioM, aM: L.aM, eccentricita: L.eccentricita ?? 0 }) * kq;
// LE LUNE DI ROCCIA NELLA STORIA (storia.js + maree.js). Lo stato interno di una luna di roccia è quello di un piccolo
// pianeta scaldato dalla radioattività e dalla marea del suo pianeta: le stesse due equazioni, con la dissipazione che
// viene dalla viscosità e dalla rigidità che il mantello ha in quel momento (Andrade). Non ci sono più i due stati
// «calda/fredda» né il k₂/Q fisso di Io: il ramo caldo è dove il calore che esce uguaglia quello di marea.
//   · Dove nemmeno la dissipazione più grande possibile (−Im k₂ = 3/4) darebbe un centesimo del calore radiogenico, la
//     marea non cambia lo stato del corpo: si risparmia la storia e resta il k₂/Q elastico da fredda (k2QFreddo).
//   · LE LUNE GHIACCIATE NON SONO ANCORA QUI: serve il corpo a strati (guscio, oceano, roccia); per loro restano il
//     guscio a sola conduzione e i due valori di k₂/Q di prima (MATERIALI.ghiaccio).
const memoInterni = new Map();
const mareaConta = (P, L, eta) => 0.75 * forzanteMareale({ Mospite: P.massaKg, raggioM: L.raggioM, aM: L.aM, eccentricita: L.eccentricita ?? 0 }) > 0.01 * caloreDellaRoccia(eta) * L.massaKg;
function internoDiRoccia(P, L, eta) {
  const Ts = tSuperficie(P, false), chiave = `${L.massaKg}|${L.raggioM}|${L.aM}|${L.eccentricita ?? 0}|${P.massaKg}|${Ts}|${eta}`; let s = memoInterni.get(chiave); if (s) return s;
  s = storia({ tipo: 'roccioso', massaKg: L.massaKg, raggioM: L.raggioM, composizione: { ferro: L.composizione?.ferro, acqua: 0 }, marea: { Mospite: P.massaKg, aM: L.aM, eccentricita: L.eccentricita ?? 0, obliquita: 0 } }, eta, { Tsuperficie: Ts });
  memoInterni.set(chiave, s); if (memoInterni.size > 3000) memoInterni.delete(memoInterni.keys().next().value);
  return s;
}
export function k2QLuna(P, L, eta = ETA) {
  if (!dentro(L).ghiacciata) { // roccia: dalla storia del corpo (la parte del volume che dissipa è già dentro)
    if (!mareaConta(P, L, eta)) return k2QFreddo(L);
    const s = internoDiRoccia(P, L, eta), f = forzanteMareale({ Mospite: P.massaKg, raggioM: L.raggioM, aM: L.aM, eccentricita: L.eccentricita ?? 0 }); return f > 0 ? s.Q.marea / f : 0;
  }
  const kc = dentro(L).mat.k2Qcaldo, qc = potenzaMareale(P, L, kc) / (4 * Math.PI * L.raggioM ** 2);
  return fusoDentro(guscio(P, L, qc + caloreRadioattivo(L, eta))) ? kc : k2QFreddo(L);
}
export function caloreMareale(P, L, eta = ETA) {
  return potenzaMareale(P, L, k2QLuna(P, L, eta)) / (4 * Math.PI * L.raggioM ** 2);
}

// lo STATO di una luna, dal calore che deve smaltire (maree + radioattività):
//   roccia: se il guscio dovrebbe essere più sottile di 10 km la conduzione non basta, e il calore
//   esce come lava ('vulcanica': Io); sotto i 200 km l'interno si muove ('geologicamente attiva');
//   ghiaccio: se alla base dello strato si superano 273 K c'è un 'oceano sotto il ghiaccio' (Europa);
//   se si arriva a tre quarti della fusione il ghiaccio profondo scorre ('geologicamente attiva')
export function stato(P, L, eta = ETA) {
  // roccia con una marea che conta: dalla sua storia. «vulcanica» se il calore esce soprattutto con il magma (Q_fuso >
  // Q_conv: il regime di Io); «attiva» se la marea scalda più della radioattività o il coperchio è più sottile di 200 km
  // (la soglia di prima, RIMASTA); se no «fredda e ferma»
  if (!dentro(L).ghiacciata && mareaConta(P, L, eta)) { const x = internoDiRoccia(P, L, eta); return x.Q.fuso > x.Q.conv ? 'vulcanica' : x.Q.marea > x.Q.rad || x.crosta.coperchio < 2e5 ? 'geologicamente attiva' : 'fredda e ferma'; }
  const s = guscio(P, L, caloreMareale(P, L, eta) + caloreRadioattivo(L, eta));
  if (s.ghiacciata) return s.d < s.strato ? 'oceano sotto il ghiaccio' : s.Tbase > 0.75 * s.mat.fusione ? 'geologicamente attiva' : 'fredda e ferma';
  return s.d < 1e4 ? 'vulcanica' : s.d < 2e5 ? 'geologicamente attiva' : 'fredda e ferma';
}

// ---------- le maree
// la marea che la luna alza sul pianeta (marea di equilibrio: dislivello tra alta e bassa su un
// oceano che copre tutto, 3/2·(m/M)·(R/a)³·R), e ogni quanto torna: due volte per ogni giro del
// pianeta rispetto alla luna (sulla Terra 12 ore e 25 minuti)
export function maree(P, L) {
  const altezza = 1.5 * (L.massaKg / P.massaKg) * (P.raggioM / L.aM) ** 3 * P.raggioM;
  const n = ((L.retrograda ? -2 : 2) * Math.PI) / periodoOrbita(P, L.aM, L.massaKg), rel = Math.abs((P.giorno ? (2 * Math.PI) / P.giorno : 0) - n);
  return { altezza, periodo: rel > 0 ? Math.PI / rel : Infinity };
}
// il BLOCCO MAREALE: il rigonfiamento che il pianeta alza sulla luna fa da freno, finché la luna
// mostra sempre la stessa faccia. Tempo (s) = momento angolare della rotazione / momento della marea
//   = (4/15)·ω·m·a⁶ / ((k₂/Q)·G·M_p²·R³); cresce come la distanza alla sesta. Si usa il k₂/Q da
// fredda (il caso più lento) e una rotazione iniziale di 10 ore, tipica di un corpo appena formato
export function tempoBlocco(P, L, giornoIniziale = GIORNO_GIOVANE) {
  return ((4 / 15) * ((2 * Math.PI) / giornoIniziale) * L.massaKg * L.aM ** 6) / (k2QFreddo(L) * COSTANTI.G * P.massaKg ** 2 * L.raggioM ** 3);
}
// l'ALLONTANAMENTO: il pianeta gira più in fretta di quanto la luna orbita, il suo rigonfiamento
// sta un po' avanti e tira la luna in avanti: l'orbita si allarga, da/dt = 3·(k₂/Q)·(m/M)·R⁵·√(GM)·a^(-11/2).
// Integrata: a^(13/2) cresce in modo lineare nel tempo (velocissima all'inizio, poi sempre più lenta)
export function orbitaDopoLeMaree(P, massaLuna, a0, anni = ETA) {
  const k = (39 / 2) * k2QPianeta(P) * (massaLuna / P.massaKg) * P.raggioM ** 5 * Math.sqrt(COSTANTI.G * (P.massaKg + massaLuna));
  return Math.pow(Math.pow(a0, 6.5) + k * anni * ANNO, 2 / 13);
}
// la CIRCOLARIZZAZIONE: l'attrito nella luna consuma l'eccentricità in un tempo
// τ = (2/21)·(m/M)·(a/R)⁵ / ((k₂/Q)·n); la marea alzata sul pianeta invece la alimenta («spinta»): se
// le due si pareggiano l'orbita resta schiacciata (è il caso della Luna: e = 0,055 dopo 4,5 miliardi di anni)
function eccentricitaResidua(P, L, eta) {
  const kq = k2QLuna(P, L, eta), n = (2 * Math.PI) / periodoOrbita(P, L.aM, L.massaKg);
  const tau = ((2 / 21) * (L.massaKg / P.massaKg) * (L.aM / L.raggioM) ** 5) / (kq * n);
  const spinta = L.retrograda ? 0 : (19 / 28) * (k2QPianeta(P) / kq) * (L.massaKg / P.massaKg) ** 2 * (P.raggioM / L.raggioM) ** 5;
  return L.eccentricita * Math.exp(-((eta * ANNO) / tau) * Math.max(0, 1 - spinta));
}

// la FORMA. Un corpo piccolo resta come gli urti l'hanno lasciato (una patata: tre assi diversi, dal
// caso). Uno grande è tondo, ma non una sfera: bloccato, la marea lo allunga verso il pianeta e la
// rotazione lo schiaccia ai poli (ellissoide di Roche, corpo fluido: con q = (M/m)·(R/a)³ gli assi sono
// 1 + 35q/12, 1 − 10q/12, 1 − 25q/12; per Io dà 15 km tra il più lungo e il più corto, come misurato)
function forma(P, L, bloccata, c) {
  const rotonda = L.raggioM > raggioRotondo(L.densita, dentro(L).mat.resistenza);
  if (!rotonda) { const f = c.serie(`${L.evento}/forma`), ba = 0.6 + 0.35 * f(0), cb = 0.6 + 0.35 * f(1), k = Math.cbrt(ba * ba * cb); return { rotonda, assi: [1 / k, ba / k, (ba * cb) / k] }; }
  const q = Math.min(0.1, bloccata ? (P.massaKg / L.massaKg) * (L.raggioM / L.aM) ** 3 : ((2 * Math.PI) / GIORNO_GIOVANE) ** 2 * L.raggioM ** 3 / (COSTANTI.G * L.massaKg));
  return { rotonda, assi: bloccata ? [1 + (35 * q) / 12, 1 - (10 * q) / 12, 1 - (25 * q) / 12] : [1 + (5 * q) / 12, 1 + (5 * q) / 12, 1 - (5 * q) / 6] };
}

// ---------- 1. le lune regolari, dal disco attorno a un gigante
function regolari(P, amb, c) {
  const { G } = COSTANTI, M = P.massaKg;
  // LEGGE DI SCALA (Canup e Ward 2006): il disco riceve gas e polvere mentre le lune già fatte cadono
  // sul pianeta; ciò che resta alla fine è sempre circa 2·10⁻⁴ della massa del pianeta (Giove 2,1; Saturno
  // 2,5; Urano 1,0), con un po' di dispersione
  const mu = 2e-4 * Math.exp(0.35 * campana(c.serie('disco/massa')));
  // il bordo interno: il campo magnetico del pianeta giovane svuota il disco fino a dove il gas gira
  // insieme al pianeta (orbita sincrona, dal suo giorno) o poco oltre; mai dentro il limite di Roche.
  // Il bordo esterno: il gas che cade porta momento angolare e si ferma a circa R_Hill/48 (Quillen e
  // Trilling 1998), un po' più dentro o più fuori. Un gigante troppo vicino alla stella non ha spazio: niente lune
  const sincrona = Math.cbrt((G * M * (P.giorno || GIORNO_GIOVANE) ** 2) / (4 * Math.PI ** 2));
  const aIn = Math.max(1.3 * limiteRoche(P), sincrona * c.tra('disco/bordo interno', 1, 2.5)), aOut = (amb.RH * c.tra('disco/bordo esterno', 0.6, 2)) / 48, W = aOut - aIn;
  if (W <= 0) return [];
  // la temperatura del disco: scaldato dall'attrito del gas che cade (T ∝ (M·Ṁ)^¼·r^(-¾), e Ṁ ∝ M),
  // TARATA su Giove (1300 K a un raggio di Giove: la linea del ghiaccio cade tra Europa e Ganimede),
  // più la luce della stella. Dove fa meno di 170 K condensa anche il ghiaccio: metà ghiaccio e metà
  // roccia (la miscela solare); il passaggio è graduale perché il disco si raffredda mentre le lune crescono
  const T = (r) => Math.hypot((1300 * Math.sqrt(M / GIOVE.M) * Math.pow(r / GIOVE.R, -0.75)) ** 2, amb.Tstella ** 2) ** 0.5;
  // ogni luna raccoglie la materia della sua FASCIA, larga K raggi di Hill (K tra 12 e 22: orbite più
  // fitte non reggono miliardi di anni). Con un disco di densità ∝ 1/r, la massa di una fascia è
  // proporzionale alla sua larghezza Δ, e Δ = K·a·(m/3M)^⅓: risolvendo, Δ = K^(3/2)·a^(3/2)·√(μ/(3W)).
  // Le fasce si mettono una dopo l'altra finché il disco finisce: il numero di lune ne discende
  const K = c.tra('disco/larghezza delle fasce', 12, 22), lam = (mu * M) / W, corpi = [];
  for (let r = aIn; r < aOut;) {
    const cc = (K * c.tra(`disco/luna ${corpi.length}/fascia`, 0.85, 1.15)) ** 1.5 * Math.sqrt(mu / (3 * W));
    let a = r, D = 0; for (let i = 0; i < 12; i++) { D = Math.min(cc * a ** 1.5, 0.8 * a); a = r + D / 2; }
    if (r + D > aOut || corpi.length > 14) { // l'ultima fascia è tagliata dal bordo: se è piccola, la sua materia va alla luna prima
      const resto = aOut - r;
      if (resto > 0.4 * D || !corpi.length) corpi.push({ a: r + Math.min(resto, D) / 2, m: lam * resto }); else corpi.at(-1).m += lam * resto;
      break;
    }
    corpi.push({ a, m: lam * D }); r += D;
  }
  // poi le MAREE DEL PIANETA spingono in fuori anche queste lune, con la stessa legge della Luna
  // (da/dt ∝ m·a^(-11/2)): molto le interne, quasi niente le lontane. Così una luna interna si avvicina
  // alla vicina di fuori; quando i loro periodi arrivano a un rapporto semplice (il primo che incontrano
  // scendendo: 2:1, 3:2 o 4:3) si incastrano in RISONANZA e da lì proseguono insieme, in catena,
  // spartendosi il momento angolare ricevuto (è la storia di Io, Europa e Ganimede; Callisto ne è fuori)
  for (const b of corpi) b.ghiaccio = 0.5 / (1 + (T(b.a) / NEVE) ** 8); // la composizione è quella del posto dove è nata
  const libera = corpi.map((b) => orbitaDopoLeMaree(P, b.m, b.a, amb.eta)), fin = [libera[0]], RIS = [[2, '2:1'], [1.5, '3:2'], [4 / 3, '4:3']], legami = [];
  for (let i = 0, catena = [0], pavimento = 0; i + 1 < corpi.length; i++) {
    const largo = corpi[i + 1].a / corpi[i].a, ris = RIS.find(([x]) => x <= largo ** 1.5);
    // niente incastro (non la raggiunge, o sono nate troppo fitte per una risonanza semplice): ognuna per sé,
    // ma senza mai scavalcarsi; da qui parte una nuova catena, che non potrà arretrare oltre questo «pavimento»
    if (!ris || (libera[i + 1] / fin[i]) ** 1.5 >= ris[0]) { pavimento = fin[i] * (ris ? ris[0] ** (2 / 3) : largo); fin[i + 1] = Math.max(libera[i + 1], pavimento); catena = [i + 1]; continue; }
    const prima = catena.reduce((t, j) => t + corpi[j].m * Math.sqrt(fin[j]), 0), nuovo = fin[i] * ris[0] ** (2 / 3), mn = corpi[i + 1].m;
    // la catena arretra un po' e la nuova avanza: insieme hanno lo stesso momento angolare di prima
    const s = Math.max(pavimento / fin[catena[0]], ((prima + mn * Math.sqrt(libera[i + 1])) / (prima + mn * Math.sqrt(nuovo))) ** 2);
    for (const j of catena) fin[j] *= s;
    fin[i + 1] = nuovo * s; catena.push(i + 1); legami.push([i, i + 1, ris[1]]);
  }
  corpi.forEach((b, i) => { b.a = fin[i]; });
  // l'energia che scalda una luna in risonanza viene dalla rotazione del pianeta: la marea che la luna
  // alza sul pianeta le cede, al più, la potenza Γ·n (Γ = 3/2·(k₂/Q)_p·G·m²·R_p⁵/a⁶). Il calore non può
  // superarla a lungo: l'eccentricità forzata si ferma lì (per Io: 1,2·10¹⁴ W; ne emette 0,9·10¹⁴)
  const fornita = (b) => ((1.5 * k2QPianeta(P) * G * b.m ** 2 * P.raggioM ** 5) / b.a ** 6) * Math.sqrt((G * M) / b.a ** 3);
  return corpi.map((b, i) => {
    const L = corpoLuna('disco', b.m, b.a, b.ghiaccio, undefined, `disco/luna ${i}`);
    // l'eccentricità: le maree la cancellano, ma una vicina in risonanza la rigenera a ogni giro
    // (eccentricità FORZATA ≈ 0,75·(m_vicina/M)/δ per la luna interna, 0,43 per l'esterna; δ ≈ 0,004 è lo
    // scarto dalla risonanza esatta, MISURATO su Io ed Europa: dà i millesimi osservati); oltre 0,02 la formula non vale
    const forzata = legami.reduce((e, [x, y]) => e + (x === i ? 0.75 * corpi[y].m : y === i ? 0.43 * corpi[x].m : 0) / M / 0.004, 0);
    L.eccentricita = c.tra(`disco/luna ${i}/eccentricità`, 0.005, 0.03); // quella lasciata dal disco, piccola perché il gas la smorza
    L.legami = legami.filter(([x, y]) => x === i || y === i).map(([x, y, nome]) => [x === i ? y : x, nome]);
    if (forzata) {
      const tetto = Math.max(...legami.filter(([x, y]) => x === i || y === i).map(([x]) => fornita(corpi[x])));
      if (dentro(L).ghiacciata) { L.eccentricita = 1; L.eccentricita = Math.min(0.02, forzata, Math.sqrt(tetto / potenzaMareale(P, L, dentro(L).mat.k2Qcaldo))); }
      else { // roccia: il calore all'equilibrio viene dalla storia del corpo; se supera ciò che il pianeta può cedere, l'eccentricità
        // scende (un passo solo, come se il calore andasse con e²: all'equilibrio non è esatto, ed è dichiarato)
        L.eccentricita = Math.min(0.02, forzata); const Q = potenzaMareale(P, L, k2QLuna(P, L, amb.eta)); if (Q > tetto) L.eccentricita *= Math.sqrt(tetto / Q); }
    } else L.eccentricita = eccentricitaResidua(P, L, amb.eta);
    return L;
  });
}

// ---------- 2. la luna da un grande urto, attorno a un pianeta roccioso
// urto: se è dato, è l'urto gigante VERO del pianeta, quello della sua storia degli impatti (impatti.js: il «gigante»
// di storiaImpatti o giganteDi; null se il pianeta non ne ha avuti). Allora niente è sorteggiato: la luna c'è se e solo
// se l'urto ha lasciato in orbita un disco che la fa (urto.luna), con quella massa; le maree lavorano da allora
// (età − urto.t); e il giorno del pianeta parte da quello che l'urto gli ha dato (urto.giornoDopo).
function daUrto(P, amb, c, urto) {
  const { G } = COSTANTI, M = P.massaKg;
  // SENZA L'URTO VERO (ripiego): gli ultimi urti della formazione sono tra corpi grandi come pianeti; serve però l'angolo
  // giusto perché i detriti restino in orbita: DALLE SIMULAZIONI, succede a meno di un pianeta roccioso su due, e la luna
  // che ne nasce ha tra un millesimo e un quarantesimo della massa del pianeta (la nostra: 1/81)
  const sorte = c('urto/sorte') < 0.45, muSorte = Math.pow(10, c.tra('urto/massa', -3, -1.6)), e0 = c.tra('urto/eccentricità', 0.01, 0.08);
  const capita = urto !== undefined ? !!urto?.luna : sorte, anni = urto?.luna ? Math.max(0, amb.eta - urto.t) : amb.eta;
  if (P.tipo !== 'roccioso' || !capita) return [];
  // nasce dai detriti (roccia del mantello, quasi senza ferro) appena fuori dal limite di Roche...
  const m = urto?.luna ? urto.luna.massaKg : muSorte * M, comp = { roccia: 0.98, ferro: 0.02 }, a0 = 1.2 * limiteRoche(P, densitaCorpo(m, 0));
  // ...e le maree la allontanano per tutto il tempo che hanno avuto (da/dt ∝ a^(-11/2))
  let a = orbitaDopoLeMaree(P, m, a0, anni);
  const I = 0.33 * M * P.raggioM ** 2, wMax = Math.sqrt((G * M) / P.raggioM ** 3), Lorb = (x) => m * Math.sqrt(G * M * x);
  let giorno = P.giorno || 24 * 3600, wPrima;
  if (urto?.luna) {
    // il momento angolare si conserva: quello che la luna guadagna allontanandosi lo perde la rotazione del pianeta.
    // Si parte dal giorno che l'urto ha lasciato e si va avanti: il giorno di oggi ne discende. La luna si allontana
    // solo finché il pianeta gira più in fretta di quanto lei orbita: se lo frena fino a lì si fermano insieme, faccia
    // a faccia (come Plutone e Caronte); se già alla nascita orbita più in fretta del pianeta, ricade
    wPrima = Math.min(wMax, (2 * Math.PI) / urto.giornoDopo);
    const avanzo = (x) => wPrima - (Lorb(x) - Lorb(a0)) / I - Math.sqrt((G * (M + m)) / x ** 3);
    if (avanzo(a0) <= 0) return [];
    if (avanzo(a) < 0) { let lo = a0, hi = a; for (let giro = 0; giro < 60; giro++) { const x = 0.5 * (lo + hi); if (avanzo(x) > 0) lo = x; else hi = x; } a = lo; }
    giorno = (2 * Math.PI) / (wPrima - (Lorb(a) - Lorb(a0)) / I);
  } else {
    // (ripiego) dal giorno di oggi si risale al giorno di allora (per la Terra viene 5 ore, come si stima); se servisse
    // un pianeta che girava più in fretta di quanto può stare insieme, la luna si ferma prima
    const wOggi = (2 * Math.PI) / giorno;
    if (wOggi + (Lorb(a) - Lorb(a0)) / I > wMax) a = Math.max(a0, ((Lorb(a0) + I * (wMax - wOggi)) / m) ** 2 / (G * M));
    wPrima = Math.min(wMax, wOggi + (Lorb(a) - Lorb(a0)) / I);
  }
  // la luna si PERDE se: il pianeta è bloccato dalla stella (gira piano: la marea la tira giù invece che su,
  // e ricade: Mercurio e Venere non hanno lune), se orbita più in fretta di quanto il pianeta gira, o se
  // arriva oltre 0,4 raggi di Hill, dove la stella la porta via (pianeti vicini alla stella)
  if (P.bloccato || periodoOrbita(P, a, m) < giorno * (urto?.luna ? 1 - 1e-6 : 1) || a > 0.4 * amb.RH) return [];
  const L = corpoLuna('urto', m, a, 0, comp, 'urto/luna');
  L.giornoInizialePianeta = (2 * Math.PI) / wPrima;
  if (urto?.luna) L.giornoPianeta = giorno; // il giorno del pianeta oggi, dopo che la luna l'ha frenato
  L.eccentricita = e0; L.eccentricita = eccentricitaResidua(P, L, anni); // e0: lasciata dagli ultimi detriti raccolti
  return [L];
}

// ---------- 3. i corpi catturati
function catturati(P, amb, c, grandi) {
  const fuori = [], quante = c.serie('catture/quante');
  // un corpo di passaggio resta solo se qualcosa lo frena: il gas attorno a un gigante che si forma, o
  // uno scambio a tre corpi; per questo i giganti ne hanno e i rocciosi quasi mai. CONTATI nel Sistema
  // Solare: in media 2,5 più grandi di 20 km per ogni gigante, più o meno uguali per tutti (Jewitt e
  // Haghighipour 2007); il loro numero cala come l'inverso del raggio
  const media = P.tipo === 'roccioso' ? 0.15 : 2.5, roche = limiteRoche(P);
  let n = 0; for (let p = quante(0), s = Math.exp(-media); p > s && n < 8; p *= quante(n)) n++; // sorteggio di Poisson (le estrazioni dello stesso evento, una dopo l'altra)
  for (let k = 0; k < n; k++) {
    const R = 2e4 * Math.min(10, 1 / (1 - c(`cattura ${k}/raggio`))), fa = c.tra(`cattura ${k}/distanza`, 0.12, 0.5), fg = 0.5 / (1 + (amb.Tstella / NEVE) ** 8), rho = densitaCorpo(1, fg), pro = c(`cattura ${k}/verso`) < 0.5;
    // restano lontane, tra 0,12 e 0,5 raggi di Hill. Un'orbita nel verso del pianeta regge solo fino a un
    // terzo del raggio di Hill, una contromano fino a metà: per questo la maggior parte gira contromano
    // (non è sorteggiato: emerge), e l'orbita è molto schiacciata ma senza uscire dalla zona stabile
    const retrograda = fa > 0.33 || !pro, a = fa * amb.RH, e = Math.min(c.tra(`cattura ${k}/eccentricità`, 0.1, 0.45), 0.65 / fa - 1);
    // una luna grande spazza via i piccoli corpi che le passano vicino; e troppo vicino al pianeta non si resta
    if (a * (1 - e) < 2 * roche || grandi.some((g) => a * (1 - e) < 1.3 * g.aM * (1 + g.eccentricita))) continue;
    const L = corpoLuna('cattura', sfera(R) * rho, a, fg, undefined, `cattura ${k}`);
    L.retrograda = retrograda; L.eccentricita = e; L.eccentricita = eccentricitaResidua(P, L, amb.eta);
    fuori.push(L);
  }
  return fuori;
}

// una luna appena fatta: massa, orbita e composizione; il resto si calcola dopo. «evento» è il nome sotto cui stanno
// i suoi eventi («disco/luna 2», «urto/luna», «cattura 3»): non è enumerabile (chi elenca o confronta le lune vede i campi di sempre)
function corpoLuna(origine, massaKg, aM, ghiaccio, composizione = { ghiaccio, roccia: 1 - ghiaccio }, evento = origine) {
  const densita = densitaCorpo(massaKg, ghiaccio);
  return Object.defineProperty({ id: 0, origine, massaKg, raggioM: Math.cbrt(massaKg / sfera(1) / densita), densita, aM, periodo: 0, eccentricita: 0, composizione }, 'evento', { value: evento, enumerable: false });
}
// una campana (media 0, scarto 1) dalle prime sei estrazioni di un evento
const campana = (serie) => { let u = 0; for (let i = 0; i < 6; i++) u += serie(i); return (u - 3) * Math.SQRT2; };

// ---------- tutte le lune di un pianeta
// P: un pianeta di sistema() (tipo, massaKg, raggioM, aM, Mstella; se ci sono: giorno, bloccato, clima,
// Lw, id). stella: { massa, massaNascita, eta (anni), morta, urto }. seme: il caso, ripetibile: la sorgente degli
// eventi delle lune di questo pianeta (in cosmo.js: «…/pianeta 2/lune», con i rami del cosmo), o un numero («lune numero/pianeta id»).
// GLI EVENTI, ognuno con il suo indirizzo sotto quello: «disco/massa», «disco/bordo interno», «disco/bordo esterno»,
// «disco/larghezza delle fasce», «disco/luna 2/fascia», «disco/luna 2/eccentricità»; «urto/sorte», «urto/massa»,
// «urto/eccentricità»; «catture/quante», «cattura 3/raggio», «cattura 3/distanza», «cattura 3/verso», «cattura 3/eccentricità»;
// e la forma di un corpo piccolo, «cattura 3/forma». Un ramo ne cambia uno, e ciò che ne discende; l'ordine non conta.
// Ogni luna porta in «evento» (non enumerabile) il nome sotto cui stanno i suoi: «disco/luna 2», «urto/luna», «cattura 3».
// urto (facoltativo): l'urto gigante vero del pianeta, dalla sua storia degli impatti (o null se non ne ha avuti):
// decide lui se c'è la luna da urto, quanto pesa e da quando le maree lavorano; la luna dice allora anche
// giornoPianeta, il giorno del pianeta oggi (secondi). Se «urto» non è dato, tutto è come prima (un sorteggio).
// Origini: 'disco' | 'urto' | 'cattura'. In uscita le lune dalla più vicina alla più lontana, ognuna
// { id, origine, massaKg, raggioM, densita, aM, periodo, eccentricita, composizione, forma: { rotonda,
// assi }, bloccata, caloreMareale, stato, retrograda, risonanza } (assi: in raggi medi della luna;
// risonanza: con quale vicina, o null; la luna da urto dice anche il giornoInizialePianeta, in secondi).
export function lune(P, stella = {}, seme = 1) {
  const c = typeof seme === 'function' ? seme : comeSorgente(seme, 'lune').sotto(`pianeta ${P.id ?? 0}`);
  // l'ambiente: fin dove comanda il pianeta, quanto è vecchio il sistema, e quanto scalda la stella lì
  // (170 K sulla «linea della neve», 2,7 UA·√L come in cosmo.js; la temperatura cala come 1/√distanza)
  const Lgiovane = stellaVera(stella.massaNascita || stella.massa || P.Mstella / MSOLE, { Z: stella.Z ?? 1 }).L;
  const amb = { RH: raggioHill(P), eta: (stella.eta ?? ETA) + (stella.morta ?? 0), Tstella: NEVE * Math.sqrt((2.7 * UA * Math.sqrt(Lgiovane)) / P.aM) };
  const grandi = P.tipo === 'roccioso' ? daUrto(P, amb, c, stella.urto) : regolari(P, amb, c);
  const tutte = [...grandi, ...catturati(P, amb, c, grandi)].sort((x, y) => x.aM - y.aM);
  tutte.forEach((L, i) => { L.id = i; });
  for (const L of tutte) {
    L.periodo = periodoOrbita(P, L.aM, L.massaKg);
    L.bloccata = tempoBlocco(P, L) < amb.eta * ANNO;
    L.forma = forma(P, L, L.bloccata, c);
    L.caloreMareale = caloreMareale(P, L, amb.eta);
    L.stato = stato(P, L, amb.eta);
    L.retrograda = !!L.retrograda;
    L.risonanza = L.legami?.length ? L.legami.map(([j, nome]) => `${nome} con la luna ${grandi[j].id}`).join(', ') : null;
    delete L.legami;
  }
  return tutte;
}
