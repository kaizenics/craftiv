"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Users } from "@/components/ui/icons";
import { formatCreditValue, INTERVIEW_PREP_COST } from "@/lib/credit-costs";
import { useOwnAiProvider } from "@/lib/use-own-ai-provider";
import { InterviewPrepPreview } from "@/components/dashboard/interview-prep-preview";
import { trpc } from "@/trpc/client";

export function interviewPrepHref(matchId: string) {
  return `/dashboard/applications/${matchId}/interview`;
}

type InterviewPrepDialogProps = {
  /** The job to prepare for; null keeps the dialog closed. */
  matchId: string | null;
  jobLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * The first, paid step only. Once a set is generated it is saved and the user is
 * taken to the job's Interview Prep page, where it can be reopened for free.
 */
export function InterviewPrepDialog({ matchId, jobLabel, onOpenChange }: InterviewPrepDialogProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const ownAiProvider = useOwnAiProvider();
  const interviewPrep = trpc.jobHunter.interviewPrep.useMutation({
    onSuccess: async (result) => {
      await utils.jobHunter.preppedMatchIds.invalidate();
      onOpenChange(false);
      router.push(interviewPrepHref(result.matchId));
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={matchId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Interview prep</DialogTitle>
          <DialogDescription>
            The questions {jobLabel} is likely to ask, with answers built from your resume.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <InterviewPrepPreview />
          <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Answers only use what your resume says, so nothing is made up. Where the role asks for something
              your resume lacks, you get a tip for an honest angle. Your prep is saved to this job, and if
              generation fails your credits are returned.
            </span>
          </p>
          <Button
            onClick={() => matchId && interviewPrep.mutate({ matchId })}
            disabled={interviewPrep.isPending || !matchId}
            className="w-full"
          >
            {interviewPrep.isPending ? (
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
      </DialogContent>
    </Dialog>
  );
}
