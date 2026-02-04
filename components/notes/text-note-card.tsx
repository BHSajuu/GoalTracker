"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Type, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";

interface TextNoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "text" | "image" | "link";
    content?: string;
    createdAt: number;
  };
}

export function TextNoteCard({ note }: TextNoteCardProps) {
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

  return (
    <>
      <Card className="glass group hover:border-primary/30 transition-all mb-4 break-inside-avoid">
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>
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
        
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{
            _id: note._id,
            type: "text",
            content: note.content,
        }}
      />
    </>
  );
}