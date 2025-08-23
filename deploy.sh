#!/bin/bash

# 배포 스크립트
echo "🚀 큰은혜교회 런닝크루 웹사이트 배포 시작..."

# 변수 설정
WEBSITE_BUCKET="agrace-run-website"
DATA_BUCKET="agrace-run-data"
LAMBDA_FUNCTION_NAME="agrace-run-api"
REGION="ap-northeast-2"

# 1. Lambda 함수 배포
echo "📦 Lambda 함수 배포 중..."
zip lambda-function.zip lambda-function.js

aws lambda create-function \
  --function-name $LAMBDA_FUNCTION_NAME \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR-ACCOUNT-ID:role/lambda-execution-role \
  --handler lambda-function.handler \
  --zip-file fileb://lambda-function.zip \
  --region $REGION

# 2. API Gateway 생성 (수동으로 해야 함)
echo "⚠️  API Gateway는 AWS 콘솔에서 수동으로 생성해주세요."

# 3. 웹사이트 파일 업로드
echo "🌐 웹사이트 파일 업로드 중..."
aws s3 sync . s3://$WEBSITE_BUCKET \
  --exclude "*.sh" \
  --exclude "*.zip" \
  --exclude "lambda-function.js" \
  --exclude ".git/*" \
  --exclude "README.md"

# 4. 웹사이트 호스팅 설정
echo "🔧 웹사이트 호스팅 설정 중..."
aws s3 website s3://$WEBSITE_BUCKET \
  --index-document index.html \
  --error-document index.html

# 5. 퍼블릭 액세스 설정
echo "🔓 퍼블릭 액세스 설정 중..."
aws s3api put-bucket-policy \
  --bucket $WEBSITE_BUCKET \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$WEBSITE_BUCKET'/*"
      }
    ]
  }'

echo "✅ 배포 완료!"
echo "🌐 웹사이트 URL: http://$WEBSITE_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
echo "📋 다음 단계:"
echo "1. AWS 콘솔에서 API Gateway 생성"
echo "2. aws-config.js에서 API_ENDPOINT URL 업데이트"
echo "3. Lambda 함수에서 BUCKET_NAME 업데이트"