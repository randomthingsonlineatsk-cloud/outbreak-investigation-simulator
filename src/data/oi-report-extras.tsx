import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ACHIEVEMENTS, evaluateAchievements, recordEarned } from './oi-achievements'
import { countHints, pointsDeducted } from './oi-hints'
import { loadHistory } from './oi-history-tab'
import { npcDecisions } from './oi-npc'
import { MOOD_STYLE } from './oi-decision-form'
import { buildMethodsAppendix, NO_LIMITATIONS_NOTE } from './oi-methods'
import { RELEASE_STAGE } from './oi-release'
import type { Choices, FinalReport, Scenario, StageKey } from './oi-types'
import { Award, ClipboardCopy, FileDown, Lightbulb, MessageCircle, ScrollText } from 'lucide-react'

// ---------------------------------------------------------------------------
// Report-screen extras. The play tab renders <ReportExtras /> once on the
// report step, so new report features can be added here without editing the
// play tab again.
// ---------------------------------------------------------------------------

export interface ReportExtrasProps {
  scenario: Scenario
  report: FinalReport
  choices: Choices
  difficulty: 'guided' | 'expert'
  meetingTaken: boolean
  revisionUsed: boolean
  elapsedMs: number | null
}

const NPC_STAGES: StageKey[] = ['hypothesis', 'control', 'communication']

// How each conversation ended, from the reply the player actually chose.
function conversationSummary(scenario: Scenario, choices: Choices) {
  const rows: { id: string; name: string; role: string; mood: 'cooperative' | 'guarded' | 'hostile'; text: string }[] = []
  for (const stage of NPC_STAGES) {
    for (const d of npcDecisions(scenario, stage)) {
      const chosen = d.options.find((o) => o.id === choices[d.id])
      if (chosen?.reaction && d.npc) rows.push({ id: d.id, name: d.npc.name, role: d.npc.role, mood: chosen.reaction.mood, text: chosen.reaction.text })
    }
  }
  return rows
}

function MethodsAppendixCard({ scenario, report }: { scenario: Scenario; report: FinalReport }) {
  const appendix = useMemo(() => buildMethodsAppendix(scenario, report.grades), [scenario, report])
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setNote(`${label} copied.`)
    } catch {
      setNote('Copying is not available here. Open the appendix and select the text instead.')
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([appendix.fullText], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${scenario.id}-methods-appendix.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-field-panel/80 border-field-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><ScrollText className="size-4" />Methods appendix</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">A Materials and Methods section written from the choices you made, in the order a real outbreak report uses. It describes what you did, so weaker choices read as weaker methods and show up under Limitations. It is also added to the Word report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpen((v) => !v)} variant="outline" size="sm" className="border-2 border-field-line font-mono text-xs">{open ? 'Hide' : 'Read it'}</Button>
          <Button onClick={() => copy(appendix.paragraph, 'Methods paragraph')} variant="outline" size="sm" className="border-2 border-field-line font-mono text-xs gap-1.5"><ClipboardCopy className="size-3.5" />Copy as one paragraph</Button>
          <Button onClick={() => copy(appendix.fullText, 'Full appendix')} variant="outline" size="sm" className="border-2 border-field-line font-mono text-xs gap-1.5"><ClipboardCopy className="size-3.5" />Copy with headings</Button>
          <Button onClick={download} variant="outline" size="sm" className="border-2 border-field-line font-mono text-xs gap-1.5"><FileDown className="size-3.5" />Download .txt</Button>
        </div>
        {note && <p className="text-xs font-mono text-field-emerald">{note}</p>}
        {open && (
          <div className="space-y-3 rounded border border-field-line bg-field-panel-strong p-3">
            <p className="text-xs italic text-field-text-muted">{appendix.intro}</p>
            {appendix.sections.map((s) => (
              <div key={s.heading}>
                <p className="font-mono text-xs font-bold text-field-text uppercase">{s.heading}</p>
                <p className="text-sm text-field-text leading-relaxed mt-1">{s.text}</p>
              </div>
            ))}
            <div>
              <p className="font-mono text-xs font-bold text-field-gold uppercase">Limitations</p>
              {appendix.limitations.length === 0
                ? <p className="text-sm text-field-text leading-relaxed mt-1">{NO_LIMITATIONS_NOTE}</p>
                : <ul className="mt-1 space-y-1">{appendix.limitations.map((l) => <li key={l} className="text-sm text-field-text leading-relaxed">• {l}</li>)}</ul>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReportExtrasInner(props: ReportExtrasProps) {
  const { scenario, report, choices, difficulty, meetingTaken, revisionUsed, elapsedMs } = props
  const [earned, setEarned] = useState<string[]>([])
  const [newIds, setNewIds] = useState<string[]>([])
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true
    const ids = evaluateAchievements({ scenario, report, choices, difficulty, meetingTaken, revisionUsed, elapsedMs, history: loadHistory() })
    const { newlyEarned } = recordEarned(ids, scenario.name)
    setEarned(ids)
    setNewIds(newlyEarned)
    // Evaluated once per report screen: recordEarned is idempotent, so a
    // re-render or resume can never award anything twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hints = countHints(choices)
  const deducted = pointsDeducted(report.grades)
  const earnedBadges = ACHIEVEMENTS.filter((a) => earned.includes(a.id))
  const conversations = conversationSummary(scenario, choices)

  return (
    <div className="space-y-4">
      {hints > 0 && (
        <Card className="bg-field-panel/80 border-field-line">
          <CardContent className="pt-4">
            <p className="text-sm text-field-text flex items-center gap-2"><Lightbulb className="size-4 text-field-gold shrink-0" />Hints used: <span className="font-mono font-bold">{hints}</span> · points deducted: <span className="font-mono font-bold">{deducted}</span></p>
          </CardContent>
        </Card>
      )}
      {conversations.length > 0 && (
        <Card className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-sm text-field-blue flex items-center gap-2"><MessageCircle className="size-4" />How the conversations ended</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversations.map((c) => (
              <div key={c.id} className={`rounded border p-2.5 ${MOOD_STYLE[c.mood].box}`}>
                <p className={`text-[10px] font-mono uppercase ${MOOD_STYLE[c.mood].text}`}>{c.name} · {c.role} · {MOOD_STYLE[c.mood].label}</p>
                <p className="text-sm text-field-text mt-1 italic">"{c.text}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card className={`bg-field-panel/80 border-2 ${earnedBadges.length > 0 ? 'border-field-gold glow-gold' : 'border-field-line'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><Award className="size-4" />Achievements this run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-field-text-muted">No badges earned this time. The Badges tab shows what each one takes.</p>
          ) : earnedBadges.map((a) => (
            <div key={a.id} className="rounded border border-field-line bg-field-panel-strong p-2.5">
              <p className="font-mono font-bold text-sm text-field-text flex items-center gap-2">
                <Award className="size-3.5 text-field-gold" />{a.name}
                {newIds.includes(a.id) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-field-gold text-field-bg uppercase tracking-wider">New</span>}
              </p>
              <p className="text-xs text-field-text-muted mt-1">{a.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <MethodsAppendixCard scenario={scenario} report={report} />
    </div>
  )
}

// Stage 1 releases show none of these extras; stage 2 adds them all.
export function ReportExtras(props: ReportExtrasProps) {
  return RELEASE_STAGE >= 2 ? <ReportExtrasInner {...props} /> : null
}
