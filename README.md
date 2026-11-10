# stateyour

Scomposizione e codifica dei pattern: la loro origine e la loro replica
tramite regole di generazione geometrica.

## La camera: il pattern come sezione di un universo possibile

`index.html` è la camera. Ogni motivo è la fotografia di un evento fisico in
una cella di spaziotempo: in uno dei tanti universi possibili, le masse, i
campi e i mezzi stanno esattamente dove servono perché, guardato da qui,
quell'evento abbia la forma del motivo.

**Il seme è la storia: le condizioni iniziali.** La piastrella e i posti
degli elementi; per ogni elemento dove stanno le masse, dove
c'è campo magnetico, dove c'è materia, dove c'è vetro, dove sono gli specchi,
che cosa sono le particelle (carica, massa, vita, in che cosa decadono) e dove
nascono, verso dove, a che velocità. Le leggi sono fisse; ogni linea, ogni
spessore, ogni occhio è conseguenza.

Le leggi (`src/camera/mondo.js`) sono cinque, quelle del nostro universo:

| legge | che cosa fa | che forma dà |
|---|---|---|
| gravità | masse ferme curvano lo spazio; chi passa segue la curvatura ma non sposta la massa. Le particelle cadono con a = G·M/r², uguale per tutte (equivalenza); la luce si piega il doppio, come in un vetro di indice n = 1 + 2GM/(rc²) | orbite, rosette, lenti, caustiche |
| magnetismo | nei domini con campo B una carica gira con ω = qB/m | archi di cerchio, versi opposti per + e − |
| materia | nei domini con densità K una carica frena (Bethe, dv/dt = −Kq²/(mv²)) e si ferma dopo m·v⁴/(4Kq²) | la spirale che si stringe, l'occhio (picco di Bragg) |
| ottica | solo per la luce: va a c/n; al confine tra mezzi si rifrange (Snell) o si riflette tutta; gli specchi la riflettono, gli schermi la fermano. Le cariche non sentono né specchi né vetri | fuochi, caustiche, raggi spezzati |
| decadimento | dopo la sua vita una particella si divide nelle figlie della sua specie | il centro da cui partono i petali, le forcelle, i ventagli |

La **lastra** registra: le cariche come bolle, con lo spessore che cresce
quando la particella rallenta; la luce come un filo; le neutre non si vedono.
E registra le **sagome**: corpi opachi appoggiati sopra, impressi da un lampo
di luce all'istante zero. La lastra non è una forza: è ciò su cui l'evento
resta scritto, e ha il suo interruttore (il lampo).
Le particelle sono corpi di prova: non spostano le masse né si attirano tra
loro, quindi non c'è problema a molti corpi e il calcolo è leggero (ogni
evento di partenza si simula in pochi millisecondi). Dentro un dominio senza
masse il passo è esatto (rotazione, Bethe in forma chiusa, corda dell'arco).

**Il laboratorio** (`src/camera/laboratorio.js`) ha tre livelli, sempre
collegati:

- **Il pattern.** La piastrella (due vettori a e b) si ripete all'infinito.
  Ogni motivo è un *elemento*: un evento fisico nella sua cella, messo in uno o
  più *posti* della piastrella (con una rotazione, e forse a specchio). Le
  parole ripetute e i riempitivi sono tutti elementi. Passando sopra un motivo
  si accendono tutte le sue copie; un clic entra nell'elemento; trascinandolo
  si sposta con tutte le copie; il fondo si trascina, la rotella fa lo zoom, i
  pallini a e b cambiano la piastrella. Ogni elemento si simula una volta sola
  e si disegna in ogni copia: la copia ruotata è lo stesso evento in un
  universo ruotato, quella a specchio è l'universo riflesso con B rovesciato.
- **L'elemento.** Un evento solo, con le cose che lo producono sulla scena e
  trascinabili: la freccia verde (dove nasce la particella, verso dove, a che
  velocità), le zone (campo, materia, vetro; si spostano dal centro e si
  allargano dal quadratino), le masse, gli specchi. Il pannello mostra solo la
  cosa scelta, con la frase che dice che cosa fa ogni numero; mentre la cambi,
  in grigio resta com'era prima. Clic su una linea: la sua storia (chi è, da
  chi nasce, quali forze la piegano, perché finisce).
- **Lo spaziotempo.** L'elemento con il tempo che sale: le linee d'universo.
  La luce, velocissima, sta quasi orizzontale (il cono di luce), le particelle
  lente salgono ripide, le masse sono colonne ferme.

**Le cinque leggi si vedono** (tre forze che piegano le linee, il decadimento che
le fa nascere e finire, l'ottica della luce), ognuna col suo colore e il suo segno, nelle
schede sopra la scena (clic: mostra o nasconde i suoi segni; passandoci sopra,
la sua frase e le linee dove agisce):

| forza | colore | segno sulla scena |
|---|---|---|
| gravità | rosso | la massa, gli anelli, le frecce del campo che puntano verso di lei |
| magnetismo | blu | la zona tinta, ⊙ (B esce dal foglio) o ⊗ (entra), il cartellino col valore |
| materia | marrone | la zona a puntini, più fitti dove è più densa |
| ottica | giallo | i vetri azzurri, gli specchi dorati, i raggi di luce |
| decadimento | verde | le sorgenti e le stelle ✳ dove una particella si divide |

Ogni tratto di linea ha il colore delle forze che agiscono lì, pesate per
quanto sono forti: una spirale nasce blu (il campo la piega) e diventa marrone
verso l'occhio (la materia la frena). **Passando sopra una linea** compaiono
le frecce delle forze in quel punto (velocità nera, gravità rossa, magnetismo
blu, materia marrone) con il loro valore. Il tempo è una fetta: scorrendolo si
vedono le particelle vive (+, −, luce) con le loro frecce; la seconda barra
restringe la fetta a un intervallo.

**Accendere e spegnere.** Ogni forza ha il suo interruttore ⏻ (nelle schede
sopra la scena e nel pannello «le leggi e gli oggetti»), e ogni oggetto il suo:
una massa, una zona di campo o di materia, un vetro, uno specchio, una
sorgente. Spento, la fisica lo ignora davvero: la scena si rifà e in grigio
resta com'era. Se il tempo è alla fine, l'interruttore vale per tutta la
storia; se il tempo è fermo a metà o sta scorrendo, **scatta in
quell'istante**: prima nulla cambia, dopo le particelle proseguono nel mondo
nuovo (come un elettromagnete spento a metà esposizione), e in grigio resta
come sarebbe andata. Gli scatti sono tacche sulla linea del tempo e si tolgono
con ✕. Nel seme, un oggetto porta `spento` e la lista `interruttori`
(`{ t, acceso }`); una legge è `true`, `false` o una lista di scatti.

**Una forza alla volta.** Clic sul nome di una forza: si vede solo lei, i
suoi oggetti e le parti di linea che piega, accese tanto più quanto più conta
lì; per il decadimento, in verde le particelle nate da un decadimento.

**Da un'immagine** (File → Apri un'immagine, oppure File → Nuovo → la tavola
greca di esempio). La lettura ha quattro passi, che l'app mostra mentre
avvengono:

