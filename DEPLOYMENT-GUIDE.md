# 🚀 큰은혜교회 런닝크루 AWS 배포 가이드

## 📋 배포 개요

이 가이드는 가장 저렴하고 관리하기 쉬운 AWS 서버리스 아키텍처로 배포하는 방법을 설명합니다.

### 🏗️ 아키텍처
- **S3**: 정적 웹사이트 호스팅
- **CloudFront**: CDN + HTTPS + 커스텀 도메인
- **Lambda**: 서버리스 백엔드 API
- **API Gateway**: RESTful API 엔드포인트
- **Route53**: 도메인 관리

### 💰 예상 비용 (월)
- **S3**: $0.50 미만
- **Lambda**: 무료 (월 100만 요청까지)
- **API Gateway**: 무료 (월 100만 요청까지)
- **CloudFront**: $0.50 미만 (월 1GB까지 무료)
- **Route53**: $0.50 (호스팅 존 1개)
- **SSL 인증서**: 무료 (AWS Certificate Manager)
- **총 예상 비용: 월 $1-2**

## 🛠️ 사전 준비

### 1. AWS CLI 설치 및 설정
```bash
# AWS CLI 설치 확인
aws --version

# AWS 자격 증명 설정
aws configure
```

### 2. 필요한 권한
- S3 전체 권한
- Lambda 전체 권한
- API Gateway 전체 권한
- CloudFront 전체 권한
- Route53 전체 권한
- Certificate Manager 전체 권한
- IAM 역할 생성 권한

### 3. Route53에서 도메인 준비
- 도메인이 Route53에 등록되어 있어야 합니다
- 또는 다른 등록업체에서 구매한 도메인의 네임서버를 Route53으로 변경

## 🚀 배포 단계

### 1단계: 메인 리소스 배포
```bash
# 실행 권한 부여
chmod +x deploy-with-domain.sh

# 배포 스크립트 실행
./deploy-with-domain.sh
```

스크립트 실행 중 다음 정보를 입력해야 합니다:
- 도메인 이름 (예: agrace-run.com)
- 서브도메인 (선택사항, 예: www, run)

### 2단계: SSL 인증서 DNS 검증
1. AWS 콘솔 → Certificate Manager (us-east-1 리전)
2. 요청된 인증서 클릭
3. DNS 검증용 CNAME 레코드를 Route53에 추가
4. 인증서 상태가 "발급됨"이 될 때까지 대기 (5-10분)

### 3단계: CloudFront에 도메인 연결
1. AWS 콘솔 → CloudFront
2. 생성된 배포 선택
3. "Edit" 클릭
4. "Alternate Domain Names (CNAMEs)"에 도메인 추가
5. "Custom SSL Certificate"에서 발급받은 인증서 선택
6. 변경사항 저장

### 4단계: Route53 도메인 연결
```bash
# Route53 설정 스크립트 실행
chmod +x route53-setup.sh
./route53-setup.sh
```

입력 정보:
- 도메인 이름
- CloudFront 배포 도메인 (예: d1234567890.cloudfront.net)

### 5단계: 배포 완료 확인
1. CloudFront 배포 상태가 "Deployed"가 될 때까지 대기 (15-20분)
2. https://your-domain.com 접속 테스트
3. 연결 상태 확인 (우상단 🟢 표시)

## 🔧 설정 파일 업데이트

배포 후 다음 파일들이 자동으로 업데이트됩니다:
- `aws-config.js`: API 엔드포인트 URL
- `lambda-function.js`: S3 버킷 이름

## 📱 기능 테스트

1. **멤버 관리**: 관리자 페이지에서 멤버 추가/수정/삭제
2. **기록 입력**: 메인 페이지에서 러닝 기록 입력
3. **데이터 동기화**: 클라우드 저장 및 로드 테스트
4. **반응형 디자인**: 모바일/데스크톱 화면 테스트

## 🛠️ 문제 해결

### SSL 인증서 검증 실패
```bash
# Route53에서 CNAME 레코드 확인
aws route53 list-resource-record-sets --hosted-zone-id YOUR-ZONE-ID
```

### API 연결 실패
1. Lambda 함수 로그 확인 (CloudWatch)
2. API Gateway 설정 확인
3. CORS 설정 확인

### CloudFront 캐시 문제
```bash
# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

## 🔄 업데이트 배포

코드 변경 후 업데이트:
```bash
# 웹사이트 파일만 업데이트
aws s3 sync . s3://your-website-bucket --exclude "*.sh" --exclude "*.zip" --exclude "lambda-function.js" --exclude ".git/*" --exclude "*.md"

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

Lambda 함수 업데이트:
```bash
# Lambda 함수 코드 업데이트
zip lambda-function.zip lambda-function.js
aws lambda update-function-code --function-name agrace-run-api --zip-file fileb://lambda-function.zip
```

## 🗑️ 리소스 삭제 (필요시)

```bash
# S3 버킷 삭제
aws s3 rb s3://your-website-bucket --force
aws s3 rb s3://your-data-bucket --force

# Lambda 함수 삭제
aws lambda delete-function --function-name agrace-run-api

# CloudFront 배포 비활성화 후 삭제
aws cloudfront get-distribution-config --id YOUR-DISTRIBUTION-ID
# (ETag 값 확인 후)
aws cloudfront update-distribution --id YOUR-DISTRIBUTION-ID --distribution-config file://disabled-config.json --if-match ETAG-VALUE
aws cloudfront delete-distribution --id YOUR-DISTRIBUTION-ID --if-match NEW-ETAG-VALUE

# API Gateway 삭제
aws apigateway delete-rest-api --rest-api-id YOUR-API-ID

# Route53 레코드 삭제 (도메인 유지 시 생략)
# IAM 역할 삭제
aws iam delete-role --role-name agrace-run-lambda-role
```

## 📞 지원

문제가 발생하면:
1. AWS CloudWatch 로그 확인
2. 스크립트 출력 메시지 확인
3. AWS 콘솔에서 각 서비스 상태 확인

---

**함께 달리며 건강한 신앙생활을!** 🏃‍♂️🏃‍♀️✨