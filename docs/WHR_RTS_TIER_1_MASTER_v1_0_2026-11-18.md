# WHR RTS — TIER 1 MASTER

Verzija: 1.0  
Datum: 18.11.2026. (Europe/Belgrade)  
Projekat: WHR · CODE FRONTIER  
Arhitekta i konačna odluka: Beli Zec / OI  
Priprema specifikacije: Codex

## 1. Status i namena

Ovo je samostalna specifikacija Tier 1 sistema, nastala iz razgovora sa OI. Posle kompletnog predloga korisnik je odgovorio: „odlicno: napravi sad master MD”. Predlog je time prihvaćen za dokumentovanje kao početna osnova; brojke nisu dokazan niti konačno izbalansiran rezultat.

`T1_SPECIFICATION = DOCUMENTED`  
`OI_DIRECTION = ACCEPTED_FOR_MASTER`  
`BALANCE = CANDIDATE_001`  
`IMPLEMENTATION = NOT_RUN`  
`PLAYTEST = NOT_RUN`

Dokument služi za razvoj na GitHub-u i prenos kroz E: disk, ChatGPT radionicu i BIBLI. Ne tvrdi da je igra već napravljena, objavljena ili da multiplayer već radi.

Prateći dokument: `WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md`. Ovaj T1 MASTER precizira novije odluke. Za isti parametar novija T1 specifikacija ima prednost; stari MASTER se ne prepisuje.

## 2. Identitet igre i dogovorena osnova

- Originalni WHR RTS: SC2 i Warcraft kao inspiracija za ekonomiju, gradnju i upravljanje; Dota i LoL kao inspiracija za heroje, opremu i kontrolu mape.
- Dve klase: **OI** i **AI**. Klasa nije isto što i kontroler: čovek može igrati AI klasu, bot može igrati OI klasu.
- Prvi prototip koristi iste statistike obe klase uz različit izgled. Asimetrija se uvodi tek posebnom odlukom.
- Jedna mapa, četiri početne pozicije u uglovima, režimi **1v1** i **2v2**; ljudski, bot i mešoviti slotovi, uključujući bot protiv bota.
- Glavna baza: **Tier 1 → Tier 2 → Tier 3**.
- Jedini osnovni ekonomski resurs je **CODE**.
- Vizuelna mapa „WHR · CODE FRONTIER” postoji kao koncept slika. Prohodna geometrija i balans još nisu dokazani.

## 3. Start partije i ekonomija T1

| Parametar | Pravilo / početna vrednost |
|---|---|
| Glavna baza | Jedna završena WHR Centrala, Tier 1 |
| Radnici na startu | **3** |
| Limit radnika na T1 | **5 po igraču**, bez obzira na broj Centrala |
| Početni CODE | 100 |
| Tajmer | 00:00 na početku RUNNING stanja |
| Početna populacija | Kapacitet 10; tri radnika zauzimaju 3 |
| Maksimalni kapacitet na T1 | 20 |
| Početno CODE polje | 6 čvorova × 1.000 CODE = 6.000 CODE |
| Pasivni prihod | Nema |
| Upkeep | Isključen u ovom prototipu |

Početna tri radnika automatski dobijaju zadatak skupljanja, raspoređena na različite dostupne čvorove. Prvi prihod nastaje tek posle stvarnog rada i isporuke.

Radnik ponavlja: **odlazak → čekanje ako je potrebno → skupljanje → povratak → isporuka**. Standardni teret je 5 CODE, skupljanje traje 3 sekunde, a put i čekanje produžavaju ciklus. Jedan radnik aktivno skuplja na pojedinačnom čvoru; ostali putuju ili čekaju. Zaliha se troši pri vađenju, CODE ulazi u novčanik pri isporuci.

Na bogatom nalazištu početni predlog iz ekonomskog MASTER-a je 7 CODE po teretu uz isto vreme rada. Tačna lokacija i količina bogatih čvorova zahteva mapnu specifikaciju.

