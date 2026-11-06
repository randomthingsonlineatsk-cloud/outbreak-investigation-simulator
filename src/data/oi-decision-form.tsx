import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildDecisions } from './oi-decisions-full'
import { StageExtras } from './oi-extra-ui'
import { hintFor, hintKey, hintUsed } from './oi-hints'
import { RELEASE_STAGE } from './oi-release'
import type { Choices, NpcMood, Scenario, StageKey } from './oi-types'
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, MessageCircle } from 'lucide-react'

export type Step = 'select' | 'brief' | 'confirm' | 'confirmR' | 'case_definition' | 'case_definitionR' | 'descriptive' | 'descriptiveR' | 'hypothesis' | 'hypothesisR' | 'inspection' | 'inspectionR' | 'analytic' | 'analyticMeeting' | 'analyticR' | 'control' | 'controlR' | 'communication' | 'communicationR' | 'report'
export type Difficulty = 'guided' | 'expert'

export const MOOD_STYLE: Record<NpcMood, { label: string; box: string; text: string }> = {
  cooperative: { label: 'Cooperative', box: 'border-field-emerald bg-field-emerald-soft', text: 'text-field-emerald' },
  guarded: { label: 'Guarded', box: 'border-field-gold bg-field-gold-soft', text: 'text-field-gold' },
  hostile: { label: 'Hostile', box: 'border-field-red bg-field-red-soft', text: 'text-field-red' },
}

export function stageNumberOf(step: Step): number {
  if (step === 'brief' || step === 'confirm' || step === 'confirmR') return 1
  if (step === 'case_definition' || step === 'case_definitionR') return 2
  if (step === 'descriptive' || step === 'descriptiveR') return 3
  if (step === 'hypothesis' || step === 'hypothesisR') return 4
  if (step === 'inspection' || step === 'inspectionR') return 5
  if (step === 'analytic' || step === 'analyticMeeting' || step === 'analyticR') return 6
  if (step === 'control' || step === 'controlR') return 7
  if (step === 'communication' || step === 'communicationR') return 8
  if (step === 'report') return 9
  return 0
}

