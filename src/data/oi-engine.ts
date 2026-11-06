import { correctControlOptionId } from './oi-decisions'
import { buildDecisions } from './oi-decisions-full'
import { judgeExtra } from './oi-judge-extra'
import { getAuthority } from './oi-authorities'
import type { Choices, CohortComparison, FinalReport, FinalVerdict, Grade, Scenario, StageKey, StageOutcome } from './oi-types'

export interface FourCellCounts { casesExposed: number; casesUnexposed: number; controlsExposed: number; controlsUnexposed: number }

export function computeOddsRatio(row: FourCellCounts): number {
  const numerator = row.casesExposed * row.controlsUnexposed
  const denominator = row.controlsExposed * row.casesUnexposed
  if (denominator === 0) return numerator > 0 ? Infinity : 1
  return numerator / denominator
}

// 95% confidence interval for the odds ratio via Woolf's log-based method:
// SE(ln OR) = sqrt(1/a + 1/b + 1/c + 1/d); CI = exp(ln(OR) ± 1.96 × SE).
// If the lower bound is above 1, the association does not include the null
// value and is conventionally treated as statistically significant at
// p < 0.05 — but a small sample can leave even a real effect's CI crossing
// 1, which is itself a teaching point about not over-trusting small counts.
export interface OddsRatioCI { or: number; lower: number; upper: number; significant: boolean }

export function computeOddsRatioCI(row: FourCellCounts): OddsRatioCI {
  const { casesExposed: a, controlsExposed: b, casesUnexposed: c, controlsUnexposed: d } = row
  const or = computeOddsRatio(row)
  if (a === 0 || b === 0 || c === 0 || d === 0 || !isFinite(or)) {
    return { or, lower: or, upper: or, significant: or > 1 }
  }
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
  const lnOr = Math.log(or)
  const lower = Math.exp(lnOr - 1.96 * se)
  const upper = Math.exp(lnOr + 1.96 * se)
  return { or, lower, upper, significant: lower > 1 }
}

export function computeAttackRate(cases: number, population: number): number {
  if (population <= 0) return 0
  return (cases / population) * 100
}

export function computeRelativeRisk(cohort: CohortComparison): number {
  const exposedRate = cohort.exposedTotal > 0 ? cohort.exposedIll / cohort.exposedTotal : 0
  const unexposedRate = cohort.unexposedTotal > 0 ? cohort.unexposedIll / cohort.unexposedTotal : 0
  if (unexposedRate === 0) return exposedRate > 0 ? Infinity : 1
  return exposedRate / unexposedRate
}

function pts(v: Grade['verdict']) { return v === 'best' ? 2 : v === 'acceptable' ? 1 : 0 }

const ROUTE_TO_CATEGORY: Record<string, string> = {
  foodborne_point_source: 'food_or_water', waterborne_point_source: 'food_or_water', toxin_point_source: 'food_or_water',
  person_to_person_propagated: 'contact_and_proximity', common_vehicle_continuous: 'environmental_or_product', vector_borne: 'vector_and_outdoor',
}

// An artifact scenario's "true answer" is no real vehicle — valid only while
// every exposure's odds ratio stays below this threshold.
const ARTIFACT_OR_THRESHOLD = 1.5

