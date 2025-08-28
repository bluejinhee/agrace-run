'use client';

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Record, Member } from '../../types';
import styles from './RecordManagement.module.css';

interface EditRecordForm {
  memberId: number;
  distance: number;
  pace: string;
  date: string;
}

export function RecordManagement() {
  const { data, updateRecord, deleteRecord } = useApp();
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [editForm, setEditForm] = useState<EditRecordForm>({
    memberId: 0,
    distance: 0,
    pace: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleEditRecord = (record: Record) => {
    setEditingRecord(record);
    setEditForm({
      memberId: record.memberId,
      distance: record.distance,
      pace: record.pace || '',
      date: record.originalDate || record.date
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'memberId' ? parseInt(value) : 
              name === 'distance' ? parseFloat(value) : value
    }));
  };

  const isValidPace = (pace: string): boolean => {
    const pacePattern = /^[0-9]+:[0-5][0-9]$/;
    return pacePattern.test(pace);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    const { memberId, distance, pace, date } = editForm;

    // 유효성 검사
    if (!memberId) {
      alert('멤버를 선택해주세요!');
      return;
    }

    if (!distance || distance <= 0) {
      alert('올바른 거리를 입력해주세요!');
      return;
    }

    if (!date) {
      alert('날짜를 선택해주세요!');
      return;
    }

    // 페이스 유효성 검사
    if (pace && !isValidPace(pace)) {
      alert('페이스는 분:초 형식으로 입력해주세요 (예: 5:30)');
      return;
    }

    setLoading(true);
    try {
      const recordDate = new Date(date);
      const formattedDate = recordDate.toLocaleDateString('ko-KR');

      await updateRecord(editingRecord.id, {
        memberId,
        distance,
        pace: pace || undefined,
        date: formattedDate,
        originalDate: date
      });

      setEditingRecord(null);
      setEditForm({
        memberId: 0,
        distance: 0,
        pace: '',
        date: ''
      });

      alert('기록이 수정되었습니다! ✅');
    } catch (error) {
      console.error('Error updating record:', error);
      alert('기록 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({
      memberId: 0,
      distance: 0,
      pace: '',
      date: ''
    });
  };

  const handleRemoveRecord = async (recordId: number) => {
    const record = data.records.find(r => r.id === recordId);
    if (!record) return;

    const member = data.members.find(m => m.id === record.memberId);
    const memberName = member ? member.name : '알 수 없는 멤버';

    const confirmDelete = confirm(
      `${memberName}님의 ${record.distance}km 기록을 삭제하시겠습니까?`
    );

    if (confirmDelete) {
      setLoading(true);
      try {
        await deleteRecord(recordId);
        alert('기록이 삭제되었습니다.');
      } catch (error) {
        console.error('Error removing record:', error);
        alert('기록 삭제 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 날짜순으로 정렬 (최신순)
  const sortedRecords = [...data.records].sort((a, b) => {
    if (a.originalDate && b.originalDate) {
      return new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime();
    }
    return b.id - a.id;
  });

  return (
    <div className="record-management-section">
      <h2>🏃‍♂️ 기록 관리</h2>
      
      {editingRecord && (
        <div className={styles.editModal}>
          <div className={styles.editForm}>
            <h3>기록 수정</h3>
            
            <div className={styles.inputGroup}>
              <label>멤버</label>
              <select
                name="memberId"
                value={editForm.memberId}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value={0}>멤버 선택</option>
                {data.members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>거리 (km)</label>
              <input
                type="number"
                name="distance"
                value={editForm.distance}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>페이스 (분:초/km, 선택사항)</label>
              <input
                type="text"
                name="pace"
                value={editForm.pace}
                onChange={handleInputChange}
                placeholder="5:30"
                pattern="[0-9]+:[0-5][0-9]"
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>날짜</label>
              <input
                type="date"
                name="date"
                value={editForm.date}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleSaveEdit} disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
              <button onClick={handleCancelEdit} disabled={loading}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.recordList}>
        {sortedRecords.length === 0 ? (
          <div className={styles.noRecords}>등록된 기록이 없습니다.</div>
        ) : (
          sortedRecords.map(record => {
            const member = data.members.find(m => m.id === record.memberId);
            if (!member) return null;

            return (
              <div key={record.id} className={styles.recordItem}>
                <div className={styles.recordInfo}>
                  <div className={styles.recordMember}>{member.name}</div>
                  <div className={styles.recordDetails}>
                    <span className={styles.distanceTag}>{record.distance}km</span>
                    {record.pace && (
                      <span className={styles.paceTag}>{record.pace}/km</span>
                    )}
                  </div>
                  <div className={styles.recordDate}>
                    {record.date} {record.time}
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button
                    onClick={() => handleEditRecord(record)}
                    className={styles.editButton}
                    disabled={loading}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleRemoveRecord(record.id)}
                    className={styles.deleteButton}
                    disabled={loading}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}