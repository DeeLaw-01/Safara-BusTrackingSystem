import nodemailer from 'nodemailer'
import type { OtpType } from '../models/otp.model'

function createTransporter () {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_APP_PASSWORD

  if (!emailUser || !emailPassword) {
    throw new Error(
      'Email credentials not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file.'
    )
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword, // Gmail App Password (not account password)
    },
  })
}

function buildOtpHtml (otp: string, type: OtpType, expiresInMinutes = 10): string {
  const isRegister = type === 'register'
  const title = isRegister ? 'Verify Your Email' : 'Reset Your Password'
  const message = isRegister
    ? 'Use the code below to verify your email and complete your BusTrack account registration.'
    : 'Use the code below to reset your BusTrack account password.'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Poppins',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:16px;overflow:hidden;
                            box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#f95f5f;padding:32px;text-align:center;">
                    <div style="font-size:28px;margin-bottom:8px;">🚌</div>
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;
                               letter-spacing:-0.5px;">BusTrack</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="color:#111827;font-size:18px;font-weight:600;
                               margin:0 0 12px;">${title}</h2>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                      ${message}
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#fef2f2;border:2px dashed #f95f5f;
                                border-radius:12px;padding:24px;text-align:center;
                                margin-bottom:32px;">
                      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;
                                text-transform:uppercase;letter-spacing:1px;">
                        Your verification code
                      </p>
                      <div style="font-size:40px;font-weight:700;color:#f95f5f;
                                  letter-spacing:10px;">${otp}</div>
                    </div>

                    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                      This code expires in <strong>${expiresInMinutes} minutes</strong>.<br/>
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:16px 32px;text-align:center;
                             border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:11px;margin:0;">
                      &copy; ${new Date().getFullYear()} BusTrack. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export async function sendOtpEmail (
  email: string,
  otp: string,
  type: OtpType
): Promise<void> {
  const transporter = createTransporter()
  const subject =
    type === 'register'
      ? 'Your BusTrack verification code'
      : 'Reset your BusTrack password'

  await transporter.sendMail({
    from: `"BusTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: buildOtpHtml(otp, type),
  })
}