## 4. WHR Centrala — glavna baza

| Osobina | Vrednost |
|---|---:|
| Zdravlje | 1.500 HP |
| Vidokrug | 12 mapnih jedinica |
| Napad | Nema |
| Proizvodi | Radnika i Scouta |
| Red proizvodnje | Do 5 narudžbina; jedna se izvršava |
| Cena nove Centrale | 300 CODE |
| Gradnja nove Centrale | 60 s |
| Isporuka CODE-a | Svaka sopstvena završena Centrala |

Nova Centrala služi proširenju i bližoj isporuci; ne povećava limit od pet T1 radnika. Populacioni kapacitet dodatne Centrale nije posebno odobren i ostaje OPEN; ne dodavati ga automatski.

Objekti za prvi prototip nemaju oklopne modifikatore. Izgled baze i njenih T2/T3 formi razrađuje se zasebno.

## 5. Radnik — skupljanje, gradnja, popravka

| Osobina | Vrednost |
|---|---:|
| Cena | 50 CODE |
| Proizvodnja | 15 s |
| Zdravlje | 80 HP |
| Brzina | 3 mapne jedinice/s |
| Vidokrug | 7 |
| Populacija | 1 |
| Standardni teret | 5 CODE |
| Skupljanje tereta | 3 s + put/čekanje |
| Napad | 4 štete na 1,5 s, izbliza |

Jedan radnik gradi jedan objekat. Odlazak graditelja pauzira rad. Višegraditeljsko ubrzanje nije uključeno. Posle završetka vraća se na prethodno nalazište ako je cilj i dalje dostupan; inače traži važeći cilj ili postaje nezaposlen.

Popravka: **10 HP/s za 1 CODE/s** dok se zdravlje stvarno obnavlja. Jedan radnik istovremeno popravlja isti objekat. Ne naplaćivati popravku punog zdravlja; način obračuna delimične sekunde mora biti definisan bez besplatnog lečenja ili dvostruke naplate.

Radnik u izgradnji računa se prema limitu pri prihvatanju narudžbine kroz rezervaciju; centralizovana provera na nivou igrača treba da spreči zaobilaženje limita preko više baza. Ovo je zahtev za implementaciju limita, a ne povećanje dozvoljenog broja radnika.

Vizuelni koncept: zdepast beli zec, radno odelo, rudarski alat i ranac sa CODE kristalima. Slika je referenca, ne gotov animirani 3D model.

## 6. Scout — posebna jedinica

OI je razjasnio: **„scout je scout: posebna jedinica: i to je to”**.

Scout je izviđač, kupac i kurir za heroja. Ne pretvara se u heroja. Proizvodi se iz T1 Centrale i nije besplatna početna jedinica.

| Osobina | Vrednost |
|---|---:|
| Cena | 75 CODE |
| Proizvodnja | 20 s |
| Limit | 1 po igraču |
| Zdravlje | 100 HP |
| Osnovna brzina | 4 mapne jedinice/s |
| Vidokrug | 12 |
| Populacija | 1 |
| Inventar | 4 mesta |
| Napad | Nema |

Scout ne rudari, ne gradi i ne popravlja. Kupuje, preuzima, nosi i predaje ajteme. Predaja heroju zahteva udaljenost do 2 mapne jedinice.

Ako pogine, ajtemi padaju na zemlju i mogu se pokupiti. Novi Scout može se proizvesti u Centrali. Detalji prava podizanja, vidljivosti i životnog veka palih predmeta ostaju OPEN.

Vizuelni koncept: vitak beli zec, laka izviđačka oprema, skener, kurirske torbe i čizme. Bez uloge ili oznake heroja.

### 6.1. Scout čizme

| Nivo | Bonus osnovne brzine | Množilac | Brzina Scouta |
|---|---:|---:|---:|
| T1 | +20% | ×1,20 | 4,8 jedinica/s |
| T2 | +50% | ×1,50 | 6 jedinica/s |
| T3 | +100% | ×2,00 | 8 jedinica/s |

