import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Four scenarios testing skepticism and careful reading rather than pattern
// matching:
//  - Ashgrove: a straightforward nosocomial surgical-site infection cluster
//    tied to a sterilization (autoclave) failure, with a host-risk-factor
//    red herring (diabetes) in the same spirit as the C. diff scenario.
//  - Fairport: a single anomalous, unrelated positive lab result sits
//    alongside a clear epidemiologic signal — testing whether a lone lab
//    finding gets weighed against the whole case series or over-trusted.
//  - Union Plaza: cases cluster suddenly in one building with an unusual
//    presentation and no natural exposure link, testing recognition of
//    epidemiologic features that suggest a deliberate release rather than a
//    natural point-source event. This is intentionally kept at the level of
//    pattern recognition only — no technical, agent, or production detail
//    of any kind, matching how this is actually taught in field epi courses.
//  - Ridgemont: a case count that clearly exceeds baseline turns out, on
//    investigation, to be a surveillance artifact (a new, more sensitive
//    diagnostic test) rather than a true increase in illness — rewarding
//    skepticism over chasing a vehicle that was never really there.
// ---------------------------------------------------------------------------

export const ASHGROVE_SCENARIO: Scenario = {
  id: 'ashgrove-surgical', code: 'OI-20', name: 'Ashgrove Surgical Center Site Infection Cluster', setting: 'An outpatient surgical center, over six weeks',
  syndrome: 'Surgical site infections — redness, drainage, and fever — appearing 3–14 days after a procedure',
  trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'Inadequately sterilized surgical instruments from a malfunctioning autoclave that failed to reach required sterilization temperature during a specific date range',
  incubationHoursMin: 72, incubationHoursMax: 336, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 13, populationAtRisk: 110,
  epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 2 }, { day: 3, cases: 3 }, { day: 4, cases: 2 }, { day: 5, cases: 3 }, { day: 6, cases: 2 }],
  exposures: [
    { exposure: 'Procedure used instrument set from the affected autoclave', casesExposed: 12, casesUnexposed: 1, controlsExposed: 15, controlsUnexposed: 55 },
    { exposure: 'A specific surgeon', casesExposed: 7, casesUnexposed: 6, controlsExposed: 20, controlsUnexposed: 50 },
    { exposure: 'A specific procedure type', casesExposed: 6, casesUnexposed: 7, controlsExposed: 18, controlsUnexposed: 52 },
    { exposure: 'Diabetes (pre-existing)', casesExposed: 6, casesUnexposed: 7, controlsExposed: 12, controlsUnexposed: 58 },
    { exposure: 'Pre-operative antibiotic prophylaxis given', casesExposed: 3, casesUnexposed: 10, controlsExposed: 50, controlsUnexposed: 20 },
  ],
  narrativeIntro: 'Infection control at an outpatient surgical center notices a cluster of surgical site infections among patients who had procedures over the past several weeks.',
  labFindingsNarrative: 'Matching bacterial strains are found across affected patients. Routine biological indicator testing later reveals one autoclave had intermittently failed to reach the required sterilization temperature during the affected period.',
  notifiableClass: 'routine',
}

export const FAIRPORT_SCENARIO: Scenario = {
  id: 'fairport-lab-anomaly', code: 'OI-21', name: 'Fairport Community Gastroenteritis Cluster', setting: 'A small community, over two weeks',
  syndrome: 'Watery diarrhea and cramping, onset 24–72 hours after a shared community picnic',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Potato salad served at the community picnic, held at an unsafe temperature for several hours',
  incubationHoursMin: 24, incubationHoursMax: 72, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 22, populationAtRisk: 180,
  epiCurve: [{ day: 0, cases: 1 }, { day: 1, cases: 14 }, { day: 2, cases: 5 }, { day: 3, cases: 2 }],
  exposures: [
    { exposure: 'Potato salad', casesExposed: 19, casesUnexposed: 3, controlsExposed: 15, controlsUnexposed: 45 },
    { exposure: 'Grilled corn', casesExposed: 12, casesUnexposed: 10, controlsExposed: 30, controlsUnexposed: 30 },
    { exposure: 'Lemonade', casesExposed: 14, casesUnexposed: 8, controlsExposed: 32, controlsUnexposed: 28 },
    { exposure: 'Watermelon', casesExposed: 10, casesUnexposed: 12, controlsExposed: 25, controlsUnexposed: 35 },
  ],
  narrativeIntro: 'Several attendees of a community picnic report gastrointestinal illness within a day of the event, with a clear common exposure emerging in interviews.',
  labFindingsNarrative: 'Stool testing from most cases points toward a foodborne bacterial pathogen consistent with the epidemiologic pattern. One case, unrelated to the others by symptom timing and severity, separately tests positive for a completely different, unrelated organism — most likely an incidental finding in someone who happened to have a second, unconnected mild infection at the same time.',
  notifiableClass: 'routine',
  redHerringLab: true,
}

