/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // This allows SVG images, which is needed for placehold.co
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
      // When you switch to Pexels/Unsplash, you will add their domains here.
    ],
  },
};

export default nextConfig;
