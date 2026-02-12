import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Generate a URL for uploading files
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// 2. Create a new note 
export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.id("goals"),
    // UPDATE: Added "code" to the union
    type: v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code")),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    // UPDATE: Added language arg
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      userId: args.userId,
      goalId: args.goalId,
      type: args.type,
      content: args.content,
      images: args.images,
      language: args.language,
      createdAt: Date.now(),
    });
  },
});

// 3. Update an existing note
export const update = mutation({
  args: {
    id: v.id("notes"),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    // UPDATE: Added "code" to the union
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("code"))),
    // UPDATE: Added language arg
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// 4. Get notes 
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
        if (note.type === "image" && note.images) {
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
        else if (note.type === "image" && note.content) {
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

// 5. Remove note (and clean up stored files)
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