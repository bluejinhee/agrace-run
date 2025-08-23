# PowerShell 스크립트 - agrace-run AWS 리소스 생성

Write-Host "🚀 agrace-run AWS 리소스 생성 시작..." -ForegroundColor Green

# 변수 설정
$WEBSITE_BUCKET = "agrace-run-website"
$DATA_BUCKET = "agrace-run-data"
$LAMBDA_FUNCTION_NAME = "agrace-run-api"
$LAMBDA_ROLE_NAME = "agrace-run-lambda-role"
$REGION = "ap-northeast-2"

# AWS 계정 ID 가져오기
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "AWS 계정 ID: $ACCOUNT_ID" -ForegroundColor Yellow

# 1. S3 버킷 생성
Write-Host "📦 S3 버킷 생성 중..." -ForegroundColor Cyan

# 웹사이트 호스팅용 버킷
aws s3 mb s3://$WEBSITE_BUCKET --region $REGION
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 웹사이트 버킷 생성 완료: $WEBSITE_BUCKET" -ForegroundColor Green
} else {
    Write-Host "❌ 웹사이트 버킷 생성 실패" -ForegroundColor Red
}

# 데이터 저장용 버킷
aws s3 mb s3://$DATA_BUCKET --region $REGION
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 데이터 버킷 생성 완료: $DATA_BUCKET" -ForegroundColor Green
} else {
    Write-Host "❌ 데이터 버킷 생성 실패" -ForegroundColor Red
}

# 2. IAM 역할 생성
Write-Host "🔐 IAM 역할 생성 중..." -ForegroundColor Cyan

# Lambda 실행 역할 생성
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
}

$trustPolicy | ConvertTo-Json -Depth 10 | Out-File -FilePath "trust-policy.json" -Encoding ascii
aws iam create-role --role-name $LAMBDA_ROLE_NAME --assume-role-policy-document file://trust-policy.json

# 기본 Lambda 실행 정책 연결
aws iam attach-role-policy --role-name $LAMBDA_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# S3 접근 정책 생성 및 연결
$s3Policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            )
            Resource = "arn:aws:s3:::$DATA_BUCKET/*"
        }
    )
}

$s3Policy | ConvertTo-Json -Depth 10 | Out-File -FilePath "s3-policy.json" -Encoding ascii
aws iam put-role-policy --role-name $LAMBDA_ROLE_NAME --policy-name agrace-run-s3-policy --policy-document file://s3-policy.json

Write-Host "✅ IAM 역할 생성 완료: $LAMBDA_ROLE_NAME" -ForegroundColor Green

# 3. Lambda 함수 생성
Write-Host "⚡ Lambda 함수 생성 중..." -ForegroundColor Cyan

# Lambda 함수 패키징
Compress-Archive -Path lambda-function.js -DestinationPath lambda-function.zip -Force

# Lambda 함수 생성 (역할이 생성되는 시간을 기다림)
Start-Sleep -Seconds 10

aws lambda create-function --function-name $LAMBDA_FUNCTION_NAME --runtime nodejs18.x --role arn:aws:iam::${ACCOUNT_ID}:role/$LAMBDA_ROLE_NAME --handler lambda-function.handler --zip-file fileb://lambda-function.zip --region $REGION --timeout 30 --memory-size 128

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda 함수 생성 완료: $LAMBDA_FUNCTION_NAME" -ForegroundColor Green
} else {
    Write-Host "❌ Lambda 함수 생성 실패" -ForegroundColor Red
}

# 4. API Gateway 생성
Write-Host "🌐 API Gateway 생성 중..." -ForegroundColor Cyan

# REST API 생성
$API_ID = aws apigateway create-rest-api --name agrace-run-api --description "agrace-run running club API" --region $REGION --query 'id' --output text

Write-Host "API ID: $API_ID" -ForegroundColor Yellow

# 루트 리소스 ID 가져오기
$ROOT_RESOURCE_ID = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text

# /data 리소스 생성
$DATA_RESOURCE_ID = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_RESOURCE_ID --path-part data --region $REGION --query 'id' --output text

