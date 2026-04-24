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

  const { chromium } = await import("playwright");
  return chromium.launch({
    headless: true,
    args: [...SANDBOX_ARGS],
  });
}
