import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Two scenarios deliberately connecting this app's methodology to the rest
// of the portfolio. Meridian Clinic reframes the "outbreak" as a drug
// adverse-event cluster, requiring a Pharmacovigilance Detective-style
// causality judgment (temporal relationship, dechallenge, alternative
// causes) blended into the case-control framework. Crownpoint reframes it
// as a Drug Development Simulator-style manufacturing/CMC problem: the
// contamination traces to a specific production lot, not point-of-care
// handling — and a superficially similar-looking "vial reuse" exposure is a
// deliberate red herring, testing whether the investigation follows the
// actual traceback data rather than pattern-matching to a familiar cause.
// ---------------------------------------------------------------------------

export const MERIDIAN_CLINIC_SCENARIO: Scenario = {
  id: 'meridian-clinic-dili', code: 'OI-18', name: 'Meridian Clinic Drug-Induced Liver Injury Cluster', setting: 'An outpatient clinic prescribing a newly-approved oral medication for a chronic condition',
  syndrome: 'Elevated liver enzymes and jaundice, onset 2–8 weeks after starting the medication',
  trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'The newly-approved oral medication ("Drug X"), supported by a clear temporal relationship, improvement on dechallenge, and exclusion of alternative causes',
  incubationHoursMin: 336, incubationHoursMax: 1344, baselineCasesPerPeriod: 0, periodLabel: 'quarter', observedCases: 16, populationAtRisk: 300,
  epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 2 }, { day: 3, cases: 3 }, { day: 4, cases: 2 }, { day: 5, cases: 3 }, { day: 6, cases: 2 }, { day: 7, cases: 2 }, { day: 8, cases: 1 }],
  exposures: [
    { exposure: 'Drug X (the new medication)', casesExposed: 15, casesUnexposed: 1, controlsExposed: 40, controlsUnexposed: 160 },
    { exposure: 'A commonly co-prescribed second medication', casesExposed: 8, casesUnexposed: 8, controlsExposed: 90, controlsUnexposed: 110 },
    { exposure: 'Self-reported regular alcohol use', casesExposed: 4, casesUnexposed: 12, controlsExposed: 45, controlsUnexposed: 155 },
    { exposure: 'Obesity (pre-existing)', casesExposed: 7, casesUnexposed: 9, controlsExposed: 70, controlsUnexposed: 130 },
    { exposure: 'An over-the-counter herbal supplement', casesExposed: 3, casesUnexposed: 13, controlsExposed: 30, controlsUnexposed: 170 },
  ],
  narrativeIntro: 'A clinic pharmacist notices several patients recently started on a newly-approved medication developing elevated liver enzymes and jaundice within weeks of starting treatment.',
  labFindingsNarrative: 'Liver biopsy findings in a subset of cases are consistent with drug-induced injury. Symptoms improve within weeks of discontinuation (a positive dechallenge) in every case where the medication was stopped, and no alternative cause is identified on further workup.',
  notifiableClass: 'urgent',
  pharmacovigilanceLink: true,
}

export const CROWNPOINT_SCENARIO: Scenario = {
  id: 'crownpoint-injectable', code: 'OI-19', name: 'Crownpoint Sterile Injectable Contamination Cluster', setting: 'Multiple hospitals across a region, linked by a shared injectable medication from one manufacturer',
  syndrome: 'Bloodstream infection following injection of the product, onset 1–5 days after administration',
  trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'A specific manufacturing lot of the injectable medication, contaminated during production due to a sterility-assurance failure at the manufacturing site — not point-of-care handling',
  incubationHoursMin: 24, incubationHoursMax: 120, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 27, populationAtRisk: 600,
  epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 3 }, { day: 3, cases: 5 }, { day: 4, cases: 6 }, { day: 5, cases: 4 }, { day: 6, cases: 5 }, { day: 7, cases: 3 }],
  exposures: [
    { exposure: 'Product from the affected manufacturing lot', casesExposed: 25, casesUnexposed: 2, controlsExposed: 30, controlsUnexposed: 170 },
    { exposure: 'Point-of-care vial reuse across patients', casesExposed: 10, casesUnexposed: 17, controlsExposed: 25, controlsUnexposed: 175 },
    { exposure: 'A specific hospital pharmacy', casesExposed: 12, casesUnexposed: 15, controlsExposed: 60, controlsUnexposed: 140 },
    { exposure: 'IV (vs. intramuscular) administration route', casesExposed: 20, casesUnexposed: 7, controlsExposed: 140, controlsUnexposed: 60 },
    { exposure: 'Concurrent antibiotic use', casesExposed: 8, casesUnexposed: 19, controlsExposed: 50, controlsUnexposed: 150 },
  ],
  narrativeIntro: 'Infection preventionists at several unrelated hospitals independently notice clusters of bloodstream infections and, comparing notes, realize the affected patients all received the same injectable medication from one manufacturer.',
  labFindingsNarrative: 'Molecular typing confirms a matching bacterial strain across facilities. Point-of-care vial handling looked initially suspicious at one site, but the pattern spans multiple hospitals with no shared staff or handling practices — pointing further upstream.',
  notifiableClass: 'urgent',
  manufacturingLink: true,
}
