# WHR RTS — MAPA I PRAVILA MASTER

Verzija: 1.0  
Datum: 18.11.2026. (Europe/Belgrade)  
Projekat: WHR · CODE FRONTIER  
Arhitekta i konačna odluka: Beli Zec / OI  
Priprema specifikacije: Codex

## 1. Glavna odluka i status

**„MAPA JE KLJUC USPEHA” — Beli Zec.**

Mapa određuje gde gradimo, koliko ekonomija stvarno donosi, kako vojska prilazi, šta Scout može saznati i za koje ciljeve vredi rizikovati. Zato sledeći razvojni prioritet postaje igriva geometrija, pre širenja broja jedinica i efekata.

`MAP_RULES_MASTER = DOCUMENTED`  
`OI_MAP_PRIORITY = CONFIRMED`  
`GEOMETRY_AND_NUMBERS = DESIGN_CANDIDATE`  
`NEW_MAP_IMPLEMENTATION = NOT_RUN`  
`MAP_BALANCE_PLAYTEST = NOT_RUN`

Ovaj dokument ne tvrdi da je nova mapa već ugrađena u igru. Dogovoreni temelji su odvojeni od projektantskih predloga i OPEN odluka. Renderovana koncept slika nije navigaciona mreža, a kontrolna suma ne dokazuje balans.

## 2. Dokumenti i redosled pravila

Povezani MASTER-i:

- `WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_1_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_2_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_3_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_JUNGLE_MASTER_v1_0_2026-11-18.md`

Prethodni dokumenti se čuvaju kao verzije. Ovaj MASTER precizira mapni okvir, ali ne popunjava prećutno nepoznate borbene statistike ili herojske sposobnosti.

Važne postojeće izmene: T2 je tehnologija celog igrača; T3 predlog omogućava Strelcu i kuli napad na vazduh već na T2; Jungle sistem zamenjuje ranije jednokratne T1 kampove obnovljivim kampovima. Sve brojke ostaju kandidati za balans.

## 3. Dogovorena osnova mape

- Jedna mapa, četiri početne pozicije u uglovima.
- P1 severozapad, P2 severoistok, P3 jugozapad, P4 jugoistok.
- Četiri unutrašnja sektora označena od OI predstavljaju **JUNGLU**.
- Spoljni glavni put i prilazi centralnoj zoni povezuju delove mape.
- Centralno CODE jezgro je zasebna zona/cilj.
- Režimi 1v1 i 2v2; slot je čovek, bot ili prazan. OI/AI klasa nije isto što i kontroler.
- CODE je jedini osnovni ekonomski resurs.
- Scout izviđa, kupuje i dostavlja predmete; radnici grade i skupljaju; heroji/vojska bore se za mapu.
- Izgled je originalni WHR: bele zec jedinice, CODE kristali, šuma, kamene strukture i tehnološki elementi.

Koncept džungle ima po T1, T2 i T3 kamp i jednu prodavnicu u svakom sektoru: ukupno 12 kampova i četiri prodavnice. Njihov precizan položaj mora odgovarati prohodnim putevima i stvarnim dimenzijama jedinica.

## 4. Šta mapa mora da omogući

1. Početna baza sa prostorom za T1–T3 građevine, radnike i okupljanje vojske.
2. Zaštićeniji početni CODE i rizičnija proširenja.
3. Najmanje glavni i zaobilazni put za napad i povlačenje.
4. Džungla sa unutrašnjim stazama, zaklonom i prohodnim kampovima.
5. Otvorena borbena polja i smisleni uži prolazi.
6. Izviđanje sa informacijama koje imaju vrednost, uz maglu rata.
7. T3 vazdušne prečice, mesta za iskrcavanje i smislena Teleport sidra.
8. Ravnopravan pristup resursima i ciljevima za ravnopravne početne pozicije.

Jedna kula ne treba da zatvori sve puteve između protivnika. Kontrola centra treba da bude korisna, ali ne jedini način razvoja ili kretanja.

## 5. Skala i početna geometrija — PREDLOG

Predlog za novu mapu je **160 × 160 mapnih jedinica**, sa mrežom postavljanja građevina od 1 jedinice. To je novi kandidat, ne postojeća implementacija.

