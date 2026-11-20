# Navigazione della camera e transizioni tra scale negli esploratori multiscala dell'universo

Note per stateyour: un universo procedurale in JavaScript/WebGL dentro Electron, dove una sola rotella zooma senza interruzioni dalla rete cosmica fino alle particelle.

Come leggere queste note:
- **[VERIFICATO]**: ho letto la fonte in questa sessione (il testo del PDF estratto con pdftotext, il sorgente o la pagina di documentazione).
- **[SNIPPET]**: viene solo da un riassunto di ricerca o da un estratto, senza lettura completa della pagina.
- **[RICORDATO]**: viene dalla mia memoria e non l'ho controllato qui. Questi punti stanno solo in Inferenze o Lacune e vanno verificati prima di usarli come fatti.

Fonti non raggiungibili in questa sessione:
- Il PDF di Axelsson et al. 2017 (il sito dell'autore risponde con una pagina HTML, non con il PDF).
- Il sorgente `orbitalnavigator.cpp` di OpenSpace (404 su raw.githubusercontent per i rami master e main; l'accesso GitHub al repository non è abilitato in questa sessione).
- La pagina "Getting started / navigation" di OpenSpace (404).
- Il manuale di SpaceEngine (nessun risultato ufficiale).

---

## 1. Come ogni strumento decide verso cosa zoomare o orbitare (fuoco, ancora, zoom verso il cursore, picking)

### Sintesi
Gli strumenti migliori **fissano il bersaglio all'inizio del gesto e non lo cambiano durante il gesto**:
- Cesium salva `_zoomWorldPosition` quando parte il gesto di zoom.
- OpenSpace e Gaia Sky usano un nodo di fuoco o ancora scelto esplicitamente, con doppio clic o con una ricerca.

Il bersaglio sotto il cursore si ricava dal **depth buffer e da un raggio analitico** (si tiene il più vicino dei due). Se non si colpisce nulla, si fa un **fallback esplicito**: zoom lungo la direzione di vista. In stateyour il bersaglio non va mai ricalcolato a ogni tacca della rotella: per "zoom avanti che va indietro", un'ancora che salta da un oggetto all'altro tra un frame e il successivo è il sospetto più probabile.

### Fonti citate
- **CesiumJS, zoom verso il cursore [VERIFICATO, sorgente `ScreenSpaceCameraController.js`]:**
  - Quando cambia la posizione iniziale del mouse, `handleZoom` calcola un pick. In 3D, se c'è un globo, chiama `pickPosition`.
  - Se trova un punto, imposta `_useZoomWorldPosition = true` e salva il punto in `_zoomWorldPosition`.
  - Se non trova nulla, esegue `if (!object._useZoomWorldPosition) { camera.zoomIn(distance); return; }`, cioè zooma lungo la direzione di vista. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)
- **CesiumJS, `pickPosition` [VERIFICATO]:**
  - Combina il depth buffer (`scene.pickPositionWorldCoordinates`, se `pickPositionSupported`) con un raggio analitico contro il globo (`globe.pickWorldCoordinates(ray, …)`).
  - Restituisce **l'intersezione più vicina alla camera**, oppure `undefined` se nessuna delle due colpisce. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)
- **CesiumJS, centro schermo contro cursore [VERIFICATO]:**
  - In 3D, Cesium prima fa un pick anche del **centro dello schermo**.
  - Se la camera è bassa (< 3000 m) e guarda quasi in orizzontale, se è sottoterra, o se il pick al centro non trova nulla, imposta `zoomOnVector = true` e si muove lungo il raggio del cursore con `camera.move(rayDirection, distance)`.
  - Sotto 1.000.000 m la camera orbita attorno al bersaglio. Sopra quella quota ruota attorno all'asse tra la normale del punto scelto e quella del centro.
  - Un flag `zoomingOnVector` mantiene la modalità a vettore mentre il gesto continua. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)
