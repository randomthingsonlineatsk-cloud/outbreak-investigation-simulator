import type { Grade, Scenario } from './oi-types'
import { judgeMore } from './oi-judge-more'

// ---------------------------------------------------------------------------
// Extension point for grading the decisions defined in oi-decisions-extra.ts
// (and the artifact-scenario control option). Returns null when a decision
// isn't handled here, so oi-engine falls through to its own grading. Any
// decision id not handled below is passed on to oi-judge-more.ts.
// ---------------------------------------------------------------------------

type Judged = { verdict: Grade['verdict']; explanation: string; reference: string }

export function judgeExtra(scenario: Scenario, decisionId: string, chosen: string): Judged | null {
  const REF_CLUSTERS = 'Recognizing when apparent single outbreaks are actually separate clusters'
  const REF_OCC = 'Distinguishing occupational exposures from infectious outbreaks'
  const REF_CONTROL = 'Matching control measures to the confirmed transmission route'
  const REF_CASEDEF_REV = 'Iterative case-definition refinement, applied consistently to all cases'
  const REF_POWER = 'Statistical power and interpreting wide confidence intervals in small studies'
  const REF_RECALL = 'Recall bias and the use of objective exposure records'
  const REF_SELECTION = 'Control selection and selection bias in case-control studies'
  const REF_MATCHED = 'Matched case-control analysis using discordant pairs'

  switch (decisionId) {
    case 'cluster_splitting':
      if (chosen === 'split_and_investigate') return { verdict: 'best', reference: REF_CLUSTERS, explanation: 'Different pathogens, different age groups, and different settings are the classic signs that one case count is really two clusters. Giving each its own case definition lets each show its own pattern.' }
      if (chosen === 'pool_as_one') return { verdict: 'poor', reference: REF_CLUSTERS, explanation: 'Pooling unrelated clusters muddies the curve and dilutes the odds ratio for each real source, so neither vehicle stands out as cleanly as it should.' }
      return { verdict: 'poor', reference: REF_CLUSTERS, explanation: 'The smaller cluster is a real, ongoing person-to-person spread among young children. Dismissing it as background noise leaves it uncontrolled.' }
    case 'infectious_vs_occupational':
      if (chosen === 'investigate_workplace_exposure') return { verdict: 'best', reference: REF_OCC, explanation: 'Cases confined to one work area, symptoms tied to time at work, no secondary spread, and no identified pathogen together signal an occupational exposure. Not every cluster is infectious, and occupational health and industrial hygiene are the right partners here.' }
      if (chosen === 'assume_infectious_isolate') return { verdict: 'poor', reference: REF_OCC, explanation: 'There is no sign of person-to-person spread. Isolating cases and shutting down the whole workforce would be disruptive and would not touch the actual source.' }
      return { verdict: 'poor', reference: REF_OCC, explanation: 'Individual risk factors can raise susceptibility, but a cluster confined to one work area is a workplace signal. Blaming personal habits leaves the source in place.' }
    case 'revise_case_definition':
      if (chosen === 'revise_and_reapply') return { verdict: 'best', reference: REF_CASEDEF_REV, explanation: `Tightening the definition once early interviews show it is misclassifying is normal practice. Re-applying it to every case brings the count from ${scenario.caseDefRevision?.initialCount ?? 'the initial total'} down to ${scenario.caseDefRevision?.revisedCount ?? 'the true cases'} and sharpens the curve, and documenting the change keeps the counts comparable.` }
      if (chosen === 'keep_original') return { verdict: 'poor', reference: REF_CASEDEF_REV, explanation: 'Keeping a definition that is known to mix in unrelated illness blurs the curve and dilutes every odds ratio. Consistency is achieved by re-applying a better definition to all cases, not by freezing a flawed one.' }
      return { verdict: 'poor', reference: REF_CASEDEF_REV, explanation: 'Applying the tighter definition only to new reports leaves earlier and later cases counted differently, so the counts and the curve are no longer comparable.' }
    case 'choose_control_source':
      if (chosen === 'representative_source') return { verdict: 'best', reference: REF_SELECTION, explanation: 'Controls should represent the population the cases came from. A random draw from a list of everyone exposed shows how common each exposure really was, so the odds ratios are not distorted by who happened to be recruited.' }
      if (chosen === 'companions_of_cases') return { verdict: 'poor', reference: REF_SELECTION, explanation: 'Companions shared meals and activities with the cases, so they were exposed at nearly the same rate. That pulls odds ratios toward 1 and can hide the true vehicle.' }
      return { verdict: 'poor', reference: REF_SELECTION, explanation: 'Hotline callers are self-selected, and many called because they ate something they suspected. They are not representative of everyone who was exposed, so the comparison is biased.' }
    case 'analyze_matched_data':
      if (chosen === 'matched_analysis') return { verdict: 'best', reference: REF_MATCHED, explanation: 'In a matched design each case is compared with its own control. Pairs where both had the same exposure carry no information about the association, so the matched odds ratio is the ratio of the two kinds of discordant pair.' }
      if (chosen === 'ignore_matching') return { verdict: 'poor', reference: REF_MATCHED, explanation: 'Pooling everyone into one table discards the pairing. Because controls were chosen to resemble cases, the pooled odds ratio is typically pulled toward 1 and understates the association, as the comparison above shows.' }
      return { verdict: 'poor', reference: REF_MATCHED, explanation: 'Pairs with the same exposure status say nothing about the association, since both members look alike. It is the discordant pairs that carry the information.' }
    case 'address_recall_bias':
      if (chosen === 'verify_with_records') return { verdict: 'best', reference: REF_RECALL, explanation: 'Ill people search their memories for an explanation and well people do not, so self-report can inflate an association. Objective records are not shaped by who got sick, so preferring them where they exist, and interviewing everyone the same standardized way, is the sound approach.' }
      if (chosen === 'accept_self_report') return { verdict: 'poor', reference: REF_RECALL, explanation: 'A strong statistical association does not protect against bias. If cases and controls remember differently, the odds ratio can be inflated even though the arithmetic is correct.' }
      return { verdict: 'poor', reference: REF_RECALL, explanation: 'Interviews are the backbone of most outbreak investigations. The answer to recall bias is to verify and standardize, not to throw out everything people report.' }
    case 'interpret_wide_interval':
      if (chosen === 'underpowered_gather_more') return { verdict: 'best', reference: REF_POWER, explanation: 'With only nine cases the study has little power, so even a real, large effect can produce an interval that crosses 1. The estimate is best read alongside the curve, incubation period, and lab evidence, and tightened by adding controls where possible.' }
      if (chosen === 'conclude_no_association') return { verdict: 'poor', reference: REF_POWER, explanation: 'A non-significant result from a very small study is not evidence of no effect. The interval is consistent with anything from a modest protective effect to a very large risk.' }
      return { verdict: 'poor', reference: REF_POWER, explanation: 'An odds ratio is an association, and one this imprecise cannot prove causation. The wide interval is a direct measure of how uncertain the estimate is.' }
    case 'second_cluster_response':
      if (chosen === 'separate_targeted_responses') return { verdict: 'best', reference: REF_CONTROL, explanation: 'The two clusters have different mechanisms, so each needs its own targeted control: a recall and food-handling correction for the foodborne cluster, and exclusion and hygiene measures for the childcare-center spread.' }
      if (chosen === 'food_recall_only') return { verdict: 'poor', reference: REF_CONTROL, explanation: 'A food recall does nothing for spread between children at the childcare center, which would keep going.' }
      return { verdict: 'poor', reference: REF_CONTROL, explanation: 'Closing everything is disproportionate and untargeted. It disrupts the town without controlling either mechanism better than targeted measures would.' }
    case 'control_measures':
      if (!scenario.possibleArtifact) return null
      return chosen === 'measure_artifact'
        ? { verdict: 'best', reference: REF_CONTROL, explanation: 'When the increase traces to a change in testing rather than a change in illness, recalls or closures would be unwarranted. Correcting the interpretation and continuing routine surveillance is the right response.' }
        : { verdict: 'poor', reference: REF_CONTROL, explanation: 'No real vehicle was found here, so a recall, closure, or advisory would be unwarranted. The increase traces to a change in testing, not a change in illness.' }
    default:
      return judgeMore(scenario, decisionId, chosen)
  }
}
