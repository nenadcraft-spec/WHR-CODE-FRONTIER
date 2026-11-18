# WHR RTS — TIER 2 MASTER

Verzija: 1.0  
Datum: 18.11.2026. (Europe/Belgrade)  
Projekat: WHR · CODE FRONTIER  
Arhitekta i konačna odluka: Beli Zec / OI  
Priprema specifikacije: Codex

## 1. Status, poreklo i namena

Ovaj dokument čuva kompletan T2 predlog iz razgovora, posle korisnikovog odgovora: „odlicno: napravi master MD tier 2:”. To je prihvaćena osnova za dokumentovanje i prototip, a ne dokaz testiranog ili konačnog balansa.

`T2_SPECIFICATION = DOCUMENTED`  
`OI_DIRECTION = ACCEPTED_FOR_MASTER`  
`BALANCE = CANDIDATE_001`  
`IMPLEMENTATION = NOT_RUN`  
`PLAYTEST = NOT_RUN`

Namena: GitHub razvoj, lokalni E: rad i prenos kroz ChatGPT radionicu/BIBLI. Ovim upisom nije promenjen kod igre niti je bilo šta objavljeno na GitHub-u.

Povezani dokumenti:

- `WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md`
- `WHR_RTS_TIER_1_MASTER_v1_0_2026-11-18.md`

T2 MASTER nadograđuje T1 i eksplicitno razrešava igrački autoritet Tier-a. Ne menja originalne prethodne dokumente. OPEN označava pravila ili brojke koje još nemamo; ne popunjavati ih tvrdnjom da su već dogovoreni.

## 2. Cilj Tier 2

T2 omogućava širenje ekonomije, specijalizovanu vojsku i razvoj jednog heroja. Igrač bira ulaganje u radnike, podršku, opsadu, istraživanja ili opremu; nije obavezno kupiti sve.

Ostaje: jedan CODE resurs, jedna mapa sa četiri početne pozicije, 1v1/2v2, klase OI/AI odvojene od kontrolera čovek/bot. Za prvi prototip klase imaju iste statistike. Scout ostaje posebna jedinica: izviđač, kupac i kurir, bez pretvaranja u heroja.

## 3. Ulazak u T2 i obim tehnologije

Ulazak zadržava T1 uslove: završena Kasarna i CODE Relej, **300 CODE**, **60 s** unapređenja Centrale. Proizvodnja te Centrale miruje tokom unapređenja, isporuke CODE-a rade. Tačna arbitraža već započete obuke i reda ostaje OPEN.

**Tier je tehnološki nivo celog igrača.** Jedno završeno T2 unapređenje otključava T2 sadržaj u svim njegovim bazama. Gubitak unapređene baze ne briše već naučenu tehnologiju. Otključavanje nije isto što i besplatno unapređenje HP-a svake Centrale: statistike dodatnih baza i njihov pojedinačni vizuelni nivo moraju se posebno definisati.

Otključavanje sadržaja važi tek pri završetku unapređenja; tokom njegovog trajanja ostaju T1 pravila. Istovremene narudžbine u više baza ne smeju dvostruko naplatiti isti globalni tehnološki nivo.

## 4. WHR Komandni centar i ekonomija

| Osobina | T2 vrednost |
|---|---|
| Glavna unapređena baza | WHR Komandni centar |
| Maksimalno zdravlje | 2.000 HP |
| Prelaz zdravlja | Zadržava procenat trenutnog HP-a |
| Limit radnika | **8 po igraču** |
| Maksimalni kapacitet populacije | **40**, uz izgrađene Releje |
| Scout limit | 1 po igraču |
| Heroj limit | 1 po igraču |

Primer HP prelaza: Centrala sa 750/1.500 HP postaje 1.000/2.000 HP. Ovo nije potpuno besplatno izlečenje do maksimuma.

Kapacitet 40 je gornja granica, ne automatsko trenutno povećanje. CODE Relej i dalje košta 60 CODE, gradi se 20 s i dodaje 5 kapaciteta kada se završi, do trenutnog Tier maksimuma. Zadržavaju se postojeće jedinice i radnici; prelaz na T2 ne stvara nove besplatno.

