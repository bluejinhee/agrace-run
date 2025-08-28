/**
 * TypeScript Storage Manager for DynamoDB
 * Requirements: 2.2, 2.4, 4.1, 4.2
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    ScanCommand, 
    QueryCommand, 
    DeleteCommand,
    UpdateCommand 
} from "@aws-sdk/lib-dynamodb";
import type { Member, Record, Schedule, AppData } from '../types';

interface StorageData<T> {
  [key: string]: T | string;
  lastUpdated: string;
}

interface MembersData extends StorageData<Member[]> {
  members: Member[];
}

interface RecordsData extends StorageData<Record[]> {
  records: Record[];
}

interface SchedulesData extends StorageData<Schedule[]> {
  schedules: Schedule[];
}

export class StorageManager {
  private static instance: StorageManager;
  private readonly region: string = 'ap-northeast-1';
  private readonly retryAttempts: number = 3;
  private readonly retryDelay: number = 1000; // 1초
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tables = {
    members: 'RunningClub-Members',
    records: 'RunningClub-Records',
    schedules: 'RunningClub-Schedules'
  };

  private constructor() {
    this.client = new DynamoDBClient({ region: this.region });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }



  /**
   * 멤버 데이터를 로드합니다
   */
  async loadMembers(): Promise<Member[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tables.members
      });
      
      const response = await this.docClient.send(command);
      return response.Items as Member[] || [];
    } catch (error) {
      console.error('Error loading members:', error);
      return [];
    }
  }

  /**
   * 새 멤버를 추가합니다
   */
  async addMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const memberData: Member = {
      id: `member_${Date.now()}`,
      name: member.name,
      email: member.email,
      phone: member.phone,
      joinDate: member.joinDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: this.tables.members,
      Item: memberData
    });

    await this.docClient.send(command);
    return memberData;
  }

  /**
   * 멤버 정보를 업데이트합니다
   */
  async updateMember(memberId: string, updates: Partial<Member>): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tables.members,
      Key: { id: memberId },
      UpdateExpression: 'SET #name = :name, email = :email, phone = :phone, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':email': updates.email,
        ':phone': updates.phone,
        ':updatedAt': new Date().toISOString()
      }
    });

    await this.docClient.send(command);
  }

  /**
   * 멤버 데이터를 저장합니다 (호환성을 위해 유지)
   */
  async saveMembers(members: Member[]): Promise<void> {
    // DynamoDB에서는 개별 아이템으로 저장
    for (const member of members) {
      await this.addMember(member);
    }
  }

  /**
   * 기록 데이터를 로드합니다
   */
  async loadRecords(): Promise<Record[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tables.records
      });
      
      const response = await this.docClient.send(command);
      return response.Items as Record[] || [];
    } catch (error) {
      console.error('Error loading records:', error);
      return [];
    }
  }

  /**
   * 특정 멤버의 기록을 로드합니다
   */
  async loadMemberRecords(memberId: string): Promise<Record[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tables.records,
        IndexName: 'memberId-date-index',
        KeyConditionExpression: 'memberId = :memberId',
        ExpressionAttributeValues: {
          ':memberId': memberId
        },
        ScanIndexForward: false // 최신 순으로 정렬
      });
      
      const response = await this.docClient.send(command);
      return response.Items as Record[] || [];
    } catch (error) {
      console.error('Error loading member records:', error);
      return [];
    }
  }

  /**
   * 새 기록을 추가합니다
   */
  async addRecord(record: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>): Promise<Record> {
    const recordData: Record = {
      id: `record_${Date.now()}`,
      memberId: record.memberId,
      date: record.date,
      distance: record.distance,
      time: record.time,
      pace: record.pace,
      notes: record.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: this.tables.records,
      Item: recordData
    });

    await this.docClient.send(command);
    return recordData;
  }

  /**
   * 기록 데이터를 저장합니다 (호환성을 위해 유지)
   */
  async saveRecords(records: Record[]): Promise<void> {
    // DynamoDB에서는 개별 아이템으로 저장
    for (const record of records) {
      await this.addRecord(record);
    }
  }

  /**
   * 스케줄 데이터를 로드합니다
   */
  async loadSchedules(): Promise<Schedule[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tables.schedules
      });
      
      const response = await this.docClient.send(command);
      return response.Items as Schedule[] || [];
    } catch (error) {
      console.error('Error loading schedules:', error);
      return [];
    }
  }

  /**
   * 특정 날짜의 스케줄을 로드합니다
   */
  async loadSchedulesByDate(date: string): Promise<Schedule[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tables.schedules,
        IndexName: 'date-index',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':date': date
        }
      });
      
      const response = await this.docClient.send(command);
      return response.Items as Schedule[] || [];
    } catch (error) {
      console.error('Error loading schedules by date:', error);
      return [];
    }
  }

  /**
   * 새 스케줄을 추가합니다
   */
  async addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const scheduleData: Schedule = {
      id: `schedule_${Date.now()}`,
      date: schedule.date,
      title: schedule.title,
      description: schedule.description || '',
      location: schedule.location || '',
      time: schedule.time || '',
      participants: schedule.participants || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: this.tables.schedules,
      Item: scheduleData
    });

    await this.docClient.send(command);
    return scheduleData;
  }

  /**
   * 스케줄 데이터를 저장합니다 (호환성을 위해 유지)
   */
  async saveSchedules(schedules: Schedule[]): Promise<void> {
    // DynamoDB에서는 개별 아이템으로 저장
    for (const schedule of schedules) {
      await this.addSchedule(schedule);
    }
  }

  /**
   * 모든 데이터를 한 번에 로드합니다
   */
  async loadAllData(): Promise<AppData> {
    try {
      const [members, records, schedules] = await Promise.all([
        this.loadMembers(),
        this.loadRecords(),
        this.loadSchedules()
      ]);

      return {
        members,
        records,
        schedules
      };
    } catch (error) {
      console.error('Error loading all data:', error);
      throw error;
    }
  }

  /**
   * 모든 데이터를 한 번에 저장합니다
   */
  async saveAllData(data: AppData): Promise<void>;
  async saveAllData(members: Member[], records: Record[], schedules: Schedule[]): Promise<void>;
  async saveAllData(
    dataOrMembers: AppData | Member[], 
    records?: Record[], 
    schedules?: Schedule[]
  ): Promise<void> {
    try {
      let membersData: Member[];
      let recordsData: Record[];
      let schedulesData: Schedule[];

      if (Array.isArray(dataOrMembers)) {
        // Legacy signature: saveAllData(members, records, schedules)
        membersData = dataOrMembers;
        recordsData = records!;
        schedulesData = schedules!;
      } else {
        // New signature: saveAllData(data)
        membersData = dataOrMembers.members;
        recordsData = dataOrMembers.records;
        schedulesData = dataOrMembers.schedules;
      }

      await Promise.all([
        this.saveMembers(membersData),
        this.saveRecords(recordsData),
        this.saveSchedules(schedulesData)
      ]);
      
      console.log('All data saved successfully');
    } catch (error) {
      console.error('Error saving all data:', error);
      throw error;
    }
  }

  /**
   * DynamoDB 연결 상태를 확인합니다
   */
  async checkConnection(): Promise<boolean> {
    try {
      // 간단한 scan 작업으로 연결 상태 확인
      const command = new ScanCommand({
        TableName: this.tables.members,
        Limit: 1
      });
      
      await this.docClient.send(command);
      return true;
    } catch (error) {
      console.error('DynamoDB connection check failed:', error);
      return false;
    }
  }

  /**
   * 통계 데이터를 계산합니다
   */
  async getStats(): Promise<{
    totalMembers: number;
    totalRecords: number;
    thisMonthRecords: number;
    totalDistance: number;
  }> {
    try {
      const [members, records] = await Promise.all([
        this.loadMembers(),
        this.loadRecords()
      ]);

      const totalMembers = members.length;
      const totalRecords = records.length;
      
      // 이번 달 기록 수
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const thisMonthRecords = records.filter(record => 
        record.date.startsWith(currentMonth)
      ).length;

      // 총 거리
      const totalDistance = records.reduce((sum, record) => 
        sum + (parseFloat(record.distance.toString()) || 0), 0
      );

      return {
        totalMembers,
        totalRecords,
        thisMonthRecords,
        totalDistance: Math.round(totalDistance * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalMembers: 0,
        totalRecords: 0,
        thisMonthRecords: 0,
        totalDistance: 0
      };
    }
  }

  /**
   * DynamoDB 오류를 처리합니다
   */
  private handleStorageError(error: any, operation: 'load' | 'save', tableName: string): Error {
    let userMessage = '';
    
    switch (error.code || error.name) {
      case 'ResourceNotFoundException':
        userMessage = `테이블을 찾을 수 없습니다: ${tableName}`;
        break;
        
      case 'AccessDeniedException':
        userMessage = 'DynamoDB 접근 권한이 없습니다. 관리자에게 문의하세요.';
        break;
        
      case 'NetworkError':
      case 'NetworkingError':
        userMessage = '네트워크 연결을 확인해주세요.';
        break;
        
      case 'InvalidAccessKeyId':
      case 'SignatureDoesNotMatch':
        userMessage = 'AWS 인증에 실패했습니다. 설정을 확인해주세요.';
        break;
        
      default:
        if (operation === 'load') {
          userMessage = '데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.';
        } else {
          userMessage = '데이터 저장에 실패했습니다. 다시 시도해주세요.';
        }
    }
    
    const enhancedError = new Error(userMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).operation = operation;
    (enhancedError as any).tableName = tableName;
    
    return enhancedError;
  }

  /**
   * 재시도 로직과 함께 작업을 실행합니다
   */
  async withRetry<T>(operation: () => Promise<T>, maxRetries: number = this.retryAttempts): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 지수 백오프로 대기
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Retry logic failed unexpectedly');
  }

  /**
   * 지정된 시간만큼 대기합니다
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


}

// 싱글톤 인스턴스 내보내기
export const storageManager = StorageManager.getInstance();

// 기존 코드와의 호환성을 위한 함수들 (브라우저 환경에서만)
if (typeof window !== 'undefined') {
  (window as any).loadFromCloud = async function() {
    try {
      return await storageManager.loadAllData();
    } catch (error) {
      console.error('Error in loadFromCloud:', error);
      throw error;
    }
  };

  (window as any).saveToCloud = async function(members: Member[], records: Record[], schedules: Schedule[]) {
    try {
      await storageManager.saveAllData(members, records, schedules);
    } catch (error) {
      console.error('Error in saveToCloud:', error);
      throw error;
    }
  };

  (window as any).updateConnectionStatus = async function() {
    try {
      const isConnected = await storageManager.checkConnection();
      
      // 연결 상태 UI 업데이트
      const statusElement = document.getElementById('connectionStatus');
      if (statusElement) {
        statusElement.textContent = isConnected ? '✅ DynamoDB 연결됨' : '❌ DynamoDB 연결 실패';
        statusElement.className = isConnected ? 'connected' : 'disconnected';
      }
      
      return isConnected;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  };

  // StorageManager 클래스를 전역으로 노출
  (window as any).StorageManager = StorageManager;
  (window as any).storageManager = storageManager;
}