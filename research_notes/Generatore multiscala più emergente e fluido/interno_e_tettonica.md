# Interno, tettonica e crosta: renderli emergenti, collegati, continui nello zoom, rapidi e precisi

Note di un gruppo di esperti (geodinamica, petrologia e geochimica, geologia strutturale, geofisica planetaria) per lo scrittore del rapporto.

**Marche.**
- [V]: verificato in questa sessione sulla fonte (testo intero o sezione letta). [V-prec]: verificato in un rapporto precedente del progetto.
- [S]: solo riassunto o scheda letti. [R]: ricordato, non riletto. [D]: derivato qui.
- [codice]: letto nel codice di stateyour (repo in sola lettura, letto il 2026-11-21).

**I numeri di riga** sono quelli dei file di oggi. Diverse sigle dell'«Inventario» (GE1–GE8, TT8) puntano a righe e formule che il codice non ha più: `storia.js` ha già sostituito le soglie con Korenaga 2010.

**Quadro d'insieme [codice].**
- `storia.js` integra una storia termica parametrizzata nel tempo:
  - mantello e nucleo alla Driscoll e Bercovici, letta riga per riga da ThermInt (MIT);
  - criterio di Korenaga per il regime e mobilità continua;
  - coperchio fermo alla Foley 2019;
  - fuso dal solidus di Katz.
- `tettonica.js` fa evolvere la crosta su una carta 256×128:
  - mantello dato da Swift–Hohenberg;
  - quote da una colonna di McKenzie;
  - spessore neutro dall'energia potenziale;
  - cedimento della crosta che fonde.
- `geologia.js` somma al risultato:
  - 24 onde casuali;
  - vulcani gaussiani;
  - nelle tessere più fini, un rumore di valore la cui ampiezza dipende solo dal livello.
- Il genitore, quindi, è già in buona parte fisico. I buchi principali sono tre:
  - la tettonica non legge la storia nel tempo (usa la q di oggi);
  - i bilanci (fuso, crosta, acqua) non si chiudono tra `storia`, `tettonica` ed `elementi`;
  - **tutto ciò che sta sotto la cella di ~150 km è rumore isotropo, non condizionato dal contesto tettonico**. È la causa diretta dei «1–500 km vuoti» e delle superfici omogenee da vicino.

---

## 1. Convezione parametrizzata e regime tettonico come esiti emergenti (coperchio fermo, placche, episodico): quali criteri compatti e verificabili esistono?