Osnovni transportni ciklus i konačne zalihe ostaju iz ekonomskog MASTER-a. Nema pasivnog prihoda niti upkeep-a u ovom prototipu. Cene i obuka radnika ostaju T1 vrednosti: **50 CODE / 15 s**. Trošak radnika u populaciji ostaje 1.

## 5. Heroji — izbor jednog

Heroj može da bude prizvan već tokom T1: Scout mora posetiti WHR Svetilište, cena je **200 CODE**, vreme **30 s**, pojava kod sopstvene Centrale. T2 ne daje drugog heroja niti drugi besplatan izbor.

| Heroj | Uloga | Osnovna sposobnost | Dodatna T2 sposobnost |
|---|---|---|---|
| **BASTION** | Odbrana i prva linija | Privremeni lični štit | Zaštitna zona za obližnje saveznike |
| **PULSAR** | Šteta i pritisak | Usmereni energetski udar | Udar po manjoj površini |
| **EHO** | Podrška i kontrola | Lečenje jednog saveznika | Polje koje usporava neprijatelje |

Zajednička pravila:

- **Jedan heroj po igraču**, sa 6 mesta u inventaru i cenom 4 populacije.
- Iskustvo dolazi iz borbe; samo proticanje vremena ne stvara XP.
- T2 otključava dodatnu sposobnost, ne automatski nivo ili punjenje svih resursa.
- Scout kupuje i prenosi opremu heroju; uslov predaje ostaje udaljenost do 2 mapne jedinice.
- Heroji i nazivi su deo predloga; nisu potvrđeni gotovi modeli ili kod.

OPEN: osnovni HP, brzina, napad, vidokrug, XP tabela, maksimalni nivo, radijus deljenja XP-a, mana ili drugi trošak sposobnosti, cooldown, domet, jačina i trajanje efekata. Bez ovih podataka heroji još nisu kompletno implementabilne borbene jedinice.

## 6. WHR Oltar i oživljavanje

Oltar je sopstvena T2 građevina za povratak poginulog heroja; WHR Svetilište na mapi ostaje neutralni objekat prvog prizivanja.

| Osobina | Vrednost |
|---|---:|
| Cena Oltara | 150 CODE |
| Gradnja | 35 s |
| Zdravlje | 800 HP |
| Cena oživljavanja | 100 CODE |
| Trajanje oživljavanja | 45 s |

Vraća se isti heroj sa sačuvanim nivoom. Smrt i ispadanje herojevih ajtema nisu odlučeni; ne preuzimati automatski Scout pravilo za heroja. OPEN su i mesto pojave, HP/mana pri povratku, rezervisanje populacije, otkazivanje, uništenje Oltara tokom procesa i mogućnost više Oltara. Limit jednog heroja mora obuhvatiti žive, prizivane i oživljavane primerke.

## 7. Jedinice i uloge

T1 Čuvar ostaje dostupan bez obaveznog istraživanja. Novi sastav dodaje distancu, lečenje i opsadu.

| Jedinica | Cena CODE | Obuka | HP | Populacija | Uloga |
|---|---:|---:|---:|---:|---|
| **Čuvar** | 60 | 18 s | 180 | 2 | T1 bliska borba, ostaje dostupan |
| **Strelac** | 90 | 22 s | 120 | 2 | Napad sa distance |
| **Bolničar** | 110 | 25 s | 100 | 2 | Lečenje i podrška |
| **Razbijač** | 160 | 35 s | 300 | 4 | Opsada građevina |

### 7.1. Strelac

Proizvodi se u Kasarni kada je završena Akademija. Napad: **14 štete na 1,4 s**, domet **6 mapnih jedinica**. Njegov osnovni nominalni DPS je 10 pre prekida, kretanja i nedostupnosti mete. Brzina kretanja, vidokrug i validne vrste meta ostaju OPEN.

