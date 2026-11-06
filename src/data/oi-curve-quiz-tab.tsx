import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENARIOS } from './oi-scenarios'
import { EpiCurveChart } from './oi-shared-ui'
import type { CurveShape } from './oi-types'
import { CheckCircle2, CircleSlash, RotateCcw, Zap } from 'lucide-react'

// ---------------------------------------------------------------------------
// Rapid-fire practice classifying epi curves, pulling real curve data from
// the curated scenarios so the practice always matches a fully-validated
// answer key rather than synthetic data.
// ---------------------------------------------------------------------------

const QUIZ_LENGTH = 8

const CURVE_OPTIONS: { id: CurveShape; label: string }[] = [
  { id: 'point_source', label: 'Point-source' },
  { id: 'continuous_common_source', label: 'Continuous/intermittent common-source' },
  { id: 'propagated', label: 'Propagated' },
]

function shuffledScenarioSample(n: number) {
  return [...SCENARIOS].sort(() => Math.random() - 0.5).slice(0, n)
}

export function CurveQuizTab() {
  const [pool] = useState(() => shuffledScenarioSample(QUIZ_LENGTH))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<CurveShape | null>(null)

  const current = pool[index]
  const done = index >= pool.length

  function answer(choice: CurveShape) {
    if (answered) return
    setAnswered(choice)
    if (choice === current.trueCurveShape) setScore((s) => s + 1)
  }
  function next() {
    setAnswered(null)
    setIndex((i) => i + 1)
  }
  function restart() {
    setIndex(0); setScore(0); setAnswered(null)
  }

  if (done) {
    const pct = Math.round((score / pool.length) * 100)
    return (
      <div className="space-y-4">
        <Card className="bg-field-panel/80 border-2 border-field-gold glow-gold">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-lg text-field-gold flex items-center gap-2"><Zap className="size-5" />Quiz Complete</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-mono text-field-gold">{score}/{pool.length} ({pct}%)</p>
            <Button onClick={restart} className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono gap-1.5"><RotateCcw className="size-4" />Play again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-field-text-muted">Question {index + 1} / {pool.length}</p>
        <p className="text-xs font-mono text-field-gold">Score: {score}</p>
      </div>
      <EpiCurveChart data={current.epiCurve} />
      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-text">Classify this curve</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">No context this time — just the shape. Which pattern is it?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CURVE_OPTIONS.map((o) => {
            const isAnswer = answered !== null
            const isCorrect = o.id === current.trueCurveShape
            const isChosen = answered === o.id
            const tone = !isAnswer ? 'border-field-line text-field-text-muted'
              : isCorrect ? 'border-field-emerald text-field-emerald bg-field-emerald-soft'
              : isChosen ? 'border-field-red text-field-red bg-field-red-soft'
              : 'border-field-line text-field-text-muted opacity-50'
            return (
              <Button key={o.id} onClick={() => answer(o.id)} disabled={isAnswer} variant="outline" className={`w-full h-auto justify-start text-left border-2 font-mono ${tone}`}>
                <span className="flex items-center gap-2 py-1">
                  {isAnswer && isCorrect && <CheckCircle2 className="size-4" />}
                  {isAnswer && isChosen && !isCorrect && <CircleSlash className="size-4" />}
                  {o.label}
                </span>
              </Button>
            )
          })}
        </CardContent>
      </Card>
      {answered && (
        <Card className={`bg-field-panel/80 border-2 ${answered === current.trueCurveShape ? 'border-field-emerald' : 'border-field-red'}`}>
          <CardContent className="pt-4 space-y-2">
            <p className="font-mono font-bold text-sm text-field-text">{current.name}</p>
            <p className="text-sm text-field-text">{current.trueVehicle}</p>
            <Button onClick={next} className="w-full bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono">{index + 1 === pool.length ? 'See final score' : 'Next curve'}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
