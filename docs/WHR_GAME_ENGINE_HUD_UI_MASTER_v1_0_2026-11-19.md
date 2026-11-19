# WHR Game Engine — HUD, UI, hotkeys i testiranje MASTER

Verzija: 1.0 · Datum: 19.11.2026, Europe/Belgrade

Status: ISTRAŽIVANJE + SPECIFIKACIJA KANDIDATA. Nije potvrda gotovog HUD-a niti korisnički odobren dizajn.

OI: Nenad / Beli Zec. Implementacija i dokumentovanje: Codex. Projekat: WHR CODE FRONTIER / WHR Game Engine.

> Implementaciona dopuna 19.11.2026: [Prototip 0.3](PROTOTYPE_0_3.md) uvodi kompaktan HUD i mapiranje kamera prečica. Donji izvorni nalazi i statusi opisuju istraživačku fazu; aktuelne implementirane funkcije i browser provere navedene su u dopuni. OI playtest ostaje otvoren.

## 1. Razlog i obavezujući smer

OI je odbacio veliki naslovni pojas, prenaglašenu tipografiju, stalne natpise i velike donje panele iz prototipa. Mapa i upravljanje su izgubili prostor. Ova primedba je dokaz problema u stvarnoj upotrebi, a ne stvar ukusa koju AI može sam da proglasi rešenom.

**Bojište dobija prvenstvo. HUD prikazuje informacije potrebne za sledeću odluku, na stalnim i predvidivim mestima.** Manji HUD ne znači nečitljive brojeve ili sitne mete za klik. Ne menjamo igru samo da bismo dobili novu verziju. Prototip služi postepenoj proveri.

OI je dodatno naglasio: HUD je važan za budućnost motora, hotkeys/makro su deo upravljanja, a **skok kamere je naročito bitan**. Naknadno je precizirao: ako jedinicu veže za F1, **svaki pojedinačni pritisak F1 odmah skače kamerom na njen trenutni položaj**. To je zahtev OI, a ne neobavezni primer iz drugih igara.

## 2. Šta je istraženo i gde su granice dokaza

| Oznaka | Izvor / pregled | Šta podržava | Ograničenje |
|---|---|---|---|
| S1 | SC2 kadar koji je OI poslao u ovom razgovoru | Kompaktan prikaz resursa pri vrhu; minimapa dole levo; selekcija/proizvodnja dole; komande dole desno; najveći deo kadra pripada svetu | Vizuelno opažanje tog kadra, bez merenja originalnog UI-ja i bez pokretanja SC2 |
| S2 | Blizzard WC3: Hot Keys and Special Commands | Hotkeys u tooltipu, idle-worker indikator iznad minimape, grupe, dvostruki pritisak za kameru, povratak na baze, heroji i poslednji događaji | Klasični WC3 vodič; ne tvrdi se da WHR ima te funkcije ili da svi WC3 klijenti imaju isti raspored |
| S3 | Godot: debugger panel, pregled debugging alata i profiler | Pauza/koraci, inspekcija živog projekta, odvojeno merenje performansi | Pročitano kroz GitHits istraživanje zvaničnog repozitorijuma, uz fiksirane izvorne linkove |
| S4 | Jakob Nielsen / NNGroup: 10 Usability Heuristics | Vidljivo stanje, doslednost, prepoznavanje, kratke prečice, sprečavanje grešaka i uklanjanje nebitnih informacija | Opšti principi, ne gotova RTS specifikacija |
| S5 | W3C: WCAG 2.2, Understanding 2.5.8 | Mete za pokazivač, CSS pikseli, razmak i minimum 24×24 uz navedene izuzetke | Minimum pristupačnosti nije automatski dobra dimenzija za RTS; nije urađena WCAG revizija igre |
| S6 | Lokalni index.html, script.js, ui.part, style.css i PROTOTYPE_0_2.md | Stvarne komande i prikaz postojećeg WHR prototipa | Statički pregled; nova funkcionalna ili korisnička provera nije urađena za ovaj MASTER |
| S7 | OI screenshot sa crvenim oznakama i direktne primedbe | Konkretan razlog promene i prioritet mape | Ne određuje sam po sebi konačne dimenzije ili kompletnu tipografiju |

