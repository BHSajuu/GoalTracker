"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";

interface LinkNoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "link" | "text" | "image";
    content?: string;
    createdAt: number;
  };
}

export function LinkNoteCard({ note }: LinkNoteCardProps) {
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

  const contentUrl = note.content || "";
  const isGoogleDoc = contentUrl.includes("docs.google.com");

  return (
    <>
      <Card className="glass group hover:border-primary/30 transition-all mb-4 break-inside-avoid">
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2 space-y-0">
          <div className="flex items-center gap-2">
            {isGoogleDoc ? (
              <FileText className="w-4 h-4 text-blue-600" />
            ) : (
              <ExternalLink className="w-4 h-4 text-orange-400" />
            )}
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
        
        <CardContent className="p-4 pt-2">
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/50"
          >
            {isGoogleDoc ? (
               <div className="p-2 bg-blue-100/10 rounded-md">
                 <FileText className="w-6 h-6 text-blue-500" />
               </div>
            ) : (
               <div className="p-2 bg-orange-100/10 rounded-md">
                 <ExternalLink className="w-6 h-6 text-orange-500" />
               </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {isGoogleDoc ? "Google Document" : "External Link"}
              </p>
              <p className="text-xs text-muted-foreground truncate opacity-70">
                {contentUrl}
              </p>
            </div>
          </a>
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "link",
          content: contentUrl,
        }}
      />
    </>
  );
}