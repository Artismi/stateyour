# Scelte a mano nella vista

PROGETTO.md, lavoro 7 («La vista come misura»); INTRECCIO.md, regola 14 («Anche l'immagine emerge: la resa è trasporto di
luce»); LINGUA.md, C12 (convergenza della resa). Novembre 2026.

Che cosa c'è qui: ogni costante del motore 3D (`src/tre/`, più la parte di `src/camera/laboratorio.js` che monta il mondo)
che decide **come appare** ciò che si vede — colori, intensità, esposizione, gamma, soglie di visibilità, dimensioni di
punti, nebbie, fattori di contrasto, passi, numeri di campioni —, con dove sta, che cosa fa e di che specie è:

- **(a) dal modello o da una legge**: viene dal mondo (le riflettanze misurate delle rocce, il corpo nero della stella,
  la curva d'estinzione) o da una legge dichiarata con la sua fonte (CIE, CIECAM02, Eddington);
- **(b) una discretizzazione**: un passo, un numero di campioni, una griglia, un livello di dettaglio. È lecita se,
  resa più fine, l'immagine converge, e se il valore usato sta già dove ha converso (C12). Accanto: provata o no, e dove;
- **(c) una scelta a mano**: un difetto, come le soglie di comodo della regola 7. Accanto: che cosa servirebbe per
  toglierla. «SOSTITUITA» dove in questo lavoro è stata tolta; «ORA SOLO PARTENZA» dove non decide più l'immagine
  (vale solo nei primi fotogrammi, prima che l'occhio misuri la luce); «SEGNO» dove non pretende di essere luce
  (segnaposto, orbite, convenzioni di uno strumento: dichiarati, e da tenere).

Le righe (`file:riga`) sono quelle dei file dopo questo lavoro. Una costante usata in più punti è contata una volta; una
riga che ne raccoglie parecchie dello stesso pezzo (le nuvole, gli anelli) è contata una volta.

## I numeri

**144 righe: 27 (a), 41 (b), 76 (c) — di cui 9 sostituite (8 nel lavoro 7, 1 nel lavoro 9: l'increspatura minima del mare; e la schiuma al largo in parte) e 67 rimaste.** Le 16 righe del lavoro 9 («la finestra a ogni distanza», il mare: `src/camera/finestra.js`) sono in fondo alla tabella e nella sezione qui sotto.

- (a) 20, di cui 7 nuove (le leggi dell'occhio di `nucleo.js`, con la fovea, e la luce della galassia per la notte).
- (b) 36 (con due tetti che erano scritti come scelte: la superficie delle stelle al più quanto l'immagine a 16 bit tiene). Provate per convergenza in `test/test_vista.mjs`: i passi dei volumi della galassia (da fuori e da dentro il
  disco) e della ragnatela, lo schema dei loro passi e lo sfasamento, l'accumulo nel tempo, i passi dell'aria e il loro
  schema, le tre discretizzazioni delle tabelle del cielo (direzioni, passi, direzioni dell'irradianza). Provate altrove:
  il passo delle geodetiche del buco nero (`test_relativita`), gli splat (`src/tre/prove/splat.html`). Due erano
  **sbagliate** e sono state corrette (vedi sotto): i passi dell'aria e quelli delle tabelle del cielo; e il valore dei
  passi dell'aria nell'app è passato da 12 a 48, il primo della serie che sta sotto la soglia dell'occhio sia da dentro
  un'aria di 4 bar sia da fuori quella di 9550 bar del pianeta d'avvio. Non provate:
  le griglie dei volumi (galassia 160 × 96 × 48, ragnatela 96³/128³ e la regione fine), la riduzione dell'immagine dei
  volumi, il salto del vuoto, il dominio dei volumi e dell'aria, i livelli di dettaglio del rilievo, la luce zodiacale.
- (c) 72: 69 che c'erano prima di questo lavoro e 3 nuove, dichiarate, che porta l'occhio (F = 1, i 5772 K fuori da un
  sistema, von Kries nei primari sRGB); 8 sostituite, 64 restano. Delle 64: 6 «ORA SOLO PARTENZA», 5 «SEGNO» (segnaposto,
  orbite, convenzioni dello strumento, interfaccia), le altre 53 restano difetti con accanto che cosa servirebbe.

### Sostituite (8)

1. **L'esposizione** (`nucleo.js`). Prima l'irradianza «che vale 1» era la più alta tra quelle proposte dagli strati,
   ognuna col suo fattore (la galassia 0,07 da dentro e 0,3 da fuori, il sistema 0,6, il cosmo 1/200, la ragnatela «in media
   0,05», il buco nero 1/0,7, il pianeta un'apertura fino a 100 volte di notte). Ora **l'occhio si adatta alla luminanza media
   misurata dove si guarda** — la fovea, 2° attorno al centro dello schermo (adattamento foveale: Larson, Rushmeier & Piatko
   1997); prima la media di tutta l'immagine, e un pianeta piccolo nel cielo nero usciva bianco saturo — (tutti i punti
   della fovea, letti senza fermare la scheda), la porta al grigio medio della percezione (CIE L*
   = 50) e non scende sotto la **soglia assoluta della visione** (10⁻⁶ cd/m²); le candele vengono dall'efficacia luminosa del
   corpo nero della stella del luogo. Sotto 5 cd/m² i colori sfumano nella luminanza scotopica (CIE 191, Larson 1997): di
   notte, e guardando una galassia da fuori, si vede in grigio, come vede l'occhio. Le proposte restano solo come partenza.
2. e 3. **Il colore della luce della stella** (`sistema.js`, `pianeta.js`): «0,45 + 0,55·corpo nero» («l'occhio si adatta in
   parte») → la luce col suo colore vero, e l'adattamento al colore nell'occhio (von Kries di grado D di CIECAM02, D da
   0,82 al buio a 1 in pieno giorno).
4. **I colori dei batuffoli** della galassia (`universo.js`, il ripiego finché il volume non c'è): tre terne a mano → i corpi
   neri a 4300 e 9500 K del volume e l'arrossamento di Cardelli, Clayton & Mathis dall'attenuazione stessa.
5. **Il terminatore** (`pianeta.js`): una sfumatura a mano tra −0,02 e 0,03 → la parte del disco della stella sopra
   l'orizzonte (il segmento di un disco del suo raggio angolare).
6. **La luce di notte** (`pianeta.js`): 0,0006 fissa → un quarto della luce diffusa della galassia che arriva all'occhio
   (`universo.js` la conta già: la si passa nello stato del fotogramma).
7. **Il bordo della stella** (`pianeta.js`, le sfere): 0,4 + 0,6·μ^0,6 senza conservare il flusso → la legge
   dell'atmosfera grigia di Eddington, I(μ) ∝ 2 + 3μ, con la luce uscente uguale al flusso vero.
8. **La luce minima dei corpi lontani** (le sfere di pianeti, lune e corpi minori): 0,0008 → la stessa luce della galassia
   della notte del suolo (il lato in ombra di un gigante era nero). E le nuvole, che restano a mano, ora la ricevono anche
   loro: una coltre di nuvole di notte era nero puro.

### Che cosa servirebbe per le altre (le più grandi)

- **La curva di tonalità** (Narkowicz, un'approssimazione di ACES): la risposta dei fotorecettori (Naka–Rushton) dall'occhio
  adattato allo schermo. Con lei se ne andrebbe anche la questione del grigio medio.
- **Gli aloni dei punti** e **le soglie di visibilità** (`luci.js` 2·10⁻⁴, `minori.js` 4·10⁻⁵): l'abbagliamento come
  diffusione nell'occhio (CIE 135/1999); le soglie dalla curva e dal quanto dello schermo a 8 bit (verrebbero ~5·10⁻⁶).
- **Le nuvole** (forma, riflettanza 0,82, ombra 0,78, quota): il trasporto nella nube dallo spessore ottico dell'acqua liquida
  di `meteo.js`, la quota dal livello di condensazione.
- **La foschia** (2,5·10⁻⁶·…, g = 0,76, scala 600 m): un modello degli aerosol dal clima (polvere, sale, solfati).
- **Le popolazioni della galassia** (4300 K, 9500 K, «le giovani rendono 3 volte»): il colore e il rapporto massa/luce dalle
  popolazioni di `stelle.js`.
- **Gli anelli, le lune del pianeta da solo, i corpi lontani** (macchie, fasce, ombra 0,03, colori di ripiego): la diffusione
  nei grani con l'albedo e la fase dei dati, la mappa vera del corpo, la funzione di fase di Lambert all'angolo vero.
- **La schiuma e l'increspatura minima del mare**: FATTO nel lavoro 9 al largo (la copertura di Monahan con la riflettanza efficace misurata della schiuma, Koepke 1984; l'increspatura dalla coda capillare dello spettro di Elfouhaily e altri 1997, con la tensione superficiale di quell'acqua). Resta a mano la schiuma sulla riva (0,5 e 0,8: servirebbe la zona dei frangenti dal fondale).
- **Il campo visivo** (0,75 rad): dall'angolo che lo schermo sottende all'occhio di chi guarda.

## La convergenza (C12)

`npm run vista` (`test/test_vista.mjs`, a parte dalla catena `npm test`: vuole Chromium e Playwright; 11 prove, ~62 s). La tolleranza
viene dall'occhio, detta prima: **ΔE*ab = 2,3**, la differenza di colore appena percepibile (Mahy, Van Eycken &
Oosterlinck 1994), sull'immagine come arriva allo schermo; per gli scarti relativi di luce il suo equivalente dove si vede
di più, al bianco, ε = 3·2,3/116 = 5,9%. L'ordine p è la pendenza di log(scarto) su log(n) tra raddoppi; il riferimento è
il termine più fine della serie, e il resto che gli manca (Richardson) deve stare sotto ε.

| discretizzazione | serie | ordine | l'app | contro il più fine | esito |
|---|---|---|---|---|---|
| tabelle del cielo: direzioni (ND) | 16–256 | 1,6 | 64 | 0,13% | torna |
| tabelle del cielo: passi (NS) | 6–96 | 1,9 | 48 | 1,7% (con 24: 6,7% sul pianeta di prova della catena degli elementi, 26 bar; prima della correzione: ~20%) | torna |
| tabelle del cielo: irradianza (NC) | 32–512 | 2,0 | 256 | 0,0075% | torna |
| volume della galassia, da fuori | 6–96 passi | 1,8 | 48 | ΔE 99° centile 0 (con 24 passava: 0,43) | torna |
| volume della galassia, da dentro il disco | 6–96 passi | 2,1 | 48 | ΔE 99° centile 0,82 (con 24: 3,3 dopo la catena degli elementi, che ha cambiato la galassia) | torna |
| accumulo nel tempo (galassia) | 1–64 fotogrammi | 0,52 | 64 | 0,25%, ΔE 0,4 | torna |
| aria da dentro (4,2 bar, verso l'orizzonte) | 3–192 passi | 1,9 | 48 (era 12) | ΔE 0,66 (con 24: 2,4) | torna |
| aria da fuori (9550 bar, il pianeta d'avvio a 5,5 raggi) | 6–384 passi | 2,1 | 48 | ΔE 0,79 (con 24: ~12) | torna |
| volume della ragnatela, a camera ferma | 6–96 passi, storia piena | 0,9 | 48 | ΔE 0,44 (con 24: 2,5 dopo la catena degli elementi) | torna |
| volume della ragnatela, in moto (un fotogramma) | | | 24 | ΔE 7,7 | **NON TORNA** (dichiarato) |
| il 3D nero: l'aria a camera ferma | | | | scarto 0 dal conto pieno | torna |

Due difetti veri trovati dalla prova e corretti in `pianeta.js`:

- **L'aria non convergeva ai passi dell'app.** Ogni passo prendeva la trasparenza a metà del tratto per tutto il tratto, con
  passi uniformi: su un'aria di qualche bar, verso l'orizzonte, un tratto è otticamente spesso nel blu (τ ≫ 1) e la luce
  dell'aria vicina — quasi tutta quella che si vede — si perdeva; a 12 passi ΔE 35, e la serie non convergeva (ordine 0,1).
  Ora ogni tratto è sommato in modo esatto per un tratto uniforme (∫e^(−σs)ds, come fa già il volume della galassia) e i
  confini dei tratti vengono da due densità di passi sommate: t ∝ f² (fitta vicino all'occhio) e passi uguali nel
  logaritmo dello spessore ottico verticale (gas e foschia: ogni fattore e di spessore ottico ha i suoi passi, anche dove
  l'aria densa sta lontano dall'occhio, come guardando un pianeta da fuori — con t ∝ f² soltanto, sui 9550 bar del pianeta
  d'avvio, il disco veniva ad anelli finché i passi non erano centinaia); il cammino comincia dove lo spessore ottico che
  resta sopra è sotto 10⁻³. Ordine 1,9 da dentro e 2,1 da fuori; 48 passi.
- **Le tabelle del cielo** avevano lo stesso difetto (l'irradianza del cielo sbagliava del 20% a 24 passi): stessa correzione.

Ciò che la prova non copre ancora: le griglie dei volumi, la riduzione, il salto del vuoto, la luce zodiacale, i livelli di
dettaglio del rilievo; la ragnatela in moto (la grana dei passi si vede finché la storia non si riempie); una sola galassia,
un solo pianeta con l'aria, un solo punto di vista per scena. E la prova su una scheda grafica vera: qui la grafica è
simulata (SwiftShader).

## Il 3D nero del punto a caso

`src/tre/prove/schermate/punto_a_caso.png` (prima: `punto_a_caso_prima.png`). Non era la grafica simulata, né il lato in
ombra: era un **errore vero**, in due pezzi.

1. A camera ferma l'aria di `pianeta.js` si calcola una volta (Add e Tot su due immagini sue) e poi si compone. Le due
   immagini si creavano al primo fotogramma fermo *dopo* aver legato le immagini che il programma legge: `N.immagine` lega
   l'immagine nuova all'unità attiva — la 5, quella delle nuvole —, e il programma che scriveva su Tot leggeva Tot. La
   scheda rifiuta un disegno così («feedback loop»): Add e Tot restavano a zero, e da lì in poi, finché la camera non si
   muoveva, ogni fotogramma componeva scena·0 + 0. Il punto a caso arriva sempre con la camera ferma: nero sempre, con
   qualunque seme e anche col codice vecchio. Corretto in due punti: `nucleo.js` crea le immagini su un'unità di servizio
   che nessun programma legge; `pianeta.js` crea Add e Tot prima di legare il resto, e li usa **solo dove dietro il punto
   c'è ancora la stessa distanza** (entro la precisione della profondità): dove la scena cambia (una tessera che arriva) il
   conto si rifà lì. Prova D di `test_vista`.
2. Corretto il primo, il suolo restava quasi nero (1,7·10⁻³ fogli bianchi: 7 su 255). È fisica, ma l'esposizione no: il
   pianeta (cosmo 5, galassia 1, stella 347, pianeta 1) gira a 27 UA da una nana bianca (Lw = 1,3·10²² W): la stella vi manda
   6,5·10⁻⁵ W/m², bassa sull'orizzonte (4°), e la luce diffusa della galassia ne manda 1,8·10⁻⁴; l'esposizione la decideva la
   proposta della galassia (0,07…), e il suolo stava 10 volte sotto. Con l'occhio che si adatta alla luce che c'è, il suolo
   ghiacciato si vede: a 5·10⁻⁴ cd/m², sopra la soglia assoluta, **in grigio** (visione notturna, coi bastoncelli). La
   riga in basso ora dice a quanta luce è adattato l'occhio e se vede i colori.

Poi, provando l'app (seme 12345: cosmo 1, galassia 17, stella 2250, pianeta 5, −231 °C, 0,0061 bar), ancora nero puro:
un **altro errore vero, nel modello delle nuvole**. Il punto è di notte (la stella 58° sotto l'orizzonte) e, quando
arrivano la superficie e il tempo di `meteo.js`, è coperto per intero; le nuvole prendevano la luce della stella e del cielo
ma non quella della galassia, che il suolo riceve: una coltre di nuvole di notte valeva esattamente zero, la misura vedeva
zero e l'occhio scendeva alla sua soglia. Ora le nuvole (e le sfere lontane, al posto dello 0,0008) ricevono la luce
diffusa della galassia: lo stesso punto è grigio a 5·10⁻⁴ cd/m² (`punto_12345.png`). Altri quattro semi (1, 777, 2026,
99999) non danno nero: col 99999 (un gigante di notte, con gli anelli) l'occhio, che guarda il lato in ombra, si adatta
a quello e gli anelli al sole escono bianchi — come per un occhio vero.

E all'avvio il pianeta (cosmo 1, galassia 33, stella 71, pianeta 0: 9550 bar) era un disco bianco nel cielo nero, poi nero
nel cielo bianco: con l'occhio adattato a tutta l'immagine la media era quasi tutta cielo nero; e, adattato al buio con la
stella nel campo, l'immagine a 16 bit traboccava (Inf), le miscele facevano NaN, la misura non vedeva più niente e l'occhio
restava al buio. Ora l'occhio si adatta alla fovea, e ciò che trabocca conta come il più chiaro che il formato tiene
(`avvio_occhio.png`: un disco grigio liscio, a 380 cd/m² — un'aria di quel peso non lascia vedere il suolo, come Venere).
Una galassia vista da fuori, con la fovea sul suo centro, mostra il nucleo e la polvere, e il disco più tenue.

Anche: con l'occhio vero **una galassia vista da fuori è grigia** (5·10⁻³ cd/m² sul nucleo: sotto il campo dei coni) e **la ragnatela
del cosmo sta alla soglia assoluta** (10⁻⁶ cd/m²): è ciò che vedrebbe un occhio, non un errore. Una lunga esposizione o
un'altra curva sono uno strumento (regola 14): manca, da dichiarare come tale.

I numeri: nell'indirizzo galassie, stelle e pianeti si contano da 0, nei nomi mostrati (il percorso, i pannelli, le
descrizioni) da 1; il cosmo da 1 in tutti e due. Lo dice ora la nota del punto a caso, accanto all'indirizzo (la via meno
invasiva: i nomi passati alla fonte del caso e la grammatica di `lingua.js` restano com'erano).

Nota: `src/tre/rete.js` (con `rete.worker.js`) non è più usato da nessuno (la ragnatela è il volume di `volumi.js`).

## Il lavoro 9: la finestra a ogni distanza (il mare)

`src/camera/finestra.js` calcola, a ogni lato della finestra del livello 5 dello zoom (mappa.js: da 1 m in giù, di dieci in
dieci) e a nanometri (la scena degli atomi), solo il quadrato inquadrato, come campione condizionato del mare di sopra. Le
leggi sono dichiarate nella sua testa; qui le costanti che decidono l'aspetto, con la classe:
- (a) sette nuove dal modello (sei in finestra.js, una in pianeta.js: il cielo riflesso secondo la pendenza, al posto della sua media): lo spettro delle onde (Elfouhaily e altri 1997, direzione di Mitsuyasu e altri 1975) anche nel
  3D al posto di Pierson-Moskowitz con cos² e «punta 10» a mano; il riflesso della stella con la pendenza sotto il punto
  (Cox e Munk 1954); il cielo riflesso di Rayleigh a diffusione semplice con lo spessore ottico della colonna d'aria del
  pianeta (al posto del «cielo» costante di coloreMare); la copertura di schiuma di Monahan e la sua riflettanza efficace
  (Koepke 1984); la zattera di bolle della schiuma (Deane e Stokes 2002); la struttura dell'acqua liquida (potenziale mW,
  Molinero e Moore 2009) al posto del reticolo cubico spostato a caso di `scenaMolecolare`.
- (b) cinque discretizzazioni, quattro provate in `test/test_finestre.mjs`: le tessere delle onde (4 lunghezze d'onda, 8
  campioni per onda: la griglia dell'app dista dalla legge esatta 0,13%, con 16 campioni 0,015%, ordine 3; le ottave più lunghe del lato si sommano esatte su 9×9 o 4×4 nodi del tratto e si interpolano con Lagrange cubica); la quadratura delle
  celle dei modi (Gauss-Legendre 4×4 contro 8×8: dentro la tolleranza della varianza); le ottave oltre 8 picchi non
  calcolate (lo spettro vale meno di e⁻⁸⁰); la scatola periodica dell'acqua mW di 3,1 nm (trenta passate di Monte Carlo in
  più non ne spostano l'energia); l'immagine della finestra rifatta al più venti volte al secondo (non provata: il moto delle
  onde più svelte, sotto il centimetro, salta di un ventesimo di secondo).
- (c) quattro a mano: l'esposizione 3,5 ereditata da coloreMare (e il suo «cielo» 0,008; 0,012; 0,018, che qui si toglie per
  avere la luce che l'acqua rimanda); la stella a mezzogiorno dell'equinozio quando chi chiama non dice l'istante (la finestra
  non sa ancora l'ora del 3D); la dispersione dei fiocchi (lognormale 0,5 attorno alla scala di Kolmogorov); gli idrogeni
  dell'acqua girati verso le vicine più vicine (non da una dinamica).
- NON TORNA, dichiarati: la schiuma è istantanea (nessuna schiuma vecchia trascinata dalla corrente); le bolle del pennacchio
  stanno solo sotto la schiuma (e quindi non si vedono); il cielo non ha la diffusione multipla né le nuvole (guardando
  giù, dove la stella non dà il riflesso, le increspature si vedono appena: è il cielo che manca, non le onde); il guscio
  degli ioni ha le vicine del liquido (4 per il Na⁺ invece di 5–6 misurate); lo spettro è quello del centro del tratto (tra
  un tratto e l'altro c'è un bordo).
- Non più usata dall'app per il mare: l'onda a mano di `mare.js` `immagineAcqua` (0,045·sin(x/0,3)…, il «campione visto di
  lato»): resta solo dove la finestra non c'è (terra asciutta).

## La tabella

| dove | che cosa fa | classe | da dove viene / che cosa servirebbe |
|---|---|---|---|
| `src/tre/nucleo.js:111` | soglia assoluta della visione, 10⁻⁶ cd/m² (campo largo, occhio al buio) | (a) dal modello / legge | misurata (Hecht, Shlaer & Pirenne 1942); nuova |
| `src/tre/nucleo.js:111` | grigio medio della percezione: CIE L* = 50 → Y = 0,184 dopo la curva | (a) dal modello / legge | dalla definizione di CIELAB; nuova (sostituisce l'esposizione proposta dagli strati) |
| `src/tre/nucleo.js:111` | campo mesopico 0,005–5 cd/m² (i colori sfumano nella luminanza scotopica) | (a) dal modello / legge | CIE 191:2010; luminanza scotopica di Larson, Rushmeier & Piatko 1997; nuova |
| `src/tre/nucleo.js:111` | F = 1: chi guarda lo schermo è in una stanza illuminata (adattamento al colore CIECAM02) | (c) a mano | dichiarata; servirebbe sapere la luce della stanza di chi guarda |
| `src/tre/nucleo.js:111` | 5772 K: la luce che illumina fuori da un sistema (per l'efficacia luminosa) | (c) a mano | valore del Sole (UAI 2015); fuori da un sistema servirebbe il colore medio della luce che c'è (la somma delle stelle) |
| `src/tre/nucleo.js:111` | l'adattamento si fa sulla FOVEA: 2° attorno al centro dello schermo (dove si guarda) | (a) dal modello / legge | la fovea centrale è larga ~1,5–2°; adattamento foveale di Larson, Rushmeier & Piatko 1997 (campi di 1°); nuova, al posto della media di tutta l'immagine (un pianeta piccolo nel cielo nero usciva bianco saturo). Dichiarato: il punto fissato è il centro |
| `src/tre/nucleo.js:392` | un punto oltre 65 504 (il massimo dell'immagine a 16 bit) o indefinito (Inf·0 nelle miscele) vale 65 504, nella misura e sullo schermo; le stelle disegnate al più 6,5·10⁴ | (b) discretizzazione | limite del formato, non del mondo: senza, un occhio adattato al buio con una stella nel campo riempiva l'immagine di NaN e restava al buio (il pianeta d'avvio nero) |
| `src/tre/nucleo.js:117` | efficacia luminosa K = 683·π∫B·ȳ/(σT⁴) della stella del luogo | (a) dal modello / legge | Planck + ȳ di Wyman, Sloan & Shirley 2013; nuova |
| `src/tre/nucleo.js:124` | grado di adattamento al colore D(L_A) di CIECAM02 | (a) dal modello / legge | nuova: sostituisce «0,45 + 0,55·colore» di sistema.js e pianeta.js |
| `src/tre/nucleo.js:113` | curva di tonalità (Narkowicz 2015: 2,51; 0,03; 2,43; 0,59; 0,14) | (c) a mano | un'approssimazione di ACES (un «aspetto»); servirebbe la risposta dei fotorecettori (Naka–Rushton) dall'occhio adattato allo schermo |
| `src/tre/nucleo.js:383` | gamma dello schermo 1/2,2 | (a) dal modello / legge | la funzione di trasferimento dello schermo (sRGB ≈ 2,2), non del mondo |
| `src/tre/nucleo.js:382` | von Kries nei primari sRGB (non nello spazio dei coni CAT02) | (c) a mano | dichiarata; servirebbe CAT02 (matrice dei coni) al posto dei primari |
| `src/tre/nucleo.js:482` | quanto in fretta l'occhio si adatta: 6/s verso il chiaro, 2,5/s verso il buio | (c) a mano | l'occhio vero impiega minuti al buio (Hecht 1937): qui è tarato su chi guarda uno schermo |
| `src/tre/nucleo.js:390` | la misura della luce media: griglia 32×32 su tutti i punti dell'immagine | (b) discretizzazione | esatta (somma di tutti i punti): non è un campione |
| `src/tre/nucleo.js:480` | l'ESPOSIZIONE: l'irradianza «che vale 1» era la più alta proposta dagli strati, coi loro fattori (0,07; 0,3; 0,6; 0,05; /20/10; /0,7…) e, sul pianeta, un'apertura di notte fino a 100 volte | (c) → **sostituita** | SOSTITUITA: l'occhio si adatta alla luminanza media misurata nell'immagine (tutti i punti, letta senza fermare la scheda), al grigio L* = 50, non sotto la soglia assoluta; le proposte restano solo per i primi fotogrammi |
| `src/tre/nucleo.js:134` | angolo di campo verticale 0,75 rad (43°) | (c) a mano | servirebbe dalla geometria dello schermo e dalla distanza di chi guarda (l'angolo che lo schermo sottende) |
| `src/tre/nucleo.js:228` | passi dei volumi della galassia e della ragnatela: 48 | (b) discretizzazione | provati: test_vista C (galassia da fuori e da dentro: ΔE p99 0 e 0,82; ragnatela a camera ferma 0,44; con 24, dopo la catena degli elementi, 3,3 da dentro e 2,5 la ragnatela) |
| `src/tre/nucleo.js:228` | riduzione 2: i volumi su un'immagine di metà lato | (b) discretizzazione | non provata: manca il confronto a riduzione 1 |
| `src/tre/nucleo.js:228` | accumulo: ferma 64 fotogrammi, passiFerma 2 | (b) discretizzazione | provato: test_vista (ordine 0,5 nei fotogrammi; a storia piena ΔE p99 0,4 galassia, 2,2 ragnatela) |
| `src/tre/nucleo.js:228` | accumulo: moto 4 fotogrammi, tolleranza 0,15 della distanza | (c) a mano | quanto si accetta di vedere strisciare in moto (accumulo.js lo dice); in moto la ragnatela NON TORNA (ΔE p99 7,7) |
| `src/tre/nucleo.js:228` | vuoto 10⁻⁴: sotto quale frazione della luce più forte del suo anello una cella è saltata | (b) discretizzazione | non provata: manca il confronto senza salto (vuoto 0) |
| `src/tre/nucleo.js:82` | colore di un corpo nero (luogo di Planck di Krystek 1985 → sRGB), massimo 1 | (a) dal modello / legge | approssimazione pubblicata |
| `src/tre/luci.js:21` | raggio dell'alone di un punto: √(picco/0,006) | (c) a mano | servirebbe la diffusione nell'occhio (abbagliamento, CIE 135/1999: L_velo ∝ E/θ²) |
| `src/tre/luci.js:20` | da irradianza a valore di picco: π·fuoco²/20 | (c) a mano | il /20 non viene dalla normalizzazione dell'alone 1/(1 + r²) (che conserva la somma solo fino al bordo): da ricavare |
| `src/tre/luci.js:23` | cuore bianco di una sorgente fortissima: 0,5·(1 + 0,25 r²) | (c) a mano | come sopra: l'abbagliamento |
| `src/tre/luci.js:26` | soglia di visibilità di un punto: picco 2·10⁻⁴ | (c) a mano | dalla curva e dal quanto dello schermo a 8 bit verrebbe ~5·10⁻⁶ (40 volte meno): da ricavare |
| `src/tre/luci.js:31` | profilo dell'alone 1/(1 + r²) e sua sfumatura al bordo | (c) a mano | come sopra |
| `src/tre/luci.js:87` | lato massimo di un batuffolo: 40 punti × (altezza/800) | (c) a mano | è il ripiego dei batuffoli: lo sostituisce il volume |
| `src/tre/luci.js:52` | forma di un batuffolo (1 − q²)² | (c) a mano | ripiego dei batuffoli |
| `src/tre/luci.js:47` | un batuffolo largo svanisce tra 0,45 e 1 del lato massimo | (c) a mano | ripiego dei batuffoli |
| `src/tre/universo.js:34` | colori dei batuffoli (sferoide [1; 0,82; 0,6]; disco con +0,1, −0,25, +0,4… a mano) | (c) → **sostituita** | SOSTITUITI: i corpi neri a 4300 K e 9500 K di volume.worker.js e l'arrossamento di Cardelli, Clayton & Mathis dall'attenuazione stessa |
| `src/tre/universo.js:77` | quanto è giovane un batuffolo ((rapporto − 1)·0,8) e quanto è buio (1/(1 + 60·polvere/stelle)); rapporto tra 0,15 e 6 | (c) a mano | servirebbe la colonna di polvere vera (A_V di vuoto.js) e la frazione di stelle giovani dalla storia di formazione |
| `src/tre/universo.js:45` | 60 000 batuffoli, 5·10⁶ frammenti | (b) discretizzazione | ripiego finché il volume non è pronto; non provato |
| `src/tre/universo.js:45` | luce della galassia: 95% diffusa, 5% nei punti del campione | (c) a mano | LIBERO (dichiarato): servirebbe la luce delle stelle sotto la soglia dell'occhio contata dalla loro funzione di luminosità |
| `src/tre/universo.js:71` | taglie dei batuffoli (0,012 e 0,018 Rg, 3·z₀, metà anello) | (c) a mano | ripiego |
| `src/tre/universo.js:128` | luce proposta dalla galassia (0,07 da dentro, 0,3 da fuori) | (c) a mano | ORA SOLO PARTENZA: l'occhio si adatta alla luce misurata (nucleo.js); conta solo prima della prima misura |
| `src/tre/universo.js:121` | chiarore di chi sta dentro un batuffolo (0,45/0,55 del lato, 1,5 − d/T) | (c) a mano | ripiego dei batuffoli |
| `src/tre/universo.js:140` | un punto del campione passa da «la sua parte» a «una stella» tra 0,004 e 0,25 Rg | (c) a mano | servirebbe la distanza a cui il campione si risolve (la densità delle stelle vere) |
| `src/tre/universo.js:162` | nel cosmo un punto porta 6·10⁻⁴ della luce di quelle che rappresenta | (c) a mano | LIBERO (dichiarato): perché da lontano si trovi |
| `src/tre/universo.js:219` | alone minimo 1,5 punti; passaggio tra 0,002 e 0,05 del lato del toro | (c) a mano | come sopra |
| `src/tre/universo.js:208` | luce proposta dal cosmo (la galassia più brillante a un decimo) | (c) a mano | ORA SOLO PARTENZA (l'occhio misura) |
| `src/tre/universo.js:185` | tabella del cono di luce: 33 punti | (b) discretizzazione | non provata (la si interpola linearmente) |
| `src/tre/universo.js:95` | la scena della galassia si rifà ogni mille anni (il cosmo ogni 10⁷) | (b) discretizzazione | passo nel tempo; non provato |
| `src/tre/universo.js:127` | la luce diffusa della galassia all'occhio (W/m²), per la notte del pianeta | (a) dal modello / legge | nuova: sostituisce la luce di notte 0,0006 di pianeta.js |
| `src/tre/volumi.js:27` | al più 160 passi; il salto del vuoto in 16 tratti | (b) discretizzazione | 160: il tetto (il più fine provato); i 16 tratti saltano solo ciò che è vuoto per costruzione |
| `src/tre/volumi.js:61` | i passi uniformi in asinh(z/h), h = 0,03·zmax; «nel piano» sotto 0,04 o 0,5 | (b) discretizzazione | lo schema dei passi: provato insieme ai passi (test_vista, da fuori e da dentro) |
| `src/tre/volumi.js:72` | il raggio si ferma quando passa meno di 0,3% della luce | (b) discretizzazione | errore ≤ 0,3%, sotto ε = 5,9% |
| `src/tre/volumi.js:69` | estinzione A_λ/A_V = 0,79; 1; 1,31 e 0,921 = ln10/2,5 | (a) dal modello / legge | Cardelli, Clayton & Mathis 1989, R_V = 3,1 |
| `src/tre/volumi.js:31` | sfasamento dei passi: 0,3 del passo senza accumulo | (b) discretizzazione | provato con i passi (è l'immagine «un fotogramma» di test_vista) |
| `src/tre/volumi.js:147` | griglia della galassia 160 × 96 × 48 | (b) discretizzazione | non provata (costo del lavoratore): manca il raddoppio |
| `src/tre/volumi.js:159` | la polvere davanti alle stelle del campione: 24 tratti | (b) discretizzazione | non provata |
| `src/tre/volumi.js:186` | ragnatela: 96³ elementi, griglia 128³; regione fine 64³/96³, lato 0,2, kmax 72 | (b) discretizzazione | non provata (42 s a preparare in questa macchina) |
| `src/tre/volumi.js:206` | luce proposta dalla ragnatela: «in media vale 0,05» | (c) a mano | ORA SOLO PARTENZA (l'occhio misura) |
| `src/tre/volume.worker.js:27` | le stelle giovani rendono 3 volte la luce per chilo | (c) a mano | LIBERO (dichiarato): servirebbe il rapporto massa/luce delle popolazioni di stelle.js |
| `src/tre/volume.worker.js:31` | popolazione vecchia 4300 K, giovane 9500 K | (c) a mano | servirebbe la temperatura di colore media delle popolazioni di stelle.js (con l'età e i metalli della galassia) |
| `src/tre/volume.worker.js:31` | il volume finisce a 1,15 Rg e ±0,8 Rg | (b) discretizzazione | troncamento del dominio; non provato |
| `src/tre/volume.worker.js:45` | tre medie 1-2-1 lungo il raggio (contro i cerchi degli anelli) | (c) a mano | toglie un difetto della griglia di galassie.js: servirebbe il disco continuo |
| `src/tre/volume.worker.js:47` | sfumatura al bordo della griglia (0,35 in quota, 0,2 in raggio) | (c) a mano | taglia lo sferoide senza spigolo: servirebbe un dominio che lo contenga |
| `src/tre/volume.worker.js:41` | κ della polvere da vuoto.js | (a) dal modello / legge | letto nel primo anello con gas (prima quattro raggi fissi: con il gas solo al centro κ = 0, la galassia senza polvere) |
| `src/tre/volume.worker.js:42` | lo strato della polvere: h_g = z₀·(σ_g/σ_z)², al più 0,1 kpc; la colonna del modello, media sulla cella | (a) dal modello / legge | il disco isotermo di Spitzer (1942) con σ_g = 10 km/s di galassie.js. Prima la polvere aveva sempre la mezza altezza fissa di galassie.js (0,1 kpc) e dove il disco è denso le stelle (z₀ di pochi pc) ci stavano dentro tutte: di taglio un muro, da dentro un pavimento. La colonna di faccia non cambia (Via Lattea a 0,5 Rg: A_V = 0,8). Resta il difetto di galassie.js (vuoto.js:86): le nubi e il gas di vuoto.js stanno ancora in 0,1 kpc |
| `src/tre/volume.worker.js:71` | tetto della polvere 6·10⁴ A_V per Rg | (b) discretizzazione | la griglia è a mezza precisione (65504): sopra sarebbe infinito; la cella più sottile ne fa già decine di magnitudini |
| `src/tre/volume.worker.js:89` | 10 fasce di massa d'alone, 64 elementi campione per la legge della luce | (b) discretizzazione | non provata |
| `src/tre/mezzo.js:33` | profilo di una nube oscura (1 − q²)^1,5 | (c) a mano | SCELTO (dichiarato): i dati danno raggio ed estinzione al centro, non il profilo |
| `src/tre/mezzo.js:36` | emissione per la corda, ×1,5 perché la media resti la brillanza | (a) dal modello / legge | geometria |
| `src/tre/mezzo.js:27` | una nebulosa larga più del lato massimo svanisce | (c) a mano | ripiego (il volume la contiene) |
| `src/tre/sistema.js:46` | colore della luce della stella: 0,45 + 0,55·corpo nero | (c) → **sostituita** | SOSTITUITO: la luce col suo colore vero (luminanza 1); l'adattamento è nell'occhio (CIECAM02, nucleo.js) |
| `src/tre/sistema.js:104` | luce proposta nel sistema: 0,6 del flusso a ≥ 3 raggi | (c) a mano | ORA SOLO PARTENZA |
| `src/tre/sistema.js:107` | segnaposto dei pianeti lontani: forza 0,35, grigio [170, 170, 165] | (c) a mano | SEGNO dichiarato («non è luce vera») |
| `src/tre/sistema.js:138` | le orbite: azzurro tenue, più tenui da vicino | (c) a mano | SEGNO (non luce) |
| `src/tre/sistema.js:115` | un corpo lontano resta un dischetto di 1,6 punti | (c) a mano | la sua luce totale è conservata (area); il minimo è un segno |
| `src/tre/sistema.js:119` | la superficie della stella al più 6,5·10⁴ fogli bianchi (prima 10⁷) | (b) discretizzazione | limite del formato a 16 bit (vedi nucleo.js) |
| `src/tre/sistema.js:97` | il pianeta vero si prepara sotto 400 raggi, si lascia sopra 900 | (b) discretizzazione | livello di dettaglio |
| `src/tre/pianeta.js:481` | colore della luce della stella: 0,45 + 0,55·corpo nero («l'occhio si adatta in parte») | (c) → **sostituita** | SOSTITUITO come in sistema.js |
| `src/tre/pianeta.js:701` | luce proposta sul pianeta: di giorno (μ + 0,12)/0,3, di notte fino a 1% vicino al suolo (sotto 0,25 R) | (c) a mano | ORA SOLO PARTENZA (l'occhio misura la luce di notte, e se è sotto la soglia resta buio) |
| `src/tre/pianeta.js:47` | quanto diffonde ogni gas rispetto all'azoto (dal quadrato della rifrattività) | (a) dal modello / legge | dati |
| `src/tre/pianeta.js:427` | Rayleigh dell'aria terrestre al suolo 5,8; 13,5; 33,1 ·10⁻⁶/m (680, 550, 440 nm) | (a) dal modello / legge | misurato |
| `src/tre/pianeta.js:427` | la foschia: 2,5·10⁻⁶/m × densità (al più 40) × (1 + 12·fuliggine + 40·acqua) | (c) a mano | servirebbe un modello degli aerosol (polvere sollevata dal vento, sale, solfati) dal clima |
| `src/tre/pianeta.js:428` | scala d'altezza della foschia max(600 m, 0,15·H) | (c) a mano | come sopra |
| `src/tre/pianeta.js:428` | dove l'aria finisce (≥ 8 scale d'altezza) | (b) discretizzazione | troncamento del dominio; non provato a parte |
| `src/tre/pianeta.js:444` | funzione di fase della foschia g = 0,76; estinzione 1,1 × diffusione | (c) a mano | valori tipici misurati sulla Terra, non dal modello degli aerosol |
| `src/tre/pianeta.js:442` | tabelle del cielo: 64 direzioni, 256 per l'irradianza, 24 passi (32 × 32 punti) | (b) discretizzazione | provate: test_vista B (ordine 1,6; 1,9; 2; l'app entro 0,13%, 1,3%, 0,0075%). NM = 32 non provato |
| `src/tre/pianeta.js:453` | passi delle tabelle uniformi → fitti all'inizio (t ∝ f²), e la trasparenza a metà tratto → integrale esatto del tratto | (b) discretizzazione | CORRETTO: con 24 passi l'irradianza del cielo sbagliava del 20% su un'aria di 4 bar (24→48: 17%); ora 1,3% |
| `src/tre/pianeta.js:477` | passi dell'aria: 12 → 48 | (b) discretizzazione | provati: test_vista C, da dentro un'aria di 4 bar e da fuori quella di 9550 bar del pianeta d'avvio (24: ΔE p99 2,4 da dentro, 12 da fuori; 48: 0,66 e 0,79); il primo della serie sotto la soglia in tutte e due |
| `src/tre/pianeta.js:763` | il cammino entra nell'aria dove lo spessore ottico che resta sopra, anche di striscio (fattore di Chapman all'orizzonte), è sotto 10⁻³ | (b) discretizzazione | troncamento del dominio con l'errore detto (un millesimo, sotto ε = 5,9%); nuovo |
| `src/tre/pianeta.js:285` | passi dell'aria uniformi → confini dalla somma di due densità di passi (t ∝ f², fitta vicino all'occhio; passi uguali nel logaritmo dello spessore ottico verticale, gas e foschia), ogni tratto sommato in modo esatto | (b) discretizzazione | CORRETTO: prima l'aria spessa non convergeva ai passi dell'app (ΔE p99 35 a 12 passi da dentro; da fuori, su 9550 bar, il disco ad anelli finché i passi non erano centinaia); ora ordine 1,9 e 2,1 |
| `src/tre/pianeta.js:477` | maglie, punti per pixel, errore in pixel, tessere al più 110 | (b) discretizzazione | livello di dettaglio del rilievo; non provato qui |
| `src/tre/pianeta.js:88` | le nuvole: la soglia del rumore (0,5 ± 0,235), la sfumatura −0,03/+0,11, i pesi 0,62/0,38, le frequenze 36 e 5 | (c) a mano | FORMA delle nuvole (rumore): solo la copertura viene da meteo.js; servirebbe la microfisica (gocce, convezione) |
| `src/tre/pianeta.js:323` | le nuvole: riflettanza 0,82, 0,45 + 0,55·μ, ombra propria 0,45, a 2500 m, opacità ×1,15 (di notte ora le illumina anche la galassia: mancava, e una coltre di nuvole di notte era nero puro) | (c) a mano | servirebbe il trasporto nella nube (spessore ottico dall'acqua liquida di meteo.js) |
| `src/tre/pianeta.js:167` | ombra delle nuvole sul suolo: toglie 0,78 | (c) a mano | come sopra |
| `src/tre/pianeta.js:757` | quota delle nuvole: min(0,7·H, 9 km); il rumore ricomincia ogni ≥ 6 h | (c) a mano | servirebbe il livello di condensazione dal profilo di temperatura e umidità |
| `src/tre/pianeta.js:196` | il terminatore: sfumatura a mano tra −0,02 e 0,03 | (c) → **sostituita** | SOSTITUITO: la parte del disco della stella sopra l'orizzonte (segmento di un disco di raggio angolare vero) |
| `src/tre/pianeta.js:514` | raggio angolare della stella stretto tra 10⁻³ e 0,2 rad | (c) a mano | il minimo 10⁻³ allarga la penombra delle stelle piccole (una nana bianca vera ha 10⁻⁶): da togliere con un filtro delle ombre |
| `src/tre/pianeta.js:717` | luce di notte: 0,0006 fissa | (c) → **sostituita** | SOSTITUITA: un quarto della luce diffusa della galassia che arriva all'occhio (cielo uguale da ogni parte) |
| `src/tre/pianeta.js:216` | colore dell'acqua senza tessera: (0,004; 0,012; 0,03) | (c) a mano | ripiego finché la tessera non arriva; servirebbe coloraMare sul livello 0 |
| `src/tre/pianeta.js:218` | Fresnel dell'acqua F₀ = 0,02 | (a) dal modello / legge | ((n − 1)/(n + 1))², n = 1,33; Schlick |
| `src/tre/pianeta.js:221` | il riflesso della stella: GGX con la pendenza delle onde, tetto 40 | (c) a mano | GGX è legge; il tetto 40 è a mano (limite dei 16 bit) |
| `src/tre/pianeta.js:735` | increspatura minima del mare 0,0012 | (c) → **sostituita** | SOSTITUITA (lavoro 9): la pendenza quadratica media dello spettro oltre l'ultima componente (la coda capillare di Elfouhaily e altri 1997, con la tensione superficiale e la densità di quell'acqua: finestra.js) |
| `src/tre/pianeta.js:224` | la schiuma: 0,5 sulla riva, ripide sopra 0,35, bianca 0,8, creste × 30 | (c) a mano, **in parte sostituita** | AL LARGO SOSTITUITA (lavoro 9): la parte del punto coperta dalle creste che frangono, W = 3,84·10⁻⁶·U^3,41 (Monahan e O'Muircheartaigh 1980), con la riflettanza efficace misurata 0,22 (Koepke 1984); la schiuma risolta, a forma di cresta, è nella finestra. Restano a mano 0,5 e 0,8 sulla riva (servirebbe la zona dei frangenti dal fondale) |
| `src/tre/pianeta.js:212` | un'onda conta se è lunga 3–9 punti dello schermo | (b) discretizzazione | risoluzione (sotto va nell'increspatura media) |
| `src/tre/pianeta.js:233` | la parte di cielo vista da un pendio (1 + cos)/2 | (a) dal modello / legge | cielo uguale da ogni parte |
| `src/tre/pianeta.js:363` | il bordo della stella: 0,4 + 0,6·μ^0,6, senza conservare il flusso | (c) → **sostituita** | SOSTITUITO: Eddington (atmosfera grigia) I(μ) ∝ 2 + 3μ, con il flusso uscente uguale al vero |
| `src/tre/pianeta.js:355` | un corpo più piccolo di un punto: la luce media del disco = 0,5 | (c) a mano | servirebbe la funzione di fase di Lambert all'angolo di fase vero (2/3 a fase piena) |
| `src/tre/pianeta.js:367` | le macchie e le fasce dei corpi lontani (rumore, frequenze 6, 23, 7) | (c) a mano | FORMA a mano: servirebbe la mappa vera del corpo (la superficie, le fasce dei giganti dalla circolazione) |
| `src/tre/pianeta.js:368` | luce minima dei corpi lontani 0,0008 (il lato in ombra di un gigante era nero) | (c) → **sostituita** | SOSTITUITA: la luce diffusa della galassia, come per il suolo (manca ancora la luce del pianeta vicino sulle lune) |
| `src/tre/pianeta.js:377` | le stelle di fondo del pianeta da solo: 2600, luce 0,004 + 0,05·v², al più ×60 | (c) a mano | SEGNAPOSTO dichiarato (nell'universo ci sono le stelle vere della galassia) |
| `src/tre/pianeta.js:393` | gli anelli: ombra 0,03; opacità 1 − e^(−2,5·spessore); fase 0,75/0,25; 0,35 + 0,65…; colore [220, 210, 190] | (c) a mano | servirebbe la diffusione nei grani degli anelli (albedo e fase dai dati, spessore ottico vero di anelli.js) |
| `src/tre/pianeta.js:499` | il colore delle lune del pianeta da solo: 0,18 + 0,5·ghiaccio | (c) a mano | servirebbe l'albedo di roccia e ghiaccio misurata, come in tessere.worker.js |
| `src/tre/pianeta.js:835` | la superficie della stella al più 6,5·10⁴ fogli bianchi (prima 3·10⁵) | (b) discretizzazione | limite del formato a 16 bit |
| `src/tre/pianeta.js:727` | l'orlo delle pezze scende di 3 maglie | (b) discretizzazione | geometria (copre le fessure) |
| `src/tre/tessere.worker.js:42` | riflettanze delle rocce: basalto 0,08, granito 0,24, copertura 0,20, sabbia 0,32 | (a) dal modello / legge | misurate (USGS splib07, ASTER) |
| `src/tre/tessere.worker.js:42` | forma spettrale della neve [0,955; 1; 1,015] | (a) dal modello / legge | Warren 1982 |
| `src/tre/tessere.worker.js:42` | tinta della sabbia [214, 200, 172] scritta qui | (c) a mano | dovrebbe venire da mare.js (dove la sabbia ha la sua tinta), non ripetuta |
| `src/tre/tessere.worker.js:113` | tinte di ripiego dei continenti [150, 140, 124] e dei basalti [84, 80, 76] | (c) a mano | ripiego se chimica.js non dà il colore |
| `src/tre/tessere.worker.js:47` | orizzonti: 8 direzioni, 12 distanze fino a 64 punti | (b) discretizzazione | non provata |
| `src/tre/buconero.js:180` | il disco finisce a 30 r_g; 12 macchie, grana 1,5, vita 1,5 giri, larghe 0,16 | (c) a mano | LIBERI (dichiarati): servirebbe la turbolenza magnetorotazionale |
| `src/tre/buconero.js:230` | luce proposta dal disco (/0,7) o dal cielo (/6, il millesimo più brillante) | (c) a mano | ORA SOLO PARTENZA |
| `src/tre/buconero.js:62` | il colore vero di un corpo nero (CIE 1931 analitica di Wyman et al.) | (a) dal modello / legge |  |
| `src/tre/buconero.js:180` | passo delle geodetiche | (b) discretizzazione | provato in test_relativita (deflessione contro l'integrale esatto) |
| `src/tre/buconero.js:87` | la carta del cielo 2048 × 1024, massimo a 30 000 | (b) discretizzazione | non provata |
| `src/tre/minori.js:39` | una luce diffusa sotto 4·10⁻⁵ fogli bianchi non si disegna (la polvere sotto 4 volte tanto) | (c) a mano | dalla curva e dal quanto a 8 bit verrebbe ~5·10⁻⁶: da ricavare insieme alla soglia di luci.js |
| `src/tre/minori.js:147` | la luce zodiacale: 10 passi (4 nelle fasce); al più 64 comete | (b) discretizzazione | non provata qui (riscontro() la confronta sulla CPU con luceZodiacale) |
| `src/tre/minori.js:246` | la luce più debole di un corpo che l'occhio vede (dal 2·10⁻⁴ di luci.js) | (c) a mano | segue la soglia di luci.js |
| `src/tre/minori.js:280` | riflettanza di Lambert 3/2 dell'albedo geometrico | (a) dal modello / legge |  |
| `src/tre/quanti.js:44` | il verde del fosforo P43 (545 nm) del rivelatore | (c) a mano | verrebbe dalla cromaticità misurata del P43; strumento dichiarato |
| `src/tre/quanti.js:44` | neutroni blu, quark d magenta | (c) a mano | SEGNO (convenzione dichiarata) |
| `src/tre/quanti.js:62` | la luce dei punti dello strumento (3,2; 4,5; 0,35; 0,25; 0,03; larghi 2,5σ) | (c) a mano | scelte dello strumento (dichiarate): servirebbe la risposta del fosforo e del rivelatore |
| `src/tre/splat.js:399` | gli splat (strada accanto ai volumi): 64³ elementi, pixel 1,5, al più 150 000 | (b) discretizzazione | prova a parte: src/tre/prove/splat.html (convergenza()) |
| `src/tre/accumulo.js:62` | lo sfasamento dei fotogrammi: Kronecker col rapporto aureo, R2 di Roberts | (b) discretizzazione | provato (test_vista, accumulo) |
| `src/camera/laboratorio.js:279` | il punto a caso si guarda dall'alto, dalla quota a cui il suolo è largo quanto la scala | (c) a mano | scelta di chi guarda (non della luce) |
| `src/camera/laboratorio.js:38` | i colori dell'interfaccia e dei diagrammi 2D (ACCENTO, veli, tracce) | (c) a mano | SEGNI dell'interfaccia: non dicono luce, e non vanno tolti |
| `src/camera/finestra.js:spettro` | lo spettro delle onde: Elfouhaily e altri 1997 (parte lunga con l'energia di campoOnde, coda capillare dalla velocità d'attrito e dalla tensione superficiale), direzione di Mitsuyasu e altri 1975 | (a) dal modello / legge | nuova (lavoro 9); anche nel 3D (pianeta.js) al posto di Pierson-Moskowitz con cos² e «punta 10» |
| `src/camera/finestra.js:immagineFinestra` | il riflesso della stella: distribuzione delle pendenze sotto il punto (Cox e Munk 1954) dalla coda dello spettro, più il disco della stella | (a) dal modello / legge | nuova (lavoro 9) |
| `src/camera/finestra.js:cieloDi` | il cielo riflesso: Rayleigh a diffusione semplice, τ(λ) = 4,6·10⁻³¹ m²·(550/λ)⁴ × la colonna d'aria del pianeta | (a) dal modello / legge | nuova (lavoro 9); manca la diffusione multipla, la foschia, le nuvole |
| `src/camera/finestra.js:SCHIUMA` | la copertura di schiuma W = 3,84·10⁻⁶·U^3,41 e la sua riflettanza efficace 0,22 | (a) dal modello / legge | Monahan e O'Muircheartaigh 1980; Koepke 1984 |
| `src/camera/finestra.js:leggeBolle` | le bolle della schiuma: Deane e Stokes 2002 (a^−3/2, a^−10/3, scala di Hinze), la più piccola da Epstein e Plesset | (a) dal modello / legge | nuova (lavoro 9) |
| `src/tre/pianeta.js:224` | il cielo riflesso dal mare nella direzione speculare: la forma di Rayleigh a diffusione semplice, la media della tabella del cielo | (a) dal modello / legge | nuova (lavoro 9): prima il cielo riflesso era uniforme (la sua irradianza), e da sopra le onde si vedevano solo per la schiuma a mano |
| `src/camera/acqua_mw.js` | la struttura dell'acqua liquida a nanometri: potenziale mW (Molinero e Moore 2009), Monte Carlo a 298,15 K | (a) dal modello / legge | nuova (lavoro 9): sostituisce il reticolo cubico spostato di 0,5 Å di scenaMolecolare |
| `src/camera/finestra.js:ONDE` | le tessere delle onde: 4 lunghezze d'onda, 8 campioni per onda | (b) discretizzazione | provata (test_finestre: 0,13% dalla legge esatta, 0,015% con 16; ordine 3) |
| `src/camera/finestra.js:bandaDi` | la varianza di ogni modo: Gauss-Legendre 4×4 sulla sua cella della corona | (b) discretizzazione | provata (test_finestre, test_coerenza_scale: contro 8×8) |
| `src/camera/finestra.js:ONDE.dalPicco` | le ottave più lunghe di 8 picchi non si calcolano | (b) discretizzazione | lo spettro lì vale meno di e⁻⁸⁰ (il fattore di Pierson-Moskowitz) |
| `src/camera/acqua_mw.js` | la scatola periodica di 1000 molecole (3,1 nm), ripetuta | (b) discretizzazione | provata (test_finestre: l'energia non si sposta con trenta passate in più); la ripetizione ogni 3,1 nm si vede guardando di taglio |
| `src/camera/mappa.js:583` | la finestra dell'acqua rifatta al più venti volte al secondo | (b) discretizzazione | non provata |
| `src/camera/finestra.js:ESPOSIZIONE` | l'esposizione 3,5 e il cielo (0,008; 0,012; 0,018) di coloreMare, ereditati | (c) a mano | li tiene coloreMare (mare.js); servirebbe l'occhio di nucleo.js anche nell'immagine piatta |
| `src/camera/finestra.js:soleDiMezzogiorno` | la stella a mezzogiorno dell'equinozio, se chi chiama non dice l'istante | (c) a mano | servirebbe passare alla finestra l'istante (e la stella) del 3D da cui si scende |
| `src/camera/finestra.js:taglie` | i fiocchi: lognormale 0,5 attorno alla scala di Kolmogorov | (c) a mano | servirebbe l'equilibrio tra aggregazione e rottura (Winterwerp 1998) per la distribuzione intera |
| `src/camera/finestra.js:scenaNano` | gli idrogeni dell'acqua verso le vicine più vicine (e gli ioni che non riordinano il guscio) | (c) a mano | servirebbe una dinamica (o un Monte Carlo) con l'acqua a tre siti e gli ioni |