Koordinate: (0,0) severozapad, x raste ka istoku, y ka jugu. Centar: (80,80). Predlog centara Centrala:

| Slot | Centar | Boja |
|---|---|---|
| P1 | (20,20) | Cyan |
| P2 | (140,20) | Violet |
| P3 | (20,140) | Amber |
| P4 | (140,140) | Coral |

Predlog početne građevinske oblasti je približno **32 × 32 jedinice po bazi**, uz zasebne maske za resurse, litice, ulaze i rezervisane prolaze. Površina ne znači da je svaka ćelija dozvoljena za izgradnju.

Kvadratni logički svet može se prikazivati odozgo ili izometrijski. Pikseli i veličina prozora ne menjaju mapne udaljenosti. Postojeći prototip 0.1 ima proceduralni svet 1.600 × 1.120 render jedinica; to nije odobreni konačni raspored niti 160 × 160 nova mapa.

Nova skala zahteva ponovnu proveru prihoda i vremena kontakta: ako je radnik brzine 3 mapne jedinice/s, promena razmaka CODE-a od baze direktno menja ekonomiju. Ne povećavati mapu samo grafičkim rastezanjem bez odgovarajuće simulacione geometrije.

## 6. Početna baza, platoi i rampe

Svaka početna zona treba da primi Centralu, najmanje dve proizvodne građevine, Releje, odbranu i kasnije specijalne objekte, bez obaveznog identičnog rasporeda.

- CODE pojas ne sme preseći jedini izlaz.
- Obezbediti radničku rutu između čvorova i Centrale i prostor za izlazak novih jedinica.
- Glavni izlaz je dovoljno širok za vojsku, uz dodatni bočni izlaz ili kratku vezu ka alternativnom putu.
- Ako je baza na uzvišenju, rampa mora stvarno povezivati plato i niži teren. Obe strane moraju imati prohodne ćelije i odgovarajuću visinu.
- Ispravka OI: donje baze P3/P4 ne smeju imati pogrešno orijentisane stepenice. Gornji kraj rampe pripada platou baze, donji kraju glavnog puta.
- Grafičke stepenice nisu dovoljne: rampa mora biti deo navigacije. Transporteri i teške jedinice koriste prohodnu rampu, ne proizvoljno penjanje uz liticu.

Prvo implementirati dve visinske ravni sa eksplicitnim rampama ili potpuno ravan terrain. Ne dodavati neimplementirane visinske bonuse preko ilustracije. Dometa, šansa promašaja i vidljivost sa visine ostaju OPEN.

## 7. CODE polja i proširenja

Početno polje: **6 čvorova × 1.000 CODE**, jednako za sva četiri slota. Standardni teret 5, skupljanje 3 s, prihod pri isporuci. Limit radnika: T1 pet, T2 osam, T3 dvanaest.

Predlog mapne ekonomije:

| Tip polja | Predlog rasporeda | Uloga |
|---|---|---|
| Početno | Po jedno uz svaku početnu bazu | Rana ekonomija, relativno lakša odbrana |
| Prvo proširenje | Po jedno ravnopravno dostupno svakom uglu | Nova Centrala i izloženiji radnici |
| Sporno bogato polje | Po jedna prilazna zona oko centra | Veći prihod po teretu uz rizik |

Broj čvorova i ukupna zaliha novih proširenja/bogatih polja ostaju OPEN. Predlog bogatog tereta 7 CODE ne znači beskonačnu ili veću ukupnu zalihu.

Prvo proširenje mora imati čist prostor za Centralu, radnički prilaz, prolaz odbrane i bar dva pravca napada. Ne pretvarati samu džunglu u jednolično građevinsko polje. Izgradnja ekonomskog proširenja dobija posebnu čistinu pored nje ili na spoljnom pravcu.

Ne dozvoliti Centralu direktno preko CODE čvorova. Precizan minimalni razmak mora se izabrati kroz test ciklusa. Početna polja moraju imati uporedive stvarne, a ne samo vazdušne udaljenosti.

## 8. Putna mreža i prostor za borbu

Spoljni prsten služi povezivanju baza i zaobilascima. Centralni sever–jug i zapad–istok pravci služe bržem pristupu centru. Unutrašnje staze omogućavaju ulazak/izlazak iz svake džungle iz više smerova.

