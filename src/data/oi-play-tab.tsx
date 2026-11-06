import { useEffect, useState } from 'react'
import { api, useMutation, useQuery } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENARIOS, getScenario } from './oi-scenarios'
import { generateScenario, GENERATOR_ARCHETYPE_COUNT } from './oi-generator'
import { freshNumbersScenario, isRandomizable } from './oi-randomize'
import { RELEASE_STAGE } from './oi-release'
import { AUTHORITIES, getAuthority } from './oi-authorities'
import { gradeStage, runStage, reviewVerdict, computeAttackRate, runReviewMeeting, type MeetingFeedback } from './oi-engine'
import { applyHintPenalty } from './oi-hints'
import { ReportExtras } from './oi-report-extras'
import { buildInvestigationReportDocx } from './oi-report-export'
import { OutbreakGrowthTimer, elapsedGrowthCases, formatElapsed } from './oi-time-pressure'
import { saveDepartmentResult } from './oi-department-tab'
import type { Choices, FinalReport, FinalVerdict, Grade, Scenario, StageOutcome } from './oi-types'
import { DecisionForm, ProgressTracker, type Step, type Difficulty } from './oi-decision-form'
import { StageResultView } from './oi-stage-result'
import { downloadTextFile, GradeRow, EpiCurveChart, NetworkDiagram, SpotMapCard, PersonBreakdownCard, OddsRatioTable, CohortComparisonCard, DoseResponseCard, StratifiedAnalysisCard, CaseDefinitionSensitivityCard } from './oi-shared-ui'
import { appendHistory } from './oi-history-tab'
import {
  FlaskConical, ShieldCheck, ShieldAlert, CircleAlert, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft,
  BookOpen, Dna, Globe2, Trophy, FileText, FileType, X, History as HistoryIcon, Users, Search, Zap, Shuffle,
} from 'lucide-react'

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const STAMP_LABEL: Record<FinalVerdict, string> = {
  source_identified: 'CASE CLOSED',
  source_identified_with_gaps: 'CLOSED — SEE NOTES',
  misidentified: 'WRONG LEAD',
  inconclusive: 'UNRESOLVED',
}

function VerdictStamp({ verdict, colorClass }: { verdict: FinalVerdict; colorClass: string }) {
  return (
    <div className={`absolute top-3 right-3 border-4 rounded-md px-2.5 py-1 font-mono font-black text-[11px] tracking-widest uppercase opacity-80 pointer-events-none select-none ${colorClass}`} style={{ transform: 'rotate(-8deg)' }}>
      {STAMP_LABEL[verdict]}
    </div>
  )
}

const ACTIVE_RUN_KEY = 'oi_active_run_v1'
type PlayMode = 'curated' | 'endless'
interface SavedRun {
  authorityKey: string; difficulty: Difficulty; scenario: Scenario; step: Step; choices: Choices
  grades: Grade[]; outcomes: Record<string, StageOutcome>; report: FinalReport | null
  meetingTaken: boolean; meetingFeedback: MeetingFeedback | null; revisionUsed: boolean
  timePressure: boolean; startedAtMs: number | null
}
function saveActiveRun(run: SavedRun) { try { localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run)) } catch { /* ignore */ } }
function loadActiveRun(): SavedRun | null { try { const raw = localStorage.getItem(ACTIVE_RUN_KEY); return raw ? JSON.parse(raw) : null } catch { return null } }
function clearActiveRun() { try { localStorage.removeItem(ACTIVE_RUN_KEY) } catch { /* ignore */ } }

