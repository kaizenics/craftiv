import type { ResumeDataJSON } from "@/db/schema";

const ACTION_VERBS = [
  "built",
  "led",
  "designed",
  "implemented",
  "improved",
  "optimized",
  "developed",
  "created",
  "managed",
  "delivered",
  "launched",
  "automated",
  "reduced",
  "increased",
  "scaled",
];

const GENERIC_ATS_KEYWORDS = [
  "leadership",
  "communication",
  "collaboration",
  "problem solving",
  "project management",
  "stakeholder management",
  "analysis",
  "results",
  "strategy",
  "ownership",
  "impact",
  "agile",
];

const PHRASE_KEYWORDS = [
  "project management",
  "stakeholder management",
  "problem solving",
  "data analysis",
  "machine learning",
  "cross functional",
  "continuous integration",
  "continuous delivery",
  "customer success",
  "user experience",
  "frontend development",
  "backend development",
  "quality assurance",
  "change management",
  "process improvement",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "you",
  "your",
  "are",
  "our",
  "was",
  "were",
  "have",
  "has",
  "had",
  "will",
  "would",
  "should",
  "can",
  "could",
  "job",
  "role",
  "work",
  "years",
  "year",
  "experience",
  "required",
  "preferred",
  "using",
  "within",
  "across",
  "ability",
  "skills",
  "skill",
  "team",
  "teams",
  "strong",
  "plus",
  "preferred",
  "required",
]);

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  javascript: ["javascript", "js"],
  typescript: ["typescript", "ts"],
  react: ["react", "reactjs", "react.js"],
  "next.js": ["next.js", "nextjs"],
  node: ["node", "nodejs", "node.js"],
  aws: ["aws", "amazon web services"],
  sql: ["sql", "postgres", "postgresql", "mysql", "sqlite"],
  kubernetes: ["kubernetes", "k8s"],
  "ci/cd": ["ci/cd", "ci cd", "continuous integration", "continuous delivery"],
  "project management": ["project management", "program management"],
  "stakeholder management": ["stakeholder management", "stakeholder communication"],
  "problem solving": ["problem solving", "problem-solving"],
  "cross functional": ["cross functional", "cross-functional"],
  communication: ["communication", "communications"],
  collaboration: ["collaboration", "collaborative"],
  leadership: ["leadership", "leading"],
  analysis: ["analysis", "analytical"],
  strategy: ["strategy", "strategic"],
  agile: ["agile", "scrum"],
};

const PLACEHOLDER_PATTERN = /\[[^[\]]{1,40}\]/g;

export const ATS_SCORING_VERSION = "ats-2026-05-v1";

export type AtsSectionScore = {
  section: string;
  score: number;
  notes: string;
};

export type AtsReport = {
  overallScore: number;
  atsCompatibility: "Low" | "Medium" | "High";
  sectionScores: AtsSectionScore[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  topActions: string[];
  placeholderWarnings: string[];
  parseWarnings: string[];
  scoringVersion: string;
};

export type AtsImpact = {
  beforeScore: number;
  afterScore: number;
  changedSections: string[];
  matchedKeywordsAdded: string[];
  warnings: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForMatching(text: string) {
  return normalizeWhitespace(
    text
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^\w\s+#./-]+/g, " ")
      .replace(/[./_-]+/g, " "),
  );
}

function foldToken(token: string) {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.endsWith("ies") && trimmed.length > 4) return `${trimmed.slice(0, -3)}y`;
  if (trimmed.endsWith("es") && trimmed.length > 4) return trimmed.slice(0, -2);
  if (trimmed.endsWith("s") && trimmed.length > 3) return trimmed.slice(0, -1);
  return trimmed;
}

function tokenize(text: string) {
  return normalizeForMatching(text)
    .split(" ")
    .map((token) => foldToken(token))
    .filter(Boolean);
}

function hasSection(text: string, sectionName: string) {
  return new RegExp(`\\b${sectionName}\\b`, "i").test(text);
}

function canonicalizeKeyword(keyword: string) {
  const normalized = normalizeForMatching(keyword);
  for (const [canonical, variants] of Object.entries(KEYWORD_SYNONYMS)) {
    if ([canonical, ...variants].some((variant) => normalizeForMatching(variant) === normalized)) {
      return canonical;
    }
  }
  return normalized;
}

function getKeywordVariants(keyword: string) {
  const canonical = canonicalizeKeyword(keyword);
  const variants = new Set<string>([canonicalizeKeyword(keyword), normalizeForMatching(keyword)]);
  for (const variant of KEYWORD_SYNONYMS[canonical] ?? []) {
    variants.add(normalizeForMatching(variant));
  }
  variants.add(normalizeForMatching(canonical));
  return [...variants].filter(Boolean);
}

function containsVariant(normalizedText: string, tokens: Set<string>, keyword: string) {
  return getKeywordVariants(keyword).some((variant) => {
    if (!variant) return false;
    if (variant.includes(" ")) {
      return normalizedText.includes(variant);
    }
    return tokens.has(foldToken(variant));
  });
}

function dedupeKeywords(keywords: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const keyword of keywords) {
    const canonical = canonicalizeKeyword(keyword);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(keyword);
  }

  return result;
}

