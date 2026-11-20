# WHR V7 — katalog koda, odluke i probni zadaci

Datum: 20.11.2026. Status: **priprema; primeri nisu WHR server niti izvršeni testovi.**  
Prateći dokument: [istraživanje multiplayer-a](WHR_V07_MULTIPLAYER_ISTRAZIVANJE_v1_0_2026-11-20.md).

## 1. Proverene polazne tačke

Ne preuzimati ceo tuđi engine. Za svaku primenu izdvojiti mali uzorak, sačuvati licencu i proveriti ga u našem ugovoru.

| Potreba | Izvor koda/dokumentacije | Šta uzimamo kao obrazac | Šta ne dobijamo automatski |
|---|---|---|---|
| HTTP→WebSocket upgrade i autentifikacija | [ws README: client authentication](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/README.md#client-authentication) | `noServer`, kontrola pre `handleUpgrade` | Primer namerno ne implementira proveru identiteta |
| TLS transport | [ws: external HTTP/S server](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/README.md#external-https-server) | Odvojena HTTP/S infrastruktura i WS | Sertifikat, domen i hosting nisu podešeni |
| Heartbeat i cleanup | [ws: broken connections](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/README.md#how-to-detect-and-close-broken-connections) | Ping/pong i oslobađanje intervala | Reconnect slota i nastavak meča ostaju naš posao |
| Veličina i izlazni bafer | [ws API](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/doc/ws.md) | `maxPayload`, `bufferedAmount`, `perMessageDeflate` | Nema politike šta zameniti/sačuvati kada klijent kasni |
| Sobe i fiksni korak | [Colyseus Room.ts](https://github.com/colyseus/colyseus/blob/31bb1a8bd1359d742c104a370cb32eb5cdf69721/packages/core/src/Room.ts) | `setFixedTimestep`, životni ciklus, rezervacija mesta | Ne kopirati neproverenu HEAD funkciju u drugi npm paket |
| Razlika callback-a i logičkog koraka | [Colyseus server input/timestep](https://docs.colyseus.io/netcode/server-input) | Fiksni korak izričito odvojiti od izmerenog delta vremena | Naš 20 Hz se ne dobija proizvoljnim pozivom bez usklađivanja jedinica API-ja |
| Per-client stanje | [Colyseus StateView](https://docs.colyseus.io/state/view) | Označena polja i selektivni entiteti | Fog, sećanja i detekcija su WHR pravila |
| Rezervacija slota pri padu veze | [Colyseus reconnect](https://docs.colyseus.io/room/reconnection) | Eksplicitno zadržavanje mesta i token | Trajno čuvanje meča posle pada servera |
| Ack/retries ugovor | [Socket.IO delivery](https://socket.io/docs/v4/delivery-guarantees/) | Razlikovati pokušaj dostave i jedinstveno dejstvo | Retry bez deduplikacije može ponoviti naplatu |
| Privremeni recovery | [Socket.IO recovery](https://socket.io/docs/v4/connection-state-recovery/) | Prozor oporavka i fallback u novi snapshot | Recovery ne garantuje svaki povratak |
| Pravi i lažni WS test | [Playwright mock](https://playwright.dev/docs/mock) i [WebSocketRoute](https://playwright.dev/docs/api/class-websocketroute) | Razdvojiti mock od konekcije ka pravom serveru | Mock uspeh nije mrežna partija |
| Kašnjenje/prekid | [Toxiproxy README](https://github.com/Shopify/toxiproxy/blob/main/README.md) | Kontrolisano opterećenje oba smera TCP veze | Nije ubačen niti pokrenut u WHR |
| Merenje procesa | [Node perf_hooks](https://nodejs.org/api/perf_hooks.html) | Vreme koraka i event-loop opterećenje | Nema podrazumevanog dokaza da WHR stiže u 50 ms |
| Javni proxy | [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) | WS upgrade i životni ciklus veze | Restart/reload ponašanje proveriti na stvarnoj konfiguraciji |
| Gužva | [ORCA autori](https://gamma.cs.unc.edu/ORCA/), [RVO2 izvor](https://github.com/snape/RVO2), [licenca](https://github.com/snape/RVO2/blob/main/LICENSE) | Lokalno uzajamno izbegavanje kao istraživački obrazac | Ne rešava samo po sebi naše tesnace, Hold, rat i prioritete |
| Pomoć pri razvoju | [OpenAI Codex](https://learn.chatgpt.com/docs/codex/cli) | Pregled koda, izvršavanje alata i review | Model nije autoritet servera ili zamena za izvršen test |

ws source snapshot: `0cc9185755faa9b92b9efd566a8ee9f65fffd923`. Colyseus source snapshot: `31bb1a8bd1359d742c104a370cb32eb5cdf69721`, default grana **master**, ne main. Oba su pregledani izvori, ne dokaz da npm arhiva ima isti sadržaj. Pokretne docs/main stranice ponovo proveriti pre direktnog preuzimanja. Nije kopiran ili instaliran tuđi izvršni kod.

## 2. ADR-001 — transport (predlog)

**Kontekst:** WHR već ima JavaScript simulaciju i Node testove; potrebna je mreža za 2/4 klijenta i veoma specifična vidljivost.

**Predlog:** prvi dokaz radi sa Node LTS + ws i eksplicitnim filtriranim JSON DTO-om. Browser koristi native WebSocket. Prva iteracija koristi pune filtrirane snapshot-e, bez predikcije celog sveta, binarne kompresije ili Redis-a. Racionala: najmanji prenos postojeće simulacije, pregledan payload i jednostavnija dijagnostika skrivenih podataka.

**Cena odluke:** WHR mora implementirati lobby, sesije, reconnect, ledger, DTO/publisher i testove. Ako to postane skuplje od adaptera u Colyseus, isti probni scenariji služe za poređenje. Socket.IO se ne dodaje preko ws samo radi nekoliko pogodnosti.

**Status:** PROPOSED; nije benchmark pobednik niti konačno prihvaćen runtime izbor. Zaključavanje sledi P0–P5 dokaze iz istraživanja. Kriterijumi: ispravnost autoriteta/skrivenih podataka prvo, zatim složenost i izmereni CPU/RAM/bandwidth.

## 3. Nacrt kontrolnog toka — originalni pseudokod

Ovo nije runnable primer; nazivi predstavljaju odgovornosti budućeg koda, nisu postojeći WHR API.

```text
onMessage(socket, bytes):
    reject if unauthenticated, oversized, over quota or wrong protocol
    command = parseAndValidateAllowedSchema(bytes)
    owner = sessionOwner(socket)              // never trust payload.owner
    key = serverAssignedEpochAndSequence(command)
    if key already resolved: return cached permissible outcome
    reject conflicting/expired/replayed key without applying again
    reserve ledger slot as queued
    append bounded command to authoritative match queue

onFixedTick(match):
    for command in bounded stable order:
        validate against current authoritative state
        apply once through gameplay validators or reject
        resolve ledger and send permissible terminal outcome
    step world by exactly one logical WHR tick
    build each player/team view using explicit field allowlists
    publish bounded revisioned state, resync slow clients as needed
```

Precizirati da li `step` već obrađuje komande i povećava tick; ne izvršavati isti red dvaput. Greška usred handler-a ne sme ostaviti polunaplaćenu transakciju. Validacija pre mutacije i stabilan rezultat važniji su od pukog try/catch-a.

## 4. Polja koja klijent treba i ne treba da dobije

| Podatak | Vlasnik | Saveznik | Vidljiv neprijatelj | Neviđen neprijatelj |
|---|---|---|---|---|
| Pozicija/HP/model | Da | Po timskom pravilu | Dozvoljeni borbeni prikaz | Samo zamrznuto sećanje ako je predviđeno |
| CODE i rezervacije | Da | OPEN, predlog ne | Ne | Ne |
| Proizvodni i Shift red | Da | OPEN, predlog ne | Ne | Ne |
| Trenutni borbeni događaj | Dozvoljeni događaji | Po timskom vidu | Samo u dozvoljenom vidu | Ne, osim izričitog javnog pravila |
| Prikrivena Senka | Da | Po timu | Samo uz otkrivanje/detekciju | Ne |
| Token sesije | Samo bezbedan sesijski tok | Ne | Ne | Ne |
| Dijagnostički ceo svet | Samo kontrolisano lokalno razvojno okruženje | Ne | Ne | Ne |

Team pravila O10 čekaju OI odluku. Do tada napraviti zasebne testove za opcije, ne proglasiti proizvoljno deljenje prava.

## 5. Izvršivi zadaci kada počne kodiranje

1. Sa potvrđenog merge commit-a napraviti izolovanu radnu kopiju. P0 proverava izdvajanje core-a bez mreže; stari testovi se ne prepisuju da bi prikrili regresiju.
2. Izraditi schema/DTO ugovor za postojeće T1/T2 komande i dodati negativne primere pre mrežnog handler-a.
3. Dodati jedan testni match runner, dva klijenta i jednu vidljivu/skrivenu jedinicu. Proveriti sirove poruke.
4. Dodati gradnju sa ack/ledger-om; prekinuti vezu u prozoru posle izvršenja a pre potvrde; vratiti isti slot i proveriti jedno dejstvo.
5. Meriti snapshot veličinu, vreme tick-a i izlazni bafer. Tek onda uvoditi delte/kompresiju ako imaju opravdanje.
6. Uporediti sa Colyseus adapterom samo ako prvi dokaz pokaže konkretan nedostatak; zabeležiti razlog promene.
7. Uključiti T3 po zatvaranju O01–O09, timsku viziju/rezultat po O10, zatim dva računara i četiri klijenta.

**Nijedan od ovih zadataka nije izvršen ovim istraživanjem.** API ključevi, javni hosting, instalacije i gameplay kod nisu menjani.
