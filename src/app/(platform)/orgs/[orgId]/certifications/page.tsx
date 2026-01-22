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
import { Plus, Award, MoreHorizontal, Eye, Power, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCertificationTypes, CertificationCategory, CertificationTypeData } from "@/hooks/use-certifications";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function CertificationsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { data: certificationTypes, actions, isLoading } = useCertificationTypes(orgId);
  const [filter, setFilter] = useState<"all" | CertificationCategory>("all");

  const filteredTypes = filter === "all"
    ? certificationTypes
    : certificationTypes.filter((t: CertificationTypeData) => t.category === filter);

  const getCategoryConfig = (category: CertificationCategory): { status: string; label: string } => {
    switch (category) {
      case "license":
        return { status: "active", label: "License" };
      case "ticket":
        return { status: "pending", label: "Ticket" };
      case "training":
        return { status: "in_progress", label: "Training" };
      case "medical":
        return { status: "submitted", label: "Medical" };
      case "other":
        return { status: "draft", label: "Other" };
      default:
        return { status: "draft", label: category };
    }
  };

  const handleToggleActive = async (typeId: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await actions.deactivate(typeId as Id<"certificationTypes">);
      } else {
        await actions.update({ id: typeId as Id<"certificationTypes">, isActive: true });
      }
    } catch (error) {
      console.error("Failed to toggle certification type:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Certification Types" subtitle="Loading..." />
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
        title="Certification Types"
        subtitle="Manage certification types and track worker competencies"
        actions={
          <Link href={`/orgs/${orgId}/certifications/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Certification Type
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "license", "ticket", "training", "medical", "other"] as const).map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {filteredTypes.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certification types"
          description={
            filter === "all"
              ? "Create your first certification type to get started"
              : `No ${filter} certification types found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/certifications/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Certification Type
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Certification Types</CardTitle>
            <CardDescription>
              {filteredTypes.length} certification type{filteredTypes.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Validity</TableHead>
                  <TableHead className="hidden md:table-cell">Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((certType: CertificationTypeData) => {
                  const categoryConfig = getCategoryConfig(certType.category);
                  return (
                    <TableRow key={certType._id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/orgs/${orgId}/certifications/${certType._id}`}
                            className="font-medium hover:underline"
                          >
                            {certType.name}
                          </Link>
                          {certType.description && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                              {certType.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {certType.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={categoryConfig.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {certType.validityDays ? `${certType.validityDays} days` : "Never expires"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {certType.isRequiredOrgwide ? (
                          <StatusBadge status="active" />
                        ) : (
                          <span className="text-[var(--color-text-muted)]">Optional</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={certType.isActive ? "active" : "closed"} />
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
                              <Link href={`/orgs/${orgId}/certifications/${certType._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(certType._id as string, certType.isActive)}
                            >
                              {certType.isActive ? (
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
