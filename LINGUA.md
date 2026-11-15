# La lingua dell'indirizzo

Riferimento. La derivazione sta in `reports/Tesi del multiverso indirizzabile.md` (oggetti O1–O10, condizioni C1–C14);
le regole in `INTRECCIO.md` (r. 1–14). Il codice è `src/camera/lingua.js`, la prova `test/test_lingua_indirizzo.mjs`.
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

luogo     := "cosmo " N≥1 [ "/galassia " g [ "/stella " s [ "/pianeta " p
               [ "/luna " l ] [ "/" ( "punto " lon "," lat | "regione " r ) ] [ "/scala " L ] ] ] ]
resto     := tutto ciò che segue il luogo    parti non contate dalla misura («buco», «disco/embrione 12/…»)
```

- Interi senza zeri davanti; g, s, p, l sono gli indici di `cosmo.js` (da 0), l è l'`id` della luna.
- **Luogo sulla superficie: le coordinate attuali** (`bolle.js`): `punto lon,lat` in gradi, −180 < lon ≤ 180,
  −90 ≤ lat ≤ 90. Il **cilindro** che nomina è il pixel **HEALPix nested** che lo contiene, d'ordine
  k = clamp(⌈log₂(R·√(π/3)/L)⌉, 0, 24), con R il raggio del corpo e L la `scala` (o quella predefinita). Chi scrive un
  pixel ne scrive il centro con le cifre che bastano a ritrovarlo (`puntoDelPixel`).
- `regione r`: le 12 regioni della magnetosfera del numero della biblioteca (`cosmo.js`).
- `scala L`: il lato del luogo in metri (la `grandezza` di `bolla.js`).
- Un indirizzo che non comincia da `cosmo N` è un indirizzo d'evento («disco/1/3/53», «lingua/punto a caso/7»).
- La via di `cosmo.js` ({ cosmo: "1#{…}", galassia, … }) si traduce con `daVia` / `viaDi`: i rami passano dal numero
  del cosmo all'indirizzo. **Non torna oggi**: `bolla.js` (`percorsoDi`) e i luoghi dei corpi in `src/tre` scrivono
  `cosmo ${via.cosmo}`, cioè i rami dentro il nome del cosmo: in un cosmo parallelo il testo non si rilegge.

Esempio: `cosmo 1/galassia 39/stella 1618/pianeta 0/punto -69.17,0.093/scala 10000@11514352010.10819#{"disco/39/1618":2}`

## 2. Oggetti

