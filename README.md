# QHSE Inspectietool

Offline-first web-app (PWA) voor QHSE-werkplekinspecties met 4 checklists:

| Checklist | Gebaseerd op |
|---|---|
| **Engineer** | Laad-/losoperaties, pompset & slangen (met certificaatnummers en keuring) |
| **Warehouse** | Seveso-richtlijn & Vlarem-wetgeving — hallen, sprinkler, aerosolen, steekproef producten |
| **WPI Algemeen** | Codex over het welzijn op het werk — de 7 welzijnsdomeinen |
| **WPI ADR** | ADR-regelgeving vervoer gevaarlijke goederen |

## Belangrijkste functies

- **100% offline bruikbaar** — alle data (inspecties + foto's) wordt lokaal opgeslagen in IndexedDB op het toestel. Geen server, geen internetverbinding nodig na de eerste keer laden.
- **Installeerbaar als app** (PWA) — "Toevoegen aan startscherm" op iOS/Android, of installeren via de browser op desktop.
- Elke vraag: **OK / NOK / NVT**, met verplichte foto-mogelijkheid bij NOK (meerdere foto's per vraag).
- **Handtekening** van de inspecteur op het einde van elke inspectie (canvas, vinger of muis).
- **PDF-rapport genereren** met alle antwoorden, opmerkingen, foto's en handtekening, en **direct delen** met teamleden (native deel-menu op mobiel, of download op desktop).
- **Dashboard** met alle openstaande actiepunten (alle NOK's over alle inspecties heen), en een overzicht van alle uitgevoerde inspecties.
- **Warehouse-checklist** bevat een aparte **steekproef-tabel** (min. 5 producten: naam, UN-nr, aanwezige hoeveelheid vs. limiet, conformiteit opslaglijst, labeling conform SDS).
- **Engineer-checklist** ondersteunt tot 3 slangen, elk met een eigen certificaatnummer en keuringsstatus.
- Vragenlijsten zijn **eenvoudig uit te breiden** — zie hieronder.

## Snel starten (lokaal testen)

Omdat de app een service worker gebruikt, moet ze via **http(s)** geladen worden (niet rechtstreeks als `file://`). Lokaal testen kan bv. met:

```bash
npx serve .
# of
python3 -m http.server 8080
```

Open daarna `http://localhost:8080` (of de poort die getoond wordt) in de browser.

## Publiceren via GitHub Pages

1. Maak een nieuwe repository aan en push deze volledige map.
2. Ga naar **Settings → Pages**.
3. Kies als bron: **Deploy from a branch**, branch `main`, map `/ (root)`.
4. Na enkele minuten is de app bereikbaar op `https://<gebruikersnaam>.github.io/<repo-naam>/`.
5. Open de link op een smartphone → browsermenu → **"Toevoegen aan startscherm"** om de app als icoon te installeren.

> Let op: GitHub Pages serveert automatisch via HTTPS, wat vereist is voor de service worker (offline-werking) en voor cameratoegang (foto's maken).

## Vragenlijsten aanpassen of uitbreiden

Alle vragen staan gestructureerd in **`js/data.js`**. Je hoeft nergens anders iets aan te passen:

```js
{ id: 'e28', text: 'Nieuwe vraag hier...' }
```

- Voeg een nieuwe vraag toe aan de juiste `sections`-array van de gewenste checklist.
- Gebruik een **uniek `id`** per vraag (bv. `e28`, `w25`, `g25`, `a21`) — dit id wordt gebruikt om antwoorden te bewaren, dus hergebruik geen bestaande id's.
- Wijzig gerust ook categorienamen (`sections[].name`), metadata-velden (`meta`) of de steekproef-velden (`sampleFields`) van de Warehouse-checklist.
- Reeds ingevulde/opgeslagen inspecties blijven ongewijzigd bewaard; enkel **nieuwe** inspecties tonen de aangepaste vragenlijst.

## Technische opbouw

```
index.html          → app-shell, laadt alle scripts
manifest.json        → PWA-configuratie (naam, icoon, kleur)
sw.js                 → service worker: cachet de app voor offline gebruik
css/style.css         → volledige styling
js/data.js            → alle checklists & vragen (hier pas je content aan)
js/db.js              → IndexedDB-opslag (inspecties + foto's), 100% lokaal
js/pdf.js             → PDF-rapportgeneratie (jsPDF + autotable)
js/app.js             → app-logica: navigatie, formulieren, dashboard, foto's, handtekening
icons/                → app-iconen (PWA)
```

Geen build-stap, geen framework, geen backend nodig — puur HTML/CSS/JavaScript, dus makkelijk te onderhouden en te hosten (GitHub Pages, Netlify, eigen server, …).

### Externe libraries (via CDN)

- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) — voor het genereren van de PDF-rapporten. Deze worden bij het eerste bezoek gecached door de service worker, zodat PDF-export ook nadien offline blijft werken.

## Wijzigingen in deze versie (v2)

- **Engineer**: vragen doorlopend genummerd (1a, 1b, 1c, … zonder reset per onderdeel — dus "Materiaal" begint niet opnieuw bij "a"). Wil je toch per onderdeel laten herstarten (2a, 2b, …)? Pas dan gewoon de `num`-waarden aan in `js/data.js`.
- Tot **4 slangen** mogelijk; per slang nu knoppen "Gekeurd OK" / "Niet conform" (geen dropdown meer), en bij "Niet conform" verschijnt automatisch een opmerkingveld + foto-knop specifiek voor die slang.
- PBM-vraag bij Engineer heeft nu **aanvinkbare keuzevakjes** (helm, veiligheidsbril, handschoenen chemie, veiligheidsschoenen, overall chemie, volgelaatsmasker ABEK).
- Warehouse: aerosolen-vraag herschreven (blusmiddel i.p.v. opslag), nieuwe steekproef "onverenigbare producten" (min. 3), hoofdsteekproef herwerkt naar één OK/NOK-veld per product i.p.v. 3 losse ja/nee-velden.
- WPI Algemeen: 3 vragen toegevoegd bij Arbeidsveiligheid, 1 vraag verwijderd bij Milieu.
- **Logo** (Scandinavian Oil Services) toegevoegd in de app-header en in het PDF-rapport.
- **PDF-rapport volledig herwerkt**: professionele koptekst met documentbeheer-kadertje (naam, revisiedatum, versie, beheerder, documentcode/titel) + logo op pagina 1, en een slanke doorlopende koptekst op volgende pagina's. Opmerking + foto staan nu altijd direct onder de bijhorende vraag (geen aparte fotolijst meer onderaan).
  ⚠️ Ik ken enkel de echte documentcode van WPI Algemeen (**BE-CL009**, "Checklist WPI Maandronden"). Voor Engineer, Warehouse en WPI ADR staat een voorlopige code (BE-CL010/011/012) — pas dit aan in `js/data.js` (`docControl`) naar jullie eigen documentnummers.
- **Bug opgelost**: foto's die bij herhaald bewerken van een inspectie soms dubbel werden opgeslagen. Dit kwam doordat de foto-listener bij elke render opnieuw werd toegevoegd i.p.v. vervangen — nu definitief verholpen.

## Bekende aandachtspunten / mogelijke uitbreidingen

- Data staat **per toestel** lokaal opgeslagen (IndexedDB). Er is geen synchronisatie tussen toestellen — wil je dat later (bv. gedeelde cloud-opslag/backend of automatische back-up), dan is dat een aparte uitbreiding.
- Foto's worden gecomprimeerd (max. 1000px, JPEG 70%) om de opslag beperkt te houden, maar op termijn kan het toestel-opslag vol raken bij zeer veel foto's — een "exporteer & wis oude inspecties"-functie is een mogelijke volgende stap.
- Delen gebeurt via de **Web Share API** (werkt op de meeste mobiele browsers); op desktop-browsers zonder ondersteuning wordt de PDF automatisch gedownload in plaats van gedeeld.
