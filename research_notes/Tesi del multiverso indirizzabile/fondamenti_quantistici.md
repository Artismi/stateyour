# Fondamenti quantistici per un universo con indirizzo dentro un multiverso

Legenda delle marcature: **[V]** letto ora sul testo pieno della fonte (PDF arXiv scaricato e convertito in testo, novembre 2026); **[Va]** solo l'abstract; **[R]** ricordato, non riletto ora (da verificare prima di citarlo come esatto). Statuto empirico: **misurato** / **teorema** (conseguenza matematica di assunzioni dichiarate) / **ipotesi** (programma fisico con formule, non confermato) / **speculazione** (interpretazione non decidibile con esperimenti attuali).

Orientamento sul progetto (INTRECCIO.md, regole 3, 5, 11, 12, 13, lette solo per orientarsi): ogni evento ha un indirizzo e tutti gli esiti esistono (r. 3); il mondo grande si sceglie tra i compatibili in proporzione al peso (r. 5); la «bolla» è un istante con un volume, da cui il dopo si calcola con le leggi e il prima è un'inferenza pesata tra storie compatibili (r. 11); più bolle sono una condizione sola (r. 12); due rami uguali a una grana data sono lo stesso universo, citando esplicitamente Gell-Mann–Hartle e Deutsch 1991 (r. 13). Le «Inferenze» qui sotto collegano le fonti a queste regole.

---

## 1. Everett / molti mondi: funzione d'onda universale, stati relativi, pesi dei rami e regola di Born

### Takeaway
Nell'interpretazione di Everett esiste solo |Ψ⟩ universale a evoluzione unitaria; i «rami» non sono primitivi ma strutture approssimate selezionate dalla decoerenza, e i loro pesi |c_i|² sono giustificati come probabilità da teoremi condizionali (Deutsch–Wallace, teoria delle decisioni; Carroll–Sebens, incertezza autolocalizzante; Zurek, envarianza), ciascuno valido solo date assunzioni di razionalità o simmetria che restano contestate. Statuto: speculazione interpretativa (empiricamente equivalente alla QM standard), con teoremi interni.

