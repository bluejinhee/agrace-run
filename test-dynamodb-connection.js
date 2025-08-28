#!/usr/bin/env node

/**
 * DynamoDB 연결 테스트 스크립트
 * AWS DynamoDB 연결 상태와 테이블 상태를 확인합니다
 */

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

class DynamoDBTester {
    constructor() {
        this.region = 'ap-northeast-1';
        this.client = new DynamoDBClient({ region: this.region });
        this.docClient = DynamoDBDocumentClient.from(this.client);
        
        this.tables = {
            members: 'RunningClub-Members',
            records: 'RunningClub-Records',
            schedules: 'RunningClub-Schedules'
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const symbols = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🧪'
        };
        console.log(`[${timestamp}] ${symbols[type]} ${message}`);
    }

    async testAWSCredentials() {
        this.log('AWS 자격 증명 확인 중...', 'test');
        try {
            const command = new ListTablesCommand({});
            await this.client.send(command);
            this.log('AWS 자격 증명 확인 완료', 'success');
            return true;
        } catch (error) {
            this.log(`AWS 자격 증명 오류: ${error.message}`, 'error');
            return false;
        }
    }

    async testDynamoDBService() {
        this.log('DynamoDB 서비스 연결 확인 중...', 'test');
        try {
            const command = new ListTablesCommand({});
            const response = await this.client.send(command);
            this.log(`DynamoDB 서비스 연결 성공 (총 ${response.TableNames.length}개 테이블 발견)`, 'success');
            return response.TableNames;
        } catch (error) {
            this.log(`DynamoDB 서비스 연결 실패: ${error.message}`, 'error');
            return null;
        }
    }

    async testTableExists(tableName) {
        this.log(`테이블 '${tableName}' 존재 여부 확인 중...`, 'test');
        try {
            const command = new ScanCommand({
                TableName: tableName,
                Limit: 1
            });
            await this.docClient.send(command);
            this.log(`테이블 '${tableName}' 존재 확인`, 'success');
            return true;
        } catch (error) {
            if (error.name === 'ResourceNotFoundException') {
                this.log(`테이블 '${tableName}' 존재하지 않음`, 'error');
            } else {
                this.log(`테이블 '${tableName}' 확인 중 오류: ${error.message}`, 'error');
            }
            return false;
        }
    }

    async testTableReadWrite(tableName) {
        this.log(`테이블 '${tableName}' 읽기/쓰기 테스트 중...`, 'test');
        
        const testId = `test_${Date.now()}`;
        const testItem = {
            id: testId,
            testField: 'DynamoDB 연결 테스트',
            timestamp: new Date().toISOString()
        };

        try {
            // 쓰기 테스트
            const putCommand = new PutCommand({
                TableName: tableName,
                Item: testItem
            });
            await this.docClient.send(putCommand);
            this.log(`테이블 '${tableName}' 쓰기 성공`, 'success');

            // 읽기 테스트
            const scanCommand = new ScanCommand({
                TableName: tableName,
                FilterExpression: 'id = :testId',
                ExpressionAttributeValues: {
                    ':testId': testId
                },
                Limit: 1
            });
            const scanResult = await this.docClient.send(scanCommand);
            
            if (scanResult.Items && scanResult.Items.length > 0) {
                this.log(`테이블 '${tableName}' 읽기 성공`, 'success');
            } else {
                this.log(`테이블 '${tableName}' 읽기 실패: 데이터를 찾을 수 없음`, 'warning');
            }

            // 테스트 데이터 삭제
            const deleteCommand = new DeleteCommand({
                TableName: tableName,
                Key: { id: testId }
            });
            await this.docClient.send(deleteCommand);
            this.log(`테스트 데이터 정리 완료`, 'info');

            return true;
        } catch (error) {
            this.log(`테이블 '${tableName}' 읽기/쓰기 테스트 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async getTableStats(tableName) {
        this.log(`테이블 '${tableName}' 통계 조회 중...`, 'test');
        try {
            const command = new ScanCommand({
                TableName: tableName,
                Select: 'COUNT'
            });
            const response = await this.docClient.send(command);
            this.log(`테이블 '${tableName}': ${response.Count}개 아이템`, 'info');
            return response.Count;
        } catch (error) {
            this.log(`테이블 '${tableName}' 통계 조회 실패: ${error.message}`, 'error');
            return 0;
        }
    }

    async runFullTest() {
        console.log('\n🚀 DynamoDB 연결 테스트 시작\n');
        console.log('='.repeat(50));

        let allTestsPassed = true;

        // 1. AWS 자격 증명 테스트
        console.log('\n📋 1단계: AWS 자격 증명 확인');
        const credentialsOk = await this.testAWSCredentials();
        if (!credentialsOk) {
            console.log('\n❌ 테스트 중단: AWS 자격 증명 문제');
            return false;
        }

        // 2. DynamoDB 서비스 연결 테스트
        console.log('\n📋 2단계: DynamoDB 서비스 연결');
        const tableNames = await this.testDynamoDBService();
        if (!tableNames) {
            console.log('\n❌ 테스트 중단: DynamoDB 서비스 연결 실패');
            return false;
        }

        // 3. 필요한 테이블 존재 여부 확인
        console.log('\n📋 3단계: 필요한 테이블 존재 여부 확인');
        for (const [key, tableName] of Object.entries(this.tables)) {
            const exists = await this.testTableExists(tableName);
            if (!exists) {
                allTestsPassed = false;
            }
        }

        // 4. 테이블 읽기/쓰기 테스트 (존재하는 테이블만)
        console.log('\n📋 4단계: 테이블 읽기/쓰기 테스트');
        for (const [key, tableName] of Object.entries(this.tables)) {
            const exists = await this.testTableExists(tableName);
            if (exists) {
                const rwTest = await this.testTableReadWrite(tableName);
                if (!rwTest) {
                    allTestsPassed = false;
                }
            }
        }

        // 5. 테이블 통계 조회
        console.log('\n📋 5단계: 테이블 통계 조회');
        for (const [key, tableName] of Object.entries(this.tables)) {
            const exists = await this.testTableExists(tableName);
            if (exists) {
                await this.getTableStats(tableName);
            }
        }

        // 결과 요약
        console.log('\n' + '='.repeat(50));
        if (allTestsPassed) {
            this.log('모든 테스트 통과! DynamoDB 연결이 정상적으로 작동합니다.', 'success');
        } else {
            this.log('일부 테스트 실패. 위의 오류 메시지를 확인해주세요.', 'warning');
        }
        console.log('='.repeat(50) + '\n');

        return allTestsPassed;
    }

    async quickTest() {
        console.log('\n⚡ DynamoDB 빠른 연결 테스트\n');
        
        const credentialsOk = await this.testAWSCredentials();
        if (!credentialsOk) return false;

        const serviceOk = await this.testDynamoDBService();
        if (!serviceOk) return false;

        this.log('기본 연결 테스트 완료!', 'success');
        return true;
    }
}

// CLI 실행 부분
async function main() {
    const tester = new DynamoDBTester();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'full';

    try {
        switch (command) {
            case 'quick':
                await tester.quickTest();
                break;
            case 'full':
            default:
                await tester.runFullTest();
                break;
        }
    } catch (error) {
        console.error('\n❌ 테스트 실행 중 오류 발생:', error.message);
        process.exit(1);
    }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default DynamoDBTester;