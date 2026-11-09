# stateyour

Scomposizione e codifica dei pattern: la loro origine e la loro replica
tramite regole di generazione geometrica.

## Il modello

Una realtà 2D, il **piano di esistenza**, su cui si muovono **particelle**.
Ogni particella è un vettore: posizione, velocità (modulo e direzione), massa.
Il punto da cui viene emessa è il punto da cui inizia la linea. Da sola
prosegue in linea retta. La sua traiettoria può essere influenzata da due
altri piani, sovrapposti al primo:

| piano | elementi | effetto sulla linea |
|---|---|---|
| **gravitazionale** | masse puntiformi su una griglia 2D | la curva secondo la gravitazione; con una massa attiva alla volta la traiettoria è una conica esatta |
| **delle interfacce** | segmenti perpendicolari al piano, che separano due mezzi | la riflette (specchio), la rifrange (legge di Snell) o la assorbe (interrompe) |
| **dei campi** | regioni (cerchio o rettangolo) con una forza in più | **magnetico** (Lorentz): cerchio esatto di raggio v/ω; **attrito** (Stokes): rallenta; **magnetico + attrito**: spirale logaritmica esatta; **molla** (Hooke) verso una retta: sinusoide esatta |

Nessuna curva è disegnata per formula: ogni tratto è la traiettoria di una
particella sotto leggi fisiche. Il colore non fa parte del sistema.

Le masse vivono nel loro piano e non si influenzano tra loro: agiscono solo
sulla particella. Ogni elemento può essere **acceso o spento**, e la
particella stessa ha una **penna** che si può alzare. Le accensioni avvengono
tramite **regole a eventi geometrici**: la particella attraversa una linea,
tocca un'interfaccia, compie N passi.

Un pattern è quindi codificato come **partitura**: elementi, stato iniziale,
regole. La stessa partitura, rieseguita, ridà sempre lo stesso pattern.

## Cosa si può disegnare

- **Rette e spezzate**: particella libera; la rifrazione piega la retta di un
  angolo fisso a ogni interfaccia.
- **Simmetrie**: una camera di specchi ripete un solo raggio in un pattern
  intero (gruppi di fregio e di carta da parati).
- **Coniche**: una massa, velocità diverse all'emissione: cerchio, ellisse,
  parabola (velocità di fuga), iperbole.
- **Spline di coniche**: accendendo le masse a staffetta, una alla volta, la
  linea è una catena di archi di conica con tangente continua. Un arco di
  parabola è una Bézier quadratica: i contorni dei font TrueType sono
  raggiungibili in modo esatto.
- **Linee interrotte**: la penna si alza e si abbassa a passi, o al tocco.

- **Spirali**: campo magnetico più attrito. La velocità ruota a ritmo
  costante ω e cala come e^(−γt), quindi la traiettoria si avvolge attorno a
  un centro asintotico con r(θ) = r₀·e^(−(γ/ω)·θ). La voluta pompeiana e il
  ricciolo della nuvola cinese. L'evento di **distanza** da un punto la ferma
  esattamente al raggio voluto.
- **Sinusoidi**: molla verso un asse. Lungo l'asse il moto è uniforme, di
  traverso oscilla: lunghezza d'onda 2π·v/√k.
- **Spezzate e greche**: una sola retta piegata da specchietti posti ai
  vertici. Per girare da una direzione d a una d′ lo specchio ha la normale
  lungo d − d′: la chiave greca è un raggio tra specchi a 45°.

Il caos a più corpi compare solo se due o più masse sono accese **insieme**.
Con una massa alla volta tutto è esatto e riproducibile.

## Geometria esatta: dal disegno voluto ai parametri fisici

I tratti dell'alfabeto si chiedono in termini geometrici e il sistema ricava
da solo massa, velocità e regole di arresto:

| tratto | parametri | come nasce |
|---|---|---|
| `arcoCerchio` | r, da, a | orbita circolare, fermata sul raggio all'angolo `a` con verso, così l'arco può superare i 180° |
| `ellisse` | a, b | e = √(1 − b²/a²), massa nel fuoco, velocità all'apside, chiusa al rientro sull'asse |
| `poligono`, `stella` | n, r, k | una particella per lato dal vertice i al vertice i+k, ognuna con la propria regola d'arresto |
| `spirale` | r₀, rMin, giri | γ = −ω·ln(rMin/r₀)/(2π·giri), velocità iniziale e punto di partenza dal centro asintotico |
| `sinusoide` | λ, A, periodi | k = (2π·v/λ)², velocità trasversale A·√k |
| `spezzata`, `greca` | punti | uno specchio per vertice, assorbitore all'arrivo |

