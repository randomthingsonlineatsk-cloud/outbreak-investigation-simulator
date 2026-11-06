import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Time-pressure mode: a real ticking clock during the investigation, with a
// simulated case count that keeps climbing the longer the investigation
// takes — the same real-world pressure that field epidemiologists face,
// made visible. Purely a display/stakes layer; it does not affect grading.
// ---------------------------------------------------------------------------

const SECONDS_PER_NEW_CASE = 25

export function OutbreakGrowthTimer({ startedAtMs, baseCases }: { startedAtMs: number; baseCases: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000))
  const additionalCases = Math.floor(elapsedSeconds / SECONDS_PER_NEW_CASE)
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60

  return (
    <Card className="bg-field-panel/80 border-2 border-field-red glow-red">
      <CardContent className="pt-3 pb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-mono text-field-red"><Clock className="size-3.5" />Time on investigation: {mins}:{secs.toString().padStart(2, '0')}</span>
        <span className="text-xs font-mono text-field-gold">Outbreak keeps growing: +{additionalCases} case{additionalCases === 1 ? '' : 's'} (est. {baseCases + additionalCases} total)</span>
      </CardContent>
    </Card>
  )
}

export function elapsedGrowthCases(startedAtMs: number, endedAtMs: number): number {
  const elapsedSeconds = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000))
  return Math.floor(elapsedSeconds / SECONDS_PER_NEW_CASE)
}

export function formatElapsed(startedAtMs: number, endedAtMs: number): string {
  const elapsedSeconds = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000))
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
