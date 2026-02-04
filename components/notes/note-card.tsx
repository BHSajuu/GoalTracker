"use client";

import { Id } from "@/convex/_generated/dataModel";
import { TextNoteCard } from "./text-note-card";
import { ImageNoteCard } from "./image-note-card";
import { LinkNoteCard } from "./link-note-card";

interface NoteCardProps {
      note: {
            _id: Id<"notes">;
            type: "text" | "image" | "link";
            content?: string;
            images?: string[];
            imageUrls?: string[];
            userId?: Id<"users">;
            goalId?: Id<"goals">;
            createdAt: number;
      };
}

export function NoteCard({ note }: NoteCardProps) {
      switch (note.type) {
            case "text":
                  return <TextNoteCard note={note} />;
            case "image":
                  return <ImageNoteCard note={note} />;
            case "link":
                  return <LinkNoteCard note={note} />;
            default:
                  return null;
      }
}