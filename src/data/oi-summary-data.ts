import { ACHIEVEMENTS, correctRunCount, distinctCorrectOutbreaks, type BadgeStore } from './oi-achievements'
import { getScenario } from './oi-scenarios'
import type { Scenario, TransmissionRoute } from './oi-types'

// ---------------------------------------------------------------------------
// Skills summary (#51): a one-page PDF listing the outbreaks you solved and
// the skills you demonstrated, for use in a portfolio or CV narrative.
//
// It is built from your recorded run history and badges. Like the
// certificate, it is issued inside a fictional educational simulation, rests
// on activity recorded in this browser (which nothing verifies), and is not
// an accredited qualification. The page says so.
//
// Everything here is pure (no React, no PDF library). layoutSummary returns a
// list of drawing operations given a text-measuring function, so the layout
// can be tested against the page bounds with real font metrics, and the PDF
// renderer just draws the operations.
// ---------------------------------------------------------------------------

export interface HistoryRow { scenarioId: string; verdict: string; score: number; maxScore: number }

const ROUTE_LABEL: Record<TransmissionRoute, string> = {
  foodborne_point_source: 'Foodborne',
  waterborne_point_source: 'Waterborne',
  toxin_point_source: 'Toxin-mediated',
  common_vehicle_continuous: 'Common source',
  person_to_person_propagated: 'Person-to-person',
  vector_borne: 'Vector-borne',
}

// Skills and topics an outbreak exercises, from what the scenario contains.
export function scenarioTags(s: Scenario): string[] {
  const tags: string[] = []
  const add = (cond: unknown, tag: string) => { if (cond) tags.push(tag) }
  add(s.possibleArtifact, 'Surveillance artifact')
  add(s.deliberateReleaseFlag, 'Unusual-pattern recognition')
  add(s.redHerringLab, 'Weighing lab evidence')
  add(s.twoClustersFlag, 'Separating clusters')
  add(s.occupationalFlag, 'Occupational exposure')
  add(s.caseDefRevision, 'Case-definition revision')
  add(s.matchedPairs, 'Matched analysis')
  add(s.recallBiasCheck, 'Recall bias')
  add(s.selectionBiasCheck, 'Control selection')
  add(s.smallSampleFlag, 'Power and sample size')
  add(s.pharmacovigilanceLink, 'Pharmacovigilance')
  add(s.manufacturingLink, 'Manufacturing traceback')
  add(s.contactNetwork, 'Contact tracing')
  add(s.stratifiedAnalysis, 'Confounding')
  add(s.doseResponse, 'Dose-response')
  add(s.cohortComparison, 'Cohort analysis')
  add(s.spotMap, 'Spot map')
  add(s.resourceConstrained, 'Sampling under constraints')
  return tags
}

// What a badge means as a demonstrated skill, worded for a portfolio. Where a
// badge can be earned several ways, the wording lists them, so it stays true
// whichever one applied.
export const PORTFOLIO_LINES: Record<string, string> = {
  textbook: 'Completed an investigation with every decision correct and no hints.',
  unassisted: 'Identified the correct source without using any hints.',
  expert_mode: 'Identified the correct source with the reasoning behind each option hidden.',
  second_look: 'Recovered from an inconclusive result by revisiting the hypothesis and finding the source.',
  peer_reviewed: 'Sought senior review, then locked in a fully correct analytic conclusion.',
  quick_response: 'Identified the correct source under time pressure in under ten minutes.',
  skeptic: 'Handled a misleading signal correctly (anomalous lab result, possible deliberate release, or surveillance artifact).',
  bias_buster: 'Handled a bias problem correctly (recall bias, control selection, or matched-pairs analysis).',
  statistician: 'Applied statistical judgment (an underpowered wide interval, or revising a case definition).',
  big_picture: 'Framed the problem correctly (separating clusters, recognizing an occupational cause, or finding the index case).',
  cross_discipline: 'Applied another discipline correctly (pharmacovigilance causality or manufacturing lot traceback).',
  communicator: 'Chose the right approach and tone for public communication.',
  people_skills: 'Handled a reluctant case, a defensive site manager, and a persistent reporter well.',
  veteran: 'Identified the correct source in five or more investigations.',
  range: 'Identified the correct source in ten or more different outbreaks.',
}

const GROUP_ORDER = ['skill', 'performance', 'career']

export interface SummarySkill { name: string; line: string }
export interface SummaryOutbreak { code: string; name: string; route: string; bestPct: number; tags: string[] }

