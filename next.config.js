/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
        ],
    },
    // Pass through SEORO_* so they are available at build time (set in Vercel)
    env: {
        SEORO_PUBLIC_BACKEND_URL: process.env.SEORO_PUBLIC_BACKEND_URL,
    },
};

module.exports = nextConfig;
