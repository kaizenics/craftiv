"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StepIndicator } from "@/components/resume/step-indicator";
import { ResumePreview } from "@/components/resume/resume-preview";
import { PinchZoomContainer } from "@/components/resume/pinch-zoom-container";
import {
  ContactsForm,
  ExperienceForm,
  EducationForm,
  SkillsForm,
  SummaryForm,
  FinalizeForm,
} from "@/components/resume/forms";
import {
  ResumeData,
  ResumeStep,
  RESUME_STEPS,
  createEmptyResumeData,
  normalizeSectionOrder,
} from "@/lib/types/resume";
import { resumeTemplates } from "@/lib/resume-templates";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, Loader2, AlertCircle } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";
import { DEFAULT_SHOW_PHOTO, readShowPhotoPreference } from "@/lib/user-preferences";
import { AnimatePresence, motion } from "motion/react";

export default function ResumeSectionDynamicPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const params = useParams();
  const resumeId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState<ResumeStep>("contacts");
  const [completedSteps, setCompletedSteps] = useState<ResumeStep[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showPhoto, setShowPhoto] = useState(DEFAULT_SHOW_PHOTO);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1);

  // Fetch resume data from database
  const { data: resume, isLoading: isLoadingResume } = trpc.resume.getById.useQuery({ id: resumeId });
  const updateResume = trpc.resume.update.useMutation();
  const { data: preferences } = trpc.user.preferences.useQuery(undefined, {
    retry: false,
  });
  const autoSaveDraftsEnabled = preferences?.autoSaveDrafts ?? DEFAULT_USER_PREFERENCES.autoSaveDrafts;
  const showResumeScoreEnabled = preferences?.showResumeScore ?? DEFAULT_USER_PREFERENCES.showResumeScore;
  const compactEditorEnabled = preferences?.compactEditor ?? DEFAULT_USER_PREFERENCES.compactEditor;
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestResumeDataRef = useRef<ResumeData | null>(null);
  const latestStepRef = useRef<ResumeStep>("contacts");
  const latestLoadingRef = useRef(true);
  const latestAutoSaveEnabledRef = useRef(autoSaveDraftsEnabled);

  useEffect(() => {
    if (!resume) return;

    // Load resume data from database
    const templateId = resume.templateId || localStorage.getItem("selectedTemplateId") || "celestial";

    // Intentional: initialise the photo toggle from the saved preference on load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPhoto(readShowPhotoPreference());

    // Initialize resume data from database or create empty
    const data: ResumeData = {
      ...createEmptyResumeData(templateId),
      ...(resume.data as Partial<ResumeData>),
    };
    data.sectionOrder = normalizeSectionOrder((resume.data as Partial<ResumeData>)?.sectionOrder);

    setResumeData(data);
    localStorage.setItem("selectedTemplateId", templateId);
    localStorage.setItem("currentResumeId", resumeId);

    setIsLoading(false);
  }, [resume, resumeId]);

  useEffect(() => {
    latestResumeDataRef.current = resumeData;
  }, [resumeData]);

  useEffect(() => {
    if (!resumeData) return;
    localStorage.setItem("resumeData", JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    latestStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    latestLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    latestAutoSaveEnabledRef.current = autoSaveDraftsEnabled;
  }, [autoSaveDraftsEnabled]);

  const flushAutosave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (!latestAutoSaveEnabledRef.current || latestLoadingRef.current || !latestResumeDataRef.current) {
      return;
    }
    setSaveState("saving");
    updateResume.mutate({
      id: resumeId,
      data: latestResumeDataRef.current,
      lastEditedSection: latestStepRef.current,
    }, {
      onSuccess: () => {
        setSaveState("saved");
        utils.resume.listSummary.invalidate();
      },
      onError: () => setSaveState("error"),
    });
    // `updateResume.mutate` and `utils.resume.listSummary.invalidate` are stable
    // references, and the resume data is read through refs above. Listing the
    // unstable `updateResume`/`utils` objects here would make flushAutosave change
    // identity every render, which re-subscribes (and re-flushes via cleanup) the
    // listener effect below on every render — an infinite update loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  // Auto-save to database when resume data changes
  useEffect(() => {
    if (!resumeData || isLoading) return;
    if (!autoSaveDraftsEnabled) return;

    debounceTimeoutRef.current = setTimeout(() => {
      setSaveState("saving");
      updateResume.mutate({
        id: resumeId,
        data: resumeData,
        lastEditedSection: currentStep,
      }, {
        onSuccess: () => {
          setSaveState("saved");
          utils.resume.listSummary.invalidate();
        },
        onError: () => setSaveState("error"),
      });
    }, 1000); // Debounce for 1 second

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
    // Depend only on the actual save triggers. `updateResume`/`utils` change identity
    // every render, which would re-run this effect (and re-schedule a save) on every
    // render, causing the resume to re-save in a ~1s loop. mutate/invalidate are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveDraftsEnabled, resumeData, currentStep, resumeId, isLoading]);

  useEffect(() => {
    const handleVisibilityOrPageHide = () => flushAutosave();
    const handleBeforeUnload = () => flushAutosave();

    window.addEventListener("visibilitychange", handleVisibilityOrPageHide);
    window.addEventListener("pagehide", handleVisibilityOrPageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityOrPageHide);
      window.removeEventListener("pagehide", handleVisibilityOrPageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushAutosave();
    };
  }, [flushAutosave]);

  if (isLoading || isLoadingResume || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your resume...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = RESUME_STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === RESUME_STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setTransitionDirection(1);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(RESUME_STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setTransitionDirection(-1);
      setCurrentStep(RESUME_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (step: ResumeStep) => {
    const targetIndex = RESUME_STEPS.findIndex((s) => s.id === step);
    if (targetIndex !== -1 && targetIndex !== currentStepIndex) {
      setTransitionDirection(targetIndex > currentStepIndex ? 1 : -1);
    }
    setCurrentStep(step);
  };

  const handleShowPhotoChange = (value: boolean) => {
    setShowPhoto(value);
    localStorage.setItem("showPhoto", JSON.stringify(value));
  };

  const handleDataUpdate = (updates: Partial<ResumeData>) => {
    const newData = { ...resumeData, ...updates };
    latestResumeDataRef.current = newData;
    setResumeData(newData);
  };

  const handleFinish = async () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    const latestData = latestResumeDataRef.current ?? resumeData;
    try {
      setSaveState("saving");
      await updateResume.mutateAsync({
        id: resumeId,
        data: latestData,
        lastEditedSection: currentStep,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
    router.push("/resume/final-resume");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "contacts":
        return (
          <ContactsForm
            data={resumeData.contact}
            showPhoto={showPhoto}
            onShowPhotoChange={handleShowPhotoChange}
            onChange={(contact) => handleDataUpdate({ contact })}
          />
        );
      case "experience":
        return (
          <ExperienceForm
            data={resumeData.experiences}
            onChange={(experiences) => handleDataUpdate({ experiences })}
          />
        );
      case "education":
        return (
          <EducationForm
            data={resumeData.educations}
            onChange={(educations) => handleDataUpdate({ educations })}
          />
        );
      case "skills": {
        const selectedTemplate = resumeTemplates.find((t) => t.id === resumeData.templateId);
        const showSkillLevelControls = selectedTemplate?.layout === "classic";
        return (
          <SkillsForm
            data={resumeData.skills}
            onChange={(skills) => handleDataUpdate({ skills })}
            showLevelControls={showSkillLevelControls}
          />
        );
      }
      case "summary":
        return (
          <SummaryForm
            data={resumeData.summary}
            onChange={(summary) => handleDataUpdate({ summary })}
          />
        );
      case "finalize":
        return (
          <FinalizeForm
            data={resumeData.finalize}
            onChange={(finalize) => handleDataUpdate({ finalize })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden bg-background", compactEditorEnabled && "compact-editor")}>
      {/* Header */}
      <header className={cn("border-b bg-card px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0", compactEditorEnabled && "py-2 sm:py-3")}>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const latestData = latestResumeDataRef.current ?? resumeData;
              try {
                setSaveState("saving");
                await updateResume.mutateAsync({
                  id: resumeId,
                  data: latestData,
                  lastEditedSection: currentStep,
                });
                setSaveState("saved");
                await utils.resume.listSummary.invalidate();
              } catch {
                setSaveState("error");
              }
              router.push("/dashboard");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Dashboard</span>
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <h1 className="font-display text-base sm:text-xl font-bold text-foreground">
            Create Your Resume
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
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
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="ml-2">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="ml-2">Show Preview</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - Form Section */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            showPreview ? "lg:w-1/2" : "lg:w-full"
          }`}
        >
          {/* Step Indicator */}
          <div className={cn("px-3 sm:px-6 py-4 sm:py-6 border-b bg-card shrink-0", compactEditorEnabled && "px-3 sm:px-5 py-3 sm:py-4")}>
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Form Content */}
          <div className={cn("flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6", compactEditorEnabled && "px-3 sm:px-5 py-3 sm:py-4")}>
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: transitionDirection * 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: transitionDirection * -16 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className={cn("border-t bg-card px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0", compactEditorEnabled && "px-3 sm:px-5 py-2.5 sm:py-3")}>
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-2">Back</span>
            </Button>
            {isLastStep ? (
              <Button onClick={handleFinish} size="default" className="text-sm">
                Finish & Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} size="default" className="text-sm">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Preview Panel */}
        <div
          className={`hidden lg:block bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out ${
            showPreview
              ? "w-1/2 border-l opacity-100 translate-x-0"
              : "w-0 border-l-0 opacity-0 translate-x-3 pointer-events-none"
          }`}
          aria-hidden={!showPreview}
        >
          <div className={cn("h-full overflow-auto p-8", compactEditorEnabled && "p-6")}>
            <div className="max-w-3xl mx-auto">
              <ResumePreview
                data={resumeData}
                customColor={
                  resumeTemplates.find((t) => t.id === resumeData.templateId)
                    ?.primaryColor || "#2563eb"
                }
                showPhoto={showPhoto}
                showScore={showResumeScoreEnabled}
              />
            </div>
          </div>
        </div>

        {/* Mobile Preview Sheet */}
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
              <PinchZoomContainer className="bg-muted/20">
                <ResumePreview
                  data={resumeData}
                  customColor={
                    resumeTemplates.find((t) => t.id === resumeData.templateId)
                      ?.primaryColor || "#2563eb"
                  }
                  showPhoto={showPhoto}
                  showScore={showResumeScoreEnabled}
                />
              </PinchZoomContainer>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
