import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "hzhlx0obnpowbirz.public.blob.vercel-storage.com",
            },
        ],
    },
};

export default nextConfig;
