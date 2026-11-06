import { useEffect, useMemo, useState } from 'react'
import { api, useMutation, useQuery } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loadHistory } from './oi-history-tab'
import { weekInfoAt, formatRemaining } from './oi-weekly'
import { CalendarDays, Trophy, ArrowRight } from 'lucide-react'

export function WeeklyTab({ onPlay }: { onPlay: (scenarioId: string) => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const week = useMemo(() => weekInfoAt(now), [now])
  const entries = useQuery(api.leaderboard.weekly, { scenarioId: week.scenario.id, sinceMs: week.startMs })

  // One entry per player name (their best this week), top ten.
  const ranked = useMemo(() => {
    if (!entries) return undefined
    const best = new Map<string, (typeof entries)[number]>()
    for (const e of entries) {
      const key = e.name.trim().toLowerCase()
      const cur = best.get(key)
      if (!cur || e.pct > cur.pct) best.set(key, e)
    }
    return [...best.values()].sort((a, b) => b.pct - a.pct).slice(0, 10)
  }, [entries])

  // Your own best result for this week's outbreak, from this device.
  const mine = useMemo(() => {
    if (typeof window === 'undefined') return null
    const runs = loadHistory().filter((r) => r.scenarioId === week.scenario.id && r.ts >= week.startMs && r.maxScore > 0)
    if (runs.length === 0) return null
    return runs.reduce((a, b) => (b.score / b.maxScore > a.score / a.maxScore ? b : a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week.scenario.id, week.startMs, now])

  const s = week.scenario
  const weekLabel = new Date(week.startMs).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const resetLocal = new Date(week.endMs).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-2 border-field-gold glow-gold">
        <CardHeader className="pb-2">
          <span className="text-[10px] font-mono text-field-text-muted uppercase">Week of {weekLabel}</span>
          <CardTitle className="font-mono text-base text-field-gold flex items-center gap-2"><CalendarDays className="size-5" />Outbreak of the Week</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">Every investigator gets the same outbreak this week, so scores are directly comparable. It resets {resetLocal}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded border border-field-line bg-field-panel-strong p-3 space-y-1">
            <p className="font-mono font-bold text-field-text">{s.name} <span className="text-field-text-muted text-xs">{s.code}</span></p>
            <p className="text-xs text-field-text-muted">{s.setting}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field-panel text-field-red">{s.observedCases} cases</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field-panel text-field-gold">{formatRemaining(week.endMs - now)}</span>
            </div>
          </div>
          {mine && (
            <p className="text-sm text-field-text">Your best so far this week: <span className="font-mono font-bold text-field-emerald">{Math.round((mine.score / mine.maxScore) * 100)}%</span> <span className="text-field-text-muted">({mine.verdict.replace(/_/g, ' ')})</span></p>
          )}
          <Button onClick={() => onPlay(s.id)} className="w-full bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono gap-1.5">{mine ? 'Try it again' : 'Investigate this outbreak'} <ArrowRight className="size-4" /></Button>
          <p className="text-[11px] font-mono text-field-text-muted">Finish the investigation, then submit your score on the report screen to appear on the board below.</p>
        </CardContent>
      </Card>

      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-text-muted flex items-center gap-2"><Trophy className="size-4 text-field-gold" />This week's board</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">Each name's best score on this week's outbreak.</CardDescription>
        </CardHeader>
        <CardContent>
          {ranked === undefined ? <p className="text-sm text-field-text-muted">Loading…</p> : ranked.length === 0 ? <p className="text-sm text-field-text-muted">No one has submitted this week yet. Be the first.</p> : (
            <ol className="space-y-1.5">
              {ranked.map((e, i) => (
                <li key={e._id} className="flex justify-between text-sm font-mono">
                  <span className="text-field-text-muted flex items-center gap-1.5">{i === 0 && <Trophy className="size-3.5 text-field-gold" />}{i + 1}. {e.name}</span>
                  <span className={e.correct ? 'text-field-emerald' : 'text-field-text'}>{e.verdict.replace(/_/g, ' ')} · {e.pct.toFixed(0)}%</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="text-xs font-mono text-field-text-muted">Last week: {week.previous.name} <span className="opacity-70">{week.previous.code}</span></p>
    </div>
  )
}
