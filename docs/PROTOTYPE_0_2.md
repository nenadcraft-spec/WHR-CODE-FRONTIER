# WHR CODE FRONTIER — mapa i gradnja 0.2

Datum: 18.11.2026. · Status: lokalni igrivi poligon, balans kandidat.

## Promene u odnosu na 0.1

Mapni kandidat sada ima 160 × 160 logičkih jedinica, jednu jedinicu po navigacionoj ćeliji i 16 render jedinica po logičkoj jedinici. Početne baze su na (20,20), (140,20), (20,140), (140,140). Render svet je 2560 × 2560; zoom ne menja simulaciju.

Svaka početna zona ima 32 × 32 jedinice građevinskog prostora pre oduzimanja blokatora. Dva izlaza su stvarni otvori u obodnom zidu/plato maski. Rampe imaju usklađen prikaz i prohodnost; visinski borbeni bonusi nisu uvedeni.

Postoje četiri dodatna polja, po jedno uz svaki ugao, sa zasebnom označenom građevinskom čistinom. **Implementacioni kandidat:** proširenja imaju šest običnih čvorova po 1000 CODE, jednako kao početna polja. Ukupno je 48 čvorova, 48.000 CODE u terenu. Bogati centralni čvorovi još nisu uvedeni.

Početna kamera prati sopstvenu bazu. Cela mapa i minimapa služe strateškom pregledu. Terenski crtež se kešira, a render i navigacija koriste istu definiciju mapa/blokatora.

## Gradnja

| Objekat | Cena | Rad | Otisak | HP |
|---|---:|---:|---:|---:|
| Kasarna | 120 CODE | 35 s | 5 × 4 jedinice | 800 |
| Relej | 60 CODE | 20 s | 2 × 2 | 400 |
| Centrala | 300 CODE | 60 s | 6 × 6 | 1500 |

Pravila:

- Samo sopstveni radnik i dozvoljena sopstvena početna/ekspanziona zona.
- Preview se poravnava sa mrežom; odbija teren, postojeći objekat, CODE, zauzetost jedinicom, glavne puteve, rampe i rezervisani radnički koridor.
- Cena se skida jednom pri prihvatanju. Otisak odmah rezerviše prostor i menja navigaciju.
- Radnik mora stići do slobodnog oboda gradilišta. Tek tada počinje 35/20/60 sekundi rada. Ne rudari dok putuje i gradi, a već skupljen teret zadržava.
- Jedan radnik po gradilištu. H ili nova naredba odvaja radnika i čuva napredak; desni klik radnikom nastavlja rad.
- Po završetku radnik ponovo skuplja/isporučuje CODE. Relej tek tada daje +5 kapaciteta, do T1 maksimuma 20.
- Završena nova Centrala prima isporuke i ima svoj proizvodni red. Limit pet radnika i jednog Scouta, uključujući naručene u svim Centralama, ostaje globalan.
- Otkazivanje izabranog gradilišta: 100% refund pre prvog tick-a rada; 75% posle početka, zaokruženo nadole. Nema ponovnog refund-a.
- Proizvodni posao bez slobodnog izlaza čeka na kraju reda bez dodatne naplate. Završena Kasarna za sada nema proizvodnju vojske.

## Navigacija i ograničenja

Statičke prepreke, CODE čvorovi i građevine čine navigacionu mrežu. Put se ponovo računa pri promeni blokatora. Ne presecanju se dijagonalno blokirani uglovi. Ako nema puta, radnik zadržava teret i čeka/ponovo pokušava; ne isporučuje na daljinu.

Zaštićene no-build zone čuvaju glavne rute. Nije implementiran opšti dokaz da nijedna kombinacija zgrada ne može zarobiti bilo koju jedinicu na bilo kom mestu; veličina velikih jedinica i fizičko međusobno izbegavanje još zahtevaju sledeći korak. Navigacija radnika/Scouta koristi tačku centra sa rezervisanim grid prostorom, bez univerzalnog radijusa za sve buduće jedinice.

Cela mapa je otkrivena u ovom poligonu. Zato još nema uslova da igrač prvo izviđa teren za gradnju. Šuma trenutno blokira kretanje, ne računa liniju vida. Kampovi, prodavnice i centralni cilj su neinteraktivne oznake. Nema borbe, smrti, heroja, predmeta, T2/T3 ili mrežne partije. Druge baze nisu borbeni botovi.

Skrivanje taba pauzira lokalni poligon. Simulacioni sat, rad i proizvodnja ostaju povezani; pri velikom zastoju browsera igra može usporiti u odnosu na stvarno vreme. To nije model budućeg online servera.

## Validacija ove verzije

- JavaScript syntax: PASS.
- Devet ekonomskih/navigacionih provera: PASS.
- Jedanaest provera gradnje i nove mape: PASS — plaćanje i rezervacija, dolazak pre rada, tačno trajanje, prekid/nastavak/pauza, refund bez dupliranja, kapacitet Releja, globalni limit preko dve baze, odbijanje zabranjene gradnje, novo računanje putanje, pristup kampovima i proširenjima, simetrična ekonomija i odgovarajuće rute do proširenja.
- Posle 180 simulacionih sekundi bez trošenja: **700 CODE po igraču**, uključujući početnih 100. Nova geometrija menja prihod u odnosu na 565 iz stare mape; ovo nije dokaz konačnog balansa.
- Odgovarajuće rute do centara navigacionih ćelija pri prvim proširenjima: jednaka dužina. To ne dokazuje ravnopravnost svih slobodno izabranih klikova ili strategija.
- Chromium/Playwright: proizvodnja, pauza, početni zoom, stvarni canvas izbor/preview/postavljanje, odbijanje zabranjenog mesta, gradnja i njen nastavak, završetak, kapacitet, otkazivanje, cela mapa, reset/P4, Escape iz preview-a, uska širina i odsustvo JS page grešaka: PASS. Browser test koristi virtuelni sat radi ponovljivog testiranja tajmera.
- Vizuelno pregledani kadar baze i pregled cele mape. Potpuna touch kontrola i sve rezolucije nisu proverene.

Sledeće: lokalne borbene jedinice, kampska logika i provera većih radijusa/gužve, uz zadržavanje pregledne gradnje. Izgled modela i teksture dolaze na ovu geometrijsku osnovu.
