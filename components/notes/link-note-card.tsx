"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UpsertNoteDialog } from "./upsert-note-dialog";
import Image from "next/image";

interface LinkNoteCardProps {
  note: Doc<"notes">;
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

  const validLinks = note.links || [];

  // YouTube Detection Helper
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Determine header icon based on the first link
  const firstLink = validLinks[0] || "";
  const isFirstGoogleDoc = firstLink.includes("docs.google.com");
  const isFirstYoutube = !!getYouTubeId(firstLink);
  const isFirstGithub = firstLink.includes("github.com");

  return (
    <>
      <Card className="glass md:w-96 group hover:border-primary/30 transition-all mb-4 break-inside-avoid overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2">
            {isFirstGoogleDoc ? (
              <Image src="/doc.png" alt="doc" width={24} height={24} />
            ) : isFirstYoutube ? (
              <Image src="/you.png" alt="Youtube" width={24} height={24} />
            ) : isFirstGithub ? (
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
          {/* Dynamic layout based on the number of links */}
          <div className={validLinks.length > 4 ? "grid grid-cols-2 gap-2" : "flex flex-col gap-4"}>
            {validLinks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No links provided.</p>
            )}

            {validLinks.map((contentUrl, index) => {
              const isGoogleDoc = contentUrl.includes("docs.google.com");
              const youtubeId = getYouTubeId(contentUrl);
              const isYoutube = !!youtubeId;
              const isGithub = contentUrl.includes("github.com");
              
              // Only show thumbnail if there is exactly 1 valid link
              const showYoutubeThumbnail = isYoutube && youtubeId && validLinks.length <= 1;

              return (
                <div key={index} className="flex flex-col min-w-0">
                  {/* YouTube Thumbnail View */}
                  {showYoutubeThumbnail && (
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
                    // Adjust padding/gap slightly if in a 2-column view to prevent cramping
                    className={`flex items-center ${validLinks.length > 4 ? 'gap-2 p-2' : 'gap-3 p-3'} rounded-lg bg-secondary/50 hover:bg-secondary shadow-lg hover:shadow-blue-300/30 transition-all duration-400 border border-border/50 ${showYoutubeThumbnail ? 'mt-0' : ''}`}
                  >
                    {isGoogleDoc ? (
                      <div className="p-2 bg-blue-100/10 rounded-md shrink-0">
                        <Image src="/doc.png" alt="doc" width={validLinks.length > 4 ? 20 : 30} height={validLinks.length > 4 ? 20 : 30} />
                      </div>
                    ) : isYoutube ? (
                      <div className="p-2 bg-red-100/10 rounded-md shrink-0">
                        <Image src="/you.png" alt="Youtube" width={validLinks.length > 4 ? 20 : 30} height={validLinks.length > 4 ? 20 : 30} />
                      </div>
                    ) : isGithub ? (
                      <div className="p-1 rounded-md shrink-0">
                        <Image src="/git.png" alt="Github" width={validLinks.length > 4 ? 24 : 34} height={validLinks.length > 4 ? 24 : 34} />
                      </div>
                    ) : (
                      <div className="p-2 bg-orange-100/10 rounded-md shrink-0">
                        <ExternalLink className={`${validLinks.length > 4 ? 'w-4 h-4' : 'w-6 h-6'} text-orange-500`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium truncate text-foreground">
                        {isGoogleDoc ? "Google Document" : isYoutube ? "YouTube Video" : isGithub ? "GitHub Repository" : "External Link"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate opacity-70">
                        {contentUrl}
                      </p>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <UpsertNoteDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        mode="edit"
        initialData={{
          _id: note._id,
          type: "link",
          links: validLinks, 
        }}
      />
    </>
  );
}