// nucleo.js — IL MOTORE 3D DEL MONDO: il nucleo che tutti i livelli usano (pianeta, sistema, galassia, cosmo).
//
// L'esplorazione non è una mappa vista da sopra: è uno spazio in cui ci si muove. Qui c'è ciò che serve a qualunque
// scala, e niente che appartenga a un livello solo. WebGL2 scritto a mano, nessuna libreria, nessuno stato globale.
//
// ───────────────────────────── LE IDEE ─────────────────────────────
//  · I CORPI e i loro RIFERIMENTI. Un corpo è { nome, genitore, raggio, posizione(t, out), assetto(t, out) }:
//    `posizione` dà in METRI il vettore dal centro del genitore al suo centro, negli assi inerziali (gli stessi per
//    tutti: non ruotano); `assetto` dà la matrice 3×3 che porta dagli assi del corpo (che gira) a quelli inerziali.
//    Tutto in doppia precisione sulla CPU. La camera è ATTACCATA a un corpo: la sua posizione è riferita a lui, e ne
//    eredita il moto (l'orbita sempre; la rotazione quando è «solidale», cioè vicina al suolo).
//    Un corpo può anche essere solo un RIFERIMENTO (un sistema dentro la galassia, una galassia nel cosmo): con `assi`
//    (3×3 per righe, o una funzione del tempo) dice come sono girati, rispetto al riferimento in cui sta lui, gli assi
//    in cui sono date le posizioni e gli assetti dei suoi figli. Con `influenza` (metri) dice fin dove la camera, entrando,
//    si attacca a lui: il passaggio da un livello all'altro è solo questo cambio di riferimento, la camera resta dov'è.
//  · L'ORIGINE MOBILE. Alla scheda grafica non arrivano mai coordinate assolute: di ogni cosa si calcola in doppia
//    precisione il vettore occhio → cosa (risalendo l'albero dei corpi fino all'antenato comune), e solo quello diventa
//    un numero a 32 bit. Così un sasso a due metri e una stella a cento miliardi di chilometri stanno nella stessa scena.
//  · LA PROFONDITÀ LOGARITMICA. Il frammento scrive log₂(1 + distanza): la stessa precisione relativa (2 parti su un
//    milione) a un metro e a un miliardo di chilometri; nessun piano vicino o lontano da regolare, nessuno sfarfallio.
//    Chi disegna usa i due pezzi GLSL_PROFONDITA_V / GLSL_PROFONDITA_F.
//  · IL TEMPO è una variabile del mondo: `tempo.t` in secondi veri dell'universo, `tempo.velocita` secondi del mondo
//    per secondo di chi guarda (1, un giorno, un anno…), `tempo.pausa`. Tutto ciò che si muove lo legge da lì.
//  · LA LUCE. Le luminanze sono in unità in cui 1 è un foglio bianco opaco illuminato in pieno dalla stella del corpo a
//    cui si è attaccati; l'immagine si disegna in virgola mobile (una stella vale decine di migliaia, la notte millesimi)
//    e alla fine L'OCCHIO (OCCHIO, qui sotto) e una curva di tonalità la portano sullo schermo. L'occhio si adatta da sé
//    alla luce che misura nell'immagine (la luminanza media; non sotto la sua soglia assoluta), o lo si fissa (vista.occhio).
//    In S.E0 c'è l'irradianza (W/m²) che vale «1» in questo fotogramma: quella che l'occhio sceglie; finché non ha misurato
//    niente, quella che gli strati propongono (S.proponiLuce(E): la luce della stella dove si è; tra le stelle, il flusso
//    delle più brillanti). Ognuno moltiplica la sua luce per S.espo(E) = E / E0. In S.adattamento: { LA (cd/m²), D (il grado
//    di adattamento al colore), coni (1: fotopico, 0: scotopico) }.
//  · I BERSAGLI. Ogni strato può dire che cosa c'è da raggiungere (S.bersaglio({ p, raggio, corpo, nodo })): la rotella porta
//    verso quello che sta sotto il cursore (`nodo`: il corpo nel cui riferimento sta ferma, se non è un corpo lei), il volo
//    con i tasti va veloce quanto è lontana la cosa più vicina; `vaiA` vola fino a una cosa (il volo «vai a»).
//  · GLI STRATI. Chi disegna si aggiunge come strato: { nome, aggiorna(S), disegna(S, passata), dopo(S, da, a), sopra(S),
//    libera() }, tutti facoltativi. Le passate: 'fondo' (il cielo lontano, senza profondità), 'solido' (ciò che copre),
//    'velato' (ciò che è trasparente, mescolato sopra); poi `dopo` può riscrivere l'immagine intera (l'aria: legge
//    colore e profondità di ciò che c'è dietro); infine la tonalità, e `sopra` (scritte, misure).
//
// ───────────────────────────── L'USO ─────────────────────────────
//   const N = creaNucleo(tela, { alCambio });
//   const sole = N.corpo({ nome: 'stella', raggio, posizione: (t, o) => …, luce: { colore: [r, g, b] } });
//   const terra = N.corpo({ nome, genitore: sole, raggio, posizione, assetto, quota: (dir) => raggio del suolo lungo dir,
//                           colpisci: (o, d) => distanza del suolo lungo il raggio,     // (tutto negli assi del corpo)
//                           verticale: (p) => versore, lonLat: (p) => [lon, lat], punto: (lon, lat, quota) => p });  // se è schiacciato
//   N.aggiungi(strato);  N.attacca(terra, { distanza: 3 * raggio });  N.avvia();
//   N.tempo.velocita = 86400;                     // un giorno al secondo
// Lo stato S che ogni strato riceve: { gl, t, dt, W, H, proj, vista (mondo → occhio, 3×3), fc (per la profondità),
//   tanX, tanY, fuoco (pixel), camera, versoCorpo(corpo, out) (occhio → centro, metri, doppia precisione), visione (l'occhio
//   di Ferwerda e gli strumenti: { LA, G, Lscena, Lmedia, Lmax, sottoSoglia }),
//   assetto(corpo) (3×3), stella (il corpo che illumina), versoStella (unitario), E0, LA, adattamento, quota (dal suolo) }.

// ---------- piccola algebra, in doppia precisione (vettori [x, y, z], matrici 3×3 per righe)
export const V = {
  somma: (a, b, o = [0, 0, 0]) => { o[0] = a[0] + b[0]; o[1] = a[1] + b[1]; o[2] = a[2] + b[2]; return o; },
  meno: (a, b, o = [0, 0, 0]) => { o[0] = a[0] - b[0]; o[1] = a[1] - b[1]; o[2] = a[2] - b[2]; return o; },
  per: (a, k, o = [0, 0, 0]) => { o[0] = a[0] * k; o[1] = a[1] * k; o[2] = a[2] * k; return o; },
  scal: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  vett: (a, b, o = [0, 0, 0]) => { const x = a[1] * b[2] - a[2] * b[1], y = a[2] * b[0] - a[0] * b[2], z = a[0] * b[1] - a[1] * b[0]; o[0] = x; o[1] = y; o[2] = z; return o; },
  lungo: (a) => Math.hypot(a[0], a[1], a[2]),
  norma: (a, o = [0, 0, 0]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; return o; },
  // matrice · vettore, trasposta · vettore, matrice · matrice
  mv: (m, a, o = [0, 0, 0]) => { const x = m[0] * a[0] + m[1] * a[1] + m[2] * a[2], y = m[3] * a[0] + m[4] * a[1] + m[5] * a[2], z = m[6] * a[0] + m[7] * a[1] + m[8] * a[2]; o[0] = x; o[1] = y; o[2] = z; return o; },
  tv: (m, a, o = [0, 0, 0]) => { const x = m[0] * a[0] + m[3] * a[1] + m[6] * a[2], y = m[1] * a[0] + m[4] * a[1] + m[7] * a[2], z = m[2] * a[0] + m[5] * a[1] + m[8] * a[2]; o[0] = x; o[1] = y; o[2] = z; return o; },
  mm: (a, b) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]; return o; },
  trasposta: (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]],
  identita: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
  // la rotazione di un angolo attorno a un asse unitario (formula di Rodrigues)
  giro: (asse, ang) => { const [x, y, z] = asse, c = Math.cos(ang), s = Math.sin(ang), k = 1 - c; return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k]; },
  // la rotazione più breve che porta il versore a sul versore b
  porta: (a, b) => { const asse = V.vett(a, b), s = V.lungo(asse), c = V.scal(a, b); if (s < 1e-12) return V.identita(); return V.giro(V.per(asse, 1 / s), Math.atan2(s, c)); },
};

// ---------- i pezzi di GLSL per la profondità logaritmica (dopo aver scritto gl_Position; u_fc = 2 / log₂(lontano + 1))
export const GLSL_PROFONDITA_V = `
  v_w = 1.0 + gl_Position.w;
  gl_Position.z = (log2(max(1e-6, v_w)) * u_fc - 1.0) * gl_Position.w;`;
export const GLSL_PROFONDITA_F = `
  gl_FragDepth = log2(max(1e-6, v_w)) * u_fc * 0.5;`;
// (dalla profondità letta nell'immagine alla distanza lungo l'asse dell'occhio: w = 2^(2·d / u_fc) − 1)

// il colore di un corpo nero alla temperatura T (K), in rosso-verde-blu lineari, con il massimo a 1
// (approssimazione del luogo di Planck di Krystek 1985 per la cromaticità, poi la matrice sRGB)
export function coloreCorpoNero(T) {
  const t = Math.max(1000, Math.min(40000, T)), u = (0.860117757 + 1.54118254e-4 * t + 1.28641212e-7 * t * t) / (1 + 8.42420235e-4 * t + 7.08145163e-7 * t * t), v = (0.317398726 + 4.22806245e-5 * t + 4.20481691e-8 * t * t) / (1 - 2.89741816e-5 * t + 1.61456053e-7 * t * t);
  const x = (3 * u) / (2 * u - 8 * v + 4), y = (2 * v) / (2 * u - 8 * v + 4), X = x / y, Z = (1 - x - y) / y;
  const c = [3.2406 * X - 1.5372 - 0.4986 * Z, -0.9689 * X + 1.8758 + 0.0415 * Z, 0.0557 * X - 0.204 + 1.057 * Z].map((q) => Math.max(0, q)), m = Math.max(...c) || 1;
  return c.map((q) => q / m);
}