- **OpenSpace, ancora e mira [SNIPPET, documentazione]:**
  - Un `NavigationState` descrive posizione e rotazione esatte della camera **rispetto al nodo ancora**.
  - Il nodo mira (aim) è facoltativo e "non cambia la posizione né la direzione di vista effettive".
  - L'API di scripting ha funzioni per reindirizzare la camera verso la mira o verso l'ancora (`retargetAim`, `retargetAnchor`) e `distanceToFocusInteractionSphere`, cioè la distanza dalla "sfera di interazione" del nodo di fuoco. [NavigationState](https://docs.openspaceproject.com/latest/reference/asset-components/Other/NavigationState.html), [API openspace.navigation](https://docs.openspaceproject.com/latest/reference/scripting-api/openspace.navigation.html)
- **OpenSpace, voli automatici [VERIFICATO, pagina della documentazione]:**
  - Se si annulla un volo, il pulsante di annullamento "mostra il nodo ancora attuale, che diventa il fuoco".
  - Il tempo di simulazione "si mette in pausa quando un percorso parte e riprende quando finisce". [Automatic Flight Paths](https://docs.openspaceproject.com/latest/using-openspace/navigation/camera-paths.html)
- **Gaia Sky, modalità fuoco [VERIFICATO, documentazione e articolo]:**
  - Nella modalità predefinita la camera è agganciata a un oggetto di fuoco, scelto con doppio clic o con la ricerca (Ctrl+F).
  - "Lock camera to focus" mantiene la posizione relativa. "Lock orientation" fa ruotare la camera insieme all'oggetto.
  - Dalla versione 3.1.7 c'è il **tracciamento**: la posizione resta legata al fuoco, ma la direzione segue un altro oggetto.
  - La modalità libera (Free mode) "lascia vagare la camera" senza fuoco. [Camera modes](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/master/Camera-modes.html)
  - Secondo l'articolo, in modalità fuoco la camera "normalmente punta all'oggetto, anche se la direzione di vista può essere cambiata, rimanendo relativa alla posizione del fuoco". [Sagristà et al. 2019, TVCG](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **McCrae et al. 2009, "Multiscale 3D navigation" (I3D) [SNIPPET]:**
  - Una **cubemap di profondità** renderizzata dalla posizione della camera dà la distanza dalla geometria vicina in ogni direzione. Serve sia a scalare la navigazione sia a rilevare collisioni senza precalcolo.
  - Il brevetto collegato dice che usare la **distanza minima** dà un comportamento più prevedibile della media, che risente di valori anomali come porte e finestre aperte. [Articolo (PDF dgp.toronto)](https://www.dgp.toronto.edu/~mccrae/projects/multiscalenav/Multiscale3DNav.pdf), [Brevetto US8665259B2](https://patents.google.com/patent/US8665259)

### Inferenze
- **Regola da adottare in stateyour:**
  1. Alla prima tacca di un gesto della rotella (con una pausa di circa 150–250 ms come separatore tra gesti; valore da tarare, non preso da una fonte), si fa il pick sotto il cursore.
  2. Si salva il punto mondo P e l'oggetto proprietario, e li si tiene fermi per tutto il gesto, come fa Cesium con `_zoomWorldPosition`.
  3. Se il pick fallisce, il fallback è l'oggetto di fuoco corrente, oppure il centro dello schermo con la distanza dell'ultimo bersaglio valido. Non va usato un "oggetto più vicino" che cambia a ogni frame.
- **Pick in un universo procedurale:** non serve un depth buffer, perché le geometrie sono analitiche (sfere, ellissoidi, aloni). Basta un **ray cast analitico** contro le sfere di interazione dei nodi visibili del livello corrente, tenendo il colpo più vicino (la stessa logica di "il più vicino tra depth e raggio" di Cesium). Il depth buffer con `readPixels` è costoso in WebGL e poco preciso a grandi distanze.
- **Sfera di interazione [RICORDATO da OpenSpace, non verificato nel sorgente]:** ogni nodo ha un raggio, distinto dal raggio di bounding, che fa da superficie di riferimento per la velocità di zoom e per la distanza minima. In stateyour ogni livello (filamento, galassia, stella, pianeta, cella di terreno, molecola) dovrebbe esporre questo raggio.
- **Ancora e mira separate (modello OpenSpace):** l'ancora è il sistema di riferimento in cui la camera è espressa e che la camera segue nel moto. La mira è solo la direzione di sguardo. Tenendole distinte si può guardare una galassia vicina restando ancorati alla propria, senza saltare di sistema di riferimento.

### Lacune
- Non ho letto il sorgente dell'`OrbitalNavigator` di OpenSpace (404). Non posso quindi citare i nomi delle proprietà (ad esempio ZoomFriction, RotationalFriction, la distanza per seguire la rotazione dell'ancora) né i loro valori predefiniti. Li ricordo vagamente, ma restano da verificare.
- Non ho trovato una descrizione ufficiale di come SpaceEngine, Celestia o Universe Sandbox scelgono il bersaglio dello zoom. [RICORDATO] Celestia ha "Select" e "Center" (tasto C), "Go to" (tasto G) e "Follow" (F), e lo zoom con la rotella cambia la distanza dall'oggetto selezionato. Da verificare.

---

## 2. Velocità di zoom proporzionale alla distanza: come evitare sorpassi e inversioni

### Sintesi
Tutti gli strumenti esaminati rendono il passo **proporzionale alla distanza dalla superficie più vicina o dal fuoco** (s = c·d), lo limitano per frame e lo bloccano a una quota minima. La forma da usare è **moltiplicativa**: d ← d·k per tacca. Con questa forma non si attraversa mai il bersaglio e la direzione non può invertirsi. Gaia Sky ha corretto nel 2025 un difetto in cui la velocità si basava solo sul fuoco e ignorava un corpo più vicino: la soluzione è una miscela tra distanza dal fuoco e distanza dall'oggetto più vicino.

### Fonti citate
- **Cesium `handleZoom` [VERIFICATO, sorgente]:**
  - La velocità è `zoomRate = zoomFactor * minDistance`, con `zoomFactor = 5.0` e `distanceMeasure` uguale alla distanza dalla superficie.
  - Il valore è limitato a `[_minimumZoomRate = 20.0, _maximumZoomRate = 5906376272000.0]`; il commento indica la seconda come "distanza dal Sole a Plutone in metri".
  - Il passo per frame è `distance = zoomRate * rangeWindowRatio`, con `rangeWindowRatio = diff / canvas.clientHeight` limitato da `maximumMovementRatio = 0.1`. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)
- **Cesium, protezione contro l'attraversamento della superficie [VERIFICATO]:**
  - `approachingSurface = diff > 0`. Solo in avvicinamento si riserva una quota minima `minimumZoomDistance * percentage`, con `percentage = clamp(|unitPositionDotDirection|, 0.25, 1.0)`.
  - Il passo viene limitato in modo da non superare `minHeight`/`maxHeight`. Con il rilevamento collisioni attivo, lo zoom si ferma a circa 1 m dalla quota minima.
  - `minimumZoomDistance = 1.0` m, `maximumZoomDistance = ∞`, `inertiaZoom = 0.8`.
  - `adjustHeightForTerrain` riporta la camera a `globeHeight + minimumZoomDistance` se scende sotto `minimumCollisionTerrainHeight = 15000`. `_lastGlobeHeight` è smussato con fattore 0.1 per evitare salti mentre si caricano le tessere. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)
