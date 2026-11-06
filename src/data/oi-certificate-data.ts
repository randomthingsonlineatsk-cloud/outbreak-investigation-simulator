import { ACHIEVEMENTS, VETERAN_TARGET, RANGE_TARGET, correctRunCount, distinctCorrectOutbreaks, type BadgeStore } from './oi-achievements'

// ---------------------------------------------------------------------------
// Skills certificate (#50). A certificate computed from your actual recorded
// results, in one of three tiers that require real results:
//
//  - Participation: at least one completed investigation.
//  - Proficiency:   correct source in 5 investigations, plus at least one
//                   skill badge.
//  - Distinction:   correct source in 5 investigations across 10 different
//                   outbreaks, plus at least four skill badges.
//
// What it is NOT: an accredited qualification. It is issued inside a fictional
// educational simulation and is based on activity recorded in this browser,
// which nothing verifies. The certificate says so on its face.
//
// Pure logic and SVG generation live here (no React) so they can be tested.
// ---------------------------------------------------------------------------

export type CertificateTier = 'none' | 'participation' | 'proficiency' | 'distinction'

export const SKILL_BADGES_FOR_PROFICIENCY = 1
export const SKILL_BADGES_FOR_DISTINCTION = 4

export interface HistoryRow { scenarioId: string; verdict: string; score: number; maxScore: number }

export interface CertificateStatus {
  tier: CertificateTier
  completed: number
  correct: number
  distinctCorrect: number
  averagePct: number
  skillNames: string[]
  badgeCount: number
}

export const TIER_TITLE: Record<Exclude<CertificateTier, 'none'>, string> = {
  participation: 'Certificate of Participation',
  proficiency: 'Certificate of Proficiency',
  distinction: 'Certificate of Distinction',
}

export function certificateStatus(history: HistoryRow[], badges: BadgeStore): CertificateStatus {
  const completed = history.length
  const correct = correctRunCount(history)
  const distinctCorrect = distinctCorrectOutbreaks(history)
  const scored = history.filter((h) => h.maxScore > 0)
  const averagePct = scored.length === 0 ? 0 : Math.round((scored.reduce((s, h) => s + (h.score / h.maxScore) * 100, 0) / scored.length) * 10) / 10
  const skillNames = ACHIEVEMENTS.filter((a) => a.group === 'skill' && badges[a.id]).map((a) => a.name)
  const badgeCount = ACHIEVEMENTS.filter((a) => badges[a.id]).length

  let tier: CertificateTier = 'none'
  if (completed >= 1) tier = 'participation'
  if (correct >= VETERAN_TARGET && skillNames.length >= SKILL_BADGES_FOR_PROFICIENCY) tier = 'proficiency'
  if (correct >= VETERAN_TARGET && distinctCorrect >= RANGE_TARGET && skillNames.length >= SKILL_BADGES_FOR_DISTINCTION) tier = 'distinction'
  return { tier, completed, correct, distinctCorrect, averagePct, skillNames, badgeCount }
}

// What is still missing for the next tier, in plain words.
export function nextTierNeeds(s: CertificateStatus): { target: string; needs: string[] } | null {
  const needs: string[] = []
  if (s.tier === 'none') return { target: TIER_TITLE.participation, needs: ['Complete one investigation'] }
  if (s.tier === 'participation') {
    if (s.correct < VETERAN_TARGET) needs.push(`Identify the correct source in ${VETERAN_TARGET - s.correct} more investigation${VETERAN_TARGET - s.correct === 1 ? '' : 's'}`)
    if (s.skillNames.length < SKILL_BADGES_FOR_PROFICIENCY) needs.push('Earn at least one skill badge')
    return { target: TIER_TITLE.proficiency, needs }
  }
  if (s.tier === 'proficiency') {
    if (s.distinctCorrect < RANGE_TARGET) needs.push(`Identify the correct source in ${RANGE_TARGET - s.distinctCorrect} more different outbreak${RANGE_TARGET - s.distinctCorrect === 1 ? '' : 's'}`)
    if (s.skillNames.length < SKILL_BADGES_FOR_DISTINCTION) needs.push(`Earn ${SKILL_BADGES_FOR_DISTINCTION - s.skillNames.length} more skill badge${SKILL_BADGES_FOR_DISTINCTION - s.skillNames.length === 1 ? '' : 's'}`)
    return { target: TIER_TITLE.distinction, needs }
  }
  return null
}

export function statementFor(s: CertificateStatus): string {
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
  if (s.tier === 'distinction') return `has correctly identified the source in ${n(s.correct, 'simulated outbreak investigation', 'simulated outbreak investigations')} across ${s.distinctCorrect} different outbreaks, and demonstrated ${n(s.skillNames.length, 'skill', 'skills')} in the Outbreak Investigation Simulator.`
  if (s.tier === 'proficiency') return `has correctly identified the source in ${n(s.correct, 'simulated outbreak investigation', 'simulated outbreak investigations')} and demonstrated ${n(s.skillNames.length, 'skill', 'skills')} in the Outbreak Investigation Simulator.`
  return `has completed ${n(s.completed, 'simulated outbreak investigation', 'simulated outbreak investigations')} in the Outbreak Investigation Simulator.`
}

