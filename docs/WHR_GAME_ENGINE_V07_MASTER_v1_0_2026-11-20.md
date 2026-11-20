# WHR Game Engine — V7 MASTER

Verzija dokumenta: 1.2 (implementacioni kandidat, 20.11.2026)  
Datum: 20.11.2026, Europe/Belgrade  
Verzija igre u planu: **0.7.0 / V7**  
Stabilna osnova: **0.6.2** (ne 6.02); V6 je imao ispravke 0.6.1 i 0.6.2.  
Glavni arhitekta i konačna odluka: **Beli Zec / OI / WRA**  
Priprema i buduća implementacija: **Codex / Ćale**

## 1. Status i dogovor

OI traži V7 koji unapređuje kretanje vojske kroz gužve, kompletira T3 i uvodi stvarni mrežni multiplayer. Prvobitni zahtev izradio je MASTER. Nakon naknadnog OI naloga „Kreni da kodiras V7“ nastao je odvojeni implementacioni kandidat; javni server nije objavljen.

| Stavka | Status |
|---|---|
| Upravljanje 0.6.2 | OI testirao i prihvatio u razgovoru; PR #6 spojen u main prema dostavljenoj slici |
| Prethodne automatizovane provere | 97 Node provera i 7 Chromium scenarija za 0.6.2; nisu dokaz V7 |
| V7 MASTER | Napisan kao plan i kriterijumi prihvatanja |
| V7 kod / V7 testovi / V7 OI proba | IMPLEMENTIRAN KANDIDAT / 138 Node slučaja + 9 browser scenarija PASS / NOT_RUN |
| T3 brojke | Preuzete iz izvornog MASTER-a; kandidati za balans |
| Novi tehnički parametri | Predlozi; meriti i verzionisati pre zaključavanja |

Cilj je stabilna, proverljiva nadogradnja. Ne proglašavamo gotovom funkciju samo zato što postoji dugme, model ili lokalna simulacija.

## 2. Izvori i prioritet

Pregledana lokalna osnova: `/workspace/whr-code-frontier-v062/script.js`, `core.part`, dokumentacija i prethodni izveštaji provera. Naknadnom proverom GitHub-a potvrđen je main commit `e42eea6762066e6e3cc87d71d30e31cbdd8000bd`, sa stablom `a1fed4bde5b3a24de8ca464725bc0fc66de88e3a` prihvaćenog 0.6.2. Pre grananja ponovo proveriti da nije bilo novih izmena.

Izvorni dokumenti nalaze se u `docs/` stabilnog projekta:

- `WHR_RTS_TIER_3_MASTER_v1_0_2026-11-18.md` — osnovna T3 pravila i otvorene odluke.
- `WHR_RTS_TIER_2_MASTER_v1_0_2026-11-18.md` i `WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md` — kontinuitet razvoja i ekonomije.
- `WHR_RTS_JUNGLE_MASTER_v1_0_2026-11-18.md` — T3 kampovi i plen.
- `WHR_GAME_ENGINE_BOTOVI_MULTIPLAYER_MASTER_v1_0_2026-11-19.md` — kontroleri i serverovski autoritet.
- `WHR_GAME_ENGINE_NAVIGACIJA_BOTOVI_MULTIPLAYER_MASTER_v1_0_2026-11-19.md` — fizička navigacija.
- `WHR_GAME_ENGINE_HOTFIX_0_6_2_UPRAVLJANJE_MASTER_v1_0_2026-11-20.md` — prihvaćeno upravljanje.
- `FIX_0_6_1_COMBAT_FREEZE.md` — kružne reference i blokada pri kontaktu vojski.

Ovaj MASTER organizuje V7 i dopunjuje tehnički plan. Ne menja tiho izvorne gameplay brojke. Svako zatvaranje OPEN pravila dobija odluku, razlog, datum i odgovarajuću proveru. Nezavisne radove možemo nastaviti dok pojedina odluka čeka OI.

## 3. Šta čuvamo

