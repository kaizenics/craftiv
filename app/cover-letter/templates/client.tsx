"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import {
  createEmptyCoverLetterData,
  type CoverLetterTemplateId,
} from "@/lib/types/cover-letter";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";

function CoverLetterTemplateCard({
  templateId,
  onUseTemplate,
}: {
  templateId: CoverLetterTemplateId;
  onUseTemplate: (templateId: CoverLetterTemplateId) => void;
}) {
  const template = coverLetterTemplates.find((t) => t.id === templateId)!;
  const sample = {
    ...createEmptyCoverLetterData(),
    templateId,
    contact: {
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@email.com",
      phone: "+1 555 234 4455",
      address: "123 Market Street",
      city: "San Francisco, CA",
    },
    employer: {
      hiringManagerName: "Hiring Manager",
      companyName: "Nimbus Tech",
      companyAddress: "San Francisco, CA",
      jobTitle: "Product Manager",
    },
    content:
      "Dear Hiring Manager,\n\nI am excited to apply for the Product Manager role at Nimbus Tech. I bring experience launching customer-focused features and cross-functional execution.\n\nThank you for your time and consideration.\n\nSincerely,\nAlex Rivera",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <div className="relative aspect-3/4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-zinc-300">
        <div className="absolute inset-0 p-2">
          <CoverLetterPreview
            data={sample}
            className="h-full max-w-none rounded-md border border-zinc-200 shadow-none"
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            onClick={() => onUseTemplate(templateId)}
            className="transform scale-95 transition-transform duration-300 group-hover:scale-100"
            size="lg"
          >
            <FileText className="mr-2 h-4 w-4" />
            Use this template
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-zinc-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-700">{template.name}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
            {template.badge}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-lg font-semibold text-zinc-900">{template.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600">{template.description}</p>
      </div>
    </motion.div>
  );
}

export default function CoverLetterTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const existingCoverLetterId = searchParams.get("id");

  const handleUseTemplate = (templateId: CoverLetterTemplateId) => {
    const target = existingCoverLetterId
      ? `/cover-letter/write?id=${existingCoverLetterId}&template=${templateId}`
      : `/cover-letter/write?template=${templateId}`;

    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(target)}`);
      return;
    }

    router.push(target);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="border-b border-zinc-100 bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              1
            </span>
            <span className="text-sm font-medium text-zinc-900">Choose template</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              2
            </span>
            <span className="text-sm text-zinc-500">Write content</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              3
            </span>
            <span className="text-sm text-zinc-500">Save & download</span>
          </div>
        </div>
      </div>

      <div className="py-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold text-zinc-900 sm:text-5xl"
        >
          Cover letter templates
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-base text-zinc-600"
        >
          Pick a template style first, then write and customize your cover letter.
        </motion.p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          {coverLetterTemplates.map((template) => (
            <CoverLetterTemplateCard
              key={template.id}
              templateId={template.id}
              onUseTemplate={handleUseTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
