import assert from "node:assert/strict";
import test from "node:test";

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

