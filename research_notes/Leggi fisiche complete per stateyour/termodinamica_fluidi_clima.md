# Termodinamica e fluidodinamica per atmosfere, oceani, ghiacci e tempo meteorologico su pianeti qualsiasi — leggi complete e modelli ridotti per stateyour (stato al novembre 2026)

**Legenda dei marchi.** **[V]** = verificato in questa sessione aprendo la fonte (PDF, sorgente grezzo, pagina). **[V‑prec]** = già verificato nei rapporti precedenti (`reports/Simulatori e modelli per stateyour.md`, `research_notes/Simulatori e modelli per stateyour/pianeta_interno_clima_erosione.md`, `oceano_onde_ottica.md`): qui solo richiamato, non ripetuto. **[R]** = ricordato, NON riletto: l'URL dice dove controllare. **[S]** = solo estratto di ricerca o abstract. **[C]** = controllo numerico fatto qui con la formula scritta. Unità SI salvo dove detto.

**Esito della verifica degli [R] lasciati dal trampolino.**
| voce | esito | dove in queste note |
|---|---|---|
| Sverdrup, Stommel, Munk (formule esatte) | **[V]** equazioni e soluzione di bordo rilette; la forma già scritta in `oceano_onde_ottica.md` è giusta | §5 |
| Monin–Obukhov (funzioni di stabilità) | **[V]** forma e costanti lette in due sorgenti (CliMA, COARE) | §3 |
| Intensità potenziale dei cicloni | **[V]** formula completa (Bister–Emanuel 2002) letta in Gilford 2021 | §2 |
| Ghiaccio sottile: prefattore e A di Glen | **[V]** prefattore 2A/(n+2) (OGGM) e A(T) di Paterson–Budd (PISM); i valori di Cuffey–Paterson 2010 restano [R] | §6 |
| Cortial e altri 2019 | **NON verificato**: HAL risponde con la barriera anti‑bot «Anubis», il sito LIRIS chiude la connessione, EG DL dava 403. Resta tutto [R] | lacune §1 |
| Held–Hou | **[V]** formula e numeri terrestri (Vallis) | §1 |
| Kraus–Turner, PWP, Stommel a due scatole, η/E dei fulmini | restano **[R]** (riviste AMS/Wiley/ScienceDirect: 403) | §5, §10 |

Siti che hanno risposto: arXiv, raw.githubusercontent.com, NIST WebBook, FAO, readthedocs, nature.com (solo abstract), iapws.org, sito di Vallis, UBC, umich. Bloccati: journals.ametsoc.org (403), Wiley (403), ScienceDirect (403), ADS (405), HAL (anti‑bot), nature.com per Li 2018 (429).

---

## 1. Circolazione generale da leggi: equazioni, cella di Hadley, getti, instabilità baroclina, trasporto di calore, pianeti bloccati, modelli leggeri e licenze

### Takeaway
Bastano cinque lunghezze (raggio del pianeta `a`, raggio di deformazione `L_D = NH/f`, scala di Rhines `(U/β)^(1/2)`, raggio equatoriale `(c/β)^(1/2)`, larghezza di Hadley) e due tempi (radiativo `p·c_p/(4gσT³)`, avvettivo) per dire in che regime sta un'atmosfera; i numeri di Held–Hou e di Held (2000) per la cella di Hadley, il tasso di Eady e la scala di Rhines sono stati riletti e ricontrollati su Terra, Marte, Venere, Titano, Giove. Per il flusso di calore dei vortici la teoria «a cascata» di Held–Larichev è superata dal «gas di vortici» di Gallet e Ferrari (2020), che dà leggi chiuse con l'attrito al fondo dentro: è la chiusura da usare dove i vortici non si risolvono. Tutti i GCM intermedi sono GPL o non commerciali tranne ClimaAtmos (Apache‑2.0): da essi si ereditano formule e banchi di prova, non codice.

### Cited Findings