Zvanični WC3 indeks i stranica za prečice uspešno su pročitani preko interneta. Pretpostavljene putanje interface.shtml i controls.shtml vratile su stranicu „Document Not Found” čak i uz HTTP 200; nisu korišćene kao dokaz. SC2 /game vratio je 404, a naslovna stranica nije dala čitljiv vodič. Zato se SC2 poređenje ovde oslanja na S1, a ne na izmišljen zvanični tekst.

## 3. UI, HUD i razvojni alati

- UI: sve interakcije — meni, podešavanja, lobby, HUD, razvojni paneli.
- HUD: informacije i kontrole tokom igranja, uz bojište: CODE, populacija, sat, minimapa, selekcija, red proizvodnje, kontekstualne komande i kratki događaji.
- Razvojni UI: alati za proveru motora. Uključuju se po potrebi i ne opterećuju običnu partiju.

Igrač i razvojni operater mogu biti ista osoba, ali različit zadatak zahteva različit prikaz. Skidanje panela ne sme menjati simulaciju. Promena kamere ne sme promeniti izabranu grupu ili dati naredbu jedinici.

## 4. Pouke iz referenci

### SC2 — vizuelna organizacija iz priloženog kadra

Resursi su lako dostupni pogledom, bez naslovne ploče preko ekrana. Donja selekcija vezuje identitet objekta za njegov proizvodni red. Komandni panel pripada izabranom objektu. Minimapa daje strateški položaj, dok glavna kamera služi lokalnim radnjama. Ne preuzimamo tuđe grafičke assete ili dimenzije bez provere; koristimo organizacione obrasce.

### WC3 — organizacija upravljanja iz zvaničnog vodiča

S2 izričito opisuje hotkeys na komandnim dugmadima, izbor neaktivnih radnika, kontrolne grupe Ctrl+0–9, izbor grupe brojem i dvostruki pritisak za centriranje. Backspace obilazi glavne baze; F1–F3 biraju heroje, a ponovni pritisak pomera kameru. Space vraća kameru na poslednji događaj. To je dokaz kako kamera i makro mogu biti povezani sa HUD-om.

**Sukob sa WHR:** u prototipu Space već pauzira igru. Ne kopiramo WC3 Space ponašanje tako da iznenada promeni postojeću komandu. Inventar, heroji, podgrupe i borbeni događaji još ne postoje u runtime-u.

### Razvojni alati — Godot

Debugger prikazuje izvršavanje i stanje; profiler meri utrošeno vreme. U WHR-u predlažemo iste razdvojene namene. Korak od jednog WHR simulacionog tick-a nije isto što i Godot Step Into/Over jedne linije koda. FPS nije simulacioni Hz; prosečno vreme nije p95; nepostojeće merenje prikazujemo kao „nema podatka”.

## 5. Pregled stvarnog WHR stanja

Pregledani lokalni JS: fiksni korak 20 Hz; radnici, Scout, ekonomija, proizvodni red, gradnja, selekcija, kamera, minimapa, zoom i read-only WHR.snapshot(). Detalje pravila čuva PROTOTYPE_0_2.md. Nema implementirane borbe, heroja, inventara, fog-of-war-a ili mrežne partije.

| Akcija | Sada u prototipu | Potreba HUD-a |
|---|---|---|
| Selekcija | Levi klik / prevlačenje; Escape prazni izbor van gradnje | Jasna oznaka u svetu, ime/broj izabranih, vlasništvo |
| Kretanje / CODE / nastavak gradnje | Kontekstualni desni klik | Marker cilja i razumljiv rezultat ili razlog odbijanja |
| Radnik / Scout | W / S uz sopstvenu Centralu | Cena, trajanje, red i razlog nedostupnosti |
| Skupljanje / stop | G / H | Samo relevantnim jedinicama; stop ne sme izgledati kao globalna pauza |
| Kasarna / Relej / Centrala | B / R / C preko radnika | Izbor građevine, footprint preview, cena i zabrana gradnje |
| Otkazivanje gradilišta | X | Posebno odustajanje od preview-a i posebno refund stvarne gradnje |
| Kamera | Strelice, zoom, Baza, Cela mapa, klik minimape | Sačuvana selekcija; vidljiv okvir kamere na minimapi |
| Pauza | Space / dugme, lokalni poligon | Jedno malo jasno stanje PAUZA; nije online protokol |
| Reset | Dugme vraća na početni izbor | Zaštita od slučajnog gubitka partije: predlog menija/potvrde |
| Grupe / lokacije / skok na selekciju | Nije pronađena implementacija u pregledanom JS | Predlog, obavezno buduće testiranje |

