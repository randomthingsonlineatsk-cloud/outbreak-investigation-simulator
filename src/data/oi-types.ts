// ---------------------------------------------------------------------------
// Shared types for the Outbreak Investigation Simulator. The flow follows
// the classic field-epidemiology sequence (adapted from the well-established
// "steps of an outbreak investigation" used in public health practice):
// confirm an outbreak exists → build a case definition → descriptive
// epidemiology (epi curve) → generate hypotheses → field inspection and
// sample collection → analytic epidemiology (case-control study, odds
// ratios) → control measures → public communication → report.
// ---------------------------------------------------------------------------

export type TransmissionRoute =
  | 'foodborne_point_source'
  | 'waterborne_point_source'
  | 'toxin_point_source'
  | 'common_vehicle_continuous'
  | 'person_to_person_propagated'
  | 'vector_borne'

export type CurveShape = 'point_source' | 'continuous_common_source' | 'propagated'

export interface EpiCurveDay { day: number; cases: number }

export interface ExposureRow {
  exposure: string
  casesExposed: number
  casesUnexposed: number
  controlsExposed: number
  controlsUnexposed: number
}

export interface CohortComparison {
  exposedTotal: number
  exposedIll: number
  unexposedTotal: number
  unexposedIll: number
}

export interface DoseResponseLevel { level: string; ill: number; total: number }

export interface StratumRow { label: string; casesExposed: number; casesUnexposed: number; controlsExposed: number; controlsUnexposed: number }
export interface StratifiedAnalysis { confounder: string; exposureLabel: string; strata: StratumRow[] }

export interface CaseCountByDefinition { label: string; count: number }

export interface ContactNode { id: string; label: string; day: number }
export interface ContactEdge { from: string; to: string }
export interface ContactNetwork { nodes: ContactNode[]; edges: ContactEdge[]; indexCaseId: string; candidateIds: string[] }

export interface SpotMapLocation { label: string; caseCount: number; totalPeople: number; x: number; y: number }
export interface SpotMap { locations: SpotMapLocation[]; note: string }

export interface PersonBreakdownGroup { label: string; ill: number; total: number }
export interface PersonBreakdown { dimensionLabel: string; groups: PersonBreakdownGroup[] }

// A case definition that gets revised once early interviews show it is
// misclassifying. The scenario's own epiCurve is the curve under the initial
// (broad) definition; revisedCurve is the same days under the revised one.
export interface CaseDefRevision {
  initialDefinition: string
  reviewFinding: string
  revisedDefinition: string
  revisedCurve: EpiCurveDay[]
  initialCount: number
  revisedCount: number
}

export interface FourCell {
  casesExposed: number
  casesUnexposed: number
  controlsExposed: number
  controlsUnexposed: number
}

// The same exposure measured two ways: by self-report (the matching row in
// the scenario's exposures table) and from objective records.
export interface RecallBiasCheck {
  exposureLabel: string
  recordSource: string
  verified: FourCell
}

// The same cases compared against controls drawn from different sources.
// The scenario's own exposure row uses the recommended, representative
// control source; each alternative supplies only its own control counts.
export interface ControlSourceAlternative {
  label: string
  note: string
  controlsExposed: number
  controlsUnexposed: number
}
export interface SelectionBiasCheck {
  exposureLabel: string
  recommendedLabel: string
  alternatives: ControlSourceAlternative[]
}

// One exposure's tally across matched case-control pairs. The four counts
// are numbers of pairs and sum to MatchedPairs.pairs. Only the discordant
// pairs (caseOnly and controlOnly) enter the matched odds ratio.
export interface MatchedPairRow {
  exposure: string
  bothExposed: number
  caseOnly: number
  controlOnly: number
  neither: number
}
export interface MatchedPairs {
  matchedOn: string
  pairs: number
  rows: MatchedPairRow[]
}