### 7.2. Bolničar

Proizvodi se u Stanici podrške. Leči **8 HP/s** jednoj obližnjoj jedinici i nema napad. Više Bolničara ne može zajedno lečiti istu metu. Ako meta primi štetu, lečenje se prekida.

OPEN: domet, brzina, izbor mete, da li uključuje sebe ili savezničke igrače, mana/trošak i vreme posle primljene štete pre dozvoljenog nastavka. Bez definisanog prozora prekida simulacija ne sme odmah ponovo pokretati lečenje i tako obesmisliti pravilo.

### 7.3. Razbijač

Proizvodi se u Radionici. Napad na **2,5 s**: **40 štete građevinama**, **10 jedinicama**. Nominalno 16 DPS protiv građevina, 4 protiv jedinica. Jedan pogodak koristi odgovarajuću vrednost, ne obe.

Razbijač je spor i zahteva pratnju. Precizna brzina, vidokrug, domet, vreme projektila i izbor meta ostaju OPEN. Nisu uvedeni automatski splash, letenje, oklop ili posebna imunost.

## 8. T2 građevine

| Građevina | Cena CODE | Gradnja | HP | Funkcija |
|---|---:|---:|---:|---|
| **Akademija** | 180 | 45 s | 900 | Istraživanja i otključavanje Strelca u Kasarni |
| **Stanica podrške** | 150 | 40 s | 700 | Proizvodi Bolničare |
| **Radionica** | 220 | 50 s | 1.000 | Proizvodi Razbijače |
| **WHR Oltar** | 150 | 35 s | 800 | Oživljava heroja |

Gradnja koristi radnika i zajednički sat kao u T1. Novi objekti nisu besplatni pri završetku T2. Dimenzije, izlazne tačke, redovi i eventualni dodatni preduslovi ostaju za tehničku razradu. T1 građevine i njihove postojeće funkcije ostaju dostupne; T2 ne ukida limit kula automatski.

## 9. Akademija — istraživanja

| Istraživanje | Cena CODE | Trajanje | Efekat |
|---|---:|---:|---|
| **Efikasni alati** | 120 | 40 s | Skupljanje tereta traje **2,5 s**, umesto 3 s |
| **Ojačani Čuvari** | 100 | 30 s | +30 maksimalnog HP-a Čuvaru |
| **Izviđačka optika** | 100 | 30 s | +2 vidokruga Scouta |

Efekat počinje po završetku istraživanja. Efikasni alati ne povećavaju teret i ne menjaju brzinu putovanja; ne obećavaju isti procenat povećanja isporučenog CODE-a na svakoj mapi. Optika podiže Scout vidokrug sa 12 na 14, a maksimalni HP ojačanog Čuvara je 210.

OPEN: broj paralelnih istraživanja, ponašanje više Akademija, primena na postojeće jedinice, prelaz trenutnog HP-a Čuvara i već započetog ciklusa rudarenja. Pre implementacije definisati globalni nivo svakog istraživanja i sprečiti duplu kupovinu istog efekta.

## 10. T2 ajtemi

Prodavnice ostaju neutralni objekti na mapi. Kupovina zahteva domet i dovoljno CODE-a, slobodno mesto i pravo korišćenja predmeta.

| Ajtem | Cena CODE | Efekat / korisnik |
|---|---:|---|
| **Scout čizme T2** | **100 za upgrade postojećih T1 čizama** | Ukupno +50% osnovne brzine, samo Scout |
| **Kurirska torba** | 100 | Scout dobija +2 mesta; torba zauzima jedno |
| **Herojske čizme** | 100 | +15% osnovne brzine heroja |
| **Vitalni kristal** | 120 | +100 maksimalnog HP-a heroja |
| **Povratni signal** | 60 | Potrošni predmet: Scout kanališe 4 s, pa se vraća kod sopstvene Centrale; šteta prekida |

### 10.1. Brzina i inventar

