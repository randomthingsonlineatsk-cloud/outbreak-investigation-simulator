import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// A deliberate curveball: two catered meals (Friday dinner, Saturday lunch)
// produce a bimodal epi curve that looks like it could be "propagated"
// (two waves) — but there is no person-to-person spread at all. Neither
// meal's dish looks causal on its own (each OR is unremarkable), because
// the true common thread is a shared, reused piece of kitchen equipment
// contaminating both dishes. This teaches that a two-peak curve doesn't
// automatically mean person-to-person spread, and that decomposing a
// shared-source exposure into its separate meals can hide the real signal.
// ---------------------------------------------------------------------------

export const CRESTWOOD_SCENARIO: Scenario = {
  id: 'crestwood-retreat', code: 'OI-17', name: 'Crestwood Corporate Retreat Illness Cluster', setting: 'A weekend corporate retreat (120 attendees) with Friday dinner and Saturday lunch catered by the same company',
  syndrome: 'Vomiting and diarrhea, onset 8–30 hours after either meal',
  trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'A cutting board used to prepare both the Friday chicken dish and the Saturday egg dish, without being sanitized between uses',
  incubationHoursMin: 8, incubationHoursMax: 30, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 44, populationAtRisk: 120,
  epiCurve: [{ day: 0, cases: 1 }, { day: 1, cases: 14 }, { day: 2, cases: 5 }, { day: 3, cases: 15 }, { day: 4, cases: 7 }, { day: 5, cases: 2 }],
  exposures: [
    { exposure: 'Dish prepared on the shared cutting board (Friday chicken or Saturday egg)', casesExposed: 40, casesUnexposed: 4, controlsExposed: 15, controlsUnexposed: 45 },
    { exposure: 'Friday chicken dish only', casesExposed: 22, casesUnexposed: 22, controlsExposed: 25, controlsUnexposed: 35 },
    { exposure: 'Saturday egg dish only', casesExposed: 20, casesUnexposed: 24, controlsExposed: 22, controlsUnexposed: 38 },
    { exposure: 'Attended both Friday and Saturday', casesExposed: 35, casesUnexposed: 9, controlsExposed: 30, controlsUnexposed: 30 },
    { exposure: 'Bottled beverages only', casesExposed: 5, casesUnexposed: 39, controlsExposed: 30, controlsUnexposed: 30 },
  ],
  narrativeIntro: 'Illness is first reported after Friday dinner and looks like a contained point-source event — until a second wave appears after Saturday lunch, and some Friday-only departures who skipped Saturday entirely are still among the ill.',
  labFindingsNarrative: 'Investigators initially treated Friday and Saturday as separate, unrelated events. Neither the Friday chicken dish nor the Saturday egg dish alone showed a strong association — but both dishes turn out to have been prepared using the same cutting board, never sanitized between the two meals.',
  notifiableClass: 'urgent',
}
