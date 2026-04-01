
"use client";

import { ArrowRight, CircleDashed } from "lucide-react";
import { CreateResumeCard } from "@/components/dashboard/create-resume-card";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TipsCard } from "@/components/dashboard/tips-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import Image from "next/image";

export default function Dashboard() {
  // Replace mock data with real tRPC query
  const { data: resumes = [], isLoading } = trpc.resume.list.useQuery();

  const checklistItems = [
    {
      title: "Build your resume",
      detail: "Choose a template and add your details.",
      href: "/resume/templates",
    },
    {
      title: "Make it ATS-friendly",
      detail: "Use clear words and format so hiring systems can read it well.",
      href: "/resume/upload",
    },
    {
      title: "Check and improve",
      detail: "Fix weak lines and make your resume stronger.",
      href: "/resume/templates",
    },
    {
      title: "Write a cover letter",
      detail: "Create a simple cover letter that matches the job.",
      href: "/resume/templates",
    },
    {
      title: "Track your job applications",
      detail: "Keep your job list in one place and apply faster.",
      href: "/dashboard/documents/resume",
    },
  ];
  
  const hasResumes = resumes.length > 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Image 
            src="/cv.gif" 
            alt="Loading" 
            width={80} 
            height={80} 
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            {hasResumes
              ? "Continue working on your resumes or create a new one."
              : "Get started by creating your first resume."}
          </p>
        </div>
      </div>

      {/* Stats - Only show if user has resumes */}
      {hasResumes && (
        <div className="w-full">
        

          <div className="w-full rounded-xl bg-card">
            <Accordion type="single" collapsible className="space-y-3">
              {checklistItems.map((item, index) => (
                <AccordionItem
                  key={item.title}
                  value={`item-${index}`}
                  className="overflow-hidden rounded-xl border border-border bg-background last:border-b"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-normal text-foreground hover:no-underline [&>svg]:text-muted-foreground">
                    <span className="flex items-center gap-3 leading-none">
                      <CircleDashed className="h-5 w-5 text-amber-500" />
                      <span>{item.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-0 pb-4">
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-lg  bg-amber-50 px-4 py-3 transition-colors"
                    >
                      <p className="text-sm text-slate-700">{item.detail}</p>
                      <span className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-300 text-amber-800">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Resume Tips */}
      <TipsCard />

      {/* Recent Resumes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {hasResumes ? "Recent Resumes" : "My Resumes"}
          </h2>
          {hasResumes && (
            <Link
              href="/dashboard/documents"
              className="text-sm text-foreground hover:underline"
            >
              View all
            </Link>
          )} 
        </div>

        {hasResumes ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resumes.slice(0, 4).map((resume) => (
              <ResumeCard
                key={resume.id}
                id={resume.id}
                title={resume.title}
                updatedAt={new Date(resume.updatedAt).toLocaleDateString()}
                template={resume.templateId}
                data={resume.data}
              />
            ))}
          </div>
        ) : (
          <CreateResumeCard />
        )}
      </div>

      {/* Getting Started - Only show if no resumes */}
      {!hasResumes && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Getting Started
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">1</span>
              </div>
              <h3 className="font-medium text-foreground">Choose a Template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick from our collection of professional, ATS-friendly resume templates.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">2</span>
              </div>
              <h3 className="font-medium text-foreground">Fill in Your Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your experience, skills, and education with our easy-to-use editor.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">3</span>
              </div>
              <h3 className="font-medium text-foreground">Download & Apply</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Export your resume as PDF and start applying to your dream jobs.
              </p>
            </div> 
          </div>
        </div>
      )}
    </div>
  );
}