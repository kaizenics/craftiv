"use client";

import { cn } from "@/lib/utils";

interface ResumeCardProps {
  className?: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  email: string;
  skills: string[];
  experience: string;
  company: string;
}

function ResumeCard({
  className,
  name,
  initials,
  title,
  location,
  email,
  skills,
  experience,
  company,
}: ResumeCardProps) {
  return (
    <div
      className={cn(
        // Base styles
        "relative flex w-full select-none flex-col rounded-xl border border-zinc-200 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900",
        // Size: same as md on mobile, larger on lg
        "h-64 max-w-[18rem] px-5 py-5 -skew-y-[8deg]",
        "lg:h-96 lg:max-w-[24rem] lg:px-6 lg:py-6",
        className
      )}
    >
      {/* Resume Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg bg-zinc-100 text-base lg:text-lg font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base lg:text-lg font-bold text-zinc-900 dark:text-white">{name}</h3>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{email}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex mt-3 items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{location}</p>
      </div>

      {/* Summary Section */}
      <div className="mt-3">
        <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Summary</p>
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-1.5 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-1.5 w-4/6 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Experience Section */}
      <div className="mt-3 flex-1 lg:flex-1">
        <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Experience</p>
        <div className="mt-1.5">
          <p className="text-xs lg:text-sm font-medium text-zinc-800 dark:text-zinc-200">{experience}</p>
          <p className="text-[10px] lg:text-xs text-zinc-500 dark:text-zinc-400">{company}</p>
        </div>
        <div className="hidden md:block mt-2 space-y-1">
          <div className="h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-1.5 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-1.5 w-3/5 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Skills - hidden on mobile and md, visible on lg+ */}
      <div className="hidden lg:block mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Skills</p>
        <div className="flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DisplayCards() {
  const resumes = [
    {
      name: "Sarah Johnson",
      initials: "SJ",
      title: "Senior Product Designer",
      location: "San Francisco, CA",
      email: "sarah.johnson@email.com",
      experience: "Lead Product Designer",
      company: "Tech Innovations Inc.",
      skills: ["Figma", "UI/UX", "Design Systems", "Prototyping"],
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-white/60 dark:before:bg-zinc-900/60 before:transition-opacity before:duration-500 hover:before:opacity-0 before:left-0 before:top-0 before:z-10",
    },
    {
      name: "Michael Chen",
      initials: "MC",
      title: "Full Stack Developer",
      location: "New York, NY",
      email: "m.chen@email.com",
      experience: "Senior Software Engineer",
      company: "Global Solutions Ltd.",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      className:
        "[grid-area:stack] translate-x-8 lg:translate-x-12 translate-y-10 lg:translate-y-14 hover:-translate-y-1 before:absolute before:w-full before:rounded-xl before:h-full before:content-[''] before:bg-white/60 dark:before:bg-zinc-900/60 before:transition-opacity before:duration-500 hover:before:opacity-0 before:left-0 before:top-0 before:z-10",
    },
    {
      name: "Emily Rodriguez",
      initials: "ER",
      title: "Marketing Manager",
      location: "Austin, TX",
      email: "emily.r@email.com",
      experience: "Head of Digital Marketing",
      company: "Creative Agency Co.",
      skills: ["Strategy", "Analytics", "SEO", "Content"],
      className:
        "[grid-area:stack] translate-x-16 lg:translate-x-24 translate-y-20 lg:translate-y-28 hover:translate-y-10 lg:hover:translate-y-14",
    },
  ];

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 -ml-6 lg:-ml-12">
      {resumes.map((resume, index) => (
        <ResumeCard key={index} {...resume} />
      ))}
    </div>
  );
}