Predlog širina za prvi test:

| Oblast | Prohodna širina |
|---|---:|
| Glavni put / rampa baze | 8 jedinica |
| Bočni put | 5–6 jedinica |
| Uži džungla prolaz | Najmanje 4 jedinice |
| Otvoreno bojište | Najmanje 18 × 18 jedinica |

Ovo nisu SC2/WC3 konstante. Pre prihvatanja definisati stvarne radijuse svih jedinica. Prolaz mora propustiti najveću dozvoljenu kopnenu jedinicu i imati prostor za skretanje; nije dovoljno da kroz njega prolazi samo tačka centra.

Predlog za geometrijski test: radnik/Scout radijus 0,35, pešadija 0,45, Razbijač 1,2 jedinice. To su novi kandidati, ne već dogovorene borbene statistike.

Prednost uskog prolaza mora proizaći iz sudara i dometa: ako se sve jedinice preklapaju, ne možemo tvrditi da postoji stvarna taktička zagušenost. Ne uvoditi trajno guranje/zarobljavanje radnika samo da bi izgledali fizički.

## 9. Četiri džungle

Svaki sektor ima tri kampa, prodavnicu i povezane staze. T1 kamp bliži je početnoj bazi, T2 je uz bočni unutrašnji put, T3 prema centru. Prodavnica je na raskrsnici izvan početnog aggro dometa kampova.

- Tri pristupa po sektoru: spoljni prsten, centralni prilaz i bočna veza.
- Šuma i stene oblikuju prostor; sam naziv JUNGLA nije prepreka.
- Kamp nije postavljen na jedinom prolazu.
- Zaobilaženje kampa moguće je bez obaveznog započinjanja borbe, uz pravilno izabran put.
- Čistina kampa mora primiti protivnike i napadačku grupu, bez spawn-a u zid ili drvo.
- Put do prodavnice ne zahteva prethodno ubijanje T3 kampa.

### 9.1. Kampovi — kontinuitet sa Jungle predlogom

| Kamp | Prva pojava | Respawn po potpunom čišćenju | Nagrada cele grupe |
|---|---:|---:|---|
| T1 | 00:30 | 90 s | 30 CODE + 40 XP |
| T2 | 02:00 | 150 s | 60 CODE + 90 XP |
| T3 | 05:00 | 240 s | 120 CODE + 180 XP |

T1: dva protivnika po 120 HP, 6 štete na 1,5 s. T2: tri protivnika po 220 HP, 10 štete na 1,5 s. T3: vođa 700 HP, 25 štete na 2 s i dva T2 pratioca. Predlog dometa 5, napad na kopno/vazduh. Nema stacking-a u V1.

Aggro: prilazak na 4 ili primljen napad. Gonjenje najviše 10 od početne pozicije; 3 s bez mete pokreće povratak. Povratak i oporavak iz Jungle predloga zahtevaju tačna pravila da igrač ne dobije besplatnu štetu ili nagrade resetovanjem. Potpuni reset i obračun doprinosa sa poginulim članovima ostaju OPEN.

CODE/XP dodeljuju se pri čišćenju po doprinosu stvarnoj šteti; XP samo uz živog heroja do 12 od centra. T2/T3 garantovani predmet samo pri prvom čišćenju. Pravila zaokruživanja, izjednačenog doprinosa i nepreuzetog XP-a ostaju OPEN.

## 10. Prodavnice, Svetilište i centralno jezgro

Četiri neutralne prodavnice ne mogu se uništiti. Jedinica kupuje unutar 2 mapne jedinice, uz važeći inventar i dovoljno CODE-a. Scout mora imati ravnopravan put do prve prodavnice u svakom uglu.

WHR Svetilište služi prvom prizivanju heroja: Scout ga posećuje, 200 CODE / 30 s, heroj se pojavljuje kod sopstvene Centrale. **Broj i tačne lokacije Svetilišta su OPEN.** Ne pretpostaviti da je svaka prodavnica automatski Svetilište ili da centralno jezgro to već radi.

