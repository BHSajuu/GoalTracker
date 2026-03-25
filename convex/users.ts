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
      // Default preferences for new users
      preferences: {
        pushNotifications: false,
        taskReminders: true,
        streakReminders: true,
        aiQuotaAlerts: true,
        enableAiFeatures: true,
      },
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
    timezone: v.optional(v.string()),
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
      ...(updates.timezone !== undefined ? { timezone: updates.timezone } : {}),
    });

    return true;
  }
});

// mutation to silently sync user timezone when they open the app
export const syncTimezone = mutation({
  args: { id: v.id("users"), timezone: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return;
    
    // Only update if it has changed to save database writes
    if (user.timezone !== args.timezone) {
      await ctx.db.patch(args.id, { timezone: args.timezone });
    }
  }
});

export const updatePreferences = mutation({
  args: {
    id: v.id("users"),
    preferences: v.object({
      pushNotifications: v.boolean(),
      taskReminders: v.boolean(),
      streakReminders: v.boolean(),
      aiQuotaAlerts: v.boolean(),
      enableAiFeatures: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      preferences: args.preferences,
    });
    return true;
  },
});

export const confirmAccountDeletion = mutation({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const otpRecord = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .filter(q => q.eq(q.field("code"), args.code))
      .filter(q => q.eq(q.field("used"), false))
      .first();

    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      throw new Error("Invalid or expired OTP");
    }

    await ctx.db.patch(otpRecord._id, { used: true });

    // Cascade Delete User Data
    const collections = ["tasks", "goals", "notes", "focusSessions"] as const;
    for (const collection of collections) {
      const records = await ctx.db.query(collection).withIndex("by_user", q => q.eq("userId", args.userId)).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    await ctx.db.delete(args.userId);
    return true;
  }
});