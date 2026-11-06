import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradeRow } from './oi-shared-ui'
import type { Grade, StageOutcome } from './oi-types'
import { ArrowRight, CheckCircle2, CircleAlert, CircleSlash } from 'lucide-react'

export function StageResultView({ outcome, grades, onNext, nextLabel, extra }: { outcome: StageOutcome; grades: Grade[]; onNext: () => void; nextLabel: string; extra?: React.ReactNode }) {
  const tone = outcome.status === 'success' ? { border: 'border-field-emerald', glow: 'glow-emerald', Icon: CheckCircle2, color: 'text-field-emerald' }
    : outcome.status === 'mixed' ? { border: 'border-field-gold', glow: 'glow-gold', Icon: CircleAlert, color: 'text-field-gold' }
    : { border: 'border-field-red', glow: 'glow-red', Icon: CircleSlash, color: 'text-field-red' }
  return (
    <div className="space-y-4" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <Card className={`bg-field-panel/80 border-2 ${tone.border} ${tone.glow}`}>
        <CardHeader className="pb-2"><CardTitle className="font-mono text-base text-field-text flex items-center gap-2"><tone.Icon className={`size-5 ${tone.color}`} />{outcome.headline}</CardTitle></CardHeader>
      </Card>
      {extra}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest font-mono text-field-teal">Decision review — this stage</p>
        {grades.map((g) => <GradeRow key={g.decisionId} grade={g} />)}
      </div>
      <Button onClick={onNext} className="w-full bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono gap-1.5">{nextLabel} <ArrowRight className="size-4" /></Button>
    </div>
  )
}
