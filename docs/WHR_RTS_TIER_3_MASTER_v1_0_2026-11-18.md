# WHR RTS — TIER 3 MASTER

Verzija: 1.0  
Datum: 18.11.2026. (Europe/Belgrade)  
Projekat: WHR · CODE FRONTIER  
Arhitekta i konačna odluka: Beli Zec / OI  
Priprema specifikacije: Codex

## 1. Status i namena

Dokument čuva T3 predlog iz razgovora: leteće jedinice, transport i teleportacija, nevidljive jedinice i odbrana od njih. Korisnik je nakon predloga i koncept slike zatražio: „odlicno... napravi sad master MD tier 3:”. Pravila su osnova za prototip; brojke nisu potvrđene playtestom.

`T3_SPECIFICATION = DOCUMENTED`  
`OI_DIRECTION = ACCEPTED_FOR_MASTER`  
`BALANCE = CANDIDATE_001`  
`IMPLEMENTATION = NOT_RUN`  
`PLAYTEST = NOT_RUN`

Prateći dokumenti:

- `WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_1_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_2_MASTER_v1_0_2026-11-18.md`

T3 MASTER ne prepisuje prethodne fajlove. Novije promene označene su izričito, naročito protivvazdušna odbrana dostupna već na T2. OPEN označava nedefinisano pravilo, a ne dozvolu da se proizvoljna vrednost predstavi kao dogovorena.

Ovim dokumentom nije napravljen ili objavljen kod igre. Generisana slika T3 je vizuelna referenca, ne gotov model sa animacijama ili dokaz funkcionalnosti.

## 2. Cilj T3 i trajna pravila

T3 donosi nove pravce napada i transporta: prelet terena, prebacivanje vojske i prikriveni pritisak. Protivnik mora imati priliku da izviđa, presretne i odbrani te poteze.

Ostaju dve klase OI i AI sa jednakom statističkom osnovom u prvom prototipu. Čovek ili bot je kontroler, nezavisno od klase. Igra ima jedan CODE resurs, četiri početne pozicije, 1v1 i 2v2. Scout ostaje izviđač, kupac i kurir, a ne postaje Senka, transporter ili heroj.

## 3. Ulazak u Tier 3

| Uslov | Pravilo |
|---|---|
| Trenutna tehnologija | Završen T2 |
| Preduslovi | Završena Akademija i Radionica |
| Cena | **600 CODE** |
| Trajanje | **90 s** |
| Aktivacija T3 sadržaja | Tek po završetku unapređenja |

Zadržava se T2 princip: Tier je tehnološki nivo celog igrača. Gubitak unapređene baze ne briše naučenu tehnologiju. Ponovljene komande ili više baza ne smeju proizvesti duplu naplatu istog globalnog unapređenja.

OPEN: izgled/naziv T3 Centrale, maksimalni i trenutni HP pri prelazu, obim nadogradnje dodatnih Centrala, ponašanje proizvodnog reda i isporuka tokom T3 procesa. T2 pravilo o pauziranju proizvodnje ne proglašavati automatski potvrđenim T3 pravilom.

## 4. Ekonomija i limiti

| Parametar | T3 vrednost |
|---|---|
| Limit radnika | **12 po igraču** |
| Maksimalni kapacitet populacije | **60**, uz Releje |
| Scout limit | 1 po igraču |
| Heroj limit | 1 po igraču |
| Teleport sidra | Najviše 2 po igraču |
| Osnovni resurs | CODE |

Prelaz ne stvara besplatne radnike niti trenutno popunjava kapacitet do 60. CODE Relej nastavlja da dodaje po 5 stvarno izgrađenog kapaciteta, do aktuelne gornje granice. Cene radnika ostaju 50 CODE / 15 s dok se posebno ne promene.

Zadržavaju se zalihe čvorova i radnički transportni ciklus. Efikasni alati iz T2, ako su istraženi, ostaju aktivni. Nema uvedenog pasivnog prihoda ili upkeep-a. Jedinica koja preleti nalazište ne dobija njegov CODE bez rada radnika.

## 5. Jedinice — pregled

| Jedinica | Cena CODE | Obuka | HP | Populacija | Kretanje | Uloga |
|---|---:|---:|---:|---:|---|---|
| **NEBESKI ČUVAR** | 180 | 35 s | 220 | 3 | Vazduh | Borba protiv kopna i vazduha |
| **MOSTONOŠA** | 220 | 40 s | 300 | 4 | Vazduh | Prevoz kopnenih jedinica i teleport skok |
| **SENKA** | 150 | 30 s | 120 | 2 | Kopno | Prikriveni izviđač i napadač |

