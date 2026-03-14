'use client';

import { ResumeStep, RESUME_STEPS } from '@/lib/types/resume';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: ResumeStep;
  completedSteps: ResumeStep[];
  onStepClick: (step: ResumeStep) => void;
}

export function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = RESUME_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      {/* Shared stepper layout (desktop + mobile) */}
      <div className="mb-3 md:hidden flex items-center justify-between gap-2">
        <span className="text-sm font-medium whitespace-nowrap">
          Step {currentIndex + 1} of {RESUME_STEPS.length}
        </span>
        <span className="max-w-[45%] truncate text-right text-sm text-muted-foreground">
          {RESUME_STEPS[currentIndex].label}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative flex min-w-[620px] items-center justify-between">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(currentIndex / (RESUME_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {RESUME_STEPS.map((step, index) => {
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
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all border-2',
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isCompleted || isPast
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted-foreground/30 group-hover:border-primary/50'
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
                  'text-xs font-medium whitespace-nowrap',
                  isCurrent
                    ? 'text-primary'
                    : isCompleted || isPast
                    ? 'text-foreground'
                    : 'text-muted-foreground'
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
