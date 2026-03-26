"use client";

import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Mail, Link as LinkIcon, Send, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface ShareNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: Id<"notes">;
  userId: Id<"users">;
}

export function ShareNoteDialog({ open, onOpenChange, noteId, userId }: ShareNoteDialogProps) {
  const { userEmail } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const createShareToken = useMutation(api.notes.createShareToken);
  const sendShareEmail = useAction(api.email.sendShareEmail);

  useEffect(() => {
    if (open && !shareToken) {
      setIsGenerating(true);
      createShareToken({ id: noteId, userId })
        .then((token) => {
          setShareToken(token);
        })
        .catch(() => {
          toast.error("Failed to generate share link");
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [open, noteId, userId, createShareToken, shareToken]);

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !shareUrl) return;

    setIsSending(true);
    try {
      await sendShareEmail({
        recipientEmail: email,
        shareLink: shareUrl,
        // Pass the user's email prefix as their name if no name is available
        senderName: userEmail?.split('@')[0] || "A Zielio User", 
      });
      toast.success(`Share link sent securely to ${email}`);
      setEmail("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold">Share via Zielio</DialogTitle>
              <DialogDescription className="text-xs">
                Anyone with this link can view a public copy of this note.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "email")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-white/5 h-10">
            <TabsTrigger value="link" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <LinkIcon className="w-3.5 h-3.5 mr-2" /> Copy Link
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 bg-black/10 p-4 rounded-xl border border-white/5">
            <TabsContent value="link" className="mt-0 space-y-3 focus-visible:outline-none">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Public URL</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  readOnly 
                  value={isGenerating ? "Generating secure link..." : shareUrl} 
                  className="bg-black/20 border-white/10 text-xs font-mono h-9"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  className="px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  onClick={handleCopy}
                  disabled={isGenerating || !shareToken}
                >
                  {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleSendEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Recipient Email</Label>
                  <Input 
                    type="email" 
                    required 
                    placeholder="colleague@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/20 border-white/10 text-sm h-10"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                  disabled={isGenerating || isSending || !shareToken || !email}
                >
                  {isSending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending securely...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send Share Link</>
                  )}
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}