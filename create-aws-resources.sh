#!/bin/bash

echo "🚀 agrace-run AWS 리소스 생성 시작..."

# 변수 설정
WEBSITE_BUCKET="agrace-run-website"
DATA_BUCKET="agrace-run-data"
LAMBDA_FUNCTION_NAME="agrace-run-api"
LAMBDA_ROLE_NAME="agrace-run-lambda-role"
REGION="ap-northeast-2"

# AWS 계정 ID 가져오기
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS 계정 ID: $ACCOUNT_ID"

# 1. S3 버킷 생성
echo "📦 S3 버킷 생성 중..."

# 웹사이트 호스팅용 버킷
aws s3 mb s3://$WEBSITE_BUCKET --region $REGION
if [ $? -eq 0 ]; then
    echo "✅ 웹사이트 버킷 생성 완료: $WEBSITE_BUCKET"
else
    echo "❌ 웹사이트 버킷 생성 실패"
fi

# 데이터 저장용 버킷
aws s3 mb s3://$DATA_BUCKET --region $REGION
if [ $? -eq 0 ]; then
    echo "✅ 데이터 버킷 생성 완료: $DATA_BUCKET"
else
    echo "❌ 데이터 버킷 생성 실패"
fi

# 2. IAM 역할 생성
echo "🔐 IAM 역할 생성 중..."

# Lambda 실행 역할 생성
aws iam create-role \
  --role-name $LAMBDA_ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# 기본 Lambda 실행 정책 연결
aws iam attach-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# S3 접근 정책 생성 및 연결
aws iam put-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-name agrace-run-s3-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::'$DATA_BUCKET'/*"
      }
    ]
  }'

echo "✅ IAM 역할 생성 완료: $LAMBDA_ROLE_NAME"

# 3. Lambda 함수 생성
echo "⚡ Lambda 함수 생성 중..."

# Lambda 함수 패키징
zip lambda-function.zip lambda-function.js

# Lambda 함수 생성 (역할이 생성되는 시간을 기다림)
sleep 10

aws lambda create-function \
  --function-name $LAMBDA_FUNCTION_NAME \
  --runtime nodejs18.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/$LAMBDA_ROLE_NAME \
  --handler lambda-function.handler \
  --zip-file fileb://lambda-function.zip \
  --region $REGION \
  --timeout 30 \
  --memory-size 128

if [ $? -eq 0 ]; then
    echo "✅ Lambda 함수 생성 완료: $LAMBDA_FUNCTION_NAME"
else
    echo "❌ Lambda 함수 생성 실패"
fi

# 4. API Gateway 생성
echo "🌐 API Gateway 생성 중..."

# REST API 생성
API_ID=$(aws apigateway create-rest-api \
  --name agrace-run-api \
  --description "agrace-run running club API" \
  --region $REGION \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# 루트 리소스 ID 가져오기
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query 'items[0].id' \
  --output text)

# /data 리소스 생성
DATA_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part data \
  --region $REGION \
  --query 'id' \
  --output text)

# GET 메서드 생성
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE \
  --region $REGION

# POST 메서드 생성
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE \
  --region $REGION

# OPTIONS 메서드 생성 (CORS)
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION

# Lambda 통합 설정 (GET)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME/invocations \
  --region $REGION

# Lambda 통합 설정 (POST)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME/invocations \
  --region $REGION

# OPTIONS 메서드 응답 설정 (CORS)
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false \
  --region $REGION

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
  --region $REGION

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $DATA_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}'  \
  --region $REGION

# Lambda 권한 부여
aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id agrace-run-api-permission \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*

# API 배포
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "✅ API Gateway 생성 완료"

# 5. 웹사이트 배포
echo "🌐 웹사이트 배포 중..."

# 웹사이트 파일 업로드
aws s3 sync . s3://$WEBSITE_BUCKET \
  --exclude "*.sh" \
  --exclude "*.zip" \
  --exclude "lambda-function.js" \
  --exclude ".git/*" \
  --exclude "*.md"

# 웹사이트 호스팅 설정
aws s3 website s3://$WEBSITE_BUCKET \
  --index-document index.html \
  --error-document index.html

# 퍼블릭 액세스 설정
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

echo "✅ 웹사이트 배포 완료"

# 6. 결과 출력
echo ""
echo "🎉 agrace-run AWS 리소스 생성 완료!"
echo ""
echo "📋 생성된 리소스:"
echo "- 웹사이트 버킷: $WEBSITE_BUCKET"
echo "- 데이터 버킷: $DATA_BUCKET"
echo "- Lambda 함수: $LAMBDA_FUNCTION_NAME"
echo "- IAM 역할: $LAMBDA_ROLE_NAME"
echo "- API Gateway: $API_ID"
echo ""
echo "🌐 웹사이트 URL:"
echo "http://$WEBSITE_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
echo "🔗 API 엔드포인트:"
echo "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/data"
echo ""
echo "📝 다음 단계:"
echo "1. aws-config.js 파일에서 API_ENDPOINT를 위 URL로 업데이트"
echo "2. 웹사이트 접속하여 테스트"
echo ""
echo "💡 API 엔드포인트를 자동으로 업데이트하려면:"
echo "sed -i 's|API_ENDPOINT: .*|API_ENDPOINT: \"https://$API_ID.execute-api.$REGION.amazonaws.com/prod/data\",|' aws-config.js"

# 정리
rm -f lambda-function.zip