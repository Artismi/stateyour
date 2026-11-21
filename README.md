# stateyour

Un universo procedurale con uno zoom continuo: dal cosmo intero alle galassie, alle stelle, ai pianeti, al suolo, alla
roccia e all'acqua di un punto, agli atomi e, in fondo, alla scala quantistica (le particelle e i campi dentro l'atomo).
Lì lo zoom finisce. Ogni cosa è generata da poche leggi fisiche e da un indirizzo: niente è collocato a mano.

Il generatore di pattern (i pattern come sezioni di un universo possibile, la decodifica di un'immagine, lo studio)
è un progetto a parte, nella cartella [`pattern/`](pattern/LEGGIMI.md): resta intero e funzionante, e usa i moduli
dell'universo da `src/`. L'app dell'universo non lo apre e non lo contiene.


Le regole che tengono insieme tutti i livelli, dal cosmo alla particella, stanno in
[INTRECCIO.md](INTRECCIO.md): l'indirizzo, l'evento e il collasso, il dettaglio
condizionato, il mondo compatibile, il tempo, una grandezza una fonte.

## L'app

`index.html` è l'app (anche come programma da scrivania, vedi sotto), vestita dal visore (`src/visore`,
[PROGETTO_VISORE.md](PROGETTO_VISORE.md)). Si parte nello spazio sopra un pianeta; la rotella avvicina e allontana
lungo una scala sola, misurata in metri per pixel e detta sempre dalla barra di scala (`src/camera/laboratorio.js`):
lo spazio in tre dimensioni dal cosmo al suolo (`src/tre`), poi la roccia o l'acqua di quel punto con i suoi livelli
(`src/camera/mappa.js`), gli atomi in tre dimensioni (`src/camera/atomi3d.js`) e la scala quantistica
(`src/tre/quanti.js`), che è il fondo: avvicinandosi ancora lo zoom si ferma. Le tracce delle particelle di un punto
non stanno in fondo: compaiono alla loro scala, sovrapposte a ciò che c'è lì.

## Il modello

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

**Le galassie dalle loro cause** (`src/camera/galassie.js`). Dall'alone (massa
dal picco del campo, momento angolare dalle maree dei vicini) escono la taglia
del disco, il tipo, la storia della formazione stellare, i metalli nel tempo e
nel raggio dal bilancio di ciò che le stelle morte restituiscono, i bracci, il
ritmo delle supernove; ogni stella del catalogo nasce quando e dove quella
storia lo dice. Senza niente tarato sulla Via Lattea, un alone come il suo dà
un disco di 2,6 kpc, 189 km/s di rotazione (vera 220–240), 3,3·10¹⁰ masse
solari di stelle (vere 5–6). Sulla mappa galassie, sistemi e pianeti hanno la
taglia vera: dal pianeta al cosmo intero si esce e si rientra senza salti.
Limiti detti: gli aloni piccoli fanno troppe stelle, metà delle galassie esce
ellittica (mancano le piccole), le velocità rispetto al fondo cosmico sono
troppo alte.

