"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Type,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Upload,
  Loader2,
  Code,
  Save,
  Check,
  Globe,
  ScanEye,
  Sparkles,
  Laptop,
  CloudUpload
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { RichTextEditor } from "./rich-text-editor";

interface UpsertNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: Id<"users">;
  goalId?: Id<"goals">;
  mode: "create" | "edit";
  initialData?: {
    _id: Id<"notes">;
    type: "text" | "image" | "link" | "code";
    content?: string;
    imageUrls?: string[];
    images?: string[];
    language?: string;
  };
}

const TABS = [
  { id: "text", label: "Text", icon: Type },
  { id: "code", label: "Code", icon: Code },
  { id: "link", label: "Link", icon: LinkIcon },
  { id: "image", label: "Image", icon: ImageIcon },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function UpsertNoteDialog({
  open,
  onOpenChange,
  userId,
  goalId,
  mode,
  initialData,
}: UpsertNoteDialogProps) {
  const [activeTab, setActiveTab] = useState("text");

  // Content States
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");

  // Image State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Vision Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations & Actions
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);
  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const analyzeImage = useAction(api.ai.analyzeImage);

  // Initialize state
  useEffect(() => {
    if (open && initialData) {
      setActiveTab(initialData.type);
      if (initialData.type === "text") setText(initialData.content || "");
      if (initialData.type === "link") setLink(initialData.content || "");
      if (initialData.type === "code") {
        setCodeSnippet(initialData.content || "");
        setLanguage(initialData.language || "javascript");
      }
      if (initialData.type === "image" && initialData.imageUrls) {
        setExistingImageUrls(initialData.imageUrls);
      }
    } else if (open && mode === "create") {
      resetForm();
    }
  }, [open, initialData, mode]);

  const resetForm = () => {
    setText("");
    setLink("");
    setCodeSnippet("");
    setLanguage("javascript");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImageUrls([]);
    setUploadProgress({ current: 0, total: 0 });
    setActiveTab("text");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];

    // Check file size before adding to the queue
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Image "${file.name}" is too large. Maximum size is 5MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      // Reset the input value so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset the input value
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  //  VISION ANALYSIS HANDLER 
  const handleAnalyzeImage = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const file = selectedFiles[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const result = await analyzeImage({
          imageBase64: base64String,
        });

        if (result) {
          setText((prev) => prev ? prev + "<br><br><strong>AI Analysis</strong><br>" + result.replace(/\n/g, '<br>') : result.replace(/\n/g, '<br>'));
          toast.success("Analysis complete! Switched to Text tab.");
          setActiveTab("text");
        }
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze image");
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === "text" && (!text.trim() || text === "<p></p>")) return;
    if (activeTab === "link" && !link.trim()) return;
    if (activeTab === "code" && !codeSnippet.trim()) return;
    if (activeTab === "image" && selectedFiles.length === 0 && existingImageUrls.length === 0) return;

    setIsSubmitting(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      let finalContent = undefined;
      let finalImages: string[] | undefined = undefined;
      let finalLanguage = undefined;

      if (activeTab === "image") {
        const newStorageIds: string[] = [];
        if (selectedFiles.length > 0) {
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];

            setUploadProgress(prev => ({ ...prev, current: i + 1 }));

            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });
            const { storageId } = await result.json();
            newStorageIds.push(storageId);
          }
        }

        if (mode === "edit" && initialData?.images) {
          finalImages = [...initialData.images, ...newStorageIds];
        } else {
          finalImages = newStorageIds;
        }
      }
      else if (activeTab === "text") finalContent = text;
      else if (activeTab === "link") finalContent = link;
      else if (activeTab === "code") {
        finalContent = codeSnippet;
        finalLanguage = language;
      }

      const payload = {
        type: activeTab as "text" | "image" | "link" | "code",
        content: finalContent,
        images: finalImages,
        language: finalLanguage,
      };

      if (activeTab === "image") {
        setUploadProgress(prev => ({ ...prev, current: prev.total + 1 }));
      }

      if (mode === "create") {
        if (!userId || !goalId) return;
        await createNote({ userId, goalId, ...payload });
        toast.success("Note added successfully");
      } else {
        if (!initialData?._id) return;
        await updateNote({ id: initialData._id, ...payload });
        toast.success("Note updated");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save note");
    } finally {
      setIsSubmitting(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-51 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ scale: 0.95, opacity: 0, y: 10, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden ring-1 ring-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HIGHLY ANIMATED LOADING OVERLAY */}
              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background/85"
                  >
                    {/* Glowing background orbs */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative flex flex-col items-center justify-center p-8 text-center w-full max-w-sm">

                      {activeTab === 'image' && uploadProgress.total > 0 ? (
                        <>
                          {/* PROJECTILE TRANSFER ANIMATION */}
                          <div className="relative w-64 h-32 mb-6 flex items-center">


                            {/* Moving Payload (Image Thumbnail) */}
                            <motion.div
                              animate={{
                                x: [0, 160], // Moves from local device to cloud
                                y: [0, -45, 0], // Parabolic arch
                                scale: [0.6, 1.2, 0.6],
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                              }}
                              className="absolute left-[2.5rem] w-12 h-12 rounded-lg overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.6)] z-20 bg-background flex items-center justify-center"
                            >
                              {previewUrls[Math.min(uploadProgress.current - 1, previewUrls.length - 1)] ? (
                                <img src={previewUrls[Math.min(uploadProgress.current - 1, previewUrls.length - 1)]} alt="uploading" className="w-full h-full object-cover opacity-90" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-primary" />
                              )}
                            </motion.div>

                            {/* Local Device Icon */}
                            <div className="absolute left-0 z-10 bg-secondary p-3.5 rounded-2xl border border-white/10 shadow-lg">
                              <Laptop className="w-6 h-6 text-muted-foreground" />
                            </div>

                            {/* Cloud Icon */}
                            <div className="absolute right-0 z-10 bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                              <CloudUpload className="w-6 h-6 text-blue-400" />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* STANDARD ORBITAL ANIMATION (For text/code/link) */
                        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                          />
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-2 rounded-full border-b-2 border-l-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="relative z-10 bg-background/50 backdrop-blur-md p-3 rounded-full border border-white/10"
                          >
                            <Save className="w-6 h-6 text-primary" />
                          </motion.div>
                        </div>
                      )}

                      {/* Dynamic Title */}
                      <motion.h3
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 tracking-wider uppercase mb-2"
                      >
                        {activeTab === 'image' && uploadProgress.total > 0
                          ? (uploadProgress.current > uploadProgress.total ? "Finalizing Note..." : "Transferring to Cloud...")
                          : "Saving Note..."}
                      </motion.h3>

                      {/* PROGRESS BAR SECTION */}
                      {activeTab === 'image' && uploadProgress.total > 0 ? (
                        <div className="w-full mt-2 px-2">
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                            <span>Progress</span>
                            <span>{Math.min(uploadProgress.current, uploadProgress.total)} / {uploadProgress.total}</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative shadow-inner">
                            <motion.div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(Math.min(uploadProgress.current, uploadProgress.total) / uploadProgress.total) * 100}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground font-medium">
                          Encrypting and syncing your content
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex items-center gap-3">
                  <Image src="/note.png" alt="noteIcon" width={34} height={34} />
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {mode === "create" ? "Create New Note" : "Edit Note"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add context, resources, or code snippets.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">

                  {/* TABS */}
                  <div className="flex p-1 bg-secondary/30 rounded-xl mb-6 border border-white/5 relative">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200",
                            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-background rounded-lg shadow-sm border border-white/5"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <tab.icon className="w-4 h-4" />
                          <span className="relative">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* CONTENT AREA */}
                  <div className="min-h-75">
                    <AnimatePresence mode="wait">

                      {/* TEXT TAB */}
                      {activeTab === "text" && (
                        <motion.div
                          key="text"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          <RichTextEditor
                            content={text}
                            onChange={(newContent) => setText(newContent)}
                          />
                        </motion.div>
                      )}

                      {/* CODE TAB */}
                      {activeTab === "code" && (
                        <motion.div
                          key="code"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 px-2">
                              <Code className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">Snippet</span>
                            </div>

                            <Select value={language} onValueChange={setLanguage}>
                              <SelectTrigger className="w-45 h-8 bg-background border-white/10 text-xs shadow-sm">
                                <SelectValue placeholder="Select Language" />
                              </SelectTrigger>
                              <SelectContent className="z-9999 bg-popover border-border">
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="typescript">TypeScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="java">Java</SelectItem>
                                <SelectItem value="cpp">C++</SelectItem>
                                <SelectItem value="html">HTML</SelectItem>
                                <SelectItem value="css">CSS</SelectItem>
                                <SelectItem value="sql">SQL</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="bash">Bash</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="relative group rounded-xl overflow-hidden border border-white/10">
                            <Textarea
                              placeholder="// Paste your code here..."
                              value={codeSnippet}
                              onChange={(e) => setCodeSnippet(e.target.value)}
                              className="min-h-87.5 font-mono text-sm resize-none bg-[#09090b] text-blue-100 border-none focus:ring-0 p-4 leading-normal"
                              spellCheck={false}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* LINK TAB */}
                      {activeTab === "link" && (
                        <motion.div
                          key="link"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center py-12 space-y-6"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-2 border border-primary/10 shadow-lg shadow-primary/5">
                            <Globe className="w-8 h-8 text-primary" />
                          </div>
                          <div className="w-full max-w-md space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">External URL</label>
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="https://example.com"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="pl-9 h-12 bg-secondary/30 border-white/10 focus:border-primary/50 text-base"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground text-center pt-2">
                              Paste links from YouTube, GitHub, Google Docs, or any other website.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* IMAGE TAB */}
                      {activeTab === "image" && (
                        <motion.div
                          key="image"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          {/* Vision Analysis Banner  */}
                          {selectedFiles.length > 0 && !isAnalyzing && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                  <ScanEye className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-indigo-200">Vision Analysis Available</p>
                                  <p className="text-xs text-indigo-400/80">Extract text or summarize this image.</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={handleAnalyzeImage}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                              >
                                <Sparkles className="w-3 h-3 mr-2" /> Analyze
                              </Button>
                            </motion.div>
                          )}

                          {/* HIGHLY ANIMATED SCANNING STATE */}
                          {isAnalyzing && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative w-full h-48 rounded-2xl overflow-hidden bg-black/40 border border-indigo-500/30 flex flex-col items-center justify-center group"
                            >
                              {/* Scanning Laser Animation */}
                              <motion.div
                                animate={{ top: ["-20%", "120%"] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-indigo-500/20 to-indigo-500/50 border-b-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10"
                              />

                              {/* Blurred Background Image for depth */}
                              {previewUrls.length > 0 && (
                                <div className="absolute inset-0 w-full h-full opacity-40 blur-[2px] scale-105 transition-transform">
                                  <img src={previewUrls[0]} alt="Analyzing preview" className="w-full h-full object-contain" />
                                </div>
                              )}

                              {/* Central Icon */}
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="z-20 p-4 bg-indigo-950/60 backdrop-blur-md rounded-full border border-indigo-500/50 mb-3 shadow-lg shadow-indigo-500/20"
                              >
                                <ScanEye className="w-8 h-8 text-indigo-400" />
                              </motion.div>

                              <p className="z-20 text-sm font-semibold text-indigo-200 tracking-wide">
                                Llama Vision is scanning...
                              </p>
                              <p className="z-20 text-xs text-indigo-400/80 mt-1">
                                Extracting text and structural data
                              </p>
                            </motion.div>
                          )}

                          {/* Keep original uploader hidden while scanning */}
                          {!isAnalyzing && (
                            <>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                              />

                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group border-2 border-dashed border-white/10 rounded-2xl h-38 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 hover:border-primary/30 transition-all bg-secondary/5"
                              >
                                <div className="p-4 bg-background rounded-full group-hover:scale-110 transition-transform border border-white/5 shadow-sm">
                                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Click to upload</p>
                                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP</p>
                                </div>
                              </div>
                            </>
                          )}

                          {(existingImageUrls.length > 0 || previewUrls.length > 0) && !isAnalyzing && (
                            <div className="space-y-3">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Gallery</label>
                              <div className="grid grid-cols-4 gap-3">
                                {existingImageUrls.map((url, idx) => (
                                  <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={url} alt="Existing" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Check className="w-5 h-5 text-green-400" />
                                    </div>
                                  </div>
                                ))}
                                {previewUrls.map((url, idx) => (
                                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-primary/20 group shadow-lg shadow-black/50">
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <button
                                      onClick={() => removeSelectedFile(idx)}
                                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-background/50 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isAnalyzing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-medium shadow-lg shadow-primary/10 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Note
                    </>
                  )}
                </Button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}