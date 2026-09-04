/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate socket connections during development mounts
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
