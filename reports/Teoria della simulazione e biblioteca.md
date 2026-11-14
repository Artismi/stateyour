# La teoria della simulazione e la biblioteca degli universi

*Ricerca del 2026-11-14. Note di lavoro e citazioni in `research_notes/Teoria della simulazione e biblioteca/fonti_lette.md`.*

## In breve

La domanda era se le obiezioni di costo alla teoria della simulazione («non c'è abbastanza energia per calcolare un
universo») possano avere come risposta una biblioteca di tutti gli universi possibili che esiste come rete di
relazioni e che si «contempla» nell'esperienza, invece di essere calcolata.

**La risposta è sì, ma l'idea non è nuova, e risponde cambiando la domanda.** Tegmark (2008) lo dice quasi con le
stesse parole: se il mondo è una struttura matematica, il calcolo deve solo *descriverne* le relazioni, non farlo
evolvere, e «non c'è quindi bisogno che questi calcoli siano eseguiti». Schmidhuber (1997) aveva già mostrato che
tutti gli universi insieme costano meno informazione di uno solo. Egan (1994) e Wolfram (2021) dicono cose vicine. I
conti di costo (Lloyd, Vazza) restano veri, ma valgono per un simulatore che gira nel tempo dentro un universo con le
nostre leggi. Una struttura che esiste senza essere eseguita semplicemente non ha costo.

Il prezzo però non scompare: diventa il **problema della misura**. Se esistono tutte le storie, bisogna dire perché ci
si trova in una regolare (i «conigli bianchi», i «cervelli di Boltzmann»). Bisogna anche dire che cosa distingue
un'esperienza da una qualsiasi disposizione di stati: è il problema dell'implementazione, di Putnam e Chalmers.

Stateyour si trova in una posizione più favorevole della maggior parte di queste teorie, perché la sua biblioteca
non contiene tutte le strutture matematiche ma tutte le storie di **leggi fissate**. La misura allora viene dalle
leggi (i pesi dei rami), non da una scelta sulle stringhe di bit. Al progetto manca però ancora una misura sugli
indirizzi stessi («un punto a caso»), e su questo la letteratura dà una ricetta concreta.

## Come leggere

- **[V]**: letto ora sul testo della fonte.
- **[Va]**: letto solo nell'abstract o in un estratto della pagina.
- **[R]**: ricordato, non riletto.

Ogni affermazione è anche di una di cinque **nature**: *misura* (un dato osservato), *teorema* (dimostrato entro le
sue ipotesi), *stima* (un conto con ipotesi dichiarate), *ipotesi* (una tesi che si può discutere, non verificata) e
*speculazione* (metafisica, non verificabile). In fondo al rapporto trovi le *proposte* per il programma.

---

## 1. L'argomento di simulazione (Bostrom 2003)

**Che cosa dice.** Prendiamo tre grandezze [V]:
- f_P: la frazione delle civiltà come la nostra che arrivano allo stadio «postumano»;
- N̄: il numero medio di simulazioni dei propri antenati che una di queste civiltà fa girare;
- H̄: il numero medio di persone vissute prima di quello stadio.

La frazione delle persone con esperienze di tipo umano che vivono in una simulazione è allora

  f_sim = f_P·N̄·H̄ / (f_P·N̄·H̄ + H̄).

Si scrive N̄ = f_I·N̄_I, dove f_I è la frazione delle civiltà interessate a simulare e N̄_I è quante simulazioni fa
ciascuna di loro. Si ottiene f_sim = f_P f_I N̄_I / (f_P f_I N̄_I + 1). Poiché N̄_I sarebbe enorme, almeno una di tre
cose è vera: f_P ≈ 0 (quasi nessuno arriva), f_I ≈ 0 (quasi nessuno vuole) oppure f_sim ≈ 1 (*teorema*: è
aritmetica, se si accettano le definizioni).

Seguono due passi che non sono teoremi.
- **Indifferenza.** Se una frazione x degli osservatori come noi è simulata e non abbiamo indizi in contrario,
  allora la nostra fiducia di esserlo deve valere x: Cr(SIM | f_sim = x) = x [V] (*ipotesi*).
- **Indipendenza dal substrato.** Una mente è un calcolo e basta riprodurlo a grana di sinapsi [V] (*ipotesi*).

