/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker deployment
  output: 'standalone',
  
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/api/dashboard/images/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "8000",
        pathname: "/api/dashboard/images/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "*",
        port: "",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
