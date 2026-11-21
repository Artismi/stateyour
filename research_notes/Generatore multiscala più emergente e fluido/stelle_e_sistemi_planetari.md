# Stelle e sistemi planetari: più emergenti, collegati, continui nello zoom, rapidi e precisi

Note di un gruppo multidisciplinare (astrofisica stellare, formazione planetaria, meccanica celeste, impatti e volatili).
Segni di verifica: **[V]** letto sulla fonte (abstract, testo o tabella); **[R]** ricordato, da rileggere; **[D]** derivato qui
con un conto esplicito; **[M]** misurato qui facendo girare il codice del repo in sola lettura (script in
`/tmp/claude-0/-home-user/e4f7d681-8c14-51b2-bfef-3d2a580b715c/scratchpad/prova/`, che importano `src/camera/*.js` senza
modificarlo). I riferimenti al codice sono `file:riga` della copia attuale. Il progetto non dichiara una licenza
(`package.json` non ha il campo `license`): conta per decidere che cosa si può copiare da codici GPL. **[M]**

Misure di partenza **[M]**, che rendono concreti i tre difetti noti:
- `formaPianeti` (stella di 1 M☉, Z = 1, 4,5 Ga, semi 1–60; rocciosi tra 0,5 e 2 UA sopra 0,3 M⊕: 149 pianeti, 313 ms in tutto):
  il 32% di tutti gli urti giganti avviene prima di 10 Ma; mediana di tutti gli urti 15,7 Ma; il 25% degli urti ha una
  distanza «ceduta» `delta` ≤ 2√3 (orbite già incrociate: attesa zero); la mediana di `delta` è 7,88 raggi di Hill reciproci.
- Nei sistemi veri dell'app (`cosmo.sistema(1, g, s)` per 120 stelle, `impatti.giganteDi`): ultimo urto gigante dei rocciosi
  p10/p50/p90 = 4,0 / 18,5 / 1839 Ma; per stelle 0,7–1,3 M☉ e pianeti > 0,3 M⊕: 6,3 / 23,2 / 900 Ma (45 pianeti).
- Acqua dei rocciosi (stesso campione di `formaPianeti`): frazione in massa p10/p50/p90 = 0,18% / 0,56% / 2,9%; acqua in
  superficie (`leggi.acquaInSuperficie`) = 0,26 / 1,97 / 25,9 oceani terrestri (oceano = 1,4·10²¹ kg [R]).

---

## 1. Evoluzione stellare in JS (MIST/PARSEC contro SSE di Hurley) e aspetto della superficie stellare

### Takeaway
La sequenza principale di `stelle.js` è già emergente (struttura integrata, nessuna taratura) e va tenuta; mancano la
contrazione prima della sequenza principale e tutto ciò che viene dopo. La via più economica e coerente è: pre-sequenza
dalle stesse equazioni già scritte (il politropo n = 3/2 delle nane brune), post-sequenza con le formule SSE di Hurley
(errore dichiarato ≤ 5%, pochi kB di coefficienti) agganciate al punto finale della traccia propria; MIST è troppo grande
e ha diritti riservati. L'aspetto (oscuramento al bordo, granuli, macchie) si ricava da grandezze che `stelle.js` ha già.

### Cited Findings
**(a) Che cosa non emerge nel codice**
- Dopo la sequenza principale «non c'è niente: stella() resta ferma all'ultimo stato» — `src/camera/stelle.js:79`; manca
  anche la contrazione iniziale (`stelle.js:72`), e `disco.js:89-90` lo dichiara: la luce «al tempo del disco» è quella
  dell'età zero, mentre le stelle giovani (le piccole molto di più) sono più luminose. **[M lettura]**
- Opacità sotto 10⁴ K prese già fatte (H⁻ e molecole), «il triplo del valore vero alla fotosfera» — `stelle.js:54-57`,
  `:110`; opacità senza righe, ±40% nel Sole, raggi −15…25% a 1,5–3 M☉ — `stelle.js:66`, `:83-84`. **[M lettura]**
- Massa finale delle nane bianche dalla relazione misurata (Cummings 2018) al posto della perdita di massa — `stelle.js:58-59`,
  `:117`; confine stella di neutroni/buco nero «7 M☉ di elio, citato a memoria» — `stelle.js:60-61`, `:116`. **[M lettura]**
- La tabella è 7 Z × 35 masse × ~10 età (`stelle.js:589-590`, `stelle_tabella.js`), interpolata «in un microsecondo»
  (`stelle.js:33-35`): è già il modello di «tabella rigenerabile». **[M lettura]**
