"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CreateNoteDialog } from "@/components/notes/create-note-dialog";
import { StickyNote, FolderOpen } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { NoteCard } from "@/components/notes/note-card";

export default function NotesPage() {
  const { userId } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false); 

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");

  const goalId = selectedGoalId as Id<"goals">;
  const activeNotes = useQuery(api.notes.getByGoal, goalId ? { goalId } : "skip");

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="animate-slide-up flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Notes
        </h1>
        <p className="text-muted-foreground">
          Keep track of ideas and resources for your goals.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start h-full overflow-hidden">
        {/* Goal Selector - Sticky/Fixed */}
        <Card className="w-full md:w-1/3 lg:w-1/4 glass border-border/50 flex-shrink-0">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <FolderOpen className="w-4 h-4 text-orange-400" /> <span className="opacity-70">Select Goal</span>
            </div>

            {goals?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active goals.</p>
            ) : (
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <SelectContent>
                  {goals?.map((goal) => (
                    <SelectItem key={goal._id} value={goal._id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!selectedGoalId && (
              <div className="p-4 mt-4 rounded-lg bg-secondary/30 text-center">
                <StickyNote className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  Select a goal to view or add notes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Container - Scrollable */}
        <div className="flex-1 w-full h-full flex flex-col min-h-0">
          {selectedGoalId && userId ? (
            <>
              <div className="flex justify-between items-center mb-4 flex-shrink-0 pr-2">
                <h2 className="text-lg font-semibold">
                  {goals?.find(g => g._id === selectedGoalId)?.title} Notes
                </h2>
                <div onClick={() => setIsCreateOpen(true)}>
                  <CreateNoteDialog
                    userId={userId}
                    goalId={selectedGoalId as Id<"goals">}
                  />
                </div>
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {activeNotes === undefined ? (
                  <div className="text-center p-8 text-muted-foreground">Loading...</div>
                ) : activeNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/50 rounded-xl">
                    <StickyNote className="w-10 h-10 text-muted-foreground mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  </div>
                ) : (
                  <div className="columns-1 lg:columns-2 space-y-4">
                    {activeNotes.map((note) => (
                      <NoteCard key={note._id} note={note} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50">
              <p>Select a goal to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}