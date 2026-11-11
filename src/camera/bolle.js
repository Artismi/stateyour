// bolle.js — PARTIRE DA UNA O PIÙ BOLLE: il primo pezzo calcolabile delle regole 5, 11 e 12 di INTRECCIO.md.
//
// Una bolla è un pezzo di mondo fissato (un luogo, una grandezza, un istante, un contenuto). Fissarla non crea
// niente: vuol dire mettersi tra gli universi che la contengono, e sceglierne uno in proporzione al suo peso.
// Qui ci sono due cose, che si provano da sole:
//
// A. IL CAMPO DEL COSMO CONDIZIONATO A PIÙ PUNTI (esatto). campoCondizionato(cosmo, vincoli).
//    LEGGE: un campo gaussiano condizionato a vincoli lineari è ancora gaussiano, e una sua realizzazione si ottiene
//    da una libera con una correzione lineare (Hoffman e Ribak 1991, ApJ 380, L5):
//        δ_c(x) = δ(x) + ξ_i(x)·C⁻¹_ij·(c_j − δ_j)
//    δ: il campo LIBERO dell'indirizzo; δ_j: quanto vale, lisciato alla scala R_j, nel punto del vincolo j; c_j: quanto
//    deve valere; ξ_i(x) = ⟨δ(x)·δ_i⟩ e C_ij = ⟨δ_i·δ_j⟩ dalla STESSA funzione di correlazione del campo (la somma
//    sulle sue onde, con lo spettro vero di cosmo3d.js: BBKS con il parametro di Sugiyama, normalizzato a σ₈). La
//    correzione è la più piccola che fa passare il campo per i vincoli, e si spegne lontano da loro come ξ.
//    IL PESO del mondo vincolato: χ² = cᵀC⁻¹c; la densità di probabilità di quei valori è ∝ e^(−χ²/2), e la
//    probabilità di un χ² così o più grande è quella della distribuzione χ² con tanti gradi quanti i vincoli.
//    (Roth, Pontzen e Peiris 2016: l'abbondanza relativa del campo vincolato dipende solo dai vincoli.)
//    È FUNZIONE PURA di (indirizzo, vincoli): i vincoli si mettono in un ordine canonico prima di ogni conto (stesso
//    risultato, bit per bit, in qualunque ordine si diano), e il campo si interroga punto per punto senza stato.
//    Per un cosmo della biblioteca il campo libero è quello di cosmo3d.js e i vincoli delle sue galassie (il campo
//    filtrato alle onde lunghe vale l'altezza del picco di ognuna) restano vincoli tra gli altri: con nessuna bolla
//    il risultato è il cosmo di sempre; con le bolle, le galassie restano dove e come sono.
//    Per un indirizzo qualunque («prova 7») il campo libero viene dalla fonte unica (eventi.js): l'ampiezza di
//    un'onda è un evento che dipende dal suo vettore d'onda e non dalla lista, così alzando kmax si aggiunge
//    dettaglio senza cambiare le onde lunghe (regola 4).
//    DICHIARATO: la finestra di lisciatura è gaussiana, W(k) = e^(−k²R²/2) (R = 0: il valore nel punto); due vincoli
//    sono «lo stesso» quando il secondo non aggiunge niente al primo oltre 10⁻¹² (RANGO): se chiedono valori diversi
//    sono incompatibili (lo si dice), se chiedono lo stesso valore uno è di troppo (lo si toglie e lo si dice).
//    COSTI: con n vincoli e N onde, n²·N somme per la matrice e n³/3 per risolverla. Con il campo di cosmo3d
//    (N = 28 888): 4 vincoli più le 77 galassie ~0,3 s; 1000 vincoli ~30 s. Per questo la prova dei mille usa un
//    campo più grosso (kmax = 10, 2 108 onde: ~3 s).
//    CHE COSA NON C'È: i vincoli sono sul contrasto di densità LINEARE (una massa d'alone, una galassia di un certo
//    tipo non sono lineari: lì si campiona, parte B); il campo del cosmo di cosmo3d.js non viene ancora dalla
//    fonte unica (è il generatore di mondo.js con un seme dell'indirizzo): cambiarlo sposterebbe assi e moti di
//    tutte le galassie, e non l'ho fatto qui.
//
// B. CHE COSA CHIEDE UNA BOLLA, E DOVE SI INCONTRANO (bolla, chiede, giudica, incontra, causaComune, inFondo).
//    Una bolla è { luogo (l'indirizzo di intreccio.js, anche solo l'inizio: «cosmo 1/galassia 0», o niente), grandezza
//    (m), istante (anni dall'inizio del cosmo; null = adesso), contenuto }. La sua RICHIESTA sale lungo l'indirizzo:
//    a ogni livello è un predicato calcolabile sullo stato di quel livello, con il suo perché e la legge da cui viene.
//    NESSUNA SOGLIA NUOVA: ogni giudizio è quello del modulo che già calcola quella cosa (una grandezza, una fonte):
//      acqua liquida, ghiaccio   leggi.js statoAcqua(T, p) sulle fasce di latitudine del clima del pianeta;
//      crosta di sale            dove il mare c'è: un lago chiuso o un mare quasi chiuso arrivato al salgemma (mare.js,
//                                sulla superficie vera: costa); dove l'acqua è evaporata: i sali che ha lasciato
//                                (chimica.js minerali);
//      minerale                  chimica.js minerali (composizione, temperatura, ossigeno, acqua di quel pianeta);
//      cratere                   impatti.js storiaImpatti e crateriVisibili (l'età massima e il diametro minimo li dà
//                                chi chiede: sono parte della domanda, non del mondo);
//      anello                    anelli.js (il pianeta ne ha uno oggi);
//      aurora                    risalita.js ventoStellare (il vento della stella sull'aria del pianeta, col suo campo);
//      carbonato che precipita   mare.js: l'acqua oltre la soglia a cui il calcare nasce da solo (sulla superficie vera).
//    Il giudizio ha TRE esiti: «sì» (con `parte`: la frazione del pianeta dove una bolla così cadrebbe bene), «no»
//    (con la legge che lo vieta), «forse» (le condizioni necessarie ci sono, ma decide il livello sotto: bisogna
//    scendere alla superficie, che costa ~11 s a pianeta: inFondo()).
//    incontra(bolle): trova l'antenato comune (il primo livello dell'indirizzo che le contiene tutte); le bolle messe
//    nello stesso punto intersecano i loro intervalli (e se l'intersezione è vuota lo dice, con la legge); poi cerca il
//    mondo: dove il luogo è dato, giudica lì (e può rispondere «non esiste»); dove è libero, campiona indirizzi della
//    biblioteca dentro l'antenato comune, in modo deterministico (gli eventi «bolle/<impronta delle bolle>»: la stessa
//    domanda dà sempre lo stesso mondo), e ne sceglie uno in proporzione al peso (il prodotto delle `parte`).
//    Dichiara quanti mondi ha provato, quanti andavano bene, il peso medio e il suo errore.
//    causaComune(bolle): il peso di «stanno nello stesso mondo» (la media su mondi del prodotto delle parti) contro
//    «ognuna nel suo» (il prodotto delle medie). Il primo è sempre almeno il secondo (i mondi non sono tutti uguali:
//    ⟨f²⟩ ≥ ⟨f⟩²), tanto di più quanto più il contenuto è raro e concentrato in pochi mondi: è la causa comune.
//    PARAMETRI DELLA DOMANDA (non del mondo, dichiarati): quanti mondi provare (300), in quanti cosmi cercare quando
//    il luogo è del tutto libero (2: ogni cosmo nuovo costa ~0,5 s), la probabilità a priori che due bolle di cui
//    non si sa niente stiano nello stesso pianeta (½ in causaComune: «non lo so»).
//    SEMPLIFICAZIONI E CIÒ CHE NON TORNA:
//    · lo stato di un pianeta è quello di ADESSO: una bolla con un altro istante è giudicata sullo stato di oggi (e lo
//      dice), tranne «la stella non era ancora nata», che vale «no»;
//    · «parte» è una frazione d'area del pianeta (per i minerali: di massa della roccia), non la probabilità che una
//      bolla di QUELLA grandezza contenga la cosa; la grandezza serve solo a dire che la bolla sta nel pianeta;
//    · le fasce del clima del pianeta (leggi.js) e il clima fine della superficie (geologia.js) non danno le stesse
//      temperature punto per punto (incoerenza nota, test_coerenza): un «sì» a livello di pianeta è il «sì» di ciò che
//      il pianeta sa; la superficie può spostare il confine del ghiaccio;
//    · chimica.js conosce i minerali di un elenco: un minerale fuori elenco riceve «no» ovunque (regola 2: elenco, non
//      ancora regole chiuse); le rocce (granito, basalto) non hanno ancora un giudizio a livello di pianeta;
//    · un cratere «c'è» a livello di pianeta se impatti.js lo dà e niente può averlo cancellato (crosta ferma, niente
//      vulcani, niente liquido che scorra); altrimenti è «forse»: l'erosione e il rinnovo li sa la superficie;
//    · le contraddizioni riconosciute sono quelle sugli intervalli nello stesso punto (acqua liquida e ghiaccio), sul
//      tempo (prima della stella) e sulla taglia (una bolla più grande del pianeta): non ancora quelle di distanza
//      («una stella a un metro da un fiocco di neve») né quelle causali tra istanti diversi.

