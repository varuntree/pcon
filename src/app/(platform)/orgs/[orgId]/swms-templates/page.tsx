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
import { Plus, FileText, Copy, Archive, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSWMSTemplates, SWMSTemplateStatus, SWMSTemplateData } from "@/hooks/use-swms-templates";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function SwmsTemplatesPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { data: templates, actions, isLoading } = useSWMSTemplates(orgId);
  const [filter, setFilter] = useState<SWMSTemplateStatus | "all">("all");

  const filteredTemplates = filter === "all"
    ? templates
    : templates.filter((t: SWMSTemplateData) => t.status === filter);

  const getStatusConfig = (status: SWMSTemplateStatus): string => {
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

  const handleClone = async (templateId: string) => {
    try {
      // Using a placeholder worker ID for demo - in production this would be the current user
      await actions.clone(templateId as Id<"swmsTemplates">, "demo-worker" as Id<"workers">);
    } catch (error) {
      console.error("Failed to clone template:", error);
    }
  };

  const handleArchive = async (templateId: string) => {
    try {
      await actions.archive(templateId as Id<"swmsTemplates">);
    } catch (error) {
      console.error("Failed to archive template:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SWMS Templates" subtitle="Loading..." />
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
        title="SWMS Templates"
        subtitle="Manage Safe Work Method Statement templates for your organization"
        actions={
          <Link href={`/orgs/${orgId}/swms-templates/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "draft", "published", "archived"] as const).map((status) => (
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
          icon={FileText}
          title="No SWMS templates"
          description={
            filter === "all"
              ? "Create your first SWMS template to get started"
              : `No ${filter} templates found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/swms-templates/new`}>
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
                  <TableHead>Version</TableHead>
                  <TableHead className="hidden md:table-cell">Sections</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template: SWMSTemplateData) => (
                  <TableRow key={template._id}>
                    <TableCell>
                      <div>
                        <Link
                          href={`/orgs/${orgId}/swms-templates/${template._id}`}
                          className="font-medium hover:underline"
                        >
                          {template.name}
                        </Link>
                        {template.description && (
                          <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getStatusConfig(template.status)} />
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {template.sections?.length || 0} sections
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(template.createdAt)}
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
                            <Link href={`/orgs/${orgId}/swms-templates/${template._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClone(template._id as string)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Clone
                          </DropdownMenuItem>
                          {template.status !== "archived" && (
                            <DropdownMenuItem onClick={() => handleArchive(template._id as string)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