**Le lunghezze che decidono il regime**
- Raggio di deformazione extratropicale `L_D = N·H/f` (eq. 5 della rassegna): la scala a cui gravità e rotazione si bilanciano; instabilità baroclina, aggiustamento geostrofico e convezione producono strutture di quella taglia [V] — [Showman, Wordsworth, Merlis, Kaspi 2013](https://arxiv.org/abs/1306.2418).
- Scala di Rhines `L_R = (U/β)^(1/2)` (eq. 15): sotto, turbolenza 2D isotropa; sopra, onde di Rossby; lì l'energia che risale di scala diventa anisotropa e forma i getti. In molti casi il flusso si aggiusta fino ad avere `L_D ≈ L_R` (Schneider e Walker 2006) [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).
- Forma operativa per la larghezza dei getti: `L_β = π·(U/β)^(1/2)`; numero di getti `N_jet ~ (2Ωa/U)^(1/2)` (eq. 39) [V] — [Showman, Cho, Menou 2009](https://arxiv.org/abs/0911.3170). Controllo [C] con `β = 2Ω·cos45°/a`: Terra (U = 15 m/s) `L_β` = 3000 km, N ≈ 8; Marte (20 m/s) 2600 km, N ≈ 5; Giove (40 m/s) 10 500 km, N ≈ 25; Saturno (100 m/s) 15 700 km, N ≈ 14; Titano (20 m/s) 8900 km > πa = 8100 km, N ≈ 1; Venere `L_β` = 84 000 km ≫ πa: nessuna banda, un solo regime globale.
- Raggio di deformazione equatoriale `L_eq = (c/β)^(1/2)`, c velocità delle onde di gravità: entro `L_eq` dall'equatore vale il regime a gradiente di temperatura debole (WTG); se `L_eq ≳ a` (pianeti lenti o piccoli) vale su tutto il globo; il WTG cede quando le onde sono smorzate in tempi ≲ 10⁵ s [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).
- Tempo radiativo `τ_rad ~ (Δp/g)·c_p/(4σT³)` contro tempo avvettivo `τ_adv ~ a/U`: se `τ_rad ≪ τ_adv` forti contrasti giorno–notte, se `≫` temperatura omogenea [V, forma] — [Showman, Cho, Menou 2009](https://arxiv.org/abs/0911.3170). Controllo [C] (colonna intera, T di emissione): Terra 32 giorni, Marte 0,7 giorni, Venere ≈ 3900 giorni, Titano ≈ 10 500 giorni: per questo Marte ha un ciclo diurno enorme e Venere/Titano nessuno.

**Cella di Hadley**
- Held e Hou (1980), forma letta in Vallis: numero di Rossby termico `R = g·H·Δθ/(θ₀·Ω²·a²)`; estensione `Y_H = a·(5R/3)^(1/2)`; temperatura all'equatore `θ(0) = θ_E0 − (5R/18)·Δθ` (eq. 9.21–9.22); vento a momento angolare conservato `U_M = Ω·y²/a` (piccoli angoli), vento d'equilibrio radiativo `U_E = Ω·a·R`. Con θ_E0 = 303 K, Δθ = 50 K, θ₀ = 300 K, H = 10 km: R = 0,076, Y_H/a = 0,356, **ϑ_H = 20,4°** [V; ricalcolato qui: 20,4° C] — [Vallis, estratto libero di «Essentials of AOFD»](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf).
- Profilo dentro la cella: `θ = θ_equatore − Ω²·θ₀·y⁴/(2·g·a²·H)` (eq. 22): quasi piatto e poi crollo al bordo [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418). Vento esatto sulla sfera `u_M = Ω·a·sin²φ/cosφ` [V] — [Kaspi e Showman 2015](https://arxiv.org/abs/1407.6349).
- Analogo ad acque basse (1,5 strati): `Y = (5·h₀·α·g′/β²)^(1/3)` (eq. 9.45) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf).
- Bordo fissato dall'instabilità baroclina (Held 2000): `φ_H ≈ (g·H·Δθ_v/(Ω²·a²·θ₀))^(1/4) = (N·H/(Ω·a))^(1/2)`; Schneider (1977): `φ_S ≈ (5/4)^(1/4)·(N·H/(Ω·a))^(1/2)`; le due differiscono del 6% [V] — [Rees e Garrett 2019](https://arxiv.org/abs/1903.00393).
- Tabella di riscontro (a km, N 10⁻² s⁻¹, Ω 10⁻⁵ s⁻¹, H_scala km, H_trop km, φ osservata): Venere 6050, 1,05, 2,31 (atmosfera), 15,9, 65,0, 60°; Terra 6370, 1,12, 7,27, 8,5, 17,0, 30°; Marte 3396, 0,78, 7,10, 11,1, 45,0, 40°; Giove 71 400, 1,51, 17,8, 27,0, 124,3, 18°; Saturno 60 270, 0,67, 16,5, 59,5, 274,0, 25°; Titano 2575, 0,25, 0,45, 40,0, 50,0, 170° (una cella da polo a polo); Urano 25 560, 1,02, 9,70, 27,7, 127,6, 30°. Per i pianeti terrestri l'accordo è buono usando l'**altezza di scala** e non la tropopausa; per i giganti serve uno spessore maggiore [V] — [Rees e Garrett 2019](https://arxiv.org/abs/1903.00393). Controllo [C] con `(N·H/(Ωa))^(1/2)`: Venere 62,6°, Marte 34,3°, Titano 168° (H di scala); Terra 36,7° (con H_trop = 17 km).
- Due regimi secondo `Ro_H = −ζ/f` nel ramo alto: `Ro_H → 1` cella termica a momento angolare conservato (Held–Hou); `Ro_H → 0` cella guidata dai vortici, `v ≈ S/f` con S la divergenza del flusso di quantità di moto dei vortici. Sulla Terra Ro_H ≲ 0,3–0,4 all'equinozio e nella cella estiva, ≳ 0,7 in quella invernale. «Theories currently exist for the Ro_H → 1 and Ro_H → 0 limits, although not yet for the more complex intermediate case» [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).
- Nei GCM idealizzati la larghezza scala circa come Ω⁻¹ e l'intensità del getto subtropicale come la forza della cella alla 2/5 [V] — [Kaspi e Showman 2015](https://arxiv.org/abs/1407.6349).

**Instabilità baroclina e flusso dei vortici**
- Tasso di crescita di Eady `σ_E = 0,31·Λ·H/L_d = 0,31·U/L_d` (Λ = taglio verticale) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf); in latitudine `σ ∝ (Ω·sinθ/N)·∂u/∂z` (eq. 20), con `N² = (g/Θ)·∂Θ/∂z` [V] — [Kaspi e Showman 2015](https://arxiv.org/abs/1407.6349). Sulla Terra: lunghezze ~4000 km, tempi 3–5 giorni [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).
- Modello a due strati (Phillips): instabile se `U > β·λ²` (λ raggio di deformazione); criticità `ξ = U/(β·λ²)`; Charney: profondità dell'onda `h = f²·Λ/(β·N²)` [R] — [Held e Larichev 1996](https://doi.org/10.1175/1520-0469(1996)053<0946:ASTFHH>2.0.CO;2).
- Held e Larichev (1996): velocità barotropica `V ~ ξ·U`, lunghezza di mescolamento = scala di Rhines `~ ξ·λ`, diffusività `D ~ U³/(β²·λ³) = U·λ·ξ²` [R] — [Held e Larichev 1996](https://doi.org/10.1175/1520-0469(1996)053<0946:ASTFHH>2.0.CO;2). Barry, Craig e Thuburn (2002), macchina termica: `D ∝ (e·a·q_net/θ₀)^(3/5)·(2/β)^(4/5)` [R] — [Nature 415, 774](https://doi.org/10.1038/415774a).
- **Gas di vortici** (Gallet e Ferrari 2020), modello QG a due livelli sul piano f: con `D* = D/(U·λ)`, `ℓ* = ℓ/λ`, attrito lineare `κ* = κ·λ/U` o quadratico `μ* = μ·λ`: attrito lineare `ℓ* = 3,2·exp(0,36/κ*)`, `D* = 1,85·exp(0,72/κ*)`; attrito quadratico `ℓ* = 2,62/√μ*`, `D* = 2,0/μ*`; relazione di chiusura `D* ~ ℓ*²` nel regime diluito (ℓ ≳ 10λ). Le previsioni «agree better with the numerical data than cascade‑like predictions» [V: costanti c1 = 3,2, c2 = 0,36, c3 = 1,85, c4 = 2,62, c5 = 2,0] — [Gallet e Ferrari 2020](https://arxiv.org/abs/2010.10983).
- Scala di `D` tra pianeti per i modelli a fasce: `D ∝ p·c_p·m⁻²·Ω^(−4/5)·R^(−6/5)` [V‑prec] — [Vladilo e altri 2015](https://wwwuser.oats.inaf.it/exobio/climates/vladilo15modelingsurfacetemp.pdf).

**Tendenze dai GCM su pianeti qualsiasi**
- Kaspi e Showman (2015), GCM umido idealizzato (acquapianeta, radiazione grigia, niente stagioni né ghiaccio), sei serie: (1) rotazione più veloce ⇒ celle di Hadley più piccole e deboli, vortici più piccoli, maggiore differenza equatore–polo, getti più deboli e più numerosi; rotatori lenti ⇒ superrotazione equatoriale (Venere, Titano); (2) flusso stellare: risposta **non monotona** per via del vapore (più caldo ⇒ più trasporto latente ⇒ gradiente minore; molto freddo e secco ⇒ gradiente di nuovo minore per i tempi radiativi lunghi); (3) più massa atmosferica ⇒ più flusso orizzontale, meno gradiente, superficie più calda, celle più forti; (4) più gravità (densità media maggiore) ⇒ celle di Hadley e Ferrel più forti ma trasporto totale verso i poli più debole: il gradiente equatore–polo circa triplica dal pianeta «di ghiaccio» a quello «di ferro» [V] — [Kaspi e Showman 2015](https://arxiv.org/abs/1407.6349).
- Komacek e Abbot (2019), ExoCAM con nuvole e ghiaccio marino: confermano le scale di larghezza di Hadley e gradiente; la temperatura media cresce con flusso stellare, raggio e **dimensione delle gocce di nube**, cala con pressione al suolo e gravità; il contrasto equatore–polo cresce con raggio e gravità, cala con pressione e periodo di rotazione; i valori assoluti differiscono molto da Kaspi–Showman perché c'è il ghiaccio marino; «the effective cloud particle size is a key unknown» [V] — [Komacek e Abbot 2019](https://arxiv.org/abs/1901.00567).

**Pianeti in rotazione sincrona**
- Tre regimi (Haqq‑Misra e altri 2018) definiti da `L_eq` e dalla lunghezza di Rhines rispetto al raggio: **rotatori lenti** (entrambe > a; periodo > 20 giorni; stelle 3300–4500 K): circolazione media dal giorno alla notte; **rotatori di Rhines** (Rhines > a, deformazione < a; 5–20 giorni; 3000–3300 K): circolazione termica diretta più getti di media latitudine; **rotatori rapidi** (deformazione < a; < 5 giorni; < 3000 K): circolazione che copre solo parte dell'emisfero e nubi a bande sotto il punto substellare. Il contrasto giorno–notte al suolo cala al crescere del flusso stellare (l'opposto dei giganti) [V] — [Haqq‑Misra e altri 2018](https://arxiv.org/abs/1710.00435).
- Wordsworth (2015): su pianeti rocciosi bloccati è lo **strato limite**, non la circolazione a grande scala, a controllare il bilancio; atmosfera grigia sottile: temperatura del lato notte `T_n ≈ [(1−A)·F·κ·p_s/(4·σ·g)]^(1/4)` (eq. 27), che dà 70,4, 125,2 e 222,7 K per 0,01, 0,1 e 1 bar nei casi ideali. Pressione critica di collasso del CO₂ (eq. 43): `log₁₀(p_crit/1 Pa) = c1·F³ + c2·F² + c3·F + c4`, F in W/m²: per 1 M⊕ c = (−0,84·10⁻¹⁰, 0,73·10⁻⁶, −0,0022, 6,01), per 10 M⊕ (−0,81·10⁻¹⁰, 0,63·10⁻⁶, −0,0017, 6,34) [V] — [Wordsworth 2015](https://arxiv.org/abs/1412.5575). Controllo [C]: F = 1366 W/m² ⇒ 0,142 bar, come dice l'abstract (0,14 bar).
- Koll e Abbot (2016), pianeti bloccati secchi: la circolazione è una macchina termica globale (vincola i venti); forti gradienti giorno–notte compaiono a un rapporto tempo d'onda/tempo radiativo fino a cento volte minore di quello dei gioviani caldi; la rotazione conta solo per atmosfere calde o sottili [V, abstract] — [Koll e Abbot 2016](https://arxiv.org/abs/1605.01066).
- Su pianeti bloccati la superrotazione equatoriale nasce dalle onde planetarie stazionarie forzate dal riscaldamento giorno–notte [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).

**Modelli leggeri: che cosa riusare e con che licenza**
- Radiazione grigia a due flussi di Frierson (letta nel sorgente di Isca): profondità ottica infrarossa al suolo `τ₀(φ) = τ_eq + (τ_polo − τ_eq)·sin²φ`, default `τ_eq = 6,0`, `τ_polo = 1,5`; in quota `τ(p) = τ₀·[f_l·(p/p₀) + (1 − f_l)·(p/p₀)⁴]`, `f_l = 0,1` (il termine alla quarta imita il vapore, quello lineare i gas ben mescolati); insolazione `S = (S₀/4)·(1 + Δ_s·P₂ + Δ_sw·sinφ)`, `S₀ = 1360`, `Δ_s = 1,4`; assorbimento solare in aria spento di default; variante per giganti (Schneider e Liu 2009) con `τ_lw0 = 80`; variante con finestra infrarossa e dipendenza da CO₂ [V; la definizione `P₂ = (1 − 3·sin²φ)/4` è R] — [sorgente Isca](https://raw.githubusercontent.com/ExeClim/Isca/master/src/atmos_param/two_stream_gray_rad/two_stream_gray_rad.F90).
- Banco Held–Suarez [V‑prec] — [manuale MITgcm](https://mitgcm.org/public/r2_manual/latest/online_documents/node139.html).
- Licenze: MiMA GPLv3 (e AM2 GPLv2) [V] — [README](https://raw.githubusercontent.com/mjucker/MiMA/master/README.md); ExoPlaSim «Distributed under the General Public License» [V] — [README](https://raw.githubusercontent.com/alphaparrot/ExoPlaSim/master/README.md); PlaSim/PUMA: il README del deposito non dichiara alcuna licenza e nessun file `LICENSE`/`LICENSE.md` risponde su `master` [V, esito negativo] — [README](https://raw.githubusercontent.com/HartmutBorth/PLASIM/master/README.md); ClimaAtmos.jl Apache‑2.0 [V] — [LICENSE](https://raw.githubusercontent.com/CliMA/ClimaAtmos.jl/main/LICENSE); SHTOOLS (armoniche sferiche) BSD a 3 clausole [V] — [LICENSE](https://raw.githubusercontent.com/SHTOOLS/SHTOOLS/master/LICENSE.txt); speedy.f90 non commerciale, SpeedyWeather.jl EUPL‑1.2, Isca GPL‑3, Oceananigans/ShallowWaters.jl/climlab/pyqg/qgs MIT [V‑prec] — [rapporto precedente](https://raw.githubusercontent.com/SpeedyWeather/SpeedyWeather.jl/main/LICENSE).

### Inferences
- **Diagramma di regime prima di integrare.** Da `(a, Ω, g, p_s, c_p, T, flusso)` calcolare `Ro_T = R`, `L_D/a`, `L_β/a`, `L_eq/a`, `Ω·τ_rad`, `τ_rad/τ_adv`: decide numero di celle e getti, se serve risolvere i vortici, se il pianeta è «tutto tropici» (Venere, Titano), se ha ciclo diurno (Marte). Costa microsecondi e fa da controllo di plausibilità dell'uscita di `meteo.js` (MT7, MT8): se il modello a due strati dà N getti molto diverso da `(2Ωa/U)^(1/2)` il difetto è numerico.
- **Chiusura dei vortici per `leggi.js` (LG16) e per i pianeti dove 64×32 non risolve `L_D`.** Usare `D = D*·U·λ` di Gallet–Ferrari con `U` dal vento termico del gradiente corrente e `κ` = attrito dello strato basso (lo stesso `cdMare/cdTerra` di `meteo.js`): sostituisce `D₀ = 0,58 W m⁻² K⁻¹` tarato sulla Terra con una legge che contiene rotazione, stratificazione e attrito. Lascia fuori: β (il modello è su piano f; con β serve il limite di Rhines, `ℓ ≤ (U/β)^(1/2)`), umidità, geometria sferica.
- La larghezza di Hadley va presa come `min(Held–Hou, Held 2000)` con H = altezza di scala: è ciò che Rees e Garrett trovano funzionare da Venere a Titano.
- Per i pianeti bloccati `T_n` di Wordsworth e la sua pressione di collasso danno, senza GCM, se l'aria condensa sul lato notte: è la condizione al contorno che `chimica.atmosfera` deve chiedere prima di dichiarare un'atmosfera stabile.

### Gaps
- **Cortial e altri 2019** non riletto (vedi tabella in testa): formule e costanti restano [R].
- Le dispense di Held (2000, Woods Hole) sono state scaricate ma il PDF ha una codifica dei caratteri non estraibile; la formula di Held 2000 è verificata solo di seconda mano (Rees e Garrett).
- La rassegna di Pierrehumbert e Hammond (2019) sui pianeti bloccati non è stata trovata su arXiv (l'identificativo provato era sbagliato).
- Held–Larichev, Barry e altri, Schneider–Walker (supercriticità): riviste a 403; restano [R].
- Nessuna teoria chiusa per la larghezza di Hadley a `Ro_H` intermedio, né per il numero di getti quando `L_D` e `L_β` differiscono molto (la rassegna lo dichiara aperto).

---

## 2. Convezione umida e nuvole: Clausius–Clapeyron per ogni condensabile, adiabatica umida, CAPE, Betts–Miller, microfisica minima, copertura e albedo, cicloni tropicali, temporali, fronti, polvere

### Takeaway
La termodinamica dell'umido si scrive una volta per qualunque coppia «gas di fondo + condensabile» con cinque numeri per sostanza (punto triplo, calori latenti, c_p, massa molare): la tabella di Pierrehumbert è stata riletta e confrontata con le curve di Antoine del NIST; la forma a calore latente costante sbaglia del 20–50% al punto di ebollizione, quindi va usata vicino al punto triplo o sostituita con Antoine. Schema di convezione (Betts–Miller semplificato), microfisica di Kessler e intensità potenziale dei cicloni hanno costanti verificate su sorgenti; copertura nuvolosa e albedo restano il punto dove nessuna legge chiude.

### Cited Findings

**Clausius–Clapeyron e tabelle dei condensabili**
- Derivazione dall'uguaglianza delle energie di Gibbs delle due fasi; forma atmosferica `de_s/dT = L·e_s/(R_v·T²)` (eq. 12.27) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf).
- Forma integrata a L costante: `e_s(T) = e₀·exp[−(L/R_v)·(1/T − 1/T₀)]`, `R_v = R*/M`, con (T₀, e₀) = punto triplo e L = sublimazione sotto T₀, evaporazione sopra [V] — [phys.py di Pierrehumbert, copia in PyRADS](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py).
- Tabella (T critico K, p critico Pa, T triplo K, p triplo Pa, L_vap, L_fus, L_subl J/kg al punto triplo, c_p J/kg/K, M g/mol) [V] — [phys.py](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py):
  - H₂O: 647,1; 2,21·10⁷; 273,15; 611; 2,493·10⁶; 3,34·10⁵; 2,84·10⁶; 1847; 18
  - CH₄: 190,44; 4,596·10⁶; 90,67; 1,17·10⁴; 5,36·10⁵; 5,868·10⁴; 5,95·10⁵; 2195; 16
  - CO₂: 304,2; 7,3825·10⁶; 216,54; 5,185·10⁵; 3,97·10⁵; 1,96·10⁵; 5,93·10⁵; 820; 44
  - N₂: 126,2; 3,4·10⁶; 63,14; 1,253·10⁴; 2,18·10⁵; 2,573·10⁴; 2,437·10⁵; 1037; 28
  - O₂: 154,54; 5,043·10⁶; 54,3; 150; 2,42·10⁵; 1,39·10⁴; 2,56·10⁵; 916; 32
  - NH₃: 405,5; (nel file «1,128·10²»: è in bar, cioè 1,128·10⁷ Pa — errore di unità nel sorgente); 195,4; 6,1·10³; 1,658·10⁶; 3,314·10⁵; 1,989·10⁶; 2060; 17
  - H₂: 33,2; 1,298·10⁶; 13,95; 7,2·10³; —; 5,82·10⁴; —; 14 230; 2. He: 5,1; 2,28·10⁵; 2,17; 5,07·10³; c_p 5196; 4.
- Antoine NIST, `log₁₀(p/bar) = A − B/(T + C)`, T in K [V] — [NIST WebBook, N₂](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7727379&Mask=4&Type=ANTOINE&Plot=on), [H₂O](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4&Type=ANTOINE&Plot=on), [CO₂](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=4&Type=ANTOINE&Plot=on), [CH₄](https://webbook.nist.gov/cgi/cbook.cgi?ID=C74828&Mask=4&Type=ANTOINE&Plot=on), [NH₃](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7664417&Mask=4&Type=ANTOINE&Plot=on), [C₂H₆](https://webbook.nist.gov/cgi/cbook.cgi?ID=C74840&Mask=4&Type=ANTOINE&Plot=on):
  - N₂ 63,14–126 K: 3,7362; 264,651; −6,788
  - H₂O 273–303 K: 5,40221; 1838,675; −31,737 · 304–333 K: 5,20389; 1733,926; −39,485 · 334–363 K: 5,0768; 1659,793; −45,854 · 344–373 K: 5,08354; 1663,125; −45,622 · 379–573 K: 3,55959; 643,748; −198,043
  - CO₂ (sublimazione) 154,26–195,89 K: 6,81228; 1301,679; −3,494
  - CH₄ 90,99–189,99 K: 3,9895; 443,028; −0,49
  - NH₃ 164,0–239,6 K: 3,18757; 506,713; −80,78 · 239,6–371,5 K: 4,86886; 1113,928; −10,409
  - C₂H₆ 91,33–144,13 K: 4,50706; 791,3; −6,422 · 135,74–199,91 K: 3,93835; 659,739; −16,719
- Confronto [C] tra Clausius–Clapeyron a L costante (tabella sopra) e Antoine: H₂O 300 K 3581 contro 3534 Pa (+1%); H₂O 373,15 K 1,22·10⁵ contro 1,013·10⁵ (+20%); CH₄ 94 K (Titano) 1,75·10⁴ contro 1,79·10⁴ (−2%); CH₄ 111,7 K −2%; CO₂ 148 K (brina di Marte) 631 contro 638 Pa (−1%); CO₂ 194,7 K +1%; N₂ 77,35 K +10%; NH₃ 239,8 K **+47%** — [phys.py](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py) e [NIST](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7664417&Mask=4&Type=ANTOINE&Plot=on).
- Umidità: `ε = M_v/M_d` (0,622 per acqua in aria; 1/ε = 1,608), `e = w·p/(w + ε)`, temperatura virtuale `T_v = T·[1 + q·(1/ε − 1)] ≈ T·(1 + 0,61·q)` (eq. 12.6–12.15) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf). Per un condensabile **più pesante** del gas di fondo (acqua in H₂, CO₂ in N₂) il fattore `(1/ε − 1)` è negativo: l'aria umida è più densa.

**Adiabatica umida, energia, CAPE**
- Adiabatica umida generale (miscela gas non condensabile `a` + condensabile `c`, rapporto di mescolanza a saturazione `r = ε·e_s/p_a`): `d ln T/d ln p_a = (R_a/c_pa)·[1 + L·r/(R_a·T)] / [1 + (c_pc/c_pa + (L/(R_c·T) − 1)·L/(c_pa·T))·r]`; limite diluito terrestre `Γ_m = g·(1 + L·q_s/(R_d·T))/(c_p + L²·q_s·ε/(R_d·T²))`; limite a una sola componente (atmosfera di puro vapore, Marte per il CO₂): T(p) è la curva di saturazione [R] — [Pierrehumbert, Principles of Planetary Climate](https://geosci.uchicago.edu/~rtp1/PrinciplesPlanetaryClimate/). Il sorgente integra questa stessa adiabatica in (ln p_a, ln T) [V, struttura del codice `MoistAdiabat`] — [phys.py](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py).
- Energia statica umida `h = c_p·T + g·z + L·q`; `CAPE = ∫ g·(T_v,particella − T_v,ambiente)/T_v,ambiente dz` tra livello di convezione libera e livello di galleggiamento neutro; velocità massima di salita `w ≤ (2·CAPE)^(1/2)` [R] — [Emanuel 1994, citato in Gilford 2021](https://gmd.copernicus.org/articles/14/2351/2021/gmd-14-2351-2021.pdf).
- Con condensabile pesante in gas leggero la convezione umida è **inibita** oltre una mescolanza critica `q_crit = R·T/[(1 − M_d/M_v)·M_v·L]` (Guillot 1995; Leconte e altri 2017): vale per acqua e metano nei giganti [R] — [Leconte e altri 2017](https://arxiv.org/abs/1610.05506).
- Il vapore di colonna cresce di ~7%/K (Clausius–Clapeyron), la pioggia globale molto meno perché è vincolata dal raffreddamento radiativo dell'aria [V, citazione di Held 2000 e Allen–Ingram nella rassegna] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).

**Schemi di convezione e condensazione**
- Betts–Miller semplificato (schema «quasi‑equilibrium» di Frierson/O'Gorman–Schneider letto nel sorgente): si rilassa T verso l'adiabatica umida della particella di superficie e q verso un'umidità relativa di riferimento, con `tau_bm = 7200 s` e `rhbm = 0,8` di default; temperatura al livello di condensazione da tabella tra 173 e 335 K [V] — [sorgente Isca](https://raw.githubusercontent.com/ExeClim/Isca/master/src/atmos_param/qe_moist_convection/qe_moist_convection.F90). Frierson (2007) usava RH = 0,7 e τ = 2 h, con correzione per conservare l'entalpia e pioggia `P = −∫ δq dp/g` [R] — [Frierson 2007](https://doi.org/10.1175/JAS3935.1).
- Condensazione a grande scala con correzione di calore latente: `δq = (q_v − q_s)/(1 + (L/c_p)·dq_s/dT)`; la stessa forma è nel codice di Kessler (`prod = (qv − qvs)/(1 + p/(p − e_s)·qvs·f5/(T − svp3)²)`) [V] — [WRF, module_mp_kessler.F](https://raw.githubusercontent.com/wrf-model/WRF/master/phys/module_mp_kessler.F).

**Microfisica minima (Kessler), letta nel sorgente WRF**
- Autoconversione nube → pioggia `A = k₁·max(q_c − a, 0)`, `k₁ = 0,001 s⁻¹`, soglia `a = 0,001 kg/kg`; accrescimento `C = k₂·q_c·q_r^0,875`, `k₂ = 2,2 s⁻¹` (integrati in modo implicito: `factorn = 1/(1 + c3·dt·q_r^c4)`); velocità di caduta `v_t = 36,34·(0,001·ρ·q_r)^0,1364·(ρ₀/ρ)^(1/2)` m/s (ρ in kg/m³); evaporazione della pioggia `E = [(1,6 + 124,9·(ρ′q_r)^0,2046)·(ρ′q_r)^0,525/(2,55·10⁸/(p·q_vs) + 5,4·10⁵)]·(q_vs − q_v)/(ρ′·q_vs)` con `ρ′ = 0,001·ρ` [V] — [module_mp_kessler.F](https://raw.githubusercontent.com/wrf-model/WRF/master/phys/module_mp_kessler.F).

**Copertura nuvolosa e albedo**
- Sundqvist: `C = 1 − [(1 − RH)/(1 − RH_c)]^(1/2)` [R] — [Sundqvist e altri 1989](https://doi.org/10.1175/1520-0493(1989)117<1641:CACPSW>2.0.CO;2). Nubi basse terrestri: frazione ≈ 5,7·LTS − 55,73 (%), LTS = θ₇₀₀ − θ_suolo [R] — [Klein e Hartmann 1993](https://doi.org/10.1175/1520-0442(1993)006<1587:TSCOLS>2.0.CO;2). Incudini a temperatura fissa (~220 K) perché lì si spegne il raffreddamento radiativo del vapore [R] — [Hartmann e Larson 2002](https://doi.org/10.1029/2002GL015835).
- Albedo di uno strato che diffonde senza assorbire (due flussi): `α_c = (1 − g)·τ/(2 + (1 − g)·τ)`, `τ = 3·LWP/(2·ρ_l·r_e)` (g ≈ 0,85 per gocce d'acqua nel visibile) [R] — [Pierrehumbert, Principles of Planetary Climate](https://geosci.uchicago.edu/~rtp1/PrinciplesPlanetaryClimate/).
- La dimensione efficace delle particelle di nube è l'incognita chiave: particelle più grandi ⇒ climi più caldi [V] — [Komacek e Abbot 2019](https://arxiv.org/abs/1901.00567).

**Cicloni tropicali: intensità potenziale (formula completa)**
- Forma di Emanuel: `V_max² = (C_k/C_D)·[(T_s − T₀)/T₀]·(h₀* − h*)` (eq. 1): h₀* energia statica umida a saturazione sul mare, h* quella dell'aria sopra lo strato limite, T₀ temperatura di deflusso. Forma operativa di Bister ed Emanuel (2002): `V_max² = (T_s/T₀)·(C_k/C_D)·(CAPE* − CAPE_env)|_RMW` (eq. 2), con CAPE* della particella satura alla temperatura del mare e alla pressione del raggio dei venti massimi; pressione lì: `R_d·T_v·ln(p_msl/p_m) = ½·V_max² + CAPE|_RMW` (eq. 3; nota: l'eq. 4 di BE02 scrive per errore c_p al posto di R_d); pressione centrale `p_min = p_msl·exp{−[CAPE|_RMW + ½·(1 + 1/b)·V_max²]/(R_d·T_v)}` (eq. 14), b esponente del profilo `V = V_max·(r/RMW)^b` nell'occhio; si itera su p_m. Default: `C_k/C_D = 0,9`, riduzione al vento a 10 m 0,8, tetto 50 hPa. Il fattore `T_s/T₀ > 1` è il riscaldamento dissipativo (+20–30%); senza, il fattore è 1. Le tempeste osservate raramente raggiungono l'intensità potenziale [V] — [Gilford 2021, GMD 14, 2351](https://gmd.copernicus.org/articles/14/2351/2021/gmd-14-2351-2021.pdf). Codice tcpyPI: licenza MIT [V] — [LICENSE](https://raw.githubusercontent.com/dgilford/tcpyPI/master/LICENSE), [README](https://raw.githubusercontent.com/dgilford/tcpyPI/master/README.md).
- Controllo [C] dell'eq. 1: `C_k/C_D = 0,9`, T_s = 300 K, T₀ = 200 K, `h₀* − h* = 1,5·10⁴ J/kg` ⇒ 82 m/s (categoria 5): ordine giusto — [Gilford 2021](https://gmd.copernicus.org/articles/14/2351/2021/gmd-14-2351-2021.pdf).

**Temporali, fronti**
- Linee di groppo: equilibrio tra vasca fredda `c = (2·∫ −B dz)^(1/2)` e taglio del vento nei bassi strati [R] — [Rotunno, Klemp, Weisman 1988](https://doi.org/10.1175/1520-0469(1988)045<0463:ATFSLL>2.0.CO;2).
- Fronti: nel modello semigeostrofico la deformazione di un'onda baroclina fa collassare il gradiente in tempo finito; i fronti emergono da soli dalle equazioni primitive [R] — [Hoskins e Bretherton 1972](https://doi.org/10.1175/1520-0469(1972)029<0011:AFMMFA>2.0.CO;2).

**Polvere**
- Soglia fluida di saltazione (Shao e Lu 2000, eq. 2.8): `u*_ft = A_N·[(ρ_p·g·D_p + γ/D_p)/ρ_a]^(1/2)`, `A_N = 0,111`, γ = 1,65·10⁻⁴–5,0·10⁻⁴ N/m (Kok e Renno: 2,9·10⁻⁴); sforzo di soglia per sabbia sciolta sulla Terra ~0,05 N/m² [V] — [Kok, Parteli, Michaels, Bou Karam 2012](https://arxiv.org/abs/1201.4353). Controllo [C] (D = 100 µm): Terra 0,24 m/s; Marte (ρ_a = 0,02) 1,57 m/s; Venere 0,03 m/s; Titano (grani organici 200 µm, ρ_a = 5,3) 0,06 m/s.

### Inferences
- **Regola per `chimica.pressioneVapore`**: tenere Clausius–Clapeyron a L costante come legge (emerge da ΔH e ΔS della tabella) ma agganciarla al punto triplo e usarla entro ~±30% di T dal punto triplo; oltre, usare `L(T)` lineare che si annulla al punto critico (`L ∝ (1 − T/T_c)^0,38`, Watson) oppure Antoine NIST. L'errore del 47% su NH₃ sposta di parecchio la base delle nubi dei giganti.
- **MT3 (Betts–Miller)**: i due numeri (`τ = 2 h`, RH = 0,7–0,8) sono terrestri ma hanno un significato fisico: τ ≈ tempo di rovesciamento convettivo `H/w` con `w ~ (2·CAPE)^(1/2)`·frazione d'area, RH_ref = bilancio tra subsidenza che asciuga e rievaporazione. Su altri mondi τ si può stimare da `H/(F_conv/(ρ·c_p·ΔT))^…` ma resta una chiusura: dichiararla.
- **Kessler su altri condensabili**: le costanti 36,34 e 0,1364 codificano la legge di caduta di gocce d'acqua nell'aria terrestre. La versione generale è: dimensione massima della goccia dalla lunghezza capillare `(σ/(ρ_l·g))^(1/2)` (§8), velocità terminale dal bilancio peso–resistenza `v = [8·r·g·(ρ_l − ρ_a)/(3·C_d·ρ_a)]^(1/2)`. Autoconversione e accrescimento restano empirici.
- I cicloni si istanziano dove l'intensità potenziale supera una soglia e `|f|` non è nullo; l'eq. 2 vale per qualunque condensabile sostituendo CAPE con quella dell'adiabatica generale. Su Titano il disequilibrio entalpico mare–aria è piccolo: l'intensità potenziale va calcolata, non supposta.
- La soglia di Shao–Lu contiene `g`, `ρ_a`, `ρ_p`: è già una legge per qualunque pianeta (MT14). Spiega da sola perché su Marte servono venti forti (soglia 1,6 m/s di u*) e su Venere e Titano basta una brezza.

### Gaps
- **Nuvole**: nessuna delle formule di copertura (Sundqvist, Klein–Hartmann) discende da principi; i loro coefficienti sono terrestri. Vedi §10.
- Costanti di Kessler originali (1969) e di Frierson (2007): lette solo attraverso WRF e Isca; gli articoli (AMS) non sono raggiungibili.
- Fray e Schmitt (2009), polinomi di sublimazione di N₂, CO, CH₄, CO₂, NH₃ a bassa T: ScienceDirect a 403, non riletti [R] — [Fray e Schmitt 2009](https://doi.org/10.1016/j.pss.2009.09.011). L'Antoine NIST di N₂ non vale sotto 63 K (il ghiaccio di Plutone sta a 37–40 K).
- La formula dell'adiabatica generale e di `q_crit` sono [R]: il libro di Pierrehumbert non è in linea in forma leggibile.
- Genesi dei cicloni (dove e quanti), organizzazione della convezione, elettrificazione: nessuna legge chiusa.

---

## 3. Strato limite e scambi con la superficie: Monin–Obukhov, formule bulk, rugosità, evaporazione, suolo

### Takeaway
Gli scambi superficie–aria si chiudono con la similarità di Monin–Obukhov: le funzioni di stabilità e le loro costanti (Businger 1971; Dyer) sono state rilette in due codici indipendenti, e la rugosità del mare di Charnock contiene `g` e la viscosità dell'aria, quindi vale tal quale su altri pianeti. Questo sostituisce i coefficienti fissi `cdMare, cdTerra, ce` di `meteo.js` (MT1) con una legge. Il suolo «a secchio» di Manabe è stato riletto nel sorgente di Isca con i suoi due numeri (0,15 m; 0,75).

### Cited Findings
- Funzioni universali (forma di Businger, in ζ = z/L): instabile (ζ < 0) `φ_m = (1 − b_m·ζ)^(−1/4)`, `φ_h = Pr₀·(1 − b_h·ζ)^(−1/2)`; stabile (ζ ≥ 0) `φ_m = 1 + a_m·ζ`, `φ_h = Pr₀ + a_h·ζ`; correzioni integrate stabili `ψ_m = −a_m·ζ`, `ψ_h = −a_h·ζ`; instabili con `x = (1 − b_m·ζ)^(1/4)`, `y = (1 − b_h·ζ)^(1/2)` (ψ_m contiene `ln[(1 + x)²·(1 + x²)/8] − 2·atan(x) + π/2`) [V] — [SurfaceFluxes.jl, UniversalFunctions.jl](https://raw.githubusercontent.com/CliMA/SurfaceFluxes.jl/main/src/UniversalFunctions.jl). Licenza Apache‑2.0 [V] — [LICENSE](https://raw.githubusercontent.com/CliMA/SurfaceFluxes.jl/main/LICENSE).
- Costanti di Businger e altri (1971): `Pr₀ = 0,74`, `a_m = 4,7`, `b_m = 15`, `a_h = 4,7`, `b_h = 9` [V] — [ClimaParams.jl, parameters.toml](https://raw.githubusercontent.com/CliMA/ClimaParams.jl/main/src/parameters.toml). Variante Dyer con coefficiente 16 (usata nel KPP: `(1 − 16·ζ)^(−1/4)` e `(1 − 16·ζ)^(−1/2)`) [V] — [CVMix, cvmix_kpp.F90](https://raw.githubusercontent.com/CVMix/CVMix-src/master/src/shared/cvmix_kpp.F90).
- Lunghezza di Obukhov e parametro di stabilità come sono nel codice COARE: `ζ = κ·g·z·(T* + 0,61·T·q*)/(T·u*²)`, `κ = 0,4` [V] — [COARE 3.6, NOAA‑PSL](https://raw.githubusercontent.com/NOAA-PSL/COARE-algorithm/master/Python/COARE3.6/coare36vn_zrf_et.py).
- Formule bulk con stabilità: `u* = κ·U/[ln(z/z₀) − ψ_m(z/L)]`, `T* = −κ·ΔT/[ln(z/z₀T) − ψ_h(z/L)]`, `q*` analoga; coefficienti neutri a 10 m `C_dn = κ²/ln²(10/z₀)`, `C_hn = κ²/[ln(10/z₀)·ln(10/z₀T)]`, `C_en = κ²/[ln(10/z₀)·ln(10/z₀q)]`; vento efficace `(U² + w_g²)^(1/2)` con raffica convettiva `w_g = β·(B_f·z_i)^(1/3)`, `β = 1,2` (minimo 0,2 m/s) [V] — [COARE 3.6](https://raw.githubusercontent.com/NOAA-PSL/COARE-algorithm/master/Python/COARE3.6/coare36vn_zrf_et.py).
- Rugosità del mare (Charnock + parete liscia): `z₀ = α·u*²/g + 0,11·ν/u*`; `α = 0,011` come valore iniziale, poi COARE 3.5 dipendente dal vento `α = 0,0017·U₁₀N − 0,005` (saturato a U = 19 m/s); rugosità per calore e vapore `z₀q = z₀T = min(1,6·10⁻⁴, 5,8·10⁻⁵/Re*^0,72)`, `Re* = u*·z₀/ν` [V] — [COARE 3.6](https://raw.githubusercontent.com/NOAA-PSL/COARE-algorithm/master/Python/COARE3.6/coare36vn_zrf_et.py). Controllo [C]: u* = 0,3 m/s ⇒ z₀ = 1,06·10⁻⁴ m, C_d10 = 1,22·10⁻³ (il valore di Large e Pond usato nel rapporto precedente: 1,2·10⁻³).
- Rugosità della vegetazione (FAO‑56): altezza di spostamento `d = (2/3)·h`, `z_om = 0,123·h`, `z_oh = 0,1·z_om`; resistenza aerodinamica `r_a = ln[(z_m − d)/z_om]·ln[(z_h − d)/z_oh]/(κ²·u_z)`, che per l'erba di riferimento (h = 0,12 m, misure a 2 m) dà `r_a = 208/u₂` s/m; resistenza di superficie 70 s/m; albedo 0,23; `(1 + r_s/r_a) = 1 + 0,34·u₂` [V] — [FAO‑56, cap. 2](https://www.fao.org/4/x0490e/x0490e06.htm).
- Penman–Monteith: `λE = [Δ·(R_n − G) + ρ_a·c_p·(e_s − e_a)/r_a]/[Δ + γ·(1 + r_s/r_a)]`, Δ = de_s/dT, γ = c_p·p/(ε·λ); forma FAO `ET₀ = [0,408·Δ·(R_n − G) + γ·(900/(T + 273))·u₂·(e_s − e_a)]/[Δ + γ·(1 + 0,34·u₂)]` mm/giorno [la formula è un'immagine nella pagina: R; i parametri 208, 70, 0,34 sono V] — [FAO‑56, cap. 2](https://www.fao.org/4/x0490e/x0490e06.htm).
- Secchio di Manabe (1969) come è nel codice: capacità `max_bucket_depth_land = 0,15 m` («default from Manabe 1969»); evaporazione = potenziale se `W ≥ 0,75·W_max`, altrimenti `E = [W/(0,75·W_max)]·ρ·C·|U|·(q_sat(T_s) − q_a)`; secchio vuoto ⇒ E = 0; l'opzione per Titano toglie il limite di profondità [V] — [Isca, surface_flux.F90](https://raw.githubusercontent.com/ExeClim/Isca/master/src/coupler/surface_flux.F90), [idealized_moist_phys.F90](https://raw.githubusercontent.com/ExeClim/Isca/master/src/atmos_spectral/driver/solo/idealized_moist_phys.F90).
- Su pianeti rocciosi bloccati lo strato limite controlla il bilancio energetico globale [V] — [Wordsworth 2015](https://arxiv.org/abs/1412.5575).

### Inferences
- **MT1 da legge.** In `meteo.js`: (1) `z₀` del mare da Charnock con il `g` e la viscosità cinematica dell'aria di quel pianeta (ν dalla teoria cinetica, che `leggi.js` ha già per il cammino libero); (2) `z₀` di terra dal rilievo fine e dalla copertura (`0,123·h` per vegetazione, ~D/30 per sabbia di grano D: Nikuradse [R]); (3) `C_D`, `C_H`, `C_E` dalle formule bulk con ψ; (4) iterare 3–5 volte su L. Costo: decine di operazioni per cella. Con il numero di Richardson bulk `Ri_b = g·z·Δθ_v/(θ_v·U²)` si evita l'iterazione (formule di Louis [R]).
- Le costanti 4,7/15/9/0,74 sono misure su prato in Kansas (1968): sono «costanti della turbolenza di parete stratificata», non della Terra; dipendono solo dall'essere un fluido newtoniano con Pr ≈ 0,7. Vanno dichiarate come misure di laboratorio naturale, alla pari di κ = 0,4.
- `γ = c_p·p/(ε·λ)` e Δ generalizzano Penman a ogni condensabile: il rapporto di Bowen d'equilibrio `B = γ/Δ` dice se una superficie bagnata perde calore per evaporazione (Terra tropicale B ≈ 0,2) o per calore sensibile (Titano: B grande, evaporazione di metano limitata dall'energia disponibile, pochi W/m²).
- Il secchio (MT2) resta una chiusura: 0,15 m è l'acqua trattenuta nella zona delle radici terrestre. Su un mondo senza vita la capacità è porosità × spessore del regolite bagnabile, che `rocce.js`/tessere possono dare.

### Gaps
- Manabe (1969), Businger (1971), Charnock (1955), Monteith (1965): articoli originali non riletti (AMS a 403); le costanti vengono da codici che li citano.
- Regime molto stabile (ζ > 1), strati limite su ghiaccio, flussi con spruzzi oltre 30 m/s: le funzioni lineari falliscono (per questo CliMA offre anche Gryanik 2020 e Grachev 2007); non approfondito.
- Spessore dello strato limite (`h ~ 0,2–0,4·u*/f` neutro; crescita convettiva per trascinamento) e spirale di Ekman atmosferica: [R], non verificati.
- Oltre il secchio (Richards, Green–Ampt, TOPMODEL, curva di Budyko): non cercati in questa sessione.

---

## 4. Radiazione nel clima: equilibrio radiativo‑convettivo, limiti di serra umida e galoppante, coefficienti di Kopparapu, ghiaccio–albedo e isteresi

### Takeaway
I tre limiti di radiazione (corpo nero sottile, Komabayashi–Ingersoll per la stratosfera, Simpson–Nakajima per la troposfera satura) sono stati riletti con le loro equazioni grigie e i numeri: ~385, 290–310 e — con trasporto riga per riga — **282 W/m²**; in 3D la Terra entra in serra galoppante solo a ~375 W/m² di flusso medio (1,10 S₀). I coefficienti di Kopparapu 2013 sono stati riletti tutti. Il modello a fasce con retroazione ghiaccio–albedo ha i suoi default verificati (climlab). La grafia corretta è **Komabayashi**.

### Cited Findings
- Atmosfera grigia in equilibrio radiativo: `σ·T⁴(τ) = ½·F·(1 + (3/2)·τ)`; spessore ottico della stratosfera fissato dal vapore saturo alla tropopausa: `τ_trop = k_v·e_s(T_trop)·(1/g)·(M_v/M̄)`. Il limite di **Komabayashi–Ingersoll** è il massimo F per cui le due curve si intersecano: ~385 W/m² con i parametri della figura [V] — [Goldblatt e Watson 2012](https://arxiv.org/abs/1201.1593).
- Limite di **Simpson–Nakajima** (troposfera satura): `F_TOA ≈ σ·T⁴(τ = 1)` lungo la curva di saturazione (eq. 2.2); 290 W/m² (grigio, Nakajima e altri 1992), 310 W/m² (spettrale, Kasting 1988), «around 300»; è il più basso e il primo che si incontra. Un'atmosfera fredda con gas di fondo «overshoots» il limite. Cresce con g (strato fino a τ = 1 più compresso e caldo): un pianeta come Marte ha un limite più basso, una super‑Terra più alto. La Terra assorbe ~240 W/m² [V] — [Goldblatt e Watson 2012](https://arxiv.org/abs/1201.1593).
- Valore riga per riga: flusso termico massimo di un'atmosfera d'acqua satura «∼ 282 W/m²», indipendente dalla temperatura al suolo; in un GCM 3D la Terra resta stabile fino a un flusso solare medio di 375 W/m² (contro i 341 attuali): le regioni di subsidenza non sature fanno da «radiatori» [V] — [Leconte e altri 2013](https://arxiv.org/abs/1312.3337). Goldblatt e altri (2013): limite superiore all'emissione termica non legato alla temperatura al suolo, calcolo riga per riga [V, solo abstract] — [Nature Geoscience](https://www.nature.com/articles/ngeo1892).
- **Kopparapu e altri 2013**, `S_eff = S_eff☉ + a·T* + b·T*² + c·T*³ + d·T*⁴`, `T* = T_eff − 5780 K`, tabella 3 [V] — [arXiv:1301.6674](https://arxiv.org/abs/1301.6674):
  | limite | S_eff☉ | a | b | c | d |
  |---|---|---|---|---|---|
  | Venere recente | 1,7753 | 1,4316·10⁻⁴ | 2,9875·10⁻⁹ | −7,5702·10⁻¹² | −1,1635·10⁻¹⁵ |
  | serra galoppante | 1,0512 | 1,3242·10⁻⁴ | 1,5418·10⁻⁸ | −7,9895·10⁻¹² | −1,8328·10⁻¹⁵ |
  | serra umida | 1,0140 | 8,1774·10⁻⁵ | 1,7063·10⁻⁹ | −4,3241·10⁻¹² | −6,6462·10⁻¹⁶ |
  | serra massima | 0,3438 | 5,8942·10⁻⁵ | 1,6558·10⁻⁹ | −3,0045·10⁻¹² | −5,2983·10⁻¹⁶ |
  | Marte antico | 0,3179 | 5,4513·10⁻⁵ | 1,5313·10⁻⁹ | −2,7786·10⁻¹² | −4,8997·10⁻¹⁶ |
- Stesso articolo: Sole — serra umida 0,99 UA, galoppante 0,97 UA, serra massima 1,70 UA, Marte antico 1,77 UA, Venere recente 0,75 UA (Kasting 1993: 0,95, 0,84, 1,67 UA); la serra umida è definita dalla stratosfera che diventa umida: la perdita dell'oceano in un tempo pari all'età della Terra avviene a mescolanza di H₂O ~3·10⁻³; gravità: i limiti si spostano poco verso l'esterno per un pianeta come Marte e verso l'interno per una super‑Terra [V] — [Kopparapu e altri 2013](https://arxiv.org/abs/1301.6674). I coefficienti 2014 per 0,1, 1, 5 M⊕ sono [V‑prec] — [hzcalc.py](https://personal.ems.psu.edu/~jfk4/ruk15/planets/hzcalc.py).
- Bilancio a fasce con ghiaccio–albedo (default del codice): `C·∂T/∂t = (1 − α)·Q·s(x) − (A + B·T) + ∂/∂x[D·(1 − x²)·∂T/∂x]`, `A = 210 W/m²`, `B = 2 W/m²/°C`, `D = 0,555 W/m²/°C`, `T_f = −10 °C`, albedo `a₀ = 0,3`, `a₂ = 0,078`, ghiaccio `a_i = 0,62`, oceano a lastra di 10 m [V] — [climlab, ebm.py](https://raw.githubusercontent.com/climlab/climlab/main/climlab/model/ebm.py).
- Manabe e Wetherald (1967): aggiustamento convettivo a 6,5 K/km con umidità relativa fissa [R] — [J. Atmos. Sci. 24, 241](https://doi.org/10.1175/1520-0469(1967)024<0241:TEOTAW>2.0.CO;2). Le tabelle `OLR(T, pCO₂, p)` di HEXTOR sono [V‑prec] — [README HEXTOR](https://raw.githubusercontent.com/BlueMarbleSpace/hextor/master/README.md).
- Stati multipli oltre caldo/palla di neve: stato «Jormungand» con striscia d'acqua equatoriale (ghiaccio nudo scuro) [R] — [Abbot, Voigt, Koll 2011](https://doi.org/10.1029/2011JD015927); sui pianeti bloccati la biforcazione a palla di neve scompare [R] — [Checlair, Menou, Abbot 2017](https://arxiv.org/abs/1705.08904).

### Inferences
- **LG21 senza 282 fissi.** Il limite di Simpson–Nakajima per un condensabile qualunque è `σ·T_sat(p*)⁴` con `p* ≈ g/κ_eff` la pressione dove τ = 1 (κ_eff assorbimento medio di massa del vapore): dà la dipendenza da g e si estende a oceani non d'acqua (per l'NH₃ o il CH₄ il limite è molto più basso perché sono volatili: T_sat a p* è piccola). Resta fuori: lo spettro (finestre), le nubi, la sottosaturazione 3D (che vale +30% sulla Terra: 282 → 375·(1 − albedo)…).
- Il modello grigio a due flussi di §1 più l'aggiustamento convettivo sull'adiabatica generale di §2 è il «trasferimento radiativo a colonna» che manca a `meteo.js` (MT5): dà la stratificazione di Marte e Venere senza `stabilitaSecca 0,8`.
- L'isteresi palla di neve emerge da sola dal modello a fasce se l'albedo dipende da T; ciò che decide la larghezza dell'isteresi è `a_i − a₀` **pesato sullo spettro della stella** (attorno alle nane rosse il ghiaccio è scuro nel vicino infrarosso): l'albedo del ghiaccio va calcolata dall'ottica (`leggi.CLIMA.albedoGhiaccio` e `mare.js` oggi hanno due valori diversi, MR20).
- L'uscita dalla palla di neve richiede che la serra del CO₂ accumulato superi la soglia; il tempo è `ΔpCO₂/degassamento`: lega §4 a §7 e al §1 del rapporto «Come farlo emergere» (storia).

### Gaps
- Nakajima e altri (1992), Kasting (1988), Manabe–Wetherald: non riletti (AMS/ScienceDirect).
- Il testo completo di Goldblatt e altri (2013) è a pagamento: verificato solo l'abstract; il 282 è letto in Leconte e altri.
- Valori quantitativi dell'isteresi (frazione di S₀ alla biforcazione, pCO₂ di deglaciazione ~0,1–0,3 bar) sono [R] e non sono stati ricontrollati.
- Nessun limite di serra galoppante con nubi da principi primi: 1D senza nubi e 3D differiscono del 10% in S_eff.

---

## 5. Oceano: Ekman, Sverdrup, Stommel, Munk, corrente circumpolare, termoalina, strato mescolato, equazione di stato, ghiaccio marino, oceani non terrestri

### Takeaway
Le formule dei giri guidati dal vento sono state rilette (equazione di Sverdrup e problema di Stommel in Vallis; equazione e soluzione di bordo di Munk nelle dispense UBC): la forma scritta nel rapporto precedente è corretta, e qui se ne ricavano picco e controcorrente. Per l'equazione di stato esiste una via libera e leggera: i polinomi di Roquet (2015) implementati con licenza MIT in SeawaterPolynomials.jl, sette coefficienti. Il ghiaccio marino a zero strati e il KPP hanno costanti verificate. Per gli oceani sotto ghiaccio ci sono leggi Nu–Ra con rotazione; per quelli di lava e di idrocarburi solo schemi qualitativi.

### Cited Findings

**Giri guidati dal vento**
- Bilancio di vorticità integrato in verticale `β·v = rot_z(τ_T − τ_B)` (eq. 13.4, Sverdrup); con attrito al fondo lineare `r·∇²ψ + β·∂ψ/∂x = F_τ(x, y)` (eq. 13.6, problema di Stommel) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf).
- Equazione di Munk: `β·∂ψ/∂x = (1/(ρ·H))·k̂·∇×τ + A_H·∇⁴ψ`; nello strato di bordo ovest `β·ψ_x ≈ A_H·ψ_xxxx`; con `exp(λx)` le radici sono `k`, `(k/2)·(−1 ± i·√3)`; con ψ = 0 e ψ_x = 0 alla parete (aderenza) e soluzione limitata: `ψ = A + C·e^(−kx/2)·cos(√3·kx/2) + D·e^(−kx/2)·sin(√3·kx/2)`, `A = −C`, `D = C/√3`, cioè **`ψ(x) = ψ_I·{1 − e^(−kx/2)·[cos(√3·kx/2) + (1/√3)·sin(√3·kx/2)]}`** con `k = (β/A_H)^(1/3) = 1/δ_M` [V] — [dispense EOSC 579, S. Allen, UBC (CC‑BY 3.0)](https://eoas.ubc.ca/~sallen/EOSC_579/lecture_munk.pdf). Nota: le dispense scrivono «λ³ = A_H/β», ma dalla sostituzione segue `λ³ = β/A_H` (refuso; la soluzione è giusta).
- Derivati [C] dalla soluzione: velocità `v = ψ_x = ψ_I·k·(2/√3)·e^(−kx/2)·sin(√3·kx/2)`; picco a `x = 2π/(3√3)·δ_M = 1,21·δ_M`, `v_max = 0,546·ψ_I/δ_M`; inversione (controcorrente) a `x = 2π/√3·δ_M = 3,63·δ_M`. Con β = 2·10⁻¹¹ m⁻¹s⁻¹: A_H = 10³ m²/s ⇒ δ_M = 37 km; 5·10³ ⇒ 63 km — [dispense UBC](https://eoas.ubc.ca/~sallen/EOSC_579/lecture_munk.pdf).
- Ekman, regola dell'isola, Stommel–Arons, gravità ridotta, Gnanadesikan: già nel rapporto precedente [R/V‑prec] — [Vallis, AOFD](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/).

**Corrente circumpolare e rovesciamento**
- Dove nessun continente chiude un parallelo Sverdrup non vale: il vento è bilanciato dallo sforzo di forma sul fondo e il trasporto è fissato dai vortici; circolazione residua `ψ_res = −τ/(ρ·f) + K·s` (K diffusività dei vortici, s pendenza delle isopicne) [R] — [Marshall e Radko 2003](https://doi.org/10.1175/1520-0485(2003)033<2341:RSFTAC>2.0.CO;2).
- Scala avvettivo‑diffusiva del termoclino (Welander/Bryan): vento termico `U = g′·δ/(f·L)`, continuità `W = U·δ/L`, bilancio `W = κ/δ` ⇒ `δ = (κ·f·L²/g′)^(1/3)`, rovesciamento `Ψ = g′·δ²/f = (g′·κ²·L⁴/f)^(1/3)`, trasporto di calore ∝ κ^(2/3) [R] — [Vallis, AOFD](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/). Controllo [C]: κ = 10⁻⁴ m²/s, f = 10⁻⁴ s⁻¹, L = 5000 km, g′ = 0,02 m/s² ⇒ δ = 232 m, Ψ = 11 Sv (ordine dell'Atlantico: 15–20 Sv).
- Scatola di Stommel (1961): [R, V‑prec parziale] — [Stommel 1961](https://doi.org/10.1111/j.2153-3490.1961.tb00079.x).

**Strato mescolato**
- KPP (Large, McWilliams, Doney 1994) come è in CVMix: profondità dello strato limite dove il numero di Richardson bulk raggiunge `Ri_crit = 0,3` (default); diffusività `K(σ) = h·w(σ)·G(σ)` con funzione di forma cubica e termine non locale `C_s` (eq. 20 di LMD94); funzioni di similarità instabili `(1 − 16·ζ)^(−1/4)` (quantità di moto) e `(1 − 16·ζ)^(−1/2)` (scalari) raccordate a leggi con radice cubica oltre ζ_m, ζ_s [V] — [cvmix_kpp.F90](https://raw.githubusercontent.com/CVMix/CVMix-src/master/src/shared/cvmix_kpp.F90).
- Kraus–Turner/Niiler–Kraus: bilancio dell'energia turbolenta dello strato, profondità d'equilibrio `h = 2·m·u*³/(−B₀)` (lunghezza di Monin–Obukhov), m ≈ 1,25, `B₀ = g·α·Q/(ρ·c_p)`; PWP: mescolare finché `Ri_b ≥ 0,65` e `Ri_g ≥ 0,25` [R] — [Kraus e Turner 1967](https://doi.org/10.1111/j.2153-3490.1967.tb01462.x), [Price, Weller, Pinkel 1986](https://doi.org/10.1029/JC091iC07p08411).

**Equazione di stato**
- Polinomi di Roquet e altri (2015, «Defining a simplified yet realistic equation of state for seawater», tabella 3) in SeawaterPolynomials.jl, `ρ = ρ_r + ρ′`, `ρ_r = 1024,6 kg/m³`, Θ temperatura conservativa (°C), S_A salinità assoluta (g/kg), Z quota (m, negativa in profondità), `ρ′ = R₁₀₀·S + R₀₁₀·Θ + R₀₂₀·Θ² − R₀₁₁·Θ·Z + R₂₀₀·S² − R₁₀₁·S·Z + R₁₁₀·S·Θ` [V] — [SecondOrderSeawaterPolynomials.jl](https://raw.githubusercontent.com/CliMA/SeawaterPolynomials.jl/main/src/SecondOrderSeawaterPolynomials.jl):
  - lineare: R₀₁₀ = −0,1775; R₁₀₀ = 0,7718
  - con cabbeling: R₀₁₀ = −0,0844; R₁₀₀ = 0,7718; R₀₂₀ = −4,561·10⁻³
  - cabbeling + termobaricità: R₀₁₀ = −0,0651; R₁₀₀ = 0,7718; R₀₂₀ = −5,027·10⁻³; R₀₁₁ = −2,5681·10⁻⁵
  - «freezing» (migliore vicino al congelamento): R₀₁₀ = −0,0491; resto come sopra
  - secondo ordine completo: R₀₁₀ = 0,0182; R₁₀₀ = 0,8078; R₀₂₀ = −4,937·10⁻³; R₀₁₁ = −2,4677·10⁻⁵; R₂₀₀ = −1,115·10⁻⁴; R₁₀₁ = −8,241·10⁻⁶; R₁₁₀ = −2,446·10⁻³
  - «la più semplice realistica» (eq. 17): `C_b = 0,011 kg m⁻³ K⁻²`, `T_h = 2,5·10⁻⁵ kg m⁻⁴ K⁻¹`, `b₀ = 0,77 kg m⁻³ (g/kg)⁻¹`, `Θ₀ = −4,5 °C`: `ρ′ = b₀·S − (C_b/2)·(Θ − Θ₀)² − T_h·Z·Θ` (a meno di una costante).
- Licenze: SeawaterPolynomials.jl MIT [V] — [LICENSE](https://raw.githubusercontent.com/CliMA/SeawaterPolynomials.jl/main/LICENSE); polyTEOS di Roquet (polinomio a 55/75 termini) GPL‑3.0 [V] — [LICENSE](https://raw.githubusercontent.com/fabien-roquet/polyTEOS/master/LICENSE); GSW‑C di TEOS‑10: ridistribuzione solo «without modification» [V‑prec] — [LICENSE](https://raw.githubusercontent.com/TEOS-10/GSW-C/master/LICENSE).

**Ghiaccio marino**
- Termodinamica a zero strati (appendice di Semtner 1976): capacità termica del ghiaccio nulla, profilo lineare, flusso conduttivo `Q = (K/h)·(T₀ − T_fr)` con fondo al punto di congelamento; temperatura di superficie dal bilancio `(K/h)·(T₀ − T_fr) = (1 − α)·Q_SW↓ + ε·Q_LW↓ − ε·σ·T₀⁴ + Q_LH(T₀) + Q_SH(T₀)` (eq. 8.28–8.29), con `Q_LH = ρ_a·C_E·(Λ_v + Λ_f)·|U|·[q_a − q_sat(T₀)]`, `Q_SH = ρ_a·c_p·C_E·|U|·(T_10m − T₀)`, risolta con Newton in meno di 10 iterazioni [V] — [manuale MITgcm, pkg/seaice](https://mitgcm.readthedocs.io/en/latest/phys_pkgs/seaice.html).
- Crescita di Stefan (bilancio al fondo `ρ_i·L_f·dh/dt = K·ΔT/h − F_oceano`): `h(t) = (2·K·ΔT·t/(ρ_i·L_f))^(1/2)`; spessore d'equilibrio `h_eq = K·ΔT/F` [R: segue dall'equazione sopra] — [manuale MITgcm](https://mitgcm.readthedocs.io/en/latest/phys_pkgs/seaice.html). Controllo [C] con K = 2,1 W/m/K, ρ_i = 910, L_f = 3,34·10⁵ (costanti PISM, §6): ΔT = 20 K ⇒ 0,85 m in 30 giorni, 2,07 m in 180 giorni (ordine del ghiaccio artico di un anno); palla di neve: ΔT = 40 K, F = 0,09 W/m² (geotermico) ⇒ 930 m.

**Oceani non terrestri**
- Sotto ghiaccio (Soderlund 2019): flusso di calore per convezione in guscio sferico `Nu = 0,07·Ra^(1/3)` senza rotazione (Gastine e altri 2015) e `Nu = 0,15·Ra^(3/2)·(2E)²` in rotazione rapida (Gastine e altri 2016), con `Nu = q·D/(ρ·C_p·κ·ΔT)`; regimi: colonne → pennacchi → turbolenza geostrofica → strati limite non bilanciati → non rotante; rotazione forte (Encelado, forse Titano): molti getti zonali, moti allineati all'asse, calore massimo alle alte latitudini; rotazione moderata (Europa): pochi getti, celle tipo Hadley, calore massimo all'equatore; Ganimede copre più regimi [V] — [Soderlund 2019](https://arxiv.org/abs/1901.04093).
- Oceani di lava su pianeti rocciosi caldissimi: la pressione dell'aria tende all'equilibrio di vapore col magma; pozze ben mescolate per temperatura substellare ≲ 2400 K, composizione variegata e variabile sopra; le correnti nella pozza raffreddano il tetto del mantello solido; scambio aria–interno veloce se il mantello ha poco FeO [V, abstract] — [Kite, Fegley, Schaefer, Gaidos 2016](https://arxiv.org/abs/1606.06740).
- Mari di idrocarburi (Titano): ciclo del metano con evaporazione limitata dall'energia, poche piogge intense [R] — [Mitchell e Lora 2016](https://doi.org/10.1146/annurev-earth-060115-012428). Curve di vapore di CH₄ e C₂H₆: vedi §2 [V].
- Maree e onde: già nel rapporto precedente; nulla di nuovo verificato qui [V‑prec/R] — [note precedenti, fonte Blackledge e altri 2020](https://doi.org/10.1029/2019GL085746).

### Inferences
- **MR4**: la corrente di bordo sotto griglia si ricostruisce con il profilo di Munk verificato: larghezza `δ_M = (A_H/β)^(1/3)`, picco `0,546·Ψ/(h·δ_M)` a 1,21·δ_M dalla costa, controcorrente a 3,63·δ_M. `A_H` non è libero se si prende la diffusività dei vortici di §1 (`D*·U·λ` oceanico): così la larghezza dipende da rotazione, raggio e stratificazione di quel mare.
- **MR8, MR9**: profondità dello strato mescolato da `Ri_b = 0,3` (KPP) usando vento e flusso di galleggiamento di `meteo.js`; κ verticale interno dall'energia di marea e vento disponibile (Munk–Wunsch) nella scala `δ = (κ·f·L²/g′)^(1/3)`: la profondità del termoclino e la forza del rovesciamento diventano uscite.
- **Equazione di stato**: per l'acqua terrestre usare la «seconda ordine» di Roquet (7 coefficienti, MIT) al posto di EOS‑80. Per mari di altra composizione nessun polinomio vale: scrivere `ρ = ρ₀(T, p)·[1 + Σ β_i·c_i]` con `ρ₀` dell'acqua pura (tabella IAPWS, §8) e `β_i` dai volumi molari parziali degli ioni (che `mare.js` può avere dalla tabella termodinamica); lascia fuori le interazioni ione–ione ad alta salinità (Pitzer).
- **MR20**: zero strati di Semtner con K, ρ, L del ghiaccio di quella sostanza: lo stesso schema dà lo spessore della crosta su un mare di metano o dei gusci di Europa (`h_eq = K·ΔT/F` con F = calore di marea).
- Per gli oceani sotto ghiaccio le due leggi Nu–Ra danno ΔT e quindi velocità convettive `~(g·α·q·D/(ρ·C_p))^(1/3)`; il numero che sceglie il regime è il Rossby convettivo `(g·α·ΔT/D)^(1/2)/(2Ω)`.

### Gaps
- Stommel (1948), Munk (1950), Sverdrup (1947) originali non riletti; la soluzione completa di Munk raccordata all'interno (con lo strato di bordo est) è in Pedlosky/Vallis, non verificata oltre la forma di bordo.
- Kraus–Turner, PWP, costanti m e n: [R]. Stommel a due scatole e Marshall–Radko: [R].
- Roquet 2015: coefficienti letti nell'implementazione, non nell'articolo (AMS). Non verificata l'accuratezza dichiarata.
- Mari di idrocarburi: nessun dato verificato su densità, viscosità, soglia del vento per le onde; oceani di lava: niente equazioni operative lette (solo abstract).
- Dissipazione di marea e risonanza dei bacini: nessun avanzamento rispetto al rapporto precedente.

---

## 6. Ghiaccio di terra: legge di Glen con A(T), ghiaccio sottile, bilancio di massa, isostasia; calotte di CO₂, ghiacciai di azoto

### Takeaway
La legge di Glen con A(T) di Paterson–Budd, il prefattore 2A/(n+2) dell'approssimazione di ghiaccio sottile, i fattori gradi‑giorno e le costanti dell'isostasia sono stati riletti nei file di configurazione di PISM e nella documentazione di OGGM; per l'azoto solido di Plutone è stata riletta la reologia di laboratorio (n ≈ 2,1, energia di attivazione 3,5 kJ/mol). Il flusso di un ghiacciaio è una diffusione non lineare che riusa la griglia delle tessere, con `g` esplicito: lo stesso codice fa calotte d'acqua, di CO₂ e di N₂ cambiando A, n, ρ.

### Cited Findings
- Glen: `ε̇ = A·τⁿ`, n = 3 (default SIA di PISM). **Paterson–Budd**: `A(T*) = A_freddo·exp(−Q_freddo/(R·T*))` per `T* < 263,15 K`, `A_caldo·exp(−Q_caldo/(R·T*))` sopra, con `A_freddo = 3,61·10⁻¹³ Pa⁻³ s⁻¹`, `Q_freddo = 6,0·10⁴ J/mol`, `A_caldo = 1,73·10³ Pa⁻³ s⁻¹`, `Q_caldo = 13,9·10⁴ J/mol`; T* corretta per la pressione con `β = 7,9·10⁻⁸ K/Pa`; ghiaccio temperato: fattore `(1 + 181,25·ω)` con ω frazione d'acqua liquida ≤ 0,01; Glen isotermo EISMINT `A = 3,1689·10⁻²⁴ Pa⁻³ s⁻¹` (= 10⁻¹⁶ Pa⁻³ a⁻¹); legge di Hooke alternativa (`A = 4,42165·10⁻⁹`, `Q = 7,88·10⁴ J/mol`, `C = 0,16612`, `k = 1,17`, `T_r = 273,39 K`) [V] — [pism_config.cdl](https://raw.githubusercontent.com/pism/pism/main/src/pism_config.cdl). Controllo [C]: A = 4,7·10⁻²⁶ (−30 °C), 1,5·10⁻²⁵ (−20 °C), 4,4·10⁻²⁵ (−10 °C), 4,5·10⁻²⁴ (0 °C) Pa⁻³ s⁻¹.
- Costanti del ghiaccio in PISM: ρ = 910 kg/m³, c = 2009 J/kg/K, K = 2,10 W/m/K, L_f = 3,34·10⁵ J/kg [V] — [pism_config.cdl](https://raw.githubusercontent.com/pism/pism/main/src/pism_config.cdl). PISM è GPL‑3 [V] — [COPYING](https://raw.githubusercontent.com/pism/pism/main/COPYING).
- Ghiaccio sottile lungo una linea di flusso (OGGM): `∂S/∂t = w·ṁ − ∇·q`, `q = u·S`; velocità media sullo spessore `u = u_d + u_s = f_d·h·τⁿ + f_s·τⁿ/h`, **`f_d = 2A/(n + 2)`**, sforzo motore `τ = α·ρ·g·h` (α pendenza della superficie); lo scorrimento basale introduce un parametro libero `f_s`; nessun fattore di forma di Cuffey–Paterson [V] — [documentazione OGGM](https://docs.oggm.org/en/stable/ice-dynamics.html). OGGM ha licenza BSD a 3 clausole [V] — [LICENSE](https://raw.githubusercontent.com/OGGM/oggm/master/LICENSE.txt).
- Forma su mappa: flusso `q = −[2A/(n + 2)]·(ρ·g)ⁿ·H^(n+2)·|∇s|^(n−1)·∇s`, cioè diffusione con `D = [2A/(n + 2)]·(ρ·g)ⁿ·H^(n+2)·|∇s|^(n−1)`; velocità di superficie `u_s = [2A/(n + 1)]·τⁿ·H` [R: segue da f_d di OGGM integrando Glen; Cuffey e Paterson 2010, p. 310 è la fonte citata da OGGM] — [documentazione OGGM](https://docs.oggm.org/en/stable/ice-dynamics.html). Controllo [C] (A EISMINT): H = 1 km, pendenza 1% ⇒ τ = 89 kPa, velocità media 28,5 m/anno, di superficie 35,6 m/anno.
- Valori raccomandati da Cuffey e Paterson (2010): `A* = 3,5·10⁻²⁵ Pa⁻³ s⁻¹` a −10 °C, Q = 60 kJ/mol sotto e 115 kJ/mol sopra −10 °C, che danno A(0 °C) ≈ 2,4·10⁻²⁴ (il default di OGGM) [R: libro non in linea] — [manuale PISM, che lo cita](https://www.pism.io/docs/).
- Scorrimento basale pseudo‑plastico: esponente q = 0,25 (default PISM) [V] — [pism_config.cdl](https://raw.githubusercontent.com/pism/pism/main/src/pism_config.cdl).
- Bilancio di massa a gradi‑giorno (valori EISMINT‑Groenlandia): 3 mm d'acqua equivalente per grado‑giorno positivo sulla neve, 8 mm sul ghiaccio, frazione ricongelata 0,6, deviazione standard della temperatura giornaliera 5 K, soglia 273,15 K [V] — [pism_config.cdl](https://raw.githubusercontent.com/pism/pism/main/src/pism_config.cdl).
- Isostasia (Lingle–Clark): densità del mantello 3300 kg/m³, viscosità 10²¹ Pa s, rigidità flessurale della litosfera 5·10²⁴ N m [V] — [pism_config.cdl](https://raw.githubusercontent.com/pism/pism/main/src/pism_config.cdl). Equilibrio locale `w = (ρ_i/ρ_m)·H`; rilassamento di un semispazio viscoso per lunghezza d'onda λ: `τ = 4π·η/(ρ_m·g·λ)` [R] — [manuale PISM](https://www.pism.io/docs/). Controllo [C]: λ = 2000 km ⇒ 6150 anni.
- **Azoto solido (Plutone)**: `ε̇ = A(T)·σ^n(T)`, `A(T) = A₄₅·exp(T_a/45 K − T_a/T)`, `A₄₅ = 0,005 s⁻¹ MPa⁻ⁿ`, `T_a = E_a/k = 422 K` (E_a ≈ 3,5 kJ/mol), `n(T) = 2,1 + 0,0155·(T/K − 45)` (ghiaccio ricotto di Yamashita e altri 2010; valido 30–63 K); scorrimento per diffusione con `D₀ᵥ = 1,6·10⁻⁷·exp(−1030 K/T) m²/s` (E_v ≈ 8,6 kJ/mol), dominante sul Coble sopra ~25 K per grani ~1 mm; il ghiaccio di N₂ è molto più isolante dell'acqua, quindi il flusso integrato ha forma «Arrhenius–Glen» e non quella classica; la reologia delle miscele N₂–CO–CH₄ è ignota [V] — [Umurhan e altri 2017](https://arxiv.org/abs/1606.05734). Controllo [C]: A(37 K) = 6,6·10⁻⁴, A(60 K) = 5,2·10⁻² s⁻¹ MPa⁻ⁿ: l'azoto scorre in anni–millenni dove l'acqua impiega milioni di anni.
- **CO₂ (Marte)**: punto di brina del CO₂ a ~6 mbar ≈ 148 K (Antoine NIST: 148 K ⇒ 638 Pa [C]), calore di sublimazione 5,93·10⁵ J/kg [V] — [NIST](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=4&Type=ANTOINE&Plot=on), [phys.py](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py). Modello di Leighton e Murray (1966): la calotta stagionale è in equilibrio di vapore con l'aria e ne regola la pressione; tasso di condensazione `= (ε·σ·T_brina⁴ − (1 − A)·S)/L_subl` [R] — [Leighton e Murray 1966](https://doi.org/10.1126/science.153.3732.136). Collasso atmosferico del CO₂ sul lato freddo: §1 [V] — [Wordsworth 2015](https://arxiv.org/abs/1412.5575).

### Inferences
- **Un solo risolutore per tutti i ghiacci.** `∂H/∂t = ṁ + ∇·(D·∇s)` con `D` sopra è la stessa diffusione implicita che le tessere usano per i versanti; parametri per sostanza: (A₀, Q, n, ρ, K, L). Passo esplicito stabile `Δt < Δx²/(4·D_max)`; meglio semi‑implicito (come il «semi‑implicit model» di OGGM). La legge di Hergarten (rapporto precedente) dà l'erosione.
- **Profili chiusi per l'indirizzo senza integrare**: calotta perfettamente plastica `H(x) = [2·τ_y·(L − x)/(ρ·g)]^(1/2)` con τ_y ≈ 100 kPa per l'acqua: lo spessore scala con `g^(−1/2)` (una calotta marziana di pari larghezza è 1,6 volte più spessa); profilo di Vialov `H = H₀·[1 − (x/L)^((n+1)/n)]^(n/(2n+2))` per Glen. Servono come stato iniziale deterministico della tessera.
- **Bilancio di massa**: i gradi‑giorno (3 e 8 mm/K/giorno) sono terrestri; la forma generale è il bilancio energetico di superficie di §5 (stessa eq. 8.28) con fusione `= max(0, Q_netto)/(ρ·L_f)` e sublimazione dalla formula bulk di §3. Su Marte e Plutone domina la sublimazione/condensazione: lo stesso bilancio con L_subl.
- **Isostasia**: per altri pianeti η e D non sono noti; η viene dal modello dell'interno (legge di Arrhenius del mantello che `geologia.js` ha), `D = E·T_e³/(12·(1 − ν²))` dallo spessore elastico. Il tempo di risposta `4π·η/(ρ_m·g·λ)` contiene g.

### Gaps
- Cuffey e Paterson (2010) non riletto: `A*` e le energie di attivazione restano [R]; Paterson–Budd (1982) è verificato solo come costanti in PISM.
- Reologia del CO₂ solido (n elevato, ghiacciai di CO₂ al polo sud di Marte) non verificata; nessuna fonte aperta letta.
- Bilancio di massa da energia: non verificato su un codice (PISM ha anche un modello «dEBM‑simple», non letto).
- Scorrimento basale, distacco di iceberg (calving), linea di galleggiamento: leggi empiriche con parametri liberi (PISM ne elenca quattro per il calving); nessuna deriva da principi.
- Leighton–Murray e i numeri della calotta stagionale marziana (25–30% dell'atmosfera) sono [R].

---

## 7. Ciclo del carbonio e dell'acqua nel tempo: silicati–carbonati, degassamento, acqua nel mantello, fuga

### Takeaway
La legge di alterazione continentale di Krissansen‑Totton, Arney e Catling (2018) è stata riletta con tutti i suoi fattori; il loro modello a due serbatoi (oceano–atmosfera e acqua dei pori del fondo) con alcalinità è la forma più completa oggi verificata e dà sulla Terra arcaica 271–314 K e pH 6,3–7,2. Per l'acqua, il modello a due scatole oceano–mantello di Cowan e Abbot (2014) fa dipendere il livello del mare dalla gravità. Il legame con la fuga passa dalla mescolanza di vapore in stratosfera (~3·10⁻³) riletta in Kopparapu.

### Cited Findings
- Alterazione dei silicati continentali (eq. 1): `F_sil = f_bio·f_land·F_sil^mod·(pCO₂/pCO₂^mod)^α·exp(ΔT_s/T_e)`, con `f_bio` aumento biologico dell'alterazione, `f_land` frazione di terre emerse relativa a oggi, `F_sil^mod` flusso moderno (Tmol/anno), `ΔT_s = T_s − T_s^mod`, α esponente empirico, T_e temperatura di e‑folding; espressione simile per i carbonati (appendice SI) [V] — [Krissansen‑Totton, Arney, Catling 2018](https://arxiv.org/abs/1804.00763).
- Struttura del modello: due scatole (atmosfera–oceano di massa M_O; pori del fondo marino di massa M_P) con carbonio e alcalinità in ciascuna; flussi: degassamento F_out, alterazione di silicati e carbonati, mescolamento oceano–pori J, dissoluzione del basalto F_diss, precipitazione di carbonati in oceano e nei pori; la dissoluzione del basalto dipende da velocità di espansione, pH e temperatura dei pori (cinetica misurata, non una potenza arbitraria di pCO₂); la terra emersa nell'Archeano è presa tra 10% e 75% di oggi [V] — [Krissansen‑Totton e altri 2018](https://arxiv.org/abs/1804.00763).
- Risultati: clima arcaico temperato (0–50 °C; intervallo 271–314 K), pH dell'oceano da 6,3–7,2 a 4,0 Ga fino a quello attuale; l'alterazione continentale domina per gran parte della storia, quella del fondo marino regge da sola (clima +10–15 K) se le terre sono assenti [V] — [Krissansen‑Totton e altri 2018](https://arxiv.org/abs/1804.00763).
- WHAK (`T_e` = 13,7 K, esponente 0,3), T_e ≈ 30–40 K di Krissansen‑Totton e Catling 2017, limite di rifornimento di Foley 2015, fuga limitata dall'energia: [V‑prec] — [Krissansen‑Totton e Catling 2017](https://faculty.washington.edu/dcatling/Krissansen-Totton2017_Geologic_C_cycle_since_100Ma.pdf), [Foley 2015](https://arxiv.org/abs/1509.00427).
- Acqua oceano–mantello (Cowan e Abbot 2014): modello a due scatole; il degassamento alle dorsali dipende negativamente e la serpentinizzazione positivamente dalla pressione sul fondo, che è proporzionale a g: le super‑Terre con ciclo profondo dell'acqua ne tengono di più nel mantello; un pianeta con tettonica attiva di qualunque massa mantiene continenti emersi se la frazione di massa d'acqua è < ~0,2%; i mondi d'acqua non hanno termostato dei silicati; l'incertezza maggiore è l'inventario d'acqua del mantello terrestre [V, abstract] — [Cowan e Abbot 2014](https://arxiv.org/abs/1401.0720).
- Soglia della serra umida: mescolanza di H₂O in stratosfera ~3·10⁻³ ⇒ perdita dell'oceano in un tempo pari all'età della Terra [V] — [Kopparapu e altri 2013](https://arxiv.org/abs/1301.6674). Flusso limitato dalla diffusione `Φ ≈ 2,5·10¹³·f_T(H) cm⁻² s⁻¹` (f_T mescolanza totale di idrogeno alla omopausa) [R] — [Hunten 1973](https://doi.org/10.1175/1520-0469(1973)030<1481:TEOLGF>2.0.CO;2). Controllo [C]: f(H₂O) = 3·10⁻³ ⇒ f_T = 6·10⁻³, Φ = 1,5·10¹¹ cm⁻² s⁻¹ ⇒ 7,7·10²⁹ H/s su 5,1·10¹⁸ cm²; l'oceano terrestre (1,4·10²¹ kg, 1,56·10²³ mol di H) dura 1,2·10¹⁷ s ≈ 3,9 miliardi di anni: coerente con la frase di Kopparapu.

### Inferences
- **CH6/MR2 (ciclo spento)**: la forma da collegare è l'eq. 1 con `f_land` dalla tettonica vera, `ΔT_s` dal clima, più il termine di fondo marino; α ∈ [0,1; 0,5] e T_e ∈ [10; 40] K sono intervalli a priori degli autori [R per gli estremi; T_e 30–40 K V‑prec]: scegliere il centro e dichiarare l'incertezza come «evento» dell'indirizzo non è lecito (non è un caso, è ignoranza): tenerli in `PARAMETRI` come misure terrestri.
- Il tempo di risposta del termostato è `M_C(oceano + aria)/F_out` ~ 10⁵–10⁶ anni: molto più corto dei passi della storia planetaria; in linea si può risolvere lo **stato stazionario** `F_sil(pCO₂, T(pCO₂)) + F_fondo = F_out` con una bisezione su pCO₂ accoppiata alla tabella di serra (§4), e integrare nel tempo solo durante le palle di neve.
- `F_out` segue il flusso di calore dell'interno (potenza m tra 1 e 2 negli intervalli degli autori [R]); `geologia.js` lo ha: è un filo.
- Il ciclo profondo dell'acqua dà un livello del mare che dipende da g e dall'età: lega `mare.js` (massa del mare oggi costante, MR3) all'interno.
- Catena completa fuga ↔ clima: T_s ⇒ adiabatica umida ⇒ mescolanza di vapore alla trappola fredda ⇒ `Φ` di Hunten ⇒ perdita d'acqua; oltre ~340 K di superficie la trappola fredda cede e il limite passa a quello energetico [V‑prec per la formula energetica].

### Gaps
- L'appendice SI di Krissansen‑Totton e altri (equazioni del fondo marino, costanti, intervalli) non è stata letta: solo il testo principale.
- Degassamento su pianeti a coperchio stagnante, redox del mantello e specie degassate (CO₂ contro CO/CH₄), ciclo del carbonio senza tettonica: non cercati.
- Cowan–Abbot: equazioni e parametri non estratti; Schaefer e Sasselov (2015) e Komacek e Abbot (2016) non letti.
- La costante di Hunten e la fisica della omopausa sono [R].

---

## 8. Strumenti generali: turbolenza, convezione di Rayleigh–Bénard, numeri adimensionali, equazioni di stato, diagrammi di fase, nucleazione, tensione superficiale, lattice Boltzmann e SPH nel browser, stabilità numerica e schemi conservativi «a richiesta»

### Takeaway
Gli strumenti trasversali hanno costanti verificate dove contano: spettro di Kolmogorov e cascata 2D (Vallis), k–ε (OpenFOAM), Peng–Robinson (libreria `thermo`, MIT), leggi Nu–Ra con e senza rotazione, punti tripli e critici. Per l'acqua, IAPWS‑IF97 copre 273–1073 K fino a 100 MPa ma la pagina non dà una licenza esplicita: la via pulita è tabulare fuori linea con CoolProp (MIT). Nel browser esistono fluidi a particelle WebGPU con licenza MIT; per il lattice Boltzmann non è stato trovato un progetto WebGPU con licenza verificata.

### Cited Findings

**Turbolenza**
- Spettro inerziale 3D `E(k) = K·ε^(2/3)·k^(−5/3)` (eq. 8.23); turbolenza 2D: cascata inversa di energia `ε^(2/3)·k^(−5/3)` e diretta di enstrofia `η^(2/3)·k^(−3)`; tracciante passivo `χ·ε^(−1/3)·k^(−5/3)` e `χ·η^(−1/3)·k^(−1)` (tabella T.1–T.4) [V] — [Vallis, estratto](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/aofd-sample.pdf). Costante K ≈ 1,5; scala di Kolmogorov `η_K = (ν³/ε)^(1/4)`; legge dei 4/3 di Richardson `K_diff ~ ε^(1/3)·ℓ^(4/3)` [R] — [Vallis, AOFD](https://empslocal.ex.ac.uk/people/staff/gv219/aofd/).
- k–ε standard: `ν_t = C_μ·k²/ε`, `C_μ = 0,09`, `C₁ = 1,44`, `C₂ = 1,92`, `σ_k = 1,0`, `σ_ε = 1,3` [V] — [OpenFOAM, kEpsilon.H](https://raw.githubusercontent.com/OpenFOAM/OpenFOAM-dev/master/src/MomentumTransportModels/momentumTransportModels/RAS/kEpsilon/kEpsilon.H). Equazioni: `Dk/Dt = ∇·((ν + ν_t/σ_k)∇k) + P − ε`, `Dε/Dt = ∇·((ν + ν_t/σ_ε)∇ε) + (ε/k)·(C₁·P − C₂·ε)` [R] — [Launder e Spalding 1974](https://doi.org/10.1016/0045-7825(74)90029-2).
- Lunghezza di mescolamento: `ν_t = ℓ²·|∂u/∂z|`, `ℓ = κ·z` vicino alla parete ⇒ profilo logaritmico; è la base di Monin–Obukhov (§3) e del KPP (§5) [V per κ = 0,4 e le funzioni φ] — [COARE 3.6](https://raw.githubusercontent.com/NOAA-PSL/COARE-algorithm/master/Python/COARE3.6/coare36vn_zrf_et.py).

**Convezione di Rayleigh–Bénard**
- `Ra = g·α·ΔT·d³/(ν·κ)`; regime classico `Nu ~ Ra^(1/3)`, regime ultimo (Kraichnan) `Nu ~ Ra^(1/2)`; limite superiore rigoroso `Nu ≤ 0,644·Ra^(1/3)·[ln Ra]^(1/3)`; esponenti efficaci osservati 0,28–0,31 (per esempio `Nu ~ Ra^0,31` tra 10⁵ e 10¹⁵ in RANS; `Nu ≈ 0,119·Ra^0,25` in alcune simulazioni); dipendenza debole da Pr (`Nu ∝ Pr^−0,03` ad alto Pr; `~Pr^(1/8)` a Pr < 1); la teoria di Grossmann–Lohse divide il piano (Ra, Pr) in regimi secondo dove si dissipano energia cinetica e termica [V] — [Ahlers, Grossmann, Lohse 2009](https://arxiv.org/abs/0811.0471).
- In guscio sferico: `Nu = 0,07·Ra^(1/3)` (senza rotazione), `Nu = 0,15·Ra^(3/2)·(2E)²` (rotazione rapida) [V] — [Soderlund 2019](https://arxiv.org/abs/1901.04093).
- Convezione nel mantello `Nu = (Ra/Ra_c)^β`, β ≈ 1/3, Ra_c ≈ 660 [V‑prec] — [Driscoll e Barnes 2015](https://arxiv.org/abs/1509.07452).

**Numeri adimensionali che decidono i regimi** (definizioni standard; quelli con fonte verificata sono marcati)
- Rossby `U/(f·L)`; Rossby termico `g·H·Δθ/(θ₀·Ω²·a²)` [V]; Rossby di Hadley `−ζ/f` [V]; Burger `(L_D/L)²`; criticità `U/(β·λ²)`; `L_D/a`, `L_β/a`, `L_eq/a` [V §1]; `τ_rad/τ_adv` [V]; Richardson `N²/(∂u/∂z)²` (0,25 gradiente; 0,3 bulk nel KPP [V]); Froude `U/(g·H)^(1/2)`; Rayleigh, Nusselt, Prandtl, Ekman `ν/(Ω·D²)` [V in Soderlund]; Rossby convettivo `(g·α·ΔT/D)^(1/2)/(2Ω)`; Reynolds; Péclet; Knudsen (già in `meteo.js`); Mach; Weber, Bond/Eötvös `ρ·g·L²/σ`, Ohnesorge per gocce; Stokes per particelle; ζ = z/L di Monin–Obukhov [V]; rugosità `Re* = u*·z₀/ν` [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418).

**Equazioni di stato**
- Peng–Robinson: `p = R·T/(V − b) − a·α(T)/(V² + 2·b·V − b²)`, `a = 0,45724·R²·T_c²/p_c`, `b = 0,07780·R·T_c/p_c`, `α = [1 + κ·(1 − (T/T_c)^(1/2))]²`, `κ = 0,37464 + 1,54226·ω − 0,26992·ω²` [V] — [thermo, eos.py](https://raw.githubusercontent.com/CalebBell/thermo/master/thermo/eos.py). Libreria `thermo`: MIT [V] — [LICENSE](https://raw.githubusercontent.com/CalebBell/thermo/master/LICENSE.txt). Van der Waals: `(p + a/V²)·(V − b) = R·T`, `a = 27·R²·T_c²/(64·p_c)`, `b = R·T_c/(8·p_c)` [R, esatto per costruzione] — [thermo, eos.py](https://raw.githubusercontent.com/CalebBell/thermo/master/thermo/eos.py).
- Acqua: IAPWS‑IF97 «valid from 273.15 K to 1073.15 K at pressures to 100 MPa», regione ad alta temperatura fino a 2273,15 K e 50 MPa; la pagina non riporta alcuna dichiarazione di permesso d'uso oltre a «Copyright © IAPWS» [V] — [IAPWS, IF97](https://iapws.org/relguide/IF97-Rev.html). IAPWS‑95 (Wagner e Pruß 2002, energia di Helmholtz) [R] — [J. Phys. Chem. Ref. Data 31, 387](https://doi.org/10.1063/1.1461829).
- Implementazioni: CoolProp MIT [V] — [LICENSE](https://raw.githubusercontent.com/CoolProp/CoolProp/master/LICENSE); `iapws` (Python) GPL‑3 [V] — [LICENSE](https://raw.githubusercontent.com/jjgomera/iapws/master/LICENSE).
- Punti critici e tripli di H₂O, CH₄, CO₂, N₂, O₂, H₂, He, NH₃: tabella in §2 [V] — [phys.py](https://raw.githubusercontent.com/ddbkoll/PyRADS/master/pyrads/phys.py).

**Nucleazione e tensione superficiale**
- Teoria classica: raggio critico (Kelvin) `r* = 2·σ·v_l/(k_B·T·ln S)`, barriera `ΔG* = 16π·σ³·v_l²/(3·(k_B·T·ln S)²)`, tasso `J = J₀·exp(−ΔG*/(k_B·T))`; eterogenea: barriera × `f(θ) = (2 + cosθ)·(1 − cosθ)²/4`; Köhler `S = exp(A/r − B/r³)` [R] — [Pierrehumbert, Principles of Planetary Climate](https://geosci.uchicago.edu/~rtp1/PrinciplesPlanetaryClimate/).
- Tensione superficiale dell'acqua (IAPWS): `σ = 0,2358·τ^1,256·(1 − 0,625·τ)` N/m, `τ = 1 − T/T_c`; Eötvös `σ·V_m^(2/3) = k·(T_c − T)`, k ≈ 2,1·10⁻⁷ J K⁻¹ mol^(−2/3) [R] — [IAPWS](https://iapws.org/).

**Fluidi nel browser**
- matsuoka‑601/webgpu‑ocean: fluido 3D in tempo reale in WebGPU, con modalità SPH, licenza MIT [V per la licenza; descrizione S] — [LICENSE](https://raw.githubusercontent.com/matsuoka-601/webgpu-ocean/main/LICENSE). Altri progetti SPH/PIC‑FLIP WebGPU dichiarati MIT (jeantimex/fluid, MehdiSaffar/webgpu‑sph) e LBM in WebGL2/WASM (Wartets/Turbulence‑sim, rafaelanderka/lattice‑boltzmann‑simulator): licenze non verificate (il file LICENSE di jeantimex/fluid su `main` dà 404); roquefort è AGPL‑3 [S] — [ricerca; esempio](https://github.com/rafaelanderka/lattice-boltzmann-simulator).
- Lattice Boltzmann D2Q9 BGK: `f_i(x + c_i·Δt, t + Δt) = f_i − (f_i − f_i^eq)/τ`, `f_i^eq = w_i·ρ·[1 + 3·c_i·u + 4,5·(c_i·u)² − 1,5·u²]`, pesi 4/9, 1/9, 1/36, viscosità `ν = (τ − ½)/3` in unità di reticolo, stabile per Mach di reticolo ≲ 0,1–0,3 e τ > 0,5; SPH debolmente comprimibile: `ρ_i = Σ m_j·W(r_ij, h)`, pressione di Tait `p = (ρ₀·c₀²/7)·[(ρ/ρ₀)⁷ − 1]` con `c₀ ≥ 10·v_max`, passo `Δt ≤ 0,4·h/c₀` [R] — [Krüger e altri, The Lattice Boltzmann Method (Springer)](https://link.springer.com/book/10.1007/978-3-319-44649-3).

**Stabilità e schemi conservativi**
- ShallowWaters.jl (schema che conserva energia ed enstrofia), Oceananigans (volumi finiti, forma a vettore invariante), Aronnax: MIT [V‑prec] — [Oceananigans](https://raw.githubusercontent.com/CliMA/Oceananigans.jl/main/LICENSE).
- Acque basse in forma a vettore invariante: `∂u/∂t + (ζ + f)·k̂×u = −∇(g·h + ½|u|²)`, `∂h/∂t + ∇·(h·u) = 0`; vorticità potenziale `q = (ζ + f)/h` conservata; discretizzazione di Sadourny (1975) su griglia C che conserva energia o enstrofia potenziale [R] — [Sadourny 1975](https://doi.org/10.1175/1520-0469(1975)032<0680:TDOFDM>2.0.CO;2). Banchi di prova: Williamson e altri (1992) [R] — [J. Comput. Phys. 102, 211](https://doi.org/10.1016/S0021-9991(05)80016-6).
- Condizioni CFL: avvezione `Δt ≤ C·Δx/|u|`; onde di gravità `Δt ≤ C·Δx/(g·H)^(1/2)`; diffusione esplicita `Δt ≤ Δx²/(2·d·D)` (d dimensioni); raffinamento con correzione dei flussi alle interfacce fine–grosso (Berger e Colella 1989) [R] — [J. Comput. Phys. 82, 64](https://doi.org/10.1016/0021-9991(89)90035-1). Schema TRiSK su griglie di Voronoi a risoluzione variabile (conserva massa, energia, vorticità potenziale) [R] — [Ringler e altri 2010](https://doi.org/10.1016/j.jcp.2009.12.007).

### Inferences
- **«A richiesta» e deterministico.** (1) Usare sempre la **forma di flusso** su volumi finiti: il flusso attraverso una faccia è calcolato una sola volta e usato con segno opposto dalle due celle, così massa/energia sono conservate per costruzione anche tra tessere; (2) alla frontiera tra tessera fine e genitore imporre il flusso del genitore (condizione al contorno = genitore, regola del progetto) e ridistribuire il residuo sulle facce fini (refluxing): la media della tessera fine riproduce la cella del genitore; (3) passo di tempo scelto dal CFL locale ma **quantizzato in potenze di 2** del passo del genitore, così l'ordine delle operazioni non dipende da chi guarda; (4) niente riduzioni parallele non ordinate su GPU per le quantità che devono essere bit‑identiche (somma in ordine fisso o in albero fisso).
- Le onde di gravità esterne (√(gH) ≈ 300 m/s sulla Terra; ~40 m/s su Titano con H di scala e g piccolo) fissano il passo del modello a due strati: passo semi‑implicito o separazione barotropico/baroclino; il rapporto `c/U` dice quanto si guadagna (10–30× sulla Terra).
- **Acqua a tutte le scale**: tabella `ρ(T, p), c_p, α, κ_T, σ` generata fuori linea con CoolProp (MIT), interpolata in JS — come `stelle_tabella.js`. Per gli altri fluidi Peng–Robinson con (T_c, p_c, ω) basta per densità di gas densi e curva di saturazione entro qualche %, ma sbaglia la densità del liquido del 5–15% [R]: per i mari di idrocarburi correggere con traslazione di volume (Péneloux) o dati NIST.
- La lunghezza capillare `(σ/(ρ·g))^(1/2)` fissa la goccia massima (Terra 2,7 mm ⇒ gocce ≤ ~6 mm) e quindi la velocità di caduta della pioggia su qualunque pianeta: lega tensione superficiale (molecole) a microfisica (§2) senza costanti terrestri.
- Chiusure di turbolenza: per la scala planetaria K‑profilo (KPP) o lunghezza di mescolamento; k–ε solo nelle tessere 3D fini; sotto, Smagorinsky `ν_t = (C_s·Δ)²·|S|`, `C_s ≈ 0,17` [R]. LBM è adatto a scatole locali (vento attorno a un rilievo, corrente in un alveo); SPH/MLS‑MPM a superfici libere (onde che frangono): entrambi sono resa locale, non clima.

### Gaps
- Nessuna licenza esplicita trovata sulla pagina IAPWS; da chiarire prima di trascrivere i coefficienti IF97 (le formule sono pubblicate come «release» liberamente scaricabili, ma il testo di permesso non è stato letto).
- Costante di Kolmogorov, Smagorinsky, costanti critiche di Ra (1708, 657,5), fattori acentrici: [R], non verificati qui.
- Nucleazione: nessuna fonte primaria letta; le soprassaturazioni critiche su Marte (CO₂) e Titano non sono verificate. La teoria classica sbaglia i tassi di ordini di grandezza anche per l'acqua.
- LBM/SPH: formule [R]; nessun progetto LBM in WebGPU con licenza verificata.
- Diagrammi di fase completi (fasi solide ad alta pressione di H₂O, clatrati, miscele N₂–CH₄–CO) non trattati.

---

## 9. Giganti gassosi: bande e getti, vortici longevi, strati di nubi, flusso interno

### Takeaway
Larghezza e numero delle bande seguono la scala di Rhines (Giove ≈ 25 getti con U = 40 m/s: ordine giusto); i getti sono profondi (~3000 km su Giove secondo la gravità misurata da Juno, 1% della massa) e si fermano dove agisce il freno magnetoidrodinamico. Gli strati di nubi vengono dal modello di condensazione d'equilibrio: basi di NH₃, NH₄SH, H₂O dove la pressione parziale incontra quella di saturazione, con l'acqua a ~5,7 bar su Giove e 12,6 bar su Saturno per abbondanza solare. Il flusso interno di Giove è stato rivisto a 7,485 W/m².

### Cited Findings
- Getti: `L_β = π·(U/β)^(1/2)`, `N_jet ~ (2Ωa/U)^(1/2)`; le simulazioni forzate a piccola scala mostrano che più il getto è veloce più è largo; il rapporto tra `L_D` e `L_β` nel fissare le larghezze resta da chiarire [V] — [Showman, Cho, Menou 2009](https://arxiv.org/abs/0911.3170). Controllo [C]: Giove 25 (osservati ~30 getti alterni), Saturno 14.
- Schneider e Liu (2009): i getti fuori dall'equatore nascono dai vortici baroclini generati dal riscaldamento solare differenziale; la superrotazione equatoriale dalle onde di Rossby equatoriali generate dal flusso convettivo interno; il flusso zonale si estende in profondità fino a dove agisce un attrito magnetoidrodinamico, lontano dall'equatore ma non vicino; con il solo riscaldamento differenziale: getti senza superrotazione; con il solo calore interno: superrotazione senza getti [V, abstract] — [Schneider e Liu 2009](https://arxiv.org/abs/0809.4302). Lo schema grigio per giganti nel codice Isca usa `τ_lw0 = 80` [V] — [sorgente Isca](https://raw.githubusercontent.com/ExeClim/Isca/master/src/atmos_param/two_stream_gray_rad/two_stream_gray_rad.F90).
- Profondità: le armoniche dispari J₃, J₅, J₇, J₉ misurate da Juno indicano getti estesi fino a circa 3000 km sotto le nubi; l'atmosfera dinamica è circa l'1% della massa di Giove [V, abstract] — [Kaspi e altri 2018, Nature 555, 223](https://www.nature.com/articles/nature25793).
- Tempi radiativi: anni su Giove contro giorni o meno sui gioviani caldi (flussi 10⁴–10⁶ W/m² contro ~10 W/m² di Giove e 1 W/m² di Nettuno) [V] — [Showman, Cho, Menou 2009](https://arxiv.org/abs/0911.3170).
- Nubi (modello di condensazione d'equilibrio, ECCM: Weidenschilling e Lewis 1973; Atreya e Romani 1985): la base è il livello di condensazione dove la pressione parziale del volatile eguaglia quella di saturazione; per composizione solare condensano solo NH₃, H₂S (come `NH₃ + H₂S → NH₄SH`) e H₂O. Sonda Galileo (sito anomalo, secco): strati a 0,5, 1,3 e 1,6 bar attribuiti a NH₃, NH₄SH, H₂O; fulmini da nubi d'acqua più profonde di 4–5 bar; con O/H solare la base dell'acqua è a **5,7 bar su Giove** e **12,6 bar su Saturno** (21 bar con 5× solare); nubi «soluzione» acqua–ammoniaca; su Nettuno ghiaccio di metano a ~1 bar, acqua a ~40 bar (solare), gocce a quasi un kilobar; le concentrazioni di nube dell'ECCM sono limiti superiori [V] — [Atreya e Wong 2005](https://public.websites.umich.edu/~atreya/Chapters/2005_JovianCloud_Multiprobes.pdf).
- Flusso interno di Giove: 7,485 ± 0,160 W/m² e albedo di Bond 0,503 ± 0,012 (prima: 5,444 W/m² e 0,343), da Cassini [S: estratto di ricerca; la pagina dell'articolo ha risposto 429] — [Li e altri 2018, Nature Communications](https://www.nature.com/articles/s41467-018-06107-2).
- Inibizione della convezione umida in atmosfere di idrogeno (condensabile pesante): §2 [R] — [Leconte e altri 2017](https://arxiv.org/abs/1610.05506).
- Larghezza di Hadley sui giganti: serve uno spessore maggiore dell'altezza di scala, forse per il calore interno [V] — [Rees e Garrett 2019](https://arxiv.org/abs/1903.00393).

### Inferences
- **LG22 (giganti)**: (1) bande: numero e larghezza da `L_β` con U dal bilancio energetico (potenza disponibile = calore interno + solare differenziale; `U ~ (F·H/ρ)^(1/3)`·efficienza, da dichiarare); (2) segno del getto equatoriale: progrado se il calore interno domina i moti equatoriali (Giove, Saturno), retrogrado altrimenti (Urano, Nettuno) — è un risultato di Schneider–Liu da usare come regola con riserva; (3) nubi: basi dall'intersezione dell'adiabatica umida generale (§2) con le curve di saturazione di NH₃, H₂O (Antoine NIST) e con l'equilibrio di NH₄SH (da ΔG in `chimica.js`): niente di terrestre; colore dai cromofori resta fuori.
- I vortici longevi vivono perché il tempo radiativo è di anni e non c'è superficie che freni: durata ~ `τ_rad` e tempo di erosione per turbolenza; taglia ~ `L_D` (1000–3000 km su Giove). Vanno istanziati come oggetti nelle fasce di taglio anticiclonico, con vita estratta da una legge dichiarata (non c'è teoria chiusa).
- Il calore interno si calcola dal raffreddamento dell'interno (contrazione di Kelvin–Helmholtz più calore latente/pioggia di elio): per `stateyour` basta una legge di raffreddamento `L(t, M)` tabulata da modelli evolutivi; il rapporto emesso/assorbito (Giove ~2 con i valori vecchi, di più con albedo 0,503) è il numero di riscontro.

### Gaps
- Kaspi e altri (2018) e Li e altri (2018): solo abstract/estratti; i valori per Saturno (~9000 km), Nettuno e Urano (flussi 0,43 e 0,04 W/m²) sono [R] non verificati.
- Le pressioni nominali «0,7 bar NH₃, 2,2 bar NH₄SH» non sono state trovate nella fonte letta (che dà i valori della sonda e dell'acqua): restano [R].
- Modelli «profondi» (colonne di Busse, Heimpel e altri) contro «superficiali»: non letti; nessuna legge per la profondità dei getti in funzione di massa e campo magnetico.
- Vita e fusione dei vortici (Grande Macchia Rossa), esagono di Saturno, tempeste giganti periodiche: nessuna formula chiusa verificata.
- Legge di raffreddamento L(t, M) dei giganti: non cercata.

---

## 10. Dove la scienza non arriva: che cosa dichiarare, quale modello ridotto conserva il meccanismo, che cosa lascia fuori

### Takeaway
In sei punti la letteratura stessa dichiara che non c'è una legge chiusa: nuvole (copertura, dimensione delle particelle), larghezza di Hadley a regime intermedio, flusso dei vortici (dipendenza dall'attrito), convezione organizzata e genesi dei cicloni, scorrimento e distacco dei ghiacci, parametri del termostato del carbonio. Per ciascuno esiste un modello ridotto che conserva il meccanismo; stateyour deve usarlo dichiarando la costante come misura, non come legge.

### Cited Findings
- **Nuvole.** «The effective cloud particle size is a key unknown in the study of the climate of terrestrial exoplanets»; con dimensione uniforme, particelle più grandi danno climi più caldi [V] — [Komacek e Abbot 2019](https://arxiv.org/abs/1901.00567). Robusto invece il meccanismo dinamico: sui pianeti bloccati lenti la convergenza sotto il punto substellare dà copertura estesa indipendentemente dallo schema convettivo [V] — [Komacek e Abbot 2019](https://arxiv.org/abs/1901.00567).
- **Hadley.** Esistono teorie per `Ro_H → 1` e `Ro_H → 0`, «not yet for the more complex intermediate case which seems to be representative of Earth and perhaps planets generally» [V] — [Showman e altri 2013](https://arxiv.org/abs/1306.2418). Nei GCM secchi idealizzati la larghezza non segue Held–Hou nei regimi simili alla Terra [S] — [Levine e Schneider, citato nei risultati di ricerca](https://arxiv.org/abs/1903.11656).
- **Vortici baroclini.** Il flusso di calore è «extremely sensitive to the drag coefficient»: esponenziale nell'inverso dell'attrito lineare, a potenza con quello quadratico; gli argomenti a cascata falliscono [V] — [Gallet e Ferrari 2020](https://arxiv.org/abs/2010.10983).
- **Serra galoppante.** 1D senza nubi: 282 W/m²; 3D: soglia più alta perché l'aria non è satura ovunque; le nubi non sono risolte [V] — [Leconte e altri 2013](https://arxiv.org/abs/1312.3337).
- **Cicloni.** L'intensità potenziale è un tetto: «observed storms rarely attain their thermodynamically constrained potential intensities»; `C_k/C_D` è «a defined constant that may be estimated from theory or observations» [V] — [Gilford 2021](https://gmd.copernicus.org/articles/14/2351/2021/gmd-14-2351-2021.pdf).
- **Oceani sotto ghiaccio.** «Significant debate exists in the community on the scaling laws» per le transizioni di regime della convezione rotante; l'autrice usa limiti superiore e inferiore [V] — [Soderlund 2019](https://arxiv.org/abs/1901.04093).
- **Convezione turbolenta.** Esponente Nu–Ra tra 0,28 e 1/3 e regime ultimo ancora discussi [V] — [Ahlers, Grossmann, Lohse 2009](https://arxiv.org/abs/0811.0471).
- **Ghiaccio.** Lo scorrimento basale introduce un parametro libero (`f_s`) «and will therefore be ignored in a first approach» [V] — [documentazione OGGM](https://docs.oggm.org/en/stable/ice-dynamics.html); reologia delle miscele N₂–CO–CH₄ ignota [V] — [Umurhan e altri 2017](https://arxiv.org/abs/1606.05734).
- **Carbonio.** Storia della crescita dei continenti, del flusso di calore e dell'aumento biologico dell'alterazione sono trattati come intervalli ampi, non come leggi [V] — [Krissansen‑Totton e altri 2018](https://arxiv.org/abs/1804.00763).
- **Giganti.** Basi delle nubi osservate in disaccordo con l'ECCM nel sito della sonda; abbondanza d'acqua in profondità ignota [V] — [Atreya e Wong 2005](https://public.websites.umich.edu/~atreya/Chapters/2005_JovianCloud_Multiprobes.pdf).

### Inferences
| fenomeno | modello ridotto che conserva il meccanismo | costanti da dichiarare come misure | che cosa lascia fuori |
|---|---|---|---|
| copertura nuvolosa | acqua condensata dalla colonna (`meteo.js`) → `τ = 3·LWP/(2·ρ·r_e)` → albedo a due flussi; frazione = frazione d'area in salita (bilancio massa convettiva / subsidenza radiativa) | `r_e` (10 µm acqua terrestre) o dai nuclei di `risalita.js`; RH critica | nubi basse di strato limite, sovrapposizione verticale, fase mista |
| pioggia convettiva | Betts–Miller semplificato | τ = 2 h, RH = 0,7–0,8 | organizzazione, ciclo diurno, vasche fredde |
| microfisica | Kessler con caduta dal bilancio peso–resistenza e goccia massima capillare | k₁ = 10⁻³ s⁻¹, soglia 10⁻³, k₂ = 2,2 | ghiaccio, grandine, aerosol |
| flusso dei vortici | gas di vortici `D = D*(κ*)·U·λ` con tetto di Rhines | c₁…c₅ (da simulazioni, non terrestri) | β, sfera, umidità |
| Hadley | `min(Held–Hou, Held 2000)` con H di scala | nessuna | stagioni, vortici a Ro_H intermedio |
| strato limite | Monin–Obukhov + Charnock | κ = 0,4; 4,7; 15; 9; 0,74; α = 0,011 | onde non in equilibrio, spruzzi, stabilità forte |
| cicloni | intensità potenziale + istanza per evento | C_k/C_D = 0,9 | genesi, traiettoria, dimensione |
| polvere | soglia di Shao–Lu + flusso ∝ u*³ | A_N = 0,111; γ | tempeste globali marziane (anno sì, anno no) |
| strato mescolato | Ri_b = 0,3 (KPP) | 0,3 | Langmuir, fronti di sottomesoscala |
| ghiaccio | SIA + Glen/Arrhenius per sostanza | A₀, Q, n di laboratorio | scorrimento, calving, correnti di ghiaccio |
| termostato del carbonio | stato stazionario di `F_sil + F_fondo = F_out` | α, T_e, F^mod | biologia, litologia, clima regionale |
| serra galoppante | limite `σ·T_sat(g/κ)⁴` + tabelle | κ_eff | nubi, sottosaturazione 3D |
- Regola pratica: ogni riga della terza colonna va in `PARAMETRI`/«LEGGI EMPIRICHE» del modulo con la fonte, come già fa la casa; nessuna va nascosta in un coefficiente «numerico».
- Dove i modelli 1D e 3D divergono (serra galoppante, pianeti bloccati) usare il 3D pubblicato come **banco di prova fuori linea** (ExoPlaSim/Isca sono GPL: si eseguono, non si copiano) su pochi casi: Terra, Marte, Venere, Titano, un bloccato lento e uno rapido.

### Gaps
- Non cercati: schemi di copertura nuvolosa basati sul flusso di massa per pianeti generici (Xu–Randall, EDMF), teoria delle nubi di strato limite (inversione, EIS) fuori dalla Terra.
- Tempeste di polvere globali di Marte, fulmini (η/E di Romps resta [R]), temporali come oggetti: nessuna legge predittiva trovata.
- Nessuna fonte verificata sulla variabilità interna (ENSO, QBO, oscillazioni dei getti) come proprietà emergente dipendente da parametri planetari.
- I file scaricati per le verifiche stanno nella cartella provvisoria della sessione (`/tmp/claude-0/-home-user/e4f7d681-8c14-51b2-bfef-3d2a580b715c/scratchpad/tfc/`) e non fanno parte del deposito.
