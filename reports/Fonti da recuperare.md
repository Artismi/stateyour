# Fonti da recuperare: censimento delle voci non verificate, ricostruzione delle voci che vanno nel codice, e ciò che resta da prendere a mano (stato all'11 novembre 2026)

Questo rapporto risponde a una domanda: delle voci che nelle note di ricerca portano ancora una marca non primaria, quali si possono usare nel codice così come sono, quali sono state ricostruite da ciò che è aperto, e quali dipendono davvero da un originale chiuso. La risposta breve: le forme delle leggi si ricostruiscono quasi tutte per derivazione e riscontro numerico; ciò che non si ricostruisce sono i parametri empirici di una ventina di lavori, elencati in appendice. Il lavoro si è fermato alle voci di priorità A, e dentro la priorità A non le ha esaurite: è scritto sotto fin dove è arrivato.

Il censimento completo, una riga per fonte, è in `reports/Fonti da recuperare.csv`. Le voci toccate nelle note sono elencate, com'erano e come sono, nei due file `verifiche_censimento.md` dentro `research_notes/Leggi fisiche complete per stateyour/` e `research_notes/Regole per la vita in potenza/`.

## 1. Bilancio

| Grandezza | Numero |
|---|---|
| Voci che dopo questo giro portano ancora una marca non primaria nelle 15 note ([R], [S], [V2], [V‑sec], [V‑cod], [Va], [V‑ab], [V‑r], [V*]; escluse le annotazioni storiche «era [R]») | 1355 |
| di cui senza alcuna fonte indicata nella riga (fatti da manuale ricordati) | 355 |
| Fonti distinte ricavate dalle altre voci | 878 |
| per tipo: articoli e libri con DOI 510, pagine o documenti in rete e libri senza DOI 151, pagine Wikipedia 100, PubMed Central 85, arXiv 26, schede ADS 6 | |
| per priorità: A 332, B 499, C 47 | |
| Fonti con una copia aperta indicata da almeno un servizio (Wikipedia esclusa) | 305 |
| Fonti di priorità A e B per cui lo scarico è stato tentato, una volta | 345 |
| di cui scaricate con testo leggibile | 157 |
| Fonti senza copia aperta trovata (articoli 271, libri 40) | 311 |
| Fonti con copia aperta dichiarata ma non servita a un client automatico (403, 429, pagina a script) | 177 |
| Voci toccate nelle note in questo giro | 75 |
| verificate sul testo intero di una copia aperta, marca [V] | 10 |
| triangolate, marca [T] | 6 |
| derivate qui con riscontro numerico, marca [D] | 53 |
| annotate: una sola fonte aperta o solo codice, marca invariata | 6 |
| Copie aperte scaricate e non ancora lette (priorità A 39; il resto priorità B) | 144 |

Come leggere i numeri. La priorità è assegnata da una regola automatica sul testo attorno alla marca: A se c'è una formula, un coefficiente, una soglia o una licenza; B se c'è un numero; C altrimenti. La regola è larga: molte voci A sono riscontri e non costanti del codice. Dei 510 DOI, OpenAlex ne classifica 331 come chiusi; gli altri hanno una copia dichiarata aperta, ma un terzo abbondante di quelle copie sta su siti di editori che rispondono 403 a un client dichiarato.

Fin dove è arrivato il lavoro. La ricerca automatica ha fatto un solo passaggio per fonte su tutte le fonti con DOI. La lettura e la ricostruzione hanno coperto 75 voci di priorità A, scelte tra quelle che portano una formula operativa. Restano non lavorate: 559 voci di priorità A (in gran parte nelle note sulla vita, dove i numeri sono misure e non si derivano), tutte le B e le C, e le 355 voci senza fonte indicata. Le note `quantistica_legami_cinetica`, `fisiologia_piante_ecosistemi` e `fuoco_metalli_civilta` hanno ricevuto solo la definizione delle marche nuove.

## 2. Che cosa è stato ricostruito, e come

Due marche nuove, definite nella legenda di ogni nota. **[T]**, triangolata: la primaria non è aperta, ma la formula o il numero compare identico in almeno due fonti aperte indipendenti e un riscontro numerico fatto qui lo riproduce. **[D]**, derivata qui: ricavata dai princìpi, con la derivazione scritta in breve nella voce e un riscontro numerico contro un valore noto. [D] vale per la forma della legge; i parametri empirici dentro la stessa voce conservano la marca che avevano.

### 2.1 Verificate sul testo intero di una copia aperta ([V])

| Voce | Che cosa è stato letto | Esito |
|---|---|---|
| Profilo NFW (astrofisica §1) | Navarro, Frenk e White 1997, arXiv:astro-ph/9611107, eq. 1 | forma confermata; la massa racchiusa è derivata e controllata per quadratura |
| Riciclo e ritardo delle Ia nel modello chimico a una zona (astrofisica §2) | Weinberg, Andrews e Freudenburg 2017, arXiv:1604.07435 | r = 0,4; t_D = 0,15 Ga; τ_Ia = 1,5 Ga |
| Semilarghezza della regione a ferro di cavallo (astrofisica §5) | Paardekooper, Baruteau e Kley 2011, arXiv:1007.4964, eq. 49 | `C = (1,1/γ^(1/4))·(0,4/(b/h))^(1/4)`: la nota aveva solo il caso b/h = 0,4 |
| Costante di precessione (astrofisica §7) | Capitaine, Wallace e Chapront 2003, copia sul sito dell'Osservatorio di Parigi | 5028,796195″ per secolo = 50,288″/a |
| Efficienza per tempo di caduta libera (astrofisica §2) | Krumholz, Dekel e McKee 2012 | ε_ff ≈ 0,01 confermato; il fattore d'addensamento f_c ≈ 5 non è nel testo |
| Meyer‑Peter e Müller, e Wong e Parker (interno §6, due voci) | prestampa di Wong e Parker 2006, copia dell'autore | forma originale con 8 e 0,047; rianalisi `3,97·(τ* − 0,0495)^1,5` e `4,93·(τ* − 0,0470)^1,60` |
| Moto del Sole rispetto al fondo cosmico (matematica §8) | Planck 2018 I, arXiv:1807.06205 | 369,82 ± 0,11 km/s; l = 264,021°; b = 48,253° |
| Frazione elettromagnetica dello sciame adronico (particelle §3) | PDG 2012, rassegna sui rivelatori, eq. 31.33 | `f_em = 1 − (E/E₀)^(m−1)`, m = 0,80–0,87, E₀ ≈ 1 GeV; il resto della voce no |
| Parametri di Gray–Scott di Pearson (vita §5) | prestampa arXiv:patt-sol/9304003 | D_u = 2·10⁻⁵, D_v = 10⁻⁵, dominio 2,5 × 2,5; F e k solo come assi di figura |
| HCN nell'oceano primitivo (cellula §1, due marche) | Miyakawa, Cleaves e Miller 2002, PDF aperto dell'editore | 7·10⁻¹³ mol/L a 100 °C, 2·10⁻⁶ a 0 °C; soglia di polimerizzazione 0,01–0,1 mol/L |

