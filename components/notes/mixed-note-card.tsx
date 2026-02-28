"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trash2, Pencil, Maximize2, Layers, Link as LinkIcon, 
  Code2, Image as ImageIcon, ExternalLink, Type, X, ChevronLeft, ChevronRight,
  Check, Copy, FileText, Loader2, Save, ScanEye, Sparkles, CornerDownRight, Eye, Edit3, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MixedNoteCardProps {
  note: Doc<"notes"> & { imageUrls?: string[], analysis?: Record<string, string> };
}

const MarkdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-lg md:text-xl font-bold mt-4 mb-3 text-foreground" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-base md:text-lg font-bold mt-3 mb-2 text-foreground/90" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-sm md:text-base font-bold mt-4 mb-2 text-foreground/80 uppercase tracking-wide" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-sm font-bold mt-2 mb-2 text-foreground/80" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1 [&>*]:my-0" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-foreground" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic text-foreground/80" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-2 border-primary/50 pl-4 py-1.5 my-2 bg-primary/5 rounded-r-lg italic text-muted-foreground" {...props} />,
  code: ({ node, inline, ...props }: any) => inline ? ( <code className="bg-black/40 rounded px-1.5 py-0.5 font-mono text-[11px] md:text-xs text-foreground/90 border border-white/5" {...props} /> ) : ( <pre className="bg-black/50 p-3 rounded-xl overflow-x-auto border border-white/10 my-2 custom-scrollbar"><code className="font-mono text-[11px] md:text-xs text-foreground/90" {...props} /></pre> ),
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-3 w-full"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="text-xs uppercase bg-black/40 text-foreground/70" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-white/10" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-2 font-medium border border-white/10 whitespace-nowrap" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-2 border border-white/10" {...props} />,
};

const formatMarkdownDisplay = (text?: string) => {
  if (!text) return "";
  let formatted = text.replace(/\\n/g, '\n');
  formatted = formatted.replace(/\n*(SUMMARY|EXTRACTED TEXT|KEY INSIGHTS|ANALYSIS):\s*/gi, '\n### $1\n');
  formatted = formatted.replace(/([a-zA-Z0-9.?!])\s+-\s/g, '$1\n- ');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  return formatted.trim();
};

