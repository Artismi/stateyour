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
| Fe (ε) | 8300 | 0,00349 | 0,528 |
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
`Im(k₂) = (3/2)·…` dalla rigidezza complessa `μ̃(ω) = μ·iωη/(μ + iωη)` [R: Henning e altri 2009]; lega k₂/Q alla
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