1. **Pulizia** (`src/preparazione.js`), solo se serve: immagine sporca o
   sfumata, luce non uniforme, disegno più chiaro del fondo, disegno che si
   distingue solo per il colore. Il colore del fondo si misura zona per zona
   (l'ombra cambia la luce, non la tinta) e si divide via; il disegno è tutto
   ciò che si allontana dal fondo, in luce o in colore; un filtro mediano toglie
   il rumore rispettando le linee sottili; la soglia è di Otsu, dentro il campo
   (fuori c'è la cornice). Su versioni rovinate della tavola greca il disegno si
   ritrova al 68% (foto con ombra, rumore forte e dominante gialla), 82%
   (negativo) e 79% (stessa luminosità, solo colore), dove senza pulizia la
   lettura falliva (44%, 0%, 0%).
2. **Lettura dei tratti**: la decodifica (scheletro, spessori, petali, dischi,
   campiture).
3. **Ricerca della fisica** (`src/camera/inversa.js`): per ogni tratto la
   particella che lo percorre. Il tratto si divide in pezzi a curvatura
   costante, ognuno l'arco che una carica fa in un campo uniforme; si allunga il
   pezzo finché resta entro mezzo pixel dal disegno, e il pezzo dopo parte dallo
   stato in cui il primo finisce: la traccia è continua e liscia come quella di
   una particella vera (due giri di spirale logaritmica: 6 archi). Ogni pezzo
   diventa un corridoio di campo lungo l'arco, largo quanto lo spazio libero
   intorno, con B = κ·m·v/q; lo spessore è la carica; alla fine del tratto la
   particella decade in neutri invisibili (le particelle di una specie decadono
   ognuna a un istante diverso: la sua vita è il tempo per percorrere il tratto). Un petalo è una carica che frena nella materia (si
   allarga verso la punta), un disco una carica pesante che si ferma subito, una
   campitura una **sagoma**: un corpo opaco appoggiato sulla lastra, impresso da
   un lampo di luce uniforme all'istante zero (un fotogramma, come una
   radiografia o i «rayogrammi» di Man Ray): esatta, piena, e senza allungare il
   tempo dell'evento. La lastra è materia
   densa e i corridoi canali vuoti: una particella che sfuggisse si fermerebbe
   subito. Le linee che si incrociano vanno su esposizioni diverse della stessa
   lastra (in un punto il campo è uno solo), come nelle camere a bolle vere.
4. **Verifica**: si rifà l'immagine con la sola fisica e la si confronta con
   il disegno letto. La tavola greca: 327 tratti, 3332 archi di campo, 60
   esposizioni, rifatta al 75% (ritrova l'85% del disegno; l'87% di ciò che
   traccia sta sul disegno). La ricostruzione geometrica, più libera, arrivava
   all'85%: la differenza è ciò che queste leggi non spiegano ancora, soprattutto
   i tratti che si assottigliano ai due capi (una carica può solo ingrossare
   verso la fine) e la forma esatta dei petali.

Il risultato è un pattern con un elemento, l'immagine, con l'originale sotto
per confronto; entrando, passando sopra una linea si vedono i suoi corridoi di
campo e le forze che la piegano.

Gli elementi di partenza (`src/camera/esperimento.js`): il fiore (un nucleo
decade in fotoni a raggiera, ogni fotone si converte in una coppia + −, il
campo richiude la coppia in un petalo), la stellina (lo stesso evento con
quattro fotoni), la voluta (una neutra decade in + e −, due spirali opposte
fino all'occhio), la palmetta (un ventaglio di cariche), la lente (una massa
piega la luce e trattiene una carica in orbita), la goccia (raggi di luce
paralleli che attraversano una goccia di vetro e si incrociano in una caustica).
Le composizioni: fiori e riempitivi, volute a specchio, palmette sfalsate,
lenti, gocce.

**È sempre possibile creare qualunque forma?** In linea di principio sì: con
abbastanza domini piccoli una carica segue a pezzi di cerchio qualunque curva
liscia, e gli specchi danno gli spigoli. Ma la domanda giusta è quanto costa
il seme. Una forma è naturale per questo universo se il suo seme è corto: un
fiore a sei petali sono una sorgente, un campo e cinque specie. Uno
scarabocchio qualunque richiede un seme lungo quanto il disegno. Ci sono poi
vincoli veri, che sono anche il carattere delle forme: una traccia è continua,
gira solo dove c'è campo, si ingrossa solo quando rallenta, e finisce con
l'occhio.

L'app è `index.html`: un menu **File** (nuovo, apri un'immagine, apri e salva
il seme, esporta l'immagine), due viste (**Pattern** ed **Elemento**, con il
piano o lo spaziotempo), annulla e rifai. Le altre pagine (`studio.html`,
`decodifica.html`, `spaziotempo.html`, `piastrelle.html`, `motore.html`) sono
pagine di laboratorio delle fasi precedenti: restano nel progetto per lo
sviluppo, ma non fanno parte dell'app.

### Come applicazione sul computer (Electron)

