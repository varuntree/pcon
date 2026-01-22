"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { INDUCTION_STEPS, INDUCTION_STEP_LABELS, type InductionStep } from "@/lib/constants";
import { Check, User, Phone, FileText, Ticket, PenTool } from "lucide-react";

interface InductionStepIndicatorProps {
  currentStep: InductionStep;
  completedSteps?: InductionStep[];
  className?: string;
  orientation?: "horizontal" | "vertical";
  onStepClick?: (step: InductionStep) => void;
  allowNavigation?: boolean;
}

const STEP_ICONS: Record<InductionStep, React.ComponentType<{ className?: string }>> = {
  profile: User,
  emergency: Phone,
  content: FileText,
  tickets: Ticket,
  signature: PenTool,
};

export function InductionStepIndicator({
  currentStep,
  completedSteps = [],
  className,
  orientation = "horizontal",
  onStepClick,
  allowNavigation = false,
}: InductionStepIndicatorProps) {
  const currentIndex = INDUCTION_STEPS.indexOf(currentStep);
  const completedSet = new Set(completedSteps);

  const getStepStatus = (step: InductionStep, index: number) => {
    if (completedSet.has(step)) return "completed";
    if (step === currentStep) return "current";
    if (index < currentIndex) return "completed";
    return "upcoming";
  };

  const handleStepClick = (step: InductionStep, status: string) => {
    if (!onStepClick || !allowNavigation) return;
    // Only allow navigation to completed steps or current step
    if (status === "completed" || status === "current") {
      onStepClick(step);
    }
  };

  if (orientation === "vertical") {
    return (
      <nav className={cn("flex flex-col gap-2", className)} aria-label="Induction progress">
        {INDUCTION_STEPS.map((step, index) => {
          const status = getStepStatus(step, index);
          const Icon = STEP_ICONS[step];
          const isClickable = allowNavigation && (status === "completed" || status === "current");

          return (
            <button
              key={step}
              type="button"
              onClick={() => handleStepClick(step, status)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px]",
                status === "current" && "bg-[var(--color-accent)] bg-opacity-10 border-2 border-[var(--color-accent)]",
                status === "completed" && "bg-green-50 border border-green-200",
                status === "upcoming" && "bg-gray-50 border border-gray-200",
                isClickable && "cursor-pointer hover:bg-opacity-20",
                !isClickable && status === "upcoming" && "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                  status === "current" && "bg-[var(--color-accent)] text-white",
                  status === "completed" && "bg-green-500 text-white",
                  status === "upcoming" && "bg-gray-300 text-gray-600"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span
                  className={cn(
                    "font-medium text-sm",
                    status === "current" && "text-[var(--color-accent)]",
                    status === "completed" && "text-green-700",
                    status === "upcoming" && "text-gray-500"
                  )}
                >
                  {INDUCTION_STEP_LABELS[step]}
                </span>
                <span className="text-xs text-gray-400">Step {index + 1}</span>
              </div>
            </button>
          );
        })}
      </nav>
    );
  }

  // Horizontal orientation
  return (
    <nav className={cn("flex items-center", className)} aria-label="Induction progress">
      {INDUCTION_STEPS.map((step, index) => {
        const status = getStepStatus(step, index);
        const Icon = STEP_ICONS[step];
        const isClickable = allowNavigation && (status === "completed" || status === "current");
        const isLast = index === INDUCTION_STEPS.length - 1;

        return (
          <React.Fragment key={step}>
            <button
              type="button"
              onClick={() => handleStepClick(step, status)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors",
                isClickable && "cursor-pointer hover:bg-gray-100",
                !isClickable && status === "upcoming" && "cursor-not-allowed"
              )}
              title={INDUCTION_STEP_LABELS[step]}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                  status === "current" && "bg-[var(--color-accent)] text-white",
                  status === "completed" && "bg-green-500 text-white",
                  status === "upcoming" && "bg-gray-200 text-gray-500"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  status === "current" && "text-[var(--color-accent)]",
                  status === "completed" && "text-green-700",
                  status === "upcoming" && "text-gray-400"
                )}
              >
                {INDUCTION_STEP_LABELS[step]}
              </span>
            </button>
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 min-w-[20px]",
                  index < currentIndex ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Hook to manage induction wizard step state
export function useInductionSteps(initialStep: InductionStep = "profile") {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [completedSteps, setCompletedSteps] = React.useState<InductionStep[]>([]);

  const currentIndex = INDUCTION_STEPS.indexOf(currentStep);

  const goToStep = React.useCallback((step: InductionStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = React.useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < INDUCTION_STEPS.length) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep(INDUCTION_STEPS[nextIndex]);
      return true;
    }
    return false;
  }, [currentIndex, currentStep]);

  const prevStep = React.useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(INDUCTION_STEPS[prevIndex]);
      return true;
    }
    return false;
  }, [currentIndex]);

  const completeCurrentStep = React.useCallback(() => {
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
  }, [currentStep]);

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === INDUCTION_STEPS.length - 1;
  const progress = ((currentIndex + 1) / INDUCTION_STEPS.length) * 100;

  return {
    currentStep,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
    completeCurrentStep,
    isFirstStep,
    isLastStep,
    progress,
    currentIndex,
    totalSteps: INDUCTION_STEPS.length,
  };
}
