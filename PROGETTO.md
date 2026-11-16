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
| 3 Leggi | cosmo senza bordo; galassie, stelle, pianeti, storia termica, clima, erosione, mare, chimica, grani, atomi, scala quantistica; zoom senza salti; la coerenza tra le scale provata passaggio per passaggio, dal campo del cosmo ai quark (`test_coerenza_scale`: C6 su 15 passaggi, C8 misurata dove ci sono due grane; lavoro 5); la catena degli elementi, dalla galassia al mare, con il libro dei conti elemento per elemento (lavoro 8) | M (o μ) dove la tabella dice «manca»: il posto delle galassie vere, il sistema delle stelle vere, le regioni della magnetosfera, un'evoluzione a due grane sotto gli atomi; le incoerenze note della tabella (la quota media delle tessere, le celle non neutre di feldspati e biotite); per gli elementi: la fase calda del disco giovane (Na, K, Cl ancora ×5 nella Terra del modello) e le uscite del sodio dal mare, le rese delle giganti rilette, il decadimento nel libro dei conti; un limite dal modello al difetto delle soglie di comodo (la gigante, il clima: oggi solo misurato); lo stato a un istante diverso da «adesso» sopra le particelle; la vita | C6, C7, C8, C14 |
| 4 Misura | indice del cosmo (Elias γ, libero), galassia per massa, stella per peso, pianeta per area, luogo per area, tempo sulla vita della stella | pesi degli esiti (in corso); dal campione al vero (in corso); fusioni (in corso); cervelli di Boltzmann contati (in corso); momenti d'osservatore (serve la vita) | C4, C5, C11, C13 |
| 5 Vista | trasporto di luce: aria, polvere, nebulose, buco nero, galassia e ragnatela come volumi, accumulo nel tempo; **l'occhio** come rivelatore (si adatta alla luminanza misurata nella fovea, 2° attorno al centro, soglia assoluta, visione crepuscolare, adattamento al colore di CIECAM02); l'elenco delle scelte a mano (`reports/Scelte a mano nella vista.md`: 144 righe, 27 dal modello, 41 discretizzazioni, 76 a mano di cui 9 tolte); la finestra a ogni distanza per l'acqua (lavoro 9); la convergenza dei passi dei volumi, dell'aria, delle tabelle del cielo e dell'accumulo (`test_vista`, lavoro 7) | le 67 scelte a mano rimaste (la curva di tonalità, l'abbagliamento e le soglie di visibilità, le nuvole, la foschia, le popolazioni della galassia, gli anelli…); la convergenza delle griglie dei volumi, della riduzione, del salto del vuoto, della luce zodiacale, del rilievo; la ragnatela in moto (non torna); la prova su scheda grafica vera; uno strumento dichiarato accanto all'occhio (la lunga esposizione) | C12 |
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
   serbatoio, ed è una riga della tabella di coerenza. (Fatto: `src/camera/elementi.js`, `test_elementi`, 11 prove in ~10 s,
   e due righe di `test_coerenza_scale`. GALASSIA → STELLA: in `galassie.js` ogni serbatoio di metalli (il gas di ogni anello,
   l'alone caldo, il vento, le generazioni di stelle, i compagni) ha accanto i suoi sette CANALI — le supernove da collasso di
   quattro metallicità, le Ia, il carbonio e l'azoto delle giganti — che si muovono con lui: Σ canali = metalli entro 10⁻¹⁴; ogni
   canale ha la sua ricetta, elemento per elemento (Kobayashi et al. 2006, tab. 3, letta su arXiv: collasso e ipernove, e la W7;
   le rese nuove sono il totale meno l'ejecta per la composizione iniziale; le giganti da Karakas 2010, RICORDATE), con i tempi
   delle vite e dei ritardi delle Ia che la galassia usava già; le giganti ora danno anche C e N nuovi, che entrano in Z. Ogni
   stella del catalogo porta il passo e l'anello di nascita, e `miscelaDiNascita` dà la miscela del suo gas: in tutte le 57
   galassie con stelle abbastanza le nate nel primo terzo della storia sono più ricche di α (½[O/Fe]+½[Mg/Fe]) di quelle
   nell'ultimo terzo, o mai meno oltre 4 scarti; in tutto +0,09 dex (errore 7·10⁻⁴; il vero 0,2–0,3: le stelle si fanno
   presto e il gas che ricade porta i metalli vecchi); [Na/Fe] cresce con Z. DISCO → PIANETA: la miscela protosolare di Wang
   et al. 2019 (tab. 1, letta), o quella della stella; ogni elemento condensa alla sua temperatura del 50% (Lodders 2003,
   RICORDATE) con Clausius–Clapeyron e l'entropia di Trouton; il ferro si ossida nel gas freddo (Fe + H2O ⇌ FeO + H2, la
   tabella di `chimica.js`); la temperatura è la più alta tra la luce della stella e il gas che cade (la legge del bordo
   interno). Ogni pianeta somma la roccia degli embrioni di cui è fatto (chi è caduto su chi): i rocciosi nati sopra il
   T50 hanno Na 0,08, K 0,12, Cl 0,03, Zn e S 0 di quelli nati sotto. SEPARAZIONE: metallo e silicato all'equilibrio
   (log K_D = a + b/T + c·P/T; Ni, Co, V, Cr, Mn, Si, W, Mo, P; O con il suo K_D; D misurati per S, Cu, Zn, Ag, Sn, As,
   Pt, Au, C), a 3/5 della pressione del nucleo finale (la crescita) e a metà tra solidus e liquidus (Rubie et al. 2015;
   Andrault et al. 2011): fO2 esce dall'ossigeno conservato. Il nucleo è il «ferro» del pianeta (raggio, interno). CROSTA:
   fusione d'equilibrio del mantello con la frazione fusa media della storia di quel pianeta (`storia.js`), il basalto di oggi
   e i continenti di `tettonica.js` come seconda fusione: il fattore di K, U, Th è esattamente quello dei coefficienti.
   ARIA E MARE: `chimica.js` e `leggi.js` leggono mantello, crosta, ghiacci e zolfo del pianeta; `mare.js` scioglie la SUA
   crosta, e le tracce (Li, B, F, Br, I, Sr, U, Mo, Fe, Mn, P, Rb, Ba, Si) entrano dai fiumi e dai vulcani, escono sepolte, nel
   calcare o al limite di fluorite, celestina, apatite, uraninite, ruggine, rodocrosite (campo `tracce`, a parte da `totali`).
   IL LIBRO DEI CONTI: per ogni elemento nucleo, mantello, crosta, mare, aria, ghiacci, involucro; la somma è ciò che il disco
   ha dato (scarto 2·10⁻¹⁶ sul pianeta come la Terra con il suo mare, 7·10⁻¹⁵ su 69 pianeti) e nessuno è scoperto. Facendolo
   sono uscite quattro non-conservazioni vecchie, corrette: l'acqua dei ghiacci che contava anche il CO e l'NH3 (il mare aveva
   un terzo d'acqua di troppo), la colonna dell'aria con il carbonio come CO2 e lo zolfo come SO2 (e la massa dell'idrogeno
   fuggito data agli altri gas), il CO dei ghiacci che prendeva un ossigeno già dato all'acqua, lo zolfo e il carbonio dati
   all'aria da una roccia che non ne aveva. Il pianeta come la Terra (il primo del catalogo: stella 0,8–1,2 M☉ viva, roccioso
   di 0,5–2 masse terrestri, placche, mare): nucleo 0,373 della massa (Terra 0,325), FeO del mantello 8,6% (8,1), Si nel nucleo
   2,7% (5), crosta 0,8% (0,5). PERDITE DURANTE L'ACCRESCIMENTO (`perditeAccrescimento`): embrioni fusi
   dall'alluminio 26, urti giganti che fondono e tolgono aria e mare (Schlichting et al. 2015), fuga limitata dall'energia, gli
   alogeni un poco nel nucleo; ciò che parte va nello SPAZIO, un serbatoio del libro dei conti. Il pianeta come la Terra (5 urti
   tra 10 e 11,5 milioni di anni) perde il 75% del cloro (365 → 90 ppm nel mantello; Cl/Na 6·10⁻³ come la Terra), il 3,5%
   dell'acqua, del carbonio e dell'azoto, lo 0,3% di Na e K; i rocciosi senza urti giganti tengono tutto. NON TORNA, dichiarati:
   resta l'eccesso di tutti i moderatamente volatili (Na ×5,7 la Terra: il disco a 1 UA non supera ~570 K, la Terra vera li ha
   persi nel disco caldo) e il mare resta una salamoia (296 g/kg: con le argille nuove del fondo — `mare.js`, Mackenzie e Garrels —
   il sodio resta 1,9·10⁸ anni invece di 10⁹, contro ~7·10⁷ del mare vero; ma il cloro, 4,1 mol/kg, basta da solo). La fase calda
   provata con un disco viscoso α (Lynden-Bell e Pringle) non basta: a 0,67 UA parte da 756 K, sotto i 958 K del sodio, e la massa
   degli embrioni arriva tardi (m ∝ t³); con l'involucro che cade (Ṁ ~ c_s³/G) il disco interno è troppo caldo per la roccia
   mentre il modello vi fa gli embrioni in 6·10⁴ anni: serve rifare insieme la storia del disco e la crescita degli embrioni.
   Verificato: quei 6·10⁴ anni sono la crescita oligarchica di Kokubo e Ida (2012, eq. 4.8, letta: 1,3·10⁵ anni contro
   1,2·10⁵ di `disco.js`, stessi esponenti) per quel disco (fd·ε 1,3 e fg 1,9 a 0,67 UA): non è troppo veloce. E i planetesimi
   fusi dall'²⁶Al (Hin et al. 2017 [R]) non toglierebbero il sodio nemmeno con la crescita 7 volte più lenta (provato:
   t_iso 4·10⁵ anni, Na del mantello identico): l'evaporazione di `perditeAccrescimento` agisce solo a gas sparito (8,2 milioni
   di anni per quella stella), quando all'²⁶Al restano 2·10³ J/kg contro i 2,2·10⁶ che fondono la roccia; i ciottoli non sono
   nel modello. Gli urti giganti di quel pianeta (10,2–11,5 milioni di anni) vengono prima dei 30–100 del Hf-W della Terra
   [R] e dei ~10⁸ di Chambers 2001 [R]: NON TORNA, che però non tocca il sodio; [C/O] (−0,44
   dex) e [K/Fe] (−1,1) delle stelle sotto il Sole (le rese di Kobayashi ne fanno poco: per il potassio è un difetto noto); la crosta dei continenti ha K ×16 il mantello (vera ~60: la
   F media di `storia.js`, 0,3, è alta); Pt e Au restano poveri nel mantello (manca l'ultima vernice); oltre ~100 GPa le leggi di
   ripartizione sono estrapolate (le super-Terre fanno nuclei grandi, ricchi di silicio). Il costo di `sistema()`: vedi il
   rapporto del lavoro; `cosmo()` costa ~1,6 volte, per i canali dei metalli.)
