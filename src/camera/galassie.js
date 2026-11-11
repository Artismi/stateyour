// galassie.js — le galassie come CONSEGUENZA: dall'alone di materia oscura alle stelle del catalogo.
//
// Al posto delle formule di cosmo.js (tipo sorteggiato, stelle nate a caso uniforme nella storia, Z = una formula
// del tempo e del raggio, supernove da costanti) qui c'è una catena di cause, ognuna con la sua legge:
//   1. L'ALONE. Il picco del campo di densità (G.peso, in unità dello scarto del campo) dice quanto è densa la
//      regione; da lì la massa dell'alone (insiemi di escursione: in una regione più densa la soglia del collasso è
//      più vicina, e crollano masse più grandi). La sua storia di crescita e le sue fusioni vengono dalle leggi
//      misurate sulle simulazioni; il suo MOMENTO ANGOLARE dalle maree dei picchi vicini veri (teoria delle coppie
//      mareali): chi sente una marea più forte, e ha il proto-alone più storto rispetto a lei, gira di più.
//   2. IL GAS. Entra con la materia oscura (la frazione cosmica Ωb/Ωm), si scalda alla temperatura viriale e deve
//      RAFFREDDARSI per cadere: negli aloni piccoli lo fa subito, in quelli grandi ci mette più dell'età
//      dell'universo (e il buco nero centrale lo tiene caldo): per questo le galassie giganti smettono di fare
//      stelle. Cadendo conserva il momento angolare e si posa in un DISCO di scala λ·R_vir/√2 (Mo, Mao & White):
//      il gas di ogni passo porta il momento angolare che l'alone ha guadagnato in quel passo (ΔJ/ΔM, più della
//      media: viene da più lontano), e si posa più in fuori (il disco cresce dall'interno verso l'esterno).
//   3. LE STELLE. Anello per anello il gas diventa stelle con la legge di Kennicutt-Schmidt, dove il disco è
//      instabile (criterio di Toomre); le supernove ne lanciano una parte fuori dall'alone (il vento, pagato con la
//      loro energia), da dove ricade: presto in un alone grande, quasi mai in uno piccolo.
//   4. I METALLI. Ogni generazione, morendo (chi e quando: le vite e i resti di stelle.js sulla distribuzione
//      delle masse di leggi.js), restituisce al gas del suo anello il suo involucro e i metalli nuovi; il gas che
//      arriva da fuori è povero e diluisce; il vento ne porta via. Z(tempo, raggio) è il BILANCIO di tutto questo,
//      e ogni stella prende la Z del gas da cui nasce. Il bilancio è chiuso (forma.bilancio) e si controlla.
//   5. LE FUSIONI. Un compagno entrato nell'alone scende al centro per attrito dinamico; se pesa abbastanza
//      scompiglia il disco in uno SFEROIDE (il raggio dall'energia che si conserva) e il gas precipita al centro.
//      Il TIPO esce da qui: ellittica se più di quattro quinti delle stelle stanno nello sferoide, cioè una fusione
//      grande e tardiva, oppure tante fusioni in un alone grande dove il gas non si raffredda più a rifare il disco;
//      lenticolare se un disco c'è ma non ha più gas freddo per fare bracci; altrimenti spirale (anche con un grosso
//      rigonfiamento, se il disco è ricresciuto dopo la fusione).
//   6. I BRACCI. L'amplificazione di taglio: quanti bracci dal peso del disco rispetto alla curva di rotazione
//      (m = κ²R/4πGΣ), quanto avvolti dal taglio della curva (Michikoshi & Kokubo), quanto marcati da quanto è
//      freddo il disco (Q di Toomre); la barra se il disco pesa abbastanza (Efstathiou, Lake & Negroponte).
//      Una stella nasce nel braccio (lì il gas è più denso) e ci resta finché il braccio vive: mezzo giro.
//   7. LE SUPERNOVE DI OGGI: il ritmo è quello delle stelle massicce nate di recente più le nane bianche in
//      coppia delle generazioni passate; le ultime esplose sono stelle vere, e il resto sta dove stava la stella.
//
// IL CATALOGO È UN CAMPIONE. Una galassia ha 10⁹–10¹² stelle; stelleGalassia() ne dà `quante` (2500): ognuna è
// estratta tra TUTTE le stelle mai nate nella galassia (quando, dove e con che metalli: in proporzione alla massa
// nata in quell'anello in quel passo; la massa dalla distribuzione di Kroupa) e ne rappresenta `peso` (campo
// `peso` di ogni stella: le stelle vere che rappresenta, ~10⁸). La somma massa × peso torna con la massa in
// stelle e resti di forma (entro lo scarto del campione). Fanno eccezione le ULTIME SUPERNOVE (fino a 8, più
// giovani di 10⁵ anni): quelle da collasso sono stelle vere, una per una (peso 1), messe negli ultimi posti del
// catalogo come stella di neutroni o buco nero, e il loro resto sta su di loro.
//
// I MOTI (per cosmo.js motiDi): la stella gira attorno al centro alla velocità di curvaRotazione() (nello sferoide ha la
// sua, estratta dalla dispersione); la galassia cade verso dove c'è più materia alla velocità di velocitaPeculiare(), la
// teoria lineare sul campo di cosmo(n).
//
// CHE COSA EMERGE (non è scritto: esce dalla catena): il tipo (spirale / lenticolare / ellittica), la massa in
// stelle e in gas, la scala del disco e la sua crescita dall'interno, la curva di rotazione, la storia della
// formazione stellare (presto e in fretta nelle giganti, lenta nelle piccole), Z(t, r) con la relazione
// età–metallicità e il gradiente radiale, la relazione massa–metallicità, il numero e il passo dei bracci, la
// barra, il ritmo delle supernove dei due tipi, il raggio dello sferoide, il colore, chi ha il buco nero grande.
//
// LEGGI MISURATE O PRESE DALLE SIMULAZIONI (usate così, non derivate; i numeri sono in LEGGI):
//   · lo spettro delle fluttuazioni: funzione di trasferimento di Bardeen et al. 1986 (BBKS) con il parametro di
//     forma di Sugiyama 1995, normalizzata a σ₈ (leggi.js COSMO); soglia del collasso sferico δc = 1,686;
//   · la sovradensità viriale: Bryan & Norman 1998 (18π² + 82x − 39x²);
//   · la concentrazione dell'alone: Bullock et al. 2001 (c = 4·a/a_c, con a_c quando è crollato l'1% della massa);
//   · la crescita media dell'alone e il ritmo delle fusioni: Fakhouri, Ma & Boylan-Kolchin 2010 (MNRAS 406, 2267,
//     eq. 1 e 2, simulazioni Millennium); il tempo di attrito dinamico: Boylan-Kolchin, Ma & Quataert 2008
//     (MNRAS 383, 93, eq. 5–6); la circolarità delle orbite: 0,5 ± 0,2 (Khochfar & Burkert 2006);
//   · lo spin: distribuzione log-normale, mediana 0,035 e larghezza 0,5 (Bullock et al. 2001); qui NON è
//     sorteggiato tutto: metà della varianza è il posto che la marea vera dei vicini ha tra quelle del cosmo;
//   · il disco: R_d = λ·R_vir/√2 con le correzioni f_c e f_R di Mo, Mao & White 1998 (eq. 23 e 32);
//   · il raffreddamento del gas caldo: curva di Sutherland & Dopita 1993, qui raccordata con potenze (a metalli
//     zero: frenamento 2,4·10⁻²⁷·√T più le righe dell'elio 5·10⁻²³·(T/10⁵)^−1,5 erg cm³/s; i metalli: 1,6·10⁻¹⁹·Z/√T,
//     McKee & Cowie 1977). È un raccordo fatto a memoria, buono entro un fattore ~1,5 tra 10⁵ e 10⁸ K;
//     il flusso di raffreddamento è quello di White & Frenk 1991 (gas isotermo, ρ ∝ r⁻²);
//   · il momento finale di un resto di supernova: 2,8·10⁵ M☉·km/s · n^−0,17 (Kim & Ostriker 2015, ApJ 802, 99,
//     simulazioni); la dispersione del gas neutro: 10 km/s (misurata nell'idrogeno delle galassie);
//   · il buco nero che scalda il gas caldo: Croton et al. 2006 (MNRAS 365, 11: ṁ = 6·10⁻⁶ M☉/anno ·
//     (M_bn/10⁸)·(f_caldo/0,1)·(V/200)³, resa 0,1). È una legge dei modelli semi-analitici, non una misura;
//   · il gas lanciato fuori dall'alone ci ricade in 18 Ga·(10¹⁰ M☉/M_alone) (Henriques et al. 2013, MNRAS 431,
//     3373: anche questa dai modelli semi-analitici): subito in una galassia grande (una fontana), mai in una nana;
//   · Kennicutt-Schmidt: Σ_SFR = 2,5·10⁻⁴·(Σ_gas/M☉pc⁻²)^1,4 M☉/anno/kpc² (Kennicutt 1998, ApJ 498, 541), sopra la
//     soglia Σ_crit = 0,69·κ·σ_g/(3,36·G) con σ_g = 6 km/s (Kennicutt 1989; Martin & Kennicutt 2001);
//   · le rese: metalli nuovi di una supernova da collasso m_Z = (0,0118 + 0,00548·m)·m M☉ (Bailin & Harris 2009,
//     ApJ 695, 1082; Bailin 2018, ApJ 863, 99, app. B: segue le tabelle di Nomoto et al. 2013 fino a 40 M☉);
//     energia 10⁴⁴ J per supernova; una Ia brucia in metalli tutta la nana bianca (la massa di Chandrasekhar);
//   · le Ia: ritardi ∝ t^−1,1, in tutto 1,3 ogni 1000 M☉ di stelle nate (Maoz & Graur 2017, ApJ 848, 25), a
//     partire dalla morte della più grande stella che lascia una nana bianca (da stelle.js);
//   · le fusioni: «maggiore» se i barioni del compagno sono più di 0,3 di quelli della galassia (Hopkins et al.
//     2009); il raggio di ciò che resta: Cole et al. 2000 (energia conservata, c = 0,5, f_orb = 1);
//   · il buco nero: M_bn = 0,49·10⁹·(M_sferoide/10¹¹)^1,17 M☉, scarto 0,28 dex (Kormendy & Ho 2013); quanto è
//     acceso oggi: frazioni di Eddington distribuite come λ^−0,65 (Aird et al. 2012);
//   · i bracci: m = κ²R/(4πGΣ) (amplificatore di Toomre con X = 2: D'Onghia 2015); tan(passo) = (2/7)·√(4−2Γ)/Γ
//     (Michikoshi & Kokubo 2014, ApJ 787, 174, eq. 15); la barra se V_max/√(G·M_d/R_d) < 1,1 (Efstathiou, Lake
//     & Negroponte 1982); i bracci vivono circa un giro (Sellwood & Carlberg 1984; Baba et al. 2013);
//   · i resti di supernova: fine della fase di Sedov a 2,9·10⁴·n^(−9/17) anni (Blondin et al. 1998), 10% dell'energia
//     in raggi cosmici; le pulsar: periodo alla nascita 0,3 ± 0,15 s (Faucher-Giguère & Kaspi 2006), spinta
//     265 km/s (Hobbs et al. 2005); le nane bianche si raffreddano con la legge di Mestel (1952);
//   · da leggi.js e stelle.js: COSMO, la distribuzione di Kroupa (massaNascita), le vite e i resti delle stelle.
// PARAMETRI LIBERI (non misurati; nessuno decide le masse, le stelle o i tipi):
//   (Due scelte che prima erano tarate ora non lo sono più. L'altezza della fluttuazione che fa l'alone, LEGGI.raro, è
//   la mediana della legge della prima traversata, 0,6745: l'alone mediano di quella regione; ne viene un picco medio
//   con un alone di 1,3·10¹² M☉ e il più alto di 2·10¹³. E l'energia che le supernove lasciano al vento non è più una
//   frazione scelta: è quella che resta in moto in un resto quando ha rallentato fino alla velocità del gas, ½·p·σ_g
//   con p di Kim & Ostriker: il 3% a una particella per cm³. La Via Lattea e le frazioni dei tipi escono come escono.)
//   · LEGGI.germe = 10⁵ M☉: il buco nero di una galassia senza sferoide; LEGGI.getto = 10⁻³: la parte di ṁc² che
//     il getto dà ai raggi cosmici; LEGGI.Qstelle = 2: il Q a cui le stelle del disco si regolano da sole;
//   · il contrasto dei bracci nelle stelle: da 0 (Q = 2: l'amplificatore di Toomre non guadagna) a 0,45 (Q ≈ 1),
//     lineare in Q; nel gas il doppio. (Il guadagno vero dell'amplificatore qui non è calcolato.)
// SEMPLIFICAZIONI:
//   · il campo di cosmo.js ha due dimensioni e solo onde lunghe (fino a 9 per lato): è letto come il campo lineare
//     di oggi filtrato a quel numero d'onda; lo scarto σ del filtro è calcolato dallo spettro vero. I vicini sono
//     a decine di Mpc: non si fondono mai tra loro nel tempo che c'è stato (lo dice l'argomento dei tempi, che
//     qui dà solo la «prossima fusione»); le fusioni avvenute sono con compagni che non ci sono più, estratti
//     dalla legge del ritmo; ogni compagno è una galassia fatta con queste stesse leggi (senza fusioni sue);
//   · la storia dell'alone è quella media della sua massa (niente scarto da alone ad alone, tranne le fusioni);
//   · 14 anelli e 46 passi di 0,3 miliardi di anni: le stelle massicce muoiono «subito», lo scoppio di una
//     fusione dura un passo; il gas dell'alone è isotermo, tutto alla stessa Z, e quello che si raffredda ha il
//     momento angolare medio di quello che c'è (non quello degli strati interni, che cadono prima);
//   · niente migrazione radiale delle stelle, niente flussi radiali del gas; un solo numero Z per tutti i metalli
//     (ossigeno e ferro insieme), e le giganti asintotiche restituiscono solo i metalli con cui sono nate;
//   · la curva di rotazione: alone di Navarro-Frenk-White non contratto dai barioni, disco esponenziale sottile
//     (Freeman) con la massa e il raggio medio degli anelli, sferoide di Hernquist;
//   · la galassia è disegnata di faccia; uno sferoide ha uno schiacciamento apparente estratto (0,7 ± 0,15);
//   · la luce è quella di sequenza principale (stelle.js non ha ancora le giganti): serve solo per il colore.
// CHE COSA NON TORNA (misurato in test/test_galassie.mjs, che stampa il confronto con la Via Lattea e i tipi). Niente
// qui è tarato sulla Via Lattea, e si vede:
//   · la Via Lattea della prova (alone 10¹², spin 0,04) fa 3,3·10¹⁰ M☉ di stelle (vera: 5–6) e gira a 189 km/s a 8 kpc
//     (vera: 220–240): il suo gas caldo resta quasi senza metalli (il vento ne porta su pochi) e si raffredda piano;
//   · gli aloni piccoli fanno troppe stelle: a 10¹¹ M☉ il 10% dell'alone è in stelle (nell'universo vero lo 0,5–1%), a
//     3·10¹¹ l'11% (vero: 2%); il massimo dell'efficienza cade lì invece che a 10¹². Il vento che esce dalla fisica dei
//     resti (3% dell'energia) è troppo debole per le galassie piccole; e le rese di stelle.js (sopra 23 M☉ il nucleo
//     ricade in un buco nero e non restituisce metalli: 0,74 Z☉ per M☉ nata) non ne lascerebbero perdere di più;
//   · tutte le galassie fanno le stelle presto (metà entro i primi 4 Ga; la Via Lattea vera a 5): le ellittiche non
//     si distinguono dalle spirali per l'età delle stelle, ma per quando si sono messe insieme;
//   · le galassie segnate sono le grandi (aloni da 4·10¹¹ a 2·10¹³ M☉, mediana 1,3·10¹²): metà sono ellittiche (41–49%
//     nei tre cosmi provati; tra le galassie grandi vere, ellittiche e lenticolari sono circa metà; tra tutte il 10–20%).
//     Nessuna lenticolare: un disco che resta tiene sempre abbastanza gas per i bracci;
//   · il gradiente di Z nel disco è poco più di metà del vero (−0,03 contro −0,05 dex/kpc);
//   · senza fusioni (la Via Lattea della prova) non c'è sferoide e il buco nero resta il germe: 10⁵ invece di 4·10⁶ M☉;
//   · la legge del raffreddamento è un raccordo: da lei dipende quante stelle fa un alone di 10¹²;
//   · le pulsar vengono debolissime (il campo delle stelle alla nascita, conservando il flusso, dà 10⁵–10⁹ T ma il
//     periodo di 0,3 s frena poco): nei raggi cosmici contano i resti e il getto.

