import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const LEADERBOARD_SIZE = 30
const WEEKLY_FETCH_SIZE = 50

const entryValidator = v.object({
  _id: v.id("oiLeaderboard"),
  _creationTime: v.number(),
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

export const top = query({
  args: { scenarioId: v.optional(v.string()), route: v.optional(v.string()) },
  returns: v.array(entryValidator),
  handler: async (ctx, args) => {
    if (args.scenarioId) {
      return await ctx.db.query("oiLeaderboard").withIndex("by_scenario_pct", (q) => q.eq("scenarioId", args.scenarioId!)).order("desc").take(LEADERBOARD_SIZE)
    }
    if (args.route) {
      return await ctx.db.query("oiLeaderboard").withIndex("by_route_pct", (q) => q.eq("route", args.route!)).order("desc").take(LEADERBOARD_SIZE)
    }
    return await ctx.db.query("oiLeaderboard").withIndex("by_pct").order("desc").take(LEADERBOARD_SIZE)
  },
})

// Entries for one scenario submitted at or after sinceMs (the start of the
// current week), best score first. The client dedupes to one entry per name.
export const weekly = query({
  args: { scenarioId: v.string(), sinceMs: v.number() },
  returns: v.array(entryValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oiLeaderboard")
      .withIndex("by_scenario_pct", (q) => q.eq("scenarioId", args.scenarioId))
      .order("desc")
      .filter((q) => q.gte(q.field("_creationTime"), args.sinceMs))
      .take(WEEKLY_FETCH_SIZE)
  },
})

export const submit = mutation({
  args: {
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
  },
  returns: v.id("oiLeaderboard"),
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 32)
    if (!name) throw new Error("Name is required")
    if (args.maxScore < 1 || args.score < 0 || args.score > args.maxScore) throw new Error("Invalid score")
    const pct = (args.score / args.maxScore) * 100
    return await ctx.db.insert("oiLeaderboard", { ...args, name, pct })
  },
})
