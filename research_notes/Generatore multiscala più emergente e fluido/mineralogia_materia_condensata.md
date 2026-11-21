# Grani, cristalli e materia condensata: come renderli emergenti, collegati, senza cuciture, rapidi e precisi

Panel: mineralogista e petrografo, fisico della crescita cristallina, scienziato dei materiali (dinamica molecolare e coarse-graining), ingegnere di visualizzazione scientifica.

Marcature usate in tutto il file:
- **[V]**: verificato sul testo della fonte (pagina o PDF letto).
- **[S]**: verificato solo sull'estratto del motore di ricerca (la frase c'è, il testo intero non è stato letto).
- **[V-prec]**: verificato in un rapporto precedente del progetto (`reports/Simulatori e modelli per stateyour.md`), non ricontrollato qui.
- **[R]**: ricordato, non verificato in questa ricerca.
- **[C]**: calcolato o derivato qui.
- **[codice]**: letto nel codice di `/home/user/stateyour` (file:riga). Il repository non è stato modificato.

Fasce di scala citate nel testo (larghezza dello schermo): 10 cm, 1 cm, 1 mm, 100 µm, 10 µm, 1 µm, 100 nm, 10 nm, 1 nm.

---

## 1. Distribuzioni delle taglie (CSD) e tessiture da nucleazione e crescita; tassellature dei grani

### Takeaway
La catena è già nel codice: Tammann, poi decollo e plateau, poi JMAK (rocce.js), poi la tassellatura di Johnson-Mehl (grani.js). Il difetto principale è un altro. La **taglia in metri** dei grani non viene dalla fisica: viene dalla larghezza del campione, scelta a mano (mappa.js:778-792). Anche il raffreddamento è scritto a mano per tipo di roccia. La cura:
- dare dimensioni vere a I e G, cioè nucleazione classica più viscosità del fuso, e prendere il tempo di raffreddamento dalla conduzione;
- calcolare la densità dei grani con la formula chiusa di Avrami, che è già nel codice (natiFinoA, AVRAMI_2D), invece della simulazione 192×192 da 1,6–3 s;
- far curvare la CSD con la maturazione di Ostwald (LSW) usando una tassellatura di potenza (Laguerre).

### Cited Findings

**(a) Che cosa è scritto a mano oggi** [codice]
- `rocce.js:50`: `NASCITA0 = 0.05, BARRIERA = 0.05, VISCOSITA = 3`. Sono le curve di Tammann in unità adimensionali: la barriera di nucleazione e la viscosità non vengono né dalla composizione né dalla tensione superficiale.
- `rocce.js:72`, `rocce.js:91-92`: il raffreddamento si misura «in unità della velocità critica», un numero puro.
- `mappa.js:778-781`: `raffreddamento: 0.003` (continente, sale) e `0.15` (basalto) sono scritti a mano. Lo stesso vale per `larghezzaM = 0.04 / 0.004 / 0.02`.
- `mappa.js:789,792`: `cellaM = larghezzaM / N`, `granoM = r.granoMedio * cellaM`. **La taglia del grano in metri è proporzionale alla larghezza del campione scelta a mano.** Con la stessa fisica, cambiare 0,04 in 0,08 raddoppia i grani del granito.
- `suolo.js:149`: ripete la stessa coppia `[0.15, 0.004] / [0.003, 0.04]`, e con `seme: 1` fisso.
- `mappa.js:772` (`conAnisotropia`) e `suolo.js:149`: a ogni minerale di `chimica.minerali` dà `anisotropia: 1.2`, che poi `limita(…, 0, 1)` porta a 1. Così tutti i minerali di quella lista sono listelle 4:1, quarzo e olivina compresi. La forma non emerge.
- `rocce.js:141`: la retroazione della composizione del fuso è `vel = limita(conc/f, 0.1, 2)`, una regola euristica che fa tornare le proporzioni. Non è un bilancio di massa con diffusione.
- `rocce.js:76-87`: le ricette `GRANITO` e `BASALTO` (frazioni, colori, anisotropie) sono dati osservati e dichiarati come tali.
- `grani.js:79-80`: la densità dei grani si ricava dal grano medio («dato il grano medio si ricava I/G, non lo si sceglie»). Ma il grano medio viene da `granoM`, cioè dalla larghezza scritta a mano.
- `grani.js:12-19` (positivo): Johnson-Mehl con nascita costante, fantasmi di Avrami, il controllo «vero» dei germi anisotropi (`grani.js:110-126`) e la formula N_A = Γ(4/3)·(3/π)^⅓·(I/G)^⅔ (`grani.js:37`) sono già leggi.
- Difetto minore: `grani.js:181` restituisce `orientamento: r.g.phi * Math.PI`. Però l'angolo usato davvero per far crescere il grano è 2π·phi: `g.c = cosGiro(phi)`, e `cosGiro(u) = cos(2πu)` (eventi.js:147). L'orientamento riportato è quindi la metà di quello disegnato. La tinta in luce polarizzata, `SEN(2φ)² = sin²(2θ)` con θ = 2π·phi, è invece corretta. Conclusione dalla lettura del codice, non da un'esecuzione.

**(b) Le leggi e le formule compatte**
- CSD di Marsh (1988): il bilancio di popolazione per cristalli che nascono e crescono dà, a crescita costante, `n(L) = n₀·exp(−L/(G·τ))`. Nel grafico ln n contro L la pendenza vale −1/(Gτ) e l'intercetta n₀ = J/G. È il caso trattato da Cashman e Marsh (1988) per il lago di lava di Makaopuhi [S] ([Marsh 1988, CMP 99:277](https://www.doi.org/10.1007/BF00375362); [Cashman e Marsh 1988, CMP](https://www.doi.org/10.1007/BF00375363)). La forma esatta dell'equazione non è stata letta sul testo originale, solo pendenza e intercetta [S].
- Dalla stessa teoria [R]:
  - numero totale N_T = n₀·Gτ;
  - taglia media Gτ;
  - taglia dominante in volume 4Gτ (3Gτ in alcune trattazioni: da verificare);
  - frazione di volume φ = 6·k_v·n₀·(Gτ)⁴, con k_v il fattore di forma.
