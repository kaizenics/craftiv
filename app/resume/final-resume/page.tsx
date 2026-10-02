"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DownloadDialog } from "@/components/resume/download-dialog";
import {
  ResumePreview,
  DesignOptions,
  defaultDesignOptions,
} from "@/components/resume/resume-preview";
import { PinchZoomContainer } from "@/components/resume/pinch-zoom-container";
import { ResumeData, createEmptyResumeData, normalizeSectionOrder } from "@/lib/types/resume";
import type { ResumeDesign } from "@/lib/schemas/resume-data";
import { resumeTemplates } from "@/lib/resume-templates";
import { cn } from "@/lib/utils";
import { SpellCheckPanel } from "@/components/resume/spell-check-panel";
import { TemplatesTab } from "./tabs/templates-tab";
import { SectionsTab } from "./tabs/sections-tab";
import { DesignTab } from "./tabs/design-tab";
import { ContentQualityTab } from "./tabs/content-quality-tab";
import { VersionHistoryTab } from "./tabs/version-history-tab";
import { JobTargetTab } from "./tabs/job-target-tab";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";
import { ResumeSectionKey } from "@/lib/types/resume";
import { writeSharedJobTargetDraft } from "@/lib/job-target";
import { readShowPhotoPreference } from "@/lib/user-preferences";
import {
  LayoutTemplate,
  Layers,
  Paintbrush,
  SpellCheck,
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  Eye,
  Sparkles,
  Clock,
  Target,
} from "@/components/ui/icons";

// Sidebar tab types
type SidebarTab =
  | "templates"
  | "sections"
  | "design"
  | "spellcheck"
  | "contentquality"
  | "versionhistory"
  | "jobtarget";

type ResumeSnapshot = {
  id: string;
  createdAt: string;
  resumeName: string;
  resumeData: ResumeData;
  designOptions: DesignOptions;
  selectedColor: string;
};

// Color options for templates
const templateColors = [
  "#1e3a5f",
  "#f97316",
  "#3b82f6",
  "#71717a",
  "#000",
  "#f472b6",
];
const BOARDROOM_FIXED_COLOR = "#fbfbfa";
const COLOR_LOCKED_TEMPLATE_IDS = new Set(["orbit", "boardroom", "harvard"]);

