import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ACHIEVEMENTS, RANGE_TARGET, VETERAN_TARGET, correctRunCount, distinctCorrectOutbreaks, loadBadges } from './oi-achievements'
import { loadHistory } from './oi-history-tab'
import { CertificatePanel } from './oi-certificate'
import { SummaryPanel } from './oi-summary'
import { Award, Lock } from 'lucide-react'

const GROUP_LABELS: Record<string, string> = { performance: 'Performance', skill: 'Skills', career: 'Career' }

export function BadgesTab() {
  const store = useMemo(() => loadBadges(), [])
  const history = useMemo(() => loadHistory(), [])
  const earnedCount = ACHIEVEMENTS.filter((a) => store[a.id]).length

  function progressFor(id: string): string | null {
    if (id === 'veteran') return `${Math.min(correctRunCount(history), VETERAN_TARGET)} / ${VETERAN_TARGET} correct investigations`
    if (id === 'range') return `${Math.min(distinctCorrectOutbreaks(history), RANGE_TARGET)} / ${RANGE_TARGET} different outbreaks`
    return null
  }

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-2 border-field-gold glow-gold">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><Award className="size-4" />Badges</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">{earnedCount} of {ACHIEVEMENTS.length} earned. Every badge comes from the decisions you make in an investigation, not from time spent. Badges are saved on this device.</CardDescription>
        </CardHeader>
      </Card>
      {(['performance', 'skill', 'career'] as const).map((group) => (
        <Card key={group} className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-red">{GROUP_LABELS[group]}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ACHIEVEMENTS.filter((a) => a.group === group).map((a) => {
              const got = store[a.id]
              const progress = got ? null : progressFor(a.id)
              return (
                <div key={a.id} className={`rounded border p-2.5 ${got ? 'border-field-gold bg-field-gold-soft' : 'border-field-line'}`}>
                  <p className={`font-mono font-bold text-sm flex items-center gap-2 ${got ? 'text-field-text' : 'text-field-text-muted'}`}>
                    {got ? <Award className="size-3.5 text-field-gold" /> : <Lock className="size-3.5" />}{a.name}
                  </p>
                  <p className="text-xs text-field-text-muted mt-1">{a.description}</p>
                  {got && <p className="text-[10px] font-mono text-field-text-muted mt-1">Earned {new Date(got.ts).toLocaleDateString()} · {got.scenarioName}</p>}
                  {progress && <p className="text-[10px] font-mono text-field-gold mt-1">{progress}</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
      <CertificatePanel />
      <SummaryPanel />
    </div>
  )
}
