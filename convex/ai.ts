import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export const generateGoalPlan = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
      const today = new Date().toDateString();
      const response = await openai.chat.completions.create({
      model: "mistralai/devstral-2-123b-instruct-2512",
      messages: [
        {
          role: "system",
          content: `You are a helpful productivity assistant. 
          Today's date is ${today}.
          The user will give you a goal (e.g., "Learn React in 30 days").
          You must generate a structured plan.
          
          You must return ONLY a valid JSON object. Do not include markdown code blocks like \`\`\`json.
          
          Required JSON Structure:
          {
            "title": "Refined and concise goal title",
            "description": "A short, motivating summary of the goal",
            "category": "Choose the most relevant category from the list below",
            "color": "A hex color code (e.g., #FF5733) relevant to the category",
            "targetDate": "must be in the format MM-DD-YYYY",
            "tasks": [
              {
                "title": "Clear task title",
                "description": "What the user should do in this task",
                "priority": "high" | "medium" | "low",
                "estimatedTime": number (in minutes),
                "dueDateOffset": number (days from now, e.g. 1 for tomorrow)
              }
            ]
          }
          
       Available categories (choose the closest match):
      - AI & ML
      - Web-Dev
      - Mobile-App-Dev
      - Data-Science & Analytics
      - Cloud & DevOps
      - Cybersecurity
      - Programming-Fundamentals
      - Semester-Exams
      - Competitive-Exams
      - School & College Studies
      - Career & Job Preparation
      - Work & Professional Projects
      - Business & Startup
      - Personal Development
      - Health & Fitness
      - Mental Wellness
      - Finance & Investing
      - Productivity & Habits
      - Creative (Design, Writing, Content)
      - Language Learning
      - Hobbies
      - Travel & Lifestyle
      - Other

     CRITICAL RULES FOR TASK GENERATION:
          1. **ONE TASK PER DAY MINIMUM:** You MUST generate a separate task object for EVERY single day from Day 0 (today) up to the targetDate.
          2. **NO SKIPPING:** If the targetDate is 30 days away, the "tasks" array MUST contain at least 30 objects.
          3. **SEQUENTIAL OFFSETS:** You must explicitly set "dueDateOffset" to 0, 1, 2, 3... N for every consecutive day. Do not skip numbers.
          4. **REALISM:** If a goal requires 30 days, ensure you actually generate 30 distinct tasks. Do not just say "Review" for 5 days; break it down.
          
          General Rules:
          - Select ONE best-fit category.
          - If the user implies a duration (e.g. "in a month"), set targetDate exactly that far away and fill every day.
          - If the goal is very long-term (e.g. "Become a Doctor"), create a detailed plan for the FIRST 30-60 DAYS only, and set the targetDate to the end of that phase.
          `,
        },
  {
    role: "user",
    content: args.prompt,
  },
],
      temperature: 0.2, // Lower temperature for more consistent JSON structure
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    // Cleaning: Sometimes models wrap the response in markdown blocks even when told not to.
    // This removes ```json and ``` from the start/end if present.
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error("AI Output that failed to parse:", cleanContent);
      throw new Error("Failed to generate a valid plan. Please try again.");
    }
  },
});