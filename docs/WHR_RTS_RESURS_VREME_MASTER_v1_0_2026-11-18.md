# WHR RTS — MASTER: CODE ekonomija i vreme

Verzija: 1.0 · Datum: 18.11.2026. · Autor: Codex uz zahteve Belog Zeca (OI)

Status: SPECIFIKACIJA / PREDLOG ZA PROTOTIP. Igra i balans nisu implementirani niti testirani ovim dokumentom. Konačne odluke donosi OI.

## 1. Namena i granice

Ovaj MASTER definiše osnovu ekonomije i vremenske simulacije WHR RTS igre, uz poređenje sa StarCraft II i Warcraft III. Predviđen je za dalji razvoj, GitHub dokumentaciju i prenos između E: diska, ChatGPT radionice i BIBLI.

Razlikovati: DOGOVORENO = izričit zahtev korisnika; PREDLOG = početna projektantska odluka; OPEN = još nije odlučeno; NOT_RUN = nije izvršena provera. Brojevi predloženi za WHR nisu izmerene SC2/WC3 konstante.

## 2. Dogovoreni temelj

- Originalna WHR RTS igra, sa uticajima SC2 i Warcrafta; heroji i ajtemi mogu koristiti inspiraciju iz Dote/LoL-a.
- Dve klase: OI i AI. Klasa je odvojena od kontrolera: čovek ili bot.
- Jedna mapa, četiri početne pozicije u uglovima; režimi 1v1 i 2v2.
- Ljudi i botovi mogu popunjavati slotove; moguć je i bot protiv bota.
- Osnovni resurs se zove **CODE**.
- Glavna baza ima **Tier 1 → Tier 2 → Tier 3**.
- Svaki aktivni igrač počinje sa **Tier 1 bazom i tri radnika** koji automatski kreću na CODE.
- Tajmer partije počinje od **00:00** sa početkom igre.
- Postoji generisana koncept slika „WHR · CODE FRONTIER”; ona još nije navigaciona ili balansirana mapa.
- Početna klijentska struktura: index.html, script.js, style.css. Internet multiplayer zahteva i serverski deo.

## 3. Šta smo proverili u SC2 i Warcraft III

### 3.1. SC2: ciklus i zasićenje

SC2 koristi minerale i vespene gas. Radnik putuje do mineralnog čvora, skuplja, nosi teret u bazu i ponavlja ciklus. Blizzardov vodič navodi 5 minerala po standardnom teretu i 7 sa bogatog čvora. Jedan radnik aktivno obrađuje pojedinačni mineralni čvor; drugi putuju ili čekaju. Udaljenost baze utiče na prihod, a zalihe se iscrpljuju. [S1]

Broj radnika za dobar prihod nije univerzalni tvrdi limit: zavisi od putanje, čvorova i zasićenja. Razlikovati maksimalni ukupan prihod od efikasnosti dodatnog radnika. Ne prepisivati „dva” ili „tri radnika” kao zabranu pristupa čvoru. Ne preuzimamo istorijske prihode po minutu kao važeće WHR vrednosti.

### 3.2. Warcraft III: resursi i različiti načini rada

Warcraft III koristi zlato i drvo. Human/Orc radnici fizički prenose zlato; Night Elf i Undead imaju drugačije načine eksploatacije. Dakle, WC3 nema jedan identičan transportni ciklus za sve rase. Dodatni rudnici omogućavaju širenje ekonomije, ali zahtevaju osiguravanje terena. [S2]

### 3.3. Warcraft III: upkeep i vreme sveta

Upkeep smanjuje prihod od rudarenja zlata prema potrošenom food-u: 0–50 daje 100%, 51–80 daje 70%, 81–100 daje 40%. To je porez na prihod, ne stalno oduzimanje već sačuvanog zlata. Food nije iznos zlata niti broj jedinica bez obzira na njihovu veličinu. [S3]

WC3 ima i dan/noć, koji utiče na vidljivost i pojedina ponašanja. Taj sat sveta razlikuje se od proteklog vremena partije. [S4]

### 3.4. Uporedna odluka za WHR

