'use client';

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Schedule } from '../../types';
import styles from './ScheduleManagement.module.css';

export function ScheduleManagement() {
  const { data, addSchedule, updateSchedule, deleteSchedule } = useApp();
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    location: '',
    description: ''
  });
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    const { date, time, location, description } = scheduleForm;

    if (!date) {
      alert('날짜를 선택해주세요!');
      return;
    }

    if (!time) {
      alert('시간을 입력해주세요!');
      return;
    }

    if (!location.trim()) {
      alert('장소를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      await addSchedule({
        date,
        time,
        location: location.trim(),
        description: description.trim()
      });

      setScheduleForm({
        date: '',
        time: '',
        location: '',
        description: ''
      });

      alert('스케줄이 추가되었습니다! 📅');
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('스케줄 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      date: schedule.date,
      time: schedule.time,
      location: schedule.location,
      description: schedule.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    const { date, time, location, description } = scheduleForm;

    if (!date) {
      alert('날짜를 선택해주세요!');
      return;
    }

    if (!time) {
      alert('시간을 입력해주세요!');
      return;
    }

    if (!location.trim()) {
      alert('장소를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      await updateSchedule(editingSchedule.id, {
        date,
        time,
        location: location.trim(),
        description: description.trim()
      });

      setEditingSchedule(null);
      setScheduleForm({
        date: '',
        time: '',
        location: '',
        description: ''
      });

      alert('스케줄이 수정되었습니다! ✅');
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('스케줄 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setScheduleForm({
      date: '',
      time: '',
      location: '',
      description: ''
    });
  };

  const handleRemoveSchedule = async (scheduleId: number) => {
    const schedule = data.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const confirmDelete = confirm(
      schedule.date + ' ' + schedule.time + ' 스케줄을 삭제하시겠습니까?'
    );

    if (confirmDelete) {
      setLoading(true);
      try {
        await deleteSchedule(scheduleId);
        alert('스케줄이 삭제되었습니다.');
      } catch (error) {
        console.error('Error removing schedule:', error);
        alert('스케줄 삭제 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 날짜순으로 정렬 (최신순)
  const sortedSchedules = [...data.schedules].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="schedule-management-section">
      <h2>📅 스케줄 관리</h2>
      
      <form onSubmit={handleAddSchedule} className={styles.scheduleForm}>
        <div className="input-group">
          <input
            type="date"
            name="date"
            value={scheduleForm.date}
            onChange={handleInputChange}
            disabled={loading}
          />
          <input
            type="time"
            name="time"
            value={scheduleForm.time}
            onChange={handleInputChange}
            disabled={loading}
          />
          <input
            type="text"
            name="location"
            value={scheduleForm.location}
            onChange={handleInputChange}
            placeholder="장소 (예: 한강공원)"
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <textarea
            name="description"
            value={scheduleForm.description}
            onChange={handleInputChange}
            placeholder="상세 내용 (예: 5km 조깅, 준비물: 물병)"
            disabled={loading}
          />
          {editingSchedule ? (
            <>
              <button type="button" onClick={handleSaveEdit} disabled={loading}>
                {loading ? '저장 중...' : '수정 저장'}
              </button>
              <button type="button" onClick={handleCancelEdit} disabled={loading}>
                취소
              </button>
            </>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? '추가 중...' : '스케줄 추가'}
            </button>
          )}
        </div>
      </form>

      <div className={styles.scheduleList}>
        <h3>등록된 스케줄</h3>
        {sortedSchedules.length === 0 ? (
          <div className={styles.noSchedules}>등록된 스케줄이 없습니다.</div>
        ) : (
          sortedSchedules.map(schedule => {
            const scheduleDate = new Date(schedule.date);
            const formattedDate = scheduleDate.toLocaleDateString('ko-KR');

            return (
              <div key={schedule.id} className={styles.scheduleItem}>
                <div className={styles.scheduleInfo}>
                  <div className={styles.scheduleDateTime}>
                    {formattedDate} {schedule.time}
                  </div>
                  <div className={styles.scheduleLocation}>
                    📍 {schedule.location}
                  </div>
                  {schedule.description && (
                    <div className={styles.scheduleDescription}>
                      {schedule.description}
                    </div>
                  )}
                </div>
                <div className={styles.scheduleActions}>
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className={styles.editButton}
                    disabled={loading}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemoveSchedule(schedule.id)}
                    className={styles.deleteButton}
                    disabled={loading}
                  >
                    🗑️
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