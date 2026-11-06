import { SCENARIOS } from './oi-scenarios'
import { isRandomizable, randomizeScenario } from './oi-randomize'
import type { Scenario } from './oi-types'

// ---------------------------------------------------------------------------
// Endless Practice generator. Reskins one of the validated scenarios with
// freshly re-rolled numbers each time, using the shared randomizer in
// oi-randomize.ts. The randomizer keeps everything the story cites (reported
// cases, population) and every linked card fixed, and enforces that the
// leading exposure stays the leading exposure with a comparable margin, so
// grading stays fully valid: the engine recomputes the correct answer from
// whatever numbers are in front of the player.
//
// Scenarios whose lesson depends on hand-tuned relationships between tables
// are excluded (see isRandomizable).
// ---------------------------------------------------------------------------

const PLACE_NAMES = ['Fairhaven', 'Cedarbrook', 'Millbrook', 'Ashford', 'Brightwater', 'Stonegate', 'Havenport', 'Wrenfield', 'Oakmere', 'Silverlake', 'Dunmore', 'Rosedale', 'Thornwood', 'Elmsworth']

const TEMPLATE_POOL = SCENARIOS.filter(isRandomizable)

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateScenario(): Scenario {
  const template = randomFrom(TEMPLATE_POOL)
  const randomized = randomizeScenario(template)
  const place = randomFrom(PLACE_NAMES)
  return {
    ...randomized,
    id: `gen-${template.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    code: `${place.slice(0, 3).toUpperCase()}-${1 + Math.floor(Math.random() * 90)}`,
  }
}

export const GENERATOR_ARCHETYPE_COUNT = TEMPLATE_POOL.length