### 2.2 Triangolate ([T])

| Voce | Le due fonti aperte | Riscontro | Valore da usare |
|---|---|---|---|
| Dissipazione mareale di Io, −Im k₂ (interno §2) | Park e altri 2025 (*Nature*, testo aperto) che riporta 0,015 ± 0,003 di Lainey 2009; misura indipendente di Juno nello stesso articolo, 0,0109 ± 0,0054 | 6,22·10¹⁶ W × 0,015 = 9,3·10¹³ W, dentro il flusso osservato | 0,015, intervallo 0,011–0,018 |
| Leggi di flusso dell'olivina secca (interno §5) | banca di reologie di UWGeodynamics; GeoParams.jl, compilata a parte dalla tabella 1 di Hirth e Kohlstedt | viscosità 5·10²⁰ e 2·10²¹ Pa·s a 1600 K e 3 GPa | A = 1,1·10⁵, n = 3,5, E = 530 kJ/mol (dislocazioni); A = 1,5·10⁹, n = 1, p = 3, E = 375 kJ/mol (diffusione); fascia ±0,4 in log₁₀ |
| Larghezza del profilo di Voigt (luce §7) | Wikipedia; calcolo esatto con la funzione di Faddeeva | scarto massimo 0,024% | `0,5346·f_L + √(0,2166·f_L² + f_G²)` |
| Sezione di Rayleigh di una sfera piccola e dell'azoto (luce §6) | Wikipedia; formula dell'indice di Sneep e Ubachs, già [V] | 5,30·10⁻²⁷ cm² calcolato contro 5,10 misurato | (5,1–5,3)·10⁻³¹ m² a 532 nm |
| Regressione di Dunbar (comportamento §6) | West e altri 2020 (*PNAS*, testo aperto): a = 1,239, b = 3,389; Wikipedia: 148, intervallo 100–230 | CR = 4,1 → 147,8 | `log₁₀N = 0,093 + 3,389·log₁₀CR` |
| Velocità dalle orme, formula di Alexander (materiali §5) | tre articoli aperti che la riportano identica (2015, 2016, 2022) | passo 1,5 m, anca 0,9 m → 1,7 m/s | `v = 0,25·g^0,5·λ^1,67·h^(−1,17)`; variante 0,226 |

Sulla triangolazione di Voigt: la seconda «fonte» è un calcolo esatto, non un testo. È più forte di un secondo testo, ma non è ciò che la definizione chiede alla lettera; lo dichiaro.

### 2.3 Derivate qui con riscontro numerico ([D])

53 voci. La derivazione e il riscontro sono scritti in coda a ciascuna voce nella nota; qui l'elenco per gruppi, con il riscontro.

- **Cosmo e stelle.** Tasso di crescita `f ≈ Ω_m(z)^0,55`: integrata l'equazione di crescita, scarto massimo 0,5% tra z = 0 e 5. Criterio di Toomre: il gas dalla relazione di dispersione; il 3,36 delle stelle riprodotto come 2π × massimo di `[1 − e^(−χ)I₀(χ)]/√χ` = 3,358. Luminosità di Eddington 1,257·10³⁸ erg/s per M☉ e tempo di Salpeter 45,0 Ma. Inclinazioni sul piano invariabile ricalcolate dagli elementi del JPL: 6,34°; 2,20°; 1,58°; 1,68°; 0,33°; 0,93°; 1,03°; 0,73°, uguali a Souami e Souchay entro 0,01°.
- **Vento, campo, alta atmosfera.** Vento di Parker (430 km/s a 1 UA per 10⁶ K), spirale (45°), magnetopausa di Chapman–Ferraro (10,2 R⊕), flusso di Jeans (quadratura identica alla formula), linea di campo e modulo del dipolo, specchio e cono di perdita, risonanze di Schumann, frequenza di plasma 8,98·√N, strato di Chapman, profondità di pelle 503·√(ρ/f).
- **Luce e suono.** Planck (integrale = σT⁴, Wien 2,8978 mm·K), Kubelka–Munk, profondità ottica delle nubi, Rydberg, Saha (metà ionizzazione a 9000–10 200 K), Doppler, Drude, velocità del suono in aria 331,32 m/s, criterio d'arresto della serie di Mie (coda < 10⁻¹⁶).
- **Interno e rocce.** Lane–Emden n = 1, pressione termica di Mie–Grüneisen, teoria classica della nucleazione, Avrami, problema di Stefan, flessione della piastra (D = 1,68·10²³ N·m, α = 73,9 km), conseguenze dell'attrito dipendente da velocità e stato (regime, picco, rigidezza critica).
- **Matematica e scale.** Langevin con il teorema di fluttuazione e dissipazione, fluttuazioni del numero di particelle (acqua: 0,0620), dilatazione dei tempi in campo debole (GPS: +38,6 µs al giorno), probabilità e tempo di fissazione.
- **Particelle.** Riscontri aggiunti a Gell‑Mann–Okubo (0,6%), Klein–Nishina (0,2112 b a 1 MeV), angolo di Lindhard (0,3075°), Bateman, picco di Gamow (1,2204), rapporto di compressione dell'urto.
- **Clima e fluidi.** `w ≤ √(2·CAPE)`, crescita del ghiaccio marino (1,58 m in 100 giorni), rilassamento viscoso del semispazio (4100 anni per la Fennoscandia), van der Waals dal punto critico, fattore di forma della nucleazione eterogenea, costante di Smagorinsky dall'argomento di Lilly.
- **Vita.** Regola delle miscele (Voigt e Reuss), carico di punta di Eulero, limite Fr = 1 del cammino, altezza del salto, trasmissione a un'interfaccia (−29,5 dB tra aria e acqua), limite di diffrazione 1,2197, equazione di Price a più livelli (è la legge della covarianza totale).