**Il costo secondo Bostrom.** Un cervello fa 10¹⁴–10¹⁷ operazioni al secondo. Tutta la storia umana (100 miliardi
di persone × 50 anni) costa quindi 10³³–10³⁶ operazioni, mentre un computer di massa planetaria ne farebbe ~10⁴²
al secondo [V] (*stima*). Bostrom ammette che simulare tutto l'universo fino alla scala quantistica è «ovviamente
impossibile». Propone lui stesso il **calcolo pigro**: il microscopico si riempie «ad hoc», «secondo il bisogno»,
quando qualcuno sta per guardare. Se c'è un errore, il regista corregge i cervelli o torna indietro di qualche
secondo [V].

**Le critiche principali.**
- *Sull'indifferenza.* Weatherson (2003) distingue quattro letture del principio [V]. Due sono false, una non porta
  alla conclusione, e la quarta ci porta solo se la nostra evidenza dipende soltanto dalle esperienze coscienti
  (un'ipotesi che «non abbiamo ragione di credere»). Per un esternista vedere un pugnale e vederne uno simulato sono
  evidenze diverse.
- *Sul substrato.* Se la coscienza dipende dalla materia e non solo dal calcolo, i sims non sono osservatori e
  l'argomento cade. Il ventaglio va da Searle alla teoria dell'informazione integrata, per la quale un computer
  digitale che simula un cervello non è cosciente [R].
- *Lo stato del dibattito.* Chalmers (*Reality+*, 2022) riformula l'argomento: senza «sim blockers», la maggior parte
  degli esseri di tipo umano sono simulati, quindi probabilmente lo siamo [V]. Tra i blockers mette anche «le
  simulazioni richiederanno troppa potenza di calcolo». Conclude che non sappiamo se un blocker vale, che la
  probabilità di essere simulati non è trascurabile e che, se lo siamo, il mondo resta reale: è fatto di bit, ma
  esiste [V]. Una recensione riporta la sua stima di almeno il 25% [Va].

## 2. Il costo

| Chi | Che cosa | Numero | Natura |
|---|---|---|---|
| Margolus–Levitin, in Lloyd 2002 | massimo di operazioni al secondo con energia E | ≤ 2E/(πħ) [V] | teorema |
| Lloyd 2002 | operazioni possibili dal Big Bang | ≈ (t/t_P)² ≈ 10¹²⁰ [V] | stima |
| Lloyd 2002 | bit nella materia, e con la gravità | ≈ 10⁹⁰; ≈ 10¹²⁰ [V] | stima |
| Bekenstein, olografico | entropia massima di una regione | S ≤ 2πk_B E R/(ħc) = A/4 (in unità di Planck) [Va] | teorema per la prima, congettura ben sostenuta per la seconda |
| Vazza 2025 | universo visibile a risoluzione di Planck | ~3,5·10¹²⁴ bit; ~10¹⁰⁹ erg, contro ~3·10⁷⁸ erg dell'universo intero [Va] | stima |
| Vazza 2025 | Terra a risoluzione di Planck | ~10⁷⁵ bit; ~2,5·10⁵⁹ erg (energia di legame della Via Lattea) [Va] | stima |
| Vazza 2025 | Terra alla scala del neutrino più energetico osservato (~10¹⁷ eV, λ ≈ 10⁻²¹ cm) | ~1,6·10⁵¹ bit; in tempo reale 10⁷³–10⁷⁵ erg/s, più di tutte le stelle [Va] | stima |
| Beane, Davoudi, Savage 2012 | passo minimo di un reticolo sotto la fisica | 1/b ≳ 10¹¹ GeV, dal taglio dei raggi cosmici [Va] | misura usata come limite |

In parole semplici:
- **Margolus–Levitin**: un sistema con energia E non può cambiare stato in modo distinguibile più spesso di
  2E/(πħ) volte al secondo.
- **Lloyd** applica questo limite a tutta l'energia dell'universo per tutta la sua età. Legge i numeri in tre modi
  [V]: come tetto di ciò che l'universo può calcolare; come **minimo** di bit e operazioni per un computer quantistico
  che lo simuli *direttamente*; come numeri del calcolo che l'universo stesso «fa».
- **Il limite di Bekenstein e quello olografico** dicono quanta informazione può stare in una regione: al massimo
  quanta ne sta sulla sua superficie misurata in aree di Planck, non nel suo volume.
- **Vazza** usa il limite olografico e aggiunge il costo minimo di Landauer per bit (k_B T ln 2). Conclude che per
  un simulatore in un universo con le nostre leggi è «quasi impossibile» [Va]. Le sue ipotesi sono dichiarate: le
  stesse leggi, il limite olografico vero, e una compressione che non guadagna molti ordini di grandezza.

**Il problema del segno (Ringel & Kovrizhin 2017).** Il Monte Carlo quantistico calcola le proprietà di un sistema
quantistico come una media di numeri positivi. Quando questi numeri hanno segni alterni la media si cancella e
l'errore cresce in modo esponenziale: è il «problema del segno». I due autori mostrano che, per i sistemi bosonici
con una «risposta gravitazionale quantizzata» (per esempio la conduttanza di Hall termica di certi stati di Hall
quantistico frazionario), **nessuna** formulazione *locale* senza segno è possibile [Va] (*teorema*, entro quelle
ipotesi). I giornali ne hanno fatto «l'universo non è una simulazione».

Aaronson (2017) risponde in tre punti [Va]:
- il risultato esclude solo le trasformazioni locali, non tutti gli algoritmi classici (escluderli tutti richiederebbe
  di risolvere P ≠ PSPACE);
- il simulatore può usare un computer quantistico, che secondo Lloyd simula in modo efficiente ogni sistema locale
  [V], oppure può semplicemente metterci di più;
- l'ipotesi di simulazione «non è stata falsificata, e resta infalsificabile».

**Il segno del reticolo (Beane, Davoudi, Savage 2012).** Se l'universo fosse calcolato su una griglia, l'energia
avrebbe un tetto legato al passo della griglia. Il taglio osservato nei raggi cosmici di energia più alta (di fatto il
taglio GZK [R]) dice che quel tetto, se esiste, sta sopra ~10¹¹ GeV. Un segno sarebbe che i raggi di energia più alta
arrivano più spesso lungo gli assi della griglia [Va]. È l'unico dei conti di costo che diventa una *misura*
possibile, ma vale solo per un reticolo cubico semplice.

**Che cosa hanno in comune.** Tutte queste obiezioni presuppongono tre cose:
1. un simulatore che sta dentro un universo con leggi come le nostre;
2. una simulazione che va **avanti nel tempo** passo dopo passo;
3. a una risoluzione fissata.

Bostrom toglie già la terza con il calcolo pigro. La biblioteca toglie la prima e la seconda.

## 3. Le alternative che non fanno «girare» niente

### Schmidhuber 1997: tutti gli universi costano meno di uno

Si mettono in fila tutti i programmi possibili A1, A2, A3, … e li si fa girare a incastro (**dovetailing**): A1 fa
un'istruzione ogni due passi, A2 una ogni due dei passi rimasti, e così via. Ogni passo di ogni universo calcolabile
prima o poi viene calcolato [V].

Il punto centrale è un'affermazione sull'**informazione**, non sul tempo [V]. Il programma che enumera tutto è
cortissimo. Un universo solo, preso con il suo rumore particolare, è invece quasi sempre incomprimibile: per
descriverlo serve una lunghezza pari alla sua intera storia. Da qui il motto «più è meno». Sui molti mondi
Schmidhuber scrive che dal punto di vista del programmatore «non ci sono vere divisioni»: ci sono programmi che danno
risultati identici per un po' e poi divergono [V]. Il tempo non conta: le creature vivono nel loro tempo locale e non
sanno quante istruzioni costa un loro passo [V].

**La misura (prior universale di Solomonoff–Levin)** [V]:

  P_U(s) = Σ_{p : U(p) = s} 3^{−|p|}

In parole: la probabilità di una storia s è la probabilità di ottenere, scrivendo i simboli di un programma a caso,
un programma che la produce. Il programma p ha lunghezza |p| e l'alfabeto ha tre simboli; con due simboli si scrive
2^{−|p|}.

Valgono due teoremi:
- **del compilatore**: cambiando macchina U, P_U cambia al massimo per un fattore costante;
- **di codifica**: la somma è dominata dai programmi più corti, cioè P_U(s) ≈ 2^{−K(s)}, dove K(s) è la complessità
  di Kolmogorov di s.

Schmidhuber ne trae una *ipotesi*: il nostro universo è probabilmente prodotto da un programma corto, e quindi
resterà regolare. Nel 2000 introduce lo **speed prior**, che pesa anche il tempo di calcolo: la probabilità totale di
ciò che non si calcola entro il tempo t vale 1/t [Va]. È l'unica misura di questa famiglia per cui il costo torna a
contare.

### Tegmark: le strutture esistono, non si eseguono

L'ipotesi dell'universo matematico (MUH) dice che la realtà esterna *è* una struttura matematica, cioè enti astratti
e relazioni tra loro, e non che sia descritta da una [V]. Due strutture isomorfe «sono la stessa» [V]. Le sole
proprietà intrinseche sono le relazioni, «senza tempo e immutabili». La probabilità nasce solo dall'ignoranza su
quale elemento di un insieme si è [V].

Il passo che risponde direttamente alla domanda sta nella sezione «L'equivoco del tempo» [V]. È un errore
identificare il tempo fisico con la sequenza dei passi di un calcolo: un calcolo deve solo *descrivere* l'universo,
cioè definirne tutte le relazioni, non farlo evolvere. Ne segue che «non c'è quindi bisogno che questi calcoli siano
eseguiti». Tegmark aggiunge una restrizione, l'ipotesi dell'universo calcolabile (CUH: esistono solo strutture
definite da funzioni calcolabili). Servirebbe contro i paradossi di Gödel e ad attenuare la misura [V] (*speculazione*
metafisica, per sua natura).

Le critiche:
- **La misura.** Tegmark stesso ammette che non è risolta nemmeno per il multiverso dell'inflazione [V].
- **Chi legge la struttura.** Che cosa trasforma una struttura in un'esperienza.
- **La coerenza.** Page obietta che strutture contraddittorie non possono coesistere. Tegmark risponde che le
  strutture non «affermano» niente [V].

### Egan, la teoria della polvere, e il problema dell'implementazione

In *Permutation City* (1994) un'esperienza simulata resta continua anche se i suoi stati sono calcolati in disordine,
sparsi, a pezzi. La causalità sarebbe solo correlazione tra stati, quindi «qualunque insieme di esperienze dovrebbe
essere possibile» [V]. Egan stesso non ci crede. Dice di non conoscere una confutazione logica, ma l'universo è
«troppo ordinato»: le disposizioni caotiche con osservatori dovrebbero essere «miliardi di volte» più numerose di
quelle ordinate [V]. È già il problema della misura. Tegmark cita Egan per dire che il ritmo del tempo percepito non
dipende dal ritmo del computer [V].

In filosofia la stessa idea è il **problema della banalità dell'implementazione**. Secondo Putnam ogni sasso realizza
ogni automa finito, secondo Searle un muro «esegue» WordStar. Chalmers (1996) risponde che realizzare un calcolo
richiede transizioni affidabili e **controfattuali**: devono valere per ogni transizione possibile, non solo per
quella che è avvenuta. Una registrazione di stati sparsi non le ha [Va]. Questa è l'obiezione seria alla teoria della
polvere: l'ordine non sta nell'esecuzione, ma sta nella **struttura delle relazioni controfattuali**.

### Wolfram, il ruliad

È «il limite intrecciato di tutto ciò che è calcolabile»: tutte le regole applicate in tutti i modi [Va]. Non
richiede un input esterno, esiste per necessità formale, e la sua costruzione passo dopo passo è solo un modo di
descriverlo. Gli osservatori sono limitati nel calcolo, persistenti e sequenziali, e ne campionano un pezzo. Le leggi
che vediamo dipenderebbero da *come* lo campioniamo, e la struttura si ramifica e **si riunisce** [Va]
(*speculazione*, con un programma di ricerca).

### Hutter 2010: anche l'indirizzo costa

Hutter formalizza ciò che resta a una teoria «di tutti gli universi» [V]. Una teoria completa deve specificare:
- (i) le condizioni iniziali;
- (e) l'evoluzione;
- (l) la **localizzazione dell'osservatore**;
- (n) il rumore;
- (o) che cosa l'osservatore sa percepire.

Tra due teorie si sceglie quella con Length(i) + Length(e) + Length(l) minima. Il multiverso di Schmidhuber «nudo» è
«una teoria del nulla»: ha senso solo con l'indirizzo di chi guarda. Un multiverso «à la carte» (tutte le stringhe)
ha un indirizzo lungo quanto l'universo, e quindi perde. I numeri sono piccoli: localizzare il Sole tra ~3·10²² stelle
costa ~75 bit, la Terra tra gli 8 pianeti 3 bit, una persona 33 bit [V]. **È la versione formale di «ogni esperienza
è un indirizzo che si estrae».**

### Il calcolo pigro come «segno di simulazione», e perché non distingue

Bostrom lo propone come risparmio [V]. Campbell e altri (2017) suggeriscono di cercarlo in laboratorio: la realtà
sarebbe «resa» solo quando l'informazione su quale fenditura ha attraversato la particella diventa disponibile a uno
sperimentatore, non a un rivelatore [Va]. Ammettono però che il caso «cancello l'informazione prima di guardare» dà
le frange anche in meccanica quantistica standard [Va].

In fisica non distingue nulla, per tre ragioni.
1. **La sola informazione presente basta.** Basta che l'informazione sul cammino sia fisicamente presente da qualche
   parte (decoerenza) perché le frange spariscano, con o senza qualcuno che la legge. È ciò che dicono la teoria
   standard e gli esperimenti di cancellazione quantistica [R].
2. **Un calcolo pigro coerente non si vede dall'interno.** Se lo stesso indirizzo dà sempre la stessa cosa,
   qualunque domanda che si possa fare dall'interno ha la stessa risposta del calcolo completo (*teorema*,
   elementare). Stateyour lo mostra da sé: la regola 1 dice che ciò che si butta si ricalcola identico.
