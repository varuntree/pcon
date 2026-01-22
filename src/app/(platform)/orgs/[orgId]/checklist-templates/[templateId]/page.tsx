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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Save,
  Copy,
  Archive,
  CheckCircle,
  Edit2,
  ClipboardList,
} from "lucide-react";
import {
  useChecklistTemplates,
  useChecklistTemplate,
  type ChecklistSection,
} from "@/hooks/use-checklist-templates";
import { ChecklistSectionEditor } from "@/components/quality";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../convex/_generated/dataModel";

type ViewMode = "view" | "edit";

const SCOPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "quality", label: "Quality Inspection" },
  { value: "safety", label: "Safety Check" },
  { value: "prestart", label: "Prestart Check" },
  { value: "itp", label: "Inspection Test Plan" },
  { value: "audit", label: "Audit" },
];

export default function ChecklistTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const templateId = params.templateId as string;

  const { data: template, isLoading } = useChecklistTemplate(templateId as Id<"checklistTemplates">);
  const { actions } = useChecklistTemplates(orgId);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("view");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editScope, setEditScope] = useState("general");
  const [editSections, setEditSections] = useState<ChecklistSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enter edit mode
  const startEditing = () => {
    if (!template) return;
    setEditName(template.name || "");
    setEditDescription(template.description || "");
    setEditScope(template.scope || "general");
    setEditSections((template.sections as ChecklistSection[]) || []);
    setViewMode("edit");
    setError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setViewMode("view");
    setError(null);
  };

  // Save changes
  const saveChanges = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await actions.update({
        id: templateId as Id<"checklistTemplates">,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        scope: editScope,
        sections: editSections,
      });

      setViewMode("view");
    } catch (err) {
      console.error("Failed to save template:", err);
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // Activate template
  const handleActivate = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await actions.activate(templateId as Id<"checklistTemplates">);
    } catch (err) {
      console.error("Failed to activate template:", err);
      setError(err instanceof Error ? err.message : "Failed to activate template");
    } finally {
      setIsSaving(false);
    }
  };

  // Deactivate template
  const handleDeactivate = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await actions.deactivate(templateId as Id<"checklistTemplates">);
    } catch (err) {
      console.error("Failed to deactivate template:", err);
      setError(err instanceof Error ? err.message : "Failed to deactivate template");
    } finally {
      setIsSaving(false);
    }
  };

  // Clone template
  const handleClone = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const newId = await actions.clone(
        templateId as Id<"checklistTemplates">,
        `${template.name} (Copy)`,
        "demo-worker" as Id<"workers">
      );
      router.push(`/orgs/${orgId}/checklist-templates/${newId}`);
    } catch (err) {
      console.error("Failed to clone template:", err);
      setError(err instanceof Error ? err.message : "Failed to clone template");
    } finally {
      setIsSaving(false);
    }
  };

  const countFields = (sections: ChecklistSection[]): number => {
    return sections.reduce((acc, section) => acc + (section.fields?.length || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checklist Template" subtitle="Loading..." />
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

  if (!template) {
    return (
      <div className="space-y-6">
        <PageHeader title="Template Not Found" subtitle="The requested template could not be found" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">This template may have been deleted or you may not have access to it.</p>
            <Link href={`/orgs/${orgId}/checklist-templates`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = template.isActive;
  const templateSections = (template.sections as ChecklistSection[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={viewMode === "edit" ? "Edit Template" : template.name || "Checklist Template"}
        subtitle={viewMode === "edit" ? "Modify template details and sections" : template.description || "Checklist template"}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/orgs/${orgId}/checklist-templates`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            {viewMode === "view" && (
              <>
                <Button variant="outline" onClick={startEditing} disabled={isSaving}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleClone} disabled={isSaving}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone
                </Button>
                {isActive ? (
                  <Button variant="outline" onClick={handleDeactivate} disabled={isSaving}>
                    <Archive className="mr-2 h-4 w-4" />
                    Deactivate
                  </Button>
                ) : (
                  <Button onClick={handleActivate} disabled={isSaving}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
                  </Button>
                )}
              </>
            )}
            {viewMode === "edit" && (
              <>
                <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={isSaving || editName.trim().length < 3}>
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === "view" ? (
            <>
              {/* Template Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Template Overview</CardTitle>
                    <StatusBadge status={isActive ? "active" : "closed"} />
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Name</dt>
                      <dd className="font-medium">{template.name}</dd>
                    </div>
                    {template.description && (
                      <div className="flex">
                        <dt className="w-32 text-gray-500">Description</dt>
                        <dd>{template.description}</dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Scope</dt>
                      <dd className="capitalize">{template.scope || "general"}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Sections</dt>
                      <dd>{templateSections.length} sections</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Fields</dt>
                      <dd>{countFields(templateSections)} fields</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Created</dt>
                      <dd>{formatDate(template.createdAt)}</dd>
                    </div>
                    {template.updatedAt && template.updatedAt !== template.createdAt && (
                      <div className="flex">
                        <dt className="w-32 text-gray-500">Updated</dt>
                        <dd>{formatDate(template.updatedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Sections Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>Sections & Fields</CardTitle>
                  <CardDescription>
                    {templateSections.length} sections with {countFields(templateSections)} total fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templateSections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No sections have been added to this template yet.</p>
                      <button
                        onClick={startEditing}
                        className="text-[var(--color-accent)] hover:underline mt-2"
                      >
                        Add sections
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {templateSections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                          <div key={section.id} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">{section.title}</h4>
                            <div className="space-y-1">
                              {section.fields
                                .sort((a, b) => a.order - b.order)
                                .map((field) => (
                                  <div
                                    key={field.id}
                                    className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
                                  >
                                    <span>
                                      {field.label}
                                      {field.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-400 capitalize">
                                      {field.type.replace("_", " ")}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Edit Mode: Template Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Template Name *</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g., Daily Plant Prestart Check"
                    />
                    {editName.length > 0 && editName.length < 3 && (
                      <p className="text-sm text-red-500 mt-1">
                        Name must be at least 3 characters
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Brief description of when this template should be used..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-scope">Scope</Label>
                    <Select value={editScope} onValueChange={setEditScope}>
                      <SelectTrigger>
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
                  </div>
                </CardContent>
              </Card>

              {/* Edit Mode: Sections Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Sections & Fields</CardTitle>
                  <CardDescription>
                    Add, edit, and reorder sections and their fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChecklistSectionEditor
                    sections={editSections}
                    onChange={setEditSections}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status</span>
                <StatusBadge status={isActive ? "active" : "closed"} />
              </div>

              {isActive ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    This template is active and can be used to create checklist instances.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    This template is inactive. Activate it to allow creating new instances.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {viewMode === "view" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={startEditing}
                  disabled={isSaving}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Template
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClone}
                  disabled={isSaving}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Clone as New Template
                </Button>
                {isActive ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-amber-600 hover:text-amber-700"
                    onClick={handleDeactivate}
                    disabled={isSaving}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Deactivate Template
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-green-600 hover:text-green-700"
                    onClick={handleActivate}
                    disabled={isSaving}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate Template
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scoring Info (if enabled) */}
          {template.scoringEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Scoring Enabled</dt>
                    <dd>Yes</dd>
                  </div>
                  {template.passingScore && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Passing Score</dt>
                      <dd>{template.passingScore}%</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
