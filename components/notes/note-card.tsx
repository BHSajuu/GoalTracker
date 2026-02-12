"use client";

import { Doc} from "@/convex/_generated/dataModel";
import { TextNoteCard } from "./text-note-card";
import { ImageNoteCard } from "./image-note-card";
import { LinkNoteCard } from "./link-note-card";
import { CodeNoteCard } from "./code-note-card";

interface NoteCardProps {
      note: Doc<"notes">;
}

export function NoteCard({ note }: NoteCardProps) {
      switch (note.type) {
            case "text":
                  return <TextNoteCard note={note} />;
            case "image":
                  return <ImageNoteCard note={note} />;
            case "link":
                  return <LinkNoteCard note={note} />;
            case "code":
                  return <CodeNoteCard note={note} />;
            default:
                  return null;
      }
}