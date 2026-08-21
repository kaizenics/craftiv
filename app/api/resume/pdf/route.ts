import { NextRequest } from "next/server";

import { handlePdfRoute } from "@/lib/server/pdf-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handlePdfRoute(request, {
    route: "/api/resume/pdf",
    defaultFileName: "resume",
  });
}