- Scout osnovno ide 4 jedinice/s; T1 čizme daju 4,8; T2 daju **6**; planirani T3 nivo daje 8.
- T2 bonus od +50% zamenjuje T1 +20%; nije dodatak preko njega.
- Par T2 čizama ukupno je plaćen 75 + 100 = **175 CODE** kroz oba nivoa. Direktna kupovina T2 čizama bez T1 nije definisana.
- Bonusi istog ajtema se ne slažu. Dupliranje torbi ne sme neograničeno širiti inventar.
- Kurirska torba podiže kapacitet sa 4 na **6 mesta**, ali sama koristi jedno: sa samo torbom ostaje 5 slobodnih, sa torbom i čizmama ostaje 4.
- Vađenje torbe pri prepunom inventaru, prodaja i prebacivanje torbe ostaju OPEN; ne brisati predmete da bi se kapacitet tiho smanjio.
- Herojske čizme i Vitalni kristal deluju na heroja, ne na Scouta koji ih samo prenosi.
- Način promene trenutnog HP-a pri stavljanju/skidanju Vitalnog kristala ostaje OPEN i ne sme omogućiti beskonačno lečenje premeštanjem.

### 10.2. Povratni signal i prodajna pravila

Povratni signal ne prenosi heroja niti vojsku. Tačna izborna Centrala, trenutak potrošnje predmeta, posledica prekida, cooldown i ponašanje pri uništenju odredišta ostaju OPEN. Teleport sme završiti samo na važećoj prohodnoj lokaciji.

Zalihe i vremena obnove T2 predmeta nisu određeni. Ne prepisivati automatski T1 stock pravila na sve nove ajteme. Povraćaj novca/prodaja predmeta takođe nisu određeni.

## 11. Mapa i T2 kampovi

T2 vojska lakše osigurava bogata CODE nalazišta i jače NPC lokacije. To nije automatsko vlasništvo ili besplatan prihod: radnici moraju stići, raditi i isporučivati.

Predlog srednjeg kampa:

- Jednokratna nagrada **60 CODE**.
- **Jedan unapred definisan ajtem**, bez nasumičnog plena u prvom testu.
- Sastav, HP, napadi, XP, predmet i pravila pripisivanja nagrade ostaju OPEN.
- Respawn srednjeg kampa nije definisan; ne tvrditi da je pravilo već isto kao za T1 kamp.

CODE nagrade i stvoreni ajtemi evidentiraju se kao eksplicitni događaji. Osvajanje centra i otvorenih nalazišta mora biti ispitano za oba režima i sve startne pozicije.

## 12. Put ka Tier 3

| Uslov | Predlog |
|---|---|
| Trenutna tehnologija | Završen T2 |
| Preduslovi | Završena Akademija i Radionica |
| Cena | **600 CODE** |
| Vreme | **90 s** |

Ovo je prelazni T3 kandidat, ne kompletna T3 specifikacija. Njegov efekat na bazu, proizvodnju, limite i sadržaj T3 tek se definiše. Predlog Scout čizama T3 od +100% već je poznat, ali cena nije.

## 13. Simulacija, mreža i zajednička pravila

Predlog sata ostaje **20 Hz**, jedan tick = 50 ms. Sve sekunde u tabelama znače simulaciono vreme. Autoritativni multiplayer server obračunava stanje; FPS klijenta ne menja brzinu rada ili štetu.

| Događaj | Vreme | Tick-ovi pri 20 Hz |
|---|---:|---:|
| Efikasno skupljanje | 2,5 s | 50 |
| Strelčev interval | 1,4 s | 28 |
| Razbijačev interval | 2,5 s | 50 |
| Strelac — obuka | 22 s | 440 |
| Bolničar — obuka | 25 s | 500 |
| Razbijač — obuka | 35 s | 700 |
| Oživljavanje heroja | 45 s | 900 |
| Povratni signal | 4 s | 80 |
| T3 upgrade | 90 s | 1.800 |

To su proverljive konverzije, ne rezultati runtime testa. Lečenje/HP i potrošnju tokom vremena treba obračunati definisanom preciznošću; ne zaokruživati svaki mali tick nadole i tako izgubiti ceo efekat.

