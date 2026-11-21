# L'intreccio

Le regole che ogni livello del mondo deve rispettare, dal cosmo alla particella. Non descrivono un livello: descrivono
come i livelli stanno insieme. Tutto il resto del programma sono leggi (formule) e costanti; il contenuto non si
scrive, discende da queste regole.

Per ogni regola: che cosa dice, dove è già fatta rispettare (`prova`), che cosa manca.

## 1. L'indirizzo è l'identità
Ogni cosa è individuata da un indirizzo: **dove** (il percorso dei luoghi, dal più grande al più piccolo: cosmo,
galassia, stella, pianeta, punto, scala), **quando** (il tempo), **in quale mondo** (gli eventi andati diversamente).
Lo stesso indirizzo dà sempre la stessa cosa. Il mondo non è conservato da nessuna parte: è una funzione
dell'indirizzo e delle leggi; ciò che si tiene in memoria si può buttare e ricalcolare identico.
- Fatto: `src/camera/intreccio.js` (l'indirizzo e le sue operazioni), `eventi.js` (la fonte unica del caso:
  Threefry‑2x32 a 20 giri, con la chiave a 64 bit ricavata dall'indirizzo nome per nome; le particelle di
  `mondo.js` e il cosmo di `cosmo.js` leggono da lì); prove di determinismo in `test_eventi` (vettori noti,
  nessuna collisione su un milione di indirizzi, ordine inverso), `test_coerenza`, `test_intreccio`.
- Manca: il tempo è nell'indirizzo ma i livelli sopra la particella si calcolano solo «adesso»; superficie, mare e
  roccia usano ancora coordinate loro invece dell'indirizzo comune.

## 2. Solo leggi
Niente è disegnato o messo lì. Ogni numero del codice è di una di tre specie, e lo dice: **ricavato** (da leggi e
costanti), **misurato** (un dato di laboratorio o di natura, con la fonte, non scelto guardando il risultato),
**libero** (scelto da noi: dichiarato, e da eliminare). Ogni modulo dichiara in testa le sue leggi, i suoi dati, i
suoi parametri liberi e che cosa non torna con la realtà; le prove stampano ciò che non torna invece di nasconderlo.
**Le regole devono essere complete.** Non scriviamo il gioco, scriviamo le regole: ma devono essere tutte quelle che
servono perché il gioco vero si possa giocare. Una regola semplificata che vieta ciò che la realtà permette rende
impossibile, in quel mondo, ciò che nella realtà accade (se la chimica conosce solo un elenco di molecole, nessuna
storia potrà mai costruire una proteina). Quindi:
- le regole di un livello sono **chiuse**: dicono che cosa può esistere e accadere per ogni caso che le loro leggi
  ammettono, non un elenco di casi previsti da noi;
- i livelli più alti sono **scorciatoie** di quelli sotto: devono potersi ricavare da quelli (e controllare su un
  campione piccolo), e non possono vietare ciò che sotto è permesso né permettere ciò che sotto è vietato;
- il costo vero sta nel giocare, non nello scrivere le regole: per questo si gioca solo dove si guarda (regola 8),
  ma le regole ci sono tutte, ovunque.
- Fatto: intestazioni dei moduli; «NON TORNA» nelle prove.
- Fatto (lavoro 8): nessun inventario degli elementi scelto a priori: quanto c'è di ogni elemento in ogni serbatoio viene
  dalla storia della galassia (rese di Kobayashi et al. 2006 lette sulla fonte), della stella e del pianeta (`elementi.js`).
- Manca (lavoro 8): i numeri ancora RICORDATI e non riletti, dichiarati in `elementi.js`: le rese delle giganti di Karakas
  2010 (le tabelle sono in linea), le temperature di condensazione di Lodders 2003, i parametri della ripartizione metallo/
  silicato (Fischer et al. 2015, Wade e Wood 2005: la tabella S2 di Rubie et al. 2015 non è aperta), i coefficienti
  minerale/fuso delle tracce, le solubilità del mare; le tracce pesanti senza rese, tarate sul Sole per canale (r e s).
- Manca: i parametri liberi rimasti (elencati nei moduli); un elenco unico generato dal codice. Regole ancora ad
  elenco invece che chiuse: le molecole (41 in `chimica.js`), i minerali, le particelle del catalogo, i tipi di
  roccia, i tipi di pianeta. La chimica generale (qualsiasi molecola dai suoi atomi e dai suoi legami) è il primo
  passo.

