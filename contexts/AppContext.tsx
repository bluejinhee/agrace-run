'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Member, Record, Schedule, AppData, NewRecord, NewSchedule } from '../types';
import { StorageManager } from '../lib/storage';
import { handleStorageError } from '../lib/errorHandler';

interface AppState {
  data: AppData;
  loading: boolean;
  error: string | null;
  connectionStatus: 'online' | 'offline';
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'online' | 'offline' }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: { id: string; updates: Partial<Member> } }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'ADD_RECORD'; payload: Record }
  | { type: 'UPDATE_RECORD'; payload: { id: string; updates: Partial<Record> } }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: { id: string; updates: Partial<Schedule> } }
  | { type: 'DELETE_SCHEDULE'; payload: string };

interface AppContextType extends AppState {
  addMember: (name: string) => Promise<void>;
  addRecord: (record: NewRecord) => Promise<void>;
  addSchedule: (schedule: NewSchedule) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<Record>) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  loadData: () => Promise<void>;
  saveData: (data: AppData) => Promise<void>;
}

const initialState: AppState = {
  data: {
    members: [],
    records: [],
    schedules: []
  },
  loading: true,
  error: null,
  connectionStatus: 'online'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false, error: null };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    
    case 'ADD_MEMBER':
      return {
        ...state,
        data: {
          ...state.data,
          members: [...state.data.members, action.payload]
        }
      };
    
    case 'UPDATE_MEMBER':
      return {
        ...state,
        data: {
          ...state.data,
          members: state.data.members.map(member =>
            member.id === action.payload.id
              ? { ...member, ...action.payload.updates }
              : member
          )
        }
      };
    
    case 'DELETE_MEMBER':
      return {
        ...state,
        data: {
          ...state.data,
          members: state.data.members.filter(member => member.id !== action.payload),
          records: state.data.records.filter(record => record.memberId !== action.payload)
        }
      };
    
    case 'ADD_RECORD':
      return {
        ...state,
        data: {
          ...state.data,
          records: [...state.data.records, action.payload]
        }
      };
    
    case 'UPDATE_RECORD':
      return {
        ...state,
        data: {
          ...state.data,
          records: state.data.records.map(record =>
            record.id === action.payload.id
              ? { ...record, ...action.payload.updates }
              : record
          )
        }
      };
    
    case 'DELETE_RECORD':
      return {
        ...state,
        data: {
          ...state.data,
          records: state.data.records.filter(record => record.id !== action.payload)
        }
      };
    
    case 'ADD_SCHEDULE':
      return {
        ...state,
        data: {
          ...state.data,
          schedules: [...state.data.schedules, action.payload]
        }
      };
    
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        data: {
          ...state.data,
          schedules: state.data.schedules.map(schedule =>
            schedule.id === action.payload.id
              ? { ...schedule, ...action.payload.updates }
              : schedule
          )
        }
      };
    
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        data: {
          ...state.data,
          schedules: state.data.schedules.filter(schedule => schedule.id !== action.payload)
        }
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const storageManager = StorageManager.getInstance();

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 연결 상태 모니터링
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    const handleOffline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await storageManager.loadAllData();
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (error) {
      const errorMessage = handleStorageError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveData = async (data: AppData) => {
    try {
      await storageManager.saveAllData(data);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      throw error;
    }
  };

  const addMember = async (name: string) => {
    const now = new Date().toISOString();
    const newMember: Member = {
      id: Date.now().toString(),
      name,
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    dispatch({ type: 'ADD_MEMBER', payload: newMember });
    
    try {
      await saveData({
        ...state.data,
        members: [...state.data.members, newMember]
      });
    } catch (error) {
      // 롤백
      dispatch({ type: 'DELETE_MEMBER', payload: newMember.id });
      throw error;
    }
  };

  const addRecord = async (record: NewRecord) => {
    const now = new Date().toISOString();
    const newRecord: Record = {
      id: Date.now().toString(),
      memberId: record.memberId,
      distance: record.distance,
      pace: record.pace,
      date: record.date,
      time: new Date().toLocaleTimeString('ko-KR'),
      createdAt: now,
      updatedAt: now
    };

    dispatch({ type: 'ADD_RECORD', payload: newRecord });
    
    try {
      const updatedData = {
        ...state.data,
        records: [...state.data.records, newRecord]
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'DELETE_RECORD', payload: newRecord.id });
      throw error;
    }
  };

  const addSchedule = async (scheduleData: NewSchedule) => {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      ...scheduleData,
      createdAt: now,
      updatedAt: now
    };

    dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
    
    try {
      await saveData({
        ...state.data,
        schedules: [...state.data.schedules, newSchedule]
      });
    } catch (error) {
      // 롤백
      dispatch({ type: 'DELETE_SCHEDULE', payload: newSchedule.id });
      throw error;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const originalMember = state.data.members.find(m => m.id === id);
    if (!originalMember) return;

    dispatch({ type: 'UPDATE_MEMBER', payload: { id, updates } });
    
    try {
      const updatedData = {
        ...state.data,
        members: state.data.members.map(member =>
          member.id === id ? { ...member, ...updates } : member
        )
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'UPDATE_MEMBER', payload: { id, updates: originalMember } });
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    const memberToDelete = state.data.members.find(m => m.id === id);
    const recordsToDelete = state.data.records.filter(r => r.memberId === id);
    
    if (!memberToDelete) return;

    dispatch({ type: 'DELETE_MEMBER', payload: id });
    
    try {
      const updatedData = {
        ...state.data,
        members: state.data.members.filter(member => member.id !== id),
        records: state.data.records.filter(record => record.memberId !== id)
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'ADD_MEMBER', payload: memberToDelete });
      recordsToDelete.forEach(record => {
        dispatch({ type: 'ADD_RECORD', payload: record });
      });
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    const recordToDelete = state.data.records.find(r => r.id === id);
    if (!recordToDelete) return;

    dispatch({ type: 'DELETE_RECORD', payload: id });
    
    try {
      const updatedData = {
        ...state.data,
        records: state.data.records.filter(record => record.id !== id)
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'ADD_RECORD', payload: recordToDelete });
      throw error;
    }
  };

  const deleteSchedule = async (id: string) => {
    const scheduleToDelete = state.data.schedules.find(s => s.id === id);
    if (!scheduleToDelete) return;

    dispatch({ type: 'DELETE_SCHEDULE', payload: id });
    
    try {
      const updatedData = {
        ...state.data,
        schedules: state.data.schedules.filter(schedule => schedule.id !== id)
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'ADD_SCHEDULE', payload: scheduleToDelete });
      throw error;
    }
  };

  const updateRecord = async (id: string, updates: Partial<Record>) => {
    const originalRecord = state.data.records.find(r => r.id === id);
    if (!originalRecord) return;

    dispatch({ type: 'UPDATE_RECORD', payload: { id, updates } });
    
    try {
      const updatedData = {
        ...state.data,
        records: state.data.records.map(record =>
          record.id === id ? { ...record, ...updates } : record
        )
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'UPDATE_RECORD', payload: { id, updates: originalRecord } });
      throw error;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const originalSchedule = state.data.schedules.find(s => s.id === id);
    if (!originalSchedule) return;

    dispatch({ type: 'UPDATE_SCHEDULE', payload: { id, updates } });
    
    try {
      const updatedData = {
        ...state.data,
        schedules: state.data.schedules.map(schedule =>
          schedule.id === id ? { ...schedule, ...updates } : schedule
        )
      };
      
      await saveData(updatedData);
    } catch (error) {
      // 롤백
      dispatch({ type: 'UPDATE_SCHEDULE', payload: { id, updates: originalSchedule } });
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const contextValue: AppContextType = {
    ...state,
    addMember,
    addRecord,
    addSchedule,
    updateMember,
    updateRecord,
    updateSchedule,
    deleteMember,
    deleteRecord,
    deleteSchedule,
    refreshData,
    loadData,
    saveData
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}