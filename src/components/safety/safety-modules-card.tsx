"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, GraduationCap } from "lucide-react";
import { useIncidentStats } from "@/hooks/use-incident-reports";
import { useSWMSDocuments } from "@/hooks/use-swms-documents";
import { usePermitInstances } from "@/hooks/use-permit-instances";
import { Id } from "../../../convex/_generated/dataModel";

interface SafetyModulesCardProps {
  orgId: string;
  projectId: string;
}

export function SafetyModulesCard({ orgId, projectId }: SafetyModulesCardProps) {
  const { data: incidentStats, isLoading: incidentsLoading } = useIncidentStats(
    projectId as Id<"projects">
  );
  const { data: swmsDocs, isLoading: swmsLoading } = useSWMSDocuments(
    projectId as Id<"projects">
  );
  const { data: permits, isLoading: permitsLoading } = usePermitInstances(
    projectId as Id<"projects">
  );

  // Calculate counts
  const openIncidents = incidentStats?.byStatus?.open ?? 0;
  const underInvestigation = incidentStats?.byStatus?.underInvestigation ?? 0;
  const totalActiveIncidents = openIncidents + underInvestigation;

  const activeSWMS = swmsDocs?.filter((d) => d.status === "approved").length ?? 0;
  const activePermits = permits?.filter((p) => p.status === "active").length ?? 0;

  const modules = [
    {
      label: "SWMS",
      href: "swms",
      icon: FileText,
      count: swmsLoading ? "..." : String(activeSWMS),
      subtitle: "approved",
    },
    {
      label: "Permits",
      href: "permits",
      icon: Shield,
      count: permitsLoading ? "..." : String(activePermits),
      subtitle: "active",
    },
    {
      label: "Incidents",
      href: "incidents",
      icon: AlertTriangle,
      count: incidentsLoading ? "..." : String(totalActiveIncidents),
      subtitle: "open",
      highlight: totalActiveIncidents > 0,
    },
    {
      label: "Inductions",
      href: "inductions",
      icon: GraduationCap,
      count: "—",
      subtitle: "pending",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Safety Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={`/orgs/${orgId}/projects/${projectId}/${module.href}`}
              className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:border-[var(--color-accent)] hover:bg-gray-50 ${
                module.highlight
                  ? "border-amber-300 bg-amber-50"
                  : "border-[var(--color-border)]"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  module.highlight
                    ? "bg-amber-100"
                    : "bg-[var(--color-accent)]/10"
                }`}
              >
                <module.icon
                  className={`h-5 w-5 ${
                    module.highlight
                      ? "text-amber-600"
                      : "text-[var(--color-accent)]"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium">{module.label}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {module.count} {module.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
