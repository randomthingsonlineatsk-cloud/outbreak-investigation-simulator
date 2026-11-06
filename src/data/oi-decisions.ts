import type { Decision, Scenario, StageKey } from './oi-types'

// ---------------------------------------------------------------------------
// Decisions per investigative stage. Most are stage-generic (the same
// options appear for every scenario, graded against that scenario's ground
// truth); the "identify_vehicle" decision in the analytic stage is built
// dynamically from the scenario's own exposure list (plus a synthetic
// "surveillance artifact" option for flagged scenarios), the inspection
// stage adds a resource-triage decision for large populations, a
// lot-traceback decision for manufacturing-linked scenarios, and a
// lab-result-interpretation decision for scenarios with a red-herring lab
// finding; the descriptive stage adds an index-case decision for scenarios
// with a contact-tracing network; the hypothesis stage adds a
// deliberate-release pattern-recognition decision for flagged scenarios;
// and the analytic stage adds a causality-assessment decision (mirroring
// Pharmacovigilance Detective) for drug-adverse-event scenarios.
// ---------------------------------------------------------------------------

export function buildDecisions(scenario: Scenario, stage: StageKey): Decision[] {
  switch (stage) {
    case 'confirm':
      return [{
        id: 'is_outbreak', stage, title: 'Confirm an outbreak exists',
        prompt: `Baseline for this setting is roughly ${scenario.baselineCasesPerPeriod} case(s) per ${scenario.periodLabel}. You now have ${scenario.observedCases} reported cases. What do you do?`,
        options: [
          { id: 'confirm_outbreak', label: 'Confirm this exceeds baseline and open a formal investigation', detail: 'A case count clearly above the expected baseline for the setting and time period is exactly the trigger for launching a field investigation — delay costs time cases keep accumulating. Whether the eventual explanation turns out to be a true outbreak or a reporting artifact, opening an investigation is the right first move.' },
          { id: 'dismiss', label: 'Dismiss it as within normal range', detail: 'Ignoring a count this far above baseline risks letting a genuine outbreak continue unchecked.' },
          { id: 'need_more_surveillance', label: 'Wait for more surveillance data before acting', detail: 'Waiting when the excess is already this clear delays case-finding and control measures without adding meaningful certainty.' },
        ],
      }]
    case 'case_definition':
      return [
        {
          id: 'clinical_criteria', stage, title: 'Set clinical criteria', prompt: 'How should the case definition specify clinical symptoms? (See the case-count comparison above — each option below corresponds to one of those three counts.)',
          options: [
            { id: 'syndrome_based', label: 'Match the specific syndrome being reported (symptom pattern + timing)', detail: 'A syndrome-based definition balances sensitivity and specificity — specific enough to exclude unrelated illness, broad enough to catch cases before lab results are back.' },
            { id: 'narrow_lab_confirmed_only', label: 'Require laboratory confirmation for every case', detail: 'Restricting to lab-confirmed cases only undercounts the outbreak early on, since lab results lag and not every case gets tested.' },
            { id: 'very_broad_any_gi_symptom', label: 'Count any report of any relevant symptom, however mild or unrelated', detail: 'A definition this broad pulls in unrelated background illness, diluting the real signal.' },
          ],
        },
        {
          id: 'time_window', stage, title: 'Set the time window', prompt: 'What time period should the case definition cover?',
          options: [
            { id: 'match_incubation_and_curve', label: "Set it based on the pathogen's plausible incubation period and the observed case timing", detail: 'Anchoring the window to the incubation period and the actual case timeline keeps the definition tied to biologically plausible exposure, not an arbitrary calendar boundary.' },
            { id: 'arbitrary_fixed_week', label: 'Use a fixed one-week window regardless of incubation period', detail: 'An arbitrary window unrelated to the incubation period can cut off real cases or include unrelated ones.' },
            { id: 'no_time_restriction', label: 'Do not restrict by time at all', detail: 'With no time restriction, the definition picks up unrelated illness from well before or after the actual exposure period.' },
          ],
        },
        {
          id: 'place_restriction', stage, title: 'Set the place/person restriction', prompt: 'Who should the case definition apply to?',
          options: [
            { id: 'restrict_to_exposure_setting', label: 'Restrict to people connected to the implicated setting', detail: 'Tying the definition to the actual setting keeps it specific to people who could plausibly have been exposed.' },
            { id: 'no_place_restriction', label: 'Apply it to anyone, anywhere, with matching symptoms', detail: 'With no connection to the setting required, the definition captures unrelated illness circulating in the general community.' },
            { id: 'restrict_to_single_subgroup_only', label: 'Restrict it to only one small subgroup within the setting', detail: 'Restricting too narrowly (e.g., only one table, one floor) risks missing real cases outside that subgroup.' },
          ],
        },
      ]
    case 'descriptive': {
      const decisions: Decision[] = [{
        id: 'curve_shape', stage, title: 'Classify the epidemic curve', prompt: 'Looking at the case counts over time above, which pattern best describes this curve?',
        options: [
          { id: 'point_source', label: 'Point-source: a single, sharp peak within about one incubation period', detail: 'Everyone was exposed at essentially the same time from the same source, and cases rise and fall together.' },
          { id: 'continuous_common_source', label: 'Continuous/intermittent common-source: an irregular curve over a longer period, without a single sharp peak or regular wave spacing', detail: 'Exposure to the source continues or recurs over time (e.g., an ongoing contamination), rather than happening all at once.' },
          { id: 'propagated', label: 'Propagated: successive waves roughly one incubation period apart', detail: 'The disease is spreading from person to person, with each wave seeding the next.' },
        ],
      }]
      if (scenario.contactNetwork) {
        const net = scenario.contactNetwork
        decisions.push({
          id: 'identify_index_case', stage, title: 'Identify the index case', prompt: 'Based on the transmission chain diagram above, which case most likely seeded the outbreak?',
          options: net.candidateIds.map((id) => {
            const node = net.nodes.find((n) => n.id === id)!
            return { id: `case_${id}`, label: node.label, detail: 'Check which node the diagram shows as the earliest with the most onward transmission lines.' }
          }),
        })
      }
      return decisions
    }
    case 'hypothesis': {
      const decisions: Decision[] = [
        {
          id: 'exposure_category_priority', stage, title: 'Prioritize the exposure categories to investigate', prompt: 'Given the setting and the curve shape, which category of exposures should the case-control questionnaire prioritize?',
          options: [
            { id: 'food_or_water', label: 'Foods and beverages served or consumed', detail: 'Appropriate when the pattern points to a shared meal or water source as the likely vehicle.' },
            { id: 'contact_and_proximity', label: 'Individual contacts, proximity, and shared surfaces', detail: 'Appropriate when the pattern points to person-to-person spread rather than a shared substance.' },
            { id: 'environmental_or_product', label: 'Ongoing environmental conditions or a specific product/system', detail: 'Appropriate when exposure appears to be continuing or recurring from a fixed source, like a water system or medication vial.' },
            { id: 'vector_and_outdoor', label: 'Outdoor activity, location, and vector exposure', detail: 'Appropriate when the pattern and incubation period point toward a vector-borne source.' },
          ],
        },
        {
          id: 'line_listing_use', stage, title: 'Decide how to compile case information', prompt: 'How should the investigation team organize what it knows about each case?',
          options: [
            { id: 'build_detailed_line_listing', label: 'Build a detailed line listing (person, time, place, and exposures for every case)', detail: 'A systematic line listing is the standard tool for spotting patterns across cases and is essential before any analytic study.' },
            { id: 'interview_only_severe_cases', label: 'Interview only the most severe cases to save time', detail: 'Focusing only on severe cases biases the exposure picture — milder cases may reveal a different, more common exposure pattern.' },
            { id: 'rely_on_media_reports_only', label: 'Rely on media and social media reports instead of direct interviews', detail: 'Secondhand reports are unverified and inconsistent, and are not a substitute for systematic case interviews.' },
          ],
        },
      ]
      if (scenario.deliberateReleaseFlag) {
        decisions.push({
          id: 'assess_deliberate_release', stage, title: 'Assess whether this looks like a natural event', prompt: 'Beyond the standard exposure categories, what about this cluster is worth flagging to leadership right away?',
          options: [
            { id: 'flag_unnatural_pattern', label: 'The unusual pathogen for this population, the single-location point-source pattern with no natural exposure link, and the unusually high severity together warrant notifying leadership and relevant response partners now, in parallel with the standard exposure interview', detail: 'None of these features alone is proof, but together — an unusual pathogen, no plausible natural source, and unusually severe presentation — they are exactly the epidemiologic red flags that warrant early notification, without needing to already know the answer.' },
            { id: 'assume_natural_foodborne', label: 'Proceed as a standard foodborne point-source investigation and interview about food and water exposures only', detail: 'The lack of any food or water link, combined with how unusual and severe this presentation is, means a standard foodborne-only approach misses the pattern here.' },
            { id: 'dismiss_as_coincidence', label: 'Treat it as a coincidental cluster of an unrelated but simultaneously-occurring illness', detail: 'A cluster this unusual, severe, and geographically tight is not the kind of thing to wave off as coincidence without at least flagging it for further review.' },
          ],
        })
      }
      return decisions
    }
    case 'inspection': {
      const decisions: Decision[] = [
        {
          id: 'inspection_samples', stage, title: 'Prioritize sample collection', prompt: 'Field lab capacity is limited. What should the inspection team prioritize collecting?',
          options: [
            { id: 'target_suspected_vehicle', label: 'Samples directly from the vehicle category identified during hypothesis generation', detail: 'Targeted confirmatory sampling of the specific suspected source is the efficient, standard approach once hypotheses point somewhere specific.' },
            { id: 'sample_everything', label: 'Every food, water, and surface sample available, regardless of hypothesis', detail: 'Untargeted, this burns limited lab capacity and turnaround time on samples unlikely to matter.' },
            { id: 'skip_environmental_sampling', label: 'Skip environmental sampling and rely only on patient interviews', detail: 'Without confirmatory lab evidence, the causal link stays based on statistical association alone — weaker for a report or any legal/regulatory action that follows.' },
          ],
        },
        {
          id: 'chain_of_custody', stage, title: 'Handle collected samples', prompt: 'How should the samples actually collected be handled after collection?',
          options: [
            { id: 'proper_chain_of_custody', label: 'Document chain of custody, preserve/refrigerate appropriately, and submit promptly', detail: "Proper handling and documentation are what make lab results defensible and usable in a report or any follow-up action." },
            { id: 'informal_storage', label: 'Store samples informally without documentation', detail: 'Undocumented handling makes results easy to challenge and harder to trace back to a specific time and place.' },
            { id: 'delay_submission', label: 'Delay lab submission by several days for convenience', detail: 'Delayed submission risks degradation of the sample, especially for perishable food or biological specimens.' },
          ],
        },
      ]
      if (scenario.resourceConstrained) {
        decisions.push({
          id: 'interview_prioritization', stage, title: 'Prioritize interviews under time pressure',
          prompt: `With ${scenario.populationAtRisk.toLocaleString()} people potentially at risk, there isn't time to interview everyone. How should the team choose whom to interview?`,
          options: [
            { id: 'representative_sample', label: 'Draw a representative sample spanning the full range of affected groups (timing, location, severity)', detail: 'A representative sample avoids skewing the exposure picture toward whichever group happens to be easiest or fastest to reach.' },
            { id: 'first_reported_only', label: 'Interview only the first cases reported', detail: 'Early reporters are not necessarily representative — they may share a trait (e.g., more severe illness, closer to a hospital) that biases the exposure picture.' },
            { id: 'self_selected_callers', label: 'Interview only people who proactively call in', detail: 'Self-selected callers tend to be more vocal, more severely affected, or more anxious than the average case — a real selection bias.' },
          ],
        })
      }
      if (scenario.manufacturingLink) {
        decisions.push({
          id: 'lot_traceback', stage, title: 'Trace the product across facilities', prompt: 'Cases span multiple, unrelated facilities. How should the inspection approach the shared product?',
          options: [
            { id: 'request_lot_numbers', label: 'Request manufacturing lot/batch numbers from every affected facility and compare them', detail: 'Comparing lot numbers across otherwise-unrelated facilities is exactly how a manufacturing-level contamination gets traced back to its source, rather than a point-of-care issue.' },
            { id: 'audit_handling_only', label: 'Assume it is point-of-care mishandling and audit only local injection practices', detail: 'If facilities share no staff or handling practices, a shared local-handling explanation does not fit the pattern — this wastes time chasing the wrong level of the supply chain.' },
            { id: 'skip_traceback', label: 'Skip product traceback since the facilities appear unrelated', detail: 'Facilities being organizationally unrelated is itself a clue pointing upstream to a shared product — not a reason to skip traceback.' },
          ],
        })
      }
      if (scenario.redHerringLab) {
        decisions.push({
          id: 'lab_result_interpretation', stage, title: 'Weigh an anomalous lab result', prompt: 'One case has a positive lab result for an organism unrelated to the pattern seen in the rest of the case series. How should this be weighed?',
          options: [
            { id: 'weigh_whole_series', label: 'Treat it as one data point among many; the epidemiologic pattern across the whole case series takes precedence over a single anomalous lab result', detail: 'A single positive result that does not fit the timing or exposure pattern of the rest of the cases is far more likely to be incidental than a hidden second source — the full case series carries more evidential weight than one specimen.' },
            { id: 'conclude_from_one_result', label: 'Conclude the outbreak\'s cause based on this one positive lab result', detail: 'Anchoring the whole investigation on a single result that does not match the pattern of the rest of the cases risks chasing a false lead.' },
            { id: 'discard_all_lab_data', label: 'Discard all lab data as unreliable', detail: 'One anomalous result does not make the rest of the lab data unreliable — this overcorrects and throws away genuinely useful evidence.' },
          ],
        })
      }
      return decisions
    }
    case 'analytic': {
      const options = scenario.exposures.map((e, i) => ({ id: `exp_${i}`, label: e.exposure, detail: 'Check the odds ratio table above before deciding.' }))
      if (scenario.possibleArtifact) {
        options.push({ id: 'artifact', label: 'No credible exposure link — this appears to be a surveillance/reporting artifact, not a true outbreak', detail: 'Check whether any exposure in the table actually shows a meaningfully elevated odds ratio before ruling this out.' })
      }
      const decisions: Decision[] = [
        { id: 'identify_vehicle', stage, title: 'Identify the most likely vehicle', prompt: 'Based on the odds ratio table above, which exposure is most likely the outbreak vehicle?', options },
        {
          id: 'study_design', stage, title: 'Choose the analytic study approach', prompt: 'How should the exposure–illness association actually be tested?',
          options: [
            { id: 'case_control_with_controls', label: 'Case-control study: compare exposures between ill cases and well controls', detail: 'A defined comparison (control) group is what lets you calculate a meaningful odds ratio and distinguish a causal exposure from one everybody happened to have.' },
            { id: 'cases_only_anecdotal', label: 'Interview cases only and rely on which exposure comes up most often', detail: 'Without a control group for comparison, a commonly-reported exposure might just be commonly eaten or done by everyone, sick or not.' },
            { id: 'skip_formal_analysis', label: 'Skip formal analysis and act on the most dramatic case report', detail: 'Acting on a single dramatic account, without systematic comparison, risks chasing the wrong exposure entirely.' },
          ],
        },
      ]
      if (scenario.pharmacovigilanceLink) {
        decisions.push({
          id: 'causality_assessment', stage, title: 'Assess drug causality', prompt: 'Beyond the odds ratio, how should the team characterize the causal relationship between the drug and the reaction?',
          options: [
            { id: 'strong_causality', label: 'Strong: appropriate temporal relationship, improvement on dechallenge, and no clear alternative cause', detail: 'This mirrors standard pharmacovigilance causality assessment — timing, dechallenge response, and ruling out alternatives together build a strong causal case, beyond the odds ratio alone.' },
            { id: 'coincidental', label: 'Coincidental: attributable to a pre-existing condition, unrelated to timing', detail: 'The timing and dechallenge data described do not support a coincidental explanation here — this call is not supported by the evidence given.' },
            { id: 'insufficient_information', label: 'Insufficient information to assess causality', detail: 'The temporal relationship, dechallenge response, and alternative-cause workup described are actually enough to support a causality judgment — this call misses that.' },
          ],
        })
      }
      return decisions
    }
    case 'control': {
      const measures = [
        { key: 'foodborne_point_source', label: 'Recall/discard the implicated food item and correct food handling and temperature-control practices at the source', route: 'foodborne_point_source' },
        { key: 'toxin_point_source', label: 'Recall/discard the implicated food item and correct food handling and temperature-control practices at the source', route: 'toxin_point_source' },
        { key: 'waterborne_point_source', label: 'Close/treat the water source until it tests safe, and issue a public advisory against use', route: 'waterborne_point_source' },
        { key: 'person_to_person_propagated', label: 'Isolate symptomatic individuals, reinforce hand hygiene and surface disinfection, and consider distancing measures in the setting', route: 'person_to_person_propagated' },
        { key: 'common_vehicle_continuous', label: 'Identify and eliminate the ongoing contamination source, then confirm it is safe before resuming normal use', route: 'common_vehicle_continuous' },
        { key: 'vector_borne', label: 'Eliminate vector breeding sites and apply vector control, combined with personal protection messaging', route: 'vector_borne' },
      ]
      // de-duplicate by label so foodborne and toxin routes (same correct measure) don't show twice
      const seen = new Set<string>()
      const uniqueOptions = measures.filter((m) => { if (seen.has(m.label)) return false; seen.add(m.label); return true })
        .map((m, i) => ({ id: `measure_${i}`, label: m.label, detail: 'Match the measure to how this specific outbreak is actually spreading.', route: m.route }))
      return [{ id: 'control_measures', stage, title: 'Choose control measures', prompt: 'Based on the transmission route you identified, which control measures are most appropriate here?', options: uniqueOptions.map(({ route: _route, ...rest }) => rest) }]
    }
    case 'communication':
      return [
        {
          id: 'draft_approach', stage, title: 'Decide what the public statement should say', prompt: 'The investigation is not yet fully complete. What should the public statement include?',
          options: [
            { id: 'facts_and_open_questions', label: 'Confirmed facts, current recommendations, and what remains under investigation — without naming an unconfirmed suspect', detail: 'This is standard public health risk-communication practice: say what is actually known, what to do about it, and be honest about what is still being confirmed.' },
            { id: 'name_unconfirmed_suspect', label: "Name the suspected business or product before confirmation, to raise public alertness", detail: 'Naming an unconfirmed suspect risks real reputational and legal harm if the investigation later points elsewhere — confirmation should come first.' },
            { id: 'wait_for_full_completion', label: 'Delay any public statement until the investigation is 100% complete', detail: 'Delaying all communication until full completion costs time people could have used to protect themselves.' },
          ],
        },
        {
          id: 'tone_choice', stage, title: 'Choose the tone', prompt: 'What tone should the statement take?',
          options: [
            { id: 'calm_actionable', label: 'Calm, factual, and action-oriented — what to do and what to watch for', detail: 'A calm, actionable tone is what actually helps people take the right precautions without causing counterproductive panic.' },
            { id: 'alarmist', label: 'Alarmist language emphasizing danger and fear', detail: 'Fear-based messaging can trigger panic or overreaction without necessarily improving the specific protective actions people take.' },
            { id: 'overly_reassuring', label: 'Overly reassuring, downplaying the risk', detail: 'Downplaying a genuine risk undermines the precautions people should actually be taking.' },
          ],
        },
      ]
    default:
      return []
  }
}

export function correctControlOptionId(scenario: Scenario, decisions: Decision[]): string {
  const decision = decisions.find((d) => d.id === 'control_measures')
  if (!decision) return ''
  const routeToLabel: Record<string, string> = {
    foodborne_point_source: 'Recall/discard the implicated food item and correct food handling and temperature-control practices at the source',
    toxin_point_source: 'Recall/discard the implicated food item and correct food handling and temperature-control practices at the source',
    waterborne_point_source: 'Close/treat the water source until it tests safe, and issue a public advisory against use',
    person_to_person_propagated: 'Isolate symptomatic individuals, reinforce hand hygiene and surface disinfection, and consider distancing measures in the setting',
    common_vehicle_continuous: 'Identify and eliminate the ongoing contamination source, then confirm it is safe before resuming normal use',
    vector_borne: 'Eliminate vector breeding sites and apply vector control, combined with personal protection messaging',
  }
  const targetLabel = routeToLabel[scenario.trueRoute]
  const match = decision.options.find((o) => o.label === targetLabel)
  return match?.id ?? ''
}
