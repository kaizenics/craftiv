/**
 * The hunt digest email.
 *
 * The builder is pure so it can be tested without sending anything, and every
 * interpolated value is escaped: job titles and company names are third-party
 * text that arrives from a job board or a paste box, and they end up inside
 * HTML. That is a real injection vector, not a theoretical one.
 */

export type DigestJob = {
  title: string;
  company: string;
  score: number;
  url: string;
};

export type DigestMovedJob = {
  title: string;
  company: string;
  beforeScore: number;
  afterScore: number;
};

export type DigestInput = {
  huntName: string;
  appUrl: string;
  newJobs: DigestJob[];
  movedJobs: DigestMovedJob[];
  staleCount: number;
  /** Set when the run could not proceed, e.g. the hunt's resume was deleted. */
  problem?: string | null;
};

export type BuiltDigest = {
  subject: string;
  html: string;
  text: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) URLs reach an href, so a javascript: URL can never be linked. */
function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return escapeHtml(url.toString());
  } catch {
    return null;
  }
}

function jobLine(job: DigestJob): string {
  const label = [job.title, job.company].filter(Boolean).join(" — ");
  const href = safeHref(job.url);
  const name = href
    ? `<a href="${href}" style="color:#0b5cd5;text-decoration:none">${escapeHtml(label)}</a>`
    : escapeHtml(label);

  return `<li style="margin:6px 0">${name} <span style="color:#6b7280">· match ${job.score}</span></li>`;
}

/**
 * Returns null when there is nothing worth saying.
 *
 * An empty digest trains people to ignore the next one and is how a sending
 * domain gets marked as spam -- which would degrade the password-reset mail
 * that shares it.
 */
export function buildJobDigestEmail(input: DigestInput): BuiltDigest | null {
  const hasContent =
    input.newJobs.length > 0 ||
    input.movedJobs.length > 0 ||
    input.staleCount > 0 ||
    Boolean(input.problem);

  if (!hasContent) return null;

  const name = escapeHtml(input.huntName);
  const dashboardHref = safeHref(`${input.appUrl.replace(/\/$/, "")}/dashboard/job-hunter`);

  const subject = input.problem
    ? `Your hunt "${input.huntName}" needs attention`
    : input.newJobs.length > 0
      ? `${input.newJobs.length} new job${input.newJobs.length === 1 ? "" : "s"} for ${input.huntName}`
      : `Your hunt "${input.huntName}" has updates`;

  const sections: string[] = [];
  const textSections: string[] = [];

  if (input.problem) {
    sections.push(
      `<p style="background:#fef2f2;border-radius:8px;color:#991b1b;padding:12px">${escapeHtml(
        input.problem,
      )}</p>`,
    );
    textSections.push(input.problem);
  }

  if (input.newJobs.length > 0) {
    sections.push(
      `<h2 style="font-size:16px;margin:24px 0 8px">New matches</h2><ul style="padding-left:18px">${input.newJobs
        .map(jobLine)
        .join("")}</ul>`,
    );
    textSections.push(
      `New matches:\n${input.newJobs
        .map((job) => `- ${[job.title, job.company].filter(Boolean).join(" — ")} (match ${job.score})\n  ${job.url}`)
        .join("\n")}`,
    );
  }

  if (input.movedJobs.length > 0) {
    // The re-score result: this is what makes a scheduled run worth having even
    // when no new job was found.
    sections.push(
      `<h2 style="font-size:16px;margin:24px 0 8px">You edited your resume</h2>
       <p style="color:#374151;margin:0 0 8px">These saved jobs moved:</p>
       <ul style="padding-left:18px">${input.movedJobs
         .map((job) => {
           const label = escapeHtml([job.title, job.company].filter(Boolean).join(" — "));
           const arrow = job.afterScore >= job.beforeScore ? "&uarr;" : "&darr;";
           return `<li style="margin:6px 0">${label} <span style="color:#6b7280">· ${job.beforeScore} ${arrow} ${job.afterScore}</span></li>`;
         })
         .join("")}</ul>`,
    );
    textSections.push(
      `Your resume changed, so these moved:\n${input.movedJobs
        .map((job) => `- ${[job.title, job.company].filter(Boolean).join(" — ")}: ${job.beforeScore} -> ${job.afterScore}`)
        .join("\n")}`,
    );
  }

  if (input.staleCount > 0) {
    const line = `${input.staleCount} saved job${input.staleCount === 1 ? " is" : "s are"} over 45 days old and may have been filled.`;
    sections.push(`<p style="color:#374151;margin:24px 0 0">${escapeHtml(line)}</p>`);
    textSections.push(line);
  }

  const cta = dashboardHref
    ? `<p style="margin:28px 0"><a href="${dashboardHref}" style="background:#0b5cd5;border-radius:8px;color:#fff;display:inline-block;font-weight:600;padding:12px 20px;text-decoration:none">Open Job Hunter</a></p>`
    : "";

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px">
  <h1 style="font-size:20px;margin:0 0 4px">${name}</h1>
  <p style="color:#6b7280;margin:0">Here is what changed since your last run.</p>
  ${sections.join("")}
  ${cta}
  <p style="border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;margin-top:28px;padding-top:12px">
    You are getting this because you turned on digest emails for this hunt.
    Turn them off in Job Hunter at any time.
  </p>
</div>`;

  const text = `${input.huntName}\n\n${textSections.join("\n\n")}\n\nOpen Job Hunter: ${input.appUrl.replace(/\/$/, "")}/dashboard/job-hunter`;

  return { subject, html, text };
}
