# stateyour

Scomposizione e codifica dei pattern: la loro origine e la loro replica
tramite regole di generazione geometrica.

## La camera: il pattern come sezione di un universo possibile

`index.html` è l'app (anche come programma da scrivania, vedi sotto). Ogni
motivo è la fotografia di un evento fisico: particelle che attraversano uno
spazio dove la natura ha messo masse, campi e materia. Niente oggetti
costruiti: niente specchi, vetri, schermi o fasci di luce.

### Le quattro leggi (`src/camera/mondo.js`)

| legge | che cosa fa | che forma dà |
|---|---|---|
| gravità | masse ferme curvano lo spazio; chi passa segue la curvatura ma non sposta la massa. Le particelle cadono con a = G·M/r², uguale per tutte (equivalenza); la luce si piega il doppio | orbite, rosette |
| magnetismo | dove c'è campo B (a zone, o continuo come in natura: onde lunghe, cristalli) una carica gira con ω = qB/m | archi, spirali, trocoidi, versi opposti per + e − |
| materia | dove c'è materia (a zone o a nubi) una carica frena (Bethe, dv/dt = −Kq²/(mv²)) e si ferma dopo m·v⁴/(4Kq²) | la spirale che si stringe, l'occhio (picco di Bragg) |
| decadimento | una particella instabile si divide nelle figlie della sua specie; ognuna decade quando capita (la specie dà la vita media; angoli e quote possono essere a caso in un intervallo, ripetibili dal seme) | centri, forcelle, ventagli, sciami |

Le particelle sono corpi di prova: non spostano le masse e non si attirano
tra loro, quindi niente problema a molti corpi e calcolo leggero. Dove il campo
è uniforme il passo è esatto (rotazione, Bethe in forma chiusa, corda
dell'arco); vicino alle masse la gravità entra con mezzi calci (Verlet); nei
campi continui il passo resta piccolo rispetto alla loro lunghezza d'onda.

**La lastra** non è una legge: è ciò su cui l'evento resta scritto. Registra
le cariche come bolle, con lo spessore che cresce quando la particella
rallenta; le neutre e la luce non lasciano traccia. Per le immagini lette
registra anche le **sagome**: corpi opachi appoggiati sopra, impressi da un
lampo all'istante zero (le campiture), con il loro interruttore.

### La biblioteca (`src/camera/biblioteca.js`)

Come la biblioteca di Babele di Borges, che contiene tutti i libri possibili,
la biblioteca contiene tutti gli universi possibili: ognuno ha un indirizzo, un
numero. Dal numero il caso (ripetibile) mette nello spazio solo ciò che la
natura ci mette: masse sparse (poche grandi, molte piccole), un campo
magnetico che varia dolcemente (una somma di onde lunghe), nubi di materia,
qualche cristallo (dove il campo si ripete con il passo del reticolo: l'unica
ripetizione che non è una copia), una pioggia di raggi cosmici dai bordi e
decadimenti spontanei qua e là. Le particelle sono quelle di un piccolo
catalogo naturale (protoni, pioni, muoni, elettroni, fotoni, kaoni neutri) con
le loro vite medie. Un universo si simula in circa un decimo di secondo.

Il pattern non si costruisce: **si trova**. Nell'app (File → Nuovo → la
biblioteca) si sfogliano gli universi (◀ ▶, il dado, o un numero), si sposta e
si ingrandisce la **finestra** sull'universo, e con la barra del tempo e la
fetta si sceglie **quando** guardare.

**Il caleidoscopio.** Un ornamento vero non è una figura copiata accanto a sé:
è un pezzo piccolo di piano ripetuto da un gruppo di simmetrie che riempie il
piano (i diciassette gruppi delle carte da parati, quelli dei pavimenti arabi e
delle tavole di Owen Jones). Nei caleidoscopi il pezzo è un triangolo e le
simmetrie sono specchi lungo i suoi lati: ogni linea che tocca un lato continua
nella sua immagine, e intorno ai vertici nascono stelle e rosoni
(`src/camera/pattern.js`). Qui il pezzo è un triangolo della sezione
dell'universo: la natura disegna il triangolo, gli specchi della ripetizione
fanno il resto, come nei cristalli e nei fiocchi di neve. Le ripetizioni:
caleidoscopio a sei (dodici copie fanno un esagono, stelle a sei punte),
caleidoscopio a quattro (otto copie fanno un quadrato, stelle a quattro e a
otto punte), a specchio, a giro, affiancata, da sola. Il «giro del triangolo»
sceglie quale spicchio della finestra entra nel caleidoscopio. Nella vista **la
finestra** il triangolo è segnato in arancione e il resto è velato.

**Da che angolo.** L'universo è un piano più il tempo: uno spaziotempo. La
lastra «da sopra» guarda lungo il tempo e vede solo il piano. Ma la sezione si
può guardare inclinata (`src/camera/sezione.js`: inclinazione, rotazione,
scala del tempo): allora il tempo diventa una direzione del disegno, e una
spirale diventa un'elica che, proiettata, è un'onda, una trocoide, una catena
di anelli come un cordone di fregio; un elettrone che gira e deriva nel campo
disegna un guilloché.

