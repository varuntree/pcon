"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoIncidentReport = Doc<"incidentReports"> & {
  _id: Id<"incidentReports">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_INCIDENT_REPORTS: DemoIncidentReport[] = [
  {
    _id: "inc1" as Id<"incidentReports">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    incidentNumber: "INC-001",
    incidentType: "near_miss" as const,
    severity: "medium" as const,
    status: "open" as const,
    description: "Worker nearly struck by falling material from scaffold",
    location: "Building A, Level 3, Grid C2",
    date: Date.now() - 2 * 24 * 60 * 60 * 1000,
    reportedBy: "worker2" as Id<"workers">,
    reportedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "inc2" as Id<"incidentReports">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    incidentNumber: "INC-002",
    incidentType: "injury" as const,
    severity: "low" as const,
    status: "under_investigation" as const,
    description: "Minor cut to hand while handling steel reinforcement",
    location: "Building A, Ground Floor",
    date: Date.now() - 5 * 24 * 60 * 60 * 1000,
    reportedBy: "worker1" as Id<"workers">,
    reportedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    workerId: "worker3" as Id<"workers">,
    investigatorId: "worker1" as Id<"workers">,
    injuryDetails: {
      natureOfInjury: "Laceration",
      bodyLocation: "Left hand",
      treatmentRequired: true,
    },
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "inc3" as Id<"incidentReports">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    incidentNumber: "INC-003",
    incidentType: "property_damage" as const,
    severity: "high" as const,
    status: "closed" as const,
    description: "Excavator struck underground water main",
    location: "Car Park Area, South Side",
    date: Date.now() - 14 * 24 * 60 * 60 * 1000,
    reportedBy: "worker1" as Id<"workers">,
    reportedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    investigatorId: "worker1" as Id<"workers">,
    investigationNotes: "Dial before you dig not called. Procedure updated.",
    rootCause: "Failure to follow underground services check procedure",
    correctiveActions: [
      "Update excavation permit checklist",
      "Retrain all operators on DBYD requirements",
    ],
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type IncidentType =
  | "injury"
  | "near_miss"
  | "property_damage"
  | "environmental"
  | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "under_investigation" | "closed";

export interface Witness {
  name: string;
  contact?: string;
}

export interface InjuryDetails {
  natureOfInjury?: string;
  bodyLocation?: string;
  treatmentRequired?: boolean;
}

export type IncidentReportData = DemoIncidentReport;

export type IncidentReportWithDetails = DemoIncidentReport & {
  reporter: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  affectedWorker: {
    _id: string;
    fullName: string;
  } | null;
  investigator: {
    _id: string;
    fullName: string;
  } | null;
};

export interface IncidentStats {
  total: number;
  byStatus: {
    open: number;
    underInvestigation: number;
    closed: number;
  };
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: {
    injury: number;
    near_miss: number;
    property_damage: number;
    environmental: number;
    other: number;
  };
}

// Input types
export interface CreateIncidentReportInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  date: number;
  reportedBy: Id<"workers">;
  workerId?: Id<"workers">;
  witnesses?: Witness[];
  injuryDetails?: InjuryDetails;
  attachmentIds?: Id<"_storage">[];
}

export interface UpdateInvestigationInput {
  id: Id<"incidentReports">;
  investigationNotes?: string;
  rootCause?: string;
  correctiveActions?: string[];
}

export function useIncidentReports(projectId: Id<"projects"> | string): {
  data: IncidentReportData[];
  actions: {
    create: (
      input: Omit<CreateIncidentReportInput, "projectId">
    ) => Promise<Id<"incidentReports">>;
    assignInvestigator: (
      id: Id<"incidentReports">,
      investigatorId: Id<"workers">
    ) => Promise<Id<"incidentReports">>;
    updateInvestigation: (
      input: UpdateInvestigationInput
    ) => Promise<Id<"incidentReports">>;
    addAttachment: (
      id: Id<"incidentReports">,
      attachmentId: Id<"_storage">
    ) => Promise<Id<"incidentReports">>;
    close: (id: Id<"incidentReports">) => Promise<Id<"incidentReports">>;
    reopen: (id: Id<"incidentReports">) => Promise<Id<"incidentReports">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const incidentsQuery = useQuery(
    api.incidentReports.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.incidentReports.create);
  const assignInvestigatorMutation = useMutation(
    api.incidentReports.assignInvestigator
  );
  const updateInvestigationMutation = useMutation(
    api.incidentReports.updateInvestigation
  );
  const addAttachmentMutation = useMutation(api.incidentReports.addAttachment);
  const closeMutation = useMutation(api.incidentReports.close);
  const reopenMutation = useMutation(api.incidentReports.reopen);

  const demoData = DEMO_INCIDENT_REPORTS.filter(
    (i) => i.projectId === projectId
  );
  const data: IncidentReportData[] = convexAvailable
    ? ((incidentsQuery ?? []) as IncidentReportData[])
    : demoData;
  const isLoading = convexAvailable && incidentsQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateIncidentReportInput, "projectId">
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-inc-new" as Id<"incidentReports">;
      }
      return await createMutation({
        ...input,
        projectId: projectId as Id<"projects">,
      });
    },
    assignInvestigator: async (
      id: Id<"incidentReports">,
      investigatorId: Id<"workers">
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - assignInvestigator operation is a no-op"
        );
        return id;
      }
      return await assignInvestigatorMutation({ id, investigatorId });
    },
    updateInvestigation: async (
      input: UpdateInvestigationInput
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - updateInvestigation operation is a no-op"
        );
        return input.id;
      }
      return await updateInvestigationMutation(input);
    },
    addAttachment: async (
      id: Id<"incidentReports">,
      attachmentId: Id<"_storage">
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - addAttachment operation is a no-op"
        );
        return id;
      }
      return await addAttachmentMutation({ id, attachmentId });
    },
    close: async (
      id: Id<"incidentReports">
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - close operation is a no-op");
        return id;
      }
      return await closeMutation({ id });
    },
    reopen: async (
      id: Id<"incidentReports">
    ): Promise<Id<"incidentReports">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reopen operation is a no-op");
        return id;
      }
      return await reopenMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useIncidentReport(id: Id<"incidentReports"> | string) {
  const convexAvailable = useConvexAvailable();

  const incidentQuery = useQuery(
    api.incidentReports.get,
    convexAvailable ? { id: id as Id<"incidentReports"> } : "skip"
  );

  const demoIncident = DEMO_INCIDENT_REPORTS.find((i) => i._id === id);
  const data = convexAvailable
    ? (incidentQuery ?? null)
    : (demoIncident ?? null);
  const isLoading = convexAvailable && incidentQuery === undefined;

  return { data, isLoading };
}

