"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2, ChevronLeft, ChevronRight, X, Maximize2,
  PencilIcon, Sparkles, Loader2, Save, Copy, FileText, CornerDownRight, Zap,
  ScanEye,
  Check,
  Eye,
  Edit3
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import { motion } from "framer-motion";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ImageNoteCardProps {
  note: Doc<"notes"> & { imageUrls?: string[] };
}

const MarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-lg md:text-xl font-bold mt-4 mb-3 text-foreground" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-base md:text-lg font-bold mt-3 mb-2 text-foreground/90" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-sm md:text-base font-bold mt-4 mb-2 text-foreground/80 uppercase tracking-wide" {...props} />,
  h4: ({node, ...props}: any) => <h4 className="text-sm font-bold mt-2 mb-2 text-foreground/80" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  
  // Target any nested elements inside LI and strip their vertical margins completely
  li: ({node, ...props}: any) => <li className="pl-1 [&>*]:my-0" {...props} />,
  
  strong: ({node, ...props}: any) => <strong className="font-semibold text-foreground" {...props} />,
  em: ({node, ...props}: any) => <em className="italic text-foreground/80" {...props} />,
  a: ({node, ...props}: any) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-2 border-primary/50 pl-4 py-1.5 my-2 bg-primary/5 rounded-r-lg italic text-muted-foreground" {...props} />,
  code: ({node, inline, ...props}: any) =>
    inline ? (
      <code className="bg-black/40 rounded px-1.5 py-0.5 font-mono text-[11px] md:text-xs text-foreground/90 border border-white/5" {...props} />
    ) : (
      <pre className="bg-black/50 p-3 rounded-xl overflow-x-auto border border-white/10 my-2 custom-scrollbar"><code className="font-mono text-[11px] md:text-xs text-foreground/90" {...props} /></pre>
    ),
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-3 w-full"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="text-xs uppercase bg-black/40 text-foreground/70" {...props} />,
  tbody: ({node, ...props}: any) => <tbody className="divide-y divide-white/10" {...props} />,
  tr: ({node, ...props}: any) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
  th: ({node, ...props}: any) => <th className="px-4 py-2 font-medium border border-white/10 whitespace-nowrap" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-2 border border-white/10" {...props} />,
};

// Formats raw AI plain-text into Markdown
const formatMarkdownDisplay = (text?: string) => {
  if (!text) return "";
  let formatted = text.replace(/\\n/g, '\n');
  
  // \s* forcefully swallows ANY extra spaces or newlines that appear directly after the heading
  formatted = formatted.replace(/\n*(SUMMARY|EXTRACTED TEXT|KEY INSIGHTS|ANALYSIS):\s*/gi, '\n### $1\n');
  
  // Fix inline bullet points
  formatted = formatted.replace(/([a-zA-Z0-9.?!])\s+-\s/g, '$1\n- ');
  
  // Clean up excessive newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
};

