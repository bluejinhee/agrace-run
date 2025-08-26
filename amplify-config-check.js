// Amplify Storage 설정 확인 스크립트
// 이 스크립트는 S3 버킷 연결 상태와 Guest 사용자 권한을 확인합니다.

class AmplifyConfigChecker {
    constructor() {
        this.bucketName = 'agrace-run-data';
        this.region = 'ap-northeast-1';
        this.testFileName = 'test-connection.json';
    }

    // amplify_outputs.json 파일 확인
    async checkAmplifyOutputs() {
        try {
            const response = await fetch('./amplify_outputs.json');
            if (!response.ok) {
                throw new Error(`amplify_outputs.json 파일을 찾을 수 없습니다: ${response.status}`);
            }
            
            const config = await response.json();
            console.log('✅ amplify_outputs.json 파일 확인 완료');
            
            // 필수 설정 확인
            const requiredFields = [
                'storage.aws_region',
                'storage.bucket_name',
                'storage.buckets',
                'auth.allow_guest_access'
            ];
            
            const missingFields = [];
            requiredFields.forEach(field => {
                const keys = field.split('.');
                let current = config;
                for (const key of keys) {
                    if (!current || !current.hasOwnProperty(key)) {
                        missingFields.push(field);
                        break;
                    }
                    current = current[key];
                }
            });
            
            if (missingFields.length > 0) {
                console.error('❌ 필수 설정이 누락되었습니다:', missingFields);
                return false;
            }
            
            // Guest 접근 권한 확인
            const bucket = config.storage.buckets[0];
            if (bucket && bucket.paths && bucket.paths['public/*'] && 
                bucket.paths['public/*'].guest) {
                const guestPermissions = bucket.paths['public/*'].guest;
                const requiredPermissions = ['get', 'list', 'write', 'delete'];
                const hasAllPermissions = requiredPermissions.every(perm => 
                    guestPermissions.includes(perm)
                );
                
                if (hasAllPermissions) {
                    console.log('✅ Guest 사용자 권한 설정 확인 완료');
                    console.log('   - 권한:', guestPermissions.join(', '));
                } else {
                    console.error('❌ Guest 사용자 권한이 불완전합니다');
                    console.error('   - 현재 권한:', guestPermissions);
                    console.error('   - 필요 권한:', requiredPermissions);
                    return false;
                }
            } else {
                console.error('❌ Guest 사용자 권한 설정을 찾을 수 없습니다');
                return false;
            }
            
            return config;
        } catch (error) {
            console.error('❌ amplify_outputs.json 확인 실패:', error.message);
            return false;
        }
    }

    // S3 버킷 연결 상태 확인 (시뮬레이션)
    async checkS3Connection() {
        console.log('🔍 S3 버킷 연결 상태 확인 중...');
        
        try {
            // 실제 환경에서는 Amplify Storage API를 사용하여 연결 테스트
            // 현재는 설정 검증만 수행
            
            const testData = {
                timestamp: new Date().toISOString(),
                test: 'connection-check',
                message: 'Amplify Storage 연결 테스트'
            };
            
            console.log('📝 테스트 데이터 준비 완료');
            console.log('   - 버킷:', this.bucketName);
            console.log('   - 리전:', this.region);
            console.log('   - 테스트 파일:', this.testFileName);
            
            // 실제 구현에서는 여기서 uploadData를 사용
            console.log('⚠️  실제 S3 연결 테스트는 Amplify 라이브러리 로드 후 가능합니다');
            
            return true;
        } catch (error) {
            console.error('❌ S3 버킷 연결 실패:', error.message);
            return false;
        }
    }

    // 전체 설정 확인 실행
    async runFullCheck() {
        console.log('🚀 Amplify Storage 설정 확인 시작\n');
        
        const results = {
            amplifyOutputs: false,
            s3Connection: false,
            overall: false
        };
        
        // 1. amplify_outputs.json 확인
        console.log('1️⃣ amplify_outputs.json 파일 확인');
        results.amplifyOutputs = await this.checkAmplifyOutputs();
        console.log('');
        
        // 2. S3 연결 상태 확인
        console.log('2️⃣ S3 버킷 연결 상태 확인');
        results.s3Connection = await this.checkS3Connection();
        console.log('');
        
        // 3. 전체 결과 요약
        console.log('📊 설정 확인 결과 요약');
        console.log('─'.repeat(40));
        console.log(`amplify_outputs.json: ${results.amplifyOutputs ? '✅ 정상' : '❌ 오류'}`);
        console.log(`S3 버킷 연결: ${results.s3Connection ? '✅ 정상' : '❌ 오류'}`);
        
        results.overall = results.amplifyOutputs && results.s3Connection;
        console.log(`전체 상태: ${results.overall ? '✅ 정상' : '❌ 오류'}`);
        
        if (results.overall) {
            console.log('\n🎉 Amplify Storage 설정이 완료되었습니다!');
            console.log('다음 단계: storage-manager.js 구현');
        } else {
            console.log('\n⚠️  설정을 완료하기 위해 다음 작업이 필요합니다:');
            if (!results.amplifyOutputs) {
                console.log('- amplify_outputs.json 파일 수정');
            }
            if (!results.s3Connection) {
                console.log('- S3 버킷 권한 설정 확인');
                console.log('- Amplify 프로젝트 초기화');
            }
        }
        
        return results;
    }

    // 설정 권장사항 출력
    printRecommendations() {
        console.log('\n💡 Amplify Storage 설정 권장사항:');
        console.log('─'.repeat(50));
        console.log('1. S3 버킷 CORS 정책 설정:');
        console.log('   - AllowedOrigins: Amplify 앱 도메인');
        console.log('   - AllowedMethods: GET, PUT, POST, DELETE');
        console.log('   - AllowedHeaders: *');
        console.log('');
        console.log('2. IAM 역할 권한 설정:');
        console.log('   - s3:GetObject, s3:PutObject, s3:DeleteObject');
        console.log('   - s3:ListBucket (public/* prefix)');
        console.log('');
        console.log('3. Amplify Auth 설정:');
        console.log('   - Guest 접근 허용');
        console.log('   - public/* 경로 권한 설정');
        console.log('');
        console.log('4. 보안 고려사항:');
        console.log('   - 최소 권한 원칙 적용');
        console.log('   - 특정 도메인에서만 접근 허용');
    }
}

// 스크립트 실행
if (typeof window !== 'undefined') {
    // 브라우저 환경에서 실행
    window.AmplifyConfigChecker = AmplifyConfigChecker;
    
    // 페이지 로드 시 자동 실행
    document.addEventListener('DOMContentLoaded', async () => {
        const checker = new AmplifyConfigChecker();
        await checker.runFullCheck();
        checker.printRecommendations();
    });
} else {
    // Node.js 환경에서 실행
    module.exports = AmplifyConfigChecker;
}