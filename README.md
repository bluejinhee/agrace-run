# 🏃‍♂️ 은혜런 (AGrace Run)

큰은혜교회 러닝크루를 위한 팀 러닝 기록 관리 웹 애플리케이션입니다.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![AWS DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-orange?style=flat-square&logo=amazon-aws)
![Mobile Optimized](https://img.shields.io/badge/Mobile-Optimized-green?style=flat-square&logo=mobile)

## ✨ 주요 특징

### 📱 완전 반응형 모바일 최적화
- **터치 친화적 UI**: 최소 44px 터치 영역 보장
- **적응형 레이아웃**: 데스크톱 테이블 → 모바일 카드 뷰 자동 전환
- **반응형 브레이크포인트**: 768px, 600px, 480px 최적화
- **모바일 전용 네비게이션**: 큰 화살표 버튼과 직관적 조작

### 🎯 핵심 기능
- **팀 목표 관리**: 300km 공동 목표 달성 추적
- **개인 기록 관리**: 거리, 시간, 페이스 기록
- **실시간 랭킹**: 거리순 순위와 개인 통계
- **스케줄 관리**: 월별 달력으로 러닝 일정 관리
- **관리자 도구**: 멤버 관리, 데이터 백업/복원

## 🚀 빠른 시작

### 1. 프로젝트 설치
```bash
git clone https://github.com/bluejinhee/agrace-run.git
cd agrace-run
npm install
```

### 2. 환경 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local

# AWS 자격 증명 설정
aws configure
```

### 3. DynamoDB 테이블 생성
```bash
npm run create-tables
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 📱 모바일 최적화

### 반응형 디자인 시스템
| 화면 크기 | 최적화 대상 | 주요 변경사항 |
|-----------|-------------|---------------|
| 768px+ | 데스크톱/태블릿 | 테이블 뷰, 넓은 레이아웃 |
| 600-768px | 태블릿 | 컴팩트 레이아웃, 조정된 폰트 |
| 480-600px | 모바일 | 카드 뷰, 세로 스택 레이아웃 |
| ~480px | 소형 모바일 | 최소 패딩, 큰 터치 영역 |

### 모바일 전용 기능
- **개인 현황 카드**: 테이블을 직관적인 카드 형태로 변환
- **터치 최적화 달력**: 50px 네비게이션 버튼, 명확한 화살표
- **스와이프 지원**: 자연스러운 모바일 제스처
- **빠른 로딩**: Next.js 정적 생성으로 모바일 네트워크 최적화

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **CSS Modules** - 컴포넌트 스타일링
- **React 18** - 최신 React 기능

### Backend & Database
- **AWS DynamoDB** - NoSQL 데이터베이스
- **AWS SDK v3** - AWS 서비스 연동
- **Node.js** - 서버사이드 런타임

### 개발 도구
- **ESLint** - 코드 품질 관리
- **TypeScript** - 정적 타입 검사
- **Git** - 버전 관리

## 📊 주요 기능 상세

### 🎯 팀 목표 관리
```
📈 실시간 진행률 표시
🏆 목표 달성 시 축하 애니메이션
📊 팀 전체 통계 (총 거리, 평균 페이스)
🎉 마일스톤 달성 알림
```

### 👥 개인 현황 (모바일 최적화)
**데스크톱**: 정렬 가능한 테이블 뷰
```
순위 | 이름 | 총거리 | 기록수 | 평균거리 | 평균페이스 | 마지막러닝
```

**모바일**: 직관적인 카드 뷰
```
🥇 [순위]  김러너
주간: 15.2km  월간: 45.8km

📊 통계
총거리: 128.5km  기록수: 24회  평균: 5.4km

⏱️ 5:30 페이스    📅 2일 전
```

### 📅 스케줄 관리
- **월별 달력 뷰**: 러닝 일정 한눈에 확인
- **터치 친화적**: 모바일에서 쉬운 날짜 선택
- **스케줄 표시**: 시간, 장소, 설명 정보

### 📝 기록 입력
- **간편 입력**: 멤버, 거리, 시간 선택
- **자동 계산**: 페이스 자동 계산
- **실시간 미리보기**: 입력 중 멤버 정보 표시

## 🗂️ 프로젝트 구조

```
agrace-run/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── admin/             # 관리자 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 글로벌 스타일
├── components/            # React 컴포넌트
│   ├── Calendar.tsx       # 달력 컴포넌트
│   ├── Stats.tsx          # 개인 현황 (모바일 최적화)
│   ├── TeamGoal.tsx       # 팀 목표
│   ├── RecordForm.tsx     # 기록 입력 폼
│   └── *.module.css       # 컴포넌트별 스타일
├── lib/                   # 유틸리티 라이브러리
│   ├── dynamodb-*.js      # DynamoDB 연동
│   └── dateUtils.ts       # 날짜 유틸리티
├── types/                 # TypeScript 타입 정의
└── contexts/              # React Context
```

## ⚙️ 스크립트 명령어

```bash
# 개발
npm run dev              # 개발 서버 실행
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 실행

# DynamoDB 관리
npm run create-tables    # 테이블 생성
npm run verify-dynamodb  # 연결 확인
npm run delete-tables    # 테이블 삭제 (주의!)

# 코드 품질
npm run lint             # ESLint 검사
npm run type-check       # TypeScript 타입 검사
```

## 🔧 AWS 설정

### 1. IAM 권한 설정
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/RunningClub-*"
    }
  ]
}
```

### 2. 환경 변수 설정
```bash
# .env.local
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=ap-northeast-1
```

### 3. DynamoDB 테이블
- `RunningClub-Members` - 멤버 정보
- `RunningClub-Records` - 러닝 기록  
- `RunningClub-Schedules` - 러닝 스케줄

## 📈 업데이트 히스토리

### 🎯 v2.1.0 (2024-12-19) - 모바일 UI 대폭 개선
- **완전 반응형 모바일 최적화** 완료
- 개인 현황을 **모바일 친화적 카드 레이아웃**으로 재설계
- 달력 네비게이션 **터치 친화적 개선** (50px 버튼, 명확한 화살표)
- **3단계 브레이크포인트** 체계 구축 (768px, 600px, 480px)
- **44px 최소 터치 영역** 보장으로 접근성 향상
- Next.js 14 **viewport 설정** 최신화

### 🗄️ v2.0.0 - DynamoDB 마이그레이션
- AWS Amplify Storage → **DynamoDB 완전 마이그레이션**
- **성능 및 확장성** 대폭 개선
- **AWS IAM 기반 보안** 강화

### 🏃‍♂️ v1.0.0 - 초기 버전
- 기본 러닝 기록 관리 기능
- 멤버 관리 시스템
- 팀 목표 및 진행률 표시

## 🚨 주의사항

### 보안
- 프로덕션에서는 **IAM 역할** 사용 권장
- AWS 자격 증명을 코드에 하드코딩하지 마세요
- 정기적인 **액세스 키 로테이션** 수행

### 성능
- DynamoDB **읽기/쓰기 용량** 모니터링
- **비용 최적화**를 위한 정기적인 사용량 검토
- 대용량 데이터 시 **페이지네이션** 고려

### 데이터 관리
- 정기적인 **데이터 백업** 수행
- 중요한 변경 전 **테스트 환경**에서 검증
- **데이터 마이그레이션** 시 백업 필수

## 🤝 기여하기

1. **Fork** the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

### 개발 가이드라인
- **TypeScript** 타입 정의 필수
- **모바일 우선** 반응형 디자인
- **44px 최소 터치 영역** 준수
- **접근성** 고려한 UI/UX

## 📞 지원 및 문의

- **Issues**: [GitHub Issues](https://github.com/bluejinhee/agrace-run/issues)
- **Wiki**: [프로젝트 위키](https://github.com/bluejinhee/agrace-run/wiki)
- **Email**: 프로젝트 관련 문의

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다.

---

**함께 달리며 건강한 신앙생활을!** 🏃‍♂️🏃‍♀️✨

*Made with ❤️ for 큰은혜교회 러닝크루*