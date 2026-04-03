import type { Metadata } from 'next';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export const metadata: Metadata = {
  title: 'Dashboard | Layro',
  description: 'Create ATS-optimized, professionally designed resumes that land interviews. No credit card, no hidden fees—just free, forever.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="transition-all duration-300 lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8 lg:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}