export function ProgressTracker({ step }: { step: Step }) {
  const current = stageNumberOf(step)
  if (current === 0) return null
  const nodes = [
    { n: 1, label: 'Confirm' }, { n: 2, label: 'Case Def' }, { n: 3, label: 'Curve' }, { n: 4, label: 'Hypothesis' }, { n: 5, label: 'Inspect' }, { n: 6, label: 'Analytic' }, { n: 7, label: 'Control' }, { n: 8, label: 'Comms' }, { n: 9, label: 'Report' },
  ]
  return (
    <div className="flex items-center overflow-x-auto">
      {nodes.map((node, i) => {
        const done = current > node.n
        const isCurrent = current === node.n
        return (
          <div key={node.n} className="flex items-center flex-1 last:flex-none min-w-[36px]">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center size-6 rounded-full border-2 font-mono text-[10px] shrink-0 transition-all ${done ? 'border-field-emerald bg-field-emerald-soft text-field-emerald' : isCurrent ? 'border-field-red bg-field-red-soft text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}>
                {done ? <CheckCircle2 className="size-3.5" /> : node.n}
              </div>
              <span className={`text-[8px] font-mono uppercase whitespace-nowrap ${isCurrent ? 'text-field-red' : done ? 'text-field-emerald' : 'text-field-text-muted'}`}>{node.label}</span>
            </div>
            {i < nodes.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${current > node.n ? 'bg-field-emerald' : 'bg-field-line'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export interface DecisionFormProps { scenario: Scenario; stage: StageKey; choices: Choices; setChoices: (c: Choices) => void; difficulty: Difficulty; onSubmit: () => void; submitLabel: string; onBack?: () => void; backLabel?: string; extra?: React.ReactNode }

export function DecisionForm({ scenario, stage, choices, setChoices, difficulty, onSubmit, submitLabel, onBack, backLabel, extra }: DecisionFormProps) {
  const decisions = useMemo(() => buildDecisions(scenario, stage), [scenario, stage])
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [confirmingHint, setConfirmingHint] = useState<string | null>(null)
  const complete = decisions.every((d) => choices[d.id])

  function select(decisionId: string, optionId: string) {
    setChoices({ ...choices, [decisionId]: optionId })
    if (difficulty === 'expert') setRevealed((r) => ({ ...r, [decisionId]: true }))
  }

  // Hint use is stored in the choices object (see oi-hints.ts) so it is saved
  // with the run and applied as a 1-point penalty when the stage is graded.
  function takeHint(decisionId: string) {
    setChoices({ ...choices, [hintKey(decisionId)]: '1' })
    setConfirmingHint(null)
  }

  return (
    <div className="space-y-4">
      {onBack && <Button onClick={onBack} variant="ghost" size="sm" className="text-field-text-muted font-mono gap-1.5 -mb-1"><ArrowLeft className="size-3.5" />{backLabel ?? 'Back'}</Button>}
      {extra}
      <StageExtras scenario={scenario} stage={stage} />
      {decisions.map((d, i) => {
        const hinted = hintUsed(choices, d.id)
        const selected = d.options.find((o) => o.id === choices[d.id])
        const reaction = selected?.reaction
        return (
          <Card key={d.id} className="bg-field-panel/80 border-field-line" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}>
            <CardHeader className="pb-2">
              <span className="text-[10px] font-mono text-field-text-muted uppercase">Decision {i + 1}</span>
              <CardTitle className="font-mono text-sm text-field-text">{d.title}</CardTitle>
              <CardDescription className="text-xs text-field-text-muted">{d.prompt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.npc && (
                <div className="rounded border border-field-blue bg-field-blue-soft p-2.5">
                  <p className="text-[10px] font-mono uppercase text-field-text-muted flex items-center gap-1.5"><MessageCircle className="size-3" />{d.npc.name} · {d.npc.role}</p>
                  <p className="text-sm text-field-text mt-1 italic">"{d.npc.line}"</p>
                </div>
              )}
              {RELEASE_STAGE < 2 ? null : hinted ? (
                <p className="rounded border border-field-gold bg-field-gold-soft p-2.5 text-xs text-field-text flex gap-2"><Lightbulb className="size-3.5 text-field-gold shrink-0 mt-0.5" /><span><span className="font-mono text-field-text-muted uppercase">Hint: </span>{hintFor(scenario, d.id)}</span></p>
              ) : confirmingHint === d.id ? (
                <div className="flex flex-wrap items-center gap-2 rounded border border-field-gold p-2">
                  <span className="text-xs text-field-text">Use a hint? It costs 1 point on this decision if your answer earns points.</span>
                  <Button onClick={() => takeHint(d.id)} size="sm" className="bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono h-7">Yes, show the hint</Button>
                  <Button onClick={() => setConfirmingHint(null)} size="sm" variant="ghost" className="text-field-text-muted font-mono h-7">Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setConfirmingHint(d.id)} size="sm" variant="ghost" className="text-field-text-muted font-mono gap-1.5 h-7 -mt-1"><Lightbulb className="size-3.5" />Hint (−1 point)</Button>
              )}
              {d.options.map((o) => {
                const active = choices[d.id] === o.id
                const showDetail = difficulty === 'guided' || revealed[d.id]
                return (
                  <Button key={o.id} onClick={() => select(d.id, o.id)} variant="outline" className={`w-full h-auto justify-start text-left border-2 font-mono ${active ? 'border-field-red text-field-red bg-field-red-soft glow-red' : 'border-field-line text-field-text-muted'}`}>
                    <span className="flex flex-col items-start gap-1 py-1">
                      <span className="text-sm text-field-text whitespace-normal">{o.label}</span>
                      {showDetail && <span className="text-xs text-field-text-muted whitespace-normal font-sans">{o.detail}</span>}
                    </span>
                  </Button>
                )
              })}
              {d.npc && reaction && (
                <div className={`rounded border p-2.5 ${MOOD_STYLE[reaction.mood].box}`} style={{ animation: 'fadeInUp 0.25s ease-out' }}>
                  <p className={`text-[10px] font-mono uppercase flex items-center gap-1.5 ${MOOD_STYLE[reaction.mood].text}`}><MessageCircle className="size-3" />{d.npc.name} responds · {MOOD_STYLE[reaction.mood].label}</p>
                  <p className="text-sm text-field-text mt-1 italic">"{reaction.text}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      <Button onClick={onSubmit} disabled={!complete} className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono gap-1.5">
        {complete ? submitLabel : 'Answer every decision to continue'}
        {complete && <ArrowRight className="size-4" />}
      </Button>
    </div>
  )
}
