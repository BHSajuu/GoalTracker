"use node"

import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { internal } from "./_generated/api";

export const sendOtp = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await ctx.runMutation(internal.auth.saveOtp, {
      email: args.email,
      code,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Zielio Security" <${process.env.SMTP_USER}>`,
      to: args.email,
      subject: "Your Zielio Verification Code",
      html: `
         <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid #00d4ff33; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="color: #00d4ff; margin: 0 0 10px 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">Zielio</h1>
                        <p style="color: #64748b; margin: 0; font-size: 14px; letter-spacing: 1px;">VERIFICATION CODE</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          Use the following code to verify your email address:
                        </p>
                        <div style="background: linear-gradient(135deg, #00d4ff15 0%, #7c3aed15 100%); border: 1px solid #00d4ff44; border-radius: 12px; padding: 25px; margin: 0 0 30px 0;">
                          <p style="color: #00d4ff; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                            ${code}
                          </p>
                        </div>
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                          This code will expire in <span style="color: #00d4ff;">10 minutes</span>.<br>
                          If you didn't request this code, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px; background: #0f0f1a; text-align: center; border-top: 1px solid #1e293b;">
                        <p style="color: #475569; font-size: 12px; margin: 0;">
                          Powered by Zielio - Track Your Dreams
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send email. Please check the email address.");
    }
  },
});

export const sendAccountDeletionOtp = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await ctx.runMutation(internal.auth.saveOtp, {
      email: args.email,
      code,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Zielio Security" <${process.env.SMTP_USER}>`,
      to: args.email,
      subject: "URGENT: Account Deletion Verification Code",
      html: `
         <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, #2e1a1a 0%, #3e1616 100%); border-radius: 16px; border: 1px solid #ff005533; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ff4444; margin: 0 0 10px 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">WARNING</h1>
                        <p style="color: #cbd5e1; margin: 0; font-size: 14px; letter-spacing: 1px;">ACCOUNT DELETION REQUESTED</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          You have requested to <strong>permanently delete</strong> your Zielio account. To confirm this destructive action, enter the code below:
                        </p>
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); border-radius: 12px; padding: 25px; margin: 0 0 30px 0;">
                          <p style="color: #ff4444; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                            ${code}
                          </p>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                          If you did not request this, please secure your account immediately.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send deletion email.");
    }
  },
});

export const sendShareEmail = action({
  args: {
    recipientEmail: v.string(),
    shareLink: v.string(),
    senderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const sender = args.senderName || "A Zielio user";

    const mailOptions = {
      from: `"Zielio Collaboration" <${process.env.SMTP_USER}>`,
      to: args.recipientEmail,
      subject: `${sender} shared a note with you on Zielio!`,
      html: `
         <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid #00d4ff33; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="color: #00d4ff; margin: 0 0 10px 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">Zielio</h1>
                        <p style="color: #64748b; margin: 0; font-size: 14px; letter-spacing: 1px;">NOTE SHARED WITH YOU</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          <strong>${sender}</strong> has securely shared a note with you from their Zielio workspace.
                        </p>
                        <div style="margin: 0 0 30px 0;">
                          <a href="${args.shareLink}" style="background: linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);">View Shared Note</a>
                        </div>
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                          If you don't already have a Zielio account, you will be prompted to quickly log in or sign up before saving the note to your goals.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px; background: #0f0f1a; text-align: center; border-top: 1px solid #1e293b;">
                        <p style="color: #475569; font-size: 12px; margin: 0;">
                          Powered by Zielio - Track Your Dreams
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send email. Check SMTP credentials.");
    }
  }
});