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

// ===================
// R2 SAFETY MODULE TYPES
// ===================

export type CertificationType = GenericDocument & {
  orgId: GenericId<"orgs">;
  name: string;
  code: string;
  category: "license" | "ticket" | "training" | "medical" | "other";
  description?: string;
  validityDays?: number;
  expiryWarningDays: number;
  isRequiredOrgwide: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CompetencyRecord = GenericDocument & {
  orgId: GenericId<"orgs">;
  workerId: GenericId<"workers">;
  certificationTypeId: GenericId<"certificationTypes">;
  certNumber: string;
  issuer?: string;
  issueDate?: number;
  expiryDate?: number;
  frontPhotoId?: GenericId<"_storage">;
  backPhotoId?: GenericId<"_storage">;
  status: "pending" | "verified" | "rejected" | "expired";
  verifiedBy?: GenericId<"workers">;
  verifiedAt?: number;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
};

export type SWMSTemplate = GenericDocument & {
  orgId: GenericId<"orgs">;
  name: string;
  description?: string;
  sections: Array<{
    id: string;
    type: "title" | "activity" | "ppe" | "hazards" | "controls" | "plant" | "hazmat" | "permits" | "training" | "emergency" | "legislation" | "hrcw" | "supervision";
    title: string;
    content: any;
    order: number;
  }>;
  status: "draft" | "published" | "archived";
  version: number;
  previousVersionId?: GenericId<"swmsTemplates">;
  createdBy: GenericId<"workers">;
  createdAt: number;
  updatedAt: number;
};

export type SWMSDocument = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId: GenericId<"projects">;
  templateId?: GenericId<"swmsTemplates">;
  swmsNumber: string;
  title: string;
  revision: number;
  status: "draft" | "pending_review" | "approved" | "expired" | "archived";
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: any;
    order: number;
  }>;
  createdBy: GenericId<"workers">;
  submittedAt?: number;
  submittedBy?: GenericId<"workers">;
  approvedAt?: number;
  approvedBy?: GenericId<"workers">;
  expiresAt?: number;
  shareCode?: string;
  createdAt: number;
  updatedAt: number;
};

export type PermitType = GenericDocument & {
  orgId: GenericId<"orgs">;
  name: string;
  code: string;
  description?: string;
  requiredFields: Array<{
    id: string;
    label: string;
    type: "text" | "textarea" | "number" | "select" | "multiselect" | "date" | "yesno" | "checkbox";
    required: boolean;
    options?: string[];
  }>;
  defaultValidityHours: number;
  riskLevel: "low" | "medium" | "high";
  checklistTemplateId?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type PermitInstance = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId: GenericId<"projects">;
  permitTypeId: GenericId<"permitTypes">;
  permitNumber: string;
  status: "draft" | "submitted" | "approved" | "active" | "suspended" | "closed" | "expired" | "rejected" | "cancelled";
  applicantId: GenericId<"workers">;
  applicantName?: string;
  applicantCompany?: string;
  workDescription: string;
  location: string;
  formData?: any;
  requestedStartAt: number;
  requestedEndAt: number;
  validFrom?: number;
  validTo?: number;
  submittedAt?: number;
  approvedAt?: number;
  approvedBy?: GenericId<"workers">;
  approvalSignatureData?: string;
  rejectedBy?: GenericId<"workers">;
  rejectionReason?: string;
  activatedAt?: number;
  suspendedAt?: number;
  suspendReason?: string;
  closedAt?: number;
  closedBy?: GenericId<"workers">;
  closureNotes?: string;
  expiredAt?: number;
  cancelledAt?: number;
  checklistInstanceId?: string;
  createdAt: number;
  updatedAt: number;
};

export type IncidentReport = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId: GenericId<"projects">;
  incidentNumber: string;
  incidentType: "injury" | "near_miss" | "property_damage" | "environmental" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "under_investigation" | "closed";
  description: string;
  location: string;
  date: number;
  reportedBy: GenericId<"workers">;
  reportedAt: number;
  workerId?: GenericId<"workers">;
  investigatorId?: GenericId<"workers">;
  witnesses?: Array<{ name: string; contact?: string }>;
  investigationNotes?: string;
  rootCause?: string;
  correctiveActions?: string[];
  injuryDetails?: {
    natureOfInjury?: string;
    bodyLocation?: string;
    treatmentRequired?: boolean;
  };
  attachmentIds?: GenericId<"_storage">[];
  involvedAssetIds?: string[];
  checklistInstanceId?: string;
  createdAt: number;
  updatedAt: number;
};

export type InductionType = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId?: GenericId<"projects">;
  name: string;
  description?: string;
  scope: "company" | "site" | "task" | "plant";
  steps: Array<{
    id: string;
    type: "info" | "video" | "quiz" | "acknowledgement" | "document_upload" | "photo_capture";
    title: string;
    content?: any;
    required: boolean;
    order: number;
  }>;
  requiredCertificationTypeIds?: GenericId<"certificationTypes">[];
  validityDays?: number;
  version: number;
  previousVersionId?: GenericId<"inductionTypes">;
  isActive: boolean;
  createdBy: GenericId<"workers">;
  createdAt: number;
  updatedAt: number;
};

export type InductionInvite = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId: GenericId<"projects">;
  inductionTypeId: GenericId<"inductionTypes">;
  shareCode: string;
  status: "pending" | "awaiting_review" | "completed";
  targetEmail?: string;
  targetName?: string;
  createdBy: GenericId<"workers">;
  expiresAt?: number;
  completedAt?: number;
  completionId?: GenericId<"inductionCompletions">;
  createdAt: number;
  updatedAt: number;
};

