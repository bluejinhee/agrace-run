/**
 * Error handling utilities for AWS Amplify and application errors
 * Requirements: 2.4, 4.2
 */

import type { AppError } from '../types';

/**
 * AWS Storage 에러를 사용자 친화적인 메시지로 변환합니다
 */
export function handleStorageError(error: any): string {
  switch (error.code || error.name) {
    case 'NoSuchKey':
      return '파일을 찾을 수 없습니다.';
    case 'AccessDenied':
      return 'S3 접근 권한이 없습니다. 관리자에게 문의하세요.';
    case 'NetworkError':
    case 'NetworkingError':
      return '네트워크 연결을 확인해주세요.';
    case 'InvalidAccessKeyId':
    case 'SignatureDoesNotMatch':
      return 'AWS 인증에 실패했습니다. 설정을 확인해주세요.';
    case 'ServiceUnavailable':
      return 'AWS 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
    case 'ThrottlingException':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    default:
      return error.message || '알 수 없는 오류가 발생했습니다.';
  }
}

/**
 * 에러 객체를 AppError 형태로 변환합니다
 */
export function createAppError(
  error: any, 
  operation?: 'load' | 'save' | 'delete' | 'update',
  fileName?: string
): AppError {
  return {
    message: handleStorageError(error),
    code: error.code || error.name,
    operation,
    fileName,
    originalError: error
  };
}

/**
 * 에러가 재시도 가능한지 확인합니다
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'NetworkError',
    'NetworkingError',
    'ServiceUnavailable',
    'ThrottlingException',
    'InternalError',
    'RequestTimeout'
  ];
  
  return retryableCodes.includes(error.code || error.name);
}

/**
 * 에러 로깅을 위한 유틸리티
 */
export function logError(error: AppError | Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context ? `${context}: ` : ''}${error.message}`;
  
  console.error(logMessage, error);
  
  // 프로덕션 환경에서는 외부 로깅 서비스로 전송할 수 있음
  if (process.env.NODE_ENV === 'production') {
    // TODO: 외부 로깅 서비스 연동 (예: Sentry, CloudWatch)
  }
}

/**
 * 개발 환경에서 에러 디버깅을 위한 유틸리티
 */
export function debugError(error: any, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🐛 Debug Error${context ? ` - ${context}` : ''}`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }
}