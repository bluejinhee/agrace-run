/**
 * TypeScript type definitions for Next.js migration
 * Requirements: 2.2, 2.4
 */

// 멤버 인터페이스
export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

// 기록 인터페이스
export interface Record {
  id: string;
  memberId: string;
  distance: number;
  time: string;
  pace?: string;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// 스케줄 인터페이스
export interface Schedule {
  id: string;
  date: string;
  title: string;
  description?: string;
  location?: string;
  time?: string;
  participants?: string[];
  createdAt: string;
  updatedAt: string;
}

// 새 기록 인터페이스
export interface NewRecord {
  memberId: string;
  distance: number;
  time: string;
  pace?: string;
  notes?: string;
  date: string;
}

// 새 스케줄 인터페이스
export interface NewSchedule {
  date: string;
  title: string;
  description?: string;
  location?: string;
  time?: string;
  participants?: string[];
}

// 앱 데이터 인터페이스
export interface AppData {
  members: Member[];
  records: Record[];
  schedules: Schedule[];
}

// 로딩 상태 타입
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 에러 타입
export interface AppError {
  message: string;
  code?: string;
  operation?: 'load' | 'save' | 'delete' | 'update';
  fileName?: string;
  originalError?: any;
}

// 컨텍스트 타입
export interface AppContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  addMember: (name: string) => Promise<void>;
  addRecord: (record: NewRecord) => Promise<void>;
  addSchedule: (schedule: NewSchedule) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

// 통계 관련 타입
export interface MemberStats {
  member: Member;
  rank: number;
  averagePace?: string;
  lastRunDate?: string;
  weeklyDistance: number;
  monthlyDistance: number;
  averageDistance: number;
  totalDistance: number;
  recordCount: number;
}

export interface TeamStats {
  totalDistance: number;
  totalRecords: number;
  averageDistance: number;
  activeMembers: number;
  weeklyGoalProgress: number;
  monthlyGoalProgress: number;
}

// 달력 관련 타입
export interface CalendarDay {
  date: Date;
  hasSchedule: boolean;
  schedules: Schedule[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

// 컴포넌트 Props 타입들
export interface HeaderProps {
  title: string;
  subtitle?: string;
  showAdminButton?: boolean;
}

export interface CalendarProps {
  schedules: Schedule[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
}

export interface RecordFormProps {
  members: Member[];
  onSubmit: (record: NewRecord) => Promise<void>;
  loading?: boolean;
}

export interface MemberCardProps {
  member: Member;
  stats?: MemberStats;
  onEdit?: (member: Member) => void;
  onDelete?: (id: string) => void;
}

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ErrorMessageProps {
  error: string | AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// 유틸리티 타입들
export type SortDirection = 'asc' | 'desc';
export type SortField = 'name' | 'joinDate' | 'createdAt';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// AWS DynamoDB 관련 타입들
export interface DynamoDBConfig {
  version: string;
  data: {
    aws_region: string;
    url: string;
    buckets: Array<{
      name: string;
      bucket_name: string;
      aws_region: string;
      paths: { [key: string]: any };
    }>;
  };
  auth: {
    aws_region: string;
    allow_guest_access: boolean;
  };
}

// 환경 변수 타입
export interface EnvironmentVariables {
  NEXT_PUBLIC_AWS_REGION: string;
  NEXT_PUBLIC_AWS_BUCKET: string;
}