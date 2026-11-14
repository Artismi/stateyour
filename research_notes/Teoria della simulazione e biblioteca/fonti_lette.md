# Note di lavoro: fonti lette (2026-11-14)

Marche: **[V]** letto ora sul testo della fonte (PDF estratto con pdftotext, o pagina HTML); **[Va]** letto solo
nell'abstract o tramite un estratto automatico della pagina; **[R]** ricordato, non riletto.

## Argomento di simulazione

**Bostrom 2003**, «Are you living in a computer simulation?», Phil. Quarterly 53: 243–255.
PDF dal sito dell'autore: https://simulation-argument.com/simulation.pdf
- [V] Notazione: f_P = frazione delle civiltà di livello umano che arrivano allo stadio postumano; N̄ = numero medio di
  simulazioni di antenati fatte da una civiltà postumana; H̄ = numero medio di individui vissuti prima dello stadio
  postumano. f_sim = f_P·N̄·H̄ / (f_P·N̄·H̄ + H̄). Con N̄ = f_I·N̄_I: f_sim = f_P f_I N̄_I / (f_P f_I N̄_I + 1).
  Almeno una vera: (1) f_P ≈ 0, (2) f_I ≈ 0, (3) f_sim ≈ 1.
- [V] Principio di indifferenza «blando»: Cr(SIM | f_sim = x) = x, se non si ha informazione che distingua.
- [V] Ipotesi: indipendenza dal substrato, in forma attenuata (basta replicare il calcolo a grana sinaptica).
- [V] Costo: cervello 10¹⁴–10¹⁷ op/s; storia umana 100 miliardi × 50 anni × 3·10⁷ s ⇒ 10³³–10³⁶ operazioni;
  computer di massa planetaria ~10⁴² op/s.
- [V] Calcolo pigro proposto da Bostrom stesso: «Simulating the entire universe down to the quantum level is
  obviously infeasible»; il microscopico «could likely be filled in ad hoc»; il simulatore riempie i dettagli
  «on an as-needed basis», e in caso di errore può correggere i cervelli o tornare indietro di qualche secondo.

**Weatherson 2003**, «Are you a sim?», Phil. Quarterly 53: 425–431. PDF sul sito di Bostrom:
https://simulation-argument.com/weatherson.pdf
- [V] Quattro letture del principio di indifferenza: due false, una non dà la conclusione, la quarta la dà solo con
  un'ipotesi ausiliaria (che l'evidenza sopravvenga sulle esperienze coscienti) che «we have no reason to believe».
  Obiezione esternista: vedere un pugnale e simulare di vederlo sono evidenze diverse.

**Chalmers 2022**, *Reality+*, précis: https://consc.net/papers/realityprecis.pdf
- [V] Versione dell'argomento: senza «sim blockers», la maggior parte degli esseri di tipo umano sono sims, quindi
  probabilmente lo siamo. Sim blockers elencati: i non-sim muoiono prima; scelgono di non farne; sims intelligenti o
  coscienti impossibili; i simulatori evitano sims coscienti; «Sims will require too much computer power».
  Tesi: non sappiamo che un blocker valga ⇒ probabilità non trascurabile. Realismo virtuale: se siamo in una
  simulazione, gli oggetti sono reali (ipotesi it-from-bit con creazione).
- [Va] Da una recensione: Chalmers stima almeno il 25% (p. 101).

## Costo

**Lloyd 2002**, «Computational capacity of the universe», PRL 88, 237901; arXiv quant-ph/0110141.
- [V] «The universe can have performed no more than 10¹²⁰ ops on 10⁹⁰ bits» (10¹²⁰ bit contando la gravità).
- [V] Margolus–Levitin: #op/s ≤ 2E/(πħ). Numero di operazioni ≈ (t/t_P)² ≈ 10¹²⁰.
- [V] Bekenstein + olografico: massimo di bit ≈ area / ℓ_P², per l'universo ≈ c²t²/ℓ_P² = t²/t_P².
- [V] Tre letture: tetto del calcolo possibile; **minimo** di bit e operazioni per un computer quantistico che
  simuli direttamente l'universo; numeri del calcolo che l'universo «fa». Un computer quantistico simula
  efficientemente ogni sistema a interazioni locali.

