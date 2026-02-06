import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";


export const saveOtp = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const existingOtps = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    for (const otp of existingOtps) {
      await ctx.db.delete(otp._id);
    }

    await ctx.db.insert("otpCodes", {
      email: args.email,
      code: args.code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      used: false,
    });
  },
});



//  Verify OTP 
export const verifyOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!otp) throw new Error("Code not found or expired");
    if (otp.used) throw new Error("Code already used");
    if (otp.expiresAt < Date.now()) throw new Error("Code expired");
    if (otp.code !== args.code) throw new Error("Invalid code");

    // Mark used
    await ctx.db.patch(otp._id, { used: true });

    // Get or Create User
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        createdAt: Date.now(),
      });
      // Correctly fetching the user we just created
      user = await ctx.db.get(userId);
    }

    return { success: true, userId: user?._id };
  },
});