9. **La finestra a ogni distanza** — cominciando dall'acqua: da lontano lo spettro delle onde dal vento; a metri il campo
   delle onde di quel tratto, la schiuma, la corrente; a centimetri increspature, bolle, granelli; a micron fiocchi di
   argilla; a nanometri l'acqua liquida con ogni specie disciolta nel suo numero. Poi la roccia, l'aria, il suolo.
   *Fatto quando:* a ogni distanza si vede ciò che c'è (mai un cristallo solo nel vuoto) e la finestra riassunta ridà il padre.
   (Fatto per l'acqua: `src/camera/finestra.js`, `test_finestre` (12 prove; ~38 s, di cui ~28 per costruire il pianeta con la sua circolazione) e
   9 righe nuove di `test_coerenza_scale`. Il padre è lo stato del mare in quel punto, letto solo dalle funzioni di mare.js
   (vento di meteo.js, Hs e periodo di campoOnde col tratto libero, corrente, temperatura, salinità, ioni, torbidità): chi
   cambia la chimica del bilancio dei sali cambia da sé ciò che si vede. Le grane non sono soglie: ogni popolazione si
   mostra dove la sua taglia sta tra un punto dell'immagine e il lato della finestra. DA LONTANO lo spettro di Elfouhaily e
   altri 1997 (la parte lunga con l'energia di campoOnde, la coda capillare dalla velocità d'attrito), la direzione di
   Mitsuyasu, la dispersione gravità-capillarità con la tensione superficiale di quell'acqua (IAPWS, Sharqawy) e la
   durata del vento contro il tratto (CEM): anche il 3D (pianeta.js) prende da lì le sue componenti, l'increspatura sotto lo
   schermo (prima 0,0012 a mano) e la schiuma (Monahan, riflettanza di Koepke; prima «creste × 30»), e riflette il cielo secondo la pendenza (prima la sua media: da sopra, le onde si vedevano solo per la schiuma a mano). A METRI E CENTIMETRI il
   campo delle onde di quel quadrato soltanto: ottave di tessere periodiche di Tessendorf sovrapposte a metà, ampiezze dagli
   eventi del tratto (due finestre sovrapposte: scarto 0 su 8364 punti), ogni onda con la sua ω e il Doppler della corrente;
   la varianza della banda di 1 m e di 1 cm è l'integrale dello spettro su quelle corone (entro 4 scarti su 24 finestre); la
   schiuma dove l'accelerazione delle onde lunghe di vento supera la soglia che dà W (⟨Y²⟩ = 1,0 ± 0,15); il riflesso della
   stella con Cox e Munk e il cielo di Rayleigh. Le BOLLE di Deane e Stokes sotto la schiuma (mediate sulla copertura sono
   quelle di mare.js, esatte; contate: 3702 contro 3680 ± 243), i GRANELLI e i FIOCCHI con le taglie di Stokes e la massa
   della torbidità (esatta), i gas delle bollicine dall'aria del pianeta; il plancton no (la vita non c'è, e lo si dice). A
   NANOMETRI l'acqua liquida fitta dal potenziale mW (`acqua_mw.js`, generata da `strumenti/acqua_mw.mjs` col Monte Carlo:
   −10,05 kcal/mol come Molinero e Moore, vicine entro 3,3 Å 4,3 come i raggi X) alla densità di quell'acqua, ogni ione
   Poisson sul volume CONDIZIONATO alla scatola neutra (campioniNeutri: rigetto esatto sullo ione perno, PTRS per le medie grandi;
   prima si aggiungeva sempre lo ione più abbondante del segno che mancava, e HCO₃⁻ era 554 contro 426 ± 83: ora 378 contro
   E[n | Q = 0] = 392 ± 83 in 100 scatole, TORNA; su 20 000 scatole finte le medie sono quelle della convoluzione): al posto del cristallo di sale su un reticolo cubico. I costi: la finestra si
   crea in 20–100 ms quando la si guarda, poi 10–25 ms per immagine, rifatta al più 20 volte al secondo. Non torna: la
   schiuma istantanea, il cielo senza diffusione multipla né nuvole (da sopra, senza riflesso della stella, le increspature
   si vedono appena), il guscio degli ioni con 4 vicine invece di 6, la stella della finestra a mezzogiorno dell'equinozio.)
   COME PASSERÀ ALLA ROCCIA, ALL'ARIA E AL SUOLO (la stessa struttura, non ancora fatta): (1) un PADRE letto dalle funzioni
   di chi lo calcola, mai copiato — per la roccia la tessera di geologia.js e il suo materiale (rocce.js, grani.js,
   materia.js), per l'aria la colonna di meteo.js e di pianeta.js (vento, umidità, nuvole, aerosol), per il suolo
   l'erosione e il deposito di geologia.js col clima; (2) per ogni grana una LEGGE STATISTICA del contenuto — il rilievo
   come spettro di potenza della quota (la rugosità frattale della tessera, condizionata alla media della madre), i grani
   della roccia dalla nascita e crescita dei cristalli (Johnson-Mehl di grani.js) e le fratture; nell'aria la turbolenza di
   Kolmogorov (E(k) ∝ ε^⅔·k^−5/3, con ε dal vento e dallo strato limite), le gocce e i cristalli di nube con la loro
   distribuzione dall'acqua liquida di meteo.js; nel suolo la granulometria (Sheldon o Rosin-Rammler dall'erosione), i pori
   e l'acqua che contengono; (3) le TESSERE e le CELLE con indirizzo nel tratto (la cella della griglia del padre): ottave
   sovrapposte a metà per i campi continui (quota, velocità del vento, umidità), celle di lato n^(−1/3) per le
   popolazioni (grani, gocce, aggregati), così che due finestre sovrapposte concordino; (4) le PROVE nella forma di
   test_finestre: sovrapposte uguali, la varianza della banda uguale all'integrale dello spettro (la quota della roccia, la
   velocità dell'aria), i conteggi di Poisson, la massa (la composizione modale della roccia, l'acqua liquida della nube, la
   porosità del suolo) — e la quota media della finestra di roccia che ridà la tessera, oggi una NON TORNA nota; (5) la
   VISTA: lo stesso livello 5 di mappa.js (rocciaDi), dove oggi la roccia è un'immagine fatta prima (cristallizza) e non un
   campione della finestra.)
   (Fatto per IL SUOLO E LA CROSTA: `src/camera/suolo.js`, `test_suolo` (9 prove; ~60 s, di cui ~40 per costruire il pianeta) e
   7 righe C6 di `test_coerenza_scale`. Il PADRE è la cella della tessera di livello 6 di geologia.js (quella che lo zoom mostra
   quando si entra nella roccia; nell'app la tessera più fine già calcolata, dal 3D la mappa intera) letta da chi la calcola: quota,
   pendenza, litologia, continente e portata (erosione), pioggia e deflusso del secchio di meteo.js, temperatura del clima, flusso
   di calore della storia termica, i minerali della crosta di quel pianeta (chimica.js), la CO₂ della sua aria. A METRI il
   RILIEVO FINE è uno spettro auto-affine sotto il numero d'onda della cella, P = C·k^(−2−2H)/(1 + (k·ℓ_c)²)²: H dalle pendenze
   della cella e della mappa intera (S ∝ r^(H−1)), C dalla pendenza della cella (la funzione di struttura alla lag della cella vale
   S²Δ²/2), ℓ_c = (K_d/(K·p^m))^(1/(2m+1)) dove i pendii pareggiano i fiumi (Perron e altri 2008 [R]); ottave di tessere periodiche
   sovrapposte a metà come il mare, un evento per tessera. Il SUOLO dal bilancio di Heimsath (P₀ di geologia.js, h₀ 0,5 m [R])
   con l'abbassamento della cella (K·A^m·S) meno K_d per la curvatura del rilievo fine lisciata sul suolo; le FRATTURE tracce a
   legge di potenza (n ∝ l^−3, Bonnet e altri 2001 [R]) dal grano alla cella, con l'apertura della frattura elastica lineare alla
   tenacità (Olson 2003 [R]: b ∝ √l). A MILLIMETRI i GRANELLI: i cristalli della roccia (rocce.js) consumati nel tempo che restano
   nel suolo con le velocità di chimica.js, e la caolinite che lasciano; il modello booleano con la porosità dell'impacchettamento
   (Desmond e Weeks 2014, Westman [R]); le taglie divise in ottave con le loro celle, così un granello è lo stesso in ogni finestra
   a qualunque distanza; sotto il punto, la nebbia dei granelli (Poisson per punto, Kubelka-Munk). LA ROCCIA DI QUEL PIANETA dà
   φ₀ e L di Athy senza tabelle per tipo: φ₀ = α_V·(T_fuso − T_superficie) (la contrazione termica dei suoi minerali, il fuso del
   basalto dal solidus di storia.js), le crepe che si chiudono sotto lo sforzo efficace della colonna con la gravità del pianeta
   (K_IC/√(πl/2)), L = ∫φ dz/φ₀; la permeabilità di Kozeny–Carman nel suolo e della legge cubica nelle crepe, k(z) = k₀(φ/φ₀)³;
   DARCY con la ricarica del deflusso del clima: la colonna fino a 10 km con la partizione di Dupuit tra gli strati (Vogel 1967
   generalizzato [R]) dà il TEMPO DI RESIDENZA τ(z) = ∫θ/q dz (al più l'età della crosta), e la sezione del versante (volumi finiti,
   gradienti coniugati, l'età dell'acqua sopravvento: Goode 1996 [R]) la verifica; la falda di Dupuit sul versante, i pori sopra
   pieni fin dove la capillarità li tiene o la ricarica lo chiede (Averjanov [R]); la temperatura col gradiente del pianeta. A
   MICRON E NANOMETRI l'ACQUA DEI PORI: la pioggia in equilibrio con la CO₂ dell'aria (aperta sopra la falda, chiusa sotto) che
   scioglie i minerali di quella roccia con le velocità di laboratorio di chimica.js e l'affinità 1 − Ω, nel tempo di residenza
   di quella profondità; caolinite, calcite e silice amorfa che precipitano; le costanti da una tabella sola (mare.js gibbsSpecie e
   chimica.js MOLECOLE, più la caolinite [R]); la scena dei nanometri: il reticolo del minerale e sopra l'acqua mW di finestra.js
   (scenaNano ora accetta un'acqua data) con ogni ione nel suo numero. REAZIONI.JS: i pori della crosta prendono φ₀, L e il tempo
   di residenza dalla colonna di suolo.js (colonnaDelPianeta, o quella del punto); ATHY e RESIDENZA (10⁴ anni, libero) non ci sono
   più; sul primo roccioso con calore il basalto ha φ₀ 0,026, L 8,1 km, l'acqua resta 117–1620 anni tra 0,3 e 3 km e l'H₂ va da
   1,7·10⁻⁵ a 5,2·10⁻⁴ mol/L (prima 10⁻⁴–10⁻²). L'APP (mappa.js): sulla terra il livello 5 comincia con le finestre del suolo di
   10 m, 1 m, 10 cm, 1 cm, 1 mm, 100 µm e 10 µm (LATI_SUOLO, di dieci in dieci come l'acqua), con la riga di ciò che c'è e i numeri
   (nella più piccola anche la chimica dei pori: luogoDellaCrosta a quella profondità col pH e il carbonio di quell'acqua); sotto
   l'ultima si continua nella scala sola della roccia dal primo livello più piccolo di lei (il reticolo di 30 nm e gli atomi del
   granello che sta nel punto guardato, granoNelPunto; in un poro il minerale più abbondante), fino alla scena 3D dei pori. Lo zoom è
   continuo (test_vista F: a ogni passo i pixel per metro crescono del passo esatto, scarto 2·10⁻¹⁶ su 200 passi, giù e su); la roccia
   grande (4 cm) e il cristallo con la sua memoria non sono più sulla via dello zoom dove c'è il suolo. IL 3D (pianeta.js): a pochi
   metri, nelle pezze sotto l'occhio, la finestra del suolo di quel punto (20 m in 256 punti, la griglia della finestra di 10 m del
   livello 5; 200 m fino allo schermo largo 200 m), col padre nella tessera che il 3D disegna lì (tessere.worker.js ne manda i campi
   grezzi, suolo.js ricordaTessera li dà anche a mappa.js): il rilievo che il 3D mostra è quello del livello 5 nello stesso punto con
   scarto 0 su 16 384 punti; entra come luce (il gradiente esatto) e tinta del suolo riportata alla riflettanza della tessera, non
   sposta i vertici (dichiarato). Costi: 108–122 ms per fotogramma senza e 116–118 con (schermo largo 150 m), 201–212 senza e 198–204 con (12 m),
   grafica simulata, due misure: nel rumore; la finestra 255–357 ms più 70–162 ms la tinta, fuori dal fotogramma, quando ci si sposta di un quarto di finestra. Sul
   punto della prova ℓ_c = 240 m liscia il rilievo sotto la cella: 2 µm rms, non si vede; si vede la tinta. PROVE: finestre sovrapposte scarto 0 (8181 punti
   del rilievo, 50 granelli); la varianza del rilievo fine su 256 punti ridà Σs dei modi entro 4 scarti e Σs ridà ∫P sotto la cella
   entro la quadratura; la porosità dei primi 10 m di 64 finestre ridà quella del padre (che la media sull'insieme delle curvature)
   entro 4 scarti; la sezione del versante manda nel fiume la ricarica × ℓ entro il residuo del risolutore (10⁻¹⁴ relativo) e
   l'età di ciò che esce è il volume dei pori diviso la ricarica (Eriksson) entro il limite rigoroso; il libro degli atomi
   dell'acqua dei pori torna a 10⁻¹⁶ per ogni elemento e per la carica (trovato facendolo: l'acqua che la calcite si porta via
   mancava). COSTI: il padre ~4 s la prima volta (le sei tessere), poi 75 ms; una finestra 3–60 ms e la sua immagine 70–190 ms; la
   sezione 70 ms; l'acqua dei pori 10 ms; la scena 3D 90 ms. NON TORNA: φ₀ e L contro la Terra per tipo [R] (granito 0,021 e
   0,86 km contro 0,02 e 2 km; basalto 0,026 e 8,1 km contro 0,10 e 1 km: mancano vescicole e brecce, le crepe del grano fine si
   chiudono solo a ~100 MPa); la colonna di Dupuit (il sistema regionale) manda in profondità ~13 volte più acqua del versante da
   solo; le attività sono le concentrazioni; le velocità di laboratorio (in natura 10–1000 volte più lente); le argille impaccano
   come sfere; niente argille di magnesio, niente vescicole; la compattazione dei sedimenti non ha una legge sua; nelle tessere di
   geologia.js le conche diventano laghi (al primo livello resta asciutto il 9% delle terre) e lì il suolo non c'è. MANCA: la vita
   (respirazione, radici: la CO₂ dei pori cento volte più alta); il rilievo fine del 3D come geometria (oggi è luce); la tinta del
   livello 5 (immagineSuolo, chiara) e quella del 3D (la riflettanza della carta) non combaciano in assoluto; i
   sistemi di flusso regionali dalla mappa; la roccia come finestra (cristallizza resta un'immagine fatta prima).)
10. **La chimica che si muove da sé** (era «la vita in potenza») — la regola zero applicata alla chimica del pianeta, con
   la rilevazione di ciò che emerge e la stima degli eventi rari; da qui i momenti d'osservatore. Base:
   `reports/Regole per la vita in potenza.md`, riletta come elenco di prove, non di passi. (Fatto il primo passo:
   `src/camera/reazioni.js`, `test_reazioni` (12 prove in ~8 s) e una riga di `test_coerenza_scale`. STATI: le specie di un
   luogo dalla scala sopra — il campione di mare.js (lo stesso padre della finestra a nanometri), la resa prebiotica dell'aria,
   le pozze e i camini di mare.js, i pori della crosta —, ognuna Poisson nel volume. LA RETE non è un elenco: è quella delle
   regole di molecole_reazioni.js (addizioni e aldoliche del formosio, cianidrine e Strecker, condensazione e idrolisi,
   tautomerie), pigra, potata dal flusso; le reazioni trovate da due regole sono una sola. ENERGIE: una tabella sola
   (molecole_energia, trasformata rispetto all'acqua); k₋ dal BILANCIO DETTAGLIATO, k₊/k₋ = e^(−Δg), scarto 2·10⁻¹⁶ su 695
   reazioni del formosio. GILLESPIE con due eventi del luogo («…/chimica/quando», «…/quale», c.serie; leggi esponenziale e
   discreta dichiarate): stessa storia al bit per lo stesso indirizzo, i tiri annotati con conRegistro; le reazioni 1 ⇌ 1 più
   veloci della risoluzione in insiemi all'equilibrio (SSA a scala lenta, pesi di Boltzmann); 1,3·10⁵ eventi/s sul formosio
   intero (882 canali), 2,7·10⁶ su una rete piccola. IL TEMPO GUARDATO: le reazioni che si muovono in τ (κ·τ ≥ 1 all'equilibrio
   vincolato), le altre ferme e la loro stechiometria una conservazione in più; l'equilibrio è il minimo di G con lo spazio
   nullo sinistro della matrice stechiometrica (sul formosio ridà equilibrioRete). PROVE: atomi e carica esatti (chiuso, e col
   bordo entrate − uscite); senza flussi la scatola di Strecker (Ω = 10⁴) rilassa alla media ESATTA della stazionaria di
   Anderson, Craciun e Kurtz (23,182 ± 0,093 contro 23,194; Gibbs 23,361: l'ordine Ω⁰ è 0,17 molecole) e produce entropia
   −0,002 ± 0,040 k_B/s; con formaldeide e ammoniaca tenute e l'emiamminale portato via 1020 ± 4,5 k_B/s (serbatoi
   all'equilibrio: −0,005 ± 0,048); cicli di bagnato e secco (attività 1 e 0,3, fasi di 0,5 s): 42 ± 0,8 k_B/s. RILEVAZIONE:
   massimo RAF di Hordijk e Steel (un caso con la risposta nota), con la catalisi da regole (cicli stechiometrici di Blokhuis,
   Brønsted, ioni e minerali); il formosio col seme ha il ciclo di Breslow ed è un RAF di ciò che la rete fa (2 HCHO →
   glicolaldeide catalizzata dai membri), la sola formaldeide no; membrane (anfifiliche sopra la CMC), polimeri che si copiano
   (catalisiDa), forward flux sampling (contro il tempo di primo passaggio esatto di una nascita-e-morte: 3,9·10⁻⁵ contro
   5,0·10⁻⁵ 1/s, errore 31%). DOVE SI È GUARDATO: nel primo mare con il vento, una finestra di 1 µm è un bagno (si rinnova in
   0,17 ms) dove accadono ~24 reazioni al secondo (formaldeide e HCN a 10⁻⁹ mol/L) e nasce in media due millesimi di molecola:
   niente RAF, niente membrane; a 10 nm niente si muove; la pozza ~44 al secondo; il camino (565 K, pH 3,5) 4·10¹⁰ al secondo
   (a quella temperatura tutto è veloce: la finestra si guarda per mezzo microsecondo); nei pori della crosta del primo roccioso con calore (stella 2, 5,8 mW/m², 1,4 K/km) l'H₂
   della serpentinizzazione (10⁻⁴–10⁻² mol/L tra 0,3 e 3 km con la residenza libera di 10⁴ anni; ora, con la colonna di suolo.js,
   1,7·10⁻⁵–5,2·10⁻⁴ mol/L e l'acqua che resta 117–1620 anni) col CO₂ sulla magnetite fa formiato, metandiolo, CO e
   formaldeide, niente di più grande. L'APP: dal micron in giù la finestra del mare ha la sua riga (mappa.js; 15–120 ms).
   NON TORNA dichiarati: quattro condensazioni con un ΔG misurato diverso dalla tabella (vale la tabella); la sola formaldeide
   non fa il primo C–C (manca la via lenta dell'induzione: probabilità zero per le regole); il potassio della crosta non è un
   numero in elementi.js oggi (la radiolisi non lo conta). MANCA: la rete dei radicali (la fotolisi della luce UV c'è come
   velocità, non come dinamica); due scatole con pH diversi come luogo solo (il camino alcalino contro il mare); i pozzi
   misurati senza prodotti (fuori dalla dinamica chiusa: 78 nel formosio); (fatte col suolo, punto 9: la porosità di Athy con
   φ₀ e L della roccia del pianeta e la residenza dell'acqua nei pori dalla colonna di Darcy); la pressione dei pori
   nelle energie; il calore prodotto nella crosta nel gradiente; le pozze che concentrano le molecole non volatili; la
   probabilità degli eventi rari sulla chimica vera (l'FFS è provato su un caso esatto, non ancora applicato a un RAF che nasce).)
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