// ---------- L'OCCHIO (INTRECCIO.md, regola 14: anche il rivelatore è fisica). Ciò che decide come un'immagine in luce
// vera arriva allo schermo, con la legge da cui viene. La vista normale è un occhio umano vero: il buio resta buio.
//  · la LUMINANZA DI ADATTAMENTO L_A: la media LOGARITMICA della luminanza della scena attorno al punto fissato (il centro
//    dello schermo), pesata con una gaussiana di OCCHIO.campo (4°: la fovea e la parafovea pesano di più; i bordi del campo
//    poco), sopra una griglia 32×32 di tutta l'immagine (ogni casella la media di tutti i suoi punti). Le caselle più buie
//    di un centesimo della media (aritmetica, con gli stessi pesi) non la tirano più giù (il nero tra le stelle non è un
//    numero: la luce che entra nell'occhio è quella della media, e il buio attorno non può contare più di lei). L_A non
//    scende sotto la SOGLIA ASSOLUTA della visione, ~10⁻⁶ cd/m² (Hecht, Shlaer & Pirenne 1942).
//  · come L_A SI MUOVE: piano e senza salti, una dinamica del primo ordine in log L_A. Verso il chiaro l'adattamento è
//    nervoso e svelto: τ = 0,1 s per i coni, 0,4 s per i bastoncelli (i valori di Krawczyk, Myszkowski & Seidel 2005);
//    verso il buio, finché si resta sopra il campo mesopico (5 cd/m²: solo coni, pigmenti poco sbiancati) è ancora svelto,
//    τ = 1 s (dichiarato: dell'ordine di Crawford 1947); più giù è la rigenerazione dei pigmenti, lenta: τ ≈ 110 s per i
//    coni, 400 s per i bastoncelli (Rushton; come in Pattanaik et al. 2000). Tra i due si pesa col peso dei coni. Nei primi OCCHIO.apertura secondi si parte già
//    adattati al luogo (τ = 0,1 s nei due versi).
//  · la RISPOSTA: le soglie di visibilità di FERWERDA, PATTANAIK, SHIRLEY & GREENBERG 1996 («A model of visual adaptation
//    for realistic image synthesis»): t_p(L_A) dei coni e t_s(L_A) dei bastoncelli (cd/m², le loro funzioni a tratti in
//    log₁₀). Una luminanza L del mondo va sullo schermo come L_d = m_p·L_p + k·m_s·L_s, con m_p = t_p(L_da)/t_p(L_A),
//    m_s = t_p(L_da)/t_s(L_A): un passo appena visibile del mondo diventa un passo appena visibile dello schermo. L_da è
//    l'adattamento di chi guarda lo schermo, metà del suo massimo (OCCHIO.Lda = 50 cd/m² di 100: dichiarato), e va al
//    grigio medio della percezione: chiarezza CIE L* = 50, Y = ((50 + 16)/116)³ = 0,184 dopo la curva di tonalità. L_p è la
//    luminanza a colori, L_s quella scotopica, Y′ = Y·(1,33·(1 + (Y + Z)/X) − 1,68) (Larson, Rushmeier & Piatko 1997),
//    riportata al bianco D65; k va da 1 a 0 attraverso il campo MESOPICO, da 0,005 a 5 cd/m² (CIE 191:2010), in log L_A.
//    Così al buio i colori spariscono da sé (m_p è cento volte più piccolo di m_s) e ciò che sta sotto la soglia resta nero.
//  · gli STRUMENTI (il visore, src/visore/strumenti.js) stanno DAVANTI all'occhio: l'amplificatore di luce moltiplica la
//    luce della scena di un fattore G prima che arrivi all'occhio (vista.occhio.amplificatore), come un intensificatore o
//    una posa lunga mostrata sullo schermo dello strumento. G porta la LUCE MEDIA della regione inquadrata (la media
//    aritmetica di tutto il campo: il flusso che arriva diviso l'angolo solido, ∝ j̄·w per una regione larga w con
//    emissività media j̄) a OCCHIO.amplificato cd/m² (G ≥ 1: non attenua mai) e la segue con una costante di tempo,
//    OCCHIO.tauAmp: dipende dalla scala e dalla luce della regione, non dal fotogramma. (Con la media logaritmica del
//    centro, come l'occhio, una galassia che esce dal centro faceva salire G di 18 volte in mezza decade di zoom, e la
//    nebbia della ragnatela compariva di colpo; la luce media scende come w⁻² e la nebbia sale piano.) Acceso e spento, G cambia con la stessa costante: niente scatti. Chi guarda lo
//    schermo dello strumento sta in una stanza illuminata (come per CIECAM02, qui sotto): l'occhio si adatta alla stanza,
//    L_da, non al nero dell'immagine; così la media della regione resta scura (4 cd/m² su 50: il fondo di una posa lunga)
//    e ciò che è più chiaro di lei si vede, senza il velo grigio di un occhio che porta sempre la scena al grigio medio.
//  · le candele: dalla luce (W) alla luminanza (cd/m²) con l'efficacia luminosa della luce che illumina,
//    K = 683 lm/W · π∫B_λ(T)·ȳ(λ)dλ / (σT⁴) — il corpo nero della stella del luogo (fuori da un sistema quella del Sole,
//    5772 K, l'unità di buconero.js); ȳ nella forma analitica di Wyman, Sloan & Shirley 2013 (come buconero.js);
//  · l'ADATTAMENTO AL COLORE: von Kries verso il bianco della luce che illumina (la stella del luogo; sotto un'aria, la luce
//    che arriva dove sta l'occhio, se lo strato del pianeta la propone: S.proponiBianco), di quanto dice
//    CIECAM02: D = F·[1 − (1/3,6)·e^((−L_A − 42)/92)], F = 1 (chi guarda lo schermo in una stanza illuminata:
//    dichiarato). Fatto nei primari sRGB, non nello spazio dei coni CAT02 (dichiarato).
// L'ESPOSIZIONE DI CALCOLO (S.E0) è un'altra cosa: l'unità in cui gli strati scrivono la luce nell'immagine a 16 bit, che
// segue la luce del centro (le quattro caselle di mezzo, ~2–3°: la fovea) perché i numeri restino dentro ciò che il formato
// tiene. Non decide più che cosa si vede: la tonalità la riporta in cd/m² e poi fa l'occhio.
// SCELTE RIMASTE (dichiarate): la curva di tonalità (Narkowicz 2015, un'approssimazione di ACES: manca la risposta dei
// fotorecettori al posto suo); l'abbagliamento è l'alone di luci.js, non la diffusione nell'occhio (CIE 135); il campo
// di 4° e il pavimento di un centesimo della media nella media logaritmica.
export const OCCHIO = { soglia: 1e-6, grigioL: ((50 + 16) / 116) ** 3, mesopico: [0.005, 5], F: 1, TSole: 5772, fovea: (2 * Math.PI) / 180,
  campo: (4 * Math.PI) / 180, pavimento: 1e-2, Lda: 50, tauChiaro: [0.4, 0.1], tauBuio: [400, 110], tauConi: 1, apertura: 2, // ([bastoncelli, coni], secondi)
  amplificato: 4, tauAmp: 1.5, Gmax: 1e16 }; // (l'amplificatore: la media della regione portata a 4 cd/m², seguita in 1,5 s)
// la curva di tonalità (la stessa del frammento in fondo) e il valore che lei porta al grigio medio
export const tonalita = (x) => Math.max(0, Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
export const X_MEDIO = (() => { let a = 0, b = 10; for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b); if (tonalita(m) < OCCHIO.grigioL) a = m; else b = m; } return 0.5 * (a + b); })();
// l'efficacia luminosa (lm/W) di un corpo nero a T
const _efficacia = new Map();
export function efficaciaLuminosa(T) {
  const k = Math.round(T); if (_efficacia.has(k)) return _efficacia.get(k);
  const h = 6.62607015e-34, c = 299792458, kB = 1.380649e-23, sigma = 5.670374419e-8, campana = (l, mu, s1, s2) => { const t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  let Y = 0; for (let nm = 360.5; nm < 830; nm += 1) { const l = nm * 1e-9, e = (h * c) / (l * kB * k), B = e > 700 ? 0 : (2 * h * c * c) / (l ** 5 * Math.expm1(e)); Y += B * (0.821 * campana(nm, 568.8, 46.9, 40.5) + 0.286 * campana(nm, 530.9, 16.3, 31.1)) * 1e-9; }
  const K = (683 * Math.PI * Y) / (sigma * k ** 4); _efficacia.set(k, K); return K;
}
// il grado di adattamento al colore (CIECAM02) e il peso dei coni (1: fotopico, 0: scotopico) a una luminanza di adattamento
export const gradoAdattamento = (LA) => Math.max(0, Math.min(1, OCCHIO.F * (1 - (1 / 3.6) * Math.exp((-LA - 42) / 92))));
export const pesoConi = (LA) => Math.max(0, Math.min(1, Math.log(Math.max(LA, 1e-30) / OCCHIO.mesopico[0]) / Math.log(OCCHIO.mesopico[1] / OCCHIO.mesopico[0])));
// l'irradianza «che vale 1» (W/m²: la luce di un foglio bianco) che l'occhio adattato a L_A sceglie: L_A va al grigio medio
export const E0Adattato = (LA, K) => (Math.PI * Math.max(LA, OCCHIO.soglia)) / (K * X_MEDIO);
// LE SOGLIE DI FERWERDA et al. 1996 (cd/m²): il più piccolo aumento di luminanza visibile su uno sfondo L_A, per i coni
// (fotopica) e per i bastoncelli (scotopica); le loro forme a tratti in log₁₀
export const sogliaFotopica = (LA) => { const x = Math.log10(Math.max(LA, 1e-30)); return 10 ** (x <= -2.6 ? -0.72 : x >= 1.9 ? x - 1.255 : (0.249 * x + 0.65) ** 2.7 - 0.72); };
export const sogliaScotopica = (LA) => { const x = Math.log10(Math.max(LA, 1e-30)); return 10 ** (x <= -3.94 ? -2.86 : x >= -1.44 ? x - 0.395 : (0.405 * x + 1.6) ** 2.18 - 2.86); };
// i fattori dell'occhio adattato a L_A: L_d = mP·L_p + k·mS·L_s (cd/m² sullo schermo)
export function fattoriOcchio(LA) { const td = sogliaFotopica(OCCHIO.Lda); return { mP: td / sogliaFotopica(LA), mS: td / sogliaScotopica(LA), k: 1 - pesoConi(LA) }; }
// quanto si vede, sullo schermo, una luminanza L (cd/m²) per un occhio adattato a L_A, in passi appena visibili dello schermo
export const passiVisibili = (L, LA) => { const f = fattoriOcchio(LA); return ((f.mP + f.k * f.mS) * L) / sogliaFotopica(OCCHIO.Lda); };
// UN PASSO DELL'OCCHIO E DEGLI STRUMENTI DAVANTI A LUI (dt secondi): `oc` è il suo stato ({ t, lnG, lnLA }), `Lscena` la
// media logaritmica attorno al punto fissato (cd/m², senza strumenti: per l'occhio), `Lmedia` la luce media di tutto il
// campo (per l'amplificatore), `amplifica` se l'amplificatore è acceso. Niente dipende dal fotogramma: tutto segue con le
// sue costanti di tempo.
export function passoOcchio(oc, Lscena, dt, amplifica, Lmedia = Lscena) {
  if (!(Lscena > 0)) return oc; oc.t = (oc.t || 0) + dt;
  const lnGv = amplifica && Lmedia > 0 ? Math.log(Math.min(OCCHIO.Gmax, Math.max(1, OCCHIO.amplificato / Lmedia))) : 0;
  if (!Number.isFinite(oc.lnG)) oc.lnG = 0; oc.lnG += (lnGv - oc.lnG) * (1 - Math.exp(-dt / OCCHIO.tauAmp));
  // (con lo strumento acceso l'occhio guarda il suo schermo, in una stanza illuminata: si adatta alla stanza, L_da, o alla
  // scena amplificata se è più chiara. Spento, alla scena)
  const lnV = Math.log(Math.max(OCCHIO.soglia, Math.exp(oc.lnG) * Lscena, amplifica ? OCCHIO.Lda : 0));
  if (!Number.isFinite(oc.lnLA)) oc.lnLA = lnV;
  else {
    // (verso il buio: dentro il campo dei soli coni, sopra il mesopico, in fretta — OCCHIO.tauConi —; sotto, coi pigmenti)
    const c = pesoConi(Math.exp(oc.lnLA)), lnM = Math.log(OCCHIO.mesopico[1]); let tau, lnT = lnV;
    if (oc.t < OCCHIO.apertura) tau = 0.1;
    else if (lnV > oc.lnLA) tau = OCCHIO.tauChiaro[0] + (OCCHIO.tauChiaro[1] - OCCHIO.tauChiaro[0]) * c;
    else if (oc.lnLA > lnM) { tau = OCCHIO.tauConi; lnT = Math.max(lnV, lnM - 0.1); }
    else tau = OCCHIO.tauBuio[0] + (OCCHIO.tauBuio[1] - OCCHIO.tauBuio[0]) * c;
    oc.lnLA += (lnT - oc.lnLA) * (1 - Math.exp(-dt / tau)); }
  oc.G = Math.exp(oc.lnG); oc.LA = Math.exp(oc.lnLA); return oc;
}

// un colore lineare portato a luminanza 1 (Rec. 709)
export const luminanzaUno = (c) => { const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] || 1; return c.map((x) => x / y); };

