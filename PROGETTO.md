# Il progetto: il programma come interprete della lingua

Riferimenti: `INTRECCIO.md` (le 14 regole), `LINGUA.md` (la lingua dell'indirizzo, oggetti O1–O12, condizioni C1–C16),
`reports/Tesi del multiverso indirizzabile.md` (la derivazione). Questo documento dice **come si costruisce**: che cosa
esiste già, che cosa manca, in che ordine, e come si sa che un pezzo è finito.

## L'idea in una riga

Il programma non simula un universo: **interpreta un indirizzo**. Dato un indirizzo, le leggi danno il mondo che esso
nomina, solo dove lo si guarda; la misura dice quanto pesa; l'osservazione dice che cosa si vede; il passo dice dove
si può andare da lì. Tutto il resto è un modo di chiedere.

## I cinque strati

```
            ┌──────────────────────────────────────────────────────────────┐
  1 LINGUA  │ indirizzo := luogo @ tempo # rami      leggi / scrivi / peso  │  lingua.js, LINGUA.md
            ├──────────────────────────────────────────────────────────────┤
  2 CASO    │ chiave(indirizzo) → tiri; ogni tiro con la sua legge          │  eventi.js
            ├──────────────────────────────────────────────────────────────┤
  3 LEGGI   │ per grana g:  riassunto M  ·  raffinamento μ  ·  evoluzione T │  cosmo, galassie, stelle,
            │               M∘μ = I   e   M∘T_fine = T_grossa∘M            │  geologia, mare, chimica, …
            ├──────────────────────────────────────────────────────────────┤
  4 MISURA  │ peso(indirizzo) = Π livelli · Π esiti dei rami                │  lingua.js (+ misura.js)
            ├──────────────────────────────────────────────────────────────┤
  5 VISTA   │ osservazione = trasporto di luce verso un rivelatore          │  src/tre, laboratorio.js
            └──────────────────────────────────────────────────────────────┘
  ai lati:  BOLLE (incollamento, antenato comune: bolle.js)  ·  PASSO (P(a′|a): tempo e rami vicini)
```

Ogni strato parla solo con quello sotto attraverso la lingua: la vista non chiede «il pianeta 3», chiede un indirizzo.

## La regola zero: una regola sola, declinata a ogni grana

Le leggi dello strato 3 non sono leggi indipendenti scritte una per una: sono **una regola sola vista a grane diverse**.
Ogni modulo deve poter dire, nella stessa forma:

1. **Stati** — su che cosa è una distribuzione a questa grana (molecole, grani, masse d'aria, stelle…).
2. **Conservazioni** — energia, elementi (numero per numero), carica, quantità di moto: ciò che entra nel libro dei conti.
3. **Energie** — le energie libere degli stati; da loro le velocità dei passaggi, con il **bilancio dettagliato locale**:
   k(x→y)/k(y→x) = e^{Δs/k_B}, l'entropia prodotta nel passaggio (termodinamica stocastica; Crooks 1999, Seifert 2012).
4. **Flussi dal bordo** — la luce della stella, il calore interno, la chimica dei vulcani: ciò che tiene il sistema
   lontano dall'equilibrio.

E **la regola di una grana è quella che commuta con la regola sotto**: M∘T_fine = T_grossa∘M (C8). La commutazione non è
solo una prova: è il criterio per dire se una legge è giusta. Oggi molti moduli sono formule della letteratura; il difetto
di commutazione misurato dice quanto ciascuno è lontano dall'essere una declinazione della regola. Dove una legge è presa
da una tabella misurata (energie, solubilità, viscosità), va bene come dato, ma in linea di principio deve potersi
ricavare dalla grana sotto, o almeno confrontarsi con essa.

Conseguenze:
- **Nessun «a priori»**: le quantità (quanti elementi in un mare, quanta vita) escono dalla storia; il libro dei conti
  garantisce soltanto che nulla si crei o sparisca tra un passaggio e l'altro.
- **Dall'alto si condiziona, dal basso si media**: la grana grossa vincola la fine (μ); la fine agisce sulla grossa in media,
  e da singolo evento solo dove un processo lo amplifica (mutazione, primo nucleo, caos): lì nasce un ramo.
- **La vita non si scrive**: si danno i presupposti (la chimica di quel pianeta, le energie, i flussi, i luoghi) e il
  programma *riconosce* ciò che emerge (reti che si autoalimentano, compartimenti che si chiudono da sé, molecole che si
  copiano). L'elenco dei gradini diventa una prova di ciò che la regola deve saper produrre, non codice. La probabilità
  di arrivarci si stima con i metodi degli eventi rari sulla chimica riassunta, una volta per indirizzo, e diventa un
  ramo con il suo peso. Dichiarato: nessuno sa oggi calcolarla dalla fisica; il numero dipenderà dalla grana della
  chimica riassunta, che è una scelta di modello.
- **Anche la vista è una finestra**: a ogni distanza si calcola con la regola di quella grana solo ciò che si inquadra,
  come campione della grana sopra; riassunta, la finestra ridà il padre.

## Che cosa c'è e che cosa manca, strato per strato

| Strato | C'è | Manca | Condizioni |
|---|---|---|---|
| 1 Lingua | grammatica unica, andata e ritorno, HEALPix, peso per livello, punto a caso, impronta; una forma sola in tutto il programma, anche nei cosmi paralleli (lavoro 3) | — | C1 |
| 2 Caso | fonte unica, ordine indifferente; Threefry‑4×32‑20 con chiave a 128 bit (vettori noti Random123, SmallCrush e Crush di TestU01 passati); il registro annota la legge di ogni tiro (`bernoulli`, `discreta`, …) | i moduli che dichiarano la legge dei loro tiri (oggi quasi tutti leggono tiri nudi e pesano 1); BigCrush | C2, C3 |
| 3 Leggi | cosmo senza bordo; galassie, stelle, pianeti, storia termica, clima, erosione, mare, chimica, grani, atomi, scala quantistica; zoom senza salti; la coerenza tra le scale provata passaggio per passaggio, dal campo del cosmo ai quark (`test_coerenza_scale`: C6 su 15 passaggi, C8 misurata dove ci sono due grane; lavoro 5) | M (o μ) dove la tabella dice «manca»: il posto delle galassie vere, il sistema delle stelle vere, le regioni della magnetosfera, un'evoluzione a due grane sotto gli atomi; le incoerenze note della tabella (la quota media delle tessere, le celle non neutre di feldspati e biotite); un limite dal modello al difetto delle soglie di comodo (la gigante, il clima: oggi solo misurato); lo stato a un istante diverso da «adesso» sopra le particelle; la vita | C6, C7, C8, C14 |
| 4 Misura | indice del cosmo (Elias γ, libero), galassia per massa, stella per peso, pianeta per area, luogo per area, tempo sulla vita della stella | pesi degli esiti (in corso); dal campione al vero (in corso); fusioni (in corso); cervelli di Boltzmann contati (in corso); momenti d'osservatore (serve la vita) | C4, C5, C11, C13 |
| 5 Vista | trasporto di luce: aria, polvere, nebulose, buco nero, galassia e ragnatela come volumi, accumulo nel tempo; **l'occhio** come rivelatore (si adatta alla luminanza misurata nella fovea, 2° attorno al centro, soglia assoluta, visione crepuscolare, adattamento al colore di CIECAM02); l'elenco delle scelte a mano (`reports/Scelte a mano nella vista.md`: 128 righe, 20 dal modello, 36 discretizzazioni, 72 a mano di cui 8 tolte); la convergenza dei passi dei volumi, dell'aria, delle tabelle del cielo e dell'accumulo (`test_vista`, lavoro 7) | le 64 scelte a mano rimaste (la curva di tonalità, l'abbagliamento e le soglie di visibilità, le nuvole, la foschia, le popolazioni della galassia, gli anelli…); la convergenza delle griglie dei volumi, della riduzione, del salto del vuoto, della luce zodiacale, del rilievo; la ragnatela in moto (non torna); la prova su scheda grafica vera; uno strumento dichiarato accanto all'occhio (la lunga esposizione) | C12 |
| Bolle | campo condizionato esatto, antenato comune nel punto e nel tempo; l'impronta di bordo (O11: armoniche dei campi sulla sfera, ℓmax dalla grana), l'incollamento sul bordo comune e la ricostruzione dal bordo, l'antenato tra luoghi e istanti diversi in tempo conforme (η_c), il cono di luce dei rami del campo (lavoro 6: `bordo.js`) | le impronte nel cosmo con le sue galassie (insieme in `vincola`); temperatura, campo magnetico e radianza sul bordo; Gauss e Dirichlet con i nuclei troncati; l'antenato di più di due eventi quando non lo sostiene una coppia; il cono di luce sopra il campo (i rami di stelle e pianeti hanno ancora solo il contenitore); le distanze tra contenuti («una stella a un metro da un fiocco di neve») | C9, C10, C15 |
| Passo | «pianeta parallelo», «ramo parallelo più pulito» | il nucleo P(a′\|a) nel tempo e di lato, con Chapman–Kolmogorov | C16 |

## L'ordine dei lavori

Due alla volta. Ogni lavoro finisce con una prova che verifica la sua condizione.

1. **Fondamenta del caso** — 128 bit, variante verificata, registro della legge di ogni tiro. *Fatto quando:* C2, C3,
   catena intera verde sul nuovo universo. (Fatto: 50 prove verdi a macchina ferma; registro delle leggi applicato e provato.)
2. **Misura** — pesi degli esiti, dal campione al vero, fusioni, prima stima dei cervelli di Boltzmann. *Fatto quando:*
   C4, C11, C13 provate; `puntoACaso` uniforme sulle stelle vere. (Fatto: `misura.js`, «vera k»; manca che i moduli
   dichiarino la legge dei loro tiri.)
3. **Una forma sola dell'indirizzo** — `bolla.js` e `src/tre` scrivono con `lingua.scrivi`. *Fatto quando:* ogni
   indirizzo prodotto dal programma si rilegge (C1), anche nei cosmi paralleli. (Fatto: `test_lingua_indirizzo` I.)
4. **Il passo** — P(a′\|a): stesso luogo a t+Δt (lento dalle leggi, veloce per peso oltre il tempo di amplificazione)
   e rami vicini. *Fatto quando:* C16 su un pianeta (due passi da 500 anni = uno da 1000, in distribuzione).
   Richiede lo stato a istanti diversi (C14) almeno per clima e superficie.
5. **Coerenza tra scale** — per ogni coppia di livelli: riassumere il raffinato ridà il padre (C6), e la misura del
   difetto di commutazione (C8). *Fatto quando:* una tabella stampata dalla prova, livello per livello. (Fatto:
   `test_coerenza_scale`, 52 righe in ~13 s: campo del cosmo e suoi livelli, galassie e galassie vere, galassia e stelle
   del campione, stelle vere, disco, pianeti, superficie, tessere, roccia, grani, celle e atomi, acqua di mare, scala
   quantistica, nucleo e quark; ogni tolleranza dal modello. Corretti nel farla: i grani di `grani.js` — i germi nati nel
   già solido vincevano punti con le listelle orientate e i cristalli lontani non erano cercati, 13% di grani in più, e
   con il vetro il numero di grani era quello di una roccia tutta cristallina —; gli ioni del mare in `quanti.js`
   (Na⁺ con 11 elettroni); l'acqua dell'erosione contata con l'area dei conti dei fiumi (3·10⁻⁵ del mare). Restano NON
   TORNA, note: la quota media delle tessere; la carica delle celle di feldspati e biotite. Mancano i riassunti segnati
   «manca».)
6. **Bolle sul bordo** — l'impronta di bordo (armoniche sferiche dei campi sul bordo) e l'incollamento sulla parte
   comune; l'antenato comune per luoghi e istanti diversi. *Fatto quando:* C10 e C15. (Fatto: `src/camera/bordo.js`,
   `test_bordo`, 16 prove in ~12 s. L'impronta a_ℓm di densità e potenziale su una sfera, con ℓmax = ⌈πR/h_J⌉ dal bordo
   della banda del campo alla grana J (40 Mpc alla grana del cosmo: ℓmax 7, coda oltre 2·10⁻⁴ della varianza), esatta per
   il campo com'è (Funk–Hecke cella per cella; la quadratura del campo punto per punto converge a lei, ordine 1,9), pura
   dell'indirizzo, nel tempo con D(a) e D/a. Su 160 mondi indipendenti: χ² dell'impronta per grado 1,02; sul cerchio comune
   di due bolle le due impronte risommate e il campo vero concordano entro il resto previsto (⟨z²⟩ 0,97–1,04); dal solo
   bordo l'interno condizionato contiene il campo vero (⟨z²⟩ 0,8–1,2; due bolle insieme spiegano ~90% della varianza
   dentro); il campo condizionato all'impronta di sé non si muove (0 al bit; 2·10⁻⁵ scarti con l'impronta della
   quadratura, sotto il limite di Cauchy–Schwarz); un altro mondo condizionato alle due impronte le riproduce entro
   10⁻¹²; bolle di due mondi diversi sulla stessa regione hanno il χ² che il modello prevede, e pesano molto meno.
   L'antenato η_c = (η_p + η_q − |Δx|)/2 (con i raggi delle bolle) sta nel passato di entrambe ed è il più recente su 400
   coppie; oltre 2η₀ = 28,3 Gpc è prima dell'inizio e c'è solo con l'inflazione (dichiarata). C9 col cono di luce per il
   campo: un ramo fuori portata lascia l'impronta identica al bit; senza l'inflazione cadrebbe, e lo si misura: oggi il
   51% della varianza del potenziale viene da celle più larghe dell'orizzonte. Non torna / manca: vedi la riga Bolle.)
7. **La vista come misura** — l'elenco delle scelte a mano nel motore, tolte o dichiarate; la prova di convergenza
   dell'immagine (C12); la prova su una scheda grafica vera. (Fatto senza la scheda vera: `reports/Scelte a mano nella
   vista.md` — 128 costanti che decidono l'aspetto, con riga, classe e che cosa servirebbe: 20 dal modello, 36
   discretizzazioni, 72 a mano; tolte 8: l'esposizione, che ora è L'OCCHIO di `nucleo.js` — si adatta alla luminanza media
   misurata nella fovea (2° attorno al centro dello schermo; Larson e altri 1997), la porta al grigio L* = 50, non sotto la soglia assoluta di 10⁻⁶ cd/m², con le candele del corpo
   nero della stella, i colori che sfumano nella visione notturna (CIE 191, Larson 1997) e l'adattamento al colore di
   CIECAM02 al posto di «0,45 + 0,55·colore» in due file —, i colori dei batuffoli, il terminatore, la luce di notte, il bordo
   della stella (Eddington), la luce minima dei corpi lontani. `test_vista` (`npm run vista`, a parte: vuole Chromium; ~62 s, 11 prove): ΔE*ab = 2,3 dichiarata
   (Mahy e altri 1994) sull'immagine dello schermo, ε = 5,9% per gli scarti di luce; passi della galassia da fuori e da dentro
   (ordine 1,8 e 2,1; a 24 passi ΔE 0,4 e 2,1), accumulo (ordine 0,5 nei fotogrammi; a storia piena ΔE 0,4), aria da dentro (4 bar) e da fuori (i 9550 bar del pianeta d'avvio: ordine 1,9 e 2,1; 48 passi
   ΔE 0,7 e 0,8), tabelle del cielo (ordini 1,6–2, l'app entro 1,3%), ragnatela a camera ferma (ΔE 2,2). Corretti nel
   farla: l'aria e le tabelle del cielo non convergevano su un'aria spessa (trasparenza a metà tratto, passi uniformi: ΔE 35 a
   12 passi; ora tratti sommati in modo esatto, confini dalla somma di due densità di passi — vicino all'occhio e uguali nel logaritmo
   dello spessore ottico —, e 48 passi); IL 3D NERO del punto a caso — un
   errore vero: le immagini dell'aria a camera ferma create sull'unità che il programma leggeva, il disegno rifiutato, l'aria
   nera finché non ci si muoveva —, e dopo, il suolo sotto una nana bianca a 27 UA che l'esposizione di prima lasciava 10
   volte sotto; poi, provando l'app: le nuvole di notte senza la luce della galassia (nero puro, seme 12345), l'occhio
   adattato a tutta l'immagine (il pianeta d'avvio bianco saturo) e l'immagine a 16 bit che traboccava in NaN (lo stesso
   pianeta nero nel cielo bianco). I numeri dell'indirizzo contano da 0 e quelli mostrati da 1: lo dice la nota del punto a
   caso. Non torna: la ragnatela in moto (ΔE 7,7, dichiarato). Manca: la scheda vera, le griglie dei volumi, le 64
   scelte rimaste.)
8. **La catena degli elementi** — nessun inventario fissato: le abbondanze della stella dall'arricchimento della
   galassia (supernove II e Ia, giganti, con i loro tempi), il disco per temperature di condensazione, il pianeta che si
   separa (coefficienti di ripartizione metallo/silicato), la crosta per fusione parziale (elementi incompatibili), aria e
   mare da ciò che si libera e si scioglie. *Fatto quando:* il libro dei conti torna elemento per elemento in ogni
   serbatoio, ed è una riga della tabella di coerenza.
9. **La finestra a ogni distanza** — cominciando dall'acqua: da lontano lo spettro delle onde dal vento; a metri il campo
   delle onde di quel tratto, la schiuma, la corrente; a centimetri increspature, bolle, granelli; a micron fiocchi di
   argilla; a nanometri l'acqua liquida con ogni specie disciolta nel suo numero. Poi la roccia, l'aria, il suolo.
   *Fatto quando:* a ogni distanza si vede ciò che c'è (mai un cristallo solo nel vuoto) e la finestra riassunta ridà il padre.
10. **La chimica che si muove da sé** (era «la vita in potenza») — la regola zero applicata alla chimica del pianeta, con
   la rilevazione di ciò che emerge e la stima degli eventi rari; da qui i momenti d'osservatore. Base:
   `reports/Regole per la vita in potenza.md`, riletta come elenco di prove, non di passi.
11. **Eredità, sviluppo, evoluzione** — la stessa regola un livello sopra. *Eredità*: un polimero che si copia con errori
   (il DNA sulla Terra; altrove quello che la chimica del pianeta permette). *Sviluppo*: il genoma non disegna il corpo,
   regola una rete di geni; i tipi di cellula sono gli stati stabili di quella rete (Kauffman; il paesaggio di Waddington),
   e la forma viene da campi chimici che si diffondono e reagiscono (Turing) e dalla meccanica dei tessuti. *Evoluzione*:
   nessuna «idoneità» scritta: è la velocità di riproduzione in quell'ambiente; le leggi della genetica di popolazione
   (Wright–Fisher, probabilità di fissazione di Kimura, equazione di Price) ne sono la declinazione a grana di specie. Il
   corpo è limitato dalla fisica del pianeta (gravità e ossa per il quadrato-cubo, ossigeno e respirazione, luce e
   occhi). L'albero della vita si calcola pigro come le galassie: clade → specie → individuo → cellule, ogni nodo
   condizionato alla storia del suo ambiente; riassunto, ridà biomassa, ossigeno, carbonio. *Fatto quando:* due grane
   (individui e specie) commutano entro una tolleranza dal modello.

## Come si usa, alla fine

- **Scrivo un indirizzo** → il programma apre quel mondo in quel punto, a quella scala.
- **Chiedo un punto a caso** → scende l'albero con la misura e mi dice anche quanto è speciale (bit).
- **Descrivo che cosa voglio trovare** («un pianeta con acqua liquida») → la bolla cerca gli indirizzi compatibili
  e me li dà con il loro peso.
- **Mi muovo** → con la rotella nella scala, con il passo nel tempo o verso i rami vicini.
- **Guardo** → ciò che vedo è luce calcolata, o la misura di uno strumento dove la luce non c'è, e lo dice.
