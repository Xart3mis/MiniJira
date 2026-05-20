import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Table names from environment
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'minijira-users',
  TEAMS: process.env.DYNAMODB_TEAMS_TABLE || 'minijira-teams',
  PROJECTS: process.env.DYNAMODB_PROJECTS_TABLE || 'minijira-projects',
  TASKS: process.env.DYNAMODB_TASKS_TABLE || 'minijira-tasks',
  COMMENTS: process.env.DYNAMODB_COMMENTS_TABLE || 'minijira-comments',
  ACTIVITY_LOG: process.env.DYNAMODB_ACTIVITY_LOG_TABLE || 'minijira-activity-log'
};

export const INDEXES = {
  TASKS_BY_TEAM: process.env.DYNAMODB_TASKS_TEAM_INDEX || 'teamId-index',
  TASKS_BY_ASSIGNEE: process.env.DYNAMODB_TASKS_ASSIGNEE_INDEX || 'assigneeId-index',
  PROJECTS_BY_TEAM: process.env.DYNAMODB_PROJECTS_TEAM_INDEX || 'teamId-index'
};

// Helper functions for common DynamoDB operations
export async function getItem(tableName, key) {
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    });
    const result = await docClient.send(command);
    return result.Item || null;
  } catch (error) {
    console.error(`Error getting item from ${tableName}:`, error);
    throw error;
  }
}

export async function putItem(tableName, item) {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });
    await docClient.send(command);
    return item;
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error);
    throw error;
  }
}

export async function updateItem(tableName, key, updates) {
  try {
    let UpdateExpression = 'SET ';
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};
    const attributes = [];

    Object.entries(updates).forEach(([attr, value], index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      ExpressionAttributeNames[nameKey] = attr;
      attributes.push(`${nameKey} = ${valueKey}`);
      ExpressionAttributeValues[`:val${index}`] = value;
    });

    UpdateExpression += attributes.join(', ');
    UpdateExpression += ', #updatedAt = :now';
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':now'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error(`Error updating item in ${tableName}:`, error);
    throw error;
  }
}

export async function deleteItem(tableName, key) {
  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key
    });
    await docClient.send(command);
  } catch (error) {
    console.error(`Error deleting item from ${tableName}:`, error);
    throw error;
  }
}

export async function query(tableName, params) {
  try {
    const command = new QueryCommand({
      TableName: tableName,
      ...params
    });
    const result = await docClient.send(command);
    return {
      items: result.Items || [],
      count: result.Count || 0,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

export async function scan(tableName, params = {}) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      ...params
    });
    const result = await docClient.send(command);
    return {
      items: result.Items || [],
      count: result.Count || 0,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  } catch (error) {
    console.error(`Error scanning ${tableName}:`, error);
    throw error;
  }
}

export default docClient;