Centralno CODE jezgro zadržava zasebnu čistinu i četiri prilaza. Njegov boss, zauzimanje, nagrada, trajni buff i respawn nisu određeni. Okolna bogata CODE polja mogu funkcionisati bez izmišljanja nagrade za samo jezgro. Osvajanje centra ne zatvara sve spoljne rute.

## 11. Smislena gradnja — pravila predloga

Položaj građevine treba da utiče na ekonomiju, odbranu, izlazak vojske ili izviđanje. Autorov tekst o meaningful base building-u poslužio je kao inspiracija; ne tretiramo njegove ocene pojedinih igara kao univerzalne tehničke činjenice.

Predlog početnih footprint-a na mreži 1 × 1:

| Građevina | Otisak za geometrijski test |
|---|---|
| Centrala | 6 × 6 |
| Kasarna | 5 × 4 |
| Relej / kula | 2 × 2 |
| Akademija / Stanica podrške / Oltar | 4 × 4 |
| Radionica | 6 × 5 |
| Vazdušna luka | 7 × 6 |
| Centar prikrivanja | 4 × 4 |
| Teleport sidro | 4 × 4 |

Footprint-i su novi kandidati; model i dekoracija mogu izlaziti izvan blokirajućeg otiska samo ako ne zavode igrača oko prohodnosti.

### 11.1. Validacija lokacije

Gradnja zahteva vidljiv i istražen teren, prohodnu rutu za graditelja, dovoljno CODE-a i ispunjene preduslove. Ne može preko druge građevine, čvora, NPC spawn zone, prodavnice, litice, vode, rampe ili druge zabranjene maske.

Predlog: unutar početnih građevinskih zona, označenih proširenja i određenih forward čistina. Gradnja svuda unutar džungle nije automatski dozvoljena. Granice dozvoljene gradnje moraju biti vidljive kroz preview, a ne skriveno pravilo.

Cena, rezervacija otiska i narudžbina moraju biti atomski obrađeni. Početak gradnje blokira odgovarajući prostor; promena navigacije ne sme zatvoriti radnika u sopstveni objekat. Ako rezervacija postane nevažeća pre početka, zahtev se odbija ili otkazuje prema eksplicitnom pravilu, ne naplaćuje neuspešna nepostojeća građevina.

### 11.2. Zatvaranje prolaza i izlaz jedinica

Dozvoliti lokalno usmeravanje vojske postavljanjem zgrada, uz zaštićene no-build koridore koji čuvaju ključnu povezanost mape. Predlog V1: glavna izlazna rampa i bar jedan bočni izlaz početne baze ne mogu se potpuno zatvoriti građevinama.

To je nameran izbor za prvi WHR prototip; nije tvrdnja da sve RTS igre zabranjuju wall-off. Kasniji potpuni zidovi/kapije zahtevaju posebno pravilo i test.

Svaka proizvodna građevina ima označenu izlaznu zonu. Ako nema mesta za završenu jedinicu, predlog je da završen posao čeka oslobađanje prostora, bez nove naplate, stvaranja duplikata ili brisanja jedinice. Rezervacija populacije ostaje zauzeta.

Radnik koji gradi ne rudari. Više Kasarni daje više paralelnih linija samo ako su zaista izgrađene i ekonomija može finansirati proizvodnju; nema besplatnog ubrzanja jedne trake.

## 12. Vidljivost, šuma i izviđanje

Tri stanja terena: neistražen, istražen bez trenutne vizije, trenutno vidljiv. Istražen teren ostaje poznat, ali ne otkriva trenutne neprijateljske jedinice. Prikaz poslednje viđene građevine mora imati oznaku da je istorijski, ne aktuelno stanje.

Predlog za prvu implementaciju: označene šumske/stenske mase blokiraju kretanje i liniju vida; nema automatskog LoL brush pravila samo zato što je oblast džungla. Sečenje drveća nije uvedeno. Prozirna dekoracija ne sme skrivati stvarni blokator.

Scout mora moći da izviđa spoljne ivice baze i prepozna tip građevine. Nazivi i siluete treba da razlikuju ekonomiju, proizvodnju i tehnologiju: Radionica najavljuje opsadu, Centar prikrivanja Senke, Vazdušna luka letelice. Informacije se dobijaju viđenjem, ne globalnim UI obaveštenjem protivniku.

