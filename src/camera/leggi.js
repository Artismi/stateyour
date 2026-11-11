// leggi.js — le regole e i parametri. Tutto il resto deve discendere da qui.
//
// Le COSTANTI della natura e i PARAMETRI del cosmo; da questi si calcola il
// resto: quanto è vecchio l'universo, quanto vive una stella, che cosa diventa
// quando muore, quanto è forte il campo magnetico di ciò che resta. Cambiando
// una costante cambia tutto, in modo coerente (un multiverso anche di leggi).
// Dove la scienza non sa ancora far emergere una cosa dai principi (la
// distribuzione delle masse delle stelle che nascono, il legame tra una stella
// e il Sole come unità), si usa la legge misurata, e qui lo si dice.

export const COSTANTI = {
  c: 2.998e8, G: 6.674e-11, hbar: 1.0546e-34, kB: 1.381e-23, sigma: 5.670e-8,
  me: 9.109e-31, mp: 1.6726e-27, mn: 1.6749e-27, e: 1.602e-19,
};
export const COSMO = { H0: 67.7, Om: 0.31, OL: 0.69, Ob: 0.049, sigma8: 0.81, ns: 0.965 };
export const ANNO = 3.156e7, MSOLE = 1.989e30, RSOLE = 6.957e8, LSOLE = 3.828e26;

// l'età dell'universo, esatta per un cosmo piatto con materia e energia oscura
export function etaUniverso(p = COSMO) {
  const H = (p.H0 * 1000) / 3.086e22;
  return (2 / (3 * H * Math.sqrt(p.OL))) * Math.asinh(Math.sqrt(p.OL / p.Om));
}

// la massa massima di una nana bianca (Chandrasekhar): dalla meccanica quantistica e dalla gravità
export function massaChandrasekhar(k = COSTANTI, mu = 2) {
  return (3.098 * Math.pow((k.hbar * k.c) / k.G, 1.5)) / (mu * k.mp) ** 2; // ≈ 1,43 masse solari (3,098 = ω₃·√(3π)/2, del polìtropo)
}
// la massa massima di una stella di neutroni: la stessa scala con i neutroni, ridotta dalla
// relatività e dalle forze nucleari (calcolo di Tolman-Oppenheimer-Volkoff: circa 1,5 volte Chandrasekhar)
export const massaMassimaNeutroni = (k = COSTANTI) => 1.55 * massaChandrasekhar(k);

// il raggio di una nana bianca (gas di elettroni degenere) e di una stella di neutroni
export function raggioNanaBianca(M, k = COSTANTI) {
  const Mc = massaChandrasekhar(k), x = Math.min(0.999, M / Mc);
  // R ∝ ħ² / (G·mₑ·(2mₚ)^(5/3)·M^(1/3)); 4,55 viene dal polìtropo di indice 3/2; vicino al limite si stringe
  const R0 = (4.55 * k.hbar * k.hbar) / (k.G * k.me * Math.pow(2 * k.mp, 5 / 3) * Math.pow(M, 1 / 3));
  return R0 * Math.sqrt(1 - x ** (4 / 3));
}
export function raggioNeutroni(M, k = COSTANTI) {
  // la stessa legge con i neutroni al posto degli elettroni; il coefficiente tiene conto delle forze nucleari
  return (4.0 * k.hbar * k.hbar) / (k.G * Math.pow(k.mn, 8 / 3) * Math.pow(M, 1 / 3));
}

// una stella in sequenza principale, con il Sole come unità (le relazioni di scala vengono dalla
// struttura stellare; i loro coefficienti si misurano sul Sole)
export function stella(Msol) {
  const L = Msol < 0.43 ? 0.23 * Msol ** 2.3 : Msol < 2 ? Msol ** 4 : Msol < 55 ? 1.4 * Msol ** 3.5 : 32000 * Msol;
  const R = Msol < 1 ? Msol ** 0.8 : Msol ** 0.57;
  const T = 5772 * Math.pow(L / (R * R), 0.25);
  // quanto vive: brucia circa il 10% del suo idrogeno, con un'efficienza di 0,7% (E = mc²)
  const vita = (0.1 * 0.007 * Msol * MSOLE * COSTANTI.c ** 2) / (L * LSOLE) / ANNO;
  return { L, R, T, vita };
}

