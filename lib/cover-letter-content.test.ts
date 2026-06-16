import assert from "node:assert/strict";
import { test } from "vitest";

import { plainToHtmlParagraphs } from "@/lib/cover-letter-content";

test("plainToHtmlParagraphs returns empty string for blank input", () => {
  assert.equal(plainToHtmlParagraphs("   \r\n  "), "");
});

test("plainToHtmlParagraphs respects explicit blank-line breaks and escapes HTML", () => {
  assert.equal(
    plainToHtmlParagraphs("First & <b>para</b>\n\nSecond para"),
    "<p>First &amp; &lt;b&gt;para&lt;/b&gt;</p><p>Second para</p>",
  );
});

test("plainToHtmlParagraphs infers a break before a sign-off", () => {
  assert.equal(
    plainToHtmlParagraphs("Thank you for the opportunity. Best regards, Ada"),
    "<p>Thank you for the opportunity.</p><p>Best regards, Ada</p>",
  );
});

test("plainToHtmlParagraphs converts single newlines to <br/>", () => {
  assert.equal(plainToHtmlParagraphs("line one\nline two"), "<p>line one<br/>line two</p>");
});
