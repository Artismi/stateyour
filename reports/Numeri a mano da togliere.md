# Numeri a mano da togliere

Novembre 2026. Analisi soltanto: il codice dell'app non è stato toccato. Gli strumenti sono nuovi e stanno in `strumenti/misure/`:

- `numeri_classi.mjs` divide il registro di `numeri.mjs` in cinque classi, con le regole scritte in testa al file;
- `sensibilita.mjs` cambia i numeri uno alla volta su copie di `src/`;
- `sensibilita_uscite.mjs` calcola le uscite su cui si misura.

Le righe complete, numero per numero, sono in `Numeri a mano da togliere.csv`, qui accanto.

## 1. I totali

In `src/` ci sono 15 736 numeri non banali. Sono esclusi i banali e le tabelle generate da un programma (42 998 numeri). Il conteggio grezzo di `numeri.mjs` dà 1930 numeri con fonte, 373 con unità e 13 433 senza niente. La classificazione fine li divide così:

| classe | numeri | che cosa vuol dire |
|---|---:|---|
| costante | 942 | Una costante fisica o matematica riscritta (π, 180, 273,15, il kpc, R del vapore, le masse molari…). Dovrebbe venire da `leggi.js`, `unita.js` o dal registro. |
| legge | 2554 | Parametro di una legge con autore e anno, o con un DOI o un catalogo, sulla riga o nel commento sopra. Non si controlla che la fonte sia proprio di quella legge. |
| tabella | 3017 | Un dato misurato in una tabella, senza una fonte vera vicina. Non è una scelta, ma la fonte manca. |
| tecnico | 3667 | Interfaccia, colori, tempi in ms, griglie, cicli, tolleranze, arrotondamenti, numeri che il commento dichiara «numerici». |
| **a mano** | **5556** | **I veri parametri fisici scelti a mano.** Sono 221 con unità accanto e 5335 senza niente. |

Per gruppo di lavoro:

| gruppo | a mano | tabella | tecnico | legge | costante |
|---|---:|---:|---:|---:|---:|
| materia | 1150 | 812 | 695 | 719 | 176 |
| superficie | 1047 | 157 | 686 | 385 | 182 |
| chimica | 892 | 1603 | 286 | 633 | 134 |
| galassie | 834 | 64 | 538 | 500 | 97 |
| interfaccia | 616 | 68 | 997 | 34 | 171 |
| mare | 573 | 243 | 247 | 154 | 135 |
| stelle | 444 | 70 | 218 | 129 | 47 |

I 15 file con più numeri a mano:

| file | a mano | tabella | tecnico | legge | costante |
|---|---:|---:|---:|---:|---:|
| camera/mare.js | 561 | 243 | 241 | 153 | 122 |
| camera/materia.js | 342 | 413 | 141 | 238 | 92 |
| camera/atomi3d.js | 270 | 243 | 241 | 57 | 10 |
| camera/molecole_energia.js | 227 | 130 | 52 | 241 | 17 |
| camera/stelle.js | 213 | 55 | 92 | 52 | 3 |
| camera/mappa.js | 196 | 4 | 334 | 2 | 52 |
| camera/finestra.js | 188 | 83 | 95 | 129 | 23 |
| camera/galassie.js | 150 | 13 | 74 | 123 | 9 |
| camera/risalita.js | 149 | 22 | 33 | 0 | 33 |
| camera/chimica.js | 148 | 446 | 30 | 152 | 37 |
| camera/geologia.js | 134 | 3 | 48 | 18 | 20 |
| camera/lune.js | 114 | 3 | 23 | 20 | 6 |
| camera/relativita.js | 113 | 0 | 52 | 57 | 8 |
| camera/suolo.js | 109 | 70 | 80 | 59 | 40 |
| camera/cosmo.js | 108 | 0 | 40 | 0 | 20 |

Le regole sono grezze. Tre limiti noti:

