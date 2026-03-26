"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Save, Copy, Check, LogIn, LayoutDashboard, AlertCircle,
  Type, Image as ImageIcon, Link as LinkIcon, Code2, ExternalLink, 
  Sparkles, Layers, FileText, Maximize2, ChevronDown, X, ChevronLeft, ChevronRight, Plus
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context"; 
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";

//  Helpers 
const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const formatMarkdownDisplay = (text?: string) => {
  if (!text) return "";
  let formatted = text.replace(/\\n/g, '\n');
  formatted = formatted.replace(/\n*(SUMMARY|EXTRACTED TEXT|KEY INSIGHTS|ANALYSIS):\s*/gi, '\n### $1\n');
  formatted = formatted.replace(/([a-zA-Z0-9.?!])\s+-\s/g, '$1\n- ');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  return formatted.trim();
};

const MarkdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-lg md:text-xl font-bold mt-4 mb-3 text-foreground" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-base md:text-lg font-bold mt-3 mb-2 text-foreground/90" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-sm md:text-base font-bold mt-4 mb-2 text-foreground/80 uppercase tracking-wide" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-8 mb-2 mt-0 space-y-3 marker:text-foreground/50" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1 [&>*]:my-0" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-foreground" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic text-foreground/80" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-2 border-primary/50 pl-4 py-1.5 my-2 bg-primary/5 rounded-r-lg italic text-muted-foreground" {...props} />,
  code: ({ node, inline, ...props }: any) => inline ? ( <code className="bg-black/40 rounded px-1.5 py-0.5 font-mono text-[11px] md:text-xs text-foreground/90 border border-white/5" {...props} /> ) : ( <pre className="bg-black/50 p-3 rounded-xl overflow-x-auto border border-white/10 my-2 custom-scrollbar"><code className="font-mono text-[11px] md:text-xs text-foreground/90" {...props} /></pre> ),
};

