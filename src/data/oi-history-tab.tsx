import { useEffect, useState } from 'react'
import { api, useMutation, useQuery } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENARIOS } from './oi-scenarios'
import { Trophy } from 'lucide-react'

const HISTORY_KEY = 'oi_history_v1'
const SYNC_CODE_KEY = 'oi_sync_code_v1'

export interface RunEntry { ts: number; scenarioId: string; scenarioName: string; verdict: string; score: number; maxScore: number }

export function loadHistory(): RunEntry[] { try { const raw = localStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] } }
function saveHistory(h: RunEntry[]) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-300))) } catch { /* ignore */ } }
export function appendHistory(e: RunEntry) { const h = loadHistory(); h.push(e); saveHistory(h) }
function loadSyncCode(): string | null { try { return localStorage.getItem(SYNC_CODE_KEY) } catch { return null } }
function saveSyncCode(code: string) { try { localStorage.setItem(SYNC_CODE_KEY, code) } catch { /* ignore */ } }

interface Badge { key: string; label: string; icon: string; earned: boolean; hint: string }
function computeBadges(history: RunEntry[]): Badge[] {
  const runs = history.length
  const identified = history.filter((h) => h.verdict === 'source_identified' || h.verdict === 'source_identified_with_gaps').length
  const scenariosTried = new Set(history.map((h) => h.scenarioId)).size
  return [
    { key: 'first_run', label: 'First Investigation', icon: '🔎', earned: runs >= 1, hint: 'Complete 1 investigation' },
    { key: 'first_id', label: 'Source Identified', icon: '🧫', earned: identified >= 1, hint: 'Correctly identify a vehicle' },
    { key: 'all_scenarios', label: 'Field Veteran', icon: '🗺️', earned: scenariosTried >= SCENARIOS.length, hint: `Investigate every outbreak (${scenariosTried}/${SCENARIOS.length})` },
    { key: 'five_runs', label: 'Five Investigations', icon: '📋', earned: runs >= 5, hint: `Complete 5 investigations (${runs}/5)` },
  ]
}

export function HistoryTab() {
  const [history, setHistory] = useState<RunEntry[]>(() => (typeof window !== 'undefined' ? loadHistory() : []))
  const [syncCode, setSyncCode] = useState<string | null>(() => (typeof window !== 'undefined' ? loadSyncCode() : null))
  const [syncInput, setSyncInput] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [pullTarget, setPullTarget] = useState<string | null>(null)

  const generateCode = useMutation(api.sync.generate)
  const pushSync = useMutation(api.sync.push)
  const pullResult = useQuery(api.sync.pull, pullTarget ? { code: pullTarget } : 'skip')

  useEffect(() => {
    if (pullResult === undefined || pullResult === null) return
    try {
      const pulled = JSON.parse(pullResult.historyJson) as RunEntry[]
      saveHistory(pulled); setHistory(pulled)
      if (pullTarget) { saveSyncCode(pullTarget); setSyncCode(pullTarget) }
      setSyncMessage(`Loaded ${pulled.length} runs from code ${pullTarget}.`)
    } catch { setSyncMessage('Could not read data from that code.') }
    setSyncBusy(false); setPullTarget(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullResult])

  async function handleGenerate() {
    setSyncBusy(true); setSyncMessage(null)
    try {
      const code = await generateCode({})
      saveSyncCode(code); setSyncCode(code)
      await pushSync({ code, historyJson: JSON.stringify(loadHistory()) })
      setSyncMessage('Sync code created and current history pushed.')
    } catch { setSyncMessage('Could not generate a sync code — try again.') }
    setSyncBusy(false)
  }
  function handlePull() {
    const code = syncInput.trim().toUpperCase()
    if (code.length < 4) return
    setSyncBusy(true); setSyncMessage(null); setPullTarget(code)
  }

  const badges = computeBadges(history)
  const identified = history.filter((h) => h.verdict === 'source_identified' || h.verdict === 'source_identified_with_gaps').length

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-field-line glow-red">
        <CardContent className="pt-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs font-mono text-field-text-muted">Investigations completed</p><p className="text-2xl font-mono text-field-red">{history.length}</p></div>
          <div><p className="text-xs font-mono text-field-text-muted">Sources identified</p><p className="text-2xl font-mono text-field-red">{identified}</p></div>
        </CardContent>
      </Card>
      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text-muted flex items-center gap-2"><Trophy className="size-4 text-field-gold" />Field Badges</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => (
              <div key={b.key} className={`rounded-md border p-2 text-center ${b.earned ? 'border-field-gold bg-field-gold-soft glow-gold' : 'border-field-line opacity-40'}`} title={b.hint}>
                <div className="text-xl">{b.icon}</div>
                <p className="text-[10px] font-mono text-field-text mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text-muted">Sync across devices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-field-text-muted">No account needed — a short code links this device's history to any other device.</p>
          {syncCode ? (
            <div className="rounded-md border border-field-gold bg-field-gold-soft p-2 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-mono text-field-gold">Your sync code: <span className="font-bold">{syncCode}</span></p>
              <Button onClick={() => navigator.clipboard?.writeText(syncCode)} size="sm" variant="outline" className="border-2 border-field-gold text-field-gold font-mono">Copy</Button>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={syncBusy} size="sm" className="bg-field-red text-field-bg hover:bg-field-red/90 font-mono">{syncBusy ? 'Generating…' : 'Generate my sync code'}</Button>
          )}
          <div className="flex gap-2">
            <Input value={syncInput} onChange={(e) => setSyncInput(e.target.value.toUpperCase())} placeholder="Enter a code from another device" maxLength={8} className="bg-field-panel-strong border-field-line text-field-text font-mono" />
            <Button onClick={handlePull} disabled={syncBusy || syncInput.trim().length < 4} variant="outline" className="border-2 border-field-line font-mono">Load</Button>
          </div>
          {syncMessage && <p className="text-xs font-mono text-field-text-muted">{syncMessage}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
