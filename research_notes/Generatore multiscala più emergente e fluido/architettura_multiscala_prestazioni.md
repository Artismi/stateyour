# Architettura multiscala e prestazioni di «stateyour»: collegare 60 ordini di grandezza, zoom senza cuciture, calcolo più rapido e più preciso

Note di un panel misto: matematico della modellazione multiscala, ricercatore di generazione procedurale e grafica, architetto di motori in tempo reale (LOD, streaming, GPU), specialista di metodi numerici (surrogati, controllo dell'errore). Data: 21 novembre 2026.

**Legenda.**
- [L]: letto nel codice di questo repository, con file:riga.
- [V]: verificato sulla fonte, cioè su una pagina ufficiale o sul testo citato nei report del progetto, che lo riportano verificato.
- [S]: verificato solo sull'estratto, sull'abstract o sul riassunto della ricerca web di questo giro, non sul testo pieno.
- [R]: ricordato, non verificato in questo giro.
- «Inferenza»: un giudizio del panel, non un fatto di una fonte.

Le stime di costo e di guadagno sono tutte inferenze, salvo dove una fonte dà un numero.

**Stato di partenza letto nel codice, che serve a tutte le sezioni.**
- La casualità ha già una fonte sola. È Threefry-4x32 a 20 giri, a contatore, con la chiave derivata dall'indirizzo ad albero (Goldreich–Goldwasser–Micali), provata con TestU01 [L] (`src/camera/eventi.js:10-41`).
- Il campo del cosmo è già un rumore a ottave su reticolo assoluto. Ha finestre B_j con Σ B_j² = 1 e spettro esatto, sul modello di Panphasia e MUSIC [L] (`src/camera/campo_pigro.js:1-25`). È la base giusta. Il resto della catena non la usa.
- La cache per indirizzo esiste già. La chiave è `nodo | versione modello | SHA-256 dei sorgenti importati | indirizzo`, su IndexedDB, con un tetto di 3000 righe [L] (`src/camera/deposito.js:1-21`).
- Il registro delle grandezze esiste già, con SOGLIE «fisica/comodo» e NUMERI_CON_FONTE [L] (`src/camera/grandezze.js:1-25`). Esistono anche le prove di coerenza C6 (M∘μ = I) e C8 (commutazione), con tolleranze dal modello [L] (`test/test_coerenza_scale.mjs:1-20`).
- In `src/` non compaiono `SharedArrayBuffer`, `navigator.gpu` né `WebAssembly` [L] (grep su `src/` ed `electron/`). Electron è la 45.2.3, con uno schema privilegiato e `sandbox: true` [L] (`package.json:16`, `electron/main.cjs:15,23`).

---

## 1. Condizionare il livello figlio al padre (statistiche e bilanci che tornano)

### Takeaway
Il livello figlio del rilievo (`geologia.js` `tessera`) si fa oggi così: si interpola il padre e si somma un rumore di valore con ampiezza e frequenze scritte a mano. La media della madre **non** si conserva: +9 m in media, fino a 22 m. Al posto di questa somma si propone un **raffinamento condizionato additivo**: o Hoffman–Ribak (realizzazione libera più correzione di kriging dei residui sui vincoli del padre), o la sua forma economica a ondine, con un dettaglio che ha media nulla su ogni cella madre per costruzione. Lo spettro del dettaglio non va più scelto: va preso dalla stessa legge che dà il padre. Per i livelli in cui il figlio è un altro *modello* (suolo, grani, molecole), il quadro giusto è HMM / equation-free. Il figlio fornisce al padre i coefficienti efficaci (chiusura); il padre fornisce al figlio i vincoli (condizionamento). La prova C6 lo misura.

### Cited Findings

**(a) Che cosa è a mano oggi, con file:riga**
- Il dettaglio di ogni tessera ha ampiezza `260·0,36^L` m e due frequenze `W·n/9` e `W·n/3,1`. La seconda ottava ha peso 0,45 e l'asse v è compresso di un fattore 0,5 [L] (`src/camera/geologia.js:674-675`).
  - Inferenza: 0,36 per ogni fattore 4 di scala equivale a un esponente di Hurst fissato, H = ln(1/0,36)/ln 4 ≈ 0,74.
  - Al livello 7 (≈10 m: `pianeta.js:6`) l'ampiezza è 260·0,36⁷ ≈ 0,20 m su celle di ≈10 m, cioè pendenze del 2 %. È una causa diretta delle **superfici omogenee da vicino** (inferenza, calcolo del panel).
- Il rumore è un *value noise* bilineare con smoothstep su `hashReticolo` [L] (`src/camera/geologia.js:634`). Non è a banda limitata, quindi ha alias e «pop» quando entra un'ottava (vedi §2).
- Il codice stesso dichiara «CHE COSA NON TORNA: la media», misurata in +9 m su una Terra di prova e fino a 22 m su una tessera. Riscalare le figlie perché la loro media fosse quella della madre è stato «PROVATO E NON TENUTO»: una piana a zero metri non si riscala, e il conto finiva a −12 m [L] (`src/camera/geologia.js:650-655`).
- Inferenza: il fallimento viene dal fatto che la correzione era **moltiplicativa**. Una correzione **additiva** (Hoffman–Ribak, ondine) non ha questo problema.
- La catena di LOD della superficie va dalla superficie intera 256×128 a tessere quattro volte più fini fino a ~10 m. Ogni pezza «prende quote e colori dalla tessera più fine che è già arrivata» [L] (`src/tre/pianeta.js:6-12`).

**(b) La sostituzione basata su principi**
- **Hoffman–Ribak (1991).** È un algoritmo non iterativo per le realizzazioni vincolate di campi gaussiani. Richiede solo la matrice di correlazione dei vincoli e la sua inversa. Si parte da una realizzazione libera, si calcola il campo medio implicato dai residui dei vincoli e lo si somma [S] ([ApJ 380, L5, ADS](https://adsabs.harvard.edu/pdf/1991ApJ...380L...5H); [applicazione ai picchi, astro-ph/9507024](https://arxiv.org/abs/astro-ph/9507024)).
  - È la stessa identità della «simulazione condizionale» geostatistica: realizzazione libera più kriging del residuo [R] (Journel & Huijbregts 1978, *Mining Geostatistics*; nessun link verificato).
  - Per stateyour i vincoli sono le **medie di blocco** del padre sulle celle che la tessera tocca, e il campo libero è il dettaglio con lo spettro vero.
- **La forma a ondine, la più economica.** È il rumore a ondine di Cook & DeRose (SIGGRAPH 2005): un rumore «quasi a banda limitata», costruito togliendo a un rumore bianco la sua versione ridotta e poi riespansa. Così ogni banda non ha quasi energia nelle bande più grosse [S] ([Pixar, paper](https://graphics.pixar.com/library/WaveletNoise/paper.pdf)).
  - Il passaggio applicato a stateyour: figlio = espansione(padre) + D, con D in una banda la cui *restrizione* sul reticolo del padre è nulla. Allora M∘μ = I vale per costruzione, non per correzione (inferenza).
  - Se la media di blocco deve essere esatta e non solo approssimata, servono ondine a media conservata. Lo fanno la suddivisione «average-interpolating» (Donoho 1992) e lo schema a sollevamento (*lifting*) di Sweldens [R].
- **Lo spettro dalla legge.** `campo_pigro.js` lo fa già per il cosmo: nucleo con trasformata h^(3/2)·√P(k)·B_j(k) [L] (`src/camera/campo_pigro.js:20-25`).
  - Per il rilievo, P(k) dovrebbe venire dalla geologia stessa: tettonica, erosione e isostasia di quel pianeta, oppure uno spettro di potenza topografico con esponente legato ai processi. Non dalle costanti 260 e 0,36.
  - Inferenza: con uno spettro dichiarato, la varianza non risolta sotto la cella, σ²_h = ∫_{k>k_cella} P(k) d²k, e quella delle pendenze, σ²_s = ∫ k² P(k) d²k, sono **calcolabili analiticamente al padre senza generare il figlio**. È la chiave della §3 (LEAN/LEADR).
- **HMM, il metodo multiscala eterogeneo (E & Engquist).** Un risolutore macro ottiene i dati che gli mancano (flussi, coefficienti) da simulazioni micro su domini piccoli. «Eterogeneo» vuol dire che i modelli possono essere di natura diversa, per esempio dinamica molecolare sotto e continuo sopra [S] ([E, Engquist, Li, Ren, Vanden-Eijnden, CiCP 2 (2007) 367–450](https://journal.global-sci.org/v1/cicp/openaccess/v2_367.pdf); [Abdulle, E, Engquist, Vanden-Eijnden, Acta Numerica 2012](https://infoscience.epfl.ch/record/182125/files/acta_num_abd_e_eng_van.pdf?version=1)).
  - La rassegna di Acta Numerica insiste sull'analisi dell'errore, che nel quadro HMM viene naturale [S].
  - Per stateyour: la finestra del suolo o dei grani diventa il micro-risolutore che restituisce al padre albedo efficace, rugosità, permeabilità e porosità. Il padre li usa al posto di numeri scritti.
- **Equation-free e integrazione proiettiva grossolana (Kevrekidis et al. 2003).** Il quadro permette a modelli fini, microscopici o stocastici, di eseguire compiti al livello grosso. Ciclo: *lift* (dal grosso al fine), brevi raffiche di simulazione fine, *restrict* (dal fine al grosso), poi un passo grosso estrapolato [S] ([Comm. Math. Sci. 1(4) 715–762, Project Euclid](https://projecteuclid.org/euclid.cms/1119655353); [ar5iv physics/0209043](https://ar5iv.labs.arxiv.org/html/physics/0209043)).
  - Il metodo proiettivo per sistemi rigidi con un salto nello spettro degli autovalori è descritto in Gear & Kevrekidis [S] ([SISC 24(4) 2003, copia PKU](https://www.math.pku.edu.cn/teachers/litj/notes/MultiscaleModeling2019/EquationFree-SISC.pdf)).
  - Per stateyour serve all'evoluzione nel tempo di un pianeta (clima, erosione) senza integrare tutto alla grana fine.
- **Omogeneizzazione e chiusura delle leggi di conservazione.** È la condizione C6 già scritta: il riassunto dei figli deve ridare il padre. HMM ne fa il cuore del metodo, perché il macro-modello si chiude con i dati stimati dal micro [S] ([CiCP review](https://journal.global-sci.org/v1/cicp/openaccess/v2_367.pdf)). Per i bilanci (massa del sedimento, acqua, energia) la chiusura va imposta *dopo* i passi non lineari come l'erosione, con una ridistribuzione conservativa del difetto (inferenza).
- **Modelli di sottogriglia stocastici.** Per ciò che il padre non risolve: perturbazioni stocastiche delle tendenze fisiche, alla SPPT del centro europeo ECMWF [R] (Berner et al., «Stochastic parameterization: toward a new view of weather and climate models», BAMS 2017; nessun link verificato). In stateyour la perturbazione è un evento con indirizzo, cioè deterministica.

**(c) Costo e guadagno attesi**
- Il costo di Hoffman–Ribak per tessera è un sistema lineare di dimensione pari al numero dei vincoli. Con le medie delle celle madri che la tessera copre più il bordo, sono decine o centinaia di vincoli.
  - Su un reticolo regolare con covarianza stazionaria la matrice è la stessa per tutte le tessere di un livello: la si fattorizza una volta e la si mette in cache per (livello, spettro). Per tessera restano un prodotto matrice-vettore e la somma del campo di kriging (inferenza).
- La forma a ondine costa un filtro separabile di ridimensionamento ed espansione per tessera, O(N), e sostituisce quasi a pari costo il rumore attuale (inferenza).
- Non accelera, ma toglie il difetto di media dichiarato (fino a 22 m) e le riscalature. Riempie le scale con l'ampiezza giusta, perché lo spettro viene dal modello.

**(d) Come garantisce la coerenza padre-figlio**
- Hoffman–Ribak soddisfa i vincoli **esattamente** e lascia al residuo la covarianza giusta, quella condizionata [S] ([ADS](https://adsabs.harvard.edu/pdf/1991ApJ...380L...5H)).
- Le ondine a media conservata danno M∘μ = I esatto sul reticolo. Cook & DeRose danno solo un'ortogonalità approssimata alle bande più grosse [S].
- La prova esistente C6 di `test_coerenza_scale.mjs` diventa un test di regressione con tolleranza ε macchina, non statistica (inferenza).

**(e) Licenze**
- Le formule di Hoffman–Ribak, HMM ed equation-free sono metodi matematici pubblicati, senza vincoli di licenza sull'uso [R].
- Il brevetto Pixar sul rumore a banda limitata (US7672476) risulta **scaduto** [S] ([Google Patents](https://patents.google.com/patent/US7672476)).

### Inferences
- **Doppio verso.** Il condizionamento scende (vincoli del padre sul figlio), la chiusura sale (coefficienti efficaci del figlio al padre). Il padre deve esistere *senza* che il figlio sia mai stato calcolato, perché si calcola solo dove si guarda. Quindi la chiusura deve venire da una legge di omogeneizzazione o da un emulatore del micro-modello (§4), non dal micro-modello eseguito al momento.
- **Ordine nella tessera.** I passi non lineari (erosione, fiumi, laghi) rompono il condizionamento lineare. La sequenza consigliata:
  1. raffinamento condizionato additivo;
  2. evoluzione fine (erosione);
  3. correzione conservativa del difetto di massa per cella madre;
  4. verifica C6.
- **Il caso del suolo e della materia.** Il figlio è un altro modello (`LATI_SUOLO`, 10 m … 10 µm: `src/camera/mappa.js:823`), quindi il vincolo non è una media di quota ma una composizione: frazioni minerali, porosità, granulometria. Per il condizionamento di variabili categoriche serve la simulazione multipunto o per indicatori della geostatistica [R], oppure un processo di punti marcato con le intensità prese dal padre (inferenza).

### Gaps
- Non si è verificato sul testo pieno come Hoffman–Ribak tratti i vincoli di media di blocco; si sono visti solo gli estratti. La generalizzazione ai vincoli lineari qualunque è ricordata [R].
- Nessuna fonte verificata in questo giro sugli spettri di potenza topografici planetari, per sostituire 260·0,36^L con uno spettro fisico. Va cercato a parte: spettri di Marte, Luna e Terra da altimetria.
- Il costo reale della fattorizzazione in JS non è stato misurato.

---

## 2. Casualità gerarchica deterministica: RNG a contatore e rumore coerente tra livelli

### Takeaway
La fonte degli eventi (Threefry-4x32-20 con la chiave ad albero dall'indirizzo) è già allo stato dell'arte e va **tenuta**. Il punto debole è il *rumore*: il value noise di `geologia.js` non è a banda limitata, ha frequenze scritte a mano e un'anisotropia fissa. Va sostituito con il rumore a ottave su reticolo assoluto che `campo_pigro.js` usa già, nella forma Cook & DeRose (ondine) o Gabor / convoluzione sparsa (spettro controllato, filtrabile). Gli hash del reticolo si fanno con operazioni intere a 32 bit, esatte sia in JS sia in WGSL. Le cuciture tra tessere spariscono se il rumore è funzione delle coordinate *globali* e non della tessera. I pop spariscono se ogni banda entra con un peso che dipende dalla sua grandezza sullo schermo.

### Cited Findings

**(a) Che cosa è a mano o fragile**
- `rumore(x, y, seme)` è un value noise bilineare con smoothstep su `hashReticolo` [L] (`src/camera/geologia.js:634`). I semi delle ottave sono `seme + L` e `seme + 31·L`, con frequenze `/9` e `/3,1` e peso 0,45 [L] (`src/camera/geologia.js:674-675`).
  - Inferenza: un seme `seme + L` non passa per l'indirizzo, quindi esce dalla «fonte unica» di `eventi.js`.
  - Inferenza: il fattore 0,5 in v compensa il rapporto 2:1 della carta longitudine-latitudine solo all'equatore. Verso i poli il rumore si stira in longitudine.
- Le nuvole del pianeta hanno una soglia `0,5 + 0,235·(…)` e uno `smoothstep(soglia − 0,03, soglia + 0,11, 0,62·n + 0,38·frattale3(q·5 + 4))` [L] (`src/tre/pianeta.js:99-101`). Sono costanti di forma scritte a mano.

**(b) La sostituzione basata su principi**
- **RNG a contatore.** Threefry, Philox e ARS sono funzioni pure (contatore, chiave) → bit, e passano BigCrush [V] (riportato come verificato in `eventi.js:10-16`; [Salmon et al. 2011, SC'11, DOI 10.1145/2063384.2063405](https://doi.org/10.1145/2063384.2063405) [R]).
- **Squares (Widynski 2020).** È una versione a contatore del metodo «middle-square» di von Neumann. Ha 4 giri per un'uscita a 32 bit e 5 per 64 bit. Ha passato 300 BigCrush con chiavi casuali e PractRand, e l'autore lo dice «crush-resistant». In un confronto di tempi: 1,35 s contro 2,35 s di Philox [S] ([arXiv 2004.06278](https://arxiv.org/abs/2004.06278v4)).
  - Inferenza: Squares usa prodotti a 64 bit. In JS servirebbe `BigInt` o lo spezzamento in parole da 16 bit, quindi perde il vantaggio.
  - Inferenza: anche Philox usa `mulhi` a 32×32→64. `Math.imul` dà solo i 32 bit bassi, e WGSL non ha un `mulhi` nativo [R].
  - Inferenza: Threefry (somme, rotazioni e xor a 32 bit) resta la scelta giusta sia per JS sia per WGSL, con bit identici su CPU e GPU.
- **Hash leggeri per i nodi del reticolo del rumore.** La chiave dell'indirizzo si calcola *una volta* per tessera con Threefry. Il valore di un nodo (i, j) della tessera si ottiene poi con un hash intero economico (per esempio PCG-hash), tenuto con la chiave della tessera.
  - Fonte di riferimento: Jarzynski & Olano, «Hash Functions for GPU Rendering», JCGT 9(3) 2020 [R] ([JCGT](https://jcgt.org/published/0009/03/02/)).
  - Restano deterministici e intero-esatti. La qualità statistica va riprovata con TestU01, come si è fatto per `eventi.js` (inferenza).
- **Rumore coerente tra livelli.**
  - **Rumore a ondine** (Cook & DeRose 2005). È «quasi a banda limitata». Una funzione 3D a banda limitata campionata su una superficie 2D perde in genere la banda limitata, e gli autori danno una soluzione per questo caso. Le ottave del Perlin coprono in pratica più di un'ottava di frequenze [S] ([paper](https://graphics.pixar.com/library/WaveletNoise/paper.pdf); [pagina Pixar](https://graphics.pixar.com/library/WaveletNoise)). Licenza: il brevetto US7672476 è scaduto [S] ([Google Patents](https://patents.google.com/patent/US7672476)).
  - **Rumore di Gabor** (Lagae, Lefebvre, Drettakis, Dutré, TOG 2009). È una convoluzione sparsa con nucleo di Gabor [S] ([academia.edu](https://www.academia.edu/2854650/Procedural_noise_using_sparse_Gabor_convolution)). Lo spettro si controlla nucleo per nucleo, l'anisotropia si può prendere da un campo fisico (la direzione delle faglie o del vento), e si filtra analiticamente convolvendo il nucleo con l'impronta gaussiana del pixel [R].
  - **Rassegna di riferimento**: Lagae et al., «A Survey of Procedural Noise Functions», CGF 29(8) 2010, 2579–2600, con strumenti di analisi spettrale per confrontare i rumori [S] ([EG diglib](https://diglib.eg.org:443/handle/10.2312/CGF.v29i8pp2579-2600); [PDF](https://scribblethink.org/Work/LLCDDELPZ10SPNF.pdf)).
  - **Rumore a convoluzione sparsa** (Lewis 1989), progenitore di Gabor [R].
- **Reticolo assoluto, senza bordo.** `campo_pigro.js` ha già le celle di lato h_j = 2²⁰ Mpc/2^j su un reticolo assoluto, i pesi come eventi all'indirizzo «radice/campo/livello j/cella ix,iy,iz» e Σ_j B_j² = 1 [L] (`src/camera/campo_pigro.js:16-25`). È lo schema di Panphasia, un rumore bianco gerarchico su albero a ottanti con 50 livelli [V] (riportato come letto in `campo_pigro.js:9-12`; [arXiv 1306.5968](https://arxiv.org/abs/1306.5968)). Sul pianeta lo stesso schema si fa su un cubo-sfera, oppure con un rumore 3D valutato sulla sfera, per togliere la distorsione ai poli (inferenza).
- **Precisione delle coordinate.** SpaceEngine dichiara un limite di circa 1 m/pixel sulla superficie, «dovuto alla precisione in virgola mobile». Sotto i 100 m si vede la pixellatura, e il piano è arrivare a 0,1–1 cm/pixel [S] ([SpaceEngine, «Detail textures for planets»](https://spaceengine.org/news/blog110730/)).
  - stateyour ribasa già le coordinate a ogni livello: «i numeri a sedici cifre bastano» [L] (`src/camera/mappa.js:11-15`). Calcola anche il centro della pezza rispetto all'occhio in doppia precisione [L] (`src/tre/pianeta.js:11-12`).
  - Altre soluzioni note: l'origine flottante di KSP [S] ([KSP dev diary](https://www.kerbalspaceprogram.com:443/news/dev-diaries-developer-insights-12-planet-tech)) e la doppia precisione emulata per i soli ingressi della funzione procedurale [S] ([gamedev.net](https://gamedev.net/forums/topic/465602-planet-rendering-and-floating-point-precision/)).

**(c) Costo e guadagno attesi**
- Threefry-20 per nodo è il costo dominante se lo si usa per ogni nodo di ogni ottava. Con la chiave per tessera e un hash leggero per nodo il costo scende di un ordine di grandezza (inferenza: circa 80 operazioni intere per 128 bit contro circa 10 per un PCG-hash a 32 bit [R]).
- Il rumore a ondine richiede una tabella periodica precalcolata. È deterministico se la si genera dagli eventi: un costo una tantum per pianeta, che va nel deposito (inferenza).

**(d) Come garantisce la coerenza padre-figlio**
- Le bande indipendenti con Σ B_j² = 1 danno uno spettro esatto qualunque sia il numero di livelli calcolati. Il padre è la somma delle bande fino a j, il figlio aggiunge la banda j+1: nessun ricampionamento cambia ciò che c'era (inferenza dalla costruzione di `campo_pigro.js`).
- Le coordinate globali tolgono le cuciture: due tessere vicine valutano la stessa funzione negli stessi punti (inferenza). Il bordo largo un ottavo resta utile per i processi non locali come l'erosione [L] (`src/camera/geologia.js:657-660`).
- I pop si tolgono pesando ogni banda con w_j = liscio(log(λ_j / dimensione del pixel)). È il criterio di Cook & DeRose, che pesano le bande secondo la frazione di pixel che coprono [R].

**(e) Licenze**
- Random123 (Threefry, Philox): licenza in stile BSD [R].
- Squares: algoritmo pubblicato su arXiv. La licenza del pacchetto `squares-rng` non è stata verificata.
- Rumore a ondine: brevetto scaduto [S].
- Gabor noise: codice di riferimento degli autori, licenza non verificata.

### Inferences
- La fonte unica deve restare Threefry. Ciò che va cambiato è *l'uso*: oggi alcuni rumori hanno semi aritmetici (`seme + 31·L`) invece di un indirizzo. Si propone una regola di registro (§5): ogni rumore ha un indirizzo, uno spettro dichiarato e una banda dichiarata.
- La GPU può calcolare gli **hash interi** senza rompere il determinismo, perché le operazioni u32 sono esatte. Solo l'interpolazione in virgola mobile resta «per l'aspetto» (vedi §4).

### Gaps
- Non si è verificato se WGSL abbia oggi un'istruzione `mulhi` o un'estensione equivalente.
- Non si sono trovati tempi pubblicati di Threefry contro PCG-hash in JavaScript; vanno misurati.
- La licenza del codice di riferimento di Gabor noise e di Squares non è stata verificata.

---

## 3. Resa senza cuciture tra le scale: LOD continuo, filtraggio coerente, dissolvenze per grandezza proiettata

### Takeaway
I difetti visibili (pop, «corruzione» allo zoom, scale vuote) vengono quasi tutti da tre cause:
1. **soglie secche su z** nella mappa e nelle pezze, con costanti scritte a mano;
2. **sostituzione** di un livello con un altro invece di una *partizione dell'unità in log-scala*;
3. un padre che **non porta le statistiche** del figlio (rugosità, varianza delle pendenze, flusso sub-pixel), così che al cambio l'aspetto salta.

Le cure note:
- geomorfismo continuo alla CDLOD o clipmap geometriche per il rilievo;
- momenti delle pendenze nei mip (LEAN/LEADR), calcolati *analiticamente dallo spettro* (§1) per le bande non ancora generate;
- dissolvenze a flusso costante decise dalla grandezza angolare;
- il dettaglio mostrato «solo dentro il padre» (ScaleTrotter).

### Cited Findings

**(a) Che cosa è a mano oggi, con file:riga**
- **Soglie di livello nella mappa 2D.**
  - L'ingresso nel figlio avviene quando la sua taglia supera `0,42·m` (livello 2) o `0,4·m` [L] (`src/camera/mappa.js:182`).
  - Si passa al suolo a `z > 6e6` [L] (`src/camera/mappa.js:70`) e si torna a `z = 5,5e6` [L] (`src/camera/mappa.js:94,118,128`).
  - L'isteresi è di 0,8·m / 9·m / 0,45·m [L] (`src/camera/mappa.js:87,91,93,126-127`).
  - I lati sono arrotondati a potenze di dieci con `dieci()` [L] (`src/camera/mappa.js:136`).
  - Nel complesso: 15 occorrenze delle sole costanti `0,8·m`, `9·m`, `5,5e6` e `6e6` [L] (grep).
- **Regioni come porte discrete.** Sul pianeta lo zoom è limitato a `1,1·m / LATO_REGIONE`, con `LATO_REGIONE = 0,32` raggi del pianeta. Poi si «entra» in una regione, cioè nella camera [L] (`src/camera/mappa.js:207-215`; `src/camera/cosmo.js:360`).
  - Inferenza: per un pianeta come la Terra 0,32 R ≈ 2000 km. Tra la regione e la superficie dettagliata non c'è un continuo di scala nella mappa. Insieme alla superficie radice 256×128 (≈156 km per cella all'equatore di un pianeta terrestre: calcolo del panel), è la causa più probabile della **fascia vuota tra circa 1 e 500 km**.
- **Dissolvenze con costanti di comodo nella mappa.**
  - Velo `0,85·(1 − log₁₀(cella/(4·max(W, H)))/2)` [L] (`src/camera/mappa.js:335`).
  - Chiarore della galassia con soglia 6000 px e rampa su 1,5 decadi [L] (`src/camera/mappa.js:412-413`).
  - Stella «sola» oltre `log₁₀(z/3e4)/2` [L] (`src/camera/mappa.js:420`).
- **Il buco nero nella mappa** è disegnato come un disco nero pieno (`fillStyle = '#000'`) quando `rb < 6000` [L] (`src/camera/mappa.js:428`).
- **Dissolvenza tra le tele (3D → materia → atomi → quanti).** È un'istantanea che sfuma su un fattore 4 di scala, poi da sola dopo «un paio di secondi», e aspetta fino a 8000 ms che la vista nuova sia pronta [L] (`src/camera/laboratorio.js:321-322,374`).
- **Divisione delle pezze del pianeta.** Si spezza se `d < 2 || d < 2·Lv`, se la rugosità `r·0,06·pxPerMetro` supera `errorePixel`, se `maglia > magliePerPixel·4`, e in un caso speciale per l'acqua (`maglia > 14 && dist < 6000`) [L] (`src/tre/pianeta.js:778-781`).
  - Le opzioni sono `magliePerPixel: 7`, `puntiPerPixel: 2,6`, `errorePixel: 1,0`, `massimoTessere: 110` [L] (`src/tre/pianeta.js:503`).
  - Le fessure si chiudono con un «orlo che scende» [L] (`src/tre/pianeta.js:12`), che sono le *skirts* di Chunked LOD. Non c'è morfismo dei vertici, quindi c'è un **pop** quando la pezza si spezza o quando arriva la tessera fine (inferenza).
- **Possibili cause della «barra nera» attraverso la galassia** (ipotesi da provare, inferenza):
  1. Il volume della galassia cambia schema di passo quando il raggio «corre nel piano» (`abs(d.z) < 0,04`). È una discontinuità su un angolo di vista scelto a mano [L] (`src/tre/volumi.js:62-65`).
  2. Lo strato di polvere ha h_g ≤ 0,1 kpc [L] (`reports/Scelte a mano nella vista.md`, riga su `volume.worker.js:42`) su una griglia di 48 celle in quota [L] (`src/tre/volumi.js:147`). Una corsia di polvere sotto-risolta diventa una banda scura netta.
  3. Il salto del vuoto sotto 10⁻⁴ della luce più forte del suo anello e in 16 tratti, «non provato» [L] (`src/tre/volumi.js:27`; `reports/Scelte a mano nella vista.md`, riga su `nucleo.js:228`).
  - La corsia di polvere di una galassia vista di taglio è fisica. Una barra *netta e nera* indica invece una discretizzazione.

**(b) La sostituzione basata su principi**
- **CDLOD** (Strugar, J. Graphics, GPU & Game Tools 14(4) 2009, 57–74). Morfa con continuità i vertici tra i livelli di dettaglio secondo la distanza 3D precisa dall'osservatore. La funzione di LOD è la stessa su tutta la maglia [S] ([repo e PDF CarsF/CDLOD](https://github.com/CarsF/CDLOD); [demo terrain-cdlod](https://github.com/tschie/terrain-cdlod)). Elimina il pop delle pezze lasciando l'albero a quattro rami che c'è già (inferenza).
- **Clipmap geometriche** (Losasso & Hoppe, SIGGRAPH 2004). Griglie regolari annidate centrate sull'osservatore, tenute nella memoria video e riempite incrementalmente quando l'occhio si muove. Il ritmo di resa è quasi costante perché non dipende dalla rugosità. Il limite: si assume che il terreno abbia densità spettrale limitata [S] ([progetto Hoppe](https://hhoppe.com/proj/geomclipmap/); [GPU Gems 2 cap. 2](https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter02.html)).
  - Inferenza: la condizione di spettro limitato è soddisfatta *per costruzione* dal rumore a bande della §2.
  - Licenza: brevetto US7436405, «Terrain rendering using nested regular grids» [S] ([Justia](https://patents.justia.com/patent/7436405)); lo stato di scadenza non è stato verificato.
- **Chunked LOD** (Ulrich, corso SIGGRAPH 2002). Raffina blocchi pre-elaborati, con «skirts» per le fessure. Circa 1,5–2 volte i triangoli di ROAM, ma con molto meno lavoro della CPU [S] ([copia delle note](https://masters.donntu.ru/2011/fknt/liseenko/library/article1.htm)). È la scelta già fatta in `pianeta.js`. Manca la dissolvenza o il morfismo tra blocchi.
- **Texture virtuali.** Un'unica texture logica a pagine caricate a richiesta e indirizzate da una tabella. È adatta a «tessera per indirizzo» [R] (Barrett, «Sparse Virtual Textures», GDC 2008; nessun link verificato).
- **Filtraggio coerente tra il dettaglio procedurale e la media del padre.**
  - **Bruneton & Neyret** (TVCG 2012): filtrare linearmente ogni mappa e poi applicare l'illuminazione è sbagliato, perché l'equazione è non lineare (auto-occlusione, auto-ombra, BRDF non lineari). Il lavoro ricava un'equazione di pre-filtraggio generale e passa in rassegna i metodi [S] ([HAL inria-00589940](https://hal.archives-ouvertes.fr/inria-00589940)).
  - **LEAN mapping** (Olano & Baker 2010): filtraggio antialias delle normali speculari tramite i momenti [R] (nessun link verificato in questo giro; la ricerca ha dato solo pagine fuori tema).
  - **LEADR mapping** (Dupuy, Heitz, Iehl, Poulin, Neyret, Ostromoukhov, TOG 32(6) 2013). Due texture con mipmap tengono i *primi due momenti dei gradienti di spostamento*. La distribuzione entra in una BRDF microfacet fisica con mascheramento e ombra, diffusa e speculare. Qualità pari al sovracampionamento con un campione per pixel [S] ([PDF LIRIS](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/SAsia2013-LEADR.pdf); [DOI 10.1145/2508363.2508422](https://doi.org/10.1145/2508363.2508422)).
  - Per stateyour: il padre porta (E[s], E[s s^T]) delle pendenze. La parte dovuta alle bande non ancora generate si calcola da ∫k²P(k) (§1), così il rilievo fine diventa rugosità della luce *prima* di esistere e la sostituzione non cambia la luminanza media (inferenza).
  - Va notato che `pianeta.js` fa già entrare il rilievo fine «come luce» senza spostare i vertici [L] (`src/tre/pianeta.js:30`).
- **Dissolvenze per grandezza proiettata.**
  - Gaia Sky: una soglia secca sull'angolo solido «produce pop-in». Ogni ottante entra con una rampa lineare, opacità 0 a θ = Θ e 1 a θ = Θ + r [V] (verificato nel report [Navigazione e resa](../../reports/Navigazione%20e%20resa%20per%20stateyour.md); [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)). `nucleo.js` ne usa già la formula di mescolanza delle distanze [L] (`src/tre/nucleo.js:296`).
  - ScaleTrotter mostra la scala fine **solo dentro l'elemento padre**, su una «tela» appiattita, con opacità crescente [V] (dal report; [ar5iv 1907.12352](https://ar5iv.arxiv.org/html/1907.12352)).
  - La rassegna multiscala molecolare (Miao, …, Isenberg, Viola, J. Mol. Biol. 2019) tratta astrazione, transizione di scala, modellazione dipendente dalla scala, istanziazione degli elementi, gestione della visibilità e navigazione negli spazi di astrazione, e ha tra le sfide le «continuous scales» [S] ([PDF TU Wien](https://publik.tuwien.ac.at/files/publik_272339.pdf); [pagina](https://www.cg.tuwien.ac.at/research/publications/2019/Miao_2019/)).
- **Sintesi multiscala da esemplari** (Han, Risser, Ramamoorthi, Grinspun, SIGGRAPH 2008). Un «grafo di esemplari» a scale diverse; i cicli nel grafo danno zoom infiniti e dettaglio infinito [S] ([Columbia](https://www.cs.columbia.edu/cg/mts)). Non è emergente: usa esemplari dati. Ma insegna che *i cicli di scala* (struttura autosimile dichiarata) riempiono le decadi povere senza nuovi parametri (inferenza).
- **SpaceEngine**: il limite di circa 1 m/pixel è dovuto alla precisione [S] ([blog](https://spaceengine.org/news/blog110730/)).
- Universe Sandbox, «Scale of the Universe», Outerra: nessuna fonte primaria verificata in questo giro (vedi Gaps).

**(c) Costo e guadagno attesi**
- Il morfismo CDLOD costa un attributo per vertice, la quota del livello padre, e una `mix` nel vertex shader: costo trascurabile. Toglie i pop del rilievo (inferenza).
- LEADR costa due texture RG/RGBA per tessera e qualche istruzione nel frammento. Le texture si possono riempire dallo spettro senza generare il figlio (inferenza).
- La partizione dell'unità in log-scala tiene attivi al più 2 strati per volta, quindi costa al più il doppio della resa di uno strato durante la transizione (inferenza, già nel report Navigazione).
- Sostituire le soglie `z > 6e6` e `0,4·m` con pesi lisci non costa nulla in calcolo. Richiede che il figlio sia *pronto prima* della soglia: prefetch (§4).

**(d) Come garantisce la coerenza padre-figlio**
- Il morfismo garantisce continuità geometrica C⁰ nel tempo. LEADR garantisce che la media nel pixel della radianza del figlio sia quella del padre, a meno della non linearità residua che Bruneton & Neyret discutono [S].
- La dissolvenza a flusso costante, L_padre·(1 − a) + L_figlio·a con ⟨L_figlio⟩ = L_padre, evita lampi e buchi a metà [V] (report Navigazione).
- Il dettaglio solo dentro il padre conserva le posizioni ereditate [V] (ScaleTrotter, dal report).

#### Mappa difetto → causa → rimedio (inferenze del panel, da provare)
| Difetto visibile | Causa probabile nel codice | Rimedio |
|---|---|---|
| Scale vuote 1–500 km | regione 0,32 R come porta (`mappa.js:207-215`, `cosmo.js:360`); radice 256×128; tessere fini in arrivo lento | zoom continuo della mappa sul pianeta con tessere di `geologia.js` per indirizzo; prefetch delle 2 decadi sotto il cursore |
| Superfici omogenee da vicino | ampiezza 260·0,36^L, ≈0,2 m a 10 m (`geologia.js:674`); value noise | spettro fisico, rumore a bande, LEADR dalle bande non generate |
| Barra nera nella galassia | cambio di schema dei passi `abs(d.z) < 0,04` (`volumi.js:62`); polvere sotto-risolta (h_g ≤ 0,1 kpc, nz = 48); salto del vuoto | prova di convergenza per angolo di vista; schema di passo continuo nell'inclinazione; quota adattiva a h_g |
| Discontinuità e «corruzione» allo zoom | soglie secche (`mappa.js:70,94,182`); sostituzione invece di partizione; pezze senza morfismo; istantanea che aspetta 8 s (`laboratorio.js:374`) | partizione dell'unità in log-scala; CDLOD; figlio a media vincolata (§1) |
| Caricamento lento | catena sincrona, nessuna memoria condivisa, IndexedDB per array grandi, nessuna GPU di calcolo | §4 |

### Inferences
- Il problema di fondo non è grafico ma *statistico*: se padre e figlio concordano nei primi due momenti (media, varianza, momenti delle pendenze, densità di oggetti), qualunque dissolvenza diventa invisibile. Le tecniche grafiche (CDLOD, LEADR, rampe) sono il modo economico per far vedere questa concordanza. Ma la concordanza va garantita a monte (§1) e verificata (§5).

### Gaps
- Non si sono trovati post tecnici primari di Universe Sandbox, Outerra, «Scale of the Universe» o di SpaceEngine sull'architettura del LOD. Le note su questi sistemi restano [R] o sono assenti.
- LEAN mapping (Olano & Baker 2010) non è stato verificato in questo giro.
- La licenza del codice CDLOD di Strugar e lo stato del brevetto delle clipmap non sono stati verificati.
- La causa della barra nera non è dimostrata: serve una prova (resa a più inclinazioni, con e senza salto del vuoto, a nz = 48/96/192).

---

## 4. Velocità: GPU di calcolo, fili, memoria condivisa, calcolo progressivo, prefetch, cache, surrogati

### Takeaway
Il collo di bottiglia non è il calcolo puro ma l'**organizzazione**:
- catene sincrone prima del primo fotogramma;
- copie di array grandi con `postMessage`;
- nessuna priorità per cono di vista o traiettoria;
- IndexedDB per array grandi.

L'ordine delle leve, per guadagno su costo:
1. coda con priorità e cancellazione in ogni filo, più prefetch lungo lo zoom (lo zoom è prevedibile: va verso il cursore);
2. «genitore sempre pronto» con dissolvenza;
3. array trasferibili o `SharedArrayBuffer` (richiede l'isolamento cross-origin nel protocollo di Electron);
4. cache OPFS per i blob grandi, con IndexedDB solo per i metadati;
5. WebGPU di calcolo solo per l'*aspetto*, con riserva WebGL2 e attenzione ai flag su Linux;
6. tabulazioni e surrogati con errore controllato per le leggi costose;
7. WASM SIMD per ultimo, più per una libm deterministica che per la velocità.

### Cited Findings

**(a) Stato attuale e scelte ad hoc**
- In `src/` non c'è uso di `SharedArrayBuffer`, WebGPU né WebAssembly [L] (grep).
- I fili ricevono messaggi con strutture clonate: tessere, campi, aria [L] (`src/tre/pianeta.js:545,564,579,631,645`).
- I costi dichiarati delle finestre sono 25–200 ms per l'acqua, fino a quasi 1 s per la prima immagine, 100–500 ms per il suolo [L] (`src/camera/finestre.worker.js:3-6`).
- La cache per indirizzo e codice esiste: SHA-256 dei sorgenti importati, IndexedDB, 3000 righe [L] (`src/camera/deposito.js:1-21`).
- `massimoTessere: 110` è un tetto di memoria scritto a mano [L] (`src/tre/pianeta.js:503,589`).
- Il report precedente aveva notato che non c'era nessuna cache persistente [V] (`reports/Navigazione e resa per stateyour.md`, §«Il caricamento lento»). Oggi `deposito.js` c'è: quella frase è **superata**.
- Le prove usano una GPU simulata, SwiftShader [L] (`reports/Scelte a mano nella vista.md:120`).

**(b) Le sostituzioni basate su principi**
- **Cache: OPFS per i blob.** Lumafield: con OPFS il caricamento dei progetti oltre 1 GB scende da 21 s a 7 s in mediana. IndexedDB è stato «significativamente più lento» per i grandi `ArrayBuffer` ed è rimasto solo per i metadati [V] (dal report Navigazione; [Lumafield 2026](https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/)). La chiave di `deposito.js` resta valida e va solo cambiato il supporto dei valori grandi (inferenza).
- **Memoria condivisa in Electron.** `SharedArrayBuffer` è disponibile solo con l'isolamento cross-origin: `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`, verificabili con `self.crossOriginIsolated` [S] ([web.dev COOP/COEP](https://web.dev/articles/coop-coep); [Chrome blog](https://developer.chrome.com/blog/enabling-shared-array-buffer)).
  - Con uno schema personalizzato (`app://`, `main.cjs:15`) le intestazioni vanno messe nella risposta del gestore del protocollo [R]; non è verificato sulla documentazione di Electron.
  - Alternativa senza isolamento: oggetti trasferibili (`postMessage(msg, [buf])`), che spostano senza copiare [R].
- **WebGPU in Electron su Linux.** Il supporto Linux di Chromium è sperimentale: servono `--enable-unsafe-webgpu` e `--enable-features=Vulkan` (o `Vulkan,VulkanFromANGLE`) e driver aggiornati [S] ([gpuweb implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)). In Electron Vulkan non è attivo di default su Linux (issue electron/electron #40929) [S] (dal riassunto della ricerca; issue non aperta direttamente).
  - PlayCanvas: 5,7× con WebGPU contro WebGL 2 su 35 milioni di splat, grazie a scarto, proiezione e ordinamento radix in compute shader [V] (dal report Navigazione; [PlayCanvas](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins)).
  - **Limite per il determinismo**: WGSL non specifica il modo di arrotondamento, `sin`/`cos` hanno errore fino a 2⁻¹¹, e un'implementazione può riassociare le operazioni [V] (dal report; [W3C WGSL](https://www.w3.org/TR/WGSL/)). Quindi sulla GPU vanno solo l'aspetto e gli hash interi. Nessun risultato in virgola mobile della GPU torna come stato.
- **WASM SIMD.** Guadagni misurati da 0,56× a 1,6× su particelle e circa 3× su filtri d'immagine vettorizzati [S] (dal report Navigazione; [arXiv 2608.23609](https://arxiv.org/pdf/2608.23609)). Serve semmai per una libm propria, perché `Math.sin` è «implementation-approximated» [V] ([ECMA-262](https://tc39.es/ecma262/)).
- **Calcolo progressivo e streaming.**
  - Cesium salta livelli e sfuma tra quelli caricati: −30–50 % di tempo di carico e di memoria, con il fotogramma a circa 16 ms [V] (dal report; [Cesium 2017](https://cesium.com/blog/2017/05/05/skipping-levels-of-detail/)).
  - SuperSplat carica prima il livello più grossolano e raffina entro un budget per dispositivo [V] (dal report).
  - Il difetto opposto, la generazione sincrona che «ferma il rendering finché non sono pronti i dati per ogni figlio», è documentato [S] ([gamedev.net](https://rsn.gamedev.net/blogs/entry/1832259-gpu-terrain-generation-cell-noise-rivers-crater)).
- **Surrogati ed emulatori con errore controllato.**
  - Emulatore a processo gaussiano (Kennedy & O'Hagan, JRSS-B 2001): il simulatore è modellato con un processo gaussiano, le esecuzioni passate sono osservazioni, e l'incertezza si propaga alla previsione. C'è anche un termine di discrepanza [S] ([copia OSU](https://www.asc.ohio-state.edu/statistics/comp_exp/jour.club/kennedy01.pdf); [BACCO](https://www.asc.ohio-state.edu/statistics/comp_exp/jour.club/baccopaper.pdf)). Sono note critiche di inconsistenza della calibrazione [S] ([Tuo, arXiv 1705.03422](https://arxiv.org/pdf/1705.03422)).
  - Fourier Neural Operator (Li et al., ICLR 2021): nucleo integrale nello spazio di Fourier, provato su Burgers, Darcy e Navier–Stokes. Fino a tre ordini di grandezza più rapido dei risolutori tradizionali, con super-risoluzione «zero-shot» [S] ([arXiv 2010.08895](https://arxiv.org/abs/2010.08895v3)). Licenza della libreria `neuraloperator`: MIT [R].
- **Tabulazione delle leggi costose.** Interpolazione di Chebyshev con stima dell'errore dai coefficienti finali [R] (Trefethen, *Approximation Theory and Approximation Practice*, SIAM 2013; Chebfun, licenza BSD [R]). Le tabelle del cielo sono già discretizzazioni provate per convergenza in `test_vista.mjs` [L] (`reports/Scelte a mano nella vista.md:30-35`).

**(c) Costo e guadagno attesi (inferenze, salvo i numeri delle fonti)**
| Leva | Costo di lavoro | Guadagno atteso |
|---|---|---|
| Coda con priorità (cono di vista → traiettoria), cancellazione, budget per fotogramma | basso: una classe in ogni filo | toglie i blocchi della rotella; latenza percepita circa ×2–5 |
| Prefetch lungo lo zoom: indirizzi sotto il cursore per 1–2 decadi più in giù, con la velocità di zoom come orizzonte | medio | nasconde 100–500 ms per finestra; con il «vai a» il tragitto copre il calcolo |
| Genitore sempre pronto con statistiche (§1, §3) | medio | elimina l'attesa fino a 8 s di `laboratorio.js:374` |
| Trasferibili (subito) o SAB (con COOP/COEP) | basso / medio | toglie le copie di 2·258·130·4 B e più per tessera; guadagno proporzionale alla dimensione |
| OPFS per i blob, IndexedDB per i metadati | medio | Lumafield ×3 sul caricamento [V] |
| WebGPU di calcolo (onde FFT, splat, ordinamento) | alto, più la riserva WebGL2 | ×2–6 sull'aspetto (PlayCanvas 5,7× [V]); zero in prova su SwiftShader |
| Tabelle di Chebyshev per le leggi chiamate milioni di volte | basso per legge | ×10–100 per legge (stima); errore dichiarato |
| Emulatori GP o FNO per catene lente (clima → vento → mare) | alto | ×10²–10³ [S, FNO]; solo dove la varianza predittiva sta sotto la tolleranza |
| WASM SIMD | alto | ×0,6–3 [S]; il valore vero è la libm deterministica |

**(d) Come si garantisce la coerenza (e il determinismo)**
- Cache e prefetch non cambiano i bit: la chiave include la versione del codice e `deposito.js` usa la clonazione strutturata, verificata bit per bit da `test_deposito.mjs` [L] (`src/camera/deposito.js:5-8`).
- I surrogati violano il «deterministico per indirizzo» solo se si usano in modo diverso a seconda di ciò che c'è in cache o del dispositivo. La regola proposta (inferenza):
  - il surrogato è **parte del modello**: pesi fissati e versionati nella chiave del codice, valutazione su CPU con operazioni ordinate e libm propria;
  - oppure è solo un **acceleratore** con controllo: se la varianza predittiva supera la tolleranza si chiama il modello vero, e il risultato è sempre quello del modello vero;
  - nel secondo caso l'emulatore decide *quanto presto* arriva il dettaglio, mai *che cosa* è.
- La GPU resta fuori dallo stato (WGSL [V]).

**(e) Licenze**
- Electron: MIT [R]. Chromium/Dawn: BSD-3 [R]. Chebfun: BSD [R]. neuraloperator: MIT [R]. BACCO (R): GPL [R].

### Inferences
- Lo zoom di stateyour è il caso più favorevole al prefetch: in scala logaritmica la camera si muove quasi in linea retta verso un punto noto (il cursore o la destinazione del volo). Gli indirizzi dei figli che entreranno sono quelli dentro l'impronta del cursore alle decadi successive, ed è un insieme piccolo (circa 4–16 tessere per decade).
- In prova la GPU è SwiftShader: i guadagni GPU non si vedranno nelle prove. Serve una prova su scheda vera prima di investire in WebGPU, ed è anche un compito aperto del progetto (task #29).

### Gaps
- Non si sono verificate sulla documentazione di Electron le intestazioni COOP/COEP con `protocol.handle`, né lo stato attuale dei flag Vulkan in Electron 45.
- Nessun profilo misurato in questo giro: le stime di guadagno vanno confermate con DevTools, separando catena di dipendenze, `postMessage` e compilazione degli shader.
- Non si è verificato se Dawn su SwiftShader esponga WebGPU nelle prove.

---

## 5. Come verificare «ciò che non emerge»: metodo per trovare le costanti a mano e prove automatiche di coerenza tra le scale

### Takeaway
stateyour ha già due strumenti rari:
- un registro delle grandezze con fonte, dipendenze, SOGLIE «fisica/comodo» e NUMERI_CON_FONTE (`grandezze.js`);
- prove C6/C8 tra le scale con tolleranze dal modello.

Mancano quattro cose:
1. un **censimento automatico dei letterali numerici** nelle formule e nella resa, non solo nei moduli già letti;
2. un'**analisi dimensionale** automatica sulle unità del registro;
3. un'**analisi di sensibilità globale** (Morris, poi Sobol) per ordinare le costanti a mano per quanto pesano sull'immagine e sul mondo;
4. **prove di coerenza nell'immagine**: la resa del figlio ridotta deve ridare quella del padre, e uno zoom scriptato non deve avere salti temporali (pop).

### Cited Findings

**(a) Lo stato attuale**
- `grandezze.js` dichiara FONTI, GRANDEZZE (con unità, dipendenze, controlli, intervallo, `trascurabile`), CICLI, SOGLIE con specie «fisica» o «comodo», e NUMERI_CON_FONTE, che `test_grandezze.mjs` cerca quando sono riscritti a mano [L] (`src/camera/grandezze.js:1-25`).
- Il censimento della vista conta 144 righe: 27 dal modello, 41 discretizzazioni, 76 scelte a mano. Delle scelte a mano 9 sono state sostituite e 53 restano difetti [L] (`reports/Scelte a mano nella vista.md`, §«I numeri»).
- `test_coerenza_scale.mjs` misura C6 (M∘μ = I) e C8 (M∘T_fine − T_grossa∘M) per tutti i passaggi, dal campo del cosmo alla scala quantistica, con esiti TORNA / NON TORNA / misurato / manca M / manca μ [L] (`test/test_coerenza_scale.mjs:1-20`).
- La mappa delle grandezze ha già una prova di continuità: ogni ingresso varia a passi dell'1 %, e i salti oltre il 30 % sono classificati come gradini o come sensibilità alte [L] (`reports/Mappa delle grandezze.md:204`).
- Questo giro ha trovato costanti a mano **non ancora** nel censimento della vista: tutte quelle di `geologia.js:674` (mondo, non vista), le soglie di `mappa.js` (navigazione) e i criteri di divisione di `pianeta.js:778-781` [L].

**(b) La sostituzione basata su principi**
- **Analisi di sensibilità globale.** Il primer di Saltelli et al. (Wiley 2008) usa lo screening di Morris e le misure basate sulla varianza. Gli indici di Sobol' scompongono la varianza dell'uscita in contributi di ogni ingresso e delle interazioni. In pratica si usano solo gli indici del primo ordine e quelli totali, perché sono 2^p − 1 [S] ([Wikipedia](https://en.wikipedia.org/wiki/Variance-based_sensitivity_analysis); [arXiv 2206.11348](https://arxiv.org/pdf/2206.11348)). Software: `sensobol` per R [S] ([vignetta](https://search.r-project.org/CRAN/packages/sensobol/vignettes/sensobol.pdf)) e SALib per Python, licenza MIT [R].
  - Per stateyour: ingressi = le 53+ costanti a mano più quelle trovate qui; uscite = metriche d'immagine (ΔE p99 contro un riferimento, luminanza media, varianza delle pendenze) e grandezze del mondo. Le costanti con indice totale ≈ 0 si possono fissare senza danno. Quelle con indice alto sono le prime da derivare.
- **Analisi dimensionale.** Il teorema Π di Buckingham dà i gruppi adimensionali [R]. Si propone un controllo automatico: ogni FONTE del registro ha unità d'ingresso e d'uscita; si valuta la funzione con le unità come esponenti razionali (un tipo «grandezza») e si fallisce se una somma mescola dimensioni. Una costante con dimensione che non è nel registro è per definizione a mano (inferenza).
- **Provenienza.** Ogni numero porta {fonte, tipo (a)/(b)/(c), prova di convergenza}. È la tabella della vista resa leggibile da un programma [R] (W3C PROV come modello di riferimento, [PROV-O](https://www.w3.org/TR/prov-o/)). Lo strumento: un *lint* sull'AST (per esempio con `acorn`, MIT [R]) che elenca ogni letterale numerico fuori da NUMERI_CON_FONTE e da un elenco esplicito di convenzioni (0, 1, 2, ½, π…).
- **Prove di convergenza delle discretizzazioni.** Si riprende C12 di LINGUA.md, già usata in `test_vista.mjs`: una discretizzazione è lecita se, resa più fine, l'immagine converge [L] (`reports/Scelte a mano nella vista.md:12-14`). Si estende ai criteri di LOD (`magliePerPixel`, `errorePixel`) e ai passi dei volumi «non provati» [L] (`reports/Scelte a mano nella vista.md`, righe su `nucleo.js:228`, `volumi.js:27`).
- **Prove automatiche di coerenza tra le scale nell'immagine** (inferenza del panel, nessuna fonte pubblicata trovata):
  1. *C6 visivo*: la resa del figlio, ridotta all'impronta del pixel del padre con un filtro di area in luce lineare, deve dare la resa del padre entro ΔE tollerato. Con LEADR vale anche per la luminanza speculare.
  2. *Prova di pop*: uno zoom scriptato in scala logaritmica, a velocità costante, su 60 decadi; per ogni fotogramma Δ(immagine) normalizzato alla velocità; un picco oltre la soglia di percezione è un salto, e lo si attribuisce al livello o alla soglia attivi in quel momento.
  3. *Prova di bilancio*: il flusso totale nella dissolvenza resta costante.
  4. *Prova di determinismo*: l'impronta hash di un centinaio di indirizzi campione a ogni aggiornamento di Electron [V] (proposta del report Navigazione).
- **Prove metamorfiche.** Invarianze note usate come oracolo: ruotare il punto di vista non cambia la media di una tessera; cambiare l'ordine di calcolo non cambia i bit (è la proprietà dei RNG a contatore) [R] (Chen et al., «Metamorphic Testing: A Review of Challenges and Opportunities», ACM CSUR 2018; nessun link verificato).

**(c) Costo e guadagno attesi**
- Lint dei letterali: uno script di poche centinaia di righe; trova in un passaggio ciò che oggi si legge a mano (inferenza).
- Morris: circa r·(p+1) esecuzioni, con r ≈ 10–20; per p ≈ 80 costanti sono circa 1000–1600 rese. Sobol' su poche decine di costanti selezionate: N·(p+2) con N ≈ 10³ [R].
  - Inferenza: con rese ridotte (256²) e senza GPU vera è fattibile in prova notturna.
- La prova di pop è una sola esecuzione lunga per universo campione.

**(d) Come garantisce la coerenza**
- C6/C8 diventano anche *visivi*. Il registro rende misurabile «quanto non emerge»: il numero di letterali senza fonte per modulo, pesato con l'indice totale di Sobol', è una metrica da far scendere giro dopo giro (inferenza).

**(e) Licenze**
- SALib: MIT [R]. sensobol: licenza non verificata. acorn: MIT [R].

### Inferences
- L'ordine di lavoro che il panel propone, basato sui difetti visibili:
  1. lint e censimento automatico (trova anche `geologia.js:674` e `mappa.js`);
  2. screening di Morris sull'immagine;
  3. derivazione delle costanti con indice alto, a partire dallo spettro del rilievo (§1);
  4. prova di pop sullo zoom intero come regressione.

### Gaps
- Non si è trovata una fonte pubblicata su «prove di coerenza visiva tra le scale» per sistemi di zoom continuo: la metodologia proposta è del panel.
- Non si è verificato il testo del primer di Saltelli né i costi esatti degli stimatori di Sobol'.
- La licenza di `sensobol` e i dettagli di W3C PROV come formato per il registro non sono stati verificati.
