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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  Copy,
  Edit2,
  History,
} from "lucide-react";
import {
  useSWMSTemplates,
  useSWMSTemplate,
  useSWMSTemplateVersionHistory,
  type SWMSSection,
} from "@/hooks/use-swms-templates";
import {
  SWMSSectionsViewer,
  SWMSSectionEditor,
  type EditableSwmsSection,
} from "@/components/safety";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../convex/_generated/dataModel";

type ViewMode = "view" | "edit";

export default function SwmsTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const templateId = params.templateId as string;

  const { data: template, isLoading } = useSWMSTemplate(templateId as Id<"swmsTemplates">);
  const { actions } = useSWMSTemplates(orgId);
  const { data: versionHistory } = useSWMSTemplateVersionHistory(templateId as Id<"swmsTemplates">);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("view");
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSections, setEditSections] = useState<EditableSwmsSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enter edit mode
  const startEditing = () => {
    if (!template) return;
    setEditName(template.name || "");
    setEditDescription(template.description || "");
    setEditSections(
      (template.sections as SWMSSection[] || []).map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title || "",
        content: s.content,
        order: s.order,
      }))
    );
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
      const formattedSections = editSections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content,
        order: s.order,
      }));

      await actions.update({
        id: templateId as Id<"swmsTemplates">,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        sections: formattedSections,
      });

      setViewMode("view");
    } catch (err) {
      console.error("Failed to save template:", err);
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish template
  const handlePublish = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await actions.publish(templateId as Id<"swmsTemplates">);
    } catch (err) {
      console.error("Failed to publish template:", err);
      setError(err instanceof Error ? err.message : "Failed to publish template");
    } finally {
      setIsSaving(false);
    }
  };

  // Archive template
  const handleArchive = async () => {
    if (!template || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await actions.archive(templateId as Id<"swmsTemplates">);
    } catch (err) {
      console.error("Failed to archive template:", err);
      setError(err instanceof Error ? err.message : "Failed to archive template");
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
        templateId as Id<"swmsTemplates">,
        "demo-worker" as Id<"workers">
      );
      router.push(`/orgs/${orgId}/swms-templates/${newId}`);
    } catch (err) {
      console.error("Failed to clone template:", err);
      setError(err instanceof Error ? err.message : "Failed to clone template");
    } finally {
      setIsSaving(false);
    }
  };

  // Get status badge config
  const getStatusConfig = (status: string): string => {
    switch (status) {
      case "draft":
        return "draft";
      case "published":
        return "active";
      case "archived":
        return "closed";
      default:
        return "pending";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SWMS Template" subtitle="Loading..." />
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
            <Link href={`/orgs/${orgId}/swms-templates`}>
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

  const isDraft = template.status === "draft";
  const isPublished = template.status === "published";
  const isArchived = template.status === "archived";
  const templateSections = (template.sections as SWMSSection[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={viewMode === "edit" ? "Edit Template" : template.name || "SWMS Template"}
        subtitle={viewMode === "edit" ? "Modify template details and sections" : template.description || "Safe Work Method Statement template"}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/orgs/${orgId}/swms-templates`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            {viewMode === "view" && (
              <>
                {isDraft && (
                  <Button variant="outline" onClick={startEditing} disabled={isSaving}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" onClick={handleClone} disabled={isSaving}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone
                </Button>
                {isDraft && (
                  <Button onClick={handlePublish} disabled={isSaving || templateSections.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                )}
                {!isArchived && (
                  <Button variant="outline" onClick={handleArchive} disabled={isSaving}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
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
                    <StatusBadge status={getStatusConfig(template.status)} />
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
                      <dt className="w-32 text-gray-500">Version</dt>
                      <dd>v{template.version}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-500">Sections</dt>
                      <dd>{templateSections.length} sections</dd>
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
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>
                    {templateSections.length} sections in this template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templateSections.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No sections have been added to this template yet.
                      {isDraft && (
                        <>
                          {" "}
                          <button
                            onClick={startEditing}
                            className="text-[var(--color-accent)] hover:underline"
                          >
                            Add sections
                          </button>
                        </>
                      )}
                    </p>
                  ) : (
                    <SWMSSectionsViewer
                      sections={templateSections.map((s) => ({
                        id: s.id,
                        type: s.type,
                        content: s.content,
                        order: s.order,
                      }))}
                      defaultExpanded={false}
                    />
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
                      placeholder="e.g., Working at Heights SWMS"
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
                </CardContent>
              </Card>

              {/* Edit Mode: Sections Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>
                    Add, edit, and reorder sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SWMSSectionEditor
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
                <StatusBadge status={getStatusConfig(template.status)} />
              </div>

              {isDraft && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    This template is in draft. Edit and publish when ready.
                  </p>
                </div>
              )}

              {isPublished && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    Published templates cannot be edited. Clone to make changes.
                  </p>
                </div>
              )}

              {isArchived && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    This template has been archived and is no longer in use.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Version History</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                >
                  <History className="h-4 w-4 mr-1" />
                  {showVersionHistory ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>
            {showVersionHistory && (
              <CardContent>
                <div className="space-y-2">
                  {versionHistory?.map((version) => (
                    <div
                      key={version._id}
                      className={`p-2 rounded border ${
                        version._id === templateId
                          ? "border-[var(--color-accent)] bg-orange-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{version.version}</span>
                        <StatusBadge status={getStatusConfig(version.status)} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(version.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Quick Actions */}
          {viewMode === "view" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isDraft && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={startEditing}
                    disabled={isSaving}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Template
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClone}
                  disabled={isSaving}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Clone as New Draft
                </Button>
                {isDraft && templateSections.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handlePublish}
                    disabled={isSaving}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Publish Template
                  </Button>
                )}
                {!isArchived && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleArchive}
                    disabled={isSaving}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Template
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
