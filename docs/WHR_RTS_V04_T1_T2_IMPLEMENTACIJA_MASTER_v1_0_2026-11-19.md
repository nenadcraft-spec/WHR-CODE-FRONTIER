# WHR RTS — v0.4, kompletiranje T1 i T2 MASTER

Datum: 19.11.2026, Europe/Belgrade. OI: Beli Zec. Izvođač: Codex / Betmen.

## Zahtev i granice

OI je izričito izabrao **kompletan T2 sadržaj iz MASTER-a**, uz dopunu svega što nedostaje za T1. Osnova je provereni prototip 0.3. Izvorna specifikacija T1/T2 ostaje sačuvana; noviji Jungle MASTER i T3 dopuna protivvazdušnog napada imaju prednost gde izričito menjaju ranija pravila.

Ovaj update cilja lokalnu igrivu T1/T2 simulaciju. Mrežni server, online lobby 1v1/2v2, T3 tehnologija/jedinice i kompletna integracija Color Engine-a ostaju posebni poslovi. Postojeći lokalni četiri-ugla poligon ne predstavlja online multiplayer.

Status: **IMPLEMENTIRAN LOKALNI v0.4 KANDIDAT; AUTOMATIZOVANE PROVERE IZVRŠENE. OI PLAYTEST I BALANS OSTAJU OTVORENI.** Stabilni v0.3 nije zamenjen ovim dokumentom.

## Sadržaj

1. T1: ekonomija/gradnja iz 0.3; proizvodnja Čuvara, radnički napad i popravka; kula; istraživanje terena i trenutna vidljivost.
2. T2: globalni tehnološki upgrade 300 CODE/60 s, 8 radnika, kapacitet do 40 preko Releja, unapređena Centrala 2000 HP.
3. Akademija 180/45 s/900 HP; Stanica podrške 150/40 s/700 HP; Radionica 220/50 s/1000 HP; Oltar 150/35 s/800 HP.
4. Čuvar 60/18 s/180 HP/2 pop; Strelac 90/22 s/120 HP/2 pop; Bolničar 110/25 s/100 HP/2 pop; Razbijač 160/35 s/300 HP/4 pop.
5. Istraživanja: Efikasni alati 120/40 s, Ojačani Čuvari 100/30 s, Izviđačka optika 100/30 s; globalna kupovina i efekat jednom.
6. Scout/herojski inventar, neutralne prodavnice, T1/T2 čizme, prva pomoć, kurirska torba, herojske čizme, kristal i Povratni signal.
7. BASTION/PULSAR/EHO: izbor jednog heroja; Scout posećuje centralno Svetilište, 200 CODE/30 s; 4 pop i 6 mesta. Oltar vraća istog heroja za 100/45 s.
8. T1/T2 džungla: sastav, spawn, respawn, aggro/leash, doprinos, XP i prvi loot iz Jungle MASTER-a. T3 kamp ostaje budući sadržaj ovog T2 izdanja.
9. HUD akcije, napredak, inventar, interakcije i dostupne prečice; postojeće mapiranje kamere ostaje.

## Razrešenje otvorenih pravila — novi implementacioni kandidati

Ove vrednosti nisu ranije potvrđen konačan balans. OI ih proverava kroz igranje.

