/**
 * QHSE Inspectietool — vragenlijsten (checklists)
 * -------------------------------------------------
 * Dit bestand bevat ALLE vragen per checklist.
 * Wil je later een vraag toevoegen, aanpassen of verwijderen?
 * Doe dat hier — de rest van de app leest deze lijst automatisch uit.
 *
 * Structuur per checklist:
 * {
 *   id: 'engineer',
 *   title: 'Engineer',
 *   subtitle: 'Korte omschrijving',
 *   color: '#hex',
 *   docControl: { code, naam, rev, versie, beheerder, docTitle }  // zie hieronder
 *   meta: [ ...invulvelden vooraf... ],
 *   sections: [ { name, questions: [ {id, num, text, hint, checkboxOptions} ] } ],
 *   sample / sample2: steekproef-tabellen (optioneel, zie Warehouse)
 * }
 *
 * VELDEN PER VRAAG:
 *   id                → intern, uniek, NIET hergebruiken (zo blijven oude inspecties leesbaar)
 *   num               → weergavenummer (bv. '1a'), puur cosmetisch, mag je vrij aanpassen
 *   text              → de vraag zelf
 *   hint              → optionele kleine grijze hulptekst onder de vraag
 *   checkboxOptions   → optionele lijst keuzevakjes die ONDER de vraag getoond worden
 *                       (bv. welke PBM's precies gedragen worden), naast de gewone OK/NOK/NVT
 *
 * DOCUMENT CONTROL (docControl):
 *   Dit vult de kop van het PDF-rapport (naam beheerder, revisiedatum, versienummer,
 *   documentcode + titel), naar het voorbeeld van jullie document-header.
 *   Documentcodes: Engineer = WPI_EN001, Warehouse = WPI_WHS001,
 *   WPI Algemeen = WPI_ALG_001, WPI ADR = WPI_ADR.
 */

