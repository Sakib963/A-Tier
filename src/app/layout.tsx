import type { Metadata } from 'next';
import { Noto_Sans_Bengali } from 'next/font/google';
import { Wordmark } from '@/components/Brand';
import { BRAND } from '@/lib/copy';
import './globals.css';

// Self-hosted so the taka sign renders correctly on every device, not just
// ones that happen to ship a Bengali font. Only the sign uses it, so we pull
// a single weight.
const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: '600',
  display: 'swap',
  variable: '--font-bengali',
});

export const metadata: Metadata = {
  title: 'A-Tier',
  description: BRAND.taglines[0],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={notoBengali.variable}>
      <body className="flex min-h-screen flex-col bg-cream text-turf-950 antialiased">
        <header className="border-b border-turf-900/10">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <Wordmark />
            <p className="hidden text-sm text-turf-700/80 sm:block">
              {BRAND.taglines[0]}
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-12">
          {children}
        </main>

        <footer className="border-t border-turf-900/10 bg-white/50">
          <div className="mx-auto max-w-4xl px-5 py-6 text-center text-xs text-turf-700/70">
            {BRAND.footer}
          </div>
        </footer>
      </body>
    </html>
  );
}