export default function FinalResumePage() {
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>("templates");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [designOptions, setDesignOptions] =
    useState<DesignOptions>(defaultDesignOptions);
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeName, setResumeName] = useState("Resume_1");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("#1e3a5f");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [currentResumeId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currentResumeId");
  });
  const [showPhoto] = useState(() => {
    return readShowPhotoPreference();
  });
  const [jobTargetRole, setJobTargetRole] = useState("");
  const [jobTargetDescription, setJobTargetDescription] = useState("");
  const [snapshots, setSnapshots] = useState<ResumeSnapshot[]>([]);
  const [snapshotSavedAt, setSnapshotSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");
  const latestSaveRequestRef = useRef(0);
  const hasHydratedRef = useRef(false);
  const lastSavedResumeDataRef = useRef("");
  const lastSavedResumeNameRef = useRef("");

  const { data: session } = authClient.useSession();
  const updateResume = trpc.resume.update.useMutation();
  const { data: preferences } = trpc.user.preferences.useQuery(undefined, {
    retry: false,
  });
  const autoSaveDraftsEnabled = preferences?.autoSaveDrafts ?? DEFAULT_USER_PREFERENCES.autoSaveDrafts;
  const defaultSpellCheckEnabled = preferences?.defaultSpellCheck ?? DEFAULT_USER_PREFERENCES.defaultSpellCheck;
  const showResumeScoreEnabled = preferences?.showResumeScore ?? DEFAULT_USER_PREFERENCES.showResumeScore;
  const compactEditorEnabled = preferences?.compactEditor ?? DEFAULT_USER_PREFERENCES.compactEditor;
  const snapshotStorageKey = `resumeSnapshots:${currentResumeId ?? "local"}`;
  const jobTargetStorageKey = `resumeJobTarget:${currentResumeId ?? "local"}`;
  const { data: savedResume } = trpc.resume.getById.useQuery(
    { id: currentResumeId! },
    { enabled: !!currentResumeId },
  );

  const runServerAutosave = useCallback(
    (
      payload: Parameters<typeof updateResume.mutate>[0],
      onSuccess?: () => void,
    ) => {
      const requestId = latestSaveRequestRef.current + 1;
      latestSaveRequestRef.current = requestId;
      setSaveState("saving");

      updateResume.mutate(payload, {
        onSuccess: () => {
          if (latestSaveRequestRef.current === requestId) {
            setSaveState("saved");
          }
          onSuccess?.();
        },
        onError: () => {
          if (latestSaveRequestRef.current === requestId) {
            setSaveState("error");
          }
        },
      });
    },
    [updateResume],
  );

  useEffect(() => {
    // Prefer server data for accuracy, then fall back to local snapshot.
    const savedData = localStorage.getItem("resumeData");
    const templateId = localStorage.getItem("selectedTemplateId");
    const resumeId = localStorage.getItem("currentResumeId");
    const serverTemplateId = savedResume?.templateId;
    const resolvedTemplateId = templateId || serverTemplateId || null;

    // Keep localStorage key warm for downstream flows if present.
    if (resumeId) localStorage.setItem("currentResumeId", resumeId);

    let initialResumeData: ResumeData | null = null;
    let initialSelectedColor = "#1e3a5f";
    let initialDesignOptions = defaultDesignOptions;
    let initialResumeName = "Resume_1";
    let initialJobTargetRole = "";
    let initialJobTargetDescription = "";
    let initialSnapshots: ResumeSnapshot[] = [];
    let savedDesignFromDb: ResumeDesign | undefined;

    if (savedResume?.data) {
      const dbTemplateId = savedResume.templateId || resolvedTemplateId || "celestial";
      // The design lives in its own editor state, not inside resumeData.
      const { design, ...savedData } = savedResume.data as Partial<ResumeData>;
      savedDesignFromDb = design;
      const hydratedFromDb: ResumeData = {
        ...createEmptyResumeData(dbTemplateId),
        ...savedData,
      };
      hydratedFromDb.sectionOrder = normalizeSectionOrder(
        (savedResume.data as Partial<ResumeData>)?.sectionOrder,
      );
      initialResumeData = hydratedFromDb;
    }

    if (!initialResumeData && savedData) {
      try {
        const parsed = JSON.parse(savedData);
        initialResumeData = {
          ...parsed,
          sectionOrder: normalizeSectionOrder(parsed.sectionOrder),
        };
      } catch {
        initialResumeData = null;
      }
    }

    if (!initialResumeData || !resolvedTemplateId) {
      // If resume id exists but data query is still pending, wait.
      if (resumeId && !savedResume) return;
      router.push("/resume/templates");
      return;
    }

    // Set initial color from template
    const template = resumeTemplates.find((t) => t.id === initialResumeData.templateId);
    if (template) {
      const savedSelectedColor = localStorage.getItem("selectedColor");
      const defaultColor =
        template.id === "boardroom" ? BOARDROOM_FIXED_COLOR : template.primaryColor;
      const isColorLocked = COLOR_LOCKED_TEMPLATE_IDS.has(template.id);
      const preferredColor = isColorLocked
        ? defaultColor
        : savedDesignFromDb?.color || savedSelectedColor || defaultColor;
      initialSelectedColor = preferredColor;
    }

    // Load saved design options: the server copy wins, then this browser's.
    const savedDesign = localStorage.getItem("designOptions");
    if (savedDesignFromDb) {
      initialDesignOptions = {
        fontFamily: savedDesignFromDb.fontFamily,
        fontSize: savedDesignFromDb.fontSize,
        sectionSpacing: savedDesignFromDb.sectionSpacing,
        paragraphSpacing: savedDesignFromDb.paragraphSpacing,
        lineSpacing: savedDesignFromDb.lineSpacing,
      };
    } else if (savedDesign) {
      try {
        const parsedDesign = JSON.parse(savedDesign);
        initialDesignOptions = parsedDesign;
      } catch {
        // Use defaults
      }
    }

    // Load saved resume name if any
    const savedResumeName = localStorage.getItem("resumeName");
    if (savedResumeName) {
      initialResumeName = savedResumeName;
    }

    const savedJobTarget = localStorage.getItem(jobTargetStorageKey);
    if (savedJobTarget) {
      try {
        const parsed = JSON.parse(savedJobTarget) as {
          role?: string;
          description?: string;
        };
        initialJobTargetRole = parsed.role || "";
        initialJobTargetDescription = parsed.description || "";
      } catch {
        initialJobTargetRole = "";
        initialJobTargetDescription = "";
      }
    }

    const savedSnapshots = localStorage.getItem(snapshotStorageKey);
    if (savedSnapshots) {
      try {
        const parsed = JSON.parse(savedSnapshots) as ResumeSnapshot[];
        initialSnapshots = Array.isArray(parsed) ? parsed : [];
      } catch {
        initialSnapshots = [];
      }
    }

    const timeoutId = setTimeout(() => {
      if (initialResumeData) {
        setResumeData(initialResumeData);
        // Same shape the autosave sends, so opening a resume doesn't re-save it.
        lastSavedResumeDataRef.current = JSON.stringify({
          ...initialResumeData,
          design: { ...initialDesignOptions, color: initialSelectedColor, showPhoto },
        });
      }
      setSelectedColor(initialSelectedColor);
      setDesignOptions(initialDesignOptions);
      setResumeName(initialResumeName);
      setJobTargetRole(initialJobTargetRole);
      setJobTargetDescription(initialJobTargetDescription);
      setSnapshots(initialSnapshots);
      lastSavedResumeNameRef.current = initialResumeName.trim() || "Resume_1";
      hasHydratedRef.current = true;
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [router, jobTargetStorageKey, snapshotStorageKey, savedResume, showPhoto]);

  // Keep this browser's copy of the design; the server copy is saved with the
  // resume data below.
  useEffect(() => {
    if (isLoading || !hasHydratedRef.current) return;
    localStorage.setItem("designOptions", JSON.stringify(designOptions));
  }, [designOptions, isLoading]);

  // Save resume data (with its design) to localStorage and database
  useEffect(() => {
    if (!resumeData || !currentResumeId || !hasHydratedRef.current) return;
    localStorage.setItem("resumeData", JSON.stringify(resumeData));

    const dataToSave: ResumeData = {
      ...resumeData,
      design: { ...designOptions, color: selectedColor, showPhoto },
    };
    const serializedResume = JSON.stringify(dataToSave);
    if (serializedResume === lastSavedResumeDataRef.current) return;
    if (!autoSaveDraftsEnabled) {
      lastSavedResumeDataRef.current = serializedResume;
      return;
    }

    const timeoutId = setTimeout(() => {
      runServerAutosave(
        {
          id: currentResumeId,
          data: dataToSave,
          templateId: resumeData.templateId,
          status: "draft",
        },
        () => {
          lastSavedResumeDataRef.current = serializedResume;
        },
      );
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    autoSaveDraftsEnabled,
    resumeData,
    designOptions,
    selectedColor,
    showPhoto,
    currentResumeId,
    runServerAutosave,
  ]);

  useEffect(() => {
    if (isLoading || !hasHydratedRef.current) return;
    localStorage.setItem("selectedColor", selectedColor);
  }, [selectedColor, isLoading]);

  // Save resume name to localStorage when it changes
  useEffect(() => {
    if (!isLoading && hasHydratedRef.current) {
      localStorage.setItem("resumeName", resumeName);
    }
  }, [resumeName, isLoading]);

  useEffect(() => {
    if (isLoading || !hasHydratedRef.current) return;
    localStorage.setItem(
      jobTargetStorageKey,
      JSON.stringify({
        role: jobTargetRole,
        description: jobTargetDescription,
      }),
    );
  }, [jobTargetRole, jobTargetDescription, isLoading, jobTargetStorageKey]);

  useEffect(() => {
    if (isLoading || !hasHydratedRef.current) return;
    localStorage.setItem(snapshotStorageKey, JSON.stringify(snapshots));
  }, [snapshots, isLoading, snapshotStorageKey]);

  // Keep the editor title in sync with the database title when available
  useEffect(() => {
    if (!savedResume?.title) return;

    const normalizedTitle = savedResume.title.trim() || "Resume_1";
    const timeoutId = setTimeout(() => {
      setResumeName(savedResume.title);
      localStorage.setItem("resumeName", savedResume.title);
      lastSavedResumeNameRef.current = normalizedTitle;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [savedResume?.title]);

  // Persist title edits to database so dashboard name matches final-resume name
  useEffect(() => {
    if (isLoading || !currentResumeId || !hasHydratedRef.current) return;

    const normalizedName = resumeName.trim() || "Resume_1";
    if (normalizedName === lastSavedResumeNameRef.current) return;

    const timeoutId = setTimeout(() => {
      runServerAutosave(
        {
          id: currentResumeId,
          title: normalizedName,
        },
        () => {
          lastSavedResumeNameRef.current = normalizedName;
        },
      );
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [resumeName, isLoading, currentResumeId, runServerAutosave]);

  useEffect(() => {
    if (defaultSpellCheckEnabled) {
      // Intentional: open the spell-check tab once the user's saved preference loads.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab((currentTab) => (currentTab === "templates" ? "spellcheck" : currentTab));
    }
  }, [defaultSpellCheckEnabled]);

  if (isLoading || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your resume...</p>
        </div>
      </div>
    );
  }

  const getVisibleSectionOrder = (): ResumeSectionKey[] => {
    const visible = new Set<ResumeSectionKey>();
    if (resumeData.summary.trim()) visible.add("summary");
    if (resumeData.experiences.length > 0) visible.add("experience");
    if (resumeData.educations.length > 0) visible.add("education");
    if (resumeData.skills.length > 0) visible.add("skills");
    if (resumeData.finalize.languages.length > 0) visible.add("languages");
    if (resumeData.finalize.certifications.length > 0) visible.add("certifications");
    if (resumeData.finalize.awards.length > 0) visible.add("awards");
    if (resumeData.finalize.websites.length > 0) visible.add("websites");
    if (resumeData.finalize.references.length > 0) visible.add("references");
    if (resumeData.finalize.hobbies.length > 0) visible.add("hobbies");
    if (resumeData.finalize.customSections.length > 0) visible.add("custom");

    return resumeData.sectionOrder.filter((key) => visible.has(key));
  };

  const handleVisibleSectionOrderChange = (nextVisibleOrder: ResumeSectionKey[]) => {
    const visibleSet = new Set(nextVisibleOrder);
    const nextByVisible = [...nextVisibleOrder];
    const mergedOrder = resumeData.sectionOrder.map((key) => {
      if (!visibleSet.has(key)) return key;
      return nextByVisible.shift() ?? key;
    });

    setResumeData({ ...resumeData, sectionOrder: mergedOrder });
  };

  const handleTemplateChange = (templateId: string) => {
    setResumeData({ ...resumeData, templateId });
    localStorage.setItem("selectedTemplateId", templateId);

    // Update color to match new template
    const template = resumeTemplates.find((t) => t.id === templateId);
    if (template) {
      const defaultColor =
        template.id === "boardroom" ? BOARDROOM_FIXED_COLOR : template.primaryColor;
      const isColorLocked = COLOR_LOCKED_TEMPLATE_IDS.has(template.id);
      setSelectedColor(isColorLocked ? defaultColor : template.primaryColor);
    }
  };

  const handleColorChange = (color: string) => {
    if (COLOR_LOCKED_TEMPLATE_IDS.has(resumeData.templateId)) {
      const template = resumeTemplates.find((t) => t.id === resumeData.templateId);
      setSelectedColor(
        template?.id === "boardroom"
          ? BOARDROOM_FIXED_COLOR
          : template?.primaryColor || selectedColor
      );
      return;
    }
    setSelectedColor(color);
  };

  const resetDesignOptions = () => {
    setDesignOptions(defaultDesignOptions);
  };

  const handleDownloadClick = () => {
    // Check if user is authenticated
    if (!session?.user) {
      setShowAuthAlert(true);
      return;
    }
    
    // User is authenticated, show download dialog
    setShowDownloadDialog(true);
  };

  const handleDownloadComplete = () => {
    // Mark resume as completed when downloaded
    if (currentResumeId) {
      updateResume.mutate({
        id: currentResumeId,
        status: "completed",
      });
    }
  };

  const handleSignInRedirect = () => {
    setShowAuthAlert(false);
    router.push("/sign-in");
  };

  const handleResumeDataChange = (updated: ResumeData) => {
    setResumeData(updated);
    localStorage.setItem("resumeData", JSON.stringify(updated));
  };

  const saveVersionSnapshot = () => {
    const snapshot: ResumeSnapshot = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      resumeName,
      resumeData,
      designOptions,
      selectedColor,
    };

    setSnapshots((prev) => [snapshot, ...prev].slice(0, 20));
    setSnapshotSavedAt(snapshot.createdAt);
  };

  const restoreVersionSnapshot = (snapshot: ResumeSnapshot) => {
    setResumeData(snapshot.resumeData);
    setDesignOptions(snapshot.designOptions);
    setSelectedColor(snapshot.selectedColor);
    setResumeName(snapshot.resumeName);
    localStorage.setItem("resumeData", JSON.stringify(snapshot.resumeData));
    localStorage.setItem("designOptions", JSON.stringify(snapshot.designOptions));
    localStorage.setItem("selectedColor", snapshot.selectedColor);
    localStorage.setItem("resumeName", snapshot.resumeName);
  };

  const deleteVersionSnapshot = (snapshotId: string) => {
    setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== snapshotId));
  };

  const pushJobTargetToAssistant = () => {
    writeSharedJobTargetDraft(localStorage, {
      role: jobTargetRole,
      jobDescription: jobTargetDescription,
    });
    router.push("/dashboard/ai-resume");
  };

  const openAtsCheckerWithTarget = () => {
    writeSharedJobTargetDraft(localStorage, {
      role: jobTargetRole,
      jobDescription: jobTargetDescription,
    });
    router.push("/dashboard/ats-checker");
  };

  const getCoreQualityStats = () => {
    const hasContact = Boolean(
      resumeData.contact.firstName ||
        resumeData.contact.lastName ||
        resumeData.contact.email,
    );
    const hasSummary = Boolean(resumeData.summary?.trim());
    const hasExperience = resumeData.experiences.some((exp) =>
      Boolean(exp.description?.trim()),
    );
    const hasEducation = resumeData.educations.some(
      (edu) => Boolean(edu.schoolName?.trim()) || Boolean(edu.degree?.trim()),
    );
    const hasSkills = resumeData.skills.length > 0;

    const checks = [hasContact, hasSummary, hasExperience, hasEducation, hasSkills];
    const complete = checks.filter(Boolean).length;
    return { complete, total: checks.length };
  };

  const sidebarTabs: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "templates",
      label: "Templates",
      icon: <LayoutTemplate className="h-5 w-5" />,
    },
    { id: "sections", label: "Section", icon: <Layers className="h-5 w-5" /> },
    {
      id: "design",
      label: "Design & Formatting",
      icon: <Paintbrush className="h-5 w-5" />,
    },
    {
      id: "spellcheck",
      label: "Spell check",
      icon: <SpellCheck className="h-5 w-5" />,
    },
    {
      id: "contentquality",
      label: "Content Quality",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: "versionhistory",
      label: "Version History",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: "jobtarget",
      label: "Job Target",
      icon: <Target className="h-5 w-5" />,
    },
  ];

  const activeTemplate = resumeTemplates.find((t) => t.id === resumeData.templateId);
  const isColorLockedTemplate = COLOR_LOCKED_TEMPLATE_IDS.has(resumeData.templateId);
  const lockedTemplateColor =
    activeTemplate?.id === "boardroom"
      ? BOARDROOM_FIXED_COLOR
      : activeTemplate?.primaryColor || selectedColor;
  const availableTemplateColors = isColorLockedTemplate
    ? [lockedTemplateColor]
    : templateColors;
  const coreQualityStats = getCoreQualityStats();

  return (
    <div className={cn("h-screen bg-background flex flex-col overflow-hidden", compactEditorEnabled && "compact-editor")}>
      {/* Header */}
      <header className={cn("border-b bg-background px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0", compactEditorEnabled && "sm:py-2")}>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Craftiv
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          {saveState === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Saving...</span>
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>Saved</span>
            </>
          )}
          {saveState === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Save failed</span>
            </>
          )}
        </div>

        <Button
          onClick={handleDownloadClick}
          size="sm"
          className="bg-primary hover:bg-primary/80 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Download Resume</span>
          <span className="sm:hidden">Download</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={cn("hidden lg:flex w-28 border-r bg-muted/30 flex-col items-center py-4 gap-2", compactEditorEnabled && "py-3 gap-1")}>
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-4 rounded-lg transition-colors w-24 text-center",
                activeTab === tab.id
                  ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {tab.icon}
              <span className="text-sm leading-tight">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          <div className="flex gap-1 overflow-x-auto px-1 pb-1">
            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-w-20 shrink-0 flex-col items-center gap-1 rounded-md py-2 px-1 transition-colors",
                  activeTab === tab.id
                    ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800"
                    : "text-muted-foreground"
                )}
              >
                {tab.icon}
                <span className="text-xs leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Content Panel */}
        <div className="w-full lg:w-1/3 border-r bg-background flex flex-col pb-16 lg:pb-0">
          <div className={cn("p-4 overflow-y-auto flex-1", compactEditorEnabled && "p-3")}>
            {activeTab === "templates" && (
              <TemplatesTab
                resumeData={resumeData}
                selectedColor={selectedColor}
                availableTemplateColors={availableTemplateColors}
                templateColors={templateColors}
                isColorLockedTemplate={isColorLockedTemplate}
                onColorChange={handleColorChange}
                onTemplateChange={handleTemplateChange}
              />
            )}

            {activeTab === "sections" && (
              <SectionsTab
                onEditSections={() =>
                  router.push(currentResumeId ? `/resume/section/${currentResumeId}` : "/resume/section")
                }
                visibleSectionOrder={getVisibleSectionOrder()}
                onVisibleSectionOrderChange={handleVisibleSectionOrderChange}
              />
            )}

            {activeTab === "design" && (
              <DesignTab
                designOptions={designOptions}
                onChange={setDesignOptions}
                onReset={resetDesignOptions}
              />
            )}

            {activeTab === "spellcheck" && (
              <SpellCheckPanel
                resumeId={currentResumeId}
                resumeData={resumeData}
                onResumeDataChange={handleResumeDataChange}
              />
            )}

            {activeTab === "contentquality" && (
              <ContentQualityTab
                stats={coreQualityStats}
                onOpenAssistant={() => router.push("/dashboard/ai-resume")}
                onOpenAts={() => router.push("/dashboard/ats-checker")}
                onRunSpellCheck={() => setActiveTab("spellcheck")}
              />
            )}

            {activeTab === "versionhistory" && (
              <VersionHistoryTab
                snapshots={snapshots}
                snapshotSavedAt={snapshotSavedAt}
                onSaveSnapshot={saveVersionSnapshot}
                onRestoreSnapshot={restoreVersionSnapshot}
                onDeleteSnapshot={deleteVersionSnapshot}
              />
            )}

            {activeTab === "jobtarget" && (
              <JobTargetTab
                role={jobTargetRole}
                description={jobTargetDescription}
                onRoleChange={setJobTargetRole}
                onDescriptionChange={setJobTargetDescription}
                onUseInAssistant={pushJobTargetToAssistant}
                onUseInAts={openAtsCheckerWithTarget}
              />
            )}
          </div>
        </div>

        {/* Desktop Preview */}
        <main className="hidden lg:block flex-1 bg-gray-100 dark:bg-gray-900 p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* Resume Name */}
            <div className="flex items-center gap-2 mb-4">
              {isEditingName ? (
                <Input
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingName(false)
                  }
                  className="w-48 h-8 text-zinc-900 dark:text-zinc-100 font-medium"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium hover:underline"
                >
                  {resumeName}
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Resume Preview */}
            <ResumePreview
              data={resumeData}
              designOptions={designOptions}
              customColor={selectedColor}
              showPhoto={showPhoto}
              saveStatus={saveState}
              showScore={showResumeScoreEnabled}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>

        {/* Mobile Preview Button - Floating */}
        <Sheet modal={false} open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="lg:hidden fixed bottom-20 right-4 z-40 rounded-full h-12 w-12 p-0 shadow-lg"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-hidden p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Resume Preview</SheetTitle>
              <SheetDescription>
                Preview your resume in real-time
              </SheetDescription>
            </SheetHeader>
            <div className="h-[calc(85vh-80px)] overflow-hidden">
              <PinchZoomContainer className="rounded-md bg-muted/20">
                <ResumePreview
                  data={resumeData}
                  designOptions={designOptions}
                  customColor={selectedColor}
                  showPhoto={showPhoto}
                  saveStatus={saveState}
                  showScore={showResumeScoreEnabled}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </PinchZoomContainer>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Authentication Alert Dialog */}
      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in first before you proceed with downloading your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignInRedirect}>
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Dialog */}
      <DownloadDialog
        data={resumeData}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        designOptions={designOptions}
        customFileName={resumeName}
        customColor={selectedColor}
        showPhoto={showPhoto}
        onDownloadComplete={handleDownloadComplete}
        secondaryActionLabel="Dashboard"
        onSecondaryAction={() => router.push("/dashboard")}
      />
    </div>
  );
}
