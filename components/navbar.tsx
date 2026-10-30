"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

import { useAuth } from "@/components/auth-provider";
import { ThemeSwitch } from "@/components/theme-toggle";
import { trpc } from "@/trpc/client";
import { NavbarLogo } from "@/components/ui/resizable-navbar";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

type SubscriptionPlan = "free" | "active" | "plus" | "pro";

type NavItem = {
  label: string;
  href: string;
  isHash?: boolean;
};

const navItems: NavItem[] = [
  { label: "Features", href: "#features", isHash: true },
  { label: "How it works", href: "#how-it-works", isHash: true },
  { label: "FAQ", href: "#faq", isHash: true },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

// Both panels share one surface so they read as a pair floating over the page.
const panel = "pointer-events-auto rounded-2xl bg-zinc-100/85 backdrop-blur-md";
const darkButton =
  "inline-flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-700 active:translate-y-px";

function getCreditsByPlan(plan: SubscriptionPlan): number {
  if (plan === "free") return 1;
  if (plan === "active") return 5;
  if (plan === "plus") return 12;
  return 25;
}

function NavLink({
  href,
  label,
  pathname,
  isHash,
  onClick,
  className,
}: NavItem & {
  pathname: string;
  onClick?: () => void;
  className?: string;
}) {
  const lenis = useLenis();
  const isActive = !isHash && pathname === href;
  const resolvedHref = isHash && pathname !== "/" ? `/${href}` : href;

  return (
    <Link
      href={resolvedHref}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => {
        if (isHash && pathname === "/") {
          e.preventDefault();
          const element = document.querySelector<HTMLElement>(href);
          // Native smooth scrolling fights Lenis, so hand the jump to it when it is running.
          if (element && lenis) lenis.scrollTo(element);
          else element?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        onClick?.();
      }}
      className={cn(
        "rounded-lg px-3 py-2 text-[15px] text-zinc-800 transition-colors hover:bg-white/70 hover:text-zinc-950",
        isActive && "bg-white text-zinc-950",
        className,
      )}
    >
      {label}
    </Link>
  );
}

function CreditsPill({ credits }: { credits: number }) {
  return (
    <Link
      href="/pricing"
      title="Top up credits"
      className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-white/70"
    >
      <Coins className="size-4 text-amber-600" />
      <span className="tabular-nums">{credits}</span>
      <span className="sr-only">credits, top up</span>
    </Link>
  );
}

export function NavbarComponent() {
  const pathname = usePathname();
  const { session } = useAuth();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPlan = ((subscription?.plan as SubscriptionPlan | undefined) ?? "free");
  const credits = subscription?.creditBalance ?? getCreditsByPlan(currentPlan);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 font-sans sm:pt-4">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className={cn(panel, "w-full lg:w-auto")}>
          <div className="flex h-14 items-center justify-between gap-2 pl-3 pr-2 lg:pr-3">
            <NavbarLogo />

            <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) => (
                <NavLink key={item.label} {...item} pathname={pathname} />
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-800 hover:bg-white/70 lg:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-[1.5px] w-5 rounded-full bg-current transition-transform duration-200",
                    isMobileMenuOpen && "translate-y-[6px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[12px] h-[1.5px] w-5 rounded-full bg-current transition-transform duration-200",
                    isMobileMenuOpen && "-translate-y-[6px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out lg:hidden",
              isMobileMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <nav aria-label="Mobile" className="flex flex-col gap-0.5 px-2 pb-2">
                {navItems.map((item) => (
                  <NavLink key={item.label} {...item} pathname={pathname} onClick={closeMenu} />
                ))}
                <div className="mt-2 flex items-center gap-2 border-t border-zinc-200 pt-3">
                  <ThemeSwitch />
                  {session ? (
                    <>
                      <CreditsPill credits={credits} />
                      <Link href="/dashboard" onClick={closeMenu} className={cn(darkButton, "ml-auto")}>
                        Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <NavLink label="Login" href="/sign-in" pathname={pathname} onClick={closeMenu} />
                      <Link href="/sign-up" onClick={closeMenu} className={cn(darkButton, "ml-auto")}>
                        Start free
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </div>

        <div className={cn(panel, "hidden h-14 items-center gap-1 p-2 lg:flex")}>
          <ThemeSwitch />
          {session ? (
            <>
              <CreditsPill credits={credits} />
              <Link href="/dashboard" className={darkButton}>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <NavLink label="Login" href="/sign-in" pathname={pathname} className="px-4" />
              <Link href="/sign-up" className={darkButton}>
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
