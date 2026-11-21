# Livelli della superficie di stateyour: paesaggio, fiumi ed erosione, sedimenti, suolo, fratture e pori, biosfera profonda

Panel: geomorfologo, sedimentologo, pedologo, idrogeologo, microbiologo della biosfera profonda, ingegnere della resa del terreno.

Legenda dei segni:
- **[L]**: letto nel codice di stateyour (`file:riga`, stato al 2026-11-21).
- **[V]**: verificato su una fonte in questa sessione. Per un abstract o una scheda letti tramite motore di ricerca è scritto «[V-abs]».
- **[R]**: ricordato e non verificato in questa sessione. Il link porta alla fonte canonica da controllare.
- **[I]**: inferenza del panel.

Una premessa sul codice. L'*Inventario* (sez. 6, GE10–GE30) è in parte superato. `geologia.js` ha già:
- lo stream power implicito di Braun e Willett;
- K misurato per classe di roccia (Stock e Montgomery 1999);
- K_d = 0,01 m²/anno;
- la capacità della ghiaia di Wickert e Schildgen;
- il consumo di Attal e Lavé;
- l'isostasia;
- un bilancio del sedimento che chiude («eroso = depositato + portato al mare»), in `geologia.js:373-420` [L].

Anche `suolo.js` ha già, in `suolo.js:14-60` [L]:
- lo spettro auto-affine con il ginocchio di Perron;
- la produzione di Heimsath;
- Athy, Kozeny-Carman e la legge cubica;
- Darcy, Dupuit e il tempo di residenza.

`reazioni.js:482-500` ha la radiolisi e la serpentinizzazione che producono H₂ nei pori [L]. Quel che resta da fare è soprattutto:
1. togliere il **rumore** dove il dettaglio dovrebbe venire da un processo;
2. aggiungere i **processi assenti**: ghiacciai, dune, coste, frane e la vita nei pori;
3. **collegare** i livelli in modo che i bilanci passino dal padre al figlio e tornino indietro;
4. sistemare la **resa**, che oggi lascia vuote alcune decadi.

---

## 1. Evoluzione del paesaggio rapida ed emergente: stream power implicito, pendii, pendio critico, ghiacciai, dune, coste, simulatori per GPU, amplificazione del grossolano

