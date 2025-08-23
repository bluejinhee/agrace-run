# AWS 설정 가이드

## 1. 사전 준비
- AWS 계정 생성
- AWS CLI 설치 및 설정
- 적절한 IAM 권한 설정

## 2. S3 버킷 생성

### 웹사이트 호스팅용 버킷
```bash
aws s3 mb s3://running-club-website-[고유번호]
```

### 데이터 저장용 버킷
```bash
aws s3 mb s3://running-club-data-[고유번호]
```

## 3. Lambda 함수 생성

### IAM 역할 생성
```bash
aws iam create-role --role-name lambda-execution-role --assume-role-policy-document '{
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

aws iam attach-role-policy --role-name lambda-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy --role-name lambda-execution-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Lambda 함수 배포
1. `lambda-function.js`에서 `BUCKET_NAME` 수정
2. 함수 압축 및 업로드:
```bash
zip lambda-function.zip lambda-function.js
aws lambda create-function \
  --function-name running-club-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR-ACCOUNT-ID:role/lambda-execution-role \
  --handler lambda-function.handler \
  --zip-file fileb://lambda-function.zip
```

## 4. API Gateway 설정

### AWS 콘솔에서 수동 설정:
1. API Gateway 콘솔 접속
2. "REST API" 생성
3. 리소스 생성: `/data`
4. 메서드 추가: `GET`, `POST`, `OPTIONS`
5. Lambda 함수와 연결
6. CORS 활성화
7. API 배포

### API 엔드포인트 URL 복사
- 형태: `https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod/data`

## 5. 웹사이트 설정

### aws-config.js 수정
```javascript
const AWS_CONFIG = {
    API_ENDPOINT: 'https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod/data'
};
```

### 웹사이트 배포
```bash
aws s3 sync . s3://running-club-website-[고유번호] --exclude "*.md" --exclude "*.sh" --exclude "lambda-function.*"

aws s3 website s3://running-club-website-[고유번호] --index-document index.html
```

### 퍼블릭 액세스 허용
```bash
aws s3api put-bucket-policy --bucket running-club-website-[고유번호] --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::running-club-website-[고유번호]/*"
    }
  ]
}'
```

## 6. 테스트

### 웹사이트 접속
- URL: `http://running-club-website-[고유번호].s3-website-ap-northeast-2.amazonaws.com`

### 기능 테스트
1. 페이지 로드 시 연결 상태 확인
2. 멤버 추가/수정/삭제
3. 기록 추가/수정/삭제
4. 스케줄 관리
5. 데이터 동기화 확인

## 7. 비용 예상
- S3 스토리지: 월 $0.50 미만
- Lambda 호출: 월 $0.20 미만 (100만 요청까지 무료)
- API Gateway: 월 $3.50 (100만 요청까지 무료)
- **총 예상 비용: 월 $0~5**

## 8. 보안 고려사항
- API Gateway에서 요청 제한 설정
- CloudFront 사용으로 DDoS 방어
- 필요시 API 키 인증 추가

## 9. 모니터링
- CloudWatch 로그 확인
- Lambda 함수 성능 모니터링
- S3 액세스 로그 활성화