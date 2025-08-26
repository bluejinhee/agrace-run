/**
 * Amplify Storage Manager (v5 compatible)
 * S3 버킷과의 데이터 통신을 관리하는 클래스
 * Requirements: 2.1, 2.5, 3.1, 4.1
 */

class AmplifyStorageManager {
    constructor() {
        this.bucketName = 'agrace-run-data';
        this.region = 'ap-northeast-1';
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1초
    }

    /**
     * S3에서 데이터 파일을 로드합니다
     * @param {string} fileName - 로드할 파일명 (members.json, records.json, schedules.json)
     * @returns {Promise<Object>} 파싱된 JSON 데이터
     */
    async loadData(fileName) {
        try {
            console.log(`Loading data from S3: ${fileName}`);
            
            const result = await window.aws_amplify.Storage.get(fileName, {
                download: true,
                bucket: this.bucketName
            });
            
            const text = await result.Body.text();
            const data = JSON.parse(text);
            
            console.log(`Successfully loaded ${fileName}:`, data);
            return data;
            
        } catch (error) {
            console.log(`File ${fileName} not found or error occurred:`, error);
            
            // NoSuchKey 오류인 경우 초기 데이터 반환
            if (error.code === 'NoSuchKey' || error.message?.includes('NoSuchKey')) {
                console.log(`Creating initial data for ${fileName}`);
                const initialData = this.getInitialData(fileName);
                
                // 초기 데이터를 S3에 저장
                await this.saveData(fileName, initialData);
                return initialData;
            }
            
            // 다른 오류인 경우 재시도 또는 에러 처리
            throw this.handleStorageError(error, 'load', fileName);
        }
    }

    /**
     * S3에 데이터 파일을 저장합니다
     * @param {string} fileName - 저장할 파일명
     * @param {Object} data - 저장할 데이터 객체
     * @returns {Promise<void>}
     */
    async saveData(fileName, data) {
        try {
            console.log(`Saving data to S3: ${fileName}`, data);
            
            // lastUpdated 필드 추가
            const dataWithTimestamp = {
                ...data,
                lastUpdated: new Date().toISOString()
            };
            
            const jsonString = JSON.stringify(dataWithTimestamp, null, 2);
            
            await window.aws_amplify.Storage.put(fileName, jsonString, {
                contentType: 'application/json',
                bucket: this.bucketName
            });
            
            console.log(`Successfully saved ${fileName} to S3`);
            
        } catch (error) {
            console.error(`Error saving ${fileName} to S3:`, error);
            throw this.handleStorageError(error, 'save', fileName);
        }
    }

    /**
     * 파일명에 따른 초기 데이터를 생성합니다
     * @param {string} fileName - 파일명
     * @returns {Object} 초기 데이터 객체
     */
    getInitialData(fileName) {
        const timestamp = new Date().toISOString();
        
        switch (fileName) {
            case 'members.json':
                return {
                    members: [],
                    lastUpdated: timestamp
                };
                
            case 'records.json':
                return {
                    records: [],
                    lastUpdated: timestamp
                };
                
            case 'schedules.json':
                return {
                    schedules: [],
                    lastUpdated: timestamp
                };
                
            default:
                return {
                    members: [],
                    records: [],
                    schedules: [],
                    lastUpdated: timestamp
                };
        }
    }

    /**
     * 멤버 데이터를 로드합니다
     * @returns {Promise<Array>} 멤버 배열
     */
    async loadMembers() {
        const data = await this.loadData('members.json');
        return data.members || [];
    }

    /**
     * 멤버 데이터를 저장합니다
     * @param {Array} members - 멤버 배열
     * @returns {Promise<void>}
     */
    async saveMembers(members) {
        await this.saveData('members.json', { members });
    }

    /**
     * 기록 데이터를 로드합니다
     * @returns {Promise<Array>} 기록 배열
     */
    async loadRecords() {
        const data = await this.loadData('records.json');
        return data.records || [];
    }

    /**
     * 기록 데이터를 저장합니다
     * @param {Array} records - 기록 배열
     * @returns {Promise<void>}
     */
    async saveRecords(records) {
        await this.saveData('records.json', { records });
    }

    /**
     * 스케줄 데이터를 로드합니다
     * @returns {Promise<Array>} 스케줄 배열
     */
    async loadSchedules() {
        const data = await this.loadData('schedules.json');
        return data.schedules || [];
    }

    /**
     * 스케줄 데이터를 저장합니다
     * @param {Array} schedules - 스케줄 배열
     * @returns {Promise<void>}
     */
    async saveSchedules(schedules) {
        await this.saveData('schedules.json', { schedules });
    }

    /**
     * 모든 데이터를 한 번에 로드합니다
     * @returns {Promise<Object>} 모든 데이터를 포함한 객체
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
     * 모든 데이터를 한 번에 저장합니다
     * @param {Array} members - 멤버 배열
     * @param {Array} records - 기록 배열
     * @param {Array} schedules - 스케줄 배열
     * @returns {Promise<void>}
     */
    async saveAllData(members, records, schedules) {
        try {
            await Promise.all([
                this.saveMembers(members),
                this.saveRecords(records),
                this.saveSchedules(schedules)
            ]);
            
            console.log('All data saved successfully');
        } catch (error) {
            console.error('Error saving all data:', error);
            throw error;
        }
    }

    /**
     * S3 연결 상태를 확인합니다
     * @returns {Promise<boolean>} 연결 상태
     */
    async checkConnection() {
        try {
            // 간단한 list 작업으로 연결 상태 확인
            await window.aws_amplify.Storage.list('', {
                bucket: this.bucketName,
                pageSize: 1
            });
            
            return true;
        } catch (error) {
            console.error('S3 connection check failed:', error);
            return false;
        }
    }

    /**
     * 스토리지 오류를 처리합니다
     * @param {Error} error - 발생한 오류
     * @param {string} operation - 수행 중이던 작업 (load/save)
     * @param {string} fileName - 관련 파일명
     * @returns {Error} 처리된 오류
     */
    handleStorageError(error, operation, fileName) {
        let userMessage = '';
        
        switch (error.code || error.name) {
            case 'NoSuchKey':
                userMessage = `파일을 찾을 수 없습니다: ${fileName}`;
                break;
                
            case 'AccessDenied':
                userMessage = 'S3 접근 권한이 없습니다. 관리자에게 문의하세요.';
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
        enhancedError.originalError = error;
        enhancedError.operation = operation;
        enhancedError.fileName = fileName;
        
        return enhancedError;
    }

    /**
     * 재시도 로직과 함께 작업을 실행합니다
     * @param {Function} operation - 실행할 작업 함수
     * @param {number} maxRetries - 최대 재시도 횟수
     * @returns {Promise<any>} 작업 결과
     */
    async withRetry(operation, maxRetries = this.retryAttempts) {
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
    }

    /**
     * 지정된 시간만큼 대기합니다
     * @param {number} ms - 대기 시간 (밀리초)
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 전역 인스턴스 생성
const storageManager = new AmplifyStorageManager();

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
        await storageManager.saveAllData(members, records, schedules);
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
            statusElement.textContent = isConnected ? '✅ S3 연결됨' : '❌ S3 연결 실패';
            statusElement.className = isConnected ? 'connected' : 'disconnected';
        }
        
        return isConnected;
    } catch (error) {
        console.error('Error checking connection status:', error);
        return false;
    }
};

// AmplifyStorageManager 클래스를 전역으로 노출
window.AmplifyStorageManager = AmplifyStorageManager;
window.storageManager = storageManager;