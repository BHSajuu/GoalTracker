import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const mailOptions = {
      from: `"GoalForge" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your GoalForge Verification Code",
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
                        <h1 style="color: #00d4ff; margin: 0 0 10px 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">GOALFORGE</h1>
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
                            ${otp}
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
                          Powered by GoalForge - Track Your Dreams
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

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
