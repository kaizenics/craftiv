"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Check, Copy, Loader2, Users } from "@/components/ui/icons";
import { formatCreditValue, INTERVIEW_PREP_COST } from "@/lib/credit-costs";
import { useOwnAiProvider } from "@/lib/use-own-ai-provider";
import { InterviewPrepPreview } from "@/components/dashboard/interview-prep-preview";
import { cn } from "@/lib/utils";

export type InterviewQuestion = {
  question: string;
  type: "role" | "behavioural" | "motivation";
  answer: string;
  tip: string;
};

const TYPE_LABELS: Record<InterviewQuestion["type"], string> = {
  role: "Role",
  behavioural: "Behavioural",
  motivation: "Motivation",
};

type InterviewPrepDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobLabel: string;
  pending: boolean;
  questions: InterviewQuestion[] | null;
  onRun: () => void;
};

export function InterviewPrepDialog({ open, onOpenChange, jobLabel, pending, questions, onRun }: InterviewPrepDialogProps) {
  const ownAiProvider = useOwnAiProvider();
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    if (!questions) return;
    const text = questions
      .map((q, i) => `${i + 1}. ${q.question}\n\n${q.answer}${q.tip ? `\n\nTip: ${q.tip}` : ""}`)
      .join("\n\n---\n\n");
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>Interview prep</DialogTitle>
          <DialogDescription>
            The questions {jobLabel} is likely to ask, with answers built from your resume.
          </DialogDescription>
        </DialogHeader>

        {!questions ? (
          <div className="space-y-5">
          <InterviewPrepPreview />
          <div className="space-y-4">
            <p className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Answers only use what your resume says, so nothing is made up. Where the role asks for
                something your resume lacks, you get a tip for an honest angle. If generation fails, your
                credits are returned.
              </span>
            </p>
            <Button onClick={onRun} disabled={pending} className="w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Preparing questions...
                </>
              ) : (
                <>
                  <Users className="size-4" aria-hidden="true" />
                  {ownAiProvider
                    ? `Prepare with your ${ownAiProvider} key`
                    : `Prepare — ${formatCreditValue(INTERVIEW_PREP_COST)} credits`}
                </>
              )}
            </Button>
          </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Accordion type="single" collapsible defaultValue="q-0" className="border-t border-border">
              {questions.map((q, index) => (
                <AccordionItem key={`${index}-${q.question}`} value={`q-${index}`} className="border-b border-border data-open:bg-transparent">
                  <AccordionTrigger className="items-start px-0 py-4 hover:no-underline">
                    <span className="flex flex-col gap-1 text-left">
                      <span className="text-xs font-medium text-muted-foreground">{TYPE_LABELS[q.type]}</span>
                      <span className="text-[15px] font-medium text-foreground">{q.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="-mx-4 space-y-3 pb-5 text-sm leading-relaxed">
                    <p className="whitespace-pre-line text-foreground">{q.answer}</p>
                    {q.tip ? (
                      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Tip: </span>
                        {q.tip}
                      </p>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={copyAll}>
                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy all"}
              </Button>
              <Button variant="ghost" onClick={onRun} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Generate new set
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
