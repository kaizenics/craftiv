"use client";

import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Laptop, FileText, Briefcase, Shield, LayoutGrid, Image, Upload, Check } from "@/components/ui/icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { templates } from "@/lib/data/templates";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { trpc } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SubscriptionPlan = "free" | "active" | "plus" | "pro";

function getResumeLimitByPlan(plan: SubscriptionPlan): number | null {
  if (plan === "free") return 1;
  if (plan === "active") return 2;
  if (plan === "plus") return 6;
  return 12;
}

// Template categories with their icons (shortLabel used on narrow mobile chips)
const categories = [
  { id: "all", name: "All Templates", shortLabel: "All", icon: LayoutGrid },
  { id: "simple", name: "Simple", shortLabel: "Simple", icon: Star },
  { id: "modern", name: "Modern", shortLabel: "Modern", icon: Laptop },
  { id: "professional", name: "Professional", shortLabel: "Professional", icon: Briefcase },
  { id: "ats", name: "ATS Friendly", shortLabel: "ATS", icon: Shield },
  { id: "creative", name: "Creative", shortLabel: "Creative", icon: Image },
];
const FIXED_COLOR_TEMPLATE_IDS = new Set(["orbit", "boardroom", "harvard"]);

function ResumeTemplateCard({ template, onUseTemplate, showPhoto }: { template: typeof templates[0]; onUseTemplate: (templateId: string) => void; showPhoto: boolean }) {
  const isFixedColorTemplate = FIXED_COLOR_TEMPLATE_IDS.has(template.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      {/* Template Preview Card */}
      <div className="relative aspect-3/4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-zinc-300">
        {/* Resume Preview with Sample Content */}
        <div className="absolute inset-0">
          <TemplateLivePreview
            templateId={template.id}
            color={template.primaryColor}
            showPhoto={showPhoto}
          />
        </div>

        {/* Hover Overlay with Use Template Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button 
            onClick={() => onUseTemplate(template.id)}
            className="transform scale-95 transition-transform duration-300 group-hover:scale-100 cursor-pointer"
            size="lg"
          >
            <FileText className="mr-2 h-4 w-4" />
            Use this template
          </Button>
        </div>

        {/* Template name badge */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-zinc-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
          <span className="text-xs font-medium text-zinc-700">{template.name}</span>
          <div 
            className="h-4 w-4 rounded-full border border-zinc-200" 
            style={
              isFixedColorTemplate
                ? { backgroundColor: template.primaryColor }
                : {
                    backgroundImage:
                      "conic-gradient(from 90deg, #ef4444, #f59e0b, #84cc16, #06b6d4, #3b82f6, #d946ef, #ef4444)",
                  }
            }
          />
        </div>
      </div>

      {/* Template Info */}
      <div className="mt-4">
        <h3 className="font-display text-lg font-semibold text-zinc-900">{template.name}</h3>
        <p className="mt-1 text-sm text-zinc-600 leading-relaxed">{template.description}</p>
      </div>
    </motion.div>
  );
}

function ResumeTemplatesPageContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPhoto, setShowPhoto] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const subscriptionPlan = (subscription?.plan as SubscriptionPlan | undefined) ?? "free";
  const fromUpload =
    searchParams.get("from") === "upload" &&
    typeof window !== "undefined" &&
    !!localStorage.getItem("uploadedResumeData");
  
  const createResume = trpc.resume.create.useMutation();
  const updateResume = trpc.resume.update.useMutation();
  const effectiveCreatedCount = subscription?.resumeCreatedCount ?? 0;

  const createAndNavigate = async (templateId: string) => {
    setIsCreating(true);

    try {
      if (!session?.user) {
        localStorage.setItem('selectedTemplateId', templateId);
        localStorage.setItem('showPhoto', JSON.stringify(showPhoto));
        const redirect = fromUpload ? '/resume/templates?from=upload' : '/resume/templates';
        router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      const resumeLimit = subscription?.resumeCreationLimit ?? getResumeLimitByPlan(subscriptionPlan);
      if (resumeLimit !== null && effectiveCreatedCount >= resumeLimit) {
        toast.error(
          `You've reached your ${subscriptionPlan.toUpperCase()} plan limit. Upgrade your plan to create more resume templates.`
        );
        setIsCreating(false);
        return;
      }

      const result = await createResume.mutateAsync({
        title: "Resume_1",
        templateId,
      });

      localStorage.setItem('currentResumeId', result.id);
      localStorage.setItem('selectedTemplateId', templateId);
      localStorage.setItem('showPhoto', JSON.stringify(showPhoto));

      const uploadedRaw = localStorage.getItem("uploadedResumeData");
      if (fromUpload && uploadedRaw) {
        try {
          const uploadedData = JSON.parse(uploadedRaw);
          const resumeData = { ...uploadedData, templateId };

          await updateResume.mutateAsync({
            id: result.id,
            data: resumeData,
          });

          localStorage.setItem("resumeData", JSON.stringify(resumeData));
          localStorage.removeItem("uploadedResumeData");
        } catch (e) {
          console.error("Failed to apply uploaded resume data:", e);
        }
      }

      router.push(`/resume/section/${result.id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create resume right now. Please try again.";
      toast.error(message);
      setIsCreating(false);
    }
  };

  const handleUseTemplate = (templateId: string) => createAndNavigate(templateId);
  const handleChooseLater = () => createAndNavigate('celestial');

  const filteredTemplates = templates.filter((template) =>
    template.category.includes(activeCategory)
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto mb-4 text-white" />
            <p className="text-white">Creating your resume...</p>
          </div>
        </div>
      )}
      
      {/* Upload success banner */}
      {fromUpload && (
        <div className="border-b border-emerald-200 bg-emerald-50 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4">
            <Upload className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Your resume was scanned successfully! Choose a template below — all your details will be pre-filled.
            </p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="border-b border-zinc-100 bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              {fromUpload ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : "1"}
            </span>
            <span className="text-sm font-medium text-zinc-900">{fromUpload ? "Resume uploaded" : "Choose template"}</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${fromUpload ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"}`}>
              2
            </span>
            <span className={`text-sm ${fromUpload ? "font-medium text-zinc-900" : "text-zinc-500"}`}>
              {fromUpload ? "Choose template" : "Enter your details"}
            </span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              3
            </span>
            <span className="text-sm text-zinc-500">{fromUpload ? "Edit & download" : "Download resume"}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-12 text-center sm:px-0">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold text-zinc-900 sm:text-5xl"
        >
          Resume templates
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-base text-zinc-600"
        >
          Simple to use and ready in minutes resume templates — give it a try for free now!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleChooseLater}
            className="mt-2 inline-block text-sm font-medium text-sky-500 hover:text-sky-600 hover:underline cursor-pointer"
          >
            Choose later
          </button>
        </motion.div>
      </div>

      {/* Category + photo: mobile = chip grid + card; sm+ = underline tabs */}
      <div className="border-b border-zinc-100 bg-zinc-50/40 sm:bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-0 lg:px-8">
          {/* Mobile */}
          <div className="space-y-4 sm:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Template category
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const selected = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 active:bg-zinc-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          selected ? "text-white" : "text-zinc-500"
                        )}
                        aria-hidden
                      />
                      {category.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Preview with photo</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Show a headshot in template previews
                </p>
              </div>
              <Switch
                id="photo-toggle-mobile"
                checked={showPhoto}
                onCheckedChange={setShowPhoto}
              />
            </div>
          </div>

          {/* Tablet / desktop */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="min-w-0 flex-1">
              <TabsList
                variant="line"
                className="scrollbar-none group-data-horizontal/tabs:h-auto flex w-full min-h-0 justify-start gap-1 overflow-x-auto overflow-y-visible bg-transparent p-0 sm:justify-center"
              >
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex shrink-0 items-center gap-2 rounded-none border-0 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-500 shadow-none transition-colors hover:text-zinc-900 data-[state=active]:border-b-zinc-900 data-[state=active]:text-zinc-900 after:hidden"
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex shrink-0 items-center gap-3 border-l border-zinc-200 pl-4">
              <label
                htmlFor="photo-toggle"
                className="cursor-pointer whitespace-nowrap text-sm font-medium text-zinc-700"
              >
                Include photo
              </label>
              <Switch
                id="photo-toggle"
                checked={showPhoto}
                onCheckedChange={setShowPhoto}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <ResumeTemplateCard 
              key={template.id} 
              template={template} 
              showPhoto={showPhoto}
              onUseTemplate={handleUseTemplate}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500">No templates found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumeTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Spinner className="h-8 w-8 text-zinc-400" />
        </div>
      }
    >
      <ResumeTemplatesPageContent />
    </Suspense>
  );
}
