# Verifiche a fondo: cellula, tecnica, comportamento/cultura (2026-11)

Verifica delle voci marcate [Va], [S], [R] e dei conflitti dichiarati in `dal_nulla_alla_cellula.md`, `fuoco_metalli_civilta.md`, `comportamento_intenzioni_cultura.md`. Non è nuova ricerca: ogni riga dice che cosa c'era, che cosa è stato **letto per intero** adesso, e che cosa cambia per le regole.

**Esiti usati.** *Confermata* = letta la fonte primaria (o, dove indicato, una fonte aperta degli stessi autori) e il valore torna. *Corretta* = il valore o la spiegazione nelle note era sbagliato o impreciso: corretto nel file, con «era …». *Aperta* = la letteratura è divisa: riportati i valori e che cosa li distingue. *Non raggiunta* = testo integrale non ottenuto per vie lecite e aperte; la marca nelle note è rimasta com'era.

**Come sono state lette le fonti.** Europe PMC (fullTextXML) e pagine di PubMed Central con un client dichiarato e richieste distanziate; depositi istituzionali (UCL, Birkbeck); rapporti NASA (NTRS), USGS, U.S. Bureau of Mines (OSTI), NIST; arXiv; file grezzi dei repository per le licenze. Nessun sito pirata, nessun dato personale inviato. Dove un sito ha risposto con una verifica anti-robot (PDF delle scansioni su PMC, deposito dell'Università di Monaco, PhilPapers) non è stata aggirata: l'esito è «non raggiunta».

**Conti di riscontro** (script in `/tmp/claude-0/-home-user/e4f7d681-8c14-51b2-bfef-3d2a580b715c/scratchpad/verifica_4/calc/`): `ell_check.py` (Ellingham da JANAF riscaricato e da Robie e Hemingway), `redox.py` (torre redox da ΔG°f), `calcite.py` (calcinazione, arrostimento della pirite).

**Limite dichiarato.** Le tre note contengono circa 290 voci non verificate. Ne ho esaminate 80 (più 31 guardate senza esito, elencate per trasparenza), scelte per priorità: tutti i conflitti segnalati, poi coefficienti e soglie che entrano in una regola, poi le licenze, poi una parte del resto. Le voci [R] e [S] non elencate qui **non sono state toccate** e restano da verificare (soprattutto: temperature di ceramica e vetro §2, punti di fusione e durezze §3.2, elenco dei processi minerari §4.2, tempi di carbone e petrolio §4.3, datazioni §8 nella nota sulla tecnica; gran parte delle equazioni classiche nella nota sul comportamento). `fisiologia_piante_ecosistemi.md` non è stato verificato (vedi in fondo).

---

## A. Tecnica (`fuoco_metalli_civilta.md`)

| # | Voce | Com'era | Esito | Fonte letta | Che cosa cambia per le regole |
|---|---|---|---|---|---|
| A1 | Soglia inferiore di O₂ per il fuoco: 13% (Scott e Glasspool) contro 15–16% (Belcher) | conflitto implicito, quattro soglie elencate | **Corretta** (aggiunta la scelta) | [Belcher e altri 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3012516), [Scott e Glasspool 2006](https://pmc.ncbi.nlm.nih.gov/articles/PMC1544139/), riletti | Il 13% non è una misura di Scott e Glasspool ma un valore ripreso da lavori precedenti; Belcher misura su torba: nessun fronte autosostenuto a 13 e 15%, combustione per oltre un'ora a 17%. `puoBruciare`: 16% a 1 bar; attività piena da 18,5%; 13% solo come minimo assoluto per combustibile secchissimo |
| A2 | Dipendenza della soglia dalla pressione totale | «non ho trovato una legge; letteratura antincendio non aperta» | **Corretta** (lacuna colmata in parte) | [Hirsch, Williams e Beeson, NTRS 20070005041](https://ntrs.nasa.gov/api/citations/20070005041/downloads/20070005041.pdf); [Harper e altri, NTRS 20160004937](https://ntrs.nasa.gov/api/citations/20160004937/downloads/20160004937.pdf); [Hirsch e altri, NTRS 20100028155](https://ntrs.nasa.gov/api/citations/20100028155/downloads/20100028155.pdf) | Polietilene: soglia 18 / 18 / 17% di O₂ a 48 / 85 / 101 kPa; la pressione parziale di soglia quasi si dimezza. Sopra ~41 kPa conta la **frazione** di O₂, non la pressione parziale. Regola: `x_min(P) ≈ x_min(1 bar)·(P/1 bar)^(−0,1…−0,4)` per P ≳ 0,4 bar. Vale per polimeri: per biomassa umida resta aperta |
| A3 | Dipendenza dal gas inerte | non trattata | **Confermata** (nuova voce) | [Zabetakis 1965, Bureau of Mines Bull. 627](https://www.osti.gov/servlets/purl/7328370) | Inerte minimo per spegnere: ~42% di N₂ contro ~28% di CO₂, in rapporto inverso ai calori specifici. La zavorra termica scala col calore specifico molare del diluente: è già la forma della stima adiabatica del §1.3 |
| A4 | Concentrazione limite di O₂ per idrocarburi, 10–12% | [R] | **Confermata** | stessa fonte; conto | ≈12% con N₂, ≈14,5% con CO₂ |
| A5 | Belcher e McElwain 2008: limite da 12 a 15% | [S] | **Non raggiunta** (Science chiuso); confermata solo per citazione degli stessi autori | Belcher e altri 2010 | Nessuna: resta [S] con nota |
| A6 | Barnham, accensione del fuoco a ~400 000 anni | [S] | **Confermata** | [Davis e altri 2025, manoscritto accettato, UCL](https://discovery.ucl.ac.uk/id/eprint/10219125/1/Davis%20et%20al%202025%20Earliest%20evidence%20of%20making%20fire%20Nature%20AAM.pdf) | Accensione provata a 0,4 Ma; il primato precedente era ~50 ka. Uso → produzione: ~600 000 anni di scarto |
| A7 | ΔfH della pirite −178 kJ/mol; arrostimento −828 kJ/mol | [R] | **Corretta** (lieve) | [Robie e Hemingway 1995, USGS Bull. 2131](https://pubs.usgs.gov/bul/2131/report.pdf) | −171,5 kJ/mol → −835 kJ/mol. Irrilevante per la regola |
| A8 | Calcinazione del calcare a 1 bar di CO₂: 895–900 °C | [R] | **Confermata** | stessa fonte; `calcite.py` | 888 °C per interpolazione (ΔH₂₉₈ = 178,8 kJ/mol). La stima a ΔH, ΔS costanti di `chimica.js` (844 °C) è 45 °C bassa: usare i ΔG tabulati |
| A9 | Robie e Hemingway come fonte aperta di ΔG(T) | [R], non aperto | **Confermata** | stessa fonte | PDF estraibile come testo; tabelle ogni 100 K; dominio pubblico: è la fonte ridistribuibile |
| A10 | Ellingham: incroci col carbonio da JANAF (Cu₂O, PbO, ossidi di ferro, SiO₂, TiO₂, MgO, Al₂O₃, CaO) | [C] da ricontrollare | **Confermata** | [NIST‑JANAF](https://janaf.nist.gov/) riscaricato; `ell_check.py`; Robie e Hemingway | Riprodotti al grado: 89, 301, 651–771, 1668, 1765, 1846, 2036, 2150 °C. Secondo riferimento: Cu₂O 89, PbO 299, wüstite 718–721 °C |
| A11 | Riga dello stagno: −363 / −319 / −275 / −231 kJ; incrocio 635 °C; CO/CO₂ 0,19 / 0,15 / 0,13; log pO₂ −13,9 | stima con ΔH, ΔS costanti e dati [R] | **Corretta** | Robie e Hemingway (cassiterite) | −367 / −326 / −285 kJ; retta −572 + 0,205·T; incrocio ≈640 °C; CO/CO₂ 0,24 / 0,21 / 0,20; log pO₂ −14,2. Lo stagno chiede un gas un po' più riducente di quanto scritto |
| A12 | Riga dello zinco: −493 / −445 / −361 / −278 kJ; incrocio 945 °C; CO/CO₂ 460 / 84 / 5,4 | idem | **Corretta** | Robie e Hemingway (zincite) | −495 / −448 / −367 / −286 / −207 kJ; rette −712 + 0,217·T e −931 + 0,403·T; incrocio ≈950 °C; CO/CO₂ 530 / 100 / 6,8; log pO₂ −19,5 |
| A13 | Equilibrio di Boudouard (frazione di CO) | [V] da ricontrollare | **Confermata** | JANAF; `ell_check.py` | 1,6 / 9,5 / 34 / 71 / 92 / 98% a 427…927 °C |
| A14 | Licenza dei dati NIST‑JANAF e WebBook | «non letta» | **Corretta** (lacuna colmata) | [NIST, licenze](https://www.nist.gov/open/license); [JANAF = SRD 13](https://janaf.nist.gov/) | I dati standard di riferimento sono protetti (15 U.S.C. § 290e, «All rights reserved»). Non ridistribuire le tabelle; usare valori citati e coefficienti propri, oppure le tabelle USGS |
| A15 | Carbone per kg di ferro nei bassofuochi | [S]: 5–11 kg/kg da quattro coppie | **Corretta** | [Wareham Forge, serie 2008](https://warehamforge.ca/ironsmelting/smelt/smelt08/index.html); [Jack 2025, Hist. Metall. 55(2):98](https://doi.org/10.54841/hm.682) | **7–18 kg di carbone per kg di massello** (le quattro coppie citate non sono nella pagina). Rendimento termico 1,5–3,5% |
| A16 | Legna per kg di ferro; ettari per tonnellata | 30–50 kg; 10–25 ha per t l'anno | **Corretta** | Jack 2025 (riporta Pleiner 2000 e Oaks 2018) | 63–150 kg di legna per kg di ferro; **~15–75 ha di ceduo per t di ferro l'anno**. L'incremento del ceduo (2–4 t/ha l'anno) resta [R] |
| A17 | Combustibile per kg di rame | «nessuna cifra trovata» | **Corretta** (lacuna colmata) | [Cavanagh e altri 2022, Sci. Rep.](https://pmc.ncbi.nlm.nih.gov/articles/PMC9492654/) | ~10 t di legna per t di rame (stime fino a 80); 30 000 t per Timna nell'età del ferro. Il rame costa un ordine di grandezza meno del ferro |
| A18 | Stagno: abbondanza crostale e fattore di arricchimento | [R]: 2 ppm; 0,2–1%; fattore 1000–5000 | **Corretta** | [USGS Prof. Paper 1802‑S](https://pubs.usgs.gov/pp/1802/s/pp1802s.pdf) | Crosta totale 2,5 ppm, superiore 5,5, inferiore 1,5; tenori 0,1–1%; fattore ≈400–6000 secondo la crosta di riferimento |
| A19 | Uluburun: 10 t di rame, 1 t di stagno | [S] | **Confermata** (rapporto corretto) | [Powell e altri 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9710885) | Rapporto usuale 9:1, non 10:1 |
| A20 | Von Foerster 1960: t₀ = 2026,87, k = 0,99, a₀ = 5,5·10⁻¹² | [S] per t₀; equazioni da rassegna | **Confermata** | [von Foerster, Mora e Amiot 1960, copia didattica](https://mozart.bioinfo.rpi.edu/bystrc/courses/biol4961/Doomsday.pdf) | t₀ = 2026,87 ± 5,50; K = (1,79 ± 0,14)·10¹¹; k = 0,990 ± 0,009. Riscontro: N(1960) = 2,8·10⁹ |
| A21 | Taglia critica di comunità del morbillo | [S] | **Confermata** (in parte) | [Conlan e altri 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2842776) | 250 000–300 000 (Inghilterra e Galles); oltre 500 000 nelle isole; modelli semplici oltre il milione. Il «250–400 mila su 60 città» non è in questa fonte: resta [R] |
| A22 | Tabella di Heinrich e Candela (fattori di arricchimento) | [V] | non riesaminata oltre lo stagno | — | — |
| A23 | Bettencourt 2007 (esponenti urbani), Turchin 2013 (65%), Tallavaara 2018, Richerson 2001 | [V] | non riesaminate: già lette per intero dal primo ricercatore | — | — |
| A24 | Kremer 1993 | scansione senza testo | **Non raggiunta** | provati OpenAlex e Semantic Scholar: nessuna copia con testo | Le due ipotesi restano da rassegna |
| A25 | Cook 1971, energia pro capite per stadio; cifre di Smil | [R]/[S] | **Non raggiunta** | la lettura di Purdue non ha risposto | Le cifre per stadio restano ricordate: non usarle come soglie |
| A26 | Rese agricole in kcal/ha | [R] | **Non raggiunta** | provati tre insiemi di dati di Our World in Data: non contengono serie storiche | Restano [R] |
| A27 | Date del ferro in Cina ed Europa, zinco in India | [R] | **Non raggiunta** | Killick e Fenn, Tylecote chiusi; nessuna rassegna aperta trovata in Europe PMC | Restano [R] |
| A28 | Ferro in Africa subsahariana | [S] | **Non raggiunta** | un articolo aperto sul Senegal non dà la data d'origine | Resta [S]; la questione dell'origine indipendente resta aperta |
| A29 | Origine supergena dei minerali antichi; elenco dei processi (Robb) | [R] | **Non raggiunta** | il rapporto USGS sullo stagno non la tratta | Resta [R] |
| A30 | Densità dei cacciatori-raccoglitori (Binford) | [V, C] | non riesaminata | — | — |

## B. Cellula (`dal_nulla_alla_cellula.md`)

| # | Voce | Com'era | Esito | Fonte letta | Che cosa cambia per le regole |
|---|---|---|---|---|---|
| B1 | Vescicole in acqua di mare: Milshteyn contro Jordan | «in conflitto: la differenza è la complessità della miscela» | **Corretta** (conflitto risolto) | [Jordan e altri 2019, manoscritto accettato](https://eprints.bbk.ac.uk/id/eprint/29841/1/Jordan%20Lane%20Nat%20Ecol%20Evol%20accepted%20MS%202019.pdf); [Milshteyn e altri 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6027054/) | Le due fonti concordano a pH marino: niente vescicole a pH 7–9 con Mg²⁺ ≳ 20 o Ca²⁺ ≳ 5 mmol/L. Jordan le ottiene solo a pH 11–12 e, con la miscela salina completa a 70 °C, solo aggiungendo isoprenoidi. Variabile che decide: **pH ≥ ~11 più miscela complessa** |
| B2 | Emivita del legame del DNA: 0,2 (Ross e Deamer) contro 31 milioni di anni (Schroeder) | «la differenza sta nelle altre vie di rottura (depurinazione)» | **Corretta** (spiegazione sbagliata) | [Ross e Deamer 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5041004/), tab. 1 e nota b; [Schroeder e altri 2006](https://pmc.ncbi.nlm.nih.gov/articles/PMC1449644/) | 0,2 Ma viene dai dati sul dimetilfosfato (Wolfenden e Snider 2001), che si idrolizza per il 99% con rottura C–O: non è un modello del DNA. **Adottare 7·10⁻¹⁶ s⁻¹, 31 Ma a 25 °C** per l'attacco al fosforo. La depurinazione è un pozzo distinto e più rapido, da tenere separato |
| B3 | LUCA: 355 famiglie (Weiss) contro ~2600 proteine (Moody) | «conflitto dichiarato» | **Corretta** (conflitto in buona parte apparente) | [Moody e altri 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11383801/); [Weiss e altri 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6095482/) | 355 (Weiss) e 399 KO (Moody, probabilità ≥ 0,75) sono famiglie identificabili; 2657 (2451–2855) proteine e 2,75 Mb (2,49–2,99) sono la taglia stimata. Regola: LUCA ≈ procariote di 2,5–3 Mb, ~350–400 famiglie nominabili |
| B4 | Fisiologia di LUCA dal riassunto di Weiss 2016 | [R] | **Confermata** su Weiss 2018; Weiss 2016 **non raggiunta** | Weiss e altri 2018 | Copia Zenodo del 2016 rimossa. Anaerobio, H₂, acetil-CoA, N₂, termofilo: confermati |
| B5 | Età di LUCA 4,2 Ga (4,09–4,33) contro > 3,9 Ga | [V] entrambe | **Confermata** | Moody 2024; [Betts e altri 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6152910/) | Nessuna: i due valori sono compatibili |
| B6 | Date di LECA e dei mitocondri | «divergono di centinaia di milioni di anni» | **Aperta nella letteratura** | [Strassert 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7994803/); [Mahendrarajah 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10656485/); Betts 2018; [Kay e altri 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12872463/) | LECA 2,39–1,96 / 1,93–1,84 / < 1,84 / 1,80–1,67 Ga; mitocondrio ~2,2 Ga (Kay) o 2,05–1,21 (Betts). Li distinguono calibrazioni e radice. Usare LECA = 1,9 ± 0,3 Ga come intervallo, non una data |
| B7 | Energia per gene: «200 000 volte» (Lane e Martin) | [Va]; nel riepilogo «200 000 volte più energia per gene» | **Corretta** (precisata); Lane e Martin 2010 **non raggiunta** | [Lane 2011, Biology Direct](https://pmc.ncbi.nlm.nih.gov/articles/PMC3152533/) | Per cellule medie: 0,1 contro ~115 fW per gene, cioè ~1200 volte. 200 000 è l'espansione del genoma possibile «in linea di principio» |
| B8 | Lane e Martin contro Lynch e Marinov | contestato | **Aperta nella letteratura** | [Lynch e Marinov 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4697398/), Lane 2011 | Resta la proposta della nota: esporre entrambe le letture. Le lettere di replica non sono state lette |
| B9 | Bistabilità dell'ossigeno (Goldblatt 2006): < 10⁻⁵ e > 5·10⁻³ del livello attuale | [Va] | **Non raggiunta** (Nature chiuso); bistabilità **confermata** su fonti indipendenti; soglie **aperte** | [Horne e altri 2025, Phil. Trans. R. Soc. B](https://pmc.ncbi.nlm.nih.gov/articles/PMC12329441/); [Wogan e altri 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9477391/) | Gregory e altri 2021: stati solo sotto 6·10⁻⁷ e sopra 2·10⁻³ di rapporto di mescolamento (≈ 3·10⁻⁶ e 10⁻² del livello attuale). Interruttore sì; soglie incerte di mezzo ordine di grandezza; attenzione alle unità |
| B10 | Torre redox di Thauer 1977 | [R] | **Non raggiunta** (scansione senza testo); valori **confermati per ricalcolo** | `redox.py` | Tutti i potenziali riprodotti entro 8 mV da ΔG°f. **Corretta** la voce del ferro: Fe(OH)₃/Fe²⁺ ≈ 0 V vale a Fe²⁺ ≈ 10⁻⁵ mol/L; a 1 mol/L ≈ −0,3 V. Per ferro e manganese calcolare con la concentrazione del luogo |
| B11 | Genoma minimo: ripartizione dei 473 geni di syn3.0 (195 / 34 / 84 / 81 / 79) | [R] | **Non raggiunta** | Hutchison 2016 chiuso; in Europe PMC nessun articolo aperto la riporta | Restano [V] solo 531 kb e 473 geni (da Breuer 2019) |
| B12 | Rese passo per passo di Powner 2009 e Becker 2019 | [R], non riportate | **Non raggiunta** | Powner chiuso; deposito di Monaco per Becker dietro verifica anti-robot | Nessuna resa utilizzabile |
| B13 | Soglia UV di Rimmer 2018 | [V] | non riesaminata: già letta per intero | — | — |
| B14 | Licenza di VULCAN | GPL‑3 [R] | **Confermata** | README e `vulcan.py` del repository | GPL‑3: copyleft, non copiabile; riscrivere le formule |
| B15 | Licenza di PHREEQC | «dominio pubblico [R]» | **Corretta** | `doc/NOTICE.TXT` del repository | Avviso d'uso USGS: libero, con obbligo di allegare l'avviso e segnalare le modifiche |
| B16 | Licenza di COPSE | non verificata | **Confermata** (trovata) | file LICENSE di bjwmills/COPSE | Apache‑2.0 |
| B17 | Licenza di Atmos | non verificata | **Non raggiunta** | nessun file di licenza alla radice, README senza menzione | Senza licenza esplicita non è riusabile |
| B18 | Licenza di Lattice Microbes / Minimal_Cell | non verificata | **Non raggiunta** | README di Minimal_Cell senza licenza; Lattice Microbes non trovato | idem |
| B19 | Takai 2008: 116 °C a 0,4 MPa → 122 °C a 20 MPa | [Va] | **Confermata** | [PMC2490668](https://pmc.ncbi.nlm.nih.gov/articles/PMC2490668/) | — |
| B20 | Sanjuán 2010: tassi di mutazione virali | [Va] | **Confermata** | [PMC2937809](https://pmc.ncbi.nlm.nih.gov/articles/PMC2937809/) | Per i virus a RNA la correlazione con la taglia «richiede altre prove» |
| B21 | Lawrence e Ochman 1998: 755 geni, 547,8 kb, 234 eventi, 16 kb/Ma, 18% | [Va] | **Confermata** | [PMC21352](https://pmc.ncbi.nlm.nih.gov/articles/PMC21352/) | — |
| B22 | Gumsley 2017: Grande Ossidazione 2,460–2,426 Ga, fine ~2,060 | [Va] (due punti) | **Confermata** | [PMC5338422](https://pmc.ncbi.nlm.nih.gov/articles/PMC5338422/) | — |
| B23 | Zhu 2016: fossili di 30 × 8 cm a 1,56 Ga | [Va] (due punti) | **Confermata** | [PMC4873660](https://pmc.ncbi.nlm.nih.gov/articles/PMC4873660/) | — |
| B24 | Djokic 2017: sorgenti termali della Dresser, 3,48 Ga | [Va] in tabella | **Confermata** | [PMC5436104](https://pmc.ncbi.nlm.nih.gov/articles/PMC5436104/) | — |
| B25 | Mast 2013: ribozimi ≥ 200 nt, trappola termica | [Va] | **Confermata** | [PMC3657786](https://pmc.ncbi.nlm.nih.gov/articles/PMC3657786/) | Poro di 5 cm e ΔT = 10 K bastano per 200-meri (modello) |
| B26 | Adamala e Szostak 2013; Mansy 2008; Wolf e Koonin 2007 | [Va] | **Confermate** | PMC4104020; PMC2743009; PMC1894784 | — |
| B27 | Zandi 2004; Hagan e Chandler 2006 | [Va] | **Confermate** | PMC524849; PMC1479078 | — |
| B28 | Spang 2015; Ponce-Toledo 2017; Speijer 2015; Spiegel e Turner 2012 | [Va] | **Confermate** | PMC4444528; PMC5650054; PMC4517231; PMC3258618 | — |
| B29 | Xu 2020; Turk 2010; Purohit 2003 | [Va] | scaricate ma non controllate abbastanza: marca lasciata [Va] | — | — |
| B30 | Le altre voci [Va] senza copia in PMC (Miyakawa 2002, Higgs e Pudritz 2009, Ferris 1996, Rajamani 2008, Kreysing 2015, Viedma 2005, Hein 2011, Johnston 2001, Wochner 2011, Kun 2005, Matsumura 2016, Freeland e Hurst 1998, Hoehler e Jørgensen 2013, Stevenson 2017, Ceres e Zlotnick 2002, Smith 2001, Krupovic 2019, Kondrashov 1988, Sleep 1989, Pearce 2018, Zahnle 2020) | [Va] | **non esaminate** | — | Restano [Va] |

## C. Comportamento e cultura (`comportamento_intenzioni_cultura.md`)

| # | Voce | Com'era | Esito | Fonte letta | Che cosa cambia per le regole |
|---|---|---|---|---|---|
| C1 | Cervello al 66% del metabolismo a riposo nell'infanzia | [R], non riletto | **Confermata** | [Kuzawa e altri 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4246958/) | 66% (maschi) e 65% (femmine) del riposo a 4,2–4,4 anni; 43,3% e 43,8% del fabbisogno giornaliero. È glucosio equivalente |
| C2 | K_Ic della selce | [R]: «1–2 MPa·m^½, non verificato» | **Confermata** (con misura) | [Nickel e Schmidt 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9718382/), tab. 1 | Selce 1,71–1,85 MPa·m^½ (indentazione), E = 74,8 GPa, resistenza 189 MPa; 0,89 dopo 350 °C. Silcrete 1,7–1,85 → 1,2–1,3. G_c ≈ 42 J/m² |
| C3 | K_Ic dell'ossidiana 0,6–0,9 | [R] | **Non raggiunta** | Domanski 1994 chiuso; nessuna misura aperta trovata | Resta [R]: non usare come soglia |
| C4 | Equazione CTRNN di Beer 1995 | [R] | **Confermata** su Beer 2003; Beer 1995 **non raggiunta** | [Beer 2003](https://www.cs.swarthmore.edu/~meeden/DevelopmentalRobotics/beer03.pdf) | Stessa forma, con un guadagno g_j per neurone |
| C5 | Keller–Segel | [R] | **Confermata** su rassegna aperta; originale **non raggiunto** | [Painter 2019, arXiv:1806.08627](https://arxiv.org/abs/1806.08627) | — |
| C6 | Fitch e altri 2016 | [V] solo per i titoli | **Confermata** | [PMC5148209](https://pmc.ncbi.nlm.nih.gov/articles/PMC5148209/) via Europe PMC | Il limite è nel controllo neurale, non nell'anatomia periferica |
| C7 | Modello di Henrich 2004, N* | [V] | **Confermata** per ricalcolo | conto | N* = 83, 1674, 12 370 per α/β = 5, 8, 10 |
| C8 | Vaesen 2016 contro Henrich; Kline e Boyd 2010 | [V], contesa | **Aperta nella letteratura** | non rilette | La replica di Henrich e la controreplica non sono state lette |
| C9 | Lindenfors 2021: intervalli del numero di Dunbar | [V] | **Confermata** | [PMC8103230](https://pmc.ncbi.nlm.nih.gov/articles/PMC8103230/) | Intervalli 3,8–520 e 2,1–336 confermati |
| C10 | Regressione di Dunbar 1992: log₁₀N = 0,093 + 3,389·log₁₀(CR) | [R] | **Non raggiunta** | articolo chiuso; la bozza aperta del 1993 ha risposto 503 | Resta [R] |
| C11 | Costo dello scavo (Vleck 1979): 360–3400 volte | [S] | **Non raggiunta** | nessuna copia aperta; nessun articolo aperto riporta le cifre | Resta [S] |
| C12 | Pilastri di Deneubourg (Bonabeau 1998) | [R] | **Non raggiunta** | su PMC c'è solo la scansione, PDF dietro verifica anti-robot | Resta [R] |
| C13 | Valore marginale di Charnov; Holling III; Rosenzweig | [R] per la forma | **Non raggiunte** | originali chiusi | Restano [R] |
| C14 | Cavalli-Sforza e Feldman; Boyd e Richerson; Rogers | [R] | **Non raggiunte** | libri non aperti; Rogers 1988 chiuso | Restano [R] |
| C15 | Barandiaran, Di Paolo e Rohde 2009 | [S] | **Non raggiunta** | PhilPapers ha risposto 403 | Resta [S] |
| C16 | Numero di origini indipendenti (scrittura, metallurgia, eusocialità, apprendimento vocale) | [R] | **Non raggiunta** | nessuna fonte unica con criteri dichiarati cercata a fondo | Restano conteggi ricordati su un solo campione. Per l'agricoltura valgono le fonti già [V] nella nota sulla tecnica: «circa 10», «almeno 11», «forse più di 20» |

---

## Riepilogo

- **Voci esaminate con un esito: 80** (le righe che raggruppano più fonti — A23, B26–B30, C13–C14 — sono contate fonte per fonte).
- **Confermate: 37** (tecnica 10, cellula 20, comportamento 7).
- **Corrette: 15** (tecnica 10, cellula 5), più 2 correzioni minori dentro voci non «corrette» (rapporto rame:stagno di Uluburun in A19; coppia Fe(OH)₃/Fe²⁺ in B10): 17 punti nell'elenco sotto.
- **Aperte nella letteratura: 3** (date di LECA e dei mitocondri, B6; energia per gene come vincolo, B8; Henrich contro Vaesen, C8). Aperte in parte anche le soglie numeriche della bistabilità dell'ossigeno (B9) e la soglia di O₂ per biomassa fuori da 1 bar (A2).
- **Non raggiunte: 25** (tecnica 7, cellula 6, comportamento 12).
- **In elenco ma senza esito: 31** — 7 erano già [V] e non sono state rilette (A22, A23, A30, B13); 24 restano [Va] (B29, B30).

### Correzioni (vecchio → nuovo)

1. Stagno, ΔG di formazione di SnO₂ a 1000 / 1200 / 1400 K: −363 / −319 / −275 → **−367 / −326 / −285 kJ**; retta −585 + 0,221·T → **−572 + 0,205·T**.
2. Stagno, incrocio col carbonio: 635 → **≈640 °C**; CO/CO₂ minimo 0,19 / 0,15 / 0,13 → **0,24 / 0,21 / 0,20**; log pO₂ a 1200 K −13,9 → **−14,2**.
3. Zinco, ΔG di ZnO: −493 / −445 / −361 / −278 → **−495 / −448 / −367 / −286 kJ** (e −207 a 1800 K); rette → **−712 + 0,217·T** e **−931 + 0,403·T**; incrocio 945 → **≈950 °C**; CO/CO₂ 460 / 84 / 5,4 → **530 / 100 / 6,8**; log pO₂ −19,4 → **−19,5**.
4. Carbone per kg di ferro: 5–11 → **7–18 kg**; rendimento termico 2–5% → **1,5–3,5%**.
5. Legna per kg di ferro: 30–50 → **60–150 kg**; bosco per tonnellata di ferro l'anno: 10–25 → **~15–75 ha**.
6. Rame: «nessuna cifra» → **~10 t di legna per t di rame (fino a 80)**.
7. Stagno nella crosta e fattore di arricchimento: 2 ppm, 0,2–1%, 1000–5000 → **2,5 ppm (1,5–5,5), 0,1–1%, ≈400–6000**.
8. Uluburun: rapporto rame:stagno 10:1 → **9:1** (carico 10 t e 1 t confermato).
9. Pirite: ΔfH −178 → **−171,5 kJ/mol**; arrostimento −828 → **−835 kJ/mol**.
10. Soglia di O₂ in funzione della pressione: «nessuna legge trovata» → **frazione molare con correzione P^(−0,1…−0,4) sopra ~0,4 bar; la pressione parziale non è la grandezza giusta**; scelta della soglia inferiore esplicitata (16%, con 13% come minimo assoluto).
11. Licenza NIST: «non letta» → **dati standard di riferimento protetti: non ridistribuire le tabelle**.
12. Vescicole in acqua di mare: «conflitto, per la complessità della miscela» → **le fonti concordano a pH marino; decide il pH (≥ ~11) insieme alla miscela**.
13. DNA: «0,2 contro 31 Ma per altre vie di rottura» → **0,2 Ma è un dato superato (dimetilfosfato, rottura C–O); adottare 31 Ma**.
14. LUCA: «conflitto dichiarato» → **355 e 399 sono famiglie identificate; 2657 (2451–2855) è la taglia stimata, 2,75 Mb (2,49–2,99)**.
15. Lane e Martin: «200 000 volte più energia per gene» → **~1200 volte per cellule medie (0,1 contro ~115 fW per gene); 200 000 è l'espansione possibile del genoma**.
16. Fe(OH)₃/Fe²⁺: «~0 ± 0,1 V» → **vale a Fe²⁺ ≈ 10⁻⁵ mol/L; ≈ −0,3 V a 1 mol/L**.
17. PHREEQC: «dominio pubblico» → **avviso d'uso USGS, libero con obbligo di avviso e di segnalare le modifiche**.

### `fisiologia_piante_ecosistemi.md`

Alla fine del lavoro sugli altri tre il file c'era (503 righe, otto sezioni e una tabella di sintesi finale, ultima modifica alle 17:57 UTC, fermo da un quarto d'ora): sembra completo. Contiene 89 marche [R] e 69 [S], oltre alle [V*] (testo aperto ma letto con un estrattore automatico). **Non è stato verificato né toccato**: il lavoro è stato speso sui tre file assegnati. Resta da fare per intero.