Brzine kretanja i vidokrug ove tri jedinice još nisu zadati. Visina leta na slici ne predstavlja definisanu mehaniku. Za prvi prototip ne uvoditi neodobrene dodatke poput vazdušnog goriva, automatskog splash-a ili drugog resursa.

## 6. Nebeski Čuvar

| Osobina | Pravilo |
|---|---|
| Proizvodnja | Vazdušna luka |
| Šteta | **18** |
| Interval napada | **1,5 s** |
| Domet | **5 mapnih jedinica** |
| Mete | Kopnene i vazdušne |
| Kretanje | Preleće šume, vodu i litice |

Nominalni DPS je 12 pre kretanja, prekida i nedostupnosti mete. Osvajanje prostora zahteva viziju i borbu; let ne daje pogled kroz celu mapu.

Vizuelni koncept: kompaktna leteća borbena platforma, beli zec pilot, mehanička krila i cyan CODE pogon, navy/zlatna oplata. Koncept nije potvrda preciznog naoružanja ili raketne mehanike.

OPEN: da li skup kopnenih meta uključuje građevine, trajanje projektila, način okretanja, vazdušno izbegavanje sudara i granice letenja iznad oboda mape.

## 7. Mostonoša — transport

| Osobina | Pravilo |
|---|---|
| Proizvodnja | Vazdušna luka |
| Napad | Nema |
| Teretni kapacitet | **6 populacije kopnenih jedinica** |
| Utovar/iskrcavanje | Miruje iznad prohodnog terena |
| Uništenje transportera | Gube se i ukrcane jedinice |

Kapacitet se meri populacijom, ne brojem modela. Primeri koji staju: tri Čuvara (3 × 2), heroj i jedan Čuvar (4 + 2), ili Razbijač i Strelac (4 + 2), ako konačna pravila dozvoljenih putnika dopuštaju taj tip kopnene jedinice.

Ukrcavanje ne uklanja vlasništvo ili populacioni trošak putnika. Mostonoša sa teretom od 6 populacije zauzima ukupno 10 populacije zajedno sa putnicima. Letelice i druge Mostonoše ne spadaju u kopneni teret.

OPEN: domet i trajanje utovara, red ukrcavanja, dozvola za savezničke jedinice, poseban tretman heroja i opsade, radnici sa cargo CODE-om, dejstvo putnika iz transportera i inventar poginulih putnika. Ne zaključivati automatski da putnici napadaju iz kabine ili da bezbedno padaju na tlo.

Za iskrcavanje pronaći stvarno prohodna mesta uz proveru prostora za svaku jedinicu. Ne brisati preostale putnike ako nema mesta. Uništenje transportera mora jednim događajem obraditi i putnike bez dvostruke smrti ili duplih nagrada.

Vizuelni koncept: veći neoružani leteći transporter, utovarna rampa, mesta za putnike i ugrađeni teleport prsten. Naslov na koncept slici nije dodatna borbena sposobnost.

## 8. Mostonoša — teleport skok

| Parametar | Pravilo |
|---|---|
| Prenosi | Mostonošu i njene trenutne putnike |
| Odredište | Sopstveno završeno **Teleport sidro** |
| Priprema | **5 s** |
| Cena | **40 CODE** |
| Obnavljanje sposobnosti | **60 s** |
| Primljena šteta | Prekida pripremu |
| Proizvoljna pozicija u magli | Nije dozvoljeno odredište |

Skok ne prenosi okolnu vojsku koja nije ukrcana. Sidro je eksplicitno odredište i mora biti važeće pri završetku. Teleport nije automatska pobeda nad blokiranim prostorom: dolazna lokacija transportera mora biti validna.

OPEN pre implementacije: da li cooldown kreće na početku ili uspehu, trenutak skidanja CODE-a, refund po prekidu, cooldown po prekidu, ponašanje kada igrač izda move/stop, da li šteta znači HP ili i štit, uslov trenutne vidljivosti odredišta i posledica uništenja sidra tokom pripreme. Ne obećavati besplatno ili naplaćeno otkazivanje bez odluke.

Server potvrđuje vlasnika, stanje sidra, cenu, cooldown i završetak. Ponovljena mrežna poruka ne sme dvaput naplatiti ili izvršiti skok. Putnici ostaju isti entiteti, ne prave se njihove kopije na odredištu.

## 9. Senka — nevidljivost i napad

| Osobina | Pravilo |
|---|---|
| Proizvodnja | Centar prikrivanja |
| Nevidljivost | Aktivna i pri kretanju |
| Sopstveni/saveznički pogled | Jedinica je vidljiva vlasniku i saveznicima |
| Napad | **20 štete na 2 s**, izbliza |
| Mete | Samo kopnene jedinice |
| Otkrivanje pri napadu | **3 s** |
| Detektori | Otkrivaju i kada ne napada |
| Kupovina i kurirska dostava | Nema |