Nađeno u updateHUD(): svih osam komandnih dugmadi ostaje u DOM prikazu, a menja se disabled stanje. Nerelevantne komande nisu kontekstualno sklonjene. Razlozi poput manjka CODE-a i globalnog limita uglavnom se saznaju nakon pokušaja kupovine, jer enabled uslov proverava selekciju/pauzu. To otežava planiranje.

**Napomena o radnoj kopiji:** lokalni index.html i style.css već sadrže raniji pokušaj kompaktnijeg rasporeda od screenshot-a. JS i dalje ima navedeni obrazac. Taj pokušaj nije ovim dokumentom proglašen usvojenim ili verifikovanim HUD-om. Ovaj zadatak ne menja te tri datoteke.

## 6. Prioritet informacija

| Stalno | Kada postoji kontekst | Na zahtev |
|---|---|---|
| Svet, CODE, populacija, sat, minimapa i meni | Selekcija, proizvodnja, gradnja, idle radnici, ograničenje, pauza, upozorenje | Objašnjenje komande, detaljni prihodi, statistike, kontrole, razvojni panel |

Brend i verzija pripadaju meniju / naslovnom ekranu / informacijama o buildu. Ne pravimo stalne naslove „SELEKCIJA” i „KOMANDNI STO” ako sam sadržaj već jasno govori čemu služi. Bez ogromnog praznog panela kada nema izabranog objekta.

CODE novčanik je prioritet. Teret radnika nije novac dok nije isporučen. „+75 / 25 s” mora biti jasno kumulativna isporuka u tom intervalu, a ne trenutna stopa. Predlog: detalj prihoda u tooltipu/panelu ekonomije, bez pogrešnog prebacivanja jedinica u istom neobjašnjenom broju. Odvojiti završene radnike od radnika u redu; populaciju od globalnog limita radnika.

## 7. Skica rasporeda A — kandidat za desktop

Prateći fajl: WHR_GAME_ENGINE_HUD_WIREFRAME_A_v1_0.svg. Skica nije screenshot implementacije.

```text
+------------------------------------------------------------------+
| [Baza] [Cela mapa]                CODE 100  Pop 3/10  00:00 [Meni] |
|                                                                  |
|                                                                  |
|                    GLAVNI POGLED NA SVET                          |
|                   lokalna kamera / gradnja                       |
|                                                                  |
| kratki događaji                         preview uz pokazivač       |
| [idle 1]                                                         |
| +----------+ +-----------------------+             +-------------+ |
| | minimapa | | selekcija / red        |             | kontekst    | |
| | + kamera | | samo potrebni podaci   |             | komande     | |
| +----------+ +-----------------------+             +-------------+ |
+------------------------------------------------------------------+
```

HUD blokovi plutaju uz ivice; ostatak između blokova pripada svetu. Prozirna pozadina ne znači da panel ne zaklanja ili da klik treba da prođe kroz njega. Samo stvarni interaktivni blokovi hvataju input. Klik na HUD ne izdaje world komandu.

Predlog veličina u CSS pikselima, ne univerzalna činjenica iz SC2/WC3:

| Blok | 1920×1080 kandidat | 1366×768 kandidat | Pravilo |
|---|---:|---:|---|
| Resursi / sat / meni | 520×36 | 500×36 | Bez pune naslovne trake |
| Minimapa sa okvirom | 176×196 | 160×180 | Kvadratni crtež, bez deformacije |
| Selekcija + kratki red | 360×144 | 300×132 | Duži red skroluje unutar bloka |
| Komande, 4×3 mesta | 204×160 | 196×156 | Stalni slotovi, relevantan podskup |
| Dugme komande | 44×44 | 44×44 | Razmaci i tooltip; ne smanjivati tekst bez provere |
| Osnovni broj / labela | 14–16 / 12–14 | 14–16 / 12–14 | Kandidat, proveriti čitljivost |

Unija stalnih interaktivnih/zaklanjajućih HUD pravougaonika treba da ostavi najmanje 80% nezaklonjene površine desktop viewport-a u običnom režimu. To je početni budžet za proveru, ne dokaz dobre upotrebljivosti. Sama površina canvas-a nije taj pokazatelj. Tooltipi, otvoren meni i developer režim mere se zasebno.

Skica pokazuje raspored, ne konačan skin. Minimap zoom, skaliranje HUD-a i veća pristupačna veličina moraju moći da nadjačaju početni budžet. Na 1280×720 proveriti preklapanja; 390px mobilni ekran nije samo sabijen desktop i nije još usvojen borbeni input.

**Važno za mapu:** fit cele kvadratne mape na širokom ekranu prirodno ostavlja bočni prostor. Ne rastezati svet da se popuni širina. Početni lokalni zoom mora pokazati radnike i građevinski prostor, a minimapa strateški raspored. Veliki canvas sa presitnim jedinicama i dalje je loš rezultat.

## 8. Selekcija i kontekst komandi

| Stanje | Vidljiv sadržaj | Komande |
|---|---|---|
| Nema selekcije | Nema velike prazne kartice | Samo globalna kamera/meni |
| Sopstvena završena Centrala | HP, identitet, red/progres/čekanje izlaza | W Radnik, S Scout; troškovi i globalni limiti |
| Sopstveni radnik / radnici | Broj, HP, teret, zadatak | G, H, B, R, C u stalnim slotovima |
| Sopstveni Scout | HP i zadatak | Stop; kretanje desnim klikom; bez lažnih shop/inventar dugmadi |
| Mešana grupa | Broj i zastupljeni tipovi | Zajedničke akcije; za gradnju jasan izbor graditelja, bez tihog proizvoljnog trošenja |
| Nezavršena sopstvena građevina | Napredak, radnik/čeka, preostali rad | X sa tačnim refund-om |
| Završen Relej / Kasarna | HP i postojeća funkcija | Bez neimplementirane vojne proizvodnje |
| CODE čvor | Preostala količina | Informacija; desni klik radnikom izdaje zadatak |
| Tuđ objekat | Dozvoljeni podaci | Bez sopstvenih ekonomskih komandi; budući fog ograničava znanje |

Razlikovati **nepripadajuću akciju** (nije ponuđena za taj objekat), **privremeno nedostupnu** (slot ostaje, razlog je dostupan) i **akciju u toku** (progres/queue). Relevantna komanda ne sme skakati na drugi slot kada postane disabled. Dugme može pokazati kratko ime, ikonu i hotkey; tooltip prikazuje pun naziv, cenu, trajanje i uslov. Ne oslanjati se samo na boju ili samo na hover.

## 9. Hotkeys, makro i skok kamere

Makro: ekonomija, proizvodnja, zalihe/populacija, razvoj i raspored pažnje po mapi. Mikro: lokalno upravljanje jedinicama i borbom. U oba slučaja prečica mora odgovarati istoj proveri pravila kao klik. Automatizovani višestruki skriptovani potezi nisu ono što ovde nazivamo makro veštinom.

### Kamera — prioritetna naredna sposobnost, još neimplementirana