import { sorgente, campana } from './eventi.js';
import { ondeDelToro } from './cosmo3d.js';
import { TORO_M, STELLE, cosmo as cosmoDi, sistema, numeroDi } from './cosmo.js';
import { campoCosmo, ANNI_OGGI } from './spazio3d.js';
import { indirizzo, scrivi } from './intreccio.js';
import { statoAcqua, ebollizione, ACQUA } from './leggi.js';
import { minerali } from './chimica.js';
import { ventoStellare } from './risalita.js';
import { luogoDaAria } from './materia.js';
import { crateriVisibili } from './impatti.js';

const PI2 = 2 * Math.PI;
// due vincoli sono lo stesso vincolo quando la parte nuova del secondo è sotto questa frazione della sua varianza
export const RANGO = 1e-12;

// ---------- piccola statistica: la coda della distribuzione χ² (funzione gamma incompleta: serie e frazione continua)
function lnGamma(x) { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of g) s += c / ++y; return -t + Math.log((2.5066282746310005 * s) / x); }
// Q(a, x) = Γ(a, x)/Γ(a): la probabilità che un χ² con 2a gradi superi 2x
export function codaGamma(a, x) {
  if (!(x > 0)) return 1; if (!(a > 0)) return 0;
  if (x < a + 1) { let ap = a, d = 1 / a, s = d; for (let n = 0; n < 500; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-15) break; } return 1 - s * Math.exp(-x + a * Math.log(x) - lnGamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const q = d * c; h *= q; if (Math.abs(q - 1) < 1e-15) break; }
  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}
export const probabilitaChi2 = (chi2, gradi) => (gradi > 0 ? codaGamma(gradi / 2, chi2 / 2) : 1);

// =====================================================================================================
// A. IL CAMPO
// =====================================================================================================
const liste = new Map();
const onde = (toroM, kmax) => { const k = `${toroM}|${kmax}`; if (!liste.has(k)) { if (liste.size > 6) liste.delete(liste.keys().next().value); liste.set(k, ondeDelToro(toroM, kmax)); } return liste.get(k); };
// il numero d'ordine di un'onda: dal suo vettore (kx, ky, kz), non dal posto nella lista (fino a 512 giri per lato)
const numeroOnda = (x, y, z) => (z * 1025 + (y + 512)) * 1025 + (x + 512);

