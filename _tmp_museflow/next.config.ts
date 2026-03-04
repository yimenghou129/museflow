import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 关闭 Turbopack 在 dev 下的文件系统缓存，避免本地 .next 缓存数据库异常导致启动失败
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