**Vazza 2025**, «Astrophysical constraints on the simulation hypothesis for this Universe: why it is (nearly)
impossible that we live in a simulation», Frontiers in Physics 13, 1561873; arXiv 2504.08461 (aperto).
- [Va] (estratto dal testo HTML di arXiv) Usa I_max = 2πER/(ħc ln2) e il costo di Landauer k_B T ln2 per bit.
  Universo visibile a risoluzione di Planck: ≈3,5·10¹²⁴ bit, ≈8,9·10¹⁰⁸ erg (a T del fondo cosmico), contro
  ≈2,7·10⁷⁸ erg di tutto l'universo. Terra a risoluzione di Planck: ≈9,8·10⁷⁴ bit, ≈2,5·10⁵⁹ erg (ordine
  dell'energia di legame della Via Lattea). Terra a bassa risoluzione, limitata dal neutrino di ~10¹⁷ eV di
  KM3NeT (λ ≈ 1,2·10⁻²¹ cm): ≈1,65·10⁵¹ bit, ≈4,3·10³⁵ erg (il Sole in ~2 minuti); ma in tempo reale servono
  10⁷³–10⁷⁵ erg/s, più di tutte le stelle dell'universo visibile.
- [Va] Ipotesi dichiarate: simulatore in un universo con le nostre leggi; olografico vale; compressione non
  guadagna «several orders of magnitude»; con altre costanti fondamentali alcuni casi diventano possibili.

**Ringel & Kovrizhin 2017**, Sci. Adv. 3, e1701758; arXiv 1704.03880.
- [Va] «quantized gravitational responses appear as obstructions to local sign-free QMC» (es. conduttanza di Hall
  termica, effetto Hall quantistico frazionario). Riguarda il Monte Carlo quantistico senza segno **locale**.
**Aaronson 2017**, blog: https://scottaaronson.blog/?p=3482
- [Va] Il risultato è sulla complessità, considera solo trasformazioni locali; non esclude altri algoritmi classici
  (provarlo richiederebbe P≠PSPACE); il simulatore potrebbe usare un computer quantistico o metterci più tempo;
  l'ipotesi «has not been falsified» e «remains unfalsifiable».