// IL CAMPO LIBERO DI UN INDIRIZZO qualunque: ogni onda ha due ampiezze a campana, quattro estrazioni dell'evento
// «radice/campo libero» numerate dal vettore d'onda. → { radice, toroM, kmax, N, KX, KY, KZ, PK, A, B, fissi: [] }
export function campoLibero(radice, { toroM = TORO_M, kmax = 24, rami = null } = {}) {
  if (!(kmax >= 1 && kmax <= 512)) throw new Error(`kmax deve stare tra 1 e 512 (${kmax})`);
  const O = onde(toroM, kmax), s = sorgente(String(radice), rami).serie('campo libero'), A = new Float64Array(O.N), B = new Float64Array(O.N);
  for (let m = 0; m < O.N; m++) { const k = 4 * numeroOnda(O.KX[m], O.KY[m], O.KZ[m]), a = Math.sqrt(O.PK[m] / 2); A[m] = a * campana(s(k), s(k + 1)); B[m] = a * campana(s(k + 2), s(k + 3)); }
  return { radice: String(radice), toroM, kmax, N: O.N, KX: O.KX, KY: O.KY, KZ: O.KZ, PK: O.PK, A, B, fissi: [] };
}
// il campo libero e i vincoli già presi di un cosmo della biblioteca (cosmo3d.js): le sue galassie
function campoDelCosmo(n, { galassie = true } = {}) {
  const F = campoCosmo(n), o = F.onde;
  const fissi = galassie ? F.pos.map((x, i) => ({ nome: `galassia ${i}`, x, taglio: F.vincoli.taglio, valore: F.vincoli.valori[i] })) : [];
  return { radice: `cosmo ${n}`, toroM: F.toroM, kmax: o.kmax, N: o.n, KX: o.kx, KY: o.ky, KZ: o.kz, PK: o.potenza, A: F.libere.A, B: F.libere.B, fissi };
}
const eUnCosmo = (c) => typeof c === 'number' || /^\d+(#.*)?$/.test(String(c));
const frazione = (v) => v - Math.floor(v);

// IL CAMPO CONDIZIONATO.
//   cosmo    un numero di cosmo («3», o con i suoi rami come lo scrive cosmo.js), oppure un indirizzo qualunque
//            (una stringa: il campo libero viene da eventi.js), oppure un campo già fatto con campoLibero()
//   vincoli  [{ posizione: [x, y, z] in metri sul toro (comoventi, oggi), scala: R in metri (0 = nel punto),
//               valore: il contrasto lisciato che il campo deve avere lì }, …] in numero qualsiasi
//   opz      { toroM, kmax } per un indirizzo qualunque; { galassie: false } per un cosmo senza i vincoli delle galassie
// → se i vincoli si contraddicono: { esiste: false, perche, incompatibili: [i, j] (posti nella lista data) }
// → altrimenti { esiste: true, toroM, sigma (lo scarto del campo), vincoli (in ordine canonico, ognuno con `libero`:
//     quanto valeva lì il campo libero, e `dato`: il suo posto nella lista data), ridondanti, gradi, chi2, probabilita,
//     logPeso (−χ²/2), logDensita, chi2Libero, deltaChi2 (quanto costa rispetto al mondo di partenza),
//     in(p) il campo nel punto p (metri), lisciato(p, R), libero(p) il campo libero, correzione(p),
//     attesa(p, R) → { media, varianza } che la teoria dà per il campo vincolato in p, onde: { A, B, … } }
//   (con le galassie, χ² e gradi sono quelli delle bolle DATE le galassie: il pezzo in più che le bolle costano)
export function campoCondizionato(cosmo, vincoli = [], opz = {}) {
  const base = cosmo && cosmo.A && cosmo.PK ? cosmo : eUnCosmo(cosmo) ? campoDelCosmo(typeof cosmo === 'number' ? cosmo : String(cosmo), opz) : campoLibero(cosmo, opz);
  const { toroM, N, KX, KY, KZ, PK, A: A0, B: B0, kmax } = base, K2 = kmax * kmax, giri = PI2 / toroM;
  // ---- i vincoli in ordine canonico (così l'ordine in cui arrivano non conta)
  const dati = vincoli.map((v, i) => {
    const p = v.posizione, R = v.scala ?? 0;
    if (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite) || !(R >= 0) || !Number.isFinite(v.valore)) throw new Error(`vincolo ${i}: servono posizione [x, y, z] in metri, scala ≥ 0 e valore`);
    return { dato: i, posizione: [...p], scala: R, valore: v.valore, x: p.map((q) => frazione(q / toroM)) };
  }).sort((a, b) => a.x[0] - b.x[0] || a.x[1] - b.x[1] || a.x[2] - b.x[2] || a.scala - b.scala || a.valore - b.valore || a.dato - b.dato);
  const tutti = [...base.fissi, ...dati], n = tutti.length, nf = base.fissi.length;
  // la finestra di ogni vincolo, per ogni |k|² intero: gaussiana per le bolle, taglio netto per le galassie
  const finestra = (v) => { const W = new Float64Array(K2 + 1); if (v.taglio != null) { for (let k2 = 0; k2 <= K2; k2++) W[k2] = k2 <= v.taglio * v.taglio ? 1 : 0; } else { const q = 0.5 * (giri * v.scala) ** 2; for (let k2 = 0; k2 <= K2; k2++) W[k2] = Math.exp(-q * k2); } return W; };
  const Wt = tutti.map(finestra);
  let s2 = 0; for (let m = 0; m < N; m++) s2 += 2 * PK[m];
  // ---- primo giro sulle onde: la matrice C_ij = ⟨δ_i δ_j⟩ e il campo libero nei vincoli
  const C = new Float64Array(n * n), d0 = new Float64Array(n), co = new Float64Array(n), si = new Float64Array(n);
  const X = new Float64Array(n), Y = new Float64Array(n), Z = new Float64Array(n); for (let j = 0; j < n; j++) { X[j] = PI2 * tutti[j].x[0]; Y[j] = PI2 * tutti[j].x[1]; Z[j] = PI2 * tutti[j].x[2]; }
  for (let m = 0; m < N; m++) {
    const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz, r = Math.sqrt(2 * PK[m]), a = (2 * A0[m]) / r, b = (2 * B0[m]) / r;
    for (let j = 0; j < n; j++) { const w = Wt[j][k2] * r; if (w === 0) { co[j] = 0; si[j] = 0; continue; } const t = kx * X[j] + ky * Y[j] + kz * Z[j]; co[j] = w * Math.cos(t); si[j] = w * Math.sin(t); d0[j] += a * co[j] - b * si[j]; }
    for (let i = 0; i < n; i++) { const ci = co[i], sn = si[i]; if (ci === 0 && sn === 0) continue; const riga = i * n; for (let j = i; j < n; j++) C[riga + j] += ci * co[j] + sn * si[j]; }
  }
  // ---- Cholesky C = L·Lᵀ nell'ordine canonico (L nel triangolo basso), e insieme L⁻¹ applicato a c, a d0 e a c − d0
  const diag = new Float64Array(n), yc = new Float64Array(n), y0 = new Float64Array(n), vivo = new Uint8Array(n), ridondanti = [];
  for (let j = 0; j < n; j++) {
    const rj = j * n; let s = C[rj + j], ac = tutti[j].valore, a0 = d0[j]; diag[j] = s;
    for (let k = 0; k < j; k++) if (vivo[k]) { const l = C[rj + k]; s -= l * l; ac -= l * yc[k]; a0 -= l * y0[k]; }
    if (!(s > RANGO * diag[j])) { // non aggiunge niente a quelli di prima: o dice la stessa cosa, o li contraddice
      const scala = Math.sqrt(Math.max(diag[j], 1e-300));
      if (Math.abs(ac) > 1e-7 * (Math.abs(tutti[j].valore) + scala)) {
        let con = -1, meglio = 0; for (let k = 0; k < j; k++) { const r = Math.abs(C[k * n + j]) / Math.sqrt(diag[k] * diag[j] || 1); if (r > meglio) { meglio = r; con = k; } } // (C[k][j] con k < j è ancora la correlazione vera: il triangolo alto non si tocca)
        const nome = (q) => (q < nf ? `la ${tutti[q].nome}` : `il vincolo ${tutti[q].dato}`), altro = con >= 0 && meglio > 1 - 1e-9 ? con : -1;
        return { esiste: false, incompatibili: [altro >= nf ? tutti[altro].dato : altro, tutti[j].dato], perche: altro >= 0 ? `${nome(j)} e ${nome(altro)} chiedono allo stesso punto, alla stessa scala, due valori diversi (${tutti[j].valore} e ${tutti[altro].valore}): un campo ha un valore solo in ogni punto` : `${nome(j)} è già deciso dai vincoli che lo precedono (ne è una combinazione), ma chiede un valore diverso di ${ac.toExponential(2)}` };
      }
      ridondanti.push(j < nf ? tutti[j].nome : tutti[j].dato); continue;
    }
    const l = Math.sqrt(s); vivo[j] = 1; C[rj + j] = l; yc[j] = ac / l; y0[j] = a0 / l;
    for (let i = j + 1; i < n; i++) { const ri = i * n; let t = C[rj + i]; for (let k = 0; k < j; k++) if (vivo[k]) t -= C[ri + k] * C[rj + k]; C[ri + j] = t / l; }
  }
  // (sopra: C[rj + i] con i > j è l'elemento originale del triangolo alto; il triangolo basso tiene L)
  // ---- i pesi w = C⁻¹(c − d0): Lᵀ·w = L⁻¹(c − d0)
  const w = new Float64Array(n);
  for (let j = n - 1; j >= 0; j--) { if (!vivo[j]) continue; let t = yc[j] - y0[j]; for (let i = j + 1; i < n; i++) if (vivo[i]) t -= C[i * n + j] * w[i]; w[j] = t / C[j * n + j]; }
  let chi2 = 0, chi2Libero = 0, gradi = 0, logDet = 0; for (let j = nf; j < n; j++) if (vivo[j]) { chi2 += yc[j] * yc[j]; chi2Libero += y0[j] * y0[j]; gradi++; logDet += Math.log(C[j * n + j]); }
  // ---- secondo giro: le ampiezze corrette (la correzione di Hoffman e Ribak, onda per onda)
  const A = Float64Array.from(A0), B = Float64Array.from(B0);
  if (n) for (let m = 0; m < N; m++) {
    const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz; let a = 0, b = 0;
    for (let j = 0; j < n; j++) { const q = w[j] * Wt[j][k2]; if (q === 0) continue; const t = kx * X[j] + ky * Y[j] + kz * Z[j]; a += q * Math.cos(t); b -= q * Math.sin(t); }
    A[m] += PK[m] * a; B[m] += PK[m] * b;
  }
  // ---- il campo in un punto: funzione pura (nessuno stato: l'ordine delle domande non conta)
  const valuta = (AA, BB, p, R = 0) => { const x = PI2 * frazione(p[0] / toroM), y = PI2 * frazione(p[1] / toroM), z = PI2 * frazione(p[2] / toroM), q = 0.5 * (giri * R) ** 2; let d = 0;
    for (let m = 0; m < N; m++) { const kx = KX[m], ky = KY[m], kz = KZ[m], t = kx * x + ky * y + kz * z, f = q ? Math.exp(-q * (kx * kx + ky * ky + kz * kz)) : 1; d += f * (AA[m] * Math.cos(t) - BB[m] * Math.sin(t)); }
    return 2 * d; };
  // ciò che la teoria dice del campo vincolato in un punto: media ξᵀC⁻¹c, varianza σ² − ξᵀC⁻¹ξ
  const attesa = (p, R = 0) => { const x = PI2 * frazione(p[0] / toroM), y = PI2 * frazione(p[1] / toroM), z = PI2 * frazione(p[2] / toroM), q = 0.5 * (giri * R) ** 2, xi = new Float64Array(n); let var0 = 0;
    for (let m = 0; m < N; m++) { const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz, f = 2 * PK[m] * (q ? Math.exp(-q * k2) : 1), t0 = kx * x + ky * y + kz * z; var0 += f * (q ? Math.exp(-q * k2) : 1); for (let j = 0; j < n; j++) { const wj = Wt[j][k2]; if (wj) xi[j] += f * wj * Math.cos(t0 - (kx * X[j] + ky * Y[j] + kz * Z[j])); } }
    let media = 0, tolta = 0; for (let j = 0; j < n; j++) { if (!vivo[j]) continue; let t = xi[j]; for (let k = 0; k < j; k++) if (vivo[k]) t -= C[j * n + k] * xi[k]; xi[j] = t / C[j * n + j]; media += xi[j] * yc[j]; tolta += xi[j] * xi[j]; }
    return { media, varianza: Math.max(0, var0 - tolta), libera: var0 }; };
  return { esiste: true, radice: base.radice, toroM, kmax, sigma: Math.sqrt(s2),
    vincoli: dati.map((v, i) => ({ dato: v.dato, posizione: v.posizione, scala: v.scala, valore: v.valore, libero: d0[nf + i] })), fissi: nf, ridondanti,
    gradi, chi2, probabilita: probabilitaChi2(chi2, gradi), logPeso: -chi2 / 2, logDensita: -chi2 / 2 - logDet - (gradi / 2) * Math.log(PI2), chi2Libero, deltaChi2: chi2 - chi2Libero,
    in: (p) => valuta(A, B, p), lisciato: (p, R) => valuta(A, B, p, R), libero: (p, R = 0) => valuta(A0, B0, p, R), correzione: (p) => valuta(A, B, p) - valuta(A0, B0, p), attesa,
    onde: { n: N, kx: KX, ky: KY, kz: KZ, A, B, potenza: PK, kmax } };
}

