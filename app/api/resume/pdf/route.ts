import { NextRequest } from "next/server";

import { RESUME_DOWNLOAD_COST } from "@/lib/credits";
import { handlePdfRoute } from "@/lib/server/pdf-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handlePdfRoute(request, {
    route: "/api/resume/pdf",
    defaultFileName: "resume",
    eventType: "resume_download",
    costUnits: RESUME_DOWNLOAD_COST,
    buildIdempotencyKey: (userId, requestId) => `resume_download:${userId}:${requestId}`,
    buildMetadata: ({ requestId, fileName }) => ({ requestId, fileName }),
  });
}
