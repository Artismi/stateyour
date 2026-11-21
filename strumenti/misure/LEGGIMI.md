# Strumenti di misura

Gli strumenti servono a sostituire l'occhio con dei numeri. Ogni giro di correzioni dell'app si misura con questi numeri,
che devono scendere. Gli strumenti non correggono niente. Le soglie sono scritte una volta sola, con la loro ragione, nei
file (`SOGLIE` in `analisi.mjs`, `SOGLIA` in `padri.mjs`, il blocco iniziale di `numeri.mjs`). Non si toccano dopo aver
visto i risultati. Se una soglia si rivela sbagliata, si cambia `SOGLIE.versione` e lo si scrive qui, così i numeri vecchi
e quelli nuovi non si mescolano.

Nessuno strumento tocca l'app. Il segnale «pronto» del giro si ricava da quello che l'app espone già
(`window.__camera`, `statoFinestre` di `mappa.js`, le statistiche del pianeta), più la stabilità dell'immagine.

## 1. `npm run giro` e `npm run giro:rapido`: il giro dello zoom

Lo script `giro.mjs` usa Playwright con Chromium e la grafica emulata (swiftshader).

- **La strada.** Si apre l'app sull'indirizzo d'avvio (numero 217, laboratorio.js AVVIO). Si esce con la rotella al centro fino in cima, nel
  cosmo (la «salita», senza foto). Poi, per ogni indirizzo, ci si gira verso la sua galassia e si scende fino in fondo
  (l'«andata»). Il cursore sta sulla cosa del livello successivo dell'indirizzo: la galassia, poi la stella, poi il
  pianeta, come farebbe chi la cerca. Sul pianeta il cursore si ferma su un punto e resta lì: il centro del pianeta, oppure,
  per «terre», il punto di terra circondato da terra più vicino. Dal fondo si risale (il «ritorno»), con il cursore dove
  stava all'andata alla stessa scala.
- **La riserva.** Nel 3D a volte la meta dell'indirizzo sparisce dallo schermo, per esempio una stella troppo debole per
  essere un bersaglio, oppure lo zoom non avanza più. In quel caso si vola all'indirizzo con «vai a» dell'app e si
  riprende la discesa. Il fotogramma dopo il volo è segnato `volo` e non ha salto. Nel log la riga è «volo con «vai a»».
- **I tre indirizzi** sono in `indirizzi.json`, scritti da `node strumenti/misure/indirizzi.mjs`. Il criterio è nel file:
  l'avvio; poi, tra i primi 12 pianeti rocciosi con acqua liquida del cosmo 1 in ordine di indirizzo, quello con più terre
  emerse («terre») e quello con meno («acqua»).
- **Un fotogramma** si prende ogni quarto di decade della larghezza dello schermo; nel modo rapido, ogni mezza decade. Lo
  si prende quando la vista è pronta: nessuna dissolvenza, nessuna finestra in coda, nessun gesto o volo, nessuna tessera
  in attesa, e due catture di fila quasi uguali. Se la vista non è pronta entro l'attesa massima (15 s, oppure 6 s nel
  modo rapido), la foto si prende lo stesso e si segna «NON PRONTO», con il motivo.
- **Il modo rapido** fa solo l'avvio, a mezza decade, con lo schermo di 480×300. Il giro completo fa i tre indirizzi, a
  un quarto di decade, con lo schermo di 800×500. Opzioni: `--uscita`, `--indirizzi avvio,terre`, `--passo`, `--attesa`,
  `--W`, `--H`.
- **Le uscite** vanno in `strumenti/misure/esiti/rapido` o `esiti/completo`. La cartella è ignorata da git; la base sta in
  `base/`. Si producono:
  - `giro.json`, con tutto;
  - `riassunto.md` e `riassunto.json`, con i numeri complessivi;
  - `provini.html`, il foglio di provini: una riga per tratto e, per ogni fotogramma, la foto con gli indicatori a colori;
  - `foto/*.jpg`, a 240×150.

  Si rifà il foglio da un `giro.json` con `node strumenti/misure/provini.mjs <cartella>`.

### Come si leggono gli indicatori

Ogni indicatore è nel provino, con un colore: verde sotto metà soglia, giallo tra metà soglia e soglia, rosso oltre.

| indicatore | che cosa misura | quando è rosso |
|---|---|---|
| scala | la larghezza dello schermo in metri e lo stato della vista (3D, mappa, livello 5, atomi…) | – |
| luminanza, L* | la luminanza relativa media e il L* medio | – (si legge l'andamento) |
| vuota | la frazione di blocchi 8×8 quasi neri (L* < 3) o quasi uniformi (σ L* < 0,6) | fotogramma «vuoto» se ≥ 95 % |
| dettaglio | il valore efficace del laplaciano di L*: l'energia ad alta frequenza | – (cala dove la scala è piatta) |
| salto | il fotogramma prima, ingrandito del fattore di zoom attorno al cursore e confrontato col nuovo (sfocati di 3×3 a 240×150): la frazione della zona comune con ΔE76 > 15 | > 20 % |
| fattore vero | il fattore d'ingrandimento che allinea meglio i due fotogrammi, accanto a quello dichiarato dalla scala | (nel riassunto: quanti differiscono di più di un'ottava) |
| macchie | le aree connesse di pixel saturi (tre canali ≥ 250) | area ≥ 0,5 % dello schermo |
| barre | le rette dritte, a ogni angolo, di pixel quasi uguali (σ L* < 1,5) con i due lati diversi da loro | almeno una |
| A/R | l'andata contro il ritorno alla stessa scala (entro mezzo passo), con la stessa misura del salto | > 20 % |

Avvertenze:

