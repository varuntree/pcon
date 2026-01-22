"use client";

import { use, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle,
  Save,
  XCircle,
  Camera,
  Pen,
  Paperclip,
  Info,
  StickyNote,
  Zap,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useChecklistInstanceWithDetails,
  useChecklistInstances,
  ChecklistResponse,
} from "@/hooks/use-checklist-instances";
import {
  ChecklistTemplateData,
  ChecklistSection,
  ChecklistField,
  ChecklistFieldType,
} from "@/hooks/use-checklist-templates";
import { useWorkers } from "@/hooks/use-workers";
import { formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ orgId: string; projectId: string; instanceId: string }>;
}

type FieldCondition = {
  triggerFieldId: string;
  operator: "equals";
  value: unknown;
  action: "show" | "hide";
};

// Evaluate if a field should be visible based on conditions
function evaluateConditions(
  field: ChecklistField,
  responses: Record<string, ChecklistResponse>
): boolean {
  const conditions = field.conditions as FieldCondition[] | undefined;
  if (!conditions || conditions.length === 0) return true;

  for (const condition of conditions) {
    const triggerResponse = responses[condition.triggerFieldId];
    const triggerValue = triggerResponse?.value;
    const matches = triggerValue === condition.value;

    if (condition.action === "show") {
      // Only show if condition matches
      if (!matches) return false;
    } else if (condition.action === "hide") {
      // Hide if condition matches
      if (matches) return false;
    }
  }

  return true;
}

// Calculate progress percentage
function calculateProgress(
  responses: Record<string, ChecklistResponse>,
  sections: ChecklistSection[]
): { answered: number; total: number; percentage: number } {
  let total = 0;
  let answered = 0;

  for (const section of sections) {
    for (const field of section.fields || []) {
      // Skip instruction fields
      if (field.type === "instruction") continue;
      // Skip hidden fields
      if (!evaluateConditions(field, responses)) continue;

      total++;
      const response = responses[field.id];
      if (response && response.value !== undefined && response.value !== null && response.value !== "") {
        answered++;
      }
    }
  }

  const percentage = total === 0 ? 100 : Math.round((answered / total) * 100);
  return { answered, total, percentage };
}

