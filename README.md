# ⚡ Zielio

![Zielio Dashboard](public/dash.png)

<div align="center">

**The Operating System for Ambitious Students & Developers**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=for-the-badge&logo=firebase)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[View Demo](https://goal-tracker-01.vercel.app) · [Report Bug](https://github.com/BHSajuu/GoalTracker/issues) · [Request Feature](https://github.com/BHSajuu/GoalTracker/issues)

</div>

---

## 🚀 About The Project

**Zielio** (formerly GoalTracker) is not just another to-do list. It is an intelligent productivity platform designed specifically for students and developers who want to stop dreaming and start shipping.

Built with a modern, real-time stack (**Next.js 16 + Convex**), Zielio leverages **Generative AI** and advanced deterministic algorithms to transform vague ambitions into concrete, actionable roadmaps. It solves the "overwhelm" problem by dynamically managing your schedule, tracking your true focus efficiency, and organizing your knowledge base in one unified workspace.

---

## ✨ Core Features & Capabilities

### 🧠 Core AI Integrations
* **🤖 Hybrid AI Scheduling Agent (Chronological Repacking)**
    * **The Problem:** You fell behind on your schedule. 
    * **The Solution:** Our "Schedule Healing" algorithm detects drift and rebalances your workload. By using AI for heuristic sorting and strict TypeScript math for bin-packing, it chronologically repacks your missed tasks into future days without violating your daily time capacities or breaking goal dependencies. Fully timezone-aware.
* **🎯 AI-Powered Goal Breakdown**
    * Transform vague ideas (e.g., "Learn Next.js") into concrete roadmaps instantly. The AI agent breaks down massive ambitions into manageable, bite-sized tasks with smart time estimations.
* **💡 "Ask AI" Analytics Insights**
    * Don't just look at charts. Click the **Ask AI** button on your analytics dashboard to get a personalized, LLM-generated breakdown of your productivity trends, bottlenecks, and actionable advice based entirely on your actual data.
* **👁️ AI Image Analysis**
    * Upload a screenshot of a diagram, textbook page, or complex code block, and use the built-in AI Image Analysis feature to extract text, summarize concepts, or explain the visual data directly into your notes.

### ⏱️ The Productivity Engine
* **📅 Plan My Day Algorithm**
    * Overwhelmed by a long list? Our smart algorithm analyzes your pending tasks, deadlines, and available hours to curate the perfect daily schedule for you.
* **⏳ Deep-Integration Focus Timer**
    * Not just a basic countdown. The Focus Timer locks you into a specific task, tracks your exact active session time, and directly feeds this data back into the database to power your efficiency metrics.
* **🔮 Predictive Analytics (The Estimation Multiplier)**
    * Stop guessing how long tasks take. The system algorithmically analyzes your past Focus Timer sessions (comparing your Estimated vs. Actual time) to calculate a personal "Estimation Multiplier". It uses this historical data to predict how long your future tasks will actually take based on your real-world pacing.
* **🔥 Streak & Activity Tracking**
    * Stay motivated with a visual, GitHub-style contribution calendar tracking your daily task completions and focus streaks.

### 📊 Data & Knowledge Base
* **📈 Visual Analytics Dashboard**
    * See your efficiency trends, completion rates, and focus distribution in real-time with beautiful interactive charts built with Recharts.
* **📝 Multi-Modal Notes & Filebase System**
    * A robust notes system powered by Convex File Storage. Beyond text, attach dedicated Code Snippets (with syntax highlighting), Image galleries, and Link collections directly to your goals.

---

## 🛠️ Tech Stack

**Frontend Environment:**
* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
* **UI Components:** [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
* **Animations:** Framer Motion & Tailwind Animate
* **Editor & Syntax:** Tiptap & React Syntax Highlighter

**Backend & Data:**
* **Database & Real-time:** [Convex](https://convex.dev/) (Reactive backend & File Storage)
* **AI Integration:** NVIDIA API 
* **Authentication:** Custom OTP Authentication (Nodemailer + Input-OTP)
* **Data Validation:** Zod + React Hook Form

---

## 🏁 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

* Node.js (v18 or higher)
* npm or bun

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/BHSajuu/GoalTracker.git
    cd GoalTracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Convex deployment URL and AI API keys:
    ```env
    # .env.local
    CONVEX_DEPLOYMENT=your_convex_deployment_url
    NEXT_PUBLIC_CONVEX_URL=your_public_convex_url
    NVIDIA_MISTRAL_API_KEY=your_nvidia_or_openai_api_key
    ...others
    ```

4.  **Start the Backend**
    Run the Convex development server to sync your schema and functions:
    ```bash
    npx convex dev
    ```

5.  **Start the Frontend**
    In a new terminal window, start the Next.js development server:
    ```bash
    npm run dev
    ```

6.  **Open the App**
    Visit `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```bash
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Protected application routes
│   │   ├── analytics/    # Visual data visualization & AI Insights
│   │   ├── goals/        # Goal management views
│   │   ├── tasks/        # Task planning & listing
│   │   └── notes/        # Knowledge base & Editor
│   ├── api/              # Next.js API Routes (Geo-location tracking)
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── analytics/        # Recharts visualization components
│   ├── dashboard/        # Sidebar, Header, Streak Calendar
│   ├── tasks/            # Focus Timer & Task Modals
│   ├── notes/            # AI Image Analysis, Filebase & Code editors
│   └── ui/               # Shadcn UI primitives
├── convex/               # Backend logic
│   ├── schema.ts         # Relational database schema definition
│   ├── agent.ts          # Hybrid scheduling algorithm & AI logic
│   ├── rateLimit.ts      # AI usage tracking and limits
│   ├── tasks.ts          # Task CRUD & time tracking
│   ├── noteFiles.ts      # Convex File Storage handling
│   └── notes.ts          # Multi-modal note management
└── public/               # Static assets & Holographic UI elements 