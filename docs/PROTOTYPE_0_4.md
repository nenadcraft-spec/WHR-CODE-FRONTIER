# WHR prototip 0.4 — lokalni T1/T2 kandidat

Datum: 19.11.2026. Osnova: stabilni v0.3, main `1256b83845a4b20851cf75c4098289e72f4115dc`.

## Redosled provere igrača

1. Pokreni P1; izaberi radnika, proveri isporuke CODE-a i napravi Kasarnu/Relej. Čuvar se obučava u Kasarni. Kula ima najviše dva primerka uključujući gradilišta. Radnik popravlja završene sopstvene zgrade, 10 HP za 1 CODE u sekundi.
2. Izaberi Centralu sa praznim redom, pokreni T2: 300 CODE/60 s. Njena obuka čeka, isporuke i drugi proizvođači rade. Dobija se globalni T2, limit 8 radnika i plafon 40 populacije preko Releja; nema besplatnih jedinica ili dodatne populacije.
3. Radnikom napravi Akademiju, Stanicu podrške, Radionicu i Oltar. Strelac traži završenu Akademiju i Kasarnu; Bolničar dolazi iz podrške, Razbijač iz radionice. Akademija istražuje alate, Čuvare i optiku jednom za igrača.
4. Scoutom izviđaj prolaz do prodavnice. Desni klik na prodavnicu zadaje prilazak i otvara panel. Kupovina traži viziju, rastojanje do 2, cenu i zalihu. Čizme T2 zamenjuju T1 par; torba zauzima slot i povećava kapacitet na šest.
5. Scoutom poseti centralno Svetilište, izaberi Bastion/Pulsar/Eho. Jedan izbor po igraču, 200 CODE/30 s/4 pop. Heroj dolazi kod sopstvene završene Centrale. D/F aktiviraju prvu/drugu sposobnost; sposobnosti sa metom traže sledeći klik. Druga zahteva T2.
6. Predaj opremu heroju preko inventara (→ pa klik). Prva pomoć leči tokom vremena i prekida se štetom; Povratni signal zahteva četiri sekunde bez prekida. Smrt heroja zadržava izbor/XP/opremu; Oltar ga vraća za 100 CODE/45 s/4 pop.
7. T1 kampovi dolaze u 00:30, T2 u 02:00. NPC imaju aggro i povratak; nagrade zavise od stvarnog doprinosa, XP od blizine heroja. T2 prvi plen je prva pomoć. Respawn T1 90 s, T2 150 s od čišćenja. Ako nema slobodnih mesta u kampu, pojava čeka i ponovo proverava nakon sekunde.
8. Proveri maglu i minimapu; protivničke jedinice izlaze iz prikaza kada izgube viziju. Zapamćeno stanje kampa ne treba da otkriva neviđeno čišćenje. Mapiraj F1 na radnika, pomeri ga i proveri da jedan F1 prati novu lokaciju bez promene njegovog naloga.

## Pravila i namerne granice

Detaljne cene, tajming, sposobnosti i odluke nalaze se u [v0.4 MASTER-u](WHR_RTS_V04_T1_T2_IMPLEMENTACIJA_MASTER_v1_0_2026-11-19.md). Izvorni istorijski MASTER-i nisu prepisani. Otvorene vrednosti sada imaju jasno označene implementacione kandidate.

Nema online multiplayer-a, strateških botova, LOS-a kroz teren, fizičkog clearance-a velikih jedinica, lokalnog izbegavanja vojske, T3 sadržaja, replay-a niti integracije boja iz drugog projekta. Lokalni poraz ne predstavlja kompletan model pobednika online meča. Mobilna širina je proverena za raspored, ne predstavlja potvrđeno upravljanje dodirom.

## Automatizovana provera

Node suite-ovi proveravaju ekonomiju/navigaciju, gradnju i nove T1/T2 transakcije, tajminge, prekide, ograničenja i negativne slučajeve. Browser suite-ovi proveravaju stvarni input za gradnju, kompaktan HUD, keymapiranje, pa izolovan finansiran tok kroz T2 zgrade, istraživanja, vojsku, shop i heroja. Testni CODE se dodaje samo presretnutom kopiranom odgovoru `script.js`, nikada produkcionom fajlu. Rezultati izvršavanja i granice dokaza upisani su u MASTER-u.
