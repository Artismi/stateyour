# Il formato delle scene (dal mondo al motore)

Chi dà le scene: `src/camera/spazio3d.js`. Chi le disegna: il motore in `src/tre/`. Il mondo non sa niente del
disegno; il motore non inventa niente del mondo. Tre funzioni, una per livello, tutte funzioni del **tempo**:

```js
import { scenaCosmo, scenaGalassia, scenaSistema } from '../camera/spazio3d.js';
scenaCosmo(cosmo, t)                      // le galassie e la rete
scenaGalassia(cosmo, galassia, t)         // le stelle del campione e la forma continua
scenaSistema(cosmo, galassia, stella, t)  // la stella, i pianeti, le lune
```

## Unità e riferimenti
- **`t`: secondi da oggi** (l'epoca: l'età dell'universo di `leggi.js`; `t = 0` è il mondo di `cosmo.js`, `t < 0` il
  passato). `scena.eta` dà gli anni (del cosmo per cosmo e galassia; della stella per il sistema).
- **Posizioni in metri, `Float64Array`** (x, y, z di fila), rispetto all'origine detta in `scena.riferimento`.
  Velocità in m/s (`Float32Array`). Raggi veri in metri. Tutti i riferimenti sono destrorsi.
- **Luce**: `luminosita` in watt (bolometrica, da `stelle.js`), `magnitudine` assoluta bolometrica
  (4,74 − 2,5·log₁₀(L/L☉)); `colore` r, g, b 0…255 (dalla temperatura; per una galassia: la sua luce tutta insieme).
- **`scena.nelGenitore`**: dove sta questo riferimento in quello del livello sopra, allo stesso tempo:
  `{ livello, pos: [x, y, z] (m), vel (m/s), assi: [x̂, ŷ, ẑ] }`. Un punto `p` della scena sta, nel genitore, in
  `pos + p.x·x̂ + p.y·ŷ + p.z·ẑ`. Per passare di livello senza perdere cifre: si cambia origine (si sottrae in
  doppia precisione, poi si passa alla scheda grafica la differenza), non si sommano numeri grandi a numeri piccoli.
- **`scena.figlio(i)`** dà la `via` del livello sotto per il punto `i` (da passare alla funzione del livello sotto).
- La mappa piatta di prima è la vista da +z di ogni riferimento (x e y sono le stesse).

## `scenaCosmo` → 
| campo | che cos'è |
|---|---|
| `riferimento.periodico` | i tre lati del toro in metri a quel tempo (a·TORO_M): lo spazio si richiude |
| `riferimento.fattoreDiScala`, `redshift`, `hubble` | a(t), z, H (km/s/Mpc) |
| `punti` | le galassie: `n`, `id`, `pos` (m, dall'angolo del toro: comovente × a), `vel` (il moto proprio, oltre l'espansione), `raggio` (il raggio che tiene il 97% delle stelle), `luminosita`, `magnitudine`, `colore`, `esiste` (0 prima che la galassia cominci), `peso` |
| `punti.peso` | **la nebbia**: le galassie sono un campione; ognuna ne rappresenta `peso` vere (~10⁵) |
| `campi.densita` | la rete: `{ n, delta: Float32Array(n³), crescita, lato, sigma, in(x) }`. `delta[z·n² + y·n + x]` è la sovradensità lineare di oggi al nodo (x, y, z)/n del toro (periodica); a quel tempo vale `delta·crescita`. `in([x, y, z])` (coordinate comoventi 0…1) la dà in un punto qualunque |
| `campi.velocita.in(x)` | il moto della materia in un punto (km/s, oggi) |