- Rotazione della stella: Skumanich P ∝ √t tarato sul Sole (25,4 d a 4,57 Ga), 120 km/s fissi per le calde — `orbite.js:21-23`;
  campo magnetico della stella sorteggiato in `galassie.js` (voce ST12 dell'inventario). **[M lettura]**

**(b–c) Le alternative, con costo ed errore**
- SSE (Hurley, Pols & Tout 2000, MNRAS 315, 543): formule continue di L, R e massa del nucleo in funzione di età, massa e
  metallicità, dalla ZAMS ai resti; «agree with detailed models to within 5 per cent» per gran parte dell'evoluzione;
  pensate per sintesi di popolazione e codici N-corpi — [arXiv:astro-ph/0001295](https://arxiv.org/abs/astro-ph/0001295) **[V]**.
  Licenza del codice SSE: non trovata nei risultati — **[R]**: il pacchetto Fortran è scaricabile liberamente dal sito di
  Hurley senza licenza esplicita; le FORMULE pubblicate si possono riscrivere in JS senza vincoli.
- MIST: tracce EEP e isocrone per [Fe/H] da −4,00 a +0,50 (v1.2: passo 0,5 dex fino a −2,5 poi 0,25; v2.5 anche [α/Fe]
  da −0,2 a +0,6), rotazione v/v_crit = 0 e 0,4; le tracce EEP pesano 67–107 MB compressi per ogni [Fe/H]; le isocrone
  «Full» v2.5 6,8–7,1 GB; la pagina dice «© MIST. All rights reserved» senza termini d'uso —
  [MIST model grids](https://mist.science/model_grids.html) **[V]**. Conseguenza: per incorporarla serve un permesso o una
  riduzione propria dei dati (che resta un derivato).
- PARSEC: tracce e isocrone scaricabili dal sito CMD di Padova, uso libero con citazione — **[R]** (non verificato).
- Riduzione EEP **[D]**: 30 punti EEP × 50 masse × 15 metallicità × 4 grandezze (log L, log R, log T_c, massa del nucleo)
  ≈ 9·10⁴ numeri ≈ 360 kB in Float32; interpolazione EEP lineare in log M, [Fe/H] e fase: costo come quello attuale.
- Pre-sequenza emergente **[D]**: `stelle.js:559-562` integra già la contrazione di una sfera tutta convettiva
  (politropo n = 3/2, E = −(3/7)GM²/R, energia dal viriale) per le nane brune. La stessa funzione, partita da R grande e
  fermata quando l'idrogeno pareggia le perdite (il criterio della massa minima già calcolato), dà la traccia di Hayashi
  di ogni stella: L(t) ≈ −dE/dt, t_KH = GM²/(RL). Sopra ~1 M☉ manca la fase radiativa di Henyey (errore atteso: la
  luminosità pre-sequenza delle stelle intermedie sottostimata di un fattore pochi **[R]**).
- Post-sequenza: SSE con nucleo che cresce come dM_c/dt = A_H·L, giganti con L = min(B·M_c^q, D·M_c^p), vento di Reimers
  (formule già riportate in `reports/Come farlo emergere.md` §6 come [V-prec]). Aggancio: si scala la traccia SSE perché
  alla fine dell'idrogeno centrale dia L e R della traccia propria (continuità; errore sul raggio della gigante ~ quello
  di SSE, 5% **[V]**, più lo scarto di `stelle.js` a TAMS, −15…25% a 1,5–3 M☉ **[M lettura]**).

**Aspetto della superficie**
- Granuli: la loro taglia varia con continuità con i parametri dell'atmosfera ma «non è semplicemente proporzionale
  all'altezza di scala della pressione» (Trampedach, Asplund & Collet 2013, griglia di 37 simulazioni 3D) —
  [arXiv:1303.1780](https://arxiv.org/pdf/1303.1780) **[V]**; nella griglia CIFIST la taglia è 3–10 volte H_p locale, con
  il fattore strettamente legato al contrasto di Mach — [arXiv:1307.2810](https://arxiv.org/pdf/1307.2810) **[V, dalla
  sintesi]**. H_p = kT/(μ m_H g) la danno già `fotosfera()` e `mescolamento()` (`stelle.js:336-341`, `:379-385`).
- Oscuramento al bordo **[R]**: l'atmosfera grigia di Eddington che `stelle.js:378-385` usa già dà da sola
  I(μ)/I(1) = (2 + 3μ)/5 (legge lineare con u = 0,6); le tabelle di Claret (leggi a 4 coefficienti, VizieR, libere)
  correggono il colore; errore della legge grigia nel visibile ~10–20% al bordo.
- Macchie e attività **[R]**: numero di Rossby Ro = P_rot/τ_c; τ_c si calcola dalla convezione stessa
  (τ_c = ∫ dr/v_conv nell'involucro, con v_conv della lunghezza di mescolamento già in `mescolamento()`); attività X
  satura sotto Ro ≈ 0,1 e cala come Ro^(−2…−2,7) sopra (Wright et al. 2011); frenamento magnetico alla Matt et al. 2015
  al posto di Skumanich; frazione di superficie coperta da macchie crescente con 1/Ro. Così il campo della stella (ST12)
  smette di essere un sorteggio.

**(d) Genitore → figlio, e ritorno**
- Dalla galassia alla stella: Z e la miscela elemento per elemento (`elementi.js:14-20`, `abbondanzeDaCanali`), [α/Fe]
  (che sposta la massa minima e i raggi: MIST v2.5 ha la griglia in [α/Fe] **[V]**). Dalla stella al disco: L(t) di
  pre-sequenza (linea della neve), L_X/L_EUV (fotoevaporazione: Owen 2012 in `Come farlo emergere.md` §4 [V-prec]),
  il vento. Ritorno alla galassia: la massa persa dal vento e dalla nebulosa planetaria (SSE la dà) e le rese; oggi la
  chimica galattica usa rese tabulate per massa, non la stessa stella: con SSE la massa restituita è la stessa che la
  stella perde (bilancio chiuso).

### Inferences
- Tenere `stelle.js` come fonte della sequenza principale (è la parte più emergente del progetto) e aggiungere SSE solo
  fuori di essa evita di introdurre una seconda «verità» sulla stessa grandezza (regola 7 del progetto).
- La pre-sequenza è la modifica stellare con più conseguenze a valle: la linea della neve primordiale (acqua), il disco
  caldo (Na, K, Cl), la XUV che toglie l'aria. Va fatta prima della post-sequenza.

### Gaps
- Licenza del codice SSE/BSE e termini PARSEC non verificati.
- Coefficienti di Claret e la relazione macchie–Rossby non riletti; nessuna fonte letta per la legge della frazione di
  macchie.

---

## 2. Dal disco ai pianeti: sintesi di popolazione e perché l'età degli urti giganti esce dieci volte troppo presto

### Takeaway
Gli urti giganti escono presto per tre cause concrete nel codice: gli embrioni nascono troppo vicini (10 raggi di Hill
singoli = 7,9 reciproci), dopo ogni fusione l'orbita prende subito un'eccentricità piena che rende la coppia accanto
«già incrociata» (attesa zero), e tra incrocio e urto non c'è il tempo di ricerca (salvo per l'ultimo, in `impatti.js`).
La legge che lo corregge senza N-corpi è il modello semi-analitico a eventi di Kimura et al. 2025 (Laplace–Lagrange per
e(t), tempo d'incrocio di Petit 2020 sulla distanza minima tra le orbite, poi competizione tra diffusione e urto con il
fuoco gravitazionale, clock che avanza evento per evento), con la legge di Zhou 2007 come controllo.

### Cited Findings
**(a) Che cosa è messo a mano o è la causa del difetto**
- Strisce di larghezza `2C` raggi di Hill della massa SINGOLA, `C = 5` — `disco.js:54`, `:191-198`; la stabilità è poi
  misurata in raggi di Hill RECIPROCI della somma (`hill(p.m + q.m, am)`, `disco.js:252`): spaziatura iniziale
  10/2^(1/3) = 7,94 reciproci **[D]**, confermata dalla mediana misurata di `delta` = 7,88 **[M]**.
- Il tempo dell'incrocio: `tIncrocio = max(p.tUrto, q.tUrto) + giriCheRegge(delta, mu2)·anno` — `disco.js:264-265`; con
  `delta = s·K`, dove `s` usa già le eccentricità (`disco.js:252`): dopo una fusione `delta` scende sotto 2√3 e
  `giriCheRegge` restituisce 0 (`disco.js:154`). Il 25% degli urti ha attesa nulla **[M]**.
- L'eccentricità dopo la fusione è subito `mescola·v_fuga/v_orbita·(0,7…1,3)`, `mescola = 0,25` — `disco.js:55`, `:272`;
  lo smorzamento arriva solo «oggi», sorteggiato (`disco.js:341`).
- Fusione o fionda decise da un sorteggio pesato col numero di Safronov — `disco.js:266`; la velocità critica di Genda
  et al. 2012 c'è già ma solo in `impatti.js:209` (voce DS14 dell'inventario).
- Il tempo di ricerca dopo l'incrocio («cerca», Öpik) è aggiunto solo all'ULTIMO urto, in `impatti.js:269-282`, con
  e = `mescola`·v_fuga/v_K: per due corpi di Marte a 1 UA vale ~10⁶ anni **[D]** (particella nella scatola:
  t ≈ (2e/π)·T·(a/R)²/(1 + v_f²/v²), e = 0,05, R = 6800 km → 1,3 Ma).
- Leggi empiriche dichiarate: crescita oligarchica (`disco.js:134-140`), involucro 10⁹·M⁻³ anni (`:141-144`), Chambers
  1996 interpolata in log μ (`:145-154`), vita del gas sorteggiata (`:78-79`), massa del disco log-normale (`:96-98`),
  profilo r^−1,5 fino a 30·√M UA (`:51`, `:94-95`), presa 0,05 (`:57`), senzaGas 300 (`:59`). Niente migrazione
  (`disco.js:25-26`), niente ciottoli.

**I tempi veri (le simulazioni N-corpi)**
- Kokubo & Genda 2010 (ApJ 714, L21): con la condizione d'accrescimento realistica (dalle SPH) circa metà degli urti non
  fonde; nel disco standard si formano tipicamente due pianeti di taglia terrestre in ~10⁸ anni; spin gaussiano,
  obliquità isotropa; numero, massa e orbite finali quasi indipendenti dalla condizione — [arXiv:1003.4384](https://ar5iv.labs.arxiv.org/html/1003.4384) **[V, dalla sintesi dell'abstract]**;
  l'inefficienza allunga i tempi «di un fattore 2 o più» (sintesi successiva, stesso gruppo) **[V, secondaria]**.
- Quintana et al. 2016 (ApJ 821, 126): 280 simulazioni, metà con frammentazione e «mordi e fuggi»; mediana dell'ultimo
  urto gigante 43 Ma; mediana 3 urti giganti per analogo terrestre; solo 15 su 164 analoghi ricevono un urto capace di
  strappare tutta l'aria — [arXiv:1511.03663](https://arxiv.org/abs/1511.03663) **[V, dalla sintesi]**.
- Jacobson et al. 2014 (Nature 508, 84): orologio degli elementi siderofili: urto della Luna a 95 ± 32 Ma; 40 Ma o prima
  escluso al 99,9% — [Nature](https://www.nature.com/articles/nature13172) **[V, dalla sintesi]**.
- Chambers 2001 (Icarus 152, 205): 2–4 pianeti, formazione in ~10⁸ anni — **[R]**.
- Zhou, Lin & Sun 2007 (ApJ 666, 423), sistemi di n = 9 corpi uguali, senza gas:
  log(T_c/anni) = A + B·log(k₀/2,3), A = −2 + ẽ₀ − 0,27·log μ, B = (18,7 + 1,1·log μ) − (16,8 + 1,2·log μ)·ẽ₀,
  valida per 10⁻¹⁰ ≤ μ ≤ 10⁻⁴; k = (a_{i+1} − a_i)/R_H con R_H = (2μ/3)^(1/3)·(a_i + a_{i+1})/2 (raggio di Hill
  RECIPROCO), ẽ = e/h con h = (a_{i+1} − a_i)/(a_{i+1} + a_i); l'eccentricità media cresce come t^½ (diffusione caotica,
  distribuzione di Rayleigh) — [arXiv:0705.2164](https://arxiv.org/pdf/0705.2164), eq. 1–4 **[V, testo]**.
  Con μ = 3·10⁻⁷ e ẽ = 0 **[D]**: k = 7,94 → T_c ≈ 0,9 Ma; k = 10 → T_c ≈ 13 Ma (×14); con ẽ = 0,3 e k = 7,94 →
  T_c ≈ 700 anni. È lo stesso ordine di grandezza della mediana misurata nell'app: la spaziatura e l'eccentricità dopo
  la fusione sono le due leve.
- Kimura, Hoshino, Kokubo, Matsumoto & Ikoma 2025 (ApJ, accettato): modello semi-analitico per l'evoluzione a urti
  giganti, validato con N-corpi anche a 0,1 UA e stelle piccole — [arXiv:2505.20548](https://arxiv.org/html/2505.20548) **[V, testo]**:
  1. e(t) dalla teoria secolare di Laplace–Lagrange: e_i = √(h_i² + k_i²), somme di modi sinusoidali, valide finché a e
     masse non cambiano;
  2. tempo d'incrocio di Petit et al. 2020 (risonanze a tre corpi) con δ_ij = ((1−e_j)a_j − (1+e_i)a_i)/a_j (distanza
     minima tra le orbite), fattore di densità K = min[0,5(N−3)+1, 3], eccentricità mediate ⟨e_i²⟩ ≈ Σ_j e_ij²; tocca alla
     terna con il τ più breve, t_cross = t₀ + τ*;
  3. all'incrocio: τ_scat = 4·b·a/(π(R_i+R_j)²·lnΛ)·(e/e_esc)⁴·T_K, τ_col = b·a/(π(R_i+R_j)²)·1/(1 + e_esc²/e²)·T_K,
     λ = τ_scat/τ_col, lnΛ = 3, p_col = 1 − e^(−λ) (Poisson): urto con probabilità p_col, altrimenti diffusione;
  4. urto: massa e baricentro conservati, e nuova dal vettore di Laplace–Runge–Lenz conservato; diffusione:
     Δb = e_i a_i + e_j a_j ripartita col baricentro; e iniziali da Rayleigh con scarto e_esc;
  5. il clock avanza di min(τ_scat, τ_col); fine con due pianeti (stabilità dall'energia di Jacobi).
  Limiti dichiarati: sottostima i tempi lontano dalla stella e per stelle piccole; la formula di Petit non è validata per
  orbite eccentriche; >90% degli urti N-corpi ha v_imp/v_esc < 1,5 (fusione perfetta ragionevole). Nessuna metrica
  d'errore numerica né tempo di calcolo riportati.

**Crescita: ciottoli e sintesi di popolazione**
- Massa d'isolamento dei ciottoli (Bitsch et al. 2018, A&A 612, A30, eq. 11):
  M_iso = 25·f_fit M⊕, f_fit = [(H/r)/0,05]³·[0,34·(log α₃/log α)⁴ + 0,66]·[1 − (∂lnP/∂lnr + 2,5)/6], α₃ = 10⁻³;
  i ciottoli con numero di Stokes < 0,005 passano il gap parziale; la diffusione turbolenta può raddoppiare la massa —
  [arXiv:1801.02341](https://ar5iv.labs.arxiv.org/html/1801.02341) **[V, testo]**.
- Accrescimento dei ciottoli nel regime di Hill, Ṁ ≈ 2·R_H²·Ω·Σ_ciottoli (Lambrechts & Johansen 2012/2014); flusso di
  ciottoli dal fronte di crescita della polvere che avanza verso l'esterno — **[R]**.
- Ida & Lin 2004 e seguenti (ricette di crescita oligarchica, involucro, migrazione); modello di Berna (Emsenhuber et al.
  2021, NGPPS) che integra disco viscoso, ciottoli/planetesimi, migrazione e N-corpi per 20 Ma — **[R]**.

**(b–c) Sostituzione proposta, costo, errore**
1. Spaziatura: strisce di 2C raggi di Hill RECIPROCI, con C dalla legge di Kokubo & Ida (b̃ ≈ 10 nella loro notazione,
   che usa (2M/3M*)^(1/3)) — **[R]**; meglio: la spaziatura esce dalla crescita stessa (l'embrione smette di crescere
   quando i vicini lo rimescolano, b ≈ 2√3·... + 2·e·a): un numero in meno.
2. Fase degli urti giganti: il ciclo di Kimura 2025 al posto di `disco.js:248-286`. Costo **[D]**: N ≤ 30 embrioni,
   Laplace–Lagrange = autovalori di due matrici N×N (≈ N³ = 2,7·10⁴ operazioni) per evento, ~N eventi → ~10⁶ operazioni,
   pochi millisecondi in JS; determinismo: ogni estrazione (Rayleigh, Poisson, Δϖ) è un evento con indirizzo
   («embrione 12/incontro 3/esito»), come già in `eventi.js`.
3. Attrito dinamico dei resti: la massa `cibo` (già calcolata, `disco.js:212`) smorza e tra un evento e l'altro
   (τ_df ∝ 1/Σ_resti **[R]**): così i sistemi con molti detriti restano rotondi e i tempi si allungano verso 30–100 Ma.
4. Fusione o «mordi e fuggi» con la velocità critica di Genda 2012 già in `impatti.js:209`; un urto che non fonde è
   una diffusione in più nel ciclo (il fattore ≥2 di Kokubo & Genda).
5. `impatti.js:262-283` legge i tempi veri e non serve più la stima «cerca».
Errore atteso: lo scarto del modello semi-analitico rispetto a N-corpi non è quantificato dagli autori (solo
«riproduce bene»); verificabile qui con REBOUND fuori linea su ~20 sistemi tipo (REBOUND è GPL-3 **[R]**: usarlo solo
come strumento di verifica, non incorporarlo).

**(d) Genitore → figlio, e ritorno**
- La galassia dà: Z e miscela (già), l'ambiente di nascita (massa dell'ammasso → campo FUV → vita del disco; incontri →
  raggio del disco; ²⁶Al/²⁷Al: vedi §3). La stella dà M, L(t) pre-sequenza, L_X. Il disco dà gli embrioni; la fase a
  urti dà pianeti, resti (`cibo`, `orfani`), corpi scagliati (che `vuoto_sistema.js` manda tra le stelle).
- Bilancio da chiudere **[M lettura]**: `disco.js` non restituisce i corpi sotto 0,02 M⊕ e `vuoto_sistema.js:36-38`
  ricostruisce la fascia esterna dai solidi del disco «e nessuno l'ha macinata: viene troppo pesante»; la massa dei
  detriti e quella che ricade non sono tolte né aggiunte al pianeta (`impatti.js:82-84`). Regola proposta: Σ solidi del
  disco = Σ pianeti + Σ resti (fasce, polvere) + Σ scagliati + Σ caduti sulla stella, controllata da un test come il
  `libroDeiConti` di `elementi.js:711`.

### Inferences
- L'età mediana misurata (18–23 Ma) è 2–4 volte sotto la mediana N-corpi di Quintana (43 Ma) e ~5 sotto la Terra
  (95 ± 32 Ma); il 10° percentile (4–6 Ma) è ~10 volte troppo presto: il difetto è soprattutto nella coda veloce, cioè
  nelle cascate ad attesa zero dopo la prima fusione.
- La sola correzione della spaziatura (7,9 → 10 reciproci) allunga il primo incrocio di ~14 volte (Zhou), ma senza il
  tempo di urto e lo smorzamento le cascate successive restano istantanee.

### Gaps
- La formula esatta di Petit et al. 2020 (eq. B1 di Kimura) e la legge di attrito dinamico non sono state lette.
- Non verificata la definizione di b̃ ≈ 10 di Kokubo & Ida (reciproco o singolo).
- Ricette di Berna e Ida–Lin non rilette; nessun confronto quantitativo di tempi tra sintesi di popolazione.

---

## 3. Acqua e volatili ai pianeti rocciosi; distribuzione dei mari e delle terre; alogeni e alcalini

### Takeaway
I rocciosi annegano perché l'acqua portata dentro la neve è una «regola semplice» con un fattore a caso, perché il 4%
che esce in superficie è un numero solo per tutti, e perché i planetesimi fusi dall'²⁶Al perdono anch'essi solo quel 4%
invece di disidratarsi. Le leggi che lo sostituiscono: neve che si sposta col disco che si raffredda, flusso di ciottoli
di ghiaccio fermato dalla massa d'isolamento del primo gigante, disidratazione dall'²⁶Al con abbondanza data dalla
galassia (dicotomia di Lichtenberg), solubilità dell'acqua nel fuso e ciclo mantello–oceano di Cowan & Abbot. Il sodio
in eccesso viene dal disco a 1 UA che non supera mai ~570 K: con un Ṁ(t) viscoso vero il disco giovane è caldo e la
condensazione incompleta toglie Na e K.

### Cited Findings
**(a) Che cosa è messo a mano**
- Acqua dentro la neve: `min(0,1; 0,1·acquaSistema·(r/neve)^2,5)` — `disco.js:210`, «regola semplice, suggerita dalle
  simulazioni» (`:204-206`); `acquaSistema = 0,5 + c('acqua portata da fuori')` — `disco.js:186`. **[M lettura]**
- Neve fissa a 2,7·√L UA, tarata sul Sole (`disco.js:93`; `:82-85`), con L all'età zero (niente pre-sequenza). **[M lettura]**
- `PARTE_FUORI = 0,04`: la parte dell'acqua che ogni pianeta di roccia libera in superficie — `leggi.js:129`, `:135`. **[M lettura]**
- Disidratazione dei corpi fusi: `U_GHIACCI[i] = PARTE_FUORI` per H, O, C, N — `elementi.js:521`: un planetesimo fuso
  dall'²⁶Al manda fuori il 4% della sua acqua come la Terra adulta, mentre `elementi.js:503` cita la solubilità
  6,8·10⁻⁸·p^0,7 che a bassa pressione la lascerebbe uscire quasi tutta. **[M lettura]**
- ²⁶Al/²⁷Al iniziale costante per ogni stella dell'universo: `PERDITE.al26 = 5,23·10⁻⁵` (Jacobsen 2008, valore del Sistema
  Solare) — `elementi.js:511`. **[M lettura]**
- Disco a 1 UA: Ṁ = massa/vita costante (`disco.js:102-106`), quindi «non supera ~570 K» e la condensazione incompleta
  «non agisce» (`elementi.js:506-508`); risultato dichiarato: Na ×5,7 la Terra, «il mare resta una salamoia, ora di soda;
  il sodio dei fiumi non ha in mare.js un'uscita che lo pareggi» (`elementi.js:68-78`). **[M lettura]**
- Gli impatti non portano acqua: `impatti.js` segue le nubi con la loro frazione di ghiaccio ma non la conta (voce IM8). **[M lettura]**

**Leggi e dati dalla letteratura**
- Cowan & Abbot 2014 (ApJ 781, 27): modello a due scatole idrosfera–mantello in stato stazionario; la pressione sul fondo
  del mare cresce con la gravità; il degassamento alle dorsali cala e la serpentinizzazione cresce con quella pressione,
  e insieme stabilizzano il volume dell'oceano; un pianeta con tettonica attiva di qualunque massa mantiene continenti
  emersi se la frazione d'acqua è sotto ~0,2%; l'incertezza principale è l'acqua del mantello terrestre di oggi —
  [arXiv:1401.0720](https://arxiv.org/abs/1401.0720) **[V, abstract]**.
- Kite & Ford 2018 (ApJ): pianeti con 10–10³ volte l'acqua terrestre; la pressione sul fondo blocca il ciclo del carbonio
  mantello–oceano, il pianeta resta con oceano e cationi acquisiti nel primo 1% della storia; le loro N-corpi suggeriscono
  che una parte sostanziale dei rocciosi in zona abitabile esce dagli urti giganti con involucri d'acqua profondi; molti
  restano abitabili > 1 Ga — [arXiv:1801.00748](https://arxiv.org/abs/1801.00748) **[V, dalla sintesi]**.
- Lichtenberg et al. 2019 (Nature Astronomy 3, 307): l'²⁶Al scalda e disidrata i planetesimi prima che diventino pianeti;
  sistemi ricchi di ²⁶Al danno pianeti piccoli e poveri d'acqua, sistemi senza ²⁶Al soprattutto mondi oceano; le due
  classi si distinguono dal raggio — [ADS](https://ui.adsabs.harvard.edu/abs/2019NatAs...3..307L/abstract) **[V, abstract e
  materiali dei convegni; cifre del testo non lette]**.
- Raymond & Izidoro 2017 (Icarus 297, 134): la crescita rapida del gas di Giove e Saturno destabilizza i planetesimi
  vicini, li diffonde in ogni direzione; il freno del gas ne deposita una parte su orbite stabili dentro Giove (fascia
  esterna ricca d'acqua oltre 2,5 UA, povera tra 1,8 e 2,5); quando il disco si dissolve, i più eccentrici incrociano la
  regione terrestre e portano l'acqua; il meccanismo è generico per ogni gigante che si forma —
  [arXiv:1707.01234](https://arxiv.org/abs/1707.01234) **[V, dalle sintesi]**.
- Morbidelli et al. 2000: l'acqua della Terra dagli embrioni della fascia esterna degli asteroidi, ~10% delle masse finali
  da oltre 2,5 UA — **[R]**.
- Massa di isolamento dei ciottoli (Bitsch 2018, §2) **[V]**: quando il primo nucleo esterno la raggiunge, il flusso di
  ciottoli di ghiaccio verso l'interno si ferma; il meccanismo che «secca» il Sistema Solare interno (Morbidelli et al.
  2016; Lambrechts et al. 2019) — **[R]**.
- Alogeni: Clay et al. 2017 (Nature 551, 614): nelle condriti Cl, Br, I sono ~6, ~9 e 15–37 volte sotto i valori
  precedenti; Br/Cl e I/Cl uguali alla Terra silicatica; l'accrescimento tardo (≤ 0,5 ± 0,2% della massa silicatica) non
  basta a dare gli alogeni della Terra; proposta: estrazione in fluidi ricchi di alogeni durante la differenziazione
  primitiva — [Nature PDF](https://www.nature.com/articles/nature24625.pdf), [Oxford](https://www.earth.ox.ac.uk/publication/734941/ora-hyrax) **[V, dalla sintesi]**;
  contestato: Fegley et al. 2017 riportano i valori CI ai precedenti; anche con la normalizzazione di Clay il Cl della Terra
  silicatica resta impoverito rispetto alla tendenza della volatilità; il Cl non è siderofilo nella formazione del nucleo
  (Sharp & Draper 2013, citato da) — [arXiv:2006.11051](https://arxiv.org/pdf/2006.11051) **[V, secondaria]**.
- Sharp & Draper 2013 (EPSL): la Terra è povera di cloro; il cloro di superficie (soprattutto nel mare e nelle evaporiti)
  è una parte grande del bilancio della Terra silicatica — **[R, articolo non trovato]**.
- Moderatamente volatili: impoverimento della Terra in funzione di T50 (Wang et al. 2019, la stessa fonte delle
  abbondanze di `elementi.js:45`); spiegazioni alternative: condensazione incompleta nel disco (Cassen 1996),
  evaporazione dai planetesimi fusi (Hin et al. 2017, Norris & Wood 2017, Sossi et al. 2019) — **[R]**.

**(b–c) Le sostituzioni, in ordine di effetto**
1. Neve che cammina **[D da formule già V in `Come farlo emergere.md` §4]**: T(r,t)⁴ = 3GM*Ṁ(t)/(8πσr³)·(1 − √(r*/r)) +
   T_irr⁴, con Ṁ(t) = Ṁ₀·(1 + t/t_s)^(−3/2) (soluzione autosimile con γ = 1) e L*(t) di pre-sequenza (§1); la neve è dove
   T = 150–170 K. Ogni embrione prende acqua secondo il TEMPO di formazione dei suoi planetesimi (t_iso già calcolato,
   `disco.js:199`): niente `acquaSistema`, niente (r/neve)^2,5.
2. Barriera del gigante: il flusso di ciottoli di ghiaccio verso l'interno si ferma al tempo in cui il primo nucleo
   esterno arriva a M_iso di Bitsch; l'acqua interna diventa ∫ Ṁ_ciottoli·ε_acc dt fino a lì (ε_acc dal regime di Hill,
   **[R]**). Costo: un integrale per embrione su 20–50 passi di tempo.
3. Disidratazione dall'²⁶Al: frazione d'acqua che esce dal corpo fuso = 1 − solubilità(p_interna)/contenuto, con
   p_interna ~ (2π/3)Gρ²R² **[D]**: corpi di 10–100 km perdono quasi tutto, embrioni grandi trattengono; e
   ²⁶Al/²⁷Al passato dalla galassia (§d), non costante.
4. Parte in superficie (al posto di `PARTE_FUORI`): stato stazionario di Cowan & Abbot, degassamento ∝ f(P_fondo) e
   rigassamento crescente con P_fondo = ρ_w g h; la frazione di terre emerse viene poi dall'ipsometria (geologia) e dal
   volume del mare. Costo: una radice per pianeta.
5. Acqua degli impatti tardi: Σ (massa caduta × frazione di ghiaccio) dalle classi di `impatti.js` (già simulate), meno la
   parte persa (`parteTolta`, `elementi.js:523`).
6. Na, K, Cl: Ṁ(t) viscoso al posto di massa/vita in `disco.js:106`; il disco giovane a 1 UA supera i T50 di Na (958 K),
   K (1006 K), Cl (948 K) (`elementi.js:100-102`) nei primi ~10⁵ anni **[R per la durata]**; i solidi che si separano
   dal gas mentre si raffredda conservano la frazione condensata al momento della separazione (Cassen 1996 **[R]**):
   frazione = ∫ f_cond(T(r,t))·p(t_sep) dt con p(t_sep) la distribuzione del tempo di nascita dei planetesimi; si
   riusa `tabellaSolidi` (240 T, già in memoria). Errore atteso: l'impoverimento terrestre segue T50 con dispersione
   ~×2 (**[R]**). Lato mare: un'uscita del sodio (scambio con le argille, acqua dei pori, evaporiti) in `mare.js` —
   fuori da queste note.

**(d) Genitore → figlio, e ritorno**
- Galassia → sistema: ²⁶Al/²⁷Al dalla densità di formazione stellare recente nell'anello (supernove e venti di
  Wolf–Rayet dell'ammasso di nascita; il legame quantitativo non è stato letto: **[R]**); Z → massa dei ciottoli →
  giganti precoci → barriera; C/O della miscela → quanta acqua contro CO nei ghiacci (`elementi.js:277-283`, già
  conservativo sull'ossigeno).
- Ritorno: l'acqua persa nello spazio (serbatoio `spazio`, `elementi.js:640-643`) e i corpi ghiacciati scagliati
  diventano oggetti interstellari (`vuoto_sistema.js`); il conto per elemento deve tornare con `libroDeiConti`.

**(e) Che cosa si deve vedere**: con il passo 4 la frazione di terre emerse diventa una distribuzione larga (da mondi
secchi a mondi oceano), con i sistemi a gigante precoce più asciutti; i mondi oceano restano, come nelle N-corpi di
Kite & Ford, ma non come regola.

### Inferences
- La mediana misurata (0,56% d'acqua, 2 oceani in superficie, p90 26 oceani) supera la soglia di Cowan & Abbot (0,2%)
  di ~3 volte: con la tettonica di oggi la maggior parte dei rocciosi dell'app non può avere continenti emersi.
- Il fattore ~5–6 sul Cl del mare coincide con il fattore ~6 di Clay 2017 sulle condriti; ma è una coincidenza da non
  usare come taratura: il Cl di `elementi.js` viene dalle abbondanze protosolari condensate, non dalle condriti misurate.
- Le correzioni 1–3 rendono l'acqua un risultato del genitore (²⁶Al, Z, tempi del disco): si ottiene la dicotomia di
  Lichtenberg senza scriverla.

### Gaps
- Le cifre di Lichtenberg (soglie di ²⁶Al, frazioni d'acqua) e di Sharp & Draper (ppm di Cl della Terra) non lette.
- Legge del flusso di ciottoli e dell'efficienza di cattura non rilette; durata della fase calda del disco a 1 UA non
  verificata.
- Nessuna fonte letta che leghi ²⁶Al/²⁷Al alla massa dell'ammasso o alla storia della galassia.

---

## 4. Lune, anelli, maree e dinamica secolare a basso costo

### Takeaway
Lune, anelli e maree hanno già una struttura fisica, ma la massa delle lune regolari, il bordo del disco attorno ai
giganti e il giro dei giganti sono tarati su Giove o sorteggiati; le orbite non evolvono. Le sostituzioni sono la legge
di equilibrio di Canup & Ward (afflusso contro migrazione), la luminosità d'accrescimento del pianeta per il suo disco,
il limite magnetico del giro dei giganti, un'integrazione congiunta delle maree a ritardo costante con k₂Δt da
`maree.js`, e la teoria di Laplace–Lagrange per precessione e cicli lunghi (la stessa che serve al §2).

### Cited Findings
**(a) Che cosa è tarato o sorteggiato**
- Lune regolari: μ = 2·10⁻⁴·exp(0,35·gauss) — `lune.js:342`; bordo esterno R_Hill·tra(0,6; 2)/48 e bordo interno
  sincrona·tra(1; 2,5) — `lune.js:348`; temperatura del disco «tarata su Giove» — `lune.js:18` (voce LU4). **[M lettura]**
- Luna da urto quando l'urto vero manca: `capita` — `lune.js:426`; `LEGGI_ANELLI.urto: { capita: 0,45, massa: [−3, −1,6] }`
  — `anelli.js:85`. **[M lettura]**
- Giro dei giganti: `giroGiove: 0,2986`, «la taratura» — `rotazione.js:57`; `k2QGas 10⁻⁵` — `rotazione.js:60`. **[M lettura]**
- Pioggia degli anelli misurata su Saturno per tutti (`anelli.js:47-48`, `:81`); parametri liberi `soglia`, `restoUrto`,
  `esosfera` (`anelli.js:84`). **[M lettura]**
- Orbite ferme: «niente precessione, niente risonanze tra pianeti, niente migrazione delle lune» — `orbite.js:25-27`;
  luna e stella frenano «una dopo l'altra» — `rotazione.js:40`. **[M lettura]**
- La marea ha già una reologia di Andrade con k₂* complesso (Renaud & Henning 2018) — `maree.js:5-27`: è la base giusta. **[M lettura]**

**(b–c) Sostituzioni**
- Teoria secolare di Laplace–Lagrange (Murray & Dermott 1999, cap. 7) **[R]**; usata come motore di e(t) da Kimura et al.
  2025 **[V]**: per N pianeti, due matrici N×N (A per e, ϖ; B per i, Ω) con i coefficienti di Laplace b_{3/2}^{(1)},
  b_{3/2}^{(2)}; autovalori g_k, f_k; h_j(t) = Σ e_jk·sin(g_k t + β_k). Costo: una diagonalizzazione per sistema
  (N ≤ 10: < 10⁴ operazioni), poi ogni istante è una somma di N seni → precessione delle orbite, variazioni di e e i,
  obliquità che oscilla (con la precessione dell'asse) e cicli di Milanković emergono. Errore **[R]**: buono per e, i ≲ 0,1;
  sbaglia vicino alle risonanze di moto medio e non dà il caos secolare.
- Maree a ritardo costante (Hut 1981; Leconte et al. 2010) **[R]**: da/dt, de/dt, dΩ/dt integrati INSIEME per luna e
  stella, con k₂·Δt preso da Im(k₂*) di `maree.js` alla frequenza di marea di quel momento (non un Q fisso). Passi
  logaritmici nel tempo (≈ 200 passi su 4,5 Ga). Licenze: REBOUNDx (forze `tides_constant_time_lag`, `gr`,
  `modify_orbits`) è GPL-3 **[R]**: si riscrivono le formule, non il codice.
- Lune regolari (Canup & Ward 2006): M_T/M_P ≈ 2,5·10⁻⁴·(1/χ)·(3,5/C_a)^(4/9)·[(H/r)/0,1]^(10/9)·[(α/f)/3·10⁻⁵]^(1/3)
  — **[R; formula già riportata in `Come farlo emergere.md` §4, PDF non raggiunto]**; la temperatura del disco del pianeta
  dalla luminosità d'accrescimento L = G·M_P·Ṁ/R_P nella formula viscosa, non da 1300 K su Giove.
- Giro dei giganti: blocco magnetico tra il pianeta giovane e il suo disco (Batygin 2018) — **[R]**: Ω dipende dal campo
  del pianeta (dalla dinamo di `storia.js`) e da Ṁ; toglie `giroGiove`.
- Anelli: la pioggia scalata con la carica dei grani e il flusso UV/micrometeoriti (le fasce di `impatti.js` danno il
  flusso) — **[D, collegamento]**.

**(d) Genitore → figlio, e ritorno**: il disco circumplanetario riceve Ṁ dal disco della stella (stesso Ṁ(t) del §3);
la luna da urto riceve il disco di detriti dall'urto vero (§2); la marea restituisce momento angolare all'orbita del
pianeta e calore all'interno (`storia.js`), da tenere nello stesso bilancio di momento angolare del sistema.

### Inferences
- Una sola implementazione di Laplace–Lagrange serve tre cose: i tempi degli urti giganti (§2), le orbite che cambiano
  nel 3D (§5) e il clima lungo (Milanković).

### Gaps
- Canup & Ward 2006 e Batygin 2018 non riletti; errore quantitativo di Laplace–Lagrange e della marea a ritardo costante
  non verificato su fonte.

---

## 5. Zoom continuo da un sistema a un pianeta: orbite, polvere zodiacale, corpi minori, bagliore

### Takeaway
La linea d'orbita che attraversa la vista come un segmento dritto è un difetto geometrico misurabile: 257 vertici fissi in
Float32 danno, a 1 UA, corde di 3,7 milioni di km che passano fino a ~11 000 km (1,8 raggi terrestri) dalla curva vera,
e la linea non svanisce avvicinandosi al pianeta perché la sua opacità dipende solo dalla distanza dalla stella. Rimedio:
vertici ricalcolati ogni fotogramma in doppia precisione rispetto all'occhio, fitti dove l'orbita è vicina alla camera
(errore sotto mezzo pixel), oppure l'ellisse esatta nel frammento; e un'attenuazione legata alla sfera di Hill del corpo.
Per ogni ampiezza dello schermo da 1 pc a un pianeta esiste qualcosa di fisico da mostrare (tabella in fondo).

### Cited Findings
**(a) Il codice**
- Orbite: «256 punti ciascuna», in anomalia eccentrica uniforme, dagli elementi «di oggi» (`scenaSistema(..., 0)`),
  in un `Float32Array` relativo al corpo centrale — `src/tre/sistema.js:76-83`; disegnate come `LINE_STRIP` —
  `sistema.js:138`. **[M lettura]**
- Opacità: `vista = min(1, dS/(0,02·a))·(luna ? 0,5 : 1)·min(1, 30·influenza/dS)` con dS = distanza dalla STELLA —
  `sistema.js:137`: avvicinandosi a un pianeta a 1 UA dS ≈ a e la linea resta piena. Il commento `:133` («più tenui da
  vicino») non è ciò che la formula fa vicino al pianeta. **[M lettura]**
- Nel vertex shader `u_C + u_quadro·a_p` è in float32 (`sistema.js:35-36`): a 1 UA la cifra meno significativa vale
  ~1,5·10¹¹·6·10⁻⁸ ≈ 9 km, a 30 UA ~270 km **[D]**; le stelle invece arrivano già sottratte in doppia precisione
  (`luci.js:7`) e la profondità è logaritmica (`nucleo.js:74-76`). **[M lettura]**
- Corda e scarto **[D]**: lunghezza del segmento 2πa/256 = 0,0245 UA = 3,7·10⁶ km; freccia a(1 − cos(π/256)) =
  7,5·10⁻⁵·a ≈ 11 300 km a 1 UA.
- Passaggio dalla sfera al pianeta vero a 400 raggi, rilascio a 900 (isteresi) — `sistema.js:96-100`; segnaposto di
  forza fissa per i pianeti sotto un pixel — `sistema.js:105-109` (dichiarato «non è luce vera: è un segno»).
- Polvere zodiacale: marcia lungo il raggio con la funzione di fase integrata in tabella e `riscontro()` sulla CPU —
  `minori.js:6-15`; mancano l'ombra dei pianeti sulla polvere e la polvere davanti ai pianeti — `minori.js:31-32`. **[M lettura]**
- Bagliore: alone 1/(1 + r²) che conserva la somma — `luci.js:1-6`.

**(b–c) Rimedi, con errore noto**
- Vertici adattivi rispetto all'occhio **[D]**: ogni fotogramma, in doppia precisione sulla CPU, si trova l'anomalia del
  punto dell'orbita più vicino alla camera; il passo in anomalia vera vicino a quel punto è
  Δν ≈ √(8·s/r) con s = 0,5 px × (distanza camera–orbita) × (2·tan(fov/2)/H_px); lontano il passo cresce come la
  distanza. Si sottrae la posizione dell'occhio in doppia e si passa al GPU il risultato in float32 (tecnica «relativa
  all'occhio», Cozzi & Ring, *3D Engine Design for Virtual Globes*, 2011 — **[R]**). Errore: < 0,5 px per costruzione;
  costo: ~200–500 vertici per orbita per fotogramma.
- In alternativa, ellisse analitica nel frammento: un quadrato che copre l'orbita proiettata, distanza dalla conica
  calcolata per pixel (spessore in pixel esatto, nessuna corda) — **[R]**.
- Attenuazione legata al luogo **[D]**: opacità × min(1, d_corpo/(k·R_Hill)) per l'orbita del corpo a cui ci si
  avvicina (k ≈ 3–10), e × min(1, curvatura apparente) per le altre (un'orbita la cui curvatura sullo schermo è sotto
  1/(10·larghezza schermo) è vista come retta: la si smorza). La linea è un segno, non luce: deve sparire dove il
  corpo vero diventa leggibile.
- Elementi che cambiano: con Laplace–Lagrange (§4) gli elementi a t sono quelli del momento; le orbite vanno
  rigenerate quando ϖ, Ω, e cambiano più di 0,1 px sulla vista **[D]**.
- Continuità del colore tra sfera lontana e pianeta vero: lo stesso albedo spettrale deve alimentare `s.c.colore`
  (`sistema.js:121`) e `pianeta.js`, altrimenti a 400 raggi il colore salta — **[D]**.

**(e) Che cosa mostrare a ogni ampiezza dello schermo** (ampiezza = lato orizzontale della vista alla distanza del
soggetto) **[D, con oggetti già nel modello]**
| ampiezza | che cosa c'è di fisico | resa | costo |
|---|---|---|---|
| 1 pc – 0,1 pc (2·10⁵–2·10⁴ UA) | la stella come punto e alone; le vicine; la nube di comete (invisibile all'occhio) | `luci.js`; facoltativo: densità statistica della nube come segno tenue | trascurabile |
| 2·10⁴–10³ UA | bordo interno della nube; la stella abbagliante; i giganti come punti sotto il pixel | segnaposto dei giganti (`sistema.js:105`) con magnitudine vera in un riquadro | trascurabile |
| 10³–100 UA | fascia esterna di polvere (luce diffusa τ ~ 10⁻⁷–10⁻⁴ **[R]**), orbite dei giganti | polvere di `minori.js` (passo largo), linee d'orbita adattive | marcia a pochi passi |
| 100–10 UA | luce zodiacale, fascia di asteroidi come polvere, giganti con fasi | polvere + corpi delle fasce come punti (`minori.js`) | come oggi |
| 10–1 UA | dischi dei pianeti interni, controluce zodiacale (gegenschein, cono), comete attive | sfere illuminate; polvere con ombra dei pianeti (manca) | basso |
| 1–0,01 UA (≈ sfera di Hill della Terra, 1,5·10⁶ km) | lune, anelli, coda del pianeta; l'orbita del pianeta deve svanire qui | attenuazione per R_Hill; lune come sfere | basso |
| 10⁶–10⁴ km | disco del pianeta, nuvole, terminatore, luci notturne; la stella come disco abbagliante | `creaPianeta` (a 400 raggi), alone della stella per l'occhio adattato | quello del pianeta |

**(d)**: lo zoom non deve inventare: ogni livello prende dal genitore lo stesso oggetto (la polvere da
`vuoto_sistema.js`, i corpi da `corpiMinori`, il pianeta dallo stesso indirizzo), cambia solo la risoluzione.

### Inferences
- Il difetto delle «linee dritte» si chiude con due righe di logica (attenuazione per R_Hill) e un generatore di vertici
  adattivo; la seconda parte serve anche quando si osserva da una luna l'orbita del suo pianeta.
- La scala 1 pc – 10³ UA è quella che più rischia di sembrare vuota: è fisicamente vuota per l'occhio; la scelta onesta è
  mostrare la stella e segni dichiarati, non polvere inventata.

### Gaps
- Nessuna fonte letta per la luminosità superficiale tipica delle fasce esterne extrasolari nel visibile; tecniche di
  resa (relative all'occhio, ellisse nel frammento) citate a memoria.