Nominalni DPS je 10. Napad iz nevidljivosti nije automatski kritični udar. Nije uvedena posebna šteta protiv radnika ili heroja. Građevine nisu dozvoljene mete po ovoj specifikaciji.

Predlog tehničkog modela za razradu: odvojiti `cloaked`, `revealedUntilTick` i detekciju konkretnog posmatrača. Novo napadanje mora obnavljati otkrivanje, umesto da dozvoli treperenje nevidljivosti tokom stalne borbe. Tačan trenutak početka trosekundnog otkrivanja, ponašanje pri dobijenoj šteti i interakcija sa površinskim efektima ostaju OPEN.

Nevidljiva neprijateljska jedinica ne sme biti normalno selektabilna ili primati ciljani napad bez odgovarajućeg otkrivanja. Potrebno je posebno odlučiti pravila sudara, zvuka, projektila i neciljane štete; skrivanje modela na klijentu samo po sebi nije kompletan stealth sistem.

Vizuelni koncept: vitak beli zec u tamnoj lakoj opremi, ljubičasti vizir, kratka energetska sečiva i delimično providan efekat. Providnost na referentnoj slici nije obaveza da neprijatelj vidi siluetu.

## 10. Građevine i detekcija

| Građevina / unapređenje | Cena CODE | Vreme | HP | Funkcija |
|---|---:|---:|---|---|
| **Vazdušna luka** | 250 | 55 s | OPEN | Nebeski Čuvar i Mostonoša |
| **Centar prikrivanja** | 200 | 45 s | OPEN | Proizvodi Senke |
| **Teleport sidro** | 150 | 35 s | **500** | Odredište teleport skoka, limit 2 po igraču |
| **Detektorski modul kule** | 75 | 20 s | Koristi postojeću kulu; zaseban HP nije zadat | Detekcija u dometu **8** |

Detektor otkriva nevidljive mete samo uz trenutno viđenje te oblasti. Detekcija ne uklanja maglu rata i ne znači automatski napad ili dodatnu štetu. Da li saveznici dele otkriveni cilj zavisi od budućeg timskog vision pravila.

OPEN: minimalni Tier za Detektorski modul, preduslovi novih građevina pored samog T3, njihove dimenzije/izlazi, stock redovi proizvodnje, mogućnost pomeranja/rastavljanja sidra i limiti drugih građevina. T1 limit od dve kule nije automatski ukinut ovim dokumentom.

## 11. Izričita izmena T2 protivvazdušne odbrane

T3 predlog uvodi sledeću dopunu ranijeg T2 plana:

**Strelac i Stražarska kula mogu da napadaju vazdušne mete već na T2.**

Time igrač ne mora da završi sopstveni T3 da bi imao kontru protivničkoj letelici. Osnovne postojeće brojke ostaju, dok se posebno ne promene:

- Strelac: 14 štete na 1,4 s, domet 6.
- Stražarska kula: 15 štete na 1,5 s, domet 8; i dalje ne napada građevine.

Cena i istraživanje za ovo otključavanje nisu uvedeni; ne dodavati ih tiho. Precizno označiti T2 air-target pristup u budućoj verziji T2 specifikacije ili implementacionom dnevniku. Za sada stari T2 dokument ostaje original, a ova dopuna je eksplicitno zapisana ovde.

Detekcija i protivvazdušni napad su različite funkcije: kula može imati pravo napada na vazduh, a da nema Detektorski modul.

## 12. Scout čizme T3

| Nivo | Ukupni bonus osnovne brzine | Brzina Scouta |
|---|---:|---:|
| Bez čizama | 0% | 4 jedinice/s |
| T1 | +20% | 4,8 jedinica/s |
| T2 | +50% | 6 jedinica/s |
| **T3** | **+100%** | **8 jedinica/s** |

Predlog cene prelaska sa T2 na T3: **150 CODE**. Ukupan put od kupljenih T1 čizama košta 75 + 100 + 150 = **325 CODE**.

T3 zamenjuje prethodni efekat; ne daje dodatnih 100% preko T2 bonusa i ne slaže se sa drugim parom. Ostaje jedan predmet/inventarsko mesto i Scout-only efekat. Direktna kupovina T3 bez prethodnih nivoa, lokacija unapređenja, stock i vreme obnove prodavnice ostaju OPEN.

## 13. Vreme, mreža i kontinuitet stanja

Zadržava se predlog zajedničkog sata: **20 Hz**, tick 50 ms. Sve vrednosti označene sekundama mere vreme simulacije. Render FPS nije izvor prihoda ili brzine napada.