stateyour gira anche come programma da scrivania, in una cartella locale,
senza server e senza rete. Serve [Node.js](https://nodejs.org) (la versione
LTS). Nella cartella del progetto, una volta sola:

```bash
npm install
```

e poi ogni volta:

```bash
npm run app
```

Per farne un programma da installare come gli altri (`.dmg` su Mac, `.exe` su
Windows, AppImage su Linux), sullo stesso tipo di computer:

```bash
npm run installabile
```

Il risultato è nella cartella `dist/`. Su Mac l'app non è firmata: la prima
volta si apre con clic destro → Apri.

L'app (`electron/main.cjs`) serve le stesse pagine con un protocollo proprio,
`app://stateyour/`, perché i moduli e il processo della decodifica funzionano
solo da un'origine vera; legge solo i file della cartella del progetto. Il
lavoro nella camera si salva da solo e si ritrova alla riapertura.

## Lo studio (vecchio)

`studio.html` è il programma precedente: un solo seme al centro di tutto.

- **Da un'immagine.** Si carica un'immagine e lo studio la ricostruisce: la
  decodifica e la lingua girano in un processo a parte, e ne esce un seme di
  parole, simmetrie e istanze. Funziona con qualunque immagine d'inchiostro su
  fondo uniforme; la tavola greca è solo l'esempio pronto.
- **Giocare col seme.** Si tocca una linea per scegliere la sua parola e il
  suo elemento. Si trascinano gli ancoraggi; si cambiano spessore, sezione,
  voluta, occhio, petali, dischi, campiture; si cambia la simmetria della
  parola (specchi D o rotazioni C, ordine, asse, centro); si spostano,
  ruotano, scalano, specchiano, duplicano le istanze; si ripete una parola su
  un reticolo (p1, pm, pmm, p2, p4, cm, esagonale).
- **Il caso.** Un numero inventa un pattern intero dalla grammatica: parole
  (volute, palmette, rosette, stelle, macchie), simmetrie e una disposizione
  (reticolo, fregio, rosone, figura singola). Lo stesso numero ridà sempre lo
  stesso pattern. «Muta» sposta i parametri di un seme qualunque, anche di uno
  ricostruito, con l'intensità scelta.
- **Da zero.** Strumenti per disegnare catene a clic, petali trascinando,
  dischi, campiture per vertici, e per fissare il centro di simmetria.
- **Due viste.** Il piano che cresce col cursore del tempo, nei tre stili del
  pennello, e lo spaziotempo in 3D.
- **Il seme** si copia, si incolla e si scarica in JSON; annulla e rifai.

Per disegnare in fretta ogni elemento si simula una volta sola e le sue
traiettorie si spostano con le trasformazioni; il test dello studio verifica
che coincidano con la fisica del seme compilato (scarto sotto 1e-11).

| file | che cosa fa |
|---|---|
| `src/studio/modello.js` | il seme: parole, frase, gruppi di simmetria, compilazione, cache, inventa, muta, reticoli |
| `src/studio/app.js` | lo studio: viste, strumenti, pannello, cronologia |
| `src/studio/lavoratore.js` | la decodifica in un processo a parte |
| `src/vista3d.js` | lo spaziotempo come vista riusabile |

Le altre pagine (motore, piastrelle, decodifica, spaziotempo) restano come
laboratorio, collegate allo studio.

## Il modello

Una realtà 2D, il **piano di esistenza**, su cui si muovono **particelle**.
Ogni particella è un vettore: posizione, velocità (modulo e direzione), massa.
Il punto da cui viene emessa è il punto da cui inizia la linea. Da sola
prosegue in linea retta. La sua traiettoria può essere influenzata da due
altri piani, sovrapposti al primo:

| piano | elementi | effetto sulla linea |
|---|---|---|
| **gravitazionale** | masse puntiformi su una griglia 2D | la curva secondo la gravitazione; con una massa attiva alla volta la traiettoria è una conica esatta |
| **delle interfacce** | segmenti perpendicolari al piano, che separano due mezzi | la riflette (specchio), la rifrange (legge di Snell) o la assorbe (interrompe) |
| **dei campi** | regioni (cerchio o rettangolo) con una forza in più | **magnetico** (Lorentz): cerchio esatto di raggio v/ω; **attrito** (Stokes): rallenta; **magnetico + attrito**: spirale logaritmica esatta; **molla** (Hooke) verso una retta: sinusoide esatta |

Nessuna curva è disegnata per formula: ogni tratto è la traiettoria di una
particella sotto leggi fisiche. Il colore non fa parte del sistema.

Le masse vivono nel loro piano e non si influenzano tra loro: agiscono solo
sulla particella.

## Lo stato: blocchi di spaziotempo

Un pattern non è una sequenza di comandi ma la **descrizione di uno stato**.
Lo stato è un insieme di **blocchi**, e ogni blocco è una regione di spazio
per un intervallo di tempo, con la sua legge fisica:

```json
{ "piano": "c", "regione": { "tipo": "settore", "centro": [12, -40], "r": [9, 15], "da": 1.2, "ampiezza": 0.9 },
  "tempo": [3.1, 4.6], "legge": { "tipo": "gravita", "pos": [12, -40], "M": 1200 } }
```

In ogni istante la particella sente le leggi dei blocchi che contengono la
sua posizione e il suo tempo, nel suo **piano di esistenza**. Nessuno accende
o spegne niente: quando la particella passa da un blocco al successivo, il
punto esatto del passaggio si trova per bisezione, e la legge cambia perché
è cambiato il luogo. La linea è la linea d'universo della particella
attraverso lo stato.

- **Regioni**: cerchio, settore d'anello, semipiano, poligono, tutto il piano.
- **Leggi**: gravità di una massa, campo magnetico, attrito, molla, ferma, oppure
  più leggi insieme.
- **Tempo**: un blocco può esistere solo in un intervallo. Due tratti della
  stessa linea che passano per lo stesso luogo in tempi diversi sentono
  ognuno il proprio blocco.
- **Piani di esistenza**: ogni linea vive nel suo piano, e i blocchi di un
  piano agiscono solo sulle particelle di quel piano. Uno stelo e il suo ramo
  possono partire dallo stesso punto senza disturbarsi.
