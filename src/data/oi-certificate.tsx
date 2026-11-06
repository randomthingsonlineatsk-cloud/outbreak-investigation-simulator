import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loadBadges } from './oi-achievements'
import { loadHistory } from './oi-history-tab'
import { CERT_H, CERT_W, TIER_TITLE, buildCertificateSvg, certificateStatus, nextTierNeeds } from './oi-certificate-data'
import { Download, GraduationCap, ImageIcon, FileCode } from 'lucide-react'

const NAME_KEY = 'oi_cert_name_v1'

function loadName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' }
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Rasterize the SVG through a canvas at 2x for a sharp PNG.
async function svgToPng(svg: string, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('The certificate image could not be rendered.'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = CERT_W * scale
    canvas.height = CERT_H * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('The PNG could not be created.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function CertificatePanel() {
  const status = useMemo(() => certificateStatus(loadHistory(), loadBadges()), [])
  const [name, setName] = useState(() => (typeof window !== 'undefined' ? loadName() : ''))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const cleanName = name.trim()
  const next = nextTierNeeds(status)
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const svg = status.tier !== 'none' && cleanName ? buildCertificateSvg(status, cleanName, dateLabel) : null
  const fileBase = `outbreak-simulator-${status.tier}-certificate`

  function updateName(v: string) {
    setName(v)
    try { localStorage.setItem(NAME_KEY, v) } catch { /* ignore */ }
  }

  async function downloadPng() {
    if (!svg) return
    setBusy(true)
    setError(null)
    try { downloadBlob(`${fileBase}.png`, await svgToPng(svg)) } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.') } finally { setBusy(false) }
  }

  function downloadSvg() {
    if (!svg) return
    downloadBlob(`${fileBase}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  }

  return (
    <Card className="bg-field-panel/80 border-2 border-field-gold">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-field-gold flex items-center gap-2"><GraduationCap className="size-4" />Skills Certificate</CardTitle>
        <CardDescription className="text-xs text-field-text-muted">A certificate built from your recorded results. It is issued inside a fictional educational simulation, is based on activity saved in this browser, and is not an accredited qualification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          <span className="text-field-text-muted">Completed: <span className="text-field-text font-bold">{status.completed}</span></span>
          <span className="text-field-text-muted">Correct source: <span className="text-field-text font-bold">{status.correct}</span></span>
          <span className="text-field-text-muted">Different outbreaks: <span className="text-field-text font-bold">{status.distinctCorrect}</span></span>
          <span className="text-field-text-muted">Skill badges: <span className="text-field-text font-bold">{status.skillNames.length}</span></span>
        </div>

        {status.tier === 'none' ? (
          <p className="text-sm text-field-text">Complete your first investigation to unlock a Certificate of Participation.</p>
        ) : (
          <p className="text-sm text-field-text">You have earned the <span className="font-mono font-bold text-field-gold">{TIER_TITLE[status.tier]}</span>.</p>
        )}

        {next && (
          <div className="rounded border border-field-line p-2.5">
            <p className="text-xs font-mono text-field-text-muted uppercase mb-1">To reach the {next.target}</p>
            <ul className="space-y-0.5">{next.needs.map((n) => <li key={n} className="text-xs text-field-text">• {n}</li>)}</ul>
          </div>
        )}

        {status.tier !== 'none' && (
          <>
            <label className="block text-[11px] font-mono text-field-text-muted space-y-1">Name to print on the certificate
              <Input value={name} onChange={(e) => updateName(e.target.value)} maxLength={60} placeholder="Your full name" className="bg-field-panel-strong border-field-line text-field-text" />
            </label>
            {svg ? (
              <div className="space-y-2">
                <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`${TIER_TITLE[status.tier]} for ${cleanName}`} className="w-full rounded border border-field-line" />
                <div className="flex gap-2">
                  <Button onClick={downloadPng} disabled={busy} className="flex-1 bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono gap-1.5"><ImageIcon className="size-4" />{busy ? 'Rendering…' : 'Download PNG'}</Button>
                  <Button onClick={downloadSvg} variant="outline" className="flex-1 border-2 border-field-line font-mono gap-1.5"><FileCode className="size-4" />Download SVG</Button>
                </div>
                <p className="text-[10px] font-mono text-field-text-muted flex items-center gap-1.5"><Download className="size-3" />The SVG is vector and prints cleanly at any size. The PNG suits sharing online.</p>
              </div>
            ) : (
              <p className="text-xs font-mono text-field-text-muted">Enter your name to preview and download the certificate.</p>
            )}
            {error && <p className="text-xs font-mono text-field-red">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
