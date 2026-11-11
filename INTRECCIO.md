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
- Fatto: `src/camera/intreccio.js` (l'indirizzo e le sue operazioni), `eventi.js`; prove di determinismo in
  `test_coerenza`, `test_intreccio`.
- Manca: il tempo è nell'indirizzo ma i livelli sopra la particella si calcolano solo «adesso»; superficie, mare e
  roccia usano ancora coordinate loro invece dell'indirizzo comune.

## 2. Solo leggi
Niente è disegnato o messo lì. Ogni numero del codice è di una di tre specie, e lo dice: **ricavato** (da leggi e
costanti), **misurato** (un dato di laboratorio o di natura, con la fonte, non scelto guardando il risultato),
**libero** (scelto da noi: dichiarato, e da eliminare). Ogni modulo dichiara in testa le sue leggi, i suoi dati, i
suoi parametri liberi e che cosa non torna con la realtà; le prove stampano ciò che non torna invece di nasconderlo.
- Fatto: intestazioni dei moduli; «NON TORNA» nelle prove.
- Manca: i parametri liberi rimasti (elencati nei moduli); un elenco unico generato dal codice.

## 3. L'evento, la sovrapposizione, il collasso
Ogni esito incerto è un **evento** con un indirizzo (dove e quando accade, e che cosa). Finché nessuno lo guarda
l'evento non è deciso «da nessuna parte»: tutti i suoi esiti esistono, ognuno in un mondo. Guardare un luogo vuol
dire calcolarlo in un mondo: è il collasso, e da quel momento per quel mondo l'esito è quello, sempre. Un mondo
parallelo è lo stesso indirizzo con alcuni eventi andati in un altro modo (`rami`).
Un evento può cambiare solo ciò che sta **dentro il suo contenitore e dopo di lui**: tutto ciò che è fuori, o prima,
resta identico. Così i mondi paralleli sono vicini quanto sono pochi e piccoli gli eventi che li separano.
- Fatto: particelle (`mondo.js`), impatti, anelli, galassie, stelle una per una (`sorgente`); prove «un ramo cambia
  una cosa sola».
- Manca: disco e lune cambiano ancora per corsi interi; meteo e clima non hanno eventi; un evento piccolo non risale
  mai (un decadimento non cambia nulla sopra di sé); il «dopo» non è ancora controllato da una prova.

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
Si può partire da un punto qualsiasi, anche piccolissimo. Il mondo più grande non è libero: è uno di quelli che,
scendendo con la regola 4, darebbero quel punto. Sono infiniti; se ne sceglie uno, e resta quello. Per poterlo fare
ogni livello deve saper dire **che cosa chiede a chi sta sopra** (quali condizioni lo producono) oltre a che cosa
riceve.
- Fatto: quasi nulla. Si entra sempre dall'alto (un numero della biblioteca) e si scende.
- Manca: per ogni livello la funzione inversa («quali madri mi producono»); la ricerca del mondo compatibile.

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