// che cosa diventa una stella quando muore, e quanto è forte il suo campo: il flusso magnetico
// si conserva mentre si contrae (B·R² costante), così una stella che diventa piccolissima ha un
// campo enorme
export function fine(Msol, B0 = 1e-4) {
  const Rs = stella(Msol).R * RSOLE, Mc = massaChandrasekhar() / MSOLE;
  if (Msol < 8) { // perde gli strati esterni; resta il nucleo, una nana bianca
    const Mr = Math.min(0.98 * Mc, 0.48 + 0.08 * Msol), R = raggioNanaBianca(Mr * MSOLE);
    return { tipo: 'nana bianca', massa: Mr, raggio: R, B: B0 * (Rs / R) ** 2, supernova: false };
  }
  const nucleo = 1.2 + 0.04 * (Msol - 8);
  if (nucleo < massaMassimaNeutroni() / MSOLE) { // il nucleo collassa: una supernova, e resta una stella di neutroni
    const R = raggioNeutroni(nucleo * MSOLE);
    return { tipo: 'stella di neutroni', massa: nucleo, raggio: R, B: B0 * (Rs / R) ** 2, supernova: true };
  }
  return { tipo: 'buco nero', massa: nucleo, raggio: (2 * COSTANTI.G * nucleo * MSOLE) / COSTANTI.c ** 2, B: 0, supernova: true };
}

// la distribuzione delle masse delle stelle che nascono (misurata: Kroupa); u tra 0 e 1
export function massaNascita(u) {
  // da 0,08 a 100 masse solari: pendenza 1,3 sotto mezza massa solare, 2,3 sopra
  const a = 0.08, b = 0.5, c = 100, w1 = 2 * ((b ** -0.3 - a ** -0.3) / -0.3), w2 = (c ** -1.3 - b ** -1.3) / -1.3, f = w1 / (w1 + w2);
  if (u < f) return (a ** -0.3 + (u / f) * (b ** -0.3 - a ** -0.3)) ** (1 / -0.3);
  return (b ** -1.3 + ((u - f) / (1 - f)) * (c ** -1.3 - b ** -1.3)) ** (1 / -1.3);
}

// ---------- LA RADIOATTIVITÀ DELLA ROCCIA: una legge sola per i pianeti (geologia.js, interno) e per le lune (lune.js).
// Il calore che un chilo di roccia produce (W/kg), dalle quantità misurate nelle condriti di uranio 238 e 235, torio e
// potassio 40: ognuno si dimezza con il suo tempo (in miliardi di anni). Con l'età cala: a un miliardo di anni era
// quasi cinque volte quello di oggi (4,5 miliardi), a dieci sarà meno di un terzo.
// (I numeri: uranio 8,0 ppb, torio 29 ppb, potassio 550 ppm nelle condriti (Lodders 2003), per il calore che ogni chilo di
// nuclide libera, neutrini esclusi: U-238 95,13 µW · U-235 568,47 µW · Th-232 26,28 µW · K-40 28,47 µW (Dye 2012), con le
// abbondanze isotopiche 99,274% · 0,7204% · 100% · 0,0117%. Gli stessi nuclidi, contati uno per uno, sono in materia.js.)
export const ISOTOPI = [[0.7555e-12, 4.468], [0.0328e-12, 0.704], [0.7621e-12, 14.05], [1.832e-12, 1.248]];
export const caloreDellaRoccia = (etaAnni = 4.5e9) => ISOTOPI.reduce((s, [h, mezza]) => s + h * Math.pow(2, (4.5 - etaAnni / 1e9) / mezza), 0);

