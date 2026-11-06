import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Two scenarios about bias in how the comparison data were gathered:
//  - Northfield: a self-reported exposure (the salad bar) looks strong
//    (OR 5.5) because ill staff searched their memories for an explanation
//    while well colleagues did not. Objective records (check-in sheets and
//    tray scans) show it is not (OR about 1.4). The real vehicle, the
//    boxed sandwiches, has the highest odds ratio either way.
//  - Pinehurst: the recommended control group (a random draw of attendees
//    from ticket records) gives the true taco-truck OR of 25. Controls
//    drawn from companions of cases (who shared the meals) or from
//    self-selected hotline callers give badly distorted values.
// All settings and numbers are fictional.
// ---------------------------------------------------------------------------

export const NORTHFIELD_SCENARIO: Scenario = {
  id: 'northfield-all-hands', code: 'OI-28', name: 'Northfield All-Hands Lunch Illness Cluster', setting: 'A company all-hands day with a catered lunch (about 260 staff), over one week',
  syndrome: 'Nausea, vomiting, and diarrhea, onset 6–30 hours after the lunch',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Pre-ordered boxed turkey-and-swiss sandwiches, delivered mid-morning and held unrefrigerated until lunch',
  incubationHoursMin: 6, incubationHoursMax: 30, baselineCasesPerPeriod: 2, periodLabel: 'week', observedCases: 30, populationAtRisk: 260,
  epiCurve: [{ day: 0, cases: 0 }, { day: 1, cases: 22 }, { day: 2, cases: 6 }, { day: 3, cases: 2 }],
  exposures: [
    { exposure: 'Pre-ordered boxed turkey-and-swiss sandwich', casesExposed: 26, casesUnexposed: 4, controlsExposed: 15, controlsUnexposed: 45 },
    { exposure: 'Ate from the salad bar', casesExposed: 22, casesUnexposed: 8, controlsExposed: 20, controlsUnexposed: 40 },
    { exposure: 'Fruit platter', casesExposed: 16, casesUnexposed: 14, controlsExposed: 30, controlsUnexposed: 30 },
    { exposure: 'Coffee station', casesExposed: 20, casesUnexposed: 10, controlsExposed: 40, controlsUnexposed: 20 },
    { exposure: 'Sat in the main ballroom', casesExposed: 18, casesUnexposed: 12, controlsExposed: 30, controlsUnexposed: 30 },
  ],
  narrativeIntro: 'Thirty staff report gastrointestinal illness after a company all-hands day with a catered lunch. Investigators interview all cases and 60 well colleagues about what they ate, a few days after the event. Word has already spread through the office that the salad bar "looked off".',
  labFindingsNarrative: 'Stool samples from several cases grow a toxin-producing bacterium. The company kept some records: sandwich pre-orders through the company lunch app, and check-in sheets and tray scans at the salad bar station.',
  notifiableClass: 'routine',
  recallBiasCheck: {
    exposureLabel: 'Ate from the salad bar',
    recordSource: 'salad-bar check-in sheets and tray scans',
    verified: { casesExposed: 15, casesUnexposed: 15, controlsExposed: 25, controlsUnexposed: 35 },
  },
}

export const PINEHURST_SCENARIO: Scenario = {
  id: 'pinehurst-festival', code: 'OI-29', name: 'Pinehurst Street Festival Illness Cluster', setting: 'A one-day neighborhood street festival (about 1,500 attendees), over five days',
  syndrome: 'Watery diarrhea and cramping, onset 12–48 hours after the festival',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Tacos from the corner truck, prepared ahead and held below a safe temperature during the afternoon rush',
  incubationHoursMin: 12, incubationHoursMax: 48, baselineCasesPerPeriod: 3, periodLabel: 'month', observedCases: 36, populationAtRisk: 1500,
  epiCurve: [{ day: 0, cases: 0 }, { day: 1, cases: 14 }, { day: 2, cases: 20 }, { day: 3, cases: 2 }],
  exposures: [
    { exposure: 'Tacos from the corner truck', casesExposed: 30, casesUnexposed: 6, controlsExposed: 12, controlsUnexposed: 60 },
    { exposure: 'Festival lemonade', casesExposed: 20, casesUnexposed: 16, controlsExposed: 30, controlsUnexposed: 42 },
    { exposure: 'Bounce house area', casesExposed: 14, casesUnexposed: 22, controlsExposed: 28, controlsUnexposed: 44 },
    { exposure: 'Live music stage area', casesExposed: 25, casesUnexposed: 11, controlsExposed: 44, controlsUnexposed: 28 },
    { exposure: 'Farmers market produce stall', casesExposed: 12, casesUnexposed: 24, controlsExposed: 22, controlsUnexposed: 50 },
  ],
  narrativeIntro: 'Thirty-six people report illness after a neighborhood street festival, found through emergency-department visits and calls to the health department. Investigators now need a comparison group, and several ways of finding one are on the table.',
  labFindingsNarrative: 'Stool samples from several cases grow a bacterial pathogen consistent with a foodborne source. The festival sold wristbands and tickets in advance, so a list of attendees exists.',
  notifiableClass: 'routine',
  selectionBiasCheck: {
    exposureLabel: 'Tacos from the corner truck',
    recommendedLabel: 'Random draw of festival attendees from ticket and wristband records who did not become ill (this study)',
    alternatives: [
      { label: 'Companions who attended with a case', note: 'Companions shared meals with the case, so they were exposed at nearly the same rate. That pulls the odds ratio toward 1 and can hide the true vehicle.', controlsExposed: 48, controlsUnexposed: 24 },
      { label: 'Callers to the health hotline who did not meet the case definition', note: 'People who phone about the festival are self-selected. Many called because they ate from vendors they suspect, so they are not representative of attendees.', controlsExposed: 40, controlsUnexposed: 32 },
    ],
  },
}
