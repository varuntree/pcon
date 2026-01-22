"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Type,
  Hash,
  Calendar,
  Clock,
  CheckSquare,
  List,
  Camera,
  PenTool,
  Paperclip,
  Info,
  MessageSquare,
  AlertTriangle,
  ToggleLeft,
} from "lucide-react";
import type { ChecklistSection, ChecklistField, ChecklistFieldType } from "@/hooks/use-checklist-templates";

const FIELD_TYPES: { value: ChecklistFieldType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Short Text", icon: <Type className="h-4 w-4" /> },
  { value: "textarea", label: "Long Text", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { value: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { value: "time", label: "Time", icon: <Clock className="h-4 w-4" /> },
  { value: "datetime", label: "Date & Time", icon: <Calendar className="h-4 w-4" /> },
  { value: "yesno", label: "Yes/No", icon: <ToggleLeft className="h-4 w-4" /> },
  { value: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { value: "select", label: "Dropdown", icon: <List className="h-4 w-4" /> },
  { value: "multiselect", label: "Multi-Select", icon: <List className="h-4 w-4" /> },
  { value: "photo", label: "Photo", icon: <Camera className="h-4 w-4" /> },
  { value: "signature", label: "Signature", icon: <PenTool className="h-4 w-4" /> },
  { value: "attachment", label: "Attachment", icon: <Paperclip className="h-4 w-4" /> },
  { value: "instruction", label: "Instruction", icon: <Info className="h-4 w-4" /> },
  { value: "notes", label: "Notes", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "action_trigger", label: "Action Trigger", icon: <AlertTriangle className="h-4 w-4" /> },
];

interface ChecklistSectionEditorProps {
  sections: ChecklistSection[];
  onChange: (sections: ChecklistSection[]) => void;
}

export function ChecklistSectionEditor({ sections, onChange }: ChecklistSectionEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleField = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const addSection = () => {
    const newSection: ChecklistSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length + 1,
      fields: [],
    };
    onChange([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  };

  const updateSection = (sectionId: string, updates: Partial<ChecklistSection>) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    );
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((s) => s.id !== sectionId));
  };

  const addField = (sectionId: string, fieldType: ChecklistFieldType) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newField: ChecklistField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: `New ${FIELD_TYPES.find((t) => t.value === fieldType)?.label || "Field"}`,
      required: false,
      order: section.fields.length + 1,
    };

    // Add default options for select/multiselect
    if (fieldType === "select" || fieldType === "multiselect") {
      newField.options = ["Option 1", "Option 2"];
    }

    // Add default config for photo
    if (fieldType === "photo") {
      newField.maxPhotos = 5;
    }

    // Add default config for signature
    if (fieldType === "signature") {
      newField.signatureConfig = {
        label: "Signature",
        role: "Worker",
        required: true,
      };
    }

    // Add default config for action trigger
    if (fieldType === "action_trigger") {
      newField.actionTrigger = {
        triggerWhen: "no",
        actionTitle: "Follow-up action required",
        actionPriority: "medium",
      };
    }

    updateSection(sectionId, {
      fields: [...section.fields, newField],
    });

    setExpandedFields(new Set([...expandedFields, newField.id]));
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<ChecklistField>) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      fields: section.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const removeField = (sectionId: string, fieldId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      fields: section.fields.filter((f) => f.id !== fieldId),
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });
    onChange(newSections);
  };

  const moveField = (sectionId: string, fieldIndex: number, direction: "up" | "down") => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newFields = [...section.fields];
    const targetIndex = direction === "up" ? fieldIndex - 1 : fieldIndex + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
    newFields.forEach((f, i) => {
      f.order = i + 1;
    });
    updateSection(sectionId, { fields: newFields });
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No sections yet. Add a section to start building your checklist.</p>
          <Button onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <>
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, sectionIndex) => (
              <Card key={section.id} className="border-l-4 border-l-[var(--color-accent)]">
                <Collapsible
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 text-left">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <span className="text-sm text-gray-500">
                            ({section.fields.length} fields)
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSection(sectionIndex, "up")}
                          disabled={sectionIndex === 0}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(section.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Section Title Edit */}
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title"
                        />
                      </div>

                      {/* Fields List */}
                      <div className="space-y-2">
                        <Label>Fields</Label>
                        {section.fields.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No fields in this section</p>
                        ) : (
                          <div className="space-y-2">
                            {section.fields
                              .sort((a, b) => a.order - b.order)
                              .map((field, fieldIndex) => (
                                <FieldEditor
                                  key={field.id}
                                  field={field}
                                  isExpanded={expandedFields.has(field.id)}
                                  onToggle={() => toggleField(field.id)}
                                  onUpdate={(updates) => updateField(section.id, field.id, updates)}
                                  onRemove={() => removeField(section.id, field.id)}
                                  onMoveUp={() => moveField(section.id, fieldIndex, "up")}
                                  onMoveDown={() => moveField(section.id, fieldIndex, "down")}
                                  canMoveUp={fieldIndex > 0}
                                  canMoveDown={fieldIndex < section.fields.length - 1}
                                  allFields={section.fields}
                                />
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Add Field */}
                      <div className="pt-2 border-t">
                        <Label>Add Field</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {FIELD_TYPES.map((fieldType) => (
                            <Button
                              key={fieldType.value}
                              variant="outline"
                              size="sm"
                              onClick={() => addField(section.id, fieldType.value)}
                              className="flex items-center gap-1"
                            >
                              {fieldType.icon}
                              <span className="text-xs">{fieldType.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

          <Button onClick={addSection} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </>
      )}
    </div>
  );
}

interface FieldEditorProps {
  field: ChecklistField;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ChecklistField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  allFields: ChecklistField[];
}

function FieldEditor({
  field,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  allFields,
}: FieldEditorProps) {
  const fieldTypeInfo = FIELD_TYPES.find((t) => t.value === field.type);

  return (
    <div className="border rounded-lg bg-gray-50">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center justify-between p-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left flex-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="text-gray-500">{fieldTypeInfo?.icon}</span>
              <span className="font-medium text-sm">{field.label}</span>
              {field.required && (
                <span className="text-red-500 text-xs">*</span>
              )}
              <span className="text-xs text-gray-400 ml-auto mr-2">
                {fieldTypeInfo?.label}
              </span>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-7 w-7"
            >
              <ChevronDown className="h-3 w-3 rotate-180" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-7 w-7"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-7 w-7 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* Label */}
            <div>
              <Label>Label</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Field label"
              />
            </div>

            {/* Required */}
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked: boolean) => onUpdate({ required: checked })}
              />
              <Label>Required</Label>
            </div>

            {/* Help Text */}
            <div>
              <Label>Help Text (optional)</Label>
              <Input
                value={field.helpText || ""}
                onChange={(e) => onUpdate({ helpText: e.target.value || undefined })}
                placeholder="Additional instructions for this field"
              />
            </div>

            {/* Type-specific options */}
            {(field.type === "text" || field.type === "textarea") && (
              <>
                <div>
                  <Label>Placeholder</Label>
                  <Input
                    value={field.placeholder || ""}
                    onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
                    placeholder="Placeholder text"
                  />
                </div>
                {field.type === "textarea" && (
                  <div>
                    <Label>Rows</Label>
                    <Input
                      type="number"
                      value={field.rows || 3}
                      onChange={(e) => onUpdate({ rows: parseInt(e.target.value) || 3 })}
                      min={2}
                      max={10}
                    />
                  </div>
                )}
                <div>
                  <Label>Max Length</Label>
                  <Input
                    type="number"
                    value={field.maxLength || ""}
                    onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) || undefined })}
                    placeholder="No limit"
                  />
                </div>
              </>
            )}

            {field.type === "number" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={field.min ?? ""}
                    onChange={(e) => onUpdate({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="No min"
                  />
                </div>
                <div>
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={field.max ?? ""}
                    onChange={(e) => onUpdate({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="No max"
                  />
                </div>
              </div>
            )}

            {(field.type === "select" || field.type === "multiselect") && (
              <div>
                <Label>Options (one per line)</Label>
                <Textarea
                  value={(field.options || []).join("\n")}
                  onChange={(e) =>
                    onUpdate({
                      options: e.target.value.split("\n").filter((o) => o.trim()),
                    })
                  }
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
            )}

            {field.type === "photo" && (
              <div>
                <Label>Max Photos</Label>
                <Input
                  type="number"
                  value={field.maxPhotos || 5}
                  onChange={(e) => onUpdate({ maxPhotos: parseInt(e.target.value) || 5 })}
                  min={1}
                  max={20}
                />
              </div>
            )}

            {field.type === "signature" && (
              <div className="space-y-2">
                <div>
                  <Label>Signature Label</Label>
                  <Input
                    value={field.signatureConfig?.label || "Signature"}
                    onChange={(e) =>
                      onUpdate({
                        signatureConfig: {
                          ...field.signatureConfig!,
                          label: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={field.signatureConfig?.role || "Worker"}
                    onChange={(e) =>
                      onUpdate({
                        signatureConfig: {
                          ...field.signatureConfig!,
                          role: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Worker, Supervisor"
                  />
                </div>
              </div>
            )}

            {field.type === "instruction" && (
              <div>
                <Label>Instruction Text</Label>
                <Textarea
                  value={field.helpText || ""}
                  onChange={(e) => onUpdate({ helpText: e.target.value })}
                  placeholder="Enter instruction text to display..."
                  rows={3}
                />
              </div>
            )}

            {field.type === "action_trigger" && (
              <div className="space-y-2">
                <div>
                  <Label>Trigger When Answer Is</Label>
                  <Select
                    value={field.actionTrigger?.triggerWhen || "no"}
                    onValueChange={(value) =>
                      onUpdate({
                        actionTrigger: {
                          ...field.actionTrigger!,
                          triggerWhen: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Action Title</Label>
                  <Input
                    value={field.actionTrigger?.actionTitle || ""}
                    onChange={(e) =>
                      onUpdate({
                        actionTrigger: {
                          ...field.actionTrigger!,
                          actionTitle: e.target.value,
                        },
                      })
                    }
                    placeholder="Follow-up action title"
                  />
                </div>
                <div>
                  <Label>Action Priority</Label>
                  <Select
                    value={field.actionTrigger?.actionPriority || "medium"}
                    onValueChange={(value) =>
                      onUpdate({
                        actionTrigger: {
                          ...field.actionTrigger!,
                          actionPriority: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Conditional Logic */}
            {field.type !== "instruction" && allFields.length > 1 && (
              <div className="pt-2 border-t">
                <Label>Conditional Logic (optional)</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Show or hide this field based on another field&apos;s value
                </p>
                <ConditionalLogicEditor
                  field={field}
                  allFields={allFields}
                  onUpdate={onUpdate}
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface ConditionalLogicEditorProps {
  field: ChecklistField;
  allFields: ChecklistField[];
  onUpdate: (updates: Partial<ChecklistField>) => void;
}

function ConditionalLogicEditor({ field, allFields, onUpdate }: ConditionalLogicEditorProps) {
  const condition = field.conditions?.[0];
  const otherFields = allFields.filter((f) => f.id !== field.id && f.type !== "instruction");

  const handleToggle = (enabled: boolean) => {
    if (enabled && otherFields.length > 0) {
      onUpdate({
        conditions: [{
          triggerFieldId: otherFields[0].id,
          operator: "equals",
          value: "",
          action: "show",
        }],
      });
    } else {
      onUpdate({ conditions: undefined });
    }
  };

  const updateCondition = (updates: Partial<NonNullable<ChecklistField["conditions"]>[0]>) => {
    if (!condition) return;
    onUpdate({
      conditions: [{ ...condition, ...updates }],
    });
  };

  if (otherFields.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Switch
          checked={!!condition}
          onCheckedChange={handleToggle}
        />
        <span className="text-sm">Enable conditional logic</span>
      </div>

      {condition && (
        <div className="grid grid-cols-4 gap-2">
          <Select
            value={condition.action}
            onValueChange={(value: "show" | "hide") => updateCondition({ action: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show</SelectItem>
              <SelectItem value="hide">Hide</SelectItem>
            </SelectContent>
          </Select>

          <span className="flex items-center text-sm text-gray-500">when</span>

          <Select
            value={condition.triggerFieldId}
            onValueChange={(value) => updateCondition({ triggerFieldId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {otherFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={String(condition.value || "")}
            onChange={(e) => updateCondition({ value: e.target.value })}
            placeholder="equals"
          />
        </div>
      )}
    </div>
  );
}

export function getDefaultChecklistSections(): ChecklistSection[] {
  return [
    {
      id: "section-default-1",
      title: "General Information",
      order: 1,
      fields: [
        {
          id: "field-default-1",
          type: "text",
          label: "Location",
          required: true,
          order: 1,
          placeholder: "Enter location",
        },
        {
          id: "field-default-2",
          type: "datetime",
          label: "Date & Time",
          required: true,
          order: 2,
        },
      ],
    },
    {
      id: "section-default-2",
      title: "Inspection Items",
      order: 2,
      fields: [
        {
          id: "field-default-3",
          type: "yesno",
          label: "Item condition satisfactory?",
          required: true,
          order: 1,
        },
        {
          id: "field-default-4",
          type: "notes",
          label: "Additional notes",
          required: false,
          order: 2,
          rows: 3,
        },
      ],
    },
    {
      id: "section-default-3",
      title: "Sign-off",
      order: 3,
      fields: [
        {
          id: "field-default-5",
          type: "signature",
          label: "Inspector Signature",
          required: true,
          order: 1,
          signatureConfig: {
            label: "Inspector Signature",
            role: "Inspector",
            required: true,
          },
        },
      ],
    },
  ];
}
