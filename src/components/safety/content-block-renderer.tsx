"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Info,
  Video,
  FileQuestion,
  CheckSquare,
  Upload,
  Camera,
  Play,
  Pause,
  AlertCircle,
} from "lucide-react";
import type { InductionBlockType } from "@/lib/constants";

// Content block data structures
export interface InfoBlockData {
  title?: string;
  body: string;
  imageUrl?: string;
}

export interface VideoBlockData {
  title?: string;
  videoUrl: string;
  requiredWatchPercent?: number; // Default 100
}

export interface QuizBlockData {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface AcknowledgementBlockData {
  acknowledgementText: string;
}

export interface DocumentUploadBlockData {
  uploadLabel: string;
  uploadRequired?: boolean;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

export interface PhotoCaptureBlockData {
  captureLabel: string;
  captureRequired?: boolean;
  maxPhotos?: number;
}

export interface ContentBlock {
  id: string;
  type: InductionBlockType;
  title: string;
  content:
    | InfoBlockData
    | VideoBlockData
    | QuizBlockData
    | AcknowledgementBlockData
    | DocumentUploadBlockData
    | PhotoCaptureBlockData;
  order: number;
}

// Response types
export interface BlockResponse {
  blockId: string;
  completed: boolean;
  data?: unknown;
}

// Individual block renderers
interface BlockProps {
  block: ContentBlock;
  response?: BlockResponse;
  onResponseChange: (response: BlockResponse) => void;
  disabled?: boolean;
}

function InfoBlock({ block, response, onResponseChange }: BlockProps) {
  const data = block.content as InfoBlockData;

  // Info blocks are auto-completed when rendered
  React.useEffect(() => {
    if (!response?.completed) {
      onResponseChange({ blockId: block.id, completed: true });
    }
  }, [block.id, response, onResponseChange]);

  return (
    <div className="space-y-4">
      {data.title && <h4 className="font-medium text-lg">{data.title}</h4>}
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: data.body }}
      />
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt={data.title || "Content image"}
          className="rounded-lg max-w-full h-auto"
        />
      )}
    </div>
  );
}

function VideoBlock({ block, response, onResponseChange, disabled }: BlockProps) {
  const data = block.content as VideoBlockData;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [maxProgress, setMaxProgress] = React.useState(0);
  const requiredPercent = data.requiredWatchPercent ?? 100;

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentPercent = (video.currentTime / video.duration) * 100;
    setProgress(currentPercent);

    // Track max progress (prevent skipping forward)
    if (currentPercent > maxProgress) {
      setMaxProgress(currentPercent);
    }

    // Check completion
    if (maxProgress >= requiredPercent && !response?.completed) {
      onResponseChange({
        blockId: block.id,
        completed: true,
        data: { watchedPercent: maxProgress },
      });
    }
  };

  const handleSeek = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentPercent = (video.currentTime / video.duration) * 100;

    // Prevent seeking forward beyond max watched
    if (currentPercent > maxProgress + 1) {
      video.currentTime = (maxProgress / 100) * video.duration;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isCompleted = maxProgress >= requiredPercent;

  return (
    <div className="space-y-4">
      {data.title && <h4 className="font-medium text-lg">{data.title}</h4>}
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={data.videoUrl}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeek}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              disabled={disabled}
              className="text-white hover:text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-white text-sm">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
      {!isCompleted && (
        <p className="text-sm text-amber-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Watch at least {requiredPercent}% to continue
        </p>
      )}
    </div>
  );
}