### 2.4 Correzioni e precisazioni trovate (vecchio → nuovo)

1. **Tempo di fissazione di un mutante vantaggioso** (matematica §6): `(2/s)·ln N` → `(2/s)·[ln(2Ns) + 0,577]`. Una simulazione di Wright–Fisher (N = 1000, s = 0,02) dà 422 generazioni; la forma vecchia dava 691, quella nuova 427. La probabilità di fissazione ≈ 2s è confermata (0,0398).
2. **Trasporto al fondo**: il coefficiente 8 con 0,047 di Meyer‑Peter e Müller include una correzione per le forme di fondo; con fondo piano sovrastima di circa due volte. In codice usare `3,97·(τ* − 0,0495)^1,5`, ora [V].
3. **Tempo di Salpeter**: «45 Ma» vale senza il fattore 1/(1 − ε); con quel fattore è 50 Ma. Usare 45–50.
4. **Semilarghezza a ferro di cavallo**: aggiunta la dipendenza `(0,4/(b/h))^(1/4)` che mancava.
5. **Legge di Byerlee**: la pagina di Wikipedia scrive il secondo ramo «in MPa»; è in kbar. Con 50 MPa i due rami si raccordano a 200 MPa (170 = 170); la nota aveva già la forma giusta.
6. **Magnitudo momento**: 9,05 (Hanks e Kanamori, cioè 10,7 in dyn·cm) e 9,1 (standard IASPEI) sono due convenzioni che differiscono di 0,033 unità: va dichiarata quale.
7. **Risonanze di Schumann**: le frequenze osservate sono 0,74–0,79 volte quelle della cavità ideale; il fattore va in codice.
8. **Sciame adronico**: la formula della frazione elettromagnetica sta nel PDG 2012, non nel 2024; l'esponente non è un numero solo ma 0,80–0,87 secondo il calorimetro.
9. **Olivina secca**: i volumi d'attivazione nell'originale sono intervalli (14–27 e 2–10·10⁻⁶ m³/mol), e la legge stampata per le dislocazioni è 2,5 volte più lenta dei dati dello stesso articolo (avvertenza letta nel sorgente di GeoParams.jl).

## 3. Che cosa resta incerto, con l'intervallo da usare

| Grandezza | Stato | Valore prudente e intervallo |
|---|---|---|
| Parametri dell'attrito dipendente da velocità e stato (a, b, D_c) | forma [D], valori [R]; Marone 1998 chiuso | a, b = 0,005–0,015; D_c = 10⁻⁵–10⁻⁴ m in laboratorio; trattarli come intervalli |
| Fattore d'addensamento f_c del gas molecolare | non è nella fonte citata | 1 per celle ≲ 100 pc, fino a 5 per celle ~1 kpc |
| Nubi basse, `0,057·LTS − 0,5573` | solo sul codice E3SM; articolo AMS 403 | usare i coefficienti del codice, solo sul mare, saturando a 0 e 1 |
| Calcificazione, polinomi k(T) e n(T) | una sola fonte aperta (Wall e altri 2019) | `k = −0,0177·T² + 1,47·T + 14,9`; `n = 0,0628·T + 0,0985`; unità di k da confermare |
| Modello di Govardovskii, banda α | una sola fonte aperta più normalizzazione verificata | costanti come nella nota; la banda β e il modello A2 non sono ricostruiti |
| Legge di Byerlee | una sola fonte aperta più continuità | 0,85·σ_n sotto 200 MPa; 50 MPa + 0,6·σ_n sopra |
| Sciame adronico: t_max e λ_att | [R]; assenti dal PDG 2012 e 2024 | `0,2·ln E + 0,7` con ±0,3·λ_I; esponente 0,13 come ordine di grandezza |
| Olivina idrata e volumi d'attivazione | [R]; i due codici aperti scelgono valori diversi | prendere l'insieme di un solo codice e dichiararlo; non mescolare |
| Velocità massima di salita nei temporali | tetto [D] | 0,3–0,5 volte √(2·CAPE) (ricordato) |
| Costante di Smagorinsky | [D] per il valore isotropo | 0,17 in turbolenza libera, 0,10 vicino alle pareti (ricordato) |
| Limite di diffusione di Hunten, 2,5·10¹³·f_T | provata la derivazione: viene 3–4·10¹³ con i parametri di diffusione che ricordo | lasciare [R]; fascia di un fattore 1,5 |
| Parametri di Farhadifar (0,12; 0,04) | non confermati: un articolo aperto elenca altri insiemi | non fissarli in codice |

## 4. Copie aperte trovate e non ancora lette

Le fonti scaricate con testo e non lette sono 144; per ciascuna il CSV dà l'indirizzo della copia e le righe delle note che ne dipendono (colonna `esito_censimento` = «copia aperta scaricata, non ancora letta»). Qui le 39 di priorità A.

