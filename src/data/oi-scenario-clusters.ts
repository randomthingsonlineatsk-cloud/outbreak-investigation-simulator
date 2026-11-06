import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Two scenarios about defining the problem correctly before analysing it:
//  - Halden: a non-infectious occupational cluster. Every instinct of an
//    outbreak investigator says "contagious", and the data say otherwise.
//  - Lindenwood: two unrelated clusters (a deli-linked foodborne cluster and
//    a childcare-center person-to-person cluster) pooled into one case
//    count. Analysed as a single outbreak, each true source is diluted.
// All settings and numbers are fictional.
// ---------------------------------------------------------------------------

export const HALDEN_SCENARIO: Scenario = {
  id: 'halden-plant', code: 'OI-24', name: 'Halden Precision Components Worker Illness Cluster', setting: 'A 120-worker metal-parts plant, over two weeks',
  syndrome: 'Cough, shortness of breath, and flu-like aches beginning several hours into a shift and easing on days off',
  trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'Aerosolized, microbially contaminated recirculating coolant on production Line 3 — a non-infectious, work-related exposure',
  incubationHoursMin: 4, incubationHoursMax: 12, baselineCasesPerPeriod: 0, periodLabel: 'year', observedCases: 15, populationAtRisk: 120,
  epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 2 }, { day: 3, cases: 2 }, { day: 4, cases: 3 }, { day: 5, cases: 1 }, { day: 6, cases: 2 }, { day: 7, cases: 1 }, { day: 8, cases: 1 }, { day: 9, cases: 1 }, { day: 10, cases: 1 }],
  exposures: [
    { exposure: 'Worked on Line 3 (machining with the recirculating coolant)', casesExposed: 14, casesUnexposed: 1, controlsExposed: 10, controlsUnexposed: 60 },
    { exposure: 'Night shift', casesExposed: 8, casesUnexposed: 7, controlsExposed: 25, controlsUnexposed: 45 },
    { exposure: 'Employed more than five years', casesExposed: 9, casesUnexposed: 6, controlsExposed: 30, controlsUnexposed: 40 },
    { exposure: 'Current smoker', casesExposed: 6, casesUnexposed: 9, controlsExposed: 18, controlsUnexposed: 52 },
    { exposure: 'Ate in the plant cafeteria', casesExposed: 10, casesUnexposed: 5, controlsExposed: 45, controlsUnexposed: 25 },
  ],
  narrativeIntro: 'The plant nurse notices several workers from the same production area reporting cough, breathlessness, and flu-like aches that begin during a shift and improve over a weekend, then return on Monday.',
  labFindingsNarrative: 'No infectious pathogen is identified in any case, and none of the workers\' household members or coworkers in other areas are ill. Sampling of the Line 3 recirculating coolant shows heavy microbial growth, and air sampling near the machines shows fine mist in the breathing zone.',
  notifiableClass: 'routine',
  occupationalFlag: true,
}

export const LINDENWOOD_SCENARIO: Scenario = {
  id: 'lindenwood-two-clusters', code: 'OI-25', name: 'Lindenwood Town Gastroenteritis Reports', setting: 'A small town, over three weeks',
  syndrome: 'Vomiting and diarrhea, onset 12–48 hours',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Chicken salad from the Main Street deli, behind the larger, foodborne cluster. A second, unrelated cluster of person-to-person spread at a childcare center is mixed into the same case count.',
  incubationHoursMin: 12, incubationHoursMax: 48, baselineCasesPerPeriod: 2, periodLabel: 'month', observedCases: 40, populationAtRisk: 900,
  epiCurve: [{ day: 1, cases: 2 }, { day: 2, cases: 1 }, { day: 3, cases: 14 }, { day: 4, cases: 9 }, { day: 5, cases: 3 }, { day: 6, cases: 1 }, { day: 7, cases: 2 }, { day: 8, cases: 5 }, { day: 9, cases: 3 }],
  exposures: [
    { exposure: 'Chicken salad from the Main Street deli', casesExposed: 23, casesUnexposed: 17, controlsExposed: 7, controlsUnexposed: 73 },
    { exposure: 'Attends or works at the Little Acorns childcare center', casesExposed: 13, casesUnexposed: 27, controlsExposed: 5, controlsUnexposed: 75 },
    { exposure: 'Drank municipal tap water', casesExposed: 36, casesUnexposed: 4, controlsExposed: 70, controlsUnexposed: 10 },
    { exposure: 'Bought produce at the town grocery', casesExposed: 15, casesUnexposed: 25, controlsExposed: 30, controlsUnexposed: 50 },
    { exposure: 'Swam at the town pool', casesExposed: 9, casesUnexposed: 31, controlsExposed: 20, controlsUnexposed: 60 },
  ],
  narrativeIntro: 'A rise in vomiting and diarrhea across a small town gets reported as one outbreak. The combined case curve has a big early peak and a smaller second bump a few days later.',
  labFindingsNarrative: 'Stool testing separates the cases into two different pathogens: a toxin-producing bacterium in most of the adult cases, and a highly contagious virus in the cases linked to the childcare center. The cases also fall into very different age groups.',
  notifiableClass: 'routine',
  personBreakdown: {
    dimensionLabel: 'Age group',
    groups: [
      { label: 'Under 6', ill: 13, total: 60 },
      { label: '6 to 17', ill: 2, total: 140 },
      { label: '18 and over', ill: 25, total: 700 },
    ],
  },
  twoClustersFlag: true,
}
