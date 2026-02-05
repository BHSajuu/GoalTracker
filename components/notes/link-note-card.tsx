"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Pencil} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import Image from "next/image";

interface LinkNoteCardProps {
  note: {
    _id: Id<"notes">;
    type: "link" | "text" | "image";
    content?: string;
    createdAt: number;
  };
}

export function LinkNoteCard({ note }: LinkNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const removeNote = useMutation(api.notes.remove);

  const handleRemove = async () => {
    try {
      await removeNote({ id: note._id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const contentUrl = note.content || "";
  const isGoogleDoc = contentUrl.includes("docs.google.com");

  // YouTube Detection
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(contentUrl);
  const isYoutube = !!youtubeId;

  const isGithub = contentUrl.includes("github.com");

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/30 transition-all mb-4 break-inside-avoid overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between  space-y-0">
          <div className="flex items-center gap-2">
            {isGoogleDoc ? (
              <Image src="/doc.png" alt="doc" width={24} height={24} />
            ) : isYoutube ? (
              <Image src="/you.png" alt="Youtube" width={24} height={24} />
            ) : isGithub ? (
              <Image src="/git.png" alt="Github" width={24} height={24} />
            ) : (
              <ExternalLink className="w-4 h-4 text-orange-400" />
            )}
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, "MMM d, h:mm a")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {/* YouTube Thumbnail View */}
          {isYoutube && youtubeId && (
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-3 relative group/video rounded-lg overflow-hidden aspect-video border border-border/50"
            >
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                  <Image src="/youp.png" alt="Youtube" width={30} height={30} />
                </div>
              </div>
            </a>
          )}

          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary shadow-lg hover:shadow-blue-300/30 transition-all duration-400 border border-border/50 ${isYoutube ? 'mt-0' : ''}`}
          >
            {isGoogleDoc ? (
              <div className="p-2 bg-blue-100/10 rounded-md">
                <Image src="/doc.png" alt="doc" width={30} height={30} />
              </div>
            ) : isYoutube ? (
              <div className="p-2 bg-red-100/10 rounded-md">
                <Image src="/you.png" alt="Youtube" width={30} height={30} />
              </div>
            ) : isGithub ? (
              <div className="p-1 rounded-md">
                <Image src="/git.png" alt="Github" width={34} height={34} />
              </div>
            ) : (
              <div className="p-2 bg-orange-100/10 rounded-md">
                <ExternalLink className="w-6 h-6 text-orange-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {isGoogleDoc ? "Google Document" : isYoutube ? "YouTube Video" : isGithub ? "GitHub Repository" : "External Link"}
              </p>
              <p className="text-xs text-muted-foreground truncate opacity-70">
                {contentUrl}
              </p>
            </div>
          </a>
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "link",
          content: contentUrl,
        }}
      />
    </>
  );
}