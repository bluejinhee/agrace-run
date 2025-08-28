/**
 * DynamoDB Storage Manager
 * DynamoDB와의 데이터 통신을 관리하는 클래스
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand
} from "@aws-sdk/lib-dynamodb";

class DynamoDBStorageManager {
    constructor() {
        this.region = 'ap-northeast-1';
        this.client = new DynamoDBClient({ region: this.region });
        this.docClient = DynamoDBDocumentClient.from(this.client);

        this.tables = {
            members: 'RunningClub-Members',
            records: 'RunningClub-Records',
            schedules: 'RunningClub-Schedules',
            milestones: 'RunningClub-Milestones'
        };
    }

    /**
     * 멤버 데이터를 로드합니다
     * @returns {Promise<Array>} 멤버 배열
     */
    async loadMembers() {
        try {
            const command = new ScanCommand({
                TableName: this.tables.members
            });

            const response = await this.docClient.send(command);
            return response.Items || [];
        } catch (error) {
            console.error('Error loading members:', error);
            return [];
        }
    }

    /**
     * 새 멤버를 추가합니다
     * @param {Object} member - 멤버 데이터
     * @returns {Promise<void>}
     */
    async addMember(member) {
        const memberData = {
            id: member.id || `member_${Date.now()}`,
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
     * @param {string} memberId - 멤버 ID
     * @param {Object} updates - 업데이트할 데이터
     * @returns {Promise<void>}
     */
    async updateMember(memberId, updates) {
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
     * 기록 데이터를 로드합니다
     * @returns {Promise<Array>} 기록 배열
     */
    async loadRecords() {
        try {
            const command = new ScanCommand({
                TableName: this.tables.records
            });

            const response = await this.docClient.send(command);
            return response.Items || [];
        } catch (error) {
            console.error('Error loading records:', error);
            return [];
        }
    }

    /**
     * 특정 멤버의 기록을 로드합니다
     * @param {string} memberId - 멤버 ID
     * @returns {Promise<Array>} 해당 멤버의 기록 배열
     */
    async loadMemberRecords(memberId) {
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
            return response.Items || [];
        } catch (error) {
            console.error('Error loading member records:', error);
            return [];
        }
    }

    /**
     * 새 기록을 추가합니다
     * @param {Object} record - 기록 데이터
     * @returns {Promise<void>}
     */
    async addRecord(record) {
        const recordData = {
            id: record.id || `record_${Date.now()}`,
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
     * 스케줄 데이터를 로드합니다
     * @returns {Promise<Array>} 스케줄 배열
     */
    async loadSchedules() {
        try {
            const command = new ScanCommand({
                TableName: this.tables.schedules
            });

            const response = await this.docClient.send(command);
            return response.Items || [];
        } catch (error) {
            console.error('Error loading schedules:', error);
            return [];
        }
    }

    /**
     * 특정 날짜의 스케줄을 로드합니다
     * @param {string} date - 날짜 (YYYY-MM-DD 형식)
     * @returns {Promise<Array>} 해당 날짜의 스케줄 배열
     */
    async loadSchedulesByDate(date) {
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
            return response.Items || [];
        } catch (error) {
            console.error('Error loading schedules by date:', error);
            return [];
        }
    }

    /**
     * 새 스케줄을 추가합니다
     * @param {Object} schedule - 스케줄 데이터
     * @returns {Promise<void>}
     */
    async addSchedule(schedule) {
        const scheduleData = {
            id: schedule.id || `schedule_${Date.now()}`,
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
     * 마일스톤 데이터를 로드합니다
     * @returns {Promise<Array>} 마일스톤 배열
     */
    async loadMilestones() {
        try {
            const command = new ScanCommand({
                TableName: this.tables.milestones
            });

            const response = await this.docClient.send(command);
            return response.Items || [];
        } catch (error) {
            console.error('Error loading milestones:', error);
            return [];
        }
    }

    /**
     * 새 마일스톤을 추가합니다
     * @param {Object} milestone - 마일스톤 데이터
     * @returns {Promise<void>}
     */
    async addMilestone(milestone) {
        const milestoneData = {
            id: milestone.id || `milestone_${Date.now()}`,
            targetKm: milestone.targetKm,
            reward: milestone.reward,
            isActive: milestone.isActive !== undefined ? milestone.isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tables.milestones,
            Item: milestoneData
        });

        await this.docClient.send(command);
        return milestoneData;
    }

    /**
     * 마일스톤을 업데이트합니다
     * @param {string} milestoneId - 마일스톤 ID
     * @param {Object} updates - 업데이트할 데이터
     * @returns {Promise<void>}
     */
    async updateMilestone(milestoneId, updates) {
        const command = new UpdateCommand({
            TableName: this.tables.milestones,
            Key: { id: milestoneId },
            UpdateExpression: 'SET targetKm = :targetKm, reward = :reward, isActive = :isActive, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':targetKm': updates.targetKm,
                ':reward': updates.reward,
                ':isActive': updates.isActive,
                ':updatedAt': new Date().toISOString()
            }
        });

        await this.docClient.send(command);
    }

    /**
     * 마일스톤을 삭제합니다
     * @param {string} milestoneId - 마일스톤 ID
     * @returns {Promise<void>}
     */
    async deleteMilestone(milestoneId) {
        const command = new DeleteCommand({
            TableName: this.tables.milestones,
            Key: { id: milestoneId }
        });

        await this.docClient.send(command);
    }

    /**
     * 모든 데이터를 한 번에 로드합니다
     * @returns {Promise<Object>} 모든 데이터를 포함한 객체
     */
    async loadAllData() {
        try {
            const [members, records, schedules, milestones] = await Promise.all([
                this.loadMembers(),
                this.loadRecords(),
                this.loadSchedules(),
                this.loadMilestones()
            ]);

            return {
                members,
                records,
                schedules,
                milestones
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            throw error;
        }
    }

    /**
     * 연결 상태를 확인합니다
     * @returns {Promise<boolean>} 연결 상태
     */
    async checkConnection() {
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
     * @returns {Promise<Object>} 통계 데이터
     */
    async getStats() {
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
                sum + (parseFloat(record.distance) || 0), 0
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
}

export default DynamoDBStorageManager;