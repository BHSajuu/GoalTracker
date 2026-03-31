"use client";

import { useState, useTransition } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Folder, FolderOpen, FileText, Plus, Search, Check, Pencil, Trash2, X, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateNoteDialog } from "@/components/notes/create-note-dialog";
import { NoteCard } from "@/components/notes/note-card";
import { NoteListSkeleton, NotesPageSkeleton } from "@/components/notes/skeletons";
import Image from "next/image";
import { toast } from "sonner";

// Animated Folder Component with File CRUD
function FolderNode({
  goal,
  files,
  selectedFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile
}: {
  goal: Doc<"goals">,
  files: Doc<"noteFiles">[],
  selectedFileId: string | null,
  onSelectFile: (f: Doc<"noteFiles">) => void,
  onCreateFile: (goalId: string, name: string) => Promise<void>,
  onRenameFile: (fileId: string, newName: string) => Promise<void>,
  onDeleteFile: (fileId: string) => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Create State
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Edit State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState("");

  const handleCreateSubmit = async () => {
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }
    await onCreateFile(goal._id, newFileName.trim());
    setNewFileName("");
    setIsCreating(false);
  };

  const handleRenameSubmit = async (fileId: string) => {
    if (!editFileName.trim()) {
      setEditingFileId(null);
      return;
    }
    await onRenameFile(fileId, editFileName.trim());
    setEditingFileId(null);
  };

  return (
    <div className="flex flex-col w-full mb-2">
      <div className="flex items-center group truncate pr-2 rounded-md hover:bg-white/5 transition-colors">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className=" w-58 flex flex-1 items-center gap-2 px-2 py-2 text-sm font-medium"
        >
          {isOpen ? <FolderOpen className="w-4 h-4 shrink-0" style={{ color: goal.color || '#60a5fa' }} /> : <Folder className="w-4 h-4 shrink-0" style={{ color: goal.color || '#60a5fa' }} />}
          <span className="truncate text-foreground/90 font-bold tracking-wide">{goal.title}</span>
        </button>
        <button
          onClick={() => { setIsOpen(true); setIsCreating(true); }}
          className="lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-all shrink-0"
          title="Create Note File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col pl-4 ml-3 border-l border-white/10 mt-1 space-y-1"
          >
            {/* Inline File Creation Input */}
            {isCreating && (
              <div className="flex items-center gap-2 pr-2 py-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                <Input
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubmit(); if (e.key === 'Escape') setIsCreating(false); }}
                  onBlur={() => { if (!newFileName) setIsCreating(false) }}
                  className="h-7 text-xs bg-black/40 border-primary/50"
                  placeholder="File name..."
                />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400 hover:text-green-300 shrink-0" onClick={handleCreateSubmit}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {files.length === 0 && !isCreating ? (
              <span className="text-[11px] text-muted-foreground/40 py-1 pl-3 italic">No files yet</span>
            ) : (
              files.map(file => (
                <div key={file._id} className={cn(
                  "flex items-center justify-between group/file px-2 py-1.5 rounded-md transition-all",
                  selectedFileId === file._id ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}>
                  {editingFileId === file._id ? (
                    <div className="flex items-center gap-2 w-full">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <Input
                        autoFocus
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(file._id); if (e.key === 'Escape') setEditingFileId(null); }}
                        className="h-6 text-xs bg-black/40"
                      />
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-green-400" onClick={() => handleRenameSubmit(file._id)}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => onSelectFile(file)} className="flex items-center gap-2 flex-1 truncate text-left text-[13px]">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </button>

                      {/* Action Icons */}
                      <div className="flex items-center lg:opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setEditFileName(file.name); setEditingFileId(file._id); }} className="p-1 hover:text-blue-400">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file._id); }} className="p-1 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Page Layout
export default function NotesPage() {
  const { userId } = useAuth();

  const goals = useQuery(api.goals.getByUser, userId ? { userId } : "skip");
  const noteFiles = useQuery(api.noteFiles.getByUser, userId ? { userId } : "skip");
  const notes = useQuery(api.notes.getByUser, userId ? { userId } : "skip");

  const createFile = useMutation(api.noteFiles.create);
  const renameFile = useMutation(api.noteFiles.rename);
  const deleteFile = useMutation(api.noteFiles.remove);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<Doc<"noteFiles"> | { _id: "uncategorized", goalId: string, name: string } | null>(null);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // File Operations
  const handleCreateFile = async (goalId: string, name: string) => {
    try {
      const newFileId = await createFile({ userId: userId!, goalId: goalId as Id<"goals">, name });
      toast.success("File created");
      setSelectedFile({
        _id: newFileId,
        _creationTime: Date.now(),
        goalId: goalId as Id<"goals">,
        name,
        createdAt: Date.now(),
        userId: userId!
      });
    } catch { toast.error("Failed to create file"); }
  };

  const handleRenameFile = async (fileId: string, name: string) => {
    try {
      await renameFile({ id: fileId as Id<"noteFiles">, userId: userId!, name });
      if (selectedFile?._id === fileId) setSelectedFile({ ...selectedFile, name } as any);
      toast.success("File renamed");
    } catch { toast.error("Failed to rename file"); }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Delete this file and ALL notes inside it?")) return;
    try {
      await deleteFile({ id: fileId as Id<"noteFiles">, userId: userId! });
      if (selectedFile?._id === fileId) setSelectedFile(null);
      toast.success("File deleted");
    } catch { toast.error("Failed to delete file"); }
  };

  if (goals === undefined || notes === undefined || noteFiles === undefined) {
    return <NotesPageSkeleton />;
  }

  // Get notes for the right pane
  const activeNotes = selectedFile
    ? selectedFile._id === "uncategorized"
      ? notes.filter(n => n.goalId === selectedFile.goalId && !n.fileId)
      : notes.filter(n => n.fileId === selectedFile._id)
    : [];

  // Sort notes: Pinned first, then newest
  const sortedNotes = [...activeNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] space-y-3 pb-16 lg:pb-0 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your project notes and code resources.
          </p>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-4 flex-1 min-h-0">

        {/* LEFT PANE: FILE EXPLORER */}
        <div className={cn(
          "w-full lg:w-72 xl:w-80 flex flex-col bg-card/50 backdrop-blur-xl border border-border rounded-xl shadow-lg shrink-0 transition-all",
          isMobileMenuOpen ? "h-[45vh] lg:h-full" : "h-auto lg:h-full" // Conditional height for mobile
        )}>
          {/* Modified Header for mobile toggle support */}
          <div className="p-3 lg:p-4 border-b border-border bg-black/20 flex flex-row lg:flex-col items-center lg:items-stretch gap-3 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 shrink-0">
              <Image src="/file.png" alt="grid" width={22} height={20} /> <span className="hidden lg:block">Explorer</span>
            </h2>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search folders..."
                className="h-9 pl-8 bg-black/20 border-white/5 text-xs focus-visible:ring-primary/50 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* New Mobile Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Modified Folder Content: Hidden on mobile unless toggled open */}
          <div className={cn(
            "overflow-y-auto custom-scrollbar p-3",
            isMobileMenuOpen ? "flex-1 block" : "hidden lg:block lg:flex-1"
          )}>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Folder className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Create a goal first to organize your files.</p>
              </div>
            ) : (
              goals.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map(goal => {
                const filesForGoal = noteFiles.filter(f => f.goalId === goal._id);

                return (
                  <div key={goal._id} className="mb-2">
                    <FolderNode
                      goal={goal}
                      files={filesForGoal}
                      selectedFileId={selectedFile?._id || null}
                      onSelectFile={(file) => {
                        startTransition(() => {
                          setSelectedFile(file as any);
                        });
                        setIsMobileMenuOpen(false); // Auto-close folder menu on selection
                      }}
                      onCreateFile={handleCreateFile}
                      onRenameFile={handleRenameFile}
                      onDeleteFile={handleDeleteFile}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: VIEWER & GRID */}
        <div className="flex-1 bg-card/30 backdrop-blur-xl border border-border rounded-xl shadow-lg relative h-full flex flex-col overflow-hidden">
          {selectedFile ? (
            <div className="flex flex-col h-full">
              {/* Right Pane Header */}
              <div className="flex flex-row items-center justify-between gap-4  px-5 py-3 border-b border-white/5 bg-black/10 shrink-0">
                <div className="flex items-center gap-3">
                  <Image src="/fnote.png" alt="grid" width={36} height={36} />
                  <div>
                    <h2 className="text-xl font-bold text-foreground leading-none truncate w-40 lg:w-150">{selectedFile.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateNoteOpen(true)}
                  className="flex items-center bg-[#6499E9] text-black rounded-3xl md:px-4 px-2 md:py-2 py-1 gap-0 md:gap-2 shadow-[0_0_15px_rgba(168,255,62,0.3)] hover:shadow-[0_0_25px_rgba(168,255,62,0.5)] hover:scale-95 transition-all duration-300 font-semibold text-sm shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              </div>

              {/* Right Pane Masonry Grid  */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 md:px-6 pb-20">
                {isPending ? (
                  <NoteListSkeleton />
                ) : sortedNotes.length > 0 ? (
                  <div className="columns-1 sm:columns-[300px] 2xl:columns-[380px] gap-4 space-y-4">
                    {sortedNotes.map(note => (
                      <div key={note._id} className="break-inside-avoid">
                        <NoteCard note={note} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-bold">This file is empty</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">Click the Add Note button above to create text, code, images, or links.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 bg-[url('/grid.svg')] bg-center bg-repeat relative">
              <div className="absolute inset-0 bg-background/90" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                  <Image src="/code2.png" alt="Empty" width={40} height={40} className="opacity-40 grayscale" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">No File Selected</h3>
                <p className="text-xs max-w-xs text-center">Select a file from the explorer pane or click the <Plus className="inline w-3 h-3 mx-0.5" /> icon on a goal to create a new file.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateNoteDialog
        open={isCreateNoteOpen}
        onOpenChange={setIsCreateNoteOpen}
        userId={userId!}
        defaultGoalId={selectedFile?.goalId}
        defaultFileId={selectedFile?._id !== "uncategorized" ? selectedFile?._id : undefined}
      />
    </div>
  );
}