### Takeaway
Lo stream power implicito è già nel codice e va tenuto. I guadagni veri sono altri:
- sostituire il rumore delle tessere (`geologia.js:674`) e delle quote di partenza (`geologia.js:64-68`) con un'**amplificazione nel dominio del sollevamento**, cioè lo stream power portato all'equilibrio dentro la tessera, condizionato dal padre (l'idea di Cordonnier 2016 e di Schott 2023);
- aggiungere, sulla stessa griglia e con lo stesso solutore O(n): la diffusione non lineare con pendio critico, il «glacial stream power» di Hergarten 2021, le dune di Werner e le coste di Ashton.

Ognuna di queste aggiunte è una legge con pochi coefficienti misurati, e ciascuna fa nascere da sé un lessico di forme che oggi manca.

### Cited Findings

**(a) Che cosa nel codice è ancora a mano o non emergente**
- Il rilievo di partenza è la somma di **24 onde sinusoidali casuali** sulla sfera (`f = 2 + 0,7k`, `a = 1/(1 + 0,35k)`) [L `geologia.js:64`]. L'ampiezza è `r·180 m` sopra la tettonica, oppure `−1500 + r·700 m` per i mondi senza placche [L `geologia.js:68`]. Per la maggioranza dei pianeti, quelli senza placche, la topografia intera è quindi rumore.
- Cancellazione dei crateri di riserva [L `geologia.js:76-77`]:
  - `rinnovo` vale 3, 1 o 1,5;
  - `conservati = exp(−rinnovo·età·0,9)`;
  - i crateri di ripiego sono `900·(1−e^(−età/1,2))`.
- Nelle tessere il dettaglio sotto la madre è **rumore di valore a due ottave**, `amp = 260·0,36^L`, con frequenze `W·n/9` e `W·n/3,1` [L `geologia.js:674`]. Tra 100 km e 10 m è l'unica fonte di forme nuove: l'erosione della tessera può solo ridistribuirle.
  - Nota [I]: 0,36 per ogni suddivisione in quattro corrisponde a H = −ln 0,36/ln 4 ≈ 0,74. È un esponente plausibile, ma è scelto a mano e vale uguale per ogni pianeta e ogni roccia. Anche l'ampiezza di 260 m è uguale ovunque.
- I fiumi entrano nella figlia come «portata della madre × 4» sui bordi [L `geologia.js:696`].
- Un lago esiste se l'area supera `4 + 30·clamp((T−260)/50)` [L `geologia.js:613`]. È una formula, non l'evaporazione di `meteo.js`.
- Gelo e neve in immagine usano la soglia `(268 − T)/12` [L `geologia.js:169`].
- L'interruttore redox è `ossidato = c'è acqua o p > 100 Pa` [L `geologia.js:134`].
- I fiumi seguono la discesa più ripida a 8 vicini (D8) sulla griglia longitudine-latitudine [L `geologia.js:126`].
- I pendii hanno una diffusione **lineare ed esplicita**, limitata a «un quinto del dislivello per passo» [L `geologia.js:576-583`]. Non c'è pendio critico, quindi non c'è frana.
- Il codice stesso dichiara che mancano «ghiacciai, frane, vento, carsismo» [L `geologia.js:412-413`].

**(b, c) Leggi sostitutive, forma compatta, costo ed errore**

*Stream power.* Equazione: `∂z/∂t = U − K·A^m·S^n + ∇·q_s`.
- Braun e Willett 2013 risolvono la parte fluviale in modo **implicito e in O(n)**: il numero di operazioni è proporzionale al numero di nodi. Il metodo è «parallelo». [V-abs] [AGU 2014](https://agu.confex.com/agu/fm14/webprogram/Paper2895.html); [landlab, FastscapeEroder](https://landlab.readthedocs.io/en/latest/generated/api/landlab.components.stream_power.fastscape_stream_power.html).
- Errore noto: il metodo è stabile anche con passi grandi, ma l'accuratezza dei transitori **dipende dal passo** (Appendice B di Braun e Willett) [V] [landlab](https://landlab.readthedocs.io/en/latest/generated/api/landlab.components.stream_power.fastscape_stream_power.html).
- Per n = 1 la forma, ricordata, è `z_i ← (z_i + Δt·U + F·z_r)/(1 + F)`, con `F = K·Δt·A^m/Δx`, risolta seguendo la «pila» da valle a monte [R] [Braun e Willett 2013, Geomorphology 180-181, 170-179](https://doi.org/10.1016/j.geomorph.2012.10.008).
- Estensioni:
  - Cordonnier, Bovy e Braun 2019 trattano le depressioni in tempo lineare [V-abs] ([ESurf 7, 549](https://esurf.copernicus.org/articles/7/549/2019/)).
  - Braun e Deal hanno uno stream power con soglia e portata variabile, la cui accuratezza è «comparable to other schemes for n > 1» [V-abs] ([EGU2018-17723](https://meetingorganizer.copernicus.org/EGU2018/EGU2018-17723-1.pdf?pdf)).
  - Per il deposito con capacità (il termine G, la forma «ξ–q») si veda Yuan e altri 2019 [R] (ESurf 7, 2019).

*Pendii con pendio critico.* Il flusso cresce quasi linearmente a basse pendenze e «sharply» vicino a un gradiente critico [V-abs] (Roering, Kirchner e Dietrich 1999, WRR 35, 853) [EarthRef](https://earthref.org/ERR/69621).
- Forma ricordata: `q_s = K_d·S / (1 − (S/S_c)²)`, con S_c ≈ 1,25 nell'Oregon Coast Range [R].
- Nei risultati della ricerca il valore 1,25 non è stato trovato. Una rianalisi dà S_c ≈ 0,49 per un bacino [V] ([arXiv 1708.06032](https://arxiv.org/pdf/1708.06032)). **Conflitto da risolvere** sul testo del 1999.
- Il landlab ha la forma di Taylor dipendente dallo spessore: `q_s = −K·H*·∇η·[1 + (S/S_c)² + …]·[1 − e^(−H/H*)]` [V-prec, nel rapporto *Come farlo emergere* §7].
- Costo: in forma esplicita il passo stabile crolla verso S_c. Esistono schemi impliciti o «frana istantanea»: si rimuove l'eccesso sopra S_c e lo si manda a valle come evento [I]. Così le frane diventano eventi con indirizzo, cosa che il progetto già prevede (*Come farlo emergere* §7).

*Erosione glaciale come stream power* (Hergarten 2021, ESurf 9, 937) [V]:
- legge: `E = K_g·A_i^m·S^n`, dove A_i è il flusso di ghiaccio espresso come area equivalente, `A_i = q_i/p₀`, e S è la pendenza della **superficie del ghiaccio**;
- m e n sono gli stessi dei fiumi (negli esempi m = 0,5, n = 1), con concavità glaciale θ_g ≈ 0,47;
- l'erosione agisce su una «swath» attorno alla linea di flusso, con `A_eff = A^ε·A_i^(1−ε)` ed ε = 0,25;
- il modello riproduce sovraescavazioni, valli sospese e gradini alle confluenze;
- costo: su 5000×5000 nodi, 1,7 volte il tempo del solo modello fluviale, 2,7 volte con tutto glaciato; milioni di anni su milioni di nodi girano su PC normali;
- licenza di OpenLEM: **non indicata** nell'articolo [V] ([ESurf 9, 937](https://esurf.copernicus.org/articles/9/937/2021/));
- il modello di Deal e Prasicek 2021 (SIIM) è dello stesso spirito, con la velocità di scivolamento trattata in forma analitica [V-abs, citazione secondaria] ([GMD 16, 1315](https://gmd.copernicus.org/articles/16/1315/2023/gmd-16-1315-2023.pdf)).
- Il bilancio del ghiaccio (neve di `meteo` meno fusione) dà q_i. La legge di Glen, `q = −[2A/(n+2)]·(ρg)^n·H^(n+2)·|∇s|^(n−1)·∇s`, è già annotata nel rapporto §7 [R].

*Dune di Werner* (Werner 1995, Geology 23, 1107) [V tramite fonti secondarie e abstract] ([CSDMS WDUNE](https://csdms.colorado.edu/wiki/Model:WDUNE); [Kok e altri 2012, arXiv 1201.4353](https://arxiv.org/pdf/1201.4353)):
- un automa a lastre su reticolo quadrato produce barcane, creste crescentiche, dune lineari e stellate;
- la lastra è portata sottovento di L ≈ 5 celle;
- una «zona d'ombra» di **15°**, equivalente alla bolla di separazione, cattura ciò che vi entra;
- le probabilità di deposito p_s ≈ 0,6 su sabbia e p_ns ≈ 0,4 su suolo nudo, e il crollo all'angolo di riposo (~30–34°), sono ricordate [R]: il PDF originale ha risposto 503;
- limite noto: profili troppo simmetrici; Momiji e altri 2000 li correggono vietando l'erosione nell'ombra [V secondaria].
- Una soglia emergente per ogni pianeta: Bagnold dà `u*_t = A·√((ρ_p − ρ_f)·g·d/ρ_f)` con A ≈ 0,1 [R]. La **lunghezza di saturazione** `L_sat ∝ (ρ_p/ρ_f)·d` fissa la taglia minima delle dune [R] (Claudin e Andreotti 2006, EPSL). Con ρ_f e g di `meteo` e della gravità, le dune di Marte escono più grandi e quelle di Venere più piccole, senza altre scelte [I].

*Coste.* Ashton, Murray e Arnault 2001 (Nature 414, 296): se l'angolo tra le onde e la riva è abbastanza grande, una riva dritta è **instabile**. Nascono capi e promontori cuspidati come quelli della Carolina. Con la formula CERC la soglia è un'onda d'altomare a più di ~42° [V-abs] ([Nature](https://www.nature.com/articles/35104541); [Ashton e Murray 2006](https://waterinstitute.ufl.edu/wp-content/uploads/Ashton-and-Murray-2006-High-angle-wave-instability-and-emergent-shoreline.pdf)). Il clima d'onda si può prendere da `mare.js` e `campoOnde` [I].

*Simulatori della grafica*:
- **Cordonnier e altri 2016** (CGF 35(2), 165): da una carta di **sollevamento** dipinta, un *grafo dei corsi d'acqua* con quote e portate. Il DEM nasce mescolando nuclei di forme parametrizzati dal grafo, presentato come «the first method … combines uplift and hydraulic erosion» [V-abs] ([HAL](https://hal.archives-ouvertes.fr/hal-01262376); [PDF](https://www.cs.purdue.edu/homes/bbenes/papers/Cordonier16CGF.pdf)).
- **Schott, Paris, Fournier, Guérin e Galin 2023** (ACM TOG 42(5), 162): si modella nel **dominio del sollevamento** e il rilievo nasce dallo stream power, grazie a un'approssimazione «fast yet accurate» dell'area drenata e del percorso dell'acqua [V-abs] ([pagina](https://aparis69.github.io/public_html/projects/schott2023_Uplift.html)). Offre anche:
  - copia e incolla, deformazioni per pieghe e faglie;
  - vincoli su punti e curve;
  - la **ricostruzione inversa del sollevamento** da un DEM;
  - fusioni idrologicamente coerenti tra pezze.
  - Il codice è **MIT**, con CMake per Windows e Linux [V] ([GitHub H-Schott/StreamPowerErosion](https://github.com/H-Schott/StreamPowerErosion)).
  - Il dettaglio dell'algoritmo di drenaggio sulla GPU (iterazioni locali di flusso multiplo) è ricordato [R]: la pagina del progetto non lo riporta.
- **Génevaux e altri 2013** (ACM TOG 32(4), 143): la rete dei fiumi cresce **dalle foci verso l'interno** come grafo gerarchico. Bacini e traiettorie si classificano per tipo, e il terreno è una combinazione di pezze procedurali con operatori di fusione e incisione [V-abs] ([HAL](https://hal.archives-ouvertes.fr/hal-01339224); [PDF](https://www.cs.purdue.edu/homes/bbenes/papers/Genevaux13ToG.pdf)). Esiste un'implementazione libera ispirata al metodo, di licenza non verificata ([GitHub wattzhikang/terrainHydrology](https://github.com/wattzhikang/terrainHydrology)).
- **Guérin e altri 2017** (ACM TOG 36(6), 228): GAN condizionali addestrate su terreni reali e sui loro schizzi (creste, fiumi, quote), più un «erosion synthesizer» a costo molto basso [V-abs] ([PDF](https://www.cs.purdue.edu/homes/bbenes/papers/Guerin17ToG.pdf); [codice e dati](https://perso.liris.cnrs.fr/eguerin/new/blog/deep-terrains-code-and-data/)). Per stateyour è un riferimento, non un'adozione: impara dalla Terra, quindi viola «tutto da leggi» [I].
- **Štava e altri 2008** (erosione idraulica interattiva su GPU, griglie a strati e acque basse): ricordato [R], non verificato in questa sessione.

*Licenze dei codici aperti* [V]:

| Codice | Licenza | Fonte |
|---|---|---|
| landlab | **MIT** | [GitHub](https://www.github.com/landlab/landlab) |
| fastscapelib | **GPL-3.0** (conda: GPL-3.0-or-later) | [GitHub](https://www.github.com/fastscape-lem/fastscapelib) |
| Badlands | **in conflitto**: LGPL-3 su CSDMS e PyPI, GPLv3 in un articolo | [CSDMS](https://csdms.colorado.edu/wiki/Model:Badlands); [PyPI 2.2.3](https://pypi.org/project/badlands/2.2.3) |
| Proland | GPLv3 più commerciale (annuncio del 2010) | [gamedev.net](https://gamedev.net/forums/topic/624818-proland-a-new-open-source-planet-rendering-engine/) |
| StreamPowerErosion (Schott) | MIT | [GitHub](https://github.com/H-Schott/StreamPowerErosion) |

Conseguenza [I]: da landlab e da Schott si può copiare codice. Da fastscapelib si portano solo le formule, che non sono protette.

### Inferences

**(d) Che cosa passa dal padre al figlio e che cosa torna, per i fiumi e l'erosione [I]**
- Il padre (tettonica e clima) passa al figlio:
  - U(x) come campo liscio: `sf.sollevamento`, già esistente;
  - la litologia a strati (copertura, lave, basamento: già passata, `geologia.js:672` circa);
  - la pioggia di `meteo.pioggiaFine`, che esiste ma è orfana (Inventario GE28);
  - il livello di base: mare e laghi della madre;
  - la **portata in ingresso** su ogni cella di bordo, con la direzione `versoValle` della madre.
- Il figlio restituisce:
  - il **flusso di sedimento all'uscita**, `Q_s,out`, separato in carico fine e ghiaia;
  - il flusso di soluti (sez. 3);
  - l'aggiustamento della quota media, che deve essere nullo per costruzione: c'è già, «M∘μ = I», a `geologia.js:705-712`.
- Regola di chiusura: per ogni cella della madre, `Σ_figli (eroso − posato) = (eroso − posato)_madre`, entro una tolleranza dichiarata. Oggi il codice toglie al figlio la parte di cambiamento a scala madre, quindi questo vale per costruzione. Va aggiunto il controllo per il sedimento in uscita.

**Sostituire il rumore delle tessere (`geologia.js:674`) con un'amplificazione nel dominio del sollevamento [I, ispirata a Cordonnier 2016 e Schott 2023]**
1. Il sollevamento del figlio è `U_figlio = U_madre interpolato + δU`. Qui δU non è rumore libero, ma la parte di sollevamento che le faglie e le pieghe della tettonica danno sotto la cella. In mancanza di quella, si usa la variazione di **K**: la litologia a strati e le fratture di `suolo.js` (spaziatura dalla legge di potenza n(l) ∝ l^−3) danno K(x) eterogeneo, e le valli seguono le rocce tenere.
2. Si porta lo stream power all'**equilibrio** nella tessera, invece di 26 passi di tempo. All'equilibrio, con n = 1, `S = (U/K)·A^(−m)`. Lungo la rete D∞ o MFD la quota è un integrale: `z(x) = z_base + (U/K)^(1/n)·χ`, con `χ = ∫(A₀/A)^(m/n)·dx` [R: Perron e Royden 2013, ESPL, il «chi»]. Il costo è **una passata O(n) lungo la pila**, senza passi di tempo. L'errore è quello del percorso discreto, O(Δx) per D8 e minore per MFD, ed è esatto per un equilibrio con U e K uniformi a tratti.
3. I versanti si fanno con la soluzione d'equilibrio della diffusione non lineare tra spartiacque e canale. Esiste in forma chiusa per Roering 2007 [R], e il ginocchio ℓ_c di `suolo.js:14-22` dice dove inizia il canale.
4. La media per cella si corregge come già si fa (`geologia.js:705`).
- Il risultato: valli, creste e spartiacque coerenti con i fiumi della madre a ogni livello. L'esponente di Hurst non è più scelto, ma esce dalla rete.

**Mondi senza placche (`geologia.js:68`) [I]:** il rilievo dovrebbe venire da ciò che il pianeta ha davvero:
- crateri (`impatti.js`, già collegato);
- topografia dinamica del mantello: l'ampiezza è `Δz ≈ Δρ_m·α·ΔT·d/(ρ_m − ρ_w)`, da `tettonica.js`, che ha `salite`;
- edifici vulcanici, con l'altezza dalla colonna di magma che la pressione regge (§7 del rapporto);
- flessione elastica sotto i carichi, `α = [4D/(Δρ·g)]^(1/4)`, con D dallo spessore elastico [R].

**Costo complessivo stimato [I]:**
- equilibrio χ per tessera: ~1–3 ms per 256×128 in JS (una passata lungo la pila più l'accumulo dell'area);
- Werner: ~10⁵ lastre per tessera desertica, decine di ms;
- Ashton: 1D lungo la riva, trascurabile;
- Hergarten: ×1,7–2,7 sull'erosione [V per il fattore].

### Gaps
- Il testo completo di Werner 1995 (503) non è stato letto: p_s, p_ns e le regole di valanga restano [R].
- S_c di Roering 1999 è in conflitto: 1,25 [R] contro 0,49 [V, rianalisi].
- Il dettaglio dell'algoritmo di drenaggio GPU di Schott 2023 e i suoi tempi non sono nella pagina letta. Serve il PDF su HAL o il codice.
- Štava 2008 e Yuan 2019 non sono stati verificati in questa sessione.
- La licenza di OpenLEM non è dichiarata nell'articolo.
- La licenza di Badlands è in conflitto (LGPL o GPL): va letto il LICENSE corrente.

---

## 2. Coerenza tra le scale: dividere una tessera padre in figli con statistiche concordi; rilievo auto-affine con esponenti dal processo; drenaggio coerente tra livelli

### Takeaway
La struttura di stateyour è già quella giusta:
- figli condizionati;
- `M∘μ = I` in `geologia.js:705`;
- la costa che segue il segno della madre in `geologia.js:686-700`;
- lo spettro di `suolo.js` con H calcolato dalle pendenze.

Due cose rompono la coerenza:
1. le tessere da 156 km a 10 m usano un **H e un'ampiezza fissi**, mentre il suolo sotto usa un H dal processo: le due statistiche non si incontrano;
2. il drenaggio entra nel figlio come `portata × 4` sui bordi, invece che come **area drenata conservata** lungo la direzione della madre.

Il rimedio è lo stesso spettro, con lo stesso H e lo stesso ginocchio ℓ_c, usato da entrambi, e l'area drenata trattata come grandezza conservata.

### Cited Findings
- Le spettri dei transetti della topografia terrestre seguono `S(k) ∝ k^−β` con β ≈ 2 su un ampio intervallo di scale. Con β = 2H + 1 per i profili si ottiene **H ≈ 0,5** [V] (rassegna di fisica statistica, [arXiv 2009.04918](https://arxiv.org/pdf/2009.04918)).
- Le stime di H fatte su una scala sola sono **distorte in modo dipendente dalla scala**, anche quando la varianza sembra convergere [V] (superfici AFM, [arXiv 2106.16103](https://arxiv.org/pdf/2106.16103)). Per stateyour: H va misurato sulle stesse ottave in cui lo si usa.
- Perron e altri 2009 derivano una lunghezza in cui i tempi del soil creep e dell'incisione si uguagliano. È circa l'area drenata a cui il profilo passa da convesso (creep) a concavo (incisione) [V-abs] ([Perron et al 2009](https://planetarygeoscience.uchicago.edu/doc/Perron_et_al_2009.pdf)). Il «ginocchio» spettrale di Perron 2008 è già nel codice come [R] (`suolo.js:15-18`) [L].
- Già nel codice [L]:
  - H dalle pendenze della cella e della mappa: `H = 1 + ln(S_radice/S_cella)/ln(Δ_radice/Δ_cella)` (`suolo.js:19-20`);
  - l'ampiezza dalla funzione di struttura `V(Δ) = S²Δ²/2` (`suolo.js:21`);
  - la quota della cella come media, per cui il rilievo fine sta solo nelle lunghezze d'onda corte (`suolo.js:21-22`).
- Già nel codice, nelle tessere [L]:
  - correzione liscia bilineare, «dopo quattro giri le medie per cella tornano entro il millimetro» (`geologia.js:705-712`);
  - errore misurato sulla costa: «+9 m su una Terra di prova (al più 22), parte di mare entro 0,003» (`geologia.js:654-657` circa).
- Prassi dei motori: una sola misura, l'**errore sullo schermo**, decide il livello. In Cesium il «maximumScreenSpaceError» vale **16 px** per difetto; ogni livello figlio ha un errore geometrico minore, e le foglie hanno errore circa 0 [V] ([Cesium3DTileset](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html?classFilter=3Dtiles); [specifica 3D Tiles](https://github.com/CesiumGS/3d-tiles/blob/main/specification)).
- Sulle cuciture tra scale (dissolvenza su un intervallo, varianza conservata, posizioni ereditate) le prove sono già raccolte nel rapporto *Navigazione e resa*, sezione «Le cuciture spariscono…» [V-prec].

### Inferences

**Un solo spettro per tutto il terreno sotto la mappa [I]**

Nella forma di `suolo.js:15-18`:
```
P(k) = C·k^(−2−2H)·[1 + (k·ℓ_c)²]^(−2)
```
dove:
- **ℓ_c = (K_d/(K·p^m))^(1/(2m+1))** è già calcolato in `suolo.js:18`;
- **H** non si misura più sulle pendenze, ma si deriva dalla rete di drenaggio. Sopra ℓ_c il rilievo segue `S ∝ A^(−θ)`. Con la legge di Hack, `L ∝ A^h` con h ≈ 0,5–0,6 [R], la pendenza scala con la distanza come `S ∝ x^(−θ/h)`, e da qui `H = 1 − θ/h`. Con θ = m/n = 0,4 e h = 0,57 si ottiene H ≈ 0,3 [I: va verificato, la relazione è un'inferenza dimensionale]. Sotto ℓ_c il versante è liscio: H tende a 1 e lo spettro decade come k⁻⁴ in più;
- **C** si deriva dal sollevamento: all'equilibrio il rilievo di un bacino di lato λ è `(U/K)^(1/n)·χ(λ)`.

Le tessere 1–7 e la finestra del suolo leggono la stessa P(k). La tessera sintetizza le bande tra il suo passo e quello della madre, e il suolo quelle sotto. Così non nasce un salto di rugosità al passaggio tessera → suolo.

**Drenaggio coerente [I]**
- L'**area drenata è conservata**. Il figlio riceve sul bordo `A_in = A_madre(cella a monte)·(frazione del bordo attraversata dalla direzione della madre)`. Al posto del fattore 4 di `geologia.js:696` serve la geometria della direzione D∞ della madre.
- Il canale principale del figlio deve uscire **nella cella che la madre indica** (`versoValle`). Basta un vincolo: si abbassa di ε la cella d'uscita prima di instradare. È lo stesso trucco dei «curve constraints» di Schott 2023 [V-abs, per l'esistenza dei vincoli].
- Controllo numerico da aggiungere ai test: per ogni cella della madre, `|A_figlio,uscita − A_madre| / A_madre < 1 %`.
- La griglia lat-lon con D8 dà artefatti a 45° (Inventario GE16, GE29). Un flusso multiplo (MFD, Freeman o Quinn [R]) per l'area e D∞ per la direzione li riducono a costo ~2×.

**Errore noto della sintesi spettrale [I]:** la varianza sintetizzata è `∫P·2πk dk` sulle bande presenti. La parte mancante, fuori banda, si calcola esattamente con lo stesso integrale. `suolo.js` lo fa già con Gauss-Legendre (`suolo.js:373-430`) [L]: lo stesso conto dà alla resa la **pendenza sotto il pixel** da mettere nella BRDF (sez. 5).

### Gaps
- Non è stata trovata una fonte che derivi H dalla concavità θ e dall'esponente di Hack: la relazione `H = 1 − θ/h` è un'inferenza da verificare.
- Il testo di Perron 2008 sul ginocchio spettrale non è stato riletto in questa sessione.
- Non c'è una fonte letta su come i motori commerciali (Outerra) uniscano un rilievo fisico e uno frattale sotto la cella.

---

## 3. Il suolo da leggi: i fattori di Jenny come processi, la funzione di produzione del suolo, le catene, lo spessore della regolite, il colore da mineralogia, sostanza organica e umidità

### Takeaway
Lo spessore del suolo da Heimsath è già calcolato punto per punto (`suolo.js:23-28`). Il suolo sembra **omogeneo** per altre ragioni:
- una finestra legge **una sola cella madre**, con una granulometria e un colore;
- l'umidità è un fattore fisso 0,72 (`suolo.js:613`);
- manca la sostanza organica;
- mancano le variazioni con l'**indice di umidità topografica**, con l'esposizione al sole e con la posizione lungo il versante, cioè la catena.

Sono tre campi in più (umidità, redox, carbonio organico), ognuno con una legge. Insieme fanno nascere da sé il mosaico dei suoli.

### Cited Findings
- **Funzione di produzione**: Heimsath, Dietrich, Nishiizumi e Finkel 1997 (Nature 388, 358) misurano con ¹⁰Be e ²⁶Al nella roccia sotto suoli di vario spessore un **calo esponenziale** della produzione con lo spessore. È «the first empirical soil production function» [V-abs] ([Nature PDF](https://www.nature.com/articles/41056.pdf); [Wikipedia, soil production function](https://en.wikipedia.org/wiki/Soil_production_function)).
- Su una scarpata in ritiro nell'Australia sud-orientale: al più **53 m/Ma** senza suolo e **7 m/Ma** sotto 100 cm [V-abs] ([ANU](https://researchportalplus.anu.edu.au/en/publications/soil-production-on-a-retreating-escarpment-in-southeastern-austra/)).
- Esiste anche una funzione «a gobba», con il massimo sotto un suolo sottile. La forma esponenziale resta valida in prima approssimazione [V-abs] ([SERC](https://serc.carleton.edu/42696)).
- Nel codice [L]:
  - `P₀ = 3,1·10⁻⁴ m/anno` (media geometrica di 0,05–2 mm/anno, `geologia.js:449`);
  - `h₀ = 0,5 m` e `hMax = 20 m` (`suolo.js:113`);
  - lo spessore all'equilibrio, `h = h₀·ln(P₀·ρ_r/(ρ_s·E))`, con E corretto dalla curvatura del rilievo fine (`suolo.js:23-28`).
- **Colore**: a muoverlo sono gli ossidi di ferro.
  - Viscarra Rossel e altri stimano ematite e goethite dalle bande a ~**880 nm** e ~**920 nm** su 4606 suoli australiani [V-abs] ([data.gov.au](https://data.gov.au/data/dataset/27d90d99-0613-4b58-9a7c-de8e42b99789)).
  - Gli ossidi di ferro «reflect the conditions of pH, Eh, moisture and temperature» [V-abs].
  - Nei suoli tropicali la tinta Munsell segue l'ematite e il rapporto ematite/goethite. Il valore Munsell segue la sostanza organica: l'organico **abbassa la riflettanza**, e sotto di esso le bande della goethite «practically disappeared» [V-abs] ([AGRIS](https://agris.fao.org/search/en/records/65dfe0167c7033e84bef6208)).
  - La saturazione di tinta e croma si raggiunge con pigmento ≥ 16 % ed ematite ≥ 8 % [V-abs] ([Purdue](https://docs.lib.purdue.edu/dissertations/AAI8825533)).
- Nel codice il colore del suolo è [L]:
  - Kubelka-Munk dei granelli, `coloreRoccia` della granulometria (`suolo.js:597`);
  - per l'umidità, un **fattore fisso 0,72** (`suolo.js:613`);
  - una luce **fissa da nord-ovest a 45°**, dichiarata come scelta di resa (`suolo.js:113`, `rugositaLuce`; `suolo.js:599`);
  - i colori dei fluidi nei pori, scritti a mano (`suolo.js:604`).
- Le riflettanze dei materiali della tessera 3D sono 4 costanti, uguali per ogni pianeta: basalto 0,08, granito 0,24, copertura 0,20, sabbia 0,32. Viene dai minerali solo la tinta [L `tessere.worker.js:41`, con fonti USGS splib07 dichiarate alle righe 26-34]. Il codice stesso dichiara che mancano «la grana della neve, l'età della lava, l'umidità del suolo» (`tessere.worker.js:33-34`).

### Inferences

**(a) Le cause dell'omogeneità da vicino [I, dal codice]**
1. Su tutta la tessera ci sono solo 4 riflettanze, uguali tra i pianeti (`tessere.worker.js:41`).
2. La finestra del suolo ha una sola granulometria per cella madre, a `LIVELLO_PADRE = 6` (`suolo.js:97`), cioè ~38 m per la Terra.
3. Mancano umidità, redox e carbonio organico.
4. Sui mondi d'acqua, in mare aperto, c'è davvero poca varietà fisica. Lì il vocabolario è delle onde, non del suolo (sez. 5).

**(b, c) Jenny come processi** [R per la forma `S = f(cl, o, r, p, t)`, Jenny 1941]. Ogni fattore diventa un flusso già presente nel motore:
- **cl** (clima): T e P da `meteo`. Il tasso d'alterazione `W ∝ exp(−E_a/R·(1/T − 1/T₀))·q^β` dipende dal deflusso q. I coefficienti sono già in `chimica.js` (le velocità di dissoluzione) [L, `suolo.js:32-35` usa «le velocità di chimica.js»].
- **o** (organismi): il carbonio organico entra solo se c'è vita, dalla produzione netta di `albero_vita`/`mondo`. Senza vita il carbonio organico è 0 e il suolo resta una regolite minerale: è quel che succede su Marte e sulla Luna [I].
- **r** (rilievo): la curvatura κ è già nel codice. Va aggiunto l'**indice di umidità topografica** `TWI = ln(a/tan β)`, con `a` l'area drenata per unità di contorno, dal drenaggio della tessera [R: Beven e Kirkby 1979]. Il deficit locale della falda segue TOPMODEL: `D_i = D̄ − m_T·(TWI_i − ⟨TWI⟩)` [R]. Da qui l'umidità del suolo e la profondità della falda punto per punto.
- **p** (roccia madre): i minerali di `rocciaDelPianeta` (`suolo.js:119-145`), già collegati [L].
- **t** (tempo): l'età della superficie (`etaCrosta`, crateri) e il tempo di residenza del suolo `h/E` (già nel codice, `suolo.js:33`).

**Catena [I, con forma R]:**
- Il trasporto di suolo dipende dallo spessore: `q_s = −K·h·∇z` [R; landlab DepthDependentDiffuser].
- Il bilancio è `∂h/∂t = P₀·e^(−h/h₀) − ∇·q_s/ρ_s·…`. All'equilibrio:
  - sulle creste convesse il suolo è sottile e drenato, quindi ossidato e rosso (rapporto ematite/goethite alto se T è alta);
  - a mezza costa il suolo è medio;
  - al piede concavo, dove TWI è alto, il suolo è spesso e umido: grigio o verde-azzurro (gley: Fe²⁺ dove la falda resta, Eh basso), e scuro se c'è carbonio organico.
- Tutto nasce da TWI e κ. Nessuna classe di suolo va scritta.

**Colore come legge [I]:**
1. La miscela minerale è già Kubelka-Munk.
2. Si aggiungono come pigmenti:
   - **ematite e goethite**, la cui ripartizione dipende da T e umidità: l'ematite si forma in condizioni più calde e secche, la goethite in condizioni più fresche e umide [R: Schwertmann];
   - il **carbonio organico** come pigmento nero, con coefficiente di assorbimento misurato [R].
3. L'**umidità** si tratta come film d'acqua: la riflettanza scende come `R_umido = R_secco·e^(−c·θ)` (Lobell e Asner 2002 [R]), oppure con il modello di riflessione interna di Ångström 1925 [R]. Va al posto del fattore 0,72.
4. La **luce** va presa dalla direzione vera della stella, come nel 3D, non da nord-ovest.
5. Si aggiungono:
   - **croste di sale**, dove `geologia.js:606` decide la «piana di sale»;
   - **vernice del deserto**, con l'età della superficie [R];
   - **neve a grani**, con l'età della neve e la legge di Warren [R].

**(d) Bilanci del suolo [I]**
- Dal padre: E (abbassamento), P₀ (dalla roccia e dal clima), ricarica (`meteo`, il secchio), T, pCO₂ e, se c'è vita, la produzione netta.
- Ritorno al padre:
  - **flusso di soluti** `W = P₀·ρ_r·CDF`, dove CDF è la frazione di massa persa per dissoluzione. Si ricava dagli elementi immobili, `1 − [Zr]_roccia/[Zr]_suolo` [R: Riebe e altri 2003];
  - **CO₂ consumata** dall'alterazione dei silicati (2 mol per mol di Ca o Mg). Va al mare e all'aria: il filo `ROCCE.denudazione → mare.js` esiste già (Inventario CH13);
  - **sedimento fine** al fiume, cioè la parte non disciolta;
  - **carbonio organico** sepolto o esportato.
- Chiusura per cella: `P₀·ρ_r = W + ρ_s·E_meccanica`. Il controllo è che la somma dei W delle finestre torni al W della cella.

**Regolite dei mondi senz'aria [I]:** lo spessore viene dal «giardinaggio» degli urti, con l'età e il flusso di `impatti.js` [R: Costello e altri 2018, già citato in *Come farlo emergere* §7]. Il colore cambia con lo space weathering, cioè l'età di esposizione e il flusso di vento stellare da `risalita.js` [R]. È un processo diverso per ogni pianeta, e quindi anche un aspetto diverso.

### Gaps
- Il testo completo di Viscarra Rossel 2010 e una legge quantitativa verificata per il loro colore in funzione dell'umidità non sono stati trovati: il legame umidità-valore Munsell resta indiretto.
- Il coefficiente di assorbimento del carbonio organico, i coefficienti di Lobell e Asner e la soglia ematite/goethite sono [R].
- TOPMODEL, Riebe 2003 e Jenny 1941 non sono stati riletti in questa sessione.

---

## 4. Fratture e pori nei primi 10 km e biosfera profonda: porosità e permeabilità con la profondità, tempi di residenza, chimica, abbondanza e limiti energetici; far emergere i microbi dall'energia disponibile

### Takeaway
Il codice ha già quasi tutto il **padre**:
- Athy e la chiusura delle fratture dai moduli della roccia;
- la permeabilità;
- la ricarica e la residenza di Dupuit;
- l'H₂ da radiolisi e serpentinizzazione.

Manca il **figlio vivo**. Per ogni finestra dei pori si fanno quattro passi:
1. si calcola ΔG_r di ogni coppia redox con le attività locali;
2. si moltiplica per il flusso di rifornimento, ottenendo la potenza disponibile P_s;
3. si divide per la potenza di mantenimento P_d(T), ottenendo le **cellule per cm³**, B = P_s/P_d (LaRowe e Amend 2015);
4. si restituisce al padre ciò che le cellule consumano e producono.

I microbi compaiono solo dove c'è energia, e il loro numero si confronta con le stime globali (Magnabosco 2018, Bar-On 2018).

### Cited Findings

**Permeabilità.** Per la crosta continentale tettonicamente attiva vale `log k = −14 − 3,2·log z` (k in m², z in km), definita soprattutto da sistemi metamorfici progradi [V-abs] ([USGS, Ingebritsen e Manning 1999, Geology 27, 1107](https://pubs.usgs.gov/publication/70020946); [USGS, Manning e Ingebritsen 1999, Rev. Geophys.](https://pubs.usgs.gov/publication/70021887)).
- La relazione descrive un calo «quasi esponenziale» con la profondità.
- In profondità media e bassa la curva sta appena sotto la soglia oltre la quale l'avvezione porta calore in modo significativo.
- Nei cratoni stabili la permeabilità può essere più bassa.
- Per eventi transitori che generano permeabilità esiste una curva spostata, `log k ≈ −11,5 − 3,2·log z` [V-abs] ([Ingebritsen e Manning 2010, Geofluids](https://www.usgs.gov/publications/permeability-continental-crust-dynamic-variations-inferred-seismicity-and-metamorphism)).

**Nel codice** [L `suolo.js:129-137`]:
- φ₀ = α_V·(T_fuso − T_s), cioè le crepe di contrazione termica;
- la chiusura delle tracce sotto lo sforzo efficace, `l* = 2K_IC²/(π·σ²)`;
- la profondità di Athy L come integrale;
- `k(z) = k₀·exp(−3z/L)`;
- un confronto con φ₀ = 0,02 e L = 2000 m per il granito, e φ₀ = 0,1 e L = 1000 m per il basalto, dichiarati come [R].

Nota [I]: `exp(−3z/L)` è esponenziale, Manning e Ingebritsen sono una potenza di z. I due andamenti divergono di ordini di grandezza sotto i 3–5 km, e va deciso quale dei due la fisica del codice riproduce.

**Tempi di residenza.** A Timmins (Kidd Creek), a ~2,4 km, i fluidi delle fratture hanno un **tempo medio di residenza minimo di ~1,5 Ga**, dagli eccessi di ¹²⁴Xe, ¹²⁶Xe e ¹²⁸Xe [V-abs] ([Holland e altri 2013, Nature 497, 357](https://www.nature.com/articles/nature12127.pdf)). A 2,9 km se ne misurano di più antichi; a 2,4 km i tempi sono 1,1–1,7 Ga [V-abs] ([Manchester](https://research.manchester.ac.uk/en/publications/tracing-ancient-hydrogeological-fracture-network-age-and-compartm/)). Nel codice il tempo di residenza viene da Dupuit e dalla ricarica [L `suolo.js:38-42`, `suolo.js:167`] e alimenta `luogoDellaCrosta` (`reazioni.js:485`).

**Abbondanza**:
- **Magnabosco e altri 2018** (Nature Geosci. 11, 707) [V-abs] ([ADS](https://ui.adsabs.harvard.edu/abs/2018NatGe..11..707M); [Princeton](https://collaborate.princeton.edu/en/publications/the-biomass-and-biodiversity-of-the-continental-subsurface/)):
  - nel sottosuolo continentale ci sono **2–6·10²⁹ cellule**, stimate da flusso di calore, temperatura di superficie, profondità e litologia;
  - la biomassa procariotica globale del sottosuolo è **23–31 Pg C**, 4–10 volte meno delle stime precedenti;
  - il carbonio organico totale e l'abbondanza di cellule nell'acqua di falda «do not appear to be predictive» delle concentrazioni nel sottosuolo continentale.
  - Un abstract del 2016 dello stesso gruppo: le concentrazioni nelle carote calano con la profondità, mentre le comunità planctoniche dell'acqua di falda variano poco [V-abs] ([Goldschmidt 2016](https://goldschmidtabstracts.info/2016/2390.pdf)).
  - **Conflitto**: un comunicato del New Mexico Tech dà 5,5·10³⁰ cellule, che non coincide con l'abstract; un comunicato DCO dà 15–23 Pg C [V-abs]. Va usato l'abstract.
- **Bar-On, Phillips e Milo 2018** (PNAS) [V] ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/6016768)):
  - il sottosuolo profondo contiene ≈ **15 %** della biomassa totale (≈ 550 Gt C);
  - i batteri sono ≈ 70 Gt C, di cui circa il 90 % nel sottosuolo profondo; gli archei ≈ 7 Gt C;
  - l'incertezza è ~10 volte per i batteri e ~13 volte per gli archei;
  - la fonte principale d'incertezza è il rapporto tra cellule attaccate e libere negli acquiferi profondi;
  - il microbioma del suolo e del sottosuolo, insieme, vale ≈ 100 Gt C.
- **Colwell e D'Hondt 2013** (RiMG 75, 547-574) è il censimento 3D di riferimento [V-abs, solo la scheda] ([URI](https://digitalcommons.uri.edu/gsofacpubs/1146)). Il PDF dell'MSA ha dato 404: i numeri non sono stati letti.

**Energia: LaRowe e Amend 2015** (Front. Microbiol. 6, 718) [V] ([PMC4502533](https://pmc.ncbi.nlm.nih.gov/articles/PMC4502533/)):
- formule:
  - `P_s = ΔG_r·r` (W cm⁻³; ΔG_r < 0 per le reazioni che cedono energia);
  - `ΔG_r = ΔG_r° + RT·ln Q_r`, con `Q_r = Π a_i^ν_i` e `a_i = m_i·γ_i`;
  - **`B = P_s/P_d`** (cellule cm⁻³). Se P_s < P_d·B, la popolazione cala.
- valori di P_d:
  - 49 fW per cellula, il minimo in letteratura per l'aerobio eterotrofo;
  - 19 aW, il minimo in letteratura in assoluto;
  - **190 zW**, il valore che riproduce le conte di U1370;
  - 50–3500 zW per cellula a U1370, la maggior parte sotto ~300 zW secondo l'abstract (sotto 500 secondo i Risultati: incoerenza interna);
  - **~1 zW**, il minimo assoluto per non decadere.
- P_s va da 1,6·10⁻¹² W cm⁻³ vicino al fondale a ~3,3·10⁻¹⁶ a 68 m sotto il fondale.
- Reazioni considerate: l'ossidazione aerobica del POC (ΔG_r = −13 310 kJ per mol di POC); l'acetato (−903 kJ); acetato più solfato (−70,4 kJ/mol). Sono citati anche il knallgas, cioè l'H₂ della radiolisi, e l'ossidazione di Fe²⁺ e Mn²⁺.

**Nel codice** [L `reazioni.js:480-500`]:
- radiolisi: `H₂ = A·ρ_r·(1−φ)·w_acqua/(100 eV)·G_H₂`, con G_H₂ = 0,45, dove A è il calore radiogenico di U, Th e K all'età del pianeta;
- serpentinizzazione: `k(T) = k₃₀₀·e^(−E_a/R·(1/T−1/573))` per il ferro della roccia;
- l'H₂ accumulato nel tempo di residenza; la CO₂ da Henry o dal mare;
- T = T_s + (q/k)·z;
- c'è `flussi: { ricambio: 1/residenza }`, ma **nessun consumatore**.

### Inferences

**(b, c) Microbi dall'energia: algoritmo compatto per una finestra di pori a profondità z [I]**
1. **Donatori**: H₂ (radiolisi e serpentinizzazione, già nel codice), CH₄, carbonio organico (sepolto dal suolo e dai sedimenti: la sez. 3 dà il flusso), Fe²⁺ e H₂S dai minerali.
2. **Accettori**:
   - O₂ portato dalla ricarica, solo vicino alla superficie: la concentrazione di saturazione all'equilibrio con l'aria del pianeta per Henry, consumata lungo il percorso;
   - NO₃⁻ se l'aria ha N e c'è vita;
   - Fe(III) dei minerali ossidati: `ossidato` di `geologia.js:134` va sostituito con la fugacità dell'ossigeno;
   - SO₄²⁻ dal mare o dai solfati;
   - CO₂ (metanogenesi e acetogenesi).
3. Per ogni coppia: `ΔG_r(T, a_i) = ΔG°(T) + RT·ln Q`. `ΔG°(T)` viene dalla stessa tavola di `logK` che `suolo.js:523` e `reazioni.js` già usano [L]. Si tiene la coppia solo se `−ΔG_r > ΔG_min`, il «quanto biologico» di circa 10–20 kJ/mol [R: Hoehler 2004; Schink 1997].
4. **Ritmo r**, preso come il minimo tra:
   - il ritmo di produzione (radiolisi, serpentinizzazione, decadimento dell'organico);
   - il rifornimento per trasporto, (concentrazione in ingresso)/τ_residenza;
   - la diffusione nei pori, D_eff/ℓ².
   Così la vita è limitata dal trasporto, come a U1370.
5. `P_s = Σ (−ΔG_r)·r`, e **`B = P_s/P_d(T)`**. P_d(T) segue Arrhenius: Tijhuis e altri 1993 danno la potenza di mantenimento con E_a ≈ 69 kJ/mol [R]. Si tara il prefattore su 190 zW a 2 °C [V per il 190; R per la forma in T]. B = 0 sopra **122 °C**, il limite misurato con *Methanopyrus kandleri* (Takai 2008 [R]). Questo limite è una misura, non una legge derivata: va dichiarato.
6. **Ritorno al padre**: ciò che le cellule consumano (H₂, O₂, SO₄) e producono (CH₄, HS⁻, HCO₃⁻, Fe²⁺) per unità di tempo, `r·ν_i`. Con il ricambio in ingresso, la concentrazione di H₂ scende fino a ΔG_r ≈ −ΔG_min: lo **stato stazionario energetico** che la geochimica osserva. La chimica della finestra chiude: `ingresso − consumo − uscita = 0` per ogni specie.
7. **Errore noto**: il rapporto tra cellule attaccate e libere incide di circa 10 volte (Bar-On) [V]. P_d varia di quattro ordini di grandezza tra laboratorio e sedimenti [V]: va dichiarato come incertezza dominante.
8. **Verifica globale**: si integra B sulla colonna continentale a 4 km con il calore e la litologia di quel pianeta, e lo si confronta con 2–6·10²⁹ cellule continentali sulla Terra di prova [V per il bersaglio].

**(d) Bilanci della colonna [I]**
- Dal padre: ricarica (m/anno), T(z), φ(z), k(z), minerali, U, Th e K, età, pCO₂, chimica del mare.
- **Acqua**: `ricarica = Σ_strati scarico laterale + scarico profondo` (la partizione di Dupuit esiste già).
- **Soluti**: ciò che i pori sciolgono in τ esce con lo scarico. È la parte «profonda» del flusso di soluti verso i fiumi e il mare.
- **Carbonio**: la CO₂ fissata dagli autotrofi (metanogeni e acetogeni) meno quella prodotta dagli eterotrofi. Il CH₄ che risale va all'aria (`risalita.js`, i flussi).
- **Calore**: trascurabile.

**Che cosa mostrare [I, numeri da B]:**
- Con B = 10⁴–10⁸ cellule/cm³, la distanza media tra cellule è `B^(−1/3)`: da ~460 µm a ~2 µm.
- Nella finestra da 1 mm a 10 µm le cellule vanno disegnate come bastoncelli di ~1 µm, in quel numero, attaccate alle pareti dei pori, la frazione attaccata essendo un parametro dichiarato.
- Dove B < 1 per finestra, si scrive «prossima cellula: X µm», come il rapporto *Navigazione* propone per il vuoto [V-prec].

### Gaps
- I numeri di Colwell e D'Hondt 2013 (PDF 404) non sono stati letti: mancano la regressione cellule-profondità per i sedimenti marini e i conteggi continentali.
- Il testo completo di Magnabosco 2018 non è stato letto: mancano la legge di calo con la profondità e il ruolo esatto del limite di temperatura.
- Warr 2018 non è stato trovato.
- La forma P_d(T) di Tijhuis 1993, ΔG_min di Hoehler e Schink e il limite dei 122 °C di Takai 2008 sono [R].
- Non è stata trovata una fonte che riconcili `k ∝ exp(−3z/L)` del codice con la legge di potenza di Manning e Ingebritsen.

---

## 5. La resa: che cosa fanno i motori del terreno per avere il dettaglio giusto a ogni distanza, come evitare le scale vuote; i due difetti visibili; il vocabolario per scala da 1000 km a 1 mm

### Takeaway
I due difetti hanno cause probabili nel codice.
- **Il vuoto tra 1 e 500 km.** Sulla mappa 2D si disegnano solo i livelli da L_max − 2 a L_max, senza ripiego sulla radice. Le tessere si calcolano **sul filo principale, una per fotogramma, con l'erosione dentro**.
- **L'omogeneità da vicino.** Ci sono 4 riflettanze uguali per tutti i pianeti, il rilievo sotto la madre è rumore, e il suolo ha un solo colore per cella.

La prassi di Cesium, Proland, Outerra e dei clipmap è sempre la stessa:
- un errore sullo schermo decide il livello;
- **si mostra sempre l'antenato più fine già pronto**;
- il fine si calcola altrove e si sfuma;
- sotto il pixel il dettaglio passa nella BRDF, con la varianza delle pendenze.

### Cited Findings
- **Cesium.** Il client combina l'errore geometrico della tessera con la distanza e la risoluzione dello schermo, per stimare l'errore in pixel che commetterebbe disegnando la tessera senza i figli. Si raffina oltre `maximumScreenSpaceError` (16 per difetto). I figli hanno errore minore, le foglie circa 0 [V] ([CesiumJS](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html?classFilter=3Dtiles); [forum, geometric error](https://community.cesium.com/t/understanding-geometric-error/8480)).
- **Proland** (Bruneton e Neyret 2008, CGF 27(2), 311): quota, aspetto e dati vettoriali in un quadtree sulla GPU, con resa ed editing in tempo reale [V-abs] ([EG](https://diglib.eg.org/items/6c9ac337-23f9-4d26-a584-201cc7fc3e3d)). Licenza **GPLv3 più commerciale** (2010) [V-abs]. Le tessere prodotte al volo dai «producer», con le «residue» aggiunte al padre suddiviso, sono ricordate [R].
- **Outerra** calcola le pendenze filtrate separatamente su ciascun asse [S, dal rapporto *Navigazione*].
- Il rapporto *Navigazione* ha già verificato [V-prec]:
  - le dissolvenze per intervallo, non per soglia (Gaia Sky);
  - la conservazione della varianza delle pendenze quando una banda smette di essere geometria (Atlas, LEADR);
  - Crest, che interpola sempre tra due livelli.
- CDLOD (Strugar 2009), i clipmap (Tanner 1998), il virtual texturing e la «World Partition» di Unreal, che carica una griglia di celle in base alla distanza, sono ricordati [R]: non verificati in questa sessione.
- **Nel codice 2D** [L `mappa.js:572`, `581-598`]:
  - `livelloTessere(z) = floor(log₄(z/420))`, con L_max = 7;
  - il ciclo va da `max(0, L_max − 2)` a L_max;
  - `if (nuove >= 1 && L > 0) continue`: una sola tessera nuova per fotogramma;
  - `tessera(...)`, che contiene `erosione(...)`, è chiamata **in modo sincrono** dentro `disegnaSuperficie`;
  - tessere in memoria: al più 60 (`mappa.js:594`).
- **Nel codice 3D** [L `pianeta.js:779-786`]:
  - si chiede «la prima che manca scendendo da quella che c'è», cioè un livello per volta;
  - si disegna la tessera più fine pronta («si vede il grosso finché il fine non arriva», `pianeta.js:10`);
  - LMAX = 7 (`pianeta.js:56`), `puntiPerPixel` = 2,6 (`pianeta.js:503`);
  - il rilievo fine del suolo entra solo come luce e non sposta i vertici (dichiarato, `pianeta.js:30-32`).

### Inferences

**Diagnosi del vuoto tra 1 e 500 km (da verificare con una prova strumentata) [I]**
- Con uno schermo largo 1000 px e la Terra (40 000 km), una larghezza visibile di 500 km dà z ≈ 8·10⁴ px per giro. Da qui L_max = floor(log₄ 190) = 3, e il ciclo disegna L1–L3. **La radice L0 non è disegnata.**
- Se le tessere L1 di quella zona non sono ancora calcolate, e se ne calcola una per fotogramma, ciascuna con 26 passi d'erosione sul filo principale, lo schermo resta vuoto. Si riempie solo dopo molti fotogrammi, e il ciclo si ripete a ogni livello nuovo fino a 1 km (L5–L6).
- Sotto ~5 km si passa al 3D o alla roccia, che hanno ripieghi: questo spiega il confine «1–500 km».
- Correzione:
  1. disegnare sempre la catena degli antenati, fino a L0, sotto i livelli fini (pittore dal grosso al fine);
  2. spostare `tessera()` in un worker: `tessere.worker.js` lo fa già per il 3D, e la mappa può riusarlo;
  3. chiedere in anticipo gli antenati di tutte le tessere visibili e i figli nella direzione dello zoom (`cam.verso` esiste);
  4. se l'amplificazione diventa l'equilibrio χ (sez. 1), il costo per tessera scende da 26 passi a una passata.
- Nel 3D la catena «un livello per volta» richiede L viaggi di andata e ritorno in fila. Conviene chiedere in una volta tutti gli antenati mancanti.

**Contro l'omogeneità: che cosa deve variare e con quale legge [I]**
- La riflettanza della tessera deve venire dal suolo (sez. 3: ossidi, carbonio, umidità, sale, neve), non da 4 costanti. Si calcola nel worker dai campi che la tessera ha già: litologia, area drenata (per TWI), curvatura, T, pioggia, età.
- Il rilievo tra 156 km e 10 m deve venire dall'amplificazione dal processo (sez. 1), non dal rumore.
- La pendenza sotto il pixel (sez. 2) va passata alla BRDF come varianza, perché la ruvidità si veda anche da lontano.
- I mondi d'acqua da vicino sono omogenei per fisica. Il vocabolario lì è:
  - onde a cascate, schiuma (Monahan), creste bianche;
  - riflesso del sole allargato da Cox e Munk;
  - strie di Langmuir lungo il vento e chiazze calme dove i film tensioattivi smorzano le capillari [R].
  - I primi due sono già nel codice [L `finestra.js:323-338`].

**(e) Vocabolario visivo per scala** (larghezza dello schermo; le forme e il processo che le fa nascere) [I con numeri R dove indicato; per ognuna, il modulo che lo produrrebbe]

| Larghezza | Che cosa si vede in un paesaggio vero | Processo che lo genera | Modulo |
|---|---|---|---|
| 1000–300 km | Margini dei continenti, catene montuose, grandi bacini con il fiume principale (ordini di Strahler 7–10), delta, calotte, mari di sabbia (erg), province vulcaniche, grandi crateri | Placche, isostasia, fasce di clima, flussi di ghiaccio | `tettonica`, `geologia.erosione`, `meteo`, Hergarten |
| 300–30 km | Reti di valli: dendritiche su roccia uniforme, a traliccio sulle pieghe, radiali sui vulcani. Spaziatura delle valli che esce dal fronte delle catene a passo quasi regolare (Hovius 1996 [R]). Conoidi ai piedi delle catene, valli glaciali e circhi, laghi in catena, capi e promontori cuspidati (Ashton), cordoni litorali, draa | Stream power con U e K; glaciale; onde oblique; dune composte | §1 |
| 30–3 km | Valli singole e la transizione versante-canale, meandri (lunghezza d'onda ≈ 10–14 volte la larghezza dell'alveo [R, Leopold e Wolman]), terrazzi, nicchie di frana, morene, drumlin, esker, dune lineari e stellate (0,5–3 km), frecce litorali, doline, colate laviche, saline | Pendio critico e frane come eventi; ghiaccio; Werner con vento variabile; dissoluzione | §1, §3 |
| 3 km–300 m | Lunghezza dei versanti (ℓ_c ~ 100 m sulla Terra [V Perron 2009 per il concetto]), canali di primo ordine, calanchi, creste, **mosaico di suoli e piante legato all'esposizione e all'umidità (catena)**, barcane (≥ L_sat, ~ decine o centinaia di m [R]), pareti di roccia, coni di detrito, spiagge e berme, barre fluviali | Diffusione con S_c, TWI, Werner, Shields | §1, §3 |
| 300–30 m | Affioramenti a bancate (spaziatura dei giunti ~ spessore dello strato [R]), campi di massi, poligoni di cuneo di ghiaccio (10–30 m [R]) sui mondi freddi, poligoni di essiccamento nelle saline, chiome se c'è vita, macchie di colore del suolo (gley o rosso) | Fratture (`rocce.fratture`, `suolo.fratture`), gelo e disgelo, catena | §3, `rocce.js` |
| 30–3 m | Massi, cerchi selezionati (1–3 m: Kessler e Werner 2003 [R]), rigagnoli, barre di ghiaia, cuspidi di spiaggia, giunti della roccia | Gelo e disgelo con selezione dei grani; flussi d'acqua sottili; onde | — |
| 3 m–30 cm | Ciottoli, crepe di fango (cm–dm), aggregati del suolo e superfici dei peds, superfici di frattura, licheni e croste biologiche (se c'è vita), pavimenti desertici | Ritiro per essiccamento (`rocce.fratture` esiste); deflazione del fine da parte del vento | `rocce.js`, §3 |
| 30–3 cm | Increspature eoliche (~10 cm sulla Terra; quelle grandi di Marte ~1–3 m [R]), increspature di corrente (10–20 cm [R]), croste di sale a poligoni, ghiaia fine, grumi di suolo | Saltazione (Bagnold, con ρ_f e g del pianeta); Shields | `suolo.granelli`, §1 |
| 3 cm–1 mm | Granelli di sabbia (0,0625–2 mm), granuli, cristalli della roccia (mm–cm nel granito), brina, vernice del deserto come velo scuro, pori e film d'acqua | Già nel codice: granulometria di alterazione, impaccamento, capillarità (`suolo.js:32-60`) | `suolo.js` |

Regola per non lasciare scale vuote [I]:
- Ogni riga deve avere almeno un processo attivo nel pianeta.
- Se il processo manca (niente vento, niente acqua, niente vita), la scala mostra ciò che c'è davvero: crateri e regolite da giardinaggio d'impatti sui mondi senz'aria, ghiaccio e crepe termiche sui mondi freddi. Non una texture inventata.
- Il passaggio da una riga all'altra segue l'errore sullo schermo (16 px alla Cesium, o i 2,6 punti per pixel del codice), con una dissolvenza su ~1,5 decadi e la varianza conservata [V-prec].

### Gaps
- La diagnosi del vuoto tra 1 e 500 km è un'inferenza dalla lettura del codice: va misurata con una prova (tempi di `tessera()` per livello, fotogrammi senza tessere).
- Proland («producer», tessere residue), CDLOD, i clipmap, il virtual texturing, Unreal World Partition e Outerra non sono stati verificati in questa sessione: solo [R], o [S] dal rapporto precedente.
- I numeri del vocabolario per scala sono quasi tutti [R]: Hovius, Leopold e Wolman, Kessler e Werner, le increspature, i poligoni di ghiaccio, L_sat. Vanno verificati prima di usarli come prove.