**Il dado che porta a cose belle.** Sfogliare a caso dà quasi sempre sezioni
generiche. Ora il dado sceglie anche il caleidoscopio e il giro del triangolo, e
misura il **pattern finito**, non la finestra: un ornamento ha abbastanza
inchiostro ma non troppo, divide il fondo in **celle** di grandezza media (le
maglie di un intreccio, i petali di un rosone) invece che in buchi minuscoli o
grandi vuoti, è **nitido** (pochi ritagli minuscoli dove tante linee si
incrociano quasi nello stesso punto), ha linee **distese** (non spirali
strette: i riccioli ripetuti sono ondulamenti, non ornamenti) e pochi
frammenti. La misura descritta qui sotto è quella di prima, per la sezione da
sola. Il dado (`src/camera/cercatore.js`, in un processo a parte) prova
molti universi e, per ognuno, molte inquadrature (dove, quanto larga, da che
angolo, quale fetta di tempo), e tiene la più bella secondo una misura
dichiarata: pieno (né vuota né satura), equilibrio (il disegno sparso nella
finestra), simmetria (specchi e mezzo giro), ripetizione (il motivo che torna),
curve (le linee che girano) e ordine (pochi motivi forti invece di tante linee
scollegate). In tre secondi trova sezioni che valgono in media tre volte quelle
prese a caso. «✨ più bella qui» cerca solo nuove inquadrature dell'universo che
si sta guardando. La misura conta anche la **pulizia**: i frammenti, pezzi di
linea corti che attraversano la finestra senza fare niente, sembrano rumore.

**I rami paralleli.** Ogni decadimento è un evento quantistico: quando avviene e
in che direzioni partono le figlie è caso vero. Ogni particella ha un indirizzo
nella sua genealogia (la sorgente 3, la sua figlia 3.0, la nipote 3.0.1) e il
suo evento ha un caso suo (`casoEvento` in `src/camera/mondo.js`). Un universo
parallelo è lo stesso universo con alcuni eventi andati diversamente
(`mondo.rami`): fino a quell'istante è identico, dopo cambia solo ciò che ne
discende. Anche l'emissione di un raggio cosmico (quando parte, con che
direzione esatta) è un evento. Perfezionare una sezione (`src/camera/vicini.js`)
è cercare il ramo giusto: si trova la linea storta o spezzata, si risale al
decadimento da cui è nata e si passa al ramo in cui è andato diversamente. È la
correzione minima, ed esiste davvero (nel senso dei molti mondi di Everett).

**La fisica vera (primo passo).** Le regole sono ora quelle vere, a ogni scala
che c'è (`src/camera/unita.js`): masse, cariche e vite vere delle particelle; la
relatività (un muone che corre vive di più, e un protone veloce gira più
largo); il campo di ogni pianeta è un dipolo vero, con l'intensità e il raggio
in metri e tesla; il metro sullo schermo dice le distanze vere (tra un livello
della mappa e l'altro lo zoom fa un salto, dentro ogni livello i rapporti sono
veri). Niente è collocato: ciò che compare nasce dalle regole.

I raggi cosmici di una regione si calcolano **all'indietro**: dal bordo della
regione si segue ogni possibile raggio indietro nel tempo, nel campo vero del
pianeta; se esce dalla magnetosfera è arrivato davvero, dalla direzione di una
sorgente della galassia (e il cielo dei raggi pesa quante ne arrivano da lì);
se sbatte contro il pianeta, quella strada non esiste. È come si calcolano i
raggi che raggiungono la Terra (la soglia di Størmer): le magnetosfere forti,
come quelle dei giganti, sono schermate davvero. Negli anelli, con la stessa
densità che si vede sulla mappa, un raggio può urtare un granello di ghiaccio:
ne esce uno sciame, i cui elettroni e positroni girano in riccioli opposti.

**Le fasce di radiazione.** I raggi che colpiscono il pianeta ne fanno uscire
neutroni; un neutrone non sente il campo, vola via e ogni tanto decade in un
protone e un elettrone dentro la magnetosfera, dove il campo li intrappola. Le
regioni hanno la loro fascia, quanto il campo la tiene e l'anello non la
assorbe (lo stesso profilo disegnato sulla mappa).

**Lo zoom dentro una regione.** Con la rotella su un punto della regione si
entra in una bolla di spaziotempo dieci volte più piccola, nello spazio e nel
tempo (fino a tre livelli: da 1000 km a 1 km). È calcolata dalla regione: le
particelle che la attraversano sono le stesse, con il loro indirizzo, il tempo
proprio e la strada già fatti, quindi lo stesso caso (decadono dove decadevano
lassù; tra i due livelli la stessa strada coincide entro pochi centesimi). In
più compare solo ciò che da lontano non si vedeva: una popolazione nasce al
primo livello in cui il suo giro si vede (alla scala della regione i protoni
della fascia, più vicino gli elettroni). Rotella indietro: si risale.

Una conseguenza onesta: le spirali strette delle camere a bolle in natura quasi
non ci sono (servono campi da laboratorio). A questa scala la natura disegna
archi e piccoli riccioli; nel caleidoscopio diventano ornamenti geometrici di
linee e archi, come i girih. Le spirali torneranno dove nascono da sole: vicino
alle stelle morte magnetiche, o in un laboratorio, se una civiltà nascerà dalle
regole.

