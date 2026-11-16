# Cristallo

Una pallina corre dentro un cristallo e lascia una linea; il cristallo ripete la sua cella, e la linea diventa un
motivo. Si guarda da una finestra tangente a una sfera, in prospettiva. La specifica è [PROGETTO.md](PROGETTO.md).

## Come si apre

```
cd cristallo
node servi.mjs          # poi http://localhost:8123
```

Serve un server qualunque (il worker è un modulo ES e non parte da `file://`), nessuna dipendenza, nessuna costruzione.
Un indirizzo dopo `#` nell'URL apre quel pattern.

## Che cosa fa («Costruisci»)

- 🧊 i 7 sistemi cristallini come piccole forme; un secondo tocco cambia la centratura (i 14 reticoli di Bravais).
  Nel cubetto si tocca un posto: vuoto → collina ▲ → conca ▼ → vuoto.
- Trascinando una freccia sul disegno si lancia la pallina (la lunghezza è la velocità).
- ⚪ ↔ ✴️ la sorgente simmetrica (da Lewis F. Day, «Pattern Design», 1903: ribaltamento e rotazione): il punto
  toccato scatta sul sito simmetrico più vicino, e da lì partono le palline nelle direzioni equivalenti per il gruppo
  del sito, trovato numericamente dal reticolo e dagli atomi (`src/simmetria.js`).
- ⭕ le linee chiuse: il catalogo delle orbite periodiche del cristallo (nel piano) a quell'energia, trovate col tiro
  di Newton (`src/orbite.js`); un tocco ne sceglie una o più, disegnate una volta a spessore costante e ripetute dal
  reticolo (con ✴️ anche le sorelle per simmetria). 🎨 il controcampo di Day: le regioni tra le linee a scacchi.
- 🦴 lo scheletro: la griglia del reticolo in trasparenza, in prospettiva coi suoi punti di fuga, nel limite parallelo
  la griglia del piano (hkl).
- 🧲 il magnete (lungo la direzione da cui si guarda), 🐢/🐇 la velocità, ❄️/🔥 la temperatura.
- 🌐 il globo: si gira col dito, scatta sui piani semplici; accanto, il cubetto con la finestra dentro e la manopola
  🚇/🖼️ della distanza R (da dentro il cristallo alla carta da parati, R = ∞).
- 🧩/🔍 tessera ripetuta o viaggio vero; 🎲 un pattern a caso (anche il reticolo); ↩ ↪; ⓘ i numeri, le leggi e
  l'indirizzo, per i grandi.
- Sotto il disegno, la zona pulita: «si ripete bene per N celle».

Il calcolo e il disegno stanno in un Web Worker (OffscreenCanvas). La linea cresce finché l'immagine non è piena
(un limite dichiarato di «inchiostro», in `src/ui/lavoratore.js`).

## Il codice

`src/caso.js` la fonte del caso con indirizzo (Threefry-4x32-20) · `src/reticolo.js` reticoli, atomi, potenziale ·
`src/moto.js` Verlet, Boris, viaggio, tessera · `src/finestra.js` prospettiva, limite parallelo, lastra, tagli esatti,
copie · `src/indici.js` (hkl), reticolo del piano, frasi · `src/motore.js` passo per convergenza, zona pulita, Lyapunov ·
`src/indirizzo.js` indirizzo testuale e 🎲 · `src/ui/` l'interfaccia.

## Prove

`npm test` (circa mezzo minuto): caso, reticoli (vincoli e simmetria in {1, 2, 3, 4, 6}), moto (energia, Boris,
cerchi, convergenza, determinismo), finestra (asse e R, tagli, periodo (hkl) nel limite parallelo, direzioni
irrazionali, 🎲 uniforme, punti di fuga), pattern attesi (canale, intreccio, fiori, rosette e salti), zona pulita, sorgente simmetrica (gruppo del sito e
invarianza del disegno entro l'aritmetica). `node prove/sorgente.cjs '<lista json di indirizzi>'` rifà le schermate 10 e 11.
`node prove/schermate.cjs` prova l'interfaccia in Chromium e rifà le schermate in `prove/schermate/`.

## Ricerca di motivi simili a delle tavole

`node strumenti/cerca_orbite.mjs <riferimenti> <uscita> [minuti]` cerca tra le orbite periodiche, con la distanza di
chamfer dopo l'allineamento di reticolo e scala (`strumenti/cerca_riferimenti.mjs` è la prima prova, con lo spettro).
I motivi trovati per le tavole di L. F. Day sono in `prove/day/` (le tavole no).

## Da fare

- La prova della simmetria sulla finestra (`npm run simmetria`) è statistica e lenta: con corse corte il rumore supera
  la soglia; va finita con corse lunghe (o una misura più svelta) e rimessa in `npm test`.
- La sezione e la lastra ci sono nel cuore ma non nell'interfaccia; mancano L3, «Ritaglia», «Scopri» e la biblioteca,
  ❤️, 💾, i vettori SVG, lo zip per Windows.
- I difetti (atomi che mancano) ci sono nel cuore ma non hanno una manopola.
- Il 🎲 è solo casuale: non cerca ancora pattern «belli» con una misura.
