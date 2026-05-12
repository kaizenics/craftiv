"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { trpc } from "@/trpc/client";
import { NavbarLogo, NavbarButton } from "@/components/ui/resizable-navbar";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

type SubscriptionPlan = "free" | "active" | "plus" | "pro";

type NavItem = {
  label: string;
  href: string;
  isHash?: boolean;
};

const navItems: NavItem[] = [
  { label: "About", href: "#about", isHash: true },
  { label: "FAQ", href: "#faq", isHash: true },
  { label: "Pricing", href: "/pricing" },
];

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
}: {
  href: string;
  label: string;
  pathname: string;
  isHash?: boolean;
  onClick?: () => void;
}) {
  const isActive = !isHash && pathname === href;
  const resolvedHref = isHash && pathname !== "/" ? `/${href}` : href;

  return (
    <Link
      href={resolvedHref}
      onClick={(e) => {
        if (isHash && pathname === "/") {
          e.preventDefault();
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        onClick?.();
      }}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900",
        isActive && "bg-zinc-100 text-zinc-900",
      )}
    >
      {label}
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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6">
        <div className="relative flex h-18 w-full items-center justify-between">
          <NavbarLogo />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            <NavLink href="#about" label="About" pathname={pathname} isHash />
            <NavLink href="#faq" label="FAQ" pathname={pathname} isHash />
            <NavLink href="/pricing" label="Pricing" pathname={pathname} />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {session ? (
              <div className="group inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                <Coins className="h-3.5 w-3.5 text-amber-700" />
                <span>{credits}</span>
                {credits === 0 ? (
                  <span className="inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-amber-900 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:max-w-[220px] max-w-0 opacity-0">
                    <span className="text-amber-700">Insufficient credits</span>
                    <span className="text-amber-500">·</span>
                    <Link href="/pricing" className="underline underline-offset-2">
                      Top Up
                    </Link>
                  </span>
                ) : null}
              </div>
            ) : null}

            <NavbarButton as={Link} href="/contact" variant="secondary">
              Contact
            </NavbarButton>
            {session ? (
              <NavbarButton as={Link} href="/dashboard" variant="primary">
                Dashboard
              </NavbarButton>
            ) : (
              <NavbarButton as={Link} href="/sign-in" variant="primary">
                Login
              </NavbarButton>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 lg:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-[2px] w-5 origin-center rounded-full bg-current transition-transform duration-200",
                  isMobileMenuOpen && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] h-[2px] w-5 rounded-full bg-current transition-opacity duration-200",
                  isMobileMenuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[14px] h-[2px] w-5 origin-center rounded-full bg-current transition-transform duration-200",
                  isMobileMenuOpen && "-translate-y-[7px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
        </div>

      <div
        className={cn(
          "overflow-hidden border-t border-zinc-200 transition-all duration-300 ease-out lg:hidden",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div
          className={cn(
            "px-3 py-3 sm:px-6 transition-all duration-300 ease-out",
            isMobileMenuOpen ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]",
          )}
        >
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  pathname={pathname}
                  isHash={item.isHash}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </div>

            {session ? (
              <div className="group mt-3 inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                <Coins className="h-3.5 w-3.5 text-amber-700" />
                <span>{credits}</span>
                {credits === 0 ? (
                  <span className="inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-amber-900 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:max-w-[220px] max-w-0 opacity-0">
                    <span className="text-amber-700">Insufficient credits</span>
                    <span className="text-amber-500">·</span>
                    <Link href="/pricing" className="underline underline-offset-2">
                      Top Up
                    </Link>
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-3">
              <NavbarButton
                as={Link}
                href="/contact"
                variant="secondary"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-zinc-900 shadow-none hover:bg-transparent"
              >
                Contact
              </NavbarButton>
              {session ? (
                <NavbarButton
                  as={Link}
                  href="/dashboard"
                  variant="primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-zinc-900 shadow-none hover:bg-transparent"
                >
                  Dashboard
                </NavbarButton>
              ) : (
                <NavbarButton
                  as={Link}
                  href="/sign-in"
                  variant="primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-zinc-900 shadow-none hover:bg-transparent"
                >
                  Login
                </NavbarButton>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}
