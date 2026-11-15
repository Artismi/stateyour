# La lingua dell'indirizzo

Riferimento. La derivazione sta in `reports/Tesi del multiverso indirizzabile.md` (oggetti O1–O10, condizioni C1–C14);
le regole in `INTRECCIO.md` (r. 1–14). Il codice è `src/camera/lingua.js` (con `src/camera/misura.js` per i pesi degli
esiti degli eventi), la prova `test/test_lingua_indirizzo.mjs`.
Natura di ogni voce: **teorema**, **ipotesi**, **libero** (scelto da noi, r. 2), **manca**.

## 1. Sintassi

Una forma sola, quella di `intreccio.js` (`scrivi`/`leggi`). `lingua.leggi` è severa: legge solo testi già canonici.

```
indirizzo := percorso [ "@" tempo ] [ "#" rami ]
percorso  := nome { "/" nome }
nome      := testo non vuoto senza "/", "@", "#"
tempo     := numero                          anni dall'inizio del cosmo; assente = «adesso» (= ANNI_OGGI, spazio3d.js)
rami      := JSON di { evento: esito }       chiavi in ordine, esiti interi ≠ 0 (0 = come nel mondo di partenza)
numero    := String(Number(x))               la forma di JavaScript: andata e ritorno esatte

luogo     := "cosmo " N≥1 [ "/galassia " g [ "/vera " k ] [ "/stella " s [ "/vera " k ] [ "/pianeta " p
               [ "/luna " l ] [ "/" ( "punto " lon "," lat | "regione " r ) ] [ "/scala " L ] ] ] ]
resto     := tutto ciò che segue il luogo    parti non contate dalla misura («buco», «disco/embrione 12/…»)
```

- Interi senza zeri davanti; g, s, p, l sono gli indici di `cosmo.js` (da 0), l è l'`id` della luna.
- `vera k` (facoltativo, 0 ≤ k < N): la galassia vera, o la stella vera, numero k tra le N che quella del campione
  rappresenta (§ 2, «Dal campione al vero»). Senza `vera` il cilindro le contiene tutte. La via di `cosmo.js` non le
  conosce: `viaDi` le lascia cadere.
- **Luogo sulla superficie: le coordinate attuali** (`bolle.js`): `punto lon,lat` in gradi, −180 < lon ≤ 180,
  −90 ≤ lat ≤ 90. Il **cilindro** che nomina è il pixel **HEALPix nested** che lo contiene, d'ordine
  k = clamp(⌈log₂(R·√(π/3)/L)⌉, 0, 24), con R il raggio del corpo e L la `scala` (o quella predefinita). Chi scrive un
  pixel ne scrive il centro con le cifre che bastano a ritrovarlo (`puntoDelPixel`).
