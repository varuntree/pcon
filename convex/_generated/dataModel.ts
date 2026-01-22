/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generated Convex data model types stub for development
 * This file will be overwritten when running `npx convex dev`
 */

import { GenericDataModel, GenericDocument, GenericTableInfo } from "convex/server";
import { GenericId } from "convex/values";

// Export Id type for use in application code
export type Id<TableName extends keyof DataModel> = GenericId<TableName>;

// Document type helper - gets the document type for a table
export type Doc<TableName extends keyof DataModel> = DataModel[TableName]["document"];

// Table document types
export type Org = GenericDocument & {
  name: string;
  abn?: string;
  kind: "principal" | "subcontractor" | "client" | "supplier" | "regulator" | "other";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type Project = GenericDocument & {
  orgId: GenericId<"orgs">;
  clientOrgId?: GenericId<"orgs">;
  name: string;
  code: string;
  address?: string;
  value?: number;
  status: "planning" | "active" | "completed" | "archived";
  startDate?: number;
  endDate?: number;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type Trade = GenericDocument & {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Worker = GenericDocument & {
  orgId: GenericId<"orgs">;
  fullName: string;
  email: string;
  phone?: string;
  role: "project_manager" | "site_supervisor" | "foreman" | "tradesperson" | "laborer" | "safety_officer" | "admin";
  status: "pending" | "active" | "inactive";
  tradeId?: GenericId<"trades">;
  employer?: string;
  avatarId?: GenericId<"_storage">;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  medicalConditions?: string;
  allergies?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type WorkPackage = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId: GenericId<"projects">;
  name: string;
  description?: string;
  status: "planned" | "active" | "completed" | "archived";
  tradeId?: GenericId<"trades">;
  phaseId?: string;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type WorkerAssignment = GenericDocument & {
  workerId: GenericId<"workers">;
  projectId: GenericId<"projects">;
  role: "project_manager" | "site_supervisor" | "foreman" | "tradesperson" | "laborer" | "safety_officer" | "admin";
  createdAt: number;
};

// Table info types
type OrgsTableInfo = GenericTableInfo & {
  document: Org;
  fieldPaths: keyof Org;
  indexes: {
    by_kind: ["kind"];
  };
};

type ProjectsTableInfo = GenericTableInfo & {
  document: Project;
  fieldPaths: keyof Project;
  indexes: {
    by_org: ["orgId"];
    by_status: ["orgId", "status"];
    by_client: ["clientOrgId"];
  };
};

type TradesTableInfo = GenericTableInfo & {
  document: Trade;
  fieldPaths: keyof Trade;
  indexes: {
    by_code: ["code"];
    by_active: ["isActive"];
  };
};

type WorkersTableInfo = GenericTableInfo & {
  document: Worker;
  fieldPaths: keyof Worker;
  indexes: {
    by_org: ["orgId"];
    by_email: ["orgId", "email"];
    by_status: ["orgId", "status"];
    by_trade: ["tradeId"];
  };
};

type WorkPackagesTableInfo = GenericTableInfo & {
  document: WorkPackage;
  fieldPaths: keyof WorkPackage;
  indexes: {
    by_project: ["projectId"];
    by_org: ["orgId"];
    by_project_phase: ["projectId", "phaseId"];
    by_trade: ["tradeId"];
  };
};

type WorkerAssignmentsTableInfo = GenericTableInfo & {
  document: WorkerAssignment;
  fieldPaths: keyof WorkerAssignment;
  indexes: {
    by_project: ["projectId"];
    by_worker: ["workerId"];
    by_project_worker: ["projectId", "workerId"];
  };
};

// Data model
export type DataModel = GenericDataModel & {
  orgs: OrgsTableInfo;
  projects: ProjectsTableInfo;
  trades: TradesTableInfo;
  workers: WorkersTableInfo;
  workPackages: WorkPackagesTableInfo;
  workerAssignments: WorkerAssignmentsTableInfo;
};
