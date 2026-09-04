/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate socket connections during development mounts
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
