# Progetti con lo stesso scopo di «stateyour» (universo multiscala, deterministico, calcolato solo dove si guarda), che cosa hanno in più, e l'architettura che li rende veloci nel browser/Electron — stato al 20 novembre 2026

**Marche di affidabilità** (stesse convenzioni delle altre note in `research_notes/`):

- **[V]** = verificato in questa sessione aprendo la fonte (pagina, PDF, testo della specifica scaricato e cercato).
- **[S]** = da riassunto di risultati di ricerca o da fonte secondaria; la pagina primaria non è stata letta per intero.
- **[R]** = ricordo mio, **non verificato** oggi: va controllato prima di essere citato come fatto.
- **[L]** = verificato sul codice locale di stateyour (`/home/user/stateyour/src`, `electron/`), con `grep` in questa sessione.

Pagine non raggiungibili oggi (403): `worldlabs.ai/blog/spark-2.0`, `tympanus.net/codrops/2026/04/21/false-earth-...` (articolo «False Earth: from WebGL limits to a WebGPU-driven world», da leggere a mano: sembra proprio il caso di stateyour). La GDC Vault di No Man's Sky richiede l'abbonamento: i dettagli interni del talk non sono stati letti.

Questa nota **non ripete** la scheda dei motori (licenze, coordinate, depth buffer, octree, generatori a contatore) già fatta in `research_notes/Simulatori e modelli per stateyour/motori_procedurali_e_architettura.md`: qui si guarda a **sensazione, navigazione, prestazioni nel browser, splat e determinismo tra macchine**.

**Stato di partenza di stateyour, letto sul codice [L]:**
- Ci sono già 7 lavoratori (Web Worker) di modulo: `src/camera/superficie.worker.js`, `src/tre/{minori,quanti,rete,splat,tessere,volume}.worker.js`, e in più `cercatore.js`/`lettore.js` avviati da `src/camera/laboratorio.js`. `OffscreenCanvas` si usa in modo esteso in `src/camera/mappa.js` e `grani.js`, ma come tela 2D fuori schermo, non per trasferire il rendering WebGL a un lavoratore.
- Non c'è **nessuna** cache persistente dei risultati calcolati per indirizzo: `grep` di `indexedDB`, `caches.open`, `getDirectory` (OPFS) non trova nulla; `localStorage` serve solo per lo stato dell'interfaccia (`stateyour:camera`, `stateyour.bolla3d`, `stateyour:studio`, `stateyour:codifica`).
- **Nessun** WebAssembly e **nessun** WebGPU (`grep` di `WebAssembly` e `navigator.gpu` senza risultati utili in `src/`).
- `electron/main.cjs` crea la finestra con `webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }` e senza switch della riga di comando; `package.json` richiede `electron ^45.2.3`.
- Esiste già un sistema di **splat gaussiani fisici** (`src/tre/splat.js`): proiezione EWA della covarianza, estinzione e diffusione per canale, albero in ordine di Morton dove ogni padre è la fusione per momenti dei figli, con un lavoratore dedicato. La regola 14 di `INTRECCIO.md` dice che uno splat «non è un modo di dipingere»: porta materia, non colore.

---

## 1. Quali progetti puntano a un universo procedurale multiscala continuo, a che scale arrivano, quanto sono deterministici, con che tecnica, che cosa sembra meglio e che cosa manca

### Takeaway
Nessun progetto, commerciale o accademico, va davvero **dal cosmo all'atomo in un solo mondo coerente generato dalla fisica**. I giochi (No Man's Sky, Elite, Star Citizen, SpaceEngine, I-Novae) si fermano al terreno, alla roccia o alla pianta, e fingono la fisica dove serve all'aspetto. Le app di «zoom delle scale» (Powers of Ten, Scale of the Universe, Universal Zoom) vanno dal quark al cosmo, ma sono una **sequenza curata di immagini** senza un mondo sotto. Gli strumenti accademici (ScaleTrotter) coprono 4–5 ordini di grandezza con transizioni molto studiate. Quindi stateyour sta in un buco reale: la sua ampiezza e la sua coerenza non hanno concorrenti. Gli altri però lo battono di molto in **direzione artistica, momenti curati, transizioni tra scale e reattività**.

### Cited Findings