**Le leggi, da cui tutto discende** (`src/camera/leggi.js`). Le costanti della
natura (c, G, ħ, le masse delle particelle) e i parametri del cosmo (quanta
materia, quanta energia oscura, la forza delle fluttuazioni). Da questi si
calcola: l'età dell'universo (13,8 miliardi di anni, esatta per un cosmo
piatto), la massa massima di una nana bianca (Chandrasekhar, 1,43 masse
solari) e di una stella di neutroni (2,2), i loro raggi (8700 km, 12 km),
quanto vive una stella e che cosa diventa quando muore; il campo di ciò che
resta cresce da solo, perché il flusso magnetico si conserva mentre la stella
si contrae (pulsar da 10⁶ a 10⁹ tesla). Le stelle di una galassia nascono nella
sua storia (con la distribuzione delle masse misurata, dichiarata come tale) e
vivono fino a «adesso»: alcune sono già nane bianche, stelle di neutroni, buchi
neri. Le sorgenti dei raggi cosmici non sono più messe: le supernove sono le
stelle massicce che muoiono (quante all'anno discende da quante ne nascono e da
quanto vivono), le pulsar sono ciò che lasciano; nelle ellittiche esplodono solo
nane bianche, che non lasciano niente.

Ogni stella eredita una **metallicità** (quanta materia pesante le supernove
delle generazioni prima hanno lasciato nel gas da cui nasce: cresce col tempo,
è più alta al centro). Da lì discendono i pianeti: i giganti di gas sono tanto
più probabili quanto più la stella è metallica (come si osserva), e la
composizione di ogni pianeta viene dal suo disco. Le stelle di neutroni e i
buchi neri non hanno pianeti (la supernova li disperde); una nana bianca ha
inghiottito quelli vicini quand'era gigante, e quelli lontani si sono
allontanati mentre perdeva massa. Sulla mappa la fascia di radiazione è fatta
dei suoi protoni, cerchi della loro grandezza vera: avvicinandosi a una regione
si vedono le stesse cose più grandi, non un foglio sovrapposto.

**La nebbia: tutte le particelle, senza simularle tutte** (`src/camera/nebbia.js`).
In una regione, in ogni istante, in uno strato spesso un metro, ci sono
centinaia di milioni di raggi cosmici e, in una fascia, decine di migliaia di
miliardi di particelle: la lastra vera sarebbe nera. Da lontano sono una nebbia,
con la sua densità e il suo moto medio: sulla mappa la fascia è un campione fisso
di particelle che scivolano attorno al pianeta (i protoni in un verso, gli
elettroni nell'altro, con la velocità di deriva vera) e l'anello sono granelli
che girano con la velocità di Keplero (la massa del pianeta viene dal suo raggio
e da che cosa è fatto). Avvicinandosi, quando il giro di una particella diventa
visibile, il puntino diventa il suo cerchio; dentro una regione la nebbia resta
come sfondo e le linee sono quelle che si seguono una per una, con il conteggio
vero nella scheda.

**Calore, atmosfera, acqua, convezione** (`leggi.js`, `fluidi.js`). La
temperatura di un pianeta discende dalla luce della sua stella, dalla distanza e
da quanta ne riflette; trattiene un gas se la sua gravità basta a non farlo
fuggire per miliardi di anni (la Terra perde l'idrogeno e tiene l'azoto, la Luna
perde tutto); la pressione e l'effetto serra dai gas che trattiene; l'acqua è
liquida, ghiaccio o vapore secondo il suo diagramma di fase. La «linea della
neve», oltre la quale nascono i pianeti di ghiaccio e i giganti, discende dalla
luminosità della stella. Ne emerge da solo che l'acqua liquida sta sui pianeti
rocciosi vicini alle stelle piccole. Su un pianeta con acqua, una pozza scaldata
dal calore dell'interno: sotto una profondità il calore passa senza muovere
niente, sopra l'acqua si organizza da sola in celle; negli strati sottili vince
la tensione della superficie e vengono esagoni (Bénard), più in profondità la
gravità e vengono rulli e labirinti (l'equazione di Swift-Hohenberg, ricavata da
quelle dei fluidi, con i numeri di Rayleigh e Marangoni veri).

**L'interno e la superficie** (`geologia.js`). Il ferro scende e fa il nucleo
(quanto, dalla composizione); il calore dell'interno viene dalla radioattività
(più metalli nella stella, più calore) e cala con l'età. Il campo magnetico ora
emerge: c'è solo se il nucleo è ancora liquido e rimescolato (la dinamo), con la
legge di scala delle dinamo tarata sulla Terra (3,0·10⁻⁵ T contro 3,1); un
pianeta piccolo o vecchio ha il nucleo congelato e nessun campo (Marte), e
allora non ha nemmeno la fascia di radiazione. Se il mantello spinge abbastanza
e l'acqua indebolisce la crosta, la crosta si rompe in placche: dove si
scontrano si alzano montagne, dove si separano dorsali e vulcani. Il mare riempie
i punti più bassi con l'acqua che il pianeta ha; la pioggia scende lungo la
pendenza più ripida e fa i fiumi; il ghiaccio sta dove fa freddo. La mappa è nel
pannello e avvolta sulla sfera del pianeta.

**Il clima come equilibrio che evolve** (`climaSuperficie` in `geologia.js`,
modello di Budyko-Sellers su una griglia sulla sfera). In ogni punto la luce
della stella secondo latitudine e stagione (l'asse è inclinato; un pianeta
bloccato mostra sempre la stessa faccia), il calore irradiato e trattenuto
dall'atmosfera, il calore portato dall'aria e dal mare (il mare si scalda
lentamente, la terra in fretta), il ghiaccio che riflette la luce (e ha bisogno
di acqua), le nuvole dove l'acqua evapora. Il pianeta parte caldo, come appena
nato, e si lascia evolvere per molti anni. Ne emergono, senza disegnarli: le
calotte con i bordi sfumati (quanta parte dell'anno un punto passa sotto lo
zero), i pianeti bloccati con il mare aperto solo sotto la stella (il «pianeta
occhio» delle nane rosse), le glaciazioni totali quando il ghiaccio prende il
sopravvento. Verificato sulla Terra (temperata, poco ghiaccio) e su Marte
(−69 °C contro −63). La rotazione viene dalla formazione; le maree della stella
la frenano fino a bloccarla se il pianeta è vicino; la rotazione schiaccia il
pianeta ai poli (5/4·ω²R³/GM), e la forma si vede sulla mappa.

**L'erosione: il paesaggio che evolve** (`erosione` in `geologia.js`, il modello
dei geomorfologi: potenza dei fiumi più pendii). A ogni passo le montagne
crescono dove le placche spingono; piove dove il clima simulato lo permette (non
sul ghiaccio); l'acqua scende lungo la pendenza più ripida; dove resta intrappolata
riempie la conca fino a traboccare, ma diventa lago solo se l'acqua che arriva
supera quella che evapora (altrimenti è una piana di sale); dove se ne raccoglie
molta scava, in proporzione alla portata e alla pendenza; i pendii si sgretolano.
Le reti di fiumi, le valli e i laghi emergono da qui; la neve sui monti si
calcola dalla quota vera di ogni punto.

