import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ALL_CARDS, CARD_GROUPS, MASTERED_BOX, boxOf, buildDeck, loadBoxes, masteredCount, nextBox, saveBoxes,
  type Boxes, type Flashcard,
} from './oi-flashcards-data'
import { Layers, RotateCcw, Check, X, Eye } from 'lucide-react'

export function FlashcardsTab({ initialGroup }: { initialGroup: string | null }) {
  const [boxes, setBoxes] = useState<Boxes>(() => (typeof window !== 'undefined' ? loadBoxes() : {}))
  const [group, setGroup] = useState<string>(initialGroup ?? 'all')
  const [hideMastered, setHideMastered] = useState(true)
  // The deck is built on the client only. Its order is random, so building it
  // during server rendering would not match what the client builds.
  const [deck, setDeck] = useState<Flashcard[] | null>(null)
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  function startSession(g: string, hide: boolean, b: Boxes) {
    setDeck(buildDeck(ALL_CARDS, b, g, hide))
    setPos(0)
    setFlipped(false)
  }

  // Rebuild when the group or the hide-known setting changes (not on every
  // grade, which would reshuffle the deck mid-session).
  useEffect(() => {
    startSession(group, hideMastered, boxes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, hideMastered])

  // Arriving from the Self-Check tab with a suggested group.
  useEffect(() => {
    if (initialGroup) setGroup(initialGroup)
  }, [initialGroup])

  function grade(gotIt: boolean) {
    if (!deck) return
    const card = deck[pos]
    const updated = { ...boxes, [card.id]: nextBox(boxOf(boxes, card.id), gotIt) }
    setBoxes(updated)
    saveBoxes(updated)
    setPos(pos + 1)
    setFlipped(false)
  }

  function resetProgress() {
    setBoxes({})
    saveBoxes({})
    setConfirmReset(false)
    startSession(group, hideMastered, {})
  }

  const mastered = masteredCount(ALL_CARDS, boxes)
  const box2 = ALL_CARDS.filter((c) => boxOf(boxes, c.id) === 2).length
  const box1 = ALL_CARDS.length - mastered - box2
  const finished = deck !== null && pos >= deck.length
  const card = deck && !finished ? deck[pos] : null

  return (
    <div className="space-y-4">
      <Card className="bg-field-panel/80 border-2 border-field-violet glow-violet">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Layers className="size-4" />Flashcards</CardTitle>
          <CardDescription className="text-xs text-field-text-muted">{ALL_CARDS.length} cards covering the glossary, the real-world case studies, and the bias and statistics ideas from the newer outbreaks. Cards you miss come back sooner; cards you know are hidden until the rest are learned.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-3 text-xs font-mono">
            <span className="text-field-emerald">Known: {mastered}</span>
            <span className="text-field-gold">Learning: {box2}</span>
            <span className="text-field-text-muted">New or missed: {box1}</span>
          </div>
          <div className="h-1.5 rounded-full bg-field-panel-strong overflow-hidden"><div className="h-full bg-field-emerald" style={{ width: `${(mastered / ALL_CARDS.length) * 100}%` }} /></div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => setGroup('all')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${group === 'all' ? 'border-field-violet text-field-violet' : 'border-field-line text-field-text-muted'}`}>All ({ALL_CARDS.length})</Button>
        {CARD_GROUPS.map((g) => (
          <Button key={g} onClick={() => setGroup(g)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${group === g ? 'border-field-violet text-field-violet' : 'border-field-line text-field-text-muted'}`}>{g} ({ALL_CARDS.filter((c) => c.group === g).length})</Button>
        ))}
      </div>
      <Button onClick={() => setHideMastered((v) => !v)} variant="ghost" size="sm" className="text-field-text-muted font-mono text-xs">{hideMastered ? 'Hiding cards you know. Show them too' : 'Showing cards you know. Hide them'}</Button>

      {deck === null && <p className="text-sm text-field-text-muted font-mono">Shuffling the deck…</p>}

      {card && deck && (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-field-text-muted">
            <span>Card {pos + 1} of {deck.length}</span>
            <span>{card.group} · box {boxOf(boxes, card.id)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-field-panel-strong overflow-hidden"><div className="h-full bg-field-violet" style={{ width: `${(pos / deck.length) * 100}%` }} /></div>
          <Card className="bg-field-panel/80 border-2 border-field-line min-h-[190px]">
            <CardContent className="pt-6 space-y-3">
              <p className="font-mono font-bold text-lg text-field-text">{card.front}</p>
              {flipped ? (
                <p className="text-sm text-field-text leading-relaxed border-t border-field-line pt-3" style={{ animation: 'fadeInUp 0.2s ease-out' }}>{card.back}</p>
              ) : (
                <p className="text-xs font-mono text-field-text-muted">Try to recall it, then check.</p>
              )}
            </CardContent>
          </Card>
          {!flipped ? (
            <Button onClick={() => setFlipped(true)} className="w-full bg-field-violet text-field-bg hover:bg-field-violet/90 font-mono gap-1.5"><Eye className="size-4" />Show the answer</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => grade(false)} variant="outline" className="flex-1 border-2 border-field-red text-field-red font-mono gap-1.5"><X className="size-4" />Again</Button>
              <Button onClick={() => grade(true)} className="flex-1 bg-field-emerald text-field-bg hover:bg-field-emerald/90 font-mono gap-1.5"><Check className="size-4" />Got it</Button>
            </div>
          )}
        </div>
      )}

      {finished && deck && (
        <Card className="bg-field-panel/80 border-2 border-field-emerald glow-emerald">
          <CardContent className="pt-4 space-y-3">
            <p className="font-mono font-bold text-field-text">Deck complete: {deck.length} card{deck.length === 1 ? '' : 's'} reviewed.</p>
            <p className="text-sm text-field-text-muted">{mastered === ALL_CARDS.length ? 'You know every card. Turn off "hide" to keep reviewing.' : `${ALL_CARDS.length - mastered} card${ALL_CARDS.length - mastered === 1 ? '' : 's'} still to learn. Another pass brings the ones you missed back first.`}</p>
            <Button onClick={() => startSession(group, hideMastered, boxes)} className="w-full bg-field-emerald text-field-bg hover:bg-field-emerald/90 font-mono gap-1.5"><RotateCcw className="size-4" />Study again</Button>
          </CardContent>
        </Card>
      )}

      <div className="pt-2">
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-field-text">Reset all flashcard progress?</span>
            <Button onClick={resetProgress} size="sm" className="bg-field-red text-field-bg hover:bg-field-red/90 font-mono h-7">Yes, reset</Button>
            <Button onClick={() => setConfirmReset(false)} size="sm" variant="ghost" className="text-field-text-muted font-mono h-7">Cancel</Button>
          </div>
        ) : (
          <Button onClick={() => setConfirmReset(true)} variant="ghost" size="sm" className="text-field-text-muted font-mono text-xs">Reset progress</Button>
        )}
      </div>
      <p className="text-[10px] font-mono text-field-text-muted">A card counts as known after you mark it "Got it" in {MASTERED_BOX - 1} separate sessions in a row. Progress is saved on this device.</p>
    </div>
  )
}
