"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Mail, CalendarDays, Shield, Activity, 
  Code, BrainCircuit, UploadCloud, Terminal, 
  Save, Loader2, GitCommitHorizontal, Timer, 
  Compass, AlertTriangle, Briefcase, 
  Puzzle, User, Download, Trash2, 
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

const fadeVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, duration: 0.3 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
};

type TabType = "neuro" | "profile" | "data";

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { userId, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>("neuro");
  
  const now = new Date();
  const localTodayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const user = useQuery(api.users.getById, userId ? { id: userId as Id<"users"> } : "skip");
  const stats = useQuery(api.tasks.getStats, userId ? { userId: userId as Id<"users">, localTodayStart } : "skip");
  const archetype = useQuery(api.users.getDeveloperArchetype, userId ? { userId: userId as Id<"users"> } : "skip");
  
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);
  
  const sendDeletionOtp = useAction(api.email.sendAccountDeletionOtp);
  const confirmDelete = useMutation(api.users.confirmAccountDeletion);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [deleteOTP, setDeleteOTP] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    if (user && open) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setPreviewUrl(user.imageUrl || null);
      setActiveTab("neuro");
      setOtpSent(false);
      setDeleteOTP("");
    }
  }, [user, open]);

  if (!user || stats === undefined || archetype === undefined) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const hasData = archetype.totalFocusMins > 0 || stats.totalCompleted > 0;

  const formatHour = (hour: number) => {
    if (archetype.totalFocusMins === 0) return "--:--";
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:00 ${ampm}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveConfig = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      let imageId = undefined;
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const json = await result.json();
        imageId = json.storageId;
      }
      await updateProfile({ 
        id: userId as Id<"users">, 
        name: editName.trim(),
        email: editEmail.trim(),
        ...(imageId ? { imageId } : {})
      });
      toast.success("Profile updated successfully");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.message || "System error during update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      user: { name: user.name, email: user.email, joined: user.createdAt },
      statistics: stats,
      neuroMetrics: archetype
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goaltracker_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  const handleInitiateDelete = async () => {
    setIsSendingOtp(true);
    try {
      await sendDeletionOtp({ email: user.email });
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate deletion");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteOTP.length < 6) return toast.error("Enter a valid OTP code");
    setIsDeleting(true);
    try {
      await confirmDelete({ userId: userId as Id<"users">, code: deleteOTP });
      toast.success("Account permanently deleted.");
      onOpenChange(false);
      logout();
    } catch (e: any) {
      toast.error(e.message || "Invalid OTP code");
      setIsDeleting(false);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        activeTab === id 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4 hidden md:block" />
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl h-[80vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border-white/10 shadow-[0_0_100px_rgba(0,100,255,0.15)] ring-1 ring-white/5">
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs truncate">
            <Terminal className="w-4 h-4 text-primary shrink-0" />
            <span>sys@goaltracker:~/command_center$</span>
          </div>
          <div className="flex gap-2 shrink-0 mr-10">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-secondary/10 flex flex-col shrink-0">
            <div className="p-6 flex flex-col items-center justify-center text-center relative border-b border-white/5">
              <div className="relative group mb-4">
                <div className="relative w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-background flex items-center justify-center z-10 shadow-xl">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white/50 uppercase">
                      {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background border border-white/10 p-2 rounded-full shadow-xl z-20">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground truncate w-full px-2">
                {user.name || "Anonymous Dev"}
              </h2>
              <p className="text-xs text-muted-foreground truncate w-full flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{user.email}</span>
              </p>
              
              <div className="mt-5 flex flex-col items-center justify-center gap-2 ">
                 <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-2 rounded-lg border border-white/5 w-full justify-center hover:bg-black/60 transition-colors">
                    <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Uptime:</span> <span className="text-foreground font-bold">{stats.currentStreak} Days</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3 py-2 rounded-lg border border-white/5 w-full justify-center hover:bg-black/60 transition-colors">
                    <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Since:</span> <span className="text-foreground font-bold">{joinDate}</span>
                 </div>
              </div>
            </div>

            <div className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar flex md:flex-col gap-1 overflow-x-auto md:overflow-x-hidden">
              <TabButton id="neuro" icon={BrainCircuit} label="Neuro-Metrics" />
              <TabButton id="profile" icon={User} label="Profile & Identity" />
              <TabButton id="data" icon={Database} label="Data & Security" />
            </div>
          </div>

          <div className="flex-1 bg-background flex flex-col min-h-0 relative overflow-y-auto custom-scrollbar p-6">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: NEURO METRICS */}
              {activeTab === "neuro" && (
                <motion.div key="neuro" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Developer Archetype</h3>
                    <p className="text-sm text-muted-foreground">Analytics generated from your behavior patterns.</p>
                  </div>
                  
                  {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-xl bg-secondary/5">
                      <BrainCircuit className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                      <h4 className="text-lg font-bold">System Initializing</h4>
                      <p className="text-sm text-muted-foreground max-w-sm mt-2">
                        Insufficient data stream detected. Complete tasks and focus sessions to unlock your personalized Developer Archetype metrics.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 space-y-2 relative overflow-hidden">
                            <Compass className="absolute top-4 right-4 w-12 h-12 text-indigo-500/20" />
                            <span className="flex items-center gap-2 text-[10px] uppercase text-indigo-400 font-bold tracking-wider"><Timer className="w-3.5 h-3.5"/> Flow Chronotype</span>
                            <div>
                              <p className="text-2xl font-bold font-mono text-foreground">{archetype.peakTimeOfDay}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Peak focus hour: <strong className="text-indigo-400">{formatHour(archetype.peakHour)}</strong>
                              </p>
                            </div>
                         </div>

                         <div className="p-5 rounded-xl bg-secondary/10 border border-white/5 space-y-2 relative">
                            <span className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                              <BrainCircuit className="w-3.5 h-3.5"/> Cognitive Load
                            </span>
                            <div>
                              <p className={cn("text-2xl font-bold font-mono tracking-tight flex items-center gap-2", archetype.loadColor)}>
                                {archetype.cognitiveLoad}
                                {archetype.cognitiveLoad === "Burnout Risk" && <AlertTriangle className="w-5 h-5 animate-pulse" />}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {archetype.criticalTasksCount} critical tasks due in 72hrs
                              </p>
                            </div>
                         </div>
                      </div>

                      <div className="p-5 rounded-xl bg-secondary/5 border border-white/5 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="text-sm font-bold flex items-center gap-2"><GitCommitHorizontal className="w-4 h-4 text-primary" /> The Growth Balance</h3>
                          <span className="text-[10px] font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded w-fit">Total Volume: {stats.totalCompleted} Tasks</span>
                        </div>

                        <div className="space-y-4">
                          <div className="h-4 w-full flex rounded-full overflow-hidden border border-white/10 bg-black/50">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${archetype.balance.builder}%` }} transition={{ duration: 1 }} className="bg-blue-500" title="Building" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${archetype.balance.solver}%` }} transition={{ duration: 1, delay: 0.1 }} className="bg-purple-500" title="Solving" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${archetype.balance.prep}%` }} transition={{ duration: 1, delay: 0.2 }} className="bg-amber-500" title="Preparation" />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                              <Code className="w-4 h-4 text-blue-400 mb-1" />
                              <span className="text-xs font-bold">Building</span>
                              <span className="text-[10px] text-muted-foreground">{archetype.balance.builder}%</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                              <Puzzle className="w-4 h-4 text-purple-400 mb-1" />
                              <span className="text-xs font-bold">Solving</span>
                              <span className="text-[10px] text-muted-foreground">{archetype.balance.solver}%</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                              <Briefcase className="w-4 h-4 text-amber-400 mb-1" />
                              <span className="text-xs font-bold">Prep</span>
                              <span className="text-[10px] text-muted-foreground">{archetype.balance.prep}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* TAB 2: PROFILE & IDENTITY */}
              {activeTab === "profile" && (
                <motion.div key="profile" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Profile Configuration</h3>
                    <p className="text-sm text-muted-foreground">Manage your public identity and contact details.</p>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-mono">AVATAR</Label>
                      <div className="flex flex-row items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-white/5">
                        <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden relative shadow-lg shrink-0">
                          {previewUrl ? <Image src={previewUrl} alt="Preview" fill className="object-cover" /> : <User className="w-full h-full p-3 text-muted-foreground bg-black/50" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-black/40 border-white/10">
                            <UploadCloud className="w-4 h-4 mr-2" /> Upload New Avatar
                          </Button>
                          <p className="text-[10px] text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-mono">DISPLAY NAME</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary/20 border-white/10 h-11" placeholder="Enter display name" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-mono">PRIMARY EMAIL</Label>
                        <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-secondary/20 border-white/10 h-11" placeholder="Enter email address" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                      <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full sm:w-auto min-w-[150px] bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: DATA & SECURITY */}
              {activeTab === "data" && (
                <motion.div key="data" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Data & Security</h3>
                    <p className="text-sm text-muted-foreground">Manage your personal data and account status.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-secondary/10 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <Download className="w-4 h-4 text-blue-400" /> Export Data Vault
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                          Download a JSON copy of your profile info, statistics, and developer archetype data.
                        </p>
                      </div>
                      <Button onClick={handleExportData} variant="outline" className="shrink-0 border-white/10 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                        Export JSON
                      </Button>
                    </div>

                    <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2 text-red-400">
                          <Trash2 className="w-4 h-4" /> Danger Zone
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Permanently delete your account and all associated tasks, goals, and notes. This action is irreversible.
                        </p>
                      </div>

                      {!otpSent ? (
                         <Button variant="destructive" className="w-fit" onClick={handleInitiateDelete} disabled={isSendingOtp}>
                           {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                           {isSendingOtp ? "Generating..." : "Initiate Account Deletion"}
                         </Button>
                      ) : (
                         <div className="space-y-3 pt-2">
                           <Label className="text-xs font-mono text-red-400">AUTHORIZATION REQUIRED</Label>
                           <div className="flex gap-2">
                             <Input 
                               value={deleteOTP} 
                               onChange={(e) => setDeleteOTP(e.target.value)} 
                               placeholder="Enter 6-digit OTP" 
                               className="w-40 bg-black/40 border-red-500/30 text-red-400 focus-visible:ring-red-500/50 placeholder:text-red-900" 
                               maxLength={6}
                             />
                             <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                               {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Delete"}
                             </Button>
                           </div>
                           <p className="text-[10px] text-muted-foreground">We sent a verification code to your email.</p>
                         </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}