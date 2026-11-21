# Clima, oceano e chimica del mare: più emergenti, collegati, continui nello zoom, rapidi e precisi

Panel: modellista del clima, oceanografo fisico, geochimico marino, fisico delle nubi e dell'ottica atmosferica.

Segni usati per ogni affermazione:
- **[V]**: verificato sulla fonte letta (testo pieno o sorgente);
- **[S]**: verificato solo su un estratto, un abstract o un riassunto di ricerca;
- **[R]**: ricordato e non riletto (da verificare prima di usarlo come dato);
- **[C]**: calcolato qui dai numeri citati;
- **[P]**: proposta del panel;
- **[Codice]**: letto nel sorgente di stateyour (file:riga), che resta in sola lettura.

Le sigle MR*, MT*, LG* sono quelle di `reports/Inventario di cio che non emerge.md`. Dove i rapporti già coprono una formula (Held–Hou, Munk, Monin–Obukhov, HEXTOR, intensità potenziale) qui la si richiama soltanto e si aggiunge ciò che manca.

---

## 1. Il bilancio a lungo termine di Na, Cl, K, Mg: perché il mare esce a ~296 g/kg e che cosa fissa davvero ~35 g/kg

### Takeaway
I ~296 g/kg non sono un pozzo che manca. Sono il **tetto di saturazione del salgemma**: il modello versa nel mare il 95% di un cloro del mantello già 3–5 volte quello terrestre, e il sale in eccesso precipita sul fondo (`mare.js:359`). Per questo ogni correzione che toglie meno di circa i quattro quinti del cloro non cambia nulla di visibile. Sulla Terra la salinità non la fissa un singolo pozzo ma l'**inventario del cloro di superficie**. Quell'inventario è una parte piccola del cloro del pianeta (BSE 17–30 µg/g). Il mare ne tiene solo il 20–40%; il resto sta nelle evaporiti, nelle salamoie della crosta e nel mantello, dove la subduzione lo riporta. Il sodio poi segue il cloro attraverso il bilancio delle cariche, al netto dei suoi pozzi in silicati (albitizzazione, argille nuove).

