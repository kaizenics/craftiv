"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DownloadDialog } from "@/components/resume/download-dialog";
import {
  ResumePreview,
  DesignOptions,
  defaultDesignOptions,
} from "@/components/resume/resume-preview";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { ResumeData } from "@/lib/types/resume";
import { resumeTemplates } from "@/lib/resume-templates";
import { cn } from "@/lib/utils";
import { SpellCheckPanel } from "@/components/resume/spell-check-panel";
import {
  LayoutTemplate,
  Layers,
  Paintbrush,
  SpellCheck,
  Check,
  RotateCcw,
  Pencil,
  Eye,
  Menu,
} from "lucide-react";

// Sidebar tab types
type SidebarTab = "templates" | "sections" | "design" | "spellcheck";

const fontFamilies = [
  { name: "Inter", value: "Inter, system-ui, sans-serif" },
  { name: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { name: "Open Sans", value: '"Open Sans", system-ui, sans-serif' },
  { name: "Lato", value: "Lato, system-ui, sans-serif" },
  { name: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { name: "Poppins", value: "Poppins, system-ui, sans-serif" },
  {
    name: "Source Sans Pro",
    value: '"Source Sans Pro", system-ui, sans-serif',
  },
  { name: "Nunito", value: "Nunito, system-ui, sans-serif" },
  { name: "Raleway", value: "Raleway, system-ui, sans-serif" },
  { name: "Merriweather", value: "Merriweather, Georgia, serif" },
];

// Color options for templates
const templateColors = [
  "#1e3a5f",
  "#f97316",
  "#3b82f6",
  "#71717a",
  "#000",
  "#f472b6",
];

export default function FinalResumePage() {
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>("templates");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [designOptions, setDesignOptions] =
    useState<DesignOptions>(defaultDesignOptions);
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeName, setResumeName] = useState("Resume_1");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("#1e3a5f");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);

  const { data: session } = authClient.useSession();
  const updateResume = trpc.resume.update.useMutation();

  useEffect(() => {
    // Get resume data from localStorage
    const savedData = localStorage.getItem("resumeData");
    const templateId = localStorage.getItem("selectedTemplateId");
    const resumeId = localStorage.getItem("currentResumeId");
    const savedShowPhoto = localStorage.getItem("showPhoto");

    if (!savedData || !templateId) {
      router.push("/resume/templates");
      return;
    }
    
    // Set resume ID if exists
    if (resumeId) {
      setCurrentResumeId(resumeId);
    }

    if (savedShowPhoto) {
      try {
        setShowPhoto(JSON.parse(savedShowPhoto));
      } catch {
        setShowPhoto(false);
      }
    }

    try {
      const parsed = JSON.parse(savedData);
      setResumeData(parsed);

      // Set initial color from template
      const template = resumeTemplates.find((t) => t.id === parsed.templateId);
      if (template) {
        setSelectedColor(template.primaryColor);
      }
    } catch {
      router.push("/resume/templates");
      return;
    }

    // Load saved design options if any
    const savedDesign = localStorage.getItem("designOptions");
    if (savedDesign) {
      try {
        setDesignOptions(JSON.parse(savedDesign));
      } catch {
        // Use defaults
      }
    }

    // Load saved resume name if any
    const savedResumeName = localStorage.getItem("resumeName");
    if (savedResumeName) {
      setResumeName(savedResumeName);
    }

    setIsLoading(false);
  }, [router]);

  // Save design options to localStorage and database
  useEffect(() => {
    if (!isLoading && currentResumeId) {
      localStorage.setItem("designOptions", JSON.stringify(designOptions));
      
      // Auto-save design changes to database with debounce
      const timeoutId = setTimeout(() => {
        if (resumeData) {
          updateResume.mutate({
            id: currentResumeId,
            data: resumeData,
            status: "draft",
          });
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [designOptions, isLoading, currentResumeId, resumeData]);

  // Save resume data changes to localStorage and database
  useEffect(() => {
    if (resumeData && currentResumeId) {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      
      // Auto-save to database with debounce
      const timeoutId = setTimeout(() => {
        updateResume.mutate({
          id: currentResumeId,
          data: resumeData,
          status: "draft",
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [resumeData, currentResumeId]);

  // Save resume name to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("resumeName", resumeName);
    }
  }, [resumeName, isLoading]);

  if (isLoading || !resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Image 
            src="/cv.gif" 
            alt="Loading" 
            width={80} 
            height={80} 
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-muted-foreground">Loading your resume...</p>
        </div>
      </div>
    );
  }

  // Get active sections based on filled data
  const getActiveSections = () => {
    const sections: { id: string; label: string; active: boolean }[] = [];

    sections.push({
      id: "contacts",
      label: "Contacts",
      active: !!(
        resumeData.contact.firstName ||
        resumeData.contact.lastName ||
        resumeData.contact.email
      ),
    });

    sections.push({
      id: "experience",
      label: "Experience",
      active: resumeData.experiences.length > 0,
    });

    sections.push({
      id: "education",
      label: "Education",
      active: resumeData.educations.length > 0,
    });

    sections.push({
      id: "skills",
      label: "Skills",
      active: resumeData.skills.length > 0,
    });

    sections.push({
      id: "summary",
      label: "Summary",
      active: !!resumeData.summary,
    });

    sections.push({
      id: "languages",
      label: "Languages",
      active: resumeData.finalize.languages.length > 0,
    });

    sections.push({
      id: "certifications",
      label: "Certifications",
      active: resumeData.finalize.certifications.length > 0,
    });

    sections.push({
      id: "websites",
      label: "Links",
      active: resumeData.finalize.websites.length > 0,
    });

    sections.push({
      id: "awards",
      label: "Awards",
      active: resumeData.finalize.awards.length > 0,
    });

    sections.push({
      id: "references",
      label: "References",
      active: resumeData.finalize.references.length > 0,
    });

    sections.push({
      id: "hobbies",
      label: "Hobbies",
      active: resumeData.finalize.hobbies.length > 0,
    });

    return sections.filter((s) => s.active);
  };

  const handleTemplateChange = (templateId: string) => {
    setResumeData({ ...resumeData, templateId });
    localStorage.setItem("selectedTemplateId", templateId);

    // Update color to match new template
    const template = resumeTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedColor(template.primaryColor);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const resetDesignOptions = () => {
    setDesignOptions(defaultDesignOptions);
  };

  const handleDownloadClick = () => {
    // Check if user is authenticated
    if (!session?.user) {
      setShowAuthAlert(true);
      return;
    }
    
    // User is authenticated, show download dialog
    setShowDownloadDialog(true);
  };

  const handleDownloadComplete = () => {
    // Mark resume as completed when downloaded
    if (currentResumeId) {
      updateResume.mutate({
        id: currentResumeId,
        status: "completed",
      });
    }
  };

  const handleSignInRedirect = () => {
    setShowAuthAlert(false);
    router.push("/sign-in");
  };

  const handleResumeDataChange = (updated: ResumeData) => {
    setResumeData(updated);
    localStorage.setItem("resumeData", JSON.stringify(updated));
  };

  const sidebarTabs: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "templates",
      label: "Templates",
      icon: <LayoutTemplate className="h-5 w-5" />,
    },
    { id: "sections", label: "Section", icon: <Layers className="h-5 w-5" /> },
    {
      id: "design",
      label: "Design & Formatting",
      icon: <Paintbrush className="h-5 w-5" />,
    },
    {
      id: "spellcheck",
      label: "Spell check",
      icon: <SpellCheck className="h-5 w-5" />,
    },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            BoostCV
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" />
          <span>Saved</span>
        </div>

        <Button
          onClick={handleDownloadClick}
          size="sm"
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Download Resume</span>
          <span className="sm:hidden">Download</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-28 border-r bg-muted/30 flex-col items-center py-4 gap-2">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-4 rounded-lg transition-colors w-24 text-center",
                activeTab === tab.id
                  ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {tab.icon}
              <span className="text-sm leading-tight">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          <div className="grid grid-cols-4 gap-1">
            {sidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 transition-colors",
                  activeTab === tab.id
                    ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800"
                    : "text-muted-foreground"
                )}
              >
                {tab.icon}
                <span className="text-xs leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Content Panel */}
        <div className="w-full lg:w-1/3 border-r bg-background flex flex-col pb-16 lg:pb-0">
          <div className="p-4 overflow-y-auto flex-1">
            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold">Templates</h2>
                <div className="border-b pb-4" />

                {/* Color Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Template Color</Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    {templateColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-all hover:scale-110",
                          selectedColor === color
                            ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                            : "border-zinc-200 hover:border-zinc-400"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {/* Custom Color Picker */}
                    <div className="relative group">
                      <label
                        className={cn(
                          "w-9 h-9 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all hover:scale-110",
                          !templateColors.includes(selectedColor)
                            ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                            : "border-zinc-200 hover:border-zinc-400"
                        )}
                        style={{
                          backgroundColor: !templateColors.includes(
                            selectedColor
                          )
                            ? selectedColor
                            : "transparent",
                          backgroundImage: templateColors.includes(
                            selectedColor
                          )
                            ? "conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)"
                            : "none",
                        }}
                        title="Custom color"
                      >
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedColor}
                  </p>
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resumeTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateChange(t.id)}
                      className={cn(
                        "relative aspect-3/4 border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg text-left",
                        resumeData.templateId === t.id
                          ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {/* Template Preview */}
                      <div className="absolute inset-0 text-left">
                        <TemplateLivePreview
                          templateId={t.id}
                          color={
                            resumeData.templateId === t.id
                              ? selectedColor
                              : t.primaryColor
                          }
                        />
                      </div>
                      {resumeData.templateId === t.id && (
                        <div className="absolute top-1 right-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold">Sections</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  These are the sections included in your resume based on the
                  information you provided.
                </p>
                <div className="border-b pb-4" />

                <div className="space-y-2">
                  {getActiveSections().map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                    >
                      <div className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <span className="font-medium">{section.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push("/resume/section")}
                >
                  Edit Sections
                </Button>
              </div>
            )}

            {/* Design & Formatting Tab */}
            {activeTab === "design" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    Design & Formatting
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetDesignOptions}
                    className="text-muted-foreground text-xs sm:text-sm"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="border-b pb-4" />

                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={designOptions.fontFamily}
                    onValueChange={(value: any) =>
                      setDesignOptions({ ...designOptions, fontFamily: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>
                            {font.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <Label className="text-sm">Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={8}
                      max={16}
                      value={designOptions.fontSize}
                      onChange={(e) =>
                        setDesignOptions({
                          ...designOptions,
                          fontSize: parseInt(e.target.value) || 11,
                        })
                      }
                      className="w-16 sm:w-20 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">pt</span>
                    <Slider
                      min={8}
                      max={16}
                      step={1}
                      value={[designOptions.fontSize]}
                      onValueChange={(value) =>
                        setDesignOptions({
                          ...designOptions,
                          fontSize: value[0],
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Section Spacing */}
                <div className="space-y-2">
                  <Label className="text-sm">Section Spacing</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={8}
                      max={32}
                      value={designOptions.sectionSpacing}
                      onChange={(e) =>
                        setDesignOptions({
                          ...designOptions,
                          sectionSpacing: parseInt(e.target.value) || 16,
                        })
                      }
                      className="w-16 sm:w-20 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                    <Slider
                      min={8}
                      max={32}
                      step={1}
                      value={[designOptions.sectionSpacing]}
                      onValueChange={(value) =>
                        setDesignOptions({
                          ...designOptions,
                          sectionSpacing: value[0],
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Paragraph Spacing */}
                <div className="space-y-2">
                  <Label className="text-sm">Paragraph Spacing</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={4}
                      max={24}
                      value={designOptions.paragraphSpacing}
                      onChange={(e) =>
                        setDesignOptions({
                          ...designOptions,
                          paragraphSpacing: parseInt(e.target.value) || 8,
                        })
                      }
                      className="w-16 sm:w-20 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                    <Slider
                      min={4}
                      max={24}
                      step={1}
                      value={[designOptions.paragraphSpacing]}
                      onValueChange={(value) =>
                        setDesignOptions({
                          ...designOptions,
                          paragraphSpacing: value[0],
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-2">
                  <Label className="text-sm">Line Spacing</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      step={0.1}
                      value={designOptions.lineSpacing}
                      onChange={(e) =>
                        setDesignOptions({
                          ...designOptions,
                          lineSpacing: parseFloat(e.target.value) || 1.5,
                        })
                      }
                      className="w-16 sm:w-20 text-sm"
                    />
                    <Slider
                      min={1}
                      max={3}
                      step={0.1}
                      value={[designOptions.lineSpacing]}
                      onValueChange={(value) =>
                        setDesignOptions({
                          ...designOptions,
                          lineSpacing: value[0],
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spell Check Tab */}
            {activeTab === "spellcheck" && (
              <SpellCheckPanel
                resumeId={currentResumeId}
                resumeData={resumeData}
                onResumeDataChange={handleResumeDataChange}
              />
            )}
          </div>
        </div>

        {/* Desktop Preview */}
        <main className="hidden lg:block flex-1 bg-gray-100 dark:bg-gray-900 p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* Resume Name */}
            <div className="flex items-center gap-2 mb-4">
              {isEditingName ? (
                <Input
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingName(false)
                  }
                  className="w-48 h-8 text-zinc-900 dark:text-zinc-100 font-medium"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium hover:underline"
                >
                  {resumeName}
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Resume Preview */}
            <ResumePreview
              data={resumeData}
              designOptions={designOptions}
              customColor={selectedColor}
              showPhoto={showPhoto}
              showScore={false}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>

        {/* Mobile Preview Button - Floating */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="lg:hidden fixed bottom-20 right-4 z-40 rounded-full h-12 w-12 p-0 shadow-lg"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Resume Preview</SheetTitle>
              <SheetDescription>
                Preview your resume in real-time
              </SheetDescription>
            </SheetHeader>
            <div className="h-[calc(85vh-80px)] overflow-auto p-4">
              <ResumePreview
                data={resumeData}
                designOptions={designOptions}
                customColor={selectedColor}
                showPhoto={showPhoto}
                showScore={false}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Authentication Alert Dialog */}
      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in first before you proceed with downloading your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignInRedirect}>
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Dialog */}
      <DownloadDialog
        data={resumeData}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        designOptions={designOptions}
        customFileName={resumeName}
        customColor={selectedColor}
        showPhoto={showPhoto}
        onDownloadComplete={handleDownloadComplete}
      />
    </div>
  );
}