**La tettonica evolve nel tempo** (`src/camera/tettonica.js`). Non è una
fotografia: si parte da un pianeta senza continenti e lo si lascia vivere per la
sua età. Il mantello, scaldato soprattutto da dentro e raffreddato da sopra, si
organizza da solo in celle (la stessa equazione della pozza): discese fredde
concentrate, e intorno una rete di salite larghe, le dorsali. La larghezza delle
celle viene dallo spessore del mantello, il vigore dal calore dell'interno. La
crosta leggera dei continenti si conserva (lo scarto è sotto lo 0,001%): nasce a
poco a poco sopra le fosse, il mantello la raccoglie dove converge, e dove due
masse si scontrano si ispessisce in catene; sotto un continente fermo il
mantello si scalda, la discesa diventa salita, e il continente si spacca. La
crosta degli oceani nasce alle dorsali, invecchia allontanandosi e sprofonda
come la radice dell'età (la legge misurata sulla Terra). Le quote vengono dal
galleggiamento: la crosta spessa sta alta. Forma, numero e storia dei continenti
non sono scelti; con poco calore o senz'acqua la crosta resta un coperchio
unico. Lo stato da cui il mantello parte è l'impronta termica degli urti veri della
formazione del pianeta (`impatti.js`); solo un pianeta che non ne ha avuti
parte da un rumore minuscolo legato al suo indirizzo. Limiti detti: la carta è
trattata come piana (vicino ai poli le forme sono stirate), le coste sono
ancora troppo lisce, quattro parametri (rigidità, coesione, e quanto e in quanto
tempo un continente scalda il mantello sotto di sé) sono scelti guardando il
risultato. I colori della superficie sono quelli dei materiali (`minerali` in
`chimica.js`): nessun verde, perché la vegetazione ci sarà solo se la vita
emergerà.

**I pianeti nascono dal disco** (`src/camera/disco.js`). Intorno a ogni stella
un disco di gas e polvere, con la massa e i metalli della stella: i grani si
uniscono in embrioni, oltre la linea della neve c'è anche il ghiaccio e gli
embrioni crescono abbastanza da catturare il gas (i giganti), poi migrano, si
urtano e si fondono. Orbite, masse, composizione e raggio vengono da questa
storia, che resta scritta nel pianeta. Limite detto: i giganti escono troppo
spesso (un terzo delle stelle, contro il 10–20% osservato).

**Le lune e le maree** (`src/camera/lune.js`). Una luna nasce da un grande
urto, dal disco intorno a un gigante, o è catturata; deve stare tra il limite
di Roche (dentro si sbriciola) e la sfera di Hill (fuori la stella la strappa).
Le maree spostano la sua orbita nel tempo, bloccano la sua rotazione, e
scaldano l'interno di una luna in orbita eccentrica (vulcani come Io, oceani
sotto il ghiaccio come Europa). Sono calcolate per ogni pianeta e si vedono sulla mappa.

