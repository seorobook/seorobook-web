/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
        ],
    },
    // Pass through SEORO_* so they are available at build time (set in Vercel)
    env: {
        SEORO_PUBLIC_SUPABASE_URL: process.env.SEORO_PUBLIC_SUPABASE_URL,
        SEORO_PUBLIC_SUPABASE_ANON_KEY: process.env.SEORO_PUBLIC_SUPABASE_ANON_KEY,
        SEORO_PUBLIC_BASE_URL: process.env.SEORO_PUBLIC_BASE_URL,
        SEORO_PUBLIC_BACKEND_URL: process.env.SEORO_PUBLIC_BACKEND_URL,
    },
};

module.exports = nextConfig;
