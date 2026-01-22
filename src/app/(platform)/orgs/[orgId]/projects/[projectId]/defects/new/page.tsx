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
  useDefects,
  DefectCategory,
  DefectPriority,
  CreateDefectInput,
} from "@/hooks/use-defects";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

const CATEGORIES: { value: DefectCategory; label: string }[] = [
  { value: "builder", label: "Builder" },
  { value: "client", label: "Client" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

const PRIORITIES: { value: DefectPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function NewDefectPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const resolvedParams = use(params);
  const { orgId, projectId } = resolvedParams;
  const router = useRouter();

  const { actions } = useDefects(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "builder" as DefectCategory,
    location: "",
    level: "",
    area: "",
    priority: "medium" as DefectPriority,
    assignmentType: "none" as "none" | "org" | "worker",
    assignedTo: "",
    assignedWorkerId: "",
    dueDate: "",
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
        console.error("No worker found to create defect");
        return;
      }

      const input: CreateDefectInput = {
        orgId: orgId as Id<"orgs">,
        projectId: projectId as Id<"projects">,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        location: formData.location.trim() || undefined,
        level: formData.level.trim() || undefined,
        area: formData.area.trim() || undefined,
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
        createdBy,
      };

      const defectId = await actions.create(input);
      router.push(`/orgs/${orgId}/projects/${projectId}/defects/${defectId}`);
    } catch (error) {
      console.error("Failed to create defect:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Defect"
        subtitle="Document a new quality defect"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/defects`}>
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
                <CardTitle>Defect Information</CardTitle>
                <CardDescription>
                  Describe the defect and its location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the defect"
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
                    placeholder="Detailed description of the defect..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    maxLength={5000}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          category: value as DefectCategory,
                        })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          priority: value as DefectPriority,
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
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Where is the defect located?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Building A, North Wing"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level/Floor</Label>
                    <Input
                      id="level"
                      placeholder="e.g., Level 2, Ground Floor"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      placeholder="e.g., Bathroom, Kitchen"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                    />
                  </div>
                </div>
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
                  Who should fix this defect?
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
                  When should this be fixed?
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
                  {isSubmitting ? "Creating..." : "Create Defect"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
