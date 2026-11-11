# Inventario di ciò che non emerge

Stato: 11 novembre 2026. Letto dal codice di `src/camera/` e `src/tre/` (non solo dalle intestazioni). Le righe
citate sono quelle dei file a questa data; se non tornano, cercare il testo tra «».

**Come leggere le tabelle.** Ogni voce ha una sigla (modulo + numero) che il secondo documento
(«Come farlo emergere.md») riprende. Colonne: *dove* (file:funzione, riga), *che cos'è*, *specie*, *peso*, *legata a*.

Specie:
- **a** parametro libero o tarato su un risultato;
- **b** legge empirica usata dove esiste un meccanismo più profondo;
- **c** elenco al posto di una regola chiusa;
- **d** sorteggio al posto di fisica non risolta;
- **e** soglia netta o interruttore dove la realtà è continua;
- **f** collegamento mancante (uscita non usata, ingresso assunto fisso, grandezza calcolata due volte);
- **g** fermo nel tempo, o piatto (2D dove sono 3);
- **h** livello o oggetto assente;
- **i** dato «ricordato», non verificato alla fonte, che regge risultati.

Peso: **A** = da lei dipendono più moduli o un intero livello; **M** = un modulo o un risultato mostrato;
**B** = effetto locale. Tra parentesi chi ne dipende.

Una voce può avere due specie (es. «a, e»): conta nella prima.

---

## 1. Le leggi di base — `leggi.js`

