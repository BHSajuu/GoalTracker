import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  otpCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  }).index("by_email", ["email"]),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetDate: v.optional(v.number()),
    progress: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  tasks: defineTable({
    userId: v.id("users"),
    goalId: v.id("goals"),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    estimatedTime: v.optional(v.number()), 
    actualTime: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_goal", ["goalId"])
    .index("by_user_and_date", ["userId", "dueDate"]),

  notes: defineTable({
    userId: v.id("users"),
    goalId: v.id("goals"),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_user", ["userId"]),
    
  focusSessions: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.number(), // In minutes
    status: v.union(v.literal("completed"), v.literal("interrupted")),
  })
  .index("by_user", ["userId"])
  .index("by_task", ["taskId"]),

  visitors: defineTable({
    ip: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    firstSeen: v.number(),
    lastVisit: v.number(),
  }).index("by_ip", ["ip"]),
});