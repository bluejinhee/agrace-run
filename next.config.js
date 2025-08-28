/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 정적 사이트 생성
  trailingSlash: true,
  images: {
    unoptimized: true, // 정적 배포를 위해
  },
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  },
};

export default nextConfig;