# Come farlo emergere

Secondo documento, da leggere con «Inventario di ciò che non emerge.md» (le sigle LG1, GE5, MR2… sono le sue).
Per ogni gruppo di voci che si risolvono insieme: il meccanismo, le equazioni pronte da codificare, le fonti, il
costo in JavaScript calcolando solo dove si guarda, da che cosa dipende, che cosa resta non emergente.

**Le marche.** **[V]** verificato aprendo la fonte in questa sessione (11 novembre 2026). **[V‑prec]** verificato
nel rapporto precedente («Simulatori e modelli per stateyour.md» e le sue note): non riaperto ora, lo si cita.
**[S]** fonte secondaria, riassunto o estratto di ricerca. **[R]** ricordato: da rileggere sulla fonte collegata
prima di scrivere il numero nel codice. Le licenze [V] sono lette dal file nel repository.

**Siti non raggiungibili dal proxy in questa sessione**: `romps.berkeley.edu`, `core.ac.uk` (403),
`www2.boulder.swri.edu` (503), l'API di GitHub (solo i file grezzi `raw.githubusercontent.com` passano). Dove una
formula stava lì è marcata [S] o [R], e lo si dice.

**Che cosa non si rifà qui.** Stelle dopo la sequenza principale (Hurley), opacità (OPAL/Ferguson), feedback delle
galassie (SAGE, Moster), i quattro freni dei giganti, urti e bombardamento (Genda, Leinhardt, Marchi), maree
(Leconte), anelli (Salmon), interno a due equazioni (Driscoll–Barnes), dinamo (Olson–Christensen), tettonica
(Tectonics.js, Cortial, Sapoval), aria (Held–Suarez, Smith–Barstad), ciclo del carbonio (Foley, Krissansen‑Totton),
fiumi (FastScape, Barnes), correnti e maree, onde e ottica del mare, particelle nella materia (PDG, NIST), dati
nucleari, acqua molecolare, vita, generatore a contatore: sono nel rapporto precedente con formule e fonti. Qui le
si richiama con [V‑prec] e si aggiunge ciò che mancava o era [R].

---

## 1. Il tempo: una storia del pianeta che tutti leggono

**Voci:** G1, LG24, LG25, MR2, MR3, TT9, GE2, CH7, OR1, GE22, CS27. È il blocco che sblocca di più: oggi stella,
calore interno, aria, continenti e orbita sono quelli di oggi per tutta la storia.

