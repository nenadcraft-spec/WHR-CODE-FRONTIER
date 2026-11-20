# WHR V7 — multiplayer: istraživanje, izvori i priprema

Datum: 20.11.2026, Europe/Belgrade. OI: Beli Zec. Priprema: Codex.  
Veza: [V7 MASTER](WHR_GAME_ENGINE_V07_MASTER_v1_0_2026-11-20.md).  
**STATUS: istraživanje i predlog arhitekture; V7 server nije implementiran, instaliran, testiran ili objavljen.**

## 1. Zaključak za naš projekat

Predlog za prvi tehnički dokaz: **podržani Node LTS + ws + browser WebSocket + postojeći WHR core**, autoritativni server, filtriran pogled za svakog igrača. Koristimo postojeću logiku ekonomije, borbe i komandi. Ne pravimo drugi game engine unutar mrežne biblioteke.

Ovo je preporuka na osnovu pregledanog koda, a ne rezultat benchmark-a. Konačno zaključavanje transporta sledi posle malog dokaza sa dva klijenta, skrivenim objektom, duplom komandom i povratkom nakon prekida. **Colyseus je alternativa** ako njegova gotova infrastruktura više smanji naš posao nego što ga poveća prilagođavanje state schema modelu.

Mrežni autoritet ostaje na serveru i kada prikaz postane 3D. Nema razloga menjati HUD ili mapu 160 × 160 zbog transporta.

## 2. Kako su prikupljeni dokazi

- GitHits skill `githits-mcp`: javni OSS izvori, bez slanja privatnog koda, putanja ili tokena.
- Dva široka `research` upita, za ws i Colyseus, završila su MCP timeout-om. Iz njih nisu preuzeti zaključci.
- Fokusirani GitHits `read`, `pkg_info` i `pkg_vulns` zatim su uspeli za ws; metadata pozivi uspeli su i za Colyseus i Socket.IO.
- GitHub konektor: direktno pregledani ws README/API, Colyseus `Room.ts` i trenutni WHR main.
- Zvanična dokumentacija: Socket.IO, Colyseus, Node, Playwright, Caddy, OWASP, OpenAI/Codex i ORCA autori.
- Stranica `docs.colyseus.io/server/room/` dala je 404. Korišćene su stvarne stranice `/room/reconnection`, `/room/timing-events` i `/state/view`; ne preporučujemo nepostojeću putanju.

Dokumentacija na pokretnim granama može opisivati noviju funkciju od izabrane npm verzije. Pre implementacije proveriti baš zaključani paket i njegove testove. Nepostojanje prijavljenog advisory-ja nije dokaz da je paket ili naša aplikacija bez greške.

## 3. Potvrđena WHR osnova i konkretni nedostaci

GitHub main proveren: `e42eea6762066e6e3cc87d71d30e31cbdd8000bd`; tree `a1fed4bde5b3a24de8ca464725bc0fc66de88e3a`. To je spojeni PR #6 / prihvaćeni 0.6.2. [Potvrđeni commit](https://github.com/nenadcraft-spec/WHR-CODE-FRONTIER/commit/e42eea6762066e6e3cc87d71d30e31cbdd8000bd).

Pregled lokalnog `script.js` pokazuje:

| Mesto u 0.6.2 | Već korisno | Šta još treba za mrežu |
|---|---|---|
| `module.exports=API`, pre DOM dela | Simulacija se već učitava u Node testovima | Jasno izdvojen core i ugovor o javnim podacima, bez lomljenja lokalnog moda |
| `executeCommand`, približno linija 435 | Allowlist komandi, osnovna veličina argumenata, sequence, postojeći gameplay validatori | Mrežna schema za svaki tip, identitet iz server sesije, tick red, potvrda ishoda, ograničen ledger |
| `processCommands`, približno 450 | Botove komande izvršavaju se redom | Trenutno koristi bot capability; novi serverovski put za sve kontrolere |
| `observePlayer`, približno 453 | Filtriranje neprijatelja prema viziji za botov planner | Nije kompletan klijentski DTO: mapa, fog, resursi, javni događaji, sećanja i T3 stealth zahtevaju ugovor |
| `humanAction`, približno 601 | Jedno mesto za ljudske gameplay namere | Sada direktno menja lokalni svet i vraća sinhroni rezultat; mreža mora prihvatiti odloženi ack/reject |
| `game.active`, `executingOwner` | Lokalni izbor i interni kontekst izvršenja | Server ne sme menjati active da bi glumio drugog čoveka; session→owner mapiranje mora biti odvojeno |

