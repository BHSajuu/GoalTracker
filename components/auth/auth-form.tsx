"use client";

import React from "react"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Mail, ArrowRight, Loader2, Shield, CheckCircle2 } from "lucide-react";

type AuthStep = "email" | "otp" | "success";

export function AuthForm() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const createOtp = useMutation(api.auth.createOtp);
  const verifyOtp = useMutation(api.auth.verifyOtp);

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const generatedOtp = generateOtp();

      // Store OTP in database
      await createOtp({ email, code: generatedOtp });

      // Send OTP via email
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: generatedOtp }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      setStep("otp");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await verifyOtp({ email, code: otp });

      if (result.success && result.userId) {
        setStep("success");
        setTimeout(() => {
          login(result.userId!, email);
        }, 1500);
      } else {
        setError(result.error || "Invalid verification code");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp("");
    setError("");
    setIsLoading(true);

    try {
      const generatedOtp = generateOtp();
      await createOtp({ email, code: generatedOtp });

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: generatedOtp }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo and Title */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 animate-glow-pulse">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">
          Zielio
        </h1>
        <p className="text-muted-foreground">
          {step === "email" && "Sign in to track your goals"}
          {step === "otp" && "Enter verification code"}
          {step === "success" && "Welcome back!"}
        </p>
      </div>

      {/* Auth Card */}
      <div className="glass-card rounded-2xl p-8 animate-scale-in">
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive animate-fade-in">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                We sent a 6-digit code to{" "}
                <span className="text-primary font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  if (value.length === 6) {
                    handleVerifyOtp();
                  }
                }}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 text-xl font-mono bg-secondary/50 border-border focus:border-primary rounded-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center animate-fade-in">
                {error}
              </p>
            )}

            <Button
              onClick={handleVerifyOtp}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Change email
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-primary hover:text-primary/80 transition-colors"
                disabled={isLoading}
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8 animate-scale-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Verified Successfully!
            </h2>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in stagger-3">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