| Voci A | Riferimento | Copia aperta | Note e righe |
|---|---|---|---|
| 2 | Domokos; Jerolmack; Sipos; Török (2014). How River Rocks Round: Resolving the Shape-Size Paradox. PLoS ONE 9:e88657 | <https://arxiv.org/abs/1311.6574> (prestampa) | interno_rocce_paesaggio:412; interno_rocce_paesaggio:412; interno_rocc |
| 2 | Segura; Krelove; Kasting; Sommerlatt; Meadows; Crisp e altri (2003). Ozone Concentrations and Ultraviolet Fluxes on Earth-Like Planets Around Other St | <http://www.nucleares.unam.mx/~antigona/articles/ozone_in_exoplanets.pdf> (GREEN) | fisiologia_piante_ecosistemi:109; fisiologia_piante_ecosistemi:315; fi |
| 2 | Deitrick e altri 2018, arXiv:1712.10060 | <https://arxiv.org/abs/1712.10060> (prestampa (arXiv)) | astrofisica_cosmo_stelle_pianeti:380; astrofisica_cosmo_stelle_pianeti |
| 2 | Held; Larichev (1996). A Scaling Theory for Horizontally Homogeneous, Baroclinically Unstable Flow on a Beta Plane. Journal of the Atmospheric Science | <https://arxiv.org/abs/ao-sci/9503001> (prestampa) | termodinamica_fluidi_clima:45; termodinamica_fluidi_clima:46 |
| 2 | Herculano-Houzel; Avelino-de-Souza; Neves; PorfÃ­rio; Messeder; Mattos FeijÃ³ e altri (2014). The elephant brain in numbers. Frontiers in Neuroanatomy | <https://www.frontiersin.org/articles/10.3389/fnana.2014.00046/pdf> (versione dell'editore) | comportamento_intenzioni_cultura:95; comportamento_intenzioni_cultura: |
| 2 | Redl e altri 2017, eq. 7 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC5469130.> (versione OA (deposito PMC su AWS)) | fisiologia_piante_ecosistemi:53; fisiologia_piante_ecosistemi:53 |
| 2 | (1995). Thermodynamic properties of minerals and related substances at 298.15 K and 1 bar (10^5 pascals) pressure and at higher temperatures. | <https://pubs.usgs.gov/bul/2131/report.pdf> (versione dell'editore) | fuoco_metalli_civilta:43; fuoco_metalli_civilta:86 |
| 1 | NN-xTB 2026, PMC13402705 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC13402705.> (versione OA (deposito PMC su AWS)) | quantistica_legami_cinetica:59; quantistica_legami_cinetica:59; quanti |
| 1 | Lenski; Ofria; Pennock; Adami (2003). The evolutionary origin of complex features. Nature 423:139-144 | <https://authors.library.caltech.edu/records/8gckk-p8p83/files/nature01568-s1.pdf?download=1> (GREEN) | comportamento_intenzioni_cultura:417; sviluppo_forma_evoluzione:287; s |
| 1 | Blitz & Rosolowsky 2006, arXiv:astro-ph/0605035 | <https://arxiv.org/abs/astro-ph/0605035> (prestampa (arXiv)) | astrofisica_cosmo_stelle_pianeti:79 |
| 1 | Bland‑Hawthorn & Gerhard 2016 | <https://arxiv.org/abs/1602.07702> (prestampa (arXiv)) | astrofisica_cosmo_stelle_pianeti:98 |
| 1 | Delle Site e altri, rassegna, arXiv:1412.4540 | <https://arxiv.org/abs/1412.4540> (prestampa (arXiv)) | matematica_coerenza_tra_scale:141 |
| 1 | Gell-Mann e Hartle, arXiv:gr-qc/9210010 | <https://arxiv.org/abs/gr-qc/9210010> (prestampa (arXiv)) | matematica_coerenza_tra_scale:294 |
| 1 | Strauss e Willick, arXiv:astro-ph/9502079 | <https://arxiv.org/abs/astro-ph/9502079> (prestampa (arXiv)) | matematica_coerenza_tra_scale:408 |
| 1 | Uggerhøj, Mikkelsen, Faye, arXiv:1604.05507 | <https://arxiv.org/abs/1604.05507> (prestampa (arXiv)) | matematica_coerenza_tra_scale:424 |
| 1 | Dürr; Fodor; Frison; Hoelbling; Hoffmann; Katz e altri (2008). Ab Initio Determination of Light Hadron Masses. Science 322:1224-1227 | <https://arxiv.org/abs/0906.3599> (prestampa) | particelle_nuclei_raggi_cosmici:58 |
| 1 | Abreu; Aglietta; Ahn; Albuquerque; Allard; Allekotte e altri (2012). Measurement of the Proton-Air Cross Section ats=57 TeVwith the Pierre Auger Obser | <https://arxiv.org/abs/1208.1520> (prestampa) | particelle_nuclei_raggi_cosmici:107 |
| 1 | Cowan e altri 2021, arXiv:1901.01410 | <https://arxiv.org/abs/1901.01410> (prestampa (arXiv)) | particelle_nuclei_raggi_cosmici:266 |
| 1 | Blasi 2013, arXiv:1311.7346 | <https://arxiv.org/abs/1311.7346> (prestampa (arXiv)) | particelle_nuclei_raggi_cosmici:301 |
| 1 | Keramati; Gutkin (2014). Homeostatic reinforcement learning for integrating reward collection and physiological stability. eLife 3 | <https://doi.org/10.7554/elife.04811> (versione dell'editore) | comportamento_intenzioni_cultura:21 |
| 1 | Bialek; Nemenman; Tishby (2001). Predictability, Complexity, and Learning. Neural Computation 13:2409-2463 | <https://arxiv.org/abs/physics/0007070> (prestampa) | comportamento_intenzioni_cultura:52 |
| 1 | Dorkenwald; Matsliah; Sterling; Schlegel; Yu; McKellar e altri (2024). Neuronal wiring diagram of an adult brain. Nature 634:124-138 | <https://doi.org/10.1038/s41586-024-07558-y> (versione dell'editore) | comportamento_intenzioni_cultura:82 |
| 1 | Herculano-Houzel 2011, *PLoS ONE* 6:e17514 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC3046985.> (versione OA (deposito PMC su AWS)) | comportamento_intenzioni_cultura:100 |
| 1 | Pyke (2014). Understanding movements of organisms: it's time to abandon the Lévy foraging hypothesis. Methods in Ecology and Evolution 6:1-16 | <https://opus.lib.uts.edu.au/bitstream/10453/37555/5/Understanding%20movements%20of%20organisms-It%27s%20time%20to%20abandon%20the%20L%c3%a9vy%20paradigm-MEE%20resubmitted%20-%20Jun%202014.pdf> (GREEN) | comportamento_intenzioni_cultura:136 |
| 1 | Grégoire; Chaté (2004). Onset of Collective and Cohesive Motion. Physical Review Letters 92 | <https://arxiv.org/abs/cond-mat/0401208> (prestampa) | comportamento_intenzioni_cultura:183 |
| 1 | Steels (1995). A Self-Organizing Spatial Vocabulary. Artificial Life 2:319-332 | <https://direct.mit.edu/artl/article-pdf/2/3/319/1661525/artl.1995.2.3.319.pdf> (versione dell'editore) | comportamento_intenzioni_cultura:298 |
| 1 | Marshall; Mathis; Carrick; Keenan; Cooper; Graham e altri (2021). Identifying molecules as biosignatures with assembly theory and mass spectrometry. N | <https://www.nature.com/articles/s41467-021-23258-x.pdf> (versione dell'editore) | comportamento_intenzioni_cultura:368 |
| 1 | Bonk e altri 2019 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC6375858.> (versione OA (deposito PMC su AWS)) | fisiologia_piante_ecosistemi:53 |
| 1 | Korotayev e Malkov, arXiv:1206.0496 | <https://arxiv.org/abs/1206.0496> (prestampa (arXiv)) | fuoco_metalli_civilta:288 |
| 1 | rassegna sui sistemi a molla e scatto, PMC6907395 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC6907395.> (versione OA (deposito PMC su AWS)) | materiali_scheletri_movimento:257 |
| 1 | Lauga e Powers 2009, *Rep. Prog. Phys.* 72:096601 | <https://arxiv.org/abs/0812.2887> (prestampa (arXiv)) | materiali_scheletri_movimento:263 |
| 1 | arXiv:1408.2085 | <https://arxiv.org/abs/1408.2085> (prestampa (arXiv)) | sensi_sistema_nervoso:60 |
| 1 | Steinhausen, storia in PMC8212934 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC8212934.> (versione OA (deposito PMC su AWS)) | sensi_sistema_nervoso:80 |
| 1 | Tu 2013, PMC3737589 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC3737589.> (versione OA (deposito PMC su AWS)) | sensi_sistema_nervoso:188 |
| 1 | Hiscock e Megason 2015 | <https://pmc-oa-opendata.s3.amazonaws.com/?list-type=2&prefix=PMC4707970.> (versione OA (deposito PMC su AWS)) | sviluppo_forma_evoluzione:144 |
| 1 | Plantec; Hamon; Etcheverry; Chan; Oudeyer; Moulin-Frier (2025). Flow-Lenia: Emergent Evolutionary Dynamics in Mass Conservative Continuous Cellular Au | <https://arxiv.org/abs/2506.08569> (prestampa) | sviluppo_forma_evoluzione:348 |
| 1 | Chabrier; Debras (2021). A New Equation of State for Dense Hydrogen–Helium Mixtures. II. Taking into Account Hydrogen–Helium Interactions. The Astroph | <https://iopscience.iop.org/article/10.3847/1538-4357/abfc48/pdf> (versione dell'editore) | interno_rocce_paesaggio:87 |
| 1 | Bastolla; Parisi (1998). The modular structure of Kauffman networks. Physica D: Nonlinear Phenomena 115:219-233 | <https://arxiv.org/pdf/cond-mat/9708214> (prestampa o manoscritto) | sviluppo_forma_evoluzione:83 |
| 1 | Samuelsson; Troein (2003). Superpolynomial Growth in the Number of Attractors in Kauffman Networks. Physical Review Letters 90 | <https://arxiv.org/pdf/cond-mat/0211020> (prestampa o manoscritto) | sviluppo_forma_evoluzione:83 |