- Mapa 160 × 160 logičkih ćelija = 25.600 ćelija. Ćelija 16 render jedinica, svet 2560 × 2560. Zoom ne menja pravila sveta.
- Simulacija 20 Hz; 1 tick = 50 ms. FPS ne određuje prihode, brzine ili trajanje obuke.
- Jedan CODE resurs, konačna nalazišta, stvarni transport radnika i populacione rezervacije.
- OI/AI klase odvojene od kontrolera čovek/bot. Nema besplatnog novca za bota.
- Prihvaćen kompaktan HUD, selekcija, Ctrl/Shift grupe, mapiranje objekata/lokacija, miš/minimapa, rally i Shift redovi.
- Važeći fizički radijusi i geometrija; nema teleportovanja radi rešavanja obične gužve.
- Entitetske veze su ID-jevi; pozicije su kopije koordinata. Nema živih međusobnih objekata u `dest`.
- Postojeći poligon i lokalni 1v1 ostaju dostupni za regresione probe.

3D, Three.js, novi modeli, Color Engine integracija, javni rang sistem i veliki vizuelni redizajn nisu uslov V7. Three.js je pokazana moguća biblioteka, nije integrisan renderer.

## 4. Obim i etape V7

| Etapa | Isporuka | Uslov prelaska |
|---|---|---|
| V7-A | Razrešavanje gužvi i merljiva navigacija | Fizička ispravnost, prolaz mogućih ruta, stabilnost kontakta i očuvani nalozi |
| V7-B | T3 lokalni sadržaj i podrška bota | Zatvorena relevantna OPEN pravila, kompletne mehanike i provere |
| V7-C | Autoritativni mrežni 1v1 | Dva klijenta, validacija, filtrirana stanja, prekid i povratak |
| V7-D | Mrežni 2v2 | Četiri klijenta, savezi, zajednička vizija i timski rezultat |
| V7-R | Integracija i OI proba | Sve etape i regresije prošle; objavljena ograničenja |

Puna ciljna verzija 0.7.0 obuhvata i V7-D. Raniji 1v1 kandidat jasno se označava etapom; ne proglašava se kompletan V7. Multiplayer baziran na proverljivoj postojećoj mehanici može se razvijati pre završetka T3, ali puna integracija mora pokriti i T3.

## 5. V7-A: kretanje vojske i gužve

### 5.1 Postojeća osnova

Kod već ima A*, maske prohodnosti prema radijusu, proveru swept kretanja kroz teren, odbijanje presecanja drugih jedinica, lokalne pokušaje zaobilaženja i odvojene grupne destinacije. To nije kompletno koordinisano propuštanje: više jedinica može bezbedno ostati u zastoju.

### 5.2 Traženo ponašanje

1. Razlikovati neprohodan cilj, privremeno zauzet cilj, čekanje u prolazu i aktivnu borbu. HUD prikazuje kratak razlog samo kada je koristan.
2. Meriti napredak po tikovima; kratko usporavanje nije odmah zastoj. Pragovi su konfiguracioni kandidati.
3. Za savezničke jedinice u konfliktu definisati stabilan izbor prvenstva i privremeno sklanjanje na fizički važeće mesto. Prvobitni zadatak ostaje sačuvan.
4. U jednosmerno prohodnom tesnacu jedna grupa čeka dok druga izlazi; sprečiti večno smenjivanje prvenstva i gladovanje iste jedinice.
5. Ne sklanjati neprijatelja kao saveznika: neprijatelj može legitimno blokirati prolaz. Hold ne napušta položaj bez izričitog novog naloga; ostali posebni zadaci imaju dokumentovan prekid.
6. Koristiti lokalnu pretragu pre novog punog A*. Replan rasporediti kroz tikove, uz ograničen broj pokušaja i keš prema reviziji prepreka/radijusu.
7. Prostor pretraživati preko prostornog indeksa gde merenje pokaže korist; ne porediti sve sa svima bez potrebe.
8. Ne menjati redosled Shift zadataka, CODE rezervacije, rudarski teret ili borbene mete radi privremenog manevra.
9. Proizvodni izlaz, iskrcavanje i teleport koriste istu proveru slobodnog prostora; bez duple proizvodnje tokom čekanja.

Prvenstvo, dužina rezervacije prolaza i prag zastoja zahtevaju merenje. Ne obećavamo garantovan prolaz kroz fizički nemoguć ili potpuno zauzet prostor.

### 5.3 Dijagnostika

Razvojni panel, isključen po početnom podešavanju: razlog čekanja, vreme bez napretka, broj replaniranja, vreme navigacije/ticka, rezervisani prolaz i ID konflikta. Ne zatrpavati HUD igrača. Za svaki zastoj sačuvati početni scenario i komande dovoljne za ponavljanje.

## 6. V7-B: T3 sadržaj iz MASTER-a

### 6.1 Razvoj i ekonomija

