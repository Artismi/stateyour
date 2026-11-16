# Cristallo — progetto

Uno strumento per trovare e costruire pattern con il minimo di fisica che li fa nascere. Una pallina corre dentro un
cristallo e lascia una linea. Il cristallo ripete la sua cella, e così la linea diventa un motivo che si ripete. Niente è
disegnato a mano: le forme escono dalle leggi, e ogni pattern ha un indirizzo da cui si riottiene identico.

È un ramo separato dall'universo di «stateyour». Ne prende due idee: la **fonte del caso con indirizzo** (lo stesso
indirizzo dà sempre la stessa cosa) e la **biblioteca** (indirizzi vicini danno pattern simili). Il codice invece è
nuovo e leggero.

Per ora i pattern si guardano soltanto. L'esportazione delle linee come vettori (SVG) è prevista dopo: per questo le
linee si tengono come polilinee vere e non come pixel.

---

## 1. Il mondo

- **Il piano** con un **cristallo**: una cella, cioè un parallelogramma con i lati **a** e **b**, ripetuta senza fine.
  Ci sono quattro forme di cella: quadrata, esagonale, rettangolare e obliqua.
- **Gli atomi**: uno o più punti nella cella. Ognuno è una collina, che respinge, o una conca, che attira.
- **Le palline**: punti con massa e carica, lanciati da un punto in una direzione con una velocità.

La simmetria del pattern non si sceglie. Viene dalla forma della cella e da dove stanno gli atomi: le 17 simmetrie
possibili di un motivo nel piano (i gruppi di carta da parati) escono da sole.

## 2. Le leggi: tre, accendibili una alla volta

Ogni legge è una sola formula, e ognuna porta forme nuove.

| | legge | formula | forme che fa nascere |
|---|---|---|---|
| L1 | **il cristallo spinge** | F = −∇V, V(r) = Σₙ Σᵢ sᵢ·U₀·exp(−\|r − Rₙ − pᵢ\|² / 2w²) | rette, onde, canali, rosette, intrecci; ordine o caos secondo l'energia |
| L2 | **il magnete curva** | F = q·v × B (B perpendicolare al piano) | cerchi, epicicli, fiori; con L1, le orbite che saltano tra le colline |
| L3 | **la materia frena e a volte spezza** | frenata: dE/ds = −k/v² (la forma di Bethe ad alta velocità); rottura: un evento di Poisson con ritmo Γ, in due pezzi che conservano quantità di moto ed energia | spirali che si chiudono (con L2), forcelle, ventagli |

- Nella formula di L1, Rₙ sono i nodi del reticolo, pᵢ la posizione dell'atomo i nella cella, sᵢ = ±1 dice se è
  collina o conca, U₀ è l'altezza e w la larghezza.
- La gaussiana è la forma liscia più semplice, e la somma si fa sulle immagini vicine: oltre 4w il contributo è sotto
  10⁻³ di U₀.
- Più avanti si può passare a un potenziale atomico vero (Molière, schermato) senza cambiare nient'altro.

**Unità.** Si misura tutto in lati di cella, masse della pallina ed energie U₀. Il pattern dipende solo da pochi
rapporti, che sono le vere manopole:
- **E/U₀**: quanto la pallina è veloce rispetto alle colline;
- **w/a**: quanto sono larghe le colline rispetto alla cella;
- **il raggio di curvatura del magnete**, misurato in celle;
- **la strada di frenata**, misurata in celle.

## 3. Come si calcola (e come si controlla)

- **Integratore che conserva:**
  - per L1, Verlet a passo fisso, simplettico: l'energia oscilla ma non deriva;
  - per L2, il passo di Boris: in un campo magnetico conserva esattamente il modulo della velocità;
  - L3 si aggiunge come passo separato.
- **Il passo** si sceglie con una prova di convergenza: dimezzandolo, la linea non cambia oltre lo spessore di un
  pixel nella zona pulita.
