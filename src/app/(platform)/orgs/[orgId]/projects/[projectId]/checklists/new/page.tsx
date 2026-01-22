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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/layout/empty-state";
import { ArrowLeft, ClipboardCheck, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useChecklistInstances } from "@/hooks/use-checklist-instances";
import { useActiveChecklistTemplates, ChecklistTemplateData, ChecklistSection } from "@/hooks/use-checklist-templates";
import { useWorkers } from "@/hooks/use-workers";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function NewChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const { actions } = useChecklistInstances(projectId);
  const { data: templates, isLoading: templatesLoading } = useActiveChecklistTemplates(orgId);
  const { data: workers } = useWorkers(orgId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a checklist template");
      return;
    }

    setIsCreating(true);
    try {
      const instanceId = await actions.create({
        orgId: orgId as Id<"orgs">,
        projectId: projectId as Id<"projects">,
        checklistTemplateId: selectedTemplateId as Id<"checklistTemplates">,
        assignedTo: assignedTo ? (assignedTo as Id<"workers">) : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        sourceType: "manual",
      });

      toast.success("Checklist created");
      router.push(`/orgs/${orgId}/projects/${projectId}/checklists/${instanceId}`);
    } catch (error) {
      console.error("Failed to create checklist:", error);
      toast.error("Failed to create checklist");
    } finally {
      setIsCreating(false);
    }
  };

  // Count fields in template
  const getFieldCount = (template: ChecklistTemplateData): number => {
    const sections = template.sections as unknown as ChecklistSection[] | undefined;
    if (!sections) return 0;
    return sections.reduce((total, section) => total + (section.fields?.length ?? 0), 0);
  };

  if (templatesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="New Checklist" subtitle="Loading templates..." />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Checklist"
        subtitle="Start a new quality or safety checklist"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/checklists`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates available"
          description="Create a checklist template first before starting a checklist"
          action={
            <Link href={`/orgs/${orgId}/checklist-templates/new`}>
              <Button>Create Template</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Checklist Details
              </CardTitle>
              <CardDescription>
                Select a template and configure the checklist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">
                  Checklist Template <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => {
                      const id = template._id as string;
                      const name = String(template.name ?? "");
                      const scope = template.scope ? String(template.scope) : null;
                      return (
                        <SelectItem key={id} value={id}>
                          <div className="flex items-center gap-2">
                            <span>{name}</span>
                            {scope && (
                              <Badge variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To (Optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select a worker..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker._id} value={worker._id}>
                        {worker.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Link href={`/orgs/${orgId}/projects/${projectId}/checklists`}>
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  onClick={handleCreate}
                  disabled={!selectedTemplateId || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Start Checklist
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Name</p>
                      <p className="font-medium">{String(selectedTemplate.name ?? "")}</p>
                    </div>
                    {selectedTemplate.description && (
                      <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Description</p>
                        <p className="text-sm">{String(selectedTemplate.description)}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Scope</span>
                      <Badge variant="outline">{String(selectedTemplate.scope ?? "general")}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Sections</span>
                      <span className="font-medium">
                        {(selectedTemplate.sections as unknown as ChecklistSection[] | undefined)?.length ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Fields</span>
                      <span className="font-medium">{getFieldCount(selectedTemplate)}</span>
                    </div>
                    {selectedTemplate.scoringEnabled && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Passing Score</span>
                        <span className="font-medium">{Number(selectedTemplate.passingScore ?? 0)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                    Select a template to see preview
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sections Preview */}
            {selectedTemplate && (selectedTemplate.sections as unknown as ChecklistSection[] | undefined)?.length ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(selectedTemplate.sections as unknown as ChecklistSection[]).map((section, idx) => (
                      <li key={String(section.id)} className="flex items-center justify-between text-sm">
                        <span>
                          {idx + 1}. {String(section.title ?? "")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {section.fields?.length ?? 0} fields
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
