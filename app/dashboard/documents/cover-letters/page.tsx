"use client";

import { format } from "date-fns";
import { Mail, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export default function CoverLettersPage() {
  const { data: letters = [], isLoading } = trpc.coverLetter.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Image
            src="/cv.gif"
            alt="Loading"
            width={80}
            height={80}
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-muted-foreground">Loading cover letters...</p>
        </div>
      </div>
    );
  }

  const hasLetters = letters.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Cover Letters</h1>
          <p className="text-muted-foreground">
            Create tailored cover letters for your job applications.
          </p>
        </div>
        <Button asChild>
          <Link href="/cover-letter/write">
            <Plus className="h-4 w-4" />
            New Cover Letter
          </Link>
        </Button>
      </div>

      {!hasLetters ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">No cover letters yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first cover letter by generating one from a resume or writing from scratch.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/cover-letter/write">Get Started</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {letters.map((letter) => (
            <li
              key={letter.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/20">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground line-clamp-2">{letter.title}</p>
                  {letter.data.employer.jobTitle && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {letter.data.employer.jobTitle}
                      {letter.data.employer.companyName
                        ? ` · ${letter.data.employer.companyName}`
                        : ""}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {format(new Date(letter.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
