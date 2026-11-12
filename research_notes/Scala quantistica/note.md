# La scala quantistica: che cosa si sa di «com'è», e come la si rende visibile dalle misure

Marche: **[V]** letto ora (novembre 2026), **[R]** ricordato (da controllare se serve un numero fine). Per ognuna: che
cosa ne prende il modello (`src/camera/quanti.js`, `src/tre/quanti.js`).

## Che cosa vuol dire «vedere» sotto l'atomo
- **Stodolna et al. 2013**, *Hydrogen Atoms under Magnification: Direct Observation of the Nodal Structure of Stark
  States*, PRL 110, 213001 [V] (copia accettata dell'autore: physics.purdue.edu/~robichf/papers/prl110.213001.pdf).
  Fascio di idrogeno da fotodissociazione di H₂S; eccitazione a due fotoni (243 nm) agli stati n = 2, ionizzazione
  con un secondo laser (365–367 nm, 8 ns) in un campo di 808 V/cm; gli elettroni lenti finiscono su piastre a
  microcanali + schermo al fosforo + CCD, con una lente elettrostatica che ingrandisce l'immagine di circa 10×. Si vede
  un numero di frange scure uguale al numero quantico parabolico n₁: la struttura dei nodi della funzione d'onda.
  L'immagine è un **accumulo di elettroni singoli**, uno per atomo.
  → Il modello rende la scala così: ogni punto è un evento di misura (regola 3), tirato da |ψ|² (regola di Born),
  su un atomo preparato uguale; la nuvola emerge dall'accumulo; il colore è il verde del fosforo dello schermo
  (luce dello strumento, non dell'atomo). Riga a schermo: «Non è luce…».
- **Gross, Mohn, Moll, Liljeroth & Meyer 2009**, Science 325, 1110 (pentacene con punta a CO, AFM); **Gross et al.
  2012**, Science 337, 1326 (ordine dei legami) [R]. STM/AFM vedono la densità (o la sua derivata) vicino alla
  superficie, non un orbitale «libero». → Dichiarato nello stato sperimentale di Hartree-Fock (STATO).
- **Densità elettronica per diffrazione X** [R]: le «densità di deformazione» dei legami nei cristalli. → La densità
  di una molecola del modello viene da Hartree-Fock-Roothaan STO-3G (Hehre, Stewart & Pople 1969 [R]); riscontri:
  H₂ −1,11671 Eₕ (Szabo & Ostlund [R]: −1,1167), H₂O alla geometria di Crawford −74,9420800 Eₕ (pubblicato
  −74,942079928 [R]: torna all'ottava cifra), densità a metà del legame di H₂ 0,256 e/a₀³ (0,2728 quasi al limite HF,
  Bader [R]: −6%, la base minima).

## Indeterminazione e misura
- **Kennard 1927** Δx·Δp ≥ ħ/2 [R]; **Arthurs & Kelly 1965** (misura congiunta: ≥ ħ) [R]; misura non nitida come
  operatore di Kraus gaussiano (Busch, Lahti & Mittelstaedt) [R]. → La finestra σ dello strumento; l'impulso dopo la
  misura tirato dalla FFT dello stato ridotto. Riscontri sui campioni: gaussiano 0,510 ħ (½ ħ: l'uguaglianza), 1s 0,587 (esatto 0,577),
  coppia (x₀, p) 1,02 ħ a σ = σ₀ (teoria 1).
- **Zurek 2003**, *Decoherence, einselection, and the quantum origins of the classical*, RMP 75, 715
  (arXiv:quant-ph/0105127) [V]: l'ambiente sorveglia certi osservabili e distrugge l'interferenza tra i loro stati
  «puntatore»; la misura diventa correlazione classica. **Joos & Zeh 1985**, Z. Phys. B 59, 223 [R]; formule di
  Schlosshauer 2007 [R] (Λ per urti di molecole e per fotoni termici). → `decoerenza`: nell'acqua a 25 °C una
  sovrapposizione 1s+2p si perde in ~0,27 ps (ogni urto distingue), nel vuoto coi fotoni a 300 K mai prima
  dell'emissione (1,6 ns). La riga a schermo dice se si vede interferire o se è già un insieme di esiti.
- **Effetto Zeno**: Itano, Heinzen, Bollinger & Wineland 1990, PRA 41, 2295 [R]. → `misureInFila` con la misura
  «è ancora nello stato iniziale?» e l'evoluzione di Schrödinger tra le misure: 1, 3, 10, 30 misure in 4 u.a. →
  0,077 / 0,21 / 0,54 / 0,79 (formula 0,085 / 0,18 / 0,54 / 0,81).
- Moto degli elettroni ad attosecondi (Goulielmakis et al. 2010, Nature 466, 739) [R]; vita del 2p 1,596 ns,
  A = 6,2649·10⁸/s [R] → calcolato dal dipolo: 6,268·10⁸/s.

## Nucleo e nucleone
- Raggi di carica: **Angeli & Marinova 2013**, ADNDT 99, 69 [R] (tabella in `RAGGI_CARICA`); forme di De Vries,
  De Jager & De Vries 1987 [R]. Diffusività ~0,52 fm [R]. Riscontro: il Fermi a due parametri del piombo esce con
  c = 6,58 fm (misurato ~6,62 [R]); 1,2·A^(1/3) torna per Fe e Pb, non per i nuclei leggeri (NON TORNA, stampato).
- Protone: **raggio 0,84087 fm** dall'idrogeno muonico (Antognini et al. 2013 [R]), CODATA 2018 0,8414 fm [R]. Fattori
  di forma: **Kelly 2004**, PRC 70, 068202 [R] (parametri non riletti ora: [R]); Galster 1971
  per il neutrone [R]. Il raggio di Kelly (0,862 fm) è quello della diffusione di elettroni precedente: è il «problema
  del raggio del protone» (NON TORNA, stampato). La densità 3D dal fattore di forma vale nel riferimento di Breit
  (Miller 2007 [R]).
- Partoni: le distribuzioni partoniche (HERA) danno frazioni d'impulso, non posizioni; qui solo i tre quark di
  valenza, con le densità u e d dalla simmetria di isospin (Cates et al. 2011 per la separazione dei sapori [R]).
- **Leinweber 2000**, *Visualizations of the QCD Vacuum*, hep-lat/0004025 [V per l'abstract]: densità d'azione e di
  carica topologica su un reticolo 24³×36, isosuperfici e resa di volume, istantoni che si annichilano. → Non
  simulato (dichiarato): il vuoto tra i quark resta nero.