Altre due copie aperte sono scansioni senza testo, da leggere con un riconoscimento dei caratteri: Lacey e Cole 1993 (<https://articles.adsabs.harvard.edu/pdf/1993MNRAS.262..627L>) per il tasso di fusione degli aloni, e Hoffman e Ribak 1991 (<https://articles.adsabs.harvard.edu/pdf/1991ApJ...380L...5H>) per i campi vincolati.

**Copie dichiarate aperte ma non servite a un client automatico**: 177 fonti, di cui 57 di priorità A. Si aprono da un browser senza abbonamento. Le più usate nelle note:

| Voci A | Riferimento | Indirizzo dichiarato aperto | Risposta |
|---|---|---|---|
| 5 | Field; Behrenfeld; Randerson; Falkowski (1998). Primary Production of the Biosphere: Integrating Terrestrial and Oceanic Components. Science 281:237-2 | <https://escholarship.org/uc/item/9gm7074q> | escholarship.org→403 www.escholarship.org→403 |
| 2 | Thauer; Jungermann; Decker (1977). Energy conservation in chemotrophic anaerobic bacteria. Bacteriological Reviews 41:100-180 | <https://pmc.ncbi.nlm.nih.gov/articles/PMC413997/> | www.ebi.ac.uk→500 europepmc.org→403 europepmc.org→403 |
| 2 | Helfrich (1973). Elastic Properties of Lipid Bilayers: Theory and Possible Experiments. Zeitschrift für Naturforschung C 28:693-703 | <https://www.degruyter.com/document/doi/10.1515/znc-1973-11-1209/pdf> | www.degruyter.com→202 |
| 2 | Hodgkin; Katz (1949). The effect of sodium ions on the electrical activity of the giant axon of the squid. The Journal of Physiology 108:37-77 | <https://pmc.ncbi.nlm.nih.gov/articles/PMC1392331/> | www.ebi.ac.uk→500 |
| 2 | Hochner (2012). An Embodied View of Octopus Neurobiology. Current Biology 22:R887-R892 | <http://www.cell.com/article/S0960982212010640/pdf> | www.cell.com→403 |
| 2 | Lewis (2003). Autoinhibition with Transcriptional Delay. Current Biology 13:1398-1408 | <http://www.cell.com/article/S0960982203005347/pdf> | www.cell.com→403 |
| 2 | Farhadifar; Röper; Aigouy; Eaton; Jülicher (2007). The Influence of Cell Mechanics, Cell-Cell Interactions, and Proliferation on Epithelial Packing. C | <http://www.cell.com/article/S0960982207023342/pdf> | www.cell.com→403 |
| 2 | Nilsson (2009). The evolution of eyes and visually guided behaviour. Philosophical Transactions of the Royal Society B: Biological Sciences 364:2833-2 | <https://doi.org/10.1098/rstb.2009.0083> | www.ebi.ac.uk→500 doi.org→403 |
| 1 | Anastassiou; Perin; Markram; Koch (2011). Ephaptic coupling of cortical neurons. Nature Neuroscience 14:217-223 | <http://infoscience.epfl.ch/record/183385> | infoscience.epfl.ch→200/html infoscience.epfl.ch→200/html |
| 1 | McCoy; Gillooly (2008). Predicting natural mortality rates of plants and animals. Ecology Letters 11:710-716 | <https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1461-0248.2008.01190.x> | onlinelibrary.wiley.com→403 |
| 1 | Kavanagh; Evans; Jernvall (2007). Predicting evolutionary patterns of mammalian teeth from development. Nature 449:427-432 | <http://doc.rero.ch/record/15548/files/PAL_E2960.pdf> | doc.rero.ch→410 |
| 1 | Charnov (1976). Optimal foraging, the marginal value theorem. Theoretical Population Biology 9:129-136 | <https://digitalrepository.unm.edu/cgi/viewcontent.cgi?article=1008&context=biol_fsp> | digitalrepository.unm.edu→403 |
| 1 | Jensen; Berg-Sørensen; Bruus; Holbrook; Liesche; Schulz e altri (2016). Sap flow and sugar transport in plants. Reviews of Modern Physics 88 | <http://link.aps.org/pdf/10.1103/RevModPhys.88.035007> | link.aps.org→403 orbit.dtu.dk→200/html link.aps.org→403 |
| 1 | David; Alm (2010). Rapid evolutionary innovation during an Archaean genetic expansion. Nature 469:93-96 | <https://orcid.org/0000-0002-3570-4767> | orcid.org→200/html dspace.mit.edu→429 |
| 1 | Stevenson (1982). Interiors of the Giant Planets. Annual Review of Earth and Planetary Sciences 10:257-295 | <http://web.gps.caltech.edu/classes/ge133/reading/ppv_preprints/sec7-1.pdf> | web.gps.caltech.edu→-1 |
| 1 | Ashton; Murray (2006). High‐angle wave instability and emergent shoreline shapes: 1. Modeling of sand waves, flying spits, and capes. Journal of Geoph | <https://onlinelibrary.wiley.com/doi/pdfdirect/10.1029/2005JF000422> | onlinelibrary.wiley.com→403 |
| 1 | Fournier; Fussell; Carpenter (1982). Computer rendering of stochastic models. Communications of the ACM 25:371-384 | <https://dl.acm.org/doi/pdf/10.1145/358523.358553> | dl.acm.org→403 |
| 1 | Aguilar; Ali Cavasonza; Ambrosi; Arruda; Attig; Aupetit e altri (2016). Precision Measurement of the Boron to Carbon Flux Ratio in Cosmic Rays from 1. | <http://link.aps.org/pdf/10.1103/PhysRevLett.117.231102> | link.aps.org→403 publikationen.bibliothek.kit.edu→200/html archive-ouverte.unige.ch→200/html |
| 1 | Gleeson; Axford (1968). Solar Modulation of Galactic Cosmic Rays. The Astrophysical Journal 154:1011 | <https://doi.org/10.1086/149822> | doi.org→405 |
| 1 | Pitzer (1973). Thermodynamics of electrolytes. I. Theoretical basis and general equations. The Journal of Physical Chemistry 77:268-277 | <https://escholarship.org/content/qt15n9h7zx/qt15n9h7zx.pdf?t=p2atsp> | escholarship.org→403 |
| 1 | SantaLucia (1998). A unified view of polymer, dumbbell, and oligonucleotide DNA nearest-neighbor thermodynamics. Proceedings of the National Academy o | <http://europepmc.org/pmc/articles/PMC19045> | www.ebi.ac.uk→500 europepmc.org→403 europepmc.org→403 |
| 1 | Radzicka & Wolfenden 1995 e seguito (PMC15745) | <https://pmc.ncbi.nlm.nih.gov/articles/PMC15745/> | www.ebi.ac.uk→500 |
| 1 | Frierson (2007). The Dynamics of Idealized Convection Schemes and Their Effect on the Zonally Averaged Tropical Circulation. Journal of the Atmospheri | <https://journals.ametsoc.org/downloadpdf/journals/atsc/64/6/jas3935.1.pdf> | journals.ametsoc.org→403 |
| 1 | Sundqvist; Berge; Kristjánsson (1989). Condensation and Cloud Parameterization Studies with a Mesoscale Numerical Weather Prediction Model. Monthly We | <http://journals.ametsoc.org/doi/pdf/10.1175/1520-0493%281989%29117%3C1641%3ACACPSW%3E2.0.CO%3B2> | journals.ametsoc.org→403 |
| 1 | Hartmann; Larson (2002). An important constraint on tropical cloud ‐ climate feedback. Geophysical Research Letters 29 | <https://onlinelibrary.wiley.com/doi/pdfdirect/10.1029/2002GL015835> | onlinelibrary.wiley.com→403 |

## 5. Collegamenti morti e copie d'archivio

Interrogata la Wayback Machine una volta per ogni indirizzo che ha risposto 404 o 410, più quelli segnalati nelle verifiche precedenti. Le copie d'archivio non sono state scaricate.

| Fonte | Indirizzo morto | Copia d'archivio |
|---|---|---|
| doi:10.1038/nature06153 | <http://doc.rero.ch/record/15548/files/PAL_E2960.pdf> | <http://web.archive.org/web/20251220090132/https://doc.rero.ch/record/15548/files/PAL_E2960.pdf> (istantanea 20251220) |
| doi:10.1038/nmicrobiol.2016.116 | <https://zenodo.org/record/3451085> | <http://web.archive.org/web/20191018153355/https://zenodo.org/record/3451085> (istantanea 20191018) |
| doi:10.1126/science.1131669 | <https://www.rug.nl/research/portal/en/publications/mesoscale-iron-enrichment-experiments-19932005(b2c9fef5-7a8c-45af-9588-4a7084f3dda9).html> | <http://web.archive.org/web/20210203232311/https://www.rug.nl/research/portal/en/publications/mesoscale-iron-enrichment-experiments-19932005(b2c9fef5-7a8c-45af-9588-4a7084f3dda9).html> (istantanea 20210203) |
| doi:10.1038/35016565 | <http://doc.rero.ch/record/15242/files/PAL_E2529.pdf> | <http://web.archive.org/web/20240917225059/https://doc.rero.ch/record/15242/files/PAL_E2529.pdf> (istantanea 20240917) |
| doi:10.1038/nrg.2016.39 | <https://diposit.ub.edu/dspace/bitstream/2445/194887/1/658052.pdf> | <http://web.archive.org/web/20250926000635/https://diposit.ub.edu/dspace/bitstream/2445/194887/1/658052.pdf> (istantanea 20250926) |
| url:jumars2000 | <https://digitalcommons.library.umaine.edu/sms_facpub/14> | <http://web.archive.org/web/20240422234928/https://digitalcommons.library.umaine.edu/sms_facpub/14/> (istantanea 20240422) |
| doi:10.1086/284621 (Penry e Jumars, copia Maine) | <https://digitalcommons.library.umaine.edu/sms_facpub/> | <http://web.archive.org/web/20260512072833/https://digitalcommons.library.umaine.edu/sms_facpub/> (istantanea 20260512) |
| url:werner1995 | <https://planetarygeoscience.uchicago.edu/doc/Werner_1995.pdf> | nessuna |
| doi:10.1038/nmicrobiol.2016.116 (Weiss 2016, Zenodo) | <https://zenodo.org/record/1036394> | nessuna |

Per il deposito dell'Università del Maine l'archivio ha la scheda di Jumars 2000 (istantanea dell'aprile 2024); se contenga anche il PDF non è stato controllato. Per il PDF di Werner 1995 e per la copia Zenodo di Weiss 2016 l'archivio non ha nulla.

## 6. Servizi: che cosa ha funzionato

| Servizio | Risposta | Utilità |
|---|---|---|
| Crossref (`/works/<DOI>`, ricerca per autore e anno) | 200; due 429 su circa 600 richieste | metadati per quasi tutti i DOI; due DOI scritti nelle note non risultano (Aitken 1985, `10.1016/0277-3791(87)90019-4`; Clapham e Miller 2011, `10.1073/pnas.1114193108`): vanno ricontrollati |
| OpenAlex senza indirizzo di posta | 200 | la fonte migliore per le copie aperte: 227 DOI su 510 |
| Semantic Scholar, interrogazione a lotti | 429 alla prima, 200 alla seconda | 500 DOI in due richieste; aggiunge gli identificativi arXiv |
| Europe PMC, ricerca | 200 | ottima anche per cercare una costante a testo pieno negli articoli aperti: così sono state trovate le triangolazioni di Io, Dunbar, Alexander |
| Europe PMC, `fullTextXML` | 200 per gli aperti, 500 per gli altri (68 su 82) | testo intero pulito |
| Europe PMC, pagina di lettura | 403 | nessuna |
| Deposito PMC su AWS | 200 | 51 dei 85 articoli PMC citati; testo già estratto |
| arXiv (`export.arxiv.org/pdf/…`) | 200, 61 su 61 | il canale più affidabile |
| HAL, OSTI, DOAJ (interfacce) | 200 | quasi nulla per queste fonti: 2 file da HAL, nessuno da OSTI |
| CORE v3 senza chiave | 429 subito, 200 dopo qualche minuto | funziona ma con un limite stretto; un solo riscontro fatto, senza risultati |
| Zenodo, NASA NTRS, USGS | 200 | NTRS e USGS servono i PDF (2 e 1 scaricati); Zenodo 410 su un file rimosso |
| Wayback Machine (`/wayback/available`) | 200 | 7 istantanee su 9 indirizzi |
| Scansioni ADS (`articles.adsabs.harvard.edu/pdf/…`) | 200 per ApJ e MNRAS vecchi (2 su 8 provati), 403 per il resto | scansioni senza testo |
| `raw.githubusercontent.com`, Wikipedia in wikitesto, JPL, PDG, Osservatorio di Parigi | 200 | codici di riferimento e tabelle |
| Ricerca nel codice di GitHub | risposta non valida attraverso il proxy | non usabile |
| Depositi istituzionali | 200 con PDF: Konstanz, CSIC, Caltech, UTS, UNAM, Illinois, hal.science; 403: eScholarship, UNM; 429: MIT, Harvard; solo pagina a script: EPFL, Zurigo, DTU, Helsinki | a macchia di leopardo |
| Editori | 403: Wiley, AMS, Cell Press, Science, PNAS, APS, OUP, SAGE, ACM, ScienceDirect; 202 senza contenuto: De Gruyter, figshare; 200: Springer (un PDF aperto), Nature (un PDF aperto), bioRxiv | anche quando l'articolo è aperto, non a un client dichiarato |
| `cds.cern.ch` | errore di connessione | — |

Le strade che restano: leggere le copie già scaricate (sezione 4); passare un riconoscimento dei caratteri sulle due scansioni ADS; usare la ricerca a testo pieno di Europe PMC in modo sistematico per le costanti delle note sulla vita; aprire da un browser le copie della seconda tabella della sezione 4.

## Appendice. Le fonti che non si ricostruiscono e da cui dipende qualcosa che va nel codice

Sono le fonti per cui servono parametri misurati o tabelle, non forme: nessuna derivazione le sostituisce e nessuna copia aperta è stata trovata o servita. In ordine di peso per il codice.

| N. | Riferimento | DOI | Che cosa serve esattamente | Dove |
|---|---|---|---|---|
| 1 | Solomatov e Moresi 2000, *J. Geophys. Res.* 105:21795 | <https://doi.org/10.1029/2000JB900197> | coefficienti originali della velocità e del numero di Nusselt a coperchio fermo (0,38·(Ra/θ)^(1/2) contro 0,05·(Ra/θ)^(2/3) nelle due letture) | interno §2; contraddizione A3 ancora aperta |
| 2 | Hirth e Kohlstedt 2003, *AGU Geophys. Monogr.* 138:83 | <https://doi.org/10.1029/138GM06> | tabella 1: righe dell'olivina idrata (A, r, E, V) e intervalli dei volumi d'attivazione; la riga secca è triangolata | interno §5 |
| 3 | Marone 1998, *Annu. Rev. Earth Planet. Sci.* 26:643 | <https://doi.org/10.1146/annurev.earth.26.1.643> | valori di laboratorio di a, b, D_c per litologia | interno §5 |
| 4 | Byerlee 1978, *Pure Appl. Geophys.* 116:615 | <https://doi.org/10.1007/BF00876528> | le due rette e il loro intervallo di validità | interno §5 |
| 5 | Klein e Hartmann 1993, *J. Climate* 6:1587 | <https://doi.org/10.1175/1520-0442(1993)006%3C1587:TSCOLS%3E2.0.CO;2> | la regressione stampata e la sua dispersione (dichiarato aperto, AMS risponde 403) | clima §3 |
| 6 | Fabjan e Gianotti 2003, *Rev. Mod. Phys.* 75:1243 | <https://doi.org/10.1103/RevModPhys.75.1243> | t_max, contenimento al 95%, λ_att ∝ E^0,13, E₀ per rame e piombo | particelle §3 |
| 7 | Burton e Walter 1987, *Geology* 15:111; McCulloch e altri 2012, *Nat. Clim. Change* 2:623 | <https://doi.org/10.1130/0091-7613(1987)15%3C111:RPRAAC%3E2.0.CO;2>; <https://doi.org/10.1038/nclimate1473> | polinomi k(T) e n(T) con le unità | materiali §1 |
| 8 | Govardovskii e altri 2000, *Vis. Neurosci.* 17:509 | <https://doi.org/10.1017/S0952523800174036> | banda β, modello per i pigmenti A2, intervallo di validità | sensi §2 |
| 9 | Farhadifar e altri 2007, *Curr. Biol.* 17:2095 | <https://doi.org/10.1016/j.cub.2007.11.049> | parametri adimensionali del modello a vertici e diagramma di fase | sviluppo §3 |
| 10 | Katul e altri 2005, *Am. Nat.* 166:368 | <https://doi.org/10.1086/432038> | parametri μ′, λ′ e σ del modello WALD | fisiologia §4.3 |
| 11 | Jetz e altri 2004, *Science* 306:266; Tamburello, Côté e Dulvy 2015, *Am. Nat.* 186:196 | <https://doi.org/10.1126/science.1102138>; <https://doi.org/10.1086/682070> | esponenti dell'area vitale per gruppo trofico | fisiologia §6.4 |
| 12 | Penry e Jumars 1987, *Am. Nat.* 129:69 | <https://doi.org/10.1086/284621> | equazioni dei tre reattori digestivi | fisiologia §3.1 |
| 13 | Heijnen e van Dijken 1992, *Biotechnol. Bioeng.* 39:833; Tijhuis e altri 1993, 42:509 | <https://doi.org/10.1002/bit.260390806>; <https://doi.org/10.1002/bit.260420416> | dissipazione per la crescita (1000 e 3500 kJ/C‑mol degli autotrofi) e mantenimento | fisiologia §1 |
| 14 | Gillooly e altri 2001, *Science* 293:2248 | <https://doi.org/10.1126/science.1061967> | costanti b₀ per gruppo e intervallo di E | fisiologia §1.4; vita §6 |
| 15 | Ho e altri 2003, *J. Phycol.* 39:1145 | <https://doi.org/10.1111/j.0022-3646.2003.03-090.x> | stechiometria elementare del fitoplancton, metalli compresi | fisiologia §2 |
| 16 | Nørskov e altri 2002, *J. Catal.* 209:275 | <https://doi.org/10.1006/jcat.2002.3615> | relazione lineare tra barriera ed energia di reazione (ricordo non confermato 0,87 e 1,34 eV) | quantistica §5 |
| 17 | Mayo, Olafson e Goddard 1990, *J. Phys. Chem.* 94:8897 | <https://doi.org/10.1021/j100389a010> | tabelle dei parametri DREIDING | quantistica §2 |
| 18 | Gosline e altri 1999, *J. Exp. Biol.* 202:3295, e 2002, *Phil. Trans. B* 357:121; Wegst e Ashby 2004, *Phil. Mag.* 84:2167 | <https://doi.org/10.1242/jeb.202.23.3295>; <https://doi.org/10.1098/rstb.2001.1022>; <https://doi.org/10.1080/14786430410001680935> | tabelle delle proprietà meccaniche dei materiali biologici (tabella 2.1 della nota) | materiali §2 |
| 19 | Cuffey e Paterson 2010, *The Physics of Glaciers*, 4ª ed. | ISBN 9780123694614 | tabella di A(T), oggi confermata solo su codice | clima §6 |
| 20 | Goldblatt, Lenton e Watson 2006, *Nature* 443:683 | <https://doi.org/10.1038/nature05169> | soglie della bistabilità dell'ossigeno | cellula §5 |

Le fonti chiuse di priorità A che non entrano nel codice, e tutte le B e le C, sono nel CSV con `esito_censimento` = «nessuna copia aperta trovata».
