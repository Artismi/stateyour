# Passaggio di consegne: stateyour

Questa pagina serve a chi riprende il progetto da zero, persona o agente. Dice dove sta tutto, quali regole valgono e a che punto è il lavoro.

## Che cos'è
- **L'app.** È scritta in Electron e JavaScript e mostra un universo procedurale con zoom continuo dal cosmo alla scala quantistica. Lì lo zoom finisce.
- **Le scale attraversate.** Cosmo, ragnatela, galassie, stelle, dischi e pianeti; poi interno, crosta, clima, mare, suolo e pori; poi grani, molecole e atomi; infine i quanti.
- **Come è calcolata.** Solo dove si guarda, e in modo deterministico per indirizzo: lo stesso indirizzo dà sempre lo stesso mondo.
- **Il principio.** Tutto deve emergere da leggi fisiche con fonte (autore e anno nel commento), senza numeri o regole messi a mano.
- **Lingua.** Testi, commenti e nomi sono in italiano.

## Dove sta
- **Repository:** `Artismi/stateyour`, ramo di lavoro `claude/nice-galileo-diiwk4`.
- **Il simulatore di pattern «Cristallo»,** messo da parte: ramo `claude/pattern-cristallo`.
- **Il generatore di pattern** è separato dall'app, nella cartella `pattern/`, con le sue prove e il suo `LEGGIMI.md`.

## Da leggere prima di tutto
1. `README.md`: che cosa fa l'app e come si avvia.
2. `PROGETTO_VISORE.md`: l'interfaccia, cioè il «visore B» in `src/visore/`.
3. `reports/Generatore multiscala più emergente e fluido.md`: il rapporto di nove gruppi di esperti, con le cinque regole comuni a tutte le scale e 25 azioni in ordine. È la guida tecnica principale.
4. `reports/Numeri a mano da togliere.md` (con il `.csv`): i numeri ancora messi a mano, i più influenti e il piano a gruppi per toglierli.
5. `lavori_in_sospeso/LEGGIMI.md`: i lavori iniziati e non applicati.
6. Gli altri rapporti in `reports/` e le note di ricerca in `research_notes/` sono materiale di approfondimento per scala.

## Le cinque regole comuni
1. Il figlio è il padre più una correzione a media nulla (`src/camera/eredita.js`: `ottava`, `discendi`).
2. Sopra il pixel si disegnano gli oggetti uno per uno, sotto il pixel resta il continuo, e il totale si conserva (`separa`, `pesoDiscreto`).
3. Per ciò che sta sotto il pixel si usano integrali in forma chiusa.
4. La vista è funzione pura di indirizzo e zoom.
5. Ogni fenomeno ha la sua serie di numeri casuali con un nome (`serie(indirizzo, nome)`, sul generatore Threefry di `eventi.js`).

## Come si prova
- **Prove veloci:** `npm test`.
- **Prove lente:** `npm run test:lenti` (gli anelli, circa 8 minuti).
- **La vista:** `npm run vista` (il 3D nel navigatore, circa 11 minuti con la grafica emulata).
- **Lanciare con il motore dell'app.** Tutto va lanciato con lo stesso motore JavaScript dell'app: `node strumenti/nodo.cjs …`; gli script di `package.json` lo fanno già. Il motore di node e quello di Electron differiscono nell'ultima cifra di alcune funzioni matematiche, e il clima amplifica lo scarto.
- **Gli strumenti di misura** stanno in `strumenti/misure/` (vedi `LEGGIMI.md` lì):
  - `npm run giro` e `npm run giro:rapido`: lo zoom scriptato, che conta vuoti, salti, macchie, barre e differenze tra andata e ritorno;
  - `npm run padri`: controlla che il figlio abbia la media del padre;
  - `npm run numeri`: conta i numeri senza fonte;
  - `sensibilita.mjs`: quanto ogni numero sposta i risultati.
- **Le regole di lavoro:**
  - mai allargare le soglie delle prove;
  - mai scegliere semi fortunati;
  - mai tarare numeri a mano.

  Le uniche eccezioni sono quelle decise esplicitamente dall'utente, e sono scritte nei commenti delle prove.

## Lo zip per Windows
- **Come si crea:** si crea un worktree della versione da pacchettizzare, poi si lancia `npx electron-builder --win zip --x64 -c.win.signAndEditExecutable=false`.
- **Dove esce:** in `dist/stateyour-0.1.0-win.zip`.
- **Cosa esclude:** `pattern/`, cioè il generatore di pattern.

## Il pianeta d'avvio
- **Il numero attuale:** 309721 (galassia 0, stella 1613, pianeta 2).
- **Il criterio,** scritto in `src/camera/laboratorio.js`: il primo pianeta roccioso di 0,5–2 masse terrestri con acqua liquida, aria tra 0,5 e 3 bar, terre tra il 20% e il 50%, temperatura media tra 0 e 25 °C, attorno a una stella tra 0,7 e 1,2 masse solari.
- **Quando va riscelto.** Un piccolo cambio a monte (galassie, disco, costanti) cambia quale pianeta sta a quell'indirizzo. Allora il numero va cercato di nuovo con lo stesso criterio.

## Lo stato (novembre 2026)
**Fatto in questo giro:**
- **Visore:** occhio umano, strumenti (amplificatore di luce L, falsi colori della temperatura K), schede per galassia e cosmo, pulsanti della finestra, tasto F.
- **Galassie:** niente più barra nera, polvere integrata esatta, ragnatela.
- **Mare:** senza piastrelle, con vortici e colore spettrale.
- **Terre:** rilievo dalla tettonica nel tempo e delaminazione.
- **Sali del mare:** corretti a monte.
- **Urti giganti:** modello di Kimura 2025.
- **Costanti:** CODATA a precisione piena.
- **Sistemi pigri:** i pianeti si calcolano solo quando si guardano.
- **Prove:** passano tutte e 45 col motore dell'app.

**Il giudizio dell'utente dopo la prova su Windows:** a tutte le scale restano artefatti e disturbi, problemi di messa a fuoco e modelli di qualità disomogenea; muoversi nel 3D è difficile; tornare indietro e poi avanti con lo zoom è difficile; la navigazione è labirintica.

**Lavori aperti, in ordine di importanza:**
1. **Navigazione reversibile alla Google Earth.** La rotella cambia solo la scala, verso il punto sotto il cursore, senza bersagli scelti dall'app; le stesse regole valgono in tutte le viste. È iniziata in `lavori_in_sospeso/navigazione/`.
2. **Nitidezza.** Pixel del dispositivo (ridimensionamento di Windows), risoluzione dei contenuti pari a quella dello schermo, filtri, scintillio, dissolvenze. È iniziata in `lavori_in_sospeso/nitidezza/`.
3. **Omogeneità della rappresentazione tra le scale.**
4. **Funzioni matematiche in JavaScript puro**, per avere gli stessi bit su ogni motore e su ogni versione.
5. **Acqua dei pianeti interni, ossidazione e super-Terre vicine:** in `lavori_in_sospeso/`, richiede fisica nuova.
6. **Mare e crosta della Terra di prova:** fiumi circa 8 volte poveri di sali, continenti circa 1,4 volte il vero.
7. **Ellittiche:** il centro è troppo ricco di metalli.
8. **Numeri a mano:** circa 5.600, da togliere a gruppi secondo il rapporto.
