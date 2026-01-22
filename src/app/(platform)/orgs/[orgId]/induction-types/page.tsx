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
import { Plus, GraduationCap, MoreHorizontal, Eye, PowerOff, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInductionTypes, InductionScope, InductionTypeData } from "@/hooks/use-induction-types";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function InductionTypesPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { data: inductionTypes, actions, isLoading } = useInductionTypes(orgId);
  const [filter, setFilter] = useState<"all" | InductionScope>("all");

  const filteredTypes = filter === "all"
    ? inductionTypes
    : inductionTypes.filter((t: InductionTypeData) => t.scope === filter);

  const getScopeConfig = (scope: InductionScope): { status: string; label: string } => {
    switch (scope) {
      case "company":
        return { status: "active", label: "Company" };
      case "site":
        return { status: "pending", label: "Site" };
      case "task":
        return { status: "in_progress", label: "Task" };
      case "plant":
        return { status: "draft", label: "Plant" };
      default:
        return { status: "draft", label: scope };
    }
  };

  const handleDeactivate = async (typeId: string) => {
    try {
      await actions.deactivate(typeId as Id<"inductionTypes">);
    } catch (error) {
      console.error("Failed to deactivate induction type:", error);
    }
  };

  const handleClone = async (typeId: string) => {
    try {
      // Using a placeholder worker ID for demo - in production this would be the current user
      await actions.clone(typeId as Id<"inductionTypes">, "demo-worker" as Id<"workers">);
    } catch (error) {
      console.error("Failed to clone induction type:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Induction Types" subtitle="Loading..." />
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
        title="Induction Types"
        subtitle="Create and manage induction programs for workers and contractors"
        actions={
          <Link href={`/orgs/${orgId}/induction-types/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Induction Type
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "company", "site", "task", "plant"] as const).map((scope) => (
          <Button
            key={scope}
            variant={filter === scope ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(scope)}
          >
            {scope === "all" ? "All" : scope.charAt(0).toUpperCase() + scope.slice(1)}
          </Button>
        ))}
      </div>

      {filteredTypes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No induction types"
          description={
            filter === "all"
              ? "Create your first induction type to get started"
              : `No ${filter} induction types found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/induction-types/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Induction Type
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Induction Types</CardTitle>
            <CardDescription>
              {filteredTypes.length} induction type{filteredTypes.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="hidden md:table-cell">Steps</TableHead>
                  <TableHead className="hidden md:table-cell">Validity</TableHead>
                  <TableHead className="hidden md:table-cell">Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((inductionType: InductionTypeData) => {
                  const scopeConfig = getScopeConfig(inductionType.scope);
                  return (
                    <TableRow key={inductionType._id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/orgs/${orgId}/induction-types/${inductionType._id}`}
                            className="font-medium hover:underline"
                          >
                            {inductionType.name}
                          </Link>
                          {inductionType.description && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                              {inductionType.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={scopeConfig.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {inductionType.steps?.length || 0} steps
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {inductionType.validityDays ? `${inductionType.validityDays} days` : "Never expires"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        v{inductionType.version || 1}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inductionType.isActive ? "active" : "closed"} />
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
                              <Link href={`/orgs/${orgId}/induction-types/${inductionType._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(inductionType._id as string)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                            {inductionType.isActive && (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(inductionType._id as string)}
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
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
