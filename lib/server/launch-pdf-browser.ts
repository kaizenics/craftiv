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
 * Where a distro-packaged Chromium tends to live. These are a last resort: a
 * distro build is not the one Playwright was tested against, and Debian's in
 * particular dies on startup because its crashpad handler rejects the flags
 * Playwright passes. Prefer the browser Playwright installed for itself.
 */
const SYSTEM_CHROMIUM_PATHS = [
  "/usr/bin/chromium",
  "/usr/lib/chromium/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

function describe(error: unknown): string {
  // Playwright's launch errors carry a full browser log; the first lines say
  // what actually went wrong and the rest is noise in an API response.
  const message = error instanceof Error ? error.message : String(error);
  return message.split("\n").slice(0, 4).join(" ").trim();
}

export async function launchPdfBrowser(): Promise<LaunchResult> {
  const { chromium } = await import("playwright-core");
  const failures: string[] = [];

  const explicitPath = (
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? process.env.CHROME_EXECUTABLE_PATH
  )?.trim();

  const attempts: Array<{ label: string; executablePath?: string }> = [
    // An operator naming a binary outranks everything else.
    ...(explicitPath ? [{ label: explicitPath, executablePath: explicitPath }] : []),
    // Playwright's own browser, version-matched to playwright-core. The Docker
    // image installs it during the build; locally it comes from
    // `playwright install`.
    { label: "playwright browser registry" },
    ...SYSTEM_CHROMIUM_PATHS.map((path) => ({ label: path, executablePath: path })),
  ];

  for (const attempt of attempts) {
    if (attempt.executablePath && !existsSync(attempt.executablePath)) {
      failures.push(`${attempt.label}: not present`);
      continue;
    }

    try {
      return await chromium.launch({
        headless: true,
        args: [...SANDBOX_ARGS],
        ...(attempt.executablePath ? { executablePath: attempt.executablePath } : {}),
      });
    } catch (error) {
      failures.push(`${attempt.label}: ${describe(error)}`);
    }
  }

  // Every path is reported, because a launch failure is otherwise invisible
  // from the outside — the caller only ever sees "failed to generate PDF".
  throw new Error(
    `Could not launch Chromium for PDF rendering. Tried:\n${failures
      .map((line) => `  - ${line}`)
      .join("\n")}`,
  );
}
