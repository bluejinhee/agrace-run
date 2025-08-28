'use client';

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Member } from '../../types';
import styles from './MemberManagement.module.css';

export function MemberManagement() {
  const { data, addMember, updateMember, deleteMember } = useApp();
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(false);

  // 멤버별 통계 계산
  const getMemberStats = (memberId: string) => {
    const memberRecords = data.records.filter(record => record.memberId === memberId);
    const totalDistance = memberRecords.reduce((sum, record) => sum + record.distance, 0);
    const recordCount = memberRecords.length;
    return { totalDistance, recordCount };
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = memberName.trim();
    if (!name) {
      alert('이름을 입력해주세요!');
      return;
    }

    if (data.members.find(member => member.name === name)) {
      alert('이미 등록된 멤버입니다!');
      return;
    }

    setLoading(true);
    try {
      await addMember(name);
      setMemberName('');
      alert(name + '님이 런닝크루에 가입했습니다! 🎉');
    } catch (error) {
      console.error('Error adding member:', error);
      alert('멤버 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = data.members.find(m => m.id === memberId);
    if (!member) return;

    const confirmDelete = confirm(
      member.name + '님을 정말 삭제하시겠습니까?\n관련된 모든 기록도 함께 삭제됩니다.'
    );

    if (confirmDelete) {
      setLoading(true);
      try {
        await deleteMember(memberId);
        alert(member.name + '님이 삭제되었습니다.');
      } catch (error) {
        console.error('Error removing member:', error);
        alert('멤버 삭제 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditMemberName = async (memberId: string) => {
    const member = data.members.find(m => m.id === memberId);
    if (!member) return;

    const newName = prompt('새로운 이름을 입력하세요:', member.name);

    if (newName && newName.trim() !== '') {
      const trimmedName = newName.trim();

      // 중복 이름 체크 (자기 자신 제외)
      if (data.members.find(m => m.name === trimmedName && m.id !== memberId)) {
        alert('이미 존재하는 이름입니다!');
        return;
      }

      setLoading(true);
      try {
        await updateMember(memberId, { name: trimmedName });
        alert('이름이 ' + trimmedName + '으로 변경되었습니다.');
      } catch (error) {
        console.error('Error updating member name:', error);
        alert('이름 변경 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 이름순으로 정렬
  const sortedMembers = [...data.members].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="member-section">
        <h2>👥 멤버 등록</h2>
        <form onSubmit={handleAddMember} className="input-group">
          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="이름을 입력하세요"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? '추가 중...' : '멤버 추가'}
          </button>
        </form>
      </div>

      <div className="member-management-section">
        <h2>📋 멤버 관리</h2>
        <div className={styles.memberList}>
          {sortedMembers.length === 0 ? (
            <div className={styles.noMembers}>등록된 멤버가 없습니다.</div>
          ) : (
            sortedMembers.map(member => {
              const stats = getMemberStats(member.id);
              return (
                <div key={member.id} className={styles.memberItem}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{member.name}</div>
                    <div className={styles.memberDetails}>
                      <span>총 거리: {stats.totalDistance.toFixed(1)}km</span>
                      <span>출석: {stats.recordCount}회</span>
                      <span>가입일: {member.joinDate}</span>
                    </div>
                  </div>
                <div className={styles.memberActions}>
                  <button
                    onClick={() => handleEditMemberName(member.id)}
                    className={styles.editButton}
                    disabled={loading}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
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
    </>
  );
}