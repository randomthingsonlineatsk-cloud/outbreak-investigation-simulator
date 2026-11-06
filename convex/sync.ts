import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export const generate = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    let code = generateCode()
    for (let i = 0; i < 5; i++) {
      const existing = await ctx.db.query("oiSyncProfiles").withIndex("by_code", (q) => q.eq("code", code)).unique()
      if (!existing) break
      code = generateCode()
    }
    await ctx.db.insert("oiSyncProfiles", { code, historyJson: "[]", updatedAt: Date.now() })
    return code
  },
})

export const push = mutation({
  args: { code: v.string(), historyJson: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("oiSyncProfiles").withIndex("by_code", (q) => q.eq("code", args.code)).unique()
    if (existing) await ctx.db.patch(existing._id, { historyJson: args.historyJson, updatedAt: Date.now() })
    else await ctx.db.insert("oiSyncProfiles", { code: args.code, historyJson: args.historyJson, updatedAt: Date.now() })
    return null
  },
})

export const pull = query({
  args: { code: v.string() },
  returns: v.union(v.object({ historyJson: v.string(), updatedAt: v.number() }), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("oiSyncProfiles").withIndex("by_code", (q) => q.eq("code", args.code)).unique()
    if (!existing) return null
    return { historyJson: existing.historyJson, updatedAt: existing.updatedAt }
  },
})