Upgrade zamenjuje prethodni bonus; procenti se ne sabiraju. Samo jedan par daje efekat. Čizme zauzimaju jedno mesto inventara i deluju samo na Scouta.

T1 cena je 75 CODE. Cena T2/T3 unapređenja, prodavnica koja ga obavlja i tačna pravila pristupa višem nivou tek se definišu. Ne zaključivati automatsko besplatno unapređenje kada baza dostigne sledeći Tier.

## 7. Prva borbena jedinica — Čuvar

| Osobina | Vrednost |
|---|---:|
| Cena | 60 CODE |
| Proizvodnja | 18 s |
| Zdravlje | 180 HP |
| Šteta | 12 |
| Interval napada | 1 s |
| Domet | 1,2 mapne jedinice, izbliza |
| Brzina | 3 jedinice/s |
| Vidokrug | 8 |
| Populacija | 2 |
| Proizvodni objekat | Kasarna |

Čuvar brani ekonomiju, prati Scouta i učestvuje u čišćenju slabih kampova. Prvi prototip koristi jednu vrstu štete, bez oklopa i nasumičnih kritičnih udaraca. Napadi su ograničeni dometom, vidljivošću cilja i intervalom napada.

## 8. T1 građevine

| Građevina | Cena CODE | Vreme gradnje | HP | Funkcija |
|---|---:|---:|---:|---|
| WHR Centrala | 300 | 60 s | 1.500 | Radnici, Scout, isporuka, Tier upgrade |
| Kasarna | 120 | 35 s | 800 | Proizvodnja Čuvara |
| CODE Relej | 60 | 20 s | 400 | +5 kapaciteta populacije |
| Stražarska kula | 100 | 30 s | 600 | Odbrana prilaza i ekonomije |

Relej dodaje kapacitet tek kada se završi; T1 kapacitet ne prelazi 20. Gubitak Releja smanjuje kapacitet. Ponašanje pri prekoračenju postojećim jedinicama ostaje implementaciono pravilo za razradu; jedinice se ne smeju neprimetno brisati.

Stražarska kula: **15 štete na 1,5 s**, domet 8, vidokrug 10. Napada neprijateljske jedinice, ne građevine. Limit: **2 kule po igraču na T1**.

Dimenzije objekata, pravila postavljanja, izlazne tačke, blokiranje puteva i prostor za jedinice još zahtevaju mapnu/tehničku specifikaciju. Sve cene proverava autoritativna simulacija.

## 9. Neutralne prodavnice i T1 oprema

Četiri neutralne prodavnice, ravnopravno dostupne početnim pozicijama. Ne mogu se uništiti. Kupovina zahteva jedinicu u udaljenosti do 2 mapne jedinice i dovoljno slobodnog inventara. CODE se skida sa računa njenog vlasnika.

| Ajtem | Cena CODE | Efekat | Početna zaliha po prodavnici | Obnova |
|---|---:|---|---:|---|
| Scout čizme T1 | 75 | +20% osnovne brzine, samo Scout | 1 | 90 s |
| Paket prve pomoći | 30 | 60 HP tokom 6 s; primljena šteta prekida efekat | 2 | 45 s po komadu |

Scout može dostaviti paket heroju ili Čuvaru. Čuvarov inventar ili poseban slot za potrošni predmet još nisu definisani; korišćenje paketa mora biti razrađeno pre implementacije, bez pretpostavke da već ima četiri Scout slota.

Zaliha se vodi po prodavnici kao zajedničko stanje. Raspored paralelnog ili serijskog obnavljanja više kupljenih paketa ostaje OPEN. Kupovina, promena zalihe i plaćanje moraju činiti jednu transakciju.

## 10. Heroj preko WHR Svetilišta

Predlog prihvaćen za ovu početnu specifikaciju:

