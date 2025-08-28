# Design Document

## Overview

큰은혜교회 러닝크루 애플리케이션을 바닐라 JavaScript에서 Next.js로 마이그레이션하는 설계입니다. 현재 애플리케이션은 멤버 관리, 러닝 기록 추가, 팀 목표 추적, 스케줄 관리 기능을 제공하며, AWS Amplify와 DynamoDB를 통해 데이터를 관리합니다.

## Architecture

### 현재 아키텍처 분석
- **Frontend**: 바닐라 HTML/CSS/JavaScript
- **Storage**: AWS S3 (Amplify Storage)
- **Authentication**: 없음 (공개 접근)
- **Deployment**: 정적 파일 호스팅

### 목표 아키텍처
- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + 기존 스타일 유지
- **Storage**: AWS Amplify (기존 유지)
- **State Management**: React hooks (useState, useEffect, useContext)
- **Deployment**: Vercel 또는 AWS Amplify Hosting

## Components and Interfaces

### 1. 페이지 구조 (App Router)

```
app/
├── layout.tsx                 # 루트 레이아웃
├── page.tsx                   # 메인 페이지 (/)
├── admin/
│   └── page.tsx              # 관리자 페이지 (/admin)
├── globals.css               # 전역 스타일
└── components/               # 재사용 가능한 컴포넌트
```

### 2. 컴포넌트 계층 구조

#### 메인 페이지 컴포넌트
```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <div className="container">
      <Header />
      <ScheduleSection />
      <TeamGoalSection />
      <RecordSection />
      <StatsSection />
      <RecentRecordsSection />
      <CelebrationSection />
    </div>
  );
}
```

#### 관리자 페이지 컴포넌트
```typescript
// app/admin/page.tsx
export default function AdminPage() {
  return (
    <div className="container">
      <AdminHeader />
      <MemberManagement />
      <ScheduleManagement />
      <RecordManagement />
      <DataManagement />
    </div>
  );
}
```

### 3. 핵심 컴포넌트 설계

#### Header 컴포넌트
```typescript
interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
```

#### Calendar 컴포넌트
```typescript
interface CalendarProps {
  schedules: Schedule[];
  onDateClick?: (date: Date) => void;
}

export function Calendar({ schedules, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // 달력 로직 구현
}
```

#### RecordForm 컴포넌트
```typescript
interface RecordFormProps {
  members: Member[];
  onSubmit: (record: NewRecord) => Promise<void>;
}

export function RecordForm({ members, onSubmit }: RecordFormProps) {
  // 기록 입력 폼 로직
}
```

## Data Models

### TypeScript 인터페이스 정의

```typescript
// types/index.ts

export interface Member {
  id: number;
  name: string;
  totalDistance: number;
  recordCount: number;
  joinDate: string;
}

export interface Record {
  id: number;
  memberId: number;
  distance: number;
  pace?: string;
  date: string;
  time: string;
  originalDate: string;
}

export interface Schedule {
  id: number;
  date: string;
  time: string;
  location: string;
  description?: string;
  createdAt: string;
}

export interface NewRecord {
  memberId: number;
  distance: number;
  pace?: string;
  date: string;
}

export interface AppData {
  members: Member[];
  records: Record[];
  schedules: Schedule[];
}
```

### Context API를 통한 상태 관리

```typescript
// contexts/AppContext.tsx
interface AppContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  addMember: (name: string) => Promise<void>;
  addRecord: (record: NewRecord) => Promise<void>;
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => Promise<void>;
  updateMember: (id: number, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);
```

## Error Handling

### 1. 에러 바운더리
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  // React 에러 바운더리 구현
}
```

### 2. 네트워크 에러 처리
```typescript
// utils/errorHandler.ts
export function handleStorageError(error: any): string {
  switch (error.code || error.name) {
    case 'NoSuchKey':
      return '파일을 찾을 수 없습니다.';
    case 'AccessDenied':
      return 'S3 접근 권한이 없습니다.';
    case 'NetworkError':
      return '네트워크 연결을 확인해주세요.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}
```

### 3. 로딩 및 에러 상태 UI
```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}>🏃‍♂️</div>
      <div>{message || '데이터 로딩 중...'}</div>
    </div>
  );
}

// components/ErrorMessage.tsx
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.error}>
      <p>{error}</p>
      {onRetry && <button onClick={onRetry}>다시 시도</button>}
    </div>
  );
}
```

## Testing Strategy

### 1. 단위 테스트
- **도구**: Jest + React Testing Library
- **대상**: 개별 컴포넌트, 유틸리티 함수, 커스텀 훅
- **예시**:
```typescript
// __tests__/components/RecordForm.test.tsx
describe('RecordForm', () => {
  it('should submit valid record data', async () => {
    // 테스트 구현
  });
});
```

### 2. 통합 테스트
- **대상**: AWS Amplify 연동, 데이터 플로우
- **예시**:
```typescript
// __tests__/integration/storage.test.ts
describe('Storage Integration', () => {
  it('should save and load data from S3', async () => {
    // 통합 테스트 구현
  });
});
```

### 3. E2E 테스트
- **도구**: Playwright 또는 Cypress
- **시나리오**: 
  - 멤버 추가 → 기록 입력 → 통계 확인
  - 스케줄 추가 → 달력에서 확인
  - 관리자 페이지에서 데이터 관리

## AWS Amplify 통합

### 1. Amplify 설정 마이그레이션
```typescript
// lib/amplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json';