**Il meccanismo.** I livelli lenti (stella, interno, carbonio, orbita, rotazione) obbediscono a poche equazioni
differenziali ordinarie accoppiate; i livelli veloci (clima, aria, mare, erosione) stanno in equilibrio con loro in
ogni istante (regola 6). Basta integrare le lente una volta (qualche centinaio di passi sull'età del pianeta) e
salvare la traiettoria: `storia(t) → { L, XUV, q, T_m, T_c, pCO2, acqua in superficie, giorno, obliquità, e }`.
Poi clima, erosione e mare si calcolano **a un tempo t** leggendo quella riga, e l'oggi è solo `t = età`.

**Le equazioni (tutte già disponibili).**
- Stella: `L(t)` da `stelle.stella(M, {Z, eta: t})` (già nel programma: Sole giovane −27%).
- Ultravioletto estremo e raggi X [S: [arXiv:1308.0190](https://arxiv.org/pdf/1308.0190), [1306.0973](https://arxiv.org/pdf/1306.0973), che citano Ribas e altri 2005]:
  `F_XUV(1 UA, t) = 4,64·(t/4,56 Ga)^(−1,23) erg cm⁻² s⁻¹` (1–1200 Å), costante («saturo», ~100 volte oggi) prima
  di 0,1 Ga. Per le altre stelle: `L_X ∝ M*^1,5` [V: [Owen e altri 2012](https://ar5iv.labs.arxiv.org/html/1112.1087), §7.1], `L_XUV ∝ L*^0,4` [V‑prec: Zahnle e Catling 2017].
- Fuga dell'aria limitata dall'energia [V‑prec, VPLanet]: `dM/dt = ε·π·F_XUV·R_p·R_XUV² / (G·M_p·K_tide)`, ε ≈ 0,1.
  Sostituisce la soglia di Jeans (LG8) per l'idrogeno e l'acqua dei mondi caldi.
- Interno [V‑prec, Driscoll e Barnes 2015]: `M_m·c_m·dT_m/dt = Q_cmb + Q_rad(t) + Q_mareale − Q_conv − Q_fuso`,
  `Q_conv = A·k·(α·g/(Ra_c·κ))^β·(ε·ΔT_m)^(β+1)·ν(T_m)^(−β)`, β = 1/3; nucleo con `Q_cmb`. `Q_rad(t)` è
  `leggi.caloreDellaRoccia(t)` × massa del mantello. `q(t)` alla superficie ne esce (GE2), e con lui il flusso al
  nucleo che decide la dinamo (GE4, GE5).
- Carbonio [V‑prec, Foley 2015; Krissansen‑Totton e Catling 2017]: un serbatoio aria+mare `R` (mol):
  `dR/dt = F_vulc(q) − F_alt`, `F_alt = F_s·[1 − exp(−F_k/F_s)]`,
  `F_k = F*·(pCO2/p*)^0,55·(P_sat/P_sat*)^0,3·exp[(E_a/R)(1/T* − 1/T)]·(f_terre/0,3)`, E_a = 42 kJ/mol; `F_s` è il
  limite di rifornimento (erosione fisica massima × terre emerse). pCO2 dalla legge di Henry sul serbatoio.
  Nel programma `chimica.co2DelCiclo` fa già il pareggio a regime: qui lo si integra nel tempo, con `f_terre(t)`
  dalla tettonica e l'erosione fisica da `geologia.erosione`.
- Orbita e asse [R: Laplace–Lagrange; Laskar]: gli elementi `(e, ϖ, i, Ω)` di N pianeti evolvono come somma di N
  modi propri: `e_j·exp(iϖ_j) = Σ_k E_jk·exp(i(g_k t + β_k))`, con `g_k` autovalori della matrice
  `A_jj = n_j/4·Σ_k (m_k/M*)·α_jk·ᾱ_jk·b^(1)_{3/2}(α_jk)`, `A_jk = −n_j/4·(m_k/M*)·α_jk·ᾱ_jk·b^(2)_{3/2}(α_jk)`
  (b: coefficienti di Laplace). `impatti.js` ha già questa teoria per i sassi: va estratta in `orbite.js`. L'asse
  precede con `dψ/dt = −α·cos ε`, `α = (3/2)(n²/ω)(J₂/λ)(1 − e²)^(−3/2)` [R, già nelle note]. Da qui i cicli di
  Milanković di ogni pianeta, gratis.
- Rotazione: `rotazione.js` integra già la frenata; deve solo restituire `giorno(t)` invece del solo valore finale.

**Il clima a un tempo t.** `bilancioPerFasce` (un millisecondo) con `S0(t)`, `τ(pCO2(t), …)`, `obliquità(t)`,
`e(t)`. **L'isteresi diventa storia**: lo stato iniziale non è più `Tavvio` scelto (LG24) ma lo stato al passo
prima; una palla di neve è un ramo in cui il pianeta è entrato davvero, e ne esce quando la CO₂ dei vulcani si è
accumulata (il termostato di CH7 smette di essere una bisezione).

**Costo.** ODE lente: ~500 passi × microsecondi = meno di un millisecondo per pianeta. Clima per fasce a ogni
passo: 500 × 1 ms = 0,5 s (si può fare a 50 tempi e interpolare: 50 ms). Memoria: 500 righe × 12 numeri.
La mappa (clima 64×32, aria, erosione) si calcola solo al tempo che si guarda, come ora.

**Da che cosa dipende.** Niente di nuovo: tutti i pezzi ci sono. Tocca `cosmo.js sistema()` (l'ordine dei calcoli,
CS13) e le firme di `clima`, `climaEAria`, `interno`.

**Che cosa resta non emergente.** I coefficienti di scala della convezione (A, Ra_c), la viscosità di riferimento
del mantello, ε della fuga, i 0,55 e 0,3 dell'alterazione: misurati, non derivati. La storia dei continenti
`f_terre(t)` viene da `tettonica.js`, che oggi non la restituisce (TT10): fino ad allora è una curva.

## 2. Clima, serra, aria e mare come un solo sistema

**Voci:** LG12–LG21, CH5, CH6, GE9, MR1, MT9, LG22.

**La serra senza tarature (CH5, LG20, LG21).** Il meccanismo è il trasporto della radiazione infrarossa riga per
riga; il modello ridotto pubblicato che lo conserva è una **tabella** `OLR(T, pCO2, p)` e `albedo(T, pCO2, zenit,
albedo del suolo)` calcolata una volta con un codice radiativo‑convettivo. HEXTOR (MIT) le distribuisce: tabelle
HDF5 sotto `model/radiation/`, quelle storiche a 1 bar e quelle risolte in pressione; niente H₂; l'angolo dove la CO₂
condensa (fCO₂ ≥ 0,41, T ≤ 230 K) è escluso dalle tabelle a 1 bar [V: [README di HEXTOR](https://raw.githubusercontent.com/BlueMarbleSpace/hextor/master/README.md); V‑prec per la licenza e per le 1748 voci]. In JavaScript: interpolazione
trilineare, nanosecondi. Per arie che la tabella non copre (H₂, CH₄ denso, Titano) serve rigenerarla: AGNI è un
radiativo‑convettivo aperto con licenza Apache‑2.0 [V: [LICENSE](https://raw.githubusercontent.com/nichollsh/AGNI/main/LICENSE.txt)]; PyRADS è MIT [V‑prec]. Strumento: `strumenti/tabella_serra.mjs` che legge l'uscita di
uno di questi e scrive `serra_tabella.js`, come `stelle_tabella.js`.
- Limite del vapore (LG21): non 282 W/m² fissi ma i limiti di Kopparapu per 0,1, 1 e 5 masse terrestri
  (S_eff☉ = 0,99, 1,107, 1,188 più i polinomi in T_eff) [V‑prec], interpolati in log g: la gravità entra.
- Che cosa si perde: le nuvole (restano LG15, MT4), la struttura verticale.

**Il calore portato (LG16) e l'accoppiamento a metà (GE9, MT9).** Per le fasce: `D = D₀·(p/p₀)·(c_p/c_p0)·(m₀/m)²·
(Ω₀/Ω)^(4/5)·(R₀/R)^(6/5)`, D₀ = 0,58 W m⁻² K⁻¹ [V‑prec: Williams e Kasting; Vladilo e altri 2015]. Sulla mappa il
meccanismo c'è già (`meteo.trasportoCalore`): il difetto è che clima e aria fanno due giri invece di convergere.
Rimedio a costo zero di fisica: iterare `climaSuperficie ↔ meteoPianeta` fino a che `Tglobale` cambia meno di 0,5 K
(tipicamente 3–4 giri invece di 2: +4 s per pianeta), usando il flusso W/m² di `meteo` come termine di sorgente e
non come diffusività media.

**Il mare che torna al clima (MR1).** `mare.js` produce già `caloreDalMare` (W/m² sulla griglia del clima) e
`albedo` (acqua 0,07, ghiaccio marino 0,60). Si aggiungono a `climaSuperficie` come sorgente e come albedo delle
celle di mare, e si rifà un giro. Niente formula nuova: è un filo. Costo: un giro di clima in più (0,3 s).
Lo strato rimescolato (LG12 ↔ MR9): profondità di Monin–Obukhov `L = u*³/(κ·B₀)` con `u*` dall'attrito del vento
di `meteo` e `B₀ = g·α·Q/(ρ·c_p)` il flusso di galleggiamento [R: Kraus e Turner 1967; Price, Weller e Pinkel 1986];
la capacità termica del mare è `ρ·c_p·h_misto` invece di 10⁸.

**Le albedi (LG13) e i giganti (LG22):** vedi §10 (luce) e §14.

**Che cosa resta.** Le nuvole: nessun modello ridotto le ricava; la letteratura le parametrizza (umidità critica)
o le risolve a 1 km. Si tiene Sundqvist dichiarato come legge empirica, ma si toglie la taratura `nuvoleMassime ×
riflessoNuvole` sulla Terra lasciando che copertura e spessore ottico vengano dalla colonna d'acqua di `meteo`.

## 3. Interno, struttura, dinamo, regime della crosta, vulcani

**Voci:** GE1–GE8, GE13, DS6, TT1–TT9, TT13, RO2, LU10, CH8, MA7.

**Raggio e struttura dalla materia (DS6, GE3).** Equilibrio idrostatico con un'equazione di stato:
`dm/dr = 4πr²ρ`, `dP/dr = −G·m·ρ/r²`, `ρ(P) = ρ₀ + c·P^n` (P in Pa, ρ in kg/m³) [V: [Seager e altri 2007](https://ar5iv.labs.arxiv.org/html/0707.2895), eq. 1–2 e 11, tab. 3]:

| materiale | ρ₀ | c | n |
|---|---|---|---|
| Fe | 8300 | 0,00349 | 0,528 |
| MgSiO₃ (perovskite) | 4100 | 0,00161 | 0,541 |
| (Mg,Fe)SiO₃ | 4260 | 0,00127 | 0,549 |
| H₂O (ghiaccio VII–X) | 1460 | 0,00311 | 0,513 |
| C (grafite) | 2250 | 0,00350 | 0,514 |
| SiC | 3220 | 0,00172 | 0,537 |

Accuratezza 2–5% sotto 5·10⁹ Pa e sopra 3·10¹³ Pa, 1–12% in mezzo [V, ivi]. Controllo in forma chiusa: per un corpo
di un solo materiale `log₁₀ R_s = −0,20945 + ⅓·log₁₀ M_s − 0,0804·M_s^0,394` con `M_s = M/m₁`, `R_s = R/r₁`
(Fe: 5,80 M⊕, 2,52 R⊕; MgSiO₃: 10,55, 3,90; H₂O: 5,52, 4,43), valida per M_s < 4 entro l'1% [V, ivi, eq. 23, tab. 4].
Integrazione a strati (ferro, roccia, acqua nelle proporzioni di `composizione`): 200 gusci, Runge–Kutta, tiro sul
raggio: ~0,1 ms per pianeta. Ne escono `R`, `ρ(r)`, `P(r)`, `g(r)`, il raggio del nucleo, il momento d'inerzia
(oggi 0,33 fisso in `impatti.js`): un **interno come luogo** (H15) e la fine della legge M^0,27.
Resta: l'equazione di stato è un fit; l'involucro di gas (velo, giganti) chiede un'altra equazione (§14).

**Calore e dinamo (GE2, GE4, GE5).** Le due equazioni del §1 danno `q(t)` e il flusso al nucleo `F_c`. Campo:
`M = 4π·R_c³·γ_d·√(ρ/(2μ₀))·(F_c·D_c)^(1/3)`, γ_d = 0,2; dipolare se il numero di Rossby locale
`Ro_l ≈ 0,58·Ra_Q^(1/2)·E^(−1/3)·Pr^(1/5)·Pm^(−1/5) < 0,12`, altrimenti multipolare e ≥ 10 volte più debole
[V‑prec: Olson e Christensen 2006]. `E = ν/(Ω·D_c²)` contiene il giorno: **il filo `rotazione → interno`**. La dinamo
si spegne quando `F_c` scende sotto il flusso che l'adiabatica porta per conduzione (non una soglia su q e R).

**Il regime della crosta (GE6, TT8, TT13).** Nessun criterio condiviso [V‑prec]; il modello ridotto è un indice di
mobilità continuo: rapporto tra lo sforzo convettivo `σ ≈ η·v/δ` e la resistenza della litosfera `σ_y ≈ μ·ρ·g·z`
ridotta dall'acqua nei pori; cala con la temperatura di superficie (Foley e Bercovici). Così `T_superficie(t)` del
§1 entra nella tettonica. Velocità delle placche (TT3): `v ≈ (κ/d)·(Ra/Ra_c)^(2/3)` [R: teoria dello strato limite,
Turcotte e Schubert], non 4 cm/anno × q².

**Profondità degli oceani con l'età (TT4):** raffreddamento del semispazio,
`w(t) = w₀ + 2·ρ_m·α·(T_m − T_s)/(ρ_m − ρ_w)·√(κ·t/π)` [R: Turcotte e Schubert, cap. 4]; con ρ_m = 3300, α = 3·10⁻⁵
K⁻¹, ΔT = 1300 K, κ = 10⁻⁶ m²/s dà ~350 m/√Ma: la costante terrestre esce da T_m di quel pianeta.

**Quanta roccia fonde, e dove (GE7, GE13, CH8, RS3).** Fusione per decompressione sotto le salite del mantello:
solido secco `T_s = 1085,7 + 132,9·P − 5,1·P²`, liquidus della lherzolite `1475 + 80·P − 3,2·P²`, liquidus
`1780 + 45·P − 2,0·P²` (°C, P in GPa); frazione fusa `F = [(T − T_s)/(T_l^lherz − T_s)]^1,5` finché c'è
clinopirosseno (17% in massa) [V per i numeri, letti nel sorgente di pyMelt (GPL‑3: non copiare il codice):
[katz.py](https://raw.githubusercontent.com/simonwmatthews/pyMelt/master/pyMelt/lithologies/katz.py); la forma di F
è [R] da Katz, Spiegelman e Langmuir 2003]. Con l'adiabatica del mantello a `T_m(t)` dà spessore della crosta
basaltica e flusso di magma = (velocità di risalita) × ∫F dz: sostituisce `crosta = 0,004·√q`, `vulcani = q/0,02`,
`F_BASALTO = 0,1`. I vulcani stanno dove `tettonica.mantello()` sale (il campo c'è già: va esportato).

**Attrito di marea dei pianeti (RO2, LU10):** corpo di Maxwell/Andrade con la viscosità del mantello a `T_m`:
`k̃₂(ω) = (3/2)/[1 + 19·μ̃(ω)/(2·ρ·g·R)]` (la stessa formula elastica di `lune.js`, con la rigidezza complessa `μ̃(ω) = μ·iωη/(μ + iωη)`; l'attrito è `−Im k̃₂`) [R: Henning e altri 2009]; lega k₂/Q alla
temperatura interna e alla frequenza, e chiude l'anello marea ↔ calore (Io) con la stessa equazione del §1
(`Q_mareale`). La marea oceanica di `mare.js` (già calcolata bacino per bacino) si somma come dissipazione.

**Costo.** Microsecondi–millisecondi per pianeta. **Dipende da:** §1. **Resta:** viscosità di riferimento e sua
energia di attivazione (misurate su olivina); il mantello come equazione di forma (TT1) resta finché non si passa a
placche rigide su sfera (adozione 9 del rapporto precedente).

## 4. Il disco, i pianeti, le lune

**Voci:** DS1–DS18, IM7, IM8, LU2–LU8, RO1, CS10.

**Il disco che evolve invece di un profilo imposto (DS1, DS3, DS4).**
`∂Σ/∂t = (3/r)·∂/∂r[ r^½·∂/∂r(ν·Σ·r^½) ]`, `ν = α·c_s·h` [V: [Armitage, lezioni](https://ar5iv.labs.arxiv.org/html/astro-ph/0701485), eq. 59, 81]. Per `ν ∝ r^γ` c'è la soluzione chiusa
`Σ(r, t) = C/(3π·ν₁·r̃^γ)·T^(−(5/2−γ)/(2−γ))·exp(−r̃^(2−γ)/T)`, `r̃ = r/r₁`, `T = 1 + t/t_s`,
`t_s = r₁²/[3(2−γ)²·ν₁]` [V, ivi, eq. 68–69]. Con γ = 1: Σ ∝ 1/r dentro r₁ e taglio esponenziale fuori: profilo e
bordo non sono più `r^−1,5` fino a `30·√M`. La temperatura: riscaldamento viscoso
`T⁴ = 3·G·M*·Ṁ/(8π·σ·r³)·(1 − √(r*/r))` [V, eq. 77] più irraggiamento (`T ∝ r^(−1/2)` per un disco svasato [V]);
la **linea della neve** è dove T(r, t) = 150–180 K [V], e si sposta verso l'interno mentre Ṁ cala (DS4).
Il gas finisce per fotoevaporazione: da raggi X `Ṁ_w ≈ 8·10⁻⁹·(L_X/10³⁰ erg s⁻¹) M☉/anno`, senza dipendenza
esplicita dalla massa, con `L_X ∝ M*^1,5` [V: [Owen e altri 2012](https://ar5iv.labs.arxiv.org/html/1112.1087), eq. 9]; da EUV
`Ṁ ≃ 4·10⁻¹⁰·(Φ/10⁴¹ s⁻¹)^½·(M*/M☉)^½ M☉/anno`, oltre `r_g = G·M*/c_s²` (≈ 9 UA per il Sole) [V: Armitage, eq.
98–99]. La **vita del disco** è il tempo in cui l'accrescimento viscoso scende sotto `Ṁ_w`: esce da α, dalla massa
e da L_X, non da un'esponenziale sorteggiata (DS3).
Restano liberi: α (10⁻⁴–10⁻²: la turbolenza del disco non si ricava), massa e raggio iniziali `r₁` (vengono dal
momento angolare del nucleo di nube: H3, §6).

**Migrazione (DS16).** Momento torcente su un pianeta piccolo, non saturato, con ammorbidimento b = 0,4 h:
`γ·Γ/Γ₀ = −2,5 − 1,7β + 0,1α_Σ + 1,1·(3/2 − α_Σ) + 7,9·ξ/γ`, `Γ₀ = (q/h)²·Σ_p·r_p⁴·Ω_p²`, con `Σ ∝ r^(−α_Σ)`,
`T ∝ r^(−β)`, `ξ = β − (γ − 1)·α_Σ`, q = M_p/M*, h = H/r [V: [Paardekooper e altri 2010](https://ar5iv.labs.arxiv.org/html/0909.4552), eq. 5, 8, 47]; localmente isotermo `Γ/Γ₀ = −0,85 − α_Σ` (β = 0) [V, eq. 48]. Velocità: `da/dt = 2Γ/(M_p·a·Ω)`.
(Nel rapporto precedente era [R]: ora è verificata.) I Giovi caldi e le catene in risonanza escono da qui.

**Crescita, giganti, urti (DS7–DS10, DS14).** Già nel rapporto precedente con le formule: massa di isolamento dei
ciottoli di Bitsch, Kelvin–Helmholtz di Ikoma, gap di Kanagawa, criterio di Petit–Laskar–Boué, Genda [tutti
V‑prec]. Aggiunta: `disco.js` decide «fusione o fionda» con un sorteggio (DS14) mentre `impatti.js` ha già la
velocità critica di Genda: usare quella.

**I tipi (DS12, LG11, LU6).** Non serve ricerca: si tolgono. Chi oggi chiede `tipo === 'roccioso'` chieda la
grandezza che gli serve: frazione di ghiaccio (continua) per l'acqua in superficie, presenza di un involucro di gas
per le lune da disco, `Im(k₂)` per le maree. Il nome resta solo come etichetta del pannello.

**L'acqua consegnata (DS11, IM8, LG10).** `impatti.js` segue già le nubi di corpi con la loro frazione di ghiaccio:
l'acqua di un roccioso = Σ (massa caduta × ghiaccio) dalle classi che lo colpiscono, meno la parte persa nell'urto.
La parte che esce in superficie (LG10: 4%) viene dalla solubilità dell'acqua nel fuso dell'oceano di magma e dal
degassamento vulcanico integrato (flusso di magma del §3 × contenuto d'acqua): [R: Elkins‑Tanton 2008, già citato in
`mare.js`].

**Le lune regolari (LU2–LU4).** Equilibrio tra solidi che arrivano e lune che cadono per migrazione:
`M_T/M_P ≈ 2,5·10⁻⁴·(1/χ)·(3,5/C_a)^(4/9)·[(H/r)/0,1]^(10/9)·[(α/f)/3·10⁻⁵]^(1/3)` [R: Canup e Ward 2006, eq. 3;
il PDF non era raggiungibile; l'abstract conferma solo «~10⁻⁴ per equilibrio tra afflusso e decadimento orbitale»
[S]]. La temperatura del disco del pianeta: luminosità di accrescimento `L = G·M_P·Ṁ/R_P` nella stessa formula
viscosa di sopra, non «1300 K tarati su Giove». L'ultima generazione rimasta e quella perduta (AN3) escono dalla
stessa storia.

**Costo.** La soluzione chiusa del disco costa come ora; con migrazione e ciottoli l'integrazione degli embrioni è
~10⁴ passi × 30 corpi = millisecondi. **Dipende da:** §6 per le condizioni iniziali; `stelle.js` per L_X.
**Resta:** α, l'efficienza dei ciottoli, e tutto ciò che un N‑corpi vero farebbe (caos delle orbite: si resta con
criteri di stabilità + eventi).

## 5. Il cosmo e le galassie

**Voci:** CS1–CS6, CS26, GX1–GX15, H1, H2, I1.

**Un campo solo (CS1–CS3, CS6, GX6).** Il meccanismo c'è già in `cosmo3d.js`: campo gaussiano con lo spettro vero
(BBKS + Sugiyama, σ₈), realizzazione vincolata, moti lineari, assi dalle coppie mareali. Il difetto è l'ordine: la
carta di `cosmo.js` (70 onde a k^−1,25, soglia a 0,9 σ, galassie in più a probabilità) è la fonte, e il campo 3D le
è adattato. Va rovesciato: **il campo 3D è la fonte**; le galassie sono i suoi picchi (massimi locali del campo
filtrato alla scala di massa M, altezza ν = δ/σ(M)); la carta è la sua proiezione. La teoria dei picchi dà quanti
[R: Bardeen, Bond, Kaiser e Szalay 1986]; la funzione di massa di Press–Schechter/Sheth–Tormen (già usata per la
nebbia) dice quanti aloni veri rappresenta ognuno. Lo spin non si sorteggia per metà (GX6): è
`L_i ∝ ε_ijk·T_jl·I_lk` che `cosmo3d` calcola già.
Costo: 28 960 onde, ~40 ms per costruire il campo (misurato in `cosmo3d.js`); trovare i picchi su 64³: ~10 ms.

**Sotto i 50 Mpc: gruppi, ammassi, vicini veri (H1, CS26, GX5).** Raffinamento condizionato: nella regione che si
guarda si aggiungono le onde con k > k_max come campo gaussiano a media nulla (stesso spettro), con semi per
indirizzo di ottante: è il metodo di Panphasia [V‑prec]. Regola 4: la media del figlio è la madre. Le fusioni non
si estraggono più da una legge del ritmo con «compagni che non ci sono più» (GX5): l'albero si genera con
l'algoritmo di Parkinson, Cole e Helly (G₀ = 0,57, γ₁ = 0,38, γ₂ = −0,01) [V‑prec], condizionato alla massa
finale e con gli eventi all'indirizzo della galassia; i satelliti rimasti sono le galassie nane vicine (oggi
assenti).
Costo: un albero fino a 10⁸ M☉ per un alone di 10¹²: ~10³–10⁴ nodi, millisecondi. Che cosa si perde rispetto a un
N‑corpi: le posizioni dei satelliti (si rimettono con l'attrito dinamico che `galassie.js` ha già).

**Raffreddamento, feedback, elementi (I1, GX3, GX11, GX15).**
- Λ(T, Z): sostituire il raccordo «a memoria» con una tabella. Grackle ha licenza «Enzo Public License» (stile
  BSD) [V: [LICENSE](https://raw.githubusercontent.com/grackle-project/grackle/main/LICENSE)] e distribuisce tabelle
  di CLOUDY; le tabelle di Sutherland e Dopita 1993 sono il riferimento dei modelli semi‑analitici [S]. Una curva
  Λ(T) a 5 metallicità × 90 temperature è 450 numeri.
- Aloni piccoli con troppe stelle: espulsione ∝ V_SN²/V_vir² e reionizzazione [V‑prec: SAGE]. Bersaglio: Moster.
- Un elemento per volta: integrare fuori linea le rese di NuPyCEE (BSD) [V: [LICENSE](https://raw.githubusercontent.com/NuGrid/NuPyCEE/master/LICENSE)] sulla IMF e salvare «resa per elemento in funzione di
  tempo e Z» (pochi kB) [V‑prec per l'idea]. Così O, Mg, Si, Fe, C, N hanno storie diverse (α/Fe), e **U e Th**
  (elementi r: stelle di neutroni che si fondono, ritardi come le Ia) non seguono più √Z (LG7, MA7): il calore
  interno dei pianeti dipende da dove e quando è nata la stella. Resta incerta la sorgente degli elementi r [R].

**Che cosa resta.** Le ~30 leggi di `galassie.js` (GX1) sono scorciatoie di idrodinamica + N‑corpi che non si
possono rifare in JavaScript; la regola 2 chiede di poterle controllare «su un campione piccolo»: l'unico
controllo praticabile è contro tabelle pubblicate (Moster, relazione massa–metallicità, Kennicutt). I parametri del
cosmo (LG1) restano misurati.

## 6. Le stelle: ciò che manca attorno alla sequenza principale

**Voci:** ST1–ST14, LG4–LG6, H3, H4, H6–H10, DS2, GX9, GX13, MA2.

**Doppioni da togliere (LG4, LG5).** `mare.js` e `risalita.js` importano ancora `leggi.stella`: passare a
`stelle.stella`. Nessuna ricerca.

**Dopo la sequenza principale (ST9, CS10).** Formule SSE di Hurley [V‑prec]: `L = min(B·M_c^q, D·M_c^p)`,
`dM_c/dt = A_H·L`, Reimers, nane bianche, resti di Fryer. Il raggio della gigante decide chi è inghiottito
(non 1,5 UA fissi) insieme alla marea.

**La distribuzione delle masse (LG6) e l'ambiente di nascita (H3, DS2, DS3).** **La scienza non la ricava dai
principi**: la rassegna di riferimento elenca teorie in gara (frammentazione turbolenta, accrescimento competitivo,
frenamento magnetico) e la lascia aperta [V, abstract: [Offner e altri 2014](https://arxiv.org/abs/1312.5326)].
Il miglior modello ridotto: una nube turbolenta ha densità log‑normale (larghezza `σ² = ln(1 + b²·ℳ²)`, ℳ numero
di Mach, b ≈ 0,3–1) e i frammenti che superano la massa di Jeans locale `M_J ∝ T^(3/2)·ρ^(−1/2)` collassano; la
coda alta è una legge di potenza con pendenza vicina a quella di Salpeter [R: Padoan e Nordlund 2002; Hennebelle e
Chabrier 2008]. Lascia fuori: perché il picco sta a 0,2–0,3 M☉ quasi ovunque (retroazione radiativa). Per
stateyour: tenere Kroupa come legge misurata **ma** aggiungere il livello che manca, perché è lui a collegare:
- le stelle nascono in **ammassi** con masse distribuite come `dN/dM_cl ∝ M_cl^−2` e si disperdono in ~10–100 Ma
  [R: Lada e Lada 2003]; `galassie.js` ha per anello e per passo la massa nata: basta spartirla in ammassi (eventi);
- dall'ammasso vengono: le compagne (sotto), l'irraggiamento ultravioletto dei vicini massicci che accorcia la vita
  del disco (DS3), i radionuclidi a vita breve (²⁶Al) che decidono se i planetesimi fondono e perdono l'acqua, gli
  incontri che troncano il disco (DS1: `r₁`). Massa e raggio del disco: dal momento angolare del nucleo
  (`j = β_rot·…`, rapporto tra energia di rotazione e di gravità misurato ~0,02 [R: Goodman e altri 1993]) con
  `r_c = j²/(G·M)`.

**Le doppie (ST13, H8).** Statistiche misurate, non derivate: 44 ± 2% delle stelle di tipo solare ha compagne; i
periodi sono circa log‑normali con picco a ~300 anni (~50 UA); i rapporti di massa quasi piatti; la frazione
multipla cresce con la massa, da ~20% (nane M tarde) a ~50% (solari) a oltre 90% (O e B) [S: estratti di
[Raghavan e altri 2010](https://arxiv.org/abs/1007.0414), [Moe e Di Stefano 2017](https://ar5iv.labs.arxiv.org/html/1606.05347), [Offner e altri 2023](https://arxiv.org/html/2203.10066v3)]. Il meccanismo (frammentazione del
nucleo e del disco) non ha un modello ridotto affidabile: si entra con la legge misurata, come evento
all'indirizzo della stella. Da lì: troncamento del disco a ~⅓ della separazione, pianeti circumbinari, e le Ia come
coppie vere invece della legge dei ritardi. Evoluzione delle coppie: BSE (formule pubblicate) [V‑prec per SSE; R per BSE].

**Attività, vento, rotazione (ST8, ST12, ST14, H7, RS5, MA2).**
- Rotazione: `dΩ/dt ∝ −Ω³` per le stelle lente (Skumanich, P ∝ √t), saturazione sotto un numero di Rossby critico
  [R: Matt e altri 2015]. Il campo: `B ∝ Ro^−1` fino alla saturazione [R]. Così `c('campo')` non è un sorteggio.
- XUV: §1. Vento: `Ṁ ∝ F_X^1,34` (Wood) [R, già in `risalita.js`].
- Raggi cosmici alla stella (MA2): la modulazione è più forte per stelle giovani e attive; il modello ridotto
  pubblicato è il «campo di forza» con un potenziale che scala col vento e col campo
  [S: [Rodgers‑Lee e altri 2020](https://arxiv.org/pdf/2009.02173), [2021](https://arxiv.org/abs/2103.15460)];
  la formula di scala non è stata letta: da prendere lì.
- Macchie, brillamenti, granulazione come cose viste: la taglia dei granuli è ~altezza di scala di pressione alla
  fotosfera (`H_p = kT/(μ m_H g)`, che `stelle.js` ha); le macchie coprono una frazione che cresce con `Ro^−1` [R].

**I resti come luoghi (H9, H10).** Il motore delle particelle regge campi qualsiasi: una regione attorno a una
pulsar è un dipolo con `B·R²` conservato (già in `stelle.fine`) che ruota (campo elettrico indotto `E = −(Ω×r)×B`:
manca nel motore, MN4). Dischi di accrescimento: `T(r)` della formula viscosa del §4 con `Ṁ` di Eddington × la
frazione che `galassie.js` ha già. Costo trascurabile; è lavoro di collegamento.

**Resta:** α della convezione (ST1), la IMF, le statistiche delle doppie, la dinamo stellare.

## 7. Il paesaggio: dai continenti al granello

**Voci:** GE10–GE28, TT7, CH13, RC1–RC10, MA8, H16, H17, H19–H21.

**Un orologio per l'erosione (GE22, GE23, TT7).** L'equazione è quella di FastScape [V‑prec]:
`∂h/∂t = U − K_f·A^m·S^n + (G/A)·∫(U − ∂h/∂t)dA + K_d·∇²h`, con il passo implicito di Braun e Willett. Per avere
anni veri: A in m² × pioggia di `meteo` (m/anno) = portata; `K_f` in unità vere, dipendente dalla roccia
(litologia da `chimica.minerali`: basalto e granito differiscono di un ordine di grandezza [R]); `U` dalla
`spinta` della tettonica in m/anno. Le due erosioni (TT7 e `geologia.erosione`) diventano una: la tettonica chiama
l'erosione a ogni suo passo grosso, con il clima di quel tempo (§1). La denudazione media che ne esce **è**
`ROCCE.denudazione` (CH13): il filo erosione → alterazione → sali del mare e CO₂.

**Suolo e pendii (H20, GE19, GE21).** Produzione di suolo dalla roccia: `w = w₀·exp(−H/w*)`; flusso di suolo:
`q_s = −K·H*·∇η·[1 + (S/S_c)² + (S/S_c)⁴ + …]·[1 − exp(−H/H*)]` [V: sorgente di Landlab (MIT):
[exponential_weathering.py](https://raw.githubusercontent.com/landlab/landlab/master/src/landlab/components/weathering/exponential_weathering.py), [hillslope_depth_dependent_taylor_flux.py](https://raw.githubusercontent.com/landlab/landlab/master/src/landlab/components/depth_dependent_taylor_soil_creep/hillslope_depth_dependent_taylor_flux.py); Ganti e altri 2012; Johnstone e Hilley 2014]. Valori terrestri tipici w₀ ~ 10⁻⁴ m/anno,
w* ~ 0,5 m, S_c ~ 0,6–1,2 [R: Heimsath 1997; Roering 1999]: sono misure; w₀ dovrebbe venire dalla velocità di
dissoluzione che `chimica.MINERALI_ROCCIA` ha già. Lo spessore di suolo H diventa un campo della tessera: è il
`secchio` di `meteo` (MT2), la sede dell'alterazione, la distinzione roccia nuda/coperta nello zoom (RC1). Oltre
S_c il pendio frana: le frane sono eventi (indirizzo della cella) con volume dalla massa sopra l'angolo critico.

**Ghiaccio che scorre (H17).** Bilancio di massa (neve di `meteo` − fusione) più flusso:
`q = −[2A/(n+2)]·(ρ g)^n·H^(n+2)·|∇s|^(n−1)·∇s`, n = 3 (legge di Glen), A ≈ 1–2,4·10⁻²⁴ Pa⁻³ s⁻¹ per ghiaccio
temperato, con dipendenza di Arrhenius dalla temperatura [R per il prefattore e per A: Cuffey e Paterson; la
ricerca ha trovato solo valori sparsi, 1,3·10⁻²⁴ in un articolo [S]]. L'alternativa economica è la «potenza del
flusso di ghiaccio» di Hergarten [V‑prec]. Erosione glaciale ∝ velocità di scivolamento. Livello del mare: il
ghiaccio sottrae acqua a `acquaKg`. Costo: come l'erosione fluviale, sulla stessa griglia.

**Dune (H19, MT14).** Soglia di Bagnold `u*_t = A·√[(ρ_p − ρ_f)·g·d/ρ_f]`, A ≈ 0,1; flusso `Q ∝ (ρ_f/g)·u*³`
[R: Bagnold 1941]; forma: automa di Werner [V‑prec per l'idea, R per le regole]. Ingressi veri: vento e densità
dell'aria di `meteo`, sabbia dalla tessera (sotto). Su Marte, Titano, Venere cambiano ρ_f e g: le dune escono
diverse da sole.

**Coste, carsismo, delta.** Coste: automa di Sapoval [V‑prec]. Delta: il termine G di FastScape li dà già.
Carsismo: dove la roccia è calcare (serve la litologia), dissoluzione ∝ deflusso × (saturazione mancante), con le
costanti che `mare.js` ha (calcite); grotte come vuoti lungo le fratture: non c'è un modello ridotto compatto [R].

**Che roccia c'è (RC1, RC2, MA8): la storia del punto invece di cinque casi.** Ogni punto ha già, o può avere:
età della crosta, profondità erosa (dall'erosione), spessore di sedimento depositato, distanza da una fossa o da
un vulcano, temperatura e pressione massime raggiunte (gradiente geotermico `q/k` × profondità di seppellimento).
La regola chiusa è termodinamica: l'associazione di minerali stabile a (P, T, composizione) è il minimo
dell'energia di Gibbs. Calcolarlo in linea costa troppo; la versione ridotta è una **tabella precalcolata** per
3–4 composizioni (basalto, crosta continentale, pelite, carbonato) su una griglia P–T, generata fuori linea con
MAGEMin (GPL‑3: il codice non si incorpora, i risultati sì) [V: [LICENSE](https://raw.githubusercontent.com/ComputationalThermodynamics/MAGEMin/main/LICENSE)]; Perple_X ha licenza non trovata [V‑prec]. ~100 kB. Così esistono
scisti, gneiss, marmi, eclogiti senza elencarli: sono regioni della tabella.
La **grana** (RC2, RC3): il tempo di raffreddamento è conduzione, `t ≈ L²/κ` (L: semispessore della colata o
profondità dell'intrusione, κ ≈ 10⁻⁶ m²/s) [R]; la taglia dei cristalli viene da nucleazione e crescita
dimensionali (`rocce.tammann` ha già la forma; servono I₀, G₀ in unità vere e la viscosità del fuso di quella
composizione: modello di Giordano e altri 2008 [R]). Si perde: le tessiture di flusso, le zonature.

**Tra 10 m e 4 cm (H21, RC9, GE26).** Il dettaglio aggiunto dalle tessere oggi è rumore (GE26). Il meccanismo: la
roccia si rompe secondo le sue fratture (spaziatura ~ spessore dello strato, o contrazione termica: `rocce.fratture`
esiste), i blocchi scendono e si consumano. Modello ridotto:
- taglia dei blocchi alla sorgente = spaziatura delle fratture (distribuzione di Weibull) [R];
- lungo il fiume `D(x) = D₀·exp(−a·x)` (legge di Sternberg; a raccoglie abrasione e selezione, e la letteratura
  discute quanto pesi ciascuna) [S: [Lajeunesse e altri](https://www.ipgp.fr/~lajeunes/download/2010-wrr-downstreamfining.pdf)];
- che cosa resta sul fondo: criterio di Shields con lo sforzo vero `τ = ρ g h S` (portata e pendenza della
  tessera), che `rocce.sedimento` usa già in forma adimensionale.
Così tra la cella di 10 m e la sezione di roccia c'è un livello: «il letto qui: ghiaia di 3 cm, 20% sabbia», con
i grani come campione (regola 9). Sui mondi senz'aria: regolite da giardinaggio d'impatti, spessore dall'età e dal
flusso di `impatti.js` [R: Costello e altri 2018].

**Vulcani e terremoti (H16).** Flusso di magma: §3. Stile dell'eruzione: viscosità del fuso (da SiO₂ e T) e gas
sciolti; frammentazione esplosiva quando le bolle superano ~75% del volume [R: Sparks 1978]; forma dell'edificio
dall'altezza a cui la pressione del magma regge la colonna (`h ≈ Δρ·d/ρ`), larghezza dalla lunghezza delle colate
(viscosità, portata, pendenza: fluido di Bingham [V‑prec, citato]). Terremoti: eventi con frequenza di
Gutenberg–Richter (b ≈ 1, misurata) e tasso dal momento sismico = rigidezza × area × velocità di placca [R].

**Costo.** Tutto sulla tessera che si guarda: +50–100% del tempo dell'erosione attuale (decine di ms per tessera).
**Dipende da:** §1 (tempo), §3 (magma, spinta), `meteo` (pioggia, vento, neve). **Resta:** K_f, w₀, a di Sternberg,
A di Glen sono misure terrestri di processi (attrito, rottura) che non si ricavano dagli atomi.

## 8. Il tempo che fa

**Voci:** MT1–MT15, H18, RS2.

- **Le uscite che ci sono già.** `meteo.js` integra decine di giorni e butta via tutto tranne le medie. Restituire
  anche lo stato istantaneo (venti, vapore, pioggia a un'ora data, indirizzata dal tempo) dà perturbazioni e fronti
  **senza fisica nuova**: i vortici baroclini nascono da soli nel modello a due strati. Costo: memoria (64×32×6
  campi per istante).
- **Hadley forte, Ferrel assente, rilievi che non deviano (MT7, MT10):** iperdiffusione, banco Held–Suarez, termine
  orografico, pioggia orografica di Smith–Barstad [V‑prec].
- **Ciclo del giorno, stagioni vissute (MT11):** forzare con `luceDelGiorno` all'ora vera invece della media.
- **Fulmini (RS2).** `F = (η/E)·P·CAPE`: lampi per m² per secondo = precipitazione (kg m⁻² s⁻¹) × energia
  convettiva disponibile (J/kg) × costante; le tempeste convertono in scariche circa l'1% di CAPE × acqua piovuta;
  spiega il 77% della varianza sugli Stati Uniti [S: estratti di Romps e altri 2014, Science 346, 851; il sito
  dell'autore non era raggiungibile; η/E ≈ 1,3·10⁻¹¹ J⁻¹ è [R]]. CAPE si calcola dall'adiabatica satura che
  `meteo.js` ha. Sostituisce `RESA_FULMINI` (una frazione fissa del calore latente tarata sui 44 lampi/s).
  Resta: η/E è misurato; l'elettrificazione delle nubi non si ricava.
- **Cicloni tropicali.** Intensità potenziale: `V² = (C_k/C_D)·[(T_s − T_o)/T_o]·(k₀* − k)` (T_s mare, T_o tropopausa,
  k entalpia dell'aria, k₀* a saturazione sul mare) [R: Emanuel 1986]. Dice dove possono esistere e quanto forti;
  la traccia è un evento. A 600 km di griglia non si risolvono: si istanziano nella tessera (regola 4).
- **Polvere e aerosol (MT14, TR2):** sollevamento sopra la soglia di Bagnold (§7); spessore ottico → foschia.
- **Fotochimica dell'aria (MT13):** il riferimento aperto è `photochem` di Wogan (GPL‑3: da usare fuori linea)
  [V: [LICENSE](https://raw.githubusercontent.com/Nicholaswogan/photochem/main/LICENSE)]; in linea, uno schema
  ridotto di Chapman per l'ozono (4 reazioni) e fotolisi di H₂O, CO₂, CH₄ con le soglie che `molecole.fotoni` ha già
  e il flusso UV del §1. Resta: sezioni d'urto misurate.

**Resta in ogni caso:** convezione e nuvole parametrizzate (MT3, MT4); a questa risoluzione nessun codice le fa
emergere.

## 9. Il mare

**Voci:** MR3–MR22, H24. Quasi tutto è nel rapporto precedente [V‑prec, in parte R]: Sverdrup + Munk sotto
griglia, gravità ridotta a 1,5 strati (Aronnax, MIT), scatola di Stommel per la termoalina, maree di Laplace,
Pitzer, Maher–Chamberlain, PHREEQC fuori linea per acqua–basalto. Aggiunte di questo inventario:

- **Lo stretto di un mare chiuso (MR10)** oggi è due eventi; la soglia vera esiste nelle tessere fini: calcolare
  la tessera del passaggio (larghezza e profondità del punto più basso tra i due bacini) e usarla nella formula di
  Armi e Farmer che c'è già. Costo: 1–3 tessere per stretto (decine di ms), solo per i bacini che contano.
- **La storia del sale (MR3):** con §1 e la storia dei continenti, i bacini chiusi del passato seppelliscono sale
  quando esistono: il bilancio va integrato lungo `storia(t)` e non con il mondo di oggi.
- **La colonna (MR19, H24):** due scatole in verticale (strato rimescolato + profondo) con affondamento dove la
  densità di superficie supera quella di fondo: è la scatola di Stommel [V‑prec] con i flussi di `meteo`; dà T, S,
  O₂ del fondo e l'età dell'acqua profonda. Le sorgenti calde come luoghi: gradiente di T e pH tra il fluido
  (`fluidoCaldo`) e il mare su decimetri: è la «scatola con barriera» di `molecole_rete`.
- **Altri liquidi (MR21):** `chimica.pressioneVapore(T, f)` copre 11 sostanze: un mare esiste dove `p > p_vap` e
  T sta tra fusione ed ebollizione di quella sostanza, con la stessa regola dell'acqua.

## 10. La luce (e il suono)

**Voci:** H22, H23, LG13, MR7, CH10, CS9, TR1, TR2, MP1.

**Un solo spettro dall'atomo all'occhio.** Oggi il colore ha cinque fonti (tinte per tipo, RGB dei minerali,
tre bande del mare, Rayleigh RGB in `src/tre`, temperatura delle stelle). Il meccanismo è uno: spettro della stella
× trasmissione dell'aria × riflettanza della superficie → tre numeri solo alla fine (integrale con le curve
dell'occhio CIE). Modello ridotto: 16–32 bande tra 0,3 e 1 µm (più 4–6 nell'infrarosso per il clima).
- Stella: corpo nero a T_eff (da `stelle.js`); righe e oscuramento al bordo trascurati; per nane M il corpo nero
  sbaglia molto nel blu [R].
- Aria: Rayleigh `σ(λ) = (24π³/(λ⁴N²))·[(n² − 1)/(n² + 2)]²·F_K` per molecola, con n indice di rifrazione del gas e
  F_K fattore di King [R: formula classica]; per una miscela si somma pesando le frazioni di `P.atmosfera`. Cielo
  blu, tramonti rossi, cielo color burro di Marte (polvere: Mie) escono dai gas veri. Per il disegno: il metodo
  di Bruneton (BSD‑3) [V: [LICENSE](https://raw.githubusercontent.com/ebruneton/precomputed_atmospheric_scattering/master/LICENSE)] o quello di Hillaire (MIT) [V: [LICENSE](https://raw.githubusercontent.com/sebh/UnrealEngineSkyAtmosphere/master/LICENSE)], che precalcolano trasmittanza e diffusione multipla in tabelle
  piccole (256×64) per pianeta: ~10–50 ms una volta, poi è una lettura.
- Superficie: riflettanza spettrale dei minerali dalla libreria dell'USGS (splib07, dominio pubblico) [V‑prec],
  mescolate con Kubelka–Munk (che `chimica.coloreRoccia` usa già in RGB). **L'albedo del clima (LG13) diventa
  l'integrale di questo spettro sulla luce di quella stella**: il ghiaccio è scuro nell'infrarosso, quindi attorno a
  una nana rossa riflette meno, e la retroazione ghiaccio–albedo si indebolisce da sola [R: Shields e altri 2013].
- Acqua: `mare.js` ha già a(λ), b(λ) in tre bande: estendere alle stesse 16–32.
- Ombre, eclissi, fasi, luce cinerea: geometria che `src/tre` e `orbite.js` hanno; mancano solo come uscite.
- Cielo notturno (MP1, H6): le stelle del catalogo viste da lì, più una popolazione vicina estratta dalla densità
  locale (regola 9: il catalogo ha peso 10⁸ per stella, quindi i vicini veri vanno istanziati sotto l'indirizzo
  della stella).

**Suono (H23).** `c = √(γ·R·T/M)` nei gas (tutto in `meteo.gasDellAria`), `√(K/ρ)` nei liquidi, `√((K + 4μ/3)/ρ)` e
`√(μ/ρ)` nei solidi con i moduli di `lune.MATERIALI` (meglio: dei minerali). Costo zero; serve a `risalita` e ai
terremoti.

**Costo.** 16–32 bande invece di 3: ×6–10 sui soli conti di colore (microsecondi per punto). **Resta:** gli spettri
dei minerali sono misure (derivarli dalla struttura elettronica è fuori portata), le nuvole.

## 11. La chimica chiusa: collegare ciò che è già scritto

**Voci:** CH1–CH15, ML1–ML9, LG9, MR14, MA1, H26, RS1.

**Il fatto.** `molecole.js` (2100 righe: qualsiasi grafo di atomi, energia, reazioni, rete del luogo) non è
importato da nessuno; `chimica.js` continua con 41 specie tabulate; `mare.js` con 9 ioni; `risalita.js` (energie
vere per la chimica) non è importato da nessuno. Qui non serve cercare leggi: serve un ordine di collegamento.

1. **Una tavola degli elementi sola** (CH1): `molecole_atomi.js` come fonte; `chimica.TAVOLA` e `materia.TAVOLA`
   leggono da lì (abbondanze e potenziali di ionizzazione sono colonne in più).
2. **Le 41 specie come caso particolare** (CH2): `chimica.MOLECOLE[f]` diventa una memoria davanti a
   `molecole.energia(f)`; dove il dato misurato esiste lo si tiene come «misura» (regola 2: misurato vince su
   ricavato) e la regola generale copre il resto. Prova: sulle 41 la regola deve tornare entro l'errore dichiarato
   (7–11 kJ/mol sulle molecole piccole). `equilibrio()` minimizza già Gibbs con gli atomi conservati: l'elenco delle
   specie candidate lo dà `molecole_rete.rete()` espandendo dal luogo, non un array.
3. **Il luogo dà le condizioni, la rete dà i flussi** (regole 4 e 7): `reteDelLuogo` riceve T, P, pH, ioni, luce UV
   (§1), scariche (§8), radiolisi (`risalita.radiolisi`), superfici (`materia.reticolo` del minerale di quel
   punto) e restituisce concentrazioni stazionarie: sostituisce `prebiotica()` con le rese di Miller–Urey (CH11).
4. **Le barriere (ML4).** Una barriera per famiglia sbaglia di un fattore 50 per 10 kJ/mol. Il meccanismo vero è la
   superficie di energia potenziale; la versione ridotta praticabile è **precalcolare fuori linea** le barriere di
   qualche migliaio di reazioni tipo con un metodo semiempirico (xTB/GFN2, licenza LGPL‑3 [V: [COPYING.LESSER](https://raw.githubusercontent.com/grimme-lab/xtb/main/COPYING.LESSER)]) e ricavarne correzioni per sottofamiglia
   (gruppo uscente, ingombro): una tabella di ~10 kB. In linea resta Marcus/Evans–Polanyi con più termini. Si
   perde: tutto ciò che il semiempirico sbaglia (metalli di transizione, stati eccitati).
5. **I minerali (CH10, MA1, CH8).** Elenco chiuso oggi. La regola chiusa ha due metà: *quali fasi* (minimo di Gibbs
   a P, T, composizione: tabella precalcolata, §7) e *come sono fatte* (cella e posizioni: la banca dati
   cristallografica aperta COD, dominio pubblico [V‑prec], da cui estrarre le ~200 fasi che la tabella nomina:
   ~200 kB). I colori: §10.
6. **Fotochimica (ML9, MT13):** radicali e stati eccitati come specie della rete, con fotolisi dalle soglie che ci
   sono e sezioni d'urto misurate (atlante di Magonza, PHIDRATES: licenze non verificate [R]).

**Che cosa la scienza non sa far emergere qui:** velocità di reazione accurate senza calcolo quantistico per
reazione; ripiegamento e catalisi delle catene lunghe (dichiarato in `molecole.js`); l'origine della vita
[V‑prec: nessuno ha ottenuto eredità da chimica realistica]. Il programma può promettere reti locali e rilevatori
passivi di autocatalisi, non organismi.

**Costo.** La rete di un luogo: 10²–10⁴ specie, espansione a richiesta: 0,1–10 s (ordine di grandezza da misurare sulle prove di
`molecole`); va fatta solo nel punto che si guarda e a zoom chimico.

## 12. Particelle, nuclei, raggi cosmici, fasce

**Voci:** MN1–MN6, CS16–CS25, MA2–MA4, NB1, H27, GX9.

**Tre dimensioni (MN1, CS25).** Il passo esatto in campo uniforme esiste anche in 3D: rotazione della velocità
attorno a **B** (schema di Boris: mezzo calcio elettrico, rotazione `v' = v + v×t`, `v⁺ = v + v'×s`,
`t = (qB/γm)·Δt/2`, `s = 2t/(1 + t²)`, mezzo calcio) [R: Boris 1970; è lo schema standard]. Conserva l'energia in
campo magnetico puro. Nel dipolo vero le particelle intrappolate fanno i tre moti (giro, rimbalzo tra i poli,
deriva) invece di un solo cerchio nel piano equatoriale: le fasce diventano gusci. La finestra resta una sezione
(regola 10). Costo: ×1,5 sul passo (tre componenti), stesso numero di passi.
I decadimenti in 3D sono più semplici: isotropi nel riposo della madre, poi spinta di Lorentz; a tre corpi con lo
spazio delle fasi (campionamento di Dalitz o RAMBO) [R: Kleiss, Stirling e Ellis 1986] o lo spettro di Michel per il
muone.

**Il catalogo dai dati (MN2, H27).** Masse, vite, cariche e numeri quantici di tutte le particelle del PDG sono in
tabelle CSV nel pacchetto `particle` di Scikit‑HEP (BSD‑3) [V: [LICENSE](https://raw.githubusercontent.com/scikit-hep/particle/main/LICENSE)]; i rapporti di decadimento stanno nell'API del PDG (licenza dei dati non verificata [R]).
Regola chiusa per i canali: un decadimento è permesso se conserva energia, carica, numero barionico e leptonico;
i rapporti restano misurati (derivarli è QCD su reticolo). Per gli urti adrone–nucleo non c'è una regola chiusa
leggera: il modello ridotto pubblicato sono le **equazioni di cascata**: MCEq le integra in 1D con matrici di
produzione precalcolate dai generatori d'urto (BSD‑3) [V: [LICENSE](https://raw.githubusercontent.com/mceq-project/MCEq/master/LICENSE)]. Le matrici (decine di MB) si riducono a poche energie e specie: ~1 MB. Sostituisce lo
«scheletro» di Heitler e `RESA_MUONI` (MA4). I nuclidi: IAEA LiveChart [V‑prec] per l'intera tavola, non solo
cinque catene.

**Una sola catena per i raggi cosmici (CS16–CS19, MA2, MA3).** Oggi tre descrizioni. In ordine:
sorgenti di `galassie.js` (resti, pulsar, getto, con potenza e posto) → diffusione nella galassia (soluzione da un
punto, già in `risalita.supernovaVicina`; coefficiente D ≈ 3·10²⁸ cm²/s misurato [R]) → spettro alla stella →
modulazione del vento di quella stella (§6) → soglia di Størmer del pianeta (una funzione sola) → cascata nell'aria
(MCEq ridotto) → materia. `cosmo.cieloDeiRaggi` e `energiaRaggio` leggono da lì.

**Le fasce (CS20–CS22).** Sorgente: neutroni di albedo che decadono (CRAND): spettro degli elettroni 0–782 keV
esatto dalla forma di Fermi (in `materia.spettroBeta`), protoni con l'energia del neutrone. Trasporto: diffusione
radiale in L con conservazione dei primi due invarianti, `∂f/∂t = L²·∂/∂L(D_LL·L⁻²·∂f/∂L) − f/τ + S`,
`D_LL ∝ L^10` (magnetica) [R: Schulz e Lanzerotti 1974]; perdite: atmosfera in basso, anelli (densità vera), lune.
Bordo esterno: la magnetopausa di `risalita.ventoStellare`. Stato stazionario 1D in L: 50 celle, microsecondi.
Resta: il coefficiente D_LL è misurato sulla Terra e scala con l'attività del vento.

## 13. Tra molecola e granello; la vita

**Voci:** H25, H29, ML7, MR18. Già nel rapporto precedente [V‑prec, in parte R]: DLVO e aggregazione dei
colloidi, lamelle d'argilla, scatola d'acqua piastrellabile, rilevatori passivi (RAF, nuclei di Blokhuis),
Gillespie a sottovolumi, mappe di potenziale prebiotico. Ciò che l'inventario aggiunge è **dove attaccarle**:
`mare.campioneAcqua` (ha già argille, fiocchi, colloidi con i conteggi veri) e il suolo del §7 sono i luoghi;
`molecole.anfifiliche` e `aggregazione` danno micelle e vescicole dalla geometria delle teste (parametro di
impaccamento `v/(a₀·l)` [R: Israelachvili]); le superfici dei minerali dal reticolo vero. La vita: resta un elenco
di ciò che le regole devono permettere (H29) e una promessa di non scriverla.

## 14. Giganti gassosi, lune come mondi, corpi minori

**Voci:** H12–H14, LG22, GE8, LU13, RO1, IM11, DS18.

- **Giganti (H13).** Struttura: sopra ~0,3 masse di Giove l'idrogeno degenere dà un polìtropo di indice 1
  (`P = K·ρ²`), per cui `R = √(πK/2G)` non dipende dalla massa [R: Stevenson 1982]: è la ragione del «raggio di
  Giove» che `raggioPianeta` oggi impone; `stelle.js` ha già lo stato della materia per farlo (nane brune). Calore
  proprio: contrazione di Kelvin–Helmholtz, la stessa curva di raffreddamento delle nane brune a massa più bassa.
  Fasce e getti: larghezza ~ scala di Rhines `L_β ∝ √(U/β)`, `β = 2Ω·cos φ/R`; con i venti e i β veri predice ~20
  getti per Giove e Saturno, 4 per Urano e Nettuno, 7 per la Terra [S: [Showman, Cho e Menou](https://arxiv.org/html/0911.3170); prefattore ~2 nelle simulazioni: [arXiv:2503.17828](https://arxiv.org/html/2503.17828)]. Strati di nubi: dove
  l'adiabatica del pianeta incrocia le curve di vapore che `chimica.pressioneVapore` ha (NH₃, H₂O; NH₄SH manca).
  Campo: la stessa legge del flusso di calore del §3 nella regione metallica. Resta: U (la velocità dei getti)
  non ha una legge di scala condivisa.
- **Lune e mondi di ghiaccio (H14, LU13).** Nessuna legge nuova: una luna è un corpo con massa, composizione,
  calore (radioattivo + mareale), luce. Va passata alla stessa catena dei pianeti (`interno`, `climaEAria`,
  `superficiePianeta`): oggi non accade perché `sistema()` la costruisce solo per `pianeti`. Il guscio di ghiaccio:
  conduzione + convezione a stato solido (stesse leggi di scala del §3 con la viscosità del ghiaccio).
- **Corpi minori (H12).** `impatti.js` ha popolazioni per classe di taglia e di velocità per ogni nube e fascia:
  la nebbia (regola 9) le istanzia: un asteroide è un indirizzo `…/fascia k/classe c/corpo n` con orbita estratta
  dalla distribuzione della sua classe (Rayleigh, già lì), forma (sotto `lune.raggioRotondo`: irregolare), e una
  cometa sublima con `ghiaccioAlSole` (già lì). Un impatto visto come evento ha così un proiettile con una storia.

## 15. L'indirizzo, il caso, i rami

**Voci:** CS7, CS8, DS17, LU14, CS28, MP2. Threefry‑2x32 con chiavi gerarchiche [V‑prec: verificato sui vettori
ufficiali]. In più, dall'inventario: `disco.js`, `lune.js`, `rocce.js`, `geologia.js`, `tettonica.js`, `fluidi.js`
tirano ancora da un generatore sequenziale (un ramo cambia tutto il corso): ogni estrazione va rinominata come
evento con indirizzo («embrione 12/fusione con 13», «luna 3/cattura»), così un ramo cambia una cosa sola
(regola 3) e l'ordine di valutazione non conta.

---

## 16. La tabella di marcia

Ordine per dipendenze e per quanto ogni blocco sblocca gli altri. Ogni blocco si può fare e provare da solo; i
riscontri sono numeri del mondo vero da stampare nelle prove (come «NON TORNA») senza allargare soglie.

| n. | blocco | file da creare o toccare | riscontri numerici | regole | sblocca |
|---|---|---|---|---|---|
| 0 | **Un caso solo, per indirizzo** (§15) | `eventi.js` (Threefry), `cosmo.js hash`, `mondo.js casoEvento`; poi `disco.js`, `lune.js`, `rocce.js`, `geologia.js`, `tettonica.js`, `fluidi.js` | vettori di prova di Random123; «un ramo cambia una cosa sola» per disco e lune; determinismo in ordine inverso | 1, 3 | va fatto per primo: cambia ogni mondo, e ogni riscontro successivo ne dipende |
| 1 | **I fili che esistono già** (nessuna fisica nuova) | `cosmo.js sistema()` (passa `calore` a `climaEAria`; passa `giorno` a `interno`); `geologia.climaSuperficie` (legge `mare.caloreDalMare`, `mare.albedo`; itera con `meteo` fino a convergenza); `mare.js`, `risalita.js` (→ `stelle.stella`); `chimica.atmosfera` (Ar‑40, He da `risalita.gasRadiogenici`); `chimica.prebiotica` (energie da `risalita.energiaPerLaChimica`); `cosmo.fascia` (magnetopausa da `risalita.ventoStellare`, massimo calcolato); `geologia` (vulcani sulle salite di `tettonica`); `mappa.rocciaDi` (umidità da `meteo`); via `fluidi.flussoInterno` | Terra con i gas veri: 288 ± 3 K a ciclo acceso; pCO₂ del ciclo tra 10⁻⁴ e 10⁻³ bar; Ar 0,9% dell'aria; magnetopausa a ~10 raggi; clima fasce/mappa entro 2 K (oggi fino a 8); le note di `test_coerenza` sui venti di `meteo.js` contro `clima()` e sul massimo della fascia diventano prove | 7 | toglie le incoerenze visibili; prepara 4 |
| 2 | **Via i tipi** (§4) | `disco.js` (niente `tipo` nelle decisioni), `leggi.acquaInSuperficie`, `lune.js` (`lune()`, `k2QPianeta`), `leggi.clima`, `cosmo.js` (colore) | nessun salto: facendo variare il ghiaccio da 0,1 a 0,3 l'acqua in superficie, il numero di lune e k₂/Q cambiano con continuità; statistiche del campione di `test_coerenza` entro il 10% | 2 | 3, 4, 14 |
| 3 | **La struttura dalla materia** (§3) | nuovo `struttura.js` (equilibrio idrostatico + EOS di Seager); `disco.raggioPianeta`, `geologia.interno` (raggio del nucleo, g), `impatti.IMPATTI.inerzia` | Terra (32,5% ferro): R entro il 3% di 6371 km, nucleo a 3480 ± 150 km, C/MR² = 0,33; Marte, Mercurio, Luna, Ganimede, Titano entro il 5%; formula generica di Seager entro l'1% | 2, 4 | 4, 14 |
| 4 | **La storia del pianeta** (§1, §3) | nuovo `storia.js` (ODE: T_m, T_c, carbonio, acqua, fuga XUV; legge `stelle`, `rotazione`, `orbite`); `geologia.interno(P, t)`; `leggi.clima({…, t})`; `chimica.climaEAria` (isteresi dalla storia); `orbite.js` (modi secolari, precessione) | Terra oggi: q = 0,087 W/m² (±30%), campo 3·10⁻⁵ T, nucleo interno più giovane di 1,5 Ga; Marte: dinamo spenta entro ~4 Ga fa; Venere senza dipolo (Ro_l); Terra a 3,5 Ga non gelata con la CO₂ del ciclo; Marte perde l'aria; obliquità della Terra 22–24,5° con periodo ~41 000 anni, eccentricità con ~100 000 e ~400 000 | 6, 7 | 5, 6, 9, 13 |
| 5 | **Serra da tabella, limite del vapore, albedo spettrale** (§2, §10) | `strumenti/tabella_serra.mjs` → `serra_tabella.js`; `chimica.serra`; `leggi.LIMITE_VAPORE` → funzione di g; `leggi.riflette` (albedo = spettro × riflettanza) | Terra 288 K, Venere 735 K, Marte 214 K senza coefficienti tarati su di loro; zona abitabile del Sole 0,95–1,67 UA (Kopparapu); albedo di Bond della Terra 0,30 ± 0,03 con le nuvole di `meteo`; ghiaccio attorno a una nana M: albedo < 0,5 | 2, 7 | 6 |
| 6 | **Un'erosione sola, con l'orologio; suolo; ghiaccio** (§7) | `geologia.erosione` (unità vere, K per litologia, chiamata da `tettonica` nel tempo); `geologia` (campo `suolo`, flusso di Glen); `chimica.ROCCE.denudazione` ← erosione; `meteo.secchio` ← suolo | denudazione media della Terra 3·10⁻⁵ m/anno (entro ×3) come uscita; fango ai mari ~2·10¹³ kg/anno; legge di Hack (esponente 0,5–0,6); concavità m/n ≈ 0,45; sulla Terra di prova, con il clima di 20 000 anni fa (da 4), calotte fino a ~45–50° e mare ~120 m più basso; salinità della Terra più vicina a 35 g/kg (oggi 71) | 4, 6, 7 | 13, 9 del mare |
| 7 | **Il disco che evolve, la migrazione, le lune da equilibrio** (§4) | `disco.js` (Lynden‑Bell–Pringle, fotoevaporazione, ciottoli, K‑H, gap, tipo I; Genda al posto del sorteggio); `lune.js regolari()`; `impatti.js` → acqua consegnata | vita mediana dei dischi 2–3 Ma come uscita; neve del Sole a ~2,7 UA a 1 Ma; giganti nel 10–15% delle stelle solari, ∝ 10^(2[Fe/H]); Giovi caldi ~1%; lune di Giove 2·10⁻⁴ della massa; acqua della Terra 2·10⁻⁴–10⁻³ della massa | 2, 3, 6 | 8, 14 |
| 8 | **Stelle complete** (§6) | `stelle.js` + nuovo `stelle_dopo.js` (Hurley), `stelle_attive.js` (rotazione, campo, XUV, vento), doppie come eventi in `galassie.stelleGalassia`; ammassi di nascita | relazione massa iniziale–finale di Cummings; Sole: giro 25 giorni a 4,57 Ga; 44% di solari con compagne; ritmo delle Ia dalle coppie entro ×2 da Maoz–Graur | 2, 6 | 4 (XUV), 7 (condizioni del disco), 12 |
| 9 | **Un campo solo per il cosmo; alberi di fusione; tabelle di raffreddamento e di rese** (§5) | `cosmo.js` (galassie = picchi del campo di `cosmo3d`), `cosmo3d.js` (raffinamento condizionato), `galassie.js` (Parkinson, Λ tabellata, feedback di SAGE, rese per elemento), `leggi.ISOTOPI` ← U, Th della galassia | Moster entro 0,3 dex da 10¹⁰ a 10¹³; Via Lattea 5–6·10¹⁰ M☉ e 220 km/s; velocità peculiari 300–600 km/s; [α/Fe] alto nelle stelle vecchie; frazione di ellittiche 10–20% contando le piccole | 1, 4, 7 | 8, 12 |
| 10 | **La luce come spettro; il cielo** (§10) | nuovo `luce.js` (bande, Rayleigh, Kubelka–Munk spettrale, CIE); `src/tre/pianeta.js`; `mare.OTTICA`; `chimica.coloreRoccia` | cielo della Terra allo zenit nel blu (cromaticità CIE x < 0,30, y < 0,31), rosso al tramonto; Marte: cielo chiaro di giorno; colore del mare già provato in `test_mare` invariato | 7, 10 | 5 (albedo) |
| 11 | **La chimica collegata** (§11) | `chimica.js` (legge da `molecole`), `mare.js` (specie qualsiasi), `materia.js` (tavola unica), `cosmo.js` (rete del luogo a richiesta); `strumenti/tabella_minerali.mjs` | le 41 specie riprodotte entro 10 kJ/mol; acqua di mare terrestre pH 8,2 e speciazione entro il 10%; glicina dalla rete in un'aria riducente con le scariche del §8, niente in aria ossidata | 2, 5 | 13, vita |
| 12 | **Particelle in 3D, catalogo dai dati, una catena per i raggi cosmici, fasce** (§12) | `mondo.js` (Boris 3D, decadimenti isotropi), `unita.js` (catalogo da tabella), `materia.js`/`cosmo.js` (una funzione per spettro e soglia), nuovo `fasce.js` | muoni al livello del mare ~1 per cm² al minuto; soglia di Størmer 14,9 GV all'equatore; fascia interna della Terra con il massimo a L ≈ 1,5; rapporto di specchio e periodo di rimbalzo di un protone da 10 MeV a L = 2 (~1 s); energia, impulso e carica conservati a 10⁻¹² | 2, 4, 7 | resti come luoghi (H9) |
| 13 | **Sotto i 10 metri: rocce dalla storia, blocchi e grani, dune, coste** (§7) | `mappa.rocciaDi` (storia P–T del punto → tabella dei minerali; raffreddamento da conduzione), `rocce.js` (unità vere), nuovo livello «letto/affioramento» tra tessera e roccia | granito a 5 km: cristalli di mm–cm; colata di 1 m: 0,01–0,1 mm; ghiaia che si affina lungo il fiume con a ~0,01–0,1 km⁻¹; dune barcane con poca sabbia e vento costante | 2, 4 | — |
| 14 | **Giganti, lune come mondi, corpi minori; il tempo che fa** (§14, §8) | `leggi.clima` (ramo dei giganti → struttura e nubi), `cosmo.sistema` (lune nella catena dei pianeti), `impatti.js` (istanze), `meteo.js` (stato istantaneo, CAPE, fulmini) | Giove: raggio entro il 10% dal polìtropo, ~20 fasce; Titano: aria e laghi; Europa: guscio 10–30 km; fulmini sulla Terra 44 ± 5 al secondo da P × CAPE | 2, 4, 9 | — |
| 15 | **Tra molecola e granello; rilevatori passivi di autocatalisi** (§13) | `mare.campioneAcqua`, suolo, `molecole_rete` | come nel rapporto precedente | 5 | — |

I blocchi 0–4 sono la spina: senza il caso unico i riscontri si rifanno due volte; senza i fili (1) e i tipi (2)
la storia (4) erediterebbe le loro incoerenze; la struttura (3) dà alla storia masse, gravità e nucleo.
Dal 5 in poi l'ordine è più libero: 5–6 per la superficie, 7–9 per ciò che sta sopra, 10–15 per ciò che si vede e
ciò che sta sotto.

## 17. I dieci buchi più gravi rispetto a «tutto emergente e intrecciato»

1. **Tutto è calcolato «adesso».** Nessuna storia condivisa del pianeta: clima, aria, erosione e sali del mare
   usano la stella, l'orbita, i continenti, la CO₂ e il calore interno di oggi per miliardi di anni (G1, LG25,
   GE22, MR3, TT9, OR1). Rimedio: blocco 4.
2. **Fili staccati che hanno già i due capi.** Il ciclo del carbonio è spento nel clima per un argomento non
   passato; il calore e l'albedo del mare non tornano al clima; `risalita.js` e `molecole*.js` (circa 2900 righe insieme)
   non sono importati da nessuno; il giorno non entra nella dinamo (MR1, MR2, RS1, ML1, GE5). Blocco 1.
3. **L'interno è la Terra riscalata, a soglie.** Calore, nucleo, campo, regime della crosta, crosta, numero di
   vulcani: sei formule di comodo e sei soglie nette da cui dipendono fasce, tettonica, mare, lune (GE1–GE8).
   Blocchi 3 e 4.
4. **Tre tipi di pianeta al posto della composizione continua** (DS12), e ciò che ne discende: acqua tutta fuori
   o al 4%, lune da urto o da disco, attrito di marea, clima dei giganti. Blocco 2.
5. **Sotto i 600 km il paesaggio è rumore più una legge senza orologio; sotto i 10 m c'è un vuoto di tre ordini
   di grandezza e la roccia è scelta da cinque `if`** (GE10, GE22, GE26, RC1, RC2, RC9). Blocchi 6 e 13.
6. **Serra, nuvole e albedo sono tarate su Terra, Venere e Titano** (CH5, LG13, LG15): la temperatura di ogni
   mondo eredita tre pianeti del Sistema Solare. Blocco 5 (le nuvole restano).
7. **Il disco dei pianeti è un profilo imposto**, con massa e vita sorteggiate, sette parametri liberi, senza
   migrazione, e con l'acqua consegnata da una «regola semplice» (DS1–DS11). Blocco 7.
8. **Elenchi chiusi dove la regola generale è già scritta o disponibile**: 41 molecole, ~15 minerali, 8 reticoli,
   13 particelle, 2 materiali per le lune, 3 tavole degli elementi (CH1, CH2, CH10, MA1, MN2, LU1). Blocchi 11, 12.
9. **Due cose piatte e due cose doppie in alto e in basso**: il motore delle particelle è un piano; il cosmo è una
   carta con un campo proprio e accanto un campo 3D vero adattato a lei; i raggi cosmici hanno tre descrizioni non
   unite (MN1, CS1, CS6, MA3, GX6). Blocchi 9, 12.
10. **Mancano i livelli che fanno da ponte**: l'ambiente di nascita delle stelle (nubi, ammassi, doppie), le stelle
    dopo la sequenza principale e i resti come luoghi, i giganti e le lune come mondi, suolo, ghiaccio che scorre,
    il tempo che fa, la luce come spettro (H3, H8, H9, H13, H14, H17, H18, H20, H22). Blocchi 8, 10, 14.

## 18. Che cosa non è stato verificato, e dove la scienza non arriva

**Non verificato in questa sessione (da rileggere prima di codificare):**
- la forma esatta della frazione fusa di Katz 2003 e i termini idrati (letti solo i coefficienti, in un sorgente);
- prefattore e costante A dell'approssimazione di ghiaccio sottile; regole dell'automa di Werner;
- la costante η/E di Romps 2014 (sito non raggiungibile);
- la formula di Canup e Ward 2006 per la massa delle lune (PDF non raggiungibile);
- le formule di Laplace–Lagrange, Boris, Rayleigh, Monin–Obukhov, raffreddamento del semispazio, intensità
  potenziale dei cicloni, polìtropo n = 1, diffusione radiale delle fasce: classiche, scritte a memoria;
- la legge di scala del potenziale di modulazione dei raggi cosmici con il vento stellare (solo abstract);
- i coefficienti di Ribas 2005 (confermati solo attraverso due articoli che li citano);
- le statistiche delle stelle doppie (estratti di ricerca, non le tabelle);
- le licenze dei dati del PDG, dell'atlante UV di Magonza, di PHIDRATES, delle tabelle di Sutherland e Dopita;
- tutto ciò che nel rapporto precedente era [R] e qui non è stato ripreso: Cortial, Munk/Sverdrup, K di Kanagawa,
  Tout 1996, tassi di occorrenza dei giganti. (La migrazione di tipo I, là [R], qui è verificata.)

**Dove la scienza non sa far emergere la cosa dai principi (e che cosa si usa al suo posto):**
- la distribuzione delle masse delle stelle alla nascita, la frazione di doppie → leggi misurate, dichiarate;
- la turbolenza: α dei dischi, convezione stellare (lunghezza di mescolamento), nuvole e convezione umida,
  rimescolamento degli oceani → un parametro per ciascuna, o leggi di scala misurate;
- i parametri del cosmo e le costanti → misurati;
- il regime tettonico di un pianeta → nessun criterio condiviso: indice continuo;
- i rapporti di decadimento e gli urti adronici → tabelle misurate o precalcolate;
- velocità di reazione accurate, ripiegamento, origine della vita → barriere stimate, reti locali, rilevatori;
- attrito, rottura, abrasione delle rocce (K dell'erosione, legge di Glen, Sternberg) → costanti misurate;
- l'elettrificazione delle nubi, la dinamo (prefattori), la sorgente degli elementi r → leggi di scala con
  costanti misurate.
In tutti questi casi la regola 2 è rispettata dichiarandoli «misurati» con la fonte, non tarandoli sul risultato.

## 19. Indice: ogni voce dell'inventario, dove è trattata

Le voci non nominate nelle sezioni sopra, con il rimedio in una riga. (V‑prec = formula e fonte nel rapporto
precedente.)

| voci | rimedio | fonte e marca | costo | resta |
|---|---|---|---|---|
| LG1 | restano misurati: nessuna teoria li ricava | — | — | sei numeri |
| LG2, LG3 | massa massima e raggio delle stelle di neutroni: integrare Tolman–Oppenheimer–Volkoff con un'equazione di stato nucleare tabulata (polìtropi a tratti) | [R: Read e altri 2009] | ms, una volta | l'equazione di stato nucleare è misurata |
| LG4, LG5, FL1, GE14, MN3 | codice doppio o morto: togliere | — | — | — |
| LG6, LG7, LG8, LG10, LG11 | §6, §5, §1, §4 | | | |
| LG9, CH1–CH3, MR14 | §11 | | | |
| LG12–LG25 | §1, §2, §10 | | | nuvole |
| CS1–CS6, CS26, CS27 | §5, §1 | | | |
| CS4, CS5, CS15, CS23, CS28 | tetti e posti fissi → nebbia dichiarata (ogni campione con il suo `peso`); le regioni di un pianeta diventano punti qualsiasi (lon, lat, quota) invece di 12 posti; il numero della biblioteca senza alias (base mista sui conteggi veri) | regole 1, 9, 10 | — | — |
| CS7, CS8, DS17, LU14, MP2 | §15 | V‑prec | | |
| CS9, CS11, CS12 | colore dallo spettro (§10); schiacciamento dalla struttura (§3: `J₂` dal profilo di densità, Darwin–Radau [R]) | | µs | — |
| CS10 | §6 (raggio della gigante + marea) | V‑prec | | |
| CS13, CS14 | §1 (ordine dei calcoli), blocco 1 | | | |
| CS16–CS25, NB1 | §12 | | | |
| GX1–GX15 | §5; GX2: guadagno dell'amplificatore di Toomre in funzione di Q e X [R: Toomre 1981; Binney e Tremaine], al posto del contrasto lineare; GX7: accrescimento di Bondi dal gas caldo che `galassie.js` ha già (`Ṁ = 4π·G²·M²·ρ/c_s³`) al posto della frazione di Eddington estratta; GX9: §6; GX10: passo più fitto dove la storia cambia in fretta | | ms | semi dei buchi neri |
| ST1–ST14 | §6; ST2, ST3: tabelle di opacità (V‑prec, licenze non trovate); ST6: energie di ionizzazione misurate (NIST) al posto di Slater; ST7: rete da REACLIB (V‑prec: licenza non verificata) | | tabella rigenerata: 16+ min fuori linea | α della convezione |
| DS1–DS18 | §4, §6 | | | α del disco |
| GE1–GE8, GE13 | §3 | | | |
| GE9, GE18, GE20, GE25, GE28 | blocco 1 (fili con `meteo`: adiabatica vera per la neve in quota, evaporazione vera per i laghi, pioggia fine nelle tessere) | — | — | — |
| GE10 | rilievo dei mondi senza placche: topografia dinamica dalle celle del mantello (`h ≈ α·ΔT·d`), vulcani a scudo sulle salite (§3), bacini d'impatto veri (`impatti.js`), flessione della litosfera (`w ∝ exp(−x/α_f)`, `α_f = [4D/(Δρ g)]^¼` [R: Turcotte e Schubert]) al posto delle 24 onde | [R] | come ora | spessore elastico |
| GE11, GE12 | cancellazione dei crateri dal flusso di magma (§3) e dall'erosione calcolata (§7) | — | — | — |
| GE15, GE16, GE29, TT11 | icosfera; fiumi a direzioni multiple; piani di Barnes | V‑prec | | |
| GE17 | stato redox dalla fugacità di O₂ di `chimica.equilibrio` | — | µs | — |
| GE19, GE21–GE27 | §7 | | | |
| TT1–TT9, TT13 | §3, §1; TT5: densità della crosta da `chimica.minerali` e g del pianeta nell'isostasia; TT6: crosta continentale = integrale del magma d'arco (§3) | | | |
| TT10 | la tettonica restituisce i suoi fotogrammi (continenti, età) a tempi scelti: `storia.continenti(t)` | regola 6 | memoria: 20 fotogrammi × 32 kB | — |
| TT12 | §15 | | | |
| TT14 | §14 (gusci di ghiaccio) | | | |
| IM1, IM2 | esito dell'urto gigante: leggi di scala di Leinhardt–Stewart e `collresolve` (Apache‑2.0) | V‑prec | µs | costanti da simulazioni |
| IM3, IM4 | rotazione e taglia dei planetesimi: restano leggi da simulazioni (instabilità di flusso) | [R: Johansen e altri 2015; Visser e altri 2020] | — | sì |
| IM6 | fasce: aggiungere Yarkovsky (`da/dt ∝ 1/D`, ~10⁻⁴ UA/Ma per 1 km a 2,5 UA [R]) come rifornimento delle risonanze; cronologia di Marchi come riscontro | V‑prec per Marchi | µs | — |
| IM7–IM9 | conservazione: la massa caduta va a `disco`/pianeta; volatili → §4; impatti grandi → erosione dell'aria (calotta tangente: `m_persa ≈ m_aria·(…)` [R: Schlichting e altri 2015]) e inverno d'impatto come evento del clima | [R] | — | — |
| IM10, IM11 | forme dei crateri continue (Holsapple), raggi e secondari come campione | V‑prec | | |
| RO1 | giro dei giganti: campo del pianeta giovane dalla legge di flusso (§3) nella formula di Batygin | V‑prec | µs | — |
| RO2, LU10 | §3 | | | |
| RO3, RO5 | equazioni di Hut nella forma di Leconte 2010, luna e stella insieme | V‑prec | 10³ passi | — |
| RO4 | marea termica: distanza critica di Leconte 2015 | V‑prec | µs | q₀ tabulato per quattro casi |
| LU1 | materiali delle lune → minerali e ghiacci veri (§11), moduli elastici per fase | — | — | misure |
| LU2–LU8 | §4; LU8: catture dalle popolazioni di `impatti.js` (incontri con dissipazione nel disco di gas o scambio da coppie) | [R: Nesvorný e altri 2007] | — | efficienza di cattura |
| LU9, LU11, LU12 | forma dalla storia collisionale (evento, dichiarato); risonanza di Laplace dalla teoria [R: Peale 1999]; albedo dallo spettro (§10) | | | |
| LU13 | §14 | | | |
| AN1 | pioggia dell'anello: flusso di micrometeoroidi di `impatti.js` × resa di polvere carica, invece della misura di Saturno | [R: Hsu e altri 2018] | µs | resa |
| AN2–AN6 | viscosità di Salmon; lune dal bordo (Crida e Charnoz); ciclo anello–lunette (Hesselbrock e Minton) | V‑prec (i primi due), [R] | — | — |
| OR1–OR4 | §1 | | | |
| MT1–MT15 | §8, §2 | | | convezione, nuvole |
| MR1–MR22 | §2, §9, §1 | | | |
| CH4, CH8, CH9, CH13–CH15 | CH4: condensazione nel disco con `chimica.equilibrio` a T(r) del §4; CH8: §3 (Katz) e tabella di fasi (§7); CH9: `CONTINENTI` ← `tettonica`; CH13: §7; CH15: §3 | | | coefficienti di ripartizione |
| CH5–CH7 | §2, §1 | | | |
| CH10–CH12, ML1–ML9 | §11 | | | |
| RC1–RC4, RC7–RC10 | §7 | | | |
| RC5, RC6 | fiocco di neve: T e sovrassaturazione vere da `meteo`; il diagramma di Nakaya resta misurato (la cinetica di attaccamento non è derivata) | [R: Libbrecht 2005] | — | sì |
| MA1 | §11 (COD) | V‑prec | | |
| MA2–MA4 | §12, §6 | | | |
| MA5 | ricottura a ventaglio di Ketcham al posto della soglia | V‑prec (note, da rileggere) | µs | — |
| MA6, MA9, MA10 | restano scelte di disegno dichiarate o semplificazioni minori | — | — | sì |
| MA7 | §5 (U e Th dalla galassia) | | | |
| MA8 | §7 (profondità erosa) | | | |
| MN1–MN6 | §12; MN4: irraggiamento di sincrotrone `P = σ_T·c·γ²·β²·B²·sin²α/μ₀` (σ_T = 6,652·10⁻²⁹ m² per l'elettrone, ∝ 1/m² per le altre) [R: formula di Larmor relativistica]; Compton e fotoelettrico dalle formule del PDG | V‑prec per il PDG | — | — |
| FL2 | pozza: Boussinesq 2D su 128² (decine di ms) al posto di Swift–Hohenberg | [R] | 50 ms | — |
| MP1, MP3, TR1–TR3 | §10; motore 3D | | | |
| RS1–RS6 | blocco 1; §8 (fulmini); RS4: temperatura dell'esosfera dal bilancio XUV–conduzione [R: Bauer e Lammer] | | | |
| H1–H30 | §5 (H1, H2), §6 (H3–H10), §4 (H11), §14 (H12–H14), §3 (H15), §7 (H16, H17, H19–H21), §8 (H18), §10 (H22, H23), §9 (H24), §13 (H25, H29), §11 (H26), §12 (H27); H28 (l'inizio) e H30 (civiltà) restano fuori: BBN si può aggiungere come rete di 12 reazioni [R: Wagoner 1973] per ricavare Y = 0,247 da Ωb | | | |
| I1–I12 | I1: §5; I2: Fryer (V‑prec); I3: §4; I4: §4; I5: §3; I6, I7: da rileggere voce per voce (non fatto); I8: MA5; I9: §2 (radiazione in verticale); I10: §7; I11: AN1; I12: §4 (tipo I ora [V]), il resto ancora [R] | | | |
