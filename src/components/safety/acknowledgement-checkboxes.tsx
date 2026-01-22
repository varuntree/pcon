"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Standard SWMS acknowledgement labels
const DEFAULT_ACKNOWLEDGEMENTS = [
  {
    id: "hazards",
    label: "I acknowledge the hazards identified in this SWMS",
    required: true,
  },
  {
    id: "controls",
    label: "I understand and will follow the control measures outlined",
    required: true,
  },
  {
    id: "ppe",
    label: "I will use the required Personal Protective Equipment (PPE)",
    required: true,
  },
];

interface Acknowledgement {
  id: string;
  label: string;
  required?: boolean;
}

interface AcknowledgementCheckboxesProps {
  acknowledgements?: Acknowledgement[];
  checkedIds?: string[];
  onCheckedChange?: (checkedIds: string[]) => void;
  className?: string;
  disabled?: boolean;
  showRequired?: boolean;
}

export function AcknowledgementCheckboxes({
  acknowledgements = DEFAULT_ACKNOWLEDGEMENTS,
  checkedIds: controlledCheckedIds,
  onCheckedChange,
  className,
  disabled = false,
  showRequired = true,
}: AcknowledgementCheckboxesProps) {
  const [internalCheckedIds, setInternalCheckedIds] = React.useState<string[]>([]);

  const checkedIds = controlledCheckedIds ?? internalCheckedIds;
  const checkedSet = new Set(checkedIds);

  const handleCheckChange = (id: string, checked: boolean) => {
    const newCheckedIds = checked
      ? [...checkedIds, id]
      : checkedIds.filter((checkedId) => checkedId !== id);

    if (onCheckedChange) {
      onCheckedChange(newCheckedIds);
    } else {
      setInternalCheckedIds(newCheckedIds);
    }
  };

  const allChecked = acknowledgements
    .filter((ack) => ack.required !== false)
    .every((ack) => checkedSet.has(ack.id));

  return (
    <div className={cn("space-y-4", className)}>
      {acknowledgements.map((ack) => (
        <div
          key={ack.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
            checkedSet.has(ack.id)
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-200 hover:border-gray-300",
            disabled && "opacity-60"
          )}
        >
          <Checkbox
            id={`ack-${ack.id}`}
            checked={checkedSet.has(ack.id)}
            onCheckedChange={(checked) => handleCheckChange(ack.id, checked === true)}
            disabled={disabled}
            className="mt-0.5 min-w-[20px] min-h-[20px]"
          />
          <Label
            htmlFor={`ack-${ack.id}`}
            className={cn(
              "text-sm leading-relaxed cursor-pointer select-none",
              disabled && "cursor-not-allowed"
            )}
          >
            {ack.label}
            {showRequired && ack.required !== false && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
        </div>
      ))}
      {!allChecked && showRequired && (
        <p className="text-sm text-gray-500">
          * All acknowledgements are required before signing
        </p>
      )}
    </div>
  );
}

// Hook to manage acknowledgement state
export function useAcknowledgements(
  acknowledgements: Acknowledgement[] = DEFAULT_ACKNOWLEDGEMENTS
) {
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);

  const requiredIds = acknowledgements
    .filter((ack) => ack.required !== false)
    .map((ack) => ack.id);

  const allRequiredChecked = requiredIds.every((id) => checkedIds.includes(id));

  const isChecked = React.useCallback(
    (id: string) => checkedIds.includes(id),
    [checkedIds]
  );

  const check = React.useCallback((id: string) => {
    setCheckedIds((prev) => [...new Set([...prev, id])]);
  }, []);

  const uncheck = React.useCallback((id: string) => {
    setCheckedIds((prev) => prev.filter((checkedId) => checkedId !== id));
  }, []);

  const toggle = React.useCallback((id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((checkedId) => checkedId !== id) : [...prev, id]
    );
  }, []);

  const reset = React.useCallback(() => {
    setCheckedIds([]);
  }, []);

  const checkAll = React.useCallback(() => {
    setCheckedIds(acknowledgements.map((ack) => ack.id));
  }, [acknowledgements]);

  return {
    checkedIds,
    setCheckedIds,
    allRequiredChecked,
    isChecked,
    check,
    uncheck,
    toggle,
    reset,
    checkAll,
  };
}

// Validation helper
export function validateAcknowledgements(
  checkedIds: string[],
  acknowledgements: Acknowledgement[] = DEFAULT_ACKNOWLEDGEMENTS
): { valid: boolean; missingIds: string[] } {
  const requiredIds = acknowledgements
    .filter((ack) => ack.required !== false)
    .map((ack) => ack.id);

  const checkedSet = new Set(checkedIds);
  const missingIds = requiredIds.filter((id) => !checkedSet.has(id));

  return {
    valid: missingIds.length === 0,
    missingIds,
  };
}
