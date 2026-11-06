import type { Scenario } from './oi-types'
import { SCENARIOS_EXTRA } from './oi-scenarios-extra'
import { CRESTWOOD_SCENARIO } from './oi-scenario-crestwood'
import { MERIDIAN_CLINIC_SCENARIO, CROWNPOINT_SCENARIO } from './oi-scenario-crossportfolio'
import { MORE_SCENARIOS } from './oi-scenarios-more'

// ---------------------------------------------------------------------------
// All outbreaks, settings, and case-control numbers below are entirely
// fictional, constructed for teaching purposes. Odds ratios are computed
// from the exact 2x2 counts given (OR = (casesExposed × controlsUnexposed)
// / (controlsExposed × casesUnexposed)) — a standard case-control measure of
// association. Curve-shape classification follows standard field-
// epidemiology teaching: a single, sharp peak within one incubation period
// indicates a point-source exposure; a curve with successive waves roughly
// one incubation period apart indicates person-to-person (propagated)
// spread; an irregular curve with multiple peaks over a longer period,
// with no single sharp peak and no regular wave spacing, indicates an
// ongoing/intermittent common-vehicle exposure. A few scenarios with a
// small, fully enumerable population (a guest list, a resident roster) also
// carry a cohortComparison — the same underlying data reframed as a cohort
// study, so relative risk can be taught alongside odds ratio. A few also
// carry doseResponse (attack rate by amount/frequency of exposure — a
// Bradford Hill criterion supporting causation) or a stratifiedAnalysis
// (the same crude exposure broken out by a confounder, to show how a
// seemingly real crude association can be an artifact of confounding). A
// few carry caseCountByDefinition — the same population counted three ways
// (very broad / syndrome-based / lab-confirmed-only) to make the
// sensitivity/specificity trade-off in case-definition writing concrete.
// resourceConstrained marks scenarios whose population is too large to
// fully interview, unlocking an extra sampling-bias decision in inspection.
// The propagated dormitory scenario carries a contactNetwork — a small
// transmission-chain diagram used to practice identifying the index case.
// The wedding scenario carries a spotMap (place) and personBreakdown
// (person), completing the classic person/place/time descriptive triad
// alongside the epi curve (time).
// Scenarios from the later batches live in oi-scenarios-more.ts.
// ---------------------------------------------------------------------------