- Nel 3D lo zoom va verso un punto con la prospettiva, quindi l'ingrandimento non è perfetto. Per questo il salto cerca il
  fattore migliore tra metà e il doppio di quello dichiarato.
- Tra andata e ritorno passa del tempo anche nel mondo: i pianeti girano, le nuvole si muovono. Una parte della differenza
  A/R è legittima. Conta il confronto tra un giro e il successivo, non lo zero.
- Un fotogramma «NON PRONTO» per «immagine non ferma» viene da una vista che non smette di cambiare (accumulo nel tempo,
  adattamento dell'occhio, animazioni). Va letto insieme al salto del fotogramma dopo.

## 2. `npm run padri`: padre e figlio

Lo script `padri.mjs` gira in Node, senza browser. Per ogni campo generato per livelli e per ogni coppia di livelli
misura, sulle celle del padre coperte dal figlio:

- la **deriva**, cioè la media del figlio sulla cella del padre meno il padre;
- il **valore efficace** dello scarto, anche diviso per la deviazione del padre (su tutta la tessera o la finestra madre);
- il **rapporto delle varianze**: quella del figlio riassunto sulle celle del padre contro quella del padre. Vale 1 se alla
  grana del padre le forme sono le stesse. Per informazione c'è anche il rapporto con la varianza del figlio intero.

I campi misurati:

- il rilievo delle tessere (`geologia.js tessera`) da L0 a L6, in tre punti del pianeta «terre»: la costa, la vetta e
  l'abisso;
- il colore delle tessere, cioè la riflettanza «terra» di `tessere.worker.js`, fatto girare in Node: la riflettanza verde
  in luce lineare e il ΔE76 del colore riassunto;
- il suolo (`suolo.js finestraSuolo`, la quota fine Z), su finestre di lato da 1 km a 1 cm, di dieci in dieci;
- l'acqua (`finestra.js finestraAcqua` e `ondeFinestra`), su finestre da 1 km a 10 cm nel primo mare col vento del
  catalogo;
- la luce della galassia d'avvio vista da lontano (`spazio3d.js scenaGalassia`, `daLontano.luminosita`) contro la somma
  delle stelle del campione per il loro peso.

Una riga viene segnalata, come guida e senza fermare niente, quando:

- lo scarto efficace supera il 10 % della deviazione del padre;
- le varianze riassunte escono da [0,8; 1,25];
- il ΔE supera 5;
- la luce differisce di più del 25 %.

Lo script non è nello script `test`. `--rapido` fa un solo punto, fino a L4. Le uscite sono `padri.json` e `padri.md`.

## 3. `npm run numeri`: i numeri messi a mano

Lo script `numeri.mjs` fa una scansione statica di `src/`, escluso `src/pattern/`, con un lessico JavaScript minimo che
salta commenti, stringhe, modelli e espressioni regolari.

**Esclusi come banali**:

- 0, 1, 2 e 0,5;
- le potenze di dieci esatte;
- gli interi negli indici e nelle dimensioni degli array;
- i numeri dopo un operatore di bit e gli esadecimali;
- i colori dell'interfaccia in `src/visore/`.

**Classi**:

- **fonte**: un autore con l'anno, «Fonte», un link, un DOI o arXiv, un catalogo, `grandezze.js` o le tabelle, sulla
  stessa riga o nelle tre sopra. In una tabella si guardano anche le righe sopra l'inizio della lista.
- **unità**: un'unità nel commento della riga, o nel nome a cui il numero è assegnato.
- **niente**: né fonte né unità.

I numeri delle tabelle generate da un programma, come `stelle_tabella.js`, sono contati a parte e non entrano nel
registro.

**Già noti**: i numeri già presenti in `grandezze.js` (`NUMERI_CON_FONTE`, `SOGLIE`) e quelli alle righe citate (±2) in
`reports/Scelte a mano nella vista.md`.

Le uscite sono `numeri.csv`, il registro numero per numero, e `numeri.md`, con i conteggi per file e il totale.

La classificazione è grezza e serve da registro, non da giudizio. Sbaglia in due modi: un commento lontano non conta,
e un anno qualunque vicino a un nome conta come fonte.

## 4. La misura di base (`base/`)

La misura di base è stata fatta sullo stato del ramo `claude/nice-galileo-diiwk4` del 21 novembre 2026 (commit
f7a66ad).

- **`base/giro_rapido/`**: il giro rapido sull'avvio, in 50 minuti, con `riassunto.md`, `provini.html`, `giro.json` e
  222 foto. Il giro completo, con tre indirizzi a un quarto di decade, qui richiederebbe circa 6 ore con la grafica
  emulata: non è stato fatto.

  All'andata la stella d'avvio si è persa a 1,1·10¹⁷ m e si è usata la riserva (il volo).

  In fondo, a 3·10⁻¹⁵ m, l'app salta a 1·10⁻⁸ m e poi alla vista «pattern» a 2,3·10⁻⁶ m. Al ritorno passa per
  «pattern» e «dettaglio» prima di rientrare nella materia. Anche questo è nelle misure.
- **`base/padri.md`** e **`base/padri.json`**:
  - nel pianeta «terre» le terre stanno a meno di 3 m dal mare, e alle tessere fini quelle celle risultano lago;
  - per questo il suolo è misurato alla vetta del pianeta «terre», con il padre al livello 0;
  - il colore delle tessere è uniforme in tutti e tre i punti, quindi lo scarto relativo non si può dire.
- **`base/numeri.md`** e **`base/numeri.csv`**.

Per confrontare un giro nuovo con la base:

```
npm run giro:rapido -- --uscita /tmp/giro_nuovo
diff strumenti/misure/base/giro_rapido/riassunto.md /tmp/giro_nuovo/riassunto.md
```

Per `padri` e `numeri` si confrontano i `.md` nello stesso modo.