- `regione r`: le 12 regioni della magnetosfera del numero della biblioteca (`cosmo.js`).
- `scala L`: il lato del luogo in metri (la `grandezza` di `bolla.js`).
- Un indirizzo che non comincia da `cosmo N` è un indirizzo d'evento («disco/1/3/53», «lingua/punto a caso/7»).
- La via di `cosmo.js` ({ cosmo: "1#{…}", galassia, … }) si traduce con `daVia` / `viaDi`: i rami passano dal numero
  del cosmo all'indirizzo. Così scrivono tutti: `bolla.js` (`percorsoDi`, `luogoDi`, `bollaDaVia`, `viaDi`,
  `scriviBolla`) e i luoghi dei corpi in `src/tre`, `bolle.js` (i luoghi delle bolle di contenuto), `grandezze.js`
  (`indirizzoDi`), il punto a caso di `laboratorio.js`. La forma di prima della vista 3D, coi rami nel nome del cosmo
  («cosmo 1#{…}/galassia 0/…»), si legge ancora (`intreccio.leggiAncheVecchia`: le bolle già salvate si riaprono) ma
  nessuno la scrive più.
- **Indirizzo e nome per la fonte del caso sono due cose.** Un testo dato a `eventi.js` (la radice del disco di un buco
  nero, `bolla.js` `nomeFonte`; i nomi degli eventi di `bolle.js`; le radici di `cosmo.js`) è una chiave e non si
  rilegge: resta quello di sempre, anche dove un cosmo parallelo vi mette il suo numero coi rami, perché cambiarlo
  cambierebbe i mondi. Nel cosmo di base i due testi coincidono.

Esempio: `cosmo 1/galassia 39/stella 1618/pianeta 0/punto -69.17,0.093/scala 10000@11514352010.10819#{"disco/39/1618":2}`

## 2. Oggetti

| | Oggetto | Formula | Natura | Nel programma |
|---|---|---|---|---|
| O1 | Indirizzo = cilindro | a = (π, t, ρ); [π] = {ω ∈ ∂T : π ⊑ ω} | teorema (Cantor; Baire per l'indice del cosmo) | `intreccio.js`, `lingua.analizza` |
| O2 | Fonte del caso | κ(ε) = k₀, κ(π·b) = Φ(κ(π), b), u(π, j, r) = Ψ_κ(π)(j, r) | teorema se κ iniettiva | `eventi.js` (Threefry, chiave a 128 bit) |
| O3 | Grane e classi | M_{f←g}∘M_{g←h} = M_{f←h}; [x]_g = M_g⁻¹(M_g(x)) | teorema | `lingua.formaCanonica` (caselle annidate) |
| O4 | Riassunto/raffinamento | (M_{g←h})_# μ_{h←g}(y) = δ_y; Q_g∘M = Q_h; μ = legge di R(y, u(π·figli)) | prova per passaggio | tessere, `campo_pigro.js` |
| O5 | Nuclei per livello | κ_k(a_k \| a_<k), p_e(o \| ·) con Σ_o p_e = 1, T_g^τ | — | `lingua.js` NUCLEI (discesa); p_e: `misura.js` LEGGI (sotto); T_g^τ manca |
| O6 | Bolla | B = (p, u, S, g, C); D(B) = J⁻(S); mondo ~ μ(· \| ∩C_i) | teorema (fascio) | `bolle.js`, `bolla.js` |
| O7 | Misura sui cammini | μ([π, ρ]) = w(n)·Π_k κ_k·Π_{e∈ρ} p_e; w(n) = 2^{−ℓ(n)} | w **libero** | `lingua.peso`, `puntoACaso` |
| O8 | Impronta a grana | F_g(x) = H(c(M_g(x))), H a 128 bit; w_g(s) = Σ_{F_g(x)=s} μ([x]) | teorema se decoerenti | `lingua.impronta` (pianeti), `lingua.fondi` (quoziente con i pesi) |
| O9 | Osservazione | O_{B,c} = ∫∫ R_c(λ) L(x_B, ω, λ, t_B) W(ω) dω dλ; O_g = M_pix(O_h) lineare | teorema | `src/tre` (r. 14) |
| O10 | Lettura | leggi(a) = W(a), pura; pigro = completo | teorema | ovunque (r. 8) |
| O11 | Impronta di bordo | vedi sotto | teorema / ipotesi | `bordo.js` (densità e potenziale; gli altri campi **mancano**) |
| O12 | Passo | vedi sotto | — | `lingua.distanzaRami` (d e d_w); il nucleo nel tempo **manca** |

**O7 nel programma** (`lingua.peso`; ogni parte dice che cosa conta):

| Livello | Peso del figlio | Che cosa si conta | Natura |
|---|---|---|---|
| cosmo n | 2^{−ℓ(n)}, ℓγ(n) = 2⌊log₂n⌋+1 (`codice: 'delta'`: ℓδ = ⌊log₂n⌋+2⌊log₂(⌊log₂n⌋+1)⌋+1) | lunghezza di codice | libero |
| galassia g | M★_g / Σ M★ (`galassie: 'stelle' \| 'uniforme'`) | massa in stelle | libero |
| vera k (galassia) | 1/N_g, N_g = round(aloni del toro ≥ M_min / galassie del campione) | galassie vere, una per una (la convenzione di `cosmo3d.js` `peso`: Press–Schechter, ~1,7·10⁵ nel cosmo 1) | dato del modello; per numero: libero |
| stella s | peso_s / Σ peso | stelle vere rappresentate dal campione (`galassie.js`) | dato del modello |
| vera k (stella) | 1/N_s, N_s = max(1, round(peso_s)) | stelle vere, una per una (~2,3·10⁸ per stella del campione; 1 per le ultime supernove) | per numero: libero (la funzione di massa è nella massa di ognuna) |
| pianeta p | (R_p² + ΣR_lune²)/Σ (`pianeti: 'massa' \| 'uniforme'`, `lune`) | superficie del sistema del pianeta | libero |
| corpo | R_c²/(R_p² + ΣR_lune²) (`corpi: 'uniforme'`) | superficie del corpo | libero |
| punto | 1/(12·4^k) | area (HEALPix, esatto) | teorema, dato k |
| regione r | 1/12 | regioni uguali | libero |
| scala | 1 | non si estrae: è la grana di chi guarda | libero |
| tempo | min(Δt, τ − jΔt)/τ, τ = vita della stella (senza stella: età del cosmo); `tempo: 'adesso'` → δ sull'oggi | durata (mai uniforme su ℕ o ℝ: teorema) | libero |
| rami | Π_e p_e(o_e)/p_e(o_e⁰) | il rapporto di verosimiglianza rispetto al mondo di partenza (`misura.js`); i tiri senza legge dichiarata: 1 | teorema, dato C4; la grana dei continui: libero |

−log₂μ = somma delle parti, in bit (`peso().bit`). Con le galassie e le stelle vere un punto a caso costa ~120 bit
(cosmo 1, galassia 6, vera 17, stella 11, vera 26–28, pianeta 1–4, luogo 24–30 a 10 km, tempo 33). `puntoACaso(seme)` scende con questi nuclei dalla fonte
`lingua/punto a caso/<seme>`, un evento per livello con lo stesso nome qualunque sia il prefisso: quindi
`puntoACaso(s, { da: prefisso di puntoACaso(s) }) = puntoACaso(s)` (conosciuto un punto, il resto è definito). Il punto
scende l'albero HEALPix un figlio su quattro per ordine (uniforme esatto). La stella è condizionata ad avere pianeti
(riestratta): la costante Z = Σ peso·[ha pianeti]/Σ peso non è nel peso (stima 0,99, 0,02 bit). `specialita(a)` =
peso(a).bit contro la mediana di N punti a caso (che scendono alle vere solo se a ci scende: si confrontano cilindri
della stessa specie). Con `vere` (predefinito) la discesa passa per `vera k` della galassia e della stella:
P(s, k) = peso_s/Σpeso · 1/N_s, uniforme sulle stelle vere e non sul campione (prova: χ² sull'indice globale della
stella vera, e nessuna delle stelle «vere una per una» estratta, che sul campione uniforme lo sarebbero ~4 volte su 3000).

**Dal campione al vero** (`stellaVera`, `galassiaVera`). Le stelle vere di una stella del campione hanno indirizzo
`…/stella s/vera k`; gli eventi che le fanno individuali stanno lì (`…/vera k/massa`, `…/quando`).

| | Uguale per le N | Varia tra le N |
|---|---|---|
| stella | cella di nascita (passo, anello o componente: quindi Z, componente, venuta), classe di massa (0,1 dex: `granaMassa`, libero), campo di nascita; **il sistema dei pianeti, il luogo e il tempo: quelli del campione** (non torna: il modello ne calcola uno per stella del campione); il posto (varia, ma non è calcolato: la funzione è interna a `galassie.js`) | massa di nascita (Kroupa, `leggi.js massaNascita`, dentro la classe: χ² nella prova), età (uniforme nel passo), e da lì con `stelle.js` vita, stato, T, L, R |
| galassia | tutto: alone, forma, stelle, sistemi | il posto nel toro (tre eventi uniformi: le correlazioni tra aloni non sono seguite; `aloniIn` le dà regione per regione, non sul toro intero) |

**C4 nel programma** (`misura.js`). Un evento è un tiro u (o due: la campana) consumato da una legge; il peso di un
esito è la massa che la legge gli dà: discreta per gli esiti discreti, F(fine) − F(inizio) della cella alla grana per
i continui (densità × ampiezza senza l'errore del rettangolo).

| Legge | Esito | Peso | Celle |
|---|---|---|---|
| uniforme (c nudo, serie, fila) | u | 2^−g | 2^g in u |
| tra(a, b) | a + (b−a)u | 2^−g | 2^g frazioni dell'intervallo (grana relativa: non dipende da a, b) |
| intero(n) | ⌊u n⌋ | 1/n | n |
| bernoulli(p) | u < p | p, 1 − p | 2 |
| discreta(pesi) | per cumulata | w_i/Σw | quanti i pesi |
| normale | Box-Muller di eventi.js | Φ((j+1)2^−g) − Φ(j 2^−g) | 2^−g nello scarto (il taglio a \|z\| ≤ 7,43 di eventi.js, 1,1·10⁻¹³, non contato) |
| seme | (X0 mod 2147483646) + 1 | 3/2³² per 1…4, 2/2³² gli altri (esatto) | 2147483646 |

g = `grana` (predefinito 20, libero): la variabile in cui si misura la cella di un continuo è una scelta (una densità non
è invariante per cambio di variabile). Un ramo n di eventi.js non è «l'esito n-esimo»: è un altro tiro u_n della stessa
legge; rami con lo stesso esito alla grana sono lo stesso cilindro. Il peso di un mondo con rami è
Π_mondo p / Π_partenza p (`misura.rapporto` sui due cammini annotati da `misura.conMisura`, anche ciò che ne discende;
`misura.pesoDegliEventi` sui soli eventi dei rami, data la loro legge), in unità del mondo di partenza: può superare 1.
`peso(a, { registri: { base, mondo } })` o `peso(a, { leggi })` lo mettono nella parte «rami»; senza, ogni ramo pesa 1
e la parte lo dice. **Non torna oggi**: quasi tutti i consumatori (disco.js, lune.js, galassie.js…) leggono c(…) nudo e
confrontano il tiro con una probabilità dentro di sé: il registro vede un'uniforme, e i loro rami hanno rapporto 1 (a
parità di tiri; ogni tiro in più costa g bit). Il registro di `eventi.js` (`conRegistro`) annota solo i tiri: la patch
che gli fa annotare la legge (e aggiunge `c.bernoulli`, `c.discreta`) è pronta e provata, da applicare dopo il passaggio
di eventi.js in corso; intanto `misura.conMisura` ne fa le veci.

**O8 nel programma.** c(x) = forma canonica delle grandezze del pianeta (tipo, acqua, giro bloccato, retrogrado,
crosta, gas tenuti, anelli, numero di lune; massa, raggio, semiasse, anno, giorno, T, pressione, masse delle lune in
ordine di massa → ⌊2^g·log₂x⌋; eccentricità, albedo, composizione → ⌊2^g·x⌋; obliquità → ⌊2^g·θ/180°⌋). Caselle
annidate: F_{g+1}(x) = F_{g+1}(y) ⇒ F_g(x) = F_g(y). H = FNV‑1a a 128 bit (libero). Campi: libero.

**O11. L'impronta di bordo di una bolla.** Il bordo ∂S di una bolla (sfera di raggio r attorno a x_B, sulla fetta
ortogonale a u) e i campi del modello su di esso, φ ∈ {potenziale, densità, temperatura, campo magnetico, radianza}:

```
∂F_B,ℓmax = { a^φ_ℓm = ∫_{∂S} φ(x_B + r n̂) Y*_ℓm(n̂) dΩ : ℓ ≤ ℓmax }          (come fondoCosmico().armoniche in ragnatela.js)
Gauss          ∮ ∇Φ·dA = 4πG M_dentro;  a^Φ_ℓm(r) = −(4πG/(2ℓ+1)) r^{−ℓ−1} q_ℓm,  q_ℓm = ∫_dentro ρ r′^ℓ Y*_ℓm   (teorema)
Dirichlet      ∇²φ = 0 dentro  ⇒  φ(r′, n̂) = Σ a_ℓm (r′/r)^ℓ Y_ℓm(n̂)       l'interno senza sorgenti dal bordo (teorema)
dipendenza     lo stato su S determina D⁺(S): nessun segnale esterno lo raggiunge       (teorema, eq. iperboliche)
olografia      S_max(regione) ≤ A(∂S)/(4 l_P²)                                          (ipotesi per il nostro universo)
incollamento   B₁, B₂ vicine:  ∂F_B₁|_{∂S₁∩∂S₂} = ∂F_B₂|_{∂S₁∩∂S₂}  (sulla parte di bordo comune, alla grana comune)
```

ℓ ordina il riassunto per scala (ℓ ≈ π r/λ): troncare a ℓmax è il riassunto M_g del bordo. L'impronta di bordo non
determina l'interno dove ci sono sorgenti (solo i loro multipoli): è un riassunto, non un'identità.

**O11 nel programma** (`bordo.js`, prova `test_bordo`). La bolla è una sfera comovente (centro x_B, raggio R) a un istante,
sulla fetta del fondo; il campo è quello senza bordo di `campo_pigro.js` alla grana J (celle di lato h_J).

```
Y_ℓm reali e ortonormali (Y_ℓ,±m = √2·P̄_ℓ^m·cos, sin mφ; P̄ di ragnatela.js), indice ℓ² + ℓ + m
ℓmax = ⌈k_max·R⌉,  k_max = π/h_J                il bordo esatto della banda (B_J = 0 oltre 2k_J): teorema, non scelto
a_ℓm = Σ_c w_c·λ_ℓ(d_c)·Y_ℓm(d̂_c),  λ_ℓ(d) = (2π/Rd)∫_{|R−d|}^{R+d} K(r) P_ℓ(μ(r)) r dr     Funk–Hecke, cella per cella
      (K lineare a tratti sulla tabella: Gauss–Legendre a ℓmax + 2 nodi per tratto è esatto)
coda = 1 − Σ_{ℓ≤ℓmax}(2ℓ+1)C_ℓ/(4πσ²),  C_ℓ = 4π∫dlnk Δ²(k)·ΣB_j²(k)·j_ℓ(kR)²             la parte che il riassunto lascia
nel tempo: δ ∝ D(a);  Φ = (3/2)Ω_m H₀²·(D/a)·φ, ∇²φ = δ (m²/s²)                            Poisson comovente
dal bordo: media ξᵀC⁻¹c, varianza ⟨φ²⟩ − ξᵀC⁻¹ξ (C = AAᵀ, ξ = A·g_x); realizzazione w′ = w + Aᵀ C⁻¹(c − Aw)   Hoffman–Ribak
```

Alla grana del cosmo (J = 16, h = 18,7 Mpc) una bolla di 40 Mpc ha ℓmax = 7 (64 coefficienti) e lascia oltre il 2·10⁻⁴
della varianza della densità sul bordo (del potenziale 8·10⁻⁸). Il bordo dice poco del centro di una sola bolla (10%
della varianza) e molto vicino al bordo (76% nella lente); due bolle sovrapposte insieme ~90%. Non c'è: temperatura,
campo magnetico e radianza (nessun campo del modello li porta ancora su una sfera qualunque); Gauss e Dirichlet (i nuclei
di `campo_pigro.js` sono troncati e rinormalizzati uno per uno: δ e −∇·Ψ differiscono di ~0,06 scarti); il
condizionamento di un campo già vincolato (il cosmo con le sue galassie: andrebbe fatto in `vincola`, tutti insieme);
l'olografia resta un'ipotesi sul nostro universo, non una regola del modello.

**O12. Il passo.** Da a ci si muove scendendo l'albero (O7) o con un nucleo P(a′ | a):

```
nel tempo   a′ = (π, t + Δt, ρ′):   P(a′ | a) = Π_{e : t < t_e ≤ t+Δt, e ⊑ π} p_e(o_e | ·)
            grandezze lente (τ_L ≫ Δt: orbite, geologia, clima medio, specie): determinate dalle leggi da a
            grandezze veloci (τ_L ≲ Δt; τ_L ≈ 2 settimane per il tempo atmosferico): scelte per peso (r. 11)
di lato     a′ = (π, t, ρ′):  d(ρ, ρ′) = |{ e : ρ(e) ≠ ρ′(e) }|,   d_w(ρ, ρ′) = Σ_{e ∈ ρ Δ ρ′} −log₂ p_e(o_e)
moda        a* = argmax P(a′ | a)              («il più probabile»)
tipico      a′ ~ P(· | a), dalla fonte `u(π·passo, …)`   («un tipico»: quello che si usa, dichiarato)
```

Nel programma: «un pianeta parallelo» (`laboratorio.js`) è un passo di lato con d = 1 sull'impatto che più ha segnato
il mantello (esito r+1: né moda né tipico, il successivo); «un ramo parallelo più pulito» (`vicini.js perfeziona`) è
una ricerca tra passi di lato con d piccola, scelti per bellezza e non per peso (esito 1 + ⌊10⁶u⌋). `distanzaRami`
dà d e d_w = −log₂(P(b)/P(a)) con i pesi dei rami (orientata: d_w(a→b) = −d_w(b→a); 0 dove le leggi non sono
dichiarate, e lo dice). Il passo nel tempo sopra le particelle **manca** (r. 1, r. 11).

**C11 nel programma** (`fondi(voci, grana)`). I cilindri (indirizzi fino al pianeta o più giù) raggruppati per impronta,
con w_g(s) = Σ μ([x]): si sommano i pesi, non le ampiezze, perché le storie riunite sono decoerenti (differiscono per
eventi macroscopici, sopra la scala quantistica: un disco, un impatto, una stella in un altro ramo); sotto la decoerenza
andrebbe |Σ A_x|² (non fatto). Lo stesso cilindro due volte si conta una (la chiave è il testo, o la `storia` data);
cilindri uno dentro l'altro non si sommano (errore). Prova: il totale si conserva a ogni grana da 8 a 0, lo stesso
pianeta da due strade (il cosmo e un ramo su un'altra stella) finisce nella stessa classe.

**C13 nel programma** (`misura.cervelliDiBoltzmann`, `lingua.frazione`). Stima d'ordine di grandezza, per mondo (un
cosmo fino a oggi). Via evolutiva: la frazione f, per la misura (puntoACaso, pianeti contati per numero), dei pianeti con
il contenuto («roccioso, acqua liquida, atmosfera»: ~6% nel cosmo 1, 120 punti), per i pianeti del cosmo (~10¹⁹).
Via per fluttuazione: le N = M/m particelle prese dal mezzo (gas ideale, n = 10⁶ m⁻³, T = 8000 K: il mezzo
interstellare tiepido; dato dichiarato), ΔS = N k (s_gas − s_ogg), s_gas da Sackur-Tetrode (~68 k), s_ogg = 3 k
(libero), probabilità e^{−ΔS/k} per tentativo; tentativi = volumi indipendenti del toro × tempi di attraversamento del
suono fino a oggi (un'abbondanza, a favore della fluttuazione: ≤ 2¹³⁴). Esito: ~10⁵¹ bit a favore della via evolutiva
per un pianeta; ~10²⁸ bit per tentativo per un cervello di 1,4 kg, contro ≤ 2²³⁶ tentativi. Per osservatore manca
(nessun modulo sa dove c'è un osservatore), e con un tempo infinito (de Sitter eterno) i tentativi divergono: lì decide
la misura del tempo (O7), non questo conto. Non contati: energia di legame, calore restituito, struttura fine (fattori
d'ordine uno su ΔS, non sull'esponente).

## 3. Condizioni

| | Condizione | Natura | Prova |
|---|---|---|---|
| C1 | Trasparenza: pigro = completo, l'ordine non conta | teorema | `test_eventi` «l'ordine non conta»; `test_campo_pigro` «determinismo per indirizzo» |
| C2 | Iniettività delle chiavi: P ≈ 1 − e^{−N²/2^{b+1}} | teorema | `test_eventi` «nessuna collisione su un milione di indirizzi veri» (128 bit) |
| C3 | Qualità statistica della biiezione | prova | manca (BigCrush sul flusso vero) |
| C4 | Σ_o p_e(o) = 1 per ogni evento | teorema, dato C4 | `test_lingua_indirizzo` E: le sette leggi sommano a 1 (scarto ≤ 2·10⁻¹⁵, grane 2, 8, 12), le frequenze di 20 000 tiri della fonte contro le masse (χ²), il prodotto dei pesi = il rapporto di verosimiglianza a mano su un caso noto (moneta 0,3, campana, tra, discreta). Manca: le leggi dichiarate dai consumatori (oggi i tiri nudi sono uniformi) e la patch del registro di eventi.js |
| C5 | Kraft: Σ_n 2^{−ℓ(n)} = 1 | teorema | `test_lingua_indirizzo` «Kraft» (γ e δ, coda a 10⁶: 1,0·10⁻⁶ e 5,3·10⁻²); quanto cambiano le conclusioni tra due codici: manca |
| C6 | Zoom coerente (M)_#μ = δ, conservazione | prova | `test_coerenza_scale` (lavoro 5): una tabella per passaggio — grandezza del padre, riassunto dei figli, scarto, tolleranza dal modello (campionamento, numero dei figli, precisione), esito. Tornano: i livelli del campo (lisciato, 0), il campo vincolato nel posto delle galassie, il numero e la massa degli aloni veri (la massa solo entro un largo errore: CV = 4,8 su 59 galassie), la massa nata e i tempi di nascita del campione di stelle (χ²), la massa media alla nascita, le stelle vere (classe, passo, massa di Kroupa), la massa del disco, solidi + cibo dei pianeti = isolamento delle strisce, l'acqua della superficie, continenti e mare delle tessere, composizione della roccia, densità, vetro e composizione dei grani, la neutralità delle celle, gli atomi di un campione di quarzo, la salinità della scena d'acqua, gli elettroni di ioni e molecole, la densità degli orbitali, la regola di Born, protoni, neutroni, quark e raggio di carica del nucleo. **Non torna** (note): la quota media delle tessere (≈ −7 m contro ±5, dopo l'erosione della tessera; dichiarato in `geologia.js`); la carica per formula delle celle di feldspato potassico e plagioclasio (+1: Al scritto come Si, un catione solo) e della biotite (−1: senza gli idrogeni degli ossidrili). **Manca** M o μ: il posto delle galassie vere, il sistema e il luogo delle stelle vere, le regioni della magnetosfera. Anche `test_coerenza`, `test_campo_pigro` «regola 4» |
| C7 | Proiettività | teorema + prova | `test_campo_pigro` (σ₈, spettro), `test_bolle` (media e varianza) |
| C8 | Commutazione ‖M T_h μ − T_g‖, PΠ = ΠP̂ | prova | `test_coerenza_scale`, dove ci sono due grane con un'evoluzione: la storia della galassia a passi contro le stelle del campione evolute una per una (massa in stelle oggi e collassi: il difetto sta nel campionamento); l'acqua dopo l'erosione del pianeta (torna a 3·10⁻¹⁴); misurati senza limite dal modello: la soglia di comodo della gigante del catalogo (T ≤ 4200 K a 0,9 della vita: 31% da `stelle.js`), il clima per fasce contro la mappa (~1 K). Manca: un limite dal modello al difetto delle soglie di comodo; un'evoluzione a due grane sotto gli atomi; PΠ = ΠP̂ |
| C9 | Località causale: un ramo in e cambia solo J⁺(e) ∩ contenitore | prova | «un ramo cambia una cosa sola» in `test_disco`, `test_lune`, `test_vuoto`, `test_bolle`; `test_lingua_indirizzo` «lo stesso pianeta da due strade»; **il cono di luce per il campo del cosmo** (`test_bordo` D): con l'ipotesi dell'inflazione (la cella del livello j è un evento a η ≤ −6h_j, prima della fine dell'inflazione) un ramo su una cella fuori dalla portata del bordo di una bolla lascia la sua impronta identica al bit, e una cella che la cambia sta nel passato causale del bordo; le celle che due punti condividono stanno nel loro passato comune. Senza l'inflazione cadrebbe, e la prova lo misura (oggi i livelli con il nucleo più largo dell'orizzonte portano il 51% della varianza del potenziale, 4·10⁻⁷ di quella della densità; alla ricombinazione il 99% e il 6%). Manca: il cono di luce sopra il campo (stelle, pianeti: solo il contenitore) e il «dopo» degli eventi |
| C10 | Incollamento delle bolle | teorema + prova | `test_bolle` (nel punto e nel tempo); `test_bordo` B e C: le bolle si incollano condizionando lo stesso campo a tutte (un altro mondo, condizionato alle impronte di due bolle sovrapposte di questo, le riproduce entro 10⁻¹²; il campo condizionato all'impronta di sé non si muove: 0 al bit); dal solo bordo l'interno condizionato contiene il campo vero (⟨z²⟩ ≈ 1 su 160 mondi); bolle di mondi diversi sulla stessa regione hanno il χ² che il modello prevede (tr(C⁻¹·diag(C₁₁, C₂₂)) contro i gradi). **L'antenato comune tra luoghi e istanti diversi**, in tempo conforme: η_c = (η_p + η_q − max(0, \|Δx\| − R_p − R_q))/2, o il più vecchio se uno sta nel passato dell'altro (`bordo.js antenatoTraEventi`): nel passato di entrambi e il più recente su 400 coppie, ridà l'evento per eventi coincidenti, prima dell'inizio oltre η_p + η_q (2η₀ = 28,3 Gpc oggi; c'è solo con l'inflazione, dichiarata). Manca: più di due eventi quando non li sostiene una coppia; le impronte nel cosmo con le galassie; le distanze tra contenuti |
| C11 | Additività delle fusioni w_g(s) = Σ μ([x]) | teorema | `test_lingua_indirizzo` D (impronta, monotonia) e G (`fondi`: peso totale conservato a ogni grana, due strade fuse, doppioni contati una volta, cilindri sovrapposti rifiutati). Solo per storie decoerenti; i contenuti oltre il pianeta: manca |
| C12 | Convergenza della resa | prova | manca come prova per ogni discretizzazione |
| C13 | Cervelli di Boltzmann contati sui cammini | prova | prima stima: `test_lingua_indirizzo` H (per mondo, ordine di grandezza: ~10⁵¹ bit a favore della via evolutiva per un pianeta con acqua liquida e atmosfera). Per osservatore: manca |
| C14 | Il tempo nella bolla: stato a t qualsiasi | prova | manca sopra le particelle |
| C15 | Incollamento per impronte di bordo: ∂F_B₁ = ∂F_B₂ su ∂S₁∩∂S₂ | prova | `test_bordo` B: sul cerchio ∂S₁∩∂S₂ di due bolle sovrapposte (40 e 50 Mpc a 60 Mpc, ℓmax 7 e 9) le due impronte risommate concordano tra loro e col campo vero entro il resto oltre ℓmax che il modello dà esatto (⟨z²⟩ 0,99, 0,97, 1,04 su 160 mondi; lo scarto del disaccordo è 0,019 di quello del campo); l'impronta è l'integrale vero del campo (seconda via per quadratura, converge di ordine 1,9), pura dell'indirizzo (al bit), con il χ² giusto (1,02 per grado). Solo per densità e potenziale del campo lineare; gli altri campi di O11 mancano |
| C16 | Chapman–Kolmogorov: P_{Δt₁}∘P_{Δt₂} = P_{Δt₁+Δt₂} in distribuzione | prova | manca |

Prove della lingua stessa (`test_lingua_indirizzo`): andata e ritorno su 23 indirizzi veri (cosmo.js, bolla.js,
bolle.js, intreccio.js, eventi) e rifiuto dei non canonici; ogni indirizzo che il programma produce, anche in un cosmo
parallelo (I: bolla.js, src/tre, bolle.js, grandezze.js, il punto a caso), e le bolle salvate nella forma di prima; HEALPix (centro ↔ pixel fino all'ordine 24, figlio nel
padre, area uguale); pesi per livello che sommano a 1 (13 somme, scarto < 10⁻¹²); `puntoACaso` deterministico,
coerente con un prefisso, distribuito come `peso` (χ² su cosmo γ e δ, galassia, stella, pianeta, punto, tempo); i pesi
dei rami (E: C4); le galassie e le stelle vere (F: N come cosmo3d.js, Σ N_s = stelle vere, `puntoACaso` uniforme sulle
stelle vere, la massa di una stella vera di Kroupa nella classe); le fusioni (G: C11); i cervelli di Boltzmann (H: C13).
La patch di `eventi.js` (registro con le leggi) ha la sua prova a parte, con la patch: il registro dei tiri resta
identico su disco.js, galassie.js e un consumatore finto, e le leggi annotate sono quelle di `misura.conMisura`.