| Sadržaj | Izvorno pravilo |
|---|---|
| Globalni T3 | Završen T2 + Akademija + Radionica; 600 CODE; 90 s = 1800 tick-ova |
| Radnici | Limit 12 po igraču; rezervisane obuke ulaze u limit |
| Populacija | Releji dodaju po 5 do gornje granice 60; nema besplatnog popunjavanja |
| Scout / heroj | Po jedan, uz postojeće rezervacije |
| Teleport sidra | Najviše 2, uključujući važeće rezervacije buduće/aktivne gradnje |

Globalni Tier se ne gubi uništenjem jedne Centrale. Jedno unapređenje ne naplaćuje se više puta. Sve naplate poštuju CODE rezervisan Shift gradnjom.

### 6.2 Jedinice i zgrade

| Element | CODE / trajanje | HP / populacija | Funkcija |
|---|---|---|---|
| Nebeski Čuvar | 180 / 35 s | 220 / 3 | Vazduh; šteta 18 na 1,5 s, domet 5; kopnene i vazdušne mete prema zatvorenoj odluci |
| Mostonoša | 220 / 40 s | 300 / 4 | Vazduh, bez napada; prevoz do 6 populacije kopnenih putnika |
| Senka | 150 / 30 s | 120 / 2 | Kopno; 20 na 2 s izbliza; samo kopnene jedinice; prikrivanje i otkrivanje pri napadu 3 s |
| Vazdušna luka | 250 / 55 s | HP OPEN | Proizvodi obe letelice |
| Centar prikrivanja | 200 / 45 s | HP OPEN | Proizvodi Senku |
| Teleport sidro | 150 / 35 s | 500 | Sopstveno završeno odredište skoka |
| Detektorski modul kule | 75 / 20 s | Postojeća kula | Domet detekcije 8 uz trenutno viđenje oblasti |

Let prelazi kopnene prepreke, ostaje unutar granica i ne otkriva celu mapu. Kopneni i vazdušni sudari imaju odvojena pravila. T2 Strelac i kula već imaju protivvazdušno pravo; proveriti ga na stvarnim T3 letelicama.

### 6.3 Transport, teleport, prikrivanje

- Putnik ostaje isti entitet, vlasništvo/populacija/inventar/CODE teret se ne dupliraju. Ukrcan putnik ne izvršava kopneno kretanje, rudarenje ili napade dok je u transportu; ovo je predlog za zatvaranje odgovarajućeg OPEN pravila.
- Iskrcavanje je po stvarno slobodnim mestima i radijusima. Ako nema mesta, preostali putnici ostaju ukrcani. Smrt transportera obrađuje putnike jednom, uključujući heroja, nagrade i teret prema odluci.
- Teleport prenosi Mostonošu sa putnicima do sopstvenog završenog sidra: 5 s pripreme, 40 CODE, cooldown 60 s. Šteta prekida pripremu. Trenutak naplate/cooldown/refund ostaje OPEN do odluke.
- Senka: odvojeni cloak, rok otkrivanja i detekcija po posmatraču. Bez važećeg otkrivanja nema obične selekcije/ciljanog napada neprijatelja. Serijalizovani pogled ne šalje skriveni model, poziciju ili nalog.
- Detekcija i vidljivost su odvojeni uslovi; detektor nije radar cele mape. Razrešiti AoE i kontakt sa skrivenom jedinicom bez curenja preciznih podataka.
- Rally, grupe, Tab i Shift nalozi podržavaju nove tipove. Putnici ne mogu zaobići uslove utovara kroz stari nalog.

### 6.4 Preostali T3 sadržaj

- Scout T3 čizme: zamena prethodnog efekta, ukupno +100% osnovne brzine, 8 mapnih jedinica/s; upgrade 150 CODE kao izvorni kandidat. Zatvoriti stock i uslove kupovine.
- T3 kamp: vođa 700 HP / 25 štete na 2 s i dva T2 pratioca; prvo pojavljivanje 05:00, respawn 240 s, nagrada 120 CODE + 180 XP. Vitalni kristal samo pri prvom čišćenju. Ako efekat kristala nije definisan u važećim pravilima, mora dobiti odluku pre implementacije.
- Centralno CODE jezgro ne dobija izmišljen boss sistem.
- Bot mora legalno stići do T3 i koristiti novi sadržaj u testovima. Razraditi ograničen plan: štednja za T3, proizvodnja, protivvazdušna odbrana/detekcija, bez privilegovanog uvida. Transport/teleport bota zahteva zaseban funkcionalni scenario, ne samo posedovanje jedinice.