## `scenaGalassia` →
| campo | che cos'è |
|---|---|
| `riferimento` | origine nel centro (il buco nero); xy il piano della galassia; `raggio` l'unità della mappa |
| `daLontano` | la galassia come un punto: `luminosita`, `magnitudine`, `colore`, `raggio`, `massaStelle` a quel tempo |
| `punti` | le stelle del campione: `n`, `id`, `pos`, `vel`, `raggio` (della stella), `luminosita`, `magnitudine`, `colore`, `esiste` (0 se non era ancora nata), `stato` (indice in `stati`), `massa` (M☉), `peso` |
| `punti.peso` | ogni stella del campione ne rappresenta `peso` vere (~10⁷–10⁸); la luce diffusa di tutte le altre è nei campi |
| `campi.densita(x, y, z)` | `{ stelle, gas, polvere }` in kg/m³ in quel punto, a quel tempo (i bracci girano) |
| `campi.anelli` | la stessa cosa a colonne, anello per anello: `r`, `bordo` (m), `stelle`, `gas` (kg/m²), `Z`, `spessore` (m: z₀ di sech²(z/z₀)), `spessoreGas` |
| `campi.sferoide` | `{ massaKg, scala (Hernquist, m), schiacciata }` |
| `campi.bracci` | `numero`, `contrasto` (stelle), `contrastoGas`, `fase(r)` (l'angolo della cresta al raggio r, a quel tempo), `velocitaAngolare` (rad/s, con segno), `corotazione` (m) |
| `campi.barra`, `campi.rotazione(r)` | la barra (raggio, angolo a quel tempo); la velocità di rotazione (m/s) |
| `buco` | il buco nero centrale: `massaKg`, `raggio` (l'orizzonte), `potenzaGetto` (W) |

## `scenaSistema` →
| campo | che cos'è |
|---|---|
| `riferimento` | origine nel baricentro; xy il piano medio del sistema |
| `fase` | `'non nata'`, `'disco'` (c'è ancora il gas: vedi `disco`), `'pianeti'` |
| `corpi` | stella, pianeti, lune, di fila: `{ cosa, id, pos, vel, raggio, massaKg, luminosita, colore, … }` |
| corpo che gira | `asse` (versore del polo nord), `angolo` (rad), `giorno` (s), `schiacciamento`, e soprattutto **`assetto`**: la matrice 3×3 per righe (9 numeri) che porta dagli assi del corpo a quelli della scena, con gli assi del corpo di `nucleo.js` (x: equatore al meridiano 0; y: il polo; z = x × y). Un punto a longitudine λ est e latitudine φ: `assetto · (cos φ cos λ, sin φ, −cos φ sin λ)` |
| lune | agganciate (`bloccata`): il meridiano 0 guarda il pianeta, il polo è la normale all'orbita; non agganciate: `assetto: null` (nessuna legge qui ne dà il giro) |
| `orbita` (pianeti e lune) | `{ attorno, a, e, inclinazione, assi: [P̂, Q̂, Ŵ], periodo }`: un punto dell'orbita è `centro + a(cos E − e)·P̂ + a√(1−e²)·sin E·Q̂`, E da 0 a 2π |
| `anello` | `{ interno, esterno }` in metri, nel piano dell'equatore del pianeta |
| `disco` | (fase `'disco'`) `{ interno, esterno, neve (m), massaKg }` |

### I corpi già pronti per `nucleo.js`
```js
import { corpiSistema } from '../camera/spazio3d.js';
const corpi = corpiSistema(cosmo, galassia, stella);   // la stella, i pianeti, le lune, di fila
// ognuno: { nome, cosa, id, genitore (indice nella lista, −1: nessuno), raggio (m), colore, luminosita (la stella),
//           posizione(t, out) → metri dal centro del genitore (la stella: dal baricentro), assi del sistema (inerziali),
//           assetto(t, out)   → la matrice di sopra (null per una luna non agganciata) }
const fatti = []; for (const c of corpi) fatti.push(N.corpo({ ...c, genitore: c.genitore < 0 ? null : fatti[c.genitore] }));
```
Il tempo del motore è lo stesso: `N.tempo.t` in secondi, **0 = oggi** (non serve `t0`). Lo stato del sistema a un
tempo si calcola una volta per tutti i corpi (~0,1 ms).

## Il livello di dettaglio
Da lontano una galassia è un punto di `scenaCosmo` (o `scenaGalassia(...).daLontano`): luce totale e tinta. Quando il
suo `raggio` sullo schermo supera qualche pixel: la forma continua (`campi`). Più vicino: le stelle di `punti`, che
sono sempre le stesse a ogni scala (regola 9), ognuna con il suo `peso`. Lo stesso per un sistema dentro la galassia
(un punto di `scenaGalassia`, poi `scenaSistema`).

## Che cosa costa
`scenaCosmo`: ~0,5 s la prima volta per cosmo (il campo, la griglia 64³, le galassie), poi < 1 ms.
`scenaGalassia`: ~0,2 s la prima volta, poi ~10 ms a tempo nuovo (2500 stelle). `scenaSistema`: ~0,1 s la prima
volta (clima e interno dei pianeti, da `cosmo.js`), poi ~0,1 ms a tempo nuovo.

## Che cosa resta fermo a «oggi»
Vedi i commenti di `statoSistema`, `statoGalassia`, `statoCosmo` in `spazio3d.js`: gli elementi delle orbite, gli
assi, la forma della galassia e le taglie non cambiano nel tempo; cambiano le posizioni, i giri, la luce delle stelle
alla loro età, l'espansione, la crescita della rete, chi c'è e chi non c'è ancora.
