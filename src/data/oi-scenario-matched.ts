import type { MatchedPairRow, Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Lakeview: a 1:1 matched case-control study (40 pairs, matched on age group
// and neighborhood). The pair tallies below are the single source of truth.
// The scenario's exposures table is DERIVED from them (the crude view that
// ignores the pairing), so the crude and matched odds ratios can never drift
// apart. For each exposure:
//   matched OR = caseOnly / controlOnly            (discordant pairs only)
//   crude OR   = ordinary 2x2 on pooled cases and controls
// For the deli salad the matched OR is 18.0 and the crude OR is about 7.7:
// ignoring the matching pulls the estimate toward 1. All numbers fictional.
// ---------------------------------------------------------------------------

const PAIR_ROWS: MatchedPairRow[] = [
  { exposure: 'Salad from the lakeside deli', bothExposed: 16, caseOnly: 18, controlOnly: 1, neither: 5 },
  { exposure: 'Drank from the trailhead water fountain', bothExposed: 5, caseOnly: 9, controlOnly: 7, neither: 19 },
  { exposure: 'Attended the summer market', bothExposed: 10, caseOnly: 8, controlOnly: 6, neither: 16 },
  { exposure: 'Ice cream from the corner stand', bothExposed: 8, caseOnly: 7, controlOnly: 9, neither: 16 },
  { exposure: 'Swam at the lake', bothExposed: 12, caseOnly: 10, controlOnly: 8, neither: 10 },
]

export const LAKEVIEW_SCENARIO: Scenario = {
  id: 'lakeview-trailhead', code: 'OI-30', name: 'Lakeview Trailhead Gastroenteritis Cluster', setting: 'A lakeside town, over two weeks, studied with one matched control per case',
  syndrome: 'Vomiting, diarrhea, and cramps, onset 12–48 hours after exposure',
  trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Salad from the lakeside deli, prepared with contaminated ingredients on the affected days',
  incubationHoursMin: 12, incubationHoursMax: 48, baselineCasesPerPeriod: 4, periodLabel: 'month', observedCases: 40, populationAtRisk: 3200,
  epiCurve: [{ day: 0, cases: 0 }, { day: 1, cases: 9 }, { day: 2, cases: 20 }, { day: 3, cases: 9 }, { day: 4, cases: 2 }],
  exposures: PAIR_ROWS.map((r) => ({
    exposure: r.exposure,
    casesExposed: r.bothExposed + r.caseOnly,
    casesUnexposed: r.controlOnly + r.neither,
    controlsExposed: r.bothExposed + r.controlOnly,
    controlsUnexposed: r.caseOnly + r.neither,
  })),
  narrativeIntro: 'Forty residents report gastrointestinal illness over about two weeks. To limit confounding by age and neighborhood, investigators match each case to one well control of the same age group who lives in the same neighborhood, giving 40 matched pairs.',
  labFindingsNarrative: 'Stool samples from several cases grow a bacterial pathogen consistent with a foodborne source. No secondary cases are reported among household members.',
  notifiableClass: 'routine',
  matchedPairs: { matchedOn: 'age group and neighborhood', pairs: 40, rows: PAIR_ROWS },
}
