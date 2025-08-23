#!/bin/bash

# API Gateway ID 가져오기
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`agrace-run-api`].id' --output text)

if [ -z "$API_ID" ]; then
    echo "❌ agrace-run-api를 찾을 수 없습니다."
    exit 1
fi

REGION="ap-northeast-2"
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod/data"

echo "🔧 설정 파일 업데이트 중..."
echo "API 엔드포인트: $API_ENDPOINT"

# aws-config.js 파일 업데이트
sed -i.bak "s|API_ENDPOINT: '.*'|API_ENDPOINT: '$API_ENDPOINT'|" aws-config.js

echo "✅ aws-config.js 업데이트 완료"

# 업데이트된 파일을 S3에 다시 업로드
aws s3 cp aws-config.js s3://agrace-run-website/aws-config.js

echo "✅ S3에 업데이트된 설정 파일 업로드 완료"
echo ""
echo "🌐 웹사이트 URL: http://agrace-run-website.s3-website-ap-northeast-2.amazonaws.com"