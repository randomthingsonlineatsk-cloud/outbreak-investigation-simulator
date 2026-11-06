import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { computeOddsRatio, computeOddsRatioCI } from './oi-engine'
import type { EpiCurveDay, FourCell, Scenario, StageKey } from './oi-types'
import { FileSearch, Scale, BookMarked, Users2, Link2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Scenario-specific cards for later batches. DecisionForm renders
// <StageExtras /> once, so new cards are added here without editing the
// form or the play tab.
// ---------------------------------------------------------------------------

export function StageExtras({ scenario, stage }: { scenario: Scenario; stage: StageKey }) {
  return (
    <>
      {stage === 'hypothesis' && scenario.caseDefRevision && <CaseDefinitionRevisionCard scenario={scenario} />}
      {stage === 'analytic' && scenario.matchedPairs && <MatchedPairsCard scenario={scenario} />}
      {stage === 'analytic' && scenario.recallBiasCheck && <RecallBiasCard scenario={scenario} />}
      {stage === 'analytic' && scenario.selectionBiasCheck && <SelectionBiasCard scenario={scenario} />}
      {stage === 'analytic' && scenario.smallSampleFlag && <PowerExplorerCard scenario={scenario} />}
    </>
  )
}

function fmtCi(ci: { lower: number; upper: number }): string {
  return `${ci.lower.toFixed(2)}–${isFinite(ci.upper) ? ci.upper.toFixed(1) : '∞'}`
}

function MiniCurve({ data, max, color, title, total }: { data: EpiCurveDay[]; max: number; color: string; title: string; total: number }) {
  const W = 260
  const H = 118
  const padL = 6
  const padB = 16
  const barW = (W - padL - 4) / data.length
  return (
    <div className="flex-1 min-w-[220px] space-y-1">
      <p className="text-xs font-mono text-field-text">{title} <span className="text-field-text-muted">({total} cases)</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded border border-field-line">
        <rect x={0} y={0} width={W} height={H} fill="#0a1015" />
        {data.map((d, i) => {
          const h = (d.cases / max) * (H - padB - 8)
          return (
            <g key={d.day}>
              <rect x={padL + i * barW + 1} y={H - padB - h} width={Math.max(barW - 2, 1)} height={h} fill={color} rx={1} />
              <text x={padL + i * barW + barW / 2} y={H - 4} fontSize={8} fontFamily="monospace" fill="#9aa5b8" textAnchor="middle">{d.day}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function CaseDefinitionRevisionCard({ scenario }: { scenario: Scenario }) {
  const rev = scenario.caseDefRevision
  if (!rev) return null
  const max = Math.max(...scenario.epiCurve.map((d) => d.cases), ...rev.revisedCurve.map((d) => d.cases), 1)
  return (
    <Card className="bg-field-panel/80 border-field-line glow-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><FileSearch className="size-4" />Case Definition, Version 1 vs Version 2</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">The same days, counted under the initial definition and under a revised one. Both use the same vertical scale.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <MiniCurve data={scenario.epiCurve} max={max} color="#9aa5b8" title="Version 1 (initial)" total={rev.initialCount} />
          <MiniCurve data={rev.revisedCurve} max={max} color="#e5493c" title="Version 2 (revised)" total={rev.revisedCount} />
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-field-text"><span className="font-mono text-field-text-muted uppercase">Version 1: </span>{rev.initialDefinition}</p>
          <p className="rounded border border-field-gold bg-field-gold-soft p-2.5 text-field-text"><span className="font-mono text-field-text-muted uppercase">What the interviews showed: </span>{rev.reviewFinding}</p>
          <p className="text-field-text"><span className="font-mono text-field-text-muted uppercase">Proposed version 2: </span>{rev.revisedDefinition}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Matched odds ratio from discordant pairs: caseOnly / controlOnly, with an
// approximate 95% CI on the log scale, SE = sqrt(1/caseOnly + 1/controlOnly).
function matchedOddsRatio(caseOnly: number, controlOnly: number): { or: number; lower: number; upper: number } {
  if (caseOnly === 0 || controlOnly === 0) {
    const or = controlOnly === 0 ? (caseOnly === 0 ? NaN : Infinity) : 0
    return { or, lower: NaN, upper: NaN }
  }
  const or = caseOnly / controlOnly
  const se = Math.sqrt(1 / caseOnly + 1 / controlOnly)
  return { or, lower: Math.exp(Math.log(or) - 1.96 * se), upper: Math.exp(Math.log(or) + 1.96 * se) }
}

function fmtNum(x: number, digits: number): string {
  if (Number.isNaN(x)) return '—'
  return isFinite(x) ? x.toFixed(digits) : '∞'
}

function MatchedPairsCard({ scenario }: { scenario: Scenario }) {
  const mp = scenario.matchedPairs
  if (!mp) return null
  return (
    <Card className="bg-field-panel/80 border-field-line glow-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><Link2 className="size-4" />Matched Pairs: {mp.pairs} cases, each with one control matched on {mp.matchedOn}</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Each row counts pairs, not people. Only the two discordant columns (case only, control only) enter the matched odds ratio. The last column shows what an ordinary 2×2 table would give if the pairing were ignored.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Exposure</th>
                <th className="text-right py-1.5 px-1.5">Both</th>
                <th className="text-right py-1.5 px-1.5 text-field-gold">Case only</th>
                <th className="text-right py-1.5 px-1.5 text-field-gold">Control only</th>
                <th className="text-right py-1.5 px-1.5">Neither</th>
                <th className="text-right py-1.5 px-1.5">Matched OR</th>
                <th className="text-right py-1.5 px-1.5">95% CI</th>
                <th className="text-right py-1.5 pl-1.5">Crude OR</th>
              </tr>
            </thead>
            <tbody>
              {mp.rows.map((r) => {
                const m = matchedOddsRatio(r.caseOnly, r.controlOnly)
                const crudeRow = scenario.exposures.find((e) => e.exposure === r.exposure)
                const crude = crudeRow ? computeOddsRatio(crudeRow) : NaN
                return (
                  <tr key={r.exposure} className="border-b border-field-line/50">
                    <td className="py-1.5 pr-2 text-field-text">{r.exposure}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{r.bothExposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-gold">{r.caseOnly}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-gold">{r.controlOnly}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{r.neither}</td>
                    <td className={`text-right py-1.5 px-1.5 font-bold ${m.or >= 5 ? 'text-field-red' : m.or >= 2 ? 'text-field-gold' : 'text-field-text-muted'}`}>{fmtNum(m.or, 2)}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{fmtNum(m.lower, 2)}–{fmtNum(m.upper, 1)}</td>
                    <td className="text-right py-1.5 pl-1.5 text-field-text-muted">{fmtNum(crude, 2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-field-text-muted">Matched OR = case-only pairs ÷ control-only pairs. The interval is an approximate 95% CI on the log scale. Crude OR pools all cases and all controls and ignores the pairing.</p>
      </CardContent>
    </Card>
  )
}

// One row of a "same exposure, different data source" comparison table.
function ComparisonRow({ label, cells, highlight }: { label: string; cells: FourCell; highlight?: boolean }) {
  const ci = computeOddsRatioCI(cells)
  return (
    <tr className={`border-b border-field-line/50 ${highlight ? 'bg-field-violet-soft' : ''}`}>
      <td className="py-1.5 pr-2 text-field-text">{label}</td>
      <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cells.casesExposed}/{cells.casesUnexposed}</td>
      <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cells.controlsExposed}/{cells.controlsUnexposed}</td>
      <td className={`text-right py-1.5 px-1.5 font-bold ${ci.or >= 5 ? 'text-field-red' : ci.or >= 2 ? 'text-field-gold' : 'text-field-text-muted'}`}>{ci.or.toFixed(2)}</td>
      <td className="text-right py-1.5 pl-1.5 text-field-text-muted">{fmtCi(ci)}</td>
    </tr>
  )
}

function RecallBiasCard({ scenario }: { scenario: Scenario }) {
  const check = scenario.recallBiasCheck
  const selfRow = check ? scenario.exposures.find((e) => e.exposure === check.exposureLabel) : undefined
  if (!check || !selfRow) return null
  const selfOr = computeOddsRatio(selfRow)
  const verifiedOr = computeOddsRatio(check.verified)
  return (
    <Card className="bg-field-panel/80 border-field-line glow-gold">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><BookMarked className="size-4" />Memory vs Records: "{check.exposureLabel}"</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">The same exposure, measured two ways. Ill people often search their memories for an explanation, and well people have no reason to, which can inflate a self-reported association.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Source</th>
                <th className="text-right py-1.5 px-1.5">Cases exp./unexp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls exp./unexp.</th>
                <th className="text-right py-1.5 px-1.5">OR</th>
                <th className="text-right py-1.5 pl-1.5">95% CI</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow label="Self-reported in interview" cells={selfRow} />
              <ComparisonRow label={`Records (${check.recordSource})`} cells={check.verified} highlight />
            </tbody>
          </table>
        </div>
        <p className="text-sm text-field-text">The odds ratio falls from <span className="font-mono font-bold text-field-gold">{selfOr.toFixed(1)}</span> when people are asked to remember, to <span className="font-mono font-bold text-field-gold">{verifiedOr.toFixed(1)}</span> when the records are used. The difference is the signature of recall bias, not of a true exposure effect.</p>
      </CardContent>
    </Card>
  )
}

function SelectionBiasCard({ scenario }: { scenario: Scenario }) {
  const check = scenario.selectionBiasCheck
  const row = check ? scenario.exposures.find((e) => e.exposure === check.exposureLabel) : undefined
  if (!check || !row) return null
  return (
    <Card className="bg-field-panel/80 border-field-line glow-violet">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Users2 className="size-4" />Same Cases, Different Controls: "{check.exposureLabel}"</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">The odds ratio depends on who the comparison group is. Here is what the same cases would have shown against controls from three different sources.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Control source</th>
                <th className="text-right py-1.5 px-1.5">Cases exp./unexp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls exp./unexp.</th>
                <th className="text-right py-1.5 px-1.5">OR</th>
                <th className="text-right py-1.5 pl-1.5">95% CI</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow label={check.recommendedLabel} cells={row} highlight />
              {check.alternatives.map((alt) => (
                <ComparisonRow key={alt.label} label={alt.label} cells={{ casesExposed: row.casesExposed, casesUnexposed: row.casesUnexposed, controlsExposed: alt.controlsExposed, controlsUnexposed: alt.controlsUnexposed }} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-1.5">
          {check.alternatives.map((alt) => (
            <p key={alt.label} className="text-xs text-field-text"><span className="font-mono text-field-text-muted uppercase">{alt.label}: </span>{alt.note}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Cases needed for an unmatched case-control study (Fleiss formula), with
// two-sided alpha 0.05 (z = 1.96) and 80% power (z = 0.84). p0 is the
// exposure prevalence among controls; r is controls per case.
function casesNeeded(or: number, p0: number, r: number): number | null {
  if (!(or > 0) || or === 1 || !(p0 > 0 && p0 < 1) || !(r > 0)) return null
  const p1 = (or * p0) / (1 + p0 * (or - 1))
  const pbar = (p1 + r * p0) / (1 + r)
  const qbar = 1 - pbar
  const num = 1.96 * Math.sqrt((1 + 1 / r) * pbar * qbar) + 0.84 * Math.sqrt(p1 * (1 - p1) + (p0 * (1 - p0)) / r)
  const n = (num * num) / ((p1 - p0) * (p1 - p0))
  return isFinite(n) ? Math.ceil(n) : null
}

function PowerExplorerCard({ scenario }: { scenario: Scenario }) {
  const rows = scenario.exposures
  const ors = rows.map(computeOddsRatio)
  const row = rows[ors.indexOf(Math.max(...ors))]
  const nCases = row.casesExposed + row.casesUnexposed
  const nControls = row.controlsExposed + row.controlsUnexposed
  const currentRatio = nControls / nCases
  const observed = computeOddsRatioCI(row)

  const sweep = [1, 2, 3, 4].map((k) => {
    const f = k / currentRatio
    const ci = computeOddsRatioCI({ casesExposed: row.casesExposed, casesUnexposed: row.casesUnexposed, controlsExposed: row.controlsExposed * f, controlsUnexposed: row.controlsUnexposed * f })
    return { k, controls: Math.round(nCases * k), ci, current: Math.abs(k - currentRatio) < 0.01 }
  })

  const [targetOr, setTargetOr] = useState(String(Math.round(observed.or * 10) / 10))
  const [p0Pct, setP0Pct] = useState(String(Math.round((100 * row.controlsExposed) / nControls)))
  const [ratio, setRatio] = useState(2)
  const needed = casesNeeded(Number(targetOr), Number(p0Pct) / 100, ratio)

  return (
    <Card className="bg-field-panel/80 border-field-line glow-violet">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Scale className="size-4" />Sample Size and Power</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">For the leading exposure, "{row.exposure}", this study has {nCases} cases and {nControls} controls. Here is how much a bigger comparison group would tighten the interval, and how many cases it takes to detect an effect reliably.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Controls per case</th>
                <th className="text-right py-1.5 px-1.5">Controls</th>
                <th className="text-right py-1.5 px-1.5">OR</th>
                <th className="text-right py-1.5 px-1.5">95% CI</th>
                <th className="text-center py-1.5 pl-1.5">Sig.?</th>
              </tr>
            </thead>
            <tbody>
              {sweep.map((s) => (
                <tr key={s.k} className={`border-b border-field-line/50 ${s.current ? 'bg-field-violet-soft' : ''}`}>
                  <td className="py-1.5 pr-2 text-field-text">{s.k}:1{s.current && <span className="text-field-violet"> (this study)</span>}</td>
                  <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.controls}</td>
                  <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.ci.or.toFixed(2)}</td>
                  <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.ci.lower.toFixed(2)}–{s.ci.upper.toFixed(1)}</td>
                  <td className="text-center py-1.5 pl-1.5">{s.ci.significant ? <span className="text-field-emerald">✓</span> : <span className="text-field-text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] font-mono text-field-text-muted mt-1.5">Illustrative: assumes the extra controls would be exposed at the same rate as the ones actually interviewed. The number of cases stays at {nCases}, which is why the interval narrows only so far.</p>
        </div>

        <div className="rounded border border-field-line p-3 space-y-2">
          <p className="font-mono text-xs text-field-violet uppercase">Cases needed for 80% power</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-mono text-field-text-muted space-y-1">Odds ratio to detect
              <Input value={targetOr} onChange={(e) => setTargetOr(e.target.value.replace(/[^0-9.]/g, ''))} className="bg-field-panel-strong border-field-line text-field-text" />
            </label>
            <label className="text-[11px] font-mono text-field-text-muted space-y-1">Controls exposed (%)
              <Input value={p0Pct} onChange={(e) => setP0Pct(e.target.value.replace(/[^0-9.]/g, ''))} className="bg-field-panel-strong border-field-line text-field-text" />
            </label>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-[11px] font-mono text-field-text-muted mr-1">Controls per case:</span>
            {[1, 2, 3, 4].map((k) => (
              <Button key={k} onClick={() => setRatio(k)} size="sm" variant="outline" className={`border-2 font-mono text-xs px-3 ${ratio === k ? 'border-field-violet text-field-violet bg-field-violet-soft' : 'border-field-line text-field-text-muted'}`}>{k}</Button>
            ))}
          </div>
          {needed === null ? (
            <p className="text-xs font-mono text-field-gold">Enter an odds ratio other than 1 and an exposure percentage between 0 and 100.</p>
          ) : (
            <p className="text-sm text-field-text">About <span className="font-mono font-bold text-field-violet">{needed}</span> cases would be needed, compared with the {nCases} interviewed here{needed > nCases ? ', so this study is underpowered for that effect.' : ', so this study is large enough for that effect.'}</p>
          )}
          <p className="text-[10px] font-mono text-field-text-muted">Unmatched case-control formula, two-sided alpha 0.05, 80% power. A planning estimate, not a substitute for a statistician.</p>
        </div>
      </CardContent>
    </Card>
  )
}
