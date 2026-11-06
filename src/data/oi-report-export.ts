import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { computeOddsRatio, computeAttackRate } from './oi-engine'
import { buildMethodsAppendix, NO_LIMITATIONS_NOTE } from './oi-methods'
import { RELEASE_STAGE } from './oi-release'
import type { FinalReport, Scenario } from './oi-types'
import type { HealthAuthority } from './oi-authorities'

// ---------------------------------------------------------------------------
// Generates a field-investigation report styled on the structure real
// outbreak reports use (background → methods → results → discussion →
// recommendations, in the spirit of an MMWR-style report), populated with
// this investigation's own decisions and data, followed by a Methods
// appendix written from the choices made. A teaching artifact, not a
// template for an actual regulatory or public health submission.
// ---------------------------------------------------------------------------

function section(title: string): Paragraph {
  return new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } })
}
function body(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text })], spacing: { after: 120 } })
}
function bullet(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: `• ${text}` })], spacing: { after: 60 } })
}

export async function buildInvestigationReportDocx(scenario: Scenario, report: FinalReport, authority: HealthAuthority): Promise<Blob> {
  const attackRate = computeAttackRate(scenario.observedCases, scenario.populationAtRisk)

  const children: Paragraph[] = [
    new Paragraph({ text: scenario.name, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: 'Field Investigation Report', heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: `Prepared for: ${authority.name}`, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: 'All settings, cases, and case data described are entirely fictional and generated for educational purposes only.', italics: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { after: 360 } }),

    section('Background'),
    body(scenario.narrativeIntro),
    body(`Setting: ${scenario.setting}`),
    body(`Clinical syndrome: ${scenario.syndrome} (incubation period: ${scenario.incubationHoursMin}–${scenario.incubationHoursMax} hours).`),
    body(`Baseline incidence for this setting is approximately ${scenario.baselineCasesPerPeriod} case(s) per ${scenario.periodLabel}; ${scenario.observedCases} cases were identified during this investigation.`),

    section('Methods'),
    new Paragraph({ text: 'Case Definition', heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 60 } }),
    ...report.grades.filter((g) => g.stage === 'case_definition').map((g) => bullet(`${g.title}: ${g.chosenLabel}`)),
    new Paragraph({ text: 'Descriptive Epidemiology', heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 60 } }),
    ...report.grades.filter((g) => g.stage === 'descriptive').map((g) => bullet(`${g.title}: ${g.chosenLabel}`)),
    new Paragraph({ text: 'Analytic Epidemiology', heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 60 } }),
    body('A case-control study compared exposures between ill cases and well controls. Odds ratios (OR) were calculated for each candidate exposure:'),
    ...scenario.exposures.map((e) => bullet(`${e.exposure}: OR = ${computeOddsRatio(e).toFixed(2)}`)),
    ...(RELEASE_STAGE >= 2 ? [body('The full Materials and Methods narrative is given in Appendix A.')] : []),

    section('Results'),
    body(`Overall attack rate: ${attackRate.toFixed(1)}% (${scenario.observedCases} cases among ${scenario.populationAtRisk.toLocaleString()} persons at risk).`),
    body(`Laboratory and environmental findings: ${scenario.labFindingsNarrative}`),
    body(`Verdict: ${report.verdictLabel}. ${report.verdictSummary}`),
  ]

  if (report.strengths.length > 0) {
    children.push(new Paragraph({ text: 'Strengths of the Investigation', heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 60 } }))
    report.strengths.forEach((s) => children.push(bullet(s)))
  }
  if (report.deficiencies.length > 0) {
    children.push(new Paragraph({ text: 'Deficiencies Identified', heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 60 } }))
    report.deficiencies.forEach((d) => children.push(bullet(d)))
  }

  children.push(section('Discussion'))
  children.push(body(`The investigation identified ${report.identifiedVehicle} as the most statistically supported vehicle for this outbreak, based on the case-control odds ratio table above.`))

  children.push(section('Recommendations'))
  const controlGrade = report.grades.find((g) => g.stage === 'control')
  if (controlGrade) children.push(bullet(controlGrade.chosenLabel))
  const commsGrade = report.grades.find((g) => g.stage === 'communication' && g.decisionId === 'draft_approach')
  if (commsGrade) children.push(bullet(`Public communication approach: ${commsGrade.chosenLabel}`))
  children.push(body(`Under ${authority.name} conventions, a case with this profile should be reported within ${scenario.notifiableClass === 'urgent' ? authority.urgentWindowHours + ' hours' : authority.routineWindowDays + ' days'} of identification.`))

  if (RELEASE_STAGE >= 2) {
  // Appendix A: the Methods narrative, written from the choices made.
  const appendix = buildMethodsAppendix(scenario, report.grades)
  children.push(new Paragraph({ text: 'Appendix A: Materials and Methods', heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 120 } }))
  children.push(new Paragraph({ children: [new TextRun({ text: appendix.intro, italics: true, size: 20 })], spacing: { after: 160 } }))
  for (const s of appendix.sections) {
    children.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }))
    children.push(body(s.text))
  }
  children.push(new Paragraph({ text: 'Limitations', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }))
  if (appendix.limitations.length === 0) children.push(body(NO_LIMITATIONS_NOTE))
  else appendix.limitations.forEach((l) => children.push(bullet(l)))

  }

  children.push(new Paragraph({ children: [new TextRun({ text: 'built by Khan Gulrez Shagufa Fazal Ahmed — Outbreak Investigation Simulator', italics: true, size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 360 } }))

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}
