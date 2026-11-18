# WHR CODE FRONTIER — projektna osnova

Status: specifikacije za prototip. Igrivi klijent, server i runtime testovi još nisu dodati ovom promenom.

## MASTER dokumenti

- [Ekonomija i vreme](WHR_RTS_RESURS_VREME_MASTER_v1_0_2026-11-18.md)
- [Tier 1](WHR_RTS_TIER_1_MASTER_v1_0_2026-11-18.md)
- [Tier 2](WHR_RTS_TIER_2_MASTER_v1_0_2026-11-18.md)
- [Tier 3](WHR_RTS_TIER_3_MASTER_v1_0_2026-11-18.md)
- [Džungla](WHR_RTS_JUNGLE_MASTER_v1_0_2026-11-18.md)

## Redosled odluka

Dokumenti čuvaju verzije razgovora. Ekonomija daje osnovu; Tier dokumenti je preciziraju. T2 definiše Tier kao nivo celog igrača. T3 dodaje protivvazdušni napad Strelcu i kuli već na T2. Jungle MASTER zamenjuje T1 pravilo bez respawn-a i precizira garantovane predmete samo pri prvom čišćenju.

Sve brojke su kandidati za balans, ne dokaz testirane igre. OPEN stavke zahtevaju eksplicitnu odluku; implementacioni predlozi nisu automatski nova pravila.

## Prvi razvojni koraci

1. Uskladiti otvorene odluke koje blokiraju prototip: geometrija mape, redovi/rezervacije, inventar, poraz i reset kampova.
2. Izgraditi lokalnu simulaciju sa fiksnim tick-om, bazom, tri radnika i CODE ciklusom.
3. Dodati selekciju/kretanje, Scouta, Kasarnu i Čuvara; proveriti ekonomiju i putanje.
4. Dodati džunglu i razvoj heroja, zatim T2/T3 mehanike.
5. Povezati autoritativni multiplayer server i lobi za ljude/botove; proveriti 1v1 i 2v2.

GitHub Pages može služiti klijent. Sam po sebi ne obezbeđuje server za zajedničku partiju. Koncept slike iz razgovora tek treba dodati kao stvarne asset fajlove; nisu deo ovog PR-a.
