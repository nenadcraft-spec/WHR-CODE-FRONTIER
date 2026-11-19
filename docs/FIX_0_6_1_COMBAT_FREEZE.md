# WHR 0.6.1 — prekid simulacije pri kontaktu vojski

19.11.2026, Europe/Belgrade. Prijavio OI: pri kontaktu njegovih jedinica i bota staju sat i cela igra, ne samo jedinice.

## Ponovljen uzrok

U 0.6 borbena potera čuva `u.dest = t`, gde je `t` živa neprijateljska jedinica. Kada jedinice izaberu jedna drugu, nastaje kružna veza. `observePlayer` pokušava da serijalizuje sopstvene jedinice i baca `TypeError: Converting circular structure to JSON`. Pošto frame zakazuje sledeći frame tek na kraju, greška prekida simulaciju i iscrtavanje. Node reprodukcija dve grupe od po četiri Čuvara pada već u prvom tick-u na originalnom 0.6 kodu.

## Ispravka

Sva dodeljivanja destinacije sada kopiraju samo `{x, y}`: pokret, grupni fallback, isporuka, gradnja/nastavak, popravka i borbena potera. Borbeni ID mete ostaje odvojen i nastavlja da se proverava. Time se uklanja kružna veza; greška se ne prikriva catch-om ili izbacivanjem podataka prilikom serijalizacije.

## Regresione provere

- `tests/combat-contact.cjs`: dve protivničke vojske, kontakt, šteta i smrt, svet i botov pogled serijalizuju se svih 1.200 tick-ova; destinacija ima samo konačne x/y; pokretna meta ne ostaje deljena referenca; ponovljivost, pauza i komande posle kontakta.
- `tests/combat-contact-browser.cjs`: stvarni frame loop sa bot režimom i izdvojenom testnom vojskom; vreme napreduje posle smrti, snapshot radi, pauza/nastavak/kamera odgovaraju i nema pageerror-a. Testni prikaz 5 FPS uz 20 Hz simulaciju.
- Prethodne Node i browser provere pokrivaju ekonomiju, gradnju, T2 sadržaj, navigaciju, botove i HUD. Rezultati su u priloženom test izveštaju.

Ovo je pronađen i ponovljen uzrok prijavljene blokade. Nije tvrdnja da su svi mogući problemi borbe i saobraćaja završeni. Već prekinuta nesnimljena partija nema implementiran save/recovery; posle ispravke potreban je reload i nova partija.
