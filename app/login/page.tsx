"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthForm } from "@/components/auth/auth-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

function LoginContent() {
  const { userId, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!isLoading && userId) {
      // If a redirect URL exists, go there. Otherwise, go to dashboard.
      router.push(redirect || "/dashboard");
    }
  }, [userId, isLoading, router, redirect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthForm />;
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 animate-fade-in">
        <Link href="/">
          <Button 
            variant="link" 
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Button>
        </Link>
      </div>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
          <LoginContent />
        </Suspense>
      </div>

      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </main>
  );
}