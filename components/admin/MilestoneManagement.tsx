'use client';

import React, { useState } from 'react';
import { Milestone, NewMilestone } from '../../types';
import { useApp } from '../../contexts/AppContext';
import styles from './MilestoneManagement.module.css';

export function MilestoneManagement() {
  const { data, addMilestone, updateMilestone, deleteMilestone } = useApp();
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [newMilestone, setNewMilestone] = useState<NewMilestone>({
    targetKm: 0,
    reward: ''
  });

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMilestone.targetKm <= 0 || !newMilestone.reward.trim()) return;

    try {
      await addMilestone(newMilestone);
      setNewMilestone({ targetKm: 0, reward: '' });
      setIsAddingMilestone(false);
    } catch (error) {
      console.error('마일스톤 추가 실패:', error);
    }
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    try {
      await updateMilestone(editingMilestone.id, editingMilestone);
      setEditingMilestone(null);
    } catch (error) {
      console.error('마일스톤 수정 실패:', error);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('정말로 이 마일스톤을 삭제하시겠습니까?')) return;

    try {
      await deleteMilestone(id);
    } catch (error) {
      console.error('마일스톤 삭제 실패:', error);
    }
  };

  const toggleMilestoneActive = async (milestone: Milestone) => {
    try {
      await updateMilestone(milestone.id, {
        ...milestone,
        isActive: !milestone.isActive
      });
    } catch (error) {
      console.error('마일스톤 상태 변경 실패:', error);
    }
  };

  const sortedMilestones = [...(data.milestones || [])].sort((a, b) => a.targetKm - b.targetKm);

  return (
    <div className={styles.milestoneManagement}>
      <div className={styles.header}>
        <h2>🎯 마일스톤 관리</h2>
        <button
          onClick={() => setIsAddingMilestone(true)}
          className={styles.addButton}
        >
          + 마일스톤 추가
        </button>
      </div>

      {isAddingMilestone && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>새 마일스톤 추가</h3>
            <form onSubmit={handleAddMilestone}>
              <div className={styles.formGroup}>
                <label>목표 거리 (km)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={newMilestone.targetKm || ''}
                  onChange={(e) => setNewMilestone({
                    ...newMilestone,
                    targetKm: parseFloat(e.target.value) || 0
                  })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>보상</label>
                <input
                  type="text"
                  value={newMilestone.reward}
                  onChange={(e) => setNewMilestone({
                    ...newMilestone,
                    reward: e.target.value
                  })}
                  placeholder="예: 치킨 파티, 상품권 등"
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMilestone(false);
                    setNewMilestone({ targetKm: 0, reward: '' });
                  }}
                  className={styles.cancelButton}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMilestone && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>마일스톤 수정</h3>
            <form onSubmit={handleUpdateMilestone}>
              <div className={styles.formGroup}>
                <label>목표 거리 (km)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={editingMilestone.targetKm || ''}
                  onChange={(e) => setEditingMilestone({
                    ...editingMilestone,
                    targetKm: parseFloat(e.target.value) || 0
                  })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>보상</label>
                <input
                  type="text"
                  value={editingMilestone.reward}
                  onChange={(e) => setEditingMilestone({
                    ...editingMilestone,
                    reward: e.target.value
                  })}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className={styles.cancelButton}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.milestoneList}>
        {sortedMilestones.length === 0 ? (
          <div className={styles.emptyState}>
            <p>등록된 마일스톤이 없습니다.</p>
            <p>첫 번째 마일스톤을 추가해보세요!</p>
          </div>
        ) : (
          sortedMilestones.map(milestone => (
            <div
              key={milestone.id}
              className={`${styles.milestoneCard} ${!milestone.isActive ? styles.inactive : ''}`}
            >
              <div className={styles.milestoneInfo}>
                <div className={styles.milestoneTarget}>
                  {milestone.targetKm}km
                </div>
                <div className={styles.milestoneReward}>
                  {milestone.reward}
                </div>
                <div className={styles.milestoneStatus}>
                  {milestone.isActive ? '활성' : '비활성'}
                </div>
              </div>
              <div className={styles.milestoneActions}>
                <button
                  onClick={() => toggleMilestoneActive(milestone)}
                  className={`${styles.toggleButton} ${milestone.isActive ? styles.active : styles.inactive}`}
                >
                  {milestone.isActive ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => setEditingMilestone(milestone)}
                  className={styles.editButton}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className={styles.deleteButton}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}