- **Sorgenti**: le particelle nascono in un punto e in un istante, con una
  direzione e una velocità. Un ramo è una sorgente posta nel punto e
  nell'istante in cui la linea madre passa per il suo ancoraggio.

La pagina del motore disegna i blocchi e ha un **cursore del tempo**: mostra
quali blocchi esistono in quell'istante e dove si trova la particella.

Restano, per i primi esempi, gli elementi accendibili (masse, interfacce,
campi), la **penna** che si può alzare e le **regole a eventi** (attraversa,
distanza, tocca, ogni N passi) con le loro azioni. Gli specchi e le lastre
di rifrazione sono già stato: superfici fisse nello spazio.

## Cosa si può disegnare

- **Rette e spezzate**: particella libera; la rifrazione piega la retta di un
  angolo fisso a ogni interfaccia.
- **Simmetrie**: una camera di specchi ripete un solo raggio in un pattern
  intero (gruppi di fregio e di carta da parati).
- **Coniche**: una massa, velocità diverse all'emissione: cerchio, ellisse,
  parabola (velocità di fuga), iperbole.
- **Spline di coniche**: con una massa per blocco, la linea è una catena di
  archi di conica con tangente continua. Un arco di
  parabola è una Bézier quadratica: i contorni dei font TrueType sono
  raggiungibili in modo esatto.
- **Linee interrotte**: la penna si alza e si abbassa a passi, o al tocco.

- **Spirali**: campo magnetico più attrito. La velocità ruota a ritmo
  costante ω e cala come e^(−γt), quindi la traiettoria si avvolge attorno a
  un centro asintotico con r(θ) = r₀·e^(−(γ/ω)·θ). La voluta pompeiana e il
  ricciolo della nuvola cinese. L'evento di **distanza** da un punto la ferma
  esattamente al raggio voluto.
- **Sinusoidi**: molla verso un asse. Lungo l'asse il moto è uniforme, di
  traverso oscilla: lunghezza d'onda 2π·v/√k.
- **Spezzate e greche**: una sola retta piegata da specchietti posti ai
  vertici. Per girare da una direzione d a una d′ lo specchio ha la normale
  lungo d − d′: la chiave greca è un raggio tra specchi a 45°.

Il caos a più corpi compare solo se due o più masse sono accese **insieme**.
Con una massa alla volta tutto è esatto e riproducibile.

## La catena: una linea continua per punti di ancoraggio

Gli archi isolati messi uno accanto all'altro non fanno ornamento. La
**catena** è il tratto principale: si danno i punti per cui la linea deve
passare, e se si vuole la tangente in ognuno, e il compilatore
(`src/catena.js`) ricava da solo il campo fisico che la produce.

- **Biarchi.** Tra due ancoraggi consecutivi la linea è fatta di due archi
  di cerchio che si raccordano con la stessa tangente. Ogni arco è un'orbita
  circolare attorno a una massa posta sulla normale a distanza r, con
  M = v²·r/G. Così la velocità resta costante in modulo e la direzione è
  continua a ogni giunzione.
- **Blocchi.** Ogni arco è un blocco: una fascia ad anello attorno al suo
  centro, tra il raggio che passa per il punto di partenza e quello che passa
  per il punto d'arrivo, valida nell'intervallo di tempo in cui la linea la
  percorre più un margine. Due archi consecutivi hanno i centri sulla stessa
  normale, quindi i loro blocchi confinano lungo quella retta: il passaggio
  avviene esattamente nel punto di giunzione.
- **Tangenti automatiche.** Dove non sono date, la tangente in un punto
  interno è la direzione tra il precedente e il successivo.
- **Voluta.** In fondo c'è un disco attorno al centro asintotico della
  spirale con un campo magnetico della stessa curvatura dell'ultimo arco, più
  un attrito, e un disco più piccolo che ferma. La spirale
  logaritmica parte senza salti né di direzione né di curvatura, e si ferma
  esattamente a distanza rMin dal suo centro asintotico, calcolato in forma
  chiusa.
- **Rami.** Un ramo è una sorgente nel punto e nell'istante in cui lo stelo
  passa per l'ancoraggio, con i propri blocchi nel proprio piano di
  esistenza: lo stelo si ramifica e ogni ramo finisce nella sua voluta.
- **Chiusa.** La linea torna al punto di partenza con la stessa tangente.

Il test `test/test_catena.mjs` verifica che la linea passi per ogni
ancoraggio con uno scarto sotto 1e-4, che non svolti mai più di 0,02 radianti
tra due passi, che la descrizione non contenga nessuna regola, che una linea
che si incrocia non confonda i propri blocchi, che la voluta si fermi a rMin,
che i rami partano dal loro
ancoraggio.

```json
{ "tratto": "catena", "parametri": {
    "punti": [[0, -110], [0, -70], [0, -30], [0, 10]],
    "tangenti": [[0, 1], [0, 1], [0, 1], [0, 1]],
    "rami": [{ "da": 1, "catena": { "punti": [[22, -44], [44, -54], [46, -76]],
               "tangenti": [[0.45, 1]], "voluta": { "giri": 2.2, "rMin": 0.9, "verso": "destra" } } }] },
  "simmetria": { "tipo": "D", "n": 1, "fase": 90 } }
```

