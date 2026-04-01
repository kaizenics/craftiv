"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import Image from "next/image";
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
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "@/components/ui/icons";

export default function ResumeSectionDynamicPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState<ResumeStep>("contacts");
  const [completedSteps, setCompletedSteps] = useState<ResumeStep[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  // Fetch resume data from database
  const { data: resume, isLoading: isLoadingResume } = trpc.resume.getById.useQuery({ id: resumeId });
  const updateResume = trpc.resume.update.useMutation();

  useEffect(() => {
    if (!resume) return;

    // Load resume data from database
    const templateId = resume.templateId || localStorage.getItem("selectedTemplateId") || "celestial";
    const savedShowPhoto = localStorage.getItem("showPhoto");

    if (savedShowPhoto) {
      try {
        setShowPhoto(JSON.parse(savedShowPhoto));
      } catch {
        setShowPhoto(false);
      }
    }

    // Initialize resume data from database or create empty
    const data: ResumeData = {
      ...createEmptyResumeData(templateId),
      ...(resume.data as any),
    };

    setResumeData(data);
    localStorage.setItem("resumeData", JSON.stringify(data));
    localStorage.setItem("selectedTemplateId", templateId);
    localStorage.setItem("currentResumeId", resumeId);

    setIsLoading(false);
  }, [resume, resumeId]);

  // Auto-save to database when resume data changes
  useEffect(() => {
    if (!resumeData || isLoading) return;

    const timeoutId = setTimeout(() => {
      updateResume.mutate({
        id: resumeId,
        data: resumeData,
        lastEditedSection: currentStep,
      });
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [resumeData, currentStep, resumeId, isLoading]);

  if (isLoading || isLoadingResume || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Image 
            src="/cv.gif" 
            alt="Loading" 
            width={80} 
            height={80} 
            className="mx-auto mb-4"
            unoptimized
          />
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
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(RESUME_STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
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

  const handleDataUpdate = (updates: Partial<ResumeData>) => {
    const newData = { ...resumeData, ...updates };
    setResumeData(newData);
    localStorage.setItem("resumeData", JSON.stringify(newData));
  };

  const handleFinish = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    localStorage.setItem("resumeData", JSON.stringify(resumeData));
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
      case "skills":
        return (
          <SkillsForm
            data={resumeData.skills}
            onChange={(skills) => handleDataUpdate({ skills })}
          />
        );
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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b bg-card px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
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
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            showPreview ? "lg:w-1/2" : "lg:w-full"
          }`}
        >
          {/* Step Indicator */}
          <div className="px-3 sm:px-6 py-4 sm:py-6 border-b bg-card shrink-0">
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
            <div className="max-w-2xl mx-auto">{renderStepContent()}</div>
          </div>

          {/* Footer Navigation */}
          <div className="border-t bg-card px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
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
        {showPreview && (
          <div className="hidden lg:block w-1/2 border-l bg-muted/30 overflow-auto p-8">
            <div className="max-w-3xl mx-auto">
              <ResumePreview
                data={resumeData}
                customColor={
                  resumeTemplates.find((t) => t.id === resumeData.templateId)
                    ?.primaryColor || "#2563eb"
                }
                showPhoto={showPhoto}
              />
            </div>
          </div>
        )}

        {/* Mobile Preview Sheet */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="lg:hidden fixed bottom-20 right-4 z-40 rounded-full h-12 w-12 p-0 shadow-lg"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Resume Preview</SheetTitle>
              <SheetDescription>
                Preview your resume in real-time
              </SheetDescription>
            </SheetHeader>
            <div className="h-[calc(85vh-80px)] overflow-auto p-4">
              <ResumePreview
                data={resumeData}
                customColor={
                  resumeTemplates.find((t) => t.id === resumeData.templateId)
                    ?.primaryColor || "#2563eb"
                }
                showPhoto={showPhoto}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
