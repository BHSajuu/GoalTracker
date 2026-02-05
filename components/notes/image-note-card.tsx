"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, X, Maximize2, PencilIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import Image from "next/image";

interface ImageNoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "image" | "text" | "link";
    content?: string;
    images?: string[];
    imageUrls?: string[];
    createdAt: number;
  };
}

export function ImageNoteCard({ note }: ImageNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const imagesToDisplay = note.imageUrls && note.imageUrls.length > 0
    ? note.imageUrls
    : note.content ? [note.content] : [];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! + 1) % imagesToDisplay.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! - 1 + imagesToDisplay.length) % imagesToDisplay.length);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, imagesToDisplay.length]);

  // Grid logic: 1 image = full, 2 = half/half, 3+ = grid
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    return "grid-cols-2"; // 3+ shows as 2 cols grid
  };

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/30 transition-all mb-4 break-inside-avoid">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Image src="/img.png" alt="Image" width={24} height={24} className="opacity-80" />
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {imagesToDisplay.length > 0 ? (
            <div className={`grid ${getGridClass(imagesToDisplay.length)} gap-1 rounded-lg overflow-hidden border border-border/50`}>
              {imagesToDisplay.slice(0, 4).map((url, index) => (
                <div
                  key={index}
                  className="relative  aspect-square cursor-pointer group/img overflow-hidden"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={url}
                    alt="Note attachment"
                    className="w-full h-full object-contain transition-transform "
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                  {/* Show "+X" on the last item if there are more than 4 images */}
                  {index === 3 && imagesToDisplay.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                      +{imagesToDisplay.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-20 bg-secondary/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "image",
          imageUrls: note.imageUrls,
          images: note.images,
        }}
      />

      {/* Custom Full Screen Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed mt-44 m-4 md:m-10  max-h-[60vh] md:max-h-[95vh] max-w-[95vw] inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setLightboxIndex(null)} // Close on backdrop click
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000]"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Main Content Area */}
          <div
            className="relative w-full h-full p-4 md:p-10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Main Image */}
            <img
              src={imagesToDisplay[lightboxIndex]}
              alt="Full view"
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
            />

            {/* Navigation Arrows */}
            {imagesToDisplay.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full text-white/90 text-sm font-medium tracking-wider">
              {lightboxIndex + 1} / {imagesToDisplay.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}