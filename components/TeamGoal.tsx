'use client';

import React, { useMemo } from 'react';
import { Member, Record } from '../types';
import styles from './TeamGoal.module.css';

interface TeamGoalProps {
  members: Member[];
  records: Record[];
}

interface GoalConfig {
  id: string;
  title: string;
  target: number;
  unit: string;
  description: string;
}

const TEAM_GOALS: GoalConfig[] = [
  {
    id: 'weekly',
    title: '주간 목표',
    target: 100,
    unit: 'km',
    description: '이번 주 팀 전체 목표'
  },
  {
    id: 'monthly',
    title: '월간 목표',
    target: 500,
    unit: 'km',
    description: '이번 달 팀 전체 목표'
  },
  {
    id: 'total',
    title: '누적 목표',
    target: 2000,
    unit: 'km',
    description: '팀 전체 누적 목표'
  }
];

export function TeamGoal({ members, records }: TeamGoalProps) {
  const teamStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const weeklyRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfWeek;
    });
    
    const monthlyRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfMonth;
    });
    
    const totalDistance = records.reduce((sum, record) => sum + record.distance, 0);
    const weeklyDistance = weeklyRecords.reduce((sum, record) => sum + record.distance, 0);
    const monthlyDistance = monthlyRecords.reduce((sum, record) => sum + record.distance, 0);
    
    return {
      total: totalDistance,
      weekly: weeklyDistance,
      monthly: monthlyDistance,
      totalRecords: records.length,
      activeMembers: members.filter(member => 
        records.some(record => record.memberId === member.id)
      ).length
    };
  }, [members, records]);

  const goalProgress = useMemo(() => {
    return TEAM_GOALS.map(goal => {
      let current = 0;
      
      switch (goal.id) {
        case 'weekly':
          current = teamStats.weekly;
          break;
        case 'monthly':
          current = teamStats.monthly;
          break;
        case 'total':
          current = teamStats.total;
          break;
      }
      
      const percentage = Math.min((current / goal.target) * 100, 100);
      const isAchieved = current >= goal.target;
      
      return {
        ...goal,
        current,
        percentage,
        isAchieved,
        remaining: Math.max(goal.target - current, 0)
      };
    });
  }, [teamStats]);

  const nextMilestone = useMemo(() => {
    const milestones = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000];
    const currentTotal = teamStats.total;
    
    const next = milestones.find(milestone => milestone > currentTotal);
    return next ? {
      target: next,
      remaining: next - currentTotal,
      progress: (currentTotal / next) * 100
    } : null;
  }, [teamStats.total]);

  return (
    <div className={styles.teamGoal}>
      <div className={styles.teamTotal}>
        <h3>🏃‍♂️ 팀 전체 현황</h3>
        <div className={styles.totalStats}>
          <div className={styles.mainStat}>
            <div className={styles.totalDistance}>
              {teamStats.total.toFixed(1)}
              <span className={styles.unit}>km</span>
            </div>
            <div className={styles.totalLabel}>총 누적 거리</div>
          </div>
          
          <div className={styles.subStats}>
            <div className={styles.subStat}>
              <div className={styles.subStatValue}>{teamStats.totalRecords}</div>
              <div className={styles.subStatLabel}>총 기록</div>
            </div>
            <div className={styles.subStat}>
              <div className={styles.subStatValue}>{teamStats.activeMembers}</div>
              <div className={styles.subStatLabel}>활동 멤버</div>
            </div>
            <div className={styles.subStat}>
              <div className={styles.subStatValue}>
                {teamStats.totalRecords > 0 ? (teamStats.total / teamStats.totalRecords).toFixed(1) : '0.0'}
              </div>
              <div className={styles.subStatLabel}>평균 거리</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.goalProgress}>
        {goalProgress.map(goal => (
          <div 
            key={goal.id} 
            className={`${styles.goalCard} ${goal.isAchieved ? styles.achieved : ''}`}
          >
            <div className={styles.goalHeader}>
              <h4 className={styles.goalTitle}>{goal.title}</h4>
              <div className={styles.goalDescription}>{goal.description}</div>
            </div>
            
            <div className={styles.goalStats}>
              <div className={styles.goalCurrent}>
                {goal.current.toFixed(1)}
                <span className={styles.goalUnit}>/{goal.target}{goal.unit}</span>
              </div>
              
              <div className={styles.goalPercentage}>
                {goal.percentage.toFixed(0)}%
              </div>
            </div>
            
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${goal.percentage}%` }}
              ></div>
            </div>
            
            {goal.isAchieved ? (
              <div className={styles.achievedBadge}>
                🎉 목표 달성!
              </div>
            ) : (
              <div className={styles.remainingDistance}>
                {goal.remaining.toFixed(1)}{goal.unit} 남음
              </div>
            )}
          </div>
        ))}
      </div>

      {nextMilestone && (
        <div className={styles.nextMilestone}>
          <h4>🎯 다음 마일스톤</h4>
          <div className={styles.milestoneContent}>
            <div className={styles.milestoneTarget}>
              {nextMilestone.target}km 달성까지
            </div>
            <div className={styles.milestoneRemaining}>
              <strong>{nextMilestone.remaining.toFixed(1)}km</strong> 남음
            </div>
            <div className={styles.milestoneProgress}>
              <div className={styles.milestoneProgressBar}>
                <div 
                  className={styles.milestoneProgressFill}
                  style={{ width: `${nextMilestone.progress}%` }}
                ></div>
              </div>
              <div className={styles.milestonePercentage}>
                {nextMilestone.progress.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {goalProgress.some(goal => goal.isAchieved) && (
        <div className={styles.celebration}>
          <div className={styles.celebrationEmoji}>🎊</div>
          <div className={styles.celebrationText}>
            축하합니다! 목표를 달성했습니다!
          </div>
        </div>
      )}
    </div>
  );
}