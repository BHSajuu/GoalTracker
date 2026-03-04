import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const create = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      createdAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const user = await ctx.db.get(id);
    
    if (!user) throw new Error("User not found");

    // Prevent duplicate emails
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      if (existingEmail && existingEmail._id !== id) {
        throw new Error("This email is already registered to another account.");
      }
    }

    // Process new Image ID to generate a fresh URL
    let imageUrl = user.imageUrl;
    if (updates.imageId) {
      imageUrl = await ctx.storage.getUrl(updates.imageId) ?? undefined;
    }

    await ctx.db.patch(id, {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.imageId !== undefined ? { imageId: updates.imageId } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    });

    return true;
  }
});

// Advanced Flow State and Archetype Analytics
export const getDeveloperArchetype = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
    const sessions = await ctx.db.query("focusSessions").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
    
    // 1. Peak Flow Time Calculation
    const hourCounts = new Array(24).fill(0);
    let totalFocusMins = 0;
    
    sessions.forEach(s => {
      if (s.duration) {
        const hour = new Date(s.startTime).getHours();
        hourCounts[hour] += s.duration;
        totalFocusMins += s.duration;
      }
    });
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts, 0));
    let peakTimeOfDay = "Data Gathering...";
    if (totalFocusMins > 0) {
      if (peakHour >= 5 && peakHour < 12) peakTimeOfDay = "Early Bird";
      else if (peakHour >= 12 && peakHour < 18) peakTimeOfDay = "Afternoon Hustler";
      else if (peakHour >= 18 && peakHour <= 23) peakTimeOfDay = "Night Owl";
      else peakTimeOfDay = "Deep Night Grinder";
    }

    // 2. Cognitive Load & Burnout Predictor
    const now = Date.now();
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    const pendingCritical = tasks.filter(t => !t.completed && !t.isArchived && t.dueDate && t.dueDate < threeDaysFromNow && t.priority === "high");
    
    let cognitiveLoad = "Optimal";
    let loadColor = "text-green-400";
    if (pendingCritical.length >= 5) {
      cognitiveLoad = "Burnout Risk";
      loadColor = "text-red-400";
    } else if (pendingCritical.length >= 3) {
      cognitiveLoad = "Elevated";
      loadColor = "text-amber-400";
    }

    // 3. Growth Balance (Builder vs Solver vs Prep)
    const completed = tasks.filter(t => t.completed);
    let builderScore = 0; 
    let solverScore = 0;  
    let prepScore = 0;    

    // Simple NLP keyword matching on task/goal titles
    const builderKeywords = ["build", "project", "dev", "react", "app", "bot", "sim", "code", "debug", "create", "ui"];
    const solverKeywords = ["dsa", "leetcode", "logic", "algo", "array", "tree", "graph", "solve", "math"];
    const prepKeywords = ["aptitude", "interview", "resume", "prep", "communication", "quant", "reasoning", "apply"];

    completed.forEach(t => {
        const title = (t.title || "").toLowerCase();
        if (builderKeywords.some(k => title.includes(k))) builderScore++;
        if (solverKeywords.some(k => title.includes(k))) solverScore++;
        if (prepKeywords.some(k => title.includes(k))) prepScore++;
    });

    const totalCategorized = builderScore + solverScore + prepScore;
    const balance = totalCategorized > 0 ? {
        builder: Math.round((builderScore / totalCategorized) * 100),
        solver: Math.round((solverScore / totalCategorized) * 100),
        prep: Math.round((prepScore / totalCategorized) * 100)
    } : { builder: 33, solver: 33, prep: 34 }; // Default baseline if no data

    return {
        totalFocusMins,
        peakHour,
        peakTimeOfDay,
        cognitiveLoad,
        loadColor,
        criticalTasksCount: pendingCritical.length,
        balance
    };
  }
});