export function ImageNoteCard({ note }: ImageNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [returnToViewOnClose, setReturnToViewOnClose] = useState(false);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeAnalysisTabUrl, setActiveAnalysisTabUrl] = useState<string | null>(null);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [currentAnalysisImageUrl, setCurrentAnalysisImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editableAnalysis, setEditableAnalysis] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  const [aiDialogTab, setAiDialogTab] = useState<"preview" | "edit">("preview");

  const removeNote = useMutation(api.notes.remove);
  const saveImageAnalysis = useMutation(api.notes.saveImageAnalysis);
  const analyzeImage = useAction(api.ai.analyzeImage);

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
    : note.content && note.content.startsWith("http") && !note.content.includes(" ") ? [note.content] : [];

  const analyzedImages = useMemo(() => {
    return imagesToDisplay.filter(url => !!note.analysis?.[url]);
  }, [imagesToDisplay, note.analysis]);

  useEffect(() => {
    if (isViewOpen && analyzedImages.length > 0) {
      setActiveAnalysisTabUrl(analyzedImages[0]);
    }
  }, [isViewOpen, analyzedImages]);

  const closeLightbox = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setLightboxIndex(null);
    if (returnToViewOnClose) {
      setIsViewOpen(true);
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

  const getBase64Image = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyze = async (url: string) => {
    setIsViewOpen(false);
    setLightboxIndex(null);
    setReturnToViewOnClose(false);

    setShowAiDialog(true);
    setCurrentAnalysisImageUrl(url);
    setIsAnalyzing(true);
    setEditableAnalysis("");
    setAiDialogTab("preview");

    try {
      const base64 = await getBase64Image(url);
      const rawResult = await analyzeImage({ imageBase64: base64 });
      
      const processedResult = formatMarkdownDisplay(rawResult || "No analysis generated.");
      setEditableAnalysis(processedResult);
    } catch (error: any) {
      toast.error("Analysis failed: " + error.message);
      setShowAiDialog(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditAnalysis = (url: string, existingText: string) => {
    setIsViewOpen(false);
    setCurrentAnalysisImageUrl(url);
    setEditableAnalysis(existingText);
    setIsAnalyzing(false);
    setAiDialogTab("edit");
    setShowAiDialog(true);
  };

  const handleCopyAnalysis = (text?: string) => {
    const targetText = text || editableAnalysis;
    if (!targetText) return;
    navigator.clipboard.writeText(targetText);
    setHasCopied(true);
    toast.success("Analysis copied to clipboard!");

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  const handleSaveAnalysis = async () => {
    if (!editableAnalysis || !currentAnalysisImageUrl) return;
    setIsSaving(true);
    try {
      await saveImageAnalysis({
        id: note._id,
        imageUrl: currentAnalysisImageUrl,
        analysisText: editableAnalysis
      });
      toast.success("Analysis saved securely to this image!");
      setShowAiDialog(false);
    } catch (error: any) {
      toast.error("Failed to save analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const LaserScanner = () => (
    <div className="relative w-full aspect-video bg-black/30 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
      {currentAnalysisImageUrl && (
        <img
          src={currentAnalysisImageUrl}
          alt="Analyzing"
          className="absolute inset-0 w-full h-full object-cover blur-[5px] opacity-40"
        />
      )}
      <motion.div
        animate={{ top: ["-20%", "120%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-blue-400/20 to-blue-400/50 border-b-2 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-30"
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          />
          <motion.div
            className="absolute inset-0 m-auto w-6 h-6 text-blue-300 z-20 flex items-center justify-center"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ScanEye className="w-6 h-6 text-blue-300" />
          </motion.div>
        </div>
        <p className="text-xs text-blue-100 font-medium tracking-widest uppercase animate-pulse">
          Analyzing...
        </p>
      </div>
      <motion.div
        className="absolute left-0 top-0 w-full h-[4px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] z-20"
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-blue-900/20" />
    </div>
  );

  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2";
    return "grid-cols-2";
  };

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

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/40 transition-all duration-300 break-inside-avoid shadow-lg hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Image src="/img.png" alt="Image" width={24} height={24} className="opacity-80" />
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full" onClick={() => setIsEditing(true)}>
              <PencilIcon className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={handleRemove}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-2 cursor-pointer" onClick={() => setIsViewOpen(true)}>
          {imagesToDisplay.length > 0 ? (
            <div className={`grid ${getGridClass(imagesToDisplay.length)} gap-8 md:gap-4.5 p-5 rounded-xl overflow-hidden border border-white/10`}>
              {imagesToDisplay.slice(0, 4).map((url, index) => (
                <div key={index} className={` ${imagesToDisplay.length == 1 ? "" : "w-38 h-30"} rounded-xl relative aspect-square cursor-pointer group/img overflow-hidden bg-black/10`}>
                  <img src={url} alt="Note attachment" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-black/50 hover:bg-blue-600/90 text-white border border-white/20 backdrop-blur-md shadow-lg"
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(url); }} title="Analyze with Llama Vision">
                      <ScanEye className="w-3.5 h-3.5 text-blue-300 group-hover/img:text-white" />
                    </Button>
                  </div>
                  {!!note.analysis?.[url] && (
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-lg" title="Has AI Analysis">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {index === 3 && imagesToDisplay.length > 4 && (
                    <div className="absolute inset-0 bg-black/60  flex items-center justify-center text-white font-bold text-2xl" onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}>
                      +{imagesToDisplay.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-20 bg-secondary/30 rounded-xl flex items-center justify-center text-xs text-muted-foreground border border-white/5">
              No image
            </div>
          )}

          {analyzedImages.length > 0 && (
            <div className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors p-4 rounded-xl border border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold tracking-wider">AI Analysis Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                {analyzedImages.slice(0, 3).map(url => (
                  <img key={url} src={url} className="w-5 h-5 object-cover rounded border border-emerald-500/30" alt="Analyzed Source" />
                ))}
                {analyzedImages.length > 3 && (
                  <span className="text-xs text-emerald-300">+{analyzedImages.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{ _id: note._id, type: "image", imageUrls: note.imageUrls, images: note.images }}
      />

      {/* PREMIUM tabbed View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-lg md:max-w-3xl max-h-[90vh] md:max-h-[95vh] flex flex-col bg-background/80 backdrop-blur-2xl border-white/10 shadow-[0_0_60px_rgba(37,99,235,0.15)] rounded-3xl overflow-hidden p-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[90px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] -z-10 pointer-events-none" />

          {/* Accessiblity Requirements */}
          <DialogTitle className="sr-only">Image Note Details</DialogTitle>
          <DialogDescription className="sr-only">Created on {format(note.createdAt, "MMMM d, yyyy h:mm a")}</DialogDescription>

          {analyzedImages.length > 0 && (
            <Tabs value={activeAnalysisTabUrl || analyzedImages[0]} onValueChange={setActiveAnalysisTabUrl} className="flex flex-col w-full h-full max-h-[90vh] md:max-h-[95vh]">

              {/* TABS HEADER */}
              <div className="px-4 md:px-10 py-3 md:py-4 border-b border-white/5 bg-gradient-to-b from-muted/50 to-transparent flex items-center w-full overflow-hidden shrink-0">
                <TabsList className="bg-black/20 h-10 md:h-11 w-full rounded-full p-1 border border-white/5 custom-scrollbar overflow-x-auto justify-start inline-flex">
                  {analyzedImages.map((url, index) => (
                    <TabsTrigger key={url} value={url} className="rounded-full gap-2 text-[10px] md:text-xs font-semibold px-3 md:px-4 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white shrink-0 transition-all">
                      Image {index + 1}
                      <img src={url} className="w-4 h-4 md:w-5 md:h-5 object-cover rounded-sm border border-white/10 shrink-0 shadow-sm" alt="Analyzed Thumb" />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* TAB CONTENT BODY */}
              <div className="px-4 md:px-6 py-2 overflow-y-auto flex-1 custom-scrollbar">
                {analyzedImages.map((url) => {
                  const analysis = note.analysis?.[url] || "";
                  return (
                    <TabsContent key={url} value={url} className="m-0 focus-visible:outline-none h-full flex flex-col">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 flex flex-col h-full">
                        <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-center md:items-start gap-4 bg-emerald-500/5 p-3 md:p-2.5 rounded-2xl border border-emerald-500/10 text-center md:text-left">
                          <img
                            src={url}
                            className="w-24 md:w-full aspect-square object-cover rounded-lg border border-emerald-500/30 shadow-lg cursor-pointer transition-transform hover:scale-105"
                            alt="Analyzed Full"
                            onClick={() => {
                              setReturnToViewOnClose(true);
                              setIsViewOpen(false);
                              setLightboxIndex(imagesToDisplay.indexOf(url));
                            }}
                          />
                          <div className="space-y-1.5 w-full">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-300">
                              <Sparkles className="w-4 h-4 shrink-0" />
                              <span className="text-[10px] font-bold tracking-wider">AI Llama Vision Insights</span>
                            </div>
                            <p className="text-xs text-emerald-200 opacity-90">Deep visual intelligence extracted from this specific image. View the clean text below.</p>
                          </div>
                        </div>

                        <div className="flex-1 p-4 md:p-5 bg-black/10 rounded-2xl border border-white/5 text-xs md:text-sm text-foreground/90 font-medium overflow-auto">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                            {formatMarkdownDisplay(analysis)}
                          </ReactMarkdown>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 pb-4 pt-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleCopyAnalysis(analysis)} className="rounded-full h-9 text-xs gap-1.5 border border-white/5 flex-1 md:flex-none">
                            {hasCopied ? <Check className="w-3.5 h-3.5 mr-0 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-0" />}
                            {hasCopied ? "Copied" : "Copy"}
                          </Button>

                          <Button variant="outline" onClick={() => handleEditAnalysis(url, analysis || "")} className="rounded-full h-9 text-xs gap-1.5 border border-white/10 hover:bg-white/5 text-emerald-400 hover:text-emerald-300 flex-1 md:flex-none">
                            <PencilIcon className="w-3.5 h-3.5" /> Edit
                          </Button>

                          <Button size="sm" onClick={() => handleAnalyze(url)} className="rounded-full h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-lg shadow-blue-500/20 w-full md:w-auto mt-1 md:mt-0">
                            <Zap className="w-3.5 h-3.5 fill-current" /> Re-Analyze
                          </Button>
                        </div>
                      </motion.div>
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>


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

            <button onClick={(e) => {
              e.stopPropagation();
              handleAnalyze(imagesToDisplay[lightboxIndex]);
            }}
              className="absolute bottom-6 md:bottom-10 right-4 md:right-10 px-4 py-2 md:px-5 md:py-3 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full flex items-center gap-2 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105 z-50">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-bold tracking-wide">
                {!!note.analysis?.[imagesToDisplay[lightboxIndex]] ? "Re-Analyze Image" : "Analyze with Vision"}
              </span>
            </button>

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

      {/* AI Analysis/Edit Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] md:max-h-[95vh] bg-background/80 backdrop-blur-2xl border-white/10 shadow-[0_0_60px_rgba(37,99,235,0.2)] rounded-3xl overflow-hidden p-0 flex flex-col">
          <div className="p-4 md:p-6 pb-3 md:pb-4 border-b border-white/5 bg-gradient-to-b from-blue-500/10 to-transparent flex items-center justify-between shrink-0">
            <DialogHeader className="flex flex-col md:flex-row w-[95%] justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Image src="/img-s.png" alt="Empty" width={32} height={32} className="md:w-10 md:h-10" />
                <div className="text-left">
                  <DialogTitle className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Llama Vision Intelligence
                  </DialogTitle>
                  <DialogDescription className="text-[10px] md:text-xs mt-0.5">
                    {isAnalyzing ? "Processing Visual Data stream..." : "Review and finalize AI-generated insights."}
                  </DialogDescription>
                </div>
              </div>
              {!isAnalyzing && editableAnalysis && (
                <Button variant="outline" size="sm" onClick={() => handleCopyAnalysis(editableAnalysis)} className="rounded-full gap-1.5 border-blue-500/30 hover:bg-blue-500/10 text-blue-300 self-end md:self-auto">
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {hasCopied ? "Copied" : "Copy"}
                </Button>
              )}
            </DialogHeader>

          </div>

          <div className="p-4 md:px-5 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
            {isAnalyzing ? (
              <LaserScanner />
            ) : editableAnalysis ? (
              <Tabs value={aiDialogTab} onValueChange={(v) => setAiDialogTab(v as "preview" | "edit")} className="w-full h-full flex flex-col">
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                    <CornerDownRight className="w-3.5 h-3.5" /> AI INSIGHTS
                  </div>
                  <TabsList className="h-8 bg-black/40 border border-white/5">
                    <TabsTrigger value="preview" className="text-[10px] md:text-xs px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="text-[10px] md:text-xs px-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                       <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Markdown
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="preview" className="flex-1 min-h-[35vh] bg-black/10 rounded-2xl border border-white/5 p-4 md:p-5 m-0 overflow-auto custom-scrollbar">
                  {/* 3. ALSO REMOVED WHITESPACE-PRE-WRAP HERE */}
                  <div className="text-xs md:text-sm text-foreground/90 font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {editableAnalysis}
                    </ReactMarkdown>
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="flex-1 flex flex-col m-0">
                  <Textarea
                    value={editableAnalysis}
                    onChange={(e) => setEditableAnalysis(e.target.value)}
                    className="w-full flex-1 min-h-[35vh] bg-black/10 rounded-2xl border-white/5 focus:border-emerald-500/40 focus:ring-emerald-500/10 text-xs md:text-sm leading-relaxed custom-scrollbar custom-scrollbar-textarea resize-none font-mono text-emerald-100/90 p-4 md:p-5 shadow-inner"
                    placeholder="AI Analysis markdown will appear here..."
                  />
                </TabsContent>
              </Tabs>
            ) : null}
          </div>

          <div className="p-4 md:p-5 border-t border-white/5 bg-secondary/10 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setShowAiDialog(false)} disabled={isAnalyzing || isSaving} className="rounded-xl w-full md:w-auto">
              Dismiss
            </Button>
            {!isAnalyzing && editableAnalysis && (
              <Button onClick={handleSaveAnalysis} disabled={isSaving} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 w-full md:w-auto">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Analysis to Image
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}