const QHSE_CHECKLISTS = [
  // =====================================================================
  // 1. ENGINEER
  // =====================================================================
  {
    id: 'engineer',
    title: 'Engineer',
    subtitle: 'Laad- / losoperaties, pompset & slangen',
    color: '#c8622a',
    sample: false,
    docControl: {
      code: 'WPI_EN001',
      naam: 'Henk Driessen',
      rev: '01-05-2025',
      versie: '1.0',
      beheerder: 'QHSE manager',
      docTitle: 'Checklist Engineer'
    },
    meta: [
      { id: 'naam', label: 'Naam engineer', type: 'text', required: true },
      { id: 'terminal', label: 'Terminal', type: 'text', required: true },
      { id: 'schip', label: 'Naam schip / voertuig', type: 'text', required: false },
      { id: 'datum', label: 'Datum inspectie', type: 'date', required: true },
      { id: 'pompset', label: 'Gebruikte pompset (type / ID)', type: 'text', required: true },
      { id: 'pompset_cert', label: 'Cert. nr. pompset (keuring)', type: 'text', required: true },
      { id: 'hoses', label: 'Gebruikte slangen (max. 4)', type: 'hoses', max: 4, required: true }
    ],
    sections: [
      {
        name: 'Voorbereiding & communicatie',
        questions: [
          { id: 'e01', num: '1a', text: 'Is er voorafgaand contact geweest met de controlekamer?' },
          { id: 'e02', num: '1b', text: 'Is de laad-/losplanning gekend en bevestigd?' },
          { id: 'e03', num: '1c', text: 'Is er communicatie opgesteld met het schip / de chauffeur (VHF, telefoon, portofoon)?' },
          { id: 'e04', num: '1d', text: 'Zijn relevante vragen gesteld i.v.m. terminal-specifieke procedures?' },
          { id: 'e05', num: '1e', text: 'Zijn relevante vragen gesteld i.v.m. schip-/voertuigspecifieke kenmerken (type lading, aansluitingen, druk)?' },
          { id: 'e06', num: '1f', text: 'Is de noodstopprocedure met schip/terminal vooraf doorgesproken?' }
        ]
      },
      {
        name: 'Materiaal & keuring',
        questions: [
          { id: 'e07', num: '1g', text: 'Is de pompset visueel nagekeken (lekken, schade, bevestiging)?' },
          { id: 'e08', num: '1h', text: 'Is de keuring van de pompset nog geldig (cert. nr. gecontroleerd)?' },
          { id: 'e09', num: '1i', text: 'Is slang 1 gekeurd conform het certificaatnummer hierboven?', hint: 'Zie keuring/foto bij "Gebruikte slangen" onder Gegevens.' },
          { id: 'e10', num: '1j', text: 'Is slang 2 gekeurd conform het certificaatnummer hierboven? (NVT indien niet gebruikt)' },
          { id: 'e11', num: '1k', text: 'Is slang 3 gekeurd conform het certificaatnummer hierboven? (NVT indien niet gebruikt)' },
          { id: 'e12', num: '1l', text: 'Is slang 4 gekeurd conform het certificaatnummer hierboven? (NVT indien niet gebruikt)' },
          { id: 'e13', num: '1m', text: 'Zijn de koppelingen/flenzen van de slangen in goede staat (geen corrosie, vervorming)?' },
          { id: 'e14', num: '1n', text: 'Is aarding / potentiaalvereffening voorzien en gecontroleerd?' }
        ]
      },
      {
        name: "PBM's",
        questions: [
          {
            id: 'e15', num: '1o', text: "Draagt de engineer de verplichte PBM's?",
            checkboxOptions: ['Helm', 'Veiligheidsbril', 'Handschoenen chemie', 'Veiligheidsschoenen', 'Overall chemie', 'Volgelaatsmasker met ABEK-filter']
          },
          { id: 'e16', num: '1p', text: 'Is aangepaste PBM voor het product aanwezig (chemisch pak, gelaatsscherm indien nodig)?' },
          { id: 'e17', num: '1q', text: 'Is een gasmeter/detectieapparatuur aanwezig en gekalibreerd indien vereist?' }
        ]
      },
      {
        name: 'Noodsituatievoorzieningen',
        questions: [
          { id: 'e18', num: '1r', text: 'Zijn nooddouche/oogdouche bereikbaar en functioneel?' },
          { id: 'e19', num: '1s', text: 'Is blusmateriaal aanwezig en bereikbaar nabij de laad-/losplaats?' },
          { id: 'e20', num: '1t', text: 'Is een spill kit / absorptiemateriaal aanwezig?' },
          { id: 'e21', num: '1u', text: 'Is de pomp opgesteld in een lekbak?' },
          { id: 'e22', num: '1v', text: 'Zijn vluchtwegen op de terminal vrij en gekend door de engineer?' },
          { id: 'e23', num: '1w', text: 'Is het noodnummer / de alarmprocedure gekend door de engineer?' }
        ]
      },
      {
        name: 'Uitvoering',
        questions: [
          { id: 'e24', num: '1x', text: 'Is de opstelling van de slangen correct en veilig (geen knikken, voldoende ondersteuning)?' },
          { id: 'e25', num: '1y', text: 'Is de verbinding schip/voertuig-wal correct gecontroleerd vóór opstart?' },
          { id: 'e26', num: '1z', text: 'Is er communicatie met de planning gerelateerd aan de job?' },
          { id: 'e27', num: '1aa', text: 'Is de WIK of SDS beschikbaar?' },
          { id: 'e28', num: '1ab', text: 'Is er een incident gebeurd?' }
        ]
      },
      {
        name: 'Transport (indien engineer met vaten rijdt)',
        questions: [
          { id: 'e29', num: '1ac', text: 'Is het ADR-certificaat van de engineer/chauffeur geldig? (zie ook checklist WPI ADR)' },
          { id: 'e30', num: '1ad', text: 'Is de lading (vaten) correct gezekerd voor transport naar de job?' },
          { id: 'e31', num: '1ae', text: 'Is de CMR correct ingevuld?' },
          { id: 'e32', num: '1af', text: 'Zijn de labels aangebracht volgens transport ADR?' },
          { id: 'e33', num: '1ag', text: 'Zijn de oranje schilden opengezet wanneer nodig?' }
        ]
      }
    ]
  },

  // =====================================================================
  // 2. WAREHOUSE — Seveso / Vlarem
  // =====================================================================
  {
    id: 'warehouse',
    title: 'Warehouse',
    subtitle: 'Seveso-richtlijn & Vlarem — hallen, opslag & steekproef',
    color: '#2a6f8c',
    docControl: {
      code: 'WPI_WHS001',
      naam: 'Henk Driessen',
      rev: '01-05-2025',
      versie: '1.0',
      beheerder: 'QHSE manager',
      docTitle: 'Checklist Warehouse'
    },
    sample: true,
    sampleMin: 5,
    sampleTitle: 'Steekproef opslaglijst-controle (min. 5 producten)',
    sampleHint: 'Controleer per product op de werkvloer: UN-nr, komt het gevarensymbool overeen met de opslaglijst, met de SDS, en met WIK in FM (opslagprogramma)? Eén globale beoordeling OK/NOK per product.',
    sampleFields: [
      { id: 'naam', label: 'Naam product' },
      { id: 'un', label: 'UN-nummer' },
      { id: 'aanwezig', label: 'Aanwezige hoeveelheid' },
      { id: 'limiet', label: 'Toegelaten limiet (Seveso)' },
      { id: 'conform', label: 'Conform?', type: 'select', options: ['OK', 'NOK'] },
      { id: 'opmerking', label: 'Opmerking' }
    ],
    sample2: true,
    sample2Min: 3,
    sample2Title: 'Steekproef onverenigbare producten (min. 3)',
    sample2Hint: 'Controle of onverenigbare producten effectief gescheiden opgeslagen staan.',
    sample2Fields: [
      { id: 'naam', label: 'Naam product' },
      { id: 'un', label: 'UN-nummer' },
      { id: 'gevaarclp', label: 'Gevaar (CLP-klasse)' },
      { id: 'opmerking', label: 'Opmerking' }
    ],
    meta: [
      { id: 'naam', label: 'Naam inspecteur', type: 'text', required: true },
      { id: 'datum', label: 'Datum inspectie', type: 'date', required: true },
      { id: 'zones', label: 'Geïnspecteerde zone(s)', type: 'multiselect',
        options: ['Hal 1', 'Hal 2', 'Hal 3', 'Zone lege verpakkingen', 'Laadkade'], required: true }
    ],
    sections: [
      {
        name: 'Algemene infrastructuur',
        questions: [
          { id: 'w01', text: 'Zijn nooduitgangen vrij en duidelijk gemarkeerd?' },
          { id: 'w02', text: 'Zijn doorgangen en vluchtwegen vrij van obstakels?' },
          { id: 'w03', text: 'Is de verluchting/ventilatie voldoende en functioneel?' },
          { id: 'w04', text: 'Is het sprinklersysteem (laadkade / hal, indien aanwezig) visueel in orde en vrij van obstructie?' },
          { id: 'w05', text: 'Zijn de blusaerosolen (magazijn en batterijlaadzone) vrij van obstakels, met minimaal 1m vrije ruimte rond de laadbakken?' },
          { id: 'w06', text: 'Zijn stellingen stabiel, onbeschadigd en correct belast?' },
          { id: 'w07', text: 'Is de vloer vrij van lekken, schade of obstakels?' },
          { id: 'w08', text: 'Is het onderhoud van technische installaties (sprinkler, ventilatie, verlichting) up-to-date?' }
        ]
      },
      {
        name: 'Opslag & etikettering',
        questions: [
          { id: 'w09', text: 'Zijn producten correct gestapeld conform de stapelvoorschriften?' },
          { id: 'w10', text: 'Zijn verpakkingen onbeschadigd en correct gesloten?' },
          { id: 'w11', text: 'Zijn labels/etiketten aanwezig, leesbaar en conform SDS?' },
          { id: 'w12', text: 'Zijn gevarenpictogrammen correct aangebracht?' },
          { id: 'w13', text: 'Wordt de opslag conform de opslaglijst en de toegelaten hoeveelheden (Vlarem) gerespecteerd?' },
          { id: 'w14', text: 'Zijn onverenigbare producten gescheiden van elkaar opgeslagen?', hint: 'Voer hiervoor de steekproef van min. 3 producten hieronder in (UN-nr, gevaar CLP, opmerking).' },
          { id: 'w15', text: 'Is de zone lege verpakkingen correct afgescheiden en opgeruimd?' },
          { id: 'w16', text: 'Is de laadkade vrij en veilig voor laad-/loshandelingen?' }
        ]
      },
      {
        name: 'Seveso / Vlarem conformiteit',
        questions: [
          { id: 'w17', text: 'Wordt de Seveso-drempelhoeveelheid voor opgeslagen gevaarlijke stoffen gerespecteerd?' },
          { id: 'w19', text: 'Is de meest recente veiligheidsstudie/risicoanalyse gekend bij het aanwezige personeel?' },
          { id: 'w20', text: 'Zijn het noodplan en interventiedossier up-to-date en toegankelijk?' },
          { id: 'w25', text: 'Is de steekproef van min. 5 producten volgens de opslaglijst uitgevoerd (UN-nr op de werkvloer, gevarensymbool vs. opslaglijst, vs. SDS, vs. WIK in FM)?', hint: 'Details per product: zie steekproeftabel onderaan dit formulier.' }
        ]
      },
      {
        name: 'Orde, netheid & noodmiddelen',
        questions: [
          { id: 'w21', text: 'Is er algemene orde en netheid (housekeeping) aanwezig in de hallen?' },
          { id: 'w22', text: 'Zijn blusmiddelen aanwezig, gekeurd en bereikbaar?' },
          { id: 'w23', text: 'Is het personeel op de hoogte van de noodprocedure bij incident/lekkage?' },
          { id: 'w24', text: "Zijn PBM's voor magazijnpersoneel aanwezig en worden ze effectief gebruikt?" }
        ]
      }
    ]
  },

  // =====================================================================
  // 3. WPI ALGEMEEN — Codex Welzijn (7 welzijnsdomeinen)
  // =====================================================================
  {
    id: 'wpi_algemeen',
    title: 'WPI Algemeen',
    subtitle: 'Werkplekinspectie — Codex over het welzijn op het werk (7 welzijnsdomeinen)',
    color: '#3a7d44',
    docControl: {
      code: 'WPI_ALG_001',
      naam: 'Henk Driessen',
      rev: '01-05-2025',
      versie: '1.0',
      beheerder: 'QHSE manager',
      docTitle: 'Checklist WPI Maandronden'
    },
    sample: false,
    meta: [
      { id: 'naam', label: 'Naam inspecteur', type: 'text', required: true },
      { id: 'afdeling', label: 'Afdeling / werkplek', type: 'text', required: true },
      { id: 'datum', label: 'Datum inspectie', type: 'date', required: true }
    ],
    sections: [
      {
        name: '1. Arbeidsveiligheid',
        questions: [
          { id: 'g01', text: 'Zijn machines en installaties voorzien van de nodige veiligheidsvoorzieningen (afschermingen, noodstop)?' },
          { id: 'g02', text: 'Zijn vluchtwegen en nooduitgangen vrij en gemarkeerd?' },
          { id: 'g03', text: 'Is er een actuele risicoanalyse beschikbaar voor deze werkplek?' },
          { id: 'g25', text: 'Zijn installaties en machines gekeurd en worden ze onderhouden?' },
          { id: 'g26', text: 'Zijn er defecte machines of installaties gemeld?' },
          { id: 'g27', text: 'Zijn er defecten aan gebouw, terrein of afsluiting?' }
        ]
      },
      {
        name: '2. Bescherming van de gezondheid van de werknemer',
        questions: [
          { id: 'g04', text: 'Worden periodieke medische onderzoeken (waar vereist) tijdig uitgevoerd?' },
          { id: 'g05', text: 'Is er voldoende toegang tot eerste hulp (EHBO-koffer, EHBO-verantwoordelijke)?' },
          { id: 'g06', text: 'Worden blootstellingsrisico\'s (lawaai, stof, chemicaliën) opgevolgd?' }
        ]
      },
      {
        name: '3. Psychosociale belasting',
        questions: [
          { id: 'g07', text: 'Is de vertrouwenspersoon/preventieadviseur psychosociaal gekend bij het personeel?' },
          { id: 'g08', text: 'Zijn er signalen van werkstress, ongewenst gedrag of burn-out die opvolging vereisen?' },
          { id: 'g09', text: 'Is de werkdruk op deze werkplek volgens het personeel beheersbaar?' }
        ]
      },
      {
        name: '4. Ergonomie',
        questions: [
          { id: 'g10', text: 'Zijn werkposten ergonomisch ingericht (zithoogte, tilhulpmiddelen, beeldschermwerk)?' },
          { id: 'g11', text: 'Worden manuele hanteringen (tillen, dragen) uitgevoerd volgens de juiste tiltechniek?' },
          { id: 'g12', text: 'Zijn hulpmiddelen (transpalletwagens, hijsmiddelen) beschikbaar waar nodig?' }
        ]
      },
      {
        name: '5. Arbeidshygiëne',
        questions: [
          { id: 'g13', text: 'Zijn sanitaire voorzieningen (toiletten, wasgelegenheid) proper en toegankelijk?' },
          { id: 'g14', text: 'Is er voldoende verlichting en verluchting op de werkplek?' },
          { id: 'g15', text: 'Wordt blootstelling aan gevaarlijke stoffen beperkt via technische/organisatorische maatregelen?' }
        ]
      },
      {
        name: '6. Verfraaiing van de werkplekken',
        questions: [
          { id: 'g16', text: 'Is de werkplek algemeen net, opgeruimd en verzorgd?' },
          { id: 'g17', text: 'Zijn pauzeruimtes aangenaam en functioneel ingericht?' }
        ]
      },
      {
        name: '7. Milieu (bedrijfsinterne en externe milieubescherming)',
        questions: [
          { id: 'g18', text: 'Wordt afval correct gesorteerd en gestockeerd?' },
          { id: 'g19', text: 'Worden lekken/morsingen op een milieuveilige manier opgevangen en verwerkt?' }
        ]
      },
      {
        name: "Taken, rollen & PBM's van het personeel",
        questions: [
          { id: 'g21', text: 'Kent het personeel zijn taken en verantwoordelijkheden inzake welzijn op het werk?' },
          { id: 'g22', text: 'Is er een aangeduide preventieadviseur/EHBO-verantwoordelijke gekend op de werkvloer?' },
          { id: 'g23', text: "Worden de voorgeschreven PBM's door het personeel effectief en correct gedragen?" },
          { id: 'g24', text: 'Hebben de werknemers de nodige opleiding/instructie gekregen voor hun taak?' }
        ]
      }
    ]
  },

  // =====================================================================
  // 4. WPI ADR
  // =====================================================================
  {
    id: 'wpi_adr',
    title: 'WPI ADR',
    subtitle: 'Werkplekinspectie — vervoer gevaarlijke goederen (ADR-regelgeving)',
    color: '#a12a2a',
    docControl: {
      code: 'WPI_ADR',
      naam: 'Henk Driessen',
      rev: '01-05-2025',
      versie: '1.0',
      beheerder: 'QHSE manager',
      docTitle: 'Checklist WPI ADR'
    },
    sample: false,
    meta: [
      { id: 'naam', label: 'Naam inspecteur', type: 'text', required: true },
      { id: 'chauffeur', label: 'Naam chauffeur / engineer', type: 'text', required: true },
      { id: 'voertuig', label: 'Voertuig (kenteken/type)', type: 'text', required: false },
      { id: 'datum', label: 'Datum inspectie', type: 'date', required: true }
    ],
    sections: [
      {
        name: 'Certificaten & opleiding',
        questions: [
          { id: 'a01', text: 'Is het ADR-certificaat van de chauffeur/engineer geldig en aanwezig?' },
          { id: 'a02', text: 'Is het certificaat van toepassing op de vervoerde klasse(n) gevaarlijke goederen?' },
          { id: 'a03', text: 'Heeft de chauffeur/engineer de nodige ADR-basisopleiding/bijscholing gevolgd?' }
        ]
      },
      {
        name: 'Documenten',
        questions: [
          { id: 'a04', text: 'Is het vervoersdocument (ADR) correct ingevuld en aanwezig?' },
          { id: 'a05', text: 'Zijn de schriftelijke instructies (veiligheidsinstructiekaarten) aan boord?' },
          { id: 'a06', text: 'Zijn de vereiste vergunningen (bv. route-, uitzonderingsvergunning) aanwezig indien van toepassing?' },
          { id: 'a07', text: "Is het conformiteitscertificaat/keuringsbewijs van het voertuig geldig?" }
        ]
      },
      {
        name: 'Ladingzekering & voertuig',
        questions: [
          { id: 'a08', text: 'Zijn de vaten/collo\'s correct en stevig gezekerd tegen verschuiven/kantelen?' },
          { id: 'a09', text: 'Zijn de vaten correct gestapeld en gescheiden (geen onverenigbare producten samen)?' },
          { id: 'a10', text: 'Is het voertuig voorzien van de correcte ADR-signalisatie (oranje borden/kegels, etiketten)?' },
          { id: 'a11', text: 'Is de laadruimte/lekbak vrij van schade en lekken?' },
          { id: 'a12', text: 'Is het maximaal toegelaten laadgewicht/-volume gerespecteerd?' }
        ]
      },
      {
        name: 'Uitrusting voertuig',
        questions: [
          { id: 'a13', text: 'Is het verplichte blusmateriaal aanwezig, gekeurd en bereikbaar?' },
          { id: 'a14', text: 'Is de standaarduitrusting aanwezig (wielkeg, waarschuwingsdriehoek, veiligheidsvest, oogspoeling, opvangbak)?' },
          { id: 'a15', text: 'Is de EHBO-uitrusting aan boord aanwezig en volledig?' }
        ]
      },
      {
        name: "PBM's & vervoer naar de job",
        questions: [
          { id: 'a16', text: "Draagt de chauffeur/engineer de verplichte PBM's tijdens laden/lossen/transport?" },
          { id: 'a17', text: 'Zijn de vaten die de engineer meeneemt naar de job correct verpakt en geëtiketteerd?' },
          { id: 'a18', text: 'Is de lading van de vaten tijdens transport naar de job correct gezekerd in het voertuig?' },
          { id: 'a19', text: 'Is het aantal/de hoeveelheid vervoerde gevaarlijke goederen binnen de vrijstellingsgrenzen (indien van toepassing) of correct gedocumenteerd?' },
          { id: 'a20', text: 'Is de chauffeur op de hoogte van de te volgen procedure bij een incident/ongeval tijdens transport?' }
        ]
      }
    ]
  }
];

// Statuswaarden gebruikt doorheen de app
const QHSE_STATUS = ['OK', 'NOK', 'NVT'];

if (typeof module !== 'undefined') module.exports = { QHSE_CHECKLISTS, QHSE_STATUS };
