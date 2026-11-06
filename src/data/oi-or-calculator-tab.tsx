import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { computeOddsRatioCI } from './oi-engine'
import { Calculator } from 'lucide-react'

// ---------------------------------------------------------------------------
// A free-form 2x2 case-control table where the numbers can be plugged in
// directly, with the odds ratio and 95% CI computed live — a reusable
// teaching tool independent of any specific scenario.
// ---------------------------------------------------------------------------

export function OddsRatioCalculatorTab() {
  const [casesExposed, setCasesExposed] = useState(20)
  const [casesUnexposed, setCasesUnexposed] = useState(10)
  const [controlsExposed, setControlsExposed] = useState(10)
  const [controlsUnexposed, setControlsUnexposed] = useState(20)

  const ci = computeOddsRatioCI({ casesExposed, casesUnexposed, controlsExposed, controlsUnexposed })
  const totalCases = casesExposed + casesUnexposed
  const totalControls = controlsExposed + controlsUnexposed

  function numField(label: string, value: number, setValue: (n: number) => void) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-mono text-field-text-muted">{label}</p>
        <Input type="number" min={0} value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className="bg-field-panel-strong border-field-line text-field-text font-mono" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-field-line glow-teal">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-teal flex items-center gap-2"><Calculator className="size-4" />Odds Ratio Calculator</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">Plug in your own 2×2 case-control numbers and see the odds ratio, 95% CI, and significance computed live.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {numField('Cases exposed', casesExposed, setCasesExposed)}
            {numField('Cases unexposed', casesUnexposed, setCasesUnexposed)}
            {numField('Controls exposed', controlsExposed, setControlsExposed)}
            {numField('Controls unexposed', controlsUnexposed, setControlsUnexposed)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="text-field-text-muted border-b border-field-line">
                  <th className="text-left py-1.5"></th>
                  <th className="text-right py-1.5 px-2">Cases</th>
                  <th className="text-right py-1.5 px-2">Controls</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-field-line/50">
                  <td className="py-1.5 text-field-text">Exposed</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{casesExposed}</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{controlsExposed}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-field-text">Unexposed</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{casesUnexposed}</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{controlsUnexposed}</td>
                </tr>
                <tr className="border-t border-field-line">
                  <td className="py-1.5 text-field-text-muted">Total</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{totalCases}</td>
                  <td className="text-right py-1.5 px-2 text-field-text-muted">{totalControls}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="rounded border border-field-gold bg-field-gold-soft p-3 space-y-1">
            <p className="font-mono text-xs text-field-text-muted uppercase">Odds ratio</p>
            <p className="font-mono text-2xl font-bold text-field-gold">{isFinite(ci.or) ? ci.or.toFixed(2) : '∞'}</p>
            <p className="text-xs font-mono text-field-text-muted">95% CI: {ci.lower.toFixed(2)} – {isFinite(ci.upper) ? ci.upper.toFixed(2) : '∞'} · {ci.significant ? <span className="text-field-emerald">statistically significant</span> : <span className="text-field-text-muted">not significant (CI includes 1)</span>}</p>
          </div>
          <p className="text-[10px] font-mono text-field-text-muted">OR = (cases exposed × controls unexposed) ÷ (controls exposed × cases unexposed). CI via Woolf's log method. Try it: keep the OR fixed but shrink all four counts proportionally — watch the CI widen even though the point estimate doesn't move.</p>
        </CardContent>
      </Card>
    </div>
  )
}
