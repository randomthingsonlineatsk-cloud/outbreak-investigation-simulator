import { buildDecisions } from './oi-decisions-full'
import { computeOddsRatio, computeOddsRatioCI } from './oi-engine'
import { METHOD_PHRASES, lowerFirst, type PhraseCtx, type Txt } from './oi-methods-phrases'
import type { Decision, Grade, Scenario, StageKey } from './oi-types'

// ---------------------------------------------------------------------------
// Methods appendix (#52). Writes a "Materials and Methods" section, in the
// order a real outbreak report uses, from the choices made in a finished
// investigation. It needs only the scenario and the graded decisions: each
// grade records the label of the option chosen, which maps back to the option.
//
// It describes what was DONE, so a weaker set of choices reads as weaker
// methods, and every choice that was not the strongest contributes a
// limitation. The odds ratio sentence is computed from the scenario's data.
// Conversations with people (the NPC decisions) are not part of a methods
// section and are left out.
// ---------------------------------------------------------------------------

export interface MethodsSection { heading: string; text: string }
export interface MethodsAppendix {
  title: string
  intro: string
  sections: MethodsSection[]
  limitations: string[]
  paragraph: string
  fullText: string
}

export const SMALL_STUDY_PREFIX = 'The study was small'
const SMALL_STUDY_CASES = 15
export const NO_LIMITATIONS_NOTE = 'No methodological limitations beyond the usual constraints of a case-control design, such as residual confounding and self-reported exposure, were identified in the choices recorded.'

const STATS = '__stats__'
const SECTION_DEFS: { heading: string; ids: string[] }[] = [
  { heading: 'Outbreak detection', ids: ['is_outbreak'] },
  { heading: 'Case definition and case finding', ids: ['clinical_criteria', 'time_window', 'place_restriction', 'revise_case_definition'] },
  { heading: 'Descriptive epidemiology', ids: ['curve_shape', 'cluster_splitting', 'identify_index_case'] },
  { heading: 'Hypothesis generation and interviews', ids: ['exposure_category_priority', 'line_listing_use', 'infectious_vs_occupational', 'assess_deliberate_release', 'interview_prioritization'] },
  { heading: 'Environmental and laboratory investigation', ids: ['inspection_samples', 'chain_of_custody', 'lab_result_interpretation', 'lot_traceback'] },
  { heading: 'Analytic study', ids: ['study_design', 'choose_control_source', 'analyze_matched_data', 'address_recall_bias', STATS, 'interpret_wide_interval', 'causality_assessment'] },
  { heading: 'Control measures and communication', ids: ['control_measures', 'second_cluster_response', 'draft_approach', 'tone_choice'] },
]

const endSentence = (t: string) => { const s = t.trim(); return /[.!?]$/.test(s) ? s : `${s}.` }
const resolve = (t: Txt | undefined, c: PhraseCtx) => (t === undefined ? undefined : typeof t === 'function' ? t(c) : t)

// Two decimals for small values, one for values of 10 or more. An estimate and
// its interval always use the same number of decimals.
const digitsFor = (x: number) => (x >= 10 ? 1 : 2)
function fmtOr(x: number, digits?: number): string {
  if (!Number.isFinite(x)) return 'not estimable'
  return x.toFixed(digits ?? digitsFor(x))
}

interface Chosen { optionId: string; label: string }

function makeResolver(scenario: Scenario) {
  const cache = new Map<StageKey, Decision[]>()
  const decisionsFor = (stage: StageKey) => { if (!cache.has(stage)) cache.set(stage, buildDecisions(scenario, stage)); return cache.get(stage)! }
  return (g: Grade): Chosen | null => {
    const option = decisionsFor(g.stage).find((d) => d.id === g.decisionId)?.options.find((o) => o.label === g.chosenLabel)
    return option ? { optionId: option.id, label: option.label } : null
  }
}

// The caution to attach when the exposure named as the vehicle was not the
// right call. It follows the graded verdict, not just the ranking of odds
// ratios: in a surveillance-artifact scenario the numerically highest odds
// ratio is still not a real signal.
function vehicleLimitation(verdict: string, idx: number, maxIdx: number): string | undefined {
  if (verdict !== 'poor') return undefined
  return idx === maxIdx
    ? 'The exposure named as the vehicle showed no meaningfully elevated odds ratio, so the data did not support identifying a vehicle.'
    : 'The exposure identified as the vehicle did not have the strongest association in the case-control data.'
}

