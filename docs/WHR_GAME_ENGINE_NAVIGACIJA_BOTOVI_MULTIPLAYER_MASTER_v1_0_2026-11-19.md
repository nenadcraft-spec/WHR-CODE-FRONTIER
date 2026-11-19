# WHR Game Engine — navigacija, botovi i multiplayer MASTER

Datum: 19.11.2026, Europe/Belgrade. OI: Beli Zec. Implementacija: Codex.

## Odluka i redosled

OI je testirao v0.4 i zatražio MASTER i početak sledećeg posla. Radimo redom: **kretanje/sudari → strateški botovi → multiplayer**. Ovaj kandidat v0.5 obuhvata prvu etapu. Botovi i mreža su naredne etape, nisu implementirani samo zato što su ovde opisani. Stabilna v0.4 kopija ostaje sačuvana.

## A — navigacija i lokalni saobraćaj

Mapa ostaje 160 × 160 ćelija, ćelija 16 render jedinica, simulacija 20 Hz. Radijus je fizički prostor, nezavisan od grafičkog zeca, selekcionog kruga ili zoom-a.

Kandidati iz Mapa MASTER-a: radnik i Scout 0,35 ćelije (5,6 render jedinica); pešadija 0,45 (7,2); Razbijač 1,2 (19,2). Heroji koriste 0,45, NPC 0,45 kao novi kandidati. OI proverava te veličine u igranju.

Zahtevi:

- Globalni A* proverava prostor za ceo krug jedinice u odnosu na granice, šumu, zgrade, temelje i aktivni CODE. Mala jedinica prolazi tamo gde velika fizički ne može. Nema dijagonalnog sečenja uglova.
- Geometrijski keš zavisi od maske prepreka i radijusa. Temelj, rušenje i iscrpljenje čvora moraju promeniti važeću navigaciju.
- Lokalno kretanje proverava put do sledeće pozicije, ne samo krajnju tačku. Nema prolaska kroz drugu jedinicu, preskakanja prepreka pri ubrzanom Scoutu ili nenamernog teleportovanja.
- Grupni nalog dobija različite slobodne dolazne tačke. ID redosled i izbor mesta su stabilni. To je raspored dolaska, ne gotov taktički sistem formacija.
- Lokalno zaobilaženje sme da menja put, ali ne vlasništvo, cilj napada, inventar, nalog radniku ili ekonomsku transakciju. Nepokretne jedinice ne teleportujemo da bismo glumili rešenu gužvu.
- Neprolazna gužva čeka; ne garantujemo savršeno rešavanje svih jednosmernih čepova. Zastoj mora biti vidljiv u dijagnostici. Naknadno dolaze koordinisano propuštanje i rezervacije uskih prolaza.
- Proizvodnja, obnova NPC-a i Povratni signal proveravaju radijus i slobodan dolazak. Kad nema mesta, čekaju bez nove naplate ili kopiranja jedinice.
- Pauza zamrzava simulaciju. Kamera/hotkeys ne menjaju položaj jedinica ni rezultate saobraćaja. Skriveni neprijatelj ne prikazuje se kroz HUD zato što učestvuje u fizičkoj proveri.

Provere: sintetički uski/široki prolaz, skretanje kod ugla, mešovita grupa, suprotni pravci, brz Scout, blokiran dolazak, zgrada/rušenje, proizvodnja velike jedinice, NPC i povratak; zatim ekonomija/gradnja/T2 i pravi browser input. Test beleži i granice, ne samo PASS.

## B — strateški botovi, zasebna naredna etapa

Prvo standardni red komandi sa tick/owner/sequence i proverom autoriteta. Čovek i bot koriste iste validatore za MOVE/ATTACK/BUILD/TRAIN/RESEARCH/ABILITY/ITEM. Bot čita samo sopstvene podatke i dozvoljenu viziju, ne skriveno stanje sveta. Slučajnost ima eksplicitni seed. Nema besplatnog CODE-a, instant gradnje ili zaobilaženja populacije.

Minimalni bot: održava ekonomiju, bira gradnju/proizvodnju, prelazi T2, izviđa, okuplja vojsku, bira kamp ili napad, povlači ranjene i obnavlja gubitke. Svaka odluka ima razlog u razvojnom dnevniku. Prvo jedan bot u lokalnom 1v1, zatim četiri kontrolera/2v2. OI/AI klasa nije isto što i čovek/bot kontroler.

Provere: ista pravila i ograničenja kao igrač; magla ne daje sveznanje; partija bez input-a ne zaglavi; seed ponavlja rezultat; jasno razdvojene težine i budžet odlučivanja.