Detekcija nevidljivih jedinica i običan vidokrug nisu isto. Detektorski modul ima domet 8, ali traži vidljiv teren. Nije definisano da cela džungla automatski skriva jedinice ili da su Senke otkrivene blizu bilo kog čudovišta.

OPEN: deljenje timske vizije, linija vida sa uzvišenja, vazdušni sight preko šume i informacije na minimapi. U multiplayer-u server ne šalje neviđene detalje koje samo sakrijemo CSS-om.

## 13. T3 mapa: let, iskrcavanje i teleport

- Letelice prelaze šume, vodu i litice, ali ostaju unutar dozvoljenih granica mape.
- Moraju postojati i vredne vazdušne prečice i mogućnosti presretanja. Ne dozvoliti da sve baze budu jednako lako napadnute preko najkraće nebranjive ivice.
- Mostonoša miruje iznad prohodnog terena za utovar/iskrcavanje; prevozi do 6 populacije kopnenih jedinica.
- Iskrcavanje proverava prostor za sve jedinice i njihov stvarni radijus. Putnici za koje nema mesta ostaju unutra.
- Teleport sidro: završeno, sopstveno, 500 HP, najviše dva po igraču; potreban čist prostor za dolazak.
- Sidro ne može u NPC spawn, prodavnicu, neprohodnu liticu ili unutar drugog objekta.
- Teleport skok: 5 s pripreme, 40 CODE, 60 s cooldown; detalji naplate i prekida ostaju u T3 OPEN listi.

Preview sidra treba da pokaže prostor za dolazak, a ne samo dimenziju objekta. Vizuelna platforma nije dozvola da se jedinice pri teleportu pojave preko prepreka.

## 14. Početne pozicije i režimi

Predlog za 1v1: suprotni uglovi, rotiranje rasporeda P1–P4 ili P2–P3. Za 2v2: sever P1/P2 protiv juga P3/P4; alternativna rotacija istok–zapad može biti zaseban test.

Prazan slot nema bazu ni radnike. Predlog je da njegovo početno CODE polje ostane neutralna prilika za proširenje, ali u 1v1 to menja dostupnu ekonomiju i vreme osvajanja; mora biti izmereno, nije konačna odluka.

Svaki igrač ima sopstveni novčanik, limite i populaciju. Početna geometrija ne sme davati jednoj klasi drugačije udaljenosti. Slot boja nije potvrda pripadnosti OI/AI klasi.

## 15. Kamera, čitljivost i interfejs

Na korisnikovom snimku prototipa 0.1 mapa je premala u odnosu na interfejs. Nova početna kamera treba da bude bliže sopstvenoj bazi, tako da se mogu razlikovati radnik, Scout, CODE čvor i izlaz.

- „Cela mapa” ostaje poseban pregled i minimapa.
- Zoom ne menja brzinu simulacije, domet ili veličinu blokirajućeg otiska.
- Kampovi imaju razumljive T1/T2/T3 oznake i razlikuju se od prodavnica.
- Čistina za gradnju, zabranjeno postavljanje, rampa i šumski blokator moraju biti prepoznatljivi.
- Preview zgrade prikazuje važeće/nevažeće mesto i razlog odbijanja.
- Izabrana jedinica, ruta, domet i cilj imaju čitljive oznake koje ne prekrivaju celo bojište.

Detaljne koncept slike služe vizuelnoj obradi. Geometrija i logika ostaju u podacima/simulaciji, ne u pogađanju boje piksela slike.

## 16. Tehnički podaci mape

Predlog: jedna verzionisana definicija sadrži `mapId`, `mapVersion`, granice sveta, koordinatni sistem, startove, visine, blokatore, rampe, građevinske maske, no-build koridore, čvorove, kampove, prodavnice i označene buduće ciljeve.

Svaki objekat ima stabilan ID. Odvojiti originalnu definiciju od runtime stanja: preostali CODE, poginuli NPC, respawn tick, zauzetost zgradama i vizija nisu izmene originalne datoteke mape.

