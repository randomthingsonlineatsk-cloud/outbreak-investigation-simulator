import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  oiLeaderboard: defineTable({
    name: v.string(),
    scenarioId: v.string(),
    scenarioName: v.string(),
    authorityKey: v.optional(v.string()),
    authorityName: v.optional(v.string()),
    route: v.optional(v.string()),
    verdict: v.string(),
    correct: v.boolean(),
    score: v.number(),
    maxScore: v.number(),
    pct: v.number(),
  })
    .index("by_pct", ["pct"])
    .index("by_scenario_pct", ["scenarioId", "pct"])
    .index("by_route_pct", ["route", "pct"]),
  oiSyncProfiles: defineTable({
    code: v.string(),
    historyJson: v.string(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
})
