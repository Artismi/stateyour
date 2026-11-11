// disco.js — i pianeti che nascono dal disco attorno alla stella giovane.
//
// Una stella appena nata è circondata da un disco di gas e polvere, fatto della
// sua stessa materia. Qui non si sceglie «quanti pianeti e di che tipo»: si
// mette il disco, e si lascia che la sua storia faccia i pianeti.
//   1 IL DISCO: tanto gas vicino, sempre meno lontano; la polvere è la parte
//     pesante del gas (Z); oltre la LINEA DELLA NEVE anche il ghiaccio è solido.
//   2 GLI EMBRIONI: ogni corpo mangia la striscia di disco che la sua gravità
//     domina (qualche raggio di Hill) e lì si ferma: la massa di isolamento.
//   3 IL GAS: un nucleo abbastanza grosso tira a sé il gas a valanga e diventa
//     un gigante, ma solo se fa in tempo prima che il disco svanisca.
//   4 GLI URTI GIGANTI: sparito il gas, gli embrioni troppo vicini si disturbano,
//     le orbite si incrociano, e si fondono (o, accanto a un gigante, sono
//     scacciati) finché quelli che restano sono abbastanza distanti.
//   5 RAGGIO e COMPOSIZIONE: da quanta massa e di che materia è fatto ciascuno.
// Ciò che EMERGE: quanti pianeti, dove, quanto grandi, di che tipo, perché i
// giganti amano le stelle ricche di metalli e disertano le stelle piccole.
// Le LEGGI EMPIRICHE (misurate, o ricavate da simulazioni che qui non si
// possono rifare) sono dichiarate una per una dove si usano, con «LEGGE EMPIRICA».
// Una scelta da sapere: «i solidi sono Z × 0,0134 del gas» qui vale OLTRE la neve
// (tutti i metalli condensati); dentro, dove il ghiaccio è vapore, ne resta un
// quarto. Il rapporto di quattro è quello chiesto, e la massa non si inventa.
// Che cosa manca: la migrazione delle orbite nel disco (niente «Giovi caldi»),
// le risonanze, i sistemi con due stelle.

import { COSTANTI, MSOLE, ANNO, UA, stella as stellaVera } from './leggi.js';
import { generatore } from './mondo.js';

export const MTERRA = 5.972e24, RTERRA = 6.371e6, MGIOVE = 1.898e27, RGIOVE = 7.149e7;
const G = COSTANTI.G;

// ---------- i parametri del modello (pochi, e tutti qui)
export const DISCO = Object.freeze({
  metalliSole: 0.0134, // la frazione di materia pesante nel Sole (misurata)
  roccia: 0.25, // la parte dei metalli che è solida anche al caldo (ferro e roccia); il resto è ghiaccio, solido solo oltre la neve
  pendenza: 1.5, raggio: 30, // Σ ∝ r^(-3/2), fino a 30 UA·√M
  frazione: 0.055, sparpaglio: 0.5, // la massa del disco su quella della stella: mediana e larghezza (in logaritmo)
  vitaMinima: 1e6, vitaMedia: 3.5e6, // quanto dura il gas (anni): si osserva che metà dei dischi è sparita in 2–3 milioni di anni
  C: 5, // mezza larghezza della striscia che un embrione mangia, in raggi di Hill (in tutto 10: come la distanza tra embrioni)
  mescola: 0.25, // la velocità a caso che gli incontri danno agli embrioni, come frazione della loro velocità di fuga
  eMax: 0.3, pari: 0.1, // l'eccentricità più grande che un corpo regge senza perdersi; sopra un decimo della massa dell'altro, due corpi sono «pari»
  presa: 0.05, // la parte del gas rimasto che un gigante riesce a intercettare
  minimo: 0.02, // sotto questa massa (in Terre) non lo chiamiamo pianeta: resta tra i detriti
  senzaGas: 300, // sparito il gas i sassi non sono più frenati: gli embrioni li catturano centinaia di volte più lentamente
});

const limita = (x, a, b) => Math.max(a, Math.min(b, x));
// il seme rimescolato, così semi vicini (1, 2, 3…) danno dischi che non si somigliano
const casoDi = (seme, sale) => generatore((Math.imul((Math.floor(Number(seme) || 0) | 0) ^ sale, 0x9e3779b1) ^ 0x5bd1e995) >>> 0);

