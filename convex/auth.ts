import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    // Invalidate any existing OTPs for this email
    const existingOtps = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    for (const otp of existingOtps) {
      await ctx.db.delete(otp._id);
    }

    // Create new OTP (expires in 10 minutes)
    return await ctx.db.insert("otpCodes", {
      email: args.email,
      code: args.code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      used: false,
    });
  },
});

export const verifyOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!otp) {
      return { success: false, error: "No OTP found for this email" };
    }

    if (otp.used) {
      return { success: false, error: "OTP has already been used" };
    }

    if (otp.expiresAt < Date.now()) {
      return { success: false, error: "OTP has expired" };
    }

    if (otp.code !== args.code) {
      return { success: false, error: "Invalid OTP" };
    }

    // Mark OTP as used
    await ctx.db.patch(otp._id, { used: true });

    // Create or get user
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    return { success: true, userId: user?._id };
  },
});

export const getOtpByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});