import { COSTANTI, COSMO, ANNO, MSOLE, LSOLE, etaUniverso, massaNascita, massaChandrasekhar } from './leggi.js';
import * as ST from './stelle.js';
import { sorgente } from './eventi.js';

// ---------- LE LEGGI E I PARAMETRI (vedi l'intestazione)
export const LEGGI = {
  deltaC: 1.686, // la soglia del collasso sferico (in sovradensità lineare)
  raro: 0.6745, // l'altezza, in scarti, della fluttuazione piccola che ha fatto l'alone: la MEDIANA della legge della prima traversata (|campana|: metà della materia di quella regione sta in aloni più grandi, metà in più piccoli). Non è tarato
  spin: [0.035, 0.5], // mediana e larghezza (in logaritmo naturale) del parametro di spin (Bullock et al. 2001)
  concentrazione: [4, 0.01], // Bullock et al. 2001: c = K·a/a_c, con a_c quando è crollata la frazione F della massa
  crescita: [46.1, 1.1, 1.11], // Fakhouri et al. 2010, eq. 2 (media): M☉/anno a 10¹² M☉, esponente, pendenza in z
  fusioni: { A: 0.0104, xi: 9.72e-3, alfa: 0.133, beta: -1.995, gamma: 0.263, eta: 0.0993 }, // Fakhouri et al. 2010, eq. 1
  attrito: [0.216, 1.3, 1.9], // Boylan-Kolchin et al. 2008: τ/τ_dyn = A·(M/m)^b/ln(1+M/m)·exp(c·circolarità)
  circolarita: [0.5, 0.2],
  maggiore: 0.3, // sopra questo rapporto di barioni la fusione scompiglia il disco
  cole: 0.5, // Cole et al. 2000: l'energia dell'orbita nella fusione, f_orb/c con c = 0,5
  KS: [2.5e-4, 1.4], // Kennicutt 1998
  soglia: [0.69, 6, 3.36], // Σ_crit = α·κ·σ_g/(3,36·G), σ_g in km/s
  sigmaGas: 10, // (km/s) la dispersione del gas neutro, per il Q dei bracci
  Qstelle: 2, // PARAMETRO LIBERO
  resa: [0.0118, 0.00548], // m_Z = (B + C·m)·m (Bailin & Harris 2009)
  energiaSN: 1e44, // joule
  momentoSN: [2.8e5, -0.17], // (M☉·km/s, esponente della densità in cm⁻³) il momento che un resto di supernova lascia al gas quando ha irradiato il suo calore (Kim & Ostriker 2015, ApJ 802, 99)
  ritorno: 18, // (Ga) il gas soffiato fuori dall'alone ci ricade in ritorno·(10¹⁰ M☉/M_alone) (Henriques et al. 2013)
  Ia: [1.3e-3, -1.1], // per M☉ nata, e pendenza dei ritardi (Maoz & Graur 2017)
  bucoNero: [0.49e9, 1.17, 0.28], // Kormendy & Ho 2013
  germe: 1e5, // PARAMETRO LIBERO: (M☉) il buco nero di partenza, in una galassia senza sferoide
  radio: [6e-6, 0.1], // Croton et al. 2006: κ (M☉/anno) e resa
  eddington: -0.65, // Aird et al. 2012
  getto: 1e-3, // PARAMETRO LIBERO
  barra: 1.1, // Efstathiou, Lake & Negroponte 1982
  sedov: [2.9e4, -9 / 17], cosmici: 0.1, // Blondin et al. 1998; la parte dell'energia di un resto che va in raggi cosmici
  pulsar: [0.3, 0.15, 265], // periodo alla nascita (s), suo scarto, spinta (km/s)
  spessoreGas: 0.1, // (kpc) la mezza altezza dello strato di gas, per la densità attorno a un resto
  assi: [0.7, 0.15], // lo schiacciamento apparente di uno sferoide (Lambas et al. 1992)
};
export const ANELLI = 14, PASSI = 46, RESTI = 8;

// ---------- le unità: masse solari, kpc, miliardi di anni (Ga), km/s
const KPC = 3.0857e19, MPC = 1e3 * KPC, GA = 1e9 * ANNO, KMS = (1e3 * GA) / KPC; // 1 km/s in kpc/Ga
const GK = (COSTANTI.G * MSOLE) / (KPC * 1e6); // G in kpc·(km/s)²/M☉
const C_KMS = COSTANTI.c / 1e3, ZSOLE = ST.DATI?.ZSOLE ?? 0.0142, YPRIMO = ST.DATI?.YPRIMO ?? 0.247;
const T0 = etaUniverso() / GA, DT = T0 / PASSI, PI4 = 4 * Math.PI;
const stringi = (x, a, b) => Math.max(a, Math.min(b, x));
// l'inversa della distribuzione a campana (Winitzki: errore < 0,005)
const campana = (p) => { const x = 2 * stringi(p, 1e-9, 1 - 1e-9) - 1, l = Math.log(1 - x * x), a = 0.147, b = 2 / (Math.PI * a) + l / 2; return Math.sign(x) * Math.SQRT2 * Math.sqrt(Math.sqrt(b * b - l / a) - b); };

