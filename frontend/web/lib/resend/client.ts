import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Money OS <noreply@moneyos.in>'

/**
 * Send OTP via email (fallback when SMS fails)
 */
export async function sendOTPEmail(email: string, otp: string, name: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${otp} is your Money OS verification code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Hi ${name || 'there'},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px;">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #ccc; font-size: 12px;">Money OS — Tax-Optimized Savings Planner</p>
      </div>
    `,
  })
}

/**
 * Send SIP allotment confirmation
 */
export async function sendSIPConfirmation(
  email: string,
  data: {
    name: string
    fundName: string
    amount: number
    units: number
    nav: number
    date: string
  }
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `SIP confirmed — ${data.fundName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Hi ${data.name},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your SIP of <strong>₹${data.amount.toLocaleString('en-IN')}</strong> in
          <strong>${data.fundName}</strong> has been processed.
        </p>
        <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #333;">Units allotted: <strong>${data.units}</strong></p>
          <p style="margin: 4px 0; color: #333;">NAV: <strong>₹${data.nav}</strong></p>
          <p style="margin: 4px 0; color: #333;">Date: <strong>${data.date}</strong></p>
        </div>
        <a href="https://moneyos.in/tracker" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Portfolio →</a>
      </div>
    `,
  })
}

/**
 * Send tax deadline reminder
 */
export async function sendTaxDeadlineReminder(
  email: string,
  data: {
    name: string
    daysLeft: number
    headroom: number
    section: string
  }
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${data.daysLeft} days left — ₹${(data.headroom / 1000).toFixed(0)}K ${data.section} headroom unused`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Hi ${data.name},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          You have <strong>₹${data.headroom.toLocaleString('en-IN')}</strong> unused in
          <strong>${data.section}</strong>.
        </p>
        <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-weight: 500;">
            ⏰ ${data.daysLeft} days remaining before March 31
          </p>
        </div>
        <a href="https://moneyos.in/plan/${data.section.toLowerCase()}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Review your plan →</a>
      </div>
    `,
  })
}