// ---- SVG -------------------------------------------------------------------

export const CERT_W = 1200
export const CERT_H = 850

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// Greedy word wrap. A single word longer than the limit is left on its own line.
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word
    else if ((line + ' ' + word).length <= maxChars) line += ' ' + word
    else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  return lines
}

// Font size for the printed name. Each step is chosen so that a name of the
// maximum length for that step, even in wide capital letters (about 0.62em
// per character in bold serif), stays inside the inner border, which leaves
// roughly 1044px of usable width: 29 chars at 58px, 36 at 46px, 46 at 36px,
// and up to the 60-character cap at 28px.
export function nameFontSize(name: string): number {
  if (name.length <= 29) return 58
  if (name.length <= 36) return 46
  if (name.length <= 46) return 36
  return 28
}

export function buildCertificateSvg(status: CertificateStatus, name: string, dateLabel: string): string {
  if (status.tier === 'none') throw new Error('No certificate is available before a first completed investigation')
  const serif = "Georgia, 'Times New Roman', serif"
  const cleanName = name.trim().slice(0, 60)
  const statement = wrapText(statementFor(status), 78).slice(0, 3)
  const skills = status.skillNames.length > 0 ? wrapText(status.skillNames.join(' · '), 95).slice(0, 2) : ['None earned yet']
  const stats: [string, string][] = [
    [String(status.completed), 'Investigations completed'],
    [String(status.correct), 'Correct source identified'],
    [String(status.distinctCorrect), 'Different outbreaks solved'],
    [`${status.averagePct}%`, 'Average score'],
  ]
  const parts: string[] = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CERT_W} ${CERT_H}" width="${CERT_W}" height="${CERT_H}">`)
  parts.push(`<rect width="${CERT_W}" height="${CERT_H}" fill="#fbf7ee"/>`)
  parts.push(`<rect x="30" y="30" width="${CERT_W - 60}" height="${CERT_H - 60}" fill="none" stroke="#7a1f1f" stroke-width="6"/>`)
  parts.push(`<rect x="48" y="48" width="${CERT_W - 96}" height="${CERT_H - 96}" fill="none" stroke="#c9a24a" stroke-width="2"/>`)
  parts.push(`<text x="600" y="112" font-family="${serif}" font-size="22" letter-spacing="5" fill="#7a1f1f" text-anchor="middle">OUTBREAK INVESTIGATION SIMULATOR</text>`)
  parts.push(`<text x="600" y="184" font-family="${serif}" font-size="56" font-weight="bold" fill="#1b2a35" text-anchor="middle">${escapeXml(TIER_TITLE[status.tier])}</text>`)
  parts.push(`<text x="600" y="244" font-family="${serif}" font-size="22" font-style="italic" fill="#4a5b6b" text-anchor="middle">This certifies that</text>`)
  parts.push(`<text x="600" y="322" font-family="${serif}" font-size="${nameFontSize(cleanName)}" font-weight="bold" fill="#1b2a35" text-anchor="middle">${escapeXml(cleanName)}</text>`)
  parts.push(`<line x1="230" y1="344" x2="970" y2="344" stroke="#c9a24a" stroke-width="2"/>`)
  statement.forEach((l, i) => parts.push(`<text x="600" y="${396 + i * 32}" font-family="${serif}" font-size="22" fill="#1b2a35" text-anchor="middle">${escapeXml(l)}</text>`))
  stats.forEach(([value, label], i) => {
    const cx = 210 + i * 260
    parts.push(`<text x="${cx}" y="536" font-family="${serif}" font-size="44" font-weight="bold" fill="#7a1f1f" text-anchor="middle">${escapeXml(value)}</text>`)
    parts.push(`<text x="${cx}" y="562" font-family="${serif}" font-size="15" fill="#4a5b6b" text-anchor="middle">${escapeXml(label)}</text>`)
  })
  parts.push(`<text x="600" y="624" font-family="${serif}" font-size="17" font-weight="bold" fill="#1b2a35" text-anchor="middle">Skills demonstrated</text>`)
  skills.forEach((l, i) => parts.push(`<text x="600" y="${652 + i * 26}" font-family="${serif}" font-size="18" fill="#1b2a35" text-anchor="middle">${escapeXml(l)}</text>`))
  parts.push(`<text x="120" y="742" font-family="${serif}" font-size="17" fill="#1b2a35">Issued ${escapeXml(dateLabel)}</text>`)
  parts.push(`<text x="1080" y="742" font-family="${serif}" font-size="17" fill="#1b2a35" text-anchor="end">${escapeXml(`${status.badgeCount} badge${status.badgeCount === 1 ? '' : 's'} earned`)}</text>`)
  parts.push(`<text x="600" y="774" font-family="${serif}" font-size="13" font-style="italic" fill="#4a5b6b" text-anchor="middle">Awarded within a fictional educational simulation. Not an accredited qualification. Based on activity recorded in this browser.</text>`)
  parts.push(`<text x="600" y="796" font-family="${serif}" font-size="13" fill="#4a5b6b" text-anchor="middle">built by Khan Gulrez Shagufa Fazal Ahmed</text>`)
  parts.push('</svg>')
  return parts.join('')
}
