# Design Document

## Overview

큰은혜교회 러닝크루 웹사이트를 AWS Amplify와 S3를 이용한 단순하고 효율적인 아키텍처로 재설계합니다. 기존의 복잡한 Lambda/API Gateway 구조를 제거하고, Amplify 호스팅과 S3 직접 연동만을 사용하여 관리가 쉽고 비용 효율적인 시스템을 구축합니다.

## Architecture

### 현재 아키텍처 (제거 예정)
```
사용자 → S3 정적 호스팅 → API Gateway → Lambda → S3 데이터 버킷
```

### 새로운 아키텍처 (목표)
```
사용자 → Amplify 호스팅 → Amplify Storage API → S3 데이터 버킷
                    ↓
               Amplify Auth (Guest 접근)
```

### 주요 변경사항
- **제거**: Lambda 함수, API Gateway, 복잡한 배포 스크립트
- **추가**: Amplify 호스팅, Amplify Auth, Amplify Storage API
- **단순화**: Amplify Storage API를 통한 직접 S3 연동

## Components and Interfaces

### 1. Amplify 호스팅 컴포넌트

**역할**: 정적 웹사이트 호스팅 및 CI/CD 파이프라인 제공

**기능**:
- Git 저장소 연동을 통한 자동 배포
- HTTPS 자동 적용
- 커스텀 도메인 지원
- 빌드 및 배포 로그 제공

**설정**:
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Pre-build phase"
    build:
      commands:
        - echo "Build phase - no build required for static site"
    postBuild:
      commands:
        - echo "Post-build phase"
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
  cache:
    paths: []
```

### 2. S3 데이터 저장소

**버킷 구조**:
```
agrace-run-data/
├── members.json          # 멤버 데이터
├── records.json          # 러닝 기록 데이터
├── schedules.json        # 스케줄 데이터
└── backups/             # 자동 백업 폴더
    ├── members-YYYYMMDD-HHMMSS.json
    ├── records-YYYYMMDD-HHMMSS.json
    └── schedules-YYYYMMDD-HHMMSS.json
```

**CORS 설정**:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://agrace-run.amplifyapp.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 3. Amplify Storage API 통합

**Amplify Storage 사용**:
- Amplify Storage API를 통한 S3 직접 연동
- 기존 S3 버킷을 Amplify 프로젝트에 연결
- 간단한 API로 파일 업로드/다운로드

**새로운 파일**: `storage-manager.js`
```javascript
import { uploadData, downloadData, list } from 'aws-amplify/storage';

class AmplifyStorageManager {
  constructor() {
    this.bucketName = 'agrace-run-data';
    this.region = 'ap-northeast-1';
  }

  async loadData(fileName) {
    try {
      const result = await downloadData({
        path: `public/${fileName}`,
        options: {
          bucket: this.bucketName
        }
      }).result;
      
      const text = await result.body.text();
      return JSON.parse(text);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return this.getInitialData(fileName);
      }
      throw error;
    }
  }

  async saveData(fileName, data) {
    const jsonString = JSON.stringify(data, null, 2);
    
    await uploadData({
      path: `public/${fileName}`,
      data: jsonString,
      options: {
        bucket: this.bucketName,
        contentType: 'application/json'
      }
    }).result;
  }

  getInitialData(fileName) {
    const initialData = {
      members: [],
      records: [],
      schedules: [],
      lastUpdated: new Date().toISOString()
    };
    
    switch (fileName) {
      case 'members.json':
        return { members: [], lastUpdated: initialData.lastUpdated };
      case 'records.json':
        return { records: [], lastUpdated: initialData.lastUpdated };
      case 'schedules.json':
        return { schedules: [], lastUpdated: initialData.lastUpdated };
      default:
        return initialData;
    }
  }
}
```

### 4. Amplify Auth 설정

**Guest 사용자 접근 허용**:
- 인증 없이도 데이터 읽기/쓰기 가능
- public/* 경로에 대한 guest 권한 설정

**amplify/backend.ts 설정**:
```typescript
import { defineBackend } from "@aws-amplify/backend";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { auth } from "./auth/resource";

const backend = defineBackend({
  auth,
});

const customBucketStack = backend.createStack("agrace-run-bucket-stack");

// 기존 S3 버킷 가져오기
const customBucket = Bucket.fromBucketAttributes(customBucketStack, "AgraceRunBucket", {
  bucketArn: "arn:aws:s3:::agrace-run-data",
  region: "ap-northeast-1"
});

backend.addOutput({
  storage: {
    aws_region: customBucket.env.region,
    bucket_name: customBucket.bucketName,
    buckets: [
      {
        aws_region: customBucket.env.region,
        bucket_name: customBucket.bucketName,
        name: customBucket.bucketName,
        paths: {
          "public/*": {
            guest: ["get", "list", "write", "delete"],
          },
        },
      }
    ],
  },
});

// Guest 사용자를 위한 IAM 정책
const unauthPolicy = new Policy(backend.stack, "agraceRunUnauthPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [`${customBucket.bucketArn}/public/*`],
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:ListBucket"],
      resources: [customBucket.bucketArn],
      conditions: {
        StringLike: {
          "s3:prefix": ["public/", "public/*"],
        },
      },
    }),
  ],
});

// 정책을 unauthenticated 역할에 연결
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  unauthPolicy,
);
```

**S3 버킷 정책**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmplifyGuestAccess",
      "Principal": { 
        "AWS": "arn:aws:iam::<AWS-account-ID>:role/<amplify-unauth-role-name>" 
      },
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::agrace-run-data",
        "arn:aws:s3:::agrace-run-data/public/*"
      ]
    }
  ]
}
```

## Data Models

