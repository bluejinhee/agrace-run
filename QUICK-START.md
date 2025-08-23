# 🚀 agrace-run 빠른 시작 가이드

## 사전 준비
1. **AWS CLI 설치 및 설정**
   ```powershell
   # AWS CLI 설치 확인
   aws --version
   
   # AWS 자격 증명 설정
   aws configure
   ```

2. **필요한 권한**
   - S3 전체 권한
   - Lambda 전체 권한
   - API Gateway 전체 권한
   - IAM 역할 생성 권한

## 원클릭 배포

### Windows (PowerShell)
```powershell
# 관리자 권한으로 PowerShell 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 스크립트 실행
.\create-aws-resources.ps1
```

### Linux/Mac (Bash)
```bash
# 실행 권한 부여
chmod +x create-aws-resources.sh

# 스크립트 실행
./create-aws-resources.sh
```

## 생성되는 리소스

### S3 버킷
- `agrace-run-website`: 웹사이트 호스팅
- `agrace-run-data`: 데이터 저장

### Lambda 함수
- `agrace-run-api`: 데이터 API 서버

### API Gateway
- `agrace-run-api`: RESTful API 엔드포인트

### IAM 역할
- `agrace-run-lambda-role`: Lambda 실행 역할

## 예상 비용
- **월 $0~5** (무료 티어 내에서 사용 가능)
- S3: $0.50 미만
- Lambda: 무료 (100만 요청까지)
- API Gateway: 무료 (100만 요청까지)

## 배포 완료 후
1. 스크립트 실행 완료 시 출력되는 웹사이트 URL 접속
2. 연결 상태 확인 (우상단 🟢 표시)
3. 멤버 추가 및 기록 입력 테스트
4. 관리자 페이지에서 데이터 관리 테스트

## 문제 해결

### 권한 오류
```powershell
# AWS 자격 증명 재설정
aws configure
```

### 버킷 이름 충돌
- 전 세계적으로 고유해야 하므로 스크립트에서 랜덤 접미사 추가 필요

### API 연결 실패
- aws-config.js의 API_ENDPOINT 확인
- CORS 설정 확인

## 리소스 삭제 (필요시)
```powershell
# S3 버킷 삭제
aws s3 rb s3://agrace-run-website --force
aws s3 rb s3://agrace-run-data --force

# Lambda 함수 삭제
aws lambda delete-function --function-name agrace-run-api

# API Gateway 삭제
aws apigateway delete-rest-api --rest-api-id [API-ID]

# IAM 역할 삭제
aws iam delete-role --role-name agrace-run-lambda-role
```

## 지원
문제가 발생하면 AWS CloudWatch 로그를 확인하거나 스크립트 출력 메시지를 참고하세요.