Linije su navigaciona pomoć za ovu kopiju, ne trajni API. Ne izlagati direktno lokalni API ili ceo snapshot udaljenom klijentu.

## 4. Poređenje stvarnih kandidata

| Kandidat | Šta rešava | Naš dodatni posao | Odluka pripreme |
|---|---|---|---|
| Node + ws | WebSocket server, upgrade, ping/pong, ograničenje poruke, bafer izlaza | Lobby, sesije, deduplikacija, snapshot/delta, filtriranje, sva gameplay pravila | Prvi kandidat za mali dokaz; najmanje prilagođavanje sadašnjem core-u |
| Colyseus | Room životni ciklus, reconnect, state sync, per-client StateView | Adapter sveta u Schema/pogled, proračun vizije, autoritet komandi i WHR pravila | Aktivna alternativa, nije odbačena |
| Socket.IO | Događaji/ack, reconnect i opcioni connection recovery | Gameplay snapshot, identitet, idempotentnost, vizija i meč | Koristan obrazac; ne uvoditi paralelno sa ws bez potrebe |
| P2P/WebRTC lockstep | Druga arhitektura prenosa i izvršenja | NAT/relay, determinističko izvršenje, reconnect i skrivanje tuđeg sveta | Nije prvi smer V7; nije dokazano potreban |

