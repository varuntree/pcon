"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  GraduationCap,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
  Video,
  FileQuestion,
  CheckSquare,
  Upload,
  Camera,
} from "lucide-react";
import { useInductionTypes, InductionScope, InductionStep, InductionStepType } from "@/hooks/use-induction-types";
import { useActiveCertificationTypes, CertificationTypeData } from "@/hooks/use-certifications";
import { Id } from "../../../../../../../convex/_generated/dataModel";

type WizardStep = "details" | "steps" | "requirements" | "review";

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "steps", label: "Content Steps" },
  { key: "requirements", label: "Requirements" },
  { key: "review", label: "Review" },
];

const SCOPE_OPTIONS: { value: InductionScope; label: string; description: string }[] = [
  { value: "company", label: "Company", description: "Org-wide induction for all workers" },
  { value: "site", label: "Site", description: "Project-specific site induction" },
  { value: "task", label: "Task", description: "Task-specific requirements (e.g., working at heights)" },
  { value: "plant", label: "Plant", description: "Equipment-specific induction" },
];

const STEP_TYPE_OPTIONS: { value: InductionStepType; label: string; icon: React.ElementType }[] = [
  { value: "info", label: "Information", icon: Info },
  { value: "video", label: "Video", icon: Video },
  { value: "quiz", label: "Quiz", icon: FileQuestion },
  { value: "acknowledgement", label: "Acknowledgement", icon: CheckSquare },
  { value: "document_upload", label: "Document Upload", icon: Upload },
  { value: "photo_capture", label: "Photo Capture", icon: Camera },
];

function generateId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getDefaultContent(type: InductionStepType): unknown {
  switch (type) {
    case "info":
      return { title: "", body: "" };
    case "video":
      return { title: "", videoUrl: "", requiredWatchPercent: 100 };
    case "quiz":
      return { question: "", options: ["", ""], correctIndex: 0 };
    case "acknowledgement":
      return { acknowledgementText: "" };
    case "document_upload":
      return { uploadLabel: "", uploadRequired: true };
    case "photo_capture":
      return { captureLabel: "", captureRequired: true, maxPhotos: 1 };
    default:
      return {};
  }
}

