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
| 2 Caso | fonte unica, ordine indifferente | 128 bit e variante verificata (in corso); il registro della legge di ogni tiro | C2, C3 |
| 3 Leggi | cosmo senza bordo; galassie, stelle, pianeti, storia termica, clima, erosione, mare, chimica, grani, atomi, scala quantistica; zoom senza salti; la coerenza tra le scale provata passaggio per passaggio, dal campo del cosmo ai quark (`test_coerenza_scale`: C6 su 15 passaggi, C8 misurata dove ci sono due grane; lavoro 5) | M (o μ) dove la tabella dice «manca»: il posto delle galassie vere, il sistema delle stelle vere, le regioni della magnetosfera, un'evoluzione a due grane sotto gli atomi; le incoerenze note della tabella (la quota media delle tessere, le celle non neutre di feldspati e biotite); un limite dal modello al difetto delle soglie di comodo (la gigante, il clima: oggi solo misurato); lo stato a un istante diverso da «adesso» sopra le particelle; la vita | C6, C7, C8, C14 |
| 4 Misura | indice del cosmo (Elias γ, libero), galassia per massa, stella per peso, pianeta per area, luogo per area, tempo sulla vita della stella | pesi degli esiti (in corso); dal campione al vero (in corso); fusioni (in corso); cervelli di Boltzmann contati (in corso); momenti d'osservatore (serve la vita) | C4, C5, C11, C13 |
| 5 Vista | trasporto di luce: aria, polvere, nebulose, buco nero, galassia e ragnatela come volumi, accumulo nel tempo | l'elenco delle scelte a mano rimaste; la prova di convergenza di ogni discretizzazione; la prova su scheda grafica vera | C12 |
| Bolle | campo condizionato esatto, antenato comune nel punto e nel tempo | la formula dell'antenato per luoghi e istanti diversi (η_c); l'impronta di bordo; la continuità al bordo | C9, C10, C15 |
| Passo | «pianeta parallelo», «ramo parallelo più pulito» | il nucleo P(a′\|a) nel tempo e di lato, con Chapman–Kolmogorov | C16 |

## L'ordine dei lavori

Due alla volta. Ogni lavoro finisce con una prova che verifica la sua condizione.

1. **Fondamenta del caso** — 128 bit, variante verificata, registro della legge di ogni tiro. *Fatto quando:* C2, C3,
   catena intera verde sul nuovo universo. (In corso.)
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
   comune; l'antenato comune per luoghi e istanti diversi. *Fatto quando:* C10 e C15.
7. **La vista come misura** — l'elenco delle scelte a mano nel motore, tolte o dichiarate; la prova di convergenza
   dell'immagine (C12); la prova su una scheda grafica vera.
8. **La vita in potenza** — la scala che manca; da qui i momenti d'osservatore e la misura del tempo per esperienza.
   Si progetta a parte, partendo da `reports/Regole per la vita in potenza.md`.

## Come si usa, alla fine

- **Scrivo un indirizzo** → il programma apre quel mondo in quel punto, a quella scala.
- **Chiedo un punto a caso** → scende l'albero con la misura e mi dice anche quanto è speciale (bit).
- **Descrivo che cosa voglio trovare** («un pianeta con acqua liquida») → la bolla cerca gli indirizzi compatibili
  e me li dà con il loro peso.
- **Mi muovo** → con la rotella nella scala, con il passo nel tempo o verso i rami vicini.
- **Guardo** → ciò che vedo è luce calcolata, o la misura di uno strumento dove la luce non c'è, e lo dice.
