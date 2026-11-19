# WHR Game Engine — strateški botovi i multiplayer MASTER

Datum: 19.11.2026, Europe/Belgrade. OI: Beli Zec. Implementacija: Codex.

## Zahtev i etapa

OI je zatražio MASTER i početak kodiranja nakon objašnjenja razlike između NPC-a, strateškog bota i mrežnog protivnika. Radimo dogovorenim redom: navigacija → strateški bot → multiplayer. v0.6 je **lokalni 1v1 bot kandidat**, na posebnoj kopiji v0.5. 2v2 i mrežni server se ne proglašavaju završenim ovom etapom.

## Šta prvi strateški bot mora da radi

- Isti početak: 100 CODE, 3 radnika, konačni resursi, ista proizvodnja, gradnja, cene, populacija i fizičko kretanje.
- Održava radnike, gradi Kasarnu/Releje, obučava Scouta i vojsku, štedi za T2, gradi T2 proizvođače i istražuje. Radnik potrošen na gradnju zaista prestaje da donosi resurse.
- Scout otkriva mapu. Vojska brani bazu od vidljivih pretnji, bira obližnji kamp ili napad, a ranjene povlači. Prvi bot nije optimalan takmičarski protivnik.
- Ne sme da čita skrivene neprijateljske jedinice, redove proizvodnje, CODE ili trenutno stanje neviđenog kampa. Pamćenje viđene lokacije sme da bude zastarelo. Početne pozicije i stalna geometrija mape su javni podaci.
- Nema besplatnog CODE-a, instant gradnje, ignorisanja radijusa ili povećanog limita. Jedna strateška odluka po sekundi; bounded red komandi i dnevnik razloga/odbijanja.
- Pauza, reset, izbor P1–P4 i poraz moraju raditi. Čovek i bot imaju različit kontroler; OI/AI klasa nije naziv tog kontrolera.

## Komande i autoritet

Zajednički dispatcher prima tip, argumente, owner, tick i sequence. Oba kontrolera koriste iste postojeće gameplay validatore. Bot šalje nalog za sledeći tick; UI zadržava trenutni odgovor potreban preview-u/transakcijama. Ova razlika je eksplicitna: pre pravog multiplayer-a i ljudski input mora proći serverovski red, uz definisan input delay.

Botov interni autoritet ne dobija se promenom `game.active`. Kamera/selekcija i vlasnik ljudskog input-a ostaju odvojeni od izvršenja botove komande. Dupla sequence ne naplaćuje komandu ponovo. Nedozvoljen owner, nevažeći tip i prevelik payload se odbacuju. Lokalni dispatcher je razvojna osnova, nije mrežna bezbednosna granica dok klijent poseduje celo stanje.

Planner dobija izdvojeni pogled dozvoljenih podataka, a ne ceo `game`. Jednaka dozvoljena opažanja sa različitim skrivenim neprijateljskim stanjem moraju dati istu odluku. Stvarni simulator i dalje proverava fizičke prepreke i važeću vidljivost pri izvršenju.

## Lokalni režimi prvog kandidata

- Poligon: prethodno ponašanje bez strateških botova, četiri početne ekonomije radi poređenja.
- Lokalni 1v1: izabrani čovek protiv dijagonalnog bota; druga dva slota nisu igrači meča. Nema povezivanja dva računara. Meč se završava postojećim pravilom poraza (bez Centrale i radnika).
- Lokalni 2v2, timska vizija, saveznički autoritet i timska pobeda zahtevaju sledeću dopunu. Ne dodavati samo još dva bota i zvati to timskim mečom.

## Multiplayer — naredna etapa

GitHub Pages služi klijent. Potreban je zaseban server i test sa najmanje dva računara/klijenta. Predloženi prvi smer: autoritativni Node/WebSocket server sa istom simulacijom, dozvoljenim pogledom po igraču i serijalizovanim komandama. Konačni izbor potvrđuje se posle merenja simulacije i obima snapshot-a; 20 Hz sam po sebi nije dokaz identičnosti između različitih JS runtime-ova.

Obavezno: verzija pravila/protokola, lobby/slot, sesija i reconnect token (bez upisa u dnevnik), validacija owner/tick/sequence i rate limit, serverov CODE/pop/vidljivost, odbacivanje duplikata, dozvoljeni snapshot-i, prekid veze/timeout i rezultat meča. Lokalni dijagnostički snapshot ne šalje se direktno protivničkom klijentu. Zatim 2v2, deljena vizija i timski rezultat.

