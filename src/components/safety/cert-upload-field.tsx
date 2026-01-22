"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, AlertCircle, AlertTriangle, Check } from "lucide-react";

interface CertificationData {
  certNumber: string;
  expiryDate: string; // ISO date string
  frontPhoto: string | null; // Base64 data URL
  backPhoto: string | null; // Base64 data URL (optional)
}

interface CertUploadFieldProps {
  certificationTypeId: string;
  certificationTypeName: string;
  required?: boolean;
  value?: CertificationData;
  onChange?: (data: CertificationData) => void;
  className?: string;
  disabled?: boolean;
  expiryWarningDays?: number;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function CertUploadField({
  certificationTypeName,
  required = false,
  value,
  onChange,
  className,
  disabled = false,
  expiryWarningDays = 30,
}: CertUploadFieldProps) {
  const [data, setData] = React.useState<CertificationData>(
    value ?? {
      certNumber: "",
      expiryDate: "",
      frontPhoto: null,
      backPhoto: null,
    }
  );

  const frontInputRef = React.useRef<HTMLInputElement>(null);
  const backInputRef = React.useRef<HTMLInputElement>(null);

  // Sync with controlled value
  React.useEffect(() => {
    if (value) {
      setData(value);
    }
  }, [value]);

  const updateData = (updates: Partial<CertificationData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onChange?.(newData);
  };

  const handlePhotoCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Photo must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (side === "front") {
        updateData({ frontPhoto: dataUrl });
      } else {
        updateData({ backPhoto: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (side: "front" | "back") => {
    if (side === "front") {
      updateData({ frontPhoto: null });
    } else {
      updateData({ backPhoto: null });
    }
  };

  // Validation
  const validation = React.useMemo<ValidationResult>(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (required) {
      if (!data.certNumber.trim()) {
        errors.push("Certificate number is required");
      }
      if (!data.expiryDate) {
        errors.push("Expiry date is required");
      }
      if (!data.frontPhoto) {
        errors.push("Front photo is required");
      }
    }

    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiry < today) {
        errors.push("Certification has expired");
      } else {
        const warningDate = new Date(today);
        warningDate.setDate(warningDate.getDate() + expiryWarningDays);

        if (expiry <= warningDate) {
          const daysUntilExpiry = Math.ceil(
            (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          warnings.push(`Expiring in ${daysUntilExpiry} days`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }, [data, required, expiryWarningDays]);

  const hasAnyData =
    data.certNumber || data.expiryDate || data.frontPhoto || data.backPhoto;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-4",
        validation.valid && hasAnyData && "border-green-200 bg-green-50/30",
        !validation.valid && hasAnyData && "border-red-200 bg-red-50/30",
        !hasAnyData && "border-gray-200 bg-white",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{certificationTypeName}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
        {validation.valid && hasAnyData && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            Complete
          </span>
        )}
      </div>

      {/* Cert Number */}
      <div className="space-y-2">
        <Label htmlFor="certNumber">Certificate Number</Label>
        <Input
          id="certNumber"
          value={data.certNumber}
          onChange={(e) => updateData({ certNumber: e.target.value })}
          placeholder="Enter certificate number"
          disabled={disabled}
        />
      </div>

      {/* Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="date"
          value={data.expiryDate}
          onChange={(e) => updateData({ expiryDate: e.target.value })}
          disabled={disabled}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* Photo uploads */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front photo */}
        <div className="space-y-2">
          <Label>Front Photo {required && <span className="text-red-500">*</span>}</Label>
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePhotoCapture(e, "front")}
            disabled={disabled}
            className="hidden"
          />
          {data.frontPhoto ? (
            <div className="relative group">
              <img
                src={data.frontPhoto}
                alt="Front of certificate"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removePhoto("front")}
                disabled={disabled}
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => frontInputRef.current?.click()}
              disabled={disabled}
              className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
            >
              <Camera className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">Front</span>
            </Button>
          )}
        </div>

        {/* Back photo */}
        <div className="space-y-2">
          <Label>Back Photo (Optional)</Label>
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePhotoCapture(e, "back")}
            disabled={disabled}
            className="hidden"
          />
          {data.backPhoto ? (
            <div className="relative group">
              <img
                src={data.backPhoto}
                alt="Back of certificate"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removePhoto("back")}
                disabled={disabled}
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => backInputRef.current?.click()}
              disabled={disabled}
              className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">Back</span>
            </Button>
          )}
        </div>
      </div>

      {/* Validation messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={`error-${index}`} className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ))}
          {validation.warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="flex items-center gap-1 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook to manage multiple certifications
export interface CertificationEntry {
  certificationTypeId: string;
  certificationTypeName: string;
  required: boolean;
  data: CertificationData;
}

export function useCertificationUploads(
  requiredTypes: Array<{ id: string; name: string; required?: boolean }>
) {
  const [entries, setEntries] = React.useState<CertificationEntry[]>(() =>
    requiredTypes.map((type) => ({
      certificationTypeId: type.id,
      certificationTypeName: type.name,
      required: type.required ?? true,
      data: {
        certNumber: "",
        expiryDate: "",
        frontPhoto: null,
        backPhoto: null,
      },
    }))
  );

  const updateEntry = React.useCallback(
    (certificationTypeId: string, data: CertificationData) => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.certificationTypeId === certificationTypeId ? { ...entry, data } : entry
        )
      );
    },
    []
  );

  const validate = React.useCallback((): { valid: boolean; invalidIds: string[] } => {
    const invalidIds: string[] = [];

    for (const entry of entries) {
      if (entry.required) {
        const { data } = entry;
        const hasErrors =
          !data.certNumber.trim() ||
          !data.expiryDate ||
          !data.frontPhoto ||
          (data.expiryDate && new Date(data.expiryDate) < new Date());

        if (hasErrors) {
          invalidIds.push(entry.certificationTypeId);
        }
      }
    }

    return {
      valid: invalidIds.length === 0,
      invalidIds,
    };
  }, [entries]);

  const allComplete = React.useMemo(() => {
    return entries.every((entry) => {
      if (!entry.required) return true;
      const { data } = entry;
      return (
        data.certNumber.trim() &&
        data.expiryDate &&
        data.frontPhoto &&
        new Date(data.expiryDate) >= new Date()
      );
    });
  }, [entries]);

  return {
    entries,
    updateEntry,
    validate,
    allComplete,
  };
}

// Validation helper
export function validateCertification(
  data: CertificationData,
  required: boolean,
  expiryWarningDays = 30
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (required) {
    if (!data.certNumber.trim()) errors.push("Certificate number required");
    if (!data.expiryDate) errors.push("Expiry date required");
    if (!data.frontPhoto) errors.push("Photo evidence required");
  }

  if (data.expiryDate) {
    const expiry = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiry < today) {
      errors.push("Certification expired");
    } else {
      const warningDate = new Date(today);
      warningDate.setDate(warningDate.getDate() + expiryWarningDays);
      if (expiry <= warningDate) {
        warnings.push("Certification expiring soon");
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