// ---------- IL COSMO: tempo, espansione, crescita delle fluttuazioni, σ(M). Tutto da leggi.js COSMO.
const U = (() => {
  const { Om, OL, Ob, ns, sigma8 } = COSMO, h = COSMO.H0 / 100, H0 = ((COSMO.H0 * 1e3) / MPC) * GA; // Ga⁻¹
  const E = (a) => Math.sqrt(Om / a ** 3 + OL), tempo = (a) => (2 / (3 * H0 * Math.sqrt(OL))) * Math.asinh(Math.sqrt(OL / Om) * a ** 1.5);
  const scala = (t) => Math.cbrt(Om / OL) * Math.sinh(1.5 * H0 * Math.sqrt(OL) * t) ** (2 / 3);
  // la crescita lineare D(a) ∝ E(a)·∫da/(aE)³, esatta per un cosmo piatto con materia e costante cosmologica
  const NA = 600, AMAX = 3, Dt = new Float64Array(NA + 1); let I = 0;
  for (let i = 1; i <= NA; i++) { const m = (AMAX * (i - 0.5)) / NA; I += AMAX / NA / (m * E(m)) ** 3; Dt[i] = E((AMAX * i) / NA) * I; }
  const D1 = Dt[NA / AMAX], D = (a) => { const x = (stringi(a, 0, AMAX) * NA) / AMAX, i = Math.min(NA - 1, Math.floor(x)); return (Dt[i] + (x - i) * (Dt[i + 1] - Dt[i])) / D1; };
  const Dinv = (d) => { let lo = 0, hi = AMAX; for (let k = 0; k < 40; k++) { const m = 0.5 * (lo + hi); if (D(m) < d) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  const rhoC = (3 * H0 * H0) / (8 * Math.PI * GK * KMS * KMS), fb = Ob / Om; // M☉/kpc³
  const delta = (a) => { const x = Om / a ** 3 / E(a) ** 2 - 1; return 18 * Math.PI ** 2 + 82 * x - 39 * x * x; };
  // lo spettro: P(k) ∝ k^ns·T²(k), k in h/Mpc
  const Gam = Om * h * Math.exp(-Ob * (1 + Math.sqrt(2 * h) / Om));
  const Tk = (k) => { const q = k / Gam; return (Math.log(1 + 2.34 * q) / (2.34 * q)) * Math.pow(1 + 3.89 * q + (16.1 * q) ** 2 + (5.46 * q) ** 3 + (6.71 * q) ** 4, -0.25); };
  const NK = 700, LK0 = Math.log(1e-4), LK1 = Math.log(3e3), dlk = (LK1 - LK0) / NK, kk = new Float64Array(NK), d2 = new Float64Array(NK);
  for (let i = 0; i < NK; i++) { const k = Math.exp(LK0 + (i + 0.5) * dlk); kk[i] = k; d2[i] = k ** (3 + ns) * Tk(k) ** 2; }
  const W = (x) => (x < 1e-2 ? 1 - x * x / 10 : (3 * (Math.sin(x) - x * Math.cos(x))) / x ** 3);
  const s2 = (R) => { let s = 0; for (let i = 0; i < NK; i++) { const w = W(kk[i] * R); s += d2[i] * w * w; } return s * dlk; };
  const norma = sigma8 ** 2 / s2(8);
  const rhoM = (Om * rhoC * 1e9) / h ** 3; // M☉ per (Mpc/h)³
  const NM = 56, LM0 = Math.log(1e5), LM1 = Math.log(1e16), lS = new Float64Array(NM + 1);
  for (let i = 0; i <= NM; i++) lS[i] = 0.5 * Math.log(norma * s2(Math.cbrt((3 * Math.exp(LM0 + (i * (LM1 - LM0)) / NM)) / (PI4 * rhoM))));
  const sigma = (M) => { const x = (stringi(Math.log(M), LM0, LM1) - LM0) / ((LM1 - LM0) / NM), i = Math.min(NM - 1, Math.floor(x)); return Math.exp(lS[i] + (x - i) * (lS[i + 1] - lS[i])); };
  const massaDi = (s) => { let lo = LM0, hi = LM1; for (let k = 0; k < 40; k++) { const m = 0.5 * (lo + hi); if (sigma(Math.exp(m)) > s) lo = m; else hi = m; } return Math.exp(0.5 * (lo + hi)); };
  // lo scarto del campo filtrato a un numero d'onda (in 1/Mpc): solo le onde più lunghe
  const sigmaOnde = (kMpc) => { let s = 0; const kc = kMpc / h; for (let i = 0; i < NK && kk[i] < kc; i++) s += d2[i]; return Math.sqrt(norma * s * dlk); };
  return { Om, OL, h, H0, E, tempo, scala, D, Dinv, rhoC, fb, delta, sigma, massaDi, sigmaOnde };
})();
const raggioViriale = (M, a) => Math.cbrt((3 * M) / (PI4 * U.delta(a) * U.rhoC * U.E(a) ** 2));
const concentrazione = (M, a) => Math.max(3, (LEGGI.concentrazione[0] * a) / U.Dinv(LEGGI.deltaC / U.sigma(LEGGI.concentrazione[1] * M)));
const nfw = (x) => Math.log(1 + x) - x / (1 + x);
// il disco esponenziale sottile (Freeman 1970): V² = (2GM/R_d)·F(y), F = y²·[I₀K₀ − I₁K₁], y = r/2R_d. Le funzioni di
// Bessel sono integrate (I_n = ∫e^{x cos θ}cos nθ/π, K_n = ∫e^{−x cosh t}cosh nt), una volta, in una tabella
const FREEMAN = (() => {
  const N = 160, YMAX = 12, F = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const y = (YMAX * i) / N, n = 160; let i0 = 0, i1 = 0, k0 = 0, k1 = 0; const tm = Math.acosh(1 + 36 / y);
    for (let j = 0; j < n; j++) { const th = (Math.PI * (j + 0.5)) / n, e = Math.exp(y * (Math.cos(th) - 1)); i0 += e; i1 += e * Math.cos(th); const t = (tm * (j + 0.5)) / n, f = Math.exp(-y * (Math.cosh(t) - 1)); k0 += f; k1 += f * Math.cosh(t); }
    F[i] = y * y * ((i0 / n) * ((k0 * tm) / n) - (i1 / n) * ((k1 * tm) / n));
  }
  return (y) => { const x = (stringi(y, 0, YMAX) * N) / YMAX, i = Math.min(N - 1, Math.floor(x)); const v = F[i] + (x - i) * (F[i + 1] - F[i]); return y > YMAX ? (v * YMAX) / y : v; };
})();
// la velocità circolare (km/s) a r (kpc): alone + disco + sferoide. m = { Mh, c, Rv, Md, Rd, Ms, as }
function velocita(m, r) {
  const x = r / m.Rv; let v2 = (GK * m.Mh * nfw(m.c * x)) / (nfw(m.c) * r);
  if (m.Md > 0 && m.Rd > 0) v2 += ((2 * GK * m.Md) / m.Rd) * FREEMAN(r / (2 * m.Rd));
  if (m.Ms > 0) v2 += (GK * m.Ms * r) / (r + m.as) ** 2;
  return Math.sqrt(v2);
}
// la velocità di fuga (km/s): il potenziale dell'alone più quello dei barioni (come un punto ammorbidito su 2R_d)
function fuga2(m, r) {
  const x = r / m.Rv;
  return 2 * ((GK * m.Mh * Math.log(1 + m.c * x)) / (nfw(m.c) * r) + (GK * m.Md) / Math.hypot(r, 2 * m.Rd) + (GK * m.Ms) / (r + m.as));
}
// il raffreddamento del gas caldo (W·m³, per n_e·n_H): vedi l'intestazione
const lambda = (T, Z) => 1e-13 * (2.4e-27 * Math.sqrt(T) + 5e-23 * Math.pow(Math.max(T, 1e5) / 1e5, -1.5) + (T < 4e7 ? (1.6e-19 * Z) / Math.sqrt(Math.max(T, 1e5)) : 0));
const MU_CALDO = 1 / (2 * (1 - YPRIMO) + 0.75 * YPRIMO), T_VIR = (MU_CALDO * COSTANTI.mp * 1e6) / (2 * COSTANTI.kB); // T = T_VIR·V² (K, V in km/s)
const K_COOL = (1.5 * COSTANTI.kB * COSTANTI.mp) / (MU_CALDO * (1 + YPRIMO / (2 * (1 - YPRIMO))) * (1 - YPRIMO) ** 2); // t = K·T/(ρ·Λ)

// ---------- LE POPOLAZIONI DI STELLE: per ogni M☉ nata con la distribuzione di Kroupa, quanto gas torna, quanti
// metalli nuovi, quante supernove, in funzione del tempo passato (in passi di DT). Le vite e i resti: stelle.js.
const Z_TAB = [0.02, 0.2, 1, 2.5];
const tabellaZ = (Z) => (Z < 0.063 ? 0 : Z < 0.45 ? 1 : Z < 1.6 ? 2 : 3);
const colorePerTemperatura = (T) => { // come in cosmo.js: da rossa (3000 K) a azzurra (20000 K)
  const t = stringi(Math.log(T / 3000) / Math.log(20000 / 3000), 0, 1);
  return [Math.round(255 - 40 * t), Math.round(150 + 90 * t - 20 * t * t), Math.round(90 + 165 * t)];
};
const resaCollasso = (m) => (LEGGI.resa[0] + LEGGI.resa[1] * m) * m;
let POP = null;
export function popolazione() {
  if (POP) return POP;
  // le masse: fitte dove sono rare (u = 1 − e^−s), ognuna con il suo peso in numero
  const N = 360, S = 15, ds = S / N, m = new Float64Array(N), w = new Float64Array(N), MCH = massaChandrasekhar() / MSOLE; let mm = 0, ww = 0;
  for (let i = 0; i < N; i++) { const s = (i + 0.5) * ds; m[i] = massaNascita(1 - Math.exp(-s)); w[i] = Math.exp(-s) * ds; ww += w[i]; }
  for (let i = 0; i < N; i++) { w[i] /= ww; mm += w[i] * m[i]; }
  const tab = Z_TAB.map((Z) => {
    const vita = new Float64Array(N), reso = new Float64Array(N), metalli = new Float64Array(N), sn = new Uint8Array(N); let tIa = Infinity, nSN = 0, uSN = 1;
    for (let i = 0; i < N; i++) {
      vita[i] = ST.stella(m[i], { Z }).vita / 1e9; if (!(vita[i] < 1e4)) { vita[i] = Infinity; continue; }
      const f = ST.fine(m[i], 1e-4, { Z }); reso[i] = Math.max(0, m[i] - f.massa); sn[i] = f.supernova ? 1 : 0;
      // i metalli nuovi escono solo se l'esplosione riesce (resta una stella di neutroni); se il nucleo ricade in un
      // buco nero (stelle.js) si porta dietro tutto ciò che ha fuso, e torna al gas solo l'involucro
      if (f.supernova && f.tipo === 'stella di neutroni') metalli[i] = Math.min(resaCollasso(m[i]), 0.9 * reso[i]);
      if (f.supernova) { nSN += w[i]; if (uSN === 1) uSN = 1 - Math.exp(-i * ds); } else if (f.tipo === 'nana bianca') tIa = Math.min(tIa, vita[i]);
    }
    // per ritardo L (la generazione nata nel passo j, vista alla fine del passo j + L): le frazioni cumulate
    const cR = new Float64Array(PASSI + 2), cP = new Float64Array(PASSI + 2), cN = new Float64Array(PASSI + 2), cI = new Float64Array(PASSI + 2);
    const [nIa, pIa] = LEGGI.Ia, R1 = nIa / ((Math.pow(tIa, pIa + 1) - Math.pow(T0, pIa + 1)) / -(pIa + 1)), Ia = (t) => (t <= tIa ? 0 : (R1 * (Math.pow(tIa, pIa + 1) - Math.pow(t, pIa + 1))) / -(pIa + 1));
    for (let L = 0; L <= PASSI; L++) {
      let r = 0, p = 0, n = 0, ia = 0;
      for (let i = 0; i < N; i++) { const f = stringi(L + 1 - vita[i] / DT, 0, 1); if (f > 0) { r += w[i] * reso[i] * f; p += w[i] * metalli[i] * f; n += w[i] * sn[i] * f; } }
      for (let q = 0; q < 12; q++) ia += Ia((L + (q + 0.5) / 12) * DT) / 12;
      cR[L + 1] = r / mm; cP[L + 1] = p / mm; cN[L + 1] = n / mm; cI[L + 1] = ia; // (l'indice è L + 1: cX[0] = 0 è «prima di nascere»)
    }
    return { Z, vita, reso, sn, cR, cP, cN, cI, tIa, nSN: nSN / mm, uSN };
  });
  // la luce e il colore di una generazione (a metà della vita di ogni stella, metalli del Sole): per il colore della galassia
  const luce = new Float64Array(PASSI + 1), tinta = new Float64Array(3 * (PASSI + 1)), L1 = new Float64Array(N), C1 = [];
  for (let i = 0; i < N; i++) { const s = ST.stella(m[i], { Z: 1 }); L1[i] = s.L; C1.push(colorePerTemperatura(s.T)); }
  for (let L = 0; L <= PASSI; L++) for (let i = 0; i < N; i++) { const viva = 1 - stringi(L + 1 - tab[2].vita[i] / DT, 0, 1), l = (w[i] * L1[i] * viva) / mm; luce[L] += l; for (let c = 0; c < 3; c++) tinta[3 * L + c] += l * C1[i][c]; }
  return (POP = { N, m, w, massaMedia: mm, tab, MCH, luce, tinta });
}

// ---------- L'ALONE: dal picco alla massa; la storia; le fusioni; lo spin dalle maree dei vicini
// La regione del picco ha sovradensità lineare δ = peso·σ_onde. Dentro, una fluttuazione piccola alta `raro` scarti
// crolla alla massa M per cui σ²(M) = σ_onde² + ((δc − δ)/raro)²: è la prima traversata della soglia di un cammino
// che parte da (σ_onde², δ) (Bond et al. 1991), con l'altezza fissata invece che estratta.
const ondeMemo = new Map();
const sigmaCampo = (toroM, onde) => { const k = `${toroM}|${onde}`; if (!ondeMemo.has(k)) ondeMemo.set(k, U.sigmaOnde((2 * Math.PI * onde) / (toroM / MPC))); return ondeMemo.get(k); };
export function massaAlone(peso, { toroM = 3.7e25, onde = 9 } = {}) {
  const sb = sigmaCampo(toroM, onde), d = Math.min(peso * sb, 0.9 * LEGGI.deltaC);
  return U.massaDi(Math.hypot(sb, (LEGGI.deltaC - d) / LEGGI.raro));
}
// LA VELOCITÀ PECULIARE di un punto del cosmo (km/s, nel piano della mappa): la teoria lineare. La materia cade verso
// dove ce n'è di più: ∇·v = −H₀·f·δ, con f = dlnD/dlna (≈ Ωm^0,55) il ritmo di crescita. Il campo di cosmo.js è una
// somma di onde, δ = (σ_onde/σ)·Σ a·cos(2π k·x + φ) (letto come per le masse: lo scarto del campo è σ_onde), e per ogni
// onda la velocità è lungo k: v = −H₀·f·(L/2π)·Σ A·(k/k²)·sin(2π k·x + φ).
// (Il campo di cosmo.js ha però le onde lunghe troppo forti rispetto allo spettro vero: le velocità vengono di qualche
// migliaio di km/s invece dei ~600 del Gruppo Locale. È ciò che quel campo dà, non una misura dell'universo vero.)
export function velocitaPeculiare(C, pos, { toroM = 3.7e25, onde = 9 } = {}) {
  const L = toroM / MPC, f = Math.log(U.D(1.01) / U.D(0.99)) / Math.log(1.01 / 0.99), k0 = (sigmaCampo(toroM, onde) / C.sigma) * COSMO.H0 * f * (L / (2 * Math.PI));
  let vx = 0, vy = 0; for (const m of C.modi) { const q = (-k0 * m.a * Math.sin(2 * Math.PI * (m.kx * pos[0] + m.ky * pos[1]) + m.fi)) / (m.kx * m.kx + m.ky * m.ky); vx += q * m.kx; vy += q * m.ky; }
  return [vx, vy];
}
// LA STORIA DELL'ALONE, ricostruita all'indietro da M0 (al passo nt): a ogni passo, con la massa che ha lì, si chiede
// se è entrato un compagno (un evento per ogni classe di rapporto, con la probabilità della legge di Fakhouri et al.
// 2010); il resto della crescita è liscio, al ritmo medio della stessa legge meno la parte che in media portano i
// compagni. Così la storia di ogni alone è coerente con le sue fusioni, e in media è quella misurata.
// caso: la sorgente degli eventi (null: nessun compagno, tutta la crescita è liscia); date: fusioni già decise
// ([{ quando (Ga), rapporto, attrito? }]: per le prove e per i compagni). → Mh[0…nt], con Mh.inizio e Mh.fusioni
const CLASSI = [['minore', 0.1, 0.3], ['maggiore', 0.3, 1]];
const integraleFusioni = (() => { const m = new Map(); return (a, b, massa = false) => { const k = `${a}|${b}|${massa}`; if (!m.has(k)) { const F = LEGGI.fusioni, n = 200, dl = Math.log(b / a) / n; let s = 0; for (let i = 0; i < n; i++) { const x = a * Math.exp((i + 0.5) * dl); s += x * dl * F.A * Math.pow(x, F.beta) * Math.exp(Math.pow(x / F.xi, F.gamma)) * (massa ? x / (1 + x) : 1); } m.set(k, s); } return m.get(k); }; })();
function storiaAlone(M0, nt, caso = null, date = null) {
  const Mh = new Float64Array(nt + 1), [A, esp, pz] = LEGGI.crescita, F = LEGGI.fusioni, [fA, fb, fc] = LEGGI.attrito, fusioni = [], L12 = Math.log(1e12);
  const ritmo = (lm, t) => { const a = U.scala(t); return A * 1e-3 * Math.exp((esp - 1) * (lm - L12)) * (1 + pz * (1 / a - 1)) * U.E(a); }; // d ln M/dt (1/Ga)
  // la parte che in media arriva nei compagni sopra 1:10 (per unità di tempo: dz/dt = (1+z)·H)
  const inCompagni = (lm, t) => { const a = U.scala(t); return integraleFusioni(CLASSI[0][1], 1, true) * Math.exp(F.alfa * (lm - L12)) * Math.pow(1 / a, F.eta + 1) * U.H0 * U.E(a); };
  const liscio = caso ? (lm, t) => { const r = ritmo(lm, t); return Math.max(0.2 * r, r - inCompagni(lm, t)); } : ritmo;
  const entra = (j, M, nome, rapporto, circ, attritoDato) => {
    const tauDyn = 0.1 / (U.H0 * U.E(U.scala(j * DT))), attrito = attritoDato ?? ((fA * Math.pow(1 / rapporto, fb)) / Math.log(1 + 1 / rapporto)) * Math.exp(fc * circ) * tauDyn; // (τ_dyn = R/V a 200 volte la densità critica)
    fusioni.push({ passo: j, quando: j * DT, classe: nome, rapporto, massaAlone: (M * rapporto) / (1 + rapporto), circolarita: circ, attrito, arrivo: j * DT + attrito }); return M / (1 + rapporto);
  };
  let lm = Math.log(M0); Mh[nt] = M0;
  for (let j = nt; j > 1; j--) {
    let M = Math.exp(lm); const minimo = M / 3; // (in un passo non può essere arrivato più di due terzi dell'alone)
    if (caso) {
      const z1 = 1 / U.scala((j - 1) * DT) - 1, z2 = 1 / U.scala(j * DT) - 1, zm = 0.5 * (z1 + z2);
      for (const [nome, xa, xb] of CLASSI) {
        const attese = integraleFusioni(xa, xb) * Math.pow(M / 1e12, F.alfa) * Math.pow(1 + zm, F.eta) * (z1 - z2);
        if (!(caso(`fusione ${j}/${nome}`) < attese)) continue;
        // il rapporto delle masse: dentro la classe segue ξ⁻² (la pendenza della legge); l'orbita: quanto è circolare
        const rapporto = 1 / (1 / xa - caso(`fusione ${j}/${nome}/rapporto`) * (1 / xa - 1 / xb));
        if (M / (1 + rapporto) >= minimo) M = entra(j, M, nome, rapporto, stringi(LEGGI.circolarita[0] + LEGGI.circolarita[1] * caso.normale(`fusione ${j}/${nome}/orbita`), 0.1, 1));
      }
    } else if (date) for (const f of date) if (stringi(Math.round(f.quando / DT), 2, nt) === j && M / (1 + f.rapporto) >= minimo) M = entra(j, M, f.rapporto >= CLASSI[1][1] ? 'maggiore' : 'minore', f.rapporto, f.circolarita ?? LEGGI.circolarita[0], f.attrito);
    lm = Math.log(M);
    const n = Math.max(2, Math.ceil(ritmo(lm, (j - 1) * DT) * DT * 8)), h = DT / n; let t = j * DT;
    for (let s = 0; s < n; s++) { const k1 = liscio(lm, t), k2 = liscio(lm - 0.5 * h * k1, t - 0.5 * h); lm -= h * k2; t -= h; }
    Mh[j - 1] = Math.exp(lm);
  }
  // quando comincia: quando l'alone è abbastanza grande da tenere gas a 10⁴ K, che l'idrogeno atomico sa raffreddare
  // (prima il gas non cade: niente stelle). Si continua all'indietro dentro il primo passo
  let t = Math.min(nt, 1) * DT; for (let s = 0; s < 80 && t > 0.03; s++) { const M = Math.exp(lm), a = U.scala(t); if ((GK * M) / raggioViriale(M, a) < 1e4 / T_VIR) break; lm -= 0.004 * liscio(lm, t); t -= 0.004; }
  Mh.inizio = t; Mh.fusioni = fusioni.reverse(); return Mh;
}
// le maree: ogni vicino tira il proto-alone lungo la retta che li unisce, con forza ∝ M/d³. Si sommano i vicini veri
// (posizioni sul toro, masse dal loro picco): ne escono l'intensità e la direzione della marea in quel punto
const mareeMemo = new WeakMap();
function maree(vicini, opz) {
  let m = mareeMemo.get(vicini); if (m) return m;
  const n = vicini.length, L = (opz.toroM ?? 3.7e25) / MPC, M = vicini.map((g) => g.alone?.massa ?? massaAlone(g.peso, opz)), tau = new Float64Array(n), dir = new Float64Array(n), vicino = new Float64Array(n).fill(Infinity), chi = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    let c = 0, s = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      let dx = vicini[j].pos[0] - vicini[i].pos[0], dy = vicini[j].pos[1] - vicini[i].pos[1]; dx -= Math.round(dx); dy -= Math.round(dy);
      const d = Math.max(Math.hypot(dx, dy) * L, 0.3), a = 2 * Math.atan2(dy, dx), f = M[j] / d ** 3; c += f * Math.cos(a); s += f * Math.sin(a);
      if (d < vicino[i]) { vicino[i] = d; chi[i] = j; }
    }
    tau[i] = Math.hypot(c, s); dir[i] = 0.5 * Math.atan2(s, c);
  }
  mareeMemo.set(vicini, (m = { M, tau, dir, vicino, chi, ordinate: Float64Array.from(tau).sort() })); return m;
}
// l'argomento dei tempi (Kahn & Woltjer 1959): due masse partite insieme all'inizio, su un'orbita radiale di Keplero,
// oggi a distanza d: r = a(1 − cos η), t = √(a³/GM)·(η − sin η). Se sono legate, tra quanto tornano insieme (Ga)
function tempoIncontro(M, dKpc) {
  const q = dKpc ** 3 / (GK * KMS * KMS * M * T0 * T0); if (!(q < 4.5)) return Infinity;
  let lo = 1e-3, hi = 2 * Math.PI; for (let k = 0; k < 50; k++) { const e = 0.5 * (lo + hi); if ((1 - Math.cos(e)) ** 3 / (e - Math.sin(e)) ** 2 > q) lo = e; else hi = e; }
  const e = 0.5 * (lo + hi); return T0 * ((2 * Math.PI) / (e - Math.sin(e)) - 1);
}
// L'ALONE DI UNA GALASSIA: massa dal picco, spin dalle maree dei vicini, fusioni dalla sua storia.
// G: { pos, peso } (com'è in cosmo(n).galassie); vicini: TUTTE le galassie del cosmo (G compresa o no);
// se G porta già G.alone = { massa, spin, fusioni } lo si usa così com'è (per le prove).
export function aloneGalassia(G, vicini = [], caso = sorgente('galassia'), opz = {}) {
  const dato = G.alone || {}, massa = dato.massa ?? massaAlone(G.peso, opz);
  let zMarea = 0, direzione = caso.tra('alone/asse', 0, Math.PI), vicino = null, prossima = null, marea = 0;
  if (vicini.length >= 3 && G.pos) {
    const T = maree(vicini, opz), L = (opz.toroM ?? 3.7e25) / MPC; let i = vicini.indexOf(G), tau, dir, dmin = Infinity, chi = -1;
    if (i < 0 && G.id != null && vicini[G.id]?.pos === G.pos) i = G.id;
    if (i >= 0) { tau = T.tau[i]; dir = T.dir[i]; dmin = T.vicino[i]; chi = T.chi[i]; }
    else { let c = 0, s = 0; vicini.forEach((v, j) => { let dx = v.pos[0] - G.pos[0], dy = v.pos[1] - G.pos[1]; dx -= Math.round(dx); dy -= Math.round(dy); const d = Math.max(Math.hypot(dx, dy) * L, 0.3), a = 2 * Math.atan2(dy, dx), f = T.M[j] / d ** 3; c += f * Math.cos(a); s += f * Math.sin(a); if (d < dmin) { dmin = d; chi = j; } }); tau = Math.hypot(c, s); dir = 0.5 * Math.atan2(s, c); }
    // il posto della sua marea tra quelle di tutte le galassie del cosmo, come scarto di una campana
    let sotto = 0; while (sotto < T.ordinate.length && T.ordinate[sotto] < tau) sotto++;
    zMarea = campana((sotto + 0.5) / (T.ordinate.length + (i >= 0 ? 0 : 1))); direzione = dir; marea = tau / (U.Om * U.rhoC * 1e9);
    if (chi >= 0) { vicino = { id: vicini[chi].id ?? chi, distanzaMpc: dmin }; const tra = tempoIncontro(massa + T.M[chi], dmin * 1e3); if (isFinite(tra)) prossima = { con: vicino.id, tra }; }
  }
  // lo spin: metà della varianza dalla marea vera, metà da quanto il proto-alone era storto rispetto a lei (un evento: la
  // coppia è nulla se sono allineati, massima a 45°; il verso in cui gira è il segno dello scarto)
  const zForma = caso.normale('alone/forma'), asse = direzione + (Math.PI / 4) * Math.tanh(zForma); // l'asse del proto-alone
  const spin = dato.spin ?? LEGGI.spin[0] * Math.exp((LEGGI.spin[1] * (zMarea + zForma)) / Math.SQRT2);
  const sb = sigmaCampo(opz.toroM ?? 3.7e25, opz.onde ?? 9);
  return { massa, spin, picco: G.peso ?? null, sovradensita: G.peso != null ? G.peso * sb : null, marea, zMarea, direzioneMarea: direzione, asse, verso: zForma >= 0 ? 1 : -1, vicino, prossimaFusione: prossima, fusioni: dato.fusioni ?? null };
}

