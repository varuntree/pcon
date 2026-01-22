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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, ClipboardList, Wand2 } from "lucide-react";
import { useChecklistTemplates, type ChecklistSection } from "@/hooks/use-checklist-templates";
import {
  ChecklistSectionEditor,
  getDefaultChecklistSections,
} from "@/components/quality";
import { Id } from "../../../../../../../convex/_generated/dataModel";

type Step = "details" | "sections" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Template Details" },
  { key: "sections", label: "Sections & Fields" },
  { key: "review", label: "Review" },
];

const SCOPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "quality", label: "Quality Inspection" },
  { value: "safety", label: "Safety Check" },
  { value: "prestart", label: "Prestart Check" },
  { value: "itp", label: "Inspection Test Plan" },
  { value: "audit", label: "Audit" },
];

export default function NewChecklistTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { actions } = useChecklistTemplates(orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("general");
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isStep1Valid = name.trim().length >= 3;
  const isStep2Valid = sections.length > 0 && sections.every((s) => s.fields.length > 0);
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
    } else if (step === "review" && canSubmit) {
      setCurrentStep("review");
    }
  };

  const handleAddDefaultSections = () => {
    const defaultSections = getDefaultChecklistSections();
    setSections(defaultSections);
  };

  const countTotalFields = () => {
    return sections.reduce((acc, s) => acc + s.fields.length, 0);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await actions.create({
        name: name.trim(),
        description: description.trim() || undefined,
        scope,
        sections,
        isActive: true,
        createdBy: "demo-worker" as Id<"workers">,
      });

      router.push(`/orgs/${orgId}/checklist-templates`);
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
        title="Create Checklist Template"
        subtitle="Build a reusable checklist template with custom fields and sections"
        actions={
          <Link href={`/orgs/${orgId}/checklist-templates`}>
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
              Enter basic information about this checklist template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Plant Prestart Check"
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
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Categorizes the template for filtering and organization
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Continue to Sections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sections & Fields */}
      {currentStep === "sections" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Sections & Fields</CardTitle>
                  <CardDescription>
                    Add sections and configure fields for this checklist template.
                    Each section should have at least one field.
                  </CardDescription>
                </div>
                {sections.length === 0 && (
                  <Button variant="outline" onClick={handleAddDefaultSections}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Add Default Sections
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ChecklistSectionEditor
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
              {!isStep2Valid && sections.length > 0 && (
                <span className="text-xs mr-2">(Each section needs fields)</span>
              )}
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
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {sections.length} sections
                  </span>
                  <span>{countTotalFields()} fields</span>
                  <span className="capitalize">Scope: {scope}</span>
                </div>
              </div>

              {/* Sections Summary */}
              <div>
                <h4 className="font-medium mb-2">Sections</h4>
                <div className="border rounded-lg divide-y">
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{section.title}</span>
                          <span className="text-sm text-gray-500">
                            {section.fields.length} fields
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {section.fields.map((field) => (
                            <span
                              key={field.id}
                              className="text-xs px-2 py-0.5 bg-gray-100 rounded"
                            >
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> The template will be created and{" "}
                  <strong>activated</strong> immediately. You can deactivate it later if needed.
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
