// Safety module shared components
// Phase 4 of R2 Safety Core implementation

// Signature capture for SWMS signing and induction completion
export {
  SignatureCanvas,
  isSignatureEmpty,
  dataUrlToBlob,
} from "./signature-canvas";

// SWMS document sections viewer with collapsible sections
export {
  SWMSSectionsViewer,
  useSwmsSectionsControl,
  type SwmsSection,
} from "./swms-sections-viewer";

// Permit status badge (9-state lifecycle)
export {
  PermitStatusBadge,
  permitRequiresAction,
  isPermitTerminal,
  getPermitTransitions,
} from "./permit-status-badge";

// Incident severity badge (low/medium/high/critical)
export {
  IncidentSeverityBadge,
  isHighPriority,
  getSeverityLevel,
  sortBySeverity,
} from "./incident-severity-badge";

// Induction wizard step indicator (5 steps)
export {
  InductionStepIndicator,
  useInductionSteps,
} from "./induction-step-indicator";

// SWMS acknowledgement checkboxes
export {
  AcknowledgementCheckboxes,
  useAcknowledgements,
  validateAcknowledgements,
} from "./acknowledgement-checkboxes";

// Induction content block renderer (6 block types)
export {
  ContentBlockRenderer,
  areAllBlocksComplete,
  useContentBlockResponses,
  type ContentBlock,
  type BlockResponse,
  type InfoBlockData,
  type VideoBlockData,
  type QuizBlockData,
  type AcknowledgementBlockData,
  type DocumentUploadBlockData,
  type PhotoCaptureBlockData,
} from "./content-block-renderer";

// Certification upload field for induction tickets step
export {
  CertUploadField,
  useCertificationUploads,
  validateCertification,
  type CertificationEntry,
} from "./cert-upload-field";

// Safety modules card with live counts for project dashboard
export { SafetyModulesCard } from "./safety-modules-card";
