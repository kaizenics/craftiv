import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

type ConsumeCreditsBody = {
  eventType: "resume_download" | "ats_check" | "ai_assistant_message" | string;
  cost: number;
};

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as ConsumeCreditsBody;
    const cost = Number(body?.cost ?? 0);

    if (!Number.isFinite(cost) || cost <= 0) {
      return NextResponse.json({ error: "Invalid credit cost" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      columns: { creditBalance: true },
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = user.creditBalance ?? 0;

    if (currentBalance < cost) {
      return NextResponse.json(
        {
          code: "INSUFFICIENT_CREDITS",
          message: "You do not have enough credits for this action.",
          requiredCredits: cost,
          currentBalance,
        },
        { status: 402 }
      );
    }

    const nextBalance = currentBalance - cost;
    await db
      .update(users)
      .set({ creditBalance: nextBalance, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ ok: true, creditBalance: nextBalance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}