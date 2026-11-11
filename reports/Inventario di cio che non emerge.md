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

## 7. La tettonica — `tettonica.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| TT1 | `tettonica.js mantello()` | il mantello è l'equazione di Swift–Hohenberg (un'equazione di forma), non conservazione di massa, momento, energia | b | A (continenti, quote, età della crosta) | convezione di Stokes a viscosità variabile; o almeno la legge di scala Nu–Ra per il flusso |
| TT2 | `COSTANTI.rigida 0,12, coesione 0,5, inerzia 4, coperta 2,5` | quattro liberi «scelti guardando il risultato» | a | A | reologia della litosfera; isolamento termico dei continenti |
| TT3 | `COSTANTI.vTerra 0,04, qTerra 0,087`, v ∝ q² | velocità delle placche riscalata dalla Terra | a, b | A (anche `mare.js`: ritorno dei sedimenti; `impatti.js`) | strato limite: v ∝ Ra^⅔·κ/d |
| TT4 | `dorsale 2500, raffredda 350, abisso 6000` | profondità–età misurata sulla Terra | b | M | raffreddamento del semispazio: 2·ρ_m·α·ΔT/(ρ_m − ρ_w)·√(κt/π), calcolabile con g e T di quel pianeta |
| TT5 | `hZero 35 km, hMargine 25, hFermo 39, hMassimo 70, radice 5250, galleggia 0,15, fossa 2500` | isostasia con densità e spessori terrestri | b | A (quote ⇒ mari) | densità da `chimica.minerali` (crosta di quel pianeta) e g: non collegati (f) |
| TT6 | `crostaAttesa` | quanta crosta continentale nel tempo: curva terrestre | b | A | fusione parziale in presenza d'acqua (zona di subduzione) |
| TT7 | `fiumi 130 Ma, erosione 800 m²/anno` | erosione dentro la tettonica, costante | a, f | M | l'erosione vera sta in `geologia.erosione` e non parla con questa: **due erosioni** |
| TT8 | `qPlacche 0,05, qVivo 0,02` | stesse soglie di GE6, scritte due volte | e, f | M | — |
| TT9 | «il calore q è quello di oggi per tutta la storia» | q fermo | g | A | `leggi.caloreDellaRoccia(età)` c'è: non integrato nel tempo |
| TT10 | `evolviTettonica` «saltati» | gli anni più antichi si saltano (`PASSI_GROSSI`); la storia intermedia non si può guardare | g | M | regola 6 |
| TT11 | carta piana, poli = muri; niente trasformi né rotazioni rigide | piatto | g | A | icosfera, poli di Eulero (rapporto precedente) |
| TT12 | `tettonica.js:100` rumore 0,05·(u − 0,5) e LCG 16807 | stato iniziale di ripiego | d | B | impronta degli urti (collegata) |
| TT13 | clima assente dalla tettonica | T di superficie, mare, sedimenti non entrano nel regime | f | A | Foley–Bercovici (rapporto precedente) |
| TT14 | i mondi di ghiaccio non hanno tettonica propria (gusci di ghiaccio, criovulcani) | assente | h | M | `lune.js stato` dà oceani interni ma nessuna superficie |

