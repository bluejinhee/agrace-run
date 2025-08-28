'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useApp } from '../../contexts/AppContext';
import { MemberManagement } from '../../components/admin/MemberManagement';
import { ScheduleManagement } from '../../components/admin/ScheduleManagement';
import { RecordManagement } from '../../components/admin/RecordManagement';
import { DataManagement } from '../../components/admin/DataManagement';

export default function AdminPage() {
  const { data, loading, error, refreshData } = useApp();

  if (loading) {
    return <LoadingSpinner message="관리자 데이터 로딩 중..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refreshData} />;
  }

  return (
    <>
      <Header 
        title="⚙️ 러닝크루 관리자 페이지" 
        subtitle="멤버 관리 및 데이터 관리" 
      />
      
      <div className="nav-buttons">
        <button 
          onClick={() => window.location.href = '/'}
          className="nav-button"
        >
          🏃‍♂️ 메인 페이지로
        </button>
      </div>

      {/* 멤버 관리 섹션 */}
      <MemberManagement />

      {/* 스케줄 관리 섹션 */}
      <ScheduleManagement />

      {/* 기록 관리 섹션 */}
      <RecordManagement />

      {/* 데이터 관리 섹션 */}
      <DataManagement />
    </>
  );
}