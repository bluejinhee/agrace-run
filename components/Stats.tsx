'use client';

import React, { useMemo, useState } from 'react';
import { Member, Record, MemberStats } from '../types';
import styles from './Stats.module.css';

interface StatsProps {
  members: Member[];
  records: Record[];
}

type SortField = 'rank' | 'name' | 'totalDistance' | 'recordCount' | 'averageDistance' | 'lastRunDate';
type SortDirection = 'asc' | 'desc';

export function Stats({ members, records }: StatsProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const memberStats = useMemo(() => {
    const stats: MemberStats[] = members.map(member => {
      const memberRecords = records.filter(record => record.memberId === member.id);
      
      // 평균 페이스 계산
      const recordsWithPace = memberRecords.filter(record => record.pace);
      let averagePace: string | undefined;
      
      if (recordsWithPace.length > 0) {
        const totalSeconds = recordsWithPace.reduce((sum, record) => {
          const [minutes, seconds] = record.pace!.split(':').map(Number);
          return sum + (minutes * 60 + seconds);
        }, 0);
        
        const avgSeconds = Math.round(totalSeconds / recordsWithPace.length);
        const avgMinutes = Math.floor(avgSeconds / 60);
        const remainingSeconds = avgSeconds % 60;
        averagePace = `${avgMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      
      // 마지막 러닝 날짜
      const lastRunDate = memberRecords.length > 0 
        ? memberRecords
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            .date
        : undefined;
      
      // 주간/월간 거리 계산
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const weeklyDistance = memberRecords
        .filter(record => new Date(record.date) >= startOfWeek)
        .reduce((sum, record) => sum + record.distance, 0);
      
      const monthlyDistance = memberRecords
        .filter(record => new Date(record.date) >= startOfMonth)
        .reduce((sum, record) => sum + record.distance, 0);
      
      // 총 거리와 기록 수 계산
      const totalDistance = memberRecords.reduce((sum, record) => sum + record.distance, 0);
      const recordCount = memberRecords.length;
      
      return {
        member,
        rank: 0, // 나중에 설정
        averagePace,
        lastRunDate,
        weeklyDistance,
        monthlyDistance,
        averageDistance: recordCount > 0 ? totalDistance / recordCount : 0,
        totalDistance,
        recordCount
      };
    });
    
    // 총 거리 기준으로 순위 매기기
    const sortedByDistance = [...stats].sort((a, b) => b.totalDistance - a.totalDistance);
    sortedByDistance.forEach((stat, index) => {
      stat.rank = index + 1;
    });
    
    return stats;
  }, [members, records]);

  const sortedStats = useMemo(() => {
    const sorted = [...memberStats].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'name':
          aValue = a.member.name;
          bValue = b.member.name;
          break;
        case 'totalDistance':
          aValue = a.totalDistance;
          bValue = b.totalDistance;
          break;
        case 'recordCount':
          aValue = a.recordCount;
          bValue = b.recordCount;
          break;
        case 'averageDistance':
          aValue = a.averageDistance;
          bValue = b.averageDistance;
          break;
        case 'lastRunDate':
          aValue = a.lastRunDate ? new Date(a.lastRunDate).getTime() : 0;
          bValue = b.lastRunDate ? new Date(b.lastRunDate).getTime() : 0;
          break;
        default:
          aValue = a.rank;
          bValue = b.rank;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  }, [memberStats, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return styles.gold;
    if (rank === 2) return styles.silver;
    if (rank === 3) return styles.bronze;
    return '';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  if (members.length === 0) {
    return (
      <div className={styles.stats}>
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📊</div>
          <div className={styles.noDataText}>
            아직 등록된 멤버가 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stats}>
      <div className={styles.statsHeader}>
        <h3>📊 개인 현황</h3>
        <div className={styles.sortInfo}>
          정렬: {sortField === 'rank' ? '순위' : 
                sortField === 'name' ? '이름' :
                sortField === 'totalDistance' ? '총 거리' :
                sortField === 'recordCount' ? '기록 수' :
                sortField === 'averageDistance' ? '평균 거리' :
                '마지막 러닝'} 
          {sortDirection === 'asc' ? ' ↑' : ' ↓'}
        </div>
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('rank')}
              >
                순위 {getSortIcon('rank')}
              </th>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('name')}
              >
                이름 {getSortIcon('name')}
              </th>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('totalDistance')}
              >
                총 거리 {getSortIcon('totalDistance')}
              </th>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('recordCount')}
              >
                기록 수 {getSortIcon('recordCount')}
              </th>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('averageDistance')}
              >
                평균 거리 {getSortIcon('averageDistance')}
              </th>
              <th className={styles.header}>평균 페이스</th>
              <th 
                className={styles.sortableHeader}
                onClick={() => handleSort('lastRunDate')}
              >
                마지막 러닝 {getSortIcon('lastRunDate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map(stat => (
              <tr key={stat.member.id} className={styles.row}>
                <td className={styles.rankCell}>
                  <span className={`${styles.rankBadge} ${getRankBadgeClass(stat.rank)}`}>
                    {getRankEmoji(stat.rank)}
                  </span>
                </td>
                <td className={styles.nameCell}>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{stat.member.name}</span>
                    <div className={styles.memberSubInfo}>
                      <span>주간: {stat.weeklyDistance.toFixed(1)}km</span>
                      <span>월간: {stat.monthlyDistance.toFixed(1)}km</span>
                    </div>
                  </div>
                </td>
                <td className={styles.distanceCell}>
                  <span className={styles.totalDistance}>
                    {stat.totalDistance.toFixed(1)}km
                  </span>
                </td>
                <td className={styles.countCell}>
                  <span className={styles.recordCount}>
                    {stat.recordCount}회
                  </span>
                </td>
                <td className={styles.averageCell}>
                  <span className={styles.averageDistance}>
                    {stat.averageDistance.toFixed(1)}km
                  </span>
                </td>
                <td className={styles.paceCell}>
                  {stat.averagePace ? (
                    <span className={styles.pace}>{stat.averagePace}</span>
                  ) : (
                    <span className={styles.noPace}>-</span>
                  )}
                </td>
                <td className={styles.dateCell}>
                  {stat.lastRunDate ? (
                    <span className={styles.lastRun}>
                      {formatDate(stat.lastRunDate)}
                    </span>
                  ) : (
                    <span className={styles.noRun}>기록 없음</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className={styles.mobileCards}>
        {sortedStats.map(stat => (
          <div key={stat.member.id} className={styles.memberCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardRank}>
                <span className={`${styles.rankBadge} ${getRankBadgeClass(stat.rank)}`}>
                  {getRankEmoji(stat.rank)}
                </span>
              </div>
              <div className={styles.cardName}>
                <div className={styles.cardMemberName}>{stat.member.name}</div>
                <div className={styles.cardSubInfo}>
                  <span>주간: {stat.weeklyDistance.toFixed(1)}km</span>
                  <span>월간: {stat.monthlyDistance.toFixed(1)}km</span>
                </div>
              </div>
            </div>
            
            <div className={styles.cardStats}>
              <div className={styles.cardStatItem}>
                <div className={styles.cardStatValue}>{stat.totalDistance.toFixed(1)}km</div>
                <div className={styles.cardStatLabel}>총 거리</div>
              </div>
              <div className={styles.cardStatItem}>
                <div className={styles.cardStatValue}>{stat.recordCount}회</div>
                <div className={styles.cardStatLabel}>기록 수</div>
              </div>
              <div className={styles.cardStatItem}>
                <div className={styles.cardStatValue}>{stat.averageDistance.toFixed(1)}km</div>
                <div className={styles.cardStatLabel}>평균 거리</div>
              </div>
            </div>
            
            <div className={styles.cardFooter}>
              <div>
                {stat.averagePace ? (
                  <span className={styles.cardPace}>{stat.averagePace}</span>
                ) : (
                  <span className={styles.cardNoPace}>페이스 기록 없음</span>
                )}
              </div>
              <div>
                {stat.lastRunDate ? (
                  <span className={styles.cardLastRun}>
                    {formatDate(stat.lastRunDate)}
                  </span>
                ) : (
                  <span className={styles.cardNoRun}>기록 없음</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}