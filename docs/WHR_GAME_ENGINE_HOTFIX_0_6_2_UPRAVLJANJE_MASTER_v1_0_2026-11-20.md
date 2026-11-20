# WHR Game Engine — HOTFIX 0.6.2: upravljanje MASTER

Verzija dokumenta: 1.0  
Datum: 20.11.2026, Europe/Belgrade  
OI naziv dopune: „hot fix 6.2”; oznaka u kontinuitetu projekta: **0.6.2**  
Glavni arhitekta i konačna odluka: **Beli Zec / OI / WRA**  
Priprema i implementacija: Codex / Ćale

## 1. Svrha i stvarni status

Imamo sopstvenu RTS simulaciju. Ova dopuna treba da olakša njeno korišćenje: selekciju, kontrolne grupe, slaganje naloga, rally i kameru. Ne menja motor samo radi izgleda i ne zahteva prelazak u 3D.

**STATUS OVOG FAJLA = SPECIFIKACIJA + IZVEŠTAJ IMPLEMENTACIJE.**  
**KOD 0.6.2 = IMPLEMENTIRAN KANDIDAT ZA OI TEST.**  
**PROVERE = 97 Node provera i 7 Chromium scenarija prošlo.**  
**OI PLAYTEST 0.6.2 = ČEKA TVOJU PROBU.**

OI je pobedio lokalnog bota nakon ispravke blokade i tražio proučavanje SC2 upravljanja. Ovo nije tvrdnja da je time prihvaćen konačan balans, završena grafika ili sav saobraćaj vojske.

Prethodna isporuka za osnovu: 0.6.1, posebno sačuvana kopija. Potvrđeni uzrok ranije totalne blokade bio je kružni objekat pri međusobnoj poteri; `dest` mora ostati samo `{x,y}`, a identitet mete ID. Tu ispravku obavezno sačuvati.

## 2. Autoritet odluka

**Potvrđeno iz OI razgovora:**

- Skok kamere nije dovoljna kontrolna grupa. Taster za jedinicu/zgradu mora omogućiti da se odmah koristi taj objekat.
- Ranije željeni skok jednim pritiskom ostaje dostupan: npr. F1 bira mapiranu jedinicu, centrirа kameru i prikazuje njene komande.
- Moraju biti podržani jedinice, grupe, zgrade i sačuvane lokacije; tasteri ostaju podesivi, uključujući 1–0 i F1–F4.
- Potrebni su rally i upotrebljivo upravljanje kamerom mišem.
- Shift, grupno upravljanje i niz naloga predstavljaju deo sledeće dopune.
- Gradimo postepeno, uz stabilnost i pregled mape. OI ostaje glavni arhitekta.

**Implementacioni kandidati ovog dokumenta:** tačne veličine zona za pomeranje kamere, trajanje dvoklika, maksimalni red naloga, rezervacija troška buduće gradnje, prikaz HUD-a i postupanje kad meta nestane. To nisu potvrđene SC2 konstante niti prethodno dogovorene WHR brojke. OI ih može promeniti; nema potrebe prekidati reverzibilnu implementaciju zbog svake rutinske vrednosti.

## 3. Inventar osnove — pregledan lokalni 0.6.1 kod

| Sistem | Imamo | Nedostaje za ovu dopunu |
|---|---|---|
| Izbor | Levi klik, okvir, Shift unija selekcije | Shift uklanjanje klikom, Ctrl/dvoklik istog tipa, jasna mešovita selekcija |
| Mapiranje | Čuvanje ID-jeva objekata ili položaja/zoom-a | Pozivanje selekcije i njenog komandnog konteksta; dodavanje grupi |
| Kamera | Strelice, točkić zoom, klik na minimapu, Baza, prethodni kadar, mapirani skokovi | Ivica ekrana, srednje dugme, prevlačenje minimape i podešavanje brzine |
| Nalozi jedinice | Jedan pokret, napad na metu, skupljanje, stop | Shift red naloga i definisano završavanje/prelaz |
| Gradnja | Put, rad, prekid, nastavak, refund | Niz gradnji i povratak na konkretni CODE bez ručnog ponavljanja |
| Proizvodnja | Red obuke u pojedinačnoj zgradi, populacione rezervacije | Kontrolisano upravljanje grupom proizvođača i rally |
| Borba | Fokus na vidljivu metu, automatsko angažovanje u nekim stanjima | Pravi attack-move na tlo, hold, patrol, follow |
| Bot | Lokalni 1v1, zajednički dispatcher, pogled kroz dozvoljene podatke | Korišćenje novih vrsta naloga bez zaobilaženja pravila |
| Mreža | Lokalna simulacija/komande | Server, dva klijenta, lobby/reconnect, timovi; nije obim ovog hotfix-a |

