import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CurveGalleryPanel } from './oi-curve-gallery'
import { CurveQuizTab } from './oi-curve-quiz-tab'
import { RELEASE_STAGE } from './oi-release'
import { BookImage, Zap } from 'lucide-react'

// Stage 1 is the rapid-fire curve quiz (roadmap item 24). Stage 2 adds the
// annotated gallery (item 50) beside it: learn the patterns, then test them.
export function CurvesTab({ onPlay }: { onPlay: (scenarioId: string) => void }) {
  const [view, setView] = useState<'gallery' | 'quiz'>('gallery')
  if (RELEASE_STAGE < 2) return <CurveQuizTab />
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setView('gallery')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${view === 'gallery' ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}><BookImage className="size-3.5" />Gallery: learn the patterns</Button>
        <Button onClick={() => setView('quiz')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${view === 'quiz' ? 'border-field-gold text-field-gold glow-gold' : 'border-field-line text-field-text-muted'}`}><Zap className="size-3.5" />Quiz: test yourself</Button>
      </div>
      {view === 'gallery' ? <CurveGalleryPanel onPlay={onPlay} /> : <CurveQuizTab />}
    </div>
  )
}
