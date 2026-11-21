# Fisica atomica, nucleare e delle particelle: livelli più emergenti, connessi, continui nello zoom, rapidi e precisi

Panel: fisico atomico, fisico nucleare, fisico delle particelle, specialista di trasporto della radiazione, ingegnere di visualizzazione quantistica.

Marche usate in tutte le note: **[V]** verificato ora (novembre 2026) sulla fonte, o sul suo riassunto o estratto (detto come «[V-riass.]»); **[V-cod]** letto ora nel codice del repo; **[V-rapp]** già verificato in un rapporto del repo (`reports/Leggi fisiche complete per stateyour.md`) e non riletto qui; **[R]** ricordato, da verificare prima di usarne i numeri; **[C]** calcolato qui dai numeri citati. In ogni domanda i punti (a)–(f) della consegna sono segnati in grassetto: **(a)** ciò che nel codice è messo a mano, **(b)** la legge che lo sostituisce, **(c)** come calcolarla a poco costo e con quale errore, **(d)** il bilancio padre ↔ figlio, **(e)** che cosa mostrare a ogni banda di larghezza dello schermo, **(f)** le fonti e le licenze.

Stato di partenza (sintesi della lettura del codice, [V-cod]). Il livello è già più avanti della media. `src/camera/quanti.js` calcola gli orbitali idrogenoidi esatti, il campo centrale con la schermatura di Slater, Hartree-Fock-Roothaan STO-3G per le molecole H–Ne fino a 8 atomi, la misura come evento (Born, operatore di Kraus gaussiano, FFT per l'impulso), i battimenti, l'emissione spontanea dal dipolo, la decoerenza alla Joos-Zeh, il nucleo dai raggi misurati e il nucleone dai fattori di forma. `src/camera/materia.js` contiene Bethe-Bloch con l'effetto densità, Lindhard-Scharff, la frenata nucleare ZBL, Highland, i raggi delta, Cherenkov, le catene U/Th/K/Rb, la fissione spontanea, gli aloni e la ricottura. Il problema non è la mancanza di leggi. Sono quattro cose: (1) alcuni parametri e forme sono ancora scelti a mano; (2) i livelli sono viste separate: `laboratorio.js:484–517` monta `tre/quanti.js` come un'altra tela «in fondo» allo zoom di `atomi3d.js`; (3) tra la nuvola elettronica e il nucleo ci sono decadi vuote; (4) il tempo di ogni scala non è gestito in modo uniforme.

## 1. Densità elettroniche dalle leggi, a poco costo, e loro resa (molecole, solidi; isosuperficie o volume; WebGL/WebGPU)

### Takeaway
La via più economica e onesta ha due strati. Il primo è una **densità di base** per ogni atomo, sferica e già misurata o calcolata: la somma di 4–5 gaussiane dei fattori di forma per raggi X, oppure i multi-ζ di Roothaan-Hartree-Fock (Bunge/Koga) per He–Xe. La «promolecola» che ne viene si sa rendere in shader come somma di gaussiane, alla maniera di QuickSurf. Il secondo è una **correzione di legame**, calcolata solo dove si guarda: Hartree-Fock STO-3G come oggi per le molecole piccole, Hückel esteso o tight binding per il resto, e per i cristalli una serie di Fourier della densità di deformazione precalcolata fuori linea. La sferetta di `atomi3d.js` diventa così l'isosuperficie ≈ 0,001 u.a. della stessa densità: non è più una forma scelta, e lo zoom resta continuo.

### Cited Findings
**(a) Che cosa è messo a mano o non emerge ([V-cod])**
- `quanti.js:126–134` `statoAtomo`: un orbitale idrogenoide per sottoguscio, con la Z efficace delle regole di Slater (`molecole_atomi.js:87–103`, `N_EFFICACE = [0,1,2,3,3.7,4.0,4.2]`, costanti di schermatura 0,35/0,85/1 del 1930). L'intestazione stessa dichiara l'errore: il 2p dell'ossigeno esce più stretto di Hartree-Fock di circa il 10% (`quanti.js:53–54`), e `molecole_atomi.js:25–26` dà per l'idrogeno un raggio di 0,53 Å contro 0,31. I nodi radiali degli orbitali idrogenoidi con Z efficace non sono quelli veri dell'atomo a molti elettroni.
- `quanti.js:193` `ZETA` e `:199`: STO-3G vale solo da H a Ne. In `:548` Hartree-Fock parte solo se gli atomi vanno da 2 a 8, tutti con Z ≤ 10 e con un numero pari di elettroni. Altrimenti si ricade sull'atomo isolato, e i legami spariscono: per il quarzo, l'acqua salata, i metalli, la densità di legame non c'è.
- `atomi3d.js:14–15` e `:40–44`: l'atomo è una sfera-impostore con il raggio «vero» di van der Waals, ionico o covalente, «lo sceglie chi fa la scena». È una forma scelta, non una superficie della densità.
- `tre/quanti.js:5–9`: la nuvola esiste solo come accumulo di eventi di misura (scelta onesta, ispirata a Stodolna 2013). Ma da lontano, finché gli eventi sono pochi, non c'è nulla da vedere, e il passaggio da sfere a punti è un salto.

**(b) Leggi e dati che li sostituiscono**
- Tabelle Roothaan-Hartree-Fock in base di orbitali di Slater per Z = 2–54: «Roothaan-Hartree-Fock ground-state atomic wave functions: Slater-type orbital expansions and expectation values for Z = 2-54» (Bunge, Barrientos, Bunge, ADNDT 1993); la compilazione dà le energie HF a 10 cifre [V-riass.] ([OSTI 6871456](https://www.osti.gov/biblio/6871456)). Koga e altri (IJQC 1999) danno versioni analitiche con esponenti vincolati alla cuspide nucleare, con energie entro pochi µhartree dal limite HF numerico, per He–Xe, Li⁺–Cs⁺ e H⁻–I⁻ [V-riass.] ([indice Unibo](https://acnpsearch.tweb-dev.unibo.it/singlejournalindex/48021165)). Esiste anche HF-Roothaan con B-spline per i neutri He–Uuo [V-riass.] ([OSTI 21333874](https://www.osti.gov/biblio/21333874)). La densità sferica è `ρ(r) = Σ_orb n_orb·|Σ_k c_k·N_k·r^(n_k−1)·e^(−ζ_k r)|²/(4π)` [R per la forma standard].
- Esponenti singoli di Clementi-Raimondi (1963) e Clementi-Raimondi-Reinhardt (1967), ottimizzati per orbitale fino a Z = 86: sostituiscono le regole di Slater con un solo numero per sottoguscio, allo stesso costo [R].
- Fattori di forma atomici per i raggi X come somma di gaussiane: Cromer-Mann (International Tables, 4 gaussiane + c) e Waasmaier-Kirfel 1995 (Acta Cryst. A51, 416; 5 gaussiane + c, elementi e ioni fino a Cf) [R]. Siccome `f(s) = Σ aᵢ·exp(−bᵢ s²) + c` con s = sin θ/λ, la densità nello spazio reale è **analitica**: `ρ(r) = Σ aᵢ·(4π/bᵢ)^(3/2)·exp(−4π² r²/bᵢ)`, più c come carica puntiforme del nocciolo [R per la trasformata; da controllare su un caso]. Sono densità di atomi liberi HF o relativistiche, cioè «misurate» nel senso della cristallografia.
- Promolecola, o modello ad atomi indipendenti (IAM): la densità di un sistema è la somma di quelle dei suoi atomi liberi (Hirshfeld 1977) [R]. La densità di deformazione Δρ = ρ_vera − ρ_IAM è quella che si misura per diffrazione X e che `research_notes/Scala quantistica/note.md` cita [V-cod sulla nota].
- Hückel esteso (Hoffmann 1963): `H_ii` = −potenziale di ionizzazione di valenza, `H_ij = K·S_ij·(H_ii + H_jj)/2` con K = 1,75. Costa una diagonalizzazione n×n con n = numero di orbitali di valenza, e lo stesso codice di integrali di sovrapposizione STO-3G di `quanti.js` gli basta [R]. Tight binding di Slater-Koster (1954) per i solidi, con parametri ss σ, sp σ, pp σ, pp π dipendenti dalla distanza [R]. GFN2-xTB (Grimme; LGPL-3) come riferimento fuori linea [R].
- Tabelle DFT. NIST «Atomic Reference Data for Electronic Structure Calculations» (Kotochigova, Levine, Shirley, Stiles, Clark; LDA/LSD/RLDA per Z = 1–92) dà energie totali e autovalori, non le densità a griglia, ma il programma che le produce è disponibile [R]. Per i cristalli, le densità di carica DFT di Materials Project (file CHGCAR; dati CC BY 4.0) [R].

**(c) Costo ed errore**
- Il registro `research_notes/Scala quantistica/note.md` dà già i riscontri di STO-3G: H₂ −1,11671 Eₕ, H₂O −74,9420800 Eₕ (all'ottava cifra), densità a metà del legame di H₂ 6% sotto il limite HF [V-cod sulla nota]. Hartree-Fock costa «qualche decimo di secondo» in un worker (`tre/quanti.worker.js:2`) [V-cod].
- VMD calcola le griglie di orbitali molecolari su GPU fino a 186 volte più in fretta di un core di CPU, e la stessa macchina «si adatta alla densità di carica» [V-riass.] ([Stone et al. 2009](https://tcbg.illinois.edu/Publications/Papers/PDF/STON2009/STON2009.pdf); [GPU Computing Gems, cap. 1](https://www.oreilly.com/library/view/gpu-computing-gems/9780123849885/B9780123849885000012.xhtml)). La superficie a densità gaussiana QuickSurf anima superfici fino a un milione di atomi, con prestazioni di ordini di grandezza sopra Surf e MSMS [V-riass.] ([Stone, ACS 2013](https://www.ks.uiuc.edu/Research/gpu/files/acs2013_stone.pdf)).
- Una resa di volume a fette con funzione di trasferimento bidimensionale può usare la rappresentazione funzionale dei dati di chimica quantistica senza ricampionarli su una griglia [V-riass.] ([«Interactive visualization of quantum chemistry data»](https://www.academia.edu/48145421/Interactive_visualization_of_quantum_chemistry_data)).
- Il visore WebGL Miew ha l'isosuperficie per le mappe di densità; la sua resa di volume era ancora «alpha» [V-riass.] ([changelog di Miew](https://codeclimate.com/github/epam/miew/packages/miew/CHANGELOG.md/source)). NGL (MIT) legge molti formati di densità in WebGL [V-riass.] ([README di NGL](https://cdn.jsdelivr.net/npm/ngl@2.4.0/README.md)).

**(f) Licenze**: tabelle ADNDT/IJQC sotto copyright dell'editore, ma i coefficienti sono dati numerici (fatti) e si possono riportare citando [R: valutazione, non parere legale]. NIST: dati del governo USA, liberi [R]. Materials Project CC BY 4.0 [R]. NGL MIT [R]; 3Dmol.js BSD-3 [R]; Mol* MIT [R]; xTB LGPL-3 [R]. Miew: licenza non verificata.

### Inferences
- **(b→c) La ricetta in tre gradini, con il suo errore.**
  - **Gradino 0, sempre e ovunque.** La promolecola con le 5 gaussiane di Waasmaier-Kirfel per atomo: 10 numeri per elemento, circa 1 kB per tutta la tavola. È valutabile nello shader come somma su una lista di atomi per tessera, alla QuickSurf. L'errore atteso sulla densità totale è di pochi per cento [R]. Le fit valgono fino a sin θ/λ ≈ 6 Å⁻¹ [R], quindi sotto ~0,05–0,1 Å la cuspide al nucleo non è riprodotta: lì si passa al gradino 1.
  - **Gradino 1, l'atomo guardato.** Multi-ζ di Bunge/Koga al posto di Slater per l'atomo al centro, con i nodi radiali giusti (le «conchiglie» 1s, 2s, 2p…). L'errore è dell'ordine di 10⁻⁶ sull'energia totale rispetto al limite HF [V-riass.]; la correlazione resta esclusa (circa l'1% della densità di valenza [R]).
  - **Gradino 2, il legame.** Δρ da STO-3G (molecole H–Ne, come oggi) o da Hückel esteso (qualunque Z con parametri di valenza). Per i cristalli di `materia.js` (`RETICOLI`): una tabella di coefficienti di Fourier di Δρ per ogni minerale, calcolata una volta fuori linea con DFT o presa da Materials Project. Bastano poche centinaia di riflessi per cella [R: stima], e la valutazione è una somma di coseni nello shader.
- **(d) Bilancio padre ↔ figlio.**
  - Dal padre al figlio. Il materiale (la scena di `atomi3d.js`) passa posizioni, Z, carica ionica (già passata: `quanti.js` `atomoDaScena`, «Na⁺ dell'acqua di mare») e temperatura. La temperatura entra come ampiezza di Debye-Waller `⟨u²⟩ ≈ 3ħ²T/(m·k_B·θ_D²)` ad alta T [R]: la densità vista va **convoluta** con la gaussiana di quel ⟨u²⟩, che è ciò che la diffrazione X misura come densità «termica». La temperatura di Debye è già nella tabella `MATERIALI` di `materia.js:153–161` [V-cod].
  - Dal figlio al padre. Il numero di elettroni integrato deve essere Z − carica (prova di chiusura: ∫ρ = N entro 10⁻³). La superficie a 0,001 u.a. dà il raggio «di contatto» con cui `atomi3d.js` disegna; quindi `raggio` non va più scelto da chi fa la scena, ma letto dalla stessa densità. Bader (1987) mostra che l'isodensità 0,001 u.a. riproduce bene i raggi di van der Waals [R].
- **(e) Resa.** Da 1 nm a ~300 pm: impostori sferici con raggio = isosuperficie della promolecola (identici a oggi a colpo d'occhio, ma derivati dalla densità). Da ~300 pm a ~30 pm: la stessa densità in ray-marching, come isosuperficie (sphere tracing su ρ − ρ_iso) che sfuma in un volume emissione-assorbimento con scala logaritmica, e il Δρ di legame in due colori, positivo e negativo, dichiarato come «densità di deformazione». Gli eventi di misura alla Stodolna restano come strato sopra il campo, non al suo posto: lo strumento si accende quando si «misura», mentre il campo è |ψ|² calcolato, ed è ciò che la diffrazione X ricostruisce. Il testo a schermo dice quale dei due si vede.
- **WebGL2 o WebGPU.** WebGL2 ha le texture 3D ed è sufficiente per la densità analitica. WebGPU serve se si vuole calcolare Δρ di Hückel o HF su griglia in uno shader di calcolo invece che nel worker [R: capacità generali delle API].

### Gaps
- Non ho riletto le tabelle di Waasmaier-Kirfel né di Clementi-Raimondi: numeri e limiti di validità sono [R].
- Non ho trovato una fonte che dia l'errore della promolecola rispetto a HF in percentuale di densità punto per punto: va misurato nelle prove con `quanti.js` `molecola` come riferimento.
- La licenza d'uso dei file CHGCAR di Materials Project e quella di Miew non sono state lette ora.

## 2. Nuclei: stati fondamentali, deformazioni, densità di carica e di nucleoni, decadimenti, disposizioni visibili

### Takeaway
Tre tabelle aperte e due leggi bastano. Le tabelle: (1) la densità di carica modello-indipendente di de Vries 1987 (serie di Fourier-Bessel e somma di gaussiane), o le densità di punti-protone ricavate da essa per 130 nuclei stabili (CC BY 4.0); (2) FRDM(2012) per masse e deformazioni di 9318 nuclei; (3) NUBASE2020/ENSDF per i decadimenti. Le leggi: (4) la superficie deformata `R(θ) = c[1 + β₂Y₂₀ + β₄Y₄₀]` nel Fermi; (5) un campionamento dei nucleoni con nocciolo duro, alla Alvioli-Strikman, che smette di sovrapporli. Le orbite di Woods-Saxon con lo spin-orbita danno i numeri magici come conseguenza invece che come elenco.

### Cited Findings
**(a) Che cosa è messo a mano ([V-cod])**
- `quanti.js:458` `DIFFUSIVITA = 0.52` fm, uguale per tutti i nuclei con A > 20. `:472`: senza un raggio misurato vale `√(3/5)·1,2·A^(1/3)`, che lo stesso file dichiara sbagliato per i nuclei leggeri.
- `quanti.js:477`: per A ≤ 20 un oscillatore armonico con «1s² e il resto nel guscio 1p», `α = (Z − 2)/3`. Per 17 ≤ A ≤ 20 è fisicamente sbagliato, perché si riempie già il guscio sd.
- `quanti.js:471–490`: forma sferica per tutti. I neutroni hanno la stessa forma dei protoni: la pelle di neutroni (PREX-II, 0,28 fm nel piombo) è dichiarata assente.
- `quanti.js:514` `istantanea`: protoni e neutroni sono tirati **indipendenti** dalla densità a un corpo, quindi possono sovrapporsi, e i tre quark di ognuno sono tirati indipendenti tra loro e dal resto.
- `tre/quanti.js:22–25`: neutroni «in blu, per convenzione».
- I decadimenti stanno in `materia.js` (catene U/Th/K/Rb, `:340–440`) e non nel nucleo guardato in `quanti.js`: il nucleo visto da vicino non ha vita media né eventi di decadimento. `Inventario di cio che non emerge.md` riga H27: la tavola dei nuclidi si riduce alle catene di U, Th, K, Rb e C-14 [V-cod].

**(b) Dati e leggi che li sostituiscono**
- De Vries, de Jager e de Vries 1987, ADNDT 36, 495–536: la tabella IV dà i coefficienti della serie di Fourier-Bessel, la V posizioni e ampiezze della somma di gaussiane, le I–III i parametri dei modelli fenomenologici [V-riass.] ([INSPIRE](https://inspirehep.net/literature/244602)). La serie è una somma di funzioni di Bessel sferiche fino a un raggio di taglio R, con la densità nulla oltre [V-riass.] ([hep-ph/0608035](https://arxiv.org/pdf/hep-ph/0608035)).
- Densità di **punti-protone** per 130 nuclei stabili da ⁷Li a ²³²Th, ricavate dalle densità di carica: 171 casi in forme modello-dipendenti (oscillatore armonico modificato, Fermi a 2 e 3 parametri, Gauss a 3 parametri) e 97 in Fourier-Bessel. I raggi quadratici medi concordano tra le forme, e gli autori segnalano i casi incoerenti o con poca copertura in impulso trasferito. Articolo CC BY 4.0 [V-riass.] ([arXiv:2505.04876](https://arxiv.org/abs/2505.04876)). Sostituisce direttamente `rpt` di `quanti.js:475`, che toglie le dimensioni dei nucleoni sommando i quadrati dei raggi.
- FRDM(2012), Möller, Sierk, Ichikawa, Sagawa: masse, energie di legame, correzioni di guscio e di accoppiamento e **deformazioni** dello stato fondamentale per **9318 nuclei da ¹⁶O ad A = 339**. Errore del modello 0,5595 MeV su 2149 masse; goccia a raggio finito + Yukawa ripiegato. DOI 10.1016/j.adt.2015.10.002 (ADNDT 109–110, 2016) [V-riass.] ([arXiv:1508.06294](https://arxiv.org/abs/1508.06294)). L'estratto non nomina β₂ e β₄; che la tabella dia ε₂, ε₄… e β₂ [R].
- Decadimenti: AME2020 e NUBASE2020 come due file di testo IAEA a colonne; vita, spin, modi, abbondanze; ²³⁸U da tenere a 4,468 Ga (ENSDF/DDEP) e non 4,463 [V-rapp] ([NUBASE2020](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt); [LiveChart](https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=238u)).
- Correlazioni: le configurazioni prese dal modello a particelle indipendenti contengono nucleoni sovrapposti. Alvioli, Drescher e Strikman generano le configurazioni con una ricerca di Metropolis guidata dalle densità realistiche a uno e due corpi, poi con le correlazioni di spin e isospin. Nel 2019 il metodo è stato esteso alle distribuzioni separate di protoni e neutroni con la pelle di neutroni (⁴⁸Ca, ²⁰⁸Pb) [V-riass.] ([Alvioli et al., generatore di configurazioni](https://publikationen.ub.uni-frankfurt.de/frontdoor/index/index/year/2023/docId/76434); [arXiv:1811.10078](https://arxiv.org/pdf/1811.10078.pdf)). Uno studio indipendente con GLISSANDO conclude che per gli scopi pratici basta un generatore con **repulsione a nocciolo duro** [V-riass.] ([arXiv:1003.1088](https://arxiv.org/pdf/1003.1088)).
- Leggi [R]:
  - Fermi deformato `ρ(r,θ) = ρ₀/{1 + exp[(r − c·(1 + β₂Y₂₀(θ) + β₄Y₄₀(θ)))/a]}`.
  - Woods-Saxon `V(r) = −V₀/[1 + e^((r−R)/a)]` più lo spin-orbita `V_ls ∝ (1/r)·dV/dr·l·s`. Parametri «universali» di Ćwiok e altri (1987), con V₀ ≈ 49,6·[1 ± 0,86·(N−Z)/A] MeV, R = r₀A^(1/3) con r₀ ≈ 1,27–1,35 fm, a ≈ 0,70 fm [R, i numeri vanno riletti].
  - Densità di saturazione ρ₀ ≈ 0,16 nucleoni/fm³ [R].
  - Pelle di neutroni empirica dagli atomi antiprotonici (Trzcińska et al. 2001): `Δr_np ≈ (0,90 ± 0,15)·(N−Z)/A + (−0,03 ± 0,02)` fm [R]. Per ²⁰⁸Pb dà 0,16 fm [C], dentro l'incertezza di PREX-II (0,28 ± 0,07, citato in `quanti.js` [V-cod]).
  - Goccia liquida (coefficienti di Rohlf, ⁵⁶Fe 495,4 contro 492,26 MeV, fallisce sotto A ≈ 12) [V-rapp].

**(c) Costo ed errore**
- Fourier-Bessel: circa 15 coefficienti per nucleo e una somma di j₀(qᵢr) [R per il numero]. L'errore è quello sperimentale (pochi per mille sul raggio quadratico medio [R]). Per i nuclei non tabulati, il Fermi 2pF con c e a interpolati in Z, più β₂ da FRDM.
- Woods-Saxon con Numerov: equazione radiale 1D, circa 1000 punti × circa 20 orbite × bisezione sull'energia, cioè millisecondi in JS [C: stima d'ordine]. La densità come somma di |φ_nlj|² sugli occupati riproduce le oscillazioni interne con un errore del 5–10% [R]. Il raggio si riscalda sul raggio misurato, come oggi.
- Nocciolo duro: rigetto sequenziale con distanza minima d_min ≈ 0,4–0,9 fm tra i centri [R: valori in uso nei Glauber MC]. Per ²⁰⁸Pb sono circa 208²/2 controlli, irrilevanti. Il rigetto deforma un poco la densità a un corpo, e GLISSANDO la ricorregge [R].

**(f) Licenze**: arXiv:2505.04876 CC BY 4.0 [V]. AME/NUBASE senza licenza nei file; gli articoli CC BY 3.0 secondo l'editore [V-rapp]. FRDM su arXiv con la licenza non esclusiva arXiv 1.0; i dati delle tabelle ADNDT sono di Elsevier come file, ma sono numeri [V per la licenza arXiv; R per il resto]. ENSDF/NuDat: dati pubblici del governo USA e dell'IAEA [R].

### Inferences
- **(b) Sostituzioni nel codice.**
  - `DIFFUSIVITA` e `1,2·A^(1/3)` vanno sostituiti da: Fourier-Bessel o Gauss dove de Vries ha il nucleo; per gli altri, 2pF con (c, a) interpolati sui tabulati e β₂ da FRDM.
  - L'oscillatore armonico `A ≤ 20` va sostituito con le orbite di Woods-Saxon + spin-orbita per tutti i nuclei: così il guscio sd per ¹⁸O–²⁰Ne e i numeri magici escono dalla legge.
  - Neutroni: la stessa densità più `Δr_np` (o, meglio, le orbite di Woods-Saxon dei neutroni con il loro V₀ isovettoriale), con il riscontro PREX-II stampato nelle prove.
- **(d) Bilancio padre ↔ figlio.**
  - Dal padre al figlio. L'atomo (Z, A dalla composizione isotopica del luogo, non da `numeroDiMassa` arrotondato, `quanti.js:456`) sceglie il nuclide. Il luogo (età, concentrazione di U e Th da `materia.js`) dà la probabilità che quel nucleo **sia** un radionuclide o un suo figlio. Il ritmo di decadimento λ = ln2/T½ viene da NUBASE.
  - Dal figlio al padre. Un decadimento guardato è un evento con indirizzo (`…/atomo/nucleo/decadimento`) il cui tempo si tira con `−ln(u)/λ`, come già fa `sovrapposizione` per il fotone (`quanti.js:153`). L'energia Q si divide tra i figli (α, rinculo, β, ν, γ) con gli stessi numeri di `materia.js:434–440`, e quelle particelle entrano nel trasporto della domanda 4. Il calore per chilo deve coincidere con quello che `materia.js` già confronta con Dye 2012 entro lo 0,1% [V-cod]: è la prova di chiusura del bilancio tra i due livelli.
- **(e) Resa onesta del nucleo.**
  - Da 100 a 10 fm: la densità di carica come volume con l'isosuperficie a metà densità (raggio c), deformata da β₂; la pelle di neutroni come guscio di un altro tono. La didascalia dice che è la densità misurata per diffusione di elettroni, non una fotografia.
  - Da 10 a 1 fm: istantanee di nucleoni con nocciolo duro. Con ρ₀ ≈ 0,16 fm⁻³ la distanza media è circa ρ₀^(−1/3) ≈ 1,84 fm [C], e ogni nucleone ha raggio di carica di circa 0,84 fm: le sfere si toccano, e questo è il dato fisico da mostrare (il nucleo è «pieno»). Le istantanee cambiano a ogni evento: il tempo di attraversamento è circa 2R/(0,25c) ≈ 2·10⁻²² s [C, con la velocità di Fermi ≈ 0,25c, R], quindi a tempo reale si vede la media, cioè la densità. Si vedono le istantanee solo rallentando, lo stesso principio di Nyquist che `tre/quanti.js` usa già per i battimenti.
  - Colori: carica e isospin con la stessa convenzione di oggi, ma dichiarata come canale (sonda di carica o di materia) e non come colore vero.
- **Visualizzazioni di riferimento.** L'«imaging» della forma di ²³⁸U con gli urti di ioni pesanti a RHIC (STAR, Nature 2024) mostra che la deformazione β₂ è un'osservabile [R: non riletto]. È un buon testo per la didascalia.

### Gaps
- Non ho letto la tabella FRDM: non so se riporta β₂ direttamente o soltanto ε₂ (la conversione ε → β è nota ma va presa dall'articolo).
- I parametri «universali» di Woods-Saxon e la formula di Trzcińska sono ricordati, non verificati.
- Non ho trovato in questa sessione un codice JS aperto di Woods-Saxon + spin-orbita: va scritto, ed è breve.

## 3. Dentro i nucleoni: distribuzioni dei partoni, QCD su reticolo, che cosa si può mostrare onestamente

### Takeaway
L'unica immagine spaziale del nucleone che sia **modello-indipendente** è la densità di carica **trasversa** nel riferimento a impulso infinito, la trasformata di Hankel 2D di F₁(Q²) (Miller 2007). La densità 3D di Breit che il codice usa oggi non è un'immagine in un riferimento fisico. Le distribuzioni partoniche danno frazioni d'impulso a una risoluzione Q, non posizioni: il numero di partoni «visti» cresce con Q, e questa crescita è la cosa onesta da mostrare scendendo da 0,1 fm a 10⁻¹⁸ m (Q da 2 a 200 GeV). La QCD su reticolo mostra due cose: il tubo di flusso a Y tra tre quark statici, e il vuoto euclideo (densità d'azione e carica topologica) dopo un lisciamento. Sono immagini vere di quantità calcolate, ma euclidee, lisciate e prive di tempo reale, e vanno dichiarate così.

### Cited Findings
**(a) Che cosa è messo a mano ([V-cod])**
- `quanti.js:491–512`: densità 3D dal fattore di forma con la trasformata sferica `ρ(r) = (1/2π²)∫G(q)·sin(qr)/(qr)·q²dq` di G_E (Kelly 2004, Galster 1971). L'intestazione `:56–58` ammette che vale «solo nel riferimento di Breit» e che il raggio di Kelly (0,86 fm) non è quello muonico (0,841 fm).
- `quanti.js:507–508`: le densità u e d come combinazioni di isospin `u = 2ρ_p + ρ_n`, `d = ρ_p + 2ρ_n`, con lo strano trascurato.
- `quanti.js:514–519`: «ogni istantanea mette tre quark di valenza», con posizioni indipendenti. Non ci sono gluoni né mare.
- `quanti.js:59` e `STATO`: «il vuoto della QCD … non è simulato», e `tre/quanti.js` lo lascia nero.

**(b) Leggi e risultati che li sostituiscono**
- Miller, PRL 99, 112001 (2007): la densità di carica dei partoni nel piano trasverso, nel riferimento a impulso infinito, è modello-indipendente. Nel neutrone è **negativa al centro** (il raggio trasverso al quadrato è positivo); la densità centrale del protone supera di circa il 30% quella del quark [V-riass.] ([doi:10.1103/PhysRevLett.99.112001](https://doi.org/10.1103/PhysRevLett.99.112001); [ar5iv 0705.2409](https://ar5iv.labs.arxiv.org/html/0705.2409); [APS Focus](https://physics.aps.org/story/v22/st11)). Formula: `ρ(b) = ∫₀^∞ (Q dQ/2π)·J₀(Qb)·F₁(Q²)`, con F₁ = (G_E + τG_M)/(1 + τ), τ = Q²/4M² [R: la forma, da riscontrare sull'articolo].
- Tubo di flusso: Bissey e altri (PRD 76, 114512, 2007), 200 configurazioni quenched, QCD O(a²)-migliorata, reticolo 16³×32, passo 0,123 fm. A grandi separazioni il tubo è a **Y**; nessuna evidenza della forma a Δ; il nodo è il 25% più largo (0,47 ± 0,02 fm), con una soppressione del vuoto dell'8,1 ± 0,7%; lo stato fondamentale minimizza la lunghezza del tubo [V-riass.] ([arXiv:hep-lat/0606016](https://arxiv.org/abs/hep-lat/0606016)). Il quark-diquark ha la stessa tensione della corda quark-antiquark (PRD 80, 114506, 2009) [V-riass.].
- Vuoto QCD: Leinweber, «Visualizations of the QCD Vacuum», hep-lat/0004025: densità d'azione e di carica topologica in fette 3D di reticoli 24³×36 e 16³×32 (O(a²)), annichilazione istantone-antiistantone, confronto tra le azioni standard e «sovra-migliorate» **usate per lisciare** i campi di gauge [V-riass.] ([arXiv:hep-lat/0004025](https://arxiv.org/abs/hep-lat/0004025)). Le pagine animate di Adelaide (`physics.adelaide.edu.au/theory/staff/leinweber/VisualQCD/…`) rispondevano 503 durante questa sessione: non lette.
- Partoni [R]: PDF f(x, Q²) dalle fit globali (CT18, NNPDF4.0, MSHT20), distribuite come griglie LHAPDF. Evoluzione DGLAP: a Q più grande compaiono più gluoni e più mare a piccola x. Risoluzione spaziale λ ≈ ħc/Q.

**(c) Costo ed errore**
- ρ(b) di Miller: una trasformata di Hankel 1D su F₁ già parametrizzato (Kelly) e tabulata una volta (400 punti, come `nucleone()` oggi) [C: stesso costo]. L'errore viene dai fattori di forma. Con Kelly il raggio resta quello della diffusione di elettroni: va riscalato sul raggio muonico 0,8409 fm, già in `RP2` (`quanti.js:457`).
- PDF: una griglia LHAPDF (x × Q² × sapori) sottocampionata a circa 50 × 20 × 7 valori, cioè circa 30 kB in Float32 [C]. Interpolazione bilineare in (log x, log Q²), errore sotto l'1% fuori dai bordi [R].

**(f) Licenze**: LHAPDF è GPL-3 come codice [R]; le griglie hanno licenze diverse per gruppo (NNPDF dichiara le griglie di libero uso con citazione [R]); da verificare per ogni insieme. I risultati del reticolo sono articoli: le immagini di Leinweber non hanno una licenza letta, e non vanno copiate; si può rifare la stessa grandezza da configurazioni aperte (ILDG) [R].

### Inferences
- **Che cosa si può mostrare onestamente, in ordine di onestà decrescente.**
  1. ρ(b) trasversa del protone e del neutrone, come disco visto lungo la direzione del moto (sta in un riferimento definito: quello del nucleone «in volo»).
  2. Le frazioni d'impulso e il numero di partoni risolti a ogni zoom: a larghezza di schermo W, Q ≈ ħc/W, cioè 0,197 GeV·fm/W. A W = 0,1 fm Q ≈ 2 GeV; a W = 10⁻³ fm (10⁻¹⁸ m) Q ≈ 197 GeV [C]. Le istantanee di partoni si tirano con indirizzo (`…/nucleone/partoni a Q`): numero da ∫f dx sopra un x_min dichiarato, x da f, posizione trasversa da un profilo b(x) che si stringe a grande x. Il profilo è un modello delle GPD, [R]: da dichiarare come modello.
  3. Il tubo a Y tra tre quark **statici**, come densità d'azione soppressa (8%) su un nodo di 0,47 fm [V-riass.]. È un risultato di quark infinitamente pesanti, non del protone vero: la didascalia lo dice.
  4. La «schiuma» del vuoto euclideo come trama di fondo animata nel tempo euclideo, con la scritta «tempo immaginario, campi lisciati: è la struttura delle configurazioni che pesano nell'integrale di cammino, non un filmato».
- **(d) Bilancio.** Dal padre al figlio: il nucleone nel nucleo porta il suo impulso di Fermi (fino a ≈ 250 MeV/c [R]), che distorce poco le PDF (effetto EMC, ~10% [R]). Dal figlio al padre: niente di dinamico risale. La massa del nucleone (938 MeV, quasi tutta energia di campo) e i raggi entrano già nel nucleo. La crescita dei partoni con Q è una proprietà della sonda, non dello stato: non va contata in nessun bilancio d'energia.
- **(a→b) Cambio minimo nel codice.** Passare da `densitaDaFattore` (Breit, 3D) a ρ(b) 2D per la resa. Tenere la densità 3D solo come «forma convenzionale», dichiarata. Le tre posizioni dei quark di valenza indipendenti vanno tolte: o le si correla con il baricentro (somma dei vettori = 0, la condizione di centro di massa, costo nullo), o le si sostituisce con il disco dei partoni del punto 2.

### Gaps
- Le pagine animate di Leinweber non erano raggiungibili: non so quanti passi di lisciamento, né quale passo di reticolo, usino le animazioni.
- Formula e numeri dei profili b(x) delle GPD non verificati; nessuna fonte letta ora.
- Licenze delle singole griglie PDF non verificate.

## 4. Particelle nella materia: Bethe-Bloch, diffusione multipla, cascate, storia condensata (Geant4, PENELOPE), tracce di fissione e danno da rinculo α, percorsi alla SRIM

### Takeaway
`materia.js` ha già il nocciolo giusto (Bethe-Bloch + Lindhard-Scharff + ZBL + Highland). Mancano quattro cose. (1) Le correzioni di guscio sono un ritocco empirico tarato a mano: si sostituiscono con le tabelle NIST o con le correzioni di Bichsel. (2) Lo spostamento laterale e la conversione tra percorso vero e geometrico: le formule chiuse del modello di Urban di Geant4 permettono passi lunghi deterministici in 3D. (3) Lo schema misto di PENELOPE, che separa gli eventi duri (raggi delta, bremsstrahlung) come eventi con indirizzo dai passi morbidi continui. (4) La struttura radiale della traccia a scala nanometrica (nocciolo e penombra), che lega la traccia vista da 10 µm a quella vista da 10 nm. Tracce di fissione: latenti, ≤ 9–13 nm di diametro e ~20 µm di lunghezza; tracce di rinculo α sotto i 20 nm.

### Cited Findings
**(a) Che cosa è messo a mano ([V-cod])**
- `materia.js:269–272`: la correzione di guscio è una «forma empirica 19·x/(x + 40)², tarata sui protoni in acqua e in quarzo (NIST PSTAR, ICRU 49)».
- `materia.js:285`: per i muoni l'irraggiamento `b = 4,0·10⁻⁶·(Z²/A / 5,5)·…` con una rampa `limita(0,25 + 0,25·log₁₀(E/1000), 0, 1)` scritta a mano.
- `materia.js:475` `PHI = 0.55` GV e `LAMBDA_ATT = 1.4`; `:479` `RESA_MUONI`; `Inventario` MA2, MA4.
- `materia.js:80–83` parametri liberi dichiarati: quante tracce si disegnano, la taglia del granello dell'alone (1–6 µm), la compressione del tempo.
- `materia.js:84–86`: «il motore è un piano», cioè solo le tracce nel piano della finestra. La diffusione multipla dà un angolo (Highland, `:39`, `:296`), ma nessuna formula di spostamento laterale.
- Ricottura a soglia netta (`materia.js:98`, `:153–161`; `Inventario` MA5). Ketcham 2007 è già proposto [V-rapp].

**(b) Leggi che li sostituiscono**
- Modello di Urban (Geant4 Physics Reference Manual, «Multiple Scattering») [V] ([Geant4 PRM](https://geant4.web.cern.ch/documentation/dev/prm_html/PhysicsReferenceManual/electromagnetic/elastic_scattering/msc.html)):
  - θ₀ di Highland modificato per e±: `θ₀ = (13,6 MeV/βcp)·z·√y·c`, con y = ln(t/X₀) e `c = c₀(c₁ + c₂y)`, dove `c₀ = 0,990395 − 0,168386·Z^(1/6) + 0,093286·Z^(1/3)`, `c₁ = 1 − 0,08778/Z`, `c₂ = 0,04078 + 0,00017315·Z`.
  - Percorso vero e geometrico: `⟨z⟩ = λ₁[1 − e^(−t/λ₁)]`. Con la perdita d'energia, λ₁(t) = λ₁₀(1 − αt) e `t(z) = (1/α)[1 − (1 − αwz)^(1/w)]` con w = 1 + 1/(αλ₁₀); a bassa energia α = 1/r₀, r₀ il percorso residuo.
  - Spostamento laterale, con τ = t/λ₁ e κ = λ₁/λ₂ = 2,5: `⟨x²+y²⟩ = (4λ₁²/3)[τ − (κ+1)/κ + κ/(κ−1)·e^(−τ) − 1/(κ(κ−1))·e^(−κτ)]`. Correlazione con la direzione: `⟨x·vₓ + y·v_y⟩ = (2λ₁/3)[1 − κ/(κ−1)·e^(−τ) + 1/(κ−1)·e^(−κτ)]`.
  - Limite del passo `f_r·max{r, λ₁}` (f_r = 0,02–0,04 per e±, 0,2 per muoni e adroni; il testo e la tabella 15 del manuale non coincidono); diffusione singola `g(u) = C/(2a + 1 − u)²`.
- PENELOPE, schema «classe II» (misto): gli urti duri, sopra le soglie di energia ceduta W_cc (anelastici) e W_cr (bremsstrahlung) o di angolo, sono simulati uno per uno; i morbidi si accumulano con il metodo della «cerniera casuale» (random hinge) e una perdita continua a frenata costante. C₁ limita la deviazione angolare media per passo, C₂ la perdita frazionaria media; scelte «alla cieca» C₁ = C₂ = 0,05–0,1, W_cc = W_cr ≈ 1 keV [V-riass., da slide di un workshop] ([brief classe II](https://indico.global/event/5912/contributions/48918/attachments/24372/41866/classII-brief.pdf); [Asai et al. 2021, Front. Phys.](https://www.frontiersin.org/articles/10.3389/fphy.2021.738735/full)).
- Correzioni di guscio, Barkas e Bloch rendono Bethe accurata all'1% fino a ~1 MeV per i protoni; spostamento laterale `y_rms = x·θ₀/√3`; radiazione di transizione [V-rapp] ([PDG, Passage of particles through matter](https://pdg.lbl.gov/2024/reviews/rpp2024-rev-passage-particles-matter.pdf)).
- Danno: NRT `N_d = 0,8·T_d/(2E_d)`, arc-dpa; nei metalli i difetti residui sono ~1/3 di NRT; per i minerali, modello ridotto NRT × 1/3 [V-rapp] ([Nordlund et al. 2018](https://doi.org/10.1038/s41467-018-03415-5)).
- Tracce latenti di fissione: cilindri di danno di diametro O(10) nm e lunghezza O(20) µm; nell'apatite fino a 9 nm di diametro e ~21 µm di lunghezza [V-riass.] ([whitepaper sulla rivelazione con minerali, arXiv:2301.07118](https://arxiv.org/pdf/2301.07118)). Al TEM, nell'apatite, larghezze di 5–13 nm parallele all'asse c e di 3–9 nm perpendicolari [V-riass.] ([Am. Mineral. 77, 336](https://msaweb.org/AmMin/AM77/AM77_336.pdf)). L'accorciamento delle tracce è causato dai rinculi α, non dalle α, e lo zircone è più sensibile dell'apatite [V-riass.] ([OSTI 1818964](https://www.osti.gov/pages/servlets/purl/1818964)).
- Tracce di rinculo α: percorsi < 0,02 µm, viste solo sui piani di sfaldatura delle miche (scoperte nel 1967) [V-riass.] ([Nature 320, 425](https://www.nature.com/articles/320425a0.pdf)).
- Percorsi analitici [R]:
  - Bragg-Kleeman `R = α·E^p` (protoni in acqua: α ≈ 0,0022 cm·MeV^(−p), p ≈ 1,77; Bortfeld 1997).
  - Elettroni: Katz-Penfold `R [g/cm²] = 0,412·E^(1,265 − 0,0954·ln E)`, 0,01–2,5 MeV.
  - Kanaya-Okayama `R [µm] = 0,0276·A·E^1,67/(Z^0,889·ρ)`, E in keV: la sola costante non è confermata. Vale sopra 10 keV, e sotto c'è una fit su CASINO precisa entro il 10% [V-riass.] ([Microsc. Microanal. 2002](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/B79C9D90254FAE4A2D0B3810F017A48C/S1431927602106155a.pdf/electron_range_at_low_energy_eo_10_kev_atomic_number_dependant.pdf)).
- Cascate [R]: profilo elettromagnetico longitudinale `dE/dt = E₀·b·(bt)^(a−1)·e^(−bt)/Γ(a)` con t_max = ln(E₀/E_c) − 0,5 (elettroni) o + 0,5 (fotoni) (PDG); Heitler: N_max ≈ E₀/E_c, X_max ≈ X₀·ln(E₀/E_c); Heitler-Matthews (2005) per gli sciami adronici, `N_μ ≈ (E₀/ξ_c^π)^β` con β ≈ 0,85–0,9. MCEq (BSD-3) per tarare fuori linea [V-rapp].
- Struttura radiale della traccia [R]: la dose attorno alla traccia di uno ione cala come 1/r² fino a r_max, il percorso dei raggi delta più energetici (modelli di Katz, Chatterjee-Schaefer, Kiefer-Straaten), con un nocciolo di qualche nm.

**(c) Costo ed errore**
- Con le formule di Urban un passo condensato costa O(1): un θ, uno spostamento laterale dalla sua varianza e correlazione, una lunghezza geometrica. Il manuale avverte che si usano solo i valori medi per lo spostamento e la correlazione [V]. L'errore sulla deposizione, rispetto a una simulazione dettagliata, dipende da f_r e dal passo: l'articolo di confronto arXiv:1209.6003 lo studia [V-riass.] ([arXiv:1209.6003](https://arxiv.org/pdf/1209.6003)); numeri non letti.
- Un passo per decimo del percorso residuo (f_r ≈ 0,1) dà circa 20–30 passi per traccia [C: geometrico, r_k = 0,9^k·r₀ fino all'1%]. Per 10⁴ tracce sono 3·10⁵ passi per fotogramma: sostenibile in un worker.

**(f) Licenze**: Geant4: licenza Geant4 (permissiva, stile BSD) [R]; il manuale è leggibile e le formule si possono riscrivere. PENELOPE: distribuito dalla NEA Data Bank, con licenza d'uso non libera [R]. SRIM: freeware non open, uso non commerciale [V-rapp per «uso non commerciale»]. NIST ESTAR/PSTAR/ASTAR: Standard Reference Data, liberi da consultare; la ridistribuzione dei numeri va citata [R]. MCEq BSD-3 [V-rapp].

### Inferences
- **(b→c) Che cosa cambiare.**
  - (1) Al posto di `19x/(x+40)²` e della rampa dei muoni: tabelle 1D precalcolate da PSTAR/ASTAR/ESTAR per i materiali base, più Bethe con le correzioni di guscio e Barkas per i composti, verificate entro 1–2% contro NIST (le prove esistono già per acqua, aria e quarzo: «entro il 2–3%», `materia.js:37`).
  - (2) Passi condensati 3D con Urban: chiudono MN1 («il motore è un piano»), perché la traccia resta coerente in 3D anche se si mostra una sezione.
  - (3) Classe II: ogni raggio delta sopra W_cc è un **evento con indirizzo** (`…/traccia/delta k`) con energia da dN/dT ∝ 1/T² (già in `materia.js:299`) e un percorso proprio. Sotto W_cc la perdita è continua.
  - (4) Determinismo: ogni passo k di una traccia legge `contatore("…/traccia/passo k")`. Lo stesso indirizzo dà la stessa traccia a qualunque zoom: è la condizione perché la traccia vista da 10 µm e quella vista da 10 nm coincidano.
- **(d) Bilancio padre ↔ figlio, chiuso.**
  - Dal padre al figlio. Composizione (Z/A, I), densità, temperatura e ricottura dal minerale. Il campo di radiazione: concentrazioni di U, Th, K da `materia.js`, spettro dei raggi cosmici dalla catena unica proposta nel rapporto. Ne escono i ritmi per volume.
  - Dal figlio al padre. (i) Energia: Σ (energia depositata) + Σ (energia che esce dal volume: γ, ν, muoni passanti) = Σ Q, controllato evento per evento. Il deposito per unità di tempo è il calore radiogenico che `leggi.js` usa per l'interno. (ii) Danno: N_d dalle energie dei rinculi (NRT × 1/3) → dpa accumulati per l'età → frazione amorfa → accorciamento e ricottura delle tracce (Ketcham) e colore degli aloni (soglia ~3·10¹³ α/cm², `materia.js` [V-cod]). (iii) Elio: ogni α diventa un atomo di He trattenuto o perso secondo la temperatura. È il cronometro (U-Th)/He, ed è un riscontro indipendente della storia termica [R per la legge di diffusione].
- **(e) Resa per banda.**
  - Da 1 m a 1 mm: sciami e muoni come linee, con il profilo longitudinale.
  - Da 1 mm a 1 µm: tracce α (percorso ~20–40 µm nella roccia [R]) con il picco di Bragg reso come spessore ∝ dE/dx; aloni concentrici, con un raggio per riga α; tracce di fissione di ~20 µm.
  - Da 1 µm a 10 nm: la traccia diventa un cilindro di danno largo 3–13 nm [V-riass.], con la penombra dei raggi delta ∝ 1/r².
  - Sotto 10 nm: dentro `atomi3d.js`, gli atomi spostati (le coppie di Frenkel di NRT) e la zona amorfa, cioè il reticolo che si disordina; il rinculo α è un groviglio di < 20 nm [V-riass.].
  - Nel tempo: una α si ferma in circa 2–3 ps (20 µm a una velocità media di ~0,75·10⁷ m/s) [C]; il frammento di fissione in ~1 ps; il picco termico del nocciolo dura 10⁻¹³–10⁻¹¹ s [R]. Quindi la traccia «istante» va mostrata a 10⁻¹² s per secondo di schermo, quella «memoria» per l'età della roccia: i due modi che `materia.js:18–22` ha già, ora con un orologio comune (domanda 5).

### Gaps
- La costante di Kanaya-Okayama e i parametri di Bragg-Kleeman e Katz-Penfold non sono stati riletti.
- Non ho letto i numeri d'errore di arXiv:1209.6003, né la versione ufficiale dei parametri di PENELOPE (solo le slide).
- Le licenze esatte di Geant4, PENELOPE e dei dati NIST non sono state rilette in questa sessione.
- Non ho trovato una fonte primaria letta per il raggio del nocciolo delle tracce negli ossidi di silicio (quarzo, feldspati): i numeri sopra sono per l'apatite.

## 5. Continuità: da atomi (sfere o densità) a nuvole a nuclei su 10⁵ di zoom senza decadi vuote; femtosecondi contro secondi

### Takeaway
La continuità si ottiene con **un solo campo** ρ_e(r) + ρ_N(r), reso a ogni zoom con la sua scala logaritmica, al posto di tre viste diverse (sfere, eventi, nucleoni) montate in fila. Le «decadi vuote» tra il guscio 1s (a₀/Z ≈ 0,6 pm nel piombo) e il nucleo (~7 fm) non sono vuote. Ci sono: la densità di contatto degli elettroni s, finita e calcolabile; la nuvola di polarizzazione del vuoto, che si estende fino alla lunghezza Compton ridotta dell'elettrone (386 fm); e, quando un muone cosmico si ferma, un atomo muonico con orbita di 256/Z fm. Per il tempo, a ogni banda di larghezza W corrisponde un tempo caratteristico W/v; va mostrato come orologio di scala, con la media di Nyquist quando il fotogramma è più lungo.

### Cited Findings
**(a) Che cosa è oggi discontinuo ([V-cod])**
- `laboratorio.js:484`: in fondo allo zoom degli atomi `montaQuanti()` crea una **tela separata** (`telaQuanti`, `:496–517`) con `creaQuanti`; tornando su (`:516`) la si smonta. Se il modulo manca, `oltreIlFondo()`. È uno scambio di vista, non uno zoom continuo.
- `atomi3d.js:40–56`: sfere-impostore e, da lontano, gruppi «nebbia» a quattro grossezze. Sotto il raggio dell'atomo non c'è struttura.
- `tre/quanti.js:5–25`: elettroni come eventi verdi (fosforo P43), nucleo come istantanee di nucleoni. Tra la scala dell'elettrone (σ = 0,25 a₀ di default, `:37`) e quella del nucleo, a schermo non c'è nulla.
- `tre/quanti.js:16–18`: per il tempo esistono già la media al tempo vero (regola 11, Nyquist) e un rallentamento a 10⁻¹⁶ s per secondo per i battimenti. Il nucleo e i nucleoni non hanno un orologio loro.

**(b) Leggi che riempiono le decadi (tutte [R] salvo indicazione)**
- Unità e scale: a₀ = 5,29177·10⁻¹¹ m; unità atomica di tempo 2,4189·10⁻¹⁷ s [V-cod `quanti.js:64`]. Guscio K idrogenoide `⟨r⟩_1s = 3a₀/(2Z)` [V-cod `quanti.js:89`]: per il piombo (Z = 82) 0,97 pm, con un massimo di densità radiale a a₀/Z = 0,65 pm [C].
- Densità di contatto: `|ψ_1s(0)|² = Z³/(π·a₀³)` (non relativistica); per gli elementi pesanti il fattore relativistico la aumenta (forse 2–3 volte nel piombo [R, da verificare]). Alla scala del nucleo la nuvola elettronica è quindi una **nebbia uniforme** di densità nota, non il vuoto.
- Polarizzazione del vuoto (Uehling): la carica indotta attorno al nucleo si estende su scale ~ƛ_e = ħ/(m_e c) = 386,16 fm. È la struttura reale tra 1 pm e 10 fm; misurata attraverso il Lamb shift e soprattutto negli atomi muonici.
- Atomo muonico: `a_μ = a₀·(m_e/m_μ)/Z ≈ 256 fm/Z` [C con m_μ/m_e = 206,77]; nel piombo 3,1 fm, cioè **dentro** il nucleo (~7 fm) [C]. Un muone cosmico che si ferma nella roccia (già calcolato da `materia.js`) è un evento che produce questo stato, con la sua cascata di raggi X e la cattura nucleare.
- Tempo nucleare: fm/c = 3,336·10⁻²⁴ s; decadimenti forti ~10⁻²³ s.
- Tempo dell'agitazione termica: fononi ~10¹³ Hz; ampiezza di Debye-Waller ~0,05–0,1 Å a 300 K.

**(e) Le migliori visualizzazioni** (già citate sopra): QuickSurf e le griglie GPU di VMD [V-riass.] per il passaggio continuo da sfere a superfici di densità gaussiana. Stodolna 2013 per l'accumulo di eventi [V-cod sulla nota]. Leinweber per il vuoto lisciato [V-riass.]. Bissey per il tubo a Y [V-riass.]. Il manuale di Geant4 per le tracce coerenti a ogni passo [V].

### Inferences
- **(b) Un campo, molte rese.** Definire a ogni punto lo stesso campo, valutabile a ogni zoom: `ρ_tot(r) = Σ_atomi ρ_e,Z(|r − R_i|) ⊛ DW(T) + Δρ_legame + ρ_N(r) + δρ_vuoto(r)`. Lo shader sceglie il livello d'isosuperficie e la funzione di trasferimento **dalla larghezza del pixel**: l'isolivello scende in modo logaritmico con lo zoom, così a ogni decade c'è una superficie da vedere. Sfere, nuvole, gusci e nucleo sono sezioni dello stesso oggetto, e nessuna vista va «montata». La tela separata di `laboratorio.js` diventa un cambio di funzione di trasferimento.
- **(e) Tabella delle bande** (W = larghezza dello schermo):

| W | Che cosa si vede (dalla legge) | Tempo per secondo di schermo, se si vuole vedere moto | Didascalia |
|---|---|---|---|
| 1 nm – 300 pm | atomi come isosuperficie 0,001 u.a. della promolecola (le «sfere» emergono); agitazione di Debye-Waller | ~10⁻¹³ s (fononi); al tempo vero si vede la media | «superficie di densità elettronica 0,001 u.a.» |
| 300 – 30 pm | volume di densità + Δρ di legame; eventi di misura come strato opzionale | ~10⁻¹⁶ s (battimenti, come oggi) | «densità calcolata; i punti sono misure» |
| 30 – 3 pm | gusci radiali dell'atomo guardato (Bunge/Koga); nucleo puntiforme | 10⁻¹⁷–10⁻¹⁸ s (elettroni interni, v ≈ Zαc) | «gusci 1s, 2s, 2p…» |
| 3 pm – 100 fm | nebbia uniforme degli elettroni s (densità di contatto, con il numero a schermo); alone della polarizzazione del vuoto entro ~386 fm, come densità con segno su scala log; se c'è, l'orbita muonica | 10⁻²¹ s | «quasi tutto è vuoto: questa è la carica indotta nel vuoto, una parte su ~10³» [R per l'ordine] |
| 100 – 10 fm | nucleo: densità misurata (Fourier-Bessel), deformazione β₂, pelle di neutroni | ~10⁻²² s | «densità di carica da diffusione di elettroni» |
| 10 – 1 fm | istantanee di nucleoni con nocciolo duro (si toccano: ρ₀ = 0,16 fm⁻³) | ~10⁻²³ s (media al tempo vero) | «un'istantanea su molte; il nucleo è la loro media» |
| 1 – 0,1 fm | dentro il nucleone: ρ(b) trasversa (centro negativo nel neutrone); tubo a Y tra quark statici | ~10⁻²⁴ s | «densità trasversa, riferimento a impulso infinito» |
| 0,1 fm – 10⁻¹⁸ m | partoni risolti a Q ≈ ħc/W (2 → 200 GeV): il loro numero cresce; trama del vuoto euclideo lisciato | tempo immaginario: non è un filmato | «ciò che vede una sonda di risoluzione Q» |

- **(d) Il tempo come grandezza passata dal padre al figlio.** Ogni banda dichiara il suo tempo naturale τ(W) = W/v(W), con v pari a quella del costituente: elettrone di valenza αc ≈ 2,2·10⁶ m/s, elettrone interno Zαc, nucleone ~0,25c, quark ~c. Se il passo di tempo del motore Δt supera τ, si mostra la media (la densità); se è minore, le istantanee. L'utente non sceglie un fattore arbitrario, ma «tempo di questa scala»: l'orologio a schermo dice quanto tempo reale rappresenta un secondo. Gli eventi rari della domanda 4 (decadimenti, tracce) restano al loro tempo vero, con indirizzo: nella finestra «istante» compaiono al ritmo vero per quel volume, nella «memoria» come accumulo dell'età.
- **(c) Costo complessivo stimato** [C, ordini di grandezza]:
  - promolecola: ~5 gaussiane × ~30 atomi vicini per pixel, cioè ~150 esponenziali per campione di ray-marching;
  - Bunge/Koga per l'atomo al centro: ~10 termini;
  - nucleo: Fourier-Bessel con ~15 termini;
  - tutto entro un fotogramma in WebGL2 con 64 campioni per raggio a metà risoluzione, come già fa l'occlusione ambientale di `atomi3d.js` [V-cod: «a metà risoluzione»].
- **Precisione e regressione.** Ogni banda ha la sua prova di chiusura: ∫ρ_e = N_elettroni; ∫ρ_N = Z (carica) e A (materia); ⟨r²⟩ contro il misurato; energia depositata = Q. Sono numeri che `test/` può stampare come oggi stampa «ciò che non torna».

### Gaps
- Il valore della carica indotta dalla polarizzazione del vuoto a r ~ ƛ_e (frazione di Z), e il fattore relativistico della densità di contatto nel piombo, sono ricordati come ordini di grandezza: vanno calcolati dalla formula di Uehling e dalle soluzioni di Dirac prima di mostrarli con un numero.
- Non ho trovato in questa sessione una visualizzazione pubblicata che attraversi in continuo da 1 nm a 1 fm: la tabella sopra è una proposta del panel, non un esempio esistente.
- La velocità di Fermi (0,25c) e i tempi del picco termico sono [R].
