'use client';

import React from 'react';
import { useApp } from '../contexts/AppContext';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle: string;
  showConnectionStatus?: boolean;
}

export function Header({ title, subtitle, showConnectionStatus = true }: HeaderProps) {
  const { connectionStatus } = useApp();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {showConnectionStatus && (
          <div className={`${styles.connectionStatus} ${styles[connectionStatus]}`}>
            {connectionStatus === 'online' ? '🟢 온라인' : '🔴 오프라인'}
          </div>
        )}
      </div>
    </header>
  );
}