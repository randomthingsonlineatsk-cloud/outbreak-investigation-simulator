import { useMemo, useState } from 'react'
import { api, useMutation, useQuery } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENARIOS } from './oi-scenarios'
import { GLOSSARY, METHOD_NOTE, REAL_WORLD_CASES } from './oi-reference'
import { AUTHORITIES } from './oi-authorities'
import { Trophy } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  foodborne_point_source: 'Foodborne',
  waterborne_point_source: 'Waterborne',
  toxin_point_source: 'Toxin',
  common_vehicle_continuous: 'Continuous Common-Source',
  person_to_person_propagated: 'Person-to-Person',
  vector_borne: 'Vector-Borne',
}

export function LeaderboardTab() {
  const [filterScenario, setFilterScenario] = useState<string | 'all'>('all')
  const [filterRoute, setFilterRoute] = useState<string | 'all'>('all')
  const entries = useQuery(api.leaderboard.top, {
    scenarioId: filterScenario !== 'all' ? filterScenario : undefined,
    route: filterScenario === 'all' && filterRoute !== 'all' ? filterRoute : undefined,
  })
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-mono text-field-text-muted mb-1.5">By outbreak type</p>
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={() => { setFilterRoute('all'); setFilterScenario('all') }} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterRoute === 'all' && filterScenario === 'all' ? 'border-field-violet text-field-violet' : 'border-field-line text-field-text-muted'}`}>All types</Button>
          {Object.entries(ROUTE_LABELS).map(([key, label]) => (
            <Button key={key} onClick={() => { setFilterRoute(key); setFilterScenario('all') }} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterRoute === key && filterScenario === 'all' ? 'border-field-violet text-field-violet' : 'border-field-line text-field-text-muted'}`}>{label}</Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-mono text-field-text-muted mb-1.5">By specific outbreak</p>
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={() => setFilterScenario('all')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterScenario === 'all' ? 'border-field-red text-field-red' : 'border-field-line text-field-text-muted'}`}>All outbreaks</Button>
          {SCENARIOS.map((s) => (
            <Button key={s.id} onClick={() => setFilterScenario(s.id)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterScenario === s.id ? 'border-field-red text-field-red' : 'border-field-line text-field-text-muted'}`}>{s.name}</Button>
          ))}
        </div>
      </div>
      <Card className="bg-field-panel/80 border-field-line">
        <CardContent className="pt-4">
          {entries === undefined ? <p className="text-sm text-field-text-muted">Loading…</p> : entries.length === 0 ? <p className="text-sm text-field-text-muted">No investigations submitted yet for this filter.</p> : (
            <ol className="space-y-1.5">
              {entries.map((e, i) => (
                <li key={e._id} className="flex justify-between text-sm font-mono">
                  <span className="text-field-text-muted flex items-center gap-1.5">{i === 0 && <Trophy className="size-3.5 text-field-gold" />}{i + 1}. {e.name} — {e.scenarioName}</span>
                  <span className={e.correct ? 'text-field-emerald' : 'text-field-text'}>{e.verdict.replace(/_/g, ' ')} · {e.pct.toFixed(0)}%</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RouteClassificationTable() {
  const rows = useMemo(() => {
    const byRoute = new Map<string, { urgent: number; routine: number }>()
    for (const s of SCENARIOS) {
      const entry = byRoute.get(s.trueRoute) ?? { urgent: 0, routine: 0 }
      if (s.notifiableClass === 'urgent') entry.urgent++; else entry.routine++
      byRoute.set(s.trueRoute, entry)
    }
    return [...byRoute.entries()].map(([route, counts]) => ({
      route, label: ROUTE_LABELS[route] ?? route,
      majority: counts.urgent >= counts.routine ? 'Usually urgent' : 'Usually routine',
      counts,
    }))
  }, [])
  return (
    <Card className="bg-field-panel/80 border-field-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-violet">Notification Class by Outbreak Type</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Drawn from the {SCENARIOS.length} scenarios in this simulator — a rough guide, not a substitute for consulting the actual notifiable-disease list for a specific pathogen.</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="text-field-text-muted border-b border-field-line">
              <th className="text-left py-1.5 pr-2">Outbreak type</th>
              <th className="text-right py-1.5 px-2">Urgent</th>
              <th className="text-right py-1.5 px-2">Routine</th>
              <th className="text-right py-1.5 pl-2">Typical</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.route} className="border-b border-field-line/50">
                <td className="py-1.5 pr-2 text-field-text">{r.label}</td>
                <td className="text-right py-1.5 px-2 text-field-text-muted">{r.counts.urgent}</td>
                <td className="text-right py-1.5 px-2 text-field-text-muted">{r.counts.routine}</td>
                <td className={`text-right py-1.5 pl-2 font-bold ${r.majority === 'Usually urgent' ? 'text-field-red' : 'text-field-text-muted'}`}>{r.majority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function AuthorityWindowTable() {
  return (
    <Card className="bg-field-panel/80 border-field-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal">Reporting Authorities — Notification Windows</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">Simplified for teaching purposes — always confirm the actual current regulations for a specific jurisdiction and pathogen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="text-field-text-muted border-b border-field-line">
                <th className="text-left py-1.5 pr-2">Authority</th>
                <th className="text-right py-1.5 px-2">Urgent window</th>
                <th className="text-right py-1.5 pl-2">Routine window</th>
              </tr>
            </thead>
            <tbody>
              {AUTHORITIES.map((a) => (
                <tr key={a.key} className="border-b border-field-line/50">
                  <td className="py-1.5 pr-2 font-bold" style={{ color: a.color }}>{a.name}</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{a.urgentWindowHours}h</td>
                  <td className="text-right py-1.5 pl-2 text-field-text-muted">{a.routineWindowDays}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2">
          {AUTHORITIES.map((a) => (
            <div key={a.key} className="rounded border border-field-line p-2.5">
              <p className="font-mono font-bold text-sm" style={{ color: a.color }}>{a.name}</p>
              <p className="text-xs text-field-text mt-1">{a.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function GlossaryTab() {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const all = [...GLOSSARY, ...REAL_WORLD_CASES]
    const filtered = all.filter((g) => g.term.toLowerCase().includes(q.toLowerCase()) || g.body.toLowerCase().includes(q.toLowerCase()))
    const map = new Map<string, typeof all>()
    for (const e of filtered) map.set(e.group, [...(map.get(e.group) ?? []), e])
    return [...map.entries()]
  }, [q])
  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter terms…" className="bg-field-panel-strong border-field-line text-field-text font-mono" />
      {groups.map(([group, entries]) => (
        <Card key={group} className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-red">{group}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {entries.map((e) => (
              <div key={e.term}><p className="font-mono font-bold text-field-text text-sm">{e.term}</p><p className="text-sm text-field-text-muted mt-1">{e.body}</p></div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-blue">A note on method</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-field-text">{METHOD_NOTE}</p></CardContent>
      </Card>
      <AuthorityWindowTable />
      <RouteClassificationTable />
    </div>
  )
}
