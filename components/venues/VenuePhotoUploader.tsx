"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type VenuePhotoUploaderProps = {
  /** Existing photo URLs (edit mode). Omit for create mode. */
  existing?: string[];
  onExistingChange?: (urls: string[]) => void;
  /** Newly selected files, not yet uploaded. */
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export default function VenuePhotoUploader({
  existing = [],
  onExistingChange,
  files,
  onFilesChange,
}: VenuePhotoUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Object URLs for previewing the newly selected files.
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, WebP and GIF images are allowed.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each image must be 5MB or smaller.");
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      onFilesChange([...files, ...accepted]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function removeExisting(url: string) {
    onExistingChange?.(existing.filter((u) => u !== url));
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  const hasPhotos = existing.length > 0 || files.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Photos</span>

      {/* Drag-and-drop / click-to-select area */}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center transition focus-within:ring-2 focus-within:ring-foreground ${
          dragActive
            ? "border-foreground bg-neutral-100 dark:bg-neutral-800"
            : "border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <span className="text-sm font-medium text-foreground">
          Drag &amp; drop images here, or click to select
        </span>
        <span className="text-xs text-neutral-500">
          JPEG, PNG, WebP or GIF — up to 5MB each
        </span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            // Reset so selecting the same file again re-triggers change.
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Previews */}
      {hasPhotos && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existing.map((url) => (
            <li
              key={url}
              className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800"
            >
              <Image
                src={url}
                alt="Venue photo"
                fill
                unoptimized
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-black/80"
              >
                ✕
              </button>
            </li>
          ))}

          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800"
            >
              <Image
                src={previews[index]}
                alt={`New photo: ${file.name}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                New
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-black/80"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