- **Gaia Sky, metodo vecchio e nuovo [VERIFICATO, blog ufficiale 2025]:**
  - Il metodo vecchio era `d_s = d_f · K` (distanza dal fuoco per una costante). Il difetto: vicino a Phobos, un "Go to" verso una stella lontana partiva con un passo enorme, "e veniamo scagliati fuori dal Sistema Solare" nel primo frame.
  - Il metodo nuovo è `d_s = mix(d_c, d_f, a)` con `a = (d_c − d_0)/(d_1 − d_0)`, dove d_c è la distanza dall'oggetto più vicino. Dentro d_0 conta solo d_c, oltre d_1 solo d_f, in mezzo si miscela.
  - La pagina non dà valori per K, d_0 e d_1, e i nomi "esterno/interno" dei due limiti sono ambigui.
  - In alternativa, `goToObjectSmooth(name, posDuration, orientationDuration)` usa transizioni con mappatura sigmoide (logit o logistica) invece della scalatura della velocità. [Gaia Sky, "Towards smoother interstellar trips"](https://gaiasky.space/news/2025/smooth-interstellar-trips/)
- **Gaia Sky, articolo [VERIFICATO]:** in modalità libera "la scalatura della velocità dipende dalla distanza dall'oggetto modello più vicino, oppure dall'origine del sistema di riferimento". [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Gaia Sky, comportamenti della camera [VERIFICATO, documentazione]:**
  - "Cinematic" usa "accelerazione e quantità di moto, per transizioni molto morbide". Secondo l'articolo si basa sui principi di steering behaviour di Reynolds.
  - "Non-cinematic", il predefinito dalla 1.5.0, è "molto più reattivo", senza accelerazione e con momento minimo.
  - In modalità astronave la potenza del motore cambia "a passi di potenze di dieci". [Camera modes](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/master/Camera-modes.html)
- **McCrae et al. [SNIPPET, dal brevetto]:** la relazione lineare s = c·d, con d ricavata dalla cubemap di profondità, preferendo la distanza minima. [US8665259B2](https://patents.google.com/patent/US8665259)
- **Studio SFU/York sul controllo automatico della velocità [SNIPPET]:** "nella maggior parte delle situazioni la distanza minima da qualunque punto visibile funziona meglio". [navspeed.pdf](https://vvise.iat.sfu.ca/user/data/papers/navspeed.pdf)
- **Google Earth Studio, "Logarithmic Altitude" [VERIFICATO, documentazione]:**
  - Muove la camera più veloce nello spazio e più lenta vicino al suolo, con una formula "quasi logaritmica" sull'altitudine, perché "a velocità costante" i punti di riferimento sembrano accelerare.
  - Il risultato "compensa i nostri limiti percettivi e appare perfettamente lineare/costante".
  - Nell'editor delle curve l'altitudine è su scala logaritmica.
  - Con tre o più keyframe possono comparire arresti o sobbalzi. [Earth Studio, Logarithmic adaptation](https://earth.google.com/studio/docs/advanced-features/logarithmic-adaptation)

### Inferenze
- **Perché "avanti va indietro" (ipotesi sui meccanismi, da verificare nel codice di stateyour):**
  - (a) **Sorpasso.** Il passo additivo `pos += dir*speed` supera il bersaglio P. Al frame dopo la direzione verso P è invertita, oppure la camera si trova "dentro" e la distanza ricomincia a crescere.
  - (b) **Cambio d'ancora a metà gesto.** La "cosa più vicina" passa da una galassia a un'altra che sta dietro; la direzione verso il nuovo bersaglio ha una componente all'indietro.
  - (c) **Velocità da un oggetto diverso da quello verso cui ci si muove.** È il difetto Gaia Sky 2025: velocità calcolata sul fuoco, moto verso un'altra cosa.
  - (d) **Errore di precisione o di riparentamento.** Al cambio di sistema di riferimento la posizione viene riespressa male e la camera "salta" (vedi sezione 3).
- **Formula consigliata (zoom logaritmico ancorato):**
  - Per ogni tacca: `d_new = d · exp(−k·Δ)`, con d = distanza da P meno il raggio di interazione dell'oggetto, `pos = P + (pos − P)·(d_new + R)/(d + R)`.
  - Così il moto è sempre lungo la retta camera–P e d resta sempre maggiore di zero.
  - La direzione **non può** invertirsi, e la velocità percepita è costante in log(d): un'"ottava" di scala ogni n tacche, come in Powers of Ten.
  - Va aggiunto un limite per frame in stile Cesium (`maximumMovementRatio`) e un pavimento `d_min` per livello.
- **Distanza per la velocità:** usare `min(d_ancora, d_oggetto_più_vicino_visibile)` con la miscela di Gaia Sky. Così un corpo che si attraversa (una luna, una stella in primo piano) rallenta lo zoom invece di essere scavalcato.
- **Inerzia:** decadimento esponenziale della velocità in log(d), simile a `inertiaZoom = 0.8` di Cesium. Va applicato **nello spazio logaritmico**, non in metri, altrimenti l'inerzia porta oltre il bersaglio.

### Lacune
- Non ho trovato numeri pubblicati su come SpaceEngine adatta la velocità alla superficie più vicina. [RICORDATO] La velocità si adatta automaticamente alla distanza dal corpo più vicino, con modificatori di velocità sulla tastiera. Da verificare sul manuale ufficiale.
- La formula esatta della "Logarithmic Altitude" di Earth Studio non è pubblicata.

---

## 3. Range numerici enormi: origine mobile, rendering relativo alla camera, depth logaritmico, sistemi di riferimento annidati

### Sintesi
Ci sono due famiglie di soluzioni, complementari:
- **Camera all'origine** (Gaia Sky "floating camera"): le trasformazioni si calcolano sulla CPU ad alta precisione e alla GPU arriva solo la matrice model-view relativa alla camera, in float32.
- **Scene graph dinamico** (OpenSpace, Axelsson 2017): la camera è attaccata al nodo saliente più vicino e le posizioni si calcolano rispetto a quel nodo, così la precisione si concentra dove guarda l'utente.

Per la profondità si usa il **depth logaritmico** oppure **float + reverse‑Z**, così non servono piani near/far.

### Fonti citate
- **Gaia Sky, floating camera [VERIFICATO, articolo §3.2]:**
  - L'idea è "tenere la camera all'origine del sistema di coordinate globale in ogni momento, traslando l'intero scene graph": un nodo in cima applica la traslazione per l'inverso della posizione della camera, aggiornata a ogni frame.
  - La model-view `Mmv` si calcola sulla CPU con l'aritmetica a precisione arbitraria di `java.math`, poi si invia alla GPU, dove gli shader restano a float32.
  - Esempio: la camera a 275,04 m dal telescopio Gaia in L2, cioè a circa 1,5·10¹¹ + 1,5·10⁹ m dall'origine. In float32 con coordinate globali i vertici tremolano, e il rendering "si rompeva del tutto" oltre 1200 km. Con la floating camera il problema sparisce.
  - Confronto con l'alternativa: il Dynamic Scene Graph "richiede che la camera venga spostata nello scene graph". [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Gaia Sky, cataloghi stellari [VERIFICATO]:** ogni catalogo è **un solo oggetto** nell'octree. Le stelle vanno alla GPU come VBO e la trasformazione della floating camera si applica allo shader, così non si trasforma ogni stella a ogni frame. [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Gaia Sky 3.1 [SNIPPET]:** il modulo di posizionamento è passato all'aritmetica a precisione arbitraria con un numero configurabile di cifre significative, "molto più lenta" di quella nativa. [Blog Gaia Sky 3.1](https://tonisagrista.com/blog/2021/whats-new-gaiasky-31x/)
- **Axelsson et al. 2017, "Dynamic Scene Graph" (EuroVis/CGF) [SNIPPET, abstract]:**
  - Un sistema di riferimento assegnato dinamicamente dà "la massima precisione numerica possibile per tutti gli oggetti salienti".
  - L'articolo analizza la propagazione degli errori con l'aritmetica a intervalli, individuando le cause di posizioni errate sullo schermo e di z-fighting.
  - Lavora **senza piani near/far**, mantenendo alta precisione di profondità con un depth buffer in virgola mobile. È implementato in OpenSpace. [Eurographics DL, doi 10.1111/cgf.13202](https://diglib.eg.org/handle/10.1111/cgf13202), [PDF dell'autore](https://alexanderbock.github.io/papers/eurovis17-axelsson-dynamic_scene_graph.pdf) (non scaricabile in questa sessione)
- **SpaceEngine [SNIPPET, changelog su aggregatore]:** un aggiornamento del 2016 cita uno **z-buffer fp32 invertito (reverse-Z)** che permette di avvicinarsi agli oggetti fino a pochi centimetri. [Changelog SpaceEngine (Softpedia)](https://games.softpedia.com/progChangelog/SpaceEngine-Changelog-131437.html). È una fonte secondaria.
- **Cesium [VERIFICATO]:** per calcolare la distanza dalla superficie Cesium usa sempre l'altezza sopra il globo (`getDistanceFromSurface = |globeHeight − height|`), non la distanza dall'origine. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)

### Inferenze
- **Per stateyour in JS:** i `Number` di JavaScript sono già float64 (≈15–16 cifre). Questo basta per un singolo livello, ma non per coprire da 10²⁶ m a 10⁻¹⁵ m (41 ordini di grandezza).
- **Soluzione consigliata, un ibrido:**
  1. **Gerarchia di frame annidati**: cosmo → filamento/ammasso → galassia → sistema stellare → pianeta → cella di superficie → campione di materia. Ogni nodo ha una posizione in float64 *relativa al genitore* e un raggio di interazione.
  2. La camera è sempre espressa nel frame del **nodo ancora**, come nel Dynamic Scene Graph.
  3. Per renderizzare un nodo si risale fino all'antenato comune con la camera e si somma il percorso in float64 (oppure in coppie double-double quando il percorso attraversa più di circa 10¹⁵ di rapporto di scala).
  4. Si invia alla GPU **solo** la posizione relativa alla camera in float32, come nella floating camera di Gaia Sky.
- **Mai coordinate globali assolute in metri.** Una procedura semplice e comune per il cambio d'ancora: quando la camera entra nella sfera di influenza di un figlio (per esempio dentro k·R_interazione del figlio) si riparenta. Si converte `pos_cam_nel_figlio = pos_cam_nel_genitore − pos_figlio`, in float64 e in un solo passo, poi si azzera la velocità residua in log(d) **o** la si riesprime. Serve **isteresi** (entrata a k₁·R, uscita a k₂·R con k₂ > k₁), così ai bordi la camera non oscilla tra genitore e figlio. È un'ipotesi progettuale: le soglie dell'articolo di Axelsson non le ho potute leggere.
- **Profondità in WebGL:**
  - three.js offre `logarithmicDepthBuffer: true` [RICORDATO]. Scrive `gl_FragDepth`, quindi disattiva l'early‑Z e costa sui fill rate alti.
  - Reverse‑Z con depth float32 richiede di cambiare la convenzione del clip space (`EXT_clip_control`). [RICORDATO] In WebGL2 è un'estensione recente, da verificare in Electron/Chromium; le versioni recenti di three.js hanno un'opzione `reverseDepthBuffer`, anche questa da verificare.
  - L'alternativa robusta, sempre disponibile, è il **rendering a più frustum** o a passate per livello: near/far separati per livello di scala, depth pulito tra una passata e l'altra, dal più lontano al più vicino. [RICORDATO] Cesium usa la stessa idea (multi-frustum) da prima di introdurre il depth logaritmico.
- **Tecnica GPU RTE/RTC [RICORDATO, Cozzi & Ring, "3D Engine Design for Virtual Globes", 2011]:** si spezza un float64 in due float32 (alto e basso) e si sottrae la posizione della camera nello shader. È utile per nuvole di punti (galassie, stelle) le cui coordinate stanno in un VBO grande e non si vogliono ricalcolare sulla CPU.

### Lacune
- Le soglie esatte di aggancio e sgancio della camera ai nodi nel Dynamic Scene Graph (multipli del raggio, "influence radius") non sono verificate: il PDF non era accessibile.
- Non ho trovato fonti primarie su come Universe Sandbox, NASA Eyes (motore web) e WorldWide Telescope gestiscono la precisione. [RICORDATO] Universe Sandbox usa un'origine mobile in Unity; Celestia usa coordinate a virgola fissa a 128 bit (`UniversalCoord`/BigFix); NASA Eyes è un'app WebGL che rende relativo alla camera. Da verificare.

---

## 4. Transizioni senza cuciture tra rappresentazioni a scale diverse

### Sintesi
La regola comune è **decidere e dissolvere in base alla dimensione sullo schermo** (angolo solido o raggio in pixel), non alla distanza in metri. Inoltre la dissolvenza deve avere un **intervallo** e non una soglia secca. Gaia Sky documenta il caso con una mappatura lineare dell'angolo solido θ da Θ a Θ+r verso l'opacità da 0 a 1, che elimina il "pop-in" degli ottanti.

### Fonti citate
- **Gaia Sky, LOD magnitudine–spazio (MS-LOD) [VERIFICATO, articolo §3.1]:**
  - L'octree contiene le stelle ordinate per magnitudine assoluta decrescente: le più luminose stanno nei livelli alti e restano sempre visibili.
  - Un ottante i è visibile se `θ_i ≥ Θ` (angolo solido rispetto alla camera) e se interseca il frustum. Se non è visibile, i suoi figli non vengono visitati.
  - Il criterio secco "produce pop-in". Per questo "un meccanismo di smussatura del LOD" fa apparire gli ottanti in dissolvenza: θ_i = Θ corrisponde a 0, θ_i = Θ + r a 1, con r usato come maschera nello shader delle stelle. [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Gaia Sky, stelle vicine [VERIFICATO]:** "se la stella è abbastanza vicina, viene ombreggiata con un billboard texturizzato". Lo scene graph contiene "Fade node" per dissolvere gruppi di oggetti. [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Gaia Sky, terreno [VERIFICATO]:** Gaia Sky non implementa il LOD del terreno né usa height map, perché si concentra sui cataloghi. Per il passaggio dal pianeta al suolo non è un modello da seguire. [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)
- **Cesium [VERIFICATO]:** anche le *modalità* dello zoom cambiano a soglie fisse di quota (3000 m, 1.000.000 m). È un esempio di comportamento che cambia per scala, ma la quota usata per la soglia si aggiorna in modo continuo. [Sorgente Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Scene/ScreenSpaceCameraController.js)

### Inferenze
- **Catena per stateyour, con soglie in pixel da tarare (non pubblicate da una fonte):**
  - Galassia: punto o sprite (meno di qualche px) → billboard/impostore con texture procedurale (decine di px) → nuvola di particelle stellari + volume di polvere e gas in ray marching (oltre circa ¼ dello schermo).
  - Stella: punto con alone → disco → sfera con granulazione.
  - Pianeta: punto illuminato con la fase → sfera con texture globale → quadtree o cubo-sfera con terreno → tessere locali → campioni di materia.
- **Ogni passaggio va fatto con:**
  - (1) un intervallo di dissolvenza su log(raggio in px), ad esempio da 1× a 2× la soglia;
  - (2) **coerenza dei dati**: la rappresentazione grossolana deve essere *calcolata dalla stessa funzione procedurale* di quella fine. Colore medio dello sprite uguale alla media della nuvola; luminosità integrata conservata (flusso totale costante durante la dissolvenza, non opacità sommate);
  - (3) isteresi per non sfarfallare.
- **Conservazione del flusso:** nella dissolvenza tra sprite e nuvola di stelle, la somma delle luminosità delle due rappresentazioni deve essere costante: `L_sprite·(1−a) + L_nuvola·a = L_totale`. Altrimenti a metà transizione si vede un lampo o un buco. È un'inferenza progettuale, non presa da una fonte.
- **Morfing geometrico in stile geomorphing [RICORDATO, pratica comune nei sistemi di terreno]:** i vertici del livello fine partono dalla posizione interpolata del livello grossolano e scivolano alla posizione vera man mano che lo schermo si riempie. Così il terreno non "scatta".
- **Volume contro impostore per le galassie [RICORDATO, SpaceEngine]:** SpaceEngine passa da sprite a modelli volumetrici fatti di "puff" o ray marching man mano che ci si avvicina. È da verificare sul suo blog.

### Lacune
- Non ho trovato soglie pubblicate e verificate in pixel o in gradi per gli altri strumenti (SpaceEngine, OpenSpace, Celestia, NASA Eyes). Il valore di Θ di Gaia Sky è "definito dall'utente" e l'articolo non ne dà uno predefinito.

---

## 5. Aiuti per non perdersi: voli "vai a", breadcrumb, barre di scala, etichette che svaniscono

### Sintesi
Il "vai a" ben fatto è un **volo con zoom out, traslazione e zoom in** su una traiettoria ottima nello spazio (u, w) di van Wijk & Nuij, con ρ ≈ √2, oppure con una sigmoide sulla distanza logaritmica (Gaia Sky). OpenSpace offre tipi di percorso (`AvoidCollision`, `ZoomOutOverview`, `Linear`) e un fattore di arrivo legato al raggio del bersaglio. Per passare da una galassia all'altra, il modello giusto è `ZoomOutOverview`/van Wijk: si sale finché entrambe sono nell'inquadratura, poi si scende.

### Fonti citate
- **van Wijk & Nuij 2003, "Smooth and efficient zooming and panning" (InfoVis 2003, pp. 15–23) [VERIFICATO tramite Reach & North]:**
  - Il modello u,w ha un parametro ρ che regola il compromesso tra zoom e traslazione. Nello studio con gli utenti "il valore preferito di ρ era 1,42, circa √2".
  - Reach & North riformulano le equazioni (sinh, cosh, asinh, log) "per ridurre l'errore numerico eliminando somme e differenze che causavano cancellazione catastrofica". [Reach & North 2018, arXiv:1801.09358](https://arxiv.org/pdf/1801.09358)
- **Limiti di van Wijk & Nuij secondo Reach & North [VERIFICATO]:**
  - Nelle animazioni di van Wijk & Nuij "la velocità salta bruscamente da e verso zero" agli estremi, e ogni interruzione (cambio di bersaglio a metà volo) introduce una discontinuità di velocità.
  - Ci sono prove preliminari che le animazioni senza discontinuità di velocità rendono più facile seguire gli oggetti.
  - Reach & North propongono una versione liscia e interrompibile basata sulla geometria iperbolica, con ρ = 1 equivalente al modello iperbolico. [Reach & North 2018](https://arxiv.org/pdf/1801.09358)
- **D3 `d3.interpolateZoom` [SNIPPET]:** implementa van Wijk & Nuij con il parametro `rho` di curvatura (predefinito √2; vicino a 0 diventa quasi lineare) in JavaScript, quindi è riusabile o portabile in 3D. [d3-interpolate zoom](https://d3js.org/d3-interpolate/zoom)
- **Porting JS di Polymaps [SNIPPET]:** ρ = 1,42 come valore predefinito, con lunghezza del percorso `S = (r1 − r0)/ρ`. Il formato del gist non è verificato sull'articolo originale. [Gist](https://gist.github.com/600164)
- **OpenSpace, percorsi automatici [VERIFICATO, documentazione]:**
  - `AvoidCollision`, il predefinito, aggira i nodi vicini con interpolazione sferica della rotazione.
  - `ZoomOutOverview` "allontana la camera per rendere visibili i bersagli rilevanti, poi si avvicina", senza rilevamento collisioni.
  - `Linear` va in linea retta. È anche il fallback quando la distanza è molto lunga o la camera parte dentro la sfera del bersaglio.
  - `AvoidCollisionWithLookAt` tiene il bersaglio in vista, ma "può produrre rotazioni rapide".
  - Impostazioni: "Speed scale"; "Arrival distance factor", che "viene moltiplicato per la sfera di bounding del bersaglio per calcolare la distanza finale di arrivo"; "Include roll", disattivo di default, che rimuove il rollio dall'interpolazione. [Automatic Flight Paths](https://docs.openspaceproject.com/latest/using-openspace/navigation/camera-paths.html)
- **Gaia Sky:** `goToObjectSmooth(name, posDuration, orientationDuration)` usa una sigmoide logit/logistica invece della velocità scalata, perché "produce un viaggio più piacevole". [Blog Gaia Sky 2025](https://gaiasky.space/news/2025/smooth-interstellar-trips/)
- **Gaia Sky, registrazione dei percorsi [VERIFICATO]:** i "camera file" salvano a ogni frame tempo, posizione, direzione e vettore up, e si riproducono dall'interfaccia o dallo scripting. Si possono usare come "tour" guidati. [Sagristà et al. 2019](https://vcg.iwr.uni-heidelberg.de/static/publications/Sagrista2019gaiaSky.pdf)

### Inferenze
- **Muoversi tra galassie (secondo problema degli utenti).** Si fa un volo van Wijk in spazio log:
  1. si sale nel frame genitore (ammasso o filamento) finché entrambe le galassie stanno nell'inquadratura;
  2. si trasla;
  3. si scende;
  4. **si riparenta l'ancora** a metà percorso, nel punto più alto (dove entrambe hanno raggio angolare piccolo e il cambio di frame non si vede).

  Per evitare gli scatti agli estremi segnalati da Reach & North, si aggiunge un easing ai bordi, oppure si usa la loro formulazione. Durante il volo la rotella deve **interrompere** il volo in modo morbido: si eredita la velocità in log(d).
- **Aiuti suggeriti** (non tutti verificati negli strumenti; sono pratiche diffuse):
  - **Breadcrumb di gerarchia**, ad esempio "Filamento 3 › Galassia NGC-… › Stella … › Pianeta b › Superficie", cliccabili per un volo verso il livello.
  - **Barra di scala** in potenze di dieci con un riferimento umano: la "potenza di dieci" corrente e un oggetto noto della stessa scala, come in Htwins.
  - **Pulsante casa** e "risali di un livello", in pratica un volo `ZoomOutOverview` verso il genitore.
  - **Etichette** con opacità legata al raggio angolare dell'oggetto, con la stessa rampa Θ→Θ+r di Gaia Sky.
  - **Auto‑orientamento**: l'up allineato al polo dell'ancora o al piano galattico, e il rollio rimosso durante i voli ("Include roll = false" di OpenSpace).
  - **Mini‑mappa** del livello genitore con la posizione della camera.

### Lacune
- Non ho verificato su fonti primarie gli aiuti di NASA Eyes, WorldWide Telescope, Celestia e SpaceEngine. [RICORDATO] WWT ha "tour" registrabili e un pannello di esplorazione per collezioni. Celestia ha "Go to" (G) che vola fino a qualche raggio dall'oggetto con interpolazione esponenziale della distanza. NASA Eyes ha pulsanti per la scala "dal Sole alla Terra" e collegamenti a tour. Da verificare.

---

## 6. Come i film e le app alla Powers of Ten tengono ogni scala leggibile e interessante

### Sintesi
In questa sessione non ho raccolto fonti primarie su queste opere. Quello che segue viene dalla memoria e va verificato prima di citarlo come fatto. Il principio comune è un **ritmo costante in log(scala)**, una **cornice quadrata con l'indicazione della scala** e **un oggetto riconoscibile per ogni ordine di grandezza**; tra due scale interessanti, l'"ombra" vuota resta breve o si accelera.

### Fonti citate
- **Google Earth Studio [VERIFICATO]:** una velocità costante in metri appare in accelerazione vicino al suolo. Per sembrare lineare, l'altitudine va animata su una scala quasi logaritmica. È lo stesso principio di Powers of Ten. [Earth Studio](https://earth.google.com/studio/docs/advanced-features/logarithmic-adaptation)
- **van Wijk & Nuij / Reach & North [VERIFICATO]:** il costo percettivo dello zoom è proporzionale al logaritmo del fattore di scala, e il modello u,w si fonda su questo. [Reach & North 2018](https://arxiv.org/pdf/1801.09358)

### Inferenze
- **[RICORDATO] Powers of Ten (Charles e Ray Eames, 1977):**
  - Parte da un picnic sul lungolago di Chicago a 1 m di inquadratura. Ogni 10 secondi il campo si allarga di 10 volte, fino a circa 10²⁴ m.
  - Poi si torna indietro rapidamente e si scende nella mano fino al nucleo di un atomo di carbonio (circa 10⁻¹⁶ m).
  - Un riquadro e un indicatore di potenza di dieci restano sempre visibili; la narrazione nomina l'oggetto di ogni scala.
- **[RICORDATO] Cosmic Eye (Danail Obreschkow, circa 2011–2012):** zoom continuo dall'occhio di una donna all'universo osservabile e ritorno, con dissolvenze incrociate tra immagini reali di scale diverse.
- **[RICORDATO] Scale of the Universe (Cary e Michael Huang, "Htwins", 2010/2012):** un cursore dalla lunghezza di Planck all'universo osservabile. Gli oggetti di dimensione simile stanno affiancati con etichetta e misura. Si attraversa "per confronto" e non per moto nello spazio.
- **[RICORDATO] Universcale (Nikon):** una sequenza di oggetti noti lungo un asse di scala, con testi descrittivi.
- **Per stateyour:**
  - (1) tarare la rotella su un numero fisso di tacche per decade;
  - (2) garantire almeno un "oggetto ancora" leggibile per decade;
  - (3) mostrare la potenza di dieci corrente con un oggetto di paragone;
  - (4) nelle decadi "vuote" (spazio intergalattico, interstellare, tra pianeta e atmosfera, tra cristallo e atomo) usare segnaposto procedurali: griglie, gusci di scala, campi di stelle di fondo, reticoli. Evitano lo schermo nero, che fa perdere l'orientamento.

### Lacune
- Mancano citazioni verificate su durate, tempi e scelte grafiche dei film e delle app alla Powers of Ten. Servono il sito ufficiale Eames Office, la pagina di Obreschkow per Cosmic Eye, htwins.net e la pagina Nikon Universcale.
- Mancano fonti primarie su NASA Eyes on the Solar System, WorldWide Telescope, Universe Sandbox e SpaceEngine (manuale o blog) per tutte le domande.
