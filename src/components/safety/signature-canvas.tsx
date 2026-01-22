"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eraser, Undo2 } from "lucide-react";

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onSignatureChange?: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function SignatureCanvas({
  width = 300,
  height = 150,
  className,
  onSignatureChange,
  disabled = false,
}: SignatureCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [history, setHistory] = React.useState<ImageData[]>([]);

  const getContext = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  const getCoordinates = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const saveState = React.useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-9), imageData]); // Keep last 10 states
  }, [getContext]);

  const startDrawing = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      saveState();
      const ctx = getContext();
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    },
    [disabled, getCoordinates, getContext, saveState]
  );

  const draw = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      const ctx = getContext();
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    },
    [isDrawing, disabled, getCoordinates, getContext]
  );

  const stopDrawing = React.useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (canvas && onSignatureChange) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, onSignatureChange]);

  const clearCanvas = React.useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setHistory([]);
    onSignatureChange?.(null);
  }, [getContext, onSignatureChange]);

  const undo = React.useCallback(() => {
    if (history.length === 0) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const prevState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(prevState, 0, 0);

    // Check if canvas is empty after undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every((val, idx) => idx % 4 === 3 ? val === 0 : true);
    if (isEmpty) {
      setHasSignature(false);
      onSignatureChange?.(null);
    } else {
      onSignatureChange?.(canvas.toDataURL("image/png"));
    }
  }, [history, getContext, onSignatureChange]);

  // Prevent scrolling while drawing on touch devices
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      canvas.removeEventListener("touchmove", preventScroll);
    };
  }, [isDrawing]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg overflow-hidden",
          disabled ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white",
          hasSignature && "border-solid border-[var(--color-accent)]"
        )}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            "touch-none w-full",
            disabled ? "cursor-not-allowed" : "cursor-crosshair"
          )}
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">Sign here</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={disabled || history.length === 0}
          className="min-w-[44px] min-h-[44px]"
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={disabled || !hasSignature}
          className="min-w-[44px] min-h-[44px]"
        >
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}

// Utility function to check if a signature is empty
export function isSignatureEmpty(dataUrl: string | null): boolean {
  return !dataUrl || dataUrl === "";
}

// Utility function to get PNG blob from canvas data URL
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}