| Oblast | SC2 obrazac | WC3 obrazac | WHR v1 predlog |
|---|---|---|---|
| Resursi | Minerali + gas | Zlato + drvo | Jedan CODE |
| Radnici | Transportni ciklus minerala | Različito po rasišuma | Radnici, CODE čvorovi i proširenja |
| Ograničenje prihoda | Zasićenje i transport | Kapacitet rada i upkeep | Redovi, transport, konačne zalihe |
| Velika vojska | Supply | Food + upkeep | Isti transportni ciklus za OI/AI |
| Rast ekonomije | Radnici, čvorovi, nove baze | Radnici, rudnici i  | Populacija OPEN; upkeep isključen u predlogu |
| Dodatni sat | Tajmeri sistema | Tajmeri + dan/noć | Jedan sat simulacije; dan/noć kasnije |

Od SC2 uzimamo pregledan fizički tok resursa. Od WC3 uzimamo tehnološke nivoe i mogućnost kasnijih ekonomskih osobenosti. Ne uvodimo istovremeno sve mehanike obe igre.

## 4. Vreme je uslov rada, ne automatski novac

Samo proticanje vremena ne povećava CODE. Prihod nastaje kroz izvršen rad i potvrđenu isporuku. Ako nema aktivnih radnika, nalazišta ili dostupnog mesta za isporuku, nema rudarskog prihoda.

Tri odvojena pojma:

1. **Stvarno vreme:** vreme računara/servera, korisno za mrežu i merenje performansi.
2. **Vreme simulacije:** autoritativno vreme meča; koristi se za kretanje, skupljanje, gradnju, obuku, istraživanja i cooldown.
3. **Vreme sveta:** opciona faza dan/noć; nije uvedena u v1.

Predlog: standardni meč 1×, jedna sekunda simulacije odgovara jednoj stvarnoj sekundi dok meč radi normalno. Ne tvrdimo da je to odnos svih brzina ili verzija SC2/WC3. Testne brzine i pauza menjaju napredovanje svih sistema zajedno, a ne samo rudarenja.

## 5. Životni ciklus meča

Stanja: LOBBY → LOADING → READY → RUNNING → FINISHED. PAUSED je opciono kontrolisano stanje.

- Lobi i učitavanje ne stvaraju prihod.
- Server počinje RUNNING tek kada su učesnici spremni ili je primenjeno definisano pravilo za timeout.
- Na tick-u 0: stanje igrača, početni CODE, baza, tri radnika i čvorovi već su postavljeni.
- Radnici dobijaju početne naredbe, ali prva isporuka zahteva put i rad; ne dobijaju besplatan teret.
- Tajmer prikazuje celo proteklo vreme simulacije kao MM:SS, kasnije HH:MM:SS.
- Pauza zaustavlja rudarenje, kretanje i sve rokove; sat operativnog sistema može nastaviti da teče.
- FINISHED zaustavlja ekonomske promene.

## 6. Predlog početnih parametara — BALANCE_CANDIDATE_001

Ovi brojevi služe za prvi eksperiment. OI ih još nije odobrio kao konačni balans.

| Parametar | Predlog | Napomena |
|---|---:|---|
| Tick rate | 20 Hz | Jedan tick = 50 ms simulacije |
| Početni CODE | 100 | Otvoreno za odluku OI |
| Početni radnici | 3 | Dogovoreno |
| CODE čvorovi kod baze | 6 | Jednako za sva četiri ugla |
| Zaliha po običnom čvoru | 1.000 CODE | Početno polje ukupno 6.000 |
| Standardni teret | 5 CODE | Inspirisan SC2 |
| Trajanje skupljanja tereta | 3 s / 60 tick-ova | Ne uključuje put i čekanje |
| Brzina radnika | 3 mapne jedinice/s | Mapna jedinica tek treba fizičku skalu |
| Aktivni radnici po čvoru | 1 | Ostali mogu čekati ili putovati |
| Trajanje isporuke | 0 s | Atomski događaj po dolasku u domet |
| Cena novog radnika | 50 CODE | Predlog |
| Obuka radnika | 15 s / 300 tick-ova | Jedan aktivni posao po redu baze |
| Bogati CODE teret | 7 CODE | Isto vreme rada kao standardni |
| Zaliha bogatog čvora | 1.000 CODE | Brži prihod, ne nužno veća ukupna zaliha |
| Pasivni prihod | 0 | Nema novca samo zbog tajmera |
| Upkeep | Isključen | Mogući kasniji eksperiment |

