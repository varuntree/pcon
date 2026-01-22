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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Shield,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Hash,
  List,
  Calendar,
  ToggleLeft,
  CheckSquare,
  AlignLeft,
} from "lucide-react";
import {
  usePermitTypes,
  PermitRiskLevel,
  PermitFieldType,
  PermitRequiredField,
} from "@/hooks/use-permit-types";

type WizardStep = "details" | "fields" | "review";

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "fields", label: "Form Fields" },
  { key: "review", label: "Review" },
];

const RISK_LEVEL_OPTIONS: { value: PermitRiskLevel; label: string; description: string; color: string }[] = [
  { value: "low", label: "Low Risk", description: "Routine work with minimal hazards", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "medium", label: "Medium Risk", description: "Some hazards present, standard controls required", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "high", label: "High Risk", description: "Significant hazards, strict controls and supervision required", color: "bg-red-100 text-red-800 border-red-300" },
];

const FIELD_TYPE_OPTIONS: { value: PermitFieldType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "text", label: "Text", icon: Type, description: "Single line text input" },
  { value: "textarea", label: "Long Text", icon: AlignLeft, description: "Multi-line text area" },
  { value: "number", label: "Number", icon: Hash, description: "Numeric input" },
  { value: "select", label: "Select", icon: List, description: "Dropdown single select" },
  { value: "multiselect", label: "Multi-select", icon: CheckSquare, description: "Select multiple options" },
  { value: "date", label: "Date", icon: Calendar, description: "Date picker" },
  { value: "yesno", label: "Yes/No", icon: ToggleLeft, description: "Yes or No toggle" },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Single checkbox" },
];

function generateFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface FieldEditorProps {
  field: PermitRequiredField;
  onUpdate: (updates: Partial<PermitRequiredField>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
}

function FieldEditor({ field, onUpdate, onRemove, onMove, isFirst, isLast }: FieldEditorProps) {
  const TypeIcon = FIELD_TYPE_OPTIONS.find(o => o.value === field.type)?.icon || Type;
  const needsOptions = field.type === "select" || field.type === "multiselect";

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-5 w-5 text-[var(--color-accent)]" />
            <span className="font-medium">{field.label || "Untitled Field"}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded uppercase">
              {field.type}
            </span>
            {field.required && (
              <span className="text-xs text-red-600">Required</span>
            )}
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Field Label *</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Enter field label..."
            />
          </div>
          <div>
            <Label>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onUpdate({ type: value as PermitFieldType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked === true })}
          />
          <Label htmlFor={`required-${field.id}`}>This field is required</Label>
        </div>

        {needsOptions && (
          <div>
            <Label>Options (one per line) *</Label>
            <Textarea
              value={field.options?.join("\n") || ""}
              onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter(Boolean) })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each option on a new line
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function NewPermitTypePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { actions } = usePermitTypes(orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<WizardStep>("details");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<PermitRiskLevel>("medium");
  const [defaultValidityHours, setDefaultValidityHours] = useState(8);
  const [fields, setFields] = useState<PermitRequiredField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isStep1Valid = name.trim().length >= 3 && code.trim().length >= 2 && defaultValidityHours > 0;
  const isStep2Valid = fields.every(f => f.label.trim().length > 0 &&
    (f.type !== "select" && f.type !== "multiselect" || (f.options && f.options.length > 0)));
  const canSubmit = isStep1Valid && isStep2Valid;

  // Auto-generate code from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!code || code === generateCodeFromName(name)) {
      setCode(generateCodeFromName(value));
    }
  };

  const generateCodeFromName = (name: string): string => {
    return name
      .split(" ")
      .map(w => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 4);
  };

  const goNext = () => {
    if (currentStep === "details" && isStep1Valid) {
      setCurrentStep("fields");
    } else if (currentStep === "fields" && isStep2Valid) {
      setCurrentStep("review");
    }
  };

  const goBack = () => {
    if (currentStep === "fields") {
      setCurrentStep("details");
    } else if (currentStep === "review") {
      setCurrentStep("fields");
    }
  };

  const goToStep = (step: WizardStep) => {
    if (step === "details") {
      setCurrentStep("details");
    } else if (step === "fields" && isStep1Valid) {
      setCurrentStep("fields");
    } else if (step === "review" && canSubmit) {
      setCurrentStep("review");
    }
  };

  const addField = (type: PermitFieldType) => {
    const newField: PermitRequiredField = {
      id: generateFieldId(),
      label: "",
      type,
      required: true,
      options: type === "select" || type === "multiselect" ? [] : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<PermitRequiredField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const idx = fields.findIndex(f => f.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === fields.length - 1) return;

    const newFields = [...fields];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setFields(newFields);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await actions.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        riskLevel,
        defaultValidityHours,
        requiredFields: fields,
      });

      router.push(`/orgs/${orgId}/permit-types`);
    } catch (err) {
      console.error("Failed to create permit type:", err);
      setError(err instanceof Error ? err.message : "Failed to create permit type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Permit Type"
        subtitle="Define a new permit type and its application form"
        actions={
          <Link href={`/orgs/${orgId}/permit-types`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Permit Types
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
            (step.key === "fields" && isStep2Valid && currentStep === "review");
          const isClickable =
            step.key === "details" ||
            (step.key === "fields" && isStep1Valid) ||
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
            <CardTitle>Permit Type Details</CardTitle>
            <CardDescription>
              Enter basic information about this permit type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Hot Work Permit"
                />
                {name.length > 0 && name.length < 3 && (
                  <p className="text-sm text-red-500 mt-1">
                    Name must be at least 3 characters
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., HWP"
                  className="uppercase"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Short code for permit numbers (e.g., HWP-001)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when this permit is required..."
                rows={3}
              />
            </div>

            <div>
              <Label>Risk Level *</Label>
              <div className="grid gap-3 md:grid-cols-3 mt-2">
                {RISK_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRiskLevel(option.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      riskLevel === option.value
                        ? `${option.color} border-current`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-medium">{option.label}</h4>
                    <p className="text-sm opacity-80">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="validityHours">Default Validity (hours) *</Label>
              <Input
                id="validityHours"
                type="number"
                min={1}
                max={720}
                value={defaultValidityHours}
                onChange={(e) => setDefaultValidityHours(parseInt(e.target.value) || 8)}
                className="max-w-[200px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long the permit is valid after activation (1-720 hours)
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Continue to Form Fields
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Form Fields */}
      {currentStep === "fields" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Form Fields</CardTitle>
              <CardDescription>
                Define the fields workers must fill out when applying for this permit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fields added yet. Add form fields below.</p>
                  <p className="text-sm mt-1">Fields are optional - permits can be used without custom fields.</p>
                </div>
              ) : (
                <div className="mb-4">
                  {fields.map((field, idx) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onUpdate={(updates) => updateField(field.id, updates)}
                      onRemove={() => removeField(field.id)}
                      onMove={(dir) => moveField(field.id, dir)}
                      isFirst={idx === 0}
                      isLast={idx === fields.length - 1}
                    />
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="mb-2 block">Add Field</Label>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(option.value)}
                        title={option.description}
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
              <CardTitle>Review Permit Type</CardTitle>
              <CardDescription>
                Review your permit type before creating it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {code}
                  </code>
                </div>
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    riskLevel === "low" ? "bg-green-100 text-green-800" :
                    riskLevel === "medium" ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {RISK_LEVEL_OPTIONS.find(r => r.value === riskLevel)?.label}
                  </span>
                  <span className="text-gray-500">
                    {defaultValidityHours} hours validity
                  </span>
                  <span className="text-gray-500">
                    {fields.length} form fields
                  </span>
                </div>
              </div>

              {/* Fields Summary */}
              {fields.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Form Fields</h4>
                  <div className="border rounded-lg divide-y">
                    {fields.map((field) => (
                      <div key={field.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-600">Required</span>
                          )}
                        </div>
                        {(field.type === "select" || field.type === "multiselect") && field.options && (
                          <span className="text-sm text-gray-500">
                            {field.options.length} options
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> The permit type will be created as{" "}
                  <strong>active</strong>. Workers can immediately apply for this permit type.
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
                  Create Permit Type
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
