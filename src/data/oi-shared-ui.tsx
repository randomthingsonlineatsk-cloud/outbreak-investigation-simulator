import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { computeOddsRatio, computeOddsRatioCI, computeRelativeRisk } from './oi-engine'
import type { CaseCountByDefinition, CohortComparison, ContactNetwork, DoseResponseLevel, EpiCurveDay, ExposureRow, Grade, PersonBreakdown, SpotMap, StratifiedAnalysis } from './oi-types'
import { Activity, CheckCircle2, CircleAlert, CircleSlash, Download, GitBranch, Layers, LineChart, MapPin, TrendingUp, Table2, Users, Users2, SlidersHorizontal } from 'lucide-react'

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon?: typeof Activity; children: React.ReactNode }) {
  return (
    <Button onClick={onClick} variant="outline" size="sm" className={`border-2 font-mono text-xs gap-1.5 ${active ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}>
      {Icon && <Icon className="size-3.5" />}
      {children}
    </Button>
  )
}

export function GradeRow({ grade }: { grade: Grade }) {
  const tone = grade.verdict === 'best' ? { border: 'border-field-emerald', bg: 'bg-field-emerald-soft', text: 'text-field-emerald', label: 'Sound reasoning', Icon: CheckCircle2 }
    : grade.verdict === 'acceptable' ? { border: 'border-field-gold', bg: 'bg-field-gold-soft', text: 'text-field-gold', label: 'Defensible', Icon: CircleAlert }
    : { border: 'border-field-red', bg: 'bg-field-red-soft', text: 'text-field-red', label: 'Investigative error', Icon: CircleSlash }
  return (
    <div className={`rounded-lg border ${tone.border} ${tone.bg} p-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-field-text">{grade.title}</span>
        <span className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${tone.text}`}><tone.Icon className="size-3" />{tone.label} · {grade.points}/{grade.maxPoints}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-field-text-muted">You chose: {grade.chosenLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-field-text">{grade.explanation}</p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-field-text-muted/70">{grade.reference}</p>
    </div>
  )
}

export function CaseDefinitionSensitivityCard({ counts }: { counts: CaseCountByDefinition[] }) {
  const maxCount = Math.max(...counts.map((c) => c.count))
  return (
    <Card className="bg-field-panel/80 border-field-line glow-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><SlidersHorizontal className="size-4" />Same Population, Three Case Counts</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">The exact same outbreak, counted three different ways depending on how strict the case definition is. This is the sensitivity/specificity trade-off made concrete.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {counts.map((c) => {
          const widthPct = (c.count / maxCount) * 100
          return (
            <div key={c.label} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-field-text">{c.label}</span>
                <span className="text-field-teal font-bold">{c.count}</span>
              </div>
              <div className="h-2 rounded-full bg-field-panel-strong overflow-hidden">
                <div className="h-full bg-gradient-to-r from-field-teal/60 to-field-teal" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function SpotMapCard({ spotMap }: { spotMap: SpotMap }) {
  const [selected, setSelected] = useState<string | null>(null)
  const W = 560
  const H = 260
  const maxRate = Math.max(...spotMap.locations.map((l) => l.caseCount / l.totalPeople))
  function colorFor(rate: number) {
    const t = maxRate > 0 ? rate / maxRate : 0
    // interpolate from teal (low) to red (high)
    const r = Math.round(56 + t * (229 - 56))
    const g = Math.round(192 + t * (73 - 192))
    const b = Math.round(224 + t * (60 - 224))
    return `rgb(${r},${g},${b})`
  }
  const selectedLoc = spotMap.locations.find((l) => l.label === selected)
  return (
    <Card className="bg-field-panel/80 border-field-line glow-red">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-red flex items-center gap-2"><MapPin className="size-4" />Spot Map — Attack Rate by Location</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Completing the person/place/time triad: place. Darker red means a higher attack rate at that location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded border border-field-line">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
            <rect x={0} y={0} width={W} height={H} fill="#0a1015" />
            {spotMap.locations.map((loc) => {
              const rate = loc.caseCount / loc.totalPeople
              return (
                <g key={loc.label} onClick={() => setSelected(loc.label)} style={{ cursor: 'pointer' }}>
                  <circle cx={loc.x} cy={loc.y} r={26} fill={colorFor(rate)} stroke={selected === loc.label ? '#eef2f7' : '#22303a'} strokeWidth={selected === loc.label ? 2.5 : 1} />
                  <text x={loc.x} y={loc.y + 4} fontSize={11} fontFamily="monospace" fill="#0a1015" textAnchor="middle" fontWeight="bold">{loc.caseCount}/{loc.totalPeople}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <p className="text-xs font-mono text-field-text-muted">Click a location to see its detail. {spotMap.note}</p>
        {selectedLoc && (
          <div className="rounded border border-field-red bg-field-red-soft p-2.5">
            <p className="font-mono font-bold text-sm text-field-red">{selectedLoc.label}</p>
            <p className="text-xs text-field-text mt-1">{selectedLoc.caseCount} of {selectedLoc.totalPeople} people here became ill ({((selectedLoc.caseCount / selectedLoc.totalPeople) * 100).toFixed(0)}% attack rate).</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PersonBreakdownCard({ breakdown }: { breakdown: PersonBreakdown }) {
  const maxRate = Math.max(...breakdown.groups.map((g) => (g.ill / g.total) * 100))
  return (
    <Card className="bg-field-panel/80 border-field-line glow-gold">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><Users className="size-4" />Attack Rate by {breakdown.dimensionLabel}</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Completing the person/place/time triad: person. Together with the epi curve (time) and spot map (place), this is the full descriptive-epidemiology picture.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.groups.map((g) => {
          const rate = (g.ill / g.total) * 100
          const widthPct = maxRate > 0 ? (rate / maxRate) * 100 : 0
          return (
            <div key={g.label} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-field-text">{g.label}</span>
                <span className="text-field-gold font-bold">{rate.toFixed(0)}% ({g.ill}/{g.total})</span>
              </div>
              <div className="h-2 rounded-full bg-field-panel-strong overflow-hidden">
                <div className="h-full bg-gradient-to-r from-field-gold/60 to-field-gold" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function EpiCurveChart({ data, incubationHoursMin, incubationHoursMax }: { data: EpiCurveDay[]; incubationHoursMin?: number; incubationHoursMax?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.cases), 1)
  const W = 560
  const H = 180
  const padL = 28
  const padB = 22
  const barW = (W - padL - 10) / data.length

  function downloadImage() {
    if (!svgRef.current) return
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const source = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([source], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'epi-curve.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedEntry = data.find((d) => d.day === selectedDay)
  const exposureWindow = selectedEntry && incubationHoursMin !== undefined && incubationHoursMax !== undefined
    ? { earliest: selectedEntry.day - incubationHoursMax / 24, latest: selectedEntry.day - incubationHoursMin / 24 }
    : null

  return (
    <Card className="bg-field-panel/80 border-field-line glow-red">
      <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-red flex items-center gap-2"><LineChart className="size-4" />Epidemic Curve — Cases by Day</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded border border-field-line">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
            <rect x={0} y={0} width={W} height={H} fill="#0a1015" />
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} x1={padL} x2={W - 5} y1={H - padB - (H - padB - 10) * f} y2={H - padB - (H - padB - 10) * f} stroke="#22303a" strokeWidth={1} />
            ))}
            {data.map((d, i) => {
              const h = (d.cases / max) * (H - padB - 10)
              const x = padL + i * barW + 2
              const y = H - padB - h
              return <rect key={d.day} x={x} y={y} width={Math.max(barW - 4, 2)} height={h} fill={selectedDay === d.day ? '#f0a838' : '#e5493c'} rx={1} style={{ cursor: 'pointer' }} onClick={() => setSelectedDay(selectedDay === d.day ? null : d.day)} />
            })}
            {data.map((d, i) => (
              i % Math.ceil(data.length / 10) === 0 ? <text key={`t-${d.day}`} x={padL + i * barW + barW / 2} y={H - 6} fontSize={8} fontFamily="monospace" fill="#9aa5b8" textAnchor="middle">{d.day}</text> : null
            ))}
            <text x={4} y={14} fontSize={8} fontFamily="monospace" fill="#9aa5b8">{max}</text>
            <text x={4} y={H - padB} fontSize={8} fontFamily="monospace" fill="#9aa5b8">0</text>
          </svg>
        </div>
        <p className="text-xs font-mono text-field-text-muted">X-axis: day since first case. Y-axis: new cases reported that day. Click a bar to back-calculate its likely exposure window.</p>
        {selectedEntry && exposureWindow && (
          <div className="rounded border border-field-gold bg-field-gold-soft p-2.5">
            <p className="font-mono font-bold text-sm text-field-gold">Day {selectedEntry.day}: {selectedEntry.cases} case(s)</p>
            <p className="text-xs text-field-text mt-1">Working backward from the incubation period, exposure for these cases most likely occurred between day {exposureWindow.earliest.toFixed(1)} and day {exposureWindow.latest.toFixed(1)}.</p>
          </div>
        )}
        <Button onClick={downloadImage} variant="outline" size="sm" className="w-full border-2 border-field-line font-mono gap-1.5"><Download className="size-3.5" />Save curve as image (SVG)</Button>
      </CardContent>
    </Card>
  )
}

export function NetworkDiagram({ network }: { network: ContactNetwork }) {
  const { nodes, edges } = network
  const childrenOf = (id: string) => edges.filter((e) => e.from === id).map((e) => e.to)
  const depthOf = new Map<string, number>()
  const orderOf = new Map<string, number>()
  let counter = 0
  function visit(id: string, depth: number) {
    depthOf.set(id, depth)
    orderOf.set(id, counter++)
    for (const c of childrenOf(id)) visit(c, depth + 1)
  }
  visit(network.indexCaseId, 0)
  const maxDepth = Math.max(...[...depthOf.values()], 0)
  const W = 560
  const H = 60 + maxDepth * 70
  const colWidth = W / (maxDepth + 1)

  const positions = new Map<string, { x: number; y: number }>()
  const perDepthCount = new Map<number, number>()
  nodes.forEach((n) => {
    const d = depthOf.get(n.id) ?? 0
    const idx = perDepthCount.get(d) ?? 0
    perDepthCount.set(d, idx + 1)
    positions.set(n.id, { x: 40 + d * colWidth, y: 40 + idx * 46 })
  })

  return (
    <Card className="bg-field-panel/80 border-field-line glow-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><GitBranch className="size-4" />Transmission Chain</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Each arrow shows a likely transmission link, established through interviews. Columns run left to right by day of onset.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="overflow-x-auto rounded border border-field-line">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
            <rect x={0} y={0} width={W} height={H} fill="#0a1015" />
            {edges.map((e, i) => {
              const from = positions.get(e.from)!
              const to = positions.get(e.to)!
              return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#38c0e0" strokeWidth={1.5} markerEnd="url(#arrow)" />
            })}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#38c0e0" />
              </marker>
            </defs>
            {nodes.map((n) => {
              const p = positions.get(n.id)!
              return (
                <g key={n.id}>
                  <circle cx={p.x} cy={p.y} r={16} fill={n.id === network.indexCaseId ? '#e5493c' : '#1a2530'} stroke="#38c0e0" strokeWidth={1.5} />
                  <text x={p.x} y={p.y + 4} fontSize={11} fontFamily="monospace" fill="#eef2f7" textAnchor="middle">{n.id}</text>
                  <text x={p.x} y={p.y + 30} fontSize={8} fontFamily="monospace" fill="#9aa5b8" textAnchor="middle">day {n.day}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="grid gap-1">
          {nodes.map((n) => <p key={n.id} className="text-[11px] font-mono text-field-text-muted"><span className="text-field-teal font-bold">{n.id}</span>: {n.label}</p>)}
        </div>
      </CardContent>
    </Card>
  )
}

export function OddsRatioTable({ exposures }: { exposures: ExposureRow[] }) {
  return (
    <Card className="bg-field-panel/80 border-field-line glow-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><Table2 className="size-4" />Case-Control Exposure Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Exposure</th>
                <th className="text-right py-1.5 px-1.5">Cases exp.</th>
                <th className="text-right py-1.5 px-1.5">Cases unexp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls exp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls unexp.</th>
                <th className="text-right py-1.5 px-1.5">Odds ratio</th>
                <th className="text-right py-1.5 px-1.5">95% CI</th>
                <th className="text-center py-1.5 pl-1.5">Sig.?</th>
              </tr>
            </thead>
            <tbody>
              {exposures.map((e) => {
                const ci = computeOddsRatioCI(e)
                return (
                  <tr key={e.exposure} className="border-b border-field-line/50">
                    <td className="py-1.5 pr-2 text-field-text">{e.exposure}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{e.casesExposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{e.casesUnexposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{e.controlsExposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{e.controlsUnexposed}</td>
                    <td className={`text-right py-1.5 px-1.5 font-bold ${ci.or >= 5 ? 'text-field-red' : ci.or >= 2 ? 'text-field-gold' : 'text-field-text-muted'}`}>{ci.or.toFixed(2)}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{ci.lower.toFixed(1)}–{isFinite(ci.upper) ? ci.upper.toFixed(1) : '∞'}</td>
                    <td className="text-center py-1.5 pl-1.5">{ci.significant ? <span className="text-field-emerald">✓</span> : <span className="text-field-text-muted">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-field-text-muted">Odds ratio = (cases exposed × controls unexposed) ÷ (controls exposed × cases unexposed). The 95% CI uses Woolf's log method; "Sig.?" marks a CI that excludes 1 (roughly p&lt;0.05) — a moderately elevated OR with a wide CI crossing 1 is not a reliable signal, especially with small counts.</p>
      </CardContent>
    </Card>
  )
}

export function CohortComparisonCard({ cohort, vehicleLabel }: { cohort: CohortComparison; vehicleLabel: string }) {
  const rr = computeRelativeRisk(cohort)
  const exposedRate = (cohort.exposedIll / cohort.exposedTotal) * 100
  const unexposedRate = (cohort.unexposedIll / cohort.unexposedTotal) * 100
  return (
    <Card className="bg-field-panel/80 border-field-line glow-violet">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Users2 className="size-4" />Cohort View (also available here)</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">This population is small and fully enumerable, so a cohort study — comparing attack rates directly — is actually the preferred design here, not just a case-control study.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Group</th>
                <th className="text-right py-1.5 px-1.5">Total</th>
                <th className="text-right py-1.5 px-1.5">Ill</th>
                <th className="text-right py-1.5 pl-1.5">Attack rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-field-line/50">
                <td className="py-1.5 pr-2 text-field-text">Exposed to {vehicleLabel}</td>
                <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cohort.exposedTotal}</td>
                <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cohort.exposedIll}</td>
                <td className="text-right py-1.5 pl-1.5 font-bold text-field-red">{exposedRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-2 text-field-text">Not exposed</td>
                <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cohort.unexposedTotal}</td>
                <td className="text-right py-1.5 px-1.5 text-field-text-muted">{cohort.unexposedIll}</td>
                <td className="text-right py-1.5 pl-1.5 font-bold text-field-text-muted">{unexposedRate.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-field-text">Relative risk (RR) = <span className="font-mono text-field-violet font-bold">{rr.toFixed(1)}</span> — those exposed were about {rr.toFixed(1)}× as likely to become ill as those who weren't.</p>
        <p className="text-[10px] font-mono text-field-text-muted">RR = attack rate among exposed ÷ attack rate among unexposed. Directly interpretable, unlike an odds ratio — but only calculable when the whole population at risk can be enumerated.</p>
      </CardContent>
    </Card>
  )
}

export function DoseResponseCard({ levels }: { levels: DoseResponseLevel[] }) {
  const maxRate = Math.max(...levels.map((l) => (l.ill / l.total) * 100))
  return (
    <Card className="bg-field-panel/80 border-field-line glow-gold">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><TrendingUp className="size-4" />Dose-Response</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Risk rising with the amount or frequency of exposure is one of the classic Bradford Hill criteria supporting a causal link, beyond the exposed/unexposed comparison alone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {levels.map((l) => {
          const rate = (l.ill / l.total) * 100
          const widthPct = maxRate > 0 ? (rate / maxRate) * 100 : 0
          return (
            <div key={l.level} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-field-text">{l.level}</span>
                <span className="text-field-gold font-bold">{rate.toFixed(1)}% ({l.ill}/{l.total})</span>
              </div>
              <div className="h-2 rounded-full bg-field-panel-strong overflow-hidden">
                <div className="h-full bg-gradient-to-r from-field-gold/60 to-field-gold" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function StratifiedAnalysisCard({ stratified, exposures }: { stratified: StratifiedAnalysis; exposures: ExposureRow[] }) {
  const crudeRow = exposures.find((e) => e.exposure === stratified.exposureLabel)
  const crudeOr = crudeRow ? computeOddsRatio(crudeRow) : null
  return (
    <Card className="bg-field-panel/80 border-field-line glow-violet">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Layers className="size-4" />Stratified Analysis — Checking for Confounding</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">The crude odds ratio for "{stratified.exposureLabel}" looked elevated. Splitting by "{stratified.confounder}" checks whether that association holds up within each group, or was just a byproduct of the confounder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {crudeOr !== null && (
          <div className="rounded border border-field-gold bg-field-gold-soft p-2.5">
            <p className="font-mono text-xs text-field-text-muted uppercase">Crude (unstratified) odds ratio</p>
            <p className="font-mono text-lg font-bold text-field-gold">{crudeOr.toFixed(2)}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Stratum</th>
                <th className="text-right py-1.5 px-1.5">Cases exp.</th>
                <th className="text-right py-1.5 px-1.5">Cases unexp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls exp.</th>
                <th className="text-right py-1.5 px-1.5">Ctrls unexp.</th>
                <th className="text-right py-1.5 pl-1.5">OR</th>
              </tr>
            </thead>
            <tbody>
              {stratified.strata.map((s) => {
                const or = computeOddsRatio(s)
                return (
                  <tr key={s.label} className="border-b border-field-line/50">
                    <td className="py-1.5 pr-2 text-field-text">{s.label}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.casesExposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.casesUnexposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.controlsExposed}</td>
                    <td className="text-right py-1.5 px-1.5 text-field-text-muted">{s.controlsUnexposed}</td>
                    <td className="text-right py-1.5 pl-1.5 font-bold text-field-violet">{or.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-field-text">Within each stratum, the odds ratio drops much closer to 1 than the crude estimate — a sign that {stratified.confounder.toLowerCase()} was driving most of the crude association, not "{stratified.exposureLabel.toLowerCase()}" itself.</p>
      </CardContent>
    </Card>
  )
}
