'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Member, Record, Schedule, Milestone, AppData, NewRecord, NewSchedule, NewMilestone } from '../types';
import DynamoDBCognitoManager from '../lib/dynamodb-cognito.js';
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
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'ADD_MILESTONE'; payload: Milestone }
  | { type: 'UPDATE_MILESTONE'; payload: { id: string; updates: Partial<Milestone> } }
  | { type: 'DELETE_MILESTONE'; payload: string };

interface AppContextType extends AppState {
  addMember: (name: string) => Promise<void>;
  addRecord: (record: NewRecord) => Promise<void>;
  addSchedule: (schedule: NewSchedule) => Promise<void>;
  addMilestone: (milestone: NewMilestone) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<Record>) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  loadData: () => Promise<void>;
  saveData: (data: AppData) => Promise<void>;
}

const initialState: AppState = {
  data: {
    members: [],
    records: [],
    schedules: [],
    milestones: []
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
    
    case 'ADD_MILESTONE':
      return {
        ...state,
        data: {
          ...state.data,
          milestones: [...state.data.milestones, action.payload]
        }
      };
    
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        data: {
          ...state.data,
          milestones: state.data.milestones.map(milestone =>
            milestone.id === action.payload.id
              ? { ...milestone, ...action.payload.updates }
              : milestone
          )
        }
      };
    
    case 'DELETE_MILESTONE':
      return {
        ...state,
        data: {
          ...state.data,
          milestones: state.data.milestones.filter(milestone => milestone.id !== action.payload)
        }
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const storageManager = new DynamoDBCognitoManager();

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
      
      // DynamoDB 데이터를 앱 타입으로 변환
      const appData: AppData = {
        members: data.members as Member[],
        records: data.records as Record[],
        schedules: data.schedules as Schedule[],
        milestones: data.milestones as Milestone[]
      };
      
      dispatch({ type: 'SET_DATA', payload: appData });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      const errorMessage = handleStorageError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveData = async (data: AppData) => {
    // 개별 메서드를 사용하므로 이 함수는 더 이상 필요하지 않음
    // 호환성을 위해 빈 함수로 유지
    console.log('saveData called - using individual DynamoDB methods instead');
  };

  const addMember = async (name: string) => {
    try {
      const newMember = await storageManager.addMember({ name });
      dispatch({ type: 'ADD_MEMBER', payload: newMember });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const addRecord = async (record: NewRecord) => {
    try {
      const recordData = {
        ...record,
        time: new Date().toLocaleTimeString('ko-KR')
      };
      const newRecord = await storageManager.addRecord(recordData);
      dispatch({ type: 'ADD_RECORD', payload: newRecord });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error adding record:', error);
      throw error;
    }
  };

  const addSchedule = async (scheduleData: NewSchedule) => {
    try {
      const newSchedule = await storageManager.addSchedule(scheduleData);
      dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error adding schedule:', error);
      throw error;
    }
  };

  const addMilestone = async (milestoneData: NewMilestone) => {
    try {
      const newMilestone = await storageManager.addMilestone(milestoneData);
      dispatch({ type: 'ADD_MILESTONE', payload: newMilestone });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error adding milestone:', error);
      throw error;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      const updatedMember = await storageManager.updateMember(id, updates);
      dispatch({ type: 'UPDATE_MEMBER', payload: { id, updates: updatedMember as Partial<Member> } });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error updating member:', error);
      throw error;
    }
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    try {
      await storageManager.updateMilestone(id, updates);
      dispatch({ type: 'UPDATE_MILESTONE', payload: { id, updates } });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error updating milestone:', error);
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await storageManager.deleteMember(id);
      dispatch({ type: 'DELETE_MEMBER', payload: id });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error deleting member:', error);
      throw error;
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      await storageManager.deleteMilestone(id);
      dispatch({ type: 'DELETE_MILESTONE', payload: id });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
      console.error('Error deleting milestone:', error);
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
    addMilestone,
    updateMember,
    updateRecord,
    updateSchedule,
    updateMilestone,
    deleteMember,
    deleteRecord,
    deleteSchedule,
    deleteMilestone,
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