### Takeaway
I criteri compatti e verificabili sono tre, e stateyour ne implementa già il più usato, quello di Korenaga.
- Contrasto di viscosità della litosfera contro un critico che dipende da Ra (Korenaga 2010, ripreso da O'Rourke e Korenaga 2012).
- Sforzo convettivo contro resistenza a snervamento, con la temperatura di superficie dentro (Foley e Driscoll 2016).
- Indice di mobilità continuo (Foley e Bercovici 2014).

Mancano tre cose:
- il regime **episodico**, da far uscire per isteresi e non per interruttore;
- il destabilizzarsi del coperchio per eclogite sui pianeti grandi;
- **il passaggio della storia nel tempo (q(t), mob(t), v(t)) alla tettonica**, che oggi usa la q di oggi per 4,5 miliardi di anni.

### Cited Findings

**(a) Che cosa nel codice è fissato a mano o non emergente**

- Il regime è già emergente in `storia.js:271-281` [codice]:
  - `lnEta = 0,327·γ^0,647·θ`, con `γ = μ_eff/(α·ΔT)`;
  - `lnCrit = ln 0,25 + ½ ln Ra`;
  - mobilità `m = 1/(1 + e^{s(lnEta − lnCrit)})`.
- Restano due liberi dichiarati:
  - `raccordo: 1` (s), in `storia.js:152`;
  - `poriAcqua λ = 0,97`, in `storia.js:174` («il valore vero è aperto (0,02–0,1)» per μ_eff).
- Il regime episodico manca dichiaratamente: «MANCA: … il regime episodico (Venere)», `storia.js:106-107` [codice].
- `tettonica.js` conserva soglie proprie [codice]:
  - `qPlacche: 0,05, qVivo: 0,02`, in `tettonica.js:88`;
  - `aPlacche = placche ?? (q > C.qPlacche && !!acqua), vivo = q > C.qVivo`, in `tettonica.js:601`.
  - `geologia.js:61` passa `placche: true` quando la storia dice «a placche»: la prima soglia è quindi aggirata, ma `vivo` (mantello fermo sotto 0,02 W/m²) resta un interruttore su q.
- Il mantello di `tettonica.js` è un'equazione di forma (Swift–Hohenberg), con controlli scelti a mano [codice]:
  - `epsilon = clamp(0,35·q/qTerra, 0,15, 0,8)` (`tettonica.js:602`);
  - numero di celle `onde = clamp(round(2πR/(3·D_m)), 3, 11)` (`tettonica.js:600`);
  - non linearità `g = −1,2` (`tettonica.js:213`);
  - «coperta 2,5, inerzia 4» (`tettonica.js:94-95`): quanto e in quanto tempo un continente scalda il mantello, «scelti guardando il risultato» (`tettonica.js:70-72`).
- «Il calore q è quello di oggi per tutta la storia», `tettonica.js:75-76` [codice]: la storia termica (`storia.js`) non entra nel tempo della tettonica.
- Senza placche, la topografia dinamica è un'ampiezza fissa [codice]:
  - `A = 1500·min(1, q/qTerra)` metri per il campo del mantello (`tettonica.js:606`);
  - sui mondi senza tettonica, `alt = −1500 + r·700` m da 24 onde casuali (`geologia.js:64-68`).
- Difetti di bilancio dichiarati [codice, `storia.js:117-118`]: «la crosta degli oceani viene di 14 km (vera: 7) e il magma il doppio del vero». Inoltre «sotto un coperchio fermo … Marte oggi esce "con vulcani"» (`storia.js:116`).

**(b) Le leggi che sostituiscono, in forma compatta**

- *Criterio di Korenaga* (in O'Rourke e Korenaga 2012) [V, sezione letta] — [arXiv:1210.3838](https://ar5iv.labs.arxiv.org/html/1210.3838):
  - `Δη_L = exp(0,327·γ^0,647·θ_tot)` contro `Δη_L,crit = 0,25·Ra_i,tot^{1/2}`, con `γ = μ/[α(T_u − T_s)]`;
  - θ è il parametro di Frank-Kamenetskii: `θ = E(T_u − T_c)/(R·T_u²)` (eq. 5);
  - `Ra_i = α·ρ_m·g·(T_u − T_c)·h_m³/(κ·η)` (eq. 4).
  - Gli autori trovano che **l'idratazione della litosfera pesa più della massa**, che la massa rende le placche «solo marginalmente» più probabili e che conta di più μ.
- *Velocità sotto un coperchio fermo* [V] — [ivi, eq. 6](https://ar5iv.labs.arxiv.org/html/1210.3838): `u = 0,38·(κ/h_m)·(Ra/θ)^{1/2}`.
- *Crosta di un coperchio fermo con la massa* [V] — [ivi](https://ar5iv.labs.arxiv.org/html/1210.3838):
  - fuso `f_m/f_m⊕ ≈ (M/M⊕)^0,240`;
  - spessore `h_c/h_c⊕ ≈ (M/M⊕)^−0,284`.
- *Coperchio che si destabilizza da sé* [V] — [ivi](https://ar5iv.labs.arxiv.org/html/1210.3838):
  - la probabilità della transizione basalto→eclogite cresce con la massa; la profondità del limite di fase va come ~1/g;
  - spinta della radice eclogitica `Δρ·g·h_e` (Δρ ~ 100 kg/m³) contro resistenza `μ·ρ_L·g·d_e`;
  - gli autori suggeriscono un comportamento «intermittente simile alle placche», ma lasciano la dinamica a lavori futuri.
- *Criterio di sforzo* (Foley e Driscoll 2016) [V, sezioni 1–4.3] — [arXiv:1711.06801](https://ar5iv.labs.arxiv.org/html/1711.06801), G³ 17, 1885, [DOI 10.1002/2015GC006210](https://doi.org/10.1002/2015GC006210):
  - `τ_m ∝ μ_m·ε̇_m` (eq. 4), con `ε̇_m ≈ v_m/d` e `v_m ∝ Ra^{2/3}` (eq. 5);
  - `Ra = ρgαΔT·d³/(κ·μ_m)` (eq. 6);
  - placche solo se τ_m raggiunge lo sforzo di snervamento τ_y (eq. 3: `μ_eff ∝ τ_y/ε̇`);
  - «uno sforzo convettivo sotto lo snervamento non forma bordi deboli»;
  - con il mantello più caldo lo sforzo va come μ_m^{1/3}: il mantello caldo spinge verso il coperchio fermo;
  - subduzione senza indebolimento reologico solo se il contrasto di viscosità superficie/interno è sotto ~10⁴;
  - **+100 K di temperatura superficiale bastano per un coperchio fermo** sulla Terra; nel meccanismo della riduzione della grana servono 500–600 K;
  - danno per grana: `h = h_n·exp(−E_h/(R_g·T))` (eq. 8); reologia efficace con esponente n = 3 (eq. 12).
- *Flusso con le placche* [V] — [Foley e Driscoll, eq. 23](https://ar5iv.labs.arxiv.org/html/1711.06801):
  - `Q_conv = a_m·ν_m^{−β}·T_m^{β+1}`, β = 1/3, a_m = 8,4·10¹⁰;
  - sotto un coperchio fermo a_m si divide per ~25: è il «1/25 fisso» che `storia.js:46-48` ha già sostituito con la legge di Foley 2019 [codice].
- *Transizione* [V-prec] — [arXiv:1410.7652](https://arxiv.org/abs/1410.7652): Foley e Bercovici 2014 mostrano una transizione «graduale e continua» e che la temperatura di superficie «abbassa drasticamente» la velocità delle placche.
- *Biforcazione* [S, via la rassegna di Höning e Spohn 2023] — [PDF](https://publications.pik-potsdam.de/pubman/item/item_29057_2/component/file_29072/29057oa.pdf): Weller e Lenardic 2018 propongono che la retroazione temperatura di superficie ↔ regime dia una **biforcazione irreversibile** tra placche e coperchio fermo. Ne segue che il regime dipende dalla storia (isteresi), non solo dallo stato di oggi.
- *Coperchio fermo* (Solomatov e Moresi 2000) [R] — [DOI 10.1029/2000JB900197](https://doi.org/10.1029/2000JB900197):
  - `q ≈ c₁·k·ΔT/D·θ^{−4/3}·Ra^{1/3}`;
  - è la forma che `storia.js:46-48` usa come legge di Foley 2019, con c₁ = 0,5 [codice].
  - La ricerca di questa sessione non ha ritrovato l'espressione sull'originale.
  - Korenaga 2009 definisce θ con `E·ΔT/[R(T_s + ΔT)²]` e nota che il legame θ–E non è unico [S] — [PDF](https://people.earth.yale.edu/sites/default/files/korenaga09a.pdf).
- *Regime episodico* (Moresi e Solomatov 1998) [R] — [DOI 10.1046/j.1365-246X.1998.00521.x](https://doi.org/10.1046/j.1365-246X.1998.00521.x): con una litosfera fragile esistono tre regimi (coperchio fermo, mobile, episodico), con la fascia episodica tra i due quando lo snervamento è vicino allo sforzo convettivo.
- *Il modello originale* (Stevenson, Spohn e Schubert 1983) [R] — [DOI 10.1016/0019-1035(83)90241-5](https://doi.org/10.1016/0019-1035(83)90241-5): storia termica parametrizzata di mantello e nucleo (strato limite Nu ∝ Ra^{1/3}, nucleo che gela) applicata ai pianeti terrestri; ThermInt ne è la discendenza diretta.
- *ThermInt (VPLanet)* è MIT [V-prec, `storia.js:18-19` e rapporto «Simulatori»] — [arXiv:1509.07452](https://arxiv.org/abs/1509.07452).

**(c) Come calcolarlo a poco prezzo, con errore noto**

- Tutto ciò che sta sopra è un sistema di 2–4 equazioni ordinarie: una storia costa da microsecondi a millisecondi per pianeta [codice: «qualche centinaio di righe in memoria», `storia.js:9`; V-prec rapporto «Come farlo emergere» §3].
- L'errore dominante non è numerico ma di parametro: μ_eff varia tra 0,02 e 0,1 (`storia.js:174` [codice]), e Δη_L cambia di ordini di grandezza.
- La forma corretta di presentarlo è il «ramo» (`APERTI`), che il codice già fa.

**(d) Dal genitore al figlio e ritorno: bilanci che si chiudono**

- Verso il basso, `storia` dà a ogni tempo t: `T_u(t)`, `q(t)`, `mob(t)`, `v(t)`, lo spessore del coperchio `lid(t)`, la portata di fuso `Ṁ(t)` e la sua ripartizione [codice: `storia.js:316`, `o.mob`, `o.lid`, `o.Fv`; `:451` `Qconv`, `Qfuso`, `Mfuso`].
- Verso l'alto, `tettonica` dovrebbe restituire:
  - l'area continentale A(t);
  - la lunghezza delle fosse L_sub(t);
  - l'età media del fondale.
- Le chiusure, in Höning e Spohn 2023, eq. 3 [V, testo letto] — [PDF](https://publications.pik-potsdam.de/pubman/item/item_29057_2/component/file_29072/29057oa.pdf):
  - `ρ_m·c_p·V_m·Ṫ = −q_m,E·√(ΔT_u(1+b)·v_p)·[(1 − A)·n₃ + A·(1 − n₃)] + Q_AE·[1 + n₄(1 − A*)] + q_core`;
  - `n₃` è la quota di calore che esce dagli oceani: **la coperta dei continenti**, che oggi è `coperta 2,5` a mano;
  - `n₄` è la quota di elementi radioattivi nella crosta: **i radioattivi che la crosta porta via**, oggi assenti in `storia.js:106`.

### Inferences
- [D] La mossa più redditizia non è una nuova legge ma un filo: far leggere a `evolviTettonica` la serie `storia(P, t)` a ogni passo grosso (q, ΔT, v, mob, acqua in superficie), invece di `q` di oggi.
  - Spariscono `qVivo`, la `q` fissa (TT9) e l'`epsilon` a mano: il vigore del mantello di forma diventa `Ra(t)/Ra_c`.
  - La velocità delle placche viene già da `velocitaPlacche(q, ΔT, L)` (`tettonica.js:551`).
- [D] **Episodico senza interruttore.** Tenere come stato lo spessore del coperchio e una «memoria di danno» (Foley e Driscoll, eq. 8–12), e confrontare `τ_m(t)` con `τ_y(t)`.
  - Quando τ_m supera τ_y il coperchio si rompe e si rinnova in tempo ~ D/v. Il fondale nuovo raffredda il mantello, τ_m cala, il coperchio si richiude.
  - Il ciclo e il suo periodo escono da soli; un pianeta come Venere, vicino alla soglia, li mostra. Il «raccordo s» diventa l'isteresi del danno, non un parametro di forma.
- [D] **Eclogite.** Per i pianeti con crosta basaltica spessa (coperchio fermo), confrontare la profondità della transizione (~1/g) con lo spessore della crosta di `storia`.
  - Se la crosta la supera, la radice sprofonda: la crosta si limita da sé e il «coperchio di centinaia di km» di Marte (`storia.js:116-117`) diventa un esito controllato.
  - Questo chiude anche il bilancio del fuso (ciò che sprofonda torna al mantello).
- [D] Il difetto «crosta oceanica 14 km invece di 7» indica che la produttività integrata dalla risalita è doppia. Va confrontata con la profondità d'inizio fusione del solidus di Katz alla T_p della storia, prima di toccare `produttivita`.

### Gaps
- L'espressione esatta di Solomatov e Moresi 2000 e il dominio di validità in θ non sono stati riletti sull'originale (solo citati da altri) [R].
- Nessuna fonte letta dà un criterio chiuso e verificato per il regime episodico. Moresi e Solomatov 1998 è ricordato, non letto; la proposta (danno + isteresi) è un'inferenza.
- Le sezioni sull'acqua (rigassamento/degassamento) di Foley e Driscoll 2016 non sono state lette: la pagina è stata letta solo fino a ~100 000 caratteri.

---

## 2. Tettonica a placche procedurale ma fisica (Tectonics.js, PlaTec, Cortial e altri 2019, ricostruzioni alla GPlates): come ottenere orogeni, rift, archi, catene di punti caldi e la distribuzione delle età dalla legge del moto, senza disegni?

### Takeaway
- Le placche vanno fatte **rigide su una sfera**:
  - vettori di Eulero per placca, ricavati dal campo del mantello (Tectonics.js) o da un equilibrio dei momenti (spinta della dorsale, tiro della lastra, attrito basale);
  - non un campo di velocità di modulo costante su una carta piana.
- Da lì escono da sole, ciascuna con una legge compatta:
  - orogeni: ispessimento isocoro + isostasia;
  - rift: β di McKenzie, già nel codice;
  - archi: distanza dalla fossa fissata da profondità e inclinazione della lastra;
  - catene di punti caldi: pennacchi fissi nel mantello e moto della placca;
  - distribuzione delle età: produzione alle dorsali contro subduzione.
- Il codice ha già quasi tutta la fisica di colonna (McKenzie, spinta della dorsale 2,6·10¹² N/m). Gli manca la geometria: rotazioni, trasformi, larghezza dei rift oltre una cella.

### Cited Findings

**(a) Fissato a mano o non emergente [codice]**

- Mantello come equazione di forma: `tettonica.js:212-236`.
- La velocità della crosta ha lo stesso modulo ovunque e si spegne ai bordi con una soglia `d2 = 0,06·⟨|∇u|²⟩` (`tettonica.js:272`).
- Convergenza e apertura sono rampe a mano `(stringe − 0,15)/0,6` (`tettonica.js:277-278`).
- «Niente faglie trasformi né rotazioni»; carta piana con i poli come muri (`tettonica.js:73-75`).
- Rigidità e coesione libere: `rigida 0,12`, `coesione 0,5` (`tettonica.js:91-92`).
- «Un rift è largo una cella (150 km)» (`tettonica.js:49-50`).
- Lo spessore che uno scontro regge, `hMassimo 70 km`, è il Tibet (`tettonica.js:84`); la piega della fossa, `fossa 2500 m`, è un numero fisso (`tettonica.js:86`).
- La quantità di crosta continentale è la curva della Terra: `crostaAttesa`, «È UNA TARATURA SULLA TERRA» (`tettonica.js:530-542`).
- I vulcani sono gaussiane di 2500 m su 3 celle (`geologia.js:110`), sulle cime del campo del mantello o «dove capita».
- Il costo: «una storia intera … 2 s» (`tettonica.js:54-55`).

**(b) Le leggi che sostituiscono**

- *Segmentazione in placche (Tectonics.js v2)* [V-prec] — [post](https://davidson16807.github.io/tectonics.js/2017/09/16/version2.html):
  - similarità del coseno del campo di velocità angolare;
  - riempimento dal vettore più grande non classificato;
  - trasporto della crosta con la rotazione rigida.
  - Il blog dice che solo dalla versione 2.0 il programma usa «lo stesso quadro matematico» dei geofisici [S] — [blog](https://davidson16807.github.io/tectonics.js/blog).
  - **Licenza incoerente** [S]: una pagina dice CC BY-NC 2.0, la FAQ CC BY 4.0; il file LICENSE non è stato raggiunto. Non copiare codice.
- *Cortial, Peytavie, Galin e Guérin 2019* [S, scheda] — [Eurographics](https://diglib.eg.org/handle/10.1111/cgf13614), CGF 38(2):1–11, [DOI 10.1111/cgf.13614](https://doi.org/10.1111/cgf.13614):
  - metodo **procedurale, non fisico**, che approssima subduzione e collisione e produce continenti, dorsali, grandi catene e archi insulari;
  - il pianeta è poi «amplificato» con rilievo procedurale o con dati reali;
  - l'utente può innescare spaccature.
  - Il PDF (HAL) era bloccato da un sistema anti-robot: **le formule restano [R]**, dal rapporto «Simulatori»: `v(p) = ω·(w × p)`; sollevamento da subduzione ∝ velocità relativa × quota normalizzata²; sutura con profilo `(1 − (x/r)²)²`; spaccature di Poisson.
- *Cordonnier, Cani, Benes, Braun e Galin 2018* [V, testo letto] — [PDF](https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18TVCG.pdf), IEEE TVCG 24(5):1756:
  - deformazione **isocora**: lo spessore è proporzionale al materiale q della cella, e `dq/dt = (q − q₀)/Δt`;
  - sollevamento `u₀ = a·dq/dt` dal lato che si deforma, 0 sul lato stabile oltre una faglia che è un'isolinea di q;
  - `a` è tarato perché il sollevamento medio sia 5·10⁻⁴ m/anno: **un numero a mano**;
  - gli autori dichiarano di trascurare l'isostasia e l'inclinazione delle faglie;
  - pieghe con lunghezza d'onda `λ_k ∝ (t_k·t_{k−1})^{1/2}·(μ_k/μ_{k−1})^{1/6}` (eq. 3), che dipende da spessore e competenza degli strati.
- *PlaTec (Viitanen 2012)* [S] — [SourceForge](https://sourceforge.net/projects/platec/), [fork Mindwerks](https://github.com/Mindwerks/plate-tectonics):
  - parte da una carta frattale piana, la spezza in placche, le muove; il fondale «subduce» all'incontro;
  - 70–140 s per 512² su Pentium 4 (forum, non verificato) [S] — [gamedev.net](https://www.gamedev.net/forums/topic/623145-terrain-generation-with-plate-tectonics/);
  - **licenza in conflitto**: LGPLv2 sul progetto originale [S] contro LGPL-3.0 sul fork Mindwerks [V-prec, rapporto «Simulatori»].
- *Distribuzione area–età del fondale* (Coltice, Rolf, Tackley e Labrosse 2012) [S, riassunto] — [HAL](https://hal-insu.archives-ouvertes.fr/insu-00696224), Science 336:335:
  - la subduzione colpisce litosfera di ogni età, contro la teoria che la vorrebbe solo oltre un'età critica;
  - **comportamento a placche e continenti bastano** a rendere la distribuzione simile a quella di oggi, che varia nel tempo con la nascita e la morte dei bordi.
  - Coltice e altri 2013 descrivono la distribuzione di oggi come «una diminuzione lineare dell'area con l'età» [S] — [PDF](https://earthbyte.org/Newsletter/Issue2/Coltice_etal_2013_Covergence.pdf).
- *Ciclicità dei supercontinenti* [S, V-prec] — [GRL](https://zendy.io/title/10.1002/2014gl059595): nei modelli sferici di Rolf, Coltice e Tackley 2014 è solo statistica.
- *Equilibrio dei momenti* (Forsyth e Uyeda 1975) [R] — [DOI 10.1111/j.1365-246X.1975.tb00631.x](https://doi.org/10.1111/j.1365-246X.1975.tb00631.x): la velocità delle placche è dominata dal tiro della lastra e dalla resistenza della fossa; le placche con molta fossa attaccata vanno più veloci.
- *Bordi diffusi* (Gordon 1998) [R] — [DOI 10.1146/annurev.earth.26.1.615](https://doi.org/10.1146/annurev.earth.26.1.615): una parte non piccola della superficie terrestre sta in bordi diffusi, non rigidi.
- *Flusso dei pennacchi* (Sleep 1990) [R] — [DOI 10.1029/JB095iB05p06715](https://doi.org/10.1029/JB095iB05p06715): il flusso di galleggiamento dei punti caldi misura il calore che sale dal fondo del mantello, una frazione minore del calore totale.
- *Codici di ricerca* [V-prec]: GPlates, gospl, Badlands, ASPECT, CitcomS sono tutti GPL. Fastscapelib è **GPL-3.0** [V, file LICENSE] — [LICENSE](https://raw.githubusercontent.com/fastscape-lem/fastscapelib/main/LICENSE). Gli algoritmi si possono riscrivere, il codice non si copia.

**(c) Come calcolarlo a poco prezzo**

- [D] Griglia quasi uniforme sulla sfera: icosfera o punti di Fibonacci con 10 000–40 000 celle (V-prec, rapporto «Simulatori»).
  - N_p ≤ ~20 placche, ciascuna con un vettore ω.
  - Trasporto semi-lagrangiano: per ogni cella si ruota all'indietro con `R(−ω_p·Δt)` e si legge il campo. È O(N) per passo e senza diffusione numerica dei bordi.
  - 4,5 miliardi di anni a passi di 5 milioni sono 900 passi; su 40 000 celle fanno ~3,6·10⁷ aggiornamenti di cella, dell'ordine di 0,1–1 s in JavaScript: **stima, non misurata**.
- [D] Errore noto: le placche rigide trascurano la deformazione dentro le placche e i bordi diffusi (Gordon 1998 [R]). Si può recuperare a metà marcando i bordi a deformazione distribuita, con larghezza ~ spessore elastico × fattore.

**(d) Dal genitore al figlio e ritorno, con le leggi del moto**

- [D] **Dorsali e trasformi.** Il bordo divergente è dove `(v_a − v_b)·n > 0`; è trasforme dove la componente relativa è tangente, quindi un bordo è segmentato da sé, secondo il suo orientamento rispetto al polo di Eulero relativo. L'età del fondale nasce a 0 sul bordo e viaggia con la placca.
- [D] **Subduzione.** Affonda la placca più densa: la densità colonnare con l'età, `Δρ ∝ ρ_m·α·ΔT·√(κt)/h`, sta già in `litosfera()`. A parità di densità affonda l'oceanica sotto la continentale.
  - Il tiro della lastra `F_sp ≈ Δρ_slab·g·h_slab·L_slab` entra nel momento della placca.
  - L'arco cade a distanza `d_arc ≈ z_fuso/tan(δ)` dalla fossa, con `z_fuso ≈ 100 km` la profondità a cui la lastra disidrata [R]. Non è un numero: dipende dall'inclinazione δ, che dipende dall'età della lastra.
  - Il fuso degli archi è la «crosta nuova» che oggi è `crostaAttesa`.
- [D] **Orogeni.** `∂h/∂t = −∇·(h·v) − h·∇·v` al bordo convergente (isocoro, come Cordonnier) con isostasia (già in `litosfera()`).
  - Il tetto non è 70 km fissi: è lo spessore a cui la crosta inferiore supera Tfuso e scorre (già in `cede`).
  - Cowan e Abbot 2014 danno `d_g^max = 70 km·(g/g⊕)^{−1}` (eq. 6) [V] — [arXiv:1401.0720](https://ar5iv.labs.arxiv.org/html/1401.0720): la stessa idea (resistenza contro peso) in forma chiusa, che sostituisce `hMassimo`.
- [D] **Catene di punti caldi.** I pennacchi sono i massimi del campo del mantello profondo, fissi nel riferimento del mantello. Ogni passo deposita un volume `Q_plume·Δt` di lava sulla placca che passa sopra.
  - La catena e la sua progressione d'età escono dal moto: età lungo la catena = distanza / |v_placca|.
  - Il volume totale dei pennacchi viene dal flusso al confine nucleo–mantello di `storia` (Q_cmb, Sleep 1990 [R]). Il numero di vulcani di `storia` («uno ogni 0,02 W/m²», `geologia.js:19-22` [codice]) diventa superfluo.
- [D] **Chiusura del fuso.** `Ṁ_storia(t) = Ṁ_dorsali + Ṁ_archi + Ṁ_pennacchi`:
  - `Ṁ_dorsali = 2·Σ(v_⊥·L_dorsale)·h_crosta·ρ`, con h_crosta dalla fusione per decompressione;
  - `Ṁ_pennacchi ∝ Q_cmb`;
  - il resto va agli archi.
  - Se i conti non tornano si vede subito l'errore del 2× di `storia.js:117-118`.
- [D] **Ritorno al genitore:**
  - lunghezza delle fosse → rigassamento dell'acqua (§3);
  - area continentale → coperta n₃ e radioattivi n₄ (§1);
  - età media del fondale → flusso medio, che chiude il calore.

### Inferences
- [D] La crosta di `tettonica.js` come «campo conservato trasportato» è giusta e va tenuta: il volume continentale si conserva esattamente (`tettonica.js:333-335` [codice]). Va cambiato **chi la trasporta**: un ω per placca invece di `−∇u` di modulo costante. Le zattere rigide, la coesione e le loro due costanti libere diventano inutili, perché la rigidità è il moto stesso.
- [D] La distribuzione delle età è il test più semplice per dire se la cinematica è fisica.
  - Con produzione costante e subduzione indipendente dall'età si ottiene l'andamento «triangolare»: area che cala linearmente con l'età.
  - Se la subduzione colpisce solo l'oceano vecchio si ottiene una distribuzione piatta e tagliata.
  - Coltice e altri 2012 dicono che la Terra è nel primo caso [S]. Il test va aggiunto a `test_tettonica`.
- [D] Gli archi danno direttamente due strutture oggi assenti tra 100 e 500 km: il **bacino di retroarco** (estensione dietro l'arco, quando la fossa arretra) e il **prisma di accrezione** (sedimento raschiato).

### Gaps
- Il testo intero di Cortial 2019 non è stato letto (HAL e Wiley bloccati): le sue formule restano ricordate.
- La licenza vera di Tectonics.js resta incerta: il file LICENSE non è stato raggiunto (404 su `master`; l'accesso a GitHub dalle API non era abilitato).
- La tesi di PlaTec non è stata letta.
- Non c'è una legge verificata qui per l'inclinazione della lastra in funzione dell'età e della velocità: è ricordata come relazione qualitativa.

---

## 3. Isostasia e curva ipsometrica dai tipi di crosta e dal volume d'acqua (la frazione di terre come esito); il livello del mare tamponato dal ciclo dell'acqua nel mantello (Cowan e Abbot 2014)

### Takeaway
L'ipsometria non va disegnata: è la convoluzione di due distribuzioni che la tettonica già produce, lo spessore continentale (con il suo stato termico) e l'età del fondale, passate per l'isostasia.
- Il livello del mare viene dal volume d'acqua **di quel tempo**, non di oggi.
- Quel volume è tamponato dal mantello: degassamento e idratazione rispondono in verso opposto alla pressione sul fondo, che va come g.
- Le terre emerse diventano un esito con due rami possibili: Höning e Spohn mostrano una biforcazione tra pianeta-continente e pianeta-oceano.

### Cited Findings

**(a) Fissato a mano o non emergente [codice]**

- La colonna è già fisica: McKenzie via Angevine, con lo spessore neutro ricavato (`tettonica.js:106-166`).
- Resta empirica la profondità con l'età, `2500 + 350·√t`, fino a 6000 m (`tettonica.js:85`, `:169`).
- Il codice misura [codice, `tettonica.js:44-49`]:
  - terre emerse 24% (20% dopo l'erosione) contro il 29% vero;
  - la legge «sparge gli abissi su 3500 m invece di raccoglierli attorno a 4500».
- L'acqua del mare è «quella di oggi, per tutta la storia» (`tettonica.js:623`, commento di `livelloMare`); `geologia.js:111-125` riempie i punti bassi con `acquaKg` di oggi.
- Non esiste un ciclo dell'acqua tra mantello e mare: `storia.js` stadio 4 «FATTO SOLO IN PARTE» (`storia.js:73-80`).

**(b) Le leggi che sostituiscono**

- *Cowan e Abbot 2014* [V, sezione delle equazioni letta] — [arXiv:1401.0720](https://ar5iv.labs.arxiv.org/html/1401.0720), ApJ 781:27:
  - bilancio dell'acqua nel mantello, eq. 1: `x′ = (A_b/M_m)·(w↓ − w↑)`;
  - rigassamento: `w↓ = x_h·ρ_b·d_h(P)·χ`, con `d_h(P) = min[d_h⊕·(P/P⊕)^σ, d_b]`;
  - degassamento: `w↑ = x·ρ_m·d_melt·f_d(P)`, con `f_d = min[f_d⊕·(P/P⊕)^{−μ}, 1]`;
  - profondità del mare: `d_w = (W − x·M_m)/(A_b·ρ_w)`; pressione sul fondo: `P/P⊕ = g̃²·(ω − x·f_m)/(ω_o·f̃_b)`;
  - stato stazionario: `x/x⊕ = (P/P⊕)^φ`, φ = μ + σ;
  - isostasia: `d_o(ρ_m − ρ_w) + d_b(ρ_m − ρ_b) = d_g(ρ_m − ρ_g)`;
  - bacino più profondo possibile: `d_o^max ≈ 11,4 km·(g/g⊕)^{−1}`; continente più spesso: `d_g^max = 70 km·(g/g⊕)^{−1}`.
  - Parametri nominali (tab. 1):

    | parametro | valore |
    |---|---|
    | ω⊕ | 6,2·10⁻⁴ |
    | x⊕ | 5,8·10⁻⁴ |
    | ω_o | 2,3·10⁻⁴ |
    | x_max | 7·10⁻³ |
    | d_b | 6 km |
    | d_melt | 60 km |
    | d_h⊕ | 3 km |
    | x_h | 0,05 |
    | χ | 0,23 |
    | f_d⊕ | 0,9 |
    | P⊕ | 4·10⁷ Pa |
    | μ = σ | 1 |

  - Esito: un pianeta tettonicamente attivo di qualunque massa tiene continenti esposti se la frazione d'acqua è sotto ~0,2% in massa; per 10 M⊕ sotto ~2·10⁻³.
  - Senza ciclo profondo il limite sarebbe `ω = ω_o·g̃^{−2}`.
  - La massima incertezza è l'acqua di oggi nel mantello terrestre.
  - Il modello assume la cima dei continenti al livello del mare (freeboard nullo) e f_b = 0,9.
- *Höning e Spohn 2023* [V, eq. 1–3 e tab. 1 lette] — [PDF](https://publications.pik-potsdam.de/pubman/item/item_29057_2/component/file_29072/29057oa.pdf), Astrobiology 23(4):372:
  - crescita dei continenti, eq. 1: `Ȧ* = [n₁·A* + (1 − n₁)·v_p*·L*_oo,oc]·f_r − [n₂·A* + (1 − n₂)·L*_oc]`;
  - acqua nel mantello, eq. 2: `ẇ* = [n₁·A* + (1 − n₁)·v_p*·L*_oo,oc]·f_r − w*·v_p*`;
  - calore: eq. 3 (§1);
  - n₁ e n₂ pesano la retroazione positiva e negativa; f_r è il rapporto tra perdite e guadagni oggi;
  - la velocità delle placche dipende da T e da w: l'acqua abbassa la viscosità.
  - A seconda di n₁, n₂ il sistema ha uno o tre punti fissi; con tre, due stabili (pianeta-continente e pianeta-oceano) e uno condizionatamente stabile (la Terra).
  - La Terra di oggi: ~40% della superficie è crosta continentale, l'87% della quale emersa.
- *Ipsometria dei fondali* [V] — [Smith e Marks 2004](https://tos.org/oceanography/assets/docs/17-1_goff.pdf): fosse, dorsali, zone di frattura, abyssal hills sono le strutture principali; la topografia del fondale domina il geoide sotto «qualche centinaio di km».
- *Profondità con l'età* (Turcotte e Schubert) [R] — [Cambridge](https://www.cambridge.org/core/books/geodynamics/):
  - semispazio: `w(t) = w_r + 2ρ_m·α·ΔT/(ρ_m − ρ_w)·√(κt/π)`;
  - con i numeri terrestri dà ~350 m/√Ma (V-prec, «Come farlo emergere» §3).
- *Modello a placca GDH1* (Stein e Stein 1992) [R] — [DOI 10.1038/359123a0](https://doi.org/10.1038/359123a0): `d ≈ 2600 + 365·√t` per t < 20 Ma, poi esponenziale verso ~5650 m. L'appiattimento oltre ~70–80 Ma è ciò che «raccoglie» gli abissi.

**(c) Come calcolarlo a poco prezzo**

- Le due equazioni di Cowan e Abbot (o le tre di Höning e Spohn) si aggiungono a `storia.js` come stati in più: microsecondi.
- L'ipsometria è un istogramma pesato per area della carta: già calcolato per trovare il livello del mare (`geologia.js:111-125`, `tettonica.js` `livelloMare`).
- Errore noto [V, Cowan e Abbot]: gli esponenti μ e σ sono nominali (1, 1) e l'acqua del mantello di oggi è la prima incertezza. Si espone come ramo.

**(d) Dal genitore al figlio e ritorno**

- [D] Verso il basso: `elementi.js` (l'acqua totale del pianeta) → `storia` (W_mare(t), x(t) nel mantello) → `tettonica` (livello del mare a ogni passo dal W_mare di quel tempo) → `geologia` (mare di oggi = W_mare(età)).
- [D] Verso l'alto, `tettonica` dà:
  - la velocità e la lunghezza delle fosse per il rigassamento (Cowan e Abbot, eq. 2 × A_b × v; Höning e Spohn, `v_p·L`);
  - l'area dei bacini f_b, che è un esito.
- [D] Il volume di crosta continentale è il primo stato di Höning e Spohn (A) e sostituisce `crostaAttesa`: la crescita è il fuso degli archi (§2), l'erosione è ciò che i fiumi portano al mare e che la subduzione riporta giù.

### Inferences
- [D] **Il difetto degli abissi «sparsi su 3500 m» ha una spiegazione analitica.**
  - Con area che cala linearmente con l'età fino a t_max e d = d_r + c·√t, la densità delle profondità è `p(d) ∝ (d − d_r)·[1 − (d − d_r)²/(c²·t_max)]`.
  - Ha il massimo a `d − d_r = c·√(t_max/3)`, cioè ~2700 m sotto la dorsale per t_max = 180 Ma e c = 350, ed è larga.
  - Il picco stretto vero a ~4500–5000 m richiede l'appiattimento del modello a placca: la litosfera smette di raffreddarsi oltre ~70–80 Ma [R].
  - Nel codice c'è già il tetto `abisso 6000` [codice], ma è un taglio, non un appiattimento.
  - Rimedio: usare la colonna di `litosfera()` con lo spessore della placca a e la serie di McKenzie completa (non solo il primo termine) per il fondale, come per i continenti stirati.
- [D] **La frazione di terre come esito.** Con continenti a spessore neutro hN (già ricavato), erosione fino al livello di base e volume d'acqua W(t), la frazione emersa è determinata.
  - Il 24% contro 29% viene dalla quantità di crosta (curva terrestre) e dalla profondità dei bacini (legge empirica): i due pezzi da rendere emergenti.
- [D] Il freeboard nullo di Cowan e Abbot non serve a stateyour, che ha un'erosione vera. Serve la loro idea: d_o^max e d_g^max scalano come 1/g. I pianeti grandi hanno bacini meno profondi e montagne più basse, e si allagano prima a parità d'acqua.

### Gaps
- Le definizioni complete di b, L*_oo,oc(A) e i valori di q_m,E di Höning e Spohn stanno in appendici non lette.
- Stein e Stein 1992 e la forma esatta del modello a placca non sono stati riletti [R].
- Non è stata trovata una fonte che dia la curva ipsometrica terrestre in numeri (picchi a ~+100 m e ~−4500 m, media delle terre ~840 m): sono ricordati [R] e vanno presi da ETOPO prima dell'uso.

---

## 4. Tipi di roccia e distribuzione degli affioramenti dal contesto tettonico e dalla fusione (tabelle alla MELTS/pMELTS, mineralogia normativa); variazione di roccia e colore per pixel coerente tra le scale

### Takeaway
- Una roccia in un punto è la funzione di tre cose: protolito (dal contesto tettonico in cui è nata), percorso P–T–t (seppellimento, riscaldamento, esumazione) e grado di fusione.
- Le tre vengono dai campi che `tettonica` e `storia` hanno già o possono avere (età, spinta, fossa, arco, pennacchio, copertura, x). Serve solo una **tabella fuori linea** (MAGEMin, GPL-3: i risultati si possono usare) e una **norma CIPW** in linea.
- Per la coerenza tra scale ogni cella deve portare **frazioni di litologie** e una colonna stratigrafica, non una classe. Il colore del genitore è allora la media pesata per area dei figli (in riflettanza lineare), e gli affioramenti escono dall'intersezione della colonna (con giacitura e pieghe) con la topografia.

### Cited Findings

**(a) Fissato a mano o non emergente [codice]**

- Tre classi di litologia: 0 basamento, 1 vulcanica, 2 copertura (`geologia.js:618-619`).
- Quattro albedo: `{ basalto 0,08, granito 0,24, copertura 0,2, sabbia 0,32 }` (`tessere.worker.js:46`).
  - Le albedo sono misure con fonte (USGS splib07, ASTER) e la tinta viene dai minerali con Kubelka-Munk (`tessere.worker.js:27-41`): è buono.
  - Ma la classe è una sola per cella, e la figlia eredita la frazione della madre per interpolazione (`tessere.worker.js:129-137`).
- Frazioni di fusione fisse: `F_BASALTO = 0,1`, `F_GRANITO = 0,2` (`chimica.js:616-617`); coefficienti di ripartizione in blocco fissi (lherzolite a spinello).
- La crosta del pianeta in `elementi.js:456-466` [codice]:
  - il basalto ha lo spessore di `storia`;
  - il granito ha il volume di `crostaAttesa` (curva terrestre);
  - «il residuo torna nel mantello (… dichiarato)».
- Il metamorfismo è una soglia: «300 °C, dove comincia la facies degli scisti verdi (ricordato…)» (`tettonica.js:60-62`, `:93`); sotto `copMax` il sedimento è «basamento».
- Mancano:
  - andesiti d'arco, basalti alcalini di rift e di punto caldo, ofioliti, carbonati, evaporiti;
  - gradi metamorfici (scisti blu, eclogiti, granuliti);
  - giacitura e pieghe degli strati.

**(b) Le leggi che sostituiscono**

- *Fusione per decompressione* [V-prec, numeri da pyMelt (GPL-3, non copiare): katz.py; forma [R] da Katz, Spiegelman e Langmuir 2003] — [katz.py](https://raw.githubusercontent.com/simonwmatthews/pyMelt/master/pyMelt/lithologies/katz.py), [DOI 10.1029/2002GC000433](https://doi.org/10.1029/2002GC000433):
  - solidus secco `T_s = 1085,7 + 132,9·P − 5,1·P²` (°C, GPa);
  - `F = [(T − T_s)/(T_l^lherz − T_s)]^1,5`.
  - Il codice ha già il solidus di Katz e la produttività 1,5·10⁻¹⁰ Pa⁻¹ [codice, `storia.js:24-28`].
- [D] Una F per contesto invece di 0,1, usando la produttività: `F_media ≈ ½·(dφ/dP)·(P₀ − P_f)`.
  - P₀ è dove l'adiabatica a T_p(t) incontra il solidus; P_f è la base della litosfera.
  - Alla dorsale P_f ≈ 0, quindi F alta (MORB). Sotto un continente o un coperchio P_f è grande, quindi F piccola (basalti alcalini, punti caldi). Sopra una lastra il solidus è abbassato dall'acqua (fusione per flusso: archi).
- *La crosta di un coperchio fermo si assottiglia con la massa* [V] — [O'Rourke e Korenaga 2012](https://ar5iv.labs.arxiv.org/html/1210.3838): `h_c ∝ M^−0,284`.
- *Geoterma della crosta con calore interno* [V] — [ivi, eq. 38](https://ar5iv.labs.arxiv.org/html/1210.3838): `T(z) = T_s + (F_s/k)·z − (Q_c/2k)·z²`. Si usa per la temperatura massima di seppellimento, quindi per il grado metamorfico, invece della soglia a 300 °C.
- *Tabella delle fasi stabili* [V-prec] — [LICENSE MAGEMin](https://raw.githubusercontent.com/ComputationalThermodynamics/MAGEMin/main/LICENSE):
  - MAGEMin è GPL-3: il codice non si incorpora, i risultati sì;
  - tabella per 3–4 composizioni (basalto, crosta continentale, pelite, carbonato) su una griglia P–T, ~100 kB;
  - Perple_X ha licenza non trovata.
  - Scisti, gneiss, marmi, eclogiti ne escono come regioni della tabella, senza elenchi.
- *Norma CIPW* [R] — [Cross e altri 1902, DOI 10.1086/621030](https://doi.org/10.1086/621030): dagli ossidi (che `elementi.js` e `chimica.js` già calcolano) assegna in un ordine fisso quarzo, feldspati, pirosseni, olivina, ossidi. È deterministica, costa microsecondi e dà le proporzioni minerali per il colore Kubelka-Munk già in uso.
- *Pieghe* [V] — [Cordonnier e altri 2018, eq. 3](https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18TVCG.pdf): `λ_k ∝ (t_k·t_{k−1})^{1/2}·(μ_k/μ_{k−1})^{1/6}`. Con la stratigrafia gli autori «rendono gli strati piegati sulle pareti erose»: l'idea di intersecare la colonna con la topografia.
- *Grana dal tempo di raffreddamento* `t ≈ L²/κ` [R, V-prec «Come farlo emergere» §7]: `rocce.js` ha già nucleazione e crescita (curve di Tammann) [codice, `rocce.js:38-45`].

**(c) Come calcolarlo a poco prezzo**

- Tabella P–T × composizione: ~100 kB, letta con interpolazione bilineare (V-prec).
- Norma CIPW: decine di operazioni per composizione.
- Colonna stratigrafica per cella della carta 256×128, con ~8–16 strati ciascuno con spessore, litologia e età: ~32 000 × 16 × 8 byte ≈ 4 MB [D].
  - Si può comprimere tenendo solo gli strati che l'erosione può ancora esporre (fino alla profondità massima erodibile nella vita del pianeta).
- [D] Errore noto: la norma CIPW ignora l'acqua e la pressione (niente anfiboli, miche): è una mineralogia «secca» e di bassa pressione. Per le rocce metamorfiche serve la tabella.

**(d) Dal genitore al figlio e ritorno: chiudere la massa degli elementi**

- [D] Composizione della crosta: `C_crosta = Σ_contesti Ṁ_contesto·C_fuso(F_contesto)/Σ Ṁ`, invece di una F fissa. Per un pianeta con molte dorsali esce MORB; per uno a coperchio esce basalto alcalino ricco di K, U, Th.
- [D] Gli elementi incompatibili (K, U, Th) che vanno in crosta riducono il calore del mantello: il termine n₄ di Höning e Spohn (§1).
- [D] Chiusura: `Σ_celle(volume × C) = inventario di crosta di elementi.js`.
- [D] I volatili degli archi (CO₂, H₂O) tornano all'aria e al mare. I sedimenti carbonatici del mare (`mare.js`) diventano strati della colonna e, se subdotti, carbonio rigassato.

**(e) Coerenza del colore tra le scale**

- [D] Ogni cella porta un vettore di frazioni di litologia f_i (somma 1) e la colonna.
- Il colore di una cella grossa è `ρ̄ = Σ f_i·ρ_i` in riflettanza **lineare** (mescolanza per aree: lineare; mescolanza intima, cioè polveri e suolo: Kubelka-Munk).
- Il figlio sceglie le sue litologie con un'estrazione multinomiale condizionata a f_i, legata all'indirizzo, oppure meglio dall'intersezione della colonna con la sua quota. Così la media dei figli ridà la madre.
- È lo stesso principio di Panphasia (media dei figli = genitore) [V-prec, riassunto] — [arXiv:1306.5968](https://arxiv.org/abs/1306.5968).

### Inferences
- [D] **Gli affioramenti escono da quattro cose.** Ogni cella ha una colonna; l'erosione ha già un orologio e una profondità erosa per cella (`geologia.erosione` [codice]). La roccia che affiora in un punto è lo strato alla quota `z_sup(x) − z_rif`, corretta per giacitura e pieghe.
  - Con questo escono da soli: la «regola delle V» degli strati nelle valli, le fasce di affioramento parallele alle catene, i nuclei di basamento nelle cupole erose, le finestre tettoniche.
- [D] Per i mondi senza placche la colonna è più semplice (colate di lava sovrapposte con l'età, regolite d'impatto), ma resta lo stesso meccanismo.
- [D] Le ofioliti (fondale portato sui continenti) escono dove una sutura (§2) ha chiuso un oceano: si tiene un «resto di fondale» nella colonna della cella che lo riceve.

### Gaps
- La licenza di MELTS/pMELTS/alphaMELTS non è stata cercata: va verificata prima di generare tabelle con questi codici.
- Non è stata trovata una fonte su un uso pubblicato della norma CIPW nella generazione procedurale.
- Le soglie delle facies metamorfiche (scisti verdi 300–500 °C, anfiboliti 500–700, granuliti > 700; scisti blu ed eclogiti ad alta pressione e bassa temperatura) sono ricordate [R].

---

## 5. Rilievo multiscala: statistiche auto-affini condizionate dal genitore (rilievo spettrale coerente con la struttura delle placche, popolazioni di faglie a legge di potenza); la continuità dalla carta delle placche a 1000 km fino agli affioramenti di 1 km; che cosa mostrare tra 10 000 e 1 km di larghezza dello schermo

### Takeaway
- La topografia terrestre è auto-affine su moltissimi ordini di grandezza:
  - spettro ~k^{−2}, multifrattale con α = 1,79 e C₁ = 0,12;
  - **esponenti di Hurst diversi per contesto**: 0,46 nei fondali, 0,66 nei continenti, 0,77 sui margini.
- Stateyour usa un esponente plausibile (≈ 0,74, dal 0,36 per livello) ma con **un'ampiezza unica per tutto il pianeta**, che non sa se sta su una catena, un fondale o un cratone.
- La cura:
  - ogni livello di tessera possiede **solo la sua ottava**, a media nulla sulla cella madre;
  - l'ampiezza e l'anisotropia vengono dai campi del genitore (sollevamento, età, velocità di espansione, litologia, deformazione);
  - le strutture discrete (faglie, pieghe, vulcani, crateri, abyssal hills) sono processi di punti con leggi di potenza i cui totali chiudono il bilancio della deformazione di placca.

### Cited Findings

**(a) Fissato a mano o non emergente [codice]**

- Rilievo globale `alt = tt.alt + r·180 m`, con `r` = somma di 24 seni casuali (`geologia.js:64-68`): rumore sopra la tettonica, uguale ovunque.
- Tessere: `amp = 260·0,36^L`, due ottave di rumore di valore isotropo con frequenze `W·n/9` e `W·n/3,1` (`geologia.js:674-675`).
  - Inventario GE26: «il dettaglio sotto la mappa è rumore, non processo».
  - [D] 0,36 per un fattore 4 di scala equivale a H = −ln 0,36/ln 4 ≈ 0,74: un esponente vicino a quello dei margini continentali, ma con ampiezza (94 m al livello 1, ~37 km) uguale sulle catene e sugli abissi.
- Il rilievo fine sotto i 200 m entra solo come luce, non sposta i vertici (`pianeta.js:30-31`).
- Ottave del suolo fine da `suolo.js` (auto-affine) [codice, `pianeta.js:22-29`].
- I vulcani sono gaussiane di 2500 m (`geologia.js:110`).
- Il rift è largo una cella (`tettonica.js:49-50`).
- Il riscalamento conservativo (media dei figli = madre) è stato «PROVATO E NON TENUTO» (`geologia.js:654-655`).

**(b) Leggi e statistiche misurate**

- *Gagnon, Lovejoy e Schertzer 2006* [V, testo letto] — [NPG 13:541](https://npg.copernicus.org/articles/13/541/2006/npg-13-541-2006.pdf), licenza Creative Commons:
  - quattro modelli digitali del terreno, dal pianeta a 50 cm, più di 2·10⁸ pixel;
  - lo spettro segue k^{−β} con β ≈ 2; altri lo trovano tra 1,6 e 2,5;
  - scala isotropa per momenti ≤ 2 entro ±45% fino a ~40 m;
  - il modello multifrattale FIF regge con (α, C₁) = (1,79; 0,12); i monofrattali fBm e fLm non reggono;
  - nessuna variazione significativa di (α, C₁) tra continenti e oceani, ma **H = 0,46, 0,66 e 0,77** per fondali, continenti e margini continentali;
  - sinusoidi e faglie anisotrope con statistiche molto variabili possono far credere a rotture di scala che non ci sono.
- *Abyssal hills* (Smith e Marks 2004, su Goff e Jordan 1988) [V, testo letto] — [Oceanography 17(1)](https://tos.org/oceanography/assets/docs/17-1_goff.pdf):
  - modello di von Kármán (frattale a banda limitata) con altezza quadratica media H, scala caratteristica (2 volte il secondo momento della covarianza), larghezza e lunghezza, azimut e dimensione frattale D;
  - scala caratteristica ~2–5 km, D ≈ 2,2–2,3;
  - **altezze e larghezze calano con la velocità di espansione** e crescono quando la dorsale passa da un rilievo assiale a una valle;
  - lineamenti paralleli alla dorsale; le zone di frattura sono ortogonali alla dorsale al tempo dell'accrezione.
- *Faglie* (Bonnet e altri 2001) [S] — [Rev. Geophys. 39:347](https://www.research.ed.ac.uk/en/publications/scaling-of-fracture-systems-in-geological-media/):
  - leggi di potenza con limiti superiori e inferiori obbligatori;
  - gli esponenti di lunghezza, rigetto e apertura variano molto;
  - un uso acritico dà esponenti «inaccurati o privi di senso».
  - Un lavoro successivo trova una distribuzione cumulativa delle lunghezze con esponente vicino a 2 [S, citato nella stessa ricerca].
  - Rigetto ∝ lunghezza (D ≈ γ·L, γ ~ 10⁻² circa) [R, Cowie e Scholz 1992].
- *Pieghe* [V] — [Cordonnier 2018](https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18TVCG.pdf):
  - eq. 3 per la lunghezza d'onda;
  - esempi a due ordini di pieghe con λ = 10 e 5 km, o 15 e 3 km;
  - quando una piega cresce troppo la relazione con λ smette di valere.
- *Valli a spaziatura regolare* (Perron, Kirchner e Dietrich 2009) [S] — [Nature, DOI 10.1038/nature08174](https://www.doi.org/10.1038/NATURE08174):
  - la spaziatura delle valli è proporzionale a una lunghezza del modello, controllata da un numero di Péclet (incisione dei fiumi contro diffusione dei pendii);
  - a Pe grande le valli si ramificano.
  - La forma esatta di Pe non è stata letta.
- *Erosione implicita O(N)* (Braun e Willett 2013) [R] — [DOI 10.1016/j.geomorph.2012.10.008](https://doi.org/10.1016/j.geomorph.2012.10.008): la legge della potenza fluviale `∂h/∂t = U − K·A^m·S^n` risolta in O(N). In stato stazionario il rilievo va come `S = (U/K)^{1/n}·A^{−m/n}`, quindi l'ampiezza locale viene dal sollevamento del genitore.
  - Fastscapelib è GPL-3.0 [V].
- *Rumore a spettro controllato* (Gabor noise, Lagae e altri 2009) [R] — [DOI 10.1145/1531326.1531360](https://doi.org/10.1145/1531326.1531360): rumore procedurale per convoluzione sparsa con spettro e anisotropia controllati, valutabile nello shader.
- *Ottave coerenti per indirizzo* (Panphasia) [V-prec, riassunto] — [arXiv:1306.5968](https://arxiv.org/abs/1306.5968): rumore bianco su un octree a 50 livelli, coerente col genitore per costruzione.

**(c) Come calcolarlo a poco prezzo, con errore noto**

- [D] **Ottava posseduta.** Il livello L aggiunge solo frequenze in [k_L, 4·k_L], con k_L la frequenza della cella madre.
  - Coefficienti seminati dall'indirizzo della cella del livello L (non della tessera), quindi uguali da qualunque parte ci si arrivi; somma nulla sulla cella madre per costruzione (wavelet o banda che esclude k < k_L).
  - Ampiezza: `σ_L(x) = C(x)·(ℓ_L)^{H(x)}`, con C e H dai campi del genitore interpolati.
  - Il costo è una FFT 256² o una somma di Gabor per tessera, millisecondi in JS [stima].
  - L'errore spettrale atteso è quello del modello monofrattale contro il FIF (Gagnon: il fBm «non regge»). Per il multifrattale si moltiplica l'ampiezza per una cascata moltiplicativa con C₁ = 0,12 [D].
- [D] **Il compromesso processo contro statistica.**
  - Sulle terre con fiumi conviene risolvere la potenza fluviale sulla tessera (già fatto, 26 passi) con U e K veri. L'ottava statistica serve solo per ciò che l'erosione non fa: tettonica sotto griglia, litologia, faglie.
  - Sui fondali e sui mondi senz'acqua basta la statistica condizionata: abyssal hills, colate, crateri.
- [D] **Faglie come processo di punti.** Per ogni cella madre: numero di faglie N(>L) = N₀·(L/L_min)^{−a}, con a ≈ 2 come punto di partenza e limiti obbligatori.
  - N₀ dal bilancio: `Σ D_i·L_i ≈ ε̇·Δt·A_cella·w`, con ε̇ la deformazione del bordo di placca (spinta o apertura dal genitore). Le faglie consumano la deformazione che la placca chiede: niente faglie nei cratoni, molte nei bordi.
  - Orientamento da quello del tensore di deformazione (compressione → sovrascorrimenti ⟂ allo sforzo; estensione → faglie normali ⟂ all'allungamento; trasformi parallele al moto relativo).
  - Ogni faglia è un gradino (o una rampa) di rigetto D sul rilievo. Per evitare tagli: le faglie lunghe fino a L_max si generano dalle celle madri entro un margine L_max (lo stile del margine LayerProcGen, V-prec).

**(d) Dal genitore al figlio: quali campi passano**

- [D] Dalla carta di 150 km alle tessere passano:
  - un **contesto** (dorsale, fossa, arco, orogene, rift, cratone, piattaforma, fondale, punto caldo, coperchio);
  - il tensore di deformazione (ε̇, direzione);
  - il sollevamento U;
  - età e velocità di espansione (fondale);
  - la colonna (litologia, giacitura);
  - la copertura di sedimenti, che appiana e abbassa H.
- La madre ha già quasi tutti questi campi: `spinta`, `sollevamento`, `etaCrosta`, `fosse`, `arco`, `copertura`, `lava`, `velEst`, `velSud`, `stiramento` (`geologia.js:150-152` [codice]). Mancano il contesto esplicito, il tensore e la colonna.
- [D] Verso l'alto: la tessera restituisce il volume eroso e posato (già nella sua erosione), che il genitore somma nel bilancio dei sedimenti al mare.

**(e) Che cosa mostrare a ogni larghezza di schermo (10 000 → 1 km)**

- Oggi l'utente non vede niente tra ~1 e 500 km e vede superfici omogenee da vicino. La tabella dice quali strutture popolano quelle scale, da quale campo del genitore nascono e con quale legge.
- [D] Le larghezze tipiche sono [R] salvo dove è indicato [V].

| larghezza dello schermo | che cosa deve emergere | da dove viene (genitore → legge) |
|---|---|---|
| 10 000–3000 km | placche, continenti e bacini, sistemi di dorsali e fosse, supercontinenti; nei mondi a coperchio: province vulcaniche e rigonfiamenti | storia (regime) + tettonica (ω delle placche, crosta conservata) |
| 3000–1000 km | catene orogeniche (le Ande ~7000 × 300 km [R]), altopiani (Tibet ~1000 km [R]), cratoni e scudi, grandi province magmatiche, segmenti di dorsale sfalsati da trasformi, archi e fosse, catene di punti caldi | ispessimento isocoro + isostasia; segmentazione dei bordi dal polo relativo; pennacchi fissi + moto |
| 1000–300 km | singole catene e loro fronti; bacini d'avampaese (flessione); rift continentali (bracci larghi ~50–100 km [R]); bacini di retroarco; zone di frattura; piattaforme continentali; grandi bacini fluviali | flessione elastica `λ ~ 2π·(D/Δρg)^{1/4}` [R, Turcotte e Schubert]; β di McKenzie distribuito su più celle; erosione (FastScape) |
| 300–100 km | cinture a pieghe e sovrascorrimenti (λ ~ 10–50 km), batoliti (10–100 km), edifici vulcanici a scudo (Hawaii ~100 km [R]; Olympus Mons ~600 km [R]), crateri complessi e bacini d'impatto, canyon sottomarini, delta, campi di dune | pieghe (Cordonnier eq. 3 [V]); fuso dei pennacchi + altezza retta da g; impatti.js |
| 100–10 km | anticlinali e sinclinali singole; horst e graben (Basin and Range: spaziatura ~25–35 km [R], ~ spessore fragile); valli a spaziatura regolare (Perron [S]); **abyssal hills 2–5 km [V]**; monti sottomarini; caldere (1–20 km); conoidi; morene; crateri semplici | faglie a legge di potenza [S] con bilancio della deformazione; von Kármán condizionato dalla velocità di espansione [V]; potenza fluviale; popolazione di crateri |
| 10–1 km | formazioni e loro limiti di affioramento (regola delle V), pareti e cornici, faglie singole con rigetto, sciami di dicchi, fronti di colata (colate lunghe 1–10 km), coni di scorie, frane, linee di costa frattali | colonna stratigrafica ∩ topografia; esponente della legge di potenza; viscosità del fuso → lunghezza delle colate; automa di Sapoval per le coste [V-prec] |

### Inferences
- [D] Il «vuoto» 1–500 km nasce da due scelte. Il 24-seni da 180 m e il rumore da 94 m al primo livello sono sotto ciò che l'occhio percepisce sopra rilievi di chilometri; e non c'è nessuna struttura discreta tra la cella di 150 km e la valle di erosione. Le righe 300–1 km della tabella si possono generare tutte come processi di punti o ottave condizionate, senza simulazioni nuove.
- [D] La continuità senza «salti» si ottiene con tre regole:
  1. ogni livello aggiunge solo la sua ottava, a media nulla sulla cella madre;
  2. le ampiezze sono funzioni lisce dei campi del genitore interpolati (non costanti per livello);
  3. gli oggetti discreti (faglie, vulcani, crateri) appartengono alla cella in cui hanno il centro, a un livello fissato dalla loro taglia, e si disegnano in tutte le tessere che toccano.
  - La terza regola fa sì che una faglia di 40 km sia la stessa dal livello 1 al livello 6.
- [D] Il riscalamento conservativo «provato e non tenuto» (`geologia.js:654-655`) fallisce per un motivo preciso: la costa fissa (σ) e un vincolo di media non lineare. Con le ottave a media nulla il vincolo è soddisfatto in partenza e non serve riscalare.
  - La costa resta quella della madre se l'ampiezza dell'ottava va a zero dove la cella madre è tutta mare o tutta terra lontano dalla costa, e cresce solo nella fascia costiera. È ciò che `sulMare` già fa [codice].

### Gaps
- Gagnon e altri 2006 non dicono come variano C e H **dentro** i continenti (catene contro pianure): lo spettro locale per contesto non è stato trovato in una fonte verificata.
- L'esponente delle lunghezze delle faglie per contesto (estensione contro compressione) non è stato verificato. Bonnet 2001 (riassunto) avverte che varia molto.
- La forma di Pe di Perron 2009 e la relazione spaziatura–K–D non sono state lette.
- I valori assoluti dell'altezza quadratica media degli abyssal hills in funzione della velocità non sono stati estratti (solo la tendenza inversa).

---

## 6. Velocità: che cosa precalcolare per pianeta e che cosa calcolare solo per tessera, su richiesta

### Takeaway
- **Per pianeta, una volta** (decine o centinaia di ms):
  - storia termica con acqua e crosta (ODE);
  - storia delle placche su una sfera grossa (10⁴–4·10⁴ celle) con istantanee per epoca;
  - ipsometria e livello del mare;
  - campi di contesto (tensore di deformazione, sollevamento, età, colonna) sulla carta di ~150 km.
- **Per tessera, solo dove si guarda:**
  - l'ottava condizionata;
  - l'erosione implicita O(N) con U e K veri;
  - le faglie e gli altri oggetti come processi di punti dalle celle madri entro un margine;
  - gli affioramenti come intersezione della colonna con la quota.
- **Fuori linea, una volta per tutti:** le tabelle di fase (≤ 100 kB).

### Cited Findings
- *Costi di oggi* [codice]:
  - tettonica intera ~2 s (`tettonica.js:54-55`);
  - storia termica «qualche centinaio di righe in memoria» per pianeta (`storia.js:9`);
  - erosione della tessera 26 passi (Inventario GE27).
- *Il memo* [V-prec, rapporto «Simulatori»]: il memo di `cosmo.js` scarta la voce inserita per prima, non la meno usata. La prassi è scartare per uso meno recente.
- *Separazione tra strati* [V-prec] — [README LayerProcGen](https://raw.githubusercontent.com/runevision/LayerProcGen/main/README.md) (MPL-2.0): rigida separazione tra ingresso e uscita di ogni strato, così le operazioni a cavallo dei confini restano deterministiche.
- *Erosione O(N) implicita* [R] — [Braun e Willett 2013](https://doi.org/10.1016/j.geomorph.2012.10.008).
- *Rumore valutabile nello shader* [R] — [Lagae e altri 2009](https://doi.org/10.1145/1531326.1531360).
- *Due erosioni* [V-prec, Inventario TT7]: la tettonica ha un'erosione sua (`fiumi 130 Ma`, `erosione 800 m²/anno`) separata da `geologia.erosione`.

### Inferences
- [D] Bilancio dei tempi da puntare, per pianeta:
  - storia ≤ 5 ms;
  - placche su icosfera 4·10⁴ celle × 900 passi ≈ 0,3–1 s, comparabile o inferiore ai 2 s di oggi, perché sparisce la doppia griglia a passate alterne della rigidità;
  - istogrammi e livello del mare < 10 ms.
  - Il lavoro più costoso si può fare in un filo a parte, come già succede per le tessere.
- [D] Per tessera:
  - ottava ~2–5 ms;
  - erosione (già c'è) ~10–30 ms;
  - processi di punti < 1 ms (decine o centinaia di oggetti);
  - affioramenti O(N) < 2 ms.
  - Il rilievo fine nei vertici, scartato perché raddoppiava i ms per fotogramma (`pianeta.js:30-32`), si può tenere nella luce, purché la stessa ottava sia valutata nello shader con le stesse fasi (Gabor da indirizzo).
- [D] **Determinismo.** Ogni oggetto e ogni ottava si semina con l'indirizzo della cella del livello che lo possiede (la «sorgente» di `eventi.js` lo fa già per nome), mai con l'indice della tessera. Gli oggetti che sconfinano si generano dalle celle madri entro il margine della loro taglia massima.
- [D] **Precisione contro velocità.** L'errore delle leggi di scala (§1) e delle statistiche (§5) è dichiarabile in un numero per contesto (H, α, C₁, esponente delle faglie). Un test che misura gli spettri e le distribuzioni delle tessere generate contro i valori pubblicati (Gagnon; Smith e Marks; Coltice) è la verifica diretta della continuità tra scale, ed è economica.
- [D] **Ordine di lavoro consigliato** (dal più redditizio):
  1. `tettonica` legge `storia(t)`: q, ΔT, v, mob, acqua;
  2. contesto e tensore di deformazione esportati dalla tettonica;
  3. ottave possedute e condizionate al posto di `amp = 260·0,36^L` e dei 24 seni;
  4. faglie, abyssal hills e pieghe come processi di punti con bilancio;
  5. colonna stratigrafica e affioramenti;
  6. ciclo dell'acqua (Cowan e Abbot) e crescita dei continenti (Höning e Spohn) in `storia`;
  7. placche rigide su icosfera.

### Gaps
- Nessuno dei tempi per tessera e per pianeta proposti qui è stato misurato: sono stime d'ordine di grandezza da validare con i test del progetto.
- La memoria della colonna stratigrafica (~4 MB stimati) e la sua compressione non sono state provate.
