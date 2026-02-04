"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText, Image as ImageIcon, Type } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface NoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "text" | "image" | "link";
    content: string;
    createdAt: number;
  };
}

export function NoteCard({ note }: NoteCardProps) {
  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const isGoogleDoc = note.type === "link" && note.content.includes("docs.google.com");

  return (
    <Card className="glass group hover:border-primary/30 transition-all">
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2 space-y-0">
        <div className="flex items-center gap-2">
          {note.type === "text" && <Type className="w-4 h-4 text-muted-foreground" />}
          {note.type === "image" && <ImageIcon className="w-4 h-4 text-blue-400" />}
          {note.type === "link" && (
             isGoogleDoc 
                ? <FileText className="w-4 h-4 text-blue-600" /> 
                : <ExternalLink className="w-4 h-4 text-orange-400" />
          )}
          <span className="text-xs text-muted-foreground">
            {format(note.createdAt, "MMM d, h:mm a")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {/* Google Doc / Link View */}
        {note.type === "link" ? (
          <a 
            href={note.content} 
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
                {note.content}
              </p>
            </div>
          </a>
        ) : note.type === "image" ? (
          /* Basic Image View (Assuming content is URL) */
          <div className="rounded-lg overflow-hidden border border-border/50">
             <img src={note.content} alt="Note" className="w-full h-auto object-cover" />
          </div>
        ) : (
          /* Text View */
          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
        )}
      </CardContent>
    </Card>
  );
}