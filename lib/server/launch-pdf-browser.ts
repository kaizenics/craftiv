import { existsSync } from "node:fs";

type LaunchResult = Awaited<
  ReturnType<(typeof import("playwright-core"))["chromium"]["launch"]>
>;

// Containers give /dev/shm only 64MB by default, which is where Chromium
// crashes rendering a full page; --disable-dev-shm-usage moves it to /tmp.
const SANDBOX_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
] as const;

/**
 * Where a system Chromium tends to live, most specific first. The env vars come
 * from the deployment (the Docker image sets the first one); the rest are the
 * paths Debian, Alpine and Google's own package install to.
 */
function chromiumCandidates(): string[] {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];

  return Array.from(
    new Set(candidates.map((path) => path?.trim()).filter((path): path is string => !!path)),
  );
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function launchPdfBrowser(): Promise<LaunchResult> {
  const { chromium } = await import("playwright-core");
  const failures: string[] = [];

  for (const executablePath of chromiumCandidates()) {
    if (!existsSync(executablePath)) {
      failures.push(`${executablePath}: not present`);
      continue;
    }

    try {
      return await chromium.launch({
        headless: true,
        args: [...SANDBOX_ARGS],
        executablePath,
      });
    } catch (error) {
      failures.push(`${executablePath}: ${describe(error)}`);
    }
  }

  // No system browser worked. Let playwright-core try its own registry, which is
  // how a dev machine resolves this after `playwright install`.
  try {
    return await chromium.launch({ headless: true, args: [...SANDBOX_ARGS] });
  } catch (error) {
    failures.push(`playwright registry: ${describe(error)}`);
  }

  // Every path is reported, because a launch failure is otherwise invisible
  // from the outside — the caller only ever sees "failed to generate PDF".
  throw new Error(
    `Could not launch Chromium for PDF rendering. Tried:\n${failures
      .map((line) => `  - ${line}`)
      .join("\n")}`,
  );
}
