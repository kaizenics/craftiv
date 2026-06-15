import { NextRequest } from "next/server";

import { COVER_LETTER_DOWNLOAD_COST } from "@/lib/credits";
import { handlePdfRoute } from "@/lib/server/pdf-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handlePdfRoute(request, {
    route: "/api/cover-letter/pdf",
    defaultFileName: "cover-letter",
    eventType: "cover_letter_download",
    costUnits: COVER_LETTER_DOWNLOAD_COST,
    buildIdempotencyKey: (userId, requestId) => `cl_download:${userId}:direct_pdf:${requestId}`,
    buildMetadata: ({ requestId }) => ({ requestId, source: "cover-letter-pdf-route" }),
    includeCreditHeaders: true,
  });
}
