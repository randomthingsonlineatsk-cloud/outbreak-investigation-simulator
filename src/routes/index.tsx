import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PlayTab } from '@/data/oi-play-tab'
import { LeaderboardTab, GlossaryTab } from '@/data/oi-leaderboard-glossary-tabs'
import { HistoryTab } from '@/data/oi-history-tab'
import { CurvesTab } from '@/data/oi-curves-tab'
import { OddsRatioCalculatorTab } from '@/data/oi-or-calculator-tab'
import { DepartmentTab } from '@/data/oi-department-tab'
import { WeeklyTab } from '@/data/oi-weekly-tab'
import { BadgesTab } from '@/data/oi-badges-tab'
import { SelfCheckTab } from '@/data/oi-selfcheck-tab'
import { FlashcardsTab } from '@/data/oi-flashcards-tab'
import { RELEASE_STAGE } from '@/data/oi-release'
import { TabButton } from '@/data/oi-shared-ui'
import { TutorialOverlay } from '@/data/oi-tutorial'
import { Microscope, BookOpen, Trophy, History as HistoryIcon, Biohazard, LineChart, Zap, Calculator, Building2, CalendarDays, Award, ClipboardCheck, Layers } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

type Tab = 'play' | 'weekly' | 'department' | 'selfcheck' | 'flashcards' | 'glossary' | 'leaderboard' | 'history' | 'curves' | 'calculator' | 'badges'

// Stage 1 shows roadmap items 1 to 30. Stage 2 (see oi-release.ts) adds the
// tabs marked below.
const STAGE_2 = RELEASE_STAGE >= 2

function App() {
  const [tab, setTab] = useState<Tab>('play')
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null)
  const [flashcardGroup, setFlashcardGroup] = useState<string | null>(null)

  // Used by the Department, Weekly, Self-Check, and Curves tabs to jump into
  // a specific scenario.
  function handlePlayScenario(scenarioId: string) {
    setPendingScenarioId(scenarioId)
    setTab('play')
  }

  // Used by the Self-Check tab to open the flashcards for a weak area.
  function handleOpenFlashcards(group: string) {
    setFlashcardGroup(group)
    setTab('flashcards')
  }

  return (
    <div className="min-h-screen bg-field-bg text-field-text">
      <TutorialOverlay />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border-2 border-field-red bg-field-red-soft text-field-red glow-red animate-pulse-glow"><Biohazard className="size-5" /></span>
            <div>
              <p className="text-xs uppercase tracking-widest font-mono text-field-red">Outbreak Investigation Simulator</p>
              <h1 className="text-xl font-mono font-bold text-field-text">Find the source. Stop the spread.</h1>
            </div>
          </div>
          <p className="text-sm text-field-text-muted">Investigate a fictional outbreak from confirmation through case definition, epidemic-curve reading, a real case-control odds-ratio analysis, and control measures.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === 'play'} onClick={() => setTab('play')} icon={Microscope}>Investigate</TabButton>
          {STAGE_2 && <TabButton active={tab === 'weekly'} onClick={() => setTab('weekly')} icon={CalendarDays}>This Week</TabButton>}
          <TabButton active={tab === 'department'} onClick={() => setTab('department')} icon={Building2}>Department</TabButton>
          {STAGE_2 && <TabButton active={tab === 'selfcheck'} onClick={() => setTab('selfcheck')} icon={ClipboardCheck}>Self-Check</TabButton>}
          {STAGE_2 && <TabButton active={tab === 'flashcards'} onClick={() => setTab('flashcards')} icon={Layers}>Flashcards</TabButton>}
          <TabButton active={tab === 'curves'} onClick={() => setTab('curves')} icon={STAGE_2 ? LineChart : Zap}>{STAGE_2 ? 'Curves' : 'Curve Quiz'}</TabButton>
          <TabButton active={tab === 'calculator'} onClick={() => setTab('calculator')} icon={Calculator}>OR Calculator</TabButton>
          {STAGE_2 && <TabButton active={tab === 'badges'} onClick={() => setTab('badges')} icon={Award}>Badges</TabButton>}
          <TabButton active={tab === 'glossary'} onClick={() => setTab('glossary')} icon={BookOpen}>Glossary</TabButton>
          <TabButton active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} icon={Trophy}>Leaderboard</TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={HistoryIcon}>History</TabButton>
        </div>

        {tab === 'play' && <PlayTab pendingScenarioId={pendingScenarioId} onConsumePending={() => setPendingScenarioId(null)} />}
        {STAGE_2 && tab === 'weekly' && <WeeklyTab onPlay={handlePlayScenario} />}
        {tab === 'department' && <DepartmentTab onPlayAlert={handlePlayScenario} />}
        {STAGE_2 && tab === 'selfcheck' && <SelfCheckTab onPlay={handlePlayScenario} onOpenFlashcards={handleOpenFlashcards} />}
        {STAGE_2 && tab === 'flashcards' && <FlashcardsTab initialGroup={flashcardGroup} />}
        {tab === 'curves' && <CurvesTab onPlay={handlePlayScenario} />}
        {tab === 'calculator' && <OddsRatioCalculatorTab />}
        {STAGE_2 && tab === 'badges' && <BadgesTab />}
        {tab === 'glossary' && <GlossaryTab />}
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'history' && <HistoryTab />}

        <p className="text-center text-xs text-field-text-muted font-mono">All outbreaks, settings, and case data are entirely fictional — an educational simulation, not public health guidance.</p>
        <p className="text-center text-xs text-field-text-muted font-mono">built by Khan Gulrez Shagufa Fazal Ahmed</p>
      </div>
    </div>
  )
}
