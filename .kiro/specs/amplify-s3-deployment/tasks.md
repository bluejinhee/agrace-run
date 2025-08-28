# Implementation Plan

- [x] 1. S3 버킷 설정 확인 및 구성
  - 기존 데이터 저장용 S3 버킷 확인
  - CORS 정책 설정 확인 및 업데이트
  - Amplify Auth 역할의 버킷 접근 권한 확인
  - _Requirements: 2.1, 5.3_

- [x] 2. Amplify Storage 설정 확인
  - amplify_outputs.json 파일 확인
  - S3 버킷 연결 상태 확인
  - Guest 사용자 권한 설정 확인 (public/* 경로)
  - _Requirements: 2.1, 5.1, 5.2_

- [x] 3. 기존 코드에서 Lambda 관련 파일 제거
  - lambda-function.js 파일 삭제
  - aws-config.js 파일 삭제
  - 모든 배포 스크립트 파일들 삭제
  - 기존 Lambda/API Gateway 참조 코드 정리
  - _Requirements: 7.4_

- [x] 4. Amplify Storage API 통합
  - storage-manager.js 파일 생성
  - AmplifyStorageManager 클래스 구현
  - loadData, saveData 메서드 구현
  - 초기 데이터 생성 로직 구현
  - _Requirements: 2.1, 2.5, 3.1, 4.1_

- [x] 5. 메인 스크립트 파일 업데이트
  - script.js에서 기존 AWS API 호출 제거
  - AmplifyStorageManager 사용하도록 변경
  - loadFromCloud, saveToCloud 함수 재구현
  - 오류 처리 로직 업데이트
  - _Requirements: 2.1, 3.1, 4.1, 6.2, 6.4_

- [x] 6. 관리자 페이지 스크립트 업데이트
  - admin.js에서 기존 AWS API 호출 제거
  - AmplifyStorageManager 사용하도록 변경
  - 멤버 관리 기능 S3 연동 업데이트
  - 데이터 백업/복원 기능 재구현
  - _Requirements: 2.2, 2.3_
ㅁ
- [ ] 7. HTML 파일 업데이트
  - index.html에서 aws-config.js 참조 제거
  - Amplify 라이브러리 CDN 추가
  - storage-manager.js 스크립트 추가
  - 연결 상태 표시 로직 업데이트
  - _Requirements: 6.2, 6.4_

- [ ] 8. 관리자 HTML 파일 업데이트
  - admin.html에서 aws-config.js 참조 제거
  - Amplify 라이브러리 CDN 추가
  - storage-manager.js 스크립트 추가
  - _Requirements: 2.2, 2.3_

- [ ] 9. 오류 처리 및 재시도 로직 구현
  - S3ErrorHandler 클래스 생성
  - RetryManager 클래스 생성
  - 사용자 친화적 오류 메시지 정의
  - 네트워크 오류 시 재시도 기능 구현
  - _Requirements: 6.2, 6.4, 3.4_

- [ ] 10. 데이터 마이그레이션 기능 구현
  - DataMigration 클래스 생성
  - 로컬 스토리지 데이터 감지 기능
  - S3로 데이터 마이그레이션 기능
  - 마이그레이션 완료 후 로컬 데이터 정리
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. 로딩 및 상태 표시 UI 개선
  - 데이터 로딩 중 인디케이터 표시
  - S3 연결 실패 시 오류 메시지 및 재시도 버튼
  - 데이터 저장 진행 상태 표시
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. 통합 테스트 및 검증
  - 멤버 등록/수정/삭제 기능 테스트
  - 러닝 기록 추가/조회 기능 테스트
  - 스케줄 관리 기능 테스트
  - 데이터 마이그레이션 기능 테스트
  - 오류 상황 시뮬레이션 테스트
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 7.1, 7.2_

- [ ] 13. 성능 최적화 및 모니터링 설정
  - 데이터 로딩 성능 최적화
  - 브라우저 캐싱 설정
  - 클라이언트 사이드 로깅 구현
  - 사용자 분석 설정 (선택사항)
  - _Requirements: 6.1, 6.3_

- [ ] 14. 문서 업데이트 및 정리
  - README.md 파일 업데이트 (새로운 아키텍처 반영)
  - 기존 배포 관련 문서 제거
  - 사용자 가이드 업데이트
  - _Requirements: 1.1, 1.2_