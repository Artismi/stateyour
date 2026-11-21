# Chimica e origine della vita: reti in acqua, pori e camini, insiemi autocatalitici, vita in potenza — più emergente, collegata, continua nello zoom, rapida e precisa

Pannello: chimico fisico, chimico dei sistemi e ricercatore di chimica artificiale, astrobiologo, specialista di simulazione stocastica e HPC.

**Marche usate in queste note.**
- **[V]**: verificato sulla pagina della fonte, letta in questa sessione.
- **[Vs]**: verificato sull'abstract o sull'estratto che la ricerca ha restituito, non sul testo pieno.
- **[V-prec]**: verificato in una nota precedente del repo (`reports/` o `research_notes/`) e qui solo riletto.
- **[R]**: ricordato, non verificato in questa sessione. Il link è dato per comodità, va controllato.
- **[C]**: calcolato qui. **[codice]**: letto nel repo, file:riga.

**Struttura.** Ogni domanda ha le tre sezioni richieste. Dentro, i punti dell'obiettivo sono marcati così:
- (a) che cosa è scritto a mano: va nei *Cited Findings*, con file:riga;
- (b) la legge che lo sostituisce, (c) come calcolarla e con quale errore, (d) che cosa passa il padre e che cosa torna, (e) che cosa mostrare: vanno nelle *Inferences*;
- (f) le fonti sono in linea, nel punto dove servono.

**Nota sullo stato del codice (novembre 2026).** L'inventario (`reports/Inventario di cio che non emerge.md`, voce ML1) dice che «`molecole*.js` non è importato da nessuno». Oggi non è più vero: `reazioni.js` importa `molecole_rete`, `molecole_energia` e `mare.js`, e `mappa.js:27` e `mappa.js:760` aprono la chimica della finestra sotto il micron [codice: [mappa.js](/home/user/stateyour/src/camera/mappa.js), [finestre.worker.js](/home/user/stateyour/src/camera/finestre.worker.js)]. Restano veri i fili staccati verso l'alto: i flussi della scatola chimica non tornano al mare, all'aria o al suolo.

---

## 1. Costanti di velocità e termodinamica dalle leggi, non da tabelle battute a mano; generare le reti in modo automatico e coerente

### Takeaway
La termodinamica in acqua è già una regola sola e coerente: termini di legame tarati, idratazione, Legendre rispetto al solvente, bilancio dettagliato imposto. Il punto debole sono le **barriere**: una per famiglia, `INTRINSECHE`, più alcuni fattori di catalisi liberi (×30, 10^(1,5q)).

La sostituzione praticabile ha due livelli:
- **in linea**, relazioni lineari di energia libera con parametri per *sito*, non per famiglia: Mayr–Patz per le reazioni polari in soluzione, Evans–Polanyi/Blowers–Masel per i radicali, Brønsted per acidi e basi;
- **fuori linea**, una tabella compatta di correzioni ricavata da xTB, KinBot o AutoMeKin e dagli alberi di regole addestrati di RMG (SIDT), con un'incertezza per stima.

La generazione della rete resta quella di RMG, a regole e potata sul flusso, che il codice già imita. Va estesa ai siti di superficie e ai radicali.

### Cited Findings
**(a) Che cosa è scritto a mano nel codice**
- Una barriera intrinseca di Marcus **per famiglia** di reazione (addizione 85, sostituzione 135, tautomeria 100, idrogenazione 230, idrogenazione su metallo 105 kJ/mol…). Ognuna è presa da una sola velocità misurata; per le famiglie senza voce vale 100 kJ/mol — [molecole_reazioni.js:33-48, :277](/home/user/stateyour/src/camera/molecole_reazioni.js) [codice]. Il rapporto precedente lo stima così: «10 kJ/mol = fattore 50» sulla velocità (ML4) — [Inventario](/home/user/stateyour/reports/Inventario%20di%20cio%20che%20non%20emerge.md) [codice].
- **Catalisi con parametri liberi** — [molecole_reazioni.js:235-254](/home/user/stateyour/src/camera/molecole_reazioni.js) [codice]:
  - lo ione metallico moltiplica per 10^(1,5·carica), «PARAMETRO LIBERO»;
  - qualunque minerale moltiplica per 30 le addizioni e le sostituzioni, «PARAMETRO LIBERO»;
  - quali minerali sono «metalli d» lo decide un'espressione regolare sul *nome* (`METALLI_D`, riga 241).
- **Omolisi e ricombinazione**: prefattore ×30 e k = 10¹⁰ L/mol/s fissi — [molecole_reazioni.js:273-274](/home/user/stateyour/src/camera/molecole_reazioni.js) [codice].
- **Soglie della rete**: ΔG massimo 60 kJ/mol, k minima 10⁻¹⁶ s⁻¹, «piccole = 3», ε di flusso 10⁻³ — [molecole_rete.js:44, :50](/home/user/stateyour/src/camera/molecole_rete.js) [codice]. La finestra dell'app usa `profondita = 2` e `atomiMassimi = 6` ([reazioni.js:509](/home/user/stateyour/src/camera/reazioni.js)); `sistema` di suo usa 8 ([reazioni.js:109](/home/user/stateyour/src/camera/reazioni.js)) [codice]. Il rapporto sulla vita nota che 8 atomi pesanti bastano per la glicina, non per l'AMP (23) né per l'acido decanoico (12) — [Regole per la vita in potenza](/home/user/stateyour/reports/Regole%20per%20la%20vita%20in%20potenza.md) [codice].
- **Entalpie**: 75 termini di legame ai minimi quadrati da 89 molecole, idratazione da 70 (ML8); errore dichiarato 7–11 kJ/mol sulle molecole piccole — [molecole_energia.js:5-9](/home/user/stateyour/src/camera/molecole_energia.js), [Come farlo emergere §11](/home/user/stateyour/reports/Come%20farlo%20emergere.md) [codice].
- **La parte già fatta bene: il bilancio dettagliato è imposto.** Si tiene la k misurata dell'idrolisi e la condensazione segue da k₊/k₋ = exp(−Δg), con una tabella sola di energie, così i cicli tornano a zero (Wegscheider). Le discrepanze con i ΔG misurati sono contate in `nonTorna.energie` — [reazioni.js:139-143](/home/user/stateyour/src/camera/reazioni.js) [codice].
- **Prebiotica di `chimica.js`**: è una curva empirica di Miller–Urey con `RESA_OSSIDATA`, `MEZZA_RESA = 0,3` e `SOGLIA_FORMOSIO = 0,01`, e alimenta HCN e formaldeide della finestra moltiplicata per `SCALA_PREBIOTICA = 10⁻³` — [chimica.js:703-712](/home/user/stateyour/src/camera/chimica.js), [reazioni.js:86, :445](/home/user/stateyour/src/camera/reazioni.js) [codice].

