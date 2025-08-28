/**
 * DynamoDB Cognito Client
 * Cognito Identity Pool을 사용하여 브라우저에서 안전하게 DynamoDB에 접근
 */

import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Cognito Identity Pool 설정
const IDENTITY_POOL_ID = 'ap-northeast-1:bedcbab1-5b3e-4426-b376-e65a251fca51';
const REGION = 'ap-northeast-1';

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
    this.tables = {
      members: 'RunningClub-Members',
      records: 'RunningClub-Records',
      schedules: 'RunningClub-Schedules'
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
   * 모든 데이터를 로드합니다
   */
  async loadAllData() {
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
   * 멤버를 추가합니다
   */
  async addMember(member) {
    try {
      const memberData = {
        id: member.id || `member_${Date.now()}`,
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        joinDate: member.joinDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        date: record.date,
        distance: record.distance,
        time: record.time,
        pace: record.pace || '',
        notes: record.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        date: schedule.date,
        time: schedule.time || '',
        location: schedule.location || '',
        description: schedule.description || '',
        title: schedule.title || '러닝 모임',
        participants: schedule.participants || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
          ':updatedAt': new Date().toISOString()
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