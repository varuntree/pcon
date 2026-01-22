"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { IncidentSeverityBadge } from "@/components/safety";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useIncidentReports,
  IncidentType,
  IncidentSeverity,
  Witness,
  InjuryDetails,
} from "@/hooks/use-incident-reports";
import { useWorkers } from "@/hooks/use-workers";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

type Step = "description" | "details" | "photos" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "description", label: "What Happened" },
  { key: "details", label: "Details" },
  { key: "photos", label: "Photos" },
  { key: "review", label: "Review & Submit" },
];

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "injury", label: "Injury" },
  { value: "near_miss", label: "Near Miss" },
  { value: "property_damage", label: "Property Damage" },
  { value: "environmental", label: "Environmental" },
  { value: "other", label: "Other" },
];

const SEVERITY_LEVELS: { value: IncidentSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function NewIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const { actions } = useIncidentReports(projectId);
  const { data: workers } = useWorkers(orgId);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>("description");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - Step 1: Description
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [location, setLocation] = useState("");

  // Form state - Step 2: Details
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [workerId, setWorkerId] = useState<string>("");
  const [witnesses, setWitnesses] = useState<Witness[]>([]);

  // Injury details (conditional)
  const [injuryDetails, setInjuryDetails] = useState<InjuryDetails>({
    natureOfInjury: "",
    bodyLocation: "",
    treatmentRequired: false,
  });

  // Form state - Step 3: Photos (placeholder for file uploads)
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);

  // Active workers for selection
  const activeWorkers = workers.filter((w) => w.status === "active");

  // Default reporter (first worker for demo)
  const reportedBy = activeWorkers[0]?._id ?? ("worker1" as Id<"workers">);

  // Photo required for property_damage and environmental
  const photosRequired =
    incidentType === "property_damage" || incidentType === "environmental";

  // Validation
  const isStep1Valid =
    incidentType !== "" &&
    description.trim() !== "" &&
    date !== "" &&
    location.trim() !== "";

  const isStep2Valid = severity !== "";

  const isStep3Valid = !photosRequired || photoDescriptions.length > 0;

  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

  const getStepIndex = (step: Step) => STEPS.findIndex((s) => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  // Witness management
  const addWitness = () => {
    setWitnesses([...witnesses, { name: "", contact: "" }]);
  };

  const updateWitness = (index: number, field: keyof Witness, value: string) => {
    const updated = [...witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWitnesses(updated);
  };

  const removeWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  // Photo management (placeholder - actual file upload would need storage setup)
  const addPhotoDescription = () => {
    setPhotoDescriptions([...photoDescriptions, ""]);
  };

  const updatePhotoDescription = (index: number, value: string) => {
    const updated = [...photoDescriptions];
    updated[index] = value;
    setPhotoDescriptions(updated);
  };

  const removePhoto = (index: number) => {
    setPhotoDescriptions(photoDescriptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !incidentType || !severity) return;

    setIsSubmitting(true);
    try {
      // Combine date and time into timestamp
      const dateTime = new Date(`${date}T${time}`);
      const timestamp = dateTime.getTime();

      // Filter out empty witnesses
      const validWitnesses = witnesses.filter((w) => w.name.trim() !== "");

      await actions.create({
        orgId: orgId as Id<"orgs">,
        incidentType,
        severity,
        description: description.trim(),
        location: location.trim(),
        date: timestamp,
        reportedBy: reportedBy as Id<"workers">,
        workerId: workerId ? (workerId as Id<"workers">) : undefined,
        witnesses: validWitnesses.length > 0 ? validWitnesses : undefined,
        injuryDetails:
          incidentType === "injury" &&
          (injuryDetails.natureOfInjury ||
            injuryDetails.bodyLocation ||
            injuryDetails.treatmentRequired)
            ? injuryDetails
            : undefined,
      });

      router.push(`/orgs/${orgId}/projects/${projectId}/incidents`);
    } catch (error) {
      console.error("Failed to create incident report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Incident"
        subtitle="Document a safety incident for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/incidents`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incidents
            </Button>
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => goToStep(step.key)}
              disabled={
                (index === 1 && !isStep1Valid) ||
                (index === 2 && (!isStep1Valid || !isStep2Valid)) ||
                (index === 3 && (!isStep1Valid || !isStep2Valid))
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentStep === step.key
                  ? "bg-[var(--color-accent)] text-white"
                  : index < currentStepIndex
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
              } ${
                (index === 1 && !isStep1Valid) ||
                (index === 2 && (!isStep1Valid || !isStep2Valid)) ||
                (index === 3 && (!isStep1Valid || !isStep2Valid))
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:opacity-80"
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="hidden sm:inline text-sm font-medium">
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === "description" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              What Happened?
            </CardTitle>
            <CardDescription>
              Describe the incident and when/where it occurred
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Incident Type */}
            <div className="space-y-2">
              <Label htmlFor="incidentType">
                Incident Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={incidentType}
                onValueChange={(v) => setIncidentType(v as IncidentType)}
              >
                <SelectTrigger id="incidentType">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what happened in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
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

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button onClick={goNext} disabled={!isStep1Valid}>
                Next: Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
            <CardDescription>
              Provide additional information about the incident
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity <span className="text-red-500">*</span>
              </Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as IncidentSeverity)}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <IncidentSeverityBadge
                          severity={level.value}
                          size="sm"
                        />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Affected Worker */}
            <div className="space-y-2">
              <Label htmlFor="workerId">Affected Worker (optional)</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger id="workerId">
                  <SelectValue placeholder="Select affected worker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {activeWorkers.map((worker) => (
                    <SelectItem key={worker._id} value={worker._id}>
                      {worker.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Injury Details (conditional) */}
            {incidentType === "injury" && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Injury Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="natureOfInjury">Nature of Injury</Label>
                    <Input
                      id="natureOfInjury"
                      placeholder="e.g., Laceration, Sprain, Burn"
                      value={injuryDetails.natureOfInjury || ""}
                      onChange={(e) =>
                        setInjuryDetails({
                          ...injuryDetails,
                          natureOfInjury: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyLocation">Body Location</Label>
                    <Input
                      id="bodyLocation"
                      placeholder="e.g., Left hand, Lower back"
                      value={injuryDetails.bodyLocation || ""}
                      onChange={(e) =>
                        setInjuryDetails({
                          ...injuryDetails,
                          bodyLocation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="treatmentRequired"
                      checked={injuryDetails.treatmentRequired || false}
                      onCheckedChange={(checked) =>
                        setInjuryDetails({
                          ...injuryDetails,
                          treatmentRequired: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="treatmentRequired" className="cursor-pointer">
                      Medical treatment required
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Witnesses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Witnesses</Label>
                <Button variant="outline" size="sm" onClick={addWitness}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Witness
                </Button>
              </div>

              {witnesses.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No witnesses added. Click &quot;Add Witness&quot; if there were any
                  witnesses to the incident.
                </p>
              ) : (
                <div className="space-y-3">
                  {witnesses.map((witness, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="Witness name"
                            value={witness.name}
                            onChange={(e) =>
                              updateWitness(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Contact (optional)</Label>
                          <Input
                            placeholder="Phone or email"
                            value={witness.contact || ""}
                            onChange={(e) =>
                              updateWitness(index, "contact", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWitness(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={goNext} disabled={!isStep2Valid}>
                Next: Photos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "photos" && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              {photosRequired
                ? "Photos are required for this incident type"
                : "Add photos to document the incident (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {photosRequired && photoDescriptions.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    Photos Required
                  </p>
                  <p className="text-sm text-amber-700">
                    At least one photo is required for {incidentType === "property_damage" ? "property damage" : "environmental"} incidents.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Photo Documentation</Label>
                <Button variant="outline" size="sm" onClick={addPhotoDescription}>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Photo
                </Button>
              </div>

              {photoDescriptions.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <p className="text-[var(--color-text-muted)]">
                    No photos added yet
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Click &quot;Add Photo&quot; to document the incident
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {photoDescriptions.map((desc, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Photo {index + 1} Description</Label>
                        <Input
                          placeholder="Describe what this photo shows"
                          value={desc}
                          onChange={(e) =>
                            updatePhotoDescription(index, e.target.value)
                          }
                        />
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Note: Full photo upload requires storage configuration
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhoto(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

      {currentStep === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Review the incident details before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Incident Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Type:</dt>
                    <dd className="font-medium">
                      {INCIDENT_TYPES.find((t) => t.value === incidentType)?.label}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Severity:</dt>
                    <dd>
                      {severity && <IncidentSeverityBadge severity={severity} size="sm" />}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Date:</dt>
                    <dd className="font-medium">{date} {time}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-muted)]">Location:</dt>
                    <dd className="font-medium">{location}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Description</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {description}
                </p>
              </div>
            </div>

            {/* Injury Details Summary */}
            {incidentType === "injury" && injuryDetails.natureOfInjury && (
              <div className="space-y-2">
                <h3 className="font-medium">Injury Details</h3>
                <div className="text-sm bg-amber-50 p-3 rounded-lg space-y-1">
                  {injuryDetails.natureOfInjury && (
                    <p><span className="text-[var(--color-text-muted)]">Nature:</span> {injuryDetails.natureOfInjury}</p>
                  )}
                  {injuryDetails.bodyLocation && (
                    <p><span className="text-[var(--color-text-muted)]">Location:</span> {injuryDetails.bodyLocation}</p>
                  )}
                  <p>
                    <span className="text-[var(--color-text-muted)]">Treatment Required:</span>{" "}
                    {injuryDetails.treatmentRequired ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}

            {/* Witnesses Summary */}
            {witnesses.filter((w) => w.name.trim()).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Witnesses</h3>
                <ul className="text-sm space-y-1">
                  {witnesses
                    .filter((w) => w.name.trim())
                    .map((w, i) => (
                      <li key={i} className="bg-gray-50 px-3 py-2 rounded">
                        {w.name}
                        {w.contact && (
                          <span className="text-[var(--color-text-muted)]">
                            {" "}
                            - {w.contact}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Photos Summary */}
            {photoDescriptions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Photos ({photoDescriptions.length})</h3>
                <ul className="text-sm space-y-1">
                  {photoDescriptions.map((desc, i) => (
                    <li key={i} className="bg-gray-50 px-3 py-2 rounded">
                      Photo {i + 1}: {desc || "(No description)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Submit Incident Report
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
