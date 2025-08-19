/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  optimizeFonts: false,
  images: {
    unoptimized: true
  }
}

export default nextConfig
