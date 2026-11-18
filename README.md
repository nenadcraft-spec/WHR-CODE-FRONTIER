# WHR CODE FRONTIER

Originalni WHR RTS u razvoju: OI/AI klase, CODE ekonomija, četiri džungle i planirani režimi 1v1/2v2 za ljude i botove.

## Prototip 0.1

Otvorite `index.html` u desktop pregledaču. Radi direktno iz lokalnog foldera, bez instalacije ili API ključeva. Prvi korak je lokalni ekonomski poligon: mapa, izbor baze, tri radnika koji rudare i isporučuju CODE, proizvodnja radnika do limita pet, Scout i selekcija/kretanje jedinica.

Levi klik bira, prevlačenje bira grupu, desni klik zadaje kretanje ili skupljanje. W/S proizvode radnika/Scouta uz selektovanu Centralu. G skuplja, H zaustavlja, Space pauzira. Točkić zumira, strelјice pomeraju kameru.

**Nema još mrežne partije, borbenog protivnika, magle rata ili funkcionalnih kampova/prodavnica.** Te lokacije su označene kao planirani sadržaj. Ostale baze služe poređenju ekonomije. Vizuelni prikaz je proceduralna skica, a ne završena koncept grafika.

- [Detalji prototipa i validacija](PROTOTYPE.md)
- [MASTER dokumenti i redosled odluka](docs/README.md)

## Provera

```sh
node --check script.js
node tests/economy.cjs
```

Browser provere su u `tests/browser.cjs` i zahtevaju Playwright i instaliran Chromium (putanja preko `WHR_CHROMIUM_PATH`).

GitHub Pages može služiti ovaj klijent po objavljivanju odgovarajuće grane. Multiplayer će zahtevati poseban autoritativni server.
