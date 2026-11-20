# V7 kandidat — izvršene provere

Datum: 20.11.2026. Osnova 0.6.2; kompletan V7 kandidat je izdvojen. **OI igranje, dva fizička računara i javni hosting još čekaju probu.**

## Simulacija i protokol

| Suite | Izvršeni slučajevi | Rezultat |
|---|---:|---|
| economy | 9 | PASS |
| construction | 11 | PASS |
| tier2 | 31 | PASS |
| navigation | 10 | PASS |
| controls | 21 | PASS |
| bots | 12 | PASS |
| combat-contact | 3 | PASS |
| tier3 | 16 | PASS |
| traffic-v7 | 4 | PASS |
| bots-tier3 | 1 duži scenario | PASS |
| network | 13 | PASS |
| network-impairment | 4 | PASS |
| stability-v7 | 1 duži scenario | PASS |

Ukupno **136 slučaja u 13 Node suite-ova**. `tests/run-node.cjs` izvršava sve; svaki neuspeh prekida runner nenultim izlaznim kodom. Broj nije tvrdnja da je pokrivena svaka moguća kombinacija svih V7 MASTER scenarija.

## Browser

Devet izvršenih scenarija: HUD, gradnja, T2 tok, navigacija, lokalni bot, kontakt vojski, 0.6.2 kontrole, T3 tok i mrežni tok. Svi PASS. `tests/run-browser.cjs` izvršava ih redom uz Playwright i Chromium.

Mrežni scenario koristi pravi Node/ws server, dva Chromium klijenta za 1v1, zatim četiri za 2v2; odvojene slotove, timsku viziju, gradnju sa odloženim odgovorom, drugog owner-a bez promene serverovog active igrača, zajedničku pauzu, reconnect i širinu 390 px. Nije korišćen lažni WS odgovor umesto servera. Nema zabeleženih JS pageerror događaja.

T3 browser scenario ima eksplicitni finansirani fixture: CODE, T2 i postojeće preduslove radi kraćeg pokrivanja sadržaja. Stvarnim input-om pokreće T3 upgrade, čeka 90 simuliranih sekundi, radnikom gradi sva tri nova tipa zgrada, obučava sve tri nove jedinice i zadaje teleport na sidro. Finansirani fixture nije opcija igre i ne dokazuje normalan ekonomski tempo. Neki fixture Releji postavljeni su direktno radi kapaciteta; nisu dokaz dozvoljenosti njihovog rasporeda u normalnoj gradnji.

## Šta je reprodukovano i popravljeno

Pre V7 izmene dve savezničke jedinice u jednoj traci ostale su na x≈480/496 bez napretka i nakon 1200 tikova. Sada jedna privremeno ustupa prolaz povlačenjem u sobu, zatim nastavlja isti cilj. Provera potvrđuje granice/radijuse bez preklapanja, pauzu, Stop i odsustvo saveznička prava za neprijatelja. Dodatno je rešeno sklanjanje neaktivnog saveznika koji je blokirao botovog graditelja; Hold se ne sklanja.

Stari test sa zauzetom tačnom destinacijom i nepomičnim blokatorom i dalje prolazi. Ne obećavamo razrešenje proizvoljne gužve desetina jedinica kroz fizički nemoguć prostor; nema teleportovanja radi saobraćaja.

## Mrežna otpornost i vidljivost

- Prave TCP proxy veze daju nominalni RTT 50/150/300 ms uz mali deterministički jitter, sa očuvanim redosledom bajtova.
- Veza je stvarno prekinuta nakon što server izvrši kupovinu, pre nego što odložena potvrda stigne klijentu. Povratak i retry istog sequence-a ne prave drugu obuku i ne naplaćuju ponovo.
- Promena skrivenog neprijateljskog CODE-a i istraživanja daje identičan dozvoljen view u negativnom testu. Tuđi owner, nevažeći argumenti, konflikt istog sequence-a i lažan reconnect token odbijaju se.
- Četiri stvarna WS klijenta imaju timove i odvojene autoritete. Gubitak prvog člana ne završava 2v2; gubitak tima daje jedan rezultat.

Ovo ne dokazuje apsolutnu zaštitu od svake vrste varanja, volumetrijskog DDoS-a ili posrednog curenja informacija. Deljenje savezničke vizije i Senka imaju i zasebne core provere; javni internet stack nije postavljen.

## Duže probe i performanse

Linux okruženje sa 3 vCPU, Node v24.22.1. Stabilnost: 36.000 tick-ova, odnosno **30 simuliranih minuta**, 120 entiteta i 60 populacije po svakom od četiri igrača. Fixture koristi idle/Hold i odvojene grupe, ne neprekidnu masovnu borbu. Dozvoljeni view ostaje serijalizovan. Jedna izdvojena proba zabeležila je p95 oko 0,49 ms, p99 oko 0,59 ms, max oko 7,4 ms i najveći view 23.432 bajta. Istovremeno opterećenje drugim probama menja brojeve; oni nisu obećanje performansi na drugom hardveru.

Bot: 36.000 tick-ova od normalnih 100 CODE i 3 radnika, bez dodatnog novca. Protivnik je neuništiv testni uslov da bi meč trajao. Potvrđeni T3, završeni proizvođači/sidro/kula, sve tri nove obučene vrste i detektor. Poseban planner test pokriva naloge za utovar i hitni teleport; to nije dokaz optimalne transportne strategije u svakoj partiji.

Nisu izvršeni 30 minuta stvarnog wall-clock mrežnog igranja sa punom masovnom borbom, javni WSS test, dva fizička računara ili konačan balans svih startnih položaja. To ostaje OI/integraciona etapa.

## Paket i zavisnosti

ws 8.23.0 je zaključan u package-lock-u. Izvršeni `npm audit --omit=dev --json` prijavljuje 0 poznatih ranjivosti. MIT licenca prati paket. To je stanje provereno tog dana, ne trajna garancija.

Windows isporuka ima zaseban `DELIVERY_REPORT.json`: proverene kontrolne sume, tačnu Node verziju, rezultate lokalnih Node suite-ova i status kratke HTTP/WS probe. Taj izveštaj nastaje tek po izvršavanju na E: disku; ovaj dokument ne pretpostavlja njegov rezultat.

V7 ostaje **kandidat za OI probu**. Prihvaćeni 0.6.2 ostaje sačuvan i nije prepisan.
