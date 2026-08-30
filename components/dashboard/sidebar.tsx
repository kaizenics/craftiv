"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components */

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { trpc } from "@/trpc/client";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ScanSearch,
  Sparkles,
  Settings,
  Menu,
  X,
  ChevronDown,
  ScrollText,
  Mail,
  ArrowUpRight,
  Target,
} from "@/components/ui/icons";
import { Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  children?: { name: string; href: string; icon: typeof LayoutDashboard }[];
}

type SubscriptionPlan = "free" | "active" | "plus" | "pro";

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    children: [
      { name: "Resumes", href: "/dashboard/documents/resume", icon: ScrollText },
      { name: "Cover Letters", href: "/dashboard/documents/cover-letters", icon: Mail },
    ],
  },
  {
    name: "Job Hunter",
    href: "/dashboard/job-hunter",
    icon: Target,
    badge: "Beta",
  },
  {
    name: "ATS Checker",
    href: "/dashboard/ats-checker",
    icon: ScanSearch,
  },
  {
    name: "AI Resume Assistant",
    href: "/dashboard/ai-resume",
    icon: Sparkles,
  },
  {
    name: "Portfolio Builder",
    href: "/coming-soon",
    icon: Briefcase,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function getCreditsByPlan(plan: SubscriptionPlan): number {
  if (plan === "free") return 1;
  if (plan === "active") return 5;
  if (plan === "plus") return 12;
  return 25;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of sidebarItems) {
      if (item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))) {
        initial.add(item.name);
      }
    }
    return initial;
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      for (const item of sidebarItems) {
        if (item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))) {
          next.add(item.name);
        }
      }
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function toggleExpand(name: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const currentPlan = ((subscription?.plan as SubscriptionPlan | undefined) ?? "free");
  const credits = subscription?.creditBalance ?? getCreditsByPlan(currentPlan);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/craftiv.png" alt="logo" width={30} height={30} sizes="30px" />
          <span className="font-display text-lg font-bold">Craftiv</span>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const hasChildren = !!item.children;
          const isExpanded = expandedItems.has(item.name);
          const isActive = hasChildren
            ? item.children!.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
            : pathname === item.href;

          if (hasChildren) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted/20 text-foreground"
                      : "text-sidebar-foreground hover:bg-muted/10 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            childActive
                              ? "font-medium text-foreground bg-muted/15"
                              : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                router.push(item.href);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted/20 text-foreground"
                  : "text-sidebar-foreground hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
              {item.badge ? (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                  {item.badge}
                </Badge>
              ) : null}
              {item.name === "Portfolio Builder" ? (
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {session ? (
        <div className="px-3 pb-2">
          <div className="group inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <Coins className="h-3.5 w-3.5 text-amber-700" />
            <span>{credits}</span>
              <span className="inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-amber-900 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:max-w-[220px] max-w-0 opacity-0">
              {credits === 0 ? (
                <>
                  <span className="text-amber-700">Insufficient credits</span>
                </>
              ) : null}
              <span className="text-amber-500">·</span>
              <Link href="/pricing" className="underline underline-offset-2">
                Top Up
              </Link>
            </span>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-foreground hover:bg-muted/10 dark:hover:bg-muted/10"
        >
          <Link href="/contact">
            <Mail className="h-5 w-5" />
            <span>Contact Us</span>
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