**Le stelle dalla loro struttura** (`src/camera/stelle.js`). Luminosità, raggio,
temperatura e vita escono dall'integrazione delle quattro equazioni della
struttura stellare (gravità contro pressione, trasporto dell'energia per
radiazione o convezione, reazioni nucleari con il picco di Gamow), con lo stato
della materia di Saha e Fermi e un'opacità calcolata dai processi, frequenza per
frequenza. Nessun numero è stato scelto guardando il Sole, che esce a 0,92 della
sua luminosità, 1,008 del suo raggio, 5631 K. Ne escono anche la massa minima
per accendere l'idrogeno (0,079 Soli), il Sole giovane più debole del 27%, il
confine tra nana bianca e supernova (9 Soli). La tabella (7 metallicità × 36
masse × 10 età) si rigenera con `node strumenti/tabella_stelle.mjs` (16 minuti)
ed è salvata in `stelle_tabella.js`. Limiti detti, stampati dalle prove: tra 1,5
e 3 Soli i raggi escono 15–25% troppo piccoli; la zona convettiva del Sole è
troppo sottile (l'opacità calcolata non ha le righe); le giganti rosse non ci
sono.

**La storia degli impatti** (`src/camera/impatti.js`). Dai corpi rimasti dopo la
formazione: le loro taglie escono da una cascata di collisioni simulata, il
bombardamento cala col tempo perché il pianeta li mangia o li scaglia via,
l'aria ferma i piccoli. Gli urti giganti sono quelli veri del disco, con le
loro masse e il loro momento: l'ultimo dà al pianeta il giorno e l'inclinazione
dell'asse, e se lascia un disco di detriti ne nasce la luna (non più un
sorteggio), che poi allontanandosi frena il pianeta. Da questa storia vengono i
crateri che si vedono ancora (quelli che placche, lava ed erosione non hanno
cancellato) e lo stato iniziale del mantello. Ogni impatto è un evento con il
suo indirizzo: un cosmo parallelo può cambiarne uno solo. Limiti detti: manca
il bombardamento tardo (nessuna riserva lontana di asteroidi e comete: dopo un
miliardo di anni non cade quasi più niente); gli urti sono più lenti del vero;
i pianeti senza una luna che li freni restano con giorni di 2–5 ore.

**La rotazione** (`src/camera/rotazione.js`). Il giorno e l'asse non sono
sorteggiati: nascono dagli urti giganti (con il bilancio del momento angolare),
dal gas che cade nei giganti, o dall'embrione; poi la stella e la luna li
frenano per tutta l'età del sistema, fino a mostrare sempre la stessa faccia o a
una risonanza (Mercurio esce a 58,62 giorni, in risonanza 3:2). Limiti detti:
Venere non torna (manca la marea termica dell'aria), Urano e Nettuno girano un
quarto troppo in fretta, la Terra con la Luna vera esce a 16 ore.

**Il bombardamento tardo** (in `impatti.js`). Le fasce di corpi che un pianeta
ha scacciato e che un gigante rifornisce, le comete palleggiate dai giganti,
con le velocità vere dell'incontro. Senza giganti non c'è bombardamento tardo.
Limite detto: il risultato dipende moltissimo da dove stava il corpo scacciato.

**Gli anelli** (`src/camera/anelli.js`). Non sono più una probabilità: c'è un
anello solo se materia è finita dentro il limite di Roche (una luna spezzata
dalle maree, i detriti di un urto) abbastanza di recente o in quantità, perché
un anello si allarga, piove sul pianeta e sparisce. I bordi vengono dal limite
di Roche del materiale e dall'alta atmosfera; le divisioni dalle risonanze con
le lune vere di quel pianeta (con le lune vere di Saturno, la divisione di
Cassini esce a 2,01 raggi dalla 2:1 con Mimas). Limiti detti: l'anello di
Saturno pesa dieci volte meno del vero e la divisione è troppo stretta; Giove,
Urano e Nettuno escono senza i loro anelli tenui; con i giorni corti dati dagli
urti, sette mondi pesanti di ghiaccio su dieci hanno anelli: troppi.

**L'aria che circola e il ciclo dell'acqua** (`src/camera/meteo.js`). Due strati
d'aria sulla sfera, mossi dalle differenze di temperatura e deviati dalla
rotazione: alisei, venti da ovest, getto, celle (una sola se il pianeta gira
piano, sei se gira in otto ore), vento dal giorno alla notte se è bloccato.
L'acqua evapora dal mare, viaggia, e piove dove l'aria sale: fascia piovosa
all'equatore, tropici più secchi, pioggia sul versante sopravvento dei monti e
ombra di pioggia dietro. L'acqua si conserva. Il clima fa due giri: dal primo
si calcolano venti, nuvole e pioggia, con quelli si rifà il bilancio; l'erosione
usa la pioggia vera di ogni punto. Limiti detti: la cella di Hadley è due volte
troppo forte, non ci sono stagioni, i rilievi non deviano il vento. Costa circa
due secondi in più a pianeta.

La superficie di un pianeta (deriva dei continenti, clima, aria, erosione) si
calcola in secondo piano (`src/camera/superficie.worker.js`): la mappa resta
viva, il pianeta si vede com'è da lontano, e quando la superficie è pronta
compare da sé.

**Le galassie dalle loro cause** (`src/camera/galassie.js`, non ancora
collegato). Dall'alone (massa dal picco del campo, momento angolare dalle maree
dei vicini) escono la taglia del disco, il tipo, la storia della formazione
stellare, i metalli nel tempo e nel raggio dal bilancio di ciò che le stelle
morte restituiscono, i bracci, il ritmo delle supernove. Due parametri sono
tarati e lo dice: la scala delle masse (da cui dipende la frazione di
ellittiche) e il vento.