export const UNION_PLAZA_SCENARIO: Scenario = {
  id: 'union-plaza-cluster', code: 'OI-22', name: 'Union Plaza Office Tower Respiratory Cluster', setting: 'A single office tower, over two days',
  syndrome: 'Sudden, severe, rapidly progressive respiratory illness with no preceding mild phase',
  trueRoute: 'toxin_point_source', trueCurveShape: 'point_source', trueVehicle: 'An unidentified agent apparently released into shared air-handling on one floor — the pattern is inconsistent with any natural food, water, or community exposure',
  incubationHoursMin: 6, incubationHoursMax: 48, baselineCasesPerPeriod: 0, periodLabel: 'year', observedCases: 9, populationAtRisk: 400,
  epiCurve: [{ day: 0, cases: 1 }, { day: 1, cases: 7 }, { day: 2, cases: 1 }],
  exposures: [
    { exposure: 'Worked on the affected floor that day', casesExposed: 8, casesUnexposed: 1, controlsExposed: 20, controlsUnexposed: 60 },
    { exposure: 'Ate at the building cafeteria', casesExposed: 5, casesUnexposed: 4, controlsExposed: 40, controlsUnexposed: 40 },
    { exposure: 'Recent travel outside the region', casesExposed: 1, casesUnexposed: 8, controlsExposed: 8, controlsUnexposed: 72 },
    { exposure: 'Known chronic respiratory condition', casesExposed: 2, casesUnexposed: 7, controlsExposed: 12, controlsUnexposed: 68 },
  ],
  narrativeIntro: 'Nine people who work on the same floor of an office tower are hospitalized within about 24 hours with unusually severe, rapidly progressive respiratory illness, none of them having had any milder preceding symptoms typical of a natural infection.',
  labFindingsNarrative: 'The clinical presentation and pathogen identified are highly unusual for this geographic area and population, with no plausible natural environmental source or travel history identified for any case. Severity is markedly higher than typically expected for this type of illness. No connection to food, water, or person-to-person spread beyond the shared floor is found.',
  notifiableClass: 'urgent',
  deliberateReleaseFlag: true,
}

export const RIDGEMONT_SCENARIO: Scenario = {
  id: 'ridgemont-artifact', code: 'OI-23', name: 'Ridgemont County Reporting Anomaly', setting: 'A county public health jurisdiction, over one month',
  syndrome: 'Mild-to-moderate gastroenteritis reports, most cases never seeking care beyond a single test',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'continuous_common_source', trueVehicle: 'No credible common exposure was identified — the increase traces to a new, more sensitive diagnostic panel adopted by local labs, which began detecting mild and previously-missed cases rather than reflecting a true rise in illness',
  incubationHoursMin: 24, incubationHoursMax: 72, baselineCasesPerPeriod: 8, periodLabel: 'month', observedCases: 26, populationAtRisk: 5000,
  epiCurve: [{ day: 1, cases: 2 }, { day: 2, cases: 3 }, { day: 3, cases: 2 }, { day: 4, cases: 3 }, { day: 5, cases: 2 }, { day: 6, cases: 3 }, { day: 7, cases: 2 }, { day: 8, cases: 3 }, { day: 9, cases: 3 }, { day: 10, cases: 3 }],
  exposures: [
    { exposure: 'Ate at any restaurant in the county', casesExposed: 20, casesUnexposed: 6, controlsExposed: 62, controlsUnexposed: 18 },
    { exposure: 'Drank municipal tap water', casesExposed: 22, casesUnexposed: 4, controlsExposed: 68, controlsUnexposed: 12 },
    { exposure: 'Attended any large gathering', casesExposed: 6, casesUnexposed: 20, controlsExposed: 20, controlsUnexposed: 60 },
    { exposure: 'Recent grocery store produce purchase', casesExposed: 15, casesUnexposed: 11, controlsExposed: 48, controlsUnexposed: 32 },
  ],
  narrativeIntro: 'Case reports of mild gastroenteritis in the county rise to more than three times the usual monthly count, triggering an investigation — but interviews turn up no shared meal, water source, or event connecting the cases.',
  labFindingsNarrative: 'Every candidate exposure comes back with an odds ratio close to 1 — no meaningful association with anything in particular. Follow-up with local labs reveals that the county\'s two largest labs both switched to a new, more sensitive stool PCR panel in the weeks before the increase, one that detects several pathogens at much lower thresholds than the older culture-based method.',
  notifiableClass: 'routine',
  possibleArtifact: true,
}
