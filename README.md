# WHR CODE FRONTIER — 0.7.0 kandidat

WHR Game Engine: browser RTS sa CODE ekonomijom, T1–T3 razvojem, lokalnim strateškim botom i autoritativnim mrežnim 1v1/2v2 serverom.

Otvorite `index.html` za lokalni poligon/bota. Za mrežu pokrenite `START_SERVER.cmd` ili `npm start`, zatim otvorite **http://127.0.0.1:8080**. Git checkout prvo zahteva `npm ci`; Windows paket uključuje ws biblioteku. Node.js 24 ili 26 je potreban za server. Igraču nije potreban OpenAI ključ ili LLM servis.

- Prihvaćene 0.6.2 kontrole: Ctrl/Shift grupe, objekatski hotkeys sa selekcijom i kamerom, edge scroll, srednji miš, minimapa, rally, Shift redovi i CODE rezervacije.
- Propuštanje saveznika u tesnacu uz fizičke radijuse i očuvanje cilja. Hold i neprijateljska blokada ostaju važeći.
- T3: globalni razvoj, letelice, transport, teleport, Senka/detekcija, kampovi i Scout čizme. Otvorene brojke su eksplicitni kandidati za OI probu.
- Mreža: serverov svet na 20 Hz; zasebni dozvoljeni pogledi, odložene potvrde, deduplikacija komandi, reconnect i timska vizija/rezultat.

[Pokretanje i igranje](docs/PROTOTYPE_0_7.md) · [Kandidatske odluke](docs/V07_ODLUKE_KANDIDAT_001.md) · [Izvršene provere i granice](docs/V07_TEST_REPORT_2026-11-20.md) · [V7 MASTER](docs/WHR_GAME_ENGINE_V07_MASTER_v1_0_2026-11-20.md)

```sh
npm ci
npm run build
npm test
npm start
# Chromium provere, uz instaliran Playwright i Chromium:
node tests/run-browser.cjs
```

`core.part` i `ui.part` su izvori za build; `tools/build.cjs` spaja ih u `script.js` i upisuje hash pravila za handshake. Menjanje izvora zahteva novi build i restart servera; ne menjati `script.js` samostalno. Server koristi isti generisani modul kao Node testovi. Promena klijentskog izgleda ne menja logičku mapu 160×160 i simulaciju 20 Hz.

ws 8.23.0 je zaključan u package-lock-u; MIT licenca je u `third_party/ws-LICENSE.txt`. Za javno puštanje obavezni su stvarni WSS/hosting i dodatna proba dva računara; nisu postavljeni ovom isporukom. Nema save/replay-a, 3D integracije ili garantovanog razrešenja svake gužve. OI prihvatanje V7 još čeka igranje.
