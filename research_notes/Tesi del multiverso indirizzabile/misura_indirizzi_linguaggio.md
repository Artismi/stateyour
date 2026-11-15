# Indirizzo, misura e linguaggio formale per «un universo con un indirizzo unico dentro un multiverso»

Note di ricerca (15 novembre 2026) per la tesi del multiverso indirizzabile di stateyour. Estendono, senza ripeterlo,
`reports/Teoria della simulazione e biblioteca.md`, che tratta già Bostrom, Lloyd, Schmidhuber 1997, Tegmark, Egan,
Hutter 2010, coniglio bianco e cervelli di Boltzmann in breve.

Marcatori: **[V]** letto ora nel testo (pagina o PDF), **[Va]** letto ora solo l'abstract o la scheda, **[R]**
ricordato (fonte primaria indicata ma non riletta ora: va controllato prima di citarlo come fatto). Le «Inferenze»
sono mie e non vanno attribuite alle fonti.

Il contesto del progetto, letto solo per orientarmi (INTRECCIO.md, regole 1, 2, 3 e 13):
- **Regola 1:** l'indirizzo è un percorso «cosmo / galassia / stella / pianeta / punto / scala», più il tempo e i
  rami. Il caso viene da Threefry‑2x32 a 20 giri, con una chiave a 64 bit ricavata dall'indirizzo nome per nome.
- **Regola 3:** ogni evento ha un indirizzo, e tutti i suoi esiti esistono.
- **Regola 13:** due rami uguali a una grana data sono lo stesso ramo. Mancano ancora l'impronta del contenuto e la
  regola per sommare i pesi.

---

## 1. Misura algoritmica: come pesare indirizzi illimitati

### Takeaway
Una misura su tutti gli indirizzi richiede due cose.
- **Ai livelli con indici illimitati** (cosmo n ∈ ℕ, rami) serve una distribuzione normalizzabile, e quindi non
  uniforme. La scelta canonica è un peso di lunghezza di codice 2^{−ℓ(n)}, con ℓ un codice prefisso (Elias, log*),
  oppure il prior universale 2^{−K}.
- **Ai livelli fisicamente finiti** serve un peso condizionato fisico (frazione di massa, peso di Born).

Il prodotto lungo il percorso è una misura ben definita sui cammini infiniti (Ionescu‑Tulcea). La parte algoritmica
resta però una scelta: per la regola 2 è un parametro «libero», da dichiarare.

### Cited Findings

