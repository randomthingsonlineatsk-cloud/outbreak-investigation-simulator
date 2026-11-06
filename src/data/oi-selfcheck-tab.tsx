import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getScenario } from './oi-scenarios'
import {
  SELF_CHECK_QUESTIONS, TOPICS, TOPIC_LABELS, TOPIC_FLASHCARD_GROUP, LEVEL_INFO,
  scoreAnswers, recommend, loadAttempts, saveAttempt, type SelfCheckAttempt,
} from './oi-selfcheck-data'
import { ClipboardCheck, ArrowRight, RotateCcw, Target, Layers, CheckCircle2, XCircle } from 'lucide-react'

type Phase = 'intro' | 'quiz' | 'results'

export function SelfCheckTab({ onPlay, onOpenFlashcards }: { onPlay: (scenarioId: string) => void; onOpenFlashcards: (group: string) => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => SELF_CHECK_QUESTIONS.map(() => null))
  const [attempts, setAttempts] = useState<SelfCheckAttempt[]>(() => (typeof window !== 'undefined' ? loadAttempts() : []))
  const [previous, setPrevious] = useState<SelfCheckAttempt | null>(null)

  const last = attempts[attempts.length - 1]
  const question = SELF_CHECK_QUESTIONS[index]
  const chosen = answers[index]

  function start() {
    setAnswers(SELF_CHECK_QUESTIONS.map(() => null))
    setIndex(0)
    setPhase('quiz')
  }

  function choose(optionIndex: number) {
    if (chosen !== null) return
    setAnswers((prev) => prev.map((a, i) => (i === index ? optionIndex : a)))
  }

  function next() {
    if (index < SELF_CHECK_QUESTIONS.length - 1) {
      setIndex(index + 1)
      return
    }
    // Finished: remember the previous attempt for comparison, then save.
    setPrevious(attempts.length > 0 ? attempts[attempts.length - 1] : null)
    setAttempts(saveAttempt(scoreAnswers(answers)))
    setPhase('results')
  }

  if (phase === 'intro') {
    return (
      <div className="space-y-4">
        <Card className="bg-field-panel/80 border-2 border-field-teal glow-teal">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><ClipboardCheck className="size-4" />Self-Check</CardTitle>
            <CardDescription className="text-xs text-field-text-muted">Twelve quick questions on the core ideas, two each on case definitions, epidemic curves, case-control analysis, bias and statistics, control measures, and communication. You get a suggested difficulty, a starting outbreak, and the topics worth revisiting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs font-mono text-field-text-muted">This is a quick self-assessment, not a formal test. The questions are fixed, so retaking it shows progress after practice, not a fresh measurement.</p>
            {last && <p className="text-sm text-field-text">Last time: <span className="font-mono font-bold text-field-teal">{last.total}/{SELF_CHECK_QUESTIONS.length}</span> on {new Date(last.ts).toLocaleDateString()}.</p>}
            <Button onClick={start} className="w-full bg-field-teal text-field-bg hover:bg-field-teal/90 font-mono gap-1.5">{last ? 'Take it again' : 'Start the self-check'} <ArrowRight className="size-4" /></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === 'quiz') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-field-text-muted">
          <span>Question {index + 1} of {SELF_CHECK_QUESTIONS.length}</span>
          <span>{TOPIC_LABELS[question.topic]}</span>
        </div>
        <div className="h-1.5 rounded-full bg-field-panel-strong overflow-hidden"><div className="h-full bg-field-teal" style={{ width: `${((index + (chosen !== null ? 1 : 0)) / SELF_CHECK_QUESTIONS.length) * 100}%` }} /></div>
        <Card className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text leading-relaxed">{question.prompt}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correct
              const isChosen = chosen === i
              const revealed = chosen !== null
              return (
                <Button key={i} onClick={() => choose(i)} disabled={revealed} variant="outline"
                  className={`w-full h-auto justify-start text-left border-2 font-mono whitespace-normal ${revealed && isCorrect ? 'border-field-emerald bg-field-emerald-soft text-field-emerald' : revealed && isChosen ? 'border-field-red bg-field-red-soft text-field-red' : 'border-field-line text-field-text-muted'}`}>
                  <span className="flex items-start gap-2 py-1">
                    {revealed && isCorrect && <CheckCircle2 className="size-4 mt-0.5 shrink-0" />}
                    {revealed && isChosen && !isCorrect && <XCircle className="size-4 mt-0.5 shrink-0" />}
                    <span className="text-sm text-field-text">{opt}</span>
                  </span>
                </Button>
              )
            })}
            {chosen !== null && <p className="rounded border border-field-line bg-field-panel-strong p-2.5 text-xs text-field-text">{question.explanation}</p>}
          </CardContent>
        </Card>
        {chosen !== null && <Button onClick={next} className="w-full bg-field-teal text-field-bg hover:bg-field-teal/90 font-mono gap-1.5">{index < SELF_CHECK_QUESTIONS.length - 1 ? 'Next question' : 'See my results'} <ArrowRight className="size-4" /></Button>}
      </div>
    )
  }

  // results
  const result = scoreAnswers(answers)
  const rec = recommend(result)
  const info = LEVEL_INFO[result.level]
  const scenario = getScenario(rec.scenarioId)
  const delta = previous ? result.total - previous.total : null
  const groups = [...new Set(rec.weakTopics.map((t) => TOPIC_FLASHCARD_GROUP[t]))]

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-2 border-field-teal glow-teal">
        <CardHeader className="pb-2">
          <span className="text-[10px] font-mono text-field-text-muted uppercase">Your result</span>
          <CardTitle className="font-mono text-xl text-field-text">{info.label} <span className="text-field-teal">· {result.total}/{result.max}</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-field-text">{info.blurb}</p>
          <p className="text-xs font-mono text-field-text-muted">Suggested difficulty: <span className="text-field-teal font-bold">{info.difficulty}</span></p>
          {delta !== null && <p className="text-xs font-mono text-field-text-muted">Compared with your previous attempt: <span className={delta > 0 ? 'text-field-emerald font-bold' : delta < 0 ? 'text-field-red font-bold' : 'font-bold'}>{delta > 0 ? `+${delta}` : delta}</span></p>}
        </CardContent>
      </Card>

      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text-muted">By topic</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {TOPICS.map((t) => (
            <div key={t} className="space-y-1">
              <div className="flex justify-between text-xs font-mono"><span className="text-field-text">{TOPIC_LABELS[t]}</span><span className={result.byTopic[t] === 2 ? 'text-field-emerald' : result.byTopic[t] === 1 ? 'text-field-gold' : 'text-field-red'}>{result.byTopic[t]}/2</span></div>
              <div className="h-1.5 rounded-full bg-field-panel-strong overflow-hidden"><div className={`h-full ${result.byTopic[t] === 2 ? 'bg-field-emerald' : result.byTopic[t] === 1 ? 'bg-field-gold' : 'bg-field-red'}`} style={{ width: `${(result.byTopic[t] / 2) * 100}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-field-panel/80 border-2 border-field-red glow-red">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-red flex items-center gap-2"><Target className="size-4" />Where to start</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {scenario && <p className="font-mono font-bold text-sm text-field-text">{scenario.name} <span className="text-field-text-muted text-xs">{scenario.code}</span></p>}
          <p className="text-sm text-field-text">{rec.reason}</p>
          <Button onClick={() => onPlay(rec.scenarioId)} className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono gap-1.5">Start this outbreak <ArrowRight className="size-4" /></Button>
          <p className="text-[11px] font-mono text-field-text-muted">Set the difficulty on the Investigate screen before you begin. This opens the standard, fixed-number version.</p>
        </CardContent>
      </Card>

      {groups.length > 0 && (
        <Card className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Layers className="size-4" />Worth revisiting</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-field-text-muted">Flashcards for the areas where you missed a question:</p>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => <Button key={g} onClick={() => onOpenFlashcards(g)} variant="outline" size="sm" className="border-2 border-field-violet text-field-violet font-mono text-xs">{g}</Button>)}
            </div>
          </CardContent>
        </Card>
      )}

      {attempts.length > 1 && (
        <p className="text-[11px] font-mono text-field-text-muted">Recent attempts: {attempts.slice(-6).map((a) => `${a.total}/${SELF_CHECK_QUESTIONS.length}`).join(' → ')}</p>
      )}
      <Button onClick={start} variant="outline" className="w-full border-2 border-field-line font-mono gap-1.5"><RotateCcw className="size-4" />Take it again</Button>
    </div>
  )
}
