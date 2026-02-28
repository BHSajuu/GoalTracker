"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Maximize2, X, Check, Copy, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from "next/image";

interface CodeNoteCardProps {
  note: Doc<"notes">;
}

export function CodeNoteCard({ note }: CodeNoteCardProps) {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isEditingLightbox, setIsEditingLightbox] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const removeNote = useMutation(api.notes.remove);
  const updateNote = useMutation(api.notes.update);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.content) return;
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const openLightbox = () => {
    setEditContent(note.content || "");
    setIsEditingLightbox(false);
    setIsExpanded(true);
  };

  const handleSaveCode = async () => {
    try {
      setIsSaving(true);
      await updateNote({
        id: note._id,
        type: "code",
        content: editContent,
        language: note.language, 
      });
      toast.success("Code updated successfully");
      setIsEditingLightbox(false);
    } catch (error) {
      toast.error("Failed to update code");
    } finally {
      setIsSaving(false);
    }
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return;
      if (e.key === "Escape") {
        setIsExpanded(false);
        setIsEditingLightbox(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/30 transition-all mb-4 break-inside-avoid flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <Image src="/code.png" alt="code" width={35} height={35} />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider ">
                {note.language || "Code"}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {format(note.createdAt, "MMM d, h:mm a")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditingMetadata(true)}
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

        {/* Content Preview Area */}
        <CardContent className="p-0 relative group/code cursor-pointer flex-1 min-h-40" onClick={openLightbox}>
          <div className="h-48 overflow-hidden relative bg-[#1e1e1e] text-[10px] md:text-xs">
            {/* Gradient Fade at bottom to indicate more content */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#1e1e1e]/90 z-10 pointer-events-none" />

            <SyntaxHighlighter
              language={(note.language || 'javascript').toLowerCase()}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: '#171e2bff',
                color: '#c9d1d9',
                borderRadius: '0.5rem',
                height: '100%',
                overflow: 'hidden'
              }}
              wrapLines={true}
            >
              {note.content || ""}
            </SyntaxHighlighter>

            {/* Hover Overlay with Expand Icon */}
            <div className="absolute inset-0 z-20 bg-black/0 group-hover/code:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-black/60 p-2 rounded-full opacity-0 group-hover/code:opacity-100 transition-opacity transform scale-90 group-hover/code:scale-100">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog (Kept for external metadata edits like changing the Language dropdown via small card pencil) */}
      <UpsertNoteDialog
        open={isEditingMetadata}
        onOpenChange={setIsEditingMetadata}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "code",
          content: note.content,
          language: note.language,
        }}
      />

      {/* Full Screen Lightbox / Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-9999 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => {
            setIsExpanded(false);
            setIsEditingLightbox(false);
          }}
        >
          <div
            className="relative w-full max-w-5xl h-[85vh] bg-[#03010a] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#252526]">
              <div className="flex items-center gap-3">
                <Image src="/code2.png" alt="code" width={35} height={35} />
                <span className="text-sm font-medium text-white/90 uppercase tracking-wider">
                  {note.language || "Code"}
                </span>
                {!isEditingLightbox && (
                  <span className="text-xs text-white/40 hidden md:inline">
                    — {format(note.createdAt, "MMMM d, yyyy")}
                  </span>
                )}
              </div>

              {isEditingLightbox ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingLightbox(false);
                      setEditContent(note.content || ""); // Reset on cancel
                    }}
                    className="h-8 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveCode}
                    disabled={isSaving}
                    className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="text-xs">Save</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setIsEditingLightbox(true)}
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-xs">Edit</span>
                  </Button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:bg-red-500/20 hover:text-red-400 rounded-full"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Lightbox Content */}
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]">
              {isEditingLightbox ? (
                <div className="relative w-full h-full min-h-full">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onScroll={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const highlighter = document.getElementById('lightbox-syntax-highlighter');
                      if (highlighter) {
                        highlighter.scrollTop = target.scrollTop;
                        highlighter.scrollLeft = target.scrollLeft;
                      }
                    }}
                    className="absolute inset-0 w-full h-full font-mono text-[14px] resize-none bg-transparent text-transparent caret-white border-none focus:ring-0 p-6 leading-[1.6] z-10 whitespace-pre overflow-auto"
                    spellCheck={false}
                    autoFocus
                  />
                  <div
                    id="lightbox-syntax-highlighter"
                    className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                  >
                    <SyntaxHighlighter
                      language={(note.language || 'javascript').toLowerCase()}
                      style={vscDarkPlus}
                      showLineNumbers={true}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        backgroundColor: '#090d14ff',
                        color: '#c9d1d9',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        minHeight: '100%'
                      }}
                      wrapLines={false}
                    >
                      {editContent || " "}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <SyntaxHighlighter
                  language={(note.language || 'javascript').toLowerCase()}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    backgroundColor: '#090d14ff',
                    color: '#c9d1d9',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    minHeight: '100%'
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {note.content || ""}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}