// ---------- i pianeti: calore, atmosfera, acqua. Ogni numero discende dalla stella e dal pianeta.
export const UA = 1.496e11, R_GAS = 8.314;
// la temperatura di equilibrio: la luce che arriva, meno quella riflessa, uguale a quella irradiata
export const temperaturaEquilibrio = (Lw, aM, albedo) => Math.pow((Lw * (1 - albedo)) / (16 * Math.PI * COSTANTI.sigma * aM * aM), 0.25);
// un gas resta se la gravità trattiene le sue molecole più veloci (parametro di Jeans: per restare
// miliardi di anni serve circa 25: così la Terra perde l'idrogeno e tiene l'azoto, la Luna perde tutto); l'esosfera è più calda della superficie
export const trattiene = (M, R, T, massaMolecola) => (COSTANTI.G * M * massaMolecola) / (COSTANTI.kB * 3 * T * R) > 25;
export const MOLECOLE = { idrogeno: 2, elio: 4, acqua: 18, azoto: 28, 'anidride carbonica': 44, metano: 16 };
// il punto di ebollizione dell'acqua a una pressione (dove la pressione del vapore la uguaglia); il ghiaccio fonde a 273 K;
// sotto 611 Pa (il punto triplo) l'acqua liquida non può esistere
// (l'evaporazione dell'acqua: calore 44,00 kJ/mol ed entropia 118,89 J/mol/K, gli STESSI delle tabelle di chimica.js, da
// cui viene la pressione del vapore che sta nell'aria: così il mare bolle esattamente dove l'aria è satura a quella pressione)
export const ACQUA = Object.freeze({ evaporazione: 44000, entropia: 118.89, critica: 647, tripla: 611 });
export const ebollizione = (P) => ACQUA.evaporazione / (ACQUA.entropia - R_GAS * Math.log(Math.max(P, 1e-300) / 1e5));
export function statoAcqua(T, P) {
  if (T >= ACQUA.critica) return 'vapore'; // (sopra il punto critico, 647 K, liquido e vapore non si distinguono più: non c'è un mare)
  if (P < ACQUA.tripla) return T < 200 ? 'ghiaccio' : 'vapore (il ghiaccio sublima: troppo poca pressione per il liquido)';
  return T < 273.15 ? 'ghiaccio' : T < ebollizione(P) ? 'liquida' : 'vapore';
}
// L'ACQUA ALLA SUPERFICIE: una fonte sola per il clima, per il mare e per l'interno. «frazione» è la parte della
// massa del pianeta che è acqua (i rocciosi la chiamano «acqua», i ghiacciati «ghiaccio»: è la stessa cosa), «kg»
// quanta ne sta in superficie. In un pianeta roccioso quasi tutta resta sciolta nella roccia del mantello, e fuori
// ne esce qualche centesimo (sulla Terra: gli oceani). In un mondo ghiacciato (più di un quinto di ghiaccio) non
// c'è roccia che la tenga: sta tutta sopra, in un guscio d'acqua o di ghiaccio profondo quanto una parte del raggio.
export const PARTE_FUORI = 0.04; // la parte dell'acqua (e dei gas arrivati con lei) che un pianeta di roccia ha liberato in superficie
export function acquaInSuperficie({ tipo, massaKg = 0, composizione = {} } = {}) {
  if (tipo === 'gassoso') return { frazione: 0, kg: 0 };
  const frazione = composizione.acqua ?? composizione.ghiaccio ?? 0;
  return { frazione, kg: massaKg * frazione * (tipo === 'ghiacciato' ? 1 : PARTE_FUORI) };
}
// ---------- IL CLIMA: UNA LEGGE SOLA, A DUE RISOLUZIONI. Il bilancio di energia di un pianeta (modello di
// Budyko-Sellers): in ogni punto  C·∂T/∂t = luce assorbita − luce irradiata + calore portato dai vicini.
// Qui sotto ci sono i pezzi della legge (quanta luce arriva, quanta ne torna indietro, quanta ne trattiene l'aria,
// quanto calore porta) e la sua soluzione PER FASCE DI LATITUDINE (bilancioPerFasce: una colonna per parallelo, in
// un millisecondo): è il clima che ogni pianeta ha appena esiste (clima()). geologia.js (climaSuperficie) risolve
// LA STESSA legge, con gli stessi pezzi, sulla mappa vera del pianeta (64 × 32, terre e mari dove sono): le due
// temperature medie coincidono entro pochi gradi, e dove non coincidono è per ciò che la mappa ha in più (dove sono
// i continenti; e, quando il pianeta gira, i venti e le nuvole veri di meteo.js al posto dei coefficienti).
export const CLIMA = Object.freeze({
  capacitaTerra: 1e7, capacitaMare: 1e8, // (J/m²/K) quanto calore serve per scaldare di un grado il suolo, e lo strato di mare rimescolato
  albedoTerra: 0.25, albedoMare: 0.08, albedoGhiaccio: 0.62, // la parte di luce rimandata indietro (misurate)
  geloTerra: 268, geloMare: 266, // (K) sotto, la neve e il ghiaccio coprono (e sopra di 4 K non ce n'è più)
  // le nuvole, dove c'è mare che evapora e un'aria che tiene il vapore: coprono fino a 0,63 del cielo (quanto ne esce da
  // meteo.js per la Terra; misurato: 0,67) e rimandano indietro il 30% della luce che le colpisce. TARATO sulla Terra:
  // così riflette in tutto 0,30. Al freddo l'aria tiene meno vapore: quattro decimi delle nuvole
  nuvoleMassime: 0.63, riflessoNuvole: 0.3, nuvoleAlFreddo: 0.4,
  trasporto: 0.6, // (W/m²/K, a 1 bar) il calore che l'aria e il mare portano dal caldo al freddo; cresce come la radice della pressione
  // il rilievo che l'acqua deve coprire: la parte sommersa attesa è 1 − exp(−profondità media / rilievo). TARATO sulle
  // superfici che escono da superficiePianeta: 2 km con le placche (continenti e oceani), mezzo senza
  rilievoPlacche: 2000, rilievoFermo: 500,
});
// la luce media di un giorno (W/m²) a una latitudine, con il sole a una declinazione (radianti): la geometria esatta
export function luceDelGiorno(S0, lat, declinazione) {
  const x = -Math.tan(lat) * Math.tan(declinazione), h0 = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x);
  return (S0 / Math.PI) * (h0 * Math.sin(lat) * Math.sin(declinazione) + Math.cos(lat) * Math.cos(declinazione) * Math.sin(h0));
}
// il ghiaccio ha bisogno di acqua: su un pianeta senza mari al freddo resta solo un po' di brina
export const acquaPerIlGhiaccio = (mare) => (mare > 0 ? Math.min(1, 0.15 + 2.5 * mare) : 0);
// le nuvole attese (0…1 del cielo), dove non c'è una circolazione calcolata: servono mare e un'aria di almeno 0,1 bar
export const nuvoleAttese = (mare, pressione) => (mare > 0.02 && isFinite(pressione) && pressione > 1e4 ? CLIMA.nuvoleMassime * Math.min(1, mare * 2 + 0.3) : 0);
// quanta luce rimanda un punto a temperatura t: il suolo (terra o mare: «mare» vale 0 o 1), il ghiaccio che lo copre
// se fa freddo e c'è acqua, e sopra le nuvole («copertura»: quella vera di meteo.js; se manca, quella attesa)
export function riflette(t, mare, acquaGhiaccio, nuvole, copertura = null) {
  const ghiaccio = acquaGhiaccio * 0.5 * (1 - Math.tanh((t - (mare ? CLIMA.geloMare : CLIMA.geloTerra)) / 4)), suolo = ghiaccio * CLIMA.albedoGhiaccio + (1 - ghiaccio) * (mare ? CLIMA.albedoMare : CLIMA.albedoTerra);
  const cielo = copertura ?? (t > CLIMA.geloTerra ? nuvole : nuvole * CLIMA.nuvoleAlFreddo);
  return suolo + cielo * CLIMA.riflessoNuvole * (1 - suolo);
}
// il calore portato dai vicini (W/m²/K): tanto più quanto più l'aria è densa
export const trasportoCalore = (pressione) => (isFinite(pressione) ? CLIMA.trasporto * Math.pow(Math.max(1e-4, pressione / 1e5), 0.5) : 1);
// L'EFFETTO SERRA: lo spessore ottico dell'aria per la luce infrarossa. La superficie irradia σT⁴/(1 + ¾τ).
// LEGGE EMPIRICA di riserva, quando dell'aria si conosce solo la pressione: τ = 0,8·(p / 1 bar)^0,6 (la Terra: 0,8)
export const serraDaPressione = (pressione) => (isFinite(pressione) ? 0.8 * Math.pow(Math.max(0, pressione) / 1e5, 0.6) : 2);
// IL LIMITE DEL VAPORE (Simpson 1927, Nakajima 1992; il valore è quello dei modelli di Kasting 1993 per la Terra): un'aria
// satura di vapore d'acqua non irradia verso lo spazio più di circa 282 W/m², per quanto calda sia la superficie. Un
// pianeta che ne assorbe di più non trova equilibrio finché ha un mare: l'acqua evapora tutta (è la storia di Venere)
export const LIMITE_VAPORE = 282;
// la parte sommersa attesa di un pianeta con «acquaKg» d'acqua in superficie (prima che la sua mappa esista)
export function mareAtteso({ acquaKg = 0, raggioM, placche = false }) {
  const profondita = acquaKg / 1000 / (4 * Math.PI * raggioM * raggioM);
  return profondita > 0 ? 1 - Math.exp(-profondita / (placche ? CLIMA.rilievoPlacche : CLIMA.rilievoFermo)) : 0;
}
// (una sicurezza del passo nel tempo, uguale alle due risoluzioni: in un passo la temperatura non raddoppia e non si
// dimezza, e sotto i 50 K di salto non si tocca niente; a regime non scatta mai)
export const frenaPasso = (t, dT) => Math.max(-Math.max(50, t / 2), Math.min(Math.max(50, t), dT));
// LA LEGGE RISOLTA PER FASCE. Una colonna per parallelo (per un pianeta bloccato le fasce girano attorno all'asse che
// punta alla stella: il «polo» è il punto sotto il sole). In ogni fascia terra e mare stanno nella proporzione «mare»
// e hanno la stessa temperatura. Il passo nel tempo è quello di climaSuperficie: la luce irradiata linearizzata, il
// calore dei vicini implicito (l'energia si conserva con qualunque passo), i primi anni al rallentatore se il mare ha
// la memoria lunga. → { T (media sul pianeta, K), ghiaccio (0…1), assorbita, irradiata, arriva (W/m²), lat, fasce }
export function bilancioPerFasce({ S0, anno, obliquita = 0, bloccato = false, mare = 0, pressione = 0, tau = 0, D = trasportoCalore(pressione), Tavvio = 288, fasce = 16, anni = 8, passiAnno = 16 }) {
  const H = fasce, sigma = COSTANTI.sigma, serra = 1 + 0.75 * tau, dphi = Math.PI / H, eps = (obliquita * Math.PI) / 180;
  const lat = new Float64Array(H), cosLat = new Float64Array(H), cosN = new Float64Array(H), cosS = new Float64Array(H);
  for (let j = 0; j < H; j++) { lat[j] = Math.PI / 2 - (j + 0.5) * dphi; cosLat[j] = Math.cos(lat[j]); cosN[j] = Math.max(0, Math.cos(lat[j] + dphi / 2)); cosS[j] = Math.max(0, Math.cos(lat[j] - dphi / 2)); }
  const C = mare * CLIMA.capacitaMare + (1 - mare) * CLIMA.capacitaTerra, ghiaccioAcqua = acquaPerIlGhiaccio(mare), nuvole = nuvoleAttese(mare, pressione);
  // la luce rimandata da una fascia: la media di riflette() sulla sua terra e sul suo mare (scritta qui per esteso, con
  // gli stessi numeri: è il conto che si ripete di più; lontano dal gelo la tangente iperbolica vale già −1 o 1)
  const { albedoTerra: aT, albedoMare: aM, albedoGhiaccio: aG, geloTerra: gT, geloMare: gM, riflessoNuvole: rN, nuvoleAlFreddo: nF } = CLIMA;
  const gelo = (t, soglia) => (t > soglia + 80 ? 0 : t < soglia - 80 ? ghiaccioAcqua : ghiaccioAcqua * 0.5 * (1 - Math.tanh((t - soglia) / 4)));
  const albedo = (t) => {
    const cielo = (t > gT ? nuvole : nuvole * nF) * rN; let a = 0;
    if (mare < 1) { const g = gelo(t, gT), suolo = g * aG + (1 - g) * aT; a += (1 - mare) * (suolo + cielo * (1 - suolo)); }
    if (mare > 0) { const g = gelo(t, gM), suolo = g * aG + (1 - g) * aM; a += mare * (suolo + cielo * (1 - suolo)); }
    return a;
  };
  const T = new Float64Array(H).fill(Tavvio), nuovo = new Float64Array(H), media = new Float64Array(H), sole = new Float64Array(H);
  const memoria = (C * serra) / (4 * sigma * Math.max(3, Tavvio / 1.25) ** 3), veri = Math.min(4, anni - 1), totale = anni * passiAnno, lenti = bloccato ? totale : (anni - veri) * passiAnno, dtVero = anno / passiAnno;
  const dtLento = dtVero * Math.max(1, bloccato ? (12 * memoria) / (anni * anno) : (8 * memoria - veri * anno) / ((anni - veri) * anno));
  const sotto = new Float64Array(H), diag = new Float64Array(H), sopra = new Float64Array(H), cp = new Float64Array(H);
  // la luce di ogni fascia in ogni momento dell'anno (si calcola una volta)
  const luci = bloccato ? null : new Float64Array(passiAnno * H);
  if (bloccato) for (let j = 0; j < H; j++) sole[j] = S0 * Math.max(0, Math.sin(lat[j]));
  else for (let f = 0; f < passiAnno; f++) { const del = eps * Math.sin((2 * Math.PI * f) / passiAnno); for (let j = 0; j < H; j++) luci[f * H + j] = luceDelGiorno(S0, lat[j], del); }
  // se alla fine il pianeta irradia ancora più (o meno) di quanto assorbe, non è a regime (il ghiaccio che avanza è
  // lento): si va avanti per altri anni, finché il bilancio torna. (Il passo lento non si allunga oltre: un passo
  // molto più lungo della memoria di una fascia la porterebbe da sola al suo equilibrio, prima che i vicini contino.)
  let assorbita = 0, irradiata = 0, pesi = 0, ghiaccio = 0; const dtAdesso = dtLento;
  for (let giro = 0; giro < 8; giro++) {
  assorbita = 0; irradiata = 0; pesi = 0; ghiaccio = 0; media.fill(0);
  for (let n = 0; n < totale; n++) {
    const ultimo = n >= totale - passiAnno, dt = n < lenti && (giro === 0 || bloccato) ? dtAdesso : dtVero; // (gli anni lenti solo al primo giro: poi anni veri)
    if (!bloccato) { const o = (n % passiAnno) * H; for (let j = 0; j < H; j++) sole[j] = luci[o + j]; }
    for (let j = 0; j < H; j++) {
      const t = T[j], entra = sole[j] * (1 - albedo(t)), esce = (sigma * t * t * t * t) / serra, molla = (4 * esce) / t, dT = frenaPasso(t, (dt * (entra - esce)) / (C + dt * molla));
      nuovo[j] = Math.max(3, t + dT);
      if (ultimo) { assorbita += cosLat[j] * entra; irradiata += cosLat[j] * (esce + molla * dT); pesi += cosLat[j]; }
    }
    // il calore portato dai vicini, da un polo all'altro (tre diagonali)
    const q = (dt * D) / (C * dphi * dphi);
    for (let j = 0; j < H; j++) { sotto[j] = j > 0 ? (-q * cosN[j]) / cosLat[j] : 0; sopra[j] = j < H - 1 ? (-q * cosS[j]) / cosLat[j] : 0; diag[j] = 1 - sotto[j] - sopra[j]; }
    cp[0] = sopra[0] / diag[0]; nuovo[0] /= diag[0];
    for (let j = 1; j < H; j++) { const d = diag[j] - sotto[j] * cp[j - 1]; cp[j] = sopra[j] / d; nuovo[j] = (nuovo[j] - sotto[j] * nuovo[j - 1]) / d; }
    for (let j = H - 2; j >= 0; j--) nuovo[j] -= cp[j] * nuovo[j + 1];
    for (let j = 0; j < H; j++) { T[j] = nuovo[j]; if (ultimo) { media[j] += nuovo[j] / passiAnno; ghiaccio += (cosLat[j] * ghiaccioAcqua * (mare * (nuovo[j] < 271 ? 1 : 0) + (1 - mare) * (nuovo[j] < CLIMA.geloTerra ? 1 : 0))) / passiAnno; } }
  }
  if (Math.abs(irradiata - assorbita) < 0.01 * assorbita) break;
  }
  let Tm = 0, w = 0; for (let j = 0; j < H; j++) { Tm += media[j] * cosLat[j]; w += cosLat[j]; }
  return { T: Tm / w, ghiaccio: ghiaccio / w, assorbita: assorbita / pesi, irradiata: irradiata / pesi, arriva: S0 / 4, lat: Array.from(lat, (x) => (x * 180) / Math.PI), fasce: Array.from(media) };
}
// IL CLIMA DI UN PIANETA: dalla luce della stella, dalla distanza, dalla massa, dall'acqua che ha in superficie,
// da come gira (anno, inclinazione dell'asse, bloccato o no). È il bilancio per fasce qui sopra: la temperatura «T»
// è la media sul pianeta e sull'anno, «albedo» la parte di luce che in tutto rimanda indietro (ghiaccio e nuvole
// compresi), «Teq» la temperatura che avrebbe con quell'albedo e senz'aria. Lo stato dell'acqua viene da T e dalla
// pressione; se è vapore il mare non c'è (l'acqua è nell'aria, o è fuggita) e il bilancio è quello di un mondo asciutto.
//   acqua     la parte della massa che è acqua; acquaKg quanta ne sta in superficie (se manca: acquaInSuperficie)
//   placche   se la crosta è a placche (il rilievo è più alto: a parità d'acqua emerge più terra)
//   aria      { pressione, tau }: la pressione vera dell'aria e la sua serra, quando i gas sono noti (chimica.js,
//             climaEAria); se manca, valgono le leggi di riserva: gas liberati per un milionesimo della massa, e la
//             serra dalla sola pressione
// → { Teq, T, g, pressione, tenuti, acqua, albedo } come sempre, e in più ciò che climaSuperficie deve condividere:
//   tau (la serra), D (il calore portato), Tavvio (da dove parte), mare e ghiaccio attesi, nuvole, bilancio, fasce
export function clima({ Lw, aM, massaKg, raggioM, tipo, acqua = 0, acquaKg = null, anno = null, obliquita = 0, bloccato = false, placche = false, aria = null }) {
  const g = (COSTANTI.G * massaKg) / (raggioM * raggioM), mu = COSTANTI.mp;
  if (tipo === 'gassoso') {
    const albedo = 0.35, Teq = temperaturaEquilibrio(Lw, aM, albedo), tenuti = Object.entries(MOLECOLE).filter(([, m]) => trattiene(massaKg, raggioM, Teq, m * mu)).map(([n]) => n);
    return { Teq, T: Teq * 1.2, g, pressione: Infinity, tenuti, acqua: 'nelle nuvole', albedo };
  }
  // che cosa la gravità trattiene: decide la temperatura dell'aria alta, che non sa del ghiaccio in basso (albedo 0,3)
  const Tnuda = temperaturaEquilibrio(Lw, aM, 0.3), tenuti = Object.entries(MOLECOLE).filter(([, m]) => trattiene(massaKg, raggioM, Tnuda, m * mu)).map(([n]) => n);
  // LEGGE DI RISERVA, quando l'aria vera non è data: i gas liberati dall'interno sono un milionesimo della massa (la
  // Terra: 0,86 milionesimi, cioè 1 bar), un po' di più se c'è molta acqua; se la gravità li trattiene
  const gas = tenuti.includes('azoto') || tenuti.includes('anidride carbonica') ? 1e-6 * massaKg * (0.85 + 3 * acqua) : 0;
  // (oltre τ = 10⁴ l'aria è così spessa che il calore sale per convezione, non per irraggiamento: la serra non cresce più)
  const pressione = aria ? aria.pressione : (gas * g) / (4 * Math.PI * raggioM * raggioM), tau = Math.min(1e4, aria ? aria.tau : serraDaPressione(pressione)), D = trasportoCalore(pressione);
  const S0 = Lw / (4 * Math.PI * aM * aM), periodo = anno ?? ANNO * Math.pow(aM / UA, 1.5), kg = acquaKg ?? acquaInSuperficie({ tipo, massaKg, composizione: { acqua } }).kg;
  // si parte caldo (un pianeta nasce caldo e si raffredda), ma non più di un quarto sopra dove lo porterebbe la sola luce
  // (e sotto un'aria spessa, da dove la porta la serra)
  const Tserra = Math.max(3, Tnuda * Math.pow(1 + 0.75 * tau, 0.25)), Tavvio = Lw > 0 ? Math.max(Tnuda, Math.min(310, 1.25 * Tserra), Tserra) : 3;
  const risolvi = (mare) => (S0 > 0 ? bilancioPerFasce({ S0, anno: periodo, obliquita, bloccato, mare, pressione, tau, D, Tavvio }) : { T: 3, ghiaccio: mare > 0 ? 1 : 0, assorbita: 0, irradiata: 0, arriva: 0, lat: [], fasce: [] });
  let mare = acqua > 0 ? mareAtteso({ acquaKg: kg, raggioM, placche }) : 0, b = risolvi(mare);
  // lo stato dell'acqua: dalla temperatura e dalla pressione; e in ogni caso vapore se il pianeta assorbe più luce di quanta
  // un'aria satura di vapore riesca a irradiare (LIMITE_VAPORE): allora il mare evapora tutto, qualunque sia la serra
  const stato = acqua > 0 ? (b.assorbita > LIMITE_VAPORE ? 'vapore' : statoAcqua(b.T, pressione)) : 'assente';
  if (mare > 0 && stato.startsWith('vapore')) { mare = 0; b = risolvi(0); }
  const albedo = b.arriva > 0 ? 1 - b.assorbita / b.arriva : 0.3, Teq = temperaturaEquilibrio(Lw, aM, albedo);
  return { Teq, T: b.T, g, pressione, tenuti, acqua: stato, albedo, tau, D, Tavvio, mare, ghiaccio: b.ghiaccio, nuvole: nuvoleAttese(mare, pressione), bilancio: { assorbita: b.assorbita, irradiata: b.irradiata, arriva: b.arriva }, fasce: { lat: b.lat, T: b.fasce } };
}