export default function SharedNotePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { userId, isLoading: isAuthLoading } = useAuth(); 

  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  
  // Copy States
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedAnalysis, setHasCopiedAnalysis] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expandedAnalysisUrl, setExpandedAnalysisUrl] = useState<string | null>(null);

  const sharedData = useQuery(api.notes.getByShareToken, { token });
  const userGoals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");
  const saveSharedNote = useMutation(api.notes.saveSharedNote);

  // Auto-select goal if there's only one or if a new one is created
  useEffect(() => {
    if (userGoals && userGoals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(userGoals[0]._id);
    }
  }, [userGoals, selectedGoalId]);

  // Lightbox Logic
  const closeLightbox = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null && e.key === "Escape") {
        closeLightbox(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox]);

  if (sharedData === undefined || isAuthLoading || (userId !== null && userGoals === undefined)) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse tracking-widest uppercase text-xs font-bold">Decrypting Zielio Link...</p>
      </div>
    );
  }

  if (sharedData === null || !sharedData.note) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          This secure link is invalid, has expired, or the original owner has deleted the note from their Zielio workspace.
        </p>
        <Button onClick={() => router.push("/")} variant="outline">Return to Home</Button>
      </div>
    );
  }

  const sharedNote = sharedData.note;
  const senderName = sharedData.senderName;

  // Formatting variables
  const imagesToDisplay = sharedNote.imageUrls || (sharedNote.type === "image" && sharedNote.content && sharedNote.content.startsWith('http') && !sharedNote.content.includes(' ') ? [sharedNote.content] : []);
  
  let textContent = "";
  let codeContent = "";
  let linksContent = sharedNote.links || [];

  if (sharedNote.type === "mixed") {
    textContent = sharedNote.content || "";
    codeContent = sharedNote.code || "";
  } else if (sharedNote.type === "code") {
    codeContent = sharedNote.content || ""; // A pure code note stores its code in 'content'!
  } else if (sharedNote.type === "text") {
    textContent = sharedNote.content || "";
  }

  const handleCopy = async (type: 'text' | 'code' | 'link' | 'analysis', content: string) => {
    let textToCopy = content;
    if (type === 'text') {
      textToCopy = content.replace(/<[^>]+>/g, ''); 
    }
    
    await navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");

    if (type === 'text') { setHasCopiedText(true); setTimeout(() => setHasCopiedText(false), 2000); }
    if (type === 'code') { setHasCopiedCode(true); setTimeout(() => setHasCopiedCode(false), 2000); }
    if (type === 'link') { setHasCopiedLink(true); setTimeout(() => setHasCopiedLink(false), 2000); }
    if (type === 'analysis') { setHasCopiedAnalysis(true); setTimeout(() => setHasCopiedAnalysis(false), 2000); }
  };

  const handleSaveToWorkspace = async () => {
    if (!userId || !selectedGoalId || !fileName.trim()) {
      toast.error("Please select a goal and enter a folder name.");
      return;
    }

    setIsSaving(true);
    try {
      await saveSharedNote({
        token,
        userId,
        targetGoalId: selectedGoalId as Id<"goals">,
        fileName: fileName.trim(),
      });
      toast.success("Note securely saved to your Zielio workspace!");
      router.push(`/dashboard/notes`); 
    } catch (error: any) {
      toast.error(error.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : imagesToDisplay.length - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) setLightboxIndex(lightboxIndex < imagesToDisplay.length - 1 ? lightboxIndex + 1 : 0);
  };

  return (
    <main className="min-h-screen bg-background grid-pattern relative overflow-hidden flex justify-center p-4 md:p-8">
      
      {/* Animated Background Elements from Login Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* LEFT COLUMN: THE NOTE PREVIEW */}
        <div className="lg:col-span-2 flex flex-col p-0 overflow-hidden border border-white/10 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-2xl self-start">
          
          <div className="px-6 py-5 border-b border-white/5 bg-secondary/30 shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Layers className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                  Shared by {senderName}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {sharedNote.type === 'mixed' ? 'Combined Note' : sharedNote.type.charAt(0).toUpperCase() + sharedNote.type.slice(1) + ' Note'}
                  <span>•</span>
                  <span className="text-blue-400 font-semibold tracking-wider uppercase text-[10px]">Zielio Secure Share</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 space-y-8 py-6 bg-black/20">
            
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

               <div 
                  className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-white/10 text-foreground/90 bg-black/10 p-4 rounded-xl border border-white/5" 
                  dangerouslySetInnerHTML={{ __html: textContent }} 
                  onClick={(e) => {
                  // Make Image Tags Clickable to open the Lightbox!
                  const target = e.target as HTMLElement;
                  const tag = target.closest('[data-image-tag="true"]');
                  if (tag) {
                        const idx = parseInt(tag.getAttribute('data-index') || "1", 10) - 1;
                        if (!isNaN(idx) && idx >= 0 && idx < imagesToDisplay.length) {
                        setLightboxIndex(idx);  // Open the lightbox
                        }
                  }
                  }}
                  />
              </div>
            )}

            {/* IMAGES SECTION */}
            {imagesToDisplay.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Attachments ({imagesToDisplay.length})
                </div>
                <div className={`grid gap-4 ${imagesToDisplay.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {imagesToDisplay.map((url: string, i: number) => {
                    const analysis = sharedNote.analysis?.[url];
                    const isExpanded = expandedAnalysisUrl === url;
                    
                    return (
                      <div key={i} className="flex flex-col gap-2 bg-black/10 p-2 rounded-xl border border-white/5">
                        <div 
                          className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-pointer shadow-md bg-black/20"
                          onClick={() => setLightboxIndex(i)}
                        >
                          <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                          
                          {analysis && (
                            <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-lg">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Expandable Analysis Section (Read-Only) */}
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
                  {linksContent.map((linkUrl: string, i: number) => {
                    const isGoogleDoc = linkUrl.includes("docs.google.com");
                    const youtubeId = getYouTubeId(linkUrl);
                    const isYoutube = !!youtubeId;
                    const isGithub = linkUrl.includes("github.com");

                    return (
                        <div key={i} className="bg-black/10 p-2.5 rounded-xl border border-white/5 flex flex-col gap-3">
                          
                          {/* YouTube Thumbnail */}
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

                          {/* LINK BAR - FIX: Wrapped copy button in group/link so it aligns purely with the link block */}
                          <div className="relative group/link">
                            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary shadow-lg hover:shadow-blue-300/30 transition-all duration-400 border border-border/50 w-full pr-24`}>
                              {isGoogleDoc ? <div className="p-2 bg-blue-100/10 rounded-md shrink-0"><Image src="/doc.png" alt="doc" width={30} height={30} /></div> : isYoutube ? <div className="p-2 bg-red-100/10 rounded-md shrink-0"><Image src="/you.png" alt="Youtube" width={30} height={30} /></div> : isGithub ? <div className="p-1 rounded-md shrink-0"><Image src="/git.png" alt="Github" width={34} height={34} /></div> : <div className="p-2 bg-orange-100/10 rounded-md shrink-0"><ExternalLink className="w-6 h-6 text-orange-500" /></div>}
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm font-medium truncate text-foreground">{isGoogleDoc ? "Google Document" : isYoutube ? "YouTube Video" : isGithub ? "GitHub Repository" : "External Link"}</p>
                                <p className="text-xs text-muted-foreground truncate opacity-70">{linkUrl}</p>
                              </div>
                            </a>
                            
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/link:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); handleCopy('link', linkUrl); }} className="h-7 px-2 text-[10px] bg-black/50 hover:bg-blue-600/90 text-white backdrop-blur-md border border-white/10 rounded-md shadow-lg">
                                {hasCopiedLink ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />} Copy
                              </Button>
                            </div>
                          </div>

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
                      {sharedNote.language || "Code"}
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
                    <SyntaxHighlighter language={(sharedNote.language || 'javascript').toLowerCase()} style={vscDarkPlus} showLineNumbers={true} customStyle={{ margin: 0, padding: '1.5rem', backgroundColor: '#090d14ff', color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6', minHeight: '100%' }} wrapLines={true} wrapLongLines={true}>
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-background/80 backdrop-blur-2xl sticky top-8 rounded-2xl shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4 bg-secondary/10">
              <CardTitle className="text-lg text-foreground">Save to Workspace</CardTitle>
              <CardDescription>Add this note directly to your Zielio goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {!userId ? (
                <div className="space-y-4 text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">You need to securely log in to save this note.</p>
                  <Button 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-lg shadow-primary/20"
                    onClick={() => router.push(`/login?redirect=/share/${token}`)}
                  >
                    Log in to Zielio
                  </Button>
                </div>
              ) : userGoals && userGoals.length === 0 ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-sm text-muted-foreground">You don't have any active goals yet.</p>
                  <Button 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-lg shadow-indigo-600/20"
                    onClick={() => setIsCreateGoalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Goal
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold text-muted-foreground  tracking-wider">1. Select Destination Goal</label>
                    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                      <SelectTrigger className="w-full h-12 bg-black/20 border-white/10 focus:ring-primary/30">
                        <SelectValue placeholder="Choose a goal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userGoals && userGoals.map((goal) => (
                          <SelectItem key={goal._id} value={goal._id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2.5">
                    <label className="text-[12px] font-bold text-muted-foreground  tracking-wider">2. New Folder Name</label>
                    <Input 
                      placeholder="e.g. Shared Resources"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-sm focus-visible:ring-primary/30"
                    />
                  </div>

                  <Button 
                    className="w-full h-12 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20 font-bold tracking-wide"
                    disabled={!selectedGoalId || !fileName.trim() || isSaving}
                    onClick={handleSaveToWorkspace}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save to Zielio
                  </Button>
                </div>
              )}

              {userId && (
                 <div className="pt-2 border-t border-white/5">
                   <Button variant="ghost" className="w-full h-10 gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => router.push("/dashboard")}>
                     <LayoutDashboard className="w-3.5 h-3.5" />
                     Return to Dashboard
                   </Button>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {userId && (
        <CreateGoalDialog 
          userId={userId as Id<"users">} 
          open={isCreateGoalOpen} 
          onOpenChange={setIsCreateGoalOpen} 
        />
      )}

      {/* PORTALED FULL SCREEN LIGHTBOX FOR PUBLIC VIEW */}
      {lightboxIndex !== null && mounted && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center pointer-events-auto" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[100001]">
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <div className="relative w-full h-full p-4 md:p-10 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={imagesToDisplay[lightboxIndex]} alt="Full view" className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl rounded-lg" />
            
            {imagesToDisplay.length > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110 z-[100001]">
                  <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
                </button>
                <button onClick={handleNext} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110 z-[100001]">
                  <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
                </button>
              </>
            )}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 md:px-4 md:py-2 bg-black/60 rounded-full text-white/90 text-xs md:text-sm font-medium tracking-wider z-[100001]">
              {lightboxIndex + 1} / {imagesToDisplay.length}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}