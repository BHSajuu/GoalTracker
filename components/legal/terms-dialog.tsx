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
import { FileText, Scale, AlertTriangle, Copyright } from "lucide-react";

export function TermsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors text-left">
          Terms of Service
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-2xl max-h-[85vh] flex flex-col glass border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-primary" />
            Terms of Service
          </DialogTitle>
          <DialogDescription>
            Effective Date: February 2026
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-sm text-muted-foreground">
          <p>
            By accessing or using Zielio ("the Platform"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Use of Service
            </h3>
            <p>
              Zielio is a productivity tool designed for students and professionals. You agree to use the service only for lawful purposes and in accordance with these Terms.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You are responsible for maintaining the confidentiality of your account.</li>
              <li>You must not use the platform to distribute malicious code or spam.</li>
              <li>You generally agree not to reverse engineer the application.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Copyright className="w-4 h-4 text-primary" /> Intellectual Property
            </h3>
            <p>
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Zielio and its licensors.
            </p>
            <p className="mt-2">
              **Your Data:** You retain full ownership of all goals, tasks, and notes you create on the platform. We claim no intellectual property rights over the material you provide to the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> Disclaimer
            </h3>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Zielio makes no warranties, expressed or implied, regarding the reliability or availability of the service.
            </p>
            <p className="mt-2">
              We are not responsible for any academic or professional outcomes resulting from the use or inability to use this tracking tool.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-foreground font-semibold">Termination</h3>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <DialogTrigger asChild>
             <Button variant="secondary">I Understand</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}