Prema [ws README-u](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/README.md), ws je Node biblioteka; browser koristi svoj WebSocket. [Socket.IO garancije](https://socket.io/docs/v4/delivery-guarantees/) razdvajaju uređen red poruka od garantovane isporuke; podrazumevano je isporuka najviše jednom. [Recovery](https://socket.io/docs/v4/connection-state-recovery/) nije uvek uspešan, pa potpuna ponovna sinhronizacija ostaje obavezna.

[Colyseus StateView](https://docs.colyseus.io/state/view) omogućava selektivno slanje označenih polja i instanci, ali WHR i dalje odlučuje šta igrač vidi. Neoznačena polja ostaju javna. Globalno pretplaćivanje na sve neprijatelje nije fog-of-war. [Reconnect](https://docs.colyseus.io/room/reconnection) zahteva zadržavanje mesta na serveru; reload stranice i nastavak postojećeg klijenta nisu isti tok.

## 5. Verzije, licence i ograničenja provere

| Komponenta | Proveren podatak 20.11.2026 | Primena |
|---|---|---|
| ws | GitHits izabrao 8.23.0, MIT; za ovu verziju nema aktivnih pogođenih advisory-ja, 7 istorijskih ne odnosi se na nju | Kandidat; tek pre instalacije potvrditi registry, integrity i engine uslove |
| Colyseus | GitHits metadata 0.18.12, MIT | Nije instaliran niti izvršen audit kompletnog budućeg stabla |
| Socket.IO | GitHits metadata 4.8.4, MIT | Nije instaliran niti izabran za WHR |
| Node | Zvanična tabela označava v26, v24 i v22 kao LTS; v20 kao EOL | Prvi kandidat v26 LTS; tačan patch zaključati i proveriti na Windows/Linux |
| RVO2 | Pregledan izvor licence Apache-2.0 i rad autora ORCA | Referenca za navigaciju, nije ubačen u projekat |

[Node raspored podrške](https://nodejs.org/en/about/previous-releases). GitHits prijavljuje proveru ws zavisnosti sa **0 razrešenih verzija**; to nije završen audit našeg budućeg package-lock-a. Kada stvarni lockfile nastane, proveriti ceo razrešeni graf, engine kompatibilnost i licence. Ne instalirati optional native dodatke pre merenja potrebe. Čuvati licence/NOTICE pri preuzimanju koda, ne samo link ka originalu.

Pregledani ws source commit: `0cc9185755faa9b92b9efd566a8ee9f65fffd923`. Pregledani Colyseus Room izvor je podrazumevana grana master tokom istraživanja; commit je naveden u katalogu koda. HEAD primer ne proglašavamo dokazom ponašanja npm izdanja.

## 6. Server koji nam je potreban

Predložene odgovornosti, bez obavezivanja na framework:

1. **Gateway** — HTTP/WSS, upgrade, dozvoljeni Origin, ograničene poruke i identifikacija sesije.
2. **Lobby/session manager** — meč, slot, spremnost, reconnect i ukidanje starog socket autoriteta.
3. **Command ingress** — schema, veličina, sequence, rate limit, red za server tick, ack/reject.
4. **Match runner** — jedini autoritativni svet, fiksni korak, botovi, rezultat i životni ciklus.
5. **View builder** — polja dozvoljena vlasniku/timu, vizija, sećanja i T3 detekcija.
6. **Publisher** — snapshot, revizije, kasnije delte, spor klijent i potpuna sinhronizacija.
7. **Telemetry** — tick/navigation/payload/memorija, brojači odbijanja, ograničeni logovi bez tokena.

Za prvi 1v1 nije neophodan Redis, SQL nalog, Kubernetes ili više servera. Predlog je jedan proces i ograničen broj mečeva, uz merenje. Reconnect unutar živog procesa ne znači nastavak posle njegovog pada. Za početnu verziju pad servera jasno prekida meč; nastavak posle pada zahteva dodatnu specifikaciju trajnih checkpoint-a i oporavka.

Spor meč ne sme tiho kočiti sve ostale. Ako merenje pokaže CPU zastoje, slede izolacija match runner-a u worker/proces i ograničenje prijema novih mečeva. Ne uvoditi to unapred bez dokaza.

## 7. Predlog protokola pre kodiranja

Sledeći JSON je **naš nacrt, nije kopiran upstream kod i nije implementiran endpoint**:

```json
{
  "protocol": 1,
  "matchId": "public-match-id",
  "commandId": { "sessionEpoch": 1, "seq": 42 },
  "type": "MOVE",
  "args": { "ids": ["unit17"], "point": { "x": 800, "y": 720 }, "append": true }
}
```

Owner ne dolazi kao autoritet iz payload-a. Server vezuje sesiju za igrača, proverava tip/ID-jeve/koordinate/limite, zatim raspoređuje komandu na svoj tick. Epoch dodeljuje server i sprečava zabunu između nove sesije/meča i stare sequence evidencije. Reconnect postojećeg slota mora sačuvati njegov ugovor o command ID-ju.

Odgovor razlikuje `queued` od `applied`/`rejected`, nosi command ID, tick i dozvoljen razlog. Sama potvrda prijema ne znači da je gradnja završena ili čak legalna u trenutku izvršenja. Duplikat ne naplaćuje opet: za poznat ID vraća isti terminalni ishod, a isti ID sa drugačijim payload-om odbija. Ograničen ledger i high-water mark sprečavaju ponovno izvršenje i posle izbacivanja stare stavke. Ne obećavamo neograničeno pamćenje svakog ishoda.

Klijent čuva neizvesne namere za razrešenje, ali ne šalje slepo sve stare klikove posle reconnect-a. Autoritativni snapshot i ledger prvo razrešavaju prihvaćeno, odbijeno i zastarelo.

Početna sinhronizacija: puni filtrirani snapshot. Kasnije `baseRevision → revision` delte; propuštena osnova traži nov snapshot. Potpuni snapshot pri reconnect-u bez automatskog spajanja sa zastarelim klijentskim svetom. Kamera, grupe i selekcija su lokalni; ne čuvaju autoritet za mrtve ili tuđe ID-jeve.

## 8. Fog of war je mrežni ugovor

Napraviti allowlist DTO po tipu, umesto kopiranja celog objekta i naknadnog brisanja nekoliko polja. Posebno razdvojiti sopstveni, saveznički, trenutno viđen i poslednje zapamćen objekat. Poslednje sećanje zamrzava viđene podatke; ne ažurira neviđenu smrt, HP, red ili cilj.

Predloženi negativni test: dva sveta imaju isti dozvoljeni pogled, različite skrivene neprijateljske jedinice i CODE. Serijalizovani dozvoljeni rezultat ostaje isti uz neutralizovane transportne ID-jeve/tajming gde je primereno. Isti princip važi za grešku ciljanja, zvuk/događaj i minimapu, ne samo listu entiteta.

Sopstveni nalozi mogu otkriti fizičku blokadu u svetu. To zahteva gameplay pravilo za Senku i dozvoljenu poruku, a ne curenje njenog ID-ja/koordinata u detaljnoj grešci. Podaci o šteti i projektilima takođe prolaze view builder.

## 9. Tick, prikaz i spor klijent

[Node timers](https://nodejs.org/api/timers.html) ne garantuju tačan trenutak callback-a. Za WHR 20 Hz ostaje logički korak; monotoni sat meri zaostatak, ograničeni accumulator sprečava beskonačan catch-up. Ne nadoknađivati opterećenje jednim ogromnim delta korakom niti preskakati naplate i borbene događaje.

Za početak porediti slanje stanja na 10 Hz i 20 Hz uz istu simulaciju. Klijent interpolira samo prikaz dozvoljenih položaja; ne menja domete ili stvarni rezultat. Kašnjenje prikaza i potvrde prikazati korisno, bez vraćanja velikog razvojnog HUD-a. [Node perf_hooks](https://nodejs.org/api/perf_hooks.html) daje monotono merenje i instrumentaciju event loop-a.

Prema [ws API-ju](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/doc/ws.md), koristiti eksplicitni `maxPayload`, pratiti `bufferedAmount` i heartbeat. U primerima kompresija nosi dodatnu cenu; početni predlog je `perMessageDeflate: false`. Za sporog klijenta objediniti zamenljive snapshot-e; nikada proizvoljno baciti deltu pa nastaviti kao da osnova postoji. Posle praga ponovna sinhronizacija ili prekid uz razlog. Tačne granice meriti.

Razvojni kandidati za probu, nisu prihvaćen balans/proizvodna konfiguracija: poruka 16 KiB, 20 komandi/s sa kratkim burst-om, reconnect prozor 60 s, ping svakih 15 s. Zasebno meriti full snapshot veličinu; inbound limit komande nije outbound limit sveta. Token bucket mora dozvoliti uobičajene RTS naloge grupama bez kažnjavanja legalne igre.

## 10. Veza, sesija i javni server

[OWASP WebSocket smernice](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html) podržavaju sledeće obaveze: WSS za javnu vezu, eksplicitna Origin provera, autorizacija svake poruke, ograničene poruke/frekvencija i logovi bez osetljivih tokena. Origin nije identitet i ne sprečava lažni owner u sopstvenom klijentu. CORS podešavanje samo po sebi nije WebSocket autorizacija.

Browser WebSocket ne tretirati kao Node klijent sa proizvoljnim Authorization header-om. Predlog: kratkotrajan HTTPS join ticket ili ograničena prva auth poruka uz timeout; bez prava gameplay-a pre identifikacije. Reconnect token ne ide u URL/log. Definitivno mesto čuvanja, zaštita od krađe i pravilo rotacije moraju biti zapisani pre server koda.

[ws autentifikacioni primer](https://github.com/websockets/ws/blob/0cc9185755faa9b92b9efd566a8ee9f65fffd923/README.md#client-authentication) ima namerno neimplementiran `authenticate`: nije gotov login sistem. Ne preuzimati opšti broadcast primer za slanje celog RTS sveta.

[Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) podržava WebSocket upgrade. Reload proxy konfiguracije može prekinuti postojeće veze: proveriti reconnect, timeout i plan održavanja. GitHub Pages klijent i poseban WSS server imaju različite origin-e; proveriti allowlist, DNS/TLS i eventualni CSP `connect-src`.

Razdvojiti tri dokaza: isti računar/dva klijenta; LAN/dva računara; javni internet/WSS. Hosting još nije izabran i nije naručen. Zabeležiti cenu, region/RTT, CPU, RAM, egress, WebSocket idle timeout, spavanje servisa i restart politiku pre odluke. Ne pretpostavljati da besplatan host stalno radi. Ne otvarati ruter ili javni port radi dokumentovanja.

## 11. Test alati i probe pre pune implementacije

[Playwright WebSocketRoute](https://playwright.dev/docs/api/class-websocketroute) može presresti/izmeniti poruke. Mock bez stvarnog servera testira UI; ne dokazuje multiplayer. Za dokaz mreže eksplicitno povezati pravi server i dva izolovana browser konteksta, zatim četiri.

[Toxiproxy](https://github.com/Shopify/toxiproxy) je kandidat za kontrolisano TCP kašnjenje, jitter, bandwidth i prekid. Podešavati oba smera kada je potrebno. Ne prikazivati simuliranu aplikacionu duplu poruku kao TCP preslaganje: WebSocket/TCP uređuje isporuku unutar veze.

Pre početka pune V7 implementacije pripremiti specifikacije šest malih dokaza:

| Dokaz | Pitanje | Kriterijum |
|---|---|---|
| P0 | Možemo li izdvojiti core bez promene ponašanja? | Iste 0.6.2 regresije; isti svet/komande, razlike obrazložene |
| P1 | Dva klijenta, jedan server tick | Obe dozvoljene slike odgovaraju istom autoritativnom događaju |
| P2 | Lažna i ponovljena gradnja | Owner iz sesije; najviše jedna naplata; lažna meta ne mutira svet |
| P3 | Skrivena jedinica i Senka ugovor | Sirovi payload ne sadrži nedozvoljeno; ista dozvoljena slika ostaje ista |
| P4 | Prekid posle slanja pre ack-a | Povratak razrešava ishod bez duplog radnika/gradnje |
| P5 | Spor klijent i 30-minutno opterećenje | Nema neograničenog bafera, tick zastoj izmeren; drugi klijent nastavlja |

Ovo su planirane probe, trenutno **NOT_RUN**. Tek njihov rezultat odlučuje da li ostajemo na ws ili ispitujemo Colyseus adapter na istim slučajevima. Zatim puna matrica V7 MASTER-a, T3 i 2v2.

## 12. Navigacija i ostatak V7

[ORCA rad autora](https://gamma.cs.unc.edu/ORCA/) daje matematički obrazac lokalnog uzajamnog izbegavanja; [RVO2](https://github.com/snape/RVO2) je C++ referenca. Nije gotova zamena našeg JS A*, niti obećanje da rešava svaki zastoj. Propuštanje tesnaca, Hold, neprijateljska blokada i Shift kontinuitet ostaju WHR pravila. Prvo reprodukovati zastoj i meriti; ne uvoditi WASM/C++ zavisnost samo zbog demonstracije velikog broja agenata. Kod preuzimati tek uz proveru odgovarajuće licence/NOTICE.

T3 otvorene gameplay odluke O01–O10 ostaju iz MASTER-a. Biblioteka za mrežu ne može odrediti naš HP, teleport refund, saveznička prava ili pravilo timskog poraza. Za 2v2 timski view builder i autoritet moraju biti provereni odvojeno od četiri konekcije.

## 13. OpenAI: konkretna korist i granica

Pregledana [Codex dokumentacija](https://learn.chatgpt.com/docs/codex/cli): istraživanje repozitorijuma, rad sa izmenama, pokretanje razvojnih alata i pregled diff-a. To odgovara našoj potrebi za pripremom testova, analizom logova i review-om protokola. Takav pregled ne menja rezultat izvršenog testa niti OI odluku.

Pregledana [OpenAI web search dokumentacija](https://developers.openai.com/api/docs/guides/tools-web-search): izvor za budući alat koji traži dokumentaciju i vraća izvore. Ovo istraživanje je koristilo postojeće povezane alate; nije napravljen poseban OpenAI API poziv, ključ, plaćeni servis ili AI integracija u igri.

**Predlog WHR arhitekture:** multiplayer server i strateški bot rade bez LLM poziva u 20 Hz petlji. Mrežne komande određuju validatori i simulacija. Eventualni AI savetnik, pomoć sa logovima ili generator scenarija ostaje odvojen budući alat. Nije potreban OpenAI nalog/API ključ igraču za meč. API za razgovor/model nije biblioteka koja nam rešava RTS lobby, fiziku ili fog-of-war.

## 14. Šta treba zaključati pre prvog server koda

- Core granica i serverovski command capability; odvojeni klijentski ViewState i autoritativni WorldState.
- Nacrt poruka, session/sequence ugovor, ack faze i replay granice ledger-a.
- DTO allowlist i pravila sećanja/vidljivosti; zasebna T3 detekcija.
- Prva auth/join procedura, reconnect politika i ponašanje pri padu procesa.
- Tačne podržane verzije Node/paketa i lockfile plan, audit/licence.
- Mere i P0–P5 probni plan; dogovoreni referentni hardver.
- OI odluke o mrežnoj pauzi, reconnect trajanju, predaji i timskoj pobedi.

**Spremno za sledeću pripremu:** zaključiti ADR-001 i razraditi konkretne schema/DTO granice iz kataloga. **Nije spremno za tvrdnju „multiplayer radi“:** nema izvršenog servera, mrežne partije ili merenja performansi. Stabilni 0.6.2 nije menjan.
