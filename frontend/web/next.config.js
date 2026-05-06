/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@money-os/types', '@money-os/tax-engine', '@money-os/ui'],
}

module.exports = nextConfig
