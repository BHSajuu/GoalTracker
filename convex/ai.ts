import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";

export const generateGoalPlan = action({
  args: {
    userId: v.id("users"),
    prompt: v.string(),
    mode: v.union(v.literal("fast"), v.literal("smart")),
  },
  handler: async (ctx, args) => {
    
    try {
      await ctx.runMutation(internal.rateLimit.increment, { userId: args.userId });
    } catch (error: any) {
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
        throw new Error("Daily AI limit reached (8/8). Please try again tomorrow!");
      }
      throw error;
    }

    const today = new Date().toDateString();

    let openai: OpenAI;
    let modelId: string;
    let temperature: number;
    let maxTokens: number;


    if (args.mode === "fast") {
      if (!process.env.NVIDIA_LLAMA_INSTRUCT_API_KEY) {
        throw new Error("Missing NVIDIA_LLAMA_INSTRUCT_API_KEY in Environment Variables.");
      }

      modelId = "meta/llama-3.1-8b-instruct";
      temperature = 0.5;
      maxTokens = 2048;
      openai = new OpenAI({
        apiKey: process.env.NVIDIA_LLAMA_INSTRUCT_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
    } else {
      if (!process.env.NVIDIA_STEPFUN_AI_API_KEY) {
        throw new Error("Missing NVIDIA_STEPFUN_AI_API_KEY in Environment Variables.");
      }

      modelId = "stepfun-ai/step-3.5-flash";
      temperature = 0.8;
      maxTokens = 16384;
      openai = new OpenAI({
        apiKey: process.env.NVIDIA_STEPFUN_AI_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
    }

    console.log(`🚀 AI Agent Starting | Mode: ${args.mode} | Model: ${modelId}`);

    try {
      const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: "system",
            content: `You are an expert productivity planner.
          Today's date is ${today}.
          
          OBJECTIVE:
          The user will give you a goal.
          You must generate a concrete, step-by-step execution plan in STRICT JSON format.

          TIMELINE & TARGET DATE RULES (CRITICAL):
          1. If the user specifies a timeframe (e.g., "in 14 days", "30 days", "by next week"), generate exactly that many tasks up to that target date.
          2. If the user DOES NOT specify a timeframe, you MUST dynamically analyze the goal's complexity and assign a realistic timeframe (e.g., 7 days for a simple task, 45 days for a complex project).
          3. You MUST generate 1 task per day from offset 0 up to your calculated target date.

          CRITICAL OUTPUT RULES:
          1. Output ONLY valid JSON. 
          2. Do NOT include markdown formatting (no \`\`\`json).
          3. Do NOT include introductory text.
          4. If you utilize a reasoning chain (typical for "smart" mode), keep it internal or wrapped in <think> tags.

          REQUIRED JSON STRUCTURE:
          {
            "title": "Refined Goal Title",
            "description": "Inspiring summary",
            "category": "Category Name (choose from standard list)",
            "color": "A unique hex color code (e.g., #FF5733)",
            "targetDate": "MM-DD-YYYY",
            "tasks": [
              {
                "title": "Actionable Task Title",
                "description": "Specific instructions for this day",
                "priority": "high" | "medium" | "low",
                "estimatedTime": number (minutes),
                "dueDateOffset": number (0 for today, 1 for tomorrow, etc.)
              }
            ] 
          }

          Available Categories:
          - AI & ML, Web-Dev, Mobile-App-Dev, Data-Science, Analytics
          - Cloud & DevOps, Cybersecurity, Programming, CS core
          - Semester-Exams, Competitive-Exams
          - Work & Professional Projects
          - Finance & Investing, Creative, Other
          `,
          },
          {
            role: "user",
            content: args.prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0].message.content;

      if (!content) {
        throw new Error("AI returned empty content.");
      }

      console.log("✅ AI Response Received. Length:", content.length);

      // --- ROBUST PARSING LOGIC ---

      // 1. Remove <think> tags (Specific to DeepSeek R1 models)
      // We use a regex that captures newlines to ensure we get the whole block
      let cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      // 2. Remove Markdown code blocks
      cleanContent = cleanContent.replace(/```json/g, "").replace(/```/g, "");

      // 3. Extract the JSON object by finding the first '{' and last '}'
      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(cleanContent);
      } catch (error) {
        throw new Error("The AI generated a plan, but it wasn't valid JSON. Please try 'Turbo' mode for now.");
      }

    } catch (error: any) {
      throw new Error(`AI Error: ${error.message}`);
    }
  },
});


export const analyzeImage = action({
  args: {
    userId: v.id("users"),
    imageBase64: v.string(),
  },
  handler: async (ctx, args) => {
   
    try {
      await ctx.runMutation(internal.rateLimit.increment, { userId: args.userId });
    } catch (error: any) {
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) throw new Error("Daily AI limit reached (8/8). Please try again tomorrow!");
      throw error;
    }

    const apiKey = process.env.NVIDIA_LLAMA_VISION_API_KEY;

    if (!apiKey) {
      throw new Error("Missing NVIDIA_LLAMA_VISION_API_KEY in Environment Variables. Please add it in the Convex Dashboard.");
    }

    const modelId = "meta/llama-3.2-11b-vision-instruct";

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    console.log("👁️ Vision Analysis Starting...");

    const systemPrompt = `You are a strict, highly professional image analysis AI.
    Analyze the provided image and extract information EXACTLY in the following plain-text structure.

    CRITICAL RULES:
    1. DO NOT use any markdown symbols (no asterisks *, no bold **, no hashes #).
    2. Respond strictly with these uppercase headers followed by a colon and the content.

    SUMMARY:
    [Provide a brief, clear summary of what the image is]

    EXTRACTED TEXT:
    [Write out any important text found in the image. If there is no text, write "No text found."]

    KEY INSIGHTS:
    - [Insight 1]
    - [Insight 2]`;

    try {
      const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: args.imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      });

      let result = response.choices[0].message.content || "";
      // 1. Remove **bold** and *italics* while preserving the text inside
      result = result.replace(/\*\*?([\s\S]*?)\*\*?/g, "$1");
      // 2. Remove markdown headers (e.g., ### )
      result = result.replace(/^[\t ]*#+\s+/gm, "");
      // 3. Trim extra whitespace
      result = result.trim();

      console.log("✅ Vision Analysis Complete");

      return result;
    } catch (error: any) {
      throw new Error("Failed to analyze image: " + error.message);
    }
  },
});