- T2 se naručuje u završenoj sopstvenoj Centrali sa praznim redom. Tokom upgrade-a ona ne prima obuku; druge zgrade rade. Isporuke ne staju. Jedan globalni upgrade po igraču; gubitak aktivne Centrale prekida posao bez refund-a. Naučeni T2 ne nestaje posle gubitka zgrade. Preduslovi se proveravaju pri prihvatanju. Samo konkretno unapređena Centrala dobija 2000 HP, uz očuvan procenat trenutnog HP-a.
- Proizvodni red i istraživanja: jedna traka po zgradi; jedna aktivna globalna tehnologija istog tipa. Rezervacije populacije obuhvataju sve zgrade i herojske poslove. Gubitak kapaciteta ne briše postojeće jedinice; nove narudžbine čekaju dovoljan raspoloživ kapacitet.
- T2 limit kula ostaje 2. Građevinski otisci: kula 2×2, Akademija 4×4, podrška 4×3, radionica 5×4, Oltar 3×3. Prostorna pravila i zaštićeni prolazi ostaju.
- Novi borci: Strelac brzina 3, vidokrug 10; Bolničar brzina 3, vidokrug 8, lečenje domet 4; Razbijač brzina 2, vidokrug 9, domet 5. Bez oklopa i nasumičnih kritičnih pogodaka. Strelac i kula imaju dozvolu gađanja vazduha na T2; leteće jedinice dolaze tek na T3.
- Bolničar leči sopstvenu drugu jedinicu. Ne leči sebe. Jedan lekar po meti po tick-u. Primljena šteta blokira lečenje 3 s. Lečenje je vremenski obračunato bez zaokruživanja svake male količine na nulu.
- Heroji: Bastion 600 HP, 18 štete/1,5 s, domet 1,5; Pulsar 400 HP, 20/1,5 s, domet 5; Eho 450 HP, 12/1,5 s, domet 4. Brzina 3, vidokrug 12. Bez mane u prvom kandidatu; cooldown po sposobnosti. Nivoi 1–5, pragovi ukupnog XP 0/100/250/450/700; nivo daje +50 osnovnog maksimalnog HP-a i +2 štete, bez punog automatskog izlečenja.
- Bastion: lični štit 120 na 5 s, cooldown 12 s; T2 zona ublažava 30% štete sopstvenim jedinicama do 4 jedinice na 6 s, cooldown 20 s. Pulsar: udar 60 do dometa 6, cooldown 10 s; T2 površinski udar 45 u radijusu 2 oko mete, cooldown 16 s. Eho: lečenje 80 do dometa 5, cooldown 10 s; T2 polje usporava 35% u radijusu 4 na 6 s, cooldown 18 s.
- Herojski izbor se čuva kroz smrt; nema ponovne kupovine drugog heroja. Oživljavanje zahteva slobodne 4 pop, završeni sopstveni Oltar i praznu traku. Vraća se isti tip/XP/nivo, pun HP, prazne aktivne sposobnosti, sa sačuvanom ličnom opremom; Scout pri smrti ispušta inventar. Ovo je odluka za otvoreno pravilo, nije tiho preuzeto Scout pravilo za heroja.
- Čuvar dobija jedan slot za potrošnu prvu pomoć; ostali obični borci takođe jedan potrošni slot. Scout 4, heroj 6. Torba povećava Scout kapacitet na 6 i zauzima slot; nema slaganja niti prodaje/uklanjanja torbe u ovoj verziji. Predaja prenosi isti predmet, ne kopiju, do 2 jedinice.
- Shop stock: T1 originalne zalihe 1 par čizama/90 s, 2 prve pomoći/45 s; obnova svakog kupljenog komada ima sopstveni rok. T2 oprema po 1/90 s, signal 2/60 s. Upgrade čizama 100 menja postojeći T1 par i daje ukupno +50%, ne +70%. Herojsku opremu Scout može nositi; dejstvo ima samo kod heroja. Kristal ne leči pri promeni vlasnika; smanjenje maksimalnog HP-a ograničava trenutni HP.
- Povratni signal se potroši pri početku četvorosekundnog kanalisanja; šteta ili novi nalog prekida bez refund-a. Cilj je najbliža završena sopstvena Centrala pri početku; ako nestane, povratak ne izvršava teleport na nevažeće mesto. Dolazak je na prohodnu slobodnu izlaznu tačku.
- NPC brzina 2,5; aggro 4, domet 5, leash 10; bez mete 3 s povratak, zatim 5 s oporavak. Pri povratku i oporavku nema primanja štete/nagrada. Potpun povratak briše doprinos, ali ne oživljava ranije ubijene članove. Nagrada se deli prema stvarnoj šteti bez overkill-a; ostatak integer podele ide redom najvećeg razlomljenog ostatka, zatim nižeg player ID-ja. Herojski XP samo živom sopstvenom heroju do 12 jedinica. Neiskorišćen udeo XP-a se gubi. Loot ima 15 s ekskluzivnosti najjačem doprinosiocu; nerešeno po nižem ID-ju. Torbe ostaju do preuzimanja.
- Magla: sopstvena trenutna vizija + trajno istražene ćelije; bez simulacije timske zajedničke vizije dok timovi nisu uvedeni. Vidokrug ne uključuje LOS blokiranje šumom u ovom kandidatu. Minimap ne treba da otkriva neprijateljske jedinice ili tajmere neviđenih događaja.
- Lokalni poraz: nema nijedne Centrale (završene ili u gradnji) i nema živog radnika. Preostala vojska ne nestaje; poraženi igrač ne prima nove narudžbine. To nije završen model online meča.

## Stabilnost i provere

Fiksna simulacija 20 Hz ostaje autoritet svih poslova; kamera i animacije ne menjaju ekonomiju. Prvo provere svake transakcije, vremena, smrti, otključavanja i opreme. Zatim integracija i stvarni browser input. Testiranje uključuje negativne slučajeve: nedovoljno CODE, pogrešno vlasništvo, prepun inventar, dupli upgrade, globalni limiti, nedostupna meta, prekid i reset.

Color Engine je pregledan zaseban izvor. Njegov 120 Hz korak, arena resize i mehanike VOID/TILT ne prepisuju se automatski u RTS. Izdvajanje zajedničkog modula boja ostaje poseban posao posle stabilne T1/T2 celine.