I test (`test/test_campi.mjs`) confrontano la spirale con la soluzione
analitica e controllano gli zeri e l'ampiezza della sinusoide.

## L'onda

Masse in fila sulla riga `y = y0`, accese a staffetta quando la particella
attraversa la riga. La particella attraversa la riga in un apside, cioè con la
velocità perpendicolare alla riga, quindi per la massa successiva è di nuovo in
un apside: parte una nuova mezza ellisse dall'altro lato, con tangente continua.

Con `L` la distanza tra due attraversamenti e `f` la distanza della massa
dall'attraversamento di sinistra:

```
semiasse maggiore   a = L / 2
ampiezza dell'onda  b = sqrt( f · (L − f) )
eccentricità        e = |L/2 − f| / (L/2)
velocità all'apside v² = G·M · ( 2/r − 2/L )     con r = f oppure L − f
```

Perché la velocità sia continua allo scambio, ci sono due modi:

1. **offset alternato** `f, L−f, f, …` e **masse tutte uguali**: a ogni
   scambio la particella dista `L−f` sia dalla massa che lascia sia da quella
   che prende. Le ellissi sono speculari, l'onda è simmetrica;
2. **offset costante** `f`: le masse devono scalare di
   `M(i+1) / M(i) = ( f / (L−f) )²` a ogni passo.

Con `f = L/2` le ellissi sono cerchi: l'onda è una catena di semicerchi. Il
test `test/test_onda.mjs` verifica che gli attraversamenti cadano in
`x0 + i·L`, che l'ampiezza sia `b` entro l'1 %, e che senza il rapporto delle
masse l'onda si rompa.

## La codifica

```json
{
  "nome": "…", "G": 1, "dt": 0.02, "passi": 20000, "limiti": [0, 0, 1000, 600],
  "emettitori": [{ "id": "p", "pos": [80, 300], "angolo": 90, "v": 31.6 }],
  "masse":      [{ "id": "m0", "pos": [120, 300], "M": 30000, "acceso": true }],
  "interfacce": [{ "id": "s", "a": [760, 100], "b": [900, 240], "tipo": "specchio" },
                 { "id": "l", "a": [300, 60], "b": [300, 540], "tipo": "rifrazione", "n1": 1, "n2": 1.6 },
                 { "id": "muro", "a": [60, 560], "b": [960, 560], "tipo": "assorbe" }],
  "regole": [
    { "quando": { "tipo": "attraversa", "a": [80, 300], "b": [81, 300] },
      "fai": [{ "tipo": "staffetta", "lista": ["m0", "m1", "m2"] }] },
    { "quando": { "tipo": "tocca", "id": "s" },  "fai": [{ "tipo": "accendi", "id": "m0" }] },
    { "quando": { "tipo": "ogni", "passi": 40 }, "fai": [{ "tipo": "inverti", "id": "penna" }] },
    { "quando": { "tipo": "passi", "n": 5000 },  "fai": [{ "tipo": "ferma" }] }
  ]
}
```

Eventi (`quando`): `attraversa` una retta `a→b` (con `verso` opzionale),
`tocca` un'interfaccia, `passi` n, `ogni` n passi.
Azioni (`fai`): `accendi`, `spegni`, `inverti` (di una massa, un'interfaccia o
della `penna`), `staffetta` su una lista, `ferma`.

Ogni particella porta con sé il proprio stato di accensione: più emettitori
nella stessa partitura sono indipendenti e deterministici.

## L'alfabeto delle piastrelle

Il motore fisico fa gli elementi. Sopra c'è una **grammatica** che li compone
e li ripete. Analizzando un pattern lo si scompone sempre negli stessi ruoli,
e gli stessi ruoli bastano a ricomporlo:

