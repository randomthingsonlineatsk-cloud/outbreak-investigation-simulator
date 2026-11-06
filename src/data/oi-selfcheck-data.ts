// ---------------------------------------------------------------------------
// Self-check (#47): a short diagnostic quiz on the core ideas, used to
// suggest a starting difficulty and outbreak. Twelve fixed questions, two for
// each of six topics, so a topic score is 0, 1, or 2.
//
// This is a quick self-assessment, not a validated test. The questions are
// fixed, so a retake shows progress after practice, not a fresh measurement.
// Pure logic lives here (no React) so it can be tested on its own.
//
// Option lengths are deliberately balanced: the correct answer should not be
// guessable just by being the longest (or shortest) option.
// ---------------------------------------------------------------------------

export type SelfCheckTopic = 'case_definition' | 'curves' | 'analysis' | 'bias_stats' | 'response' | 'communication'

export const TOPICS: SelfCheckTopic[] = ['case_definition', 'curves', 'analysis', 'bias_stats', 'response', 'communication']

export const TOPIC_LABELS: Record<SelfCheckTopic, string> = {
  case_definition: 'Case definitions',
  curves: 'Epidemic curves',
  analysis: 'Case-control analysis',
  bias_stats: 'Bias and statistics',
  response: 'Control measures',
  communication: 'Communication',
}

// Flashcard group that best covers each topic (see oi-flashcards-data.ts).
export const TOPIC_FLASHCARD_GROUP: Record<SelfCheckTopic, string> = {
  case_definition: 'Case Definition',
  curves: 'Descriptive Epidemiology',
  analysis: 'Analytic Epidemiology',
  bias_stats: 'Bias and Statistics',
  response: 'Response',
  communication: 'Response',
}

export interface SelfCheckQuestion {
  id: string
  topic: SelfCheckTopic
  prompt: string
  options: string[]
  correct: number
  explanation: string
}

