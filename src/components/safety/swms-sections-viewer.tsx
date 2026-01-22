"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SWMS_SECTION_LABELS, type SwmsSectionType } from "@/lib/constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Section data structure matching schema
export interface SwmsSection {
  id: string;
  type: SwmsSectionType;
  content: unknown;
  order: number;
}

// Content renderers for different section types
interface SectionContentProps {
  content: unknown;
  type: SwmsSectionType;
}

function SectionContent({ content, type }: SectionContentProps) {
  if (!content) {
    return <p className="text-gray-500 italic">No content specified</p>;
  }

  // Render based on section type
  switch (type) {
    case "title":
    case "activity":
    case "emergency":
    case "supervision":
      // Text-based sections
      if (typeof content === "string") {
        return <div className="whitespace-pre-wrap">{content}</div>;
      }
      if (typeof content === "object" && content !== null) {
        const obj = content as Record<string, unknown>;
        return (
          <div className="space-y-2">
            {Object.entries(obj).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium capitalize">{key.replace(/_/g, " ")}: </span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        );
      }
      return <div>{String(content)}</div>;

    case "ppe":
    case "training":
    case "permits":
    case "hrcw":
      // Array-based sections
      if (Array.isArray(content)) {
        return (
          <ul className="list-disc list-inside space-y-1">
            {content.map((item, idx) => (
              <li key={idx}>{String(item)}</li>
            ))}
          </ul>
        );
      }
      return <div>{String(content)}</div>;

    case "hazards":
    case "controls":
      // Table-based sections with tasks/hazards/controls
      if (Array.isArray(content)) {
        return (
          <div className="space-y-4">
            {content.map((item, idx) => {
              if (typeof item === "object" && item !== null) {
                const row = item as Record<string, unknown>;
                const description = row.description ? String(row.description) : null;
                const hazards = Array.isArray(row.hazards) ? (row.hazards as string[]).join(", ") : null;
                const controls = Array.isArray(row.controls) ? (row.controls as string[]).join(", ") : null;
                return (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    {description && (
                      <div className="font-medium mb-2">{description}</div>
                    )}
                    {hazards && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Hazards: </span>
                        <span>{hazards}</span>
                      </div>
                    )}
                    {controls && (
                      <div>
                        <span className="text-sm text-gray-600">Controls: </span>
                        <span>{controls}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return <div key={idx}>{String(item)}</div>;
            })}
          </div>
        );
      }
      return <div>{String(content)}</div>;

    case "plant":
      // Plant & Equipment section
      if (Array.isArray(content)) {
        return (
          <div className="space-y-3">
            {content.map((item, idx) => {
              if (typeof item === "object" && item !== null) {
                const plant = item as Record<string, unknown>;
                const name = String(plant.equipment || plant.name || `Item ${idx + 1}`);
                const purpose = plant.purpose ? String(plant.purpose) : null;
                const requirements = Array.isArray(plant.requirements) ? (plant.requirements as string[]).join(", ") : null;
                return (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium">{name}</div>
                    {purpose && (
                      <div className="text-sm text-gray-600">Purpose: {purpose}</div>
                    )}
                    {requirements && (
                      <div className="text-sm mt-1">
                        <span className="text-gray-600">Requirements: </span>
                        {requirements}
                      </div>
                    )}
                  </div>
                );
              }
              return <div key={idx}>{String(item)}</div>;
            })}
          </div>
        );
      }
      return <div>{String(content)}</div>;

    case "hazmat":
      // Hazardous Materials section
      if (Array.isArray(content)) {
        return (
          <div className="space-y-3">
            {content.map((item, idx) => {
              if (typeof item === "object" && item !== null) {
                const mat = item as Record<string, unknown>;
                const name = String(mat.material || mat.name || `Material ${idx + 1}`);
                const hazards = Array.isArray(mat.hazards) ? (mat.hazards as string[]).join(", ") : null;
                const controls = Array.isArray(mat.controls) ? (mat.controls as string[]).join(", ") : null;
                return (
                  <div key={idx} className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                    <div className="font-medium text-amber-900">{name}</div>
                    {hazards && (
                      <div className="text-sm mt-1">
                        <span className="text-amber-700">Hazards: </span>
                        {hazards}
                      </div>
                    )}
                    {controls && (
                      <div className="text-sm mt-1">
                        <span className="text-amber-700">Controls: </span>
                        {controls}
                      </div>
                    )}
                  </div>
                );
              }
              return <div key={idx}>{String(item)}</div>;
            })}
          </div>
        );
      }
      return <div>{String(content)}</div>;

    case "legislation":
      // Legislation section with acts, standards, codes
      if (typeof content === "object" && content !== null) {
        const leg = content as Record<string, unknown>;
        const acts = Array.isArray(leg.acts) ? (leg.acts as string[]) : [];
        const standards = Array.isArray(leg.standards) ? (leg.standards as string[]) : [];
        const codes = Array.isArray(leg.codes) ? (leg.codes as string[]) : [];
        return (
          <div className="space-y-3">
            {acts.length > 0 && (
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Acts</div>
                <ul className="list-disc list-inside">
                  {acts.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
            {standards.length > 0 && (
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Standards</div>
                <ul className="list-disc list-inside">
                  {standards.map((std, idx) => (
                    <li key={idx}>{std}</li>
                  ))}
                </ul>
              </div>
            )}
            {codes.length > 0 && (
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Codes of Practice</div>
                <ul className="list-disc list-inside">
                  {codes.map((code, idx) => (
                    <li key={idx}>{code}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }
      return <div>{String(content)}</div>;

    default:
      // Fallback for unknown types
      if (typeof content === "string") {
        return <div className="whitespace-pre-wrap">{content}</div>;
      }
      return <pre className="text-sm overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
  }
}

interface SWMSSectionsViewerProps {
  sections: SwmsSection[];
  className?: string;
  defaultExpanded?: boolean;
  expandedSections?: string[];
  onSectionToggle?: (sectionId: string, isOpen: boolean) => void;
}

export function SWMSSectionsViewer({
  sections,
  className,
  defaultExpanded = false,
  expandedSections: controlledExpanded,
  onSectionToggle,
}: SWMSSectionsViewerProps) {
  const [internalExpanded, setInternalExpanded] = React.useState<Set<string>>(() => {
    if (defaultExpanded) {
      return new Set(sections.map((s) => s.id));
    }
    return new Set();
  });

  const expandedSet = controlledExpanded
    ? new Set(controlledExpanded)
    : internalExpanded;

  const handleToggle = (sectionId: string, isOpen: boolean) => {
    if (onSectionToggle) {
      onSectionToggle(sectionId, isOpen);
    } else {
      setInternalExpanded((prev) => {
        const next = new Set(prev);
        if (isOpen) {
          next.add(sectionId);
        } else {
          next.delete(sectionId);
        }
        return next;
      });
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  if (sections.length === 0) {
    return (
      <div className={cn("text-gray-500 text-center py-8", className)}>
        No sections available
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sortedSections.map((section) => {
        const isOpen = expandedSet.has(section.id);
        const label = SWMS_SECTION_LABELS[section.type] || section.type;

        return (
          <Collapsible
            key={section.id}
            open={isOpen}
            onOpenChange={(open) => handleToggle(section.id, open)}
          >
            <div className="border rounded-lg bg-white overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[44px]">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500 shrink-0" />
                  )}
                  <span className="font-medium text-left">{label}</span>
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {section.type}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0 border-t">
                  <div className="pt-4">
                    <SectionContent content={section.content} type={section.type} />
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

// Utility to expand/collapse all sections
export function useSwmsSectionsControl(sections: SwmsSection[]) {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const expandAll = React.useCallback(() => {
    setExpanded(sections.map((s) => s.id));
  }, [sections]);

  const collapseAll = React.useCallback(() => {
    setExpanded([]);
  }, []);

  const toggleSection = React.useCallback((sectionId: string, isOpen: boolean) => {
    setExpanded((prev) =>
      isOpen ? [...prev, sectionId] : prev.filter((id) => id !== sectionId)
    );
  }, []);

  return {
    expanded,
    expandAll,
    collapseAll,
    toggleSection,
  };
}