export const suggestDescription = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    type: v.union(v.literal("goal"), v.literal("task")),
    goalTitle: v.optional(v.string()),
    goalDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
   
    try {
      await ctx.runMutation(internal.rateLimit.increment, { userId: args.userId });
    } catch (error: any) {
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) throw new Error("Daily AI limit reached (8/8). Please try again tomorrow!");
      throw error;
    }

    const apiKey = process.env.NVIDIA_LLAMA_INSTRUCT_API_KEY;

    if (!apiKey) {
      throw new Error("Missing NVIDIA API Key in Environment Variables.");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const systemPrompt = args.type === "goal"
      ? `You are an expert productivity coach. The user will provide a goal title. Write a short, inspiring, and actionable description in 120 characters max.
      
      CRITICAL INSTRUCTIONS:
      1. OUTPUT ONLY THE FINAL DESCRIPTION.
      2. DO NOT use introductory phrases (like "Here is a description").
      3. DO NOT use quotation marks around the output.`
      : `You are an expert productivity coach. The user will provide a task title. Write a short, clear, and actionable description detailing how to execute this task in 80 characters max.
        
      ${args.goalTitle ? `CONTEXT: This task belongs to the overarching goal titled: "${args.goalTitle}".` : ''}
      ${args.goalDescription ? `GOAL DESCRIPTION: "${args.goalDescription}".` : ''}
      Use this context to make the task description more relevant.
      
      CRITICAL INSTRUCTIONS:
      1. OUTPUT ONLY THE FINAL DESCRIPTION.
      2. DO NOT use introductory phrases.
      3. DO NOT use quotation marks around the output.`;

    try {
      const response = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.title }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      let content = response.choices[0].message.content?.trim() || "";

      // Clean up hallucinated quotes if they appear
      content = content.replace(/^["']|["']$/g, "").trim();

      return content;

    } catch (error: any) {
      throw new Error("Failed to generate description.");
    }
  },
});


export const generateAnalyticsInsights = action({
  args: {
    userId: v.id("users"),
    statsData: v.string(), // We will pass a stringified JSON of the user's stats
  },
  handler: async (ctx, args) => {
    
    try {
      await ctx.runMutation(internal.rateLimit.increment, { userId: args.userId });
    } catch (error: any) {
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) throw new Error("Daily AI limit reached (8/8). Please try again tomorrow!");
      throw error;
    }

    const apiKey = process.env.NVIDIA_MISTRAL_8x22b_API_KEY;

    if (!apiKey) {
      throw new Error("Missing NVIDIA_MISTRAL_8x22b_API_KEY in Environment Variables. Please add it in the Convex Dashboard.");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    try {
      const response = await openai.chat.completions.create({
        model: "mistralai/mixtral-8x22b-instruct-v0.1",
        messages: [
          {
            role: "system",
            content: `You are an elite productivity coach and data scientist. 
                  The user can already see their charts and raw numbers. DO NOT repeat stats.

                  CRITICAL RULE: NO PARAGRAPHS ALLOWED. You must explain everything EXCLUSIVELY in short, highly analytical bullet points. 

                  FORMAT YOUR RESPONSE STRICTLY WITH THESE 2 SECTIONS:

                  ### 🧠 Deep Analysis
                  * [Insightful bullet point explaining a hidden pattern in their workflow]
                  * [Insightful bullet point explaining why completion rates are what they are]
                  * [Insightful bullet point identifying a specific bottleneck or success pattern]

                  ### ⚡ Strategic Action Plan
                  * [Specific, actionable bullet point step to take this week]
                  * [Specific, actionable bullet point step to fix the identified bottleneck]
                  * [Specific, actionable bullet point step to optimize scheduling]

                  Keep the tone professional, direct, and highly analytical.`
          },
          {
            role: "user",
            content: `Here is my data payload. Give me the analysis and action plan strictly in bullet points:\n\n${args.statsData}`
          }
        ],
        max_tokens: 800,
        temperature: 0.4,
        top_p: 0.9,
      });

      return response.choices[0]?.message?.content || "Failed to generate AI insights.";
    } catch (error) {
      throw new Error("Failed to generate analytics insights.");
    }
  }
});