1. **Usvojena semantika direktnog skoka:** mapirana jedinica na F1 → jedan pritisak F1 odmah centrirа kameru na tu jedinicu, svaki put. Nije potreban dvostruki pritisak. WC3 dvostruki pritisak je samo referenca i ne zamenjuje ovaj zahtev. Eventualna odvojena akcija „samo izaberi grupu” mora imati posebno vezivanje.
2. Keymap je podesiv: svaki binding čuva taster/modifikatore, vrstu akcije i stabilni entity ID ili grupu. Predlog načina dodele je izbor jedinice → podešavanje prečice → F1 → potvrda; dodatni brzi assign hotkey tek posle provere sukoba. Ctrl+1…9 za dodelu grupa je kandidat, ne jedini način mapiranja. Shift dodavanje i pravilo mešanih objekata rešiti pre implementacije.
3. **Slobodno mapiranje po OI zahtevu:** lokacije, zgrade i jedinice mogu da se vežu na taster koji korisnik odabere. Podržati i proveriti prvenstveno 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 i F1, F2, F3, F4. Taster nije unapred rezervisan samo za jednu vrstu cilja: npr. 1 → Centrala, 2 → Scout, 3 → lokacija džungle, F1 → radnik. Jedan pritisak aktivira direktni skok. Raniji F5–F8 predlog nije ograničenje niti usvojena šema. Browser/OS mogu presresti pojedine tastere; podršku proveriti u ciljnom klijentu i omogućiti alternativno vezivanje.
4. „Idi na selekciju” centriranje bez novog order-a. Za raštrkanu grupu fokus na stabilnog primarnog člana, ne na prazan geometrijski prosek; prikazati broj grupe i položaj ostalih na minimapi.
5. „Prethodna kamera” vraća prethodni položaj/zoom; poseban mali istorijat za eksplicitne skokove, ne beležiti svaki frame pomeranja.
6. **Jedinica nije fiksna koordinata:** binding na F1 prati entity ID, a položaj čita pri pritisku. Sačuvana lokacija čuva koordinate/zoom i druga je akcija. Skok na jedinicu sam po sebi ne menja selekciju niti aktivira stalno praćenje kamere; to su odvojene opcije. Ako cilj više ne postoji: kratko „Mapirana jedinica više nije dostupna”, bez skoka na proizvoljan objekat. Budući fog/spectator i vlasništvo ograničavaju dozvoljene mete.

7. Dugme Baza ostaje; buduća komanda „sledeća Centrala” obilazi završene sopstvene Centrale stabilnim redom.
8. Klik idle indikatora bira i fokusira neaktivnog radnika; ponavljanje ciklično prolazi kroz njih. Neaktivan nije radnik koji kopa, vraća teret ili gradi.
9. Budući događaj „gradnja završena / napad” može imati klik za skok na lokaciju. Ne pomerati kameru automatski zbog svake obaveštenosti.

Skok mora sačuvati selekciju osim kada akcija izričito bira objekat, sačuvati zoom za lokacione skokove prema dogovorenom pravilu, ograničiti kameru na svet i ažurirati minimap okvir. Ne sme naplatiti resurs, zaustaviti radnika ili promeniti nalog. Direktan skok je podrazumevani kandidat; eventualni kratak prelaz mora imati opciju isključivanja. Bez dugog leta kamere kroz mapu.

**Input sukobi:** Space ostaje postojeća pauza do posebne odluke. R je već Relej, C Centrala, B Kasarna, S Scout. Nove prečice ne smeju preuzeti te tastere neprimetno. Fokus u input/select/text polju blokira game hotkeys. Browser Ctrl+W, Ctrl+R, Alt+Left i slične sistemske kombinacije izbegavati. Prikaz u tooltip-u mora dolaziti iz aktivnog keymap-a. F1 u browseru može otvoriti pomoć: handler treba da spreči podrazumevanu akciju kada je binding aktivan i fokus pripada igri. To proveriti u ciljanom browseru; ne obećavati da aplikacija može presresti svaki OS taster. Držanje F1 ne sme proizvoditi nekontrolisano ponavljanje. Escape briše nedovršeno mapiranje, a duplikat binding-a traži jasnu zamenu ili drugo vezivanje.

### Slobodno mapiranje ciljeva — preciziranje OI

