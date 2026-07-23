// src/components/ui/dropzone.tsx
import * as React from "react";

interface DropzoneProps {
  children: ({ isDragActive }: { isDragActive: boolean }) => React.ReactNode;
  onFileChange: (files: FileList) => void;
  className?: string;
}

export const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  ({ className, children, onFileChange }, ref) => {
    const [isDragActive, setIsDragActive] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileChange(e.dataTransfer.files);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onFileChange(e.target.files);
      }
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-dashed border-[var(--mk-border-strong)] bg-[var(--mk-bg-secondary)] transition hover:border-[var(--mk-primary)] hover:bg-[var(--mk-hover)] ${className ?? ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        {children({ isDragActive })}
      </div>
    );
  }
);
Dropzone.displayName = "Dropzone";