### 6.5 Registar obaveznih odluka pre odgovarajućeg koda

| ID | Odluka koja nedostaje | Blokira |
|---|---|---|
| O01 | T3 Centrala: HP, očuvanje odnosa HP, red obuke i uništenje domaćina unapređenja | Globalni prelaz |
| O02 | Brzine, vidokrug i fizički radijusi tri jedinice; vazdušno razdvajanje | Kretanje i balans |
| O03 | HP, dimenzije, izlazi i preduslovi novih proizvođača | Gradnju i obuku |
| O04 | Nebeski Čuvar protiv građevina; projektil ili neposredna šteta | Borbu |
| O05 | Utovar: domet, vreme, red, saveznici, heroji, opsada, radnički teret, smrt/inventar | Transport |
| O06 | Teleport: naplata, cooldown, refund, move/stop, štit, vizija i gubitak sidra | Skok |
| O07 | Senka: tačan početak otkrivanja, primljena šteta, AoE i fizički kontakt | Stealth |
| O08 | Minimalni Tier modula i timska detekcija | Kontru Senki |
| O09 | Čizme: mesto, stock, direktna kupovina; efekat/slaganje Vitalnog kristala | Predmete/plen |
| O10 | Savezi: vizija, detekcija, transport i zajednička kontrola; timski poraz | 2v2 |

Codex priprema konkretne predloge sa posledicama. OI potvrđuje gameplay smer. Ne označavati tehnički odabrane brojke kao prethodno dogovorene. Nije potrebno čekati sve odluke da bi počela navigacija ili izolovan mrežni protokol.

## 7. V7-C: mrežna arhitektura 1v1

### 7.1 Autoritativni server

Predloženi prvi transport: Node.js + WebSocket. Zajednički modul simulacije radi bez DOM/Canvas-a. Server pokreće jedan autoritativni svet po meču na 20 Hz; klijenti šalju namere i crtaju dozvoljeno stanje. Ne zahtevamo identično simuliranje celog skrivenog sveta na svakom klijentu.

Pre implementacije zaključati podržanu Node verziju i verzije zavisnosti, lockfile i licence. Izdvojiti core i adaptere uz regresije; ne raditi usputnu kompletnu promenu arhitekture radi naziva modula.

Ljudske gameplay komande prelaze na isti autoritativni put kao bot. Lokalni preview gradnje i selekcija mogu reagovati odmah; fondacija, plaćanje, šteta i obuka postaju stvarni tek kada server prihvati komandu. Klijent ne bira stvarnog owner-a niti sam potvrđuje novac.

### 7.2 Minimalni protokol

- Handshake: verzija protokola, rules/content hash, režim i kompatibilnost. Nevažeća verzija dobija jasan razlog bez ulaska u meč.
- Lobby: kreiranje/pridruživanje, najviše dozvoljenih slotova, spremnost, jedinstven vlasnik slota; start jednom.
- Komanda: `matchId`, `sequence`, tip i ograničeni argumenti (ID/koordinate/append). Server određuje igrača iz sesije i konačan tick izvršenja; klijentski tick je samo podatak za validaciju.
- Odgovor: sequence, prihvatanje/odbijanje, razlog i server tick. Duplikat vraća prethodni ishod ili odbijanje bez nove naplate.
- Stanje: monotoni tick/revizija, sopstveni dozvoljeni podaci, trenutna vizija, istraženi teren i dozvoljena sećanja na ranije viđene objekte. Snapshot pri spajanju/povratku; delte tek uz ispravno obnavljanje posle propuštene revizije.
- Validacija: vlasništvo, živa meta, vidljivost, Tier, CODE i rezervacije, populacija, cooldown, red zadataka, geometrija, limit payload-a i frekvencije.
- Ograničen mrežni red i izlazni bafer: spor klijent ne gomila neograničenu istoriju i ne zamrzava svet ostalima.

Konfiguracione granice za rate limit, veličinu poruke, toleranciju sequence-a i frekvenciju slanja stanja odrediti i zapisati merenjem. Simulacija 20 Hz ne nalaže 20 punih mrežnih snapshot-a svake sekunde.

### 7.3 Vidljivost i poverljivost stanja

