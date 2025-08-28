/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 정적 사이트 생성
  trailingSlash: true,
  images: {
    unoptimized: true, // 정적 배포를 위해
  },
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    NEXT_PUBLIC_DYNAMODB_MEMBERS_TABLE: process.env.NEXT_PUBLIC_DYNAMODB_MEMBERS_TABLE,
    NEXT_PUBLIC_DYNAMODB_RECORDS_TABLE: process.env.NEXT_PUBLIC_DYNAMODB_RECORDS_TABLE,
    NEXT_PUBLIC_DYNAMODB_SCHEDULES_TABLE: process.env.NEXT_PUBLIC_DYNAMODB_SCHEDULES_TABLE,
  },
};

export default nextConfig;