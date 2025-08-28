'use client';

import { useState } from 'react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Calendar } from '../components/Calendar';
import { TeamGoal } from '../components/TeamGoal';
import { RecordForm } from '../components/RecordForm';
import { Stats } from '../components/Stats';
import { RecentRecords } from '../components/RecentRecords';
import { useApp } from '../contexts/AppContext';

export default function HomePage() {
  const { data, loading, error, refreshData, addRecord } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  if (loading) {
    return <LoadingSpinner message="러닝크루 데이터 로딩 중..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refreshData} />;
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRecordSubmit = async (record: any) => {
    await addRecord(record);
  };

  return (
    <>
      <Header 
        title="큰은혜교회 러닝크루" 
        subtitle="함께 달리며 건강한 신앙생활을 만들어가요!" 
      />
      
      {/* 스케줄 달력 섹션 */}
      <div className="member-section">
        <h2>📅 러닝 스케줄</h2>
        <Calendar 
          schedules={data.schedules}
          onDateClick={handleDateClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* 팀 목표 현황 섹션 */}
      <div className="team-goal-section">
        <h2>🎯 팀 목표 현황</h2>
        <TeamGoal 
          members={data.members}
          records={data.records}
        />
      </div>

      {/* 러닝 기록 추가 섹션 */}
      <div className="record-section">
        <h2>🏃‍♂️ 러닝 기록 추가</h2>
        <RecordForm 
          members={data.members}
          onSubmit={handleRecordSubmit}
          loading={loading}
        />
      </div>

      {/* 개인 현황 섹션 */}
      <div className="stats-section">
        <h2>📊 개인 현황</h2>
        <Stats 
          members={data.members}
          records={data.records}
        />
      </div>

      {/* 최근 기록 섹션 */}
      <div className="records-section">
        <h2>📝 최근 기록</h2>
        <RecentRecords 
          members={data.members}
          records={data.records}
          maxRecords={10}
        />
      </div>

      <div className="admin-footer">
        <button 
          className="admin-link"
          onClick={() => window.location.href = '/admin'}
        >
          관리자 페이지
        </button>
      </div>
    </>
  );
}