export type SharedJobTargetDraft = {
  role: string;
  jobDescription: string;
  updatedAt?: string;
};

const SHARED_JOB_TARGET_KEY = "craftiv:shared-job-target";
const LEGACY_ASSISTANT_KEY = "resumeAiJobTarget";
const LEGACY_ATS_KEY = "atsJobDescriptionDraft";

function parseDraft(raw: string | null): SharedJobTargetDraft | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      role?: string;
      description?: string;
      jobDescription?: string;
      updatedAt?: string;
    };

    return {
      role: parsed.role?.trim() || "",
      jobDescription: parsed.jobDescription?.trim() || parsed.description?.trim() || "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function readSharedJobTargetDraft(storage: Pick<Storage, "getItem">) {
  const shared = parseDraft(storage.getItem(SHARED_JOB_TARGET_KEY));
  if (shared && (shared.role || shared.jobDescription)) {
    return shared;
  }

  const assistant = parseDraft(storage.getItem(LEGACY_ASSISTANT_KEY));
  if (assistant && (assistant.role || assistant.jobDescription)) {
    return assistant;
  }

  const ats = parseDraft(storage.getItem(LEGACY_ATS_KEY));
  if (ats && ats.jobDescription) {
    return ats;
  }

  return {
    role: "",
    jobDescription: "",
  };
}

export function writeSharedJobTargetDraft(
  storage: Pick<Storage, "setItem">,
  draft: SharedJobTargetDraft,
) {
  const normalized = {
    role: draft.role.trim(),
    jobDescription: draft.jobDescription.trim(),
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };

  storage.setItem(SHARED_JOB_TARGET_KEY, JSON.stringify(normalized));
}