1. Scout pronalazi i fizički posećuje neutralno **WHR Svetilište**.
2. Igrač plaća **200 CODE**.
3. Prizivanje traje **30 s**.
4. Heroj se pojavljuje kod sopstvene Centrale.
5. Limit je **jedan heroj po igraču**; Scout ostaje zasebna jedinica.

Heroj je time dostupan tokom T1, ali nije početna besplatna jedinica. Herojev naziv, HP, napadi, populacija, inventar, XP, moći, izbor Centrale i pravila smrti/ponovnog prizivanja ostaju OPEN. Lokacija i broj Svetilišta tek treba da se nacrtaju na igrivoj mapi.

## 11. Slabi T1 NPC kampovi

| Osobina | Vrednost |
|---|---|
| Sastav | 2 neutralna protivnika |
| Zdravlje pojedinca | 120 HP |
| Šteta pojedinca | 6 na 1,5 s |
| Nagrada celog kampa | 30 CODE |
| Primalac nagrade | Vlasnik jedinice koja porazi poslednjeg protivnika |
| Pojedinačne CODE nagrade | Nema |
| Respawn | Nema u prvom testu |

Nagradu evidentirati samo jednom. Pravila aggro/leash, brzina, domet, iskustvo i eventualni drop ajtema nisu određeni. Kampovi su dodatni eksplicitni izvor CODE-a i moraju biti uključeni u ekonomski bilans.

## 12. Prelazak sa T1 na T2

| Uslov | Vrednost |
|---|---|
| Preduslovi | Završena Kasarna + završen CODE Relej |
| Cena | 300 CODE |
| Trajanje | 60 s |
| Proizvodnja Centrale | Pauzirana tokom unapređenja |
| Isporuka CODE-a | Radi normalno |
| Aktiviranje T2 sadržaja | Po završetku unapređenja |

Otvoreno: da li upgrade važi za igrača ili pojedinačnu Centralu, kako se red ponaša ako već proizvodi jedinicu i kakav je status druge baze. Pre izrade multiplayer-a to mora dobiti jednoznačno pravilo. T2 limit radnika i ostali sadržaji nisu definisani ovim dokumentom.

## 13. Vreme i autoritet simulacije

Zadržava se predlog iz ekonomskog MASTER-a: **20 Hz**, tick od 50 ms, standardna brzina 1×. Sve navedene sekunde znače sekunde simulacije.

- Kretanje, rad, popravka, proizvodnja, gradnja, prizivanje, obnova prodavnice i intervali napada koriste isti sat.
- Tajmer napreduje samo tokom RUNNING. Pauza zaustavlja sve ove sisteme.
- Broj renderovanih frejmova ne određuje ekonomiju; 30 i 144 FPS ne smeju menjati ishod istog niza simulacionih tick-ova.
- Server u multiplayer-u proverava vlasništvo, stanje, CODE, zalihe, limite i komande. Klijent ne dodeljuje sam sebi novac ili jedinice.
- Čovek i bot koriste ista pravila i interfejs komandi, bez besplatnog CODE-a.
- Cena se plaća pri prihvatanju narudžbine. Aktivna obuka je jedna po proizvodnoj traci.
- Nezapočet posao pri otkazivanju vraća 100%; započet 75%, zaokruženo nadole. Uništenje nema refund.

Primer: radnik 15 s = 300 tick-ova; Scout 20 s = 400; Čuvar 18 s = 360; T2 upgrade 60 s = 1.200. Ove vrednosti su aritmetičke konverzije, ne dokaz implementacije.

## 14. Mapa, vidljivost, timovi i poraz

