"use client";

import { Id } from "@/convex/_generated/dataModel";
import { UpsertTaskDialog } from "./upsert-task-dialog";

interface CreateTaskDialogProps {
  userId: Id<"users">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preselectedGoalId?: Id<"goals">;
}

export function CreateTaskDialog({
  userId,
  open,
  onOpenChange,
  preselectedGoalId,
}: CreateTaskDialogProps) {

  if (open === undefined || onOpenChange === undefined) {
    return null;
  }

  return (
    <UpsertTaskDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={userId}
      mode="create"
      preselectedGoalId={preselectedGoalId}
    />
  );
}