function judge(scenario: Scenario, decisionId: string, chosen: string): { verdict: Grade['verdict']; explanation: string; reference: string } {
  // Decisions defined in oi-decisions-extra.ts are graded in oi-judge-extra.ts.
  const extra = judgeExtra(scenario, decisionId, chosen)
  if (extra) return extra

  const REF_CASEDEF = 'Field epidemiology case-definition principles (balance sensitivity vs. specificity)'
  const REF_CURVE = 'Standard epidemic-curve interpretation (point-source vs. propagated vs. continuous common-source)'
  const REF_ANALYTIC = 'Case-control study design and odds ratio interpretation'
  const REF_CONTROL = 'Matching control measures to the confirmed transmission route'
  const REF_INSPECTION = 'Field sample collection and chain-of-custody practice'
  const REF_COMMS = 'Public health risk-communication practice'
  const REF_PV = 'Pharmacovigilance causality assessment (temporal relationship, dechallenge, alternative causes)'
  const REF_MFG = 'Product/lot traceback across a shared supply chain'
  const REF_LAB = 'Interpreting laboratory findings in the context of the whole case series'
  const REF_DELIBERATE = 'Recognizing epidemiologic features that warrant early notification of a possible deliberate event'

  switch (decisionId) {
    case 'is_outbreak':
      return chosen === 'confirm_outbreak'
        ? { verdict: 'best', reference: 'Outbreak-detection threshold (observed vs. baseline)', explanation: `${scenario.observedCases} cases against a baseline of ~${scenario.baselineCasesPerPeriod} per ${scenario.periodLabel} is a clear excess — this warrants a formal investigation without delay.` }
        : { verdict: 'poor', reference: 'Outbreak-detection threshold (observed vs. baseline)', explanation: `${scenario.observedCases} cases against a baseline of ~${scenario.baselineCasesPerPeriod} per ${scenario.periodLabel} is a clear excess that should have triggered immediate action.` }
    case 'clinical_criteria':
      if (chosen === 'syndrome_based') return { verdict: 'best', reference: REF_CASEDEF, explanation: `A syndrome-based definition matching "${scenario.syndrome}" appropriately balances catching real cases early against pulling in unrelated illness.` }
      if (chosen === 'narrow_lab_confirmed_only') return { verdict: 'acceptable', reference: REF_CASEDEF, explanation: 'Lab-confirmed-only is defensible for a confirmed-case tier, but used alone it undercounts the outbreak while results are pending.' }
      return { verdict: 'poor', reference: REF_CASEDEF, explanation: 'A definition this broad dilutes the signal with unrelated background illness.' }
    case 'time_window':
      return chosen === 'match_incubation_and_curve'
        ? { verdict: 'best', reference: REF_CASEDEF, explanation: `Anchoring the window to the ${scenario.incubationHoursMin}–${scenario.incubationHoursMax}-hour incubation period keeps the definition tied to biologically plausible exposure.` }
        : { verdict: 'poor', reference: REF_CASEDEF, explanation: `An arbitrary time window ignores the ${scenario.incubationHoursMin}–${scenario.incubationHoursMax}-hour incubation period this pathogen actually has.` }
    case 'place_restriction':
      return chosen === 'restrict_to_exposure_setting'
        ? { verdict: 'best', reference: REF_CASEDEF, explanation: `Tying the definition to ${scenario.setting} keeps it specific to people who could plausibly have been exposed.` }
        : { verdict: 'poor', reference: REF_CASEDEF, explanation: `Case-finding disconnected from ${scenario.setting} either misses real cases or pulls in unrelated ones.` }
    case 'curve_shape':
      return chosen === scenario.trueCurveShape
        ? { verdict: 'best', reference: REF_CURVE, explanation: 'This matches the actual pattern of case onset over time for this outbreak.' }
        : { verdict: 'poor', reference: REF_CURVE, explanation: `The actual curve here is ${scenario.trueCurveShape.replace(/_/g, ' ')}, not what was selected — misreading the curve shape can send the whole investigation toward the wrong kind of source.` }
    case 'identify_index_case': {
      const net = scenario.contactNetwork
      if (!net) return { verdict: 'acceptable', explanation: '', reference: '' }
      const chosenId = chosen.replace('case_', '')
      return chosenId === net.indexCaseId
        ? { verdict: 'best', reference: 'Contact-tracing chain interpretation', explanation: 'This case is both the earliest onset in the chain and the one whose contacts seeded the most subsequent cases — the classic signature of an index case.' }
        : { verdict: 'poor', reference: 'Contact-tracing chain interpretation', explanation: `The diagram actually traces back to a different case as the earliest link seeding the most onward transmission — worth re-reading the chain from left to right.` }
    }
    case 'exposure_category_priority':
      return chosen === ROUTE_TO_CATEGORY[scenario.trueRoute]
        ? { verdict: 'best', reference: 'Hypothesis generation matched to the emerging pattern', explanation: 'This exposure category matches where the actual source turns out to be.' }
        : { verdict: 'poor', reference: 'Hypothesis generation matched to the emerging pattern', explanation: 'This priority points the questionnaire away from where the actual source turns out to be, wasting interview time.' }
    case 'line_listing_use':
      if (chosen === 'build_detailed_line_listing') return { verdict: 'best', reference: 'Systematic case-finding practice', explanation: 'A full line listing is what actually lets patterns across cases become visible.' }
      if (chosen === 'interview_only_severe_cases') return { verdict: 'acceptable', reference: 'Systematic case-finding practice', explanation: 'Faster, but biased toward severe presentations — milder cases may show a different exposure pattern.' }
      return { verdict: 'poor', reference: 'Systematic case-finding practice', explanation: 'Secondhand reports are unverified and are not a substitute for direct case interviews.' }
    case 'assess_deliberate_release':
      if (chosen === 'flag_unnatural_pattern') return { verdict: 'best', reference: REF_DELIBERATE, explanation: 'An unusual pathogen for this population, a tight single-location pattern with no natural exposure link, and unusually high severity are together exactly the red flags that justify notifying leadership and response partners early — in parallel with, not instead of, the standard investigation. Flagging is not the same as concluding.' }
      if (chosen === 'assume_natural_foodborne') return { verdict: 'poor', reference: REF_DELIBERATE, explanation: 'With no food or water link and such an unusual, severe presentation, a standard foodborne-only approach misses the very features that make this cluster stand out.' }
      return { verdict: 'poor', reference: REF_DELIBERATE, explanation: 'A cluster this unusual, severe, and geographically tight should not be dismissed as coincidence without at least being flagged for further review.' }
    case 'inspection_samples':
      if (chosen === 'target_suspected_vehicle') return { verdict: 'best', reference: REF_INSPECTION, explanation: 'Targeted confirmatory sampling of the suspected vehicle category is the efficient standard once hypotheses point somewhere specific.' }
      if (chosen === 'sample_everything') return { verdict: 'acceptable', reference: REF_INSPECTION, explanation: 'Thorough, but untargeted sampling burns limited lab capacity and turnaround time on unlikely samples.' }
      return { verdict: 'poor', reference: REF_INSPECTION, explanation: 'Without confirmatory lab evidence, the causal link rests on statistical association alone — weaker for a report or any follow-up action.' }
    case 'chain_of_custody':
      return chosen === 'proper_chain_of_custody'
        ? { verdict: 'best', reference: REF_INSPECTION, explanation: 'Documented, properly preserved samples are what make lab results defensible and usable in the final report.' }
        : { verdict: 'poor', reference: REF_INSPECTION, explanation: 'Poor sample handling risks degraded results or evidence that is easy to challenge later.' }
    case 'interview_prioritization':
      return chosen === 'representative_sample'
        ? { verdict: 'best', reference: 'Sampling and selection-bias avoidance', explanation: 'A representative sample avoids skewing the exposure picture toward whichever group happened to be easiest to reach.' }
        : { verdict: 'poor', reference: 'Sampling and selection-bias avoidance', explanation: 'This interview strategy introduces a real selection bias, since the people reached are not representative of everyone actually exposed.' }
    case 'lot_traceback':
      return chosen === 'request_lot_numbers'
        ? { verdict: 'best', reference: REF_MFG, explanation: 'Comparing manufacturing lot numbers across otherwise-unrelated facilities is exactly how a supply-chain contamination gets traced to its true source.' }
        : { verdict: 'poor', reference: REF_MFG, explanation: 'The pattern here — unrelated facilities with no shared staff or handling — does not fit a local-handling explanation, and points upstream to the product itself.' }
    case 'lab_result_interpretation':
      if (chosen === 'weigh_whole_series') return { verdict: 'best', reference: REF_LAB, explanation: 'One positive result that does not match the timing or exposure pattern of the rest of the cases is far more likely incidental than a hidden second source. The full case series carries more evidential weight than a single specimen.' }
      if (chosen === 'conclude_from_one_result') return { verdict: 'poor', reference: REF_LAB, explanation: 'Anchoring the whole investigation on one result that does not fit the rest of the case series risks chasing a false lead while the real vehicle stays in circulation.' }
      return { verdict: 'poor', reference: REF_LAB, explanation: 'One anomalous result does not make all the lab data unreliable. Discarding it all overcorrects and throws away genuinely useful evidence.' }
    case 'identify_vehicle': {
      const ors = scenario.exposures.map(computeOddsRatio)
      const maxOr = Math.max(...ors)
      const maxIdx = ors.indexOf(maxOr)
      if (chosen === 'artifact') {
        return scenario.possibleArtifact && maxOr < ARTIFACT_OR_THRESHOLD
          ? { verdict: 'best', reference: REF_ANALYTIC, explanation: `No exposure shows a meaningfully elevated odds ratio (the highest is ${maxOr.toFixed(2)}), so there is no credible vehicle to chase. Recognizing a surveillance artifact, rather than forcing a cause onto noise, is the correct call here.` }
          : { verdict: 'poor', reference: REF_ANALYTIC, explanation: `${scenario.exposures[maxIdx].exposure} shows a clearly elevated odds ratio (${maxOr.toFixed(1)}), so a real exposure link exists here — calling this an artifact would leave the true vehicle uninvestigated.` }
      }
      const idx = Number(chosen.replace('exp_', ''))
      if (scenario.possibleArtifact && maxOr < ARTIFACT_OR_THRESHOLD) {
        return { verdict: 'poor', reference: REF_ANALYTIC, explanation: `${scenario.exposures[idx]?.exposure ?? 'That exposure'} has an odds ratio of ${(ors[idx] ?? 1).toFixed(2)}, essentially no association. Every exposure here sits near 1, which points to a reporting artifact rather than a real vehicle.` }
      }
      return idx === maxIdx
        ? { verdict: 'best', reference: REF_ANALYTIC, explanation: `${scenario.exposures[idx].exposure} has by far the highest odds ratio (${ors[idx].toFixed(1)}) — the strongest statistical signal in the table.` }
        : { verdict: 'poor', reference: REF_ANALYTIC, explanation: `${scenario.exposures[maxIdx].exposure} actually has the highest odds ratio (${ors[maxIdx].toFixed(1)}) versus ${(ors[idx] ?? 1).toFixed(1)} for the exposure chosen — a high exposure rate among cases alone doesn't mean causation if controls were exposed just as often.` }
    }
    case 'study_design':
      return chosen === 'case_control_with_controls'
        ? { verdict: 'best', reference: REF_ANALYTIC, explanation: 'A defined control group is what makes the odds ratio meaningful — without it, a commonly-reported exposure could just be commonly eaten or done by everyone.' }
        : { verdict: 'poor', reference: REF_ANALYTIC, explanation: 'Without a comparison group, you cannot distinguish a causal exposure from one everybody happened to have, sick or not.' }
    case 'causality_assessment':
      return chosen === 'strong_causality'
        ? { verdict: 'best', reference: REF_PV, explanation: 'A clear temporal relationship, a positive dechallenge, and exclusion of alternative causes together build a strong causal case, beyond the odds ratio alone.' }
        : { verdict: 'poor', reference: REF_PV, explanation: 'The temporal relationship, dechallenge response, and workup described here support a strong causal link — this call does not match the evidence given.' }
    case 'control_measures': {
      const decisions = buildDecisions(scenario, 'control')
      const correctId = correctControlOptionId(scenario, decisions)
      return chosen === correctId
        ? { verdict: 'best', reference: REF_CONTROL, explanation: `This measure directly addresses ${scenario.trueRoute.replace(/_/g, ' ')} transmission, the route actually confirmed here.` }
        : { verdict: 'poor', reference: REF_CONTROL, explanation: `This measure doesn't address ${scenario.trueRoute.replace(/_/g, ' ')} transmission, the route actually confirmed here — it may look plausible but won't stop new cases.` }
    }
    case 'draft_approach':
      if (chosen === 'facts_and_open_questions') return { verdict: 'best', reference: REF_COMMS, explanation: 'Stating confirmed facts and current recommendations while being honest about what remains under investigation is standard, defensible risk communication.' }
      if (chosen === 'name_unconfirmed_suspect') return { verdict: 'poor', reference: REF_COMMS, explanation: 'Naming an unconfirmed suspect before confirmation risks real reputational and legal harm if the investigation later points elsewhere.' }
      return { verdict: 'poor', reference: REF_COMMS, explanation: 'Delaying all communication until full completion costs time people could have used to protect themselves.' }
    case 'tone_choice':
      if (chosen === 'calm_actionable') return { verdict: 'best', reference: REF_COMMS, explanation: 'A calm, actionable tone is what actually helps people take the right precautions without triggering counterproductive panic.' }
      return { verdict: 'poor', reference: REF_COMMS, explanation: chosen === 'alarmist' ? 'Fear-based messaging can trigger panic or overreaction without necessarily improving the specific protective actions people take.' : 'Downplaying a genuine risk undermines the precautions people should actually be taking.' }
    default:
      return { verdict: 'acceptable', explanation: '', reference: '' }
  }
}

