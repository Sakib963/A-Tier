import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A-Tier',
  description: 'The football fund that finally adds up.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-cream text-turf-950 antialiased">{children}</body>
    </html>
  );
}