Con la catena sono costruiti il girale (uno stelo che continua da una cella
all'altra), la palmetta, il candelabro e la nuvola ruyi in `src/celle.js`.

## Spessore e ricorsione: il corpo della linea

Nelle tavole ogni linea è un corpo che si ingrossa e si assottiglia, e un
girale è ricorsivo. Tutti e due nascono dalle proprietà della particella.

- **Spessore.** Ogni particella porta uno spessore. Nel disegno vale
  spessore · |v| / |v₀|, quindi dove la particella rallenta la linea si
  stringe. Nella voluta l'attrito frena e la velocità è proporzionale alla
  distanza dall'occhio: la linea si assottiglia da sola fino al punto.
- **Rastremazione.** Lungo la catena lo spessore cala come e^(−βt). Il
  parametro `rastremazione` è il rapporto tra lo spessore alla fine e
  all'inizio.
- **Regola di Leonardo.** A ogni ramo la linea madre cede una quota q della
  sezione: il ramo parte con w·√q e la madre continua con w·√(1−q), quindi la
  somma dei quadrati degli spessori si conserva come nei rami degli alberi.
  La cessione è graduale, su un tratto di circa quattro spessori del ramo, e
  il nodo si raccorda senza gradino. Con `cedeSpessore: false` lo stelo resta
  costante, come nel girale che continua da una cella all'altra.
- **Rami simili.** Un ramo `{ da, simile: { scala, angolo, specchia } }` è una
  copia della catena radice, con i suoi rami, portata sull'ancoraggio e
  ruotata, scalata, eventualmente specchiata. La quota è scala², così la copia
  è in scala anche nello spessore. La ricorsione si ferma dopo `profondita`
  livelli. L'acanto in `src/celle.js` ha tre livelli di volute simili da una
  sola definizione di quattro punti.
- **Voluta pura.** Una catena di un solo punto parte direttamente nella
  voluta, con raggio iniziale `R`: è il riccio che spunta da un ramo.

Il **pennello** (`src/pennello.js`) fa della linea un corpo spostando ogni
punto lungo la normale di metà spessore. Ha tre stili: **pieno**, il tratto
riempito; **contorno**, il doppio filo che segue l'unione dei corpi come nelle
incisioni; **filo**, la linea senza spessore.

Il test `test/test_spessore.mjs` verifica la conservazione della sezione al
nodo, l'assenza di salti, lo spessore finale della voluta uguale a
w·rMin/r₀, la voluta pura e che il ramo simile sia la radice in scala nella
lunghezza, nella corda e nello spessore.

## Gli elementi greci: petali, dischi, occhi, fili

Dalla tavola greca n. 6 della *Grammar of Ornament* vengono quattro elementi,
tutti da leggi fisiche.

- **Petalo** (`petalo`). La particella parte dalla base con velocità 1 da un
  centro che la respinge con una molla, cioè la legge di Hooke con rigidità
  negativa. L'energia dà v² = 1 + k·s², quindi la velocità resta quasi
  costante all'inizio e poi cresce con la distanza. Col pennello lo spessore
  segue la velocità: gambo sottile e punta larga e tonda, la spatola dei petali
  greci. Un campo magnetico lo incurva. Si chiede con lunghezza L, larghezza in
  punta W, larghezza alla base b e curva.
- **Disco** (`disco`). Un'orbita magnetica di raggio d/4 tracciata con
  spessore d/2: un disco pieno di diametro d.
- **Occhio della voluta** (`voluta.occhio`). Quando la spirale arriva al suo
  centro asintotico nasce lì un disco pieno, nel proprio piano.
- **Filo di sezione costante** (`esponente: 0`). Lo spessore vale
  spessore · (|v|/|v₀|)^esponente. Con 1 è il pennello che si stringe dove la
  particella rallenta; con 0 è il filo di metallo dei viticci greci.

La corolla accetta un profilo di scale, una per petalo, e `simmetrica` per
specchiare le copie oltre la metà. Accetta anche `centro` per spostare la
palmetta. Le piastrelle `palmetta_greca` e `spirali_greche` le usano.

## La decodifica: dall'immagine al seme

`src/decodifica.js` legge un'immagine di ornamento e la riscrive nel linguaggio
del progetto, poi fa crescere il seme e misura quanto la ricostruzione somiglia
all'originale. I passi:

1. **Colori.** Tre gruppi di colore (k-medie). L'inchiostro è il più scuro, il
   fondo è il più frequente al centro, e si ritaglia il campo del fondo, così
   cornice e titoli restano fuori.
2. **Maschera.** Ogni pixel misura quanto sta dalla parte dell'inchiostro;
   l'immagine si ingrandisce prima della soglia per avere bordi lisci.
3. **Distanza.** La trasformata di distanza euclidea esatta dà lo spessore.
4. **Scheletro.** Assottigliamento di Zhang e Suen, poi via i pixel ridondanti.
5. **Grafo.** Estremi, nodi, tratti; via i rametti che restano dentro il disco
   del loro nodo.
6. **Buona continuazione.** Dagli estremi si cammina scegliendo a ogni nodo la
   via più diritta; ciò che resta diventa un ramo agganciato al suo nodo.
7. **Figure.** Una macchia tonda è un disco. Un tratto corto e libero che si
   allarga con regolarità verso una punta è un petalo. Il resto è una catena.
8. **Codifica.** Per ogni catena: ancoraggi (Douglas e Peucker), tangenti,
   profilo di spessore misurato lontano dai nodi, rami. Il **profilo** è uno
   spessore per ancoraggio: tra due ancoraggi la particella acquista o perde
   materia e lo spessore cambia linearmente.
9. **Residuo.** Si fa crescere il seme, si toglie dall'inchiostro ciò che è già
   coperto, e quel che resta diventa **campiture** (vedi sotto). Le passate
   sono tre.

Sulla tavola greca n. 6 la codifica ha 250 catene, 16 petali, 1 disco e 263
campiture:

| misura | valore |
|---|---|
| IoU con l'inchiostro | 85,5 % |
| richiamo | 92,4 % |
| precisione | 91,9 % |

### Le campiture: biliardi

Una superficie piena è un **biliardo**. Il suo contorno, rientrato di mezza
penna, è una catena chiusa di specchi; i buchi pure. Dentro, una particella
con spessore parte con un angolo irrazionale e rimbalza. In un poligono
generico le traiettorie si infittiscono fino a coprirlo: dopo un cammino
lungo L la parte coperta è circa 1 − e^(−L·w/A), e con L = 4,5·A/w la
copertura supera il 98 %. Il tratto `campitura` è disponibile anche
nell'alfabeto; i contorni si tracciano con l'algoritmo di Moore e si
semplificano con Douglas e Peucker. A ogni rimbalzo la linea si spezza nel
disegno, così gli angoli restano vivi.

Un pattern disegnato dal progetto e poi decodificato si ritrova con IoU 82 %.
La pagina `decodifica.html` mostra l'immagine, la lettura e la ricostruzione;
accetta qualunque immagine e porta il seme nello spaziotempo. Da riga di
comando:

```bash
node strumenti/decodifica.mjs esempi/greco_6.png seme.json
```

L'immagine di esempio è la tavola *Greek No. 6* di Owen Jones, *The Grammar
of Ornament* (1856), di pubblico dominio.

## La lingua: dalla forma alla struttura

`src/lingua.js` legge la struttura di ciò che la decodifica ha riscritto: che
cosa si ripete, con quale simmetria, dove e come. Il seme diventa
**vocabolario × frase**: le parole, ognuna scritta una volta sola nel suo
dominio fondamentale con la sua simmetria, e dove compare ognuna con quale
trasformazione.

1. **Atomi.** Le figure connesse dell'inchiostro.
2. **Reticolo.** Una figura grande che si sovrappone a sé stessa spostata è
   una ripetizione per traslazione. I due spostamenti più corti e non
   allineati sono i vettori del reticolo; la figura si taglia in celle con i
   bordi dove passa meno inchiostro, e ogni cella diventa un atomo.
3. **Simmetria.** Per ogni atomo, specchi (D_n) e rotazioni (C_n) attorno al
   baricentro, misurati sovrapponendo la figura trasformata a sé stessa.
4. **Parole.** Atomi uguali a meno di una similitudine (spostamento,
   rotazione, scala, specchio) sono la stessa parola. La similitudine si
   cerca sulle sagome e si raffina ai minimi quadrati (Procuste).
5. **Dominio fondamentale.** Prima la struttura, poi la lettura: di una figura
   simmetrica si decodifica solo metà, o uno spicchio, e il resto lo genera la
   simmetria. Se non basta, si cercano le orbite: gli elementi gemelli dove la
   simmetria li porterebbe.
6. **Istanze.** Un'istanza è la parola intera trasformata; se non basta,
   prende solo le parti che ha davvero e scrive per esteso le sue
   **varianti** (contenitore fisso, contenuto che varia).
7. **Verifica.** Ogni ipotesi si accetta solo se la figura ricostruita dalla
   lingua copre l'inchiostro quanto la ricostruzione letterale, entro tre
   punti (F di precisione e richiamo con un pixel di tolleranza). Altrimenti
   si prova una simmetria più semplice, poi si scrive la figura per esteso: la
   descrizione più corta che non perde fedeltà.

Il testo della lingua, sul pattern di prova:

```
VOCABOLARIO
  A   D1  [ 4 catene, 7 campiture ]  ×4  (1 originale, 3 identica)
  B   D1  [ 5 catene, 5 campiture ]  ×3  (1 originale, 1 specchio, 1 identica)
  ...
TAVOLA = 4·A + 3·B + 2·C + 2·D + 6·E
seme: 134 elementi decodificati → 27 nel vocabolario (5.0 volte più corto)
```

| prova | risultato |
|---|---|
| quattro spirali, tre palmette specchiate, due stelle | 5 parole, seme 5 volte più corto, IoU 82,8 % |
| girale connesso di quattro celle | reticolo con passo 113,3 (atteso 114) |
| tavola greca n. 6 | 40 parole, 27 simmetriche, seme da 530 a 428 elementi, IoU 83,4 % |

La tavola greca ripete poco: è una raccolta di motivi diversi, e i suoi
gemelli sono disegnati a mano. Sui pattern ripetitivi la lingua accorcia il
seme molte volte. La pagina della decodifica mostra il testo della lingua,
disegna parole, assi e reticoli sulla lettura, e fa crescere a scelta il seme
letterale o quello della lingua; lo spaziotempo usa quello della lingua.

## Lo spaziotempo in tre dimensioni

`spaziotempo.html` mostra il pattern come insieme di avvenimenti. Il piano
orizzontale è il piano di esistenza, l'asse verticale è il tempo, e ogni
particella lascia una **linea d'universo** che sale. La proiezione a terra è
il pattern.

- Ogni tratto di linea d'universo ha il colore della legge che lo genera in
  quell'istante (il motore registra la legge attiva in ogni punto): gravità,
  magnetico, magnetico con attrito, molla, retta libera.
- Il **piano del tempo** sale col cursore e mostra lo stato nell'istante t:
  il pattern cresciuto fin lì, le particelle in viaggio, i blocchi che
  esistono ora.
- Le **masse** sono fili verticali che durano quanto il loro blocco; le
  **forze** sono frecce nel piano all'altezza dell'istante in cui agiscono.
- Si ruota trascinando, si avvicina con la rotella, si sposta col maiuscolo.
  Mostra la tavola decodificata, ogni piastrella e ogni esempio del motore.

## Geometria esatta: dal disegno voluto ai parametri fisici

I tratti dell'alfabeto si chiedono in termini geometrici e il sistema ricava
da solo massa, velocità e regole di arresto:

| tratto | parametri | come nasce |
|---|---|---|
| `arcoCerchio` | r, da, a | orbita circolare, fermata sul raggio all'angolo `a` con verso, così l'arco può superare i 180° |
| `ellisse` | a, b | e = √(1 − b²/a²), massa nel fuoco, velocità all'apside, chiusa al rientro sull'asse |
| `poligono`, `stella` | n, r, k | una particella per lato dal vertice i al vertice i+k, ognuna con la propria regola d'arresto |
| `spirale` | r₀, rMin, giri | γ = −ω·ln(rMin/r₀)/(2π·giri), velocità iniziale e punto di partenza dal centro asintotico |
| `sinusoide` | λ, A, periodi | k = (2π·v/λ)², velocità trasversale A·√k |
| `spezzata`, `greca` | punti | uno specchio per vertice, assorbitore all'arrivo |

I test (`test/test_campi.mjs`) confrontano la spirale con la soluzione
analitica e controllano gli zeri e l'ampiezza della sinusoide.

## L'onda

Masse in fila sulla riga `y = y0`. Ogni massa agisce solo nel suo blocco: il
rettangolo sopra (o sotto) la riga tra un attraversamento e il successivo. La
particella passa da un blocco all'altro quando attraversa la riga. La particella attraversa la riga in un apside, cioè con la
velocità perpendicolare alla riga, quindi per la massa successiva è di nuovo in
un apside: parte una nuova mezza ellisse dall'altro lato, con tangente continua.

Con `L` la distanza tra due attraversamenti e `f` la distanza della massa
dall'attraversamento di sinistra:

```
semiasse maggiore   a = L / 2
ampiezza dell'onda  b = sqrt( f · (L − f) )
eccentricità        e = |L/2 − f| / (L/2)
velocità all'apside v² = G·M · ( 2/r − 2/L )     con r = f oppure L − f
```

Perché la velocità sia continua allo scambio, ci sono due modi:

1. **offset alternato** `f, L−f, f, …` e **masse tutte uguali**: a ogni
   scambio la particella dista `L−f` sia dalla massa che lascia sia da quella
   che prende. Le ellissi sono speculari, l'onda è simmetrica;
2. **offset costante** `f`: le masse devono scalare di
   `M(i+1) / M(i) = ( f / (L−f) )²` a ogni passo.

Con `f = L/2` le ellissi sono cerchi: l'onda è una catena di semicerchi. Il
test `test/test_onda.mjs` verifica che gli attraversamenti cadano in
`x0 + i·L`, che l'ampiezza sia `b` entro l'1 %, e che senza il rapporto delle
masse l'onda si rompa.

## La codifica con regole (i primi esempi)

```json
{
  "nome": "…", "G": 1, "dt": 0.02, "passi": 20000, "limiti": [0, 0, 1000, 600],
  "emettitori": [{ "id": "p", "pos": [80, 300], "angolo": 90, "v": 31.6 }],
  "masse":      [{ "id": "m0", "pos": [120, 300], "M": 30000, "acceso": true }],
  "interfacce": [{ "id": "s", "a": [760, 100], "b": [900, 240], "tipo": "specchio" },
                 { "id": "l", "a": [300, 60], "b": [300, 540], "tipo": "rifrazione", "n1": 1, "n2": 1.6 },
                 { "id": "muro", "a": [60, 560], "b": [960, 560], "tipo": "assorbe" }],
  "regole": [
    { "quando": { "tipo": "attraversa", "a": [80, 300], "b": [81, 300] },
      "fai": [{ "tipo": "staffetta", "lista": ["m0", "m1", "m2"] }] },
    { "quando": { "tipo": "tocca", "id": "s" },  "fai": [{ "tipo": "accendi", "id": "m0" }] },
    { "quando": { "tipo": "ogni", "passi": 40 }, "fai": [{ "tipo": "inverti", "id": "penna" }] },
    { "quando": { "tipo": "passi", "n": 5000 },  "fai": [{ "tipo": "ferma" }] }
  ]
}
```

Eventi (`quando`): `attraversa` una retta `a→b` (con `verso` opzionale),
`tocca` un'interfaccia, `passi` n, `ogni` n passi.
Azioni (`fai`): `accendi`, `spegni`, `inverti` (di una massa, un'interfaccia o
della `penna`), `staffetta` su una lista, `ferma`.

Ogni particella porta con sé il proprio stato di accensione: più emettitori
nella stessa partitura sono indipendenti e deterministici.

## L'alfabeto delle piastrelle

Il motore fisico fa gli elementi. Sopra c'è una **grammatica** che li compone
e li ripete. Analizzando un pattern lo si scompone sempre negli stessi ruoli,
e gli stessi ruoli bastano a ricomporlo:

| livello | simbolo | cosa è |
|---|---|---|
| **tratto** | `arco`, `uncino`, `onda`, `zigzag`, `ventaglio`, `cerchio`, `goccia`, `segmento`, `quadrato`, `rombo` | una linea del motore, in coordinate locali |
| **motivo** | `C_n(tratto)`, `D_n(tratto)` | il tratto moltiplicato da una simmetria puntuale: `C_n` ciclica (n copie ruotate, circolare ma non speculare; la fase ruota tutte le copie), `D_n` diedrale (n rotazioni più n assi di specchio, 2n copie; la fase è l'angolo del primo asse). `D1` con fase 90 è lo specchio sull'asse verticale, `D2` sono i quattro spicchi, `D4` gli otto |
| **cella** | `CELLA L [ … ]` | la piastrella, un quadrato di lato L con ruoli |
| ↳ `centro` | | il motivo centrale |
| ↳ `angoli`, `lati` | | i riempitivi che quadrano il cerchio, ai quattro angoli o a metà dei lati |
| ↳ `corolla` | `n×motivo @r φ` oppure `@r da°→a°` | n copie su un cerchio di raggio r, o su un arco tra due angoli (il ventaglio): la cornice ciclica, simmetrica o no; la scala può variare lungo l'arco |
| ↳ `fusto` | `n coppie {…}` | un asse verticale con coppie di elementi specchiati a varie altezze (il candelabro) |
| ↳ `contenitore` | | ciò che si ripete uguale in ogni cella |
| ↳ `contenuto` | `{A, B, C} ritmo ABAC` | ciò che varia, scelto dal ritmo lungo la riga, la colonna o la diagonale |
| **reticolo** | `RETICOLO gruppo c×r` | la ripetizione: `p1` identica, `pm` specchiata a colonne alterne, `pmm` specchiata in entrambe le direzioni, `p2` ruotata di 180°, `p4` ruotata di 90°, `pg` slittata, `cm` a righe sfalsate |
| | `RETICOLO esagonale p1\|p3\|p6\|p31m c×r` | le celle sui centri di un impaccamento di esagoni: righe sfalsate di L/2 a distanza L·√3/2 |

Dalle tavole della *Grammar of Ornament* sono ricostruite in `src/celle.js`:
il reticolo esagonale bizantino con stelle {6/2}, le stelle {8/3} in quadrato,
il guilloche di cerchi, il ventaglio egizio, il candelabro pompeiano, la greca
e la nuvola cinese.

## Il seme: la configurazione di partenza

Per ogni pattern esiste una configurazione iniziale con tutto al suo posto:
le masse, i campi, gli specchi, i blocchi di spaziotempo, e le particelle già
orientate nelle loro sorgenti. Da lì **una sola simulazione** genera il
pattern intero. Questa configurazione è il **seme** (`src/seme.js`).

Le simmetrie e la ripetizione non copiano linee già disegnate. La grammatica
produce istanze, cioè coppie tratto e trasformazione, e il seme trasforma lo
**stato** di ogni tratto e lo colloca nella configurazione. La trasformazione
è fisica. Con una similitudine di scala k la velocità scala di k e il tempo
resta lo stesso, così ogni accelerazione scala di k e le leggi si adattano da
sole:

| legge | trasformata |
|---|---|
| gravità | M′ = k³·M |
| campo magnetico | ω′ = ω, cambia verso se c'è uno specchio |
| attrito, molla | invariati |
| tempi, passi, dt | invariati |
| interfacce di rifrazione, versi, semipiani | uno specchio scambia sinistra e destra |

Ogni copia vive nel proprio piano di esistenza, così le copie non si
disturbano: è la stessa legge in un altro luogo. I piani sono percorsi: un
elemento del piano `s3` agisce sulle particelle di `s3` e dei suoi sottopiani
`s3/c`, `s3/cr0`.

Il test `test/test_seme.mjs` fa crescere il seme di dodici piastrelle e
verifica che dia le stesse linee del calcolo tratto per tratto, con uno
scarto sotto 1e-10. Tra queste ci sono specchi, rotazioni, il reticolo
esagonale e una voluta specchiata, dove il campo magnetico deve cambiare
verso.

La pagina delle piastrelle fa crescere il reticolo dal seme. Il cursore del
tempo parte dalla configurazione iniziale: masse, specchi e sorgenti
orientate, piene quelle che partono subito e vuote quelle dei rami che
nasceranno dopo. Il bottone **scarica il seme** salva la configurazione
completa in JSON.

Una piastrella intera si legge in una riga, la sua **parola**:

```
CELLA 120 [ centro D4(arco) | angoli 4×uncino | corolla 16×segmento @46 ]  ×  RETICOLO p1 6×4
CELLA 110 [ contenitore quadrato | contenuto {C6(goccia), cerchio, D2(zigzag), D3(arco)} ritmo ABACABAD riga ]  ×  RETICOLO p1 7×4
```

La pagina `piastrelle.html` mostra la cella scomposta per ruoli (ogni ruolo
col suo colore), il reticolo e la parola. La codifica JSON è in `src/celle.js`.

## Struttura

```
src/motore.js      il motore: blocchi di spaziotempo, vettori, RK4, gravità, campi (Lorentz, Stokes, Hooke), ottica, passaggi per bisezione
src/partiture.js   i generatori: onda, coniche, camera di specchi, lastre, interruttore
src/app.js         la pagina del motore: sceglie, simula, disegna, esporta il JSON
index.html         la pagina del motore
src/motivi.js      i tratti dell'alfabeto, ognuno una partitura del motore
src/catena.js      la catena: ancoraggi → biarchi → blocchi di spaziotempo, volute, rami
src/grammatica.js  istanze: motivo (C_n, D_n), cella (ruoli), reticolo (gruppi); parola
src/seme.js        il seme: lo stato di ogni istanza trasformato, una sola configurazione iniziale
src/pennello.js    il pennello: la linea come corpo, pieno, contorno o filo
src/decodifica.js  la decodifica: immagine → maschera → scheletro → catene, petali, dischi, campiture → seme
src/lingua.js      la lingua: atomi, reticoli, simmetrie, parole, dominio fondamentale, verifica → vocabolario × frase
src/spaziotempo.js la vista 3D: linee d'universo, piano del tempo, masse, forze
decodifica.html    la pagina della decodifica
spaziotempo.html   la pagina dello spaziotempo
strumenti/         il lettore PNG per Node e la decodifica da riga di comando
esempi/            la tavola greca n. 6
src/celle.js       le piastrelle di esempio
src/piastrelle.js  la pagina delle piastrelle
piastrelle.html    la pagina delle piastrelle
test/              i test (node, senza dipendenze)
```

## Uso

```bash
npm test
```

```bash
npm start
```

poi apri `http://localhost:8000`: si apre lo studio. Il cursore del tempo scorre lo stato. I cursori dell'onda mostrano in diretta le
formule e rigenerano la partitura; il JSON nel pannello è modificabile e si
rigenera col bottone.

## Prossimi passi

- **intrecci**: ora che la linea ha spessore, il sopra/sotto dei nastri
  (guilloche, nodi): a ogni incrocio la linea che passa sotto si interrompe;
- **foglie**: lobi pieni attorno ai nodi, come le guaine d'acanto;
- **celle annidate**: una cella come tratto di un'altra, e una cornice attorno
  al reticolo (il bordo del tappeto);
- i restanti gruppi di carta da parati (p4g, p3m1, p6m) e reticoli rombici;
- **continuità della curvatura** anche tra un arco e l'altro (oggi è garantita
  solo all'ingresso della voluta): al posto dei biarchi, spirali di Eulero
  ottenute con un campo magnetico che cresce lungo il percorso;
- propagazione analitica delle coniche al posto di RK4;
- **il seme compatto**: una sola stringa al posto del JSON;
- portare allo stato anche gli esempi che usano ancora le regole (il
  tratteggio della penna, lo specchio che accende la massa, le staffette dei
  motivi di base);
- **la lingua completa**: riconoscere i gruppi di carta da parati per nome,
  le figure composte come frasi di parole, i ruoli della cella (centro,
  corolla, angoli), e scrivere la lingua con la stessa parola della grammatica;
- **più colori**: una maschera per colore, ognuna decodificata come strato;
- **volute fisiche nella decodifica**: le spirali decodificate oggi sono
  catene di molti ancoraggi; riconoscerle e codificarle come volute (campo
  magnetico e attrito) renderebbe il seme più corto;
- **risoluzione**: con immagini più grandi i petali piccoli si separano meglio.