## 8. Impatti, rotazione, lune, anelli, orbite

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| IM1 | `impatti.js IMPATTI.inOrbita 1/3, sfugge 1/12` | esito dell'urto gigante: frazioni fisse da Canup | b | A (luna, giorno, anelli) | SPH; leggi di scala del disco di detriti (Kegerreis, Timpe) |
| IM2 | `IMPATTI.luna {1,9; 1,1; 0,05}` | massa della luna da Ida–Canup–Stewart; 5% perso (libero) | b, a | M | — |
| IM3 | `IMPATTI.giroEmbrione 0,1` | rotazione primordiale | b | M (giorni dei mondi senza urti) | Visser 2020 |
| IM4 | `IMPATTI.planetesimo 10⁵ m` | taglia di nascita | b | M (cascata) | instabilità di flusso (streaming): distribuzione, non un numero |
| IM5 | 40 classi × 8 velocità; passo ×1,4; `massimo 2000` | numerici dichiarati («cambiano i risultati di un decimo») | a | B | — |
| IM6 | `impatti.js` | fasce: legge di Chambers per un sasso accanto a un pianeta; manca Yarkovsky, manca la nube lontana | b, h | M («dopo un miliardo di anni non cade quasi più niente») | risonanze di moto medio e secolari; Marchi 2009 nel rapporto |
| IM7 | «la massa dei detriti e quella che ricade non sono tolte né aggiunte al pianeta» | conservazione mancata | f | M | `disco.js` |
| IM8 | `impatti.js` | acqua e volatili portati dagli impatti: non contati | f | A (DS11, LG10) | la cascata sa già la frazione di ghiaccio (`orfani.ghiaccio`) |
| IM9 | effetti sul clima e sull'aria di un impatto (erosione atmosferica, inverno, vapore) | assenti | f, h | M | `ariaDi`, `attraversaAria` esistono; non tornano a `chimica.atmosfera` |
| IM10 | `cratere`: semplice/complesso con passaggio a D_c·g fisso | soglia | e, b | B | continuo nelle leggi di Holsapple |
| IM11 | `impatti.js` | i crateri sono stampi (scodella + bordo + picco) sulla mappa; niente raggi di ejecta, bacini multianello, crateri secondari | c, h | M | — |
| RO1 | `rotazione.js ROTAZIONE.giroGiove 0,2986` | **tarata su Giove** | a | M (giorni di tutti i giganti → anelli, dinamo) | Batygin 2018: serve il campo del pianeta giovane (GE8) |
| RO2 | `k2QGas 10⁻⁵`; `lune.js k2QPianeta`: gassoso o ghiacciato 10⁻⁵; roccioso 0,3/30 se acqua liquida, 0,3/100 se no | dissipazione mareale a tre valori | e, b, c | A (blocco, giorno, orbite delle lune) | reologia (Andrade/Maxwell) dall'interno; marea oceanica da `mare.js` (ha la risposta dei bacini: non torna qui) |
| RO3 | `rotazione.js` | freno mareale costante («l'attrito non dipende dalla frequenza») | b | M | Leconte 2010 nel rapporto |
| RO4 | `rotazione.js` | manca la marea termica dell'aria (Venere), le risonanze asse–orbita, gli urti sui mondi con involucro | h, f | M | `meteo.js`, `orbite.js` |
| RO5 | `rotazione.js` | luna e stella frenano «una dopo l'altra» | g | B | integrazione congiunta |
| LU1 | `lune.js MATERIALI` | due materiali (roccia, ghiaccio) con densità, Q, rigidità fisse | c | A (lune, anelli, impatti, rotazione) | minerali veri di `chimica.js`/`materia.js`: terza lista di materiali |
| LU2 | `regolari()`: μ = 2·10⁻⁴·exp(0,35·gauss) | massa totale delle lune: Canup–Ward + sorteggio | d, b, i | A (lune dei giganti → anelli, maree) | disco circumplanetario (afflusso × tempo di migrazione); nel rapporto era [R] |
| LU3 | `regolari()`: aIn = sincrona·tra(1; 2,5); aOut = R_Hill·tra(0,6; 2)/48; K = tra(12; 22); larghezze × tra(0,85; 1,15) | quattro sorteggi che decidono numero e posto delle lune | d | A | — |
| LU4 | `lune.js` `:199` | T del disco del pianeta = 1300 K·√(M/MJ)·(r/RJ)^−0,75, **tarata su Giove** | a | M (ghiaccio delle lune) | luminosità di accrescimento del pianeta giovane |
| LU5 | ghiaccio = 0,5/(1 + (T/170)^8) | frazione di ghiaccio: «metà» e passaggio ripido | e, a | M | `chimica.SOLE.ghiaccio` = 0,61 (nota del test) |
| LU6 | `lune()` `:351` roccioso ⇒ `daUrto`, tutti gli altri ⇒ `regolari` | un mondo di ghiaccio di 0,1 Terre ha lune «da disco di gas» come Giove | c, e | M | dipende dal tipo (DS12), non dal fatto di aver avuto un disco |
| LU7 | `daUrto` ripiego: `c() < 0,45`, μ = 10^tra(−3; −1,6), e0 = tra(0,01; 0,08) | sorteggi quando l'urto vero manca; e0 sempre | d | B/M | `impatti.giganteDi` (collegato per i rocciosi) |
| LU8 | `catturati`: Poisson media 0,15 (rocciosi) / 2,5 (altri); R = 20 km·min(10; 1/(1−u)); a, e, verso a caso | «contati nel Sistema Solare» | d, b | M | cattura da binarie / dal disco: le fasce di `impatti.js` (popolazioni) non sono usate |
| LU9 | `lune.js` `forma` | assi 0,6 + 0,35u dei corpi non tondi | d | B | storia collisionale |
| LU10 | `fusoDentro`: guscio < 200 km ⇒ in parte fuso; due valori di k₂/Q | interruttore reologico | e | M (vulcani di Io, oceani) | viscosità(T) e bilancio termico accoppiato alla marea (Fischer–Spohn) |
| LU11 | eccentricità forzata: 0,75 e 0,43·m/M/0,004; tetto 0,02 | «scarto misurato su Io ed Europa» | b, a | M | teoria della risonanza di Laplace |
| LU12 | `lune.js` `tSuperficie` | albedo 0,6 / 0,1; tetto a 170 K se ghiacciata | e | B | diversa da `leggi.CLIMA` (nota di coerenza) |
| LU13 | `lune.js` | le lune non hanno superficie, aria, mare, clima: sono schede | h | A | tutto ciò che un pianeta ha (Titano, Europa non visitabili) |
| LU14 | `lune.js` `lune()` | = un corso di eventi unico (`generatore`) | d, g | M | regola 3 |
| AN1 | `anelli.js LEGGI_ANELLI.pioggia 10⁻¹³ kg/m²/s` | misurata su Saturno, usata per ogni pianeta | b | A (chi ha anelli) | carica dei grani + flusso UV/micrometeoriti (le fasce di `impatti.js` danno il flusso: non collegato) |
| AN2 | `esosfera 3, soglia 10⁻⁸, restoUrto 1, granoCarico 1 nm` | liberi dichiarati | a | M | — |
| AN3 | `anelli.js:157` `ultima luna perduta/fascia` | l'ultima luna perduta «somigliava alla più interna rimasta» + evento | d, b | A (anelli dei giganti) | migrazione delle lune nel disco (LU2) |
| AN4 | `anelli.js` | taglia dei grani a Q = 2: «un'ipotesi» | a | B | — |
| AN5 | `anelli.js` | luce e bordi delle risonanze «di oggi per tutta la storia» | g | M | — |
| AN6 | `anelli.js` | mancano: ciclo anello→lunette→anello, polvere dalle lune piccole, comete spezzate | h | M | — |
| OR1 | `orbite.js` | gli elementi orbitali non cambiano mai: niente precessione, risonanze, Kozai, Milanković | g | A (clima passato, stagioni lunghe, stabilità) | teoria secolare di Laplace–Lagrange (c'è già in `impatti.js` per i sassi: non usata per i pianeti: f) |
| OR2 | `orbite.js` | nodo, pericentro, direzione dell'asse: eventi uniformi; inclinazione = Rayleigh/2 | d (legittimi come condizioni iniziali), b | B | — |
| OR3 | `orbite.js` | asse della stella: «entro una decina di gradi» (misurato), Skumanich, 120 km/s per le calde | b | B | ST14 |
| OR4 | `spazio3d.js stato…` | che cosa è vero nel tempo: orbite kepleriane, moti delle stelle (epicicli), espansione; **non**: superficie, clima, mare, impatti (solo oggi) | g | A | regola 6 |

## 9. L'aria — `meteo.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| MT1 | `PARAMETRI.cdMare, cdTerra, ce, raffica` | coefficienti di scambio misurati sulla Terra | b | M | teoria di Monin–Obukhov con la rugosità (onde di `mare.js`, rilievo fine): f |
| MT2 | `secchio 150 kg/m²` | suolo di Manabe | b | M (deflusso, deserti) | suolo assente (H20) |
| MT3 | `umiditaPioggia 0,8, tempoPioggia 4 h` | Betts–Miller semplificato | b | A (pioggia ⇒ erosione, mare) | convezione risolta impossibile a 600 km; resta |
| MT4 | `umiditaNuvole 0,6` (Sundqvist) | nuvole diagnostiche | b | A (albedo ⇒ clima) | microfisica; nuclei di condensazione (`risalita.js` li calcola: non collegato) |
| MT5 | `stabilitaSecca 0,8` | «qui non c'è un modello della radiazione in verticale» | a | M (mondi secchi: Marte, Venere) | trasferimento radiativo a colonna (grigio a due flussi) |
| MT6 | neve: tutta sotto 0 °C, niente sopra +2 °C | soglia | e | B | — |
| MT7 | `viscosita 0,003, courant, coriolis, latCritica 45, increspatura 1 K, vaporeMassimo 0,1` | liberi numerici | a | A (Hadley 1,5×, Ferrel assente) | rapporto precedente, adozione 8: non fatta |
| MT8 | due strati, coperchio rigido, 64×32, decine di giorni | risoluzione | g, b | A | — |
| MT9 | `meteo.js` | la superficie ha T data: l'aria non la cambia qui | f | A | accoppiamento a due giri (GE9) |
| MT10 | `meteo.js` | i rilievi non deviano il vento | f | M | termine orografico (rapporto precedente) |
| MT11 | `meteo.js` | stagioni «tenute ferme»; niente ciclo giorno–notte; niente tempo che fa (solo medie) | g, h | A | perturbazioni, cicloni, fronti, temporali come oggetti: assenti (H18) |
| MT12 | `meteo.js` | un'atmosfera densa (Venere) «non arriva a regime» | g | M | — |
| MT13 | `meteo.js` | chimica dell'aria: nessuna fotochimica, ozono, foschie; l'aria è l'equilibrio di `chimica.atmosfera` | f, h | M | `risalita.prodotti`, `molecole.fotolisi` esistono: non collegati |
| MT14 | polvere, aerosol, tempeste di sabbia | assenti | h | M | sollevamento eolico (soglia di Bagnold) |
| MT15 | `pioggiaFine`, `suGrigliaFine` | pioggia a risoluzione fine calcolata e usata solo in parte (`pioggiaPerErosione` sì; le tessere no) | f | M | GE28 |

## 10. Il mare — `mare.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| MR1 | `mare.js:594` `out.caloreDalMare`, `out.albedo`, `scaldaDi` | il calore che le correnti portano e l'albedo del ghiaccio marino: **calcolati e non letti da nessuno** | f | A | `geologia.climaSuperficie` (regola 7 lo dichiara mancante) |
| MR2 | `mare.js:453` `pCO2Ciclo`, `stato.carbonioAria` | il ciclo carbonato–silicato sulle terre vere: calcolato, mostrato, **non torna all'aria** («l'aria è data: il mare non la cambia») | f | A | `chimica.climaEAria`: lì il ciclo c'è (`co2DelCiclo`) ma si accende solo se chi chiama passa `calore`; `cosmo.js:228` non lo passa ⇒ **spento** nel clima di ogni pianeta |
| MR3 | `mare.js` | «clima, continenti e fiumi di oggi per tutta la storia; massa del mare costante» | g | A (salinità: Terra a 71 g/kg) | storia tettonica (TT10), evaporiti nei bacini chiusi del passato |
| MR4 | `mare.js` | correnti: Stommel a uno strato, ψ = 0 su tutte le terre, niente vortici, niente circolazione profonda risolta | b, g | A (calore, salinità, ghiaccio) | rapporto precedente (Munk sotto griglia, gravità ridotta); circolazione termoalina a scatole |
| MR5 | `mare.js` | maree: «risposta bacino per bacino lungo i paralleli», risonanza «fermata a 5», attrito 0,0025 | b, a, e | M | equazioni di Laplace delle maree (acque basse): il rapporto precedente le stima in ~1000 passi |
| MR6 | `mare.js` | onde: JONSWAP/Pierson–Moskowitz dal vento medio; frangenti di Monahan | b | M | spettro dal bilancio d'azione d'onda (crescita di Miles, dissipazione): resta empirico anche in ricerca |
| MR7 | `mare.js` | ottica: R = 0,33·b/(a+b) (Gordon), tre bande RGB (`OTTICA`) | b, g | M | trasporto radiativo spettrale (H22) |
| MR8 | `DATI.mescola 10⁻⁴ m²/s`, orizzontale 1000 m²/s | diffusività terrestri (Munk) | b | M | marea interna e vento (energia disponibile ⇒ κ): Munk–Wunsch |
| MR9 | `DATI.strato 50 m`, `pennacchio 5 m`, calcare sospeso 1/10 | liberi dichiarati | a | M | profondità di Monin–Obukhov / Kraus–Turner da vento e flusso di galleggiamento |
| MR10 | `mare.js:882` lo stretto: L = cella·10^(−2,5u₁), soglia 10^(−1,5u₂) | **due eventi** decidono se un mare chiuso arriva al sale | d | A (salinità del mare: «metà del sale sepolto») | topografia fine (tessere): il passaggio vero esiste nelle tessere, non è letto (f) |
| MR11 | `mare.js` | vortici sotto griglia: «rumore fisso del luogo» | d | B | — |
| MR12 | `mare.js` | fasi delle onde: eventi | d (legittimo) | B | — |
| MR13 | `mare.js` | attività: Debye–Hückel esteso + Fuoss, fino a ~8 mol/kg | b | M (evaporiti) | Pitzer (rapporto precedente) |
| MR14 | `IONI`: 9 ioni; `TERMO`: specie scelte; `CATIONI × LEGANTI` | elenco | c | A | `molecole_energia.js` sa dare ΔG di qualsiasi specie: non collegato (regola 2) |
| MR15 | `mare.js` | dati di flusso idrotermale: 10% / 20% del calore, 1 kg acqua/kg roccia, Mg tolto tutto | b (misure terrestri) | A (Mg, K, Ca del mare) | equilibrio acqua–basalto a T, P (PHREEQC nel rapporto precedente) |
| MR16 | `mare.js` | cloro e zolfo: 5% intrappolato, 35% e 90% persi sotto 100 bar, un sesto del magma in superficie, 1200 ppm S | b; soglia a 100 bar (e) | A (Cl ⇒ salinità) | solubilità dei volatili nei fusi (VolatileCalc/Iacono-Marziano) |
| MR17 | `mare.js` | argille: 0,25 eq/kg, porosità 20% | b | M | — |
| MR18 | `mare.js` | «niente vita»: nessuno toglie calcare, silice, solfato, O₂ | h | A | Ω = 20 come soglia di precipitazione abiotica (e) |
| MR19 | `mare.js` | oceano profondo: nessuna colonna (T, S, O₂ con la profondità), niente fondali come luogo | h, g | M | il campione ha `profondita` ma lo stato è a uno strato |
| MR20 | `mare.js` | ghiaccio marino: 2,2 W/m/K, 85% del sale respinto, albedo 0,60 | b | M | doppione di `leggi.CLIMA.albedoGhiaccio 0,62` (f) |
| MR21 | `mare.js` | il mare esiste solo per l'acqua: niente mari di idrocarburi, ammoniaca, lava, CO₂ | c | M | `chimica.pressioneVapore(T, f)` ha già 11 liquidi |
| MR22 | `mare.js` | laghi e fiumi: l'acqua dei fiumi ha una composizione media; il fiume non è un luogo (sezione, corrente, barre) | h | M | H19 |

## 11. La chimica — `chimica.js`, `molecole*.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| CH1 | `chimica.js:34` `TAVOLA` | 15 elementi | c | A | `molecole_atomi.js` ne ha 37; `materia.js TAVOLA` una terza: **tre tavole degli elementi** (f) |
| CH2 | `chimica.js:71` `SPECIE` | 41 molecole con ΔH, S: «ciò che non è nell'elenco, in quel mondo non può esistere» | c | A (aria, mare, minerali) | `molecole.js` (chimica generale) **non collegata**: nessun modulo la importa |
| CH3 | `REAZIONI`, `EVAPORAZIONE` (11 liquidi) | elenchi | c | M | idem |
| CH4 | `:248` `NEI_GHIACCI {C 0,3; N 0,1; S 0,3}`, `ZOLFO_IN_ARIA 10⁻³`, `FE_NEI_SILICATI 0,15` | ripartizioni fisse | a, b | A (inventario dei volatili ⇒ aria) | condensazione nel disco a T(r) (DS13); ripartizione metallo–silicato |
| CH5 | `SERRA` `:347` esponente 0,39; k di H₂O, CO₂, CH₄; urti 3,1·10⁻⁶ a 94 K; `vaporeInBasso 0,25` | **tarati su Terra, Venere, Titano** | a, b | A (T di ogni pianeta) | trasferimento radiativo a k correlati / tabelle OLR(T, pCO₂) |
| CH6 | `TRASPARENTI` | sei gas dichiarati trasparenti | c | B | CIA N₂–N₂, H₂–H₂ in parte nella voce «urti» |
| CH7 | `climaEAria` | cascata di rami: ghiaccio → liquida → vapore → termostato (bisezione su CO₂) → gelo | e | A | il termostato sceglie «la CO₂ minima che tiene aperto il mare»: è un'ottimizzazione, non la storia (isteresi: G1) |
| CH8 | `D_MANTELLO, D_BASALTO` «tarati perché il mantello della Terra dia…»; `F_BASALTO 0,1; F_GRANITO 0,2` | coefficienti di ripartizione d'insieme e gradi di fusione fissi | a, b | A (minerali ⇒ colore, mare, materia) | termodinamica della fusione (MELTS) o diagrammi precalcolati; F dal profilo termico (GE2) |
| CH9 | `chimica.js` `VOLATILI_RIMASTI 0,25, FERRO_TERRA 0,33, CONTINENTI 0,3` | `VOLATILI_RIMASTI 0,25, FERRO_TERRA 0,33, CONTINENTI 0,3` | a | M | `CONTINENTI 0,3`: la frazione vera la dà `tettonica.js` (f) |
| CH10 | `minerali()` + `FORMULE`, `COLORI` | norma su ~12 minerali con colori RGB | c | A | elenco chiuso di minerali (regola 2); il colore dovrebbe venire dallo spettro di riflettanza |
| CH11 | `prebiotica()` `:519` rese di Miller–Urey, `RESA_OSSIDATA`, `MEZZA_RESA 0,3`, `SOGLIA_FORMOSIO 0,01` | «LEGGE EMPIRICA (non calcolata)» + soglia | b, e | M | `molecole_rete.js` (rete di reazioni dal luogo) e `risalita.energiaPerLaChimica` (fulmini, UV, radioattività veri): entrambi non collegati |
| CH12 | `cosmo.js:232` `energia: flusso/1361` | l'energia per la prebiotica è la luce in unità terrestri | b, f | M | `risalita.js` |
| CH13 | `ROCCE.denudazione 3·10⁻⁵ m/anno`, `suolo 1 m`, `superficieGrani`, `invecchia 0,61`, `pCO2suoli` | alterazione: numeri terrestri | b, a | A (sali del mare, termostato del carbonio) | l'erosione calcolata in `geologia.js` (quanto si denuda **quel** pianeta) non entra (f) |
| CH14 | `MINERALI_ROCCIA` | velocità di dissoluzione di sei minerali (Palandri–Kharaka) | c, b | M | — |
| CH15 | `vulcani()` `co2DelCiclo()` | degassamento ∝ calore; `terre = 0,3`, `continenti` 0/1 | b, e | A | TT (flusso di crosta nuova) |
| ML1 | `molecole.js` e sette moduli | **scollegata**: nessun `import` da `cosmo`, `chimica`, `mare`, `mappa` | f | A | è «il primo passo» della regola 2; `reteDelLuogo`, `cheCosaChiede` esistono e nessuno li chiama |
| ML2 | `molecole_atomi.js` | elementi 1–36 + Mo | c | M | manca il resto della tavola oltre il cripton (tranne Mo): niente iodio, argento, tungsteno, terre rare, attinidi; i radioelementi di `materia.js` (U, Th, Rb) non hanno chimica |
| ML3 | `molecole*.js` | liberi dichiarati: κ = 2,6; dielettrico 8r; +0,5 kJ/mol; 30× superfici; 10^(1,5·carica); tre numeri di `logKComplesso`; area delle teste | a | M | QEq completo, PB/GB tarato |
| ML4 | `molecole*.js` `INTRINSECHE` | una barriera di Marcus per famiglia | b, c | A (ogni velocità di reazione: «10 kJ/mol = fattore 50») | stati di transizione: semiempirici (xTB/GFN) fuori linea |
| ML5 | `molecole*.js` | nove (+rare) famiglie di reazioni | c | A | la chiusura dipende dalle famiglie: pericicliche, radicali, riarrangiamenti mancanti |
| ML6 | `molecole*.js` | la rete «fa reagire ogni specie solo con le molecole piccole e taglia per taglia, ΔG e velocità» | e, a | M | — |
| ML7 | `molecole*.js` | copia su stampo, ripiegamento, catalisi covalente: «vietato o sbagliato» | h | A (verso la vita) | campi di forza con solvente; dichiarato |
| ML8 | `molecole*.js` | 75 termini di legame da 89 molecole; idratazione da 70 | b (regressione) | M | — |
| ML9 | `molecole*.js` | niente radicali, stati eccitati espliciti, isotopi | c | M | fotochimica dell'aria (MT13) |

## 12. Roccia, materia, particelle — `rocce.js`, `materia.js`, `mondo.js`, `unita.js`, `nebbia.js`, `fluidi.js`, `mappa.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| RC1 | `mappa.js:583–587` `rocciaDi` | **che roccia c'è**: catena di cinque casi (neve / sale / bagnato → sedimento / continente → «granito» / altrimenti → «basalto») | c, e | A (tutto ciò che sta sotto la tessera) | storia termica e di pressione del punto: assente. Niente rocce metamorfiche, sedimentarie litificate, calcari, arenarie, argilliti, brecce d'impatto, regolite, suolo |
| RC2 | `mappa.js` `raffreddamento: 0,003` (continente), `0,15` (basalto); `larghezzaM` 0,04 / 0,004 / 0,02 / 0,02 + 0,3e | velocità di raffreddamento e scala **scritte a mano per tipo** | a | A | profondità di messa in posto, flusso di calore; la grana vera viene da I(T), G(T) dimensionali |
| RC3 | `rocce.js tammann`, `cristallizza` | unità adimensionali (celle, «velocità critica»); VFT empirica | b, a | M | nucleazione classica con σ, ΔS_f, viscosità del fuso di quella composizione (Giordano 2008) |
| RC4 | `GRANITO`, `BASALTO` | due ricette di minerali con «anisotropia» e colori osservati | c | M | `chimica.minerali` le sostituisce quando c'è (collegato) |
| RC5 | `nakaya()` | diagramma di Nakaya (misurato) → parametri dell'automa di Reiter | b | B | cinetica di attaccamento (Libbrecht): non derivabile dai principi oggi |
| RC6 | `mappa.js:584` `umidita: 0,86 + 0,14·(seme % 97)/97` | l'umidità del fiocco è un sorteggio | d | B | `meteo.js` ha l'umidità di quel punto (f) |
| RC7 | `rocce.js` `sedimento()` | `energia = log10(1 + flusso)/4`; «gli ambienti energici sono i più incostanti» (ipotesi) | b, a | M | idrogramma vero (pioggia di `meteo`, portata di `geologia`), Shields in unità vere |
| RC8 | `fratture()` | poligoni da contrazione: modello a soglia | b | B | — |
| RC9 | `rocce.js` | **salto di scala**: tessera più fine ≈ 10 m per cella; roccia 4 mm–32 cm | h | A | mancano: affioramento, massi, ghiaia, suolo, regolite (H21) |
| RC10 | `rocce.js` | la roccia è una sezione 2D; i cristalli «si richiudono come piastrelle» | g | B | — |
| MA1 | `materia.js MATERIALI` (15), `RETICOLI` (8), `ACCESSORI`, `AI_BORDI` | elenchi di minerali, celle, accessori (zircone 0,03%…) | c | A | qualunque minerale dalla sua cella (banche dati cristallografiche aperte: COD) |
| MA2 | `materia.js:473` `PHI = 0,55 GV` | modulazione solare per ogni stella («non la sappiamo calcolare») | b, f | M (raggi al suolo, C-14, dose) | vento stellare (ST8, `risalita.ventoStellare`) |
| MA3 | `materia.js` | spettro interstellare di Burger–Usoskin per ogni galassia e ogni posto | b, f | M | `galassie.js` dà supernove, resti, getto; `cosmo.cieloDeiRaggi` pesa le sorgenti: **tre descrizioni dei raggi cosmici** non unite |
| MA4 | `materia.js` `RESA_MUONI` | `LAMBDA_ATT 1,4`, sciame «scheletro» (Heitler) | b | M | cascata vera (equazioni di cascata 1D: MCEq) |
| MA5 | `materia.js` | ricottura: «soglia netta» (110, 240, 150, 50, 300 °C) | e | M | Ketcham (ventaglio), dichiarato |
| MA6 | `materia.js` | granello dell'alone: evento tra 1 e 6 µm; tracce massime; compressione del tempo | d, a | B | — |
| MA7 | `materia.js` | K/U = 17 000 fisso; U, Th delle condriti (LG7) | b | M | GX11 |
| MA8 | `materia.js` | «la roccia dei continenti risale per erosione solo dove ci sono placche» | e | B | `geologia.erosione` (profondità erosa: non letta: f) |
| MA9 | `materia.js` | catene in equilibrio secolare; «la stessa crosta per tutto il pianeta» (in `risalita`) | b | B | — |
| MA10 | `materia.js` | incanalamento: modello continuo senza perdita d'energia | b | B | — |
| MN1 | `mondo.js` | il motore delle particelle è **un piano**: B ⟂, decadimenti e urti in 2D, niente moto lungo il campo (rimbalzo tra i poli, deriva) | g | A (regioni, fasce, finestre, materia) | 3D: stessa integrazione di Boris; i decadimenti in 3D sono più semplici (isotropi nel centro di massa) |
| MN2 | `unita.js catalogoVero` | 13 specie; canali del protone: cinque liste fisse («nasce il primo per cui l'energia basta») | c, e | A | niente kaoni carichi, iperoni, antiprotoni, deutoni, nuclei, risonanze; il bersaglio è «un neutrone», il nucleo è ossigeno |
| MN3 | `figli: angolo [da, a], quota [da, a]` | angoli e quote sorteggiati in intervalli (mondi senza relatività) | d, a | B (resta per i mondi vecchi) | — |
| MN4 | `mondo.js` | niente forze tra particelle, niente campo elettrico, niente irraggiamento di sincrotrone, niente diffusione Compton/fotoelettrico nel motore | h | M | — |
| MN5 | `mondo.js` | la gravità: masse ferme, deflessione doppia per la luce | b | B | — |
| MN6 | `mondo.js` `LEGGI` | quattro leggi con interruttore | c | B | la forza forte e la debole entrano solo come catalogo di esiti |
| NB1 | `nebbia.js:52` | 1,7·10⁻⁴ e 20 per m³; `conteggioVero` tutto o niente | a, e | B | CS20 |
| FL1 | `fluidi.js flussoInterno` 0,09·M/R² | terza legge del calore, usata solo dai test | f | B | da togliere |
| FL2 | `fluidi.js` | Swift–Hohenberg per la pozza | b | B | Navier–Stokes–Boussinesq 2D costerebbe poco a questa scala |
| MP1 | `mappa.js` `fondoStelle` | stelle di sfondo con seme fisso 7 | d | B | il cielo vero: le stelle del catalogo viste da lì (H22) |
| MP2 | `laboratorio.js` | `Math.random` (dado, ricerca) | d | B | regola 1 |
| MP3 | `mappa.js` | salti di scala galassia/sistema/pianeta sulla mappa piatta | g | M | `src/tre` (motore 3D) li toglie: in lavorazione |
| TR1 | `src/tre/pianeta.js` | nuvole: copertura da `meteo`, «la forma minuta è un rumore che il vento trascina» | d | B | — |
| TR2 | `src/tre/pianeta.js` | aria: Rayleigh + «foschia» | b | M | la foschia non ha una sorgente (aerosol: MT14) |
| TR3 | `src/tre` | non è usato da `index.html`; `scenaGalassia`, `scenaCosmo` hanno il tempo, il pianeta no | g, f | M | — |

## 13. Ciò che il piccolo fa al grande — `risalita.js`

| sigla | dove | che cos'è | specie | peso | legata a |
|---|---|---|---|---|---|
| RS1 | tutto `risalita.js` | **non importato da nessun modulo** (solo `test/test_risalita.mjs`): ionizzazione, fulmini, azoto fissato, radiolisi, gas radiogenici, vento stellare, dose, supernova vicina, tempi caotici | f | A | `chimica.atmosfera` (Ar-40, He, N fissato), `chimica.prebiotica` (energie), `cosmo.fascia` (magnetopausa), `meteo` (nuclei, fulmini) |
| RS2 | `risalita.js` `RESA_FULMINI 1,08·10⁻⁶` | (fissata sulla Terra), `QUOTA_IONIZZAZIONE 0,6` (scelta perché venga 25) | a | M | elettrificazione delle nubi (non ricavabile semplicemente) |
| RS3 | `risalita.js` | gas usciti dall'interno: 0,5 / 0,25 / 0,02 secondo il regime tettonico | e, a | M | flusso di magma (GE7) |
| RS4 | `risalita.js` `ECCESSO_ESOSFERA 4` | `RESA_AURORE 1%`, `POROSITA 1%`, «cinque giri», «dieci giri» | a | M | termosfera (bilancio XUV–conduzione) |
| RS5 | `risalita.js` | vento della stella = Sole scalato, Ṁ ∝ t^−2,33 [R] | b, i | M | ST8 |
| RS6 | `finDoveRisale`, `FAMIGLIE` | dicono dove un evento può risalire; nessun modulo li interroga quando si chiede un ramo | f | M | regola 3 |

## 14. Livelli e oggetti assenti (specie h), scala per scala

Per ognuno: che cosa manca, dove dovrebbe stare nel codice, quali livelli collegherebbe (sopra ↔ sotto, accanto,
prima ↔ dopo), e che cosa c'è già che gli fa da appiglio.

| sigla | che cosa manca | tra quali livelli | appiglio che c'è già | peso |
|---|---|---|---|---|
| H1 | **Ammassi, gruppi, filamenti fini, vuoti**: sotto 50 Mpc il campo non ha struttura (`cosmo3d.js` kmax = 24) | cosmo ↔ galassia; accanto: galassie vicine vere che si fondono (oggi GX5 le sorteggia) | realizzazione vincolata di `cosmo3d.js`; funzione di massa di Press–Schechter per la nebbia | A |
| H2 | **Materia oscura come cosa** (aloni, sottoaloni, satelliti) e **gas tra le galassie** (mezzo intergalattico, gas caldo d'ammasso, reionizzazione) | cosmo ↔ galassia; prima: la reionizzazione spegne gli aloni piccoli (GX15) | `galassie.js` ha massa, concentrazione, gas caldo dell'alone come numeri, non come luoghi | M |
| H3 | **Nubi molecolari, regioni di formazione stellare, ammassi stellari e associazioni** | galassia ↔ stella: è il livello che darebbe IMF (LG6), binarie (ST13), massa e momento angolare del disco (DS2), irraggiamento dei vicini (DS3), radionuclidi a vita breve (²⁶Al ⇒ calore dei planetesimi) | `galassie.js` ha Σ_gas, Q, bracci per anello; `densitaGalassia()` dà gas e polvere continui | A |
| H4 | **Nebulose, regioni H II, resti di supernova, nebulose planetarie, bolle** come luoghi visitabili | galassia ↔ stella; dopo: arricchimento locale (oggi Z è per anello) | `galassie.js` ha i resti (Sedov, età, posto) come sorgenti di raggi cosmici | M |
| H5 | **Campo magnetico e mezzo interstellare della galassia** (fasi del gas, polvere, estinzione), propagazione dei raggi cosmici | galassia ↔ regione di particelle (CS18, MA3) | `LEGGI.polvere`, `spessoreGas`; `risalita.supernovaVicina` (diffusione) | M |
| H6 | **Vicinato stellare**: le stelle a pochi parsec da quella guardata (il cielo notturno vero, incontri ravvicinati, nube di Oort disturbata) | galassia ↔ sistema | il catalogo è un campione con peso 10⁸: nessuna stella vicina vera. La densità locale c'è | M |
| H7 | **L'interno della stella come luogo** (profili T, ρ, zone convettive: `stelle.dentro()` li calcola ma nessuna vista li usa), **fotosfera, granulazione, macchie, brillamenti, corona, vento, ciclo di attività** | stella ↔ pianeta (XUV e vento ⇒ fuga dell'aria, modulazione dei raggi cosmici MA2, aurore, fotochimica) | `stelle.js dentro`, `orbite.asseStella` (rotazione), `risalita.ventoStellare` | A |
| H8 | **Stelle doppie e multiple**, trasferimento di massa, novae, binarie X, kilonove | galassia ↔ stella ↔ disco (pianeti circumbinari), sorgente di Ia (oggi legge dei ritardi) e di elementi r | nessuno | A |
| H9 | **Giganti rosse, AGB, nebulosa planetaria; supernova come evento visibile; stelle di neutroni, pulsar, magnetar, buchi neri con disco e getti come luoghi** | stella nel tempo; resto ↔ regione di particelle (il README promette «le spirali torneranno vicino alle stelle morte magnetiche») | `stelle.fine` dà massa, raggio, B del resto; `galassie.js` periodo e spinta delle pulsar; `mondo.js` regge campi qualsiasi | A |
| H10 | **Il buco nero centrale come luogo**: disco di accrescimento, getto, stelle S | galassia ↔ particelle | `G.forma.buco` (massa, acceso, getto) | M |
| H11 | **Disco protoplanetario come luogo e nel tempo** (lo si vede solo come storia compiuta); dischi di detriti, polvere zodiacale | stella ↔ pianeta; prima ↔ dopo | `disco.js disco()` (Σ, T, neve) | M |
| H12 | **Corpi minori come oggetti**: asteroidi, comete (chioma, coda), fasce, troiani, nube lontana, pianeti nani, meteore, meteoriti al suolo | sistema ↔ pianeta (impatti come eventi che hanno un proiettile con una storia) ↔ roccia (meteoriti: condriti con calcoli di `materia.js`) | `impatti.js`: 40 classi di taglia per nube, fasce orfane, comete: popolazioni, non oggetti | A |
| H13 | **Giganti gassosi**: fasce e zone, getti, tempeste (macchie), nubi a strati (NH₃, NH₄SH, H₂O), interno (idrogeno metallico, nucleo diluito, pioggia di elio), calore proprio | pianeta ↔ aria; interno ↔ campo (GE8), ↔ rotazione (RO1), ↔ lune (LU2) | `leggi.clima` li liquida in una riga (LG22); `geologia.interno` in due (GE8) | A |
| H14 | **Mondi di ghiaccio e lune come mondi**: gusci, oceani interni, criovulcani, pennacchi, tettonica del ghiaccio, atmosfere tenui | pianeta/luna ↔ superficie | `lune.js stato()` (oceano sì/no), `leggi.acquaInSuperficie` (guscio) | A |
| H15 | **L'interno del pianeta come luogo**: profilo ρ(r), P(r), T(r), fasi dei minerali (olivina→wadsleyite→bridgmanite, ghiacci ad alta pressione), nucleo interno, pennacchi, celle | pianeta ↔ roccia/cristallo (materia a pressione) | `geologia.interno` (tre numeri), `tettonica.mantello` (celle 2D) | A |
| H16 | **Vulcani che eruttano** (tipi di eruzione da viscosità e volatili, colate, caldere, cenere, province basaltiche), **terremoti**, faglie | interno ↔ superficie ↔ aria (gas, aerosol) ↔ clima; evento (regola 3) | `geologia` vulcani = punti rossi a caso; `chimica.vulcani` flussi medi | A |
| H17 | **Ghiacciai e calotte che scorrono** (bilancio di massa, flusso di Glen, valli a U, morene, livello del mare glaciale) | clima ↔ rilievo ↔ mare | `cl.freddo` (parte dell'anno sotto zero) è solo una tinta | A |
| H18 | **Il tempo che fa**: perturbazioni, fronti, cicloni tropicali, temporali, fulmini come eventi, nebbie, ciclo giorno–notte, stagioni vissute (istantanee, non medie) | clima ↔ punto della superficie ↔ istante | `meteo.js` simula decine di giorni ma restituisce solo medie; `risalita.fulmini`, `tempoMeteo` | A |
| H19 | **Forme del paesaggio da processo**: dune ed ergs, delta e conoidi, meandri e pianure alluvionali, frane e falde di detrito, carsismo e grotte, coste (falesie, spiagge, barriere), canyon sottomarini, permafrost | superficie (10 km–10 m) ↔ roccia | `geologia.erosione` (solo stream power + diffusione + deposito nei laghi) | A |
| H20 | **Suolo e regolite, falda, acqua nel sottosuolo** | roccia ↔ aria ↔ acqua; sede dell'alterazione (CH13) e della chimica prebiotica | `ROCCE.suolo = 1 m` fisso; `meteo.secchio` | A |
| H21 | **Tra 10 m e 4 cm**: affioramenti, stratificazione e giacitura, massi, ciottoli, ghiaia, sabbia come popolazione di grani (granulometria, arrotondamento), increspature, fango screpolato in posto | tessera ↔ `rocce.js` | `rocce.sedimento`, `fratture` (immagini 2D senza posto nel terreno) | A |
| H22 | **La luce**: spettri (stella, aria, superficie), colore del cielo e tramonti da Rayleigh/Mie con i gas veri, ombre, eclissi, fasi, luce cinerea, aurore, arcobaleni, colori di minerali e liquidi dallo spettro, righe di assorbimento; trasporto della radiazione che lega clima, fotochimica e vista | stella ↔ aria ↔ superficie ↔ occhio (regola 10); atomo/molecola ↔ colore | `src/tre/pianeta.js` (Rayleigh RGB), `mare.js OTTICA` (3 bande), `chimica.COLORI` (RGB a mano), `molecole.fotoni` (soglie UV) | A |
| H23 | **Il suono e le onde meccaniche**: velocità del suono in aria, acqua, roccia; onde sismiche; tuono | materia ↔ luogo | `risalita.finDoveRisale` usa il suono come velocità di propagazione | B |
| H24 | **Oceano profondo**: colonna d'acqua, termoclino, circolazione di fondo, sorgenti idrotermali come luoghi (camini, gradienti: la sede della chimica di `molecole_rete`), sedimenti di fondo | mare ↔ roccia ↔ chimica | `mare.sorgentiCalde`, `fluidoCaldo` (composizione); `scatole` in `molecole_rete` | A |
| H25 | **Tra molecola e granello** (1 nm–100 µm): colloidi, argille (lamelle, cariche, doppio strato), micelle, vescicole e membrane, coacervati, gocce, bolle, aerosol, superfici minerali con adsorbati, pori | molecola ↔ sedimento/suolo/acqua; sede delle «scatole» prebiotiche | `mare.campioneAcqua` (argille come dischi, fiocchi: Schulze–Hardy), `molecole.anfifiliche`, `aggregazione`, `superficie`, `atomi3d.scenaDoppioStrato` | A |
| H26 | **Stati della materia e transizioni come regola**: diagrammi di fase di sostanze qualsiasi (oggi solo acqua + 11 curve di vapore), vetri, soluzioni solide, polimorfi | molecola ↔ materiale | `chimica.pressioneVapore`, `rocce.tammann` | M |
| H27 | **Nuclei e particelle oltre il catalogo**: tavola dei nuclidi (oggi le sole catene di U, Th, K, Rb, C-14), nucleosintesi (BBN, s, r) come sorgente delle abbondanze (oggi tabella del Sole × Z), kaoni/iperoni/antimateria, neutrini come corpi, sezioni d'urto da tabelle, QED/QCD ovviamente no | particella ↔ atomo ↔ stella ↔ galassia (rese) | `materia.CATENE`, `unita.catalogoVero`, `stelle.js` (pp, CN) | M |
| H28 | **L'inizio**: inflazione/spettro primordiale → BBN (Y = 0,247 è un dato) → ricombinazione → età oscure → prime stelle | prima ↔ cosmo | `risalita.fluttuazioniDellInizio` (testo), `COSMO` | M |
| H29 | **La vita** (solo come elenco di ciò che le regole dovrebbero permettere): reti autocatalitiche in un luogo vero, compartimenti che crescono e si dividono, polimeri che si copiano con errore, accoppiamento a un gradiente (redox, pH, luce), selezione; poi: metabolismi che cambiano l'aria (O₂, CH₄), il mare (calcare, silice), il suolo, l'albedo (vegetazione) | chimica ↔ luogo ↔ tempo ↔ pianeta intero | `molecole_rete.autocatalitici`, `raf`, `anfifiliche`, `copia`, `ripiega`; `chimica.prebiotica`; README: «nessun verde» | A |
| H30 | **Ciò che una civiltà farebbe** (il README lo nomina: «un laboratorio, se una civiltà nascerà dalle regole») | — | fuori portata; si elenca solo | B |

## 15. Dati «ricordati» o non verificati che reggono risultati (specie i)

| sigla | dove | dato | che cosa regge | stato |
|---|---|---|---|---|
| I1 | `galassie.js:66–68` | Λ(T, Z): frenamento 2,4·10⁻²⁷√T, elio 5·10⁻²³(T/10⁵)^−1,5, metalli 1,6·10⁻¹⁹ Z/√T «a memoria» | quante stelle fa ogni alone | da sostituire con tabella |
| I2 | `stelle.js:61` `elioBucoNero: 7` | confine NS/BH «citato a memoria» | resti, rese, sorgenti di raggi | Fryer 2012 [V] nel rapporto precedente |
| I3 | `lune.js` μ = 2·10⁻⁴ (Canup–Ward) | massa delle lune regolari | lune, anelli | [R] nel rapporto precedente |
| I4 | `disco.js` `tempoCrescita` 1,2·10⁵, `tempoInvolucro` 10⁹·M⁻³, Chambers b, c | crescita, giganti, urti | nessuna marca di verifica nel codice |
| I5 | `tettonica.js` profondità–età 2500 + 350√t; `crostaAttesa` | quote degli oceani | senza fonte citata |
| I6 | `risalita.js` 25 voci [R]: ricombinazione degli ioni, mobilità, circuito globale, 10⁹ J per fulmine, UV solare < 200 nm, tabella di Miller–Urey 1959, Ar-40, He, vento solare e Ṁ ∝ t^−2,33, sputtering, Q medio, diffusione galattica 3·10²⁸, Gehrels 2003, Lyapunov dei corpi piccoli | tutto `risalita` (non ancora collegato) | marcati nel file |
| I7 | `molecole_energia.js:51, 118, 131, 270, 351, 375, 387, 390`; `molecole_reazioni.js:44` | energie di dissociazione, idrolisi dei fosfati (Alberty, Jencks), ΔG di trasferimento, entalpie di ionizzazione, log K dei complessi «tarata a occhio», raggi di Shannon | pKa con T, ATP, complessi dei metalli | marcati nel file |
| I8 | `materia.js:61–62` | ricottura della biotite ~150 °C, aloni ~300 °C «incerta» | memoria dei minerali | dichiarato |
| I9 | `meteo.js` `stabilitaSecca 0,8` (Marte 0,55, Venere 0,8–0,9) | climi secchi | senza fonte |
| I10 | `geologia.js` 3·10⁻⁵ m/anno, «30 m per milione di anni»; `chimica.ROCCE.denudazione` | crateri visibili, sali | senza fonte nel codice |
| I11 | `anelli.js` potenziale del grano 5 V; n(s) ∝ s⁻³ | pioggia dell'anello | senza fonte puntuale |
| I12 | rapporto precedente: oceano (Munk, Sverdrup), migrazione di tipo I, Cortial, Tout 1996, K di Kanagawa, tassi di occorrenza dei giganti | tutte le adozioni 5, 7, 9 | [R] là: riprese in «Come farlo emergere.md» |

## 16. Fermo nel tempo e piatto: il quadro (specie g)

| livello | ha una storia dentro? | la si può guardare a un tempo t? | dimensioni | voci |
|---|---|---|---|---|
| cosmo | no (campo di oggi; `cosmo3d` lo fa crescere con D(t)) | sì solo in `spazio3d.statoCosmo` (Zel'dovich) | carta 2D + z evento; 3D in `cosmo3d` | CS6, CS26, CS27 |
| galassia | sì (46 passi) | sì in parte: `galassiaAlTempo` | disco di faccia; 3D in `motoStella` | GX8, GX10 |
| stella | sì (tabella per età) fino alla fine della sequenza principale | sì (`stella(M,{eta})`); dopo no | 1D radiale | ST9 |
| disco e pianeti | sì (strisce, gas, urti) | no: solo l'esito | 1D radiale | DS17, H11 |
| impatti | sì (cascata, eventi con data) | sì per gli eventi (`storiaImpatti`), no per la superficie | — | — |
| rotazione, lune, anelli | sì (integrate) | no: solo oggi | — | RO5, AN5 |
| orbite | no (elementi fissi) | sì come Keplero puro | 3D | OR1 |
| interno | **no** (q di oggi da una formula) | no | 0D | GE2, TT9 |
| tettonica | sì | no (stato finale; primi anni «saltati») | carta 2D piana | TT10, TT11 |
| clima | no (regime di oggi; 14 anni di rilassamento) | no; stella giovane, CO₂ passata, continenti passati assenti | 2D lat-lon, 1 strato | LG24, LG25, G1 |
| aria | no (decine di giorni, medie) | no | 2 strati | MT8, MT11 |
| erosione | «passi» senza orologio, clima di oggi | no | 2D | GE22 |
| mare | bilancio integrato sull'età con il mondo di oggi | `mareAl` (anno, marea) sì; storia no | 1 strato | MR3, MR19 |
| roccia | cresciuta in un tempo adimensionale | no | 2D | RC3, RC10 |
| materia (tracce) | sì (memoria per l'età della roccia) | sì | piano | MN1 |
| particelle | sì | sì | **piano** | MN1, CS25 |

**G1 (voce riassuntiva, peso A).** Il clima e tutto ciò che ne discende (aria, pioggia, erosione, sali del mare,
ghiaccio, chimica prebiotica) sono calcolati una volta sola, con la stella, l'orbita, i continenti, l'aria e il
calore interno di oggi. `stelle.stella(M, {eta})` (Sole giovane −27%), `tettonica` (continenti nel tempo),
`leggi.caloreDellaRoccia(età)`, `impatti` (date) hanno il tempo: nessuno lo passa a valle.

## 17. La mappa dei collegamenti (letta dagli `import` e dalle chiamate)

Ingressi e uscite veri di ogni modulo. **In grassetto i fili mancanti**: uscite calcolate che nessun modulo legge,
o ingressi che il modulo assume fissi mentre un altro modulo li calcola.

| modulo | riceve da (ingressi veri) | dà a (chi lo usa) | fili mancanti |
|---|---|---|---|
| `leggi.js` | niente | tutti | **`stella()` e `fine()` vecchie ancora usate da `mare.js` e `risalita.js`**; `bilancioPerFasce`, `mareAtteso` esportate e usate solo dentro |
| `eventi.js` | — | `cosmo`, `galassie`, `anelli`, `mare`, `materia`, `intreccio`, `spazio3d`, `cosmo3d`, `atomi3d`, `mappa`, `molecole_forze/incontri`, `risalita` | **`disco`, `lune`, `rocce`, `geologia`, `tettonica`, `fluidi`, `mondo` usano ancora generatori propri da un seme** (CS7) |
| `cosmo.js` | `galassie`, `stelle`, `disco`, `impatti`, `rotazione`, `lune`, `anelli`, `geologia.interno`, `chimica.climaEAria/prebiotica/minerali`, `mondo`, `unita`, `spazio3d` | `mappa`, `laboratorio`, `biblioteca`, `nebbia`, `spazio3d`, worker | **non passa `calore` a `climaEAria` (ciclo del carbonio spento)**; **non passa `giorno` a `interno` (dinamo senza rotazione)**; **non chiama `risalita`, `molecole`**; il campo di `cosmo()` non usa `COSMO.sigma8/ns` |
| `cosmo3d.js` | `leggi.COSMO`, `galassie.COSMOLOGIA`, eventi | `spazio3d` | **il suo asse di spin non torna a `galassie.formaGalassia` (GX6)**; **la carta di `cosmo.js` non è la sua proiezione** |
| `galassie.js` | `leggi` (COSMO, IMF), `stelle` (vite, resti), eventi; `G.peso` e vicini da `cosmo` | `cosmo` (forma, catalogo, sorgenti), `spazio3d`, `cosmo3d` | **Z unico: niente abbondanze per elemento a `chimica.abbondanze`, `leggi.ISOTOPI`**; **le sorgenti di raggi non danno lo spettro a `materia.raggiCosmici`** |
| `stelle.js` | `leggi` (costanti), `stelle_tabella` | `galassie`, `cosmo`, `disco`, `lune`, `anelli`, `impatti`, `spazio3d` | **`dentro()` (profili interni) non usato**; **nessuna uscita XUV/vento/attività**; **L(t) non usata dal clima** |
| `disco.js` | `stelle.stella`, `chimica.SOLE`, seme | `cosmo`, `impatti`, `rotazione` | **non riceve l'ambiente di nascita (H3)**; **`formazione.orfani` e masse d'acqua non tornano a `leggi.acquaInSuperficie`**; non riceve `impatti` (massa finale) |
| `impatti.js` | `disco` (formazione, leggi), `lune` (materiali), `chimica.MOLECOLE`, `tettonica.COSTANTI`, `stelle` | `cosmo` (urto, storia pigra), `rotazione`, `geologia` (impronta, crateri) | **volatili consegnati ↛ aria e mare**; **grandi impatti ↛ clima**; **flusso di micrometeoriti ↛ anelli** |
| `rotazione.js` | `disco`, `impatti`, `lune.tempoBlocco` | `cosmo`, `spazio3d` | **giorno ↛ dinamo (`geologia.interno`)**; **non riceve la marea termica dell'aria né la marea oceanica di `mare.js`** |
| `lune.js` | `leggi`, `stelle`, seme; `P.clima` (per k₂/Q), urto | `cosmo`, `anelli`, `rotazione`, `impatti`, `mare` (maree) | **calore mareale calcolato solo per le lune, non per i pianeti (↛ `interno.q`)**; **lune senza superficie** |
| `anelli.js` | `lune`, `leggi.clima`, `stelle`, eventi | `cosmo` → `pianeta`, `nebbia`, regioni | **non riceve il flusso di meteoroidi di `impatti`**; **pioggia dell'anello ↛ aria del pianeta** |
| `orbite.js` / `spazio3d.js` | `cosmo`, `rotazione`, `galassie`, `cosmo3d`, `stelle` | `cosmo.motiDi`, `src/tre` | **elementi fissi: nessuna teoria secolare ⇒ nessun ciclo di Milanković al clima** |
| `geologia.interno` | `P` (massa, raggio, ferro), `stella` (età, Z), `leggi.caloreDellaRoccia` | `cosmo` (B0, tettonica, q), `mare`, `chimica` (via `mare`) | **non riceve: giorno, T di superficie, marea, storia degli impatti (calore iniziale)**; **q(t) non esce** |
| `tettonica.js` | q, raggio, nucleo, età, seme, impronta degli urti | `geologia.superficiePianeta`, `mare` (costanti), `impatti` (costanti) | **non riceve clima né erosione vera; non dà la sua storia** (solo lo stato finale); **le celle del mantello ↛ posto dei vulcani** |
| `geologia.superficiePianeta` | `tettonica`, `impatti`, `chimica.minerali`, `P.clima` | `climaSuperficie`, `erosione`, `mare`, `mappa`, `materia` (via `mappa`) | **rilievo dei mondi senza placche = rumore** |
| `geologia.climaSuperficie` | `leggi` (pezzi del clima), `P.clima` (τ, D), `meteo` (nuvole, D) | `erosione`, `mare`, `mappa`, `meteo` (T, stagioni) | **↚ `mare.caloreDalMare`, `mare.albedo`**; **↚ L(t), CO₂(t), continenti(t)**; **↚ calore interno e mareale** (conta su mondi come Io) |
| `meteo.js` | `P` (aria, giorno), superficie, clima; `chimica.pressioneVapore/atmosfera` | `climaSuperficie` (2° giro), `erosione` (pioggia), `mare` (vento, evaporazione) | **le sue medie non tornano allo stato dell'acqua né all'aria di `climaEAria`**; **`pioggiaFine` ↛ tessere**; **nessun tempo istantaneo in uscita** |
| `geologia.erosione` / `tessera` | superficie, clima, pioggia di `meteo` | `mappa`, `mare` (fiumi, laghi, sedimenti), `src/tre` | **↚ litologia (`chimica.minerali`)**; **denudazione calcolata ↛ `chimica.ROCCE.denudazione` (alterazione)**, **↛ `tettonica` (isostasia)**, **↛ `materia` (esumazione)**; **nessun tempo** |
| `mare.js` | `chimica` (rocce, vulcani, CO₂, aria), `tettonica.COSTANTI`, `lune.maree`, `P.interno`, superficie erosa, clima, `meteo` (in `cl.meteo`), eventi | `mappa`, worker, `src/tre` | **`caloreDalMare`, `albedo`, `carbonioAria.pCO2Ciclo` ↛ clima e aria**; **marea oceanica ↛ `rotazione`/`lune`**; **`sorgentiCalde`, `fluidoCaldo` ↛ `molecole_rete`** |
| `chimica.js` | `leggi` (clima, costanti) | `cosmo`, `geologia`, `mare`, `meteo`, `disco` (SOLE), `impatti`, `risalita` | **`prebiotica` ↚ `risalita` (energie vere)**; **`MOLECOLE` (41) ↚ `molecole.js`**; **`minerali` ↚ T e P di formazione** |
| `molecole*.js` | solo sé stessi (+ `eventi.numero`) | **nessuno** | **tutto**: `reteDelLuogo`, `cheCosaChiede`, `equilibrioGas`, `superficie(reticolo)` (il reticolo vero di `materia.js` lo deve passare chi chiama: oggi nessuno) |
| `rocce.js` | `mondo.generatore`, parametri a mano da `mappa.rocciaDi` | `mappa` | **↚ storia termica del punto, ↚ umidità di `meteo`, ↚ portata vera** |
| `materia.js` | `leggi.ISOTOPI`, eventi, `mondo.casoEvento`, `unita` | `mappa`, `laboratorio`, `risalita` | **↚ `galassie` (spettro e flusso dei raggi di quella galassia)**; **↚ vento della stella (modulazione)**; **↚ profondità erosa** |
| `mondo.js` / `unita.js` | cella (campi, specie, sorgenti) | `cosmo`, `materia`, `mappa`, `cercatore`, `vicini`, `inversa` | piano (MN1); catalogo a elenco (MN2) |
| `risalita.js` | `materia`, `leggi`, `chimica.rocceDelPianeta`, eventi, `intreccio.puoToccare` | **nessuno** (solo il test) | **tutto**: Ar e He all'aria, N fissato, H₂ da radiolisi alla chimica, magnetopausa alla fascia, dose al pannello, `finDoveRisale` ai rami |
| `nebbia.js` | `cosmo` (sistema, pianeta, fascia) | `mappa`, `laboratorio` | — |
| `fluidi.js` | — | `geologia` (import di `celle`), `laboratorio` (pozza) | **`flussoInterno` morto** |
| `src/tre/*` | `spazio3d`, `geologia.tessera`, `mare.coloraMare/ondeNelPunto`, `meteo` (via `cl`) | **non ancora l'app** (`index.html` non lo carica) | luce a 3 bande; nuvole di rumore |

**I fili mancanti più pesanti, in una riga ciascuno** (ripresi nel secondo documento):
1. `mare.caloreDalMare`, `mare.albedo` → `climaSuperficie` (MR1).
2. `interno.q` → `climaEAria({calore})` → CO₂ dell'aria; e `mare.pCO2Ciclo` → aria (MR2).
3. `stelle.stella(M, {eta: t})`, `tettonica(t)`, `q(t)` → clima(t) → erosione(t), mare(t) (G1).
4. `rotazione.giorno` → `interno` (dinamo) (GE5).
5. `molecole.reteDelLuogo` ← luoghi di `mare`/`materia`/`meteo`; → `chimica.prebiotica`, `chimica.MOLECOLE` (ML1, CH2).
6. `risalita.*` → `chimica.atmosfera`, `prebiotica`, `cosmo.fascia`, pannello (RS1).
7. `geologia.erosione` (denudazione, sedimenti) → `chimica.ROCCE` (alterazione), `tettonica` (carico), `materia` (esumazione) (CH13, TT7, MA8).
8. `impatti` (volatili, energia) → `leggi.acquaInSuperficie`, `chimica.atmosfera`, clima (IM8, IM9).
9. `galassie` (sorgenti, spettro, Z per elemento) → `materia.raggiCosmici`, `cosmo.cieloDeiRaggi`, `leggi.ISOTOPI` (MA3, GX11, LG7).
10. `cosmo3d` (spin, asse, vicini veri) → `galassie.formaGalassia` (GX6, GX5).
11. `lune.caloreMareale` e `mare` (marea oceanica) → `interno.q` e `rotazione` dei pianeti (RO2).
12. `meteo` (umidità, pioggia fine, adiabatica) → `rocce.fioccoDiNeve`, `tessera`, `immagineSuperficie` (RC6, GE28, GE18).

## 18. Il conto

328 voci. Per specie (ogni voce contata nella prima specie che porta):

| specie | voci |
|---|---|
| a — parametri liberi o tarati | 60 |
| b — leggi empiriche al posto del meccanismo | 75 |
| c — elenchi al posto di regole chiuse | 25 |
| d — sorteggi al posto di fisica | 41 |
| e — soglie nette | 23 |
| f — collegamenti mancanti | 20 (più i 12 fili della mappa, che le riassumono) |
| g — fermo nel tempo o piatto | 21 |
| h — livelli e oggetti assenti | 47 (30 nella tabella §14, 17 nei moduli) |
| i — dati ricordati | 13 |
| note senza specie (risultati sbagliati dichiarati, tabelle rigenerabili) | 3 |

Dove si addensano: `geologia.js` (30 voci: interno ed erosione sono i due moduli più «a formule»), `leggi.js` (25: il
clima di riserva), `cosmo.js` (28: il campo iniziale, le regioni, i raggi), `mare.js` (22), `disco.js` (18).
I moduli più puliti rispetto alla regola 2: `stelle.js` (un parametro libero, due leggi di opacità prese fatte),
`impatti.js`, `galassie.js` (molte leggi empiriche, ma tutte dichiarate e nessuna taratura sul risultato).

Tre cose che le intestazioni non dicono e il codice sì:
1. **Il ciclo del carbonio nel clima è spento per una chiamata**: `chimica.climaEAria` lo contiene, `cosmo.js` non
   gli passa `calore` (MR2). Il README dice «aria e mare sono un solo serbatoio di carbonio»: vale dentro `mare.js`,
   non per la temperatura del pianeta.
2. **Tre tipi di pianeta decidono troppo** (DS12): acqua tutta in superficie o al 4% (LG11), lune da urto o da disco
   (LU6), k₂/Q (RO2), albedo dei giganti (LG22), colore (CS9). La composizione continua c'è già.
3. **La roccia in fondo allo zoom è scelta da una catena di `if`** in `mappa.js rocciaDi` (RC1, RC2), con velocità
   di raffreddamento e scala scritte a mano: tra la tessera di 10 m e il cristallo non c'è nessuna legge.
