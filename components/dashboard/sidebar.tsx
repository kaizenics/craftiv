"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components */

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  ScanSearch,
  Sparkles,
  CheckCircle2,
  Settings,
  Menu,
  X,
  ChevronDown,
  ScrollText,
  Mail,
} from "@/components/ui/icons";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PremiumUpgradeVisual } from "@/components/dashboard/premium-upgrade-visual";
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

interface SidebarItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  children?: { name: string; href: string; icon: typeof LayoutDashboard }[];
}

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
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: subscription } = trpc.user.subscription.useQuery();
  const subscriptionPlan = subscription?.plan ?? "free";
  const [lockedFeature, setLockedFeature] = useState<"ATS Checker" | "AI Resume Assistant" | null>(null);
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
                const isLockedFeature =
                  item.href === "/dashboard/ats-checker" ||
                  item.href === "/dashboard/ai-resume";
                if (isLockedFeature && subscriptionPlan === "free") {
                  setLockedFeature(item.name as "ATS Checker" | "AI Resume Assistant");
                  return;
                }
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
            </button>
          );
        })}
      </nav>

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

      <AlertDialog open={lockedFeature !== null} onOpenChange={(open) => !open && setLockedFeature(null)}>
        <AlertDialogContent className="max-h-[92vh] w-[calc(100vw-1.25rem)] max-w-xl overflow-y-auto overflow-x-hidden p-0 xl:max-h-[92vh] xl:overflow-y-auto">
          <PremiumUpgradeVisual />
          <div className="space-y-2 px-4 pb-3 sm:px-5 sm:pb-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-[2.1rem] leading-tight text-slate-800 xl:text-3xl">
                Boost your career
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-600">
                <span className="xl:hidden">
                  {lockedFeature} is premium. Upgrade to Plus or Pro.
                </span>
                <span className="hidden xl:inline">
                  {lockedFeature} is available on Plus and Pro. Upgrade to unlock AI-driven optimization and better application outcomes.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="hidden text-xs font-semibold uppercase tracking-wide text-slate-700 xl:block">
                You will get access to
              </p>
              <div className="mt-1 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />ATS Checker</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />AI Resume Assistant</span>
                <span className="hidden items-center gap-2 xl:flex"><CheckCircle2 className="h-4 w-4 text-primary" />AI-powered features</span>
                <span className="hidden items-center gap-2 xl:flex"><CheckCircle2 className="h-4 w-4 text-primary" />Advanced AI optimization</span>
              </div>
            </div>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel onClick={() => setLockedFeature(null)}>Maybe later</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href="/pricing">Upgrade Now</Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
