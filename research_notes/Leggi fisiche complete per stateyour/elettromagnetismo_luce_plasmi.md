# Elettromagnetismo, luce, plasmi ed elettricità in natura a tutte le scale: regole complete per «stateyour» (stato all'11 novembre 2026)

> **Marche.** **[V]** = verificato in questa sessione aprendo la fonte primaria (articolo, PDF dell'autore, file LICENSE, sorgente). **[V‑sec]** = verificato aprendo una fonte secondaria (Wikipedia, articolo che cita l'originale). **[S]** = solo estratto di ricerca. **[R]** = ricordato, non riletto: da ricontrollare sul collegamento prima di codificare. **[C]** = conto mio di riscontro, fatto con le formule citate. **[V‑prec]** = già verificato nei rapporti precedenti di stateyour, non ripetuto.
> Decimali con la virgola; negli elenchi di numeri il separatore è il punto e virgola. Unità SI salvo dove è scritto altrimenti.
> **Le sei voci [R] che il rapporto «Come farlo emergere» chiedeva di verificare**: costante di Romps 2014 → **[V]** (§4); coefficienti XUV di Ribas 2005 → **[V]** (§1); modulazione dei raggi cosmici col vento stellare → **[V]** tabella e formula (§1); diffusione radiale delle fasce → **[V]** coefficiente magnetico di Brautigam e Albert e tre alternative, **[R]** la forma dell'equazione (§3); Boris → **[V]** (§3); Rayleigh → **[V]** (§6). **Verifica a fondo 2026-11:** le voci con la dicitura «2026-11» sono state rilette sulla fonte primaria (o, dove è scritto, su codice o su un articolo che la riporta); una correzione importante riguarda l'indice della CO₂ di Sneep e Ubachs (§6); esiti in `verifiche_astro_interno_clima_luce.md`.

---

## 1. Dinamo: campi di pianeti, stelle e galassie; rotazione–attività, frenamento, XUV nel tempo

### Takeaway
Il campo di un pianeta o di una stella che gira in fretta si ricava dal **flusso di energia convettiva** e non dalla rotazione (legge di Christensen: `B²/2μ₀ = c·f_ohm·ρ^(1/3)·(F·q₀)^(2/3)`, c = 0,63); la rotazione decide solo la **forma** (dipolare sotto un numero di Rossby locale di 0,12, multipolare sopra). Per le stelle lente vale invece la catena misurata `Rossby → campo → raggi X → vento → frenamento`, tutta con coefficienti pubblicati e verificati qui; l'unica avvertenza è che ogni soglia di Rossby vale solo insieme al tempo di rimescolamento convettivo con cui è stata tarata.

### Cited Findings

