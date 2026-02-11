"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
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
      <button
        className="flex items-center bg-[#6499E9] text-black rounded-3xl px-4 py-1.5  gap-2  shadow-[0_0_15px_rgba(168,255,62,0.7)] hover:shadow-[0_0_25px_rgba(168,255,62,0.3)] hover:scale-95 transition-all duration-400"
        onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add Note
      </button>

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