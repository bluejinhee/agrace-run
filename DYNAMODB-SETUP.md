# DynamoDB Setup Guide

This guide explains how to set up DynamoDB tables for the Running Club application migration from S3 to DynamoDB.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js** (version 18 or higher)
3. **AWS IAM permissions** for DynamoDB operations

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Verify AWS Connection

```bash
npm run verify-dynamodb
```

This will check your AWS connection and list existing DynamoDB tables.

### 3. Create DynamoDB Tables

```bash
npm run create-tables
```

This creates three tables:
- `RunningClub-Members`: Stores member information
- `RunningClub-Records`: Stores running records with GSI for member queries
- `RunningClub-Schedules`: Stores schedule information with GSI for date queries

## Table Structure

### Members Table
- **Primary Key**: `id` (Number)
- **Attributes**: id, name, totalDistance, recordCount, joinDate, createdAt, updatedAt

### Records Table
- **Primary Key**: `id` (Number)
- **GSI**: `memberId-date-index` (memberId, originalDate)
- **Attributes**: id, memberId, distance, pace, date, time, originalDate, createdAt, updatedAt

### Schedules Table
- **Primary Key**: `id` (Number)
- **GSI**: `date-index` (date)
- **Attributes**: id, date, time, location, description, createdAt, updatedAt

## IAM Permissions

Apply the IAM policy from `dynamodb-iam-policy.json` to your AWS user or role. This policy includes:

- Read/Write access to all three tables
- Query access to Global Secondary Indexes
- Describe table permissions

### Applying IAM Policy

1. **Via AWS Console**:
   - Go to IAM → Policies → Create Policy
   - Copy content from `dynamodb-iam-policy.json`
   - Attach to your user/role

2. **Via AWS CLI**:
   ```bash
   aws iam create-policy --policy-name RunningClubDynamoDBPolicy --policy-document file://dynamodb-iam-policy.json
   aws iam attach-user-policy --user-name YOUR_USERNAME --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/RunningClubDynamoDBPolicy
   ```

## Configuration Files

### amplify_outputs.json
Updated to include DynamoDB configuration:
- Added `data` section with DynamoDB endpoint
- Configured table ARNs and GSI information
- Set authorization type to AWS_IAM

### Package Dependencies
- `@aws-sdk/client-dynamodb`: DynamoDB operations
- `@aws-sdk/client-s3`: S3 operations (for migration)
- `aws-amplify`: Amplify integration

## Available Scripts

```bash
# Verify DynamoDB connection and list tables
npm run verify-dynamodb

# Create all required tables
npm run create-tables

# Delete all Running Club tables (use with caution!)
npm run delete-tables

# General setup utility
npm run setup-dynamodb [verify|create|delete|help]
```

## Troubleshooting

### Connection Issues
- Verify AWS credentials: `aws sts get-caller-identity`
- Check region configuration (should be `ap-northeast-1`)
- Ensure IAM permissions are correctly applied

### Table Creation Failures
- Check for existing tables with same names
- Verify sufficient IAM permissions
- Check AWS service limits for DynamoDB

### Permission Errors
- Ensure the IAM policy is attached to your user/role
- Verify the policy includes all required actions
- Check resource ARNs match your AWS account

## Next Steps

After successful setup:

1. **Test Connection**: Run verification script to ensure tables are accessible
2. **Implement DynamoDBStorageManager**: Create the new storage manager class
3. **Data Migration**: Use MigrationService to move data from S3 to DynamoDB
4. **Update Frontend**: Modify application code to use DynamoDB instead of S3

## Files Created

- `create-dynamodb-tables.js`: Table creation script
- `setup-dynamodb.js`: Setup utility script
- `dynamodb-iam-policy.json`: Required IAM permissions
- `package.json`: Node.js dependencies and scripts
- `DYNAMODB-SETUP.md`: This setup guide

## Support

For issues or questions:
1. Check AWS CloudWatch logs for detailed error messages
2. Verify IAM permissions and AWS configuration
3. Review the troubleshooting section above