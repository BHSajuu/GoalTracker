"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UpsertTaskDialog } from "./upsert-task-dialog";

interface CreateTaskDialogProps {
  userId: Id<"users">;
  preselectedGoalId?: Id<"goals">;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  userId,
  preselectedGoalId,
  trigger,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      )}

      <UpsertTaskDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        mode="create"
        preselectedGoalId={preselectedGoalId}
      />
    </>
  );
}