**Il mare** (`src/camera/mare.js`). L'acqua non è una tinta: i sali vengono
dalle rocce di quel pianeta consumate dall'acqua e dall'anidride carbonica, dai
gas dei vulcani e dalle sorgenti calde, portati dai fiumi per l'età del pianeta;
escono quando superano la solubilità (che dipende dalla temperatura). Salinità,
miscela di ioni e pH escono dal bilancio. Le correnti vengono dal vento e dalla
rotazione sulla forma vera dei bacini; portano calore, sale e fango. In fondo
allo zoom, sul mare o su un lago, non c'è la roccia ma un campione di
quell'acqua: di dieci in dieci, i granelli sospesi, i colloidi in moto
browniano, poi gli ioni con i loro gusci e le molecole, nelle quantità vere di
quel punto. Limiti detti: quattro parametri sono tarati sulla Terra (che così
dà 37 g/kg e pH 8,1); in mare aperto alle scale intermedie l'acqua è limpida e
si vede poco (il pannello dice che cosa c'è davvero in quel campione).

**La temperatura ha una fonte sola.** La stima rapida del clima di ogni pianeta
è lo stesso bilancio di energia della mappa, risolto per fasce di latitudine; la
serra dipende dai gas veri dell'aria (con i gas veri: Terra 289 K, Venere 734,
Marte 214, Titano 94) e clima e aria si risolvono insieme.

**La finestra è un punto di osservazione qualsiasi.** Nella vista del cosmo,
«una finestra bella a questa scala» prova molte inquadrature attorno a dove si
guarda e va dove il mondo disegna di più: vale per le galassie, le orbite, i
continenti, i fiumi, i cristalli (`cercaFinestra` in `mappa.js`,
`bellezzaImmagine` in `sezione.js`). Le tessere del terreno si calcolano con un
bordo in comune, così combaciano. Per le particelle, la finestra diretta (senza
specchi né copie) è il modo normale; il caleidoscopio è un'aggiunta di chi
guarda. La sezione dello spaziotempo può essere il punto di vista di un
osservatore in moto, con la relatività vera (la scala del tempo è la velocità
della luce); i moti veri della regione sono elencati con le loro velocità.

**La coerenza tra i livelli** (`test/test_coerenza.mjs`). Una prova a sé
controlla che le stesse grandezze valgano lo stesso a ogni scala, su centinaia
di sistemi veri: tempo (niente è più vecchio di ciò che lo contiene), massa,
acqua, energia del clima, conservazione di carica, energia e quantità di moto
nei decadimenti e negli urti, particelle uguali nelle bolle dello zoom,
determinismo. 47 controlli passano; le incoerenze che restano (14) non
sono nascoste: la prova le misura e le stampa ogni volta.

**Cosmi paralleli a ogni scala** (`src/camera/eventi.js`, `cosmoRamo` in
`cosmo.js`). Ogni corso di eventi del cosmo ha un indirizzo: «disco/3/53» è la
formazione dei pianeti della stella 53 nella galassia 3, «mantello/3/53/0» la
storia interna del suo primo pianeta. Un cosmo parallelo è lo stesso cosmo con
alcuni di questi eventi andati diversamente; cambia solo ciò che ne discende:
stesse galassie, stesse stelle, stessi altri pianeti, stesse particelle nelle
regioni. Nel pannello di un pianeta, «un pianeta parallelo» mostra lo stesso
pianeta (stessa massa, stessa stella) con un'altra storia del mantello, quindi
altri continenti. È la stessa regola dei rami delle particelle (molti mondi),
portata in alto. Gli impatti e gli anelli hanno già indirizzi fini (un ramo può cambiare dove
cade un solo impatto); disco, lune e mantello cambiano ancora per corsi interi.

Sulla mappa, al livello del pianeta, **le lune** girano sulle loro orbite vere
(in raggi del pianeta) con la loro taglia vera; passandoci sopra si legge da
dove vengono e in che stato sono.

**La chimica** (`src/camera/chimica.js`). Dagli elementi che la galassia ha
prodotto fino a quel momento (le abbondanze seguono i metalli della stella),
con le energie di legame vere, l'equilibrio chimico a quella temperatura e
pressione dice quali molecole ci sono: l'aria del pianeta (riducente o
ossidante), i minerali della crosta e il loro colore, e i mattoni della vita
(acido cianidrico, formaldeide) dove c'è energia: fulmini, luce ultravioletta,
sorgenti calde. Un risultato vero, non cercato: su 2478 pianeti provati nessuno
ha insieme le tre condizioni perché gli zuccheri si copino da soli.

**La roccia in fondo allo zoom** (`src/camera/rocce.js`). Sotto la tessera più
fine c'è la roccia: cristalli che nascono in punti a caso e crescono finché si
toccano (grana grossa se il raffreddamento è lento, fine se è veloce), fiocchi
di neve cresciuti dal vapore, sedimenti ordinati dall'acqua, fratture che
seguono lo sforzo.

**Impatti, sedimenti, orogenesi.** Per tutta la sua vita un pianeta è colpito
(molto da giovane, poi sempre meno; molti crateri piccoli e pochi grandi; l'aria
densa brucia i corpi piccoli): quanti crateri restano dipende da quanto la
superficie si rinnova, così un mondo fermo e senz'aria li conserva tutti e uno
con placche, vulcani e pioggia li cancella. I monti crescono dove il mantello
scende, e continuano a crescere mentre l'erosione li consuma. Ciò che l'acqua
scava non sparisce: scende a valle e si deposita nei laghi e sulle coste
(pianure e delta, più chiari), e tutto tende a livellarsi. Senza acqua non c'è
neve e non piove; i pendii si consumano in fretta con la pioggia, poco con il
solo vento, quasi per niente senz'aria.