// The odds ratio sentence, computed from the scenario's own data.
function statsBlock(scenario: Scenario, chosen: Chosen, verdict: string, matchedChoice: string | undefined): { method: string; limitation?: string } {
  const rows = scenario.exposures
  const ors = rows.map(computeOddsRatio)
  const mp = scenario.matchedPairs
  const first = rows[0]
  const sample = mp ? `${mp.pairs} matched case-control pairs` : `${first.casesExposed + first.casesUnexposed} cases and ${first.controlsExposed + first.controlsUnexposed} controls`

  if (chosen.optionId === 'artifact') {
    return {
      method: `The study included ${sample}. No exposure showed a meaningfully elevated odds ratio (the highest was ${fmtOr(Math.max(...ors))}), and the increase was attributed to a reporting or surveillance artifact rather than a true outbreak.`,
      limitation: verdict === 'poor' ? 'Concluding that the increase was an artifact despite a clearly elevated odds ratio would have left a real vehicle uninvestigated.' : undefined,
    }
  }
  const idx = Number(chosen.optionId.replace('exp_', ''))
  const row = rows[idx]
  if (!row) return { method: `The study included ${sample}.` }
  const maxIdx = ors.indexOf(Math.max(...ors))
  const limitation = vehicleLimitation(verdict, idx, maxIdx)

  const matchedRow = mp?.rows.find((r) => r.exposure === row.exposure)
  if (matchedChoice === 'matched_analysis' && matchedRow && matchedRow.caseOnly > 0 && matchedRow.controlOnly > 0) {
    const mor = matchedRow.caseOnly / matchedRow.controlOnly
    const se = Math.sqrt(1 / matchedRow.caseOnly + 1 / matchedRow.controlOnly)
    const lo = Math.exp(Math.log(mor) - 1.96 * se)
    const hi = Math.exp(Math.log(mor) + 1.96 * se)
    const d = digitsFor(mor)
    return { method: `The study included ${sample}. In the matched analysis of discordant pairs, the odds ratio for ${row.exposure} was ${fmtOr(mor, d)} (approximate 95% CI ${fmtOr(lo, d)} to ${fmtOr(hi, d)}).`, limitation }
  }

  const ci = computeOddsRatioCI(row)
  const d = digitsFor(ci.or)
  const ciText = `95% CI ${fmtOr(ci.lower, d)} to ${fmtOr(ci.upper, d)}`
  let comparison: string
  if (idx === maxIdx) {
    const others = ors.map((o, i) => ({ o, i })).filter((x) => x.i !== idx)
    const next = others.reduce((a, b) => (b.o > a.o ? b : a))
    comparison = `, compared with ${fmtOr(next.o)} for the next-highest exposure (${rows[next.i].exposure})`
  } else {
    comparison = `; a higher odds ratio was observed for ${rows[maxIdx].exposure} (${fmtOr(ors[maxIdx])})`
  }
  return { method: `The study included ${sample}. The exposure identified as the most likely vehicle, ${row.exposure}, had an odds ratio of ${fmtOr(ci.or, d)} (${ciText})${comparison}.`, limitation }
}

export function buildMethodsAppendix(scenario: Scenario, grades: Grade[]): MethodsAppendix {
  const resolveChoice = makeResolver(scenario)
  const byDecision = new Map<string, Grade>()
  for (const g of grades) byDecision.set(g.decisionId, g)

  const phraseFor = (id: string): { method?: string; limitation?: string } => {
    const g = byDecision.get(id)
    if (!g) return {}
    const chosen = resolveChoice(g)
    const table = METHOD_PHRASES[id]
    const phrase = chosen && table ? (table[chosen.optionId] ?? table['*']) : undefined
    if (!chosen || !phrase) return {}
    const ctx: PhraseCtx = { s: scenario, optionId: chosen.optionId, verdict: g.verdict, label: chosen.label }
    return { method: resolve(phrase.method, ctx), limitation: resolve(phrase.limitation, ctx) }
  }

  const sections: MethodsSection[] = []
  const limitations: string[] = []
  const addLimitation = (l?: string) => { if (l && !limitations.includes(endSentence(l))) limitations.push(endSentence(l)) }

  for (const def of SECTION_DEFS) {
    const sentences: string[] = []
    for (const id of def.ids) {
      if (id === STATS) {
        const vg = byDecision.get('identify_vehicle')
        const vc = vg ? resolveChoice(vg) : null
        if (vg && vc) {
          const matched = byDecision.get('analyze_matched_data')
          const matchedChoice = matched ? resolveChoice(matched)?.optionId : undefined
          const block = statsBlock(scenario, vc, vg.verdict, matchedChoice)
          sentences.push(endSentence(block.method))
          addLimitation(block.limitation)
        }
        continue
      }
      const p = phraseFor(id)
      if (p.method) sentences.push(endSentence(p.method))
      addLimitation(p.limitation)
    }
    if (sentences.length === 0) continue

    // Facts the reader would expect around a section.
    if (def.heading === 'Outbreak detection') {
      const expected = scenario.baselineCasesPerPeriod === 0
        ? `with essentially no cases expected per ${scenario.periodLabel}`
        : `against an expected baseline of about ${scenario.baselineCasesPerPeriod} per ${scenario.periodLabel}`
      sentences.unshift(endSentence(`The investigation concerned ${scenario.name}: ${scenario.observedCases} reported cases (setting: ${lowerFirst(scenario.setting)}), ${expected}`))
    }
    if (def.heading === 'Descriptive epidemiology') {
      if (scenario.spotMap) sentences.push('Attack rates were also compared across locations.')
      if (scenario.personBreakdown) sentences.push(`Attack rates were also compared by ${scenario.personBreakdown.dimensionLabel.toLowerCase()}.`)
    }
    sections.push({ heading: def.heading, text: sentences.join(' ') })
  }

  // A very small study is a limitation in itself, whatever was chosen.
  const analytic = grades.some((g) => g.stage === 'analytic')
  const caseCount = scenario.exposures[0] ? scenario.exposures[0].casesExposed + scenario.exposures[0].casesUnexposed : 0
  if (analytic && caseCount > 0 && caseCount < SMALL_STUDY_CASES) {
    addLimitation(`${SMALL_STUDY_PREFIX} (${caseCount} cases), which limits statistical power and the precision of the estimates`)
  }

  const title = `Materials and Methods: ${scenario.name}`
  const intro = `This appendix describes the methods recorded for a simulated investigation of ${scenario.name}. All settings, cases, and data are fictional and were generated for education.`
  const paragraph = sections.map((s) => s.text).join(' ')
  const limitationBlock = limitations.length > 0 ? limitations.map((l) => `- ${l}`).join('\n') : NO_LIMITATIONS_NOTE
  const fullText = sections.length === 0
    ? `${title}\n\n${intro}`
    : `${title}\n\n${intro}\n\n${sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n')}\n\nLimitations\n${limitationBlock}`
  return { title, intro, sections, limitations, paragraph, fullText }
}