// =====================================================================================================
// B. LE BOLLE
// =====================================================================================================
export const LIVELLI = ['cosmo', 'galassia', 'stella', 'pianeta', 'punto'];
const si = (parte, perche, misura = null) => ({ esito: 'sì', parte, perche, misura });
const no = (perche, legge = null) => ({ esito: 'no', parte: 0, perche, legge });
const forse = (perche, misura = null) => ({ esito: 'forse', parte: null, perche, misura });
const cifre = (x, n = 3) => (!Number.isFinite(x) ? String(x) : x !== 0 && (Math.abs(x) >= 1e6 || Math.abs(x) < 1e-3) ? x.toExponential(n - 1).replace('.', ',').replace('e+', 'e') : Number(x.toPrecision(n)).toString().replace('.', ','));
const RAD = Math.PI / 180;

// ---------- ciò che un pianeta sa (lo stato del livello «pianeta»), e ciò che ne passa a un suo punto (regola 4)
// (un sistema costa ~35 ms e cosmo.js ne tiene 64: chi cerca tra centinaia di mondi li rifarebbe a ogni domanda. Qui se
// ne tengono fino a 320, quanti una ricerca ne prova; dimentica() li lascia andare)
const visti = new Map();
export const dimentica = () => { visti.clear(); elenchi.clear(); };
const mondo = (d) => { const k = `${d.cosmo}|${d.galassia}|${d.stella}|${d.pianeta}`; if (visti.has(k)) return visti.get(k);
  const Sis = sistema(d.cosmo, d.galassia, d.stella), P = Sis.pianeti[d.pianeta], M = P ? { P, S: Sis.stella, via: { cosmo: d.cosmo, galassia: d.galassia, stella: d.stella, pianeta: d.pianeta } } : null;
  if (visti.size >= 320) visti.delete(visti.keys().next().value); visti.set(k, M); return M; };
// le fasce di latitudine del clima (leggi.js): [{ lat, T, peso (la parte d'area) }]
function fasce(P) { const f = P.clima?.fasce; if (!f?.lat?.length) return [{ lat: 0, T: P.clima?.T ?? 3, peso: 1 }]; let w = 0; const o = f.lat.map((lat, j) => { const c = Math.cos(lat * RAD); w += c; return { lat, T: f.T[j], peso: c }; }); for (const b of o) b.peso /= w; return o; }
// la temperatura media a una latitudine: interpolata tra i centri delle fasce
function condizioni(M, lat) { const F = fasce(M.P); let T = F[0].T; if (F.length > 1) { if (lat >= F[0].lat) T = F[0].T; else if (lat <= F[F.length - 1].lat) T = F[F.length - 1].T; else for (let j = 0; j + 1 < F.length; j++) if (lat <= F[j].lat && lat >= F[j + 1].lat) { const u = (F[j].lat - lat) / (F[j].lat - F[j + 1].lat); T = F[j].T + u * (F[j + 1].T - F[j].T); break; } } return { T, pressione: M.P.clima?.pressione ?? 0, acqua: M.P.clima?.acqua ?? 'assente' }; }
const haSuperficie = (P) => (P.tipo === 'gassoso' ? no('un gigante gassoso non ha una superficie su cui la cosa possa stare (leggi.js clima: la sua acqua è nelle nuvole)', 'leggi.js clima') : null);
// l'acqua in superficie, fascia per fascia: quale parte del pianeta è in quello stato (leggi.js statoAcqua)
function acquaInStato(M, stato) {
  const P = M.P, cl = P.clima, senza = haSuperficie(P); if (senza) return senza;
  if (!cl || cl.acqua === 'assente') return no('il pianeta non ha acqua in superficie (leggi.js acquaInSuperficie)', 'leggi.js acquaInSuperficie');
  if (String(cl.acqua).startsWith('vapore')) return no(`lì l'acqua è ${cl.acqua}: non resta in superficie (leggi.js clima e statoAcqua)`, 'leggi.js statoAcqua');
  const F = fasce(P), buone = F.filter((b) => statoAcqua(b.T, cl.pressione) === stato), area = buone.reduce((a, b) => a + b.peso, 0), Tmax = Math.max(...F.map((b) => b.T)), Tmin = Math.min(...F.map((b) => b.T));
  if (!(area > 0)) return no(stato === 'liquida' ? `nessuna fascia sta tra 273,15 K e i ${cifre(ebollizione(cl.pressione), 4)} K a cui l'acqua bolle a ${cifre(cl.pressione)} Pa (la più calda è a ${cifre(Tmax, 4)} K): leggi.js statoAcqua` : `nessuna fascia è sotto 273,15 K (la più fredda è a ${cifre(Tmin, 4)} K): leggi.js statoAcqua`, 'leggi.js statoAcqua');
  // il mare copre la parte `mare` del pianeta (leggi.js mareAtteso); il ghiaccio sta su mare e terra
  const parte = stato === 'liquida' ? area * (cl.mare ?? 0) : area;
  if (!(parte > 0)) return no('le fasce abbastanza calde ci sono, ma il pianeta non ha un mare (leggi.js mareAtteso)', 'leggi.js mareAtteso');
  return si(parte, `${buone.length} fasce di latitudine su ${F.length} hanno l'acqua ${stato === 'liquida' ? 'liquida' : 'gelata'} (leggi.js statoAcqua, a ${cifre(cl.pressione)} Pa)${stato === 'liquida' ? `, e il mare copre ${cifre(100 * (cl.mare ?? 0))}% del pianeta` : ''}`, { fasce: buone.map((b) => b.lat), ghiaccioDelClima: cl.ghiaccio ?? null });
}
// i minerali della superficie, chiesti a chimica.js come li chiede cosmo.js (una fonte)
const mineraliDi = (M) => minerali({ composizione: M.P.composizione, T: M.P.clima?.T ?? 288, ossidato: M.P.atmosfera ? !M.P.atmosfera.riducente : false, acqua: M.P.clima?.acqua === 'liquida' });
const mareNecessario = (M) => { const a = acquaInStato(M, 'liquida'); return a.esito === 'sì' ? null : no(`niente mare liquido: ${a.perche}`, a.legge); };

