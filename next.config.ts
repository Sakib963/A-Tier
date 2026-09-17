import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The landing page is a self-contained static HTML file in /public.
  async rewrites() {
    return [{ source: '/', destination: '/a-tier.html' }];
  },
};

export default nextConfig;