// ---------- L'EVOLUZIONE: alone → gas → disco → stelle → metalli, su ANELLI anelli e nt passi di DT
const satelliti = new Map();
function satellite(Malone, passo) { // un compagno: la stessa fisica, senza fusioni sue, fermata quando entra nell'alone
  const lg = Math.round(Math.log10(Malone) * 5) / 5, k = `${lg}|${passo}`;
  let s = satelliti.get(k); if (!s) { if (satelliti.size > 600) satelliti.delete(satelliti.keys().next().value); s = evolvi(storiaAlone(10 ** lg, passo), LEGGI.spin[0], passo, [], 0, true); satelliti.set(k, s); }
  return { s, scala: Malone / 10 ** lg };
}
function evolvi(Mh, spin, nt, fusioni, scartoBuco, compagno = false) {
  const P = popolazione(), NR = ANELLI, M0 = Mh[nt], aN = U.scala(nt * DT), fb = U.fb;
  // la scala del disco in cui si posa gas con momento angolare specifico jg (kpc·km/s): R = jg/(2V), cioè λ·R_vir/√2
  // per il gas che ha lo spin dell'alone, con le correzioni di Mo, Mao & White per la concentrazione e il peso del disco
  const cadutaDi = (jg, Rv, Vv, c, md) => { const l = stringi(jg / (Math.SQRT2 * Rv * Vv), 0.005, 0.2), fc = 2 / 3 + Math.pow(c / 21.5, 0.7), fR = Math.pow(l / 0.1, -0.06 + 2.71 * md + 0.0047 / l) * (1 - 3 * md + 5.2 * md * md) * (1 - 0.019 * c + 0.00025 * c * c + 0.52 / c); return ((l * Rv) / Math.SQRT2 / Math.sqrt(fc)) * fR; };
  const momento = (M, a) => { const Rv = raggioViriale(M, a); return Math.SQRT2 * spin * M * Rv * Math.sqrt((GK * M) / Rv); }; // il momento angolare dell'alone
  // gli anelli: fino a 8 volte la scala che avrebbe oggi un disco con lo spin medio dell'alone, più fitti al centro
  const RvN = raggioViriale(M0, aN), Rg = 8 * cadutaDi(momento(M0, aN) / M0, RvN, Math.sqrt((GK * M0) / RvN), concentrazione(M0, aN), 0.05), bordo = Float64Array.from({ length: NR + 1 }, (_, k) => Rg * Math.pow(k / NR, 1.4)), rc = new Float64Array(NR), area = new Float64Array(NR);
  for (let k = 0; k < NR; k++) { area[k] = Math.PI * (bordo[k + 1] ** 2 - bordo[k] ** 2); rc[k] = ((2 / 3) * (bordo[k + 1] ** 3 - bordo[k] ** 3)) / (bordo[k + 1] ** 2 - bordo[k] ** 2); }
  const gas = new Float64Array(NR), met = new Float64Array(NR), nati = new Float64Array((nt + 1) * NR), Zn = new Float32Array((nt + 1) * NR), iz = new Uint8Array((nt + 1) * NR);
  // (le stelle portate dalle fusioni: per passo di nascita e per tabella di metalli, perché ognuna continui a vivere con le sue vite)
  const NE = nt + 1, est = new Float64Array(4 * NE), estZ = new Float64Array(4 * NE), haEst = new Uint8Array(NE), Zt = new Float32Array((nt + 1) * NR), V = new Float64Array(NR), dove = new Float64Array(NR);
  const S = { sfr: new Float64Array(nt + 1), gas: new Float64Array(nt + 1), stelle: new Float64Array(nt + 1), caldo: new Float64Array(nt + 1), collasso: new Float64Array(nt + 1), Ia: new Float64Array(nt + 1), freddo: new Uint8Array(nt + 1) };
  const B = { caduto: 0, cadutoZ: 0, vento: 0, ventoZ: 0, prodotti: 0, alCaldo: 0, alCaldoZ: 0, fusioniStelle: 0, fusioniStelleZ: 0, fusioniGas: 0, fusioniGasZ: 0, resi: 0 };
  const [ksA, ksN] = LEGGI.KS, ESN = LEGGI.energiaSN / MSOLE / 1e6, eSN = P.tab[2].nSN * ESN; // l'energia di una supernova in M☉·(km/s)², e per unità di massa nata in (km/s)²
  let caldo = 0, caldoZ = 0, caldoJ = 0, fuori = 0, fuoriZ = 0, fuoriJ = 0, sferoideFino = 0, Mdisco = 0, Msfer = 0, Rsfer = 0, Rd = 0.05 * Rg, ultimaMaggiore = 0, Jprima = 0;
  const arrivi = fusioni.filter((f) => f.passoArrivo <= nt), entrate = fusioni.filter((f) => f.passo <= nt);
  // ciò che una generazione di massa m nata al passo i (tabella q) restituisce tra il ritardo L0 e il ritardo L1
  // (zb: i metalli con cui era nata, in frazione di massa). R = [gas, metalli che porta, supernove da collasso, Ia, metalli NUOVI]
  const R = [0, 0, 0, 0, 0];
  const rende = (m, q, L0, L1, zb) => { const T = P.tab[q], ia = m * (T.cI[L1 + 1] - T.cI[L0 + 1]), mia = ia * P.MCH, nuovi = m * (T.cP[L1 + 1] - T.cP[L0 + 1]), g = m * (T.cR[L1 + 1] - T.cR[L0 + 1]); R[0] = g + mia; R[1] = zb * (g - nuovi) + nuovi + mia; R[2] = m * (T.cN[L1 + 1] - T.cN[L0 + 1]); R[3] = ia; R[4] = (nuovi + mia) * (1 - zb); };
  const metaMassa = () => { let tot = 0, s = 0; for (let k = 0; k < NR; k++) tot += dove[k]; if (!(tot > 0)) return Rd * 1.68; for (let k = 0; k < NR; k++) { if (s + dove[k] >= 0.5 * tot) return bordo[k] + ((0.5 * tot - s) / dove[k]) * (bordo[k + 1] - bordo[k]); s += dove[k]; } return bordo[NR]; };
  for (let j = 1; j <= nt; j++) {
    const t = j * DT, a = U.scala(t), Rv = raggioViriale(Mh[j], a), Vv = Math.sqrt((GK * Mh[j]) / Rv), c = concentrazione(Mh[j], a);
    // 1. la materia che entra: liscia, oppure in un compagno (che porta il suo gas caldo all'alone e resta in orbita)
    // Il gas porta il momento angolare che l'alone guadagna in quel passo (ΔJ/ΔM: la materia che arriva dopo, da più
    // lontano, ne ha di più della media): è la crescita del disco dall'interno verso l'esterno
    const Jh = momento(Mh[j], a), dMh = Mh[j] - Mh[j - 1], jGuscio = dMh > 0 ? (Jh - Jprima) / dMh : 0; Jprima = Jh;
    let dM = dMh;
    for (const f of entrate) if (f.passo === j) { const { s, scala } = satellite(f.massaAlone, j); dM -= f.massaAlone; caldo += (s.caldo + s.fuori) * scala; caldoZ += (s.caldoZ + s.fuoriZ) * scala; caldoJ += ((s.caldo + s.fuori) * scala * Jh) / Mh[j]; }
    dM = Math.max(0, dM);
    caldo += fb * dM; caldoJ += fb * dM * jGuscio;
    // il gas soffiato fuori dall'alone ci ricade, tanto prima quanto più l'alone è grande (Henriques et al. 2013)
    { const torna = 1 - Math.exp((-DT * Mh[j]) / (LEGGI.ritorno * 1e10)); caldo += fuori * torna; caldoZ += fuoriZ * torna; caldoJ += fuoriJ * torna; fuori *= 1 - torna; fuoriZ *= 1 - torna; fuoriJ *= 1 - torna; }
    // 2. le fusioni che arrivano al centro in questo passo
    for (const f of arrivi) {
      if (f.passoArrivo !== j) continue;
      const { s, scala } = satellite(f.massaAlone, f.passo); let ms = 0, msZ = 0;
      // le sue stelle vanno nello sferoide (ciò che hanno restituito da quando è entrato nell'alone è finito nel gas caldo)
      // (per passo di nascita e per tabella di metalli, le stesse con cui hanno vissuto là: così la massa torna esatta)
      for (let q = 0; q < 4; q++) for (let i = 1; i <= f.passo; i++) {
        const m = s.natiQ[q * (f.passo + 1) + i] * scala; if (m <= 0) continue;
        const zb = (s.natiQZ[q * (f.passo + 1) + i] * scala) / m, La = f.passo - i, Lb = j - 1 - i, vive = 1 - P.tab[q].cR[Lb + 1] - P.tab[q].cI[Lb + 1] * P.MCH;
        est[q * NE + i] += m; estZ[q * NE + i] += m * zb; haEst[i] = 1; if (Lb > La) { rende(m, q, La, Lb, zb); caldo += R[0]; caldoZ += R[1]; }
        ms += m * vive; msZ += m * zb * vive;
      }
      const mg = s.gasTot * scala, barioni = Mdisco + Msfer + gas.reduce((x, y) => x + y, 0), rb = (ms + mg) / Math.max(barioni, 1e-9);
      f.rapportoBarioni = rb; f.avvenuta = true; f.massaStelle = ms;
      B.fusioniStelle += ms; B.fusioniStelleZ += msZ; B.fusioniGas += mg; B.fusioniGasZ += s.gasZ * scala;
      const Rs = Math.max(s.raggioMeta * Math.cbrt(scala), 1e-3), unisci = (M1, R1, M2, R2) => (M1 + M2) ** 2 / (M1 * M1 / R1 + M2 * M2 / R2 + (M1 * M2) / (LEGGI.cole * (R1 + R2)));
      if (rb >= LEGGI.maggiore) {
        // maggiore: tutte le stelle di prima finiscono nello sferoide, e il gas di tutti gli anelli precipita al centro
        for (let k = 0; k < NR; k++) dove[k] = 0; for (let i = Math.max(1, sferoideFino); i < j; i++) for (let k = 0; k < NR; k++) dove[k] += nati[i * NR + k];
        const M1 = Mdisco + Msfer, R1 = M1 > 0 ? (Mdisco * metaMassa() + Msfer * Rsfer) / M1 : Rs;
        Rsfer = M1 > 0 ? unisci(M1, Math.max(R1, 1e-3), Math.max(ms, 1e-9), Rs) : Rs; Msfer += Mdisco + ms; Mdisco = 0; sferoideFino = j; ultimaMaggiore = t; f.tipo = 'maggiore';
        let g = mg, z = s.gasZ * scala; for (let k = 0; k < NR; k++) { g += gas[k]; z += met[k]; gas[k] = 0; met[k] = 0; } gas[0] = g; met[0] = z;
      } else {
        Rsfer = Msfer > 0 ? unisci(Msfer, Rsfer, Math.max(ms, 1e-9), Rs) : Rs; Msfer += ms; gas[0] += mg; met[0] += s.gasZ * scala; f.tipo = 'minore';
      }
    }
    // 3. il gas restituito dalle generazioni passate: agli anelli dov'erano nate, o all'alone caldo se ora sono nello sferoide
    let ncc = 0, nia = 0;
    for (let i = 1; i < j; i++) {
      const L = j - i, o = i * NR;
      for (let k = 0; k < NR; k++) { const m = nati[o + k]; if (m <= 0) continue; rende(m, iz[o + k], L - 1, L, Zn[o + k] * ZSOLE); if (i >= sferoideFino) { gas[k] += R[0]; met[k] += R[1]; } else { caldo += R[0]; caldoZ += R[1]; B.alCaldo += R[0]; B.alCaldoZ += R[1]; } B.prodotti += R[4]; B.resi += R[0]; ncc += R[2]; nia += R[3]; }
      if (haEst[i]) for (let q = 0; q < 4; q++) { const m = est[q * NE + i]; if (m <= 0) continue; rende(m, q, L - 1, L, estZ[q * NE + i] / m); caldo += R[0]; caldoZ += R[1]; B.alCaldo += R[0]; B.alCaldoZ += R[1]; B.prodotti += R[4]; B.resi += R[0]; nia += R[3]; ncc += R[2]; }
    }
    // 4. il raffreddamento: quanto gas caldo cade sul disco in questo passo
    const T = T_VIR * Vv * Vv, rhoV = (caldo / (PI4 * Rv ** 3)) * (MSOLE / KPC ** 3), tcool = rhoV > 0 ? (K_COOL * T) / (rhoV * lambda(T, caldo > 0 ? caldoZ / caldo / ZSOLE : 0)) / GA : Infinity;
    const x = Math.sqrt(t / tcool), tdyn = Rv / (Vv * KMS); let cade;
    if (x >= 1) { cade = caldo * (1 - Math.exp(-DT / tdyn)); S.freddo[j] = 1; } // si raffredda prima di fermarsi: cade in caduta libera
    else {
      const Mbn = Math.max(LEGGI.germe, LEGGI.bucoNero[0] * Math.pow(Msfer / 1e11, LEGGI.bucoNero[1]) * 10 ** scartoBuco);
      const scalda = 2 * LEGGI.radio[1] * LEGGI.radio[0] * 1e9 * (Mbn / 1e8) * (caldo / Mh[j] / 0.1) * (Vv / 200) ** 3 * (C_KMS / Vv) ** 2; // M☉/Ga tenute calde dal buco nero
      cade = Math.min(caldo, Math.max(0, (caldo * x) / (2 * t) - scalda) * DT);
    }
    if (cade > 0) {
      const zc = caldoZ / caldo, jc = caldoJ / caldo, md = stringi((Mdisco + Msfer) / Mh[j], 0.005, 0.1), Ra = cadutaDi(jc, Rv, Vv, c, md); let prima = 0;
      for (let k = 0; k < NR; k++) { const y = bordo[k + 1] / Ra, F = k === NR - 1 ? 1 : 1 - Math.exp(-y) * (1 + y); gas[k] += cade * (F - prima); met[k] += cade * zc * (F - prima); prima = F; }
      caldo -= cade; caldoZ -= cade * zc; caldoJ -= cade * jc; B.caduto += cade; B.cadutoZ += cade * zc;
    }
    // 5. la curva di rotazione di adesso, anello per anello
    let mg = 0, mr = 0; for (let k = 0; k < NR; k++) { mg += gas[k]; mr += gas[k] * rc[k]; dove[k] = 0; }
    for (let i = Math.max(1, sferoideFino); i < j; i++) for (let k = 0; k < NR; k++) dove[k] += nati[i * NR + k];
    let ms = 0; for (let k = 0; k < NR; k++) ms += dove[k];
    { const fr = ms > 0 ? Mdisco / ms : 0; for (let k = 0; k < NR; k++) mr += fr * dove[k] * rc[k]; ms *= fr; } // (delle stelle nate conta ciò che ne resta)
    // (la scala del disco esponenziale equivalente: metà del raggio medio di gas e stelle, pesato con la massa)
    if (mg + ms > 0) Rd = Math.max(0.5 * (mr / (mg + ms)), 1e-3);
    const mod = { Mh: Mh[j], c, Rv, Md: mg + Mdisco, Rd, Ms: Msfer, as: Math.max(Rsfer, 1e-3) / 2.414 };
    for (let k = 0; k < NR; k++) V[k] = velocita(mod, rc[k]);
    // 6. le stelle: Kennicutt-Schmidt dove il gas supera la soglia di Toomre; il vento
    let sfr = 0;
    for (let k = 0; k < NR; k++) {
      const o = j * NR + k; let formate = 0;
      if (gas[k] > 0) {
        const k0 = Math.max(0, k - 1), k1 = Math.min(NR - 1, k + 1), pend = Math.log(V[k1] / V[k0]) / Math.log(rc[k1] / rc[k0]), kappa = (V[k] / rc[k]) * Math.sqrt(2 * Math.max(0.05, 1 + pend));
        const sig = gas[k] / area[k], crit = (LEGGI.soglia[0] * kappa * LEGGI.soglia[1]) / (LEGGI.soglia[2] * GK);
        if (sig > crit) {
          // il vento: di ogni supernova resta in moto l'energia del suo guscio quando ha rallentato fino alla velocità del gas
          // attorno (½·p·σ_g, con p il momento finale del resto in gas di quella densità); con quella il gas esce dall'alone
          const nGas = Math.max(1e-3, (sig * MSOLE) / KPC ** 2 / (2 * LEGGI.spessoreGas * KPC) / (1.4 * COSTANTI.mp) / 1e6), resta = (LEGGI.momentoSN[0] * Math.pow(nGas, LEGGI.momentoSN[1]) * LEGGI.sigmaGas) / (2 * ESN);
          const eta = (resta * 2 * eSN) / fuga2(mod, rc[k]), s6 = sig / 1e6, dopo = Math.max(crit / 1e6, s6 * Math.pow(1 + (ksN - 1) * (1 + eta) * ksA * 1e3 * Math.pow(s6, ksN - 1) * DT, -1 / (ksN - 1))); // (non scende sotto la soglia: lì si ferma)
          const tolto = (s6 - dopo) * 1e6 * area[k], z = met[k] / gas[k]; formate = tolto / (1 + eta);
          gas[k] -= tolto; met[k] -= tolto * z; B.vento += tolto - formate; B.ventoZ += (tolto - formate) * z; fuori += tolto - formate; fuoriZ += (tolto - formate) * z; fuoriJ += (tolto - formate) * rc[k] * V[k];
          nati[o] = formate; Zn[o] = z / ZSOLE; iz[o] = tabellaZ(z / ZSOLE);
          // ciò che la generazione appena nata restituisce già in questo passo (le stelle massicce)
          rende(formate, iz[o], -1, 0, z); gas[k] += R[0]; met[k] += R[1]; B.prodotti += R[4]; B.resi += R[0]; ncc += R[2]; nia += R[3];
        }
      }
      sfr += formate; Zt[o] = gas[k] > 0 ? met[k] / gas[k] / ZSOLE : 0;
    }
    // le masse in stelle e resti di adesso (ciò che è nato meno ciò che è tornato al gas)
    let vd = 0, vs = 0;
    for (let i = 1; i <= j; i++) { const L = j - i; for (let k = 0; k < NR; k++) { const m = nati[i * NR + k]; if (m > 0) { const T = P.tab[iz[i * NR + k]], v = m * (1 - T.cR[L + 1] - T.cI[L + 1] * P.MCH); if (i >= sferoideFino) vd += v; else vs += v; } } if (haEst[i]) for (let q = 0; q < 4; q++) vs += est[q * NE + i] * (1 - P.tab[q].cR[L + 1] - P.tab[q].cI[L + 1] * P.MCH); }
    Mdisco = vd; Msfer = vs;
    S.sfr[j] = sfr / DT / 1e9; S.gas[j] = gas.reduce((x, y) => x + y, 0); S.stelle[j] = vd + vs; S.caldo[j] = caldo; S.collasso[j] = ncc / DT / 1e9; S.Ia[j] = nia / DT / 1e9;
  }
  // ---------- com'è oggi
  const sigStelle = new Float64Array(NR), sigGas = new Float64Array(NR), natiTot = new Float64Array(nt + 1), natiZ = new Float64Array(nt + 1), venute = new Float64Array(NE), venuteZ = new Float64Array(NE), natiQ = new Float64Array(4 * NE), natiQZ = new Float64Array(4 * NE); let nateTutte = 0, metStelle = 0;
  for (let i = 1; i <= nt; i++) {
    const L = nt - i; let m1 = 0, z1 = 0;
    for (let k = 0; k < NR; k++) { const m = nati[i * NR + k]; if (!(m > 0)) continue; const T = P.tab[iz[i * NR + k]], v = m * (1 - T.cR[L + 1] - T.cI[L + 1] * P.MCH); m1 += m; z1 += m * Zn[i * NR + k] * ZSOLE; natiQ[iz[i * NR + k] * NE + i] += m; natiQZ[iz[i * NR + k] * NE + i] += m * Zn[i * NR + k] * ZSOLE; metStelle += Zn[i * NR + k] * ZSOLE * v; if (i >= sferoideFino) sigStelle[k] += v / area[k]; }
    for (let q = 0; q < 4 && haEst[i]; q++) { metStelle += estZ[q * NE + i] * (1 - P.tab[q].cR[L + 1] - P.tab[q].cI[L + 1] * P.MCH); venute[i] += est[q * NE + i]; venuteZ[i] += estZ[q * NE + i]; }
    natiTot[i] = m1; natiZ[i] = m1 > 0 ? z1 / m1 : 0; nateTutte += m1 + venute[i];
  }
  let gasTot = 0, gasZ = 0; for (let k = 0; k < NR; k++) { sigGas[k] = gas[k] / area[k]; gasTot += gas[k]; gasZ += met[k]; dove[k] = sigStelle[k] * area[k] + gas[k]; }
  const aO = U.scala(nt * DT), RvO = raggioViriale(M0, aO), mod = { Mh: M0, c: concentrazione(M0, aO), Rv: RvO, Md: gasTot + Mdisco, Rd, Ms: Msfer, as: Math.max(Rsfer, 1e-3) / 2.414 };
  const raggioMeta = Mdisco + Msfer > 0 ? ((Mdisco + gasTot) * metaMassa() + Msfer * Rsfer) / (Mdisco + gasTot + Msfer) : Rd;
  if (compagno) return { natiTot, natiZ, natiQ, natiQZ, gasTot, gasZ, caldo, caldoZ, fuori, fuoriZ, raggioMeta, massaStelle: Mdisco + Msfer };
  return { M0, spin, nt, Mh, inizio: Mh.inizio, bordo, rc, area, nati, Zn, iz, est: venute, estZ: venuteZ, Zt, S, B, gas, met, sigStelle, sigGas, caldo, caldoZ, fuori, fuoriZ, sferoideFino, ultimaMaggiore, Mdisco, Msfer, Rsfer, mod, gasTot, gasZ, nateTutte, metStelle, fusioni };
}

