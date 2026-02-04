"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image as ImageIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";

interface ImageNoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "image" | "text" | "link"; // Convex returns strict types
    content?: string;
    images?: string[]; // Storage IDs (needed for logic)
    imageUrls?: string[]; // Signed URLs (needed for display)
    createdAt: number;
  };
}

export function ImageNoteCard({ note }: ImageNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Fallback for legacy notes that only have 'content' string
  const imagesToDisplay = note.imageUrls && note.imageUrls.length > 0 
    ? note.imageUrls 
    : note.content ? [note.content] : [];

  return (
    <>
      <Card className="glass group hover:border-primary/30 transition-all mb-4 break-inside-avoid">
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-3 h-3" />
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
        
        <CardContent className="p-4 pt-2 space-y-2">
          {imagesToDisplay.map((url, index) => (
             <div key={index} className="rounded-lg overflow-hidden border border-border/50">
                <img 
                  src={url} 
                  alt={`Note attachment ${index + 1}`} 
                  className="w-full h-auto object-cover" 
                  loading="lazy"
                />
             </div>
          ))}
          {imagesToDisplay.length === 0 && (
             <div className="h-20 bg-secondary/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                No image available
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
          imageUrls: note.imageUrls, // For previewing in the dialog
          images: note.images,       // Pass storage IDs so backend keeps them
        }}
      />
    </>
  );
}