"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { DownloadDialog } from "@/components/resume/download-dialog";
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
} from "@/lib/types/resume";
import { resumeTemplates } from "@/lib/resume-templates";
import { ArrowLeft, ArrowRight, Download, Eye, EyeOff, Check, Loader2, AlertCircle } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";

export default function ResumeSectionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ResumeStep>("contacts");
  const [completedSteps, setCompletedSteps] = useState<ResumeStep[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");

  // Add tRPC mutations
  const createResume = trpc.resume.create.useMutation();
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
  const latestResumeIdRef = useRef<string | null>(null);
  const latestAutoSaveEnabledRef = useRef(autoSaveDraftsEnabled);

  useEffect(() => {
    // Get the selected template from localStorage
    const templateId = localStorage.getItem("selectedTemplateId");
    const savedShowPhoto = localStorage.getItem("showPhoto");
    
    if (savedShowPhoto) {
      try {
        setShowPhoto(JSON.parse(savedShowPhoto));
      } catch {
        setShowPhoto(false);
      }
    }

    if (!templateId) {
      // No template selected, redirect to templates page
      router.push("/resume/templates");
      return;
    }

    // Check if template exists
    const template = resumeTemplates.find((t) => t.id === templateId);
    if (!template) {
      router.push("/resume/templates");
      return;
    }

    // Check if there's an existing resume ID
    const existingId = localStorage.getItem("currentResumeId");
    
    if (existingId) {
      // Load existing resume
      setCurrentResumeId(existingId);
      
      // Try to load from localStorage first (faster)
      const savedData = localStorage.getItem("resumeData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.templateId === templateId) {
            setResumeData(parsed);
          } else {
            setResumeData(createEmptyResumeData(templateId));
          }
        } catch {
          setResumeData(createEmptyResumeData(templateId));
        }
      } else {
        setResumeData(createEmptyResumeData(templateId));
      }
      setIsLoading(false);
    } else {
      // Create new resume in database
      const emptyData = createEmptyResumeData(templateId);
      setResumeData(emptyData);
      
      createResume
        .mutateAsync({
          title: "Resume_1",
          templateId: templateId,
        })
        .then((result) => {
          setCurrentResumeId(result.id);
          localStorage.setItem("currentResumeId", result.id);
        })
        .catch((error) => {
          console.error("Failed to create resume:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [router]);

  useEffect(() => {
    latestResumeDataRef.current = resumeData;
  }, [resumeData]);

  useEffect(() => {
    latestStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    latestResumeIdRef.current = currentResumeId;
  }, [currentResumeId]);

  useEffect(() => {
    latestAutoSaveEnabledRef.current = autoSaveDraftsEnabled;
  }, [autoSaveDraftsEnabled]);

  const flushAutosave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (!latestAutoSaveEnabledRef.current || !latestResumeIdRef.current || !latestResumeDataRef.current) {
      return;
    }
    setSaveState("saving");
    updateResume.mutate({
      id: latestResumeIdRef.current,
      data: latestResumeDataRef.current,
      lastEditedSection: latestStepRef.current,
      status: "draft",
    }, {
      onSuccess: () => setSaveState("saved"),
      onError: () => setSaveState("error"),
    });
  }, [updateResume]);

  // Auto-save to localStorage and database
  useEffect(() => {
    if (resumeData) {
      // Auto-save to database with debounce
      if (currentResumeId && autoSaveDraftsEnabled) {
        debounceTimeoutRef.current = setTimeout(() => {
          setSaveState("saving");
          updateResume.mutate({
            id: currentResumeId,
            data: resumeData,
            lastEditedSection: currentStep,
            status: "draft",
          }, {
            onSuccess: () => setSaveState("saved"),
            onError: () => setSaveState("error"),
          });
        }, 1000);

        return () => {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
          }
        };
      }
    }
  }, [autoSaveDraftsEnabled, resumeData, currentResumeId, currentStep, updateResume]);

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

  const currentStepIndex = RESUME_STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === RESUME_STEPS.length - 1;

  const goToNextStep = () => {
    if (!isLastStep) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(RESUME_STEPS[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(RESUME_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (step: ResumeStep) => {
    setCurrentStep(step);
  };

  const handleShowPhotoChange = (value: boolean) => {
    setShowPhoto(value);
    localStorage.setItem("showPhoto", JSON.stringify(value));
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case "contacts":
        return (
          <ContactsForm
            data={resumeData.contact}
            onChange={(contact) => setResumeData({ ...resumeData, contact })}
            showPhoto={showPhoto}
            onShowPhotoChange={handleShowPhotoChange}
          />
        );
      case "experience":
        return (
          <ExperienceForm
            data={resumeData.experiences}
            onChange={(experiences) =>
              setResumeData({ ...resumeData, experiences })
            }
          />
        );
      case "education":
        return (
          <EducationForm
            data={resumeData.educations}
            onChange={(educations) =>
              setResumeData({ ...resumeData, educations })
            }
          />
        );
      case "skills": {
        const selectedTemplate = resumeTemplates.find((t) => t.id === resumeData.templateId);
        const showSkillLevelControls = selectedTemplate?.layout === "classic";
        return (
          <SkillsForm
            data={resumeData.skills}
            onChange={(skills) => setResumeData({ ...resumeData, skills })}
            showLevelControls={showSkillLevelControls}
          />
        );
      }
      case "summary":
        return (
          <SummaryForm
            data={resumeData.summary}
            onChange={(summary) => setResumeData({ ...resumeData, summary })}
          />
        );
      case "finalize":
        return (
          <FinalizeForm
            data={resumeData.finalize}
            onChange={(finalize) => setResumeData({ ...resumeData, finalize })}
          />
        );
      default:
        return null;
    }
  };

  const getNextButtonLabel = () => {
    if (isLastStep) {
      return "Download Resume";
    }
    return `${RESUME_STEPS[currentStepIndex + 1].label}`;
  };

  return (
    <div className={cn("h-screen bg-background flex flex-col overflow-hidden", compactEditorEnabled && "compact-editor")}>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full">
          <div className={`w-full ${showPreview ? "lg:w-1/2" : "lg:w-full"} transition-all duration-300 ease-in-out flex flex-col h-full overflow-auto`}>
            {/* Form Section with Header and Navigation */}
            <div className={cn("flex-1 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6", compactEditorEnabled && "px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4")}>

              {/* Step Indicator - Form Section Only */}
              <div className={cn("bg-background border rounded-lg shadow-sm mb-4 p-3 sm:p-4", compactEditorEnabled && "mb-3 p-2.5 sm:p-3")}>
                <StepIndicator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Form Content */}
              <div className={cn("bg-background rounded-lg border p-4 sm:p-6 mb-4", compactEditorEnabled && "p-3 sm:p-4 mb-3")}>
                {renderCurrentForm()}
              </div>

              {/* Bottom Navigation - Fixed at Bottom of Form Section */}
              <div
                className={`fixed bottom-0 left-0 bg-background border-t p-3 sm:p-4 z-30 w-full ${
                  showPreview ? "lg:w-1/2" : "lg:w-full"
                } transition-all duration-300 ease-in-out`}
              >
                <div className="flex items-center justify-between px-2 sm:px-4">
                  <Button
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isFirstStep}
                    size="sm"
                    className="sm:size-default"
                  >
                    <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {/* Mobile View Resume Button */}
                    <Sheet modal={false} open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="lg:hidden"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Resume
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[90vh] overflow-hidden">
                        <SheetHeader>
                          <SheetTitle>Resume Preview</SheetTitle>
                          <SheetDescription>
                            Preview your resume in real-time
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-4 h-[calc(90vh-100px)] overflow-hidden">
                          <PinchZoomContainer className="rounded-md bg-muted/20">
                            <ResumePreview
                              data={resumeData}
                              className="shadow-none"
                              showPhoto={showPhoto}
                              showScore={showResumeScoreEnabled}
                            />
                          </PinchZoomContainer>
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Toggle Preview Button - Desktop Only */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="hidden lg:flex"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show Preview
                        </>
                      )}
                    </Button>

                    {/* Next/Download Button */}
                    {isLastStep ? (
                      <Button
                        onClick={async () => {
                          if (currentResumeId && resumeData && autoSaveDraftsEnabled) {
                            try {
                              setSaveState("saving");
                              await updateResume.mutateAsync({
                                id: currentResumeId,
                                data: resumeData,
                                lastEditedSection: currentStep,
                                status: "draft",
                              });
                              setSaveState("saved");
                            } catch {
                              setSaveState("error");
                            }
                          }
                          router.push("/resume/final-resume");
                        }}
                        size="sm"
                        className="sm:size-default"
                      >
                        <Download className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    ) : (
                      <Button onClick={goToNextStep} size="sm" className="sm:size-default">
                        <span className="hidden sm:inline">{getNextButtonLabel()}</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section - Independent */}
          <div
            className={`hidden lg:block h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200/80 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
              showPreview
                ? "lg:w-1/2 opacity-100 translate-x-0"
                : "lg:w-0 opacity-0 translate-x-3 border-l-0 pointer-events-none"
            }`}
            aria-hidden={!showPreview}
          >
            <div className={cn("h-full overflow-auto py-6 px-8", compactEditorEnabled && "py-4 px-6")}>
              <ResumePreview
                data={resumeData}
                className="h-full"
                showPhoto={showPhoto}
                showScore={showResumeScoreEnabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      <DownloadDialog
        data={resumeData}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
      />
    </div>
  );
}
