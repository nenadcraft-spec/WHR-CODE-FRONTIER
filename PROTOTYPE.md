# WHR CODE FRONTIER — prototip 0.1 (istorijski zapis)

Aktuelni opis: [Prototip 0.3 — HUD i hotkeys](docs/PROTOTYPE_0_3.md). Ostatak ovog fajla opisuje prethodnu verziju, ne trenutno stanje svih funkcija.

Otvoriti `index.html` direktno u desktop pregledaču. Nema instalacije, CDN-a ili API ključa. Tri fajla klijenta su `index.html`, `script.js` i `style.css`.

## Radi u ovoj verziji

- Proceduralna mapa sa četiri baze, 24 početna CODE čvora i četiri džungle.
- Šumske prepreke u stvarnoj navigacionoj mreži; A* putanje bez dijagonalnog presecanja blokiranih uglova.
- Izbor jedne od četiri baze, po tri početna radnika i 100 CODE.
- Radnički ciklus: put, čekanje, 3 s skupljanja, teret do 5 CODE, povratak i jednokratna isporuka.
- Konačna zaliha 1.000 CODE po čvoru, automatsko traženje drugog sopstvenog čvora.
- Kupovina radnika 50 CODE / 15 s, limit pet uključujući naručene; Scout 75 CODE / 20 s, limit jedan uključujući naručene.
- Serijski red Centrale, trenutna naplata, rezervisana populacija, vidljiv napredak.
- Selekcija klikom/okvirom, Shift dodavanje, desni klik za kretanje ili rad na nalazištu.
- Minimap kamera, zoom, strelјice, pauza i ponovno pokretanje.

## Kontrole

| Komanda | Akcija |
|---|---|
| Levi klik / prevlačenje | Izbor objekta / sopstvene grupe |
| Desni klik | Pokret ili skupljanje sa CODE čvora |
| W / S, uz selektovanu sopstvenu Centralu | Radnik / Scout |
| G / H, uz selektovane jedinice | Skupljaj / zaustavi |
| Space | Pauza / nastavi |
| Točkić / + / − | Zoom |
| Strelјice | Pomeri kameru |
| Klik na minimapu | Postavi kameru |
| Escape | Ukloni selekciju |

## Granice ove verzije

Ovo je **lokalni ekonomski poligon**. Ostale tri baze pokreću isti ciklus radnika radi poređenja; nisu borbeni AI protivnici. Nema multiplayer servera, 1v1/2v2 lobija, borbe, magle rata, smrti, gradnje, heroja, inventara ili T2/T3 funkcija. Kampovi, prodavnice i centralno jezgro su neinteraktivne oznake budućeg sadržaja. Scout za sada ima kretanje; kupovina i kurirska dostava tek slede.

Mapa je nacrtana procedurama na Canvas-u, prema prostornom konceptu. Generisane koncept slike i gotovi animirani modeli nisu deo ova tri fajla. Postoje šumske prepreke; fizičko izbegavanje drugih jedinica i blokiranje građevinama nisu još modelovani. Nije konačna balansirana mapa.

Skrivanje taba pauzira lokalni poligon. Pri dugom zastajanju pregledača simulacija se može usporiti u odnosu na stvarno vreme; ekonomija i tajmer dele isti simulacioni sat. To nije model budućeg autoritativnog online servera.

## Validacija izvršena 18.11.2026.

- `node --check script.js`: PASS.
- `node tests/economy.cjs`: 9/9 PASS (start, isporuka/konzervacija, proizvodni limit/red, Scout/vlasništvo, pauza, poslednji teret, stop/cargo, putanje, ponovljivost).
- Dodatno 180 simulacionih sekundi: svaka od četiri baze imala je 565 CODE uz početnih 100 i bez trošenja. To je provera ove geometrije, ne kompletan dokaz balansa.
- Playwright + sistemski Chromium: pokretanje, proizvodnja, pauza, prečice, limit obaveštenje, stvarni canvas klik/pokret/gather, reset, izbor P4, mobile širina i odsustvo JS page grešaka: PASS.
- Vizuelno pregledan desktop snimak. Uski ekran proverava raspored; puna touch kontrola nije implementirana.

Browser test zahteva instaliran `playwright` i Chromium; `WHR_CHROMIUM_PATH` može pokazati na lokalni izvršni fajl. U izvršnom okruženju korišćen je `/usr/bin/chromium`. Ekonomskom testu potreban je samo Node.js. Testovi ne zahtevaju servis na mreži; browser test koristi lokalno presretanje zahteva.

Specifikacije u `docs/` opisuju cilj cele igre. Njihov planirani sadržaj ne znači da su sve funkcije već u prototipu.
