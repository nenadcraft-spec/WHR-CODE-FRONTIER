# WHR 0.6.2 — upravljanje

Kandidat za OI test, 20.11.2026. Osnova: 0.6.1 sa očuvanom ispravkom blokade pri susretu vojski.

## Brza proba

1. Otvori `index.html`, izaberi poligon ili lokalni 1v1.
2. Izaberi radnika, Ctrl+1 pamti grupu, Shift+1 dopunjava. Pritisni 1: selekcija, kamera i komande prate grupu. U Hotkeys možeš mapirati F1 ili drugi podržani taster; lokacija menja samo kameru. Opcioni klasični režim bira prvim, centrira drugim brzim pritiskom.
3. Kameru pomeraj ivicom ekrana, srednjim dugmetom i prevlačenjem minimape. Brzina i smer srednjeg povlačenja su u Hotkeys podešavanjima.
4. Izaberi proizvođača i desnim klikom postavi rally. Y takođe otvara izbor cilja. CODE rally šalje nove radnike na rudarenje, a borce na mesto okupljanja. Sopstvena jedinica može biti prateća meta. Više zgrada deli novu rally komandu, uz odvojene proizvodne redove.
5. Izaberi radnika: B i klik za Kasarnu; drži Shift, R i klik za Relej; Escape završava postavljanje, Shift+desni klik na CODE dodaje skupljanje. Buduća gradnja rezerviše CODE, ali još ne pravi objekat. Obična nova komanda zamenjuje red.
6. A i klik na teren = Attack-move; J = Hold; P = Patrol; V = Follow. H = Stop. Shift dodaje zadatke, a dugme za brisanje čekajućih naloga čuva tekući zadatak. Tab menja aktivni tip unutar mešovite selekcije.

## Provere i granice

Sintaksa, 97 Node provera i sedam Chromium scenarija prošli. Testovi i detaljni rezultati opisani su u [MASTER-u](WHR_GAME_ENGINE_HOTFIX_0_6_2_UPRAVLJANJE_MASTER_v1_0_2026-11-20.md). OI proba osećaja upravljanja još nije izvršena.

Nema preuređivanja pojedinačnih naloga. Trajni Hold/Patrol/Follow zadržavaju naredne zadatke dok ne budu prekinuti. Blokirani radovi čekaju; ne garantujemo prolaz velike vojske kroz tesnac. Ovo je lokalni poligon/bot, bez mrežnog multiplayer-a. Grafika i pravila T1/T2 ostaju postojeći razvojni prikaz.