### Cited Findings
- **Stato relativo (Everett 1957) [R].** Per |Ψ⟩ ∈ H_S ⊗ H_O, scelto un vettore |o_i⟩ dell'osservatore, lo stato relativo di S è |ψ_rel(i)⟩ ∝ (𝟙 ⊗ ⟨o_i|)|Ψ⟩; |Ψ⟩ = Σ_i c_i |s_i⟩|o_i⟩. Fonte originale: H. Everett, Rev. Mod. Phys. 29, 454 (1957) (non open access; citato in [Carroll–Sebens](https://arxiv.org/abs/1405.7907) come ref. [2,3]).
- **Il ramo è definito dalla decoerenza.** Carroll–Sebens: la funzione d'onda «si ramifica via decoerenza» e tra la ramificazione e la registrazione dell'esito l'osservatore «può conoscere lo stato dell'universo esattamente senza sapere su quale ramo si trova» (incertezza autolocalizzante) [V] — [Carroll & Sebens 2014](https://arxiv.org/abs/1405.7907). Zurek: «la decoerenza rende la MWI completa» perché permette di analizzare l'universo in rami tramite stati puntatore; senza einselection la MWI è «incompleta» [V] — [Zurek, RMP 75, 715 (2003)](https://arxiv.org/abs/quant-ph/0105127).
- **Rami nelle storie coerenti (definizione operativa).** Con stato globale puro ρ = |ψ⟩⟨ψ| e operatori di classe C_α = P_{α_M}(t_M)⋯P_{α_1}(t_1), i rami sono |ψ_α⟩ = C_α|ψ⟩, con Σ_α C_α = 𝟙; la coerenza D(α,β) = ⟨ψ_α|ψ_β⟩ = 0 per α≠β rende i rami ortogonali e dà la struttura ad albero [V] — [Riedel, Zurek, Zwolak 2016, eq. (23) e seguenti](https://arxiv.org/abs/1312.0331).
- **Carroll–Sebens: principio ESP.** H = H_O ⊗ H_S ⊗ H_E, |Ψ⟩ = Σ Ψ_{a,i,μ}|ψ_a⟩|φ_i⟩|ω_μ⟩; ESP: P(O misura s | Ψ) = P(O misura s | T[Ψ]) per ogni T = 𝟙_{OS} ⊗ U_E (eq. 13–14); equivalente: la probabilità dipende solo dalla matrice densità ridotta di O+S [V]. Rami di ampiezza uguale → probabilità uguali; per ampiezze diverse si «spezzano» i rami: |Ψ⟩ = |O⟩|↑⟩|ω₁⟩ + √2|O⟩|↓⟩|ω₂⟩ (eq. 33) diventa con una U_E opportuna (eq. 34) tre rami di ampiezza uguale |O⟩|↑⟩|ω̂₁⟩ + |O⟩|↓⟩|ω̂₂⟩ + |O⟩|↓⟩|ω̂₃⟩ (eq. 35) → P(↑)=1/3, P(↓)=2/3 = regola di Born; dichiarano che le manipolazioni «ricalcano quelle di Zurek» [V] — [Carroll & Sebens 2014](https://arxiv.org/abs/1405.7907). Nota: l'arXiv letto è la versione breve; quella estesa è Sebens & Carroll, BJPS 2018, arXiv:1405.7577 [R].
- **Conteggio dei rami rifiutato.** Carroll–Sebens: un principio di indifferenza ingenuo implicherebbe il conteggio dei rami; «tale ragionamento è scorretto» [V] — [Carroll & Sebens 2014](https://arxiv.org/abs/1405.7907).
- **Deutsch–Wallace: teorema di Born dalla teoria delle decisioni.** Assiomi di razionalità di Wallace (versione 2009): *Microstate Indifference* (non conta il microstato dentro un macrostato), *Branching Indifference* (l'agente è indifferente alla ramificazione in sé se non cambia le ricompense), *State Supervenience* (le preferenze dipendono solo dallo stato fisico in cui l'atto lascia il ramo: se Uψ = U′ψ′ e Vψ = V′ψ′ allora U ≻_ψ V ⇔ U′ ≻_ψ′ V′), *Solution Continuity*, più *Diachronic Consistency* e assiomi di «ricchezza» [V]. **Born rule theorem**: esiste una funzione di utilità sulle ricompense, unica a meno di trasformazioni affini, tale che un atto è preferito a un altro sse ha utilità attesa maggiore calcolata con i pesi quantistici di ogni ricompensa [V] — [Wallace 2009, «A formal proof of the Born rule from decision-theoretic assumptions»](https://arxiv.org/abs/0906.2718). Origine: D. Deutsch, Proc. R. Soc. A 455, 3129 (1999), arXiv:quant-ph/9906015 [R]; versione definitiva in D. Wallace, *The Emergent Multiverse* (OUP 2012) [R].
- **Zurek: envarianza.** Se |ψ_SE⟩ ha coefficienti di Schmidt di modulo uguale, uno scambio u_S sul sistema è annullato da un contro-scambio sull'ambiente (lo stato è «envariante»); le fasi dei coefficienti di Schmidt sono envarianti, da cui la probabilità dipende solo da |α_k| e quindi p_k = |α_k|² [V, sezione VI] — [Zurek 2003](https://arxiv.org/abs/quant-ph/0105127).

### Inferences
- Per stateyour: un «evento con indirizzo» corrisponde a un proiettore P_α(t) in una famiglia scelta; un ramo è |ψ_α⟩ = C_α|ψ⟩ con peso ‖C_α ψ‖²; l'indirizzo di un ramo è la sequenza (α_1,…,α_M). L'assenza di pesi in `rami` (lacuna citata in INTRECCIO r. 5) si colma con questo peso, che è definito sempre, ma vale come probabilità solo se la famiglia è coerente (vedi §5).
- L'argomento di Carroll–Sebens (rami da spezzare in rami uguali) dà un algoritmo concreto: ogni peso razionale |c_i|² = n_i/N equivale a N rami equipesati, il che giustifica il campionamento «in proporzione al peso» della r. 5 e r. 11 come il campionamento uniforme su una sottodivisione fine.
- La «bolla» della r. 11 come «posizione autolocalizzante»: chi fissa una bolla conosce lo stato globale (le leggi + l'indirizzo) ma non sa in quale delle copie compatibili si trova; ESP dice che la credenza deve dipendere solo dallo stato ridotto della regione, non dal resto.

### Gaps
- Non riletto ora il testo di Everett 1957 (non open access); la formula dello stato relativo è [R].
- Le obiezioni principali (circolarità di Branching Indifference; il problema del numero di rami non definito) non sono state rilette su fonte primaria; Wallace stesso discute i «controesempi» nella sezione finale di [arXiv:0906.2718](https://arxiv.org/abs/0906.2718) [V solo il titolo della sezione].

---

## 2. Decoerenza: formula di scattering di Joos–Zeh, tempi, stati puntatore

### Takeaway
La decoerenza è la soppressione dei termini fuori diagonale della matrice densità ridotta dovuta all'intreccio con l'ambiente; per la posizione, ρ(x,x′,t) = ρ(x,x′,0)·e^{−Λ(x−x′)²t}, con tempi che per oggetti macroscopici sono inferiori a 10⁻²⁰ s in aria. Statuto: **misurato** (fullereni in interferometro Talbot–Lau con gas di fondo; cavità di Haroche 1996) e **teorema** dentro la QM unitaria; non risolve da solo il problema della misura (non sceglie un esito).

### Cited Findings
- **Schema di von Neumann generalizzato.** Σ_i c_i|s_i⟩|E_0⟩ → Σ_i c_i|s_i⟩|E_i(t)⟩ (eq. 6); in molti modelli ⟨E_i(t)|E_j(t)⟩ ∝ e^{−t/τ_d} per i≠j (eq. 7), dove τ_d è il tempo di decoerenza [V] — [Schlosshauer, «Quantum decoherence», Physics Reports 831, 1 (2019)](https://arxiv.org/abs/1911.06282).
- **Equazione di Joos–Zeh (limite di lunghezza d'onda lunga).** ∂ρ_S(x,x′,t)/∂t|_scatt = −Λ(x−x′)²ρ_S(x,x′,t) (eq. 66), con costante di scattering Λ = ∫dq ϱ(q) v(q) (q²/ħ²) σ_eff(q) (eq. 67), σ_eff(q) = (2π/3)∫d cosΘ (1−cosΘ)|f(q,cosΘ)|² (eq. 68); soluzione ρ_S(x,x′,t) = ρ_S(x,x′,0) e^{−Λ(Δx)²t} (eq. 69); tempo τ_Δx = 1/(Λ(Δx)²) (eq. 70). Con la dinamica libera: ∂ρ/∂t = −(iħ/2m)(∂²/∂x′² − ∂²/∂x²)ρ − Λ(x−x′)²ρ (eq. 71). Oltre la lunghezza d'onda dell'ambiente (limite di lunghezza d'onda corta) il tasso diventa indipendente da Δx e massimo [V] — [Schlosshauer 2019](https://arxiv.org/abs/1911.06282). Originale: Joos & Zeh, Z. Phys. B 59, 223 (1985) [R]; Schlosshauer nota che Hornberger–Sipe hanno corretto un errore della derivazione originale (fattore numerico) [V].
- **Tabella dei tempi di decoerenza** (s), Δx = taglia dell'oggetto (granello di polvere Δx = 10⁻³ cm; molecola grande Δx = 10⁻⁶ cm) [V, Tabella 1] — [Schlosshauer 2019](https://arxiv.org/abs/1911.06282):

  | Ambiente | Granello di polvere | Molecola grande |
  |---|---|---|
  | Radiazione cosmica di fondo | 1 | 10²⁴ |
  | Fotoni a temperatura ambiente | 10⁻¹⁸ | 10⁶ |
  | Miglior vuoto di laboratorio | 10⁻¹⁴ | 10⁻² |
  | Aria a pressione normale | 10⁻³¹ | 10⁻¹⁹ |

- **Rapporto rilassamento/decoerenza (Zurek).** τ_r/τ_d ∼ (Δx/λ_th)² (eq. 28), λ_th = ħ/√(2mk_BT) (eq. 29); per m = 1 g, T = 300 K, Δx = 1 cm: τ_r/τ_d ∼ 10⁴⁰ [V] — [Schlosshauer 2019](https://arxiv.org/abs/1911.06282); stessa forma in Zurek: τ_D = γ⁻¹(λ_T/Δx)² [V] — [Zurek 2003](https://arxiv.org/abs/quant-ph/0105127).
- **Decoerenza senza dissipazione.** «La dissipazione è sempre accompagnata da decoerenza; il contrario non è necessariamente vero» (modelli a bagno di spin) [V] — [Schlosshauer 2019](https://arxiv.org/abs/1911.06282).
- **Tempo di decoerenza nelle storie (Hartle).** Per un bagno di oscillatori ad alta temperatura, Im W[x′,x] = (2Mγk_BT/ħ)∫dt (x′(t)−x(t))² (eq. 4.6); gli elementi fuori diagonale di D(α′,α) sono soppressi esponenzialmente se Δt ≳ t_decoh ≡ ħ²/(2Mγk_BT Δ²) (eq. 4.7), «tipicamente molto più breve dei tempi dinamici, per esempio 1/γ» [V] — [Hartle, «The quasiclassical realms of this quantum universe» (2008)](https://arxiv.org/abs/0806.3776).
- **Stati puntatore / einselection (Zurek).** Criterio: [H_AE, Â] = 0 (eq. 4.6): l'Hamiltoniana d'interazione deve essere funzione dell'osservabile puntatore Â = Σ a_i|A_i⟩⟨A_i|; allora Â agisce da «controllo» e i suoi autostati sono preservati; versione con l'Hamiltoniana propria: [H_A + H_AE, P_A] = 0 (eq. 4.41); in generale il «setaccio di predicibilità» (predictability sieve) seleziona gli stati che producono meno entropia [V parziale: equazioni e indice, sezione IV.D] — [Zurek 2003](https://arxiv.org/abs/quant-ph/0105127).
- **Esperimenti.** (a) Fullereni C₇₀ in interferometro Talbot–Lau con gas di fondo a pressione regolabile (Hornberger et al., Hackermüller et al.): la visibilità delle frange cala con la pressione «in accordo eccellente» con i modelli di decoerenza collisionale; anche decoerenza termica per emissione di radiazione [V] — [Schlosshauer 2019, sez. 6.2](https://arxiv.org/abs/1911.06282); originale Hornberger et al., PRL 90, 160401 (2003) [R]. (b) Brune et al. 1996 (cavità, atomi di Rydberg): sfasamento χ = 0,31π, n̄ ≈ 10, sovrapposizione |αe^{iχ}⟩ ± |αe^{−iχ}⟩ con overlap e^{−2|α|²sin²χ} < 3×10⁻⁵; decoerenza progressiva osservata con un secondo atomo; poi superposizioni con n̄ = 29 e, con qubit superconduttore, 111 fotoni [V] — [Schlosshauer 2019, sez. 6.1](https://arxiv.org/abs/1911.06282); originale PRL 77, 4887 (1996) [R].

### Inferences
- La grana di stateyour ha una scala fisica naturale: una differenza tra due rami di estensione Δx in un oggetto immerso in aria diventa «registrata» (cioè i rami smettono di interferire) in τ ≈ 1/(ΛΔx²), che per qualunque oggetto macroscopico è ≪ 10⁻¹⁹ s. Sotto quel tempo e quella distanza non c'è «evento» nel senso della r. 3.
- Le regole di stateyour «un evento cambia solo ciò che sta dentro il suo contenitore e dopo» corrispondono a un'interazione con struttura [H_int, Â] = 0: la base degli esiti è scelta dall'interazione, non dall'osservatore.

### Gaps
- Non riletto ora l'articolo originale di Joos–Zeh né la tabella numerica di Λ (cm⁻² s⁻¹) per ciascun ambiente; Schlosshauer rimanda al libro (ref. [9]) per i dettagli dei calcoli.

---

## 3. Darwinismo quantistico: ridondanza, plateau dell'informazione mutua, oggettività dei fatti macroscopici

### Takeaway
Un fatto macroscopico è «oggettivo» quando molte frazioni disgiunte dell'ambiente contengono ciascuna (quasi) tutta l'informazione classica sullo stato puntatore: la ridondanza R_δ è il numero di tali frammenti; per un granello di polvere illuminato dal Sole R_δ ≈ 10⁸ dopo 1 µs. Statuto: **teorema/modello** (calcoli espliciti), con primi test in laboratorio su sistemi piccoli [R]; l'applicazione all'oggettività è interpretativa.

### Cited Findings
- **Definizioni (Zurek 2009).** Informazione mutua I(S:F) = H_S + H_F − H_{S,F} (eq. 3). Se (1−δ)H_S d'informazione è contenuto in una frazione f_δ dell'ambiente, ci sono R_δ = 1/f_δ frammenti (eq. 4) [V]. La curva I(S:F_f) in funzione di f sale rapidamente e poi si appiattisce su un **plateau classico** a livello H_S; con stato SE globale puro la curva è antisimmetrica e sale a 2H_S per f→1 (le informazioni oltre H_S sono accessibili solo con misure globali). Per stati scelti a caso con misura di Haar su H_SE non c'è ridondanza (piccoli frammenti non rivelano quasi nulla) [V]. «Molte copie (R_δ) permettono a ∼R_δ osservatori di scoprire lo stato di S senza disturbarlo» → esistenza oggettiva [V]. Modello di moto browniano quantistico: I(S:F) ≈ H_S + ½ ln(f/(1−f)), e per uno stato iniziale compresso R_δ ≈ s^{2δ}, con s fattore di compressione [V parziale: la conversione del PDF ha spezzato le frazioni, la forma esatta di entrambe va ricontrollata sul PDF] — [Zurek, «Quantum Darwinism», Nature Physics 5, 181 (2009)](https://arxiv.org/abs/0903.5082).
- **Riedel–Zurek 2010: fotoni reali.** Oggetto (sfera) illuminato da un corpo nero, illuminazione puntiforme e isotropa: proliferazione rapida ed estesa dell'informazione nei fotoni, ridondanze «di ordini di grandezza maggiori» dei modelli risolubili precedenti [V abstract]; numero esplicito: illuminato dal Sole per appena 1 µs, un granello di polvere di 1 µm ha la sua posizione impressa circa 100×10⁶ volte nei fotoni diffusi [V, conclusioni] — [Riedel & Zurek, PRL 105, 020404 (2010)](https://arxiv.org/abs/1001.3419).
- **Dalla ridondanza al passato oggettivo (Riedel–Zurek–Zwolak 2016).** La gran parte degli insiemi di storie coerenti è «flagrantemente non classica» (problema della selezione dell'insieme); si selezionano storie **ridondantemente coerenti** con la condizione di coerenza a traccia parziale di Finkelstein; l'esistenza di record ridondanti è condizione **sufficiente** di coerenza ridondante; l'informazione su una storia oggettiva del passato «è allora simultaneamente alla portata di molti, che possono ricostruirla indipendentemente e arrivare a conclusioni compatibili nel presente» [V] — [Riedel, Zurek, Zwolak, PRA 93, 032126 (2016)](https://arxiv.org/abs/1312.0331).

### Inferences
- È il fondamento fisico più diretto della r. 11 («il prima è un'inferenza») e della r. 12 («più bolle si incontrano nell'antenato comune»): il passato oggettivo è ciò che è scritto in molti record indipendenti; più bolle che contengono record dello stesso evento restringono la famiglia di storie compatibili, esattamente come la «causa comune» di `bolle.js`.
- Una grana utile per la r. 13: due rami vanno identificati quando nessun frammento d'ambiente accessibile a quella scala li distingue, cioè quando I(S:F) sulla variabile che li separa è sotto la soglia (1−δ)H_S per tutti i frammenti di quella grana.

### Gaps
- Gli esperimenti di laboratorio sul darwinismo quantistico (es. Ciampini et al. 2018; Unden et al. 2019; Chen et al. 2019) non sono stati riletti: [R], da verificare.

---

## 4. Ramificazione locale e QM relazionale: Deutsch–Hayden, Wallace–Timpson, Rovelli, Di Biagio–Rovelli

### Takeaway
In immagine di Heisenberg ogni sottosistema ha un «descrittore» locale che cambia solo per interazioni locali (Deutsch–Hayden); lo stato di una regione di spaziotempo è fissato dal suo cono di luce passato e non cambia per operazioni lontane (Wallace–Timpson), quindi la ramificazione si propaga al più alla velocità della luce. Nella QM relazionale i fatti sono relativi ai sistemi che interagiscono; i fatti «stabili» sono quelli per cui la decoerenza rende trascurabile la relatività, con errore O(ε), ε = max_{i≠j}|⟨ψ_i|ψ_j⟩|². Statuto: **teorema** (formalismo di Heisenberg/densità locali) + **speculazione** (ontologia).

### Cited Findings
- **Deutsch–Hayden 2000.** Abstract: «Tutta l'informazione nei sistemi quantistici è, nonostante il teorema di Bell, localizzata. Misurare o interagire con un sistema S non ha effetto su sistemi lontani da cui S è dinamicamente isolato, anche se intrecciati con S»; in EPR e nel teletrasporto l'informazione quantistica passa attraverso canali «classici» (decoerenti) [V]. Formalismo: ogni qubit Q_a al tempo t è un tripletto di matrici 2ⁿ×2ⁿ q̂_a(t) = (q̂_ax(t), q̂_ay(t), q̂_az(t)) con [q̂_a(t), q̂_b(t)] = 0 (a≠b), q̂_ax q̂_ay = i q̂_az, q̂_ax² = 𝟙 (e permutazioni cicliche) (eq. 1–2), seguendo Gottesman 1998 [V]. Introducono l'«informazione localmente inaccessibile»: presente in un sistema ma non rivelabile da misure su quel sistema solo (sez. 6) [V] — [Deutsch & Hayden, Proc. R. Soc. A 456, 1759 (2000)](https://arxiv.org/abs/quant-ph/9906007).
- **Wallace–Timpson: realismo dello stato nello spaziotempo.** A ogni regione di spaziotempo si assegna un operatore densità; la non-separabilità è fondamentale, ma «non implica alcuna azione a distanza: lo stato quantistico della regione A è dinamicamente determinato dallo stato del suo cono di luce passato (più precisamente: di qualunque fetta di tipo spazio del suo cono passato). Lo stato di A∪B può cambiare per operazioni vicino ad A o a B, ma lo stato di B non è influenzato da operazioni fatte in A»; ed è più blanda della nonlocalità delle disuguaglianze di Bell, alcune delle cui premesse non valgono in Everett [V] — [Wallace & Timpson, «Quantum mechanics on spacetime I», BJPS 2010](https://arxiv.org/abs/0907.5294).
- **Ramificazione che si propaga alla velocità della luce.** Tesi di Wallace (*The Emergent Multiverse*, cap. 8) che la ramificazione è un processo locale che si estende dentro il cono di luce futuro dell'evento di misura, così che in EPR i rami di Alice e Bob si «abbinano» solo dove i coni futuri si intersecano [R] — nessuna fonte open access riletta ora; base formale: la località degli stati di regione in [Wallace & Timpson](https://arxiv.org/abs/0907.5294) [V].
- **Rovelli 1996.** Tesi: la nozione scorretta è quella di «stato di un sistema indipendente dall'osservatore»; «tutti i sistemi sono equivalenti, non c'è distinzione osservatore-osservato, e la teoria descrive solo l'informazione che i sistemi hanno gli uni sugli altri; tuttavia la teoria è completa» [V]. *Main observation*: «In meccanica quantistica osservatori diversi possono dare resoconti diversi della stessa sequenza di eventi» [V]. Ipotesi 1: tutti i sistemi sono equivalenti; Ipotesi 2: completezza [V]. Ricostruzione: *Postulato 1 (informazione limitata)*: c'è una quantità massima di informazione rilevante estraibile da un sistema; *Postulato 2 (informazione illimitata)*: è sempre possibile acquisire informazione nuova [V] — [Rovelli, Int. J. Theor. Phys. 35, 1637 (1996)](https://arxiv.org/abs/quant-ph/9609002).
- **Di Biagio–Rovelli 2021: fatti stabili.** Fatto relativo: se un'interazione modifica una variabile L_F di F in modo dipendente da L_S di S, il valore di L_S è un fatto relativo a F (F è il «contesto») [V]. I fatti stabili soddisfano la legge della probabilità totale P(b) = Σ_i P(b|a_i)P(a_i) (eq. 1), che per fatti relativi vale solo se b e a_i sono relativi allo stesso sistema [V]. Decoerenza: |ψ⟩ = Σ_i c_i|F a_i⟩⊗|ψ_i⟩ (eq. 5), ε = max_{i≠j}|⟨ψ_i|ψ_j⟩|² (eq. 6); se ε è piccolo e W non interagisce con E, ρ = tr_E|ψ⟩⟨ψ| = Σ|c_i|²|Fa_i⟩⟨Fa_i| + O(ε) (eq. 7) e P(b^(W)) = Σ_i P(b^(W)|Fa_i^(E))P(Fa_i^(E)) + O(ε) (eq. 8): il valore di L_F, fatto relativo a E, è stabile per W a meno di O(ε); per ε→0 esattamente stabile [V]. La distinzione risolve le difficoltà di Frauchiger–Renner ed è coerente con la violazione delle disuguaglianze LF di Bong et al. [V abstract] — [Di Biagio & Rovelli, Found. Phys. 51, 30 (2021)](https://arxiv.org/abs/2006.15543).

### Inferences
- Il vincolo «un evento cambia solo ciò che sta dentro il suo contenitore e dopo di lui» (r. 3) è la versione procedurale di Wallace–Timpson: un ramo nuovo è un cambiamento dello stato delle regioni nel cono futuro dell'evento; tutto il resto resta identico. Per un'implementazione: la differenza tra due rami va limitata al cono futuro (velocità c o meno) del loro evento separatore.
- La ε di Di Biagio–Rovelli è un numero calcolabile che può fare da soglia per la r. 13: due varianti sono «lo stesso fatto» per un osservatore W quando gli stati d'ambiente che le distinguono hanno overlap trascurabile per W o, al contrario, quando W non ha accesso a E.

### Gaps
- Non trovato in fonte open access riletta un enunciato formale di Wallace sulla «velocità della ramificazione»; rimane [R].
- La versione «senza descrittori globali» di Deutsch–Hayden è contestata (es. Wallace–Timpson parte II, Timpson 2005) [R].

---

## 5. Storie coerenti / decoerenti: Griffiths, Gell-Mann–Hartle, funzionale di decoerenza, grana grossa

### Takeaway
Una storia è una successione temporale di proiettori; il funzionale di decoerenza D(α′,α) = Tr[C_α′ ρ C_α†] dice quando le probabilità p(α) = D(α,α) sono additive rispetto alla grana grossa (off-diagonale ≈ 0). Se due cammini arrivano allo stesso stato grossolano senza lasciare record, si sommano le **ampiezze** (interferenza); solo se i record li distinguono si sommano le **probabilità**. Statuto: **teorema** (formalismo) + regola interpretativa; il problema della selezione dell'insieme resta aperto.

### Cited Findings
- **Funzionale di decoerenza, somma sui cammini.** D[Q′(t), Q(t)] = δ(Q′_f − Q_f) exp{i(S[Q′] − S[Q])/ħ} ρ(Q′_0, Q_0) (eq. 6); per storie a grana grossa si somma su tutto ciò che la grana non specifica: D([Δα′],[Δα]) = ∫_{[Δα′]}δQ′ ∫_{[Δα]}δQ δ(Q′_f − Q_f) e^{i(S[Q′]−S[Q])/ħ} ρ(Q′_0,Q_0) (eq. 7), con i due cammini che finiscono in un punto comune Q_f [V] — [Gell-Mann & Hartle, «Quantum mechanics in the light of quantum cosmology» (1990), arXiv 2018](https://arxiv.org/abs/1803.04605).
- **Forma di Heisenberg.** D([P_α′],[P_α]) = Tr[P^n_{α′_n}(t_n)⋯P^1_{α′_1}(t_1) ρ P^1_{α_1}(t_1)⋯P^n_{α_n}(t_n)] (eq. 8); D è sempre diagonale negli indici finali, quindi «la decoerenza è automatica per storie a un solo tempo» [V]. Grana grossa: D([P_β′],[P_β]) = Σ_{α′ non fissati da β′} Σ_{α non fissati da β} D([P_α′],[P_α]) (eq. 9) [V].
- **Condizione e regola delle probabilità.** Un insieme decoere se D([P_α′],[P_α]) ≈ 0 per ogni α′_k ≠ α_k (eq. 10) — condizione sufficiente, non necessaria, per D([P_β],[P_β]) ≈ Σ D([P_α],[P_α]) (eq. 11); allora p([P_α]) = D([P_α],[P_α]) = Tr[P_{α_n}(t_n)⋯P_{α_1}(t_1) ρ P_{α_1}(t_1)⋯P_{α_n}(t_n)] (eq. 12) e vale la regola di somma p([P_β]) ≈ Σ p([P_α]) (eq. 13), es. Σ_{α_k} p(…,α_k t_k,…) ≈ p(…,α_{k−1}t_{k−1},…) (eq. 14). Ogni ulteriore grana grossa di un insieme decoerente è decoerente [V]. «Se uno standard per le probabilità è richiesto dal loro uso, si può raggiungerlo rendendo più grossa la grana finché (10) e (13) valgono al livello richiesto» [V] — [Gell-Mann & Hartle 1990](https://arxiv.org/abs/1803.04605).
- **Generalizzazione del doppio fenditura.** La condizione (10) «è una generalizzazione della condizione di assenza di interferenza nell'esperimento delle due fenditure» [V] — [Gell-Mann & Hartle 1990](https://arxiv.org/abs/1803.04605). Esplicitamente: per due cammini 1,2 verso lo stesso punto, p(1∪2) = |A₁+A₂|² = p₁ + p₂ + 2Re(A₁*A₂), e 2Re D(1,2) è il termine di interferenza [R, calcolo standard].
- **Livelli di coerenza [R].** Griffiths (J. Stat. Phys. 36, 219, 1984): coerenza «debole» Re D(α,α′) = 0 per α≠α′, sufficiente per l'additività; Gell-Mann–Hartle: decoerenza «media» D(α,α′) = 0 (anche la parte immaginaria), più forte; Gell-Mann–Hartle PRD 47, 3345 (1993) distinguono anche decoerenza «forte» con record. Fonte di orientamento: [SEP, «The Consistent Histories Approach to Quantum Mechanics» (Griffiths)](https://plato.stanford.edu/entries/qm-consistent-histories/) [non riletta ora].
- **Record e decoerenza (Hartle).** Il meccanismo di decoerenza dei quasiclassici: le variabili non seguite (il bagno) sono integrate via nel funzionale d'influenza di Feynman–Vernon; t_decoh = ħ²/(2Mγk_BTΔ²) [V] — [Hartle 2008](https://arxiv.org/abs/0806.3776). Il problema della selezione: la grande maggioranza degli insiemi coerenti non è classica; la ridondanza dei record seleziona quelli classici [V] — [Riedel, Zurek, Zwolak 2016](https://arxiv.org/abs/1312.0331).
- **Coerenza come struttura d'albero.** Con stato puro, coerenza D(α,β) = 0 = ⟨ψ_α|ψ_β⟩ per α≠β: ogni ramo si connette direttamente ai rami sotto di lui (struttura ad albero) [V] — [Riedel, Zurek, Zwolak 2016](https://arxiv.org/abs/1312.0331).

### Inferences
- **Risposta alla domanda della r. 13 («che cosa succede ai pesi dei rami quando due strade portano allo stesso stato»):** (a) se le due strade α, α′ arrivano allo stesso stato completo (inclusi ambiente e record) allora D(α,α′) = ⟨ψ_α|ψ_α′⟩ ≠ 0: le storie *non* sono un insieme coerente, la probabilità dello stato finale è |A_α + A_α′|² e non p_α + p_α′; in termini everettiani le due strade non erano mai due rami. (b) Se le strade sono uguali solo alla grana grossa ma i record a grana fine le distinguono, allora D(α,α′) ≈ 0, la grana grossa fonde le storie con regola di somma p(β) = p_α + p_α′ (eq. 13): è esattamente la fusione «due rami uguali a una grana sono lo stesso», con peso additivo. La rete «che si richiude» della r. 13 è quindi legittima a peso additivo solo se sotto la grana restano record (differenze) che rendono i rami ortogonali; se le differenze scompaiono davvero (nessun record), il peso giusto è quello delle ampiezze e può esserci interferenza distruttiva.
- Nella decoerenza realistica gli stati dei due rami non tornano mai identici (i record si moltiplicano, §3), quindi per oggetti macroscopici il caso (a) non accade in pratica: la fusione a grana grossa con somma dei pesi è la regola corretta per stateyour sopra la scala di decoerenza; il caso (a) vale solo sotto (interferometri, atomi isolati).
- La r. 11 («il passato è una sovrapposizione delle storie compatibili finché non lo si guarda») corrisponde a lasciare la grana grossa: il passato non osservato è un insieme di storie a grana più grossa; «guardarlo» è passare a un raffinamento, possibile con probabilità solo se l'insieme raffinato è ancora (quasi) coerente.

### Gaps
- Non riletta ora la voce SEP né Griffiths 1984; le definizioni di coerenza debole/media/forte sono [R].
- L'eq. di Deutsch 1991 per le curve chiuse di tipo tempo (punto fisso ρ = Tr_{CR}[U(ρ_in⊗ρ)U†], citata dalla r. 13) non è stata riletta: [R], Phys. Rev. D 44, 3197 (1991).

---

## 6. Formalismo a due vettori di stato (ABL, valori deboli) e programmi retrocausali

### Takeaway
Con pre- e post-selezione un sistema è descritto da ⟨Φ| |Ψ⟩; la probabilità di un esito intermedio è la regola ABL, simmetrica nel tempo; le misure deboli danno il valore debole C_w = ⟨Φ|C|Ψ⟩/⟨Φ|Ψ⟩. I programmi retrocausali (Price, Wharton, Cramer) sostengono che parametri locali dipendenti da input futuri spiegano le correlazioni di Bell senza azione a distanza. Statuto: ABL e valori deboli **teorema + misurato** (amplificazione per valore debole osservata); retrocausalità **ipotesi/speculazione** (solo modelli giocattolo).

### Cited Findings
- **Due vettori di stato.** TSVF, nata da Aharonov–Bergmann–Lebowitz: il sistema al tempo t è descritto completamente da ⟨Φ| |Ψ⟩, con |Ψ⟩ evoluto dal passato (pre-selezione) e ⟨Φ| evoluto all'indietro dal futuro (post-selezione); stato «generalizzato» Σ_i α_i ⟨Φ_i| |Ψ_i⟩ se c'è un'ancella [V] — [Aharonov & Vaidman, «The two-state vector formalism: an updated review» (2001/2008)](https://arxiv.org/abs/quant-ph/0105101).
- **Regola ABL.** Prob(c_n) = |⟨Φ|P_{C=c_n}|Ψ⟩|² / Σ_j |⟨Φ|P_{C=c_j}|Ψ⟩|² (eq. 9); per stato generalizzato Prob(c_n) = |Σ_i α_i⟨Φ_i|P_{C=c_n}|Ψ_i⟩|²/Σ_j|Σ_i α_i⟨Φ_i|P_{C=c_j}|Ψ_i⟩|² [V] — [Aharonov & Vaidman](https://arxiv.org/abs/quant-ph/0105101). Originale: Phys. Rev. 134, B1410 (1964) [R].
- **Valore debole.** C_w ≡ ⟨Φ|C|Ψ⟩/⟨Φ|Ψ⟩ (eq. 21); le letture del puntatore si raggruppano attorno a Re(C_w), Im(C_w) si ricava dallo spostamento nell'impulso del puntatore; generalizzato: C_w = Σ_i α_i⟨Φ_i|C|Ψ_i⟩/Σ_i α_i⟨Φ_i|Ψ_i⟩ (eq. 22) [V] — [Aharonov & Vaidman](https://arxiv.org/abs/quant-ph/0105101). Originale: Aharonov, Albert, Vaidman, PRL 60, 1351 (1988) [R].
- **Wharton–Argaman (RMP 2020).** Bell non esclude tutti i modelli «localmente mediati» (parametri lungo le linee d'universo, covarianti di Lorentz) se si rilassa un'assunzione di freccia del tempo: alcuni parametri dipendono funzionalmente dalle impostazioni di misura nel loro futuro («retrocausali»); sono risolti «tutti in una volta» (all-at-once) e non dal passato al futuro; il numero di parametri non cresce esponenzialmente con il numero di particelle intrecciate; esistono solo modelli giocattolo per fenomeni specifici, la generalizzazione è una «grande sfida» [V] — [Wharton & Argaman, «Colloquium: Bell's theorem and locally-mediated reformulations of QM»](https://arxiv.org/abs/1906.04313). Includono tra i modelli a dipendenza da input futuri l'interpretazione transazionale (Cramer 1980) e la TSVF, motivate dalla simmetria temporale più che dalla località; e precisano che «retrocausale» vale se gli input futuri sono controllabili [V].
- **Price–Wharton.** Proposta di Costa de Beauregard: le correlazioni EPR si spiegano senza azione a distanza con un'influenza a «zigzag» attraverso i coni di luce passati intersecati degli eventi (scappatoia retrocausale di Bell) [V abstract] — [Price & Wharton, «Disentangling the quantum world», Entropy 2015](https://arxiv.org/abs/1508.01140).
- **Transazionale (Cramer).** Onde «offerta» ritardate e onde «conferma» avanzate; la transazione completata ha ampiezza ψψ* = regola di Born [R] — J. G. Cramer, Rev. Mod. Phys. 58, 647 (1986), non riletto.

### Inferences
- La TSVF è il modello formale più vicino alla «bolla» come condizione: fissare una bolla equivale a una post-selezione; la regola ABL dà il peso di ciò che sta in mezzo condizionato sia al passato sia alla bolla, cioè la versione quantistica di «il mondo compatibile» (r. 5) e «il prima è un'inferenza» (r. 11). Nel caso classico/decoerente la regola ABL si riduce a Bayes con verosimiglianza (il peso e^{−χ²/2} di `campoCondizionato` è l'analogo gaussiano).
- L'impostazione «all-at-once» di Wharton coincide con la scelta della r. 12 di condizionare un mondo a tutte le bolle insieme invece di farlo crescere attorno a ciascuna; il progetto non ha bisogno di sposare la retrocausalità: basta la condizione al contorno su due tempi.

### Gaps
- Gli esperimenti di amplificazione per valore debole (Hosten–Kwiat 2008; Dixon et al. 2009) e le critiche sul significato fisico dei valori deboli non sono stati riletti: [R].

---

## 7. Teoremi no-go sull'amico di Wigner: Brukner 2018, Frauchiger–Renner 2018, Bong et al. 2020

### Takeaway
Combinando osservatori dentro laboratori che super-osservatori misurano «in base intrecciata», si dimostrano incompatibilità tra (i) validità universale della QM, (ii) località, (iii) libertà di scelta e (iv) fatti osservati assoluti/indipendenti dall'osservatore. Bong et al. mostrano la versione più forte (Local Friendliness, LF: politopo con 932 facce) e la violano in un esperimento fotonico dove l'«amico» è il cammino di un fotone. Statuto: **teoremi**; esperimenti **misurati** ma solo con «amici» non coscienti (gradi di libertà di fotoni), quindi la conclusione sugli osservatori reali resta condizionale.

### Cited Findings
- **Brukner 2018.** Postulato «fatti indipendenti dall'osservatore»: i valori di verità delle proposizioni A_i di tutti gli osservatori sono assegnabili congiuntamente [V]. Teorema: sono incompatibili (1) validità universale della QM (le predizioni valgono a qualunque scala, anche se il sistema misurato contiene un «osservatore» col suo laboratorio e la sua memoria), (2) località (la scelta d'impostazione di un osservatore non influenza gli esiti dell'altro lontano), (3) libertà di scelta (impostazioni statisticamente indipendenti dal resto), (4) fatti indipendenti dall'osservatore [V]. Prova: due amici (Charlie, Debbie) misurano spin; i super-osservatori (Alice, Bob) scelgono A₁ (= l'esito dell'amico) o A₂ (misura sul laboratorio intero), idem B₁, B₂; (2)+(3)+(4) implicano variabili nascoste locali e la distribuzione congiunta p(A₁,A₂,B₁,B₂), quindi CHSH S = ⟨A₁B₁⟩ + ⟨A₁B₂⟩ + ⟨A₂B₁⟩ − ⟨A₂B₂⟩ ≤ 2, violata dalla QM [V] — [Brukner, «A no-go theorem for observer-independent facts», Entropy 20, 350 (2018)](https://arxiv.org/abs/1804.00749). Brukner lega l'«autocoerenza» di FR all'assunzione che le affermazioni di osservatori diversi siano confrontabili in un unico quadro indipendente dall'osservatore [V abstract].
- **Frauchiger–Renner 2018.** Tre assunzioni che non possono valere tutte [V]: **(Q)** validità universale della QM, nella forma: se un agente sa che S è in ψ al tempo t₀ e che il valore x sarà ottenuto da una misura dei proiettori di Heisenberg {π_x^{t₀}}, e ⟨ψ|π_ξ^{t₀}|ψ⟩ = 1, allora può concludere «sono certo che x = ξ al tempo t» — anche se S è grande e contiene agenti; **(C)** coerenza: le predizioni di agenti diversi, che ragionano l'uno sull'altro con la stessa teoria, non si contraddicono (si possono concatenare); **(S)** esito singolo: se un agente è certo che x = ξ deve negare di essere certo che x ≠ ξ. Conclusione: un agente, osservato un certo esito, deve concludere che un altro ha predetto con certezza l'esito opposto; «la teoria quantistica non può essere estrapolata a sistemi complessi, almeno non in modo diretto»; ogni interpretazione viola almeno una delle tre [V] — [Frauchiger & Renner, Nat. Commun. 9, 3711 (2018)](https://arxiv.org/abs/1604.07422). Nota degli autori: l'ipotesi di controllo completo dei laboratori è irrealistica, ma «le leggi della QM non impediscono che sia soddisfatta con approssimazione arbitraria» [V].
- **Bong et al. 2020 (Local Friendliness).** Teorema 1: se un super-osservatore può eseguire operazioni quantistiche arbitrarie sul laboratorio di un osservatore, nessuna teoria fisica soddisfa LF [V]. Assunzioni formali [V]: **AOE (Absoluteness of Observed Events)**: ∃ P(abcd|xy) con (i) ℘(ab|xy) = Σ_{c,d} P(abcd|xy), (ii) P(a|cd, x=1, y) = δ_{a,c}, (iii) P(b|cd, x, y=1) = δ_{b,d} («gli esperimenti eseguiti hanno risultati assoluti»; gli esiti non eseguiti non ne hanno, Peres); **NSD (No-Superdeterminism)**: eventi su un'ipersuperficie di tipo spazio sono scorrelati da scelte libere successive ⇒ P(cd|xy) = P(cd); **L (Locality)**: la probabilità di un evento non cambia condizionando su una scelta libera spazialmente separata (= «parameter independence» di Shimony). NSD+L = «local agency»; AOE+NSD+L = LF [V]. Le correlazioni LF formano un politopo con **932 facce**, in nove classi inequivalenti; le disuguaglianze LF sono indipendenti dalla teoria e l'insieme LF contiene strettamente quello a variabili nascoste locali (si può violare Bell senza violare LF) [V]. Esperimento: fotoni in polarizzazione, gli «amici» sono cammini di fotoni; stato ρ_μ con μ regolabile; a μ = 0,80–0,81 violazione di Bell senza violare nessuna delle 932 LF; a μ = 0,87 prima violazione LF; ai μ più alti violata anche la disuguaglianza «genuina LF»; tutti i punti tranne μ = 0,81 ad almeno 2 deviazioni standard da 0 [V]. Limiti dichiarati: non sono stati sondati i modelli di collasso; resta possibile che LF sia valida e che la natura proibisca violazioni con osservatori veri (collasso oggettivo o limiti di controllo coerente) [V] — [Bong et al., Nat. Phys. 16, 1199 (2020)](https://arxiv.org/abs/1907.05607).
- **Proietti et al. 2019.** Esperimento a 6 fotoni dello scenario esteso di Brukner a quattro osservatori: violazione della disuguaglianza di tipo Bell associata per 5 deviazioni standard; «se si mantengono località e libera scelta, la QM va interpretata in modo dipendente dall'osservatore» [V abstract] — [Proietti et al., Sci. Adv. 5, eaaw9832 (2019)](https://arxiv.org/abs/1902.05080).
- **Risposta relazionale.** Di Biagio–Rovelli: la distinzione fatti relativi/stabili risolve FR ed è coerente con la violazione LF (cade AOE per fatti non stabili) [V abstract] — [Di Biagio & Rovelli 2021](https://arxiv.org/abs/2006.15543).

### Inferences
- In stateyour, dove «tutti gli esiti esistono» e «leggere non crea niente» (r. 3), l'assunzione che cade è AOE / (S) a livello globale: un esito è assoluto solo dentro un ramo (o relativo a un sistema). Il modello è quindi coerente con questi teoremi a patto di non pretendere che due «letture» fatte in rami/contesti diversi diano un unico valore congiunto; la località (r. 3, contenitore e dopo) e la libera scelta dell'indirizzo restano salve.
- Per gli oggetti macroscopici decoerenti (ε ≈ 0) le violazioni LF non sono osservabili in pratica (servirebbe annullare la decoerenza di un laboratorio), quindi la regola «una volta letto, l'esito è quello, sempre» è corretta FAPP sopra la scala di decoerenza.

### Gaps
- La formula esplicita delle disuguaglianze «genuine LF» e la loro violazione numerica non sono state estratte (il testo PDF a colonne era illeggibile nella tabella).
- Esperimenti più recenti (es. Utreras-Alarcón et al. 2023 con «amici» in memoria quantistica; proposte con IA su computer quantistico, Wiseman et al. 2023) non riletti: [R].

---

## 8. Effetto Zeno quantistico (Itano 1990) e relazione d'indeterminazione operativa (Arthurs–Kelly), in breve

### Takeaway
Misure frequenti congelano l'evoluzione perché la probabilità di sopravvivenza è quadratica nel tempo breve: S(T) ≈ [1 − (ΔH)²(T/n)²]ⁿ → 1. Itano et al. 1990 lo hanno osservato su ~5000 ioni Be⁺ (P₂(T) = ½[1 − cosⁿ(π/n)], n fino a 64). Statuto: **misurato** (ma c'è disaccordo su se sia un vero «effetto Zeno» o semplice dinamica con l'apparato). Arthurs–Kelly: misura congiunta di x e p con raddoppio del limite. Statuto: **teorema + misurato** [R].

### Cited Findings
- **Formula Zeno.** S(t) = |⟨φ|e^{−iHt}|φ⟩|² ≈ 1 − (ΔH)²t² (eq. 2), (ΔH)² = ⟨φ|H²|φ⟩ − ⟨φ|H|φ⟩² (eq. 3); con n misure in T: S(T) ≈ [1 − (ΔH)²(T/n)²]ⁿ (eq. 4) → 1 per n→∞ [V] — [Itano, «Perspectives on the quantum Zeno paradox» (2006)](https://arxiv.org/abs/quant-ph/0612187). Originale: Misra & Sudarshan, J. Math. Phys. 18, 756 (1977) [V via bibliografia di Itano].
- **Esperimento IHBW 1990.** Proposta di Cook; tre livelli in Be⁺ (1, 2 sottolivelli iperfini di 2S₁/₂; 3 sottolivello di 2P₃/₂ che decade solo in 1); ~5000 ioni in trappola di Penning; impulso π a radiofrequenza (T = π/Ω) con n impulsi laser brevi equispaziati come «misure»; senza misure P₂(t) = sin²(Ωt/2) = ½[1 − cos Ωt] (eq. 5); con n misure P₂(T) = ½[1 − cosⁿ(π/n)] (eq. 6); dati per n = 1…64 in accordo con il calcolo (Fig. 4) [V] — [Itano 2006](https://arxiv.org/abs/quant-ph/0612187); originale Itano, Heinzen, Bollinger, Wineland, Phys. Rev. A 41, 2295 (1990) [V via bibliografia]. Itano nota «molto disaccordo su come definire l'effetto Zeno e se quell'esperimento lo abbia dimostrato» [V].
- **Arthurs–Kelly [R].** Misura simultanea di posizione e impulso con due puntatori: le deviazioni standard delle letture soddisfano Δx_M Δp_M ≥ ħ (il doppio di ħ/2); generalizzazione Arthurs–Goodman (1988): Δ_A Δ_B ≥ |⟨[A,B]⟩| per misure congiunte non ideali; Robertson Δ_A Δ_B ≥ ½|⟨[A,B]⟩| per misure separate. Fonte originale: E. Arthurs & J. L. Kelly, Bell Syst. Tech. J. 44, 725 (1965) — non riletta.

### Inferences
- Per n = 64, P₂(T) = ½[1 − cos⁶⁴(π/64)] ≈ 0,037 (calcolo diretto dall'eq. 6): «guardare spesso» un evento non ancora accaduto ne riduce il peso. In stateyour, se «leggere» un punto ripetutamente fosse un'interazione fisica (non un calcolo esterno), cambierebbe i pesi dei rami; la r. 3 («leggere non forza niente») è coerente solo se la lettura del modello è esterna al mondo, non una misura dentro di esso.

### Gaps
- Arthurs–Kelly e Arthurs–Goodman non riletti (non trovata copia open access in questa sessione): tutto [R].

---

### Fonti principali (lette ora in testo pieno, salvo dove indicato)
- Schlosshauer, «Quantum decoherence», Phys. Rep. 831 (2019) — https://arxiv.org/abs/1911.06282
- Zurek, «Decoherence, einselection, and the quantum origins of the classical», RMP 75, 715 (2003) — https://arxiv.org/abs/quant-ph/0105127
- Zurek, «Quantum Darwinism», Nat. Phys. 5, 181 (2009) — https://arxiv.org/abs/0903.5082
- Riedel & Zurek, PRL 105, 020404 (2010) — https://arxiv.org/abs/1001.3419
- Riedel, Zurek, Zwolak, PRA 93, 032126 (2016) — https://arxiv.org/abs/1312.0331
- Carroll & Sebens (2014) — https://arxiv.org/abs/1405.7907
- Wallace (2009) — https://arxiv.org/abs/0906.2718
- Deutsch & Hayden (2000) — https://arxiv.org/abs/quant-ph/9906007
- Wallace & Timpson (2010) — https://arxiv.org/abs/0907.5294
- Rovelli (1996) — https://arxiv.org/abs/quant-ph/9609002
- Di Biagio & Rovelli (2021) — https://arxiv.org/abs/2006.15543
- Gell-Mann & Hartle (1990) — https://arxiv.org/abs/1803.04605
- Hartle (2008) — https://arxiv.org/abs/0806.3776
- Aharonov & Vaidman, TSVF review — https://arxiv.org/abs/quant-ph/0105101
- Frauchiger & Renner (2018) — https://arxiv.org/abs/1604.07422
- Brukner (2018) — https://arxiv.org/abs/1804.00749
- Bong et al. (2020) — https://arxiv.org/abs/1907.05607
- Proietti et al. (2019) — https://arxiv.org/abs/1902.05080 (abstract)
- Price & Wharton (2015) — https://arxiv.org/abs/1508.01140 (abstract)
- Wharton & Argaman (2020) — https://arxiv.org/abs/1906.04313
- Itano (2006) — https://arxiv.org/abs/quant-ph/0612187
- Solo [R], non open access o non riletti: Everett 1957; Joos–Zeh 1985; ABL 1964; AAV 1988; Cramer 1986; Griffiths 1984; Gell-Mann–Hartle 1993; Deutsch 1991; Arthurs–Kelly 1965; Wallace, *The Emergent Multiverse* (2012); voce SEP sulle storie coerenti.