// ---------- I CONTENUTI che i moduli sanno giudicare. Per ognuno:
//   perche     che cosa chiede a chi sta sopra, in chiaro
//   nelPunto   (se la cosa dipende dalle condizioni del punto) → gli intervalli che chiede a temperatura e pressione
//   pianeta    il giudizio sullo stato del pianeta → sì / no / forse
//   superficie (se serve scendere) il giudizio sulla superficie vera { mare, cl, se, P }
export const CONTENUTI = {
  'acqua liquida': {
    perche: 'chiede una temperatura tra il gelo e l\'ebollizione a quella pressione, una pressione sopra il punto triplo, e che in superficie ci sia acqua',
    legge: 'leggi.js statoAcqua (il gelo a 273,15 K, l\'ebollizione dalla pressione, il punto triplo a 611 Pa)',
    nelPunto: (c) => ({ T: [273.15, ebollizione(Math.max(c.pressione, 1e-300))], pressione: [ACQUA.tripla, Infinity] }),
    pianeta: (M) => acquaInStato(M, 'liquida'),
  },
  ghiaccio: {
    perche: 'chiede una temperatura sotto il gelo e che in superficie ci sia acqua',
    legge: 'leggi.js statoAcqua (sotto 273,15 K; sotto il punto triplo, sotto 200 K)',
    nelPunto: (c) => ({ T: [0, c.pressione < ACQUA.tripla ? 200 : 273.15] }),
    pianeta: (M) => acquaInStato(M, 'ghiaccio'),
  },
  'crosta di sale': {
    perche: 'chiede un bacino chiuso dove l\'acqua esce solo evaporando, fino al salgemma; oppure un pianeta la cui acqua è evaporata lasciando i suoi sali',
    legge: 'mare.js (i laghi chiusi e i mari quasi chiusi: evapora() fino al salgemma) e chimica.js minerali (i sali di un\'acqua evaporata)',
    pianeta: (M) => { const senza = haSuperficie(M.P); if (senza) return senza;
      const sale = mineraliDi(M).find((m) => m.nome === 'salgemma'); if (sale) return si(sale.frazione, `l'acqua di questo pianeta è evaporata e ha lasciato i suoi sali: il salgemma è ${cifre(100 * sale.frazione)}% della superficie (chimica.js minerali)`, { origine: 'acqua evaporata' });
      const manca = mareNecessario(M); if (manca) return no(`né un mare che possa evaporare né i sali di un'acqua evaporata. ${manca.perche}`, 'mare.js / chimica.js minerali');
      return forse('il mare c\'è: se una conca chiusa è arrivata al sale lo decide la forma dei bacini e quanto evapora (mare.js, sulla superficie vera)'); },
    superficie: (U) => { const m = U.mare; if (!m || !m.esiste) return no(`mare.js: ${m?.motivo ?? 'il mare non c\'è'}`, 'mare.js');
      const laghi = (m.laghi || []).filter((l) => l.precipitati && l.precipitati.salgemma > 0), bacini = (m.bacini || []).filter((b) => b.saturo), area = [...laghi, ...bacini].reduce((a, x) => a + (x.areaM2 || 0), 0), parte = area / (4 * Math.PI * U.P.raggioM ** 2);
      if (!laghi.length && !bacini.length) return no(`mare.js: nessuna conca chiusa è arrivata al salgemma (${(m.laghi || []).filter((l) => l.tipo !== 'aperto').length} laghi chiusi, ${(m.bacini || []).length} mari quasi chiusi)`, 'mare.js evapora');
      const d = laghi[0] || bacini[0]; return si(parte, `mare.js: ${laghi.length} laghi chiusi e ${bacini.length} mari quasi chiusi sono saturi di salgemma`, { dove: { lon: d.lon, lat: d.lat }, laghi: laghi.length, bacini: bacini.length }); },
  },
  minerale: {
    perche: 'chiede una roccia la cui composizione, alla temperatura e con l\'ossigeno e l\'acqua di quel pianeta, dia quel minerale',
    legge: 'chimica.js minerali (la norma della roccia: dal mantello fuso, dal grado di ossidazione, dallo stato dell\'acqua)',
    pianeta: (M, c) => { const senza = haSuperficie(M.P); if (senza) return senza; const L = mineraliDi(M), m = L.find((x) => x.nome === c.nome);
      return m ? si(m.frazione, `chimica.js minerali: ${c.nome} è ${cifre(100 * m.frazione)}% della roccia di superficie`) : no(`chimica.js minerali non dà ${c.nome} con questa composizione, a ${cifre(M.P.clima?.T ?? 0, 4)} K, con l'acqua ${M.P.clima?.acqua}: dà ${L.map((x) => x.nome).join(', ')}`, 'chimica.js minerali'); },
  },
  cratere: {
    perche: 'chiede un urto abbastanza grande, abbastanza di recente, e una superficie che non lo abbia cancellato',
    legge: 'impatti.js storiaImpatti e crateriVisibili',
    pianeta: (M, c) => { const senza = haSuperficie(M.P); if (senza) return senza; let storia; try { storia = M.P.impatti; } catch { storia = null; } if (!storia) return no('impatti.js non ha una storia di urti per questo pianeta', 'impatti.js');
      const Dmin = c.diametroM ?? 0, entro = c.entroAnni ?? Infinity, vivi = crateriVisibili(storia, { minimoM: Dmin }).filter((k) => k.eta <= entro);
      if (!vivi.length) return no(`impatti.js: nessun cratere di almeno ${cifre(Dmin / 1e3)} km negli ultimi ${cifre(entro)} anni`, 'impatti.js storiaImpatti');
      const area = vivi.reduce((a, k) => a + Math.PI * (k.diametroM / 2) ** 2, 0) / (4 * Math.PI * M.P.raggioM ** 2), ultimo = vivi[vivi.length - 1], misura = { quanti: vivi.length, dove: { lon: ultimo.lon, lat: ultimo.lat }, eta: ultimo.eta, diametroM: ultimo.diametroM };
      const ferma = M.P.interno?.tettonica === 'ferma' && !(M.P.interno?.vulcani > 0), asciutto = !((M.P.clima?.pressione ?? 0) >= ACQUA.tripla);
      return ferma && asciutto ? si(Math.min(1, area), `impatti.js: ${vivi.length} crateri così, e niente li cancella (crosta ferma, niente vulcani, sotto il punto triplo niente scorre)`, misura) : forse(`impatti.js dà ${vivi.length} crateri così; ma ${ferma ? '' : 'la crosta si rinnova e '}${asciutto ? '' : 'pioggia e fiumi erodono: '}se si vedono ancora lo sa la superficie`, misura); },
  },
  anello: {
    perche: 'chiede materia dentro il limite di Roche arrivata abbastanza di recente, o abbastanza tanta, da non essere ancora piovuta sul pianeta',
    legge: 'anelli.js (storia della materia dentro il limite di Roche)',
    pianeta: (M) => (M.P.anello ? si(1, `anelli.js: un anello di ${cifre(M.P.anello.massaKg)} kg${M.P.anello.origine ? ` (${M.P.anello.origine})` : ''}`) : no('anelli.js: oggi questo pianeta non ha un anello (niente materia dentro il limite di Roche, o è già piovuta)', 'anelli.js')),
  },
  aurora: {
    perche: 'chiede una stella viva che soffi un vento, e un\'aria che il vento possa accendere (col campo: sugli ovali attorno ai poli; senza: su tutta la faccia al vento)',
    legge: 'risalita.js ventoStellare (1% della potenza del vento sulla magnetosfera)',
    pianeta: (M) => { const S = M.S, viva = S.stato === 'in vita' || S.stato === 'gigante rossa'; if (!viva) return no(`la stella è ${S.stato}: non soffia più un vento (risalita.js ventoStellare)`, 'risalita.js ventoStellare');
      let v = null; try { v = ventoStellare(luogoDaAria({ P: M.P }), { P: M.P, stella: { T: S.T > 0 ? S.T : undefined, eta: S.eta, massa: S.massa } }); } catch { v = null; }
      if (!v || !(v.aurora.potenza > 0)) return no('risalita.js ventoStellare: il vento non trova un\'aria da accendere', 'risalita.js ventoStellare');
      return si(Math.min(1, v.aurora.perM2 / v.aurora.sugliOvali), `risalita.js: ${cifre(v.aurora.potenza)} W di aurore${v.scoperto ? ', senza un campo che fermi il vento: su tutta la faccia che gli sta davanti' : `, sugli ovali a ${cifre(v.aurora.colatitudine)}° dai poli`}`, { potenza: v.aurora.potenza, colatitudine: v.aurora.colatitudine }); },
  },
  carbonato: {
    perche: 'chiede un\'acqua dove il prodotto di calcio e carbonato supera la soglia a cui il calcare nasce da solo',
    legge: 'mare.js (saturazione della calcite contro la soglia misurata, Morse e He 1993)',
    pianeta: (M) => { const senza = haSuperficie(M.P); if (senza) return senza; const manca = mareNecessario(M); return manca ? no(`il calcare precipita da un'acqua: ${manca.perche}`, 'mare.js') : forse('il mare c\'è: se da qualche parte supera la soglia del calcare lo dicono i suoi sali, la sua temperatura e la CO₂ (mare.js, sulla superficie vera)'); },
    superficie: (U) => { const m = U.mare; if (!m || !m.esiste) return no(`mare.js: ${m?.motivo ?? 'il mare non c\'è'}`, 'mare.js');
      const om = m.saturazione?.calcite, soglia = m.soglia; let oltre = 0, bagnate = 0, dove = null; if (om) for (let k = 0; k < om.length; k++) { if (!(m.bagnato?.[k] > 0)) continue; bagnate++; if (om[k] > soglia) { oltre++; dove ??= { lon: (((k % m.W) + 0.5) / m.W) * 360 - 180, lat: 90 - ((Math.floor(k / m.W) + 0.5) / m.H) * 180 }; } }
      const laghi = (m.laghi || []).filter((l) => l.precipitati && l.precipitati.calcite > 0);
      if (!oltre && !laghi.length) return no(`mare.js: in nessun punto del mare la calcite supera la soglia ${cifre(soglia)}, e nessun lago la deposita`, 'mare.js');
      return si(bagnate ? (oltre / bagnate) * (m.frazioneMare ?? 1) : 0, `mare.js: ${oltre} celle di mare su ${bagnate} oltre la soglia del calcare, ${laghi.length} laghi che lo depositano`, { dove: dove || { lon: laghi[0].lon, lat: laghi[0].lat } }); },
  },
};

