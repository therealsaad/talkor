/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js handles local images via its optimizer in production on supported hosts.
  // Retain image dimensions to prevent layout shifts, and use WebP where supplied.
  images: { formats: ['image/avif', 'image/webp'] },
}
export default nextConfig