interface StepEditorProps {
  step: InductionStep;
  onUpdate: (updates: Partial<InductionStep>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
}

function StepEditor({ step, onUpdate, onRemove, onMove, isFirst, isLast }: StepEditorProps) {
  const TypeIcon = STEP_TYPE_OPTIONS.find(o => o.value === step.type)?.icon || Info;
  const content = step.content as Record<string, unknown>;

  const updateContent = (field: string, value: unknown) => {
    onUpdate({ content: { ...content, [field]: value } });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-5 w-5 text-[var(--color-accent)]" />
            <span className="font-medium">{step.title || "Untitled Step"}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded uppercase">
              {step.type.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onMove("up")}
              disabled={isFirst}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onMove("down")}
              disabled={isLast}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Step Title *</Label>
          <Input
            value={step.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter step title..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${step.id}`}
            checked={step.required}
            onCheckedChange={(checked) => onUpdate({ required: checked === true })}
          />
          <Label htmlFor={`required-${step.id}`}>This step is required</Label>
        </div>

        {/* Type-specific content editor */}
        {step.type === "info" && (
          <>
            <div>
              <Label>Heading (optional)</Label>
              <Input
                value={String(content.title || "")}
                onChange={(e) => updateContent("title", e.target.value)}
                placeholder="Optional heading"
              />
            </div>
            <div>
              <Label>Content (HTML allowed) *</Label>
              <Textarea
                value={String(content.body || "")}
                onChange={(e) => updateContent("body", e.target.value)}
                placeholder="Enter information content..."
                rows={4}
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={String(content.imageUrl || "")}
                onChange={(e) => updateContent("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        )}

        {step.type === "video" && (
          <>
            <div>
              <Label>Video Title (optional)</Label>
              <Input
                value={String(content.title || "")}
                onChange={(e) => updateContent("title", e.target.value)}
                placeholder="Video title"
              />
            </div>
            <div>
              <Label>Video URL *</Label>
              <Input
                value={String(content.videoUrl || "")}
                onChange={(e) => updateContent("videoUrl", e.target.value)}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div>
              <Label>Required Watch Percentage</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={Number(content.requiredWatchPercent ?? 100)}
                onChange={(e) => updateContent("requiredWatchPercent", parseInt(e.target.value) || 100)}
              />
              <p className="text-xs text-gray-500 mt-1">Worker must watch this percentage of the video</p>
            </div>
          </>
        )}

        {step.type === "quiz" && (
          <>
            <div>
              <Label>Question *</Label>
              <Textarea
                value={String(content.question || "")}
                onChange={(e) => updateContent("question", e.target.value)}
                placeholder="Enter quiz question..."
                rows={2}
              />
            </div>
            <div>
              <Label>Options (one per line) *</Label>
              <Textarea
                value={Array.isArray(content.options) ? (content.options as string[]).join("\n") : ""}
                onChange={(e) => updateContent("options", e.target.value.split("\n"))}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
            <div>
              <Label>Correct Option Index (0-based)</Label>
              <Input
                type="number"
                min={0}
                value={Number(content.correctIndex ?? 0)}
                onChange={(e) => updateContent("correctIndex", parseInt(e.target.value) || 0)}
              />
            </div>
          </>
        )}

        {step.type === "acknowledgement" && (
          <div>
            <Label>Acknowledgement Text *</Label>
            <Textarea
              value={String(content.acknowledgementText || "")}
              onChange={(e) => updateContent("acknowledgementText", e.target.value)}
              placeholder="I acknowledge that I have read and understand..."
              rows={3}
            />
          </div>
        )}

        {step.type === "document_upload" && (
          <>
            <div>
              <Label>Upload Label *</Label>
              <Input
                value={String(content.uploadLabel || "")}
                onChange={(e) => updateContent("uploadLabel", e.target.value)}
                placeholder="Upload your certification document"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`uploadRequired-${step.id}`}
                checked={content.uploadRequired === true}
                onCheckedChange={(checked) => updateContent("uploadRequired", checked === true)}
              />
              <Label htmlFor={`uploadRequired-${step.id}`}>Upload is required</Label>
            </div>
          </>
        )}

        {step.type === "photo_capture" && (
          <>
            <div>
              <Label>Capture Label *</Label>
              <Input
                value={String(content.captureLabel || "")}
                onChange={(e) => updateContent("captureLabel", e.target.value)}
                placeholder="Take a photo of..."
              />
            </div>
            <div>
              <Label>Max Photos</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={Number(content.maxPhotos ?? 1)}
                onChange={(e) => updateContent("maxPhotos", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`captureRequired-${step.id}`}
                checked={content.captureRequired === true}
                onCheckedChange={(checked) => updateContent("captureRequired", checked === true)}
              />
              <Label htmlFor={`captureRequired-${step.id}`}>Photo is required</Label>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function NewInductionTypePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { actions } = useInductionTypes(orgId);
  const { data: certificationTypes, isLoading: certsLoading } = useActiveCertificationTypes(orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<WizardStep>("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<InductionScope>("site");
  const [validityDays, setValidityDays] = useState<number | undefined>(365);
  const [steps, setSteps] = useState<InductionStep[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isStep1Valid = name.trim().length >= 3;
  const isStep2Valid = steps.length > 0 && steps.every(s => s.title.trim().length > 0);
  const canSubmit = isStep1Valid && isStep2Valid;

  const goNext = () => {
    if (currentStep === "details" && isStep1Valid) {
      setCurrentStep("steps");
    } else if (currentStep === "steps" && isStep2Valid) {
      setCurrentStep("requirements");
    } else if (currentStep === "requirements") {
      setCurrentStep("review");
    }
  };

  const goBack = () => {
    if (currentStep === "steps") {
      setCurrentStep("details");
    } else if (currentStep === "requirements") {
      setCurrentStep("steps");
    } else if (currentStep === "review") {
      setCurrentStep("requirements");
    }
  };

  const goToStep = (step: WizardStep) => {
    if (step === "details") {
      setCurrentStep("details");
    } else if (step === "steps" && isStep1Valid) {
      setCurrentStep("steps");
    } else if (step === "requirements" && isStep1Valid && isStep2Valid) {
      setCurrentStep("requirements");
    } else if (step === "review" && canSubmit) {
      setCurrentStep("review");
    }
  };

  const addStep = (type: InductionStepType) => {
    const newStep: InductionStep = {
      id: generateId(),
      type,
      title: "",
      content: getDefaultContent(type),
      required: true,
      order: steps.length + 1,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<InductionStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStep = (id: string) => {
    const filtered = steps.filter(s => s.id !== id);
    setSteps(filtered.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const moveStep = (id: string, direction: "up" | "down") => {
    const idx = steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === steps.length - 1) return;

    const newSteps = [...steps];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const toggleCertification = (certId: string) => {
    const newSet = new Set(selectedCertIds);
    if (newSet.has(certId)) {
      newSet.delete(certId);
    } else {
      newSet.add(certId);
    }
    setSelectedCertIds(newSet);
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
        steps,
        requiredCertificationTypeIds: Array.from(selectedCertIds) as Id<"certificationTypes">[],
        validityDays: validityDays || undefined,
        createdBy: "demo-worker" as Id<"workers">,
      });

      router.push(`/orgs/${orgId}/induction-types`);
    } catch (err) {
      console.error("Failed to create induction type:", err);
      setError(err instanceof Error ? err.message : "Failed to create induction type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Induction Type"
        subtitle="Build a new induction program for workers"
        actions={
          <Link href={`/orgs/${orgId}/induction-types`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Induction Types
            </Button>
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (step.key === "details" && isStep1Valid && currentStep !== "details") ||
            (step.key === "steps" && isStep2Valid && ["requirements", "review"].includes(currentStep)) ||
            (step.key === "requirements" && currentStep === "review");
          const isClickable =
            step.key === "details" ||
            (step.key === "steps" && isStep1Valid) ||
            (step.key === "requirements" && isStep1Valid && isStep2Valid) ||
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
              {idx < WIZARD_STEPS.length - 1 && (
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

      {/* Step 1: Details */}
      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Induction Details</CardTitle>
            <CardDescription>
              Enter basic information about this induction type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Site Induction - Main Building"
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
                placeholder="Brief description of this induction..."
                className="max-w-md"
                rows={3}
              />
            </div>

            <div>
              <Label>Scope *</Label>
              <div className="grid gap-3 md:grid-cols-2 mt-2">
                {SCOPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setScope(option.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      scope === option.value
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-medium">{option.label}</h4>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="validityDays">Validity Period (days)</Label>
              <Input
                id="validityDays"
                type="number"
                min={0}
                value={validityDays || ""}
                onChange={(e) => setValidityDays(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="365"
                className="max-w-[200px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no expiry. Workers will need to re-complete after this period.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Continue to Content Steps
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Content Steps */}
      {currentStep === "steps" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Steps</CardTitle>
              <CardDescription>
                Add the content blocks for this induction. Workers will complete these in order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No steps added yet. Add content steps below.</p>
                </div>
              ) : (
                <div className="mb-4">
                  {steps.map((step, idx) => (
                    <StepEditor
                      key={step.id}
                      step={step}
                      onUpdate={(updates) => updateStep(step.id, updates)}
                      onRemove={() => removeStep(step.id)}
                      onMove={(dir) => moveStep(step.id, dir)}
                      isFirst={idx === 0}
                      isLast={idx === steps.length - 1}
                    />
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="mb-2 block">Add Step</Label>
                <div className="flex flex-wrap gap-2">
                  {STEP_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addStep(option.value)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext} disabled={!isStep2Valid}>
              Continue to Requirements
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Requirements */}
      {currentStep === "requirements" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certification Requirements</CardTitle>
              <CardDescription>
                Select certifications that workers must have before completing this induction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading certifications...</div>
              ) : certificationTypes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No certification types available. You can create them in{" "}
                  <Link href={`/orgs/${orgId}/certifications`} className="text-[var(--color-accent)] hover:underline">
                    Certifications
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificationTypes.map((cert: CertificationTypeData) => (
                    <div
                      key={cert._id as string}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCertIds.has(cert._id as string)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleCertification(cert._id as string)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedCertIds.has(cert._id as string)}
                          onCheckedChange={() => toggleCertification(cert._id as string)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cert.name}</span>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {cert.code}
                            </code>
                          </div>
                          {cert.description && (
                            <p className="text-sm text-gray-500">{cert.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Workers will need valid certifications for all selected types
                  before they can complete this induction.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext}>
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
              <CardTitle>Review Induction Type</CardTitle>
              <CardDescription>
                Review your induction type before creating it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{name}</h3>
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded capitalize">{scope}</span>
                  <span>{validityDays ? `${validityDays} days validity` : "No expiry"}</span>
                  <span>{steps.length} content steps</span>
                  <span>{selectedCertIds.size} required certifications</span>
                </div>
              </div>

              {/* Steps Summary */}
              <div>
                <h4 className="font-medium mb-2">Content Steps</h4>
                <div className="border rounded-lg divide-y">
                  {steps.map((step) => (
                    <div key={step.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.title}</span>
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                          {step.type.replace("_", " ")}
                        </span>
                        {step.required && (
                          <span className="text-xs text-red-600">Required</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">#{step.order}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cert Requirements */}
              {selectedCertIds.size > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Required Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {certificationTypes
                      .filter((c: CertificationTypeData) => selectedCertIds.has(c._id as string))
                      .map((cert: CertificationTypeData) => (
                        <span
                          key={cert._id as string}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {cert.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> The induction type will be created as{" "}
                  <strong>active</strong>. Workers can start completing it immediately.
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
                  Create Induction Type
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