const SCENARIOS_CORE: Scenario[] = [
  {
    id: 'ridgeview-wedding', code: 'OI-1', name: 'The Ridgeview Wedding Cluster', setting: 'A 220-guest wedding reception at a banquet hall',
    syndrome: 'Acute watery diarrhea, cramping, and low-grade fever, onset 12–36 hours after the reception',
    trueRoute: 'foodborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Chicken salad (mayonnaise-based, held at room temperature for several hours during the reception)',
    incubationHoursMin: 12, incubationHoursMax: 36, baselineCasesPerPeriod: 2, periodLabel: 'week', observedCases: 68, populationAtRisk: 220,
    epiCurve: [{ day: 0, cases: 1 }, { day: 1, cases: 41 }, { day: 2, cases: 19 }, { day: 3, cases: 5 }, { day: 4, cases: 2 }, { day: 5, cases: 0 }],
    exposures: [
      { exposure: 'Chicken salad', casesExposed: 45, casesUnexposed: 5, controlsExposed: 15, controlsUnexposed: 45 },
      { exposure: 'Garden salad', casesExposed: 30, casesUnexposed: 20, controlsExposed: 32, controlsUnexposed: 28 },
      { exposure: 'Dinner rolls', casesExposed: 40, casesUnexposed: 10, controlsExposed: 48, controlsUnexposed: 12 },
      { exposure: 'Wedding cake', casesExposed: 35, casesUnexposed: 15, controlsExposed: 40, controlsUnexposed: 20 },
      { exposure: 'Champagne toast', casesExposed: 20, casesUnexposed: 30, controlsExposed: 25, controlsUnexposed: 35 },
    ],
    narrativeIntro: 'The local health department receives multiple calls about gastrointestinal illness following a Saturday wedding reception. Guests began reporting symptoms starting the next morning.',
    labFindingsNarrative: 'Stool samples from a subset of cases confirm a bacterial pathogen consistent with a foodborne source. No secondary cases are reported among household members who did not attend the reception.',
    notifiableClass: 'urgent',
    cohortComparison: { exposedTotal: 120, exposedIll: 58, unexposedTotal: 100, unexposedIll: 10 },
    doseResponse: [
      { level: 'No chicken salad', ill: 10, total: 100 },
      { level: '1 serving', ill: 24, total: 70 },
      { level: '2+ servings', ill: 34, total: 50 },
    ],
    caseCountByDefinition: [
      { label: 'Very broad (any GI symptom, any timing, any location)', count: 210 },
      { label: 'Syndrome-based (matching symptoms + 12–36h timing + attended reception)', count: 68 },
      { label: 'Lab-confirmed only', count: 22 },
    ],
    spotMap: {
      note: 'Zones closer to the buffet line (where the chicken salad was served) show markedly higher attack rates than zones farther away. Each zone groups two or three neighboring tables, and together the ten zones cover every guest.',
      locations: [
        { label: 'Zone 1 (buffet line)', caseCount: 14, totalPeople: 22, x: 60, y: 70 },
        { label: 'Zone 2 (buffet line)', caseCount: 13, totalPeople: 22, x: 160, y: 70 },
        { label: 'Zone 3 (buffet line)', caseCount: 13, totalPeople: 22, x: 260, y: 70 },
        { label: 'Zone 4 (buffet line)', caseCount: 12, totalPeople: 22, x: 360, y: 70 },
        { label: 'Zone 5 (buffet line)', caseCount: 11, totalPeople: 22, x: 460, y: 70 },
        { label: 'Zone 6 (far from buffet)', caseCount: 2, totalPeople: 22, x: 60, y: 180 },
        { label: 'Zone 7 (far from buffet)', caseCount: 1, totalPeople: 22, x: 160, y: 180 },
        { label: 'Zone 8 (far from buffet)', caseCount: 1, totalPeople: 22, x: 260, y: 180 },
        { label: 'Zone 9 (far from buffet)', caseCount: 1, totalPeople: 22, x: 360, y: 180 },
        { label: 'Zone 10 (far from buffet)', caseCount: 0, totalPeople: 22, x: 460, y: 180 },
      ],
    },
    personBreakdown: {
      dimensionLabel: 'Role at the event',
      groups: [
        { label: 'Bridal party', ill: 9, total: 12 },
        { label: 'Family', ill: 30, total: 90 },
        { label: 'Friends', ill: 25, total: 100 },
        { label: 'Vendors/staff', ill: 4, total: 18 },
      ],
    },
  },
  {
    id: 'sunview-pool', code: 'OI-2', name: 'Sunview Community Pool Outbreak', setting: 'A public swimming pool over a holiday weekend',
    syndrome: 'Watery diarrhea, sometimes prolonged, with low-grade fever, onset 2–10 days after swimming',
    trueRoute: 'waterborne_point_source', trueCurveShape: 'point_source', trueVehicle: 'Swallowing contaminated water in the main pool (chlorine level found subtherapeutic on inspection)',
    incubationHoursMin: 48, incubationHoursMax: 240, baselineCasesPerPeriod: 1, periodLabel: 'week', observedCases: 54, populationAtRisk: 800,
    epiCurve: [{ day: 1, cases: 0 }, { day: 2, cases: 2 }, { day: 3, cases: 6 }, { day: 4, cases: 11 }, { day: 5, cases: 15 }, { day: 6, cases: 10 }, { day: 7, cases: 6 }, { day: 8, cases: 3 }, { day: 9, cases: 1 }, { day: 10, cases: 0 }],
    exposures: [
      { exposure: 'Main pool (swallowed water)', casesExposed: 48, casesUnexposed: 2, controlsExposed: 20, controlsUnexposed: 40 },
      { exposure: 'Wading pool', casesExposed: 10, casesUnexposed: 40, controlsExposed: 12, controlsUnexposed: 48 },
      { exposure: 'Snack bar food', casesExposed: 25, casesUnexposed: 25, controlsExposed: 28, controlsUnexposed: 32 },
      { exposure: 'Shared sunscreen', casesExposed: 8, casesUnexposed: 42, controlsExposed: 9, controlsUnexposed: 51 },
      { exposure: 'Pool deck lounging', casesExposed: 44, casesUnexposed: 6, controlsExposed: 50, controlsUnexposed: 10 },
    ],
    narrativeIntro: 'A sharp rise in gastrointestinal illness is reported among people who visited a public pool over a three-day holiday weekend, with cases still arriving more than a week later.',
    labFindingsNarrative: 'A parasite consistent with a chlorine-resistant waterborne pathogen is identified in several stool samples. Pool inspection finds the chlorinator had been malfunctioning intermittently.',
    notifiableClass: 'urgent',
  },
  {
    id: 'eastview-hall', code: 'OI-3', name: 'Eastview Hall Illness Cluster', setting: 'A university dormitory (420 residents) over three weeks',
    syndrome: 'Sudden-onset vomiting and diarrhea, resolving within 24–48 hours',
    trueRoute: 'person_to_person_propagated', trueCurveShape: 'propagated', trueVehicle: 'Direct person-to-person contact and contaminated high-touch surfaces in the residence hall — not a single shared meal or water source',
    incubationHoursMin: 12, incubationHoursMax: 48, baselineCasesPerPeriod: 1, periodLabel: 'week', observedCases: 87, populationAtRisk: 420,
    epiCurve: [{ day: 1, cases: 2 }, { day: 2, cases: 5 }, { day: 3, cases: 9 }, { day: 4, cases: 6 }, { day: 5, cases: 3 }, { day: 6, cases: 2 }, { day: 7, cases: 4 }, { day: 8, cases: 8 }, { day: 9, cases: 11 }, { day: 10, cases: 7 }, { day: 11, cases: 3 }, { day: 12, cases: 2 }, { day: 13, cases: 3 }, { day: 14, cases: 6 }, { day: 15, cases: 9 }, { day: 16, cases: 5 }, { day: 17, cases: 2 }, { day: 18, cases: 0 }],
    exposures: [
      { exposure: 'Dining hall meals', casesExposed: 80, casesUnexposed: 7, controlsExposed: 85, controlsUnexposed: 8 },
      { exposure: 'Same floor as an early case', casesExposed: 52, casesUnexposed: 18, controlsExposed: 18, controlsUnexposed: 72 },
      { exposure: 'Shared bathroom without handwashing after', casesExposed: 58, casesUnexposed: 12, controlsExposed: 30, controlsUnexposed: 60 },
      { exposure: 'Attended a dorm party', casesExposed: 20, casesUnexposed: 50, controlsExposed: 25, controlsUnexposed: 65 },
      { exposure: 'Regular hand sanitizer use', casesExposed: 15, casesUnexposed: 55, controlsExposed: 45, controlsUnexposed: 45 },
    ],
    narrativeIntro: 'Cases of sudden vomiting and diarrhea begin appearing in one dormitory and continue in waves over three weeks, spreading floor by floor rather than settling after one sharp peak.',
    labFindingsNarrative: 'A highly contagious viral pathogen is confirmed, known for spreading efficiently through contaminated surfaces and close contact rather than through food or water.',
    notifiableClass: 'routine',
    cohortComparison: { exposedTotal: 150, exposedIll: 65, unexposedTotal: 270, unexposedIll: 22 },
    caseCountByDefinition: [
      { label: 'Very broad (any GI symptom anywhere on campus, any timing)', count: 140 },
      { label: 'Syndrome-based (matching symptoms + resident of the hall + within outbreak window)', count: 87 },
      { label: 'Lab-confirmed only', count: 30 },
    ],
    contactNetwork: {
      nodes: [
        { id: 'A', label: 'Case A (Rm 214, day 1)', day: 1 },
        { id: 'B', label: 'Case B (Rm 216, day 3)', day: 3 },
        { id: 'C', label: 'Case C (Rm 210, day 3)', day: 3 },
        { id: 'D', label: 'Case D (Rm 218, day 8)', day: 8 },
        { id: 'E', label: 'Case E (Rm 220, day 8)', day: 8 },
        { id: 'F', label: 'Case F (Rm 208, day 8)', day: 8 },
        { id: 'G', label: 'Case G (Rm 222, day 15)', day: 15 },
        { id: 'H', label: 'Case H (Rm 224, day 15)', day: 15 },
      ],
      edges: [
        { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
        { from: 'B', to: 'D' }, { from: 'B', to: 'E' },
        { from: 'C', to: 'F' },
        { from: 'D', to: 'G' }, { from: 'D', to: 'H' },
      ],
      indexCaseId: 'A',
      candidateIds: ['A', 'B', 'C', 'D'],
    },
  },
  {
    id: 'meadowbrook', code: 'OI-4', name: 'Meadowbrook Apartments Illness Cluster', setting: 'A 300-unit apartment complex with a shared rooftop water tank, over six weeks',
    syndrome: 'Gastroenteritis appearing in intermittent clusters',
    trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: "Tap water from the building's rooftop storage tank, intermittently contaminated by a cracked inlet that let in runoff, worse after rainfall",
    incubationHoursMin: 24, incubationHoursMax: 72, baselineCasesPerPeriod: 1, periodLabel: 'week', observedCases: 64, populationAtRisk: 900,
    epiCurve: [{ day: 1, cases: 3 }, { day: 2, cases: 4 }, { day: 3, cases: 14 }, { day: 4, cases: 6 }, { day: 5, cases: 3 }, { day: 6, cases: 12 }, { day: 7, cases: 15 }, { day: 8, cases: 5 }, { day: 9, cases: 2 }],
    exposures: [
      { exposure: 'Drinking unboiled tap water', casesExposed: 54, casesUnexposed: 6, controlsExposed: 20, controlsUnexposed: 50 },
      { exposure: 'Bottled water only', casesExposed: 4, casesUnexposed: 56, controlsExposed: 35, controlsUnexposed: 35 },
      { exposure: 'Laundry room use', casesExposed: 40, casesUnexposed: 20, controlsExposed: 42, controlsUnexposed: 28 },
      { exposure: 'Elevator use', casesExposed: 50, casesUnexposed: 10, controlsExposed: 58, controlsUnexposed: 12 },
      { exposure: 'Complex gym use', casesExposed: 15, casesUnexposed: 45, controlsExposed: 18, controlsUnexposed: 52 },
    ],
    narrativeIntro: 'Residents of a large apartment complex report recurring waves of gastrointestinal illness over six weeks, without a single obvious shared meal or event connecting the cases.',
    labFindingsNarrative: 'Water quality testing finds intermittent fecal contamination in the rooftop tank, correlating with recent rainfall events. No secondary spread is documented between affected households.',
    notifiableClass: 'routine',
    doseResponse: [
      { level: 'Never drinks tap water', ill: 6, total: 200 },
      { level: 'Occasionally (weekly)', ill: 18, total: 300 },
      { level: 'Daily', ill: 40, total: 400 },
    ],
  },
  {
    id: 'palm-grove', code: 'OI-5', name: 'Palm Grove District Fever Cluster', setting: 'A suburban district during peak mosquito season',
    syndrome: 'Fever, joint pain, and rash, onset 3–14 days after likely exposure',
    trueRoute: 'vector_borne', trueCurveShape: 'continuous_common_source', trueVehicle: 'Mosquito bites from a locally breeding population near an abandoned construction site with pooled, untreated rainwater',
    incubationHoursMin: 72, incubationHoursMax: 336, baselineCasesPerPeriod: 2, periodLabel: 'month', observedCases: 46, populationAtRisk: 3000,
    epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 2 }, { day: 3, cases: 5 }, { day: 4, cases: 8 }, { day: 5, cases: 9 }, { day: 6, cases: 7 }, { day: 7, cases: 6 }, { day: 8, cases: 4 }, { day: 9, cases: 3 }, { day: 10, cases: 1 }],
    exposures: [
      { exposure: 'Lives within 200m of the construction site', casesExposed: 38, casesUnexposed: 6, controlsExposed: 15, controlsUnexposed: 45 },
      { exposure: 'Regular outdoor evening activity', casesExposed: 31, casesUnexposed: 13, controlsExposed: 24, controlsUnexposed: 36 },
      { exposure: 'Uses mosquito repellent', casesExposed: 8, casesUnexposed: 36, controlsExposed: 30, controlsUnexposed: 30 },
      { exposure: 'Window screens present at home', casesExposed: 10, casesUnexposed: 34, controlsExposed: 35, controlsUnexposed: 25 },
      { exposure: 'Recent travel outside the district', casesExposed: 5, casesUnexposed: 39, controlsExposed: 6, controlsUnexposed: 54 },
    ],
    narrativeIntro: 'A cluster of febrile illness with joint pain and rash appears in one suburban district over several weeks during mosquito season, with no clear connection to a shared meal, water source, or person-to-person contact.',
    labFindingsNarrative: 'Serology confirms a vector-borne pathogen. Larval surveys find dense mosquito breeding at a nearby site with standing water.',
    notifiableClass: 'urgent',
    stratifiedAnalysis: {
      confounder: 'Proximity to the construction site',
      exposureLabel: 'Regular outdoor evening activity',
      strata: [
        { label: 'Lives near the site', casesExposed: 27, casesUnexposed: 3, controlsExposed: 13, controlsUnexposed: 2 },
        { label: 'Does not live near the site', casesExposed: 4, casesUnexposed: 10, controlsExposed: 11, controlsUnexposed: 34 },
      ],
    },
    resourceConstrained: true,
  },
  {
    id: 'harborview-cafeteria', code: 'OI-6', name: 'Harborview Cafeteria Rapid-Onset Illness', setting: 'A corporate cafeteria lunch service',
    syndrome: 'Sudden nausea and vomiting within 1–6 hours, no fever, resolving within a day, no secondary cases among household contacts',
    trueRoute: 'toxin_point_source', trueCurveShape: 'point_source', trueVehicle: 'Fried rice held at improper temperature for several hours before service',
    incubationHoursMin: 1, incubationHoursMax: 6, baselineCasesPerPeriod: 0, periodLabel: 'week', observedCases: 39, populationAtRisk: 150,
    epiCurve: [{ day: 0, cases: 2 }, { day: 1, cases: 34 }, { day: 2, cases: 3 }, { day: 3, cases: 0 }],
    exposures: [
      { exposure: 'Fried rice', casesExposed: 33, casesUnexposed: 3, controlsExposed: 10, controlsUnexposed: 40 },
      { exposure: 'Grilled chicken', casesExposed: 20, casesUnexposed: 16, controlsExposed: 22, controlsUnexposed: 28 },
      { exposure: 'Side salad', casesExposed: 15, casesUnexposed: 21, controlsExposed: 18, controlsUnexposed: 32 },
      { exposure: 'Iced tea', casesExposed: 25, casesUnexposed: 11, controlsExposed: 28, controlsUnexposed: 22 },
      { exposure: 'Bread rolls', casesExposed: 10, casesUnexposed: 26, controlsExposed: 12, controlsUnexposed: 38 },
    ],
    narrativeIntro: 'Within a few hours of a cafeteria lunch service, dozens of employees report sudden vomiting. Symptoms resolve quickly, and no one who ate at home is affected.',
    labFindingsNarrative: 'No fever is reported in any case, and the extremely short incubation period is inconsistent with most bacterial or viral infections — pointing toward a preformed toxin rather than an infectious pathogen.',
    notifiableClass: 'routine',
    cohortComparison: { exposedTotal: 90, exposedIll: 33, unexposedTotal: 60, unexposedIll: 6 },
  },
  {
    id: 'lakeside-infusion', code: 'OI-7', name: 'Lakeside Infusion Clinic Bloodstream Infection Cluster', setting: 'An outpatient infusion therapy clinic, over five weeks',
    syndrome: 'Fever and bloodstream infection following infusion visits',
    trueRoute: 'common_vehicle_continuous', trueCurveShape: 'continuous_common_source', trueVehicle: 'A contaminated multi-dose medication vial reused across multiple patients without proper aseptic technique',
    incubationHoursMin: 24, incubationHoursMax: 96, baselineCasesPerPeriod: 0, periodLabel: 'month', observedCases: 21, populationAtRisk: 240,
    epiCurve: [{ day: 1, cases: 1 }, { day: 2, cases: 3 }, { day: 3, cases: 5 }, { day: 4, cases: 6 }, { day: 5, cases: 4 }, { day: 6, cases: 2 }],
    exposures: [
      { exposure: 'Multi-dose vial medication X', casesExposed: 19, casesUnexposed: 2, controlsExposed: 8, controlsUnexposed: 32 },
      { exposure: 'Seen at a specific infusion station', casesExposed: 15, casesUnexposed: 6, controlsExposed: 10, controlsUnexposed: 30 },
      { exposure: 'A specific IV pump model', casesExposed: 12, casesUnexposed: 9, controlsExposed: 14, controlsUnexposed: 26 },
      { exposure: 'Early-week clinic visit', casesExposed: 13, casesUnexposed: 8, controlsExposed: 18, controlsUnexposed: 22 },
      { exposure: 'Central line (vs. peripheral IV)', casesExposed: 6, casesUnexposed: 15, controlsExposed: 8, controlsUnexposed: 32 },
    ],
    narrativeIntro: 'An infection preventionist notices a cluster of bloodstream infections among patients who recently visited the same outpatient infusion clinic.',
    labFindingsNarrative: 'Matching bacterial strains are identified across affected patients by molecular typing, consistent with a single contaminated common source rather than independent infections.',
    notifiableClass: 'urgent',
    cohortComparison: { exposedTotal: 100, exposedIll: 19, unexposedTotal: 140, unexposedIll: 2 },
  },
  {
    id: 'national-greens', code: 'OI-8', name: 'National Leafy Greens Illness Cluster', setting: 'Multiple states, linked by a shared packaged salad product distributed nationally',
    syndrome: 'Bloody diarrhea and cramping, onset 2–8 days after consumption',
    trueRoute: 'foodborne_point_source', trueCurveShape: 'continuous_common_source', trueVehicle: 'A specific brand and lot of packaged bagged spinach, confirmed via product traceback and matching lot codes across states',
    incubationHoursMin: 48, incubationHoursMax: 192, baselineCasesPerPeriod: 3, periodLabel: 'month', observedCases: 58, populationAtRisk: 50000,
    epiCurve: [{ day: 1, cases: 2 }, { day: 2, cases: 4 }, { day: 3, cases: 9 }, { day: 4, cases: 11 }, { day: 5, cases: 8 }, { day: 6, cases: 10 }, { day: 7, cases: 9 }, { day: 8, cases: 5 }],
    exposures: [
      { exposure: 'Bagged spinach, Brand X', casesExposed: 50, casesUnexposed: 8, controlsExposed: 20, controlsUnexposed: 60 },
      { exposure: 'Romaine lettuce', casesExposed: 30, casesUnexposed: 28, controlsExposed: 35, controlsUnexposed: 45 },
      { exposure: 'Tomatoes', casesExposed: 25, casesUnexposed: 33, controlsExposed: 30, controlsUnexposed: 50 },
      { exposure: 'Ground beef', casesExposed: 20, casesUnexposed: 38, controlsExposed: 25, controlsUnexposed: 55 },
      { exposure: 'Deli meat', casesExposed: 18, casesUnexposed: 40, controlsExposed: 22, controlsUnexposed: 58 },
    ],
    narrativeIntro: 'Cases of severe bloody diarrhea are reported across several states over several weeks, with no obvious shared event, but PulseNet-style molecular matching links the cases together as one outbreak.',
    labFindingsNarrative: 'Whole-genome sequencing confirms cases across states share a closely related bacterial strain, consistent with a common, widely distributed food product rather than separate, unrelated exposures.',
    notifiableClass: 'urgent',
    resourceConstrained: true,
  },
]

export const SCENARIOS: Scenario[] = [...SCENARIOS_CORE, ...SCENARIOS_EXTRA, CRESTWOOD_SCENARIO, MERIDIAN_CLINIC_SCENARIO, CROWNPOINT_SCENARIO, ...MORE_SCENARIOS]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}
