/**
 * IAM 정책 업데이트 스크립트
 * RunningClub-Milestones 테이블에 대한 권한을 추가합니다.
 */

const { IAMClient, PutRolePolicyCommand, GetRolePolicyCommand } = require("@aws-sdk/client-iam");
const fs = require('fs');
const path = require('path');

// IAM 클라이언트 생성
const iamClient = new IAMClient({ region: 'ap-northeast-1' });

// Cognito Identity Pool의 역할 이름 (실제 환경에 맞게 수정 필요)
const ROLE_NAME = 'AmazonDynamoDBCoginito'; // 오타가 있는 것 같지만 실제 역할 이름 확인 필요
const POLICY_NAME = 'DynamoDBRunningClubPolicy';

async function updateIAMPolicy() {
  try {
    console.log('🔍 현재 IAM 정책 확인 중...');
    
    // 현재 정책 확인
    try {
      const getCurrentPolicy = new GetRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyName: POLICY_NAME
      });
      
      const currentPolicy = await iamClient.send(getCurrentPolicy);
      console.log('📋 현재 정책:', JSON.stringify(JSON.parse(decodeURIComponent(currentPolicy.PolicyDocument)), null, 2));
    } catch (error) {
      console.log('⚠️ 기존 정책을 찾을 수 없습니다. 새로 생성합니다.');
    }

    // 새 정책 읽기
    const policyPath = path.join(__dirname, 'legacy', 'dynamodb-iam-policy.json');
    const newPolicy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    
    console.log('📝 새 정책 적용 중...');
    console.log(JSON.stringify(newPolicy, null, 2));

    // 정책 업데이트
    const putPolicyCommand = new PutRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyName: POLICY_NAME,
      PolicyDocument: JSON.stringify(newPolicy)
    });

    await iamClient.send(putPolicyCommand);
    
    console.log('✅ IAM 정책이 성공적으로 업데이트되었습니다!');
    console.log('🔄 변경사항이 적용되는데 몇 분 정도 소요될 수 있습니다.');
    
  } catch (error) {
    console.error('❌ IAM 정책 업데이트 실패:', error);
    
    if (error.name === 'NoSuchEntityException') {
      console.log('💡 해결 방법:');
      console.log('1. AWS 콘솔에서 Cognito Identity Pool의 역할 이름을 확인하세요');
      console.log('2. 스크립트의 ROLE_NAME을 올바른 역할 이름으로 수정하세요');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 해결 방법:');
      console.log('1. AWS CLI가 올바르게 구성되어 있는지 확인하세요');
      console.log('2. IAM 권한이 충분한지 확인하세요');
    }
  }
}

// 수동으로 AWS 콘솔에서 업데이트하는 방법 안내
function showManualInstructions() {
  console.log('\n🔧 수동으로 IAM 정책 업데이트하는 방법:');
  console.log('1. AWS 콘솔 → IAM → 역할');
  console.log('2. "AmazonDynamoDBCoginito" 또는 유사한 이름의 역할 찾기');
  console.log('3. 인라인 정책 추가/편집');
  console.log('4. 다음 정책 적용:');
  
  const policyPath = path.join(__dirname, 'legacy', 'dynamodb-iam-policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  console.log(JSON.stringify(policy, null, 2));
}

if (require.main === module) {
  console.log('🚀 IAM 정책 업데이트 시작...');
  updateIAMPolicy().then(() => {
    showManualInstructions();
  });
}

module.exports = { updateIAMPolicy };