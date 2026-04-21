import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const FROM_EMAIL = process.env.EMAIL_FROM ?? "ExpenStream <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your ExpenStream password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0;">ExpenStream</h1>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px;">Reset your password</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to choose a new one. This link expires in 15 minutes.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2D6B5A, #B5654A); color: #fff; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 8px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 13px; color: #2D6B5A; word-break: break-all; margin: 0 0 32px;">
          ${resetLink}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Email] Failed to send password reset email:", error);
    throw new Error("Failed to send email");
  }
}
