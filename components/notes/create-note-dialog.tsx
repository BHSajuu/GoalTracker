"use client";

import { Dispatch, SetStateAction } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { UpsertNoteDialog } from "./upsert-note-dialog";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  userId: Id<"users">;
  defaultGoalId?: string | Id<"goals"> | undefined;
  defaultFileId?: string | Id<"noteFiles"> | undefined;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  userId,
  defaultGoalId,
  defaultFileId
}: CreateNoteDialogProps) {
  return (
    <UpsertNoteDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={userId}
      goalId={defaultGoalId as Id<"goals">}
      fileId={defaultFileId as Id<"noteFiles">}
      mode="create"
    />
  );
}