const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Build CSP connect-src dynamically so it always includes the configured API
// base URL, regardless of deployment platform (Railway, Render, EC2, etc.).
const connectSrcOrigins = new Set([
  "'self'",
  "https://api.care-guide.ai",
  "https://*.vercel.app",
]);
const apiBase = process.env.NEXT_PUBLIC_API_BASE;
if (apiBase) {
  try {
    connectSrcOrigins.add(new URL(apiBase).origin);
  } catch {
    connectSrcOrigins.add(apiBase);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src ${[...connectSrcOrigins].join(' ')}`,
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://forms.gle",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
