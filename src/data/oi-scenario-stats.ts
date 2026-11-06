import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Two scenarios about the limits of the numbers themselves:
//  - Bellwether: the initial case definition is deliberately broad and
//    misclassifies unrelated illness. The scenario's epiCurve is the curve
//    under that broad definition; revisedCurve is the same days after the
//    definition is tightened. The case-control table uses the revised cases.
//  - Quillfeather: a 34-guest lodge dinner with only nine cases. The
//    leading exposure has a real, large odds ratio, but so few people were
//    studied that its 95% CI crosses 1 (about 0.73 to 21.8).
// All settings and numbers are fictional.
// ---------------------------------------------------------------------------

export const BELLWETHER_SCENARIO: Scenario = {
  id: 'bellwether-fair', code: 'OI-26', name: 'Bellwether County Fair Gastroenteritis Reports', setting: 'A three-day county fair (about 600 attendees), over two weeks',
  syndrome: 'Vomiting and diarrhea, onset 8–36 hours after attending the fair',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Smoked pulled-pork sandwiches from Stall 12, held warm below a safe temperature during the fair\'s busiest afternoon',
  incubationHoursMin: 8, incubationHoursMax: 36, baselineCasesPerPeriod: 10, periodLabel: 'two weeks', observedCases: 73, populationAtRisk: 600,
  epiCurve: [{ day: 0, cases: 4 }, { day: 1, cases: 5 }, { day: 2, cases: 4 }, { day: 3, cases: 24 }, { day: 4, cases: 19 }, { day: 5, cases: 8 }, { day: 6, cases: 5 }, { day: 7, cases: 4 }],
  exposures: [
    { exposure: 'Smoked pulled-pork sandwich (Stall 12)', casesExposed: 41, casesUnexposed: 6, controlsExposed: 12, controlsUnexposed: 78 },
    { exposure: 'Funnel cake', casesExposed: 27, casesUnexposed: 20, controlsExposed: 40, controlsUnexposed: 50 },
    { exposure: 'Lemonade from a fair-wide vendor', casesExposed: 30, casesUnexposed: 17, controlsExposed: 50, controlsUnexposed: 40 },
    { exposure: 'Visited the petting zoo', casesExposed: 15, casesUnexposed: 32, controlsExposed: 25, controlsUnexposed: 65 },
    { exposure: 'Refilled a water bottle on the fairgrounds', casesExposed: 20, casesUnexposed: 27, controlsExposed: 34, controlsUnexposed: 56 },
  ],
  narrativeIntro: 'The county health department receives 73 reports of stomach illness in the two weeks around a county fair. The working definition at the start is deliberately broad: any diarrhea or vomiting in a county resident during that window. The case-control table below uses the cases that meet the revised definition.',
  labFindingsNarrative: 'Stool samples from several fair-linked cases grow a toxin-producing bacterium. Samples from several early reporters who never attended the fair are negative, or show a different, common virus circulating in their households.',
  notifiableClass: 'routine',
  caseDefRevision: {
    initialDefinition: 'Any diarrhea or vomiting in a county resident during the two weeks around the fair',
    reviewFinding: 'The first interviews split the reports into two groups: a sharp cluster of fair attendees with onset 8 to 36 hours later, and a scatter of reports from before the fair or from people who never attended, many in households with a known stomach bug.',
    revisedDefinition: 'Tiered. Probable: diarrhea or vomiting with onset 8 to 36 hours after attending the fair. Confirmed: probable plus a matching stool result.',
    revisedCurve: [{ day: 0, cases: 0 }, { day: 1, cases: 1 }, { day: 2, cases: 0 }, { day: 3, cases: 22 }, { day: 4, cases: 17 }, { day: 5, cases: 6 }, { day: 6, cases: 1 }, { day: 7, cases: 0 }],
    initialCount: 73,
    revisedCount: 47,
  },
}

export const QUILLFEATHER_SCENARIO: Scenario = {
  id: 'quillfeather-retreat', code: 'OI-27', name: 'Quillfeather Retreat Dinner Illness Cluster', setting: 'A 34-guest weekend retreat lodge',
  syndrome: 'Vomiting and cramping, onset 6–24 hours after the Saturday group dinner',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Reheated chicken curry served at the Saturday group dinner',
  incubationHoursMin: 6, incubationHoursMax: 24, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 9, populationAtRisk: 34,
  epiCurve: [{ day: 0, cases: 0 }, { day: 1, cases: 6 }, { day: 2, cases: 3 }],
  exposures: [
    { exposure: 'Reheated chicken curry', casesExposed: 6, casesUnexposed: 3, controlsExposed: 6, controlsUnexposed: 12 },
    { exposure: 'Salad bar', casesExposed: 5, casesUnexposed: 4, controlsExposed: 9, controlsUnexposed: 9 },
    { exposure: 'Bread pudding', casesExposed: 3, casesUnexposed: 6, controlsExposed: 8, controlsUnexposed: 10 },
    { exposure: 'Lodge well water', casesExposed: 4, casesUnexposed: 5, controlsExposed: 8, controlsUnexposed: 10 },
    { exposure: 'Sat at the long communal table', casesExposed: 6, casesUnexposed: 3, controlsExposed: 10, controlsUnexposed: 8 },
  ],
  narrativeIntro: 'Nine of the 34 guests at a weekend retreat fall ill within a day of the Saturday group dinner. The investigators interview all nine cases and 18 well guests as controls, which is all the guests who can be reached.',
  labFindingsNarrative: 'Stool samples from four of the nine cases identify a toxin-producing bacterium. No leftover food is available for testing. Symptom onset falls within a narrow window after the dinner.',
  notifiableClass: 'routine',
  smallSampleFlag: true,
}