export function gradeStage(scenario: Scenario, stage: StageKey, choices: Choices): Grade[] {
  const decisions = buildDecisions(scenario, stage)
  const out: Grade[] = []
  for (const d of decisions) {
    const chosen = choices[d.id]
    if (!chosen) continue
    const option = d.options.find((o) => o.id === chosen)
    const { verdict, explanation, reference } = judge(scenario, d.id, chosen)
    out.push({ decisionId: d.id, stage, title: d.title, chosenLabel: option?.label ?? chosen, verdict, points: pts(verdict), maxPoints: 2, reference, explanation })
  }
  return out
}

function stageHeadlineAndNarrative(stage: StageKey, grades: Grade[]): { headline: string; status: StageOutcome['status']; narrative: string[] } {
  const poor = grades.filter((g) => g.verdict === 'poor').length
  const status: StageOutcome['status'] = poor === 0 ? 'success' : poor >= 2 ? 'failure' : 'mixed'
  const labels: Record<StageKey, string> = { confirm: 'Outbreak confirmation', case_definition: 'Case definition', descriptive: 'Descriptive epidemiology', hypothesis: 'Hypothesis generation', inspection: 'Field inspection', analytic: 'Analytic epidemiology', control: 'Control measures', communication: 'Public communication', report: 'Report' }
  const headline = status === 'success' ? `${labels[stage]} handled well` : status === 'mixed' ? `${labels[stage]} completed, with a gap` : `${labels[stage]} needs rework`
  const narrative = grades.map((g) => g.explanation).filter(Boolean)
  return { headline, status, narrative }
}