export function PlayTab({ pendingScenarioId, onConsumePending }: { pendingScenarioId?: string | null; onConsumePending?: () => void }) {
  const [mode, setMode] = useState<PlayMode>('curated')
  const [difficulty, setDifficulty] = useState<Difficulty>('guided')
  const [timePressure, setTimePressure] = useState(false)
  const [freshNumbers, setFreshNumbers] = useState(false)
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const [endedAtMs, setEndedAtMs] = useState<number | null>(null)
  const [authorityKey, setAuthorityKey] = useState('CDC')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [choices, setChoices] = useState<Choices>({})
  const [grades, setGrades] = useState<Grade[]>([])
  const [outcomes, setOutcomes] = useState<Record<string, StageOutcome>>({})
  const [report, setReport] = useState<FinalReport | null>(null)
  const [meetingTaken, setMeetingTaken] = useState(false)
  const [meetingFeedback, setMeetingFeedback] = useState<MeetingFeedback | null>(null)
  const [revisionUsed, setRevisionUsed] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [docBusy, setDocBusy] = useState(false)
  const [resumeAvailable, setResumeAvailable] = useState<SavedRun | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = loadActiveRun()
    return saved && saved.step !== 'select' ? saved : null
  })

  const submitScore = useMutation(api.leaderboard.submit)

  // Entry from the Weekly and Department tabs: always the fixed scenario, so
  // everyone playing the weekly outbreak sees identical numbers.
  useEffect(() => {
    if (pendingScenarioId) {
      const s = getScenario(pendingScenarioId)
      if (s) pickScenario(s)
      onConsumePending?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScenarioId])

  useEffect(() => {
    if (typeof window === 'undefined' || !scenario || step === 'select') return
    saveActiveRun({ authorityKey, difficulty, scenario, step, choices, grades, outcomes, report, meetingTaken, meetingFeedback, revisionUsed, timePressure, startedAtMs })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorityKey, difficulty, scenario, step, choices, grades, outcomes, report, meetingTaken, meetingFeedback, revisionUsed, timePressure, startedAtMs])

  function resumeSavedRun() {
    if (!resumeAvailable) return
    const r = resumeAvailable
    setAuthorityKey(r.authorityKey); setDifficulty(r.difficulty ?? 'guided'); setScenario(r.scenario); setStep(r.step); setChoices(r.choices); setGrades(r.grades); setOutcomes(r.outcomes); setReport(r.report)
    setMeetingTaken(r.meetingTaken ?? false); setMeetingFeedback(r.meetingFeedback ?? null); setRevisionUsed(r.revisionUsed ?? false)
    setTimePressure(r.timePressure ?? false); setStartedAtMs(r.startedAtMs ?? null)
    setResumeAvailable(null)
  }
  function discardSavedRun() { clearActiveRun(); setResumeAvailable(null) }

  function pickScenario(s: Scenario) {
    setScenario(s); setStep('brief'); setChoices({}); setGrades([]); setOutcomes({}); setReport(null); setScoreSubmitted(false); setMeetingTaken(false); setMeetingFeedback(null); setRevisionUsed(false)
    setStartedAtMs(timePressure ? Date.now() : null); setEndedAtMs(null)
  }
  // Picking from the curated list: optionally re-roll the numbers.
  function pickCurated(s: Scenario) { pickScenario(freshNumbers ? freshNumbersScenario(s) : s) }
  function pickGenerated() { pickScenario(generateScenario()) }
  function startOver() {
    clearActiveRun()
    setScenario(null); setStep('select'); setChoices({}); setGrades([]); setOutcomes({}); setReport(null); setScoreSubmitted(false); setMeetingTaken(false); setMeetingFeedback(null); setRevisionUsed(false)
    setStartedAtMs(null); setEndedAtMs(null)
  }

  function submitStage(stageKey: 'confirm' | 'case_definition' | 'descriptive' | 'hypothesis' | 'inspection' | 'analytic' | 'control' | 'communication', nextStep: Step) {
    if (!scenario) return
    // Hints cost 1 point per decision where the answer earned points.
    const g = applyHintPenalty(gradeStage(scenario, stageKey, choices), choices)
    const newGrades = [...grades.filter((x) => x.stage !== stageKey), ...g]
    setGrades(newGrades)
    setOutcomes((prev) => ({ ...prev, [stageKey]: runStage(scenario, stageKey, g) }))
    if (stageKey === 'communication') {
      const finalReport = reviewVerdict(scenario, newGrades, authorityKey)
      setReport(finalReport)
      if (timePressure) setEndedAtMs(Date.now())
      if (typeof window !== 'undefined') {
        appendHistory({ ts: Date.now(), scenarioId: scenario.id, scenarioName: scenario.name, verdict: finalReport.verdict, score: finalReport.score, maxScore: finalReport.maxScore })
        saveDepartmentResult(scenario.id, { verdict: finalReport.verdict, score: finalReport.score, maxScore: finalReport.maxScore })
      }
    }
    setStep(nextStep)
  }

  function requestReviewMeeting() {
    if (!scenario) return
    setMeetingFeedback(runReviewMeeting(scenario, choices))
    setMeetingTaken(true)
    setStep('analyticMeeting')
  }

  function investigateFurther() {
    setRevisionUsed(true)
    setReport(null)
    setEndedAtMs(null)
    setStep('hypothesis')
  }

  async function handleSubmitScore() {
    if (!scenario || !report) return
    const name = playerName.trim()
    if (!name || scoreSubmitted) return
    setScoreSubmitted(true)
    const authority = getAuthority(authorityKey)
    try {
      await submitScore({ name, scenarioId: scenario.id, scenarioName: scenario.name, authorityKey, authorityName: authority.name, route: scenario.trueRoute, verdict: report.verdict, correct: report.verdict === 'source_identified' || report.verdict === 'source_identified_with_gaps', score: report.score, maxScore: report.maxScore })
    } catch { setScoreSubmitted(false) }
  }

  function downloadReport() {
    if (!scenario || !report) return
    const authority = getAuthority(authorityKey)
    const attackRate = computeAttackRate(scenario.observedCases, scenario.populationAtRisk)
    const lines: string[] = []
    lines.push('Outbreak Investigation Simulator — Investigation Report')
    lines.push(`${scenario.name} — ${scenario.setting}`)
    lines.push(`Reporting to: ${authority.name}`)
    lines.push(`Verdict: ${report.verdictLabel}`)
    lines.push(`Score: ${report.score}/${report.maxScore}`)
    lines.push(`Attack rate: ${attackRate.toFixed(1)}% (${scenario.observedCases} cases / ${scenario.populationAtRisk} population at risk)`)
    lines.push(''); lines.push(report.verdictSummary); lines.push('')
    if (report.deficiencies.length) { lines.push('Deficiencies:'); report.deficiencies.forEach((d) => lines.push(`  - ${d}`)); lines.push('') }
    if (report.strengths.length) { lines.push('Strengths:'); report.strengths.forEach((d) => lines.push(`  - ${d}`)); lines.push('') }
    lines.push('Decisions:')
    report.grades.forEach((g) => { lines.push(`  [${g.stage.toUpperCase()}] ${g.title}: ${g.chosenLabel} — ${g.verdict} (${g.points}/${g.maxPoints})`); lines.push(`    ${g.explanation}`) })
    lines.push(''); lines.push('All outbreaks, settings, and case data are entirely fictional, for educational use only.'); lines.push('built by Khan Gulrez Shagufa Fazal Ahmed')
    downloadTextFile(`outbreak-investigation-${scenario.id}-report.txt`, lines.join('\n'))
  }

  async function downloadWordReport() {
    if (!scenario || !report) return
    setDocBusy(true)
    try {
      const authority = getAuthority(authorityKey)
      const blob = await buildInvestigationReportDocx(scenario, report, authority)
      downloadBlobFile(`${scenario.id}-field-investigation-report.docx`, blob)
    } finally { setDocBusy(false) }
  }

  const midRun = step !== 'select'
  const abandonControl = midRun && step !== 'report' ? (
    <div className="flex justify-end"><Button onClick={startOver} variant="ghost" size="sm" className="text-field-text-muted font-mono gap-1.5 h-7"><X className="size-3.5" />Abandon &amp; start over</Button></div>
  ) : null
  const progressBar = midRun ? <ProgressTracker step={step} /> : null
  const growthTimer = timePressure && startedAtMs && midRun && step !== 'report' ? <OutbreakGrowthTimer startedAtMs={startedAtMs} baseCases={scenario?.observedCases ?? 0} /> : null

  if (step === 'select' || !scenario) {
    return (
      <div className="space-y-4">
        {resumeAvailable && (
          <Card className="bg-field-panel/80 border-2 border-field-gold glow-gold">
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm text-field-text flex items-center gap-2"><HistoryIcon className="size-4 text-field-gold shrink-0" />You have an in-progress investigation: <span className="font-mono font-bold">{resumeAvailable.scenario.name}</span>. Resume where you left off?</p>
              <div className="flex gap-2">
                <Button onClick={resumeSavedRun} className="flex-1 bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono">Resume</Button>
                <Button onClick={discardSavedRun} variant="outline" className="border-2 border-field-line font-mono">Discard</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setMode('curated')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${mode === 'curated' ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}><BookOpen className="size-3.5" />Curated ({SCENARIOS.length})</Button>
          <Button onClick={() => setMode('endless')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${mode === 'endless' ? 'border-field-violet text-field-violet glow-violet' : 'border-field-line text-field-text-muted'}`}><Dna className="size-3.5" />Endless Practice</Button>
        </div>
        <div>
          <p className="text-xs font-mono text-field-text-muted mb-1.5">Difficulty</p>
          <div className="flex gap-2">
            <Button onClick={() => setDifficulty('guided')} variant="outline" size="sm" className={`flex-1 h-auto whitespace-normal border-2 font-mono text-xs ${difficulty === 'guided' ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}>Guided (hints visible)</Button>
            <Button onClick={() => setDifficulty('expert')} variant="outline" size="sm" className={`flex-1 h-auto whitespace-normal border-2 font-mono text-xs ${difficulty === 'expert' ? 'border-field-red text-field-red glow-red' : 'border-field-line text-field-text-muted'}`}>Expert (hints hidden until chosen)</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Button onClick={() => setTimePressure((v) => !v)} variant="outline" className={`w-full border-2 font-mono text-xs gap-1.5 ${timePressure ? 'border-field-gold text-field-gold glow-gold' : 'border-field-line text-field-text-muted'}`}>
            <Zap className="size-3.5" />{timePressure ? 'Time pressure: ON — the outbreak keeps growing while you work' : 'Time pressure: OFF'}
          </Button>
          {mode === 'curated' && RELEASE_STAGE >= 2 && (
            <Button onClick={() => setFreshNumbers((v) => !v)} variant="outline" className={`w-full h-auto border-2 font-mono text-xs gap-1.5 whitespace-normal ${freshNumbers ? 'border-field-teal text-field-teal glow-teal' : 'border-field-line text-field-text-muted'}`}>
              <Shuffle className="size-3.5 shrink-0" />{freshNumbers ? 'Fresh numbers: ON — the curve and exposure table are re-rolled each run. These runs count as practice and stay off the per-outbreak boards.' : 'Fresh numbers: OFF — you get the standard numbers for each outbreak'}
            </Button>
          )}
        </div>
        <div>
          <p className="text-xs font-mono text-field-text-muted mb-1.5 flex items-center gap-1.5"><Globe2 className="size-3.5" />Reporting to (affects notification-timeline guidance in your final report)</p>
          <div className="flex flex-wrap gap-1.5">
            {AUTHORITIES.map((a) => (
              <Button key={a.key} onClick={() => setAuthorityKey(a.key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${authorityKey === a.key ? 'border-field-teal text-field-teal glow-teal' : 'border-field-line text-field-text-muted'}`}>{a.name}</Button>
            ))}
          </div>
        </div>
        {mode === 'curated' ? (
          <div className="grid gap-2">
            {SCENARIOS.map((s) => (
              <Card key={s.id} className="bg-field-panel/80 border-field-line cursor-pointer transition-all hover:border-field-red hover:glow-red" onClick={() => pickCurated(s)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className="font-mono font-bold text-field-text">{s.name} <span className="text-field-text-muted text-xs">{s.code}</span></p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-field-panel-strong text-field-red">{s.observedCases} cases</span>
                  </div>
                  <p className="text-xs text-field-text-muted mt-1">{s.setting}</p>
                  {freshNumbers && !isRandomizable(s) && <p className="text-[10px] font-mono text-field-text-muted mt-1">Fixed numbers: this scenario's data is hand-tuned to teach one specific point.</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-field-panel/80 border-field-violet border-2 glow-violet">
            <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-violet flex items-center gap-2"><Dna className="size-4" />Endless Practice</CardTitle>
              <CardDescription className="text-xs text-field-text-muted">Reskinned from {GENERATOR_ARCHETYPE_COUNT} of the curated outbreaks, with a freshly re-rolled epi curve and case-control table each time. The leading exposure always stays the leading exposure, so grading stays fully valid.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={pickGenerated} className="w-full bg-field-violet text-field-bg hover:bg-field-violet/90 font-mono gap-1.5">Generate a new outbreak <ArrowRight className="size-4" /></Button></CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (step === 'brief') {
    return (
      <div className="space-y-4">
        {progressBar}{growthTimer}{abandonControl}
        <Card className="bg-field-panel/80 border-field-line glow-red">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-mono text-field-text-muted uppercase">Field report (fictional)</span>
            <CardTitle className="font-mono text-lg text-field-text flex items-center gap-2"><FlaskConical className="size-5 text-field-red" />{scenario.name} <span className="text-sm text-field-text-muted">{scenario.code}</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-mono text-field-text-muted text-xs uppercase">Setting: </span>{scenario.setting}</p>
            <p><span className="font-mono text-field-text-muted text-xs uppercase">Syndrome: </span>{scenario.syndrome}</p>
            <p><span className="font-mono text-field-text-muted text-xs uppercase">Incubation: </span>{scenario.incubationHoursMin}–{scenario.incubationHoursMax} hours</p>
            <p className="text-field-text">{scenario.narrativeIntro}</p>
            <p className="rounded border border-field-blue bg-field-blue-soft p-2.5 text-field-text">{scenario.labFindingsNarrative}</p>
            {scenario.id.startsWith('gen-') && <p className="text-[11px] font-mono text-field-teal flex items-center gap-1.5"><Shuffle className="size-3" />The curve and exposure numbers in this run are freshly re-rolled. The story and the lesson are unchanged.</p>}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={startOver} variant="outline" className="border-2 border-field-line font-mono gap-1.5"><ArrowLeft className="size-4" />Choose a different outbreak</Button>
          <Button onClick={() => setStep('confirm')} className="flex-1 bg-field-red text-field-bg hover:bg-field-red/90 font-mono gap-1.5">Begin investigation <ArrowRight className="size-4" /></Button>
        </div>
      </div>
    )
  }

  if (step === 'confirm') return <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}<DecisionForm scenario={scenario} stage="confirm" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('confirm', 'confirmR')} submitLabel="Confirm and proceed" onBack={() => setStep('brief')} backLabel="Back to field report" /></div>
  if (step === 'confirmR' && outcomes.confirm) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.confirm} grades={grades.filter((g) => g.stage === 'confirm')} onNext={() => setStep('case_definition')} nextLabel="Build a case definition" /></div>

  if (step === 'case_definition') return (
    <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}
      <DecisionForm scenario={scenario} stage="case_definition" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('case_definition', 'case_definitionR')} submitLabel="Lock in case definition" onBack={() => setStep('confirmR')} backLabel="Back to confirmation"
        extra={scenario.caseCountByDefinition ? <CaseDefinitionSensitivityCard counts={scenario.caseCountByDefinition} /> : undefined} />
    </div>
  )
  if (step === 'case_definitionR' && outcomes.case_definition) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.case_definition} grades={grades.filter((g) => g.stage === 'case_definition')} onNext={() => setStep('descriptive')} nextLabel="Move to descriptive epidemiology" /></div>

  if (step === 'descriptive') return (
    <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}
      <DecisionForm scenario={scenario} stage="descriptive" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('descriptive', 'descriptiveR')} submitLabel="Lock in curve classification" onBack={() => setStep('case_definitionR')} backLabel="Back to case definition"
        extra={
          <div className="space-y-4">
            <EpiCurveChart data={scenario.epiCurve} incubationHoursMin={scenario.incubationHoursMin} incubationHoursMax={scenario.incubationHoursMax} />
            {scenario.spotMap && <SpotMapCard spotMap={scenario.spotMap} />}
            {scenario.personBreakdown && <PersonBreakdownCard breakdown={scenario.personBreakdown} />}
            {scenario.contactNetwork && <NetworkDiagram network={scenario.contactNetwork} />}
          </div>
        } />
    </div>
  )
  if (step === 'descriptiveR' && outcomes.descriptive) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.descriptive} grades={grades.filter((g) => g.stage === 'descriptive')} onNext={() => setStep('hypothesis')} nextLabel="Generate hypotheses" /></div>

  if (step === 'hypothesis') return <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}<DecisionForm scenario={scenario} stage="hypothesis" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('hypothesis', 'hypothesisR')} submitLabel="Lock in hypotheses" onBack={() => setStep('descriptiveR')} backLabel="Back to curve classification" /></div>
  if (step === 'hypothesisR' && outcomes.hypothesis) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.hypothesis} grades={grades.filter((g) => g.stage === 'hypothesis')} onNext={() => setStep('inspection')} nextLabel="Conduct field inspection" /></div>

  if (step === 'inspection') return <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}<DecisionForm scenario={scenario} stage="inspection" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('inspection', 'inspectionR')} submitLabel="Complete field inspection" onBack={() => setStep('hypothesisR')} backLabel="Back to hypotheses" /></div>
  if (step === 'inspectionR' && outcomes.inspection) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.inspection} grades={grades.filter((g) => g.stage === 'inspection')} onNext={() => setStep('analytic')} nextLabel="Run the analytic study" /></div>

  if (step === 'analytic') return (
    <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}
      <DecisionForm scenario={scenario} stage="analytic" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('analytic', 'analyticR')} submitLabel="Lock in analytic conclusions" onBack={() => setStep('inspectionR')} backLabel="Back to field inspection"
        extra={
          <div className="space-y-4">
            <OddsRatioTable exposures={scenario.exposures} />
            {scenario.cohortComparison && <CohortComparisonCard cohort={scenario.cohortComparison} vehicleLabel={scenario.exposures[0].exposure} />}
            {scenario.doseResponse && <DoseResponseCard levels={scenario.doseResponse} />}
            {scenario.stratifiedAnalysis && <StratifiedAnalysisCard stratified={scenario.stratifiedAnalysis} exposures={scenario.exposures} />}
            {!meetingTaken && choices.identify_vehicle && choices.study_design && (
              <Card className="bg-field-panel/80 border-2 border-field-blue">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-sm text-field-text flex items-center gap-2"><Users className="size-4 text-field-blue shrink-0" />Request a review with a senior epidemiologist before locking this in?</p>
                  <Button onClick={requestReviewMeeting} variant="outline" className="w-full border-2 border-field-blue text-field-blue font-mono">Request review meeting</Button>
                </CardContent>
              </Card>
            )}
          </div>
        } />
    </div>
  )
  if (step === 'analyticMeeting' && meetingFeedback) {
    return (
      <div className="space-y-4">
        {progressBar}{growthTimer}
        <Card className="bg-field-panel/80 border-2 border-field-blue glow-teal">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-blue flex items-center gap-2"><Users className="size-4" />Review Meeting Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {meetingFeedback.concerns.length > 0 ? (
              <div><p className="text-xs font-mono text-field-red uppercase mb-1">Concerns raised</p>{meetingFeedback.concerns.map((c, i) => <p key={i} className="text-sm text-field-text mb-1.5">{c}</p>)}</div>
            ) : <p className="text-sm text-field-emerald flex items-center gap-1.5"><CheckCircle2 className="size-4" />No major concerns raised with your current draft.</p>}
            {meetingFeedback.supportive.length > 0 && (
              <div><p className="text-xs font-mono text-field-emerald uppercase mb-1">Agreement</p>{meetingFeedback.supportive.map((c, i) => <p key={i} className="text-sm text-field-text mb-1.5">{c}</p>)}</div>
            )}
          </CardContent>
        </Card>
        <Button onClick={() => setStep('analytic')} className="w-full bg-field-red text-field-bg hover:bg-field-red/90 font-mono gap-1.5">Revise and finalize <ArrowRight className="size-4" /></Button>
      </div>
    )
  }
  if (step === 'analyticR' && outcomes.analytic) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.analytic} grades={grades.filter((g) => g.stage === 'analytic')} onNext={() => setStep('control')} nextLabel="Recommend control measures" /></div>

  if (step === 'control') return <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}<DecisionForm scenario={scenario} stage="control" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('control', 'controlR')} submitLabel="Lock in control measures" onBack={() => setStep('analyticR')} backLabel="Back to analytic study" /></div>
  if (step === 'controlR' && outcomes.control) return <div className="space-y-4">{progressBar}{growthTimer}<StageResultView outcome={outcomes.control} grades={grades.filter((g) => g.stage === 'control')} onNext={() => setStep('communication')} nextLabel="Draft the public statement" /></div>

  if (step === 'communication') return <div className="space-y-4">{progressBar}{growthTimer}{abandonControl}<DecisionForm scenario={scenario} stage="communication" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={() => submitStage('communication', 'report')} submitLabel="Finalize investigation" onBack={() => setStep('controlR')} backLabel="Back to control measures" /></div>

  if (step === 'report' && report) {
    const pct = Math.round((report.score / report.maxScore) * 100)
    const tone = report.verdict === 'source_identified' ? { border: 'border-field-emerald', glow: 'glow-emerald', Icon: ShieldCheck, stamp: 'border-field-emerald text-field-emerald' }
      : report.verdict === 'source_identified_with_gaps' ? { border: 'border-field-gold', glow: 'glow-gold', Icon: CircleAlert, stamp: 'border-field-gold text-field-gold' }
      : { border: 'border-field-red', glow: 'glow-red', Icon: ShieldAlert, stamp: 'border-field-red text-field-red' }
    const authority = getAuthority(authorityKey)
    const attackRate = computeAttackRate(scenario.observedCases, scenario.populationAtRisk)
    return (
      <div className="space-y-4">
        {progressBar}
        <Card className={`relative overflow-hidden bg-field-panel/80 border-2 ${tone.border} ${tone.glow}`} style={{ animation: 'stampIn 0.4s ease-out' }}>
          <VerdictStamp verdict={report.verdict} colorClass={tone.stamp} />
          <CardHeader className="pb-2">
            <span className="text-[10px] font-mono text-field-text-muted uppercase flex items-center gap-1.5"><Globe2 className="size-3" />Reporting to {authority.name}</span>
            <CardTitle className="font-mono text-xl text-field-text flex items-center gap-2"><tone.Icon className="size-6" />{report.verdictLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-field-text leading-relaxed">{report.verdictSummary}</p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded border border-field-line bg-field-panel-strong px-3 py-1.5"><p className="text-[10px] font-mono text-field-text-muted uppercase">Attack rate</p><p className="text-sm font-mono text-field-red">{attackRate.toFixed(1)}%</p></div>
              <div className="rounded border border-field-line bg-field-panel-strong px-3 py-1.5"><p className="text-[10px] font-mono text-field-text-muted uppercase">Cases / At risk</p><p className="text-sm font-mono text-field-red">{scenario.observedCases} / {scenario.populationAtRisk}</p></div>
              {timePressure && startedAtMs && endedAtMs && (
                <div className="rounded border border-field-gold bg-field-gold-soft px-3 py-1.5"><p className="text-[10px] font-mono text-field-text-muted uppercase">Time / growth</p><p className="text-sm font-mono text-field-gold">{formatElapsed(startedAtMs, endedAtMs)} · +{elapsedGrowthCases(startedAtMs, endedAtMs)} cases</p></div>
              )}
            </div>
            {report.deficiencies.length > 0 && <div><p className="text-xs font-mono text-field-red uppercase mb-2">Deficiencies cited</p>{report.deficiencies.map((d, i) => <p key={i} className="rounded border border-field-red bg-field-red-soft p-2.5 text-sm text-field-text mb-2">{d}</p>)}</div>}
            {report.strengths.length > 0 && <div><p className="text-xs font-mono text-field-emerald uppercase mb-2">Strengths recognized</p>{report.strengths.map((d, i) => <p key={i} className="rounded border border-field-emerald bg-field-emerald-soft p-2.5 text-sm text-field-text mb-2">{d}</p>)}</div>}
          </CardContent>
        </Card>
        {report.verdict === 'inconclusive' && !revisionUsed && (
          <Card className="bg-field-panel/80 border-2 border-field-gold glow-gold">
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm text-field-text flex items-center gap-2"><Search className="size-4 text-field-gold shrink-0" />An inconclusive result doesn't have to be final. Collect additional data and revisit the hypothesis onward?</p>
              <Button onClick={investigateFurther} className="w-full bg-field-gold text-field-bg hover:bg-field-gold/90 font-mono gap-1.5">Investigate further <ArrowRight className="size-4" /></Button>
            </CardContent>
          </Card>
        )}
        <Card className="bg-field-panel/80 border-field-line">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div><p className="text-xs font-mono text-field-text-muted uppercase">Investigation score</p><p className="text-lg font-mono text-field-text">{report.score}/{report.maxScore}</p></div>
              <div className="text-3xl font-mono text-field-red">{pct}%</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-field-panel-strong overflow-hidden"><div className="h-full bg-gradient-to-r from-field-red/60 to-field-red" style={{ width: `${pct}%` }} /></div>
          </CardContent>
        </Card>
        <ReportExtras scenario={scenario} report={report} choices={choices} difficulty={difficulty} meetingTaken={meetingTaken} revisionUsed={revisionUsed} elapsedMs={timePressure && startedAtMs && endedAtMs ? endedAtMs - startedAtMs : null} />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-field-teal">Full decision record</p>
          {report.grades.map((g) => <GradeRow key={g.decisionId} grade={g} />)}
        </div>
        <Card className="bg-field-panel/80 border-field-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-field-text-muted flex items-center gap-2"><Trophy className="size-4 text-field-gold" />Submit to leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {scoreSubmitted ? <p className="text-sm text-field-emerald">Recorded — check the Leaderboard tab.</p> : (
              <div className="flex gap-2">
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" maxLength={32} className="bg-field-panel-strong border-field-line text-field-text" />
                <Button onClick={handleSubmitScore} disabled={!playerName.trim()} className="bg-field-red text-field-bg hover:bg-field-red/90 font-mono">Submit</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={downloadReport} variant="outline" className="flex-1 border-2 border-field-line font-mono gap-1.5"><FileText className="size-4" />Text report</Button>
          <Button onClick={downloadWordReport} disabled={docBusy} variant="outline" className="flex-1 border-2 border-field-line font-mono gap-1.5"><FileType className="size-4" />{docBusy ? 'Building…' : 'Field report (Word)'}</Button>
        </div>
        <Button onClick={startOver} className="w-full bg-field-teal text-field-bg hover:bg-field-teal/90 font-mono gap-1.5"><RotateCcw className="size-4" />New investigation</Button>
      </div>
    )
  }

  return null
}
