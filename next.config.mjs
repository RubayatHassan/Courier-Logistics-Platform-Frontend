/** @type {import('next').NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};
export default nextConfig;
