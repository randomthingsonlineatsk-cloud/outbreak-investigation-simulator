import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENARIOS, getScenario } from './oi-scenarios'
import type { FinalVerdict } from './oi-types'
import { Building2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Department Mode — the Portfolio Mode equivalent for this app: manage a
// public health department fielding several simultaneous outbreak alerts
// with a fixed pool of investigator-days. Allocating adequately doesn't
// guarantee a good outcome (the underlying complexity of the outbreak still
// matters) but under-resourcing a complex alert makes a poor outcome much
// more likely. Playing an alert through the full Investigate flow replaces
// the funding-adequacy estimate with the alert's actual outcome.
// ---------------------------------------------------------------------------

const TOTAL_DAYS = 40
const DAY_TIERS = [
  { id: 'light', label: 'Light', days: 4 },
  { id: 'standard', label: 'Standard', days: 10 },
  { id: 'thorough', label: 'Thorough', days: 18 },
] as const
type DayTierId = typeof DAY_TIERS[number]['id']

// A handful of the curated alerts, standing in for "this week's active
// alerts" at the department.
const ALERT_IDS = ['ridgeview-wedding', 'sunview-pool', 'eastview-hall', 'meadowbrook', 'palm-grove', 'lakeside-infusion']

const RESULTS_KEY = 'oi_department_results_v1'
export interface DepartmentResult { verdict: FinalVerdict; score: number; maxScore: number }
function loadResults(): Record<string, DepartmentResult> { try { const raw = localStorage.getItem(RESULTS_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} } }
export function saveDepartmentResult(scenarioId: string, result: DepartmentResult) {
  try {
    const all = loadResults()
    all[scenarioId] = result
    localStorage.setItem(RESULTS_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// A rough complexity heuristic: a resource-constrained (large-population)
// alert, or one with a large observed case count, needs more investigator-
// days to cover adequately than a small, contained one.
function complexityDaysNeeded(scenarioId: string): number {
  const s = getScenario(scenarioId)
  if (!s) return 10
  let days = 6
  if (s.resourceConstrained) days += 6
  if (s.populationAtRisk > 1000) days += 4
  if (s.observedCases > 60) days += 4
  if (s.contactNetwork) days += 2
  return days
}

function outlookFor(scenarioId: string, allocatedDays: number): { label: string; tone: 'good' | 'mixed' | 'poor'; note: string } {
  const needed = complexityDaysNeeded(scenarioId)
  const adequacy = allocatedDays / needed
  if (adequacy < 0.6) return { label: 'Under-resourced — likely to stall or miss the vehicle', tone: 'poor', note: `This alert's scale and complexity call for roughly ${needed} investigator-days; ${allocatedDays} is unlikely to be enough for a defensible conclusion.` }
  if (adequacy < 1) return { label: 'Tight, but workable', tone: 'mixed', note: `Roughly ${needed} investigator-days would be comfortable here; ${allocatedDays} is workable but leaves little room for follow-up if the first hypothesis is wrong.` }
  return { label: 'Adequately resourced', tone: 'good', note: `${allocatedDays} investigator-days comfortably covers what this alert's scale and complexity call for (roughly ${needed}).` }
}

export function DepartmentTab({ onPlayAlert }: { onPlayAlert: (scenarioId: string) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [allocations, setAllocations] = useState<Record<string, DayTierId>>({})
  const [results, setResults] = useState<Record<string, DepartmentResult>>(() => (typeof window !== 'undefined' ? loadResults() : {}))

  useEffect(() => {
    const interval = setInterval(() => setResults(loadResults()), 1500)
    return () => clearInterval(interval)
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }
  function setTier(id: string, tier: DayTierId) { setAllocations((prev) => ({ ...prev, [id]: tier })) }

  const totalAllocated = selected.reduce((sum, id) => {
    const t = DAY_TIERS.find((d) => d.id === allocations[id])
    return sum + (t?.days ?? 0)
  }, 0)
  const overBudget = totalAllocated > TOTAL_DAYS

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-field-violet border-2 glow-violet">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Building2 className="size-4" />Department Mode</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">This week's department has {TOTAL_DAYS} investigator-days total and {ALERT_IDS.length} simultaneous alerts. Pick up to 3 to prioritize now and allocate days to each — the rest have to wait. Play an alert through the full Investigate flow to replace the estimate with its actual outcome.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-2">
        {ALERT_IDS.map((id) => {
          const s = getScenario(id)
          if (!s) return null
          const isSelected = selected.includes(id)
          const played = results[id]
          return (
            <Card key={id} className={`bg-field-panel/80 border-field-line cursor-pointer transition-all ${isSelected ? 'border-field-violet glow-violet' : 'hover:border-field-line'}`} onClick={() => toggle(id)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="font-mono font-bold text-field-text">{s.name} <span className="text-field-text-muted text-xs">{s.code}</span></p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field-panel-strong text-field-red">{s.observedCases} cases</span>
                </div>
                <p className="text-xs text-field-text-muted mt-1">{s.setting}</p>
                {played && <p className="text-[10px] font-mono text-field-emerald mt-1">Actual: {played.verdict.replace(/_/g, ' ')} · {played.score}/{played.maxScore}</p>}
                {isSelected && (
                  <div className="flex gap-2 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {DAY_TIERS.map((t) => (
                      <Button key={t.id} onClick={() => setTier(id, t.id)} size="sm" variant="outline" className={`flex-1 border-2 font-mono text-xs ${allocations[id] === t.id ? 'border-field-violet text-field-violet bg-field-violet-soft' : 'border-field-line text-field-text-muted'}`}>{t.label} ({t.days}d)</Button>
                    ))}
                    <Button onClick={() => onPlayAlert(id)} size="sm" className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono">Investigate this alert →</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {selected.length > 0 && (
        <Card className={`bg-field-panel/80 border-2 ${overBudget ? 'border-field-red glow-red' : 'border-field-emerald glow-emerald'}`}>
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text">Department Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-mono text-field-text">Allocated: {totalAllocated}d / {TOTAL_DAYS}d {overBudget && <span className="text-field-red">— over budget</span>}</p>
            {selected.map((id) => {
              const s = getScenario(id)!
              const played = results[id]
              if (played) {
                return (
                  <div key={id} className="rounded border border-field-emerald bg-field-emerald-soft text-field-emerald p-2.5">
                    <p className="font-mono font-bold text-sm">{s.name}: {played.verdict.replace(/_/g, ' ')} (actual result)</p>
                    <p className="text-xs text-field-text mt-1">Score: {played.score}/{played.maxScore}</p>
                  </div>
                )
              }
              const tier = allocations[id]
              const t = DAY_TIERS.find((d) => d.id === tier)
              if (!t) return <p key={id} className="text-xs text-field-text-muted font-mono">{s.name}: choose a day allocation above.</p>
              const outlook = outlookFor(id, t.days)
              const tone = outlook.tone === 'good' ? 'border-field-emerald bg-field-emerald-soft text-field-emerald' : outlook.tone === 'mixed' ? 'border-field-gold bg-field-gold-soft text-field-gold' : 'border-field-red bg-field-red-soft text-field-red'
              return (
                <div key={id} className={`rounded border p-2.5 ${tone}`}>
                  <p className="font-mono font-bold text-sm">{s.name}: {outlook.label}</p>
                  <p className="text-xs text-field-text mt-1">{outlook.note}</p>
                </div>
              )
            })}
            <p className="text-xs text-field-text-muted font-mono">Spreading days too thin across every alert is itself a real trade-off — real departments often have to explicitly triage which alerts get a full investigation.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
