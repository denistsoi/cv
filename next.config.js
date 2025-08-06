/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/classroom',
        destination: '/class',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
