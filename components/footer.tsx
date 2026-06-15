"use client";

import Link from "next/link";

const navigation = {
  product: [
    { name: "Features", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Templates", href: "/resume/templates" },
  ],
  company: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Data Deletion", href: "/data-deletion" },
  ],
  support: [
    { name: "Contact", href: "/contact" },
  ],
};

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/gocraftiv",
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-primary font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div>
                <Link href="/" className="font-display text-2xl font-bold text-white">
                  Craftiv
                </Link>
                <p className="mt-4 max-w-xs text-sm text-white/80 leading-relaxed">
                 Build professional resumes that get you noticed by hiring managers. Simple, powerful tools to accelerate your career success.
                </p>
                {/* Social Links */}
                <div className="mt-6 flex gap-4">
                  {socialLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Craftiv on ${item.name}`}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <span className="sr-only">{item.name}</span>
                      <item.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Columns */}
            <div>
              <h3 className="font-display text-sm font-semibold text-white">Product</h3>
              <ul className="mt-4 space-y-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-white">Company</h3>
              <ul className="mt-4 space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold text-white">Support</h3>
              <ul className="mt-4 space-y-3">
                {navigation.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 py-6">
          <p className="text-center text-xs text-white/80">
            © {new Date().getFullYear()} Craftiv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
