import type { Choices, FinalReport, Scenario } from './oi-types'
import { countHints } from './oi-hints'
import { NPC_DECISION_IDS } from './oi-npc'

// ---------------------------------------------------------------------------
// Skill-based achievements. Every badge is earned from what you actually
// decided in a finished investigation (or, for the two career badges, from
// your run history), never from grinding or from time spent.
//
// Evaluation is pure: give it the finished run and it returns the ids of the
// badges that run earns. Persistence is separate (loadBadges / recordEarned)
// and idempotent: a badge stores when it was first earned, nothing that
// counts up, so re-viewing a report can never inflate anything.
// ---------------------------------------------------------------------------

export interface Achievement { id: string; name: string; description: string; group: 'performance' | 'skill' | 'career' }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'textbook', name: 'Textbook Investigation', group: 'performance', description: 'Full marks: every decision the best answer, with no hints used.' },
  { id: 'unassisted', name: 'Unassisted', group: 'performance', description: 'Identify the correct source without using a single hint.' },
  { id: 'expert_mode', name: 'Expert Investigator', group: 'performance', description: 'Identify the correct source on Expert difficulty, where the reasoning behind each option stays hidden until you choose.' },
  { id: 'second_look', name: 'Second Look', group: 'performance', description: 'Use "Investigate further" after an inconclusive result and still finish with the correct source.' },
  { id: 'peer_reviewed', name: 'Peer Reviewed', group: 'performance', description: 'Request the senior review meeting, then lock in analytic decisions that are all the best answer.' },
  { id: 'quick_response', name: 'Quick Response', group: 'performance', description: 'With time pressure on, identify the correct source in under 10 minutes.' },
  { id: 'skeptic', name: 'Skeptic', group: 'skill', description: 'Handle a misleading signal correctly: a lone anomalous lab result, a possible deliberate release, or a surveillance artifact with no real vehicle.' },
  { id: 'bias_buster', name: 'Bias Buster', group: 'skill', description: 'Handle a bias problem correctly: recall bias, control selection, or a matched-pairs analysis.' },
  { id: 'statistician', name: 'Statistician', group: 'skill', description: 'Handle a statistics problem correctly: an underpowered wide interval, or a case definition that needs revising.' },
  { id: 'big_picture', name: 'Big Picture Thinker', group: 'skill', description: 'Frame the problem correctly: split two clusters, recognize a non-infectious occupational cause, or find the index case.' },
  { id: 'cross_discipline', name: 'Cross-Discipline', group: 'skill', description: 'Apply another discipline correctly: pharmacovigilance causality assessment, or manufacturing lot traceback.' },
  { id: 'communicator', name: 'Clear Communicator', group: 'skill', description: 'Get both the public statement approach and its tone right.' },
  { id: 'people_skills', name: 'People Skills', group: 'skill', description: 'Handle all three difficult conversations the best way: the reluctant case, the defensive site manager, and the persistent reporter.' },
  { id: 'veteran', name: 'Field Veteran', group: 'career', description: 'Identify the correct source in 5 investigations, across all your runs.' },
  { id: 'range', name: 'Broad Experience', group: 'career', description: 'Identify the correct source in 10 different outbreaks.' },
]

export const VETERAN_TARGET = 5
export const RANGE_TARGET = 10
export const QUICK_RESPONSE_MS = 10 * 60 * 1000

export interface HistoryLike { scenarioId: string; verdict: string }

export interface RunContext {
  scenario: Scenario
  report: FinalReport
  choices: Choices
  difficulty: 'guided' | 'expert'
  meetingTaken: boolean
  revisionUsed: boolean
  elapsedMs: number | null
  history: HistoryLike[]
}

function isCorrectSource(verdict: string): boolean {
  return verdict === 'source_identified' || verdict === 'source_identified_with_gaps'
}

// Endless Practice and Fresh Numbers runs have ids like
// gen-<template id>-<timestamp>-<random>; count those as their template.
function baseScenarioId(id: string): string {
  const m = id.match(/^gen-(.*)-\d{10,}-\d+$/)
  return m ? m[1] : id
}

export function correctRunCount(history: HistoryLike[]): number {
  return history.filter((h) => isCorrectSource(h.verdict)).length
}

export function distinctCorrectOutbreaks(history: HistoryLike[]): number {
  return new Set(history.filter((h) => isCorrectSource(h.verdict)).map((h) => baseScenarioId(h.scenarioId))).size
}

export function evaluateAchievements(ctx: RunContext): string[] {
  const { scenario, report, choices, difficulty, meetingTaken, revisionUsed, elapsedMs, history } = ctx
  const best = (id: string) => report.grades.some((g) => g.decisionId === id && g.verdict === 'best')
  const anyBest = (ids: string[]) => ids.some(best)
  const correct = isCorrectSource(report.verdict)
  const hints = countHints(choices)
  const analytic = report.grades.filter((g) => g.stage === 'analytic')
  const earned: string[] = []

  if (report.verdict === 'source_identified' && report.score === report.maxScore) earned.push('textbook')
  if (correct && hints === 0) earned.push('unassisted')
  if (correct && difficulty === 'expert') earned.push('expert_mode')
  if (correct && revisionUsed) earned.push('second_look')
  if (meetingTaken && analytic.length > 0 && analytic.every((g) => g.verdict === 'best')) earned.push('peer_reviewed')
  if (elapsedMs !== null && correct && elapsedMs < QUICK_RESPONSE_MS) earned.push('quick_response')

  if (anyBest(['lab_result_interpretation', 'assess_deliberate_release']) || (scenario.possibleArtifact && best('identify_vehicle'))) earned.push('skeptic')
  if (anyBest(['address_recall_bias', 'choose_control_source', 'analyze_matched_data'])) earned.push('bias_buster')
  if (anyBest(['interpret_wide_interval', 'revise_case_definition'])) earned.push('statistician')
  if (anyBest(['cluster_splitting', 'infectious_vs_occupational', 'identify_index_case'])) earned.push('big_picture')
  if (anyBest(['causality_assessment', 'lot_traceback'])) earned.push('cross_discipline')
  if (best('draft_approach') && best('tone_choice')) earned.push('communicator')
  if (NPC_DECISION_IDS.every(best)) earned.push('people_skills')

  if (correctRunCount(history) >= VETERAN_TARGET) earned.push('veteran')
  if (distinctCorrectOutbreaks(history) >= RANGE_TARGET) earned.push('range')
  return earned
}

// ---- persistence -----------------------------------------------------------

const BADGES_KEY = 'oi_badges_v1'
export type BadgeStore = Record<string, { ts: number; scenarioName: string }>

export function loadBadges(): BadgeStore {
  try {
    const raw = localStorage.getItem(BADGES_KEY)
    return raw ? (JSON.parse(raw) as BadgeStore) : {}
  } catch {
    return {}
  }
}

export function recordEarned(earnedIds: string[], scenarioName: string): { newlyEarned: string[]; store: BadgeStore } {
  const store = loadBadges()
  const newlyEarned: string[] = []
  for (const id of earnedIds) {
    if (!store[id]) {
      store[id] = { ts: Date.now(), scenarioName }
      newlyEarned.push(id)
    }
  }
  try {
    if (newlyEarned.length > 0) localStorage.setItem(BADGES_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
  return { newlyEarned, store }
}