# 메서드 생성
aws apigateway put-method --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method GET --authorization-type NONE --region $REGION
aws apigateway put-method --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method POST --authorization-type NONE --region $REGION
aws apigateway put-method --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method OPTIONS --authorization-type NONE --region $REGION

# Lambda 통합 설정
aws apigateway put-integration --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:$LAMBDA_FUNCTION_NAME/invocations --region $REGION

aws apigateway put-integration --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:$LAMBDA_FUNCTION_NAME/invocations --region $REGION

# CORS 설정
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false --region $REGION

aws apigateway put-integration --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method OPTIONS --type MOCK --request-templates '{\"application/json\":\"{\\\"statusCode\\\": 200}\"}' --region $REGION

aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $DATA_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\",\"method.response.header.Access-Control-Allow-Methods\":\"GET,POST,OPTIONS\",\"method.response.header.Access-Control-Allow-Origin\":\"*\"}' --region $REGION

# Lambda 권한 부여
aws lambda add-permission --function-name $LAMBDA_FUNCTION_NAME --statement-id agrace-run-api-permission --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*

# API 배포
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION

Write-Host "✅ API Gateway 생성 완료" -ForegroundColor Green

# 5. 설정 파일 업데이트
Write-Host "🔧 설정 파일 업데이트 중..." -ForegroundColor Cyan

$API_ENDPOINT = "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/data"
$configContent = Get-Content aws-config.js -Raw
$configContent = $configContent -replace "API_ENDPOINT: '.*'", "API_ENDPOINT: '$API_ENDPOINT'"
$configContent | Set-Content aws-config.js

Write-Host "✅ aws-config.js 업데이트 완료" -ForegroundColor Green

# 6. 웹사이트 배포
Write-Host "🌐 웹사이트 배포 중..." -ForegroundColor Cyan

# 웹사이트 파일 업로드
aws s3 sync . s3://$WEBSITE_BUCKET --exclude "*.ps1" --exclude "*.sh" --exclude "*.zip" --exclude "lambda-function.js" --exclude ".git/*" --exclude "*.md"

# 웹사이트 호스팅 설정
aws s3 website s3://$WEBSITE_BUCKET --index-document index.html --error-document index.html

# 퍼블릭 액세스 설정
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$WEBSITE_BUCKET/*"
        }
    )
}

$bucketPolicy | ConvertTo-Json -Depth 10 | Out-File -FilePath "bucket-policy.json" -Encoding ascii
aws s3api put-bucket-policy --bucket $WEBSITE_BUCKET --policy file://bucket-policy.json

Write-Host "✅ 웹사이트 배포 완료" -ForegroundColor Green

# 7. 결과 출력
Write-Host ""
Write-Host "🎉 agrace-run AWS 리소스 생성 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 생성된 리소스:" -ForegroundColor Yellow
Write-Host "- 웹사이트 버킷: $WEBSITE_BUCKET"
Write-Host "- 데이터 버킷: $DATA_BUCKET"
Write-Host "- Lambda 함수: $LAMBDA_FUNCTION_NAME"
Write-Host "- IAM 역할: $LAMBDA_ROLE_NAME"
Write-Host "- API Gateway: $API_ID"
Write-Host ""
Write-Host "🌐 웹사이트 URL:" -ForegroundColor Cyan
Write-Host "http://$WEBSITE_BUCKET.s3-website-$REGION.amazonaws.com"
Write-Host ""
Write-Host "🔗 API 엔드포인트:" -ForegroundColor Cyan
Write-Host "$API_ENDPOINT"
Write-Host ""
Write-Host "✅ 모든 설정이 완료되었습니다. 웹사이트에 접속해서 테스트해보세요!" -ForegroundColor Green

# 정리
Remove-Item lambda-function.zip -ErrorAction SilentlyContinue
Remove-Item trust-policy.json -ErrorAction SilentlyContinue
Remove-Item s3-policy.json -ErrorAction SilentlyContinue
Remove-Item bucket-policy.json -ErrorAction SilentlyContinue