export interface SummaryModel {
  name: string
  dateLabel: string
  completed: number
  correct: number
  distinctCorrect: number
  averagePct: number
  badgeCount: number
  skills: SummarySkill[]
  skillBadgeNames: string[]
  solved: SummaryOutbreak[]
  topics: string[]
  narrative: string
}

// Endless Practice and Fresh Numbers runs have ids like
// gen-<template id>-<timestamp>-<random>; count those as their template.
function baseId(id: string): string {
  const m = id.match(/^gen-(.*)-\d{10,}-\d+$/)
  return m ? m[1] : id
}

const isCorrect = (v: string) => v === 'source_identified' || v === 'source_identified_with_gaps'
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function buildSummaryModel(history: HistoryRow[], badges: BadgeStore, name: string, dateLabel: string): SummaryModel {
  const completed = history.length
  const correct = correctRunCount(history)
  const distinctCorrect = distinctCorrectOutbreaks(history)
  const scored = history.filter((h) => h.maxScore > 0)
  const averagePct = scored.length === 0 ? 0 : Math.round((scored.reduce((s, h) => s + (h.score / h.maxScore) * 100, 0) / scored.length) * 10) / 10

  const earned = ACHIEVEMENTS.filter((a) => badges[a.id]).sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
  const skills = earned.map((a) => ({ name: a.name, line: PORTFOLIO_LINES[a.id] ?? a.description }))
  const skillBadgeNames = earned.filter((a) => a.group === 'skill').map((a) => a.name)

  // Best score per solved outbreak, counting only runs that found the source.
  const best = new Map<string, number>()
  for (const h of history) {
    if (!isCorrect(h.verdict) || h.maxScore <= 0) continue
    const id = baseId(h.scenarioId)
    const pct = Math.round((h.score / h.maxScore) * 100)
    best.set(id, Math.max(best.get(id) ?? 0, pct))
  }
  const solved: SummaryOutbreak[] = []
  for (const [id, bestPct] of best) {
    const s = getScenario(id)
    if (s) solved.push({ code: s.code, name: s.name, route: ROUTE_LABEL[s.trueRoute], bestPct, tags: scenarioTags(s) })
  }
  solved.sort((a, b) => b.bestPct - a.bestPct || a.name.localeCompare(b.name))

  const topics: string[] = []
  for (const o of solved) for (const t of [o.route, ...o.tags]) if (!topics.includes(t)) topics.push(t)

  const parts: string[] = []
  parts.push(`Completed ${plural(completed, 'simulated outbreak investigation', 'simulated outbreak investigations')} in the Outbreak Investigation Simulator${correct > 0 ? `, identifying the correct source in ${correct} (${plural(distinctCorrect, 'distinct outbreak', 'distinct outbreaks')})` : ''}, with an average score of ${averagePct}%.`)
  if (skillBadgeNames.length > 0) parts.push(`Skill badges earned: ${skillBadgeNames.join(', ')}.`)
  if (topics.length > 0) parts.push(`Topics covered by the outbreaks solved: ${topics.slice(0, 14).join(', ')}.`)

  return { name: name.trim(), dateLabel, completed, correct, distinctCorrect, averagePct, badgeCount: earned.length, skills, skillBadgeNames, solved, topics, narrative: parts.join(' ') }
}

// ---- PDF text safety -------------------------------------------------------

// The PDF uses a built-in font (Helvetica), which can encode Latin-1 text but
// not other scripts or emoji. Common typographic characters are mapped to
// plain equivalents; anything else that cannot be encoded becomes '?'.
const TYPO_MAP: Record<string, string> = { '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"', '\u2013': '-', '\u2014': '-', '\u2026': '...', '\u2022': '-', '\u00A0': ' ' }

export function pdfSafe(text: string): { text: string; replaced: number } {
  let out = ''
  let replaced = 0
  for (const ch of text.replace(/[\r\n\t]+/g, ' ')) {
    if (TYPO_MAP[ch] !== undefined) { out += TYPO_MAP[ch]; continue }
    const c = ch.codePointAt(0) ?? 0
    if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255)) out += ch
    else { out += '?'; replaced++ }
  }
  return { text: out, replaced }
}

// ---- layout ----------------------------------------------------------------

export const PAGE_W = 595.28
export const PAGE_H = 841.89
export const MARGIN = 42
export const CONTENT_W = PAGE_W - 2 * MARGIN