// ---------- 1. il disco
// Restituisce il disco di una stella { massa, Z, eta }: distanze in UA, densità in kg/m², tempi in anni.
export function disco(st, seme = 1) {
  const c = casoDi(seme, 0x51ed), M = Math.max(0.01, st.massa ?? 1), Z = Math.max(0, st.Z ?? 1), L = stellaVera(M).L;
  // la linea della neve: dove il disco scende sotto i 170 K e il ghiaccio non evapora più
  const neve = 2.7 * Math.sqrt(L);
  // LEGGE EMPIRICA: i dischi osservati arrivano a qualche decina di UA, più larghi attorno alle stelle più grandi
  const rOut = DISCO.raggio * Math.sqrt(M);
  // LEGGE EMPIRICA: la massa del disco è qualche centesimo di quella della stella, e varia molto da una stella all'altra
  const gauss = (c() + c() + c() + c() - 2) * Math.sqrt(3);
  const frazione = limita(DISCO.frazione * Math.exp(DISCO.sparpaglio * gauss), 0.01, 0.12), massaKg = frazione * M * MSOLE;
  // Σ(r) = Σ₀·r^(-3/2): Σ₀ (a 1 UA) è quella che, sommata fino al bordo esterno, dà la massa del disco
  const sigma0 = massaKg / (4 * Math.PI * UA * UA * Math.sqrt(rOut));
  // LEGGE EMPIRICA: il gas dura pochi milioni di anni (poi la luce della stella lo soffia via), meno attorno alle stelle grandi
  const vita = Math.min(1.2e7, DISCO.vitaMinima - (DISCO.vitaMedia - DISCO.vitaMinima) * Math.log(1 - 0.98 * c())) / Math.sqrt(M);
  // il bordo interno dei solidi: dove il disco giovane supera i 1500 K la polvere evapora, e non c'è di che fare pianeti.
  // Vicino alla stella il disco è scaldato soprattutto dal suo stesso gas che cade (in una vita il disco si svuota
  // sulla stella: Ṁ = massa / vita) e il calore esce a fatica attraverso la polvere (opacità κ ≈ 0,1 m²/kg × Z):
  //   T⁴ = 9·κ·Σ·G·M·Ṁ / (128·π·σ·r³)   →   con Σ ∝ r^(-3/2), T ∝ r^(-9/8)
  // Più dentro di così restano solo il limite della luce della stella e quello del suo campo magnetico.
  const T4 = (9 * 0.1 * Z * sigma0 * G * M * MSOLE * (massaKg / (vita * ANNO))) / (128 * Math.PI * COSTANTI.sigma * UA ** 3);
  const rIn = Math.min(0.5 * rOut, Math.max(0.02, 0.034 * Math.sqrt(L), 0.05 * Math.cbrt(M), Math.pow(T4 / 1500 ** 4, 1 / 4.5)));
  const sigmaGas = (r) => sigma0 * Math.pow(r, -DISCO.pendenza);
  // i solidi: i metalli del gas (Z × 0,0134); al caldo solo un quarto è solido (ferro e roccia), oltre la neve
  // lo è anche il ghiaccio: quattro volte di più
  const sigmaSolidi = (r) => Z * DISCO.metalliSole * (r < neve ? DISCO.roccia : 1) * sigmaGas(r);
  return { massaStella: M, Z, L, neve, rIn, rOut, frazione, massaKg, sigma0, vita, sigmaGas, sigmaSolidi };
}

// ---------- 5. il raggio, dalla massa e da ciò di cui è fatto
// LEGGE EMPIRICA (relazioni massa-raggio, dai modelli dell'interno confrontati con i pianeti misurati):
//  · solidi: R = (1,07 − 0,21·ferro + 0,34·ghiaccio)·M^0,27 in unità terrestri: più ferro, più piccolo; più ghiaccio, più grande
//  · un velo di idrogeno ed elio gonfia molto anche se pesa poco (è leggero e caldo)
//  · giganti: sopra 0,3 masse di Giove il raggio non cresce più (il gas si schiaccia sotto il proprio peso): circa un raggio di Giove
export function raggioPianeta({ massaKg, ferro = 0.3, ghiaccio = 0, gas = 0, flusso = 1, eta = 4.5e9 }) {
  if (gas > 0.5) { const x = massaKg / (0.3 * MGIOVE); return RGIOVE * Math.pow(x, x < 1 ? 0.55 : -0.04); }
  const m = massaKg / MTERRA, solido = (1.07 - 0.21 * ferro + 0.34 * ghiaccio) * Math.pow(m * (1 - gas), 0.27);
  const velo = gas > 0 ? 2.06 * Math.pow(m, -0.21) * Math.pow(gas / 0.05, 0.59) * Math.pow(Math.max(1e-6, flusso), 0.044) * Math.pow(limita(eta, 1e8, 1.4e10) / 5e9, -0.18) : 0;
  return RTERRA * (solido + velo);
}

