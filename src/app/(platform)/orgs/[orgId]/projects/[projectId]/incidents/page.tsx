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
import { Plus, AlertTriangle, MoreHorizontal, Eye, UserPlus, FileCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IncidentSeverityBadge } from "@/components/safety";
import { useIncidentReports, IncidentStatus, IncidentType, IncidentReportData } from "@/hooks/use-incident-reports";
import { formatDate } from "@/lib/utils";

export default function ProjectIncidentsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: incidents, isLoading } = useIncidentReports(projectId);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");

  const filteredIncidents = incidents
    .filter((i: IncidentReportData) => statusFilter === "all" || i.status === statusFilter)
    .filter((i: IncidentReportData) => typeFilter === "all" || i.incidentType === typeFilter);

  const getStatusConfig = (status: IncidentStatus): string => {
    switch (status) {
      case "open":
        return "pending";
      case "under_investigation":
        return "under_investigation";
      case "closed":
        return "closed";
      default:
        return "pending";
    }
  };

  const getTypeLabel = (type: IncidentType): string => {
    switch (type) {
      case "injury":
        return "Injury";
      case "near_miss":
        return "Near Miss";
      case "property_damage":
        return "Property Damage";
      case "environmental":
        return "Environmental";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Incidents" subtitle="Loading..." />
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
        title="Incidents"
        subtitle="Report and manage safety incidents for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/incidents/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-[var(--color-text-muted)] py-1">Status:</span>
          {(["all", "open", "under_investigation", "closed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" :
               status === "under_investigation" ? "Under Investigation" :
               status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-[var(--color-text-muted)] py-1">Type:</span>
          {(["all", "injury", "near_miss", "property_damage", "environmental", "other"] as const).map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === "all" ? "All" : getTypeLabel(type)}
            </Button>
          ))}
        </div>
      </div>

      {filteredIncidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents"
          description={
            statusFilter === "all" && typeFilter === "all"
              ? "No incidents have been reported for this project"
              : "No incidents match the selected filters"
          }
          action={
            statusFilter === "all" && typeFilter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/incidents/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Report Incident
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Incidents</CardTitle>
            <CardDescription>
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident: IncidentReportData) => (
                  <TableRow key={incident._id}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {incident.incidentNumber}
                      </code>
                    </TableCell>
                    <TableCell>{getTypeLabel(incident.incidentType)}</TableCell>
                    <TableCell>
                      <IncidentSeverityBadge severity={incident.severity} size="sm" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Link
                        href={`/orgs/${orgId}/projects/${projectId}/incidents/${incident._id}`}
                        className="hover:underline"
                      >
                        {incident.description.length > 40
                          ? incident.description.substring(0, 40) + "..."
                          : incident.description}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{incident.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={getStatusConfig(incident.status)} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(incident.date)}
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
                            <Link href={`/orgs/${orgId}/projects/${projectId}/incidents/${incident._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {incident.status === "open" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/orgs/${orgId}/projects/${projectId}/incidents/${incident._id}/investigate`}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign Investigator
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                          {incident.status === "under_investigation" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/orgs/${orgId}/projects/${projectId}/incidents/${incident._id}/close`}>
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Close Investigation
                                </Link>
                              </DropdownMenuItem>
                            </>
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