| sigla | dove | che cos'è | specie | peso | legata a / dovrebbe esserlo |
|---|---|---|---|---|---|
| LG1 | `leggi.js:15` `COSMO` | H0, Ωm, ΩΛ, Ωb, σ8, ns dati come numeri | a (misurati, dichiarati) | A (età, galassie, cosmo3d) | sono i sei numeri di ΛCDM: nessuna teoria li ricava; restano «misurati». `cosmo.js` non usa σ8 e ns (vedi CS1) |
| LG2 | `leggi.js:28` `massaMassimaNeutroni` | 1,55 × Chandrasekhar | b | M (stelle.fine, galassie) | dovrebbe uscire da TOV + equazione di stato nucleare |
| LG3 | `leggi.js:38` `raggioNeutroni` | coefficiente 4,0 «che tiene conto delle forze nucleari» | a | B | TOV; legata a LG2 |
| LG4 | `leggi.js:44` `stella()` | L(M) a quattro tratti, R(M) a due, vita = 10% dell'idrogeno | b, f | M | doppione di `stelle.js stella()`; la usano ancora `mare.js` (import `stella as stellaDi`) e `risalita.js` (`stellaDiMassa`): **due fonti per L, R, T** |
| LG5 | `leggi.js:55` `fine()` | resto: 0,48 + 0,08·M sotto 8 M☉; nucleo 1,2 + 0,04(M−8) | b, e, f | M | doppione di `stelle.js fine()`; soglia netta a 8 M☉ |
| LG6 | `leggi.js:71` `massaNascita` | IMF di Kroupa a due pendenze, 0,08–100 M☉ | b (dichiarata) | A (galassie: rese, supernove, colori; catalogo) | manca il livello «nube che si frammenta» (H3); la scienza non la ricava dai principi |
| LG7 | `leggi.js:85` `ISOTOPI` | U, Th, K delle condriti CI per tutti i pianeti di tutte le stelle | b, f | A (interno.q, lune, materia, risalita) | dovrebbe scalare con la storia chimica della galassia (r-process ≠ Z); oggi solo `√Z` in `geologia.js:38` |
| LG8 | `leggi.js:94` `trattiene` | parametro di Jeans > 25, esosfera = 3×T | a, e | A (aria di ogni pianeta, risalita) | fuga idrodinamica e limitata dall'energia (XUV) assenti; `risalita.js` usa 4× (ECCESSO_ESOSFERA): due numeri per la stessa cosa |
| LG9 | `leggi.js:95` `MOLECOLE` | sei gas con la massa | c | M | elenco chiuso: `chimica.js MOLECOLE` (41) e `molecole.js` (qualsiasi) sono altre due liste della stessa cosa |
| LG10 | `leggi.js:113` `PARTE_FUORI = 0.04` | parte dell'acqua (e dei gas) uscita in superficie | a | A (mare, clima, aria, chimica) | dovrebbe venire dal degassamento dell'oceano di magma e dal vulcanismo integrato (interno) |
| LG11 | `leggi.js:117` `acquaInSuperficie` | «ghiacciato» ⇒ tutta l'acqua in superficie; «roccioso» ⇒ 4% | e | A | interruttore sul tipo (DS12): la realtà è una partizione continua mantello/superficie |
| LG12 | `leggi.js:128` `CLIMA.capacitaTerra/Mare` | 10⁷ e 10⁸ J/m²/K | a | M (clima) | lo strato rimescolato lo calcola `mare.js` (50 m, a sua volta libero: MR9) e non torna al clima |
| LG13 | `leggi.js:129` albedi 0,25/0,08/0,62 | terra, mare, ghiaccio, grigie | b | A (clima) | dovrebbero venire dallo spettro della stella × riflettanza dei materiali (`chimica.coloreRoccia`, `mare.coloreMare` già li hanno): filo mancante |
| LG14 | `leggi.js:130` `geloTerra 268, geloMare 266`, tanh su 4 K | soglia del ghiaccio | e | M | termodinamica del ghiaccio marino (salinità di `mare.js`) e bilancio di massa della neve |
| LG15 | `leggi.js:134` `nuvoleMassime 0,63, riflessoNuvole 0,30, nuvoleAlFreddo 0,4` | nuvole, **tarate sulla Terra** (albedo 0,30) | a | A (ogni clima) | microfisica delle nubi assente; legata a MT7 |
| LG16 | `leggi.js:135` `trasporto: 0.6` W/m²/K, ∝ √p | diffusione del calore di riserva | a, b | A (clima per fasce di ogni pianeta) | il meccanismo è in `meteo.js` (`trasportoCalore`), ma solo sulla mappa e a metà (GE9) |
| LG17 | `leggi.js:138` `rilievoPlacche 2000, rilievoFermo 500` | ipsometria attesa, tarata sulle superfici del programma | a | M (mare atteso → albedo → T) | dovrebbe leggerla dalla superficie vera (che però si calcola dopo) |
| LG18 | `leggi.js:146` `acquaPerIlGhiaccio` 0,15 + 2,5·mare | quanta neve c'è | a | M | ciclo dell'acqua di `meteo.js` |
| LG19 | `leggi.js:148` `nuvoleAttese` (mare > 0,02, p > 0,1 bar) | interruttore delle nuvole | e, a | M | idem |
| LG20 | `leggi.js:159` `serraDaPressione` τ = 0,8·p^0,6 | serra di riserva | b | B (usata solo se manca l'aria) | `chimica.serra` |
| LG21 | `leggi.js:163` `LIMITE_VAPORE = 282` W/m² | limite di Simpson–Nakajima come numero | b, e | A (chi ha il mare) | dipende da g e dai gas non condensabili: è calcolabile (vedi ricerca) |
| LG22 | `leggi.js:253` in `clima()`: gassoso ⇒ albedo 0,35, T = 1,2·Teq, «acqua: nelle nuvole» | i giganti non hanno clima | c, h | M | manca l'atmosfera dei giganti (H13) |
| LG23 | `leggi.js:260` aria di riserva 10⁻⁶·M·(0,85 + 3·acqua) | tarata sulla Terra | a | B (solo riserva) | `chimica.atmosfera` |
| LG24 | `leggi.js:264` `Tavvio` = min(310, 1,25·T) | stato iniziale del clima, scelto | a, g | M (isteresi: palla di neve o no) | la storia vera (stella giovane, CO2 nel tempo) deciderebbe il ramo: vedi G1 |
| LG25 | `leggi.js` tutto il clima | **una sola luce: quella della stella a `eta` di oggi** | g, f | A | `stelle.stella(M,{eta})` sa dare L(t) ma il clima è calcolato solo «adesso» |

## 2. Il cosmo e l'indirizzo — `cosmo.js`, `cosmo3d.js`, `eventi.js`, `intreccio.js`, `biblioteca.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| CS1 | `cosmo.js:100–104` `cosmo()` | campo iniziale: 70 onde, k intero ≤ 9, ampiezza k^−1,25·(0,5…1,5) | a, g | A (dove stanno le galassie, il loro `peso`, quindi alone, tipo, storia) | `COSMO.sigma8, ns` e lo spettro BBKS di `galassie.js` non entrano qui; `cosmo3d.js` costruisce un secondo campo, vincolato a questo |
| CS2 | `cosmo.js:113` soglia `media + 0,9·σ` | galassia = picco sopra 0,9 σ su griglia 96² | e, a | A | teoria dei picchi / insiemi di escursione (funzione di massa) |
| CS3 | `cosmo.js:117–120` | galassie «lungo i filamenti»: 400 tentativi, probabilità 0,25·v, peso × 0,6, tetto 150 | d, a | M | stesse cose di CS2 |
| CS4 | `cosmo.js:38` `GALASSIE_MAX = 200`, `STELLE = 2500`, `PIANETI_MAX = 16`, `REGIONI = 12` | tetti dell'indirizzo | a | M (il numero della biblioteca) | regola 9 (nebbia): dichiarati come campione solo in parte |
| CS5 | `cosmo.js:160` `TORO_M = 3,7·10²⁵` | lato del cosmo | a | M | scelta della scatola; onde più lunghe assenti |
| CS6 | `cosmo.js` `cosmo()` | il cosmo è un toro **a due dimensioni**; z è un evento uniforme (`cosmo3d.js`) | g | A | `cosmo3d.js` lo dice: «la carta piatta non è la proiezione di questo campo» |
| CS7 | `cosmo.js:41` `hash`, `eventi.js:11` `numero`, `mondo.js casoEvento`, `disco.js casoDi`, `geologia.js:53` LCG 16807 | cinque regole del caso, a 32 bit, non coincidenti | f | A (determinismo, rami) | adozione n. 1 del rapporto precedente (Threefry), non fatta |
| CS8 | `cosmo.js:183` `fase = tra(0, 2π)` | dove sta il pianeta sull'orbita: `casoDi('sistema')`, un corso unico per tutto il sistema | d | B | `orbite.js` la riusa; legittimo come condizione iniziale, ma non ha indirizzo fine (regola 3) |
| CS9 | `cosmo.js:188` colore del pianeta per tipo × (0,8…1,15) | tinta a caso | d, c | B (mappa da lontano) | `chimica.coloreRoccia`, `mare.coloreMare` esistono |
| CS10 | `cosmo.js:192` giganti rosse/nane bianche: pianeti con `a < 0,05` (1,5 UA) tolti | soglia fissa d'inghiottimento | e | M | raggio della gigante (assente in `stelle.js`: ST9) e marea |
| CS11 | `cosmo.js:214` schiacciamento = min(0,3; 5/4·ω²R³/GM) | corpo omogeneo, tetto | b, e | B | figura di equilibrio con il profilo di densità (interno) |
| CS12 | `cosmo.js:215` `campo` = scala log tra 10⁻⁸ e 4,5·10⁻⁴ T | normalizzazione di disegno | a | B | — |
| CS13 | `cosmo.js:209–245` ordine dei calcoli | interno → clima+aria → lune → (rotazione rifatta) → clima rifatto → anelli | f | A | il clima non riceve: marea delle lune, calore interno, impatti; l'interno non riceve: T di superficie, maree. Vedi mappa §14 |
| CS14 | `cosmo.js:249` `p.origine = hash('mantello'…)` | stato iniziale del mantello «non ancora dai suoi urti veri» quando manca `P.impatti` | d | B | `impatti.improntaMantello` (collegato in `geologia.js` solo se `P.impatti` è stato letto) |
| CS15 | `cosmo.js:260–263` `pianeta()` regioni | 12 regioni: angolo ± 0,15, raggio tra 1,45 e 4 R, sei nell'anello | d, c | M (gli «universi» della biblioteca) | dovrebbero essere punti qualsiasi (regola 10), non 12 posti |
| CS16 | `cosmo.js:275` `energiaRaggio` spettro E^−2,7 da 500 MeV a 10⁶ | spettro locale del Sole per ogni stella | b, f | M | `materia.js raggiCosmici` ha un altro spettro (Burger–Usoskin) e la modulazione: **due fonti** |
| CS17 | `cosmo.js:278` `sogliaStormer` | 14,9 GV scalata dalla Terra | b | M | doppione di `materia.sogliaStormer` (f) |
| CS18 | `cosmo.js:283–290` `cieloDeiRaggi` | peso = potenza/(0,02 + d²), larghezza k = 6/(1+25d), fondo 15% | a | M | diffusione dei raggi nel campo galattico (assente: H5); `risalita.supernovaVicina` ha la soluzione di diffusione ma non è collegata |
| CS19 | `cosmo.js:296` `magnetosfera` | 36 raggi, parametro d'urto ±12 R, energia tagliata a 0,9 dello spettro | d, a | B | disegno |
| CS20 | `cosmo.js:319` `fascia()` | fascia di radiazione: (1 − 1,12/r)/r, «tiene» se giro < 0,1·r (protone da 450 MeV/c), assorbimento exp(−25·τ) | a, e, b | M (regioni, nebbia) | sorgente CRAND, diffusione radiale, perdite: assenti; nessun vento stellare ⇒ nessuna magnetopausa (in `risalita.ventoStellare`, non collegata) |
| CS21 | `cosmo.js:324` `FASCIA_MAX = 0,17` | massimo scritto a mano (vero 0,223) | a | B | nota del test di coerenza |
| CS22 | `cosmo.js:332–336` `particelleFascia` | energie: protoni 10·30^u MeV, elettroni 0,05–0,78 MeV | d, a | M | spettro del decadimento del neutrone (calcolabile: 0–782 keV per e⁻) |
| CS23 | `cosmo.js:372` `voluti = 9 + 8u` raggi per regione | quanti raggi si disegnano | a | B | nebbia (regola 9) |
| CS24 | `cosmo.js:392` `urtoProtone = 0,9·LATO/τ`, fotone × 0,55 | cammino d'urto nell'anello | a | M | sezione d'urto vera su ghiaccio (in `materia.js`: 35·A^⅓ g/cm²) non usata qui (f) |
| CS25 | `cosmo.js` `cellaDi` | la regione è un piano: campo ⟂ al piano, moto 2D | g | A (tutte le finestre di particelle) | `mondo.js` è 2D (MN1) |
| CS26 | `cosmo3d.js` | kmax = 24: nessuna struttura sotto 50 Mpc; moti lineari; `z` di ogni galassia è un evento | g, h | M | ammassi, gruppi, filamenti fini assenti (H1) |
| CS27 | `intreccio.js`, `spazio3d.js` | il tempo è nell'indirizzo, ma `cosmo()`, `galassia()`, `sistema()` calcolano solo `ADESSO` (`cosmo.js:35`) | g | A | regola 6; `spazio3d.stato…` dichiara che cosa resta fermo |
| CS28 | `biblioteca.js`, `cosmo.js indirizzoDi` | 88% dei numeri sono alias (`slot % S.pianeti.length`, `gslot % galassie.length`) | f | B | regola 1 |

## 3. Le galassie — `galassie.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| GX1 | `galassie.js:144–176` `LEGGI` | 30 leggi prese da simulazioni o misure (Fakhouri, Boylan-Kolchin, Bullock, Mo-Mao-White, Kennicutt, Croton, Henriques, Kormendy-Ho, Aird, Maoz-Graur, Kim-Ostriker…) | b (dichiarate) | A | sono la «scorciatoia» di un N-corpi + idrodinamica che non si può rifare; la regola 2 chiede che siano controllabili su un campione piccolo: oggi no |
| GX2 | `LEGGI.Qstelle = 2`, `germe = 10⁵`, `getto = 10⁻³`, contrasto dei bracci 0…0,45 lineare in Q | parametri liberi dichiarati | a | M (bracci, buco nero, raggi cosmici) | amplificatore di Toomre (guadagno calcolabile); semi dei buchi neri (non noti) |
| GX3 | `galassie.js` intestazione: raffreddamento | Λ(T, Z) «raccordo fatto a memoria, entro 1,5» | i, b | A («da lei dipende quante stelle fa un alone di 10¹²») | tabelle di Sutherland–Dopita / CLOUDY |
| GX4 | `LEGGI.maggiore = 0,3`; ellittica se sferoide > 4/5; barra se V/√(GM/R) < 1,1 | soglie del tipo | e | M (tipo, bracci) | continuo: rapporto sferoide/disco già calcolato |
| GX5 | `galassie.js:345–348` fusioni | compagni «che non ci sono più», estratti dalla legge del ritmo | d | A (tipo, sferoide, buco nero) | i vicini veri del campo (CS1) non si fondono mai: il sorteggio sta al posto dell'albero di fusione |
| GX6 | `galassie.js:391, 404` `alone/asse`, `alone/forma` | metà della varianza dello spin è evento | d | M (raggio del disco) | `cosmo3d.js` calcola l'asse dalle coppie mareali 3D: **due fonti** per lo spin (f) |
| GX7 | `galassie.js:561, 607` `buco/scarto`, `buco/acceso` | scarto di 0,28 dex e frazione di Eddington estratti | d | M (getto, raggi cosmici) | accrescimento dal gas del centro (assente) |
| GX8 | `galassie.js:716` `inclinazione`; `621` assi dello sferoide | galassia disegnata di faccia; schiacciamento estratto | d, g | B | `cosmo3d` dà l'asse vero: non usato dalla mappa |
| GX9 | `LEGGI.pulsar`, campo delle stelle `c('campo')` (`:803, :827`) | periodo 0,3 ± 0,15 s, spinta 265 km/s, campo alla nascita estratto | d, b | M (pulsar «debolissime») | dinamo stellare e collasso: assenti |
| GX10 | 14 anelli × 46 passi da 0,3 Ga | risoluzione della storia | a, g | M | le stelle massicce «muoiono subito»; scoppi di un passo |
| GX11 | un solo Z per tutti i metalli | niente α/Fe, niente r-process | c, f | A (LG7: U e Th dei pianeti; chimica dei dischi) | rese per elemento (tabelle NuPyCEE) |
| GX12 | gas dell'alone isotermo, alone NFW non contratto, niente migrazione radiale | semplificazioni dichiarate | b | M | — |
| GX13 | `stelleGalassia` | catalogo = campione di 2500 con `peso` ~10⁸; solo le ultime 8 supernove sono stelle vere | h, g | A | manca il livello tra galassia e stella: nubi, ammassi, associazioni, vicinato stellare (H3, H4) |
| GX14 | luce = sequenza principale | colore della galassia senza giganti | f | B | ST9 |
| GX15 | «CHE COSA NON TORNA»: aloni piccoli 10% in stelle (vero 0,5–1%); niente lenticolari; gradiente di Z a metà | risultati sbagliati dichiarati | — (nota) | A | già nel rapporto precedente (SAGE, Moster): non fatto |

## 4. Le stelle — `stelle.js`, `stelle_tabella.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| ST1 | `stelle.js ALFA = 1,8` | lunghezza di mescolamento | a | M (raggi, T) | convezione 3D: non ricavabile in 1D; resta |
| ST2 | opacità sotto 10⁴ K: H⁻ 2,5·10⁻³¹(Z/0,02)ρ^½T⁹; molecole 10⁻⁸ρ^⅔T³ | due leggi prese già fatte (triplo del vero alla fotosfera) | b | M (nane rosse, T di tutte) | tabelle di Ferguson / ÆSOPUS |
| ST3 | opacità senza righe, Gaunt = 1 | ±40% nel Sole; zona convettiva a 0,84 R | b | A (L −8%, raggi −15…25% a 1,5–3 M☉) | OPAL/OP |
| ST4 | massa nana bianca: Cummings 2018 | IFMR misurata al posto della perdita di massa | b | M | venti (Reimers/Blöcker), fase AGB: assenti |
| ST5 | NS/BH: nucleo di elio > 7 M☉ «citato a memoria» | soglia | e, i | M (resti, rese di GX: «sopra 23 M☉ niente metalli») | Fryer 2012, già nel rapporto |
| ST6 | regole di Slater | schermo empirico (10–20%) | b | B | Hartree–Fock tabulato |
| ST7 | solo pp-I e CN | niente pp-II/III, niente ON, niente 3α | c | M | REACLIB |
| ST8 | niente rotazione, campi, perdita di massa, diffusione, pre-sequenza | fermi | h, g | M | vento stellare (`risalita.ventoStellare` usa il Sole scalato), attività, XUV per la fuga atmosferica |
| ST9 | dopo la sequenza principale «non c'è niente: `stella()` resta ferma» | giganti, ramo orizzontale, AGB, nebulose planetarie assenti | h, g | A (CS10, colori delle galassie, rese, polvere) | SSE di Hurley (rapporto precedente, adozione 2: non fatta) |
| ST10 | nane brune Z < 0,3 usano la curva di Z = 0,3 | pezza | a | B | assorbimento indotto da collisioni dell'H₂ |
| ST11 | tabella 7 Z × 36 M × ~10 età | precalcolata (16 min) | — | A | è il modello di «tabella rigenerabile» da imitare altrove |
| ST12 | campo magnetico della stella: evento in `galassie.js` (`c('campo')`), 10^(−5+3u) T in origine | sorteggio | d | M (campo dei resti, pulsar) | dinamo (Rossby) |
| ST13 | stelle doppie | assenti: ogni stella è sola; le Ia vengono da una legge dei ritardi | h | A (metà delle stelle vere; novae, binarie X, Ia) | — |
| ST14 | rotazione della stella: Skumanich in `orbite.js asseStella` | legge misurata sul Sole | b | B | frenamento magnetico (Matt 2015) |

## 5. Il disco e i pianeti — `disco.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| DS1 | `DISCO.pendenza 1,5; raggio 30·√M` | profilo e bordo del disco imposti | a, b | A (ogni pianeta) | disco viscoso che evolve (soluzione autosimilare di Lynden-Bell–Pringle), collasso della nube (H3) |
| DS2 | `DISCO.frazione 0,055, sparpaglio 0,5`, tagli 0,01–0,12 | massa del disco: log-normale estratta | d, a | A | momento angolare del nucleo di nube: assente |
| DS3 | `disco.js:72` `vita` del gas: 10⁶ − 2,5·10⁶·ln(1 − 0,98u), /√M, tetto 1,2·10⁷ | vita estratta | d, b | A (chi diventa gigante) | fotoevaporazione dalla XUV della stella giovane (ST8) e dalle vicine (H3) |
| DS4 | `disco.js:63` neve a 2,7·√L UA (L «a metà vita», **tarata sul Sole**) | linea della neve fissa | a, g | A (tipi, acqua) | temperatura del disco (irraggiamento + viscosità) che cambia nel tempo |
| DS5 | `disco.js:79` κ = 0,1·Z m²/kg; `rIn` = max(0,02; 0,034√L; 0,05·M^⅓; …) | opacità della polvere e bordo interno | a | M | troncamento magnetosferico (campo della stella: ST12) |
| DS6 | `raggioPianeta` | R = (1,07 − 0,21 Fe + 0,34 ghiaccio)·M^0,27; velo 2,06·M^−0,21·…; giganti M^0,55 / M^−0,04 | b | A (g, densità, tutto ciò che sta sopra) | equazione di stato + equilibrio idrostatico (integrabile come in `stelle.js`) |
| DS7 | `tempoCrescita` 1,2·10⁵ anni·… | crescita oligarchica: legge da simulazioni | b | A | accrescimento di ciottoli assente |
| DS8 | `tempoInvolucro` = 10⁹·M⁻³ anni | Kelvin–Helmholtz | b | A (troppi giganti) | rapporto precedente (Ikoma, Bitsch): non fatto |
| DS9 | `raggiNecessari / giriCheRegge` | Chambers 1996 interpolata in log μ | b | A (urti giganti, impatti, fasce) | N-corpi; Petit 2018 nel rapporto |
| DS10 | `DISCO.C 5, mescola 0,25, eMax 0,3, pari 0,1, presa 0,05, minimo 0,02, senzaGas 300` | sette parametri liberi | a | A | `presa` decide la massa dei giganti; `senzaGas` la crescita lontana; `minimo` è la soglia «pianeta» (e) |
| DS11 | `disco.js:160` `acquaSistema = 0,5 + c()`; acqua dentro la neve 0,1·(r/neve)^2,5 | consegna dell'acqua: «regola semplice» | d, a | A (mari di tutti i rocciosi) | deriva dei ciottoli, urti con corpi d'oltre neve (già in `impatti.js` come masse: non usati per l'acqua: f) |
| DS12 | `disco.js:254` tipo = gas > 0,5 → gassoso; ghiaccio > 0,2 → ghiacciato; altrimenti roccioso | **tre tipi** da due soglie | c, e | A (LG11, clima, colore, lune, anelli, interno) | la composizione continua c'è già (ferro, roccia, acqua, gas): i tipi andrebbero tolti |
| DS13 | `disco.js:166` ferro/roccia ∝ 1 + (T/600)² | condensazione: «regola semplice» | a | M (nucleo, campo) | sequenza di condensazione (equilibrio di `chimica.js` a T, P del disco) |
| DS14 | `disco.js:214` fusione o fionda: `c()·(1+f²) > f²`, soglia `pari` | esito dell'incontro | d, e | A | Genda 2012 è usata in `impatti.js` ma non qui (f) |
| DS15 | `disco.js:263` eccentricità di oggi = b.e·(0,15 + 0,35u) + 0,002 + 0,01u; giganti +0,01 + 0,05u | smorzamento sorteggiato | d, a | M (clima, maree, risonanze) | attrito dinamico dei detriti (calcolato in `impatti.js`: non usato) |
| DS16 | niente migrazione, risonanze, binarie | dichiarato | h | A | Tanaka/Paardekooper (rapporto precedente [R]) |
| DS17 | `formaPianeti` = un corso di eventi unico (`generatore` da seme) | un ramo cambia tutto il sistema | d, g | M | regola 3: «disco e lune cambiano ancora per corsi interi» |
| DS18 | il disco non esiste più «oggi»: nessun residuo (fasce, polvere zodiacale) come oggetto | assente | h | M | `impatti.js` ha le masse delle fasce ma non sono luoghi |

## 6. L'interno e la superficie — `geologia.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| GE1 | `geologia.js:27` `TERRA = {q 0,087, Rc, rhoC 11000}` | tutto l'interno è la Terra riscalata | a, b | A | struttura a strati integrata (EOS), evoluzione termica |
| GE2 | `:38` q = 0,087·(M/R²)·√Z·decadimento·M^0,3 | calore interno: formula | b, a | A (campo, tettonica, vulcani, mare, lune, pozza) | manca calore primordiale, mareale (calcolato in `lune.js` solo per le lune), bilancio dT/dt |
| GE3 | `:35` Rc = R·∛(ferro·ρ/11000) | raggio del nucleo | b | M | EOS |
| GE4 | `:40` `nucleoLiquido = q > 0,025 && R > 3,5·10⁶` | interruttore della dinamo | e | A (campo → fascia, raggi al suolo, fuga dell'aria) | flusso al CMB contro adiabatico; Rm |
| GE5 | `:41` B0 = 3,1·10⁻⁵·(q/q⊕)^⅓·…; senza dinamo 10⁻⁹ T | campo tarato sulla Terra; non dipende dalla rotazione | a, b | A | Olson–Christensen con Rossby locale (rapporto precedente); `rotazione.js` dà il giorno: **non collegato** (f) |
| GE6 | `:43` tettonica: q > 0,05 e acqua e M > 0,3 M⊕ → placche; q > 0,02 → coperchio; else ferma | tre regimi da tre soglie | c, e | A (continenti, clima, mare, crateri, materia) | sforzo convettivo contro resistenza della litosfera, T di superficie (non entra: f) |
| GE7 | `:44` crosta = min(0,02; 0,004·√(q/q⊕)); vulcani = round(q/0,02) | spessore e **numero** di vulcani | a | M | fusione parziale (`chimica.js` ha la legge), flusso di magma |
| GE8 | `:30–31` giganti: B0 = 4,2·10⁻⁴·(M/MJ)^0,6; q = 5; nucleo 0,1 | costanti | a, c | M (fasce, anelli: pioggia) | interno dei giganti assente (H13) |
| GE9 | `climaSuperficie` `:207` D = media tra attesa e `meteo.diffusivita` | accoppiamento clima–aria a metà, due giri | f, a | A | dovrebbe essere un solo sistema; il mare (`mare.js` «il calore che le correnti portano») **non entra** |
| GE10 | `:71` rilievo: 24 onde casuali, ampiezza 180 m (con placche) o −1500 ± 700 m (senza) | rumore al posto della topografia dinamica, dei vulcani, dei bacini | d, a | A (mari, fiumi dei mondi senza placche: la maggioranza) | flessione, topografia dinamica, vulcanismo |
| GE11 | `:80–82` `rinnovo` 3 / 1 / 1,5; `conservati = exp(−rinnovo·età·0,9)`; lava «ogni 1,1 Ga» | cancellazione dei crateri | a | M | flusso di magma (GE7), erosione |
| GE12 | `:91` erosione dei crateri 3·10⁻⁵ m/anno con pioggia, 3·10⁻⁸ col vento, 0 senz'aria | tre valori | e, b | M | l'erosione calcolata sotto (stessa file) non è usata qui (f) |
| GE13 | `:104` vulcani in punti `casuale()` | «sopra i pennacchi» nel commento, a caso nel codice | d | M | celle del mantello di `tettonica.js` (ha salite e discese: non collegate) |
| GE14 | `:98–102` crateri di ripiego da seme (900·…, legge di potenza −1,8) | ripiego | d | B | `impatti.js` |
| GE15 | `:109–118` livello del mare: volume «contato come su un piano» | guscio profondo stimato | b | B | — |
| GE16 | `:120–125` fiumi: discesa più ripida a 8 vicini su griglia lat-lon | D8 | b | M | artefatti a 45° (rapporto precedente, adozione 3) |
| GE17 | `:127` `ossidato` = c'è acqua o p > 100 Pa | interruttore redox | e | M (colori, minerali) | fugacità dell'ossigeno da `chimica.equilibrio` |
| GE18 | `immagineSuperficie` `:161` gradiente 6,5 K/km fisso; gelo (268 − T)/12 | gradiente terrestre per ogni aria | b | M (neve sui monti) | `meteo.js` calcola l'adiabatica satura del pianeta: non usata (f) |
| GE19 | `:262` `sgretola` 0,05 / 0,015 / 0,002 | diffusione dei pendii a tre valori | e, a | M | — |
| GE20 | `erosione` `:281` pioggia di riserva (T − 255)/40 | senza meteo | b | B | — |
| GE21 | `:300` `secco = 0,2` | portata minima ovunque | a | B | falda (assente: H20) |
| GE22 | `:306` crescita: 9·spinta per passo, o 0,001·quota | orogenesi senza unità di tempo | a, g | A | i «passi» (160) non sono anni: **l'erosione non ha un orologio**; usa il clima di oggi per tutta la storia |
| GE23 | `:308` scavo F = 0,0009·√area/dist | stream power con K e m = ½ scelti; niente soglia, niente litologia | a | A (valli, fiumi) | K dipende da roccia (`chimica.minerali`) e pioggia: f |
| GE24 | `:316` deposito = min(carico, spazio·0,5) | sedimentazione | a | M | trasporto limitato (FastScape G) |
| GE25 | `:330` lago se area > (4 + 30·clamp((T−260)/50))·scala | evaporazione dei laghi: formula | a, b | M (laghi, piane di sale → `mare.js`) | `meteo.js` dà evaporazione vera: non usata (f) |
| GE26 | `tessera` `:359` amp = 260·0,36^L, due ottave di rumore di valore | il dettaglio sotto la mappa è **rumore**, non processo | d, a | A (tutto il paesaggio da 100 km a 10 m) | regola 4: «aggiunge ciò che da lontano non si vedeva», ma qui non viene da una legge (litologia, faglie, frane) |
| GE27 | `tessera` erosione 26 passi, `afflusso·4` | parametri numerici | a | M | — |
| GE28 | `tessera` | il clima della tessera è quello della cella 64×32 (600 km) | f | M | `meteo.pioggiaFine` esiste (non usata fuori: è nell'elenco delle uscite orfane) |
| GE29 | tutto `geologia.js` | superficie su carta equirettangolare; aree corrette col coseno ma vicinati no | g | M | icosfera (rapporto precedente, adozione 9) |
| GE30 | memo per chiave | 6 superfici, 6 climi, 48 tessere | — | B | regola 8 |