| | Oggetto | Formula | Natura | Nel programma |
|---|---|---|---|---|
| O1 | Indirizzo = cilindro | a = (π, t, ρ); [π] = {ω ∈ ∂T : π ⊑ ω} | teorema (Cantor; Baire per l'indice del cosmo) | `intreccio.js`, `lingua.analizza` |
| O2 | Fonte del caso | κ(ε) = k₀, κ(π·b) = Φ(κ(π), b), u(π, j, r) = Ψ_κ(π)(j, r) | teorema se κ iniettiva | `eventi.js` (Threefry, chiave a 128 bit) |
| O3 | Grane e classi | M_{f←g}∘M_{g←h} = M_{f←h}; [x]_g = M_g⁻¹(M_g(x)) | teorema | `lingua.formaCanonica` (caselle annidate) |
| O4 | Riassunto/raffinamento | (M_{g←h})_# μ_{h←g}(y) = δ_y; Q_g∘M = Q_h; μ = legge di R(y, u(π·figli)) | prova per passaggio | tessere, `campo_pigro.js` |
| O5 | Nuclei per livello | κ_k(a_k \| a_<k), p_e(o \| ·) con Σ_o p_e = 1, T_g^τ | — | `lingua.js` NUCLEI (discesa); p_e **manca** |
| O6 | Bolla | B = (p, u, S, g, C); D(B) = J⁻(S); mondo ~ μ(· \| ∩C_i) | teorema (fascio) | `bolle.js`, `bolla.js` |
| O7 | Misura sui cammini | μ([π, ρ]) = w(n)·Π_k κ_k·Π_{e∈ρ} p_e; w(n) = 2^{−ℓ(n)} | w **libero** | `lingua.peso`, `puntoACaso` |
| O8 | Impronta a grana | F_g(x) = H(c(M_g(x))), H a 128 bit; w_g(s) = Σ_{F_g(x)=s} μ([x]) | teorema se decoerenti | `lingua.impronta` (pianeti); quoziente **manca** |
| O9 | Osservazione | O_{B,c} = ∫∫ R_c(λ) L(x_B, ω, λ, t_B) W(ω) dω dλ; O_g = M_pix(O_h) lineare | teorema | `src/tre` (r. 14) |
| O10 | Lettura | leggi(a) = W(a), pura; pigro = completo | teorema | ovunque (r. 8) |
| O11 | Impronta di bordo | vedi sotto | teorema / ipotesi | **manca** |
| O12 | Passo | vedi sotto | — | `lingua.distanzaRami`; il nucleo **manca** |

**O7 nel programma** (`lingua.peso`; ogni parte dice che cosa conta):

| Livello | Peso del figlio | Che cosa si conta | Natura |
|---|---|---|---|
| cosmo n | 2^{−ℓ(n)}, ℓγ(n) = 2⌊log₂n⌋+1 (`codice: 'delta'`: ℓδ = ⌊log₂n⌋+2⌊log₂(⌊log₂n⌋+1)⌋+1) | lunghezza di codice | libero |
| galassia g | M★_g / Σ M★ (`galassie: 'stelle' \| 'uniforme'`) | massa in stelle | libero |
| stella s | peso_s / Σ peso | stelle vere rappresentate dal campione (`galassie.js`) | dato del modello |
| pianeta p | (R_p² + ΣR_lune²)/Σ (`pianeti: 'massa' \| 'uniforme'`, `lune`) | superficie del sistema del pianeta | libero |
| corpo | R_c²/(R_p² + ΣR_lune²) (`corpi: 'uniforme'`) | superficie del corpo | libero |
| punto | 1/(12·4^k) | area (HEALPix, esatto) | teorema, dato k |
| regione r | 1/12 | regioni uguali | libero |
| scala | 1 | non si estrae: è la grana di chi guarda | libero |
| tempo | min(Δt, τ − jΔt)/τ, τ = vita della stella (senza stella: età del cosmo); `tempo: 'adesso'` → δ sull'oggi | durata (mai uniforme su ℕ o ℝ: teorema) | libero |
| rami | 1 | — | **manca** (C4) |

−log₂μ = somma delle parti, in bit (`peso().bit`). `puntoACaso(seme)` scende con questi nuclei dalla fonte
`lingua/punto a caso/<seme>`, un evento per livello con lo stesso nome qualunque sia il prefisso: quindi
`puntoACaso(s, { da: prefisso di puntoACaso(s) }) = puntoACaso(s)` (conosciuto un punto, il resto è definito). Il punto
scende l'albero HEALPix un figlio su quattro per ordine (uniforme esatto). La stella è condizionata ad avere pianeti
(riestratta): la costante Z = Σ peso·[ha pianeti]/Σ peso non è nel peso (stima 0,99, 0,02 bit). `specialita(a)` =
peso(a).bit contro la mediana di N punti a caso.

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
dà d; d_w **manca** (non ci sono p_e). Il passo nel tempo sopra le particelle **manca** (r. 1, r. 11).

## 3. Condizioni

| | Condizione | Natura | Prova |
|---|---|---|---|
| C1 | Trasparenza: pigro = completo, l'ordine non conta | teorema | `test_eventi` «l'ordine non conta»; `test_campo_pigro` «determinismo per indirizzo» |
| C2 | Iniettività delle chiavi: P ≈ 1 − e^{−N²/2^{b+1}} | teorema | `test_eventi` «nessuna collisione su un milione di indirizzi veri» (128 bit) |
| C3 | Qualità statistica della biiezione | prova | manca (BigCrush sul flusso vero) |
| C4 | Σ_o p_e(o) = 1 per ogni evento | teorema, dato C4 | manca |
| C5 | Kraft: Σ_n 2^{−ℓ(n)} = 1 | teorema | `test_lingua_indirizzo` «Kraft» (γ e δ, coda a 10⁶: 1,0·10⁻⁶ e 5,3·10⁻²); quanto cambiano le conclusioni tra due codici: manca |
| C6 | Zoom coerente (M)_#μ = δ, conservazione | prova | `test_coerenza`, `test_campo_pigro` «regola 4» (in parte) |
| C7 | Proiettività | teorema + prova | `test_campo_pigro` (σ₈, spettro), `test_bolle` (media e varianza) |
| C8 | Commutazione ‖M T_h μ − T_g‖, PΠ = ΠP̂ | prova | manca |
| C9 | Località causale: un ramo in e cambia solo J⁺(e) ∩ contenitore | prova | «un ramo cambia una cosa sola» in `test_disco`, `test_lune`, `test_vuoto`, `test_bolle`; `test_lingua_indirizzo` «lo stesso pianeta da due strade»; il cono di luce: manca |
| C10 | Incollamento delle bolle | teorema + prova | `test_bolle` (in parte: nel punto e nel tempo) |
| C11 | Additività delle fusioni w_g(s) = Σ μ([x]) | teorema | in parte: `test_lingua_indirizzo` D (impronta, monotonia); quoziente con i pesi: manca |
| C12 | Convergenza della resa | prova | manca come prova per ogni discretizzazione |
| C13 | Cervelli di Boltzmann contati sui cammini | prova | manca |
| C14 | Il tempo nella bolla: stato a t qualsiasi | prova | manca sopra le particelle |
| C15 | Incollamento per impronte di bordo: ∂F_B₁ = ∂F_B₂ su ∂S₁∩∂S₂ | prova | manca |
| C16 | Chapman–Kolmogorov: P_{Δt₁}∘P_{Δt₂} = P_{Δt₁+Δt₂} in distribuzione | prova | manca |

Prove della lingua stessa (`test_lingua_indirizzo`): andata e ritorno su 23 indirizzi veri (cosmo.js, bolla.js,
bolle.js, intreccio.js, eventi) e rifiuto dei non canonici; HEALPix (centro ↔ pixel fino all'ordine 24, figlio nel
padre, area uguale); pesi per livello che sommano a 1 (13 somme, scarto < 10⁻¹²); `puntoACaso` deterministico,
coerente con un prefisso, distribuito come `peso` (χ² su cosmo γ e δ, galassia, stella, pianeta, punto, tempo).
