/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['192.0.0.4'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
