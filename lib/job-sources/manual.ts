import type { JobSourceAdapter, NormalizedJob, UserJobInput } from "./types";
import {
  buildSourceKey,
  capDescription,
  guessCompanyFromText,
  guessTitleFromText,
  hashJobIdentity,
} from "./normalize";
import type { JobProvenance } from "@/lib/types/job-hunter";

/**
 * The fallback source: a job pasted from somewhere Craftiv has no adapter for.
 *
 * Identity is a content hash rather than a provider id, so pasting the same
 * advert twice reuses the row instead of creating a second one. Everything here
 * is deterministic -- importing a job costs no credits and makes no model call.
 * The LLM parse is an opt-in cleanup, not a prerequisite.
 */
export const manualAdapter: JobSourceAdapter = {
  id: "manual",
  label: "Pasted job",

  capabilities: {
    pollable: false,
    identifiableFromUrl: false,
    fetchableOnDemand: false,
    crawlDelaySeconds: 0,
    attribution: null,
    restrictionNote: null,
  },

  fromUserInput(input: UserJobInput, provenance: JobProvenance): NormalizedJob {
    const rawDescription = input.description ?? "";
    const { description, descriptionTruncated } = capDescription(rawDescription);

    const title = input.title?.trim() || guessTitleFromText(description);
    const company = input.company?.trim() || guessCompanyFromText(description);

    const externalId = hashJobIdentity({
      title,
      company,
      description,
      url: input.url,
    });

    return {
      source: "manual",
      externalId,
      sourceKey: buildSourceKey("manual", externalId),
      provenance,
      title,
      company,
      location: input.location?.trim() || "",
      employmentType: "",
      salaryText: "",
      url: input.url ?? "",
      applyUrl: input.url ?? "",
      description,
      descriptionTruncated,
      postedAt: null,
      raw: null,
    };
  },
};
