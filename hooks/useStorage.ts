'use client';

import { useState, useCallback } from 'react';
import { AppData } from '../types';
import { StorageManager } from '../lib/storage';
import { handleStorageError } from '../lib/errorHandler';

export function useStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageManager = StorageManager.getInstance();

  const loadData = useCallback(async (): Promise<AppData> => {
    try {
      setLoading(true);
      setError(null);
      const data = await storageManager.loadAllData();
      return data;
    } catch (err) {
      const errorMessage = handleStorageError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  const saveData = useCallback(async (data: AppData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await storageManager.saveAllData(data);
    } catch (err) {
      const errorMessage = handleStorageError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    loadData,
    saveData,
    clearError
  };
}