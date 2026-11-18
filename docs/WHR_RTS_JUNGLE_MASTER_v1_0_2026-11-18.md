# WHR RTS — JUNGLE MASTER v1.0

Datum: 18.11.2026. · Status: predlog za prototip, balans NOT_RUN.

## Mapa
Četiri unutrašnja sektora označena od OI predstavljaju džungle. Svaka ima T1 kamp bliže bazi, T2 kamp uz bočni unutrašnji put, T3 kamp prema centru i neutralnu prodavnicu. Ukupno 12 kampova i četiri prodavnice. Ulazi: spoljni put, centralni prilaz i bočna veza. Kamp ne blokira jedini prolaz. Svi igrači mogu napasti svaki kamp. Centralno CODE jezgro je zaseban cilj bez definisanog boss sistema.

## Kampovi
| Kamp | Sastav | Nagrada celog kampa | Prva pojava | Obnova |
|---|---|---|---|---|
| T1 | 2 × 120 HP; 6 štete na 1,5 s | 30 CODE + 40 XP | 00:30 | 90 s |
| T2 | 3 × 220 HP; 10 štete na 1,5 s | 60 CODE + 90 XP | 02:00 | 150 s |
| T3 | Vođa 700 HP, 25 štete na 2 s; 2 T2 pratioca | 120 CODE + 180 XP | 05:00 | 240 s |

Protivnici su kopneni; napadaju kopnene i vazdušne jedinice, domet 5. Težina nije Tier zabrana pristupa i ne skalira automatski sa igračevim Tier-om.

## Obnavljanje
Tajmer počinje smrću poslednjeg člana. Bez potpunog čišćenja nema nove grupe. Nema stacking-a niti blokiranja spawn-a wardovima/jedinicama. Upozorenje 5 s pre pojave; jedinice na spawn mestu pomeraju se na najbližu slobodnu poziciju bez štete. OPEN: bezbedan fallback ako takvo mesto ne postoji, geometrija spawn zone i posledice pomeranja jedinica.

Ova specifikacija zamenjuje staro T1 pravilo bez respawn-a. T2 nagrada ajtemom precizirana je u nastavku. Prethodni MASTER-i ostaju sačuvani kao originalne verzije.

## Aggro i povratak
Napad po primljenom napadu ili prilasku na 4 jedinice; gonjenje najviše 10 jedinica od početne pozicije. Bez dostupne mete 3 s: povratak. Pri povratku nema napadanja, primanja štete ili nagrada. Po povratku HP do maksimuma za 5 s. Poginuli članovi ostaju mrtvi do obnove cele grupe. OPEN: brzina, izbor mete, reagovanje na nevidljivost i uslov ponovnog aggro-a tokom oporavka.

## Nagrade i doprinos
CODE se pri potpunom čišćenju deli igračima prema stvarnoj šteti celoj grupi, bez overkill-a. Nagrada jednom po generaciji kampa. Potpun reset kampa briše prethodni doprinos; precizirati kako se tada tretiraju ranije poginuli članovi i ponderi doprinosa. XP prati udeo igrača samo ako njegov živ heroj stoji do 12 jedinica od centra pri čišćenju. Scout/radnici/vojska ne dobijaju herojski XP. OPEN: integer zaokruživanje, nepreuzeti XP, doprinos poraženih igrača i događaji istog tick-a.

## Predmeti
T1 bez predmeta. T2: Paket prve pomoći pri prvom čišćenju. T3: Vitalni kristal pri prvom čišćenju. Sledeće generacije daju samo CODE/XP. Predmet ide u torbu plena kampa: 15 s ekskluzivno igraču sa najvećim doprinosom, zatim svima sa odgovarajućim inventarom. Scout može preuzeti i dostaviti. OPEN: tie-break, kapacitet/životni vek torbe, preuzimanje od saveznika i precizna pravila herojevog inventara.

## Vizija
Magla rata ostaje aktivna. Minimap pamti poslednje viđeno stanje kampa. Tačan respawn tajmer dostupan timu samo ako je video potpuno čišćenje. Server ne otkriva protivniku neviđeno čišćenje kroz UI ili mrežne podatke. Timska podela vizije zahteva posebno pravilo.

## Provere — NOT_RUN
Simetrične stvarne putanje; dvanaest kampova; rasporedi prvog spawn-a; jednokratne nagrade; reset i doprinos; respawn bez zarobljavanja; vidokrug/tajmeri; vazdušne i nevidljive mete; inventar i loot; kontrola inflacije CODE/XP tokom cele partije.

Izvor: korisnikova definicija džungle i predlog WHR JUNGLE V1 iz ove sobe. Ne predstavlja kopiju kompletnih Dota/LoL pravila niti testiran balans.