**Beane, Davoudi & Savage 2012**, «Constraints on the Universe as a Numerical Simulation», arXiv 1210.1847
(Eur. Phys. J. A 50, 148, 2014 [R]).
- [Va] Reticolo con fermioni di Wilson non migliorati; limite più forte dal taglio del raggi cosmici:
  b⁻¹ ≳ 10¹¹ GeV; segno possibile: rottura della simmetria per rotazioni nelle direzioni dei raggi cosmici di
  energia più alta, che riflette gli assi del reticolo. (Il taglio è di fatto il GZK [R]; l'abstract non lo nomina.)

## Alternative senza esecuzione

**Schmidhuber 1997**, «A computer scientist's view of life, the universe, and everything», LNCS 1337;
arXiv quant-ph/9904050.
- [V] Dovetailing: A1 un'istruzione ogni due passi, A2 una ogni due dei rimanenti, ecc.; ogni passo di ogni
  universo calcolabile prima o poi è calcolato. «The Great Programmer does not worry about computation time»;
  le creature corrono sul loro tempo locale.
- [V] «computing all evolutions of all universes is much cheaper in terms of information requirements than
  computing just one particular» (il programma che li enumera tutti è corto; uno solo col suo rumore è
  incomprimibile). «there are no real splits — there are just a bunch of different algorithms which yield identical
  results for some time».
- [V] Prior universale: P_U(s) = Σ_{p: U(p)=s} 3^{−|p|} (alfabeto 0,1,virgola; programmi autodelimitati); cambia
  per un fattore costante tra macchine (teorema del compilatore); teorema di codifica: dominano i programmi più
  corti. Conclusione: il nostro universo è probabilmente calcolato da un programma corto ⇒ resterà regolare.

**Schmidhuber 2000/2002**, «Algorithmic theories of everything», arXiv quant-ph/0011122.
- [Va] Speed prior: dalla ricerca universale di Levin, «the cumulative prior probability of all x incomputable
  within time t by this optimal algorithm should be 1/t».

**Standish 2000**, «Why Occam's razor», arXiv physics/0001020.
- [V] Misura uniforme sulle stringhe ⇒ ci aspetteremmo un universo infinitamente complesso; le stringhe come
  classi di equivalenza (bit «don't care») danno P_U(s) = Σ 2^{−|p|}. Dipendenza dalla macchina: può essere
  P_V(s1) ≪ P_V(s2) ma P_U(s1) ≫ P_U(s2). Proposta: l'interprete rilevante è l'osservatore stesso.
- [V] Coniglio bianco (da Marchal, «paradosso del dovetailer universale»): universi con un'infrazione della legge
  dovrebbero essere più numerosi; risposta: quasi tutti i «guasti» sembrano rumore; l'osservatore finito applica un
  «interpretation filter» che comprime; un coniglio bianco riconoscibile è una legge complicata, rara nel prior.

**Hutter 2010**, «A complete theory of everything (will be subjective)», Algorithms 3: 329; arXiv 0912.5434.
- [V] Una teoria completa richiede (i) condizioni iniziali, (e) evoluzione, (l) localizzazione dell'osservatore,
  (n) rumore, (o) capacità percettive. Criterio: scegliere la teoria con Length(i)+Length(e)+Length(l) minima.
  «Naked, (U) is a theory of nothing»; un multiverso «tutto a la carte» ha l'indirizzo lungo quanto l'universo.
  Localizzare il Sole: ~75 bit (indice tra ~3·10²² stelle); la Terra tra 8 pianeti: 3 bit; una persona: 33 bit.

**Tegmark 2008**, «The Mathematical Universe», Found. Phys. 38: 101; arXiv 0704.0646.
- [V] MUH: la realtà esterna **è** una struttura matematica (enti astratti con relazioni). Strutture isomorfe
  «are one and the same». Le sole proprietà intrinseche sono le relazioni «timeless and unchanging»; la probabilità
  nasce solo da insiemi (ignoranza su quale elemento si è).
- [V] Sez. VI «The time misconception»: «computations do not need to evolve the universe, but merely describe it
  (defining all its relations)»; conclusione: «There is therefore no need for such computations to be run». Il
  ritmo del tempo percepito è indipendente dal ritmo del computer (cita Egan, Permutation City).
- [V] Boltzmann: le soluzioni generiche di una teoria di campo classica sono «a high-entropy mess», con osservatori
  disincarnati ⇒ quella struttura è esclusa. Miracoli (acqua in vino) permessi con probabilità esponenzialmente
  piccole; problema della misura «unsolved» già al livello II.
- [V] CUH: solo strutture definite da funzioni calcolabili (aiuterebbe con Gödel e con la misura).

**Egan**, FAQ di Permutation City: https://www.gregegan.net/PERMUTATION/FAQ/FAQ.html
- [V] Teoria della polvere: causalità = correlazioni tra stati; «absolutely any set of experiences should be
  possible». Egan non la prende sul serio: l'universo è «far too orderly»; ci sarebbero «billions of times more
  arrangements» caotiche che ordinate.

**Chalmers 1996**, «Does a rock implement every finite-state automaton?», Synthese 108: 309.
https://consc.net/papers/rock.html
- [Va] Putnam: ogni sistema aperto realizza ogni automa finito; risposta: l'implementazione richiede transizioni
  affidabili e controfattuali, per ogni transizione e non solo per quella eseguita; automi a stati combinatori.

**Wolfram 2021**, «The concept of the ruliad»:
https://writings.stephenwolfram.com/2021/11/the-concept-of-the-ruliad/
- [Va] «the entangled limit of everything that is computationally possible»; non richiede input esterno, esiste per
  necessità formale; osservatori limitati nel calcolo e persistenti ne campionano un pezzo; le leggi dipendono da
  come gli osservatori lo campionano; la struttura «branches and merges».

**Campbell, Owhadi, Sauvageau, Watkinson 2017**, «On testing the simulation theory», arXiv 1703.00058.
- [Va] Ipotesi: la realtà è resa quando l'informazione «which-way» diventa disponibile a uno sperimentatore, non a un
  rivelatore. Il caso «cancellazione prima di guardare» dà frange anche in meccanica quantistica standard (non
  distingue). Non dicono che cosa prevede la meccanica quantistica standard nel caso «rivelato ma non registrato».

## Misura

**Carroll 2017**, «Why Boltzmann brains are bad», arXiv 1702.00850.
- [Va] Il problema non si toglie scegliendo un'altra distribuzione sugli osservatori; le teorie dominate da cervelli
  di Boltzmann sono «cognitively unstable: they cannot simultaneously be true and justifiably believed».

**Carroll & Sebens 2014**, «Many worlds, the Born rule, and self-locating uncertainty», arXiv 1405.7907.
- [Va] Dopo la decoerenza e prima di leggere l'esito, l'osservatore non sa in che ramo è; c'è un solo modo
  razionale di assegnare la credenza, e dà la regola di Born.

## Ricordati, non riletti [R]
- Deutsch 1999 / Wallace 2012: regola di Born dalla teoria delle decisioni.
- Gell-Mann & Hartle 1990–93: storie a grana grossa; le probabilità si sommano solo per storie decoerenti.
- Hawking & Hertog 2006: cosmologia «dall'alto», storie pesate a partire dal presente.
- Moravec 1998, «Simulation, consciousness, existence»: interpretazioni, ogni struttura «contiene» menti.
- Teorema elementare: non esiste una distribuzione uniforme sugli interi (additività numerabile).
- Elias 1975: codici prefissi universali per gli interi (gamma: 2⌊log₂n⌋+1 bit).
