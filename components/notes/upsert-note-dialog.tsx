"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Type, Link as LinkIcon, Image as ImageIcon, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpsertNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: Id<"users">;
  goalId?: Id<"goals">;
  mode: "create" | "edit";
  initialData?: {
    _id: Id<"notes">;
    type: "text" | "image" | "link";
    content?: string;
    imageUrls?: string[]; // For previewing existing images
    images?: string[];    // Storage IDs
  };
}

export function UpsertNoteDialog({
  open,
  onOpenChange,
  userId,
  goalId,
  mode,
  initialData,
}: UpsertNoteDialogProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  
  // Image State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);
  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);

  // Initialize state when opening for Edit
  useEffect(() => {
    if (open && initialData) {
      setActiveTab(initialData.type);
      if (initialData.type === "text") setText(initialData.content || "");
      if (initialData.type === "link") setLink(initialData.content || "");
      if (initialData.type === "image" && initialData.imageUrls) {
        setExistingImageUrls(initialData.imageUrls);
      }
    } else if (open && mode === "create") {
      // Reset for create mode
      setText("");
      setLink("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setExistingImageUrls([]);
      setActiveTab("text");
    }
  }, [open, initialData, mode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    
    // Create local previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // Note: We don't easily support removing *existing* individual images in this simple version
  // but we can add that logic later if needed.

  const handleSubmit = async () => {
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "link" && !link.trim()) return;
    if (activeTab === "image" && selectedFiles.length === 0 && existingImageUrls.length === 0) return;

    setIsSubmitting(true);

    try {
      let finalContent = undefined;
      let finalImages: string[] | undefined = undefined;

      // 1. Handle Image Uploads if needed
      if (activeTab === "image") {
         // If editing, keep existing storage IDs (this logic assumes we pass them in initialData.images)
         // For simplicity in this step, we append new images to existing ones.
         const newStorageIds: string[] = [];

         if (selectedFiles.length > 0) {
           // Upload each file
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
         
         // Combine: If editing, we need the original storage IDs. 
         // For now, let's assume we are just ADDING or creating NEW.
         // (Refining Edit logic for removing specific images can be done in Phase 3)
         if (mode === "edit" && initialData?.images) {
            finalImages = [...initialData.images, ...newStorageIds];
         } else {
            finalImages = newStorageIds;
         }
      } 
      else if (activeTab === "text") {
        finalContent = text;
      } 
      else if (activeTab === "link") {
        finalContent = link;
      }

      // 2. Execute Mutation
      if (mode === "create") {
         if (!userId || !goalId) return;
         await createNote({
            userId,
            goalId,
            type: activeTab as "text" | "image" | "link",
            content: finalContent,
            images: finalImages,
         });
         toast.success("Note added successfully");
      } else {
         if (!initialData?._id) return;
         await updateNote({
            id: initialData._id,
            type: activeTab as "text" | "image" | "link",
            content: finalContent,
            images: finalImages,
         });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Note" : "Edit Note"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
               <Type className="w-4 h-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
               <LinkIcon className="w-4 h-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
               <ImageIcon className="w-4 h-4" /> Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <Textarea
              placeholder="Write your note here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <Input
              placeholder="Paste URL (e.g., Google Docs, Articles)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            {/* File Input */}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <Button 
                type="button" 
                variant="outline" 
                className="w-full h-20 border-dashed border-2"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-6 h-6" />
                    <span>Click to upload images</span>
                </div>
            </Button>

            {/* Previews Grid */}
            {(existingImageUrls.length > 0 || previewUrls.length > 0) && (
                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                    {/* Existing Images (Read-only for now) */}
                    {existingImageUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-border">
                            <img src={url} alt="Existing" className="w-full h-full object-cover opacity-80" />
                        </div>
                    ))}
                    {/* New Uploads */}
                    {previewUrls.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-border group">
                            <img src={url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeSelectedFile(idx)}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500/80 text-white rounded-full p-1 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
            ) : (
                "Save Note"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}