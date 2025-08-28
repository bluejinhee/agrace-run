/**
 * DynamoDB Client configuration for Next.js
 * Requirements: 2.2, 4.1, 4.2
 */

'use client';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({ 
  region: 'ap-northeast-1'
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export { dynamoClient, docClient };
export default docClient;