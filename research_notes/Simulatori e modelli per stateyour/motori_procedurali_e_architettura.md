# Motori di universi/mondi procedurali e tecniche di architettura per mondi enormi calcolati a richiesta (stato: novembre 2026)

**Come leggere le marche di affidabilità** (valgono per tutto il documento):

- **[V]** = verificato in questa sessione aprendo la fonte indicata (pagina, file LICENSE, README, PDF).
- **[S]** = preso dal riassunto dei risultati di ricerca: la fonte è indicata ma non letta per intero, oppure è una fonte secondaria.
- **[R]** = ricordo mio, **non verificato** in questa sessione: va controllato prima di citarlo come fatto.

Le licenze marcate [V] sono state lette direttamente dal file di licenza nel repository (via `raw.githubusercontent.com`). L'API di GitHub non era raggiungibile in sessione, quindi date dell'ultimo commit e numero di stelle non sono stati verificati salvo dove detto.

Nota di contesto: stateyour ha già in `src/camera/cosmo.js` un `hash(...parti)` a 32 bit (FNV-1a su stringa + finalizzatore) e gli universi paralleli scritti come `n#{"evento":ramo}` con `semeEvento(nome, n, ...resto)` [V, file locale]. Le note qui sotto sono orientate a quel disegno.

---

## 1. Quali motori generano un universo intero (o grandi parti) in modo procedurale, e come? Quali sono aperti?

### Takeaway
Nessun motore esistente fa «tutto emerge dalla fisica»: i più ampi (SpaceEngine, Elite Dangerous, No Man's Sky) sono **chiusi** e combinano cataloghi reali + generazione deterministica per indirizzo (seme per nodo di octree o identificatore a 64 bit) con regole statistiche plausibili; quelli **aperti** (Celestia, Gaia Sky, OpenSpace, Orbiter, Principia) sono soprattutto visualizzatori di dati o integratori di orbite. Da riusare ci sono le **idee di architettura** (octree per luminosità con seme per nodo, ID a 64 bit, simulazione «dall'alto in basso» con i dati del genitore sempre disponibili, coordinate a 128 bit) e alcuni pezzi di codice a licenza permissiva (MIT/Apache).

### Cited Findings

#### Tabella riassuntiva (licenze)

