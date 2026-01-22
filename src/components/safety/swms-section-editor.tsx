"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SWMS_SECTION_TYPES, SWMS_SECTION_LABELS, type SwmsSectionType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";

// Section data structure matching schema
export interface SwmsSection {
  id: string;
  type: SwmsSectionType;
  title: string;
  content: unknown;
  order: number;
}

// Helper to generate unique IDs
function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Default content structures for each section type
function getDefaultContent(type: SwmsSectionType): unknown {
  switch (type) {
    case "title":
      return { text: "", projectName: "", location: "", date: "" };
    case "activity":
      return { description: "" };
    case "ppe":
      return { items: [] as string[] };
    case "hazards":
      return [] as Array<{ description: string; hazards: string[]; controls: string[] }>;
    case "controls":
      return [] as Array<{ description: string; hazards: string[]; controls: string[] }>;
    case "plant":
      return [] as Array<{ equipment: string; purpose: string; requirements: string[] }>;
    case "hazmat":
      return [] as Array<{ material: string; hazards: string[]; controls: string[] }>;
    case "permits":
      return { items: [] as string[] };
    case "training":
      return { items: [] as string[] };
    case "emergency":
      return { procedure: "", contacts: "", assemblyPoint: "" };
    case "legislation":
      return { acts: [] as string[], standards: [] as string[], codes: [] as string[] };
    case "hrcw":
      return { items: [] as string[], activities: "" };
    case "supervision":
      return { requirements: "", supervisorName: "", qualifications: "" };
    default:
      return {};
  }
}

// Individual section content editor based on type
interface SectionContentEditorProps {
  type: SwmsSectionType;
  content: unknown;
  onChange: (content: unknown) => void;
}

