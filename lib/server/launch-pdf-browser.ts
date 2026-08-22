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

export async function launchPdfBrowser(): Promise<LaunchResult> {
  const { chromium } = await import("playwright-core");
  const localExecutablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    process.env.CHROME_EXECUTABLE_PATH;

  try {
    return await chromium.launch({
      headless: true,
      args: [...SANDBOX_ARGS],
      ...(localExecutablePath ? { executablePath: localExecutablePath } : {}),
    });
  } catch {
    // Fall back to the full `playwright` package and its downloaded browser,
    // which is how a dev machine without a system Chromium resolves this.
    const playwrightPkg = ["play", "wright"].join("");
    const { chromium: localChromium } = (await import(playwrightPkg)) as typeof import("playwright");

    return localChromium.launch({
      headless: true,
      args: [...SANDBOX_ARGS],
    });
  }
}
