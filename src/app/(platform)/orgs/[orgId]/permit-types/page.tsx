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
import { Plus, Shield, MoreHorizontal, Eye, Power, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermitTypes, PermitRiskLevel, PermitTypeData } from "@/hooks/use-permit-types";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function PermitTypesPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { data: permitTypes, actions, isLoading } = usePermitTypes(orgId);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredTypes = filter === "all"
    ? permitTypes
    : permitTypes.filter((t: PermitTypeData) => filter === "active" ? t.isActive : !t.isActive);

  const getRiskLevelConfig = (level: PermitRiskLevel): { status: string; label: string } => {
    switch (level) {
      case "low":
        return { status: "active", label: "Low" };
      case "medium":
        return { status: "pending", label: "Medium" };
      case "high":
        return { status: "rejected", label: "High" };
      default:
        return { status: "draft", label: level };
    }
  };

  const handleToggleActive = async (typeId: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await actions.deactivate(typeId as Id<"permitTypes">);
      } else {
        await actions.update({ id: typeId as Id<"permitTypes">, isActive: true });
      }
    } catch (error) {
      console.error("Failed to toggle permit type:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Permit Types" subtitle="Loading..." />
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
        title="Permit Types"
        subtitle="Configure permit types and approval workflows for your organization"
        actions={
          <Link href={`/orgs/${orgId}/permit-types/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Permit Type
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

      {filteredTypes.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No permit types"
          description={
            filter === "all"
              ? "Create your first permit type to get started"
              : `No ${filter} permit types found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/permit-types/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Permit Type
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Permit Types</CardTitle>
            <CardDescription>
              {filteredTypes.length} permit type{filteredTypes.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="hidden md:table-cell">Validity</TableHead>
                  <TableHead className="hidden md:table-cell">Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((permitType: PermitTypeData) => {
                  const riskConfig = getRiskLevelConfig(permitType.riskLevel);
                  return (
                    <TableRow key={permitType._id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/orgs/${orgId}/permit-types/${permitType._id}`}
                            className="font-medium hover:underline"
                          >
                            {permitType.name}
                          </Link>
                          {permitType.description && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                              {permitType.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {permitType.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={riskConfig.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {permitType.defaultValidityHours}h
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {permitType.requiredFields?.length || 0} fields
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={permitType.isActive ? "active" : "closed"} />
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
                              <Link href={`/orgs/${orgId}/permit-types/${permitType._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(permitType._id as string, permitType.isActive)}
                            >
                              {permitType.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
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
