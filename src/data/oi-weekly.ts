import { SCENARIOS } from './oi-scenarios'
import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// "Outbreak of the Week": everyone gets the same scenario for a calendar
// week, so scores are directly comparable. Pure logic, no React, so it can
// be tested on its own.
//
//  - A week runs Monday 00:00 UTC to the next Monday 00:00 UTC, the same
//    instant for every player worldwide.
//  - The scenario for a week comes from a fixed, seeded shuffle of the
//    scenario list, cycled by week number. That gives no repeats within any
//    run of SCENARIOS.length consecutive weeks, and the same answer for
//    every player without needing a server.
//  - Adding scenarios changes the shuffle, so a release that adds scenarios
//    can change the current week's pick. Weekly results are matched by
//    scenario id, so nothing is lost; the board for the new pick just starts
//    empty.
// ---------------------------------------------------------------------------

export const DAY_MS = 86_400_000
export const WEEK_MS = 7 * DAY_MS
const EPOCH_MONDAY_MS = Date.UTC(1970, 0, 5) // 5 Jan 1970 was a Monday
const SHUFFLE_SEED = 20260928

// Start of the UTC week (Monday 00:00) containing nowMs.
export function weekStartMs(nowMs: number): number {
  const d = new Date(nowMs)
  const daysSinceMonday = (d.getUTCDay() + 6) % 7
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday)
}

export function weekIndexOf(startMs: number): number {
  return Math.round((startMs - EPOCH_MONDAY_MS) / WEEK_MS)
}

// mulberry32: a tiny deterministic PRNG.
function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function weeklyOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  const rand = mulberry32(SHUFFLE_SEED)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export function scenarioForWeek(weekIndex: number, pool: Scenario[] = SCENARIOS): Scenario {
  const order = weeklyOrder(pool.length)
  const slot = ((weekIndex % pool.length) + pool.length) % pool.length
  return pool[order[slot]]
}

export interface WeekInfo {
  startMs: number
  endMs: number
  index: number
  scenario: Scenario
  previous: Scenario
}

export function weekInfoAt(nowMs: number): WeekInfo {
  const startMs = weekStartMs(nowMs)
  const index = weekIndexOf(startMs)
  return { startMs, endMs: startMs + WEEK_MS, index, scenario: scenarioForWeek(index), previous: scenarioForWeek(index - 1) }
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'a new outbreak is starting'
  const days = Math.floor(ms / DAY_MS)
  const hours = Math.floor((ms % DAY_MS) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}
