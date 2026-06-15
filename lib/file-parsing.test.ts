import assert from "node:assert/strict";
import { test } from "vitest";

import { getUploadKind } from "@/lib/file-parsing";

test("getUploadKind detects PDF and DOCX case-insensitively", () => {
  assert.deepEqual(getUploadKind("Resume.PDF"), { isPDF: true, isDOCX: false, isSupported: true });
  assert.deepEqual(getUploadKind("resume.docx"), { isPDF: false, isDOCX: true, isSupported: true });
});

test("getUploadKind rejects unsupported extensions", () => {
  assert.deepEqual(getUploadKind("resume.txt"), { isPDF: false, isDOCX: false, isSupported: false });
  assert.deepEqual(getUploadKind("resume"), { isPDF: false, isDOCX: false, isSupported: false });
});