export function useIncidentReportWithDetails(id: Id<"incidentReports"> | string) {
  const convexAvailable = useConvexAvailable();

  const detailsQuery = useQuery(
    api.incidentReports.getWithDetails,
    convexAvailable ? { id: id as Id<"incidentReports"> } : "skip"
  );

  const demoIncident = DEMO_INCIDENT_REPORTS.find((i) => i._id === id);
  const demoDetails: IncidentReportWithDetails | null = demoIncident
    ? {
        ...demoIncident,
        reporter: {
          _id: "worker1",
          fullName: "Mike Johnson",
          email: "mike.johnson@buildright.com.au",
        },
        affectedWorker: demoIncident.workerId
          ? {
              _id: "worker3",
              fullName: "Tom Williams",
            }
          : null,
        investigator: demoIncident.investigatorId
          ? {
              _id: "worker1",
              fullName: "Mike Johnson",
            }
          : null,
      }
    : null;

  const data = convexAvailable ? (detailsQuery ?? null) : demoDetails;
  const isLoading = convexAvailable && detailsQuery === undefined;

  return { data, isLoading };
}

export function useIncidentReportsByStatus(
  projectId: Id<"projects"> | string,
  status: IncidentStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.incidentReports.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const demoData = DEMO_INCIDENT_REPORTS.filter(
    (i) => i.projectId === projectId && i.status === status
  );
  const data: IncidentReportData[] = convexAvailable
    ? ((statusQuery ?? []) as IncidentReportData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useIncidentReportsByType(
  projectId: Id<"projects"> | string,
  incidentType: IncidentType
) {
  const convexAvailable = useConvexAvailable();

  const typeQuery = useQuery(
    api.incidentReports.listByType,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, incidentType }
      : "skip"
  );

  const demoData = DEMO_INCIDENT_REPORTS.filter(
    (i) => i.projectId === projectId && i.incidentType === incidentType
  );
  const data: IncidentReportData[] = convexAvailable
    ? ((typeQuery ?? []) as IncidentReportData[])
    : demoData;
  const isLoading = convexAvailable && typeQuery === undefined;

  return { data, isLoading };
}

export function useIncidentReportsBySeverity(
  projectId: Id<"projects"> | string,
  severity: IncidentSeverity
) {
  const convexAvailable = useConvexAvailable();

  const severityQuery = useQuery(
    api.incidentReports.listBySeverity,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, severity }
      : "skip"
  );

  const demoData = DEMO_INCIDENT_REPORTS.filter(
    (i) => i.projectId === projectId && i.severity === severity
  );
  const data: IncidentReportData[] = convexAvailable
    ? ((severityQuery ?? []) as IncidentReportData[])
    : demoData;
  const isLoading = convexAvailable && severityQuery === undefined;

  return { data, isLoading };
}

export function useWorkerIncidentReports(reportedBy: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const reporterQuery = useQuery(
    api.incidentReports.listByReporter,
    convexAvailable ? { reportedBy: reportedBy as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_INCIDENT_REPORTS.filter(
    (i) => i.reportedBy === reportedBy
  );
  const data: IncidentReportData[] = convexAvailable
    ? ((reporterQuery ?? []) as IncidentReportData[])
    : demoData;
  const isLoading = convexAvailable && reporterQuery === undefined;

  return { data, isLoading };
}

export function useIncidentStats(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const statsQuery = useQuery(
    api.incidentReports.getProjectStats,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const demoStats: IncidentStats = {
    total: 3,
    byStatus: {
      open: 1,
      underInvestigation: 1,
      closed: 1,
    },
    bySeverity: {
      low: 1,
      medium: 1,
      high: 1,
      critical: 0,
    },
    byType: {
      injury: 1,
      near_miss: 1,
      property_damage: 1,
      environmental: 0,
      other: 0,
    },
  };

  const data = convexAvailable ? (statsQuery ?? demoStats) : demoStats;
  const isLoading = convexAvailable && statsQuery === undefined;

  return { data, isLoading };
}