## C — multiplayer, zasebna naredna etapa

Pre izbora lockstep-a ili autoritativnog servera uraditi merenu proveru ponovljivosti, serijalizacije stanja, broja komandi i ciljne latencije. Fiksni 20 Hz sam po sebi ne dokazuje mrežnu determinističnost između različitih računara.

Potrebni su server autoritet, dozvoljeni pogled po igraču, lobby 1v1/2v2, autentifikovan identitet/slot, redosled i odbacivanje duplih/zastarelih komandi, verzija protokola i pravila, snapshot/reconnect, timeout/disconnect politika, deljenje vizije tima, pobeda/poraz i dijagnostika neusaglašenog stanja. GitHub Pages može hostovati klijent; nije multiplayer server.

Testiranje: dva stvarna klijenta, kontrolisano kašnjenje/gubitak veze, nedozvoljene komande, ponovljene komande, reconnect, skriveno stanje i puni meč. Ne objavljivati da postoji multiplayer na osnovu jednog lokalnog taba.

## Status i dokazi

Etapa A: implementiran lokalni **v0.5 kandidat** na odvojenoj kopiji v0.4. B/C ostaju planirani. OI još nije odigrao ovu verziju; automatizovani rezultati nisu korisničko prihvatanje.

- `script.js`: geometrija radijusa, keširane maske, swept provere, lokalno zaobilaženje, grupna dolazna mesta, provera izlaza proizvodnje/teleporta i NPC pojave.
- `index.html`: malo dugme Radijusi; razvojni krugovi se crtaju u Canvas-u. Narandžast krug i kontekstualni tekst označavaju duže čekanje.
- `tests/navigation.cjs`: deset provera fizičke geometrije, dolaska i čekanja.
- `tests/navigation-browser.cjs`: testne jedinice u izdvojenoj kopiji odgovora JS-a; stvarna selekcija okvirom, grupni desni klik, razdvojeni dolasci i razvojni prekidač koji ne menja simulaciju.
- `tests/tier2-browser.cjs`: razvojna baza sa dovoljnim prostorom oko Radionice. Stari tesni testni raspored nije razlog da motor dozvoli pojavu Razbijača kroz prepreke.

### Rezultati izvršavanja — 19.11.2026.

| Provera | Rezultat |
|---|---|
| JS sintaksa | PASS |
| Ekonomija / navigacija iz prethodne verzije | 9 PASS |
| Gradnja / geometrija / četiri početne ekonomije | 11 PASS |
| T1/T2 sadržaj i negativni slučajevi | 31 PASS |
| Nova navigacija / lokalni saobraćaj | 10 PASS |
| Chromium HUD i hotkeys | PASS |
| Chromium gradnja / input | PASS |
| Chromium finansiran T2 tok | PASS |
| Chromium mešovita grupa i Radijusi | PASS |

Ukupno 61 Node provera i četiri browser scenarija. Finansirani T2 scenario i novi grupni scenario koriste testni prikaz 5 FPS, uz normalnu simulaciju 20 Hz. Ovo ne dokazuje FPS na svim računarima, online determinističnost ili odsustvo svih mogućih saobraćajnih zastoja.

### Konkretna politika prvog kandidata

Grupa raspoređuje najveće radijuse prvo, zatim stabilni leksikografski ID. Dolazna mesta imaju još 12 render jedinica razmaka za manevar. UI šalje jedan grupni nalog, umesto ranijih pojedinačnih naloga sa fiksnim 20 px razmakom. A* i lokalni saobraćaj koriste iste fizičke radijuse. Geometrijske maske se keširaju po nepromenjenom objektu maske prepreka; promena geometrije stvara novu masku. Ne menjati sadržaj postojeće maske bez poništavanja keša.

Lokalni solver koristi stabilne pokušaje skretanja i skraćivanje vidljivih međutačaka. Dinamički objekti blokiraju fizički korak; globalni A* ne tretira svaku pokretnu jedinicu kao trajni zid. Potpuno zatvoren cilj i tesni suprotni prolazi mogu čekati. Nema teleportovanja, ignorisanja radijusa ili prolaska kroz jedinicu da bi test izgledao uspešan. Početno nevažeća preklapanja iz spoljne/testne fixture mogu samo postepeno da se razdvoje; novi spawn/teleport proverava prostor.

Pre nastavka B proveriti sa OI gustu bazu, veće grupe, povlačenje, čuvanje prolaza, gužvu kod resursa i oba pravca kroz džunglu. Po potrebi slede koordinisano propuštanje i dinamičko preplaniranje; ne proglašavati svu navigaciju konačno rešenom.