type Rgb = [number, number, number]
export type DrawOp =
  | { kind: 'text'; text: string; x: number; y: number; size: number; bold: boolean; color: Rgb }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: Rgb }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; color: Rgb }
export type Measure = (text: string, size: number, bold: boolean) => number

const INK: Rgb = [0.11, 0.16, 0.21]
const MUTED: Rgb = [0.35, 0.4, 0.45]
const RED: Rgb = [0.48, 0.12, 0.12]
const GOLD: Rgb = [0.79, 0.64, 0.29]
const PANEL: Rgb = [0.96, 0.95, 0.92]
const WHITE: Rgb = [1, 1, 1]

export function wrapByWidth(text: string, maxWidth: number, size: number, bold: boolean, measure: Measure): string[] {
  const lines: string[] = []
  let line = ''
  for (let word of text.split(' ').filter(Boolean)) {
    while (measure(word, size, bold) > maxWidth) {
      // A single word wider than the column: break it by characters.
      let cut = word.length - 1
      while (cut > 1 && measure(word.slice(0, cut), size, bold) > maxWidth) cut--
      if (line) { lines.push(line); line = '' }
      lines.push(word.slice(0, cut))
      word = word.slice(cut)
    }
    if (!line) line = word
    else if (measure(`${line} ${word}`, size, bold) <= maxWidth) line += ` ${word}`
    else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  return lines
}

export function truncateToWidth(text: string, maxWidth: number, size: number, bold: boolean, measure: Measure): string {
  if (measure(text, size, bold) <= maxWidth) return text
  let t = text
  while (t.length > 1 && measure(`${t}...`, size, bold) > maxWidth) t = t.slice(0, -1)
  return `${t.trimEnd()}...`
}

export interface SummaryLayout { ops: DrawOp[]; replacedChars: number; hiddenOutbreaks: number; lowestY: number }

const FOOTER_BLOCK = 46

export function layoutSummary(model: SummaryModel, measure: Measure): SummaryLayout {
  const ops: DrawOp[] = []
  let replacedChars = 0
  const clean = (t: string) => { const r = pdfSafe(t); replacedChars += r.replaced; return r.text }
  const text = (t: string, x: number, y: number, size: number, bold: boolean, color: Rgb) => ops.push({ kind: 'text', text: t, x, y, size, bold, color })

  // Header band.
  ops.push({ kind: 'rect', x: 0, y: PAGE_H - 84, w: PAGE_W, h: 84, fill: RED })
  text('Field Epidemiology Skills Summary', MARGIN, PAGE_H - 40, 20, true, WHITE)
  text('Outbreak Investigation Simulator | fictional educational simulation', MARGIN, PAGE_H - 60, 9.5, false, WHITE)
  const issued = clean(`Issued ${model.dateLabel}`)
  text(issued, PAGE_W - MARGIN - measure(issued, 9.5, false), PAGE_H - 60, 9.5, false, WHITE)
  let cursor = PAGE_H - 84 - 22

  // Name.
  text('Prepared for', MARGIN, cursor - 8, 8, false, MUTED)
  text(truncateToWidth(clean(model.name || 'Name not entered'), CONTENT_W, 15, true, measure), MARGIN, cursor - 24, 15, true, INK)
  cursor -= 40

  // Headline numbers.
  const gap = 8
  const boxW = (CONTENT_W - gap * 4) / 5
  const stats: [string, string][] = [
    [String(model.completed), 'Investigations'],
    [String(model.correct), 'Correct source'],
    [String(model.distinctCorrect), 'Different outbreaks'],
    [`${model.averagePct}%`, 'Average score'],
    [String(model.badgeCount), 'Badges earned'],
  ]
  stats.forEach(([value, label], i) => {
    const x = MARGIN + i * (boxW + gap)
    ops.push({ kind: 'rect', x, y: cursor - 44, w: boxW, h: 44, fill: PANEL })
    text(value, x + (boxW - measure(value, 16, true)) / 2, cursor - 21, 16, true, RED)
    text(label, x + (boxW - measure(label, 7.5, false)) / 2, cursor - 36, 7.5, false, MUTED)
  })
  cursor -= 44 + 18

  const heading = (label: string) => {
    text(label, MARGIN, cursor - 10, 10.5, true, RED)
    ops.push({ kind: 'line', x1: MARGIN, y1: cursor - 15, x2: MARGIN + CONTENT_W, y2: cursor - 15, color: GOLD })
    cursor -= 24
  }

  // Summary paragraph.
  heading('Summary')
  const narrative = wrapByWidth(clean(model.narrative), CONTENT_W, 9, false, measure)
  const shown = narrative.slice(0, 7)
  if (narrative.length > 7) shown[6] = truncateToWidth(`${shown[6]} ${narrative[7]}`, CONTENT_W, 9, false, measure)
  shown.forEach((l, i) => text(l, MARGIN, cursor - 9 - i * 12.5, 9, false, INK))
  cursor -= shown.length * 12.5 + 10

  // Skills, in two balanced columns.
  heading('Skills demonstrated')
  if (model.skills.length === 0) {
    text('No badges earned yet. Badges are earned from decisions made in investigations.', MARGIN, cursor - 9, 9, false, MUTED)
    cursor -= 22
  } else {
    const colW = (CONTENT_W - 16) / 2
    const cols = [{ x: MARGIN, h: 0 }, { x: MARGIN + colW + 16, h: 0 }]
    for (const s of model.skills) {
      const lines = wrapByWidth(clean(s.line), colW, 8.5, false, measure)
      const itemH = 12 + lines.length * 10.5 + 5
      const col = cols[0].h <= cols[1].h ? cols[0] : cols[1]
      const top = cursor - col.h
      text(truncateToWidth(clean(s.name), colW, 9.5, true, measure), col.x, top - 9, 9.5, true, INK)
      lines.forEach((l, i) => text(l, col.x, top - 9 - 11 - i * 10.5, 8.5, false, MUTED))
      col.h += itemH
    }
    cursor -= Math.max(cols[0].h, cols[1].h) + 10
  }

  // Outbreaks solved: a table that shows as many rows as fit.
  heading('Outbreaks solved')
  let hiddenOutbreaks = 0
  if (model.solved.length === 0) {
    text('No correct-source investigations recorded yet.', MARGIN, cursor - 9, 9, false, MUTED)
    cursor -= 22
  } else {
    const rowH = 13
    const colsT = [
      { key: 'code', x: 0, w: 46, label: 'Code' },
      { key: 'name', x: 48, w: 168, label: 'Outbreak' },
      { key: 'route', x: 218, w: 78, label: 'Type' },
      { key: 'best', x: 298, w: 34, label: 'Best' },
      { key: 'topics', x: 336, w: CONTENT_W - 336, label: 'Skills and topics' },
    ]
    ops.push({ kind: 'rect', x: MARGIN, y: cursor - 14, w: CONTENT_W, h: 14, fill: PANEL })
    for (const c of colsT) text(c.label, MARGIN + c.x + 2, cursor - 10, 7.5, true, INK)
    cursor -= 16
    const floor = MARGIN + FOOTER_BLOCK
    const capacity = Math.max(0, Math.floor((cursor - floor) / rowH))
    const showAll = model.solved.length <= capacity
    const rows = showAll ? model.solved : model.solved.slice(0, Math.max(0, capacity - 1))
    rows.forEach((o, i) => {
      const y = cursor - 9 - i * rowH
      const cells: Record<string, string> = { code: o.code, name: o.name, route: o.route, best: `${o.bestPct}%`, topics: o.tags.slice(0, 3).join('; ') || '-' }
      for (const c of colsT) text(truncateToWidth(clean(cells[c.key]), c.w - 4, 8, false, measure), MARGIN + c.x + 2, y, 8, false, INK)
    })
    if (!showAll) {
      hiddenOutbreaks = model.solved.length - rows.length
      text(`+ ${hiddenOutbreaks} more outbreak${hiddenOutbreaks === 1 ? '' : 's'} solved`, MARGIN + 2, cursor - 9 - rows.length * rowH, 8, false, MUTED)
    }
    cursor -= (rows.length + (showAll ? 0 : 1)) * rowH
  }

  // Footer.
  ops.push({ kind: 'line', x1: MARGIN, y1: MARGIN + 34, x2: MARGIN + CONTENT_W, y2: MARGIN + 34, color: GOLD })
  text('Awarded within a fictional educational simulation. Not an accredited qualification. Based on activity recorded in this browser.', MARGIN, MARGIN + 22, 7, false, MUTED)
  text('built by Khan Gulrez Shagufa Fazal Ahmed', MARGIN, MARGIN + 11, 7, false, MUTED)

  return { ops, replacedChars, hiddenOutbreaks, lowestY: cursor }
}
