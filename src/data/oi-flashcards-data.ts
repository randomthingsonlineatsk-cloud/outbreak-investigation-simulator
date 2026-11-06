import { GLOSSARY, REAL_WORLD_CASES } from './oi-reference'

// ---------------------------------------------------------------------------
// Flashcards (#48). The deck is the whole glossary plus the real-world case
// studies, plus extra cards for the bias and statistics ideas the newer
// scenarios teach. Progress uses three Leitner-style boxes:
//   box 1 = new or missed, box 2 = got it once, box 3 = known
// "Got it" moves a card up one box; "Again" sends it back to box 1. Cards in
// lower boxes come up first, and known cards are hidden by default once
// something is left to learn. Pure logic (no React) so it can be tested.
// ---------------------------------------------------------------------------

export interface Flashcard { id: string; group: string; front: string; back: string }

const EXTRA_CARDS: { group: string; front: string; back: string }[] = [
  { group: 'Bias and Statistics', front: 'Recall bias', back: 'Cases and controls remember or report past exposures differently. Ill people tend to search their memories for an explanation and report exposures more readily. Verify with objective records where they exist, and interview everyone the same standardized way.' },
  { group: 'Bias and Statistics', front: 'Selection bias (control selection)', back: 'Controls who do not represent the population the cases came from, such as companions who shared the exposure or self-selected volunteers. It distorts odds ratios. Draw controls from a list of everyone at risk instead.' },
  { group: 'Bias and Statistics', front: 'Matched case-control analysis', back: 'When each case is matched to a control, analyze the pairs rather than pooled totals. Only discordant pairs carry information: the matched odds ratio is case-only pairs divided by control-only pairs. Ignoring the matching typically pulls the estimate toward 1.' },
  { group: 'Bias and Statistics', front: '95% confidence interval', back: 'A range of odds ratios reasonably compatible with the data. If it includes 1 the result is not statistically significant, but a wide interval mostly signals an imprecise estimate, not proof that there is no effect.' },
  { group: 'Bias and Statistics', front: 'Statistical power', back: 'The chance a study detects a real effect of a given size. Small outbreaks have low power, so even a large odds ratio can have an interval that crosses 1. More cases, and more controls per case, tighten the estimate.' },
  { group: 'Bias and Statistics', front: 'Dose-response', back: 'Risk that rises with more exposure, such as more servings or more frequent use. It is one of the Bradford Hill criteria supporting causation, beyond a simple exposed versus unexposed comparison.' },
  { group: 'Case Definition', front: 'Sensitivity and specificity of a case definition', back: 'Sensitivity is how many true cases the definition catches; specificity is how well it excludes non-cases. A broad definition raises sensitivity and lowers specificity, and a narrow one does the opposite. Tiers (suspected, probable, confirmed) manage the trade-off.' },
  { group: 'Descriptive Epidemiology', front: 'Incubation period', back: 'The time from exposure to the start of symptoms. It sets the time window of a case definition and lets you work backward from onset dates on the epi curve to the likely time of exposure.' },
  { group: 'Response', front: 'Chain of custody', back: 'Documented, unbroken handling of a sample from collection to the lab, including labeling, storage conditions, and prompt submission. It is what makes lab results defensible in a report or any follow-up action.' },
  { group: 'Response', front: 'Surveillance artifact', back: 'An apparent rise in cases caused by a change in how cases are found or counted, such as a more sensitive test, rather than a real rise in illness. Clues are odds ratios all near 1 and a timing match with the change.' },
]

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export const ALL_CARDS: Flashcard[] = [
  ...[...GLOSSARY, ...REAL_WORLD_CASES].map((e) => ({ id: slug(e.term), group: e.group, front: e.term, back: e.body })),
  ...EXTRA_CARDS.map((e) => ({ id: slug(e.front), group: e.group, front: e.front, back: e.back })),
]

export const CARD_GROUPS: string[] = [...new Set(ALL_CARDS.map((c) => c.group))]

export type Boxes = Record<string, number>
export const MASTERED_BOX = 3

export function boxOf(boxes: Boxes, id: string): number {
  return boxes[id] ?? 1
}

export function nextBox(box: number, gotIt: boolean): number {
  return gotIt ? Math.min(MASTERED_BOX, box + 1) : 1
}

export function masteredCount(cards: Flashcard[], boxes: Boxes): number {
  return cards.filter((c) => boxOf(boxes, c.id) >= MASTERED_BOX).length
}

// Order for a study session: shuffled, then stably sorted so lower boxes come
// first. Known cards are left out when hideMastered is on, unless nothing
// else is left, in which case the whole filtered set is used.
export function buildDeck(cards: Flashcard[], boxes: Boxes, group: string, hideMastered: boolean, rng: () => number = Math.random): Flashcard[] {
  let pool = group === 'all' ? cards : cards.filter((c) => c.group === group)
  if (hideMastered) {
    const unmastered = pool.filter((c) => boxOf(boxes, c.id) < MASTERED_BOX)
    if (unmastered.length > 0) pool = unmastered
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.sort((a, b) => boxOf(boxes, a.id) - boxOf(boxes, b.id))
}

// ---- persistence -----------------------------------------------------------

const KEY = 'oi_flashcards_v1'

export function loadBoxes(): Boxes {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Boxes) : {}
  } catch {
    return {}
  }
}

export function saveBoxes(boxes: Boxes) {
  try { localStorage.setItem(KEY, JSON.stringify(boxes)) } catch { /* ignore */ }
}
