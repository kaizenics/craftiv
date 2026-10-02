export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkServerEnv } = await import("@/lib/env-check");
  checkServerEnv();
}