export const SELF_CHECK_QUESTIONS: SelfCheckQuestion[] = [
  {
    id: 'cd1', topic: 'case_definition', correct: 1,
    prompt: 'A case definition is best described as:',
    options: ['A clinical diagnosis that is made separately for each individual patient', 'A set of standard criteria that decides who counts as a case', 'The list of everyone who tested positive for the pathogen in the laboratory', 'The final explanation of what actually caused the outbreak and why'],
    explanation: 'It is a counting rule (clinical, time, place, and person criteria), not a diagnosis. Applying the same criteria to everyone is what lets you compare cases and describe the outbreak consistently.',
  },
  {
    id: 'cd2', topic: 'case_definition', correct: 2,
    prompt: 'Early in an investigation, before lab results are back, which case definition is usually the most useful?',
    options: ['Only cases that have been confirmed by laboratory testing', 'Anyone in the whole community who reports any kind of illness', 'A syndrome-based definition with time and place limits, in tiers', 'Only the most severe cases, meaning those who needed hospital care'],
    explanation: 'Lab-only definitions miss cases while results are pending, and very broad ones swamp the signal with unrelated illness. Tiers (suspected, probable, confirmed) let you balance sensitivity against specificity.',
  },
  {
    id: 'cv1', topic: 'curves', correct: 0,
    prompt: 'An epidemic curve has one sharp peak, with most cases falling within a single incubation period. This suggests:',
    options: ['One shared exposure happening at about the same time', 'Person-to-person spread over several generations of cases', 'Continuous exposure to the same source over many weeks', 'A change in how the cases were being counted'],
    explanation: 'When everyone is exposed at roughly the same moment, onsets cluster within one incubation period, giving a point-source curve.',
  },
  {
    id: 'cv2', topic: 'curves', correct: 2,
    prompt: 'Cases rise in successive waves roughly one incubation period apart. What is the most likely explanation?',
    options: ['A single contaminated meal that all of the cases shared', 'A one-off exposure event on a single day in the past', 'Person-to-person spread, one generation after another', 'Random fluctuation in the number of cases each day'],
    explanation: 'Each wave of cases infects the next, so the waves are spaced about one incubation period apart. That is the signature of a propagated outbreak.',
  },
  {
    id: 'an1', topic: 'analysis', correct: 1,
    prompt: 'In a case-control study, the odds ratio for an exposure is 1.0. This means:',
    options: ['The exposure has been shown to cause the illness in cases', 'Cases and controls were exposed about equally often', 'The exposure protects people against becoming ill', 'The study was too small to show anything at all'],
    explanation: 'An odds ratio of 1 is the null value: the odds of exposure are the same in cases and controls, so the exposure does not distinguish them and there is no association.',
  },
  {
    id: 'an2', topic: 'analysis', correct: 3,
    prompt: 'Why does a case-control study need controls at all?',
    options: ['To make the total sample larger and easier to analyze', 'To double-check the laboratory results from the cases', 'To work out the attack rate among everyone exposed', 'To see whether an exposure is more common among cases'],
    explanation: 'An exposure that most cases had might simply be something almost everyone had. Only a comparison group shows whether it is more common in the ill.',
  },
  {
    id: 'bs1', topic: 'bias_stats', correct: 2,
    prompt: 'The 95% confidence interval for an odds ratio runs from 0.8 to 9.0. What is the fairest reading?',
    options: ['The exposure has been proven to be harmless in this outbreak', 'The exposure has been proven to be the cause of the outbreak', 'The estimate is imprecise: it fits both no effect and a large effect', 'The odds ratio must be the midpoint of the interval, about 4.9'],
    explanation: 'An interval that includes 1 is not statistically significant, but a wide one mostly says the estimate is imprecise. It is not proof of no effect, and the true value is not simply the midpoint.',
  },
  {
    id: 'bs2', topic: 'bias_stats', correct: 0,
    prompt: 'Ill people tend to remember and report an exposure more readily than well people. This is called:',
    options: ['Recall bias', 'Selection bias', 'Confounding', 'Random error'],
    explanation: 'Ill people search their memories for an explanation and well people have no reason to, which can inflate an association. Objective records help.',
  },
  {
    id: 'rs1', topic: 'response', correct: 3,
    prompt: 'The investigation confirms a waterborne source. Which control measure fits?',
    options: ['Isolate the ill people and stop visitors coming in', 'Recall all of the food that was served at the event', 'Spray insecticide to reduce the mosquito population', 'Treat or close the water source and warn people not to use it'],
    explanation: 'Control measures should interrupt the confirmed route. For water, that means treating or closing the source and telling people not to use it.',
  },
  {
    id: 'rs2', topic: 'response', correct: 0,
    prompt: 'Why should control measures often start before the investigation is complete?',
    options: ['Delay leaves people exposed, and measures can be refined later', 'Because they must always be finished before the report is written', 'Because regulators forbid any investigation from waiting for results', 'Because it makes the final report look more thorough and complete'],
    explanation: 'Waiting for perfect proof leaves people exposed. Investigators act on the balance of evidence and refine as more comes in.',
  },
  {
    id: 'cm1', topic: 'communication', correct: 1,
    prompt: 'You are pressed to name a suspected business before the results are confirmed. What is the best approach?',
    options: ['Name the business now so that the public is warned as quickly as possible', 'Share what is confirmed and advice, but hold back an unconfirmed name', 'Say nothing at all until the final report has been published', 'Let the reporter decide for themselves what to publish tonight'],
    explanation: 'Naming an unconfirmed suspect can do real harm if it is wrong, and silence withholds advice people need. Confirmed facts plus honest uncertainty is the standard approach.',
  },
  {
    id: 'cm2', topic: 'communication', correct: 2,
    prompt: 'A worried resident asks whether it is safe to eat out. What tone works best?',
    options: ['Alarmed, so that people take extra care to protect themselves', 'Dismissive, since most people will be fine either way', 'Calm and specific about what to do and what to watch for', 'Technical, giving the full epidemiological detail behind it'],
    explanation: 'The aim is for people to take the right precautions. Calm, specific, actionable messages do that; alarm and dismissal both backfire.',
  },
]

