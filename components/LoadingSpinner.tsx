'use client';

import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ message = '데이터 로딩 중...', size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={styles.loading}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        🏃‍♂️
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );
}