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

  await deliver({ to: input.email, subject, html, text, label: "OTP" });
}

async function deliver(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  label: string;
}) {
  const { apiKey, from } = getResendConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send ${input.label} email: ${response.status} ${body}`);
  }
}

/** Escapes a URL for safe interpolation into the email markup. */
function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function button(url: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeAttribute(url)}" style="background:#0b5cd5;border-radius:8px;color:#fff;display:inline-block;font-weight:600;padding:12px 20px;text-decoration:none">${label}</a></p>
    <p style="font-size:12px;color:#6b7280">Or paste this link into your browser:<br>${escapeAttribute(url)}</p>`;
}

/**
 * Confirms an address belongs to whoever is signing up. Sign-in is gated on this
 * (emailAndPassword.requireEmailVerification), so a failure here leaves the user
 * unable to get in — the error is propagated rather than swallowed.
 */
export async function sendVerificationLinkEmail(input: { email: string; url: string }) {
  await deliver({
    to: input.email,
    subject: "Verify your email",
    label: "verification",
    html: `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <p>Confirm your email address to finish setting up your Craftiv account.</p>
      ${button(input.url, "Verify email")}
      <p style="font-size:12px;color:#6b7280">If you did not create a Craftiv account, you can ignore this email.</p>
    </div>`,
    text: `Confirm your email address to finish setting up your Craftiv account: ${input.url}`,
  });
}

/**
 * Authorises an email change. This goes to the address currently on the account,
 * never the requested one — the point is that the person who holds the existing
 * address approves the move.
 */
export async function sendChangeEmailVerificationEmail(input: {
  email: string;
  newEmail: string;
  url: string;
}) {
  await deliver({
    to: input.email,
    subject: "Confirm your email change",
    label: "email change",
    html: `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <p>We received a request to change the email on your Craftiv account to
        <strong>${escapeAttribute(input.newEmail)}</strong>.</p>
      ${button(input.url, "Confirm change")}
      <p style="font-size:12px;color:#6b7280">If you did not request this, ignore this email and your address stays as it is.</p>
    </div>`,
    text: `Confirm changing your Craftiv email to ${input.newEmail}: ${input.url}`,
  });
}
