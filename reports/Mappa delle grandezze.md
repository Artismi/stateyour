# Mappa delle grandezze

> «In molti casi una formula dipende da variabili che dipendono da altre formule; tutto può partire dal basso o
> dall'alto ma deve essere collegato, calcolato in modo continuo, correlato.»

Questo documento è **generato**: il grafo sta in `src/camera/grandezze.js` (un elenco di oggetti che un programma può leggere), le misure le fa `test/test_grandezze.mjs` su un campione di pianeti veri del programma, e `node test/test_grandezze.mjs --rapporto` riscrive queste pagine. Ultima misura: 2026-11-11 22:09 UTC, in 88 secondi.

Il lavoro non cambia la fisica dei moduli: **dichiara** (chi dipende da chi, da quale fonte), **misura** (se è vero) e **riferisce** (ciò che non torna, con i numeri e il punto del codice).

## In breve

- **Il grafo**: 81 grandezze, 292 archi («A dipende da B»), 36 fonti (le funzioni vere che le calcolano), 3 cicli dichiarati, 34 soglie lette nel codice. Degli archi: 214 passano da una legge che si può richiamare, 28 da una storia di eventi (il disco, la galassia: si controllano solo per correlazione), 45 stanno sulla superficie (dichiarati, non misurati: una superficie costa dieci secondi), 3 da una formula scritta in linea, 2 sono «attesi» (la fisica li chiede, il codice dichiaratamente non li ha ancora).
- **Archi misurati in più**: ogni fonte dichiara anche che cosa riceve dal programma (458 archi «possibili»); facendo variare quegli ingressi, 212 muovono davvero un'uscita e sono entrati nella colonna «dipende da» (dopo «e, misurato»), 221 no.
- **Il campione**: 634 pianeti veri, presi dalla fonte unica degli eventi (`campioneDiMondi`), fino al livello del pianeta.
- **Una fonte**: 46 grandezze ricalcolate dalla loro fonte; 12 copie controllate; 19 «seconde vie» (un'altra funzione che calcola la stessa cosa). **Doppioni che danno un numero diverso: 14.**
- **Continuità**: 413 archi misurati ad anello aperto e 210 ad anello chiuso (clima e aria risolti insieme), con 1289 scansioni e 114630 chiamate alle fonti. **Soglie di comodo che fanno saltare qualcosa: 12**; soglie fisiche vere toccate: 13; salti che nessuna soglia dichiarata spiega: 15; salite ripide ma continue: 16.
- **Correlazione**: **fili staccati: 9**; **dipendenze non dichiarate: 2**.
- **Dal basso**: 12 casi, 129 deduzioni; in 129 l'intervallo dedotto contiene il valore vero.
- **Scritti a mano**: 179 numeri che hanno già un nome e 25 formule riscritte in linea, in 52 moduli.

Come leggere le tabelle: sono ordinate per gravità (la prima riga è la più pesante). «Dove» è il file e la riga di oggi; le righe si ritrovano da sole cercando il testo, quindi restano giuste anche se il codice si sposta.

## 1. Il grafo, per livelli

Ogni riga è una grandezza: come si chiama nel grafo, che cos'è, da quale funzione viene (la sua **fonte**), da che cosa dipende, e dove la si legge in un oggetto vero del programma (`P` è il pianeta e `S` la stella di `sistema()` in `cosmo.js`, `G` la galassia di `cosmo()`, `U` la superficie). «Passo» è la profondità nel grafo: 0 non dipende da niente, 1 dipende solo da grandezze di passo 0, e così via; le grandezze di un ciclo stanno allo stesso passo.

### Cosmo e galassia

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **cosmo.picco** | l'altezza del picco del campo iniziale da cui nasce la galassia | σ | 0 | **evento** (esce dalla fonte unica del caso) | — | `G.peso` |
| **galassia.alone** | la massa dell'alone di materia oscura | M☉ | 1 | `galassie.js:303 massaAlone` | cosmo.picco ↑ | `G.forma.alone.massa` |
| **galassia.stelle** | la massa in stelle | M☉ | 2 | `galassie.js:553 formaGalassia` (storia di eventi) | galassia.alone ↑ | `G.forma.massaStelle` |
| **galassia.gas** | la massa di gas freddo rimasto | M☉ | 2 | `galassie.js:553 formaGalassia` (storia di eventi) | galassia.alone ↑ | `G.forma.massaGas` |
| **galassia.supernove** | il ritmo delle supernove oggi | 1/anno | 3 | `galassie.js:553 formaGalassia` (storia di eventi) | galassia.stelle ↑, galassia.gas ↑ | `G.forma.ritmoSN.totale` |

### La stella

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **stella.massaNascita** | la massa con cui la stella è nata | M☉ | 0 | **evento** (esce dalla fonte unica del caso) | — | `S.massaNascita` o `S.massa` |
| **stella.eta** | gli anni dalla nascita della stella (e del pianeta) | anni | 0 | **evento** (esce dalla fonte unica del caso) | — | `S.eta`; copie: `P.interno.eta` |
| **stella.metalli** | i metalli della stella (Z, il Sole = 1) | Z☉ | 3 | `galassie.js:770 stelleGalassia` (storia di eventi) | galassia.stelle ↑, stella.eta ↓ | `S.Z` |
| **stella.vita** | quanto dura la sequenza principale | anni | 4 | `stelle.js:658 stella` | stella.massaNascita ↓, stella.metalli | — (il programma non la tiene: chi la vuole la ricalcola) |
| **stella.stato** | in vita, gigante, o ciò che ne resta | stato | 5 | `galassie.js:770 stelleGalassia` (storia di eventi) | stella.eta, stella.vita, stella.massaNascita | `S.stato` |
| **stella.massa** | la massa di oggi | M☉ | 6 | `galassie.js:770 stelleGalassia` (storia di eventi) | stella.massaNascita ↑, stella.stato | `S.massa`; copie: `P.Mstella` |
| **stella.luminosita** | la luce della stella oggi | W | 7 | `stelle.js:658 stella` | stella.massa ↑, stella.metalli, stella.eta ↑ | `P.Lw` |
| **stella.temperatura** | la temperatura della superficie della stella | K | 7 | `stelle.js:658 stella` | stella.massa ↑, stella.metalli, stella.eta | `S.T`; copie: `P.Tstella` |
| **stella.raggio** | il raggio della stella | m | 7 | `stelle.js:658 stella` | stella.massa ↑, stella.metalli, stella.eta | `S.r` × 4,49e12 |
| **stella.vento** | la massa che la stella perde col vento | kg/s | 8 | `risalita.js:493 ventoStellare` | stella.raggio ↑, stella.eta ↓; *e, misurato:* stella.luminosita, stella.temperatura | — (il programma non la tiene: chi la vuole la ricalcola) |

### L'orbita

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **orbita.distanza** | il semiasse dell'orbita | m | 1 | `disco.js:146 formaPianeti` (storia di eventi) | stella.massaNascita ↑ | `P.aM`; copie: `P.a` |
| **orbita.eccentricita** | quanto l'orbita è allungata | 1 | 7 | `disco.js:146 formaPianeti` (storia di eventi) | pianeta.massa ↑, pianeta.tipo | `P.eccentricita` |
| **orbita.anno** | il periodo dell'orbita | s | 7 | `orbite.js:80 periodo` | orbita.distanza ↑, stella.massa ↓ | `P.anno` |
| **orbita.flusso** | la luce della stella che arriva al pianeta | W/m² | 8 | `leggi.js:491 clima` | stella.luminosita ↑, orbita.distanza ↓ | `P.clima.bilancio.arriva` × 4 |

### Il corpo del pianeta e la sua rotazione

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **pianeta.massa** | la massa del pianeta | kg | 4 | `disco.js:146 formaPianeti` (storia di eventi) | stella.massaNascita ↑, stella.metalli ↑, orbita.distanza ↑ | `P.massaKg` |
| **pianeta.ferro** | la parte di ferro nei solidi | 1 | 2 | `disco.js:146 formaPianeti` (storia di eventi) | orbita.distanza ↓ | `P.composizione.ferro` |
| **pianeta.acqua** | la parte di acqua (o ghiaccio) nei solidi | 1 | 2 | `disco.js:146 formaPianeti` (storia di eventi) | orbita.distanza ↑, stella.massaNascita | `P.composizione.acqua` o `P.composizione.ghiaccio` |
| **pianeta.involucro** | il velo di idrogeno ed elio rimasto dal disco (parte della massa) | 1 | 5 | `disco.js:146 formaPianeti` (storia di eventi) | pianeta.massa, orbita.distanza | `P.involucro` |
| **pianeta.tipo** | roccioso, ghiacciato o gassoso | tipo | 6 | `disco.js:146 formaPianeti` (storia di eventi) | pianeta.acqua, pianeta.involucro, pianeta.massa | `P.tipo` |
| **pianeta.raggio** | il raggio del pianeta | m | 6 | `disco.js:97 raggioPianeta` | pianeta.massa ↑, pianeta.ferro ↓, pianeta.acqua ↑, pianeta.involucro ↑ | `P.raggioM` |
| **pianeta.gravita** | la gravità alla superficie | m/s² | 7 | `leggi.js:491 clima` | pianeta.massa ↑, pianeta.raggio ↓ | `P.clima.g` |
| **pianeta.giorno** | la durata del giorno | s | 9 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza, stella.massa, orbita.eccentricita, stella.eta, pianeta.involucro, pianeta.risonanza, pianeta.bloccato; *e, misurato:* orbita.anno, pianeta.tipo, pianeta.acqua | `P.giorno`; copie: `P.giro.giorno` |
| **pianeta.obliquita** | l'inclinazione dell'asse | ° | 7 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza, stella.massa, stella.eta, pianeta.involucro; *e, misurato:* orbita.eccentricita, orbita.anno, pianeta.tipo, pianeta.acqua | `P.obliquita`; copie: `P.giro.obliquita`, `P.clima.giro.obliquita` |
| **pianeta.bloccato** | mostra sempre la stessa faccia alla stella | sì/no | 8 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza ↓, stella.massa, orbita.eccentricita, stella.eta ↑, pianeta.involucro | `P.bloccato`; copie: `P.giro.bloccato`, `P.clima.giro.bloccato` |
| **pianeta.risonanza** | la risonanza tra giorno e anno a cui la marea l'ha fermato (3:2, 2:1…), se c'è | rapporto | 8 | `rotazione.js:103 rotazione` | orbita.eccentricita | `P.risonanza` |
| **pianeta.schiacciamento** | quanto la rotazione lo schiaccia ai poli | 1 | 10 | `cosmo.js:167 sistema` (formula in linea: non ha una funzione sua) | pianeta.giorno ↓, pianeta.raggio ↑, pianeta.massa ↓ | `P.schiacciamento` |
| **pianeta.k2Q** | quanto il pianeta dissipa la marea (k₂/Q) | 1 | 12 | `lune.js:88 k2QPianeta` | pianeta.tipo, acqua.stato | — (il programma non la tiene: chi la vuole la ricalcola) |
| **pianeta.lune** | quante lune ha | numero | 7 | `lune.js:353 lune` (storia di eventi) | pianeta.massa ↑, orbita.distanza ↑, pianeta.tipo | `P.lune.length` |

### L'interno: calore, crosta, vulcani, dinamo

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **interno.nucleo** | il raggio del nucleo di ferro (parte del raggio) | 1 | 7 | `geologia.js:27 interno` | pianeta.ferro ↑, pianeta.massa, pianeta.raggio; *e, misurato:* pianeta.tipo | `P.interno.nucleo` |
| **interno.calore** | il calore che esce dall'interno | W/m² | 8 | `geologia.js:27 interno` | pianeta.massa ↑, pianeta.raggio, stella.eta ↓, stella.metalli ↑, pianeta.ferro, pianeta.acqua, orbita.eccentricita ↑; *e, misurato:* pianeta.tipo, stella.luminosita, orbita.distanza, stella.massa, stella.massaNascita | `P.interno.q` |
| **interno.dinamo** | il nucleo è ancora liquido e rimescolato | sì/no | 9 | `geologia.js:27 interno` | interno.calore, interno.nucleo, pianeta.raggio, stella.eta; *e, misurato:* pianeta.massa, pianeta.ferro, pianeta.acqua, pianeta.tipo, orbita.distanza | `P.interno.dinamo` |
| **interno.rossby** | il numero di Rossby del nucleo (se la rotazione ordina la dinamo) | 1 | 10 | `geologia.js:27 interno` | interno.calore ↑, pianeta.giorno ↑, interno.nucleo, interno.dinamo; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita | `P.interno.rossby` |
| **interno.dipolo** | il campo è a due poli (se no, a molti e debole) | sì/no | 11 | `geologia.js:27 interno` | interno.rossby, interno.dinamo; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, orbita.distanza, pianeta.giorno | `P.interno.dipolo` |
| **interno.campo** | il campo magnetico alla superficie | T | 12 | `geologia.js:27 interno` | interno.calore, interno.nucleo, interno.dinamo, interno.dipolo, pianeta.raggio; *e, misurato:* pianeta.massa, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita, pianeta.giorno | `P.B0`; copie: `P.interno.B0` |
| **interno.tettonica** | il regime della crosta | regime | 9 | `geologia.js:27 interno` | interno.calore, pianeta.acqua, pianeta.massa, clima.temperatura *(atteso)*; *e, misurato:* pianeta.raggio, pianeta.ferro, pianeta.tipo, stella.eta, stella.luminosita, orbita.distanza | `P.interno.tettonica` |
| **interno.vulcani** | quanti grandi vulcani attivi | numero | 10 | `geologia.js:27 interno` | interno.calore ↑, interno.tettonica; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.luminosita, orbita.distanza | `P.interno.vulcani` |
| **interno.argon** | l'argon del potassio decaduto salito nell'aria (peso della colonna) | Pa | 10 | `risalita.js:449 gasRadiogenici` | stella.eta ↑, pianeta.massa, pianeta.raggio, interno.tettonica, stella.luminosita, pianeta.ferro | — (il programma non la tiene: chi la vuole la ricalcola) |

### L'aria: gas, pressione, serra

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **aria.gasTenuti** | quante specie di gas la gravità trattiene (su sei) | numero | 8 | `leggi.js:491 clima` | pianeta.massa ↑, pianeta.raggio ↓, stella.luminosita ↓, orbita.distanza ↑ | `P.clima.tenuti.length` |
| **aria.pressione** | la pressione dell'aria al suolo | Pa | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli, pianeta.massa ↑, pianeta.raggio, pianeta.involucro, aria.co2Ciclo, interno.argon, stella.vento ↓ *(atteso)*; *e, misurato:* stella.eta, stella.luminosita, orbita.distanza | `P.clima.pressione`; copie: `P.atmosfera.pressione` |
| **aria.CO2** | la parte di anidride carbonica nell'aria (in volume) | 1 | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli, aria.co2Ciclo; *e, misurato:* pianeta.massa, pianeta.raggio, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.CO2` |
| **aria.H2O** | la parte di vapore d'acqua nell'aria (in volume) | 1 | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.H2O` |
| **aria.CH4** | la parte di metano nell'aria (in volume) | 1 | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.CH4` |
| **aria.H2** | la parte di idrogeno nell'aria (in volume) | 1 | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli, pianeta.involucro; *e, misurato:* pianeta.massa, pianeta.raggio, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.H2` |
| **aria.N2** | la parte di azoto nell'aria (in volume) | 1 | 11 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, stella.metalli; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.N2` |
| **aria.riducente** | l'aria cede idrogeno (riducente) o lo prende (ossidante) | sì/no | 12 | `chimica.js:303 atmosfera` | aria.H2, aria.CH4, aria.CO2, aria.H2O, aria.gasTenuti; *e, misurato:* pianeta.massa, pianeta.acqua, clima.temperatura, acqua.stato | `P.atmosfera.riducente` |
| **aria.serra** | lo spessore ottico dell'aria per l'infrarosso (τ) | 1 | 11 | `chimica.js:392 serra` | aria.CO2 ↑, aria.H2O ↑, aria.CH4 ↑, aria.H2, aria.N2, aria.pressione ↑, pianeta.gravita ↓, clima.temperatura | `P.clima.tau` |
| **aria.co2Ciclo** | la CO₂ a cui le rocce ne prendono quanta i vulcani ne danno | Pa | 11 | `chimica.js:690 co2DelCiclo` | clima.temperatura ↓, interno.calore ↑, interno.vulcani, acqua.mare ↑, acqua.ghiaccio ↑, interno.tettonica; *e, misurato:* pianeta.ferro | `P.clima.co2Ciclo` |
| **aria.vaporeSaturo** | la pressione del vapore d'acqua sopra il mare o il ghiaccio | Pa | 12 | `leggi.js:100 vaporeSaturo` | clima.temperatura ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### Il clima: temperatura, albedo, nuvole

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **clima.temperatura** | la temperatura media alla superficie | K | 11 | `leggi.js:491 clima` | orbita.flusso ↑, clima.albedo ↓, aria.serra ↑, clima.trasporto, pianeta.obliquita, pianeta.bloccato, stella.luminosita ↑, orbita.distanza ↓; *e, misurato:* pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, aria.pressione, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.T`; copie: `P.clima.Taria` |
| **clima.equilibrio** | la temperatura che avrebbe senz'aria, con il suo albedo | K | 12 | `leggi.js:491 clima` | orbita.flusso ↑, clima.albedo ↓, stella.luminosita ↑, orbita.distanza ↓; *e, misurato:* pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.Teq` |
| **clima.albedo** | la parte di luce rimandata indietro | 1 | 11 | `leggi.js:491 clima` | acqua.ghiaccio ↑, clima.nuvole ↑, acqua.mare, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.albedo` |
| **clima.nuvole** | la parte di cielo coperta | 1 | 11 | `leggi.js:491 clima` | acqua.mare ↑, aria.pressione ↑; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.raggio, acqua.inSuperficie, aria.serra | `P.clima.nuvole` |
| **clima.trasporto** | il calore che aria e mare portano dal caldo al freddo | W/m²/K | 11 | `leggi.js:491 clima` | aria.pressione, pianeta.giorno, pianeta.raggio, pianeta.gravita, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, acqua.inSuperficie, orbita.anno, pianeta.obliquita, pianeta.bloccato, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.D` |
| **clima.vento** | il vento al suolo, dalla stessa legge dell'aria | m/s | 12 | `leggi.js:491 clima` | aria.pressione, pianeta.giorno, pianeta.raggio, pianeta.gravita, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, acqua.inSuperficie, orbita.anno, pianeta.obliquita, pianeta.bloccato, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.vento` |
| **clima.assorbita** | la luce che il pianeta assorbe, in media | W/m² | 11 | `leggi.js:491 clima` | orbita.flusso ↑, clima.albedo ↓; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.bilancio.assorbita` |

### L'acqua: quanta, in che stato, quanto mare

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **acqua.inSuperficie** | l'acqua che sta in superficie | kg | 7 | `leggi.js:112 acquaInSuperficie` | pianeta.massa ↑, pianeta.acqua ↑, pianeta.tipo | `P.interno.acquaKg` |
| **acqua.stato** | ghiaccio, liquida, vapore | stato | 11 | `leggi.js:491 clima` | clima.temperatura, aria.pressione, clima.assorbita; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, aria.serra | `P.clima.acqua` |
| **acqua.mare** | la parte del pianeta coperta dal mare | 1 | 11 | `leggi.js:491 clima` | acqua.inSuperficie ↑, pianeta.raggio ↓, interno.tettonica, acqua.stato; *e, misurato:* stella.luminosita, orbita.distanza, aria.pressione, aria.serra | `P.clima.mare` |
| **acqua.ghiaccio** | la parte del pianeta coperta dal ghiaccio | 1 | 11 | `leggi.js:491 clima` | clima.temperatura ↓, acqua.mare; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, acqua.inSuperficie, pianeta.giorno, aria.pressione, aria.serra | `P.clima.ghiaccio` |
| **acqua.ebollizione** | a che temperatura bolle l'acqua a quella pressione | K | 12 | `leggi.js:93 ebollizione` | aria.pressione ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### Lo spazio vicino e i mattoni della vita

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **spazio.magnetopausa** | fin dove il campo ferma il vento della stella (raggi del pianeta) | raggi | 13 | `risalita.js:493 ventoStellare` | interno.campo ↑, stella.vento ↓, orbita.distanza ↑; *e, misurato:* stella.luminosita, stella.temperatura, stella.eta | `P.magnetopausa` |
| **vita.energia** | l'energia che arriva alla chimica dell'aria (la Terra = 1) | Terra | 13 | `risalita.js:537 energiaPerLaChimica` | stella.luminosita ↑, orbita.distanza ↓, stella.temperatura ↑, interno.campo, aria.pressione, stella.vento; *e, misurato:* pianeta.gravita, pianeta.raggio, stella.eta, acqua.mare | `P.energiaChimica.relativa` |
| **vita.HCN** | quanto rende lì la reazione che fa acido cianidrico | 1 | 14 | `chimica.js:610 prebiotica` | vita.energia ↑, aria.H2, aria.CH4, aria.CO2, aria.N2, aria.H2O | `P.prebiotica.HCN` |
| **vita.formaldeide** | quanto rende lì la reazione che fa formaldeide (zuccheri) | 1 | 14 | `chimica.js:610 prebiotica` | vita.energia ↑, aria.H2, aria.CH4, aria.CO2, aria.N2, aria.H2O | `P.prebiotica.formaldeide` |
| **vita.autocatalisi** | gli zuccheri si copiano da soli (formosio) | sì/no | 15 | `chimica.js:610 prebiotica` | vita.formaldeide, acqua.stato | `P.prebiotica.autocatalisi` |
| **vita.radiceMassima** | l'età più antica che l'albero della vita può avere | Ma | 12 | `albero_vita.js:99 radiceMassima` | acqua.stato, stella.eta ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### La superficie: pioggia, erosione, mare (dichiarate, fuori dal campione)

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **superficie.temperatura** | la carta delle temperature | K | 12 | `geologia.js:204 climaSuperficie` (superficie) | clima.temperatura, aria.serra, clima.trasporto, orbita.flusso, pianeta.obliquita, pianeta.bloccato, meteo.nuvole | `U.cl.media` |
| **meteo.pioggia** | la carta delle piogge | mm/anno | 13 | `meteo.js:485 meteoPianeta` (superficie) | superficie.temperatura, aria.pressione, pianeta.giorno, pianeta.gravita, pianeta.raggio, pianeta.bloccato, pianeta.obliquita, acqua.stato | `U.cl.meteo.pioggia` |
| **meteo.nuvole** | la carta delle nuvole | 1 | 12 | `meteo.js:485 meteoPianeta` (superficie) | superficie.temperatura, aria.pressione, pianeta.giorno, pianeta.gravita, acqua.stato | `U.cl.meteo.nuvole` |
| **superficie.denudazione** | quanto l'erosione abbassa le terre | m/anno | 14 | `geologia.js:421 erosione` (superficie) | meteo.pioggia ↑, interno.tettonica, pianeta.gravita | `U.se.denudazione` |
| **superficie.fango** | il sedimento che i fiumi portano al mare | kg/anno | 15 | `geologia.js:421 erosione` (superficie) | superficie.denudazione ↑, pianeta.raggio | `U.se.fangoAlMare` |
| **mare.frazione** | la parte del pianeta sotto il mare, sulla carta vera | 1 | 12 | `mare.js:414 mare` (superficie) | acqua.inSuperficie ↑, pianeta.raggio, interno.tettonica, acqua.stato | `U.mare.frazioneMare` |
| **mare.pCO2** | la CO₂ con cui il mare è in equilibrio | bar | 15 | `mare.js:414 mare` (superficie) | aria.CO2, aria.pressione, aria.co2Ciclo, interno.calore, superficie.denudazione | `U.mare.pCO2` |
| **mare.salinita** | i sali sciolti nel mare | g/kg | 16 | `mare.js:414 mare` (superficie) | acqua.inSuperficie ↓, superficie.fango, superficie.denudazione, interno.calore, stella.eta | `U.mare.salinitaMedia` |
| **mare.pH** | l'acidità del mare | pH | 17 | `mare.js:414 mare` (superficie) | mare.pCO2 ↓, mare.salinita, superficie.temperatura | `U.mare.pH` |
| **mare.calcite** | la saturazione del calcare nel mare | Ω | 18 | `mare.js:414 mare` (superficie) | mare.pH ↑, mare.salinita, superficie.temperatura | `U.mare.saturazione.calcite` |

(↑: cresce con l'ingresso; ↓: cala; *atteso*: la fisica lo chiede, il codice non lo ascolta ancora.)

### I cicli dichiarati

Una dipendenza circolare non è un errore se qualcuno la chiude cercando il punto in cui le grandezze tornano uguali a sé stesse. La prova fallisce se trova un ciclo che non è in questo elenco.

| ciclo | perché | chi lo chiude | grandezze |
|---|---|---|---|
| **ghiaccio-albedo** | più freddo, più ghiaccio e (con un mare) altre nuvole, più luce rimandata, più freddo; lo stato dell'acqua decide se il mare c'è | `leggi.js:491 clima` | clima.temperatura, acqua.ghiaccio, clima.albedo, clima.assorbita, acqua.stato, acqua.mare, clima.nuvole, clima.equilibrio, clima.trasporto, clima.vento |
| **clima-aria** | la temperatura decide che cosa gela, piove o finisce nel calcare; l'aria che resta decide la serra, e la serra la temperatura | `chimica.js:426 climaEAria` | clima.temperatura, acqua.stato, acqua.mare, acqua.ghiaccio, aria.pressione, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2, aria.riducente, aria.serra, aria.co2Ciclo, clima.trasporto, clima.vento, clima.nuvole, clima.albedo, clima.assorbita, clima.equilibrio, interno.argon |
| **clima-meteo** | le nuvole e i venti veri cambiano la temperatura della carta, che cambia nuvole e venti (il secondo giro di climaSuperficie) | `geologia.js:204 climaSuperficie` | superficie.temperatura, meteo.nuvole, meteo.pioggia |

## 2. Doppioni: la stessa grandezza con due numeri

Tre controlli. (a) Ogni grandezza, ricalcolata dalla sua fonte con gli ingressi letti dallo stesso pianeta, deve ridare il numero che il programma tiene. (b) Se la tiene in due posti dello stesso oggetto, i due posti devono essere uguali. (c) Se un'altra funzione calcola la stessa cosa per conto suo, deve dare lo stesso numero. Sotto, solo ciò che NON coincide.

| # | grandezza | che cosa non coincide | in quanti mondi | scarto massimo | esempio | dove | per sanarla |
|---|---|---|---|---|---|---|---|
| 1 | **aria.pressione** (la pressione dell'aria al suolo) | tenuta due volte: `P.clima.pressione` e `P.atmosfera.pressione` | 10 su 634 | cambia categoria | ∞ contro 100000 (cosmo 2/galassia 17/stella 454/pianeta 1) | `cosmo.js sistema / chimica.js climaEAria` | per i giganti il clima dice «infinita» e l'aria «1 bar» (il livello a cui la calcola): dare un nome diverso alle due cose |
| 2 | **stella.luminosita** (la luce della stella oggi) | la luce con cui disco.js mette la linea della neve e gonfia i veli di gas: è quella a metà della vita, non quella di oggi (dichiarato lì) | 605 su 605 | 36% | 1,262e22 dal programma, 1,970e22 dall'altra via (cosmo 1/galassia 5/stella 827/pianeta 0) | `Sis.disco.L (la fonte: stelle.js:658 stella)` | far leggere «stella.luminosita» dalla sua fonte invece di ricalcolarla |
| 3 | **aria.co2Ciclo** (la CO₂ a cui le rocce ne prendono quanta i vulcani ne danno) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 3 su 10 | 95% | 3234 tenuto, 67180 ricalcolato (cosmo 1/galassia 45/stella 2235/pianeta 2) | `chimica.js:690 co2DelCiclo` | la CO₂ del ciclo che resta scritta nel clima è quella dell'ultimo giro della ricerca (fatta con il ghiaccio di un dimezzamento intermedio e con il mare «atteso» delle leggi di riserva), non quella che il mare e il ghiaccio finali danno. Per sanarla: ricalcolarla una volta alla fine, con lo stato trovato |
| 4 | **clima.temperatura** (la temperatura media alla superficie) | tenuta due volte: `P.clima.T` e `P.clima.Taria` | 606 su 624 | 18% | 4,003 contro 4,863 (cosmo 1/galassia 34/stella 782/pianeta 2) | `cosmo.js sistema / chimica.js climaEAria` | è la tolleranza del risolutore (si ferma quando aria e clima distano meno di un grado, o dopo cinque giri): stringerla, o ricalcolare l'aria alla temperatura finale |
| 5 | **acqua.ebollizione** (a che temperatura bolle l'acqua a quella pressione) | mare.js ha una sua ebollizione(), dalle tabelle di chimica.js | 37 su 624 | 66% | 69,04 dal programma, 205 dall'altra via (cosmo 2/galassia 62/stella 599/pianeta 8) | `mare.js:369 ebollizione (la fonte: leggi.js:93 ebollizione)` | far leggere «acqua.ebollizione» dalla sua fonte invece di ricalcolarla |
| 6 | **stella.luminosita** (la luce della stella oggi) | due formule a seconda del ramo: per una nana bianca la luce è 4πR²σT⁴, scritta in linea in cosmo.js (sistema) | 29 su 634 | — | quando stella.stato non è in vita o gigante rossa | `stelle.js:658 stella` | una funzione sola (in stelle.js) che dà luce, temperatura e raggio per ogni stato della stella |
| 7 | **stella.temperatura** (la temperatura della superficie della stella) | due formule a seconda del ramo: per una nana bianca la temperatura viene dal raffreddamento (Mestel), scritto in linea in galassie.js (stelleGalassia) | 29 su 634 | — | quando stella.stato non è in vita o gigante rossa | `stelle.js:658 stella` | una funzione sola (in stelle.js) che dà luce, temperatura e raggio per ogni stato della stella |
| 8 | **stella.raggio** (il raggio della stella) | due formule a seconda del ramo: per una stella morta il raggio è quello che dà stelle.js fine(), preso in galassie.js | 29 su 634 | — | quando stella.stato non è in vita o gigante rossa | `stelle.js:658 stella` | una funzione sola (in stelle.js) che dà luce, temperatura e raggio per ogni stato della stella |
| 9 | **aria.CO2** (la parte di anidride carbonica nell'aria (in volume)) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 22 su 624 | 4% | 4,116e-5 tenuto, 4,286e-5 ricalcolato (cosmo 1/galassia 40/stella 2415/pianeta 1) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |
| 10 | **aria.N2** (la parte di azoto nell'aria (in volume)) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 22 su 624 | 1,5% | 0,00219 tenuto, 0,002223 ricalcolato (cosmo 1/galassia 40/stella 2415/pianeta 1) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |
| 11 | **aria.H2** (la parte di idrogeno nell'aria (in volume)) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 11 su 624 | 1,6% | 0,004523 tenuto, 0,004451 ricalcolato (cosmo 1/galassia 34/stella 1343/pianeta 6) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |
| 12 | **aria.CH4** (la parte di metano nell'aria (in volume)) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 11 su 624 | 0,15% | 0,2296 tenuto, 0,2293 ricalcolato (cosmo 2/galassia 46/stella 218/pianeta 0) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |
| 13 | **aria.H2O** (la parte di vapore d'acqua nell'aria (in volume)) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 11 su 624 | 0,1% | 0,478 tenuto, 0,4776 ricalcolato (cosmo 2/galassia 46/stella 218/pianeta 0) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |
| 14 | **aria.pressione** (la pressione dell'aria al suolo) | la fonte, richiamata con gli stessi ingressi, non ridà il valore tenuto | 2 su 624 | 9,8e-4% | 8,070e7 tenuto, 8,070e7 ricalcolato (cosmo 1/galassia 34/stella 1343/pianeta 6) | `chimica.js:303 atmosfera` | climaEAria tiene una memoria degli equilibri chimici arrotondando la temperatura a 5 K: l'aria che resta è quella di una temperatura vicina, non della sua. Per sanarla: togliere l'arrotondamento dalla chiave della memoria (o rifare l'equilibrio all'ultimo giro) |

Coincidono invece ovunque (entro 10⁻⁹): 39 grandezze ricalcolate dalla fonte; 10 copie; 17 seconde vie (stella.temperatura da mondoDi, stella.raggio da mondoDi, orbita.flusso da mondoDi, pianeta.massa da mondoDi, pianeta.acqua da acquaInSuperficie, pianeta.raggio da mondoDi, pianeta.gravita da mondoDi, interno.calore da mondoDi, interno.campo da mondoDi, acqua.stato da statoAcqua, acqua.mare da mareAtteso, acqua.mare da mondoDi, aria.vaporeSaturo da pressioneVapore, clima.temperatura da mondoDi, clima.equilibrio da temperaturaEquilibrio, clima.equilibrio da mondoDi, clima.assorbita da mondoDi).

Non controllate fuori dal dominio in cui il grafo sa richiamare la fonte (i giganti di gas per aria e interno, le stelle morte per ciò che dipende dal vento): pianeta.raggio (29 mondi), interno.nucleo (10 mondi), interno.calore (10 mondi), aria.pressione (10 mondi), aria.CO2 (10 mondi), aria.H2O (10 mondi), aria.CH4 (10 mondi), aria.H2 (10 mondi), aria.N2 (10 mondi), spazio.magnetopausa (29 mondi), vita.energia (29 mondi).

**Senza una funzione propria**: pianeta.schiacciamento (formula scritta dentro `sistema()` di `cosmo.js`: non si può richiamare, quindi non si può controllare). **Mai tenute in un oggetto** (chi le vuole le ricalcola ogni volta): stella.vita, stella.vento, pianeta.k2Q, interno.argon, acqua.ebollizione, aria.vaporeSaturo, vita.radiceMassima.

## 3. Soglie nette: dove un passo dell'1% fa saltare l'uscita

Ogni ingresso è stato fatto variare lungo il suo intervallo fisico, a passi dell'1%, con tutto il resto fermo; dove un'uscita cambia di più del 30% in un passo (o cambia categoria) si è stretto il passo fino a un millesimo: se il salto resta è un **gradino**, se si scioglie è solo una salita ripida. Ogni gradino è stato attribuito alla soglia del codice che in quel punto viene attraversata. Le soglie sono dichiarate nel grafo (`SOGLIE`) una per una, lette nei moduli, con la loro specie: **fisica** (la natura salta lì: l'acqua gela) o **di comodo** (un `if` su un tipo, un numero di taglio).

### Soglie di comodo

| # | soglia su | che cosa fa | archi che fa saltare | il salto peggiore | dove | per sanarla |
|---|---|---|---|---|---|---|
| 1 | **aria.gasTenuti** (quando cambia) | un gas resta o fugge con un taglio netto del parametro di Jeans a 25; la fuga vera è continua (esponenziale) | 24 | pianeta.raggio→aria.gasTenuti: 1 → 0 (100%) | `leggi.js:81` | il flusso di fuga di Jeans integrato sull'età, al posto del sì/no |
| 2 | **pianeta.tipo** (quando cambia) | tre tipi di pianeta decidono troppo: acqua tutta fuori o al 4%, clima a parte per i giganti, k₂/Q, interno; la composizione continua c'è già | 22 | pianeta.tipo→acqua.stato: ghiaccio → liquida (cambia categoria) | `disco.js:255` | usare le frazioni di gas e di ghiaccio (continue) al posto del nome del tipo |
| 3 | **acqua.ghiaccio** (quando cambia) | il ghiaccio si conta a fasce intere di latitudine (16) e con un taglio netto a 271 K: avanza a gradini | 18 | acqua.inSuperficie→acqua.ghiaccio: 0 → 0,002456 (100%) | `leggi.js:466` | contare il ghiaccio con la stessa curva morbida (tanh) che fa l'albedo, e interpolare il bordo dentro la fascia |
| 4 | **interno.tettonica** (quando cambia) | il regime della crosta è un nome messo sulla mobilità (continua, da 0 a 1) tagliata a 0,5, e sul «fonde / non fonde» | 17 | interno.calore→interno.tettonica: a placche → ferma (cambia categoria) | `storia.js:432` | far uscire da interno() la mobilità e la massa che fonde (storia.js le ha già) e farle leggere a chi oggi legge il nome |
| 5 | **aria.riducente** (quando cambia) | riducente sì/no: decide se i minerali sono ossidati | 7 | aria.H2O→aria.riducente: false → true (cambia categoria) | `chimica.js:373` | usare il potere riducente (0…1), che c'è già |
| 6 | **interno.vulcani** (quando cambia) | i vulcani si contano a interi (uno ogni 0,02 W/m², convenzione rimasta) e almeno uno appena il mantello fonde: il primo accende di colpo il ciclo del carbonio in cosmo.js | 4 | interno.calore→interno.vulcani: 1 → 0 (100%) | `storia.js:432` | passare a climaEAria la massa che fonde (o il calore) così com'è, senza l'interruttore «vulcani > 0» |
| 7 | **acqua.mare** a 0,02 | le nuvole attese ci sono solo se il mare copre più del 2% | 4 | pianeta.involucro→acqua.mare: 1 → 0 (100%) | `leggi.js:179` | far crescere le nuvole con l'evaporazione vera (mare × pressione di vapore), senza soglia |
| 8 | **aria.pressione** a 10000 | le nuvole attese ci sono solo sopra 0,1 bar | 4 | aria.pressione→clima.nuvole: 0 → 0,675 (100%) | `leggi.js:179` | una legge continua della pressione (quanta acqua l'aria regge) |
| 9 | **pianeta.involucro** a 0,01 | con più dell'1% di gas il giro del pianeta è «dato dal gas», sotto «dagli urti»: giorno e asse saltano | 3 | pianeta.involucro→pianeta.bloccato: true → false (cambia categoria) | `rotazione.js:59` | sommare i due momenti angolari (gas e urti) pesati, invece di sceglierne uno |
| 10 | **interno.argon** a 0 | l'argon resta tutto o fugge tutto: lo stesso taglio di Jeans a 25, rifatto in risalita.js | 3 | stella.luminosita→interno.argon: 88,46 → 0 (100%) | `risalita.js:454` | come per i gas tenuti: il flusso di fuga integrato sull'età |
| 11 | **aria.H2** a 0,01 | con più dell'1% di idrogeno l'idrogeno «non manca mai» per la formaldeide; e l'aria è «riducente» solo se ne cede più dell'1% | 2 | pianeta.massa→aria.riducente: true → false (cambia categoria) | `chimica.js:612` | contare l'idrogeno libero come gli altri ingredienti |
| 12 | **interno.vulcani** a 0 | il ciclo del carbonio si accende solo se interno() conta almeno un vulcano: prima di quello il calore dell'interno non entra nel clima | 1 | interno.vulcani→aria.co2Ciclo: 0 → 1,000e7 (100%) | `cosmo.js:233` | passare a climaEAria il calore (o la massa che fonde) così com'è |

Dichiarate di comodo ma **non toccate** da nessuna scansione (stanno su grandezze che la prova non riesce a far variare, o non fanno saltare più del 30%): clima.temperatura a 200 (`leggi.js:103`); aria.serra a 10000 (`leggi.js:503`); pianeta.acqua a 0,2 (`disco.js:255`); interno.tettonica (`leggi.js:345`); vita.formaldeide a 0,01 (`chimica.js:609`); spazio.magnetopausa a 1,3 (`risalita.js:497`); aria.co2Ciclo a 1,00e7 (`chimica.js:694`).

### Salti che nessuna soglia dichiarata spiega

Qui il grafo non sa dire perché l'uscita salta: o è una soglia del codice che non è ancora stata letta e dichiarata, o è un salto del metodo (una ricerca che cambia ramo, un conto a fasce).

| # | arco | il salto | in quanti mondi | esempio | dove |
|---|---|---|---|---|---|
| 1 | **pianeta.acqua→aria.H2O** | 100% | 3 su 10 | tra 2,164e-4 e 2,164e-4: 0 → 3,602e-5 (cosmo 2/galassia 6/stella 1755/pianeta 0) | `chimica.js:303` |
| 2 | **acqua.mare→aria.co2Ciclo** | 100% | 1 su 10 | tra 0,8222 e 0,8223: 4,311e-4 → 0,04907 (cosmo 2/galassia 46/stella 1649/pianeta 1) | `chimica.js:690` |
| 3 | **clima.temperatura→aria.co2Ciclo** | 100% | 1 su 10 | tra 287,3 e 287,3: 0,05643 → 0,001396 (cosmo 2/galassia 46/stella 1649/pianeta 1) | `chimica.js:690` |
| 4 | **acqua.ghiaccio→aria.co2Ciclo** | 99% | 1 su 10 | tra 0,09433 e 0,09434: 4,311e-4 → 0,04893 (cosmo 2/galassia 46/stella 1649/pianeta 1) | `chimica.js:690` |
| 5 | **interno.calore→aria.co2Ciclo** | 99% | 2 su 10 | tra 0,008499 e 0,008499: 4,311e-4 → 0,04893 (cosmo 2/galassia 46/stella 1649/pianeta 1) | `chimica.js:690` |
| 6 | **pianeta.massa→interno.calore** | 91% | 3 su 10 | tra 1,287e23 e 1,287e23: 2,908e-4 → 2,425e-5 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `geologia.js:27` |
| 7 | **stella.luminosita→interno.calore** | 90% | 2 su 10 | tra 1,153e26 e 1,153e26: 0,02164 → 0,002089 (cosmo 1/galassia 5/stella 1104/pianeta 0) | `geologia.js:27` |
| 8 | **orbita.distanza→interno.calore** | 90% | 1 su 10 | tra 9,246e10 e 9,246e10: 0,002089 → 0,02164 (cosmo 1/galassia 5/stella 1104/pianeta 0) | `geologia.js:27` |
| 9 | **pianeta.raggio→interno.calore** | 81% | 5 su 10 | tra 2,151e6 e 2,151e6: 0,0178 → 0,003459 (cosmo 1/galassia 40/stella 1147/pianeta 0) | `geologia.js:27` |
| 10 | **pianeta.ferro→interno.calore** | 73% | 3 su 10 | tra 0,5459 e 0,5459: 0,002137 → 0,007823 (cosmo 1/galassia 40/stella 1147/pianeta 0) | `geologia.js:27` |
| 11 | **interno.nucleo→interno.rossby** | 60% | 2 su 10 | tra 0,4416 e 0,4416: 3,155 → 7,799 (cosmo 1/galassia 40/stella 1147/pianeta 0) | `geologia.js:27` |
| 12 | **aria.pressione→clima.trasporto** | 56% | 1 su 5 | tra 7,599e6 e 7,599e6: 0,006711 → 0,01525 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `leggi.js:491` |
| 13 | **pianeta.raggio→interno.campo** | 48% | 1 su 10 | tra 4,551e6 e 4,551e6: 1,981e-6 → 1,040e-6 (cosmo 2/galassia 46/stella 2327/pianeta 0) | `geologia.js:27` |
| 14 | **interno.nucleo→interno.campo** | 42% | 2 su 10 | tra 0,4416 e 0,4416: 3,717e-7 → 6,363e-7 (cosmo 1/galassia 40/stella 1147/pianeta 0) | `geologia.js:27` |
| 15 | **clima.temperatura→clima.trasporto** | 33% | 1 su 5 | tra 17,58 e 17,58: 4,286e-4 → 2,885e-4 (cosmo 2/galassia 60/stella 2398/pianeta 5) | `leggi.js:491` |

### Cicli che saltano da uno stato stabile all'altro

Né fisica dichiarata né taglio di comodo: l'uscita appartiene a un ciclo dichiarato, e nel punto del salto saltano insieme altre grandezze dello stesso ciclo.

| ciclo | che cosa succede | archi su cui si vede | il salto peggiore | chi lo chiude |
|---|---|---|---|---|
| **ghiaccio-albedo** | il ghiaccio e l'albedo hanno due stati stabili (palla di neve, mare aperto): passando dall'uno all'altro tutte le grandezze del ciclo saltano insieme (fisica vera: Budyko); ma può saltare anche il conto, che parte da una temperatura scelta | 13 | orbita.distanza→clima.trasporto: 0,0475 → 0,002004 (96%), tra 6,488e9 e 6,489e9 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `leggi.js:491` |
| **clima-aria** | clima e aria hanno più stati stabili (gelato, con il mare, senz'acqua) e il risolutore li prova in un ordine: passando dall'uno all'altro tutte le grandezze del ciclo saltano insieme. Non si distingue qui il salto vero (il mare che bolle) dal risolutore che cambia ramo | 7 | stella.luminosita→aria.serra: 182,5 → 0 (100%), tra 7,374e28 e 7,380e28 (cosmo 2/galassia 6/stella 1755/pianeta 0) | `chimica.js:426` |

### Soglie fisiche vere (per confronto)

| soglia su | che cosa succede | archi che fa saltare | dove |
|---|---|---|---|
| **acqua.stato** (quando cambia) | lo stato dell'acqua cambia (fase): con lui cambiano il mare, l'aria (ciò che piove o resta), k₂/Q | 89 | `leggi.js:101` |
| **interno.dinamo** (quando cambia) | la dinamo si accende o si spegne: il galleggiamento nel nucleo è positivo e il Reynolds magnetico passa 50 (soglia della teoria); spenta, il campo è il fondo di 10⁻⁹ T | 33 | `storia.js:319` |
| **pianeta.bloccato** (quando cambia) | il blocco mareale è uno stato vero: la luce cade sempre sulla stessa faccia | 18 | `rotazione.js:142` |
| **clima.temperatura** a 273 | l'acqua gela (transizione di fase) | 15 | `leggi.js:104` |
| **clima.temperatura** a 268 | la neve e il ghiaccio coprono la terra (268 K) e il mare (266 K): il salto dell'albedo è vero, ma il gelo ha qui un terzo e un quarto numero oltre a 273,15 e 271 | 13 | `leggi.js:132` |
| **interno.rossby** a 0,12 | sopra Ro = 0,12 la dinamo perde il dipolo (soglia misurata nelle simulazioni: Olson e Christensen 2006); di quanto cala il campo (dieci volte) è però scelto | 8 | `storia.js:430` |
| **clima.temperatura** a dipende dal mondo | l'acqua bolle a quella pressione (transizione di fase) | 5 | `leggi.js:104` |
| **pianeta.risonanza** (quando cambia) | la rotazione resta agganciata a una risonanza con l'orbita (1:1, 3:2, 2:1…, come Mercurio): al crescere dell'eccentricità passa dall'una all'altra e il giorno salta | 4 | `rotazione.js:134` |
| **interno.dipolo** (quando cambia) | la dinamo perde il dipolo (vedi Rossby): il campo alla superficie cala di dieci volte | 3 | `storia.js:431` |
| **stella.massa** a dipende dal mondo | sotto la massa minima l'idrogeno non si accende: è una nana bruna (luce e raggio seguono un'altra legge) | 3 | `stelle.js:661` |
| **clima.temperatura** a 647 | il punto critico dell'acqua: liquido e vapore non si distinguono più | 2 | `leggi.js:102` |
| **stella.massaNascita** a dipende dal mondo | sotto la massa minima l'idrogeno non si accende: è una nana bruna, e la sua «vita» è infinita | 1 | `stelle.js:661` |
| **aria.pressione** a 611 | il punto triplo dell'acqua: sotto, niente liquido | 1 | `leggi.js:103` |

### Salite ripide ma continue

Più del 30% in un passo dell'1%, ma stringendo il passo il salto si scioglie: la legge è continua, solo molto sensibile.

| arco | in un passo dell'1% | esempio |
|---|---|---|
| **pianeta.raggio→pianeta.obliquita** | 100% | tra 3,947e6 e 3,979e6: 1,364 → 0 |
| **orbita.distanza→pianeta.obliquita** | 100% | tra 3,124e10 e 3,148e10: 0 → 1,729 |
| **stella.massa→pianeta.obliquita** | 100% | tra 2,793 e 2,818: 0,6116 → 0 |
| **acqua.mare→aria.co2Ciclo** | 100% | tra 0,9844 e 0,9922: 4033 → 1,000e7 |
| **orbita.distanza→pianeta.giorno** | 100% | tra 5,930e10 e 5,977e10: 1,382e9 → 2,055e6 |
| **stella.massa→pianeta.giorno** | 97% | tra 2,793 e 2,818: 1,081e6 → 3,660e7 |
| **pianeta.massa→pianeta.giorno** | 93% | tra 1,999e25 e 2,011e25: 3,473e7 → 2,472e6 |
| **pianeta.raggio→pianeta.giorno** | 92% | tra 1,817e6 e 1,832e6: 7,868e5 → 9,534e6 |
| **stella.eta→pianeta.obliquita** | 91% | tra 4,395e7 e 4,421e7: 0,4573 → 0 |
| **clima.temperatura→aria.co2Ciclo** | 88% | tra 301,2 e 303,8: 18,34 → 2,206 |
| **stella.eta→pianeta.giorno** | 74% | tra 7,523e9 e 7,568e9: 4,452e6 → 1,708e7 |
| **pianeta.ferro→interno.rossby** | 74% | tra 0,3812 e 0,3866: 0,04075 → 0,01075 |
| **pianeta.massa→pianeta.obliquita** | 66% | tra 7,110e26 e 7,154e26: 0,04228 → 0,372 |
| **acqua.ghiaccio→aria.co2Ciclo** | 53% | tra 0,3594 e 0,3672: 3,289e6 → 7,003e6 |
| **aria.serra→clima.assorbita** | 45% | tra 255,4 e 257,4: 0,853 → 1,546 |
| **pianeta.ferro→interno.calore** | 39% | tra 0,3812 e 0,3866: 0,19 → 0,1152 |

## 4. Fili staccati: dovrebbero essere legate e non lo sono

Quattro specie, dalla più grave. **Dichiarato, ma l'uscita non si muove**: il grafo dice che B dipende da A, ma facendo variare A su tutto il suo intervallo B resta identica in ogni mondo provato: la fonte non legge A (o lo legge da un'altra parte). **Atteso dalla fisica, assente nel codice**: archi messi nel grafo apposta come «attesi», presi dall'inventario dei fili mancanti; la prova conferma che non ci sono. **Segno**: il grafo dichiara un verso e la fonte ne mostra un altro. **Nel campione**: la dipendenza diretta c'è, ma tra i pianeti veri le due grandezze vanno al contrario (un altro ingresso, legato al primo, pesa di più) o non si vedono affatto.

| # | da → a | specie | nota | dove | per sanarla |
|---|---|---|---|---|---|
| 1 | **stella.raggio → stella.vento** | detto nel grafo, ma l'uscita non si muove | risalita.js non legge il raggio della stella: lo ricava da luce e temperatura (mondoDi: √(L/4πσT⁴)); il vento sente quelle due, non S.r | `risalita.js:493 ventoStellare` | far leggere «stella.raggio» alla fonte di «stella.vento», o togliere l'arco dal grafo se la dipendenza non è voluta |
| 2 | **stella.metalli → aria.pressione** | detto nel grafo, ma l'uscita non si muove | carbonio, azoto e zolfo dovrebbero seguire i metalli della stella; ma per i pianeti solidi atmosfera() fa l'inventario con le abbondanze del Sole (abbondanze(1)) qualunque sia la stella: Z conta solo per chi ha tenuto il velo di idrogeno del disco | `chimica.js:303 atmosfera` | far leggere «stella.metalli» alla fonte di «aria.pressione», o togliere l'arco dal grafo se la dipendenza non è voluta |
| 3 | **stella.metalli → aria.CO2** | detto nel grafo, ma l'uscita non si muove | carbonio, azoto e zolfo dovrebbero seguire i metalli della stella; ma per i pianeti solidi atmosfera() fa l'inventario con le abbondanze del Sole (abbondanze(1)) qualunque sia la stella: Z conta solo per chi ha tenuto il velo di idrogeno del disco | `chimica.js:303 atmosfera` | far leggere «stella.metalli» alla fonte di «aria.CO2», o togliere l'arco dal grafo se la dipendenza non è voluta |
| 4 | **stella.metalli → aria.H2O** | detto nel grafo, ma l'uscita non si muove | carbonio, azoto e zolfo dovrebbero seguire i metalli della stella; ma per i pianeti solidi atmosfera() fa l'inventario con le abbondanze del Sole (abbondanze(1)) qualunque sia la stella: Z conta solo per chi ha tenuto il velo di idrogeno del disco | `chimica.js:303 atmosfera` | far leggere «stella.metalli» alla fonte di «aria.H2O», o togliere l'arco dal grafo se la dipendenza non è voluta |
| 5 | **stella.metalli → aria.N2** | detto nel grafo, ma l'uscita non si muove | carbonio, azoto e zolfo dovrebbero seguire i metalli della stella; ma per i pianeti solidi atmosfera() fa l'inventario con le abbondanze del Sole (abbondanze(1)) qualunque sia la stella: Z conta solo per chi ha tenuto il velo di idrogeno del disco | `chimica.js:303 atmosfera` | far leggere «stella.metalli» alla fonte di «aria.N2», o togliere l'arco dal grafo se la dipendenza non è voluta |
| 6 | **clima.temperatura → interno.tettonica** | atteso dalla fisica, assente nel codice | una superficie rovente non fa placche (Venere): la storia termica usa la temperatura della superficie nuda, non quella del clima (storia.js lo dichiara: si può passare con Tsuperficie) | `geologia.js:27 interno` | scrivere il filo (vedi «Come farlo emergere») |
| 7 | **stella.vento → aria.pressione** | atteso dalla fisica, assente nel codice | l'aria che il vento della stella porta via (risalita.js la calcola: ariaPersa; nessuno la toglie) | `chimica.js:303 atmosfera` | scrivere il filo (vedi «Come farlo emergere») |
| 8 | **galassia.stelle → stella.metalli** | dichiarato (esce da una storia), ma nel campione non si vede | ρ = 0,046 su 84 sistemi; atteso + | `galassie.js:770 stelleGalassia` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |
| 9 | **stella.massaNascita → pianeta.massa** | dichiarato (esce da una storia), ma nel campione non si vede | correlazione parziale 0,031 (tolti 2 altri ingressi; semplice 0,078) su 634 mondi; atteso + | `disco.js:146 formaPianeti` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |

## 5. Dipendenze non dichiarate: legate senza che il grafo lo dica

Due modi di trovarle. **Alla fonte**: si sposta una grandezza che il grafo NON mette tra gli ingressi di una fonte, e l'uscita cambia: la funzione legge qualcosa che non è dichiarato. **Nel campione**: due grandezze che nel grafo non hanno niente in comune (né un cammino dall'una all'altra, né un antenato) risultano legate tra i pianeti veri.

| # | da → a | come si vede | quanto | dove | per sanarla |
|---|---|---|---|---|---|
| 1 | **acqua.stato → vita.energia** | alla fonte | 0,163 → 0,1605 (1,5%; 3 prove) | `risalita.js:537 energiaPerLaChimica` | dichiarare l'arco nel grafo, se la lettura è voluta; se no toglierla dalla funzione |
| 2 | **clima.assorbita → vita.energia** | alla fonte | 0,163 → 0,1639 (0,56%; 2 prove) | `risalita.js:537 energiaPerLaChimica` | dichiarare l'arco nel grafo, se la lettura è voluta; se no toglierla dalla funzione |

## 6. Dal basso: che cosa una cosa vista in basso dice di ciò che sta in alto

Il grafo si percorre anche al contrario: `impone(uscita, valore osservato, ingresso, mondo)` dà l'intervallo dell'ingresso compatibile con ciò che si è osservato (tutto il resto com'è in quel mondo, oppure dichiarato ignoto con il suo intervallo). Per i contenuti che `bolle.js` sa già giudicare (acqua liquida, ghiaccio) l'osservazione di partenza è quella di `chiede` (regola 5): `chiedeDalBasso` la traduce in grandezze del grafo, senza soglie nuove. La prova: partendo da un pianeta vero, l'intervallo dedotto deve contenere il suo valore vero. «Larghezza» dice quanto l'osservazione stringe: la parte dell'intervallo possibile che resta.

| osservazione in basso | che cosa impone a | il vero è dentro | larghezza | un esempio |
|---|---|---|---|---|
| acqua liquida in superficie → temperatura (bolle.js chiede) → luce della stella, con serra e pressione note | **stella.luminosita** | 8 su 8 | 15% | 273,1…400,8 ⇒ 3,209e25…1,774e26; vero 5,543e25 |
| acqua liquida in superficie → temperatura (bolle.js chiede) → luce della stella, con serra e pressione note | **orbita.distanza** | 8 su 8 | 15% | 273,1…400,8 ⇒ 3,531e10…8,304e10; vero 6,318e10 |
| acqua liquida in superficie → temperatura → serra dell'aria (τ), con la luce nota | **aria.serra** | 8 su 8 | 16% | 273,1…400,8 ⇒ 0,682…15,94; vero 1,886 |
| acqua liquida in superficie → temperatura → luce della stella, SENZA sapere la serra (tutta quella del campione) | **stella.luminosita** | 5 su 5 | 47% | 273,1…400,8 ⇒ 1,000e22…4,743e26; vero 5,543e25 |
| acqua liquida in superficie → distanza dalla stella, ad anello chiuso (clima e aria insieme: la fascia abitabile di quel pianeta) | **orbita.distanza** | 4 su 4 | 23% | liquida ⇒ 5,272e10…7,025e11; vero 6,318e10 |
| ghiaccio in superficie → temperatura (bolle.js chiede) → luce della stella | **stella.luminosita** | 8 su 8 | 70% | 0…273,1 ⇒ 1,000e22…1,728e26; vero 8,194e23 |
| campo magnetico osservato (±10%) → durata del giorno (la rotazione ordina la dinamo) ed età | **pianeta.giorno** | 8 su 8 | 59% | 8,178e-7…9,995e-7 ⇒ 7200…2,090e5; vero 83770 |
| campo magnetico osservato (±10%) → durata del giorno (la rotazione ordina la dinamo) ed età | **stella.eta** | 8 su 8 | 4,5% | 8,178e-7…9,995e-7 ⇒ 7,320e9…1,001e10; vero 8,520e9 |
| campo magnetico acceso (dinamo: sì) → nucleo liquido: raggio minimo ed età massima del pianeta | **pianeta.raggio** | 8 su 8 | 55% | true ⇒ 1,500e6…1,860e7 (2 pezzi); vero 5,029e6 |
| campo magnetico acceso (dinamo: sì) → nucleo liquido: raggio minimo ed età massima del pianeta | **stella.eta** | 8 su 8 | 97% | true ⇒ 3,000e7…1,350e10; vero 8,520e9 |
| crosta a placche → massa ed età del pianeta | **pianeta.massa** | 8 su 8 | 81% | a placche ⇒ 1,967e23…1,792e28; vero 8,085e24 |
| crosta a placche → massa ed età del pianeta | **stella.eta** | 8 su 8 | 97% | a placche ⇒ 3,000e7…1,350e10; vero 7,052e8 |
| crosta a placche → massa ed età del pianeta | **pianeta.acqua** | 8 su 8 | 76% | a placche ⇒ 1,000e-5…0,8; vero 0,6142 |
| raggio osservato (±2%) → massa del pianeta | **pianeta.massa** | 8 su 8 | 1,2% | 8,505e6…8,852e6 ⇒ 7,502e24…8,700e24; vero 8,085e24 |
| luce della stella osservata (±5%) → massa della stella | **stella.massa** | 8 su 8 | 0,56% | 7,784e23…8,604e23 ⇒ 0,1354…0,1409; vero 0,1382 |
| stessa faccia alla stella (bloccato: sì) → distanza massima dalla stella | **orbita.distanza** | 8 su 8 | 37% | true ⇒ 2,992e9…7,661e10; vero 6,318e10 |
| magnetopausa osservata (±5%) → campo magnetico del pianeta | **interno.campo** | 8 su 8 | 1,7% | 4,541…5,019 ⇒ 8,630e-6…1,165e-5; vero 1,007e-5 |

## 7. Numeri e formule scritti a mano dove esiste già una fonte

Cercati nel codice di 52 moduli di `src/camera` (commenti esclusi; il modulo dove il numero è definito non conta). **179 numeri** e **25 formule**. Un numero riscritto è un filo in meno: se la costante cambia in `leggi.js`, lì non cambia; e un valore «di riserva» (la temperatura della Terra dove manca quella del pianeta) è una grandezza del grafo sostituita da una costante.

| numero | che cos'è | la sua fonte | quante volte | in quanti moduli | dove (file:prima riga ×volte) |
|---|---|---|---|---|---|
| **gelo** | il punto di fusione del ghiaccio (273,15 K; comprende le righe dove serve solo a convertire i gradi Celsius) | leggi.js statoAcqua (273,15 K: non ha ancora un nome) | 34 | 14 | mare.js:153 ×8, materia.js:787 ×5, mappa.js:180 ×3, molecole.js:222 ×3, bolle.js:276 ×2, laboratorio.js:1120 ×2, leggi.js:104 ×2, molecole_energia.js:372 ×2, … |
| **T Terra** | la temperatura della Terra come valore di riserva | grafo: clima.temperatura (P.clima.T) | 33 | 9 | materia.js:193 ×13, chimica.js:333 ×5, mare.js:183 ×4, mappa.js:635 ×3, risalita.js:220 ×3, bolle.js:264 ×2, geologia.js:230, leggi.js:412, … |
| **età Terra** | l'età del Sistema Solare come valore di riserva | grafo: stella.eta (S.eta) | 25 | 13 | storia.js:382 ×7, geologia.js:51 ×3, mare.js:297 ×3, disco.js:97 ×2, impatti.js:173 ×2, anelli.js:142, leggi.js:73, lune.js:29, … |
| **anno** | i secondi di un anno | leggi.js ANNO | 14 | 8 | mappa.js:180 ×6, chimica.js:671 ×2, impatti.js:110, laboratorio.js:1143, molecole.js:230, molecole_pozzi.js:40, rotazione.js:53, storia.js:127 |
| **R⊕** | il raggio della Terra | disco.js RTERRA | 12 | 8 | materia.js:479 ×4, risalita.js:217 ×2, cosmo.js:308, fluidi.js:22, geologia.js:442, impatti.js:653, storia.js:176, tettonica.js:378 |
| **g Terra** | la gravità della Terra come valore di riserva | grafo: pianeta.gravita (P.clima.g) | 9 | 4 | materia.js:496 ×4, mare.js:254 ×2, risalita.js:217 ×2, mappa.js:183 |
| **giorno Terra** | il giorno della Terra come valore di riserva | grafo: pianeta.giorno (P.giorno) | 8 | 3 | mare.js:500 ×4, risalita.js:241 ×3, leggi.js:265 |
| **G** | la costante di gravità | leggi.js COSTANTI.G | 7 | 4 | cosmo.js:199 ×4, mappa.js:340, materia.js:627, nebbia.js:19 |
| **B Terra** | il campo magnetico della Terra come valore di riserva | grafo: interno.campo (P.B0) | 6 | 3 | materia.js:479 ×3, risalita.js:405 ×2, cosmo.js:308 |
| **R** | la costante dei gas | leggi.js R_GAS | 4 | 2 | materia.js:193 ×3, risalita.js:166 |
| **M⊕** | la massa della Terra | disco.js MTERRA | 4 | 4 | fluidi.js:22, impatti.js:653, risalita.js:405, storia.js:176 |
| **q Terra** | il calore interno della Terra come valore di riserva | grafo: interno.calore (P.interno.q) | 4 | 2 | risalita.js:239 ×3, materia.js:634 |
| **M☉** | la massa del Sole | leggi.js MSOLE | 3 | 3 | cosmo.js:199, mappa.js:340, spazio3d.js:30 |
| **UA** | l'unità astronomica | leggi.js UA | 3 | 3 | impatti.js:110, laboratorio.js:360, unita.js:73 |
| **albedo 0,3** | l'albedo della Terra come valore di riserva | grafo: clima.albedo (P.clima.albedo) | 3 | 2 | risalita.js:229 ×2, leggi.js:498 |
| **kB** | la costante di Boltzmann | leggi.js COSTANTI.kB | 2 | 2 | materia.js:1101, molecole_energia.js:28 |
| **c** | la velocità della luce | leggi.js COSTANTI.c | 2 | 2 | mappa.js:340, unita.js:9 |
| **S Terra** | la luce del Sole alla Terra | grafo: orbita.flusso | 2 | 2 | cosmo.js:239, impatti.js:132 |
| **1 bar** | la pressione della Terra come valore di riserva | grafo: aria.pressione (P.clima.pressione) | 2 | 2 | chimica.js:616, molecole.js:187 |
| **σ** | la costante di Stefan-Boltzmann | leggi.js COSTANTI.sigma | 1 | 1 | geologia.js:219 |
| **R☉** | il raggio del Sole | leggi.js RSOLE | 1 | 1 | cosmo.js:194 |

| formula riscritta | grandezza del grafo | la sua fonte | quante volte | dove |
|---|---|---|---|---|
| `G·M/R²` | **pianeta.gravita** | grafo: pianeta.gravita (leggi.js:491 clima) | 12 | impatti.js:484 ×2, anelli.js:124, chimica.js:332, cosmo.js:229, geologia.js:230, lune.js:82, mare.js:367, meteo.js:490, risalita.js:217, stelle.js:380, storia.js:221 |
| `2π√(a³/GM)` | **orbita.anno** | grafo: orbita.anno (orbite.js:80 periodo) | 5 | rotazione.js:65 ×2, cosmo.js:199, lune.js:49, storia.js:462 |
| `L/(4πa²)` | **orbita.flusso** | grafo: orbita.flusso (leggi.js:491 clima) | 4 | anelli.js:247, cosmo.js:239, geologia.js:219, risalita.js:226 |
| `la temperatura di equilibrio con albedo 0,3 fisso` | **clima.equilibrio** | grafo: clima.equilibrio (leggi.js:491 clima) | 2 | leggi.js:498, risalita.js:238 |
| `√(L/4πσT⁴)` | **stella.raggio** | grafo: stella.raggio (stelle.js:658 stella) | 1 | risalita.js:228 |
| `4πR²σT⁴` | **stella.luminosita** | grafo: stella.luminosita (stelle.js:658 stella) | 1 | cosmo.js:191 |

Per sanarle: importare la costante dal suo modulo; e dove la formula riscritta calcola una grandezza che il pianeta porta già (`P.clima.g`, `P.anno`), leggerla da lì.

## 8. Che cosa questa mappa non copre ancora

- **La superficie**: mare (sali, pH, saturazione), pioggia, erosione e sedimento sono nel grafo (10 grandezze) ma fuori dal campione: i loro archi sono dichiarati, non misurati.
- **Gli archi «storia»**: ciò che esce dal disco, dalla galassia e dalle lune (28 archi) non si può rifare cambiando un ingresso solo; si controlla solo che nel campione vada nel verso dichiarato.
- **Archi non misurabili** perché l'ingresso non è tenuto in nessun oggetto: aria.gasTenuti→aria.pressione, interno.argon→aria.pressione, aria.gasTenuti→aria.CO2, aria.gasTenuti→aria.H2O, aria.gasTenuti→aria.CH4, aria.gasTenuti→aria.H2, aria.gasTenuti→aria.N2, aria.gasTenuti→aria.riducente, stella.vento→vita.energia.
- **Chimica e materia**: il grafo ci arriva solo per ciò che passa dal pianeta (energia per la chimica, mattoni della vita, gas radiogenici). Molecole, rocce e particelle hanno le loro grandezze, ancora da dichiarare.
- **Il tempo**: tutto è misurato «adesso»; quando `storia.js` darà lo stato a un istante, ogni grandezza del grafo avrà anche la sua storia e la continuità andrà provata anche nel tempo.

## 9. Proposta: una regola nuova per l'INTRECCIO

Da discutere; non è stata scritta in `INTRECCIO.md`.

> **13. Il grafo delle grandezze: collegato, continuo, correlato, percorribile nei due versi**
>
> Ogni grandezza che passa da un livello all'altro è dichiarata in un posto solo (`grandezze.js`): come si chiama, in che unità, quale funzione la calcola (la sua fonte, una sola), da quali grandezze dipende, dove la si legge in un oggetto vero. Il grafo è un dato, non un commento: una prova lo confronta con il codice su un campione di mondi veri, e ciò che non torna lo stampa con i numeri.
>
> - **Collegato.** Nessuna formula usa un numero scritto a mano dove esiste una fonte; nessuna grandezza ha due fonti; chi ne ha bisogno la legge, non la ricalcola. Una dipendenza che la funzione legge e il grafo non dice, o che il grafo dice e la funzione non legge, è un difetto.
>
> - **Continuo.** Se un ingresso varia di poco, l'uscita varia di poco. Salta solo dove salta la natura (una fase che cambia, un regime che si rompe), e quella soglia è dichiarata con la sua legge. Un `if` su un nome o un numero di taglio è una soglia di comodo: è dichiarata come tale, e da eliminare.
>
> - **Correlato.** Ciò che dipende dalle stesse cose si muove insieme, nel verso e con la pendenza che la dipendenza dice; due grandezze legate nei mondi veri hanno nel grafo un cammino o un antenato comune.
>
> - **Percorribile nei due versi.** Dall'alto si scende calcolando; dal basso si risale per intervalli: un valore osservato dice in che intervallo stanno le grandezze da cui dipende (regola 5), e l'intervallo contiene sempre il mondo da cui si è partiti. I cicli (il clima e l'aria) sono dichiarati, con chi li chiude.
>
> - Fatto: … (vedi la voce «Fatto / Manca» della regola 7). Manca: la superficie nel campione; gli archi che passano da una storia di eventi; chimica, rocce e particelle; il tempo.
