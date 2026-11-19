# WHR CODE FRONTIER

Originalni RTS u razvoju: OI/AI klase, CODE ekonomija, četiri džungle i planirani 1v1/2v2 režimi za ljude i botove.

## Prototip 0.3 — HUD i hotkeys

Otvorite `index.html` direktno u desktop pregledaču. Bez instalacije, CDN-a i API ključeva.

- Kompaktan HUD, bojište preko viewport-a i kontekstualne komande.
- Podesivi hotkeys za jedinice, zgrade, grupe i lokacije: jedan pritisak skače na cilj. Panel **Hotkeys** vodi kroz dodelu i zamenu; nova partija briše dodele.
- Dugme **↶** vraća prethodni kadar, a **Neaktivni** nalazi slobodnog radnika.
- Kvadratna mapa 160 × 160 mapnih jedinica, prostrane baze, dva izlaza po bazi i četiri CODE proširenja.
- Početna kamera kod sopstvene baze; dugme **Baza**, minimapa, zoom i pregled **Cela mapa**.
- Tri radnika automatski skupljaju i isporučuju CODE. Proizvodnja do pet T1 radnika i jednog Scouta.
- Radnik gradi **Kasarnu, CODE Relej i novu Centralu**. Preview lokacije, stvarni blokirajući otisak, put do gradilišta i vreme rada.
- Zaustavi radnika, nastavi desnim klikom na gradilište ili otkaži gradnju uz dokumentovan povraćaj CODE-a.
- Relej dodaje kapacitet tek kad se završi; nova Centrala prima isporuke i proizvodi, ali ne zaobilazi globalni limit radnika.

**Nema još borbe, vojnika iz Kasarne, aktivnih kampova/prodavnica, magle rata ili multiplayer servera.** Scout zasad služi kretanju. Ostale tri baze samo pokreću radničku ekonomiju za poređenje. Grafika je proceduralna skica.

## Kontrole

Levi klik bira; prevlačenje bira grupu; desni klik zadaje pokret, rudarenje ili nastavak gradnje. Izaberite radnika pa **B** (Kasarna), **R** (Relej), **C** (Centrala). Levi klik potvrđuje mesto, Escape/desni klik odustaje od preview-a. **H** zaustavlja radnika. **X** ili dugme otkazuje izabrano gradilište. **W/S** proizvode radnika/Scouta iz izabrane Centrale. **G** vraća radnika na CODE; Space pauzira, strelјice pomeraju kameru. Dodeljeni hotkey ima prednost nad podrazumevanom komandom tek posle eksplicitne potvrde zamene u editoru.

## Dokumentacija i provere

- [Prototip 0.3: HUD, prečice i granice](docs/PROTOTYPE_0_3.md)
- [Prototip 0.2: pravila i granice](docs/PROTOTYPE_0_2.md)
- [MASTER dokumenti](docs/README.md)
- [Istorijski zapis prototipa 0.1](PROTOTYPE.md)

```sh
node --check script.js
node tests/economy.cjs
node tests/construction.cjs
```

Browser provere: `node tests/browser.cjs` i `node tests/hud.cjs`, uz Playwright i Chromium (`WHR_CHROMIUM_PATH` za izvršni fajl). Snimci idu u privremeni folder ili `WHR_TEST_OUTPUT`.

GitHub Pages može služiti klijent sa objavljene grane; ne zamenjuje budući multiplayer server. Prvo proveravamo geometriju i ekonomiju, zatim širimo borbu i sadržaj.
