import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, FileSearch, LineChart, Lightbulb, Microscope, Table2, Siren, MessageSquare } from 'lucide-react'

const TUTORIAL_SEEN_KEY = 'oi_tutorial_seen_v1'

function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1' } catch { return false }
}
function markTutorialSeen() {
  try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1') } catch { /* ignore */ }
}

const STEPS = [
  { Icon: ShieldCheck, title: 'Confirm', body: 'Compare the case count against baseline and decide whether a formal investigation is warranted.' },
  { Icon: FileSearch, title: 'Case Definition', body: 'Set clinical, time, and place criteria that balance sensitivity against specificity.' },
  { Icon: LineChart, title: 'Descriptive', body: 'Read the epidemic curve (and, where available, a spot map or transmission chain) to classify how the disease is spreading.' },
  { Icon: Lightbulb, title: 'Hypothesis', body: 'Prioritize which categories of exposure to chase, and build a systematic line listing.' },
  { Icon: Microscope, title: 'Inspection', body: 'Collect and properly handle physical evidence to back up the eventual conclusion.' },
  { Icon: Table2, title: 'Analytic', body: 'Interpret a real case-control table — odds ratios, confidence intervals, and sometimes dose-response or stratified data — to identify the vehicle.' },
  { Icon: Siren, title: 'Control', body: 'Recommend the measure that actually matches the confirmed transmission route.' },
  { Icon: MessageSquare, title: 'Communication & Report', body: 'Draft a public statement, then receive a full field investigation report you can download.' },
]

export function TutorialOverlay() {
  // Starts hidden so server and client markup match; shown after mount if unseen.
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => { if (!hasSeenTutorial()) setDismissed(false) }, [])
  if (dismissed) return null

  function close() {
    markTutorialSeen()
    setDismissed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
      <Card className="bg-field-panel border-2 border-field-red glow-red max-w-md w-full max-h-[85vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-base text-field-red">Welcome, investigator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-field-text">Every outbreak moves through the same field-epidemiology sequence:</p>
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3 items-start">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-field-line bg-field-panel-strong text-field-red"><s.Icon className="size-4" /></span>
              <div>
                <p className="font-mono font-bold text-sm text-field-text">{s.title}</p>
                <p className="text-xs text-field-text-muted">{s.body}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-field-text-muted font-mono">Once a stage is locked in, it can't be undone — only built on, just like a real investigation.</p>
          <Button onClick={close} className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono">Got it — let's start</Button>
        </CardContent>
      </Card>
    </div>
  )
}