Nosivost na bogatom čvoru određuje tip nalazišta, nije trajno povećanje radnikove nosivosti na običnom čvoru. Poslednji teret može biti manji od 5 ili 7.

## 7. Radnik: stanja i naredbe

IDLE → MOVE_TO_NODE → WAIT_FOR_NODE → HARVEST → RETURN_CARGO → DEPOSIT → MOVE_TO_NODE.

Moguća odstupanja: MOVE, BUILD, REPAIR, ATTACK, DEAD, NO_DROPOFF. Samo živi radnik sa važećim ciljem može da radi.

- Slanje na CODE pokreće ponavljajući rad; igrač ne naređuje svaki krug posebno.
- Početna tri radnika raspodeliti na različite dostupne čvorove.
- Izbor čvora koristi dostupnu putanju i procenjeno čekanje, ne samo vazdušnu udaljenost.
- Ne menjati cilj svakog tick-a; novi izbor radi se na događaj ili kada cilj postane nevažeći.
- Na čvoru jedan radnik drži pravo rada. Red čuvati stabilno po vremenu dolaska i ID-ju.
- Posle dovršenog skupljanja čvor oslobađa mesto, radnik nosi teret.
- CODE ulazi u račun igrača tek pri DEPOSIT; svaki teret isporučuje se tačno jednom.
- Ručna naredba ima prednost nad automatizmom. Za v1, prekinuti nepotpuni HARVEST gubi napredak; završeni teret ostaje kod radnika.
- Graditelj sa teretom ne isporučuje ga magično tokom gradnje. Posle posla nastavlja prethodni rad samo ako je takva naredba sačuvana.
- Poginuli radnik gubi teret u v1; podizanje palog CODE-a nije uvedeno.
- Posle iscrpljivanja čvora radnik traži drugi čvor u istom polju; bez dostupnog čvora postaje IDLE i igrač dobija obaveštenje.
- Bez sopstvene završene baze za isporuku radnik zadržava teret i čeka novu naredbu ili novu bazu. Nema nevidljivog prihoda.

## 8. Obračun, zasićenje i primer

Za jednog radnika, u stabilnom neometanom ciklusu:

`T_ciklus = T_odlazak + T_čekanje + T_skupljanje + T_povratak + T_isporuka`

`prosečni CODE/min ≈ teret × 60 / T_ciklus`

Primer isključivo za WHR predlog: put do čvora 6 jedinica, brzina 3 jedinice/s, rad 3 s, bez čekanja. Krug traje 2 + 3 + 2 = 7 s. Jedan radnik približno 42,86 CODE/min; tri radnika na tri nezavisna jednaka čvora približno 128,57 CODE/min.

To je dugoročni prosek. U prvih 60 s, sa prvim dolaskom nakon 2 s i prvom isporukom na 7 s, svaki radnik isporučuje na 7, 14, 21, 28, 35, 42, 49 i 56 s: ukupno 40 CODE, odnosno 120 za tri radnika. Početni CODE ne računamo u prihod.

Za jedan čvor sa 3 s rada i teretom 5, teorijski plafon vađenja je 100 CODE/min ako se mesto stalno koristi. Stvarna isporuka zavisi i od transporta. Sa šest takvih čvorova plafon vađenja je 600 CODE/min, a ne obećani prihod svake postavke.

Više radnika ne znači beskonačno povećanje. Izmeriti krivu prihoda za 1–24 radnika i konkretan raspored mape; tek tada odrediti preporučeni broj radnika po bazi.

## 9. Konzervacija CODE-a

Pri završetku HARVEST atomski izvršiti:

`teret = min(nosivost, preostala_zaliha)`

`preostala_zaliha -= teret; radnik.cargo += teret`

Nema umanjenja čvora pri kasnijoj isporuci. Pri DEPOSIT: stanje igrača povećava se za cargo, cargo postaje 0, beleži se jedan događaj.

Kontrolna jednačina za ceo meč:

`početni novac + početne zalihe + eksplicitne nagrade = novac igrača + zalihe čvorova + tereti + neto potrošen CODE + izgubljeni tereti`

Povraćaj troška smanjuje neto potrošnju; timski transfer je unutrašnji prenos bez stvaranja CODE-a. Svaka buduća pasivna nagrada mora imati poseban evidentiran izvor.

