import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code"), v.literal("mixed")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    code: v.optional(v.string()),
    links: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      userId: args.userId,
      goalId: args.goalId,
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
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code"), v.literal("mixed"))),
    language: v.optional(v.string()),
    code: v.optional(v.string()),
    links: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
export const getByGoal = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();

    // Map over notes to generate signed URLs for images
    return await Promise.all(
      notes.map(async (note) => {
        let imageUrls: (string | null)[] = [];

        // Case A: New system (Array of Storage IDs)
        if ((note.type === "image" || note.type === "mixed") && note.images) {
          imageUrls = await Promise.all(
            note.images.map(async (storageId) => {
              // If it's already a full URL (e.g. from external), return it
              if (storageId.startsWith("http")) return storageId;
              // Otherwise, fetch the signed URL from Convex Storage
              return await ctx.storage.getUrl(storageId);
            })
          );
        }
        // Case B: Legacy system (Single URL in content)
        else if ((note.type === "image" || note.type === "mixed") && note.content && note.content.startsWith("http") && !note.content.includes(" ")) {
          imageUrls = [note.content];
        }

        // Return the note with an extra 'imageUrls' property
        return {
          ...note,
          imageUrls: imageUrls.filter((url): url is string => url !== null)
        };
      })
    );
  },
});

// Remove note and clean up stored files
export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);

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
    imageUrl: v.string(),
    analysisText: v.string(),
  },
  handler: async (ctx, args) => {
    
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");

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