1. una fonte nominata senza anno resta «a mano»: Kroupa, Mo, Mao e White, Winitzki;
2. una costante scritta in un'altra unità non viene riconosciuta: 0,055845 kg/mol per il ferro;
3. le date del progetto (anni dal 2025 in poi) non valgono come fonte.

## 2. La sensibilità

**Le uscite** sono queste:

- la luce (`forma.luce`) della galassia 0 del cosmo 1 e la somma delle prime 20;
- per il pianeta d'avvio 217: pressione, temperatura di `P.clima` e media della superficie, frazione di terre come in `indirizzi.mjs`, salinità e pH del mare;
- per la Terra di prova di `test_mare.mjs` (seme 13): le stesse, più la parte coperta dal mare.

Gli indicatori del giro non ci sono, perché costano un Chromium per corsa.

**Il criterio dei candidati**, scritto prima di misurare, è in testa a `sensibilita.mjs`. Sono i numeri «a mano» eseguiti mentre si calcolano le uscite, presi dalla copertura di V8 con una corsa per fase. Stanno nei file che producono le uscite, con una quota per file. Erano previsti 100. Su richiesta di risparmio ne sono rimasti 74: sono stati tolti i limiti di sicurezza, i passi di integrazione e le funzioni che scrivono testi o colori.

**La misura** è l'elasticità Δ, per ogni uscita:

Δ = max|o(±20%) − o₀| / |o₀| / 0,2

Con Δ = 1 l'uscita si sposta quanto il numero. L'influenza di un numero è la Δ più grande. Non tutti i numeri hanno avuto le stesse corse:

- **cosmo e sistema**: per tutti, a ±20%. Danno la luce delle galassie, la pressione e la temperatura del 217.
- **superficie, clima, erosione e mare**: solo a +20%, e solo per `geologia`, `tettonica`, `meteo`, `storia` e `leggi`. La macchina era carica (media 40 su 4 CPU): 127 corse più 48 di mare.js hanno preso 52 minuti.
- **mare.js**: a ±20%, rifacendo soltanto `mare()`.

**Il rimescolamento.** Undici numeri a monte del pianeta cambiano *quale* pianeta sta all'indirizzo 217: la sua massa si sposta di più del 5%. Sono i numeri delle galassie, del disco e della funzione di massa iniziale. Per loro le uscite del 217 non sono una sensibilità ma un altro mondo (fino a ×10⁴ in pressione). Sono segnati «rimescola» e la loro influenza conta solo la luce delle galassie. Su questi numeri il 217 è caotico. I prossimi giri, per i numeri a monte, dovranno misurare su statistiche, per esempio la mediana sui 12 candidati di `indirizzi.mjs`, e non su un pianeta solo.

## 3. I numeri che spostano le uscite

Su 74 candidati, 43 spostano qualcosa. Sono tutti qui sotto: non ce ne sono 50.

Come leggere le colonne:

- **classe**: la classe data da `numeri_classi.mjs`;
- **influenza**: l'elasticità massima, senza il 217 se il numero lo rimescola;
- **uscite mosse**: le tre Δ più grandi;
- **rimescola il 217**: le Δ del 217, che diventa un altro pianeta.

