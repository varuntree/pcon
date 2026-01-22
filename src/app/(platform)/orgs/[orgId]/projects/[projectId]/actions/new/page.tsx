"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save } from "lucide-react";
import {
  useActionItems,
  ActionPriority,
  ActionSourceType,
  CreateActionItemInput,
} from "@/hooks/use-action-items";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

const PRIORITIES: { value: ActionPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const SOURCE_TYPES: { value: ActionSourceType | "none"; label: string }[] = [
  { value: "none", label: "None (Manual)" },
  { value: "checklist", label: "Checklist" },
  { value: "inspection", label: "Inspection" },
  { value: "incident", label: "Incident" },
  { value: "defect", label: "Defect" },
  { value: "itp", label: "ITP" },
];

export default function NewActionPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const resolvedParams = use(params);
  const { orgId, projectId } = resolvedParams;
  const router = useRouter();

  const { actions } = useActionItems(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as ActionPriority,
    assignmentType: "none" as "none" | "org" | "worker",
    assignedTo: "",
    assignedWorkerId: "",
    dueDate: "",
    sourceType: "none" as ActionSourceType | "none",
    sourceId: "",
  });

  const subcontractors = orgs.filter((o) => o.kind === "subcontractor");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current worker as creator (first worker in list for demo)
      const createdBy = workers[0]?._id;
      if (!createdBy) {
        console.error("No worker found to create action");
        return;
      }

      const input: CreateActionItemInput = {
        orgId: orgId as Id<"orgs">,
        projectId: projectId as Id<"projects">,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        assignedTo:
          formData.assignmentType === "org" && formData.assignedTo
            ? (formData.assignedTo as Id<"orgs">)
            : undefined,
        assignedWorkerId:
          formData.assignmentType === "worker" && formData.assignedWorkerId
            ? (formData.assignedWorkerId as Id<"workers">)
            : undefined,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).getTime()
          : undefined,
        sourceType:
          formData.sourceType !== "none"
            ? (formData.sourceType as ActionSourceType)
            : undefined,
        sourceId: formData.sourceId.trim() || undefined,
        createdBy,
      };

      const actionId = await actions.create(input);
      router.push(`/orgs/${orgId}/projects/${projectId}/actions/${actionId}`);
    } catch (error) {
      console.error("Failed to create action:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Action Item"
        subtitle="Create a corrective action or follow-up task"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/actions`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Action Details</CardTitle>
                <CardDescription>
                  Describe the action that needs to be taken
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the action required"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of what needs to be done..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    maxLength={5000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as ActionPriority,
                      })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          {pri.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Source Info */}
            <Card>
              <CardHeader>
                <CardTitle>Source</CardTitle>
                <CardDescription>
                  Where did this action originate from?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceType">Source Type</Label>
                  <Select
                    value={formData.sourceType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        sourceType: value as ActionSourceType | "none",
                        sourceId: "",
                      })
                    }
                  >
                    <SelectTrigger id="sourceType">
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((src) => (
                        <SelectItem key={src.value} value={src.value}>
                          {src.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.sourceType !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="sourceId">Source Reference</Label>
                    <Input
                      id="sourceId"
                      placeholder="ID or reference number"
                      value={formData.sourceId}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceId: e.target.value })
                      }
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Enter the ID of the related{" "}
                      {formData.sourceType.toLowerCase()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
                <CardDescription>
                  Who should complete this action?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentType">Assign To</Label>
                  <Select
                    value={formData.assignmentType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        assignmentType: value as "none" | "org" | "worker",
                        assignedTo: "",
                        assignedWorkerId: "",
                      })
                    }
                  >
                    <SelectTrigger id="assignmentType">
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      <SelectItem value="org">Subcontractor</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.assignmentType === "org" && (
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Subcontractor</Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignedTo: value })
                      }
                    >
                      <SelectTrigger id="assignedTo">
                        <SelectValue placeholder="Select subcontractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcontractors.map((org) => (
                          <SelectItem key={org._id} value={org._id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.assignmentType === "worker" && (
                  <div className="space-y-2">
                    <Label htmlFor="assignedWorkerId">Worker</Label>
                    <Select
                      value={formData.assignedWorkerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignedWorkerId: value })
                      }
                    >
                      <SelectTrigger id="assignedWorkerId">
                        <SelectValue placeholder="Select worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker._id} value={worker._id}>
                            {worker.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Due Date */}
            <Card>
              <CardHeader>
                <CardTitle>Due Date</CardTitle>
                <CardDescription>
                  When should this be completed?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!formData.title.trim() || isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Action"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
