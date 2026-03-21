import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import ResumeUploadPageClient from "./client";

export default async function ResumeUploadPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=%2Fresume%2Fupload");
  }

  return <ResumeUploadPageClient />;
}
