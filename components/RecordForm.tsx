'use client';

import React, { useState, useCallback } from 'react';
import { Member, NewRecord } from '../types';
import styles from './RecordForm.module.css';

interface RecordFormProps {
  members: Member[];
  onSubmit: (record: NewRecord) => Promise<void>;
  loading?: boolean;
}

export function RecordForm({ members, onSubmit, loading = false }: RecordFormProps) {
  const [formData, setFormData] = useState({
    memberId: '',
    distance: '',
    pace: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.memberId) {
      return '멤버를 선택해주세요.';
    }
    
    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      return '올바른 거리를 입력해주세요.';
    }
    
    if (parseFloat(formData.distance) > 100) {
      return '거리는 100km 이하로 입력해주세요.';
    }
    
    if (!formData.date) {
      return '날짜를 선택해주세요.';
    }
    
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      return '미래 날짜는 선택할 수 없습니다.';
    }
    
    // 페이스 유효성 검사 (선택사항)
    if (formData.pace && !isValidPace(formData.pace)) {
      return '페이스는 MM:SS 형식으로 입력해주세요. (예: 5:30)';
    }
    
    return null;
  }, [formData]);

  const isValidPace = (pace: string): boolean => {
    const paceRegex = /^\d{1,2}:\d{2}$/;
    if (!paceRegex.test(pace)) return false;
    
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes >= 0 && seconds >= 0 && seconds < 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const record: NewRecord = {
        memberId: parseInt(formData.memberId),
        distance: parseFloat(formData.distance),
        pace: formData.pace || undefined,
        date: formData.date
      };
      
      await onSubmit(record);
      
      // 성공 시 폼 초기화
      setFormData({
        memberId: '',
        distance: '',
        pace: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setSuccess(true);
      
      // 성공 메시지 3초 후 자동 제거
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMember = members.find(m => m.id === parseInt(formData.memberId));

  return (
    <div className={styles.recordForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <div className={styles.inputField}>
            <label htmlFor="member" className={styles.label}>
              멤버 선택 *
            </label>
            <select
              id="member"
              value={formData.memberId}
              onChange={(e) => handleInputChange('memberId', e.target.value)}
              className={styles.select}
              disabled={loading || isSubmitting}
            >
              <option value="">멤버를 선택하세요</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputField}>
            <label htmlFor="distance" className={styles.label}>
              거리 (km) *
            </label>
            <input
              id="distance"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={formData.distance}
              onChange={(e) => handleInputChange('distance', e.target.value)}
              placeholder="예: 5.2"
              className={styles.input}
              disabled={loading || isSubmitting}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.inputField}>
            <label htmlFor="pace" className={styles.label}>
              페이스 (분:초/km)
            </label>
            <input
              id="pace"
              type="text"
              value={formData.pace}
              onChange={(e) => handleInputChange('pace', e.target.value)}
              placeholder="예: 5:30"
              className={styles.input}
              disabled={loading || isSubmitting}
            />
            <div className={styles.hint}>
              선택사항 - 분:초 형식으로 입력 (예: 5:30)
            </div>
          </div>

          <div className={styles.inputField}>
            <label htmlFor="date" className={styles.label}>
              날짜 *
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={styles.input}
              disabled={loading || isSubmitting}
            />
          </div>
        </div>

        {selectedMember && (
          <div className={styles.memberPreview}>
            <h4>선택된 멤버 정보</h4>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{selectedMember.name}</span>
              <div className={styles.memberStats}>
                <span>총 거리: {selectedMember.totalDistance.toFixed(1)}km</span>
                <span>기록 수: {selectedMember.recordCount}회</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <span className={styles.successIcon}>✅</span>
            기록이 성공적으로 저장되었습니다!
          </div>
        )}

        <button
          type="submit"
          className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
          disabled={loading || isSubmitting || members.length === 0}
        >
          {isSubmitting ? (
            <>
              <span className={styles.spinner}></span>
              저장 중...
            </>
          ) : (
            '🏃‍♂️ 기록 추가'
          )}
        </button>

        {members.length === 0 && (
          <div className={styles.noMembers}>
            먼저 멤버를 추가해주세요.
          </div>
        )}
      </form>
    </div>
  );
}