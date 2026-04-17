/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;
