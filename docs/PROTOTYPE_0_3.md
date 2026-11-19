# WHR CODE FRONTIER — prototip 0.3: HUD i hotkeys

Datum: 19.11.2026. Status: lokalni kandidat za OI testiranje. Ekonomija, gradnja i mapa nastavljaju pravila iz [0.2](PROTOTYPE_0_2.md).

## Šta je promenjeno

Canvas sada koristi ceo viewport. Uklonjeni su veliki stalni brend, natpisi preko sveta i puna donja ploča. Kompaktni blokovi uz ivice sadrže resurse/sat, minimapu, selekciju i komande. Bez selekcije nema prazne kartice. Relevantna dugmad ostaju u stabilnim grid slotovima; komande tuđeg tipa objekta se ne prikazuju. Razlozi nedostupnosti proizvodnje/gradnje dostupni su kroz title, uz proveru novca, globalnih limita i populacije; simulacija ponovo proverava pravila pri nalogu.

Stanje radnika/gradilišta i red proizvodnje ostaju vidljivi. Dugme **Neaktivni** prikazuje se samo kada ima sopstvenih idle radnika; klik bira sledećeg i skače na njega. Strelica **↶** vraća prethodni eksplicitni kadar. Resize više ne vraća svaki put kameru u bazu.

## Mapiranje prečica

1. Izaberi svoju jedinicu, zgradu ili grupu; za lokaciju prvo namesti kameru.
2. Klikni **Hotkeys**. Izaberi vrstu cilja: selekcija ili lokacija.
3. Klikni polje tastera i pritisni željeni taster, npr. **1–0, F1–F4** ili slovo.
4. Ako taster već ima dodelu ili podrazumevanu komandu, eksplicitno potvrdi zamenu.
5. Sačuvaj. **Jedan pritisak odmah skače na cilj.** Jedinicu traži na trenutnom položaju, preko ID-ja; lokacija vraća sačuvan položaj i zoom.

Skok na mapirani cilj ne bira novu selekciju, ne izdaje nalog, ne naplaćuje CODE i ne uključuje stalno praćenje. Grupa fokusira prvog još postojećeg sopstvenog člana iz sačuvanog redosleda. Kada cilja više nema, sledi obaveštenje bez proizvoljnog skoka. Nova partija briše sve dodele, pa stari ID-jevi ne preuzimaju nove objekte. Dodele nisu trajni korisnički profil i ne čuvaju se preko reload-a.

Primer: izabrani Scout → F1. Posle njegovog kretanja svaki novi pojedinačni F1 nalazi ga na novom mestu. Izabrana Centrala → 1; pogled na džunglu → 2. Nije potrebna dvostruka aktivacija.

Editor za sada prihvata pojedinačne alfanumeričke, funkcijske, numpad i neke dodatne tastere. Escape, Tab, strelice i samostalni modifikatori zadržani su za navigaciju; kombinacije sa Ctrl/Alt/Meta/Shift nisu editor prečice u ovoj verziji. Browser/OS može zadržati pojedine funkcijske tastere; F1–F4 provereni su u Chromium automatizaciji, ali to ne dokazuje svaku Windows/browser konfiguraciju. Binding na W/R/Space zamenjuje tu tastaturnu komandu samo uz potvrdu; odgovarajuće HUD dugme ostaje dostupno. Uklanjanje binding-a vraća podrazumevanu komandu i oznaku.

Dok je Hotkeys panel otvoren, simulacija i pomeranje kamere miruju; fokus polja ne izvršava game komandu. Escape zatvara editor bez nepotvrđene dodele. Posle zatvaranja nema nadoknađivanja proteklog vremena. Ovo je lokalna test funkcija, ne pravilo za budući online meč.

## Provere

- Syntax i 20 postojećih ekonomskih/građevinskih provera: PASS.
- Postojeći browser scenario proizvodnje, stvarne gradnje, pauze/nastavka, refund-a, mape i reset-a: PASS.
- Novi browser scenario: kontekst HUD-a, full viewport, editor i zamrzavanje simulacije, pokretni F1 cilj, svih 1–0/F1–F4, lokacija/zoom, zgrada i zamena, grupa, potvrda konflikta, zamena/uklanjanje W, fokus, odbijanje rezervisanog tastera, prethodni kadar, očuvanje selekcije/naloga/novca, reset starih veza i viewport granice: PASS.
- Vizuelno pregledani desktop HUD i editor. Merenje budžeta HUD-a nalazi se u browser test output-u; meri blokove, ne samo dimenziju canvas-a.

Pokretanje provera:

```sh
node --check script.js
node tests/economy.cjs
node tests/construction.cjs
node tests/browser.cjs
node tests/hud.cjs
```

Browser scenariji zahtevaju Playwright i Chromium; WHR_CHROMIUM_PATH bira izvršni fajl. WHR_TEST_OUTPUT bira output folder. Korišćen je virtuelni sat radi ponovljivosti. Testovi ne zahtevaju mrežni server.

## Granice

**OI playtest i prihvatanje ovog HUD-a tek slede.** Automatizacija nije dokaz da je raspored prijatan svim igračima. Mobilni test pokriva širinu/granice, ne kompletno touch upravljanje. Nema novog borbenog sistema, heroja, inventara, T2/T3, fog-of-war-a ili multiplayer-a. Postojeći proceduralni teren nije konačna grafika. Modularni engine/render refactor, trajni keymap profil i developer inspector ostaju naredni poslovi.

[HUD MASTER](WHR_GAME_ENGINE_HUD_UI_MASTER_v1_0_2026-11-19.md) dokumentuje istraživanje i inicijalne kandidate. Ovaj zapis je aktuelno stanje implementacije; istorijske PENDING stavke MASTER-a ne znače da sve ovde proverene funkcije i dalje nedostaju.