Ne slati dijagnostički `WHR.snapshot()` udaljenom igraču. Skriveni protivnički CODE, inventar, proizvodni redovi, nalozi, nevidljive jedinice i događaji van vida ne smeju stići u payload. Isto važi za minimapu, logove i poruke greške koje bi otkrivale metu.

Server gradi pogled prema igraču/timu. Isti dozvoljeni pogled uz različito skriveno stanje mora davati isti dozvoljeni izlaz, osim javno definisanih događaja. Posle gubitka vida neprijatelj postaje zastarelo sećanje ili nestaje prema pravilima; ne ažurirati ga krišom. Smrt objekta u magli ne sme sama obrisati poslednje poznato sećanje i time otkriti događaj.

### 7.4 Prekid veze i rezultat

Predlog: identitet slota vezan za nepredvidiv reconnect token, odvojen od javnog ID-ja meča. Token se ne upisuje u log niti URL. Povratak obnavlja filtrirani snapshot i sequence evidenciju; stari socket gubi pravo upravljanja.

Politika trajanja tolerancije, nastavka meča tokom prekida i konačnog poraza mora biti zaključana pre igrive mrežne verzije. Klijent ne sme sam resetovati ili pauzirati tuđu partiju. Predlog početnog pravila: svet nastavlja tokom privremenog prekida, a mrežna pauza zahteva saglasnost učesnika. OI potvrđuje pre kodiranja tog toka.

Završetak meča je serverovski događaj jednom. Komande posle završetka ne troše resurse. Ponovno povezivanje ne oživljava poraženu stranu.

### 7.5 Pokretanje i hosting

GitHub Pages ostaje klijent. Server zahteva zaseban proces i, za javni HTTPS klijent, WSS adresu sa odgovarajućim sertifikatom. Adresa servera je podešavanje, ne tajna u kodu. Lokalni/LAN test i javni internet test su odvojeni dokazi.

Prvo lokalna proba sa dva klijenta, zatim dva računara. Ne obećavati dostupnost javnog hostinga pre izbora i izvršene provere. Automatski deploy, trošak hostinga i otvaranje spoljne infrastrukture nisu izvršeni ovim dokumentom.

## 8. V7-D: pravi 2v2

- Četiri odvojena kontrolera, dva tima i proverene ravnopravne početne pozicije. Team ID nije isto što i player/owner ID.
- Predlog: zajednička trenutna vizija, istražen teren i detekcija u timu; svaki igrač upravlja samo svojim entitetima. Bez automatskog deljenja CODE-a i preuzimanja savezničke komande.
- Zasebno zatvoriti saveznički transport, pomoć u gradnji/popravci, friendly fire i ponašanje napuštenog slota. Nisu implicitno omogućeni.
- Timski rezultat sledi dogovoreno pravilo opstanka tima; ne završavati meč na osnovu prvog poraženog saigrača bez odluke OI.
- Botovi koriste timski dozvoljen pogled i isti serverovski dispatcher. Kombinacije ljudi/botova moraju biti eksplicitne opcije lobby-ja.

## 9. Stabilnost i merljive performanse

Merenja beleže hardver, runtime/browser, mapu, broj entiteta i komande. Ciljevi su budžet kandidata, ne trenutno izmereni rezultati:

- Server tick ima budžet 50 ms; kao početni cilj pratiti p95 ispod 25 ms i p99 ispod 50 ms na dogovorenoj referentnoj mašini.
- Opterećenje: dve i četiri ekonomije, puna T3 populacija po igraču, NPC, putnici i aktivni redovi. Populacija nije isto što i broj entiteta; navesti stvarne brojeve.
- Beležiti tick trajanje, broj A* pokušaja, vreme navigacije, količinu mrežnih podataka po klijentu, zauzeće memorije i backlog.
- Render ciljati na 60 FPS na dogovorenom desktopu, uz probu 30 FPS i usporenog prikaza bez promene simulacionog vremena.
- Ako server ne stiže, ograničiti catch-up i prijaviti preopterećenje; ne izvršavati beskonačnu petlju niti preskakati naplate/borbene događaje radi ubrzanja.
- Kontinuirana partija najmanje 30 minuta i višestruki start/reset/lobby ciklusi; bez rastućih tajmera, bafera, duplih socket-a ili neograničenih logova.

Zahtev za sporiji hardver ne rešavati tvrdnjom da je 2D automatski brz. Meriti stvarnu simulaciju, prikaz i mrežu odvojeno.