**La risoluzione continua della superficie** (`tessera` in `geologia.js`).
Avvicinandosi al disco di un pianeta solido si scende sulla sua superficie, e
avvicinandosi ancora ogni tessera si divide in 4 × 4 tessere più fini, fino a
celle di una decina di metri (dal pianeta intero al paesaggio: sette livelli).
Una tessera figlia nasce dalla madre: le sue quote, più il dettaglio che da
lontano non si vedeva (uguale da qualunque parte ci si arrivi), poi l'erosione
alla sua scala, con i fiumi della madre che entrano con la loro portata e i
laghi che restano al loro livello. Si calcola solo ciò che si guarda, una
tessera per fotogramma; passando sopra un punto si leggono quota e temperatura.

Il pannello del pianeta racconta **perché è fatto così**, risalendo la catena
delle cause con i suoi numeri: le fluttuazioni dell'inizio (quelle della
radiazione cosmica di fondo) in quel punto, quando la galassia ha cominciato a
fare stelle, quante generazioni di supernove avevano arricchito il gas quando è
nata la stella, il disco e il suo ferro, il nucleo e il suo calore.

**Il pattern nelle tre dimensioni.** Cliccando la finestra si entra nel suo
spaziotempo guardato esattamente dallo stesso angolo della sezione, senza
prospettiva: si vede il pattern. Trascinando lo si ruota e si capisce che cosa
è: linee d'universo in un blocco di spazio e tempo. I punti arancio sono dove
entrano i raggi (con la loro origine: un resto di supernova, il getto del buco
nero), le stelle verdi dove una particella si spezza. Il tasto A torna
allineato.

