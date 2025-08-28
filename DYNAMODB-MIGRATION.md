# DynamoDB 마이그레이션 가이드

## 개요
이 프로젝트는 AWS Amplify Storage (S3)에서 DynamoDB로 마이그레이션되었습니다.

## 변경 사항

### 제거된 파일들
- `storage-manager.js` - Amplify Storage 관리자
- `storage-manager-v5.js` - Amplify Storage v5 호환 버전
- `amplify-test.html` - Amplify 테스트 페이지
- `amplify-config-check.js` - Amplify 설정 확인 스크립트
- `amplify-storage-verification-report.md` - Amplify 검증 리포트
- `bucket-policy.json` - S3 버킷 정책
- `lib/amplify.ts` - Amplify 서버 설정
- `lib/amplify-client.ts` - Amplify 클라이언트 설정

### 추가된 파일들
- `lib/dynamodb-storage.js` - DynamoDB 스토리지 관리자 (Node.js용)
- `lib/dynamodb-client.ts` - DynamoDB 클라이언트 설정
- `lib/dynamodb-browser.js` - DynamoDB 브라우저 클라이언트

### 수정된 파일들
- `package.json` - Amplify 의존성 제거, DynamoDB 의존성 추가
- `amplify_outputs.json` - Storage 섹션 제거, DynamoDB 설정 유지
- `lib/storage.ts` - DynamoDB 사용하도록 완전 재작성
- `index.html` - Amplify 스크립트를 AWS SDK로 교체
- `admin.html` - Amplify 스크립트를 AWS SDK로 교체
- `admin.js` - 백업/복원 로직을 로컬 파일 기반으로 변경
- `script.js` - 로그 메시지 업데이트

## DynamoDB 테이블 구조

### RunningClub-Members
- `id` (String) - Primary Key
- `name` (String) - 멤버 이름
- `email` (String) - 이메일 (선택사항)
- `phone` (String) - 전화번호 (선택사항)
- `joinDate` (String) - 가입일 (YYYY-MM-DD)
- `totalDistance` (Number) - 총 거리
- `recordCount` (Number) - 기록 수
- `createdAt` (String) - 생성일시
- `updatedAt` (String) - 수정일시

### RunningClub-Records
- `id` (String) - Primary Key
- `memberId` (String) - 멤버 ID
- `date` (String) - 기록 날짜 (YYYY-MM-DD)
- `distance` (Number) - 거리 (km)
- `time` (String) - 시간
- `pace` (String) - 페이스 (선택사항)
- `notes` (String) - 메모 (선택사항)
- `originalDate` (String) - 원본 날짜시간
- `createdAt` (String) - 생성일시
- `updatedAt` (String) - 수정일시

**GSI: memberId-date-index**
- Partition Key: `memberId`
- Sort Key: `date`

### RunningClub-Schedules
- `id` (String) - Primary Key
- `date` (String) - 스케줄 날짜 (YYYY-MM-DD)
- `time` (String) - 시간 (선택사항)
- `title` (String) - 제목
- `description` (String) - 설명 (선택사항)
- `location` (String) - 장소 (선택사항)
- `participants` (List) - 참가자 목록
- `createdAt` (String) - 생성일시
- `updatedAt` (String) - 수정일시

**GSI: date-index**
- Partition Key: `date`

## 설정 방법

### 1. DynamoDB 테이블 생성
```bash
npm run create-tables
```

### 2. DynamoDB 연결 확인
```bash
npm run verify-dynamodb
```

### 3. AWS 자격 증명 설정
브라우저 환경에서 DynamoDB를 사용하려면 AWS Cognito Identity Pool을 설정해야 합니다.

#### 개발 환경 (임시)
현재 `lib/dynamodb-browser.js`에서는 개발 환경을 위한 기본 설정을 사용합니다.

#### 프로덕션 환경
1. AWS Cognito Identity Pool 생성
2. DynamoDB 테이블에 대한 읽기/쓰기 권한 부여
3. `lib/dynamodb-browser.js`에서 Cognito 설정 추가

## 주요 변경점

### 백업/복원 기능
- **이전**: S3 버킷에 백업 파일 저장
- **현재**: 로컬 JSON 파일로 백업 다운로드/업로드

### 데이터 저장 방식
- **이전**: JSON 파일 단위로 저장 (members.json, records.json, schedules.json)
- **현재**: 개별 아이템 단위로 DynamoDB 테이블에 저장

### 연결 상태 표시
- **이전**: "S3 연결됨/실패"
- **현재**: "DynamoDB 연결됨/실패"

## 마이그레이션 후 확인사항

1. ✅ Amplify 관련 파일 제거 완료
2. ✅ DynamoDB 클라이언트 설정 완료
3. ✅ 테이블 구조 정의 완료
4. ✅ 브라우저 호환성 스크립트 생성 완료
5. ✅ 백업/복원 로직 변경 완료
6. ⚠️ AWS 자격 증명 설정 필요 (프로덕션 환경)
7. ⚠️ Cognito Identity Pool 설정 필요 (브라우저 접근용)

## 다음 단계

1. AWS Cognito Identity Pool 설정
2. 프로덕션 환경에서 DynamoDB 권한 설정
3. 기존 S3 데이터를 DynamoDB로 마이그레이션 (필요시)
4. 성능 최적화 및 모니터링 설정