## 10. Gradnja, proizvodnja i Tier 1/2/3

- Cena i uslovi proveravaju se i CODE se skida pri prihvatanju posla; ne tek na završetku.
- Posao ima integer durationTicks i preostali rad. Završava se jednom.
- Predlog: jedna proizvodna traka po bazi; obuka radnika i prelazak na sledeći Tier međusobno se isključuju.
- Tier unapređenje nije automatski prihod niti samo povećanje HP-a: otključava sadržaj koji tek definišemo.
- Predlog: baza prihvata isporuke i dok unapređuje Tier.
- Cene i trajanja T2/T3 ostaju OPEN; zahtev T3 je završeni T2.
- Za obično građenje predlog je jedan prisutan radnik; odlazak graditelja pauzira rad. Višegraditeljsko ubrzanje nije uključeno.
- Uništen objekat prekida svoje poslove. Predlog v1: bez povraćaja za uništenje; ručno otkazivanje vraća 100% za posao koji nije započeo i 75% za započeti, uz zaokruživanje nadole. OI može promeniti ove vrednosti.
- Populacija, ograničenje reda i pravilo izlaza kada je prostor blokiran moraju biti definisani pre kompletne proizvodnje vojske. Ne preuzimaju se neprimetno iz druge igre.

## 11. Stabilna simulacija i multiplayer

Predlog implementacije: autoritativni server obrađuje fiksne tick-ove. Browser prikazuje stanje i šalje namere, nikada ne određuje svoj prihod.

- Za 20 Hz: `matchTimeSeconds = tick / 20`.
- Renderovanje koristi requestAnimationFrame i može raditi na 30, 60 ili 144 FPS bez menjanja ekonomije.
- Ne koristiti broj frame-ova ili klijentski setInterval kao izvor istine za rudarenje.
- Čuvati iznose kao cele CODE jedinice, a trajanja kao cele tick-ove; koordinatama dati definisanu preciznost.
- Server koristi monotoni sat za raspoređivanje tick-ova. Pod opterećenjem radi kontrolisani catch-up; ne izmišlja dovršene poslove i ne odbacuje proizvoljno vreme.
- Skriven tab ili spor browser ne zaustavlja autoritativni server. Klijent po povratku dobija sveže stanje.
- Naredba sadrži matchId, playerId, commandId, serverom dodeljen tick, tip i cilj. Identitet/ovlašćenje proverava server; commandId sprečava duplu obradu.
- Definisati stabilan redosled događaja istog tick-a, npr. validacija komandi → kretanje i borba/smrti → završetak rada → isporuke → proizvodnja → statistika. Mrtav radnik ne isporučuje posle smrti u istom tick-u.
- Čovek i bot koriste isti command interfejs i isti obračun. V1 bot nema besplatan CODE; različite težine menjaju odluke i reakcije.
- GitHub čuva kod; Pages može služiti statični klijent. Sesije i autoritativna simulacija zahtevaju poseban server, npr. Node.js + WebSocket kao kandidat.
- Save/replay mora beležiti verziju pravila, mapu, tick, stanja, redove, cargo i nasumični seed. Isti seed sam nije dovoljan za deterministički replay.

## 12. Četiri početne pozicije i timovi

Mapa mora izjednačiti stvarne dužine prohodnih putanja, količinu početnog CODE-a i prostor za gradnju; vizuelna simetrija slike nije dovoljan dokaz.

Predlog: 1v1 suprotni uglovi, 2v2 sever protiv juga. Svaki igrač ima sopstveni novčanik i svoja tri radnika. Zaliha svakog čvora je zajednički objekt mape: ne postoji kopija zalihe za svakog igrača.

Predlog v1: isporuka samo u sopstvene baze; deljenje resursa, saveznički drop-off i zajednički novčanik nisu uključeni. Za neaktivne uglove u 1v1 predlog je ukloniti početne baze/radnike, ali ostaviti CODE kao neutralnu mogućnost proširenja; posledice za trajanje meča proveriti.

Bogati centralni CODE može nuditi veći teret uz istu brzinu rada, ali i veći rizik. Kampovi, ajtemi i svetilišta još nemaju odobrene ekonomske nagrade. Nema drugog resursa pod drugim imenom bez odluke OI.

