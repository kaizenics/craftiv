"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, ArrowRight, Download, Eye, EyeOff } from "@/components/ui/icons";

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

  // Add tRPC mutations
  const createResume = trpc.resume.create.useMutation();
  const updateResume = trpc.resume.update.useMutation();

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

  // Auto-save to localStorage and database
  useEffect(() => {
    if (resumeData) {
      // Save to localStorage for quick access
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      
      // Auto-save to database with debounce
      if (currentResumeId) {
        const timeoutId = setTimeout(() => {
          updateResume.mutate({
            id: currentResumeId,
            data: resumeData,
            lastEditedSection: currentStep,
            status: "draft",
          });
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [resumeData, currentResumeId, currentStep]);

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full">
          <div className={`${showPreview ? "lg:w-1/2" : "w-full"} flex flex-col h-full overflow-auto`}>
            {/* Form Section with Header and Navigation */}
            <div className="flex-1 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">

              {/* Step Indicator - Form Section Only */}
              <div className="bg-background border rounded-lg shadow-sm mb-4 p-3 sm:p-4">
                <StepIndicator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Form Content */}
              <div className="bg-background rounded-lg border p-4 sm:p-6 mb-4">
                {renderCurrentForm()}
              </div>

              {/* Bottom Navigation - Fixed at Bottom of Form Section */}
              <div 
                className={`fixed bottom-0 left-0 bg-background border-t p-3 sm:p-4 z-30 ${
                  showPreview ? 'lg:w-1/2 w-full' : 'w-full'
                }`}
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
                        onClick={() => router.push("/resume/final-resume")}
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
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section - Independent */}
          {showPreview && (
            <div className="hidden lg:block lg:w-1/2 h-full overflow-auto py-6 px-8 bg-zinc-50 dark:bg-zinc-900">
              <ResumePreview
                data={resumeData}
                className="h-full"
                showPhoto={showPhoto}
              />
            </div>
          )}
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