- A raffreddamento più lento corrispondono cristalli meno numerosi e più grandi: a controllare è il sottoraffreddamento [S] ([Lindoo e altri 2025](https://eprints.soton.ac.uk/509224/2/Lindoo_et_al._2025.pdf), che cita Cashman 1993).
- Nei raffreddamenti lenti G è quasi costante [S] ([Billon e altri 2025](https://orbi.uliege.be/bitstream/2268/329526/1/Billon%20et%20al.%202025_CMP.pdf)). Questo giustifica il plateau di `rocce.js:110-114`.
- Ordine di grandezza di G nei laghi di lava: circa 10⁻¹⁰ cm/s (Makaopuhi) [R].
- Maturazione di Ostwald (LSW): `⟨R⟩³ − ⟨R⟩₀³ = (8·γ·c∞·v²·D)/(9·R_g·T) · t` [V] ([Wikipedia, Ostwald ripening](https://en.wikipedia.org/wiki/Ostwald_ripening)). Il prefattore 8/9 vale solo per la crescita limitata dalla diffusione. Se a limitare è l'attacco (Wagner) la legge cambia [S] ([LSW, appunti UC](https://www.eng.uc.edu/~beaucag/Classes/Nanopowders/Ostwald%20Ripening%20Rate%20Theories%20(LSW).pdf); [arXiv:0704.0565](https://arxiv.org/pdf/0704.0565)). In geologia corrisponde all'«ingrossamento tessiturale» sotto il solidus, associato ai megacristalli di ortoclasio [V] (stessa pagina).
- Nucleazione classica [R]:
  - barriera ΔG* = 16π·γ³·v_m²/(3·Δμ²), con Δμ ≈ ΔS_f·ΔT per molecola;
  - J = J₀·exp(−ΔG*/kT), con J₀ ∝ (kT/(3π·a³·η)), il prefattore cinetico alla Stokes–Einstein;
  - crescita G = (D/a)·[1 − exp(−Δμ/kT)], con D = kT/(3π·a·η).
  - Sono le stesse due curve di `tammann()`, ma con dimensioni vere.
- Viscosità del fuso: modello di Giordano, Russell e Dingwell (2008), una VFT dalla composizione in ossidi [R].
- JMAK in 3D con nascita costante [C], derivato come in `grani.js:45-48`:
  - X = 1 − exp(−(π/3)·J·G³·t⁴);
  - densità finale dei grani N_V = J·∫exp(−(π/3)JG³t⁴)dt = Γ(5/4)·(3/π)^¼·(J/G)^¾ ≈ **0,8960·(J/G)^¾**;
  - diametro equivalente d ≈ (6/(π·N_V))^⅓ ∝ (G/J)^¼.
  - Il codice applica invece la versione 2D, Γ(4/3)·(3/π)^⅓·(I/G)^⅔, a una nucleazione «in sezione».
- Tassellatura di Poisson–Voronoi in 2D: le aree delle celle seguono una gamma a due parametri con a = b = 3,61 (o a = 3,61, b = 3,57). Il fit a tre parametri di Tanemura è a = 3,315, b = 3,04011, c = 1,078 [S] ([Járai-Szabó e Néda, cond-mat/0406116](https://arxiv.org/pdf/cond-mat/0406116); [arXiv:2508.06630](https://arxiv.org/pdf/2508.06630)). Sul toro k ≈ 3,7, coerente con 3,6 nel piano [S] ([arXiv:2311.11939](https://arxiv.org/pdf/2311.11939)).
- Le microstrutture semplificate (Voronoi, ellissoidi) non catturano tutte le statistiche delle microstrutture vere [S] ([PolyCrysDiff, arXiv:2603.11695](https://arxiv.org/pdf/2603.11695)). La generazione corrente in scienza dei materiali usa tassellature di Laguerre con orientazioni assegnate per riprodurre una tessitura cristallografica [S] ([Comput. Methods Appl. Mech. Engrg. 2026](https://duepublico2.uni-due.de/servlets/MCRFileNodeServlet/duepublico_derivate_00084357/Comput_Methods_Appl_Mech_Engrg_2026_452A_118690.pdf)).
- Conduzione: tempo di raffreddamento t ≈ L²/κ, con κ ≈ 10⁻⁶ m²/s [V-prec, R] (`reports/Come farlo emergere.md` §7).

**(c) Come calcolarlo a poco prezzo, con l'errore noto**
- Si sostituisce `cristallizza()` (1,6–3 s) con la formula chiusa. `mappa.js:792` usa di `cristallizza` solo grandezze scalari: `granoMedio`, `cristallino`, `vetro`, `nGrani`, `minerali` [codice]. `decollo(r)` (2000 passi, `rocce.js:61-69`) dà u, poi `tammann(u)` dà I e G, poi la formula di Avrami dà N_A, il grano medio e X al vetro (`grani.js:49-54`, `natiFinoA` esiste già). Costo: meno di 1 ms.
- L'errore rispetto alla simulazione 192² su toro è l'errore di campionamento finito della simulazione stessa: con ~10² grani nel quadro è dell'ordine di 1/√N, cioè ~10% [C]. La formula chiusa è più esatta, non meno.
- In alternativa si fa una tabella fuori linea di (log raffreddamento) → (I/G, X): 64 righe [C].

### Inferences
**(d) Il padre passa grandezze al figlio, e ritorno**
- La scheda del punto, prodotta da geologia, tettonica e una tabella P–T fuori linea come MAGEMin [V-prec: GPL-3; si incorporano i risultati, non il codice], contiene:
  - composizione in ossidi;
  - profondità di messa in posto, da cui il tempo di raffreddamento τ ∝ L²/κ;
  - T_liquidus e T_solidus;
  - acqua del fuso (abbassa la viscosità);
  - età e T massima dopo la cristallizzazione (per la maturazione).
- Il figlio (grani.js) riceve:
  - le frazioni modali per minerale, dalla tabella di fase;
  - I_m e G_m per ciascun minerale (ordine di comparsa dalla sequenza di cristallizzazione: i primi formano fenocristalli, gli ultimi riempiono gli interstizi);
  - X finale (vetro sì o no);
  - la costante LSW per età × T. Con la tassellatura di Laguerre (pesi = R_i²) il tempo di maturazione elimina i grani piccoli e curva la coda bassa della CSD.
  - Le CSD «a gomito» (due popolazioni, cioè due episodi di raffreddamento) emergono se il padre passa una storia T(t) a due tratti invece di un solo τ.
- Ritorno, cioè chiusura dei bilanci:
  - il colore medio `mediaColore` (grani.js:146) e la densità `conta()` (grani.js:183) devono restituire al padre le frazioni modali e la densità di volume;
  - in una finestra piccola la frazione per minerale fluttua, perché ogni germe pesca il minerale con probabilità f (grani.js:98). Basta che la media su molte finestre sia quella del padre.
  - Una prova di regressione: Σ aree per minerale / area totale → f entro 2σ di Poisson.
- **Stereologia.** Una sezione di una tassellatura 3D non è una tassellatura 2D: le sezioni apparenti sono più piccole e più disperse (problema di Wicksell) [R]. Per una sezione sottile fedele conviene far nascere i germi in 3D, in uno strato spesso circa due grani attorno al piano, e calcolare il primo arrivo nel piano. Il costo per pixel resta dello stesso ordine: circa ×2 germi da guardare [C].
- Il tempo τ sostituisce `raffreddamento` e `larghezzaM` diventa solo l'inquadratura. Senza altro, il granito esce con grani da mm–cm e il basalto da 10–100 µm.

### Gaps
- Le equazioni della CSD non sono state lette sul PDF di Marsh 1988, e il PDF di Higgins e Jerram ha risposto 503. Mancano anche i valori numerici di G e J di Cashman 1993: il testo non è stato raggiunto.
- I coefficienti del modello di viscosità di Giordano 2008 non sono stati verificati.
- Nessuna fonte confronta direttamente le statistiche di Johnson-Mehl con nascita costante e quelle di Poisson–Voronoi. Il fatto che le aree JM siano più disperse è ricordato [R].

---

## 2. Abito cristallino, difetti, spirali di crescita; ghiaccio e neve

### Takeaway
L'«anisotropia» scritta a mano (0–1, `rocce.js:76-87`, e 1,2 per tutti in `mappa.js:772`) si sostituisce con la forma calcolata dalla cella cristallografica che il codice ha già (`materia.js RETICOLI`, `atomi3d.js RETICOLI`). Ci sono tre livelli di fedeltà, in ordine di costo crescente: BFDH (R ∝ 1/d_hkl), energia di attacco (Hartman–Perdok, periodic bond chains) e Wulff (γ_hkl). Per la neve, il diagramma di Nakaya oggi tarato (`rocce.js:190-199`) si sostituisce con la legge di attacco di Libbrecht, α = A·exp(−σ₀/σ), applicata separatamente alle facce basali e prismatiche. Le spirali BCF danno passi e colline di crescita nelle viste AFM a 10–100 nm.

### Cited Findings

**(a) Che cosa è scritto a mano oggi** [codice]
- `rocce.js:73-75`, `rocce.js:115`: `aspetto = 1 + 3·anisotropia`, e la distanza «a modo del cristallo» è una miscela cerchio–rettangolo con il coefficiente 1,13 (`rocce.js:130`, `grani.js:107`). Le facce non sono quelle del reticolo.
- `rocce.js:193-198` (`nakaya`): la «finestra» gaussiana attorno a −15 °C (larghezza 5,5) e a −2 °C (peso 0,45, larghezza 1,5), la soglia `eccesso/0.2` e la relazione `gamma = 0.1·0.03^(b²)` sono tarate sul diagramma.
- `rocce.js:204`: `alfa = 1, beta = 0.6` sono fissi.
- `mappa.js:777`: dove il meteo manca, l'umidità è un sorteggio `0.86 + 0.14·(seme%97)/97` (RC6 dell'inventario).
- `mappa.js:790`: il grano di ghiaccio è `granoGhiaccio(T, 1, D0)`, cioè cresciuto per **1 anno** fisso.
- Positivo: la legge di Gow (`grani.js:38-44`) è una legge misurata.
- `molecole_cristalli.js:37`: `VICINI = 6, PARTE_DI_ENTROPIA = 0.5` sono dichiarati PARAMETRI LIBERI.
- `molecole_cristalli.js:31` elenca ciò che manca: nucleazione primaria e Gibbs–Thomson.
- `atomi3d.js:1343-1344`: le facce del cristallo atomico sono «tagliate nette lungo le facce della scatola», senza ricostruzione. È dichiarato.

**(b) Le leggi e le formule compatte**
- BFDH: le facce con distanza interplanare d_hkl più grande crescono più lente; il modello ignora la chimica e l'impacchettamento [S] ([arXiv cond-mat/0602385](https://arxiv.org/pdf/cond-mat/0602385)).
- Hartman–Perdok: la velocità di avanzamento di una faccia (hkl) è proporzionale all'energia di attacco, cioè l'energia liberata per unità di formula quando uno strato d_hkl si attacca. Le facce sono:
  - F, con almeno due catene periodiche di legami (PBC);
  - S, con una sola;
  - K, con nessuna.
  - Le PBC coincidono con le «valli» della γ-plot di Wulff [S] (stessi risultati di ricerca; [Aquilano e altri 2013](https://iris.unito.it/retrieve/e27ce429-95e4-2581-e053-d805fe0acbaa/Aquilano_et_al_2013_OA.pdf)).
- Wulff: la forma di equilibrio ha la distanza di ogni faccia dal centro h_i ∝ γ_i [R]. La forma di crescita è la stessa costruzione con le velocità R_i al posto di γ_i (Frank–Chernov) [R].
- Fattore α di Jackson, ≈ ΔS_f/R: sopra circa 2 l'interfaccia è liscia e il cristallo è sfaccettato (minerali silicatici); sotto è rugosa e non sfaccettata (metalli) [R]. A sottoraffreddamento alto l'instabilità di Mullins–Sekerka dà cristalli scheletrici, dendritici e sferuliti: sono le tessiture di tempra dei basalti [R].
- BCF:
  - la velocità normale di un gradino curvo è V = v∞·(1 − ρ_c·κ), con ρ_c il raggio critico del nucleo 2D;
  - una spirale con gradini di altezza h₀ che ruota a velocità angolare ω fa crescere la faccia a R = ω·h₀/2π;
  - la spaziatura dei gradini è proporzionale al raggio critico e cala con la sovrasaturazione [S] ([Karma e Plapp, cond-mat/9809358](https://arxiv.org/abs/cond-mat/9809358)).
  - La spaziatura classica λ ≈ 19·r_c, con r_c = γ·a/(kT·σ), e la legge parabolica R ∝ σ² a σ basso che diventa lineare ad alto σ sono ricordate [R]; la ricerca non le ha trovate.
- Calcite: il gradino atomico sulla faccia (10-14) è alto **0,304 nm**. I cristalli più grandi di ~1 µm preferiscono la crescita a spirale alla nucleazione 2D, a qualunque sovrasaturazione. A bassa sovrasaturazione le colline hanno geometrie «rovesciate» [S] ([Calcite kinetics for spiral growth and 2D nucleation, PMC9264354](https://pmc.ncbi.nlm.nih.gov/articles/PMC9264354); [Faraday Discuss. 2022](https://pubs.rsc.org/en/content/articlepdf/2022/fd/d1fd00084e); [OSTI 20000931](https://www.osti.gov/biblio/20000931)).
- Neve, Libbrecht [V] ([Toward a comprehensive model of snow crystal growth, arXiv:1211.5555](https://ar5iv.labs.arxiv.org/html/1211.5555)):
  - α(σ_surf, T) = A·exp(−σ₀/σ_surf) e v = α·v_kin·σ_surf;
  - A = 1 per il prisma a T ≤ −10 °C e per la base a ogni temperatura misurata; A_prism < 1 solo sopra −10 °C;
  - a −15 °C σ₀,basal < σ₀,prism; σ₀,prism crolla sopra circa −10 °C;
  - forme: piastre verso −2 °C, colonne verso −5 °C, colonne cave verso −7 °C, piastre verso −15 °C, colonne sotto −30 °C;
  - nelle condizioni atmosferiche ordinarie la crescita è fortemente limitata dalla diffusione nel gas.
  - I valori numerici di σ₀(T) stanno solo in una figura, non leggibile qui.
  - Il libro *Snow Crystals* (arXiv:1910.06389 v2, 9 dicembre 2021) è distribuito con la licenza non esclusiva di arXiv: si citano i fatti, non si copia il testo [V] ([arXiv abs](https://arxiv.org/abs/1910.06389)).
  - Un preprint del 2026 (EGUsphere-2026-3704) propone il modello SDAK; un revisore ne raccomanda il rifiuto [S] ([EGUsphere](https://egusphere.copernicus.org/preprints/2026/egusphere-2026-3704/)).
- Automa di Reiter (già nel codice); versione 3D mesoscopica di Gravner e Griffeath 2009 [R].

**(c) Come calcolarlo a poco prezzo, con l'errore noto**
- **BFDH dalla cella.** Per ~20–40 piani (hkl) a indici bassi, filtrati con le estinzioni del gruppo spaziale, si calcola d_hkl = 1/|g_hkl| con il reticolo reciproco (la funzione `riempi` in `atomi3d.js:1298` già lo calcola). Poi:
  - h_hkl ∝ 1/d_hkl;
  - il poliedro è l'intersezione dei semispazi h_hkl (una ventina di piani, una volta per minerale, tabella da pochi kB);
  - la distanza «a modo del cristallo» per la tassellatura è la funzione di supporto del poliedro, d(x) = max_i (n_i·x)/h_i. È un insieme di prodotti scalari, cioè a costo pari alla miscela attuale [C].
  - Errore noto: BFDH sbaglia spesso per crescita da soluzione e da fuso [S]. L'energia di attacco, con il campo di forze UFF che c'è già (`molecole_atomi.js:20-24`), è il passo successivo, fuori linea.
- Neve:
  - le velocità sono v_basal = α_b(T, σ)·v_kin·σ e v_prism = α_p(T, σ)·v_kin·σ;
  - il rapporto di forma del prisma è c/a ≈ v_basal/v_prism, che decide piastra o colonna;
  - la ramificazione viene dalla diffusione: automa di Reiter, o la regola di Libbrecht per cui i rami nascono quando la diffusione domina.
  - Così `nakaya()` diventa una conseguenza. Serve la tabella σ₀(T) delle due facce: una ventina di numeri, da digitalizzare dalla figura di Libbrecht.
- Grani di ghiaccio: l'età del grano a profondità z si calcola come z/accumulo (età del firn, densificazione di Herron–Langway [R]). Si usa al posto di «1 anno».

### Inferences
**(d) Il padre passa grandezze al figlio, e ritorno**
- Roccia → grano:
  - il padre passa sottoraffreddamento e velocità di raffreddamento;
  - α di Jackson e sottoraffreddamento decidono la forma: sfaccettata, scheletrica o dendritica;
  - la velocità di raffreddamento contro la diffusione nel cristallo decide la zonatura: la zonatura sopravvive se √(D_cristallo·τ) è minore della larghezza della zona [R];
  - lo sforzo del padre dà la densità di dislocazioni, ρ ≈ (σ/(α·μ·b))², secondo la relazione di Taylor [R];
  - le dislocazioni a vite che emergono danno le spirali BCF sulle facce del figlio.
- Fluido dei pori o del magma → difetti e inclusioni: un'interfaccia che avanza più veloce della diffusione intrappola il fluido (inclusioni fluide e vetrose) [R].
- Ritorno: la densità di dislocazioni e la taglia dei sottograni fanno tornare al padre la reologia (legge di flusso). È oltre lo scopo, ma la variabile è la stessa.
- **Ghiaccio**: la scheda del pianeta (T, umidità da meteo.js, accumulo) dà σ e T al fiocco, e l'età del firn al grano.

### Gaps
- I valori numerici di σ₀,basal(T) e σ₀,prism(T) non sono stati letti (stanno nella figura 2 di arXiv:1211.5555).
- La costante 19·r_c della spaziatura BCF non è stata confermata.
- Non è stato trovato un codice libero di BFDH o di energia di attacco in JS. Il modulo «CSD Particle» di CCDC esiste ma è commerciale [S] ([CCDC](https://www.ccdc.cam.ac.uk/media/Particle-shape-calculation-using-CSD-particle.pdf)).

---

## 3. Granelli dei sedimenti: arrotondamento, selezione, distribuzioni delle taglie, pori

### Takeaway
`rocce.sedimento()` fa emergere bene la selezione da competenza e sospensione, ma in unità di celle e con costanti tarate. La cura:
- il criterio di Shields con lo sforzo vero τ = ρgh·S;
- la velocità di caduta di Ferguson–Church e il numero di Rouse per la sospensione;
- la legge di Sternberg per l'affinamento a valle;
- una porosità che dipende dalla selezione (Beard e Weyl), invece di 0,38 fisso;
- per la geometria dei pori, mattonelle periodiche di sfere impacchettate fisicamente, generate fuori linea, come si fa già per l'acqua mW.

### Cited Findings

**(a) Che cosa è scritto a mano oggi** [codice]
- `rocce.js:286`: `COMPETENZA = 24, SOSPENSIONE = 2.6` in celle; l'incostanza `0.09 + 0.3·E` è un'ipotesi dichiarata (`rocce.js:279-280`).
- `rocce.js:300`: la maturità mineralogica è una regola sul dado: quarzo, feldspato o frammenti di roccia secondo E.
- `rocce.js:309`: lo schiacciamento `1 + 0.5·granello(3)` è sorteggiato. L'arrotondamento non dipende dal percorso.
- `mappa.js:779`: `energia = log10(1 + flusso)/4`, le soglie dei nomi (0,6; 0,3) e `larghezzaM = 0.02 + 0.3·e`.
- `grani.js:71`: `porosita: 0.38` fissa (dichiarata OSSERVATA, 0,35–0,45).
- `grani.js:100`: il raggio è troncato a 1,75 volte il medio.
- `grani.js:156`: l'ombra dell'orlo è 0,34.
- `mappa.js:791`: i colori della matrice e dei tre tipi di granello sono scritti a mano.

**(b) Le leggi e le formule compatte**
- Folk e Ward (1957), J. Sediment. Petrology 27:3–26, sono la fonte originale delle misure grafiche [S] ([Scribd, Folk e Ward 1957](https://www.scribd.com/document/536693682/Folk-and-Ward-1957)).
  - Formule standard [R]: media M_z = (φ16 + φ50 + φ84)/3; selezione σ_I = (φ84 − φ16)/4 + (φ95 − φ5)/6,6.
  - Un rapporto tecnico mostra una forma tipografica diversa da verificare [S] ([TR16](https://mrt.stgro-2780.saas.squiz.cloud/mrtdoc/dominfo/download/TR16_125_127/TR16_125_127.pdf)).
  - Classi di Folk (1974) [R]: molto ben selezionato sotto 0,35 φ, … , estremamente mal selezionato sopra 4 φ.
  - Le misure grafiche reagiscono in modo erratico a forti scostamenti dalla normalità [S] ([Swan e altri 1978](https://pt.slideshare.net/DrBaliReddy/swanetaljournalofsedimentarypetrology1978pdf)).
- Porosità contro selezione (Beard e Weyl, sabbie bagnate): la porosità media scende dal 42,4% delle sabbie estremamente ben selezionate al 27,9% di quelle molto mal selezionate, e la taglia conta poco dentro una stessa classe [S] ([AAPG Bulletin 1973](https://archives.datapages.com/data/bulletns/1971-73/data/pg/0057/0002/0300/0349.htm)).
- Impacchettamento casuale di sfere [S] ([Physics World](https://physicsworld.com/a/the-secrets-of-random-packing/)): «random close packing» circa 64% (porosità circa 0,36); «loose» circa 55%. Un'altra misura dà una porosità casuale di 0,391 (Denton) [S] ([Cambridge, capitolo sui mezzi granulari](https://www.cambridge.org/core/product/identifier/CBO9780511626753A061/type/BOOK_PART)).
- Kozeny–Carman è il modello di permeabilità più comune (Kozeny 1927, Carman 1937) [S] ([Transport in Porous Media 2020](https://link.springer.com/content/pdf/10.1007/s11242-020-01378-0.pdf)). La forma k = d²·φ³/(180·(1 − φ)²) è ricordata [R].
- Shields θ_c ≈ 0,045 e Sternberg D(x) = D₀·exp(−a·x) [V-prec] (`reports/Come farlo emergere.md` §7, [Lajeunesse e altri](https://www.ipgp.fr/~lajeunes/download/2010-wrr-downstreamfining.pdf)).
- Velocità di caduta di Ferguson–Church (2004): w = R·g·D²/(C₁·ν + √(0,75·C₂·R·g·D³)), con C₁ ≈ 18 e C₂ ≈ 1 per granelli naturali [R]. Si resta in sospensione se il numero di Rouse P = w/(κ·u*) è sotto circa 1 [R].
- Arrotondamento: l'abrasione dipendente dalla curvatura (Bloore, Firey; Domokos e collaboratori) spiega che i ciottoli diventano prima tondi e poi ellittici [R]. La rotondità visuale di Krumbein (0,1–0,9) è una scala di confronto, non una legge [R].

**(c) Come calcolarlo a poco prezzo, con l'errore noto**
- **Selezione emergente e unità vere.** Dalla tessera si prendono la portata e la pendenza, da cui h, S, τ = ρghS e u* = √(τ/ρ).
  - D_max viene da Shields: D = τ/(θ_c·(ρ_s − ρ)·g).
  - D_min viene da P = 1 con Ferguson–Church, una radice risolta con 5 iterazioni di Newton [C].
  - L'oscillazione di E nel tempo viene dall'idrogramma di meteo.js invece che da un processo OU con incostanza ipotetica.
  - Errore: θ_c varia tra 0,03 e 0,06 [R].
- **Arrotondamento e composizione dal percorso.** La distanza di trasporto x dalla sorgente è nota alla rete di drenaggio.
  - Il diametro segue Sternberg; la rotondità cresce con x/D (abrasione).
  - La frazione per minerale segue la sopravvivenza: velocità di dissoluzione per minerale (`chimica.MINERALI_ROCCIA` ha già le velocità) × tempo di residenza. Così il quarzo resta da solo nei depositi maturi senza regola sul dado.
- **Porosità.** Si interpola Beard e Weyl in σ_I: φ(σ) ≈ 0,424 → 0,279. Il campo «booleano» di `grani.js:81-82` usa già n·π·⟨r²⟩ = −ln(porosità): basta passarle φ(σ).
- **Pori veri.** Fuori linea si generano per 4–6 classi di selezione delle mattonelle periodiche 3D di sfere log-normali, impacchettate con un metodo di contatto (Lubachevsky–Stillinger o caduta più rilassamento) [R]. Pesano qualche migliaio di sfere ciascuna, ~50 kB. Poi:
  - si tagliano in sezione, così i pori, i contatti e le «punte» dei granelli tagliati fuori dal loro centro emergono;
  - in linea si legge la mattonella spostata per indirizzo, senza giunture perché periodica, come `TEMPLATE_MW` (`acqua_mw.js:6`);
  - la permeabilità con Kozeny–Carman sulla stessa φ e la stessa d chiude il filo verso la falda di suolo.js.

### Inferences
**(d) Il padre passa grandezze al figlio, e ritorno**
- Bacino o tessera → letto: il padre passa D50, σ_I, la composizione e la rotondità; poi l'età di seppellimento e la temperatura (compattazione e cementazione: la porosità cala con la profondità, legge di Athy φ = φ₀·exp(−z/z₀) [R]).
- Letto → finestra di grani: il figlio passa al padre la massa per classe di taglia, che deve coincidere con il bilancio di sedimento della tessera.
- Pori → acqua dei pori (suolo.js): si passano porosità e permeabilità.
- Il cemento, nei colori di `grani.js:71`, diventa la frazione precipitata dal fluido dei pori (sovrasaturazione di calcite o silice da mare.js e reazioni.js).

### Gaps
- Le formule di Folk e Ward non sono state lette sul testo originale. I denominatori 4 e 6,6 sono ricordati, e un rapporto ne mostra una versione diversa.
- I coefficienti di Ferguson–Church (C₁, C₂) e il criterio di Rouse non sono stati verificati.
- Non è stato trovato un generatore di impacchettamenti periodici a licenza permissiva in JS. Packmol (MIT [V-prec]) è un candidato fuori linea.

---

## 4. Dal continuo agli atomi senza cuciture: coarse-graining, quasicontinuo, resa continua, dinamica molecolare nel browser, modello mW

### Takeaway
Due cause strutturali spiegano le cuciture e i difetti dello zoom, entrambe leggibili nel codice:
1. La vista dipende dal **percorso** (ancore, riposizionamenti, morsetti) e non solo da (indirizzo, scala).
2. I campioni atomici sono quadrati **non commensurati** al reticolo, poi ripetuti; per di più sono rifatti con un caso diverso a ogni lato.

Il rimedio di legge viene dalla cristallografia. La densità di un cristallo è una somma di Fourier sui vettori reciproci, ρ(x) = Σ_g F_g·e^(i·g·x). Filtrarla con una gaussiana larga quanto il pixel dà, con **una sola formula**:
- il colore medio quando i grani sono più piccoli del pixel;
- le frange reticolari a 10–30 nm;
- gli atomi a 1–3 nm.

È il modo in cui lavora un TEM, ed è il quasicontinuo di Cauchy–Born visto dalla resa. Per l'acqua basta la mattonella mW periodica già generata, ma ha bisogno di una dinamica sua se si vuole movimento.

### Cited Findings

**(a) Che cosa non è continuo oggi** [codice]
- `materia.js:1123-1137` (`atomi`): il campione è un quadrato di lato L (3 nm o 30 nm) centrato sull'origine del reticolo.
  - Il caso è `sotto('atomi/${minerale}/${latoM}/${T}')`: lo spostamento termico di ogni atomo cambia con il lato. L'atomo «(i, j, k, q)» a 30 nm non è nella stessa posizione a 3 nm.
  - Il lato non è multiplo dei periodi proiettati: per il quarzo, 3 nm / a = 3 / 0,4913 ≈ 6,1 [C]. La ripetizione con `periodico()` (`mappa.js:920-926`) dà quindi un **salto di fase del reticolo a ogni bordo di copia**. È la cucitura degli atomi.
  - Il commento in `materia.js:1147-1148` cura solo gli atomi a cavallo dei bordi, non la fase.
- `mappa.js:111` e `mappa.js:85`: le ancore (`cam.ancore[p]`, `cam.ancoraSuolo`) si fissano «finché il livello sotto è un puntino» e poi restano dove sono. `mappa.js:116` e `mappa.js:115` le rileggono al ritorno.
- `mappa.js:92` e `mappa.js:117` rimettono `cx = cy = 0.5` (perdendo la posizione). `tieniIlPunto` (`mappa.js:138`) tronca la posizione a ±0,35·m/z ad ogni passo nel suolo (`mappa.js:90`), e il troncamento non si inverte.
- **Ipotesi per lo sfasamento di un quarto di schermo a 1 mm** (da lettura, non provata): la combinazione di (i) il troncamento non reversibile di `tieniIlPunto` e (ii) i `cx = 0.5` di `mappa.js:92/117`. Il ritorno passa per stati di camera diversi dall'andata. Lo spostamento massimo del troncamento (0,35 del lato corto) è dell'ordine osservato.
- **Ipotesi per la macchia bianca a 100 µm al ritorno** (da lettura, non provata). Tre candidati:
  - `mosaico()` (`mappa.js:957-964`) somma copie in modalità `'lighter'`: se pesi e posizioni non coincidono al pixel, perché lo spostamento P = s·(N − R)/N non è intero in pixel di schermo, si sommano pesi maggiori di 1 e si sbianca;
  - oltre 900 copie la tela resta vuota (`mappa.js:962`);
  - in `grani.js:188`, sotto 0,7 pixel per grano, l'intero schermo si riempie di `mediaColore`, che per neve e sale è quasi bianca.
  - La prova che li separa: disegnare lo stesso (indirizzo, z) all'andata e al ritorno e confrontare le immagini.
- `rocce.js` (fiocco, sale, sedimento): sono immagini 192² su toro e non campi continui come `campoGrani`. Ingrandendo restano quadrati di pixel.
- `atomi3d.js:1057-1059`: l'acqua 3D «NON è una dinamica: le molecole non diffondono né si scambiano legami». La mattonella mW (`acqua_mw.js:1-7`, 1000 molecole, 3,107 nm, Monte Carlo di Metropolis, energia −10,079 kcal/mol) è usata solo da `finestra.js:621`.

**(b) Le leggi e le formule compatte**
- Quasicontinuo (Tadmor, Ortiz e Phillips 1996): si seguono esplicitamente solo pochi «atomi rappresentativi» e gli altri si interpolano come in un elemento finito [S] ([Miller e Tadmor, panoramica](https://arxiv.org/pdf/cond-mat/0401073); [analisi, cond-mat/0103455](https://arxiv.org/pdf/cond-mat/0103455)). Il resto del metodo:
  - l'energia nelle zone «locali» viene dalla regola di Cauchy–Born, cioè la densità di energia di un atomo i cui vicini si deformano uniformemente;
  - vicino ai difetti si calcola atomo per atomo;
  - i reticoli complessi hanno una Cauchy–Born con gli spostamenti tra sottoreticoli [S] ([Abdulle, Lin, Shapeev](https://infoscience.epfl.ch/record/182347/files/hqc_abdulle_lin_shapeev.pdf?version=1)).
- mW (Molinero e Moore 2009, J. Phys. Chem. B 113:4008) [V] ([arXiv:0809.2811](https://arxiv.org/pdf/0809.2811), PDF letto):
  - forma di Stillinger–Weber: φ₂ = A·ε·[B·(σ/r)^p − (σ/r)^q]·exp(σ/(r − aσ)) e φ₃ = λ·ε·(cos θ − cos θ₀)²·exp(γσ/(r − aσ))·exp(γσ/(s − aσ));
  - A = 7,049556277, B = 0,6022245584, p = 4, q = 0, γ = 1,2, a = 1,8, θ₀ = 109,47°;
  - λ = 23,15, ε = 6,189 kcal/mol, σ = 2,3925 Å; forze nulle oltre 4,32 Å;
  - **180 volte più veloce di SPC/E** (1 particella invece di 3, passo di 10 fs invece di 1,5 fs, niente Ewald);
  - T_m del ghiaccio Ih 274,6 ± 1 K (il cubico 271,5 K);
  - densità entro l'1% tra 250 e 350 K; massimo di densità a 250 K (l'acqua vera a 277 K);
  - D(298 K) = 6,5·10⁻⁵ cm²/s, **circa 3 volte** il valore vero: una dinamica mW scorre circa 3 volte troppo veloce;
  - il ghiaccio nuclea molto più facilmente che nell'acqua vera.
  - Il potenziale c'è anche nella banca NIST per LAMMPS [S] ([NIST IPR](https://www.ctcms.nist.gov/potentials/entry/2009--Molinero-V-Moore-E-B--water/2009--Molinero-V--water--ipr-1.html)).
- Resa multiscala:
  - cellVIEW (Le Muzic, Autin, Parulek e Viola 2015) rende a livello atomico virus e batteri a 60 Hz; è scritto in Unity3D [S] ([cellVIEW](https://www.cg.tuwien.ac.at/cellview); [EG VCBM 2015](https://diglib.eg.org/bitstream/handle/10.2312/vcbm20151209/061-070.pdf));
  - le «Illustrative Transitions … via Forward and Inverse Abstraction Transform» (Sorger e altri, VCBM 2016) sono passaggi continui tra livelli di astrazione [S] (elenco TU Wien);
  - c'è una rassegna di Miao e altri, J. Mol. Biol., sull'astrazione visiva [S] ([Multiscale Molecular Visualization](https://www.academia.edu/68075605/Multiscale_Molecular_Visualization)).
- Illustrate (Goodsell): licenza **Apache-2.0**, codice Fortran aperto più un'interfaccia web [S] ([GitHub ccsb-scripps/Illustrate](https://www.github.com/ccsb-scripps/Illustrate); [Structure 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6834899)). Lo stile, cioè contorni da salti di profondità più occlusione, è già nel codice: `atomi3d.js:427`, ombra che non scavalca i salti.
- Mol\* (MIT) e Mesoscale Explorer: impostori, istanziazione, livello di dettaglio dalla taglia in pixel («about three times faster»), scarto su GPU [V-prec] ([Rose e altri 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11409463/)).
- Dinamica molecolare nel browser:
  - non è stato trovato un motore di dinamica molecolare per WebGPU aperto e maturo [S];
  - c'è un'esercitazione WebGPU con Verlet a 4096 particelle a 60 fps [S] ([blog 2026](https://yyang624.github.io/posts/2026-04-19-webgpu/));
  - c'è una dinamica Lennard-Jones nel browser, senza WebGPU dichiarato [S] ([Shivers 2026](https://jordanshivers.github.io/blog/2026/molecular-dynamics-in-the-browser));
  - LAMMPS in WebAssembly (Atomify, GPL-3; lammps.js) [S] ([lammps.js](https://alex-zhilkin.github.io/lammps-js/)); LAMMPS GPL-2 [V-prec].

**(c) Come calcolarlo a poco prezzo, con l'errore noto**
- **Un solo campo per il cristallo, a ogni scala.** Fuori linea, dalla cella CIF (COD, pubblico dominio [V-prec]):
  - si calcolano ~50–200 vettori reciproci g con il loro fattore di struttura F_g = Σ_j f_j·exp(−B_j·s²/4)·e^(−i·g·r_j) (fattori atomici e di Debye–Waller) [R per la formula, C per il conteggio];
  - in linea, nel fragment shader, si somma ρ_vista(x) = Σ_g F_g·exp(−|g|²·σ_pix²/2)·cos(g·R(θ_grano)·x + fase_g), dove σ_pix è la larghezza del pixel e R(θ) l'orientazione del grano di grani.js.
  - A 1 mm resta solo F₀, il colore medio, identico a `mediaColore`. A 30 nm sopravvivono i g bassi, cioè frange e piani. A 3 nm tutti, cioè gli atomi.
  - Costo: ~100 coseni per pixel, banale in GPU [C]. L'errore è solo di troncamento: dove exp(−g²σ²/2) < 10⁻³ il termine si scarta.
  - I bordi di grano appaiono dove la fase delle frange salta, esattamente come in HRTEM.
  - Gli atomi in 3D, che servono a 1–3 nm, si mettono per indirizzo di cella (i, j, k, q) nel sistema del grano, con lo spostamento termico come evento di quell'indirizzo, **indipendente dal lato**.
- **Campioni commensurati.** Se si vuole tenere l'immagine ripetuta, il lato deve essere un multiplo intero dei periodi della cella proiettata, con una supercella rettangolare a × a√3 per i reticoli esagonali. Altrimenti non si ripete. Per il quarzo visto lungo c, i periodi rettangolari sono a = 0,4913 nm e a√3 = 0,8510 nm. Il rettangolo commensurato quasi quadrato più vicino a 3 nm è 7a × 4a√3 = 3,439 × 3,404 nm (1% di differenza tra i lati) [C]. Il campione deve allora essere rettangolare, non quadrato.
- **Ancora dal punto, non dal percorso.** La vista va calcolata come funzione pura di (indirizzo del punto in coordinate gerarchiche, lato dello schermo). Ogni livello ha la sua origine in un punto fisso della gerarchia (il germe del grano, l'origine della cella del reticolo), mai in un punto fissato dallo stato della camera. Lo stesso indirizzo dà lo stesso quadro all'andata e al ritorno.
- **Acqua.** Con la mattonella mW (periodica, quindi senza cuciture) si può fare una dinamica vera in un worker:
  - 1000 particelle, raggio 4,32 Å, ~5 vicini, termine a tre corpi ~25 coppie per particella: ~10⁵ valutazioni per passo [C];
  - in JS sono pochi ms per passo, quindi tempo reale a 10 fs per passo, rallentato a piacere;
  - errore noto: la diffusione è circa 3 volte quella vera; si dichiara, o si scala il tempo mostrato per 1/3;
  - gli idrogeni si mettono come oggi (`atomi3d.js:1052-1053`).
  - Ghiaccio e acqua con lo stesso potenziale: un'interfaccia ghiaccio–acqua emerge, con la T_m di mW (274,6 K).

### Inferences
**(d) Il padre passa grandezze al figlio, e ritorno**
- Il grano passa all'atomo: minerale, orientazione θ, T (agitazione), deformazione locale ε (Cauchy–Born: la cella deformata F·a), presenza di dislocazioni (vicino a una dislocazione si passa ad atomi espliciti, come nel quasicontinuo).
- L'atomo restituisce al grano: densità (F₀/V), composizione (conteggio per elemento: `atomi3d.js:1378` lo fa già) e energia per volume (per la maturazione e la fusione).
- Il bilancio si chiude se il colore medio della somma di Fourier a σ_pix grande è esattamente quello usato dal padre: stessa F₀.

**(e) Che cosa si vede a 10–1 nm**: in HRTEM, frange e colonne atomiche; in AFM, il reticolo superficiale di sfaldature di mica e calcite [R]. Vedi la sezione 6.

### Gaps
- Le ipotesi sui tre difetti (macchia bianca, sfasamento, cuciture) vengono dalla lettura. Solo la non commensurazione di `materia.js:1123-1136` e il caso legato al lato sono certi. Le altre due vanno confermate con prove di andata e ritorno.
- La licenza di cellVIEW e quella di cellPACK non sono state verificate.
- Non è stata trovata una dinamica mW in JavaScript o WebGPU.

---

## 5. Velocità: che cosa diventa tabella o surrogato per tipo di roccia, e che cosa esce dal filo principale

### Takeaway
Il costo più grande, `cristallizza` (1,6–3 s), è quasi tutto **evitabile**: il campo dei grani usa solo cinque numeri della simulazione, e la formula chiusa li dà in meno di 1 ms. Il resto va:
- in tabelle per minerale e per tipo di roccia: forma BFDH, fattori di struttura, birifrangenza, colori di Michel-Lévy, mattonelle di impacchettamento;
- in un fragment shader: la tassellatura dei grani pixel per pixel e la somma di Fourier del reticolo;
- nel worker che c'è già (`finestre.worker.js`): fiocco, sedimento, fratture, con il padre come segnaposto, come per il suolo.

### Cited Findings
- `mappa.js:778-786` [codice]: `cristallizza()` e `immagineRoccia(r)` si calcolano **sempre**, anche quando `alPosto` è vero (`mappa.js:808`) e l'immagine non si disegna (`mappa.js:911`: `seq[j] === 0 && alPosto` salta l'immagine). Di `r` si usano solo `granoMedio`, `cristallino`, `vetro`, `nGrani`, `minerali` (`mappa.js:792`).
- `grani.js:163-175` [codice]: la resa è un doppio ciclo JS su fino a 260 000 pixel, con 1–4 campioni e una ricerca di celle per pixel. Si rifà quando la scala cambia del 20% o la vista esce.
- `finestre.worker.js:7` [codice]: c'è già il disegno «intanto il padre, poi si sfuma al figlio».
- Mol\*: il livello di dettaglio dalla taglia in pixel è circa tre volte più veloce, e lo scarto delle istanze va su GPU via WebGPU da 20 000 istanze [V-prec] ([CHANGELOG Mol\*](https://github.com/molstar/molstar/blob/master/CHANGELOG.md)).
- mW: 180× SPC/E [V] (sezione 4).

### Inferences
Tabelle consigliate, tutte generate da `strumenti/` e deterministiche [C]:

| tabella | chiave | contenuto | taglia | errore noto |
|---|---|---|---|---|
| Avrami | log₁₀(raffreddamento) o (τ, composizione) | u, I/G, X, N_A, N_V | 64 righe | quello di JMAK (crescita costante) |
| fasi | composizione × (P, T) | minerali modali | ~100 kB (già proposta in «Come farlo emergere» §7) | quello di MAGEMin |
| forma | minerale | piani (hkl), h_hkl BFDH | < 1 kB per minerale | BFDH ≠ forma vera da soluzione |
| struttura | minerale | g, F_g (50–200) | ~5 kB per minerale | troncamento a exp(−g²σ²/2) < 10⁻³ |
| Michel-Lévy | Γ = d·Δn (0–3000 nm) | RGB in luce incrociata | 1D, 256 texel | spettro della lampada assunto |
| birifrangenza | minerale | Δn (quarzo ~0,009, olivina ~0,035–0,05, calcite ~0,17) [R] | — | dati misurati |
| impacchettamenti | σ_I (4–6 classi) | sfere 3D periodiche | ~50 kB ciascuna | metodo di impacchettamento |
| neve | T | σ₀,basal, σ₀,prism, A | ~20 numeri | digitalizzazione |
| acqua | — | mW 1000 molecole (c'è già) | ~5 kB | diffusione ×3 |

- La luce polarizzata di `grani.js:143` (`0.84 + 0.26·sin²(2φ)`) diventa una lettura di legge: I(λ) = sin²(2θ)·sin²(π·d·Δn(θ_c)/λ), con d = 30 µm, lo spessore della sezione sottile [R], integrata su R, G e B. Così il quarzo esce grigio–bianco e l'olivina a colori vivi del secondo ordine, senza scelte.
- Determinismo CPU/GPU: lo shader della tassellatura deve generare i germi di una cella con lo stesso hash intero della CPU, cioè un generatore a contatore come proposto nel rapporto precedente [V-prec]. Altrimenti `granoIn()` (CPU) e l'immagine (GPU) divergono.
- Fuori dal filo principale: `fioccoDiNeve` (fino a 20 000 passi), `sedimento`, `fratture`, gli atomi a 30 nm (20 000 atomi ordinati), la dinamica mW.

### Gaps
- Il costo di `fioccoDiNeve`, `sedimento` e `fratture` non è stato misurato qui; serve un profilo.
- Non è stato verificato se un fragment shader WebGL2 con ~40 celle e ~5 germi per pixel tiene 60 fps su una scheda debole. La stima è ragionevole, ma va misurata.

---

## 6. Che cosa mostrare a ogni larghezza di schermo, da 10 cm a 1 nm, e che cosa mostrano le micrografie vere

### Takeaway
Ogni fascia deve mostrare ciò che uno strumento reale vedrebbe a quel campo, e deve uscire dalla stessa catena di leggi. Ciò che lo strumento non risolve si mostra come media, non come vuoto. I punti di passaggio naturali sono tre:
- il limite ottico, ~0,2–0,5 µm;
- l'apparire delle frange reticolari, ~10–30 nm;
- gli atomi singoli, ~1–3 nm.

La maggior parte della tabella è [R] (conoscenza petrografica di base), con i pochi numeri verificati marcati.

### Cited Findings
- Calcite: il gradino monomolecolare è alto 0,304 nm e i cristalli più grandi di ~1 µm crescono a spirale [S] ([PMC9264354](https://pmc.ncbi.nlm.nih.gov/articles/PMC9264354)).
- Ostwald: i megacristalli di ortoclasio sono un esempio geologico [V] ([Wikipedia](https://en.wikipedia.org/wiki/Ostwald_ripening)).
- Tracce di fissione e aloni: 13,5–33,6 µm in fluorite [V-prec] (`reports/Simulatori…`).

Tabella, con marca [R] dove non indicato:

| schermo | strumento reale | che cosa si vede | che cosa lo fa emergere in stateyour |
|---|---|---|---|
| 10 cm | campione a mano, lastra lucidata | fenocristalli, foliazione, laminazione, vescicole, vene | storia T(t) a due tratti (CSD a gomito), deformazione del padre (orientazione preferita di forma), sedimento a lamine (`rocce.js:278`) |
| 1 cm | sezione sottile (30 µm), luce polarizzata, piccolo ingrandimento | mosaico di grani, colori d'interferenza (Michel-Lévy), geminazioni (polisintetica albite nel plagioclasio, Carlsbad nel K-feldspato, a graticcio nel microclino), giunti tripli a ~120° nelle rocce ricotte, estinzione ondulata nel quarzo deformato | tassellatura JM con orientazione, forme BFDH, birifrangenza vera; le geminazioni sono un evento del germe con la legge di geminazione del minerale (piano e asse da tabella) |
| 1 mm | sezione sottile a ingrandimento medio, SEM a elettroni retrodiffusi | zonatura oscillatoria o normale del plagioclasio, tracce di sfaldatura (pirosseno ~87°, anfibolo ~56/124°, mica una sola), pertiti, mirmechiti, inclusioni fluide e vetrose (1–50 µm), cemento e accrescimenti nelle arenarie | zonatura da √(D·τ) contro la velocità di crescita; sfaldatura dai piani a energia superficiale minima (stessa tabella dei piani); inclusioni da intrappolamento |
| 100 µm | SEM a elettroni secondari, ottico ad alto ingrandimento | superfici dei granelli, pori, argille a libretto (caolinite 1–10 µm), aloni pleocroici (5–40 µm), tracce di fissione attaccate (~16 µm nell'apatite) | impacchettamenti periodici, aloni e tracce (`materia.js` già) |
| 10 µm | SEM, EBSD, catodoluminescenza | mappe di orientazione, sottograni, zone di crescita in CL, lamelle di essoluzione | orientazione per grano (c'è), sottograni dalla densità di dislocazioni |
| 1 µm | limite ottico (Abbe d = λ/(2·NA) ≈ 0,2–0,3 µm); SEM; AFM | colline di crescita, fosse d'attacco, superfici di sfaldatura | sotto questo, niente colore d'interferenza: la vista diventa «elettronica» (contrasto di densità o di numero atomico); si dichiara il cambio di strumento |
| 100 nm | TEM in campo chiaro, AFM | dislocazioni, difetti di impilamento, bordi di sottograno; in AFM, treni di gradini spaziati 10–100 nm | spirali BCF con spaziatura ∝ r_c(σ) dalla sovrasaturazione del padre |
| 10 nm | AFM, HRTEM | gradini monomolecolari (calcite 0,304 nm [S]); comparsa delle frange reticolari | somma di Fourier filtrata al pixel (sezione 4) |
| 1 nm | HRTEM, STEM-HAADF, AFM a risoluzione atomica | colonne atomiche, struttura atomica dei bordi di grano, reticolo superficiale; per l'acqua, nessuna struttura stabile (rete H mobile) | atomi per indirizzo di cella; per l'acqua, la mattonella mW con dinamica |

Ghiaccio e acqua in particolare [R]:
- **Ghiaccio da 10 cm a 1 mm**: grani di firn e di ghiaccio di mm–cm. In sezione spessa (~0,5 mm), tra polarizzatori incrociati, i grani si colorano malgrado la birifrangenza piccola (~0,0014): serve uno spessore maggiore di quello delle sezioni di roccia.
- **Fiocco da 5 mm a 100 µm**: rami, creste, settori.
- **Ghiaccio a µm**: fosse di sublimazione.
- **Ghiaccio a nm**: il piano basale e, vicino a 0 °C, lo strato pre-fuso. mW lo darebbe da solo all'interfaccia con il vuoto.

### Inferences
- Il cambio di strumento (ottico → elettronico → sonda) è una scelta di vista e va dichiarato, ma la soglia ha una legge, il limite di Abbe. Va tenuto separato dalla fisica del campione.
- Le geminazioni, le sfaldature e le zonature sono oggi del tutto assenti. Sono il guadagno visivo più grande a 1 cm–1 mm, e tutte e tre vengono da tabelle per minerale (leggi di geminazione, piani di sfaldatura) più la storia del padre.

### Gaps
- Nessuna fonte di micrografia è stata letta in questa ricerca: la tabella per scala è conoscenza petrografica [R]. Andrebbe confrontata con un atlante di sezioni sottili aperto (per esempio quelli universitari con licenza CC), non cercato qui.
- Non sono stati verificati i valori di birifrangenza, gli angoli di sfaldatura, i 30 µm delle sezioni sottili e la birifrangenza del ghiaccio, benché siano dati di manuale.
