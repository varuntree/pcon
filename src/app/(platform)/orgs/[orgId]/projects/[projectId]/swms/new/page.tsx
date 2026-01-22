"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, FileText, Copy, Wand2 } from "lucide-react";
import { useSWMSDocuments } from "@/hooks/use-swms-documents";
import { usePublishedSWMSTemplates, useSWMSTemplate } from "@/hooks/use-swms-templates";
import {
  SWMSSectionEditor,
  getRecommendedSections,
  type EditableSwmsSection,
} from "@/components/safety";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

type Step = "source" | "details" | "sections" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "source", label: "Source" },
  { key: "details", label: "Details" },
  { key: "sections", label: "Sections" },
  { key: "review", label: "Review" },
];

export default function NewSwmsDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const { actions } = useSWMSDocuments(projectId);
  const { data: templates, isLoading: templatesLoading } = usePublishedSWMSTemplates(orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>("source");
  const [sourceType, setSourceType] = useState<"template" | "scratch" | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<EditableSwmsSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template data when selected
  const { data: selectedTemplate } = useSWMSTemplate(
    selectedTemplateId || ("" as Id<"swmsTemplates">)
  );

  // Validation
  const isStep1Valid = sourceType !== null && (sourceType === "scratch" || selectedTemplateId !== null);
  const isStep2Valid = title.trim().length >= 3;
  const isStep3Valid = sections.length > 0;
  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

  const handleSourceSelect = (type: "template" | "scratch") => {
    setSourceType(type);
    if (type === "scratch") {
      setSelectedTemplateId(null);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const goNext = () => {
    if (currentStep === "source" && isStep1Valid) {
      // If from template, copy sections
      if (sourceType === "template" && selectedTemplate) {
        const templateSections = (selectedTemplate.sections || []) as EditableSwmsSection[];
        setSections(templateSections.map((s: EditableSwmsSection, idx: number) => ({
          id: `section-${Date.now()}-${idx}`,
          type: s.type,
          title: s.title,
          content: s.content,
          order: s.order,
        })));
        // Pre-fill title based on template name
        if (!title) {
          setTitle(selectedTemplate.name);
        }
      }
      setCurrentStep("details");
    } else if (currentStep === "details" && isStep2Valid) {
      setCurrentStep("sections");
    } else if (currentStep === "sections" && isStep3Valid) {
      setCurrentStep("review");
    }
  };

  const goBack = () => {
    if (currentStep === "details") {
      setCurrentStep("source");
    } else if (currentStep === "sections") {
      setCurrentStep("details");
    } else if (currentStep === "review") {
      setCurrentStep("sections");
    }
  };

  const goToStep = (step: Step) => {
    if (step === "source") {
      setCurrentStep("source");
    } else if (step === "details" && isStep1Valid) {
      setCurrentStep("details");
    } else if (step === "sections" && isStep1Valid && isStep2Valid) {
      setCurrentStep("sections");
    } else if (step === "review" && canSubmit) {
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
        orgId: orgId as Id<"orgs">,
        title: title.trim(),
        templateId: selectedTemplateId ? (selectedTemplateId as Id<"swmsTemplates">) : undefined,
        sections: formattedSections,
        // Using demo worker ID - in production would use current user
        createdBy: "demo-worker" as Id<"workers">,
      });

      router.push(`/orgs/${orgId}/projects/${projectId}/swms`);
    } catch (err) {
      console.error("Failed to create SWMS document:", err);
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create SWMS Document"
        subtitle="Create a new Safe Work Method Statement for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/swms`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to SWMS
            </Button>
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (step.key === "source" && isStep1Valid && currentStep !== "source") ||
            (step.key === "details" && isStep2Valid && ["sections", "review"].includes(currentStep)) ||
            (step.key === "sections" && isStep3Valid && currentStep === "review");
          const isClickable =
            step.key === "source" ||
            (step.key === "details" && isStep1Valid) ||
            (step.key === "sections" && isStep1Valid && isStep2Valid) ||
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
                <div className="w-8 h-0.5 bg-gray-200 mx-2 hidden sm:block" />
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

      {/* Step 1: Choose Source */}
      {currentStep === "source" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Source</CardTitle>
              <CardDescription>
                Start from a template or create from scratch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* From Template */}
                <button
                  type="button"
                  onClick={() => handleSourceSelect("template")}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    sourceType === "template"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Copy className="h-8 w-8 mb-3 text-[var(--color-accent)]" />
                  <h3 className="font-semibold text-lg mb-1">From Template</h3>
                  <p className="text-sm text-gray-600">
                    Start with a pre-built template and customize it for this project
                  </p>
                </button>

                {/* From Scratch */}
                <button
                  type="button"
                  onClick={() => handleSourceSelect("scratch")}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    sourceType === "scratch"
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FileText className="h-8 w-8 mb-3 text-gray-500" />
                  <h3 className="font-semibold text-lg mb-1">From Scratch</h3>
                  <p className="text-sm text-gray-600">
                    Build a new SWMS document with custom sections
                  </p>
                </button>
              </div>

              {/* Template Selector */}
              {sourceType === "template" && (
                <div className="pt-4 border-t">
                  <Label>Select Template</Label>
                  {templatesLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No published templates available.{" "}
                      <Link href={`/orgs/${orgId}/swms-templates`} className="text-[var(--color-accent)] hover:underline">
                        Create one first
                      </Link>
                    </div>
                  ) : (
                    <Select
                      value={selectedTemplateId || ""}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template._id as string} value={template._id as string}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              {template.description && (
                                <span className="text-xs text-gray-500">{template.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={goNext} disabled={!isStep1Valid}>
              Continue to Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Document Details */}
      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Enter basic information about this SWMS document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Concrete Pour - Level 3"
                className="max-w-md"
              />
              {title.length > 0 && title.length < 3 && (
                <p className="text-sm text-red-500 mt-1">
                  Title must be at least 3 characters
                </p>
              )}
            </div>

            {sourceType === "template" && selectedTemplate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Template:</strong> {selectedTemplate.name}
                  {selectedTemplate.sections && (
                    <span className="ml-2 text-blue-600">
                      ({selectedTemplate.sections.length} sections will be copied)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button onClick={goNext} disabled={!isStep2Valid}>
                Continue to Sections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sections */}
      {currentStep === "sections" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Document Sections</CardTitle>
                  <CardDescription>
                    {sourceType === "template"
                      ? "Customize the sections from the template"
                      : "Add and configure the sections for this SWMS document"}
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
            <Button onClick={goNext} disabled={!isStep3Valid}>
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === "review" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Document</CardTitle>
              <CardDescription>
                Review your SWMS document before creating it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{sections.length} sections</span>
                  </div>
                  {sourceType === "template" && selectedTemplate && (
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      <span>From: {selectedTemplate.name}</span>
                    </div>
                  )}
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
                  <strong>Note:</strong> The document will be created as a{" "}
                  <strong>draft</strong>. You can submit it for review after creation.
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
                  Create Document
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