**Codici prefissi, Kraft, interi**
- **Kraft–McMillan.** Un codice prefisso binario con lunghezze ℓ_i esiste se e solo se Σ_i 2^{−ℓ_i} ≤ 1 (Kraft
  1949). La stessa disuguaglianza vale per ogni codice univocamente decodificabile (McMillan 1956). Quindi ogni codice
  prefisso definisce una sottomisura p(i) = 2^{−ℓ_i} sugli oggetti codificati [R] —
  [Li–Vitányi, *An Introduction to Kolmogorov Complexity*, cap. 1.11](https://link.springer.com/book/10.1007/978-3-030-11298-1).
- **Codici di Elias per n ≥ 1** [R] —
  [Elias 1975, IEEE Trans. IT 21(2):194–203](https://doi.org/10.1109/TIT.1975.1055349):
  - γ(n): ⌊log₂n⌋ zeri, poi n in binario. Lunghezza 2⌊log₂n⌋+1.
  - δ(n): γ(⌊log₂n⌋+1), poi n senza il bit iniziale. Lunghezza ⌊log₂n⌋ + 2⌊log₂(⌊log₂n⌋+1)⌋ + 1.
  - ω: ricorsivo, con lunghezza ≈ log₂n + log₂log₂n + … (cioè log*).
  - Sono codici «universali»: la lunghezza attesa è entro un fattore costante dall'entropia, per ogni distribuzione
    monotona.
- **Prior universale degli interi di Rissanen** [R] —
  [Rissanen 1983, Ann. Stat. 11(2)](https://doi.org/10.1214/aos/1176346150): w(n) = 2^{−log*₂ n}/c₀, con
  log*₂ n = log₂n + log₂log₂n + … (solo i termini positivi) e c₀ ≈ 2.865064.
- **Non esiste una distribuzione uniforme numerabilmente additiva su ℕ** [R], dimostrazione elementare. Se
  p(n) = c per ogni n, allora Σp(n) vale 0 se c = 0 e ∞ se c > 0: mai 1. Le alternative uniformi sono soltanto
  finitamente additive (la densità naturale d(A) = lim |A∩[1,N]|/N, che non è definita per ogni A). Con esse non si
  può campionare un indice, né applicare la σ‑additività [R] — vedi la «lotteria infinita» di de Finetti,
  [SEP, «Interpretations of Probability»](https://plato.stanford.edu/entries/probability-interpret/).

**Prior universale di Solomonoff–Levin** [R], dalle fonti primarie
[Solomonoff 1964](https://doi.org/10.1016/S0019-9958(64)90223-2),
[Zvonkin–Levin 1970](https://doi.org/10.1070/RM1970v025n06ABEH001269) e
[Li–Vitányi cap. 4](https://link.springer.com/book/10.1007/978-3-030-11298-1):
- **Definizione.** Con U macchina universale monotona/prefissa, M(x) = Σ_{p : U(p) = x*} 2^{−|p|}: la somma sui
  programmi minimali la cui uscita comincia con x.
- **Proprietà:**
  - M è una semimisura: M(x) ≥ M(x0) + M(x1).
  - È enumerabile dal basso ma non calcolabile.
  - Domina ogni semimisura enumerabile μ: M(x) ≥ 2^{−K(μ)} μ(x).
- **Discreto** (Levin): m(x) = Σ_{U(p)=x} 2^{−|p|}.
- **Teorema di codifica:** −log₂ m(x) = K(x) + O(1).
- **Invarianza:** K_U(x) ≤ K_V(x) + c_{U,V}.
- **Convergenza di Solomonoff:** per μ calcolabile, Σ_t E_μ[(M(0|x_{<t}) − μ(0|x_{<t}))²] ≤ (ln 2/2)·K(μ) + O(1).
  Le costanti variano un poco da una formulazione all'altra [R] —
  [Hutter 2005, *Universal Artificial Intelligence*](http://www.hutter1.net/ai/uaibook.htm).
- La voce Scholarpedia «Algorithmic probability» (Solomonoff, Hutter) avrebbe fornito le formule, ma ha risposto
  503 e non è stata letta [—] — [Scholarpedia](http://www.scholarpedia.org/article/Algorithmic_probability).

**Speed prior (Schmidhuber)**
- **Definizione operativa** [V]. S(x) è «la probabilità che l'uscita del seguente algoritmo probabilistico cominci
  con x». L'algoritmo:
  - si parte da t := 1;
  - quando le istruzioni eseguite superano t si lancia una moneta: con testa t := 2t, altrimenti ci si ferma;
  - ogni bit di programma nuovo si estrae a moneta e dimezza t (t := t/2).
- **Proprietà dichiarate** [V]. La probabilità a priori cumulata dei dati che richiedono più di O(n) risorse è 1/n.
  Ne segue una strategia di predizione calcolabile e quasi ottimale.
- **Predizioni dichiarate, se la storia dell'universo è estratta da S** [V]:
  - l'universo «non diventerà molto più vecchio di quanto è ora»;
  - la computazione quantistica su larga scala «non funzionerà bene»;
  - ogni casualità apparente è un generatore pseudo‑casuale veloce ancora sconosciuto.
  - Fonti: [pagina Speed Prior](https://people.idsia.ch/~juergen/speedprior.html),
    [Schmidhuber 2002, COLT, LNAI 2375:216–228](https://doi.org/10.1007/3-540-45435-7_15) e
    [*Algorithmic Theories of Everything*, quant‑ph/0011122, §6](https://arxiv.org/abs/quant-ph/0011122).
- **Forma per fasi** (FAST) [R]: S(x) = Σ_i 2^{−i} S_i(x), con S_i(x) = Σ 2^{−|p|} sui programmi p che calcolano x
  entro 2^{i−|p|} passi. È legata alla complessità di Levin, Kt(x) = min_p {|p| + log₂ t(p,x)}.

**Hutter: localizzazione dell'osservatore**
- Il termine Length(l) e il conto dei bit sono già nel rapporto precedente. Aggiungo solo la forma: la teoria
  migliore minimizza Length(i) + Length(e) + Length(l) + …, e il multiverso universale ha senso solo con
  l'indirizzo [R] — [Hutter 2010, «A complete theory of everything (will be subjective)», arXiv:0912.5434](https://arxiv.org/abs/0912.5434).

**Combinare i pesi lungo l'albero**
- **Kolmogorov.** Se le distribuzioni finite μ_n su S_1×…×S_n (spazi boreliani standard) sono consistenti
  (μ_{n+1}∘π_{n}^{−1} = μ_n), esiste un'unica μ sul prodotto infinito [R].
- **Ionescu‑Tulcea**, più adatta a un albero di indirizzi. Dati spazi misurabili arbitrari e nuclei
  κ_n(a_1…a_{n−1}, ·), esiste un'unica misura di probabilità sui cammini infiniti con
  μ(cilindro [a_1…a_n]) = ∫…∫ κ_1(da_1) κ_2(a_1, da_2) ⋯ κ_n(a_{<n}, da_n). Non serve topologia [R] —
  [Kallenberg, *Foundations of Modern Probability*, teor. 8.24/6.17](https://link.springer.com/book/10.1007/978-3-030-61871-1).
- **Alberi discreti.** Una misura sui cammini infiniti equivale a un flusso sui nodi:
  w(radice) = 1, w(v) = Σ_{c figlio di v} w(c).
  - Con ramificazione finita la σ‑additività sui cilindri è automatica: i cilindri sono compatti nello spazio di
    Cantor e si applica Carathéodory.
  - Con ramificazione numerabile basta che ogni nodo abbia pesi condizionati che sommano a 1 (Ionescu‑Tulcea) [R].

### Inferences
- **Peso naturale per stateyour.** Si può scrivere
  μ(indirizzo) = w_cosmo(n) · Π_{livelli k} κ_k(a_k | a_{<k}) · Π_{eventi e} p_e(esito_e | contesto).
  - w_cosmo è l'unico fattore non fisico, per esempio 2^{−|δ(n)|} oppure Rissanen. Va dichiarato «libero»
    (regola 2).
  - κ_k sono pesi fisici condizionati: per esempio la frazione di stelle di un certo tipo nella galassia, o
    l'uniforme sui pianeti di una stella.
  - p_e sono i pesi degli esiti, cioè la regola di Born o la distribuzione della legge che genera l'evento.
- **Il peso «algoritmico» puro** di un luogo è ≈ 2^{−(K(leggi) + K(indirizzo|leggi))}. In un mondo in cui tutti i
  cosmi hanno le stesse leggi, K(leggi) è comune e si semplifica. Resta allora solo il costo dell'indirizzo, che
  per un indice n cresce come log₂n + O(log log n) bit, cioè come Elias o Hutter.
- **I due pesi non vanno sommati, ma usati a livelli diversi.** Quello algoritmico serve dove non c'è una legge che
  dia la frequenza (quale cosmo, quali leggi). Quello fisico serve dentro un cosmo. Moltiplicarli entrambi sullo
  stesso livello conterebbe due volte la stessa informazione.
- **Un indirizzo è un cilindro:** l'insieme di tutti i cammini infiniti che cominciano con quel prefisso finito. Un
  cammino infinito singolo ha di solito misura 0. Le domande sensate («quanto pesa questo luogo») riguardano i
  prefissi finiti, ed è proprio ciò che l'indirizzo è.

### Gaps
- Non ho riletto ora i testi di Li–Vitányi né la voce di Scholarpedia (503). Le formule di Solomonoff–Levin sono [R],
  e così le costanti esatte della convergenza.
- Non ho trovato un lavoro che combini esplicitamente pesi fisici per livello e un prior algoritmico su un albero
  cosmologico. Lo schema sopra è mio.

---

## 2. Il problema della misura: cosmologia e molti mondi

### Takeaway
- **In cosmologia** (inflazione eterna, de Sitter) la misura non è data dalla teoria. Scelte diverse del
  «taglio» danno predizioni diverse, e alcune sono dominate da cervelli di Boltzmann.
- **In Everett** la misura sui rami esiste se le storie sono decoerenti: allora le probabilità |ψ|² sono additive.
  Su un albero infinito di rami è una misura di Ionescu‑Tulcea sui cammini.
- **Il criterio di Carroll** non è di probabilità ma epistemico: una teoria dominata da osservatori fluttuati
  localmente identici a noi si autodistrugge.

### Cited Findings

**Carroll 2017** [Va] — [arXiv:1702.00850](https://arxiv.org/abs/1702.00850)
- I cervelli di Boltzmann sono «observers who randomly fluctuate out of a thermal bath rather than naturally
  evolving from a low‑entropy Big Bang».
- «the real problem is with fluctuations into observers who are locally identical to ordinary observers».
- Il problema «cannot be swept under the rug by a choice of probability distributions over observers».
- Le teorie dominate da loro sono «cognitively unstable: they cannot simultaneously be true and justifiably
  believed». Non sono escluse dai dati.

**Dyson, Kleban e Susskind 2002**
- «Disturbing implications of a cosmological constant»: con ipotesi motivate dalla complementarità olografica e
  d'orizzonte, una costante cosmologica richiede una descrizione a «causal patch», e queste ipotesi «inevitably lead
  to very deep paradoxes» [Va] — [hep-th/0208013](https://arxiv.org/abs/hep-th/0208013).
- Dal corpo dell'articolo, non riletto ora [R]:
  - de Sitter ha entropia finita S = A/4G = 3π/(GΛ) ≈ 10^{122};
  - uno spazio a stati finiti ha ricorrenze di Poincaré con tempo ~ e^{S};
  - le fluttuazioni che producono il nostro universo osservato sono enormemente meno probabili di quelle che
    producono stati minimi compatibili con l'osservazione.

**Misure in inflazione eterna** [R]
- Le principali: tempo proprio, fattore di scala, causal patch di Bousso, «fat geodesic». Il tempo proprio dà il
  paradosso della «giovinezza». La causal patch restringe la misura alla regione causalmente connessa a una
  geodetica —
  [Bousso 2006, hep-th/0605263](https://arxiv.org/abs/hep-th/0605263);
  [Freivogel 2011, rassegna «Making predictions in the multiverse», arXiv:1105.0244](https://arxiv.org/abs/1105.0244).

**Classe di riferimento** [R] — [Bostrom 2002, *Anthropic Bias*](https://anthropic-principle.com/)
- SSA: ragiona come se fossi un membro a caso della tua classe di riferimento.
- SIA: pesa i mondi per numero di osservatori.
- La scelta della classe cambia le predizioni (Doomsday, Presumptuous Philosopher).

**Molti mondi: storie consistenti** [R] —
[Gell‑Mann–Hartle 1993, gr-qc/9210010](https://arxiv.org/abs/gr-qc/9210010);
[Dowker–Kent 1996, gr-qc/9412067](https://arxiv.org/abs/gr-qc/9412067)
- Una storia α è una catena di proiettori C_α = P^{n}_{α_n}(t_n)⋯P^{1}_{α_1}(t_1).
- Il funzionale di decoerenza è D(α,β) = Tr(C_α ρ C_β†).
- Le storie sono (debolmente) consistenti se Re D(α,β) = 0 per α ≠ β. Allora p(α) = D(α,α) = ‖C_α ψ‖² è additiva
  sulle grane grosse: p(ᾱ) = Σ_{α∈ᾱ} p(α).
- Dowker–Kent mostrano che le famiglie consistenti sono moltissime e tra loro incompatibili: serve un criterio in
  più per scegliere quella «quasiclassica».

**Molti mondi: derivazione di Born** [R], già toccata nel rapporto precedente —
[Sebens–Carroll, arXiv:1405.7577](https://arxiv.org/abs/1405.7577).

### Inferences
- **L'albero dei rami di stateyour** è un modello di Ionescu‑Tulcea. Ogni evento è un nucleo
  κ_e(esito | passato dentro il contenitore), e la misura del ramo è il prodotto dei pesi dei suoi esiti. Due
  requisiti:
  1. **Normalizzazione locale:** per ogni evento, Σ_esiti κ_e = 1, verificabile con una prova.
  2. **Pesi dati dalla legge**, non dal numero di esiti. Contare i rami a peso uguale è proprio ciò che genera il
     coniglio bianco.
- **Il criterio di Carroll è operativo in stateyour.** Se si contano osservatori, bisogna chiedersi se la misura del
  progetto dà più peso a «menti fluttuate» che a menti evolute. Con pesi fisici condizionati, una fluttuazione
  termica che produce un osservatore ha peso ~ e^{−ΔS}, ed è trascurabile salvo tempi ~ e^{S}. Il problema nasce
  solo se si estrae il tempo con misura uniforme su un intervallo infinito: un'altra «uniforme su ℕ» vietata.
- **La misura cosmologica e la misura dei rami sono due problemi diversi.** La prima è quale cosmo e quale regione:
  non c'è una legge, e serve un fattore algoritmico o libero. La seconda è quale esito di un evento: c'è la legge,
  cioè Born o la distribuzione fisica.

### Gaps
- Non ho riletto ora il corpo di DKS 2002 (solo l'abstract). Le cifre su entropia e ricorrenza sono [R].
- Non ho trovato una trattazione unica e verificata della «misura su un albero infinito di rami» everettiani
  (quasi‑classicità più cammini infiniti). La sintesi Ionescu‑Tulcea più storie consistenti è mia.

---

## 3. Indirizzamento deterministico e calcolo pigro

### Takeaway
- **Il caso.** Un RNG basato su contatore è u = h_j(b_k(n)), con b_k una biiezione con chiave: il caso diventa una
  funzione pura di (chiave, contatore).
- **La chiave.** Derivarla dall'indirizzo «nome per nome» è la costruzione ad albero GGM o il «split» degli RNG
  divisibili.
- **Lo spazio.** Le chiavi spaziali gerarchiche (octree, Morton, Hilbert, HEALPix) sono la stessa idea applicata
  allo spazio.
- **Il calcolo pigro.** Calcolare pigramente con memoria è osservativamente equivalente al calcolo completo
  (trasparenza referenziale, confluenza). Vale solo se ogni funzione è pura, compreso l'ordine delle somme in virgola
  mobile.

### Cited Findings

**Random123 (Salmon, Moraes, Dror, Shaw, SC11 2011)** [V], dal PDF dell'articolo —
[random123sc11.pdf](https://www.thesalmons.org/john/random123/papers/random123sc11.pdf),
[doi:10.1145/2063384.2063405](https://doi.org/10.1145/2063384.2063405)
- **Definizione:**
  - una famiglia con chiave ha uno spazio di stati S, uscite U, chiavi K, molteplicità J, f: S→S e
    g: K×Z_J×S→U;
  - la successione è s_m = f(s_{m−1}), u_{k,n} = g_{k, n mod J}(s_{⌊n/J⌋});
  - nei generatori «basati su contatore», f(s) = (s+1) mod 2^p e g_{k,j} = h_j ∘ b_k, con b_k una «complex keyed
    bijection» e h_j un selettore del j‑esimo blocco.
- **Periodo.** Il periodo è J·2^p.
- **Risultati dichiarati:**
  - i generatori superano SmallCrush, Crush e BigCrush di TestU01 («Crush‑resistant»);
  - forniscono almeno 2^64 flussi paralleli unici, ciascuno con periodo ≥ 2^128.
- **Threefry‑N×W‑R** è Threefish con R giri e il key schedule semplificato.
  - Risultano Crush‑resistant 2×64‑13, 4×32‑12 e 4×64‑12; Threefry‑4×64‑72 coincide con Threefish‑256 a «tweak»
    nullo.
  - 4×64‑20 ha «eight extra rounds of safety margin».
  - Threefry‑2×32 **non** compare tra le varianti verificate nell'articolo.
- **Philox** usa mulhi/mullo nella S‑box. Risultano Crush‑resistant 4×32‑7, 2×64‑6 e 4×64‑7; i default della
  libreria sono a 10 giri.
- **Uso con identificatori dell'applicazione.** L'articolo propone di ricavare chiave e contatore dalle variabili
  dell'applicazione: identificatore dell'atomo più passo temporale. Così processori diversi calcolano «the same
  per‑atom random forces» senza comunicare. Il metodo è nato in Anton.
- **Prestazioni (Tabella 2).** Philox e Threefry vanno da ~1 a 4 cpB su CPU e da decine a più di 100 GB/s su GPU.

**Threefry‑2×32 a 20 giri** [R]
- È il generatore predefinito di JAX: chiave di 64 bit, contatore di 64 bit, uscita di 64 bit.
- JAX deriva le chiavi con `split`/`fold_in`, cioè una chiave figlia = Threefry(chiave madre, dato) —
  [JAX PRNG design](https://github.com/google/jax/blob/main/docs/jep/263-prng.md).

**Alberi di chiavi** [R]
- GGM (Goldreich–Goldwasser–Micali 1986): da un PRG G(k) = (G_0(k), G_1(k)) si ottiene una PRF
  f_k(x_1…x_n) = G_{x_n}(⋯G_{x_1}(k)) —
  [J. ACM 33(4)](https://doi.org/10.1145/6490.6503).
- Generatori divisibili:
  [Claessen–Pałka 2013, «Splittable PRNGs using cryptographic hashing»](https://doi.org/10.1145/2503778.2503784);
  [Steele–Lea–Flood 2014, SplitMix, OOPSLA](https://doi.org/10.1145/2660193.2660195).

**Hash per la generazione procedurale** [R]
- La generazione procedurale usa hash senza stato: il rumore di Perlin con la tabella di permutazione, le funzioni
  hash su GPU. Jarzynski e Olano le confrontano per qualità e velocità (PCG, xxHash, Threefry, ecc.) —
  [Jarzynski–Olano 2020, JCGT 9(3)](https://jcgt.org/published/0009/03/02/).

**Chiavi spaziali** [R]
- **Morton (ordine Z):** si intercalano i bit delle coordinate. In un octree di profondità L il codice di Morton di
  una cella è la concatenazione delle cifre di ottante (3 bit per livello) lungo il percorso dalla radice. Il codice
  Morton è quindi un indirizzo gerarchico —
  [Morton 1966, IBM report](https://dominoweb.draco.res.ibm.com/reports/Morton1966.pdf).
- **Hilbert:** conserva meglio la località (celle vicine sulla curva sono vicine nello spazio). Moon e coautori ne
  analizzano il clustering —
  [Moon–Jagadish–Faloutsos–Saltz 2001, IEEE TKDE 13(1)](https://doi.org/10.1109/69.908985).
- **HEALPix:** pixelizzazione gerarchica a area uguale della sfera, con indicizzazione «nested»: ogni pixel ha 4
  figli, con 12·4^k pixel —
  [Górski et al. 2005, ApJ 622:759, astro-ph/0409513](https://arxiv.org/abs/astro-ph/0409513).
- **S2 di Google:** curva di Hilbert sulle facce di un cubo proiettato sulla sfera, con celle a 64 bit —
  [S2 geometry](https://s2geometry.io/devguide/s2cell_hierarchy).

**Calcolo pigro e trasparenza referenziale** [R]
- **Church–Rosser:** il λ‑calcolo è confluente, quindi la forma normale, se esiste, è unica qualunque sia l'ordine
  di riduzione.
- **Standardizzazione:** la riduzione in ordine normale (pigra) trova la forma normale ogni volta che esiste.
  Il pigro termina almeno quanto l'avido —
  [Barendregt 1984, *The Lambda Calculus*](https://doi.org/10.1016/C2009-0-13935-8).
- **Call‑by‑need** (pigro con memoria) è corretto rispetto alla semantica:
  [Launchbury 1993, POPL](https://doi.org/10.1145/158511.158618);
  [Ariola–Felleisen–Maraist–Odersky–Wadler 1995, POPL](https://doi.org/10.1145/199448.199507).
- **Trasparenza referenziale**, definizione di Strachey e Quine: sostituire un'espressione con il suo valore non
  cambia il significato —
  [Søndergaard–Sestoft 1990, Acta Informatica 27](https://doi.org/10.1007/BF00264611).
- **Memoizzazione:** [Michie 1968, Nature 218](https://doi.org/10.1038/218019a0).

### Inferences
- **Teorema elementare (mio, banale).** Siano W: Indirizzi → Stati una funzione totale e pura e O un osservatore che
  vede solo valori W(a) per indirizzi a scelti da lui, anche in modo adattivo. Allora la sequenza delle sue
  osservazioni è identica che W sia tabulata tutta in anticipo o calcolata su richiesta con cache arbitraria
  (svuotabile).
  - Dimostrazione: per induzione sul numero di richieste. La scelta k‑esima dipende solo dalle risposte precedenti,
    che sono uguali.
  - Si rompe in tre casi: (a) W dipende da uno stato nascosto (un RNG sequenziale, un ordine di visita);
    (b) W non è totale (non termina) e la tabulazione completa lo è meno; (c) la virgola mobile dipende dall'ordine
    delle somme o dalla macchina.
  - Il caso (c) è il punto debole reale per stateyour: le riduzioni parallele, le FMA e le funzioni trascendenti
    della libreria possono dare bit diversi. Random123 dichiara proprio la «machine‑independence» dei flussi interi.
    I calcoli in virgola mobile a valle no.
- **Chiave a 64 bit e paradosso del compleanno.** La chiave di Threefry‑2×32 è di 64 bit. Se ogni indirizzo è
  mappato a una chiave pseudo‑casuale, la probabilità di almeno una collisione fra N indirizzi è
  ≈ 1 − exp(−N²/2^{65}). Per N = 10^6 vale ≈ 2.7·10^{−8} (coerente con la prova «nessuna collisione su un milione di
  indirizzi»). Per N = 2^{32} ≈ 4.3·10^9 vale già ≈ 0.39 (conto mio).
  - Per un multiverso con miliardi di indirizzi distinti serve una chiave più larga (Threefry‑4×32 o 2×64: 128 bit
    di chiave), oppure una derivazione ad albero tipo GGM/`fold_in`. In quest'ultima l'unicità discende dalla
    struttura e la collisione richiede che coincidano chiave madre e nome.
- **Il percorso è la chiave spaziale.** «galassia g / stella s / pianeta p / punto» è un octree generalizzato. Per
  la superficie di un pianeta, HEALPix «nested» o S2 danno un indirizzo gerarchico a area (quasi) uguale: ogni
  livello di «scala» è una cifra in base 4, e il peso fisico uniforme in area per livello è esatto con HEALPix.

### Gaps
- Le proprietà di Threefry‑2×32‑20 (non elencato tra i Crush‑resistant verificati nell'articolo) e la sua scelta in
  JAX sono [R]. Va controllata la documentazione di Random123 o di JAX.
- Non ho trovato un risultato pubblicato sulla «equivalenza osservativa tra generazione procedurale pigra e mondo
  completo»: è ovvio e non viene enunciato. L'enunciato sopra è mio.

---

## 4. Impronte del contenuto e identità (regola 13)

### Takeaway
Riconoscere due rami come uno solo a una grana g richiede tre passi:
1. una mappa di grana grossa π_g (lo stato a quella grana);
2. una forma canonica c (invariante per le simmetrie irrilevanti: rinumerazioni, permutazioni di particelle uguali,
   cioè isomorfismo di grafi);
3. un'impronta h(c(π_g(x))).

Per «quasi uguale» servono gli hash sensibili alla località, che però danno solo una probabilità e non una
relazione di equivalenza. I pesi si sommano esattamente come immagine diretta della misura sui cammini,
μ_g = (π_g)_# μ. In meccanica quantistica questo vale solo se le storie riunite sono decoerenti.

### Cited Findings

**Isomorfismo e forme canoniche**
- McKay e Piperno descrivono il paradigma di raffinamento e individuazione e ne dimostrano la validità. Aggiornano
  la descrizione di nauty e introducono Traces, che supera i concorrenti (saucy, Bliss, conauto) su molte classi
  difficili [Va] — [«Practical Graph Isomorphism, II», arXiv:1301.1493](https://arxiv.org/abs/1301.1493);
  [nauty e Traces](https://pallini.di.uniroma1.it/).
- **Etichettatura canonica**, definizione standard [R]: è una funzione C tale che C(G) ≅ G e C(G) = C(H) se e solo
  se G ≅ H. Quindi hash(C(G)) è un'impronta invariante per isomorfismo, con collisioni solo dell'hash.
- **Complessità:** l'isomorfismo di grafi si decide in tempo quasi‑polinomiale exp((log n)^{O(1)}) [R] —
  [Babai 2015, arXiv:1512.03547](https://arxiv.org/abs/1512.03547). Anche la forma canonica è
  quasi‑polinomiale [R] — [Babai, STOC 2019](https://doi.org/10.1145/3313276.3316356).
- **Weisfeiler–Leman:** il raffinamento dei colori usato come hash di grafo è veloce, ma è incompleto (non
  distingue per esempio molti grafi regolari) [R].

**Condivisione strutturale** [R]
- L'hash‑consing (Ershov 1958; Filliâtre–Conchon 2006) fa sì che strutture uguali siano lo stesso oggetto in
  memoria — [Filliâtre–Conchon 2006, ML Workshop](https://doi.org/10.1145/1159876.1159880).
- Gli alberi di Merkle e l'indirizzamento per contenuto: l'identità di un nodo è l'hash dei figli (git, IPFS) —
  [Merkle 1987, CRYPTO](https://doi.org/10.1007/3-540-48184-2_32).

**Hash sensibili alla località** [R]
- Una famiglia H è (r, cr, p₁, p₂)‑sensibile se Pr[h(x)=h(y)] ≥ p₁ quando d(x,y) ≤ r e ≤ p₂ quando d ≥ cr. La
  ricerca del vicino approssimato costa ~ n^ρ, con ρ = ln(1/p₁)/ln(1/p₂) —
  [Indyk–Motwani 1998, STOC](https://doi.org/10.1145/276698.276876).
- **MinHash:** Pr[min h(A) = min h(B)] = J(A,B) = |A∩B|/|A∪B| —
  [Broder 1997](https://doi.org/10.1109/SEQUEN.1997.666900).
- **SimHash** (iperpiani casuali): Pr[h(u)=h(v)] = 1 − θ(u,v)/π —
  [Charikar 2002, STOC](https://doi.org/10.1145/509907.509965).

**Grana e pesi** [R]
- Le storie a grana grossa ᾱ = ∪α hanno peso Σ p(α) solo se consistenti, cioè se Re D(α,β) = 0 (vedi §2). Quando
  rami a grana fine si riuniscono in uno stesso stato, in meccanica quantistica le ampiezze interferiscono: la
  somma vale per le ampiezze, non per le probabilità —
  [Gell‑Mann–Hartle, gr-qc/9210010](https://arxiv.org/abs/gr-qc/9210010).

**Univalenza** [R]
- Il principio «ciò che è uguale è lo stesso» ha una versione formale. In HoTT l'assioma di univalenza dice
  (A = B) ≃ (A ≃ B): strutture equivalenti sono identiche, e tutto ciò che si dice di una vale per l'altra —
  [HoTT Book 2013](https://homotopytypetheory.org/book/).

### Inferences
- **Definizione proposta.** Due nodi x, y dell'albero sono «lo stesso stato a grana g» se c(π_g(x)) = c(π_g(y)).
  L'impronta F_g(x) = H(c(π_g(x))) va presa con H a 128–256 bit, per rendere trascurabili le collisioni anche con
  10^{12} stati: il conto del compleanno dà ≈ N²/2^{b+1}.
- **Somma dei pesi.** Se μ è la misura sui cammini (§1–2) e Σ_g(s) è l'insieme dei cammini che a grana g passano per
  lo stato s nel tempo t, allora w_g(s,t) = μ(Σ_g(s,t)) = Σ_{nodi x : F_g(x)=s} μ([x]). La somma è esatta perché i
  cilindri dei nodi distinti allo stesso tempo sono disgiunti.
  - È l'immagine diretta (π_g)_# μ, e il grafo diventa un DAG.
  - Il futuro dello stato riunito ha peso w_g(s)·κ(futuro|s) solo se la dinamica a grana g è markoviana, cioè se il
    futuro dipende solo da s e non dal cammino. Altrimenti i due rami sono uguali «finché nessuno guarda più fine»
    (regola 13), ma divergono quando un evento legge un dettaglio sotto la grana.
- **Un'impronta LSH non può sostituire l'uguaglianza.** «Quasi uguale» non è transitivo, quindi non definisce
  classi. Serve per trovare candidati, che poi si confrontano con la forma canonica esatta.
- **Due identità distinte, entrambe necessarie.** L'indirizzo del percorso (come ci si arriva) dice qual è il seme.
  L'impronta del contenuto dice che cos'è lo stato. Una rete in cui «alcune strade si richiudono» indicizza i nodi
  per impronta e conserva l'insieme dei percorsi entranti con i loro pesi: è l'hash‑consing applicato agli stati del
  mondo.

### Gaps
- Non ho trovato una fonte che tratti il riconoscimento di rami uguali in simulazioni di molti mondi con hash
  canonici. La costruzione è mia.
- Le formule LSH e la complessità di Babai sono [R]. Ho letto solo l'abstract di McKay–Piperno.

---

## 5. Linguaggi formali per l'intero

### Takeaway
Ogni candidato copre un aspetto diverso.
- **Fasci e prefasci** su un sito di regioni: «dati locali che si incollano». La contestualità è proprio
  l'impossibilità di incollare (Abramsky–Brandenburger).
- **Categorie monoidali:** i processi e la loro composizione (Abramsky–Coecke; categorie di Markov per i nuclei
  stocastici).
- **Topos** (Isham–Döring): una logica intuizionista per le proposizioni fisiche.
- **Teoria dei tipi:** il linguaggio di specifica verificabile.
- **Il criterio controfattuale di Chalmers** dice quando una struttura «è» un calcolo.

In Hoffman, Prakash e Prentner 2023 è solida la parte di nuclei di Markov e politopi (fatti elementari e
definizioni). Il ponte fisico verso amplituedro, particelle e massa è congetturale.

### Cited Findings

**Fasci e contestualità**
- Abramsky e Brandenburger usano la teoria dei fasci per trattare insieme non‑località e contestualità su «arbitrary
  measurement covers» [Va] — [arXiv:1102.0264](https://arxiv.org/abs/1102.0264):
  - «contextuality, and non‑locality as a special case, correspond exactly to obstructions to the existence of
    global sections»;
  - c'è una gerarchia propria Bell < Hardy < GHZ;
  - la contestualità massima è «non‑existence of global sections in the support».
- **Impostazione** [R]:
  - un insieme di misure X, con una copertura di contesti compatibili;
  - il fascio degli eventi E(U) = O^U;
  - il prefascio delle distribuzioni D_R E;
  - un modello empirico è una famiglia compatibile {e_C};
  - un modello è non contestuale se e solo se esiste una sezione globale d ∈ D_R E(X) che restringe a ogni e_C.
- **Definizione di fascio** [R]: un prefascio F: O(X)^op → Set con località e incollamento. Per ogni copertura
  {U_i} di U, sezioni s_i ∈ F(U_i) che coincidono sulle intersezioni (s_i|_{U_i∩U_j} = s_j|_{U_i∩U_j}) si incollano
  in un'unica s ∈ F(U) —
  [Mac Lane–Moerdijk, *Sheaves in Geometry and Logic*](https://doi.org/10.1007/978-1-4612-0927-0).
- **Usi informatici dei fasci** [R]: semantica di oggetti concorrenti
  ([Goguen 1992, MSCS 2](https://doi.org/10.1017/S0960129500001420)); fasci e cofasci applicati
  ([Curry, arXiv:1303.3255](https://arxiv.org/abs/1303.3255)).

**Categorie per la fisica**
- **Abramsky–Coecke 2004** [R]: la meccanica quantistica in categorie compatte con pugnale (dagger compact). Il
  teletrasporto e lo scambio di entanglement diventano identità diagrammatiche —
  [quant-ph/0402130](https://arxiv.org/abs/quant-ph/0402130). Il manuale è
  [Coecke–Kissinger, *Picturing Quantum Processes*, 2017](https://doi.org/10.1017/9781316219317).
- **Pietra di Rosetta** fra fisica, topologia, logica e calcolo (categorie monoidali chiuse) [R] —
  [Baez–Stay, arXiv:0903.0340](https://arxiv.org/abs/0903.0340).
- **Categorie di Markov** [R]: una cornice sintetica per nuclei di Markov, indipendenza condizionata e sufficienza.
  FinStoch e Stoch ne sono esempi —
  [Fritz 2020, arXiv:1908.07021](https://arxiv.org/abs/1908.07021).

**Topos** [Va] — [Döring–Isham, «What is a thing?», arXiv:0803.0417](https://arxiv.org/abs/0803.0417)
- Costruire una teoria fisica significa rappresentare un linguaggio formale del sistema in un topos. La fisica
  classica usa il topos degli insiemi.
- Una grandezza è una freccia da un «state‑object» a un «quantity‑value object».
- Ci sono due linguaggi (proposizionale e tipato di ordine superiore), ed entrambi danno una logica intuizionista.
- La «daseinisation» manda un proiettore in un sottooggetto del «prefascio spettrale».
- Il topos è quello dei funtori controvarianti a valori insiemi sul poset delle sottoalgebre commutative.
- **Il legame con Kochen–Specker** [R]: il prefascio spettrale non ha sezioni globali (Isham–Butterfield) —
  [quant-ph/9803055](https://arxiv.org/abs/quant-ph/9803055). La variante covariante è in
  [Heunen–Landsman–Spitters, arXiv:0709.4364](https://arxiv.org/abs/0709.4364).

**Teoria dei tipi come specifica** [R]
- La teoria dei tipi dipendenti (Martin‑Löf, HoTT) permette di scrivere tipi come
  `Indirizzo → Stato` e `∀ a, eval a = eval a`, verificati da Coq o Lean.
- L'univalenza dà l'identità strutturale (§4) — [HoTT Book](https://homotopytypetheory.org/book/).

**Chalmers, «Does a rock implement every finite‑state automaton?»** [V] —
[consc.net/papers/rock.html](https://consc.net/papers/rock.html)
- **Automa finito senza ingressi.** Un sistema fisico lo implementa se c'è una mappa dagli stati fisici agli stati
  formali tale che, per ogni transizione formale P→Q, uno stato fisico mappato su P causa una transizione in uno stato
  mappato su Q.
- **Automa a stati combinatori** (CSA). Serve una scomposizione degli stati in sottostati, ciascuno in una regione
  fisica distinta, e una mappa che rispetti ogni transizione formale con ingresso e uscita.
- **I condizionali** «have modal force, and in particular are required to support counterfactuals»: il sistema deve
  transitare correttamente comunque si trovi nel primo stato, anche per le transizioni non manifestate.
- **Diagnosi di Putnam.** La sua costruzione fa coincidere solo la traccia effettiva, e «has failed to ensure that his
  system reflects the structure of the FSA». Con orologio e quadrante si ottiene una forma indebolita della tesi di
  Putnam.

**Hoffman, Prakash e Prentner 2023, «Fusions of Consciousness»** (Entropy 25(1):129) [V] —
[PMC9858210](https://pmc.ncbi.nlm.nih.gov/articles/PMC9858210/); [doi:10.3390/e25010129](https://doi.org/10.3390/e25010129)
- **Agente cosciente:** C = ((X,𝒳),(G,𝒢),(W,𝒲),P,D,A), con nuclei markoviani P: W×X→[0,1], D: X×G→[0,1] e
  A: G×W→[0,1].
- **Nucleo dei qualia:** Q = DAP: X×X→[0,1]. Nel caso finito è un prodotto di matrici.
- **Due 1‑agenti:** Q₁⊗Q₂ a blocchi diagonali. Il 2‑agente è Q = [[1−x, x],[y, 1−y]].
- **Flusso:** dQ/dτ = (x(1−x−y), y(1−x−y)), derivato da Q²−Q. Gli stazionari (QQ = Q) stanno su y = 1−x, con
  rango 1, e il calo di rango «signals the fusion of agents».
- **Politopo di Markov M_n:** le matrici n×n stocastiche, con n^n vertici e dimensione n(n−1).
  - Il testo è incoerente: la §5 lo chiama «a unit cube in n‑dimensional real space».
  - Il «simplesso di fusione» F_n¹ è un (n−1)‑simplesso (Proposizione A3(i), dimostrata).
  - Altre affermazioni sono congetture A1–A3.
  - Lemma A1 (Brouwer): ogni matrice stocastica ha una distribuzione stazionaria.
- **Permutazioni decorate.** Nella Def. 1, σ: n̄→{1,…,2n} con a ≤ σ(a) ≤ a+n e σ mod n una permutazione. La
  Def. 2 (permutazione decorata markoviana) dice:
  - a transitorio: σ(a) = a;
  - a assorbente: σ(a) = a+n;
  - a ricorrente: σ(a) è il primo b > a tale che (a, a+1, …, b) contiene la classe comunicante di a.
  - Le celle S_σ sono gli insiemi di nuclei con la stessa σ: M₂ ne ha 4.
- **Congetture, non dimostrate:**
  - «a particle (in spacetime) is an aspect of a physical projection of the dynamics of a communicating class of
    conscious agents»;
  - i flussi di M₃ corrisponderebbero alle due ampiezze a 3 particelle;
  - massa, impulso e spin: «It will be intriguing to see how…», senza costruzione.
  - Amplituedro e Grassmanniana positiva sono citati dalla letteratura, non derivati nell'articolo.
- **Tempo entropico, dimostrato.** Con una dinamica omogenea a entropia costante,
  H(X_n|X₁) ≥ H(X_{n−1}|X₁).
- **Fonti delle strutture citate** [R]: le permutazioni decorate e le celle positroidali sono di
  [Postnikov, math/0609764](https://arxiv.org/abs/math/0609764); l'amplituedro è di
  [Arkani‑Hamed–Trnka, arXiv:1312.2007](https://arxiv.org/abs/1312.2007).
- **Catene traccia.** Nel testo letto (fino all'appendice A) le «trace chains» non compaiono. Il concetto standard
  [R] è la catena traccia, o complemento stocastico, su A ⊂ S:
  - P_A = P_{AA} + P_{AB}(I − P_{BB})^{−1}P_{BA} (complemento di Schur);
  - la sua stazionaria è π|_A/π(A) —
    [Meyer 1989, SIAM Review 31(2)](https://doi.org/10.1137/1031050).

### Inferences
- **Lo schema più aderente a stateyour** è una combinazione di tre strutture:
  - **un prefascio** sul sito delle regioni-indirizzo: gli aperti sono i sottoalberi dell'indirizzo, le restrizioni
    sono «dal grande al piccolo» (regola 4), e la condizione di fascio è la compatibilità sugli incroci, cioè le
    bolle che si incontrano (regola 12);
  - **una categoria di Markov** per gli eventi: ogni evento è un nucleo, comporre è proseguire il ramo, e il prodotto
    tensoriale rappresenta i contenitori indipendenti;
  - **la misura di Ionescu‑Tulcea** che queste due strutture inducono sui cammini.
  - Il «pianeta parallelo» (una bolla che contraddice ciò che c'è porta in un altro ramo) è proprio l'assenza di una
    sezione globale nel ramo corrente: la stessa forma di una prova di contestualità.
- **Chalmers dà a stateyour un argomento preciso.** Per la regola 1 tutto il mondo è una funzione totale
  dell'indirizzo, quindi tutti i controfattuali sono definiti (ogni indirizzo si può valutare, anche quelli mai
  visti). Una registrazione di stati letti non soddisfa il criterio; le leggi più la fonte unica del caso sì. È la
  differenza tra «biblioteca» e «polvere» (Egan).
- **Hoffman e coautori: che cosa è solido.** Il politopo delle matrici stocastiche come prodotto di n simplessi
  (dimensione n(n−1), n^n vertici), le stazionarie e le classi comunicanti sono matematica elementare e corretta. La
  mappa da catene a permutazioni decorate è una definizione ben posta ma arbitraria: la Def. 2 sceglie un ordine
  ciclico degli stati, e il risultato dipende da quell'ordine. Ogni legame con particelle o ampiezze è congettura.
  - Per stateyour se ne ricava solo la forma «matrice relazionale di nuclei, catene traccia per guardare un
    sottoinsieme». È l'analogo markoviano della «bolla»: il complemento stocastico è la dinamica vista da una regione
    che ignora il resto.
- **Teoria dei tipi.** È il candidato pratico per le prove di regola: per esempio un tipo `Evento` che porta il suo
  contenitore e il suo tempo, e un lemma «un ramo cambia solo ciò che sta dentro e dopo».

### Gaps
- Non ho letto l'articolo successivo sulle «trace chains» (se esiste come lavoro separato di Hoffman e coautori). La
  parte sulle catene traccia è [R] dalla teoria standard delle catene di Markov.
- Il corpo di Abramsky–Brandenburger e di Döring–Isham non è stato letto ora (solo gli abstract). I dettagli della
  costruzione sono [R].
- Non ho trovato un lavoro che modelli una simulazione procedurale come fascio su un albero di indirizzi.
  L'accostamento è mio.

---

### Nota sulle fonti tentate
- La voce di Scholarpedia «Algorithmic probability» ha risposto 503.
- MDPI (Entropy) ha risposto 403; ho usato la copia aperta su PMC.
- Il PDF di Random123 è stato letto per intero dopo l'estrazione del testo.