// LEGGE EMPIRICA (dalle simulazioni della crescita degli embrioni nel gas, Kokubo–Ida e Ida–Lin): il tempo in cui un
// embrione di massa m raddoppia. Cresce con la distanza (lontano le orbite sono lente) e cala dove ci sono più solidi
// (più cibo) e più gas (il gas frena i sassi, e i sassi lenti si lasciano catturare). Anni; r in UA, Σ in kg/m².
export const tempoCrescita = (m, r, sigmaS, sigmaG, Mst) => (1.2e5 / (sigmaS / 100)) * Math.sqrt(r) * Math.cbrt(m / MTERRA) * Math.pow(Mst, -1 / 6) * Math.pow(sigmaG / 24000, -0.4) * Math.pow(r, 0.1);
// LEGGE EMPIRICA (dai modelli degli involucri): il tempo in cui un nucleo fermo raffredda e stringe il suo involucro di
// gas fino a pesare quanto lui: un miliardo di anni per una Terra, un milione per dieci Terre (cala come il cubo della
// massa). È da qui che esce la soglia «circa dieci masse terrestri»: sotto, il disco svanisce prima.
const tempoInvolucro = (m) => 1e9 * Math.pow(m / MTERRA, -3);
// LEGGE EMPIRICA (simulazioni di molti corpi, Chambers e altri 1996): orbite vicine reggono per un numero di giri che
// cresce in fretta con la distanza in raggi di Hill reciproci Δ: log₁₀(giri) = b·Δ + c, con b e c misurati per corpi
// leggeri (un decimilionesimo della stella: b = 0,765, c = −0,03) e pesanti (un centomillesimo: b = 1,176, c = −1,663);
// tra i due, e fino ai giganti, si va in proporzione al logaritmo della massa. Quanti raggi servono per reggere «giri»
// giri: circa 8 per un sistema giovane, 10–13 dopo miliardi di anni per corpi piccoli, 7–8 accanto a un gigante.
// Mai meno di 2√3 ≈ 3,5: più vicine di così due orbite si disfano subito (il limite di Hill, questo esatto).
export const raggiNecessari = (giri, mu) => { const x = limita(Math.log10(mu) + 7, 0, 4); return Math.max(2 * Math.sqrt(3), (Math.log10(Math.max(10, giri)) + 0.03 + 0.8165 * x) / (0.765 + 0.2055 * x)); };
// la stessa legge letta al contrario: quanti giri reggono due orbite distanti Δ raggi di Hill reciproci (entro il limite
// di Hill, nessuno: si incrociano subito). Serve a dire QUANDO è avvenuto un urto gigante (e a impatti.js)
export const giriCheRegge = (delta, mu) => { if (delta <= 2 * Math.sqrt(3)) return 0; const x = limita(Math.log10(mu) + 7, 0, 4); return Math.pow(10, delta * (0.765 + 0.2055 * x) - 0.03 - 0.8165 * x); };