export function MixedNoteCard({ note }: MixedNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returnToDialog, setReturnToDialog] = useState(false);
  
  // Copy States
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedAnalysis, setHasCopiedAnalysis] = useState(false);

  // Lightbox States
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [returnToViewOnClose, setReturnToViewOnClose] = useState(false);

  // AI Analysis States
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [currentAnalysisImageUrl, setCurrentAnalysisImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editableAnalysis, setEditableAnalysis] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [aiDialogTab, setAiDialogTab] = useState<"preview" | "edit">("preview");
  const [expandedAnalysisUrl, setExpandedAnalysisUrl] = useState<string | null>(null);

  const removeNote = useMutation(api.notes.remove);
  const saveImageAnalysis = useMutation(api.notes.saveImageAnalysis);
  const analyzeImage = useAction(api.ai.analyzeImage);

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

  const handleCopy = async (type: 'text' | 'code' | 'link' | 'analysis', content: string) => {
    let textToCopy = content;
    if (type === 'text') {
      textToCopy = content.replace(/<[^>]+>/g, ''); // Strip HTML tags for cleaner copying
    }
    
    await navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");

    if (type === 'text') { setHasCopiedText(true); setTimeout(() => setHasCopiedText(false), 2000); }
    if (type === 'code') { setHasCopiedCode(true); setTimeout(() => setHasCopiedCode(false), 2000); }
    if (type === 'link') { setHasCopiedLink(true); setTimeout(() => setHasCopiedLink(false), 2000); }
    if (type === 'analysis') { setHasCopiedAnalysis(true); setTimeout(() => setHasCopiedAnalysis(false), 2000); }
  };

  // AI Logic
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
    setIsDialogOpen(false);
    setLightboxIndex(null);
    setReturnToViewOnClose(true); // Return to combined view when done
    
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
    setIsDialogOpen(false);
    setReturnToViewOnClose(true);
    setCurrentAnalysisImageUrl(url);
    setEditableAnalysis(existingText);
    setIsAnalyzing(false);
    setAiDialogTab("edit");
    setShowAiDialog(true);
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
      toast.success("Analysis saved securely to this note!");
      setShowAiDialog(false);
      if (returnToViewOnClose) {
        setTimeout(() => setIsDialogOpen(true), 150);
        setExpandedAnalysisUrl(currentAnalysisImageUrl);
      }
    } catch (error: any) {
      toast.error("Failed to save analysis: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Lightbox Logic
  const closeLightbox = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setLightboxIndex(null);
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
    if (lightboxIndex !== null) setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : imagesToDisplay.length - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) setLightboxIndex(lightboxIndex < imagesToDisplay.length - 1 ? lightboxIndex + 1 : 0);
  };

  const textContent = note.content || "";
  const codeContent = note.code || "";
  const linksContent = note.links || [];

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const plainTextPreview = textContent.replace(/<[^>]+>/g, '').substring(0, 120);

  const LaserScanner = () => (
    <div className="relative w-full aspect-video bg-black/30 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
      {currentAnalysisImageUrl && <img src={currentAnalysisImageUrl} alt="Analyzing" className="absolute inset-0 w-full h-full object-cover blur-[5px] opacity-40" />}
      <motion.div animate={{ top: ["-20%", "120%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-blue-400/20 to-blue-400/50 border-b-2 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-30" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
          <motion.div className="absolute inset-0 m-auto w-6 h-6 text-blue-300 z-20 flex items-center justify-center" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ScanEye className="w-6 h-6 text-blue-300" />
          </motion.div>
        </div>
        <p className="text-xs text-blue-100 font-medium tracking-widest uppercase animate-pulse">Analyzing...</p>
      </div>
      <motion.div className="absolute left-0 top-0 w-full h-[4px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] z-20" initial={{ top: "0%" }} animate={{ top: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-blue-900/20" />
    </div>
  );

  return (
    <>
      <Card 
        className="glass md:w-96 group hover:border-primary/40 transition-all duration-300 break-inside-avoid flex flex-col cursor-pointer overflow-hidden relative"
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full" onClick={(e) => { e.stopPropagation(); setReturnToDialog(false); setIsEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={(e) => { e.stopPropagation(); handleRemove(); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          {textContent && (
            <div className="text-sm text-foreground/80 leading-relaxed">
              {plainTextPreview}
              {textContent.length > 120 && "..."}
            </div>
          )}

          {imagesToDisplay.length > 0 && (
            <div className="flex gap-2 overflow-hidden rounded-lg">
              {imagesToDisplay.slice(0, 3).map((url, i) => (
                <div key={i} className="relative h-16 flex-1 bg-black/20 border border-white/5 overflow-hidden group/img">
                  <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  {note.analysis?.[url] && (
                    <div className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500/20 text-emerald-300 backdrop-blur-md">
                      <FileText className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
              {imagesToDisplay.length > 3 && (
                <div className="relative h-16 w-12 shrink-0 bg-black/40 border border-white/5 flex items-center justify-center text-xs font-bold text-white/70">
                  +{imagesToDisplay.length - 3}
                </div>
              )}
            </div>
          )}

          {linksContent.length > 0 && (
            <div className="space-y-1.5 w-full">
              {linksContent.slice(0, 2).map((linkUrl, i) => {
                const isGoogleDoc = linkUrl.includes("docs.google.com");
                const isYoutube = !!getYouTubeId(linkUrl);
                const isGithub = linkUrl.includes("github.com");

                return (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 border border-white/10 w-full overflow-hidden">
                    <div className="shrink-0 p-1">
                      {isGoogleDoc ? <Image src="/doc.png" alt="doc" width={20} height={20} /> : isYoutube ? <Image src="/you.png" alt="Youtube" width={20} height={20} /> : isGithub ? <Image src="/git.png" alt="Github" width={20} height={20} /> : <ExternalLink className="w-4 h-4 text-orange-400" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">{linkUrl.replace(/^https?:\/\//, '')}</span>
                  </div>
                );
              })}
              {linksContent.length > 2 && (
                 <div className="text-[10px] text-muted-foreground font-medium px-2 py-1 bg-white/5 rounded-md inline-block border border-white/5">
                   +{linksContent.length - 2} more references
                 </div>
              )}
            </div>
          )}

          {codeContent && (
            <div className="relative group/code flex-1 min-h-40 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <div className="h-48 overflow-hidden relative bg-[#1e1e1e] text-[10px] md:text-xs">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#1e1e1e]/90 z-10 pointer-events-none" />
                <div className="absolute top-2 right-3 text-[9px] font-bold text-muted-foreground/60 uppercase z-20">
                  {note.language || "code"}
                </div>
                <SyntaxHighlighter language={(note.language || 'javascript').toLowerCase()} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#171e2bff', color: '#c9d1d9', borderRadius: '0.5rem', height: '100%', overflow: 'hidden' }} wrapLines={true}>
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
          onInteractOutside={(e) => { if (lightboxIndex !== null) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (lightboxIndex !== null) e.preventDefault(); }}
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

            <div className="flex items-center gap-3 pr-6">
              <Button variant="default" size="sm" onClick={handleEditFromDialog} className="h-8 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Content
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 space-y-8 py-6">
            
            {/* TEXT SECTION */}
            {textContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                    <Type className="w-3.5 h-3.5" /> Description
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy('text', textContent)} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                    {hasCopiedText ? <Check className="w-3.5 h-3.5 mr-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy Text
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-white/10 text-foreground/90 bg-black/10 p-4 rounded-xl border border-white/5" dangerouslySetInnerHTML={{ __html: textContent }} />
              </div>
            )}

            {/* IMAGES SECTION */}
            {imagesToDisplay.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Attachments ({imagesToDisplay.length})
                </div>
                <div className={`grid gap-4 ${imagesToDisplay.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {imagesToDisplay.map((url, i) => {
                    const analysis = note.analysis?.[url];
                    const isExpanded = expandedAnalysisUrl === url;
                    
                    return (
                      <div key={i} className="flex flex-col gap-2 bg-black/10 p-2 rounded-xl border border-white/5">
                        <div 
                          className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-pointer shadow-md bg-black/20"
                          onClick={() => { setReturnToViewOnClose(true); setIsDialogOpen(false); setLightboxIndex(i); }}
                        >
                          <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/50 hover:bg-blue-600/90 text-white border border-white/20 backdrop-blur-md shadow-lg"
                              onClick={(e) => { e.stopPropagation(); handleAnalyze(url); }} title="Analyze Image"
                            >
                              <ScanEye className="w-4 h-4 text-blue-300 group-hover:text-white" />
                            </Button>
                          </div>
                          {analysis && (
                            <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-lg">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Expandable Analysis Section */}
                        {analysis && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div 
                              className="flex items-center justify-between cursor-pointer py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                              onClick={() => setExpandedAnalysisUrl(isExpanded ? null : url)}
                            >
                              <div className="flex items-center gap-2 text-emerald-300">
                                <Sparkles className="w-4 h-4 shrink-0" />
                                <span className="text-[10px] font-bold tracking-wider uppercase">AI Insights</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="mt-1 p-3 bg-black/30 rounded-lg border border-white/5 text-xs text-foreground/90 font-medium">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                      {formatMarkdownDisplay(analysis)}
                                    </ReactMarkdown>
                                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/10">
                                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleCopy('analysis', analysis)}>
                                        {hasCopiedAnalysis ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                                        Copy
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 text-[10px] text-emerald-400" onClick={() => handleEditAnalysis(url, analysis)}>
                                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LINK SECTION */}
            {linksContent.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                    <LinkIcon className="w-3.5 h-3.5" /> External References ({linksContent.length})
                  </div>
                </div>
                
                <div className={`grid gap-4 ${linksContent.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {linksContent.map((linkUrl, i) => {
                    const isGoogleDoc = linkUrl.includes("docs.google.com");
                    const youtubeId = getYouTubeId(linkUrl);
                    const isYoutube = !!youtubeId;
                    const isGithub = linkUrl.includes("github.com");

                    return (
                        <div key={i} className="relative group bg-black/10 p-2.5 rounded-xl border border-white/5 flex flex-col gap-3">
                           {/* Individual Link Copy Button */}
                           <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" onClick={() => handleCopy('link', linkUrl)} className="h-7 px-2 text-[10px] bg-black/50 hover:bg-blue-600/90 text-white backdrop-blur-md border border-white/10 rounded-md shadow-lg">
                                {hasCopiedLink ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />} Copy
                              </Button>
                           </div>

                          {isYoutube && youtubeId && (
                            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block relative group/video rounded-lg overflow-hidden aspect-video border border-border/50">
                              <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="Video thumbnail" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                                  <Image src="/youp.png" alt="Youtube" width={30} height={30} />
                                </div>
                              </div>
                            </a>
                          )}

                          <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary shadow-lg hover:shadow-blue-300/30 transition-all duration-400 border border-border/50 w-full`}>
                            {isGoogleDoc ? <div className="p-2 bg-blue-100/10 rounded-md shrink-0"><Image src="/doc.png" alt="doc" width={30} height={30} /></div> : isYoutube ? <div className="p-2 bg-red-100/10 rounded-md shrink-0"><Image src="/you.png" alt="Youtube" width={30} height={30} /></div> : isGithub ? <div className="p-1 rounded-md shrink-0"><Image src="/git.png" alt="Github" width={34} height={34} /></div> : <div className="p-2 bg-orange-100/10 rounded-md shrink-0"><ExternalLink className="w-6 h-6 text-orange-500" /></div>}
                            <div className="flex-1 min-w-0 pr-12">
                              <p className="text-sm font-medium truncate text-foreground">{isGoogleDoc ? "Google Document" : isYoutube ? "YouTube Video" : isGithub ? "GitHub Repository" : "External Link"}</p>
                              <p className="text-xs text-muted-foreground truncate opacity-70">{linkUrl}</p>
                            </div>
                          </a>
                        </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CODE SECTION */}
            {codeContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                    <Code2 className="w-3.5 h-3.5" /> Source Code
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {note.language || "Code"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy('code', codeContent)} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                      {hasCopiedCode ? <Check className="w-3.5 h-3.5 mr-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      Copy Code
                    </Button>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#1e1e1e]">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-black/40 flex items-center px-4 border-b border-white/5 gap-1.5 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="pt-8 overflow-hidden">
                    <SyntaxHighlighter language={(note.language || 'javascript').toLowerCase()} style={vscDarkPlus} showLineNumbers={true} customStyle={{ margin: 0, padding: '1.5rem', backgroundColor: '#090d14ff', color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6', minHeight: '100%' }} wrapLines={true} wrapLongLines={true}>
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
        initialData={{ _id: note._id, type: "mixed", content: note.content, imageUrls: note.imageUrls, images: note.images, code: note.code, links: note.links, language: note.language }}
      />

      {/* Custom Full Screen Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed top-20 rounded-3xl right-5 left-5 md:inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center md:w-full h-[85vh] md:h-full" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000]">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <div className="relative w-full h-full p-4 md:p-10 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={imagesToDisplay[lightboxIndex]} alt="Full view" className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl rounded-lg" />
            
            <button onClick={(e) => { e.stopPropagation(); handleAnalyze(imagesToDisplay[lightboxIndex]); }} className="absolute bottom-6 md:bottom-10 right-4 md:right-10 px-4 py-2 md:px-5 md:py-3 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full flex items-center gap-2 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105 z-50">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-bold tracking-wide">
                {!!note.analysis?.[imagesToDisplay[lightboxIndex]] ? "Re-Analyze Image" : "Analyze with Vision"}
              </span>
            </button>

            {imagesToDisplay.length > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110">
                  <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
                </button>
                <button onClick={handleNext} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110">
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

      {/* AI Analysis Dialog */}
      <Dialog open={showAiDialog} onOpenChange={(open) => { if (!open) { setShowAiDialog(false); if (returnToViewOnClose) setTimeout(() => setIsDialogOpen(true), 150); } else setShowAiDialog(true); }}>
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
                <Button variant="outline" size="sm" onClick={() => handleCopy('analysis', editableAnalysis)} className="rounded-full gap-1.5 border-blue-500/30 hover:bg-blue-500/10 text-blue-300 self-end md:self-auto">
                  {hasCopiedAnalysis ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />} Copy
                </Button>
              )}
            </DialogHeader>
          </div>

          <div className="p-4 md:px-5 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
            {isAnalyzing ? ( <LaserScanner /> ) : editableAnalysis ? (
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
                  <div className="text-xs md:text-sm text-foreground/90 font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {editableAnalysis}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="edit" className="flex-1 flex flex-col m-0">
                  <Textarea value={editableAnalysis} onChange={(e) => setEditableAnalysis(e.target.value)} className="w-full flex-1 min-h-[35vh] bg-black/10 rounded-2xl border-white/5 focus:border-emerald-500/40 focus:ring-emerald-500/10 text-xs md:text-sm leading-relaxed custom-scrollbar custom-scrollbar-textarea resize-none font-mono text-emerald-100/90 p-4 md:p-5 shadow-inner" placeholder="AI Analysis markdown will appear here..." />
                </TabsContent>
              </Tabs>
            ) : null}
          </div>

          <div className="p-4 md:p-5 border-t border-white/5 bg-secondary/10 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 shrink-0">
            <Button variant="ghost" onClick={() => { setShowAiDialog(false); if (returnToViewOnClose) setTimeout(() => setIsDialogOpen(true), 150); }} disabled={isAnalyzing || isSaving} className="rounded-xl w-full md:w-auto">
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