Dokaz iz koda: `activateBinding` trenutno poziva `jumpCamera`, ali ne dodeljuje `selected`. Shift pri selekciji pravi uniju; Ctrl/Alt kombinacije izlaze iz keydown handler-a. Desni klik zadaje pojedinačan nalog. Minimap ima pointerdown skok, bez drag-a. Ovo opisuje pregledanu kopiju, ne dokazuje šta je trenutno učitano u nekom browser tabu.

## 4. Referenca SC2 i granica prenosa

Pregledana Blizzardova uputstva, 20.11.2026:

- [Simplified Controls](https://news.blizzard.com/en-us/article/6640645/game-guide-simplified-controls): kontrolne grupe Ctrl+broj, pozivanje brojem, dvostruki pritisak za centriranje, Shift niz komandi, Tab podgrupe, srednje dugme za kameru.
- [Special Control](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control): Shift dodavanje/uklanjanje iz selekcije, Ctrl/dvoklik istog tipa, upravljanje grupom zgrada, niz naloga radniku.
- [Buildings](https://news.blizzard.com/en-us/article/4488317/game-guide-buildings): rally proizvođača na tlo, resurs ili jedinicu, grupni rally, ponašanje pri gubitku mete.
- [SC2 podrška: Mouse scrolling](https://us.forums.blizzard.com/en/sc2/t/no-mouse-scrolling-panning/12214): prijavljeno i potvrđeno ponašanje pomeranja uz ivicu; ovo je podrška, ne specifikacija tačne brzine ili margine.

Uputstva su referenca za ponašanje, ne kopiranje SC2 modela, vizuelnih materijala ili svih hotkey podrazumevanih vrednosti. SC2 razlikuje izbor grupe od centriranja kamere. WHR zadržava OI mogućnost jednog pritiska za izbor + centriranje.

## 5. Selekcija i kontrolne grupe

### 5.1. Izbor mišem

- Levi klik bira jedan vidljivi objekat i postavlja odgovarajući HUD.
- Okvir bira sopstvene jedinice u označenom prostoru. Ne hvata skrivene protivnike niti nevidljive objekte.
- Shift+klik na sopstveni objekat dodaje ga ako nije izabran, a uklanja ga ako jeste. Shift+okvir dodaje pronađene jedinice bez dupliranja ID-ja.
- Ctrl+klik i dvoklik biraju sopstvene objekte istog tipa u trenutnom pogledu. Kandidat za razmak dvoklika: 300 ms, ne broj simulacionih tick-ova.
- Na neprijatelju može da se prikaže dozvoljena informacija, ali njegova selekcija ne daje komande niti ulazi u sopstvenu kontrolnu grupu.
- Mešovita selekcija jasno prikazuje broj/vrste i aktivnu podgrupu. Ne prikazivati HP prve jedinice kao zbir HP cele grupe.

### 5.2. Vezivanje i pozivanje

Svaka veza ima tip i način aktiviranja:

| Tip | Sačuvani podaci | Aktiviranje |
|---|---|---|
| Objekti / grupa | Sopstveni ID-jevi | Izbor živih članova; po opciji i centriranje |
| Lokacija | Kopija x/y/zoom | Samo kamera; ne menja selekciju |

- Podrazumevano WHR ponašanje objektne veze: **izaberi + centriraj jednim pritiskom**. Tako F1 na radnika odmah daje i radničke komande.
- Može se izabrati klasičan način „pritisak bira, brzi drugi centrirа”. Dvostruki pritisak koristi UI vreme, a ne brzinu simulacije.
- Ctrl+1…0 zamenjuje sadržaj tog numeričkog slota trenutnom sopstvenom selekcijom; Shift+1…0 dopunjava postojeći objektni slot. Dopuna grupe ne izdaje nalog za kretanje.
- Shift+broj na slot lokacije ne pretvara ga prećutno u grupu. Potrebna je jasna poruka i postojeći postupak potvrde zamene u editoru.
- Podesivi tasteri ostaju; postojeći konflikt-editor se proširuje, ne uklanja. Ne prepisivati potvrđenu korisničku dodelu bez jasnog postupka zamene.
- Prikaz članova prati aktuelne ID-jeve; mrtvi članovi se preskaču. Ako grupa ostane prazna, obavestiti igrača; ne skočiti na pogrešan objekat ili promeniti nalog druge jedinice.
- Pri pozivanju zgrade odmah prikazati njenu proizvodnju/tehnologije. Pri pozivanju vojske odmah omogućiti njene primenljive komande.
- Tab menja aktivnu podgrupu u mešovitoj selekciji, a Shift+Tab ide unazad. Primena komande po grupi ostaje eksplicitna, ne zavisi od slučajnog redosleda u nizu.

## 6. Shift red naloga jedinice

Red proizvodnje, red ulaznih komandi i red naloga jedinice su tri odvojene stvari. Botov dispatcher red za naredni tick već postoji; to nije zamena za niz zadataka radnika/vojske.

### 6.1. Pravila reda

- Običan nalog prekida/zamenjuje tekući nalog i briše čekajuće naloge, osim kad komanda izričito nalaže drugo.
- Shift dodaje na kraj. Ne prekida tekući radnički ciklus, gradnju ili pokret usred izvršenja samo zato što je novi nalog dodat.
- Stop bez Shift-a prekida aktivni nalog, čisti čekajuće i pravilno oslobađa gradilište/rudarsko mesto. Teret i inventar se ne brišu.
- Kandidat: najviše 32 naloga po jedinici, uz poruku kada je red pun; nema tihog gubitka početnog/krajnjeg naloga.
- Nalog sadrži podatke: tip, targetId ako postoji, kopiju koordinata, status i uslov završetka. **Nikad referencu na živu jedinicu, zgradu ili ceo game.**
- Prelaz izvršava simulacija na 20 Hz. Dodavanje naloga u HUD-u ne pomera jedinicu i ne skraćuje vreme posla.
- Kamera/skok/zoom ne menja red. Pauza ga ne izvršava. Reset briše redove i rezervacije.
- Mešovita grupa prima samo primenljive naloge. HUD prikazuje koji deo grupe prihvata komandu; rezultat ne sme da kaže „sve prihvaćeno” ako nije.

### 6.2. Završavanje i nevažeće mete

| Nalog | Završetak / prekid |
|---|---|
| Move | Dolazak na dozvoljeno mesto unutar tolerancije; grupa koristi odvojena mesta |
| Napad na metu | Meta uništena/nevažeća; pri gubitku vizije nema praćenja skrivenih koordinata |
| Build | Završena konkretna gradnja; prekid/smrt/otkazivanje pravilno oslobađa posao |
| Gather | Bez čekajućeg naloga trajno skuplja; sa sledećim nalogom završava tekući ciklus/isporuku pa predaje kontrolu redu |
| Repair | Cilj dostigao maksimum ili više nije validan |
| Follow / Hold / Patrol | Trajni nalozi dok se ne zamene/prekinu; ne glumiti da sledeći automatski počinje odmah |

Ako aktivni put blokira prolaz, čekanje ne preskače red. Kandidat: posle 10 s bez napretka prikazati status i zadržati nalog; ne teleportovati niti automatski nastaviti važnu gradnju na drugom mestu. Uništena/nepripadajuća meta završi se kao nevažeća, sa jasnim prelazom na sledeći primenljivi nalog. Smrt jedinice briše njen red i oslobađa rezervacije.

**Važna namera — WHR kandidat:** Shift+Build/Move iza tekućeg Gather-a čeka završetak tekuće isporuke, a zatim počinje. Tako radnik ne ostaje beskonačno na početnom nalogu. Ako nema tereta niti započetog kopanja, prelaz može odmah; kod iscrpljenog čvora postojeći teret prvo stiže u Centralu. Ako nema sledećeg naloga, Gather nastavlja normalno. Za trenutno prekidanje posla igrač izdaje običan nalog. Ovu politiku posebno proveriti sa OI; nije tvrdnja o tačnoj internoj SC2 implementaciji.

## 7. Niz gradnje i ekonomija rezervacija

OI scenario: **izgradi Kasarnu → Relej → vrati se na odabrani CODE**.

Sadašnji `beginBuild` odmah naplaćuje i pravi temelj. Ne sme se nekritički ponoviti za sve Shift stavke i predstaviti kao gotov radnički red.

Predlog za implementaciju, nije SC2 tvrdnja:

1. Pri prihvatanju buduće gradnje proveriti vlasništvo, tip, tekuću tehnologiju, granice i raspoloživi CODE; rezervisati cenu u `reservedCode`. Ne praviti blokirajući temelj pre nego što nalog postane aktivan.
2. Svi potrošači novca — obuka, istraživanje, upgrade, predmeti, heroji i drugi graditelji — koriste isti `availableCode = code - reservedCode`. Rezervacije ne daju dodatni novac.
3. Pri aktiviranju ponovo proveriti lokaciju/limit/pristup. Rezervaciju pretvoriti u stvarni trošak jednom, stvoriti temelj i koristiti postojeći rad/gradnju.
4. Ako lokacija više nije validna, zadržati stavku kao blokiranu sa razlogom; igrač može obrisati/preusmeriti taj nalog. Ne naplatiti ponovo svaki pokušaj i ne podići temelj preko vojske.
5. Brisanje čekajućeg naloga ili smrt radnika oslobađa neiskorišćenu rezervaciju u celosti. Aktivni temelj prati postojeći refund 100% pre rada / 75% posle rada; rezervacija i refund se ne sabiraju.
6. Budući otisak može biti prikazan kao neblokirajući plan. To nije garancija da mesto ostaje slobodno. Više radnika može pokušati isti prostor; prvi validan aktivni temelj ima stvarni autoritet, ostali čekaju bez duple naplate.

Pre uvođenja ovih rezervacija obavezno proširiti zajedničke validatore; lokalna provera samo na dugmetu nije dovoljna. Ako se ova etapa isporučuje odvojeno, njeno odsustvo mora biti jasno navedeno, bez tvrdnje „Shift gradnja završena”.

## 8. Rally svih proizvođača

„Za sve” znači sve sopstvene objekte koji stvarno stvaraju jedinice: Centrala, Kasarna, Stanica podrške, Radionica i Oltar. Kula, Relej i Akademija bez proizvodnje jedinica ne dobijaju besmislenu rally komandu.

### 8.1. Dodela

- Izaberi proizvođača ili više njih → desni klik na cilj ili dugme Rally pa levi klik. Rally dugme i prečica moraju biti podesivi i rešavati konflikt sa postojećim slovima.
- Cilj može biti tačka, konkretan CODE čvor ili sopstvena jedinica. Čuva se ID i obična kopija koordinata, nikad živi objekat.
- Na izabranom proizvođaču prikazati zastavicu/liniju cilja. Više proizvođača može deliti cilj; njihovi zasebni redovi obuke se ne spajaju.
- Kandidat: rally se sme podesiti i dok je sopstveni proizvođač u gradnji, ali se primenjuje tek posle završetka i stvarne obuke.
- Mešovita selekcija vojske i proizvođača mora prikazati oba efekta kontekstualnog desnog klika: vojska dobija nalog, proizvođači novi rally. To proveriti posebno da promena ne bude skrivena od igrača.

### 8.2. Primena na novoj jedinici

- Rally na tlo: posle validnog izlaza iz zgrade zadaje se put do raspoloživog dolaznog mesta, uz radijus i lokalni saobraćaj.
- Rally na CODE: novi radnik dobija konkretan Gather; Scout/vojnik ne postaje rudar, već prilazi bez blokiranja aktivnog rudarskog mesta.
- Rally na sopstvenu jedinicu: nova jedinica dobija Follow prema ID-ju, sa odmakom; ne cilja njen centar kao slobodno mesto.
- Smrt mete pre obuke: flag se označava nevažećim; nova jedinica čeka kod bezbednog izlaza. Smrt posle polaska: ide do poslednje dozvoljene poznate pozicije, pa čeka. Nema živih referenci ni praćenja mrtvog/skrivenog objekta.
- Iscrpljen CODE pre primene: radnik traži sledeći dozvoljeni čvor istog polja; ako ga nema, čeka uz status. Ne šalje se prećutno na drugi kraj mape zbog pogrešnog ID-ja.
- Rally ne preusmerava već proizvedene jedinice. Njih bira i vodi igrač.
- Ako izlaz nije slobodan, obuka ostaje završena u redu do slobodnog izlaza. Nema teleportovanja, dodatne naplate ili kopije jedinice.
- Bez rally-ja ostaje prethodno ponašanje: radnik kreće u ekonomiju, drugi izlaze na bezbedno mesto. Prvo prizivanje heroja kod Centrale i oživljavanje u Oltaru moraju imati eksplicitno definisanu primenu odgovarajućeg rally-ja.

## 9. Kamera mišem

### 9.1. Ivica ekrana

- Kamera se pomera kada je pokazivač unutar ivice aktivne igre. Kandidat: zona 16 CSS px i brzina 600 CSS px/s, podesivo i isključivo u postavkama.
- Brzina koristi proteklo vreme i zoom, ne broj frame-ova. Dijagonala se normalizuje.
- Ne pokretati skrol kada je pokazivač van igre, prozor nema fokus ili je otvoren dijalog. HUD i dodir nisu automatski zona pomeranja.
- Dok igrač postavlja gradnju, skrol ostaje koristan; preview mora odgovarati novoj svetskoj koordinati. Ne potvrditi objekat na staroj koordinati.
- U browser-u ivica znači granicu vidljivog područja igre, ne čitav višemonitorski desktop. Izlazak pokazivača prekida skrol.

### 9.2. Srednje dugme

- Drži srednje dugme i pomeraj miš za pomeranje kamere; ne izdaje selekciju, rally ili nalog jedinici.
- Sprečiti browser autoscroll nad igrom. Obezbediti pointer capture, pointercancel i prekid na gubitak fokusa.
- Podesivi smer/inverzija i osetljivost. Prvi pritisak ne sme napraviti skok; pomeranje se računa od stvarnog početka prevlačenja.
- Ne zahtevati pointer lock ili novu browser dozvolu za osnovnu funkciju. Izvan prozora ne garantujemo beskonačno SC2 prevlačenje.

### 9.3. Minimapa i postojeće prečice

- Levi klik/prevlačenje pomera kameru; desni klik služi nalogu/rally-ju prema aktivnom kontekstu, ne slučajnom skoku kamere.
- Okvir pogleda prati kameru. Mapiranje minimap koordinata radi pri svim podržanim viewport/zoom/DPR kombinacijama.
- Strelice, zoom, Baza, prethodni kadar i mapirani skokovi ostaju. Kameru možemo pregledati tokom pauze bez pomeranja jedinica ili izvršenja njihovih redova.

## 10. Borbene komande

- **Attack-move:** komanda na tlo, kretanje uz zaustavljanje/angažovanje dozvoljene uočene pretnje, pa nastavak rute kad je borba završena. Nije isto što i napad na jedan ID.
- **Hold position:** jedinica ostaje na mestu i gađa u dometu; ne kreće u poteru.
- **Patrol:** ponavlja put između tačaka i reaguje na pretnje po definisanom borbenom pravilu.
- **Follow:** prati živu sopstvenu ciljnu jedinicu sa fizičkim odmakom; osnov za rally na jedinicu.
- Sve prolazi isti dispatcher/autoritet i istu proveru vidljivosti/cene/radijusa. Bot nema privilegovanu prečicu.
- Za novi hotfix ne uvoditi automatsku promenu statistika, pop limita ili damage-a da bi upravljanje izgledalo bolje.

## 11. HUD i arhitektura

- Povećati korisnost, ne veličinu HUD-a. Kontrolne grupe prikazati u maloj traci sa tasterom i brojem/vrstom članova.
- Aktivna selekcija, aktivna podgrupa, rally i čekajući nalozi imaju različite oznake. Prikazati samo relevantno za trenutnu selekciju.
- Red naloga: nekoliko kompaktnih ikona + tooltip i jasna komanda za brisanje čekajućih. Broj preostalih zadataka ne sme glumiti broj jedinica.
- Ulaz: Ctrl/Shift se tumače pre povratka iz postojećeg keydown handler-a. Ne hvatati komande u tekst-polju/dijalogu; sačuvati rad Tab-a i Escape-a u formularima.
- Simulacija čuva red/rally/rezervacije; renderer samo čita i prikazuje. UI ne izvršava gradnju direktnim upisom u objekte.
- Sve reference na mete su ID + obične koordinate. Svet, opažanje bota i dijagnostički snapshot moraju ostati serijalizabilni tokom potere, smrti, promene rally-ja i grupnih naloga.
- Ograničiti veličinu reda/payload-a i ažurirati dispatcher limite za grupne naloge; ne povećavati ih neograničeno da bi jedna komanda prošla.

## 12. Redosled implementacije — kocka po kocka

| Korak | Konkretan rezultat | Uslov prelaska |
|---|---|---|
| A | Popravljena selekcija/keybind; Ctrl/Shift grupe i mali prikaz | Jedan F1 bira i centrirа; odmah rade komande; kamera-only lokacija ne menja selekciju |
| B | Kamera uz ivicu, srednje dugme i minimap drag | Bez slučajnih naloga, skokova ili zaglavljenog skrola |
| C | Rally svih proizvođača | Novi radnici/vojska dobijaju pravi nalog; grupe zgrada rade |
| D | Shift red Move/Attack/Repair i odgovarajući završeci | Niz se izvršava redom; običan nalog/stop ga pravilno zamenjuje |
| E | Shift gradnja/Gather uz zajedničke CODE rezervacije | Nema duple potrošnje, pogrešnog refund-a ili rada bez pristupa |
| F | Attack-move/Hold/Patrol/Follow i objedinjeni playtest | Borba, kontrole, bot i ceo svet ostaju stabilni |

Svaki korak dobija stvarni status. Ako se isporuči međukandidat, mora da kaže koje stavke 0.6.2 još nisu implementirane. Ovaj dokument ne proglašava svih šest koraka završenim.

## 13. Prihvatni scenariji

| ID | Zadatak | Očekivani dokaz |
|---|---|---|
| K01 | Mapiraj radnika na F1, izaberi nešto drugo, pritisni F1 | Pravi ID izabran + kamera + radnički HUD; desni klik vodi tog radnika |
| K02 | Mapiraj Kasarnu na taster i pozovi je | Obuka i rally dostupni bez novog klika na zgradu |
| K03 | Ctrl+1, dopuna Shift+1, smrt jednog člana | Tačno živi članovi, bez duplikata ili tuđih jedinica |
| K04 | Lokacijski keybind dok je vojska izabrana | Menja samo kameru; selekcija, teret i nalozi ostaju |
| K05 | Shift klik dodavanje/uklanjanje; Ctrl/dvoklik istog tipa | Tačna selekcija pri promenjenom zoom-u i van ekrana |
| Q01 | Move A → Shift Move B → Shift Move C | Redosled A/B/C; običan Move D zamenjuje niz |
| Q02 | Kasarna → Shift Relej → Shift Gather konkretnog CODE-a | Stvarni put/rad za oba objekta, pa pravi izabrani čvor |
| Q03 | Nedovoljno slobodnog CODE-a, više graditelja, obuka paralelno | Rezervacije se poštuju u svim potrošačima; nema negativnog novca |
| Q04 | Brisanje čekajuće gradnje, otkazivanje aktivne, smrt radnika | Ispravna odvojena rezervacija/refund, svaka najviše jednom |
| Q05 | Meta uništena, čvor iscrpljen, put blokiran, red pun | Definisano čekanje/prelaz i razlog; bez neograničene petlje |
| R01 | Centrala → rally CODE, obuka dva radnika | Novi radnici rade na dozvoljenom cilju, postojeći nisu preusmereni |
| R02 | Dve Kasarne + Radionica → jedan rally | Novi borci stižu na različita slobodna mesta po radijusu |
| R03 | Rally na jedinicu, potom pomeri/ubij metu | ID praćenje i propisan fallback, bez kružnog objekta |
| R04 | Zatvoren izlaz i promena rally-ja tokom obuke | Jedna naplata, jedna jedinica, fizički bezbedan izlaz |
| C01 | Četiri ivice, dijagonale, različiti zoom/FPS/DPR | Predvidljiva brzina, granice i bez promene simulacije |
| C02 | Srednje dugme, izlazak pokazivača, alt-tab, otvoren HUD | Nema autoscroll-a, neželjenih komandi ili trajnog pomeranja |
| C03 | Drag minimape i desni klik na njoj | Kamera i nalog pravilno razdvojeni |
| B01 | Attack-move kroz neprijatelja; Hold pored njega | Prvi se angažuje/nastavlja, drugi ne kreće u poteru |
| B02 | Follow/Patrol, smrt mete i stop | Trajna semantika i bezbedan prekid |
| S01 | Dve vojske + bot, redovi i rally tokom borbe | Sat napreduje kroz štetu/smrt; snapshot/opažanje rade |
| S02 | Pauza/reset tokom gradnje, reda i dijaloga | Nema napretka/naplate u pauzi; reset čisti nove podatke |
| S03 | Prethodne ekonomija/gradnja/T2/bot/HUD/contact provere | Nema nenamerne regresije; izmenjeno očekivanje obrazloženo |

Kritične scenarije izvršiti u Node simulaciji i sa stvarnim browser input-om. Dodatno OI proba osećaja upravljanja: glatkoća kamere, čitljivost selekcije, brzina prebacivanja i broj nepotrebnih klikova. PASS se upisuje tek nakon izvršavanja; broj starih testova nije dokaz novih funkcija.

## 14. Implementacija i izvršene provere

Implementirani su koraci A–F u `script.js`, uz kompaktne kontrole u `index.html` i `style.css`. Osnova je 0.6.1; ostaje odvojena stabilna kopija. Kamera i render ne menjaju 20 Hz simulaciju.

Izvršeno 20.11.2026: sintaksna provera; 97 Node provera (ekonomija 9, gradnja 11, T1/T2 31, navigacija 10, botovi 12, kontakt vojski 3, novo upravljanje 21); svih sedam Chromium scenarija (HUD, gradnja, T2, navigacija, bot, kontakt vojski, novo upravljanje). Testovi su u `tests/`. Browser testovi koriste stvarne klikove i tastaturu nad lokalnim fajlovima; finansirani testovi dodaju CODE samo izolovanoj testnoj kopiji.

Nove provere pokrivaju selekciju i kameru pri pozivu grupe, klasični režim dvostrukog pritiska, Ctrl/Shift grupe, kameru mišem i minimapom, Shift gradnja→gradnja→Gather, rezervacije i oslobađanje CODE-a, zajednički rally i odvojene proizvodne redove. Node scenariji dodatno pokrivaju limit reda, smrt i nestanak meta, blokiranu buduću gradnju, ograničenje kula, oživljavanje/rally, Follow, Patrol, Hold i Attack-move. Prethodne provere borbenog kontakta i serijalizacije ostaju obavezne i prošle su.

Ovo nije potvrda svake kombinacije FPS/DPR/operativnog sistema iz matrice niti konačna OI potvrda osećaja kamere. Za Chromium na drugoj putanji koristi `WHR_CHROMIUM_PATH`.

## 15. Granice kandidata i OI proba

- Red ima najviše 32 aktivna/čekajuća zadatka. Brisanje svih čekajućih naloga postoji; pojedinačno brisanje, prevlačenje i preuređivanje reda nisu uvedeni.
- Blokirana buduća gradnja čeka uz rezervisan CODE; uklanjanje čekajućih naloga oslobađa rezervaciju. Nema teleportovanja ni zaobilaženja cene.
- Hold, Patrol i Follow su trajni zadaci: prekidaju se običnom novom komandom ili Stop-om. Sledeći zadatak iza njih čeka.
- Grupna obuka dodaje po jednu jedinicu svakoj kompatibilnoj izabranoj zgradi. Delimično prihvatanje zbog novca, populacije ili uslova prijavljuje rezultat.
- Kandidati podešavanja: ivica 16 CSS px, brzina kamere 600 CSS px/s (podesiva), klasični dvostruki pritisak 300 ms. Browser ili OS može zadržati pojedine sistemske prečice.
- OI treba da proveri glatkoću kamere i borbu u gužvi tokom duže normalne partije. Napredno propuštanje vojski u tesnacu ostaje ograničenje ranije navigacije.

Multiplayer, 2v2, novo balansiranje, veliki grafički redizajn, Color Engine integracija i promena render tehnologije ostaju odvojeni zadaci. OI glavni arhitekta određuje smer; Codex povezuje zahtev, implementaciju i izvršen dokaz.