| Vrsta cilja | Šta se vezuje | Jedan pritisak na izabrani hotkey |
|---|---|---|
| Lokacija | Koordinate na mapi; politika čuvanja zoom-a mora biti jasno prikazana | Skok na sačuvanu lokaciju |
| Zgrada | Stabilni ID konkretne zgrade | Skok na tu zgradu |
| Jedinica | Stabilni ID konkretne jedinice | Skok na njen trenutni položaj |
| Grupa, kao proširenje | Lista stabilnih ID-jeva i stabilni primarni član | Skok prema dogovorenom pravilu fokusa grupe |

Isti podesivi sistem prihvata ciljeve različitih vrsta. Slobodno mapiranje ne znači da ista tipka u istom aktivnom kontekstu sme neprimetno izvršiti više različitih radnji. Ako korisnik mapira B na zgradu, a B već služi za Kasarnu, editor keymap-a mora pokazati sukob i ponuditi eksplicitnu zamenu ili drugo vezivanje. Prikazati listu dodela, omogućiti promenu i uklanjanje, a nedostupne sistemske kombinacije objasniti pre potvrde. OI sam bira raspored; primeri 1–0 / F1–F4 ne zaključavaju buduće tastere.

Način dodele i čuvanje podešavanja preko restarta još treba precizirati/implementirati. Lokacije i ID-jevi objekata pripadaju konkretnoj partiji; posle nove partije stare objekte ne sme povezati sa slučajno ponovo iskorišćenim ID-jem. Profil tastera i aktivne mete partije moraju se razlikovati.

Dodatne provere: mapirati lokaciju na 1, zgradu na 0 i pokretnu jedinicu na F4; svaki put jedan pritisak daje odgovarajući skok. Zameniti ciljeve između istih tastera i proveriti da stara veza više ne radi. Proveriti svih deset brojeva i F1–F4, fokus polja za unos, duplikat, nedostupan cilj i novu partiju. Status: PENDING — zahtev je dokumentovan, funkcija još nije implementirana.

### Makro podrška po fazama

Prvo: jasan proizvodni red, stanje populacije, broj radnika + naručeni, skok na bazu i neaktivnog radnika. Zatim: grupe proizvodnih objekata, lokacije kamere i događaji. Tek uz stvarnu implementaciju: rally point, Shift red komandi, heroji/inventar i složenije podgrupe. Ne crtati dugmad koja glume gotovu funkciju.

## 10. Gradnja, greške i povratna informacija

- B/R/C bira preview; lokalni prikaz otiska pokazuje dozvolu i kratak razlog zabrane. Cena ostaje vidljiva u tom kontekstu.
- Potvrda na validnom mestu plaća jednom. HUD razlikuje „radnik putuje”, „gradi”, „gradnja miruje” i „izlaz blokiran”. Preostalo vreme je vreme rada, ne obećani dolazak.
- Escape / desni klik iz preview-a odustaje bez naplate. X na već započetoj građevini je drugo dejstvo sa refund-om po pravilima.
- „Nema dovoljno CODE: potrebno 120, dostupno 100” bolje opisuje odbijanje od generičkog „ne može”.
- Odgovor na input vidljiv najkasnije sledećim renderom kao lokalna namera; simulaciono prihvatanje/odbijanje ostaje zasebno. Budući mrežni klijent ne sme prijaviti prihvaćen nalog pre serverske potvrde.
- Preview/obaveštenje ne sme neprekidno pratiti pokazivač preko samog cilja ili sakrivati čvor.

## 11. Razvojni UI WHR motora — predlog

| Modul na zahtev | Podaci | Zašto |
|---|---|---|
| Kontrola simulacije | Pause/continue, +1 tick, seed, scenario, tick | Ponovljivo zaustavljanje i poređenje |
| Inspector | ID, owner, zadatak, target, cargo, HP, queue | Provera stvarnog stanja bez nagađanja iz crteža |
| Navigacija | Grid, blocked, noBuild, putanja, rezervacija | Vizuelno lociranje greške kretanja/gradnje |
| Ekonomija | Novčanik, isporuka, naručeni, refund evidencija | Zašto se CODE promenio |
| Profilisanje | Render i simulation ms, FPS, kašnjenje, broj objekata | Merenje uskih grla |
| Događaji / komande | Tick, command ID, owner, prihvaćeno/razlog | Razdvajanje input greške od pravila |
| Izvoz provere | Scenario, build identitet, screenshot, snapshot | Reprodukcija i evidencija |

