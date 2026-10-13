import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Uploads de escudo, banner e foto de notícia (até 3 MB; a Vercel aceita até 4,5 MB por requisição)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