export function creaNucleo(tela, opzioni = {}) {
  const O = {
    fov: 0.75, // l'angolo di campo verticale (radianti)
    densita: 0, // pixel veri per pixel della pagina (0: quella dello schermo, al più 2)
    esposizione: 0, // 0: si regola da sé sulla luce che c'è; altrimenti il fattore fisso
    quotaSolidale: 1.0, // sotto questa quota (in raggi del corpo) la camera gira col corpo; sopra, lo vede girare
    quotaMinima: 1.8, // metri: la camera non scende sotto questa altezza dal suolo
    interazione: true, alCambio: null, alFuori: null, distanzaFuori: 40, // oltre tanti raggi dal corpo si chiama alFuori
    ...opzioni,
  };
  const gl = tela.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!O.conserva });
  if (!gl) throw new Error('mondo3d: questo programma non riesce a creare un contesto WebGL2');
  const conVirgola = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  gl.getExtension('OES_texture_float_linear');

  // ---------- attrezzi per chi disegna
  function programma(v, f, posti = {}) {
    const fai = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, '#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n' + src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('mondo3d: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((r, i) => `${i + 1}: ${r}`).join('\n')); return s; };
    const p = gl.createProgram(), sv = fai(gl.VERTEX_SHADER, v), sf = fai(gl.FRAGMENT_SHADER, f); gl.attachShader(p, sv); gl.attachShader(p, sf);
    for (const [nome, i] of Object.entries(posti)) gl.bindAttribLocation(p, i, nome);
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('mondo3d: ' + gl.getProgramInfoLog(p));
    gl.deleteShader(sv); gl.deleteShader(sf);
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nome = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nome] = gl.getUniformLocation(p, nome); }
    return { p, u };
  }
  // un'immagine: formato 'rgba8' | 'rgba16f' | 'rg32f' | 'rg16f' | 'r8' | 'profondita'
  const FORMATI = { rgba8: [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], rgba16f: [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT], rgba16fDaFloat: [gl.RGBA16F, gl.RGBA, gl.FLOAT], rg32f: [gl.RG32F, gl.RG, gl.FLOAT], rgba32f: [gl.RGBA32F, gl.RGBA, gl.FLOAT], rg16f: [gl.RG16F, gl.RG, gl.FLOAT], r8: [gl.R8, gl.RED, gl.UNSIGNED_BYTE], profondita: [gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT] };
  // (`mip`: con le copie rimpicciolite, per le immagini che si guardano anche da lontano — senza, più punti dell'immagine
  // che punti dello schermo fanno un reticolo che non c'è)
  // (l'immagine nuova si lega a un'unità di servizio, l'ultima, che nessun programma legge: legata all'unità attiva
  // prenderebbe il posto di ciò che un programma sta leggendo lì — se poi si disegna proprio su di lei, la scheda rifiuta
  // il disegno («feedback loop») e resta ciò che c'era: così l'aria a camera ferma restava nera, vedi pianeta.js)
  const UNITA_SERVIZIO = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1;
  function immagine(w, h, formato = 'rgba8', dati = null, { filtro = gl.LINEAR, ripeti = false, mip = false } = {}) {
    const attiva = gl.getParameter(gl.ACTIVE_TEXTURE); gl.activeTexture(gl.TEXTURE0 + UNITA_SERVIZIO);
    const t = gl.createTexture(), [interno, forma, tipo] = FORMATI[formato]; gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, forma, tipo, dati);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    if (mip && dati) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    const bordo = ripeti === true ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, ripeti === 'x' ? gl.REPEAT : bordo); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, bordo);
    gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(attiva);
    return t;
  }
  const telaio = (colore, profondita) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colore, 0); if (profondita) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, profondita, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return f; };
  const lega = (unita, t, u) => { gl.activeTexture(gl.TEXTURE0 + unita); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u, unita); };
  // un triangolo che copre lo schermo (per le passate sull'immagine intera): v_uv da 0 a 1
  const V_SCHERMO = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const vuoto = gl.createVertexArray();
  const schermo = () => { gl.bindVertexArray(vuoto); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  // ---------- i corpi
  const corpi = [];
  // IL TEMPO CHE UN CORPO MOSTRA (INTRECCIO.md, regola 11: sopra il limite di Nyquist si mostra la media, non
  // l'istantanea). Un corpo può dire i suoi periodi (`periodi: { giro, orbita }`, secondi): quando il mondo corre tanto
  // che in un fotogramma farebbe più di un quarto di giro — lo si vedrebbe saltare a caso —, quel suo moto si ferma
  // alla fase che aveva; `N.mediato(corpo, 'giro' | 'orbita')` lo dice a chi disegna (che mostra la media: l'orbita
  // intera al posto del punto, il mare senza le onde). Tornando lenti riprende dalla fase vera di quell'istante.
  let passoMondo = 0; // secondi del mondo per fotogramma
  const tVisto = (c, quale, t) => { const T = c.periodi && c.periodi[quale]; if (!T || passoMondo * 4 < T) { if (c._fermo) c._fermo[quale] = null; return t; } const f = c._fermo || (c._fermo = {}); if (f[quale] == null) f[quale] = t; return f[quale]; };
  const mediato = (c, quale) => !!(c && c._fermo && c._fermo[quale] != null);
  function corpo(def) {
    const c = { nome: '', genitore: null, raggio: 1, posizione: null, assetto: null, assi: null, influenza: 0, quota: null, colpisci: null, verticale: null, luce: null, ...def, profondita: 0 };
    for (let g = c.genitore; g; g = g.genitore) c.profondita++;
    corpi.push(c); return c;
  }
  const _p = [0, 0, 0], _q = [0, 0, 0], quadri = new Map(); let tQuadri = NaN;
  // come sono girati, negli assi del mondo (quelli della radice), gli assi in cui un corpo dà posizioni e assetti dei figli
  function quadro(c, t) {
    if (!c) return null; if (t !== tQuadri) { quadri.clear(); tQuadri = t; } let m = quadri.get(c); if (m !== undefined) return m;
    const sopra = quadro(c.genitore, t), suoi = c.assi ? (typeof c.assi === 'function' ? c.assi(t) : c.assi) : null;
    m = suoi ? (sopra ? V.mm(sopra, suoi) : suoi) : sopra; quadri.set(c, m); return m;
  }
  // il vettore dal centro di a al centro di b (assi del mondo), risalendo fino all'antenato comune: i numeri grandi dei
  // livelli sopra non entrano mai nel conto di due cose vicine
  function tra(a, b, t, out = [0, 0, 0]) {
    let ox = 0, oy = 0, oz = 0, x = a, y = b;
    const passo = (c, segno) => { if (!c.posizione) return; c.posizione(tVisto(c, 'orbita', t), _p); const m = quadro(c.genitore, t), v = m ? V.mv(m, _p, _q) : _p; ox += segno * v[0]; oy += segno * v[1]; oz += segno * v[2]; };
    while (x !== y) { if (x && (!y || x.profondita >= y.profondita)) { passo(x, -1); x = x.genitore; } else { passo(y, 1); y = y.genitore; } }
    out[0] = ox; out[1] = oy; out[2] = oz; return out;
  }

  // ---------- il tempo del mondo
  const tempo = { t: O.t0 || 0, velocita: 1, pausa: false, ritmo: 1 };
  // LO STATO DELLA VISTA. `cono`: ciò che si vede è il passato — ogni cosa lontana è disegnata dov'era quando è partita
  // la luce che arriva adesso (t − distanza/c); false: la sezione «adesso», tutto allo stesso istante (per confrontare).
  // `passi`: quanti campioni per raggio nei volumi attraversati dallo sguardo (volumi.js); `riduzione`: di quanto è più
  // piccola, per lato, l'immagine su cui li si disegna. Sono la qualità (e il costo): si possono cambiare in ogni momento.
  // `accumulo` (accumulo.js): gli strati che costano fanno a ogni fotogramma `passi` campioni, sfasati in modo diverso
  // ogni volta, e li sommano alla storia dei fotogrammi prima riportata con il moto della camera: a camera ferma la media
  // arriva a `ferma` fotogrammi (come `ferma` volte i passi), in moto si ferma a `moto`; la storia si scarta dove la
  // distanza che ricorda si scosta più di `tolleranza` (relativa) da quella che dovrebbe avere; a camera ferma i passi
  // diventano `passiFerma` volte tanti, e a storia piena non si calcola più niente (l'immagine è quella). Spento: ogni fotogramma
  // fa da sé (e allora i passi vanno alzati: 64 e 56 erano quelli di prima). Il buco nero: un pixel su quattro
  // per fotogramma. L'aria del pianeta: a camera ferma si calcola una volta sola.
  // `vuoto`: sotto quale frazione della luce più forte del suo anello (e A_V per raggio) una cella della galassia è vuota e il
  // raggio la salta (volumi.js; 0: niente salto).
  const vista = { cono: O.cono !== false, passi: { galassia: 48, ragnatela: 48 }, riduzione: 2, accumulo: { attivo: O.accumulo !== false, ferma: 64, moto: 4, tolleranza: 0.15, passiFerma: 2 }, vuoto: 1e-4, occhio: { adatta: O.adatta !== false, E0: 0, amplificatore: false } }, C_LUCE = 299792458;
  // (`occhio`: l'esposizione dell'occhio — vedi OCCHIO in cima —; `adatta: false` lascia l'unità a ciò che gli strati
  // propongono, come prima; `E0` > 0 la fissa, W/m², per le prove; `amplificatore`: lo strumento davanti all'occhio)

  // ---------- la camera: attaccata a un corpo; pos e assi (colonne: destra, su, dietro) nel riferimento del corpo
  // (i suoi assi che girano se «solidale», altrimenti gli assi inerziali centrati su di lui)
  const cam = { corpo: null, solidale: false, pos: [0, 0, 1], assi: V.identita(), fov: O.fov, perno: null };
  const assettoDi = (c, t) => { if (!c || !c.assetto) return V.identita(); const a = c.assetto(tVisto(c, 'giro', t), new Array(9)), m = quadro(c.genitore, t); return !a ? V.identita() : m ? V.mm(m, a) : a; };
  const quotaSuolo = (c, dirCorpo) => (c.quota ? c.quota(dirCorpo) : c.raggio);
  // la verticale del luogo (per un corpo schiacciato non è la direzione del centro: il corpo la dà con `verticale`)
  const suDi = (p) => (cam.corpo && cam.corpo.verticale ? cam.corpo.verticale(p) : V.norma(p));
  // posizione e assi della camera negli assi del corpo che girano, all'istante t (e ritorno)
  function nelCorpo(t) { if (cam.solidale) return { p: cam.pos.slice(), a: cam.assi.slice() }; const A = assettoDi(cam.corpo, t), At = V.trasposta(A); return { p: V.mv(At, cam.pos), a: V.mm(At, cam.assi) }; }
  function dalCorpo(c, t) { if (cam.solidale) { cam.pos = c.p; cam.assi = c.a; } else { const A = assettoDi(cam.corpo, t); cam.pos = V.mv(A, c.p); cam.assi = V.mm(A, c.a); } }
  // gli assi senza rollio: «su» è la verticale del luogo
  function assiDa(avanti, verticale, destraPrima = null) {
    let d = V.vett(avanti, verticale); if (V.lungo(d) < 1e-6) d = destraPrima || V.vett(avanti, [0, 1, 0]); d = V.norma(d);
    const su = V.vett(d, avanti), ind = V.per(avanti, -1); return [d[0], su[0], ind[0], d[1], su[1], ind[1], d[2], su[2], ind[2]];
  }
  const colonna = (m, k) => [m[k], m[3 + k], m[6 + k]];
  // quando si passa la soglia della quota, la camera cambia riferimento restando dov'è
  function scegliRiferimento(t) {
    const c = cam.corpo; if (!c) return; const solidale = !!c.assetto && !!c.quota && V.lungo(cam.pos) - c.raggio < O.quotaSolidale * c.raggio;
    if (solidale === cam.solidale) return; const A = assettoDi(c, t);
    if (solidale) { const At = V.trasposta(A); cam.pos = V.mv(At, cam.pos); cam.assi = V.mm(At, cam.assi); } else { cam.pos = V.mv(A, cam.pos); cam.assi = V.mm(A, cam.assi); }
    cam.solidale = solidale;
  }
  // non si attraversa il suolo
  function sopraIlSuolo(c) { if (!cam.corpo.quota && !cam.corpo.solido) return V.lungo(c.p); const r = V.lungo(c.p), dir = V.per(c.p, 1 / (r || 1)), suolo = quotaSuolo(cam.corpo, dir), minima = cam.corpo.quota ? O.quotaMinima : suolo * 0.02; if (r < suolo + minima) c.p = V.per(dir, suolo + minima); return r - suolo; }
  // cambiare il corpo a cui si è attaccati restando dove si è (stessa posizione, stesso sguardo): è il passaggio di livello
  function riattacca(nuovo) {
    const c = cam.corpo; if (!c || nuovo === c) return; const t = tempo.t, A = cam.solidale ? assettoDi(c, t) : null, p = A ? V.mv(A, cam.pos) : cam.pos, d = tra(nuovo, c, t);
    cam.pos = [p[0] + d[0], p[1] + d[1], p[2] + d[2]]; if (A) cam.assi = V.mm(A, cam.assi); cam.corpo = nuovo; cam.solidale = false; cam.perno = null; scegliRiferimento(t);
  }
  // il corpo più piccolo, tra quelli che dichiarano un'influenza, dentro la cui influenza sta l'occhio
  function scegliCorpo() {
    if (!O.attaccoDaSe || !cam.corpo) return; const t = tempo.t, A = cam.solidale ? assettoDi(cam.corpo, t) : null, p = A ? V.mv(A, cam.pos) : cam.pos; let meglio = null;
    for (const c of corpi) { if (!(c.influenza > 0)) continue; const d = tra(c, cam.corpo, t), dist = Math.hypot(d[0] + p[0], d[1] + p[1], d[2] + p[2]); if (dist < c.influenza * (c === cam.corpo ? 1.15 : 1) && (!meglio || c.influenza < meglio.influenza)) meglio = c; }
    if (!meglio) { meglio = cam.corpo; while (meglio.genitore) meglio = meglio.genitore; } if (meglio !== cam.corpo) { const prima = cam.corpo; riattacca(meglio); if (O.alPassaggio) O.alPassaggio(meglio, prima); }
  }
  function attacca(c, { distanza = null, lon = 0, lat = 0, guarda = true } = {}) {
    cam.corpo = c; cam.solidale = false; const d = distanza ?? 3 * c.raggio, cl = Math.cos(lat), dir = [cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)];
    const A = assettoDi(c, tempo.t); cam.pos = V.mv(A, V.per(dir, d)); if (guarda) cam.assi = assiDa(V.norma(V.per(cam.pos, -1)), V.mv(A, [0, 1, 0])); scegliRiferimento(tempo.t); cambia();
  }
  // il raggio dell'occhio per un punto della tela (pixel della pagina), negli assi del corpo che girano
  function raggio(x, y, c) { const tY = Math.tan(cam.fov / 2), tX = (tY * tela.clientWidth) / Math.max(1, tela.clientHeight), a = ((x / tela.clientWidth) * 2 - 1) * tX, b = (1 - (y / tela.clientHeight) * 2) * tY; return V.norma(V.mv(c.a, [a, b, -1])); }
  // dove il raggio tocca il corpo (assi del corpo): la distanza, o Infinity
  function tocca(o, d) {
    const c = cam.corpo; if (c.colpisci) return c.colpisci(o, d);
    if (!c.solido) return Infinity; const b = -V.scal(o, d), q = b * b - V.scal(o, o) + c.raggio * c.raggio; return q < 0 || b - Math.sqrt(q) < 0 ? Infinity : b - Math.sqrt(q);
  }
  const quota = () => (cam.corpo ? V.lungo(cam.pos) - quotaSuolo(cam.corpo, V.norma(nelCorpo(tempo.t).p)) : 0);

  // --- i gesti (tutti lavorano negli assi del corpo e poi riportano la camera nel suo riferimento)
  // ---------- LA ROTELLA: lo zoom di un gesto (rapporto «Navigazione e resa per stateyour», adozioni 1 e 2)
  // Prima il bersaglio si sceglieva a ogni scatto tra le cose dell'ultimo fotogramma, la camera andava verso il suo centro
  // e la nuova distanza era max(d·k, 1,25 R): due scatti di fila potevano puntare a due cose diverse (la camera sbandava
  // di lato), e dentro il bordo di una cosa il passo diventava negativo (avvicinandosi si arretrava).
  // Ora: un GESTO è una serie di scatti senza pause più lunghe di ZOOM.pausa (ms; e di tre fotogrammi: se i fotogrammi sono
  // lenti gli scatti arrivano a grappoli, e una pausa del filo non è una pausa della mano). Al primo scatto si sceglie la cosa
  // sotto il cursore e il punto P del raggio del cursore più vicino al suo centro, e restano fermi fino alla fine (se sotto
  // il cursore non c'è niente: la cosa più vicina che si vede, e P sull'asse della vista). Ogni scatto aggiunge log k a
  // una velocità in log(distanza), che i fotogrammi consumano con un'inerzia (ZOOM.tau, s) e un limite per fotogramma
  // (ZOOM.limite); la camera va lungo la retta camera–P, che non gira: P resta fermo sullo schermo. Avvicinandosi la
  // distanza da P non cresce mai — nuova = min(d, max(d − d_s·(1 − k), pavimento)), il pavimento a ZOOM.bordo raggi dal
  // centro —, allontanandosi non cala mai. Arrivati al pavimento il gesto prosegue verso ciò che c'è dentro o dietro (la
  // cosa raggiunta non è più una meta). La velocità d_s: la distanza da P mescolata con quella della cosa più vicina che si
  // incontra sulla via (Gaia Sky 2025: d_s = mix(d_vicino, d_P, a), qui con a = log₁₀(d_vicino / d_P) + 1 tra 0 e 1):
  // una cosa che si attraversa rallenta lo zoom invece di essere scavalcata (quelle accanto alla via no: farebbero strisciare),
  // ma al più di dieci volte: andando verso una stella con un'altra sulla via, si avanzava come verso quella, cioè sempre
  // più piano, e la si raggiungeva solo dopo cento scatti.
  const ZOOM = { pausa: 200, tau: 0.06, limite: 0.35, bordo: 1.25 };
  let gesto = null;
  // il nome di un bersaglio (per riconoscerlo da un fotogramma all'altro)
  const nomeBersaglio = (b) => (b.corpo ? b.corpo.nome : b.stella != null ? `stella ${b.galassia}/${b.stella}` : b.galassia != null ? `galassia ${b.galassia}` : 'una cosa');
  const raggiunta = (b) => V.lungo(b.p) <= ZOOM.bordo * 1.04 * b.raggio;
  // il bersaglio (tra quelli detti dagli strati nell'ultimo fotogramma) sotto il raggio dW (assi del mondo): entro 18
  // pixel, o grande abbastanza da coprirlo; prima quelli che lo coprono, poi i più vicini al raggio e all'occhio.
  // `daRaggiungere`: solo le cose al cui bordo non si è ancora arrivati
  function bersaglioSotto(dW, { esclusi = null, daRaggiungere = false } = {}) {
    let meglio = null, vm = Infinity; const tol = (18 * 2 * Math.tan(cam.fov / 2)) / Math.max(1, tela.clientHeight);
    for (const b of S.bersagli) { const lungo = V.scal(b.p, dW); if (lungo <= 0 || (daRaggiungere && raggiunta(b)) || (esclusi && esclusi.has(nomeBersaglio(b)))) continue;
      const fuori = Math.hypot(b.p[0] - dW[0] * lungo, b.p[1] - dW[1] * lungo, b.p[2] - dW[2] * lungo), largo = Math.max(b.raggio, tol * lungo); if (fuori > largo) continue;
      const v = fuori / largo + (b.raggio > tol * lungo ? -1 : 0) + 1e-3 * Math.log10(lungo); if (v < vm) { vm = v; meglio = b; } }
    return meglio;
  }
  // la cosa più vicina (dal suo bordo) tra quelle che si vedono davanti lungo av, ancora da raggiungere
  function vicinaDavanti(av, esclusi = null) {
    let meglio = null, dm = Infinity; const lim = Math.tan(cam.fov / 2) * Math.max(1, tela.clientWidth / Math.max(1, tela.clientHeight));
    for (const b of S.bersagli) { const lungo = V.scal(b.p, av); if (lungo <= 0 || raggiunta(b) || (esclusi && esclusi.has(nomeBersaglio(b)))) continue; const d = V.lungo(b.p) - b.raggio;
      const fuori = Math.hypot(b.p[0] - av[0] * lungo, b.p[1] - av[1] * lungo, b.p[2] - av[2] * lungo); if (fuori > lim * lungo) continue;
      const v = d * (1 + (4 * fuori) / (lim * lungo)); if (v < dm) { dm = v; meglio = b; } } // (a parità, quella più vicina all'asse: P le passa accanto meno)
    return meglio;
  }
  // la distanza (dal bordo) della cosa più vicina sulla via: davanti lungo av, prima di `fin` metri, e tanto vicina alla
  // retta da attraversarla o sfiorarla (entro tre raggi); 0 se non ce n'è
  function vicinoSullaVia(av, fin) {
    let dm = Infinity;
    for (const b of S.bersagli) { const lungo = V.scal(b.p, av); if (lungo <= 0 || lungo > fin) continue; const d = V.lungo(b.p) - b.raggio; if (d <= 0 || d >= dm) continue;
      if (Math.hypot(b.p[0] - av[0] * lungo, b.p[1] - av[1] * lungo, b.p[2] - av[2] * lungo) <= 3 * b.raggio) dm = d; }
    return isFinite(dm) ? dm : 0;
  }
  const occhioOra = () => (cam.solidale ? V.mv(assettoDi(cam.corpo, tempo.t), cam.pos) : cam.pos.slice()); // (l'occhio dal centro del suo corpo, assi del mondo)
  // dove si VEDE adesso la cosa di un gesto: la si ritrova tra i bersagli dell'ultimo fotogramma (col cono di luce una stella
  // lontana si vede dov'era: avvicinandosi il ritardo cala e lei si sposta — da trecentomila anni luce, di diecimila UA —;
  // un punto fermo nel riferimento della galassia non è lei). Se non c'è più: il punto fermo C nel riferimento `rif`
  const stesso = (a, b) => (a.corpo || b.corpo ? a.corpo === b.corpo : a.stella === b.stella && a.galassia === b.galassia);
  function vistoOra(g) { const L = S.bersagli; if (!g.b) return null; if (g.i < L.length && stesso(L[g.i], g.b)) return L[g.i].p; for (let i = 0; i < L.length; i++) if (stesso(L[i], g.b)) { g.i = i; return L[i].p; } return null; }
  function verso(g) { const q = vistoOra(g); if (q) return q.slice(); return versoFermo(g); }
  // dove sta adesso (occhio → cosa, assi del mondo) un punto C fermo nel riferimento di un corpo (in uno spazio che si
  // richiude — un corpo con `periodo`, il lato: il cosmo — l'immagine più vicina)
  function versoFermo(g) { const o = occhioOra(), d = tra(cam.corpo, g.rif, tempo.t), v = [d[0] + g.C[0] - o[0], d[1] + g.C[1] - o[1], d[2] + g.C[2] - o[2]], L = g.rif.periodo;
    if (L > 0 && cam.corpo === g.rif) for (let i = 0; i < 3; i++) v[i] -= Math.round(v[i] / L) * L; return v; }
  // la scelta all'inizio di un gesto (segno < 0: avvicinarsi). `soloSotto`: niente ripiego sulla cosa più vicina
  function scegliGesto(x, y, segno, { esclusi = new Set(), soloSotto = false } = {}) {
    const c = nelCorpo(tempo.t), d = raggio(x, y, c), A = assettoDi(cam.corpo, tempo.t), dW = V.mv(A, d);
    const g = { x, y, segno, esclusi, vel: 0, ultimo: performance.now(), tipo: 'libero', asse: dW, nome: null, arrivato: false };
    if (isFinite(tocca(c.p, d))) { g.tipo = 'suolo'; g.rif = cam.corpo; g.nome = 'suolo ' + cam.corpo.nome; return g; } // (il corpo solido sotto il cursore: P è il punto toccato)
    let asse = dW, b = bersaglioSotto(dW, { esclusi, daRaggiungere: segno < 0 });
    if (!b && segno < 0 && !soloSotto) { asse = V.mv(A, V.per(colonna(c.a, 2), -1)); b = vicinaDavanti(asse, esclusi); }
    if (!b) return g;
    // P: il punto dell'asse più vicino al centro della cosa (la camera che va verso P si avvicina anche al centro), se l'asse
    // la attraversa; se le passa accanto (una cosa più piccola di un pixel, presa entro i 18), il suo centro: se no ci si
    // passerebbe accanto senza arrivarci
    const lungo = V.scal(b.p, asse), rif = b.corpo || b.nodo || cam.corpo; let P = [asse[0] * lungo - b.p[0], asse[1] * lungo - b.p[1], asse[2] * lungo - b.p[2]], f = V.lungo(P);
    if (f > b.raggio) { P = [0, 0, 0]; f = 0; }
    Object.assign(g, { tipo: 'bersaglio', b, nome: nomeBersaglio(b), rif, R: b.raggio, P, asse, C: b.corpo ? [0, 0, 0] : V.somma(V.somma(tra(rif, cam.corpo, tempo.t), occhioOra()), b.p),
      pavimento: Math.max(Math.sqrt(Math.max(0, (ZOOM.bordo * b.raggio) ** 2 - f * f)), 0.05 * f, 1e-6 * b.raggio) });
    return g;
  }
  // un passo del gesto: L = log k (< 0 avvicinandosi)
  function passoGesto(L) {
    const g = gesto, k = Math.exp(L), c = nelCorpo(tempo.t), su0 = suDi(c.p), corpo0 = cam.corpo, A = assettoDi(cam.corpo, tempo.t); let dist = NaN, nuova = NaN;
    if (g.tipo === 'suolo') {
      const d = raggio(g.x, g.y, c), s = cam.corpo === g.rif ? tocca(c.p, d) : Infinity; if (!isFinite(s)) { g.arrivato = true; return; } // (non è più sotto il cursore: si sceglie di nuovo)
      dist = s; nuova = s * k; const Q = V.somma(c.p, V.per(d, s)); c.p = V.somma(Q, V.per(V.meno(c.p, Q), k)); cam.perno = null;
    } else if (g.tipo === 'bersaglio') {
      const w = verso(g), Pv = V.somma(w, g.P); dist = V.lungo(Pv);
      if (L < 0 && dist <= g.pavimento * 1.0001) { g.esclusi.add(g.nome); g.arrivato = true; return; } // arrivati: si prosegue dentro
      let ds = dist; g.dc = 0; if (L < 0) { const dc = (g.dc = vicinoSullaVia(V.per(Pv, 1 / dist), dist)); if (dc > 0 && dc < dist) ds = Math.max(0.1 * dist, mescola(dc, dist)); }
      else ds = indietro(g, S.vicinoM > 0 && S.vicinoM < dist ? mescola(S.vicinoM, dist) : dist, k, dist);
      nuova = L < 0 ? Math.min(dist, Math.max(dist - ds * (1 - k), g.pavimento)) : Math.max(dist, dist + ds * (k - 1));
      c.p = V.somma(c.p, V.tv(A, V.per(Pv, 1 - nuova / dist))); cam.perno = V.somma(c.p, V.tv(A, V.per(Pv, nuova / dist)));
    } else { // niente in vista: lungo il raggio del cursore, al passo della cosa più vicina
      const dentro = cam.corpo.genitore ? V.lungo(c.p) : 0, h0 = cam.corpo.quota || cam.corpo.solido ? Math.max(V.lungo(c.p) - cam.corpo.raggio, cam.corpo.raggio * 0.05) : S.vicinoM || dentro || 1, h = L > 0 ? indietro(g, h0, k, Infinity) : h0;
      dist = h; nuova = h * k; c.p = V.somma(c.p, V.per(V.tv(A, g.asse), h * (1 - k)));
    }
    if (N.registro) N.registro.push({ id: g.nome || 'niente', tipo: g.tipo, dist, nuova, dc: g.dc, pav: g.pavimento });
    if (!O.attaccoDaSe) { const lim = O.distanzaFuori * cam.corpo.raggio; if (V.lungo(c.p) > lim) { c.p = V.per(V.norma(c.p), lim); if (L > 0 && O.alFuori) O.alFuori(); } }
    if (cam.corpo.quota) c.a = V.mm(V.porta(su0, suDi(c.p)), c.a); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t); scegliCorpo(); if (cam.corpo !== corpo0) cam.perno = null;
  }
  // la mescolanza di Gaia Sky: d_vicino quando è molto più vicina (un decimo o meno), d quando è lontana quanto lei
  const mescola = (dv, d) => dv + Math.max(0, Math.min(1, Math.log10(dv / d) + 1)) * (d - dv);
  // ALLONTANANDOSI il passo parte dalla scala di ciò che si ha vicino (dal suolo di un pianeta non si salta d'un colpo alla
  // galassia che lo contiene) e cresce di k a ogni passo del gesto, senza tornare indietro (dentro una galassia la stella
  // più vicina resta a un anno luce: col suo solo passo si uscirebbe dopo migliaia di scatti)
  function indietro(g, base, k, max) { const ds = Math.min(max, Math.max(base, (g.dsPrima || 0) * k)); g.dsPrima = ds; return ds; }
  // a ogni fotogramma: la parte della velocità che tocca a questo fotogramma (l'inerzia, in log della distanza)
  function avanzaZoom(dt) {
    let g = gesto; if (!g) return;
    if (g.arrivato) { const n = scegliGesto(g.x, g.y, g.segno, { esclusi: g.esclusi }); n.vel = g.vel; n.ultimo = g.ultimo; n.fotogrammi = g.fotogrammi; n.dsPrima = g.dsPrima; gesto = g = n; }
    g.fotogrammi = (g.fotogrammi || 0) + 1; if (Math.abs(g.vel) < 1e-4) { g.vel = 0; if (finito(g)) gesto = null; return; }
    let L = g.vel * (dt > 0 ? 1 - Math.exp(-dt / ZOOM.tau) : 1); L = Math.max(-ZOOM.limite, Math.min(ZOOM.limite, L)); if (Math.abs(g.vel - L) < 1e-4) L = g.vel; g.vel -= L; passoGesto(L);
  }
  // uno scatto della rotella in (x, y): k < 1 avvicina, k > 1 allontana
  function avvicina(x, y, k) {
    if (volo) fermaVolo(); const L = Math.log(k), segno = L < 0 ? -1 : 1, ora = performance.now();
    if (!gesto || gesto.segno !== segno || finito(gesto, ora)) { const resto = gesto && gesto.segno === segno ? gesto.vel : 0; gesto = scegliGesto(x, y, segno); gesto.vel = resto; }
    gesto.ultimo = ora; gesto.fotogrammi = 0; gesto.vel += L; cambia();
  }
  const finito = (g, ora = performance.now()) => ora - g.ultimo > ZOOM.pausa && g.fotogrammi >= 3;
  const fermaZoom = () => { gesto = null; };
  // la cosa a cui porterebbe la rotella in (x, y) — quella del gesto in corso, o del volo —: { b, nome, p (occhio → centro), raggio }
  function mira(x, y) {
    if (volo) return { b: volo.b, nome: volo.nome, p: verso(volo), raggio: volo.raggio, volo: true };
    if (gesto && !gesto.arrivato) return gesto.tipo === 'bersaglio' ? { b: gesto.b, nome: gesto.nome, p: verso(gesto), raggio: gesto.R, fermo: true } : null;
    if (!(x >= 0)) return null; const g = scegliGesto(x, y, -1); return g.tipo === 'bersaglio' ? { b: g.b, nome: g.nome, p: g.b.p, raggio: g.R } : null;
  }
  // la cosa sotto (x, y) (per il doppio clic): un bersaglio, o il corpo solido a cui si è attaccati, o null
  function cosaSotto(x, y) { const g = scegliGesto(x, y, -1, { soloSotto: true }); return g.tipo === 'bersaglio' ? g.b : g.tipo === 'suolo' ? { corpo: cam.corpo, raggio: cam.corpo.raggio } : null; }

  // ---------- IL VOLO «VAI A» (adozione 4). La traiettoria è quella di van Wijk & Nuij 2003 (ρ = √2, la preferita da chi
  // guarda): il punto guardato va dritto dalla partenza alla cosa, la larghezza della vista w sale finché si vedono
  // entrambe e poi scende; nella forma di Reach & North 2018 senza cancellazioni, log(√(b²+1) − b) = −asinh(b), e con il
  // tempo addolcito agli estremi (la velocità parte e arriva a zero senza salti). Prima del punto più alto si conta nel
  // riferimento della partenza, dopo in quello dell'arrivo (la seconda metà è la stessa curva percorsa all'indietro): il
  // cambio d'ancora sta lassù, dove le due cose sono piccole e i numeri grandi non toccano nessuna delle due. Lo sguardo
  // gira verso la meta nella prima metà, sempre con lo stesso «su» (niente rollio); si arriva a `arrivo` metri dal centro.
  // Si ferma con la rotella o con un clic. meta: { rif (un corpo), C (dal suo centro, assi del mondo), arrivo, raggio, nome, b,
  // fine(arrivato: true; fermato: false) }
  const RHO = Math.SQRT2; let volo = null;
  function vaiA({ rif, C = [0, 0, 0], arrivo, raggio: R = 0, nome = '', b = null, fine = null }) {
    fermaVolo(); gesto = null; const t = tempo.t, F0 = cam.corpo, o = occhioOra(), assi = cam.solidale ? V.mm(assettoDi(F0, t), cam.assi) : cam.assi.slice();
    const av0 = V.per(colonna(assi, 2), -1), c1 = V.somma(tra(F0, rif, t), C);
    // quanto lontano si guarda alla partenza: la cosa più vicina davanti (o il centro del corpo a cui si è attaccati, se è più
    // vicino; mai oltre la meta): la vista larga quanto lei
    let D0 = Math.min(F0.genitore ? V.lungo(o) : Infinity, V.lungo(V.meno(c1, o))); for (const q of S.bersagli) if (V.scal(q.p, av0) > 0) D0 = Math.min(D0, V.lungo(q.p)); if (!(D0 > 0 && isFinite(D0))) D0 = Math.max(1, arrivo);
    const tY = Math.tan(cam.fov / 2); cam.pos = o; cam.assi = assi; cam.solidale = false; cam.perno = null;
    volo = { F0, rif, C: C.slice(), m0: V.somma(o, V.per(av0, D0)), w0: 2 * tY * D0, w1: 2 * tY * arrivo, av0, su: colonna(assi, 1), dir1: V.norma(V.meno(c1, o)), raggio: R, nome, b, fine, t0: performance.now() };
    volo.dur = 1000 * Math.max(2, Math.min(5, 1.2 + 0.2 * curva(volo).S)); cambia(); return volo;
  }
  // i numeri della curva, con la meta dov'è adesso (nel riferimento della partenza)
  function curva(v) {
    const c1 = V.somma(tra(v.F0, v.rif, tempo.t), v.C), dx = V.meno(c1, v.m0), d1 = V.lungo(dx), w0 = v.w0, w1 = v.w1, r2 = RHO * RHO;
    if (d1 < 1e-9 * Math.max(w0, w1)) return { dx, d1, piatta: true, S: Math.abs(Math.log(w1 / w0)) / RHO };
    const b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d1 * d1) / (2 * w0 * r2 * d1), b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d1 * d1) / (2 * w1 * r2 * d1), r0 = -Math.asinh(b0), r1 = -Math.asinh(b1);
    return { dx, d1, r0, r1, S: (r1 - r0) / RHO };
  }
  // da a verso b (versori), per la frazione f dell'angolo (con `asse` se sono opposti)
  function ruota(a, b, f, asse) { const c = Math.max(-1, Math.min(1, V.scal(a, b))), ang = Math.acos(c); if (ang < 1e-9) return a.slice(); let ax = V.vett(a, b); if (V.lungo(ax) < 1e-9) ax = asse; return V.mv(V.giro(V.norma(ax), ang * f), a); }
  function passoVolo() {
    const v = volo, q = Math.min(1, (performance.now() - v.t0) / v.dur), e = q * q * (3 - 2 * q), k = curva(v); let F, m, w;
    if (k.piatta) { w = v.w0 * Math.pow(v.w1 / v.w0, e); if (v.w1 > v.w0 && e < 1) { F = v.F0; m = V.somma(v.m0, V.per(k.dx, e)); } else { F = v.rif; m = V.somma(v.C, V.per(k.dx, e - 1)); } }
    else { const s = e * k.S, alto = Math.max(0, Math.min(k.S, -k.r0 / RHO));
      if (s <= alto && q < 1) { const ch = Math.cosh(k.r0), u = (v.w0 / (RHO * RHO * k.d1)) * (ch * Math.tanh(RHO * s + k.r0) - Math.sinh(k.r0)); F = v.F0; m = V.somma(v.m0, V.per(k.dx, u)); w = (v.w0 * ch) / Math.cosh(RHO * s + k.r0); }
      else { const r0 = -k.r1, s2 = k.S - s, ch = Math.cosh(r0), u = (v.w1 / (RHO * RHO * k.d1)) * (ch * Math.tanh(RHO * s2 + r0) - Math.sinh(r0)); F = v.rif; m = V.somma(v.C, V.per(k.dx, -u)); w = (v.w1 * ch) / Math.cosh(RHO * s2 + r0); } }
    const g = Math.min(1, 2 * e), dir = ruota(v.av0, v.dir1, g * g * (3 - 2 * g), v.su), D = w / (2 * Math.tan(cam.fov / 2));
    cam.corpo = F; cam.solidale = false; cam.pos = V.meno(m, V.per(dir, D)); cam.assi = assiDa(dir, v.su); cam.perno = null;
    if (q >= 1) { volo = null; scegliRiferimento(tempo.t); scegliCorpo(); if (cam.corpo === v.rif) cam.perno = V.tv(assettoDi(v.rif, tempo.t), v.C); if (v.fine) v.fine(true); }
  }
  function fermaVolo() { const v = volo; if (!v) return; volo = null; scegliRiferimento(tempo.t); scegliCorpo(); if (v.fine) v.fine(false); }
  // trascinare: il punto afferrato segue il cursore (il corpo gira sotto la mano)
  let presa = null;
  function afferra(x, y) { const c = nelCorpo(tempo.t), d = raggio(x, y, c), s = tocca(c.p, d); presa = isFinite(s) ? { c, G: V.somma(c.p, V.per(d, s)), x, y } : { c, G: null, x, y }; }
  function trascina(x, y) {
    if (!presa) return; const c0 = presa.c;
    if (!presa.G) { (cam.corpo.quota ? guarda : orbitaLibera)((x - presa.x) * -0.004, (y - presa.y) * (cam.corpo.quota ? -0.003 : 0.004)); presa.x = x; presa.y = y; return; }
    const d = raggio(x, y, c0), R = V.lungo(presa.G), b = -V.scal(c0.p, d), q = b * b - V.scal(c0.p, c0.p) + R * R; if (q < 0) return;
    const G1 = V.somma(c0.p, V.per(d, b - Math.sqrt(q))), M = V.porta(V.norma(G1), V.norma(presa.G)), c = { p: V.mv(M, c0.p), a: V.mm(M, c0.a) };
    sopraIlSuolo(c); dalCorpo(c, tempo.t); cambia();
  }
  // guardarsi attorno: girare la testa (dx) e alzare o abbassare lo sguardo (dy), in radianti
  function guarda(dx, dy) {
    if (!cam.corpo.quota) return guardaLibero(dx, dy);
    const c = nelCorpo(tempo.t), su = suDi(c.p), av = V.per(colonna(c.a, 2), -1), destra = colonna(c.a, 0);
    let a2 = V.mv(V.giro(su, dx), av); const d2 = V.mv(V.giro(su, dx), destra), alza = Math.asin(Math.max(-1, Math.min(1, V.scal(a2, su))));
    a2 = V.mv(V.giro(d2, Math.max(-1.55 - alza, Math.min(1.55 - alza, dy))), a2); c.a = assiDa(a2, su, d2); dalCorpo(c, tempo.t); cambia();
  }
  // nello spazio: girare attorno al perno (l'ultima cosa verso cui ci si è avvicinati, o il centro del riferimento)
  function orbitaLibera(dx, dy) {
    const c = nelCorpo(tempo.t), perno = cam.perno || [0, 0, 0], su = colonna(c.a, 1), M1 = V.giro(su, dx), d2 = V.mv(M1, colonna(c.a, 0)), M = V.mm(V.giro(d2, -dy), M1);
    c.p = V.somma(perno, V.mv(M, V.meno(c.p, perno))); c.a = V.mm(M, c.a); sopraIlSuolo(c); dalCorpo(c, tempo.t); cambia();
  }
  // guardarsi attorno nello spazio: la camera gira su sé stessa
  function guardaLibero(dx, dy) { const c = nelCorpo(tempo.t), M1 = V.giro(colonna(c.a, 1), dx), M = V.mm(V.giro(V.mv(M1, colonna(c.a, 0)), dy), M1); c.a = V.mm(M, c.a); dalCorpo(c, tempo.t); cambia(); }
  // orbitare attorno al punto che sta al centro dello schermo
  function orbita(dx, dy) {
    if (!cam.corpo.quota) return orbitaLibera(dx, -dy);
    const c = nelCorpo(tempo.t), av = V.per(colonna(c.a, 2), -1), s = tocca(c.p, av), h = Math.max(1, V.lungo(c.p) - quotaSuolo(cam.corpo, V.norma(c.p)));
    const Q = V.somma(c.p, V.per(av, isFinite(s) ? s : h)), suQ = suDi(Q), destra = colonna(c.a, 0);
    let M = V.giro(suQ, dx); const braccio = V.mv(M, V.meno(c.p, Q)), d2 = V.mv(M, destra), el = Math.asin(Math.max(-1, Math.min(1, V.scal(V.norma(braccio), suQ))));
    const M2 = V.giro(d2, -Math.max(0.02 - el, Math.min(1.55 - el, dy))); M = V.mm(M2, M);
    c.p = V.somma(Q, V.mv(M2, braccio)); c.a = assiDa(V.norma(V.meno(Q, c.p)), suDi(c.p), V.mv(M2, d2)); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t); cambia();
  }
  // volare: avanti, di lato, in su (frazioni della quota al secondo)
  function vola(avanti, lato, su, dt) {
    const c = nelCorpo(tempo.t), terra = !!cam.corpo.quota, su0 = terra ? suDi(c.p) : colonna(c.a, 1);
    // il passo: quanto si è alti sul suolo, o (nello spazio) quanto è lontana la cosa più vicina
    const h = terra ? Math.max(2, V.lungo(c.p) - quotaSuolo(cam.corpo, V.norma(c.p))) : Math.max(1, Math.min(S.vicinoM || Infinity, cam.corpo.solido ? V.lungo(c.p) - cam.corpo.raggio : Infinity, S.vicinoM ? Infinity : V.lungo(c.p) || 1)), passo = h * dt;
    const av = V.per(colonna(c.a, 2), -1), de = colonna(c.a, 0);
    c.p = [c.p[0] + (av[0] * avanti + de[0] * lato + su0[0] * su) * passo, c.p[1] + (av[1] * avanti + de[1] * lato + su0[1] * su) * passo, c.p[2] + (av[2] * avanti + de[2] * lato + su0[2] * su) * passo];
    if (!O.attaccoDaSe) { const lim = O.distanzaFuori * cam.corpo.raggio; if (V.lungo(c.p) > lim) { c.p = V.per(V.norma(c.p), lim); if (O.alFuori) O.alFuori(); } }
    if (terra) c.a = V.mm(V.porta(su0, suDi(c.p)), c.a); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t); scegliCorpo();
  }
  // mettersi sopra un punto del corpo: longitudine e latitudine (radianti), quota (m), verso cui si guarda e inclinazione
  function vai({ lon, lat, quota: h = 1000, direzione = 0, alza = -0.4 }) {
    const c = cam.corpo, cl = Math.cos(lat), rad = [cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)], est = [-Math.sin(lon), 0, -Math.cos(lon)];
    // (su un corpo schiacciato longitudine e latitudine sono quelle della sua carta: il punto e la verticale li dà lui)
    const p0 = c.punto ? c.punto(lon, lat, h) : V.per(rad, quotaSuolo(c, rad) + h), su = suDi(p0), nord = V.norma(V.vett(su, est));
    const oriz = [nord[0] * Math.cos(direzione) + est[0] * Math.sin(direzione), nord[1] * Math.cos(direzione) + est[1] * Math.sin(direzione), nord[2] * Math.cos(direzione) + est[2] * Math.sin(direzione)];
    const av = V.norma([oriz[0] * Math.cos(alza) + su[0] * Math.sin(alza), oriz[1] * Math.cos(alza) + su[1] * Math.sin(alza), oriz[2] * Math.cos(alza) + su[2] * Math.sin(alza)]);
    const k = { p: p0, a: assiDa(av, su, V.vett(oriz, su)) }; cam.solidale = !!c.assetto && h < O.quotaSolidale * c.raggio; dalCorpo(k, tempo.t); cambia();
  }
  // dove si è: longitudine, latitudine (radianti), quota dal suolo, direzione dello sguardo
  function dove() { const c = nelCorpo(tempo.t), r = V.lungo(c.p), rad = V.per(c.p, 1 / r), su = suDi(c.p), av = V.per(colonna(c.a, 2), -1), g = cam.corpo.lonLat ? cam.corpo.lonLat(c.p) : [Math.atan2(-rad[2], rad[0]), Math.asin(rad[1])], lon = g[0], lat = g[1], est = [-Math.sin(lon), 0, -Math.cos(lon)], nord = V.vett(su, est);
    return { lon, lat, quota: r - quotaSuolo(cam.corpo, rad), distanza: r, direzione: Math.atan2(V.scal(av, est), V.scal(av, nord)), alza: Math.asin(Math.max(-1, Math.min(1, V.scal(av, su)))) }; }
  // che cosa c'è sotto un punto della tela: { lon, lat, distanza } sul corpo a cui si è attaccati, o null
  function sotto(x, y) { const c = nelCorpo(tempo.t), d = raggio(x, y, c), s = tocca(c.p, d); if (!isFinite(s)) return null; const p = V.somma(c.p, V.per(d, s)), q = V.norma(p), g = cam.corpo.lonLat ? cam.corpo.lonLat(p) : [Math.atan2(-q[2], q[0]), Math.asin(q[1])]; return { lon: g[0], lat: g[1], distanza: s }; }

  // ---------- gli strati e le immagini su cui si disegna
  const strati = []; let imm = null;
  const aggiungi = (s) => { strati.push(s); if (s.prepara) s.prepara(N); cambia(); return s; };
  // togliere un corpo (e i suoi figli) dall'albero: se la camera gli era attaccata passa, restando dov'è, a suo padre
  function togliCorpo(c) {
    if (!c) return; const via = new Set([c]); for (let giro = 0, cambiato = true; cambiato && giro < 20; giro++) { cambiato = false; for (const x of corpi) if (x.genitore && via.has(x.genitore) && !via.has(x)) { via.add(x); cambiato = true; } }
    if (via.has(cam.corpo)) { let su = c.genitore; while (su && via.has(su)) su = su.genitore; if (su) riattacca(su); }
    for (let i = corpi.length - 1; i >= 0; i--) if (via.has(corpi[i])) corpi.splice(i, 1);
  }
  const togli = (s) => { const i = strati.indexOf(s); if (i >= 0) { strati.splice(i, 1); if (s.libera) s.libera(); } };
  function preparaImmagini() {
    const W = tela.width, H = tela.height; if (imm && imm.W === W && imm.H === H) return;
    if (imm) { for (const k of ['colA', 'colB', 'prof']) gl.deleteTexture(imm[k]); gl.deleteFramebuffer(imm.fA); gl.deleteFramebuffer(imm.fB); }
    const f = conVirgola ? 'rgba16f' : 'rgba8';
    imm = { W, H, colA: immagine(W, H, f, null, { filtro: gl.NEAREST }), colB: immagine(W, H, f, null, { filtro: gl.NEAREST }), prof: immagine(W, H, 'profondita', null, { filtro: gl.NEAREST }) };
    imm.fA = telaio(imm.colA, imm.prof); imm.fB = telaio(imm.colB);
  }
  // la tonalità: dall'immagine in virgola mobile allo schermo. Prima l'occhio (OCCHIO in cima): von Kries verso il bianco
  // della luce del luogo (u_bianco, luminanza 1) di D (u_occ.x); poi la risposta di Ferwerda, u_k.x·(a colori) +
  // u_k.y·(scotopica) — u_k porta già l'unità dell'immagine in cd/m², lo strumento davanti all'occhio e il grigio medio —;
  // poi la curva (Narkowicz 2015) e la gamma dello schermo (sRGB, ~2,2)
  const prgTono = programma(V_SCHERMO, `in vec2 v_uv; out vec4 o; uniform sampler2D u_col; uniform vec3 u_bianco; uniform vec2 u_occ; uniform vec2 u_k;
    void main() { vec3 x = texture(u_col, v_uv).rgb; x = any(isnan(x)) ? vec3(65504.0) : clamp(x, 0.0, 65504.0); x /= mix(vec3(1.0), max(u_bianco, vec3(1e-3)), u_occ.x);
      float sc = 0.0; if (u_k.y > 0.0) { vec3 X = mat3(0.4124, 0.2126, 0.0193, 0.3576, 0.7152, 0.1192, 0.1805, 0.0722, 0.9505) * x; sc = X.y * max(0.0, 1.33 * (1.0 + (X.y + X.z) / max(X.x, 1e-20)) - 1.68) / 2.5731; }
      x = u_k.x * x + u_k.y * vec3(sc);
      x = clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); o = vec4(pow(x, vec3(1.0 / 2.2)), 1.0); }`);
  // LA MISURA DELLA LUCE per l'occhio: la luminanza (Rec. 709, primari sRGB) media di ogni casella di una griglia 32×32
  // su tutta l'immagine finale (tutti i suoi punti, nessuno saltato), letta un fotogramma dopo senza fermare la scheda (un
  // buffer di lettura e un recinto). Se ne tirano fuori (cd/m²): la luce del centro (le quattro caselle di mezzo: per
  // l'esposizione di calcolo), la media logaritmica pesata attorno al centro (per l'occhio), la media di tutto il campo (per
  // l'amplificatore) e il punto più chiaro (per dire se sullo schermo si vede qualcosa)
  // (un punto oltre ciò che l'immagine a 16 bit tiene — 65 504 — o reso indefinito dal suo traboccare, Inf·0 nelle miscele, vale
  // il più chiaro che il formato tiene: nella misura e sullo schermo. Senza, un occhio adattato al buio con una stella nel
  // campo riempiva l'immagine di NaN, la misura non vedeva più niente e l'occhio restava al buio: il pianeta d'avvio nero)
  const NG = 32, prgMisura = conVirgola ? programma(V_SCHERMO, `out vec4 o; uniform sampler2D u_col; uniform vec4 u_reg; // la regione misurata: angolo (x, y) e lati (punti)
    void main() { ivec2 c = ivec2(gl_FragCoord.xy); ivec2 a = ivec2(u_reg.xy + floor(vec2(c) * u_reg.zw / ${NG}.0)), b = max(ivec2(u_reg.xy + floor(vec2(c + 1) * u_reg.zw / ${NG}.0)), a + 1); float s = 0.0, m = 0.0;
      for (int y = a.y; y < b.y; y++) for (int x = a.x; x < b.x; x++) { vec3 q = texelFetch(u_col, ivec2(x, y), 0).rgb; float l = dot(any(isnan(q)) ? vec3(65504.0) : clamp(q, 0.0, 65504.0), vec3(0.2126, 0.7152, 0.0722)); s += l; m = max(m, l); }
      o = vec4(s / float(max(1, (b.x - a.x) * (b.y - a.y))), m, 0.0, 1.0); }`) : null; // (r: la media della casella; g: il suo punto più chiaro)
  // (tre buffer di lettura a giro: ognuno si rilegge solo quando il suo recinto è passato, e intanto si scrive nel successivo;
  // d'uso «COPY»: con «READ» Chromium ne tiene una copia d'ombra che qui scartava a ogni fotogramma, con un avviso)
  const misura = { img: null, f: null, code: [], liberi: [], LA: NaN, Lscena: NaN, Lmax: NaN, K: 0, dati: new Float32Array(4 * NG * NG), ord: new Float32Array(NG * NG) };
  function misuraLuce(col, W, H) {
    if (!prgMisura) return; const prima = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if (!misura.img) { misura.img = immagine(NG, NG, gl.getExtension('EXT_color_buffer_float') ? 'rgba32f' : 'rgba16f', null, { filtro: gl.NEAREST }); misura.f = telaio(misura.img);
      for (let i = 0; i < 3; i++) { const b = gl.createBuffer(); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, b); gl.bufferData(gl.PIXEL_PACK_BUFFER, 4 * 4 * NG * NG, gl.STREAM_COPY); misura.liberi.push(b); } gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null); }
    // la lettura più vecchia, se è pronta (senza fermare la scheda)
    const q = misura.code[0];
    if (q && gl.getSyncParameter(q.recinto, gl.SYNC_STATUS) === gl.SIGNALED) { misura.code.shift();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, q.pbo); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, misura.dati); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null); gl.deleteSync(q.recinto); misura.liberi.push(q.pbo);
      const u = (q.E0 * q.K) / Math.PI, D = misura.dati, o = misura.ord; let n = 0;
      for (let i = 0; i < NG * NG; i++) { const v = D[4 * i]; o[i] = Number.isFinite(v) ? v * u : 0; n++; }
      // la luce del centro: le quattro caselle di mezzo
      const c0 = NG / 2 - 1, centro = (o[c0 * NG + c0] + o[c0 * NG + c0 + 1] + o[(c0 + 1) * NG + c0] + o[(c0 + 1) * NG + c0 + 1]) / 4;
      // la media logaritmica del campo, pesata con la gaussiana di OCCHIO.campo attorno al centro (angoli veri: il fuoco in punti)
      // (il punto più chiaro: una stella lontana è un punto)
      let Lmax = 0; for (let i = 0; i < n; i++) { const v = D[4 * i + 1] * u; if (v > Lmax) Lmax = v; } const f = q.H / (2 * q.tanY), s2 = 2 * OCCHIO.campo * OCCHIO.campo, pw = misura.pesi || (misura.pesi = new Float64Array(NG * NG));
      if (misura.chiavePesi !== `${q.W}×${q.H}×${f}`) { misura.chiavePesi = `${q.W}×${q.H}×${f}`; for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) { const dx = ((i + 0.5) / NG - 0.5) * q.W, dy = ((j + 0.5) / NG - 0.5) * q.H, th = Math.atan(Math.hypot(dx, dy) / f); pw[j * NG + i] = Math.exp(-(th * th) / s2); } }
      let sa = 0, sl = 0, sw = 0; for (let i = 0; i < NG * NG; i++) { sa += pw[i] * o[i]; sw += pw[i]; }
      const pav = Math.max(1e-30, (OCCHIO.pavimento * sa) / sw); for (let i = 0; i < NG * NG; i++) sl += pw[i] * Math.log(Math.max(pav, o[i]));
      let tot = 0; for (let i = 0; i < NG * NG; i++) tot += o[i];
      misura.LA = centro; misura.Lmax = Lmax; misura.Lscena = Lmax > 0 ? Math.exp(sl / sw) : 0; misura.Lmedia = tot / (NG * NG); }
    const pbo = misura.liberi.shift(); if (!pbo) return; // (tutte e tre in viaggio: questo fotogramma non si misura)
    gl.bindFramebuffer(gl.FRAMEBUFFER, misura.f); gl.viewport(0, 0, NG, NG); gl.useProgram(prgMisura.p); lega(0, col, prgMisura.u.u_col);
    gl.uniform4f(prgMisura.u.u_reg, 0, 0, W, H); schermo(); // (tutta l'immagine)
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo); gl.readPixels(0, 0, NG, NG, gl.RGBA, gl.FLOAT, 0); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    misura.code.push({ pbo, recinto: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0), E0: S.E0, K: misura.K, W, H, tanY: S.tanY }); gl.bindFramebuffer(gl.FRAMEBUFFER, prima);
  }

  // ---------- un fotogramma
  const S = { gl, t: 0, dt: 0, W: 1, H: 1, proj: new Float32Array(16), vista: new Float32Array(9), fc: 1, tanX: 1, tanY: 1, fuoco: 1, camera: cam, stella: null, versoStella: [1, 0, 0], quota: 0, conVirgola, schermo, lega, bersagli: [], vicinoM: 0, E0: 1, kSchermo: 1, luceVoluta: 0, visione: { t: 0, lnG: 0, lnLA: NaN, G: 1, LA: NaN, Lscena: NaN, Lmedia: NaN, Lmax: NaN, sottoSoglia: false } };
  S.bersaglio = (b) => { S.bersagli.push(b); const d = V.lungo(b.p) - b.raggio; if (d > 0 && d < S._vicino) S._vicino = d; };
  S.proponiLuce = (E) => { if (E > S.luceVoluta) S.luceVoluta = E; }; S.espo = (E) => E / S.E0;
  S.proponiBianco = (rgb) => { if (rgb && rgb.every((x) => Number.isFinite(x) && x >= 0) && rgb[0] + rgb[1] + rgb[2] > 0) S.biancoLuogo = rgb; };
  const _a = new Map(); let occhioInerziale = [0, 0, 0];
  S.assetto = (c) => { let a = _a.get(c); if (!a) { a = assettoDi(c, S.t); _a.set(c, a); } return a; };
  // dove SI VEDE un corpo: col cono, dov'era quando è partita la luce. Il ritardo è distanza/c (dalla sua superficie: il
  // suolo sotto i piedi è «adesso»); lo spostamento in quel tempo si conta lungo la catena dei riferimenti fino
  // all'antenato comune con l'occhio: con la velocità, se il corpo la sa dare (`velocita(t, out)`, come `posizione`: al
  // primo ordine, basta finché il ritardo è breve rispetto al periodo), altrimenti chiedendo la posizione a quell'istante.
  const _c1 = [0, 0, 0], _c2 = [0, 0, 0], _c3 = [0, 0, 0];
  S.ritardo = (c) => (c && c._ritardo) || 0; // (secondi: di quanto è vecchia la luce di quel corpo, in questo fotogramma)
  S.versoCorpo = (c, out = [0, 0, 0]) => {
    tra(cam.corpo, c, S.t, out); out[0] -= occhioInerziale[0]; out[1] -= occhioInerziale[1]; out[2] -= occhioInerziale[2];
    if (!vista.cono || c === cam.corpo) { if (c) c._ritardo = 0; return out; }
    const dt = Math.max(0, Math.hypot(out[0], out[1], out[2]) - (c.raggio || 0)) / C_LUCE; c._ritardo = dt; if (dt < 1e-3) return out;
    const miei = new Set(); for (let x = cam.corpo; x; x = x.genitore) miei.add(x);
    for (let x = c; x && !miei.has(x); x = x.genitore) {
      if (!x.posizione || mediato(x, 'orbita')) continue; const m = quadro(x.genitore, S.t);
      if (x.velocita) { x.velocita(S.t, _c1); _c1[0] *= -dt; _c1[1] *= -dt; _c1[2] *= -dt; }
      else { x.posizione(S.t - dt, _c2); x.posizione(S.t, _c3); _c1[0] = _c2[0] - _c3[0]; _c1[1] = _c2[1] - _c3[1]; _c1[2] = _c2[2] - _c3[2]; }
      const v = m ? V.mv(m, _c1, _c2) : _c1; out[0] += v[0]; out[1] += v[1]; out[2] += v[2];
    }
    return out;
  };
  const stat = { cpuMs: 0, fotogrammi: 0 }; let ultima = null; // (ultima: l'immagine in virgola mobile dell'ultimo fotogramma, prima della tonalità)
  // PER LE PROVE (test_vista): l'immagine in luce dell'ultimo fotogramma, W × H × 4 (nell'unità del nucleo: 1 = un foglio bianco sotto S.E0)
  function leggiImmagine() { if (!ultima) return null; const W = S.W, H = S.H, px = new Float32Array(4 * W * H), prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, ultima.f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, px); gl.bindFramebuffer(gl.FRAMEBUFFER, prima); return px; } let perso = false, ultimoMs = 0, giro = 0, richiesto = 0;
  const tasti = new Set();
  function fotogramma(ms = performance.now()) {
    if (perso || !cam.corpo || !tela.width || !tela.height) return;
    const t0 = performance.now(), dtVero = Math.min(0.1, ultimoMs ? (ms - ultimoMs) / 1000 : 0), dtOcchio = Math.min(1, ultimoMs ? (ms - ultimoMs) / 1000 : 0); ultimoMs = ms; // (l'occhio vive nel tempo di chi guarda, anche a pochi fotogrammi al secondo)
    // (il tempo che scorre è quello di chi guarda: dove il suo orologio va più piano — vicino a un buco nero — nello stesso
    // suo secondo il mondo ne fa di più. Chi lo sa lo dice a ogni fotogramma in `tempo.ritmo` = dτ/dt ≤ 1; lontano vale 1.)
    if (!tempo.pausa) tempo.t += (dtVero * tempo.velocita) / (tempo.ritmo > 0 ? tempo.ritmo : 1);
    tempo.ritmo = 1;
    // i tasti del volo: W A S D (o le frecce) avanti e di lato, R e F su e giù, Q ed E girano la testa; maiuscolo: più in fretta
    if (tasti.size && dtVero > 0) {
      const k = (a, b) => (tasti.has(a) || tasti.has(b) ? 1 : 0), svelto = tasti.has('shift') ? 4 : 1;
      const av = k('w', 'arrowup') - k('s', 'arrowdown'), la = k('d', 'arrowright') - k('a', 'arrowleft'), su = k('r', ' ') - k('f', 'c'), gira = k('e') - k('q');
      if (av || la || su) vola(av * 1.2 * svelto, la * 1.2 * svelto, su * 0.9 * svelto, dtVero); if (gira) guarda(-gira * 1.2 * dtVero, 0);
    }
    if (volo) passoVolo(); else { avanzaZoom(dtVero); scegliRiferimento(tempo.t); scegliCorpo(); }
    passoMondo = tempo.pausa ? 0 : Math.abs(tempo.velocita) / 60; S.passo = passoMondo;
    S.t = tempo.t; S.dt = dtVero * (tempo.pausa ? 0 : tempo.velocita); S.dtVero = dtVero; S.indice = stat.fotogrammi; _a.clear();
    preparaImmagini(); const W = S.W = tela.width, H = S.H = tela.height;
    // la camera negli assi inerziali: l'occhio rispetto al centro del suo corpo, e la matrice mondo → occhio
    const A = cam.solidale ? S.assetto(cam.corpo) : V.identita(), assi = cam.solidale ? V.mm(A, cam.assi) : cam.assi; occhioInerziale = cam.solidale ? V.mv(A, cam.pos) : cam.pos.slice();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S.vista[3 * j + i] = assi[3 * j + i]; // (per colonne, per WebGL: la trasposta degli assi)
    S.assi = assi; S.occhio = occhioInerziale; S.quota = quota(); S.distanza = V.lungo(cam.pos);
    const tY = Math.tan(cam.fov / 2), tX = (tY * W) / H, lontano = O.lontano || 1e28, m = S.proj; m.fill(0); m[0] = 1 / tX; m[5] = 1 / tY; m[10] = -1; m[11] = -1; m[14] = -0.02;
    S.tanX = tX; S.tanY = tY; S.fuoco = H / (2 * tY); S.fc = 2 / Math.log2(lontano + 1);
    // la stella che illumina: quella più in alto nell'albero del corpo a cui si è attaccati
    let st = cam.corpo; while (st && !st.luce) st = st.genitore; if (!st) st = cam.corpo.stella || null; S.stella = st || null; // (un riferimento può dire qual è la sua stella: `stella`)
    S.bersagli.length = 0; S._vicino = Infinity; S.luceVoluta = 0; S.luceGalassia = 0; // (luceGalassia: W/m², la luce diffusa della galassia che arriva all'occhio da tutte le direzioni — universo.js)
    if (st && st !== cam.corpo) { const v = tra(cam.corpo, st, S.t); S.distanzaStella = V.lungo(v); S.versoStella = V.norma(v); } else { S.versoStella = [0, 1, 0]; S.distanzaStella = 1; }
    S.coloreStella = st && st.luce.colore ? st.luce.colore : [1, 1, 1]; S.biancoLuogo = null; // (biancoLuogo: il colore della luce che arriva dove sta l'occhio, se uno strato lo sa — S.proponiBianco)
    for (const s of strati) if (s.aggiorna) s.aggiorna(S);
    S.vicinoM = isFinite(S._vicino) ? S._vicino : 0;
    // l'irradianza che vale «1»: quella che l'occhio sceglie adattandosi alla luce misurata nell'immagine (OCCHIO in cima);
    // finché non c'è una misura (i primi fotogrammi), o senza immagini in virgola mobile, quella proposta dagli strati.
    // La si segue come fa l'occhio: in fretta verso il chiaro, piano verso il buio
    const K = efficaciaLuminosa((st && st.luce && st.luce.T) || OCCHIO.TSole); misura.K = K; S.efficacia = K;
    S.Ecampo = misura.Lmedia > 0 ? (Math.PI * misura.Lmedia) / K : NaN; // (W/m²: la luce media di tutto il campo come irradianza, per chi taglia ciò che non si vedrebbe: universo.js)
    if (vista.occhio.adatta && Number.isFinite(misura.LA)) S.luceVoluta = E0Adattato(misura.LA, K);
    if (vista.occhio.E0 > 0) S.E0 = vista.occhio.E0;
    else if (S.luceVoluta > 0) { const v = Math.log(S.luceVoluta), o = Math.log(S.E0), k = Math.min(1, dtVero > 0 ? dtVero * (v > o ? 6 : 2.5) : 1); S.E0 = Math.exp(o + (v - o) * k); }
    // ciò che l'occhio è adesso: la luminanza a cui è adattato (cd/m²), il grado di adattamento al colore, il peso dei coni.
    // Con l'occhio che si adatta, quello di Ferwerda (OCCHIO in cima) con gli strumenti davanti; altrimenti (le prove, o
    // l'esposizione fissata) l'unità dell'immagine va al grigio medio come prima
    const oc = S.visione, ferwerda = vista.occhio.adatta && !(vista.occhio.E0 > 0) && conVirgola;
    if (ferwerda && misura.Lscena > 0) { passoOcchio(oc, misura.Lscena, dtOcchio, !!vista.occhio.amplificatore, misura.Lmedia); oc.Lscena = misura.Lscena; oc.Lmedia = misura.Lmedia; oc.Lmax = misura.Lmax; }
    // (con l'esposizione fissata e l'occhio fermo — le prove — L_A è quella dell'occhio adattato a quell'esposizione, non l'ultima misura arrivata)
    S.LA = ferwerda && Number.isFinite(oc.LA) ? oc.LA : vista.occhio.E0 > 0 && !vista.occhio.adatta ? (S.E0 * K * X_MEDIO) / Math.PI : Number.isFinite(misura.LA) ? Math.max(misura.LA, OCCHIO.soglia) : (S.E0 * K * X_MEDIO) / Math.PI;
    gl.bindFramebuffer(gl.FRAMEBUFFER, imm.fA); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clearDepth(1); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    for (const s of strati) if (s.disegna) s.disegna(S, 'fondo');
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
    for (const s of strati) if (s.disegna) s.disegna(S, 'solido');
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    for (const s of strati) if (s.disegna) s.disegna(S, 'velato');
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    // le passate sull'immagine intera (l'aria), poi la tonalità
    let da = { col: imm.colA, prof: imm.prof, f: imm.fA }, a = { col: imm.colB, prof: imm.prof, f: imm.fB };
    for (const s of strati) if (s.dopo) { gl.bindFramebuffer(gl.FRAMEBUFFER, a.f); gl.viewport(0, 0, W, H); if (s.dopo(S, da, a)) { const x = da; da = a; a = x; } }
    ultima = da; if (vista.occhio.adatta) misuraLuce(da.col, W, H);
    // (il bianco della luce del luogo, a luminanza 1: S.coloreStella è il colore vero della sua luce)
    // (il bianco a cui l'occhio si adatta: la luce che illumina DOVE STA L'OCCHIO — sotto un'aria spessa quella della stella
    // passata dall'aria e quella del cielo, non la stella fuori dall'aria: CIECAM02 si adatta all'illuminante della scena)
    const cs = S.biancoLuogo || S.coloreStella, yb = 0.2126 * cs[0] + 0.7152 * cs[1] + 0.0722 * cs[2] || 1, Dc = S.stella ? gradoAdattamento(S.LA) : 0; S.adattamento = { LA: S.LA, D: Dc, coni: pesoConi(S.LA) };
    // (u_k: dall'unità dell'immagine alle cd/m² del mondo, per G dello strumento, per la risposta dell'occhio, e L_da al grigio medio)
    let kP = S.adattamento.coni, kS = 1 - kP;
    if (ferwerda && Number.isFinite(oc.LA)) { const f = fattoriOcchio(oc.LA), b = ((S.E0 * K) / Math.PI) * oc.G * (X_MEDIO / OCCHIO.Lda); kP = b * f.mP; kS = b * f.k * f.mS;
      oc.sottoSoglia = oc.Lmax > 0 && passiVisibili(oc.G * oc.Lmax, oc.LA) < 1; } else { oc.sottoSoglia = false; oc.G = 1; } // (sotto soglia: nemmeno il punto più chiaro si vede)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(prgTono.p); lega(0, da.col, prgTono.u.u_col); gl.uniform3f(prgTono.u.u_bianco, cs[0] / yb, cs[1] / yb, cs[2] / yb); gl.uniform2f(prgTono.u.u_occ, Dc, S.adattamento.coni); gl.uniform2f(prgTono.u.u_k, kP, kS); schermo();
    S.kSchermo = kP > 0 ? kP : 1; // (per i SEGNI che devono avere sullo schermo sempre la stessa forza, qualunque sia l'occhio: si dividono per questo — del fotogramma prima —, come il segnaposto dei pianeti di sistema.js)
    for (const s of strati) if (s.sopra) s.sopra(S);
    gl.bindVertexArray(null);
    stat.cpuMs = performance.now() - t0; stat.fotogrammi++;
    if ((volo || gesto) && !O.alCambio) cambia(); // (lo zoom e il volo continuano nei fotogrammi seguenti)
  }
  function cambia() { if (O.alCambio) O.alCambio(); else if (!giro && !richiesto) richiesto = requestAnimationFrame((ms) => { richiesto = 0; fotogramma(ms); }); }
  function passo(ms) { if (!giro) return; fotogramma(ms); giro = requestAnimationFrame(passo); }

  // ---------- i gesti: trascinare gira il corpo sotto la mano; col tasto destro (o maiuscolo) si orbita attorno al
  // centro dello schermo; con Ctrl (o il tasto di mezzo) ci si guarda attorno; la rotella avvicina a ciò che sta sotto
  // il cursore; i tasti W A S D R F volano
  const ascolti = [], ascolta = (chi, che, f, o) => { chi.addEventListener(che, f, o); ascolti.push([chi, che, f, o]); };
  const qui = (e) => { const r = tela.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  if (O.interazione) {
    let modo = null, ux = 0, uy = 0;
    ascolta(tela, 'contextmenu', (e) => e.preventDefault());
    ascolta(tela, 'pointerdown', (e) => { const [x, y] = qui(e); fermaVolo(); modo = e.button === 2 || e.shiftKey ? 'orbita' : e.button === 1 || e.ctrlKey ? 'guarda' : 'afferra'; ux = x; uy = y; if (modo === 'afferra') afferra(x, y); try { tela.setPointerCapture(e.pointerId); } catch { /* il puntatore non c'è più */ } tela.focus?.(); });
    ascolta(tela, 'pointermove', (e) => { if (!modo) return; const [x, y] = qui(e), dx = x - ux, dy = y - uy; ux = x; uy = y; if (modo === 'afferra') trascina(x, y); else if (modo === 'orbita') orbita(-dx * 0.005, dy * 0.005); else guarda(-dx * 0.003, -dy * 0.003); });
    const lascia = () => { modo = null; presa = null; }; ascolta(tela, 'pointerup', lascia); ascolta(tela, 'pointercancel', lascia);
    ascolta(tela, 'wheel', (e) => { e.preventDefault(); const [x, y] = qui(e); avvicina(x, y, Math.exp(Math.max(-0.7, Math.min(0.7, e.deltaY * 0.0016)))); }, { passive: false });
    const giu = (e) => { if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'r', 'f', 'q', 'e', 'c', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { tasti.add(k); if (k !== 'shift') e.preventDefault(); cambia(); } };
    ascolta(window, 'keydown', giu); ascolta(window, 'keyup', (e) => tasti.delete(e.key.toLowerCase())); ascolta(window, 'blur', () => tasti.clear());
  }
  ascolta(tela, 'webglcontextlost', (e) => { e.preventDefault(); perso = true; });
  function ridimensiona() {
    const d = O.densita || Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), w = Math.max(1, Math.round((tela.clientWidth || tela.width) * d)), h = Math.max(1, Math.round((tela.clientHeight || tela.height) * d));
    if (tela.width !== w || tela.height !== h) { tela.width = w; tela.height = h; } cambia();
  }
  function libera() {
    if (giro) cancelAnimationFrame(giro); if (richiesto) cancelAnimationFrame(richiesto); giro = richiesto = 0;
    for (const [chi, che, f, o] of ascolti) chi.removeEventListener(che, f, o); ascolti.length = 0;
    for (const s of strati) if (s.libera) s.libera(); strati.length = 0;
    if (!perso) gl.getExtension('WEBGL_lose_context')?.loseContext(); perso = true;
  }
  const N = { gl, tela, opzioni: O, V, tempo, vista, camera: cam, corpo, corpi, togliCorpo, tra, quadro, assettoDi, mediato, attacca, riattacca, scegliCorpo, assiDa, vai, dove, sotto, quota, avvicina, fermaZoom, mira, cosaSotto, vaiA, fermaVolo, get volo() { return volo; }, get gesto() { return gesto; }, guarda, orbita, vola, afferra, trascina, aggiungi, togli, strati, fotogramma, cambia, ridimensiona, libera, leggiImmagine, programma, immagine, telaio, lega, schermo, V_SCHERMO, stato: S, statistiche: () => ({ ...stat, tasti: tasti.size }), conVirgola,
    avvia: () => { if (!giro) giro = requestAnimationFrame(passo); }, ferma: () => { if (giro) cancelAnimationFrame(giro); giro = 0; }, tasti };
  ridimensiona();
  return N;
}
