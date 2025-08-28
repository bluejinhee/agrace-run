/**
 * Utility functions for Next.js migration
 * Requirements: 2.2, 2.4
 */

import type { Member, Record, Schedule, MemberStats, TeamStats } from '../types';
import { VALIDATION, DATE_FORMATS } from './constants';

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('ko-KR');
  }
  return date.toISOString().split('T')[0];
}

/**
 * 거리를 km 단위로 포맷 (소수점 1자리)
 */
export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)}km`;
}

/**
 * 페이스를 분:초 형식으로 포맷
 */
export function formatPace(pace?: string): string {
  return pace || 'N/A';
}

/**
 * 시간 포맷팅
 */
export function formatTime(timeString: string): string {
  return timeString || 'N/A';
}

/**
 * 진행률 계산
 */
export function calculateProgress(current: number, target: number): number {
  return Math.min((current / target) * 100, 100);
}

/**
 * 멤버 통계 계산
 */
export function calculateMemberStats(member: Member, records: Record[]): MemberStats {
  const memberRecords = records.filter(record => record.memberId === member.id);
  
  // 최근 7일간의 기록
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyRecords = memberRecords.filter(record => 
    new Date(record.date) >= weekAgo
  );
  
  // 최근 30일간의 기록
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthlyRecords = memberRecords.filter(record => 
    new Date(record.date) >= monthAgo
  );
  
  // 평균 페이스 계산 (페이스가 있는 기록만)
  const recordsWithPace = memberRecords.filter(record => record.pace);
  const averagePace = recordsWithPace.length > 0 
    ? calculateAveragePace(recordsWithPace.map(r => r.pace!))
    : undefined;
  
  // 마지막 러닝 날짜
  const lastRunDate = memberRecords.length > 0 
    ? memberRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : undefined;
  
  const totalDistance = memberRecords.reduce((sum, record) => sum + record.distance, 0);
  const recordCount = memberRecords.length;

  return {
    member,
    rank: 0, // 이후에 전체 멤버 순위 계산 시 설정
    averagePace,
    lastRunDate,
    weeklyDistance: weeklyRecords.reduce((sum, record) => sum + record.distance, 0),
    monthlyDistance: monthlyRecords.reduce((sum, record) => sum + record.distance, 0),
    averageDistance: recordCount > 0 ? totalDistance / recordCount : 0,
    totalDistance,
    recordCount
  };
}

/**
 * 팀 통계 계산
 */
export function calculateTeamStats(members: Member[], records: Record[]): TeamStats {
  const totalDistance = records.reduce((sum, record) => sum + record.distance, 0);
  const totalRecords = records.length;
  const averageDistance = totalRecords > 0 ? totalDistance / totalRecords : 0;
  
  // 활성 멤버 수 (기록이 있는 멤버)
  const membersWithRecords = new Set(records.map(record => record.memberId));
  const activeMembers = membersWithRecords.size;
  
  // 주간 목표 진행률 (최근 7일)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyRecords = records.filter(record => new Date(record.date) >= weekAgo);
  const weeklyDistance = weeklyRecords.reduce((sum, record) => sum + record.distance, 0);
  const weeklyGoalProgress = calculateProgress(weeklyDistance, 125); // 주간 목표 125km
  
  // 월간 목표 진행률 (최근 30일)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthlyRecords = records.filter(record => new Date(record.date) >= monthAgo);
  const monthlyDistance = monthlyRecords.reduce((sum, record) => sum + record.distance, 0);
  const monthlyGoalProgress = calculateProgress(monthlyDistance, 500); // 월간 목표 500km
  
  return {
    totalDistance,
    totalRecords,
    averageDistance,
    activeMembers,
    weeklyGoalProgress,
    monthlyGoalProgress,
  };
}

/**
 * 평균 페이스 계산
 */
export function calculateAveragePace(paces: string[]): string {
  if (paces.length === 0) return '';
  
  const totalSeconds = paces.reduce((sum, pace) => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return sum + (minutes * 60) + seconds;
  }, 0);
  
  const averageSeconds = Math.round(totalSeconds / paces.length);
  const minutes = Math.floor(averageSeconds / 60);
  const seconds = averageSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 멤버 순위 계산
 */
export function calculateMemberRanks(memberStats: MemberStats[]): MemberStats[] {
  return memberStats
    .sort((a, b) => b.totalDistance - a.totalDistance)
    .map((stats, index) => ({
      ...stats,
      rank: index + 1,
    }));
}

/**
 * 데이터 검증 함수들
 */
export function validateMemberName(name: string): boolean {
  return name.length >= VALIDATION.MIN_NAME_LENGTH && 
         name.length <= VALIDATION.MAX_NAME_LENGTH;
}

export function validateDistance(distance: number): boolean {
  return distance >= VALIDATION.MIN_DISTANCE && 
         distance <= VALIDATION.MAX_DISTANCE;
}

export function validatePace(pace: string): boolean {
  return VALIDATION.PACE_PATTERN.test(pace);
}

export function validateDate(date: string): boolean {
  return VALIDATION.DATE_PATTERN.test(date) && !isNaN(Date.parse(date));
}

export function validateTime(time: string): boolean {
  return VALIDATION.TIME_PATTERN.test(time);
}

/**
 * ID 생성 함수
 */
export function generateId(existingIds: number[]): number {
  if (existingIds.length === 0) return 1;
  return Math.max(...existingIds) + 1;
}

/**
 * 날짜 유틸리티
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

export function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  
  return date >= weekAgo && date <= today;
}

export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 로컬 스토리지 유틸리티 (브라우저 환경에서만)
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
}

/**
 * 클래스명 결합 유틸리티
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}