export type InductionCompletion = GenericDocument & {
  orgId: GenericId<"orgs">;
  projectId?: GenericId<"projects">;
  inductionTypeId: GenericId<"inductionTypes">;
  workerId?: GenericId<"workers">;
  inviteId?: GenericId<"inductionInvites">;
  status: "pending" | "in_progress" | "awaiting_review" | "completed" | "expired" | "superseded";
  profile?: {
    fullName: string;
    email: string;
    phone?: string;
    trade?: string;
    employer?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: "Spouse" | "Parent" | "Sibling" | "Other";
  };
  responses?: any;
  certificationUploads?: Array<{
    certificationTypeId: GenericId<"certificationTypes">;
    certNumber: string;
    expiryDate?: number;
    frontPhotoId?: GenericId<"_storage">;
    backPhotoId?: GenericId<"_storage">;
  }>;
  signatureData?: string;
  signatureHash?: string;
  signedAt?: number;
  startedAt?: number;
  submittedAt?: number;
  completedAt?: number;
  expiresAt?: number;
  reviewedBy?: GenericId<"workers">;
  reviewedAt?: number;
  returnReason?: string;
  auditLog?: Array<{
    actorId?: GenericId<"workers">;
    action: string;
    timestamp: number;
    comment?: string;
  }>;
  createdAt: number;
  updatedAt: number;
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

// R2 Safety Module Table Info Types
type CertificationTypesTableInfo = GenericTableInfo & {
  document: CertificationType;
  fieldPaths: keyof CertificationType;
  indexes: {
    by_org: ["orgId"];
    by_org_code: ["orgId", "code"];
    by_org_active: ["orgId", "isActive"];
  };
};

type CompetencyRecordsTableInfo = GenericTableInfo & {
  document: CompetencyRecord;
  fieldPaths: keyof CompetencyRecord;
  indexes: {
    by_org: ["orgId"];
    by_worker: ["workerId"];
    by_cert_type: ["certificationTypeId"];
    by_worker_cert: ["workerId", "certificationTypeId"];
    by_status: ["orgId", "status"];
    by_expiry: ["expiryDate"];
  };
};

type SWMSTemplatesTableInfo = GenericTableInfo & {
  document: SWMSTemplate;
  fieldPaths: keyof SWMSTemplate;
  indexes: {
    by_org: ["orgId"];
    by_org_status: ["orgId", "status"];
  };
};

type SWMSDocumentsTableInfo = GenericTableInfo & {
  document: SWMSDocument;
  fieldPaths: keyof SWMSDocument;
  indexes: {
    by_org: ["orgId"];
    by_project: ["projectId"];
    by_project_status: ["projectId", "status"];
    by_shareCode: ["shareCode"];
    by_swmsNumber: ["projectId", "swmsNumber"];
  };
};

type PermitTypesTableInfo = GenericTableInfo & {
  document: PermitType;
  fieldPaths: keyof PermitType;
  indexes: {
    by_org: ["orgId"];
    by_org_code: ["orgId", "code"];
    by_org_active: ["orgId", "isActive"];
  };
};

type PermitInstancesTableInfo = GenericTableInfo & {
  document: PermitInstance;
  fieldPaths: keyof PermitInstance;
  indexes: {
    by_org: ["orgId"];
    by_project: ["projectId"];
    by_project_status: ["projectId", "status"];
    by_permit_type: ["permitTypeId"];
    by_applicant: ["applicantId"];
    by_permitNumber: ["projectId", "permitNumber"];
    by_validTo: ["validTo"];
  };
};

type IncidentReportsTableInfo = GenericTableInfo & {
  document: IncidentReport;
  fieldPaths: keyof IncidentReport;
  indexes: {
    by_org: ["orgId"];
    by_project: ["projectId"];
    by_project_status: ["projectId", "status"];
    by_project_type: ["projectId", "incidentType"];
    by_severity: ["projectId", "severity"];
    by_reporter: ["reportedBy"];
    by_date: ["projectId", "date"];
    by_incidentNumber: ["projectId", "incidentNumber"];
  };
};

type InductionTypesTableInfo = GenericTableInfo & {
  document: InductionType;
  fieldPaths: keyof InductionType;
  indexes: {
    by_org: ["orgId"];
    by_org_scope: ["orgId", "scope"];
    by_project: ["projectId"];
    by_org_active: ["orgId", "isActive"];
  };
};

type InductionInvitesTableInfo = GenericTableInfo & {
  document: InductionInvite;
  fieldPaths: keyof InductionInvite;
  indexes: {
    by_org: ["orgId"];
    by_project: ["projectId"];
    by_shareCode: ["shareCode"];
    by_status: ["projectId", "status"];
  };
};

type InductionCompletionsTableInfo = GenericTableInfo & {
  document: InductionCompletion;
  fieldPaths: keyof InductionCompletion;
  indexes: {
    by_org: ["orgId"];
    by_project: ["projectId"];
    by_worker: ["workerId"];
    by_type: ["inductionTypeId"];
    by_worker_type: ["workerId", "inductionTypeId"];
    by_status: ["orgId", "status"];
    by_invite: ["inviteId"];
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
  // R2 Safety Module
  certificationTypes: CertificationTypesTableInfo;
  competencyRecords: CompetencyRecordsTableInfo;
  swmsTemplates: SWMSTemplatesTableInfo;
  swmsDocuments: SWMSDocumentsTableInfo;
  permitTypes: PermitTypesTableInfo;
  permitInstances: PermitInstancesTableInfo;
  incidentReports: IncidentReportsTableInfo;
  inductionTypes: InductionTypesTableInfo;
  inductionInvites: InductionInvitesTableInfo;
  inductionCompletions: InductionCompletionsTableInfo;
};
