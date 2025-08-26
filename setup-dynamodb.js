/**
 * DynamoDB Setup Script for Running Club Application
 * 
 * This script provides utilities to set up DynamoDB tables and verify configuration
 */

import { createAllTables, deleteAllTables } from './create-dynamodb-tables.js';
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

/**
 * Verify DynamoDB connection and list existing tables
 */
async function verifyConnection() {
    console.log("🔍 Verifying DynamoDB connection...\n");
    
    try {
        const command = new ListTablesCommand({});
        const response = await dynamoClient.send(command);
        
        console.log("✅ Successfully connected to DynamoDB!");
        console.log(`📊 Found ${response.TableNames.length} tables in the region:`);
        
        if (response.TableNames.length > 0) {
            response.TableNames.forEach(tableName => {
                const isRunningClubTable = tableName.startsWith('RunningClub-');
                const icon = isRunningClubTable ? '🏃' : '📋';
                console.log(`  ${icon} ${tableName}`);
            });
        } else {
            console.log("  (No tables found)");
        }
        
        // Check for our specific tables
        const requiredTables = ['RunningClub-Members', 'RunningClub-Records', 'RunningClub-Schedules'];
        const missingTables = requiredTables.filter(table => !response.TableNames.includes(table));
        
        if (missingTables.length === 0) {
            console.log("\n🎉 All required Running Club tables are present!");
        } else {
            console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
            console.log("Run 'node setup-dynamodb.js create' to create missing tables.");
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Failed to connect to DynamoDB:", error.message);
        
        if (error.name === 'UnrecognizedClientException') {
            console.log("\n💡 This might be due to:");
            console.log("  - Invalid AWS credentials");
            console.log("  - Incorrect AWS region configuration");
            console.log("  - Missing AWS SDK configuration");
        }
        
        return false;
    }
}

/**
 * Display setup instructions
 */
function displayInstructions() {
    console.log("🚀 DynamoDB Setup for Running Club Application\n");
    console.log("Available commands:");
    console.log("  node setup-dynamodb.js verify    - Verify DynamoDB connection and list tables");
    console.log("  node setup-dynamodb.js create    - Create all required DynamoDB tables");
    console.log("  node setup-dynamodb.js delete    - Delete all Running Club tables (use with caution!)");
    console.log("  node setup-dynamodb.js help      - Show this help message\n");
    
    console.log("📋 Prerequisites:");
    console.log("  1. AWS CLI configured with appropriate credentials");
    console.log("  2. IAM permissions for DynamoDB operations");
    console.log("  3. Node.js with AWS SDK v3 installed\n");
    
    console.log("🔧 IAM Policy:");
    console.log("  Apply the policy from 'dynamodb-iam-policy.json' to your AWS role/user\n");
    
    console.log("📁 Files created:");
    console.log("  - create-dynamodb-tables.js: Table creation script");
    console.log("  - dynamodb-iam-policy.json: Required IAM permissions");
    console.log("  - amplify_outputs.json: Updated with DynamoDB configuration");
}

/**
 * Main execution
 */
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'verify':
            await verifyConnection();
            break;
            
        case 'create':
            console.log("🏗️  Creating DynamoDB tables...\n");
            await createAllTables();
            console.log("\n🔍 Verifying created tables...");
            await verifyConnection();
            break;
            
        case 'delete':
            console.log("⚠️  WARNING: This will delete all Running Club tables!");
            console.log("This action cannot be undone.\n");
            
            // In a real scenario, you might want to add a confirmation prompt
            await deleteAllTables();
            break;
            
        case 'help':
        default:
            displayInstructions();
            break;
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error("❌ Setup failed:", error.message);
        process.exit(1);
    });
}

export { verifyConnection, displayInstructions };