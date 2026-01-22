"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, FileText, Wand2 } from "lucide-react";
import { useSWMSTemplates } from "@/hooks/use-swms-templates";
import {
  SWMSSectionEditor,
  getRecommendedSections,
  type EditableSwmsSection,
} from "@/components/safety";
import { Id } from "../../../../../../../convex/_generated/dataModel";

type Step = "details" | "sections" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Template Details" },
  { key: "sections", label: "Sections" },
  { key: "review", label: "Review" },
];

export default function NewSwmsTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { actions } = useSWMSTemplates(orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<EditableSwmsSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isStep1Valid = name.trim().length >= 3;
  const isStep2Valid = sections.length > 0;
  const canSubmit = isStep1Valid && isStep2Valid;

  const goNext = () => {
    if (currentStep === "details" && isStep1Valid) {
      setCurrentStep("sections");
    } else if (currentStep === "sections" && isStep2Valid) {
      setCurrentStep("review");
    }
  };

  const goBack = () => {
    if (currentStep === "sections") {
      setCurrentStep("details");
    } else if (currentStep === "review") {
      setCurrentStep("sections");
    }
  };

  const goToStep = (step: Step) => {
    if (step === "details") {
      setCurrentStep("details");
    } else if (step === "sections" && isStep1Valid) {
      setCurrentStep("sections");
    } else if (step === "review" && isStep1Valid && isStep2Valid) {
      setCurrentStep("review");
    }
  };

  const handleAddRecommendedSections = () => {
    const recommended = getRecommendedSections();
    setSections(recommended);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Format sections for the API
      const formattedSections = sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content,
        order: s.order,
      }));

      await actions.create({
        name: name.trim(),
        description: description.trim() || undefined,
        sections: formattedSections,
        // Using demo worker ID - in production would use current user
        createdBy: "demo-worker" as Id<"workers">,
      });

      router.push(`/orgs/${orgId}/swms-templates`);
    } catch (err) {
      console.error("Failed to create template:", err);
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create SWMS Template"
        subtitle="Build a reusable Safe Work Method Statement template"
        actions={
          <Link href={`/orgs/${orgId}/swms-templates`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (step.key === "details" && isStep1Valid && currentStep !== "details") ||
            (step.key === "sections" && isStep2Valid && currentStep === "review");
          const isClickable =
            step.key === "details" ||
            (step.key === "sections" && isStep1Valid) ||
            (step.key === "review" && canSubmit);

          return (
            <div key={step.key} className="flex items-center">
              <button
                type="button"
                onClick={() => goToStep(step.key)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white"
                    : isCompleted
                    ? "bg-green-100 text-green-800"
                    : isClickable
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Template Details */}
      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Enter basic information about this SWMS template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Working at Heights SWMS"
                className="max-w-md"
              />
              {name.length > 0 && name.length < 3 && (
                <p className="text-sm text-red-500 mt-1">
                  Name must be at least 3 characters
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when this template should be used..."
                className="max-w-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Continue to Sections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sections */}
      {currentStep === "sections" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Template Sections</CardTitle>
                  <CardDescription>
                    Add and configure the sections for this SWMS template
                  </CardDescription>
                </div>
                {sections.length === 0 && (
                  <Button variant="outline" onClick={handleAddRecommendedSections}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Add Recommended Sections
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <SWMSSectionEditor
                sections={sections}
                onChange={setSections}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext} disabled={!isStep2Valid}>
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === "review" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Template</CardTitle>
              <CardDescription>
                Review your template before creating it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{name}</h3>
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>{sections.length} sections</span>
                </div>
              </div>

              {/* Sections Summary */}
              <div>
                <h4 className="font-medium mb-2">Sections</h4>
                <div className="border rounded-lg divide-y">
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{section.title}</span>
                          <span className="ml-2 text-xs text-gray-400 uppercase">
                            {section.type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          #{section.order}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> The template will be created as a{" "}
                  <strong>draft</strong>. You can publish it later after review.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
