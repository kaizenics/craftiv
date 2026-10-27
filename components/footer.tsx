"use client";

import Link from "next/link";

const navigation = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Templates", href: "/resume/templates" },
  ],
  company: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Data Deletion", href: "/data-deletion" },
  ],
  resources: [
    { name: "Documentation", href: "https://github.com/kaizenics/craftiv#readme" },
    { name: "Changelog", href: "https://github.com/kaizenics/craftiv/releases" },
    { name: "Source Code", href: "https://github.com/kaizenics/craftiv" },
    { name: "Sponsorships", href: "https://github.com/sponsors/kaizenics" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary font-sans dark:bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div>
                <Link href="/" className="font-display text-2xl font-bold text-white dark:text-foreground">
                  Craftiv
                </Link>
                <p className="mt-4 max-w-xs text-sm text-white/80 dark:text-foreground/70 leading-relaxed">
                  Find roles that fit, tailor every application, and keep track of each one until the offer.
                </p>
              </div>
            </div>

            {/* Navigation Columns */}
            <div>
              <h3 className="font-display text-sm font-semibold text-white dark:text-foreground">Product</h3>
              <ul className="mt-4 space-y-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 dark:text-foreground/70 hover:text-white dark:hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-white dark:text-foreground">Company</h3>
              <ul className="mt-4 space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 dark:text-foreground/70 hover:text-white dark:hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-white dark:text-foreground">Resources</h3>
              <ul className="mt-4 space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/80 dark:text-foreground/70 hover:text-white dark:hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 dark:border-border py-6">
          <p className="text-center text-xs text-white/80 dark:text-foreground/70">
            © {new Date().getFullYear()} Craftiv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
