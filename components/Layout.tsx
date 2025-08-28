'use client';

import React, { ReactNode } from 'react';
import { AppProvider } from '../contexts/AppContext';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <AppProvider>
      <div className={styles.layout}>
        <div className={styles.container}>
          {children}
        </div>
      </div>
    </AppProvider>
  );
}