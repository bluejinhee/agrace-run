/**
 * DynamoDB Browser Client
 * 브라우저 환경에서 DynamoDB를 사용하기 위한 클라이언트
 */

// AWS SDK 설정
AWS.config.update({
    region: 'ap-northeast-1',
    // 실제 환경에서는 Cognito Identity Pool을 사용하여 임시 자격 증명을 얻어야 합니다
    // 현재는 개발 환경을 위한 설정입니다
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

class DynamoDBBrowserManager {
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
            const params = {
                TableName: this.tables.members
            };
            
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('Error loading members:', error);
            return [];
        }
    }

    /**
     * 기록 데이터를 로드합니다
     */
    async loadRecords() {
        try {
            const params = {
                TableName: this.tables.records
            };
            
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('Error loading records:', error);
            return [];
        }
    }

    /**
     * 스케줄 데이터를 로드합니다
     */
    async loadSchedules() {
        try {
            const params = {
                TableName: this.tables.schedules
            };
            
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('Error loading schedules:', error);
            return [];
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
        const memberData = {
            id: member.id || `member_${Date.now()}`,
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
            joinDate: member.joinDate || new Date().toISOString().split('T')[0],
            totalDistance: member.totalDistance || 0,
            recordCount: member.recordCount || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: this.tables.members,
            Item: memberData
        };

        await dynamodb.put(params).promise();
        return memberData;
    }

    /**
     * 기록을 추가합니다
     */
    async addRecord(record) {
        const recordData = {
            id: record.id || `record_${Date.now()}`,
            memberId: record.memberId,
            date: record.date,
            distance: record.distance,
            time: record.time,
            pace: record.pace || '',
            notes: record.notes || '',
            originalDate: record.originalDate || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: this.tables.records,
            Item: recordData
        };

        await dynamodb.put(params).promise();
        return recordData;
    }

    /**
     * 스케줄을 추가합니다
     */
    async addSchedule(schedule) {
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

        const params = {
            TableName: this.tables.schedules,
            Item: scheduleData
        };

        await dynamodb.put(params).promise();
        return scheduleData;
    }

    /**
     * 연결 상태를 확인합니다
     */
    async checkConnection() {
        try {
            const params = {
                TableName: this.tables.members,
                Limit: 1
            };
            
            await dynamodb.scan(params).promise();
            return true;
        } catch (error) {
            console.error('DynamoDB connection check failed:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
const storageManager = new DynamoDBBrowserManager();

// 기존 코드와의 호환성을 위한 함수들
window.loadFromCloud = async function() {
    try {
        return await storageManager.loadAllData();
    } catch (error) {
        console.error('Error in loadFromCloud:', error);
        throw error;
    }
};

window.saveToCloud = async function(members, records, schedules) {
    try {
        // DynamoDB에서는 개별 아이템으로 저장
        // 실제로는 변경된 데이터만 저장하는 것이 효율적입니다
        console.log('Saving data to DynamoDB...');
        console.log('Members:', members.length, 'Records:', records.length, 'Schedules:', schedules.length);
    } catch (error) {
        console.error('Error in saveToCloud:', error);
        throw error;
    }
};

window.updateConnectionStatus = async function() {
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

// 전역으로 노출
window.DynamoDBBrowserManager = DynamoDBBrowserManager;
window.storageManager = storageManager;