| Motore | Scale | Codice | Licenza | Marca |
|---|---|---|---|---|
| SpaceEngine | universo → superficie (~10 m, poi tessiture) | chiuso (C++/GLSL, shader cifrati) | proprietaria, a pagamento da 0.990 | [V] [Wikipedia](https://en.wikipedia.org/wiki/SpaceEngine) |
| Celestia | sistema solare → galassie (catalogo) | aperto, C++ | GPL-2.0 | [V] [COPYING](https://raw.githubusercontent.com/CelestiaProject/Celestia/master/COPYING) |
| Universe Sandbox | sistemi planetari, collisioni, clima | chiuso (Unity) | commerciale | [V] [FAQ](https://universesandbox.com/faq) |
| Outerra | un pianeta (Terra) spazio → cm | chiuso | proprietaria [R] | [S] [moddb](https://www.moddb.com/engines/outerra/news/outerra-engine-progress) |
| No Man's Sky | galassie → pianeti a voxel | chiuso | commerciale | [V] [GDC Vault](https://gdcvault.com/play/1024265/Continuous-World-Generation-in-No) |
| Elite Dangerous (Stellar Forge) | Via Lattea → superficie | chiuso | commerciale | [V] [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/) |
| Star Citizen (Genesis / Planet Tech v5) | sistemi stellari → biomi | chiuso | commerciale | [V] [wiki](https://starcitizen.tools/Genesis_(Star_Engine)) |
| Space Engineers 1 | pianeti a voxel | sorgente consultabile ma sotto EULA, archiviato | **non** open source | [V] [README](https://raw.githubusercontent.com/KeenSoftwareHouse/SpaceEngineers/master/README.md) |
| Principia (mod di KSP) | N corpi, sistema solare | aperto, C++ | MIT (© 2014 Robin Leroy) | [V] [LICENSE](https://raw.githubusercontent.com/mockingbirdnest/Principia/master/LICENSE.txt) |
| Orbiter | volo spaziale, sistema solare | aperto | MIT (© 2000-2026 Martin Schweiger) | [V] [LICENSE](https://raw.githubusercontent.com/orbitersim/orbiter/master/LICENSE) |
| Gaia Sky | catalogo Gaia, universo | aperto, Java | MPL-2.0 | [V] [LICENSE](https://raw.githubusercontent.com/langurmonkey/gaiasky/master/LICENSE.md) |
| OpenSpace | sistema solare → universo osservabile | aperto, C++ | MIT (© 2014-2026) | [V] [LICENSE](https://raw.githubusercontent.com/OpenSpace/OpenSpace/master/LICENSE.md) |
| Mitaka (NAOJ 4D2U) | Terra → bordo dell'universo noto | gratuito per Windows; licenza del sorgente non trovata | sconosciuta | [V] [sito](https://4d2u.nao.ac.jp/html/program/mitaka/index_E.html) |
| Cosmographia (NAIF) | sistema solare, missioni | NAIF lo chiama «open source» | licenza esatta non verificata | [V] [NAIF](https://naif.jpl.nasa.gov/naif/cosmographia.html) |
| Galaxy Engine (Narcis Calin) | gravità 2D a N corpi, fluidi | aperto, C++/raylib | MIT (© 2025) | [V] [LICENSE](https://raw.githubusercontent.com/NarcisCalin/Galaxy-Engine/master/LICENSE) |
| CesiumJS | globo virtuale (Terra) in JavaScript | aperto, JS | Apache-2.0 | [V] [LICENSE](https://raw.githubusercontent.com/CesiumGS/cesium/master/LICENSE.md) |
| spacekit.js | visualizzazione orbite in JS | aperto, JS | MIT (© 2019 Ian Webster) | [V] [LICENSE](https://raw.githubusercontent.com/typpo/spacekit/master/LICENSE) |

#### SpaceEngine (catalogo + procedurale)
- Sviluppato da Vladimir Romanyuk; dal febbraio 2022 lo sviluppo è della Cosmographic Software (Connecticut). Programma in C++ con shader GLSL su OpenGL; shader cifrati dalla 0.990. Ultima versione stabile indicata: 0.991.49.2095 (8 dicembre 2025). Proprietario; gratuito fino alla 0.9.8.0E, a pagamento su Steam dal giugno 2019. [V] — [Wikipedia](https://en.wikipedia.org/wiki/SpaceEngine)
- Cataloghi reali: Hipparcos (stelle), NGC e IC (galassie), esopianeti noti, ammassi, nebulose; oltre 130.000 oggetti reali. Universo = cubo di oltre 10 miliardi di parsec di lato, centrato circa sul baricentro del Sistema Solare. Mancano: assorbimento interstellare, dilatazione del tempo, moti propri delle stelle. [V] — [Wikipedia](https://en.wikipedia.org/wiki/SpaceEngine)
- Stelle procedurali (post del 1 febbraio 2010): **octree gerarchico a 10 livelli ordinato per luminosità** — «nodes of level 0 contains the brightest stars», il livello 9 le nane rosse deboli; la densità per nodo segue una funzione di luminosità come quella dei dintorni solari. [V] — [SpaceEngine blog](https://spaceengine.org/news/blog100201/)
- Determinismo: a ogni nodo «a unique seed is assigned to it, so the same stars are always created at the same places». Il nome di una stella procedurale è l'indirizzo: indice della galassia, livello dell'albero, numero del nodo, indice della stella nel nodo. [V] — [SpaceEngine blog](https://spaceengine.org/news/blog100201/)
- Forma della galassia: sottosistemi (spirale, disco, bulge, alone), densità che cala esponenzialmente dal centro e dal piano del disco, tipi stellari distribuiti in modo non uniforme (giganti blu giovani nei bracci). [V] — [SpaceEngine blog](https://spaceengine.org/news/blog100201/)
- Calcolo a richiesta: i nodi si generano e si scartano mentre la camera si muove; regge circa 1 kpc/s senza buchi; oltre, riduce la profondità di ricorsione (saltano i nodi profondi, la densità «cala» a vista). Circa 100 VBO e ~300.000 stelle per fotogramma. [V] — [SpaceEngine blog](https://spaceengine.org/news/blog100201/)
- Pianeti: sei quadtree, uno per faccia di un cubo; tessiture 256×256 e griglia 33×33 vertici per nodo; livello massimo utile 12 per un pianeta come la Terra (~9,5 m per pixel all'equatore), artefatti al 13. [S] — post del blog elencati in ricerca: [First procedural terrain](https://spaceengine.org/news/blog100531/), [Terrain engine upgrade #3](https://spaceengine.org/news/blog171120/), [Terrain 2.0](https://spaceengine.org/news/blog190328/)
- Limite di precisione dichiarato: «single-precision real numbers used in shaders do not allow generating details less than about ten meters»; sotto i 10 m non c'è più geometria generata ma due strati di **tessiture di dettaglio** miscelate nello shader («down to a few millimeters»), visibili solo entro ~100 m. È un **cambio di rappresentazione**, non un prolungamento dello stesso campo. [V] — [Terrain engine upgrade #1, 16 ott 2017](https://spaceengine.org/news/blog171016/)

#### Celestia
- GPL-2.0. [V] — [COPYING](https://raw.githubusercontent.com/CelestiaProject/Celestia/master/COPYING)
- Coordinate: `UniversalCoord` è «a high-precision fixed point coordinate» basata su `R128` (128 bit); gli scarti si esprimono in micro-anni-luce e la differenza tra due coordinate si calcola ad alta precisione e solo dopo si converte in `double`. [V] — [univcoord.h](https://raw.githubusercontent.com/CelestiaProject/Celestia/master/src/celengine/univcoord.h)
- Formato storico: 64.64 a virgola fissa (intestazione di `bigfix.h`, versione 1.6.1); motivazione degli sviluppatori (2005): né float a 32 bit né a 64 bastano per posizioni in tutto l'universo. [S] — [bigfix.h](https://grok.dragonflybsd.org/source/xref/dports/astro/celestia-gtk/celestia-1.6.1/src/celutil/bigfix.h), [forum Celestia](https://celestiaproject.space/forum/viewtopic.php?p=64162)
- Versione nel browser: celestia.mobi offre «a lite version of Celestia in your browser»; nella stessa pagina è elencata Celestia 1.7.0. Non verificato se sia WebAssembly. [S] — [celestia.mobi/download](https://celestia.mobi/download)

#### Universe Sandbox (che fisica simula davvero)
- «Gravity in Universe Sandbox is simulated as an n-body problem»; la gravità agisce istantaneamente; «the physics in Universe Sandbox is currently only Newtonian». [V] — [FAQ](https://universesandbox.com/faq)
- Simula anche «climate, temperature, stellar evolution, and material composition» e collisioni con crateri, onde d'urto, frammenti; la formazione dei pianeti da nubi di gas **non** è simulata (fluidodinamica solo auspicata). Costruito in Unity. [V] — [FAQ](https://universesandbox.com/faq)
- Passo di tempo: rallenta da solo per mantenere l'accuratezza; ammettono che «many aspects are kept relatively 'simple' in order for it to run in real time». [V] — [FAQ](https://universesandbox.com/faq)
- N corpi a forza bruta (ogni corpo con ogni altro); secondo lo sviluppatore fisico «brute force performs better in general» per il loro numero di corpi; Barnes-Hut da rivalutare per le galassie. Tolleranza d'errore per passo e tetto all'errore totale. Idea (solo proposta, 2016): ad alte velocità di tempo ridurre il sistema a una serie di problemi a due corpi (Luna-Terra, Terra-Sole) risolvibili con un solo calcolo. [V] — [blog, 26 feb 2016](https://universesandbox.com/blog/?p=1704)
- Integratori selezionabili secondo il wiki dei fan: Eulero esplicito/semi-implicito, Velocity Verlet, RK2, Forest-Ruth, PEFRL (predefinito). Non confermato dagli sviluppatori. [S] — [wiki dei fan](https://universesandbox.fandom.com/wiki/Sim_Settings_Menu)

#### Outerra
- Usa dati reali di elevazione (circa 150 m per tutta la Terra nel 2009) e genera tutto il resto proceduralmente. La suddivisione bicubica dei riquadri dava colline troppo lisce; aggiungere rumore wavelet omogeneo aiutava ma senza aspetto di erosione; soluzione: **scalare l'ampiezza del rumore con la curvatura positiva e la quota**. [S] — [blog Outerra, feb 2009](https://outerra.blogspot.com/2009/02)
- Raffinamento frattale fino al centimetro, parametrizzabile da quota e classe di terreno; calcolo sulla GPU. [S] — [moddb](https://www.moddb.com/engines/outerra/news/outerra-engine-progress)
- Depth buffer logaritmico (formule in §3). [V] — [blog Outerra, nov 2012](https://outerra.blogspot.com/2012/11/maximizing-depth-buffer-range-and.html)

#### No Man's Sky
- Talk GDC 2017 di Innes McKendrick, «Continuous World Generation in 'No Man's Sky'»: la catena va da «voxel-based world generation» a poligonizzazione, tessitura, popolamento e simulazione, il tutto in continuo in tempo reale. Solo la descrizione della sessione è stata letta; niente slide. [V] — [GDC Vault](https://gdcvault.com/play/1024265/Continuous-World-Generation-in-No)
- Sean Murray, GDC 2017 «Building Worlds Using Math(s)»: generare terreni realistici e alieni senza intervento artistico. Fonti secondarie dicono che tratta il *domain warping* (campionare un rumore in coordinate spostate da un altro rumore). [S] — [GDC Vault](https://gdcvault.com/play/1024514/Building-Worlds-Using), [dev.to](https://dev.to/dubeykartikay/how-no-mans-sky-creates-18-quintillion-planets-with-just-math-3fgf)
- L'indirizzo è il mondo: un indirizzo-portale è di 12 cifre esadecimali (16 glifi = cifre 0–F) che codificano indice del pianeta, indice del sistema e coordinate Y, Z, X del settore. La disposizione esatta dei campi viene dalla comunità ed è contestata. [S] — [wiki](https://breezewiki.discard.no/nomanssky/wiki/Portal), [discussione Steam](https://steamcommunity.com/app/275850/discussions/0/3801650561772550719)

#### Elite Dangerous — Stellar Forge (ciò che è pubblicato)
Fonte: intervista a Doc Ross (Frontier), 80.lv, aprile 2018. Tutto [V] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)
- Ingressi a scala galattica: funzioni di distribuzione di materia e di età; la massa della Via Lattea «informs us of how much "stuff" is in a volume of space». Una mappa dall'alto (una delle poche risorse non programmatiche) dà bracci e bulge.
- Stelle reali da Hipparcos e Gliese per «seminare» la galassia generata.
- **«Everything is simulated top-down, where parent data is always available for generating the sub-objects.»**
- **Un intero a 64 bit** codifica coordinate x, y, z del settore, strato del settore, ID del sistema e ID del corpo; i settori formano un octree a otto strati.
- Sistema: prima tipo ed età della stella primaria; il materiale rimasto forma un disco protoplanetario con distribuzioni di elementi che si accumulano per epoche simulate; per protopianeta si seguono vento stellare che strappa materia, eventi catastrofici, blocco mareale, riscaldamento gravitazionale.
- Pianeta: classificazione da massa, composizione, parametri vulcanici, differenza di temperatura crosta/mantello/nucleo, gas intrappolati, riscaldamento mareale e radiativo; questi valori fissano intervalli plausibili di attività tettonica e vulcanica, che poi influenzano bacini, montagne, fratture, crateri, ghiaccio.
- Superficie: cubo le cui facce sono quadtree; i riquadri vengono «sferificati» e poi si applica rumore sulla GPU, il cui ingresso è la posizione del punto + l'ID del pianeta + i dati astronomici.
- Precisione: serve il millimetro su coordinate di decine di miliardi di millimetri; hanno scritto librerie in doppia precisione e in *double-float* emulato (due float a 32 bit) per la GPU.
- Altre fonti: ~160.000 sistemi da catalogo, il resto da algoritmi; processo iterativo per epoche secondo l'età del sistema. [S] — [space.com](https://www.space.com/31366-elite-dangerous-stellar-forge-interview.html), [PC Gamer](https://www.pcgamer.com/the-mind-bending-science-behind-the-planets-of-elite-dangerous)

#### Star Citizen
- Genesis è «a collection of technological systems and processes within Star Engine that create plausible planetary biomes». Planet Tech v4 usava mappe di temperatura e umidità per tessiture e distribuzione degli oggetti; con Genesis / Planet Tech v5 se ne aggiungono altre «including Geology, Soil Type and Soil Depth». [V] — [Star Citizen Wiki](https://starcitizen.tools/Genesis_(Star_Engine))
- Stato 2026: Alpha 4.11 con Genesis rinviata al quarto trimestre 2026 secondo una fonte secondaria. [S] — [mmoexp](https://www.mmoexp.com/News/star-citizen-alpha-4-11-delayed-to-q4-2026-release-date-genesis-planet-tech-v5-nyx-staritect-and-new-features.html)
- Posizioni a 64 bit: conversione «about positional space», circa otto mesi; ultimo passo rendere il disegno relativo alla camera; fisica rifatta, moduli di IA rimasti a 32 bit. [S] — [GamersNexus (Roberts)](https://gamersnexus.net/gg/2019-star-citizen-multi-crew-interview-chris-roberts), [GamersNexus (Tracy)](https://gamersnexus.net/gg/2622-star-citizen-sean-tracy-64bit-engine-tech-edge-blending)

#### Space Engineers
- Il sorgente di SE1 è su GitHub ma come «ARCHIVED VERSION», sotto EULA, senza risorse grafiche, e serve possedere il gioco: non è software libero. [V] — [README](https://raw.githubusercontent.com/KeenSoftwareHouse/SpaceEngineers/master/README.md)
- Space Engineers 2 (VRAGE3): pianeti interamente volumetrici e distruttibili, con strapiombi e canyon; confini dei biomi da quota, pendenza, umidità/temperatura. [S] — [diario di Marek Rosa, mag 2025](https://blog.marekrosa.org/2025/05/mareks-dev-diary-may-29-2025.html)

#### Principia, Orbiter
- Principia: «implements N-body and extended body gravitation» al posto delle sfere d'influenza di KSP; esce a ogni luna nuova (versione «Lie», novembre). MIT. [V] — [README](https://raw.githubusercontent.com/mockingbirdnest/Principia/master/README.md), [LICENSE](https://raw.githubusercontent.com/mockingbirdnest/Principia/master/LICENSE.txt)
- Integratori: Runge-Kutta-Nyström simplettici e un RKN esplicito a passo variabile nella cartella `integrators`. [S] — [forum KSP](https://forum.kerbalspaceprogram.com/topic/162200-wip181-191-1101-1110%E2%80%932-1122%E2%80%935-principia%E2%80%94releases-every-new-moon%E2%80%94n-body-and-extended-body-gravitation/page/23)
- Orbiter: licenza MIT nel repository `orbitersim/orbiter`. [V] — [LICENSE](https://raw.githubusercontent.com/orbitersim/orbiter/master/LICENSE)

#### Gaia Sky, OpenSpace, Mitaka, Cosmographia, 100,000 Stars
- Gaia Sky: MPL-2.0. *Floating camera* («we always keep the origin at the camera») e aritmetica a precisione arbitraria con numero di cifre configurabile, usata solo per gli oggetti vicini. [V] — [LICENSE](https://raw.githubusercontent.com/langurmonkey/gaiasky/master/LICENSE.md), [note 3.1](https://tonisagrista.com/blog/2021/whats-new-gaiasky-31x/)
- Gaia Sky: octree di livello di dettaglio sul catalogo, soglia = angolo solido minimo dell'ottante visto dalla camera; formato binario proprio. [S] — [documentazione LOD](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/3.5.3/LOD-catalogs.html), [articolo 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- Gaia Sky, generazione procedurale di galassie (anteprima, 21 nov 2025): compute shader; cinque canali fisici (stelle, regioni H II, gas, polvere, bulge); dieci distribuzioni (sfera, disco, spirale, spirale logaritmica, barra, ellissoide…); spirali «based on density wave theory»; ripiego su CPU per chi non ha OpenGL 4.3. [V] — [gaiasky.space](https://gaiasky.space/news/2025/galaxy-generation/)
- OpenSpace: MIT. Il «Dynamic Scene Graph» (Axelsson et al., EuroVis 2017) attacca la camera all'oggetto d'interesse più vicino, che diventa la nuova origine; funziona senza piani vicino/lontano con depth buffer in virgola mobile; da Marte alla Via Lattea nella stessa scena. [V licenza] [S articolo] — [LICENSE](https://raw.githubusercontent.com/OpenSpace/OpenSpace/master/LICENSE.md), [articolo](https://alexanderbock.github.io/papers/eurovis17-axelsson-dynamic_scene_graph.pdf)
- Mitaka: software del progetto 4D2U del NAOJ per visualizzare l'universo noto «from the Earth to the edges of the known Universe» con dati osservativi; nato per il teatro a più schermi, gira su un PC Windows. [V] — [sito Mitaka](https://4d2u.nao.ac.jp/html/program/mitaka/index_E.html)
- Cosmographia: la NAIF offre una versione arricchita con SPICE dello «open source visualization tool named Cosmographia» (4.2, dicembre 2022); cataloghi in JSON. [V] — [NAIF](https://naif.jpl.nasa.gov/naif/cosmographia.html)
- 100,000 Stars: esperimento per Chrome che mostra 119.617 stelle vicine. Sorgente e licenza non trovati. [S] — [scheda](https://chromeboard.com/extension/100000-stars-odkpogjemoijmdgemngpdohpcclgegjg)
- Galaxy Engine (Narcis Calin): simulatore interattivo di gravità 2D, a N corpi, con raylib; aggiornamenti 2025 su materia oscura, collisioni, fluidi SPH, solidi; MIT. [V licenza] [S descrizione] — [LICENSE](https://raw.githubusercontent.com/NarcisCalin/Galaxy-Engine/master/LICENSE), [itch.io](https://narciscalin.itch.io/galaxy-engine)

### Inferences
- **Schema comune dei tre grandi chiusi**: (1) cataloghi reali dove esistono, (2) funzione di densità continua a scala galattica, (3) octree spaziale i cui nodi hanno un seme proprio, (4) dentro il nodo regole statistiche, (5) cambio di rappresentazione a ogni salto di scala (sprite/particelle → octree di stelle → quadtree su cubo → tessiture di dettaglio). Nessuno prolunga *lo stesso campo fisico* attraverso i salti: SpaceEngine lo dichiara a ~10 m, dove passa a tessiture.
- **Stellar Forge è il più vicino a stateyour come filosofia** (dall'alto in basso, il genitore sempre disponibile, simulazione per epoche, ID a 64 bit), ma le «leggi» sono intervalli plausibili, non equazioni integrate, e il codice non è pubblico.
- **Riusabile in JavaScript leggero**: l'octree per luminosità con seme per nodo (SpaceEngine); l'ID che è l'indirizzo (Elite, No Man's Sky); l'idea «due corpi quando il sistema è stabile, N corpi quando serve» (Universe Sandbox); i coefficienti degli integratori simplettici di Principia (MIT); la differenza di coordinate ad alta precisione *prima* di passare a float (Celestia, GPL: riusare l'idea, non il codice, se stateyour non è GPL).
- **Attenzione alle licenze**: Celestia è GPL-2.0, Gaia Sky MPL-2.0 (copyleft per file); MIT/Apache (OpenSpace, Orbiter, Principia, Cesium, spacekit, Galaxy Engine) si possono copiare con l'avviso di copyright.

### Gaps
- **Solar System Scope**: nessuna fonte tecnica trovata (tecnologia, licenza). Non verificato.
- **«celestia.js»**: non ho trovato un progetto con questo nome; esiste solo la versione «lite» nel browser su celestia.mobi (tecnologia non verificata).
- **AMNH Digital Universe**: la pagina ufficiale ha risposto con un CAPTCHA; termini di licenza dei dati non verificati.
- **Mitaka**: licenza del sorgente non trovata; la pagina inglese letta ha notizie ferme al 2019.
- **100,000 Stars**: nessun repository ufficiale trovato; licenza ignota.
- **Outerra, No Man's Sky, Universe Sandbox**: non ho trovato un documento di licenza; li tratto come proprietari perché distribuiti commercialmente (inferenza).
- **No Man's Sky**: non ho letto slide o trascrizione dei due talk GDC; il dettaglio dell'algoritmo a voxel (risoluzione, tipo di poligonizzazione, schema dei semi) resta non verificato. Il numero «2^64 pianeti» è [R].
- **SpaceEngine**: nessun post trovato su come gestisce le coordinate su scala cosmica (origine mobile? gerarchia di sistemi?); la generazione dei pianeti (classi, composizione) non è stata letta.
- **Star Citizen**: nessuna fonte tecnica primaria su quadtree planetario e «zone system».
- **Orbiter**: verificata solo la licenza, non il modello fisico.

---

## 2. Generatori di mondi con profondità di simulazione: quali tecniche usano e che cosa è riusabile?

### Takeaway
I generatori «profondi» seguono quasi tutti la stessa catena — quota → temperatura (latitudine + quota) → venti e pioggia con ombra pluviometrica → fiumi per accumulo di flusso → erosione → biomi — con placche tettoniche o simulate (Tectonics.js, WorldEngine) o disegnate per riempimento a macchia (Red Blob, Experilous). In JavaScript e con licenza permissiva ci sono Azgaar (MIT), Red Blob Games (Apache-2.0) e Tectonics.js (CC-BY 4.0): sono le fonti più dirette da cui prendere algoritmi.

### Cited Findings

#### Tabella riassuntiva (licenze)

| Progetto | Linguaggio | Licenza | Marca |
|---|---|---|---|
| Azgaar Fantasy Map Generator | JavaScript | MIT (© 2017-2024 Max Haniyeu) | [V] [LICENSE](https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/LICENSE) |
| Red Blob: mapgen4, mapgen2, 1843-planet-generation, dual-mesh | JavaScript/TypeScript | Apache-2.0 | [V] [mapgen4](https://raw.githubusercontent.com/redblobgames/mapgen4/master/LICENSE), [1843](https://raw.githubusercontent.com/redblobgames/1843-planet-generation/master/LICENSE) |
| Tectonics.js | JavaScript | CC-BY 4.0 nel repository | [V] [LICENSE.txt](https://raw.githubusercontent.com/davidson16807/tectonics.js/master/LICENSE.txt) |
| WorldEngine (ex «Lands») | Python | MIT (© 2013-2014 Tomassetti, Curtis) | [V] [LICENSE](https://raw.githubusercontent.com/Mindwerks/worldengine/master/LICENSE.txt) |
| Undiscovered Worlds (e Classic) | C++ | GPL-3.0 | [V] [LICENSE](https://raw.githubusercontent.com/JonathanCRH/Undiscovered_Worlds/master/LICENSE) |
| mewo2/terrain (Martin O'Leary) | JavaScript | MIT (© 2016) | [V] [LICENSE](https://raw.githubusercontent.com/mewo2/terrain/master/LICENSE.md) |
| SebLague/Hydraulic-Erosion | C# | MIT (© 2019) | [V] [LICENSE](https://raw.githubusercontent.com/SebLague/Hydraulic-Erosion/master/LICENSE) |
| dandrino/terrain-erosion-3-ways | Python | MIT (© 2018) | [V] [LICENSE](https://raw.githubusercontent.com/dandrino/terrain-erosion-3-ways/master/LICENSE.txt) |
| fastscape | Python/Fortran | BSD-3 | [V] [LICENSE](https://raw.githubusercontent.com/fastscape-lem/fastscape/master/LICENSE) |
| Landlab | Python | MIT | [V] [LICENSE](https://raw.githubusercontent.com/landlab/landlab/master/LICENSE.md) |
| Delaunator (Mapbox) | JavaScript | ISC | [V] [LICENSE](https://raw.githubusercontent.com/mapbox/delaunator/master/LICENSE) |
| d3-geo-voronoi | JavaScript | ISC (testo «Permission to use, copy, modify…») | [V] [LICENSE](https://raw.githubusercontent.com/Fil/d3-geo-voronoi/master/LICENSE) |
| simplex-noise.js | JavaScript | MIT | [V] [LICENSE](https://raw.githubusercontent.com/jwagner/simplex-noise.js/master/LICENSE) |
| FastNoiseLite | molti, anche JS | MIT | [V] [LICENSE](https://raw.githubusercontent.com/Auburn/FastNoiseLite/master/LICENSE) |
| Dwarf Fortress, Songs of Syx, Gaea, World Machine | — | chiusi/commerciali (licenza non letta) | [R] |

#### Dwarf Fortress (generazione del mondo)
Tutto [V] — [wiki DF, World generation](https://dwarffortresswiki.org/index.php/World_generation)
- Griglie: mondi da 17×17 a 257×257 riquadri di regione (osservazione mia, non del wiki: 2^n+1 è la misura tipica dello spostamento del punto medio); ogni riquadro «corresponds to 16×16 local area blocks of 48×48 tiles each».
- Passo 1: i campi base (quota, pioggia, temperatura, drenaggio, vulcanismo, selvatichezza) «are seeded along a grid» e riempiti in modo frattale; i poli fissano la temperatura.
- Passo 2: vegetazione come primo campo derivato; vulcani dal campo di vulcanismo.
- Passo 3, erosione: «Many fake rivers flow downward from these points, carving channels in the elevation field»; i laghi crescono lungo i fiumi.
- Passo 4: **solo dopo che le quote sono definitive** «it makes adjustments to rainfall based on rain shadows and orographic precipitation».
- Passo 5: temperature ricalcolate da quota, pioggia e smorzamento delle foreste; salinità.
- Passo 6: strati geologici e sotterranei. Passo 7: **verifica e rigetto** — il mondo che si allontana troppo dai parametri richiesti viene scartato e rigenerato.
- Storia: «a giant zero-player strategy game going on with somewhat loose turn rules and bad AI»; i semi usati finiscono nel registro.

#### Songs of Syx
- La mappa del mondo è divisa in regioni e genera catene montuose (devlog giugno 2020). [S] — [devlog](https://songsofsyx.itch.io/songs-of-syx/devlog/157425/the-world-and-beyond)
- **Coerenza genitore→figlio**: «City map generation is done using a 3x3 tile chunk from the world-map as reference. Generation is thus semi-random.» [S] — [devlog](https://songsofsyx.itch.io/songs-of-syx/devlog/102137/technology-awe-and-localization)

#### WorldEngine / Lands
- «Worlds are generated using plate simulations, erosion, rain shadows, Holdridge life zones model and plenty of other phenomenons.» Versione stabile 0.20.0; Python 3.9–3.14; salva in protobuf o hdf5. [V] — [README](https://raw.githubusercontent.com/Mindwerks/worldengine/master/README.md)

#### Azgaar's Fantasy Map Generator
- Catena (da copie del wiki): i fiumi scorrono secondo la quota, i laghi si formano nelle depressioni, la «climate simulation» calcola temperatura e precipitazione, i biomi vengono da una matrice temperatura × precipitazione. [S] — [copia del wiki](https://git.korz.dev/backups/Fantasy-Map-Generator/src/commit/05c53d276aaa1153f8d61c6ab515f79fccd6744f/wiki/Generation-Process.md)
- Fiumi: precipitazione → flusso accumulato → fiume dove il flusso supera una soglia (documento di terzi, non dell'autore). [S] — [nota di terzi](https://glama.ai/mcp/servers/@Mnehmos/rpg-mcp/blob/2d9ddb900bd315f89fb320fdc4bedf8bfdecead6/reference/AZGAAR_SNAPSHOT.md)

#### Red Blob Games
Pianeta su sfera, 22 ottobre 2018 — tutto [V] — [1843 planet generation](https://www.redblobgames.com/x/1843-planet-generation/)
- Punti distribuiti in modo uniforme sulla sfera + scarto casuale; regioni di Voronoi come unità di base.
- Placche: da 10 a 50 regioni-seme scelte a caso, poi riempimento a macchia che espande un **elemento a caso della coda** (confini meno regolari della ricerca in ampiezza).
- Moto: un vettore di direzione casuale per placca («simpler than what other people did»). Ai confini si confronta il moto delle regioni: terre convergenti → montagne, divergenti → coste, oceano-oceano → coste o mare.
- L'interno si interpola da **tre campi di distanza** (da montagne, coste, oceano). Soglia arbitraria Δdistanza < −0,75 per non far crescere montagne al minimo movimento. Nota del 2022: il codice aveva un errore e gli altri parametri erano tarati attorno a esso.
- Umidità **non simulata** (un valore casuale per placca); fiumi dal codice di mapgen4, che lavora su grafi. Usa regl.js.
- La pagina cita come fonte il post di Experilous, ormai solo in archivio. [S] — [archivio](https://web.archive.org/web/20220617041817/http://experilous.com/1/blog/post/procedural-planet-generation)

#### Tectonics.js
- Licenza: il file nel repository e la barra di GitHub dicono **CC-BY 4.0**; la pagina del sito in un punto dice «Creative Commons Non-Commercial Attribution 2.0» e in un altro CC-BY 4.0. **Incoerenza da chiarire con l'autore prima di riusare codice.** [V] — [LICENSE.txt](https://raw.githubusercontent.com/davidson16807/tectonics.js/master/LICENSE.txt), [repository](https://github.com/davidson16807/tectonics.js), [sito](https://davidson16807.github.io/tectonics.js/blog)
- Modello tettonico: la crosta oceanica invecchia e si addensa; oltre una soglia di densità è marcata per la subduzione; linee di velocità tirano la crosta verso le zone di subduzione e la velocità di una placca è la loro media pesata; la crosta in subduzione sovrapposta viene eliminata; i vuoti si riempiono di crosta nuova (dorsali); gli archi insulari emergono da soli. Placche riconosciute con un algoritmo di segmentazione d'immagine a riempimento. [V] — [sito](https://davidson16807.github.io/tectonics.js/blog)
- Prestazioni: progettazione orientata ai dati, array tipizzati, memoizzazione, shader. [V] — [sito](https://davidson16807.github.io/tectonics.js/blog)
- Interfaccia: strati Oceano, Ombre, Neve, Sedimento, Piante; parametri inclinazione dell'asse, durata del giorno, semiasse maggiore; «Copy Seed». [V] — [pagina principale](https://davidson16807.github.io/tectonics.js/)
- Viste dichiarate dall'autore: quota, temperatura, precipitazione, produttività delle piante. [S] — [post «version 2»](https://davidson16807.github.io/tectonics.js/2017/09/16/version2.html)

#### Undiscovered Worlds
- Mappe a scala globale e regionale; la regionale è a circa 1 pixel = 1 km e si apre con «Zoom» da un punto della globale. GPL. [V] — [README Classic](https://raw.githubusercontent.com/JonathanCRH/Undiscovered_Worlds_Classic/main/README.md)
- Si possono importare mappe proprie e far calcolare climi, fiumi, laghi. Versione 1.0 nel marzo 2023 con modello climatico più flessibile. [S] — [blog](https://undiscoveredworlds.blogspot.com/2019/01/what-is-undiscovered-worlds.html), [blog 2023](https://undiscoveredworlds.blogspot.com/2023)
- **Lezione sul determinismo**: la nuova versione a globo elenca tra i problemi noti «The same seed does not always produce the same planet», causa ignota. [V] — [README](https://raw.githubusercontent.com/JonathanCRH/Undiscovered_Worlds/master/README.md)

#### Gaea, World Machine, erosione
- Gaea: nodo Erosion principale (idraulica e termica separate); la documentazione avverte che il flusso può differire leggermente tra un'esecuzione e l'altra per il calcolo in parallelo. Erosion_2 fino a 10 volte più veloce; nacque nel 2014 come plugin GeoGlyph per World Machine. Proprietario. [S] — [documentazione Gaea](https://docs.quadspinner.com/Guide/Using-Gaea/Erosion.html), [CG Channel](https://www.cgchannel.com/2024/08/quadspinner-releases-gaea-2-0), [QuadSpinner](https://quadspinner.com/Gaea/Features)
- Rassegna di riferimento: Galin et al., «A Review of Digital Terrain Modeling», Computer Graphics Forum 38(2), 2019 — tre famiglie: modellazione procedurale, simulazione fisica di erosione e formazione del rilievo, metodi basati su esempi. [S] — [PDF](https://www.cs.purdue.edu/homes/bbenes/papers/Galin19CGF.pdf), [DOI](https://diglib.eg.org/handle/10.1111/cgf13657)
- mewo2/terrain (JS, MIT) usa l'algoritmo di Planchon-Darboux per riempire le depressioni. [S] — [note di O'Leary](https://mewo2.com/notes/terrain)

### Inferences
- **Ordine dei passi consolidato** (DF, WorldEngine, Azgaar concordano): quote → erosione/fiumi → pioggia orografica → temperatura finale → biomi. La pioggia va calcolata **dopo** l'erosione perché dipende dal rilievo definitivo (DF lo dice in chiaro).
- **Fiumi come grafo, non come griglia** (Red Blob, Azgaar): ogni cella versa nel vicino più basso → un albero; il flusso si accumula visitando le celle dalla più alta alla più bassa; costo lineare, adatto a JavaScript.
- **Placche**: due strade. (a) geometrica — riempimento a macchia + vettori + campi di distanza (Red Blob), leggera e istantanea, ma disegnata; (b) dinamica — densità che cresce con l'età, subduzione, crosta nuova nei vuoti (Tectonics.js), più vicina a «emerge dalle leggi». Per stateyour la (b) è la candidata, e il suo codice è già JavaScript.
- **Verifica e rigetto** (DF) è una tecnica legittima anche con determinismo per indirizzo, purché il contatore dei tentativi faccia parte dell'indirizzo (`seme(indirizzo, tentativo)`).
- **Il calcolo in parallelo rompe il determinismo** se l'ordine delle somme cambia (Gaea lo ammette; Undiscovered Worlds lo subisce): in un worker va fissato l'ordine di accumulo.
- **Dettaglio regionale da un riquadro del genitore + vicini** (Songs of Syx 3×3, Undiscovered Worlds, DF 16×16): è il modello pratico della coerenza tra scale; i vicini servono a evitare cuciture.

### Gaps
- **Experilous «Procedural Planet Generation»**: sito irraggiungibile (503) e archivio non accessibile in sessione. [R]: icosaedro suddiviso e deformato, placche per riempimento, sforzi ai confini → quota, correnti d'aria a vortici, calore e umidità trasportati, biomi; JavaScript + three.js. Licenza **non verificata**.
- **Azgaar**: formule di temperatura e precipitazione (fasce di vento per latitudine, effetto orografico) non verificate sul codice: il file `main.js` non è più al vecchio percorso.
- **mapgen4**: non riletto. [R]: pioggia calcolata ordinando le celle lungo la direzione del vento, con effetto orografico. Pagina: https://www.redblobgames.com/maps/mapgen4/
- **Tectonics.js**: non ho trovato una descrizione scritta del modello di clima (temperatura, precipitazione, produttività): va letta dal codice. Griglia sulla sfera e data dell'ultimo commit non verificate.
- **World Machine**: nessuna fonte sugli algoritmi di erosione.
- **Dwarf Fortress**: il wiki non dà formule né l'algoritmo dell'ombra pluviometrica; nessuna intervista di Tarn Adams trovata che lo descriva.
- **Songs of Syx**: nessun dettaglio sugli algoritmi (rumore, montagne).
- **Undiscovered Worlds**: classificazione climatica usata (Köppen?) non confermata; blog non leggibile in sessione (503).
- **WorldEngine**: libreria di simulazione delle placche e sua licenza non verificate.
- Erosione fisica: legge della potenza del corso d'acqua (*stream power law*) e algoritmo implicito O(n) di Braun e Willett (fastscape) sono [R]; non ho aperto le fonti.

---

## 3. Tecniche per un livello di dettaglio continuo su ~40 ordini di grandezza

### Takeaway
Nessun formato numerico copre 40 ordini di grandezza: tutti i motori usano **coordinate gerarchiche** (indirizzo intero della cella + scarto locale piccolo) e **sottraggono la posizione della camera ad alta precisione prima di passare alla scheda grafica**. Per la profondità si usa un depth buffer logaritmico o invertito in virgola mobile; per il terreno un cubo con sei quadtree; per stelle e galassie un octree ordinato per luminosità.

### Cited Findings

#### Precisione delle coordinate
- *Floating origin*: Thorne, «Using a Floating Origin to Improve Fidelity and Performance of Large, Distributed Virtual Worlds», Cyberworlds 2005 — l'origine del mondo si sposta con il punto di vista ed elimina il tremolio spaziale. [S] — [scheda](https://researchr.org/publication/Thorne05)
- Gaia Sky: «we always keep the origin at the camera»; ogni fotogramma la scena è spostata dell'inverso della posizione della camera. Problema concreto: la **cancellazione catastrofica** nel calcolo V = G − C con entrambi i punti a ~1 UA dall'origine dava forte tremolio dei vertici; la doppia precisione (~16 cifre) «not nearly enough to position smallish objects within a few parsecs». Soluzione: precisione arbitraria solo in pochi punti e solo per oggetti vicini — «Objects which are far away from the camera do not need it and do not get it». [V] — [note Gaia Sky 3.1](https://tonisagrista.com/blog/2021/whats-new-gaiasky-31x/)
- Celestia: coordinate universali a virgola fissa a 128 bit; la differenza tra due punti si calcola ad alta precisione e il risultato è un `double`. [V] — [univcoord.h](https://raw.githubusercontent.com/CelestiaProject/Celestia/master/src/celengine/univcoord.h)
- OpenSpace, Dynamic Scene Graph: la camera si attacca e si stacca dal nodo d'interesse più vicino, che diventa l'origine; si percorre il grafo di scena da lì, così gli oggetti più importanti hanno la precisione massima. [S] — [articolo](https://alexanderbock.github.io/papers/eurovis17-axelsson-dynamic_scene_graph.pdf)
- Elite Dangerous: doppia precisione sulla CPU, *double-float* emulato (due float a 32 bit) sulla GPU; i float a 32 bit bastano solo per scale di centinaia di chilometri. [V] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)
- Globi virtuali: il post «Precisions, Precisions» (Deron Ohlarik, AGI, 3 settembre 2008) spiega il tremolio degli oggetti disegnati a grandi distanze. Il libro di Cozzi e Ring, *3D Engine Design for Virtual Globes*, ha i capitoli «Vertex Transform Precision» e «Depth Buffer Precision»; il codice d'accompagnamento è OpenGlobe. [V esistenza e autore del post] [S il resto] — [AGI](https://help.agi.com/AGIComponents/html/BlogPrecisionsPrecisions.htm), [Routledge](https://www.routledge.com/product/isbn/9781568817118), [OpenGlobe](https://github.com/virtualglobebook/OpenGlobe)
- Tecnica «relativa all'occhio» sulla GPU: la posizione dell'occhio va in due uniform (parte alta e parte bassa) e così i vertici a 64 bit. [S] — [post sull'emulazione della doppia precisione](https://prideout.net/emulating-double-precision) (la pagina oggi risponde 404; l'attribuzione a Cozzi data dalla ricerca non è verificata)
- Star Citizen: posizioni a 64 bit + disegno relativo alla camera come ultimo passo. [S] — [GamersNexus](https://gamersnexus.net/gg/2019-star-citizen-multi-crew-interview-chris-roberts)

#### Depth buffer
Formule di Outerra, tutto [V] — [blog Outerra, 2012](https://outerra.blogspot.com/2012/11/maximizing-depth-buffer-range-and.html)
- Vertex shader: `gl_Position.z = 2.0*log(gl_Position.w*C + 1)/log(far*C + 1) - 1; gl_Position.z *= gl_Position.w;`
- Variante corretta per pixel: `FC = 1.0/log(far*C + 1)`; nel vertex shader `logz = log(gl_Position.w*C + 1)*FC`; nel fragment shader `gl_FragDepth = logz`. Profondità di camera di ritorno: `(exp(depth/FC)-1.0)/C`.
- C regola la risoluzione vicino alla camera; C = 0,01 dà circa 10 m di tratto lineare.
- Un depth buffer normale dà circa 4 decadi utili; quello logaritmico copre le 9 decadi del grafico; uno a 32 bit in virgola mobile **invertito** (lontano = 0, vicino = 1) è poco meglio di un logaritmico a 24 bit; un logaritmico a 32 bit è ~20 volte più fine di uno a 24.
- Scrivere `gl_FragDepth` costa l'8–10% nei casi peggiori; Outerra lo fa solo per oggetti poco tassellati.

#### Terreno: quadtree e clipmap
- CDLOD (Strugar, *Journal of Graphics, GPU, and Game Tools*, 2009/2010): quadtree di griglie regolari; la funzione di dettaglio è la stessa su tutta la maglia ed è basata sulla distanza 3D esatta osservatore-terreno; transizione tra livelli continua, «no need for stitching meshes». Codice MIT (© 2010 Filip Strugar). [V] — [README e LICENSE](https://github.com/fstrugar/CDLOD)
- Geometry clipmaps (Losasso e Hoppe, SIGGRAPH 2004): il terreno è tenuto in griglie regolari annidate centrate sull'osservatore, riempite man mano che si muove; versione GPU di Asirvatham e Hoppe in GPU Gems 2. [S] — [pagina di Hoppe](https://hhoppe.com/proj/geomclipmap/), [GPU Gems 2](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry)
- Cubo-sfera con sei quadtree: SpaceEngine [S] ed Elite Dangerous [V]. In Elite i riquadri uniformi servono anche da maglie per la fisica e, oltre un certo livello, la geometria è piatta con tessiture di normali e quote generate. — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/), [SpaceEngine](https://spaceengine.org/news/blog171120/)
- SpaceEngine, criterio di suddivisione: distanza dal bordo del nodo divisa per la sua dimensione, misurata in coordinate del cubo non deformate. [S] — [SpaceEngine](https://spaceengine.org/news/blog171120/)

#### Octree per stelle e galassie
- SpaceEngine: 10 livelli, le stelle più brillanti nei nodi grandi, le deboli nei piccoli: da lontano si visita solo la cima dell'albero. [V] — [blog](https://spaceengine.org/news/blog100201/)
- Gaia Sky: octree «magnitude–space» con soglia sull'angolo solido dell'ottante. [S] — [documentazione](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/3.5.3/LOD-catalogs.html)
- Elite Dangerous: octree di settori a otto strati dentro l'ID a 64 bit. [V] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)
- Gestione dei nodi: dividere subito, ma rimandare la fusione finché non serve memoria; gestore a cache «usato meno di recente». Post di terzi, non di SpaceEngine. [S] — [gamedev.net](https://gamedev.net/blogs/entry/1952708-galaxy-generation)

#### Coordinate «frattali»
- Mawhorter, «Fractal Coordinates for Procedural Content Generation» (2021): griglie sovrapposte a scale diverse, casella = (x, y, altezza h); ogni casella ha un solo genitore e S×S figli; da qualunque punto si risale all'origine in tempo logaritmico (con S = 5, una casella a x = 2^32 richiede ~28 passi contro 8.590 a blocchi fissi); tra caselle passa poca informazione ben definita (per esempio portate che rispettano entrata = uscita). [V] — [slide](https://cs.wellesley.edu/~pmwh/papers-fcpcg/presentation/slides.html)

### Inferences
- **Conti miei** (float64 di JavaScript, 53 bit di mantissa, passo relativo ≈ 2,2·10⁻¹⁶): a 1 UA (1,5·10¹¹ m) il passo è ~3·10⁻⁵ m; a 1 anno luce (9,5·10¹⁵ m) ~2 m; a 10 Gpc (3·10²⁶ m) ~7·10¹⁰ m, quasi mezza UA. Da 10²⁶ m a 10⁻¹⁵ m sono 41 decadi ≈ 137 bit: non basta nemmeno un intero a 128 bit se si vuole un solo numero.
- **Schema consigliato per stateyour**: posizione = *cammino di indirizzi interi* (cosmo / galassia / stella / pianeta / riquadro del quadtree / cella / …) + *scarto locale in float64 nell'unità propria di quel livello*. Il confronto camera-oggetto si fa risalendo al primo antenato comune e sommando solo scarti piccoli (è il Dynamic Scene Graph di OpenSpace). Non servono BigInt né precisione arbitraria se nessun livello copre più di ~10 decadi.
- Con Canvas 2D la proiezione si fa in float64 e il depth buffer non esiste: basta sottrarre la camera nel sistema locale. Le formule di Outerra servono solo per la vista 3D in WebGL, dove i float sono a 32 bit (a raggio terrestre il passo è ~0,5–0,8 m: obbligatorio passare coordinate già relative alla camera).
- **Cambio di rappresentazione dichiarato**: i motori esistenti cambiano *modello* a ogni salto (particelle → corpo → quadtree → tessitura). Se stateyour vuole che ogni scala discenda dalla precedente, il figlio deve ricevere dal genitore le *grandezze fisiche conservate* (massa, composizione, energia, momento angolare, età) e non solo un seme: è lo «parent data is always available» di Stellar Forge.
- **Criterio di suddivisione unico**: «dimensione apparente del nodo sullo schermo > soglia» (CDLOD, Gaia Sky) vale uguale per octree di galassie e quadtree di terreno.

### Gaps
- Capitoli di Cozzi e Ring su RTE non letti: i dettagli (RTC, RTE su CPU, RTE su GPU con due float) sono [R].
- Articolo di Thorne non letto per intero.
- Nessuna fonte trovata su come SpaceEngine tratta le coordinate tra galassie (il blog parla solo del limite a 32 bit negli shader).
- Non ho cercato documentazione su tecniche equivalenti sotto la scala del metro (rocce → cristalli → atomi): i motori esaminati si fermano tutti alla superficie del pianeta. È probabilmente un vuoto reale, ma la ricerca non l'ha coperto.
- Depth buffer invertito in WebGL2/WebGPU: disponibilità non verificata.

---

## 4. Generazione deterministica per indirizzo: casualità da hash, generatori a contatore, semi gerarchici, valutazione pigra e cache, coerenza tra risoluzioni

### Takeaway
Lo strumento giusto è un **generatore a contatore** (funzione pura `f(contatore, chiave) → numero`): niente stato, accesso casuale, flussi indipendenti per indirizzo. Threefry-2x32 usa solo somme, xor e rotazioni a 32 bit e in JavaScript puro passa i vettori di prova ufficiali (verificato qui). La coerenza fine↔grossolano ha un precedente esatto in cosmologia: **Panphasia**, un campo di rumore bianco gaussiano definito su un octree a 50 livelli in cui ogni ingrandimento è coerente con il genitore per costruzione.

### Cited Findings

#### Generatori a contatore
- Random123: i CBRNG sono funzioni senza stato che prendono un contatore e una chiave; la stessa coppia dà sempre lo stesso risultato. Famiglie: Threefry (derivato da Threefish; 2x32, 4x32, 2x64, 4x64), Philox (rete di Feistel + moltiplicazione intera; le forme a 64 bit richiedono il prodotto 64×64→128), ARS e AESNI (istruzioni AES). Superano SmallCrush, Crush e BigCrush di TestU01. Non adatti alla crittografia. [V] — [documentazione Random123](https://www.thesalmons.org/john/random123/releases/latest/docs/index.html)
- Articolo: Salmon, Moraes, Dror, Shaw, «Parallel Random Numbers: As Easy as 1, 2, 3», SC11, 2011. Almeno 2^64 flussi paralleli indipendenti. Numero minimo di giri che resiste a Crush: Threefry-2×64-13, Threefry-4×32-12, Threefry-4×64-12, Philox-4×32-7, Philox-2×64-6; i valori predefiniti hanno margine (Threefry-4×64-20 «eight extra rounds of safety margin», Philox-4×32-10 «three extra rounds»). [V] — [PDF](https://www.thesalmons.org/john/random123/papers/random123sc11.pdf)
- Licenza di Random123: testo in stile BSD («Redistribution and use in source and binary forms…»), © 2010-2012 D. E. Shaw Research. [V] — [LICENSE](https://raw.githubusercontent.com/DEShawResearch/random123/master/LICENSE)
- Squares (Widynski, arXiv:2004.06278, v7 del 2022): versione a contatore del «quadrato medio» di von Neumann; 4 giri per l'uscita a 32 bit, 5 per quella a 64. Codice dal PDF:
  ```c
  inline static uint32_t squares32(uint64_t ctr, uint64_t key) {
     uint64_t x, y, z;
     y = x = ctr * key; z = y + key;
     x = x*x + y; x = (x>>32) | (x<<32);       /* round 1 */
     x = x*x + z; x = (x>>32) | (x<<32);       /* round 2 */
     x = x*x + y; x = (x>>32) | (x<<32);       /* round 3 */
     return (x*x + z) >> 32;                   /* round 4 */
  }
  ```
  La chiave non è libera: «should be an irregular bit pattern with roughly half ones and half zeros», generata da un'utilità apposita (circa 2 miliardi di chiavi). Prove: 300 BigCrush, PractRand fino a 32 terabyte. Tempo per 10⁹ numeri: 1,35 s contro 2,29 s di Philox. [V] — [arXiv](https://arxiv.org/abs/2004.06278)
- **Verifica fatta in questa sessione**: questa implementazione in JavaScript puro di Threefry-2x32 riproduce tutti i vettori `threefry2x32` (13, 20 e 32 giri) del file ufficiale `tests/kat_vectors` di Random123; con Node, 5 milioni di chiamate a 20 giri in ~0,24 s. [V] — [kat_vectors](https://raw.githubusercontent.com/DEShawResearch/random123/main/tests/kat_vectors)
  ```js
  const R = [13, 15, 26, 6, 17, 29, 16, 24];
  export function threefry2x32(c0, c1, k0, k1, rounds = 20) {
    const ks = [k0 | 0, k1 | 0, (0x1BD11BDA ^ k0 ^ k1) | 0];
    let x0 = (c0 + ks[0]) | 0, x1 = (c1 + ks[1]) | 0;
    for (let r = 0; r < rounds; r++) {
      const s = R[r & 7];
      x0 = (x0 + x1) | 0; x1 = ((x1 << s) | (x1 >>> (32 - s))) ^ x0;
      if ((r & 3) === 3) { const j = (r + 1) >> 2; x0 = (x0 + ks[j % 3]) | 0; x1 = (x1 + ks[(j + 1) % 3] + j) | 0; }
    }
    return [x0 >>> 0, x1 >>> 0];   // 64 bit di uscita per (contatore a 64 bit, chiave a 64 bit)
  }
  ```
- Raccolta di hash e generatori in JavaScript di pubblico dominio (bryc/code): «Public domain». [V licenza; contenuto non riletto] — [LICENSE](https://raw.githubusercontent.com/bryc/code/master/LICENSE.md)

#### Indirizzo = seme, nei motori
- SpaceEngine: un seme per nodo dell'octree; il nome della stella è l'indirizzo. [V] — [blog](https://spaceengine.org/news/blog100201/)
- Elite Dangerous: ID a 64 bit (settore, strato, sistema, corpo) perché cliente e servente concordino sullo stesso oggetto; il rumore del terreno prende posizione + ID del pianeta. [V] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)
- Fragilità: qualunque modifica a un parametro dell'algoritmo (stelle per nodo, tabelle di probabilità) produce una galassia completamente diversa. [S] — [gamedev.net](https://gamedev.net/blogs/entry/1952708-galaxy-generation)

#### Dipendenze tra blocchi e tra scale
- LayerProcGen (Rune Skovbo Johansen): quadro per generazione a strati «infinite, deterministic and contextual»; si divide la generazione in più strati tenendo «a strict separation between the input and output of each layer», così operazioni che attraversano i confini (sfocature, rilassamento di punti, ricerca di cammini) restano deterministiche; i blocchi di uno strato possono essere ordini di grandezza più grandi di quelli di un altro; il quadro tiene traccia delle dipendenze. C#, MPL-2.0. [V] — [README](https://raw.githubusercontent.com/runevision/LayerProcGen/main/README.md), [LICENSE](https://raw.githubusercontent.com/runevision/LayerProcGen/master/LICENSE.md)
- Coordinate frattali (Mawhorter 2021): i genitori vincolano i bordi dei figli, i figli all'origine vincolano parte del genitore; catene di dipendenza finite e corte. [V] — [slide](https://cs.wellesley.edu/~pmwh/papers-fcpcg/presentation/slides.html)
- Compressione per differenze: il contenuto modificato a mano si conserva come *delta* sopra la generazione deterministica. [S] — [nota su Arcanum](https://turbo-wiki.pages.dev/tim-cain/level-design/arcanum-s-procedural-terrain-generation)

#### Coerenza tra risoluzioni
- **Panphasia** (Jenkins, MNRAS 2013, arXiv:1306.5968): realizzazione discreta e gerarchica, estremamente grande, di rumore bianco gaussiano, organizzata come octree; ogni piccola parte si calcola in fretta; **cinquanta livelli**, «a factor of more than 10^15 in linear scale»; le fasi sono definite in anticipo per tutte le scale, quindi le condizioni iniziali di una risimulazione ingrandita sono coerenti col genitore e tra loro per costruzione; una regione si condivide dando solo la sua posizione nell'albero. Un articolo compagno (Jenkins e Booth) rende pubblico il codice. [V sul riassunto arXiv] — [arXiv](https://arxiv.org/abs/1306.5968)
- Outerra: ogni livello = suddivisione bicubica del genitore + rumore la cui ampiezza dipende da curvatura e quota del genitore. [S] — [blog Outerra](https://outerra.blogspot.com/2009/02)
- Dwarf Fortress: griglie 2^n+1 riempite «fractally» da valori seminati; ogni riquadro di regione si espande in 16×16 blocchi locali. [V] — [wiki DF](https://dwarffortresswiki.org/index.php/World_generation)

#### Rischi per il determinismo
- Calcolo in parallelo: Gaea ammette differenze tra esecuzioni. [S] — [documentazione Gaea](https://docs.quadspinner.com/Guide/Using-Gaea/Erosion.html)
- Stesso seme, pianeta diverso: problema noto e non risolto in Undiscovered Worlds. [V] — [README](https://raw.githubusercontent.com/JonathanCRH/Undiscovered_Worlds/master/README.md)

### Inferences
- **Stato attuale di stateyour**: `hash()` è FNV-1a a 32 bit su una stringa con un finalizzatore corto. Con N indirizzi distinti la probabilità di almeno una collisione a 32 bit supera il 50% attorno a N ≈ 77.000 (paradosso del compleanno, conto mio). Una collisione non rompe nulla, ma due eventi ricevono la stessa sequenza casuale (correlazione nascosta, per esempio due stelle «gemelle»). Con 200 galassie × 2.500 stelle × 16 pianeti × più eventi si è già oltre. Rimedio a basso costo: portare il seme a 64 bit (due parole da 32) e usare `threefry2x32(contatore, livello, chiaveAlta, chiaveBassa)`.
- **Semi gerarchici**: `chiave_figlio = threefry(indice_figlio, etichetta_evento, chiave_genitore)`. Il contatore è l'indice dell'estrazione *dentro* l'evento. Vantaggi: accesso casuale (si salta al numero k senza generare i precedenti), nessun ordine di valutazione da rispettare, aggiungere un'estrazione in un modulo non sposta le altre se ogni grandezza ha la sua etichetta. Rimedia alla fragilità segnalata su gamedev.net.
- **Quale generatore in JavaScript**: Threefry-2x32 è il più adatto (solo operazioni a 32 bit con segno, senza moltiplicazioni). Philox richiede la parte alta del prodotto 32×32 (spezzando in 16 bit); Squares richiede prodotti a 64 bit (BigInt, lento, o aritmetica a membri) e chiavi speciali: sconsigliato. Per Threefry-2x32 il minimo che resiste a Crush non è nell'articolo (che dà 2×64-13 e 4×32-12): tenere 20 giri, o 13 dove serve velocità.
- **Due nozioni diverse di «il fine concorda col grossolano»**:
  1. *interpolante* (spostamento del punto medio): i campioni del genitore restano identici nel figlio; il nuovo dettaglio tocca solo i punti intermedi. Semplice, ma il valore del genitore è un campione puntuale, non una media, e restano artefatti lungo la griglia.
  2. *conservativa* (dettaglio a media nulla; base di Haar o piramide laplaciana): il valore del genitore è la **media** dei figli, e ai figli si aggiunge un dettaglio la cui somma sul genitore è zero. È quella giusta per grandezze fisiche conservate (massa, acqua, energia): la pioggia totale di una cella grossa resta la stessa a ogni ingrandimento. Panphasia è costruito così, per un campo gaussiano.
  Per stateyour: (2) per ciò che si conserva; (1) o rumore a ottave per la forma (quote), accettando che il valore grossolano sia un filtro del fine.
- **Regola per il dettaglio emergente**: il figlio non deve *aggiungere rumore* ma *risolvere la stessa legge a passo più fine con il genitore come condizione al contorno*; il seme serve solo per ciò che la legge lascia indeterminato (condizioni iniziali sotto la griglia). In formula: `figlio = risolvi(legge, bordo = genitore, perturbazione = rumore(indirizzo) a media nulla)`.
- **Valutazione pigra + cache**: chiave di cache = indirizzo completo (rami inclusi); scarto «usato meno di recente»; dividere subito, fondere tardi. Il `memo` attuale di cosmo.js tiene 64 voci e scarta la più vecchia inserita (non la meno usata): può scartare proprio i genitori, che servono più spesso.
- **Dipendenze dai vicini** (erosione, fiumi, venti): calcolarle a uno strato più grosso con un margine attorno al blocco (LayerProcGen); il figlio legge solo l'uscita finita dello strato genitore, mai i fratelli allo stesso strato.
- **Trabocchetto di JavaScript** [R]: lo standard non impone che `Math.sin`, `Math.exp`, `Math.pow` diano lo stesso ultimo bit su motori diversi (sono «implementation-approximated»), mentre `+ − × ÷` e `Math.sqrt` sono esatte IEEE 754. Dentro Electron (un solo V8) il risultato è stabile; tra Electron e un altro browser un indirizzo potrebbe divergere in sistemi caotici. Riferimento da verificare: https://tc39.es/ecma262/#sec-function-properties-of-the-math-object

### Gaps
- **Panphasia**: non ho letto l'articolo completo. Il meccanismo interno e l'eventuale licenza del codice pubblico non sono verificati.
- **MUSIC** (Hahn e Abel 2011, condizioni iniziali multi-scala, arXiv:1103.6031) [R]: non aperto.
- **Rumore wavelet** (Cook e DeRose, SIGGRAPH 2005) [R]: non aperto. Indirizzo ricordato: https://graphics.pixar.com/library/WaveletNoise/paper.pdf
- **Downscaling in climatologia**: non cercato. [R]: esistono il downscaling statistico e dinamico e le cascate moltiplicative casuali per la pioggia, che conservano la media della cella grossa. Nessuna fonte aperta: da verificare prima di citare.
- **Spostamento del punto medio** (Fournier, Fussell, Carpenter 1982) [R]: fonte non aperta.
- Minimo di giri sicuro per Threefry-2x32: non trovato nell'articolo.
- LayerProcGen: documentazione di dettaglio irraggiungibile (503); letto solo il README.
- Non ho confrontato la qualità statistica dell'attuale `hash()` di stateyour con prove (PractRand, SmallCrush): la stima delle collisioni è solo teorica.

---

## 5. Progetti che fanno EMERGERE le cose dalla fisica attraverso le scale; molti-mondi/diramazioni + generazione procedurale; che cosa non fa ancora nessuno

### Takeaway
Esistono quadri che accoppiano fisiche diverse (AMUSE, VPLanet), ma sono strumenti di ricerca per un sistema alla volta, non esploratori a zoom continuo; e i motori a zoom continuo non simulano, disegnano con regole plausibili. Le «diramazioni» esistono in cosmologia numerica come esperimenti controllati (condizioni iniziali «geneticamente modificate», simulazioni «ombra»), ma non ho trovato nessun motore procedurale che le offra come universi paralleli navigabili: la combinazione che stateyour già abbozza in `cosmo.js` appare senza precedenti diretti tra le fonti trovate.

### Cited Findings

#### Quadri multi-fisica e multi-scala
- **AMUSE** (Astrophysical Multipurpose Software Environment): quadro in Python per simulazioni multi-scala e multi-fisica, costruito come raccolta di moduli che avvolgono codici esistenti; domini alla pubblicazione: dinamica gravitazionale, evoluzione stellare, idrodinamica, trasporto radiativo; gestisce le unità di misura; comunicazione via MPI; limite dichiarato: architettura centralizzata. Riferimento: Pelupessy et al. 2013, A&A 557, A84. Apache-2.0. [V licenza] [S descrizione] — [LICENSE](https://raw.githubusercontent.com/amusecode/amuse/master/LICENSE), [arXiv](https://arxiv.org/pdf/1307.3016)
- **VPLanet**: «software to simulate planetary system evolution, with a focus on habitability. Physical models, typically consisting of ordinary differential equations, are coupled together to simulate evolution, from planetary cores to passing stars, for the age of a system». MIT (© 2018). Tredici moduli, tra cui: AtmEsc (fuga atmosferica, fotolisi dell'acqua), DistOrb (evoluzione orbitale semi-analitica al 2º e 4º ordine), DistRot (asse di rotazione), EqTide (maree di equilibrio), GalHabit (marea galattica e stelle di passaggio), MagmOc (oceano di magma), POISE (clima a bilancio di energia con calotte), RadHeat (calore radiogenico), SpiNBody (N corpi), Stellar (luminosità, raggio, frenamento magnetico), ThermInt (interno termico). [V] — [README](https://raw.githubusercontent.com/VirtualPlanetaryLaboratory/vplanet/main/README.md), [LICENSE](https://raw.githubusercontent.com/VirtualPlanetaryLaboratory/vplanet/master/LICENSE)
- REBOUND (N corpi): GPL-3.0. [V licenza] — [LICENSE](https://raw.githubusercontent.com/hannorein/rebound/master/LICENSE)
- Universe Sandbox: gravità + clima + evoluzione stellare + composizione in tempo reale, con modelli «tenuti semplici»; niente formazione planetaria. [V] — [FAQ](https://universesandbox.com/faq)
- Stellar Forge: simulazione per epoche dal disco protoplanetario ai pianeti, dall'alto in basso; codice chiuso. [V] — [80.lv](https://80.lv/articles/generating-the-universe-in-elite-dangerous/)
- Tectonics.js: tettonica dinamica da densità ed età della crosta, in JavaScript. [V] — [sito](https://davidson16807.github.io/tectonics.js/blog)

#### Diramazioni e controfattuali in cosmologia
- **Aloni «geneticamente modificati»** (Roth, Pontzen, Peiris, MNRAS 2016, arXiv:1504.07250): «start from a reference simulation with fully random initial conditions, then make controlled changes»; estende l'algoritmo di Hoffman-Ribak (campi gaussiani vincolati); si cambia una proprietà di un alone (massa, storia delle fusioni) e «the algorithm demonstrably makes minimal changes to other properties of the halo and its environment»; si calcola anche quanto l'oggetto modificato è probabile rispetto al riferimento. Il codice genetIC è GPL. [V riassunto arXiv] [V licenza] — [arXiv](https://arxiv.org/abs/1504.07250), [LICENSE](https://raw.githubusercontent.com/pynbody/genetIC/master/LICENSE.md)
- **Effetto farfalla** (Genel et al., ApJ 2019, arXiv:1807.07084): coppie di simulazioni «ombra» che differiscono per minuscoli spostamenti casuali delle particelle; l'insieme delle galassie ha le stesse proprietà statistiche ma «the results diverge from each other at the individual galaxy level»; dopo tempi cosmologici le galassie corrispondenti differiscono del 2–25% a seconda della grandezza; con il modello di retroazione di IllustrisTNG le differenze non calano con la risoluzione. [V riassunto arXiv] — [arXiv](https://arxiv.org/abs/1807.07084)

#### Diramazioni nei giochi procedurali
- La ricerca su «molti mondi / linee temporali che si diramano + generazione procedurale» non ha restituito alcun motore o gioco che lo faccia; solo materiale generale sul determinismo da seme. [S, risultato negativo di una sola ricerca] — [Game Developer](https://gamedeveloper.com/design/many-faces-of-procedural-generation-determinism-classification-system-part-3-)
- stateyour ha già il meccanismo: un cosmo parallelo si scrive `n#{"evento":ramo}`; `semeEvento()` cambia il seme solo dell'evento nominato e «tutto ciò che non discende da quegli eventi resta identico». [V, file locale `src/camera/cosmo.js`]

### Inferences
- **Che cosa esiste**: (a) esploratori a zoom continuo senza fisica emergente (SpaceEngine, Elite, No Man's Sky); (b) fisica accoppiata senza zoom né indirizzi (AMUSE, VPLanet, Universe Sandbox); (c) rumore gerarchico coerente tra scale in cosmologia (Panphasia); (d) controfattuali controllati (genetIC, simulazioni ombra). **Nessuna delle fonti trovate unisce a + b + c + d.**
- **Che cosa (per quanto ho trovato) non fa nessuno**:
  1. zoom continuo **sotto** la superficie del pianeta (rocce → cristalli → molecole → atomi → particelle) nello stesso programma che parte dal cosmo: tutti i motori esaminati si fermano a ~1 cm – 10 m, con tessiture;
  2. discendenza fisica esplicita tra livelli: il figlio che riceve dal genitore grandezze conservate e le rispetta;
  3. universi paralleli come **indirizzi**: un ramo = (indirizzo base + elenco di eventi andati diversamente), con ricalcolo pigro solo del cono di ciò che ne discende;
  4. tutto questo in JavaScript nel browser senza dipendenze.
- **Avvertenza fisica sulle diramazioni** (da Genel et al.): nei sistemi caotici un cambiamento minuscolo cambia i singoli oggetti ma non le statistiche. Un ramo che cambia «un evento» dovrebbe lasciare invariato tutto ciò che è a monte e fuori dal suo cono causale (già così in `semeEvento`), ma può legittimamente cambiare *molto* ciò che è a valle. Presentare i rami come «stessa statistica, individui diversi» è la lettura fedele ai risultati.
- **Idea riusabile da genetIC**: oltre a «risorteggiare» un evento (ramo = nuovo seme), si può offrire il ramo *vincolato* — «lo stesso universo, ma questo pianeta con massa doppia» — cambiando il meno possibile il resto: campo = campo_originale + correzione minima che soddisfa il vincolo. Per campi gaussiani la correzione è una formula chiusa (Hoffman-Ribak).
- **Da VPLanet si prende la struttura**, più che il codice (C, pensato per corse lunghe): moduli = insiemi di equazioni differenziali ordinarie accoppiate, ognuno con le sue grandezze; è lo stesso disegno dei file `disco.js`, `geologia.js`, `chimica.js`, `lune.js` di stateyour. I singoli modelli (maree di equilibrio, calore radiogenico, bilancio di energia con ghiacci, fuga atmosferica limitata dall'energia) sono formule chiuse o ODE piccole, portabili in JavaScript; licenza MIT.
- **Da AMUSE si prende l'idea del «ponte»**: codici diversi a scale diverse avanzano a turno scambiandosi le forze. Nel caso pigro e per indirizzo, il ponte diventa «il livello grosso dà il bordo, il livello fine restituisce una correzione media».

### Gaps
- **«Universe in a box»**: non ho trovato un quadro software con questo nome; [R] è il titolo di un libro divulgativo di Andrew Pontzen (2023) sulle simulazioni cosmologiche. Non verificato.
- **Ricerca sulle diramazioni**: una sola interrogazione, con esito negativo. L'affermazione «nessuno lo fa» vale come «non trovato», non come prova di assenza. Non ho cercato in letteratura accademica (articoli sui «mondi possibili» nella generazione procedurale) né nei giochi a linee temporali.
- **Tecnica dello «splicing» causale** (Cadiou, Pontzen, Peiris 2021) [R] e **simulazioni «accoppiate e fissate»** (Angulo e Pontzen 2016) [R]: non verificate.
- **AMUSE oggi**: versione corrente, codici supportati e attività 2025–2026 non verificati (le fonti lette sono del 2013).
- Modelli climatici leggeri (ExoPlaSim, SpeedyWeather, Isca, ROCKE-3D) e simulatori a scala atomica o di particelle non sono stati cercati qui: spettano ad altri filoni della ricerca.
- Non ho verificato se esistano progetti amatoriali recenti (2025–2026) che dichiarino «universo emergente dalla fisica» nel browser: la ricerca generica non ne ha fatti emergere, ma non è stata mirata.
