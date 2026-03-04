"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, CalendarDays, Shield, Activity, 
  Code, BrainCircuit,
  UploadCloud, Terminal, Save, Loader2, GitCommitHorizontal,
  Timer, Settings, Compass, AlertTriangle, Briefcase, Puzzle,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("neuro");
  
  // Data Fetching
  const now = new Date();
  const localTodayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const user = useQuery(api.users.getById, userId ? { id: userId as Id<"users"> } : "skip");
  const stats = useQuery(api.tasks.getStats, userId ? { userId: userId as Id<"users">, localTodayStart } : "skip");
  const archetype = useQuery(api.users.getDeveloperArchetype, userId ? { userId: userId as Id<"users"> } : "skip");
  
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);

  // Form States
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && open) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setPreviewUrl(user.imageUrl || null);
      setActiveTab("neuro");
    }
  }, [user, open]);

  if (!user || stats === undefined || archetype === undefined) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const focusHours = (archetype.totalFocusMins / 60).toFixed(1);

  // Format Peak Hour to 12-hour AM/PM format safely
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
      toast.success("System config committed successfully");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.message || "System error during update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[75vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border-white/10 shadow-[0_0_100px_rgba(0,100,255,0.15)] ring-1 ring-white/5">
        
        {/* Tech Header */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-white/10 bg-black/40 shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] md:text-xs truncate">
            <Terminal className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" />
            <span className="truncate">sys@zielio:~$ fetch_neuro_metrics.sh</span>
          </div>
          <div className="flex gap-1.5 md:gap-2 shrink-0 md:mr-10">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-0 relative md:h-[520px]">
          
          {/* LEFT PANEL: Identity */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/5 bg-secondary/10 p-4 md:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
            
            <div className="relative group mb-3 md:mb-4">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-dashed border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] hidden md:block" 
              />
              <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-white/10 overflow-hidden bg-background flex items-center justify-center z-10 shadow-2xl">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <span className="text-3xl md:text-4xl font-bold text-white/50 uppercase tracking-widest">
                    {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-1 bg-background border border-white/10 p-1.5 md:p-2 rounded-full shadow-xl z-20">
                <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
              </div>
            </div>

            <div className="z-10 space-y-1 w-full mt-1 md:mt-2">
              <h2 className="text-lg md:text-xl font-bold text-foreground truncate px-2">
                {user.name || "Anonymous Dev"}
              </h2>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate px-2 flex items-center justify-center gap-1 md:gap-1.5">
                <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{user.email}</span>
              </p>
              
              <div className="mt-4 md:mt-6 flex flex-row md:flex-col items-center justify-center gap-2 w-full px-2">
                 <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-mono bg-black/40 px-2 md:px-3 py-1.5 rounded-md border border-white/5 w-full justify-center">
                    <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">Uptime:</span> <span className="text-foreground">{stats.currentStreak} Days</span>
                 </div>
                 <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-mono bg-black/40 px-2 md:px-3 py-1.5 rounded-md border border-white/5 w-full justify-center">
                    <CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">Since:</span> <span className="text-foreground">{joinDate}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Features Tabs */}
          <div className="md:col-span-8 bg-background flex flex-col min-h-0 h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              
              <div className="px-3 md:px-6 pt-3 md:pt-4 border-b border-white/5 shrink-0">
                <TabsList className="bg-secondary/30 w-full grid grid-cols-2 gap-1 md:gap-2 h-10 md:h-12 p-1">
                  <TabsTrigger value="neuro" className="data-[state=active]:bg-background gap-1.5 md:gap-2 text-[10px] md:text-sm h-full"><BrainCircuit className="w-3 h-3 md:w-4 md:h-4 shrink-0"/> Neuro-Metrics</TabsTrigger>
                  <TabsTrigger value="config" className="data-[state=active]:bg-background gap-1.5 md:gap-2 text-[10px] md:text-sm h-full"><Settings className="w-3 h-3 md:w-4 md:h-4 shrink-0"/> Sys Config</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                
                {/* TAB 1: NEURO METRICS */}
                <TabsContent value="neuro" className="m-0 h-full space-y-4 md:space-y-6 outline-none">
                  
                  {/* Top Row: Flow & Load */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                     
                     {/* Flow State Chronotype */}
                     <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 space-y-1.5 md:space-y-2 relative overflow-hidden">
                        <Compass className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 text-indigo-500/20" />
                        <span className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] uppercase text-indigo-400 font-bold tracking-wider"><Timer className="w-3 h-3 md:w-3.5 md:h-3.5"/> Flow Chronotype</span>
                        <div>
                          <p className="text-xl md:text-2xl font-bold font-mono text-foreground tracking-tight">{archetype.peakTimeOfDay}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                            Peak focus hour: <strong className="text-indigo-400">{formatHour(archetype.peakHour)}</strong>
                          </p>
                        </div>
                     </div>

                     {/* Burnout Predictor */}
                     <div className="p-3 md:p-4 rounded-xl bg-secondary/10 border border-white/5 space-y-1.5 md:space-y-2 relative">
                        <span className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                          <BrainCircuit className="w-3 h-3 md:w-3.5 md:h-3.5"/> Cognitive Load
                        </span>
                        <div>
                          <p className={cn("text-xl md:text-2xl font-bold font-mono tracking-tight flex items-center gap-2", archetype.loadColor)}>
                            {archetype.cognitiveLoad}
                            {archetype.cognitiveLoad === "Burnout Risk" && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                            {archetype.criticalTasksCount} critical tasks due in 72hrs
                          </p>
                        </div>
                     </div>
                  </div>

                  {/* Bottom Area: The Grind Balance */}
                  <div className="p-3 md:p-5 rounded-xl bg-secondary/5 border border-white/5 space-y-3 md:space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-xs md:text-sm font-bold flex items-center gap-2"><GitCommitHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> The Growth Balance</h3>
                      <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded w-fit">Volume: {stats.totalCompleted} Tasks</span>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      {/* Visual Bar */}
                      <div className="h-3 md:h-4 w-full flex rounded-full overflow-hidden border border-white/10 shadow-inner">
                        <div style={{ width: `${archetype.balance.builder}%` }} className="bg-blue-500 transition-all duration-1000" title="Building" />
                        <div style={{ width: `${archetype.balance.solver}%` }} className="bg-purple-500 transition-all duration-1000" title="Solving" />
                        <div style={{ width: `${archetype.balance.prep}%` }} className="bg-amber-500 transition-all duration-1000" title="Preparation" />
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                        <div className="flex flex-col items-center p-1.5 md:p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                          <Code className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 mb-1" />
                          <span className="text-[10px] md:text-xs font-bold text-foreground">Building</span>
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">{archetype.balance.builder}%</span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 md:p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                          <Puzzle className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 mb-1" />
                          <span className="text-[10px] md:text-xs font-bold text-foreground">Solving</span>
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">{archetype.balance.solver}%</span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 md:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                          <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 mb-1" />
                          <span className="text-[10px] md:text-xs font-bold text-foreground">Prep</span>
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">{archetype.balance.prep}%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* TAB 2: SYS CONFIG */}
                <TabsContent value="config" className="m-0 outline-none">
                   <div className="space-y-4 md:space-y-5 mt-1 md:mt-2">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-[10px] md:text-xs text-muted-foreground font-mono">IMAGE_PAYLOAD</Label>
                        <div className="flex flex-row items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl bg-secondary/20 border border-white/5">
                          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white/10 overflow-hidden relative shadow-lg shrink-0">
                            {previewUrl ? <Image src={previewUrl} alt="Preview" fill className="object-cover" /> : <User className="w-full h-full p-2 md:p-3 text-muted-foreground bg-black/50" />}
                          </div>
                          <div className="flex-1">
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 md:h-9 border-white/10 text-[10px] md:text-xs bg-black/40 hover:bg-black/60 w-full sm:w-auto">
                              <UploadCloud className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" /> Select File
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5 md:space-y-2">
                          <Label className="text-[10px] md:text-xs text-muted-foreground font-mono">USER_NAME</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary/20 border-white/10 font-mono text-[10px] md:text-sm h-9 md:h-11" placeholder="Enter display name" />
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                          <Label className="text-[10px] md:text-xs text-muted-foreground font-mono">CONTACT_NODE</Label>
                          <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-secondary/20 border-white/10 font-mono text-[10px] md:text-sm h-9 md:h-11" placeholder="Enter email address" />
                        </div>
                      </div>
                      
                      <div className="pt-2 md:pt-4 pb-4 md:pb-0">
                        <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full h-9 md:h-11 bg-primary text-primary-foreground font-bold text-[11px] md:text-sm shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all">
                          {isSaving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-2" /> : <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />}
                          Commit Configuration
                        </Button>
                      </div>
                   </div>
                </TabsContent>

              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}