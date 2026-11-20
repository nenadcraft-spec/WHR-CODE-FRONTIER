# WHR 0.7.0 — V7 kandidat za OI probu

Osnova: prihvaćeni 0.6.2, GitHub main `e42eea6762066e6e3cc87d71d30e31cbdd8000bd`. Izmena je u odvojenom projektu.

## Šta probati

- Propuštanje dve savezničke jedinice u tesnacu, uključujući sklanjanje neaktivnog saveznika. Stop i Shift nastavljaju da rade. Ne pomera se Hold i ne prolazi se kroz neprijatelja.
- U Centrali završi T2, Akademiju i Radionicu, zatim U za T3: 600 CODE / 90 s. Limit 12 radnika, Releji do 60 populacije.
- Radnikom izgradi Vazdušnu luku, Centar prikrivanja i do dva sidra. Obuči Nebeskog Čuvara, Mostonošu i Senku. Kula dobija Detektorski modul od T2.
- Izaberi kopnene putnike → Ukrcaj → klik na svoju Mostonošu. Kada miruje iznad slobodnog tla i putnici priđu, utovaruju se do ukupno 6 populacije. Izaberi Mostonošu → Iskrcaj.
- Mostonoša → Teleport → klik na završeno sopstveno sidro. Početak skida 40 CODE i pokreće cooldown 60 s; priprema 5 s. Prekid nema refund, prema [kandidatskim odlukama](V07_ODLUKE_KANDIDAT_001.md).
- T3 kampovi se aktiviraju u 05:00; prvo čišćenje daje Vitalni kristal. Scout može unaprediti T2 čizme na T3.

## Lokalno igranje

`index.html` i dalje radi direktno iz foldera za poligon i lokalnog bota. Za mrežu koristi HTTP klijent sa pokrenutog servera.

## Server na istom računaru

Potrebni su Node.js 24 ili 26 i `ws` 8.23.0. E: ZIP uključuje ws za rad bez instalacije tog paketa. Git checkout dobija zavisnost preko `npm ci`.

1. Pokreni `START_SERVER.cmd` na Windows-u ili `npm start` u terminalu.
2. Otvori `http://127.0.0.1:8080` u dva taba za 1v1, četiri za 2v2.
3. Otvori „Mrežni meč“, unesi ime; prvi igrač izabere režim i Napravi.
4. Drugi unese prikazani kod meča i Pridruži se. Za 2v2 pridruže se još dva igrača.
5. Svi pritisnu Spreman. Svako dobija svoj slot, selekciju i dozvoljen pogled.
6. Kod prekida koristi Vrati meč u istom tabu u roku 60 s. Token je u sessionStorage; ne šalji ga drugima. Reset izlazi iz trenutne veze i vraća lokalni izbor.

## LAN — pripremljeno, dva fizička računara još nisu proverena

Server podrazumevano sluša samo 127.0.0.1. Za privatnu LAN probu administrator može izabrati `WHR_HOST=0.0.0.0` i eksplicitni `WHR_ORIGINS`, na primer `http://192.168.1.10:8080,http://127.0.0.1:8080` ako je to stvarna adresa servera. Tada oba računara otvaraju HTTP adresu servera, a Server polje može ostati prazno. Firewall se ovim paketom ne menja. Ne unositi primer IP adrese kao da je proverena adresa tvog računara.

Javni HTTPS klijent zahteva odgovarajući WSS server/domen/TLS i Origin allowlist. Javni hosting nije postavljen; GitHub Pages sam ne izvršava server.

## Šta je provereno, a šta ostaje

Detalji izvršenih provera su u [izveštaju](V07_TEST_REPORT_2026-11-20.md). Igrivi kandidat sadrži T3 i stvarni lokalni 1v1/2v2 server; ovo nije potvrda javnog internet hostinga, dva fizička računara ili konačnog balansa.

Nema trajnog oporavka nakon pada procesa, rangiranja, korisničkih naloga, replay/save-a, 3D renderera ili Color Engine integracije. Mrežni lobby trenutno podržava ljude; strateški bot je u lokalnom 1v1 režimu. Nije implementirano mešanje botova i ljudi po mrežnim slotovima. Nema pojedinačnog preuređivanja Shift reda. Gužve su poboljšane, ne postoji garancija prolaza kroz svaki gust raspored.
