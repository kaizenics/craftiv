"use client";

import { FileText, Upload, Sparkles, Layout } from "@/components/ui/icons";
import Link from "next/link";

const actions = [
  {
    title: "Create Resume",
    description: "Start from scratch",
    icon: FileText,
    href: "/resume/templates",
  },
  {
    title: "Templates",
    description: "Browse designs",
    icon: Layout,
    href: "/resume/templates",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-muted/20 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-transform group-hover:scale-110">
              <action.icon className="h-6 w-6" />
            </div> 
            <div>
              <p className="font-medium text-foreground text-sm">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