### Cited Findings
- **[Codice]** `mare.js:321–322`. Alla nascita il mare riceve `(1 − INTRAPPOLATO)·Cl_mantello·M_mantello`, con `INTRAPPOLATO = 0,05` (`elementi.js:509`, Elkins‑Tanton 2008 [R]). Tutto il cloro non intrappolato va quindi in superficie in un colpo solo.
- **[Codice]** `elementi.js:68–78`. Dopo le perdite per accrescimento il mantello della "Terra" del modello ha **90 ppm di Cl**, e il sodio è **5,7 volte** quello terrestre. Il commento stesso dice: "il mare di quel pianeta resta una salamoia, ora di soda (il sodio dei fiumi non ha in mare.js un'uscita che lo pareggi)".
- **[Codice]** `mare.js:315`. Il seppellimento con l'acqua dei pori esiste già: `kSepolto = (sedimento/ρ_roccia)·(φ/(1−φ))·1000/M`, con φ = 0,2 (`mare.js:118`). Esistono anche le evaporiti dei bacini veri (`mare.js:512`) e il ritorno con il riciclo `kTorna = 1/riciclo`, dove `riciclo = √(area del mare)/v_placche` (`mare.js:500`). Il seppellimento dunque c'è, ma è **reversibile**: quello che entra nei sedimenti torna in circa 10⁸ anni.
- **[Codice]** `mare.js:76–78`. "Ciò che la crosta che affonda riporta nel mantello non è contato". Il pozzo permanente del cloro, la subduzione, **manca**.
- **[Codice]** `mare.js:359`. Se Ω(salgemma) > 1, il di più va in `fondoDiSale`: il mare è tenuto alla saturazione.
- **[Codice]** `mare.js:37`. "La Terra di prova esce a 71 g/kg, il doppio del vero". Questa è la prova a composizione terrestre imposta; la catena completa da `disco.js` dà ~296.
- **[V]** La BSE contiene 17–30 µg/g di Cl e 25 µg/g di F; i condriti CI ne hanno 680 µg/g di Cl e 60 µg/g di F. Il rapporto F/Cl della BSE normalizzato ai condriti vale 9–17: è il "missing Cl problem". Yuan e Steinle‑Neumann 2024 sostengono, con DFT‑MD, che il nucleo potrebbe trattenere una parte del cloro; servirebbe più del 90% per riportare F/Cl al valore condritico — [Yuan & Steinle‑Neumann 2024, JGR Solid Earth (PDF)](https://epub.uni-bayreuth.de/7940/1/JGR%20Solid%20Earth%20-%202024%20-%20Yuan%20-%20Earth%20s%20Missing%20Chlorine%20May%20Be%20in%20the%20Core.pdf).
- **[S]** Sharp & Draper 2013 (EPSL 369–370, 71–77) misurano che il Cl resta litofilo fino a ~23 GPa. Ne concludono che la Terra ha perso circa nove decimi del cloro atteso dai condriti con gli urti giganti, che spogliano i serbatoi di superficie ricchi di Cl. Il loro corollario: trattenendolo, "gli oceani sarebbero salati come il Mar Morto" — [Physics Today](https://physicstoday.aip.org/news/earths-lack-of-chlorine-traced-to-early-planetary-bombardment), [phys.org](https://phys.org/news/2013-05-massive-impacts-dispersed-chlorine-earth.pdf).
- **[S]** Knauth 2005 (Palaeo3 219, 53–69) stima la salinità iniziale a **1,5–2 volte l'attuale**, rimasta alta per tutto l'Archeano perché mancavano cratoni duraturi che sequestrassero salgemma e salamoie. Il primo grande calo sarebbe nel Neoproterozoico, quando enormi masse di sale e salamoia finirono nei bacini evaporitici giganti — [record ASU](https://asu.elsevierpure.com/en/publications/temperature-and-salinity-history-of-the-precambrian-ocean-implica/).
- **[S]** Hay et al. 2006 (Palaeo3 240, 3–46) usano il cloruro come tracciante conservativo (sta solo in mare, nei sedimenti e nelle evaporiti). Trovano un calo generale della salinità nel Fanerozoico, concentrato in pochi episodi di estrazione: il Permiano e il Miocene (Messiniano). Le loro stime vanno da un volume di evaporiti minimo a uno massimo, con oceano costante o calante — [ADS](https://ui.adsabs.harvard.edu/abs/2006PPP...240....3H/abstract), [GEOMAR](https://oceanrep.geomar.de/id/eprint/3486/).
- **[S]** Il flusso di Cl in subduzione vale ~2,5·10¹² g/anno dalla crosta (Ito et al. 1983; Jarrard 2003). Sale a ~12·10¹² g/anno contando il Cl strutturale e solubile delle serpentiniti (Sharp & Barnes 2004). Un lavoro GCA su crosta alterata di cinque siti ODP trova un flusso dalla crosta circa tre volte le stime precedenti, sufficiente a dare al mantello il suo Cl e Br in 3 Gyr. Circa il 90% del Cl della litosfera oceanica alterata vi entra durante l'alterazione con acqua di mare, arricchito nei gabbri dello strato 3 alterati ad alta temperatura (anfibolo) — [risultati di ricerca su Kendrick et al., ANU](https://openresearch-repository.anu.edu.au/items/9f1288d2-2a2a-4ff3-af92-cc58ba9361d8), [Southampton eprint GCA 2016](https://eprints.soton.ac.uk/396461/1/1-s2.0-S0016703716301156-main.pdf). Il PDF ha risposto 403; numeri dagli estratti.
- **[S]** Isson & Planavsky 2018 (Nature 560, 471–475). La **reverse weathering** (argille autigene marine) toglie alcalinità e rende acidità; con molta silice in mare era più intensa, tratteneva carbonio nel sistema oceano‑aria e stabilizzava pH e clima. L'arrivo degli organismi silicei avrebbe tolto silice e indebolito il tampone — [RePEc](https://ideas.repec.org/a/nat/nature/v560y2018i7719d10.1038_s41586-018-0408-4.html), [NASA Astrobiology](https://astrobiology.nasa.gov/nai/articles/2018/8/17/rethinking-planetary-climate-controls/index.html).
- **[R]** Mackenzie & Garrels 1966 (Am. J. Sci. 264, 507): il bilancio fiumi‑mare non chiude per Na, K, Mg e HCO₃⁻ senza la ricostituzione di silicati nei sedimenti. Questa è l'origine del termine "reverse weathering".
- **[R]** Holland (1978, 1984, *The Chemical Evolution of the Atmosphere and Oceans*): i pozzi di Mg sono soprattutto idrotermali ad alta T (Mg tolto al 100%) e argille o dolomia. I pozzi di Na sono le acque dei pori, lo scambio sulle argille, l'albitizzazione e le evaporiti. Il K esce con l'alterazione di basalti a bassa T e con la formazione di illite. Ordini di grandezza [R]: fiumi ~5·10¹² mol/anno di Mg e ~10¹³ mol/anno di Na; tempi di residenza di ~80–100 Myr per Cl e ~50–70 Myr per Na. **Da rileggere prima di tararci un test.**
- **[R]** Wallmann 2001 (GCA 65, 3005): modello a scatole del Cretaceo‑Cenozoico con Mg, Ca, Sr e CO₂ legati a espansione dei fondali, alterazione e reverse weathering. È il riferimento per un bilancio Mg–Ca accoppiato alla tettonica.

### Inferences
**(a) Che cosa è posto a mano o non emerge**
- **[C]** La diagnosi numerica. Cl nel mare ≈ 0,95 × 90·10⁻⁶ × 4,0·10²⁴ kg ≈ 3,4·10²⁰ kg in 1,4·10²¹ kg d'acqua, cioè ~245 g/kg di Cl. Il salgemma satura a ~6,1 mol/kg (~216 g/kg di Cl). Il mare è quindi una salamoia satura e la salinità resta inchiodata a ~300 g/kg finché il Cl di superficie non cala almeno di un fattore ~1,3–1,5. Per arrivare a ~19 g/kg di Cl va tolto circa il **92%**.
- **[C]** I pozzi reversibili contano poco. Con il seppellimento e il ritorno di `bilancioSali`, a regime `sed/mare ≈ kNeutro·riciclo`. Con un sedimento terrestre di ~2·10¹³ kg/anno [R] si ha kSepolto ≈ 1,3·10⁻⁹ /anno; con riciclo ~2·10⁸ anni il rapporto è ~0,26. I sedimenti tengono dunque ~20% del sale: il pozzo dei pori **non può** dare un fattore 10. L'ipotesi dell'utente ("il sale non è sepolto") è vera solo a metà. Il sale è sepolto, ma torna; e sulla Terra l'acqua dei pori è un pozzo minore perché la compattazione la espelle [R].
- **[C]** Terra vera. 17–30 µg/g × 4,0·10²⁴ kg = 6,8·10¹⁹–1,2·10²⁰ kg di Cl nella BSE, contro ~2,6·10¹⁹ kg nel mare (1,35·10²¹ kg × 19,35 g/kg). Il mare tiene il **22–38%** del cloro della BSE. Lo stesso modello con Cl terrestre ma 95% in superficie darebbe circa 2,6–4,6 volte il vero. Questo è coerente con i 71 g/kg della prova (`mare.js:37`).
- I parametri posti a mano: `INTRAPPOLATO 0,05` (`elementi.js:509`); `perEruzione {Cl 0,35; S 0,9}` e `estrusivo 1/6` (`mare.js:107–108`); `porosita 0,2` (`mare.js:118`); `caldo 0,1`, `tiepido 0,2`, `magnesioTiepido 0,003` e `potassioTiepido 0,02` (`mare.js:111–112`); `cec 0,25` (`mare.js:116`); `alluminioArgilla` come tetto delle argille nuove (`mare.js:117`, `350`). Due eventi decidono lo stretto dei mari chiusi (MR10). Il clima e i continenti sono quelli di oggi per 4,5 Gyr (MR3).
- Il difetto di Na, K e Cl ×5 nasce **a monte**, nella catena dell'accrescimento (`elementi.js:70–77`): il disco a 1 UA non supera ~570 K e l'evaporazione dal fuso non tocca gli embrioni. È una questione per il gruppo del disco, ma va dichiarata qui perché da sola basta a saturare il mare.

**(b) La sostituzione con leggi.** Un "termostato del sale" a tre serbatoi (mare, crosta/sedimenti, mantello) **[P]**:
- `dCl_s/dt = F_degas − F_subd − F_evap,perm`, con:
  - `F_degas = Ṁ_fuso·C_Cl,mantello·f_sfiato(P_sup)`, cioè fusione × concentrazione × frazione che sfiata sotto bassa pressione: come oggi, ma per tutta la storia;
  - `F_subd = Ȧ_placche·[d_alt·ρ_b·C_Cl,AOC(S) + d_serp·ρ_s·C_Cl,serp(S) + φ_sed·d_sed·ρ_w·S_Cl]·(1 − f_rilascio,arco)`. Gli assorbimenti in anfibolo e serpentino sono **proporzionali alla salinità del fluido**: C = K_D·S_Cl, con K_D fra minerale e fluido misurati in laboratorio [R];
  - `F_evap,perm` è il sale nei bacini evaporitici conservati sui cratoni, cioè la frazione non riciclata in un tempo di vita del cratone.
- **[C/P]** Ne viene un feedback negativo, perché F_subd ∝ S. Lo stato stazionario è `S* ≈ F_degas/(k_subd + k_evap)`: la salinità esce da tassi fisici, non da una taratura, come l'acqua in Cowan & Abbot (§2).
- **[C]** L'ordine di grandezza terrestre: con 2,5–12·10⁹ kg/anno in subduzione e 2,6·10¹⁹ kg nel mare, la residenza rispetto alla subduzione è 2–10 Gyr. In 4 Gyr la subduzione rimette nel mantello 0,4–1,9 volte il Cl del mare. Il termine è dello stesso ordine del mare: non è trascurabile.
- **Na.** Na_mare = Cl_mare·(Na/Cl) con il vincolo delle cariche. I pozzi di Na senza anione forte (la "soda"): albitizzazione idrotermale, già dall'equilibrio anortite–albite (`mare.js:270`); reverse weathering con tetto da Al (`mare.js:350`); scambio sulle argille. Va aggiunto lo **spilitismo** dei basalti a bassa T, in cui Na entra nel plagioclasio, come equilibrio a T del fianco di dorsale.
- **Mg.** Rimozione idrotermale ad alta T al 100% (Bischoff & Dickson, già in codice). In più: dolomia e smectiti di Mg nelle argille nuove, con lo stesso tetto in Al e Si.
- **K.** Alterazione a bassa T (codice) più illitizzazione delle argille. Il K esce anche con il Cl in subduzione? No: il K entra nell'illite e nelle miche, ed esce con i sedimenti subdotti.

**(c) Calcolo economico con errore noto.**
- **[P]** Il sistema è lineare a tratti: tre ODE per elemento su ~320 passi, come oggi. Il costo è trascurabile (<1 ms). Lo stato stazionario si trova anche in forma chiusa: `S* = F/(Σk)`. Va integrato nel tempo solo se i tassi cambiano con `storia(t)` (MR3).
- **[P]** L'errore dominante è l'incertezza sul flusso in subduzione (fattore ~5: 2,5 contro 12·10¹² g/anno) e sui K_D. Va dichiarato come intervallo, non tarato.

**(d) Che cosa passa da padre a figlio.**
- **Padre → mare:** la storia termica, che dà il tasso di fusione; la tettonica, che dà Ȧ_placche, lo spessore della crosta idratata e l'età dei cratoni; il clima, che dà E − P nei bacini chiusi; l'erosione, che dà sedimenti e argilla.
- **Mare → indietro:** la salinità torna (i) al clima, attraverso densità e circolazione termoalina (Hay 2006) e attraverso l'attività dell'acqua, che abbassa l'evaporazione [R]; (ii) al mantello, attraverso il Cl subdotto, che chiude il conto in `libroDeiConti` (`elementi.js:711`); (iii) alla CO₂, attraverso le argille nuove (Isson & Planavsky), oggi calcolata ma non restituita all'aria (`mare.js:79`).
- **Chiusura da verificare in test:** Σ(mare + sedimenti + evaporiti + crosta + mantello) = Cl iniziale, per ogni passo.

**(e) Che cosa si vede.**
- **Pianeta intero:** il colore cambia poco con la salinità, ma i mari chiusi saturi diventano bianchi, con croste di salgemma e gesso.
- **Da 100 km a 1 km:** le sabkha e le piane saline, i bacini messiniani.
- **Sotto 1 m:** cubi di salgemma e lamine di gesso, già in `mare.js`.

### Gaps
- Le masse di Cl nelle evaporiti e nelle salamoie crostali non sono state verificate su fonte: i PDF di Hay et al. 2006 e Knauth 2005 hanno risposto 403 o erano vuoti, e la ricerca dei numeri non ha dato una fonte primaria. Il "circa quanto il mare" resta **[R]**.
- I coefficienti di ripartizione del Cl fra anfibolo, serpentino e fluido non sono stati letti.
- Il PDF GCA 2016 sul flusso della crosta alterata ha risposto 403: il fattore "×3" è solo **[S]**.
- Il testo di Isson & Planavsky e di Wallmann 2001 non è stato letto: nessuna equazione verificata.
- Non è chiaro se il nucleo trattenga Cl: Yuan 2024 contro Sharp & Draper 2013. Il contributo del nucleo resta aperto.

---

## 2. Perché quasi ogni pianeta roccioso esce coperto d'acqua

### Takeaway
L'acqua di superficie è una costante: il 4% dell'acqua totale (`leggi.js:129`). Il volume dei bacini e la gravità non entrano. La legge che lo sostituisce è il **ciclo profondo dell'acqua** di Cowan & Abbot 2014. Lo stato stazionario fra rigassamento (dipendente dalla pressione del fondale) e degassamento, più l'isostasia, decide quanta acqua sta fuori e se i continenti emergono. Con tettonica attiva, i continenti restano esposti fino a una frazione d'acqua di circa 0,2% della massa, a qualunque massa del pianeta.

### Cited Findings
- **[Codice]** `leggi.js:129–135`. `PARTE_FUORI = 0.04`: "la parte dell'acqua che un pianeta di roccia ha liberato in superficie", identica per ogni pianeta roccioso.
- **[V]** Cowan & Abbot 2014, il modello a due scatole:
  - rigassamento `w↓ = x_h·ρ_b·d_h(P)·χ`, con `d_h = min[d_h⊕(P/P⊕)^σ, d_b]`;
  - degassamento `w↑ = x·ρ_m·d_melt·f_d(P)`, con `f_d = min[f_d⊕(P/P⊕)^(−μ), 1]`;
  - valori nominali: x_h = 0,05; χ = 0,23; d_h⊕ = 3 km; d_b = 6 km; d_melt = 60 km; f_d⊕ = 0,9; P⊕ = 4·10⁷ Pa; μ = σ = 1;
  - stato stazionario `x/x⊕ = (P/P⊕)^(μ+σ)`, con x⊕ ≈ 5,8·10⁻⁴;
  - profondità massima dei bacini per isostasia `d_o^max ≈ 11,4 km·(g/g⊕)⁻¹`; spessore massimo dei continenti 70 km·(g/g⊕)⁻¹; bacini sul 90% dell'area;
  - per un pianeta di 10 M⊕ i continenti emergono se ω ≲ 2·10⁻³. Senza ciclo profondo e isostasia la soglia sarebbe 3·10⁻⁵: la vulnerabilità all'inondazione cala di circa 80 volte;
  - x⊕ ×10 sposta la soglia di circa un ordine di grandezza; φ fra 1 e 3 la sposta di meno di un fattore 2 — [arXiv:1401.0720 (ar5iv)](https://ar5iv.labs.arxiv.org/html/1401.0720), [ADS](https://ui.adsabs.harvard.edu/abs/2014ApJ...781...27C).
- **[S]** Lavori successivi estendono il risultato: i feedback stabilizzanti allargano di ordini di grandezza l'intervallo di superfici "come la Terra" — [arXiv:1511.04444](https://arxiv.org/pdf/1511.04444).

### Inferences
- **(a)** `PARTE_FUORI` è una specie "b" (misura terrestre usata ovunque) e produce oceani proporzionali all'acqua del disco. Un disco appena più umido del terrestre annega tutto, perché `geologia.js` riempie il rilievo fino al livello che l'acqua chiede (`geologia.js:415`).
- **(b) [P]** Al posto di `PARTE_FUORI`, risolvere `w↑ = w↓` per x, cioè l'acqua nel mantello, e prendere `W_sup = W_tot − x·M_m`. P = ρ_w·g·d_w dipende da W_sup: è un'equazione in un'incognita, si risolve con una bisezione. I d_h, d_melt e f_d terrestri vanno sostituiti con quelli che `geologia.js` e `tettonica.js` già calcolano: lo spessore della crosta dalla fusione, la profondità del solidus idrato, la velocità delle placche. Senza placche (coperchio stagnante) il rigassamento quasi si spegne e l'acqua sta fuori: lo si deve vedere come differenza fra regimi.
- **(c)** È una bisezione su una funzione chiusa: microsecondi. L'errore è dominato da x⊕ (fattore ~10 secondo gli autori) e va dichiarato.
- **(d)** Padre: massa, gravità, regime tettonico, flusso di calore, acqua totale. Figlio: livello del mare, frazione di terre, e quindi area di erosione, quindi apporto ai sali (§1), quindi CO₂. **Ritorno:** la massa del mare cambia la salinità (§1) e il clima. La massa del mare non è più costante (oggi lo è, `mare.js:76`).
- **(e)** Il primo effetto visibile da lontano è la frazione di continenti. Un pianeta di "sola acqua" diventa raro e motivato: acqua oltre lo 0,2% in massa, oppure niente tettonica e acqua abbondante.

### Gaps
- La forma della ipsometria oltre il modello a due delta (continenti e bacini) di Cowan & Abbot non è trattata. Serve quella vera di `geologia.js`.
- Non è stata letta la letteratura successiva (Komacek & Abbot 2016; Schaefer & Sasselov 2015) sui tassi dipendenti dalla temperatura del mantello [R].

---

## 3. Clima da leggi ma economico: EBM stagionale, scale da GCM ideali, regimi di nubi, sistemi meteorologici statistici

### Takeaway
La catena giusta ha tre parti. (1) Un EBM diffusivo stagionale, già in `bilancioPerFasce`, con D da una legge e non da D₀ terrestre. (2) Il modello a due strati di `meteo.js`, che restituisca gli stati istantanei e non solo le medie. (3) Gli oggetti meteorologici (cicloni, fronti, cellule di nubi) istanziati da statistiche **condizionate allo stato del clima**: tasso di crescita di Eady, raggio di deformazione, intensità potenziale, stabilità inferiore. Le nuvole restano la chiusura empirica dichiarata. Il loro aspetto a scala media si può però far emergere dai criteri di regime invece che dal rumore trascinato dal vento (`pianeta.js:43`, `86–92`).

### Cited Findings
- **[Codice]** I parametri posti a mano di `meteo.js:107–120`: `cdMare/cdTerra` (formule di massa); `secchio 150 kg/m²` (Manabe); `stabilitaSecca 0,8`; `tempoPioggia 4 h`; `umiditaNuvole 0,6` (Sundqvist); `raggioGocce 10 µm` (`leggi.js:185`); `viscosita 0,003`, `latCritica 45`, `courant 0,85` (numerici). Le nubi basse seguono Klein–Hartmann `5,7·LTS − 55,73%` (`meteo.js:55`, `270–272`). Ci sono due strati, una griglia 64×32 e decine di giorni (MT8). Le stagioni sono "tenute ferme" e il modello non produce tempo meteorologico ma solo medie (MT11).
- **[Codice]** `pianeta.js:43` e `86–92`. Il 3D prende la copertura di `meteo.js` e "la forma minuta è un rumore che il vento trascina": la forma delle nubi non emerge.
- **[V]** ExoPlaSim è un GCM di complessità intermedia: core spettrale T21 (32×64) o T42, 5–10 livelli sigma, due bande corte e una lunga grigie, convezione profonda Kuo, convezione bassa Tiedtke, nubi combinate con sovrapposizione casuale `CLD_t = 1 − Π(1 − CLD_k)`, oceano a slab di 50 m senza trasporto, ghiaccio marino termodinamico. A T21 un anno modello richiede 30–60 s su cluster e ~3,75 min su un portatile a quattro core. Validato fra 0,1 e 10 bar e su pianeti in rotazione sincrona (casi YB, THAI) — [ExoPlaSim, arXiv:2107.07685](https://ar5iv.labs.arxiv.org/html/2107.07685).
- **[S]** Licenza di ExoPlaSim: "distributed under the General Public License", versione non indicata nelle pagine lette. Il fork di PlaSim è GPL‑2.0 — [PyPI exoplasim](https://pypi.org/project/exoplasim), [PLASIM GitHub](https://github.com/jhardenberg/PLASIM).
- **[V, dai rapporti]** Formule già verificate nei rapporti precedenti, qui solo richiamate:
  - Held–Hou `Y_H = a(5R/3)^{1/2}`; Held 2000 `φ_H ≈ (NH/Ωa)^{1/2}`;
  - numero di getti `~(2Ωa/U)^{1/2}` (Rhines);
  - gas di vortici di Gallet & Ferrari 2020 per D;
  - Monin–Obukhov + Charnock;
  - intensità potenziale con C_k/C_D = 0,9;
  - Kopparapu;
  - climlab EBM (A = 210, B = 2, D = 0,555)
  - — `reports/Leggi fisiche complete per stateyour.md` §"Aria, mare e ghiaccio".
- **[R]** Instabilità di Eady: tasso massimo `σ = 0,31·(f/N)·∂U/∂z`, lunghezza d'onda più instabile `λ ≈ 3,9·L_D` con `L_D = NH/f` (Vallis, *Atmospheric and Oceanic Fluid Dynamics*, cap. 6).
- **[R]** North 1975 (J. Atmos. Sci. 32, 2033): soluzione analitica dell'EBM diffusivo con `T = T₀ + T₂·P₂(sin φ)`, ghiaccio–albedo compreso. È un controllo a costo nullo.
- **[R]** Regimi di nube:
  - Bony et al. 2004 classificano le nubi tropicali per velocità verticale ω₅₀₀ (salita → convezione profonda; discesa → nubi basse);
  - Wood & Bretherton 2006: la copertura di nubi basse è proporzionale alla stabilità inferiore stimata, `EIS = LTS − Γ_m(850)·(z₇₀₀ − LCL)`, circa +6%/K. EIS è migliore di LTS fuori dai subtropici.
- **[R]** Isca (Vallis et al. 2018, GMD) è GPL‑3. I rapporti precedenti hanno verificato che tutti i modelli intermedi sono GPL o non commerciali tranne ClimaAtmos (Apache‑2.0) [V nei rapporti].

### Inferences
**(a) Da sostituire**
- D₀ = 0,58 terrestre (LG16) → gas di vortici (già proposto).
- Il rumore delle nubi (`pianeta.js:86–92`) → nubi da regime e celle (sotto).
- Le nubi basse di Klein–Hartmann su LTS → EIS: stessa forma, ma la parte umida della stabilità viene dall'adiabatica satura che `meteo.js` ha già, e funziona a ogni temperatura.
- Le stagioni ferme (MT11) → forzare con l'insolazione dell'ora vera.

**(b) Le leggi per gli oggetti meteorologici [P]**
- **Cicloni extratropicali.** La densità e la posizione delle tracce si ricavano dal campo `σ_Eady(φ, λ)` calcolato sui venti dei due strati di `meteo.js`, con `∂U/∂z ≈ (u₂ − u₁)/Δz` e N dalla stratificazione già derivata.
  - Densità areale ≈ 1 sistema per `(λ_Eady/2)²` dove σ supera il suo 50° percentile.
  - Durata ~ 3/σ.
  - Velocità di fase = vento a metà quota `(u₁ + u₂)/2` (Eady).
  - **[C] Terra:** con N = 10⁻² s⁻¹, H = 10 km e f = 10⁻⁴ s⁻¹ si ha L_D ≈ 1000 km e λ ≈ 3900 km, cioè ~6–7 onde per parallelo a 45°. Con ∂U/∂z = 3·10⁻³ s⁻¹, σ ≈ 9·10⁻⁶ s⁻¹ (e‑folding ~1,2 giorni).
- **Fronti:** sulla geometria di un'onda baroclina, con un modello concettuale (Norvegese o Shapiro–Keyser [R]). Il fronte freddo sta dove la deformazione massima incontra il gradiente di T.
- **Cicloni tropicali:** dove l'intensità potenziale supera ~30 m/s e |f| è sufficiente (latitudine ≳ 5°) [R]. Il profilo radiale è quello di Holland 1980 [R]; la traccia è un evento. Il tasso di genesi è empirico: si può usare un indice di potenziale di genesi (Emanuel & Nolan 2004 [R]) e dichiararlo.
- **Regimi di nube nel 3D:**
  - convezione profonda dove CAPE > 0 e il moto è in salita;
  - cumuli degli alisei dove c'è discesa moderata ed EIS bassa;
  - stratocumuli chiusi dove EIS è alta sul mare freddo;
  - celle aperte dove c'è aria fredda su mare caldo (avvezione fredda), con diametro delle celle ~10–40 volte lo spessore dello strato limite [R] e spessore dello strato limite da Monin–Obukhov o dall'inversione;
  - strade di nubi (rulli) con spaziatura ~2–4 volte lo spessore dello strato limite, allineate al vento, quando c'è vento forte e flusso di calore dal basso [R].
- **(c) Il costo.** L'EBM a fasce è tridiagonale implicito (algoritmo di Thomas), O(N), microsecondi. Il due strati resta il motore. Il campionamento degli oggetti è un processo di Poisson indirizzato per cella e finestra di tempo: `sorgente(".../meteo/cella I,J/finestra n")`. Microsecondi per oggetto.
- **[P]** Per tenere bit‑identici i risultati, la fisica che torna al modello resta su CPU in Float64. Il GPU (WebGPU) serve solo alla resa, perché l'aritmetica in virgola mobile del GPU non è garantita identica fra schede.

**(d) Il conto fra i livelli [P]**
- **Padre → figlio:** dalla cella del clima arrivano ⟨u⟩, la varianza dei venti dalle uscite istantanee, ⟨P⟩, la copertura e il regime. Gli oggetti istanziati devono riprodurre le medie del padre (la regola M∘μ = I di `finestra.js:3–4`).
  - Si istanziano i cicloni, poi si **riscala** l'ampiezza perché ⟨pioggia istanziata⟩ = pioggia della cella e il flusso di calore dei vortici = quello del gas di vortici.
  - Le ampiezze vengono dall'indirizzo; la loro normalizzazione viene dal padre.
- **Figlio → padre:** solo i coefficienti, come la regola "salire è ricavare coefficienti" dei rapporti: la varianza del vento per le onde (§5), il flusso di vapore. Non si rifà il clima per ogni nube.

**(e) Che cosa mostrare per larghezza dello schermo**
- **~10⁷ m (pianeta):** fasce di nubi (ITCZ, storm track), dischi di ghiaccio, mosaico di stratocumuli ai bordi est degli oceani.
- **~10⁶ m:** cicloni a virgola con fronti; uragani con occhio; il vortice di stratocumulo.
- **~10⁵ m:** celle aperte e chiuse; strade di nubi; linee di groppi; ombre delle nubi.
- **~10⁴ m:** singoli cumuli e torri, scrosci di pioggia (dal campo di pioggia di `meteo.js` con la distribuzione delle celle convettive).
- **≤10³ m:** la trama del singolo cumulo (frattale, dimensione ~1,35 dell'area–perimetro [R]).

### Gaps
- Le costanti per celle aperte e chiuse e per le strade di nubi non sono state verificate su fonte.
- La genesi dei cicloni tropicali non ha legge (dichiarato anche in letteratura).
- Non sono state lette le parti di ExoPlaSim sullo schema delle nubi di strato: il testo letto copre solo i primi 100 000 caratteri.

---

## 4. La circolazione dell'oceano, i vortici, la SST e il colore senza plancton; perché il mare aperto a scala media è vuoto

### Takeaway
Fra la cella del mare (~150 km) e la finestra delle onde (metri) il modello non mette niente. I vortici sono un "rumore fisso del luogo" (`mare.js:70`, `1244–1252`) usato solo per spostare il fango; le correnti hanno uno strato solo, senza vortici risolti (`mare.js:83`). La materia per riempire quelle scale esiste già nello stato. Il raggio di Rossby (`mare.js:597`) dà la taglia dei vortici, che si possono istanziare come oggetti gaussiani con la statistica di Chelton et al. 2011: raggio O(100 km), ~90% non lineari, deriva verso ovest alla velocità delle onde lunghe di Rossby. A scale minori vanno i fronti e filamenti di sottomesoscala (dal raggio di deformazione dello strato rimescolato) e le strisce di Langmuir.

### Cited Findings
- **[Codice]** `mare.js:21–23`, `83`. Correnti di Stommel a uno strato e niente vortici. `mare.js:125`: `strato 50 m`, `mescola 10⁻⁴`, `deriva 3%`. `mare.js:597`: `raggioVortici = √(g′·h_termoclino)/f(45°)`, calcolato ma usato solo per il fango (`1252`).
- **[S]** Chelton et al. 2011 (Prog. Oceanogr. 91): 16 anni di altimetria da due satelliti. I vortici sono coerenti con raggi O(100 km); circa il 90% è non lineare (velocità di rotazione maggiore della velocità di traslazione). I vortici molto non lineari extratropicali sono ciclonici nell'emisfero sud e anticiclonici nel nord. 35 891 vortici tracciati; la velocità di propagazione non dipende dalla polarità ed è vicina alla velocità di fase delle onde lunghe di Rossby (scarto di ~20%) — [Chelton et al. 2011 (copia UMN)](https://ucc.umn.edu/eddies/media/papers/chelton2011_global_eddies.pdf). Il PDF ha risposto 503; numeri dall'estratto.
- **[V, dai rapporti]** Sono già verificati: il profilo di Munk dello strato limite ovest, `δ_M = (A_H/β)^{1/3}`; il termoclino `δ = (κfL²/g′)^{1/3}`; i polinomi di stato di Roquet (MIT) — `reports/Leggi fisiche complete per stateyour.md`.
- **[R]** Sverdrup: `β·V = curl_z(τ)/ρ`, con ψ integrato da est; pompaggio di Ekman `w_E = curl(τ/ρf)`. Velocità delle onde lunghe di Rossby `c = −β·L_D²`.
- **[R]** Chelton et al. 1998 (JPO 28, 433): il primo raggio baroclino va da ~200 km all'equatore a ~10 km ad alta latitudine.
- **[R]** La sottomesoscala ha taglia `L_s ≈ N_ML·H_ML/f` (~1–10 km) e nasce dall'instabilità dello strato rimescolato (Boccaletti, Ferrari & Fox‑Kemper 2007). Le celle di Langmuir hanno spaziatura ~2–3 volte la profondità dello strato rimescolato, linee allineate al vento, e richiedono deriva di Stokes più vento (numero di Langmuir turbolento La_t = (u*/U_s)^{1/2} ≈ 0,3).
- **[Codice]** L'ottica del mare oggi: acqua pura (Pope & Fry 1997; Morel 1974), fango (Babin 2003), `R = 0,33·b/(a+b)` (Gordon 1975), tre bande RGB (MR7). Il riflesso del sole segue Cox & Munk (`finestra.js:56`).
- **[R]** Gordon et al. 1988: `R_rs = 0,0949·u + 0,0794·u²`, con `u = b_b/(a + b_b)`. È migliore della forma lineare quando b_b/a cresce (acque torbide).
- **[R]** Cox & Munk 1954: varianza delle pendenze `σ² = 0,003 + 5,12·10⁻³·U₁₀`. Dà la larghezza del riflesso del sole su tutta la gamma da pianeta a km, già usata in `finestra.js` (`finestra.js:56`).

### Inferences
**(a)** Non emergono: i vortici (rumore fisso, MR11); la colonna (MR19); `strato 50 m` (MR9); A_H = 1000 m²/s fisso (MR8); niente sottomesoscala né Langmuir; il colore a tre bande.

**(b) [P] Le leggi**
- **Vortici di mesoscala.** Un processo di Poisson in spazio‑tempo sulla cella del mare. Densità ~ `EKE/(U_v²·π·L²)`, con EKE dalla parte baroclina del vento: per lo schema di Gallet & Ferrari la velocità è U ~ D/λ. Raggio ~ `c₀·L_D(φ)` con c₀ ≈ 1–2 (Chelton: ~100 km a medie latitudini contro L_D ~ 30–50 km [R]). Profilo di SSH gaussiano [R]; velocità di rotazione dal gradiente geostrofico. Deriva verso ovest a `c = β·L_D²`, più la corrente media. Vita di settimane o mesi. Polarità con la preferenza per emisfero osservata.
- **[C] Terra a 30°:** β ≈ 2·10⁻¹¹ m⁻¹s⁻¹ e L_D ≈ 40 km danno c ≈ 3 cm/s.
- **Effetto sulla SST:** ogni vortice sposta l'isoterma di `ΔT ≈ (∂T/∂y)·r`. Questo dà i filamenti e gli anelli di Corrente del Golfo (ring caldi e freddi) **senza** risolvere le equazioni.
- **Sottomesoscala:** filamenti di larghezza `N_ML·H_ML/f`, sulla deformazione dei vortici (fronti fra vortici adiacenti). Si sintetizzano come curve di livello del campo di SST deformato, dove la deformazione la dà il campo di velocità dei vortici.
- **Langmuir:** linee di schiuma e detriti (le "windrows") con spaziatura ~2,5·h_ML, dove h_ML viene da Monin–Obukhov o Kraus–Turner (proposta dei rapporti) invece di 50 m fissi.
- **SST:** slab con capacità `ρc_p·h_ML`, flusso netto dal clima, trasporto di Ekman, pompaggio di Ekman (risalite fredde ai bordi est e all'equatore) e avvezione della corrente di gyre. Tutti i termini esistono già in `mare.js`: vanno sommati in un'equazione di slab per cella.
- **Colore senza plancton:** spettro a ~10–30 bande invece di RGB: `a_w(λ)` di Pope & Fry 1997 e `b_w(λ) ∝ λ^−4,32` di Morel. Poi `R_rs` di Gordon 1988, il riflesso di Fresnel del cielo (Rayleigh dell'aria di quel pianeta, `pianeta.js:59`) e la schiuma con riflettanza 0,22. Il mare aperto senza vita è blu‑violetto scuro, perché il massimo di R_rs cade sotto i 450 nm [R]. Con una stella più rossa il colore cambia da solo.

**(c) Costi**
- I vortici sono un costo per oggetto, tipicamente 10–100 per finestra. La loro somma si valuta su griglia in O(N·oggetti vicini) con una griglia di raccolta (bucket).
- **1,5 strati a gravità ridotta** (Aronnax, citato nei rapporti) su GPU, solo se si vuole un campo vivo; altrimenti la sintesi statistica sopra.
- Lo Sverdrup è un integrale per riga, O(N).
- **[P]** Errore noto: la sintesi riproduce la statistica a un punto, cioè EKE, raggio e deriva, ma non l'interazione fra vortici (fusione e scissione). Va dichiarato come chiusura.

**(d) Padre e figlio**
- **Padre → figlio:** il vento (meteo) dà τ, che dà Sverdrup ed Ekman; la stratificazione (T, S) dà g′ e L_D; il clima dà Q_net.
- **Figlio → padre:** il trasporto di calore dei vortici, `⟨v′T′⟩ = −K·∂T/∂y` con K dal gas di vortici, sostituisce `1000 m²/s` (`mare.js:713`). Il trasporto di calore totale (`caloreDalMare`) torna al clima (MR1).
- **Conti da chiudere:** l'energia (l'integrale di Q_net sul mare = divergenza del trasporto); il sale (l'integrale di S uguale alla media del bilancio, come già fa `mare.js:561`).

**(e) Cosa popola le scale vuote**
| Larghezza dello schermo | Oceano | Superficie |
|---|---|---|
| 10⁷ m | gyre (fronti di SST), ghiaccio, risalite fredde | riflesso del sole (Cox & Munk), bande di nubi |
| 10⁶ m | correnti di bordo ovest con meandri, anelli | cicloni con la loro scia fredda sulla SST |
| 10⁵ m | **vortici di mesoscala** (anelli di SST, filamenti), fronti di piattaforma | celle di nubi; aree di mare grosso sotto i cicloni (colore e schiuma più bianchi) |
| 10⁴ m | **filamenti di sottomesoscala**; pacchetti di onde interne visibili come chiazze lisce sul bordo della piattaforma [R] | gruppi d'onde lunghe come modulazione del riflesso; zone di schiuma |
| 10³ m | **strisce di Langmuir** (spaziatura 10–100 m), chiazze lisce e zone increspate dalle raffiche | popolazione di frangenti (Monahan, §5) |
| 10² m | creste del mare lungo e del mare di vento | singoli frangenti, schiuma vecchia in strisce |
| 10–1 m | onde corte, capillari, bolle | già in `finestra.js` |

### Gaps
- I numeri esatti di Chelton 2011 (distribuzioni di ampiezza e raggio, rapporto fra raggio e L_D) non sono stati letti: PDF non raggiungibile. Il rapporto ~2–3 fra raggio e L_D è **[R]**.
- Le onde interne di marea come oggetti visibili (chiazze lisce) richiedono una stratificazione sulla piattaforma che il modello non ha.

---

## 5. Onde e schiuma: spettri condizionati al vento locale, continuità dal mare lungo ai capillari, copertura dei frangenti, che cosa fanno i renderer

### Takeaway
`finestra.js` ha già Elfouhaily 1997, JONSWAP, Mitsuyasu, le tessere di Tessendorf con pesi a varianza costante, Monahan, Deane & Stokes: è la parte più vicina all'obiettivo. Restano tre difetti fisici.
1. Le onde nascono dal **vento medio della stagione** (`mare.js:84`). La schiuma, che va come U^3,41, è sottostimata di un fattore ~2,3 per una distribuzione dei venti di Weibull con k = 2 [C].
2. Il mare lungo non viene dai cicloni istanziati.
3. La schiuma è istantanea (`finestra.js:62`).

I pacchetti d'onda di Jeschke & Wojtan 2017 e i "Water Surface Wavelets" (2018) sono il ponte naturale fra lo spettro del padre e il campo locale vicino alle coste.

### Cited Findings
- **[Codice]** `finestra.js:15–40`:
  - spettro Elfouhaily con dispersione `ω² = (gk + σk³/ρ)·tanh(kd)` e la σ di quell'acqua (IAPWS e Sharqawy);
  - tessere di Tessendorf sovrapposte a metà con pesi `w² + w² = 1`;
  - ampiezze dall'indirizzo ("…/onde/tratto I,J/banda b/tessera i,j");
  - Doppler della corrente;
  - schiuma `W = 3,84·10⁻⁶·U^3,41` (Monahan & O'Muircheartaigh 1980) posta dove l'accelerazione verso il basso supera la soglia (Longuet‑Higgins 1969).
- **[Codice]** `finestra.js:62`. "La schiuma è istantanea… niente schiuma vecchia trascinata; le bolle stanno solo sotto la schiuma; le onde non frangono davvero".
- **[Codice]** `mare.js:84`. "Le onde vengono dal vento medio della stagione (niente tempeste): più basse del vero".
- **[V]** Jeschke & Wojtan 2017, "Water Wave Packets" (ACM TOG 36(4), art. 103, DOI 10.1145/3072959.3073678). Particelle lagrangiane che portano pacchetti d'energia d'onda: ognuno copre un gruppo di treni d'onda e non una cresta. Parallelizza bene, gira in tempo reale in scenari moderati, è "incondizionatamente stabile" e include le scie. Codice sorgente su Zenodo — [pagina del progetto ISTA](https://visualcomputing.ist.ac.at/publications/2017/WWP), [record ISTA](https://research-explorer.ista.ac.at/record/470).
- **[R]** Jeschke, Skřivan, Müller‑Fischer, Chentanez, Macklin, Wojtan 2018, "Water Surface Wavelets" (SIGGRAPH 2018). L'ampiezza è una funzione A(x, k, θ) nello spazio‑frequenza‑direzione, trasportata con un'equazione di azione d'onda semplificata: è lo stesso oggetto dello spettro direzionale del padre reso locale. Rifrazione e riflessione sulla costa.
- **[R]** Yuksel, House, Keyser 2007, "Wave Particles" (SIGGRAPH 2007): onde come particelle con un profilo locale, per le perturbazioni interattive (scie di oggetti).
- **[R]** Tessendorf 2001, "Simulating Ocean Water" (note del corso SIGGRAPH): FFT dello spettro di Phillips con fasi casuali, cascate di tessere, "choppiness" con spostamento orizzontale `−i(k/|k|)·ĥ`.
- **[R]** Phillips 1985 (JFM 156): distribuzione della lunghezza delle creste che frangono per velocità, Λ(c) ∝ c⁻⁶ nel sottointervallo di equilibrio. Dà la popolazione dei frangenti per taglia, da metri a decine di metri.
- **[R]** La schiuma ha due stadi: la cresta attiva (stadio A, secondi) e la schiuma residua (stadio B), con un tempo di decadimento di decine di secondi che cresce con la temperatura e i tensioattivi. Esempi: Monahan & Lu 1990; Callaghan et al. 2012.
- **[R]** La distribuzione del vento a 10 m sul mare è vicina a una Weibull con forma k ≈ 2 (Monahan 2006, J. Climate).

### Inferences
**(a)** Da sostituire o completare:
- `mare.js:84`: il vento medio → la distribuzione dei venti;
- `finestra.js:62`: la schiuma istantanea → schiuma con memoria;
- il mare lungo senza sorgente → il mare lungo dai cicloni del §3.

**(b) [P/C]**
- **Vento.** Lo stato del padre è (Ū, k) per cella, con k dalla varianza dei venti istantanei di `meteo.js` (§3). Ogni finestra di tempo estrae U dalla Weibull con l'indirizzo, oppure U viene dal ciclone istanziato se la finestra vi cade dentro.
- **[C]** Con k = 2: ⟨U^3,41⟩/Ū^3,41 = Γ(1 + 3,41/2)/Γ(1,5)^3,41 ≈ 1,55/0,66 ≈ **2,3** per la schiuma media; ⟨U²⟩/Ū² = 1/Γ(1,5)² ≈ **1,27** per Hs², cioè Hs ×1,13. La schiuma da sola cambia l'aspetto del pianeta da lontano.
- **[C]** Monahan dà W ≈ 0,09% a 5 m/s, ≈ 1% a 10 m/s, ≈ 3,9% a 15 m/s.
- **Mare lungo.** Ogni ciclone istanziato è una sorgente con spettro alla sua velocità del vento e al suo fetch, per la sua durata. L'energia si propaga lungo i cerchi massimi alla velocità di gruppo `c_g = g/(2ω)` (acque profonde), con attenuazione per dispersione angolare ~1/sin(distanza angolare) e dissipazione debole. Dove il mare lungo arriva **e quando** è deterministico (dall'evento). Così in ogni punto il mare lungo ha direzione e periodo **ordinati in tempo**: i periodi lunghi arrivano prima.
- **Schiuma con memoria.** `∂F/∂t + U·∇F = W_attiva(x, t)/τ_A − F/τ_B`, dove la sorgente è la soglia di accelerazione già in codice e τ_B dipende da T e S. Le strisce di schiuma escono da sole: schiuma trascinata dalla deriva (3% del vento più Stokes) e raccolta nelle convergenze di Langmuir (§4).
- **Frangenti per taglia.** Λ(c) ∝ c⁻⁶ normalizzato perché `∫Λ(c)·c·τ_A·dc` dia la W di Monahan. Si ottengono i frangenti grandi a 10⁶–10² m e quelli piccoli a 10–1 m senza soglie diverse.
- **Continuità con i capillari.** Già garantita dallo spettro unico di Elfouhaily e dalle bande per ottave. Manca la modulazione dei corti da parte dei lunghi: il cambiamento di pendenza sulle creste porta più capillari davanti alle creste (hydrodynamic modulation transfer function [R]). In finestra si può fare con un fattore `1 + M·∂η_lunga/∂x`.

**(c) Costi**
- 3–4 cascate di FFT 256² su WebGPU: ~1 ms per fotogramma [R, ordine di grandezza dei renderer pubblici].
- Su CPU in JS (Float64) l'FFT serve solo per le tessere indirizzate che toccano la fisica (finestre di prova).
- I pacchetti di Jeschke & Wojtan solo vicino alle coste o agli oggetti, entro ~10 lunghezze d'onda.

**(d) Padre e figlio**
- **Padre → figlio:** dal clima e dal meteo (Ū, k, i cicloni) allo spettro, poi al campo delle tessere, poi alla schiuma e alle bolle.
- **Figlio → padre:** la rugosità di Charnock `z₀ = 0,011·u*²/g` (nei rapporti), che ridà Cd alle formule di massa (MT1); il flusso di sale marino e di aerosol, che va come W, ai nuclei di condensazione e alle nubi (MT4, `risalita.js`); lo scambio di gas, che cresce con la schiuma, alla CO₂.

**(e)** È coperto dalla tabella del §4. In più: a 10²–10³ m si vedono i **gruppi d'onda**, inviluppi di 5–10 creste da battimenti nello spettro stretto del mare lungo, che le tessere producono già se le bande sono abbastanza fini.

### Gaps
- La licenza del codice di Jeschke & Wojtan su Zenodo non è stata verificata.
- Le note di Tessendorf sono un documento di corso, senza licenza del codice.
- Le costanti di decadimento della schiuma τ_B non sono state verificate su fonte.

---

## 6. Metodi numerici rapidi in JS/WebGPU, licenze, e l'ordine di lavoro

### Takeaway
Tutto sta nel tetto di un'app leggera se si separa ciò che torna alla fisica da ciò che serve solo alla resa. Ciò che torna alla fisica (EBM, bilanci a scatole, stato stazionario del sale e dell'acqua, Sverdrup, statistiche degli oggetti) va in JS su CPU in Float64, in ordine fisso: è deterministico al bit. La resa (FFT delle onde, campi di vortici, nubi) va in WebGPU, e non deve mai tornare indietro.

### Cited Findings
- **[V]** ExoPlaSim T21 gira a ~16 anni modello all'ora su un portatile [C dai tempi citati]: troppo per l'app, ma è un **banco di prova fuori linea** (GPL) — [arXiv:2107.07685](https://ar5iv.labs.arxiv.org/html/2107.07685).
- **[V, dai rapporti]** Le licenze già controllate: HEXTOR (tabelle OLR), AGNI (Apache‑2.0), CoolProp (MIT), SeawaterPolynomials.jl (MIT), ClimaAtmos (Apache‑2.0), photochem (GPL‑3) — `reports/Come farlo emergere.md` §2 e §8; `reports/Leggi fisiche complete…`.
- **[S]** ExoPlaSim: "General Public License" senza versione; PLASIM fork GPL‑2.0 — [PyPI](https://pypi.org/project/exoplasim), [GitHub PLASIM](https://github.com/jhardenberg/PLASIM).
- **[R]** Isca: GPL‑3. climlab: MIT.

### Inferences
**[P] I metodi, per componente**
| Componente | Metodo | Costo | Errore noto |
|---|---|---|---|
| EBM stagionale | diffusione implicita tridiagonale, 16–90 fasce, 16–48 passi/anno; controllo con North 1975 | µs–ms | ±2–5 K sulla struttura per latitudine contro un GCM [R] |
| D dei vortici | gas di vortici (Gallet & Ferrari) | µs | costanti da simulazioni, sensibili all'attrito |
| Oggetti meteorologici | Poisson indirizzato con densità da σ_Eady, intensità potenziale, EIS | µs/oggetto | statistica, non dinamica |
| Sale (Na, Cl, K, Mg) | tre scatole, Eulero implicito, oppure stato stazionario chiuso S* = F/Σk | <1 ms | flusso in subduzione ×5 |
| Acqua di superficie | bisezione su w↑ = w↓ (Cowan & Abbot) | µs | x⊕ ×10 |
| Gyre | Sverdrup per riga e Munk analitico al bordo | O(N) | niente inerzia, niente topografia |
| Vortici di mesoscala | somma di gaussiane indirizzate con griglia di raccolta | O(N·k) | niente interazione fra vortici |
| Onde | cascate di FFT (WebGPU), pacchetti vicino alle coste | ~1 ms/frame | lineari, niente frangenti veri |
| Schiuma | avvezione–decadimento semi‑lagrangiana su una texture | <1 ms | τ_B incerto |
| Colore del mare | 10–30 bande: Pope & Fry, Morel, Gordon 1988; tabella (T, S, torbidità, spettro della stella) → RGB precalcolata | ns | modello ad albedo singola |

**L'ordine consigliato**
1. Il termostato del sale (§1) e il Cl della BSE dalla catena del disco. Senza il secondo, il primo non basta: serve togliere ~92% del Cl.
2. Cowan & Abbot al posto di `PARTE_FUORI` (§2).
3. Il vento come distribuzione (§5): un filo, effetto visibile ovunque.
4. I vortici e la SST deformata (§4).
5. Gli oggetti meteorologici e il mare lungo dai cicloni (§3, §5).
6. Le nubi da regime nel 3D (§3).
7. Lo spettro a bande per il colore.

**Il test di chiusura:** per ogni elemento, la somma dei serbatoi in `libroDeiConti` più il subdotto deve tornare. Per l'energia, Q_net medio sul mare = 0 a regime.

### Gaps
- Non è stato misurato il costo reale in JS di questi metodi su questo codice: le cifre sono ordini di grandezza.
- Le versioni esatte delle licenze di ExoPlaSim e Isca non sono state lette nel file LICENSE.
