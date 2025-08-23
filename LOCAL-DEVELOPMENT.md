# 로컬 개발 모드

## 현재 상황
AWS 권한 제한으로 인해 클라우드 리소스 생성이 불가능한 상태입니다.

## 로컬 개발 계속하기

### 1. 기존 방식 유지
현재 localStorage를 사용하는 방식으로 계속 개발합니다.

### 2. 로컬 서버 실행
```bash
# Python 3가 설치되어 있다면
python -m http.server 8000

# 또는 Node.js가 설치되어 있다면
npx http-server
```

### 3. 브라우저에서 접속
http://localhost:8000

## AWS 권한 해결 후 마이그레이션

### 필요한 AWS 권한
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*",
                "lambda:*",
                "apigateway:*",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy",
                "iam:PassRole"
            ],
            "Resource": "*"
        }
    ]
}
```

### 권한 획득 후 실행
```powershell
.\create-aws-resources.ps1
```

## 현재 기능 상태
✅ 멤버 관리
✅ 기록 관리  
✅ 스케줄 관리
✅ 페이스 기록
✅ 관리자 페이지
✅ 데이터 백업/복원
❌ 클라우드 동기화 (권한 필요)

## 다음 단계
1. AWS 관리자에게 권한 요청
2. 권한 획득 후 클라우드 마이그레이션
3. 실시간 동기화 활성화