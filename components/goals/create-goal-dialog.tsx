"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UpsertGoalDialog } from "./upsert-goal-dialog";

interface CreateGoalDialogProps {
  userId: Id<"users">;
}

export function CreateGoalDialog({ userId }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> New Goal
      </Button>

      <UpsertGoalDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        mode="create"
      />
    </>
  );
}