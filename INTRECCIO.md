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
  mantello, pozza; prove «un ramo cambia una cosa sola» (`test_eventi`, `test_disco`, `test_lune`).
- Manca: meteo e clima non hanno eventi; restano fuori dalla fonte unica il campo del cosmo in 3D (`cosmo3d.js`),
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
- Fatto: quasi nulla. Si entra sempre dall'alto (un numero della biblioteca) e si scende.
- Manca: per ogni livello che cosa chiede a chi sta sopra; la ricerca del mondo compatibile, pesata per
  probabilità; le osservazioni come ingresso.

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
- Fatto: temperatura, acqua, età, massa, calore interno, blocco mareale (`test_coerenza`).
- Manca: le 14 incoerenze che la prova stampa; il calore che il mare riporta al clima; l'aria e il mare come un solo
  serbatoio di carbonio.

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
