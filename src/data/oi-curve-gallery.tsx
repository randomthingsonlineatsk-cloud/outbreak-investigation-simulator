import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GALLERY, type CurveAnnotation } from './oi-curve-gallery-data'
import { getScenario } from './oi-scenarios'
import type { EpiCurveDay } from './oi-types'
import { LineChart, ArrowRight, TriangleAlert } from 'lucide-react'

const W = 600
const H = 250
const PAD_L = 28
const PAD_B = 24
const PAD_T = 46

function AnnotatedCurve({ data, annotations, active, onSelect }: { data: EpiCurveDay[]; annotations: CurveAnnotation[]; active: number | null; onSelect: (i: number) => void }) {
  const max = Math.max(...data.map((d) => d.cases), 1)
  const barW = (W - PAD_L - 8) / data.length
  const chartH = H - PAD_B - PAD_T
  const xOf = (day: number) => PAD_L + data.findIndex((d) => d.day === day) * barW + barW / 2
  const topOf = (day: number) => H - PAD_B - ((data.find((d) => d.day === day)?.cases ?? 0) / max) * chartH
  const highlighted = active !== null ? new Set(annotations[active].days) : null

  return (
    <div className="overflow-x-auto rounded border border-field-line">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 360 }}>
        <rect x={0} y={0} width={W} height={H} fill="#0a1015" />
        {data.map((d, i) => {
          const h = (d.cases / max) * chartH
          const dim = highlighted && !highlighted.has(d.day)
          return (
            <g key={d.day}>
              <rect x={PAD_L + i * barW + 3} y={H - PAD_B - h} width={Math.max(barW - 6, 2)} height={h} fill="#e5493c" opacity={dim ? 0.28 : 1} rx={1.5} />
              <text x={PAD_L + i * barW + barW / 2} y={H - 8} fontSize={9} fontFamily="monospace" fill="#9aa5b8" textAnchor="middle">{d.day}</text>
            </g>
          )
        })}
        {annotations.map((a, i) => {
          const cx = a.days.reduce((s, d) => s + xOf(d), 0) / a.days.length
          const cy = 16 + (i % 2) * 20
          const barTop = Math.min(...a.days.map(topOf))
          const isActive = active === i
          return (
            <g key={i} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
              <line x1={cx} y1={cy + 9} x2={cx} y2={Math.max(barTop - 3, cy + 12)} stroke={isActive ? '#f0a838' : '#9aa5b8'} strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={cx} cy={cy} r={9} fill={isActive ? '#f0a838' : '#1a2530'} stroke={isActive ? '#f0a838' : '#9aa5b8'} strokeWidth={1.5} />
              <text x={cx} y={cy + 3.5} fontSize={10} fontFamily="monospace" fontWeight="bold" fill={isActive ? '#0a1015' : '#eef2f7'} textAnchor="middle">{i + 1}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function CurveGalleryPanel({ onPlay }: { onPlay: (scenarioId: string) => void }) {
  const [index, setIndex] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const entry = GALLERY[index]
  const scenario = entry.scenarioId ? getScenario(entry.scenarioId) : undefined

  function choose(i: number) {
    setIndex(i)
    setActive(null)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-field-line glow-red">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-red flex items-center gap-2"><LineChart className="size-4" />Annotated Curve Gallery</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">Eight patterns to know on sight, with numbered callouts. Tap a number, on the curve or in the list, to highlight what it points at. These curves are illustrative: each is stylized to show one pattern clearly and is not data from a specific real outbreak.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {GALLERY.map((g, i) => (
              <Button key={g.id} onClick={() => choose(i)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${i === index ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}>{g.short}</Button>
            ))}
          </div>
          <div>
            <p className="font-mono font-bold text-sm text-field-text">{entry.title}</p>
            <p className="text-xs text-field-text-muted mt-1">{entry.summary}</p>
          </div>
          <AnnotatedCurve data={entry.curve} annotations={entry.annotations} active={active} onSelect={(i) => setActive(active === i ? null : i)} />
          <p className="text-[10px] font-mono text-field-text-muted">X-axis: day. Y-axis: new cases that day.</p>
        </CardContent>
      </Card>

      <Card className="bg-field-panel/80 border-field-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text-muted">What to look at</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {entry.annotations.map((a, i) => (
            <button key={i} onClick={() => setActive(active === i ? null : i)} className={`w-full text-left rounded border p-2.5 transition-colors ${active === i ? 'border-field-gold bg-field-gold-soft' : 'border-field-line hover:border-field-text-muted'}`}>
              <p className="font-mono font-bold text-sm text-field-text flex items-center gap-2"><span className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] ${active === i ? 'bg-field-gold text-field-bg' : 'bg-field-panel-strong text-field-text'}`}>{i + 1}</span>{a.label}</p>
              <p className="text-xs text-field-text-muted mt-1">{a.text}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-field-panel/80 border-field-line">
        <CardContent className="pt-4 space-y-3">
          <div>
            <p className="text-xs font-mono text-field-emerald uppercase mb-1">How to recognize it</p>
            <ul className="space-y-1">{entry.recognize.map((r) => <li key={r} className="text-sm text-field-text">• {r}</li>)}</ul>
          </div>
          <div className="rounded border border-field-gold bg-field-gold-soft p-2.5">
            <p className="text-xs font-mono text-field-gold uppercase mb-1 flex items-center gap-1.5"><TriangleAlert className="size-3" />Common mistake</p>
            <p className="text-sm text-field-text">{entry.pitfall}</p>
          </div>
          {scenario && (
            <Button onClick={() => onPlay(scenario.id)} variant="outline" className="w-full border-2 border-field-red text-field-red font-mono gap-1.5 whitespace-normal h-auto">See it in an investigation: {scenario.name} <ArrowRight className="size-4 shrink-0" /></Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
