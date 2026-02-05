"use client";

import { Id } from "@/convex/_generated/dataModel";
import { UpsertGoalDialog } from "./upsert-goal-dialog";

interface CreateGoalDialogProps {
  userId: Id<"users">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateGoalDialog({ userId, open, onOpenChange }: CreateGoalDialogProps) {

  if (open === undefined || onOpenChange === undefined) {
    return null;
  }

  return (
    <UpsertGoalDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={userId}
      mode="create"
    />
  );
}