WHR.snapshot() već postoji. To nije dokaz da već postoji inspector, serijalizovan save, replay ili deterministički mrežni protokol. Debugger pauza ne sme se mešati sa budućim pravilima pauze mrežnog meča. Razvojne komande mogu namerno menjati stanje samo u jasno označenom lokalnom test režimu; običan HUD čita stanje i šalje validirane namere. Bots i ljudi buduće komande treba da koriste kroz iste provere pravila.

## 12. Provera kroz zadatke — pre pravog kodiranja

Ovo su protokoli i prolazi kroz skicu. Svi stvarni korisnički pokušaji ispod trenutno su **PENDING**. Analitička provera rasporeda nije isto što i uspešan playtest.

| ID | Zadatak i preduslov | Očekivani prolaz kroz skicu | Uslov prolaza |
|---|---|---|---|
| U01 | Izaberi sopstvenog radnika | Klik sveta → oznaka → teret/zadatak → G/H/B/R/C | Jasno ko je izabran; bez pomeranja kamere ili naloga samim izborom |
| U02 | Zadaj Relej sa dovoljno CODE-a | Radnik → R / slot → preview → validno mesto | Cena 60, rezervacija jednom, vidljiv dolazak/progres; klik HUD-a ne potvrđuje gradnju |
| U03 | Proveri CODE, populaciju i radnike | Pogled na stalne brojeve + detalj po potrebi | Bez menija za CODE/populaciju; naručeni nisu sakriveni kao završeni |
| U04 | Pronađi jedinicu van kadra | Grupa / idi na selekciju → skok → minimap okvir | Kamera na korisnoj lokaciji; bez novog naloga; prethodna kamera radi |
| U04b | Mapiraj pokretnog Scouta na F1 | Izbor Scouta → dodela F1 → pomeri Scouta → F1 jednom → drugi kadar → F1 jednom | Oba puta kamera na trenutnoj jedinici; bez duplog pritiska, bez izgubljenog naloga i otvaranja browser pomoći; cilj uklonjen daje razumljiv rezultat |
| U05 | Proizvodi uz pažnju na drugoj lokaciji | Izbor grupe Centrale → W → red | Kamera ostaje; uspeh/limit jasno vidljivi; preduslov: grupe tek treba implementirati |
| U06 | Pokušaj gradnju na rampi i bez CODE-a | Preview i razlog → korekcija / Escape | Nema naplate, razumljiv razlog, nema ponovljenog spam-a |
| U07 | Prekini preview pa nastavi rad | Escape → normalna selekcija | Cargo i stari nalog nisu izgubljeni zbog samog preview-a |
| U08 | Nađi neaktivnog radnika | Idle broj → klik / prečica → ciklus | Svaki stvarno idle radnik dostupan, bez mešanja sa zaposlenima |
| U09 | Otvori debugger pa ga zatvori | Razvojni panel → pregled → zatvori | Stanje i kamera ostaju predvidivi; običan HUD čist |
| U10 | Promeni veličinu prozora i HUD skalu | 1920/1366/1280, browser 100/125/150% | Nema sudara blokova, odsečenih cena, pomerenog hit-test-a ili horizontalnog skrola |

Početni test: OI koristi skicu/prototip uz što manje objašnjenja. Beležiti uspeh, prvi pogrešan klik, traženje komande, vreme, potrebnu pomoć i subjektivnu čitljivost. Ponoviti osnovne zadatke najmanje tri puta radi uočavanja učenja; to nije statistički dokaz populacije. Vremenski ciljevi se određuju posle baseline-a, ne izmišljaju se sada.

Automatska provera kasnije: kontekst dugmadi i stabilni slotovi; validacija i naplata; HUD input ne prolazi u svet; prečice sa fokusom; minimap transformacije pri zoom-u; sačuvana selekcija i nalog pri skoku kamere; računanje unije HUD prostora; čitljivost brojeva i overflow. Prolazak ovih provera nije zamena za OI testiranje.