// ---------- 2–6. dal disco ai pianeti
// stella = { massa (masse solari alla nascita), Z (metalli, Sole = 1), eta (anni) }; stesso seme → stessi pianeti.
// Restituisce i pianeti in ordine di distanza: { aUA, massaKg, raggioM, tipo, composizione, eccentricita, storia, involucro }
// (involucro: la parte della massa che è un velo di idrogeno ed elio, per i mondi ghiacciati rimasti a metà strada;
// la composizione di rocciosi e ghiacciati descrive la parte solida).
// In più ogni pianeta porta «formazione», i NUMERI della sua storia (quelli che «storia» racconta a parole; serve a
// impatti.js). Non è enumerabile: chi elenca, stampa o confronta i pianeti vede quelli di sempre; chi li copia campo per
// campo deve copiarla apposta.
//   formazione = { urti, cibo, tGas, mIso, tIso, nato, scacciati, massaAlGas }
//   urti        gli urti giganti che l'hanno fatto, in ordine di tempo: [{ bersaglioKg, massaKg (i solidi dei due corpi,
//               il più grosso e il più piccolo), delta (la distanza tra le due orbite, in raggi di Hill reciproci, a cui
//               sono state trovate instabili; ≤ 2√3: già incrociate), tIncrocio (anni dalla nascita del sistema: quando
//               quella distanza ha ceduto, con la legge di Chambers contata dall'ultimo urto dei due o dalla fine del gas),
//               aUA, laterale (true se è un urto precedente del corpo più piccolo, non del pianeta) }]
//   cibo        (kg) i solidi delle sue strisce che gli embrioni non hanno mangiato: sono ancora in giro
//   tGas        (anni) quando è sparito il gas; mIso (kg) la somma delle masse di isolamento delle sue strisce; tIso (anni)
//               il tempo di isolamento dell'embrione principale; nato (UA); scacciati: quanti vicini ha scacciato
//   massaAlGas  (kg) quanti solidi avevano già raccolto i suoi embrioni quando il gas è sparito
export function formaPianeti(st, seme = 1) {
  const D = disco(st, seme), c = casoDi(seme, 0x7a3d), Mst = D.massaStella * MSOLE, eta = Math.max(0, st.eta ?? 4.5e9);
  const P = DISCO, hill = (m, a) => a * Math.cbrt(m / (3 * Mst)), vK = (a) => Math.sqrt((G * Mst) / (a * UA));
  // il tempo con il gas (fino a che il disco svanisce) e quello dopo: senza gas i sassi non sono più frenati,
  // corrono, e gli embrioni li catturano centinaia di volte più lentamente
  const colGas = Math.min(eta, D.vita), tUtile = colGas + Math.max(0, eta - D.vita) / P.senzaGas;
  const acquaSistema = 0.5 + c(); // quanta acqua hanno portato dentro i corpi venuti da fuori: cambia da un sistema all'altro

  // 2. GLI EMBRIONI. Si riempie il disco di strisce, dal bordo interno all'esterno: ogni striscia è larga 2C raggi di
  // Hill dell'embrione che ne mangia tutti i solidi. M = 2π·r·Σs·(2C·r_H) e r_H = r·(M/3M*)^(1/3) danno la formula nota
  //   M_iso = (4π r² Σs C)^(3/2) / (3 M*)^(1/2)
  const massaIso = (r) => Math.pow(4 * Math.PI * (r * UA) ** 2 * D.sigmaSolidi(r) * P.C, 1.5) / Math.sqrt(3 * Mst);
  const corpi = [];
  for (let lo = D.rIn * (1 + 0.15 * c()); lo < D.rOut && corpi.length < 6000;) {
    let m = massaIso(lo), w = 2 * P.C * hill(m, lo);
    const r = lo + Math.min(w, 0.4 * lo) / 2; m = massaIso(r); w = 2 * P.C * hill(m, r);
    if (!(w > 0)) break;
    if (w > 0.4 * r) { w = 0.4 * r; m = 2 * Math.PI * r * UA * w * UA * D.sigmaSolidi(r); } // un disco enorme: la striscia non può essere più larga dell'orbita
    lo += w; if (lo > D.rOut) break;
    const sS = D.sigmaSolidi(r), sG = D.sigmaGas(r), tIso = 3 * tempoCrescita(m, r, sS, sG, D.massaStella);
    // la massa cresce come il cubo del tempo (il tempo di raddoppio va come M^(1/3)) fino all'isolamento
    const mora = m * Math.min(1, (tUtile / tIso) ** 3);
    // 6. LA MATERIA. Il ferro condensa prima della roccia: vicino alla stella, dove fa caldo, la polvere è più ricca di
    // ferro (regola semplice: cresce col quadrato della temperatura del disco, 280 K·L^¼/√r), e ce n'è di più se la
    // stella è metallica. L'acqua: oltre la neve i solidi sono per tre quarti ghiaccio; dentro sono asciutti, salvo
    // quella portata dai corpi caduti da oltre la neve, sempre meno andando verso la stella (regola semplice,
    // suggerita dalle simulazioni: un decimo al bordo della neve, che cala come la distanza alla 2,5)
    const T = (280 * Math.pow(D.L, 0.25)) / Math.sqrt(r), ferroRoccia = Math.min(0.75, (0.19 + 0.08 * Math.min(D.Z, 4)) * (1 + (T / 600) ** 2));
    const acqua = r < D.neve ? Math.min(0.1, 0.1 * acquaSistema * Math.pow(r / D.neve, 2.5)) : 1 - P.roccia;
    corpi.push({ a: r, m: mora, fe: mora * (1 - acqua) * ferroRoccia, h2o: mora * acqua, gas: 0, e: 0, urti: 0, scacciati: 0, mIso: m, tIso, nato: r, nucleo: 0, tGas: 0, freddo: r >= D.neve, misto: false,
      lista: [], tUrto: D.vita, iso: m, cibo: m - mora, alGas: m * Math.min(1, (colGas / tIso) ** 3) }); // (i numeri per «formazione»)
  }

  // 3. IL GAS. Un nucleo isolato raffredda il suo involucro in tempoInvolucro(M): se nucleo e involucro sono pronti
  // prima che il disco svanisca, il gas cade a valanga. I primi a riuscirci si servono per primi.
  const pronti = corpi.filter((b) => b.tIso + tempoInvolucro(b.mIso) < colGas).sort((p, q) => p.tIso + tempoInvolucro(p.mIso) - (q.tIso + tempoInvolucro(q.mIso)));
  let gasRimasto = D.massaKg;
  for (const b of pronti) {
    if (b.morto) continue;
    const t0 = b.tIso + tempoInvolucro(b.mIso), resta = Math.exp((-2 * t0) / D.vita); // il gas cala col tempo: chi arriva tardi trova meno
    // quanto gas prende: tutto quello della sua striscia (la stessa formula dell'isolamento, col gas al posto dei solidi),
    // ma non più di una parte di quello che il disco gli fa arrivare
    const mGas = Math.min(Math.pow(4 * Math.PI * (b.a * UA) ** 2 * D.sigmaGas(b.a) * resta * P.C, 1.5) / Math.sqrt(3 * Mst), P.presa * gasRimasto * resta);
    b.nucleo = b.m; b.tGas = t0; b.gas = mGas; gasRimasto -= mGas;
    // gli embrioni dentro la sua nuova striscia (C raggi di Hill del gigante) gli cadono addosso
    const rh = P.C * hill(b.m + mGas, b.a);
    for (const o of corpi) if (o !== b && !o.morto && Math.abs(o.a - b.a) < rh) { b.m += o.m; b.gas += o.gas; b.fe += o.fe; b.h2o += o.h2o; b.iso += o.iso; b.cibo += o.cibo; b.alGas += o.alGas; o.morto = true; }
    b.m += mGas;
  }
  // i nuclei tardivi: l'involucro cresce piano (in proporzione al tempo che resta), e quando il disco svanisce resta
  // un velo di gas. Solo al freddo: dentro la neve la luce della stella e gli urti lo strappano via.
  for (const b of corpi) if (!b.morto && !b.gas && b.freddo && b.m >= b.mIso) {
    const x = Math.max(0, colGas - b.tIso) / tempoInvolucro(b.m);
    if (x > 0.01) { b.gas = b.m * x; b.m += b.gas; }
  }

  // 4. GLI URTI GIGANTI. Sparito il gas (che teneva le orbite rotonde), due vicini reggono solo se la distanza tra le
  // loro orbite supera K raggi di Hill reciproci (K ≈ 10, dal numero di giri fatti finora). Se no si incontrano:
  //  · di solito si fondono: massa e momento angolare si sommano, e il nuovo corpo resta con un'orbita un po'
  //    allungata (eccentricità ≈ una frazione di v_fuga / v_orbita): così spazza una fascia più larga e può toccare
  //    altri vicini. Vicino alla stella v_orbita è grande e gli urti sono pochi; lontano sono tanti;
  //  · accanto a un corpo molto più pesante, e dove la sua gravità vince quella della stella (v_fuga > v_orbita),
  //    funziona la fionda: il piccolo che sta più dentro è lanciato sulla stella, quello che sta più fuori è scacciato
  //    dal sistema, e il grande, che gli ha dato l'energia, scende un poco. Tra pari la fionda non basta: nessuno dei
  //    due ha l'energia per scacciare l'altro, e prima o poi si urtano.
  let vivi = corpi.filter((b) => !b.morto && b.m > 0);
  if (eta > D.vita) {
    const raggio = (b) => raggioPianeta({ massaKg: b.m, ferro: b.fe / (b.m - b.gas), ghiaccio: b.h2o / (b.m - b.gas), gas: b.gas / b.m });
    const stato = (p, q) => { // quanto è larga la distanza tra le due orbite rispetto a quella che serve (< 1: instabile)
      const am = (p.a + q.a) / 2, K = raggiNecessari(((eta - D.vita) * Math.sqrt(D.massaStella)) / Math.pow(am, 1.5), (p.m + q.m) / (2 * Mst));
      return (q.a * (1 - q.e) - p.a * (1 + p.e)) / (K * hill(p.m + q.m, am));
    };
    for (let giro = 0; giro < 600; giro++) {
      const n = vivi.length, s = new Float64Array(n); let fatto = false;
      for (let i = 0; i + 1 < n; i++) s[i] = stato(vivi[i], vivi[i + 1]);
      for (let i = 0; i + 1 < n; i++) {
        if (s[i] >= 1 || (i + 2 < n && s[i + 1] < s[i])) continue; // stabile, o la coppia accanto è messa peggio: tocca prima a lei
        const p = vivi[i], q = vivi[i + 1], grande = p.m >= q.m ? p : q, piccolo = grande === p ? q : p, am = (p.a + q.a) / 2;
        const vf = Math.sqrt((2 * G * (p.m + q.m)) / (raggio(p) + raggio(q))), v = vK(am), m = p.m + q.m;
        const fionda = (vf * vf) / (2 * v * v); // quanto la gravità dei due corpi vince su quella della stella (numero di Safronov)
        if (piccolo.m > P.pari * grande.m || c() * (1 + fionda * fionda) > fionda * fionda) { // si fondono
          // l'urto com'è stato (per «formazione»): chi, a quale distanza le orbite hanno ceduto, e quando: i giri che
          // quella distanza regge, contati da quando i due corpi sono così (l'ultimo urto di uno dei due, o la fine del gas)
          const mu2 = (p.m + q.m) / (2 * Mst), anno = Math.pow(am, 1.5) / Math.sqrt(D.massaStella), delta = Math.max(0, s[i] * raggiNecessari((eta - D.vita) / anno, mu2));
          const tIncrocio = Math.min(eta, Math.max(p.tUrto, q.tUrto) + giriCheRegge(delta, mu2) * anno);
          grande.lista = [...grande.lista, ...piccolo.lista.map((u) => ({ ...u, laterale: true })), { bersaglioKg: grande.m - grande.gas, massaKg: piccolo.m - piccolo.gas, delta, tIncrocio, aUA: am }];
          grande.tUrto = tIncrocio; grande.iso += piccolo.iso; grande.cibo += piccolo.cibo; grande.alGas += piccolo.alGas;
          grande.a = ((p.m * Math.sqrt(p.a) + q.m * Math.sqrt(q.a)) / m) ** 2;
          grande.nato = (grande.nato * grande.m + piccolo.nato * piccolo.m) / m;
          if (grande.gas < 0.5 * grande.m) { grande.m = m - piccolo.gas - grande.gas; grande.gas = 0; grande.e = Math.min(P.eMax, ((P.mescola * vf) / v) * (0.7 + 0.6 * c())); } // l'urto strappa il velo di gas
          else { grande.m = m; grande.gas += piccolo.gas; }
          grande.fe += piccolo.fe; grande.h2o += piccolo.h2o; grande.urti += 1 + piccolo.urti; grande.misto ||= piccolo.misto || grande.freddo !== piccolo.freddo;
        } else { // la fionda: chi parte verso l'infinito lo fa con energia nulla, e il grande paga il conto scendendo
          if (piccolo.a > grande.a) grande.a = Math.max(D.rIn, 1 / (1 / grande.a + piccolo.m / grande.m / piccolo.a));
          grande.e = Math.min(P.eMax, Math.hypot(grande.e, (0.4 * piccolo.m) / grande.m)); grande.scacciati++;
        }
        piccolo.morto = true; fatto = true; i++;
      }
      if (!fatto) break;
      vivi = vivi.filter((b) => !b.morto).sort((p, q) => p.a - q.a);
    }
  }

  // i pianeti: quelli abbastanza grandi; il resto sono detriti (fasce di asteroidi e di comete)
  const terre = (m) => { const x = m / MTERRA; return (x < 10 ? x.toFixed(x < 1 ? 2 : 1) : String(Math.round(x))).replace('.', ','); };
  const pianeti = vivi.filter((b) => b.m >= P.minimo * MTERRA && b.a >= 0.02).map((b) => {
    const solidi = b.m - b.gas, gas = b.gas / b.m, ghiaccio = b.h2o / solidi, ferro = b.fe / solidi;
    const tipo = gas > 0.5 ? 'gassoso' : ghiaccio > 0.2 ? 'ghiacciato' : 'roccioso', involucro = tipo === 'gassoso' || gas < 0.005 ? 0 : gas;
    const raggioM = raggioPianeta({ massaKg: b.m, ferro, ghiaccio, gas: tipo === 'gassoso' ? gas : involucro, flusso: D.L / (b.a * b.a), eta });
    // di che cosa è fatto. Il gas di un gigante è quello della stella: idrogeno ed elio (71 a 27, la miscela misurata
    // del Sole) con i suoi metalli; i «pesanti» sono quelli più il nucleo
    const pesanti = tipo === 'gassoso' ? Math.min(0.5, solidi / b.m + gas * 0.0134 * D.Z) : 0;
    const composizione = tipo === 'gassoso' ? { idrogeno: (1 - pesanti) * (0.71 / 0.98), elio: (1 - pesanti) * (0.27 / 0.98), pesanti }
      : tipo === 'ghiacciato' ? { ghiaccio, roccia: 1 - ghiaccio - ferro, ferro } : { ferro, roccia: 1 - ferro - ghiaccio, acqua: ghiaccio };
    // l'eccentricità di oggi: quella presa negli urti, smorzata dai detriti rimasti (che frenano chi corre fuori dal coro)
    const eccentricita = tipo === 'gassoso' ? b.e + 0.01 + 0.05 * c() : b.e * (0.15 + 0.35 * c()) + 0.002 + 0.01 * c();
    const dopo = b.scacciati ? `; ha scacciato ${b.scacciati === 1 ? 'un vicino' : `${b.scacciati} vicini`}` : '';
    const storia = tipo === 'gassoso' ? `un nucleo di ${terre(b.nucleo)} Terre, pronto in ${(b.tGas / 1e6).toFixed(1).replace('.', ',')} milioni di anni, ha catturato il gas a valanga prima che il disco svanisse${dopo}`
      : involucro ? `un nucleo di ghiaccio di ${terre(solidi)} Terre arrivato tardi: il disco è svanito prima della valanga, gli è rimasto un velo di gas${dopo}`
        : b.urti ? `${b.urti === 1 ? 'un urto gigante' : `${b.urti} urti giganti`} tra embrioni nati attorno a ${b.nato.toFixed(2).replace('.', ',')} UA${b.misto ? ', a cavallo della linea della neve: roccia e ghiaccio insieme' : ''}${dopo}`
          : `un embrione ${b.freddo ? 'di ghiaccio' : 'di roccia'} rimasto solo${b.m < 0.99 * b.mIso ? ', cresciuto piano: il suo cibo è ancora in giro' : ', che ha mangiato tutta la sua striscia di disco'}${dopo}`;
    const formazione = { urti: b.lista.slice().sort((x, y) => x.tIncrocio - y.tIncrocio), cibo: Math.max(0, b.cibo), tGas: D.vita, mIso: b.iso, tIso: b.tIso, nato: b.nato, scacciati: b.scacciati, massaAlGas: b.alGas };
    return Object.defineProperty({ aUA: b.a, massaKg: b.m, raggioM, tipo, composizione, eccentricita, storia, involucro }, 'formazione', { value: formazione, enumerable: false });
  });
  // le orbite di oggi non si incrociano: se due si toccassero, i detriti le avrebbero già arrotondate
  for (let i = 0; i + 1 < pianeti.length; i++) {
    const p = pianeti[i], q = pianeti[i + 1], spazio = 0.8 * (q.aUA - p.aUA), serve = p.aUA * p.eccentricita + q.aUA * q.eccentricita;
    if (serve > spazio) { p.eccentricita *= spazio / serve; q.eccentricita *= spazio / serve; }
  }
  return pianeti;
}