// ---------- LA BOLLA
// luogo: 'cosmo 1/galassia 0/stella 21/pianeta 0/punto 12.5,-30' (longitudine, latitudine in gradi) o un suo inizio, o
// niente (libero); anche come lista di nomi o come indirizzo di intreccio.js. contenuto: 'anello' oppure { cosa, … }.
export function bolla(b) {
  if (b && b.dove && b.contenuto && Object.isFrozen(b)) return b;
  const { luogo = [], grandezza = 1, istante = null, contenuto } = b || {};
  const percorso = typeof luogo === 'string' ? (luogo ? luogo.split('/') : []) : Array.isArray(luogo) ? luogo.map(String) : luogo?.percorso ? [...luogo.percorso] : [];
  const dove = {};
  percorso.forEach((nome, i) => { const m = /^(\S+) (.+)$/.exec(nome); if (!m || m[1] !== LIVELLI[i]) throw new Error(`il luogo di una bolla scende per ${LIVELLI.join(', ')}: al posto ${i} c'è «${nome}»`);
    dove[m[1]] = i === 4 ? m[2].split(',').map(Number) : /^\d+$/.test(m[2]) ? Number(m[2]) : m[2]; });
  const c = typeof contenuto === 'string' ? { cosa: contenuto } : { ...(contenuto || {}) };
  if (!CONTENUTI[c.cosa]) throw new Error(`non so giudicare «${c.cosa}»: i contenuti che i moduli sanno riconoscere sono ${Object.keys(CONTENUTI).join(', ')}`);
  if (!(grandezza > 0)) throw new Error('la grandezza di una bolla è una lunghezza in metri');
  return Object.freeze({ luogo: indirizzo(percorso, { tempo: istante }), dove: Object.freeze(dove), grandezza, istante, contenuto: Object.freeze(c) });
}
const livelloDi = (dove) => LIVELLI.filter((l) => dove[l] != null).length;
const percorsoDi = (dove) => LIVELLI.filter((l) => dove[l] != null).map((l) => `${l} ${l === 'punto' ? dove[l].join(',') : dove[l]}`);
const canonico = (b) => JSON.stringify([scrivi(b.luogo), b.grandezza, b.istante, Object.keys(b.contenuto).sort().map((k) => [k, b.contenuto[k]])]);

// CHE COSA CHIEDE una bolla a chi le sta sopra, livello per livello (dal punto in su)
export function chiede(b0) {
  const b = bolla(b0), C = CONTENUTI[b.contenuto.cosa], out = [];
  if (C.nelPunto) out.push({ livello: 'punto', perche: C.perche, legge: C.legge, intervalli: C.nelPunto });
  if (C.superficie) out.push({ livello: 'superficie', perche: C.perche, legge: C.legge, giudica: (U) => C.superficie(U, b.contenuto) });
  out.push({ livello: 'pianeta', perche: C.perche, legge: C.legge, giudica: (M) => C.pianeta(M, b.contenuto) });
  out.push({ livello: 'stella', perche: 'chiede che la sua stella sia già nata a quell\'istante (regola 6: le cause stanno prima)', legge: 'stelle.js (l\'età della stella)', giudica: (M) => prima(M, b) });
  return out;
}
// il tempo: prima della stella non c'è il pianeta; e lo stato che i moduli sanno dare è quello di adesso
function prima(M, b) { if (b.istante == null) return null; const nascita = ANNI_OGGI - M.S.eta; return b.istante < nascita ? no(`a ${cifre(b.istante)} anni dall'inizio la stella non era ancora nata (nasce a ${cifre(nascita)}): niente di ciò che le sta attorno può esserci (regola 6)`, 'stelle.js (età)') : null; }

// IL GIUDIZIO di una bolla il cui luogo arriva almeno al pianeta: sul pianeta e, se il punto è dato e la cosa dipende
// dalle sue condizioni, nel punto. → { esito, parte, perche, legge, misura, livello, soloAdesso }
export function giudica(b0, M = null) {
  const b = bolla(b0); if (livelloDi(b.dove) < 4) throw new Error('per giudicare una bolla serve il suo luogo almeno fino al pianeta');
  M = M || mondo(b.dove); if (!M) return { ...no(`il sistema ${percorsoDi(b.dove).slice(0, 3).join('/')} non ha un pianeta ${b.dove.pianeta}`), livello: 'stella' };
  const C = CONTENUTI[b.contenuto.cosa], tempo = prima(M, b); if (tempo) return { ...tempo, livello: 'stella' };
  if (b.grandezza > 2 * M.P.raggioM) return { ...no(`una bolla di ${cifre(b.grandezza)} m non sta in un pianeta largo ${cifre(2 * M.P.raggioM)} m`), livello: 'pianeta' };
  const g = { ...C.pianeta(M, b.contenuto), livello: 'pianeta', soloAdesso: b.istante != null && Math.abs(b.istante - ANNI_OGGI) > 1 };
  if (g.esito !== 'no' && b.dove.punto && C.nelPunto) { // le condizioni che il pianeta passa a quel punto
    const c = condizioni(M, b.dove.punto[1]), I = C.nelPunto(c), fuori = Object.entries(I).find(([k, [a, z]]) => !(c[k] >= a && c[k] < z));
    if (fuori) return { ...no(`in quel punto (latitudine ${cifre(b.dove.punto[1])}°) ${fuori[0] === 'T' ? 'la temperatura' : 'la pressione'} è ${cifre(c[fuori[0]], 4)}, fuori da ${cifre(fuori[1][0], 4)}…${cifre(fuori[1][1], 4)}: ${C.legge}`, C.legge), livello: 'punto' };
    return { ...g, livello: 'punto', condizioni: c };
  }
  return g;
}

// ---------- l'antenato comune: il primo livello dell'indirizzo che contiene tutte le bolle
export function antenatoComune(bolle) {
  const B = bolle.map(bolla), dove = {}; let n = 0;
  for (; n < LIVELLI.length; n++) { const l = LIVELLI[n], v = B[0].dove[l]; if (v == null || !B.every((b) => b.dove[l] != null && String(b.dove[l]) === String(v))) break; dove[l] = v; }
  return { livello: n ? LIVELLI[n - 1] : 'biblioteca', profondita: n, dove, luogo: percorsoDi(dove).join('/') };
}
// le bolle messe nello stesso punto allo stesso istante: i loro intervalli devono avere un'intersezione
function contraddizioni(B) {
  const gruppi = new Map(); for (const b of B) { if (!b.dove.punto) continue; const k = `${scrivi(b.luogo)}`; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(b); }
  for (const [k, g] of gruppi) { if (g.length < 2) continue; const M = mondo(g[0].dove), c = M ? condizioni(M, g[0].dove.punto[1]) : { T: 288, pressione: 1e5 }, I = {};
    for (const b of g) { const C = CONTENUTI[b.contenuto.cosa]; if (!C.nelPunto) continue; for (const [q, [a, z]] of Object.entries(C.nelPunto(c))) { const v = I[q] || (I[q] = { a: -Infinity, z: Infinity, chi: [] }); v.a = Math.max(v.a, a); v.z = Math.min(v.z, z); v.chi.push(b); if (!(v.a < v.z)) return { perche: `nello stesso punto (${k}) ${v.chi.map((x) => `«${x.contenuto.cosa}»`).join(' e ')} chiedono ${q === 'T' ? 'temperature' : 'pressioni'} che non si incontrano (${v.chi.map((x) => { const r = CONTENUTI[x.contenuto.cosa].nelPunto(c)[q]; return `${cifre(r[0], 4)}…${cifre(r[1], 4)}`; }).join(' e ')}): lo vieta ${C.legge}`, legge: C.legge, bolle: v.chi }; } } }
  return null;
}

