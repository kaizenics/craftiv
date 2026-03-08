"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Star, Laptop, FileText, Briefcase, Shield, LayoutGrid, Image } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { templates } from "@/lib/data/templates";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { trpc } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";

// Template categories with their icons
const categories = [
  { id: "all", name: "All Templates", icon: LayoutGrid },
  { id: "simple", name: "Simple", icon: Star },
  { id: "modern", name: "Modern", icon: Laptop },
  { id: "professional", name: "Professional", icon: Briefcase },
  { id: "ats", name: "ATS Friendly", icon: Shield },
  { id: "creative", name: "Creative", icon: Image },
];

function ResumeTemplateCard({ template, onUseTemplate, showPhoto }: { template: typeof templates[0]; onUseTemplate: (templateId: string) => void; showPhoto: boolean }) {

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
            style={{ backgroundColor: template.primaryColor }}
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

export default function ResumeTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPhoto, setShowPhoto] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const createResume = trpc.resume.create.useMutation();

  const handleUseTemplate = async (templateId: string) => {
    setIsCreating(true);
    
    try {
      // Check if user is authenticated
      if (!session?.user) {
        // Store template selection for after sign-in
        localStorage.setItem('selectedTemplateId', templateId);
        localStorage.setItem('showPhoto', JSON.stringify(showPhoto));
        router.push('/sign-in?redirect=/resume/templates');
        return;
      }

      // Create a new draft resume in the database
      const result = await createResume.mutateAsync({
        title: `Resume_${Date.now()}`,
        templateId: templateId,
      });

      // Store resume info in localStorage
      localStorage.setItem('currentResumeId', result.id);
      localStorage.setItem('selectedTemplateId', templateId);
      localStorage.setItem('showPhoto', JSON.stringify(showPhoto));
      
      // Navigate to the resume section page with the ID
      router.push(`/resume/section/${result.id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      setIsCreating(false);
    }
  };

  const handleChooseLater = async () => {
    setIsCreating(true);
    
    try {
      // Check if user is authenticated
      if (!session?.user) {
        localStorage.setItem('selectedTemplateId', 'celestial');
        localStorage.setItem('showPhoto', JSON.stringify(showPhoto));
        router.push('/sign-in?redirect=/resume/templates');
        return;
      }

      // Create a new draft resume with default template
      const result = await createResume.mutateAsync({
        title: `Resume_${Date.now()}`,
        templateId: 'celestial',
      });

      localStorage.setItem('currentResumeId', result.id);
      localStorage.setItem('selectedTemplateId', 'celestial');
      localStorage.setItem('showPhoto', JSON.stringify(showPhoto));
      
      router.push(`/resume/section/${result.id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      setIsCreating(false);
    }
  };

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
      
      {/* Stepper */}
      <div className="border-b border-zinc-100 bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
              1
            </span>
            <span className="text-sm font-medium text-zinc-900">Choose template</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              2
            </span>
            <span className="text-sm text-zinc-500">Enter your details</span>
          </div>
          <div className="h-px w-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-500">
              3
            </span>
            <span className="text-sm text-zinc-500">Download resume</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="py-12 text-center">
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

      {/* Category Tabs */}
      <div className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
              <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 sm:justify-center">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex items-center gap-2 rounded-none border-0 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-500 transition-all data-[state=active]:border-b-zinc-900 data-[state=active]:text-zinc-900 hover:text-zinc-900 shadow-none"
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                    <span className="sm:hidden">{category.name.split(" ")[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            {/* Photo Toggle Switch */}
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
              <label htmlFor="photo-toggle" className="text-sm font-medium text-zinc-700 cursor-pointer whitespace-nowrap">
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

