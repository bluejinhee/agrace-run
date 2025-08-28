'use client';

import React from 'react';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorMessage({ error, onRetry, showRetry = true }: ErrorMessageProps) {
  return (
    <div className={styles.error}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h3 className={styles.title}>오류가 발생했습니다</h3>
        <p className={styles.message}>{error}</p>
        {showRetry && onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}