export interface Scenario {
  id: string
  code: string
  name: string
  setting: string
  syndrome: string
  trueRoute: TransmissionRoute
  trueCurveShape: CurveShape
  trueVehicle: string
  incubationHoursMin: number
  incubationHoursMax: number
  baselineCasesPerPeriod: number
  periodLabel: string
  observedCases: number
  populationAtRisk: number
  epiCurve: EpiCurveDay[]
  exposures: ExposureRow[]
  narrativeIntro: string
  labFindingsNarrative: string
  notifiableClass: 'urgent' | 'routine'
  cohortComparison?: CohortComparison
  doseResponse?: DoseResponseLevel[]
  stratifiedAnalysis?: StratifiedAnalysis
  caseCountByDefinition?: CaseCountByDefinition[]
  resourceConstrained?: boolean
  contactNetwork?: ContactNetwork
  spotMap?: SpotMap
  personBreakdown?: PersonBreakdown
  pharmacovigilanceLink?: boolean
  manufacturingLink?: boolean
  redHerringLab?: boolean
  deliberateReleaseFlag?: boolean
  possibleArtifact?: boolean
  // Non-infectious workplace exposure: unlocks an infectious-vs-occupational
  // hypothesis decision.
  occupationalFlag?: boolean
  // Two unrelated clusters pooled into one apparent outbreak: unlocks a
  // cluster-splitting decision (descriptive) and a per-cluster response
  // decision (control).
  twoClustersFlag?: boolean
  // Case definition revised mid-investigation: unlocks a revision card and
  // decision in the hypothesis stage.
  caseDefRevision?: CaseDefRevision
  // Very small study: the leading exposure has a wide interval crossing 1.
  // Unlocks an interval-interpretation decision and a sample-size explorer.
  smallSampleFlag?: boolean
  // A self-reported exposure that looks strong because of recall bias:
  // unlocks a records-vs-recall card and decision in the analytic stage.
  recallBiasCheck?: RecallBiasCheck
  // Control-group choice: unlocks a control-source decision (hypothesis) and
  // a comparison card (analytic).
  selectionBiasCheck?: SelectionBiasCheck
  // Matched case-control design: unlocks a matched-pairs card and a
  // matched-analysis decision in the analytic stage. The scenario's
  // exposures table is derived from these pairs (the crude, unmatched view).
  matchedPairs?: MatchedPairs
}

export type Choices = Record<string, string>

// A character in a conversation decision, and how they react to a reply.
// Mood describes their cooperation with the investigation afterwards:
// cooperative (won over), guarded (placated or unsure, not really on side),
// or hostile (pushed into opposition).
export type NpcMood = 'cooperative' | 'guarded' | 'hostile'
export interface NpcLine { name: string; role: string; line: string }
export interface NpcReaction { mood: NpcMood; text: string }

export interface DecisionOption { id: string; label: string; detail: string; reaction?: NpcReaction }
export interface Decision { id: string; stage: StageKey; title: string; prompt: string; options: DecisionOption[]; npc?: NpcLine }

export type StageKey = 'confirm' | 'case_definition' | 'descriptive' | 'hypothesis' | 'inspection' | 'analytic' | 'control' | 'communication' | 'report'

export type GradeVerdict = 'best' | 'acceptable' | 'poor'
export interface Grade {
  decisionId: string
  stage: StageKey
  title: string
  chosenLabel: string
  verdict: GradeVerdict
  points: number
  maxPoints: number
  reference: string
  explanation: string
}

export interface StageOutcome {
  stage: StageKey
  headline: string
  status: 'success' | 'mixed' | 'failure'
  narrative: string[]
  flags: string[]
  metrics: { label: string; value: string }[]
}

export type FinalVerdict = 'source_identified' | 'source_identified_with_gaps' | 'inconclusive' | 'misidentified'

export interface FinalReport {
  verdict: FinalVerdict
  verdictLabel: string
  verdictSummary: string
  deficiencies: string[]
  strengths: string[]
  score: number
  maxScore: number
  grades: Grade[]
  authorityKey: string
  identifiedVehicle: string
}
