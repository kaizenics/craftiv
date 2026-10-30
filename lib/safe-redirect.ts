const PROBE_ORIGIN = "http://craftiv.invalid";

/**
 * The `?redirect=` target to send someone to after auth, or "/" when it would
 * leave the site. Resolved with the URL parser rather than matched as text, so
 * every spelling a browser treats as another host ("//x", "/\x", "/\t/x")
 * is caught the same way the browser would read it.
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value?.startsWith("/")) return "/";
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return "/";
    const path = `${url.pathname}${url.search}${url.hash}`;
    // Dot segments can collapse into "//host" (e.g. "/.//evil.com"), so check what we return.
    return path.startsWith("//") || path.startsWith("/\\") ? "/" : path;
  } catch {
    return "/";
  }
}
