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
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  AlertCircle,
  Flame,
  TreePine,
  HelpCircle,
} from "lucide-react";
import {
  useIncidentTemplates,
  IncidentType,
} from "@/hooks/use-incident-templates";

const INCIDENT_TYPE_OPTIONS: {
  value: IncidentType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: "injury",
    label: "Injury",
    description: "Workplace injuries requiring medical attention or first aid",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800 border-red-300",
  },
  {
    value: "near_miss",
    label: "Near Miss",
    description: "Close calls that could have resulted in injury or damage",
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "property_damage",
    label: "Property Damage",
    description: "Damage to equipment, materials, or structures",
    icon: Flame,
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    value: "environmental",
    label: "Environmental",
    description: "Spills, releases, or environmental impacts",
    icon: TreePine,
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    value: "other",
    label: "Other",
    description: "Other types of incidents not covered above",
    icon: HelpCircle,
    color: "bg-gray-100 text-gray-800 border-gray-300",
  },
];

export default function NewIncidentTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { actions } = useIncidentTemplates(orgId);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("near_miss");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isValid = name.trim().length >= 3;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await actions.create({
        name: name.trim(),
        description: description.trim() || undefined,
        incidentType,
      });

      router.push(`/orgs/${orgId}/incident-templates`);
    } catch (err) {
      console.error("Failed to create incident template:", err);
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Incident Template"
        subtitle="Define a new incident investigation template"
        actions={
          <Link href={`/orgs/${orgId}/incident-templates`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            Enter the details for your incident investigation template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Injury Investigation"
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
              placeholder="Describe when this template should be used..."
              className="max-w-md"
              rows={3}
            />
          </div>

          <div>
            <Label>Incident Type *</Label>
            <p className="text-sm text-gray-500 mb-3">
              Select the type of incidents this template is designed for
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {INCIDENT_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = incidentType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIncidentType(option.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? `${option.color} border-current`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <h4 className="font-medium">{option.label}</h4>
                    </div>
                    <p className="text-sm opacity-80">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> The template will be created as{" "}
              <strong>active</strong>. You can optionally link an investigation
              checklist later to provide structured investigation steps.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
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
        </CardContent>
      </Card>
    </div>
  );
}