## 10. Matrica ciljnog prihvatanja — detalji izvršenja u novom izveštaju

| ID | Scenario | Dokaz za prolaz |
|---|---|---|
| N01 | Dve savezničke grupe u uskom prolazu, oba smera | Zabeležen red propuštanja; prolaz gde fizički postoji; bez trajnog gladovanja |
| N02 | Radnici, Čuvari i Razbijači, prepreke i promene gradnje | Važeći radijusi, bez presecanja zida/teleportovanja; Shift red ostaje |
| N03 | Neprijateljski kontakt u tesnacu | Legitimna blokada/borba; sat, input i serijalizacija nastavljaju |
| N04 | Zatvoren izlaz/rally, zauzeta destinacija, Hold | Bez duple obuke; jasan razlog čekanja; Hold se ne pomera sam |
| T01 | T3 uslovi, paralelne komande, uništenje domaćina | Jedna naplata, tačno 1800 aktivnih tick-ova prema konačnoj odluci |
| T02 | Rezervisani radnici/populacija/sidra iz više izvora | Limiti 12/60/2, bez negativnog slobodnog CODE-a |
| T03 | Let kroz šumu i T2 protivvazdušni napad | Let validan, granice/vizija važe, kopnena ne-AA jedinica odbija cilj |
| T04 | Različiti putnici, pun transporter i blokirano iskrcavanje | Kapacitet 6, isti ID-jevi/inventar, bez brisanja putnika |
| T05 | Smrt transportera i heroja sa teretom | Jedna smrt i nagrada, validno oživljavanje prema odluci |
| T06 | Skok: uspeh, šteta, stop, uništeno sidro, duplikat | Tačan trošak/cooldown/ishod; bez kopija putnika |
| T07 | Senka: kretanje, napad, detektor, magla, AoE | Rokovi i ciljanje po odluci; nema skrivenih podataka u mreži |
| T08 | T3 kamp, doprinos, prvi predmet, respawn | Jednokratni plen i nagrade, prava vremena, bez neviđenih obaveštenja |
| T09 | T3 čizme i botov legalan T3 tok | Nema slaganja bonusa; bot zaista plaća i koristi sadržaj |
| M01 | Dva klijenta igraju 1v1 | Server odlučuje; isti javni događaji, ispravni zasebni pogledi |
| M02 | Dva fizička računara | Kretanje, gradnja, borba i T3 rade preko veze; navesti LAN/internet |
| M03 | Lažan owner, loš ID, nevažeće koordinate, payload flood | Odbijanje bez mutacije sveta; ostali igrači nastavljaju |
| M04 | Duplikati, stare i vanredne sequence komande | Najviše jedno dejstvo/naplata po prihvaćenoj komandi |
| M05 | RTT 50/150/300 ms, jitter i prekid | Nema duplih naloga, nekontrolisanog backlog-a ili klijentskog novca |
| M06 | Prekid i povratak, tuđi/pogrešan token, stari socket | Samo pravi slot vraćen, filtriran snapshot, autoritet starog socketa ukinut |
| M07 | Skriveni neprijatelj menja CODE/putanju/inventar | Payload ne odaje neviđeno stanje; proveriti sirove poruke |
| M08 | Odbijena gradnja i rezervacije u mrežnom Shift nizu | UI i server usklađeni; nema duplog refunda ili zaglavljene rezervacije |
| M09 | 2v2 četiri klijenta i smrt saigrača | Dozvoljena timska vizija, sopstveni autoritet, tačan timski rezultat |
| S01 | 30 minuta i puna četiri T3 kapaciteta | Izmeren tick/mreža/memorija; bez blokade i neograničenog rasta |
| S02 | Sve 0.6.2 regresije | Postojeće provere prolaze ili je promena očekivanja obrazložena |
| OI01 | Normalna partija, bez finansiranog testnog novca | OI proverava upravljanje, čitljivost, tempo i upotrebljivost |

TCP/WebSocket već uređuje prenos bajtova: dupliranje aplikacionih komandi testirati zasebno. Gubitak paketa emulirati kao kašnjenje/prenosne zastoje i reconnect, bez pogrešne tvrdnje da WebSocket isporučuje proizvoljno presložene pakete.

Za svaki scenario čuvati verziju koda, uslove, stvarni rezultat i log ili snimak kada pomaže. NOT_RUN nije FAIL niti PASS. Finansirani fixture proverava mehaniku, ne normalan tempo ekonomije. Determinizam jednog runtime-a nije dokaz mrežne zaštite.

