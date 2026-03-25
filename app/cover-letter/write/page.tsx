"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import {
  ContactForm,
  EmployerForm,
  LetterBodyForm,
} from "@/components/cover-letter/forms";
import {
  CoverLetterData,
  CoverLetterStep,
  COVER_LETTER_STEPS,
  createEmptyCoverLetterData,
} from "@/lib/types/cover-letter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WriteCoverLetterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CoverLetterStep>("contact");
  const [completedSteps, setCompletedSteps] = useState<CoverLetterStep[]>([]);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(
    createEmptyCoverLetterData()
  );
  const [showPreview, setShowPreview] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentStepIndex = COVER_LETTER_STEPS.findIndex(
    (s) => s.id === currentStep
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === COVER_LETTER_STEPS.length - 1;

  const goToNextStep = () => {
    if (!isLastStep) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(COVER_LETTER_STEPS[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(COVER_LETTER_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (step: CoverLetterStep) => {
    setCurrentStep(step);
  };

  const getFullText = () => {
    const { contact, employer, opening, body, closing, date } = coverLetterData;
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    const lines: string[] = [];

    if (fullName) lines.push(fullName);
    if (contact.address || contact.city)
      lines.push([contact.address, contact.city].filter(Boolean).join(", "));
    if (contact.phone || contact.email)
      lines.push([contact.phone, contact.email].filter(Boolean).join(" | "));
    if (date) lines.push("", date);
    if (employer.hiringManagerName) lines.push("", employer.hiringManagerName);
    if (employer.jobTitle) lines.push(employer.jobTitle);
    if (employer.companyName) lines.push(employer.companyName);
    if (employer.companyAddress) lines.push(employer.companyAddress);

    lines.push(
      "",
      employer.hiringManagerName
        ? `Dear ${employer.hiringManagerName},`
        : "Dear Hiring Manager,"
    );
    if (opening) lines.push("", opening);
    if (body) lines.push("", body);
    if (closing) lines.push("", closing);
    lines.push("", "Sincerely,");
    if (fullName) lines.push(fullName);

    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case "contact":
        return (
          <ContactForm
            data={coverLetterData.contact}
            onChange={(contact) =>
              setCoverLetterData({ ...coverLetterData, contact })
            }
          />
        );
      case "employer":
        return (
          <EmployerForm
            data={coverLetterData.employer}
            onChange={(employer) =>
              setCoverLetterData({ ...coverLetterData, employer })
            }
          />
        );
      case "letter":
        return (
          <LetterBodyForm
            opening={coverLetterData.opening}
            body={coverLetterData.body}
            closing={coverLetterData.closing}
            onOpeningChange={(opening) =>
              setCoverLetterData({ ...coverLetterData, opening })
            }
            onBodyChange={(body) =>
              setCoverLetterData({ ...coverLetterData, body })
            }
            onClosingChange={(closing) =>
              setCoverLetterData({ ...coverLetterData, closing })
            }
          />
        );
      default:
        return null;
    }
  };

  const getNextButtonLabel = () => {
    if (isLastStep) return "Finish";
    return COVER_LETTER_STEPS[currentStepIndex + 1].label;
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full">
          {/* Left: Form */}
          <div
            className={`${
              showPreview ? "lg:w-1/2" : "w-full"
            } flex flex-col h-full overflow-auto`}
          >
            <div className="flex-1 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              {/* Header */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-foreground">
                  Write Cover Letter
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fill in each section — see changes live in the preview.
                </p>
              </div>

              {/* Step Indicator */}
              <div className="bg-background border rounded-lg shadow-sm mb-4 p-3 sm:p-4">
                <CoverLetterStepIndicator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Form Content */}
              <div className="bg-background rounded-lg border p-4 sm:p-6 mb-4">
                {renderCurrentForm()}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div
              className={`fixed bottom-0 left-0 bg-background border-t p-3 sm:p-4 z-30 ${
                showPreview ? "lg:w-1/2 w-full" : "w-full"
              }`}
            >
              <div className="flex items-center justify-between px-2 sm:px-4">
                <Button
                  variant="outline"
                  onClick={isFirstStep ? () => router.back() : goToPreviousStep}
                  size="sm"
                >
                  <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  {/* Mobile Preview */}
                  <Sheet
                    open={mobileSheetOpen}
                    onOpenChange={setMobileSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh]">
                      <SheetHeader>
                        <SheetTitle>Cover Letter Preview</SheetTitle>
                        <SheetDescription>
                          Preview your cover letter in real-time
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-4 h-[calc(90vh-100px)] overflow-auto">
                        <CoverLetterPreview data={coverLetterData} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Toggle Preview - Desktop */}
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

                  {/* Copy */}
                  {isLastStep && (
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Next / Finish */}
                  {isLastStep ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push("/dashboard/documents/cover-letters")
                      }
                    >
                      <Download className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Finish</span>
                    </Button>
                  ) : (
                    <Button onClick={goToNextStep} size="sm">
                      <span className="hidden sm:inline">
                        {getNextButtonLabel()}
                      </span>
                      <span className="sm:hidden">Next</span>
                      <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div className="hidden lg:block lg:w-1/2 h-full overflow-auto py-6 px-8 bg-zinc-50 dark:bg-zinc-900">
              <CoverLetterPreview data={coverLetterData} className="h-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline Step Indicator ─────────────────────────────────────────────────── */

function CoverLetterStepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: CoverLetterStep;
  completedSteps: CoverLetterStep[];
  onStepClick: (step: CoverLetterStep) => void;
}) {
  const currentIndex = COVER_LETTER_STEPS.findIndex(
    (s) => s.id === currentStep
  );

  return (
    <div className="w-full">
      <div className="mb-3 md:hidden flex items-center justify-between gap-2">
        <span className="text-sm font-medium whitespace-nowrap">
          Step {currentIndex + 1} of {COVER_LETTER_STEPS.length}
        </span>
        <span className="max-w-[45%] truncate text-right text-sm text-muted-foreground">
          {COVER_LETTER_STEPS[currentIndex].label}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative flex min-w-[320px] items-center justify-between">
          {/* Progress line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${
                  (currentIndex / (COVER_LETTER_STEPS.length - 1)) * 100
                }%`,
              }}
            />
          </div>

          {COVER_LETTER_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isPast = index < currentIndex;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className="relative z-10 flex flex-col items-center gap-2 group"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all border-2",
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCompleted || isPast
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-muted-foreground/30 group-hover:border-primary/50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCurrent
                      ? "text-primary"
                      : isCompleted || isPast
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