// ---------- LA FORMA DI UNA GALASSIA, dal suo alone e dai suoi vicini.
// G: l'oggetto di cosmo(n).galassie ({ pos, peso, id }); vicini: tutte le galassie di quel cosmo; caso: la sorgente
// degli eventi della galassia (eventi.js: sorgente('cosmo 1/galassia 3', rami)). opz: { toroM, onde } del campo.
// → vedi in fondo alla funzione che cosa restituisce (masse in M☉, lunghezze in kpc, tempi in Ga se non detto).
export function formaGalassia(G, vicini = [], caso = sorgente('galassia'), opz = {}) {
  return formaDaAlone(aloneGalassia(G, vicini, caso, opz), caso);
}
export function formaDaAlone(alone, caso = sorgente('galassia')) {
  // la storia dell'alone con le sue fusioni: estratte dalla legge, oppure date (per le prove: [{ quando (Ga), rapporto }])
  const P = popolazione(), nt = PASSI, NR = ANELLI, Mh = alone.fusioni ? storiaAlone(alone.massa, nt, null, alone.fusioni) : storiaAlone(alone.massa, nt, caso);
  // (un compagno arriva al centro quando l'attrito dinamico ce l'ha portato; se non ha fatto in tempo è ancora in orbita)
  const fusioni = Mh.fusioni.map((f) => ({ ...f, passoArrivo: Math.max(f.passo + 1, Math.ceil(f.arrivo / DT - 1e-9)), avvenuta: false, tipo: 'in orbita' }));
  const scartoBuco = LEGGI.bucoNero[2] * caso.normale('buco/scarto');
  const e = evolvi(Mh, alone.spin, nt, fusioni, scartoBuco), { bordo, rc, area, sigStelle, sigGas, mod, S } = e;
  // ---- le masse e il tipo
  const massaDisco = e.Mdisco, massaSferoide = e.Msfer, massaStelle = massaDisco + massaSferoide, frazioneSferoide = massaStelle > 0 ? massaSferoide / massaStelle : 0;
  // ---- il disco: la scala (retta in ln Σ★ tra 1 e 4 scale, fuori dal centro, come si misura nelle galassie vere; si
  // parte da metà del raggio medio delle stelle e si ripete), e il raggio che tiene il 97% delle stelle del disco
  let raggioDisco = mod.Rd, cum = 0, r97 = bordo[NR];
  { const mD = sigStelle.reduce((a, s, k) => a + s * area[k], 0); if (mD > 0) raggioDisco = 0.5 * sigStelle.reduce((a, s, k) => a + s * area[k] * rc[k], 0) / mD;
    for (let giro = 0; giro < 3 && mD > 0; giro++) {
      let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
      for (let k = 0; k < NR; k++) if (rc[k] > raggioDisco && rc[k] < 4 * raggioDisco && sigStelle[k] > 0) { const y = Math.log(sigStelle[k]); sx += rc[k]; sy += y; sxx += rc[k] ** 2; sxy += rc[k] * y; n++; }
      if (n >= 3) { const p = (n * sxy - sx * sy) / (n * sxx - sx * sx); if (p < 0) raggioDisco = -1 / p; }
    }
    for (let k = 0; k < NR && mD > 0; k++) { const m = sigStelle[k] * area[k]; if (cum + m >= 0.97 * mD) { r97 = bordo[k] + ((0.97 * mD - cum) / m) * (bordo[k + 1] - bordo[k]); break; } cum += m; } }
  const raggioSferoide = e.Rsfer, aSfer = Math.max(raggioSferoide, 1e-3) / 2.414; // raggio di metà massa; scala di Hernquist
  const unitaKpc = Math.max(0.5, frazioneSferoide > 0.97 ? 0 : r97, frazioneSferoide > 0.3 ? 5 * raggioSferoide : 0);
  // ---- la curva di rotazione di oggi e ciò che ne discende: i bracci, la barra
  const R22 = 2.2 * raggioDisco, v = (r) => velocita(mod, r), sigmaA = (r) => { let k = 0; while (k < NR - 1 && bordo[k + 1] < r) k++; return [sigStelle[k], sigGas[k]]; };
  const gamma = (r) => stringi(1 - Math.log(v(1.1 * r) / v(0.9 * r)) / Math.log(1.1 / 0.9), 0.2, 1.8), omega = (r) => v(r) / r; // Γ = −dlnΩ/dlnr
  const kappa = (r) => omega(r) * Math.sqrt(2 * (2 - gamma(r)));
  const [s22, g22] = sigmaA(R22), Qgas = g22 > 0 ? (LEGGI.sigmaGas * kappa(R22)) / (Math.PI * GK * g22) : Infinity, Q = 1 / (1 / Qgas + 1 / LEGGI.Qstelle);
  const mBracci = (kappa(R22) ** 2 * R22) / (PI4 * GK * Math.max(s22 + g22, 1)), passoDi = (r) => { const g = gamma(r); return Math.atan(((2 / 7) * Math.sqrt(4 - 2 * g)) / g); };
  // il contrasto dell'onda nella densità delle stelle: da 0 (Q = Qstelle: l'amplificatore non guadagna) a 0,45 (Q ≈ 1);
  // il gas, più freddo, risponde di più: il doppio
  const contrasto = massaDisco > 0 && frazioneSferoide <= 0.8 ? 0.45 * stringi((LEGGI.Qstelle - Q) / (LEGGI.Qstelle - 1), 0, 1) : 0, contrastoGas = Math.min(0.95, 2 * contrasto);
  const numero = Math.round(stringi(mBracci, 2, 12));
  // la fase dei bracci anello per anello: dφ/dln r = 1/tan(passo), con il passo che segue il taglio locale
  const fase = new Float64Array(NR); for (let k = 1; k < NR; k++) fase[k] = fase[k - 1] + Math.log(rc[k] / rc[k - 1]) / Math.tan(passoDi(0.5 * (rc[k] + rc[k - 1])));
  // dove sta una stella rispetto al braccio (da −½ a ½ dell'intervallo tra due bracci; 0 è la cresta): le vecchie come la
  // densità dell'onda, 1 + A·cos; le giovani dove sono nate: la densità del gas, 1 + A_gas·cos, alla 1,4 (Kennicutt-Schmidt)
  const NC = 48, ripartizione = (A, n) => { const c = new Float64Array(NC + 1); for (let i = 0; i < NC; i++) c[i + 1] = c[i] + Math.pow(1 + A * Math.cos((2 * Math.PI * (i + 0.5)) / NC - Math.PI), n); for (let i = 0; i <= NC; i++) c[i] /= c[NC]; return c; };
  const cdf = ripartizione(contrastoGas, LEGGI.KS[1]), cdfVecchie = ripartizione(contrasto, 1);
  let vmax = 0, rmax = 0; for (let k = 0; k < NR; k++) { const x = v(rc[k]); if (x > vmax) { vmax = x; rmax = rc[k]; } }
  const massaGas = e.gasTot, instabile = massaDisco > 0 && frazioneSferoide < 0.5 && vmax / Math.sqrt((GK * (massaDisco + massaGas)) / raggioDisco) < LEGGI.barra;
  // la barra arriva fin dove il disco, da solo, fa più di metà della forza
  let rBarra = 0; if (instabile) { for (let k = 0; k < NR; k++) { const r = rc[k], vd2 = ((2 * GK * mod.Md) / mod.Rd) * FREEMAN(r / (2 * mod.Rd)); if (vd2 > 0.5 * v(r) ** 2) rBarra = bordo[k + 1]; else if (rBarra > 0) break; } rBarra = Math.min(rBarra, 2 * raggioDisco); }
  // la classe: ellittica se quasi tutto è sferoide; lenticolare se c'è un disco ma senza gas freddo abbastanza da fare bracci
  const classe = frazioneSferoide > 0.8 ? 'ellittica' : contrasto < 0.05 ? 'lenticolare' : rBarra > 0 ? 'spirale barrata' : 'spirale';
  const tipo = classe.startsWith('spirale') ? 'spirale' : 'ellittica'; // (i due nomi che cosmo.js e la mappa conoscono)
  // ---- il buco nero: dalla massa dello sferoide (Kormendy & Ho), o il germe; quanto mangia oggi
  const Mbn = Math.max(LEGGI.germe, LEGGI.bucoNero[0] * Math.pow(massaSferoide / 1e11, LEGGI.bucoNero[1]) * 10 ** scartoBuco);
  // in media cresce al passo delle stelle che ha attorno (l'anello centrale): ṁ/M_bn = ritmo di nascita/massa lì; in più,
  // in un alone caldo, il modo «radio» di Croton. Poi è acceso a tratti: la frazione di Eddington di oggi è un evento
  const m0 = sigStelle[0] * area[0] + massaSferoide * (bordo[1] / (bordo[1] + aSfer)) ** 2, sfr0 = e.nati[nt * NR] / DT / 1e9;
  const Vv = Math.sqrt((GK * alone.massa) / mod.Rv), radio = S.freddo[nt] ? 0 : LEGGI.radio[0] * (Mbn / 1e8) * (e.caldo / alone.massa / 0.1) * (Vv / 200) ** 3;
  const mediaBn = (m0 > 0 ? (Mbn * sfr0) / m0 : 0) + radio, mEdd = Mbn / (0.1 * 4.5e8); // M☉/anno (tempo di Salpeter: 4,5·10⁸ anni a resa 1)
  const p = -LEGGI.eddington, lMedia = Math.min(0.3, mediaBn / mEdd), lMin = Math.pow((lMedia * (1 - p)) / p, 1 / p), eddington = lMedia > 0 ? Math.min(1, lMin * Math.pow(1 - caso('buco/acceso') * (1 - Math.pow(lMin, p)), -1 / p)) : 0;
  const accrescimento = eddington * mEdd, attivita = eddington > 0 ? stringi(1 + Math.log10(eddington) / 6, 0, 1) : 0;
  // ---- le supernove di oggi; il colore (la luce di ogni generazione ancora viva)
  const ritmoSN = { collasso: S.collasso[nt], Ia: S.Ia[nt], totale: S.collasso[nt] + S.Ia[nt] };
  let luce = 0; const tinta = [0, 0, 0];
  for (let i = 1; i <= nt; i++) { let m = e.est[i]; for (let k = 0; k < NR; k++) m += e.nati[i * NR + k]; const L = nt - i; luce += m * P.luce[L]; for (let c = 0; c < 3; c++) tinta[c] += m * P.tinta[3 * L + c]; }
  const tmax = Math.max(...tinta, 1e-30), colore = tinta.map((x) => Math.round((255 * x) / tmax));
  // ---- il bilancio (in M☉): ciò che è entrato = ciò che c'è + ciò che è uscito; i metalli fatti = i metalli che ci sono
  const B = e.B;
  const bilancio = {
    entrato: B.caduto + B.fusioniGas + B.fusioniStelle, gas: massaGas, stelle: massaStelle, vento: B.vento, alCaldo: B.alCaldo, restituito: B.resi, nate: e.nateTutte,
    metalliProdotti: B.prodotti, metalliEntrati: B.cadutoZ + B.fusioniGasZ + B.fusioniStelleZ, metalliGas: e.gasZ, metalliStelle: e.metStelle, metalliVento: B.ventoZ, metalliCaldo: B.alCaldoZ, dettaglio: B,
  };
  const formazione = e.inizio; // (Ga) quando l'alone ha cominciato a raffreddare gas: nessuna stella è più vecchia
  const schiacciata = tipo === 'ellittica' ? stringi(LEGGI.assi[0] + LEGGI.assi[1] * caso.normale('sferoide/assi'), 0.35, 1) : 1;
  // gli angoli sulla mappa: i bracci partono dalla direzione della marea; la barra è lungo l'asse del proto-alone; il getto,
  // che esce lungo l'asse di rotazione, è disegnato di traverso alla barra (la galassia è vista di faccia)
  const angolo = alone.direzioneMarea ?? 0, asse = ((alone.asse ?? 0) % Math.PI + Math.PI) % Math.PI, getto = (asse + Math.PI / 2) % Math.PI;
  const buco = { M: Mbn, attivita, eddington, accrescimento, potenzaW: LEGGI.getto * accrescimento * (MSOLE / ANNO) * COSTANTI.c ** 2 };
  return {
    alone: { ...alone, raggioViriale: mod.Rv, velocitaViriale: Vv, concentrazione: mod.c, storia: Mh }, ambiente: alone.massa >= 1e14 ? 'ammasso' : alone.massa >= 1e13 ? 'gruppo' : 'campo',
    tipo, classe, massaStelle, massaGas, massaDisco, massaSferoide, frazioneSferoide, massaCalda: e.caldo, massaFuori: e.fuori,
    raggioDisco, raggioSferoide, scalaSferoide: aSfer, unitaKpc, unitaM: unitaKpc * KPC,
    velocita: v(R22), velocitaMassima: vmax, raggioVelocitaMassima: rmax,
    bracci: { numero, m: mBracci, passo: passoDi(R22), contrasto, contrastoGas, Q, angolo, verso: alone.verso ?? 1, fase, cdf, cdfVecchie, vita: (r) => Math.PI / (omega(r) * KMS) },
    barra: rBarra > 0 ? { raggio: rBarra, angolo: asse, forza: 0.6 } : null,
    buco, ritmoSN, fusioni: e.fusioni.map((f) => ({ quando: f.quando, rapporto: f.rapporto, arrivo: f.arrivo, avvenuta: f.avvenuta, tipo: f.tipo, rapportoBarioni: f.rapportoBarioni ?? null, massaStelle: f.massaStelle ?? null })),
    ultimaFusioneMaggiore: e.ultimaMaggiore || null, prossimaFusione: alone.prossimaFusione ?? null,
    storia: { dt: DT, t: Float64Array.from({ length: nt + 1 }, (_, j) => j * DT), sfr: S.sfr, gas: S.gas, stelle: S.stelle, caldo: S.caldo, collasso: S.collasso, Ia: S.Ia, freddo: S.freddo, alone: Mh },
    anelli: { bordo, r: rc, area, sigmaStelle: sigStelle, sigmaGas: sigGas, Z: e.Zt.subarray(nt * NR, (nt + 1) * NR) },
    bilancio, luce, tinta: colore, formazione: formazione * GA, eta: T0,
    // i campi che cosmo(n) mette sulla galassia (gli stessi nomi di oggi)
    perG: { tipo, bracci: numero, angolo, passo: passoDi(R22), schiacciata, attivita, getto, tinta: colore, formazione: formazione * GA },
    schiacciata, modello: mod, interno: e,
  };
}

