# 은혜런 (AGrace Run)

큰은혜교회 런닝크루를 위한 팀 러닝 기록 관리 웹사이트입니다.

## 🏃‍♂️ 주요 기능

### 📊 팀 목표 관리
- 전체 런닝크루가 함께 300km 목표 달성
- 실시간 진행률 표시
- 목표 달성 시 회식 알림 🎉

### 📝 기록 관리
- 멤버별 러닝 기록 입력
- 날짜 지정 가능
- 최근 기록 10개 표시

### 👥 멤버 관리
- 개인별 누적 거리 및 출석 횟수
- 팀 기여도 계산
- 거리순 랭킹 표시 (1등에게 👑)

### ⚙️ 관리자 기능
- 멤버 등록/수정/삭제
- 데이터 백업/복원
- 전체 데이터 관리

## 🚀 설정 및 사용 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. DynamoDB 테이블 생성
```bash
npm run create-tables
```

### 3. DynamoDB 연결 확인
```bash
npm run verify-dynamodb
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 정적 파일 사용 (선택사항)
- `index.html` 파일을 브라우저에서 직접 열기
- 멤버 등록은 하단의 "관리자" 링크에서
- 러닝 기록은 메인 페이지에서 입력
- 데이터는 DynamoDB에 자동 저장

## 📱 특징

- 📱 모바일 친화적 반응형 디자인
- 💾 로컬 스토리지 자동 저장
- 🎨 직관적이고 깔끔한 UI
- 🏆 게임화 요소 (랭킹, 진행률, 축하 메시지)

## 🛠️ 기술 스택

### Frontend
- HTML5
- CSS3 (Flexbox, Grid)
- Vanilla JavaScript
- Next.js 14 (TypeScript)
- React 18

### Backend & Database
- AWS DynamoDB
- AWS SDK v3
- Node.js

### 개발 도구
- TypeScript
- ESLint
- npm

## 📄 파일 구조

```
├── index.html          # 메인 페이지
├── admin.html          # 관리자 페이지
├── script.js           # 메인 페이지 스크립트
├── admin.js            # 관리자 페이지 스크립트
├── style.css           # 스타일시트
└── README.md           # 프로젝트 설명
```

## 🎯 사용 대상

- 교회 런닝크루
- 팀 단위 운동 모임
- 공동 목표를 가진 러닝 그룹

---

**함께 달리며 건강한 신앙생활을!** 🏃‍♂️🏃‍♀️✨

## 🔧 DynamoDB 설정

### AWS 자격 증명 설정
1. AWS CLI 설치 및 구성
```bash
aws configure
```

2. 또는 환경 변수 설정
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 필요한 IAM 권한
DynamoDB 테이블에 대한 다음 권한이 필요합니다:
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Scan`
- `dynamodb:Query`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`

자세한 IAM 정책은 `dynamodb-iam-policy.json` 파일을 참조하세요.

## 📊 데이터베이스 구조

### 테이블 목록
- `RunningClub-Members` - 멤버 정보
- `RunningClub-Records` - 러닝 기록
- `RunningClub-Schedules` - 러닝 스케줄

자세한 테이블 구조는 `DYNAMODB-MIGRATION.md` 파일을 참조하세요.

## 🔄 마이그레이션

이 프로젝트는 AWS Amplify Storage (S3)에서 DynamoDB로 마이그레이션되었습니다.
마이그레이션 세부사항은 `DYNAMODB-MIGRATION.md` 파일을 참조하세요.

## 📝 스크립트 명령어

- `npm run dev` - Next.js 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run create-tables` - DynamoDB 테이블 생성
- `npm run verify-dynamodb` - DynamoDB 연결 확인
- `npm run delete-tables` - DynamoDB 테이블 삭제 (주의!)

## 🚨 주의사항

1. **AWS 자격 증명**: 프로덕션 환경에서는 IAM 역할을 사용하세요
2. **브라우저 접근**: 클라이언트에서 DynamoDB 직접 접근 시 Cognito Identity Pool 설정 필요
3. **데이터 백업**: 정기적으로 데이터를 백업하세요
4. **비용 관리**: DynamoDB 사용량을 모니터링하세요

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.