# Il generatore di pattern

Un progetto a parte, staccato dall'app dell'universo (che ora finisce alla scala quantistica) per essere ripreso più
avanti. Qui c'è tutto ciò che fa i pattern: la camera dei pattern (il pattern come sezione di un universo possibile, la
finestra, l'elemento con le sue cinque forze, lo spaziotempo, la biblioteca e la ricerca di una sezione bella, la
lettura di un'immagine), e le pagine delle fasi precedenti (lo studio, la decodifica, lo spaziotempo, le piastrelle,
il motore). La descrizione completa sta in [PATTERN.md](PATTERN.md).

## Avvio

Il pattern usa i moduli dell'universo da `../src` (`mondo.js`, `biblioteca.js`, `sezione.js`, `cosmo.js`, `mappa.js`,
`src/tre/…`): va servito dalla cartella del repository, non da questa.

```bash
cd pattern
npm start          # serve la cartella del repository su http://localhost:8001
```

poi apri `http://localhost:8001/pattern/` (la camera dei pattern: si parte dal pattern dell'universo n. 15853643; «il
cosmo» porta nell'universo da cui viene la finestra). Le altre pagine: `pattern/studio.html`, `pattern/decodifica.html`,
`pattern/spaziotempo.html`, `pattern/piastrelle.html`, `pattern/motore.html`.

## Prove

```bash
cd pattern
npm test
```

Le prove (node, senza dipendenze) stanno in `test/`; quelle che leggono la tavola greca usano `esempi/greco_6.png` e
`strumenti/png.mjs`.

## Che cosa sta dove

```
index.html, src/camera/laboratorio.js   la camera dei pattern (una copia di quella che era l'app, che parte dal pattern)
src/camera/pattern.js     il caleidoscopio: il motivo ripetuto dai gruppi di simmetria
src/camera/esperimento.js le celle di prova e le composizioni
src/camera/cercatore.js   la ricerca di una sezione bella (un Worker); vicini.js i rami paralleli più puliti
src/camera/lettore.js     la lettura di un'immagine (un Worker); inversa.js l'immagine ritrovata come pagina della biblioteca
src/                      il motore, la catena, la grammatica, il seme, la decodifica, la lingua, lo studio, le piastrelle
test/, esempi/, strumenti/  le prove, la tavola greca, il lettore PNG e la decodifica da riga di comando
```

Restano nell'universo, perché li usa anche lui: `src/camera/mondo.js` (le leggi delle particelle nella cella),
`src/camera/sezione.js` (la sezione e la sua bellezza), `src/camera/biblioteca.js` (un numero → una regione del cosmo),
`src/camera/eventi.js` e tutto il modello del cosmo.
