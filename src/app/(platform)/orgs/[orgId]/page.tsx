"use client";

import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  AlertCircle,
  FileWarning,
  ClipboardCheck,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useOrgSafetyStats, useOrg } from "@/hooks/use-orgs";

export default function OrgDashboardPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: org } = useOrg(orgId);
  const { data: stats, isLoading } = useOrgSafetyStats(orgId);

  const statCards = stats
    ? [
        {
          label: "Active Projects",
          value: stats.activeProjects.toString(),
          icon: FolderKanban,
          color: "text-blue-600",
        },
        {
          label: "Total Workers",
          value: stats.totalWorkers.toString(),
          icon: Users,
          color: "text-green-600",
        },
        {
          label: "Open Incidents",
          value: stats.openIncidents.toString(),
          icon: AlertCircle,
          color: stats.openIncidents > 0 ? "text-red-600" : "text-gray-600",
        },
        {
          label: "Pending Permits",
          value: stats.pendingPermits.toString(),
          icon: FileWarning,
          color: stats.pendingPermits > 0 ? "text-amber-600" : "text-gray-600",
        },
        {
          label: "Inductions Awaiting Review",
          value: stats.awaitingReview.toString(),
          icon: ClipboardCheck,
          color: stats.awaitingReview > 0 ? "text-orange-600" : "text-gray-600",
        },
        {
          label: "SWMS Awaiting Signatures",
          value: stats.swmsNeedingSignatures.toString(),
          icon: FileCheck2,
          color:
            stats.swmsNeedingSignatures > 0 ? "text-purple-600" : "text-gray-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Organization overview for ${org?.name ?? orgId}`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Chief AI Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Chief AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <LayoutDashboard className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium">Chief AI Coming Soon</h3>
            <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
              Your AI-powered construction assistant will help you manage projects,
              track safety compliance, and generate reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
