"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@/components/auth-provider";

export function NavbarComponent() {
  const { session } = useAuth();
  const navItems = [
    {
      name: "About",
      link: "#about",
      isHash: true,
    },
    {
      name: "Templates",
      link: "/resume/templates",
      isHash: false,
    },
    {
      name: "FAQ",
      link: "#faq",
      isHash: true,
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleNavClick = (item: typeof navItems[0], e?: React.MouseEvent) => {
    if (item.isHash) {
      e?.preventDefault();
      const element = document.querySelector(item.link);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleDesktopNavClick = (item: typeof navItems[0]) => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (item.isHash) {
        e.preventDefault();
        const element = document.querySelector(item.link);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
  };

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <div
            onMouseLeave={() => setHovered(null)}
            className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
          >
            {navItems.map((item, idx) => {
              if (item.isHash) {
                return (
                  <a
                    key={`link-${idx}`}
                    href={item.link}
                    onMouseEnter={() => setHovered(idx)}
                    onClick={handleDesktopNavClick(item)}
                    className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
                  >
                    {hovered === idx && (
                      <motion.div
                        layoutId="hovered"
                        className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                      />
                    )}
                    <span className="relative z-20">{item.name}</span>
                  </a>
                );
              } else {
                return (
                  <Link
                    key={`link-${idx}`}
                    href={item.link}
                    onMouseEnter={() => setHovered(idx)}
                    className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
                  >
                    {hovered === idx && (
                      <motion.div
                        layoutId="hovered"
                        className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                      />
                    )}
                    <span className="relative z-20">{item.name}</span>
                  </Link>
                );
              }
            })}
          </div>
          <div className="flex items-center gap-4">
            <NavbarButton
              as={Link}
              href="/contact"
              variant="secondary"
            >
              Contact
            </NavbarButton>
            {session ? (
              <NavbarButton
                as={Link}
                href="/dashboard"
                variant="primary"
              >
                Dashboard
              </NavbarButton>
            ) : (
              <NavbarButton
                as={Link}
                href="/sign-in"
                variant="primary"
              >
                Login
              </NavbarButton>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => {
              if (item.isHash) {
                return (
                  <a
                    key={`mobile-link-${idx}`}
                    href={item.link}
                    onClick={(e) => handleNavClick(item, e)}
                    className="relative text-neutral-600 dark:text-neutral-300"
                  >
                    <span className="block">{item.name}</span>
                  </a>
                );
              } else {
                return (
                  <Link
                    key={`mobile-link-${idx}`}
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative text-neutral-600 dark:text-neutral-300"
                  >
                    <span className="block">{item.name}</span>
                  </Link>
                );
              }
            })}
            <div className="flex w-full flex-col gap-4">
              {session ? (
                <NavbarButton
                  as={Link}
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Dashboard
                </NavbarButton>
              ) : (
                <NavbarButton
                  as={Link}
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
              )}
              <NavbarButton
                as={Link}
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Contact
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}

