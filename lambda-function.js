const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const BUCKET_NAME = 'agrace-run-data';
const DATA_KEY = 'running-club-data.json';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // CORS preflight 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        if (event.httpMethod === 'GET') {
            // 데이터 조회
            try {
                const result = await s3.getObject({
                    Bucket: BUCKET_NAME,
                    Key: DATA_KEY
                }).promise();
                
                const data = JSON.parse(result.Body.toString());
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(data)
                };
            } catch (error) {
                if (error.code === 'NoSuchKey') {
                    // 파일이 없으면 초기 데이터 반환
                    const initialData = {
                        members: [],
                        records: [],
                        schedules: [],
                        lastUpdated: new Date().toISOString()
                    };
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify(initialData)
                    };
                }
                throw error;
            }
        }
        
        if (event.httpMethod === 'POST') {
            // 데이터 저장
            const requestBody = JSON.parse(event.body);
            
            // 데이터 유효성 검사
            if (!requestBody.members || !requestBody.records || !requestBody.schedules) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: '잘못된 데이터 형식입니다.' })
                };
            }
            
            // 타임스탬프 추가
            requestBody.lastUpdated = new Date().toISOString();
            
            // S3에 저장
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: DATA_KEY,
                Body: JSON.stringify(requestBody, null, 2),
                ContentType: 'application/json'
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    message: '데이터가 성공적으로 저장되었습니다.',
                    timestamp: requestBody.lastUpdated
                })
            };
        }
        
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: '지원하지 않는 HTTP 메서드입니다.' })
        };
        
    } catch (error) {
        console.error('Lambda 함수 오류:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '서버 오류가 발생했습니다.',
                details: error.message
            })
        };
    }
};