function SectionContentEditor({ type, content, onChange }: SectionContentEditorProps) {
  // Helper to safely get object field
  const getField = (field: string): string => {
    if (typeof content === "object" && content !== null) {
      const value = (content as Record<string, unknown>)[field];
      return typeof value === "string" ? value : "";
    }
    return "";
  };

  // Helper to safely get array field
  const getArrayField = (field: string): string[] => {
    if (typeof content === "object" && content !== null) {
      const value = (content as Record<string, unknown>)[field];
      return Array.isArray(value) ? value.map(String) : [];
    }
    return [];
  };

  // Helper to update object field
  const updateField = (field: string, value: string) => {
    onChange({ ...(content as Record<string, unknown> || {}), [field]: value });
  };

  // Helper to update array field
  const updateArrayField = (field: string, values: string[]) => {
    onChange({ ...(content as Record<string, unknown> || {}), [field]: values });
  };

  // Render array items editor
  const renderArrayEditor = (field: string, placeholder: string) => {
    const items = getArrayField(field);
    return (
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx] = e.target.value;
                updateArrayField(field, newItems);
              }}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newItems = items.filter((_, i) => i !== idx);
                updateArrayField(field, newItems);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateArrayField(field, [...items, ""])}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
    );
  };

  switch (type) {
    case "title":
      return (
        <div className="space-y-4">
          <div>
            <Label>SWMS Title</Label>
            <Input
              value={getField("text")}
              onChange={(e) => updateField("text", e.target.value)}
              placeholder="e.g., Working at Heights SWMS"
            />
          </div>
          <div>
            <Label>Project Name</Label>
            <Input
              value={getField("projectName")}
              onChange={(e) => updateField("projectName", e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={getField("location")}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Site location"
            />
          </div>
        </div>
      );

    case "activity":
      return (
        <div>
          <Label>Scope of Work Description</Label>
          <Textarea
            value={getField("description")}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe the work activity covered by this SWMS..."
            rows={4}
          />
        </div>
      );

    case "ppe":
    case "permits":
    case "training":
      return (
        <div>
          <Label>
            {type === "ppe" && "Required PPE Items"}
            {type === "permits" && "Required Permits"}
            {type === "training" && "Required Training/Qualifications"}
          </Label>
          {renderArrayEditor("items", `Add ${type === "ppe" ? "PPE item" : type === "permits" ? "permit" : "training requirement"}...`)}
        </div>
      );

    case "hazards":
    case "controls":
      const hazardRows = Array.isArray(content) ? content : [];
      return (
        <div className="space-y-3">
          <Label>Task Hazards & Controls</Label>
          {hazardRows.map((row, idx) => {
            const rowData = typeof row === "object" && row !== null ? row as Record<string, unknown> : {};
            return (
              <Card key={idx} className="p-3">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <Label className="text-xs">Task/Step</Label>
                      <Input
                        value={String(rowData.description || "")}
                        onChange={(e) => {
                          const newRows = [...hazardRows];
                          newRows[idx] = { ...rowData, description: e.target.value };
                          onChange(newRows);
                        }}
                        placeholder="Describe the task or step..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChange(hazardRows.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Hazards</Label>
                    <Textarea
                      value={Array.isArray(rowData.hazards) ? rowData.hazards.join("\n") : ""}
                      onChange={(e) => {
                        const newRows = [...hazardRows];
                        newRows[idx] = { ...rowData, hazards: e.target.value.split("\n").filter(Boolean) };
                        onChange(newRows);
                      }}
                      placeholder="One hazard per line..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Controls</Label>
                    <Textarea
                      value={Array.isArray(rowData.controls) ? rowData.controls.join("\n") : ""}
                      onChange={(e) => {
                        const newRows = [...hazardRows];
                        newRows[idx] = { ...rowData, controls: e.target.value.split("\n").filter(Boolean) };
                        onChange(newRows);
                      }}
                      placeholder="One control measure per line..."
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...hazardRows, { description: "", hazards: [], controls: [] }])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>
      );

    case "plant":
      const plantItems = Array.isArray(content) ? content : [];
      return (
        <div className="space-y-3">
          <Label>Plant & Equipment</Label>
          {plantItems.map((item, idx) => {
            const itemData = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
            return (
              <Card key={idx} className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <Label className="text-xs">Equipment Name</Label>
                      <Input
                        value={String(itemData.equipment || "")}
                        onChange={(e) => {
                          const newItems = [...plantItems];
                          newItems[idx] = { ...itemData, equipment: e.target.value };
                          onChange(newItems);
                        }}
                        placeholder="Equipment name..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChange(plantItems.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Purpose</Label>
                    <Input
                      value={String(itemData.purpose || "")}
                      onChange={(e) => {
                        const newItems = [...plantItems];
                        newItems[idx] = { ...itemData, purpose: e.target.value };
                        onChange(newItems);
                      }}
                      placeholder="What is it used for..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Requirements (one per line)</Label>
                    <Textarea
                      value={Array.isArray(itemData.requirements) ? itemData.requirements.join("\n") : ""}
                      onChange={(e) => {
                        const newItems = [...plantItems];
                        newItems[idx] = { ...itemData, requirements: e.target.value.split("\n").filter(Boolean) };
                        onChange(newItems);
                      }}
                      placeholder="Operator requirements, prestart checks..."
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...plantItems, { equipment: "", purpose: "", requirements: [] }])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Equipment
          </Button>
        </div>
      );

    case "hazmat":
      const hazmatItems = Array.isArray(content) ? content : [];
      return (
        <div className="space-y-3">
          <Label>Hazardous Materials</Label>
          {hazmatItems.map((item, idx) => {
            const itemData = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
            return (
              <Card key={idx} className="p-3 border-amber-200 bg-amber-50">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <Label className="text-xs">Material Name</Label>
                      <Input
                        value={String(itemData.material || "")}
                        onChange={(e) => {
                          const newItems = [...hazmatItems];
                          newItems[idx] = { ...itemData, material: e.target.value };
                          onChange(newItems);
                        }}
                        placeholder="Material name..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChange(hazmatItems.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Hazards (one per line)</Label>
                    <Textarea
                      value={Array.isArray(itemData.hazards) ? itemData.hazards.join("\n") : ""}
                      onChange={(e) => {
                        const newItems = [...hazmatItems];
                        newItems[idx] = { ...itemData, hazards: e.target.value.split("\n").filter(Boolean) };
                        onChange(newItems);
                      }}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Controls (one per line)</Label>
                    <Textarea
                      value={Array.isArray(itemData.controls) ? itemData.controls.join("\n") : ""}
                      onChange={(e) => {
                        const newItems = [...hazmatItems];
                        newItems[idx] = { ...itemData, controls: e.target.value.split("\n").filter(Boolean) };
                        onChange(newItems);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...hazmatItems, { material: "", hazards: [], controls: [] }])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Material
          </Button>
        </div>
      );

    case "emergency":
      return (
        <div className="space-y-4">
          <div>
            <Label>Emergency Procedure</Label>
            <Textarea
              value={getField("procedure")}
              onChange={(e) => updateField("procedure", e.target.value)}
              placeholder="Describe emergency procedures..."
              rows={3}
            />
          </div>
          <div>
            <Label>Emergency Contacts</Label>
            <Textarea
              value={getField("contacts")}
              onChange={(e) => updateField("contacts", e.target.value)}
              placeholder="Emergency contact numbers..."
              rows={2}
            />
          </div>
          <div>
            <Label>Assembly Point</Label>
            <Input
              value={getField("assemblyPoint")}
              onChange={(e) => updateField("assemblyPoint", e.target.value)}
              placeholder="Emergency assembly location..."
            />
          </div>
        </div>
      );

    case "legislation":
      return (
        <div className="space-y-4">
          <div>
            <Label>Applicable Acts</Label>
            {renderArrayEditor("acts", "e.g., Work Health and Safety Act 2011")}
          </div>
          <div>
            <Label>Applicable Standards</Label>
            {renderArrayEditor("standards", "e.g., AS/NZS 1891.4")}
          </div>
          <div>
            <Label>Codes of Practice</Label>
            {renderArrayEditor("codes", "e.g., Managing the Risk of Falls at Workplaces")}
          </div>
        </div>
      );

    case "hrcw":
      return (
        <div className="space-y-4">
          <div>
            <Label>High Risk Construction Work Activities</Label>
            {renderArrayEditor("items", "e.g., Work at height greater than 2m")}
          </div>
          <div>
            <Label>Additional Details</Label>
            <Textarea
              value={getField("activities")}
              onChange={(e) => updateField("activities", e.target.value)}
              placeholder="Additional HRCW details..."
              rows={3}
            />
          </div>
        </div>
      );

    case "supervision":
      return (
        <div className="space-y-4">
          <div>
            <Label>Supervision Requirements</Label>
            <Textarea
              value={getField("requirements")}
              onChange={(e) => updateField("requirements", e.target.value)}
              placeholder="Describe supervision requirements..."
              rows={3}
            />
          </div>
          <div>
            <Label>Supervisor Name</Label>
            <Input
              value={getField("supervisorName")}
              onChange={(e) => updateField("supervisorName", e.target.value)}
              placeholder="Designated supervisor..."
            />
          </div>
          <div>
            <Label>Qualifications/Competencies</Label>
            <Input
              value={getField("qualifications")}
              onChange={(e) => updateField("qualifications", e.target.value)}
              placeholder="Required qualifications..."
            />
          </div>
        </div>
      );

    default:
      return (
        <div>
          <Label>Content</Label>
          <Textarea
            value={typeof content === "string" ? content : JSON.stringify(content, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder="Section content..."
            rows={4}
          />
        </div>
      );
  }
}

// Section types not yet added to template
interface AddSectionProps {
  existingTypes: SwmsSectionType[];
  onAdd: (type: SwmsSectionType) => void;
}

function AddSectionSelect({ existingTypes, onAdd }: AddSectionProps) {
  const [selectedType, setSelectedType] = React.useState<SwmsSectionType | "">("");

  const availableTypes = SWMS_SECTION_TYPES.filter(t => !existingTypes.includes(t));

  if (availableTypes.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        All section types have been added
      </p>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label className="text-sm">Add Section</Label>
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as SwmsSectionType)}>
          <SelectTrigger>
            <SelectValue placeholder="Select section type..." />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map(type => (
              <SelectItem key={type} value={type}>
                {SWMS_SECTION_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        onClick={() => {
          if (selectedType) {
            onAdd(selectedType);
            setSelectedType("");
          }
        }}
        disabled={!selectedType}
      >
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
    </div>
  );
}

// Main section editor component
interface SWMSSectionEditorProps {
  sections: SwmsSection[];
  onChange: (sections: SwmsSection[]) => void;
  className?: string;
}

export function SWMSSectionEditor({ sections, onChange, className }: SWMSSectionEditorProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addSection = (type: SwmsSectionType) => {
    const newSection: SwmsSection = {
      id: generateId(),
      type,
      title: SWMS_SECTION_LABELS[type],
      content: getDefaultContent(type),
      order: sections.length + 1,
    };
    onChange([...sections, newSection]);
    // Auto-expand the new section
    setExpandedSections(prev => new Set([...prev, newSection.id]));
  };

  const updateSection = (id: string, updates: Partial<SwmsSection>) => {
    onChange(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id: string) => {
    const filtered = sections.filter(s => s.id !== id);
    // Re-order remaining sections
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(reordered);
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const newSections = [...sections];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];

    // Update order values
    const reordered = newSections.map((s, i) => ({ ...s, order: i + 1 }));
    onChange(reordered);
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const existingTypes = sections.map(s => s.type);

  return (
    <div className={cn("space-y-4", className)}>
      {sortedSections.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No sections added yet. Add sections to build your SWMS template.</p>
        </Card>
      ) : (
        sortedSections.map((section, idx) => {
          const isExpanded = expandedSections.has(section.id);
          const label = SWMS_SECTION_LABELS[section.type] || section.type;

          return (
            <Collapsible
              key={section.id}
              open={isExpanded}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer min-h-[56px]">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <span className="font-medium">{section.title || label}</span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">
                        {section.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(section.id, "up");
                        }}
                        disabled={idx === 0}
                      >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(section.id, "down");
                        }}
                        disabled={idx === sortedSections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 border-t">
                    <div className="pt-4 space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title..."
                        />
                      </div>
                      <SectionContentEditor
                        type={section.type}
                        content={section.content}
                        onChange={(content) => updateSection(section.id, { content })}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })
      )}

      <Card className="p-4">
        <AddSectionSelect existingTypes={existingTypes} onAdd={addSection} />
      </Card>
    </div>
  );
}

// Quick add all recommended sections
export function getRecommendedSections(): SwmsSection[] {
  const recommendedTypes: SwmsSectionType[] = [
    "title",
    "activity",
    "hazards",
    "controls",
    "ppe",
    "plant",
    "emergency",
    "supervision",
  ];

  return recommendedTypes.map((type, idx) => ({
    id: generateId(),
    type,
    title: SWMS_SECTION_LABELS[type],
    content: getDefaultContent(type),
    order: idx + 1,
  }));
}

// Hook for managing section state
export function useSWMSSections(initialSections: SwmsSection[] = []) {
  const [sections, setSections] = React.useState<SwmsSection[]>(initialSections);

  const addRecommendedSections = React.useCallback(() => {
    setSections(getRecommendedSections());
  }, []);

  const reset = React.useCallback(() => {
    setSections([]);
  }, []);

  return {
    sections,
    setSections,
    addRecommendedSections,
    reset,
  };
}
