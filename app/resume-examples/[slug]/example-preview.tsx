"use client";

import { useRouter } from "next/navigation";

import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";
import type { ResumeData } from "@/lib/types/resume";

export function ExamplePreview({ data, color }: { data: ResumeData; color: string }) {
  return (
    <div className="aspect-[210/297] w-full overflow-hidden rounded-sm bg-white shadow-xl ring-1 ring-zinc-200">
      <TemplateLivePreview templateId={data.templateId} color={color} data={data} />
    </div>
  );
}

/**
 * Hands the example to the template picker through the same localStorage key the
 * resume upload uses, so the builder opens pre-filled (sign-in included).
 */
export function UseExampleButton({ data }: { data: ResumeData }) {
  const router = useRouter();
  return (
    <Button
      size="lg"
      onClick={() => {
        localStorage.setItem("uploadedResumeData", JSON.stringify(data));
        router.push("/resume/templates?from=upload");
      }}
    >
      Use this example
      <ArrowRight className="size-4" />
    </Button>
  );
}
