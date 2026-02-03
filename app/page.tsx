"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Target,
  CheckSquare,
  BarChart3,
  Zap,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";

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
    <main className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 animate-glow-pulse">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            GoalForge
          </span>
        </div>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
          >
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Futuristic Goal Tracking
            </span>
          </div>
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground max-w-4xl leading-tight animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          Track Your{" "}
          <span className="text-primary neon-text">Dreams</span>,<br />
          Achieve Your{" "}
          <span className="text-accent">Goals</span>
        </h1>

        <p
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          The ultimate goal tracking platform for ambitious students. Break down
          your goals into daily tasks, track progress, and visualize your
          journey to success.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 mt-10 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link href="/login">
            <Button
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] transition-all text-lg px-8"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            Everything You Need to{" "}
            <span className="text-primary">Succeed</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: "Goal Management",
                description:
                  "Create and organize goals with custom categories - AI & ML, Web Dev, Exams, and more.",
                color: "#00d4ff",
              },
              {
                icon: CheckSquare,
                title: "Task Tracking",
                description:
                  "Break down goals into daily tasks. Track completion and maintain momentum.",
                color: "#10b981",
              },
              {
                icon: BarChart3,
                title: "Visual Analytics",
                description:
                  "Beautiful charts and insights to visualize your progress and stay motivated.",
                color: "#7c3aed",
              },
              {
                icon: Shield,
                title: "Secure Access",
                description:
                  "Simple email verification ensures your data is safe and accessible only to you.",
                color: "#f59e0b",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="glass-card rounded-3xl p-8 md:p-12 neon-border animate-slide-up"
            style={{ animationDelay: "0.9s" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join GoalForge today and start your journey towards achieving all
              your academic and personal goals.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] transition-all"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">GoalForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for ambitious students. Track dreams, achieve goals.
          </p>
        </div>
      </footer>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </main>
  );
}
