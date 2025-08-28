/**
 * DynamoDB Cognito Client
 * Cognito Identity Pool을 사용하여 브라우저에서 안전하게 DynamoDB에 접근
 */

import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

/**
 * KST 기준으로 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getKSTDateString(date) {
    const targetDate = date || new Date();
    
    // KST는 UTC+9
    const kstOffset = 9 * 60; // 9시간을 분으로 변환
    const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
    const kstTime = new Date(utc + (kstOffset * 60000));
    
    return kstTime.toISOString().split('T')[0];
}

/**
 * KST 기준으로 현재 시간을 ISO 문자열로 반환
 */
function getKSTISOString(date) {
    const targetDate = date || new Date();
    
    // KST는 UTC+9
    const kstOffset = 9 * 60;
    const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
    const kstTime = new Date(utc + (kstOffset * 60000));
    
    return kstTime.toISOString();
}

// Cognito Identity Pool 설정 - 환경변수에서 가져오기
const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID;
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;

// 빌드 시에는 환경변수가 없을 수 있으므로 기본값 설정
const isBuilding = process.env.NODE_ENV === 'production' && !IDENTITY_POOL_ID;

if (!isBuilding) {
  // 런타임에서만 환경변수 검증
  if (!IDENTITY_POOL_ID) {
    console.warn('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID environment variable is not set');
  }
  if (!REGION) {
    console.warn('NEXT_PUBLIC_AWS_REGION environment variable is not set');
  }
}

// 임시 자격증명 제공자 설정
const credentialsProvider = fromCognitoIdentityPool({
  client: new CognitoIdentityClient({ region: REGION }),
  identityPoolId: IDENTITY_POOL_ID,
});

// DynamoDB 클라이언트 생성
const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: credentialsProvider,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

class DynamoDBCognitoManager {
  constructor() {
    // 테이블 이름 환경변수 검증
    const membersTable = process.env.NEXT_PUBLIC_DYNAMODB_MEMBERS_TABLE;
    const recordsTable = process.env.NEXT_PUBLIC_DYNAMODB_RECORDS_TABLE;
    const schedulesTable = process.env.NEXT_PUBLIC_DYNAMODB_SCHEDULES_TABLE;
    const milestonesTable = process.env.NEXT_PUBLIC_DYNAMODB_MILESTONES_TABLE;

    if (!membersTable || !recordsTable || !schedulesTable || !milestonesTable) {
      throw new Error('DynamoDB table environment variables are required');
    }

    this.tables = {
      members: membersTable,
      records: recordsTable,
      schedules: schedulesTable,
      milestones: milestonesTable
    };
  }

  /**
   * 멤버 데이터를 로드합니다
   */
  async loadMembers() {
    try {
      const command = new ScanCommand({
        TableName: this.tables.members
      });

      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error loading members:', error);
      throw error;
    }
  }

  /**
   * 기록 데이터를 로드합니다
   */
  async loadRecords() {
    try {
      const command = new ScanCommand({
        TableName: this.tables.records
      });

      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error loading records:', error);
      throw error;
    }
  }

  /**
   * 스케줄 데이터를 로드합니다
   */
  async loadSchedules() {
    try {
      const command = new ScanCommand({
        TableName: this.tables.schedules
      });

      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error loading schedules:', error);
      throw error;
    }
  }

