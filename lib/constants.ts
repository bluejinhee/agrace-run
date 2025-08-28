/**
 * Application constants for Next.js migration
 * Requirements: 2.2, 4.1
 */

// 애플리케이션 설정
export const APP_CONFIG = {
  name: '큰은혜교회 런닝크루',
  description: '큰은혜교회 런닝크루 애플리케이션',
  version: '2.0.0',
} as const;

// 팀 목표 설정
export const TEAM_GOALS = {
  MONTHLY: 500, // 월간 목표 (km)
  WEEKLY: 125,  // 주간 목표 (km)
  DAILY: 18,    // 일일 목표 (km)
} as const;

// 마일스톤 설정
export const MILESTONES = [
  { distance: 100, name: '첫 100km 달성!' },
  { distance: 300, name: '300km 돌파!' },
  { distance: 500, name: '500km 완주!' },
  { distance: 1000, name: '1000km 마라톤!' },
] as const;

// 스토리지 파일명
export const STORAGE_KEYS = {
  MEMBERS: 'members.json',
  RECORDS: 'records.json',
  SCHEDULES: 'schedules.json',
} as const;

// AWS 설정 상수
export const AWS_CONFIG = {
  REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
  BUCKET_NAME: process.env.NEXT_PUBLIC_AWS_BUCKET || 'agrace-run-data',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
} as const;

// UI 설정 상수
export const UI_CONFIG = {
  RECENT_RECORDS_LIMIT: 10,
  PAGINATION_SIZE: 20,
  DEBOUNCE_DELAY: 300, // ms
  TOAST_DURATION: 3000, // ms
  LOADING_SPINNER_DELAY: 200, // ms
} as const;

// 날짜 형식 상수
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  INPUT: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  FULL: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
} as const;

// 검증 규칙 상수
export const VALIDATION = {
  MIN_DISTANCE: 0.1, // km
  MAX_DISTANCE: 100, // km
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
  PACE_PATTERN: /^\d{1,2}:\d{2}$/, // MM:SS 형식
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식
  TIME_PATTERN: /^\d{2}:\d{2}$/, // HH:MM 형식
} as const;

// 에러 메시지 상수
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  STORAGE_ERROR: '데이터 저장에 실패했습니다.',
  LOAD_ERROR: '데이터 로드에 실패했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  ACCESS_DENIED: 'S3 접근 권한이 없습니다.',
  FILE_NOT_FOUND: '파일을 찾을 수 없습니다.',
  INVALID_DATA: '잘못된 데이터 형식입니다.',
} as const;

// 성공 메시지 상수
export const SUCCESS_MESSAGES = {
  MEMBER_ADDED: '멤버가 추가되었습니다.',
  RECORD_ADDED: '기록이 추가되었습니다.',
  SCHEDULE_ADDED: '스케줄이 추가되었습니다.',
  DATA_SAVED: '데이터가 저장되었습니다.',
  DATA_LOADED: '데이터가 로드되었습니다.',
  CONNECTION_SUCCESS: 'S3 연결이 성공했습니다.',
} as const;

// 로딩 상태 메시지
export const LOADING_MESSAGES = {
  LOADING_DATA: '데이터 로딩 중...',
  SAVING_DATA: '데이터 저장 중...',
  CONNECTING: 'S3 연결 중...',
  PROCESSING: '처리 중...',
} as const;