Amplify.configure(amplifyConfig);
```

### 2. Storage Manager 리팩토링
```typescript
// lib/storage.ts
export class StorageManager {
  private static instance: StorageManager;
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async loadAllData(): Promise<AppData> {
    // 기존 로직을 TypeScript로 변환
  }

  async saveAllData(data: AppData): Promise<void> {
    // 기존 로직을 TypeScript로 변환
  }
}
```

### 3. 커스텀 훅으로 데이터 관리
```typescript
// hooks/useStorage.ts
export function useStorage() {
  const [data, setData] = useState<AppData>({ members: [], records: [], schedules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const storageManager = StorageManager.getInstance();
      const loadedData = await storageManager.loadAllData();
      setData(loadedData);
      setError(null);
    } catch (err) {
      setError(handleStorageError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback(async (newData: AppData) => {
    try {
      const storageManager = StorageManager.getInstance();
      await storageManager.saveAllData(newData);
      setData(newData);
    } catch (err) {
      setError(handleStorageError(err));
      throw err;
    }
  }, []);

  return { data, loading, error, loadData, saveData };
}
```

## Styling Strategy

### 1. CSS Modules 구조
```
styles/
├── globals.css              # 전역 스타일 (기존 style.css 기반)
├── components/
│   ├── Header.module.css
│   ├── Calendar.module.css
│   ├── RecordForm.module.css
│   └── ...
└── pages/
    ├── Home.module.css
    └── Admin.module.css
```

### 2. 기존 스타일 마이그레이션 전략
- 기존 `style.css`를 `globals.css`로 이동
- 컴포넌트별 스타일을 CSS Modules로 분리
- 클래스명 충돌 방지를 위한 모듈화
- 반응형 디자인 유지

### 3. 테마 시스템 (선택사항)
```typescript
// styles/theme.ts
export const theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#48bb78',
    error: '#f56565',
    warning: '#feca57',
  },
  breakpoints: {
    mobile: '600px',
    tablet: '768px',
    desktop: '1024px',
  },
};
```

## Performance Optimization

### 1. Next.js 최적화 기능 활용
- **Image Optimization**: `next/image` 컴포넌트 사용
- **Code Splitting**: 자동 코드 분할
- **Static Generation**: 가능한 부분은 SSG 적용

### 2. 데이터 로딩 최적화
```typescript
// 지연 로딩과 캐싱
export function useDataWithCache() {
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  
  const loadWithCache = useCallback(async (key: string, loader: () => Promise<any>) => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const data = await loader();
    setCache(prev => new Map(prev).set(key, data));
    return data;
  }, [cache]);

  return { loadWithCache };
}
```

### 3. 메모이제이션
```typescript
// 컴포넌트 메모이제이션
export const MemberCard = memo(({ member }: { member: Member }) => {
  return (
    <div className={styles.memberCard}>
      {/* 멤버 카드 내용 */}
    </div>
  );
});

// 계산 결과 메모이제이션
export function useTeamStats(members: Member[]) {
  return useMemo(() => {
    const totalDistance = members.reduce((sum, member) => sum + member.totalDistance, 0);
    const totalRecords = members.reduce((sum, member) => sum + member.recordCount, 0);
    return { totalDistance, totalRecords };
  }, [members]);
}
```

## Deployment Strategy

### 1. Vercel 배포 설정
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 정적 사이트 생성
  trailingSlash: true,
  images: {
    unoptimized: true, // 정적 배포를 위해
  },
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_AWS_BUCKET: process.env.NEXT_PUBLIC_AWS_BUCKET,
  },
};

module.exports = nextConfig;
```

### 2. 환경 변수 관리
```bash
# .env.local
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_AWS_BUCKET=agrace-run-data
```

### 3. 빌드 및 배포 스크립트
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export",
    "deploy": "npm run export && vercel --prod"
  }
}
```

## Migration Strategy

### 1. 점진적 마이그레이션 접근법
1. **Phase 1**: Next.js 프로젝트 설정 및 기본 구조 생성
2. **Phase 2**: 핵심 컴포넌트 마이그레이션 (Header, Layout)
3. **Phase 3**: 데이터 관리 로직 마이그레이션 (Storage, Context)
4. **Phase 4**: 페이지별 기능 마이그레이션 (메인 → 관리자)
5. **Phase 5**: 스타일링 및 최적화
6. **Phase 6**: 테스트 및 배포

### 2. 데이터 호환성 보장
- 기존 S3 데이터 구조 유지
- 기존 `amplify_outputs.json` 설정 재사용
- 점진적 타입 추가 (any → 구체적 타입)

### 3. 롤백 계획
- 기존 바닐라 JS 버전 백업 유지
- 단계별 배포로 문제 발생 시 이전 단계로 복원
- 데이터 마이그레이션 없이 기존 데이터 구조 유지