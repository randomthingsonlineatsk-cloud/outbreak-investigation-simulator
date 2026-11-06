import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loadBadges } from './oi-achievements'
import { loadHistory } from './oi-history-tab'
import { buildSummaryModel, pdfSafe } from './oi-summary-data'
import { buildSummaryPdf } from './oi-summary-pdf'
import { ClipboardCopy, FileDown, FileText } from 'lucide-react'

// Same key as the certificate, so the name is entered once.
const NAME_KEY = 'oi_cert_name_v1'

function loadName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' }
}

export function SummaryPanel() {
  const history = useMemo(() => loadHistory(), [])
  const badges = useMemo(() => loadBadges(), [])
  const [name, setName] = useState(() => (typeof window !== 'undefined' ? loadName() : ''))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const model = useMemo(() => buildSummaryModel(history, badges, name, dateLabel), [history, badges, name, dateLabel])
  const cleanName = name.trim()
  const unencodable = pdfSafe(cleanName).replaced
  const ready = model.completed > 0 && cleanName.length > 0

  function updateName(v: string) {
    setName(v)
    try { localStorage.setItem(NAME_KEY, v) } catch { /* ignore */ }
  }

  async function downloadPdf() {
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      const { bytes, hiddenOutbreaks } = await buildSummaryPdf(model)
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'field-epidemiology-skills-summary.pdf'
      a.click()
      URL.revokeObjectURL(url)
      if (hiddenOutbreaks > 0) setNote(`The one-page PDF lists your top outbreaks by score and notes that ${hiddenOutbreaks} more were solved.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The PDF could not be created.')
    } finally {
      setBusy(false)
    }
  }

  async function copyNarrative() {
    setError(null)
    try {
      await navigator.clipboard.writeText(model.narrative)
      setNote('Summary paragraph copied.')
    } catch {
      setError('Copying is not available here. Select the paragraph above and copy it manually.')
    }
  }

  return (
    <Card className="bg-field-panel/80 border-2 border-field-teal">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><FileText className="size-4" />Skills Summary (PDF)</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">A one-page summary of the outbreaks you solved and the skills you demonstrated, with a short paragraph you can adapt for a CV or portfolio. It comes from your recorded results, so it reflects what you have actually done in this browser, and it is not an accredited qualification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {model.completed === 0 ? (
          <p className="text-sm text-field-text">Complete an investigation to generate a summary.</p>
        ) : (
          <>
            <div className="rounded border border-field-line bg-field-panel-strong p-2.5">
              <p className="text-[10px] font-mono uppercase text-field-text-muted mb-1">Summary paragraph</p>
              <p className="text-sm text-field-text leading-relaxed">{model.narrative}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-mono text-field-text-muted">
              <span>Skills listed: <span className="text-field-text font-bold">{model.skills.length}</span></span>
              <span>Outbreaks solved: <span className="text-field-text font-bold">{model.solved.length}</span></span>
            </div>
            <label className="block text-[11px] font-mono text-field-text-muted space-y-1">Name to print on the summary
              <Input value={name} onChange={(e) => updateName(e.target.value)} maxLength={60} placeholder="Your full name" className="bg-field-panel-strong border-field-line text-field-text" />
            </label>
            {unencodable > 0 && <p className="text-[11px] font-mono text-field-gold">{unencodable} character{unencodable === 1 ? '' : 's'} in this name cannot be shown in the PDF's built-in font and will print as "?". The PNG and SVG certificate above handle any characters.</p>}
            <div className="flex gap-2">
              <Button onClick={downloadPdf} disabled={!ready || busy} className="flex-1 bg-field-teal text-field-bg hover:bg-field-teal/90 font-mono gap-1.5"><FileDown className="size-4" />{busy ? 'Building…' : 'Download PDF'}</Button>
              <Button onClick={copyNarrative} variant="outline" className="flex-1 border-2 border-field-line font-mono gap-1.5"><ClipboardCopy className="size-4" />Copy paragraph</Button>
            </div>
            {!ready && <p className="text-xs font-mono text-field-text-muted">Enter your name to enable the PDF.</p>}
            {note && <p className="text-xs font-mono text-field-emerald">{note}</p>}
            {error && <p className="text-xs font-mono text-field-red">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