**Dentro la materia** (`src/camera/materia.js`, `atomi3d.js`). In fondo allo
zoom non c'è più un'immagine e basta. Sulla roccia si scende ancora: il
cristallo con la sua memoria (gli anelli che le particelle alfa di un granello
ricco di uranio hanno annerito nella mica in milioni di anni; le tracce di
fissione, tante quante l'età della roccia e il suo uranio ne danno), la figura
che una particella disegna attraversando quel cristallo (con la simmetria del
suo reticolo: sei nel quarzo e nel ghiaccio, quattro nel sale), e gli atomi del
reticolo in tre dimensioni. Sull'acqua: le molecole e gli ioni in tre
dimensioni, e l'evento vero di quel punto (il decadimento di un potassio-40,
con l'elettrone e la sua luce, e quanto è raro). Le tracce delle particelle di
quel punto, frenate secondo la sua composizione, compaiono alla loro scala,
sovrapposte a ciò che c'è lì; sotto gli atomi c'è la scala quantistica, il fondo
dello zoom. Limiti detti: gli anelli degli
aloni si leggono male; la fluidità della vista 3D non è misurata su una scheda
grafica vera.

**La chimica generale** (`src/camera/molecole.js` e `molecole_*.js`). Le
molecole non sono un elenco: qualsiasi grafo di atomi e legami che le valenze
ammettono è una molecola, con la sua forma, la sua energia (in aria e in
acqua), le sue reazioni (famiglie generali di passi sui siti reattivi, con le
barriere stimate) e le forze con le altre. La rete delle reazioni si espande a
richiesta dalle molecole di un luogo: senza ricette scritte trova la glicina da
acido cianidrico, ammoniaca e formaldeide, gli zuccheri e il loro ciclo che si
alimenta da solo, l'acido acetico e il piruvico da anidride carbonica e
idrogeno su solfuri di ferro. Il modulo elenca in testa ciò che le sue regole
ancora vietano e la realtà permette (copiarsi su stampo, catalizzare da
ripiegata, scegliere una mano): è il lavoro che resta perché una storia di
chimica possa arrivare a una macchina molecolare. Non è ancora collegata al
resto.

**Il mare** (`src/camera/mare.js`). L'acqua non è una tinta: i sali vengono
dalle rocce di quel pianeta consumate dall'acqua e dall'anidride carbonica, dai
gas dei vulcani e dalle sorgenti calde, portati dai fiumi per l'età del pianeta;
escono quando superano la solubilità. Salinità, miscela di ioni e pH escono dal
bilancio; aria e mare sono un solo serbatoio di carbonio. Le correnti vengono
dal vento e dalla rotazione sulla forma vera dei bacini; le maree dalle lune e
dalla stella di quel pianeta; ghiaccio e strato rimescolato seguono le
stagioni. Il mare si vede com'è: il colore dall'ottica vera, da ciò che è
sospeso e dal fondale dove la luce arriva, e avvicinandosi le onde di quel
punto, che si accorciano e frangono sul basso fondale. In fondo allo zoom c'è
un campione di quell'acqua, di dieci in dieci fino alle molecole. Nessun
parametro è più tarato sulla Terra; senza ritocchi il mare terrestre esce a 71
g/kg e pH 8,5 (vero 35 e 8,2), perché sulla carta di prova non ci sono i mari
chiusi che nella realtà hanno sepolto metà del sale. Limiti detti: correnti di
bordo larghe una cella, niente correnti equatoriali né circumpolare, onde basse
(manca il vento delle tempeste), il campione a millimetri e micrometri in mare
aperto è acqua limpida uniforme.

**La temperatura ha una fonte sola.** La stima rapida del clima di ogni pianeta
è lo stesso bilancio di energia della mappa, risolto per fasce di latitudine; la
serra dipende dai gas veri dell'aria (con i gas veri: Terra 289 K, Venere 734,
Marte 214, Titano 94) e clima e aria si risolvono insieme.

**La finestra è un punto di osservazione qualsiasi.** Nella vista del cosmo,
«una finestra bella a questa scala» prova molte inquadrature attorno a dove si
guarda e va dove il mondo disegna di più: vale per le galassie, le orbite, i
continenti, i fiumi, i cristalli (`cercaFinestra` in `mappa.js`,
`bellezzaImmagine` in `sezione.js`). Le tessere del terreno si calcolano con un
bordo in comune, così combaciano.

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


**Il cosmo.** Niente entra dal bordo, perché il bordo non c'è: lo spazio è
richiuso su sé stesso (`src/camera/cosmo.js`). Dalle fluttuazioni dell'inizio
nasce la rete della materia; dove è più densa, le galassie, con un buco nero al
centro, i bracci, i resti di supernova e le pulsar; nei bracci le stelle;
attorno alle stelle i pianeti, con i loro campi e i loro anelli; nell'anello o
nel campo di un pianeta, le **regioni**. Ogni raggio cosmico di una regione parte da una sorgente vera della
sua galassia e arriva in media dalla sua direzione. Niente è conservato: dato un indirizzo, una regola dice che
cosa c'è lì, sempre la stessa cosa; si calcola solo il pezzo che si guarda. Nell'app lo zoom è una catena
continua, nei due versi: il cosmo ↔ la galassia ↔ la stella ↔ il pianeta ↔ il suolo ↔ la materia ↔ gli atomi ↔
la scala quantistica.

## Come programma sul computer (Electron)

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

L'app (`electron/main.cjs`) serve la pagina con il protocollo
`app://stateyour/` (i moduli e i loro Worker vogliono un'origine vera) e legge
solo i file del progetto. Il pacchetto contiene solo l'universo: la cartella
`pattern/` ne è esclusa (`build.files` in `package.json`).

## Struttura

```
index.html          l'app: l'universo
src/camera/        il modello: le leggi, il cosmo, le galassie, le stelle, i pianeti, la geologia, il mare, la materia, gli atomi, i quanti; la camera (laboratorio.js) e la mappa (mappa.js)
src/tre/           lo spazio in tre dimensioni: il nucleo grafico, l'universo, il sistema, il pianeta, la scala quantistica
src/visore/        il visore: la cornice, l'HUD, le schede, il menu e il taccuino
electron/          l'app da scrivania
test/              le prove (node, senza dipendenze)
strumenti/         strumenti di misura e di prova
pattern/           il generatore di pattern, progetto a parte (pattern/LEGGIMI.md)
```

## Uso

```bash
npm test        # le prove dell'universo
npm run vista   # la prova della vista
npm start       # poi http://localhost:8000
npm run app     # l'app da scrivania
```

Le prove del pattern stanno in `pattern/` (`cd pattern && npm test`).