### 기존 데이터 모델 유지
현재 사용 중인 데이터 구조를 그대로 유지하여 호환성 보장:

```javascript
// members.json
{
  "members": [
    {
      "id": 1,
      "name": "홍길동",
      "totalDistance": 25.5,
      "recordCount": 8,
      "joinDate": "2024-01-15"
    }
  ],
  "lastUpdated": "2024-01-20T10:30:00Z"
}

// records.json
{
  "records": [
    {
      "id": 1234567890,
      "memberId": 1,
      "distance": 5.2,
      "pace": "5:30",
      "date": "2024-01-20",
      "time": "오전 9:30:00",
      "originalDate": "2024-01-20"
    }
  ],
  "lastUpdated": "2024-01-20T10:30:00Z"
}

// schedules.json
{
  "schedules": [
    {
      "id": 1,
      "date": "2024-01-21",
      "time": "07:00",
      "location": "한강공원",
      "description": "주일 모닝런"
    }
  ],
  "lastUpdated": "2024-01-20T10:30:00Z"
}
```

## Error Handling

### 1. S3 연결 오류 처리
```javascript
class S3ErrorHandler {
  static async handleS3Error(error, operation) {
    switch (error.name) {
      case 'NoSuchKey':
        return this.handleMissingFile(operation);
      case 'AccessDenied':
        return this.handleAccessDenied();
      case 'NetworkError':
        return this.handleNetworkError();
      default:
        return this.handleGenericError(error);
    }
  }

  static handleMissingFile(operation) {
    if (operation === 'load') {
      return { success: true, data: this.getInitialData() };
    }
    throw new Error('파일을 찾을 수 없습니다.');
  }

  static handleAccessDenied() {
    throw new Error('S3 접근 권한이 없습니다. 관리자에게 문의하세요.');
  }

  static handleNetworkError() {
    throw new Error('네트워크 연결을 확인해주세요.');
  }
}
```

### 2. 사용자 친화적 오류 메시지
```javascript
const ERROR_MESSAGES = {
  'S3_CONNECTION_FAILED': '클라우드 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
  'DATA_SAVE_FAILED': '데이터 저장에 실패했습니다. 다시 시도해주세요.',
  'DATA_LOAD_FAILED': '데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.',
  'INVALID_DATA_FORMAT': '잘못된 데이터 형식입니다.',
  'NETWORK_ERROR': '인터넷 연결을 확인해주세요.'
};
```

### 3. 재시도 메커니즘
```javascript
class RetryManager {
  static async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(delay * Math.pow(2, i)); // 지수 백오프
      }
    }
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Testing Strategy

### 1. 단위 테스트
- S3 데이터 매니저 클래스 테스트
- 오류 처리 로직 테스트
- 데이터 변환 함수 테스트

### 2. 통합 테스트
- S3 연결 및 데이터 CRUD 테스트
- Amplify 배포 파이프라인 테스트
- 브라우저 호환성 테스트

### 3. E2E 테스트
- 사용자 시나리오 기반 테스트
- 멤버 등록 → 기록 입력 → 데이터 조회 플로우
- 오류 상황 시뮬레이션

### 4. 성능 테스트
- S3 응답 시간 측정
- 대용량 데이터 처리 테스트
- 동시 사용자 접근 테스트

## Security Considerations

### 1. 최소 권한 원칙
- S3 버킷에 대한 읽기/쓰기 권한만 부여
- 특정 파일 패턴에 대해서만 접근 허용

### 2. CORS 보안
- 특정 도메인에서만 접근 허용
- 필요한 HTTP 메서드만 허용

### 3. 데이터 검증
- 클라이언트 사이드 데이터 유효성 검사
- 악의적인 데이터 입력 방지

### 4. 백업 전략
- 자동 백업 시스템 구현
- 버전 관리를 통한 데이터 복구 지원

## Migration Strategy

### 1. 기존 데이터 마이그레이션
```javascript
class DataMigration {
  static async migrateFromLocalStorage() {
    const localData = this.getLocalStorageData();
    if (localData.members.length > 0) {
      await this.uploadToS3(localData);
      this.clearLocalStorage();
    }
  }

  static async migrateFromLambda() {
    // 기존 Lambda API에서 데이터 가져오기
    const lambdaData = await this.fetchFromLambdaAPI();
    await this.uploadToS3(lambdaData);
  }
}
```

### 2. 점진적 전환
1. **1단계**: Amplify 호스팅 설정 및 S3 연동 구현
2. **2단계**: 기존 데이터 마이그레이션
3. **3단계**: Lambda/API Gateway 제거
4. **4단계**: 모니터링 및 최적화

### 3. 롤백 계획
- 기존 Lambda 시스템 일시적 유지
- 문제 발생 시 즉시 이전 버전으로 복구
- 데이터 백업을 통한 안전장치 마련

## Performance Optimization

### 1. 캐싱 전략
- 브라우저 캐시 활용
- 자주 변경되지 않는 데이터 로컬 캐싱

### 2. 데이터 압축
- JSON 데이터 gzip 압축
- 불필요한 데이터 필드 제거

### 3. 지연 로딩
- 필요한 데이터만 선택적 로드
- 페이지네이션 구현 (대용량 데이터 대비)

## Monitoring and Logging

### 1. 클라이언트 사이드 로깅
```javascript
class Logger {
  static log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent
    };
    
    // 로컬 저장 및 필요시 S3 업로드
    this.storeLog(logEntry);
  }
}
```

### 2. 성능 모니터링
- S3 API 호출 시간 측정
- 사용자 액션별 응답 시간 추적
- 오류 발생률 모니터링

### 3. 사용자 분석
- 기능 사용 패턴 분석
- 오류 발생 빈도 추적
- 성능 병목 지점 식별