**Il cosmo.** Niente entra dal bordo, perché il bordo non c'è: lo spazio è
richiuso su sé stesso (`src/camera/cosmo.js`). Dalle fluttuazioni dell'inizio
nasce la rete della materia; dove è più densa, le galassie, con un buco nero al
centro, i bracci, i resti di supernova e le pulsar; nei bracci le stelle;
attorno alle stelle i pianeti, con i loro campi e i loro anelli; nell'anello o
nel campo di un pianeta, le **regioni**: sono gli universi della biblioteca. Il
numero di un universo è il suo indirizzo scritto in cifre (numeri vicini sono
regioni dello stesso pianeta; numeri lontanissimi, cosmi paralleli separati
all'inizio). Ogni raggio cosmico di una regione parte da una sorgente vera della
sua galassia e arriva in media dalla sua direzione. Niente è conservato: dato
un indirizzo, una regola dice che cosa c'è lì, sempre la stessa cosa; si calcola
solo il pezzo che si guarda. Nell'app lo zoom è una catena continua, nei due
versi: pattern ↔ finestra ↔ l'universo (la regione) ↔ il pianeta ↔ la stella ↔
la galassia ↔ il cosmo (`src/camera/mappa.js`); nella galassia le linee
tratteggiate vanno dalle sorgenti dei raggi alla stella del pianeta.

Per avere cose belle da trovare, gli universi hanno anche le
**stelle nucleari**: un raggio cosmico colpisce un nucleo, che si spezza in
una raggiera di particelle che, nel campo, si arricciano in rosette.

Una cosa va detta, perché è il cuore dell'idea di Borges: nella biblioteca c'è
tutto, ma l'indirizzo di un libro qualunque è lungo quanto il libro. Un
universo con un indirizzo corto può contenere solo forme naturali: spirali,
rosette, forcelle, sciami, ripetizioni cristalline. Una forma arbitraria c'è,
ma trovarla costa quanto disegnarla. È anche il criterio di naturalezza: una
forma è naturale quanto è corto il suo indirizzo.

### L'app

Un menu **File** (nuovo, apri un'immagine, apri e salva il seme, esporta
l'immagine), due viste (**Pattern** ed **Elemento**, con il piano o lo
spaziotempo), annulla e rifai, e una riga in basso che dice sempre dove sei e
che cosa puoi fare. «Da dove partiamo?» offre la biblioteca, un'immagine,
l'esempio della tavola greca e il vuoto.

- **Il pattern.** Per la biblioteca, la finestra dell'universo ripetuta
  all'infinito (a specchio, a giro, affiancata, o da sola). Clic: la finestra.
  Per un'immagine letta, la piastrella che si ripete con i suoi elementi.
- **La finestra.** La sezione da sola, grande. Clic: il suo **spaziotempo**, il
  blocco di universo che sta dentro la finestra e la fetta di tempo, con le
  linee d'universo che salgono; la sezione è questo blocco guardato da un
  angolo. **L'universo** mostra tutto l'universo con la cornice da spostare.
- **L'elemento.** Un evento solo, con le cose che lo producono sulla scena: le
  sorgenti (frecce verdi), le zone di campo e di materia, le masse; in un
  universo, la mappa del suo campo (⊙ ⊗ più o meno intensi), le sue nubi
  (puntini marroni), i suoi cristalli, e la cornice della sezione. Il pannello
  mostra solo la cosa scelta, con la frase che dice che cosa fa ogni numero.
  Clic su una linea: la sua storia. Passando sopra una linea: le frecce delle
  forze in quel punto.
- **Lo spaziotempo.** L'elemento con il tempo che sale: le linee d'universo.

**Le leggi si vedono e si spengono.** Le schede in alto (gravità rossa,
magnetismo blu, materia marrone, decadimento verde) e il pannello «le leggi e
gli oggetti». Ogni linea ha il colore delle forze che agiscono lì, pesate per
quanto sono forti (una spirale nasce blu e diventa marrone verso l'occhio).
Clic sul nome di una legge: si vede solo lei. ⏻ spegne una legge o un oggetto
nella fisica: la scena si rifà e in grigio resta com'era. Se il tempo è fermo
a metà o sta scorrendo, l'interruttore **scatta in quell'istante**: prima nulla
cambia, dopo le particelle proseguono nel mondo nuovo, e in grigio resta come
sarebbe andata; gli scatti sono tacche sulla linea del tempo. Nel seme un
oggetto porta `spento` e `interruttori` (`{ t, acceso }`); una legge è `true`,
`false` o una lista di scatti.

### Da un'immagine

File → Apri un'immagine (o l'esempio della tavola greca). Quattro passi,
mostrati mentre avvengono:

1. **Pulizia** (`src/preparazione.js`), solo se serve: immagine sporca o
   sfumata, luce non uniforme, disegno più chiaro del fondo, disegno che si
   distingue solo per il colore. Il fondo si misura zona per zona (l'ombra
   cambia la luce, non la tinta) e si divide via; il disegno è ciò che si
   allontana dal fondo; un mediano toglie il rumore; la soglia è di Otsu nel
   campo. Su versioni rovinate della tavola greca il disegno si ritrova al 68%
   (foto con ombra e rumore forte), 82% (negativo) e 79% (solo colore), dove
   senza pulizia la lettura falliva.
2. **Lettura dei tratti**: la decodifica (scheletro, spessori, petali, dischi,
   campiture).
3. **Ricerca della fisica** (`src/camera/inversa.js`): l'immagine si ritrova
   come pagina della biblioteca, cioè come un universo di soli ingredienti
   naturali. Per ogni tratto si trova la particella che lo percorre. La sua
   curvatura varia con continuità, come in una traiettoria vera (l'angolo di
   ogni svolta si conserva); dove la linea fa uno **spigolo**, la particella
   decade e la figlia riparte nella nuova direzione: un *ginocchio*, come un
   pione che diventa muone. Il campo magnetico è una **mappa liscia**, continua
   e senza bordi: intorno a ogni traccia vale ciò che piega la particella sulla
   sua linea, uniforme di traverso (così la traiettoria è stabile) e lontano
   sfuma a zero, come un fascio di flusso. Lo spessore è la carica; alla fine
   del tratto la particella decade in neutri invisibili. Un petalo è una carica
   che frena nella materia, un disco una che si ferma subito, una campitura una
   sagoma impressa dal lampo. Le linee che si incrociano vanno su esposizioni
   diverse della stessa lastra, perché in un punto il campo è uno solo.
   Lo **spessore** che cambia lungo il tratto viene dalla frenata: la lastra
   ingrossa la traccia quando la particella rallenta (w = q·V/v), quindi la
   particella va dall'estremo sottile a quello spesso, attraverso una nube di
   materia liscia che la rallenta proprio quanto serve (Bethe: K = m·q²·V⁴·w′/w⁵),
   e il campo che la piega tiene conto della velocità che cala (B = κ·m·v/q). Un
   tratto sottile ai capi e spesso in mezzo diventa due particelle che partono
   dalle punte e si incontrano nel punto più spesso.
4. **Verifica**: la tavola greca è circa 8300 particelle (molte nate da un
   ginocchio o da una frenata) in un campo liscio e in nubi lisce su 182
   esposizioni, rifatta dalla sola fisica all'**83%** (ritrova il 91% del
   disegno; il 90% di ciò che traccia sta sul disegno). Il tetto, con la lettura
   di oggi, è l'86%: tanto varrebbe disegnare i tratti letti alla perfezione. La
   fisica è a tre punti dal tetto; il resto della distanza dall'originale è della
   lettura (i dettagli sotto i 2–3 pixel, le giunzioni). La versione con i
   corridoi di campo tagliati a spigolo vivo arrivava al 75,7%.
   (`tracciaFisica(ris, { campo: 'corridoi' })` la rifà ancora, per confronto.)

Come vuole Borges, l'indirizzo di questa pagina è lungo: le mappe del campo e
della materia hanno circa 390.000 valori diversi da zero. Una forma precisa è nella biblioteca, ma
il suo indirizzo contiene la forma. Sfogliare a caso non la troverebbe mai: si
calcola, risolvendo il problema inverso.

### Come programma sul computer (Electron)

Serve [Node.js](https://nodejs.org) (LTS). Nella cartella del progetto, una
volta sola:

```bash
npm install
```

e poi ogni volta:

```bash
npm run app
```

Per un programma da installare (`.dmg` su Mac, `.exe` su Windows, AppImage su
Linux), sullo stesso tipo di computer:

```bash
npm run installabile
```

L'app (`electron/main.cjs`) serve le pagine con il protocollo
`app://stateyour/` (i moduli e il processo della lettura vogliono un'origine
vera) e legge solo i file del progetto. Il lavoro si salva da solo e si ritrova
alla riapertura.

Le altre pagine (`studio.html`, `decodifica.html`, `spaziotempo.html`,
`piastrelle.html`, `motore.html`) sono pagine di laboratorio delle fasi
precedenti: restano nel progetto per lo sviluppo, ma non fanno parte dell'app.

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
