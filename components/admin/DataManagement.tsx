'use client';

import { useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { StorageManager } from '../../lib/storage';
import styles from './DataManagement.module.css';

export function DataManagement() {
  const { data, loadData, saveData } = useApp();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const exportData = {
      members: data.members,
      records: data.records,
      schedules: data.schedules,
      milestones: data.milestones,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'running-club-data-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();

    alert('데이터가 다운로드되었습니다! 📤');
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        members: data.members,
        records: data.records,
        schedules: data.schedules,
        milestones: data.milestones,
        backupDate: new Date().toISOString(),
        version: '2.0'
      };

      // DynamoDB 환경에서는 로컬 파일로 백업 다운로드
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `backup-${timestamp}.json`;
      link.click();

      alert(`백업이 로컬에 다운로드되었습니다! 📦\n파일명: backup-${timestamp}.json`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('백업 생성 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const listBackups = async () => {
    alert('DynamoDB 환경에서는 로컬 백업 파일을 사용해주세요.\n\n백업 복원 방법:\n1. "📦 백업 생성"으로 현재 데이터 백업\n2. "📥 데이터 가져오기"로 백업 파일 복원');
  };

  const restoreFromBackup = async (backupPath: string) => {
    // DynamoDB 환경에서는 사용하지 않음
    alert('DynamoDB 환경에서는 "📥 데이터 가져오기" 기능을 사용해주세요.');
  };

  const importData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);

        const importedData = JSON.parse(e.target?.result as string);

        if (importedData.members && Array.isArray(importedData.members)) {
          const confirmImport = confirm(
            '기존 데이터를 모두 덮어쓰시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
          );

          if (confirmImport) {
            // 현재 데이터를 백업으로 저장
            try {
              await createBackup();
            } catch (backupError) {
              console.warn('Backup creation failed:', backupError);
            }

            // 새 데이터로 교체
            const newData = {
              members: importedData.members,
              records: importedData.records || [],
              schedules: importedData.schedules || [],
              milestones: importedData.milestones || []
            };

            await saveData(newData);
            await loadData(); // UI 새로고침

            alert('데이터가 성공적으로 가져와졌습니다! 📥\n이전 데이터는 백업으로 저장되었습니다.');
          }
        } else {
          alert('올바르지 않은 데이터 형식입니다.\n필수 필드: members (배열)');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('파일을 읽는 중 오류가 발생했습니다: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // 파일 입력 초기화
  };

  const resetData = async () => {
    const confirmReset = confirm(
      '정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    );

    if (confirmReset) {
      const doubleConfirm = confirm(
        '마지막 확인입니다.\n모든 멤버와 기록이 영구적으로 삭제됩니다.'
      );

      if (doubleConfirm) {
        setLoading(true);
        try {
          // 현재 데이터를 백업으로 저장
          await createBackup();

          // 모든 데이터 초기화
          const emptyData = {
            members: [],
            records: [],
            schedules: [],
            milestones: []
          };

          await saveData(emptyData);
          await loadData(); // UI 새로고침

          alert('모든 데이터가 삭제되었습니다.\n이전 데이터는 백업으로 저장되었습니다.');
        } catch (error) {
          console.error('Error resetting data:', error);
          alert('데이터 초기화 중 오류가 발생했습니다: ' + (error as Error).message);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const syncDataFromDynamoDB = async () => {
    const confirmSync = confirm(
      'DynamoDB에서 최신 데이터를 다시 로드하시겠습니까?\n현재 변경사항이 저장되지 않았다면 손실될 수 있습니다.'
    );

    if (confirmSync) {
      setLoading(true);
      try {
        await loadData();
        alert('DynamoDB에서 최신 데이터를 성공적으로 로드했습니다! 🔄');
      } catch (error) {
        console.error('Error syncing data:', error);
        alert('데이터 동기화 중 오류가 발생했습니다: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="data-management-section">
      <h2>💾 데이터 관리</h2>
      
      <div className={styles.dataButtons}>
        <div className={styles.buttonGroup}>
          <h3>데이터 내보내기/가져오기</h3>
          <button 
            onClick={exportData} 
            className={styles.exportButton}
            disabled={loading}
          >
            📤 데이터 내보내기
          </button>
          <button 
            onClick={importData} 
            className={styles.importButton}
            disabled={loading}
          >
            📥 데이터 가져오기
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <h3>로컬 백업</h3>
          <button 
            onClick={createBackup} 
            className={styles.backupButton}
            disabled={loading}
          >
            {loading ? '백업 중...' : '📦 백업 생성'}
          </button>
          <button 
            onClick={listBackups} 
            className={styles.restoreButton}
            disabled={loading}
          >
            💡 백업 복원 안내
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <h3>데이터 관리</h3>
          <button 
            onClick={syncDataFromDynamoDB} 
            className={styles.syncButton}
            disabled={loading}
          >
            {loading ? '동기화 중...' : '🔄 DynamoDB 동기화'}
          </button>
          <button 
            onClick={resetData} 
            className={styles.resetButton}
            disabled={loading}
          >
            {loading ? '초기화 중...' : '🗑️ 모든 데이터 초기화'}
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div>⚙️</div>
            <div>처리 중...</div>
          </div>
        </div>
      )}
    </div>
  );
}