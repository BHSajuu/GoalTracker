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
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
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
      // 1. Convert first image to Base64
      const file = selectedFiles[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // 2. Call AI Action
        const result = await analyzeImage({
          imageBase64: base64String,
          prompt: "Analyze this image. If it contains text, transcribe it. If it is a diagram or scene, describe it in detail."
        });

        if (result) {
          // 3. Populate Text Tab
          setText((prev) => prev ? prev + "\n\n AI Analysis \n" + result : result);
          toast.success("Analysis complete! Switched to Text tab.");
          setActiveTab("text"); // Switch to text tab to show result
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
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "link" && !link.trim()) return;
    if (activeTab === "code" && !codeSnippet.trim()) return;
    if (activeTab === "image" && selectedFiles.length === 0 && existingImageUrls.length === 0) return;

    setIsSubmitting(true);

    try {
      let finalContent = undefined;
      let finalImages: string[] | undefined = undefined;
      let finalLanguage = undefined;

      if (activeTab === "image") {
        const newStorageIds: string[] = [];
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
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
              className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden ring-1 ring-white/5"
              onClick={(e) => e.stopPropagation()}
            >
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
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider flex items-center gap-2">
                              <Type className="w-3 h-3" /> Note Content
                            </label>
                            <span className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full">
                              Markdown Supported
                            </span>
                          </div>
                          <Textarea
                            placeholder="Type your thoughts here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-75 resize-none bg-secondary/30 border-white/10 focus:border-primary/50 text-base leading-relaxed p-4 rounded-xl"
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
                          {/*  Vision Analysis Banner  */}
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

                          {isAnalyzing && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-4 bg-secondary/30 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm text-muted-foreground"
                            >
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              Analyzing image with Llama Vision...
                            </motion.div>
                          )}

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

                          {(existingImageUrls.length > 0 || previewUrls.length > 0) && (
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