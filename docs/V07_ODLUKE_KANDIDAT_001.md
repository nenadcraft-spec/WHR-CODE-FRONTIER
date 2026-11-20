# V7 — kandidatske odluke 001

Datum: 20.11.2026. OI: Beli Zec. **Implementacioni predlozi za igrivu probu; nisu konačno OI potvrđen balans.** Korisnik je odobrio početak V7 kodiranja; otvorene vrednosti uvedene su u odvojeni kandidat i ovde eksplicitno navedene.

| Oblast iz MASTER-a | Kandidat u kodu |
|---|---|
| T3 Centrala | 2500 HP, čuva odnos trenutnog/maksimalnog HP; pauzira samo svoj red obuke; zahteva prazan red pri startu. Ako domaćin pogine, unapređenje se prekida bez refunda; naučen globalni Tier opstaje. Ostale Centrale nemaju besplatnu promenu fizičkog HP. |
| Letelice | Nebeski Čuvar: brzina 4, vid 10, radijus 0.75 ćelije. Mostonoša: brzina 3, vid 9, radijus 1. Let ostaje u granicama; vazdušne jedinice se fizički razdvajaju, ne sudaraju se sa kopnenim jedinicama. |
| Senka | Brzina 4, vid 10, radijus 0.45. Samo kopnene jedinice kao mete; napad počinje 3 s otkrivanja, svaki sledeći ga obnavlja. Primljena šteta sama ne ukida cloak. Neprijatelj bez vizije/detekcije ne dobija njen entitet. |
| Novi proizvođači | Vazdušna luka 900 HP, 5×4 ćelije; Centar prikrivanja 700 HP, 4×4. T3 je preduslov. Sidro 500 HP, 2×2. Grade se u postojećim dozvoljenim zonama. |
| Nebeski Čuvar | Može napasti građevine; neposredna šteta bez posebnog projektila/splash-a. |
| Utovar | Samo sopstveni kopneni putnici, uključujući radnike, heroje i opsadu; najviše 6 populacije. Jedinice prilaze transporteru, ulaze do 2 ćelije kada miruje iznad prohodnog tla. Nema posebne dodatne sekunde ukrcavanja. |
| Putnik | Čuva isti ID, inventar i CODE teret; i dalje zauzima populaciju. Ne kreće se, ne radi, ne napada i ne daje zasebnu viziju dok je ukrcan. Iskrcavanje traži slobodna mesta po radijusu; neiskrcani ostaju u kabini. |
| Smrt transportera | Svi trenutni putnici umiru jednom. Heroj prelazi u postojeće stanje za oživljavanje, sa sačuvanom opremom/XP; ostali koriste postojeću logiku plena. CODE u radničkom teretu se gubi, ne postaje prihod. |
| Teleport | 40 CODE i 60 s cooldown na početku, priprema 5 s. Šteta, uključujući pogodak u štit, Stop, obična zamenska komanda i gubitak sidra prekidaju bez refunda/resetovanja cooldown-a. Cilj je svoje završeno sidro; trenutna vizija nije dodatni uslov. Zauzet vazdušni izlaz čeka; nema kopija putnika. |
| Detektor | Modul dostupan već na T2; 75 CODE / 20 s, domet 8, postojeća kula i limit dve kule. Detekcija traži trenutnu viziju; u 2v2 deli se sa saveznikom kroz timsku viziju. |
| T3 čizme | Upgrade isključivo sa T2 u postojećoj prodavnici, 150 CODE, jedna zaliha, obnova 90 s. Zamenjuje postojeći par; brzina je ukupno 8 ćelija/s. |
| Vitalni kristal | Postojeći predmet/effect: +100 maksimalnog HP heroju, ne slaže se drugi isti predmet. T3 kamp ga daje samo prvi put; nije uveden novi predmet istog imena. |
| 2v2 | Timovi P1+P2 i P3+P4. Zajednička vizija, istraženi teren i detekcija. Svako kontroliše samo svoje jedinice/CODE. Nema savezničkog ukrcavanja, deljenja novca ili friendly fire-a. Tim gubi kada oba člana izgube Centrale i radnike; preostala vojska koristi postojeće naloge i automatsku borbu. |
| Prekid veze | Svet nastavlja; slot i ledger mogu se vratiti tokenom 60 realnih sekundi. Istek označava igrača poraženim; za 2v2 važi timsko pravilo. Pad celog procesa prekida meč, bez trajnog recovery-ja. |
| Pauza | Potrebni su glasovi svih učesnika povezanog meča; jedan opoziv glasa ili prekid veze nastavlja igru. Lokalni dijalog/keymap ne pauzira mrežni svet. |
| Mreža | Node 24/26, ws 8.23.0; protokol 1 + hash core pravila; simulacija 20 Hz, puni dozvoljeni snapshot-i 10 Hz. Fog je bitset, prikaz ne simulira drugi svet. Nema predikcije ni interpolacije protivničkog kretanja u ovom kandidatu. |
| Gužve | Pokušaj propuštanja jednom u sekundi, do 4 plana, do 1024 kandidatske pozicije i 8 A* pokušaja po jedinici u jednom pokušaju propuštanja. Propušta viši ID u paru; neaktivan saveznik može se skloniti ako cilj nije njegovo mesto. Hold se ne pomera; neprijatelj ne dobija saveznička prava. Plan traje do 15 s, zatim se nastavlja prvobitni cilj. Složene gužve i dalje mogu čekati. |

Sve cene i trajanja koja već postoje u T3/Jungle MASTER-u ostaju, uključujući globalni T3 600 CODE / 90 s, limite 12 radnika / 60 kapaciteta / 2 sidra i T3 kamp 05:00 / respawn 240 s. Test finansirana ekonomija nije dokaz balansa.
