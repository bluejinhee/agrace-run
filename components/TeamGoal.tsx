'use client';

import React, { useMemo } from 'react';
import { Member, Record, Milestone } from '../types';
import styles from './TeamGoal.module.css';

interface TeamGoalProps {
  members: Member[];
  records: Record[];
  milestones: Milestone[];
}

export function TeamGoal({ members, records, milestones }: TeamGoalProps) {
  const teamStats = useMemo(() => {
    const totalDistance = records.reduce((sum, record) => sum + record.distance, 0);
    
    return {
      total: totalDistance,
      totalRecords: records.length,
      activeMembers: members.filter(member => 
        records.some(record => record.memberId === member.id)
      ).length
    };
  }, [members, records]);

  const nextMilestone = useMemo(() => {
    if (!milestones || milestones.length === 0) return null;
    
    const activeMilestones = milestones
      .filter(milestone => milestone.isActive)
      .sort((a, b) => a.targetKm - b.targetKm);
    
    const currentTotal = teamStats.total;
    const next = activeMilestones.find(milestone => milestone.targetKm > currentTotal);
    
    return next ? {
      ...next,
      remaining: next.targetKm - currentTotal,
      progress: (currentTotal / next.targetKm) * 100
    } : null;
  }, [teamStats.total, milestones]);

  const achievedMilestones = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    
    return milestones
      .filter(milestone => milestone.isActive && milestone.targetKm <= teamStats.total)
      .sort((a, b) => b.targetKm - a.targetKm);
  }, [teamStats.total, milestones]);

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

      {achievedMilestones.length > 0 && (
        <div className={styles.achievedMilestones}>
          <h4>🏆 달성한 마일스톤</h4>
          <div className={styles.milestoneList}>
            {achievedMilestones.slice(0, 3).map(milestone => (
              <div key={milestone.id} className={styles.achievedMilestone}>
                <div className={styles.milestoneTarget}>{milestone.targetKm}km</div>
                <div className={styles.milestoneReward}>{milestone.reward}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nextMilestone && (
        <div className={styles.nextMilestone}>
          <h4>🎯 다음 마일스톤</h4>
          <div className={styles.milestoneContent}>
            <div className={styles.milestoneTarget}>
              {nextMilestone.targetKm}km 달성까지
            </div>
            <div className={styles.milestoneReward}>
              보상: {nextMilestone.reward}
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

      {achievedMilestones.length > 0 && (
        <div className={styles.celebration}>
          <div className={styles.celebrationEmoji}>🎊</div>
          <div className={styles.celebrationText}>
            축하합니다! 마일스톤을 달성했습니다!
          </div>
        </div>
      )}
    </div>
  );
}