## 11. Organizacija implementacije i isporuke

Predložena struktura, prilagodljiva posle pregleda zavisnosti:

```text
src/core/          pravila, svet, tick, entiteti, borba, ekonomija
src/navigation/    geometrija, prostorni indeks, putanje, propuštanje
src/protocol/      tipovi poruka, granice i verzija
src/client/        input, selekcija, kamera, HUD, renderer, mrežni adapter
server/            lobby, sesije, autoritativni mečevi, filtrirani pogledi
tests/            simulacioni, protokol, više klijenata i browser scenariji
docs/             MASTER, odluke, pokretanje i izveštaji
```

Premeštanje koda raditi malim proverljivim koracima. Poligon mora imati jasan način pokretanja; mrežni ES moduli/server mogu zahtevati lokalni HTTP launcher. Ne obećavati da novi mrežni klijent radi preko `file://` ako to nije testirano. Pakovanje uključuje tačno uputstvo i proverene komande.

Sačuvati E: 0.6.2 folder i ZIP. Za V7 napraviti odvojeni projekat/paket, kontrolne sume i granu od potvrđenog main-a. Etapni PR-ovi imaju cilj, promene, izvršene provere i ograničenja. Ne spajati i ne objavljivati automatski samo zato što je napisan MASTER.

## 12. Kada je V7 završen

- Sve tri oblasti rade zajedno: gužve, T3 i mrežni 1v1/2v2.
- Registar gameplay odluka zatvoren za isporučene funkcije; dokumentacija odgovara kodu.
- Izvršena matrica provera sa objavljenim rezultatima i hardverom; stabilnost i skriveni podaci provereni.
- Dva računara proverena, četiri klijenta za 2v2; LAN dokaz se ne predstavlja kao javni internet dokaz.
- Prihvaćeno upravljanje 0.6.2 očuvano, bez povratka ogromnog HUD-a.
- OI izvršio i prihvatio probu; eventualna preostala ograničenja izričito navedena.

Prvi programski korak nakon ovog MASTER-a: potvrditi osnovni commit, napraviti izdvojenu V7 radnu kopiju i dodati reprodukcione scenarije gužve pre promene algoritma. Zatim mala implementacija propuštanja sa izvršenim dokazom, dok se pripremaju konkretni predlozi za T3 OPEN odluke.

**Kocka po kocka: pravilo → kod → izvršena provera → OI proba.**

## 13. Dopuna: istraživanje pre kodiranja

Pregledani su GitHits, GitHub i zvanični izvori. [Multiplayer istraživanje](WHR_V07_MULTIPLAYER_ISTRAZIVANJE_v1_0_2026-11-20.md) čuva poređenje, konkretne nedostatke sadašnjeg koda, proverene verzije i ograničenja dokaza. [Katalog koda i proba](WHR_V07_KATALOG_KODA_I_PROBA_v1_0_2026-11-20.md) čuva polazne primere, ADR-001 predlog i nacrt protokola/vidljivosti.

Preporuka za mali dokaz: Node LTS + ws; Colyseus ostaje alternativa. Ovo nije zaključana odluka na osnovu merenja. GitHits širi research pozivi imali su timeout; fokusirani read/metadata/vulnerability pozivi uspeli su. Sačuvani dokazi su u `research/EVIDENCE_2026-11-20.json`. Nije počelo V7 kodiranje i nijedna mrežna proba još nije izvršena.

## 14. Implementacioni kandidat 0.7.0

Naknadno je implementiran i testiran odvojen V7 kandidat: ograničeno propuštanje saveznika, T3 sadržaj, autoritativni Node/ws server i lokalni mrežni 1v1/2v2 sa odvojenim pogledima, ack/deduplikacijom i reconnect-om.

[Pokretanje](PROTOTYPE_0_7.md) · [Kandidatske gameplay odluke O01–O10](V07_ODLUKE_KANDIDAT_001.md) · [Izvršene provere i otvorene granice](V07_TEST_REPORT_2026-11-20.md).

Automatizovani testovi nisu potvrda kompletne matrice u svim okruženjima. Dva fizička računara, javni WSS, duga realna mrežna partija pod masovnom borbom i OI prihvatanje još nisu izvršeni. Mrežni bot slotovi nisu uvedeni. Ne označavati punu V7-R etapu kao završenu pre tih dokaza.
