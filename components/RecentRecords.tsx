'use client';

import React, { useMemo, useState } from 'react';
import { Member, Record } from '../types';
import styles from './RecentRecords.module.css';

interface RecentRecordsProps {
  members: Member[];
  records: Record[];
  maxRecords?: number;
}

interface RecordWithMember extends Record {
  memberName: string;
}

export function RecentRecords({ members, records, maxRecords = 10 }: RecentRecordsProps) {
  const [showAll, setShowAll] = useState(false);

  const recentRecords = useMemo(() => {
    // 기록에 멤버 이름 추가
    const recordsWithMembers: RecordWithMember[] = records
      .map(record => {
        const member = members.find(m => m.id === record.memberId);
        return {
          ...record,
          memberName: member?.name || '알 수 없음'
        };
      })
      .sort((a, b) => {
        // 날짜로 정렬 (최신순)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

    return showAll ? recordsWithMembers : recordsWithMembers.slice(0, maxRecords);
  }, [members, records, maxRecords, showAll]);

  const formatDate = (record: Record) => {
    const recordDate = new Date(record.date);
    const now = new Date();
    const diffTime = now.getTime() - recordDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;

    return recordDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (record: Record) => {
    return record.time || '';
  };

  const getDistanceColor = (distance: number) => {
    if (distance >= 10) return styles.longDistance;
    if (distance >= 5) return styles.mediumDistance;
    return styles.shortDistance;
  };

  const getPaceColor = (pace: string) => {
    const [minutes] = pace.split(':').map(Number);
    if (minutes <= 4) return styles.fastPace;
    if (minutes <= 6) return styles.mediumPace;
    return styles.slowPace;
  };

  if (records.length === 0) {
    return (
      <div className={styles.recentRecords}>
        <div className={styles.header}>
          <h3>📝 최근 기록</h3>
        </div>
        <div className={styles.noRecords}>
          <div className={styles.noRecordsIcon}>🏃‍♂️</div>
          <div className={styles.noRecordsText}>
            아직 등록된 기록이 없습니다.
          </div>
          <div className={styles.noRecordsSubText}>
            첫 번째 러닝 기록을 추가해보세요!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recentRecords}>
      <div className={styles.header}>
        <h3>📝 최근 기록</h3>
        <div className={styles.recordCount}>
          총 {records.length}개 기록
        </div>
      </div>

      <div className={styles.recordsList}>
        {recentRecords.map(record => (
          <div key={record.id} className={styles.recordItem}>
            <div className={styles.recordMain}>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{record.memberName}</span>
                <div className={styles.recordMeta}>
                  <span className={styles.recordDate}>{formatDate(record)}</span>
                  <span className={styles.recordTime}>{formatTime(record)}</span>
                </div>
              </div>

              <div className={styles.recordStats}>
                <div className={`${styles.distance} ${getDistanceColor(record.distance)}`}>
                  {record.distance.toFixed(1)}km
                </div>

                {record.pace && (
                  <div className={`${styles.pace} ${getPaceColor(record.pace)}`}>
                    {record.pace}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.recordDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>거리</span>
                <span className={styles.detailValue}>{record.distance.toFixed(1)}km</span>
              </div>

              {record.pace && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>페이스</span>
                  <span className={styles.detailValue}>{record.pace}/km</span>
                </div>
              )}

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>날짜</span>
                <span className={styles.detailValue}>
                  {new Date(record.date).toLocaleDateString('ko-KR')}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>등록시간</span>
                <span className={styles.detailValue}>
                  {new Date(record.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length > maxRecords && (
        <div className={styles.showMoreContainer}>
          <button
            className={styles.showMoreButton}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <span>접기</span>
                <span className={styles.buttonIcon}>▲</span>
              </>
            ) : (
              <>
                <span>더 보기 ({records.length - maxRecords}개 더)</span>
                <span className={styles.buttonIcon}>▼</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>이번 주 기록</span>
          <span className={styles.summaryValue}>
            {records.filter(record => {
              const recordDate = new Date(record.date);
              const now = new Date();
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              return recordDate >= startOfWeek;
            }).length}개
          </span>
        </div>

        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>이번 달 기록</span>
          <span className={styles.summaryValue}>
            {records.filter(record => {
              const recordDate = new Date(record.date);
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              return recordDate >= startOfMonth;
            }).length}개
          </span>
        </div>
      </div>
    </div>
  );
}