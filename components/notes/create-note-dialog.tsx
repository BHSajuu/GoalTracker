"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Type, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface CreateNoteDialogProps {
  userId: Id<"users">;
  goalId: Id<"goals">;
}

export function CreateNoteDialog({ userId, goalId }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [content, setContent] = useState("");
  const createNote = useMutation(api.notes.create);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createNote({
        userId,
        goalId,
        type: activeTab as "text" | "link" | "image",
        content,
      });
      toast.success("Note added");
      setOpen(false);
      setContent("");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <Input
              placeholder="Paste URL (e.g., Google Docs link)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste a Google Docs link for quick access.
            </p>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <Input
              placeholder="Image URL"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Currently supports image URLs.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit}>Save Note</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}