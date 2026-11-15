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

## Che cosa c'è e che cosa manca, strato per strato

| Strato | C'è | Manca | Condizioni |
|---|---|---|---|
| 1 Lingua | grammatica unica, andata e ritorno, HEALPix, peso per livello, punto a caso, impronta; una forma sola in tutto il programma, anche nei cosmi paralleli (lavoro 3) | — | C1 |
| 2 Caso | fonte unica, ordine indifferente; Threefry‑4×32‑20 con chiave a 128 bit (vettori noti Random123, SmallCrush e Crush di TestU01 passati); il registro annota la legge di ogni tiro (`bernoulli`, `discreta`, …) | i moduli che dichiarano la legge dei loro tiri (oggi quasi tutti leggono tiri nudi e pesano 1); BigCrush | C2, C3 |
| 3 Leggi | cosmo senza bordo; galassie, stelle, pianeti, storia termica, clima, erosione, mare, chimica, grani, atomi, scala quantistica; zoom senza salti; la coerenza tra le scale provata passaggio per passaggio, dal campo del cosmo ai quark (`test_coerenza_scale`: C6 su 15 passaggi, C8 misurata dove ci sono due grane; lavoro 5) | M (o μ) dove la tabella dice «manca»: il posto delle galassie vere, il sistema delle stelle vere, le regioni della magnetosfera, un'evoluzione a due grane sotto gli atomi; le incoerenze note della tabella (la quota media delle tessere, le celle non neutre di feldspati e biotite); un limite dal modello al difetto delle soglie di comodo (la gigante, il clima: oggi solo misurato); lo stato a un istante diverso da «adesso» sopra le particelle; la vita | C6, C7, C8, C14 |
| 4 Misura | indice del cosmo (Elias γ, libero), galassia per massa, stella per peso, pianeta per area, luogo per area, tempo sulla vita della stella | pesi degli esiti (in corso); dal campione al vero (in corso); fusioni (in corso); cervelli di Boltzmann contati (in corso); momenti d'osservatore (serve la vita) | C4, C5, C11, C13 |
| 5 Vista | trasporto di luce: aria, polvere, nebulose, buco nero, galassia e ragnatela come volumi, accumulo nel tempo; **l'occhio** come rivelatore (si adatta alla luminanza misurata nell'immagine, soglia assoluta, visione crepuscolare, adattamento al colore di CIECAM02); l'elenco delle scelte a mano (`reports/Scelte a mano nella vista.md`: 125 righe, 19 dal modello, 32 discretizzazioni, 74 a mano di cui 7 tolte); la convergenza dei passi dei volumi, dell'aria, delle tabelle del cielo e dell'accumulo (`test_vista`, lavoro 7) | le 67 scelte a mano rimaste (la curva di tonalità, l'abbagliamento e le soglie di visibilità, le nuvole, la foschia, le popolazioni della galassia, gli anelli…); la convergenza delle griglie dei volumi, della riduzione, del salto del vuoto, della luce zodiacale, del rilievo; la ragnatela in moto (non torna); la prova su scheda grafica vera; uno strumento dichiarato accanto all'occhio (la lunga esposizione) | C12 |
| Bolle | campo condizionato esatto, antenato comune nel punto e nel tempo; l'impronta di bordo (O11: armoniche dei campi sulla sfera, ℓmax dalla grana), l'incollamento sul bordo comune e la ricostruzione dal bordo, l'antenato tra luoghi e istanti diversi in tempo conforme (η_c), il cono di luce dei rami del campo (lavoro 6: `bordo.js`) | le impronte nel cosmo con le sue galassie (insieme in `vincola`); temperatura, campo magnetico e radianza sul bordo; Gauss e Dirichlet con i nuclei troncati; l'antenato di più di due eventi quando non lo sostiene una coppia; il cono di luce sopra il campo (i rami di stelle e pianeti hanno ancora solo il contenitore); le distanze tra contenuti («una stella a un metro da un fiocco di neve») | C9, C10, C15 |
| Passo | «pianeta parallelo», «ramo parallelo più pulito» | il nucleo P(a′\|a) nel tempo e di lato, con Chapman–Kolmogorov | C16 |