## 13. Rezultat sadašnje provere skice

| Provera | Sadašnji rezultat |
|---|---|
| Identifikovan problem iz stvarnog OI feedback-a | DA, S7 |
| Upoređene reference i konkretne WHR komande | DA, uz granice S1–S6 |
| Skica sadrži mesto za četiri osnovna zadatka | DA, analitički pregled |
| Odvojeni HUD, menus i razvojni UI | DA, specifikacija |
| Konačne dimenzije i prečice usvojene | NE, kandidati |
| Nova implementacija HUD-a napravljena ovim zadatkom | NE |
| Novi interaktivni / ljudski playtest završen | NE |
| Skok kamere / grupe / inspector implementirani | NE |

## 14. Redosled rada — kockica po kockica

1. Ovaj MASTER i skicu pregledati kroz U01–U04, sa posebnim prioritetom skoka kamere.
2. Precizirati položaje, aktivne komande, click/keyboard put i očuvanje naloga. Izmeriti baseline postojećeg HUD-a na istom viewport-u.
3. Napraviti najmanji interaktivni kandidat za te radnje. Odvojiti state/query logiku od vizuelne prezentacije; ne izvoditi veliki refactor motora usput.
4. Proveriti greške, prečice, fokus, različite rezolucije i OI iskustvo. Sačuvati rezultate i otvorene primedbe.
5. Tek nakon toga širiti na grupe, ekonomsku makro podršku, debugger i kasnije borbene/herojske akcije.

Za prvu iteraciju ne uvodimo T2/T3 runtime, 3D prikaz ili multiplayer samo zato što imaju buduće mesto u HUD-u. Dizajn nije završen time što CSS staje na ekran.

## 15. Izvori

- S1: SC2 screenshot u ovom razgovoru, dostavljen od OI; nije Reddit alternativni koncept kao dokaz standardnog SC2 rasporeda.
- S2: Blizzard, [Hot Keys and Special Commands](https://classic.battle.net/war3/basics/specialcommands.shtml), povezano iz [WC3 Basics](https://classic.battle.net/war3/basics/). Pristupljeno 19.11.2026.
- S3a: Godot, [Debugger panel](https://github.com/godotengine/godot-docs/blob/c7517c2882ec1fcdeb9d773e6537439011df950f/tutorials/scripting/debug/debugger_panel.rst?plain=1#L1-L261).
- S3b: Godot, [Overview of debugging tools](https://github.com/godotengine/godot-docs/blob/c7517c2882ec1fcdeb9d773e6537439011df950f/tutorials/scripting/debug/overview_of_debugging_tools.rst?plain=1#L1-L291).
- S3c: Godot, [The Profiler](https://github.com/godotengine/godot-docs/blob/c7517c2882ec1fcdeb9d773e6537439011df950f/tutorials/scripting/debug/the_profiler.rst?plain=1#L1-L150). GitHits istraživanje 19.11.2026, run 01a1f272-9e51-71d3-855b-e8fd19f36831.
- S4: Jakob Nielsen, [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/). Pristupljeno 19.11.2026.
- S5: W3C, [Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Pristupljeno 19.11.2026.
- S6: lokalna radna kopija WHR CODE FRONTIER, index.html / script.js / ui.part / style.css i docs/PROTOTYPE_0_2.md. Proverena 19.11.2026; nije automatski identična trenutnom GitHub/E: buildu.
- S7: OI kritika oversized HUD-a i zahtevi u ovom razgovoru, uključujući hotkeys/makro i prioritet skoka kamere.

### Otvorene odluke

Konačan HUD scale, broj i tačne veze kamera lokacija, prečica za idle radnika i skok na selekciju, ponašanje mešanih grupa i razvojni panel format. **Jedan pritisak na mapirani hotkey za direktan skok na jedinicu jeste zahtev OI; otvoreni su način dodele i ostala podrazumevana vezivanja.** Konačan izbor se zasniva na probi; ovaj dokument ih ne proglašava unapred rešenim.