export function runStage(scenario: Scenario, stage: StageKey, grades: Grade[]): StageOutcome {
  const { headline, status, narrative } = stageHeadlineAndNarrative(stage, grades)
  return { stage, headline, status, narrative, flags: grades.filter((g) => g.verdict === 'poor').map((g) => g.decisionId), metrics: [] }
}

// ---------------------------------------------------------------------------
// Review meeting — before locking the analytic conclusion, a senior
// epidemiologist reviews the draft and gives feedback, mirroring the
// regulatory-meeting mechanic used elsewhere in this portfolio.
// ---------------------------------------------------------------------------
export interface MeetingFeedback { concerns: string[]; supportive: string[] }

export function runReviewMeeting(scenario: Scenario, draftChoices: Choices): MeetingFeedback {
  const grades = gradeStage(scenario, 'analytic', draftChoices)
  const concerns = grades.filter((g) => g.verdict === 'poor').map((g) => `${g.title}: ${g.explanation}`)
  const supportive = grades.filter((g) => g.verdict === 'best').map((g) => `${g.title}: agreed.`)
  return { concerns, supportive }
}

export function reviewVerdict(scenario: Scenario, allGrades: Grade[], authorityKey: string): FinalReport {
  const authority = getAuthority(authorityKey)
  const poorGrades = allGrades.filter((g) => g.verdict === 'poor')
  const vehicleGrade = allGrades.find((g) => g.decisionId === 'identify_vehicle')
  const ors = scenario.exposures.map(computeOddsRatio)
  const maxIdx = ors.indexOf(Math.max(...ors))
  const isArtifact = !!scenario.possibleArtifact && Math.max(...ors) < ARTIFACT_OR_THRESHOLD
  const identifiedVehicle = isArtifact ? 'No true vehicle — surveillance artifact' : scenario.exposures[maxIdx].exposure

  let verdict: FinalVerdict
  if (vehicleGrade && vehicleGrade.verdict === 'poor') verdict = 'misidentified'
  else if (poorGrades.length === 0) verdict = 'source_identified'
  else if (poorGrades.length <= 3) verdict = 'source_identified_with_gaps'
  else verdict = 'inconclusive'

  const verdictLabel = verdict === 'source_identified' ? 'Source identified' : verdict === 'source_identified_with_gaps' ? 'Source identified, with process gaps' : verdict === 'misidentified' ? 'Wrong source identified' : 'Investigation inconclusive'

  const attackRate = computeAttackRate(scenario.observedCases, scenario.populationAtRisk)
  const notifyWindow = scenario.notifiableClass === 'urgent' ? authority.urgentWindowHours + ' hours' : authority.routineWindowDays + ' days'

  const verdictSummary = verdict === 'source_identified'
    ? `The investigation correctly identified ${identifiedVehicle} as the outbreak vehicle, with a well-constructed case definition, correct curve interpretation, and matching control measures. Overall attack rate: ${attackRate.toFixed(1)}%. Under ${authority.name} conventions, a case with this profile should be reported within ${notifyWindow}.`
    : verdict === 'source_identified_with_gaps'
      ? `The investigation correctly identified ${identifiedVehicle} as the outbreak vehicle, but some process steps along the way had gaps (see below). Overall attack rate: ${attackRate.toFixed(1)}%. Under ${authority.name} conventions, a case with this profile should be reported within ${notifyWindow}.`
      : verdict === 'misidentified'
        ? `The investigation settled on the wrong explanation. The data actually point to: ${identifiedVehicle}. Misidentifying the source risks recommending control measures that won't stop new cases.`
        : `Too many steps in this investigation had significant gaps to draw a reliable conclusion. A real investigation in this state would need to revisit its case definition and analytic approach before recommending any control measures.`

  const strengths = allGrades.filter((g) => g.verdict === 'best').map((g) => `${g.title}: ${g.explanation}`)
  const deficiencies = poorGrades.map((g) => `${g.title}: ${g.explanation}`)
  const score = allGrades.reduce((a, g) => a + g.points, 0)
  const maxScore = allGrades.reduce((a, g) => a + g.maxPoints, 0)

  return { verdict, verdictLabel, verdictSummary, deficiencies, strengths, score, maxScore, grades: allGrades, authorityKey, identifiedVehicle }
}
