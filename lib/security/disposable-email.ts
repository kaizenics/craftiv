const COMMON_DISPOSABLE_EMAIL_DOMAINS = new Set(
  [
    "10minutemail.com",
    "20minutemail.com",
    "dispostable.com",
    "emailondeck.com",
    "fakeinbox.com",
    "getairmail.com",
    "guerrillamail.com",
    "maildrop.cc",
    "mailinator.com",
    "mintemail.com",
    "sharklasers.com",
    "tempmail.com",
    "temp-mail.org",
    "tempr.email",
    "throwawaymail.com",
    "trashmail.com",
    "yopmail.com",
  ].map((domain) => domain.toLowerCase()),
);

function getConfiguredDisposableDomains() {
  const raw = process.env.DISPOSABLE_EMAIL_BLOCKLIST;
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isDisposableEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;

  const domain = email.slice(at + 1).toLowerCase();
  const blocklist = [
    ...COMMON_DISPOSABLE_EMAIL_DOMAINS,
    ...getConfiguredDisposableDomains(),
  ];

  return blocklist.some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith(`.${blockedDomain}`),
  );
}