- Magla rata uključena. Istražen teren ostaje poznat, a neprijateljske jedinice prikazuju se samo uz trenutno viđenje.
- Jednake početne zalihe, prohodne udaljenosti i prostor za gradnju moraju biti izmereni; vizuelna simetrija nije dovoljan dokaz.
- Svaki igrač ima sopstveni CODE račun, radnike, populaciju i limite. Timski novčanik i transferi nisu uvedeni.
- Predlog iz prethodnog MASTER-a: 1v1 suprotni uglovi; 2v2 sever protiv juga. To još zahteva test mapne ravnopravnosti.
- Predlog poraza: igrač gubi kada ostane bez svih Centrala i svih radnika. U 2v2 tim gubi kada oba igrača budu poražena.

Otvoreni slučajevi pravila poraza: Centrala u izgradnji, poslednji radnik koji je započeo gradnju, heroji/vojska poraženog igrača i trajno blokiran razvoj kada nema CODE-a za obnovu. Ovo su stvarne granice trenutnog predloga, ne već rešena ponašanja.

## 15. Brze kontrolne računice

- Posle kupovine još dva radnika: 100 − 2 × 50 = **0 CODE**, ukupno 5 radnika kada se obuka završi. Tokom obuke rudarski prihod može promeniti stanje.
- Scout i njegove T1 čizme zajedno: 75 + 75 = **150 CODE**.
- Kasarna + dva Čuvara: 120 + 2 × 60 = **240 CODE**, uz odvojena vremena gradnje i obuke.
- Pet radnika + Scout + dva Čuvara troše **10 populacije**.
- Kasarna + Relej + T2 upgrade koštaju ukupno **480 CODE**, bez vojske, Scouta i dodatnih radnika.
- Prizivanje heroja nije isto što i proizvodnja Scouta: zaseban trošak **200 CODE / 30 s**.

Računice služe proveri doslednosti tabela. Ne predviđaju tačan build order ili vreme napada dok se ne implementiraju putanje, čekanje i simulacija.

## 16. Provere pre prvog igrivog izdanja

Sve navedene provere trenutno imaju status **NOT_RUN**.

| Provera | Kriterijum |
|---|---|
| Start | Svaki igrač dobija T1, 3 radnika, 100 CODE i kapacitet 10 |
| Radnički limit | Više Centrala i istovremene komande ne dopuštaju šestog T1 radnika |
| Scout limit | Najviše jedan živ ili rezervisan Scout po igraču |
| Ekonomija | Jedan teret se vadi i isporučuje jednom; nema negativnih zaliha |
| Proizvodnja | CODE naplaćen jednom, trajanje koristi simulacioni sat |
| Populacija | Narudžbine ne zaobilaze kapacitet preko paralelnih objekata |
| Popravka | Nema besplatne delimične popravke ni naplate punog HP-a |
| Čizme | Brzine 4,8 / 6 / 8; bez slaganja bonusa više pari |
| Kurir | Ajtem se premešta, ne kopira; smrt pravilno ispušta inventar |
| Prodavnica | Kupci ne mogu istovremeno kupiti isti poslednji komad |
| Kamp | Jednokratna nagrada 30 CODE, bez pojedinačnog dupliranja |
| T2 | Preduslovi, 300 CODE, 60 s; isporuke ostaju aktivne |
| Render i mreža | Isti simulacioni tok daje isti obračun bez obzira na FPS klijenta |
| Mapa | Ekvivalentni početni uslovi daju ekvivalentnu ekonomiju |
| Poraz | Granični slučajevi dobijaju dokumentovan i proverljiv ishod |

## 17. Sledeći korak

Pre kompletne implementacije razrešiti OPEN stavke, naročito Tier autoritet, inventar Čuvara/heroja, redove i rezervacije populacije, obnovu prodavnica i uslove poraza.

Prva vertikalna igriva celina: **sat → tri radnika → CODE → kupovina radnika/Scouta → limit pet → Kasarna → Čuvar → prodavnica i kurirska dostava**. Zatim herojevo prizivanje i T2 prelaz, uz merenje ekonomije i testiranje mape.

OI vodi arhitekturu i potvrđuje izmene. Codex implementira, proverava i izveštava. Dokumentovanje ne zamenjuje playtest.
