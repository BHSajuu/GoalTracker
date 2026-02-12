"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Zap,
  ArrowRight,
  Sparkles,
  Trophy
} from "lucide-react";
import Image from "next/image";
import { PrivacyDialog } from "@/components/legal/privacy-dialog";
import { TermsDialog } from "@/components/legal/terms-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

//  Utility for Scroll Animations 
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}


const HeroVisual = () => (
  <div className="relative w-full max-w-150 aspect-4/3 mx-auto perspective-1000">
    {/* Floating Elements Background */}
    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />

    {/* Main Dashboard Card Mockup */}
    <div className="relative w-full h-full bg-card/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-float transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
      {/* Fake Header */}
      <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="ml-4 h-2 w-20 bg-white/5 rounded-full" />
      </div>

      {/* Fake Content Grid */}
      <div className="p-6 grid grid-cols-3 gap-4">
        {/* Sidebar */}
        <div className="col-span-1 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-full bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {/* Main Content */}
        <div className="col-span-2 space-y-4">
          {/* Chart Area */}
          <div className="h-32 bg-linear-to-br from-primary/10 to-accent/5 rounded-xl border border-primary/20 flex items-end justify-between p-4 pb-0">
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
              <div key={i} className="w-3 bg-primary/40 rounded-t-sm hover:bg-primary/80 transition-colors" style={{ height: `${h}%` }} />
            ))}
          </div>

          {/* Task Items */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-4 h-4 rounded border border-primary/50" />
                <div className="h-2 w-24 bg-white/10 rounded-full" />
                <div className="ml-auto h-2 w-8 bg-accent/20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Floating Badge 1 */}
    <div className="absolute -top-6 right-1 md:-right-6 p-4 bg-background/80 backdrop-blur border border-primary/30 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '1s' }}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <CheckSquare className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Daily Tasks</div>
          <div className="text-sm font-bold text-foreground">12/12 Done</div>
        </div>
      </div>
    </div>

    {/* Floating Badge 2 */}
    <div className="absolute -bottom-8 md:-left-8 p-4 bg-background/80 backdrop-blur border border-accent/30 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '2s' }}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Trophy className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
          <div className="text-sm font-bold text-foreground">7 Days 🔥</div>
        </div>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ imageSrc, title, desc, delay }: { imageSrc: string, title: string, desc: string, delay: number }) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={cn(
        "group relative p-5 rounded-2xl bg-card/30 border border-white/5 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      <div className="relative z-10">
        <Image 
            src={imageSrc} 
            alt={title} 
            width={40} 
            height={40} 
            className="m-3 object-contain"
          />
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};



function VisitorCounter() {
  const trackVisitor = useMutation(api.visitors.trackVisitor);
  const visitorCount = useQuery(api.visitors.getVisitorCount);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const track = async () => {
      try {
        // 1. Call our internal API
        const response = await fetch("/api/geo");
        if (!response.ok) return; // Silent fail if API down
        
        const data = await response.json();

        // 2. STRICT MODE: Only track if we have a valid-looking IP
        if (data.ip) {
           await trackVisitor({
            ip: data.ip,
            city: data.city || "Unknown",
            country: data.country || "Unknown",
          });
        }
      } catch (error) {
        console.error("Tracking error:", error);
      }
    };

    track();
  }, [trackVisitor]);

  // Loading State
  if (visitorCount === undefined) {
    return (
      <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 opacity-50">
        <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 animate-fade-in">
      <div className="flex -space-x-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center overflow-hidden">
             <div className={`w-full h-full bg-linear-to-br ${i===1?'from-blue-500':i===2?'from-purple-500':'from-green-500'} to-transparent opacity-80`} />
          </div>
        ))}
      </div>
      <div className="text-sm">
        <p className="font-bold text-foreground flex items-center gap-2">
          {/* Default to 1 so the UI doesn't look broken initially */}
          <span className="text-primary">{(visitorCount || 1).toLocaleString()}</span> Students Joined
        </p>
        <p className="text-muted-foreground text-xs">Live tracking active</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { userId, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userId) {
      router.push("/dashboard");
    }
  }, [userId, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">

      {/* Background Grid & Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-77.5 w-77.5 rounded-full bg-primary/20 opacity-20 blur-[100px]" />
        <div className="absolute right-0 bottom-0 -z-10 h-77.5 w-77.5 rounded-full bg-accent/20 opacity-20 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky md:top-10 top-5 z-50 w-[90vw] md:w-[70vw] mx-auto border-b border-white/5 bg-background/60 backdrop-blur-md supports-backdrop-filter:bg-background/60 rounded-3xl shadow-[0_0_15px_rgba(147,197,253,0.25)] hover:shadow-[0_0_20px_rgba(147,197,253,0.3)] transition-all duration-400">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10 border border-primary/20 animate-glow-pulse">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Zielio</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto relative pt-20 pb-32 md:pt-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-3 h-3" />
                <span>The Future of Student Productivity</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Stop Dreaming. <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent animate-gradient">
                  Start Shipping.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Zielio isn't just a todo list. It's a complete operating system for ambitious students to track goals, manage projects, and maintain laser focus.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all duration-300">
                    Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                    How it Works
                  </Button>
                </Link>
              </div>

              {/* Mini Social Proof */}
              {/* <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p>Join 1,000+ Students</p>
              </div> */}
              <VisitorCounter/>
            </div>

            {/* Right: 3D Visual */}
            <div className="flex-1 w-full max-w-150 lg:max-w-none">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto md:py-24 py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to <span className="text-primary">excel</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Built on a modern stack for speed and reliability. Your academic weapon is here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
              imageSrc="/ai.png"
              title="AI Powered Goal Creation"
              desc="Transform vague ideas into concrete roadmaps. Our AI breaks down your ambitions into actionable tasks instantly."
              delay={0}
            />
            
            <FeatureCard
              imageSrc="/ai3.png"
              title="AI Powered Overdue Scheduler"
              desc="Fell behind? Our AI agent automatically detects overdue tasks and intelligently reschedules them so you never lose momentum."
              delay={500}
            />

            <FeatureCard
              imageSrc="/algo.png"
              title="Plan My Day Algorithm"
              desc="Overwhelmed? Our smart algorithm analyzes your pending tasks, deadlines, and available hours to curate the perfect daily schedule."
              delay={200}
            />

            <FeatureCard
              imageSrc="/va.png"
              title="Visual Analytics"
              desc="Don't just guess. See your efficiency trends, completion rates, and daily streaks in real-time."
              delay={300}
            />
            
            <FeatureCard
              imageSrc="/note.png"
              title="Rich Notes"
              desc="Attach diagrams, screenshots, and links directly to your goals. Keep your resources where your work is."
              delay={400}
            />

             <FeatureCard
              imageSrc="/dev.png"
              title="Dev-Ready Workflow"
              desc="Designed by developers for developers. Track your coding projects, bug fixes, and learning paths."
              delay={100}
            />

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className=" py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-10 md:p-16 text-center border border-primary/20 shadow-[0_0_60px_rgba(0,212,255,0.2)]">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to upgrade your workflow?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join the community of students who are taking control of their future. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 text-lg bg-foreground text-background hover:bg-foreground/90">
                  Start Tracking Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Zielio</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <PrivacyDialog />
            <TermsDialog />
            <Link href="https://github.com/BHSajuu/GoalTracker.git" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Zielio. Built for builders.
          </p>
        </div>
      </footer>
    </main>
  );
}