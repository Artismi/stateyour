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
  le scene di `atomi3d.js`, il rumore delle tessere (`geologia.js`), le ricerche (`cercatore.js`, `vicini.js`) e
  ciò che l'interfaccia tira da un seme (`laboratorio.js`, `mappa.js`, `src/tre`); un evento piccolo risale per due vie sole
  (`risalita.js`, non ancora collegato): come flusso, sommato, o attraverso un amplificatore con il suo tempo; il «dopo» non è ancora controllato da una prova.

## 4. Dal grande al piccolo: il dettaglio è condizionato
Avvicinandosi, il livello più fine nasce da quello sopra: ne riceve le condizioni in quel punto (i campi: temperatura,
composizione, flussi, moti) e aggiunge solo ciò che da lontano non si vedeva. Ciò che aggiunge, sommato, fa zero: le
grandezze che si conservano (massa, energia, carica, elementi, quantità di moto, acqua) valgono lo stesso viste da
sopra e contate da sotto. Gli eventi del dettaglio hanno indirizzi sotto quello della madre.
- Fatto: tessere del terreno (media uguale alla madre), bolle di particelle, campione d'acqua (conteggi veri),
  bilanci di massa e metalli; `test_coerenza` (47 prove).
- Manca: una prova di conservazione per ogni passaggio di scala (oggi alcuni); il terreno fine non eredita ancora
  tutto (i fiumi tra tessere).

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
- Manca: le richieste degli altri livelli (roccia e cristallo verso il pianeta, molecola verso l'acqua, macchina
  molecolare verso la storia); la discesa alla superficie dentro la ricerca (oggi è a parte, `inFondo`, ~11 s a
  pianeta: le croste di sale dei mari chiusi si decidono solo lì); il peso dei livelli non lineari è una stima su
  centinaia di mondi di due cosmi, non sulla biblioteca intera; i pesi dei singoli eventi (`rami` non ha
  probabilità); le osservazioni da fuori (una fotografia) come ingresso; la storia dell'abitabilità (`storia.js`).

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
  (`src/camera/grandezze.js`): 81 grandezze, dalla galassia ai mattoni della vita, dichiarate come dato (nome, unità,
  livello, la fonte unica, da che cosa dipendono, dove si leggono in un pianeta vero di `sistema()`), con i fili con cui
  il programma chiama ogni fonte scritti in un posto solo; i cicli (clima e aria, ghiaccio e albedo) e le soglie del
  codice sono dichiarati uno per uno. `test_grandezze` lo confronta con il codice su alcune centinaia di pianeti presi
  dalla fonte unica degli eventi, e fallisce solo se il grafo non sta in piedi: 39 grandezze su 46, ricalcolate dalla
  loro fonte, coincidono ovunque entro 10⁻⁹; 10 copie su 12 e 17 «seconde vie» su 19 danno lo stesso numero; ogni
  ingresso è fatto variare a passi dell'1% e i salti sono divisi tra soglie fisiche (13 toccate) e di comodo (12); 212
  dipendenze sono ricavate dalla misura invece che scritte a mano; ciò che una cosa vista in basso impone in alto si
  calcola per intervalli (`impone`; `chiedeDalBasso` parte da `chiede` di `bolle.js`): 129 deduzioni su 129 contengono
  il vero. Tutto ciò che non torna sta in `reports/Mappa delle grandezze.md`, che la prova riscrive (`--rapporto`).
- Manca: le 14 incoerenze che `test_coerenza` stampa; il calore che il mare riporta al clima; l'aria e il mare come un
  solo serbatoio di carbonio. E ciò che `test_grandezze` stampa: 14 doppioni (l'aria tenuta non è esattamente quella
  della sua temperatura: `Taria` e la memoria a passi di 5 K di `climaEAria`; la CO₂ del ciclo è quella di un giro
  intermedio; luce, temperatura e raggio della stella hanno due formule (viva o morta), e il disco usa la luce a metà
  della vita; `mare.js` ha una sua ebollizione); 12 soglie di comodo (i tre tipi di pianeta, il taglio di Jeans, il nome del regime della crosta,
  l'interruttore «vulcani > 0», il ghiaccio contato a fasce…) e 15 salti che nessuna soglia dichiarata spiega (il
  calore interno di `storia.js`, `co2DelCiclo`, il calore portato dall'aria); 9 fili staccati (i metalli della stella
  non arrivano all'aria dei pianeti solidi; il vento della stella non toglie aria; la temperatura del clima non torna
  all'interno); 2 letture non dichiarate; 179 numeri e 25 formule riscritti a mano dove esiste una fonte (G, il gelo,
  `G·M/R²`, i valori «della Terra» di riserva). La superficie (mare, pioggia, erosione) è nel grafo ma fuori dal
  campione; gli archi che passano da una storia (disco, galassia) sono controllati solo per correlazione; il grafo non
  ha ancora il tempo.

## 8. Si calcola solo ciò che si guarda
E alla scala a cui si guarda. Ciò che non è guardato resta una funzione.
- Fatto: ovunque (memorie piccole, superficie in secondo piano, tessere a richiesta).

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
- Manca: l'intersezione delle richieste è fatta nel punto (temperatura, pressione) e nel tempo, non ancora per le
  distanze («una stella a un metro da un fiocco di neve») né tra istanti diversi (una bolla nel futuro di un'altra);
  il peso dei pianeti è stimato a livello di pianeta: i contenuti che decide la superficie restano «forse» finché
  non si scende; il cosmo delle bolle è (indirizzo, vincoli) e non ancora un cosmo che `cosmo.js` sa aprire: dentro
  ogni galassia si scende con il suo indirizzo d'origine, e ciò che in `galassie.js` dipende dai vicini (metà del
  giro dell'alone) resta quello del cosmo d'origine; il vincolo è l'altezza del picco, non «è un massimo»; i mondi
  delle bolle sono scelti prima del peso cosmico, non insieme; manca la legge che vieta due aloni a meno del loro
  raggio; la prova che al bordo tutto combacia; mille bolle con un batterio (serve il contenuto «vivo», che nessun
  modulo sa ancora giudicare).
