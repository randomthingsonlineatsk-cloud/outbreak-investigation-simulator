import type { Choices, Grade, Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Hint system. Using a hint on a decision costs 1 point on that decision.
//
// Hint use is stored inside the existing choices object under a reserved key
// prefix, so it is saved and restored with the run automatically and never
// collides with a decision id. The penalty is applied when a stage is graded
// (applyHintPenalty). Only points the answer actually earned can be lost: a
// hint on a wrong answer costs nothing further, because it is already worth
// zero.
//
// Hints nudge toward the right line of reasoning; they never name the answer.
// ---------------------------------------------------------------------------

export const HINT_PREFIX = '__hint:'
export const HINT_DEDUCT_MARKER = 'Hint used: 1 point deducted.'

export function hintKey(decisionId: string): string {
  return `${HINT_PREFIX}${decisionId}`
}

export function hintUsed(choices: Choices, decisionId: string): boolean {
  return !!choices[hintKey(decisionId)]
}

export function countHints(choices: Choices): number {
  return Object.keys(choices).filter((k) => k.startsWith(HINT_PREFIX) && choices[k]).length
}

export function applyHintPenalty(grades: Grade[], choices: Choices): Grade[] {
  return grades.map((g) => {
    if (!hintUsed(choices, g.decisionId) || g.points <= 0) return g
    return { ...g, points: g.points - 1, explanation: g.explanation ? `${g.explanation} (${HINT_DEDUCT_MARKER})` : HINT_DEDUCT_MARKER }
  })
}

export function pointsDeducted(grades: Grade[]): number {
  return grades.filter((g) => g.explanation.includes(HINT_DEDUCT_MARKER)).length
}

export function hintFor(scenario: Scenario, decisionId: string): string {
  const route = scenario.trueRoute.replace(/_/g, ' ')
  const incubation = `${scenario.incubationHoursMin}–${scenario.incubationHoursMax} hours`
  switch (decisionId) {
    case 'is_outbreak':
      return `Compare the ${scenario.observedCases} reported cases with the usual ${scenario.baselineCasesPerPeriod} per ${scenario.periodLabel}. Ask what the right first move is when the gap is that clear, whatever the eventual explanation turns out to be.`
    case 'clinical_criteria':
      return 'Think about sensitivity versus specificity: which option catches real cases early without pulling in unrelated illness?'
    case 'time_window':
      return `The incubation period is ${incubation}. Which option ties the window to biology rather than to the calendar?`
    case 'place_restriction':
      return 'Cases should be people who could plausibly have been exposed in this setting. Which option keeps that link without cutting it too narrow?'
    case 'curve_shape':
      return `The incubation period is ${incubation}. Compare that with how many days the cases span, and whether the curve has one peak, repeating waves, or an irregular spread.`
    case 'identify_index_case':
      return 'The index case should be the earliest onset and the one with the most onward arrows in the transmission chain.'
    case 'cluster_splitting':
      return 'Check whether the lab results, the ages, and the settings all point the same way. If they diverge, ask whether one case definition can really serve them all.'
    case 'exposure_category_priority':
      return 'Use the curve shape and the setting: does the pattern look like a shared substance, contact between people, an ongoing fixed source, or vectors?'
    case 'line_listing_use':
      return 'A line listing exists to reveal patterns across all the cases. Which option gives you a complete, unbiased picture?'
    case 'infectious_vs_occupational':
      return 'Ask whether there is any sign of spread between people, and where the cases are concentrated.'
    case 'revise_case_definition':
      return 'Compare the two curves. A revision only helps if it is applied the same way to every case.'
    case 'choose_control_source':
      return 'Controls should look like the people the cases came from. Which source could be skewed toward or away from the suspect exposures?'
    case 'assess_deliberate_release':
      return 'List what is unusual: the pathogen for this population, whether any natural source exists, and the severity. Then weigh the cost of early notification against the cost of waiting.'
    case 'inspection_samples':
      return 'Lab capacity is limited, so the hypotheses you have formed should decide what gets sampled.'
    case 'chain_of_custody':
      return 'Evidence has to hold up to scrutiny later. Which option keeps it traceable and viable?'
    case 'interview_prioritization':
      return 'For each option, ask whose experience it would leave out.'
    case 'lot_traceback':
      return 'When unrelated facilities share nothing but a product, ask where the common thread points.'
    case 'lab_result_interpretation':
      return 'Ask how well this one result fits the timing and exposure pattern of all the other cases.'
    case 'identify_vehicle':
      return scenario.possibleArtifact
        ? 'Before choosing an exposure, check whether any odds ratio stands clearly above 1 at all.'
        : 'Compare odds ratios, not raw counts. An exposure that most controls also had cannot explain much.'
    case 'study_design':
      return 'A number only means something next to a comparison. Which option provides one?'
    case 'causality_assessment':
      return 'Think about the timing, what happened when the drug was stopped, and whether anything else could explain the reaction.'
    case 'analyze_matched_data':
      return 'In a matched pair, only the pairs where the two members differ on the exposure tell you anything.'
    case 'address_recall_bias':
      return 'Ask which source of exposure information is unaffected by who became ill.'
    case 'interpret_wide_interval':
      return 'A wide interval means the estimate is imprecise. Ask what a study this small can and cannot rule out.'
    case 'control_measures':
      return scenario.possibleArtifact
        ? 'If no real vehicle was found, ask whether any recall or closure is actually justified.'
        : `The confirmed route here is ${route}. Which measure interrupts exactly that route?`
    case 'second_cluster_response':
      return 'The two clusters spread in different ways. Ask whether one measure can stop both.'
    case 'draft_approach':
      return 'Ask what the public needs to know right now, and what could go wrong if you name a suspect early or say nothing at all.'
    case 'tone_choice':
      return 'The goal is for people to take the right precautions. Ask which tone helps them do that.'
    case 'npc_reluctant_case':
      return 'Ask what this person needs to hear to keep talking, and what happens to your data if you push or if you skip.'
    case 'npc_site_operator':
      return 'Aim to be firm about the action and generous about the help. Which reply protects people without burning the relationship?'
    case 'npc_reporter':
      return 'Say what is known, what people should do, and when you will say more. Avoid promises about blame or numbers you cannot yet back.'
    default:
      return 'Re-read the prompt and ask which option best matches the evidence shown above.'
  }
}