| Događaj | Sekunde | Tick-ovi |
|---|---:|---:|
| T3 unapređenje | 90 | 1.800 |
| Nebeski Čuvar — obuka | 35 | 700 |
| Mostonoša — obuka | 40 | 800 |
| Senka — obuka | 30 | 600 |
| Nebeski Čuvar — interval napada | 1,5 | 30 |
| Senka — interval napada | 2 | 40 |
| Otkrivanje Senke | 3 | 60 |
| Priprema teleport skoka | 5 | 100 |
| Cooldown skoka | 60 | 1.200 |
| Detektorski modul | 20 | 400 |

Konverzije su aritmetika specifikacije; nisu runtime testovi. Server autoritativno proverava komande, limite, resurse, ciljeve, vidljivost, cargo i destinacije. Bot i čovek koriste iste mehanike.

Save/replay mora sačuvati putnike, cooldown, kanalisanje, preostalo otkrivanje i veze sa sidrima. Pri teleportu ili ukrcavanju ne sme nastati duplirani inventar, CODE cargo ili jedinica. Skriveni neprijateljski podaci moraju imati mrežno pravilo pristupa; nije dovoljno samo ne nacrtati model.

## 14. Kontrolne računice i balansni rizici

- Vazdušna luka + prvi Nebeski Čuvar = **430 CODE**, bez cene T3 prelaza.
- Vazdušna luka + Mostonoša + jedno sidro = **620 CODE**. Jedan uspešan plaćeni skok dodatno troši 40, ukupno 660, bez prethodnog T3.
- Centar prikrivanja + prva Senka = **350 CODE**.
- Dva Teleport sidra = **300 CODE** i dve potencijalne destinacije.
- Dva Detektorska modula = **150 CODE**, bez cene samih kula.
- Mostonoša i tri Čuvara = 4 + 3 × 2 = **10 populacije**, i posle ukrcavanja.
- Dvanaest radnika + Scout + jedan heroj = 12 + 1 + 4 = **17 populacije**, pre vojske i transportera.

Rizici za test: zaštita radnika od ranog vazdušnog napada, dostupnost detekcije, prevelika efikasnost nevidljivog harassa, rizik gubitka putnika, teleport pod vatrom, blokiranje sidra, agresivno postavljanje sidara i rast ekonomije sa dvanaest radnika. Brojke na papiru nisu dokaz ravnopravnosti.

## 15. Provere pre igrivog T3 — sve NOT_RUN

| Provera | Kriterijum |
|---|---|
| Ulazak u T3 | T2, Akademija, Radionica, 600 CODE, 90 s; aktivacija jednom |
| Limiti | Najviše 12 radnika; kapacitet raste Relejima do 60 |
| Vazduh | Let prelazi dozvoljeni teren, bez izlaska iz mape i bez besplatne vizije |
| Protivvazdušna kontra | T2 Strelac i kula pravilno napadaju letelice |
| Transport | Kapacitet 6 populacije; jedinstveno vlasništvo i stanje putnika |
| Iskrcavanje | Važeći slobodan teren, bez zaglavljivanja ili brisanja jedinica |
| Smrt transportera | Putnici obrađeni jednom, bez kopija i duplih nagrada |
| Teleport | 5 s, 40 CODE, 60 s cooldown po konačnom pravilu; sopstveno završeno sidro |
| Prekid skoka | Šteta, stop ili gubitak sidra daju dokumentovan ishod |
| Sidra | Limit dva; rezervacije pri paralelnoj gradnji ne zaobilaze limit |
| Senka | Kretanje u nevidljivosti; napad otkriva 3 s; samo kopnene jedinice kao mete |
| Detekcija | Otkriva u dometu 8 uz viziju; nema viđenja cele mape |
| Čizme | Brzina 8, upgrade 150 CODE, bez sabiranja prethodnih bonusa |
| Mreža | Duplirane komande ne stvaraju duple skokove, putnike ili plaćanja |
| Save/replay | Teret, efekti i rokovi preživljavaju čuvanje/učitavanje |
| Balans | Test oba režima, oba izbora klase i svih ravnopravnih startnih položaja |

## 16. Sledeći korak

Pre implementacije zatvoriti OPEN parametre koji utiču na borbu i ekonomiju: brzine/vidokrug, pravila putnika i teleport naplate/prekida, HP građevina, dostupnost detekcije i statistike T3 baze.

Zatim razvijati po funkcionalnim celinama: vazdušno kretanje i ciljanje → T2 protivvazdušna odbrana → utovar/iskrcavanje → teleport → cloak/detekcija → inventarski upgrade. Meriti rezultat u igrivoj simulaciji i verzionisati svaku promenu balansa.

Dokumentovanje T3 završava ovaj početni opis nivoa, a ne razvoj ili dokaz balansa cele WHR igre. OI vodi konačne odluke.