## 13. Šta igrač treba da vidi

CODE stanje, aktivne/nezaposlene radnike, proteklo vreme meča, Tier baze, preostalu zalihu selektovanog čvora, cargo radnika, napredak posla i upozorenja za iscrpljeno nalazište ili nemogućnost isporuke.

CODE/min prikazati kao isporuke u prethodnih 60 simulacionih sekundi, uz oznaku kraćeg perioda tokom prve minute. Ne prikazivati početni novac, povraćaje ili timske transfere kao rudarski prihod.

## 14. Plan provere — svi testovi NOT_RUN

| Provera | Očekivani rezultat |
|---|---|
| Start meča | Tačno 3 radnika, T1, definisani početni CODE; prihod tek posle prvog ciklusa |
| Fiksna putanja iz primera | 8 isporuka po radniku u 60 s, 120 CODE ukupno za tri |
| Render 30/60/144 FPS | Isto stanje posle istog broja tick-ova i istih komandi |
| Pauza | Nema napretka ekonomije ili poslova |
| Dvostruka komanda/isporuka | Nema duplog tereta, duple naplate ili duplog prihoda |
| Jedan čvor, više radnika | Najviše jedan aktivno skuplja; stabilan red |
| Zaliha 3 CODE | Poslednji teret 3, zaliha 0, bez negativnih vrednosti |
| Smrt sa teretom | Nema isporuke; gubitak evidentiran |
| Uništen drop-off | Teret ostaje, traži se nova sopstvena baza |
| Otkazivanje/uništenje posla | Primena dokumentovanog refund pravila tačno jednom |
| Četiri ugla | Jednaki prihodi uz ekvivalentne početne komande i geometriju |
| Kriva 1–24 radnika | Merljiv rast, zatim opadanje koristi dodatnog radnika |
| Bot i čovek | Iste cene, vreme, zalihe i zakon konzervacije |
| Multiplayer kašnjenje | Server ostaje izvor istine; ponovljene poruke ne stvaraju novac |
| Konzervacija | Kontrolna jednačina važi posle svakog događaja |

## 15. Otvorene odluke OI

1. Odobrenje početnog balansa iz odeljka 6.
2. Cene, trajanja i sadržaj T2/T3.
3. Populacija i eventualni upkeep; predlog za početak bez upkeep-a.
4. Kasnije ekonomske razlike OI/AI; početni predlog identične osnove.
5. Pravila timskih transfera, pauze i prekida veze.
6. Respawn i nagrade kampova, bonusi centra i trajanje ciljane partije.
7. Dan/noć: za sada van osnovne ekonomije.

## 16. Izvori i dokazni status

Provereno putem web pretrage i čitanja Blizzardovih vodiča 18.11.2026. Vodiči su istorijski opisi mehanika, ne potvrda svih trenutnih patch vrednosti. Precizan odnos brzina igre, kompletne rasne formule i savremeni ladder balans nisu nezavisno benchmarkovani; ne koriste se kao WHR konstante.

- [S1 — Blizzard: StarCraft II, Game Guide: Resources](https://news.blizzard.com/en-us/article/4488900/game-guide-resources)
- [S2 — Blizzard: Warcraft III, Resources](https://classic.battle.net/war3/basics/resources.shtml)
- [S3 — Blizzard: Warcraft III, Upkeep](https://classic.battle.net/war3/basics/upkeep.shtml)
- [S4 — Blizzard: Warcraft III, Day/Night Cycle](https://classic.battle.net/war3/basics/daynight.shtml)
- [S5 — Blizzard: Warcraft III, Building Basics](https://classic.battle.net/war3/basics/buildings.shtml) — dopunski izvor o poziciji baze i radu.

`SC2_WC3_REFERENCE_REVIEW = DONE`

`WHR_RESOURCE_TIME_MASTER = DRAFT_READY`

`BALANCE_APPROVED_BY_OI = OPEN`

`GAME_IMPLEMENTATION = NOT_RUN`

`ECONOMY_TESTS = NOT_RUN`

Sledeći korak: pregled OI, zatim izolovani prototip radnika, čvora, baze i simulacionog sata; izmeriti prihod i prohodnost pre dodavanja heroja i složenih bonusa.
