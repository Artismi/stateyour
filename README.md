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

Il caos a più corpi compare solo se due o più masse sono accese **insieme**.
Con una massa alla volta tutto è esatto e riproducibile.

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

## Struttura

```
src/motore.js      il motore: vettori, RK4, eventi per bisezione, ottica
src/partiture.js   i generatori: onda, coniche, camera di specchi, lastre, interruttore
src/app.js         la pagina: sceglie, simula, disegna, esporta il JSON
index.html         la pagina
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

- un quarto piano di influenza (attrito o campo di velocità) per spirali e
  sinusoidi esatte;
- emissione di nuove particelle come azione di una regola (ramificazioni);
- propagazione analitica delle coniche al posto di RK4, per esattezza
  a qualunque passo;
- la lettura inversa: da un pattern dato risalire alla partitura.
