# Cosmologia e galassie: più emergenti, collegate, continue nello zoom, rapide e precise

Note del panel (cosmologo, modellista di formazione delle galassie, fisico del mezzo interstellare e della polvere, ingegnere di resa astronomica in tempo reale). Stato del codice letto il 21 novembre 2026.

**Marche.**
- **[C]** letto nel codice (file:riga).
- **[M]** misurato qui con uno script Node che importa i moduli del repo in sola lettura (`cosmo(1)`, 40 galassie; lo script sta nello scratchpad, non nel repo).
- **[V]** verificato sul testo della fonte (abstract o testo pieno).
- **[V2]** verificato solo su estratti, snippet o fonti secondarie che citano la fonte.
- **[R]** ricordato, da verificare.
- **[D]** dedotto o derivato qui.

**Che cosa NON si ripete**, perché è già nei rapporti precedenti:
- rovesciare la carta 2D e fare del campo 3D la fonte;
- Panphasia;
- Parkinson–Cole–Helly con G₀ = 0,57;
- le ricette SAGE (soglia SF, espulsione ∝ V_SN²/V_vir², reionizzazione);
- Moster 2013;
- Diffmah;
- Dutton–Macciò;
- Mo–Mao–White per R_d;
- Grackle e Sutherland–Dopita per Λ(T, Z);
- NuPyCEE;
- la profondità logaritmica di Outerra;
- il LOD per angolo solido di Gaia Sky e CDLOD;
- il generatore a contatore.

Qui si parte da ciò che il codice fa **oggi**, che nel frattempo è cambiato molto: c'è `campo_pigro.js`, cioè il campo senza bordo per ottave con i vincoli di Hoffman–Ribak sulle celle; c'è `aloniIn`, cioè i picchi con esclusione; ci sono `volume.worker.js` e `volumi.js`, cioè la galassia come volume attraversato dal raggio.

---

## 1. Campo iniziale → aloni → galassie: lo stesso posto visto da vicino e da lontano

### Takeaway
Il campo è già quello giusto: gaussiano, con spettro vero, pigro, vincolabile in modo esatto ([C] `campo_pigro.js:1–60`). Il difetto rimasto è di **identità**. Le 200 galassie della biblioteca nascono ancora dalla carta 2D (70 onde, soglia 0,9σ, 400 estrazioni a caso), mentre gli aloni dello zoom (`aloniIn`) nascono dal campo 3D e devono «girare attorno» alle sfere delle galassie della carta. Le storie degli aloni, cioè fusioni e accrescimento, vengono da una legge media con «compagni che non ci sono più», non dal campo del posto.

La via più economica e coerente in JS è un **peak-patch gerarchico locale** sul campo pigro: picchi con esclusione su una scala di filtri, già fatto per 6 masse. Da esso si leggono, senza estrazioni, anche la **storia di massa** (prima traversata della traiettoria δ_R(q) del proprio punto) e le **fusioni** (i candidati più piccoli esclusi dal più grande). Questo sostituisce Fakhouri con fantasmi e rende identici vicino e lontano per costruzione.

### Cited Findings

**(a) Che cosa è ancora messo a mano o non emergente**
- La carta delle galassie è invariata: 70 onde con `kx, ky` interi fino a ±9, ampiezza `k^−1,25·(0,5…1,5)`, soglia `media + 0,9σ` su 96², poi 400 punti a caso con probabilità `0,25·v` e `peso × 0,6`, tetto 150/200 — [C] `src/camera/cosmo.js:105–128`. Le voci CS1–CS3 dell'inventario restano aperte.
- `cosmo3d.js` impone al campo 3D, con Hoffman–Ribak sulle celle, l'altezza del picco della carta; z di ogni galassia è un evento uniforme. «Le galassie non sono obbligate a stare su un massimo esatto del campo». Le posizioni della carta valgono come posizioni di oggi, mentre `aloniIn` legge la materia spostata con Ψ: «le due letture differiscono di |Ψ| ≈ 13 Mpc» — [C] `src/camera/cosmo3d.js:7–12, 52–56`.
- `aloniIn` usa picchi con esclusione su sole 6 masse (`massaMinima·2^s`, s = 0…5) e scarta i candidati che toccano la sfera di una galassia della biblioteca («ci sono già») — [C] `src/camera/ragnatela.js:498–512, 533–535`. Due popolazioni con due leggi diverse si toccano in un confine.
- La storia dell'alone viene dal ritmo medio di Fakhouri et al. 2010 più fusioni estratte (`LEGGI.crescita`, `LEGGI.fusioni`) — [C] `src/camera/galassie.js:206–207, 445`. I satelliti sono «la stessa fisica, senza fusioni sue», in una cache di 600 voci — [C] `galassie.js:534–536`. È la voce GX5, ancora aperta.
- Lo spin è per metà varianza dalla marea vera e per metà un evento (`zForma`) — [C] `galassie.js:519–522`. È la voce GX6.
- La luce della ragnatela viene da Press–Schechter condizionata (`aloniAttesi`), valutata in 64 elementi e interpolata in δ — [C] `src/tre/volume.worker.js:101–117`. È corretta come nebbia, ma non è la stessa popolazione di `aloniIn` sopra `massaMinima` (vedi (d)).
- Costi misurati nel codice:
  - un punto del campo costa 0,05–0,07 ms a caldo e ~0,6 ms a freddo;
  - una griglia 64³ con trasformata costa ~4 s, contro il secondo di budget per la scena;
  - 24 vincoli costano 70 ms;
  - [C] `campo_pigro.js:52–60`.

