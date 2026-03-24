/**
 * This file handles the actual transmission of the push notification to the browser. 
 * Because the web-push library relies on Node.js cryptography, we must add "use node"; 
 * at the very top of this file.
 */

"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPush = internalAction({
  args: {
    subscription: v.any(),
    title: v.string(),
    body: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    let subject = process.env.VAPID_SUBJECT || "mailto:admin@goaltracker.com";

    // Automatically format the subject if the user forgot the "mailto:" prefix
    if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) {
      subject = `mailto:${subject}`;
    }

    if (!publicKey || !privateKey) {
      console.error("Push ignored: VAPID keys not configured in Convex Dashboard.");
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    try {
      await webpush.sendNotification(
        args.subscription,
        JSON.stringify({
          title: args.title,
          body: args.body,
          url: args.url,
          icon: "/logo.png",
        })
      );
    } catch (error: any) {
      // 404 or 410 means the subscription has expired or the user revoked permission
      if (error.statusCode === 404 || error.statusCode === 410) {
        await ctx.runMutation(internal.push.removeDeadSubscription, {
          endpoint: args.subscription.endpoint,
        });
      } else {
        console.error("Error sending push notification:", error);
      }
    }
  },
});