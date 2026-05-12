"use client";

import { trpc } from "./client";

// ── Resume list operations ──────────────────────────────────────────────────

export function useResumes() {
  const utils = trpc.useUtils();

  const list = trpc.resume.listSummary.useQuery();
  const create = trpc.resume.create.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const update = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
    },
  });
  const deleteResume = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const duplicate = trpc.resume.duplicate.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });

  return {
    resumes: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    create,
    update,
    delete: deleteResume,
    duplicate,
    refetch: list.refetch,
  };
}

// ── Single resume ───────────────────────────────────────────────────────────

export function useResume(id: string | null) {
  const utils = trpc.useUtils();

  const query = trpc.resume.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );

  const update = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.getById.invalidate({ id: id! });
      utils.resume.listSummary.invalidate();
    },
  });

  return {
    resume: query.data,
    isLoading: query.isLoading,
    error: query.error,
    update,
    refetch: query.refetch,
  };
}

// ── Current user ────────────────────────────────────────────────────────────

export function useCurrentUser() {
  const user = trpc.user.me.useQuery();
  const stats = trpc.user.stats.useQuery();

  return {
    user: user.data,
    stats: stats.data,
    isLoading: user.isLoading || stats.isLoading,
    error: user.error || stats.error,
  };
}

// ── AI resume improvement ───────────────────────────────────────────────────

export function useResumeAI(resumeId: string) {
  const improveSection = trpc.ai.improveSection.useMutation();
  const improveFullResume = trpc.ai.improveFullResume.useMutation();

  return {
    improveSection: (
      section: "summary" | "experience" | "education",
      content: string,
      targetRole?: string,
      jobDescription?: string,
    ) =>
      improveSection.mutateAsync({ resumeId, section, content, targetRole, jobDescription }),
    improveFullResume: (targetRole?: string, jobDescription?: string) =>
      improveFullResume.mutateAsync({ resumeId, targetRole, jobDescription }),
    isImproving: improveSection.isPending || improveFullResume.isPending,
    error: improveSection.error || improveFullResume.error,
  };
}

// ── Optimistic resume update ────────────────────────────────────────────────

export function useOptimisticResumeUpdate(resumeId: string) {
  const utils = trpc.useUtils();

  return trpc.resume.update.useMutation({
    onMutate: async (newData) => {
      await utils.resume.getById.cancel({ id: resumeId });
      const previousResume = utils.resume.getById.getData({ id: resumeId });

      if (previousResume) {
        utils.resume.getById.setData({ id: resumeId }, {
          ...previousResume,
          ...newData,
        });
      }

      return { previousResume };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousResume) {
        utils.resume.getById.setData({ id: resumeId }, context.previousResume);
      }
    },
    onSettled: () => {
      utils.resume.getById.invalidate({ id: resumeId });
      utils.resume.listSummary.invalidate();
    },
  });
}