## L'ordine dei lavori

Due alla volta. Ogni lavoro finisce con una prova che verifica la sua condizione.

1. **Fondamenta del caso** — 128 bit, variante verificata, registro della legge di ogni tiro. *Fatto quando:* C2, C3,
   catena intera verde sul nuovo universo. (Fatto: 50 prove verdi a macchina ferma; registro delle leggi applicato e provato.)
2. **Misura** — pesi degli esiti, dal campione al vero, fusioni, prima stima dei cervelli di Boltzmann. *Fatto quando:*
   C4, C11, C13 provate; `puntoACaso` uniforme sulle stelle vere. (In corso.)
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
   vista.md` — 125 costanti che decidono l'aspetto, con riga, classe e che cosa servirebbe: 19 dal modello, 32
   discretizzazioni, 74 a mano; tolte 7: l'esposizione, che ora è L'OCCHIO di `nucleo.js` — si adatta alla luminanza media
   misurata nell'immagine, la porta al grigio L* = 50, non sotto la soglia assoluta di 10⁻⁶ cd/m², con le candele del corpo
   nero della stella, i colori che sfumano nella visione notturna (CIE 191, Larson 1997) e l'adattamento al colore di
   CIECAM02 al posto di «0,45 + 0,55·colore» in due file —, i colori dei batuffoli, il terminatore, la luce di notte, il bordo
   della stella (Eddington). `test_vista` (`npm run vista`, a parte: vuole Chromium; ~60 s, 10 prove): ΔE*ab = 2,3 dichiarata
   (Mahy e altri 1994) sull'immagine dello schermo, ε = 5,9% per gli scarti di luce; passi della galassia da fuori e da dentro
   (ordine 1,8 e 2,1; a 24 passi ΔE 0,5 e 1,8), accumulo (ordine 0,5 nei fotogrammi; a storia piena ΔE 0,4), aria (ordine 2;
   24 passi ΔE 1,3), tabelle del cielo (ordini 1,6–2, l'app entro 1,3%), ragnatela a camera ferma (ΔE 2,2). Corretti nel
   farla: l'aria e le tabelle del cielo non convergevano su un'aria spessa (trasparenza a metà tratto, passi uniformi: ΔE 35 a
   12 passi; ora tratti sommati in modo esatto e fitti vicino all'occhio, e 24 passi); IL 3D NERO del punto a caso — un
   errore vero: le immagini dell'aria a camera ferma create sull'unità che il programma leggeva, il disegno rifiutato, l'aria
   nera finché non ci si muoveva —, e dopo, il suolo sotto una nana bianca a 27 UA che l'esposizione di prima lasciava 10
   volte sotto. Non torna: la ragnatela in moto (ΔE 7,7, dichiarato). Manca: la scheda vera, le griglie dei volumi, le 67
   scelte rimaste.)
8. **La vita in potenza** — la scala che manca; da qui i momenti d'osservatore e la misura del tempo per esperienza.
   Si progetta a parte, partendo da `reports/Regole per la vita in potenza.md`.

## Come si usa, alla fine

- **Scrivo un indirizzo** → il programma apre quel mondo in quel punto, a quella scala.
- **Chiedo un punto a caso** → scende l'albero con la misura e mi dice anche quanto è speciale (bit).
- **Descrivo che cosa voglio trovare** («un pianeta con acqua liquida») → la bolla cerca gli indirizzi compatibili
  e me li dà con il loro peso.
- **Mi muovo** → con la rotella nella scala, con il passo nel tempo o verso i rami vicini.
- **Guardo** → ciò che vedo è luce calcolata, o la misura di uno strumento dove la luce non c'è, e lo dice.
