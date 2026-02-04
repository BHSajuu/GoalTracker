"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UpsertNoteDialog } from "./upsert-note-dialog";

interface CreateNoteDialogProps {
  userId: Id<"users">;
  goalId: Id<"goals">;
}

export function CreateNoteDialog({ userId, goalId }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add Note
      </Button>

      <UpsertNoteDialog 
        open={open} 
        onOpenChange={setOpen} 
        userId={userId}
        goalId={goalId}
        mode="create"
      />
    </>
  );
}