3. **Si vedrebbero solo i difetti.** Una simulazione pigra si tradirebbe soltanto con incoerenze (gli «errori» che il
   regista di Bostrom deve correggere) o con limiti di risoluzione (il reticolo di Beane). Non si tradirebbe per il
   fatto di essere pigra.

## 4. Il problema della misura

Se esistono tutte le storie, perché la nostra è regolare?
- **Il coniglio bianco.** Marchal, poi Standish (2000), nota che le storie in cui per un attimo una legge salta (un
  coniglio bianco che vola per la stanza) dovrebbero essere molto più numerose di quelle in cui le leggi tengono,
  perché ci sono più modi di sbagliare che di essere corretti [V].
- **I cervelli di Boltzmann.** In un universo che dura abbastanza, un osservatore nato da una fluttuazione casuale,
  con ricordi falsi, è più probabile di uno nato da una lunga storia. Carroll (2017) aggiunge che una teoria dominata
  da cervelli di Boltzmann è «cognitivamente instabile»: non può essere vera ed essere creduta per buone ragioni allo
  stesso tempo. Il problema non si toglie cambiando la distribuzione sugli osservatori [Va].

Le risposte:
- **Schmidhuber e Standish (semplicità).** Con il prior universale le storie lunghe da descrivere pesano 2^{−K}. Un
  coniglio bianco riconoscibile è un'eccezione con molta informazione, quindi rara. La maggior parte dei «guasti»
  sembra semplice rumore, e un osservatore finito comprime ciò che vede [V]. Restano due punti deboli [V]: la scelta
  della macchina U (il fattore costante può invertire l'ordine di due storie) e il fatto che scegliere *questa* misura
  sembra arbitrario («una misura sulle misure»).
- **Tegmark.** Esclude come candidate le strutture in cui l'osservatore tipico è un cervello di Boltzmann [V]. È un
  criterio di selezione, non una derivazione. Gli eventi «miracolosi» sono permessi dalle leggi note ma con
  probabilità esponenzialmente piccole [V].
- **Everett.** Dentro una teoria fissata la misura c'è già: è il peso dei rami, |ψ|² (la regola di Born). Carroll e
  Sebens (2014) la ricavano dall'incertezza di chi, dopo la decoerenza, non sa ancora in quale ramo si trova [Va];
  Deutsch e Wallace la ricavano dalla teoria delle decisioni [R]. È un'*ipotesi* discussa, ma è la sola misura di
  questo elenco che venga da una legge fisica invece che da una scelta.

---

## 5. La risposta alla domanda

1. **Una biblioteca che esiste come rete di relazioni non ha costo di calcolo, ma per definizione: non è eseguita.**
   Lloyd, Vazza e Ringel–Kovrizhin non la toccano, perché parlano di un simulatore nel tempo con le nostre leggi.
   Questa è la tesi di Tegmark [V] e, nella forma informazionale, quella di Schmidhuber [V]. Non è quindi una
   risposta nuova. È nella natura della *speculazione* metafisica: nessuna misura può confermarla o smentirla.
2. **Toglie l'argomento di Bostrom insieme alla sua obiezione.** Se tutto esiste come struttura, «essere in una
   simulazione» non indica più nessun fatto in più: la domanda diventa quella di Aaronson, «scientificamente vuota».
3. **Il costo si sposta in tre posti, e nessuno è gratis.**
   - *La misura*: dire quali esperienze sono tipiche.
   - *L'indirizzo*: le lunghezze di Hutter. Sono piccole, ma un indirizzo che contiene tutto il rumore della storia è
     lungo quanto la storia stessa.
   - *L'estrazione*: per chi la calcola davvero, come il programma, leggere un punto senza far girare la storia è
     possibile solo dove le leggi offrono scorciatoie. Dove la dinamica è caotica o «computazionalmente
     irriducibile» (Wolfram [R]), l'unico modo esatto di conoscere lo stato al tempo t è percorrere i passi.

## 6. Dove stateyour coincide con le posizioni esistenti, e dove no

| Regola di stateyour | Posizione esistente | Coincide? |
|---|---|---|
| 1. L'indirizzo è l'identità; il mondo è funzione dell'indirizzo | Hutter: (l), la localizzazione; Tegmark: esistono le relazioni, non gli stati salvati | sì. L'indirizzo è il termine Length(l) reso esplicito |
| 3. Tutti gli esiti esistono; osservare è leggere, non crea niente | Everett; Schmidhuber «non ci sono vere divisioni» [V]; Egan | sì |
| 8. Si calcola solo ciò che si guarda | Bostrom (calcolo pigro) [V]; Tegmark (descrivere, non evolvere) [V] | sì per il risparmio. Diversa la lettura: in stateyour il calcolo pigro non è un trucco del simulatore ma il leggere di regola 3 |
| 11. La bolla: si fissa un pezzo e si entra nella famiglia di universi che lo contiene | Hutter (localizzare l'osservatore); cosmologia «dall'alto» di Hawking–Hertog [R] | in parte. **La direzione nuova è dal piccolo al grande**: si parte da una bolla qualsiasi, non da un osservatore |
| 5, 11, 12. Si sceglie in proporzione al peso secondo le leggi | Everett e la regola di Born; autocampionamento | sì nell'idea. Nuovo in pratica: il peso esatto del campo cosmico (e^{−χ²/2}) e la «causa comune» bayesiana |
| 13. Ciò che è uguale è lo stesso; la biblioteca è una rete che si richiude | Tegmark: isomorfo = identico [V]; Wolfram: si ramifica e si riunisce [Va]; Gell-Mann e Hartle [R] | sì |
| 2. Le regole sono chiuse e complete | Chalmers: l'implementazione richiede controfattuali per ogni transizione [Va] | **collegamento nuovo** (vedi sotto) |
| Una biblioteca a leggi fissate | Tegmark livello III (Everett) più il livello I (stesso universo, altri luoghi) | **diversa** dal livello IV di Tegmark, da Schmidhuber e dal ruliad, dove variano anche le leggi |

**Che cosa è diverso o nuovo** (le prime tre sono fatti del progetto, le ultime due *ipotesi* di questa ricerca):
- **Le leggi sono fissate.** La biblioteca di stateyour è l'insieme delle storie (eventi × luoghi × tempi) di un solo
  insieme di leggi, non di tutte le strutture. Ne vengono una misura naturale (i pesi delle leggi) e una difesa
  contro i conigli bianchi: un coniglio bianco è un evento che le leggi permettono con un peso dato, non un «guasto».
  Lo stesso argomento di Tegmark sui miracoli [V] vale qui senza bisogno del prior universale.
- **L'esperienza è un indirizzo, ed è concreto.** Il termine (l) di Hutter qui è un oggetto: il percorso dei nomi
  più il tempo più i rami, con il caso tirato da Threefry sulla chiave dell'indirizzo. Si può misurarne la lunghezza
  in bit.
- **Si condiziona su più bolle.** Fissare un pezzo di mondo e inferire il mondo compatibile (regole 5, 11, 12, con
  pesi esatti dove la teoria è lineare) non c'è in nessuna delle posizioni filosofiche. In fisica il parente più
  vicino è la ricostruzione vincolata del campo iniziale (Hoffman e Ribak), che il progetto già usa.
- **Regola 2 e Chalmers.** La risposta di Chalmers a Putnam è che un'esperienza richiede una struttura che regga le
  domande controfattuali, cioè che dica che cosa sarebbe successo per ogni ingresso, non solo per quello avvenuto.
  Le «regole chiuse» della regola 2 sono esattamente questo: per ogni caso che le leggi ammettono dicono che cosa
  accade. Un mondo fatto da un elenco (41 molecole) è più vicino al sasso di Putnam che a un'implementazione. È un
  argomento filosofico in più, oltre a quello pratico, per chiudere le regole.
- **La regola 13 tocca la misura.** Se due strade portano allo stesso stato a una grana data, i loro pesi si sommano.
  Per storie decoerenti le probabilità si sommano, mentre per storie che interferiscono si sommerebbero le ampiezze
  [R, Gell-Mann e Hartle]. La regola 13 quindi non riguarda solo l'identità: cambia anche la misura, e lo fa in modo
  calcolabile.

## 7. Le obiezioni serie, e se il progetto ha già una risposta

| Obiezione | Che cosa dice | Risposta del progetto | Stato |
|---|---|---|---|
| La misura sulle leggi | perché queste leggi e non altre | non si pone: le leggi sono fissate | risolta per costruzione, ma il progetto non dice niente sul perché proprio queste |
| La misura sugli esiti | quali storie sono tipiche | pesi delle leggi: e^{−χ²/2} per il cosmo; pesi stimati per i pianeti | **parziale**: i `rami` dei singoli eventi non hanno ancora probabilità (regola 5, «Manca») |
| La misura sugli indirizzi | che cosa vuol dire «un punto a caso» tra infiniti cosmi, galassie, punti | nessuna | **manca**. Vedi la proposta A |
| Cervelli di Boltzmann | partendo da una bolla con un osservatore, la storia più probabile potrebbe essere una fluttuazione | regola 5: «atomi capitati lì per caso… rarissimo tra i rarissimi»; il cosmo ha un'età finita | **risposta solo verbale**. Dipende da che cosa si conta: per mondo o per osservatore. Il progetto deve calcolarlo, non presumerlo (proposta D) |
| Coniglio bianco | una storia con un'infrazione è più numerosa | non esistono infrazioni, solo eventi con il loro peso; la coerenza (regola 13) porta in un altro ramo, non corregge | **sì**, purché ogni esito venga da un evento con un peso |
| La polvere (l'ordine non conta) | stati sparsi, letti in qualunque ordine, darebbero lo stesso | l'esperienza è un indirizzo dentro una struttura chiusa di relazioni, non una collezione di stati | sì in linea di principio (Chalmers), ma solo se le regole sono chiuse |
| La coscienza | perché un indirizzo letto (o non letto) è un'esperienza | regola 3: leggere non crea niente; i punti «si osservano da soli» | **nessuna**. È il problema difficile, e il progetto fa bene a non pretendere di risolverlo. Conseguenza onesta: il programma non crea esperienze, ne mostra |
| Il costo dell'estrazione | per leggere un punto esatto in un sistema caotico bisogna far girare la storia | regola 11: oltre il tempo di amplificazione le storie compatibili sono una sovrapposizione e se ne sceglie una per peso; regola 13: la grana grossa | **sì, ed è la risposta giusta**: oltre quel tempo il dettaglio non è determinato dal grande, e sceglierlo per peso dà la stessa distribuzione che darebbe il calcolo in avanti (*teorema* nel senso statistico, non punto per punto) |

## 8. Che cosa ricavarne per il programma (proposte)

**A. Una misura sugli indirizzi, per «scegliere un punto a caso».** Il fatto da cui partire è un *teorema*: non esiste
una distribuzione uniforme sugli interi. «Un cosmo a caso tra infiniti numeri» non ha senso senza una misura che
decresce. La scelta non arbitraria è quella alla Levin/Solomonoff:

  P(indirizzo) = Π sui livelli  p(figlio | madre),

con due possibili p a ogni livello.
- **Fisica**, dove l'insieme dei figli è finito e le leggi lo pesano. Una galassia si sceglie in proporzione alla
  massa stellare (o al numero di stelle), una stella alla probabilità dei suoi pianeti, un punto all'area o alla
  massa. Va dichiarato *che cosa* si conta (volume, massa, tempo, o momenti d'osservatore): è il problema della
  «classe di riferimento» di Bostrom, e per il progetto è un parametro libero (regola 2).
- **Algoritmica**, dove l'insieme è infinito e senza peso fisico (il numero del cosmo nella biblioteca):
  p(n) ∝ 2^{−L(n)}, dove L(n) è la lunghezza di un codice prefisso universale degli interi. Con il codice di Elias
  gamma L(n) = 2⌊log₂ n⌋ + 1, cioè p(n) ≈ 1/(2n²) [R]. Il codice è una scelta, come la macchina U di Standish: va
  dichiarato come libero, e la prova deve stampare quanto cambiano le conclusioni con due codici diversi.

Il «punto a caso» diventa allora deterministico: si scende l'albero con la fonte unica del caso (`eventi.js`) da
un seme dichiarato.

**B. La lunghezza dell'indirizzo come diagnosi.** −log₂ P(indirizzo) è il numero di bit che servono per nominare
quel punto: il termine (l) di Hutter. È gratis da calcolare e dice quanto è «speciale» una bolla: una bolla trovata
da `incontra` dopo 10⁶ tentativi costa ~20 bit più di un punto tipico. Va stampato accanto al peso.

**C. I pesi dei rami secondo le leggi.** Ogni evento in `rami` riceve la probabilità che le leggi gli danno, come la
regola di Born in Everett. È ciò che la regola 5 dichiara mancante. Il peso di un mondo è il prodotto dei pesi dei
suoi eventi per il peso dell'indirizzo (A). Con questo il coniglio bianco ha un numero.

**D. Contare i cervelli di Boltzmann invece di presumerli.** Quando una bolla con un contenuto complesso chiede il suo
passato (regole 5 e 11), si calcola il peso di due famiglie di storie compatibili: quella «evolutiva» (la storia
lunga) e quella «per fluttuazione» (il contenuto nato in un colpo dal livello sotto). Va stampato il rapporto, e la
prova fallisce se vince la seconda per un contenuto che sulla Terra ha una storia. Va dichiarato se si conta per
mondo o per osservatore, perché le due scelte possono invertire il risultato (Carroll).

**E. La regola 13 e i pesi.** Quando due strade portano alla stessa impronta a una grana data, il mondo è uno solo e
il suo peso è la **somma** dei pesi delle strade, per storie decoerenti, cioè sopra la scala quantistica. Sotto, alla
scala delle particelle, si sommano le ampiezze [R]. Questa è la risposta alla domanda aperta della regola 13 («che
cosa succede ai pesi»).

**F. Dichiarare dove l'estrazione è esatta e dove è un campione.** Per ogni livello va detto se il valore a
quell'indirizzo è funzione esatta delle leggi (forma chiusa, caso per indirizzo) oppure è un rappresentante
scelto per peso tra storie che il grande non determina (oltre il tempo di Lyapunov). È la distinzione tra
«contemplare la biblioteca» ed «estrarne un campione»: va scritta nelle intestazioni dei moduli (regola 2), come i
numeri ricavati, misurati e liberi.

**G. Non serve:** nessun conto «alla Lloyd» del costo del programma, nessuna prova di essere o non essere
simulati. Sono domande che il programma non può decidere, e che la regola 3 rende prive di oggetto.

## Fonti usate

- N. Bostrom, «Are you living in a computer simulation?», *Phil. Quarterly* 53 (2003). https://simulation-argument.com/simulation.pdf
- B. Weatherson, «Are you a sim?», *Phil. Quarterly* 53 (2003). https://simulation-argument.com/weatherson.pdf
- D. Chalmers, *Reality+* (2022), précis. https://consc.net/papers/realityprecis.pdf
- D. Chalmers, «Does a rock implement every finite-state automaton?», *Synthese* 108 (1996). https://consc.net/papers/rock.html
- S. Lloyd, «Computational capacity of the universe», *PRL* 88 (2002). https://arxiv.org/abs/quant-ph/0110141
- F. Vazza, «Astrophysical constraints on the simulation hypothesis for this Universe», *Front. Phys.* 13 (2025). https://arxiv.org/abs/2504.08461
- Z. Ringel, D. Kovrizhin, *Sci. Adv.* 3, e1701758 (2017). https://arxiv.org/abs/1704.03880
- S. Aaronson, «the Simulation Hypothesis has not been falsified; remains unfalsifiable» (2017). https://scottaaronson.blog/?p=3482
- S. Beane, Z. Davoudi, M. Savage, «Constraints on the Universe as a Numerical Simulation» (2012). https://arxiv.org/abs/1210.1847
- J. Schmidhuber, «A computer scientist's view of life, the universe, and everything» (1997). https://arxiv.org/abs/quant-ph/9904050
- J. Schmidhuber, «Algorithmic theories of everything» (2000). https://arxiv.org/abs/quant-ph/0011122
- R. Standish, «Why Occam's razor» (2000). https://arxiv.org/abs/physics/0001020
- M. Hutter, «A complete theory of everything (will be subjective)», *Algorithms* 3 (2010). https://arxiv.org/abs/0912.5434
- M. Tegmark, «The Mathematical Universe», *Found. Phys.* 38 (2008). https://arxiv.org/abs/0704.0646
- G. Egan, FAQ di *Permutation City*. https://www.gregegan.net/PERMUTATION/FAQ/FAQ.html
- S. Wolfram, «The concept of the ruliad» (2021). https://writings.stephenwolfram.com/2021/11/the-concept-of-the-ruliad/
- T. Campbell e altri, «On testing the simulation theory» (2017). https://arxiv.org/abs/1703.00058
- S. Carroll, «Why Boltzmann brains are bad» (2017). https://arxiv.org/abs/1702.00850
- S. Carroll, C. Sebens, «Many worlds, the Born rule, and self-locating uncertainty» (2014). https://arxiv.org/abs/1405.7907
