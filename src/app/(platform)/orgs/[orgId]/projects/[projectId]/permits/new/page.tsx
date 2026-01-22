"use client";

import { use, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import {
  usePermitInstances,
} from "@/hooks/use-permit-instances";
import {
  useActivePermitTypes,
  PermitTypeData,
  PermitRequiredField,
} from "@/hooks/use-permit-types";
import { useWorkers } from "@/hooks/use-workers";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

type Step = "type" | "details" | "fields" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "type", label: "Permit Type" },
  { key: "details", label: "Work Details" },
  { key: "fields", label: "Additional Info" },
  { key: "review", label: "Review & Submit" },
];

interface PageProps {
  params: Promise<{ orgId: string; projectId: string }>;
}

export default function NewPermitPage({ params }: PageProps) {
  const { orgId, projectId } = use(params);
  const router = useRouter();

  const { actions } = usePermitInstances(projectId);
  const { data: permitTypes, isLoading: typesLoading } = useActivePermitTypes(orgId);
  const { data: workers } = useWorkers(orgId);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - Step 1: Permit Type
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  // Form state - Step 2: Work Details
  const [workDescription, setWorkDescription] = useState("");
  const [location, setLocation] = useState("");
  const [requestedStartDate, setRequestedStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [requestedStartTime, setRequestedStartTime] = useState("08:00");
  const [requestedEndDate, setRequestedEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [requestedEndTime, setRequestedEndTime] = useState("17:00");

  // Form state - Step 3: Dynamic Fields
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Active workers for selection
  const activeWorkers = workers.filter((w) => w.status === "active");

  // Default applicant (first worker for demo)
  const applicantId = activeWorkers[0]?._id ?? ("worker1" as Id<"workers">);
  const applicantName = activeWorkers[0]?.fullName ?? "Unknown";

  // Get selected permit type
  const selectedType: PermitTypeData | undefined = permitTypes.find(
    (t) => t._id === selectedTypeId
  );

  // Get required fields for selected type
  const requiredFields: PermitRequiredField[] = selectedType?.requiredFields ?? [];

  // Validation
  const isStep1Valid = selectedTypeId !== "";

  const isStep2Valid =
    workDescription.trim() !== "" &&
    location.trim() !== "" &&
    requestedStartDate !== "" &&
    requestedEndDate !== "";

  const isStep3Valid = requiredFields
    .filter((f) => f.required)
    .every((f) => {
      const value = formData[f.id];
      if (f.type === "yesno" || f.type === "checkbox") {
        return value !== undefined;
      }
      if (f.type === "multiselect") {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== "";
    });

  // Skip step 3 if no required fields
  const hasRequiredFields = requiredFields.length > 0;

  const canSubmit = isStep1Valid && isStep2Valid && (hasRequiredFields ? isStep3Valid : true);

  const getStepIndex = (step: Step) => STEPS.findIndex((s) => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    let nextIndex = currentStepIndex + 1;

    // Skip fields step if no required fields
    if (STEPS[nextIndex]?.key === "fields" && !hasRequiredFields) {
      nextIndex++;
    }

    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const goBack = () => {
    let prevIndex = currentStepIndex - 1;

    // Skip fields step if no required fields
    if (STEPS[prevIndex]?.key === "fields" && !hasRequiredFields) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  // Update dynamic field value
  const updateField = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Handle multiselect toggle
  const toggleMultiselect = (fieldId: string, option: string) => {
    const current = (formData[fieldId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    updateField(fieldId, updated);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !selectedTypeId) return;

    setIsSubmitting(true);
    try {
      // Combine date and time into timestamps
      const requestedStartAt = new Date(
        `${requestedStartDate}T${requestedStartTime}`
      ).getTime();
      const requestedEndAt = new Date(
        `${requestedEndDate}T${requestedEndTime}`
      ).getTime();

      await actions.create({
        orgId: orgId as Id<"orgs">,
        permitTypeId: selectedTypeId as Id<"permitTypes">,
        applicantId: applicantId as Id<"workers">,
        workDescription: workDescription.trim(),
        location: location.trim(),
        requestedStartAt,
        requestedEndAt,
        formData: hasRequiredFields ? formData : undefined,
      });

      toast.success("Permit application created");
      router.push(`/orgs/${orgId}/projects/${projectId}/permits`);
    } catch (error) {
      console.error("Failed to create permit application:", error);
      toast.error("Failed to create permit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render dynamic field input
  const renderFieldInput = (field: PermitRequiredField) => {
    const value = formData[field.id];

    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => updateField(field.id, parseFloat(e.target.value) || "")}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => updateField(field.id, v)}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${opt}`}
                  checked={((value as string[]) ?? []).includes(opt)}
                  onCheckedChange={() => toggleMultiselect(field.id, opt)}
                />
                <Label
                  htmlFor={`${field.id}-${opt}`}
                  className="cursor-pointer font-normal"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
          />
        );

      case "yesno":
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${field.id}-yes`}
                name={field.id}
                checked={value === true}
                onChange={() => updateField(field.id, true)}
                className="h-4 w-4"
              />
              <Label htmlFor={`${field.id}-yes`} className="font-normal">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${field.id}-no`}
                name={field.id}
                checked={value === false}
                onChange={() => updateField(field.id, false)}
                className="h-4 w-4"
              />
              <Label htmlFor={`${field.id}-no`} className="font-normal">
                No
              </Label>
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={(value as boolean) ?? false}
              onCheckedChange={(checked) => updateField(field.id, checked === true)}
            />
            <Label htmlFor={field.id} className="cursor-pointer font-normal">
              Confirmed
            </Label>
          </div>
        );

      default:
        return <Input id={field.id} placeholder="Unknown field type" disabled />;
    }
  };

  // Loading state
  if (typesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="New Permit Application" subtitle="Loading..." />
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

  // No permit types available
  if (permitTypes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="New Permit Application"
          subtitle="Apply for a work permit"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/permits`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Permits
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Permit Types Available</h2>
            <p className="text-[var(--color-text-muted)]">
              No permit types have been configured for this organization.
              Please contact an administrator to set up permit types.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Permit Application"
        subtitle="Apply for a work permit"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/permits`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Permits
            </Button>
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.filter((step) => step.key !== "fields" || hasRequiredFields).map((step, index) => {
          const stepIndex = getStepIndex(step.key);
          const isActive = currentStep === step.key;
          const isCompleted = stepIndex < currentStepIndex;
          const isDisabled =
            (step.key === "details" && !isStep1Valid) ||
            (step.key === "fields" && (!isStep1Valid || !isStep2Valid)) ||
            (step.key === "review" && (!isStep1Valid || !isStep2Valid || (hasRequiredFields && !isStep3Valid)));

          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => !isDisabled && goToStep(step.key)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white"
                    : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="hidden sm:inline text-sm font-medium">
                  {step.label}
                </span>
              </button>
              {index < STEPS.filter((s) => s.key !== "fields" || hasRequiredFields).length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Permit Type */}
      {currentStep === "type" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Select Permit Type
            </CardTitle>
            <CardDescription>
              Choose the type of permit you need for your work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {permitTypes.map((type) => (
                <div
                  key={type._id}
                  onClick={() => setSelectedTypeId(type._id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTypeId === type._id
                      ? "border-[var(--color-accent)] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      {type.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {type.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                        <span>Code: {type.code}</span>
                        <span>Default: {type.defaultValidityHours}h</span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            type.riskLevel === "high"
                              ? "bg-red-100 text-red-700"
                              : type.riskLevel === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {type.riskLevel} risk
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedTypeId === type._id
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedTypeId === type._id && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Next: Work Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Work Details */}
      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
            <CardDescription>
              Describe the work to be performed under this permit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Work Description */}
            <div className="space-y-2">
              <Label htmlFor="workDescription">
                Work Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="workDescription"
                placeholder="Describe the work to be performed..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Building A, Level 3, Grid C2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Requested Start */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Requested Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={requestedStartDate}
                  onChange={(e) => setRequestedStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Requested Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={requestedStartTime}
                  onChange={(e) => setRequestedStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* Requested End */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Requested End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={requestedEndDate}
                  onChange={(e) => setRequestedEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Requested End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={requestedEndTime}
                  onChange={(e) => setRequestedEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={goNext} disabled={!isStep2Valid}>
                {hasRequiredFields ? "Next: Additional Info" : "Next: Review"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Dynamic Fields */}
      {currentStep === "fields" && hasRequiredFields && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedType?.name} - Additional Information
            </CardTitle>
            <CardDescription>
              Complete the following fields required for this permit type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {requiredFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                {renderFieldInput(field)}
              </div>
            ))}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={goNext} disabled={!isStep3Valid}>
                Next: Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Review your permit application before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Permit Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Type:</dt>
                    <dd className="font-medium">{selectedType?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Risk Level:</dt>
                    <dd
                      className={`px-2 py-0.5 rounded text-xs ${
                        selectedType?.riskLevel === "high"
                          ? "bg-red-100 text-red-700"
                          : selectedType?.riskLevel === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {selectedType?.riskLevel}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Applicant:</dt>
                    <dd className="font-medium">{applicantName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Location:</dt>
                    <dd className="font-medium">{location}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Requested Period</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Start:</dt>
                    <dd className="font-medium">
                      {requestedStartDate} {requestedStartTime}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">End:</dt>
                    <dd className="font-medium">
                      {requestedEndDate} {requestedEndTime}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Work Description */}
            <div className="space-y-2">
              <h3 className="font-medium">Work Description</h3>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{workDescription}</p>
            </div>

            {/* Dynamic Fields Summary */}
            {hasRequiredFields && Object.keys(formData).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Additional Information</h3>
                <dl className="text-sm bg-gray-50 p-3 rounded-lg space-y-2">
                  {requiredFields.map((field) => {
                    const value = formData[field.id];
                    if (value === undefined) return null;

                    let displayValue: string;
                    if (Array.isArray(value)) {
                      displayValue = value.join(", ");
                    } else if (typeof value === "boolean") {
                      displayValue = value ? "Yes" : "No";
                    } else {
                      displayValue = String(value);
                    }

                    return (
                      <div key={field.id} className="flex justify-between">
                        <dt className="text-[var(--color-text-muted)]">
                          {field.label}:
                        </dt>
                        <dd className="font-medium">{displayValue}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            {/* Note about draft status */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">
                  Application will be saved as Draft
                </p>
                <p className="text-sm text-blue-700">
                  After creating, you can submit the permit for approval from the permits list.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Create Permit Application
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