#### Giochi e motori dallo spazio al suolo
- **No Man's Sky (Hello Games).** Il talk GDC 2017 di Innes McKendrick, «Continuous World Generation in No Man's Sky», descrive una pipeline in fasi: generazione a voxel → poligonizzazione → texturing → popolamento → simulazione, perché il giocatore possa passare senza stacchi dallo spazio al terreno popolato [S] — [GDC Vault](https://gdcvault.com/play/1024265/Continuous-World-Generation-in-No); [Game Developer, video e sintesi](https://gamedeveloper.com/programming/video-how-continuous-world-generation-works-in-i-no-man-s-sky-i-). I dettagli (funzione di rumore, dimensione dei blocchi, budget per fotogramma, numero di thread) **non** compaiono nelle sintesi pubbliche: un'analisi secondaria avverte di non trattarli come specifiche ufficiali [S] — [ricerca, sintesi](https://www.itechguides.com/how-no-mans-skys-procedural-planets-work/). Talk complementare: Sean Murray, «Building Worlds Using Math(s)», GDC 2017 [S] — [GDC Vault](https://gdcvault.com/play/1024514/Building-Worlds-Using).
  - Ricordati, da verificare [R]: un seme a 64 bit per l'universo, da cui viene il numero «18 quintilioni di pianeti» (2^64); una sola funzione di rumore composita per il terreno, chiamata «uber noise» nel talk di Murray; una direzione artistica dichiaratamente presa dalle copertine di fantascienza degli anni '70; un audio procedurale («Pulse», di Paul Weir) mescolato a temi registrati dei 65daysofstatic.
  - Mancanze: biomi e creature vengono da una tavolozza di parti fatte a mano; non c'è geologia, clima o chimica vera, né scale sotto la pianta [R].
- **Elite Dangerous — Stellar Forge (Frontier).** Galassia 1:1 di circa 400 miliardi di sistemi, generata da un modello della distribuzione di massa unito ai cataloghi reali, con sistemi indirizzati in modo deterministico. Si ferma ai pianeti senza atmosfera da atterrare (più tardi Odyssey) [S, scheda nella nota esistente] — [80.lv, «Generating the Universe in Elite Dangerous»](https://80.lv/articles/generating-the-universe-in-elite-dangerous/).
- **SpaceEngine (V. Romanyuk).** I primi terreni procedurali producevano le texture **sulla CPU**, sullo stesso quadtree che prima caricava pezzi da disco [S] — [SpaceEngine news, pagina 26](https://spaceengine.org/news/page/26/). Una cache interna di stelle, texture del terreno e shader fa sì che entrare e uscire dal menu non ricarichi nulla [S] — [blog SpaceEngine 2018](https://spaceengine.org/news/blog181008/). Un vecchio post di gamedev.net sulla generazione del terreno sulla GPU spiega il difetto della generazione sincrona: il rendering si ferma finché non sono pronti i dati di ogni figlio del quadtree. L'attribuzione a SpaceEngine **non** è confermata [S] — [gamedev.net 1832259](https://rsn.gamedev.net/blogs/entry/1832259-gpu-terrain-generation-cell-noise-rivers-crater).
  - Ricordati [R]: C++/OpenGL; cataloghi reali più procedurale fino a scale cosmologiche; generazione del terreno su GPU nelle versioni 0.98+; atmosfere a diffusione fisica; autopilota «vai a» con avvicinamenti fluidi; pannello informazioni da enciclopedia; nessun numero di tempi di caricamento trovato. Mancanze: non scende sotto il terreno (niente suolo, mare in profondità o molecole); i pianeti sono rumore con parametri, non una storia fisica.
- **I-Novae Engine / Infinity: Battlescape.** Lo studio lo presenta come motore per aree giocabili enormi, pianeti, sistemi stellari e galassie in scala reale; i pianeti procedurali sono «ciò che lo rende unico»; i prototipi mostrano il passaggio senza stacchi dallo spazio profondo alla superficie [S] — [ModDB, I-Novae Engine](https://www.moddb.com/engines/i-novae-engine/games); [IndieDB](https://www.indiedb.com/engines/i-novae-engine). Nessun articolo tecnico pubblico trovato su precisione doppia o rendering relativo alla camera (lacuna).
- **Star Citizen (CIG).** Motore a 64 bit derivato da CryEngine, pianeti procedurali con ecosistemi fatti a mano (vedi la nota esistente per le fonti GamersNexus) [S] — [GamersNexus, 64-bit engine tech](https://gamersnexus.net/gg/2622-star-citizen-sean-tracy-64bit-engine-tech-edge-blending).
- **Outerra.** Terra in scala reale da dati di elevazione reali più raffinamento frattale; da qui viene l'articolo canonico sul depth buffer logaritmico [S, nota esistente] — [Outerra blog 2012](https://outerra.blogspot.com/2012/11/maximizing-depth-buffer-range-and.html).
- **Dual Universe (Novaquark).** Pianeti a voxel modificabili in un solo universo condiviso [R]; nessuna fonte aperta oggi.
- **Kerbal Space Program 2.** Diario tecnico «Developer Insights #12 – Planet Tech» sulla tecnologia dei pianeti [S, solo titolo visto] — [KSP, Developer Insights #12](https://www.kerbalspaceprogram.com:443/news/dev-diaries-developer-insights-12-planet-tech).
- **Spaceflight Simulator 2 (Stef Morojna, Unity).** Il pianeta intero si fa con circa 50.000 triangoli; i dettagli vengono da blocchi di texture 256×256 generati a runtime sulla GPU, con quasi tutta la luce portata dalla mappa delle normali; gira su telefoni di fascia medio-bassa [V] — [80.lv, 26 maggio 2025](https://80.lv/articles/this-full-scale-planet-rendering-system-is-so-efficient-it-runs-on-mobile).
- **Gaia Sky (ARI Heidelberg).** La generazione procedurale delle superfici è passata dalla CPU (libreria Joise, tanto lenta da richiedere barre di avanzamento) alla GPU. Usa shader di frammento invece che di calcolo per compatibilità: il compute richiede OpenGL 4.3 e macOS si ferma a 4.1. Due passate: prima una «mappa dei biomi» (elevazione, umidità, temperatura nei canali R, G, B), poi le mappe diffusa, speculare, normale ed emissiva in render target multipli. Il seme alimenta il generatore del rumore. Nessun numero di velocità pubblicato, solo «molto più veloce» [V] — [Toni Sagristà, «Supercharging exoplanets», 2024](https://tonisagrista.com/blog/2024/supercharging-planetary-surfaces/).
- **Universe Sandbox (Giant Army).** Simulatore N-corpi più clima e collisioni, non uno zoom procedurale profondo; vedi la nota esistente per che cosa simula davvero [S].
- **Celestia, OpenSpace, Proland.** Celestia (GPL) usa cataloghi reali, non procedurali [S, nota esistente]. Proland (INRIA, Bruneton e colleghi): terreno planetario con «producer» su GPU, diffusione atmosferica precalcolata (Bruneton & Neyret 2008) e oceano (Bruneton, Neyret & Holzschuch 2010) [R]; licenza e stato del repository non verificati oggi.

#### Nel browser
- **Cosmos Journeyer (Barthélemy Paleologue, Babylon.js/TypeScript).** È il progetto web più vicino a stateyour come genere: universo procedurale esplorabile nel browser. Il suo oceano FFT su WebGPU (WebTide, MIT) è stato scritto «con l'intento di integrarlo in Cosmos Journeyer» [V] — [Paleologue, «Ocean Simulation with FFT and WebGPU»](https://barthpaleologue.github.io/Blog/posts/ocean-simulation-webgpu). Ricordati [R]: va dalla galassia alla superficie, con stelle, pianeti telluriche e gassosi, buchi neri, atmosfere; licenza e stato del repository da verificare.
- **World42 (bpodwinski, Babylon.js).** Pianeta in scala reale; l'autore sta sostituendo il quadtree su CPU con una **CBT (concurrent binary tree) guidata dalla GPU in WebGPU**, su un ramo dedicato [S] — [forum Babylon.js, «WIP: Real Scale Planet»](https://forum.babylonjs.com/t/wip-real-scale-planet/56910).
- **Altri progetti web** [S, da sintesi di ricerca, date non confermate]: **PlanetTechJS** (three.js, quadtree LOD, editor React; [npm](https://www.npmjs.com/package/planettech)); **jo56/procedural-terrain** (mappe d'altezza in compute WGSL con flusso di blocchi; [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fjo56%2Fprocedural-terrain)); **Kosmos** (Rust + WebGPU, terreno a tessere in compute WGSL; [GitHub kaylendog/kosmos](https://github.com/kaylendog/kosmos)); **Lagrange** (costruttore di pianeti Vue + three.js con TSL; [forum three.js](https://discourse.threejs.org/t/lagrange-procedural-planet-builder-vue-js-three-js-tsl-in-progress/83453)); **100,000 Stars** di Google (zoom sulla galassia in WebGL; [Chrome Blog 2012](https://chrome.googleblog.com/2012/11/explore-stellar-neighborhood-with-your.html)).

#### Dal grande al piccolo: le app di zoom e le ricerche sulla multiscala
- **Powers of Ten** (Charles e Ray Eames, 1977) ispira esplicitamente «Cosmic Eye» per iOS [S] — [App Store, Cosmic Eye](https://apps.apple.com/app/cosmic-eye/id519994935). Ricordato [R]: il film va da circa 10^25 m a 10^−16 m a velocità **logaritmica costante** (una potenza di dieci ogni 10 s), con un punto d'ancoraggio fisso (la mano della persona al picnic) e un indicatore della scala sempre a schermo.
- **The Scale of the Universe 2** (Cary e Michael Huang, 2012): un solo cursore dal nucleo dell'idrogeno all'universo osservabile, oltre 100 oggetti, ogni passo ×10 [S] — [The Next Web, 2012](https://thenextweb.com/news/scale-of-the-universe-is-an-interactive-experience-that-takes-you-from-atoms-to-galaxies); [Discover](https://discovermagazine.com/the-sciences/the-interactive-scale-of-the-universe).
- **Universal Zoom** (iOS): dalla lunghezza di Planck al bordo dell'universo osservabile, circa 300 oggetti in scala [S] — [App Store](https://apps.apple.com/in/app/id807673066). **Univerzoom 3D** e **Cozmic Zoom** sono simili [S] — [App Store, Univerzoom 3D](https://apps.apple.com/us/app/univerzoom-3d-explore-scale/id1552648156?l=en-US); [App Store, Cozmic Zoom](https://apps.apple.com/ca/app/cozmic-zoom/id945633106).
- **ScaleTrotter** (Halladjian, Miao, Kouřil, Gröller, Viola, Isenberg; arXiv 1907.12352, VIS/TVCG 2019): viaggio dal nucleo di circa 6 µm fino agli atomi (circa 0,12 nm), cioè 4–5 ordini di grandezza in sette livelli concettuali. Le tecniche, verificate [V] — [ar5iv 1907.12352](https://ar5iv.labs.arxiv.org/html/1907.12352):
  - **incastro visivo**: la scala grossa si appiattisce in una «tela» man mano che ci si avvicina, mentre la scala fine si sovrappone con opacità crescente;
  - il dettaglio compare **solo dentro l'elemento padre** (selezione per ID);
  - in due passaggi il cambio di scala è fatto con un **cambio di colore**;
  - i livelli dei dati non coincidono con i livelli percepiti;
  - la **velocità della camera dipende dalla scala**, ed è legata alla distanza dal livello obiettivo;
  - una manopola di «spostamento di scala» cambia la rappresentazione senza cambiare la grandezza sullo schermo;
  - la regione a fuoco è leggermente più chiara delle sorelle;
  - il dettaglio lontano sparisce progressivamente;
  - 15–35 fps su una workstation; il caricamento dura circa due minuti (limite dichiarato).

  Le illustratrici intervistate hanno trovato le transizioni «really cool», ma hanno notato che mancano **narrazione e racconto**; il biologo ha detto che alcune transizioni arrivano «troppo presto».
- **BRAIN STORM** (three.js): un unico percorso di camera dalla corteccia (circa 150 mm) a un orbitale dell'idrogeno (circa 1 Å), circa 9 ordini di grandezza, nel browser [S] — [DEV Community](https://dev.to/pier_andreacavaletto_761/brain-storm-49j9).
- **Galaxy Portfolio** (three.js): sette scene dalla galassia alla scrivania, legate da transizioni con un gestore di scene; finisce alla scala della stanza [S] — [forum three.js](https://discourse.threejs.org/t/galaxy-portfolio-an-interactive-zoom-journey-from-milky-way-to-desk/82229.md).
- **Cell Lab, Particle Life.** Sandbox di vita artificiale a una sola scala, con regole locali semplici e comportamenti emergenti [R]; non coprono più scale. Nessuna fonte aperta oggi.

### Inferences
- Le app di zoom «battono» stateyour nella leggibilità perché **ogni livello è curato e ha un oggetto riconoscibile al centro**. I giochi lo battono nella **continuità percepita**: la transizione spazio→suolo è il loro «momento eroe» ed è progettata e ottimizzata apposta. ScaleTrotter mostra che la continuità si può ottenere anche con dati diversi a ogni livello, usando incastro, appiattimento, colore come segno del cambio di livello e velocità della camera legata alla scala.
- Il modello più simile al percorso di stateyour (cosmo→suolo nel browser) è Cosmos Journeyer/WebTide (Babylon.js + WebGPU). Il più simile per l'architettura della superficie è World42 (CBT su GPU). Vale la pena leggere tutti e due prima di riscrivere la superficie.
- La lezione di Gaia Sky e Spaceflight Simulator 2 è la stessa: **generare sulla GPU texture a blocchi di dimensione fissa (256²) e mettere poca geometria** è ciò che porta un pianeta da «barre di avanzamento» a «tempo reale».

### Gaps
- «Hello Universe», «The Universe in a Box», «Planet Zoom», «Kosmos/Cosmos» come app di zoom delle scale: nessuna fonte affidabile trovata; potrebbero essere nomi informali o progetti minori.
- Non è stata trovata nessuna app di Kurzgesagt per lo zoom delle scale.
- I numeri interni di No Man's Sky (budget per fotogramma, thread) e di SpaceEngine (tempi di generazione) non sono pubblici, o almeno non sono stati trovati.
- Licenza e attività di Cosmos Journeyer, Proland e World42 non verificate.

---

## 2. Che cosa manca a stateyour rispetto a loro nella «sensazione»: direzione artistica, momenti eroe curati, audio, movimento, rifinitura, accoglienza del nuovo utente

### Takeaway
Gli altri progetti **non sono più fisici** di stateyour; sono più **diretti**. Scelgono che cosa mostrare a ogni scala (un oggetto al centro), come ci si sposta (velocità logaritmica costante, autopilota verso un bersaglio), che cosa si sente (suono che cambia con la scala) e dove si posa l'occhio (inquadratura, esposizione, contrasto della zona a fuoco). Tutto questo si può aggiungere **senza falsificare la fisica**: tocca camera, interfaccia, esposizione e suono, non le leggi.

### Cited Findings
- **Ancoraggio e indicatore di scala.** Powers of Ten tiene un punto fisso al centro e una scala sempre visibile, con velocità logaritmica costante [R]. Scale of the Universe usa un solo cursore a passi ×10 [S] — [The Next Web](https://thenextweb.com/news/scale-of-the-universe-is-an-interactive-experience-that-takes-you-from-atoms-to-galaxies).
- **Orientamento tra le scale** [V] — [ScaleTrotter](https://ar5iv.labs.arxiv.org/html/1907.12352):
  - il padre resta visibile come contesto appiattito;
  - la regione a fuoco è più chiara;
  - la camera rallenta vicino al livello obiettivo;
  - il dettaglio lontano sfuma.

  Le critiche degli esperti chiedevano narrazione e «più contrasto sulla prossima regione a fuoco», cioè un segnale di **dove si andrà**.
- **Accesso progressivo invece del vuoto.** Il visore SuperSplat scarica per primo il LOD più basso e poi raffina entro un budget per dispositivo [V] — [PlayCanvas, 3 giugno 2026](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins). Cesium salta livelli di dettaglio e **sfuma** tra quelli caricati per evitare scatti e «popping» [V] — [Cesium, 2017](https://cesium.com/blog/2017/05/05/skipping-levels-of-detail/). Percepire subito *qualcosa* di coerente è parte della rifinitura.
- **Audio procedurale.** No Man's Sky lega il suono al mondo generato (sistema «Pulse», temi dei 65daysofstatic) [R].
- **Direzione artistica dichiarata.** No Man's Sky usa una tavolozza da copertina di fantascienza anni '70 [R]. Gaia Sky e SpaceEngine puntano sul fotorealismo con diffusione atmosferica [R]. Spaceflight Simulator 2 sceglie in modo esplicito poca geometria e mappe delle normali molto curate [V] — [80.lv](https://80.lv/articles/this-full-scale-planet-rendering-system-is-so-efficient-it-runs-on-mobile).
- **Autopilota e «vai a».** SpaceEngine e Celestia permettono di scegliere un oggetto e volarci con una curva di velocità automatica [R]. Universe Sandbox ha scenari guidati e sfide per chi inizia [R].
- **Le transizioni come momenti.** No Man's Sky e I-Novae fanno del passaggio spazio→superficie senza stacchi il cuore della dimostrazione [S] — [GDC Vault NMS](https://gdcvault.com/play/1024265/Continuous-World-Generation-in-No); [ModDB I-Novae](https://www.moddb.com/engines/i-novae-engine/games).

### Inferences
- Per stateyour mancano, in ordine di effetto per sforzo:
  1. **un bersaglio sempre visibile e cliccabile** (qual è il prossimo livello e dove si trova), con autopilota a velocità logaritmica che rallenta vicino;
  2. **un indicatore di scala e di «dove sono»** sempre a schermo (scala in metri; indirizzo leggibile come un percorso a briciole: universo › galassia › stella › pianeta › costa › mare › goccia);
  3. **transizioni a incastro** come ScaleTrotter: il livello padre appiattito dissolve nel figlio, invece di un taglio o di un'attesa;
  4. **esposizione e tono curati** (adattamento dell'occhio, contrasto della regione a fuoco), compatibili con la regola 14 perché agiscono sull'occhio e non sulla materia;
  5. **suono** derivato dalle grandezze fisiche già calcolate (vento, onde, temperatura stellare → timbro);
  6. **un «tour» d'avvio** che scende lungo un indirizzo scelto a mano, per esempio fino al mare: è insieme accoglienza e prova di prestazione.
- La confusione nella navigazione che riportano gli utenti è probabilmente dovuta più alla mancanza di (1) e (2) che alla qualità visiva in sé: tutte le app di zoom risolvono l'orientamento con un'ancora e una scala.

### Gaps
- Non è stato trovato nessuno studio sugli utenti che misuri quale di questi elementi conti di più nella navigazione multiscala; ScaleTrotter ha solo commenti qualitativi.
- I dettagli di Pulse e dell'autopilota di SpaceEngine sono ricordati, non verificati.

---

## 3. Architettura per le prestazioni: Worker e OffscreenCanvas, SharedArrayBuffer e WASM, compute WebGPU per terreno, oceano FFT e rumore, raffinamento progressivo, cache per indirizzo, prefetch della scala successiva — con numeri concreti

### Takeaway
I guadagni grandi e documentati arrivano da quattro cose:
1. **spostare sulla GPU il lavoro per pixel o per elemento** (texture a blocchi del terreno, FFT dell'oceano, ordinamento e selezione): fino a 5,7× su scene grandi, 2× sui telefoni;
2. **mostrare subito un livello grezzo e raffinare** (−30/50 % del tempo di carico in Cesium);
3. **mettere in cache su disco i risultati costosi** (OPFS: caricamenti 3× più veloci; una lettura dalla cache circa 30× più rapida della rete);
4. **non bloccare mai il rendering in attesa dei figli**.

WASM rispetto a JS dà guadagni modesti e variabili (da 0,56× a circa 3–8×, secondo browser e carico): non è la prima leva. I tempi di decine di secondi vicino al mare fanno pensare a un calcolo **sincrono e a catena** prima del primo fotogramma, più che a un problema di velocità pura.

### Cited Findings

#### GPU (WebGPU) contro WebGL e JS
- **Splat, PlayCanvas Engine v2.19.0 (3 giugno 2026)** [V] — [PlayCanvas blog](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins):
  - Su Apple M4 Max a 1298×962, WebGL 2 contro WebGPU in fps: 1M 137,2 / 138,7; 4M 113,6 / 146; 10M 48,1 / 124,1; 20M 22,3 / 97,8; 35M 13,3 / 75,8. Accelerazione da 1× a **5,7×**.
  - Su iPhone 13 Pro Max: 1M 38,1 / 77,6; 4M 20,4 / 42,4, cioè circa **2×**.
  - Architettura: prima l'ordinamento girava in un lavoratore; ora la selezione degli splat invisibili, la proiezione e l'**ordinamento radix sulla GPU** sono shader di calcolo, mentre vertice e frammento sono leggeri e leggono dati già proiettati.
  - Circa il 15 % degli utenti non ha WebGPU (dato caniuse citato) e ricade su un percorso WebGL 2 che rende uguale.
- **Oceano FFT in WebGPU (WebTide)** [V] — [Paleologue](https://barthpaleologue.github.io/Blog/posts/ocean-simulation-webgpu):
  - spettro 256×256 (L = 10 m per l'acqua finale);
  - passate: spettro iniziale (Phillips × rumore gaussiano) calcolato una volta, con il coniugato nello stesso texel; poi in compute lo spettro h(k,t), il gradiente e lo spostamento «choppy»; poi la IFFT; poi lo spostamento nei vertici, con le normali dal gradiente;
  - 512² vuol dire già 262.144 moltiplicazioni complesse per passo;
  - per spettri piccoli «si può fare la FFT sulla CPU con più thread»;
  - **nessuna misura di tempo** nell'articolo.
- **Tempi di una FFT 1D in WGSL (crate wgsl-fft 0.1.0, GPU NVIDIA)**: 0,095 ms per N = 256, 0,107 ms per N = 1024, 0,128 ms per N = 4096 [S] — [docs.rs wgsl-fft 0.1.0](https://docs.rs/crate/wgsl-fft/0.1.0). Sono FFT singole, non un fotogramma di oceano completo.
- Chrome (I/O 2023) cita una demo Babylon.js con l'oceano simulato **interamente sulla GPU** a 60 fps, e osserva che il compute libera il ciclo principale di JS [S] — [Chrome Developers, WebGPU I/O 2023](https://developer.chrome.com/blog/webgpu-io2023).
- **Benchmark generico WebGPU contro JS**: circa 1× su una simulazione di particelle semplice, circa 2× su moltiplicazione di matrici e su elaborazione d'immagini [S, blog personale] — [DEV Community](https://dev.to/sylwia-lask/why-are-we-still-doing-gpu-work-in-javascript-live-webgpu-benchmark-demo-4j6i).
- **Terreno su GPU senza compute**: Gaia Sky genera biomi e mappe in shader di frammento con render target multipli [V] — [Sagristà](https://tonisagrista.com/blog/2024/supercharging-planetary-surfaces/). Spaceflight Simulator 2 usa blocchi 256² generati sulla GPU [V] — [80.lv](https://80.lv/articles/this-full-scale-planet-rendering-system-is-so-efficient-it-runs-on-mobile). World42 sta passando a una **CBT su GPU** in WebGPU [S] — [forum Babylon.js](https://forum.babylonjs.com/t/wip-real-scale-planet/56910).
- **Non bloccare il rendering**: la generazione sincrona «ferma il rendering finché non sono pronti i dati per ogni figlio» [S] — [gamedev.net](https://rsn.gamedev.net/blogs/entry/1832259-gpu-terrain-generation-cell-noise-rivers-crater).

#### WASM contro JS
- Filtri d'immagine in Rust/WASM: 1,46× sulla scala di grigi (1,90 → 1,30 ms) e circa 3× sul box blur grazie all'auto-vettorizzazione [S, blog] — [DEV Community](https://dev.to/sendotltd/how-much-faster-is-rustwasm-than-js-for-image-filters-i-ran-both-side-by-side-and-measured-3k8m).
- Un frattale: circa 1200 ms per fotogramma in JS contro circa 150 ms in Rust/WASM, attribuiti a SIMD e all'assenza di pause del garbage collector. L'attribuzione è affermata, non misurata [S] — [Level Up](https://levelup.gitconnected.com/rust-vs-javascript-achieving-66-faster-performance-with-webassembly-eea7e38266c8).
- Un articolo arXiv su pipeline di particelle trova il percorso WASM **più lento** di JS in Firefox (circa 0,56× a N = 250k) e 1,5–1,6× più veloce in Chrome [S] — [arXiv 2608.23609](https://arxiv.org/pdf/2608.23609).
- Linea di base accademica: WASM è in media 1,3× più veloce di asm.js e resta più lento del nativo [S] — [Jangda et al., «Not So Fast», arXiv 1901.09056](https://arxiv.org/pdf/1901.09056).

#### Cache persistente e raffinamento
- **OPFS come cache (Lumafield Voyager, 6 aprile 2026)** [V] — [Lumafield](https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/):
  - progetti oltre 1 GB;
  - carico del progetto (mediana / 75° percentile) da 21 s / 55 s a **7 s / 19 s**, cioè circa 3×, anche se solo circa il 30 % degli oggetti veniva dalla cache;
  - una lettura da OPFS dura circa 1 s, circa **30×** meno della rete;
  - IndexedDB è «significativamente più lento» per grandi `ArrayBuffer` a causa della serializzazione e delle transazioni, quindi è stato usato solo per i metadati;
  - scritture lanciate senza attendere, sul thread principale.
- OPFS con handle sincrono **solo nei Worker** è la via più veloce [S] — [RxDB, OPFS](https://rxdb.info/rx-storage-opfs.html). Lo stesso venditore sostiene altrove che IndexedDB ha le scritture più rapide: le fonti si contraddicono, e serve un test proprio [S] — [RxDB, IndexedDB](https://rxdb.info/rx-storage-indexeddb.md).
- **Saltare i livelli di dettaglio (Cesium)**: il municipio di Filadelfia passa da 16 s a 11 s e da 32 MB a 22 MB; in generale carico e memoria calano del 30–50 %, con il frame time fermo a circa 16 ms; si sfuma tra i livelli per evitare il popping [V] — [Cesium](https://cesium.com/blog/2017/05/05/skipping-levels-of-detail/).
- **Raffinamento a flusso con budget per dispositivo**: prima il LOD più basso, poi più fine entro un budget di gaussiane per dispositivo; la scena del museo arriva a circa 24 milioni di gaussiane al livello massimo [V] — [PlayCanvas](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins).

#### Electron, SharedArrayBuffer, OffscreenCanvas
- Ricordati, da verificare [R]:
  - `SharedArrayBuffer` richiede che la pagina sia **isolata tra origini** (`crossOriginIsolated`, con le intestazioni COOP `same-origin` e COEP `require-corp`). In Electron si ottiene servendo i file da un protocollo personalizzato che aggiunge queste intestazioni (`protocol.handle`), oppure aggiungendole in `session.webRequest.onHeadersReceived`.
  - Electron 45 incorpora un Chromium recente (circa 14x), con WebGPU disponibile di default su Windows e macOS da Chrome 113.
  - `OffscreenCanvas.transferControlToOffscreen()` permette di spostare **tutto il rendering WebGL/WebGPU** in un lavoratore, così il thread principale gestisce solo input e interfaccia.

### Inferences
- **Diagnosi probabile dei tempi di stateyour** (da confermare con il profilatore di Chrome DevTools). I circa 3 s all'avvio e le decine di secondi vicino al mare sembrano tempi di **una catena di dipendenze calcolata tutta prima di mostrare qualcosa** (il mare dipende da clima, vento, spettro delle onde, chimica e fondale, secondo i commenti di `src/tre/pianeta.js` [L]), e ricalcolata a ogni visita perché non c'è cache su disco [L]. Le contromisure documentate:
  - (a) mostrare subito il genitore già pronto e **sfumare** verso il figlio quando arriva (Cesium, SuperSplat, ScaleTrotter);
  - (b) mettere in cache su OPFS il risultato di ogni nodo con chiave = indirizzo + versione del modello (Lumafield: 3× sui carichi, 30× per oggetto);
  - (c) portare sulla GPU solo le parti per pixel o per elemento (texture del terreno a blocchi 256², FFT 256² dell'oceano), lasciando la fisica che decide lo stato del mondo in JS deterministico (vedi §5).
- **Prefetch della scala successiva**: con un autopilota verso un bersaglio (vedi §2), la destinazione è nota **prima** dell'arrivo. Il percorso degli indirizzi lungo la traiettoria si può mettere in coda ai lavoratori con priorità decrescente. È lo stesso principio della «prioritizzazione delle richieste» delle tessere 3D, che la pagina Cesium letta non descrive in dettaglio.
- **WASM** conviene solo per kernel stretti e caldi che restano sulla CPU perché devono essere deterministici (rumore e erosione che entrano nello stato), e soprattutto **per il determinismo** (una libm propria, §5) più che per la velocità. I numeri trovati (da 0,56× a 3×) non giustificano una riscrittura generale.
- **SharedArrayBuffer** serve se più lavoratori devono leggere la stessa griglia grande (campo di quota, clima) senza copie. Con i 7 lavoratori già presenti, il costo attuale è probabilmente nel `postMessage` di grandi array: conviene misurarlo; i buffer trasferibili sono l'alternativa senza isolamento tra origini.

### Gaps
- Nessun benchmark pubblico trovato che confronti **rumore o terreno** in WebGPU compute contro JS, né un oceano FFT completo in ms per fotogramma nel browser. I soli numeri sono la FFT 1D di wgsl-fft e il «60 fps» qualitativo di Chrome.
- L'articolo «False Earth» (Codrops, aprile 2026), sul passaggio da WebGL a WebGPU in un mondo-pianeta, non è stato letto (403): è da recuperare.
- Il costo reale del `postMessage` e delle catene di dipendenze in stateyour non è stato misurato in questa sessione.

---

## 4. Gaussian splatting e rendering neurale per contenuti procedurali o generati: usi per accelerare o abbellire, fattibilità nel browser

### Takeaway
I visori di splat nel browser sono maturi: decine di milioni di gaussiane a 75–125 fps in WebGPU su un portatile di fascia alta, 1–4 milioni a 40–75 fps su un telefono, con LOD a flusso. Il **rendering neurale generativo** (GaussianCity) produce città illimitate, ma a circa 10 fps su GPU da server, con dati appresi: non è deterministico per indirizzo e non è fisico. Per stateyour l'uso utile è quello che ha già cominciato: splat come **rappresentazione LOD della materia** (nebulose, galassie, nubi, schiuma, sedimenti in sospensione). Si può portare a WebGPU con selezione e ordinamento sulla GPU e usarlo come **cache visiva per indirizzo** di viste costose.

### Cited Findings
- **PlayCanvas/SuperSplat**: WebGPU fino a 5,7× su WebGL 2 a 35M splat; ordinamento radix e selezione in compute; formato «Streamed SOG» decimato in LOD e diviso in blocchi a flusso [V] — [PlayCanvas](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins).
- **Spark (World Labs)**: renderer 3DGS «dinamico» integrato con three.js, su **WebGL2**; budget di 1–5 milioni di splat su computer (10–20+ milioni su desktop di fascia alta) per restare sopra i 60 fps [S] — [GitHub sparkjsdev/spark](https://github.com/sparkjsdev/spark); [World Labs, Spark 2.0 (403)](https://www.worldlabs.ai/blog/spark-2.0?hl=en-US). Ricordato [R]: Spark permette di generare e modificare splat da codice (splat «procedurali», SDF, modificatori nello shader), che è proprio ciò che servirebbe a contenuti generati per indirizzo.
- **Altri visori WebGPU/accademici**: WebSplatter (arXiv 2602.03207, rendering efficiente su più dispositivi via WebGPU) [S] — [arXiv](https://arxiv.org/abs/2602.03207); Visionary (arXiv 2512.08478, piattaforma WebGPU che si confronta con SparkJS) [S] — [arXiv](https://arxiv.org/html/2512.08478v1); un esempio di base del W3C [S] — [w3.org/2026/splat](https://www.w3.org/2026/splat/); un visore in luma.gl [S] — [luma.gl](https://luma.gl/next/examples/showcase/gaussian-splat-viewer).
- **Visori storici** [R]: antimatter15/splat (WebGL, ordinamento in un lavoratore), gsplat.js (Hugging Face), mkkellogg/GaussianSplats3D (three.js; ricordo che il README ora rimanda a Spark come successore). Da verificare.
- **Generativo**: GaussianCity (CVPR 2025) genera città illimitate in un solo passaggio feed-forward con una rappresentazione compatta «BEV-Point» (mappa d'altezza, mappa semantica, densità), memoria video costante perché considera solo i punti visibili, 10,72 fps contro 0,18 fps di CityDreamer. È addestrato su Google Earth e KITTI-360 [S] — [arXiv 2406.06526](https://arxiv.org/html/2406.06526v3).
- **stateyour** ha già splat fisici con albero di Morton, fusione per momenti, estinzione per canale in tre passate (WebGL2 non ha la miscela a due sorgenti) e un lavoratore per l'ordinamento [L] (`src/tre/splat.js`).

### Inferences
- Il collo di bottiglia attuale di stateyour (tre passate per canale, ordinamento in un lavoratore) è esattamente quello che PlayCanvas ha tolto con WebGPU. Con WebGPU si possono fare: ordinamento radix e selezione in compute; l'accumulo per canale in una sola passata, scrivendo in un buffer di storage o con più render target; la profondità ottica verso la sorgente su griglia, anch'essa in compute. Il guadagno atteso è circa 2× nei casi piccoli e molto di più sopra qualche milione di splat (numeri PlayCanvas).
- Lo **splat come cache visiva per indirizzo** è un'idea mia, non trovata in letteratura come pratica nei motori procedurali. Una vista costosa (una nebulosa, la schiuma di un tratto di costa) si calcola una volta, si condensa negli splat-materia già previsti dal formato `src/tre/FORMATO.md` e si salva su OPFS con la chiave dell'indirizzo. Alla visita successiva si mostra subito e si raffina. È compatibile con la regola 14, perché lo splat resta materia e non colore.
- Il rendering neurale **appreso** (GaussianCity, NeRF) va contro il determinismo per indirizzo e contro il «tutto dalla fisica»: va evitato per i contenuti. Al massimo potrebbe servire come post-processo estetico, che però sarebbe «pittura».

### Gaps
- Non è stato trovato nessun progetto che usi splat per **terreni planetari procedurali** in tempo reale, né numeri di Spark su splat generati da codice.
- Le pagine di WebSplatter e Visionary non sono state lette per intero: mancano i loro numeri.

---

## 5. Determinismo tra macchine: virgola mobile in WebGL, WebGPU, JS e WASM, e come gli altri garantiscono lo stesso mondo ovunque

### Takeaway
- **JS**: le quattro operazioni sono IEEE-754 esatte, ma `Math.sin`, `exp`, `log` e simili sono «approssimate dall'implementazione». Lo stesso eseguibile Electron su macchine diverse dà in pratica gli stessi bit (stesso V8), però un aggiornamento di Electron o un browser diverso possono cambiarli.
- **WASM**: risultati deterministici salvo i bit dei NaN, e solo se la libm è **dentro il modulo**.
- **WebGPU/WGSL**: **non** deterministico tra GPU. Arrotondamento non specificato, possibile riassociazione e fusione, `sin`/`cos` con errore assoluto fino a 2^−11, denormali azzerabili, NaN e infiniti «indeterminati».

Regola che ne segue: **tutto ciò che decide lo stato del mondo si calcola sulla CPU con interi o con una matematica fissata; la GPU produce solo aspetto**.

### Cited Findings
- **ECMAScript (Math.sin)**: «Return an implementation-approximated Number value representing the sine of ℝ(n)». La specifica raccomanda, senza imporlo, gli algoritmi di **fdlibm** [V] — [ECMA-262](https://tc39.es/ecma262/) (§ 21.3.2.30 e nota iniziale di § 21.3.2).
- **WGSL, § 15.7** (testo scaricato e cercato) [V] — [W3C WGSL](https://www.w3.org/TR/WGSL/):
  - «No rounding mode is specified. An implementation may round an intermediate result up or down.»
  - Precisione delle operazioni in f32: `+`, `−`, `*` arrotondati correttamente; `/` a 2,5 ULP; `sin(x)` e `cos(x)` con «Absolute error at most 2^−11» in [−π, π]; `exp` ed `exp2` a 3 + 2·|x| ULP; `log` con errore assoluto 2^−21 in [0,5; 2] e 3 ULP fuori; `inverseSqrt` a 2 ULP; `sqrt` come 1/inverseSqrt; `pow` come exp2(y·log2(x)); `atan` a 4096 ULP; `determinant` con «Infinite ULP».
  - «An implementation may reassociate operations. An implementation may fuse operations if the transformed expression is at least as accurate as the original»; `fma` può diventare una moltiplicazione e un'addizione separate.
  - Gli ingressi e le uscite delle operazioni possono essere azzerati se subnormali.
  - Con la «Finite Math Assumption», un'espressione a runtime che va in overflow, infinito o NaN dà un «indeterminate value»; `min` e `max` possono non dare il risultato atteso con i NaN.
  - Il segno di zero può essere ignorato.
- **WebAssembly**: il bit di segno di un NaN prodotto da un'operazione senza NaN in ingresso non è specificato (x86 dà 1, ARM 0). Wasmtime può canonicalizzare i NaN a un costo. Il gruppo di progettazione ha respinto un «fast-math» proprio per non rompere il determinismo, e «we expect floating-point numeric results to be fully deterministic» [S] — [webassembly.org, Nondeterminism](https://www.webassembly.org/docs/nondeterminism/); [WebAssembly design #1393](https://www.github.com/WebAssembly/design/issues/1393); [Wasmtime, esecuzione deterministica](https://docs.wasmtime.dev/examples-deterministic-wasm-execution.html).
- WASM non ha istruzioni trascendenti: un `sin` è deterministico **se la libm è compilata nel modulo**. Un pacchetto di terzi (`deterministic_math`, backend libm in Rust puro) dichiara risultati identici bit per bit tra browser e dispositivi; è un'affermazione del venditore [S] — [GitHub GbGr/deterministic_math](https://github.com/GbGr/deterministic_math).
- **Come fanno gli altri**: semi interi e indirizzi interi gerarchici (No Man's Sky con un seme a 64 bit [R]; Elite con ID di sistema deterministici [S] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)). Gaia Sky passa un `seed` al generatore di rumore ma non dichiara l'identità tra macchine [V] — [Sagristà](https://tonisagrista.com/blog/2024/supercharging-planetary-surfaces/). stateyour usa già un `hash(...parti)` FNV-1a a 32 bit con finalizzatore in `src/camera/cosmo.js` [L, dalla nota esistente](../Simulatori%20e%20modelli%20per%20stateyour/motori_procedurali_e_architettura.md).
- Ricordati [R]: V8 usa dal 2016 un port di fdlibm (`ieee754::sin` e simili), e anche SpiderMonkey è passato a fdlibm, quindi tra Chrome e Firefox recenti i risultati probabilmente coincidono, ma non è garantito. V8 non contrae `a*b+c` in FMA. WebGL/GLSL ES `highp` richiede solo una precisione minima, peggiore di WGSL per i trascendenti.

### Inferences
Pratica consigliata per stateyour (sintesi delle fonti, non una ricetta trovata già pronta):
1. **Stato del mondo** (quote, clima, composizioni, posizioni di stelle e pianeti): solo CPU, con hash interi (`Math.imul`, `>>> 0`) e coordinate intere o a virgola fissa per gli indirizzi. Per i trascendenti, se servono bit identici anche tra versioni di Electron, si usa una libm propria in JS (polinomi con sole `+`, `−`, `*`, `/`, che sono esatte in IEEE) o in WASM.
2. **Aspetto** (texture del terreno ad alta frequenza, normali, onde FFT, splat): GPU libera, perché una differenza di 2^−11 non si vede. Purché **nessun risultato della GPU torni indietro come seme o come stato**.
3. **Prova d'impronta**: un test che calcola gli hash di 100 indirizzi campione (galassia → molecola) e li confronta con valori salvati. Va eseguito in CI su Windows e Linux e a ogni aggiornamento di Electron.
4. Prima di usare un float come seme lo si **quantizza** (per esempio arrotondandolo a 2^−20), per non amplificare le differenze di un ULP.

### Gaps
- Non è stata trovata nessuna fonte che documenti differenze misurate di `Math.sin` tra V8, SpiderMonkey e JSC.
- Non è stato trovato come Elite e No Man's Sky gestiscano la virgola mobile tra PC e console: è probabile, ma non verificato, che usino interi o virgola fissa per la generazione.

---

## 6. Che cosa stateyour potrebbe adottare in concreto

### Takeaway
In ordine di effetto per sforzo, ognuna legata alle fonti sopra:
1. cache OPFS per indirizzo;
2. «genitore subito, figlio sfumato» invece dell'attesa;
3. un bersaglio e un indicatore di scala con autopilota logaritmico;
4. texture e oceano sulla GPU a blocchi 256²;
5. splat su WebGPU con ordinamento sulla GPU;
6. prova d'impronta deterministica.

WASM e il rendering neurale vengono dopo, o mai.

### Cited Findings
- Cache su disco: 3× sui carichi, 30× per oggetto rispetto alla rete; IndexedDB solo per i metadati [V] — [Lumafield](https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/).
- Saltare livelli e sfumare: −30/50 % sul tempo di carico [V] — [Cesium](https://cesium.com/blog/2017/05/05/skipping-levels-of-detail/). LOD basso subito, poi raffinamento entro un budget [V] — [PlayCanvas](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins).
- Transizioni a incastro, velocità della camera legata alla scala, contrasto sul fuoco, «la prossima regione» segnalata [V] — [ScaleTrotter](https://ar5iv.labs.arxiv.org/html/1907.12352).
- Blocchi 256² sulla GPU, poca geometria [V] — [80.lv SFS2](https://80.lv/articles/this-full-scale-planet-rendering-system-is-so-efficient-it-runs-on-mobile); biomi e mappe in shader di frammento [V] — [Gaia Sky](https://tonisagrista.com/blog/2024/supercharging-planetary-surfaces/); FFT 256² in compute [V] — [WebTide](https://barthpaleologue.github.io/Blog/posts/ocean-simulation-webgpu).
- Splat su WebGPU fino a 5,7× [V] — [PlayCanvas](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins).
- I limiti di precisione di WGSL impongono che la GPU produca solo aspetto [V] — [WGSL § 15.7](https://www.w3.org/TR/WGSL/).

### Inferences
Piano concreto (proposte mie, ognuna da misurare prima e dopo):

1. **Misurare prima di riscrivere.** Registrare un profilo di DevTools in Electron durante l'arrivo al mare: quanto tempo va nella catena di dipendenze, quanto nel `postMessage`, quanto nella compilazione degli shader. Di solito la compilazione degli shader WebGL costa centinaia di ms per programma: `KHR_parallel_shader_compile` [R] permette di non bloccare.
2. **Cache dei nodi per indirizzo su OPFS**:
   - chiave = `indirizzo + versione del modello + versione dei parametri`, valore = `ArrayBuffer` (campi, mosaici, splat);
   - metadati e LRU in IndexedDB;
   - lettura e scrittura in un lavoratore con `createSyncAccessHandle`;
   - così un secondo arrivo al mare dovrebbe scendere da decine di secondi al tempo di lettura del file.
3. **Un genitore sempre pronto.** Non attendere il figlio: mostrare la versione grossa (per esempio il colore del mare dal pianeta, già calcolato), poi sfumare in 300–500 ms verso il dettaglio quando arriva, come Cesium e ScaleTrotter. In ogni lavoratore, coda con priorità: prima ciò che sta nel cono di vista e lungo la traiettoria dell'autopilota, poi il resto; si cancella ciò che esce dal cono.
4. **Prefetch lungo la traiettoria.** Quando l'utente sceglie un bersaglio, si mettono in coda gli indirizzi dei livelli che si attraverseranno, con priorità decrescente con la distanza in scala, e si calcolano mentre la camera vola. Il viaggio stesso nasconde il tempo di calcolo, come il volo verso il pianeta nei giochi.
5. **Navigazione** (§2):
   - percorso a briciole cliccabile dell'indirizzo;
   - indicatore di scala in metri, logaritmico;
   - bersaglio del prossimo livello evidenziato;
   - autopilota a velocità logaritmica costante che rallenta vicino;
   - un pulsante «torna su»;
   - un tour d'avvio fino al mare su un indirizzo scelto bene, che è anche il caso di prova delle prestazioni.
6. **WebGPU dove l'occhio conta e il mondo non dipende**:
   - texture del terreno e normali a blocchi 256²;
   - oceano FFT 256² (si possono riusare lo schema delle passate di WebTide e lo spettro già calcolato da `mare.js`);
   - splat con selezione, proiezione e ordinamento radix in compute e accumulo in una sola passata;
   - percorso WebGL2 attuale come riserva (circa 15 % degli utenti senza WebGPU, ma in Electron 45 la disponibilità dipende soprattutto dai driver [R]).
7. **Rendering in un lavoratore.** Valutare `transferControlToOffscreen` per la tela 3D, così l'interfaccia resta reattiva anche durante calcoli pesanti sul thread di rendering [R].
8. **SharedArrayBuffer solo se il profilo lo chiede.** Prima passare a buffer trasferibili. Se serve una memoria condivisa tra lavoratori, aggiungere COOP/COEP con un protocollo personalizzato in `electron/main.cjs` [R].
9. **Determinismo**:
   - una prova d'impronta su indirizzi campione in CI (Windows e Linux) e a ogni aggiornamento di Electron;
   - nessun risultato della GPU nello stato;
   - semi quantizzati;
   - eventuale libm propria per i trascendenti che decidono lo stato.
10. **Direzione artistica senza «pittura»**:
    - esposizione adattiva e curva di tono dell'occhio, curate;
    - inquadrature d'arrivo predefinite per ogni tipo di livello (il bersaglio al terzo dello schermo, l'orizzonte in basso);
    - suono generato dalle grandezze già calcolate;
    - tutto questo agisce sull'osservatore, non sulla materia, quindi è coerente con la regola 14 di `INTRECCIO.md`.
11. **Da leggere prima di riscrivere la superficie**: il codice di Cosmos Journeyer e WebTide (Babylon.js + WebGPU), il ramo CBT di World42, l'articolo «False Earth» di Codrops (non letto, 403).
12. **Da non fare adesso**: riscrivere tutto in WASM (guadagni da 0,56× a 3× secondo browser e carico); rendering neurale appreso (non deterministico, non fisico).

### Gaps
- Nessuna delle stime di guadagno sopra è misurata su stateyour: vanno validate con un profilo prima e dopo ogni passo.
- La disponibilità effettiva di WebGPU in Electron 45 sulle schede degli utenti (Windows, driver vecchi) non è stata verificata.
