"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { Plus, ClipboardList, Copy, Archive, MoreHorizontal, Eye, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChecklistTemplates, ChecklistTemplateData } from "@/hooks/use-checklist-templates";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../convex/_generated/dataModel";

type FilterStatus = "all" | "active" | "inactive";

export default function ChecklistTemplatesPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { data: templates, actions, isLoading } = useChecklistTemplates(orgId);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredTemplates = filter === "all"
    ? templates
    : templates.filter((t: ChecklistTemplateData) => {
        if (filter === "active") return t.isActive;
        return !t.isActive;
      });

  const getStatusConfig = (isActive: boolean): string => {
    return isActive ? "active" : "closed";
  };

  const handleClone = async (templateId: string, templateName: string) => {
    try {
      await actions.clone(
        templateId as Id<"checklistTemplates">,
        `${templateName} (Copy)`,
        "demo-worker" as Id<"workers">
      );
    } catch (error) {
      console.error("Failed to clone template:", error);
    }
  };

  const handleDeactivate = async (templateId: string) => {
    try {
      await actions.deactivate(templateId as Id<"checklistTemplates">);
    } catch (error) {
      console.error("Failed to deactivate template:", error);
    }
  };

  const handleActivate = async (templateId: string) => {
    try {
      await actions.activate(templateId as Id<"checklistTemplates">);
    } catch (error) {
      console.error("Failed to activate template:", error);
    }
  };

  const countFields = (template: ChecklistTemplateData): number => {
    const sections = template.sections as Array<{ fields?: unknown[] }> | undefined;
    if (!sections) return 0;
    return sections.reduce((acc, section) => acc + (section.fields?.length || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checklist Templates" subtitle="Loading..." />
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
        title="Checklist Templates"
        subtitle="Create and manage reusable checklist templates for inspections, prestarts, and quality checks"
        actions={
          <Link href={`/orgs/${orgId}/checklist-templates/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No checklist templates"
          description={
            filter === "all"
              ? "Create your first checklist template to get started"
              : `No ${filter} templates found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/checklist-templates/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="hidden md:table-cell">Sections</TableHead>
                  <TableHead className="hidden md:table-cell">Fields</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template: ChecklistTemplateData) => {
                  const templateId = String(template._id);
                  const name = String(template.name || "");
                  const description = template.description ? String(template.description) : null;
                  const scope = String(template.scope || "general");
                  const isActive = Boolean(template.isActive);
                  const sections = template.sections as Array<{ fields?: unknown[] }> | undefined;
                  const sectionCount = sections?.length || 0;
                  const fieldCount = countFields(template);
                  const createdAt = typeof template.createdAt === "number" ? template.createdAt : Date.now();

                  return (
                    <TableRow key={templateId}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/orgs/${orgId}/checklist-templates/${templateId}`}
                            className="font-medium hover:underline"
                          >
                            {name}
                          </Link>
                          {description && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                              {description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getStatusConfig(isActive)} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{scope}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sectionCount} sections
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fieldCount} fields
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatDate(createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orgs/${orgId}/checklist-templates/${templateId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(templateId, name)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                            {isActive ? (
                              <DropdownMenuItem onClick={() => handleDeactivate(templateId)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(templateId)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