- **La linea** è una polilinea vera, che resta disponibile per i vettori.
- **Il ripiegamento**: ogni punto r si porta nella cella, con r mod reticolo. La linea ripiegata è la **tessera**;
  la linea stesa su molte celle è il **viaggio**.

## 4. La zona pulita: quanto si ripete bene, misurato

Il motivo si ripete bene per un certo numero di celle, poi si sfalda. Quanto dura è una grandezza fisica, non una
scelta.

- **Nel cristallo perfetto e freddo:**
  - una traiettoria **regolare** (un canale, un'orbita chiusa, un moto quasi periodico) si ripete pulita per sempre;
  - una traiettoria **caotica** si separa da una vicina come e^(λt), dove λ è l'esponente di Lyapunov. Lo si misura
    con una gemella spostata di δ₀.
- **Nel cristallo vero:**
  - gli atomi vibrano col calore, con spostamento quadratico medio ⟨u²⟩ ∝ T (Debye, alle temperature alte);
  - ogni cella ha i suoi spostamenti, presi dalla fonte del caso con l'indirizzo della cella, quindi sono sempre gli
    stessi;
  - ci sono anche difetti rari, cioè atomi che mancano, presi con la stessa legge.
- **La misura.** La zona pulita sono le celle attraversate prima che il viaggio vero si stacchi dal viaggio nel
  cristallo perfetto più di una soglia d.
  - d è dichiarata: lo spessore della linea a schermo, cioè quello che l'occhio distingue.
  - Lo strumento lo dice con una frase: «si ripete bene per 40 celle».
- **Nell'interfaccia** c'è la manopola ❄️/🔥 della temperatura: col freddo la zona si allunga, col caldo si accorcia.

## 5. L'indirizzo e la biblioteca

- **Un pattern è un indirizzo corto**: forma della cella, atomi, leggi accese con le loro manopole, punto e direzione
  di lancio, temperatura, finestra di osservazione e tempo.
  - Gli eventi (rotture, vibrazioni) vengono dalla fonte del caso con quell'indirizzo, quindi lo stesso indirizzo dà la
    stessa immagine al bit.
  - L'indirizzo si scrive come testo leggibile e si può condividere.
- **I vicini**: cambiando di poco le manopole si ottengono pattern simili. Su questo si basano «❤️ ancora così» e la
  ricerca.
- **La ricerca (🎲)**:
  - sfoglia la biblioteca e tiene i pattern che una misura dichiarata giudica interessanti: lunghezza della zona
    pulita, copertura della cella, simmetria che emerge;
  - si può chiedere di cercare motivi ordinati o motivi che si sfaldano;
  - il criterio è sempre una misura, mai un ritocco della linea.

## 6. Tre modi di usarlo

1. **Scopri.** Una griglia di 9 tessere. Tocchi quella che ti piace e compaiono 8 sorelle vicine. Si va avanti
   scegliendo con l'occhio, come un'evoluzione guidata.
2. **Costruisci.**
   - Scegli il cristallo e tocchi la cella per mettere o togliere atomi.
   - Lanci la pallina trascinando una freccia: la lunghezza è la velocità, il verso è la direzione.
   - Accendi il magnete o la materia, e vedi la linea crescere.
3. **Ritaglia.**
   - Trascini un riquadro sopra il viaggio, e quel pezzo diventa la tessera che si ripete.
   - Si può tagliare anche il tempo: solo l'inizio del viaggio, solo la fine, oppure una fetta di mezzo.

## 7. L'interfaccia: la deve capire un bambino di 5 anni

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Scopri     🛠 Costruisci     ✂️ Ritaglia          ↩  ↪     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│               IL PATTERN, GRANDE (quasi tutto lo schermo)    │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 🔷 ⬡ ▭ ▱   ⚪→   🧲 ◯───●   🐢──●──🐇   ❄️──●──🔥   🎲  ❤️  💾   │
│  «si ripete bene per 40 celle»            🧩 tessera / 🔍 viaggio │
└──────────────────────────────────────────────────────────────┘
```

- **Una sola cosa grande**, il pattern. Gli strumenti stanno in una fila in basso: pochi, con icone grandi e
  nessuna parola tecnica.
- **Ogni gesto si vede subito**: la linea cresce mentre la guardi, come un disegno che si fa da solo.
- **Ogni oggetto ha il suo colore**, sempre lo stesso: pallina, magnete, materia, colline.
- **Niente numeri in vista.** I numeri e le leggi stanno nel pannello «per i grandi» (ⓘ), chiuso all'inizio, dove ogni
  manopola mostra il suo valore e la sua formula.
- **Niente vicoli ciechi**: ↩ ↪ sempre, e 🎲 riporta sempre a qualcosa di bello.
- **Lo stile**: fondo scuro, linee luminose e sottili, che si sovrappongono come in una camera a bolle. Il colore può
  seguire la velocità (lenta calda, veloce fredda) o il tempo.

## 8. I pattern che ci aspettiamo (e che le prove devono ritrovare)

| situazione | pattern atteso | perché |
|---|---|---|
| L1, energia alta, lancio lungo una fila di atomi | righe parallele dritte e ondulate (un canale) | incanalamento: la pallina resta tra due file |
| L1, energia appena sopra le colline | intreccio fitto, zona pulita corta | il moto diventa caotico (biliardo di Sinai morbido) |
| L1, conche, energia bassa | piccoli fiori chiusi in ogni cella | la pallina resta intrappolata e gira |
| L2 da sola | cerchi tutti uguali | la forza di Lorentz con B uniforme |
| L1 + L2 | rosette, epicicli, cerchi che saltano di cella in cella | orbite di cerchio che toccano le colline (come gli elettroni nei «superreticoli») |
| L2 + L3 | spirali che si chiudono | la frenata accorcia il raggio |
| L3, rotture | forcelle e ventagli | la conservazione della quantità di moto |
| cella esagonale con un atomo | motivo a simmetria 6 | viene dalla cella, non è scritto |

## 9. Le prove (scritte prima del codice)

- **L'energia** con L1 deriva meno di 10⁻⁶ su 10⁶ passi; con L2 il modulo della velocità resta esatto all'aritmetica.
- **Il determinismo**: stesso indirizzo, stessa polilinea al bit.
- **La convergenza del passo**: nella zona pulita lo scarto tra un passo e la sua metà è sotto lo spessore della linea.
- **La simmetria che emerge**: la tessera di un cristallo esagonale, ruotata di 60°, coincide con sé stessa entro la
  zona pulita; con la cella obliqua no.
- **La zona pulita**:
  - a T = 0 una traiettoria regolare non si sfalda mai;
  - quella caotica si sfalda dopo un tempo vicino a ln(d/δ₀)/λ;
  - la zona si accorcia al crescere di T.
- **La conservazione nelle rotture**: quantità di moto ed energia prima e dopo, esatte.
- **I pattern attesi** della tabella del punto 8 si ritrovano, con misure e senza guardarli a occhio: il raggio dei
  cerchi, la simmetria, la presenza di un canale.
- **Il costo**: la linea cresce a 60 fotogrammi al secondo, e il primo pattern compare in meno di 1 s.

## 10. Le tappe

1. **Il cuore**: cristallo, L1, integratore, viaggio e tessera, zona pulita, indirizzo. Con le prove. Senza
   interfaccia bella.
2. **Costruisci**: l'interfaccia semplice, solo con L1 e L2. È il primo prototipo da provare insieme.
3. **L3 e la temperatura** (❄️/🔥).
4. **Ritaglia** (spazio e tempo).
5. **Scopri** e **🎲**: la biblioteca e la ricerca.
6. **Lo zip per Windows.** Poi, quando lo vorrai, i vettori (SVG).

**Tecnica.**
- JavaScript senza costruzione, una pagina sola, con Canvas 2D per le linee.
- Il calcolo sta in un worker, per non bloccare l'interfaccia, ed è impacchettabile con Electron come stateyour.
- La cartella è `cristallo/` in questo ramo.
