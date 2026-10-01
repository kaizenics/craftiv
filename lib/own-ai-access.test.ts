import OpenAI from "openai";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const findConnection = vi.fn();
const findUser = vi.fn();
const consumeCredits = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      userAiProviders: { findFirst: (...args: unknown[]) => findConnection(...args) },
      users: { findFirst: (...args: unknown[]) => findUser(...args) },
    },
  },
}));

vi.mock("@/lib/credits", () => ({
  consumeCredits: (...args: unknown[]) => consumeCredits(...args),
  fromCreditUnits: (units: number) => units / 100,
}));

const previousSecret = process.env.AI_KEY_ENCRYPTION_KEY;
process.env.AI_KEY_ENCRYPTION_KEY = "test-secret-that-is-definitely-long-enough-0123456789";
// lib/ai builds Craftiv's OpenRouter client at import time, which needs a key.
process.env.OPENROUTER_API_KEY ||= "test-openrouter-key";

const { encryptApiKey } = await import("@/lib/ai-key-crypto");
const { beginAiAction, describeAiCharge } = await import("@/lib/own-ai-access");
const { OwnAiError, toOwnAiError } = await import("@/lib/own-ai");

const CHARGE = {
  userId: "user-1",
  eventType: "ats_check",
  costUnits: 100,
  idempotencyKey: "ats_check:user-1:abc",
};

function savedConnection(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    provider: "openai",
    model: "gpt-5-mini",
    encryptedKey: encryptApiKey("sk-proj-abcdefghijklmnopqrstuvwxyz"),
    keyHint: "…wxyz",
    enabled: true,
    ...overrides,
  };
}

beforeEach(() => {
  findConnection.mockReset();
  findUser.mockReset();
  consumeCredits.mockReset();
  consumeCredits.mockResolvedValue({ replayed: false, balanceUnits: 400, deltaUnits: -100 });
});

afterAll(() => {
  process.env.AI_KEY_ENCRYPTION_KEY = previousSecret;
});

describe("beginAiAction", () => {
  it("charges credits when no provider is connected", async () => {
    findConnection.mockResolvedValue(undefined);

    const { ai, charge } = await beginAiAction(CHARGE);

    expect(ai).toEqual({ source: "craftiv" });
    expect(charge).not.toBeNull();
    expect(consumeCredits).toHaveBeenCalledWith(CHARGE);
  });

  it("runs on the user's key and charges nothing when own AI is on and unlocked", async () => {
    findConnection.mockResolvedValue(savedConnection());
    findUser.mockResolvedValue({ isPaid: true });

    const { ai, charge } = await beginAiAction(CHARGE);

    expect(ai).toEqual({
      source: "own",
      provider: "openai",
      model: "gpt-5-mini",
      apiKey: "sk-proj-abcdefghijklmnopqrstuvwxyz",
    });
    expect(charge).toBeNull();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it("charges credits when the user switched own AI off", async () => {
    findConnection.mockResolvedValue(savedConnection({ enabled: false }));
    findUser.mockResolvedValue({ isPaid: true });

    const { ai } = await beginAiAction(CHARGE);

    expect(ai.source).toBe("craftiv");
    expect(consumeCredits).toHaveBeenCalledOnce();
  });

  it("charges credits when the account has not bought a pack (or was refunded)", async () => {
    findConnection.mockResolvedValue(savedConnection());
    findUser.mockResolvedValue({ isPaid: false });

    const { ai } = await beginAiAction(CHARGE);

    expect(ai.source).toBe("craftiv");
    expect(consumeCredits).toHaveBeenCalledOnce();
  });

  it("errors rather than quietly charging credits when the saved key is unreadable", async () => {
    findConnection.mockResolvedValue(savedConnection({ encryptedKey: "v1.bad.bad.bad" }));
    findUser.mockResolvedValue({ isPaid: true });

    await expect(beginAiAction(CHARGE)).rejects.toBeInstanceOf(OwnAiError);
    expect(consumeCredits).not.toHaveBeenCalled();
  });
});

describe("describeAiCharge", () => {
  it("reports zero credits for the user's own AI", () => {
    expect(describeAiCharge(null)).toMatchObject({ ownAi: true, chargedCredits: 0 });
  });

  it("reports the real cost, not a hard-coded one", () => {
    expect(describeAiCharge({ replayed: false, balanceUnits: 375, deltaUnits: -25 })).toEqual({
      ownAi: false,
      chargedCredits: 0.25,
      balanceCredits: 3.75,
      balanceUnits: 375,
      replayed: false,
    });
  });
});

describe("toOwnAiError", () => {
  const connection = { provider: "openai" as const, model: "gpt-5-mini" };

  it("never echoes the provider's auth error, which can contain part of the key", () => {
    const providerError = new OpenAI.AuthenticationError(
      401,
      undefined,
      "Incorrect API key provided: sk-proj-abc***wxyz",
      new Headers(),
    );

    const error = toOwnAiError(providerError, connection);

    expect(error.message).not.toContain("sk-proj");
    expect(error.message).toContain("rejected your API key");
  });

  it("points quota problems at the provider's billing", () => {
    const providerError = new OpenAI.RateLimitError(429, undefined, "quota", new Headers());
    expect(toOwnAiError(providerError, connection).message).toContain("out of quota");
  });

  it("names the model when the provider does not know it", () => {
    const providerError = new OpenAI.NotFoundError(404, undefined, "not found", new Headers());
    expect(toOwnAiError(providerError, connection).message).toContain('"gpt-5-mini"');
  });
});
