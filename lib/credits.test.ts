import assert from "node:assert/strict";
import { test } from "vitest";

import { SERVER_CREDIT_COSTS } from "@/lib/credits";

test("server credit costs include all protected event types", () => {
  const required = [
    "resume_download",
    "cover_letter_download",
    "resume_parse",
    "ats_check",
    "resume_layout_chat",
    "chatbot_stream",
    "ai_resume_improver",
    "ai_keyword_booster",
    "ai_achievement_builder",
    "ai_spell_check",
    "ai_suggestion",
    "ai_cover_letter",
  ] as const;

  for (const key of required) {
    assert.equal(typeof SERVER_CREDIT_COSTS[key], "number");
    assert.equal(SERVER_CREDIT_COSTS[key] > 0, true);
  }
});

// Locks the exact cost values so refactors that move these constants around (Phase 1)
// cannot silently change what users are charged.
test("server credit costs keep their current unit values", () => {
  assert.deepEqual(
    { ...SERVER_CREDIT_COSTS },
    {
      ats_check: 100,
      resume_download: 100,
      cover_letter_download: 50,
      cover_letter_ai_session: 50,
      resume_parse: 50,
      resume_layout_chat: 25,
      chatbot_stream: 10,
      ai_resume_improver: 50,
      ai_keyword_booster: 25,
      ai_achievement_builder: 25,
      ai_spell_check: 25,
      ai_suggestion: 25,
      ai_cover_letter: 50,
    },
  );
});

