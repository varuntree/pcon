"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { IncidentSeverityBadge } from "@/components/safety";
import {
  ArrowLeft,
  AlertTriangle,
  UserPlus,
  FileCheck,
  RotateCcw,
  Plus,
  MapPin,
  Calendar,
  Clock,
  User,
  Users,
} from "lucide-react";
import {
  useIncidentReportWithDetails,
  useIncidentReports,
  IncidentStatus,
  IncidentType,
} from "@/hooks/use-incident-reports";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

export default function IncidentDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const incidentId = params.incidentId as string;

  const { data: incident, isLoading } = useIncidentReportWithDetails(incidentId);
  const { actions } = useIncidentReports(projectId);
  const { data: workers } = useWorkers(orgId);

  // Investigation form state
  const [showInvestigationPanel, setShowInvestigationPanel] = useState(false);
  const [selectedInvestigator, setSelectedInvestigator] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [newCorrectiveAction, setNewCorrectiveAction] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeWorkers = workers.filter((w) => w.status === "active");

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

  const handleAssignInvestigator = async () => {
    if (!selectedInvestigator) return;
    setIsUpdating(true);
    try {
      await actions.assignInvestigator(
        incidentId as Id<"incidentReports">,
        selectedInvestigator as Id<"workers">
      );
      setSelectedInvestigator("");
    } catch (error) {
      console.error("Failed to assign investigator:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInvestigation = async () => {
    setIsUpdating(true);
    try {
      await actions.updateInvestigation({
        id: incidentId as Id<"incidentReports">,
        investigationNotes: investigationNotes || undefined,
        rootCause: rootCause || undefined,
        correctiveActions: correctiveActions.length > 0 ? correctiveActions : undefined,
      });
      setShowInvestigationPanel(false);
    } catch (error) {
      console.error("Failed to update investigation:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = async () => {
    setIsUpdating(true);
    try {
      await actions.close(incidentId as Id<"incidentReports">);
    } catch (error) {
      console.error("Failed to close incident:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopen = async () => {
    setIsUpdating(true);
    try {
      await actions.reopen(incidentId as Id<"incidentReports">);
    } catch (error) {
      console.error("Failed to reopen incident:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const addCorrectiveAction = () => {
    if (newCorrectiveAction.trim()) {
      setCorrectiveActions([...correctiveActions, newCorrectiveAction.trim()]);
      setNewCorrectiveAction("");
    }
  };

  const removeCorrectiveAction = (index: number) => {
    setCorrectiveActions(correctiveActions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Incident Details" subtitle="Loading..." />
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

  if (!incident) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Incident Not Found"
          subtitle="The requested incident could not be found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/incidents`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Incidents
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Initialize form state from incident data
  if (
    showInvestigationPanel &&
    !investigationNotes &&
    incident.investigationNotes
  ) {
    setInvestigationNotes(incident.investigationNotes);
  }
  if (showInvestigationPanel && !rootCause && incident.rootCause) {
    setRootCause(incident.rootCause);
  }
  if (
    showInvestigationPanel &&
    correctiveActions.length === 0 &&
    incident.correctiveActions &&
    Array.isArray(incident.correctiveActions)
  ) {
    setCorrectiveActions(incident.correctiveActions as string[]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Incident ${incident.incidentNumber}`}
        subtitle={getTypeLabel(incident.incidentType)}
        actions={
          <div className="flex items-center gap-2">
            {incident.status === "open" && (
              <Button
                variant="outline"
                onClick={() => setShowInvestigationPanel(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Investigator
              </Button>
            )}
            {incident.status === "under_investigation" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowInvestigationPanel(true)}
                >
                  Update Investigation
                </Button>
                <Button onClick={handleClose} disabled={isUpdating}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Close Incident
                </Button>
              </>
            )}
            {incident.status === "closed" && (
              <Button variant="outline" onClick={handleReopen} disabled={isUpdating}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reopen
              </Button>
            )}
            <Link href={`/orgs/${orgId}/projects/${projectId}/incidents`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Incident Overview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <IncidentSeverityBadge severity={incident.severity} />
                  <StatusBadge status={getStatusConfig(incident.status)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[var(--color-text-muted)]">Description</Label>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                  {incident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <Label className="text-xs text-[var(--color-text-muted)]">Date</Label>
                    <p className="text-sm font-medium">{formatDate(incident.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <Label className="text-xs text-[var(--color-text-muted)]">Reported</Label>
                    <p className="text-sm font-medium">{formatDateTime(incident.reportedAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <Label className="text-xs text-[var(--color-text-muted)]">Location</Label>
                    <p className="text-sm font-medium">{incident.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Injury Details (conditional) */}
          {incident.incidentType === "injury" && incident.injuryDetails && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  Injury Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {incident.injuryDetails.natureOfInjury && (
                    <div>
                      <dt className="text-[var(--color-text-muted)]">Nature of Injury</dt>
                      <dd className="font-medium">{incident.injuryDetails.natureOfInjury}</dd>
                    </div>
                  )}
                  {incident.injuryDetails.bodyLocation && (
                    <div>
                      <dt className="text-[var(--color-text-muted)]">Body Location</dt>
                      <dd className="font-medium">{incident.injuryDetails.bodyLocation}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-[var(--color-text-muted)]">Treatment Required</dt>
                    <dd className="font-medium">
                      {incident.injuryDetails.treatmentRequired ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Investigation Panel (conditional) */}
          {showInvestigationPanel && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">Investigation Details</CardTitle>
                <CardDescription>
                  Update the investigation progress and findings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incident.status === "open" && (
                  <div className="space-y-2">
                    <Label htmlFor="investigator">Assign Investigator</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedInvestigator}
                        onValueChange={setSelectedInvestigator}
                      >
                        <SelectTrigger id="investigator" className="flex-1">
                          <SelectValue placeholder="Select investigator" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeWorkers.map((worker) => (
                            <SelectItem key={worker._id} value={worker._id}>
                              {worker.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignInvestigator}
                        disabled={!selectedInvestigator || isUpdating}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="investigationNotes">Investigation Notes</Label>
                  <Textarea
                    id="investigationNotes"
                    placeholder="Document your investigation findings..."
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rootCause">Root Cause</Label>
                  <Textarea
                    id="rootCause"
                    placeholder="Identify the root cause of the incident..."
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Corrective Actions</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a corrective action..."
                      value={newCorrectiveAction}
                      onChange={(e) => setNewCorrectiveAction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCorrectiveAction();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addCorrectiveAction}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {correctiveActions.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {correctiveActions.map((action, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
                        >
                          <span>{action}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCorrectiveAction(index)}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            ×
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInvestigationPanel(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateInvestigation} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Investigation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Investigation Info */}
          {!showInvestigationPanel &&
            (incident.investigationNotes ||
              incident.rootCause ||
              (incident.correctiveActions &&
                Array.isArray(incident.correctiveActions) &&
                incident.correctiveActions.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Investigation Findings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incident.investigationNotes && (
                    <div>
                      <Label className="text-[var(--color-text-muted)]">
                        Investigation Notes
                      </Label>
                      <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                        {incident.investigationNotes}
                      </p>
                    </div>
                  )}
                  {incident.rootCause && (
                    <div>
                      <Label className="text-[var(--color-text-muted)]">Root Cause</Label>
                      <p className="mt-1 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                        {incident.rootCause}
                      </p>
                    </div>
                  )}
                  {incident.correctiveActions &&
                    Array.isArray(incident.correctiveActions) &&
                    incident.correctiveActions.length > 0 && (
                      <div>
                        <Label className="text-[var(--color-text-muted)]">
                          Corrective Actions
                        </Label>
                        <ul className="mt-1 space-y-1">
                          {(incident.correctiveActions as string[]).map(
                            (action, index) => (
                              <li
                                key={index}
                                className="text-sm bg-green-50 px-3 py-2 rounded border border-green-200"
                              >
                                {action}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* People */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                People Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-[var(--color-text-muted)]">Reported By</Label>
                <p className="text-sm font-medium">
                  {incident.reporter?.fullName ?? "Unknown"}
                </p>
                {incident.reporter?.email && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {incident.reporter.email}
                  </p>
                )}
              </div>

              {incident.affectedWorker && (
                <div>
                  <Label className="text-xs text-[var(--color-text-muted)]">
                    Affected Worker
                  </Label>
                  <p className="text-sm font-medium">
                    {incident.affectedWorker.fullName}
                  </p>
                </div>
              )}

              {incident.investigator && (
                <div>
                  <Label className="text-xs text-[var(--color-text-muted)]">Investigator</Label>
                  <p className="text-sm font-medium">
                    {incident.investigator.fullName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Witnesses */}
          {incident.witnesses &&
            Array.isArray(incident.witnesses) &&
            incident.witnesses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Witnesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(incident.witnesses as { name: string; contact?: string }[]).map(
                      (witness, index) => (
                        <li key={index} className="text-sm">
                          <p className="font-medium">{witness.name}</p>
                          {witness.contact && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {witness.contact}
                            </p>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(incident.createdAt)}
                    </p>
                  </div>
                </li>
                {incident.status !== "open" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Investigation Started</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Assigned to {incident.investigator?.fullName}
                      </p>
                    </div>
                  </li>
                )}
                {incident.status === "closed" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Closed</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(incident.updatedAt)}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
