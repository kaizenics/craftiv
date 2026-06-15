import assert from "node:assert/strict";
import { test } from "vitest";

import { escapeHtml, toSafeFileName } from "@/lib/html-sanitize";

test("escapeHtml escapes the five HTML-significant characters", () => {
  assert.equal(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`), "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#039;Jerry&#039;&lt;/a&gt;");
  assert.equal(escapeHtml("plain text"), "plain text");
});

test("toSafeFileName replaces illegal characters and uses the fallback when empty", () => {
  assert.equal(toSafeFileName('My/Resume:2024?.pdf'), "My_Resume_2024_.pdf");
  // Only falsy values hit the fallback; whitespace is truthy and trims to "".
  assert.equal(toSafeFileName(""), "document");
  assert.equal(toSafeFileName("   "), "");
  assert.equal(toSafeFileName("", "cover-letter"), "cover-letter");
});
