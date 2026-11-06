import type { Decision, Scenario, StageKey } from './oi-types'
import { npcDecisions } from './oi-npc'
import { RELEASE_STAGE } from './oi-release'

// Newest decisions. Add new ones here: oi-decisions-full.ts already includes
// this list, so neither it nor the larger decision files need editing again.
// The NPC conversations belong to stage 2 and are not shown in stage 1.
export function moreDecisions(scenario: Scenario, stage: StageKey): Decision[] {
  if (RELEASE_STAGE < 2) return []
  return [...npcDecisions(scenario, stage)]
}
