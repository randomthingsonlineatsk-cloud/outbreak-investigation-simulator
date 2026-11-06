import type { Decision, Scenario, StageKey } from './oi-types'

// ---------------------------------------------------------------------------
// Extension point for scenario-specific decisions. oi-decisions.ts holds the
// generic and earlier scenario-flag decisions; anything added from here on
// lives in this file so the large base file does not need to be rewritten.
// oi-decisions-full.ts combines the two.
// ---------------------------------------------------------------------------

export function extraDecisions(scenario: Scenario, stage: StageKey): Decision[] {
  const out: Decision[] = []

  if (stage === 'descriptive' && scenario.twoClustersFlag) {
    out.push({
      id: 'cluster_splitting', stage, title: 'Decide whether this is one outbreak or two',
      prompt: 'The combined case count and curve look messy. Stool testing shows two different pathogens, the cases fall into very different age groups, and they cluster in two different settings. How should the investigation proceed?',
      options: [
        { id: 'split_and_investigate', label: 'Treat these as two separate clusters: the differing pathogens, ages, and settings mean each needs its own case definition and investigation', detail: 'When lab results, demographics, and setting all point in different directions, lumping the cases together hides both signals. Separate case definitions let each cluster show its own pattern.' },
        { id: 'pool_as_one', label: 'Treat all cases as one outbreak and run a single case-control study', detail: 'Pooling unrelated clusters dilutes the association for each real source and muddies the curve, so neither vehicle stands out as cleanly as it should.' },
        { id: 'drop_smaller_cluster', label: 'Set the smaller cluster aside as background noise and investigate only the larger one', detail: 'The smaller cluster is a genuine, ongoing person-to-person spread among young children. Ignoring it leaves it uncontrolled.' },
      ],
    })
  }

  if (stage === 'hypothesis' && scenario.occupationalFlag) {
    out.push({
      id: 'infectious_vs_occupational', stage, title: 'Decide whether this looks infectious at all',
      prompt: 'Cases are all workers from one area of the plant. Symptoms start hours into a shift and ease on days off. No infectious pathogen has been identified, and there are no cases among household members or workers elsewhere in the plant. What should the team conclude about the likely nature of this cluster?',
      options: [
        { id: 'investigate_workplace_exposure', label: 'The pattern points toward a workplace exposure rather than a contagious illness: bring in occupational health and industrial hygiene alongside the standard exposure interview', detail: 'Cases confined to one work area, symptoms tied to time at work, no secondary spread, and no identified pathogen are the classic signature of an occupational exposure. Not every cluster is infectious.' },
        { id: 'assume_infectious_isolate', label: 'Treat it as a contagious infection: isolate the cases and send the whole workforce home', detail: 'Nothing here suggests person-to-person spread, since there are no secondary cases in households or elsewhere in the plant. Isolation and a full shutdown would be disruptive and would not address the actual source.' },
        { id: 'blame_individual_habits', label: 'Attribute it to individual factors such as smoking or personal habits and close the investigation', detail: 'Individual risk factors can raise susceptibility, but a cluster confined to one work area is a workplace signal. Blaming the workers leaves the source in place.' },
      ],
    })
  }

  if (stage === 'hypothesis' && scenario.caseDefRevision) {
    out.push({
      id: 'revise_case_definition', stage, title: 'Revise the case definition',
      prompt: 'A first pass through the interviews shows the broad working definition is pulling in many reports that are unrelated to the fair, as the comparison above shows. What should the team do?',
      options: [
        { id: 'revise_and_reapply', label: 'Tighten the definition using the exposure setting and onset window the interviews point to, use tiers (probable and confirmed), apply the revised version to every case reported so far, and document the change', detail: 'A case definition is a working tool. Revising it as evidence accumulates is standard practice, provided the new version is applied to all reports and the change is documented, so counts stay comparable.' },
        { id: 'keep_original', label: 'Keep the original broad definition unchanged so the counts stay consistent', detail: 'Consistency matters, but a definition known to mix in unrelated illness blurs the curve and dilutes every odds ratio. The fix is to revise and re-apply it, not to freeze a definition that misclassifies.' },
        { id: 'revise_new_cases_only', label: 'Adopt the tighter definition but apply it only to cases reported from now on', detail: 'Using different definitions for earlier and later reports makes the counts incomparable and hides the true curve. A revised definition has to be re-applied to every case.' },
      ],
    })
  }

  if (stage === 'hypothesis' && scenario.selectionBiasCheck) {
    out.push({
      id: 'choose_control_source', stage, title: 'Choose where the controls come from',
      prompt: 'The case-control study needs well people to compare against the cases. Where should the controls be drawn from?',
      options: [
        { id: 'representative_source', label: 'A representative sample of the people who were actually exposed to the event, drawn from an attendee list or similar records, who did not become ill', detail: 'Controls should represent the population the cases came from. A random draw from a list of everyone at risk gives an unbiased picture of how common each exposure was.' },
        { id: 'companions_of_cases', label: 'Ask each case to nominate a companion who attended with them', detail: 'Companions tend to share meals and activities with the case, so they were exposed at nearly the same rate. That pulls odds ratios toward 1 and can hide the true vehicle.' },
        { id: 'hotline_volunteers', label: 'Use people who called the health hotline asking about the event but did not meet the case definition', detail: 'Callers are self-selected. Many called because they ate from something they suspect, so they are not representative of everyone who attended.' },
      ],
    })
  }

  if (stage === 'analytic' && scenario.matchedPairs) {
    out.push({
      id: 'analyze_matched_data', stage, title: 'Analyze the matched pairs',
      prompt: 'Each case was matched to one control of the same age group and neighborhood. The pair tallies are shown above. How should the odds ratio be calculated?',
      options: [
        { id: 'matched_analysis', label: 'Use a matched analysis: compare only the discordant pairs (case exposed and control not, versus the reverse) and report the matched odds ratio with its interval', detail: 'In a matched design each case is compared with its own control. Pairs where both had the same exposure status carry no information about the association. The ratio of the two kinds of discordant pair is the matched odds ratio.' },
        { id: 'ignore_matching', label: 'Pool everyone into one ordinary 2×2 table and compute the usual odds ratio, since the totals are the same', detail: 'Ignoring the pairing discards the design. Because controls were chosen to resemble cases, the pooled odds ratio is typically pulled toward 1 and understates the association.' },
        { id: 'concordant_pairs_only', label: 'Count only the pairs where the case and control had the same exposure status', detail: 'Those concordant pairs carry no information about the association, since both members look alike on the exposure. It is the discordant pairs that show a difference.' },
      ],
    })
  }

  if (stage === 'analytic' && scenario.recallBiasCheck) {
    out.push({
      id: 'address_recall_bias', stage, title: 'Deal with a possibly recall-biased exposure',
      prompt: 'One exposure has a strong self-reported association, but people in the office had already been talking about it before anyone was interviewed. Objective records exist for that exposure. How should the team handle it?',
      options: [
        { id: 'verify_with_records', label: 'Check the self-reported answers against the objective records, prefer the records where they exist, and keep interviewing everyone the same standardized way', detail: 'Ill people search their memories for an explanation, and well people do not, so self-report can inflate an association. Records are not shaped by who got sick, which makes them the more trustworthy source.' },
        { id: 'accept_self_report', label: 'Accept the self-reported result at face value, since the association is statistically strong', detail: 'A strong statistical association does not protect against bias. If cases and controls remember differently, the odds ratio can be inflated even though the arithmetic is correct.' },
        { id: 'discard_interviews', label: 'Throw out all interview-based exposure data as unreliable', detail: 'Interviews are the backbone of most outbreak investigations. The answer to recall bias is to verify and standardize, not to discard everything people report.' },
      ],
    })
  }

  if (stage === 'analytic' && scenario.smallSampleFlag) {
    out.push({
      id: 'interpret_wide_interval', stage, title: 'Interpret a wide, non-significant interval',
      prompt: 'The most suspicious exposure has a large odds ratio, but its 95% confidence interval includes 1 and only nine cases were interviewed. How should this be read?',
      options: [
        { id: 'underpowered_gather_more', label: 'The interval is wide because the study is small, not because there is no effect: weigh the estimate together with the curve, incubation period, and lab evidence, and add cases and more controls per case if possible', detail: 'With very few cases a study has little statistical power, so even a real, large effect can produce an interval that crosses 1. Reading the estimate alongside timing and lab evidence, and adding controls to tighten it, is the sound approach.' },
        { id: 'conclude_no_association', label: 'The interval includes 1, so there is no association and this exposure can be ruled out', detail: 'Failing to reach significance in a tiny study is not evidence of no effect. The interval is consistent with anything from a modest protective effect to a very large risk.' },
        { id: 'conclude_proven', label: 'The odds ratio is large, so this exposure is proven to be the cause', detail: 'An odds ratio measures association, and one this imprecise cannot establish causation. The wide interval shows how uncertain the estimate is.' },
      ],
    })
  }

  if (stage === 'control' && scenario.twoClustersFlag) {
    out.push({
      id: 'second_cluster_response', stage, title: 'Respond to both clusters',
      prompt: 'One cluster traces to a food item, the other to person-to-person spread at a childcare center. What response fits?',
      options: [
        { id: 'separate_targeted_responses', label: 'Recall the implicated deli item and correct food handling there, and separately apply exclusion and hygiene measures at the childcare center', detail: 'Each cluster has a different mechanism, so each needs its own targeted control. A food recall does nothing for spread between children.' },
        { id: 'food_recall_only', label: 'Recall the deli item only, since it explains the larger cluster', detail: 'This leaves the childcare-center spread completely uncontrolled, and it will keep going.' },
        { id: 'close_everything', label: 'Close the deli, the childcare center, and other town facilities until the illness passes', detail: 'This is disproportionate and untargeted. It disrupts the town without addressing the specific mechanism behind either cluster any better than targeted measures would.' },
      ],
    })
  }

  return out
}

// Adjust decisions the base file already built. Used to give artifact
// scenarios a control option that fits "there was no real outbreak".
export function adjustDecisions(scenario: Scenario, stage: StageKey, decisions: Decision[]): Decision[] {
  if (stage === 'control' && scenario.possibleArtifact) {
    return decisions.map((d) => d.id !== 'control_measures' ? d : {
      ...d,
      options: [
        ...d.options,
        { id: 'measure_artifact', label: 'No outbreak-specific control measure: report the finding, note the new test\'s higher sensitivity when interpreting surveillance baselines, and continue routine surveillance', detail: 'When the increase traces to a change in testing rather than a change in illness, recalls, closures, or advisories would be unwarranted. The right response is to correct the interpretation and keep watching.' },
      ],
    })
  }
  return decisions
}