  /**
   * 마일스톤 데이터를 로드합니다
   */
  async loadMilestones() {
    try {
      const command = new ScanCommand({
        TableName: this.tables.milestones
      });

      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error loading milestones:', error);
      
      // 권한 오류인 경우 빈 배열 반환 (임시 해결책)
      if (error.name === 'AccessDeniedException') {
        console.warn('Milestones table access denied. Returning empty array.');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * 모든 데이터를 로드합니다
   */
  async loadAllData() {
    try {
      // 각각 개별적으로 로드하여 일부 실패해도 다른 데이터는 로드되도록 함
      const results = await Promise.allSettled([
        this.loadMembers(),
        this.loadRecords(),
        this.loadSchedules(),
        this.loadMilestones()
      ]);

      const [membersResult, recordsResult, schedulesResult, milestonesResult] = results;

      return {
        members: membersResult.status === 'fulfilled' ? membersResult.value : [],
        records: recordsResult.status === 'fulfilled' ? recordsResult.value : [],
        schedules: schedulesResult.status === 'fulfilled' ? schedulesResult.value : [],
        milestones: milestonesResult.status === 'fulfilled' ? milestonesResult.value : []
      };
    } catch (error) {
      console.error('Error loading all data:', error);
      throw error;
    }
  }

  /**
   * 멤버를 추가합니다
   */
  async addMember(member) {
    try {
      const memberData = {
        id: member.id || `member_${Date.now()}`,
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        joinDate: member.joinDate || getKSTDateString(),
        createdAt: getKSTISOString(),
        updatedAt: getKSTISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.members,
        Item: memberData
      });

      await docClient.send(command);
      return memberData;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * 기록을 추가합니다
   */
  async addRecord(record) {
    try {
      const recordData = {
        id: record.id || `record_${Date.now()}`,
        memberId: record.memberId,
        date: record.date || getKSTDateString(), // KST 기준 날짜 강제 적용
        distance: record.distance,
        time: record.time,
        pace: record.pace || '',
        notes: record.notes || '',
        createdAt: getKSTISOString(),
        updatedAt: getKSTISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.records,
        Item: recordData
      });

      await docClient.send(command);
      return recordData;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  }

  /**
   * 스케줄을 추가합니다
   */
  async addSchedule(schedule) {
    try {
      const scheduleData = {
        id: schedule.id || `schedule_${Date.now()}`,
        date: schedule.date || getKSTDateString(), // KST 기준 날짜 강제 적용
        time: schedule.time || '',
        location: schedule.location || '',
        description: schedule.description || '',
        title: schedule.title || '러닝 모임',
        participants: schedule.participants || [],
        createdAt: getKSTISOString(),
        updatedAt: getKSTISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.schedules,
        Item: scheduleData
      });

      await docClient.send(command);
      return scheduleData;
    } catch (error) {
      console.error('Error adding schedule:', error);
      throw error;
    }
  }

  /**
   * 마일스톤을 추가합니다
   */
  async addMilestone(milestone) {
    try {
      const milestoneData = {
        id: milestone.id || `milestone_${Date.now()}`,
        targetKm: milestone.targetKm,
        reward: milestone.reward,
        isActive: milestone.isActive !== undefined ? milestone.isActive : true,
        createdAt: getKSTISOString(),
        updatedAt: getKSTISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.milestones,
        Item: milestoneData
      });

      await docClient.send(command);
      return milestoneData;
    } catch (error) {
      console.error('Error adding milestone:', error);
      throw error;
    }
  }

  /**
   * 멤버를 업데이트합니다
   */
  async updateMember(id, updates) {
    try {
      const command = new UpdateCommand({
        TableName: this.tables.members,
        Key: { id },
        UpdateExpression: 'SET #name = :name, email = :email, phone = :phone, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updates.name,
          ':email': updates.email || '',
          ':phone': updates.phone || '',
          ':updatedAt': getKSTISOString()
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await docClient.send(command);
      return result.Attributes;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  /**
   * 멤버를 삭제합니다
   */
  async deleteMember(id) {
    try {
      const command = new DeleteCommand({
        TableName: this.tables.members,
        Key: { id }
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  /**
   * 마일스톤을 업데이트합니다
   */
  async updateMilestone(id, updates) {
    try {
      const command = new UpdateCommand({
        TableName: this.tables.milestones,
        Key: { id },
        UpdateExpression: 'SET targetKm = :targetKm, reward = :reward, isActive = :isActive, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':targetKm': updates.targetKm,
          ':reward': updates.reward,
          ':isActive': updates.isActive,
          ':updatedAt': getKSTISOString()
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await docClient.send(command);
      return result.Attributes;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  /**
   * 마일스톤을 삭제합니다
   */
  async deleteMilestone(id) {
    try {
      const command = new DeleteCommand({
        TableName: this.tables.milestones,
        Key: { id }
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  /**
   * 연결 상태를 확인합니다
   */
  async checkConnection() {
    try {
      const command = new ScanCommand({
        TableName: this.tables.members,
        Limit: 1
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error('DynamoDB connection check failed:', error);
      return false;
    }
  }
}

export default DynamoDBCognitoManager;