import { computeOddsRatio } from './oi-engine'
import type { EpiCurveDay, ExposureRow, Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Fresh numbers (#46). Re-rolls the numbers a player reads (the epidemic
// curve and the case-control exposure table) while keeping the scenario's
// story and lesson intact.
//
// What changes:
//  - the daily counts on the epi curve (the total is preserved exactly, so
//    the reported case count and anything derived from it stay correct)
//  - the exposed/unexposed split in each case-control row (each row keeps
//    its number of cases and controls)
//
// What never changes: reported cases, population at risk, the narrative and
// setting text (which cite those numbers), and every linked card (cohort,
// dose-response, spot map, person breakdown, contact network, and so on).
// The one exception is the exposure row a stratified analysis is built on,
// which is frozen so the crude and stratified odds ratios keep agreeing.
//
// Invariants, enforced by retrying until they hold (or falling back to the
// original numbers):
//  - the curve keeps the same peak day and the same set of local peaks, so
//    a point-source, propagated, or continuous curve is still recognisable
//  - the leading exposure stays the leading exposure, keeps at least 80% of
//    its original margin over the runner-up, and stays within 0.6x to 1.7x
//    of its original odds ratio
//  - any exposure that was clearly protective or clearly risky keeps its
//    direction
//
// Scenarios whose lesson depends on hand-tuned relationships between tables
// (artifact, two clusters, revised definition, small sample, recall bias,
// control selection, matched pairs) are not randomizable and are returned
// unchanged.
// ---------------------------------------------------------------------------

type Rng = () => number

export function isRandomizable(s: Scenario): boolean {
  return !(s.possibleArtifact || s.twoClustersFlag || s.caseDefRevision || s.smallSampleFlag || s.recallBiasCheck || s.selectionBiasCheck || s.matchedPairs)
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const argmax = (a: number[]) => a.indexOf(Math.max(...a))

// Strict local maxima; the ends count as neighbours of -1.
export function curvePeaks(c: number[]): number[] {
  const out: number[] = []
  for (let i = 0; i < c.length; i++) {
    const l = i > 0 ? c[i - 1] : -1
    const r = i < c.length - 1 ? c[i + 1] : -1
    if (c[i] > l && c[i] > r) out.push(i)
  }
  return out
}

const sameList = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

export function jitterCurve(curve: EpiCurveDay[], rng: Rng): EpiCurveDay[] {
  const orig = curve.map((d) => d.cases)
  const total = sum(orig)
  const positive = orig.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0)
  if (positive.length < 2) return curve
  for (let attempt = 0; attempt < 80; attempt++) {
    const next = orig.map((v) => (v > 0 ? Math.max(1, Math.round(v * (0.85 + 0.3 * rng()))) : 0))
    let diff = total - sum(next)
    let guard = 0
    while (diff !== 0 && guard++ < 500) {
      const i = positive[Math.floor(rng() * positive.length)]
      if (diff > 0) { next[i]++; diff-- } else if (next[i] > 1) { next[i]--; diff++ }
    }
    if (diff !== 0) continue
    if (argmax(next) === argmax(orig) && sameList(curvePeaks(next), curvePeaks(orig))) {
      return curve.map((d, i) => ({ day: d.day, cases: next[i] }))
    }
  }
  return curve
}

function jitterRow(r: ExposureRow, rng: Rng): ExposureRow {
  const nCases = r.casesExposed + r.casesUnexposed
  const nControls = r.controlsExposed + r.controlsUnexposed
  const cells = [r.casesExposed, r.casesUnexposed, r.controlsExposed, r.controlsUnexposed]
  if (nCases < 3 || nControls < 3 || cells.some((v) => v < 1)) return r
  const dc = Math.round((rng() * 2 - 1) * Math.max(2, 0.12 * nCases))
  const dk = Math.round((rng() * 2 - 1) * Math.max(2, 0.12 * nControls))
  const casesExposed = clamp(r.casesExposed + dc, 1, nCases - 1)
  const controlsExposed = clamp(r.controlsExposed + dk, 1, nControls - 1)
  return { exposure: r.exposure, casesExposed, casesUnexposed: nCases - casesExposed, controlsExposed, controlsUnexposed: nControls - controlsExposed }
}

function exposuresValid(orig: ExposureRow[], next: ExposureRow[]): boolean {
  const o0 = orig.map(computeOddsRatio)
  const o1 = next.map(computeOddsRatio)
  if (o1.some((x) => !isFinite(x) || Number.isNaN(x))) return false
  const i0 = argmax(o0)
  const i1 = argmax(o1)
  if (i0 !== i1) return false
  const margin = (a: number[], i: number) => a[i] / Math.max(...a.filter((_, k) => k !== i))
  if (margin(o1, i1) < 0.8 * margin(o0, i0)) return false
  const ratio = o1[i1] / o0[i0]
  if (ratio < 0.6 || ratio > 1.7) return false
  for (let k = 0; k < o0.length; k++) {
    if (Math.abs(o0[k] - 1) > 0.15 && (o0[k] - 1) * (o1[k] - 1) < 0) return false
  }
  return true
}

export function jitterExposures(rows: ExposureRow[], frozen: Set<string>, rng: Rng): ExposureRow[] {
  const o0 = rows.map(computeOddsRatio)
  if (rows.length < 2 || o0.some((x) => !isFinite(x) || Number.isNaN(x))) return rows
  for (let attempt = 0; attempt < 100; attempt++) {
    const next = rows.map((r) => (frozen.has(r.exposure) ? r : jitterRow(r, rng)))
    if (exposuresValid(rows, next)) return next
  }
  return rows
}

export function randomizeScenario(s: Scenario, rng: Rng = Math.random): Scenario {
  if (!isRandomizable(s)) return s
  const frozen = new Set<string>()
  if (s.stratifiedAnalysis) frozen.add(s.stratifiedAnalysis.exposureLabel)
  return { ...s, epiCurve: jitterCurve(s.epiCurve, rng), exposures: jitterExposures(s.exposures, frozen, rng) }
}

// A randomized copy for use as a run. It gets a gen- id, so everywhere the
// app already treats Endless Practice runs as practice (per-outbreak boards,
// the weekly board, the department view, career badges) it treats this the
// same way, with no special cases.
export function freshNumbersScenario(s: Scenario, rng: Rng = Math.random): Scenario {
  if (!isRandomizable(s)) return s
  const r = randomizeScenario(s, rng)
  return { ...r, id: `gen-${s.id}-${Date.now()}-${Math.floor(rng() * 100000)}` }
}
