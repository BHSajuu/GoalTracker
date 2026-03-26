import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to reuse your exact image URL resolution logic for both queries
async function resolveNoteImages(ctx: any, notes: any[]) {
  return await Promise.all(
    notes.map(async (note) => {
      let imageUrls: (string | null)[] = [];

      // Case A: New system (Array of Storage IDs)
      if ((note.type === "image" || note.type === "mixed") && note.images) {
        imageUrls = await Promise.all(
          note.images.map(async (storageId: string) => {
            if (storageId.startsWith("http")) return storageId;
            return await ctx.storage.getUrl(storageId);
          })
        );
      }
      // Case B: Legacy system (Single URL in content)
      else if ((note.type === "image" || note.type === "mixed") && note.content && note.content.startsWith("http") && !note.content.includes(" ")) {
        imageUrls = [note.content];
      }

      return {
        ...note,
        imageUrls: imageUrls.filter((url): url is string => url !== null)
      };
    })
  );
}

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    fileId: v.optional(v.id("noteFiles")),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code"), v.literal("mixed")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    code: v.optional(v.string()),
    links: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");
    if (goal.userId !== args.userId) throw new Error("Unauthorized to add notes to this goal");

    return await ctx.db.insert("notes", {
      userId: args.userId,
      goalId: args.goalId,
      fileId: args.fileId,
      type: args.type,
      content: args.content,
      images: args.images,
      language: args.language,
      code: args.code,
      links: args.links,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    userId: v.id("users"),
    fileId: v.optional(v.id("noteFiles")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code"), v.literal("mixed"))),
    language: v.optional(v.string()),
    code: v.optional(v.string()),
    links: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    const note = await ctx.db.get(id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== userId) throw new Error("Unauthorized to update this note");

    await ctx.db.patch(id, updates);
  },
});

export const getByGoal = query({
  args: { 
    goalId: v.id("goals"),
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) return [];

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();

    return await resolveNoteImages(ctx, notes);
  },
});

// Required to build the file tree on frontend, properly resolving images!
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return await resolveNoteImages(ctx, notes);
  },
});

export const remove = mutation({
  args: { 
    id: v.id("notes"),
    userId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== args.userId) throw new Error("Unauthorized to delete this note");

    // If it has storage IDs, delete the files from storage
    if (note && note.images) {
      for (const storageId of note.images) {
        // Only attempt to delete if it looks like a Convex ID (not an external URL)
        if (!storageId.startsWith("http")) {
          try {
            await ctx.storage.delete(storageId);
          } catch (e) {
            console.error("Failed to delete storage file:", storageId);
          }
        }
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const saveImageAnalysis = mutation({
  args: {
    id: v.id("notes"),
    userId: v.id("users"),
    imageUrl: v.string(),
    analysisText: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== args.userId) throw new Error("Unauthorized to analyze this note");

    // Get the existing analysis map, or create a new empty one
    const currentAnalysis = note.analysis ?? {};

    // This SETS the text for this specific URL. If it exists, it replaces it.
    currentAnalysis[args.imageUrl] = args.analysisText;

    // Patch the note with the updated map
    await ctx.db.patch(args.id, {
      analysis: currentAnalysis,
    });

    return true;
  },
});

// SHARING FEATURES BELOW
export const createShareToken = mutation({
  args: {
    id: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    if (note.userId !== args.userId) throw new Error("Unauthorized to share this note");

    if (note.shareToken) return note.shareToken;

    // Generate a secure, unique token
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await ctx.db.patch(args.id, { shareToken });
    return shareToken;
  }
});

export const getByShareToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.token))
      .first();
      
    if (!note) return null;

    const resolvedNotes = await resolveNoteImages(ctx, [note]);
    
    // Fetch the sender's user document
    const sender = await ctx.db.get(note.userId);
    
    // Return an object containing both the note and the sender's name/email
    return {
      note: resolvedNotes[0],
      senderName: sender?.name || sender?.email || "A Zielio User"
    };
  }
});

export const saveSharedNote = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    targetGoalId: v.id("goals"),
    fileName: v.string(), // NEW: Ask for the file name
  },
  handler: async (ctx, args) => {
    // 1. Verify target goal belongs to the user cloning the note
    const goal = await ctx.db.get(args.targetGoalId);
    if (!goal || goal.userId !== args.userId) throw new Error("Invalid target goal");

    // 2. Fetch the shared note
    const sharedNote = await ctx.db
      .query("notes")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.token))
      .first();
      
    if (!sharedNote) throw new Error("Shared note not found or access revoked");

    // 1. Create a new NoteFile folder for this note inside the target Goal
    const newFileId = await ctx.db.insert("noteFiles", {
      userId: args.userId,
      goalId: args.targetGoalId,
      name: args.fileName,
      createdAt: Date.now(),
    });

    // 2. Duplicate metadata into new user's account, attaching it to the new File
    const newNoteId = await ctx.db.insert("notes", {
      userId: args.userId,
      goalId: args.targetGoalId,
      fileId: newFileId, // Attach the fileId here!
      type: sharedNote.type,
      content: sharedNote.content,
      images: sharedNote.images, 
      language: sharedNote.language,
      code: sharedNote.code,
      links: sharedNote.links,
      analysis: sharedNote.analysis,
      createdAt: Date.now(),
    });

    return newNoteId;
  }
});