Navigacija mora računati veličinu jedinice i promene od gradnje/uništenja. Svi igrači koriste istu verziju geometrije. Server proverava putanju, gradnju i vidljivost; klijent ne određuje da li je zabranjena ćelija prohodna.

Početni projekat može ostati `index.html + script.js + style.css`; kasnije izdvojiti mapne podatke i simulaciju u module kada obim to zahteva. Ne duplirati koordinate u renderu i navigaciji tako da jedno prikazuje prolaz, a drugo zid.

## 17. Provere prihvatanja — NOT_RUN za novu mapu

| Provera | Kriterijum |
|---|---|
| Početni prostor | U svaku bazu staje isti referentni T1–T3 raspored uz prohodne izlaze |
| Rampe | P1–P4 imaju stvarnu vezu plato–put; P3/P4 pravilan smer |
| Ekonomska ravnopravnost | Iste početne naredbe u rotiranim startovima daju iste ili obrazloživo bliske isporuke |
| Put do proširenja | Meri se put i vreme radnika, ne samo udaljenost centara |
| Prodavnica i kampovi | Uporediva vremena dolaska Scouta i vojske iz sva četiri ugla |
| Alternativne rute | Jedna kula ili jedno blokirano raskršće ne zatvara sve puteve između protivnika |
| Veličina jedinica | Radnik, Čuvar i Razbijač prolaze kroz dozvoljene prolaze bez presecanja uglova |
| Grupno kretanje | Kolone se razilaze i ne ostaju trajno zaglavljene |
| Gradnja | Nema preklapanja, zarobljavanja graditelja ili zatvaranja zaštićenog koridora |
| Izlaz proizvodnje | Jedinica izlazi ili čeka bez duplikata i dodatnog troška |
| Jungle spawn | Svi NPC nastaju na slobodnim mestima; kamp može biti zaobiđen |
| Jungle reset | Gonjenje, povratak, respawn i doprinos imaju dosledan ishod |
| Vizija | Šuma/litice/rampe odgovaraju dokumentovanoj vidljivosti |
| T3 | Let, presretanje, utovar/iskrcavanje i dolazak na sidro rade na validnom terenu |
| 1v1/2v2 | Test obe dijagonale i timskih strana, sa promenom kontrolera i klasa |
| Kamera | Početna baza i jedinice čitljive; cela mapa dostupna bez promene simulacije |

Predlog geometrijskog kriterijuma: na rotaciono simetričnoj mapi automatski proveriti jednake dužine odgovarajućih ruta; tolerancija eventualne namerne asimetrije mora biti eksplicitno odobrena. Jednaka geometrija ne dokazuje jednakost svih strategija.

Meriti 60/180 s ekonomiju, prvo proširenje, prvi kontakt vojske, dolazak do prodavnice i vreme reakcije na napad. Vremena kontakta nisu obećana dok ne postoji konačna navigacija i brzine svih jedinica.

## 18. Trenutni dokaz i sledeći korak

Postojeći lokalni prototip 0.1 ima radničku ekonomiju i navigaciju kroz proceduralne šumske prepreke. Prethodno je prošao devet Node provera i browser provere; sve četiri baze u odvojenom testu od 180 simulacionih sekundi imale su 565 CODE. To je dokaz tog prototipa i rasporeda, ne ove predložene nove mape.

Redosled nove izrade:

1. Zaključiti logičku skalu i dimenzije objekata kao verziju kandidata.
2. Napraviti sivu/bojenu mapu sa stvarnim footprint-ima baza, rampama i putanjama.
3. Postaviti početni CODE, proširenja, kampove i prodavnice; proveriti geometriju četiri starta.
4. Dodati validaciju gradnje i velike jedinice kao geometrijske test objekte.
5. Proveriti ekonomiju, prolaze, kameru i lokalne sukobe, zatim doterivati WHR izgled.
6. Po rezultatima menjati kandidata; tek nakon provere dodavati složenije mehanike.

OPEN pre konačne mape: zalihe proširenja, tačne lokacije Svetilišta, centralna nagrada, visinska pravila, obnova/reset kampova u graničnim slučajevima, rezervisane građevinske zone i veličine svih jedinica.

**Merilo uspeha: igrač prepoznaje više smislenih odluka na istoj mapi, a ne samo lepšu pozadinu.**
