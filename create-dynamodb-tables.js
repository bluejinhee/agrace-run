/**
 * DynamoDB Table Creation Script for Running Club Application
 * 
 * This script creates the necessary DynamoDB tables for the running club application:
 * - Members: Stores member information
 * - Records: Stores running records with GSI for member queries
 * - Schedules: Stores schedule information with GSI for date queries
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
    CreateTableCommand, 
    DescribeTableCommand,
    waitUntilTableExists 
} from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ 
    region: "ap-northeast-1" 
});

// Table configurations
const tableConfigs = {
    members: {
        TableName: "RunningClub-Members",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH" // Partition key
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "N" // Number
            }
        ],
        BillingMode: "PAY_PER_REQUEST" // On-demand pricing
    },
    
    records: {
        TableName: "RunningClub-Records",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH" // Partition key
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "N" // Number
            },
            {
                AttributeName: "memberId",
                AttributeType: "N" // Number
            },
            {
                AttributeName: "originalDate",
                AttributeType: "S" // String (ISO date)
            }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "memberId-date-index",
                KeySchema: [
                    {
                        AttributeName: "memberId",
                        KeyType: "HASH" // Partition key
                    },
                    {
                        AttributeName: "originalDate",
                        KeyType: "RANGE" // Sort key
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                }
            }
        ],
        BillingMode: "PAY_PER_REQUEST"
    },
    
    schedules: {
        TableName: "RunningClub-Schedules",
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH" // Partition key
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "N" // Number
            },
            {
                AttributeName: "date",
                AttributeType: "S" // String (YYYY-MM-DD)
            }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "date-index",
                KeySchema: [
                    {
                        AttributeName: "date",
                        KeyType: "HASH" // Partition key
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                }
            }
        ],
        BillingMode: "PAY_PER_REQUEST"
    }
};

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
    try {
        await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
        return true;
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

/**
 * Create a single table
 */
async function createTable(config) {
    const { TableName } = config;
    
    try {
        console.log(`Creating table: ${TableName}...`);
        
        // Check if table already exists
        if (await tableExists(TableName)) {
            console.log(`Table ${TableName} already exists, skipping creation.`);
            return;
        }
        
        // Create the table
        const command = new CreateTableCommand(config);
        await dynamoClient.send(command);
        
        console.log(`Table ${TableName} creation initiated. Waiting for table to become active...`);
        
        // Wait for table to become active
        await waitUntilTableExists(
            { client: dynamoClient, maxWaitTime: 300 }, // 5 minutes max wait
            { TableName }
        );
        
        console.log(`✅ Table ${TableName} created successfully!`);
        
    } catch (error) {
        console.error(`❌ Error creating table ${TableName}:`, error.message);
        throw error;
    }
}

/**
 * Create all tables
 */
async function createAllTables() {
    console.log("🚀 Starting DynamoDB table creation process...\n");
    
    try {
        // Create tables sequentially to avoid throttling
        for (const [tableName, config] of Object.entries(tableConfigs)) {
            await createTable(config);
            console.log(); // Add spacing between table creations
        }
        
        console.log("🎉 All DynamoDB tables created successfully!");
        console.log("\nCreated tables:");
        console.log("- RunningClub-Members");
        console.log("- RunningClub-Records (with memberId-date-index GSI)");
        console.log("- RunningClub-Schedules (with date-index GSI)");
        
    } catch (error) {
        console.error("❌ Failed to create tables:", error.message);
        process.exit(1);
    }
}

/**
 * Delete all tables (for cleanup/testing)
 */
async function deleteAllTables() {
    const { DeleteTableCommand } = await import("@aws-sdk/client-dynamodb");
    
    console.log("🗑️  Starting table deletion process...\n");
    
    for (const config of Object.values(tableConfigs)) {
        const { TableName } = config;
        
        try {
            if (await tableExists(TableName)) {
                console.log(`Deleting table: ${TableName}...`);
                await dynamoClient.send(new DeleteTableCommand({ TableName }));
                console.log(`✅ Table ${TableName} deleted successfully!`);
            } else {
                console.log(`Table ${TableName} does not exist, skipping deletion.`);
            }
        } catch (error) {
            console.error(`❌ Error deleting table ${TableName}:`, error.message);
        }
    }
    
    console.log("\n🎉 Table deletion process completed!");
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    if (command === 'delete') {
        deleteAllTables();
    } else {
        createAllTables();
    }
}

export { createAllTables, deleteAllTables, tableConfigs };