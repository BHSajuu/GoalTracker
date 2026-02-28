"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Trash2, Pencil, Maximize2, Layers, Link as LinkIcon, 
  Code2, Image as ImageIcon, ExternalLink, Type, X, ChevronLeft, ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from "next/image";

interface MixedNoteCardProps {
  note: Doc<"notes"> & { imageUrls?: string[] };
}

export function MixedNoteCard({ note }: MixedNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returnToDialog, setReturnToDialog] = useState(false);
  
  // Lightbox States
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [returnToViewOnClose, setReturnToViewOnClose] = useState(false);

  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Mixed note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleEditFromDialog = () => {
    setReturnToDialog(true);
    setIsDialogOpen(false);
    setTimeout(() => setIsEditing(true), 150);
  };

  // Lightbox Handlers
  const closeLightbox = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setLightboxIndex(null);
    // Redirect user back to the mixed-card dialog when lightbox closes
    if (returnToViewOnClose) {
      setIsDialogOpen(true);
      setReturnToViewOnClose(false);
    }
  }, [returnToViewOnClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null && e.key === "Escape") {
        closeLightbox(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox]);

  const imagesToDisplay = note.imageUrls && note.imageUrls.length > 0 ? note.imageUrls : [];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : imagesToDisplay.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex < imagesToDisplay.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  const textContent = note.content || "";
  const codeContent = note.code || "";
  const linkContent = note.link || "";

  // Link Detection Logic (Matching link-note-card.tsx)
  const isGoogleDoc = linkContent.includes("docs.google.com");
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = getYouTubeId(linkContent);
  const isYoutube = !!youtubeId;
  const isGithub = linkContent.includes("github.com");

  // Extract a plain text preview
  const plainTextPreview = textContent.replace(/<[^>]+>/g, '').substring(0, 120);

  return (
    <>
      <Card 
        className="glass md:w-96 group hover:border-primary/40 transition-all duration-300 break-inside-avoid  flex flex-col cursor-pointer overflow-hidden relative"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 z-20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/50 backdrop-blur-sm rounded-full px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={(e) => { 
                e.stopPropagation(); 
                setReturnToDialog(false);
                setIsEditing(true); 
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          
          {/* TEXT PREVIEW */}
          {textContent && (
            <div className="text-sm text-foreground/80 leading-relaxed">
              {plainTextPreview}
              {textContent.length > 120 && "..."}
            </div>
          )}

          {/* IMAGE PREVIEW (Mini Gallery) */}
          {imagesToDisplay.length > 0 && (
            <div className="flex gap-2 overflow-hidden rounded-lg">
              {imagesToDisplay.slice(0, 3).map((url, i) => (
                <div key={i} className="relative h-16 flex-1 bg-black/20 border border-white/5 overflow-hidden">
                  <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {imagesToDisplay.length > 3 && (
                <div className="relative h-16 w-12 shrink-0 bg-black/40 border border-white/5 flex items-center justify-center text-xs font-bold text-white/70">
                  +{imagesToDisplay.length - 3}
                </div>
              )}
            </div>
          )}

          {/* LINK PREVIEW (Matches LinkNoteCard style) */}
          {linkContent && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 border border-white/10 w-full overflow-hidden">
              <div className="shrink-0 p-1">
                {isGoogleDoc ? (
                  <Image src="/doc.png" alt="doc" width={20} height={20} />
                ) : isYoutube ? (
                  <Image src="/you.png" alt="Youtube" width={20} height={20} />
                ) : isGithub ? (
                  <Image src="/git.png" alt="Github" width={20} height={20} />
                ) : (
                  <ExternalLink className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">{linkContent.replace(/^https?:\/\//, '')}</span>
            </div>
          )}

          {/* CODE PREVIEW */}
          {codeContent && (
            <div className="relative group/code flex-1 min-h-40 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <div className="h-48 overflow-hidden relative bg-[#1e1e1e] text-[10px] md:text-xs">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#1e1e1e]/90 z-10 pointer-events-none" />
                <div className="absolute top-2 right-3 text-[9px] font-bold text-muted-foreground/60 uppercase z-20">
                  {note.language || "code"}
                </div>
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
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shadow-xl pointer-events-auto hover:bg-background transition-colors">
              <Maximize2 className="w-3 h-3" /> View Full Note
            </span>
          </div>
        </CardContent>
      </Card>

      {/* FULL SCREEN READ DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="sm:max-w-2xl md:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl"
          onInteractOutside={(e) => {
            if (lightboxIndex !== null) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (lightboxIndex !== null) e.preventDefault();
          }}
        >
          <DialogHeader className="px-6 py-5 border-b border-white/5 bg-secondary/20 shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                <Layers className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Combined Note
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Created on {format(note.createdAt, "MMMM do, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-center pr-6">
              <Button
                variant="default"
                size="sm"
                onClick={handleEditFromDialog}
                className="h-8 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Content
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8   space-y-8">
            
            {/* TEXT SECTION */}
            {textContent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                  <Type className="w-3.5 h-3.5" /> Description
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-white/10 text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: textContent }}
                />
              </div>
            )}

            {/* IMAGES SECTION */}
            {imagesToDisplay.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Attachments ({imagesToDisplay.length})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagesToDisplay.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setReturnToViewOnClose(true);
                        setIsDialogOpen(false);
                        setLightboxIndex(i);
                      }}
                      className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group cursor-pointer shadow-md bg-black/20"
                    >
                      <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LINK SECTION (Full matching implementation) */}
            {linkContent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                  <LinkIcon className="w-3.5 h-3.5" /> External Reference
                </div>
                
                {/* YouTube Thumbnail View */}
                {isYoutube && youtubeId && (
                  <a
                    href={linkContent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-3 relative group/video rounded-lg overflow-hidden aspect-video border border-border/50 max-w-lg"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                        <Image src="/youp.png" alt="Youtube" width={30} height={30} />
                      </div>
                    </div>
                  </a>
                )}

                <a
                  href={linkContent}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary shadow-lg hover:shadow-blue-300/30 transition-all duration-400 border border-border/50 max-w-lg ${isYoutube ? 'mt-0' : ''}`}
                >
                  {isGoogleDoc ? (
                    <div className="p-2 bg-blue-100/10 rounded-md shrink-0">
                      <Image src="/doc.png" alt="doc" width={30} height={30} />
                    </div>
                  ) : isYoutube ? (
                    <div className="p-2 bg-red-100/10 rounded-md shrink-0">
                      <Image src="/you.png" alt="Youtube" width={30} height={30} />
                    </div>
                  ) : isGithub ? (
                    <div className="p-1 rounded-md shrink-0">
                      <Image src="/git.png" alt="Github" width={34} height={34} />
                    </div>
                  ) : (
                    <div className="p-2 bg-orange-100/10 rounded-md shrink-0">
                      <ExternalLink className="w-6 h-6 text-orange-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {isGoogleDoc ? "Google Document" : isYoutube ? "YouTube Video" : isGithub ? "GitHub Repository" : "External Link"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate opacity-70">
                      {linkContent}
                    </p>
                  </div>
                </a>
              </div>
            )}

            {/* CODE SECTION */}
            {codeContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                    <Code2 className="w-3.5 h-3.5" /> Source Code
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {note.language || "Code"}
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#1e1e1e]">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-black/40 flex items-center px-4 border-b border-white/5 gap-1.5 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="pt-8 overflow-hidden">
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
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open && returnToDialog) {
            setReturnToDialog(false);
            setTimeout(() => setIsDialogOpen(true), 150);
          }
        }}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "mixed",
          content: note.content,
          imageUrls: note.imageUrls,
          images: note.images,
          code: note.code,
          link: note.link,
          language: note.language,
        }}
      />

      {/* Custom Full Screen Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed top-20 rounded-3xl right-5 left-5 md:inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center md:w-full h-[85vh] md:h-full"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000]"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div
            className="relative w-full h-full p-4 md:p-10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagesToDisplay[lightboxIndex]}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl rounded-lg"
            />

            {imagesToDisplay.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
                </button>
              </>
            )}

            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 md:px-4 md:py-2 bg-black/60 rounded-full text-white/90 text-xs md:text-sm font-medium tracking-wider">
              {lightboxIndex + 1} / {imagesToDisplay.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}