**Dinamo planetarie: leggi di scala**
- [V] Christensen e Aubert 2006, tre leggi tarate su simulazioni (numero di Rayleigh basato sul flusso, `Ra*_Q`): `Nu* = 0,076·Ra*_Q^0,53`; `Ro = 0,85·Ra*_Q^0,41`; `Lo/f_ohm^(1/2) = 0,92·Ra*_Q^0,34`. Il passaggio da dinamo dipolare a multipolare avviene a numero di Rossby locale `Ro_l ≈ 0,12`, «irrespective of the values of the Ekman number» e dei numeri di Prandtl. — [Christensen & Aubert 2006, GJI 166, 97 (copia PDF)](https://www.maths.gla.ac.uk/~rs/res/B/DynamoScaling/2006ChristensenAubert.pdf)
- [V, PDF di Christensen e Aubert 2006, eq. 12–19 e 27–28, letto 2026-11; era R] Definizioni usate lì: `Ro = U/(Ω·D)`, `Lo = B/(√(ρμ₀)·Ω·D)`, `Ro_l = Ro·l̄/π` (l̄ grado armonico medio del flusso), `Ra*_Q` ∝ potenza convettiva/(ρ·Ω³·D²): da rileggere nel §2 dell'articolo prima di codificare. — [stesso PDF](https://www.maths.gla.ac.uk/~rs/res/B/DynamoScaling/2006ChristensenAubert.pdf) Riletto: `Ro = (2·E_kin/V_s)^(1/2)` e `Lo = (2·E_mag/V_s)^(1/2)` in unità adimensionali (velocità in Ω·D, campo in √(ρμ₀)·Ω·D), `Λ = Lo²·Pm/E`; `Nu* = Q_adv/(4π·r_o·r_i·ρ·c·ΔT·Ω·D)`; `Ra*_Q = α·g_o·Q_adv/(4π·r_o·r_i·ρ·c·Ω³·D²)` (Q_adv calore avvettato, g_o gravità al bordo esterno); `Ro_l = Ro·l̄_u/π`, con l̄_u grado armonico medio pesato sull'energia cinetica. Attenzione: Olson e Christensen 2006 usano un'altra normalizzazione, `Ra_Q = r*·F/(d²·Ω³)` con r* = r_o/r_i e F flusso di galleggiamento.
- [V] Christensen 2010 (rassegna): legge di energia `B²/(2μ₀) = c·f_ohm·ρ̄^(1/3)·(F·q₀)^(2/3)` (eq. 15), con B campo medio dentro la regione di dinamo, ρ̄ densità media, q₀ flusso di energia al bordo esterno della dinamo, F fattore di efficienza termodinamica (ordine 1), f_ohm ≤ 1 frazione dissipata per effetto Joule; **c = 0,63** per dinamo dipolari, **c = 0,23** per le multipolari. La legge «agree well with the observed field strength of Earth and Jupiter»; Saturno torna solo ponendo il tetto della dinamo a 0,40 R_p (con 0,62 R_p il campo è sovrastimato). La soglia `Ro_l = 0,12` è ribadita; dipolarità del campo geomagnetico attuale 0,65. — [Christensen 2010, Space Sci. Rev. 152, 565 (copia PDF)](https://www.maths.gla.ac.uk/~rs/res/B/DynamoScaling/2010Christensen.pdf)
- [V] Christensen, Holzwarth e Reiners 2009: stessa legge, eq. 1 `B²/(2μ₀) ∝ f_ohm·ρ^(1/3)·(q_c·L/H_T)^(2/3)` ed eq. 2 con la costante «c = 0.63»; vale da Terra e Giove fino alle nane M e alle T Tauri che girano in fretta (campo «saturo», indipendente dalla rotazione). — [Christensen et al. 2009, Nature 457, 167 (copia PDF)](https://www.maths.gla.ac.uk/~rs/res/B/DynamoScaling/2009bChristensenETAL.pdf)
- [V] Forma pronta per stelle e nane brune del tutto convettive e in rotazione rapida: `B_dyn = 4,8 kG × (M·L²/R⁷)^(1/6)` (M, L, R in unità solari), campo medio alla superficie della dinamo. — [Reiners & Christensen 2010, arXiv:1007.1514](https://arxiv.org/abs/1007.1514)
- [C] Riscontro: nana M con M = 0,3; L = 0,01; R = 0,3 → B = 4,8 × 0,72 = 3,4 kG, l'ordine dei campi misurati nelle nane M sature (vedi Reiners 2022 sotto: ~2 kG a Ro = 0,1). — formula da [arXiv:1007.1514](https://arxiv.org/abs/1007.1514)
- [V] Forma «a potenze di grandezze fisiche» per pianeti rocciosi (Zuluaga e altri 2013, che riprendono Zuluaga e Cuartas 2012): campo medio nel nucleo `B_rms ≈ C_Brms·μ₀^(1/2)·ρ̄_c^(1/6)·(D/V)^(1/3)·Q_conv^(1/3)`, con `C_Brms = 0,24` (dipolari) e `0,18` (multipolari), D spessore e V volume del guscio convettivo, Q_conv potenza convettiva totale; **B_rms non dipende dalla rotazione**. Regime: dipolare se `Ro_l* < 0,1`, multipolare se `Ro_l* ≳ 0,1`; frazione dipolare massima f_dip ≤ 1,0 (dipolari) e ≲ 0,35 (multipolari), raccordate con un gradino morbido attorno a 0,1. — [Zuluaga et al. 2013, arXiv:1304.2909](https://arxiv.org/abs/1304.2909)
- [V, con riserva] La loro eq. 29 per il Rossby locale è stampata come `Ro_l* = 0,67·ρ̄_c^(−1/6)·R_c^(−2/3)·D^(−1/3)·V^(−1/2)·Q_conv^(1/2)·P^(7/6)` (P periodo di rotazione). **[C] Così com'è non è adimensionale** (restano kg^(1/3)·m^(−1)·s^(−1/3)) e con i numeri SI della Terra dà ~4·10⁻⁶ invece di ~0,08: mancano le diffusività, assorbite nella costante. Non codificarla da qui: usare `Ro_l = 0,58·Ra_Q^(1/2)·E^(−1/3)·Pr^(1/5)·Pm^(−1/5)` di Olson e Christensen [V‑prec]. — [arXiv:1304.2909](https://arxiv.org/abs/1304.2909) **Verifica 2026-11 [V]: riserva confermata.** Nel sorgente del 2013 l'eq. 29 è davvero stampata così, con rinvio all'eq. 5 di Zuluaga e Cuartas 2012 ([arXiv:1101.0691](https://arxiv.org/abs/1101.0691), letto); lì la forma madre è adimensionale: `Ro*_l ≡ Ro_l/(1 + χ) = c_Rol·p^(1/2)·E^(−1/3)·(Pr/Pm)^(1/5)`, con `p = Q_conv/(Ω³·D²·ρ̄_c·V)`, `E = ν/(Ω·D²)`, `Pr/Pm = λ/κ`, χ = R_ic/R_c; nella forma compatta la costante C «depends on the core viscous, thermal and magnetic diffusivities» ed è **fissata imponendo Ro*_l = 0,07 per la Terra** (1 M⊕, 4,54 Ga, P = 1 giorno). Lo 0,67 è quindi una costante dimensionale tarata, non un coefficiente universale. In codice: usare la forma con p ed E, oppure la forma compatta con C tarato sulla Terra; [C] con i numeri del riscontro qui sotto `p = 8,2·10⁻¹³`, `E = 2,7·10⁻¹⁵` (ν = 10⁻⁶ m²/s), e `p^(1/2)·E^(−1/3)·(λ/κ)^(1/5) ≈ 0,65` per λ/κ = 10⁵: per avere 0,07 servirebbe c_Rol ≈ 0,1 (il valore di c_Rol non è stato cercato).
- [C] Riscontro Terra con la formula di B_rms: ρ̄_c = 1,1·10⁴ kg/m³; D = 2,26·10⁶ m; V = 1,69·10²⁰ m³; Q_conv = 3 TW → B_rms = 0,43 mT nel nucleo; un dipolo di 0,26 mT al bordo del nucleo portato in superficie con (R_c/R_p)³ = 0,163 dà 0,04 mT (misurato: 0,03 mT all'equatore; momento 7,9·10²² A·m²). — formula da [arXiv:1304.2909](https://arxiv.org/abs/1304.2909)
- [V‑sec] Numeri di riscontro dei pianeti (momento magnetico in unità terrestri; distanza della magnetopausa in raggi planetari, prevista e osservata): Mercurio 0,0004; 1,5; 1,4 — Terra 1; 10; 10 — Giove 20 000; 42; 75 — Saturno 600; 19; 19 — Urano 50; 25; 18 — Nettuno 25; 24; 24,5; Venere e Marte senza campo globale né magnetopausa. — [Wikipedia, Magnetopause](https://en.wikipedia.org/wiki/Magnetopause)

**Stelle: rotazione–attività**
- [V] Wright e altri 2011 (824 stelle): `R_X = L_X/L_bol` è costante («saturo») a `log R_X,sat = −3,13 ± 0,08` per `Ro ≤ Ro_sat = 0,13 ± 0,02`; sopra, `R_X ∝ Ro^β` con `β = −2,18 ± 0,16` (fit a due tratti; sovrastima il Sole di 2–3 volte) oppure `β = −2,70 ± 0,13` (campione senza selezione in X, 36 stelle). Tempo di rimescolamento convettivo empirico: `log τ[giorni] = 1,16 − 1,49·log(M/M☉) − 0,54·log²(M/M☉)` (dispersione 0,028 dex, valido da 0,09 M☉). — [Wright et al. 2011, arXiv:1109.4634](https://arxiv.org/abs/1109.4634)
- [V] Alternativa in funzione della temperatura: `τ_c[giorni] = 314,24·exp[−(T_eff/1952,5 K) − (T_eff/6250 K)^18] + 0,002`, valida per 3300 ≲ T_eff ≲ 7000 K. — [Cranmer & Saar 2011, arXiv:1108.4369, eq. 36](https://arxiv.org/abs/1108.4369)
- [C] Sole: Wright dà τ = 14,5 d, Cranmer–Saar 12,9 d (lo stesso valore che Matt 2015 usa come τ_cz☉).
- [V] Campo medio di superficie misurato (292 nane M): `⟨B⟩ = 199 G × Ro^(−1,26 ± 0,10)` per Ro > 0,13; `⟨B⟩ = 2050 G × Ro^(−0,11 ± 0,03)` per Ro < 0,13; flusso `Φ_B = 5,21·10²⁶ Mx × P^(−1,25)`. — [Reiners et al. 2022, arXiv:2204.00342](https://arxiv.org/abs/2204.00342)
- [V] Campo a grande scala (mappe Zeeman–Doppler, 73 stelle): `⟨|B_V|⟩ ∝ t^(−0,655 ± 0,045)` e `∝ Ro^(−1,38 ± 0,14)`. — [Vidotto et al. 2014, arXiv:1404.2733](https://arxiv.org/abs/1404.2733)

**Frenamento magnetico**
- [V] Matt e altri 2015: coppia del vento `T = −T₀·(τ_cz/τ_cz☉)^p·(Ω/Ω☉)^(p+1)` (non saturo) e `T = −T₀·χ^p·(Ω/Ω☉)` (saturo, cioè Ro ≤ Ro☉/χ, con χ ≡ Ro☉/Ro_sat), con `T₀ = 6,3·10³⁰ erg·(R/R☉)^3,1·(M/M☉)^0,5` (era 9,5·10³⁰: corretto dall'erratum), χ = 10, p = 2, Ω☉ = 2,6·10⁻⁶ s⁻¹, τ_cz☉ = 12,9 d (τ_cz dalla formula di Cranmer e Saar). Tempi: `τ_sat = I·Ω☉/(T₀·χ^p)`, `τ_unsat = I·Ω☉/(T₀·p)·(τ_cz☉/τ_cz)^p`; nel limite lento `Ω/Ω☉ → (τ_unsat/t)^(1/p)`, cioè Skumanich (Ω ∝ t^(−1/2)) per p = 2. — [Matt et al. 2015, arXiv:1412.4786](https://arxiv.org/abs/1412.4786) **Verifica 2026-11 [V]:** letto l'erratum, [Matt e altri 2019, ApJL 870, L27](https://doi.org/10.3847/2041-8213/aafa1b): nell'articolo i momenti d'inerzia erano troppo grandi di un fattore 3/2 esatto; valori corretti I☉ = 7,00·10⁵³ g cm² (era 1,05·10⁵⁴) e T₀ = 6,3·10³⁰ erg; i risultati non cambiano perché conta T₀/I. Con momenti d'inerzia veri va usato 6,3·10³⁰; [C] τ_unsat☉ = I☉·Ω☉/(2·T₀) = 4,58 Ga.
- [V] Per le solari (0,9–1,1 M☉): tempo di uscita dalla saturazione `t_sat[Ma] = 2,9·Ω₀^1,14` (Ω₀ rotazione a 1 Ma in unità solari); percentili 10°, 50°, 90° di Ω₀ ≈ 1,8; 6,2; 45,6 Ω☉ → t_sat ≈ 5,7; 23; 226 Ma. Dopo: `L_X[erg/s] = 2,0·10³¹·t^(−1,12)`; `2,6·10³²·t^(−1,42)`; `2,3·10³⁶·t^(−2,50)` (t in Ma) e `L_EUV = 7,4·10³¹·t^(−0,96)`; `4,8·10³²·t^(−1,22)`; `1,2·10³⁶·t^(−2,15)`. Conversione usata: `log L_EUV(100–920 Å) = 4,8 + 0,86·log L_X(5–100 Å)` (Sanz‑Forcada 2011). — [Tu et al. 2015, arXiv:1504.04546](https://arxiv.org/abs/1504.04546)
- [C] Riscontro: la traccia mediana a 4570 Ma dà L_X = 1,7·10²⁷ erg/s (Sole: 10²⁶·⁸–10²⁷·⁵ lungo il ciclo).

**XUV nel tempo**
- [V] Ribas e altri 2005 (sei analoghe solari, 0,1–6,7 Ga), flusso a 1 UA: `F(1–1200 Å) = 29,7·[τ(Ga)]^(−1,23) erg s⁻¹ cm⁻²` (eq. 1). Per banda (Tabella 5, `F = α·τ^β`): 1–20 Å α = 2,40; β = −1,92 — 20–100 Å 4,45; −1,27 — 100–360 Å 13,5; −1,20 — 360–920 Å 4,56; −1,00 (interpolata, non osservata) — 920–1180 Å 2,53; −0,85. Lyman α: `F = 19,2·τ^(−0,72)`. Valori integrati 1–1180 Å (Tabella 4): 513,5 (0,10 Ga); 129,3 (0,30); 51,1 (0,65); 16,0 (1,6); 4,64 (4,56, Sole); 2,9 (6,7). Le righe più dure calano più in fretta. — [Ribas et al. 2005, arXiv:astro-ph/0412253](https://arxiv.org/abs/astro-ph/0412253)
- [V] Johnstone e altri 2021 (0,1–1,2 M☉, tutte le età): `R_X` a legge spezzata con `β₁ = −0,135 ± 0,030` (tratto saturo, non piatto), `β₂ = −1,889 ± 0,079`, `Ro_sat = 0,0605` e `R_X,sat = 5,135·10⁻⁴` **con i τ di Spada 2013** (circa doppi di quelli di Wright per 1 M☉, come nota [Tu 2015](https://arxiv.org/abs/1504.04546)); `log F_EUV,1 = 2,04 + 0,681·log F_X` (flussi alla superficie stellare in erg s⁻¹ cm⁻²; X = 0,517–12,4 nm, EUV = 10–36 nm), cioè `F_EUV,1/F_X = 110·F_X^(−0,319)`; dipolo `B_dip = 1,35 G·(Ro/Ro☉)^(−1,32)` e perdita di massa `Ṁ = Ṁ☉·(R/R☉)²·(Ro/Ro☉)^(−1,76)·(M/M☉)^0,649`, Ṁ☉ = 1,4·10⁻¹⁴ M☉/anno, entrambi fermi al valore di saturazione sotto Ro_sat. — [Johnstone et al. 2021, arXiv:2009.07695](https://arxiv.org/abs/2009.07695)

**Raggi cosmici e vento della stella (la voce MA2)**
- [V] Rodgers‑Lee e altri 2020: campo di forza modificato `j_1au(T)/(E² − E_p²) = β·j_LIS(T + φ)/((E + φ)² − E_p²)`; spettro interstellare locale (Vos e Potgieter 2015) `j_LIS(T) = 2,70·T^1,12/β²·((T + 0,67)/1,67)^(−3,93) m⁻² s⁻¹ sr⁻¹ MeV⁻¹` (T in GeV). Tabella 1, Sole nel tempo (età Ga; Ω/Ω☉; raggio dell'eliosfera UA; Ṁ in M☉/anno; φ in GeV): 6,0; 0,87; 47; 4,1·10⁻¹⁵; **0,09** — 4,6; 1,0; 122; 2,3·10⁻¹⁴; **0,21** — 2,9; 1,3; 500; 2,8·10⁻¹³; **0,57** — 1,7; 1,6; 696; 5,1·10⁻¹³; **1,19** — 1,0; 2,1; 950; 8,5·10⁻¹³; **1,96** — 0,6; 3,0; 1324; 1,5·10⁻¹²; **5,1** — 0,6; 3,5; 1530; 2,0·10⁻¹²; **7,45** — 0,6; 4,0; 1725; 2,4·10⁻¹²; **10,3** (gli ultimi tre φ descrivono male lo spettro sotto il picco). Raggio dell'astrosfera: `R_h = R_h☉·√(Ṁ·v/(Ṁ☉·v☉))`; diffusione `κ/(βc) = η₀·(p/p₀)^(1−γ)·r_L`, r_L raggio di Larmor nel campo del vento. — [Rodgers‑Lee et al. 2020, arXiv:2009.02173](https://arxiv.org/abs/2009.02173)
- [C] Fit mio alla tabella: `φ ≈ 0,21 GeV·(Ω/Ω☉)^2,8` tra 1 e 4 Ω☉ (errore fino al 35% a 1,3–1,6 Ω☉).

**Galassie**
- [V] Beck 2015 (rassegna): campi turbolenti di 20–30 µG nei bracci e nelle barre, 50–100 µG nelle regioni centrali di formazione stellare; intensità tipiche del campo totale ~15 µG; nella Via Lattea il metodo di Chandrasekhar–Fermi `B_tot,⊥ ≃ (4πρ/3)^(1/2)·v_turb/σ` (cgs; σ dispersione degli angoli di polarizzazione) dà ~7 µG. Sincrotrone: `ν ≃ 16 MHz·E²·B` (E in GeV, B in µG), `I_sin ∝ B^(3+α)`; l'equipartizione tra raggi cosmici e campo dà B dall'intensità radio. Dinamo α–Ω a disco sottile: angolo di passo `|p_B| = (R_α/R_Ω)^(1/2) ≈ d/H` (d ≈ 50 pc scala della turbolenza, H altezza di scala del gas ionizzato); modo più forte: campo toroidale a spirale assisimmetrica (m = 0), pari rispetto al piano. — [Beck 2015, arXiv:1509.04522](https://arxiv.org/abs/1509.04522)
- [C] Equipartizione con la turbolenza, `B = √(μ₀·ρ)·v_turb`: n = 1 cm⁻³, v = 10 km/s → 5,4·10⁻¹⁰ T = 5,4 µG.

### Inferences
- **Ricetta per `geologia.interno` (pianeti):** (1) potenza convettiva del nucleo dalla storia termica; (2) `B_rms` con C = 0,24/0,18 oppure la legge di Christensen con c = 0,63/0,23; (3) regime da `Ro_l` di Olson–Christensen (soglia 0,12; contiene il giorno: è il filo `rotazione → dinamo`); (4) dipolo in superficie = f_dip × campo al tetto della dinamo × (R_dinamo/R_p)³, momento `m = 4π·B_eq·R_p³/μ₀`. Venere esce senza dipolo per due vie indipendenti: flusso al nucleo sotto l'adiabatico, oppure Ro_l alto per il giorno lungo.
- **Giganti:** stessa legge con q₀ = calore interno al tetto della regione conduttrice. [C] Giove con q₀ ≈ 7,5 W/m² a 0,85 R_J, ρ̄ = 1300 kg/m³, F = 1 → 8 mT dentro la dinamo; l'ordine torna con il campo di superficie (0,4–1,4 mT) solo dopo il rapporto interno/superficie, che va preso dall'articolo, non stimato.
- **Ricetta per `stelle_attive.js`:** `τ_c(T_eff)` → `Ro = P/τ_c` → `R_X` (Wright) → `F_EUV` (Johnstone, eq. 19) → `Ṁ` e `B_dip` (Johnstone) → `dΩ/dt = T/I` (Matt) → `φ` dei raggi cosmici (tabella di Rodgers‑Lee). È un'ODE in Ω(t) per stella: microsecondi. La condizione iniziale Ω₀ è un evento all'indirizzo della stella, con i percentili di Tu (1,8; 6,2; 45,6 Ω☉).
- Le soglie di saturazione non sono intercambiabili: 0,13 (τ di Wright), 0,0605 (τ di Spada), Ro☉/10 ≈ 0,2 (Matt, τ di Cranmer–Saar con P☉ = 28 d). Scegliere una sola famiglia.
- La legge di Ribas (`4,64·(t/4,56)^(−1,23)` nel rapporto) è confermata, ma descrive una stella «media»: a 100 Ma le tracce di Tu differiscono di oltre un ordine di grandezza tra rotatori lenti e veloci. Per la fuga dell'aria conta quale traccia ha la stella.
- Per le galassie il modello ridotto difendibile è l'equipartizione (B dalla densità e dalla dispersione di velocità del gas che `galassie.js` ha) più una spirale con passo d/H; la crescita della dinamo non serve se non si guarda una galassia giovane.

### Gaps
- Fattore tra campo medio interno e campo alla superficie della dinamo, e F per i singoli pianeti: stanno in Christensen 2009 (supplemento) e 2010 §4, non estratti.
- Il sito di OUP (GJI) e Scholarpedia non erano raggiungibili; gli articoli di Christensen sono stati letti da copie su `maths.gla.ac.uk`.
- Cranmer e Saar 2011: letta solo l'eq. 36; il loro modello di Ṁ da onde di Alfvén non è stato estratto.
- Tempo di crescita e numero di dinamo critico delle galassie [R, ~10⁸–10⁹ anni]: non verificati.
- Stelle del tutto convettive e molto lente, giganti, stelle calde senza involucro convettivo: nessuna legge verificata qui.

---

## 2. Vento stellare, spirale di Parker, magnetopausa, fuga dell'aria, aurore

### Takeaway
Tre formule chiuse bastano per il vento alla distanza del pianeta (soluzione isoterma di Parker, densità da Ṁ, angolo della spirale) e una per la magnetopausa; i conti di riscontro tornano entro il 5% su Sole e Terra. La perdita di massa osservata è però molto dispersa: l'esponente di Wood è passato da 1,34 (2005) a 0,77 (2021).

### Cited Findings
- [V] Perdita di massa misurata dall'assorbimento Lyman α delle astrosfere: `Ṁ ∝ F_X^(0,77 ± 0,04)` per unità di superficie, con le nuove nane M (escluse subgiganti e giganti); il valore precedente, per le sole GK, era `Ṁ ∝ F_X^(1,34 ± 0,18)`; la «linea di divisione» del vento a log F_X = 6 è indebolita; il Sole non mostra correlazione Ṁ–F_X lungo il ciclo; Suzuki 2013 prevede 0,82. — [Wood et al. 2021, arXiv:2105.00019](https://arxiv.org/abs/2105.00019) [Riletto 2026-11 su entrambi i sorgenti (arXiv:astro-ph/0506401 e arXiv:2105.00019): l'esponente 1,34 ± 0,18 valeva solo sotto F_X = 8·10⁵ erg cm⁻² s⁻¹ e per sole stelle GK; il 2021 aggiunge le nane M e trova 0,77 ± 0,04: è un aggiornamento del campione, non due misure in conflitto. Usare 0,77 con una dispersione di circa un ordine di grandezza.]
- [R] Vento isotermo di Parker: `(v/c_s)² − ln(v/c_s)² = 4·ln(r/r_c) + 4·r_c/r − 3`, `r_c = G·M/(2·c_s²)`, `c_s² = k·T/(μ·m_p)` (μ ≈ 0,6), `ρ(r) = Ṁ/(4π·r²·v)`. — [Parker 1958, ApJ 128, 664](https://doi.org/10.1086/146579)
- [C] Riscontro Sole, T = 10⁶ K: c_s = 117 km/s, r_c = 6,9 R☉, v(1 UA) = 3,67·c_s = 430 km/s (misurato: 200–800 km/s [V‑sec: [Wikipedia, Parker spiral](https://en.wikipedia.org/wiki/Parker_spiral)]).
- [R] Spirale: `B_r = B₀·(r₀/r)²`, `B_φ = −B_r·Ω·r·sin θ/v`; angolo `tan ψ = Ω·r·sin θ/v`. [C] A 1 UA con Ω = 2,7·10⁻⁶ s⁻¹, v = 430 km/s: ψ = 43° (osservato ~45°). — [Parker 1958](https://doi.org/10.1086/146579)
- [V‑sec] Magnetopausa (Chapman–Ferraro): `(ρ·v²)_vento ≈ 4·B(r)²/(2μ₀)`; con dipolo `B(r) = μ₀·m/(4π·r³)` → `r ≈ [μ₀·m²/(8π²·ρ·v²)]^(1/6)`; Terra 6–15 R⊕ secondo l'attività. — [Wikipedia, Magnetopause](https://en.wikipedia.org/wiki/Magnetopause)
- [C] Riscontro Terra: m = 8,0·10²² A·m², n = 5 cm⁻³, v = 400 km/s → 6,5·10⁷ m = 10,2 R⊕. Giove: previsto 42, osservato 75 R_J [V‑sec, stessa pagina]: la differenza è la pressione del plasma interno (Io carica ~1000 kg/s [V‑sec: [Wikipedia, Magnetosphere of Jupiter](https://en.wikipedia.org/wiki/Magnetosphere_of_Jupiter)]).
- [V‑sec] Vie di fuga: Jeans (termica, molecola per molecola sopra l'esobase), idrodinamica (deflusso in blocco), sputtering e scambio di carica col vento (più forti senza magnetosfera), vento polare lungo le linee di campo aperte. — [Wikipedia, Atmospheric escape](https://en.wikipedia.org/wiki/Atmospheric_escape); [Polar wind](https://en.wikipedia.org/wiki/Polar_wind)
- [R] Jeans: `Φ = n_exo·(v₀/(2√π))·(1 + λ)·e^(−λ)`, `λ = G·M·m/(k·T·r_exo)`, `v₀ = √(2kT/m)`; idrodinamica per λ ≲ 2–3; limite di diffusione `Φ ≈ b·f_T/H`. [C] Terra, idrogeno, T_exo = 1000 K: λ = 7,0. — [Catling & Zahnle 2009, Sci. Am. (rassegna)](https://doi.org/10.1038/scientificamerican0509-36)
- [V] Scala usata da Tu per un'atmosfera di idrogeno a 1 UA attorno a una solare: `Ṁ_pl[g/s] = 5,9·10⁶·F_EUV[erg s⁻¹ cm⁻²]` (da Lammer 2014: 3,5·10³² m_H/s a F_EUV = 100). — [Tu et al. 2015, arXiv:1504.04546](https://arxiv.org/abs/1504.04546)
- [V‑sec] Aurore terrestri: O a 630,0 nm (rosso, in alto; vita dello stato 107 s, spento dagli urti più in basso), O a 557,7 nm (verde, dominante; 0,7 s; bordo inferiore netto perché l'ossigeno atomico crolla sotto ~100 km), N₂ e N₂⁺ nel blu con 428 nm dominante; nessuna aurora sotto 70 km (Størmer). — [Wikipedia, Aurora](https://en.wikipedia.org/wiki/Aurora)
- [V‑sec] Giove: potenza aurorale totale 100 TW, emissione radio 0,01–40 MHz, spettro dal radio ai raggi X; particelle fino a 100 MeV. — [Wikipedia, Magnetosphere of Jupiter](https://en.wikipedia.org/wiki/Magnetosphere_of_Jupiter)
- [V‑sec] Linea di campo dipolare: `r = L·cos²λ` (r in raggi planetari). — [Wikipedia, L‑shell](https://en.wikipedia.org/wiki/L-shell)

### Inferences
- **Ovale aurorale da una riga:** la linea di campo che arriva alla magnetopausa tocca il suolo alla latitudine `Λ = arccos(1/√L)`; con L = R_mp = 10 → 71,6° (bordo della calotta polare terrestre: 70–75°). L'ovale si allarga verso l'equatore quando il vento comprime la magnetosfera: esce da `risalita.ventoStellare` senza parametri.
- **Potenza delle aurore:** flusso di energia cinetica del vento sulla sezione della magnetosfera, `P = ½·ρ·v³·π·R_mp²`; [C] Terra: 3,5·10¹² W; con l'1% di `RESA_AURORE` → 35 GW, l'ordine giusto. Giove non segue la regola (100 TW vengono dalla rotazione e da Io): serve un secondo termine ∝ Ω·carico di plasma.
- **Colore dell'aurora da regole:** le righe sono quelle dei gas dell'alta aria (`P.atmosfera`): O/N₂ → verde, rosso, blu; H₂ (giganti) → bande UV di Lyman e Werner e H₃⁺ nell'infrarosso [R]; CO₂ (Marte, Venere) → bande UV di CO₂⁺ e CO Cameron, e la stessa riga verde dell'ossigeno [R]. Quale domina dipende dalla quota a cui si fermano gli elettroni (densità di colonna contro vita dello stato eccitato).
- Per la fuga: tenere tre regimi con passaggio continuo in λ (Jeans → limitata dall'energia) e aggiungere la perdita non termica come frazione del flusso di vento intercettato; il campo magnetico la riduce ma apre il vento polare.

### Gaps
- Tassi misurati di fuga non termica (Marte da MAVEN, Venere, vento polare terrestre ~1 kg/s) [R]: non verificati. — [Jakosky et al. 2018](https://doi.org/10.1016/j.icarus.2018.05.030)
- Profondità di penetrazione degli elettroni aurorali in funzione dell'energia (Rees 1963) e 35 eV per coppia di ioni [R]: non verificati.
- La pagina di Wikipedia sulla spirale di Parker non riporta la formula in chiaro; l'articolo di Parker non è stato aperto.
- Nessuna legge verificata per magnetosfere indotte (Venere, Marte) né per la riconnessione.

---

## 3. Fasce di radiazione: moti, invarianti, sorgente CRAND, diffusione radiale, modelli AE8/AP8/AE9, Boris

### Takeaway
I tre periodi (giro, rimbalzo, deriva) hanno formule chiuse verificate e il passo di Boris è confermato nella forma relativistica esatta; la diffusione radiale ha quattro parametrizzazioni pubblicate in Kp, tutte tarate sulla Terra. Dei modelli AE8/AP8/AE9 si riusano le coordinate e i numeri di riscontro, non le tabelle.

### Cited Findings
- [V] Schema di Boris relativistico (u = γv): mezzo impulso elettrico `u⁻ = uⁿ + (q·Δt/2m)·E`; rotazione `u⁺ = u⁻ + (u⁻ + u⁻ × t) × s` con `t = q·Δt·B/(2·m·γ⁻)`, `γ⁻ = √(1 + (u⁻/c)²)`, `s = 2t/(1 + t²)`; secondo mezzo impulso `uⁿ⁺¹ = u⁺ + (q·Δt/2m)·E`; campi presi a metà passo (posizioni sfalsate di Δt/2). La rotazione conserva γ, quindi l'energia in campo magnetico puro. Varianti: Vay e Higuera–Cary, che correggono la deriva E×B a grande γ. — [Ripperda et al. 2018, arXiv:1710.09164](https://arxiv.org/abs/1710.09164)
- [V] Periodi in un dipolo (da Walt 1994): rimbalzo `τ_b ≈ 0,117·(R₀/R_e)·(c/v)·[1 − 0,4635·(sin α_eq)^(3/4)]` secondi; deriva `τ_d ≈ (2π·q·B₀·R_e³/(m·v²))·(1/R₀)·[1 − (1/3)·(sin α_eq)^0,62]`; R₀ distanza equatoriale della linea guida, α_eq angolo di passo all'equatore. Terzo invariante `J₃ = q·Φ` (flusso dentro il guscio di deriva). — [Öztürk 2012, arXiv:1112.3487](https://arxiv.org/abs/1112.3487); stessa forma della deriva in [Ripperda et al. 2018, eq. 70](https://arxiv.org/abs/1710.09164)
- [C] Riscontro: protone da 10 MeV a L = 2, α_eq = 90° (con m → γm): τ_b = 0,87 s; τ_d = 132 s = 2,2 min (regola nota 44/(L·E[MeV]) minuti: 2,2 min).
- [R] Il resto classico: `ω_c = q·B/(γm)`; dipolo `B = B₀·(R_e/r)³·√(1 + 3·sin²λ)`; specchio `sin²α_eq = B_eq/B_m`; cono di perdita `sin²α_LC = 1/√(4L⁶ − 3L⁵)`; `μ = p_⊥²/(2mB)`, `J = ∮p_∥ ds`. — [Walt 1994](https://doi.org/10.1017/CBO9780511524981)
- [V] CRAND (neutroni di albedo dei raggi cosmici che decadono) è ritenuto il meccanismo principale della fascia interna di protoni alle energie alte; sotto ~100 MeV e a L ≳ 1,3 dominano i protoni solari; la sorgente dipende dalla rigidità di taglio geomagnetica del luogo. — [Sarkar & Roy, arXiv:2112.08677](https://arxiv.org/abs/2112.08677)
- [V] Diffusione radiale, coefficienti in giorni⁻¹: Brautigam e Albert 2000 `D_LL = 10^(0,506·Kp − 9,325)·L^10` (0 < Kp < 6; 3 < L* < 6,6); Boscher 2018 `10^(0,45·Kp − 8,985)·L^10,2`; Ozeke 2014 `D^B = 6,62·10⁻¹³·L⁸·10^(−0,0327·L² + 0,625·L − 0,0108·Kp² + 0,499·Kp)` e `D^E = 2,16·10⁻⁸·L⁶·10^(0,217·L + 0,461·Kp)`; Liu 2016 `D^E = 1,115·10⁻⁶·10^(0,281·Kp)·L^8,184·μ^(−0,608)` (0 < Kp < 5; 4,5 < L* < 7). — [Katsavrias et al., ANGEO 2021 (preprint, Tabella 1)](https://angeo.copernicus.org/preprints/angeo-2021-56/angeo-2021-56-manuscript-version4.pdf)
- [V] Termine elettrostatico di Brautigam e Albert: campo `ΔE(Kp) = 0,26·(Kp − 1) + 0,1 mV/m`, tempo di decadimento T = 2,5·10³ s, `D^E_LL ∝ L⁶` (in cm²/s, unità di Gauss); la stessa fonte riscrive `D^M_LL = 10^(0,506Kp − 9,325)·L^10 R_E²/giorno`. — [Komatsu & Watanabe 2008, Geophys. Bull. Hokkaido Univ. 71, 61](https://eprints.lib.hokudai.ac.jp/repo/huscap/all/32760/71-61.pdf)
- [S] Il termine elettrostatico di solito si esclude dalle simulazioni perché dà flussi non fisici a L basso. — [Brautigam & Albert 2000](https://doi.org/10.1029/1999JA900344)
- [C] Ordini di grandezza: Kp = 2, L = 4 → D = 5·10⁻³ giorni⁻¹ (~200 giorni); Kp = 6, L = 6 → 31 giorni⁻¹ (meno di un'ora).
- [R] Equazione a μ e J fissati: `∂f/∂t = L²·∂/∂L(D_LL·L⁻²·∂f/∂L) − f/τ + S`. — [Schulz & Lanzerotti 1974](https://doi.org/10.1007/978-3-642-65675-0)
- [V] AP‑8 e AE‑8 (NASA) sono lo standard di fatto dagli anni Settanta, **statici** (medie; minimo e massimo solare); CRRES ha mostrato che le variazioni nel tempo contano molto di più. Numeri: protoni sopra 10 MeV confinati sotto 20 000 km di quota; elettroni in due zone (sotto 1 R⊕ di quota e sopra 2 R⊕) separate da una lacuna; la fascia esterna scende a bassa quota alle alte latitudini; l'Anomalia del Sud Atlantico deriva a ovest di 0,3°/anno; sotto 2000 km i protoni mostrano l'effetto est–ovest (fattore 3 o più) perché il raggio di giro è paragonabile all'altezza di scala dell'aria. — [SPENVIS, Trapped particle radiation models](https://www.spenvis.oma.be/help/background/traprad/traprad.html)
- [V] AE9/AP9/SPM («IRENE») è dell'AFRL; il sito elenca versioni pubbliche ma lo scaricamento passa per una richiesta di account. — [AFRL VDL, IRENE‑AE9/AP9/SPM](https://www.vdl.afrl.af.mil/programs/ae9ap9/)

### Inferences
- **Ricetta per `cosmo.fascia`:** griglia 1D in L (50 celle) per ogni coppia (μ, J); sorgente CRAND = flusso di neutroni di albedo (dalla cascata nell'aria, quindi dai raggi cosmici dopo la modulazione del §1 e la soglia di Størmer) × probabilità di decadere nella fascia; bordo esterno alla magnetopausa del §2, interno all'atmosfera (cono di perdita) e agli anelli. Stato stazionario: un sistema tridiagonale, microsecondi.
- **Che cosa portare su altri pianeti.** Le quattro formule sono fit terrestri in Kp. Si può portare la struttura: `D_LL ∝ L^10 × (potenza delle fluttuazioni del vento)`, sostituendo Kp con la pressione dinamica del vento di quella stella normalizzata alla Terra. Va dichiarata come estrapolazione: per Giove e Saturno la diffusione è guidata dai venti della ionosfera con L^3–L^4 [R: [Lejosne & Kollmann 2020](https://doi.org/10.1007/s11214-020-0642-6)].
- **Che cosa è riusabile di AE8/AP8/AE9:** (a) le coordinate (E, L, B/B₀), che sono quelle degli invarianti; (b) i numeri di riscontro sopra, per provare che il modello a diffusione dia due zone di elettroni e una lacuna; (c) niente tabelle nel programma: descrivono solo la Terra, e la licenza di ridistribuzione non è stata accertata.
- Boris con `Δt ≤ 0,1·2π/ω_c` conserva il raggio di giro; per seguire rimbalzo e deriva (rapporti 1 : 10³ : 10⁶ nei tempi) nella finestra conviene il centro guida fuori dalla zona guardata e Boris solo dentro (regola «solo dove si guarda»).

### Gaps
- Brautigam e Albert 2000 (Wiley) e Lejosne e Kollmann 2020 (Springer) non erano raggiungibili: il prefattore completo del termine elettrostatico non è stato letto; T = 2,5·10³ s viene dalla fonte giapponese e va confrontato con l'originale.
- Flusso di neutroni di albedo e spettro della sorgente CRAND: nessun numero verificato.
- Vite degli elettroni nella lacuna (diffusione in angolo di passo da onde): nessuna formula verificata.
- Licenza e formato delle tabelle AE8/AP8 (pagina CCMC: 404) e di IRBEM: non verificati.

---

## 4. Elettricità dell'atmosfera: carica nelle nubi, frequenza dei fulmini, circuito globale, ionosfera, Schumann, altri pianeti, chimica prodotta

### Takeaway
La costante di Romps è confermata sul manoscritto dell'autore: `η/E = 1,3·10⁻¹¹ J⁻¹`, cioè l'1% di CAPE × acqua piovuta con 1 GJ per fulmine; vale però per i fulmini nube–suolo sugli Stati Uniti e non riproduce il contrasto terra–mare. La resa chimica è chiusa da due numeri indipendenti che si confermano a vicenda: 9·10¹⁶ molecole di NO per joule e 250 moli per fulmine.

### Cited Findings
- [V] Romps e altri 2014: `F = (η/E)·P·CAPE`, F in fulmini m⁻² s⁻¹, P precipitazione in kg m⁻² s⁻¹, CAPE in J/kg (definizione adiabatica); P·CAPE è la massima potenza per area ceduta ai condensati in salita (W/m²). Retta migliore: **`η/E = 1,3 × 10⁻¹¹ J⁻¹`**; con E = 1 GJ per fulmine nube–suolo (stime da qualche decimo a qualche GJ) → η = 0,01. Spiega il 77% della varianza della serie dei fulmini nube–suolo sugli Stati Uniti contigui; +12 ± 5% per °C in 11 modelli. «We do not propose here a specific charging mechanism». — [Romps et al. 2014, Science 346, 851 (manoscritto su eScholarship)](https://escholarship.org/content/qt0x75w0pj/qt0x75w0pj.pdf)
- [V, solo titolo] Seguito del 2018: «CAPE times P explains lightning over land but not the land‑ocean contrast». — [OSTI 1563982](https://www.osti.gov/pages/biblio/1563982-cape-times-explains-lightning-over-land-landocean-contrast)
- [C] Con medie globali (P = 3,1·10⁻⁵ kg m⁻² s⁻¹, CAPE = 500 J/kg ovunque) la formula dà ~100 fulmini nube–suolo al secondo, dieci volte troppo: va applicata cella per cella e solo dove c'è convezione profonda, e sul mare serve un fattore in meno.
- [V‑sec] Price e Rind 1992, come riportata da Wong e altri 2013: continentale `f_c = 3,44·10⁻⁵·z_top^4,9` (fulmini al minuto, z_top quota della cima in km); marina `f_m = 6,4·10⁻⁴·z_top^1,73` (era 6,2·10⁻⁴, come stampato in Wong e altri 2013); `w_max = 1,49·z_top^1,09` per le nubi continentali. — [Wong et al. 2013, GMD 6, 429](https://gmd.copernicus.org/articles/6/429/2013/gmd-6-429-2013.pdf). Nota: il coefficiente marino è di solito citato come 6,4·10⁻⁴ [R: [Price & Rind 1992](https://doi.org/10.1029/92JD00719)]: discrepanza da sciogliere sull'originale. **Sciolta nel 2026-11 [V‑sec su articolo che ricostruisce la derivazione; l'originale, Wiley, non è aperto]:** Luhar e altri 2021 ([ACP 21, 7053](https://acp.copernicus.org/articles/21/7053/2021/acp-21-7053-2021.pdf), §3.2, letto) riportano le equazioni di Price e Rind: `F_L = 3,44·10⁻⁵·H^4,9`, `w_L = 1,49·H^1,09`, da cui `w = 14,66·F^0,22`; `w_O = 2,86·H^0,38`; `F_O = 6,4·10⁻⁴·H^1,73`, e osservano che il conto darebbe 5,94 al posto di 6,4. [C] Rifatto qui: (2,86/14,66)^(1/0,22) = 5,94·10⁻⁴, esponente 0,38/0,22 = 1,727. Dunque 6,4·10⁻⁴ è il valore stampato da Price e Rind, 5,94·10⁻⁴ quello coerente con la loro derivazione, 6,2·10⁻⁴ una variante di Wong; lo scarto (≤ 8%) è irrilevante rispetto all'errore della formula marina, che secondo Luhar sottostima di circa due ordini di grandezza: la loro proposta è `F_O = 2,0·10⁻⁵·H^4,38` sul mare e `F_L = 2,40·10⁻⁵·H^5,09` a terra (lampi al minuto, H in km).
- [C] f_c: 2,7 fulmini/min a 10 km, 20 a 15 km; f_m a 10 km: 0,03.
- [V‑sec] Separazione di carica: nella zona di salita tra −15 e −25 °C i cristalli di ghiaccio che urtano la neve tonda (graupel) si caricano positivi, il graupel negativo; il positivo sale in cima. Un fulmine negativo medio: 30 kA, 15 C, 1 GJ; i positivi fino a 120 kA e 350 C; energia tra 200 MJ e 7 GJ; canale a ~30 000 °C. — [Wikipedia, Lightning](https://en.wikipedia.org/wiki/Lightning)
- [R] Meccanismo non induttivo quantitativo: carica per urto 1–100 fC, con segno che si inverte a una temperatura (da −10 a −20 °C) che dipende dall'acqua liquida sopraffusa. — [Takahashi 1978](https://doi.org/10.1175/1520-0469(1978)035<1536:REAACG>2.0.CO;2); [Saunders 2008](https://doi.org/10.1007/s11214-008-9345-0)
- [V‑sec] Circuito globale: i temporali portano carica negativa al suolo; corrente di bel tempo ~2 pA/m² (3,5 µA/km²), 1800 A in tutto; gradiente di potenziale al suolo 100–120 V/m; variazione diurna in tempo universale (curva di Carnegie); gli ioni vengono dai raggi cosmici e dalla radioattività del suolo. — [Wikipedia, Global atmospheric electrical circuit](https://en.wikipedia.org/wiki/Global_atmospheric_electrical_circuit); [Atmospheric electricity](https://en.wikipedia.org/wiki/Atmospheric_electricity)
- [V‑sec] Risonanze di Schumann: `f_n = (c/(2π·a))·√(n(n+1))` in cavità ideale; osservate a 7,83; 14,1; 20,3; 26,3; 32,5 Hz, più basse per la conducibilità finita della ionosfera. — [Wikipedia, Schumann resonances](https://en.wikipedia.org/wiki/Schumann_resonances)
- [C] Terra ideale: 10,6; 18,4; 25,9 Hz → rapporto osservato/ideale 0,74.
- [V‑sec] Ionosfera: frequenza critica `f = 9·√N` Hz (N elettroni per m³); la funzione di Chapman ch(x, z) sostituisce sec z per il Sole radente. — [Wikipedia, Ionosphere](https://en.wikipedia.org/wiki/Ionosphere); [Chapman function](https://en.wikipedia.org/wiki/Chapman_function)
- [R] Strato di Chapman: `q(z, χ) = q_m·exp[1 − y − sec χ·e^(−y)]`, `y = (z − z_m)/H`; picco dove la profondità ottica obliqua vale 1 (`n·σ·H·sec χ = 1`); equilibrio `N_e = √(q/α)`. — [Chapman 1931, Proc. Phys. Soc. 43, 26](https://doi.org/10.1088/0959-5309/43/1/305)
- [V] Altri mondi (Aplin 2006): tutte le atmosfere sono debolmente elettrizzate dai raggi cosmici; prove di fulmini su Giove, Saturno, Urano, Nettuno; probabili su Marte (polvere), Venere, Titano. Venere: i 90 bar alzano tanto la tensione di scarica da impedire i fulmini nube–suolo; risonanza ELF prevista a ~9 Hz (Pechony e Price 2004). Titano: Voyager 1 non vide fulmini (soglia ≤ 1 MJ per fulmine). — [Aplin 2006, arXiv:physics/0505123](https://arxiv.org/abs/physics/0505123)
- [V‑sec] Giove: fulmini legati alle nubi d'acqua (liquida e ghiaccio), fino a mille volte più potenti dei terrestri. Venere: prove ottiche ed elettromagnetiche ambigue (Venera 9 e 10), dibattito aperto. — [Wikipedia, Thunderstorm](https://en.wikipedia.org/wiki/Thunderstorm); [Atmosphere of Venus](https://en.wikipedia.org/wiki/Atmosphere_of_Venus)
- [V‑sec] Fulmini vulcanici: da urti e frammentazione delle ceneri (e a volte ghiaccio) nel pennacchio; avvengono anche senza cristalli di ghiaccio. — [Wikipedia, Volcanic lightning](https://en.wikipedia.org/wiki/Volcanic_lightning)
- [V] NOx: un fulmine «tipico» produce 15 (2–40)·10²⁵ molecole di NO = 250 mol = 3,5 kg di azoto; sorgente globale (5 ± 3) Tg N/anno. — [Schumann & Huntrieser 2007, ACP 7, 3823](https://acp.copernicus.org/articles/7/3823/2007/acp-7-3823-2007.pdf)
- [V] Resa per energia: `P(NO) = (8,04 ± 2,00)·10¹⁶ molecole/J` (modello d'urto con cinetica), contro (9 ± 2)·10¹⁶ di Borucki e Chameides 1984; temperatura di «congelamento» di NO ≈ 2000 ± 500 K. — [Ardaseva et al. 2017, arXiv:1704.07917](https://arxiv.org/abs/1704.07917)
- [C] I due numeri si chiudono: 1,5·10²⁶ molecole per fulmine ÷ 9·10¹⁶ per joule = 1,7 GJ per fulmine; 44 fulmini/s × 3,5 kg × un anno = 4,9 Tg N.
- [V‑sec] Miller–Urey: il metano è l'ingrediente decisivo (via HCN); l'ammoniaca non serve (si forma dall'azoto nella scarica); col carbonio ossidato le rese crollano, ma tornano simili con un rapporto H₂/CO₂ alto. — [Wikipedia, Miller–Urey experiment](https://en.wikipedia.org/wiki/Miller%E2%80%93Urey_experiment)

### Inferences
- **`risalita.fulmini` in due livelli.** Tasso: Romps per cella con CAPE dall'adiabatica satura di `meteo.js`, applicato dove coesistono ghiaccio e acqua sopraffusa tra −10 e −25 °C; senza quella fascia, zero (salvo polvere o cenere). Le sole cose misurate sono η = 1% ed E. Per atmosfere diverse E scala con la tensione di scarica (∝ pressione) e la lunghezza del canale.
- **Chimica dei fulmini da una regola:** resa di NO = 9·10¹⁶ molecole/J × potenza dei fulmini quando l'aria contiene N₂ e un ossidante (O₂, CO₂, H₂O); con C/O > 1 e idrogeno il prodotto è HCN [R: [Chameides & Walker 1981](https://doi.org/10.1007/BF00931483)]. Il «congelamento» a ~2000 K è l'equilibrio termodinamico che `chimica.js` sa già calcolare, fermato quando il canale si raffredda: si può derivare invece di tabulare.
- **Circuito globale come uscita, non ingresso:** conducibilità `σ = e·(μ₊ + μ₋)·√(q/α)` con q dalla ionizzazione dei raggi cosmici (catena del §1) → resistenza di colonna → corrente = somma dei temporali. [C] σ = 1,5·10⁻¹⁴ S/m × 120 V/m = 1,8 pA/m², coerente con il valore citato.
- **Schumann su ogni pianeta:** `f₁ ≈ 0,74·c·√2/(2π·a)`; Venere (a = 6052 km) → 8,2 Hz, vicino ai ~9 Hz previsti. Esiste solo se ci sono una ionosfera e un suolo conduttore.
- Ionosfera: un solo strato di Chapman per specie ionizzabile, con il flusso XUV del §1 e l'altezza di scala dell'alta aria; dà la densità di picco, quindi la frequenza critica, la quota delle aurore, il tetto della cavità di Schumann.

### Gaps
- L'elettrificazione non induttiva resta senza formula verificata: le tabelle carica–temperatura–acqua liquida di Takahashi e di Saunders non sono state aperte. La scienza non la ricava dai principi.
- Potenziale della ionosfera (~250 kV), resistenza totale (~200 Ω), tempo di rilassamento [R]: non verificati.
- Elettrizzazione delle polveri marziane e dei pennacchi: nessun numero verificato (solo l'aspettativa qualitativa in Aplin).
- Rese di HCN e di amminoacidi: solo fonti secondarie (rapporto precedente [S]: ~2% a H₂/CO₂ = 2–4).
- `romps.berkeley.edu`, Science e Wiley (AGU) non raggiungibili: Price e Rind 1992 letta solo attraverso chi la cita.

---

## 5. Elettricità della terra solida: conducibilità, potenziali di flusso, piezoelettricità, correnti telluriche, polveri

### Takeaway
Quattro leggi lineari coprono quasi tutto: Archie per la conducibilità delle rocce bagnate, Helmholtz–Smoluchowski per i potenziali di flusso, la profondità di pelle per l'induzione, il coefficiente piezoelettrico per il quarzo. Dipendono da grandezze che stateyour ha già (porosità, salinità, viscosità, gradiente di pressione, variazioni del campo esterno).

### Cited Findings
- [V‑sec] Archie: `C_t = (1/a)·C_w·φ^m·S_w^n`; φ porosità, C_w conducibilità dell'acqua nei pori, S_w saturazione; m = 1,8–2,0 per le arenarie, n ≈ 2, a fattore di tortuosità; vale per sabbie pulite e consolidate (le argille aggiungono conduzione di superficie). — [Wikipedia, Archie's law](https://en.wikipedia.org/wiki/Archie%27s_law)
- [V‑sec] Acqua di mare: 4,8 S/m (0,21 Ω·m); acqua potabile 5·10⁻⁴–5·10⁻² S/m. — [Wikipedia, Electrical resistivity and conductivity](https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity)
- [C] Arenaria con φ = 0,2, m = 2, satura d'acqua di mare: 0,19 S/m.
- [V‑sec] Corrente di flusso in un capillare: `I_str = −(ε_r·ε₀·a²·π/η)·(ΔP/L)·ζ`; corrente di conduzione di ritorno `I_c = K_L·a²·π·U_str/L`; allo stato stazionario `U_str/ΔP = ε_r·ε₀·ζ/(η·K_L)` (Helmholtz–Smoluchowski). — [Wikipedia, Streaming current](https://en.wikipedia.org/wiki/Streaming_current)
- [C] Acqua dolce di falda (K_L = 0,01 S/m, ζ = −30 mV, η = 10⁻³ Pa·s): −2·10⁻⁶ V/Pa, cioè ~2 V per 100 m di carico idraulico; acqua di mare (4,8 S/m, ζ ≈ −5 mV): −7·10⁻¹⁰ V/Pa.
- [V‑sec] Correnti telluriche: correnti naturali a frequenza bassissima nella crosta e nel mare; le più forti sono indotte dalle variazioni del campo esterno (vento stellare e ionosfera). — [Wikipedia, Telluric current](https://en.wikipedia.org/wiki/Telluric_current)
- [R] Induzione: profondità di pelle `δ = √(2/(μ₀·σ·ω)) ≈ 503·√(ρ[Ω·m]/f[Hz])` metri; magnetotellurica `ρ_a = |E/H|²/(ω·μ₀)`. [C] mare a 1 Hz: 230 m; crosta da 1000 Ω·m a 0,01 Hz: 160 km. — [Simpson & Bahr 2005](https://doi.org/10.1017/CBO9780511614095)
- [V‑sec] Piezoelettricità: il PVDF dà 20–30 pC/N, «several times greater than quartz». — [Wikipedia, Piezoelectricity](https://en.wikipedia.org/wiki/Piezoelectricity)
- [R] Quarzo α: d₁₁ = 2,3 pC/N, d₁₄ = −0,67 pC/N, ε_r ≈ 4,5; l'effetto sparisce nella fase β sopra 573 °C. [C] Cristallo singolo a circuito aperto sotto 10 MPa: `E = d·σ/(ε₀·ε_r)` = 5,8·10⁵ V/m. — [Bechmann 1958](https://doi.org/10.1103/PhysRev.110.1060)
- [V‑sec] Triboelettricità: i materiali si ordinano in una «serie triboelettrica» empirica secondo la polarità che prendono al contatto o allo strofinio (Wilcke 1757). — [Wikipedia, Triboelectric effect](https://en.wikipedia.org/wiki/Triboelectric_effect)

### Inferences
- **Conducibilità di una roccia in stateyour:** Archie con la porosità e il fluido del luogo, più un termine di Arrhenius per i minerali caldi (`σ = σ₀·exp(−H/kT)`, [R]) e il fuso quando c'è. Serve a: correnti telluriche, schermatura del campo esterno, riscaldamento per induzione di lune in campi variabili (Io, lune di stelle attive).
- **Potenziale spontaneo sul terreno:** `ΔV = C·ΔP` con ΔP dal flusso di falda che `mappa`/`geologia` hanno: anomalie di volt sui fianchi dei vulcani e sulle sorgenti; cala col sale (C ∝ 1/σ_w).
- **Piezoelettricità come cosa vista:** in una roccia i cristalli di quarzo sono orientati a caso e i campi si annullano, salvo vene o tessiture orientate; lampi sismici e segnali alla rottura restano dibattuti: istanziare solo alla scala del cristallo.
- **Polveri:** regola empirica difendibile [R]: tra grani dello stesso materiale i piccoli si caricano negativi e i grandi positivi; la convezione li separa e il campo cresce fino alla scarica, che a bassa pressione arriva presto (minimo di Paschen: per questo su Marte bagliori diffusi invece di fulmini).

### Gaps
- Conducibilità di rocce secche, minerali del mantello, fusi, ferro del nucleo: nessun valore verificato qui.
- Valori di ζ per minerale e pH, coefficienti piezoelettrici del quarzo, campi misurati nei diavoli di polvere: tutti [R].
- Nessuna fonte primaria aperta per questa sezione: solo Wikipedia. Da rifare su Revil e Jardani (potenziale spontaneo) e su un manuale di proprietà fisiche delle rocce.

---

## 6. La luce come spettro: stelle, trasferimento radiativo, banche dati e licenze, serra leggera, Rayleigh, Mie, cielo in tempo reale, superfici

### Takeaway
Una serra senza coefficienti tarati su Terra o Venere esiste già in forma pubblicata: il «modello spettrale semplice», dieci parametri ricavati da un conto riga per riga, che riproduce da solo il forzante del raddoppio della CO₂ (mio riscontro: 4,3 W/m²). Rayleigh è confermato con la formula e l'avvertenza di un refuso nell'indice della CO₂; i parametri di Bruneton e di Hillaire sono la stessa legge λ⁻⁴ e si possono rigenerare dai gas veri del pianeta.

### Cited Findings

**Sorgente e colore**
- [V‑sec] Planck: `B_λ(λ, T) = (2hc²/λ⁵)/(exp(hc/(λ·k_B·T)) − 1)`. — [Wikipedia, Planck's law](https://en.wikipedia.org/wiki/Planck%27s_law)
- [V] Funzioni di corrispondenza CIE 1931 (osservatore a 2°): tabella ufficiale con DOI 10.25039/CIE.DS.xvudnb9b, legata a CIE 015:2018 e ISO/CIE 11664‑1:2019. — [CIE, dataset](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer)
- [V] Il pacchetto `colour` (che le contiene) ha una licenza di tipo BSD («Redistribution and use in source and binary forms… permitted»). — [colour, LICENSE](https://raw.githubusercontent.com/colour-science/colour/develop/LICENSE)

**Trasferimento a due flussi e k correlati**
- [V] Profilo analitico per aria irradiata (Guillot 2010, eq. 29, media con μ* = 1/√3): `T⁴ = (3·T_int⁴/4)·[2/3 + τ] + (3·T_irr⁴/4)·f·[2/3 + 1/(γ√3) + (γ/√3 − 1/(γ√3))·e^(−γτ√3)]`, con `τ = κ_th·m` (m colonna di massa), `γ = κ_v/κ_th` (opacità nel visibile su termico), f = 1/4 per la media globale, 1/2 per il lato giorno. Caso di prova HD 209458b: T_eq = 1469 K, T_int = 100 K, κ_th = 10⁻² cm²/g, κ_v = 4·10⁻³ cm²/g. — [Guillot 2010, arXiv:1006.4702](https://arxiv.org/abs/1006.4702)
- [V] petitRADTRANS: modo a k correlati a λ/Δλ = 1000 e modo riga per riga a 10⁶; licenza MIT. — [Mollière et al. 2019, arXiv:1904.11504](https://arxiv.org/abs/1904.11504); [LICENSE](https://gitlab.com/mauricemolli/petitRADTRANS/-/raw/master/LICENSE)
- [V] Altre licenze: HELIOS GPL‑3 ([README](https://raw.githubusercontent.com/exoclime/HELIOS/master/README.md)); PICASO GPL‑3 ([LICENSE](https://raw.githubusercontent.com/natashabatalha/picaso/master/LICENSE)); RTE+RRTMGP BSD‑3 ([LICENSE](https://raw.githubusercontent.com/earth-system-radiation/rte-rrtmgp/main/LICENSE)); libRadtran GPL ([pagina di scaricamento](http://www.libradtran.org/doku.php?id=download)); HAPI (interfaccia Python di HITRAN) MIT ([LICENSE](https://raw.githubusercontent.com/hitranonline/hapi/master/LICENSE.txt)); miepython MIT ([LICENSE](https://raw.githubusercontent.com/scottprahl/miepython/main/LICENSE.txt)).

**Banche dati di righe**
- [V] HITRAN: «The HITRAN database and its associated compilations are free»; posizioni in numeri d'onda nel vuoto; intensità a T_ref = 296 K; accesso con registrazione. — [HITRAN, FAQ](https://hitran.org/faq/); [definizioni](https://hitran.org/docs/definitions-and-units/)
- [V] HITEMP (alte temperature), dietro accesso registrato: H₂O 114 241 164 righe, 0–30 000 cm⁻¹, 3,2 GB; CO₂ 326 260 084 righe, 6,0 GB (2024); N₂O 3,6 milioni, 65 MB. — [HITEMP](https://hitran.org/hitemp/)
- [V] ExoMol: tutti i dati sotto CC BY‑SA 4.0 (attribuzione e condivisione allo stesso modo). — [ExoMol, Licence](https://www.exomol.com/data/licence/)
- [V] Continuo dell'acqua MT_CKD: distribuito anche da HITRAN, «Copyright ©, Atmospheric and Environmental Research, Inc., 2022», con una sezione di licenza. — [HITRAN, MT_CKD](https://hitran.org/mtckd/)
- [V] NIST ASD (righe atomiche), versione 5.12 (novembre 2024): «copyright by the U.S. Department of Commerce on behalf of the United States. All rights reserved. NIST reserves the right to charge for these data in the future». — [NIST Atomic Spectra Database](https://www.nist.gov/pml/atomic-spectra-database)

**Serra leggera senza tarature su pianeti**
- [V] Jeevanjee e Fueglistaler 2020: coefficienti di assorbimento di riferimento (260 K, 500 hPa) ricavati da fit a un codice riga per riga, a esponenziale: banda di rotazione dell'acqua `κ = κ_rot·exp(−(ν̃ − ν̃_rot)/l_rot)` con ν̃_rot = 150 cm⁻¹, κ_rot = 127 m²/kg, l_rot = 56 cm⁻¹; banda di vibrazione–rotazione ν̃_v‑r = 1450 cm⁻¹, κ_v‑r = 3,8 m²/kg, l_v‑r = 40 cm⁻¹; CO₂ attorno al ramo Q a 667,5 cm⁻¹: `κ = κ_Q·exp(−|ν̃ − ν̃_Q|/l_Q)`, κ_Q = 110 m²/kg, l_Q = 11,5 cm⁻¹ (bande P e R, 500–850 cm⁻¹). L'allargamento per pressione va tenuto; la dipendenza dalla temperatura si può omettere. — [Jeevanjee & Fueglistaler 2020, JAS 77, 479](https://typeset.io/pdf/simple-spectral-models-for-atmospheric-radiative-cooling-3de83cygow.pdf)
- [V] Williams 2026, «Simple Spectral Model» per modelli di circolazione: 10 parametri. Acqua, righe: `κ_rot` costante per 10–200 cm⁻¹; `κ_rot·exp(−(ν̃ − 200)/l_rot)` per 200–1000; `κ_vr·exp(−(1450 − ν̃)/l_vr,1)` per 1000–1450; `κ_vr` per 1450–1700; `κ_vr·exp(−(ν̃ − 1700)/l_vr,2)` per 1700–2500. CO₂: `κ_CO2·exp(−|ν̃ − ν̃_CO2|/l_CO2)` per 500–850. Continuo dell'acqua: due assorbitori grigi, κ_cnt,1 (10–1700 cm⁻¹) e κ_cnt,2 (1700–2500). Valori (a 260 K, 500 hPa, umidità 100%): κ_rot = 37; κ_vr = 5; κ_cnt,1 = 0,004; κ_cnt,2 = 0,0002; κ_CO2 = 110 m²/kg; l_rot = 56; l_vr,1 = 37; l_vr,2 = 52; l_CO2 = 12 cm⁻¹; ν̃_CO2 = 667 cm⁻¹. Scale: righe `∝ p/p_ref`; continuo `∝ (p_v/p_v,ref)·exp(σ·(T_ref − T))`, σ = 0,02 K⁻¹. Due flussi con fattore di diffusività D = 1,5. Fit: mediana in intervalli di 25 cm⁻¹ dei coefficienti di PyRADS a 0,01 cm⁻¹. Riproduce in colonna singola la dipendenza dallo stato della retroazione a onda lunga. — [Williams 2026, JAMES, doi:10.1029/2025MS005405](https://andrewilwilliams.github.io/papers/26_ssm.pdf)
- [C] Riscontro: con l_Q = 11,5 cm⁻¹ la banda della CO₂ si allarga di `2·l_Q·ln 2 = 15,9 cm⁻¹` a ogni raddoppio; forzante `≈ 15,9 × π·[B(667 cm⁻¹; 288 K) − B(667 cm⁻¹; 220 K)] = 15,9 × (0,411 − 0,143) = 4,3 W/m²` (valore di riferimento a cielo sereno ~4; 3,7 con nubi e aggiustamento stratosferico). Il logaritmo esce dalla forma esponenziale della banda, senza taratura sul clima.

**Rayleigh**
- [V] `σ(ν̃) = (24π³·ν̃⁴/n_ref²)·((n² − 1)/(n² + 2))²·K(ν̃)`, n_ref densità numerica di riferimento a cui è misurato l'indice n, fattore di King `K = (6 + 3D)/(6 − 7D)` (D depolarizzazione). Indici e K di N₂ e CO₂ da Sneep e Ubachs 2005; **due refusi nella loro eq. 13** (CO₂), **corretti qui nel 2026-11 dopo aver letto l'originale** ([copia d'autore](https://www.nat.vu.nl/~wimu/Publications/Rayleigh-2005.pdf)): (i) il prefattore stampato `1,1427·10⁶` va letto `1,1427·10³` (così com'è stampata la formula dà n − 1 = 0,43 a 532 nm invece di 427·10⁻⁶, il valore della loro tabella 2); (ii) il numeratore dell'ultimo termine è `0,1218145` senza potenze di dieci (era scritto qui: «0,1218145·10⁻⁶, non 10⁻⁴», la correzione di Kitzmann): solo così la formula coincide entro lo 0,005% con quella di Bideau‑Mehu e altri 1973 riportata a 15 °C (coefficienti dalla banca dati refractiveindex.info, CC0; l'articolo del 1973 non è stato aperto); con 10⁻⁴ o con 10⁻⁶ l'ultimo termine sparisce e l'indice risulta più alto dello 0,1% a 532 nm e dell'1% a 1,6 µm [C, script]. Forma da codificare (ν̃ in cm⁻¹; 15 °C, 1013 hPa, N = 2,547·10¹⁹ cm⁻³): `n − 1 = 1,1427·10³·[5799,25/(128908,9² − ν̃²) + 120,05/(89223,8² − ν̃²) + 5,3334/(75037,5² − ν̃²) + 4,3244/(67837,7² − ν̃²) + 0,1218145/(2418,136² − ν̃²)]`, `K_CO₂ = 1,1364 + 25,3·10⁻¹²·ν̃²`; N₂: `(n − 1)·10⁸ = 6498,2 + 307,43305·10¹²/(14,4·10⁹ − ν̃²)` per 4860 < ν̃ < 21 360 cm⁻¹ e `5677,465 + 318,81874·10¹²/(14,4·10⁹ − ν̃²)` fino a 39 370 cm⁻¹, `K_N₂ = 1,034 + 3,17·10⁻¹²·ν̃²`; Ar: `(n − 1)·10⁸ = 6432,135 + 286,06021·10¹²/(14,4·10⁹ − ν̃²)`, K = 1 [V]. [C] A 532 nm queste formule ridanno la tabella 2: σ = 5,30 (N₂), 4,56 (Ar), 13,29 (CO₂) ·10⁻²⁷ cm². Acqua: D = 3·10⁻⁴. — [Kitzmann 2017, arXiv:1701.07513](https://arxiv.org/abs/1701.07513); originale: [Sneep & Ubachs 2005](https://doi.org/10.1016/j.jqsrt.2004.07.025)
- [V‑sec] Sfera piccola: `σ_s = (8π/3)·(2π/λ)⁴·((n² − 1)/(n² + 2))²·r⁶`; azoto: 5,1·10⁻³¹ m² a 532 nm. — [Wikipedia, Rayleigh scattering](https://en.wikipedia.org/wiki/Rayleigh_scattering)
- [V, tabella 2 di Sneep e Ubachs 2005 letta sulla copia d'autore, 2026-11; era S] Valori a 532 nm (18 788,4 cm⁻¹), (n − 1)·10⁶ e K: N₂ 284 e 1,035; Ar 268 e 1; CO₂ 427 e 1,145; inoltre CO 325 e 1,016; CH₄ 481 e 1,000; N₂O 483 e 1,225; SF₆ 733 e 1,000. Sezioni d'urto misurate (10⁻²⁷ cm²): Ar 4,45; N₂ 5,10; CO 6,19; CO₂ 12,4; CH₄ 12,47; N₂O 15,90; SF₆ 32,3 (calcolate dall'indice: 4,56; 5,30; 6,82; 13,29; 14,69; 18,19; 34,1). — [scheda di laboratorio, Univ. Bremen](https://www.msc-ep.uni-bremen.de/services/lectures/practicals/pr_crds_19.pdf) — originale: [Sneep & Ubachs 2005, copia d'autore](https://www.nat.vu.nl/~wimu/Publications/Rayleigh-2005.pdf)
- [C] Riscontri con n_ref = 2,547·10²⁵ m⁻³: σ(N₂, 532 nm) = 5,3·10⁻³¹ m² (Wikipedia: 5,1); profondità ottica della Terra a 550 nm = 0,097 (nota: 0,098); Marte (610 Pa di CO₂) = 0,003, quindi il colore del cielo è della polvere; Venere ≈ 16.

**Cielo in tempo reale**
- [V] Bruneton (codice dimostrativo): tabelle trasmittanza 256×64, diffusione 4D 32 (r) × 128 (μ) × 32 (μ_s) × 8 (ν), irradianza 64×16; Terra: raggi 6360 e 6420 km; Rayleigh `1,24062·10⁻⁶·λ⁻⁴ m⁻¹` (λ in µm), altezza di scala 8 km; Mie: β di Ångström 5,328·10⁻³, α = 0, altezza 1,2 km, albedo di singola diffusione 0,9, g = 0,8; ozono 300 unità Dobson in uno strato triangolare con sezioni d'urto tabulate ogni 10 nm tra 360 e 830 nm; albedo del suolo 0,1; raggio angolare del Sole 0,00935/2 rad. — [demo.cc](https://raw.githubusercontent.com/ebruneton/precomputed_atmospheric_scattering/master/atmosphere/demo/demo.cc); [constants.h](https://raw.githubusercontent.com/ebruneton/precomputed_atmospheric_scattering/master/atmosphere/constants.h)
- [V] Hillaire 2020: coefficienti al suolo (×10⁻⁶ m⁻¹, canali R; G; B): Rayleigh diffusione 5,802; 13,558; 33,1 — Mie diffusione 3,996 e assorbimento 4,40 — ozono assorbimento 0,650; 1,881; 0,085; densità `exp(−h/8 km)` e `exp(−h/1,2 km)`; g = 0,8; raggi 6360 e 6460 km. Tabelle: trasmittanza 256×64; vista del cielo 200×100 oppure 96×50 nella configurazione leggera; diffusione multipla 32×32; prospettiva aerea in un volume allineato alla camera (32×32 sullo schermo, 16 strati nella configurazione leggera). Tempi: 0,01 ms e 0,05 ms per le prime due su PC; resa di cielo e prospettiva aerea tra 0,14 e 0,31 ms secondo il caso (1280×720). Nessuna tabella ad alta dimensione: l'aria può cambiare a ogni fotogramma. — [Hillaire 2020, EGSR](https://sebh.github.io/publications/egsr2020.pdf)
- [C] I coefficienti di Hillaire sono la legge di Bruneton a 680; 550; 440 nm: 1,24062·10⁻⁶/0,55⁴ = 13,56·10⁻⁶.

**Mie**
- [V‑sec] Coefficienti a_n e b_n come rapporti di funzioni di Bessel sferiche e loro derivate, con parametro di taglia ρ = k·r dentro e fuori la sfera. — [Wikipedia, Mie scattering](https://en.wikipedia.org/wiki/Mie_scattering)
- [R] Algoritmo BHMIE: `x = 2π·r/λ`; derivata logaritmica D_n(m·x) per ricorrenza all'indietro; ψ_n, ξ_n in avanti; arresto a `n = x + 4·x^(1/3) + 2`; `Q_ext = (2/x²)·Σ(2n+1)·Re(a_n + b_n)`, `Q_sca = (2/x²)·Σ(2n+1)·(|a_n|² + |b_n|²)`. — [Bohren & Huffman 1983, App. A](https://doi.org/10.1002/9783527618156) (Verifica 2026-11: il libro non è aperto; il codice `miepython` usa il criterio di Wiscombe `x + 4,05·x^(1/3) + 2` — [core.py](https://raw.githubusercontent.com/scottprahl/miepython/main/miepython/core.py); la forma col 4 resta [R].)

**Superfici**
- [V] refractiveindex.info: banca dati sotto CC0 1.0 («free to use, modify, and distribute… even for commercial purposes»), citazione Polyanskiy 2024, Sci. Data 11, 94; file per materiale con dati tabulati n, k o formule di dispersione. — [refractiveindex.info, About](https://refractiveindex.info/about); [LICENSE](https://raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/master/LICENSE)
- [V‑sec] Parametri di Hapke: albedo di singola diffusione `ω₀ = K_s/(K_s + K_a)`, larghezza h e ampiezza B₀ del picco d'opposizione, asimmetria g, rugosità θ̄; da essi albedo geometrico e di Bond. — [Wikipedia, Hapke parameters](https://en.wikipedia.org/wiki/Hapke_parameters)
- [V‑sec] Kubelka–Munk: `R_∞ = 1 + K/S − √((K/S)² + 2·K/S)`. — [Wikipedia, Kubelka–Munk theory](https://en.wikipedia.org/wiki/Kubelka%E2%80%93Munk_theory)
- [V] Ghiaccio: compilazione di Warren e Brandt 2008 (dall'ultravioletto alle microonde), con tabelle scaricabili; tra 0,202 e 0,390 µm l'assorbimento è così basso da non essere quantificato; 0,39–0,60 µm da Warren e altri 2006. — [Univ. of Washington, Optical constants of ice](https://atmos.uw.edu/ice_optical_constants/)
- [V] ECOSTRESS 1.0 (2 febbraio 2018): oltre 3400 spettri di materiali naturali e artificiali, di cui oltre 1100 di vegetazione; chiede di citare Meerdink 2019 e Baldridge 2009. — [ECOSTRESS Spectral Library](https://speclib.jpl.nasa.gov/)
- [V‑sec] Arcobaleno secondario ~10° fuori dal primario, colori invertiti. — [Wikipedia, Rainbow](https://en.wikipedia.org/wiki/Rainbow)

### Inferences
- **`chimica.serra` senza tarature:** integrare il due flussi su ~100–250 intervalli spettrali × ~30 livelli con le bande a esponenziale; costo nell'ordine del millisecondo, oppure tabella `OLR(T_s, pCO₂, umidità, g)` precalcolata. È spettroscopia (HITRAN → fit), non taratura sul clima. Limiti: (a) solo H₂O e la banda a 15 µm della CO₂; (b) riferimento a 260 K e 500 hPa; (c) per Venere e per arie dense servono le altre bande della CO₂, l'assorbimento indotto da urti e HITEMP: lì la via resta la tabella da un codice a k correlati (petitRADTRANS, MIT). Estensione naturale: uno strumento fuori linea `strumenti/bande_gas.mjs` che rifà lo stesso fit per CH₄, NH₃, N₂O, SO₂ e per le coppie con assorbimento indotto.
- **Per i giganti e i mondi molto irradiati:** la formula di Guillot dà T(τ) con due opacità medie; γ > 1 produce da sola l'inversione termica.
- **`luce.js`, aria:** `β_R(λ) = Σ_i N_i·σ_i(λ)` con n e K per gas; altezza di scala `H = kT/(m̄·g)`; questi due numeri, più la polvere (Mie con l'indice del materiale da refractiveindex.info), sono tutti i parametri di Hillaire. Il cielo di ogni pianeta esce dai suoi gas con quattro tabelle piccole rigenerabili a ogni cambio d'aria.
- **Arcobaleni e aloni da n:** primario a `180° − D`, `D = 180° + 2θ_i − 4θ_r`, `cos θ_i = √((n² − 1)/3)`: [C] acqua (n = 1,333) 42,1°; metano liquido (n = 1,286) 49,4°. Aloni: `D_min = 2·asin(n·sin(A/2)) − A`: [C] ghiaccio d'acqua (n = 1,31), prismi a 60° e 90° → 21,8° e 45,7°. Cristalli diversi (CO₂, NH₃, CH₄) danno aloni a raggi diversi.
- **Nubi:** `τ = 3·W/(2·ρ·r_eff)` [R]; [C] 100 g/m² d'acqua con gocce da 10 µm → τ = 15.
- **Superficie:** per un suolo granulare l'albedo di singola diffusione del miscuglio è lineare nelle frazioni pesate per sezione (Hapke), mentre la riflettanza no: mescolare in ω₀ o in K/S, mai in RGB. L'albedo del clima è l'integrale di questo spettro sulla luce della stella.
- **Dati da incorporare:** refractiveindex.info (CC0) e USGS splib07 (dominio pubblico [V‑prec]) senza obblighi; ExoMol obbliga a CC BY‑SA sui derivati (tenerli come file separati con attribuzione); HITRAN gratuito ma con registrazione (usarlo fuori linea e distribuire solo i fit); NIST ASD non è di dominio pubblico (tabulare da sé le poche decine di righe che servono, citando).

### Gaps
- Termini di licenza del dataset CIE: la pagina mostra DOI e citazione ma non ho trovato la dicitura di licenza; da leggere a mano.
- Sneep e Ubachs 2005: formule di dispersione complete di N₂, O₂, Ar, CO₂, CH₄, H₂ non lette (Elsevier); i tre valori a 532 nm sono [S]. (Verifica 2026-11: originale letto sulla copia d'autore; le formule di N₂, Ar e CO₂ e la tabella a 532 nm sono ora [V] in Cited Findings; CH₄, CO, N₂O e SF₆ hanno solo il valore a 532 nm.)
- Kurucz: il sito risponde ma non dichiara una licenza; OPAL non raggiungibile; OP e MT_CKD su GitHub (licenza) non letti; Exo_k: sito non raggiungibile.
- Spettri stellari per le nane M (dove il corpo nero sbaglia): nessuna griglia né licenza verificata (PHOENIX, BT‑Settl).
- Hapke: la formula completa della riflettanza bidirezionale e l'approssimazione di H sono [R] ([Hapke 1981](https://doi.org/10.1029/JB086iB04p03039)); RELAB: pagina raggiunta, licenza non accertata.
- Neve (albedo contro taglia dei grani, [Wiscombe & Warren 1980](https://doi.org/10.1175/1520-0469(1980)037<2712:AMFTSA>2.0.CO;2)), vegetazione (PROSPECT: coefficienti e licenza), pigmenti: non verificati.
- Bruneton 2008 (articolo) non riletto: i parametri vengono dal codice. Dimensione esatta del volume di prospettiva aerea di Hillaire: non estratta.
- Matrice XYZ→sRGB e curva di trasferimento [R]: la pagina di Wikipedia ha risposto 429. **Verifica 2026-11 [V su codice]:** nel codice d'esempio del W3C per CSS Color 4 ([conversions.js](https://raw.githubusercontent.com/w3c/csswg-drafts/main/css-color-4/conversions.js)) la matrice XYZ(D65) → sRGB lineare è `[12831/3959; −329/214; −1974/3959 | −851781/878810; 1648619/878810; 36519/878810 | 705/12673; −2585/12673; 705/667]` ≈ `[3,2410; −1,5374; −0,4986 | −0,9692; 1,8760; 0,0416 | 0,0556; −0,2040; 1,0570]`; curva di trasferimento: `12,92·v` se v ≤ 0,0031308, altrimenti `1,055·v^(1/2,4) − 0,055` (inversa: soglia 0,04045).

---

## 7. Spettri atomici e molecolari da regole: che cosa serve per dare a ogni stella e a ogni aria il suo spettro

### Takeaway
Le posizioni delle righe degli idrogenoidi, le popolazioni (Boltzmann), la ionizzazione (Saha) e la larghezza Doppler sono formule chiuse verificate; ciò che non si ricava a basso costo sono le forze delle righe degli atomi a molti elettroni e delle molecole, che vanno prese da banche dati con licenze diverse (§6).

### Cited Findings
- [V‑sec] Rydberg: `1/λ = Z²·R_∞·(1/n′² − 1/n²)`; 1,09677·10⁷ m⁻¹ per l'idrogeno, 1,09737·10⁷ per i nuclei pesanti. — [Wikipedia, Hydrogen spectral series](https://en.wikipedia.org/wiki/Hydrogen_spectral_series)
- [V‑sec] Saha: `n_(i+1)·n_e/n_i = (2/λ_th³)·(g_(i+1)/g_i)·exp[−(ε_(i+1) − ε_i)/(k_B·T)]`, λ_th lunghezza d'onda termica dell'elettrone. — [Wikipedia, Saha ionization equation](https://en.wikipedia.org/wiki/Saha_ionization_equation)
- [C] Fotosfera solare (5772 K, n_e = 1,9·10¹⁹ m⁻³): n_p/n_H = 7·10⁻⁵, idrogeno quasi tutto neutro.
- [V‑sec] Doppler: profilo gaussiano con `σ_f = f₀·√(kT/(mc²))` e `Δf_FWHM = f₀·√(8·kT·ln 2/(mc²))`. — [Wikipedia, Doppler broadening](https://en.wikipedia.org/wiki/Doppler_broadening)
- [C] Hα a 5800 K: larghezza a metà altezza 0,036 nm.
- [V] HITRAN dà per ogni riga l'intensità S_ij a 296 K in cm⁻¹/(molecola·cm⁻²) e il coefficiente di Einstein A, indipendente da temperatura e abbondanza isotopica. — [HITRAN, definizioni e unità](https://hitran.org/docs/definitions-and-units/)
- [R] Allargamento per pressione: lorentziana con `γ(p, T) = γ_ref·(p/p_ref)·(T_ref/T)^n`, n ≈ 0,5–0,75, γ ≈ 0,05–0,1 cm⁻¹/atm; profilo di Voigt = convoluzione, larghezza `≈ 0,5346·f_L + √(0,2166·f_L² + f_G²)`. — [HITRAN, definizioni](https://hitran.org/docs/definitions-and-units/); [Olivero & Longbothum 1977](https://doi.org/10.1016/0022-4073(77)90161-3)
- [V] NIST ASD: diritti riservati (vedi §6). — [NIST ASD](https://www.nist.gov/pml/atomic-spectra-database)

### Inferences
- **Per ogni stella:** continuo di corpo nero a T_eff, più una trentina di righe forti (Balmer, Ca II H e K, Na D, tripletto del Mg, bande di TiO per le M) con profondità da Saha e Boltzmann sulle abbondanze di `galassie.js`. Il massimo delle righe di Balmer attorno a 9500 K e la loro scomparsa nelle stelle fredde e caldissime escono dalle due equazioni: la classe spettrale diventa una conseguenza.
- **Per ogni aria:** Rayleigh, le bande infrarosse a esponenziale, e nel visibile poche bande che danno il colore: O₂ a 760 e 687 nm, ozono di Chappuis (500–700 nm, azzurro del crepuscolo), H₂O a 720; 820; 940 nm, CH₄ a 619; 727; 890 nm (blu‑verde di Urano e Nettuno), Na e K per i gioviani caldi [R: posizioni note, intensità da HITRAN/ExoMol].
- **Idrogenoidi esatti, il resto da tabella:** per un atomo qualsiasi stateyour può calcolare le righe a un elettrone (ioni idrogenoidi, raggi X K_α con la legge di Moseley), mentre per gli altri serve una tabella minima (lunghezza d'onda, g, energia inferiore, forza dell'oscillatore).

### Gaps
- Formula di Voigt approssimata e scala di γ: non ritrovate nelle pagine aperte, restano [R].
- Opacità continua di H⁻ (decisiva per il Sole) e forze di oscillatore: non raccolte.
- Nessun confronto verificato tra spettro così costruito e una griglia di atmosfere.

---

## 8. Onde elettromagnetiche e materia: Drude e Lorentz, plasmoni, lucentezza dei metalli, colori dei minerali, fluorescenza, Cherenkov

### Takeaway
La stessa frequenza di plasma spiega perché i metalli riflettono la luce e perché la ionosfera riflette le onde radio; i colori dei minerali vengono da quattro meccanismi elettronici che non si ricavano a basso costo, ma che si lasciano ordinare con una sola regola quando c'è un intervallo di banda.

### Cited Findings
- [V‑sec] Drude: per ωτ ≫ 1 `ε(ω) = 1 − ω_p²/ω²`, `ω_p = √(n·e²/(ε₀·m))`; a ω_p la parte reale di ε cambia segno: sotto, l'onda è riflessa. — [Wikipedia, Drude model](https://en.wikipedia.org/wiki/Drude_model)
- [C] Alluminio (3 elettroni per atomo, n = 1,81·10²⁹ m⁻³): ħω_p = 15,8 eV (misurato ~15 eV): riflette tutto il visibile. Ionosfera con N = 10¹² m⁻³: 9 MHz, la stessa formula del §4.
- [R] Lorentz: `ε = 1 + Σ_j f_j·ω_p²/(ω_j² − ω² − i·γ_j·ω)`; Sellmeier per i trasparenti; Fresnel a incidenza normale `R = ((n − 1)² + k²)/((n + 1)² + k²)`. [C] quarzo (n = 1,544) 4,6%; diamante (n = 2,417) 17%. — [Bohren & Huffman 1983, cap. 9](https://doi.org/10.1002/9783527618156)
- [R] Metalli colorati: oro e rame hanno transizioni dalla banda d nel visibile (soglia ~2,4 e ~2,1 eV) che tolgono il blu al riflesso; l'argento ha la soglia a 3,8 eV, fuori dal visibile. — [Nassau 1978, Am. Mineral. 63, 219](http://www.minsocam.org/ammin/AM63/AM63_219.pdf)
- [R] Cause del colore nei minerali (Nassau): campo cristallino degli ioni di transizione (Cr³⁺ nel rubino e nello smeraldo, Fe²⁺ nell'olivina con la banda a 1 µm, Cu²⁺ in malachite e azzurrite); trasferimento di carica (Fe²⁺→Ti⁴⁺ nello zaffiro, O→Fe³⁺ in ematite e goethite, Fe²⁺→Fe³⁺ nei minerali scuri); intervallo di banda (cinabro ~2,0 eV, zolfo ~2,6 eV, pirite e galena sotto 1 eV, diamante 5,5 eV); centri di colore da radiazione (quarzo affumicato, ametista, fluorite viola); ottica fisica (opale, labradorite). — [Nassau 1978](http://www.minsocam.org/ammin/AM63/AM63_219.pdf); [Burns 1993](https://doi.org/10.1017/CBO9780511524899)
- [V‑prec] Cherenkov: `cos θ = 1/(n·β)`, soglia β = 1/n, resa `d²N/(dx·dλ) = (2π·α·z²/λ²)·(1 − 1/(β²·n²))`. [C] In acqua (n = 1,33): soglia per gli elettroni 0,264 MeV, angolo massimo 41,2°. — [PDG 2024, Passage of particles through matter](https://pdg.lbl.gov/2024/reviews/rpp2024-rev-passage-particles-matter.pdf)

### Inferences
- **Regola dell'intervallo di banda per `chimica.coloreRoccia`:** soglia di assorbimento a `λ = 1240/E_g[eV]` nm: E_g > 3,1 eV incolore o bianco in polvere; 2,5–3,1 giallo; 2,0–2,5 arancio e rosso; sotto ~1,8 nero o metallico. Un solo numero per minerale dà solfuri, ossidi, zolfo (i gialli di Io).
- **Lucentezza:** metallica se k è grande nel visibile (ω < ω_p o E_g piccolo), adamantina se n > 2, vitrea per n ≈ 1,5: esce da n e k di refractiveindex.info con Fresnel.
- **Campo cristallino e trasferimento di carica** restano tabella (ione × coordinazione → bande), ma è corta: Fe²⁺, Fe³⁺, Cr³⁺, Mn²⁺, Mn³⁺, Cu²⁺, Ti³⁺, V³⁺, Ni²⁺, Co²⁺ coprono quasi tutti i colori delle rocce; in un universo procedurale il colore di una roccia è deciso soprattutto dallo stato di ossidazione del ferro, che `chimica.js` conosce (fugacità di ossigeno).
- **Centri di colore** legano la luce alla radioattività già modellata (aloni pleocroici, quarzo affumicato vicino a minerali d'uranio): dose accumulata → densità di centri → assorbimento.
- **Fluorescenza:** da trattare come evento locale (attivatore in tracce: Mn²⁺, uranile, terre rare [R]); conta solo di notte o sotto stelle molto ricche di UV.
- **Plasmoni:** frequenza di superficie `ω_p/√(1 + ε_d)` e risonanza delle nanoparticelle a `ε = −2·ε_d` [R]: spiegano i colori di metalli colloidali; in natura sono rari, priorità bassa.

### Gaps
- Tutta la parte sui colori dei minerali è [R]: Nassau e Burns non sono stati aperti; energie del campo cristallino per ione e coordinazione non raccolte.
- Frequenze di plasma e soglie interbanda di Ag, Au, Cu: [R].
- Rese quantiche di fluorescenza dei minerali, intensità del bagliore notturno dell'aria: non cercate.

---

## 9. Suono, in breve: velocità e attenuazione in gas, acqua, roccia

### Takeaway
La velocità esce dalle grandezze che stateyour ha già; l'attenuazione classica (viscosità) è una formula chiusa verificata ma nell'aria vera sottostima di decine di volte, perché domina il rilassamento molecolare.

### Cited Findings
- [V‑sec] Aria: `c ≈ 331,3 m/s·√(1 + θ/273,15)` ≈ 331,3 + 0,606·θ (θ in °C), da `c = √(γ·R·T/M)`. — [Wikipedia, Speed of sound](https://en.wikipedia.org/wiki/Speed_of_sound)
- [C] Altri mondi con la stessa formula: Marte (CO₂, 210 K) 226 m/s; Venere al suolo (735 K) 408 m/s; Titano (N₂, 94 K) 198 m/s.
- [V‑sec] Attenuazione viscosa di Stokes: `α = 2·η·ω²/(3·ρ·V³)`; con la viscosità di volume ζ: `α = (4η/3 + ζ)·ω²/(2·ρ·V³)` (ampiezza ∝ e^(−αx)). — [Wikipedia, Stokes's law of sound attenuation](https://en.wikipedia.org/wiki/Stokes%27s_law_of_sound_attenuation)
- [C] Aria a 1 kHz: 9,8·10⁻⁶ m⁻¹ = 0,085 dB/km; il valore reale è di alcuni dB/km [R: rilassamento di O₂ e N₂ con l'umidità, [ISO 9613‑1](https://www.iso.org/standard/17426.html)].
- [V‑sec] Acqua di mare: ~1500 m/s, variabile con temperatura, salinità e pressione. — [Wikipedia, Seawater](https://en.wikipedia.org/wiki/Seawater)
- [V‑sec] In molti mezzi viscoelastici (suolo, roccia porosa) `α(ω) = α₀·ω^η`. — [Wikipedia, Acoustic attenuation](https://en.wikipedia.org/wiki/Acoustic_attenuation)
- [R] Mare: formula di Mackenzie 1981 a nove termini per c(T, S, profondità); assorbimento con i rilassamenti dell'acido borico e del solfato di magnesio (~0,06 dB/km a 1 kHz, ~1 a 10 kHz, ~30 a 100 kHz). — [Mackenzie 1981](https://doi.org/10.1121/1.386920); [Ainslie & McColm 1998](https://doi.org/10.1121/1.421258) **Verifica 2026-11 [V su codice]:** la formula a nove termini è in `arlpy` ([uwa.py](https://raw.githubusercontent.com/org-arl/arlpy/master/arlpy/uwa.py)): `c = 1448,96 + 4,591·T − 5,304·10⁻²·T² + 2,374·10⁻⁴·T³ + 1,340·(S − 35) + 1,630·10⁻²·D + 1,675·10⁻⁷·D² − 1,025·10⁻²·T·(S − 35) − 7,139·10⁻¹³·T·D³` (T in °C, S in ‰, D profondità in m); i coefficienti d'assorbimento restano [R].
- [V‑prec] Solidi: `v_p = √((K + 4μ/3)/ρ)`, `v_s = √(μ/ρ)`; [R] attenuazione `α = π·f/(Q·v)`, Q da ~30 (sedimenti) a ~1000 (cristallino secco). — rapporto «Come farlo emergere», §10

### Inferences
- **Il mare «suona» in modo diverso su ogni pianeta:** l'assorbimento a bassa frequenza dipende dagli ioni disciolti (B(OH)₃, MgSO₄) che `mare.js` calcola; un oceano di soda o senza solfati sarebbe più trasparente al suono. È un filo `chimica del mare → suono` gratuito.
- **Aria sottile:** `α ∝ ω²/(ρ·c³)`: su Marte (ρ cento volte minore) l'attenuazione classica è cento volte maggiore, più il rilassamento della CO₂: i suoni acuti non viaggiano. Il tuono si sente fin dove la rifrazione lo consente (~10–25 km sulla Terra [R]).
- Per `risalita` e i terremoti bastano v_p, v_s e Q per materiale; il resto è geometria.

### Gaps
- Formule di rilassamento (ISO 9613‑1, Ainslie–McColm, Francois–Garrison) e coefficienti di Mackenzie: [R]; la pagina del NPL non era raggiungibile.
- Q delle rocce per litologia e velocità sismiche tipiche: non verificati.
- Misure di Perseverance sul suono marziano (due velocità sopra e sotto 240 Hz) [R]: non verificate.

---

## 10. Dove i siti erano bloccati: che cosa è stato ricostruito e da dove

### Takeaway
Editori (Science, Wiley/AGU, OUP, A&A, Elsevier), ADS, Scholarpedia, `romps.berkeley.edu`, OPAL e l'API di GitHub non rispondevano; quasi tutto ciò che serviva è stato recuperato da arXiv/ar5iv, da depositi istituzionali e da file grezzi. Le formule restate [R] sono quelle dei libri di testo e delle sezioni 5, 8 e 9.

### Cited Findings
- [V] Romps 2014 recuperato dal deposito dell'Università della California. — [eScholarship](https://escholarship.org/content/qt0x75w0pj/qt0x75w0pj.pdf)
- [V] Christensen e Aubert 2006, Christensen 2009 e 2010 recuperati da una raccolta didattica dell'Università di Glasgow. — [indice implicito: 2010Christensen.pdf](https://www.maths.gla.ac.uk/~rs/res/B/DynamoScaling/2010Christensen.pdf)
- [V] Brautigam e Albert 2000 ricostruito da due fonti che ne riportano le formule (tabella di ANGEO 2021 e bollettino di Hokkaido 2008), concordi sul termine magnetico. — [ANGEO preprint](https://angeo.copernicus.org/preprints/angeo-2021-56/angeo-2021-56-manuscript-version4.pdf); [Hokkaido](https://eprints.lib.hokudai.ac.jp/repo/huscap/all/32760/71-61.pdf)
- [V] Price e Rind 1992 ricostruito da Wong e altri 2013 (GMD, accesso aperto). — [GMD 6, 429](https://gmd.copernicus.org/articles/6/429/2013/gmd-6-429-2013.pdf)
- [V] Sneep e Ubachs 2005 (formula e refuso) attraverso Kitzmann 2017. — [arXiv:1701.07513](https://arxiv.org/abs/1701.07513) (2026-11: originale letto direttamente; i refusi sono due e diversi da quello indicato da Kitzmann: vedi §6.)
- [V] Jeevanjee e Fueglistaler 2020 da una copia PDF; Williams 2026 dalla pagina dell'autore. — [typeset.io](https://typeset.io/pdf/simple-spectral-models-for-atmospheric-radiative-cooling-3de83cygow.pdf); [26_ssm.pdf](https://andrewilwilliams.github.io/papers/26_ssm.pdf)
- [V] Walt 1994 (periodi di rimbalzo e deriva) attraverso Öztürk 2012 e Ripperda 2018. — [arXiv:1112.3487](https://arxiv.org/abs/1112.3487)

### Inferences
- Le ricostruzioni da fonti che citano l'originale concordano tra loro salvo due punti, entrambi segnalati: il coefficiente marino di Price e Rind (6,2 contro 6,4·10⁻⁴) e l'etichetta del termine di Brautigam e Albert (la tabella di ANGEO lo chiama «EM», il bollettino giapponese «magnetico»: è lo stesso). (Verifica 2026-11: il coefficiente marino stampato da Price e Rind è 6,4·10⁻⁴ secondo Luhar e altri 2021, che ne rifanno la derivazione: vedi §4.)
- Ordine di rilettura consigliato prima di codificare: (1) §3 di Christensen 2010 per F e per il rapporto campo interno/superficie; (2) Sneep e Ubachs per gli indici dei gas; (3) Brautigam e Albert per il termine elettrostatico; (4) un testo di proprietà delle rocce per il §5; (5) Nassau e Burns per il §8. (2026-11: il punto (2), Sneep e Ubachs, è fatto; (1) e (3) restano.)

### Gaps
- Non raggiunti e quindi non verificati: Science, Wiley, OUP, A&A, Elsevier, Springer (PDF), ADS, Scholarpedia, OPAL, CCMC (AE8/AP8), NPL, l'API di GitHub (alberi dei repository), `forge.oasu.u-bordeaux.fr` (Exo_k); alcune pagine di Wikipedia hanno risposto 429 (oscillazioni di plasma, aloni, campo cristallino, bagliore notturno, sRGB).
- Le pagine di Wikipedia valgono come fonte secondaria: ogni [V‑sec] che entra nel codice come coefficiente va riletto sulla fonte primaria che la pagina cita.
