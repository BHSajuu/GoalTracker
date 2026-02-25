"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Maximize2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TextNoteCardProps {
  note: Doc<"notes">;
}

export function TextNoteCard({ note }: TextNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Helper to neatly extract plain text from HTML for the clipboard
  const handleCopy = () => {
    if (!note.content) return;

    // Create a temporary element to safely extract formatted innerText
    const tempElement = document.createElement("div");
    tempElement.innerHTML = note.content;
    const plainText = tempElement.innerText;

    navigator.clipboard.writeText(plainText);
    setHasCopied(true);
    toast.success("Copied to clipboard!");

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  const handleEditFromDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setIsEditing(true), 150); // slight delay to allow smooth modal transition
  };

  const content = note.content || "";

  // Strip HTML temporarily just to check if the plain text is long enough to need expansion
  const plainTextPreview = content.replace(/<[^>]+>/g, '');
  // Force expansion if the note contains complex rich text elements like tables or code blocks
  const isLongNote = plainTextPreview.length > 150 || content.includes('<table') || content.includes('<pre');

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/30 transition-all mb-4 break-inside-avoid flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Image src="/text.png" alt="Text" width={24} height={24} />
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        {/* PREVIEW AREA */}
        <CardContent
          className={`p-5 pt-0 relative ${isLongNote ? "cursor-pointer" : ""}`}
          onClick={() => isLongNote && setIsDialogOpen(true)}
        >
          <div className={`relative overflow-hidden ${isLongNote ? "max-h-[160px]" : ""}`}>
            {/* Render HTML safely with Tailwind Typography styling */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 prose-p:leading-relaxed prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-white/10 prose-pre:text-xs"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Fade-out gradient at the bottom for long notes */}
            {isLongNote && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none flex items-end justify-center pb-1">
                <span className="text-[11px] font-medium text-primary bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5 shadow-sm hover:bg-background transition-colors pointer-events-auto">
                  <Maximize2 className="w-3 h-3" /> Click to expand
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FULL SCREEN DIALOG FOR READING */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="px-6 py-5 border-b border-white/5 bg-secondary/20 shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-inner">
                <Image src="/text.png" alt="Text" width={28} height={28} />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-bold tracking-tight">Text Note</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Created on {format(note.createdAt, "MMMM do, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {/* NEW ACTIONS: Edit & Copy */}
            <div className="flex items-center gap-2 pr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {hasCopied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleEditFromDialog}
                className="h-8 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Note
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
            {/* Premium Typography rendering for the full view */}
            <div
              className="prose prose-base dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight 
                prose-h1:text-3xl prose-h2:text-2xl 
                prose-p:leading-relaxed prose-p:text-foreground/90
                prose-a:text-blue-400 hover:prose-a:text-blue-300 
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner
                prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                prose-hr:border-white/10"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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