function QuizBlock({ block, response, onResponseChange, disabled }: BlockProps) {
  const data = block.content as QuizBlockData;
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(
    (response?.data as { selectedIndex?: number })?.selectedIndex ?? null
  );
  const [showResult, setShowResult] = React.useState(false);

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setShowResult(true);

    const isCorrect = selectedIndex === data.correctIndex;
    onResponseChange({
      blockId: block.id,
      completed: isCorrect,
      data: { selectedIndex, isCorrect },
    });
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setShowResult(false);
  };

  const isCorrect = selectedIndex === data.correctIndex;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-lg">{data.question}</h4>
      <div className="space-y-2">
        {data.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(index)}
            disabled={disabled || showResult}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors",
              selectedIndex === index && !showResult && "border-[var(--color-accent)] bg-orange-50",
              showResult && index === data.correctIndex && "border-green-500 bg-green-50",
              showResult && selectedIndex === index && !isCorrect && "border-red-500 bg-red-50",
              !showResult && selectedIndex !== index && "border-gray-200 hover:border-gray-300",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {!showResult ? (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIndex === null || disabled}
        >
          Submit Answer
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          {isCorrect ? (
            <p className="text-green-600 font-medium">Correct!</p>
          ) : (
            <>
              <p className="text-red-600 font-medium">Incorrect. Try again.</p>
              <Button type="button" variant="outline" onClick={handleRetry}>
                Retry
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AcknowledgementBlock({ block, response, onResponseChange, disabled }: BlockProps) {
  const data = block.content as AcknowledgementBlockData;
  const isChecked = response?.completed ?? false;

  const handleChange = (checked: boolean) => {
    onResponseChange({
      blockId: block.id,
      completed: checked,
      data: { acknowledged: checked },
    });
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors",
        isChecked ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
      )}
    >
      <Checkbox
        id={`ack-${block.id}`}
        checked={isChecked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <Label
        htmlFor={`ack-${block.id}`}
        className={cn("text-sm leading-relaxed cursor-pointer", disabled && "cursor-not-allowed")}
      >
        {data.acknowledgementText}
      </Label>
    </div>
  );
}

function DocumentUploadBlock({ block, response, onResponseChange, disabled }: BlockProps) {
  const data = block.content as DocumentUploadBlockData;
  const [files, setFiles] = React.useState<File[]>(
    (response?.data as { files?: File[] })?.files ?? []
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  const acceptTypes = data.acceptedTypes?.join(",") || ".pdf,.doc,.docx,.jpg,.jpeg,.png";
  const maxSize = (data.maxSizeMB || 10) * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.size <= maxSize);

    if (validFiles.length !== selectedFiles.length) {
      alert(`Some files exceeded the ${data.maxSizeMB || 10}MB limit`);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);

    const isComplete = !data.uploadRequired || newFiles.length > 0;
    onResponseChange({
      blockId: block.id,
      completed: isComplete,
      data: { files: newFiles, fileNames: newFiles.map((f) => f.name) },
    });
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    const isComplete = !data.uploadRequired || newFiles.length > 0;
    onResponseChange({
      blockId: block.id,
      completed: isComplete,
      data: { files: newFiles, fileNames: newFiles.map((f) => f.name) },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-gray-500" />
        <span className="font-medium">{data.uploadLabel}</span>
        {data.uploadRequired && <span className="text-red-500">*</span>}
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        multiple
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="min-h-[44px]"
      >
        <Upload className="h-4 w-4 mr-2" />
        Select Files
      </Button>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoCaptureBlock({ block, response, onResponseChange, disabled }: BlockProps) {
  const data = block.content as PhotoCaptureBlockData;
  const [photos, setPhotos] = React.useState<string[]>(
    (response?.data as { photos?: string[] })?.photos ?? []
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const maxPhotos = data.maxPhotos || 5;

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (photos.length >= maxPhotos) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhotos((prev) => {
          if (prev.length >= maxPhotos) return prev;
          const newPhotos = [...prev, dataUrl];

          const isComplete = !data.captureRequired || newPhotos.length > 0;
          onResponseChange({
            blockId: block.id,
            completed: isComplete,
            data: { photos: newPhotos },
          });

          return newPhotos;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    const isComplete = !data.captureRequired || newPhotos.length > 0;
    onResponseChange({
      blockId: block.id,
      completed: isComplete,
      data: { photos: newPhotos },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-gray-500" />
        <span className="font-medium">{data.captureLabel}</span>
        {data.captureRequired && <span className="text-red-500">*</span>}
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={disabled || photos.length >= maxPhotos}
        className="hidden"
      />

      {photos.length < maxPhotos && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="min-h-[44px]"
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo ({photos.length}/{maxPhotos})
        </Button>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Captured ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePhoto(index)}
                disabled={disabled}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Block type icons
const BLOCK_ICONS: Record<InductionBlockType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  video: Video,
  quiz: FileQuestion,
  acknowledgement: CheckSquare,
  document_upload: Upload,
  photo_capture: Camera,
};

// Main renderer component
interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  responses?: BlockResponse[];
  onResponsesChange?: (responses: BlockResponse[]) => void;
  className?: string;
  disabled?: boolean;
}

export function ContentBlockRenderer({
  blocks,
  responses: controlledResponses,
  onResponsesChange,
  className,
  disabled = false,
}: ContentBlockRendererProps) {
  const [internalResponses, setInternalResponses] = React.useState<BlockResponse[]>([]);

  const responses = controlledResponses ?? internalResponses;
  const responseMap = new Map(responses.map((r) => [r.blockId, r]));

  const handleResponseChange = (response: BlockResponse) => {
    const newResponses = [
      ...responses.filter((r) => r.blockId !== response.blockId),
      response,
    ];

    if (onResponsesChange) {
      onResponsesChange(newResponses);
    } else {
      setInternalResponses(newResponses);
    }
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const renderBlock = (block: ContentBlock) => {
    const response = responseMap.get(block.id);
    const props: BlockProps = { block, response, onResponseChange: handleResponseChange, disabled };

    switch (block.type) {
      case "info":
        return <InfoBlock {...props} />;
      case "video":
        return <VideoBlock {...props} />;
      case "quiz":
        return <QuizBlock {...props} />;
      case "acknowledgement":
        return <AcknowledgementBlock {...props} />;
      case "document_upload":
        return <DocumentUploadBlock {...props} />;
      case "photo_capture":
        return <PhotoCaptureBlock {...props} />;
      default:
        return <div>Unknown block type</div>;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {sortedBlocks.map((block) => {
        const Icon = BLOCK_ICONS[block.type];
        const response = responseMap.get(block.id);

        return (
          <div
            key={block.id}
            className={cn(
              "border rounded-lg p-4 transition-colors",
              response?.completed ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-white"
            )}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <Icon className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium">{block.title}</h3>
              {response?.completed && (
                <span className="ml-auto text-green-600 text-sm">✓ Complete</span>
              )}
            </div>
            {renderBlock(block)}
          </div>
        );
      })}
    </div>
  );
}

// Helper to check if all required blocks are complete
export function areAllBlocksComplete(
  blocks: ContentBlock[],
  responses: BlockResponse[]
): boolean {
  const responseMap = new Map(responses.map((r) => [r.blockId, r]));
  return blocks.every((block) => {
    const response = responseMap.get(block.id);
    return response?.completed === true;
  });
}

// Hook to manage content block responses
export function useContentBlockResponses(blocks: ContentBlock[]) {
  const [responses, setResponses] = React.useState<BlockResponse[]>([]);

  const responseMap = React.useMemo(
    () => new Map(responses.map((r) => [r.blockId, r])),
    [responses]
  );

  const isBlockComplete = React.useCallback(
    (blockId: string) => responseMap.get(blockId)?.completed === true,
    [responseMap]
  );

  const allComplete = React.useMemo(
    () => blocks.every((block) => responseMap.get(block.id)?.completed === true),
    [blocks, responseMap]
  );

  const completedCount = responses.filter((r) => r.completed).length;
  const progress = blocks.length > 0 ? (completedCount / blocks.length) * 100 : 0;

  return {
    responses,
    setResponses,
    isBlockComplete,
    allComplete,
    completedCount,
    progress,
  };
}