export type SelfCheckLevel = 'foundations' | 'practitioner' | 'advanced'

export interface SelfCheckResult {
  total: number
  max: number
  byTopic: Record<SelfCheckTopic, number>
  level: SelfCheckLevel
}

export const LEVEL_INFO: Record<SelfCheckLevel, { label: string; blurb: string; difficulty: 'Guided' | 'Expert' }> = {
  foundations: { label: 'Foundations', blurb: 'You are building the core ideas. Start with the guided flow, where each option explains its reasoning, and use the flashcards alongside.', difficulty: 'Guided' },
  practitioner: { label: 'Practitioner', blurb: 'You have a solid grasp of the fundamentals with a few gaps. Guided mode is still a good fit while you close them.', difficulty: 'Guided' },
  advanced: { label: 'Advanced', blurb: 'You know the fundamentals well. Expert mode hides the reasoning until you commit, which is a better test of what you know.', difficulty: 'Expert' },
}

export function levelFor(total: number): SelfCheckLevel {
  if (total >= 9) return 'advanced'
  if (total >= 5) return 'practitioner'
  return 'foundations'
}

// answers[i] is the chosen option index for question i, or null if unanswered.
export function scoreAnswers(answers: (number | null)[]): SelfCheckResult {
  const byTopic = Object.fromEntries(TOPICS.map((t) => [t, 0])) as Record<SelfCheckTopic, number>
  let total = 0
  SELF_CHECK_QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.correct) { total++; byTopic[q.topic]++ }
  })
  return { total, max: SELF_CHECK_QUESTIONS.length, byTopic, level: levelFor(total) }
}

// Outbreak suggested for each topic when it is the weakest.
const TOPIC_SCENARIO: Record<SelfCheckTopic, string> = {
  case_definition: 'bellwether-fair',
  curves: 'eastview-hall',
  analysis: 'ridgeview-wedding',
  bias_stats: 'pinehurst-festival',
  response: 'meadowbrook',
  communication: 'harborview-cafeteria',
}

export interface Recommendation { scenarioId: string; reason: string; weakTopics: SelfCheckTopic[] }

export function recommend(result: SelfCheckResult): Recommendation {
  const weakTopics = TOPICS.filter((t) => result.byTopic[t] < 2).sort((a, b) => result.byTopic[a] - result.byTopic[b])
  if (result.level === 'foundations') {
    return { scenarioId: 'ridgeview-wedding', weakTopics, reason: 'It is the most straightforward outbreak, a good way to walk through the whole investigation once.' }
  }
  if (weakTopics.length === 0) {
    return { scenarioId: 'ridgemont-artifact', weakTopics, reason: 'You got every question right, so try a scenario that tests skepticism: sometimes there is no real source to find.' }
  }
  const first = weakTopics[0]
  return { scenarioId: TOPIC_SCENARIO[first], weakTopics, reason: `Your weakest area was ${TOPIC_LABELS[first].toLowerCase()}, and this outbreak puts it front and center.` }
}

// ---- persistence -----------------------------------------------------------

const KEY = 'oi_selfcheck_v1'
export interface SelfCheckAttempt { ts: number; total: number; byTopic: Record<SelfCheckTopic, number> }

export function loadAttempts(): SelfCheckAttempt[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SelfCheckAttempt[]) : []
  } catch {
    return []
  }
}

export function saveAttempt(result: SelfCheckResult): SelfCheckAttempt[] {
  const attempts = [...loadAttempts(), { ts: Date.now(), total: result.total, byTopic: result.byTopic }].slice(-10)
  try { localStorage.setItem(KEY, JSON.stringify(attempts)) } catch { /* ignore */ }
  return attempts
}
