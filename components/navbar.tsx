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
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  FileText,
  Pen,
} from "@/components/ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templates as resumeTemplates } from "@/lib/data/templates";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";

type HashNavItem = {
  name: string;
  link: string;
  isHash: true;
};

type MegaFeature = {
  tab?: "resume" | "coverLetter";
  title: string;
  description: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MegaSimpleLink = {
  name: string;
  link: string;
};

type MegaMenuData = {
  label: string;
  features: MegaFeature[];
  sectionA: {
    title: string;
    links: MegaSimpleLink[];
  };
  sectionB: {
    title: string;
    links: MegaSimpleLink[];
  };
};

const hashNavItems: HashNavItem[] = [
  { name: "About", link: "#about", isHash: true },
  { name: "FAQ", link: "#faq", isHash: true },
];

const MAX_NAVBAR_TEMPLATE_ITEMS = 10;

const resumeTemplateLinks: MegaSimpleLink[] = resumeTemplates.map((template) => ({
  name: template.name,
  link: `/resume/templates?template=${template.id}`,
})).slice(0, MAX_NAVBAR_TEMPLATE_ITEMS);

const coverLetterTemplateLinks: MegaSimpleLink[] = coverLetterTemplates.map((template) => ({
  name: template.name,
  link: `/cover-letter/write?template=${template.id}`,
})).slice(0, MAX_NAVBAR_TEMPLATE_ITEMS);

const templatesMenuData: MegaMenuData = {
  label: "Templates",
  features: [
    {
      tab: "resume",
      title: "Resume Templates",
      description: "Choose from ATS-friendly resume templates and start building faster.",
      link: "/resume/templates",
      icon: FileText,
    },
    {
      tab: "coverLetter",
      title: "Cover Letter Templates",
      description: "Pick a cover letter style and generate letters tailored to each role.",
      link: "/cover-letter/templates",
      icon: Pen,
    },
    {
      title: "Portfolio Builder",
      description: "Build a polished portfolio with your projects, skills, and achievements. Coming soon.",
      link: "/coming-soon",
      icon: Briefcase,
    },
  ],
  sectionA: {
    title: "Popular Resumes",
    links: resumeTemplateLinks,
  },
  sectionB: {
    title: "Popular Cover Letters",
    links: coverLetterTemplateLinks,
  },
};

function MegaMenuDropdown({
  itemKey,
  hovered,
  setHovered,
  data,
}: {
  itemKey: string;
  hovered: string | null;
  setHovered: React.Dispatch<React.SetStateAction<string | null>>;
  data: MegaMenuData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "coverLetter">("resume");

  const activeSection = activeTab === "resume" ? data.sectionA : data.sectionB;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setHovered(itemKey)}
          className="relative inline-flex appearance-none items-center gap-1.5 rounded-full border-0 bg-transparent px-4 py-2 font-medium text-neutral-600 outline-none transition-colors duration-150 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-0 dark:text-neutral-300"
        >
          {hovered === itemKey && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
            />
          )}
          <span className="relative z-20">{data.label}</span>
          <span
            className={`relative z-20 inline-flex transition-transform duration-150 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={14}
        className="w-[1200px] max-w-[calc(100vw-3rem)] rounded-3xl border border-slate-200/90 bg-white/95 p-0 shadow-[0_16px_48px_rgba(15,59,117,0.12)] data-[state=closed]:fade-out-0 data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:animate-in"
      >
        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-0">
          <div className="space-y-2 border-r border-slate-100 p-5">
            {data.features.map((feature) => {
              const Icon = feature.icon;
              const isSelectable = typeof feature.tab !== "undefined";
              const isActive = isSelectable && activeTab === feature.tab;

              if (!isSelectable) {
                return (
                  <Link
                    key={feature.title}
                    href={feature.link}
                    className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors duration-100 hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <Icon className="h-[20px] w-[20px] shrink-0" />
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[16px] font-semibold tracking-tight text-black">
                        {feature.title}
                        <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-opacity duration-100 group-hover:opacity-100" />
                      </p>
                      <p className="mt-1 text-[14px] leading-6 text-black/80">{feature.description}</p>
                    </div>
                  </Link>
                );
              }

              return (
                <button
                  key={feature.title}
                  type="button"
                  onFocus={() => {
                    if (feature.tab) setActiveTab(feature.tab);
                  }}
                  onClick={() => {
                    if (feature.tab) setActiveTab(feature.tab);
                  }}
                  className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-100 ${
                    isActive
                      ? "border-slate-200 bg-slate-50"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  } cursor-pointer`}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Icon className="h-[20px] w-[20px] shrink-0" />
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-[16px] font-semibold tracking-tight text-black">
                      {feature.title}
                      <ArrowRight className={`h-3.5 w-3.5 transition-opacity duration-100 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
                    </p>
                    <p className="mt-1 text-[14px] leading-6 text-black/80">{feature.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-r border-slate-100 p-6">
            <p className="mb-3 inline-flex items-center gap-1 text-lg font-semibold tracking-tight text-black">
              {activeSection.title}
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </p>
            <div className="space-y-1">
              {activeSection.links.map((link) => (
                <Link
                  key={link.name}
                  href={link.link}
                  className="block rounded-md px-2.5 py-1.5 text-[17px] text-black transition-colors duration-100 hover:bg-slate-50"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-2xl">
              {activeTab === "resume" ? (
                <>
                  <div className="relative h-36 overflow-hidden rounded-2xl bg-[#6fc0eb]">
                    <div className="absolute left-14 top-3 h-28 w-32 rounded-sm bg-white shadow-md">
                      <div className="space-y-1 px-2 py-2">
                        <p className="text-[9px] font-semibold leading-none text-zinc-700">KATHLEEN</p>
                        <p className="text-[9px] font-semibold leading-none text-zinc-700">JONES</p>
                        <div className="space-y-1 pt-1">
                          <div className="h-1 w-16 rounded bg-zinc-200" />
                          <div className="h-1 w-14 rounded bg-zinc-100" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-32 top-3 h-28 w-36 rounded-sm border-l border-zinc-200 bg-white shadow-lg">
                      <div className="space-y-1 px-2 py-2">
                        <div className="h-2 w-8 rounded bg-zinc-300" />
                        <div className="h-1 w-20 rounded bg-zinc-200" />
                        <div className="h-1 w-20 rounded bg-zinc-100" />
                        <div className="mt-3 h-2 w-7 rounded bg-zinc-300" />
                        <div className="h-1 w-20 rounded bg-zinc-200" />
                        <div className="h-1 w-20 rounded bg-zinc-100" />
                      </div>
                    </div>

                    <div className="absolute right-8 top-10 grid grid-cols-4 gap-1.5 rounded-md bg-white/90 p-2 shadow-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2b6fdb]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#56b9df]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#12a5ab]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#f49a22]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d95030]" />
                    </div>

                    <div className="absolute left-8 top-[55px] h-6 w-6 -rotate-12 rounded-full bg-[#ffd37b] text-[#9b5b00]">
                      <FileText className="m-1 h-4 w-4" />
                    </div>
                    <div className="absolute right-6 top-[74px] h-7 w-7 rotate-12 rounded-md bg-[#87e299] text-[#1a7d2d]">
                      <Pen className="m-1.5 h-4 w-4" />
                    </div>
                  </div>

                  <h4 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-black">
                    Save time with our builder
                  </h4>
                  <p className="mt-2 text-[16px] leading-6 text-black/70">
                    In just a few clicks you can make a professional resume with our AI Resume Builder.
                  </p>

                  <Link
                    href="/resume/templates"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#355de8] px-5 py-3 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#2f53cf]"
                  >
                    Build your resume
                  </Link>
                </>
              ) : (
                <>
                  <div className="relative h-36 overflow-hidden rounded-2xl bg-[#f3c775]">
                    <div className="absolute left-10 top-0 h-10 w-12 border-t-[3px] border-l-[3px] border-[#5fb5ff]" />
                    <div className="absolute left-14 top-5 h-26 w-40 rounded-sm bg-white shadow-lg">
                      <div className="space-y-1 px-2 py-2">
                        <div className="h-2 w-16 rounded bg-zinc-700" />
                        <div className="h-1 w-24 rounded bg-zinc-200" />
                        <div className="mt-2 h-2 w-10 rounded bg-zinc-300" />
                        <div className="h-1 w-28 rounded bg-zinc-200" />
                        <div className="h-1 w-28 rounded bg-zinc-100" />
                        <div className="mt-2 h-2 w-10 rounded bg-zinc-300" />
                        <div className="h-1 w-28 rounded bg-zinc-200" />
                      </div>
                    </div>

                    <div className="absolute right-8 top-12 flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2f3f] bg-[#75cdf8] text-[#1f2f3f]">
                      <ChevronDown className="h-5 w-5" />
                    </div>
                    <div className="absolute right-4 top-[86px] h-7 w-7 rotate-12 rounded-md bg-[#87e299] text-[#1a7d2d]">
                      <Pen className="m-1.5 h-4 w-4" />
                    </div>
                  </div>

                  <h4 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-black">
                    Save time with our builder
                  </h4>
                  <p className="mt-2 text-[16px] leading-6 text-black/70">
                    In just a few clicks you can make a professional cover letter with our AI Cover Letter Builder.
                  </p>

                  <Link
                    href="/cover-letter/templates"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#355de8] px-5 py-3 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#2f53cf]"
                  >
                    Build your cover letter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NavbarComponent() {
  const { session } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleNavClick = (item: HashNavItem, e?: React.MouseEvent) => {
    if (item.isHash) {
      e?.preventDefault();
      const element = document.querySelector(item.link);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleDesktopNavClick = (item: HashNavItem) => {
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
            className="absolute left-1/2 top-1/2 z-10 hidden w-max -translate-x-1/2 -translate-y-1/2 flex-row items-center justify-center gap-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex"
          >
            <a
              href={hashNavItems[0].link}
              onMouseEnter={() => setHovered("about")}
              onClick={handleDesktopNavClick(hashNavItems[0])}
              className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
            >
              {hovered === "about" && (
                <motion.div
                  layoutId="hovered"
                  className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                />
              )}
              <span className="relative z-20">About</span>
            </a>

            <MegaMenuDropdown
              itemKey="templates"
              hovered={hovered}
              setHovered={setHovered}
              data={templatesMenuData}
            />

            <a
              href={hashNavItems[1].link}
              onMouseEnter={() => setHovered("faq")}
              onClick={handleDesktopNavClick(hashNavItems[1])}
              className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
            >
              {hovered === "faq" && (
                <motion.div
                  layoutId="hovered"
                  className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                />
              )}
              <span className="relative z-20">FAQ</span>
            </a>
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
            <a
              href={hashNavItems[0].link}
              onClick={(e) => handleNavClick(hashNavItems[0], e)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">About</span>
            </a>

            <details className="w-full rounded-lg">
              <summary className="cursor-pointer font-medium text-neutral-700">Templates</summary>
              <div className="mt-3 space-y-3 pl-1">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Popular Resumes</p>
                  <div className="space-y-1.5">
                    {resumeTemplateLinks.map((link) => (
                      <Link
                        key={`mobile-resume-${link.name}`}
                        href={link.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-neutral-600"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Popular Cover Letters</p>
                  <div className="space-y-1.5">
                    {coverLetterTemplateLinks.map((link) => (
                      <Link
                        key={`mobile-cover-${link.name}`}
                        href={link.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-neutral-600"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            <a
              href={hashNavItems[1].link}
              onClick={(e) => handleNavClick(hashNavItems[1], e)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">FAQ</span>
            </a>
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

