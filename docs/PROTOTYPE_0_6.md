# WHR prototip 0.6 — lokalni strateški bot 1v1

Datum: 19.11.2026. Osnova: sačuvani v0.5. Samostalni browser klijent, bez naloga, ključeva i servera.

## Pokretanje i OI provera

1. Otvori index.html i u početnom panelu izaberi **Lokalni 1v1 · protiv strateškog bota**. Izaberi P1–P4. Bot je na dijagonalnoj početnoj poziciji; druga dva slota nemaju igrače meča. Poligon ostaje poseban režim bez strateškog bota.
2. Igraj normalno: bot ima 100 CODE i 3 radnika. Mora da prikupi, plati, izgradi i sačeka obuku. Vidljivi neprijateljski objekti pojavljuju se kroz maglu po istim pravilima.
3. Izvidi botovu bazu. On razvija radnike, Kasarnu/Releje, Scouta i Čuvare; štedi za T2 pa dodaje Akademiju, podršku, Radionicu i Oltar, specijaliste i istraživanja. To je jedan kandidat build-order-a, ne optimalna strategija.
4. Napadni i povuci se: bot bira trenutno vidljive pretnje, brani bazu, povlači ranjenog borca, šalje vojsku prema kampu ili poznatoj početnoj/zapamćenoj neprijateljskoj lokaciji. Pamćenje nije trenutno viđenje.
5. Pauza zamrzava i naloge bota. Reset briše stanje i red komandi. Gubitak svih Centrala i radnika završava lokalni 1v1; reset pokreće novu partiju.

## Arhitektura i ograničenja

UI i bot koriste zajednički dispatcher i iste gameplay validatore. Bot ima izdvojen pogled (`observePlayer`) i samostalni planner (`planBot`), bez čitanja celog sveta. Izvršenje njegovih naloga ne menja game.active, kameru ili selekciju. Botova interna dozvola je odvojena od javnog ljudskog input-a. Bot donosi najviše jednu odluku u sekundi i šalje je za sledeći tick; ljudski UI zadržava neposredan odgovor. Pre mrežnog igranja input oba kontrolera mora dobiti definisan serverovski raspored.

Prilazi radnika resursima, Centrali i gradilištu sada biraju slobodna mesta i ponovo pokušavaju pri dužem zastoju. Promena puta može promeniti transportni tajming/prihod; cene i trajanja nisu povećani da prikriju gužvu. Ne uklanja se fizička kolizija niti teleportuju radnici.

Dijagnostika WHR.snapshot sadrži lokalni red/dnevnik komandi i botove odluke za razvojno testiranje. To nije dozvoljeni mrežni snapshot. Dispatcher nije bezbednosna granica dok ceo svet živi kod klijenta. Direktne stare API funkcije zadržane su za kompatibilnost testova; mrežni server ih ne sme izlagati kao proizvoljne mutatore.

Nisu završeni multiplayer, 2v2, timska vizija, lobby, reconnect, različite težine, napredna ekspanziona politika, oprema/kurirski plan bota ili optimalno rešavanje svih čepova. Prizivanje Bastiona je jednostavna mogućnost pri poseti Svetilištu i dostupnim resursima, nije garantovan tajming u svakoj partiji. Bot može da pobedi ili izgubi pre T2.

## Dokazi

Novi tests/bots.cjs pokriva autoritet, sequence/tick, sledeći tick, skrivene podatke, pamćenje/vidljivost, pauzu/reset, odbranu/povlačenje, ponovljivost, normalan T2 razvoj i kraj meča. Dugi razvojni test zadržava protivnika u životu invulnerable fixture-om, bez dodatnog novca bota. Browser provera bira pravi režim i proverava gradnju/vojsku bota, očuvanu ljudsku kameru, pauzu/reset/P4 i širinu. Rezultati i granice nalaze se u MASTER-u.