// ---------- I RISCONTRI
// le supernove all'anno, oggi: { collasso, Ia, totale }
export const ritmoSupernove = (forma) => forma.ritmoSN;
// la metallicità del gas (in unità solari) al tempo t (ANNI dall'inizio) e al raggio r (kpc): è la Z con cui nasce una stella lì e allora
export function metallicita(forma, t, r) {
  const e = forma.interno, NR = ANELLI, x = stringi(t / 1e9 / DT, 1, e.nt), j = Math.min(e.nt - 1, Math.floor(x)), u = x - j;
  let k = 0; while (k < NR - 2 && e.rc[k + 1] < r) k++; const w = stringi((r - e.rc[k]) / (e.rc[k + 1] - e.rc[k]), 0, 1), z = (jj) => e.Zt[jj * NR + k] * (1 - w) + e.Zt[jj * NR + k + 1] * w;
  return z(j) * (1 - u) + z(j + 1) * u;
}
// la Z (in unità solari) con cui è nata una stella al tempo t (ANNI dall'inizio) nell'anello che contiene il raggio r (kpc):
// quella del gas di quell'anello quando le stelle di quel passo si sono formate (senza interpolare: è il conto del modello)
export function metallicitaDiNascita(forma, t, r) {
  const e = forma.interno, j = stringi(Math.floor(t / 1e9 / DT) + 1, 1, e.nt); let k = 0; while (k < ANELLI - 1 && e.bordo[k + 1] < r) k++;
  return e.Zn[j * ANELLI + k];
}
// l'angolo (radianti) a cui passa la cresta di un braccio al raggio r (kpc): gli altri sono a 2π/numero l'uno dall'altro
export function faseBraccio(forma, r) {
  const rc = forma.anelli.r, B = forma.bracci, NR = rc.length; let q = 0; while (q < NR - 2 && rc[q + 1] < r) q++;
  return B.angolo + B.verso * (B.fase[q] + stringi(Math.log(Math.max(r, 1e-6) / rc[q]) / Math.log(rc[q + 1] / rc[q]), -1, 2) * (B.fase[q + 1] - B.fase[q]));
}
// la velocità di rotazione (km/s) al raggio r (kpc), oggi; con `parti`: { alone, disco, sferoide }
export function curvaRotazione(forma, r, parti = false) {
  const m = forma.modello; if (!parti) return velocita(m, r);
  return { totale: velocita(m, r), alone: velocita({ ...m, Md: 0, Ms: 0 }, r), disco: Math.sqrt(Math.max(0, velocita({ ...m, Ms: 0 }, r) ** 2 - velocita({ ...m, Md: 0, Ms: 0 }, r) ** 2)), sferoide: Math.sqrt((GK * m.Ms * r) / (r + m.as) ** 2) };
}

