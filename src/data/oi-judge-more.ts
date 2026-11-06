import type { Grade, Scenario } from './oi-types'
import { judgeNpc } from './oi-npc'

type Judged = { verdict: Grade['verdict']; explanation: string; reference: string }

// Grading for the newest decisions. oi-judge-extra falls through to this for
// any decision id it doesn't handle itself, so add new cases here.
export function judgeMore(_scenario: Scenario, decisionId: string, chosen: string): Judged | null {
  return judgeNpc(decisionId, chosen)
}
