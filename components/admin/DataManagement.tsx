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
        backupDate: new Date().toISOString(),
        version: '2.0'
      };

      // S3의 backups 폴더에 백업 저장
      const backupFileName = `backups/backup-${timestamp}.json`;
      const storageManager = StorageManager.getInstance();
      
      await storageManager.saveData(backupFileName, backupData);
      alert(`백업이 S3에 생성되었습니다! 📦\n파일명: ${backupFileName}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('백업 생성 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const listBackups = async () => {
    setLoading(true);
    try {
      const storageManager = StorageManager.getInstance();
      
      // S3에서 백업 파일 목록 조회
      const backupFiles = await storageManager.listBackups();

      if (backupFiles.length === 0) {
        alert('백업 파일이 없습니다.');
        return;
      }

      // 백업 목록을 사용자에게 표시
      let backupList = '사용 가능한 백업:\n\n';
      backupFiles.forEach((file, index) => {
        const fileName = file.key.split('/').pop();
        const date = new Date(file.lastModified).toLocaleString('ko-KR');
        backupList += `${index + 1}. ${fileName}\n   생성일: ${date}\n\n`;
      });

      const selection = prompt(backupList + '\n복원할 백업 번호를 입력하세요 (취소하려면 빈 값):');

      if (selection && !isNaN(Number(selection))) {
        const selectedIndex = parseInt(selection) - 1;
        if (selectedIndex >= 0 && selectedIndex < backupFiles.length) {
          const selectedFile = backupFiles[selectedIndex];
          await restoreFromBackup(selectedFile.key);
        } else {
          alert('잘못된 번호입니다.');
        }
      }
    } catch (error) {
      console.error('Error listing backups:', error);
      alert('백업 목록 조회 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = async (backupPath: string) => {
    const confirmRestore = confirm(
      '현재 데이터를 백업 데이터로 덮어쓰시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmRestore) {
      return;
    }

    setLoading(true);
    try {
      const storageManager = StorageManager.getInstance();
      
      // 백업 파일에서 데이터 로드
      const backupData = await storageManager.loadData(backupPath);

      if (backupData.members && Array.isArray(backupData.members)) {
        // 현재 데이터를 백업으로 저장
        await createBackup();

        // 새 데이터로 교체하고 저장
        const newData = {
          members: backupData.members,
          records: backupData.records || [],
          schedules: backupData.schedules || []
        };

        await saveData(newData);
        await loadData(); // UI 새로고침

        alert('백업에서 데이터가 성공적으로 복원되었습니다! 🔄');
      } else {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
      alert('백업 복원 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
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
              schedules: importedData.schedules || []
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
            schedules: []
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

  const syncDataFromS3 = async () => {
    const confirmSync = confirm(
      'S3에서 최신 데이터를 다시 로드하시겠습니까?\n현재 변경사항이 저장되지 않았다면 손실될 수 있습니다.'
    );

    if (confirmSync) {
      setLoading(true);
      try {
        await loadData();
        alert('S3에서 최신 데이터를 성공적으로 로드했습니다! 🔄');
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
          <h3>로컬 백업</h3>
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
          <h3>클라우드 백업</h3>
          <button 
            onClick={createBackup} 
            className={styles.backupButton}
            disabled={loading}
          >
            {loading ? '백업 중...' : '📦 S3 백업 생성'}
          </button>
          <button 
            onClick={listBackups} 
            className={styles.restoreButton}
            disabled={loading}
          >
            {loading ? '조회 중...' : '🔄 백업에서 복원'}
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <h3>데이터 관리</h3>
          <button 
            onClick={syncDataFromS3} 
            className={styles.syncButton}
            disabled={loading}
          >
            {loading ? '동기화 중...' : '🔄 S3 동기화'}
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