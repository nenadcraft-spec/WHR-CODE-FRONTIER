# WHR prototip 0.5 — navigacija i lokalni saobraćaj

Osnova: korisnik je testirao v0.4; GitHub main `c624ebf9018b559ce51130e9b7d91cb30d321210` ima isti sadržaj kao isporučeni v0.4. Nova kopija je odvojena od v0.4.

## OI provera

1. Otvori index.html, pokreni bazu. Dugme **Radijusi** uključuje fizičke krugove bez promene simulacije. Krug modela i fizički radijus nisu ista stvar.
2. Obuči Čuvare/Scouta i T2 Razbijača. Prevuci okvir preko grupe, desnim klikom zadaj kretanje. Velika jedinica prva dobija centralno mesto, druge slobodne tačke sa manevrskim razmakom. To je raspored dolaska, ne taktička formacija.
3. Uoči da mala jedinica i Razbijač ne mogu kroz iste uske prolaze. Pokušaj kretanje oko šume, temelja i zgrada. Dijagonalno sečenje uglova i fizičko presecanje jedinica nisu dozvoljeni.
4. Namerno zatvori prilaz nepokretnom vojskom: putujuća jedinica može čekati bez promene naloga. Posle sekunde bez pomeranja HUD izabrane jedinice prikazuje čekanje; radijus je narandžast. Oslobodi put novim nalogom blokirajućoj jedinici.
5. Radionici ostavi mesta za celu širinu Razbijača. Ako izlaz nije slobodan, završena obuka čeka u redu, bez ponovne naplate. Isto važi za bezbedan dolazak pri Povratnom signalu.
6. Proveri normalnu ekonomiju i gradnju. Nova fizička gužva može promeniti vreme dolaska i prihod; cene, obuka i brzine nisu povećane da prikriju promenu.

## Implementacija

A* dobija keširanu masku prohodnosti za odgovarajući radijus; nova maska prepreka poništava geometrijski keš. Put koristi konzervativne centre ćelija sa dodatnom proverom prvog/poslednjeg segmenta. Kretanje proverava swept krug u odnosu na pravougaone prepreke i kružne jedinice. Lokalno zaobilaženje bira stabilan pravac, skraćuje nepotrebne putne tačke kad postoji čist segment i radi u 20 Hz simulaciji.

Ovaj prvi kandidat još nema rezervacije čitavog uskog koridora, obavezno povlačenje suprotne kolone, optimalni ORCA/RVO solver ili kompletne taktičke formacije. Bezbedno čekanje je dozvoljeno. Početno preklopljene spoljašnje/testne jedinice se ne razdvajaju teleportovanjem; smeju da se udaljavaju. Validna nova proizvodnja/pojava proverava slobodan prostor.

## Dokazi

Novi Node `tests/navigation.cjs` proverava geometriju, mešovitu grupu, brzi Scout, suprotni saobraćaj, zauzet cilj, pauzu/ponovljivost i blokiran izlaz proizvodnje. `tests/navigation-browser.cjs` koristi izdvojene testne jedinice, ali stvarni box-select, grupni desni klik i debug dugme. T2 browser scenario sada pravi raspored sa stvarnim slobodnim izlazom za veliku jedinicu; tesno građenje više nije dozvola za pojavu unutar druge jedinice. Konačni rezultati su u MASTER-u.

Strateški botovi i multiplayer nisu uvedeni u ovom kandidatu. Njihov redosled i uslovi definisani su u zajedničkom MASTER-u.