export function extractJobKeywords(jobDescription: string): string[] {
  const normalizedText = normalizeForMatching(jobDescription);
  if (!normalizedText) return [];

  const phraseMatches = PHRASE_KEYWORDS.filter((phrase) => normalizedText.includes(phrase));
  const tokens = tokenize(jobDescription).filter(
    (token) => token.length >= 3 && !STOPWORDS.has(token),
  );

  const frequency = new Map<string, number>();
  for (const token of tokens) {
    const canonical = canonicalizeKeyword(token);
    frequency.set(canonical, (frequency.get(canonical) || 0) + 1);
  }

  const singleTerms = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([keyword]) => keyword);

  return dedupeKeywords([...phraseMatches, ...singleTerms]).slice(0, 20);
}

export function findPlaceholderWarnings(text: string): string[] {
  const matches = text.match(PLACEHOLDER_PATTERN) || [];
  const placeholders = dedupeKeywords(
    matches.filter((token) => /[a-z]/i.test(token) || token.includes("%") || token.includes("$")),
  );

  return placeholders.map((token) => `Unresolved placeholder found: ${token}`);
}

export function formatResumeDataForAts(data: ResumeDataJSON): string {
  const sections: string[] = [];

  const contactLines = [
    `${data.contact.firstName || ""} ${data.contact.lastName || ""}`.trim(),
    data.contact.desiredJobTitle?.trim(),
    data.contact.email?.trim(),
    data.contact.phone?.trim(),
  ].filter(Boolean);
  if (contactLines.length > 0) {
    sections.push(`Contact\n${contactLines.join("\n")}`);
  }

  if (data.summary?.trim()) {
    sections.push(`Summary\n${data.summary.trim()}`);
  }

  if (data.experiences.length > 0) {
    const lines = data.experiences
      .map((exp) => {
        const heading = [
          exp.jobTitle?.trim(),
          exp.employer?.trim(),
          exp.location?.trim(),
          [exp.startDate?.trim(), exp.isCurrentJob ? "Present" : exp.endDate?.trim()].filter(Boolean).join(" - "),
        ]
          .filter(Boolean)
          .join(" | ");
        const description = exp.description?.trim();
        return [heading, description].filter(Boolean).join("\n");
      })
      .filter(Boolean);
    if (lines.length > 0) {
      sections.push(`Experience\n${lines.join("\n\n")}`);
    }
  }

  if (data.skills.length > 0) {
    const skillsText = data.skills
      .map((skill) => [skill.name?.trim(), skill.showLevel ? skill.level : ""].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");
    if (skillsText) {
      sections.push(`Skills\n${skillsText}`);
    }
  }

  if (data.educations.length > 0) {
    const lines = data.educations
      .map((edu) => {
        const heading = [
          edu.degree?.trim(),
          edu.schoolName?.trim(),
          edu.location?.trim(),
          [edu.startDate?.trim(), edu.endDate?.trim()].filter(Boolean).join(" - "),
        ]
          .filter(Boolean)
          .join(" | ");
        const description = edu.description?.trim();
        return [heading, description].filter(Boolean).join("\n");
      })
      .filter(Boolean);
    if (lines.length > 0) {
      sections.push(`Education\n${lines.join("\n\n")}`);
    }
  }

  if (data.finalize.languages.length > 0) {
    sections.push(
      `Languages\n${data.finalize.languages
        .map((lang) => `${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ""}`)
        .join(", ")}`,
    );
  }

  if (data.finalize.certifications.length > 0) {
    sections.push(
      `Certifications\n${data.finalize.certifications
        .map((cert) => [cert.name, cert.issuer, cert.date].filter(Boolean).join(" | "))
        .join("\n")}`,
    );
  }

  if (data.finalize.awards.length > 0) {
    sections.push(
      `Awards\n${data.finalize.awards
        .map((award) => [award.title, award.issuer, award.date].filter(Boolean).join(" | "))
        .join("\n")}`,
    );
  }

  if (data.finalize.websites.length > 0) {
    sections.push(
      `Links\n${data.finalize.websites
        .map((site) => [site.label, site.url].filter(Boolean).join(": "))
        .join("\n")}`,
    );
  }

  if (data.finalize.customSections.length > 0) {
    for (const section of data.finalize.customSections) {
      const sectionName = section.sectionName?.trim();
      const description = section.description?.trim();
      if (sectionName || description) {
        sections.push(`${sectionName || "Additional Information"}\n${description || ""}`.trim());
      }
    }
  }

  return sections.join("\n\n").trim();
}

export function analyzeResumeText(input: {
  resumeText: string;
  jobDescription?: string;
  parseWarnings?: string[];
}): AtsReport {
  const resumeText = input.resumeText || "";
  const normalizedText = normalizeForMatching(resumeText);
  const foldedTokens = new Set(tokenize(resumeText));
  const words = normalizeWhitespace(resumeText).split(" ").filter(Boolean);
  const hasBullets = /(^|\n)\s*[-*•]/m.test(resumeText);
  const hasMetrics = /\b\d+%|\$\d+|\b\d+\+?\b/.test(resumeText);
  const actionVerbCount = ACTION_VERBS.filter((verb) => foldedTokens.has(foldToken(verb))).length;
  const placeholderWarnings = findPlaceholderWarnings(resumeText);
  const parseWarnings = [...(input.parseWarnings ?? [])];

  const summaryScore = clampScore(
    (hasSection(resumeText, "summary") || hasSection(resumeText, "profile") ? 45 : 20) +
      (words.length > 180 ? 20 : 10) +
      (words.length < 1500 ? 20 : 10) +
      (actionVerbCount >= 3 ? 15 : 8),
  );

  const experienceScore = clampScore(
    (hasSection(resumeText, "experience") ? 35 : 10) +
      (hasBullets ? 20 : 8) +
      (hasMetrics ? 25 : 10) +
      Math.min(actionVerbCount * 4, 20),
  );

  const skillsScore = clampScore(
    (hasSection(resumeText, "skills") ? 45 : 10) +
      ((containsVariant(normalizedText, foldedTokens, "react") ||
        containsVariant(normalizedText, foldedTokens, "node") ||
        containsVariant(normalizedText, foldedTokens, "typescript") ||
        containsVariant(normalizedText, foldedTokens, "javascript") ||
        containsVariant(normalizedText, foldedTokens, "sql") ||
        containsVariant(normalizedText, foldedTokens, "aws") ||
        containsVariant(normalizedText, foldedTokens, "kubernetes") ||
        containsVariant(normalizedText, foldedTokens, "next.js"))
        ? 30
        : 12) +
      (/(advanced|intermediate|expert)/i.test(resumeText) ? 20 : 10),
  );

  const educationScore = clampScore(
    (hasSection(resumeText, "education") ? 55 : 20) +
      (/(bachelor|master|university|college|degree)/i.test(resumeText) ? 30 : 12) +
      (/\b20\d{2}\b/.test(resumeText) ? 15 : 8),
  );

  const formattingScore = clampScore(
    (hasBullets ? 25 : 10) +
      (words.length >= 250 && words.length <= 1500 ? 30 : 15) +
      (hasSection(resumeText, "contact") || /@/.test(resumeText) ? 20 : 8) +
      (hasSection(resumeText, "experience") &&
      hasSection(resumeText, "skills") &&
      hasSection(resumeText, "education")
        ? 25
        : 12),
  );

  const keywordPool = input.jobDescription?.trim()
    ? extractJobKeywords(input.jobDescription)
    : GENERIC_ATS_KEYWORDS;
  const matchedKeywords = keywordPool.filter((keyword) =>
    containsVariant(normalizedText, foldedTokens, keyword),
  );
  const missingKeywords = keywordPool.filter((keyword) =>
    !containsVariant(normalizedText, foldedTokens, keyword),
  );
  const keywordMatchRatio = keywordPool.length > 0 ? matchedKeywords.length / keywordPool.length : 0;
  const keywordScore = clampScore(20 + keywordMatchRatio * 80);

  let overallScore = clampScore(
    summaryScore * 0.15 +
      experienceScore * 0.25 +
      skillsScore * 0.15 +
      educationScore * 0.1 +
      formattingScore * 0.2 +
      keywordScore * 0.15,
  );

  if (placeholderWarnings.length > 0 && overallScore > 79) {
    overallScore = 79;
  }

  const atsCompatibility: "Low" | "Medium" | "High" =
    overallScore >= 80 ? "High" : overallScore >= 60 ? "Medium" : "Low";

  const sectionScores: AtsSectionScore[] = [
    {
      section: "Summary",
      score: summaryScore,
      notes: summaryScore >= 75 ? "Clear and focused." : "Add a sharper value-focused summary.",
    },
    {
      section: "Experience",
      score: experienceScore,
      notes:
        experienceScore >= 75
          ? "Experience shows measurable impact."
          : "Use stronger action verbs and quantified outcomes.",
    },
    {
      section: "Skills",
      score: skillsScore,
      notes: skillsScore >= 75 ? "Skill section is relevant." : "Expand role-relevant hard skills and tools.",
    },
    {
      section: "Education",
      score: educationScore,
      notes: educationScore >= 75 ? "Education is clearly presented." : "Clarify degree, school, and date details.",
    },
    {
      section: "Formatting",
      score: formattingScore,
      notes: formattingScore >= 75 ? "Structure is ATS-friendly." : "Improve structure and section consistency.",
    },
    {
      section: "Keyword Match",
      score: keywordScore,
      notes:
        keywordScore >= 75
          ? "Good keyword alignment with target role."
          : "Add missing target-job keywords naturally.",
    },
  ];

  const strengths: string[] = [];
  if (hasBullets) strengths.push("Uses bullet-based structure for readability.");
  if (hasMetrics) strengths.push("Includes measurable impact indicators.");
  if (actionVerbCount >= 4) strengths.push("Uses strong action-oriented language.");
  if (hasSection(resumeText, "skills")) strengths.push("Contains a dedicated skills section.");
  if (hasSection(resumeText, "education")) strengths.push("Education section is present and scannable.");
  while (strengths.length < 3) {
    strengths.push("Resume has a workable base to optimize further.");
  }

  const weakestSections = [...sectionScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const actionMap: Record<string, string> = {
    Summary: "Rewrite the summary with role-specific value and 2-3 strongest strengths.",
    Experience: "Rewrite experience bullets with action + outcome language and measurable evidence.",
    Skills: "Add missing tools and technical keywords from your target role.",
    Education: "Clarify degree, institution, and graduation timeline.",
    Formatting: "Use clean headings and concise bullets for ATS parsing.",
    "Keyword Match": "Add important target-job keywords naturally across summary and experience.",
  };

  return {
    overallScore,
    atsCompatibility,
    sectionScores,
    matchedKeywords: dedupeKeywords(matchedKeywords),
    missingKeywords: dedupeKeywords(missingKeywords).slice(0, 15),
    strengths: strengths.slice(0, 6),
    topActions: weakestSections.map((section) => actionMap[section.section] || "Strengthen this section for ATS clarity."),
    placeholderWarnings,
    parseWarnings,
    scoringVersion: ATS_SCORING_VERSION,
  };
}

export function analyzeResumeData(
  data: ResumeDataJSON,
  jobDescription?: string,
  parseWarnings?: string[],
) {
  return analyzeResumeText({
    resumeText: formatResumeDataForAts(data),
    jobDescription,
    parseWarnings,
  });
}

export function buildAtsImpact(before: AtsReport, after: AtsReport): AtsImpact {
  const changedSections = after.sectionScores
    .filter((section) => {
      const previous = before.sectionScores.find((candidate) => candidate.section === section.section);
      return !previous || previous.score !== section.score;
    })
    .map((section) => section.section);

  const beforeMatched = new Set(before.matchedKeywords.map((keyword) => canonicalizeKeyword(keyword)));
  const matchedKeywordsAdded = after.matchedKeywords.filter(
    (keyword) => !beforeMatched.has(canonicalizeKeyword(keyword)),
  );

  return {
    beforeScore: before.overallScore,
    afterScore: after.overallScore,
    changedSections,
    matchedKeywordsAdded,
    warnings: after.placeholderWarnings,
  };
}
