import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

export const generateGoalPlan = action({
  args: {
    prompt: v.string(),
    mode: v.union(v.literal("fast"), v.literal("smart")),
  },
  handler: async (ctx, args) => {
    const today = new Date().toDateString();

    let openai: OpenAI;
    let modelId: string;
    let temperature: number;
    let maxTokens: number;


    if (args.mode === "fast") {
      if (!process.env.NVIDIA_MINIMAXAI_API_KEY) {
        throw new Error("Missing NVIDIA_MINIMAXAI_API_KEY in Environment Variables.");
      }

      modelId = "minimaxai/minimax-m2";
      temperature = 1;
      maxTokens = 8192;
      openai = new OpenAI({
        apiKey: process.env.NVIDIA_MINIMAXAI_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
    } else {
      if (!process.env.NVIDIA_MISTRAL_API_KEY) {
        throw new Error("Missing NVIDIA_MISTRAL_API_KEY in Environment Variables.");
      }

      modelId = "stepfun-ai/step-3.5-flash";
      temperature = 1;
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
          The user will give you a goal (e.g., "Learn React in 30 days").
          You must generate a concrete, step-by-step execution plan in STRICT JSON format.

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
            "color": "Hex Code",
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
          - AI & ML, Web-Dev, Mobile-App-Dev, Data-Science & Analytics
          - Cloud & DevOps, Cybersecurity, Programming-Fundamentals
          - Semester-Exams, Competitive-Exams, School & College Studies
          - Career & Job Preparation, Work & Professional Projects
          - Business & Startup, Personal Development, Health & Fitness
          - Mental Wellness, Finance & Investing, Productivity & Habits
          - Creative, Language Learning, Hobbies, Other

          PLANNING LOGIC:
          1. **Coverage:** You MUST generate a task for EVERY day from offset 0 up to the target date.
          2. **Sequence:** Ensure tasks follow a logical progression (e.g., Basics -> Practice -> Project).
          3. **Realism:** If the user says "30 days", generate exactly 30 distinct tasks with offsets 0 to 29.
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
        console.error("❌ JSON Parse Failed. Raw Clean Content:", cleanContent);
        throw new Error("The AI generated a plan, but it wasn't valid JSON. Please try 'Turbo' mode for now.");
      }

    } catch (error: any) {
      console.error("🔥 AI Generation Error:", error.message);
      // Pass the error message back to the client so you see it in the Toast
      throw new Error(`AI Error: ${error.message}`);
    }
  },
});


export const analyzeImage = action({
  args: {
    imageBase64: v.string(),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.NVIDIA_LLAMA_VISION_API_KEY;

    if (!apiKey) {
      throw new Error("Missing NVIDIA_LLAMA_VISION_API_KEY in Environment Variables. Please add it in the Convex Dashboard.");
    }

    // Llama 3.2 Vision (11B)
    const modelId = "meta/llama-3.2-11b-vision-instruct";

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    console.log("👁️ Vision Analysis Starting...");

    try {
      const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: args.prompt || "Analyze this image. If it contains text, transcribe it. If it's a diagram, explain it. Keep it concise.",
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
        temperature: 0.2,
      });

      const result = response.choices[0].message.content;
      console.log("✅ Vision Analysis Complete");

      return result;
    } catch (error: any) {
      console.error("🔥 Vision Error:", error);
      throw new Error("Failed to analyze image: " + error.message);
    }
  },
});


export const generateGoalImage = action({
  args: {
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.NVIDIA_FLUX_1_SCHNELL_API_KEY;
    if (!apiKey) throw new Error("Missing NVIDIA_FLUX_1_SCHNELL_API_KEY");

    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";

    console.log("🎨 Generating Dream Board Image...");

    try {
      const response = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          prompt: "A high-quality, inspiring, modern, cinematic, abstract 3d render representing this goal: " + args.description,
          width: 1024,
          height: 1024,
          steps: 4, 
          seed: Math.floor(Math.random() * 1000000) // Random seed for variety
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // NVIDIA API returns a Base64 string in artifacts
      const base64 = data.artifacts?.[0]?.base64;
      
      if (!base64) {
        throw new Error("No image data returned from API");
      }

      // 3. Return as a Data URL
      const imageUrl = `data:image/jpeg;base64,${base64}`;
      
      console.log("✅ Image Generated Successfully");
      return imageUrl;

    } catch (error: any) {
      console.error("🔥 Image Gen Error:", error);
      throw new Error("Failed to generate image: " + error.message);
    }
  },
});