// Validate required fields
function validateResponses(
  responses: Record<string, ChecklistResponse>,
  sections: ChecklistSection[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const section of sections) {
    for (const field of section.fields || []) {
      if (!field.required) continue;
      if (field.type === "instruction") continue;
      if (!evaluateConditions(field, responses)) continue;

      const response = responses[field.id];
      if (!response || response.value === undefined || response.value === null || response.value === "") {
        errors.push(`"${field.label}" is required`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Field renderer component
function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ChecklistField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  const fieldType = field.type as ChecklistFieldType;

  switch (fieldType) {
    case "text":
      return (
        <Input
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          disabled={disabled}
        />
      );

    case "textarea":
      return (
        <Textarea
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 3}
          maxLength={field.maxLength}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder ?? ""}
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          min={field.min}
          max={field.max}
          disabled={disabled}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "time":
      return (
        <Input
          type="time"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "yesno":
      return (
        <div className="flex gap-4">
          <Button
            type="button"
            variant={value === true ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(true)}
            disabled={disabled}
            className={cn(value === true && "bg-green-600 hover:bg-green-700")}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Yes
          </Button>
          <Button
            type="button"
            variant={value === false ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(false)}
            disabled={disabled}
            className={cn(value === false && "bg-red-600 hover:bg-red-700")}
          >
            <XCircle className="mr-1 h-4 w-4" />
            No
          </Button>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked === true)}
            disabled={disabled}
          />
          <Label htmlFor={field.id} className="cursor-pointer">
            {field.placeholder ?? "Check if applicable"}
          </Label>
        </div>
      );

    case "select":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder ?? "Select an option..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multiselect":
      const selectedValues = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`${field.id}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedValues, option]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== option));
                  }
                }}
                disabled={disabled}
              />
              <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
      );

    case "photo":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg bg-gray-50">
            <Camera className="h-6 w-6 text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <p className="text-sm font-medium">Photo capture</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Max {field.maxPhotos ?? 5} photos
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              Take Photo
            </Button>
          </div>
          {Array.isArray(value) && value.length > 0 ? (
            <p className="text-sm text-green-600">{(value as unknown[]).length} photo(s) attached</p>
          ) : null}
        </div>
      );

    case "signature":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg bg-gray-50">
            <Pen className="h-6 w-6 text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {field.signatureConfig?.label ?? "Signature"}
              </p>
              {field.signatureConfig?.role && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Role: {field.signatureConfig.role}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              Sign
            </Button>
          </div>
          {value ? (
            <p className="text-sm text-green-600">Signed</p>
          ) : null}
        </div>
      );

    case "attachment":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg bg-gray-50">
            <Paperclip className="h-6 w-6 text-[var(--color-text-muted)]" />
            <div className="flex-1">
              <p className="text-sm font-medium">Attachment</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Upload documents or files
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              Upload
            </Button>
          </div>
          {Array.isArray(value) && value.length > 0 ? (
            <p className="text-sm text-green-600">{(value as unknown[]).length} file(s) attached</p>
          ) : null}
        </div>
      );

    case "instruction":
      return (
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">{field.helpText ?? field.label}</p>
        </div>
      );

    case "notes":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)]">Additional notes</span>
          </div>
          <Textarea
            placeholder="Add notes here..."
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            disabled={disabled}
          />
        </div>
      );

    case "action_trigger":
      return (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {field.actionTrigger?.actionTitle ?? "Action will be triggered"}
            </p>
            <p className="text-xs text-amber-600">
              When: {field.actionTrigger?.triggerWhen ?? "On completion"} |
              Priority: {field.actionTrigger?.actionPriority ?? "medium"}
            </p>
          </div>
          <Checkbox
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked === true)}
            disabled={disabled}
          />
        </div>
      );

    default:
      return (
        <p className="text-sm text-[var(--color-text-muted)]">
          Unsupported field type: {fieldType}
        </p>
      );
  }
}

export default function ChecklistConductorPage({ params }: PageProps) {
  const { orgId, projectId, instanceId } = use(params);
  const router = useRouter();

  const { data: instanceData, isLoading } = useChecklistInstanceWithDetails(instanceId);
  const { actions } = useChecklistInstances(projectId);
  const { data: workers } = useWorkers(orgId);

  // Local responses state
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize responses from instance data
  useEffect(() => {
    if (instanceData?.responses) {
      setResponses(instanceData.responses as Record<string, ChecklistResponse>);
    }
  }, [instanceData?.responses]);

  // Get template from instance data
  const template = instanceData?.template as ChecklistTemplateData | undefined;
  const sections = useMemo(
    () => (template?.sections ?? []) as unknown as ChecklistSection[],
    [template?.sections]
  );

  // Calculate progress
  const progress = useMemo(() => {
    return calculateProgress(responses, sections);
  }, [responses, sections]);

  // Check if completed or cancelled
  const isReadOnly = instanceData?.status !== "in_progress";

  // Update a field response
  const updateResponse = useCallback((fieldId: string, value: unknown) => {
    setResponses((prev) => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        value,
        updatedAt: Date.now(),
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save progress
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentUserId = workers[0]?._id as Id<"workers"> | undefined;
      await actions.saveAllResponses(
        instanceId as Id<"checklistInstances">,
        responses,
        currentUserId
      );
      setHasUnsavedChanges(false);
      toast.success("Progress saved");
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  // Complete checklist
  const handleComplete = async () => {
    // Validate required fields
    const validation = validateResponses(responses, sections);
    if (!validation.valid) {
      toast.error(
        `Please complete all required fields:\n${validation.errors.slice(0, 3).join("\n")}${validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more` : ""}`
      );
      return;
    }

    setIsCompleting(true);
    try {
      const currentUserId = workers[0]?._id as Id<"workers"> | undefined;

      // Save all responses first
      await actions.saveAllResponses(
        instanceId as Id<"checklistInstances">,
        responses,
        currentUserId
      );

      // Then complete
      await actions.complete(
        instanceId as Id<"checklistInstances">,
        currentUserId
      );

      toast.success("Checklist completed");
      router.push(`/orgs/${orgId}/projects/${projectId}/checklists`);
    } catch (error) {
      console.error("Failed to complete checklist:", error);
      toast.error("Failed to complete checklist");
    } finally {
      setIsCompleting(false);
    }
  };

  // Cancel checklist
  const handleCancel = async () => {
    try {
      await actions.cancel(instanceId as Id<"checklistInstances">);
      toast.success("Checklist cancelled");
      router.push(`/orgs/${orgId}/projects/${projectId}/checklists`);
    } catch (error) {
      console.error("Failed to cancel checklist:", error);
      toast.error("Failed to cancel checklist");
    }
  };

  // Get worker name helper
  const getWorkerName = (workerId: Id<"workers"> | undefined): string => {
    if (!workerId) return "Unknown";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checklist" subtitle="Loading..." />
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found
  if (!instanceData || !template) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Checklist Not Found"
          subtitle="The requested checklist could not be found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/checklists`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Checklists
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const templateName = String(template.name ?? "Checklist");
  const templateScope = template.scope ? String(template.scope) : null;
  const instanceIdStr = instanceData._id as string;
  const instanceNumber = instanceData.instanceNumber as string | undefined;
  const assignedToId = instanceData.assignedTo as Id<"workers"> | undefined;
  const dueDate = instanceData.dueDate as number | undefined;
  const completedAt = instanceData.completedAt as number | undefined;
  const score = instanceData.score as number | undefined;
  const passed = instanceData.passed as boolean | undefined;
  const linkedDefectIds = instanceData.linkedDefectIds as string[] | undefined;
  const linkedActionIds = instanceData.linkedActionIds as string[] | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={templateName}
        subtitle={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                instanceData.status === "completed"
                  ? "secondary"
                  : instanceData.status === "cancelled"
                    ? "destructive"
                    : "default"
              }
            >
              {instanceData.status === "in_progress"
                ? "In Progress"
                : instanceData.status === "completed"
                  ? "Completed"
                  : "Cancelled"}
            </Badge>
            {templateScope && (
              <Badge variant="outline">{templateScope}</Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Unsaved changes
              </Badge>
            )}
          </div>
        }
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/checklists`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Checklist Fields */}
        <div className="lg:col-span-3 space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {sectionIndex + 1}. {section.title}
                </CardTitle>
                <CardDescription>
                  {section.fields?.filter((f) => evaluateConditions(f, responses)).length ?? 0} fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(section.fields || []).map((field) => {
                  // Check visibility based on conditions
                  const isVisible = evaluateConditions(field, responses);
                  if (!isVisible) return null;

                  const response = responses[field.id];
                  const value = response?.value;

                  return (
                    <div key={field.id} className="space-y-2">
                      {field.type !== "instruction" && field.type !== "action_trigger" && (
                        <Label
                          htmlFor={field.id}
                          className="flex items-center gap-2"
                        >
                          {field.label}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                      )}
                      {field.helpText && field.type !== "instruction" && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {field.helpText}
                        </p>
                      )}
                      <FieldRenderer
                        field={field}
                        value={value}
                        onChange={(newValue) => updateResponse(field.id, newValue)}
                        disabled={isReadOnly}
                      />
                    </div>
                  );
                })}
                {(section.fields || []).filter((f) => evaluateConditions(f, responses)).length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                    No visible fields in this section
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-medium">{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  {progress.answered} of {progress.total} fields answered
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">ID</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {instanceNumber ?? `CHK-${instanceIdStr.slice(-4).toUpperCase()}`}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Assigned To</span>
                <span className="font-medium">
                  {getWorkerName(assignedToId)}
                </span>
              </div>
              {dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Due Date</span>
                  <span
                    className={cn(
                      "font-medium",
                      dueDate < Date.now() && instanceData.status === "in_progress" && "text-red-600"
                    )}
                  >
                    {formatDateTime(dueDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Created</span>
                <span>{formatDateTime(instanceData.createdAt)}</span>
              </div>
              {completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Completed</span>
                  <span>{formatDateTime(completedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          {!isReadOnly && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Progress
                </Button>
                <Button
                  className="w-full"
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Complete Checklist
                </Button>
                <Button
                  className="w-full text-red-600 hover:text-red-700"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Completed Info */}
          {instanceData.status === "completed" && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-text-muted)]">
                  This checklist has been completed and is now read-only.
                </p>
                {score !== undefined && template.scoringEnabled && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">
                      Score: {score}%
                      {passed ? " (Passed)" : " (Failed)"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cancelled Info */}
          {instanceData.status === "cancelled" && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-text-muted)]">
                  This checklist has been cancelled.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Linked Items */}
          {((linkedDefectIds && linkedDefectIds.length > 0) || (linkedActionIds && linkedActionIds.length > 0)) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Linked Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {linkedDefectIds && linkedDefectIds.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Defects</span>
                    <Badge variant="secondary">{linkedDefectIds.length}</Badge>
                  </div>
                )}
                {linkedActionIds && linkedActionIds.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Actions</span>
                    <Badge variant="secondary">{linkedActionIds.length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