// ---------- IL CATALOGO: `quante` stelle come campione della galassia, più le ultime supernove (vedi l'intestazione)
// caso: la stessa sorgente della galassia; gli eventi di ogni stella stanno a «stella N/…», quelli delle ultime
// supernove a «supernova K/…»: cambiarne uno con un ramo non sposta le altre.
// → { stelle: [{ id, pos, massa, massaNascita, eta (anni), Z, stato, T, colore, raggioM, B, morta, peso, componente, venuta (se è nata in un compagno poi fuso) }],
//     sorgenti: [getto, resti, pulsar], buco, ritmoSN (all'anno), pesoCampione, stelleVere }
const MU0 = 4e-7 * Math.PI, POTENZA = 1e31; // le potenze delle sorgenti sono in unità di 10³¹ W (10³⁸ erg/s: un resto giovane)
export function stelleGalassia(forma, caso = sorgente('galassia'), { quante = 2500 } = {}) {
  const P = popolazione(), e = forma.interno, NR = ANELLI, nt = e.nt, U1 = forma.unitaKpc, B = forma.bracci;
  // le celle da cui si estrae: (passo, anello) delle stelle nate qui, più le stelle portate dalle fusioni, in massa
  const celle = new Float64Array(nt * (NR + 1) + 1); let tot = 0;
  for (let i = 1; i <= nt; i++) { for (let k = 0; k < NR; k++) { tot += e.nati[i * NR + k]; celle[(i - 1) * (NR + 1) + k + 1] = tot; } tot += e.est[i]; celle[(i - 1) * (NR + 1) + NR + 1] = tot; }
  const ora = new Float64Array(NR + 1); for (let k = 0; k < NR; k++) ora[k + 1] = ora[k] + e.nati[nt * NR + k]; // dove nascono le stelle adesso
  // un punto del disco nell'anello k (u, w: due eventi), per una stella di una certa età (Ga)
  const nelDisco = (k, u, w, eta) => {
    const r = Math.sqrt(e.bordo[k] ** 2 + u * (e.bordo[k + 1] ** 2 - e.bordo[k] ** 2)); let fi;
    if (forma.barra && r < forma.barra.raggio) { // dentro la barra le orbite sono allungate lungo di lei, a ogni età
      const A = forma.barra.forza; let x = w; for (let it = 0; it < 14; it++) x = w - (A * Math.sin(4 * Math.PI * x)) / (4 * Math.PI); fi = forma.barra.angolo + 2 * Math.PI * x;
    } else if (B.contrasto > 0) { // i bracci: una stella giovane è ancora dove è nata (nel gas denso), una vecchia segue l'onda
      const q = w * B.numero, braccio = Math.floor(q), f = q - braccio, cd = eta < B.vita(r) ? B.cdf : B.cdfVecchie; let c = 0; while (c < cd.length - 2 && cd[c + 1] < f) c++;
      fi = faseBraccio(forma, r) + (2 * Math.PI * (braccio + (c + (f - cd[c]) / (cd[c + 1] - cd[c])) / (cd.length - 1) - 0.5)) / B.numero;
    } else fi = 2 * Math.PI * w;
    return [r * Math.cos(fi), r * Math.sin(fi)];
  };
  const uMax = (U1 / (U1 + forma.scalaSferoide)) ** 2; // lo sferoide (Hernquist) è tagliato al bordo della mappa
  const nelloSferoide = (u, w, q) => { const s = Math.sqrt(u * uMax), r = (forma.scalaSferoide * s) / (1 - s), R = r * Math.sqrt(1 - (2 * q - 1) ** 2), fi = 2 * Math.PI * w; return [R * Math.cos(fi), R * Math.sin(fi) * forma.schiacciata]; };
  // da quale generazione viene una Ia di oggi: in proporzione alla massa nata e al ritmo delle Ia a quel ritardo
  let pesiIa = null;
  const cellaIa = (u) => {
    if (!pesiIa) { pesiIa = new Float64Array(celle.length); let s = 0; for (let i = 1; i <= nt; i++) for (let k = 0; k <= NR; k++) { const m = k < NR ? e.nati[i * NR + k] : e.est[i]; if (m > 0) { const T = P.tab[k < NR ? e.iz[i * NR + k] : tabellaZ(e.estZ[i] / e.est[i] / ZSOLE)]; s += m * (T.cI[nt - i + 1] - T.cI[nt - i]); } pesiIa[(i - 1) * (NR + 1) + k + 1] = s; } }
    const x = u * pesiIa[pesiIa.length - 1]; let lo = 0, hi = pesiIa.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pesiIa[m] <= x) lo = m; else hi = m; } return lo;
  };
  const campo0 = (u) => Math.pow(10, -5 + 3 * u); // il campo magnetico alla nascita (tesla): come in cosmo.js, da 10⁻⁵ a 10⁻²
  // ---- le ultime supernove: gli intervalli tra una e l'altra dal ritmo di oggi; chi era e dov'era
  const ritmo = forma.ritmoSN, resti = []; let tSN = 0;
  for (let k = 0; k < RESTI && ritmo.totale > 0; k++) {
    const c = caso.sotto(`supernova ${k + 1}`); tSN += -Math.log(1 - c('quando')) / ritmo.totale; if (tSN > 1e5) break;
    const ia = c('tipo') < ritmo.Ia / ritmo.totale; let pos, Z = 1, f = null, m0 = 0, vita = 0, B0 = 0, anello = 0;
    if (!ia && ora[NR] > 0) { // una stella massiccia nata da poco, dove il gas fa stelle adesso
      const x = c('dove') * ora[NR]; while (anello < NR - 1 && ora[anello + 1] < x) anello++;
      Z = Math.max(1e-4, e.Zn[nt * NR + anello]); const T = P.tab[tabellaZ(Z)]; m0 = massaNascita(T.uSN + (1 - T.uSN) * c('massa')); B0 = campo0(c('campo'));
      for (let it = 0; it < 40; it++) { f = ST.fine(m0, B0, { Z }); if (f.supernova) break; m0 *= 1.03; }
      vita = ST.stella(m0, { Z }).vita; pos = nelDisco(anello, c('raggio'), c('angolo'), vita / 1e9);
    } else { // una nana bianca di una generazione passata: scelta come le stelle del campione, pesata con i ritardi delle Ia
      const lo = cellaIa(c('dove')), i = Math.floor(lo / (NR + 1)) + 1, kk = lo % (NR + 1), eta = (nt - i + 0.5) * DT; anello = Math.min(kk, NR - 1);
      pos = kk < NR && i >= e.sferoideFino ? nelDisco(kk, c('raggio'), c('angolo'), eta) : nelloSferoide(c('raggio'), c('angolo'), c('inclinazione'));
    }
    resti.push({ k, t: tSN, ia, pos, Z, f, m0, vita, B0, anello, c });
  }
  const riservati = resti.filter((r) => !r.ia), campione = quante - riservati.length;
  const stelleVere = tot / P.massaMedia, peso = stelleVere / campione, stelle = [];
  for (let s = 0; s < quante; s++) {
    const rs = s >= quante - RESTI ? riservati.find((r) => r.k === s - (quante - RESTI)) : null;
    if (rs) { // la stella di una delle ultime supernove da collasso: una stella vera, non un campione
      const f = rs.f; stelle.push({ id: s, pos: [rs.pos[0] / U1, rs.pos[1] / U1], massa: f.massa, massaNascita: rs.m0, eta: rs.vita + rs.t, T: 0, colore: f.tipo === 'buco nero' ? [20, 20, 30] : [150, 200, 255], stato: f.tipo, raggioM: f.raggio, B: f.B, morta: rs.t, Z: rs.Z, peso: 1, componente: 'disco', supernova: rs.k + 1 });
      continue;
    }
    const c = caso.sotto(`stella ${s}`);
    // quando e dove è nata: una cella, in proporzione alla massa nata lì
    let x = c('nascita') * tot, lo = 0, hi = celle.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (celle[m] <= x) lo = m; else hi = m; }
    const i = Math.floor(lo / (NR + 1)) + 1, k = lo % (NR + 1), da = i === 1 ? e.inizio : (i - 1) * DT, nascita = da + c('quando') * (i * DT - da), eta = (T0 - nascita) * 1e9;
    const esterna = k === NR, Z = Math.max(1e-4, esterna ? e.estZ[i] / e.est[i] / ZSOLE : e.Zn[i * NR + k]), componente = esterna || i < e.sferoideFino ? 'sferoide' : 'disco';
    const p = componente === 'disco' ? nelDisco(k, c('raggio'), c('angolo'), eta / 1e9) : nelloSferoide(c('raggio'), c('angolo'), c('inclinazione')), pos = [p[0] / U1, p[1] / U1];
    // chi è: la massa dalla distribuzione misurata, il campo; poi vive secondo stelle.js fino a oggi
    const m0 = massaNascita(c('massa')), B0 = campo0(c('campo')), vita = ST.stella(m0, { Z }).vita;
    if (eta < vita) {
      const adesso = ST.stella(m0, { Z, eta }), gigante = eta > 0.9 * vita, T = gigante ? Math.min(adesso.T, 4200) : adesso.T;
      stelle.push({ id: s, pos, massa: m0, T, colore: colorePerTemperatura(T), stato: gigante ? 'gigante rossa' : 'in vita', eta, B: B0, Z, peso, componente, ...(esterna ? { venuta: true } : {}) });
    } else {
      const f = ST.fine(m0, B0, { Z }), morta = eta - vita; let T = 0, colore = f.tipo === 'buco nero' ? [20, 20, 30] : [150, 200, 255];
      if (f.tipo === 'nana bianca') { // si raffredda irradiando il calore dei suoi ioni (Mestel 1952): L ∝ M·t^−7/5
        const L = LSOLE * Math.pow((8.8e6 * Math.pow(f.massa, 5 / 7)) / Math.max(morta, 1e4), 7 / 5); T = Math.min(1.5e5, Math.pow(L / (PI4 * f.raggio ** 2 * COSTANTI.sigma), 0.25)); colore = [225, 230, 255];
      }
      stelle.push({ id: s, pos, massa: f.massa, massaNascita: m0, eta, T, colore, stato: f.tipo, raggioM: f.raggio, B: f.B, morta, Z, peso, componente, ...(esterna ? { venuta: true } : {}) });
    }
  }
  // ---- le sorgenti dei raggi cosmici: il getto del buco nero, i resti delle ultime supernove, le loro pulsar
  const sorgenti = [{ tipo: 'getto', nome: 'il getto del buco nero', pos: [0, 0], potenza: forma.buco.potenzaW / POTENZA, potenzaW: forma.buco.potenzaW, angolo: forma.perG.getto }];
  for (const r of resti) {
    // il resto: prima si espande libero (v = √(2E/M)), poi come un'onda d'urto di Sedov-Taylor nel gas di quell'anello
    const E = LEGGI.energiaSN, espulsa = (r.ia ? P.MCH : r.m0 - r.f.massa) * MSOLE, n = Math.max(1e3, (forma.anelli.sigmaGas[r.anello] * MSOLE) / KPC ** 2 / (2 * LEGGI.spessoreGas * KPC) / (1.4 * COSTANTI.mp)), ts = r.t * ANNO;
    const raggio = Math.min(Math.sqrt((2 * E) / espulsa) * ts, 1.15 * Math.pow((E * ts * ts) / (1.4 * COSTANTI.mp * n), 0.2)), tau = LEGGI.sedov[0] * Math.pow(n / 1e6, LEGGI.sedov[1]);
    const potenzaW = ((LEGGI.cosmici * E) / (tau * ANNO)) * Math.exp(-r.t / tau), pos = [r.pos[0] / U1, r.pos[1] / U1];
    sorgenti.push({ tipo: 'supernova', nome: `il resto della supernova ${r.k + 1}`, pos, r: raggio / KPC / U1, raggioM: raggio, potenza: potenzaW / POTENZA, potenzaW, eta: r.t, resto: r.ia ? 'niente (è esplosa una nana bianca)' : r.f.tipo, stella: r.ia ? null : quante - RESTI + r.k });
    if (!r.ia && r.f.tipo === 'stella di neutroni') {
      // la pulsar: un magnete che gira e si frena irradiando (dipolo: L = 2π·B²R⁶Ω⁴/(3μ₀c³)); la supernova le ha dato una spinta
      const periodo = Math.max(0.01, LEGGI.pulsar[0] + LEGGI.pulsar[1] * r.c.normale('pulsar/periodo')), Om = (2 * Math.PI) / periodo, Lp = ((2 * Math.PI) / (3 * MU0 * COSTANTI.c ** 3)) * r.f.B ** 2 * r.f.raggio ** 6 * Om ** 4;
      const corsa = (LEGGI.pulsar[2] * 1e3 * Math.sqrt(-2 * Math.log(1 - r.c('pulsar/spinta'))) * ts) / KPC, ang = 2 * Math.PI * r.c('pulsar/verso');
      sorgenti.push({ tipo: 'pulsar', nome: `la ${r.f.B > 1e10 ? 'magnetar' : 'pulsar'} nel resto ${r.k + 1}`, pos: [pos[0] + (corsa * Math.cos(ang)) / U1, pos[1] + (corsa * Math.sin(ang)) / U1], potenza: Lp / POTENZA, potenzaW: Lp, B: r.f.B, periodo, eta: r.t });
    }
  }
  return { stelle, sorgenti, buco: forma.buco, ritmoSN: ritmo.totale, pesoCampione: peso, stelleVere };
}

// (per le prove e per chi vuole guardare dentro)
export const dentro = { U, T0, DT, KPC, GA, GK, KMS, ZSOLE, raggioViriale, concentrazione, velocita, FREEMAN, lambda, storiaAlone, evolvi, tempoIncontro, maree, campana, resaCollasso };
