/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // تجاهل أخطاء TypeScript
    ignoreBuildErrors: true
  },
  eslint: {
    // تجاهل أخطاء ESLint
    ignoreDuringBuilds: true
  }
}

export default nextConfig
