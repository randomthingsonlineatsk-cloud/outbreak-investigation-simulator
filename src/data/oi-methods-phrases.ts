import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Report-style wording for every decision option, used to write the Methods
// appendix (#52). Each entry has:
//   method:     what was done, in the past tense, as a methods section would
//               say it
//   limitation: what a reader should be cautious about, present for every
//               option that was not the strongest choice
//
// A few entries are functions because the right wording depends on the
// scenario's data or on whether the choice matched what the data showed.
// The key '*' is a fallback for decisions whose option ids are generated
// (index cases, control measures).
//
// The conversations with people (the NPC decisions) are deliberately left
// out: they are about how the investigation was conducted, not methods a
// report would describe.
// ---------------------------------------------------------------------------

export interface PhraseCtx { s: Scenario; optionId: string; verdict: string; label: string }
export type Txt = string | ((c: PhraseCtx) => string | undefined)
export interface Phrase { method: Txt; limitation?: Txt }

export const lowerFirst = (t: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t)
const ifPoor = (text: string): Txt => (c) => (c.verdict === 'poor' ? text : undefined)

export const METHOD_PHRASES: Record<string, Record<string, Phrase>> = {
  is_outbreak: {
    confirm_outbreak: { method: 'The health department confirmed that the case count exceeded the expected baseline and opened a formal investigation.' },
    dismiss: { method: 'The initial report was assessed as within the normal range and no formal investigation was opened at that point.', limitation: 'Not investigating a clear excess over baseline allowed further exposure and delayed case finding.' },
    need_more_surveillance: { method: 'The department decided to wait for additional surveillance data before opening a formal investigation.', limitation: 'Waiting for more surveillance data delayed case finding and control measures despite a clear excess over baseline.' },
  },
  clinical_criteria: {
    syndrome_based: { method: (c) => `Cases were defined by the reported syndrome (${lowerFirst(c.s.syndrome)}).` },
    narrow_lab_confirmed_only: { method: 'Only laboratory-confirmed illness was counted as a case.', limitation: 'Restricting cases to laboratory-confirmed illness undercounted the outbreak while results were pending.' },
    very_broad_any_gi_symptom: { method: 'Any report of a relevant symptom, however mild, was counted as a case.', limitation: 'The very broad definition included unrelated background illness and diluted the signal.' },
  },
  time_window: {
    match_incubation_and_curve: { method: (c) => `The onset window was set from the plausible incubation period (${c.s.incubationHoursMin} to ${c.s.incubationHoursMax} hours) and the observed timing of cases.` },
    arbitrary_fixed_week: { method: 'A fixed one-week onset window was used.', limitation: 'The onset window was not tied to the incubation period and may have excluded real cases or included unrelated ones.' },
    no_time_restriction: { method: 'No onset window was applied.', limitation: 'With no time restriction, unrelated illness from outside the exposure period may have been counted.' },
  },
  place_restriction: {
    restrict_to_exposure_setting: { method: (c) => `Cases were limited to persons connected to the implicated setting (${lowerFirst(c.s.setting)}).` },
    no_place_restriction: { method: 'No restriction by place or connection to the setting was applied.', limitation: 'Without a link to the setting, unrelated community illness may have been counted.' },
    restrict_to_single_subgroup_only: { method: 'Case finding was restricted to a single subgroup within the setting.', limitation: 'Restricting case finding to one subgroup risked missing real cases elsewhere in the setting.' },
  },
  revise_case_definition: {
    revise_and_reapply: { method: 'After early interviews showed the initial definition was misclassifying, it was tightened, tiered into probable and confirmed cases, applied to every case reported to date, and the change was documented.' },
    keep_original: { method: 'The original broad definition was retained unchanged.', limitation: 'The retained definition was known to misclassify unrelated illness, which blurred the curve and diluted odds ratios.' },
    revise_new_cases_only: { method: 'A tighter definition was adopted and applied only to cases reported afterward.', limitation: 'Applying different definitions to earlier and later reports made the counts non-comparable.' },
  },
  curve_shape: {
    point_source: { method: 'The epidemic curve was classified as point-source: a single sharp peak within about one incubation period, consistent with a common exposure at one time.', limitation: ifPoor('The curve classification did not match the pattern in the data, which may have directed the investigation toward the wrong kind of source.') },
    continuous_common_source: { method: 'The epidemic curve was classified as continuous or intermittent common-source: an irregular curve over an extended period without a single sharp peak or regular wave spacing.', limitation: ifPoor('The curve classification did not match the pattern in the data, which may have directed the investigation toward the wrong kind of source.') },
    propagated: { method: 'The epidemic curve was classified as propagated: successive waves roughly one incubation period apart, consistent with person-to-person spread.', limitation: ifPoor('The curve classification did not match the pattern in the data, which may have directed the investigation toward the wrong kind of source.') },
  },
  identify_index_case: {
    '*': {
      method: (c) => {
        const node = c.s.contactNetwork?.nodes.find((n) => `case_${n.id}` === c.optionId)
        return `From the transmission chain, the index case was identified as ${node ? node.label : 'a case in the chain'}.`
      },
      limitation: ifPoor('The case identified as the index case was not the earliest link seeding the most onward transmission in the transmission chain.'),
    },
  },
  cluster_splitting: {
    split_and_investigate: { method: 'Because the pathogens, age groups, and settings differed, the cases were treated as two separate clusters, each with its own case definition.' },
    pool_as_one: { method: 'All cases were treated as a single outbreak.', limitation: 'Pooling two unrelated clusters diluted the association for each true source and obscured the curve.' },
    drop_smaller_cluster: { method: 'The smaller cluster was set aside and only the larger was investigated.', limitation: 'The smaller cluster represented ongoing person-to-person spread and was left uninvestigated and uncontrolled.' },
  },
  exposure_category_priority: {
    food_or_water: { method: 'The questionnaire prioritized food and beverage exposures.', limitation: ifPoor('The exposure categories prioritized did not match the source the data ultimately indicated, which spent interview time on less relevant exposures.') },
    contact_and_proximity: { method: 'The questionnaire prioritized contacts, proximity, and shared surfaces.', limitation: ifPoor('The exposure categories prioritized did not match the source the data ultimately indicated, which spent interview time on less relevant exposures.') },
    environmental_or_product: { method: 'The questionnaire prioritized ongoing environmental conditions and specific products or systems.', limitation: ifPoor('The exposure categories prioritized did not match the source the data ultimately indicated, which spent interview time on less relevant exposures.') },
    vector_and_outdoor: { method: 'The questionnaire prioritized outdoor activity, location, and vector exposure.', limitation: ifPoor('The exposure categories prioritized did not match the source the data ultimately indicated, which spent interview time on less relevant exposures.') },
  },
  line_listing_use: {
    build_detailed_line_listing: { method: 'A line listing recording person, time, place, and exposures was built for every case.' },
    interview_only_severe_cases: { method: 'Interviews were limited to the most severe cases.', limitation: 'Interviewing only severe cases may have biased the exposure picture, since milder cases may have differed.' },
    rely_on_media_reports_only: { method: 'Information came mainly from media and social media reports rather than direct interviews.', limitation: 'Media reports are unverified and inconsistent, and are no substitute for systematic case interviews.' },
  },
  infectious_vs_occupational: {
    investigate_workplace_exposure: { method: 'Because cases were confined to one work area, symptoms tracked time at work, and there was no secondary spread or identified pathogen, a workplace exposure was considered, with occupational health and industrial hygiene involved.' },
    assume_infectious_isolate: { method: 'The cluster was treated as a contagious infection, with cases isolated and the workforce sent home.', limitation: 'There was no evidence of person-to-person spread, so isolation and a workforce shutdown did not address the source.' },
    blame_individual_habits: { method: 'Individual factors such as smoking were considered the likely explanation and the investigation was closed.', limitation: 'Attributing a cluster confined to one work area to individual habits left the workplace source in place.' },
  },
  assess_deliberate_release: {
    flag_unnatural_pattern: { method: 'Because the pathogen was unusual for the population, no natural source was found, and severity was unusually high, leadership and response partners were notified early while the standard investigation continued.' },
    assume_natural_foodborne: { method: 'The cluster was investigated as a routine foodborne event, with interviews limited to food and water.', limitation: 'A routine foodborne approach missed the features that made the cluster unusual: an atypical pathogen, no natural source, and high severity.' },
    dismiss_as_coincidence: { method: 'The cluster was regarded as coincidental.', limitation: 'A cluster this unusual and severe was not flagged for further review.' },
  },
  interview_prioritization: {
    representative_sample: { method: 'Because the population was too large to interview in full, a representative sample spanning timing, location, and severity was interviewed.' },
    first_reported_only: { method: 'Only the first cases reported were interviewed.', limitation: 'Early reporters may not have been representative, which introduces selection bias into the exposure history.' },
    self_selected_callers: { method: 'Only people who called in were interviewed.', limitation: 'Self-selected callers are typically more vocal or more severely affected, which introduces selection bias.' },
  },
  inspection_samples: {
    target_suspected_vehicle: { method: 'Field sampling targeted the vehicle category identified during hypothesis generation.' },
    sample_everything: { method: 'All available food, water, and surface samples were collected regardless of hypothesis.', limitation: 'Untargeted sampling used limited laboratory capacity on samples unlikely to be informative.' },
    skip_environmental_sampling: { method: 'No environmental samples were collected, and the investigation relied on interviews.', limitation: 'Without laboratory evidence from the source, the causal link rests on statistical association alone.' },
  },
  chain_of_custody: {
    proper_chain_of_custody: { method: 'Samples were documented under chain of custody, preserved appropriately, and submitted promptly.' },
    informal_storage: { method: 'Samples were stored informally without documentation.', limitation: 'Undocumented sample handling weakens the defensibility of laboratory results.' },
    delay_submission: { method: 'Sample submission to the laboratory was delayed by several days.', limitation: 'Delayed submission risks sample degradation, especially for perishable material.' },
  },
  lot_traceback: {
    request_lot_numbers: { method: 'Manufacturing lot numbers were requested from every affected facility and compared.' },
    audit_handling_only: { method: 'Only local handling practices at each facility were audited.', limitation: 'A local-handling explanation did not fit cases across unrelated facilities, and the shared product was not examined.' },
    skip_traceback: { method: 'Product traceback was not undertaken because the facilities appeared unrelated.', limitation: 'The lack of a link between facilities pointed to a shared product, and traceback was not performed.' },
  },
  lab_result_interpretation: {
    weigh_whole_series: { method: 'One laboratory result that did not fit the timing or exposure pattern of the other cases was treated as a single data point, with the epidemiologic pattern across the case series taking precedence.' },
    conclude_from_one_result: { method: 'The cause of the outbreak was inferred from a single positive laboratory result.', limitation: 'Anchoring the investigation on one result that did not fit the case series risked a false lead.' },
    discard_all_lab_data: { method: 'All laboratory data were set aside as unreliable.', limitation: 'Discarding all laboratory data because of one anomalous result removed useful evidence.' },
  },
  study_design: {
    case_control_with_controls: { method: 'A case-control study compared exposures between ill cases and well controls.' },
    cases_only_anecdotal: { method: 'Cases were interviewed and the most frequently reported exposure was taken as the likely vehicle.', limitation: 'Without a control group, a commonly reported exposure may simply have been common to everyone.' },
    skip_formal_analysis: { method: 'No formal analysis was performed, and action was based on the most prominent case report.', limitation: 'Acting on a single prominent report without systematic comparison risks pursuing the wrong exposure.' },
  },
  choose_control_source: {
    representative_source: { method: 'Controls were drawn from a representative sample of exposed persons using an attendee list or similar records.' },
    companions_of_cases: { method: 'Controls were companions nominated by cases.', limitation: 'Companions shared exposures with cases, which biases odds ratios toward 1.' },
    hotline_volunteers: { method: 'Controls were people who called a health hotline about the event and did not meet the case definition.', limitation: 'Hotline callers are self-selected and not representative of those exposed, which biases the comparison.' },
  },
  analyze_matched_data: {
    matched_analysis: { method: 'Because each case was matched to a control, a matched analysis using discordant pairs was performed.' },
    ignore_matching: { method: 'The matched data were analyzed as an unmatched 2x2 table.', limitation: 'Ignoring the matching discarded the design and typically biases the odds ratio toward 1.' },
    concordant_pairs_only: { method: 'Only pairs concordant for exposure were analyzed.', limitation: 'Concordant pairs carry no information about the association, and only discordant pairs do.' },
  },
  address_recall_bias: {
    verify_with_records: { method: 'Self-reported exposures were checked against objective records where available, and all participants were interviewed with the same standardized questionnaire.' },
    accept_self_report: { method: 'Self-reported exposure data were used as reported.', limitation: 'Self-reported exposure may have been subject to recall bias, with cases recalling exposures differently from controls.' },
    discard_interviews: { method: 'Interview-based exposure data were set aside as unreliable.', limitation: 'Discarding interview data removed the main source of exposure information instead of verifying it.' },
  },
  interpret_wide_interval: {
    underpowered_gather_more: { method: 'Because the study was small, a wide confidence interval was interpreted as imprecision rather than absence of effect, and the estimate was considered alongside the epidemic curve, incubation period, and laboratory evidence.' },
    conclude_no_association: { method: 'An interval that included 1 was interpreted as showing no association.', limitation: 'A non-significant result in a very small study does not exclude an effect, because power was low.' },
    conclude_proven: { method: 'The size of the odds ratio was taken as proof of causation.', limitation: 'An imprecise odds ratio is an association and cannot prove causation.' },
  },
  causality_assessment: {
    strong_causality: { method: 'Causality was assessed as strong on the basis of a plausible temporal relationship, improvement on dechallenge, and the absence of a clear alternative cause.' },
    coincidental: { method: 'The reactions were judged coincidental and attributed to a pre-existing condition.', limitation: 'A coincidental attribution was not supported by the timing and dechallenge data.' },
    insufficient_information: { method: 'Causality was judged not assessable for lack of information.', limitation: 'The available timing, dechallenge, and alternative-cause data were sufficient for a causality judgment.' },
  },
  control_measures: {
    '*': {
      method: (c) => c.optionId === 'measure_artifact'
        ? 'No outbreak-specific control measure was recommended: the finding was reported, the new test\'s higher sensitivity was noted when interpreting surveillance baselines, and routine surveillance continued.'
        : `Control measures recommended were to ${lowerFirst(c.label)}.`,
      limitation: ifPoor('The recommended control measures did not address the transmission route the data indicated.'),
    },
  },
  second_cluster_response: {
    separate_targeted_responses: { method: 'Each cluster received its own control measures: a recall and food-handling correction for the foodborne cluster, and exclusion and hygiene measures at the childcare center.' },
    food_recall_only: { method: 'Only the implicated food item was recalled.', limitation: 'The childcare-center cluster was left without control measures.' },
    close_everything: { method: 'The deli, the childcare center, and other town facilities were closed.', limitation: 'Untargeted closures were disproportionate and no more effective than targeted measures.' },
  },
  draft_approach: {
    facts_and_open_questions: { method: 'The public statement gave confirmed facts and current recommendations, stated what remained under investigation, and did not name an unconfirmed suspect.' },
    name_unconfirmed_suspect: { method: 'The suspected business or product was named publicly before confirmation.', limitation: 'Naming an unconfirmed suspect risked reputational and legal harm had the investigation pointed elsewhere.' },
    wait_for_full_completion: { method: 'Public communication was deferred until the investigation was complete.', limitation: 'Deferring all communication delayed protective advice to the public.' },
  },
  tone_choice: {
    calm_actionable: { method: 'Public communication was calm, factual, and action-oriented.' },
    alarmist: { method: 'Public communication emphasized danger and fear.', limitation: 'Alarmist messaging can provoke panic without improving protective action.' },
    overly_reassuring: { method: 'Public communication downplayed the risk.', limitation: 'Downplaying a real risk undermines protective precautions.' },
  },
}
