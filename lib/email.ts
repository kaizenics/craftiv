type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

const OTP_TYPE_LABELS: Record<OtpType, string> = {
  "sign-in": "Sign in",
  "email-verification": "Email verification",
  "forget-password": "Password reset",
  "change-email": "Email change",
};

const getResendConfig = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM || process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY for OTP email delivery.");
  }

  if (!from) {
    throw new Error(
      "Missing AUTH_EMAIL_FROM (or RESEND_FROM_EMAIL) for OTP email delivery.",
    );
  }

  return { apiKey, from };
};

export async function sendAuthOtpEmail(input: {
  email: string;
  otp: string;
  type: OtpType;
}) {
  const { apiKey, from } = getResendConfig();
  const purpose = OTP_TYPE_LABELS[input.type];
  const subject = `${purpose} code`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <p>Your ${purpose.toLowerCase()} code for Craftiv is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${input.otp}</p>
      <p>This code will expire in 5 minutes.</p>
      <p style="font-size:12px;color:#6b7280">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Your ${purpose.toLowerCase()} code for Craftiv is ${input.otp}. This code expires in 5 minutes.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send OTP email: ${response.status} ${body}`);
  }
}