**(b) Le leggi che sostituiscono**
- **Peak-patch** (Bond & Myers 1996): aloni come regioni lagrangiane che collassano in modo ellissoidale, individuate con filtri sferici di raggio decrescente ed esclusione gerarchica; poi spostamento con 2LPT. È il fondamento di WebSky, Stein, Alvarez & Bond 2019 — [R] [Bond & Myers 1996](https://ui.adsabs.harvard.edu/abs/1996ApJS..103....1B), [R] [Stein et al. 2019](https://arxiv.org/abs/1810.07727). `aloniIn` dichiara già di ispirarsi a Bond & Myers «nella forma più semplice» — [C] `ragnatela.js:501`.
- **PINOCCHIO** unisce teoria perturbativa lagrangiana, insiemi di escursione e collasso ellissoidale. Dà cataloghi di aloni con massa, posizione, velocità **e storia di fusione** dalle stesse condizioni iniziali, con statistiche degli alberi «accurate al 20%» tipico — [V2] [Monaco et al. 2002 (astro-ph/0109324)](https://ar5iv.arxiv.org/html/astro-ph/0109324), [V2] [pagina del progetto](https://adlibitum.oats.inaf.it/pierluigi.monaco/pinocchio.html). La v4 aggiunge il cono di luce in tempo continuo e LPT fino al terzo ordine — [V2] [Munari et al. 2017](https://adlibitum.oats.inaf.it/monaco/Papers/munari.2017.MNRAS.465.4658.pdf). La versione 2013 è parallela, testata fino a 2160³ particelle — [V2] [arXiv:1305.1505](https://ar5iv.labs.arxiv.org/html/1305.1505).
- **Storia di massa dal proprio campo** (insiemi di escursione), con la formula compatta:
  `M(t) = M(R*)`, dove R* è il raggio più grande per cui `δ_R(q) ≥ δ_c / D(t)`;
  `δ_R(q) = Σ_j δ_j(q) ⊗ W_R` è la traiettoria del punto lagrangiano q al crescere del filtro.
  È la definizione di prima traversata alla base di Press–Schechter estesa (Bond et al. 1991; Lacey & Cole 1993) — [R] [Bond et al. 1991](https://ui.adsabs.harvard.edu/abs/1991ApJ...379..440B), [R] [Lacey & Cole 1993](https://ui.adsabs.harvard.edu/abs/1993MNRAS.262..627L). Usata punto per punto è il cuore di PINOCCHIO — [V2, sopra].
- **Fusioni senza fantasmi**: nei picchi con esclusione, un candidato di massa M_s escluso da uno più grande M_s' entro R + R' è, nella lettura gerarchica, un progenitore che si è fuso nel più grande. Il tempo di fusione si ricava da quando la traiettoria del grande ingloba quel raggio, poi dall'attrito dinamico che il codice ha già (`LEGGI.attrito`, Boylan-Kolchin et al. 2008) — [D] sulla base di [C] `ragnatela.js:539–541` e `galassie.js:208`.
- **Spin dalle coppie mareali**: `L_i ∝ ε_ijk T_jl I_lk` è già calcolato in `cosmo3d.js` — [C] `cosmo3d.js:30–32`. La correlazione fra spin predetto e spin finale nelle simulazioni è solo parziale (Porciani, Dekel & Hoffman 2002) — [R] [arXiv:astro-ph/0105123](https://arxiv.org/abs/astro-ph/0105123). Un residuo casuale è quindi legittimo, ma va **condizionato**: `ln λ = ln λ_TTT + ε`, con σ_ε pari alla varianza che la correlazione non spiega, non metà della varianza totale come oggi — [D].

**(c) Come calcolarlo a buon mercato, con errore noto**
- Traiettoria δ_R(q):
  - campo_pigro dà δ filtrato in un punto a 0,05–0,6 ms — [C];
  - 16 raggi di filtro a passi di 2^(1/3) in massa danno ~1–10 ms per galassia;
  - per 200 galassie sono 0,2–2 s una volta sola, in memoria per indirizzo — [D].
  - L'errore dichiarabile è quello di PINOCCHIO sugli alberi, ~20% — [V2].
- Allargare `aloniIn` da 6 a ~15 masse (passo 2^0,5) costa circa 2,5 volte le trasformate di sfera di oggi (un fft3 per scala) — [D] da [C] `ragnatela.js:520–531`.
- Il limite `nn ≤ 150` nodi per lato resta: per le masse grandi si sale di livello del reticolo, perché le celle del campo sono già gerarchiche — [C] `ragnatela.js:516`.
- Le trasformate dei nuclei sono le stesse per ogni regione. Tenerle in cache è indicato nel codice stesso come passo successivo per scendere dai ~4 s di una griglia 64³ — [C] `campo_pigro.js:57–59`. Non lo si ripete come scoperta.
- Il collasso ellissoidale di Sheth, Mo & Tormen 2001 dà una soglia che dipende dalla forma del picco: `δ_ec ≈ δ_c [1 + 0,47 (5(e² ± p²) σ²/δ_c²)^0,615]`. Gli autovalori della marea sono già calcolati in ragnatela.js — [R] [Sheth, Mo & Tormen 2001](https://arxiv.org/abs/astro-ph/9907024).

**(d) Passaggio genitore ↔ figlio e chiusura dei bilanci**
- **Massa negli aloni.** Una regione R del genitore ha in aloni sopra M_min una massa attesa `M_coll(R) = ρ̄ V · F(>M_min | δ_R, σ_R)` (Press–Schechter condizionata, già in `aloniAttesi`) — [C] `ragnatela.js:480–496`.
  - Scendendo, gli aloni risolti da `aloniIn` sopra M_min **sono** quella massa; la nebbia sotto M_min resta quella condizionata.
  - Per chiudere esattamente, la luce della nebbia di una cella va calcolata come `L_tot(cella) − Σ L(aloni risolti nella cella)`, non come stima indipendente.
  - Oggi due stime indipendenti si sommano in `volume.worker.js`.
  - [D].
- **Identità.** Un alone è (livello del reticolo m, cella i, j, k, scala di massa s), con decisione che dipende solo da una finestra fissa del campo — [C] `ragnatela.js:507–510`. Da lontano lo stesso alone deve uscire dallo stesso test su un reticolo più grosso. Questo vale solo se la biblioteca usa la stessa regola: le galassie della carta vanno sostituite dai picchi più alti dello stesso algoritmo nel dominio del cosmo, cioè l'inversione già decisa nel rapporto precedente. Si toglie così l'eccezione «non tocca la sfera di una galassia della biblioteca».
- **Barioni e metalli verso il basso.** L'alone passa alla galassia:
  - M(t) dalla traiettoria;
  - j (spin) dalla marea;
  - f_b·M dal cosmo (`COSMO.Ob/Om`);
  - l'ambiente (δ su 8 Mpc) per la pressione d'ariete e lo strangolamento dei satelliti;
  - [D].
- **Barioni e metalli verso l'alto.** La galassia restituisce:
  - il gas espulso oltre R_vir (già in `bilancio.vento`) — [C] `galassie.js:800–804`;
  - i metalli espulsi (`metalliVento`);
  - la luce.

  Il mezzo intergalattico della cella genitrice deve sommare i venti delle galassie della cella: è un arricchimento emergente della ragnatela, oggi assente — [D].

**(e) Che cosa mostrare a ogni larghezza di schermo W**
- **W > 3 Gpc**: volume della ragnatela (rete) con il cono di luce e la nebbia; il fondo cosmico sulla sfera dell'ultima diffusione (già in ragnatela.js).
- **300 Mpc – 3 Gpc**:
  - livelli del campo fino a celle ≈ W/64;
  - aloni sopra un M_min(W) scelto perché ce ne siano ~10⁴ nel campo visivo: `N(>M_min | δ_vista) · V_vista = 10⁴`, che si inverte con la stessa funzione di massa condizionata — [D].
- **10–300 Mpc**: ammassi e gruppi come picchi; filamenti risolti; satelliti non ancora risolti.
- **0,3–10 Mpc**:
  - l'alone del gruppo con i suoi membri dall'albero, cioè i progenitori sopravvissuti con l'attrito dinamico;
  - il gas caldo come chiarore X tenue, se si vuole;
  - la regola è che nessun livello appaia vuoto perché la nebbia porta sempre il resto della luce.

### Inferences
- Il passo più redditizio non è un nuovo campo ma una **sola regola di identità** per tutti gli aloni (peak-patch gerarchico sul campo pigro), da cui leggere anche la storia. Toglie insieme tre voci dell'inventario: CS1–3 (la carta), GX5 (i compagni fantasma), GX6 (lo spin per metà sorteggiato) — [D].
- La traiettoria δ_R(q) è un'idea centrale per stateyour: è **deterministica per indirizzo**, costa millisecondi, e fa sì che un alone che si guarda «dentro» abbia una storia coerente con il campo che lo circonda, cosa che un albero di Parkinson estratto non garantisce — [D].

### Gaps
- Le soglie δ_ec del collasso ellissoidale, la calibrazione di PINOCCHIO e i costi di WebSky non sono stati letti sul testo: [R].
- La licenza di PINOCCHIO non è stata verificata. Il codice di peak-patch/WebSky è pubblico ma la licenza non è stata verificata.
- Non è stato misurato quanto la storia da prima traversata differisca, in media, dalla legge di Fakhouri usata oggi. È il test naturale: mediana di M(z)/M(0) su 200 aloni contro Fakhouri eq. 2.

---

## 2. Proprietà semi-analitiche dalla storia dell'alone: disco, sferoide, storia di formazione, gradienti, gas, polvere

### Takeaway
`galassie.js` è già un modello semi-analitico ad anelli più ricco di SAGE in alcuni punti:
- la legge di Leroy sulla pressione per l'H₂;
- il momento delle supernove di Kim & Ostriker;
- Hopkins 2009 nelle fusioni;
- i bilanci di massa e metalli chiusi.

Ma ha quattro difetti misurabili:
1. le metallicità sono troppo alte: Z = 2–6 Z☉ al centro di quasi tutte le galassie massicce del cosmo 1 [M];
2. lo sferoide nasce solo dalle fusioni: manca l'instabilità del disco, quindi mancano gli pseudo-sferoidi;
3. la polvere è una frazione fissa dei metalli (0,5);
4. il buco nero è letto da una relazione di scala invece che cresciuto.

Le equazioni compatte per correggerli esistono:
- Toomre per anello alla Dark Sage;
- l'equazione della polvere di Popping 2017 / L-Galaxies;
- la modalità quasar di Croton 2006.

### Cited Findings

**(a) Il codice**
- La polvere è `LEGGI.polvere = 0,5`: «la parte dei metalli del gas che sta nei grani» (Draine 2011) — [C] `galassie.js:236`. La densità di polvere è `gas·Z·Z☉·0,5` — [C] `galassie.js:945`.
- Il buco nero è `M_bn = max(germe, 0,49·10⁹ (M_sfer/10¹¹)^1,17 ·10^scarto)` (Kormendy & Ho 2013), con `germe = 10⁵` libero — [C] `galassie.js:224–225, 651`. `relativita.js:423` ha già `massaAutoregolata = f_g σ_T σ⁴/(π G² m_p)` (King), ma solo come riscontro nella tabella di stato — [C] `relativita.js:423, 794`.
- Il tipo si decide per soglie: ellittica se lo sferoide supera i 4/5 delle stelle; «maggiore» se il rapporto barionico supera 0,3; barra se `V/√(GM/R) < 1,1` — [C] `galassie.js:29, 210, 230, 772`. Il criterio di Efstathiou, Lake & Negroponte fa una barra ma non sposta massa nello sferoide.
- **Misura [M] su 40 galassie del cosmo 1:**
  - le ellittiche (M* ≈ 6–14·10¹⁰ M☉) hanno nel primo anello Σ_gas = 1,4·10⁸–5,4·10⁹ M☉/kpc² e Z = 2,5–6,1 Z☉;
  - una spirale tipica (id 14, M* = 7,9·10¹⁰ M☉) ha Z = 4,3 Z☉ al centro e 1,9 Z☉ a R_d.
- Riscontro osservativo: la relazione massa–metallicità satura a 12 + log(O/H) ≈ 9,0–9,1, cioè 1,5–2 Z☉ in O, alle masse di 10¹¹ — [R] [Tremonti et al. 2004](https://arxiv.org/abs/astro-ph/0405537). Valori di 4–6 Z☉ sono fuori di un fattore 2–3. È coerente con la nota dichiarata «gradiente di Z a metà» (GX15).

**(b) Leggi compatte**
- **Sferoide da instabilità del disco, per anello (Dark Sage).** I dischi sono divisi in anelli di **momento angolare specifico fisso**, «so that angular momentum is naturally conserved». In ogni anello si calcola il Q di Toomre a due componenti, gas e stelle con due serie di anelli. Se Q < 1, la massa instabile va agli anelli vicini conservando j, con uno scoppio di formazione stellare nell'anello — [V2] [Stevens, Croton & Mutch 2016, arXiv:1605.00647](https://ar5iv.arxiv.org/html/1605.00647), [V2] [Stevens et al. 2018, arXiv:1806.07402](https://arxiv.org/pdf/1806.07402). La massa che arriva all'anello più interno diventa uno pseudo-sferoide.
  - Il codice ha già gli anelli, κ e Q: `formaGalassia`, `galassie.js:752`; `cinematica`, `galassie.js:888–903` — [C].
  - Una versione 2024 di Dark Sage aggiunge la **struttura verticale del disco dal riscaldamento delle stelle** — [V2] [arXiv:2312.04137](https://arxiv.org/html/2312.04137v2). È rilevante per §3.
- Q a due componenti, nella forma di Wang & Silk: `1/Q = 1/Q_* + 1/Q_g`, con `Q_g = σ_g κ/(π G Σ_g)` e `Q_* = σ_* κ/(3,36 G Σ_*)` — [R] [Wang & Silk 1994](https://ui.adsabs.harvard.edu/abs/1994ApJ...427..759W). Il codice la usa: `Q = 1/(1/Qgas + 1/Qstelle)` — [C] `galassie.js:752`. Ma `Q_*` è imposto a 2 (`LEGGI.Qstelle`, parametro libero, `galassie.js:218`) e σ_R ne è dedotto (`cinematica:898`). Il verso va rovesciato: σ_* deve venire dal riscaldamento (età, `cinematica` ha già `eta[k]`), e Q_* ne esce — [D].
- **Polvere come equazione (Popping, Somerville & Galametz 2017; L-Galaxies, Vijayan et al. 2019).** Produzione da AGB e supernove, crescita per accrescimento nel gas denso, distruzione da supernove. Riproducono la relazione massa di polvere–massa stellare fino a z = 7 e il rapporto polvere/gas come **doppia legge di potenza in Z con rottura vicino a 0,1 Z☉** — [V2] [arXiv:1609.08622](https://arxiv.org/abs/1609.08622v1), [V2] [arXiv:1904.02196](https://ar5iv.labs.arxiv.org/html/1904.02196). La forma compatta usuale è [R]:
  `dM_d/dt = Σ_sorgenti y_d − (M_d/M_g)·SFR − M_d/τ_dist + (1 − M_d/M_Z)·M_d/τ_acc`, con:
  - `τ_dist = M_g/(ε·m_s·R_SN)`;
  - `τ_acc ∝ (Z/Z☉)⁻¹ (n/n₀)⁻¹`.

  Si integra per anello con gli stessi passi di 0,3 Ga di `evolvi`. Il rapporto D/Z che ne esce sostituisce `LEGGI.polvere`.
- **Buco nero cresciuto (Croton et al. 2006).**
  - Modalità quasar: `ΔM_BH = f_BH (m_sat/m_cen) M_cold / [1 + (280 km/s / V_vir)²]`, con f_BH ≈ 0,03.
  - Modalità radio: `ṁ = κ_R (M_BH/10⁸)(f_hot/0,1)(V_vir/200)³`, già in `LEGGI.radio` — [R] [Croton et al. 2006](https://arxiv.org/abs/astro-ph/0508046), [C] `galassie.js:226, 652`.

  La relazione di Kormendy & Ho diventa il **riscontro** invece della fonte. Il tetto fisico `M_σ = f_g σ_T σ⁴/(π G² m_p)` (King 2003, già in relativita.js) taglia la crescita quando il vento del buco spazza il gas — [R] [King 2003](https://arxiv.org/abs/astro-ph/0308342).
- **Dimensione dello sferoide dalle fusioni**: conservazione dell'energia di Cole et al. 2000, già fatta in `unisci` — [C] `galassie.js:211, 611`. Non è da cambiare.

**(c) Costo ed errore**
- Tutto è per anello e per passo: 20 anelli × 46 passi.
- L'equazione della polvere aggiunge 1 stato per anello, cioè 920 aggiornamenti per galassia: microsecondi.
- Il Toomre per anello aggiunge un ciclo di ridistribuzione per passo.
- L'errore di riferimento è lo scarto dei modelli semi-analitici sulle relazioni di scala, ~0,2–0,3 dex — [R]. I bersagli sono:
  - Moster per la massa stellare (già nel rapporto precedente);
  - Tremonti per Z;
  - Rémy-Ruyer 2014 per D/G(Z) — [R] [arXiv:1312.3442](https://arxiv.org/abs/1312.3442);
  - Kormendy & Ho per il buco nero.

**(d) Passaggi tra livelli**
- Verso il basso, alla stella e al disco protoplanetario, ogni anello e passo deve consegnare:
  - massa nata;
  - Z;
  - **D/Z**, perché la polvere del disco protoplanetario eredita il rapporto polvere/metalli locale (oggi `disco.js` usa κ = 0,1·Z: DS5);
  - α/Fe, quando ci saranno gli elementi (NuPyCEE, già proposto);
  - [D].
- Verso l'alto: la massa espulsa per anello (vento) e i metalli vanno all'alone caldo e oltre. Il codice chiude già il bilancio massa/metalli (`bilancio`, `galassie.js:800–804`) — [C].
- Manca il **bilancio d'energia**: E_SN·R_SN = riscaldamento del gas caldo + energia del vento + irraggiamento. Va aggiunto come terza colonna di `bilancio` — [D].

**(e) Che cosa mostrare**
- Da 30 kpc a 1 Mpc, la galassia come oggetto intero: il colore integrato emerge dalla storia di formazione per anello, i satelliti vengono dall'albero di §1.
- Lo pseudo-sferoide (n < 2) e lo sferoide classico (n ≈ 4) devono apparire come due componenti diverse: vedi §5.

### Inferences
- La metallicità troppo alta è la **causa a monte** di buona parte della polvere «a muro» (§3). La resa media di Bailin & Harris (`LEGGI.resa`) più gli scoppi delle fusioni concentrano metalli nell'anello centrale senza diluizione: Z cresce dove il gas viene consumato, ed è la cosiddetta «closed box» al centro. Un vento che dipende dal potenziale locale, e le fontane galattiche che rimescolano gli anelli, abbassano Z al centro — [D].
- Prima di toccare la resa grafica conviene rifare il controllo «massa–metallicità per anello», che costa poco e sposta tutto ciò che è visibile — [D].

### Gaps
- Le equazioni esatte di Dark Sage (2016 §3) e di Popping 2017 non sono state lette sul testo pieno: le forme sopra sono [R].
- La licenza MIT di Dark Sage è data dal rapporto precedente, non riverificata qui.
- Non è stato verificato perché Z centrale arrivi a 4–6 Z☉. Va fatta una misura su `e.Zt` per passo per isolare se il contributo è degli scoppi o della resa.

---

## 3. Struttura verticale di gas e polvere, trasferimento radiativo in tempo reale, e i quattro difetti visibili

### Takeaway
I quattro difetti — barra nera a pieno schermo, striscia sull'asse di taglio, centri opachi delle ellittiche, polvere come muro — hanno una parte **fisica** e una parte **numerica**.

La parte fisica è misurata [M]:
- nelle ellittiche il primo anello ha A_V di faccia di 20–1400 magnitudini, con uno strato di gas spesso 0–7 pc;
- nelle spirali il centro arriva a 10–600 mag e il disco a R_d a 1,2–2,5 mag, contro ~0,5–1 mag osservati;
- lungo il piano si arriva a 10³–10⁷ mag/kpc.

Ciò deriva da quattro cause:
1. Z troppo alta (§2);
2. D/Z fisso;
3. una formula di spessore del gas **con un esponente sbagliato**: `h_g = z₀(σ_g/σ_*)²` invece che lineare;
4. σ_g fisso a 10 km/s.

Si aggiungono due assenze: la diffusione e la grana (le nubi). La parte numerica sta nello shader:
- passi fissati a una scala `h = 0,03·zmax` che non è quella dello strato;
- un cambio brusco di schema di passo a |d_z| = 0,04, candidato principale della «barra»;
- il tetto in mezza precisione;
- la griglia cilindrica degenere sull'asse, candidata della «striscia».

La cura migliore e meno costosa è **integrare in forma chiusa** gli strati sech² lungo il raggio e lo sferoide come profilo analitico. Così non si campionano più strati sottili su una griglia.

### Cited Findings

**(a) Il codice, riga per riga**
- In `densitaGalassia` il gas ha mezza altezza fissa `hg = LEGGI.spessoreGas = 0,1 kpc` (gas vicino al Sole) — [C] `galassie.js:232, 943–944`. La polvere è `gas·Z·Z☉·0,5` — [C] `galassie.js:945`.
- `volume.worker.js` corregge lo spessore con `h_g = min(0,1 kpc, z₀·(σ_g/σ_z)²)`, citando lo «Spitzer 1942» isotermo — [C] `volume.worker.js:42–51`. Distribuisce la colonna come sech² mediata sulla cella (`tanh`) — [C] `volume.worker.js:53`. Questa parte è corretta e conserva la colonna.
- `σ_g = 10 km/s` è fisso (`LEGGI.sigmaGas`) — [C] `galassie.js:217`.
- La griglia è `nf = 160, nr = 96, nz = 48`, con `Rmax = 1,15 Rg` e `zmax = 0,8 Rg`. Le quote sono `z = zmax·s|s|`, quindi la prima cella sul piano è alta 0,8·(2/48)² Rg = 1,4·10⁻³ Rg, ~20 pc per Rg ≈ 15 kpc — [C] `volumi.js:147`, `volume.worker.js:36, 56`; [D] per i pc.
- Il tetto è `6·10⁴` A_V per Rg, per la mezza precisione: «comunque una parete» — [C] `volume.worker.js:69–71`.
- La media radiale 1-2-1 è applicata 3 volte anche al canale della polvere (`c < 4`) e salta `jr = 0` e `jr = nr − 1` — [C] `volume.worker.js:64`.
- La luce si taglia a zero verso il bordo del cilindro (`fz`, `fr`) — [C] `volume.worker.js:66`. Uno sferoide rotondo è dunque tagliato a ±0,8 Rg in quota e sfumato.
- **Shader**, [C] `volumi.js:61–72`:
  - schema «asinh» con passi uniformi in `asinh(z/h)` e `h = 0,03·zmax` fisso (0,024 Rg ≈ 360 pc), non lo spessore vero h_g (1–60 pc misurati);
  - schema «piano» (`f²`, fitto vicino all'ingresso) se `|d_z| < 0,04 || |u₁ − u₀| < 0,5`;
  - campione puntuale per passo con sfasamento casuale;
  - emissione–assorbimento esatta nel passo `(1 − e^−τ)/τ`;
  - estinzione Cardelli A_λ/A_V = 0,79/1/1,31;
  - nessuna diffusione.
- Il mezzo: «le nubi oscure tolgono luce a tutto ciò che è già disegnato… anche a ciò che starebbe davanti» — [C] `src/tre/mezzo.js:12–14`.
- Lo sferoide: `r3 = hypot(R, z)`; lo schiacciamento `q` divide solo la densità, non schiaccia la forma. Per q < 1 la massa dello sferoide disegnata cresce di 1/q e la forma resta rotonda — [C] `galassie.js:945`, `volume.worker.js:37`. È un bug.
- Lo schiacciamento è estratto dalla distribuzione **apparente** di Lambas et al. 1992 (`LEGGI.assi`) e usato come intrinseco — [C] `galassie.js:233, 807`.

**Misure [M]** con κ_V ≈ 2,8·10⁴ mag cm²/g di polvere, ricavato da A_V/N_H ≈ 5,3·10⁻²² mag cm² con D/G = 0,01 [R Draine]. L'ordine di grandezza vale anche se κ di `vuoto.js` differisce del ~30%.

| galassia (cosmo 1) | dove | Σ_gas (M☉/kpc²) | Z/Z☉ | A_V di faccia | z₀ stelle | h_g |
|---|---|---|---|---|---|---|
| id 14, spirale, M* 7,9e10 | centro | 7,9e7 | 4,3 | 14 mag | 203 pc | 1 pc |
| id 14 | R_d = 3,5 kpc | 1,8e7 | 1,9 | 1,5 mag | 415 pc | 30 pc |
| id 32, spirale | R_d | 1,7e7 | 1,7 | 1,2 mag | 170 pc | 58 pc |
| id 17, ellittica | centro | 5,4e9 | 6,1 | 1389 mag | 9 pc | 0 pc |
| id 13, ellittica | centro | 4,5e9 | 1,4 | 267 mag | 1 pc | 2 pc |
| id 26, ellittica | centro | 1,4e8 | 3,4 | 21 mag | 89 pc | 7 pc |

**(b) Leggi**
- **Spessore del gas con le stelle (Elmegreen 1989; Ostriker, McKee & Leroy 2010, eq. 14).**
  `P_tot ≈ (πG Σ_g²/2)·[1 + (σ_g Σ_*)/(σ_z,* Σ_g)]` — [V] [arXiv:1008.0410](https://ar5iv.labs.arxiv.org/html/1008.0410).
  - Il termine stellare è **lineare** in σ_g/σ_*.
  - Con `h_g = σ_g²/(πG Σ_eff)` e `Σ_eff = Σ_g + (σ_g/σ_*) Σ_*` si ottiene, dove le stelle dominano, `h_g = z₀·(σ_g/σ_*)`, con `z₀ = σ_*²/(πGΣ_*)` [D].
  - Il codice usa `(σ_g/σ_*)²` [C], quindi sottostima h_g del fattore σ_*/σ_g: ×3 a σ_* = 30 km/s, ×10 nei centri caldi.
  - Dove dominano stelle e materia oscura, OML10 dà `H_c ~ v_t/√(4πG ρ_sd)` — [V] (stessa fonte, §II.8). È la forma da usare nelle parti esterne: ρ_sd cala con R, quindi **la svasatura (flaring) emerge** senza parametri.
  - Le misure di svasatura nelle galassie vicine sono in Bacchini et al. 2019 — [R] [arXiv:1903.10527](https://arxiv.org/abs/1903.10527).
- **σ_g dal feedback.** Nei dischi regolati dalla formazione stellare la turbolenza cresce con Σ_SFR (Ostriker & Shetty 2011), da ~10 km/s nei dischi tranquilli a 30–50 nei centri in scoppio — [R] [arXiv:1102.1446](https://arxiv.org/abs/1102.1446). Il codice ha già il momento delle supernove di Kim & Ostriker (`LEGGI.momentoSN`). σ_g può uscire dall'equilibrio «immissione di momento = dissipazione turbolenta», `σ_g ≈ (p*/m*) Σ_SFR · t_diss / Σ_g`, con un pavimento termico di ~7 km/s — [D] dalla struttura di OML10/OS11.
- **Rapporti polvere/stelle osservati (dischi di taglio).** Lo strato di polvere ha mezza altezza ≈ 0,5 di quella delle stelle e scala radiale ≈ 1,4–1,5 volte — [V2] [Xilouris et al. 1999](https://arxiv.org/abs/astro-ph/9901158), citato da [De Looze et al./M51, arXiv:1409.3857](https://arxiv.org/pdf/1409.3857) e [arXiv:1711.07434](https://arxiv.org/pdf/1711.07434). Il rapporto cala con la massa di polvere e la velocità di rotazione (DustPedia) — [V2] (stesse fonti). Il codice oggi dà al centro h_g/z₀ ≈ 0,005–0,1 [M]: da 5 a 100 volte più sottile dell'osservato.
- **Ellittiche: gas freddo raro.** ATLAS³D rileva CO in 56 su 259 galassie di tipo primitivo (22 ± 3%), con M(H₂) = 10^7,1–10^9,3 M☉; le più ricche sono in ambienti poco densi — [V2] [Young et al. 2011, arXiv:1102.4633](https://arxiv.org/abs/1102.4633), [V2] [ATLAS³D XXVII, arXiv:1312.6318](https://arxiv.org/pdf/1312.6318). Nel codice tutte le ellittiche misurate hanno 10⁸–6·10⁹ M☉ di gas, tutto in uno strato da pochi pc e tutto «polveroso» [M]. Il gas caldo dell'alone distrugge i grani per sputtering in ~10⁶–10⁸ anni — [R] [Draine & Salpeter 1979](https://ui.adsabs.harvard.edu/abs/1979ApJ...231...77D).
- **Grana (nubi): profondità ottica efficace.** In un mezzo a due fasi la profondità ottica efficace, definita dalla trasmissione media su molte linee di vista, è minore di quella del mezzo omogeneo con la stessa polvere. Il modello dei «mega-grani» (Hobson & Padman; Városi & Dwek 1999) dà `τ_eff = τ_MG + τ_ic` — [V2] [arXiv:astro-ph/9905029](https://ar5iv.labs.arxiv.org/html/astro-ph/9905029), [V2] [arXiv:2004.12612](https://arxiv.org/pdf/2004.12612). Per la sovrapposizione delle nubi si usa `r_cl → r_cl(1 − f_cl)^γ` — [V2] [arXiv:astro-ph/0502067](https://arxiv.org/pdf/astro-ph/0502067). Una forma minima per lo shader [D]:
  - `τ_eff = τ_ic + N_cl·(1 − e^{−τ_cl})`;
  - N_cl è il numero medio di nubi sul cammino, `N_cl = f_c τ / τ_cl`;
  - f_c è la frazione di polvere nelle nubi, uguale a **f_mol** che il codice già calcola per anello dalla legge della pressione: `galassie.js:677`, `LEGGI.molecole`;
  - τ_cl viene dalla colonna di una nube molecolare tipica, Σ_GMC ≈ 50–100 M☉/pc² [R], cioè A_V ≈ 5–10 a Z☉, scalata con Z·D/Z.

  Per τ ≫ 1 la trasmissione non va più a zero esponenzialmente ma come `e^{−τ_ic}·e^{−N_cl}`, con N_cl finito: **niente più muro**.
- **Diffusione approssimata.** In V la polvere del modello della Via Lattea ha albedo ω ≈ 0,6 e asimmetria g ≈ 0,5–0,6 — [R] [Draine 2003](https://arxiv.org/abs/astro-ph/0304489). La luce diffusa riempie le corsie di polvere. In tempo reale ci sono due vie:
  1. la relazione di similitudine dei due flussi: `τ_eff ≈ τ·√((1−ω)(1−ωg))` per la luce che si propaga in modo diffusivo dentro lo strato — [R], valida solo come attenuazione media;
  2. la diffusione singola dalle sorgenti medie dell'anello, cioè un termine di emissione aggiunto `j_sca = ω·κρ·J̄(R, z)·Φ_HG`, con J̄ intensità media dell'anello precalcolata nel lavoratore — [D]. Il resto di `splat.js` ha già Henyey–Greenstein e diffusione singola per le nebulose — [C] `splat.js:20–25`.
- **Come fanno i professionisti.**
  - SKIRT (Monte Carlo 3D con diffusione) è usato per adattare i dischi di taglio. SKIRT 7 è AGPL-3 — [V2] [GitHub SKIRT7](https://github.com/SKIRT/SKIRT7). La licenza di SKIRT 9 non è verificata. Va usato **fuori linea**, per tabelle e riscontri.
  - Gaia Sky disegna la polvere delle galassie procedurali come particelle billboard con **miscela sottrattiva** e senza scrittura di profondità, cioè «dust lanes appear as dark bands», e i canali gas e polvere su un buffer a mezza risoluzione — [V] [documentazione Procedural galaxies](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/master/Procedural-galaxies.html). Dalla 3.7.x c'è anche un'infrastruttura di volumi che occulta i canali — [V2] [note 3.7.1](https://gaiasky.space/news/2026/gaiasky_3.7.1/).
  - SpaceEngine usa sprite: «a distribution of procedurally generated sprites which resembles the real shape of the dust band»; «sprites perfectly matches the dust texture when camera approaches the galaxy»; il raymarching è solo per le nebulose procedurali — [V] [blog SpaceEngine, 17/2/2019](https://spaceengine.org/news/blog190217/).

  Nessuno dei due integra un vero strato: evitano il muro perché la polvere è un'**immagine dipinta**, non una colonna fisica. stateyour vuole la colonna fisica, e quindi deve avere fisica giusta più integrazione esatta.

**(c) Calcolo a buon mercato con errore noto: integrazione chiusa degli strati**
- **Estinzione dello strato sech² lungo un tratto [D, esatto].** Su un tratto in cui R e φ cambiano poco:
  `ρ_d = (Σ_d/(2h)) sech²(z/h)`, con `z = z_a + d_z s`, quindi
  `τ_tratto = κ Σ_d /(2 |d_z|) · |tanh(z_b/h) − tanh(z_a/h)|`.
  - Per |d_z|·Δs < 10⁻³ h si usa `τ = κ ρ_d(z_a) Δs`.
  - L'emissione delle stelle del disco, sech²(z/z₀), ha la stessa forma chiusa.
  - Per il prodotto emissione × trasmissione si usa la forma `(1 − e^−τ)/τ` che lo shader ha già.
- Conseguenza: la griglia 3D del disco diventa **due trame 2D (R, φ)**:
  - Σ_*, Σ_d, h_g, z₀, giovani/vecchie;
  - con nf × nr = 160 × 96 × 8 canali, circa 120 k numeri invece di 2,9 M;
  - nessuna dipendenza da nz, niente tetto di mezza precisione (Σ_d sta bene in fp16), e i passi possono essere pochi e larghi in R, perché la struttura verticale è esatta.
  - L'errore è quello dell'ipotesi «R e φ costanti nel tratto»: per passi di ΔR ≤ 1 cella radiale è quello della trama stessa.
- **Sferoide analitico [D]** (vedi §5): per un profilo sferico ρ(r), l'integrale lungo una corda è `F(b, s) = ∫₀^s ρ(√(b² + s'²)) ds'`, tabulato in 2D (b, s) una volta per profilo (Sérsic n) su 64 × 64 punti. Il contributo del tratto è `F(b, s_b) − F(b, s_a)`. Lo schiacciamento si fa rimappando le coordinate (z → z/q) e scalando per 1/q: esatto per sferoidi omotetici. Toglie lo sferoide dalla griglia cilindrica, e con esso la singolarità sull'asse.
- **Grana e diffusione**: due moltiplicazioni per tratto; f_mol e τ_cl si leggono dalla trama 2D.
- **Tabelle d'attenuazione fuori linea**: le curve di attenuazione in funzione dell'inclinazione per dischi con sferoide calcolate con trasferimento radiativo (Tuffs et al. 2004; Popescu et al. 2011) danno il riscontro numerico per la luce integrata da lontano — [R] [Tuffs et al. 2004](https://arxiv.org/abs/astro-ph/0401077). Da lontano basta attenuare la luce integrata della galassia con quella tabella, senza raymarching.

**Diagnosi dei quattro difetti**
- **Polvere a muro.** È fisica, e le cause sono state misurate [M]:
  1. Z alta;
  2. D/Z = 0,5 fisso anche dove Popping darebbe molto meno;
  3. h_g troppo sottile per l'esponente 2 e per σ_g fisso;
  4. niente nubi, niente diffusione.

  Già (3) da solo moltiplica h_g per 3–10 nei dischi. A colonna fissa abbassa ρ_d nel piano, ma non cambia A_V di faccia. Per A_V di faccia contano (1), (2) e il gas dell'anello. Con Z ≈ 1–1,5 Z☉ e D/G alla Rémy-Ruyer, A_V a R_d scende a ~0,3–0,8 mag, cioè l'ordine osservato — [D].
- **Centri opachi delle ellittiche.**
  - Dopo una fusione maggiore «il gas di tutti gli anelli… precipita al centro» — [C] `galassie.js:607–611`. Quel gas resta poi tutto freddo e polveroso in uno strato da 0–7 pc con 20–1400 mag [M].
  - Nelle ellittiche vere il 78% non ha gas molecolare rilevato [V2]. Il gas caldo distrugge la polvere [R].
  - Cura fisica: il gas residuo di uno scoppio, sopra la soglia di raffreddamento dell'alone (il codice ha `tcool`, `galassie.js:647`), va nel gas caldo **senza polvere**. La polvere resta solo nel gas che si raffredda davvero, e con D/Z dall'equazione di §2.
  - Cura numerica: sferoide analitico (sopra), che toglie anche il taglio del cilindro a 0,8 Rg e le sfumature `fz/fr`.
- **Barra nera che attraversa la galassia a pieno schermo** (ipotesi da provare, in ordine di probabilità):
  1. **Il cambio di schema di passo a `|d_z| = 0,04`** (`volumi.js:62`). Le righe dello schermo i cui raggi sono entro ±2,3° dal piano usano passi `f²` fitti vicino all'ingresso e radi dove il raggio incrocia lo strato. Le righe accanto usano passi in asinh. Le due quadrature hanno distorsioni opposte sullo strato sottile, che è più sottile di un passo in entrambe. Ne nasce una fascia di righe con statistica diversa, che a pieno schermo diventa larga.

     Prova: portare la soglia da 0,04 a 0,01 e a 0,1. Se la barra si stringe o si allarga, è lei.
  2. **Scala di passo h = 0,024 Rg fissa** invece di h_g: lo strato da 1–60 pc sta in un passo solo, e in un fotogramma o lo si colpisce in pieno (τ di picco × ds intero) o lo si manca. L'accumulo media la trasmissione, ma `E[e^{−τ̂}] ≠ e^{−E[τ̂]}` (Jensen): a camera in moto la storia è corta e si vede rumore a righe.
  3. **Fisica**: visto quasi di taglio da vicino, lo strato con 10³–10⁷ mag/kpc nel piano [M] è una banda davvero nera, larga quanto la proiezione di 2h_g più il tratto in cui il raggio resta nello strato. A pieno schermo diventa una barra. Nelle galassie vere la banda c'è (NGC 891), ma è grigia e frastagliata per diffusione, nubi e stelle davanti.

  L'integrazione chiusa elimina (1) e (2); la fisica giusta di §2–3 corregge (3).
- **Striscia sull'asse visto di taglio** (ipotesi):
  - la griglia cilindrica è degenere per R → 0: il primo anello ha centro a R = 0,006 Rg (~90 pc), con 160 celle φ su un cerchio minuscolo; lo shader legge `atan(p.y, p.x)` (`volumi.js:67–68`) e i pixel vicini all'asse saltano tra celle φ con fasi dei bracci diverse;
  - in R la trama è CLAMP: per R < 0,006 Rg si legge il primo anello, cioè un cilindro di valore costante lungo z, che di taglio appare come una riga verticale;
  - la media radiale salta `jr = 0` (`volume.worker.js:64`);
  - la cuspide di Hernquist (ρ ∝ 1/r) non è risolta.

  Cure: sferoide analitico; per `jr = 0` la media su φ; disco come trame 2D con interpolazione in coordinate cartesiane vicino al centro — [D].

**(d) Passaggi tra livelli**
- La galassia consegna allo strato «mezzo» e ai sistemi stellari, per ogni (R, φ) e passo:
  - Σ_d, h_g, f_mol, σ_g, D/Z.
- La colonna di polvere fra l'occhio e una stella (già calcolata, `volume.trasparenza`, `universo.js:109`) deve diventare la stessa funzione chiusa, perché la stella del sistema e la luce diffusa vedano la stessa polvere.
- Le nubi di `vuoto.js` depositate nella griglia (`volume.worker.js:75–80`) vanno contate **dentro** f_mol, non sommate sopra: oggi la stessa polvere conta due volte, una nella colonna media e una nelle nubi — [D] da [C].

**(e) Che cosa mostrare**

| larghezza dello schermo | che cosa si mostra |
|---|---|
| W > 3 R_g | luce integrata della galassia attenuata con la tabella in funzione dell'inclinazione: nessun raymarching |
| 0,3–3 R_g | trame 2D più strati chiusi; polvere media più nubi statistiche; diffusione singola |
| 30 pc – 0,3 R_g | le nubi molecolari singole compaiono come oggetti (splat con estinzione), estratte dalla funzione di massa delle nubi, `dN/dM ∝ M^−1,6…−1,8` [R], con la massa totale = f_mol·Σ_g dell'anello: la polvere tolta dal fondo statistico è quella messa nelle nubi |
| < 30 pc | il mezzo di `vuoto.js` |

### Inferences
- L'esponente 2 al posto di 1 in `volume.worker.js:51` è un errore di derivazione: il commento cita il disco isotermo, ma l'espressione corretta con gas in equilibrio nel campo delle stelle è lineare (OML10 eq. 14). Correggerlo è una riga — [D].
- Barra e striscia sono quasi certamente numeriche. Muro e centri opachi sono soprattutto fisici. L'integrazione chiusa degli strati e lo sferoide analitico curano le prime due **e** rendono la resa più rapida, perché tolgono la trama 3D da 2,9 M valori e il calcolo di ~1 s nel lavoratore — [D].

### Gaps
- La barra non è stata riprodotta qui: richiede la scheda grafica. Le cause sono ipotesi con prova indicata.
- Il κ di `vuoto.js` non è stato letto: le A_V [M] usano κ di Draine ricordato (±30%).
- Le formule di Városi & Dwek (τ_MG, ω_cl, g_cl) non sono state lette nel testo pieno (Appendice C).
- I valori ω, g di Draine 2003 e la relazione di similitudine sono [R].
- La licenza di SKIRT 9 non è verificata.

---

## 4. Popolazioni stellari come luce, e il passaggio dalla luce integrata alle stelle risolte

### Takeaway
Oggi la luce della galassia è fatta da due corpi neri, 4300 K e 9500 K, con un fattore libero `GIOVANI = 3`. La luce delle stelle viene dalla sola sequenza principale. Il catalogo è di 2500 stelle con peso ~10⁸ e porta il 5% della luce.

La sostituzione è una **tabella SSP** (luce per massa nata in funzione di età e Z, in poche bande) convoluta con la storia per anello che il codice ha già. Il passaggio alle stelle va fatto con un **taglio della IMF che dipende dal pixel**:
- le stelle sopra la soglia di visibilità sono oggetti discreti estratti per indirizzo, Poisson nelle celle di un ottalbero;
- quelle sotto sono continuo;
- la luce attesa si conserva esattamente.

È l'idea delle fluttuazioni di brillanza superficiale (SBF) e della sintesi stocastica di SLUG, usata al contrario, per generare.

### Cited Findings

**(a) Il codice**
- Il volume ha luce `a·vecchio + GIOVANI·nuove`: corpi neri a 4300/9500 K, con «giovani» = eccesso sulla media dell'anello e `GIOVANI = 3` «LIBERO» — [C] `volume.worker.js:7–10, 32, 60`.
- I batuffoli di ripiego usano gli stessi corpi neri; «restano a mano quanto vale giovane e quanto buio» — [C] `universo.js:31–34, 77`.
- Le stelle del campione portano il 5% della luce (`puntiLuce`), la luce diffusa il 95% (`diffusa`), 60 000 batuffoli — [C] `universo.js:41–45`.
- `popolazione()` e `luceNascite()` esistono già: luce e colore di una generazione per età — [C] `galassie.js:350, 405–412`. Ma senza giganti: GX14/ST9 dell'inventario.

**(b) Leggi e tabelle**
- **SPS.**
  - FSPS (Conroy): i collegamenti Python python-fsps sono MIT; per la libreria Fortran si rimanda a «additional usage restrictions» nella pagina di FSPS — [V2] [python-fsps docs](https://python-fsps.readthedocs.io/), [V2] [repo cconroy20/fsps](https://github.com/cconroy20/fsps). La licenza del Fortran non è verificata.
  - Le tabelle di Bruzual & Charlot 2003 sono distribuite pubblicamente — [R] [arXiv:astro-ph/0309134](https://arxiv.org/abs/astro-ph/0309134).
  - BPASS include le binarie — [R] [Eldridge et al. 2017](https://arxiv.org/abs/1710.02154). La licenza non è verificata.
- **Luce come convoluzione [D].**
  `L_λ(anello k) = Σ_i m_nata(i, k) · ℓ_λ(t_oggi − t_i, Z_i)`.
  - `m_nata(i, k)` è `e.nati[i·NR + k]`, `Z_i` è `e.Zn`: [C] `galassie.js:692, 795`.
  - ℓ_λ è la tabella SSP per massa nata: 46 età × 5 Z × 4–8 bande, cioè 1–2 k numeri.
  - Il colore «giovane/vecchio» e il fattore 3 spariscono.
- **Transizione luce integrata → stelle: SBF.** Se N è il numero medio di stelle per pixel e f̄ il flusso medio per stella, la varianza del pixel è `N f̄²`. Il rapporto varianza/media dà `L̄ = Σ n L² / Σ n L`, la luminosità **pesata con la luminosità**, dominata dalle stelle più brillanti (le giganti rosse nelle popolazioni vecchie) — [V2] [Blakeslee & Ajhar, review SBF](https://ar5iv.labs.arxiv.org/html/astro-ph/9807124), [V2] [Tonry & Schneider 1988](https://adsabs.harvard.edu/pdf/1988AJ.....96..807T).
- **IMF campionata: SLUG** (Stochastically Lighting Up Galaxies) campiona IMF e storia di formazione in modo stocastico, con gli ammassi. Sa anche saltare il campionamento e integrare come un SPS normale. Il sottocampionamento della IMF alta cambia molto la luce integrata delle popolazioni piccole — [V2] [da Silva, Fumagalli & Krumholz 2012](https://ar5iv.arxiv.org/html/1106.3072), [V2] [Krumholz et al. 2015, SLUG III](https://arxiv.org/pdf/1502.05408). Il codice è su slugsps.com — [V2]. La licenza non è verificata ([R]: GPL).

**(c) Algoritmo a buon mercato [D]**
1. Per il pixel (o la cella dell'ottalbero) di area A si calcola la soglia di luminosità `L_cut` sopra cui una stella sola supera, di un fattore k, la luce diffusa del pixel: `L_cut = k · I_diff · A_pixel · d²`.
2. Dalla tabella SSP si ha, per ogni (età, Z), la frazione della luce e del numero sopra `L_cut`, `n_>(L_cut)`. Sono due colonne in più nella stessa tabella, in funzione di log L_cut.
3. Per la cella si fissa `λ = Σ_i m_nata · n_>`. Il numero delle stelle discrete è `N ~ Poisson(λ)` con seme dall'indirizzo della cella; masse ed età si estraggono dalle distribuzioni condizionate.
4. La luce diffusa della cella è `L_tot − ⟨L_>⟩`, quella **attesa** delle discrete, non quella estratta. Conserva la luce in media e dà le fluttuazioni giuste: la varianza è quella SBF per costruzione.
5. **Ottalbero per indirizzo**: il numero di stelle discrete di una cella si divide fra gli 8 figli con una multinomiale con probabilità ∝ ρ_*(figlio), seminata dalla cella. Scendendo, le stelle viste da lontano restano le stesse (regola 4) e la somma è esatta (stessa ricetta della discesa a conteggi del rapporto precedente).

- Costo: una tabella in più, ~20 k numeri; per fotogramma solo le celle a schermo. È lo schema di Gaia Sky, LOD per angolo solido, applicato a un catalogo generato.

**(d) Bilanci**
- La massa stellare di una cella è `Σ_* · V`. Le stelle discrete tolgono la loro massa e la loro luce dal continuo.
- I metalli: ogni stella discreta porta Z dalla distribuzione della cella (oggi `stelleGalassia` estrae già per passo e anello: `galassie.js:964–966`).
- Il catalogo di 2500 stelle con peso 10⁸ (GX13) diventa il livello più alto dell'ottalbero.

**(e) Che cosa mostrare**

| larghezza dello schermo | che cosa si mostra |
|---|---|
| W ≥ 10 kpc | solo continuo SPS; le supergiganti e le regioni H II più brillanti sono gli unici oggetti discreti |
| 100 pc – 10 kpc | supergiganti, giganti AGB e ammassi giovani come punti estratti; il continuo porta il resto |
| 1–100 pc | tutte le giganti e poi la sequenza principale fino a ~1 L☉ |
| < 1 pc | tutte le stelle; poi il sistema |

### Inferences
- Il fattore `GIOVANI = 3` e i due corpi neri sono tra i più «messi a mano» di tutta la scala galattica. Una tabella SSP calcolata **con il modello stellare del progetto** (`stelle.js` più le giganti quando ci saranno: ST9, Hurley) chiude il cerchio: la luce della galassia viene dalle stesse stelle che si vedono da vicino. FSPS e BPASS servono come riscontro, non come fonte — [D].

### Gaps
- La licenza del Fortran di FSPS, quella di BPASS e quella di SLUG non sono verificate.
- Il valore di k (contrasto per vedere una stella sul diffuso) è un parametro percettivo: va legato all'esposizione del motore (`S.E0`), non scelto.

---

## 5. Profili delle ellittiche e degli sferoidi; buchi neri dalle relazioni di scala

### Takeaway
Lo sferoide è un Hernquist il cui schiacciamento non schiaccia (bug). La forma intrinseca è estratta da una distribuzione apparente. Da vicino la cuspide è campionata su una griglia cilindrica.

Il profilo va dato in forma chiusa:
- Sérsic proiettato;
- deproiezione di Prugniel–Simien con p(n) di Lima Neto;
- oppure Hernquist analitico.

n deve emergere dal canale di formazione: instabilità del disco → n < 2; fusioni → n ≈ 4. Il buco nero va cresciuto (§2) e confrontato con Kormendy–Ho e con il tetto M–σ di King che il codice ha già.

### Cited Findings
- **(a)** Hernquist in `densitaGalassia`: `Ms·as/(2π q r (r+as)³)` con `r = hypot(R, z)` — [C] `galassie.js:945`. Stesso schema nel lavoratore — [C] `volume.worker.js:37`. `schiacciata` estratta da Lambas et al. 1992 (apparente) — [C] `galassie.js:233, 807`. `aSfer = R_metà/2,414` — [C] `galassie.js:746`.
- **(b) Sérsic.**
  - `I(R) = I_e exp{−b_n[(R/R_e)^{1/n} − 1]}`, con b_n definito da `Γ(2n) = 2γ(2n, b_n)` — [V2] [Graham & Driver 2005](https://ar5iv.labs.arxiv.org/html/astro-ph/0503176), eq. 4.
  - Approssimazioni: Capaccioli `b_n = 1,9992n − 0,3271` (0,5 < n < 10) e Ciotti & Bertin `b_n → 2n − 1/3` per n grande, con espansione asintottica accurata meglio di 10⁻⁴ per n > 0,36 — [V2] (stessa fonte).
  - Luminosità totale: `L = I_e R_e² 2πn e^{b_n} b_n^{−2n} Γ(2n)` — [V2] (stessa fonte, eq. 2 con Γ al posto di γ).
- **Deproiezione Prugniel–Simien.** `ρ(r) = ρ₀ (r/R_e)^{−p} exp[−b_n (r/R_e)^{1/n}]`:
  - p = 1 − 0,594/n + 0,055/n² nell'originale (1997);
  - p = 1 − 0,6097/n + 0,05463/n² nel raffinamento di Lima Neto, Gerbal & Márquez 1999, con accuratezza del 5% per 0,56 ≤ n ≤ 10;
  - alcune fonti scrivono 0,05563: variante tipografica;
  - Vitral & Mamon 2020 dicono che queste approssimazioni sono inadatte a n basso e meno precise del dichiarato, e ne danno una più precisa;
  - [V2] [Vitral & Mamon 2020, arXiv:2001.03121](https://arxiv.org/pdf/2001.03121), [V2] [ar5iv 2001.03121](https://ar5iv.arxiv.org/html/2001.03121).
- **(c) Resa e costo [D].**
  - Per la vista da lontano basta Sérsic proiettato su un ellisse: forma chiusa nel pixel.
  - Per il raymarching serve la tabella della corda `F(b, s)` (§3c) per ogni n in una griglia di 8 valori (n = 1…6); con la deproiezione PS-LGM sono 8 × 64 × 64 = 32 k numeri.
  - Lo schiacciamento si fa con `m² = R² + z²/q²` e il fattore 1/q per conservare la massa.
  - L'errore è quello di PS-LGM, ~5% per n ≥ 0,56 [V2]; per n < 0,56 si usa una gaussiana.
- **n e forma intrinseca dalla storia.**
  - Gli pseudo-sferoidi da evoluzione secolare hanno n < 2, quelli classici n > 2 — [R] [Fisher & Drory 2008](https://arxiv.org/abs/0806.2347).
  - Le fusioni secche fanno crescere n e R_e — [R] [Hilz et al. 2013](https://arxiv.org/abs/1206.1597).
  - La forma intrinseca (triassialità) dipende dal rapporto di massa della fusione e dalla frazione di gas — [R].

  Nel codice basterebbe:
  - la massa dello sferoide da instabilità (§2, Dark Sage) a n ≈ 1–1,5;
  - quella da fusione a n che cresce con il numero di fusioni secche;
  - il profilo totale come somma delle due componenti.
- **Buchi neri.**
  - Kormendy & Ho 2013: `M_BH = 0,49·10⁹ (M_bulge/10¹¹)^1,17`, scarto 0,28 dex (usata come fonte) — [C] `galassie.js:224` (citazione nel codice; il testo non è stato riverificato qui).
  - Il tetto King `M_σ = f_g σ_T σ⁴/(πG² m_p)` è in `relativita.js:423` — [C].
  - σ dello sferoide si ha dal modello di Hernquist o Sérsic in forma chiusa: per Hernquist, `σ² ≈ GM/(6a)` in media sul volume — [R] [Hernquist 1990](https://ui.adsabs.harvard.edu/abs/1990ApJ...356..359H).
  - Proposta: crescita alla Croton (§2); riscontro su Kormendy–Ho; tetto di King.
  - `germe = 10⁵` resta l'unico libero, dichiarato: la fisica dei semi non è nota.
- **(d)** Bilancio: la massa che va nel buco nero va tolta dal gas freddo dell'anello centrale (oggi M_BH non toglie niente) — [D] da [C] `galassie.js:651`.
- **(e)** A tutte le scale lo sferoide è analitico. Sotto ~10 pc dal centro c'è il buco nero (`buconero.js`, che si attiva quando l'ombra supera 1,5 pixel: `universo.js:48–55`).

### Inferences
- Il bug di `q` (massa ×1/q, forma rotonda) più il taglio del cilindro a ±0,8 Rg rendono le ellittiche disegnate più dense al centro e troncate in alto e in basso. Lo sferoide analitico corregge le due cose e contribuisce ai «centri opachi»: luce satura, oltre alla polvere di §3 — [D].

### Gaps
- Non è verificato se Hernquist sia la scelta migliore delle Sérsic per le ellittiche giganti: Hernquist proiettato somiglia a R^{1/4} [R].
- Le relazioni n(storia) sono [R].

---

## 6. Resa a queste scale: profondità, origine mobile, impostori, e come fanno SpaceEngine, Gaia Sky e Celestia

### Takeaway
L'architettura dei riferimenti c'è già: un albero dei corpi in cui la camera si «riattacca» entrando nell'influenza. Profondità logaritmica e LOD per angolo solido sono già nei rapporti precedenti.

Ciò che manca a queste scale è una **regola di passaggio unica**: discreto sopra la soglia di visibilità del pixel, continuo per il resto, con conservazione della luce. Va applicata a aloni, galassie, nubi e stelle con la stessa formula, invece di soglie per oggetto (4 R_g, 60 R_g, `puntiLuce` 5%, 60 000 batuffoli).

I prodotti professionali (Gaia Sky, SpaceEngine) passano da galassia a stelle con **canali dipinti e dissolvenze per distanza**: funziona all'occhio, ma non conserva niente.

### Cited Findings
- **(a) Soglie a mano nella vista:**
  - le stelle sono mete solo entro `max(4 Rg, 1,5·raggioCosmo)` — [C] `universo.js:103–105`;
  - la luce proposta all'esposizione cambia sotto 60 Rg con fattori 0,07/0,3 — [C] `universo.js:130–131`;
  - `puntiLuce = 6·10⁻⁴` nel cosmo, «LIBERO, perché da lontano si trovi» — [C] `universo.js:157–160, 167`;
  - le nubi oscure del mezzo tolgono luce anche davanti — [C] `mezzo.js:12–14`;
  - «da dentro la galassia si vedono come nubi larghe, non come la Via Lattea in cielo» — [C] `universo.js:15–16`.
- **Gaia Sky.**
  - Galassie procedurali a canali (GAS, HII, STAR, DUST, BULGE, POINT), particelle billboard, polvere sottrattiva;
  - canali «low-resolution» su un buffer a mezza risoluzione («approximately 4 times fewer pixels»);
  - parametri `fadeOut` per distanza;
  - particelle troppo grandi limitate («clamped, which bounds the cost of very close-up views»);
  - generazione su GPU con compute shader e ripiego su CPU con lo stesso aspetto;
  - [V] [docs Procedural galaxies](https://gaia.ari.uni-heidelberg.de/gaiasky/docs/master/Procedural-galaxies.html), [V2] [anteprima 2025](https://gaiasky.space/news/2025/galaxy-generation/).
  - La licenza non è dichiarata in quella pagina ([R]: MPL-2.0).
- **SpaceEngine**: sprite procedurali della banda di polvere che si accordano con la trama quando ci si avvicina; LOD «more aggressive» per galassie e nebulose negli ammassi; correzione di «graphical artifacts in giant elliptical galaxies» — [V] [blog 17/2/2019](https://spaceengine.org/news/blog190217/).
- **Celestia**: galassie come nuvole di punti da modelli per tipo di Hubble — [R]. Non verificato.

**(c) Proposta [D]: una sola funzione di passaggio**
1. Per ogni classe di oggetti (alone/galassia, nube, stella) e per ogni cella dell'ottalbero a schermo, si ha la luce totale attesa `L_tot(cella)`, dal continuo del livello genitore.
2. Si sceglie la soglia `L_cut = k · (luce di fondo per pixel) · (d²/A_pixel)`, oppure `M_min` per gli aloni (§1e): il criterio è lo stesso per tutte le classi.
3. Gli oggetti sopra soglia sono discreti, estratti per indirizzo come in §4c. Il continuo è `L_tot − ⟨L_>⟩`.
4. **Nessuna dissolvenza**. Al variare di d la soglia scorre con continuità; un oggetto entra quando la sua luce attesa supera la soglia, ma la luce dell'insieme non salta, perché il continuo perde in media esattamente quello che gli oggetti guadagnano. Per togliere anche lo «schiocco» del singolo oggetto, la sua luce si ripartisce con un peso liscio `w(L/L_cut)` (smoothstep su un fattore 2) fra discreto e continuo, con somma sempre 1.

- La regola si applica identica:
  - cosmo → aloni (`aloniIn` / `aloniAttesi`);
  - galassia → nubi (f_mol, funzione di massa delle nubi);
  - galassia → stelle (SSP con n_>(L)).
- Prestazioni: costo proporzionale ai pixel e non al cosmo, come chiede la regola 8.
- I volumi chiusi di §3 tolgono la griglia 3D: il lavoratore costruisce due trame 2D in ~10–50 ms invece di ~1 s di griglia.
- Il buffer a mezza risoluzione per i canali lisci è già usato (`riduzione`, `volumi.js:15–18`) ed è la stessa scelta di Gaia Sky [V].

**(e) Tabella unica della larghezza dello schermo** (sintesi di §§1–5)

| W | discreto | continuo | note |
|---|---|---|---|
| > 3 Gpc | — | ragnatela, cono, fondo cosmico | |
| 300 Mpc – 3 Gpc | aloni > M_min(W) (~10⁴ a schermo) | nebbia condizionata | stessa regola d'identità |
| 10–300 Mpc | ammassi, gruppi, galassie | aloni piccoli | |
| 0,3–10 Mpc | membri del gruppo (albero) | satelliti piccoli, gas caldo | |
| 30 kpc – 0,3 Mpc | la galassia, i satelliti | — | luce integrata attenuata con tabella |
| 1–30 kpc | regioni H II, supergiganti | strati chiusi del disco, sferoide analitico | niente trama 3D |
| 30 pc – 1 kpc | nubi molecolari, ammassi, giganti | fondo stellare SSP, polvere media | f_mol → nubi |
| 1–30 pc | stelle fino a ~1 L☉ | resto della IMF | |
| < 1 pc | tutte le stelle | — | poi il sistema |

### Inferences
- La convergenza fra Gaia Sky (canali), SpaceEngine (sprite) e la proposta sta nel separare **lisci a bassa risoluzione** da **discreti a piena risoluzione**. La differenza di stateyour è che il confine fra i due non è un `fadeOut` per distanza ma la soglia di luce per pixel. Così la luce si conserva e nessuna scala appare vuota né salta — [D].

### Gaps
- Non sono stati trovati documenti tecnici di SpaceEngine sul raymarching delle galassie, né post sul passaggio galassia → stelle oltre gli sprite.
- Celestia non è verificata.
- La disponibilità del depth buffer invertito in WebGL2 resta non verificata, come nel rapporto precedente.
