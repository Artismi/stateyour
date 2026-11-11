# Mappa delle grandezze

> «In molti casi una formula dipende da variabili che dipendono da altre formule; tutto può partire dal basso o
> dall'alto ma deve essere collegato, calcolato in modo continuo, correlato.»

Questo documento è **generato**: il grafo sta in `src/camera/grandezze.js` (un elenco di oggetti che un programma può leggere), le misure le fa `test/test_grandezze.mjs` su un campione di pianeti veri del programma, e `node test/test_grandezze.mjs --rapporto` riscrive queste pagine. Ultima misura: 2026-11-11 23:50 UTC, in 121 secondi.

Il lavoro non cambia la fisica dei moduli: **dichiara** (chi dipende da chi, da quale fonte), **misura** (se è vero) e **riferisce** (ciò che non torna, con i numeri e il punto del codice).

## In breve

- **Il grafo**: 88 grandezze, 310 archi («A dipende da B»), 38 fonti (le funzioni vere che le calcolano), 3 cicli dichiarati, 34 soglie lette nel codice. Degli archi: 230 passano da una legge che si può richiamare, 30 da una storia di eventi (il disco, la galassia: si controllano solo per correlazione), 45 stanno sulla superficie (dichiarati, non misurati: una superficie costa dieci secondi), 3 da una formula scritta in linea, 2 sono «attesi» (la fisica li chiede, il codice dichiaratamente non li ha ancora).
- **Archi misurati in più**: ogni fonte dichiara anche che cosa riceve dal programma (526 archi «possibili»); facendo variare quegli ingressi, 268 muovono davvero un'uscita e sono entrati nella colonna «dipende da» (dopo «e, misurato»), 232 no.
- **Il campione**: 634 pianeti veri, presi dalla fonte unica degli eventi (`campioneDiMondi`), fino al livello del pianeta.
- **Una fonte**: 48 grandezze ricalcolate dalla loro fonte; 15 copie controllate; 17 «seconde vie» (un'altra funzione che calcola la stessa cosa). **Doppioni che danno un numero diverso: 7.**
- **Continuità**: 481 archi misurati ad anello aperto e 210 ad anello chiuso (clima e aria risolti insieme), con 1439 scansioni e 129510 chiamate alle fonti. **Soglie di comodo che fanno saltare qualcosa: 13**; soglie fisiche vere toccate: 14; salti che nessuna soglia dichiarata spiega: 25; salite ripide ma continue: 30.
- **Correlazione**: **fili staccati: 8**; **dipendenze non dichiarate: 0**.
- **Dal basso**: 12 casi, 129 deduzioni; in 129 l'intervallo dedotto contiene il valore vero.
- **Scritti a mano**: 184 numeri che hanno già un nome e 25 formule riscritte in linea, in 60 moduli.

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
| **stella.luminosita** | la luce della stella oggi | W | 7 | `stelle.js:733 stellaOggi` | stella.massa ↑, stella.metalli, stella.eta ↑, stella.stato | `P.Lw` |
| **stella.luceDelDisco** | la luce della stella al tempo del suo disco (la stessa grandezza, a un altro tempo: mette la linea della neve) | W | 4 | `stelle.js:658 stella` | stella.massaNascita ↑, stella.metalli | `Sis.disco.Lstella` × 3,83e26 |
| **disco.neve** | la linea della neve del disco: oltre, anche il ghiaccio è solido | UA | 5 | `disco.js:68 disco` (storia di eventi) | stella.luceDelDisco ↑ | `Sis.disco.neve` |
| **stella.temperatura** | la temperatura della superficie della stella | K | 7 | `stelle.js:733 stellaOggi` | stella.massa ↑, stella.metalli, stella.eta, stella.stato | `S.T`; copie: `P.Tstella` |
| **stella.raggio** | il raggio della stella | m | 7 | `stelle.js:733 stellaOggi` | stella.massa ↑, stella.metalli, stella.eta, stella.stato | `S.r` × 4,49e12; copie: `P.Rstella` |
| **stella.vento** | la massa che la stella perde col vento | kg/s | 8 | `risalita.js:502 ventoStellare` | stella.raggio ↑, stella.eta ↓ | — (il programma non la tiene: chi la vuole la ricalcola) |

### L'orbita

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **orbita.distanza** | il semiasse dell'orbita | m | 1 | `disco.js:161 formaPianeti` (storia di eventi) | stella.massaNascita ↑ | `P.aM`; copie: `P.a` |
| **orbita.eccentricita** | quanto l'orbita è allungata | 1 | 8 | `disco.js:161 formaPianeti` (storia di eventi) | pianeta.massa ↑, pianeta.tipo | `P.eccentricita` |
| **orbita.anno** | il periodo dell'orbita | s | 7 | `orbite.js:80 periodo` | orbita.distanza ↑, stella.massa ↓ | `P.anno` |
| **orbita.flusso** | la luce della stella che arriva al pianeta | W/m² | 8 | `leggi.js:533 clima` | stella.luminosita ↑, orbita.distanza ↓ | `P.clima.bilancio.arriva` × 4 |

### Il corpo del pianeta e la sua rotazione

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **pianeta.massa** | la massa del pianeta | kg | 4 | `disco.js:161 formaPianeti` (storia di eventi) | stella.massaNascita ↑, stella.metalli ↑, orbita.distanza ↑ | `P.massaKg` |
| **pianeta.ferro** | la parte di ferro nei solidi | 1 | 2 | `disco.js:161 formaPianeti` (storia di eventi) | orbita.distanza ↓ | `P.composizione.ferro` |
| **pianeta.acqua** | la parte di acqua (o ghiaccio) nei solidi | 1 | 6 | `disco.js:161 formaPianeti` (storia di eventi) | orbita.distanza ↑, disco.neve, stella.massaNascita | `P.composizione.acqua` o `P.composizione.ghiaccio` |
| **pianeta.involucro** | il velo di idrogeno ed elio rimasto dal disco (parte della massa) | 1 | 5 | `disco.js:161 formaPianeti` (storia di eventi) | pianeta.massa, orbita.distanza | `P.involucro` |
| **pianeta.tipo** | roccioso, ghiacciato o gassoso | tipo | 7 | `disco.js:161 formaPianeti` (storia di eventi) | pianeta.acqua, pianeta.involucro, pianeta.massa | `P.tipo` |
| **pianeta.raggio** | il raggio del pianeta | m | 7 | `disco.js:112 raggioPianeta` | pianeta.massa ↑, pianeta.ferro ↓, pianeta.acqua ↑, pianeta.involucro ↑ | `P.raggioM` |
| **pianeta.gravita** | la gravità alla superficie | m/s² | 8 | `leggi.js:533 clima` | pianeta.massa ↑, pianeta.raggio ↓ | `P.clima.g` |
| **pianeta.giorno** | la durata del giorno | s | 10 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza, stella.massa, orbita.eccentricita, stella.eta, pianeta.involucro, pianeta.risonanza, pianeta.bloccato; *e, misurato:* orbita.anno, pianeta.tipo, pianeta.acqua | `P.giorno`; copie: `P.giro.giorno` |
| **pianeta.obliquita** | l'inclinazione dell'asse | ° | 8 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza, stella.massa, stella.eta, pianeta.involucro; *e, misurato:* orbita.eccentricita, orbita.anno, pianeta.tipo, pianeta.acqua | `P.obliquita`; copie: `P.giro.obliquita`, `P.clima.giro.obliquita` |
| **pianeta.bloccato** | mostra sempre la stessa faccia alla stella | sì/no | 9 | `rotazione.js:103 rotazione` | pianeta.massa, pianeta.raggio, orbita.distanza ↓, stella.massa, orbita.eccentricita, stella.eta ↑, pianeta.involucro | `P.bloccato`; copie: `P.giro.bloccato`, `P.clima.giro.bloccato` |
| **pianeta.risonanza** | la risonanza tra giorno e anno a cui la marea l'ha fermato (3:2, 2:1…), se c'è | rapporto | 9 | `rotazione.js:103 rotazione` | orbita.eccentricita | `P.risonanza` |
| **pianeta.schiacciamento** | quanto la rotazione lo schiaccia ai poli | 1 | 11 | `cosmo.js:172 sistema` (formula in linea: non ha una funzione sua) | pianeta.giorno ↓, pianeta.raggio ↑, pianeta.massa ↓ | `P.schiacciamento` |
| **pianeta.k2Q** | quanto il pianeta dissipa la marea (k₂/Q) | 1 | 14 | `lune.js:90 k2QPianeta` | pianeta.tipo, acqua.stato | — (il programma non la tiene: chi la vuole la ricalcola) |
| **pianeta.lune** | quante lune ha | numero | 8 | `lune.js:460 lune` (storia di eventi) | pianeta.massa ↑, orbita.distanza ↑, pianeta.tipo | `P.lune.length` |

### L'interno: calore, crosta, vulcani, dinamo

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **interno.nucleo** | il raggio del nucleo di ferro (parte del raggio) | 1 | 8 | `geologia.js:27 interno` | pianeta.ferro ↑, pianeta.massa, pianeta.raggio; *e, misurato:* pianeta.tipo | `P.interno.nucleo` |
| **interno.calore** | il calore che esce dall'interno | W/m² | 9 | `geologia.js:27 interno` | pianeta.massa ↑, pianeta.raggio, stella.eta ↓, stella.metalli ↑, pianeta.ferro, pianeta.acqua, orbita.eccentricita ↑; *e, misurato:* pianeta.tipo, stella.luminosita, orbita.distanza, stella.massa, stella.massaNascita | `P.interno.q` |
| **interno.dinamo** | il nucleo è ancora liquido e rimescolato | sì/no | 10 | `geologia.js:27 interno` | interno.calore, interno.nucleo, pianeta.raggio, stella.eta; *e, misurato:* pianeta.massa, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.luminosita, orbita.distanza | `P.interno.dinamo` |
| **interno.rossby** | il numero di Rossby del nucleo (se la rotazione ordina la dinamo) | 1 | 11 | `geologia.js:27 interno` | interno.calore ↑, pianeta.giorno ↑, interno.nucleo, interno.dinamo; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita | `P.interno.rossby` |
| **interno.dipolo** | il campo è a due poli (se no, a molti e debole) | sì/no | 12 | `geologia.js:27 interno` | interno.rossby, interno.dinamo; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.luminosita, orbita.distanza, pianeta.giorno | `P.interno.dipolo` |
| **interno.campo** | il campo magnetico alla superficie | T | 13 | `geologia.js:27 interno` | interno.calore, interno.nucleo, interno.dinamo, interno.dipolo, pianeta.raggio; *e, misurato:* pianeta.massa, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita, pianeta.giorno | `P.B0`; copie: `P.interno.B0` |
| **interno.tettonica** | il regime della crosta | regime | 10 | `geologia.js:27 interno` | interno.calore, pianeta.acqua, pianeta.massa, clima.temperatura *(atteso)*; *e, misurato:* pianeta.raggio, pianeta.ferro, pianeta.tipo, stella.eta, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa | `P.interno.tettonica` |
| **interno.vulcani** | quanti grandi vulcani attivi | numero | 11 | `geologia.js:27 interno` | interno.calore ↑, interno.tettonica; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.acqua, pianeta.tipo, stella.eta, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa | `P.interno.vulcani` |
| **marea.potenza** | il calore che la marea della stella deposita nel pianeta | W | 9 | `storia.js:417 storia` | orbita.eccentricita ↑, orbita.distanza ↓, stella.massa ↑, pianeta.raggio; *e, misurato:* pianeta.massa, pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, stella.massaNascita | — (il programma non la tiene: chi la vuole la ricalcola) |
| **interno.mantello** | la temperatura del mantello oggi, dalla storia termica | K | 10 | `storia.js:417 storia` | pianeta.massa, pianeta.raggio, stella.eta ↓, stella.metalli, marea.potenza; *e, misurato:* pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita | — (il programma non la tiene: chi la vuole la ricalcola) |
| **interno.mobilita** | quanto la crosta si muove (0 coperchio fermo, 1 placche): la grandezza continua sotto il nome del regime | 1 | 11 | `storia.js:417 storia` | interno.mantello, pianeta.acqua, pianeta.massa; *e, misurato:* pianeta.raggio, pianeta.ferro, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita | — (il programma non la tiene: chi la vuole la ricalcola) |
| **interno.magma** | il magma che il mantello produce (i vulcani del ciclo del carbonio) | kg/anno | 12 | `storia.js:417 storia` | interno.mantello ↑, pianeta.massa, pianeta.raggio, interno.mobilita; *e, misurato:* pianeta.ferro, pianeta.acqua, pianeta.tipo, stella.eta, stella.metalli, stella.luminosita, orbita.distanza, orbita.eccentricita, stella.massa, stella.massaNascita | — (il programma non la tiene: chi la vuole la ricalcola) |
| **interno.argon** | l'argon del potassio decaduto salito nell'aria (peso della colonna) | Pa | 11 | `risalita.js:458 gasRadiogenici` | stella.eta ↑, pianeta.massa, pianeta.raggio, interno.tettonica, stella.luminosita, pianeta.ferro; *e, misurato:* orbita.distanza | — (il programma non la tiene: chi la vuole la ricalcola) |

### L'aria: gas, pressione, serra

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **aria.gasTenuti** | quante specie di gas la gravità trattiene (su sei) | numero | 8 | `leggi.js:533 clima` | pianeta.massa ↑, pianeta.raggio ↓, stella.luminosita ↓, orbita.distanza ↑ | `P.clima.tenuti.length` |
| **aria.pressione** | la pressione dell'aria al suolo | Pa | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, pianeta.massa ↑, pianeta.raggio, pianeta.involucro, aria.co2Ciclo, interno.argon, stella.vento ↓ *(atteso)*; *e, misurato:* stella.eta, stella.luminosita, orbita.distanza | `P.clima.pressione`; copie: `P.atmosfera.pressione` |
| **aria.livello** | il livello di riferimento di un gigante di gas (non ha un suolo: lì si calcolano miscela e chimica) | Pa | 8 | `leggi.js:533 clima` | pianeta.tipo | `P.clima.livello`; copie: `P.atmosfera.pressione` |
| **aria.CO2** | la parte di anidride carbonica nell'aria (in volume) | 1 | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, aria.co2Ciclo; *e, misurato:* pianeta.massa, pianeta.raggio, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.CO2` |
| **aria.H2O** | la parte di vapore d'acqua nell'aria (in volume) | 1 | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.H2O` |
| **aria.CH4** | la parte di metano nell'aria (in volume) | 1 | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.CH4` |
| **aria.H2** | la parte di idrogeno nell'aria (in volume) | 1 | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua, pianeta.involucro; *e, misurato:* pianeta.massa, pianeta.raggio, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.H2` |
| **aria.N2** | la parte di azoto nell'aria (in volume) | 1 | 13 | `chimica.js:303 atmosfera` | clima.temperatura, acqua.stato, aria.gasTenuti, pianeta.acqua; *e, misurato:* pianeta.massa, pianeta.raggio, pianeta.involucro, stella.eta, stella.luminosita, orbita.distanza | `P.atmosfera.gas.N2` |
| **aria.riducente** | l'aria cede idrogeno (riducente) o lo prende (ossidante) | sì/no | 14 | `chimica.js:303 atmosfera` | aria.H2, aria.CH4, aria.CO2, aria.H2O, aria.gasTenuti; *e, misurato:* pianeta.massa, pianeta.acqua, clima.temperatura, acqua.stato | `P.atmosfera.riducente` |
| **aria.serra** | lo spessore ottico dell'aria per l'infrarosso (τ) | 1 | 13 | `chimica.js:395 serra` | aria.CO2 ↑, aria.H2O ↑, aria.CH4 ↑, aria.H2, aria.N2, aria.pressione ↑, pianeta.gravita ↓, clima.temperatura | `P.clima.tau` |
| **aria.co2Ciclo** | la CO₂ a cui le rocce ne prendono quanta i vulcani ne danno | Pa | 13 | `chimica.js:728 co2DelCiclo` | clima.temperatura ↓, interno.magma ↑, interno.vulcani, acqua.mare ↑, acqua.ghiaccio ↑, interno.tettonica; *e, misurato:* pianeta.raggio, pianeta.massa, pianeta.ferro | `P.clima.co2Ciclo` |
| **aria.vaporeSaturo** | la pressione del vapore d'acqua sopra il mare o il ghiaccio | Pa | 14 | `leggi.js:115 vaporeSaturo` | clima.temperatura ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### Il clima: temperatura, albedo, nuvole

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **clima.temperatura** | la temperatura media alla superficie | K | 13 | `leggi.js:533 clima` | orbita.flusso ↑, clima.albedo ↓, aria.serra ↑, clima.trasporto, pianeta.obliquita, pianeta.bloccato, stella.luminosita ↑, orbita.distanza ↓; *e, misurato:* pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, aria.pressione, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.T`; copie: `P.clima.Taria` |
| **clima.equilibrio** | la temperatura che avrebbe senz'aria, con il suo albedo | K | 14 | `leggi.js:533 clima` | orbita.flusso ↑, clima.albedo ↓, stella.luminosita ↑, orbita.distanza ↓; *e, misurato:* pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.Teq` |
| **clima.albedo** | la parte di luce rimandata indietro | 1 | 13 | `leggi.js:533 clima` | acqua.ghiaccio ↑, clima.nuvole ↑, acqua.mare, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.albedo` |
| **clima.nuvole** | la parte di cielo coperta | 1 | 13 | `leggi.js:533 clima` | acqua.mare ↑, aria.pressione ↑; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.raggio, acqua.inSuperficie, aria.serra | `P.clima.nuvole` |
| **clima.trasporto** | il calore che aria e mare portano dal caldo al freddo | W/m²/K | 13 | `leggi.js:533 clima` | aria.pressione, pianeta.giorno, pianeta.raggio, pianeta.gravita, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, acqua.inSuperficie, orbita.anno, pianeta.obliquita, pianeta.bloccato, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.D` |
| **clima.vento** | il vento al suolo, dalla stessa legge dell'aria | m/s | 14 | `leggi.js:533 clima` | aria.pressione, pianeta.giorno, pianeta.raggio, pianeta.gravita, clima.temperatura; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, acqua.inSuperficie, orbita.anno, pianeta.obliquita, pianeta.bloccato, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.vento` |
| **clima.assorbita** | la luce che il pianeta assorbe, in media | W/m² | 13 | `leggi.js:533 clima` | orbita.flusso ↑, clima.albedo ↓; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.obliquita, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.bilancio.assorbita` |

### L'acqua: quanta, in che stato, quanto mare

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **acqua.inSuperficie** | l'acqua che sta in superficie | kg | 8 | `leggi.js:130 acquaInSuperficie` | pianeta.massa ↑, pianeta.acqua ↑, pianeta.tipo | `P.interno.acquaKg` |
| **acqua.stato** | ghiaccio, liquida, vapore | stato | 13 | `leggi.js:533 clima` | clima.temperatura, aria.pressione, clima.assorbita; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, aria.serra | `P.clima.acqua` |
| **acqua.mare** | la parte del pianeta coperta dal mare | 1 | 13 | `leggi.js:533 clima` | acqua.inSuperficie ↑, pianeta.raggio ↓, interno.tettonica, acqua.stato; *e, misurato:* stella.luminosita, orbita.distanza, aria.pressione, aria.serra | `P.clima.mare` |
| **acqua.ghiaccio** | la parte del pianeta coperta dal ghiaccio | 1 | 13 | `leggi.js:533 clima` | clima.temperatura ↓, acqua.mare; *e, misurato:* stella.luminosita, orbita.distanza, pianeta.massa, pianeta.raggio, acqua.inSuperficie, orbita.anno, pianeta.giorno, pianeta.bloccato, aria.pressione, aria.serra, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2 | `P.clima.ghiaccio`; copie: `P.clima.ghiaccioDelCiclo` |
| **acqua.ebollizione** | a che temperatura bolle l'acqua a quella pressione | K | 14 | `leggi.js:105 ebollizione` | aria.pressione ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### Lo spazio vicino e i mattoni della vita

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **spazio.magnetopausa** | fin dove il campo ferma il vento della stella (raggi del pianeta) | raggi | 14 | `risalita.js:502 ventoStellare` | interno.campo ↑, stella.vento ↓, orbita.distanza ↑; *e, misurato:* stella.raggio, stella.eta | `P.magnetopausa` |
| **vita.energia** | l'energia che arriva alla chimica dell'aria (la Terra = 1) | Terra | 14 | `risalita.js:546 energiaPerLaChimica` | stella.luminosita ↑, orbita.distanza ↓, stella.temperatura ↑, interno.campo, aria.pressione, stella.vento; *e, misurato:* pianeta.gravita, pianeta.raggio, stella.eta, acqua.mare, acqua.stato, clima.assorbita, stella.raggio | `P.energiaChimica.relativa` |
| **vita.HCN** | quanto rende lì la reazione che fa acido cianidrico | 1 | 15 | `chimica.js:637 prebiotica` | vita.energia ↑, aria.H2, aria.CH4, aria.CO2, aria.N2, aria.H2O | `P.prebiotica.HCN` |
| **vita.formaldeide** | quanto rende lì la reazione che fa formaldeide (zuccheri) | 1 | 15 | `chimica.js:637 prebiotica` | vita.energia ↑, aria.H2, aria.CH4, aria.CO2, aria.N2, aria.H2O | `P.prebiotica.formaldeide` |
| **vita.autocatalisi** | gli zuccheri si copiano da soli (formosio) | sì/no | 16 | `chimica.js:637 prebiotica` | vita.formaldeide, acqua.stato; *e, misurato:* vita.energia | `P.prebiotica.autocatalisi` |
| **vita.radiceMassima** | l'età più antica che l'albero della vita può avere | Ma | 14 | `albero_vita.js:99 radiceMassima` | acqua.stato, stella.eta ↑ | — (il programma non la tiene: chi la vuole la ricalcola) |

### La superficie: pioggia, erosione, mare (dichiarate, fuori dal campione)

| grandezza | che cos'è | unità | passo | fonte | dipende da | si legge da |
|---|---|---|---|---|---|---|
| **superficie.temperatura** | la carta delle temperature | K | 14 | `geologia.js:212 climaSuperficie` (superficie) | clima.temperatura, aria.serra, clima.trasporto, orbita.flusso, pianeta.obliquita, pianeta.bloccato, meteo.nuvole | `U.cl.media` |
| **meteo.pioggia** | la carta delle piogge | mm/anno | 15 | `meteo.js:485 meteoPianeta` (superficie) | superficie.temperatura, aria.pressione, pianeta.giorno, pianeta.gravita, pianeta.raggio, pianeta.bloccato, pianeta.obliquita, acqua.stato | `U.cl.meteo.pioggia` |
| **meteo.nuvole** | la carta delle nuvole | 1 | 14 | `meteo.js:485 meteoPianeta` (superficie) | superficie.temperatura, aria.pressione, pianeta.giorno, pianeta.gravita, acqua.stato | `U.cl.meteo.nuvole` |
| **superficie.denudazione** | quanto l'erosione abbassa le terre | m/anno | 16 | `geologia.js:432 erosione` (superficie) | meteo.pioggia ↑, interno.tettonica, pianeta.gravita | `U.se.denudazione` |
| **superficie.fango** | il sedimento che i fiumi portano al mare | kg/anno | 17 | `geologia.js:432 erosione` (superficie) | superficie.denudazione ↑, pianeta.raggio | `U.se.fangoAlMare` |
| **mare.frazione** | la parte del pianeta sotto il mare, sulla carta vera | 1 | 14 | `mare.js:422 mare` (superficie) | acqua.inSuperficie ↑, pianeta.raggio, interno.tettonica, acqua.stato | `U.mare.frazioneMare` |
| **mare.pCO2** | la CO₂ con cui il mare è in equilibrio | bar | 17 | `mare.js:422 mare` (superficie) | aria.CO2, aria.pressione, aria.co2Ciclo, interno.calore, superficie.denudazione | `U.mare.pCO2` |
| **mare.salinita** | i sali sciolti nel mare | g/kg | 18 | `mare.js:422 mare` (superficie) | acqua.inSuperficie ↓, superficie.fango, superficie.denudazione, interno.calore, stella.eta | `U.mare.salinitaMedia` |
| **mare.pH** | l'acidità del mare | pH | 19 | `mare.js:422 mare` (superficie) | mare.pCO2 ↓, mare.salinita, superficie.temperatura | `U.mare.pH` |
| **mare.calcite** | la saturazione del calcare nel mare | Ω | 20 | `mare.js:422 mare` (superficie) | mare.pH ↑, mare.salinita, superficie.temperatura | `U.mare.saturazione.calcite` |

(↑: cresce con l'ingresso; ↓: cala; *atteso*: la fisica lo chiede, il codice non lo ascolta ancora.)

### I cicli dichiarati

Una dipendenza circolare non è un errore se qualcuno la chiude cercando il punto in cui le grandezze tornano uguali a sé stesse. La prova fallisce se trova un ciclo che non è in questo elenco.

| ciclo | perché | chi lo chiude | grandezze |
|---|---|---|---|
| **ghiaccio-albedo** | più freddo, più ghiaccio e (con un mare) altre nuvole, più luce rimandata, più freddo; lo stato dell'acqua decide se il mare c'è | `leggi.js:533 clima` | clima.temperatura, acqua.ghiaccio, clima.albedo, clima.assorbita, acqua.stato, acqua.mare, clima.nuvole, clima.equilibrio, clima.trasporto, clima.vento |
| **clima-aria** | la temperatura decide che cosa gela, piove o finisce nel calcare; l'aria che resta decide la serra, e la serra la temperatura | `chimica.js:433 climaEAria` | clima.temperatura, acqua.stato, acqua.mare, acqua.ghiaccio, aria.pressione, aria.CO2, aria.H2O, aria.CH4, aria.H2, aria.N2, aria.riducente, aria.serra, aria.co2Ciclo, clima.trasporto, clima.vento, clima.nuvole, clima.albedo, clima.assorbita, clima.equilibrio, interno.argon |
| **clima-meteo** | le nuvole e i venti veri cambiano la temperatura della carta, che cambia nuvole e venti (il secondo giro di climaSuperficie) | `geologia.js:212 climaSuperficie` | superficie.temperatura, meteo.nuvole, meteo.pioggia |

## 2. Doppioni: la stessa grandezza con due numeri

Tre controlli. (a) Ogni grandezza, ricalcolata dalla sua fonte con gli ingressi letti dallo stesso pianeta, deve ridare il numero che il programma tiene. (b) Se la tiene in due posti dello stesso oggetto, i due posti devono essere uguali. (c) Se un'altra funzione calcola la stessa cosa per conto suo, deve dare lo stesso numero. Sotto, solo ciò che NON coincide.

| # | grandezza | che cosa non coincide | in quanti mondi | scarto massimo | esempio | dove | per sanarla |
|---|---|---|---|---|---|---|---|
| 1 | **clima.temperatura** (la temperatura media alla superficie) | tenuta due volte: `P.clima.T` e `P.clima.Taria` (oltre la tolleranza dichiarata: Taria è la temperatura a cui climaEAria ha fatto la chimica dell'aria: è la stessa grandezza un giro prima, e il risolutore si ferma quando le due distano meno di un grado) | 142 su 624 | 33% | 185,3 contro 124,9 (cosmo 2/galassia 46/stella 326/pianeta 3) | `cosmo.js sistema / chimica.js climaEAria` | è la tolleranza del risolutore (si ferma quando aria e clima distano meno di un grado, o dopo cinque giri): stringerla, o ricalcolare l'aria alla temperatura finale |

**Doppioni dichiarati** (lo stesso dato scritto in due moduli senza che uno legga l'altro; fuori dal campione dei pianeti):

| che cosa | dove e quanto vale | per sanarlo |
|---|---|---|
| quanto dura il resto di una supernova (anni) | `risalita.js:197`: 3·10⁴; `galassie.js:170`: 2,9·10⁴·(n / 10⁶ m⁻³)^(−9/17) | risalita.js legga LEGGI.sedov di galassie.js con la densità del gas del posto (cambia i numeri del 3% e li fa dipendere dal gas: va misurato) |
| il ritmo delle supernove e il raggio del disco della Via Lattea, come riserva quando la galassia non è nota | `risalita.js:197`: 0,02 all'anno; 15 000 parsec; `materia.js:701`: 0,02 all'anno; 15 kpc (in linea) | un nome solo (in galassie.js, accanto a LEGGI: la Via Lattea di riferimento), letto da risalita.js e da materia.js: il valore è lo stesso |
| l'energia di una supernova che va in raggi cosmici (J) | `risalita.js:191`: 10⁴³; `galassie.js:170`: 0,1 × energiaSN (10⁴⁴) = 1,0000000000000001·10⁴³ | leggere LEGGI.cosmici × LEGGI.energiaSN: cambia l'ultima cifra (10⁻¹⁶) |
| la densità di energia dei raggi cosmici della galassia quando non è nota (J/m³) | `risalita.js:191`: 1,602·10⁻¹³ (1 eV/cm³, scritto); `vuoto_mezzo.js:128`: 1,70·10⁻¹³ (lo spettro di materia.js integrato) × il cielo relativo della galassia | dove la galassia è nota risalita.js legge già vuoto_mezzo.js; la riserva scritta (1 eV/cm³) è il 6% sotto il valore che lo spettro dà per la Via Lattea: farla coincidere |
| la temperatura di una nana bianca che si raffredda (Mestel) | `stelle.js:729`: la funzione; `galassie.js:834`: la stessa formula in linea (stesso numero) | galassie.js stelleGalassia chiami stelle.js nanaBiancaOggi(f.massa, f.raggio, morta).T |
| la linea della neve per le lune (2,7 UA·√L) | `disco.js:85`: con la luce al tempo del disco, su quella del Sole di allora; `lune.js:465`: con la luce a metà della vita della stella: il 18% più vicina per una nana rossa | lune.js legga la neve (o la luce) dal disco del sistema |

Coincidono invece ovunque (entro 10⁻⁹): 48 grandezze ricalcolate dalla fonte; 14 copie; 17 seconde vie (stella.temperatura da mondoDi, stella.raggio da mondoDi, orbita.flusso da mondoDi, pianeta.massa da mondoDi, pianeta.acqua da acquaInSuperficie, pianeta.raggio da mondoDi, pianeta.gravita da mondoDi, interno.calore da mondoDi, interno.campo da mondoDi, acqua.stato da statoAcqua, acqua.mare da mareAtteso, acqua.mare da mondoDi, aria.vaporeSaturo da pressioneVapore, clima.temperatura da mondoDi, clima.equilibrio da temperaturaEquilibrio, clima.equilibrio da mondoDi, clima.assorbita da mondoDi).

Non controllate fuori dal dominio in cui il grafo sa richiamare la fonte (i giganti di gas per aria e interno, le stelle morte per ciò che dipende dal vento): pianeta.raggio (28 mondi), interno.nucleo (10 mondi), interno.calore (10 mondi), aria.pressione (10 mondi), aria.CO2 (10 mondi), aria.H2O (10 mondi), aria.CH4 (10 mondi), aria.H2 (10 mondi), aria.N2 (10 mondi), spazio.magnetopausa (28 mondi), vita.energia (28 mondi).

**Senza una funzione propria**: pianeta.schiacciamento (formula scritta dentro `sistema()` di `cosmo.js`: non si può richiamare, quindi non si può controllare). **Mai tenute in un oggetto** (chi le vuole le ricalcola ogni volta): stella.vita, stella.vento, pianeta.k2Q, marea.potenza, interno.mantello, interno.mobilita, interno.magma, interno.argon, acqua.ebollizione, aria.vaporeSaturo, vita.radiceMassima.

## 3. Soglie nette: dove un passo dell'1% fa saltare l'uscita

Ogni ingresso è stato fatto variare lungo il suo intervallo fisico, a passi dell'1%, con tutto il resto fermo; dove un'uscita cambia di più del 30% in un passo (o cambia categoria) si è stretto il passo fino a un millesimo: se il salto resta è un **gradino**, se si scioglie è solo una salita ripida. Ogni gradino è stato attribuito alla soglia del codice che in quel punto viene attraversata. Le soglie sono dichiarate nel grafo (`SOGLIE`) una per una, lette nei moduli, con la loro specie: **fisica** (la natura salta lì: l'acqua gela) o **di comodo** (un `if` su un tipo, un numero di taglio).

### Soglie di comodo

| # | soglia su | che cosa fa | archi che fa saltare | il salto peggiore | dove | per sanarla |
|---|---|---|---|---|---|---|
| 1 | **aria.gasTenuti** (quando cambia) | un gas resta o fugge con un taglio netto del parametro di Jeans a 25; la fuga vera è continua (esponenziale) | 29 | pianeta.raggio→aria.gasTenuti: 1 → 0 (100%) | `leggi.js:93` | il flusso di fuga di Jeans integrato sull'età, al posto del sì/no |
| 2 | **pianeta.tipo** (quando cambia) | tre tipi di pianeta decidono troppo: acqua tutta fuori o al 4%, clima a parte per i giganti, k₂/Q, interno; la composizione continua c'è già | 25 | pianeta.tipo→acqua.stato: ghiaccio → liquida (cambia categoria) | `disco.js:273` | usare le frazioni di gas e di ghiaccio (continue) al posto del nome del tipo |
| 3 | **interno.tettonica** (quando cambia) | il regime della crosta è un nome messo sulla mobilità (continua, da 0 a 1) tagliata a 0,5, e sul «fonde / non fonde» | 20 | interno.calore→interno.tettonica: a placche → ferma (cambia categoria) | `storia.js:436` | far uscire da interno() la mobilità e la massa che fonde (storia.js le ha già) e farle leggere a chi oggi legge il nome |
| 4 | **aria.riducente** (quando cambia) | riducente sì/no: decide se i minerali sono ossidati | 7 | aria.H2O→aria.riducente: false → true (cambia categoria) | `chimica.js:376` | usare il potere riducente (0…1), che c'è già |
| 5 | **interno.vulcani** (quando cambia) | i vulcani si contano a interi (uno ogni 0,02 W/m², convenzione rimasta) e almeno uno appena il mantello fonde: il primo accende di colpo il ciclo del carbonio in cosmo.js | 4 | interno.calore→interno.vulcani: 1 → 0 (100%) | `storia.js:436` | passare a climaEAria la massa che fonde (o il calore) così com'è, senza l'interruttore «vulcani > 0» |
| 6 | **interno.argon** a 0 | l'argon resta tutto o fugge tutto: lo stesso taglio di Jeans a 25, rifatto in risalita.js | 4 | orbita.distanza→interno.argon: 0 → 0,4277 (100%) | `risalita.js:463` | come per i gas tenuti: il flusso di fuga integrato sull'età |
| 7 | **pianeta.involucro** a 0,01 | con più dell'1% di gas il giro del pianeta è «dato dal gas», sotto «dagli urti»: giorno e asse saltano | 3 | pianeta.involucro→pianeta.bloccato: true → false (cambia categoria) | `rotazione.js:59` | sommare i due momenti angolari (gas e urti) pesati, invece di sceglierne uno |
| 8 | **acqua.mare** a 0,02 | le nuvole attese ci sono solo se il mare copre più del 2% | 3 | pianeta.involucro→acqua.mare: 1 → 0 (100%) | `leggi.js:197` | far crescere le nuvole con l'evaporazione vera (mare × pressione di vapore), senza soglia |
| 9 | **vita.formaldeide** a 0,01 | la soglia del formosio (gli zuccheri si copiano) è un numero scelto | 2 | vita.formaldeide→vita.autocatalisi: false → true (cambia categoria) | `chimica.js:636` | la rete di reazioni vera (molecole_rete.js) al posto della soglia |
| 10 | **aria.co2Ciclo** a 1,00e7 | oltre cento bar di CO₂ il conto del ciclo si ferma | 2 | pianeta.raggio→aria.co2Ciclo: 2,322e-4 → 1,000e7 (100%) | `chimica.js:732` | cercare l'equilibrio anche oltre |
| 11 | **aria.H2** a 0,01 | con più dell'1% di idrogeno l'idrogeno «non manca mai» per la formaldeide; e l'aria è «riducente» solo se ne cede più dell'1% | 1 | aria.H2→vita.formaldeide: 0 → 2,144e-4 (100%) | `chimica.js:639` | contare l'idrogeno libero come gli altri ingredienti |
| 12 | **interno.vulcani** a 0 | il ciclo del carbonio si accende solo se interno() conta almeno un vulcano: prima di quello il calore dell'interno non entra nel clima | 1 | interno.vulcani→aria.co2Ciclo: 0 → 1,000e7 (100%) | `cosmo.js:239` | passare a climaEAria il calore (o la massa che fonde) così com'è |
| 13 | **aria.pressione** a 10000 | le nuvole attese ci sono solo sopra 0,1 bar | 1 | aria.pressione→clima.nuvole: 0 → 0,675 (100%) | `leggi.js:197` | una legge continua della pressione (quanta acqua l'aria regge) |

Dichiarate di comodo ma **non toccate** da nessuna scansione (stanno su grandezze che la prova non riesce a far variare, o non fanno saltare più del 30%): clima.temperatura a 200 (`leggi.js:121`); aria.serra a 10000 (`leggi.js:545`); pianeta.acqua a 0,2 (`disco.js:273`); interno.tettonica (`leggi.js:372`); spazio.magnetopausa a 1,3 (`risalita.js:506`).

### Salti che nessuna soglia dichiarata spiega

Qui il grafo non sa dire perché l'uscita salta: o è una soglia del codice che non è ancora stata letta e dichiarata, o è un salto del metodo (una ricerca che cambia ramo, un conto a fasce).

| # | arco | il salto | in quanti mondi | esempio | dove |
|---|---|---|---|---|---|
| 1 | **orbita.distanza→interno.mobilita** | 100% | 3 su 10 | tra 5,232e10 e 5,232e10: 0 → 0,627 (cosmo 2/galassia 6/stella 1755/pianeta 2) | `storia.js:417` |
| 2 | **pianeta.raggio→interno.mobilita** | 100% | 4 su 10 | tra 1,576e6 e 1,576e6: 0 → 0,1346 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `storia.js:417` |
| 3 | **pianeta.massa→interno.mobilita** | 100% | 5 su 10 | tra 1,274e23 e 1,274e23: 0 → 0,01777 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `storia.js:417` |
| 4 | **pianeta.ferro→interno.mobilita** | 100% | 2 su 10 | tra 0,6045 e 0,6045: 0,1287 → 0 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `storia.js:417` |
| 5 | **stella.luminosita→interno.mobilita** | 100% | 3 su 10 | tra 1,868e26 e 1,868e26: 0,627 → 0 (cosmo 2/galassia 6/stella 1755/pianeta 2) | `storia.js:417` |
| 6 | **pianeta.acqua→aria.H2O** | 100% | 3 su 10 | tra 2,164e-4 e 2,164e-4: 0 → 1,651e-5 (cosmo 2/galassia 60/stella 2398/pianeta 0) | `chimica.js:303` |
| 7 | **interno.mantello→interno.mobilita** | 100% | 9 su 10 | tra 1236 e 1236: 0 → 0,01777 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `storia.js:417` |
| 8 | **pianeta.raggio→aria.CO2 (chiuso)** | 100% | 1 su 3 | tra 4,499e7 e 4,503e7: 0 → 0,01179 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `chimica.js:433` |
| 9 | **pianeta.ferro→aria.co2Ciclo** | 100% | 2 su 10 | tra 0,6852 e 0,6852: 2,858e5 → 0,00504 (cosmo 1/galassia 40/stella 79/pianeta 7) | `chimica.js:728` |
| 10 | **pianeta.massa→aria.co2Ciclo** | 100% | 2 su 10 | tra 5,127e23 e 5,127e23: 2,322e-4 → 5503 (cosmo 2/galassia 46/stella 1649/pianeta 1) | `chimica.js:728` |
| 11 | **interno.mantello→interno.magma** | 92% | 5 su 10 | tra 1628 e 1628: 1,192e10 → 9,924e8 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `storia.js:417` |
| 12 | **interno.mobilita→interno.magma** | 92% | 5 su 10 | tra 0,6301 e 0,6286: 1,192e10 → 9,924e8 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `storia.js:417` |
| 13 | **pianeta.massa→interno.calore** | 91% | 5 su 10 | tra 1,274e23 e 1,274e23: 2,945e-4 → 2,461e-5 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `geologia.js:27` |
| 14 | **orbita.distanza→interno.calore** | 91% | 1 su 10 | tra 9,203e10 e 9,203e10: 0,003269 → 0,03763 (cosmo 2/galassia 29/stella 14/pianeta 0) | `geologia.js:27` |
| 15 | **stella.luminosita→interno.calore** | 91% | 1 su 10 | tra 1,658e26 e 1,658e26: 0,03763 → 0,003269 (cosmo 2/galassia 29/stella 14/pianeta 0) | `geologia.js:27` |
| 16 | **pianeta.raggio→interno.calore** | 79% | 4 su 10 | tra 1,576e6 e 1,576e6: 0,02076 → 0,004407 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `geologia.js:27` |
| 17 | **pianeta.ferro→interno.calore** | 72% | 2 su 10 | tra 0,6045 e 0,6045: 0,002047 → 0,009928 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `geologia.js:27` |
| 18 | **pianeta.involucro→aria.H2O (chiuso)** | 65% | 1 su 3 | tra 1,746e-4 e 1,747e-4: 6,287e-6 → 2,052e-5 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `chimica.js:433` |
| 19 | **interno.nucleo→interno.rossby** | 58% | 2 su 10 | tra 0,4306 e 0,4306: 0,04727 → 0,1122 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `geologia.js:27` |
| 20 | **pianeta.raggio→interno.mantello** | 56% | 1 su 10 | tra 2,764e7 e 2,764e7: 1206 → 532,6 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `storia.js:417` |
| 21 | **aria.pressione→clima.trasporto** | 56% | 1 su 5 | tra 7,449e6 e 7,449e6: 0,007264 → 0,01645 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `leggi.js:533` |
| 22 | **pianeta.massa→interno.mantello** | 53% | 1 su 10 | tra 6,320e22 e 6,320e22: 621,5 → 1307 (cosmo 2/galassia 60/stella 2398/pianeta 2) | `storia.js:417` |
| 23 | **pianeta.raggio→interno.campo** | 49% | 1 su 10 | tra 3,994e6 e 3,994e6: 2,366e-6 → 1,212e-6 (cosmo 2/galassia 46/stella 2327/pianeta 0) | `geologia.js:27` |
| 24 | **interno.nucleo→interno.campo** | 43% | 2 su 10 | tra 0,4306 e 0,4306: 3,164e-6 → 5,598e-6 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `geologia.js:27` |
| 25 | **clima.temperatura→acqua.ghiaccio** | 36% | 3 su 5 | tra 275,9 e 274,9: 0,02301 → 0,03612 (cosmo 2/galassia 60/stella 2398/pianeta 0) | `leggi.js:533` |

### Cicli che saltano da uno stato stabile all'altro

Né fisica dichiarata né taglio di comodo: l'uscita appartiene a un ciclo dichiarato, e nel punto del salto saltano insieme altre grandezze dello stesso ciclo.

| ciclo | che cosa succede | archi su cui si vede | il salto peggiore | chi lo chiude |
|---|---|---|---|---|
| **ghiaccio-albedo** | il ghiaccio e l'albedo hanno due stati stabili (palla di neve, mare aperto): passando dall'uno all'altro tutte le grandezze del ciclo saltano insieme (fisica vera: Budyko); ma può saltare anche il conto, che parte da una temperatura scelta | 34 | pianeta.involucro→acqua.ghiaccio: 1 → 0,05246 (100%), tra 1,792e-4 e 1,793e-4 (cosmo 2/galassia 46/stella 2327/pianeta 3) | `leggi.js:533` |
| **clima-aria** | clima e aria hanno più stati stabili (gelato, con il mare, senz'acqua) e il risolutore li prova in un ordine: passando dall'uno all'altro tutte le grandezze del ciclo saltano insieme. Non si distingue qui il salto vero (il mare che bolle) dal risolutore che cambia ramo | 10 | stella.luminosita→aria.serra: 658,4 → 0 (100%), tra 3,843e28 e 3,846e28 (cosmo 2/galassia 60/stella 2398/pianeta 8) | `chimica.js:433` |

### Soglie fisiche vere (per confronto)

| soglia su | che cosa succede | archi che fa saltare | dove |
|---|---|---|---|
| **acqua.stato** (quando cambia) | lo stato dell'acqua cambia (fase): con lui cambiano il mare, l'aria (ciò che piove o resta), k₂/Q | 89 | `leggi.js:119` |
| **interno.dinamo** (quando cambia) | la dinamo si accende o si spegne: il galleggiamento nel nucleo è positivo e il Reynolds magnetico passa 50 (soglia della teoria); spenta, il campo è il fondo di 10⁻⁹ T | 36 | `storia.js:321` |
| **clima.temperatura** a 273 | l'acqua gela (transizione di fase) | 23 | `leggi.js:122` |
| **pianeta.bloccato** (quando cambia) | il blocco mareale è uno stato vero: la luce cade sempre sulla stessa faccia | 17 | `rotazione.js:142` |
| **clima.temperatura** a 268 | la neve e il ghiaccio coprono la terra (268 K) e il mare (266 K): il salto dell'albedo è vero, ma il gelo ha qui un terzo e un quarto numero oltre a 273,15 e 271 | 15 | `leggi.js:150` |
| **interno.magma** a 0 | il mantello comincia a fondere (passa il solidus): da lì ci sono magma e vulcani | 10 | `storia.js:436` |
| **interno.rossby** a 0,12 | sopra Ro = 0,12 la dinamo perde il dipolo (soglia misurata nelle simulazioni: Olson e Christensen 2006); di quanto cala il campo (dieci volte) è però scelto | 9 | `storia.js:434` |
| **clima.temperatura** a dipende dal mondo | l'acqua bolle a quella pressione (transizione di fase) | 6 | `leggi.js:122` |
| **pianeta.risonanza** (quando cambia) | la rotazione resta agganciata a una risonanza con l'orbita (1:1, 3:2, 2:1…, come Mercurio): al crescere dell'eccentricità passa dall'una all'altra e il giorno salta | 4 | `rotazione.js:134` |
| **interno.dipolo** (quando cambia) | la dinamo perde il dipolo (vedi Rossby): il campo alla superficie cala di dieci volte | 4 | `storia.js:435` |
| **stella.massa** a dipende dal mondo | sotto la massa minima l'idrogeno non si accende: è una nana bruna (luce e raggio seguono un'altra legge) | 3 | `stelle.js:661` |
| **stella.massaNascita** a dipende dal mondo | sotto la massa minima l'idrogeno non si accende: è una nana bruna, e la sua «vita» è infinita | 2 | `stelle.js:661` |
| **clima.temperatura** a 647 | il punto critico dell'acqua: liquido e vapore non si distinguono più | 2 | `leggi.js:120` |
| **aria.pressione** a 611 | il punto triplo dell'acqua: sotto, niente liquido | 1 | `leggi.js:121` |

### Salite ripide ma continue

Più del 30% in un passo dell'1%, ma stringendo il passo il salto si scioglie: la legge è continua, solo molto sensibile.

| arco | in un passo dell'1% | esempio |
|---|---|---|
| **pianeta.raggio→pianeta.obliquita** | 100% | tra 3,916e6 e 3,947e6: 1,322 → 0 |
| **orbita.distanza→pianeta.obliquita** | 100% | tra 3,124e10 e 3,148e10: 0 → 1,172 |
| **stella.massa→pianeta.obliquita** | 100% | tra 0,3966 e 0,4002: 1,392 → 0 |
| **orbita.distanza→interno.magma** | 100% | tra 1,807e10 e 1,821e10: 5,353e12 → 0 |
| **pianeta.acqua→interno.magma** | 100% | tra 0,01843 e 0,01853: 1,067e10 → 0 |
| **stella.eta→interno.magma** | 100% | tra 1,538e8 e 1,548e8: 1,322e11 → 0 |
| **acqua.mare→aria.co2Ciclo** | 100% | tra 0,9453 e 0,9531: 0,00504 → 3,665 |
| **orbita.distanza→pianeta.giorno** | 100% | tra 5,274e10 e 5,316e10: 1,896e9 → 7,317e6 |
| **stella.luminosita→interno.magma** | 97% | tra 1,288e27 e 1,298e27: 4,049e7 → 1,414e9 |
| **stella.massa→pianeta.giorno** | 95% | tra 0,1914 e 0,1932: 1,844e7 → 3,378e8 |
| **clima.temperatura→aria.co2Ciclo** | 93% | tra 311,7 e 314,5: 1,634 → 0,1142 |
| **orbita.distanza→marea.potenza** | 90% | tra 5,549e9 e 5,593e9: 3,783e12 → 3,683e11 |
| **pianeta.raggio→pianeta.giorno** | 85% | tra 1,922e6 e 1,937e6: 9,533e5 → 6,560e6 |
| **stella.eta→pianeta.obliquita** | 83% | tra 1,135e8 e 1,142e8: 0,5428 → 0,0936 |
| **pianeta.massa→pianeta.obliquita** | 79% | tra 4,677e26 e 4,706e26: 0,03903 → 0,4329 |
| **stella.luminosita→marea.potenza** | 78% | tra 4,936e24 e 4,975e24: 2,427e8 → 1,121e9 |
| **acqua.ghiaccio→aria.co2Ciclo** | 77% | tra 0,2109 e 0,2188: 2,317e6 → 1,000e7 |
| **stella.massa→marea.potenza** | 76% | tra 5,195 e 5,242: 7,168e12 → 2,937e13 |
| **pianeta.ferro→interno.rossby** | 73% | tra 0,3812 e 0,3866: 0,04028 → 0,01072 |
| **orbita.distanza→interno.calore** | 69% | tra 5,549e9 e 5,593e9: 0,032 → 0,00983 |
| **stella.massa→interno.calore** | 68% | tra 5,195 e 5,242: 0,06792 → 0,2122 |
| **stella.eta→pianeta.giorno** | 66% | tra 5,718e9 e 5,752e9: 2,828e6 → 8,281e6 |
| **pianeta.massa→pianeta.giorno** | 64% | tra 1,299e26 e 1,307e26: 6,560e6 → 2,340e6 |
| **aria.serra→acqua.ghiaccio** | 58% | tra 230,6 e 232,4: 0,9574 → 0,4056 |
| **orbita.distanza→acqua.ghiaccio (chiuso)** | 54% | tra 9,053e9 e 9,110e9: 0,007906 → 0,0171 |
| **orbita.distanza→acqua.ghiaccio** | 43% | tra 3,198e10 e 3,223e10: 0,007268 → 0,01285 |
| **aria.serra→clima.assorbita** | 42% | tra 230,6 e 232,4: 0,9962 → 1,722 |
| **pianeta.ferro→interno.calore** | 39% | tra 0,3812 e 0,3866: 0,1851 → 0,1133 |
| **orbita.distanza→interno.rossby** | 38% | tra 5,549e9 e 5,593e9: 1,252 → 2,018 |
| **orbita.eccentricita→marea.potenza** | 32% | tra 0,025 e 0,03125: 5,653e8 → 8,833e8 |

## 4. Fili staccati: dovrebbero essere legate e non lo sono

Quattro specie, dalla più grave. **Dichiarato, ma l'uscita non si muove**: il grafo dice che B dipende da A, ma facendo variare A su tutto il suo intervallo B resta identica in ogni mondo provato: la fonte non legge A (o lo legge da un'altra parte). **Atteso dalla fisica, assente nel codice**: archi messi nel grafo apposta come «attesi», presi dall'inventario dei fili mancanti; la prova conferma che non ci sono. **Segno**: il grafo dichiara un verso e la fonte ne mostra un altro. **Nel campione**: la dipendenza diretta c'è, ma tra i pianeti veri le due grandezze vanno al contrario (un altro ingresso, legato al primo, pesa di più) o non si vedono affatto.

| # | da → a | specie | nota | dove | per sanarla |
|---|---|---|---|---|---|
| 1 | **clima.temperatura → interno.tettonica** | atteso dalla fisica, assente nel codice | una superficie rovente non fa placche (Venere): la storia termica usa la temperatura della superficie nuda, non quella del clima (storia.js lo dichiara: si può passare con Tsuperficie) | `geologia.js:27 interno` | scrivere il filo (vedi «Come farlo emergere») |
| 2 | **stella.vento → aria.pressione** | atteso dalla fisica, assente nel codice | l'aria che il vento della stella porta via (risalita.js la calcola: ariaPersa; nessuno la toglie) | `chimica.js:303 atmosfera` | scrivere il filo (vedi «Come farlo emergere») |
| 3 | **la densità di radiazione Ω_r (fotoni e neutrini: da leggi.js COSMO.Tcmb e COSMO.Neff) → il tempo cosmico di galassie.js (U.tempo: l'età dell'universo a un dato redshift)** | dipendenza mancante (fuori dal campione) | U.tempo conta solo materia ed energia oscura: ai redshift alti, dove la radiazione pesa, dà un'età troppo lunga: a z = 1090 galassie.js U.tempo dà 4,80e5 anni (senza radiazione, rifatto qui: 4,80e5); con Ω_r = 9,14e-5 (da Tcmb = 2.7255 K, Neff = 3.046) sono 3,72e5 | `galassie.js:192` | integrare dt = da/(a·H) con H² = H0²·(Ωm/a³ + Ω_r/a⁴ + ΩΛ), con Ω_r da COSMO.Tcmb e COSMO.Neff (ragnatela.js lo fa già per conto suo) |
| 4 | **galassia.stelle → stella.metalli** | dichiarato (esce da una storia), ma nel campione non si vede | ρ = 0,046 su 84 sistemi; atteso + | `galassie.js:770 stelleGalassia` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |
| 5 | **stella.massaNascita → pianeta.massa** | dichiarato (esce da una storia), ma nel campione non si vede | correlazione parziale 0,011 (tolti 2 altri ingressi; semplice 0,059) su 634 mondi; atteso + | `disco.js:161 formaPianeti` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |
| 6 | **interno.calore → interno.rossby** | nel campione legate al contrario di come la dipendenza dice | correlazione parziale -0,27 (tolti 14 altri ingressi; semplice -0,042) su 430 mondi; la dipendenza dichiarata è + | `geologia.js:27 interno` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |
| 7 | **stella.eta → interno.argon** | nel campione legate al contrario di come la dipendenza dice | correlazione parziale -0,27 (tolti 5 altri ingressi; semplice -0,23) su 624 mondi; la dipendenza dichiarata è + | `risalita.js:458 gasRadiogenici` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |
| 8 | **orbita.distanza → vita.energia** | nel campione legate al contrario di come la dipendenza dice | correlazione parziale 0,28 (tolti 11 altri ingressi; semplice -0,72) su 596 mondi; la dipendenza dichiarata è − | `risalita.js:546 energiaPerLaChimica` | non è un errore di per sé: dire nel grafo quale altro ingresso domina, o controllare che la storia (disco, galassia) dia davvero quella tendenza |

## 5. Dipendenze non dichiarate: legate senza che il grafo lo dica

Due modi di trovarle. **Alla fonte**: si sposta una grandezza che il grafo NON mette tra gli ingressi di una fonte, e l'uscita cambia: la funzione legge qualcosa che non è dichiarato. **Nel campione**: due grandezze che nel grafo non hanno niente in comune (né un cammino dall'una all'altra, né un antenato) risultano legate tra i pianeti veri.

Nessuna.

## 6. Dal basso: che cosa una cosa vista in basso dice di ciò che sta in alto

Il grafo si percorre anche al contrario: `impone(uscita, valore osservato, ingresso, mondo)` dà l'intervallo dell'ingresso compatibile con ciò che si è osservato (tutto il resto com'è in quel mondo, oppure dichiarato ignoto con il suo intervallo). Per i contenuti che `bolle.js` sa già giudicare (acqua liquida, ghiaccio) l'osservazione di partenza è quella di `chiede` (regola 5): `chiedeDalBasso` la traduce in grandezze del grafo, senza soglie nuove. La prova: partendo da un pianeta vero, l'intervallo dedotto deve contenere il suo valore vero. «Larghezza» dice quanto l'osservazione stringe: la parte dell'intervallo possibile che resta.

| osservazione in basso | che cosa impone a | il vero è dentro | larghezza | un esempio |
|---|---|---|---|---|
| acqua liquida in superficie → temperatura (bolle.js chiede) → luce della stella, con serra e pressione note | **stella.luminosita** | 8 su 8 | 17% | 273,1…418 ⇒ 5,772e23…8,062e24; vero 6,265e23 |
| acqua liquida in superficie → temperatura (bolle.js chiede) → luce della stella, con serra e pressione note | **orbita.distanza** | 8 su 8 | 17% | 273,1…418 ⇒ 4,357e9…1,629e10; vero 1,563e10 |
| acqua liquida in superficie → temperatura → serra dell'aria (τ), con la luce nota | **aria.serra** | 8 su 8 | 15% | 273,1…418 ⇒ 7,938…71,72; vero 8,715 |
| acqua liquida in superficie → temperatura → luce della stella, SENZA sapere la serra (tutta quella del campione) | **stella.luminosita** | 5 su 5 | 52% | 273,1…418 ⇒ 1,194e23…3,394e25; vero 6,265e23 |
| acqua liquida in superficie → distanza dalla stella, ad anello chiuso (clima e aria insieme: la fascia abitabile di quel pianeta) | **orbita.distanza** | 4 su 4 | 21% | liquida ⇒ 6,912e9…8,460e10; vero 1,563e10 |
| ghiaccio in superficie → temperatura (bolle.js chiede) → luce della stella | **stella.luminosita** | 8 su 8 | 69% | 0…273,1 ⇒ 1,000e22…1,537e26; vero 8,194e23 |
| campo magnetico osservato (±10%) → durata del giorno (la rotazione ordina la dinamo) ed età | **pianeta.giorno** | 8 su 8 | 60% | 4,184e-7…5,114e-7 ⇒ 7200…3,243e5; vero 97880 |
| campo magnetico osservato (±10%) → durata del giorno (la rotazione ordina la dinamo) ed età | **stella.eta** | 8 su 8 | 4,6% | 4,184e-7…5,114e-7 ⇒ 6,840e9…1,096e10; vero 8,520e9 |
| campo magnetico acceso (dinamo: sì) → nucleo liquido: raggio minimo ed età massima del pianeta | **pianeta.raggio** | 8 su 8 | 46% | true ⇒ 2,082e6…4,965e6; vero 3,172e6 |
| campo magnetico acceso (dinamo: sì) → nucleo liquido: raggio minimo ed età massima del pianeta | **stella.eta** | 8 su 8 | 97% | true ⇒ 3,000e7…1,350e10; vero 8,520e9 |
| crosta a placche → massa ed età del pianeta | **pianeta.massa** | 8 su 8 | 79% | a placche ⇒ 1,947e23…1,792e28; vero 7,784e24 |
| crosta a placche → massa ed età del pianeta | **stella.eta** | 8 su 8 | 98% | a placche ⇒ 3,000e7…1,350e10; vero 7,052e8 |
| crosta a placche → massa ed età del pianeta | **pianeta.acqua** | 8 su 8 | 78% | a placche ⇒ 1,000e-5…0,8; vero 0,6142 |
| raggio osservato (±2%) → massa del pianeta | **pianeta.massa** | 8 su 8 | 1,2% | 8,418e6…8,761e6 ⇒ 7,223e24…8,377e24; vero 7,784e24 |
| luce della stella osservata (±5%) → massa della stella | **stella.massa** | 8 su 8 | 0,65% | 7,784e23…8,604e23 ⇒ 0,1354…0,1409; vero 0,1382 |
| stessa faccia alla stella (bloccato: sì) → distanza massima dalla stella | **orbita.distanza** | 8 su 8 | 37% | true ⇒ 2,992e9…3,258e10; vero 1,563e10 |
| magnetopausa osservata (±5%) → campo magnetico del pianeta | **interno.campo** | 8 su 8 | 1,9% | 4,455…4,924 ⇒ 8,573e-6…1,157e-5; vero 9,999e-6 |

## 7. Numeri e formule scritti a mano dove esiste già una fonte

Cercati nel codice di 60 moduli di `src/camera` (commenti esclusi; il modulo dove il numero è definito non conta). **184 numeri** e **25 formule**. Un numero riscritto è un filo in meno: se la costante cambia in `leggi.js`, lì non cambia; e un valore «di riserva» (la temperatura della Terra dove manca quella del pianeta) è una grandezza del grafo sostituita da una costante.

| numero | che cos'è | la sua fonte | quante volte | in quanti moduli | dove (file:prima riga ×volte) |
|---|---|---|---|---|---|
| **gelo** | il punto di fusione del ghiaccio (273,15 K; comprende le righe dove serve solo a convertire i gradi Celsius) | leggi.js statoAcqua (273,15 K: non ha ancora un nome) | 35 | 15 | mare.js:153 ×8, materia.js:791 ×5, mappa.js:180 ×3, molecole.js:222 ×3, bolle.js:316 ×2, chimica.js:487 ×2, laboratorio.js:1120 ×2, molecole_energia.js:372 ×2, … |
| **T Terra** | la temperatura della Terra come valore di riserva | grafo: clima.temperatura (P.clima.T) | 33 | 9 | materia.js:195 ×13, chimica.js:333 ×5, mare.js:183 ×4, mappa.js:635 ×3, risalita.js:227 ×3, bolle.js:304 ×2, geologia.js:238, leggi.js:449, … |
| **età Terra** | l'età del Sistema Solare come valore di riserva | grafo: stella.eta (S.eta) | 29 | 14 | storia.js:386 ×7, geologia.js:32 ×4, mare.js:303 ×3, vuoto_sistema.js:99 ×3, disco.js:112 ×2, impatti.js:173 ×2, anelli.js:142, leggi.js:76, … |
| **anno** | i secondi di un anno | leggi.js ANNO | 15 | 9 | mappa.js:180 ×6, chimica.js:704 ×2, impatti.js:110, laboratorio.js:1143, molecole.js:230, molecole_pozzi.js:40, rotazione.js:53, storia.js:130, … |
| **R⊕** | il raggio della Terra | disco.js RTERRA | 12 | 8 | materia.js:482 ×4, risalita.js:224 ×2, cosmo.js:314, fluidi.js:22, geologia.js:453, impatti.js:653, storia.js:180, tettonica.js:402 |
| **g Terra** | la gravità della Terra come valore di riserva | grafo: pianeta.gravita (P.clima.g) | 9 | 4 | materia.js:499 ×4, mare.js:254 ×2, risalita.js:224 ×2, mappa.js:183 |
| **giorno Terra** | il giorno della Terra come valore di riserva | grafo: pianeta.giorno (P.giorno) | 8 | 3 | mare.js:523 ×4, risalita.js:250 ×3, leggi.js:290 |
| **G** | la costante di gravità | leggi.js COSTANTI.G | 6 | 4 | cosmo.js:205 ×3, mappa.js:340, materia.js:630, nebbia.js:19 |
| **B Terra** | il campo magnetico della Terra come valore di riserva | grafo: interno.campo (P.B0) | 6 | 3 | materia.js:482 ×3, risalita.js:414 ×2, cosmo.js:314 |
| **R** | la costante dei gas | leggi.js R_GAS | 5 | 3 | materia.js:195 ×3, lune.js:216, risalita.js:168 |
| **M⊕** | la massa della Terra | disco.js MTERRA | 4 | 4 | fluidi.js:22, impatti.js:653, risalita.js:414, storia.js:180 |
| **q Terra** | il calore interno della Terra come valore di riserva | grafo: interno.calore (P.interno.q) | 4 | 2 | risalita.js:248 ×3, materia.js:637 |
| **M☉** | la massa del Sole | leggi.js MSOLE | 3 | 3 | cosmo.js:205, mappa.js:340, spazio3d.js:31 |
| **UA** | l'unità astronomica | leggi.js UA | 3 | 3 | impatti.js:110, laboratorio.js:360, unita.js:73 |
| **albedo 0,3** | l'albedo della Terra come valore di riserva | grafo: clima.albedo (P.clima.albedo) | 3 | 2 | risalita.js:238 ×2, leggi.js:540 |
| **kB** | la costante di Boltzmann | leggi.js COSTANTI.kB | 2 | 2 | materia.js:1105, molecole_energia.js:28 |
| **c** | la velocità della luce | leggi.js COSTANTI.c | 2 | 2 | mappa.js:340, unita.js:9 |
| **S Terra** | la luce del Sole alla Terra | grafo: orbita.flusso | 2 | 2 | cosmo.js:245, impatti.js:132 |
| **1 bar** | la pressione della Terra come valore di riserva | grafo: aria.pressione (P.clima.pressione) | 2 | 2 | chimica.js:643, molecole.js:187 |
| **σ** | la costante di Stefan-Boltzmann | leggi.js COSTANTI.sigma | 1 | 1 | geologia.js:227 |

| formula riscritta | grandezza del grafo | la sua fonte | quante volte | dove |
|---|---|---|---|---|
| `G·M/R²` | **pianeta.gravita** | grafo: pianeta.gravita (leggi.js:533 clima) | 12 | impatti.js:484 ×2, lune.js:84 ×2, maree.js:103 ×2, anelli.js:124, geologia.js:238, mare.js:375, meteo.js:490, stelle.js:380, storia.js:216 |
| `2π√(a³/GM)` | **orbita.anno** | grafo: orbita.anno (orbite.js:80 periodo) | 6 | rotazione.js:65 ×2, cosmo.js:205, lune.js:51, relativita.js:396, storia.js:466 |
| `L/(4πa²)` | **orbita.flusso** | grafo: orbita.flusso (leggi.js:533 clima) | 4 | anelli.js:247, cosmo.js:245, geologia.js:227, risalita.js:233 |
| `la temperatura di equilibrio con albedo 0,3 fisso` | **clima.equilibrio** | grafo: clima.equilibrio (leggi.js:533 clima) | 2 | leggi.js:540, risalita.js:247 |
| `√(L/4πσT⁴)` | **stella.raggio** | grafo: stella.raggio (stelle.js:733 stellaOggi) | 1 | risalita.js:237 |

Per sanarle: importare la costante dal suo modulo; e dove la formula riscritta calcola una grandezza che il pianeta porta già (`P.clima.g`, `P.anno`), leggerla da lì.

## 8. Che cosa questa mappa non copre ancora

- **La superficie**: mare (sali, pH, saturazione), pioggia, erosione e sedimento sono nel grafo (10 grandezze) ma fuori dal campione: i loro archi sono dichiarati, non misurati.
- **Gli archi «storia»**: ciò che esce dal disco, dalla galassia e dalle lune (30 archi) non si può rifare cambiando un ingresso solo; si controlla solo che nel campione vada nel verso dichiarato.
- **Archi non misurabili** perché l'ingresso non è tenuto in nessun oggetto: aria.gasTenuti→aria.pressione, interno.argon→aria.pressione, aria.gasTenuti→aria.CO2, aria.gasTenuti→aria.H2O, aria.gasTenuti→aria.CH4, aria.gasTenuti→aria.H2, aria.gasTenuti→aria.N2, aria.gasTenuti→aria.riducente, interno.magma→aria.co2Ciclo, stella.vento→vita.energia.
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
