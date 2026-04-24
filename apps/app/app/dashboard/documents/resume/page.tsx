"use client";

import { useState } from "react";
import { FileText, Search, Filter, Grid, List, Plus, SortAsc, Check } from "@/components/ui/icons";
import { CreateResumeCard } from "@/components/dashboard/create-resume-card";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { ResumeCardPreview } from "@/components/dashboard/resume-card-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type FilterType = "all" | "draft" | "completed";
type SortType = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export default function DocumentsPage() {
  // Replace mock data with real tRPC query
  const { data: resumes = [], isLoading } = trpc.resume.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("date-desc");
  const hasResumes = resumes.length > 0;

  // Apply filters and sorting
  const filteredResumes = resumes
    .filter((resume) => {
      // Search filter
      const matchesSearch = resume.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesFilter = 
        filterType === "all" ? true :
        filterType === "draft" ? resume.status === "draft" :
        filterType === "completed" ? resume.status === "completed" :
        true;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sorting
      switch (sortType) {
        case "date-desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "date-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Documents
          </h1>
          <p className="text-muted-foreground">
            Manage all your resumes and cover letters in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/resume/templates">
            <Plus className="h-4 w-4" />
            New Resume
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      {hasResumes && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {filterType !== "all" && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {filterType === "draft" ? "Draft" : "Completed"}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  <span className="flex-1">All</span>
                  {filterType === "all" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("draft")}>
                  <span className="flex-1">Draft</span>
                  {filterType === "draft" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("completed")}>
                  <span className="flex-1">Completed</span>
                  {filterType === "completed" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortType("date-desc")}>
                  <span className="flex-1">Newest First</span>
                  {sortType === "date-desc" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType("date-asc")}>
                  <span className="flex-1">Oldest First</span>
                  {sortType === "date-asc" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType("name-asc")}>
                  <span className="flex-1">Name (A-Z)</span>
                  {sortType === "name-asc" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType("name-desc")}>
                  <span className="flex-1">Name (Z-A)</span>
                  {sortType === "name-desc" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center rounded-lg border border-border p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 w-7",
                  viewMode === "grid" && "bg-muted/10"
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-7 w-7",
                  viewMode === "list" && "bg-muted/10"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {hasResumes ? (
        <>
          {filteredResumes.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
              )}
            >
              {filteredResumes.map((resume) => (
                viewMode === "grid" ? (
                  <ResumeCard
                    key={resume.id}
                    id={resume.id}
                    title={resume.title}
                    updatedAt={new Date(resume.updatedAt).toLocaleDateString()}
                    template={resume.templateId}
                    data={resume.data}
                  />
                ) : (
                  <div
                    key={resume.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/10"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-zinc-100 bg-white">
                      <ResumeCardPreview templateId={resume.templateId} data={resume.data} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {resume.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {resume.templateId} • Updated {new Date(resume.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/resume/${resume.id}`}>Edit</Link>
                    </Button>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium text-foreground">No results found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <CreateResumeCard />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium text-foreground">No documents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Create your first resume to get started. All your documents will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}