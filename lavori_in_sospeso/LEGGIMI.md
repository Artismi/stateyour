# Lavori in sospeso

Modifiche a `src/camera/disco.js` provate ma non applicate, perché le prove non tornano tutte (contro il commit 84c8228).

- `acqua_ossidazione_migrazione_completo.diff`: acqua minima della roccia di dentro (Piani 2020), consegna da fuori con le probabilità d'urto di Öpik (Raymond e Izidoro 2017, O'Brien 2018), roccia consegnata ossidata (Rubie 2015), migrazione di tipo I (Tanaka et al. 2024) con trappola al bordo interno.
- `migrazione_e_consegna_vecchia_acqua.diff`: la stessa senza la nuova regola dell'acqua.

Esito misurato (rapporto dell'agente, mediane sui pianeti di prova):
- acqua totale 0,64% → 0,095% (troppo poca);
- pianeti 1–2 R⊕ a periodo 5–100 giorni da 0,01 a 1,3 a stella (Kepler 0,26);
- nessun pianeta 2–4 R⊕;
- il gradiente «più freddo, più ossidato» non torna.

Cadono in `test_disco` le prove «orbite separate» e «più acqua lontano», in `test_elementi` la salinità.

Che cosa manca per ripartire:
- la consegna d'acqua durante il gas, con i planetesimi scagliati dai giganti e trattenuti dal gas (Raymond e Izidoro 2017, §7);
- la dissociazione dell'acqua nel mantello che si equilibra col metallo (Rubie 2015);
- gli involucri di gas dei nuclei interni, per avere i pianeti da 2–4 R⊕;
- le coppie di corotazione (Paardekooper 2011);
- la risonanza di cattura scelta con una fonte.