Provere: dva klijenta vide isti dozvoljen rezultat; kašnjenje, ponovljene/zastarele komande, gubitak veze, povratak u meč, neovlašćen owner i skriveni objekti. Tek stvarno izvršen test opravdava tvrdnju da multiplayer radi.

## Dokazi i granice

Status: **IMPLEMENTIRAN LOKALNI v0.6 KANDIDAT.** Multiplayer i 2v2 nisu implementirani. OI playtest v0.6 i balans ostaju otvoreni.

### Izvršene provere — 19.11.2026.

| Provera | Rezultat |
|---|---|
| JS sintaksa | PASS |
| Ekonomija / navigacija | 9 PASS |
| Gradnja i geometrija | 11 PASS |
| T1/T2 mehanike | 31 PASS |
| Fizička navigacija i saobraćaj | 10 PASS |
| Novi kontroleri / dispatcher / strateški bot | 12 PASS |
| Chromium HUD/hotkeys | PASS |
| Chromium gradnja/input | PASS |
| Chromium finansiran T2 tok | PASS |
| Chromium mešovita grupa/radijusi | PASS |
| Chromium lokalni bot 1v1 | PASS |

Ukupno **73 Node provere i pet browser scenarija**. Bot browser koristi normalnu početnu ekonomiju i stvarni izbor režima, proverava gradnju i vojsku protivnika, nepromenjenu ljudsku kameru, pauzu, reset/P4 i raspored pri širini 390 px. Testni prikaz 5 FPS koristi istu simulaciju 20 Hz. Prethodni T2 browser ostaje finansiran sadržajni fixture, a ne dokaz build-order tajminga.

Dugi Node test drži protivničku bazu i radnike neuništivim da bi meč trajao svih 18.000 tick-ova (15 simuliranih minuta). Bot kreće sa 100 CODE/3 radnika, bez dodatnog novca. Provereni završeni T2, Akademija, podrška, Radionica, Oltar, sve četiri vojne uloge i tri istraživanja. Neuništivost je testni uslov protivnika, nije opcija u isporučenoj partiji. U običnoj partiji bot može da pobedi ili izgubi ranije.

### Konkretna implementacija i granice

- `script.js`: konfiguracija kontrolera, zajednički dispatcher, red botovih komandi za naredni tick, sequence evidencija, izdvojena opažanja/planner, lokalni rezultat. Kamera i game.active se ne menjaju tokom botovog poteza.
- `index.html`: izbor poligon/lokalni 1v1 i kompaktan status. Promena režima pre starta resetuje svet; nema podešavanja usred meča.
- `tests/bots.cjs`, `tests/bots-browser.cjs`: novi funkcionalni i regresioni dokazi. `tests/bots.cjs` menja skriveni protivnički CODE/HP/inventar i dobija istu dozvoljenu sliku/odluku. To ne predstavlja dokaz mrežne bezbednosti.
- Strategija je deterministički prvi build-order, bez nasumičnosti i podesivih težina. Izbor gradilišta pokušava stvarne lokacije i dobija legitimna odbijanja, bez nove naplate. Dnevnici su ograničeni na 200 obrađenih komandi i 80 odluka po botu.
- Radnički prilazi dobijaju različita slobodna mesta kod čvora/isporuke i ponovo pokušavaju pri dužem zastoju. Jedan miner po čvoru i stvarni transport ostaju; fizički zastoji nisu isključeni. Promenjene putanje mogu promeniti prihod u odnosu na raniju verziju.
- Bot ima osnovnu odbranu/povlačenje, kamp/napad, Scout izviđanje, uslovno prizivanje Bastiona i oživljavanje. Nema još napredne politike proširenja baze, kupovine/kurirske opreme, optimalnog taktičkog izbora, timskih saveza ili garantovanog pobedničkog plana.
- Stari direktni gameplay API ostaje za kompatibilnost lokalnih testova. Dispatcher koristi iste validatore; ljudski UI i bot koriste njega za naloge. To se ne sme izložiti kao proizvoljan daljinski API bez serverovog identiteta, dozvoljenog pogleda i validacije.

Sledeće posle OI provere: dorada prvog bota na uočenim zastojima, zatim serverski 1v1 protokol i dva stvarna klijenta; 2v2 tek uz saveze, timsku viziju i timski rezultat. Ne nazivati lokalni 1v1 multiplayer-om.
