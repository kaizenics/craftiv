# Credits Backend Draft (Exact Rules)

## 1) Credit Costs

- `resume_download`: `1` credit
- `ats_check`: `1` credit per analysis run
- `ai_assistant_message`: `1` credit per successful assistant reply
- `ai_heavy_rewrite` (optional): `2` credits for full-document rewrite flows

## 2) Source Of Truth

- Use a single numeric field on `users`: `creditBalance` (integer, default `1` for starter users).
- Keep `plan` for marketing/pack labeling only; **never** gate feature access by plan.
- Paid purchases only add credits to `creditBalance`.

## 3) Charge Policy

- Charge only on successful execution:
- `resume_download`: charge when PDF generation/export succeeds.
- `ats_check`: charge after ATS report is produced successfully.
- `ai_assistant_message`: charge after at least one assistant token is produced and stream completes.
- Do not charge on validation failures, auth failures, or upstream model failures.

## 4) Idempotency + Ledger

- Add credits ledger table (append-only): `credit_events`
- Required fields:
- `id` (pk), `user_id`, `event_type`, `delta` (negative for usage, positive for purchase),
- `balance_after`, `idempotency_key` (unique), `metadata_json`, `created_at`

- Idempotency key format examples:
- `resume_download:{userId}:{resumeId}:{timestampBucketOrJobId}`
- `ats_check:{userId}:{fileHash}:{jobDescriptionHash}`
- `ai_assistant_message:{userId}:{chatSessionId}:{assistantMessageId}`

- Rule: if same `idempotency_key` exists, return previous result and do not double-charge.

## 5) Atomic Deduction Contract

- Shared function: `consumeCredits({ userId, cost, eventType, idempotencyKey, metadata })`
- Transaction steps:
- Lock/select user row
- If duplicate `idempotency_key`, return replay success
- If `creditBalance < cost`, throw `INSUFFICIENT_CREDITS`
- Subtract balance
- Insert ledger row with negative `delta`
- Commit

## 6) Purchase Contract

- Lemon webhook success:
- Validate transaction uniqueness (existing `processed_transactions`).
- Map purchased pack -> credit amount (`active=+5`, `plus=+12`, `pro=+25`).
- Add to `creditBalance`.
- Insert positive ledger event (`event_type=purchase`).

## 7) API Integration Points

- Resume download:
- Before returning downloadable asset, call `consumeCredits(..., eventType="resume_download", cost=1)`.

- ATS checker (`app/api/ats-check/route.ts`):
- Remove plan checks.
- After report generation succeeds and before `200` response, call `consumeCredits(..., eventType="ats_check", cost=1)`.

- AI assistant stream (`app/api/chatbot/stream/route.ts`):
- Remove plan checks.
- On completed stream (successful assistant output), call `consumeCredits(..., eventType="ai_assistant_message", cost=1)`.
- If stream errors before response content, do not charge.

- tRPC AI mutations (`trpc/routers/ai.ts`):
- Remove plan checks.
- For each successful mutation, deduct according to mapped cost.

## 8) Error Contract

- Standard error:
- `code: "INSUFFICIENT_CREDITS"`
- `message: "You do not have enough credits for this action."`
- `requiredCredits`, `currentBalance`

- Frontend behavior:
- Show inline insufficient-credit message and link to `/pricing`.
- Never show legacy Plus/Pro upgrade dialog.

## 9) Migration Checklist

- Add `users.creditBalance` column (default `1`, non-null).
- Backfill existing paid users:
- `active -> +5`, `plus -> +12`, `pro -> +25` (one-time migration rule, if not already credited by webhook history).
- Create `credit_events` table + unique index on `idempotency_key`.
- Add reusable `credits` service module (`lib/credits.ts`) with `consumeCredits` + `addCredits`.
- Update affected endpoints/mutations to use credits service.

## 10) Rollout Sequence

1. Ship DB migration + credits service.
2. Start writing ledger events for purchases first.
3. Enable deductions for ATS, AI assistant, and downloads.
4. Remove all remaining plan-based gating copy/UI.
5. Add admin audit view for `credit_events`.
