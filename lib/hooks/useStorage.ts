/**
 * Custom hook for managing AWS Amplify Storage operations
 * Requirements: 2.2, 2.4, 4.1, 4.2
 */

import { useState, useCallback, useEffect } from 'react';
import type { AppData, AppError, LoadingState } from '../../types';
import { StorageManager } from '../storage';
import { createAppError, logError } from '../errorHandler';

interface UseStorageReturn {
  data: AppData;
  loading: boolean;
  error: AppError | null;
  loadingState: LoadingState;
  loadData: () => Promise<void>;
  saveData: (data: AppData) => Promise<void>;
  checkConnection: () => Promise<boolean>;
  clearError: () => void;
}

export function useStorage(): UseStorageReturn {
  const [data, setData] = useState<AppData>({
    members: [],
    records: [],
    schedules: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  const storageManager = StorageManager.getInstance();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingState('loading');
      setError(null);

      const loadedData = await storageManager.loadAllData();
      setData(loadedData);
      setLoadingState('success');
    } catch (err: any) {
      const appError = createAppError(err, 'load');
      setError(appError);
      setLoadingState('error');
      logError(appError, 'useStorage.loadData');
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  const saveData = useCallback(async (newData: AppData) => {
    try {
      setLoading(true);
      setLoadingState('loading');
      setError(null);

      await storageManager.saveAllData(newData);
      setData(newData);
      setLoadingState('success');
    } catch (err: any) {
      const appError = createAppError(err, 'save');
      setError(appError);
      setLoadingState('error');
      logError(appError, 'useStorage.saveData');
      throw appError; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await storageManager.checkConnection();
    } catch (err: any) {
      const appError = createAppError(err, 'load');
      logError(appError, 'useStorage.checkConnection');
      return false;
    }
  }, [storageManager]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadingState,
    loadData,
    saveData,
    checkConnection,
    clearError,
  };
}