## Završni zapis implementacije i dokaza — 19.11.2026.

Kod: `index.html`, `style.css`, `script.js`; bez mrežnih zavisnosti. Simulacija i prikaz ostaju u jednom prenosivom JS fajlu sa razdvojenim unutrašnjim funkcijama; potpuno izdvajanje adaptera u zasebne module nije deo ove isporuke.

Izvršeno u lokalnom Node/Chromium okruženju:

| Provera | Rezultat | Obim |
|---|---|---|
| `node --check script.js` | PASS | JS sintaksa |
| `tests/economy.cjs` | 9 PASS | zalihe, transport, obuka, pauza, putanje, ponovljivost |
| `tests/construction.cjs` | 11 PASS | gradnja, prekidi, refund, kapacitet, četiri ekonomije i dostupnost prolaza |
| `tests/tier2.cjs` | 31 PASS | T1/T2 transakcije, globalni limiti, šteta, predmeti, heroji, kampovi, vidljivost i negativni slučajevi |
| `tests/browser.cjs` | PASS | stvarni input gradnje/obuke, stop/nastavak, kapacitet, reset/P4 i širina 390 px |
| `tests/hud.cjs` | PASS | kompaktan HUD, F1 praćenje pokretne jedinice, 1–0/F1–F4, zgrade/lokacije, sukobi, očuvanje naloga |
| `tests/tier2-browser.cjs` | PASS | gradnja svih tipova T1/T2 zgrada, T2 tajming, sva istraživanja/vojna proizvodnja, poseta shop-u/Svetilištu, oprema i Bastionove obe sposobnosti |

Poslednji browser scenario koristi izolovan finansiran fixture (20.000 CODE), bez izmene isporučenog koda, i testni prikaz 5 FPS uz zadržanu simulaciju 20 Hz. Time proverava input i završavanje mehanika pri sporijem iscrtavanju, ne normalan build order ili brzinu ekonomskog razvoja. Automatizovani PASS nije potvrda konačnog balansa, performansi svih računara ili korisničkog prihvatanja.

Dodatna odluka o pojavi kampa: sve pozicije grupe rezervišu se odjednom na prohodnim ćelijama do šest ćelija od centra, uz razmak najmanje 24 render jedinice od drugih jedinica i članova grupe. Ako nema mesta za celu grupu, pojava se odlaže jednu sekundu bez povećanja generacije. Postojeće jedinice se ne teleportuju i ne oštećuju. Neutralni `owner` u geometriji označava kvadrant, ne besplatnu sopstvenu viziju; kampovi/prodavnice prolaze stvarnu proveru vidljivosti. Respawn tajmer pamti samo igrač koji je video čišćenje.

### Preostale granice i sledeći OI zadaci

- Ovo je lokalni T1/T2 sadržaj, ne završen kompetitivni RTS. Strateški botovi, mrežni autoritet, timovi/lobby 1v1/2v2, sinhronizacija i zaštita fog podataka čekaju zaseban posao.
- A* koristi jednu ćeliju. Clearance po radijusu, lokalno izbegavanje, formacije i sprečavanje preklapanja vojske još nisu implementirani. Veći borac trenutno nije fizički širi u navigaciji. To ograničava testiranje wall-off taktike i velikih bitaka.
- Magla ima trenutnu viziju/istraženost, bez terenskog LOS-a i timskog deljenja. Dijagnostika lokalno vraća i skriveno stanje; nije server filter. Neistražena podloga je snažno zatamnjena, istražena podloga pamti teren, ne žive neprijateljske jedinice.
- XP u ovom kandidatu dolazi od kampova prema doprinosu/blizini. PvP XP tabela nije definisana. Predmeti i sposobnosti imaju funkcionalne efekte, ali još nisu prošli OI balans.
- Mobilna širina je layout provera; touch upravljanje nije potvrđeno. Nema trajnog save/replay-a, automatskih makroa, T3 vojske ni povezivanja sa Color Engine-om.
- OI prvo proverava normalnu ekonomiju bez testnog novca, korisnost novih uloga, vidljivost komandi/mete, scout rute, inventar, smrt i oživljavanje. Zapažanja se beleže kao zadaci; v0.3 se čuva kao stabilna osnova.

HUD dopuna posle vizuelnog pregleda: nazivi zgrada i vojnika prikazuju se na selekciji ili hover-u, umesto stalnog preklapanja u gustoj bazi. Kratke oznake razlikuju razvojne modele zgrada. Baza-kamera pronalazi preživelu sopstvenu bazu, zatim sopstvenu jedinicu, bez oslanjanja na indeks promenjen uništenjem objekata.
