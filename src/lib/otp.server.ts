/**
 * OTP (One-Time Password) Service
 * Handles generation, storage, and verification of 4-digit email codes
 */

import { Resend } from "resend";

// Environment configuration
const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const FROM_EMAIL = process.env["RESEND_FROM_EMAIL"] || "noreply@rotary-connect.co.il";

// OTP configuration
const OTP_LENGTH = 4;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

// In-memory OTP storage (for production, use Redis or database)
interface OTPRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const otpStore = new Map<string, OTPRecord>();

// Resend client instance
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY && RESEND_API_KEY !== "re_your_api_key_here";
}

/**
 * Generate a random 4-digit OTP code
 */
function generateOTPCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a session key for OTP storage
 */
function generateSessionKey(): string {
  return `otp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Clean up expired OTP records
 */
function cleanupExpiredOTPs(): void {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

/**
 * Send OTP code to email
 */
export async function sendOTP(email: string): Promise<{ success: boolean; sessionKey?: string; error?: string }> {
  // Clean up old records
  cleanupExpiredOTPs();

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Invalid email format" };
  }

  // Generate OTP
  const code = generateOTPCode();
  const sessionKey = generateSessionKey();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP
  otpStore.set(sessionKey, {
    code,
    email: normalizedEmail,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // Check if Resend is configured
  if (!isResendConfigured()) {
    // Development mode: log the code and return success
    console.log(`[DEV MODE] OTP code for ${normalizedEmail}: ${code}`);
    return { success: true, sessionKey };
  }

  try {
    const resend = getResendClient();

    await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "Rotary Connect Israel - קוד כניסה",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0066CC 0%, #004C99 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Rotary Connect Israel</h1>
            </div>
            <div style="padding: 32px; text-align: center;">
              <p style="color: #333; font-size: 16px; margin: 0 0 24px;">קוד הכניסה שלך הוא:</p>
              <div style="background: #f0f4f8; border-radius: 12px; padding: 24px; margin: 0 auto; display: inline-block;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0066CC;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px; margin: 24px 0 0;">הקוד תקף ל-10 דקות.</p>
              <p style="color: #999; font-size: 12px; margin: 16px 0 0;">אם לא ביקשת קוד זה, ניתן להתעלם מהודעה זו.</p>
            </div>
            <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 11px; margin: 0;">Rotary District 2490 Israel</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `קוד הכניסה שלך ל-Rotary Connect Israel הוא: ${code}\n\nהקוד תקף ל-10 דקות.`,
    });

    return { success: true, sessionKey };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    // Clean up the stored OTP since email failed
    otpStore.delete(sessionKey);
    return { success: false, error: "Failed to send email. Please try again." };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  sessionKey: string,
  code: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  // Clean up old records
  cleanupExpiredOTPs();

  const record = otpStore.get(sessionKey);

  if (!record) {
    return { success: false, error: "Session expired. Please request a new code." };
  }

  // Check if already verified
  if (record.verified) {
    return { success: false, error: "Code already used. Please request a new code." };
  }

  // Check expiry
  if (record.expiresAt < Date.now()) {
    otpStore.delete(sessionKey);
    return { success: false, error: "Code expired. Please request a new code." };
  }

  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(sessionKey);
    return { success: false, error: "Too many attempts. Please request a new code." };
  }

  // Increment attempts
  record.attempts++;

  // Verify code
  if (record.code !== code.trim()) {
    const remainingAttempts = MAX_ATTEMPTS - record.attempts;
    if (remainingAttempts <= 0) {
      otpStore.delete(sessionKey);
      return { success: false, error: "Too many incorrect attempts. Please request a new code." };
    }
    return { success: false, error: `Incorrect code. ${remainingAttempts} attempts remaining.` };
  }

  // Mark as verified
  record.verified = true;

  // Return success with email
  return { success: true, email: record.email };
}

/**
 * Get OTP status (for debugging in development)
 */
export function getOTPStatus(sessionKey: string): { exists: boolean; expired?: boolean; attempts?: number } {
  const record = otpStore.get(sessionKey);
  if (!record) {
    return { exists: false };
  }
  return {
    exists: true,
    expired: record.expiresAt < Date.now(),
    attempts: record.attempts,
  };
}
