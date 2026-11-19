# WHR CODE FRONTIER

WHR Game Engine: browser RTS u razvoju. Lokalni prototip **0.6.1 — lokalni strateški bot 1v1, kandidat za testiranje**.

Otvorite `index.html` direktno u desktop pregledaču. Nema instalacije, CDN-a, naloga niti API ključa. Provereni 0.5 ostaje zasebna verzija.

- Izbor režima pre starta: poligon ili lokalni 1v1 protiv strateškog bota, sa istom početnom ekonomijom i gameplay pravilima.
- Fizički radijusi, A* sa proverom širine, swept provera prepreka i jedinica, odvojena mesta dolaska za grupu. Dugme **Radijusi** prikazuje fizičke krugove; čekanje zadržava nalog.
- Mapa 160 × 160 logičkih ćelija, 16 render jedinica po ćeliji; simulacija 20 Hz, nezavisna od kamere.
- Kompaktan HUD i podesivi hotkeys: jedinice, zgrade, grupe i lokacije; jedan pritisak skače na cilj.
- CODE ekonomija, radnici, gradnja, proširenja, populacija i globalni T2 upgrade.
- Čuvar, Strelac, Bolničar, Razbijač; Akademija, podrška, radionica, Oltar i kule; tri globalna istraživanja.
- Scoutove posete prodavnicama i Svetilištu; predmeti, predaja inventara, jedan heroj sa sposobnostima i oživljavanjem.
- Aktivni T1/T2 NPC kampovi, doprinos u borbi, CODE/XP/loot i respawn; trenutna vidljivost i istražena mapa.

## Hotfix 0.6.1

Popravljena totalna blokada pri kontaktu dve vojske: cilj kretanja čuva samo koordinate, dok se borbena meta prati ID-jem. Dodate su [provere stvarnog kontakta i nastavka simulacije](docs/FIX_0_6_1_COMBAT_FREEZE.md).

## Igranje

Za bota pre starta izaberi **Režim → Lokalni 1v1 · protiv strateškog bota**, pa početnu bazu i pokreni. Protivnik je dijagonalno. Startno nema bonus CODE-a niti instant jedinica. Pauza zamrzava i bota. Reset vraća svet i briše njegove odluke/komande. Rezultat lokalnog meča prikazuje se u kompaktnom gornjem statusu; to nije povezivanje dva računara.

Levi klik bira, prevlačenje bira grupu. Desni klik zadaje pokret/rudarenje/nastavak gradnje ili napad na vidljivog protivnika. Izaberite radnika za gradnju; završenu Centralu za obuku i **U — T2**; vojnu zgradu za njene jedinice. T2 traži završenu Kasarnu i Relej, 300 CODE i 60 s. Sve cene, uslovi i dostupne komande prikazani su uz izabrani objekat.

**A** bira metu napada, **L** metu popravke, **D/F** herojske sposobnosti; Escape/desni klik otkazuje izbor mete. **W/S** radnik/Scout, **B/R/C** Kasarna/Relej/Centrala, **G/H** skupljanje/stop, **X** otkazivanje gradilišta. Ostale komande imaju dugmad; nisu svim komandama unapred dodeljeni tasteri. Panel **Hotkeys** mapira bilo koji podržani taster na trenutnu selekciju ili lokaciju; eksplicitna zamena rešava sukob sa podrazumevanom komandom. Nova partija briše dodele.

Izaberite Scouta i desnim klikom na vidljivu prodavnicu/Svetilište zadajte prilazak. Panel traži rastojanje do 2 mapne jedinice za kupovinu/prizivanje. Predmeti se koriste dugmetom; **→** zatim klik na sopstvenu obližnju jedinicu predaje predmet. Prvo pozivanje heroja radi na T1; druga sposobnost i Oltar zahtevaju T2.

## Granice kandidata

Poligon zadržava četiri početne ekonomije. Lokalni 1v1 koristi čoveka na izabranoj poziciji i bota dijagonalno, bez druga dva igrača. Prvi bot ima jedan razvojni plan: radnici, gradnja, vojska, T2, izviđanje, kamp/napad, odbrana i povlačenje ranjenih. Nema online servera, lobby-ja, 2v2 timskog režima, timske zajedničke vizije, T3 vojske, snimanja/replay-a ni integrisanog Color Engine-a. Bot još nema naprednu ekspanzionu politiku, kupovinu opreme ili podesive težine. Magla koristi kružni vidokrug bez blokiranja linije vida šumom. Navigacija sada proverava fizički radijus i lokalno zaobilazi jedinice. Potpuno koordinisano propuštanje u uskim prolazima i napredne formacije još nisu uvedeni; nerešiva gužva bezbedno čeka. Ako ranije nevažeći položaji već sadrže preklapanje, jedinice mogu da se udalje, bez teleportovanja. Dijagnostički `WHR.snapshot()` vidi lokalno stanje i nije mrežna zaštita od varanja. Grafika je proceduralna razvojna skica. Novi balans i razrešena otvorena pravila su kandidati za OI proveru.

## Dokumentacija i provere

- [Botovi i multiplayer MASTER](docs/WHR_GAME_ENGINE_BOTOVI_MULTIPLAYER_MASTER_v1_0_2026-11-19.md)
- [v0.6 lokalni bot](docs/PROTOTYPE_0_6.md)
- [Navigacija → botovi → multiplayer MASTER](docs/WHR_GAME_ENGINE_NAVIGACIJA_BOTOVI_MULTIPLAYER_MASTER_v1_0_2026-11-19.md)
- [v0.5 kandidat](docs/PROTOTYPE_0_5.md)
- [v0.4 MASTER i odluke](docs/WHR_RTS_V04_T1_T2_IMPLEMENTACIJA_MASTER_v1_0_2026-11-19.md)
- [v0.4 kontrole, uslovi i provere](docs/PROTOTYPE_0_4.md)
- [Izvorni MASTER dokumenti](docs/README.md)
- [Istorijski v0.3 HUD](docs/PROTOTYPE_0_3.md)

```sh
node --check script.js
node tests/economy.cjs
node tests/construction.cjs
node tests/tier2.cjs
node tests/navigation.cjs
node tests/bots.cjs
# Browser provere zahtevaju Playwright i Chromium:
node tests/browser.cjs
node tests/hud.cjs
node tests/tier2-browser.cjs
node tests/navigation-browser.cjs
node tests/bots-browser.cjs
```

Za Chromium na drugoj putanji podesite `WHR_CHROMIUM_PATH`. Browser provere izvršavaju lokalne fajlove preko presretnutih zahteva, bez servera i pristupa internetu. `tier2-browser` dodaje CODE samo u izolovanoj testnoj kopiji, radi pokrivanja celog sadržaja; to nije dokaz normalne brzine ekonomskog razvoja.
