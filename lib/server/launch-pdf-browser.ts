type LaunchResult = Awaited<
  ReturnType<(typeof import("playwright-core"))["chromium"]["launch"]>
>;

const SANDBOX_ARGS = ["--no-sandbox", "--disable-setuid-sandbox"] as const;

export async function launchPdfBrowser(): Promise<LaunchResult> {
  if (process.env.VERCEL) {
    const [{ chromium }, chromiumPack] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
    ]);

    return chromium.launch({
      args: [...chromiumPack.default.args, ...SANDBOX_ARGS],
      executablePath: await chromiumPack.default.executablePath(),
      headless: true,
    });
  }

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
    // Keep local DX working when developers use `playwright` package,
    // while avoiding static tracing of that package into Vercel functions.
    const playwrightPkg = ["play", "wright"].join("");
    const { chromium: localChromium } = (await import(playwrightPkg)) as typeof import("playwright");

    return localChromium.launch({
      headless: true,
      args: [...SANDBOX_ARGS],
    });
  }
}