## 3. L'evento, la sovrapposizione, il collasso
Ogni esito incerto è un **evento** con un indirizzo (dove e quando accade, e che cosa). Tutti i suoi esiti esistono,
ognuno in un mondo. Non serve un osservatore: ogni punto di ogni istante di ogni mondo c'è, e «si osserva da solo».
Quello che chiamiamo osservare, o collasso, è solo il nostro leggere: calcolare quel punto in uno dei suoi mondi; da
quel momento, per chi legge quel mondo, l'esito è quello, sempre. Leggere non crea niente e non forza niente. Un mondo
parallelo è lo stesso indirizzo con alcuni eventi andati in un altro modo (`rami`).
Un evento può cambiare solo ciò che sta **dentro il suo contenitore e dopo di lui**: tutto ciò che è fuori, o prima,
resta identico. Così i mondi paralleli sono vicini quanto sono pochi e piccoli gli eventi che li separano.
- Fatto: particelle (`mondo.js`), impatti, anelli, galassie, stelle una per una (`sorgente`); disco e lune evento
  per evento («…/disco/embrione 12/incontro con 13», «…/lune/cattura 3/eccentricità»), e così rocce, superficie,
  mantello, pozza; il campo del cosmo in 3D (`cosmo3d.js` `ampiezzeLibere`: ogni onda è un evento col suo nome,
  «cosmo 1/campo/onda 2,-1,3»; il ramo di un'onda cambia quell'onda sola e lascia le galassie dove sono viste
  dall'alto); prove «un ramo cambia una cosa sola» (`test_eventi`, `test_disco`, `test_lune`, `test_bolle`).
- Manca: meteo e clima non hanno eventi; restano fuori dalla fonte unica
  le scene di `atomi3d.js`, il rumore delle tessere (`geologia.js`), le ricerche del pattern (`pattern/src/camera/cercatore.js`, `vicini.js`) e
  ciò che l'interfaccia tira da un seme (`laboratorio.js`, `mappa.js`, `src/tre`); un evento piccolo risale per due vie sole
  (`risalita.js`, non ancora collegato): come flusso, sommato, o attraverso un amplificatore con il suo tempo; il «dopo» non è ancora controllato da una prova.

## 4. Dal grande al piccolo: il dettaglio è condizionato
Avvicinandosi, il livello più fine nasce da quello sopra: ne riceve le condizioni in quel punto (i campi: temperatura,
composizione, flussi, moti) e aggiunge solo ciò che da lontano non si vedeva. Ciò che aggiunge, sommato, fa zero: le
grandezze che si conservano (massa, energia, carica, elementi, quantità di moto, acqua) valgono lo stesso viste da
sopra e contate da sotto. Gli eventi del dettaglio hanno indirizzi sotto quello della madre.
- Fatto: tessere del terreno (media uguale alla madre), bolle di particelle, campione d'acqua (conteggi veri),
  bilanci di massa e metalli; `test_coerenza` (47 prove).
- Fatto: `test_coerenza_scale` stampa la tabella di conservazione M∘μ = I per ogni passaggio, dal campo cosmico ai quark,
  con tolleranze dal modello, e i difetti di commutazione misurati.
- Fatto: **gli elementi, uno per uno, dalla galassia al mare** (`elementi.js`, lavoro 8; `test_elementi`): i metalli di ogni
  serbatoio della galassia divisi per canale (chi li ha fatti) e mossi con lui (Σ canali = metalli entro 10⁻¹⁴); la miscela di
  ogni stella è quella del suo gas di nascita; il disco condensa ogni elemento alla sua temperatura; ogni pianeta sa di quali
  embrioni è fatto; nucleo e mantello si dividono conservando ogni elemento e l'ossigeno; la crosta fonde dal mantello; il mare
  e l'aria prendono dal pianeta. **Il libro dei conti** (`libroDeiConti`) somma i serbatoi elemento per elemento contro ciò che
  il disco ha dato (scarto 10⁻¹⁵) e segnala chi chiede più di quanto il suo fornitore ha: è una riga di `test_coerenza_scale`.
  Trovate e corrette facendolo: l'acqua dei ghiacci contava anche il CO e l'NH3 (il mare aveva un terzo d'acqua in più di
  quella che c'era), l'aria contava il carbonio come CO2 e lo zolfo come SO2 con un ossigeno che l'inventario non aveva e la
  massa dell'idrogeno fuggito restava agli altri gas, il CO dei ghiacci prendeva un ossigeno già dato all'acqua, e una roccia
  senza zolfo né acqua dava zolfo e carbonio all'aria (il pavimento di 0,001).
- Manca: il riassunto M sotto gli atomi e per la magnetosfera; μ per le galassie vere nel toro e per i pianeti delle stelle
  vere; la quota media delle tessere (la costa condizionata non la conserva e la tessera si erode due volte); la neutralità
  delle celle di feldspati e biotite; il terreno fine non eredita ancora tutto (i fiumi tra tessere). Per gli elementi: il
  decadimento radioattivo (U, Th, K: il libro conta le masse della nascita; l'argon e l'elio radiogenici dell'aria a parte);
  i sedimenti e il calcare come serbatoi propri (oggi stanno nei «ghiacci», ciò che è uscito e non è aria né mare); la
  crosta riciclata dalle placche (la crosta è quella di oggi, il residuo della seconda fusione torna nel mantello).

## 5. Dal piccolo al grande: il mondo compatibile
Questa è la direzione che conta di più. Si può partire da un punto qualsiasi, anche piccolissimo: un cristallo, una
goccia, un metro di mondo, una macchina fatta di atomi. Preso da solo, quel pezzo potrebbe avere attorno qualunque
mondo; ma non tutti allo stesso modo: è molto più probabile che sia nato da un mondo simile a quello da cui lo si è
ritagliato. Quel pezzo funziona da condizione: il mondo più grande non è libero, è uno di quelli che,
scendendo con la regola 4, darebbero quel punto. Sono infiniti; se ne sceglie uno, e resta quello.
- **Che cosa chiede.** Ogni livello deve saper dire che cosa chiede a chi sta sopra perché una cosa possa esserci
  (un fiocco di neve chiede aria sotto zero e vapore; una crosta di sale un bacino chiuso che evapora; una macchina
  molecolare acqua liquida, i suoi elementi, un gradiente che le dia energia, e alle spalle miliardi di anni di un
  mondo rimasto abitabile).
- **Quale si sceglie.** Tra i mondi compatibili non si prende il più strano ma si sceglie in proporzione a quanto
  sono probabili secondo le leggi: una macchina molecolare ha alle spalle, quasi sempre, una storia di chimica che si
  copia e si seleziona, non atomi capitati lì per caso (esiste anche quel mondo, ma è rarissimo tra i rarissimi).
- **Ciò che sta in mezzo.** La storia tra il mondo grande e l'osservazione piccola, finché nessuno la guarda, non è
  calcolata: è una sovrapposizione delle storie compatibili (regola 3). Si controllano le condizioni necessarie (che
  nessuna legge la vieti); guardandola, si calcola fin dove le leggi che abbiamo arrivano, e dove non arrivano lo si
  dice.
- **Da dove vengono le osservazioni.** Dal mondo stesso, scendendo; oppure da fuori: una fotografia, una struttura
  misurata nel nostro universo. Queste non sono cose «messe da noi»: sono un punto del nostro mondo, che è uno dei
  libri della biblioteca; entrano dichiarate come osservazioni, e vale per loro tutto il resto (devono essere
  compatibili con le leggi e con ciò che sta sopra).
- Fatto (primo pezzo, `src/camera/bolle.js`, `test_bolle`): **che cosa chiede** per otto contenuti che i moduli
  sanno già giudicare (acqua liquida, ghiaccio, crosta di sale, un minerale, un cratere, un anello, un'aurora,
  carbonato che precipita): `chiede(bolla)` dà la richiesta livello per livello (punto, superficie, pianeta, stella)
  con il perché e la legge da cui viene, senza soglie nuove; `giudica` risponde sì / no (con la legge che lo vieta) /
  forse (decide il livello sotto). **Quale si sceglie**: per il campo del cosmo è esatto (`campoCondizionato`: la
  correzione di Hoffman e Ribak, peso e^(−χ²/2)); per i pianeti `incontra` campiona indirizzi della biblioteca in
  modo deterministico, dichiara quanti ne ha provati e quale parte andava bene (con l'errore), e sceglie in
  proporzione al peso. Ridiscendendo dal mondo trovato il contenuto c'è (prova). L'albero della vita di un pianeta
  chiede a chi sta sopra da quanto tempo c'è acqua liquida (`albero_vita.js`: la radice non può essere più antica).
  **I pesi degli esiti** (`src/camera/misura.js`, `test_lingua_indirizzo` E–H, LINGUA.md): ogni legge di un tiro
  (uniforme, tra, intero, bernoulli, discreta, normale, seme) dà il peso di ogni esito, e i pesi di un evento sommano a 1;
  il peso di un mondo con i suoi rami è il rapporto di verosimiglianza rispetto al mondo di partenza, nella parte «rami»
  di `lingua.peso` e nella distanza tra rami; le galassie e le stelle vere hanno un indirizzo (`vera k`) e `puntoACaso` è
  uniforme sulle stelle vere; le fusioni (`lingua.fondi`) sommano i pesi delle storie decoerenti con la stessa impronta;
  una prima stima dei cervelli di Boltzmann, per mondo: la via evolutiva vince di ~10⁵¹ bit per un pianeta con acqua.
- Fatto (lavoro 10, `src/camera/reazioni.js`, `test_reazioni`): la vita non si scrive, si guarda. In un luogo (la finestra
  del mare, la pozza, il camino, i pori della crosta) le specie vengono dalla scala sopra, la rete dalle regole di
  molecole_reazioni.js, le velocità dal bilancio dettagliato con una tabella sola di energie, la storia da Gillespie con
  gli eventi del luogo (regola 1 e 3: lo stesso indirizzo, la stessa storia chimica); i rilevatori (RAF di Hordijk e
  Steel, cicli autocatalitici, membrane sopra la CMC, polimeri che si copiano) dicono che cosa è emerso, e il forward flux
  sampling è il metodo degli eventi rari. Riassunta, la scatola ridà il carbonio del mare (`test_coerenza_scale`).
- Manca: le richieste degli altri livelli (roccia e cristallo verso il pianeta, molecola verso l'acqua, macchina
  molecolare verso la storia); la discesa alla superficie dentro la ricerca (oggi è a parte, `inFondo`, ~11 s a
  pianeta: le croste di sale dei mari chiusi si decidono solo lì); il peso dei livelli non lineari è una stima su
  centinaia di mondi di due cosmi, non sulla biblioteca intera; le leggi dichiarate
  dai consumatori dei tiri (quasi tutti leggono il tiro nudo e lo confrontano da sé con una probabilità: per la misura
  è uniforme, e i loro rami pesano 1) e il registro di `eventi.js` che annota la legge (la patch è pronta, non applicata);
  i sistemi dei pianeti delle stelle vere (hanno quello del campione); il conto dei cervelli di Boltzmann per
  osservatore; le osservazioni da fuori (una fotografia) come ingresso; la storia dell'abitabilità (`storia.js`).

## 6. Il tempo: le cause stanno prima
Lo stato di una cosa a un istante viene dalla sua storia: le leggi integrate dagli eventi d'origine fino a
quell'istante. Nessun livello usa ciò che viene dopo. Guardare indietro è la stessa funzione a un tempo precedente.
I livelli hanno ritmi diversi: quello veloce sta in equilibrio con quello lento in ogni momento, quello lento vede del
veloce solo le medie.
- Fatto: tettonica, impatti, stelle, galassie, rotazione hanno una storia vera dentro; le particelle hanno il tempo.
- Manca: la storia non si può guardare (solo lo stato di oggi); l'erosione usa il clima di oggi per tutto il
  passato; il clima non vede i continenti muoversi né la stella giovane.

## 7. Una grandezza, una fonte
La stessa grandezza si calcola in un posto solo; chiunque altro la legge da lì. Tra livelli passano solo due cose:
verso il basso le **condizioni** in un punto, verso l'alto i **flussi** e le medie.
- Fatto: temperatura, acqua, età, massa, calore interno, blocco mareale (`test_coerenza`). **Il grafo delle grandezze**
  (`src/camera/grandezze.js`): 88 grandezze, dalla galassia ai mattoni della vita, dichiarate come dato (nome, unità,
  livello, la fonte unica, da che cosa dipendono, dove si leggono in un pianeta vero di `sistema()`), con i fili con cui
  il programma chiama ogni fonte scritti in un posto solo; i cicli (clima e aria, ghiaccio e albedo) e le soglie del
  codice sono dichiarati uno per uno. `test_grandezze` lo confronta con il codice su alcune centinaia di pianeti presi
  dalla fonte unica degli eventi, e fallisce solo se il grafo non sta in piedi: 48 grandezze su 48, ricalcolate dalla
  loro fonte, coincidono ovunque entro 10⁻⁹; 14 copie su 15 e 17 «seconde vie» su 17 danno lo stesso numero; ogni
  ingresso è fatto variare a passi dell'1% e i salti sono divisi tra soglie fisiche (14 toccate) e di comodo (13); 268
  dipendenze sono ricavate dalla misura invece che scritte a mano; ciò che una cosa vista in basso impone in alto si
  calcola per intervalli (`impone`; `chiedeDalBasso` parte da `chiede` di `bolle.js`): 129 deduzioni su 129 contengono
  il vero. Sanati dopo la prima misura: la luce della stella è una grandezza sola letta a tempi diversi dalla stessa
  `stelle.stella` (oggi per il clima, al tempo del disco per la linea della neve), e viva o morta ha una via sola
  (`stelle.stellaOggi`); l'aria che resta scritta è quella della sua temperatura (la memoria degli equilibri non cambia
  più il risultato); il ciclo del carbonio lascia scritto il suo punto fisso (ghiaccio del clima e del ciclo coincidono
  entro un millesimo); il ghiaccio si conta con la curva dell'albedo; i giganti hanno un livello di riferimento
  dichiarato; la gravità di superficie ha una funzione. Tutto ciò che non torna sta in `reports/Mappa delle
  grandezze.md`, che la prova riscrive (`--rapporto`).
- Fatto (lavoro 8): la miscela degli elementi ha una fonte sola per ogni stella (`elementi.js`: quella del suo gas di
  nascita, da `galassie.js`), e disco, nucleo, mantello, crosta, aria e mare dei suoi pianeti la leggono da lì; `chimica.js`
  legge mantello, crosta e ghiacci del pianeta (`delPianeta`, `crostaDiPianeta`) e `leggi.js` l'acqua dei suoi ghiacci.
- Manca (lavoro 8): due miscele del Sole — quella fotosferica di `chimica.js` (15 elementi) resta per i pianeti fatti a mano
  delle prove —; due curve di fusione dei silicati ad alta pressione (`storia.js`, Simon di Zhang e Rogers, per la partenza
  calda; `elementi.js`, Andrault 2011, per la base dell'oceano di magma: a 90 GPa la prima sta 900 K più su); la linea della
  neve vede solo la luce della stella, la roccia anche il calore del gas che cade.
- Manca: le incoerenze che `test_coerenza` stampa; il calore che il mare riporta al clima; l'aria e il mare come un
  solo serbatoio di carbonio. E ciò che `test_grandezze` stampa: la temperatura del clima e quella a cui è stata fatta
  l'aria distano più di un grado in 142 mondi su 624 (il termostato fa l'aria a 275 K per costruzione; la ricerca a giri
  non sempre si ferma); 6 doppioni dichiarati tra moduli (la neve delle lune, il raffreddamento della nana bianca
  riscritto in `galassie.js`, quattro dati della Via Lattea e delle supernove in `risalita.js`); 13 soglie di comodo (i
  tre tipi di pianeta, il taglio di Jeans, il nome del regime della crosta, l'interruttore «vulcani > 0»…) e 25 salti
  che nessuna soglia dichiarata spiega (18 nella storia termica dell'interno; il coefficiente del calore portato, che è
  un rapporto mal condizionato dove il pianeta è quasi isotermo); il vento della stella non toglie aria; la temperatura
  del clima non torna all'interno; il tempo cosmico di `galassie.js` non conta la radiazione; 184 numeri e 25 formule
  riscritti a mano dove esiste una fonte. La superficie (mare, pioggia, erosione) è nel grafo ma fuori dal campione; gli
  archi che passano da una storia (disco, galassia) sono controllati solo per correlazione; il grafo non ha ancora il
  tempo.

## 8. Si calcola solo ciò che si guarda
E alla scala a cui si guarda. Ciò che non è guardato resta una funzione.
- Fatto: ovunque (memorie piccole, superficie in secondo piano, tessere a richiesta). La chimica di una finestra del mare
  (reazioni.js) si calcola solo quando la si guarda, dal micron in giù, in 15–120 ms; la rete delle regole cresce solo
  dove la storia porta materia (espandi); le reazioni che nel tempo guardato non si muovono restano ferme e diventano una
  conservazione. Il suolo (suolo.js) lo stesso: la cella, le tessere del rilievo, i granelli e l'acqua dei pori di un punto si
  calcolano quando lo si guarda (una finestra 3–60 ms più 70–190 ms d'immagine).

## 9. La nebbia
Quando le cose vere sono più di quante se ne possano mostrare, se ne mostra un campione che le rappresenta, e si dice
quante sono davvero. Il campione è scelto per indirizzo: gli stessi individui a ogni scala.
- Fatto: fasce di particelle, stelle di una galassia (2500 su 10¹¹), campione d'acqua.

## 10. La finestra è un punto di osservazione
Una finestra è un luogo, una scala, un intervallo di tempo e uno stato di moto di chi guarda. Il disegno è ciò che
c'è lì. Cercare un bel disegno non aggiunge niente al mondo: sceglie un indirizzo.
- Fatto: finestre di particelle con osservatore in moto; ricerca del disegno a ogni scala della mappa.
- Manca: la finestra delle particelle dentro la materia (in lavorazione); finestre salvate a ogni scala.

## 11. La bolla: da dove si calcola
Il punto da cui il resto prende forma non è un numero della biblioteca: è una **bolla di spaziotempo**, cioè un
istante con un volume di spazio (un luogo, una grandezza, un momento, uno stato di moto). Da lì si calcola ciò che
sta **attorno** (accanto, sopra e sotto di scala), ciò che c'era **prima** e ciò che viene **dopo**. Non è la bolla a
creare il mondo e non serve nessuno che guardi: gli universi ci sono tutti. Sono infiniti quelli che contengono
quella bolla esattamente così, e infiniti altri che non la contengono; fissarla vuol dire soltanto mettersi tra i
primi. Dentro quella famiglia se ne segue uno, scelto in proporzione al suo peso (regola 5), e resta quello; gli
altri sono i suoi rami (regola 3).
- **Attorno.** Verso il grande è la regola 5 (il mondo compatibile), verso il piccolo la regola 4 (il dettaglio
  condizionato), di lato la continuità: ciò che si calcola accanto deve combaciare al bordo con ciò che c'è già.
- **Dopo.** Le leggi portate avanti dalla bolla (regola 6). Dove il futuro dipende da eventi non ancora accaduti si
  apre in rami, ciascuno con il suo peso.
- **Prima.** Non è la stessa cosa del dopo: il passato è un'inferenza. Tra le storie che portano a quella bolla se ne
  sceglie una per peso; oltre il tempo in cui le piccole differenze si amplificano (poche settimane per il tempo
  atmosferico, cento milioni di anni per le orbite) le storie compatibili sono molte e restano una sovrapposizione
  finché non le si guarda.
- **Muoversi.** Spostare la bolla nello spazio, nel tempo o nella scala non cambia universo: fa calcolare regioni
  nuove dello stesso. Cambiare un evento cambia ramo. L'indirizzo della biblioteca è solo un modo di nominare una
  bolla da cui partire.
- **In tre dimensioni.** La bolla è ciò che la vista mostra: un volume vero, a un istante vero, visto da un punto
  in moto. Ogni vista a ogni scala (cosmo, galassia, sistema, pianeta, roccia, atomi, particelle) è la stessa cosa
  con un'altra grandezza.
- Fatto: l'indirizzo con luogo, tempo e rami (`intreccio.js`); la finestra delle particelle con chi guarda in moto;
  lo stato di sistema, galassia e cosmo a un istante qualsiasi (`spazio3d.js`); la bolla come oggetto (luogo anche
  solo in parte, grandezza, istante, contenuto) e, per i contenuti che i moduli sanno giudicare, il mondo che la
  contiene: `incontra` restituisce l'indirizzo completo fino al punto e il numero della biblioteca da cui entrare
  (`bolle.js`); il primo pezzo del «prima» come inferenza: il tempo dell'antenato comune di due specie di un pianeta,
  funzione pura dell'indirizzo, ultrametrica, calcolata solo dove si chiede (`albero_vita.js`, `test_albero_vita`).
- Manca: entrare nell'app da una bolla (oggi la ricerca dà un numero, ma l'interfaccia parte ancora dal numero); la
  bolla a un istante diverso da adesso (lo stato dei pianeti è solo quello di oggi: una bolla nel passato è giudicata
  su oggi, e lo dice); il passato come inferenza pesata fuori dall'albero della vita; la continuità al bordo tra
  regioni calcolate in momenti diversi come prova; la vista 3D unica a tutte le scale (in lavorazione).

## 12. Più bolle: si incontrano nell'antenato comune
Le bolle possono essere molte, prese a caso: quattro, mille. Fissarle tutte vuol dire mettersi tra gli universi che
le contengono tutte, e se ciascuna è permessa dalle leggi quegli universi esistono, purché le bolle non si
contraddicano. Fissarle è una condizione sola, fatta di più pezzi: non si fa crescere un mondo attorno a ciascuna
per poi cucirli (al bordo non combacerebbero), si condiziona lo stesso mondo a tutte insieme.
- **Dove si incontrano.** Ogni bolla dice che cosa chiede a chi le sta sopra (regola 5), e la richiesta sale lungo
  l'indirizzo. Due bolle si incontrano nel primo livello che le contiene entrambe: due sassi nello stesso pianeta,
  due pianeti di galassie diverse nel campo del cosmo. Quel livello deve soddisfare tutte le richieste insieme.
- **Posizione libera o data.** Se non si dice dove stanno una rispetto all'altra, un posto c'è sempre: in un mondo
  abbastanza grande ogni bolla possibile capita da qualche parte, tanto più lontano quanto più è rara. Se la
  posizione reciproca è data, l'incontro può essere vietato (una stella a un metro da un fiocco di neve; una bolla
  che sta nel futuro di un'altra senza poterne discendere): allora quell'universo non c'è, e lo si dice.
- **Il peso.** L'universo che le contiene tutte ha un peso: per il campo del cosmo è esatto (e^(−χ²/2), con la
  correzione lineare che fa passare il campo libero per tutte le bolle e si spegne allontanandosene); per i livelli
  non lineari lo si stima campionando. Lontane tra loro, le bolle pesano ciascuna per conto suo.
- **La causa comune.** Più bolle dicono più di una sola: mille bolle con un batterio hanno quasi sempre alle spalle
  un mondo vivo, non mille coincidenze. Tra i mondi compatibili vince quello in cui le bolle hanno una causa in
  comune. Per questo un mondo si può nominare anche con un insieme di bolle invece che con un numero: più sono, meno
  mondi restano.
- Fatto (`bolle.js`, `test_bolle`): **il campo del cosmo condizionato a più punti**, esatto: campo libero
  dell'indirizzo più la correzione lineare, in numero qualsiasi di vincoli (provato con 1, 4 e 1000), funzione pura
  di (indirizzo, vincoli) in qualunque ordine, con χ² e probabilità; i vincoli incompatibili sono riconosciuti e
  detti; lontano dai vincoli coincide col campo libero (oltre 300 Mpc entro il 2% dello scarto); media e varianza su
  400 indirizzi sono quelle della teoria; le galassie di un cosmo restano dove sono. **L'antenato comune**
  (`antenatoComune`) e l'incontro (`incontra`): le bolle nello stesso punto intersecano i loro intervalli, e se sono
  vuoti si dice quale legge lo vieta; con posizione data l'incontro può non esistere (prima della stella, fuori dal
  suo stato dell'acqua, più grande del pianeta), con posizione libera si trova sempre se ogni bolla è possibile.
  **La causa comune** (`causaComune`): il peso di «nello stesso mondo» contro «ognuna nel suo», sugli stessi mondi;
  due croste di sale stanno nello stesso mondo con probabilità 0,86 (pesa 6 volte di più), mare e ghiaccio no.
  **Bolle in galassie diverse si incontrano nel campo del cosmo** (`incontra(bolle, { nelCosmo })`,
  `chiedeAlCosmo`, `ridiscendiNelCosmo`): ogni bolla trovata chiede al cosmo la sua galassia, cioè un picco del campo
  filtrato alto quanto serve all'alone che `galassie.js` le dà; i picchi, messi nei posti dati, sono vincoli lineari
  e il peso della parte cosmica è esatto (χ²), accanto a quello stimato dei pianeti. Due bolle a distanza data
  (χ² uguale alla formula dei due picchi entro 10⁻⁷), dieci bolle in dieci galassie (χ² 16 su 10), e ridiscendendo
  ognuna torna: dal campo l'altezza, dall'altezza la massa dell'alone, dalla galassia il pianeta e il contenuto.
  A mezzo megaparsec due galassie diverse pesano e^(−173) contro e^(0,5) da libere; nello stesso punto non esistono.
  A decine di megaparsec invece due picchi costano MENO che lontani (ρ > 0): è l'ammassarsi delle galassie.
- Fatto, sul bordo (`bordo.js`, `test_bordo`): **l'impronta di bordo** di una bolla (una sfera a un istante): i
  coefficienti in armoniche sferiche della densità e del potenziale fino a ℓmax = ⌈πR/h⌉, che viene dal raggio e dalla
  grana del campo (il bordo della sua banda), esatti per il campo com'è e puri dell'indirizzo; **le bolle si incollano**
  condizionando lo stesso campo a tutte le impronte insieme: sul cerchio comune di due bolle sovrapposte le due impronte
  danno lo stesso campo entro il resto che il modello prevede, un altro mondo condizionato alle due impronte le
  riproduce, e due bolle di mondi diversi sulla stessa regione pesano quanto dice il χ² del modello (molto meno);
  **dal solo bordo** l'interno condizionato contiene il campo vero con la statistica attesa. **L'antenato comune tra
  luoghi e istanti diversi**, in tempo conforme (i coni a 45°): η_c = (η_p + η_q − |Δx|)/2 (con i raggi delle bolle),
  o il più vecchio dei due se uno sta nel passato dell'altro; oltre η_p + η_q (oggi 28 Gpc) è prima dell'inizio, e
  c'è solo con l'inflazione, dichiarata come ipotesi (il campo del modello la contiene già: è correlato oltre
  l'orizzonte, e le celle che due punti condividono sono eventi del loro passato comune). Con la stessa ipotesi il
  ramo di una cella del campo cambia solo il suo cono futuro (C9).
- Manca: l'intersezione delle richieste è fatta nel punto (temperatura, pressione) e nel tempo, non ancora per le
  distanze tra contenuti («una stella a un metro da un fiocco di neve»); tra istanti diversi c'è ora il cono (chi può
  discendere da chi), ma i contenuti di un pianeta si giudicano ancora sullo stato di oggi; l'antenato di più di due
  bolle è esatto solo quando lo sostiene una coppia; le impronte di bordo valgono per il campo lineare del cosmo
  (densità, potenziale) e non ancora per il cosmo con le sue galassie (andrebbero vincolate insieme) né per gli altri
  campi (temperatura, campo magnetico, radianza); il peso dei pianeti è stimato a livello di pianeta: i contenuti
  che decide la superficie restano «forse» finché non si scende; il cosmo delle bolle è (indirizzo, vincoli) e non
  ancora un cosmo che `cosmo.js` sa aprire: dentro
  ogni galassia si scende con il suo indirizzo d'origine, e ciò che in `galassie.js` dipende dai vicini (metà del
  giro dell'alone) resta quello del cosmo d'origine; il vincolo è l'altezza del picco, non «è un massimo»; i mondi
  delle bolle sono scelti prima del peso cosmico, non insieme; manca la legge che vieta due aloni a meno del loro
  raggio; la prova che al bordo tutto combacia oltre il campo lineare; mille bolle con un batterio (serve il contenuto
  «vivo», che nessun modulo sa ancora giudicare).

## 13. Ciò che è uguale è lo stesso
Due rami a cui si arriva per strade diverse, ma che a una scala data sono uguali in tutto ciò che a quella scala esiste,
non sono due universi: sono lo stesso (l'identità degli indiscernibili, Leibniz). La biblioteca allora non è un albero
che si ramifica soltanto, ma una rete in cui alcune strade si richiudono: un futuro di un ramo può essere il passato di
un altro. L'uguaglianza è sempre a una grana (le storie a grana grossa, Gell-Mann e Hartle): sotto quella grana i due
rami possono differire, e restano lo stesso finché nessuno guarda più fine. Una storia, per esistere, è coerente con sé
stessa; dove una richiesta non lo è, la coerenza la dà un altro ramo, non una correzione (Deutsch 1991).
- Fatto: la coerenza per rami (una bolla che contraddice ciò che c'è porta in un altro ramo: il «pianeta parallelo»).
- Manca: l'impronta del contenuto di uno stato a una grana data, oltre all'indirizzo del suo percorso, per riconoscere
  due rami uguali come uno solo; le domande che ne seguono (a che grana, con che costo, e che cosa succede ai pesi dei
  rami quando due strade portano allo stesso stato).

## 14. Anche l'immagine emerge: la resa è trasporto di luce
Ciò che si vede non si dipinge: si calcola. L'immagine è la soluzione dell'equazione del trasporto della luce (Kajiya
1986; Chandrasekhar per il trasferimento radiativo) attraverso la materia del modello: la luce nasce dove il modello la
fa nascere (stelle, gas caldo, righe, fluorescenza), viene assorbita, diffusa e riflessa con le proprietà ottiche dei
materiali del modello, e arriva a un rivelatore. Anche il rivelatore è fisica: l'occhio (curve CIE, adattamento al buio,
abbagliamento) o uno strumento dichiarato (dove non c'è luce visibile, come sotto l'atomo o dentro un orizzonte, si
mostra ciò che misurerebbe uno strumento, e lo si dice).
Maglie, volumi, splat, campioni sono solo il modo di dividere lo spazio per fare il conto, come la griglia di
un'equazione: sono leciti se ogni loro parametro viene dal modello e se, rendendoli più fini, l'immagine converge.
Un colore, una luce, un'esposizione o una forma scelti a mano sono difetti, come le soglie di comodo (regola 7):
dichiarati, e da togliere.
- Fatto: il buco nero (geodetiche vere, colore del disco dal corpo nero), l'aria (diffusione multipla da pressione e gas),
  la galassia e la ragnatela come volumi con emissione e assorbimento, la polvere che arrossa, le nebulose dalle loro righe,
  la luce zodiacale dalla funzione di fase dei grani, la scala quantistica come accumulo di misure. L'OCCHIO come
  rivelatore (`nucleo.js`, OCCHIO): si adatta alla luminanza media misurata nella fovea (2° attorno al centro dello
  schermo, dove si guarda) e la porta al grigio medio della
  percezione (L* = 50), non sotto la soglia assoluta della visione (10⁻⁶ cd/m²), con le candele dal corpo nero della stella
  del luogo; di notte i colori sfumano nella luminanza scotopica (CIE 191; Larson 1997); l'adattamento al colore è quello di
  CIECAM02. L'elenco delle scelte a mano (`reports/Scelte a mano nella vista.md`: 144 costanti con riga e classe; 9 tolte, più la schiuma al largo:
  l'esposizione, il colore della luce «adattato» a mano, i colori dei batuffoli, il terminatore, la luce di notte, il bordo
  della stella, la luce minima dei corpi lontani, e nel lavoro 9 l'increspatura minima del mare). La convergenza (C12, `test_vista`): i passi dei volumi, dell'aria, delle tabelle del cielo e l'accumulo
  convergono, con l'ordine stimato, e i valori dell'app stanno sotto la soglia dell'occhio (ΔE*ab = 2,3) — tranne la
  ragnatela in moto; l'aria spessa, che non convergeva, è stata corretta.
- Fatto (lavoro 9, `src/camera/finestra.js`): LA FINESTRA A OGNI DISTANZA per l'acqua. A ogni distanza si calcola con la
  legge di quella grana solo ciò che si inquadra, come campione condizionato della grana sopra, e riassunto ridà il padre
  (M∘μ = I, provato in `test_finestre` e in `test_coerenza_scale`). Da lontano lo spettro delle onde del vento (Elfouhaily e
  altri 1997, Mitsuyasu, la tensione superficiale di quell'acqua), che dà anche al 3D le sue onde, l'increspatura e la
  schiuma (Monahan, Koepke) al posto di tre costanti a mano; a metri e centimetri il campo delle onde di quel quadrato
  (tessere di Tessendorf con indirizzo nel tratto: due finestre sovrapposte vedono le stesse onde), il riflesso della stella
  (Cox e Munk) e il cielo di Rayleigh, la schiuma dove le onde lunghe frangono, la zattera di bolle di Deane e Stokes; i
  granelli, i fiocchi e le bolle nel loro numero (Poisson cella per cella) e con le taglie della loro legge; a nanometri
  l'acqua liquida fitta (potenziale mW) alla sua densità con ogni ione nel suo numero e col suo guscio, mai un cristallo
  solo nel vuoto. Le grane non sono soglie: ogni popolazione si vede dove la sua taglia sta tra un punto e il lato della
  finestra; ciò che è più piccolo di un punto è il colore dell'acqua (la nebbia, regola 9).
- Manca: le 67 scelte a mano rimaste — le più grandi: la curva di tonalità (servirebbe la risposta dei fotorecettori),
  l'abbagliamento e le soglie di visibilità dei punti, le forme e la luce delle nuvole, la foschia, le popolazioni di stelle
  della galassia (4300 K, 9500 K, «tre volte la luce»), gli anelli e i corpi lontani —; la convergenza delle griglie dei
  volumi, della riduzione, del salto del vuoto, della luce zodiacale e del rilievo; la ragnatela in moto; uno strumento
  dichiarato accanto all'occhio (una lunga esposizione: con l'occhio una galassia da fuori è grigia e la ragnatela sta alla
  soglia); la prova su una scheda grafica vera. Della finestra: la roccia, l'aria e il suolo (PROGETTO.md, punto 9: la stessa
  struttura); il cielo con la diffusione multipla e le nuvole (guardando giù, senza il riflesso della stella, le
  increspature si vedono appena); la schiuma che dura e che la corrente trascina; l'istante del 3D nella finestra (oggi la
  stella è a mezzogiorno dell'equinozio); il guscio degli ioni riordinato (4 vicine invece di 6).
- Fatto (lavoro 9, `src/camera/suolo.js`, `test_suolo`): LA FINESTRA A OGNI DISTANZA per IL SUOLO E LA CROSTA, con la stessa
  struttura del mare. Il padre è la cella della mappa (la tessera di geologia.js) letta da chi la calcola (erosione, clima, storia
  termica, minerali di quel pianeta, aria); a metri il rilievo fine come spettro auto-affine (H dalle pendenze, l'ampiezza dalla
  pendenza della cella, liscio sotto la lunghezza dei versanti), il suolo di Heimsath sulla curvatura, le crepe a legge di
  potenza; a millimetri i granelli (i cristalli della roccia che l'alterazione lascia, la caolinite) nel loro numero, a ottave con
  indirizzo, e i pori; la porosità di Athy con φ₀ e L dalla roccia di quel pianeta (contrazione termica, chiusura delle crepe con
  la sua gravità), Kozeny–Carman e la legge cubica, Darcy con la ricarica del clima e il tempo di residenza che ne viene; a micron
  e nanometri l'acqua dei pori in equilibrio con quella roccia e quella CO₂ (gli atomi a libro) e la superficie del minerale con
  quell'acqua sopra. Riassunte, le finestre ridanno il padre (`test_suolo`, 7 righe C6 di `test_coerenza_scale`: varianza del
  rilievo, porosità della colonna, portata nel fiume = ricarica, età di ciò che esce = pori/ricarica, atomi). I pori della crosta di
  `reazioni.js` prendono da qui φ₀, L e la residenza (prima dati per tipo e un parametro libero di 10⁴ anni): regola 2.
- Manca (suolo): la vita nei pori; i sistemi di flusso regionali (la colonna usa Dupuit: in profondità manda ~13 volte l'acqua del
  versante da solo); le finestre dal centimetro al micron nell'app (ci sono le funzioni e le schermate); il rilievo fine nel 3D;
  le tessere di geologia.js che riempiono di laghi le conche (al primo livello resta asciutto il 9% delle terre).
