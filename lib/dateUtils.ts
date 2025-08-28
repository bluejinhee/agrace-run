/**
 * KST 기반 날짜 유틸리티 함수들
 */

/**
 * KST 기준으로 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getKSTDateString(date?: Date): string {
  const targetDate = date || new Date();
  
  // KST는 UTC+9
  const kstOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (kstOffset * 60000));
  
  return kstTime.toISOString().split('T')[0];
}

/**
 * KST 기준으로 현재 시간을 HH:MM 형식으로 반환
 */
export function getKSTTimeString(date?: Date): string {
  const targetDate = date || new Date();
  
  // KST는 UTC+9
  const kstOffset = 9 * 60;
  const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (kstOffset * 60000));
  
  return kstTime.toTimeString().slice(0, 5); // HH:MM 형식
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 KST 기준 Date 객체로 변환
 */
export function parseKSTDate(dateString: string): Date {
  // 날짜 문자열을 KST 기준으로 파싱
  const [year, month, day] = dateString.split('-').map(Number);
  
  // KST 기준으로 Date 객체 생성 (월은 0부터 시작하므로 -1)
  const kstDate = new Date(year, month - 1, day);
  
  return kstDate;
}

/**
 * Date 객체를 KST 기준 한국어 형식으로 포맷팅
 */
export function formatKSTDate(date: Date, options?: {
  includeWeekday?: boolean;
  includeYear?: boolean;
  format?: 'long' | 'short' | 'numeric';
}): string {
  const {
    includeWeekday = false,
    includeYear = true,
    format = 'long'
  } = options || {};

  // KST 기준으로 변환
  const kstOffset = 9 * 60;
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const kstDate = new Date(utc + (kstOffset * 60000));

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: includeYear ? 'numeric' : undefined,
    month: format,
    day: 'numeric'
  };

  if (includeWeekday) {
    formatOptions.weekday = 'long';
  }

  return kstDate.toLocaleDateString('ko-KR', formatOptions);
}

/**
 * 날짜 문자열을 KST 기준으로 비교
 */
export function compareKSTDates(dateA: string, dateB: string): number {
  const dateObjA = parseKSTDate(dateA);
  const dateObjB = parseKSTDate(dateB);
  
  return dateObjA.getTime() - dateObjB.getTime();
}

/**
 * 오늘 날짜인지 KST 기준으로 확인
 */
export function isToday(dateString: string): boolean {
  const today = getKSTDateString();
  return dateString === today;
}

/**
 * 현재 월인지 KST 기준으로 확인
 */
export function isCurrentMonth(dateString: string): boolean {
  const today = new Date();
  const targetDate = parseKSTDate(dateString);
  
  // KST 기준으로 변환
  const kstOffset = 9 * 60;
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const kstToday = new Date(utc + (kstOffset * 60000));
  
  return targetDate.getFullYear() === kstToday.getFullYear() && 
         targetDate.getMonth() === kstToday.getMonth();
}