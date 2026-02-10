"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Server } from "lucide-react";

export function PrivacyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors text-left">
          Privacy Policy
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-2xl max-h-[85vh] flex flex-col glass border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-primary" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Last updated: February 2026
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-sm text-muted-foreground">
          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Data Collection
            </h3>
            <p>
              We collect information you provide directly to us when you create an account, specifically your email address. 
              We also store the data you create within the application, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Goals and their associated metadata</li>
              <li>Tasks, deadlines, and completion status</li>
              <li>Notes and attached resources</li>
              <li>Focus session duration and timestamps</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> Data Storage & Security
            </h3>
            <p>
              Your data is stored securely on Convex's cloud infrastructure. We implement standard security measures to protect your information.
              However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Usage of Information
            </h3>
            <p>
              We use your information solely to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide, maintain, and improve the Zielio platform.</li>
              <li>Generate personal analytics and insights for your dashboard.</li>
              <li>Send important administrative notifications (e.g., security alerts).</li>
            </ul>
            <p className="mt-2 text-accent">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold">Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal data at any time. 
              You can delete your account and all associated data directly from the settings menu or by contacting support.
            </p>
          </section>
        </div>
        
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <DialogTrigger asChild>
             <Button variant="secondary">Close</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}