**Generatori di reti e regole di velocità (fonti esterne)**
- **RMG** costruisce meccanismi di passi elementari da regole e modelli di reazione. La base dati ha 92 librerie cinetiche, circa 21 000 reazioni in tutto, e schemi di regole per 87 classi di reazione — [ORNL, RMG Database for Chemical Property Prediction](https://impact.ornl.gov/en/publications/rmg-database-for-chemical-property-prediction/) [Vs]. Articolo di riferimento: Gao, Allen, Green e West 2016, Comput. Phys. Commun. 203, 212 — [ADS](https://ui.adsabs.harvard.edu/abs/2016CoPhC.203..212G) [Vs].
- **Licenze RMG**:
  - il codice RMG-Py è sotto licenza MIT, «Copyright (c) 2002-2026 Prof. William H. Green, Prof. Richard H. West and the RMG Team» — [LICENSE.txt di RMG-Py](https://raw.githubusercontent.com/ReactionMechanismGenerator/RMG-Py/main/LICENSE.txt) [V];
  - per la base dati non ho trovato un file di licenza nei rami `main` e `master`: vedi *Gaps*.
- **SIDT, gli alberi di regole addestrati** (Johnson e Green 2024). Le regole fatte a mano di RMG hanno due difetti: vanno costruite e aggiornate a mano, e la loro precisione dipende dalla forma dell'albero assunta. Gli alberi di decisione isomorfi per sottografo sono addestrati in modo automatico, leggibili, danno un'incertezza per ogni stima convalidata contro gli errori veri, e migliorano la precisione in tutte e cinque le famiglie provate. Articolo aperto CC BY 3.0; i dati stanno nei repository RMG-Py e RMG-database — [React. Chem. Eng. 2024, D3RE00684K](https://pubs.rsc.org/en/content/articlehtml/2024/re/d3re00684k) [Vs].
- **Genesys** (Vandewiele, Van Geem, Reyniers e Marin 2012, Chem. Eng. J. 207, 526) genera reti di reazioni elementari da famiglie definite dall'utente, con librerie di chemoinformatica come il Chemistry Development Kit. Ha criteri di arresto a regole e a velocità. Non ho confermato il linguaggio né la licenza — [core.ac.uk](https://core.ac.uk/download/132630415.pdf), [AIChE 2017](https://proceedings.aiche.org/conferences/aiche-annual-meeting/2017/proceeding/paper/571d-first-principles-based-automated-kinetic-model-generation-using-on-fly-ab-initio-calculations) [Vs].
- **AutoMeKin2021** (J. Comput. Chem. 42, 2036) trova gli stati di transizione con dinamica molecolare e algoritmi sui grafi, partendo da una sola struttura XYZ, interfacciato con MOPAC2016, Entos Qcore e Gaussian. È dichiarato «open source», ma la licenza del codice non risulta: l'articolo è CC BY-NC-ND — [arXiv 2105.03078](https://arxiv.org/abs/2105.03078v1) [Vs].
- **KinBot** (Sandia) è sotto licenza BSD a 3 clausole, «Copyright (c) 2018, National Technology & Engineering Solutions of Sandia» — [LICENSE di KinBot](https://raw.githubusercontent.com/zadorlab/KinBot/master/LICENSE) [V].
- **xTB/GFN2** è sotto LGPL-3 — [COPYING.LESSER](https://raw.githubusercontent.com/grimme-lab/xtb/main/COPYING.LESSER) [V-prec, da `Come farlo emergere.md` §11].

**Basi dati termochimiche e loro licenze**
- **NIST.** I dati SRD del NIST (che comprendono la Chemistry WebBook) sono protetti da copyright degli Stati Uniti secondo il 15 U.S.C. § 290e, «All rights reserved». Non c'è un diritto generale di ridistribuzione: i termini sono per prodotto, su nist.gov/srd — [NIST, Copyright, Fair Use, and Licensing Statements for SRD](https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications) [V]. La pagina della WebBook rimanda a questa dichiarazione — [webbook.nist.gov](https://webbook.nist.gov/chemistry/) [V].
- **ATcT** (Argonne) pubblica i valori come insieme di dati con DOI su OSTI (ver. 1.124, 2022) e rende pubbliche circa 2 800 specie. Non ho trovato i termini d'uso — [OSTI 1885923](https://www.osti.gov/dataexplorer/biblio/dataset/1885923), [atct.anl.gov](https://atct.anl.gov/) [Vs].

**Leggi di riferimento (ricordate)**
- **Additività di gruppo di Benson**: ΔH_f ≈ Σ valori di gruppo + correzioni (anello, gauche, simmetria); per le molecole organiche in fase gas l'errore tipico è di pochi kJ/mol — [Benson e Buss 1958, J. Chem. Phys. 29, 546](https://doi.org/10.1063/1.1744539) [R].
- **Evans–Polanyi**: E_a = E₀ + α·ΔH_r, con 0 ≤ α ≤ 1 (≈ 0,5 vicino a ΔH = 0); le relazioni BEP sono la stessa forma — [Evans e Polanyi 1938, Trans. Faraday Soc. 34, 11](https://doi.org/10.1039/TF9383400011) [R]. Il codice ha già Blowers–Masel per confronto ([molecole_reazioni.js:260-266](/home/user/stateyour/src/camera/molecole_reazioni.js)) [codice].
- **Mayr–Patz**: log k(20 °C) = s_N·(N + E), con N ed s_N per nucleofilo ed E per elettrofilo (più di mille composti in una base dati in rete). Copre le reazioni polari in soluzione, dove le regole di RMG, nate per la combustione, sono deboli — [Mayr e Patz 1994, Angew. Chem. Int. Ed. 33, 938](https://doi.org/10.1002/anie.199409381); [Mayr's Database of Reactivity Parameters](https://www.cup.lmu.de/oc/mayr/reaktionsdatenbank/) [R; termini d'uso non verificati].
- **Contributo di componente / eQuilibrator** (Noor e altri 2013): ΔG′° in acqua a pH e forza ionica dati, per i metaboliti, con incertezza — [PLoS Comput. Biol. 9, e1003098](https://doi.org/10.1371/journal.pcbi.1003098); [equilibrator.weizmann.ac.il](https://equilibrator.weizmann.ac.il/) [R; licenza da verificare].

### Inferences
- **(b) Le barriere: da una per famiglia a una legge per sito.** ΔG‡ = ΔG₀‡(sito)·(1 + ΔG/4ΔG₀‡)², come oggi, ma con ΔG₀‡ che dipende dal sito:
  - **reazioni polari** (addizioni, aldoliche, cianidrine, Strecker, Michael): Mayr–Patz, log k = s_N(N + E). N ed E si ricavano dall'indice di elettrofilia o dalla nucleofilia che `molecole_energia` sa già stimare (pKa, carica parziale, energia dell'orbitale da Hückel/QEq), tarati una volta sui valori di Mayr. In acqua con s_N ≈ 0,6–1 [R], un errore su N + E di 1 unità vale un fattore 4–10 su k [C];
  - **trasferimenti di protone**: Brønsted / Eigen, già nel codice;
  - **radicali**: Evans–Polanyi con α e E₀ per classe;
  - **superfici**: vedi il punto 3.
  
  La forma quadratica di Marcus resta, ed è ciò che tiene il bilancio dettagliato per costruzione: ΔG‡₊ − ΔG‡₋ = ΔG.
- **(b) Le costanti libere di catalisi diventano meccanismi.**
  - Lo ione metallico diventa un **passo esplicito**: M + S ⇌ MS (K da `logKComplesso`), poi MS → MP con la barriera abbassata da Marcus sulla carica trasferita, poi MP ⇌ M + P. Così la catalisi è stechiometria e i rilevatori (RAF, nuclei) la vedono senza etichetta.
  - Il «×30 di superficie» diventa adsorbimento di Langmuir sui siti veri del reticolo (`molecole_incontri.superficie(ret)`, [molecole_incontri.js:95-108](/home/user/stateyour/src/camera/molecole_incontri.js) [codice]) con θ = Kc/(1+Kc), e la reazione di superficie diventa Langmuir–Hinshelwood, r = k_s·Γ_max·θ_A·θ_B [R: [Langmuir 1918](https://doi.org/10.1021/ja02242a004)]. Il fattore di concentrazione allora **emerge**: Γ_max·(A/V)/c.
- **(c) La tabella fuori linea.**
  - Un insieme di 10³–10⁴ reazioni tipo, generato dalle stesse regole di `molecole_reazioni.js`, con barriere GFN2-xTB (LGPL-3, da usare come strumento, non incorporato) o KinBot (BSD-3). Su questi si addestra un albero SIDT (MIT come RMG-Py) che dà, per ogni sito, una correzione ΔΔG₀‡ e la sua incertezza σ.
  - In linea si legge l'albero: profondità di 10–20 nodi, cioè 10–20 confronti di sottografo per reazione, microsecondi [C, stima].
  - Errore atteso: GFN2-xTB sulle barriere organiche sbaglia di ~10–20 kJ/mol [R], cioè un fattore 50–3000 su k a 298 K [C]. È più o meno l'errore di oggi, ma *sito per sito* invece che famiglia per famiglia, e dichiarato.
  - Più utile: le correzioni SIDT addestrate su k **misurate** in acqua (Mayr, Bell, Guthrie) e non solo su calcoli.
- **(c) Il budget.** Ogni stima porta la sua σ_lnk. La rete può propagare l'incertezza alle concentrazioni stazionarie con la sensibilità del sistema lineare che `attiveNelTempo` già linearizza (κ_j), cioè ∂ln c/∂ln k_j, e dire «questa specie a ±1 decade». Senza Monte Carlo [inferenza].
- **(c) Le basi dati.**
  - NIST SRD ha tutti i diritti riservati: si usa **solo per convalidare**, non si incorpora in blocco.
  - ATcT e la base dati di RMG vanno usate solo dopo aver verificato i termini.
  - La via più pulita per la licenza è **tarare i propri termini di legame/gruppo** sulle misure (lo si fa già) e confrontare con NIST e ATcT nelle prove.
- **(d) Che cosa passa il padre.** T, pH, forza ionica (per i coefficienti di attività: Davies, o Pitzer se la salinità è alta), a_w, i cationi uno per uno, i minerali con la loro area per volume (vedi punto 3), la luce per banda. Le k sono **funzioni di queste condizioni**, mai costanti: la cache si chiave su (famiglia, sito, T arrotondata, pH, I).
- **(e) Che cosa mostrare.** Nella scheda di una reazione, l'origine di ogni k: «Mayr N + E», «misurata (Ross e Deamer)», «xTB+SIDT ± σ». Sulla vista, l'incertezza si rende come *sfocatura* della velocità degli eventi (punto 2), non come numero nascosto.

### Gaps
- **Licenza della base dati RMG** (gruppi termochimici, regole di velocità): non trovato un file di licenza su GitHub (`main` e `master` danno 404). Il campo «CC BY 4.0» del record DSpace riguarda l'articolo, non i dati.
- **Licenze di ATcT, AutoMeKin, Genesys, Mayr DB ed eQuilibrator**: non verificate.
- **Errore di Mayr–Patz in acqua per le aldoliche del formosio e per le cianidrine**: non ho trovato una valutazione sistematica; [R] dice entro un fattore 10–100 per molte reazioni polari, da verificare.
- **Errore effettivo di GFN2-xTB sulle barriere in acqua** con solvente implicito: valore ricordato, non verificato.

---

## 2. Simulazione stocastica e deterministica rapida; determinismo per indirizzo; reazione–diffusione nello spazio

### Takeaway
Il motore di `reazioni.js` è già esatto ed efficiente: SSA diretto, albero di somme parziali O(log C), dipendenze in CSR, insiemi in equilibrio veloce. Ha due limiti strutturali:
1. Due serie di tiri **globali** («quando», «quale») indicizzate dal numero di passo, così ogni espansione pigra della rete o ogni nuovo canale cambia *tutta* la storia successiva.
2. Una scatola sola ben mescolata, senza spazio.

Le scelte giuste sono quattro:
- (i) la **rappresentazione con processi di Poisson a tasso unitario per canale** (Anderson 2007), con il flusso di tiri chiamato col nome canonico della reazione. La storia diventa stabile quando la rete cresce;
- (ii) il **tau-leaping con ponte di Poisson** (conteggi divisi in due per binomiale). Dà continuità esatta nello zoom *temporale*;
- (iii) per lo **spazio**, un RDME a sottovolumi (NSM, o multiparticella su GPU come Lattice Microbes) con conteggi interi e generatore a contatore. Così è bit-esatto su ogni scheda;
- (iv) sopra il micron, **ODE + approssimazione di rumore lineare** (LNA), che dà medie e covarianze per disegnare fluttuazioni della taglia fisica giusta.

### Cited Findings
**(a) Il motore com'è oggi** [codice, [reazioni.js](/home/user/stateyour/src/camera/reazioni.js)]
- Gillespie diretto con Δt = −ln(1−u)/a₀ e la reazione scelta dall'albero di somme. I tiri sono l'estrazione k-esima di `…/chimica/quando` e `…/chimica/quale`: [reazioni.js:204-210, :227-232](/home/user/stateyour/src/camera/reazioni.js).
- La rete pigra `S.espandi` ricostruisce i canali ([reazioni.js:115](/home/user/stateyour/src/camera/reazioni.js)). Con i tiri indicizzati da k, ogni canale nuovo sposta la scelta di tutti i passi successivi.
- Gli insiemi in equilibrio veloce valgono solo per le reazioni **1 ⇌ 1** con lo stesso contenuto atomico (SSA a scala lenta di Cao, Gillespie e Petzold 2005): [reazioni.js:152-160](/home/user/stateyour/src/camera/reazioni.js).
- Una **sola** costante di diffusione, D = 10⁻⁹ m²/s, per tutte le specie (dichiarata [R]); il ricambio della finestra è 6D/L²; la scatola è ben mescolata: [reazioni.js:86, :450](/home/user/stateyour/src/camera/reazioni.js).
- Il «bagno» rende fisse le specie che il bordo rinnova più in fretta della risoluzione: [reazioni.js:171-177](/home/user/stateyour/src/camera/reazioni.js).
- Il **tetto** degli eventi (`massimo = 2·10⁴` nella finestra dell'app) e `adatta` accorciano il tempo guardato invece di accelerare: [reazioni.js:262, :507-510](/home/user/stateyour/src/camera/reazioni.js).
- Gli eventi rari si trattano con FFS (Allen, Warren e ten Wolde 2005), una prova per indirizzo: [reazioni.js:407-425](/home/user/stateyour/src/camera/reazioni.js).

**Metodi (fonti esterne)**
- **MNRM, il metodo della reazione successiva modificato** (Anderson 2007, J. Chem. Phys. 127). I tempi di inizio delle reazioni sono i tempi di scatto di **processi di Poisson indipendenti a tasso unitario**, con orologi interni pari alle propensioni integrate; regge propensioni che dipendono dal tempo e i ritardi; un numero casuale per passo — [arXiv 0708.0370](https://arxiv.org/abs/0708.0370) [V, abstract]. La forma X(t) = X(0) + Σ_k Y_k(∫₀ᵗ a_k(X(s))ds)·ν_k è la rappresentazione a cambio di tempo casuale (Kurtz), citata nell'articolo come nota in matematica [Vs per il concetto; formula R].
- **Tau-leaping** (Cao, Gillespie e Petzold 2006, J. Chem. Phys. 124, 044109): un'approssimazione di Poisson salta molti eventi; è accurata finché nessuna propensione cambia «significativamente» in un passo τ — [record bibliografico](https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_miscellaneous_67632469), [CCDC UCSB](https://www.ccdc.ucsb.edu/publications/13871) [Vs]. La selezione di τ di quell'articolo è τ = min_i{ max(ε·x_i/g_i, 1)/|μ_i|, max(ε·x_i/g_i, 1)²/σ_i² } — [R].
- **R-leaping** (Auger, Chatelain e Koumoutsakos 2006, J. Chem. Phys. 125, 084103): salta un numero prefissato di eventi distribuiti tra i canali con binomiali correlate, e il campionamento non dipende dall'ordine dei canali — [CSE-lab, Harvard](https://cse-lab.seas.harvard.edu/sites/projects.iq.harvard.edu/files/cse-lab/files/research_numerics_assa_1_auger2006a.pdf) [Vs].
- **Propensioni parziali (PDM, SPDM)** (Ramaswamy, González-Segredo e Sbalzarini 2009, J. Chem. Phys., DOI 10.1063/1.3154624): costo al più lineare nel numero di **specie**, comunque siano accoppiate le reazioni. Esistono la variante a composizione–rifiuto (PSSA-CR, 2010) e quella spaziale su reticolo (PSRD, 2011) — [arXiv 0906.1992](https://arxiv.org/abs/0906.1992) [V, abstract]; [MPI-CBG](https://publications.mpi-cbg.de/Ramaswamy_2011_4832.pdf) [Vs].
- **NSM, il metodo del sottovolume successivo** (Elf ed Ehrenberg 2004, IEE Proc. Syst. Biol. 1, 230): Monte Carlo esatto per la master equation di reazione–diffusione, imparentato con il metodo della reazione successiva di Gibson e Bruck, che tiene traccia di *in quale sottovolume* avviene il prossimo evento — [Typeset PDF](https://typeset.io/pdf/spontaneous-separation-of-bi-stable-biochemical-systems-into-59v4vsiwm8.pdf) [Vs].
- **Lattice Microbes (GPU)** (Roberts, Stone e Luthey-Schulten 2013, J. Comput. Chem.):
  - campiona l'RDME su GPU NVIDIA, due ordini di grandezza più rapido del campionamento esatto per sistemi grandi, con accuratezza ~0,1%;
  - diffusione multiparticella di Chopard (gas su reticolo) più Gillespie dentro ogni sottovolume;
  - licenza University of Illinois Open Source License (permissiva) per la versione 2.3; quella delle versioni nuove non è verificata.
  
  Fonti: [pagina di Lattice Microbes](https://luthey-schulten.chemistry.illinois.edu/lm/index.html), [PMC4039640](https://pmc.ncbi.nlm.nih.gov/articles/PMC4039640), [Zenodo v2.4](https://zenodo.org/records/5780138) [Vs].
- **Ricordati, da verificare**:
  - SSA a scala lenta — [Cao, Gillespie e Petzold 2005, J. Chem. Phys. 122, 014116](https://doi.org/10.1063/1.1824902) [R; citato nel codice];
  - ibrido SSA/ODE — [Haseltine e Rawlings 2002, J. Chem. Phys. 117, 6959](https://doi.org/10.1063/1.1505860); [Salis e Kaznessis 2005, J. Chem. Phys. 122, 054103](https://doi.org/10.1063/1.1835951) [R];
  - composizione–rifiuto O(1) — [Slepoy, Thompson e Plimpton 2008, J. Chem. Phys. 128, 205101](https://doi.org/10.1063/1.2919546) [R];
  - approssimazione di rumore lineare — [Elf ed Ehrenberg 2003, Genome Res. 13, 2475](https://genome.cshlp.org/content/genome/13/11/2475.full.pdf) [R per il contenuto];
  - accoppiamento multilivello dei processi di Poisson — [Anderson e Higham 2012, Multiscale Model. Simul. 10, 146](https://doi.org/10.1137/110840546) [R];
  - limite inferiore della maglia dell'RDME — [Isaacson 2009, SIAM J. Appl. Math. 70, 77](https://doi.org/10.1137/070705039); [Erban e Chapman 2009, Phys. Biol. 6, 046001](https://doi.org/10.1088/1478-3975/6/4/046001) [R];
  - particelle con funzioni di Green — [van Zon e ten Wolde 2005, PRL 94, 128103](https://doi.org/10.1103/PhysRevLett.94.128103) [R];
  - Smoldyn — [Andrews e Bray 2004, Phys. Biol. 1, 137](https://doi.org/10.1088/1478-3967/1/3/001) [R];
  - generatori a contatore Philox/Threefry — [Salmon e altri 2011, SC11](https://doi.org/10.1145/2063384.2063405) [R]. L'inventario li chiede già (CS7) [codice].

### Inferences
- **(b, c) Il determinismo che regge la crescita della rete: MNRM con flussi per canale.** Ogni canale j (andata o ritorno di una reazione, o un ingresso o un'uscita dal bordo) ha il **suo** flusso di tiri Exp(1), con nome canonico: `…/chimica/canale/<reagenti ordinati>><prodotti ordinati>/<verso>/<n-esimo scatto>`.
  - L'orologio interno T_j = ∫a_j dt avanza; il canale scatta quando T_j raggiunge P_j, la somma dei suoi Exp(1).
  - Aggiungere un canale (`espandi`) **non cambia** i tiri degli altri. Cambia la loro storia solo dove la nuova reazione cambia davvero i numeri. È lo stesso principio di `albero_vita.js` (ogni evento ha il suo indirizzo, in qualunque ordine si chieda) e soddisfa «deterministico per indirizzo» senza dipendere dall'ordine dei canali.
  - Costo: O(log C) per evento con una coda a priorità indicizzata (heap), come oggi con l'albero di somme.
  - Un vantaggio in più: due storie che differiscono per un parametro (un sale, un minerale) usano **numeri casuali comuni**, e le differenze che si vedono sono effetti, non rumore [inferenza dall'abstract di Anderson + R].
- **(b, c) La continuità nello zoom del tempo: tau-leap con ponte di Poisson.**
  - A grande scala temporale (una pozza in un anno) si calcola per ogni canale il **numero** di eventi in [t, t+τ]: K_j ~ Poisson(a_j·τ), dal flusso `…/canale j/intervallo (livello, indice)`.
  - Se l'osservatore zooma su [t, t+τ/2], i conteggi delle due metà si ottengono **condizionati**: K_j,sx ~ Binomiale(K_j, ½) da un tiro con indirizzo (canale, intervallo figlio), e K_j,dx = K_j − K_j,sx.
  - Le somme tornano esattamente a ogni livello. È esatto per propensioni costanti nell'intervallo, ed è lo stesso schema dell'albero di blocchi di `albero_vita.js`.
  - Con propensioni che dipendono dallo stato l'esattezza si perde; la toppa è l'accoppiamento di Anderson e Higham [R]: si scompone il processo fine in parte comune e differenza, così il livello fine si discosta dal grossolano solo per la parte di differenza.
  - Errore: quello del tau-leap a livello grossolano. La selezione di Cao 2006 lo tiene sotto ε ≈ 0,03 di variazione relativa delle propensioni [R]. I livelli fini **correggono** senza contraddire le somme.
- **(c) Generalizzare gli insiemi veloci (riga 152) oltre 1 ⇌ 1.**
  - Si partizionano le reazioni con κ_j·τ_ris ≫ 1 (lo si calcola già in `attiveNelTempo`). Il sottosistema veloce si risolve all'equilibrio vincolato con il Newton di `equilibrio()` (righe 311-342), che c'è già, e lo stato lento sono le sue conservazioni.
  - È l'SSA a scala lenta generale. Per reazioni non 1 ⇌ 1 la distribuzione condizionata non è più esatta in forma chiusa: si usa la media, con errore O(Ω⁻¹) [R].
  - Guadagno atteso: le idratazioni, le tautomerie e i trasferimenti di protone (10³–10¹⁰ s⁻¹) escono dal ciclo degli eventi. Con loro esce gran parte del tetto dei 2·10⁴ eventi che oggi accorcia il tempo guardato [C, dalle velocità in `INTRINSECHE`: protone 10 kJ/mol ⇒ k ~ 10¹¹ s⁻¹].
- **(c) Il regime ibrido per taglia.** Ω = N_A·V (molecole per mol/L) [C]:

  | lato | volume | Ω | 1 µM è | 1 mM è |
  |---|---|---|---|---|
  | 1 mm | 1 µL | 6·10¹⁷ | 6·10¹¹ molecole | 6·10¹⁴ molecole |
  | 10 µm | 1 pL | 6·10¹¹ | 6·10⁵ | 6·10⁸ |
  | 1 µm | 1 fL | 6·10⁸ | 600 | 6·10⁵ |
  | 100 nm (V di default di `motore`) | 1 aL | 6·10⁵ | 0,6 | 600 |

  Regola di partizione (Haseltine–Rawlings / Salis–Kaznessis, [R]): un canale è «continuo» se a_j·Δt > ~100 e i suoi reagenti hanno più di ~100 molecole; altrimenti si tratta con l'SSA esatto. Le specie continue evolvono con le ODE (o con l'equazione di Langevin chimica).
  - Sopra i ~10 µm tutto è continuo.
  - Sotto i ~100 nm quasi tutto è discreto, tranne acqua e bagno.
  - In mezzo c'è l'ibrido: le specie del cibo sono continue, i prodotti rari discreti, ed è lì che emerge un nucleo autocatalitico.
- **(b, c) LNA per disegnare le fluttuazioni sopra il micron.**
  - Media: dc/dt = S·v(c).
  - Covarianza: dΣ/dt = JΣ + ΣJᵀ + Ω⁻¹·S·diag(v)·Sᵀ [R].
  - Allo stato stazionario è un'equazione di Lyapunov, O(n³): per n = 100 specie, ~10⁶ operazioni, sotto il millisecondo in JS [C].
  - Correlazione spaziale: lunghezza ℓ_j = √(D_j/κ_j). Le fluttuazioni si disegnano come campo gaussiano con quella covarianza e quella correlazione: la «grana» della concentrazione sullo schermo ha la taglia fisica vera, non un rumore scelto [inferenza].
- **(b) Diffusione per specie, non una sola D.**
  - Stokes–Einstein: D = k_BT/(6πηr_H), con r_H dal volume molecolare di `molecole_forma` e η(T) dell'acqua. Per r = 0,3 nm a 298 K, D ≈ 8·10⁻¹⁰ m²/s [C].
  - Il limite di diffusione di Smoluchowski: k_D = 4π(D_A + D_B)·R·N_A; con D = 10⁻⁹ ciascuna e R = 0,5 nm, k_D ≈ 7,6·10⁹ L/mol/s [C]. Combinato con la barriera (Collins–Kimball), k = k_D·k_att/(k_D + k_att) [R: [Collins e Kimball 1949](https://doi.org/10.1016/0095-8522(49)90023-9)].
  - Sostituisce il `1e10` fisso della ricombinazione ([molecole_reazioni.js:274](/home/user/stateyour/src/camera/molecole_reazioni.js)) e corregge i limiti di velocità a viscosità e temperatura diverse (una salamoia in evaporazione, un camino a 100 °C).
- **(b, c) Spazio: un RDME a sottovolumi, con il limite della maglia.**
  - Per una reazione bimolecolare con costante k (per molecola, m³/s) la maglia deve essere h ≫ k/(D_A + D_B). Per k = 10⁹ L/mol/s, cioè 1,7·10⁻¹⁸ m³/s, e D = 2·10⁻⁹ m²/s, h ≫ 0,8 nm [C, condizione R da Isaacson/Erban–Chapman].
  - Le reazioni chimiche lente (k ≪ 10⁶ L/mol/s) sono sicure fino a pochi nanometri: l'RDME va bene dal millimetro a ~10 nm. Sotto serve la dinamica a particelle (Smoldyn, GFRD) o la dinamica molecolare che c'è (`scenaNano`, acqua mW).
  - Nel JS: NSM sulla CPU per meno di ~10⁴ voxel; multiparticella su **WebGPU** (in Chromium, quindi in Electron) per 10⁵–10⁷ voxel. Ogni voxel tiene conteggi interi per specie; la diffusione è una suddivisione multinomiale verso i 6 vicini; le reazioni sono un passo di tau-leap per voxel; i tiri vengono da Philox(voxel, passo, specie).
  - Con aritmetica **intera** il risultato è bit-identico su ogni GPU. Le riduzioni in virgola mobile no: vanno evitate o fatte in ordine fisso [inferenza; WebGPU R: [W3C WebGPU](https://www.w3.org/TR/webgpu/)].
  - La fonte (Lattice Microbes) dà ~0,1% di accuratezza e due ordini di grandezza di velocità [Vs]: è l'ordine da aspettarsi.
- **(c) Propensioni parziali.** Servono quando le coppie bimolecolari crescono come N²: rete con 10³–10⁴ specie e «piccole × tutte». Il costo è O(N) per evento [V, abstract]. Con meno di 10³ canali l'albero di somme di oggi è già sufficiente: è un miglioramento da tenere per le reti a `atomiMassimi` ≥ 20.
- **(d) Che cosa passa il padre e che cosa torna.**
  - **Giù**: le concentrazioni di bordo c_b e i loro gradienti; T(x) e la sua gradiente (termoforesi, punto 3); a_w(t); i minerali come superfici con area A (vedi punto 5); e i **conteggi condizionati** (punto 5: suddivisione multinomiale).
  - **Su**: per specie, il flusso netto J_i = (uscite − entrate)/(V·t) (oggi `storia` conta solo `bordo.entrate/uscite` in totale, [reazioni.js:265, :271](/home/user/stateyour/src/camera/reazioni.js) [codice]: va diviso per specie); il calore Q̇ = −Σ_j ΔH_j·(v₊ − v₋); l'entropia prodotta (c'è già, `entropia.perSecondo`).
- **(e) Che cosa mostrare.**
  - Sopra i 10 µm: i campi di concentrazione (mappa per specie scelta), con la grana LNA.
  - 10 µm–100 nm: i voxel RDME, ogni evento come una scintilla del colore della famiglia di reazione, alla posizione del voxel e al tempo del suo scatto MNRM. Con il tau-leap gli eventi di un passo si distribuiscono **uniformemente nel passo**: dati K, i tempi sono uniformi ordinati (statistica d'ordine, esatta per Poisson omogeneo [R]), con indirizzo, così l'animazione è continua.
  - Sotto i 10 nm: molecole e atomi (`scenaNano`).

### Gaps
- Non ho trovato una misura pubblicata di quanto costi l'MNRM con flussi per canale *indirizzati per nome* rispetto all'SSA diretto in JavaScript: va misurato. La stima O(log C) viene dalla struttura.
- Non ho trovato un'implementazione WebGPU pubblicata dell'RDME: Lattice Microbes è CUDA. La portabilità a WebGPU è un'inferenza.
- La selezione di τ di Cao 2006 e le regole di partizione ibrida sono ricordate, non lette.

---

## 3. Far emergere la chimica che si mantiene: RAF, nuclei autocatalitici, organizzazioni, formosio, Krebs inverso, catalisi minerale ai camini, cicli bagnato–secco, vescicole. Quali leggi minime bastano?

### Takeaway
Il codice ha già la parte difficile: rete da regole, bilancio dettagliato, chemostati con potenziali incompatibili, rilevatori passivi RAF/Blokhuis/membrane/copie. Ma tre cose sono **etichette** e non meccanismi:
1. La catalisi nei RAF: «ioni e minerali del luogo» è un catalizzatore generico, ed è anche nel cibo.
2. Le superfici: ×30 a nome.
3. Le vescicole: CMC del singolo anfifilo, anche se le note correggono che serve la miscela e la soglia dei cationi.

Per far *emergere* invece che *scrivere* bastano sei leggi:
- (1) conservazione e bilancio dettagliato, che c'è;
- (2) chemostati e sorgenti fuori equilibrio come flussi veri (redox, luce, calore), in parte c'è;
- (3) **la catalisi come passi elementari espliciti**, ioni e siti di superficie come specie conservate;
- (4) **adsorbimento di Langmuir su siti finiti** del reticolo vero;
- (5) **termodinamica di aggregazione della miscela** di anfifili, con i cationi, e vescicole come oggetti stocastici che crescono e si dividono per geometria;
- (6) **trasporto che concentra**: termoforesi nei pori, evaporazione con conservazione del soluto, gelo.

I rilevatori (maxRAF, nuclei di Blokhuis, organizzazioni COT) restano solo occhi. I risultati di laboratorio (Preiner 2020, Muchowska 2019, il formosio di Breslow) diventano **prove**, non regole.

### Cited Findings
**(a) Che cosa è etichetta o scelta a mano** [codice, [reazioni.js](/home/user/stateyour/src/camera/reazioni.js)]
- **La catalisi nel RAF è un'etichetta.** Ogni reazione di una famiglia acido-base riceve come catalizzatori tutte le molecole presenti con un pKa entro 1,5 dal pH, più l'etichetta `'ioni e minerali del luogo'` se c'è un qualunque ione o minerale. L'etichetta è messa nel **cibo** ([reazioni.js:378-389](/home/user/stateyour/src/camera/reazioni.js)), così in ogni luogo con un minerale la condizione di catalisi del RAF è soddisfatta in partenza. Il «RAF proprio» (riga 391) la esclude, ed è l'unico rilevatore onesto.
- `BRONSTED_PKA = 1,5` è una soglia scelta ([reazioni.js:86](/home/user/stateyour/src/camera/reazioni.js)).
- **Membrane**: anfifiliche con almeno 4 carboni, le 12 più abbondanti, CMC del singolo composto ([reazioni.js:393](/home/user/stateyour/src/camera/reazioni.js)). Il rapporto sulla vita, corretto a novembre, dice che serve la CMC della **miscela** e che con Mg²⁺ ≳ 20 mmol/L o Ca²⁺ ≳ 5 mmol/L non si formano vescicole a pH 7–9 (sì solo a pH ≳ 11 con miscele di ≥ 12 anfifili) — [Regole per la vita in potenza](/home/user/stateyour/reports/Regole%20per%20la%20vita%20in%20potenza.md) [V-prec].
- **Bagnato e secco**: due fasi di mezzo periodo ciascuna; nella fase secca a_w è moltiplicata per **0,75** (a mano) con un minimo di 0,3. a_w viene da Raoult ideale 1 − 0,018·Σm ([reazioni.js:447, :451](/home/user/stateyour/src/camera/reazioni.js)).
- **Il camino**: si prende solo `pre.camini[0]`, T + salto e pH − salto, e i minerali come lista di nomi ([reazioni.js:437](/home/user/stateyour/src/camera/reazioni.js)). La pozza è solo `pozzeCheEvaporano[0]` (riga 436).
- **Due scatole a pH diverso** (il camino alcalino contro il mare acido) «non sono ancora un luogo solo» (dichiarato, [reazioni.js:70](/home/user/stateyour/src/camera/reazioni.js)).
- **Formosio**: «l'induzione (il primo legame C–C dalla sola formaldeide) non ha via nelle regole: la sua probabilità per le regole è zero» (dichiarato, [reazioni.js:71-72](/home/user/stateyour/src/camera/reazioni.js)). La fotolisi spezza in radicali ma la rete dei radicali non è aperta (righe 68-70).
- **Pori della crosta**: pH = quello del mare o 7, non dall'equilibrio acqua–roccia ([reazioni.js:496](/home/user/stateyour/src/camera/reazioni.js)); minerali per tipo di roccia come lista ([reazioni.js:498](/home/user/stateyour/src/camera/reazioni.js)); ρ_roccia = 2900 fissa ([reazioni.js:485](/home/user/stateyour/src/camera/reazioni.js)).
- **L'albero della vita**: l'età della radice T è «l'età del pianeta se l'acqua è liquida oggi», con tassi di nascita e morte terrestri. Non legge la chimica ([albero_vita.js:26-51](/home/user/stateyour/src/camera/albero_vita.js)) [codice].

**Teoria dei rilevatori (fonti esterne)**
- **Nuclei autocatalitici di Blokhuis, Lacoste e Nghe 2020** (PNAS 117, 25230):
  - un nucleo è un motivo autocatalitico minimo; ogni sistema autocatalitico è un nucleo o ne contiene;
  - cinque tipi (I–V) per numero e sovrapposizione dei cicli; ogni motivo minimo contiene una «forchetta», cioè una reazione con un reagente e due prodotti;
  - condizioni: *autonomia* (ogni reazione ha almeno un reagente e un prodotto) e *non ambiguità* (la catalisi va scritta come sequenza di passi, in modo che nessuna specie compaia sia come reagente sia come prodotto della stessa reazione);
  - criterio stechiometrico: esiste g con Δn = ν̄·g > 0 su tutte le coordinate, equivalente all'assenza di leggi di conservazione di tipo massa nella sottomatrice;
  - i cicli catalitici interni favoriscono la crescita; nucleo di tipo I e III si trovano nel ciclo di Calvin e nel Krebs inverso.
  
  Fonte: [PMC7568248](https://pmc.ncbi.nlm.nih.gov/articles/PMC7568248) [V].
- **Trovare i nuclei autocatalitici è NP-completo** (lavori successivi) — [risultati di ricerca su arXiv, p. es. 2303.14238](https://arxiv.org/pdf/2303.14238v4) [Vs, solo dall'estratto].
- **maxRAF** (Hordijk e Steel 2004): se un sistema ha un RAF ne ha uno massimo, unico, calcolabile in tempo polinomiale, O(|R|² log|R|) nel caso peggiore. Trovare il RAF più piccolo è NP-difficile; i RAF irriducibili si costruiscono in tempo polinomiale ma possono essere esponenzialmente numerosi. L'estensione con le velocità (Steel e Hordijk 2018) calcola un RAF ottimo in tempo polinomiale — [arXiv 1801.03953](https://arxiv.org/pdf/1801.03953v2), [PMC4428007](https://pmc.ncbi.nlm.nih.gov/articles/PMC4428007), [ar5iv 2303.01809](https://ar5iv.labs.arxiv.org/html/2303.01809) [Vs].
- **RAF nel metabolismo vero** (Xavier, Hordijk, Kauffman, Steel e Martin 2020, Proc. R. Soc. B 287, 20192377): RAF nel metabolismo di procarioti (metanogeni, acetogeni), coerenti con un'origine autotrofa e con reti autocatalitiche precedenti a proteine e RNA — [NOVA Research](https://novaresearch.unl.pt/en/publications/autocatalytic-chemical-networks-at-the-origin-of-metabolism/) [Vs].
- **Teoria delle organizzazioni chimiche** (Dittrich e Speroni di Fenizio 2007, Bull. Math. Biol. 69, 1199, DOI 10.1007/s11538-006-9130-8):
  - un'organizzazione è un insieme di specie **chiuso** (nessuna specie nuova nasce dalle reazioni interne) e **che si mantiene** (ciò che si consuma dentro si produce dentro);
  - il mantenimento è stechiometrico, non cinetico;
  - gli insiemi chiusi formano un reticolo, e le organizzazioni una gerarchia.
  
  Fonti: [arXiv q-bio/0501016](https://arxiv.org/abs/q-bio/0501016), [MATCH 96](https://match.pmf.kg.ac.rs/electronic_versions/Match96/n3/match96n3_781-817.pdf) [Vs].

**Chimica di laboratorio da usare come prova**
- **Preiner e altri 2020** (Nat. Ecol. Evol. 4, 534): greigite, magnetite e awaruite catalizzano la fissazione di CO₂ con H₂ a 100 °C in acqua alcalina. Prodotti: formiato fino a 200 mM, acetato fino a 100 µM, piruvato fino a 10 µM, metanolo fino a 100 µM, e metano; la magnetite a 25 bar H₂/CO₂ (40:60) e 100 °C — [Springer s41559-020-1125-6](https://link.springer.com/10.1038/s41559-020-1125-6), [core.ac.uk](https://core.ac.uk/download/354864799.pdf) [Vs].
- **Muchowska, Varma e Moran 2019** (Nature 569, 104): una rete puramente chimica spinta da Fe²⁺ costruisce da piruvato e gliossilato 9 degli 11 intermedi del ciclo di Krebs, compresi tutti e cinque i precursori universali. Il primo passo è l'aldolica piruvato + gliossilato; l'isocitrato fa un retro-aldolo catalizzato da Fe²⁺ (come il «glyoxylate shunt»). Proposta di uno stato stazionario fuori equilibrio alimentato da piruvato e gliossilato abiotici — [PMC6517266](https://pmc.ncbi.nlm.nih.gov/articles/6517266) [Vs].
- **Formosio (Breslow 1959)**: la glicolaldeide catalizza la propria formazione; l'aldolica con HCHO dà gliceraldeide, e un retro-aldolo finale dà due glicolaldeidi.
  - L'induzione è lenta: la dimerizzazione iniziale ha un meccanismo ignoto, forse luce o radicali.
  - La fase di ritardo finisce quando glicolaldeide e zuccheri superano una concentrazione critica.
  - Bastano tracce di glicolaldeide (fino a ~3 ppm) per innescare la reazione.
  - Il ciclo base da solo non spiega il consumo massiccio dopo il ritardo.
  
  Fonti secondarie: [Wikipedia, Formose reaction](https://en.wikipedia.org/wiki/Formose_reaction), [RSC Chem. Sci. 2023, D3SC03185C](https://pubs.rsc.org/en/content/articlehtml/2023/sc/d3sc03185c), [arXiv 1712.02594](https://arxiv.org/pdf/1712.02594) [Vs].
- **Termoforesi nei pori** (Baaske e altri 2007, PNAS 104, 9346): pori millimetrici in un gradiente termico accumulano anche singoli nucleotidi più di 10⁸ volte in regioni micrometriche, per convezione laminare più termoforesi. Con 30 K orizzontali l'accumulo atteso è ~1 200 volte; tre sezioni di poro in serie danno ~10⁹. Dipende in modo esponenziale da lunghezza del poro e ΔT, e quindi è robusto alla geometria — [PMC1890497](https://pmc.ncbi.nlm.nih.gov/articles/PMC1890497) [Vs].
- **Vescicole di acido decanoico**: si formano solo vicino al pKa apparente. La finestra è ~pH 6,8–8 secondo Monnard e Rasmussen, ~7–9 secondo altre fonti. La concentrazione critica di aggregazione dipende molto dal pH (14 mM a un pH non letto nell'estratto) e scende con NaCl — [Soft Matter, C5SM01248A](https://pubs.rsc.org/en/content/getauthorversionpdf/C5SM01248A), [scholar.colorado.edu](https://scholar.colorado.edu/downloads/1831ck53g) [Vs]. Le fonti non sono in accordo sulla finestra esatta.
- **Cicli bagnato–secco** (in un rapporto precedente): oligoglicine fino a 20 residui con ~50% di conversione — [Rodriguez-Garcia e altri 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4633627/) [V-prec]. La trappola termoforetica fa crescere la lunghezza fino a ~200 nucleotidi — [Mast e altri 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3657786/) [V-prec].
- **Compartimenti contro i parassiti**: gli ipercicli in soluzione sono instabili ai parassiti e si domano solo con compartimenti e selezione a più livelli — [Takeuchi e Hogeweg 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3466355/) [V-prec].
- **Crescita delle vescicole per competizione**: le vescicole cariche di RNA crescono a spese di quelle vuote per la pressione osmotica — [Chen, Roberts e Szostak 2004, Science 305, 1474](https://doi.org/10.1126/science.1100757) [R].
- **Allchemy** (Wołos e altri 2020, Science 369, eaaw1955): regole di reazione applicate in avanti da pochi substrati prebiotici generano una rete con cicli che emergono e si rigenerano — [DOI](https://doi.org/10.1126/science.aaw1955) [R]. Non va confuso con AlChemy di Fontana (punto 4).

### Inferences
- **(b) Legge minima 3: la catalisi come stechiometria.** Ogni catalisi diventa due o tre passi elementari con un intermedio esplicito: C + S ⇌ CS (associazione con k_D di Smoluchowski e K dalla regola di `interazione`/`logKComplesso`), CS → CP (barriera abbassata), CP ⇌ C + P.
  - È esattamente la condizione di **non ambiguità** di Blokhuis [V].
  - Conseguenza: l'autocatalisi del formosio o di un ciclo di Krebs inverso **compare nella matrice stechiometrica** e il rilevatore di nuclei la trova da sé.
  - L'etichetta `'ioni e minerali del luogo'` va tolta dal cibo. I siti di superficie diventano specie **conservate** (il numero totale di siti è una conservazione in più, come gli atomi), e per la RAF il catalizzatore è il sito, che è nel cibo solo se il minerale è dato dal padre. È lecito, ma il «RAF proprio» deve escluderlo [inferenza].
- **(b) Legge minima 4: superfici finite.**
  - Area per volume d'acqua dei pori, grani sferici di diametro d: A/V = 6(1−φ)/(φ·d). Con φ = 0,1 e d = 50 µm, A/V ≈ 1,1·10⁶ m⁻¹, cioè ~1 m² per mL d'acqua [C].
  - Con 2–10 siti per nm² [R, valore tipico per gli ossidi, da verificare], i siti valgono ~3–15 mmol per litro di acqua dei pori [C]. È più del cibo organico: **nei pori la chimica è chimica di superficie**, e il ×30 lo sottostima o sovrastima a seconda della roccia.
  - Il padre (`suolo.js`, Kozeny–Carman, d₃₂) conosce già d e φ ([suolo.js:33-42](/home/user/stateyour/src/camera/suolo.js) [codice]): basta passarli.
  - Selettività da legge: K_ads = exp(−ΔG_ads/RT), con ΔG_ads dal legame della coppia solitaria al catione del sito (`adsorbi`, [molecole_incontri.js:106-108](/home/user/stateyour/src/camera/molecole_incontri.js)) e dalla carica di superficie al pH (punto di carica zero del minerale) [inferenza].
- **(b) Il camino come un luogo solo con due pH.** Il gradiente si fa con l'RDME del punto 2 su una sezione 1D o 2D del camino: da un lato il fluido alcalino (pH dalla serpentinizzazione: la composizione del fluido dal Newton di `equilibrio` con olivina + acqua; Lost City ha pH 9–11 [R: [Kelley e altri 2001, Nature 412, 145](https://doi.org/10.1038/35084000)]), dall'altro il mare, nel mezzo la parete minerale come siti. Il «NON TORNA» della riga 70 si chiude senza leggi nuove: serve solo la diffusione tra voxel con D per specie (H⁺ e OH⁻ hanno D ~ 9 e 5·10⁻⁹ m²/s [R]).
- **(b) Legge minima 6: termoforesi e trappole.** Flusso j = −D(∇c + S_T·c·∇T). Allo stato stazionario senza convezione c(x) ∝ exp(−S_T·T(x)) [R]; con la convezione del poro l'accumulo cresce in modo esponenziale con L/r e ΔT [Vs, Baaske].
  - Nel codice serve S_T per specie: cresce con la taglia (~0,01–0,1 K⁻¹ per DNA corti [R]). Una legge ridotta è S_T ∝ superficie idratata e carica (Duhr e Braun 2006 [R]).
  - Il gradiente termico viene dal camino o dal gradiente geotermico del poro, che `luogoDellaCrosta` ha già ([reazioni.js:464-466](/home/user/stateyour/src/camera/reazioni.js)).
- **(b) Bagnato–secco da conservazione invece che ×0,75.** Il volume d'acqua della pozza evolve come dV/dt = −E(T, umidità, vento, radiazione) + pioggia + marea. E si calcola con Penman dallo stato di `meteo`/`mare` [R]; il soluto si conserva (n_i fisso), quindi c_i = n_i/V; a_w viene da Raoult o, sopra ~1 mol/kg, da Pitzer [R]. Alla saturazione precipitano le fasi (`mare.evapora()` lo fa già per i sali, [bolle.js:363](/home/user/stateyour/src/camera/bolle.js) [codice]). Il fattore di concentrazione così **emerge** e arriva a 10²–10³ nella pozza quasi asciutta [C, per V_fin/V_in = 10⁻²–10⁻³].
- **(b) Legge minima 5: vescicole dalla miscela e dai cationi.**
  - CMC della miscela con la regola di Clint per miscele ideali: 1/CMC_mix = Σ x_i/CMC_i [R]. È la legge minima che spiega perché poche catene lunghe abbassano molto la soglia (Budin 2014 [V-prec]).
  - Il pKa apparente del carbossilato nella membrana sale di ~2–3 unità rispetto al monomero [R]: la finestra di vescicola è una funzione del pH. Gli estratti trovati dicono ~6,8–8 o ~7–9 per il decanoato [Vs].
  - I cationi bivalenti: la precipitazione dei saponi di Ca e Mg è un equilibrio di solubilità (K_sp), che il Newton di `equilibrio` sa trattare come fase solida.
  - La vescicola è un **oggetto**: raggio R, numero di anfifili n_mem = 8πR²/a₀ (bistrato), contenuto. Cresce per assorbimento di micelle e monomeri (flusso dalla soluzione), si divide quando il rapporto area/volume supera quello della sfera di un fattore (forma tubolare sotto taglio, Zhu e Szostak 2009 [R]). Ogni divisione è un evento con indirizzo, e la ripartizione del contenuto è binomiale.
- **(c) Costi.**
  - maxRAF: O(|R|² log|R|) [Vs], ~10⁸ operazioni per 10⁴ reazioni, cioè ~0,1–1 s in JS [C]: va bene su richiesta.
  - Nuclei: NP-completo [Vs]. Va tenuto il tetto di tempo e lunghezza che `autocatalitici` ha già (`tempoCicli`, `lunghezza = 7`). La ricerca va fatta solo sul sottografo delle reazioni **attive** (quelle con eventi nella storia), non su tutta la rete.
  - Organizzazioni COT: la chiusura è un punto fisso; il mantenimento è un programma lineare di fattibilità (esiste v > 0 con S·v ≥ 0 sulle specie dell'insieme) [inferenza dalla definizione stechiometrica, Vs]. Un simplesso in JS per 10³ reazioni costa decine di millisecondi [C, stima].
- **(c) Il formosio senza scriverlo.** Si apre la rete dei radicali (fotolisi di HCHO → HCO· + H·, ricombinazione HCO· + HCO· → gliossale, HCO· + HCHO → …) con le sezioni d'urto per banda e le leggi del punto 1. Oppure si ammette la via minerale. L'induzione diventa un **evento raro** con probabilità finita: l'FFS che c'è già ([reazioni.js:407](/home/user/stateyour/src/camera/reazioni.js)) ne calcola il tasso, con ordine λ = numero di glicolaldeidi, e la soglia della fonte (~3 ppm [Vs, secondaria]) diventa una **prova** del motore, non un parametro.
- **(c) Le prove dai laboratori.** Si mette il luogo del camino a 100 °C, pH alcalino, 25 bar H₂/CO₂ e magnetite o awaruite come siti. Il generatore con le leggi minime deve dare l'**ordine** formiato ≫ metanolo ≈ acetato > piruvato (200 mM ≫ 100 µM ≈ 100 µM > 10 µM [Vs]). Con piruvato + gliossilato + Fe²⁺ deve trovare un sottoinsieme degli intermedi di Krebs (9 su 11 [Vs]). Se non li trova, il difetto è nelle barriere (punto 1), non nella regola dei rilevatori.
- **(d) Che cosa passa il padre e che cosa torna.**
  - **Giù**: T, gradiente di T, pH dei due fluidi, flussi di H₂ (serpentinizzazione e radiolisi, già in `luogoDellaCrosta`), CO₂, cationi, area e tipo dei siti minerali, luce per banda (pozze), ciclo di evaporazione.
  - **Su**: consumo di H₂ e CO₂ per litro, produzione di formiato, acetato e metano, calore di reazione, anfifili e loro aggregati, e i «fatti rari» (un nucleo autocatalitico attivo, una vescicola che si divide) come **tassi per volume e per tempo**. Questi ultimi vanno all'albero della vita come h_i del rapporto sulla vita, `1 − exp(−h·∫N dt)`, al posto di T = età del pianeta ([albero_vita.js:26-28](/home/user/stateyour/src/camera/albero_vita.js)) [inferenza dal rapporto V-prec].
- **(e) Che cosa mostrare.**
  - Sul pannello del luogo: il **reticolo delle organizzazioni** (COT) come diagramma di Hasse, con evidenziata quella in cui si trova lo stato; i nuclei di Blokhuis come cicli colorati sul grafo; il RAF proprio in un colore e la catalisi dal cibo in un altro.
  - Nella vista: le superfici minerali con le molecole adsorbite (punto 5).

### Gaps
- Non ho letto il testo pieno di Preiner 2020, di Muchowska 2019 né dell'articolo che dimostra l'NP-completezza dei nuclei: valgono gli estratti.
- Non ho trovato una legge chiusa e verificata per il coefficiente di Soret per specie a partire dalla struttura: Duhr e Braun 2006 è ricordato.
- Densità dei siti di superficie dei minerali dei camini (greigite, awaruite): non verificata; il valore di 2–10 per nm² è un ricordo per gli ossidi.
- Monnard e Deamer 2002 (Anat. Rec. 268, 196): i valori di CMC e pH non sono stati letti; le due finestre di pH trovate non concordano.

---

## 4. Chimica artificiale e benchmark di apertura: che cosa si può riusare

### Takeaway
I sistemi di chimica artificiale (AlChemy, Tierra, Avida, Stringmol, Hutton, BFF, Lenia/Flow-Lenia) non danno leggi fisiche da copiare, perché la loro «chimica» è scritta. Danno tre cose riusabili:
- (i) **lezioni strutturali**: senza compartimenti vincono i parassiti (Stringmol, Takeuchi–Hogeweg); con la conservazione della massa le forme si localizzano e più «specie» convivono (Flow-Lenia); i replicatori nascono da interazioni casuali senza funzione di fitness (BFF);
- (ii) **strumenti numerici**: il trasporto conservativo di Flow-Lenia (reintegration tracking) per i campi del millimetro;
- (iii) **rilevatori di apertura**: statistiche di attività evolutiva, entropia d'ordine alto, comprimibilità, da aggiungere come rilevatori passivi accanto a RAF e COT.

### Cited Findings
- **Flow-Lenia** (Plantec, Hamon, Etcheverry, Oudeyer, Moulin-Frier e Chan, arXiv 2212.07906; ALIFE 2023, poi *Artificial Life*):
  - estensione di Lenia che conserva la massa: l'attivazione totale per canale resta costante;
  - il flusso è il gradiente di una mappa di affinità più un gradiente di massa, che domina vicino a una soglia;
  - la materia si sposta con il «reintegration tracking», un'approssimazione a griglia di un sistema di particelle;
  - la conservazione vincola quasi tutte le forme a essere localizzate;
  - i parametri della regola sono messi dentro la dinamica e diventano locali, e questo permette simulazioni con più specie.
  
  Fonte: [arXiv 2212.07906](https://arxiv.org/abs/2212.07906) [Vs]. Le sedi di pubblicazione differiscono tra le fonti.
- **BFF / «Computational Life»** (Agüera y Arcas e altri, arXiv 2406.19108, 2024): programmi casuali che non si replicano, messi in un ambiente senza funzione di fitness esplicita, tendono a far nascere replicatori, per interazione e auto-modifica, con o senza mutazioni di fondo — [arXiv 2406.19108](https://arxiv.org/abs/2406.19108v2) [Vs]. Le percentuali di riuscita (~40–50%) vengono da fonti secondarie e non sono verificate sull'articolo. C'è un seguito sul Z80 (arXiv 2607.09211, 2026) [Vs].
- **Stringmol** (Hickinbotham, Stepney e altri, York): molecole come stringhe di istruzioni simili all'assembly; i replicatori copiano *altre* stringhe che si legano a loro, opcode per opcode, e la copia costa tempo.
  - I parassiti veloci che hanno perso il codice di replicazione sono fortemente favoriti, e i primi esperimenti si estinguono.
  - Poi evolvono meccanismi elaborati: replicazione più lenta, mutazione più alta, riconoscimento sé/non-sé.
  
  Fonti: [Roy. Soc. Open Sci. 2021, «Nothing in evolution makes sense except in the light of parasitism»](https://eprints.whiterose.ac.uk/176868/1/rsos.210441.pdf) [Vs].
- **Ricordati, da verificare**:
  - AlChemy (λ-calcolo; organizzazioni che si mantengono, i «livelli» 0/1/2) — [Fontana e Buss 1994, Bull. Math. Biol. 56, 1](https://doi.org/10.1007/BF02458289) [R];
  - replicatori in una chimica artificiale 2D di atomi tipizzati con regole di legame — [Hutton 2002, Artificial Life 8, 341](https://doi.org/10.1162/106454602321202417) [R];
  - Avida — [Ofria e Wilke 2004, Artificial Life 10, 191](https://doi.org/10.1162/106454604773563612) [R; licenza non verificata];
  - Tierra (Ray 1991) [R; nessun link verificato];
  - Lenia — [Chan 2019, Complex Systems 28, 251](https://doi.org/10.25088/ComplexSystems.28.3.251) [R];
  - gocce d'olio che si muovono da sole (chimica vera, non artificiale) — [Hanczyc e altri 2007, JACS 129, 9386](https://doi.org/10.1021/ja0706955) [R];
  - misure di apertura MODES — [Dolson e altri 2019, Artificial Life 25, 50](https://doi.org/10.1162/artl_a_00280) [R].
- **Coerenza con il codice**: il rapporto sulla vita dice già che i compartimenti chiudono il cerchio contro i parassiti — [Regole per la vita in potenza](/home/user/stateyour/reports/Regole%20per%20la%20vita%20in%20potenza.md) [V-prec].

### Inferences
- **(a) Che cosa non riusare.** Le regole di reazione di questi sistemi: istruzioni, λ-termini, nuclei di convoluzione di Lenia. Sono scelte a mano, e violerebbero la regola zero del progetto.
- **(b) Che cosa riusare come numerica.**
  - Il **reintegration tracking** di Flow-Lenia è un trasporto semi-lagrangiano che conserva la massa. Serve per avvezione e diffusione dei campi di concentrazione sulla GPU al livello del millimetro (convezione nei pori, mescolamento nella pozza), con conservazione esatta per costruzione: le somme tornano a ogni passo, condizione necessaria per chiudere i bilanci (punto 5).
  - L'idea dei «parametri localizzati» corrisponde, nel progetto, alle **condizioni locali** (T, pH, a_w, siti) che variano nel campo. Non vanno inventate: arrivano dal padre.
- **(b) Che cosa riusare come rilevatori** (funzioni pure della storia, come RAF e COT):
  - **novità**: numero di specie mai viste prima nella storia del luogo, per unità di tempo (MODES [R]);
  - **attività evolutiva** alla Bedau: persistenza × abbondanza delle specie oltre una soglia (statistiche note [R]);
  - **comprimibilità** della popolazione di polimeri (BFF usa l'entropia d'ordine alto, ricordo [R]): la nascita di un copiatore la fa cadere bruscamente. Si calcola con un compressore LZ sulle stringhe di monomeri, O(n);
  - **ereditarietà**: correlazione genitore–figlio della composizione di vescicole che si dividono (GARD, Segré e Lancet [R]).
- **(c) Benchmark per il motore.** Il criterio di riuscita non è «emerge la vita», ma tre prove:
  1. senza compartimenti un sistema con copia su stampo è invaso dai parassiti (Stringmol, Takeuchi–Hogeweg);
  2. con vescicole che si dividono il parassita è contenuto;
  3. con la sola chimica di laboratorio (punto 3) i rilevatori trovano RAF e nuclei negli stessi casi dei lavori citati.
  
  Sono prove qualitative ma falsificabili.
- **(d) Che cosa torna verso l'alto.** I tassi dei rilevatori (novità, cadute di comprimibilità, divisioni) per volume e tempo, verso h_i dell'albero della vita.
- **(e) Che cosa mostrare.** Una striscia temporale del luogo con le curve dei rilevatori (specie nuove, entropia, numero di vescicole), cliccabile per saltare all'istante nel quale un rilevatore scatta. Il tempo guardato è indirizzato, quindi l'istante si riapre identico.

### Gaps
- Non ho verificato le licenze di Avida, Tierra, Stringmol, Lenia e Flow-Lenia: il codice di Flow-Lenia è su GitHub ma non controllato.
- Non ho verificato sul testo la metrica d'«entropia d'ordine alto» di BFF né le percentuali di riuscita.
- Non ho cercato Hutton e Hanczyc oltre la memoria: i riferimenti sono [R].

---

## 5. Collegare la micro-chimica alla geochimica del pianeta: flussi su per le scale, continuità nello zoom, che cosa si vede da 1 mm a 1 nm

### Takeaway
Due strumenti bastano:
- **Giù, condizionamento esatto.** I conteggi del padre si dividono tra i figli per multinomiale con pesi ∝ volume × campo medio. Le somme tornano per costruzione e ogni figlio è un'estrazione con indirizzo.
- **Su, legge di velocità effettiva.** Dove la micro-chimica cambia la macro-velocità (catalisi di superficie, nucleo autocatalitico, evento raro) il figlio calcola una volta un k_eff o un flusso per volume, alla maniera del metodo multiscala eterogeneo (HMM). Lo si memorizza per indirizzo, e il padre lo integra sul volume dei pori, dei camini o delle pozze del pianeta.

I numeri del pianeta servono da prova di chiusura: l'H₂ della serpentinizzazione alle dorsali vale ~10¹¹–10¹² mol/anno nelle stime pubblicate.

### Cited Findings
- **H₂ della serpentinizzazione alle dorsali**:
  - Worman e altri 2016 (GRL): ~10¹² mol H₂/anno dal solo asse, forse un ordine di grandezza più della produzione continentale; dipende dalla velocità di espansione e dallo spessore netto di peridotite che si serpentinizza;
  - la tesi di Worman 2015: ~10¹¹ mol/anno, stime precedenti 10¹⁰–10¹²; nel bilancio della crosta giovane la serpentinizzazione dà ~2·10¹² mol/anno (21%) e la cristallizzazione 6·10¹²;
  - Merdith e altri 2020 (G-cubed): ~7·10¹⁷ mol/Ma oggi, cioè ~7·10¹¹ mol/anno, dalle dorsali lente e ultralente.
  
  Fonti: [DOAJ, GRL 2016](https://doaj.org/article/19ea24047cda4b9bb315c206dd28faea), [DukeSpace](https://dukespace.lib.duke.edu/items/f9581bff-8954-49ea-afb3-18d6c794407f), [HAL, Merdith 2020](https://hal-insu.archives-ouvertes.fr/insu-03710132/file/Geochem%20Geophys%20Geosyst%20-%202020%20-%20Merdith%20-%20Pulsated%20Global%20Hydrogen%20and%20Methane%20Flux%20at%20Mid%25u2010Ocean%20Ridges%20Driven%20by%20Pangea.pdf) [Vs]. Le stime differiscono soprattutto per lo spessore assunto di peridotite.
- **(a) Nel codice, giù**: `luogoDellaCrosta` calcola H₂ = (radiolisi + serpentinizzazione)·tempo di residenza dalla colonna di `suolo.js`, con Athy, Darcy e τ(z) = ∫φ/q dz ([reazioni.js:482-503](/home/user/stateyour/src/camera/reazioni.js), [suolo.js:154-178](/home/user/stateyour/src/camera/suolo.js) [codice]). Il padre del mare è `campioneAcqua` ([reazioni.js:430](/home/user/stateyour/src/camera/reazioni.js)).
- **(a) Nel codice, su**: niente torna. `storia` restituisce `bordo: { entrate, uscite, senzaRitorno }` in totale, non per specie ([reazioni.js:265-271](/home/user/stateyour/src/camera/reazioni.js)). L'inventario elenca come fili staccati `mare.sorgentiCalde`/`fluidoCaldo` ↛ `molecole_rete` e la chimica prebiotica che non legge `risalita` — [Inventario, mappa dei fili](/home/user/stateyour/reports/Inventario%20di%20cio%20che%20non%20emerge.md) [codice].
- **(a) Nel codice, zoom**: la chimica parte solo sotto il micron (`lato <= 1.0001e-6`, [mappa.js:760](/home/user/stateyour/src/camera/mappa.js), [finestre.worker.js:43](/home/user/stateyour/src/camera/finestre.worker.js)), e dà **una riga di testo**, non una vista ([reazioni.js:514-516](/home/user/stateyour/src/camera/reazioni.js)). A nanometri c'è la scena d'acqua vera, `scenaNano` ([finestra.js:627](/home/user/stateyour/src/camera/finestra.js)) [codice]. Tra 1 mm e 1 µm nessuna vista chimica: è il buco H25 dell'inventario, «tra molecola e granello» — [Inventario](/home/user/stateyour/reports/Inventario%20di%20cio%20che%20non%20emerge.md) [codice].
- **Il condizionamento esatto ha già un precedente nel progetto**: `bolle.js` condiziona il campo cosmico con Hoffman–Ribak, in modo che i vincoli siano rispettati e la correzione si spenga lontano ([bolle.js:7-24](/home/user/stateyour/src/camera/bolle.js)); `albero_vita.js` divide i massimi di blocco per evento con indirizzo ([albero_vita.js:14-25](/home/user/stateyour/src/camera/albero_vita.js)) [codice].
- **Ricordati, da verificare**: il metodo multiscala eterogeneo — [E ed Engquist 2003, Commun. Math. Sci. 1, 87](https://doi.org/10.4310/CMS.2003.v1.n1.a8) [R]; il metodo «equation-free» — [Kevrekidis e altri 2003, Commun. Math. Sci. 1, 715](https://doi.org/10.4310/CMS.2003.v1.n4.a5) [R].

### Inferences
- **(b, c) Giù: la divisione multinomiale.** Per molecole indipendenti (soluzione ideale) il numero in un sottovolume è Poisson, e il vettore dei numeri nei figli, *dato* il numero N del padre, è **Multinomiale(N; w_i)** con w_i = ∫_figlio c̄(x)dV / ∫_padre c̄(x)dV [R: proprietà standard di Poisson]. c̄ è il campo medio del padre (ODE/PDE + LNA, punto 2).
  - Ogni tiro ha indirizzo `…/cella/<figlio>/<specie>`. Le somme dei figli sono **esattamente** il padre, e zoomare non crea né distrugge materia.
  - Fuori dall'idealità (aggregati, vescicole) si divide prima l'oggetto, la vescicola intera, e poi il suo contenuto.
  - Lo stesso per gli **eventi** di reazione in Δt: il numero del padre per canale si divide tra i figli con pesi ∝ a_j(figlio). È esatto per propensioni costanti nell'intervallo, ed è il ponte di Poisson del punto 2 nello spazio.
  - Costo: O(specie × figli) per livello. Per 8 figli e 100 specie, 800 tiri binomiali a livello [C].
- **(b, c) Su: velocità effettive, una volta per indirizzo.** Dove il figlio ha una non linearità che il padre non vede (siti di superficie che si saturano, un nucleo autocatalitico che si accende, una trappola termoforetica che concentra 10³–10⁸ volte [Vs]), il figlio esegue una storia breve (MNRM o FFS) e restituisce:
  - un **flusso per volume** J_i(c_b, T, pH, a_w, A/V) per le specie di bordo;
  - un **tasso di eventi rari** per volume, h (nucleo attivo, vescicola che si divide).
  
  Il padre memorizza (J, h) su una griglia delle sue variabili di stato, chiave l'indirizzo della classe di luogo, e li **interpola**: è l'HMM [R].
  - Errore dichiarato: l'errore statistico della storia breve (medie a blocchi, già in `storia`, righe 277-280) più l'errore d'interpolazione sulla griglia.
  - Il determinismo è salvo, perché il risultato è funzione dell'indirizzo, non di chi ha guardato prima.
  - Il paradosso «guardare cambia il padre» non si presenta: il padre usa *sempre* la legge effettiva della sua classe di luogo, calcolata alla prima richiesta e uguale per tutti. Il figlio guardato è un'estrazione condizionata coerente con essa.
- **(d) La chiusura dei bilanci, scala per scala.**
  - **Poro (µm) → colonna (km).** Flusso netto di H₂ per litro d'acqua dei pori, J_H₂(z), moltiplicato per φ(z) e integrato sulla colonna: ∫J·φ dz [mol/m²/s] per unità d'area della crosta. Oggi H₂ = produzione × residenza (riga 493) suppone che nulla lo consumi. Con la chimica la concentrazione stazionaria diventa c = P·τ/(1 + k_cons·τ), e il consumo k_cons viene dalla rete con i siti minerali [inferenza].
  - **Colonna → pianeta.** Si integra sull'area delle dorsali e delle croste ultramafiche (da `tettonica`, velocità di espansione) e si confronta con 10¹¹–10¹² mol/anno [Vs]. È una **prova**: un pianeta terrestre lontano da quell'intervallo segnala un errore nel tasso di serpentinizzazione (`SERPENTINO.k300`, `Ea`, riga 481) o nelle aree.
  - **Camino → mare.** Il formiato, l'acetato e il metano prodotti per camino, moltiplicati per il numero di camini (`mare.sorgentiCalde`), danno il carbonio organico disciolto che entra nel mare. Il metano entra nell'aria (`chimica.atmosfera`), e chiude il filo con il clima.
  - **Pozza → aria.** I volatili (HCN, HCHO) in equilibrio di Henry con l'aria (lo dice già la riga 434-435): la pozza è un pozzo o una sorgente netta e si somma sull'area delle pozze del pianeta (`pozzeDiMarea`, `pozzeCheEvaporano`).
  - **Calore.** Q̇ = −Σ ΔH·v per volume. Con 10⁻¹² mol/L/s e 100 kJ/mol fa 10⁻⁴ W/m³; con 10⁻¹⁵ mol/L/s, 10⁻⁷ W/m³ [C]. Per confronto, il flusso geotermico di ~0,09 W/m² distribuito su 1 km di crosta vale ~10⁻⁴ W/m³ [C]. Il calore chimico è trascurabile per il clima, ma non sempre per il bilancio termico locale di un poro molto reattivo: va contato per chiudere l'energia della finestra e mostrato.
  - **Vita.** Il tasso per volume h dei rilevatori, integrato su ∫N(t)dt dei luoghi del pianeta nel tempo (dalla storia del pianeta, `storia.js`), dà la probabilità che la vita sia nata entro t. Questa sostituisce T = età del pianeta come inizio dell'albero della vita ([albero_vita.js:26-28](/home/user/stateyour/src/camera/albero_vita.js)) [inferenza, dal rapporto V-prec].
- **(e) Che cosa mostrare a ogni larghezza di schermo.** I tempi di diffusione τ = L²/6D sono calcolati con D = 10⁻⁹ m²/s, i numeri con Ω del punto 2 [C]:

  | larghezza dello schermo | τ = L²/6D | che cosa c'è | come mostrarlo, continuo |
  |---|---|---|---|
  | **1 mm** | ~170 s | grani di roccia o sedimento con i pori (dalla colonna di `suolo.js`); camino come parete porosa; pozza in sezione. Concentrazioni deterministiche (6·10¹⁴ molecole per mM per mm³) | **campi di concentrazione** come mappe di colore per una specie scelta (H₂, pH, formiato, anfifili), con isolinee e frecce del flusso termoconvettivo nei pori (Baaske). La grana LNA come trama fine. Le superfici dei grani colorate per **copertura di adsorbimento θ** |
  | **100 µm** | ~1,7 s | pori singoli; gradiente termico attraverso un poro; vescicole giganti (1–100 µm) | campo più fine e **trappola termoforetica** visibile come macchia di accumulo; vescicole come contorni; gli eventi di reazione come **densità di luccichii** (Poisson per pixel per fotogramma, colore della famiglia) |
  | **10 µm** | ~17 ms | vescicole singole che crescono e si dividono; argille in pacchetti; superfici con rugosità | vescicole come oggetti con divisioni animate (eventi con indirizzo); voxel RDME (~1 µm) invisibili come griglia ma visibili come fluttuazione; scintille per singoli eventi delle reazioni lente |
  | **1 µm** (dove oggi inizia la riga di `chimicaDellaFinestra`) | ~0,17 ms | 600 molecole per µM nel volume; lamelle d'argilla (~1 nm × 0,1–1 µm), micelle | le specie rare diventano **punti numerati** (una molecola, un punto); le abbondanti restano campo; la membrana come doppio bordo; i siti minerali come trama regolare dal reticolo vero |
  | **100 nm** | ~1,7 µs | 0,6 molecole per µM: le specie organiche sono **poche e singole**; strati adsorbiti di ~1 nm sulle facce | ogni molecola organica come **glifo** (il suo grafo, da `molecole_grafo`), adsorbite legate al sito; eventi come trasformazione del glifo (legame che cambia); l'acqua resta sfondo |
  | **10 nm** | ~17 ns | bistrato di ~4 nm, singoli siti di superficie, ioni con guscio | `scenaNano` (acqua mW, ioni nel loro numero) con le molecole della scatola chimica **messe dentro** con lo stesso indirizzo: chi c'era nel punto di 100 nm c'è qui |
  | **1 nm** | ~0,2 ns | atomi | atomi e legami; una reazione si mostra come percorso lungo la coordinata di reazione con la barriera della sua k (Marcus), animata a tempo rallentato e dichiarato |

  Regole di continuità:
  - (1) ciò che a una scala è campo, a quella sotto è una **divisione multinomiale** dello stesso numero, quindi niente salti nella quantità;
  - (2) gli eventi sono **gli stessi** a tutte le scale: il conteggio grossolano si divide in eventi fini (ponte di Poisson);
  - (3) il passaggio campo → punti avviene per specie quando il numero atteso per pixel scende sotto ~1–10, con una dissolvenza pesata sul numero, non a una soglia fissa di zoom;
  - (4) il tempo dello schermo si lega alla scala, perché a ogni livello τ_diff cambia di 100 per un fattore 10 di lato. La velocità di riproduzione va scritta sullo schermo («1 s = 1,7 ms»).
- **(c) Il costo dell'insieme.**
  - Campo ODE+LNA a 1 mm: millisecondi.
  - Divisione multinomiale per livello: microsecondi.
  - RDME su WebGPU per 10⁶ voxel × 100 specie: ~10⁸ conteggi per passo. È il pezzo pesante, e va fatto solo nella finestra visibile, con il bordo condizionato dal padre.
  - Storia MNRM per una legge effettiva: 10⁵–10⁶ eventi, 0,1–1 s, una volta per classe di luogo [C, stime].

### Gaps
- Non ho trovato in letteratura un metodo pubblicato che combini divisione multinomiale con indirizzo e HMM per la chimica: è una proposta del pannello. La proprietà Poisson → multinomiale è standard ma qui ricordata.
- Le stime di consumo di H₂ da parte di catalisi minerale abiotica nei pori (per confrontare c = P·τ/(1 + kτ)) non sono state cercate.
- I flussi globali di formiato e metano abiotici dai camini non sono stati cercati: c'è solo H₂.