Zadržati validaciju komandi, vlasništva, distance, uslova i sredstava; rezervacije populacije; nedupliranje commandId; jedno plaćanje i jedan završetak po poslu. Ljudi i botovi koriste ista pravila. Fiksni tick sam po sebi ne dokazuje mrežnu sinhronizaciju ili deterministički replay.

## 14. Kontrolne računice i balansni rizici

- Tri nove proizvodno/istraživačke građevine: Akademija + Stanica podrške + Radionica = **550 CODE**; sa Oltarom ukupno **700 CODE**.
- Sva tri istraživanja = **320 CODE**.
- Strelac + Bolničar + Razbijač = **360 CODE** i **8 populacije**.
- Osam radnika + Scout + heroj = **13 populacije**. Početni kapacitet 10 zato nije dovoljan bez Releja, iako je T2 maksimum 40.
- T1 tri radnika dopuniti do T2 osam košta 5 × 50 = **250 CODE**, bez uračunatog prihoda tokom obuke.
- Akademija + Radionica + T3 prelaz = **1.000 CODE** ako se kreće bez te dve građevine; sam T3 prelaz ostaje 600.
- Skraćenje rada sa 3 na 2,5 s povećava teorijski plafon vađenja pojedinačnog standardnog čvora sa 100 na 120 CODE/min, ako je stalno zauzet. Stvarni prihod ostaje zavisan od transporta i zasićenja.

Rizici za playtest: odnos opsade i odbrane, lečenje tokom prekidane borbe, brz Scout sa teleporterom, trajna tehnologija posle gubitka baze, rast ekonomije sa osam radnika i cena prvog heroja. Ne proglašavati balans prema tabelama bez partija.

## 15. Plan provera — svi testovi NOT_RUN

| Provera | Kriterijum |
|---|---|
| T2 ulazak | 300 CODE, preduslovi i 60 s provereni; otključavanje jednom |
| Globalni Tier | Sadržaj dostupan svim sopstvenim bazama; gubitak jedne ne briše tehnologiju |
| HP prelaz | Oštećena baza zadržava procenat zdravlja |
| Limiti | Najviše 8 T2 radnika i jedan Scout; populacija ne prelazi raspoloživi kapacitet |
| Releji | Kapacitet raste stvarnom gradnjom, do 40, bez besplatnog skoka |
| Strelac | 14 štete, 1,4 s interval, domet 6 |
| Bolničar | Jedna meta, bez slaganja lečenja; smislen prekid po šteti |
| Razbijač | Različita šteta građevinama/jedinicama bez dupliranja |
| Istraživanja | Cena jednom; efekti nisu kupljeni ili primenjeni dvostruko |
| Scout čizme | T2 brzina 6, bez sabiranja sa T1 |
| Torba | Kapacitet i zauzeće mesta dosledni; predmeti se ne gube pri promeni |
| Heroj | Limit obuhvata prizivanje i oživljavanje; XP i nivo sačuvani po pravilima |
| Oltar | 100 CODE / 45 s, bez dvostrukog heroja |
| Povratni signal | Kanalisanje, prekid i validna lokacija povratka |
| Kamp | 60 CODE i tačno jedan definisani ajtem, nagrada jednom |
| Mreža i FPS | Autoritativni obračun ostaje isti pri različitim brzinama renderovanja |
| T3 granica | 600 CODE / 90 s uz Akademiju i Radionicu; sadržaj tek po završetku |

## 16. Sledeći korak

Razrešiti otvorene borbene statistike i herojski sistem, zatim napraviti izolovane implementacione korake nad stabilnim T1 prototipom: globalni T2, limiti, Akademija, Strelac, podrška, opsada, predmeti i Oltar.

Ne širiti broj sistema pre nego što ekonomija, inventar i simulacioni sat daju merljiv i dosledan rezultat. Sve promene balansa čuvati sa verzijom pravila i rezultatima testova.
