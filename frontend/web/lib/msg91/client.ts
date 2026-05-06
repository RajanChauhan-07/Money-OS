const MSG91_API_KEY = process.env.MSG91_API_KEY!
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID!

/**
 * Send OTP via MSG91 SMS API
 */
export async function sendOTPSMS(
  mobile: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: MSG91_API_KEY,
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        mobile: `91${mobile}`,
        otp,
        otp_expiry: 10, // 10 minutes
      }),
    })

    const data = await response.json()

    if (data.type === 'success') {
      return { success: true, message: 'OTP sent successfully' }
    }

    return { success: false, message: data.message || 'Failed to send OTP' }
  } catch (error) {
    console.error('MSG91 SMS error:', error)
    return { success: false, message: 'SMS service unavailable' }
  }
}

/**
 * Verify OTP via MSG91 (not used in our flow — we verify via bcrypt)
 * Kept for future use if we want to use MSG91's built-in verification
 */
export async function verifyMSG91OTP(
  mobile: string,
  otp: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.msg91.com/api/v5/otp/verify?mobile=91${mobile}&otp=${otp}`,
      {
        headers: { authkey: MSG91_API_KEY },
      }
    )
    const data = await response.json()
    return data.type === 'success'
  } catch {
    return false
  }
}