| livello | simbolo | cosa è |
|---|---|---|
| **tratto** | `arco`, `uncino`, `onda`, `zigzag`, `ventaglio`, `cerchio`, `goccia`, `segmento`, `quadrato`, `rombo` | una linea del motore, in coordinate locali |
| **motivo** | `C_n(tratto)`, `D_n(tratto)` | il tratto moltiplicato da una simmetria puntuale: `C_n` ciclica (n copie ruotate, circolare ma non speculare), `D_n` diedrale (n assi di specchio, 2n copie). `D2` sono i quattro spicchi, `D4` gli otto |
| **cella** | `CELLA L [ … ]` | la piastrella, un quadrato di lato L con ruoli |
| ↳ `centro` | | il motivo centrale |
| ↳ `angoli`, `lati` | | i riempitivi che quadrano il cerchio, ai quattro angoli o a metà dei lati |
| ↳ `corolla` | `n×motivo @r φ` oppure `@r da°→a°` | n copie su un cerchio di raggio r, o su un arco tra due angoli (il ventaglio): la cornice ciclica, simmetrica o no; la scala può variare lungo l'arco |
| ↳ `fusto` | `n coppie {…}` | un asse verticale con coppie di elementi specchiati a varie altezze (il candelabro) |
| ↳ `contenitore` | | ciò che si ripete uguale in ogni cella |
| ↳ `contenuto` | `{A, B, C} ritmo ABAC` | ciò che varia, scelto dal ritmo lungo la riga, la colonna o la diagonale |
| **reticolo** | `RETICOLO gruppo c×r` | la ripetizione: `p1` identica, `pm` specchiata a colonne alterne, `pmm` specchiata in entrambe le direzioni, `p2` ruotata di 180°, `p4` ruotata di 90°, `pg` slittata, `cm` a righe sfalsate |
| | `RETICOLO esagonale p1\|p3\|p6\|p31m c×r` | le celle sui centri di un impaccamento di esagoni: righe sfalsate di L/2 a distanza L·√3/2 |

Dalle tavole della *Grammar of Ornament* sono ricostruite in `src/celle.js`:
il reticolo esagonale bizantino con stelle {6/2}, le stelle {8/3} in quadrato,
il guilloche di cerchi, il ventaglio egizio, il candelabro pompeiano, la greca
e la nuvola cinese.

## Il seme

Lo scopo è che un pattern qualunque si riduca a un **seme**: una codifica
che, rieseguita, lo rigenera identico, e in cui ogni curva emerge da una legge
e non da un disegno a mano. Il seme oggi è la coppia partitura + parola, cioè
il JSON di `src/celle.js`: elementi, stato iniziale, regole, simmetrie,
reticolo. È deterministico, leggibile e componibile. Ciò che manca perché sia
davvero "qualunque pattern" è elencato sotto.

Una piastrella intera si legge in una riga, la sua **parola**:

```
CELLA 120 [ centro D4(arco) | angoli 4×uncino | corolla 16×segmento @46 ]  ×  RETICOLO p1 6×4
CELLA 110 [ contenitore quadrato | contenuto {C6(goccia), cerchio, D2(zigzag), D3(arco)} ritmo ABACABAD riga ]  ×  RETICOLO p1 7×4
```

La pagina `piastrelle.html` mostra la cella scomposta per ruoli (ogni ruolo
col suo colore), il reticolo e la parola. La codifica JSON è in `src/celle.js`.

## Struttura

```
src/motore.js      il motore: vettori, RK4, gravità, campi (Lorentz, Stokes, Hooke), ottica, eventi per bisezione
src/partiture.js   i generatori: onda, coniche, camera di specchi, lastre, interruttore
src/app.js         la pagina del motore: sceglie, simula, disegna, esporta il JSON
index.html         la pagina del motore
src/motivi.js      i tratti dell'alfabeto, ognuno una partitura del motore
src/grammatica.js  motivo (C_n, D_n), cella (ruoli), reticolo (gruppi), parola
src/celle.js       le piastrelle di esempio
src/piastrelle.js  la pagina delle piastrelle
piastrelle.html    la pagina delle piastrelle
test/              i test (node, senza dipendenze)
```

## Uso

```bash
npm test
```

```bash
npm start
```

poi apri `http://localhost:8000`. I cursori dell'onda mostrano in diretta le
formule e rigenerano la partitura; il JSON nel pannello è modificabile e si
rigenera col bottone.

## Prossimi passi

- **intrecci**: il sopra/sotto dei nastri (guilloche, nodi) richiede che la
  linea abbia uno spessore e che a ogni incrocio si decida chi passa sopra;
- **archi tangenti a raggi diversi**: la staffetta tra masse già garantisce la
  tangenza; serve il calcolo automatico della massa successiva lungo la
  normale (le nuvole cinesi e i girali);
- **celle annidate**: una cella come tratto di un'altra, e una cornice attorno
  al reticolo (il bordo del tappeto);
- i restanti gruppi di carta da parati (p4g, p3m1, p6m) e reticoli rombici;
- emissione di nuove particelle come azione di una regola (le ramificazioni
  vegetali del pompeiano);
- propagazione analitica delle coniche al posto di RK4;
- **il seme compatto**: una sola stringa al posto del JSON;
- **la lettura inversa**: da un'immagine trovare il reticolo
  (autocorrelazione), poi la simmetria della cella, poi i ruoli, fino alla
  parola.