| # | file:riga | numero | che cosa rappresenta | classe | influenza | uscite mosse (Δ) | rimescola il 217 | legge o misura che lo sostituisce | gruppo |
|---:|---|---|---|---|---:|---|---|---|---|
| 1 | `galassie.js:225` | `1.686` | δc, la soglia del collasso sferico (sovradensità lineare) | costante | 14 | luce gal. 0 14, luce 20 gal. 11 | sì: bar 217 2,91e+03, T 217 10,8 | costante teorica: δc = (3/20)(12π)^⅔ ≈ 1,686 (Gunn e Gott 1972); la debole dipendenza da Ωm in Kitayama e Suto 1996 (da verificare). Calcolarla, non scriverla | galassie |
| 2 | `galassie.js:266` | `3.0857e19` | il kpc in metri | costante | 4,9 | luce gal. 0 4,9, luce 20 gal. 2,4 | sì: bar 217 4,09, T 217 0,0502 | costante IAU: 1 pc = 3,0857·10¹⁶ m (IAU 2015, risoluzione B2). Va presa da un solo posto (leggi.js/unita.js). Che una conversione d'unità sposti la luce vuol dire che altrove nel file ci sono numeri scritti già in kpc | galassie |
| 3 | `galassie.js:226` | `0.6745` | «raro»: la mediana di N(0,1) in valore assoluto, l'altezza della fluttuazione che fa l'alone | costante | 4,3 | luce 20 gal. 4,3, luce gal. 0 4,2 | sì: bar 217 0,922, T 217 0,0223 | costante matematica: Φ⁻¹(¾) = 0,6745; calcolarla con l'inversa della campana dello stesso file | galassie |
| 4 | `leggi.js:63` | `-0.3` | IMF: 1 − α₁ (−0,3), nel peso del tratto basso | a mano | 1,3 | luce 20 gal. 1,3, luce gal. 0 1,2 | sì: bar 217 5, terre 217 4,88 | Kroupa 2001 (MNRAS 322, 231): α₁ = 1,3 tra 0,08 e 0,5 M☉. Scrivere α₁ con la fonte e ricavare gli esponenti come 1 − α | stelle |
| 5 | `leggi.js:63` | `0.3` | IMF: −(1 − α₁), stesso esponente scritto una seconda volta | a mano | 0,86 | luce 20 gal. 0,86, luce gal. 0 0,66 | sì: pH 217 ∞, bar 217 1,66e+03 | come sopra: un solo α₁ (Kroupa 2001) | stelle |
| 6 | `leggi.js:63` | `0.08` | IMF: la massa minima delle stelle, 0,08 M☉ | a mano | 0,3 | luce 20 gal. 0,3, luce gal. 0 0,2 | sì: bar 217 154, terre 217 5 | il limite di combustione dell'idrogeno, da stelle.js stessa (≈ 0,075–0,08 M☉; Chabrier e Baraffe 1997, da verificare) | stelle |
| 7 | `leggi.js:63` | `-0.3` | IMF: −0,3, terzo punto in cui α₁ è riscritto | a mano | 0,29 | luce 20 gal. 0,29, luce gal. 0 0,17 | sì: pH 217 ∞, bar 217 2,01e+03 | come sopra (Kroupa 2001) | stelle |
| 8 | `leggi.js:63` | `-1.3` | IMF: 1 − α₂ (−1,3), il tratto sopra 0,5 M☉ | a mano | 0,0062 | luce 20 gal. 0,0062, luce gal. 0 0,0043 | sì: sal. 217 73,7, bar 217 59,5 | Kroupa 2001: α₂ = 2,3 | stelle |
| 9 | `disco.js:54` | `1.5` | la pendenza della densità del disco, Σ ∝ r^−1,5 | a mano | 0 | — | sì: bar 217 5,93e+04, T 217 18,1 | nebulosa solare di massa minima (Weidenschilling 1977; Hayashi 1981): scrivere la fonte con l'anno; le misure sui dischi (Andrews et al. 2009, γ ≈ 0,9, da verificare) sono l'alternativa | stelle |
| 10 | `disco.js:63` | `0.055` | la parte di solidi del disco alla nascita (0,055) | legge | 0 | — | sì: bar 217 1,95e+03, T 217 9,73 | ha già la fonte (Tychoniec et al. 2020, nel commento sopra): il problema non è il numero ma che il 217 ne dipende in modo caotico | stelle |
| 11 | `disco.js:63` | `1.52` | la larghezza (in log) della distribuzione delle masse di polvere (1,52) | legge | 0 | — | sì: bar 217 1,61e+03, T 217 10,2 | ha la fonte (Tychoniec et al. 2020); come sopra | stelle |
| 12 | `storia.js:149` | `9.06e20` | il volume del mantello terrestre (9,06·10²⁰ m³), al denominatore di «quanta parte del mantello fonde per kelvin» | legge | 1 | terre 217 1, terre Terra 0,29, mare Terra 0,11 |  | usare il volume del mantello DEL pianeta (dal suo raggio e dal nucleo), non quello della Terra; dφ/dT dalla pendenza del solidus (Katz et al. 2003, da verificare) | superficie |
| 13 | `storia.js:141` | `4.2` | kSu: la conducibilità termica del mantello superiore (4,2 W/m/K) | a mano | 0,99 | terre Terra 0,99, sal. 217 0,47, mare Terra 0,37 |  | misura: 3–5 W/m/K per la peridotite (Hofmeister 1999, da verificare); meglio da k(T, P) dei minerali | superficie |
| 14 | `tettonica.js:98` | `130e6` | «fiumi»: il tempo con cui l'erosione consuma ciò che sporge dal mare (130 Ma) | a mano | 0,81 | sal. 217 0,81, terre Terra 0,17, mare Terra 0,064 |  | dalla legge dell'erosione già in geologia.js (stream power, EROSIONE) o dal flusso di sedimenti misurato (Milliman e Syvitski 1992, da verificare) | superficie |
| 15 | `storia.js:149` | `3.2e5` | il calore latente di fusione del mantello (3,2·10⁵ J/kg) | legge | 0,69 | terre Terra 0,69, terre 217 0,37, mare Terra 0,25 |  | misura: 3–6·10⁵ J/kg per la peridotite (Hess 1992? da verificare) | superficie |
| 16 | `storia.js:149` | `8e17` | dV_liq/dT del mantello terrestre (8·10¹⁷ m³/K), da ThermInt | legge | 0,69 | terre Terra 0,69, terre 217 0,37, mare Terra 0,25 |  | ha un rimando ([V] ThermInt: Driscoll e Bercovici 2014, da verificare l'anno); come per 9,06·10²⁰, va riportato al pianeta | superficie |
| 17 | `storia.js:138` | `2.4` | il salto di viscosità tra mantello inferiore e superiore (2,4) | a mano | 0,67 | terre 217 0,67, sal. 217 0,45, terre Terra 0,35 |  | dalle inversioni del geoide e del rimbalzo post-glaciale (Hager 1984; Mitrovica e Forte 2004: un fattore 10–100, da verificare se 2,4 è in log) | superficie |
| 18 | `storia.js:171` | `0.055845` | la massa molare del ferro (0,055845 kg/mol) | a mano | 0,63 | terre Terra 0,63, terre 217 0,31, mare Terra 0,23 |  | costante (IUPAC: 55,845 g/mol): da elementi.js, non riscritta. Sposta le terre della Terra di prova del 13%: il nucleo e la sua densità | superficie |
| 19 | `mare.js:181` | `1.8246e6` | A di Debye–Hückel (1,8246·10⁶ /(εT)^1,5) | costante | 0,5 | sal. Terra 0,5, sal. 217 0,11, pH Terra 0,1 |  | costante della teoria (Debye e Hückel 1923): A = e³√(2N_A)/(4π(ε₀kB)^1,5·ln10), da calcolare da COSTANTI | mare |
| 20 | `tettonica.js:91` | `25e3` | hMargine: lo spessore dei frammenti di crosta leggera (25 km) | a mano | 0,48 | terre Terra 0,48, sal. 217 0,3, mare Terra 0,18 |  | dall'isostasia e dalla crosta degli archi (20–35 km; Christensen e Mooney 1995, da verificare) | superficie |
| 21 | `storia.js:140` | `3e-5` | alfa: l'espansione termica del mantello (3·10⁻⁵ /K) | a mano | 0,45 | terre 217 0,45, terre Terra 0,28, sal. 217 0,2 |  | misura: 2–3·10⁻⁵ /K (Turcotte e Schubert 2002, da verificare); meglio da un'equazione di stato | superficie |
| 22 | `mare.js:181` | `50.29` | B di Debye–Hückel (50,29) | costante | 0,31 | sal. Terra 0,31, sal. 217 0,069, pH Terra 0,031 |  | costante della teoria: B = √(2e²N_A/(ε₀kB)), da COSTANTI | mare |
| 23 | `tettonica.js:100` | `0.12` | «rigida»: fin dove un continente si muove tutto insieme (0,12 di cella) | a mano | 0,26 | sal. 217 0,26, terre 217 0,056, terre Terra 0,042 |  | dalla rigidità flessurale della litosfera (spessore elastico, Watts 2001, da verificare); oggi è anche un numero di griglia | superficie |
| 24 | `geologia.js:487` | `3.1e-4` | P₀: la produzione massima di suolo (0,31 mm/anno) | legge | 0,22 | sal. 217 0,22, terre Terra 0,1, terre 217 0,04 |  | misura: Heimsath et al. 1997 e 2012 (0,08–0,5 mm/anno, da verificare) | superficie |
| 25 | `galassie.js:289` | `3e3` | l'estremo alto in k dell'integrale dello spettro (3·10³) | a mano | 0,18 | luce gal. 0 0,18, luce 20 gal. 0,14, bar 217 0,14 |  | tecnico, ma non innocuo: l'integrale non è a convergenza (sposta la luce del 3,6%). Allargare finché il risultato non cambia | galassie |
| 26 | `mare.js:384` | `3e9` | il tempo con cui calava il calore interno (3 Ga), nel vulcanismo del passato | a mano | 0,16 | sal. 217 0,16, sal. Terra 0,0089, pH 217 0,0028 |  | dal decadimento di U, Th e K (emivite misurate; Turcotte e Schubert 2002) o dalla storia termica di storia.js, che c'è già | mare |
| 27 | `geologia.js:323` | `0.75` | il 3/4 di 1 + ¾τ (l'effetto serra grigio) nella memoria termica | a mano | 0,16 | sal. 217 0,16, T sup. 217 0,13, T Terra 0,075 |  | legge di Eddington (atmosfera grigia, due flussi): scriverla come 3/4 con la fonte, o prendere τ dalla stessa funzione di leggi.js | superficie |
| 28 | `storia.js:148` | `1.16` | il coefficiente della portata del fuso (Ṁ = 1,16·κAρφ/δ) | legge | 0,15 | sal. 217 0,15, terre 217 0,12, terre Terra 0,031 |  | da ThermInt (Driscoll e Bercovici 2014, da verificare): scrivere la fonte | superficie |
| 29 | `meteo.js:119` | `0.85` | il numero di Courant (0,85) | tecnico | 0,081 | sal. 217 0,081, sal. Terra 0,016, terre Terra 0,0044 |  | tecnico (dichiarato «numerico»), ma sposta la salinità del 217 dell'1,6%: il clima non è a convergenza nel passo di tempo | superficie |
| 30 | `meteo.js:280` | `0.25` | il ¼ di una media su quattro punti | a mano | 0,069 | sal. Terra 0,069, T Terra 0,063, sal. 217 0,02 |  | tecnico (peso di uno schema): non è un parametro; la sensibilità misura solo l'incoerenza | superficie |
| 31 | `meteo.js:268` | `1.5` | il 3/2 dello spessore ottico delle nubi, τ = 3·LWP/(2ρr) | a mano | 0,037 | sal. 217 0,037, T sup. 217 0,02, sal. Terra 0,017 |  | legge con fonte (Stephens 1978, da verificare): scriverla | superficie |
| 32 | `galassie.js:568` | `21.5` | il 21,5 della correzione di concentrazione (λ·√(2/3 + (c/21,5)^0,7)) | a mano | 0,035 | bar 217 0,035, luce gal. 0 0,014, luce 20 gal. 0,011 |  | Mo, Mao e White 1998 (MNRAS 295, 319): la fonte c'è senza anno | galassie |
| 33 | `galassie.js:335` | `0.75` | il ¾ del peso molecolare del gas ionizzato | a mano | 0,032 | luce 20 gal. 0,032, bar 217 0,016, luce gal. 0 0,0048 |  | costante: μ = 1/(2X + ¾Y) per H e He ionizzati del tutto | galassie |
| 34 | `meteo.js:292` | `-0.25` | il −¼ di uno schema di avvezione | a mano | 0,028 | sal. 217 0,028, terre Terra 0,019, T Terra 0,0096 |  | tecnico | superficie |
| 35 | `meteo.js:118` | `0.003` | la viscosità numerica (0,003) | tecnico | 0,026 | sal. 217 0,026, terre Terra 0,022, sal. Terra 0,008 |  | tecnico (dichiarato «numerico»); sposta poco | superficie |
| 36 | `geologia.js:486` | `2e-5` | il consumo della ghiaia vulcanica (2·10⁻⁵ /m) | legge | 0,0082 | terre Terra 0,0082, sal. 217 0,0063, mare Terra 0,003 |  | legge di Sternberg (1875) con coefficienti misurati (Attal e Lavé 2006, da verificare) | superficie |
| 37 | `galassie.js:342` | `0.02` | il primo nodo della tabella in metallicità (0,02) | a mano | 0,0052 | bar 217 0,0052, T 217 0,0004, luce 20 gal. 0,0002 |  | tecnico (nodo di tabella) | galassie |
| 38 | `geologia.js:106` | `0.2` | il limite dell'allargamento dei crateri verso i poli (0,2) | a mano | 0,0036 | terre 217 0,0036, sal. 217 0,0003 |  | tecnico (disegno sulla griglia lat-lon) | superficie |
| 39 | `geologia.js:392` | `0.05` | «sgretola» con la pioggia (0,05) | a mano | 0,0009 | terre 217 0,0009, sal. 217 0,0006 |  | dalla velocità dell'alterazione chimica (West et al. 2005, da verificare) | superficie |
| 40 | `geologia.js:106` | `1.6` | il raggio del bordo del cratere (1,6 raggi) | a mano | 0,0007 | sal. 217 0,0007, terre 217 0,0002 |  | morfologia dei crateri (Melosh 1989; Pike 1977, da verificare) | superficie |
| 41 | `geologia.js:486` | `4.2e-6` | il consumo della ghiaia di granito (4,2·10⁻⁶ /m) | legge | 0,0007 | sal. 217 0,0007, terre Terra 0,0007, mare Terra 0,0003 |  | Sternberg, coefficienti misurati (Attal e Lavé 2006, da verificare) | superficie |
| 42 | `geologia.js:486` | `2e-4` | il consumo della ghiaia di sedimento (2·10⁻⁴ /m) | legge | 0,0006 | terre Terra 0,0006, mare Terra 0,0002, sal. Terra 0,0001 |  | come sopra | superficie |
| 43 | `galassie.js:272` | `0.147` | il coefficiente di Winitzki (0,147) dell'inversa della campana | a mano | 0,0002 | luce 20 gal. 0,0002 |  | approssimazione con fonte (Winitzki 2008): o l'inversa esatta | galassie |


**I 31 senza effetto misurabile su queste uscite** (Δ = 0 esatto): `mare.js:125` (conducibilita), `mare.js:212` (pCO2), `mare.js:267` (CRIOSCOPICA), `mare.js:286` (w), `mare.js:345` (parteBassa), `mare.js:472` (x), `mare.js:690` (E), `mare.js:802` (kU), `mare.js:806` (PET), `mare.js:806` (PET), `mare.js:867` (velocita), `mare.js:891` (eta), `mare.js:900` (pH), `mare.js:900` (Fe), `mare.js:910` (alcalina), `mare.js:923` (alt), `mare.js:930` (attrito), `mare.js:945` (I), `mare.js:965` (fredda), `mare.js:989` (vForte), `mare.js:1033` (tipoMare), `geologia.js:91` (0), `geologia.js:295` (1), `tettonica.js:90` (hMisura), `tettonica.js:97` (qPlacche), `tettonica.js:97` (qVivo), `meteo.js:125` (DIAMETRO_MOLECOLA), `leggi.js:39` (R0), `disco.js:37` (RGIOVE), `stelle.js:113` (D0), `stelle.js:113` (rot).

Ventuno di questi stanno in mare.js e servono ad altre uscite del mare: correnti, polveri, onde, maree, sorgenti calde, il nome del tipo di mare. Per misurarli servono quelle uscite. Altri sembrano valori di riserva mai usati, perché chi chiama passa il suo valore (`pCO2 = 3e-4`, `parteBassa = 0.3`). Vanno controllati e, se è così, tolti.

## 4. Il piano a gruppi per i prossimi giri

Ogni giro chiude con lo stesso controllo: `npm run numeri`, poi `node strumenti/misure/numeri_classi.mjs`, poi la sensibilità dei numeri toccati con `node strumenti/misure/sensibilita.mjs --riprendi`.

1. **Le costanti (tutti i gruppi): basso rischio, effetto alto.** Ci sono 942 costanti riscritte, da prendere da `leggi.js`, `unita.js` o `elementi.js`. Si comincia da quelle che pesano:
   - δc e Φ⁻¹(¾) in `galassie.js`, che vanno calcolate;
   - il kpc;
   - il ¾ di μ;
   - A e B di Debye–Hückel in `mare.js:181`, da `COSTANTI`;
   - la massa molare del ferro (`storia.js:171`);
   - R del vapore, 461,5, in due punti di `mare.js`;
   - la massa molare dell'acqua.

   Il kpc in `galassie.js` sposta la luce con Δ = 4,9. Va cercato nello stesso file il numero scritto già in kpc che lo fa pesare.
2. **Stelle: la funzione di massa iniziale e il disco.** Serve un oggetto IMF unico, con Kroupa 2001 e α₁ e α₂ scritti una volta: oggi α₁ compare tre volte in `leggi.js:63`. La massa minima va presa da `stelle.js`. Alla pendenza del disco va data la fonte con l'anno. Prima di toccarli serve una misura statistica (vedi il rimescolamento).
3. **Superficie: il mantello di `storia.js`.** Alcuni valori sono della Terra e vanno riportati al pianeta: il volume del mantello 9,06·10²⁰ m³ e dV/dT di ThermInt. Altri hanno bisogno di misure con fonte: la conducibilità (4,2), l'espansione termica (3·10⁻⁵), il calore latente (3,2·10⁵), il salto di viscosità (2,4), la portata del fuso (1,16). Poi `tettonica.js` (fiumi 130 Ma, hMargine 25 km, rigida 0,12) e `geologia.js` (P₀ del suolo, il ¾ dell'effetto serra, il consumo della ghiaia). Sono i numeri che spostano di più le terre e la salinità, con Δ fino a 1.
4. **Mare.** Il 3 Ga del calore interno (`mare.js:384`) va preso dal decadimento radiogenico o da `storia.js`. Poi servono uscite in più (correnti, polveri, sorgenti calde) per misurare i 21 numeri che oggi risultano a zero. I valori di riserva mai usati si tolgono.
5. **La convergenza numerica.** Il numero di Courant (0,85), la viscosità numerica di `meteo.js` e l'estremo dell'integrale in k di `galassie.js:289` sono tecnici, ma spostano le uscite dell'1–4%. Non si sceglie un altro valore: si prova la convergenza (mezzo passo, dominio doppio) e la si scrive.
6. **Chimica, materia, interfaccia.** Qui il lavoro è diverso:
   - le 3017 righe di tabella senza fonte (chimica 1603, materia 812) vogliono la fonte, non un'altra legge;
   - `materia.js` e `atomi3d.js` hanno molti numeri a mano ma non toccano queste uscite: prima vanno definite le loro (spettri, reticoli, campioni);
   - l'interfaccia (`mappa.js`, `laboratorio.js`, `visore/`) è quasi tutta tecnica: resta per ultima.