// ---------- i mondi candidati: indirizzi della biblioteca dentro un antenato comune, scelti dagli eventi della domanda.
// A GRAPPOLI: fare una galassia costa (le sue 2500 stelle), fare un sistema poco; perciò si prendono GRAPPOLO stelle
// per ogni galassia estratta. Le stelle di una galassia si somigliano (stessa storia chimica): l'errore si calcola
// dalla differenza TRA i grappoli, non contando i mondi come se fossero indipendenti.
export const GRAPPOLO = 25;
function candidato(pre, serie, k, cosmi) {
  const g0 = Math.floor(k / GRAPPOLO), ug = (j) => serie(2 * (2 ** 30 + g0) + j), u = (j) => serie(2 * k + j); // (i numeri del grappolo stanno oltre 2³¹: non si mescolano a quelli dei mondi)
  const n = pre.cosmo ?? 1 + Math.floor(ug(0) * cosmi), C = cosmoDi(n), g = pre.galassia ?? Math.floor(ug(1) * C.galassie.length);
  let st = pre.stella ?? Math.floor(u(0) * STELLE), S = sistema(n, g, st);
  if (pre.stella == null) for (let giri = 0; !S.pianeti.length && giri < STELLE; giri++) { st = (st + 1) % STELLE; S = sistema(n, g, st); } // (come fa la biblioteca: la prima stella con pianeti)
  if (!S.pianeti.length) return null;
  return { cosmo: n, galassia: g, stella: st, pianeta: pre.pianeta ?? Math.floor(u(1) * S.pianeti.length) };
}
// I mondi provati dipendono solo da DOVE si cerca (e da `campione`, per chi ne vuole altri), non da che cosa si chiede:
// domande diverse nello stesso luogo guardano gli stessi mondi (e non li rifanno); la SCELTA tra quelli buoni invece
// viene dagli eventi della domanda.
const elenchi = new Map();
function mondiDi(pre, cosmi, campione = '') { // → (k) il k-esimo mondo candidato di quel luogo (tenuto: trovarlo vuol dire fare il suo sistema)
  const nome = `mondi in ${percorsoDi(pre).join('/') || `${cosmi} cosmi`}${campione ? `/${campione}` : ''}`; let E = elenchi.get(nome);
  if (!E) { if (elenchi.size > 8) elenchi.delete(elenchi.keys().next().value); E = { serie: sorgente('bolle').serie(nome), vie: [] }; elenchi.set(nome, E); }
  return (k) => { if (E.vie[k] === undefined) E.vie[k] = candidato(pre, E.serie, k, cosmi); return E.vie[k]; };
}
// la media di una grandezza sui mondi provati e il suo errore, dai grappoli: v[k] il valore del mondo k (NaN: non provato)
function mediaAGrappoli(v, unSoloGrappolo) {
  let s = 0, n = 0; const medie = []; for (let k0 = 0; k0 < v.length; k0 += GRAPPOLO) { let a = 0, m = 0; for (let k = k0; k < Math.min(v.length, k0 + GRAPPOLO); k++) if (!Number.isNaN(v[k])) { a += v[k]; m++; } if (m) { medie.push(a / m); s += a; n += m; } }
  if (!n) return { valore: 0, errore: 0 }; const media = s / n;
  if (unSoloGrappolo || medie.length < 2) { let q = 0; for (const x of v) if (!Number.isNaN(x)) q += (x - media) ** 2; return { valore: media, errore: n > 1 ? Math.sqrt(q / (n - 1) / n) : 0 }; }
  const mm = medie.reduce((a, x) => a + x, 0) / medie.length; let q = 0; for (const x of medie) q += (x - mm) ** 2; return { valore: media, errore: Math.sqrt(q / (medie.length - 1) / medie.length) };
}
// tutti i mondi di un dominio piccolo (un sistema dato: i suoi pianeti; un pianeta dato: lui), oppure null se va campionato
function tutti(pre) { if (pre.stella == null) return null; const S = sistema(pre.cosmo, pre.galassia, pre.stella); return (pre.pianeta != null ? [pre.pianeta] : S.pianeti.map((p, i) => i)).map((p) => ({ cosmo: pre.cosmo, galassia: pre.galassia, stella: pre.stella, pianeta: p })); }
// la ricerca di un mondo per un gruppo di bolle che stanno nello stesso pianeta (libero dentro `pre`)
function cerca(B, pre, c, nome, { mondi, cosmi, campione }) {
  const elenco = tutti(pre), kEsimo = elenco ? null : mondiDi(pre, cosmi, campione), N = elenco ? elenco.length : mondi, buoni = [], dubbi = [], motivi = new Map(), bene = new Float64Array(N).fill(NaN), pesi = new Float64Array(N).fill(NaN); let provati = 0;
  for (let k = 0; k < N; k++) {
    const via = elenco ? elenco[k] : kEsimo(k); if (!via) continue; const M = mondo(via); if (!M) continue; provati++; bene[k] = 0; pesi[k] = 0;
    const G = B.map((b) => giudica({ luogo: percorsoDi({ ...via }), grandezza: b.grandezza, istante: b.istante, contenuto: b.contenuto }, M)), negato = G.find((g) => g.esito === 'no');
    if (negato) { motivi.set(negato.legge || negato.perche, (motivi.get(negato.legge || negato.perche) || 0) + 1); continue; }
    if (G.some((g) => g.esito === 'forse')) { dubbi.push({ via, G }); continue; }
    const peso = G.reduce((a, g) => a * g.parte, 1); buoni.push({ via, G, peso }); bene[k] = 1; pesi[k] = peso;
  }
  const esatto = !!elenco, uno = pre.galassia != null, f = mediaAGrappoli(bene, uno), w = mediaAGrappoli(pesi, uno); if (esatto) { f.errore = 0; w.errore = 0; }
  return { provati, esatto, buoni, dubbi, motivi: [...motivi].sort((a, b) => b[1] - a[1]).map(([legge, quanti]) => ({ legge, quanti })), frazione: f, forse: provati ? dubbi.length / provati : 0, peso: w };
}
// dove mettere la bolla dentro il pianeta trovato: un punto in cui il suo contenuto c'è (eventi della domanda)
function posa(b, via, g, c, nome) {
  let lon = 360 * c(`${nome}/longitudine`) - 180, lat = Math.asin(2 * c(`${nome}/latitudine`) - 1) / RAD;
  if (g.misura?.dove) { lon = g.misura.dove.lon; lat = g.misura.dove.lat; }
  else if (g.misura?.fasce?.length) { const F = g.misura.fasce, w = F.map((x) => Math.cos(x * RAD)), tot = w.reduce((a, x) => a + x, 0); let r = c(`${nome}/fascia`) * tot, j = 0; while (j < F.length - 1 && (r -= w[j]) >= 0) j++; lat = F[j]; }
  const dove = { ...via, punto: [Math.round(lon * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4] };
  return bolla({ luogo: percorsoDi(dove), grandezza: b.grandezza, istante: b.istante, contenuto: b.contenuto });
}

// DOVE SI INCONTRANO. bolle: una lista di bolle (anche una sola).
//   opz.insieme   'pianeta': le bolle di cui non si sa il pianeta stanno tutte nello stesso (quale, lo si cerca);
//                 null (di default): ognuna dove capita, dentro il luogo che ha
//   opz.mondi     quanti indirizzi provare per ogni ricerca (300); opz.cosmi: in quanti cosmi, se il cosmo è libero (2)
//   opz.etichetta un nome in più per la domanda (un'altra etichetta, un'altra scelta tra i mondi che vanno bene)
//   opz.campione  un nome per un altro campione di mondi (gli stessi mondi per ogni domanda nello stesso luogo, se non lo si cambia)
// → { esiste, perche, antenato, ricerche: [{ bolle (i loro posti nella lista), provati, esatto, frazione, forse, peso, motivi }],
//     bolle: [{ …la bolla col luogo completo, giudizio, daVerificare }], mondi: gli indirizzi (e i numeri della biblioteca) }
export function incontra(bolle, { insieme = null, mondi = 300, cosmi = 2, etichetta = '', campione = '' } = {}) {
  const B = (Array.isArray(bolle) ? bolle : [bolle]).map(bolla); if (!B.length) throw new Error('serve almeno una bolla');
  const A = antenatoComune(B), ordine = B.map(canonico), c = sorgente(`bolle/${[...ordine].sort().join('|')}${etichetta ? `/${etichetta}` : ''}`);
  const fuori = (perche, extra = {}) => ({ esiste: false, perche, antenato: A, ...extra });
  const contro = contraddizioni(B); if (contro) return fuori(contro.perche, { legge: contro.legge });
  // i gruppi: ogni gruppo è un insieme di bolle che devono stare nello stesso pianeta, con il suo dominio di ricerca
  const gruppi = [];
  if (insieme === 'pianeta') { const dati = [...new Set(B.filter((b) => b.dove.pianeta != null).map((b) => percorsoDi(b.dove).slice(0, 4).join('/')))];
    if (dati.length > 1) return fuori(`le bolle dovrebbero stare nello stesso pianeta, ma i loro luoghi ne nominano ${dati.length} (${dati.join('; ')})`);
    const pre = dati.length ? B.find((b) => b.dove.pianeta != null).dove : A.dove; gruppi.push({ quali: B.map((b, i) => i), pre: { cosmo: pre.cosmo, galassia: pre.galassia, stella: pre.stella, pianeta: pre.pianeta } }); }
  else { const perPianeta = new Map(); B.forEach((b, i) => { if (b.dove.pianeta != null) { const k = percorsoDi(b.dove).slice(0, 4).join('/'); if (!perPianeta.has(k)) perPianeta.set(k, { quali: [], pre: b.dove }); perPianeta.get(k).quali.push(i); } else gruppi.push({ quali: [i], pre: b.dove }); }); gruppi.push(...perPianeta.values()); }
  const esito = new Array(B.length), ricerche = [];
  for (const g of gruppi) {
    const Bg = g.quali.map((i) => B[i]), nome = g.quali.map((i) => ordine[i]).sort().join('|'), R = cerca(Bg, g.pre, c, nome, { mondi, cosmi, campione });
    ricerche.push({ bolle: g.quali, luogo: percorsoDi(g.pre).join('/') || 'la biblioteca', provati: R.provati, esatto: R.esatto, buoni: R.buoni.length, frazione: R.frazione, forse: R.forse, peso: R.peso, motivi: R.motivi });
    if (!R.buoni.length && !R.dubbi.length) {
      const m = R.motivi[0];
      if (g.pre.pianeta != null) { const neg = Bg.map((b) => giudica({ luogo: percorsoDi(g.pre).slice(0, 4), grandezza: b.grandezza, istante: b.istante, contenuto: b.contenuto })).find((x) => x.esito === 'no'); return fuori(`non esiste: ${neg ? neg.perche : 'quel pianeta non c\'è'}`, { legge: neg?.legge ?? null, ricerche }); }
      return fuori(`nessun mondo su ${R.provati} provati in ${percorsoDi(g.pre).join('/') || `${cosmi} cosmi della biblioteca`} contiene ${Bg.map((b) => `«${b.contenuto.cosa}»`).join(' e ')}${Bg.length > 1 ? ' insieme' : ''}${m ? ` (il più delle volte lo vieta: ${m.legge})` : ''}`, { ricerche });
    }
    // la scelta: in proporzione al peso tra i mondi che vanno bene; se nessuno è deciso, il primo dei «forse»
    let scelto = null, daVerificare = false;
    if (R.buoni.length) { const tot = R.buoni.reduce((a, w) => a + w.peso, 0); let r = c(`${nome}/scelta`) * tot; scelto = R.buoni[R.buoni.length - 1]; for (const w of R.buoni) if ((r -= w.peso) < 0) { scelto = w; break; } }
    else { scelto = R.dubbi[Math.min(R.dubbi.length - 1, Math.floor(c(`${nome}/scelta`) * R.dubbi.length))]; daVerificare = true; }
    g.quali.forEach((i, j) => { const gi = scelto.G[j], b = B[i].dove.punto ? bolla({ luogo: percorsoDi({ ...scelto.via, punto: B[i].dove.punto }), grandezza: B[i].grandezza, istante: B[i].istante, contenuto: B[i].contenuto }) : posa(B[i], scelto.via, gi, c, `${ordine[i]}/${j}`);
      esito[i] = { bolla: b, luogo: scrivi(b.luogo).replace(/@.*$/, ''), giudizio: gi, daVerificare: daVerificare || gi.esito === 'forse', numero: numeroDi({ ...scelto.via, regione: 0 }), candidati: daVerificare ? R.dubbi.map((d) => d.via) : null }; });
  }
  const mondiTrovati = [...new Set(esito.map((e) => percorsoDi(e.bolla.dove).slice(0, 4).join('/')))];
  return { esiste: true, antenato: antenatoComune(esito.map((e) => e.bolla)), chiesto: A, ricerche, bolle: esito, mondi: mondiTrovati, daVerificare: esito.some((e) => e.daVerificare),
    perche: esito.some((e) => e.daVerificare) ? 'le condizioni necessarie ci sono; per alcune bolle decide la superficie: scendi con inFondo()' : 'ogni bolla ha il suo contenuto nel luogo trovato' };
}

// LA CAUSA COMUNE. Due o più bolle di cui non si sa se stanno nello stesso pianeta: il peso di «nello stesso»
// (la media sui mondi del prodotto delle parti) contro «ognuna nel suo» (il prodotto delle medie), sugli stessi mondi.
//   opz.aPriori   la probabilità, prima di guardare, che stiano nello stesso pianeta: è parte della domanda (½: non si sa)
// → { stesso: { peso, errore }, separati: { peso, errore }, guadagno (il rapporto: quanto la causa comune pesa di più),
//     probabilita (che stiano nello stesso, dati i pesi), scelta: 'stesso' | 'separati' (in proporzione, dagli eventi
//     della domanda), provati, dubbi (i mondi «forse», lasciati fuori) }
export function causaComune(bolle, { mondi = 300, cosmi = 2, aPriori = 0.5, etichetta = '', campione = '' } = {}) {
  const B = bolle.map(bolla), A = antenatoComune(B), ordine = B.map(canonico), c = sorgente(`bolle/${[...ordine].sort().join('|')}`), elenco = tutti(A.dove), kEsimo = elenco ? null : mondiDi(A.dove, cosmi, campione);
  const n = B.length, N = elenco ? elenco.length : mondi, parti = B.map(() => new Float64Array(N).fill(NaN)), prodotti = new Float64Array(N).fill(NaN); let provati = 0, dubbi = 0;
  for (let k = 0; k < N; k++) {
    const via = elenco ? elenco[k] : kEsimo(k); if (!via) continue; const M = mondo(via); if (!M) continue;
    const G = B.map((b) => giudica({ luogo: percorsoDi(via), grandezza: b.grandezza, istante: b.istante, contenuto: b.contenuto }, M)); if (G.some((g) => g.esito === 'forse')) { dubbi++; continue; }
    provati++; let p = 1; G.forEach((g, i) => { parti[i][k] = g.parte; p *= g.parte; }); prodotti[k] = p;
  }
  if (!provati) return { provati, dubbi, antenato: A, stesso: { peso: 0, errore: 0 }, separati: { peso: 0, errore: 0 }, guadagno: NaN, probabilita: NaN, scelta: null };
  const uno = !!elenco || A.dove.galassia != null, st = mediaAGrappoli(prodotti, uno); let separati = 1, rel2 = 0;
  for (let i = 0; i < n; i++) { const m = mediaAGrappoli(parti[i], uno); separati *= m.valore; rel2 += m.valore > 0 ? (m.errore / m.valore) ** 2 : 0; }
  const stesso = st.valore, pr = aPriori * stesso + (1 - aPriori) * separati, probabilita = pr > 0 ? (aPriori * stesso) / pr : NaN;
  return { provati, dubbi, antenato: A, stesso: { peso: stesso, errore: elenco ? 0 : st.errore }, separati: { peso: separati, errore: elenco ? 0 : separati * Math.sqrt(rel2) }, guadagno: separati > 0 ? stesso / separati : Infinity, probabilita,
    scelta: Number.isNaN(probabilita) ? null : c(`causa comune/scelta${etichetta ? `/${etichetta}` : ''}`) < probabilita ? 'stesso' : 'separati' };
}

// SCENDERE ALLA SUPERFICIE per le bolle che il pianeta lascia in «forse» (crosta di sale, carbonato): si calcola la
// superficie vera di quel pianeta (la stessa della mappa: mappa.js superficieDi, ~11 s) e la si interroga con il
// giudizio del modulo. Dei candidati di una ricerca ne prova al più `massimo`, nell'ordine, e dice quanti ne ha provati.
// → { esiste, provati, bolla (col punto dove la cosa c'è), giudizio, scartati: [{ luogo, perche }] }
export async function inFondo(b0, candidati = null, { massimo = 3 } = {}) {
  const b = bolla(b0), C = CONTENUTI[b.contenuto.cosa]; if (!C.superficie) return { esiste: giudica(b).esito === 'sì', provati: 0, bolla: b, giudizio: giudica(b), scartati: [] };
  const { superficieDi } = await import('./mappa.js'), vie = (candidati && candidati.length ? candidati : [b.dove]).slice(0, massimo), scartati = [];
  for (const d of vie) { const via = { cosmo: d.cosmo, galassia: d.galassia, stella: d.stella, pianeta: d.pianeta }, U = superficieDi(via); if (!U) { scartati.push({ luogo: percorsoDi(via).join('/'), perche: 'la superficie non si è potuta calcolare' }); continue; }
    const g = C.superficie(U, b.contenuto); if (g.esito !== 'sì') { scartati.push({ luogo: percorsoDi(via).join('/'), perche: g.perche }); continue; }
    const dove = { ...via, punto: [Math.round(g.misura.dove.lon * 100) / 100, Math.round(g.misura.dove.lat * 100) / 100] };
    return { esiste: true, provati: scartati.length + 1, bolla: bolla({ luogo: percorsoDi(dove), grandezza: b.grandezza, istante: b.istante, contenuto: b.contenuto }), giudizio: { ...g, livello: 'superficie' }, scartati }; }
  return { esiste: false, provati: scartati.length, bolla: null, giudizio: null, scartati };
}
